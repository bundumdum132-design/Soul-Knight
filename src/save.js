const SAVE_KEY = 'gloamforge-save';
export const SAVE_VERSION = 2;
const CLASS_IDS = ['vanguard', 'ranger'];
const WEAPON_IDS = ['rootmaul', 'cinderbell', 'reedspike', 'coilrod', 'returner'];
const safeWeapon = (id) => WEAPON_IDS.includes(id) ? id : null;
const DEFAULT_UPGRADES = Object.freeze({ vitality: 0, reservoir: 0, mastery: 0 });

export function freshSave() {
  return {
    version: SAVE_VERSION,
    memory: 0,
    unlockedClasses: [...CLASS_IDS],
    classUpgrades: { vanguard: { ...DEFAULT_UPGRADES }, ranger: { ...DEFAULT_UPGRADES } },
    weaponTickets: 1,
    loadouts: { vanguard: null, ranger: null },
    preparedWeapon: null,
    ticketFragments: 0,
    farm: { seeds: 3, rootFiber: 0, plots: [null, null, null] },
    settings: { master: 0.6, sfx: 0.72, music: 0.35, shake: true, fullscreen: false, largeUI: false, damageNumbers: true },
    stats: { runs: 0, wins: 0, deaths: 0, rooms: 0, enemies: 0, bosses: 0, bestFloor: 0, totalCoins: 0, playSeconds: 0 },
    discoveries: { weapons: [], enemies: [], buffs: [], bosses: [] },
    achievements: [],
    lastRun: null,
    lastClass: 'vanguard',
  };
}

function volume(value, fallback) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? Math.max(0, Math.min(1, parsed)) : fallback;
}
function classIdFromLegacy(id) {
  if (id === 'sable') return 'vanguard';
  if (id === 'luma') return 'ranger';
  return id;
}
function normalizeUpgrade(value) {
  const source = value && typeof value === 'object' ? value : {};
  return {
    vitality: Math.max(0, Math.min(5, Math.floor(Number(source.vitality) || 0))),
    reservoir: Math.max(0, Math.min(5, Math.floor(Number(source.reservoir) || 0))),
    mastery: Math.max(0, Math.min(5, Math.floor(Number(source.mastery) || 0))),
  };
}

export function normalizeSave(raw) {
  const base = freshSave();
  if (!raw || typeof raw !== 'object') return base;
  if ((Number(raw.version) || 0) > SAVE_VERSION) return base;
  const safeStats = {};
  for (const key of Object.keys(base.stats)) {
    const value = Number(raw.stats?.[key]);
    safeStats[key] = Number.isFinite(value) ? Math.max(0, value) : base.stats[key];
  }
  const safeDiscoveries = {};
  for (const key of Object.keys(base.discoveries)) {
    const input = Array.isArray(raw.discoveries?.[key]) ? raw.discoveries[key] : [];
    safeDiscoveries[key] = [...new Set(input.filter((value) => typeof value === 'string'))];
  }
  const incomingUnlocks = raw.unlockedClasses ?? raw.unlockedHeroes;
  const unlockedClasses = Array.isArray(incomingUnlocks)
    ? [...new Set([...CLASS_IDS, ...incomingUnlocks.map(classIdFromLegacy).filter((id) => typeof id === 'string')])]
    : [...CLASS_IDS];
  const oldHeartLevel = Math.max(0, Math.min(2, Math.floor(Number(raw.permanentHp) || 0)));
  const oldUpgrades = raw.classUpgrades && typeof raw.classUpgrades === 'object' ? raw.classUpgrades : {};
  const classUpgrades = {
    vanguard: normalizeUpgrade(oldUpgrades.vanguard ?? oldUpgrades.sable ?? { vitality: oldHeartLevel }),
    ranger: normalizeUpgrade(oldUpgrades.ranger ?? oldUpgrades.luma ?? { vitality: oldHeartLevel }),
  };
  for (const [id, upgrade] of Object.entries(oldUpgrades)) {
    const mapped = classIdFromLegacy(id);
    if (!classUpgrades[mapped]) classUpgrades[mapped] = normalizeUpgrade(upgrade);
  }
  const inputFarm = raw.farm && typeof raw.farm === 'object' ? raw.farm : {};
  const plots = Array.isArray(inputFarm.plots) ? inputFarm.plots.slice(0, 3).map((plot) => {
    if (!plot || typeof plot !== 'object') return null;
    const plantedAt = Number(plot.plantedAt);
    return Number.isFinite(plantedAt) && plantedAt > 0 ? { plantedAt, crop: String(plot.crop || 'rootbean') } : null;
  }) : [null, null, null];
  while (plots.length < 3) plots.push(null);
  const lastRunRaw = raw.lastRun && typeof raw.lastRun === 'object' ? raw.lastRun : null;
  const lastRun = lastRunRaw ? {
    outcome: String(lastRunRaw.outcome || ''), floor: Math.max(0, Number(lastRunRaw.floor) || 0),
    kills: Math.max(0, Number(lastRunRaw.kills) || 0), rooms: Math.max(0, Number(lastRunRaw.rooms) || 0),
    time: String(lastRunRaw.time || ''),
  } : null;
  return {
    version: SAVE_VERSION,
    memory: Math.max(0, Number(raw.memory) || 0),
    unlockedClasses,
    classUpgrades,
    weaponTickets: Math.max(0, Math.min(99, Math.floor(Number(raw.weaponTickets ?? 1) || 0))),
    loadouts: {
      vanguard: safeWeapon(raw.loadouts?.vanguard ?? raw.loadouts?.sable),
      ranger: safeWeapon(raw.loadouts?.ranger ?? raw.loadouts?.luma),
    },
    preparedWeapon: safeWeapon(raw.preparedWeapon),
    ticketFragments: Math.max(0, Math.min(99, Math.floor(Number(raw.ticketFragments) || 0))),
    farm: {
      seeds: Math.max(0, Math.min(99, Math.floor(Number(inputFarm.seeds ?? 3) || 0))),
      rootFiber: Math.max(0, Math.min(999, Math.floor(Number(inputFarm.rootFiber) || 0))),
      plots,
    },
    settings: {
      master: volume(raw.settings?.master, base.settings.master),
      sfx: volume(raw.settings?.sfx, base.settings.sfx),
      music: volume(raw.settings?.music, base.settings.music),
      shake: raw.settings?.shake !== false,
      fullscreen: raw.settings?.fullscreen === true,
      largeUI: raw.settings?.largeUI === true,
      damageNumbers: raw.settings?.damageNumbers !== false,
    },
    stats: safeStats,
    discoveries: safeDiscoveries,
    achievements: Array.isArray(raw.achievements) ? [...new Set(raw.achievements.filter((v) => typeof v === 'string'))] : [],
    lastRun,
    lastClass: CLASS_IDS.includes(classIdFromLegacy(raw.lastClass ?? raw.lastHero)) ? classIdFromLegacy(raw.lastClass ?? raw.lastHero) : 'vanguard',
  };
}

export function loadSave(storage) {
  try {
    const target = storage ?? globalThis.localStorage;
    const raw = target?.getItem(SAVE_KEY);
    return normalizeSave(raw ? JSON.parse(raw) : null);
  } catch {
    return freshSave();
  }
}

export function persistSave(save, storage) {
  try {
    const target = storage ?? globalThis.localStorage;
    if (!target?.setItem) return false;
    target.setItem(SAVE_KEY, JSON.stringify(normalizeSave(save)));
    return true;
  } catch {
    return false;
  }
}

export function saveKeyForTests() { return SAVE_KEY; }
