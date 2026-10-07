# Gloamforge gap audit

**Updated:** 2026-10-07. This audit reflects the source and generated root `index.html` after the standalone-build correction. Validation run: `npm run build` succeeded, `npm test` passed 17/17, and `git diff --check` passed. The standalone contract has a static smoke test; no real-browser `file://` launch has been performed here.

## COMPLETE — working systems to preserve

- **Seeded dungeon and encounters:** connected room graphs with a guaranteed boss route, optional branches, deterministic encounter composition, and a minimap.
- **Combat and progression foundation:** class movement/collision, weapon slots, buffs, enemy roles and elite, telegraphed attacks, three-phase boss, chests, shop, shrine, XP/level choices, floor progression, death/victory results, and run summaries.
- **Save boundary:** versioned, normalized permanent progress is persisted separately; transient run state is not serialized. Legacy data is migrated and malformed/newer saves are handled safely.
- **Controls and dialogue:** WASD/arrows move; mouse aims; left-click/Space attacks; Shift dodges; Q uses the class skill; E interacts; 1/2 select weapon slots; Tab opens build/inventory; Esc pauses. Dialogue consumes Space to advance/skip and cannot dispatch a run attack. The guide uses this scheme.
- **Class and Energy foundations:** playable units are called classes in player-facing content. Health/Armor/Energy are labeled; class skills spend bounded Energy, regenerate it over time, and reject unaffordable use without partial execution.
- **Walkable hub loop:** five physical rooms connect class choice and upgrades, hangout dialogue, farming, weapon inspection/practice, ticket crafting/selection, and expedition preparation. Hub upgrades and farm/ticket flow connect to the next run.
- **Standalone packaging contract:** `npm run build` generates a root single-file page with inline CSS, JavaScript after the canvas, and an embedded favicon. A static test checks the inline non-module script, 1440×810/16:9 canvas, absence of fetch/network APIs and non-data resource references, and script ordering.

## PARTIAL — usable, but not fully verified or broad enough

- **File-URL launch:** the generated file is structurally self-contained and has no expected network or external asset dependency. Actual double-click launch in a browser remains unverified; do not claim the browser smoke test has been completed.
- **Resolution/scaling:** 1440×810 backing buffer over a 480×270 drawing grid, smoothing disabled, pixelated CSS scaling, and a 16:9 aspect ratio. Integer-fit display sizing is used where the viewport permits; fitting into smaller windows can use a fractional scale. Validate appearance in a real browser and tune only if crispness/visibility improves.
- **Playable run loop:** the core preparation → seeded expedition → build/rewards → boss/death → results → persistent progress loop is connected. There are two classes and one biome, so campaign/content breadth remains small.
- **Hub activities:** the rooms, class-upgrade tracks, farming, tickets, dialogue, and preparation work as prototype systems; they are not deep simulation or a large social/management layer.
- **Weapon Hall:** the practice interaction reports calculated weapon impact. It is useful feedback, but not a full combat arena with simulated targets and threat patterns.
- **Art/UI/audio polish:** presentation is original and coherent, but remains an evolving prototype rather than finished production quality.

## MISSING — deferred scope, not current features

- Additional playable classes, biomes, room/enemy/boss families, and extended campaign/progression content.
- Complete controller and touch parity, input-device-aware prompts, and broader accessibility options.
- Full authored sprite sheets and frame animation, extensive layered VFX, and a composed music/authored sound library.
- Real-browser screenshot/performance automation and actual file-URL smoke coverage.

## BROKEN — confirmed defects

- No defect is currently confirmed by the automated tests. The earlier standalone failure—classic inline script running before the canvas—was fixed by injecting it immediately before `</body>`. The earlier Vite module-preload polyfill was disabled for the bundle. Static smoke coverage now checks ordering and no network requests.
- Because a browser-level `file://` launch has not been tested, remaining browser-specific issues are **unverified**, not assumed fixed or claimed absent.

## PLACEHOLDER — do not describe as production-finished

- Characters, foes, props, and weapons are hand-composed code-drawn pixel clusters with procedural motion, not a complete authored sprite-sheet pipeline.
- VFX are compact Canvas effects; there is no extensive frame-by-frame animation/VFX set.
- Audio is synthesized through Web Audio, not a fully composed original soundtrack or complete authored SFX collection.
- The Weapon Hall practice dummy reports expected impact instead of running a full target-combat simulation.

## Resolved findings from the initial audit

- The root page no longer points to `/src/main.js`; it is generated from the production bundle as a standalone file. `dev.html` remains the Vite source-development entry.
- The game script is placed after `<canvas id="game">`; Vite's module-preload polyfill is disabled for this output, and the build/test now reject network-dependent output.
- Legacy key-binding copy was removed from the guide and active game; only the authoritative control scheme listed above remains.
- Player Health and damage were brought onto a compact scale; actual Energy, regeneration, consumption, insufficiency feedback, clamping, and tests were added.
- The former illustrated hub became five navigable rooms connected to class upgrades, farming, weapon practice, workshop tickets, and run preparation.
- The previous 480×270-only canvas backing buffer became 1440×810 while retaining the 480×270 world grid for pixel drawing and nearest-neighbor rendering.

## Next audit checkpoints

1. Run the generated root file in a modern browser from `file://`, verify menu-to-expedition interaction, inspect the browser network panel for zero requests, and confirm local-save fallback behaves safely if file-origin storage is restricted.
2. Playtest the smaller-window scaling and gameplay visibility; keep the hub, HUD, minimap, and combat field legible without stretching or covering safe space.
3. Continue only in tested increments, preserving seeded generation, combat/rewards, save separation, and the current run loop. Update both this audit and `PLAN.md` when status changes.
