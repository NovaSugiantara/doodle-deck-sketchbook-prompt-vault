import assert from "node:assert/strict";
import { test } from "node:test";
import { loadDeck, normalizePrompt, safeLocalStorage, saveDeck, STORAGE_KEY, type StorageLike } from "./storage.js";
import type { Prompt } from "./types.js";

const fakeStore = (initial: Record<string, string> = {}): StorageLike & { data: Map<string, string> } => {
  const data = new Map(Object.entries(initial));
  return { data, getItem: (k) => data.get(k) ?? null, setItem: (k, v) => { data.set(k, v); } };
};

const SAMPLE: Prompt[] = [{ id: "a1", text: "a lighthouse", difficulty: "easy", style: "ink", status: "untried", createdAt: 1 }];

test("save → load round-trip", () => {
  const store = fakeStore();
  assert.equal(saveDeck(store, SAMPLE), true);
  const res = loadDeck(store);
  assert.equal(res.error, null);
  assert.deepEqual(res.prompts, SAMPLE);
});

test("corrupt JSON → empty deck + error, no throw", () => {
  const res = loadDeck(fakeStore({ [STORAGE_KEY]: "{not json" }));
  assert.deepEqual(res.prompts, []);
  assert.notEqual(res.error, null);
});

test("non-array JSON → empty deck + error", () => {
  const res = loadDeck(fakeStore({ [STORAGE_KEY]: "42" }));
  assert.deepEqual(res.prompts, []);
  assert.notEqual(res.error, null);
});

test("malformed rows dropped, valid rows kept", () => {
  const res = loadDeck(fakeStore({ [STORAGE_KEY]: JSON.stringify([SAMPLE[0], { x: 1 }, null]) }));
  assert.equal(res.prompts.length, 1);
  assert.equal(res.prompts[0]?.id, "a1");
});

test("setItem throwing (quota) → saveDeck false, no throw", () => {
  const store: StorageLike = { getItem: () => null, setItem: () => { throw new Error("QuotaExceededError"); } };
  assert.equal(saveDeck(store, SAMPLE), false);
});

test("null store → session-only with reason", () => {
  assert.deepEqual(loadDeck(null).prompts, []);
  assert.notEqual(loadDeck(null).error, null);
  assert.equal(saveDeck(null, SAMPLE), false);
});

test("empty key → clean empty deck, no error", () => {
  const res = loadDeck(fakeStore());
  assert.deepEqual(res.prompts, []);
  assert.equal(res.error, null);
});

test("normalizePrompt guards", () => {
  assert.equal(normalizePrompt(null), null);
  assert.equal(normalizePrompt("nope"), null);
  assert.equal(normalizePrompt({ ...SAMPLE[0], text: "  " }), null);
  assert.equal(normalizePrompt({ ...SAMPLE[0], difficulty: "impossible" }), null);
  assert.equal(normalizePrompt({ ...SAMPLE[0], createdAt: "junk" })?.createdAt, 0);
});

test("safeLocalStorage absent in node (window undefined → null)", () => {
  assert.equal(safeLocalStorage(), null);
});
