# Gloamforge

An original, browser-playable top-down pixel-art roguelike prototype. The repository was greenfield; this build is the first complete gameplay slice, not a content-complete commercial game.

## Run it

```bash
npm install
npm run dev
```

Open the URL printed by Vite. Production build and checks:

```bash
npm test
npm run build
```

## Controls

- **WASD / arrow keys:** move and aim directionally
- **Mouse + left click** or **Z:** aim and attack
- **Shift:** dodge
- **E:** character skill
- **Q** or **1 / 2:** switch/select weapon slot
- **F:** interact with chests, weapons, shrines, shops, and the floor portal
- **Tab / M:** build and inventory
- **Esc:** pause

## Implemented in the first slice

- Animated main menu, character select, hub, settings, field guide, archive, pause, build screen, and run report.
- Two mechanically distinct heroes, five different weapon behaviors, five stackable buffs, five normal enemy roles, one elite, and a three-phase boss.
- Seeded connected room graph with combat, treasure, shop, shrine, elite, and boss rooms; minimap; combat waves; chest rewards; a shop; XP and level-up choices; coins; weapon swapping; skills; dodge; and three-floor escalation.
- Death/victory reports, permanent Memory Shards and heart-knot upgrades, unlock/discovery tracking, and a versioned local save that excludes temporary run state.
- Hand-authored pixel-like shapes, animated particles, combat telegraphs, generated Web Audio effects, and a lightweight synthesized musical motif. No third-party game art/audio is used.

The intended platform for this first build is desktop browser keyboard/mouse. Controller, touch controls, additional biomes, broader content targets, and full-length authored music remain future expansion work.
