import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import playersData from '../data/players.json';
import { rankPlayers } from '../lib/scoring';
import { DEFAULT_SETTINGS } from '../lib/roster';
import { Player, RankedPlayer, Settings } from '../types';

const PLAYERS = playersData as Player[];
const STORAGE_KEY = 'ffdraft:v1';

interface PersistedState {
  draftedIds: string[];
  myRosterIds: string[];
  settings: Settings;
}

interface DraftState extends PersistedState {
  hydrated: boolean;
  /** Mark a player drafted by any team (removes from board). */
  draftPlayer: (id: string) => void;
  /** Draft a player to MY team (also marks drafted). */
  draftToMyTeam: (id: string) => void;
  /** Undo a draft, whether by me or another team. */
  undraftPlayer: (id: string) => void;
  updateSettings: (patch: Partial<Settings>) => void;
  resetDraft: () => void;
  hydrate: () => Promise<void>;
  // Selectors (computed helpers)
  allRanked: () => RankedPlayer[];
  availableRanked: () => RankedPlayer[];
  myRoster: () => Player[];
}

function persist(state: PersistedState) {
  AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state)).catch(() => {
    // Storage failures are non-fatal; draft continues in memory.
  });
}

export const useDraftStore = create<DraftState>((set, get) => ({
  draftedIds: [],
  myRosterIds: [],
  settings: DEFAULT_SETTINGS,
  hydrated: false,

  draftPlayer: (id) =>
    set((s) => {
      if (s.draftedIds.includes(id)) return s;
      const next = { ...s, draftedIds: [...s.draftedIds, id] };
      persist(pick(next));
      return next;
    }),

  draftToMyTeam: (id) =>
    set((s) => {
      const draftedIds = s.draftedIds.includes(id) ? s.draftedIds : [...s.draftedIds, id];
      const myRosterIds = s.myRosterIds.includes(id) ? s.myRosterIds : [...s.myRosterIds, id];
      const next = { ...s, draftedIds, myRosterIds };
      persist(pick(next));
      return next;
    }),

  undraftPlayer: (id) =>
    set((s) => {
      const next = {
        ...s,
        draftedIds: s.draftedIds.filter((x) => x !== id),
        myRosterIds: s.myRosterIds.filter((x) => x !== id),
      };
      persist(pick(next));
      return next;
    }),

  updateSettings: (patch) =>
    set((s) => {
      const next = { ...s, settings: { ...s.settings, ...patch } };
      persist(pick(next));
      return next;
    }),

  resetDraft: () =>
    set((s) => {
      const next = { ...s, draftedIds: [], myRosterIds: [] };
      persist(pick(next));
      return next;
    }),

  hydrate: async () => {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<PersistedState>;
        set((s) => ({
          ...s,
          draftedIds: parsed.draftedIds ?? [],
          myRosterIds: parsed.myRosterIds ?? [],
          settings: { ...DEFAULT_SETTINGS, ...(parsed.settings ?? {}) },
          hydrated: true,
        }));
        return;
      }
    } catch {
      // Ignore corrupt storage; fall through to defaults.
    }
    set((s) => ({ ...s, hydrated: true }));
  },

  allRanked: () => rankPlayers(PLAYERS, get().settings),

  availableRanked: () => {
    const drafted = new Set(get().draftedIds);
    return rankPlayers(PLAYERS, get().settings).filter((p) => !drafted.has(p.id));
  },

  myRoster: () => {
    const ids = new Set(get().myRosterIds);
    return PLAYERS.filter((p) => ids.has(p.id));
  },
}));

function pick(s: DraftState): PersistedState {
  return { draftedIds: s.draftedIds, myRosterIds: s.myRosterIds, settings: s.settings };
}

export { PLAYERS };
