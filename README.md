# Color Cloud Kingdom

A kids' color-learning and creativity website (toddlers through ~10), built from the
"Color Cloud Kingdom" design handoff. Two original mascots — **Merry** the pink bear and
**Biscuit** the beagle — guide five screens:

- **Home** — hero with the floating mascots and four section cards.
- **Learn & Spell** — pick a color, tap letters in order to spell its name; confetti on success.
- **Magic Mixing** — tap two paint blobs to discover the mixed color, with a recipes reference.
- **Coloring Pages** — Flower / House / Caterpillar; tap-to-fill SVG regions or free brush
  painting on a canvas overlay. Fills and brush layers persist per page.
- **Free Draw & Stickers** — brush (3 sizes), eraser, and six stampable stickers
  (stickers exist here only, never on coloring pages).

Merry and Biscuit also hide at the page edges of every non-Home screen — click them for a
surprise.

## Stack

React 18 + Vite + TypeScript. No backend: all artwork is inline SVG, and drawings/fills
persist to `localStorage` (per the handoff's production guidance).

## Develop

```sh
npm install
npm run dev       # dev server on http://localhost:5173
npm run build     # type-check + production build to dist/
```

## Structure

- `src/data/` — color palette, mixing table, coloring-page region paths
- `src/lib/` — canvas helpers (strokes, sticker stamping, restore) and localStorage wrappers
- `src/components/` — header, mascot SVGs, hidden-friend peekers
- `src/screens/` — one module per screen
- `src/styles.css` — design tokens (CSS variables), shared classes, keyframe animations

Feature toggles from the handoff (`showHiddenFriends`, `confettiCelebrations`,
`spellingUppercase`) live in `CONFIG` in `src/App.tsx`.
