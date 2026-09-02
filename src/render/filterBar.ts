import type { Difficulty, Style } from "../types.js";
import { DIFFICULTIES, STYLES } from "../types.js";

export interface FilterBar {
  root: HTMLElement;
  update(matched: number, total: number, active: boolean): void;
  reset(): void;
}

const opts = (values: readonly string[]): string => values.map((v) => `<option value="${v}">${v}</option>`).join("");

export function filterBarEl(onDiff: (d: Difficulty | "all") => void, onStyle: (s: Style | "all") => void, onClear: () => void): FilterBar {
  const root = document.createElement("section");
  root.className = "filter-bar";
  root.setAttribute("aria-label", "Filter prompts");
  root.innerHTML = `
    <label class="field-label" for="filter-diff">Difficulty</label>
    <select id="filter-diff"><option value="all">all</option>${opts(DIFFICULTIES)}</select>
    <label class="field-label" for="filter-style">Style</label>
    <select id="filter-style"><option value="all">all</option>${opts(STYLES)}</select>
    <span id="filter-count" role="status"></span>
    <button type="button" id="clear-filters" class="btn btn-ghost" hidden>Clear filters</button>`;

  const diffSel = root.querySelector("#filter-diff") as HTMLSelectElement;
  const styleSel = root.querySelector("#filter-style") as HTMLSelectElement;
  const clearBtn = root.querySelector("#clear-filters") as HTMLButtonElement;
  const count = root.querySelector("#filter-count") as HTMLElement;
  diffSel.addEventListener("change", () => onDiff(diffSel.value as Difficulty | "all"));
  styleSel.addEventListener("change", () => onStyle(styleSel.value as Style | "all"));
  clearBtn.addEventListener("click", () => {
    diffSel.value = "all";
    styleSel.value = "all";
    onClear();
  });

  return {
    root,
    update(matched, total, active) {
      count.textContent = `${matched} of ${total} shown`;
      clearBtn.hidden = !active;
    },
    reset() {
      diffSel.value = "all";
      styleSel.value = "all";
    },
  };
}
