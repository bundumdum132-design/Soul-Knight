export const CLASSES = {
  vanguard: {
    id: 'vanguard', name: 'Vanguard', title: 'Rootguard', callout: 'Hold the line. Let the briars answer.',
    silhouette: 'A broad, moss-armored guardian with a kettle-mask and a coal-red maul.',
    maxHp: 8, maxEnergy: 80, energyRegen: 5, skillCost: 24, speed: 77, crit: 0.07, armor: 2, attackMult: 1.08, skillCooldown: 6.4,
    passiveName: 'Knot of Three', passive: 'Three close hits knot a bark shield; the next strike bursts outward.',
    skillName: 'Faultline', skill: 'Drive a shockwave through nearby foes, staggering and pushing them back.',
    primary: 'rootmaul', secondary: 'coilrod', color: '#8ead72', accent: '#e88952', outline: '#243d37', highlight: '#d0d79a',
  },
  ranger: {
    id: 'ranger', name: 'Ranger', title: 'Wickmoth', callout: 'Never stop moving. Never let the lantern go out.',
    silhouette: 'A nimble moth-scout in a teal scarf, carrying a cinder lantern and recurved bow.',
    maxHp: 6, maxEnergy: 100, energyRegen: 7, skillCost: 28, speed: 105, crit: 0.16, armor: 0, attackMult: 0.92, skillCooldown: 5.2,
    passiveName: 'Borrowed Wind', passive: 'Keep moving to build Flow; your next hit becomes a bright critical strike.',
    skillName: 'Lantern Skip', skill: 'Blink-dash through danger, leaving a cinder trail that burns pursuers.',
    primary: 'cinderbell', secondary: 'reedspike', color: '#d7b36c', accent: '#70c5b6', outline: '#354945', highlight: '#fff0b1',
  },
};

export const WEAPONS = {
  rootmaul: {
    id: 'rootmaul', name: 'Rootwake Maul', category: 'Melee', rarity: 'Common', kind: 'melee', element: 'Physical',
    damage: 3, interval: 0.62, range: 37, knockback: 54, description: 'A heavy crescent sweep that shoves a crowd aside.',
  },
  cinderbell: {
    id: 'cinderbell', name: 'Cinder Bell', category: 'Ranged', rarity: 'Uncommon', kind: 'spread', element: 'Fire',
    damage: 1, interval: 0.72, projectileSpeed: 178, projectiles: 3, spread: 0.28, range: 190, description: 'Rings out three hot seeds in a shallow fan.',
  },
  reedspike: {
    id: 'reedspike', name: 'Reedline Spike', category: 'Ranged', rarity: 'Common', kind: 'pierce', element: 'Physical',
    damage: 2, interval: 0.83, projectileSpeed: 255, projectiles: 1, pierce: 2, range: 250, description: 'A long, clean shot that passes through two targets.',
  },
  coilrod: {
    id: 'coilrod', name: 'Stormglass Coil', category: 'Magic', rarity: 'Rare', kind: 'chain', element: 'Lightning',
    damage: 2, interval: 0.94, projectileSpeed: 205, projectiles: 1, chain: 2, range: 190, description: 'A charged mote leaps from foe to foe on impact.',
  },
  returner: {
    id: 'returner', name: 'Mossback Returner', category: 'Special', rarity: 'Rare', kind: 'boomerang', element: 'Physical',
    damage: 2, interval: 1.05, projectileSpeed: 146, projectiles: 1, pierce: 99, range: 220, description: 'A curved seed-blade circles home through the fight.',
  },
};

export const BUFFS = {
  cinderblood: { id: 'cinderblood', name: 'Cinderblood', icon: '✦', rarity: 'Uncommon', maxStacks: 3, description: 'Your hits kindle foes. Burn lasts longer and bites harder.', effect: 'Hits ignite for a short damage-over-time burn; each stack strengthens it.' },
  splitseed: { id: 'splitseed', name: 'Splitseed', icon: '⋔', rarity: 'Rare', maxStacks: 2, description: 'Ranged weapons cast one extra seed in their spread.', effect: '+1 projectile per stack; added shots deal 72% damage.' },
  ironbark: { id: 'ironbark', name: 'Ironbark', icon: '⬟', rarity: 'Uncommon', maxStacks: 3, description: 'An old root wraps around your ribs.', effect: '+1 maximum health and +1 armor per stack; restore 1 health on room clear.' },
  quickbloom: { id: 'quickbloom', name: 'Quickbloom', icon: '➤', rarity: 'Common', maxStacks: 3, description: 'A little haste blooms into a lot of momentum.', effect: '+8% movement speed and +7% attack speed per stack.' },
  stormpollen: { id: 'stormpollen', name: 'Storm Pollen', icon: 'ϟ', rarity: 'Rare', maxStacks: 3, description: 'Every impact leaves a small spark in the air.', effect: 'Hits arc to nearby foes; each stack adds another chain jump.' },
};

export const ENEMIES = {
  mosscrawler: { id: 'mosscrawler', name: 'Mosscrawler', hp: 3, speed: 42, touch: 1, xp: 7, coins: 1, role: 'chase', color: '#94b679', radius: 8, threat: 2 },
  lanternspore: { id: 'lanternspore', name: 'Lantern Spore', hp: 2, speed: 25, touch: 1, xp: 8, coins: 2, role: 'ranged', color: '#d49a70', radius: 8, threat: 3, range: 124 },
  brassback: { id: 'brassback', name: 'Brassback', hp: 5, speed: 30, touch: 2, xp: 11, coins: 2, role: 'charger', color: '#d18a56', radius: 10, threat: 4 },
  bellroot: { id: 'bellroot', name: 'Bellroot', hp: 4, speed: 22, touch: 1, xp: 10, coins: 3, role: 'support', color: '#c3b071', radius: 9, threat: 4 },
  flickerling: { id: 'flickerling', name: 'Flickerling', hp: 2, speed: 66, touch: 1, xp: 4, coins: 1, role: 'swarm', color: '#bd90bd', radius: 6, threat: 1 },
  thornsentinel: { id: 'thornsentinel', name: 'Thorn Sentinel', hp: 14, speed: 30, touch: 2, xp: 36, coins: 12, role: 'elite', color: '#99a964', radius: 13, threat: 8 },
};

export const SHOP_STOCK = [
  { id: 'heart', name: 'Warmroot Tonic', type: 'heal', price: 8, description: 'Restore 3 health.' },
  { id: 'ironbark', name: 'Bark-Knot Charm', type: 'buff', buff: 'ironbark', price: 14, description: 'Gain Ironbark, if it can still stack.' },
  { id: 'cinderbell', name: 'Cinder Bell', type: 'weapon', weapon: 'cinderbell', price: 16, description: 'Three hot seeds in a shallow fan.' },
  { id: 'returner', name: 'Mossback Returner', type: 'weapon', weapon: 'returner', price: 21, description: 'A seed-blade that curves back home.' },
  { id: 'coins', name: 'Pouch of Amber', type: 'coins', amount: 18, price: 11, description: 'Add 18 amber to your purse.' },
];

export const ELEMENT_COLORS = { Physical: '#eee2bf', Fire: '#f08b58', Ice: '#83c9df', Poison: '#9bd17e', Lightning: '#f5d76e' };
export const rarityColor = (rarity) => ({ Common: '#c6ccb9', Uncommon: '#82d0a5', Rare: '#84bce0', Epic: '#c7a0e8', Legendary: '#f3c56b' })[rarity] || '#c6ccb9';
