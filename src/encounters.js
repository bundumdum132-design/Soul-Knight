import { ENEMIES } from './content.js';
import { makeRng, pick, intBetween } from './rng.js';

export function makeEncounter(node, floor, seed) {
  let nameHash = 2166136261;
  for (const char of node.id) nameHash = Math.imul(nameHash ^ char.charCodeAt(0), 16777619);
  const rng = makeRng((Number(seed) ^ nameHash ^ floor * 773) >>> 0);
  if (node.type === 'boss' || node.type === 'start' || node.type === 'treasure' || node.type === 'shop' || node.type === 'shrine') return [];
  if (node.type === 'elite') {
    const side = floor === 1 ? ['mosscrawler', 'lanternspore'] : ['brassback', 'bellroot', 'flickerling'];
    return [[...(floor > 1 ? ['thornsentinel', 'thornsentinel'] : ['thornsentinel']), pick(rng, side), ...(floor > 1 ? ['flickerling'] : [])]];
  }
  const unlocked = floor === 1
    ? ['mosscrawler', 'lanternspore', 'brassback', 'flickerling']
    : floor === 2
      ? ['mosscrawler', 'lanternspore', 'brassback', 'flickerling', 'bellroot']
      : Object.keys(ENEMIES).filter((id) => id !== 'thornsentinel');
  const first = floor === 1 ? ['mosscrawler', 'mosscrawler', 'lanternspore'] : [pick(rng, unlocked), pick(rng, unlocked), pick(rng, unlocked)];
  const waves = [first];
  if (rng() < (floor === 1 ? 0.30 : 0.68)) {
    const size = intBetween(rng, 2, Math.min(4, floor + 2));
    const wave = [];
    const melee = unlocked.filter((id) => ['mosscrawler', 'brassback', 'flickerling'].includes(id));
    const support = unlocked.filter((id) => ['lanternspore', 'bellroot'].includes(id));
    if (support.length && rng() < .7) wave.push(pick(rng, support));
    while (wave.length < size) wave.push(pick(rng, melee.length ? melee : unlocked));
    waves.push(wave);
  }
  return waves;
}

export function makeEnemy(kind, x, y, floor = 1, rng = Math.random) {
  const data = ENEMIES[kind];
  if (!data) return null;
  const scale = 1 + (floor - 1) * 0.23;
  return {
    id: `${kind}-${Math.floor(rng() * 0xffffffff).toString(36).slice(0, 7)}`,
    kind, name: data.name, role: data.role, x, y, vx: 0, vy: 0,
    hp: Math.round(data.hp * scale), maxHp: Math.round(data.hp * scale), speed: data.speed * (1 + (floor - 1) * 0.06),
    touch: data.touch * (1 + (floor - 1) * 0.12), xp: data.xp, coins: data.coins,
    color: data.color, radius: data.radius, range: data.range || 112,
    attackTimer: .65 + rng() * .4, telegraph: 0, attackMode: '', targetX: x, targetY: y,
    flash: 0, burn: 0, burnTick: 0, burnDps: 0, slow: 0, stagger: 0, chargeTime: 0, shield: kind === 'thornsentinel' ? 3 : 0,
    phase: rng() * 6, alive: true, facing: 1,
  };
}

export function makeBoss(floor = 1, rng = Math.random) {
  const scale = 1 + (floor - 1) * .34;
  return {
    id: `mirebell-${floor}`, kind: 'mirebell', name: floor === 3 ? 'The Gloamheart' : 'Mirebell, the Hollow Bloom', role: 'boss',
    x: 342, y: 126, vx: 0, vy: 0, hp: Math.round(58 * (1 + (floor - 1) * .18)), maxHp: Math.round(58 * (1 + (floor - 1) * .18)), speed: 31 + floor * 2,
    touch: 2, xp: 100, coins: 40 + floor * 8, color: '#92a76c', radius: 28,
    attackTimer: 1.5, telegraph: 0, attackMode: '', targetX: 240, targetY: 135,
    flash: 0, burn: 0, burnTick: 0, burnDps: 0, slow: 0, stagger: 0, phase: rng() * 4, contactCd: 0,
    bossPhase: 1, alive: true, facing: -1, pattern: 0, entrance: 1.4,
  };
}

export function makeProps(seed, roomType = 'combat') {
  const rng = makeRng((Number(seed) ^ 0xa31b7e19) >>> 0);
  if (roomType === 'start' || roomType === 'boss' || roomType === 'shop') return [];
  const count = roomType === 'treasure' ? 2 : 2 + Math.floor(rng() * 3);
  const props = [];
  const types = ['barrel', 'stone', 'crystal', 'shrub'];
  for (let i = 0; i < count; i++) {
    let x = 0, y = 0, tries = 0;
    do {
      x = 66 + rng() * 340;
      y = 55 + rng() * 160;
      tries++;
    } while (tries < 30 && (Math.hypot(x - 240, y - 135) < 45 || props.some((p) => Math.hypot(x - p.x, y - p.y) < 52) || x < 72 || x > 408 || y < 53 || y > 218));
    const type = types[Math.floor(rng() * types.length)];
    const w = type === 'stone' ? 20 : type === 'crystal' ? 12 : type === 'shrub' ? 18 : 14;
    const h = type === 'stone' ? 16 : type === 'crystal' ? 21 : type === 'shrub' ? 15 : 15;
    props.push({ id: `${seed}-prop-${i}`, x: Math.round(x), y: Math.round(y), w, h, type, solid: type !== 'shrub', destructible: type === 'barrel' || type === 'crystal', hp: type === 'crystal' ? 3 : 2, maxHp: type === 'crystal' ? 3 : 2 });
  }
  return props;
}

export function rollReward(rng, floor = 1) {
  const roll = rng();
  if (roll < .44) return { type: 'weapon' };
  if (roll < .68) return { type: 'coins', amount: 8 + Math.floor(rng() * 9) + floor * 2 };
  if (roll < .84) return { type: 'heal', amount: 3 };
  return { type: 'xp', amount: 18 + floor * 5 };
}
