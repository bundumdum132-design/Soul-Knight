import test from 'node:test';
import assert from 'node:assert/strict';
import { HEROES, WEAPONS, BUFFS } from '../src/content.js';

test('first playable content has mechanically differentiated heroes and weapons', () => {
  assert.notEqual(HEROES.sable.speed, HEROES.luma.speed);
  assert.notEqual(HEROES.sable.maxHp, HEROES.luma.maxHp);
  assert.notEqual(HEROES.sable.primary, HEROES.luma.primary);
  assert.equal(Object.keys(WEAPONS).length, 5);
  assert.equal(Object.keys(BUFFS).length, 5);
  assert.equal(new Set(Object.values(WEAPONS).map((w) => w.kind)).size, 5);
});
