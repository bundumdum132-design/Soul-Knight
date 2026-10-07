# Gloamforge

An original, browser-playable top-down action roguelike. The current game keeps its seeded dungeon/combat foundation and adds a walkable preparation hub; it is an evolving prototype, not a content-complete commercial game.

## Play it

- **Standalone:** open the root `index.html` directly in a modern desktop browser. It is generated as a single self-contained file with embedded CSS, JavaScript, and favicon; it needs no server, network connection, CDN, or external asset.
- **Source development:** `npm install`, then `npm run dev` and open the Vite URL. `npm run build` rebuilds the production bundle and refreshes the standalone root page.
- **Checks:** `npm test` and `npm run build`.

The drawing buffer is 1440×810 (three times the 480×270 world coordinate grid) with a 16:9 aspect ratio, integer-fit sizing when the viewport permits, and nearest-neighbor rendering.

## Controls

- **WASD / arrow keys:** move
- **Mouse:** aim
- **Left click / Space:** attack
- **Shift:** dodge
- **Q:** class skill (costs Energy; Energy regenerates over time)
- **E:** interact
- **1 / 2:** select primary / secondary weapon
- **Tab:** build and inventory
- **Esc:** pause during an expedition; leave a hub overlay or return to the title from the hub
- **Space:** advance or skip dialogue (dialogue input is state-gated and cannot attack)

## Current playable systems

- Seeded connected dungeon floors, deterministic gameplay RNG, combat waves, treasure, shops, shrines, elites, minimap, a three-phase boss, XP/levels, buffs, weapon drops, run results, and local-save separation between permanent progress and run state.
- Two playable **classes** with distinct Health, Armor, Energy, passive, skill, starting weapon, speed, crit and visual treatment.
- Rebalanced compact Health and damage numbers; a real clamped Energy resource with class-specific skill costs, regeneration, insufficient-Energy feedback, and HUD display.
- Walkable Lantern Hall, Class Hall with per-class upgrade tracks and hangout dialogue, Root Farm with persistent crops, Weapon Hall with a practice dummy, and Mechanics Workshop with ticket crafting.
- Pre-run preparation, permanent weapon tickets, three-choice ticket selection, selectable class loadouts, archive, settings, build screen and expedition report.

## Still in progress

The game currently has two playable classes and one dungeon biome. The hub rooms and upgrade tracks are functional prototype implementations; class unlock breadth, additional biomes, full sprite-sheet animation, complete authored music/SFX, touch/gamepad parity, and deeper accessibility options remain future work. Characters, world, weapons, names, UI and audio are original to Gloamforge.
