import { escapeHtml } from "../promptStore.js";

export const SAMPLE_PROMPTS: string[] = [
  "A lighthouse losing an argument with fog",
  "Your own shoe, cross-hatched",
  "Rain racing down a train window",
];

const DOODLE_SVG = `<svg class="empty-doodle" viewBox="0 0 120 80" aria-hidden="true"><path d="M8 60 Q 30 20 55 45 T 112 38" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-dasharray="4 3"/><path d="M14 68 Q 40 52 70 62 T 110 58" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>`;

export function zeroDataEl(openForm: (sample: string) => void): HTMLElement {
  const el = document.createElement("section");
  el.className = "empty zero-empty";
  const chips = SAMPLE_PROMPTS.map(
    (s) => `<button type="button" class="chip" data-sample="${escapeHtml(s)}">${escapeHtml(s)}</button>`,
  ).join("");
  el.innerHTML = `${DOODLE_SVG}
    <h2>Blank sketchbook, blank mind</h2>
    <p>Drop in the first prompt and the deck does the rest.</p>
    <button type="button" class="btn btn-primary" data-act="open">Add your first prompt</button>
    <p class="empty-hint">or steal one of these:</p>
    <div class="chips">${chips}</div>`;
  el.querySelector('[data-act="open"]')?.addEventListener("click", () => openForm(""));
  el.querySelectorAll<HTMLButtonElement>(".chip").forEach((chip) =>
    chip.addEventListener("click", () => openForm(chip.dataset.sample ?? "")),
  );
  return el;
}

export function filteredEmptyEl(onClear: () => void): HTMLElement {
  const el = document.createElement("section");
  el.className = "empty filtered-empty";
  el.innerHTML = `<p>Nothing matches that mood.</p>
    <button type="button" class="btn btn-ghost" data-act="clear">Clear filters</button>`;
  el.querySelector('[data-act="clear"]')?.addEventListener("click", onClear);
  return el;
}

export function skeletonGrid(count = 3): HTMLElement {
  const el = document.createElement("div");
  el.className = "grid";
  for (let i = 0; i < count; i++) {
    const c = document.createElement("div");
    c.className = "card skeleton";
    el.append(c);
  }
  return el;
}
