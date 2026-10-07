import test from 'node:test';
import assert from 'node:assert/strict';
import { Game } from '../src/game.js';
import { directionBetween } from '../src/dungeon.js';

function createGame() {
  globalThis.window = { addEventListener() {}, removeEventListener() {} };
  globalThis.document = { addEventListener() {}, removeEventListener() {}, hidden: false };
  const canvas = {
    getContext: () => ({ imageSmoothingEnabled: true }),
    addEventListener() {}, removeEventListener() {}, focus() {},
    getBoundingClientRect: () => ({ left: 0, top: 0, width: 480, height: 270 }),
  };
  return new Game(canvas);
}

test('playable run connects combat, room-clear chest, level choice, and permanent results', () => {
  const game = createGame();
  try {
    game.startNewRun('sable');
    assert.equal(game.screen, 'run');
    assert.equal(game.currentNode.type, 'start');

    const nextId = game.map.linkMap[game.currentNode.id].find((id) => game.map.byId[id].type === 'combat');
    assert.ok(nextId, 'start room has a combat route');
    const direction = directionBetween(game.currentNode, game.map.byId[nextId]);
    assert.equal(game.traverse(direction), true);
    assert.equal(game.currentNode.type, 'combat');
    const blockedExit = Object.keys(game.currentRoom.doors).find((dir) => game.currentRoom.doors[dir] === false);
    assert.ok(blockedExit, 'combat entry locks its connected doors');
    assert.ok(game.currentRoom.enemies.length >= 2);

    let safety = 0;
    while (game.currentRoom.locked && safety++ < 5) {
      for (const enemy of game.currentRoom.enemies) if (enemy.alive) game.damageEnemy(enemy, 10000, { noCrit: true });
      game.updateRoomState(1);
    }
    assert.equal(game.currentNode.cleared, true);
    assert.ok(Object.values(game.currentRoom.doors).includes(true), 'clearing unlocks a route out');
    assert.ok(game.currentRoom.chest, 'a cleared combat room produces a reward chest');
    game.run.player.x = game.currentRoom.chest.x;
    game.run.player.y = game.currentRoom.chest.y;
    game.interact();
    game.updateRoomState(1);
    assert.equal(game.currentRoom.chest.open, true);
    assert.ok(game.currentRoom.drops.length > 0, 'chest reward is shown in the room before pickup');

    game.run.xp = game.run.xpNext - 1;
    game.gainXp(1);
    assert.equal(game.overlay, 'buff');
    game.chooseBuff(0);
    assert.equal(game.overlay, 'none');
    assert.ok(game.run.buffs.length > 0);

    game.run.player.invuln = 0;
    game.run.player.hp = 1;
    game.damagePlayer(40, null);
    game.updateRun(1);
    assert.equal(game.screen, 'results');
    assert.ok(game.save.memory > 0);
    assert.equal(game.endedRun.outcome, 'death');
  } finally {
    game.sound.stop();
    game.input.destroy();
    delete globalThis.window;
    delete globalThis.document;
  }
});
