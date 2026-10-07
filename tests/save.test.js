import test from 'node:test';
import assert from 'node:assert/strict';
import { freshSave, loadSave, normalizeSave, persistSave, saveKeyForTests } from '../src/save.js';

class MemoryStorage {
  data = new Map();
  getItem(k) { return this.data.get(k) ?? null; }
  setItem(k, v) { this.data.set(k, String(v)); }
}

test('versioned meta save round-trips permanent data and never stores run state', () => {
  const storage = new MemoryStorage();
  const save = freshSave();
  save.memory = 27;
  save.stats.runs = 4;
  save.currentRun = { hp: 1, coins: 999 };
  assert.equal(persistSave(save, storage), true);
  const loaded = loadSave(storage);
  assert.equal(loaded.memory, 27);
  assert.equal(loaded.stats.runs, 4);
  assert.equal('currentRun' in loaded, false);
  assert.equal(storage.getItem(saveKeyForTests()) !== null, true);
});

test('legacy save migrates into class upgrades, ticket, loadout, and farm fields', () => {
  const migrated = normalizeSave({ version: 1, unlockedHeroes: ['sable', 'luma'], permanentHp: 4, lastHero: 'luma', memory: 19 });
  assert.deepEqual(migrated.unlockedClasses, ['vanguard', 'ranger']);
  assert.equal(migrated.lastClass, 'ranger');
  assert.equal(migrated.classUpgrades.vanguard.vitality, 2, 'old heart upgrades are bounded during migration');
  assert.equal(migrated.weaponTickets, 1);
  assert.deepEqual(migrated.farm.plots, [null, null, null]);
});

test('unsupported newer saves fall back safely; malformed saves normalize', () => {
  assert.equal(normalizeSave({ version: 99, memory: 100 }).memory, 0);
  const malformed = normalizeSave({ version: 1, memory: -4, settings: { master: 4, sfx: 'loud' } });
  assert.equal(malformed.memory, 0);
  assert.equal(malformed.settings.master, 1);
  assert.equal(malformed.settings.sfx, .72);
});
