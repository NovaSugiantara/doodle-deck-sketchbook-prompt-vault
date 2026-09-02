import type { Difficulty, Prompt, Status, Style } from "./types.js";
import { DIFFICULTIES, STYLES } from "./types.js";

export const MAX_TEXT = 140;
export const SOFT_CAP = 200;

const ESC: Record<string, string> = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };
export const escapeHtml = (text: string): string => text.replace(/[&<>"']/g, (c) => ESC[c] ?? c);

export type AddResult =
  | { ok: true; prompts: Prompt[]; prompt: Prompt; warn: string | null }
  | { ok: false; error: string };

export function addPrompt(prompts: Prompt[], text: string, difficulty: Difficulty, style: Style, id = crypto.randomUUID(), now = Date.now()): AddResult {
  const trimmed = text.trim();
  if (trimmed === "") return { ok: false, error: "Write something first — even three words counts." };
  if (trimmed.length > MAX_TEXT) return { ok: false, error: `Too long: ${trimmed.length} of ${MAX_TEXT} characters.` };
  if (!DIFFICULTIES.includes(difficulty) || !STYLES.includes(style)) return { ok: false, error: "Choose a valid difficulty and style." };
  const prompt: Prompt = { id, text: trimmed, difficulty, style, status: "untried", createdAt: now };
  const next = [...prompts, prompt];
  return { ok: true, prompts: next, prompt, warn: next.length > SOFT_CAP ? `${next.length} prompts is a lot — some old ones may deserve a clear-out.` : null };
}

export function deletePrompt(prompts: Prompt[], id: string): { prompts: Prompt[]; removed: Prompt | null; index: number } {
  const index = prompts.findIndex((p) => p.id === id);
  if (index === -1) return { prompts, removed: null, index };
  return { prompts: [...prompts.slice(0, index), ...prompts.slice(index + 1)], removed: prompts[index] ?? null, index };
}

export function restorePrompt(prompts: Prompt[], prompt: Prompt, index: number): Prompt[] {
  const next = [...prompts];
  next.splice(Math.max(0, Math.min(index, next.length)), 0, prompt);
  return next;
}

const NEXT: Record<Status, Status> = { untried: "in_progress", in_progress: "done", done: "untried" };
export const nextStatus = (status: Status): Status => NEXT[status];
export const cycleStatus = (prompts: Prompt[], id: string): Prompt[] =>
  prompts.map((p) => (p.id === id ? { ...p, status: NEXT[p.status] } : p));

export const filterPrompts = (prompts: Prompt[], difficulty: Difficulty | "all", style: Style | "all"): Prompt[] =>
  prompts.filter((p) => (difficulty === "all" || p.difficulty === difficulty) && (style === "all" || p.style === style));

export const untriedPool = (prompts: Prompt[]): Prompt[] => prompts.filter((p) => p.status === "untried");

export function pickSurprise(prompts: Prompt[]): Prompt | null {
  const pool = untriedPool(prompts);
  return pool[Math.floor(Math.random() * pool.length)] ?? null;
}

export const deckCounts = (prompts: Prompt[]): { total: number; untried: number } =>
  ({ total: prompts.length, untried: untriedPool(prompts).length });
