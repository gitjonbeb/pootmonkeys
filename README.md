# Pootmonkeys: Banana Blast

A short retro 2D browser platformer. A pootmonkey runs, jumps, collects bananas,
and uses timed poot blasts to cross gaps and stun jungle creatures, finishing at
a treehouse. One level, roughly two minutes, instant replay.

A Poppy Studios Production.

**Play it: https://gitjonbeb.github.io/pootmonkeys/** (works on desktop and iPad Safari)

## Current status

**v1.0-family — released.** Five playable grandkids (Mason, Emmy, Brooks,
Lilah, Ellie) with AI-voiced catchphrases, the full eight-section jungle level,
three checkpoints, coconut palms, bee swarm, snake, golden banana, ranks, and
per-device high scores. Feel values locked at Phase 2 sign-off; playtest
rounds 1-3 (grandkid-certified) folded in. The tuning overlay is disabled via
TUNE_ENABLED in src/tuning.js; flip it to true for balance work.

Post-1.0 parking lot lives in IDEAS.md (headline: the Grumpy Gorilla boss).
Real grandkid recordings can replace any AI clip file-by-file at any time —
see Voice clips below.

## The standalone file

dist/pootmonkeys-standalone.html is the whole game in one file — code, art,
and all twenty voice clips embedded. Text or email it to parents; it runs
offline from a double-click (or via iOS Files -> share -> open in Safari).
Rebuilt each release; the repo copy is the shipping artifact.

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

`assets/voices/manifest.json` maps events (`select`, `poot`, `golden`,
`victory`) per character to `.m4a`/`.mp3` files. Drop recordings into
`assets/voices/` using the names in the manifest (e.g. `mason_poot.m4a`),
push, and they play — no code changes. Missing files are skipped silently and
fall back to built-in browser speech (except `poot`, which stays sound-effect
only unless a real recording exists). The recording checklist is
`pootmonkeys-recording-list.md` in Jon's files.

## Deploying to GitHub Pages

Live at **https://gitjonbeb.github.io/pootmonkeys/** — Pages serves the repo
root from the `main` branch. Any push to `main` redeploys automatically in
about a minute. The vendored Phaser and relative paths mean no build step.

## Git tags

`v0.1-graybox` → `v0.2-tuned` → `v0.3-skinned` → `v0.4-characters` → `v1.0-family`
