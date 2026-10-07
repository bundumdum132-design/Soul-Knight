# Gloamforge — implementation plan

> **Status:** browser-first target confirmed. The initial vertical slice is implemented and tested; expanded campaign/content, controller/touch support, and full authored animation/music remain planned.

## Repository assessment

The repository began as a clean, greenfield checkout with only a short README and no engine, source code, assets, or tests. The project remains on the required Arena branch. The user selected the browser target before implementation began.

## Product goal

Build an original, playable, single-player top-down pixel-art roguelike around the complete short loop:

**Choose a hero → explore connected rooms → fight readable encounters → collect XP/coins/loot → choose a build upgrade → visit optional rewards/shop → defeat a boss → descend or die → see a run report → keep meta progress → start again.**

The first deliverable is a tested vertical slice, not a broad menu mockup or a pile of disconnected content. Content is data-driven so additional heroes, weapons, buffs, enemies, bosses, room types, and biomes can be added without rewriting core systems. Nothing will reuse another game's protected names, characters, maps, artwork, audio, or UI assets.

## Recommended technical direction

**Confirmed: browser-first, JavaScript ES modules + Canvas 2D + Vite.** The game uses a low-resolution pixel canvas with nearest-neighbor scaling, crisp CSS layout, hand-authored shapes/pixel clusters, and original Web Audio synthesis. This keeps the build runnable in Arena's live preview and avoids a framework layer while the first gameplay loop is being proven. (Godot 4 was offered as the alternative and was not selected.)

## Architecture principles

- **Explicit game states:** boot, menu, hero select, hub, run, room transition, level-up choice, shop/event, boss, run results, pause.
- **Separate data from behavior:** hero/weapon/enemy/buff/room definitions are content data; reusable combat and entity systems interpret them.
- **Separate temporary and permanent state:** `RunState` owns current-floor/map, HP, loadout, buffs, XP, coins, and run stats. `MetaSave` owns unlocks, permanent currency/upgrades, settings, records, and discoveries. Version saves and validate/migrate them on load.
- **Seeded procedural generation:** a run seed drives room graph, encounter composition, and rewards. Generation must always produce a connected start-to-boss path, reachable branches, valid spawn points, and sensible encounter budgets.
- **Composable combat:** a single damage pipeline handles weapon/skill bonuses, criticals, resistance, knockback, and status effects. Weapon behaviors differ mechanically (e.g. melee arc, aimed bolt, spread shot, returning projectile, heavy explosive), not just by damage values.
- **Readable feedback:** telegraphs precede dangerous attacks; hits, criticals, pickups, level-ups, room clears, boss phases, and interactions have distinct visual/audio responses.
- **Test at each milestone:** unit tests for seeded generation, damage/status rules, reward choices, and save boundaries; browser smoke tests for the end-to-end run flow.

## Current implementation status

### Implemented and tested

- Vite browser project, low-resolution canvas renderer, original animated title-screen presentation, character selection, hub, settings, field guide, archive, pause, build screen, and run report.
- Two distinct heroes, five behaviorally different weapons, five stackable buffs, five normal enemy roles, an elite, a three-phase boss, telegraphs, dodge, character skills, damage/status feedback, and seeded encounter composition.
- Connected seeded floor graph with guaranteed boss path plus treasure/shop/shrine branches; minimap; locked-room combat, XP, coins, level-up choices, chest opening/reveal, shop purchases, shrine choices, weapon swaps, portal/floor progression, death and victory result states.
- Versioned local meta save (settings, discoveries, statistics, Memory Shards, permanent heart-knot upgrades); temporary run state is not serialized.
- Original code-drawn pixel-like visuals, particles and synthesized Web Audio effects/music motifs. These are intentionally compact prototype assets, not a full sprite-sheet/audio production pipeline.
- Automated checks currently cover content differentiation, 500 seeded floor graphs, deterministic encounter composition, save isolation/version handling, combat-room/chest/level-up/death flow, and shop/boss/relic/next-floor flow.

### Partial or still planned

- Full six-to-twelve-frame hand-authored sprite sheets, extensive bespoke VFX/SFX/music production, all four biomes, larger target counts, more event/NPC/chest archetypes, deeper achievements/unlocks, controller/touch controls, accessibility options, and extended tutorial/training room.
- Browser rendering has been build-checked and exposed in the live preview; automated browser-level visual/performance testing is not yet in place.

## Incremental delivery plan

### Milestone 0 — confirm platform and establish the project

- Confirm browser-first versus Godot 4.
- Create the runnable project, basic test command, design/data folders, and a short controls/help screen.
- Establish fixed logical resolution, pixel scaling, scene/state lifecycle, and seeded random utility.
- **Exit check:** launches cleanly, renders correctly in the preview, and has a repeatable test/build command.

### Milestone 1 — movement and combat feel

- One original hero with responsive 8-direction movement, aiming, collision, dodge, health, and one active skill.
- One mechanically distinct starting weapon, projectiles/melee hit checks, damage feedback, and one telegraphed enemy.
- **Exit check:** movement/aim are responsive; attacks can hit, miss, and be avoided; walls and props block movement/projectiles as intended.

### Milestone 2 — room encounter loop

- Small authored test arena plus data-driven encounter rooms.
- Room doors lock on entry, a composition-based encounter starts, enemies have clear states/telegraphs, and a cleared room unlocks with a reward.
- Add XP orbs, coin pickups, basic object pooling, and the first enemy set.
- **Exit check:** a player can enter, fight, clear, collect, and leave repeatedly without a softlock.

### Milestone 3 — seeded dungeon and run build choices

- Generate a connected room graph with a guaranteed boss route and optional reward/shop branches; reveal visited rooms on a minimap.
- Add a second distinct hero, primary/secondary weapon swapping, the first five mechanically different weapons, and five stackable/synergistic buffs.
- XP milestones pause combat for a choice of three buffs. Loot uses weighted tables with basic duplicate/relevance protection.
- **Exit check:** the same seed reproduces the same graph; different seeds vary it; every generated graph has a valid route; weapon and buff choices visibly change combat.

### Milestone 4 — chest, shop, elite, and boss

- Animated interactable chest and reward reveal; simple shop inventory/prices/purchase feedback; one elite encounter.
- One original multi-pattern boss with readable windups, at least two escalating phases, a reward, victory transition, and an exit/portal.
- Add run currency, one healing/consumable path, and a clear economy loop.
- **Exit check:** chest → weapon/buff → shop → elite → boss reward all work in one run; boss can be defeated or the player can die fairly.

### Milestone 5 — complete first playable run and meta loop

- Hub/menu flow, character select, pause/settings, death and victory results, run summary, versioned local save, permanent rewards, and restart/new run.
- Summary tracks floor, rooms, enemies/bosses, damage, coins, items/buffs, duration, and outcome. Permanent rewards are calculated separately from temporary run state.
- **Exit check:** the requested first-playable loop works from launch through a boss win or death, results, persistence after reload, and a new run.

### Milestone 6 — art, feel, and robustness pass

- Replace any graybox visuals with a cohesive original pixel palette, distinct silhouettes, animated characters/enemies/chests/projectiles, room props, particles, and integrated UI states.
- Add original synthesized/recorded SFX hooks, volume settings, ambience/music hooks, restrained screen shake, and pickup/combat feedback.
- Tune difficulty, room budgets, healing/reward distribution, and keyboard/mouse controls; add reduced-motion/readability options if needed.
- **Exit check:** no required first-playable system is a nonfunctional placeholder; no generation dead ends or save-state leakage; performance stays stable during dense combat.

## First playable content target

Keep the first slice deliberately bounded to the prompt's minimum first-build target:

- **2 heroes**, each with a distinct passive, skill, base stats, and starting weapon.
- **5 weapons**, **5 buffs**, **5 normal enemies**, **1 elite**, **1 phase-based boss**, and **1 original biome**.
- Procedural connected rooms with combat, treasure/chest, shop, elite, and boss opportunities; minimap; XP/level-up; currency; weapon switching; death/victory; run summary; versioned save; and a return-to-hub/new-run loop.

The larger 4-biome, 20-weapon, 30-buff, event/collection/achievement, touch/controller, and extended campaign goals remain expansion work after the full core loop is stable. They are not claimed as part of the first slice.

## Validation checklist

1. Launch → main menu → start → choose either hero → enter a run.
2. Move, aim, attack, dodge, use skill, switch weapons, and collide with the environment.
3. Clear a locked encounter; gain XP and coins; collect a reward; level up and select one of three buffs.
4. Explore the minimap and a branch; open a chest; buy an affordable shop item; fight an elite.
5. Enter the boss arena, read and evade telegraphs, defeat the boss, and receive a reward; also verify the death path.
6. Reach run results, confirm temporary data is cleared while permanent rewards/stats persist after reload, and start another run.
7. Automated checks cover deterministic/reachable dungeon graphs, combat calculations, reward-choice validity, save versioning, and the complete critical UI/state path where feasible.

## Decisions still open

- **Target engine/platform:** browser-first Canvas 2D (recommended for immediate live preview) or Godot 4 (native-engine project).
- Minor content and balance details are intentionally deferred to implementation and can be tuned from playtests without blocking the architecture.
