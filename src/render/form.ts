import type { Difficulty, Style } from "../types.js";
import { DIFFICULTIES, STYLES } from "../types.js";

export interface AddPayload {
  text: string;
  difficulty: Difficulty;
  style: Style;
}

export type AddResponse = { ok: true; warn: string | null } | { ok: false; error: string };

const options = (values: readonly string[], selected: string): string =>
  values.map((v) => `<option value="${v}"${v === selected ? " selected" : ""}>${v}</option>`).join("");

export function formEl(onAdd: (payload: AddPayload) => AddResponse): HTMLFormElement {
  const form = document.createElement("form");
  form.id = "prompt-form";
  form.noValidate = true; // JS is the real gate; maxlength attr is the first fence
  form.innerHTML = `
    <h2 class="form-title">Add a prompt</h2>
    <label class="field-label" for="prompt-text">What should we draw?</label>
    <input id="prompt-text" name="text" type="text" maxlength="140" required autocomplete="off" placeholder="e.g. a lighthouse losing an argument with fog" aria-describedby="form-msg">
    <div class="form-row">
      <label class="field-label" for="prompt-difficulty">Difficulty</label>
      <select id="prompt-difficulty" name="difficulty">${options(DIFFICULTIES, "medium")}</select>
      <label class="field-label" for="prompt-style">Style</label>
      <select id="prompt-style" name="style">${options(STYLES, "pencil")}</select>
    </div>
    <p id="form-msg" role="alert" hidden></p>
    <button type="submit" class="btn btn-primary">Add to deck</button>`;

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const input = form.querySelector("#prompt-text") as HTMLInputElement;
    const text = input.value;
    const difficulty = (form.querySelector("#prompt-difficulty") as HTMLSelectElement).value as Difficulty;
    const style = (form.querySelector("#prompt-style") as HTMLSelectElement).value as Style;
    const msg = form.querySelector("#form-msg") as HTMLParagraphElement;
    const res = onAdd({ text, difficulty, style });
    if (!res.ok) {
      // Input deliberately not cleared — the user's text survives the error.
      input.setAttribute("aria-invalid", "true");
      msg.textContent = res.error;
      msg.hidden = false;
      return;
    }
    input.removeAttribute("aria-invalid");
    msg.hidden = true;
    if (res.warn) {
      msg.textContent = res.warn;
      msg.hidden = false;
    }
    form.reset();
    input.focus();
  });
  return form;
}
