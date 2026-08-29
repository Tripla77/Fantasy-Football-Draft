import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { rankPlayers } from '../lib/scoring';
import { DEFAULT_SETTINGS } from '../lib/roster';
import {
  BUNDLED_PLAYERS,
  DataSourceKind,
  fetchLivePlayers,
} from '../lib/dataSource';
import { Player, RankedPlayer, Settings } from '../types';

const STORAGE_KEY = 'ffdraft:v1';
const PLAYERS_KEY = 'ffdraft:players:v1';
/** Auto-refresh the live dataset if the cache is older than this. */
const STALE_MS = 12 * 60 * 60 * 1000; // 12 hours

interface PersistedState {
  draftedIds: string[];
  myRosterIds: string[];
  settings: Settings;
}

interface PersistedPlayers {
  players: Player[];
  source: DataSourceKind;
  fetchedAt: number | null;
}

interface DraftState extends PersistedState {
  hydrated: boolean;
  players: Player[];
  dataSource: DataSourceKind;
  fetchedAt: number | null;
  dataLoading: boolean;
  dataError: string | null;

  draftPlayer: (id: string) => void;
  draftToMyTeam: (id: string) => void;
  undraftPlayer: (id: string) => void;
  updateSettings: (patch: Partial<Settings>) => void;
  resetDraft: () => void;
  hydrate: () => Promise<void>;
  /** Fetch the live dataset from Sleeper. Falls back gracefully on failure. */
  refreshData: (opts?: { silent?: boolean }) => Promise<void>;

  allRanked: () => RankedPlayer[];
  availableRanked: () => RankedPlayer[];
  myRoster: () => Player[];
}

function persist(state: PersistedState) {
  AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(pickDraft(state))).catch(() => {});
}

function persistPlayers(p: PersistedPlayers) {
  AsyncStorage.setItem(PLAYERS_KEY, JSON.stringify(p)).catch(() => {});
}

export const useDraftStore = create<DraftState>((set, get) => ({
  draftedIds: [],
  myRosterIds: [],
  settings: DEFAULT_SETTINGS,
  hydrated: false,
  players: BUNDLED_PLAYERS,
  dataSource: 'bundled',
  fetchedAt: null,
  dataLoading: false,
  dataError: null,

  draftPlayer: (id) =>
    set((s) => {
      if (s.draftedIds.includes(id)) return s;
      const next = { ...s, draftedIds: [...s.draftedIds, id] };
      persist(next);
      return next;
    }),

  draftToMyTeam: (id) =>
    set((s) => {
      const draftedIds = s.draftedIds.includes(id) ? s.draftedIds : [...s.draftedIds, id];
      const myRosterIds = s.myRosterIds.includes(id) ? s.myRosterIds : [...s.myRosterIds, id];
      const next = { ...s, draftedIds, myRosterIds };
      persist(next);
      return next;
    }),

  undraftPlayer: (id) =>
    set((s) => {
      const next = {
        ...s,
        draftedIds: s.draftedIds.filter((x) => x !== id),
        myRosterIds: s.myRosterIds.filter((x) => x !== id),
      };
      persist(next);
      return next;
    }),

  updateSettings: (patch) =>
    set((s) => {
      const next = { ...s, settings: { ...s.settings, ...patch } };
      persist(next);
      return next;
    }),

  resetDraft: () =>
    set((s) => {
      const next = { ...s, draftedIds: [], myRosterIds: [] };
      persist(next);
      return next;
    }),

  hydrate: async () => {
    // Draft state.
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<PersistedState>;
        set((s) => ({
          ...s,
          draftedIds: parsed.draftedIds ?? [],
          myRosterIds: parsed.myRosterIds ?? [],
          settings: { ...DEFAULT_SETTINGS, ...(parsed.settings ?? {}) },
        }));
      }
    } catch {
      // Ignore corrupt storage.
    }

    // Cached player dataset.
    let cachedAt: number | null = null;
    try {
      const rawPlayers = await AsyncStorage.getItem(PLAYERS_KEY);
      if (rawPlayers) {
        const parsed = JSON.parse(rawPlayers) as PersistedPlayers;
        if (parsed.players?.length) {
          cachedAt = parsed.fetchedAt ?? null;
          set((s) => ({
            ...s,
            players: parsed.players,
            dataSource: 'cache',
            fetchedAt: parsed.fetchedAt ?? null,
          }));
        }
      }
    } catch {
      // Ignore; keep bundled data.
    }

    set((s) => ({ ...s, hydrated: true }));

    // Auto-refresh from the live source if we've never fetched or the cache is stale.
    const stale = cachedAt == null || Date.now() - cachedAt > STALE_MS;
    if (stale) {
      get().refreshData({ silent: true });
    }
  },

  refreshData: async (opts) => {
    if (get().dataLoading) return;
    set((s) => ({ ...s, dataLoading: true, dataError: null }));
    try {
      const players = await fetchLivePlayers();
      const fetchedAt = Date.now();
      set((s) => {
        const ids = new Set(players.map((p) => p.id));
        // Reconcile draft state against the new id space (Sleeper ids differ
        // from bundled ids); drop references that no longer exist.
        return {
          ...s,
          players,
          dataSource: 'live',
          fetchedAt,
          dataLoading: false,
          dataError: null,
          draftedIds: s.draftedIds.filter((id) => ids.has(id)),
          myRosterIds: s.myRosterIds.filter((id) => ids.has(id)),
        };
      });
      persistPlayers({ players, source: 'live', fetchedAt });
      persist(get());
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Failed to load live data';
      set((s) => ({
        ...s,
        dataLoading: false,
        // Only surface the error on an explicit (non-silent) refresh.
        dataError: opts?.silent ? null : message,
      }));
    }
  },

  allRanked: () => rankPlayers(get().players, get().settings),

  availableRanked: () => {
    const drafted = new Set(get().draftedIds);
    return rankPlayers(get().players, get().settings).filter((p) => !drafted.has(p.id));
  },

  myRoster: () => {
    const ids = new Set(get().myRosterIds);
    return get().players.filter((p) => ids.has(p.id));
  },
}));

function pickDraft(s: PersistedState): PersistedState {
  return { draftedIds: s.draftedIds, myRosterIds: s.myRosterIds, settings: s.settings };
}
