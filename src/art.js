import { C, ROOM, WIDTH, HEIGHT } from './constants.js';
import { ENEMIES, HEROES, WEAPONS, ELEMENT_COLORS, rarityColor } from './content.js';

const fill = (ctx, color, x, y, w, h) => { ctx.fillStyle = color; ctx.fillRect(Math.round(x), Math.round(y), Math.ceil(w), Math.ceil(h)); };
const line = (ctx, color, x1, y1, x2, y2, width = 1) => { ctx.strokeStyle = color; ctx.lineWidth = width; ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke(); };

export function text(ctx, value, x, y, size = 8, color = C.cream, align = 'left', weight = 600) {
  ctx.save();
  ctx.font = `${weight} ${size}px 'DM Mono', ui-monospace, monospace`;
  ctx.textAlign = align;
  ctx.textBaseline = 'top';
  ctx.fillStyle = color;
  ctx.shadowColor = 'rgba(0,0,0,.5)';
  ctx.shadowBlur = 2;
  ctx.fillText(String(value), x, y);
  ctx.restore();
}

export function panel(ctx, x, y, w, h, options = {}) {
  fill(ctx, options.shadow || 'rgba(7,14,16,.88)', x + 3, y + 4, w, h);
  fill(ctx, options.fill || '#17272b', x, y, w, h);
  fill(ctx, options.border || '#607362', x, y, w, 1);
  fill(ctx, options.border || '#607362', x, y + h - 1, w, 1);
  fill(ctx, options.border || '#607362', x, y, 1, h);
  fill(ctx, options.border || '#607362', x + w - 1, y, 1, h);
  fill(ctx, 'rgba(239,197,109,.16)', x + 5, y + 5, 2, 2);
}

export function drawBackdrop(ctx, time, particles = []) {
  fill(ctx, '#111c20', 0, 0, WIDTH, HEIGHT);
  fill(ctx, '#17272b', 0, 0, WIDTH, 170);
  fill(ctx, '#1c302e', 0, 164, WIDTH, 106);
  // distant ruin silhouettes
  for (let i = 0; i < 8; i++) {
    const x = i * 68 - 8;
    const h = 34 + ((i * 17) % 35);
    fill(ctx, '#203331', x, 170 - h, 30, h + 25);
    fill(ctx, '#293d38', x - 3, 170 - h - 4, 36, 5);
    fill(ctx, '#18292a', x + 8, 158 - h, 10, 18);
    if (i % 2 === 0) fill(ctx, '#5f8057', x + 22, 173 - h, 3, 14);
  }
  // moon and softly moving haze
  ctx.globalAlpha = 0.72;
  fill(ctx, '#dfc98f', 358, 39 + Math.sin(time * .16) * 2, 26, 26);
  fill(ctx, '#b59e77', 365, 34 + Math.sin(time * .16) * 2, 21, 21);
  fill(ctx, '#dfc98f', 369, 35 + Math.sin(time * .16) * 2, 15, 15);
  ctx.globalAlpha = 1;
  for (let i = 0; i < 7; i++) {
    const x = ((i * 91 + time * (3 + i % 3)) % (WIDTH + 50)) - 25;
    fill(ctx, 'rgba(136,167,106,.045)', x, 96 + Math.sin(time * .18 + i) * 9, 56, 4);
  }
  for (const p of particles) {
    ctx.globalAlpha = Math.max(0, p.life / p.maxLife) * 0.65;
    fill(ctx, p.color || '#c9d390', p.x, p.y, p.size || 2, p.size || 2);
  }
  ctx.globalAlpha = 1;
  // foreground moss silhouette
  fill(ctx, '#142522', 0, 236, WIDTH, 34);
  for (let i = 0; i < 35; i++) {
    const x = (i * 17) % WIDTH;
    const y = 232 + (i * 11 % 30);
    fill(ctx, i % 3 ? '#263c32' : '#344a37', x, y, 2 + i % 3, 2 + i % 2);
  }
}

export function drawRoom(ctx, room, time, floor = 1) {
  const seed = room?.seed ?? 12345;
  fill(ctx, '#111d20', 0, 0, WIDTH, HEIGHT);
  fill(ctx, '#263a35', ROOM.left, ROOM.top, ROOM.right - ROOM.left, ROOM.bottom - ROOM.top);
  for (let y = ROOM.top; y < ROOM.bottom; y += 16) {
    for (let x = ROOM.left; x < ROOM.right; x += 16) {
      const h = Math.imul((x + seed) | 0, 374761393) ^ Math.imul((y + seed * 2) | 0, 668265263);
      const n = (h ^ (h >>> 13)) >>> 0;
      const color = n % 11 === 0 ? '#30433b' : (n % 5 === 0 ? '#2b3e38' : '#293b36');
      fill(ctx, color, x, y, 15, 15);
      if (n % 7 === 0) fill(ctx, '#42513e', x + (n % 9), y + ((n >>> 5) % 9), 2, 1);
      if (n % 29 === 0) {
        fill(ctx, '#4b6849', x + 4, y + 10, 1, 3);
        fill(ctx, '#61784c', x + 5, y + 12, 3, 1);
      }
    }
  }
  // faint carved ring in the old stone floor
  ctx.save();
  ctx.globalAlpha = 0.12;
  ctx.strokeStyle = '#c5b47b';
  ctx.lineWidth = 1;
  ctx.beginPath(); ctx.arc(ROOM.centerX, ROOM.centerY + 3, 43, 0, Math.PI * 2); ctx.stroke();
  for (let i = 0; i < 8; i++) {
    const a = i * Math.PI / 4 + time * .02;
    fill(ctx, '#c4b574', ROOM.centerX + Math.cos(a) * 43, ROOM.centerY + 3 + Math.sin(a) * 43, 2, 2);
  }
  ctx.restore();

  // enclosing ruin walls
  fill(ctx, '#1a2929', 0, 0, WIDTH, ROOM.top);
  fill(ctx, '#1a2929', 0, ROOM.bottom, WIDTH, HEIGHT - ROOM.bottom);
  fill(ctx, '#1a2929', 0, 0, ROOM.left, HEIGHT);
  fill(ctx, '#1a2929', ROOM.right, 0, WIDTH - ROOM.right, HEIGHT);
  fill(ctx, '#394b41', ROOM.left, ROOM.top, ROOM.right - ROOM.left, 4);
  fill(ctx, '#394b41', ROOM.left, ROOM.bottom - 4, ROOM.right - ROOM.left, 4);
  fill(ctx, '#394b41', ROOM.left, ROOM.top, 4, ROOM.bottom - ROOM.top);
  fill(ctx, '#394b41', ROOM.right - 4, ROOM.top, 4, ROOM.bottom - ROOM.top);
  for (let x = ROOM.left + 10; x < ROOM.right - 8; x += 26) {
    fill(ctx, (Math.floor(x / 26) % 2) ? '#46584a' : '#34473f', x, ROOM.top + 7, 17, 5);
    fill(ctx, '#495b49', x + 5, ROOM.bottom - 10, 12, 4);
  }
  for (let y = ROOM.top + 16; y < ROOM.bottom - 10; y += 31) {
    fill(ctx, '#50684b', ROOM.left + 6, y, 3, 11);
    fill(ctx, '#38543f', ROOM.left + 8, y + 4, 5, 2);
    fill(ctx, '#50684b', ROOM.right - 9, y + 7, 3, 12);
  }
  const doors = room?.doors || {};
  drawDoor(ctx, 'north', doors.north, time);
  drawDoor(ctx, 'south', doors.south, time);
  drawDoor(ctx, 'east', doors.east, time);
  drawDoor(ctx, 'west', doors.west, time);
  // low vignette for pixel-stage depth
  ctx.save();
  const grad = ctx.createRadialGradient(ROOM.centerX, ROOM.centerY, 40, ROOM.centerX, ROOM.centerY, 280);
  grad.addColorStop(0, 'rgba(3,10,12,0)');
  grad.addColorStop(1, 'rgba(3,10,12,.30)');
  ctx.fillStyle = grad; ctx.fillRect(ROOM.left, ROOM.top, ROOM.right - ROOM.left, ROOM.bottom - ROOM.top);
  ctx.restore();
  text(ctx, `GLOAM ${String(floor).padStart(2, '0')}`, 34, 28, 6, 'rgba(207,207,161,.58)', 'left', 500);
}

function drawDoor(ctx, dir, open, time) {
  if (open === 'none' || open == null) return;
  const horizontal = dir === 'north' || dir === 'south';
  const x = horizontal ? ROOM.centerX - 17 : (dir === 'west' ? ROOM.left - 1 : ROOM.right - 16);
  const y = horizontal ? (dir === 'north' ? ROOM.top - 1 : ROOM.bottom - 17) : ROOM.centerY - 16;
  const w = horizontal ? 34 : 17;
  const h = horizontal ? 17 : 32;
  if (open) {
    fill(ctx, '#182927', x, y, w, h);
    fill(ctx, '#81945f', horizontal ? x : x + 3, horizontal ? y : y, horizontal ? 2 : 3, horizontal ? h : 2);
    if (horizontal) fill(ctx, '#81945f', x + w - 2, y, 2, h);
    else fill(ctx, '#81945f', x, y + h - 2, w, 2);
    const gl = .35 + Math.sin(time * 4) * .1;
    fill(ctx, `rgba(239,197,109,${gl})`, horizontal ? x + 13 : x + 3, horizontal ? y + 7 : y + 13, horizontal ? 8 : 10, horizontal ? 3 : 7);
  } else {
    fill(ctx, '#26342f', x, y, w, h);
    for (let i = 0; i < (horizontal ? 5 : 4); i++) {
      if (horizontal) fill(ctx, '#53634b', x + 2 + i * 7, y + 3, 2, h - 4);
      else fill(ctx, '#53634b', x + 3, y + 1 + i * 7, w - 6, 2);
    }
    fill(ctx, '#d18b57', horizontal ? x + 15 : x + 6, horizontal ? y + 8 : y + 14, 4, 4);
  }
}

export function drawProp(ctx, prop, time = 0) {
  const { x, y, w, h, type } = prop;
  fill(ctx, 'rgba(0,0,0,.25)', x - 2, y + h - 2, w + 4, 4);
  if (type === 'barrel') {
    fill(ctx, '#513d32', x + 2, y, w - 4, h);
    fill(ctx, '#8c6040', x + 4, y + 2, w - 8, h - 3);
    fill(ctx, '#b17b4d', x + 5, y + 3, 2, h - 6);
    fill(ctx, '#455045', x + 1, y + 4, w - 2, 2);
    fill(ctx, '#455045', x + 1, y + h - 6, w - 2, 2);
    fill(ctx, '#d4955c', x + w / 2 - 1, y + h / 2 - 1, 3, 3);
  } else if (type === 'stone') {
    fill(ctx, '#455348', x + 1, y + 3, w - 2, h - 2);
    fill(ctx, '#65745c', x + 3, y, w - 6, h - 4);
    fill(ctx, '#849070', x + 5, y + 1, 4, 3);
    fill(ctx, '#33433a', x + w - 6, y + 4, 2, 7);
    if (prop.hp < prop.maxHp) fill(ctx, '#ead3a0', x + 6, y + 5, 1, 3);
  } else if (type === 'crystal') {
    fill(ctx, '#557b77', x + w / 2 - 2, y, 5, h);
    fill(ctx, '#8ac8ad', x + w / 2 - 1, y + 2, 2, h - 6);
    fill(ctx, '#6a9b89', x + 2, y + h / 3, w - 4, 3);
    fill(ctx, '#b1ddad', x + w / 2, y + 1, 1, 2);
  } else if (type === 'shrub') {
    fill(ctx, '#385642', x + 1, y + h / 2, w - 2, h / 2);
    fill(ctx, '#54714c', x + 3, y + 2, w - 6, h - 3);
    fill(ctx, '#76915b', x + 6, y + 1, w - 11, 4);
    fill(ctx, '#9aab68', x + 4, y + 4, 3, 2);
  } else if (type === 'lamp') {
    fill(ctx, '#57614c', x + w / 2 - 2, y + 6, 4, h - 6);
    fill(ctx, '#ae8550', x + w / 2 - 5, y + 3, 10, 4);
    fill(ctx, '#f0c875', x + w / 2 - 2, y + 4, 4, 4);
    ctx.save(); ctx.globalAlpha = .08 + Math.sin(time * 3) * .02; fill(ctx, '#ffbf65', x - 10, y - 12, w + 20, h + 22); ctx.restore();
  }
}

export function drawHero(ctx, id, x, y, aim, time, moving = false, invulnerable = 0, attacking = 0, skillFlash = 0) {
  if (invulnerable > 0 && Math.floor(time * 22) % 2 === 0) return;
  const bob = moving ? Math.sin(time * 19) * 1.4 : Math.sin(time * 3.4) * .7;
  const yy = Math.round(y + bob);
  fill(ctx, 'rgba(0,0,0,.36)', x - 10, yy + 8, 20, 6);
  // feet and trailing scarf
  if (id === 'sable') {
    fill(ctx, '#374843', x - 8, yy + 4, 5, 5); fill(ctx, '#374843', x + 3, yy + 4, 5, 5);
    fill(ctx, '#6b8057', x - 9, yy - 7, 18, 14);
    fill(ctx, '#8ead72', x - 8, yy - 9, 16, 10);
    fill(ctx, '#415c4d', x - 10, yy - 5, 3, 9); fill(ctx, '#415c4d', x + 7, yy - 5, 3, 9);
    fill(ctx, '#233b3a', x - 6, yy - 15, 12, 8);
    fill(ctx, '#b8b17b', x - 5, yy - 13, 10, 5);
    fill(ctx, '#1b2d30', x - 3, yy - 12, 2, 2); fill(ctx, '#1b2d30', x + 2, yy - 12, 2, 2);
    fill(ctx, '#e78b52', x - 2, yy - 5, 4, 4);
    // small shoulder plate and woven cloak
    fill(ctx, '#b78c58', x - 10, yy - 4, 4, 5); fill(ctx, '#526d50', x + 7, yy - 2, 4, 6);
  } else {
    fill(ctx, '#31504d', x - 6, yy + 5, 4, 4); fill(ctx, '#31504d', x + 3, yy + 5, 4, 4);
    fill(ctx, '#46756c', x - 7, yy - 6, 14, 12);
    fill(ctx, '#68a899', x - 6, yy - 8, 12, 9);
    fill(ctx, '#d7b36c', x - 5, yy - 14, 10, 8);
    fill(ctx, '#f0d692', x - 4, yy - 13, 8, 5);
    fill(ctx, '#342f2b', x - 2, yy - 11, 2, 2); fill(ctx, '#342f2b', x + 2, yy - 11, 2, 2);
    fill(ctx, '#66bcb0', x - 11, yy - 5, 4, 3); fill(ctx, '#66bcb0', x + 7, yy - 2, 5, 3);
    fill(ctx, '#83d4bf', x + 7, yy - 5, 3, 2);
    fill(ctx, '#f09259', x - 1, yy - 3, 3, 4);
  }
  const ax = aim?.x ?? 1; const ay = aim?.y ?? 0;
  const hx = x + ax * 10; const hy = yy + ay * 7 - 1;
  if (id === 'sable') {
    line(ctx, '#75503c', x + ax * 5, yy + ay * 4, hx, hy + 3, 2);
    fill(ctx, '#edb264', hx - 3, hy - 3, 7, 6);
    fill(ctx, '#f2d48b', hx - 2, hy - 2, 4, 3);
  } else {
    fill(ctx, '#6d5243', hx - 1, hy - 2, 2, 10);
    fill(ctx, '#f1b956', hx - 4, hy - 5, 8, 6);
    fill(ctx, '#fff0ad', hx - 2, hy - 3, 4, 3);
  }
  if (attacking > 0) {
    ctx.save(); ctx.globalAlpha = Math.min(.7, attacking * 3);
    ctx.strokeStyle = id === 'sable' ? '#d8e3a2' : '#ffcc72'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(x, yy, id === 'sable' ? 26 : 15, Math.atan2(ay, ax) - .95, Math.atan2(ay, ax) + .95); ctx.stroke(); ctx.restore();
  }
  if (skillFlash > 0) {
    ctx.save(); ctx.globalAlpha = Math.min(.45, skillFlash * 1.3); ctx.strokeStyle = id === 'sable' ? '#d7e99c' : '#efbd67'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(x, yy, 20 + (1 - skillFlash) * 34, 0, Math.PI * 2); ctx.stroke(); ctx.restore();
  }
}

export function drawEnemy(ctx, enemy, time) {
  const x = Math.round(enemy.x); const y = Math.round(enemy.y);
  if (enemy.flash > 0) fill(ctx, '#fff1d7', x - enemy.radius, y - enemy.radius, enemy.radius * 2, enemy.radius * 2);
  fill(ctx, 'rgba(0,0,0,.34)', x - enemy.radius, y + enemy.radius - 1, enemy.radius * 2, 4);
  if (enemy.role === 'boss') return drawBoss(ctx, enemy, time);
  const c = enemy.color || ENEMIES[enemy.kind]?.color || '#90a67a';
  switch (enemy.kind) {
    case 'mosscrawler':
      fill(ctx, '#435443', x - 8, y - 2, 16, 8); fill(ctx, c, x - 7, y - 6, 14, 9); fill(ctx, '#b2c783', x - 4, y - 7, 4, 3);
      fill(ctx, '#172a2a', x - 4, y - 2, 2, 2); fill(ctx, '#172a2a', x + 3, y - 2, 2, 2);
      fill(ctx, '#6a7b54', x - 11, y + 2, 4, 3); fill(ctx, '#6a7b54', x + 7, y + 2, 4, 3); break;
    case 'lanternspore':
      fill(ctx, '#6a4c43', x - 2, y - 1, 4, 10); fill(ctx, c, x - 8, y - 9, 16, 11); fill(ctx, '#e1b674', x - 4, y - 8, 8, 5);
      fill(ctx, '#fff0b2', x - 2, y - 6, 4, 3); fill(ctx, '#b87062', x - 11, y - 3, 4, 4); fill(ctx, '#b87062', x + 7, y - 3, 4, 4); break;
    case 'brassback':
      fill(ctx, '#5b4a38', x - 10, y - 3, 20, 10); fill(ctx, c, x - 8, y - 9, 16, 11); fill(ctx, '#e2ad70', x - 3, y - 8, 6, 5);
      fill(ctx, '#eddfbc', x - 11, y - 9, 5, 4); fill(ctx, '#eddfbc', x + 6, y - 9, 5, 4); fill(ctx, '#202c2b', x - 3, y - 1, 2, 2); fill(ctx, '#202c2b', x + 3, y - 1, 2, 2); break;
    case 'bellroot':
      fill(ctx, '#6f7350', x - 7, y - 3, 14, 11); fill(ctx, c, x - 9, y - 9, 18, 9); fill(ctx, '#e5cf8a', x - 3, y - 8, 6, 5);
      fill(ctx, '#f4e4b0', x - 1, y - 7, 3, 3); fill(ctx, '#8d9b68', x - 13, y - 2, 5, 3); fill(ctx, '#8d9b68', x + 8, y - 2, 5, 3); break;
    case 'flickerling':
      fill(ctx, '#634c77', x - 5, y - 5, 10, 10); fill(ctx, c, x - 4, y - 6, 8, 8); fill(ctx, '#f0d1e4', x - 2, y - 3, 2, 2); fill(ctx, '#f0d1e4', x + 2, y - 3, 2, 2);
      fill(ctx, '#b791d0', x - 9, y - 1 + Math.sin(time * 14) * 2, 4, 2); fill(ctx, '#b791d0', x + 5, y - 3 - Math.sin(time * 14) * 2, 4, 2); break;
    case 'thornsentinel':
      fill(ctx, '#475545', x - 13, y - 3, 26, 16); fill(ctx, c, x - 11, y - 13, 22, 15); fill(ctx, '#c9bc82', x - 7, y - 11, 14, 7);
      fill(ctx, '#233235', x - 6, y - 8, 3, 3); fill(ctx, '#233235', x + 3, y - 8, 3, 3);
      for (let i = -1; i <= 1; i++) fill(ctx, '#b7c77a', x + i * 7 - 2, y - 17, 4, 6);
      if (enemy.shield > 0) { ctx.save(); ctx.globalAlpha = .30 + Math.sin(time * 5) * .08; ctx.strokeStyle = '#a9d4a1'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(x, y, 20, 0, Math.PI * 2); ctx.stroke(); ctx.restore(); }
      break;
    default:
      fill(ctx, c, x - 7, y - 7, 14, 14); fill(ctx, '#202d2a', x - 3, y - 2, 2, 2); fill(ctx, '#202d2a', x + 2, y - 2, 2, 2);
  }
  if (enemy.telegraph > 0) {
    ctx.save(); ctx.globalAlpha = .48 + Math.sin(time * 18) * .15; ctx.strokeStyle = '#f08c67'; ctx.lineWidth = 1;
    if (enemy.attackMode === 'charge') {
      line(ctx, '#e58062', x, y, enemy.targetX, enemy.targetY, 2);
    } else {
      ctx.beginPath(); ctx.arc(enemy.targetX ?? x, enemy.targetY ?? y, enemy.attackMode === 'slam' ? 25 : 12, 0, Math.PI * 2); ctx.stroke();
    }
    ctx.restore();
  }
  // tiny health strip for wounded threats
  if (enemy.hp < enemy.maxHp) {
    fill(ctx, '#192524', x - enemy.radius, y - enemy.radius - 5, enemy.radius * 2, 2);
    fill(ctx, '#d66e62', x - enemy.radius, y - enemy.radius - 5, Math.max(1, enemy.radius * 2 * enemy.hp / enemy.maxHp), 2);
  }
}

function drawBoss(ctx, enemy, time) {
  const x = Math.round(enemy.x); const y = Math.round(enemy.y);
  const pulse = Math.sin(time * 3) * 1.5;
  ctx.save(); ctx.globalAlpha = .15 + Math.sin(time * 2) * .025; ctx.fillStyle = '#dc9569'; ctx.beginPath(); ctx.arc(x, y, 40 + pulse, 0, Math.PI * 2); ctx.fill(); ctx.restore();
  fill(ctx, '#42493c', x - 24, y - 12, 48, 30);
  fill(ctx, '#64764e', x - 22, y - 26, 44, 28);
  fill(ctx, '#81925a', x - 18, y - 28, 36, 15);
  fill(ctx, '#b5a771', x - 12, y - 21, 24, 9);
  fill(ctx, '#e2a268', x - 8, y - 19, 5, 4); fill(ctx, '#e2a268', x + 4, y - 19, 5, 4);
  fill(ctx, '#263331', x - 6, y - 17, 3, 2); fill(ctx, '#263331', x + 3, y - 17, 3, 2);
  for (let i = -2; i <= 2; i++) {
    const rise = Math.sin(time * 5 + i) * 2;
    fill(ctx, i % 2 ? '#798a54' : '#95a666', x + i * 9 - 2, y - 33 - rise, 5, 10);
    fill(ctx, '#c5b574', x + i * 9 - 1, y - 37 - rise, 3, 5);
  }
  fill(ctx, '#536548', x - 27, y - 5, 8, 15); fill(ctx, '#536548', x + 19, y - 5, 8, 15);
  if (enemy.telegraph > 0 && enemy.attackMode === 'slam') {
    ctx.save(); ctx.globalAlpha = .42 + Math.sin(time * 16) * .12; ctx.strokeStyle = '#ed9465'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(enemy.targetX ?? x, enemy.targetY ?? y, 30, 0, Math.PI * 2); ctx.stroke(); ctx.restore();
  }
  if (enemy.telegraph > 0 && enemy.attackMode === 'fan') {
    ctx.save(); ctx.globalAlpha = .4 + Math.sin(time * 16) * .1; ctx.strokeStyle = '#ed9465'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(enemy.targetX ?? x, enemy.targetY ?? y); ctx.stroke(); ctx.restore();
  }
  if (enemy.hp < enemy.maxHp) {
    fill(ctx, '#1a2422', x - 29, y - 45, 58, 3);
    fill(ctx, '#e38965', x - 29, y - 45, 58 * Math.max(0, enemy.hp / enemy.maxHp), 3);
  }
}

export function drawProjectile(ctx, p) {
  if (p.friendly) {
    const color = p.element === 'Fire' ? '#f19960' : p.element === 'Lightning' ? '#f3d774' : '#c4d9a0';
    fill(ctx, 'rgba(255,220,140,.25)', p.x - 4, p.y - 4, 8, 8);
    fill(ctx, color, p.x - 2, p.y - 2, 4, 4);
    fill(ctx, '#fff0b3', p.x - 1, p.y - 1, 2, 2);
  } else {
    fill(ctx, 'rgba(239,143,103,.2)', p.x - 4, p.y - 4, 8, 8);
    fill(ctx, '#ee946b', p.x - 2, p.y - 2, 4, 4);
  }
}

export function drawChest(ctx, chest, time) {
  const bob = chest.open ? 0 : Math.sin(time * 4) * 1;
  const x = Math.round(chest.x); const y = Math.round(chest.y + bob);
  fill(ctx, 'rgba(0,0,0,.3)', x - 12, y + 7, 24, 4);
  fill(ctx, '#634936', x - 10, y - 6, 20, 12);
  fill(ctx, chest.open ? '#795840' : '#9c7046', x - 10, y - 7, 20, 8);
  fill(ctx, '#d1a45b', x - 11, y - 2, 22, 3); fill(ctx, '#e2c47e', x - 2, y - 3, 4, 6);
  if (chest.open) {
    fill(ctx, '#513a2c', x - 10, y - 7, 20, 4);
    fill(ctx, '#f3d481', x - 7, y - 12, 14, 4);
    ctx.save(); ctx.globalAlpha = .2 + Math.sin(time * 7) * .06; fill(ctx, '#f6d47d', x - 20, y - 24, 40, 30); ctx.restore();
  } else if (chest.shake > 0) {
    fill(ctx, '#f2d27b', x - 1, y - 1, 2, 2);
  }
}

export function drawDrop(ctx, drop, time) {
  const bob = Math.sin(time * 5 + drop.phase) * 2;
  const x = Math.round(drop.x); const y = Math.round(drop.y + bob);
  const col = drop.type === 'weapon' ? rarityColor(WEAPONS[drop.weapon]?.rarity || 'Common') : drop.type === 'coins' ? '#efc56d' : drop.type === 'heal' ? '#e98e78' : '#a4d88f';
  ctx.save(); ctx.globalAlpha = .16 + Math.sin(time * 5 + drop.phase) * .04; fill(ctx, col, x - 9, y - 9, 18, 18); ctx.restore();
  fill(ctx, '#172421', x - 4, y - 4, 8, 8); fill(ctx, col, x - 3, y - 4, 6, 7); fill(ctx, '#fff0bb', x - 1, y - 3, 2, 2);
}

export function drawBuffIcon(ctx, buffId, x, y, size = 10) {
  const colors = { cinderblood: '#e88359', splitseed: '#9bc47f', ironbark: '#8aa872', quickbloom: '#79c7a7', stormpollen: '#edcb69' };
  fill(ctx, '#253731', x, y, size, size);
  fill(ctx, colors[buffId] || '#cad19a', x + 2, y + 2, size - 4, size - 4);
  fill(ctx, '#f4e0a2', x + size / 2 - 1, y + 2, 2, size - 4);
}

export function drawHeroPortrait(ctx, heroId, x, y, scale = 1) {
  ctx.save(); ctx.translate(x, y); ctx.scale(scale, scale);
  fill(ctx, '#1b2a29', -16, -16, 32, 32);
  if (heroId === 'sable') {
    fill(ctx, '#647951', -10, -2, 20, 14); fill(ctx, '#263b38', -8, -12, 16, 12); fill(ctx, '#b9af77', -6, -8, 12, 7);
    fill(ctx, '#1b2d30', -4, -7, 2, 2); fill(ctx, '#1b2d30', 3, -7, 2, 2); fill(ctx, '#e98750', -2, 3, 4, 4);
    fill(ctx, '#eab66a', 7, 1, 8, 4); fill(ctx, '#6c503b', 10, 4, 2, 9);
  } else {
    fill(ctx, '#48786f', -8, -2, 16, 13); fill(ctx, '#d3b16c', -7, -12, 14, 12); fill(ctx, '#f0d68e', -5, -10, 10, 7);
    fill(ctx, '#352f2b', -3, -7, 2, 2); fill(ctx, '#352f2b', 2, -7, 2, 2); fill(ctx, '#75c4b2', -13, -1, 5, 4); fill(ctx, '#75c4b2', 8, 2, 6, 4);
    fill(ctx, '#f1bd5d', 8, -8, 6, 6); fill(ctx, '#fff1ad', 10, -6, 3, 3);
  }
  ctx.restore();
}

export function drawWeaponGlyph(ctx, weaponId, x, y, size = 16) {
  const w = WEAPONS[weaponId];
  const col = ELEMENT_COLORS[w?.element] || '#ded2aa';
  fill(ctx, '#1c2c2d', x, y, size, size);
  if (w?.kind === 'melee') { fill(ctx, '#805b40', x + size / 2 - 1, y + 6, 3, size - 8); fill(ctx, '#e9c77a', x + 3, y + 3, size - 6, 4); }
  else if (w?.kind === 'spread') { fill(ctx, '#81523d', x + 3, y + 7, size - 6, 5); fill(ctx, '#ed9b60', x + 5, y + 4, size - 10, 5); fill(ctx, '#f3d48e', x + 7, y + 3, 3, 4); }
  else if (w?.kind === 'chain') { fill(ctx, '#827b4e', x + 7, y + 3, 3, size - 6); fill(ctx, col, x + 4, y + 3, 9, 3); fill(ctx, '#fff1a8', x + 7, y + 6, 3, 3); }
  else { fill(ctx, '#8f7651', x + 3, y + 7, size - 6, 3); fill(ctx, col, x + 9, y + 4, 4, 8); fill(ctx, '#fff0b2', x + 12, y + 6, 2, 2); }
}

export function drawBar(ctx, x, y, w, h, value, max, fillColor, bg = '#263330') {
  fill(ctx, bg, x, y, w, h);
  if (max > 0) fill(ctx, fillColor, x, y, Math.max(0, Math.min(w, w * value / max)), h);
  fill(ctx, 'rgba(255,255,255,.12)', x, y, w, 1);
}
