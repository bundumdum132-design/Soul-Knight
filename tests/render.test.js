import test from 'node:test';
import assert from 'node:assert/strict';
import { Game } from '../src/game.js';
import { enterHubRoom } from '../src/hub.js';

function fakeContext() {
  const target = {
    createRadialGradient: () => ({ addColorStop() {} }),
    measureText: (value) => ({ width: String(value).length * 4 }),
  };
  return new Proxy(target, {
    get(object, key) {
      if (key in object) return object[key];
      return () => {};
    },
    set(object, key, value) { object[key] = value; return true; },
  });
}

test('menu, walkable hub preparation, and active-room render passes run without a browser-only crash', () => {
  globalThis.window = { innerWidth: 1440, innerHeight: 810, addEventListener() {}, removeEventListener() {} };
  globalThis.document = { addEventListener() {}, removeEventListener() {}, hidden: false };
  const canvas = { style: {}, getContext: () => fakeContext(), addEventListener() {}, removeEventListener() {}, focus() {} };
  const game = new Game(canvas);
  try {
    game.render();
    game.input.pointer.x = 60; game.input.pointer.y = 110; game.input.pointer.pressed = true;
    game.update(.016);
    assert.equal(game.screen, 'hub', 'main-menu expedition entry reaches the physical hall');
    assert.equal(game.hubRoom, 'sanctum');
    game.render();

    game.hubPlayer.x = 362; game.hubPlayer.y = 171;
    game.input.pointer.pressed = false; game.input.pressed.add('e');
    game.update(.016);
    assert.equal(game.hubOverlay, 'prep', 'the walkable expedition gate opens pre-run preparation');
    game.render();

    game.input.pressed.clear();
    game.input.pointer.x = 370; game.input.pointer.y = 215; game.input.pointer.pressed = true;
    game.update(.016);
    assert.equal(game.screen, 'run', 'preparation confirmation launches the first room');
    game.render();

    enterHubRoom(game, 'classes'); game.screen = 'hub'; game.hubPlayer.x = 147; game.hubPlayer.y = 126;
    game.render();
  } finally {
    game.sound.stop(); game.input.destroy();
    delete globalThis.window; delete globalThis.document;
  }
});
