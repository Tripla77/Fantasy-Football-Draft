import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Settings } from '../types';

// Public, build-time config. The anon key is safe to expose in the client —
// the database is only reachable through the two SECURITY DEFINER functions
// (see README "Cloud sync"), so there is no direct table access to abuse.
const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

/** Cloud sync is only available when the Supabase keys were set at build time. */
export const syncConfigured = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);

let client: SupabaseClient | null = null;
function getClient(): SupabaseClient | null {
  if (!syncConfigured) return null;
  if (!client) {
    client = createClient(SUPABASE_URL as string, SUPABASE_ANON_KEY as string, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }
  return client;
}

/** The team blob stored in the cloud (identical to the local persisted draft). */
export interface CloudPayload {
  draftedIds: string[];
  myRosterIds: string[];
  settings: Settings;
}

/** Upsert the team blob under a sync code. */
export async function cloudSave(code: string, data: CloudPayload): Promise<void> {
  const c = getClient();
  if (!c) return;
  const { error } = await c.rpc('put_draft_save', { p_code: code, p_data: data });
  if (error) throw new Error(error.message);
}

/** Fetch the team blob for a sync code, or null if no save exists for it. */
export async function cloudLoad(code: string): Promise<CloudPayload | null> {
  const c = getClient();
  if (!c) return null;
  const { data, error } = await c.rpc('get_draft_save', { p_code: code });
  if (error) throw new Error(error.message);
  return (data as CloudPayload | null) ?? null;
}

// Unambiguous alphabet (no I/O/0/1) for a short, human-copyable code.
const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const CODE_LEN = 12;

/** A random, unguessable sync code (canonical form: 12 chars, no separators). */
export function generateSyncCode(): string {
  let out = '';
  const g = globalThis as { crypto?: Crypto };
  if (g.crypto?.getRandomValues) {
    const bytes = new Uint8Array(CODE_LEN);
    g.crypto.getRandomValues(bytes);
    for (let i = 0; i < CODE_LEN; i++) out += ALPHABET[bytes[i] % ALPHABET.length];
  } else {
    for (let i = 0; i < CODE_LEN; i++) {
      out += ALPHABET[Math.floor(Math.random() * ALPHABET.length)];
    }
  }
  return out;
}

/** Strip separators / whitespace and upper-case a user-entered code. */
export function normalizeSyncCode(input: string): string {
  return input.trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
}

/** Group a canonical code into XXXX-XXXX-XXXX for display. */
export function formatSyncCode(code: string): string {
  return code.replace(/(.{4})(?=.)/g, '$1-');
}
