import assert from "node:assert/strict";
import { test } from "node:test";
import { addPrompt, cycleStatus, deckCounts, deletePrompt, escapeHtml, filterPrompts, MAX_TEXT, nextStatus, pickSurprise, restorePrompt, SOFT_CAP, untriedPool } from "./promptStore.js";
import type { Prompt } from "./types.js";

const p = (id: string, over: Partial<Prompt> = {}): Prompt =>
  ({ id, text: `prompt ${id}`, difficulty: "easy", style: "pencil", status: "untried", createdAt: 0, ...over });

test("add: rejects empty / whitespace-only", () => {
  assert.equal(addPrompt([], "", "easy", "pencil").ok, false);
  assert.equal(addPrompt([], "   \n\t ", "easy", "pencil").ok, false);
});

test("add: rejects text over 140 chars", () => {
  const res = addPrompt([], "x".repeat(MAX_TEXT + 1), "easy", "pencil");
  assert.equal(res.ok, false);
  if (!res.ok) assert.match(res.error, /140/);
});

test("add: trims text, defaults status untried", () => {
  const res = addPrompt([], "  a crooked house  ", "medium", "ink");
  assert.equal(res.ok, true);
  if (res.ok) {
    assert.equal(res.prompt.text, "a crooked house");
    assert.equal(res.prompt.status, "untried");
  }
});

test("add: original array untouched (immutability)", () => {
  const before = [p("1")];
  const res = addPrompt(before, "new", "easy", "pencil");
  assert.equal(before.length, 1);
  if (res.ok) assert.equal(res.prompts.length, 2);
});

test("add: soft-cap warning past 200, still accepted", () => {
  const full = Array.from({ length: SOFT_CAP }, (_, i) => p(`id${i}`));
  const res = addPrompt(full, "one more", "easy", "pencil");
  assert.equal(res.ok, true);
  if (res.ok) assert.notEqual(res.warn, null);
});

test("cycle: full loop untried → in_progress → done → untried", () => {
  assert.equal(nextStatus("untried"), "in_progress");
  assert.equal(nextStatus("in_progress"), "done");
  assert.equal(nextStatus("done"), "untried");
  const once = cycleStatus([p("1")], "1");
  assert.equal(once[0]?.status, "in_progress");
  assert.equal(cycleStatus(cycleStatus(once, "1"), "1")[0]?.status, "untried");
});

test("cycle: others untouched, original untouched, unknown id no-op", () => {
  const deck = [p("1"), p("2", { status: "done" })];
  assert.equal(cycleStatus(deck, "1")[1]?.status, "done");
  assert.equal(deck[1]?.status, "done");
  assert.deepEqual(cycleStatus(deck, "ghost"), deck);
});

test("delete: removes only the target, returns it with index", () => {
  const deck = [p("1"), p("2"), p("3")];
  const res = deletePrompt(deck, "2");
  assert.equal(res.removed?.id, "2");
  assert.equal(res.index, 1);
  assert.deepEqual(res.prompts.map((x) => x.id), ["1", "3"]);
  assert.equal(deck.length, 3);
});

test("delete: unknown id → nothing removed", () => {
  const deck = [p("1")];
  const res = deletePrompt(deck, "ghost");
  assert.equal(res.removed, null);
  assert.deepEqual(res.prompts, deck);
});

test("restore: reinserts at original index", () => {
  assert.deepEqual(restorePrompt([p("1"), p("3")], p("2"), 1).map((x) => x.id), ["1", "2", "3"]);
});

test("filter: combined difficulty AND style subset", () => {
  const deck = [p("1", { difficulty: "easy", style: "pencil" }), p("2", { difficulty: "easy", style: "ink" }), p("3", { difficulty: "hard", style: "pencil" })];
  assert.deepEqual(filterPrompts(deck, "easy", "pencil").map((x) => x.id), ["1"]);
  assert.deepEqual(filterPrompts(deck, "all", "pencil").map((x) => x.id), ["1", "3"]);
  assert.equal(filterPrompts(deck, "all", "all").length, 3);
});

test("surprise pool: only untried; empty → null; seeded pick", () => {
  const deck = [p("1", { status: "done" }), p("2", { status: "in_progress" }), p("3")];
  assert.deepEqual(untriedPool(deck).map((x) => x.id), ["3"]);
  assert.equal(pickSurprise([p("1", { status: "done" })]), null);
  assert.equal(pickSurprise([]), null);
  const orig = Math.random;
  Math.random = () => 0.5;
  try {
    assert.equal(pickSurprise([p("a"), p("b"), p("c")])?.id, "b");
  } finally {
    Math.random = orig;
  }
});

test("escapeHtml neutralizes injection", () => {
  assert.equal(escapeHtml('<img src=x onerror="y">'), "&lt;img src=x onerror=&quot;y&quot;&gt;");
  assert.equal(escapeHtml("a & b 'c'"), "a &amp; b &#39;c&#39;");
});

test("counts: total + untried", () => {
  assert.deepEqual(deckCounts([p("1"), p("2", { status: "done" })]), { total: 2, untried: 1 });
});
