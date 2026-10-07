import test from 'node:test';
import assert from 'node:assert/strict';
import { Game } from '../src/game.js';

function createGame() {
  globalThis.window = { addEventListener() {}, removeEventListener() {} };
  globalThis.document = { addEventListener() {}, removeEventListener() {}, hidden: false };
  const canvas = { getContext: () => ({ imageSmoothingEnabled: true }), addEventListener() {}, removeEventListener() {}, focus() {} };
  return new Game(canvas);
}
function dummy(x, y) {
  return { id: 'target-dummy', kind: 'mosscrawler', role: 'chase', name: 'Training target', x, y, vx: 0, vy: 0, hp: 100, maxHp: 100, speed: 0, touch: 0, xp: 0, coins: 0, color: '#90aa73', radius: 8, attackTimer: 99, telegraph: 0, attackMode: '', targetX: x, targetY: y, flash: 0, burn: 0, burnDps: 0, burnTick: 0, slow: 0, stagger: 0, chargeTime: 0, shield: 0, phase: 0, alive: true, contactCd: 99 };
}

test('aimed ranged attacks apply burn, melee connects at close range, and burn expires', () => {
  const game = createGame();
  try {
    game.startNewRun('luma');
    game.currentRoom.enemies = [dummy(267, 180)];
    game.run.player.x = 240; game.run.player.y = 180; game.run.player.aim = { x: 1, y: 0 };
    game.run.player.attackCd = 0;
    game.tryAttack();
    game.updateProjectiles(.12);
    const rangedTarget = game.currentRoom.enemies[0];
    assert.ok(rangedTarget.hp < rangedTarget.maxHp, 'mouse/directional aim creates a damaging projectile');
    assert.ok(rangedTarget.burn > 0, 'the Fire weapon applies a damage-over-time status');
    for (let i = 0; i < 6 && rangedTarget.alive; i++) game.updateEnemies(.4);
    assert.ok(rangedTarget.burn <= 0, 'burn has an expiration rather than refreshing itself forever');

    game.startNewRun('sable');
    const meleeTarget = dummy(260, 180);
    game.currentRoom.enemies = [meleeTarget];
    game.run.player.x = 240; game.run.player.y = 180; game.run.player.aim = { x: 1, y: 0 };
    game.run.player.attackCd = 0;
    game.tryAttack();
    assert.ok(meleeTarget.hp < meleeTarget.maxHp, 'the close-range sweep deals damage in its facing arc');
    assert.equal(game.run.player.passiveCount, 1, 'Sable builds the passive only by landing a melee hit');
  } finally {
    game.sound.stop(); game.input.destroy();
    delete globalThis.window; delete globalThis.document;
  }
});
