import test from 'node:test';
import assert from 'node:assert/strict';
import { generateFloor, validateFloor } from '../src/dungeon.js';
import { makeEncounter } from '../src/encounters.js';

test('seeded dungeon generation is deterministic and always reaches its boss', () => {
  for (let seed = 1; seed <= 500; seed++) {
    const a = generateFloor(seed, 1);
    const b = generateFloor(seed, 1);
    assert.equal(validateFloor(a), true, `invalid graph at seed ${seed}`);
    assert.deepEqual(a.nodes.map(({ id, x, y, type }) => ({ id, x, y, type })), b.nodes.map(({ id, x, y, type }) => ({ id, x, y, type })));
    assert.ok(a.nodes.some((n) => n.type === 'boss'));
    assert.ok(a.nodes.some((n) => n.type === 'shop'));
    assert.ok(a.nodes.some((n) => n.type === 'treasure'));
  }
});

test('encounter rolls are deterministic for a seed and stay non-empty in combat rooms', () => {
  const floor = generateFloor(71, 2);
  const room = floor.nodes.find((n) => n.type === 'combat');
  assert.deepEqual(makeEncounter(room, 2, 71), makeEncounter(room, 2, 71));
  assert.ok(makeEncounter(room, 2, 71).flat().length >= 2);
});
