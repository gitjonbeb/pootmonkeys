# Pootmonkeys: Banana Blast

A short retro 2D browser platformer. A pootmonkey runs, jumps, collects bananas,
and uses timed poot blasts to cross gaps and stun jungle creatures, finishing at
a treehouse. One level, roughly two minutes, instant replay.

A Poppy Studios Production.

## Current status

**v0.1-graybox** — Phase 1 gray-box prototype. Rectangles and circles only.
Movement, jump (coyote time + jump buffering), poot boost with charge meter,
beans refueling, bananas and score, mud pit, poot-required gap, one patrolling
enemy with stun and bounce-defeat, finish door, count-up timer, keyboard and
touch controls, live tuning overlay.

Next gate: **Phase 2 feel tuning.** Jon plays, adjusts the overlay, sends back
values; they get baked into `src/tuning.js` as the new defaults. No art, full
level, or characters until movement and the poot feel good.

## How to run

**Easiest (this phase):** double-click `index.html`. The gray-box build loads no
asset files, so it runs straight from disk in Chrome, Edge, Firefox, and Safari.

**Proper local server** (required from Phase 3 when real assets arrive):

```
# from this folder, either:
python -m http.server 8000      # then open http://localhost:8000
npx serve                       # then open the printed URL
```

**iPad:** open the GitHub Pages link (see below) in Safari. Landscape only —
portrait shows a rotate prompt.

## Controls

| Action | Keyboard | Touch |
|---|---|---|
| Move | Left/Right or A/D | `<` `>` buttons (bottom-left) |
| Jump | Space, Up, or W | JUMP button (orange) |
| Poot | X or Shift | POOT button (green) |
| Pause | Enter | — (Phase 4) |
| Mute | M | — (Phase 4) |
| Restart level | R | — |
| Tuning overlay | Backtick (`) | add `?tune=1` to the URL |

## Tuning overlay

Toggle with backtick or by adding `?tune=1` to the URL. Sliders adjust gravity,
jump velocity, move speed, poot impulses, coyote time, jump buffer, mud slow %,
and max poot charges — live, no reload. **Reset** restores defaults. **Copy
values** puts the current numbers on the clipboard (or shows them in a text box
if the clipboard is blocked) — paste them into chat and they become the new
defaults in `src/tuning.js`. Disabled for the family release via the
`TUNE_ENABLED` flag in `src/tuning.js`.

## Project structure

```
index.html          page shell, rotate overlay, tuning overlay DOM
src/main.js         Phaser config, scene registration
src/tuning.js       every adjustable constant
src/audio.js        synthesized placeholder SFX (no audio before first input)
src/scenes/         Boot, Title, Select, Game, Finish
vendor/phaser.min.js  Phaser 3.90.0, vendored — runs with no network
assets/             sprites/tiles/audio/voices (populated in Phases 3-4)
dist/               standalone single-file build (Phase 5)
```

## Voice clips (Phase 4 mechanism, Phase 3+ recordings)

`assets/voices/manifest.json` will map events (`select`, `poot`, `golden`,
`victory`) per character to `.m4a`/`.mp3` files. Missing files are skipped
silently. Instructions land here when the mechanism ships in Phase 4.

## Deploying to GitHub Pages

Push to `main`; Pages serves the repo root. The vendored Phaser and relative
paths mean no build step. Full instructions land here at Phase 5.

## Git tags

`v0.1-graybox` → `v0.2-tuned` → `v0.3-skinned` → `v0.4-characters` → `v1.0-family`
