import test from 'node:test';
import assert from 'node:assert/strict';
import { Game } from '../src/game.js';
import { enterHubRoom, updateHub } from '../src/hub.js';

function createGame() {
  globalThis.window = { innerWidth: 1440, innerHeight: 810, addEventListener() {}, removeEventListener() {} };
  globalThis.document = { addEventListener() {}, removeEventListener() {}, hidden: false };
  const canvas = { style: {}, getContext: () => ({ imageSmoothingEnabled: true }), addEventListener() {}, removeEventListener() {}, focus() {} };
  return new Game(canvas);
}

test('class-hall upgrades affect only the selected class and are applied to a new run', () => {
  const game = createGame();
  try {
    game.save.memory = 20;
    enterHubRoom(game, 'classes', [147, 126]);
    game.input.pressed.add('e'); updateHub(game, .016);
    assert.equal(game.hubOverlay, 'class');
    game.input.pressed.clear(); game.input.pointer.x = 82; game.input.pointer.y = 151; game.input.pointer.pressed = true;
    updateHub(game, .016);
    assert.equal(game.save.classUpgrades.vanguard.vitality, 1);
    assert.equal(game.save.classUpgrades.ranger.vitality, 0);
    assert.equal(game.save.memory, 10);
    game.startNewRun('vanguard');
    assert.equal(game.run.player.maxHp, 9);
  } finally {
    game.sound.stop(); game.input.destroy(); delete globalThis.window; delete globalThis.document;
  }
});

test('farm crops mature into ticket-crafting fiber; a ticket pick carries into the run', () => {
  const game = createGame();
  try {
    game.save.farm.seeds = 1;
    enterHubRoom(game, 'farm', [138, 150]);
    game.input.pressed.add('e'); updateHub(game, .016);
    assert.equal(game.save.farm.seeds, 0);
    assert.ok(game.save.farm.plots[0]);
    game.input.pressed.clear(); game.save.farm.plots[0].plantedAt = Date.now() - 20000;
    game.input.pressed.add('e'); updateHub(game, .016);
    assert.equal(game.save.farm.rootFiber, 1);
    assert.equal(game.save.farm.seeds, 1);
    assert.equal(game.save.farm.plots[0], null);

    game.save.weaponTickets = 1;
    enterHubRoom(game, 'workshop', [240, 124]);
    game.input.pressed.clear(); game.input.pressed.add('e'); updateHub(game, .016);
    assert.equal(game.hubOverlay, 'ticket');
    assert.equal(game.ticketChoices.length, 3);
    const chosen = game.ticketChoices[0];
    game.input.pressed.clear(); game.input.pointer.x = 100; game.input.pointer.y = 130; game.input.pointer.pressed = true;
    updateHub(game, .016);
    assert.equal(game.hubOverlay, 'prep');
    assert.equal(game.preparedWeapon, chosen);
    assert.equal(game.save.weaponTickets, 0);

    game.input.pointer.pressed = false; game.input.pointer.x = 370; game.input.pointer.y = 215; game.input.pointer.pressed = true;
    updateHub(game, .016);
    assert.equal(game.screen, 'run');
    assert.equal(game.run.weapons[1], chosen);
    assert.equal(game.save.preparedWeapon, null);
  } finally {
    game.sound.stop(); game.input.destroy(); delete globalThis.window; delete globalThis.document;
  }
});
