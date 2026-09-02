import type { Prompt } from "../types.js";
import { escapeHtml } from "../promptStore.js";

export function renderSpotlight(container: HTMLElement, prompt: Prompt | null, actions: { onDraw: (id: string) => void; onDismiss: () => void }): void {
  if (!prompt) {
    container.hidden = true;
    container.innerHTML = "";
    return;
  }
  container.hidden = false;
  container.innerHTML = `
    <div class="spotlight-card">
      <p class="spotlight-kicker">Tonight's pick</p>
      <p class="spotlight-text">${escapeHtml(prompt.text)}</p>
      <p class="spotlight-meta">${prompt.difficulty} · ${prompt.style} · untried</p>
      <div class="spotlight-actions">
        <button type="button" class="btn btn-primary" data-act="draw">Mark in progress</button>
        <button type="button" class="btn btn-ghost" data-act="dismiss">Put it back</button>
      </div>
    </div>`;
  container.querySelector('[data-act="draw"]')?.addEventListener("click", () => actions.onDraw(prompt.id));
  container.querySelector('[data-act="dismiss"]')?.addEventListener("click", () => actions.onDismiss());
}
