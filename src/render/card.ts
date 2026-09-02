import type { Prompt, Status, Style } from "../types.js";
import { escapeHtml } from "../promptStore.js";

const STATUS_LABEL: Record<Status, string> = { untried: "Untried", in_progress: "In progress", done: "Done ✓" };

// Inline SVGs, consistent stroke weight — no emoji, no icon lib.
const STYLE_ICON: Record<Style, string> = {
  pencil: '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M2.5 13.5l.8-3.2 8-8 2.4 2.4-8 8-3.2.8z"/></svg>',
  ink: '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M8 1.5l4.5 4.5L6 13l-3.5 1L3.5 10z"/><path d="M9.5 3l3.5 3.5"/></svg>',
  watercolor: '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M8 2c2.8 3.6 4.5 5.6 4.5 7.7a4.5 4.5 0 11-9 0C3.5 7.6 5.2 5.6 8 2z"/></svg>',
  digital: '<svg viewBox="0 0 16 16" aria-hidden="true"><rect x="2" y="3" width="12" height="8" rx="1"/><path d="M6 13.5h4"/></svg>',
};

// Deterministic jitter: same id → same tilt every render, so cards never twitch.
// ponytail: hash is enough; swap for a seeded PRNG only if range matters.
function jitterDeg(id: string): string {
  let h = 5381;
  for (let i = 0; i < id.length; i++) h = ((h << 5) + h + id.charCodeAt(i)) | 0;
  return `${(((Math.abs(h) % 31) - 15) / 10).toFixed(1)}deg`;
}

export function cardEl(p: Prompt, actions: { onCycle: (id: string) => void; onDelete: (id: string) => void }): HTMLElement {
  const el = document.createElement("article");
  el.className = `card diff-${p.difficulty} status-${p.status}`;
  el.style.setProperty("--jitter", jitterDeg(p.id));
  el.tabIndex = 0;
  el.setAttribute("role", "button");
  el.setAttribute("aria-label", `${p.text}. Status: ${STATUS_LABEL[p.status]}. Press Enter or Space to cycle status.`);
  el.innerHTML = `
    <div class="card-tags">
      <span class="tag tag-style">${STYLE_ICON[p.style]}<span>${p.style}</span></span>
      <span class="tag tag-diff">${p.difficulty}</span>
      <span class="tag tag-status">${STATUS_LABEL[p.status]}</span>
    </div>
    <p class="card-text">${escapeHtml(p.text)}</p>
    <button type="button" class="card-delete" aria-label="Delete prompt: ${escapeHtml(p.text)}">✕</button>`;
  el.addEventListener("click", (e) => {
    if (!(e.target as HTMLElement).closest(".card-delete")) actions.onCycle(p.id);
  });
  el.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      actions.onCycle(p.id);
    }
  });
  el.querySelector(".card-delete")?.addEventListener("click", (e) => {
    e.stopPropagation(); // delete must never trigger a status cycle
    actions.onDelete(p.id);
  });
  return el;
}
