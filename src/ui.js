import { C, WIDTH } from './constants.js';
import { HEROES, WEAPONS, BUFFS, SHOP_STOCK, rarityColor } from './content.js';
import { drawBar, drawBuffIcon, drawHeroPortrait, drawWeaponGlyph, panel, text } from './art.js';

export const MENU_BUTTONS = [
  { id: 'start', label: 'BEGIN EXPEDITION', x: 42, y: 103, w: 190, h: 21, hotkey: 'ENTER' },
  { id: 'hub', label: 'LANTERN HALL', x: 42, y: 128, w: 190, h: 21 },
  { id: 'help', label: 'FIELD GUIDE', x: 42, y: 153, w: 190, h: 21 },
  { id: 'collection', label: 'ARCHIVE', x: 42, y: 178, w: 190, h: 21 },
  { id: 'settings', label: 'SETTINGS', x: 42, y: 203, w: 190, h: 21 },
  { id: 'exit', label: 'CLOSE GAME', x: 42, y: 228, w: 190, h: 21 },
];
export const SELECT_CARDS = [
  { id: 'sable', x: 37, y: 74, w: 196, h: 126 },
  { id: 'luma', x: 247, y: 74, w: 196, h: 126 },
];
export const SELECT_BUTTONS = [
  { id: 'back', label: 'BACK', x: 38, y: 220, w: 88, h: 24 },
  { id: 'begin', label: 'ENTER THE GLOAM', x: 255, y: 220, w: 188, h: 24 },
];
export const HUB_BUTTONS = [
  { id: 'start', label: 'START AN EXPEDITION', x: 286, y: 100, w: 158, h: 24 },
  { id: 'upgrade', label: 'FORGE +1 HEART', x: 286, y: 129, w: 158, h: 23 },
  { id: 'collection', label: 'OPEN ARCHIVE', x: 286, y: 157, w: 158, h: 23 },
  { id: 'menu', label: 'MAIN MENU', x: 286, y: 185, w: 158, h: 23 },
];
export const PAUSE_BUTTONS = [
  { id: 'resume', label: 'RESUME', x: 158, y: 83, w: 164, h: 21 },
  { id: 'build', label: 'BUILD & INVENTORY', x: 158, y: 108, w: 164, h: 21 },
  { id: 'settings', label: 'SETTINGS', x: 158, y: 133, w: 164, h: 21 },
  { id: 'restart', label: 'RESTART RUN', x: 158, y: 158, w: 164, h: 21 },
  { id: 'hub', label: 'RETURN TO HALL', x: 158, y: 183, w: 164, h: 21 },
];
export const RESULTS_BUTTONS = [
  { id: 'again', label: 'TRY ANOTHER RUN', x: 310, y: 221, w: 136, h: 23 },
  { id: 'hub', label: 'RETURN TO HALL', x: 162, y: 221, w: 137, h: 23 },
];
export const BUFF_CARDS = [
  { x: 35, y: 95, w: 130, h: 103 },
  { x: 175, y: 95, w: 130, h: 103 },
  { x: 315, y: 95, w: 130, h: 103 },
];
export const SHOP_CARDS = [
  { x: 35, y: 87, w: 128, h: 114 },
  { x: 176, y: 87, w: 128, h: 114 },
  { x: 317, y: 87, w: 128, h: 114 },
];
export const EVENT_CARDS = [
  { x: 43, y: 103, w: 124, h: 88 },
  { x: 178, y: 103, w: 124, h: 88 },
  { x: 313, y: 103, w: 124, h: 88 },
];

export function inside(x, y, r) { return x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h; }

export function drawButton(ctx, input, item, options = {}) {
  const hover = inside(input.pointer.x, input.pointer.y, item);
  const active = options.active || false;
  const x = item.x; const y = item.y; const w = item.w; const h = item.h;
  const fillColor = active || hover ? '#425646' : '#263833';
  ctx.fillStyle = 'rgba(0,0,0,.28)'; ctx.fillRect(x + 2, y + 3, w, h);
  ctx.fillStyle = fillColor; ctx.fillRect(x, y, w, h);
  ctx.fillStyle = active || hover ? '#e8ca82' : '#64755e'; ctx.fillRect(x, y, w, 1); ctx.fillRect(x, y + h - 1, w, 1);
  ctx.fillRect(x, y, 1, h); ctx.fillRect(x + w - 1, y, 1, h);
  if (hover) ctx.fillStyle = '#f0cc78'; else ctx.fillStyle = '#8da27b';
  ctx.fillRect(x + 6, y + h / 2 - 1, 3, 3);
  text(ctx, item.label, x + 15, y + (h - 9) / 2, 8, active || hover ? '#fff0c8' : '#d8d8b8', 'left', 700);
  if (options.sub) text(ctx, options.sub, x + w - 7, y + (h - 7) / 2, 6, '#a2ad91', 'right', 500);
  return hover;
}

export function drawMenu(ctx, game) {
  text(ctx, 'A LANTERNFALL EXPEDITION', 43, 36, 7, '#91a78a', 'left', 500);
  text(ctx, 'GLOAM', 39, 47, 31, '#f0dfb6', 'left', 800);
  text(ctx, 'FORGE', 40, 74, 27, '#e6aa64', 'left', 800);
  text(ctx, 'A dungeon with a pulse.', 43, 91, 7, '#a5b29c', 'left', 500);
  panel(ctx, 36, 99, 204, 157, { fill: 'rgba(17,29,31,.92)', border: '#485b4e' });
  for (const button of MENU_BUTTONS) drawButton(ctx, game.input, button, { active: button.id === game.menuFocus });

  // Original low-resolution character vignette, animated in the distant ruins.
  const sway = Math.sin(game.time * .8) * 2;
  drawHeroPortrait(ctx, 'sable', 342 + sway, 168, 2.55);
  drawHeroPortrait(ctx, 'luma', 397 - sway, 178, 1.55);
  ctx.globalAlpha = .5 + Math.sin(game.time * 1.5) * .08;
  ctx.fillStyle = '#e9bd68'; ctx.fillRect(357, 112, 4, 4); ctx.fillRect(374, 103, 2, 2); ctx.fillRect(418, 117, 3, 3);
  ctx.globalAlpha = 1;
  panel(ctx, 264, 213, 177, 32, { fill: 'rgba(17,29,31,.85)', border: '#46594c' });
  text(ctx, 'A ROOTBOUND ROGUELIKE', 352, 220, 7, '#e6d6a9', 'center', 600);
  text(ctx, `BUILD ${game.version}`, 352, 231, 6, '#849581', 'center', 500);
  if (game.toast) text(ctx, game.toast, 240, 257, 7, '#f1d58d', 'center', 600);
}

export function drawCharacterSelect(ctx, game) {
  drawHeader(ctx, 'CHOOSE YOUR WAYFARER', 'Two paths into the same dark.');
  for (const card of SELECT_CARDS) {
    const hero = HEROES[card.id];
    const hover = inside(game.input.pointer.x, game.input.pointer.y, card);
    const selected = game.selectedHero === card.id;
    panel(ctx, card.x, card.y, card.w, card.h, { fill: selected ? '#263c37' : '#1b2c2c', border: selected || hover ? '#d4b86f' : '#516452' });
    drawHeroPortrait(ctx, hero.id, card.x + 31, card.y + 42, 1.2);
    text(ctx, hero.name.toUpperCase(), card.x + 57, card.y + 12, 13, '#f0dfb6', 'left', 800);
    text(ctx, hero.title, card.x + 57, card.y + 29, 7, hero.accent, 'left', 600);
    text(ctx, hero.callout, card.x + 12, card.y + 64, 6, '#a8b39e', 'left', 500);
    text(ctx, `HP ${hero.maxHp}   SPEED ${hero.speed}`, card.x + 12, card.y + 78, 6, '#d4d6b3', 'left', 500);
    text(ctx, `PASSIVE  ${hero.passiveName}`, card.x + 12, card.y + 91, 6, '#e3c77f', 'left', 600);
    text(ctx, hero.passive, card.x + 12, card.y + 101, 6, '#9aa995', 'left', 500);
    text(ctx, `SKILL  ${hero.skillName}`, card.x + 12, card.y + 114, 6, '#87d2bd', 'left', 600);
  }
  drawButton(ctx, game.input, SELECT_BUTTONS[0]);
  drawButton(ctx, game.input, SELECT_BUTTONS[1], { active: true });
  text(ctx, 'A / D OR ← / → TO SELECT   •   ENTER TO BEGIN', 240, 252, 6, '#899783', 'center', 500);
}

export function drawHub(ctx, game) {
  drawHeader(ctx, 'THE LANTERN HALL', 'A quiet place between dangerous places.');
  panel(ctx, 31, 67, 235, 172, { fill: '#1a2a29', border: '#50624d' });
  // central living forge
  ctx.fillStyle = '#263c35'; ctx.fillRect(67, 93, 160, 107);
  ctx.fillStyle = '#405940'; ctx.fillRect(80, 182, 135, 9);
  ctx.fillStyle = '#667a50'; ctx.fillRect(99, 156, 14, 33); ctx.fillRect(179, 156, 14, 33);
  ctx.fillStyle = '#826447'; ctx.fillRect(112, 151, 68, 37); ctx.fillStyle = '#b27e4f'; ctx.fillRect(119, 142, 54, 10);
  ctx.fillStyle = '#e87f52'; ctx.fillRect(136, 154, 23, 20); ctx.fillStyle = '#f3c571'; ctx.fillRect(142, 151, 11, 13);
  ctx.globalAlpha = .18 + Math.sin(game.time * 4) * .04; ctx.fillStyle = '#f1b968'; ctx.fillRect(126, 130, 44, 40); ctx.globalAlpha = 1;
  drawHeroPortrait(ctx, game.lastHero || 'sable', 147, 120, 1.2);
  text(ctx, 'THE LAST LANTERN', 148, 205, 7, '#e8d4a6', 'center', 700);
  text(ctx, 'A root remembers every footstep.', 148, 218, 6, '#92a28d', 'center', 500);

  panel(ctx, 278, 67, 174, 172, { fill: '#192827', border: '#50624d' });
  text(ctx, 'WAYFARER LEDGER', 291, 79, 7, '#9eaf94', 'left', 600);
  text(ctx, `${game.save.memory} MEMORY SHARDS`, 291, 91, 11, '#f0cf7d', 'left', 800);
  text(ctx, `Runs ${game.save.stats.runs}  •  Best floor ${game.save.stats.bestFloor}`, 291, 109, 6, '#9aa995', 'left', 500);
  text(ctx, `Permanent heart knots: ${game.save.permanentHp}/5`, 291, 121, 6, '#9aa995', 'left', 500);
  for (const item of HUB_BUTTONS) {
    const sub = item.id === 'upgrade' ? (game.save.permanentHp >= 5 ? 'MAX' : '12 SHARDS') : '';
    drawButton(ctx, game.input, item, { sub, active: item.id === 'start' });
  }
  text(ctx, 'LAST RUN', 36, 76, 6, '#8ba08c', 'left', 500);
  const last = game.save.lastRun;
  if (last) {
    text(ctx, `${last.outcome?.toUpperCase() || 'ENDED'}  •  FLOOR ${last.floor || 1}`, 37, 88, 7, '#e6d6a9', 'left', 600);
    text(ctx, `${last.kills || 0} foes  •  ${last.rooms || 0} rooms  •  ${last.time || '—'}`, 37, 100, 6, '#9aa995', 'left', 500);
  } else text(ctx, 'No expedition recorded yet.', 37, 91, 7, '#a4ad98', 'left', 500);
}

export function drawRunHud(ctx, game) {
  const run = game.run;
  const hero = HEROES[run.heroId];
  panel(ctx, 29, 24, 151, 35, { fill: 'rgba(17,29,31,.91)', border: '#52644f' });
  drawHeroPortrait(ctx, hero.id, 48, 42, .48);
  text(ctx, hero.name.toUpperCase(), 62, 28, 7, '#eee0b6', 'left', 700);
  text(ctx, `${Math.ceil(run.player.hp)} / ${run.player.maxHp} HP`, 62, 39, 6, '#b1c0a5', 'left', 500);
  drawBar(ctx, 62, 49, 106, 4, run.player.hp, run.player.maxHp, '#d97565');
  if (run.player.armor > 0) text(ctx, `◇ ${run.player.armor}`, 170, 28, 6, '#8bd1c0', 'right', 600);
  text(ctx, `FLOOR ${run.floor}  /  ${run.currentNode?.type?.toUpperCase() || 'ROOM'}`, 240, 29, 6, '#c0c5a6', 'center', 600);
  drawMinimap(ctx, game, 375, 24, 72, 62);

  // bottom equipment and progress strip
  panel(ctx, 29, 222, 422, 27, { fill: 'rgba(17,29,31,.94)', border: '#52644f' });
  for (let i = 0; i < 2; i++) {
    const x = 36 + i * 28;
    drawWeaponGlyph(ctx, run.weapons[i], x, 227, 16);
    if (run.activeSlot === i) { ctx.strokeStyle = '#f0ce78'; ctx.strokeRect(x - 1, 226, 18, 18); }
    text(ctx, `${i + 1}`, x + 8, 244, 5, '#9ba68e', 'center', 500);
  }
  text(ctx, 'Q SWAP', 93, 230, 5, '#909f8d', 'left', 500);
  panel(ctx, 130, 226, 23, 19, { fill: '#263a35', border: '#6a7958' });
  text(ctx, hero.skillName.split(' ')[0].toUpperCase(), 141, 229, 5, '#a5d9c1', 'center', 600);
  drawBar(ctx, 132, 239, 19, 3, Math.max(0, hero.skillCooldown - run.player.skillCd), hero.skillCooldown, '#7dd4bd', '#283632');
  text(ctx, 'E', 141, 244, 5, '#b1c7ae', 'center', 500);
  const weapon = WEAPONS[run.weapons[run.activeSlot]];
  drawWeaponGlyph(ctx, weapon.id, 161, 227, 16);
  text(ctx, weapon.name.toUpperCase(), 181, 228, 6, '#ece1bb', 'left', 600);
  text(ctx, `${weapon.category} · ${weapon.element} · ${weapon.rarity}`, 181, 238, 5, rarityColor(weapon.rarity), 'left', 500);
  drawBar(ctx, 305, 229, 82, 4, run.xp, run.xpNext, '#93c9a0', '#34443b');
  text(ctx, `LV ${run.level}`, 305, 237, 5, '#d9dfb6', 'left', 500);
  text(ctx, `✦ ${run.coins}`, 440, 230, 7, '#efc56d', 'right', 700);
  // active buffs
  run.buffs.slice(0, 5).forEach((buff, i) => {
    drawBuffIcon(ctx, buff.id, 392 + i * 10, 229, 9);
    if (buff.stacks > 1) text(ctx, buff.stacks, 400 + i * 10, 238, 5, '#fff0c7', 'center', 600);
  });
  text(ctx, 'WASD MOVE  ·  MOUSE / Z ATTACK  ·  SHIFT DODGE  ·  E SKILL  ·  F INTERACT  ·  TAB BUILD', 240, 258, 5, 'rgba(220,224,193,.67)', 'center', 500);

  const hint = game.getInteractionHint();
  if (hint) {
    panel(ctx, 158, 201, 164, 17, { fill: 'rgba(16,26,27,.92)', border: '#8f9d68' });
    text(ctx, hint, 240, 205, 7, '#f2d98f', 'center', 700);
  }
  if (game.boss && game.boss.alive) {
    panel(ctx, 155, 4, 170, 16, { fill: 'rgba(19,28,28,.95)', border: '#865a50' });
    text(ctx, game.boss.name.toUpperCase(), 240, 7, 6, '#f2c184', 'center', 700);
    drawBar(ctx, 164, 16, 152, 2, game.boss.hp, game.boss.maxHp, '#dd785f', '#513d38');
  }
}

function drawMinimap(ctx, game, x, y, w, h) {
  panel(ctx, x, y, w, h, { fill: 'rgba(17,29,31,.92)', border: '#4a6050' });
  const nodes = game.map.nodes;
  const visible = new Set();
  for (const node of nodes) {
    if (node.visited || node.id === game.currentNode.id) {
      visible.add(node.id);
      for (const id of game.map.linkMap[node.id] || []) visible.add(id);
    }
  }
  const minX = Math.min(...nodes.map((n) => n.x)); const maxX = Math.max(...nodes.map((n) => n.x));
  const minY = Math.min(...nodes.map((n) => n.y)); const maxY = Math.max(...nodes.map((n) => n.y));
  const sx = (w - 16) / Math.max(1, maxX - minX); const sy = (h - 18) / Math.max(1, maxY - minY);
  const scale = Math.min(14, sx, sy);
  const ox = x + w / 2 - ((minX + maxX) / 2) * scale;
  const oy = y + h / 2 - ((minY + maxY) / 2) * scale;
  ctx.save(); ctx.globalAlpha = .75; ctx.strokeStyle = '#708269'; ctx.lineWidth = 1;
  for (const [a, b] of game.map.links) {
    if (!visible.has(a) || !visible.has(b)) continue;
    const na = game.map.byId[a]; const nb = game.map.byId[b];
    ctx.beginPath(); ctx.moveTo(ox + na.x * scale, oy + na.y * scale); ctx.lineTo(ox + nb.x * scale, oy + nb.y * scale); ctx.stroke();
  }
  ctx.restore();
  for (const node of nodes) {
    if (!visible.has(node.id)) continue;
    const px = ox + node.x * scale; const py = oy + node.y * scale;
    const current = node.id === game.currentNode.id;
    const color = current ? '#f0cb75' : (node.visited ? ({ start: '#7dbfa2', boss: '#e88767', treasure: '#edcf77', shop: '#8fc5d3', elite: '#d99078', shrine: '#bd9bd1' }[node.type] || '#9aa88a') : '#738174');
    ctx.fillStyle = color; ctx.fillRect(Math.round(px - (current ? 3 : 2)), Math.round(py - (current ? 3 : 2)), current ? 6 : 4, current ? 6 : 4);
    if (!node.visited && !current) { ctx.fillStyle = 'rgba(17,27,29,.75)'; ctx.fillRect(px - 1, py - 1, 2, 2); }
  }
}

export function drawPause(ctx, game) {
  ctx.fillStyle = 'rgba(6,13,15,.73)'; ctx.fillRect(0, 0, WIDTH, 270);
  panel(ctx, 145, 47, 190, 170, { fill: '#1a2b2b', border: '#7a805e' });
  text(ctx, 'PAUSED', 240, 58, 15, '#f1dfb5', 'center', 800);
  text(ctx, `RUN SEED ${game.run.seed}`, 240, 75, 6, '#9ba996', 'center', 500);
  for (const button of game.ui.PAUSE_BUTTONS) drawButton(ctx, game.input, button);
}

export function drawBuffChoice(ctx, game) {
  ctx.fillStyle = 'rgba(8,14,16,.78)'; ctx.fillRect(0, 0, WIDTH, HEIGHT);
  panel(ctx, 26, 37, 428, 193, { fill: '#192928', border: '#8b8c5e' });
  text(ctx, 'A NEW KNOT IN THE WEAVE', 240, 48, 13, '#f2dfb8', 'center', 800);
  text(ctx, `LEVEL ${game.run.level}  ·  CHOOSE ONE`, 240, 66, 6, '#aab49a', 'center', 600);
  game.buffChoices.forEach((buffId, i) => {
    const r = game.ui.BUFF_CARDS[i]; const buff = BUFFS[buffId]; const hover = inside(game.input.pointer.x, game.input.pointer.y, r);
    panel(ctx, r.x, r.y, r.w, r.h, { fill: hover ? '#34453b' : '#233632', border: hover ? '#efcc7a' : '#607358' });
    drawBuffIcon(ctx, buffId, r.x + 10, r.y + 12, 15);
    text(ctx, buff.name.toUpperCase(), r.x + 33, r.y + 14, 7, '#eee0b6', 'left', 700);
    text(ctx, buff.rarity.toUpperCase(), r.x + 12, r.y + 35, 5, rarityColor(buff.rarity), 'left', 500);
    wrapText(ctx, buff.description, r.x + 12, r.y + 49, r.w - 22, 6, '#aeb8a1', 3);
    text(ctx, `${buff.stacks ? '' : ''}${(game.run.buffs.find((b) => b.id === buffId)?.stacks || 0)} / ${buff.maxStacks} STACKS`, r.x + 12, r.y + 83, 5, '#869782', 'left', 500);
    text(ctx, `${i + 1}  ·  SELECT`, r.x + r.w / 2, r.y + 91, 5, '#e1c57b', 'center', 600);
  });
  text(ctx, 'TAKE A MOMENT — THE DUNGEON IS HELD', 240, 211, 6, '#899b8c', 'center', 500);
}

export function drawShop(ctx, game) {
  ctx.fillStyle = 'rgba(6,12,13,.80)'; ctx.fillRect(0, 0, WIDTH, HEIGHT);
  panel(ctx, 22, 30, 436, 210, { fill: '#1a2a28', border: '#987654' });
  text(ctx, 'THE MOSSBACK COUNTER', 240, 40, 12, '#f2dfb8', 'center', 800);
  text(ctx, `AMBER  ${game.run.coins}   ·   A GOOD PRICE, IF YOU ASK NICELY`, 240, 59, 6, '#e6c47e', 'center', 600);
  game.shopItems.forEach((item, i) => {
    const r = game.ui.SHOP_CARDS[i]; const hover = inside(game.input.pointer.x, game.input.pointer.y, r);
    panel(ctx, r.x, r.y, r.w, r.h, { fill: hover ? '#34443b' : '#233431', border: item.bought ? '#6d755d' : hover ? '#e6c174' : '#586b56' });
    const icon = item.type === 'weapon' ? item.weapon : item.type === 'heal' ? 'heart' : item.type === 'buff' ? item.buff : 'coins';
    if (WEAPONS[icon]) drawWeaponGlyph(ctx, icon, r.x + 10, r.y + 10, 19);
    else { ctx.fillStyle = item.type === 'heal' ? '#d87b6b' : item.type === 'buff' ? '#85b07d' : '#e6c174'; ctx.fillRect(r.x + 11, r.y + 12, 17, 15); }
    text(ctx, item.name.toUpperCase(), r.x + 37, r.y + 12, 6, '#eee1bc', 'left', 700);
    wrapText(ctx, item.description, r.x + 10, r.y + 39, r.w - 18, 5, '#a5b19d', 3);
    text(ctx, item.bought ? 'SOLD' : `${item.price} AMBER`, r.x + r.w / 2, r.y + 82, 7, item.bought ? '#88917e' : '#edca77', 'center', 700);
    text(ctx, item.bought ? '—' : 'CLICK TO BUY', r.x + r.w / 2, r.y + 97, 5, '#a5b29b', 'center', 500);
  });
  text(ctx, 'F OR CLICK OUTSIDE TO LEAVE', 240, 214, 6, '#a8b39f', 'center', 500);
}

export function drawEvent(ctx, game) {
  ctx.fillStyle = 'rgba(7,14,16,.78)'; ctx.fillRect(0, 0, WIDTH, HEIGHT);
  panel(ctx, 28, 43, 424, 184, { fill: '#1a2c2b', border: '#96865b' });
  text(ctx, game.eventData.title, 240, 55, 12, '#f0ddb2', 'center', 800);
  text(ctx, game.eventData.subtitle, 240, 74, 6, '#a9b39a', 'center', 500);
  game.eventData.options.forEach((option, i) => {
    const r = game.ui.EVENT_CARDS[i]; const hover = inside(game.input.pointer.x, game.input.pointer.y, r);
    panel(ctx, r.x, r.y, r.w, r.h, { fill: hover ? '#3a4b3c' : '#233733', border: hover ? '#e8c676' : '#5a6e56' });
    text(ctx, option.title.toUpperCase(), r.x + r.w / 2, r.y + 13, 7, '#e8d8ad', 'center', 700);
    wrapText(ctx, option.description, r.x + 9, r.y + 31, r.w - 18, 5, '#aeb8a2', 4);
    text(ctx, `${i + 1} · CHOOSE`, r.x + r.w / 2, r.y + 73, 5, '#dfc174', 'center', 600);
  });
}

export function drawBuild(ctx, game) {
  ctx.fillStyle = 'rgba(6,12,13,.84)'; ctx.fillRect(0, 0, WIDTH, HEIGHT);
  panel(ctx, 24, 24, 432, 218, { fill: '#192928', border: '#71835e' });
  text(ctx, 'FIELD NOTES · YOUR BUILD', 240, 34, 12, '#f0dfb7', 'center', 800);
  const hero = HEROES[game.run.heroId];
  drawHeroPortrait(ctx, hero.id, 58, 84, 1.1);
  text(ctx, `${hero.name.toUpperCase()}  /  ${hero.title}`, 83, 57, 7, '#e6d4a8', 'left', 700);
  text(ctx, `HP ${Math.ceil(game.run.player.hp)} / ${game.run.player.maxHp}`, 83, 72, 6, '#d8bcb0', 'left', 500);
  text(ctx, `SPEED ${Math.round(game.run.player.speed)}  ·  CRIT ${Math.round(game.run.player.crit * 100)}%`, 83, 83, 6, '#9fb39f', 'left', 500);
  text(ctx, `DAMAGE DEALT ${game.run.stats.damageDealt}  ·  ARMOR ${game.run.player.armor}`, 83, 94, 6, '#9fb39f', 'left', 500);
  panel(ctx, 35, 117, 196, 91, { fill: '#213330', border: '#526550' });
  text(ctx, 'CARRIED WEAPONS', 47, 126, 6, '#a8b49d', 'left', 600);
  game.run.weapons.forEach((id, i) => {
    const weapon = WEAPONS[id]; drawWeaponGlyph(ctx, id, 47, 140 + i * 27, 16);
    text(ctx, `${i + 1}. ${weapon.name}`, 69, 141 + i * 27, 6, '#e6d8ad', 'left', 600);
    text(ctx, `${weapon.category} · ${weapon.element} · ${weapon.damage} DMG`, 69, 151 + i * 27, 5, '#97a692', 'left', 500);
  });
  panel(ctx, 244, 55, 198, 153, { fill: '#213330', border: '#526550' });
  text(ctx, `ACTIVE KNOTS (${game.run.buffs.length})`, 256, 65, 6, '#a8b49d', 'left', 600);
  if (!game.run.buffs.length) text(ctx, 'No run buffs yet. Find a bright choice.', 256, 83, 6, '#8b9b8c', 'left', 500);
  game.run.buffs.forEach((buff, i) => {
    const y = 82 + i * 22;
    drawBuffIcon(ctx, buff.id, 256, y, 11);
    text(ctx, `${BUFFS[buff.id].name}  ×${buff.stacks}`, 273, y, 6, '#e3d9b5', 'left', 600);
    text(ctx, BUFFS[buff.id].effect, 273, y + 9, 5, '#92a191', 'left', 500);
  });
  drawButton(ctx, game.input, { id: 'back', label: 'BACK TO THE ROOM', x: 155, y: 216, w: 170, h: 19 });
}

export function drawSettings(ctx, game) {
  drawBackdropForPanel(ctx);
  drawHeader(ctx, 'SETTINGS', 'Make the lantern comfortable to carry.');
  panel(ctx, 70, 68, 340, 160, { fill: '#192a29', border: '#56694f' });
  const rows = [
    { key: 'master', label: 'MASTER VOLUME', y: 101 },
    { key: 'music', label: 'MUSIC', y: 136 },
    { key: 'sfx', label: 'SOUND EFFECTS', y: 171 },
  ];
  rows.forEach((row) => {
    text(ctx, row.label, 96, row.y - 5, 7, '#e2d6b1', 'left', 600);
    const r = { x: 230, y: row.y - 3, w: 144, h: 8 };
    ctx.fillStyle = '#31423b'; ctx.fillRect(r.x, r.y, r.w, r.h);
    ctx.fillStyle = '#d8b965'; ctx.fillRect(r.x, r.y, r.w * game.save.settings[row.key], r.h);
    ctx.fillStyle = '#f0d487'; ctx.fillRect(r.x + r.w * game.save.settings[row.key] - 3, r.y - 3, 6, 14);
    text(ctx, `${Math.round(game.save.settings[row.key] * 100)}%`, 390, row.y - 5, 6, '#b7c1a9', 'right', 500);
  });
  const shake = { x: 94, y: 193, w: 180, h: 20 };
  drawButton(ctx, game.input, { id: 'shake', label: `SCREEN SHAKE  ${game.save.settings.shake ? 'ON' : 'OFF'}`, ...shake });
  drawButton(ctx, game.input, { id: 'back', label: 'BACK', x: 320, y: 193, w: 70, h: 20 });
  text(ctx, 'CLICK AND DRAG A BAR TO ADJUST', 240, 214, 5, '#829181', 'center', 500);
}

export function drawCollection(ctx, game) {
  drawHeader(ctx, 'THE ARCHIVE', 'What the roots have witnessed so far.');
  panel(ctx, 31, 67, 418, 174, { fill: '#192a29', border: '#55694f' });
  const categories = [
    ['WEAPONS', Object.values(WEAPONS).map((w) => ({ name: w.name, id: w.id, discovered: game.save.discoveries.weapons.includes(w.id) }))],
    ['FOES', Object.values(game.contentEnemies).filter((e) => e.role !== 'elite').map((e) => ({ name: e.name, id: e.id, discovered: game.save.discoveries.enemies.includes(e.id) }))],
    ['KNOTS', Object.values(BUFFS).map((b) => ({ name: b.name, id: b.id, discovered: game.save.discoveries.buffs.includes(b.id) }))],
  ];
  categories.forEach(([label, entries], col) => {
    const x = 48 + col * 130;
    text(ctx, label, x, 80, 7, '#e3c97f', 'left', 700);
    entries.forEach((item, i) => {
      const y = 99 + i * 23;
      drawWeaponGlyph(ctx, col === 0 ? item.id : Object.keys(WEAPONS)[(i + col) % 5], x, y, 14);
      text(ctx, item.discovered ? item.name : '???  UNSEEN', x + 20, y + 1, 6, item.discovered ? '#d9dec0' : '#758276', 'left', 500);
      text(ctx, item.discovered ? 'RECORDED' : 'UNKNOWN', x + 20, y + 10, 5, item.discovered ? '#819980' : '#627068', 'left', 500);
    });
  });
  text(ctx, `RUNS ${game.save.stats.runs}  ·  WINS ${game.save.stats.wins}  ·  FOES ${game.save.stats.enemies}`, 240, 224, 6, '#a4b09b', 'center', 500);
  drawButton(ctx, game.input, { id: 'back', label: 'BACK', x: 38, y: 242, w: 72, h: 18 });
}

export function drawHelp(ctx, game) {
  drawHeader(ctx, 'FIELD GUIDE', 'A few good habits for the Gloam.');
  panel(ctx, 36, 68, 408, 169, { fill: '#192a29', border: '#55694f' });
  const left = [
    ['MOVE', 'WASD / arrows — eight directions; walls and stone stop you.'],
    ['AIM & ATTACK', 'Mouse aim + left-click, or press Z to attack.'],
    ['DODGE', 'Shift — brief invulnerability; mind the recovery.'],
    ['CHARACTER SKILL', 'E — a room-changing move with its own cooldown.'],
    ['INTERACT', 'F near a chest, altar, shop counter, or exit.'],
  ];
  const right = [
    ['WEAPON SWAP', 'Q swaps your two carried weapons; 1 / 2 selects.'],
    ['BUILD NOTES', 'Tab opens your current weapons, stats and knot synergies.'],
    ['ROOM ROUTES', 'The minimap shows visited rooms and reachable branches.'],
    ['LEVEL UP', 'Choose one of three knots; the fight pauses while you decide.'],
    ['SEED', 'Pause to see a run seed. Same seed reproduces the room graph.'],
  ];
  [left, right].forEach((col, j) => col.forEach(([title, desc], i) => {
    const x = 51 + j * 196; const y = 82 + i * 29;
    text(ctx, title, x, y, 6, '#e6ca80', 'left', 700);
    wrapText(ctx, desc, x, y + 10, 180, 5, '#aab59f', 2);
  }));
  drawButton(ctx, game.input, { id: 'back', label: 'BACK', x: 38, y: 242, w: 72, h: 18 });
}

export function drawResults(ctx, game) {
  drawBackdropForPanel(ctx);
  const run = game.endedRun;
  const won = run.outcome === 'victory';
  panel(ctx, 26, 22, 428, 226, { fill: '#172827', border: won ? '#ddb967' : '#8b6654' });
  text(ctx, won ? 'THE GLOAM REMEMBERS' : 'THE LANTERN GOES QUIET', 240, 34, 15, won ? '#f2d17f' : '#e8aa8c', 'center', 800);
  text(ctx, `${HEROES[run.heroId].name}  ·  ${won ? 'EXPEDITION COMPLETE' : 'EXPEDITION ENDED'}  ·  SEED ${run.seed}`, 240, 56, 6, '#a5b39c', 'center', 500);
  const stats = [
    ['FLOOR REACHED', `${run.floor} / 3`], ['ROOMS CLEARED', run.stats.roomsCleared], ['FOES DEFEATED', run.stats.enemiesDefeated],
    ['BOSSES DEFEATED', run.stats.bossesDefeated], ['DAMAGE DEALT', Math.round(run.stats.damageDealt)], ['DAMAGE TAKEN', Math.round(run.stats.damageTaken)],
    ['AMBER COLLECTED', run.stats.coinsCollected], ['KNOTS GATHERED', run.buffs.reduce((a, b) => a + b.stacks, 0)],
  ];
  stats.forEach(([label, value], i) => {
    const col = i % 2; const row = Math.floor(i / 2); const x = col ? 260 : 47; const y = 82 + row * 27;
    text(ctx, label, x, y, 6, '#8fa18e', 'left', 500);
    text(ctx, value, x + 160, y - 1, 9, '#eadfbc', 'right', 700);
  });
  text(ctx, `+${run.rewardMemory} MEMORY SHARDS  ·  ${run.outcome === 'victory' ? 'A NEW PATH OPENS' : 'THE ROOTS KEEP YOUR FINDINGS'}`, 240, 198, 7, '#e7c873', 'center', 700);
  text(ctx, game.resultMessage || '', 240, 210, 5, '#9aaa94', 'center', 500);
  drawButton(ctx, game.input, RESULTS_BUTTONS[1]);
  drawButton(ctx, game.input, RESULTS_BUTTONS[0], { active: true });
}

function drawHeader(ctx, title, subtitle) {
  text(ctx, 'GLOAMFORGE  /  LANTERNFALL', 36, 23, 6, '#879888', 'left', 500);
  text(ctx, title, 240, 38, 16, '#f0dfb6', 'center', 800);
  text(ctx, subtitle, 240, 57, 6, '#a2ae9a', 'center', 500);
}
function drawBackdropForPanel(ctx) {
  ctx.fillStyle = '#101b1e'; ctx.fillRect(0, 0, WIDTH, 270);
  ctx.fillStyle = '#1c302e'; ctx.fillRect(0, 180, WIDTH, 90);
  ctx.fillStyle = '#283c35'; ctx.fillRect(0, 167, WIDTH, 12);
  ctx.fillStyle = 'rgba(220,193,127,.06)'; ctx.fillRect(30, 60, 420, 1);
}
function wrapText(ctx, value, x, y, width, size, color, maxLines = 3) {
  ctx.save(); ctx.font = `500 ${size}px 'DM Mono', monospace`; ctx.textBaseline = 'top'; ctx.fillStyle = color; ctx.shadowColor = 'rgba(0,0,0,.35)'; ctx.shadowBlur = 1;
  const words = String(value).split(' '); let lineText = ''; let lineNo = 0;
  for (const word of words) {
    const test = lineText ? `${lineText} ${word}` : word;
    if (ctx.measureText(test).width > width && lineText) {
      ctx.fillText(lineText, x, y + lineNo * (size + 2)); lineNo++; lineText = word;
      if (lineNo >= maxLines) break;
    } else lineText = test;
  }
  if (lineNo < maxLines && lineText) ctx.fillText(lineText, x, y + lineNo * (size + 2));
  ctx.restore();
}
