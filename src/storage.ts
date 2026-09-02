import type { Prompt } from "./types.js";
import { DIFFICULTIES as DIFFS, STYLES, STATUSES } from "./types.js";

export const STORAGE_KEY = "doodle-deck:v1";

export interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

export interface LoadResult {
  prompts: Prompt[];
  /** Human-readable reason when saved data was unusable; null when all good. */
  error: string | null;
}

const isOneOf = <T extends string>(value: unknown, allowed: readonly T[]): value is T =>
  typeof value === "string" && (allowed as readonly string[]).includes(value);

export function normalizePrompt(raw: unknown): Prompt | null {
  if (typeof raw !== "object" || raw === null) return null;
  const r = raw as Record<string, unknown>;
  if (typeof r.id !== "string" || r.id === "" || typeof r.text !== "string" || r.text.trim() === "" || r.text.trim().length > 140) return null;
  if (!isOneOf(r.difficulty, DIFFS) || !isOneOf(r.style, STYLES) || !isOneOf(r.status, STATUSES)) return null;
  return { id: r.id, text: r.text.trim(), difficulty: r.difficulty, style: r.style, status: r.status, createdAt: typeof r.createdAt === "number" ? r.createdAt : 0 };
}

export function safeLocalStorage(): StorageLike | null {
  try {
    if (typeof window === "undefined") return null;
    const s = window.localStorage;
    const probe = `${STORAGE_KEY}::probe`;
    s.setItem(probe, "1");
    s.removeItem(probe);
    return s;
  } catch {
    return null;
  }
}

const CORRUPT = "Couldn't load saved prompts (data may be corrupted).";

export function loadDeck(store: StorageLike | null): LoadResult {
  if (!store) return { prompts: [], error: "Storage is blocked by your browser, so prompts last only this session." };
  let raw: string | null;
  try {
    raw = store.getItem(STORAGE_KEY);
  } catch {
    return { prompts: [], error: "Couldn't read saved prompts. Starting fresh this session." };
  }
  if (raw === null) return { prompts: [], error: null };
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return { prompts: [], error: CORRUPT };
    const prompts: Prompt[] = [];
    let skipped = false;
    for (const item of parsed) {
      const p = normalizePrompt(item);
      if (p) prompts.push(p);
      else skipped = true;
    }
    return { prompts, error: skipped ? "Some saved prompts couldn't be read." : null };
  } catch {
    return { prompts: [], error: CORRUPT };
  }
}

export function saveDeck(store: StorageLike | null, prompts: Prompt[]): boolean {
  if (!store) return false;
  try {
    store.setItem(STORAGE_KEY, JSON.stringify(prompts));
    return true;
  } catch {
    return false;
  }
}
