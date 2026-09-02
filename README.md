# Doodle Deck

Sketchbook prompt vault for hobbyist artists.

## Run

```sh
npm install
npm run build
python3 -m http.server 4173
```

Open `http://localhost:4173`. Run `npm test` for the zero-dependency Node test suite.

## Features

- Add, filter, cycle status, and delete prompts with a 5-second Undo.
- Surprise Me draws from the full untried deck, ignoring filters.
- localStorage persistence with corrupt-data and blocked-storage recovery.
- Loading skeleton, first-run empty, filtered-empty, and inline error states.

Stack: static HTML, Tailwind CDN, strict TypeScript. No framework or backend.
