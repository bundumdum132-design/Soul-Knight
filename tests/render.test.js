import test from 'node:test';
import assert from 'node:assert/strict';
import { Game } from '../src/game.js';

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

test('menu and active-room render passes run without a browser-only crash', () => {
  globalThis.window = { addEventListener() {}, removeEventListener() {} };
  globalThis.document = { addEventListener() {}, removeEventListener() {}, hidden: false };
  const canvas = { getContext: () => fakeContext(), addEventListener() {}, removeEventListener() {}, focus() {} };
  const game = new Game(canvas);
  try {
    game.render();
    game.input.pointer.x = 60; game.input.pointer.y = 110; game.input.pointer.pressed = true;
    game.update(.016);
    assert.equal(game.screen, 'select', 'main-menu start reaches character selection');
    game.input.pointer.pressed = false;
    game.input.pointer.x = 300; game.input.pointer.y = 230; game.input.pointer.pressed = true;
    game.update(.016);
    assert.equal(game.screen, 'run', 'character confirmation enters the first room');
    game.render();
  } finally {
    game.sound.stop(); game.input.destroy();
    delete globalThis.window; delete globalThis.document;
  }
});
