# Gloamforge — implementation plan

> **Current status:** the original Canvas 2D/Vite game has been extended in place. Seeded dungeons, combat, run progression, separate permanent saves, the new control scheme, bounded Energy, and the five-room walkable preparation hub are implemented. The root standalone build was regenerated and passes a static self-containment check. Latest checks: `npm test` passed 17/17 and `npm run build` succeeded. A real browser `file://` launch has not yet been exercised in this environment; full art/content/controller scope remains unfinished.

## Product goal

Build an original single-player, top-down action roguelike with the full loop:

**Prepare in the hub → choose a class, upgrades, and weapon-ticket pick → enter seeded dungeon rooms → fight, loot, and shape a build → defeat the boss or fall → review the run → retain permanent rewards → prepare again.**

Preserve the useful working foundation and extend it incrementally. All names, characters/classes, art, environments, weapons, enemies, UI, VFX, audio, and music must remain original to Gloamforge; do not copy Soul Knight or another game.

## Technical direction and delivery

- **Confirmed platform:** JavaScript ES modules, Canvas 2D, and Vite for source development and the live preview.
- **Player-facing build:** the root `index.html` is generated as a single file with inline JavaScript, CSS, and favicon. It must continue to work without a server, network request, CDN, or external asset. `dev.html` is the Vite source entry; `npm run build` refreshes the root standalone file.
- The canvas has a 1440×810 backing buffer and 16:9 presentation; drawing uses a 480×270 world-coordinate grid with smoothing disabled and pixelated CSS scaling. Keep the image crisp and the gameplay view unobstructed.
- Keep systems data-driven and source modules focused; do not replace working combat, generation, rewards, or persistence merely to redesign their presentation.

## Standing interaction and balance requirements

- **Controls:** WASD/arrows move; mouse aims; left click or Space attacks; Shift dodges; Q uses the class skill; E interacts; 1/2 select weapon slots; Tab opens build/inventory; Esc pauses. Space advances/skips dialogue and must not attack while dialogue is active. Keep all player-facing instructions aligned with this scheme.
- Call playable units **classes** in player-facing UI. Each class should have a distinguishable visual identity, stats, passive, active skill, starter weapon, upgrade path, and hub behavior.
- Energy is real state: current/max, cost, regeneration, bounds, visible HUD, and atomic rejection of unaffordable skills with feedback.
- Keep Health, Armor, and Energy compact and legible; balance player health, armor, enemy damage, healing, and defensive effects together. Keep desktop touch controls hidden and HUD/minimap placement out of combat-safe space.
- Permanent progression must remain separate from transient run state. Describe prototype art/audio and unverified features honestly.

## Current status by system

### COMPLETE — implemented and covered by automated checks

- Seeded connected floor graphs with guaranteed boss routes, optional rooms, deterministic encounter composition, and a consistent minimap.
- Existing combat foundation: movement/collision, weapons, buffs, enemies and elite, telegraphs, multi-phase boss, chests, shops, shrines, XP/levels, floor progression, death/victory, and run summaries.
- Versioned permanent-save normalization/migration; run state is not serialized into permanent progress.
- Authoritative keyboard scheme and state-gated Space dialogue; HUD explicitly labels Health, Armor, and Energy.
- Class-specific bounded Energy costs/regeneration and rejection of unaffordable skills; both classes have distinct combat identities.
- Physical five-room hub: Lantern Hall, Class Hall and upgrades/hangout dialogue, Root Farm, Weapon Hall/practice station, Workshop, weapon tickets, three-choice ticket picks, and pre-run preparation.
- Root `index.html` generation bundles styles, favicon, and the game script after the canvas. A Node smoke test checks that the root file has one inline non-module script, no fetch call or local asset links, and the expected 16:9 canvas.
- Save, combat, generation, hub, control, Energy, render-flow, and standalone-contract tests. Latest result: 17 passing tests.

### PARTIAL — usable prototype, further work needed

- The 1440×810 backing buffer is a 3× drawing surface for the 480×270 game-coordinate grid. Integer-fit sizing is used when the viewport allows it; small viewport fitting may be fractional. Verify real-browser appearance and refine scaling only if it improves crispness without cropping or distortion.
- The standalone file is structurally self-contained and build-tested, but an actual double-click/file-URL browser launch still needs a manual smoke test.
- Weapon Hall test feedback currently reports an expected test impact; it is a compact practice interaction, not a full simulated combat range.
- Hub presentation, class upgrades, crop loop, ticket selection, and preparation work, but remain compact prototype implementations with only two playable classes and one biome.
- The main run loop, enemy variety, boss encounters, build choices, and meta-rewards are implemented, but content breadth and long-term progression are intentionally limited.
- Accessibility/readability options and broad mobile/controller parity are not complete.

### PLACEHOLDER — do not present as finished production content

- Characters, enemies, props, and effects are original code-drawn pixel clusters/procedural motion, not a finished authored sprite-sheet and frame-animation pipeline.
- Audio is synthesized with Web Audio; it is not a fully composed soundtrack or a complete authored SFX library.
- Weapon Hall practice reports calculated weapon impact rather than simulating a full test encounter.

### MISSING — deferred expansion

- More playable classes, biomes, authored room/enemy/boss families, deeper achievements/unlocks, and extended campaign content.
- Complete touch and controller support, plus further accessibility and input-device-aware prompts.
- Full authored animation, VFX, music, and sound production.

### BROKEN — known defects

- No currently known regression in the automated test suite. The standalone browser launch has not been verified in an actual browser, so treat it as **unverified** rather than claiming it is proven defect-free.

## Incremental priorities

1. Preserve current systems and passing checks; maintain this plan and `GAP_AUDIT.md` as an honest status record.
2. Verify the generated root file in a real browser via `file://` when a browser is available; keep the static no-external-request contract tested.
3. Use playtesting to improve scaling, combat readability, pixel-art silhouettes, animation/VFX/audio, UI hierarchy, and hub activity in small source-focused changes.
4. Add further gameplay content only after testing that it composes with seeded generation, combat, reward/economy flow, saves, and the preparation-to-results loop.

## Validation checklist

1. `npm test`, `npm run build`, and `git diff --check` pass.
2. The root `index.html` has inline game code/styles/favicon, places its game code after the canvas, and has no external or local asset dependency, module loader, or fetch request.
3. In a browser, confirm the menu loads from a direct file URL; then begin an expedition, move/aim/attack/dodge/use skills/switch weapons, interact with rooms, pause, and finish a run.
4. Space advances dialogue without firing; Energy consumption, regeneration, clamping, and insufficient-Energy rejection remain correct.
5. Confirm hub class upgrades, farm harvest/crafting, ticket selection/preparation, victory reward, run summary, and permanent-save behavior across a reload.
6. Keep the same seeded graph/encounter deterministic and ensure no generation dead ends or save-state leakage.
