import { makeRng, pick } from './rng.js';

const LAYOUTS = [
  [[0, 0], [1, 0], [2, 0], [3, 0], [4, 0], [5, 0]],
  [[0, 0], [1, 0], [1, 1], [2, 1], [3, 1], [3, 0]],
  [[0, 0], [0, -1], [1, -1], [2, -1], [2, 0], [3, 0]],
];
const DIRS = [
  { name: 'north', dx: 0, dy: -1 }, { name: 'east', dx: 1, dy: 0 },
  { name: 'south', dx: 0, dy: 1 }, { name: 'west', dx: -1, dy: 0 },
];

export function generateFloor(seed, floor = 1) {
  const rng = makeRng((Number(seed) + floor * 0x9e3779b9) >>> 0);
  const layout = LAYOUTS[Math.floor(rng() * LAYOUTS.length)];
  const rotation = Math.floor(rng() * 4);
  const mirror = rng() < 0.5 ? 1 : -1;
  const rotate = ([x, y]) => {
    x *= mirror;
    for (let i = 0; i < rotation; i++) [x, y] = [-y, x];
    return [x, y];
  };

  const nodes = layout.map(([x, y], i) => {
    const [rx, ry] = rotate([x, y]);
    const type = ['start', 'combat', 'combat', 'combat', 'elite', 'boss'][i];
    return { id: `f${floor}-r${i}`, x: rx, y: ry, type, mainPath: true, visited: i === 0, cleared: type === 'start', rewardClaimed: false };
  });
  const occupied = new Set(nodes.map((n) => `${n.x},${n.y}`));
  const sideTypes = ['treasure', 'shop', 'shrine'];
  const parentOrder = [1, 2, 3, 4].sort(() => rng() - 0.5);

  for (let i = 0; i < sideTypes.length; i++) {
    const candidates = [];
    for (const parentIndex of parentOrder) {
      const parent = nodes[parentIndex];
      for (const dir of DIRS) {
        const x = parent.x + dir.dx;
        const y = parent.y + dir.dy;
        if (occupied.has(`${x},${y}`)) continue;
        const nearby = nodes.filter((n) => Math.abs(n.x - x) + Math.abs(n.y - y) === 1);
        if (nearby.length === 1 && nearby[0].id === parent.id) candidates.push({ x, y, parentIndex });
      }
    }
    const spot = candidates.length ? pick(rng, candidates) : null;
    if (!spot) continue;
    const index = nodes.length;
    nodes.push({ id: `f${floor}-r${index}`, x: spot.x, y: spot.y, type: sideTypes[i], mainPath: false, parentId: nodes[spot.parentIndex].id, visited: false, cleared: false, rewardClaimed: false });
    occupied.add(`${spot.x},${spot.y}`);
  }

  const links = [];
  for (let a = 0; a < nodes.length; a++) {
    for (let b = a + 1; b < nodes.length; b++) {
      const dx = nodes[b].x - nodes[a].x;
      const dy = nodes[b].y - nodes[a].y;
      if (Math.abs(dx) + Math.abs(dy) === 1) links.push([nodes[a].id, nodes[b].id]);
    }
  }
  const linkMap = Object.fromEntries(nodes.map((n) => [n.id, []]));
  for (const [a, b] of links) {
    linkMap[a].push(b);
    linkMap[b].push(a);
  }
  const byId = Object.fromEntries(nodes.map((n) => [n.id, n]));
  const start = nodes.find((n) => n.type === 'start');
  const boss = nodes.find((n) => n.type === 'boss');
  const reachable = new Set([start.id]);
  const stack = [start.id];
  while (stack.length) for (const next of linkMap[stack.pop()] || []) if (!reachable.has(next)) { reachable.add(next); stack.push(next); }

  return {
    seed: Number(seed) >>> 0, floor, nodes, links, linkMap, byId,
    startId: start.id, bossId: boss.id, generated: true,
    valid: reachable.size === nodes.length && reachable.has(boss.id),
    offsets: { x: -Math.min(...nodes.map((n) => n.x)), y: -Math.min(...nodes.map((n) => n.y)) },
  };
}

export function directionBetween(from, to) {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  if (dx === 1) return 'east';
  if (dx === -1) return 'west';
  if (dy === 1) return 'south';
  if (dy === -1) return 'north';
  return null;
}

export function validateFloor(floor) {
  if (!floor?.valid || !floor.nodes?.length) return false;
  if (floor.nodes.filter((n) => n.type === 'start').length !== 1) return false;
  if (floor.nodes.filter((n) => n.type === 'boss').length !== 1) return false;
  return floor.nodes.every((n) => (floor.linkMap[n.id] || []).length > 0 || n.type === 'start');
}
