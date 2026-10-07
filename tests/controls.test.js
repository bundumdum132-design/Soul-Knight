import test from 'node:test';
import assert from 'node:assert/strict';
import { Input } from '../src/input.js';
import { Game } from '../src/game.js';

function makeEnvironment() {
  const windowHandlers = new Map();
  globalThis.window = {
    innerWidth: 1440, innerHeight: 810,
    addEventListener: (name, fn) => windowHandlers.set(name, fn),
    removeEventListener() {},
  };
  globalThis.document = { addEventListener() {}, removeEventListener() {}, hidden: false };
  return windowHandlers;
}

test('Space normalizes to one stateful key for dialogue and gameplay input', () => {
  const handlers = makeEnvironment();
  const canvasHandlers = new Map();
  const canvas = {
    addEventListener: (name, fn) => canvasHandlers.set(name, fn),
    removeEventListener() {}, focus() {},
  };
  const input = new Input(canvas);
  try {
    let prevented = false;
    handlers.get('keydown')({ key: ' ', preventDefault() { prevented = true; } });
    assert.equal(prevented, true);
    assert.equal(input.isDown('space'), true);
    assert.equal(input.wasPressed('space'), true);
    handlers.get('keyup')({ key: ' ' });
    assert.equal(input.isDown('space'), false);
    assert.equal(input.wasReleased('space'), true);
  } finally {
    input.destroy(); delete globalThis.window; delete globalThis.document;
  }
});

test('Space advances hub dialogue without entering the run attack path', () => {
  makeEnvironment();
  const canvas = { style: {}, getContext: () => ({ imageSmoothingEnabled: true }), addEventListener() {}, removeEventListener() {}, focus() {} };
  const game = new Game(canvas);
  try {
    game.screen = 'hub';
    game.hubOverlay = 'dialogue';
    game.dialogueLines = [['Ranger', 'A line.'], ['Ranger', 'Another line.']];
    game.dialogueIndex = 0;
    let attackCalls = 0;
    game.tryAttack = () => { attackCalls++; };
    game.input.pressed.add('space');
    game.update(.016);
    assert.equal(game.dialogueIndex, 1);
    assert.equal(attackCalls, 0);
    assert.equal(game.hubOverlay, 'dialogue');
  } finally {
    game.sound.stop(); game.input.destroy(); delete globalThis.window; delete globalThis.document;
  }
});
