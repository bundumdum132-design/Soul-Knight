const SAVE_KEY = 'gloamforge-save';
export const SAVE_VERSION = 1;

export function freshSave() {
  return {
    version: SAVE_VERSION,
    memory: 0,
    unlockedHeroes: ['sable', 'luma'],
    permanentHp: 0,
    settings: { master: 0.6, sfx: 0.72, music: 0.35, shake: true },
    stats: { runs: 0, wins: 0, deaths: 0, rooms: 0, enemies: 0, bosses: 0, bestFloor: 0, totalCoins: 0, playSeconds: 0 },
    discoveries: { weapons: [], enemies: [], buffs: [], bosses: [] },
    achievements: [],
    lastRun: null,
  };
}

export function normalizeSave(raw) {
  const base = freshSave();
  if (!raw || typeof raw !== 'object') return base;
  const incomingVersion = Number(raw.version) || 0;
  if (incomingVersion > SAVE_VERSION) return base;
  const safeStats = {};
  for (const key of Object.keys(base.stats)) safeStats[key] = Number.isFinite(Number(raw.stats?.[key])) ? Number(raw.stats[key]) : base.stats[key];
  const safeDiscoveries = {};
  for (const key of Object.keys(base.discoveries)) safeDiscoveries[key] = Array.isArray(raw.discoveries?.[key]) ? [...new Set(raw.discoveries[key].filter((v) => typeof v === 'string'))] : [];
  const lastRun = raw.lastRun && typeof raw.lastRun === 'object' ? {
    outcome: String(raw.lastRun.outcome || ''), floor: Math.max(0, Number(raw.lastRun.floor) || 0),
    kills: Math.max(0, Number(raw.lastRun.kills) || 0), rooms: Math.max(0, Number(raw.lastRun.rooms) || 0),
    time: String(raw.lastRun.time || ''),
  } : null;
  return {
    version: SAVE_VERSION,
    memory: Math.max(0, Number(raw.memory) || 0),
    unlockedHeroes: Array.isArray(raw.unlockedHeroes) ? [...new Set(['sable', 'luma', ...raw.unlockedHeroes.filter((id) => typeof id === 'string')])] : base.unlockedHeroes,
    permanentHp: Math.max(0, Math.min(5, Number(raw.permanentHp) || 0)),
    settings: {
      master: Number.isFinite(Number(raw.settings?.master)) ? Math.max(0, Math.min(1, Number(raw.settings.master))) : base.settings.master,
      sfx: Number.isFinite(Number(raw.settings?.sfx)) ? Math.max(0, Math.min(1, Number(raw.settings.sfx))) : base.settings.sfx,
      music: Number.isFinite(Number(raw.settings?.music)) ? Math.max(0, Math.min(1, Number(raw.settings.music))) : base.settings.music,
      shake: raw.settings?.shake !== false,
    },
    stats: safeStats,
    discoveries: safeDiscoveries,
    achievements: Array.isArray(raw.achievements) ? [...new Set(raw.achievements.filter((v) => typeof v === 'string'))] : [],
    lastRun,
  };
}

export function loadSave(storage = globalThis.localStorage) {
  try {
    const raw = storage?.getItem(SAVE_KEY);
    return normalizeSave(raw ? JSON.parse(raw) : null);
  } catch {
    return freshSave();
  }
}

export function persistSave(save, storage = globalThis.localStorage) {
  try {
    const clean = normalizeSave(save);
    storage?.setItem(SAVE_KEY, JSON.stringify(clean));
    return true;
  } catch {
    return false;
  }
}

export function saveKeyForTests() { return SAVE_KEY; }
