/**
 * In-process Tavus session store.
 *
 * This module is the single owner of the server-side Tavus session map.
 * All three API routes (start / stop / status) import from here so they
 * share the same Map instance within one Node.js process.
 *
 * Production note: In a multi-replica deployment this should be replaced with
 * a shared store (e.g. Supabase key-value or Redis). For a single-session
 * interview flow a single-process map is perfectly sufficient.
 */

export interface TavusSessionEntry {
  conversationId: string;
  conversationUrl: string;
}

// Module-level singleton — shared by all route handlers in this process.
export const tavusSessionStore = new Map<string, TavusSessionEntry>();
