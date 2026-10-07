import test from 'node:test';
import assert from 'node:assert/strict';
import { Game } from '../src/game.js';
import { directionBetween, validateFloor } from '../src/dungeon.js';

function createGame() {
  globalThis.window = { addEventListener() {}, removeEventListener() {} };
  globalThis.document = { addEventListener() {}, removeEventListener() {}, hidden: false };
  const canvas = { getContext: () => ({ imageSmoothingEnabled: true }), addEventListener() {}, removeEventListener() {}, focus() {} };
  return new Game(canvas);
}
function pathTo(map, goalType) {
  const queue = [[map.startId]]; const seen = new Set([map.startId]);
  while (queue.length) {
    const path = queue.shift(); const tail = map.byId[path.at(-1)];
    if (tail.type === goalType) return path;
    for (const next of map.linkMap[tail.id]) if (!seen.has(next)) { seen.add(next); queue.push([...path, next]); }
  }
  return null;
}
function forceWalk(game, path) {
  for (const nextId of path.slice(1)) {
    game.currentNode.cleared = true;
    game.currentRoom.locked = false;
    game.updateDoorMap();
    const direction = directionBetween(game.currentNode, game.map.byId[nextId]);
    assert.equal(game.traverse(direction), true);
  }
}

test('shop, phase boss, relic chest, portal, and next-floor loop work together', () => {
  const game = createGame();
  try {
    game.startNewRun('ranger');
    const shopPath = pathTo(game.map, 'shop');
    assert.ok(shopPath);
    forceWalk(game, shopPath);
    assert.equal(game.currentNode.type, 'shop');
    assert.equal(game.overlay, 'shop');
    game.run.coins = 999;
    game.run.player.hp -= 20;
    const purchase = game.shopItems.findIndex((item) => !item.bought);
    game.buyShopItem(purchase);
    assert.equal(game.shopItems[purchase].bought, true);

    const bossPath = pathTo(game.map, 'boss');
    // Continue from the current branch by following the graph's shortest route to the boss.
    const queue = [[game.currentNode.id]]; const seen = new Set([game.currentNode.id]); let route = null;
    while (queue.length) {
      const p = queue.shift(); const tail = game.map.byId[p.at(-1)];
      if (tail.type === 'boss') { route = p; break; }
      for (const next of game.map.linkMap[tail.id]) if (!seen.has(next)) { seen.add(next); queue.push([...p, next]); }
    }
    assert.ok(bossPath && route);
    forceWalk(game, route);
    assert.equal(game.currentNode.type, 'boss');
    const boss = game.boss;
    assert.equal(boss.role, 'boss');
    boss.entrance = 0;
    boss.hp = boss.maxHp * .64;
    game.updateBoss(boss, 0);
    assert.equal(boss.bossPhase, 2);
    boss.hp = boss.maxHp * .25;
    game.updateBoss(boss, 0);
    assert.equal(boss.bossPhase, 3);

    game.damageEnemy(boss, 10000, { noCrit: true });
    game.updateRoomState(2);
    assert.equal(game.currentNode.cleared, true);
    assert.equal(game.currentRoom.chest.kind, 'boss');
    game.run.player.x = game.currentRoom.chest.x;
    game.run.player.y = game.currentRoom.chest.y;
    game.interact();
    game.updateRoomState(1);
    const relic = game.currentRoom.drops.find((d) => d.bossReward);
    assert.ok(relic);
    game.collectDrop(relic);
    assert.equal(game.currentRoom.portalReady, true);
    game.interact();
    assert.equal(game.run.floor, 2);
    assert.equal(game.currentNode.type, 'start');
    assert.equal(validateFloor(game.map), true);
  } finally {
    game.sound.stop(); game.input.destroy();
    delete globalThis.window; delete globalThis.document;
  }
});
