import test from 'node:test';
import assert from 'node:assert/strict';
import { Game } from '../src/game.js';
import { CLASSES, ENEMIES } from '../src/content.js';

function createGame() {
  globalThis.window = { innerWidth: 1440, innerHeight: 810, addEventListener() {}, removeEventListener() {} };
  globalThis.document = { addEventListener() {}, removeEventListener() {}, hidden: false };
  const canvas = { style: {}, getContext: () => ({ imageSmoothingEnabled: true }), addEventListener() {}, removeEventListener() {}, focus() {} };
  return new Game(canvas);
}

test('classes start with compact Health and a real bounded Energy resource', () => {
  const game = createGame();
  try {
    for (const classId of ['vanguard', 'ranger']) {
      game.startNewRun(classId);
      const player = game.run.player;
      assert.ok(player.maxHp <= 8, `${classId} should stay within the compact Health scale`);
      assert.equal(player.currentEnergy, player.maxEnergy);
      assert.ok(player.maxEnergy > 0);
      assert.ok(player.energyRegen > 0);
      assert.ok(player.skillCost > 0);
      assert.ok(player.currentEnergy >= 0 && player.currentEnergy <= player.maxEnergy);
    }
  } finally {
    game.sound.stop(); game.input.destroy(); delete globalThis.window; delete globalThis.document;
  }
});

test('skills reject insufficient Energy atomically, consume cost, then regenerate within bounds', () => {
  const game = createGame();
  try {
    game.startNewRun('vanguard');
    const player = game.run.player;
    const enemy = {
      id: 'energy-target', kind: 'mosscrawler', role: ENEMIES.mosscrawler.role, name: ENEMIES.mosscrawler.name,
      x: player.x + 24, y: player.y, vx: 0, vy: 0, hp: 9, maxHp: 9, speed: 0, touch: 0, xp: 0, coins: 0,
      color: '#90aa73', radius: 8, attackTimer: 99, telegraph: 0, attackMode: '', targetX: 0, targetY: 0,
      flash: 0, burn: 0, burnDps: 0, burnTick: 0, slow: 0, stagger: 0, chargeTime: 0, shield: 0,
      phase: 0, alive: true, contactCd: 99,
    };
    game.currentRoom.enemies = [enemy];
    player.currentEnergy = player.skillCost - 1;
    const energyBefore = player.currentEnergy;
    const hpBefore = enemy.hp;
    assert.equal(game.activateSkill(), false);
    assert.equal(player.currentEnergy, energyBefore, 'unaffordable skill leaves Energy unchanged');
    assert.equal(enemy.hp, hpBefore, 'unaffordable skill executes no partial effect');
    assert.equal(player.skillCd, 0, 'unaffordable skill does not start its cooldown');
    assert.ok(game.toast.includes('NOT ENOUGH ENERGY'));

    player.currentEnergy = player.skillCost;
    assert.equal(game.activateSkill(), true);
    assert.equal(player.currentEnergy, 0);
    assert.ok(enemy.hp < hpBefore, 'affordable skill executes');
    game.updateRun(.5);
    assert.ok(player.currentEnergy > 0, 'Energy regenerates during a run');
    player.currentEnergy = player.maxEnergy + 100;
    game.updateRun(.01);
    assert.equal(player.currentEnergy, player.maxEnergy, 'Energy clamps to its maximum');
    player.currentEnergy = -20;
    game.updateRun(.01);
    assert.ok(player.currentEnergy >= 0, 'Energy remains clamped at zero or above');
  } finally {
    game.sound.stop(); game.input.destroy(); delete globalThis.window; delete globalThis.document;
  }
});
