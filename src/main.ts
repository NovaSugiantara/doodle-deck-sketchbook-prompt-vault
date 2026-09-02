import type { Difficulty, Prompt, Style } from "./types.js";
import { addPrompt, cycleStatus, deckCounts, deletePrompt, filterPrompts, pickSurprise, restorePrompt } from "./promptStore.js";
import { loadDeck, safeLocalStorage, saveDeck } from "./storage.js";
import { cardEl } from "./render/card.js";
import { formEl } from "./render/form.js";
import { filterBarEl } from "./render/filterBar.js";
import { renderSpotlight } from "./render/spotlight.js";
import { filteredEmptyEl, skeletonGrid, zeroDataEl } from "./render/emptyStates.js";

const NOSTORAGE = "Storage is blocked by your browser, so prompts last only this session.";
const SAVE_FAIL = "Couldn't save — nothing was lost, try again.";

const state = {
  prompts: [] as Prompt[],
  diff: "all" as Difficulty | "all",
  style: "all" as Style | "all",
  spotlightId: null as string | null,
  storage: safeLocalStorage(),
};

const $ = (id: string): HTMLElement => {
  const el = document.getElementById(id);
  if (!el) throw new Error(`Missing element #${id}`);
  return el;
};
const showError = (msg: string): void => { $("banner").textContent = msg; $("banner").hidden = false; };
const clearError = (): void => { $("banner").hidden = true; };

// In-memory state moves only when storage accepted the write — a failed save
// can never leave UI and storage disagreeing, and form input stays intact.
function commit(next: Prompt[]): boolean {
  if (state.storage && !saveDeck(state.storage, next)) {
    showError(SAVE_FAIL);
    return false;
  }
  state.prompts = next;
  if (state.storage) clearError();
  else showError(NOSTORAGE);
  return true;
}

let undoTimer: ReturnType<typeof setTimeout> | null = null;
let undoTarget: { removed: Prompt; index: number } | null = null;
function hideToast(): void {
  if (undoTimer) clearTimeout(undoTimer);
  undoTimer = null;
  undoTarget = null;
  $("toast").hidden = true;
}
function showUndo(removed: Prompt, index: number): void {
  undoTarget = { removed, index };
  $("toast-msg").textContent = "Deleted from the deck.";
  $("toast").hidden = false;
  if (undoTimer) clearTimeout(undoTimer);
  undoTimer = setTimeout(hideToast, 5000); // 5s minimum undo window
}
function onUndo(): void {
  if (!undoTarget) return;
  const { removed, index } = undoTarget;
  const restored = restorePrompt(state.prompts, removed, index);
  hideToast();
  if (commit(restored)) renderAll();
}

function onDelete(id: string): void {
  const res = deletePrompt(state.prompts, id);
  if (!res.removed || !commit(res.prompts)) return;
  if (state.spotlightId === id) state.spotlightId = null;
  renderAll();
  showUndo(res.removed, res.index);
}
function onCycle(id: string): void {
  if (commit(cycleStatus(state.prompts, id))) renderAll();
}
function onSurprise(): void {
  const picked = pickSurprise(state.prompts);
  if (!picked) return; // button is disabled when the pool is dry; belt and braces
  state.spotlightId = picked.id;
  renderSpotlight($("spotlight"), picked, { onDraw, onDismiss });
  $("spotlight").scrollIntoView({ behavior: "smooth", block: "center" });
}
function onDraw(id: string): void {
  onCycle(id);
  onDismiss();
}
function onDismiss(): void {
  state.spotlightId = null;
  renderSpotlight($("spotlight"), null, { onDraw, onDismiss });
}
function handleAdd(payload: { text: string; difficulty: Difficulty; style: Style }) {
  const res = addPrompt(state.prompts, payload.text, payload.difficulty, payload.style);
  if (!res.ok) return { ok: false as const, error: res.error };
  if (!commit(res.prompts)) return { ok: false as const, error: SAVE_FAIL };
  renderAll();
  return { ok: true as const, warn: res.warn };
}
function clearFilters(): void {
  state.diff = "all";
  state.style = "all";
  filterBar.reset();
  renderAll();
}
function openWithSample(sample: string): void {
  $("add-form").hidden = false;
  ($("toggle-form") as HTMLButtonElement).setAttribute("aria-expanded", "true");
  const input = form.querySelector("#prompt-text") as HTMLInputElement;
  if (sample) input.value = sample;
  input.focus();
}

function renderAll(): void {
  const { total, untried } = deckCounts(state.prompts);
  $("counts").textContent = `${total} prompt${total === 1 ? "" : "s"} · ${untried} untried`;
  // Surprise Me: disabled (not hidden) with a reason when the untried pool is dry.
  const poolDry = untried === 0;
  ($("surprise-btn") as HTMLButtonElement).disabled = poolDry;
  const caption = $("surprise-caption");
  caption.hidden = !poolDry;
  caption.textContent = total === 0
    ? "No prompts yet — add one first, then let chance decide."
    : "Nothing untried left. Cycle a card back to untried, or add a new one.";
  const spotlighted = state.spotlightId ? state.prompts.find((p) => p.id === state.spotlightId) ?? null : null;
  renderSpotlight($("spotlight"), spotlighted, { onDraw, onDismiss });
  renderGrid(total);
}

function renderGrid(total: number): void {
  const grid = $("grid");
  const filtered = filterPrompts(state.prompts, state.diff, state.style);
  filterBar.update(filtered.length, total, state.diff !== "all" || state.style !== "all");
  grid.innerHTML = "";
  if (state.prompts.length === 0) {
    grid.append(zeroDataEl(openWithSample));
    return;
  }
  if (filtered.length === 0) {
    grid.append(filteredEmptyEl(clearFilters));
    return;
  }
  const frag = document.createDocumentFragment();
  for (const p of filtered) frag.append(cardEl(p, { onCycle, onDelete }));
  grid.append(frag);
}

const form = formEl(handleAdd);
$("add-form").append(form);
const filterBar = filterBarEl(
  (d) => { state.diff = d; renderAll(); },
  (s) => { state.style = s; renderAll(); },
  clearFilters,
);
$("filters").append(filterBar.root);

function boot(): void {
  $("grid").append(skeletonGrid()); // skeleton first paint, replaced when storage answers
  requestAnimationFrame(() => {
    const res = loadDeck(state.storage);
    state.prompts = res.prompts;
    if (res.error) showError(res.error);
    renderAll();
  });
  $("toggle-form").addEventListener("click", () => {
    const drawer = $("add-form");
    drawer.hidden = !drawer.hidden;
    ($("toggle-form") as HTMLButtonElement).setAttribute("aria-expanded", String(!drawer.hidden));
    if (!drawer.hidden) (form.querySelector("#prompt-text") as HTMLInputElement).focus();
  });
  $("surprise-btn").addEventListener("click", onSurprise);
  $("toast-undo").addEventListener("click", onUndo);
}

boot();
