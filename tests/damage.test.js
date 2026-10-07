import test from 'node:test';
import assert from 'node:assert/strict';
import { CLASSES, WEAPONS, BUFFS } from '../src/content.js';

test('first playable content has mechanically differentiated classes and weapons', () => {
  assert.notEqual(CLASSES.vanguard.speed, CLASSES.ranger.speed);
  assert.notEqual(CLASSES.vanguard.maxHp, CLASSES.ranger.maxHp);
  assert.notEqual(CLASSES.vanguard.primary, CLASSES.ranger.primary);
  assert.equal(Object.keys(WEAPONS).length, 5);
  assert.equal(Object.keys(BUFFS).length, 5);
  assert.equal(new Set(Object.values(WEAPONS).map((w) => w.kind)).size, 5);
});
