# AGENTS.md — Doodle Deck build guide

Read `PRD.md`, `SRS.md`, `DESIGN.md` first. This file is execution discipline for whichever agent implements the build.

## Hard constraints (violating these caps the score regardless of polish)

- Raw source ≤ 40KB total (target 25–35KB). Check with `du -sh` on source files (excl. markdown/images) before every commit.
- HTML + Tailwind + TypeScript only. No framework, no unnecessary npm deps.
- Business logic must be split across multiple small files — no single file holding storage + rendering + event wiring + validation.
- A test file must exist and actually run (pure-logic tests, no DOM required).
- Every view must implement **loading, data, empty, and error** states — not just the happy path. See SRS §3 FR-7 and PRD §6 table. This is graded directly from code, not screenshots.

## File plan (keep it exactly this small)

```
index.html
src/types.ts
src/storage.ts        # localStorage read/write/migrate, all try/catch lives here
src/promptStore.ts     # pure functions: add/delete/cycleStatus/filter/pickSurprise
src/render/card.ts
src/render/form.ts
src/render/filterBar.ts
src/render/spotlight.ts
src/render/emptyStates.ts
src/main.ts             # DOM wiring only — imports store + render, no business logic here
src/promptStore.test.ts
src/storage.test.ts
styles.css (or tailwind config, whichever is smaller)
```

## Build order (do not skip steps for speed)

1. `types.ts` + `storage.ts` with try/catch on both read and write, corrupt-JSON fallback to `[]`.
2. `promptStore.ts` pure functions — write these test-first, they have zero DOM dependency.
3. `promptStore.test.ts` / `storage.test.ts` — run before touching any UI.
4. `render/*.ts` — one component per file, each takes data + callbacks, returns/mutates DOM, no direct localStorage access (must go through the store).
5. `main.ts` wires it together: on mutation → store fn → storage.save() → re-render affected region only (avoid full-page re-render if easy, but don't over-engineer).
6. Wire loading skeleton on boot (even if load is synchronous, keep the state defined so a slow-storage path degrades gracefully).
7. Wire all four empty-state variants (zero data / filtered-empty / surprise-pool-empty) as distinct components per DESIGN.md §5 — do not collapse them into one generic "nothing here" message.
8. Wire error banner tied to the failing action, not a global toast.
9. Pass to responsive check at the four breakpoints in DESIGN.md §7.
10. Final size check + trim (inline the minimum Tailwind utilities used if using CDN adds too much weight; consider a hand-rolled minimal CSS subset if budget is tight).

## Non-negotiable behaviors (agent must self-check before declaring done)

- [ ] App loads with 0 prompts → shows zero-data empty state, not a blank grid.
- [ ] Filters active + 0 matches → shows filtered-empty state, distinct from zero-data.
- [ ] All prompts done/in-progress (0 untried) → Surprise Me disables with explanation, doesn't throw/no-op silently.
- [ ] localStorage throws on write (simulate via quota or blocked storage) → user sees an inline error, input isn't lost.
- [ ] Corrupt localStorage value on load → app boots to empty deck + dismissible notice, no crash, no blank white screen.
- [ ] Delete click never triggers status-cycle (event propagation stopped).
- [ ] Status + difficulty + style are each conveyed with text, not color alone.
- [ ] Keyboard-only pass: tab to add-form, tab to filters, tab to Surprise Me, tab into a card and press Enter to cycle status.
- [ ] Refresh page mid-session → deck state identical to before refresh.
- [ ] Total raw source size logged in the final commit message.

## Code style

- TypeScript strict mode on.
- No `any`. Narrow types for Difficulty/Style/Status everywhere (see SRS §2).
- Small functions, one responsibility each — this is what makes the size-budget survivable: no framework overhead means discipline replaces it.
- Comments explain _why_ (e.g. why filters are ignored in Surprise Me pool per SRS FR-4 decision), not _what_.

## Commit hygiene

- Commit size itself is scored — do not batch the entire app into one commit. Suggested sequence: (1) types+storage+tests, (2) store+tests, (3) render components, (4) main wiring + states, (5) design pass/tokens, (6) responsive + a11y pass.
