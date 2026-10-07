import { HEIGHT, WIDTH, clamp, dist, norm } from './constants.js';
import { CLASSES, WEAPONS, rarityColor } from './content.js';
import { makeRng } from './rng.js';
import { persistSave } from './save.js';
import { drawClassPortrait, drawClassSprite, drawWeaponGlyph, panel, text } from './art.js';
import { drawButton, inside } from './ui.js';

const UPGRADE_COSTS = [10, 18, 30, 46, 66];
const UPGRADE_TRACKS = [
  { id: 'vitality', name: 'HEART KNOT', detail: '+1 starting Health per rank', color: '#d77e69' },
  { id: 'reservoir', name: 'DEEP WELL', detail: '+12 max Energy and regen', color: '#69bda9' },
  { id: 'mastery', name: 'SKILLCRAFT', detail: '+4% skill power, −1 cost', color: '#d7b76b' },
];
const ROOM_TITLES = { sanctum: 'LANTERN HALL', classes: 'CLASS HALL', farm: 'ROOT FARM', weapons: 'WEAPON HALL', workshop: 'MECHANICS WORKSHOP' };
const PLOT_POINTS = [[138, 150], [240, 150], [342, 150]];
const RACK_POINTS = [[76, 99], [157, 99], [238, 99], [319, 99], [400, 99]];
const GROW_MS = 18000;

const RECT = (x, y, w, h) => ({ x, y, w, h });

export function enterHubRoom(game, room = 'sanctum', spawn = null) {
  game.hubRoom = room;
  game.hubOverlay = 'none';
  game.hubPrompt = '';
  game.hubPlayer ||= { x: 240, y: 188, aim: { x: 1, y: 0 }, moving: false };
  const positions = {
    sanctum: [240, 188], classes: [240, 215], farm: [428, 136], weapons: [52, 136], workshop: [240, 52],
  };
  const [x, y] = spawn || positions[room] || positions.sanctum;
  game.hubPlayer.x = x; game.hubPlayer.y = y; game.hubPlayer.moving = false;
}

export function updateHub(game, dt) {
  game.hubTestCooldown = Math.max(0, (game.hubTestCooldown || 0) - dt);
  game.hubTestFlash = Math.max(0, (game.hubTestFlash || 0) - dt);
  if (game.hubOverlay !== 'none') {
    updateHubOverlay(game);
    return;
  }
  if (game.input.wasPressed('escape')) {
    game.screen = 'menu'; game.sound.setTrack('menu');
    return;
  }
  const player = game.hubPlayer;
  const dx = (game.input.isDown('d') || game.input.isDown('arrowright') ? 1 : 0) - (game.input.isDown('a') || game.input.isDown('arrowleft') ? 1 : 0);
  const dy = (game.input.isDown('s') || game.input.isDown('arrowdown') ? 1 : 0) - (game.input.isDown('w') || game.input.isDown('arrowup') ? 1 : 0);
  const moving = Math.hypot(dx, dy) > .1;
  player.moving = moving;
  if (moving) {
    const direction = norm(dx, dy);
    player.aim = direction;
    player.x = clamp(player.x + direction.x * 78 * dt, 22, WIDTH - 22);
    player.y = clamp(player.y + direction.y * 78 * dt, 36, HEIGHT - 24);
  }
  game.hubTarget = findHubTarget(game);
  game.hubPrompt = game.hubTarget?.prompt || '';
  if (game.input.wasPressed('e')) interactHub(game, game.hubTarget);
  if (game.hubRoom === 'weapons' && (game.input.isDown('space') || game.input.pointer.down)) testWeapon(game, dt);
}

function updateHubOverlay(game) {
  const input = game.input;
  const overlay = game.hubOverlay;
  if (overlay === 'dialogue') {
    if (input.wasPressed('escape')) { game.hubOverlay = 'none'; return; }
    if (input.wasPressed('space') || input.pointer.pressed) {
      game.dialogueIndex++;
      if (game.dialogueIndex >= game.dialogueLines.length) game.hubOverlay = 'none';
    }
    return;
  }
  if (input.wasPressed('escape')) {
    game.hubOverlay = overlay === 'ticket' ? 'prep' : 'none';
    return;
  }
  if (overlay === 'class') {
    const id = game.classPanelId || game.selectedClass;
    const tracks = UPGRADE_TRACKS.map((track, i) => RECT(43 + i * 132, 122, 126, 65));
    const classTabs = [{ id: 'vanguard', ...RECT(280, 43, 75, 16) }, { id: 'ranger', ...RECT(360, 43, 75, 16) }];
    if (input.pointer.pressed) {
      const tab = classTabs.find((r) => inside(input.pointer.x, input.pointer.y, r));
      if (tab) { game.classPanelId = tab.id; return; }
      const trackIndex = tracks.findIndex((r) => inside(input.pointer.x, input.pointer.y, r));
      if (trackIndex >= 0) { buyClassUpgrade(game, id, UPGRADE_TRACKS[trackIndex].id); return; }
      if (inside(input.pointer.x, input.pointer.y, RECT(42, 211, 124, 23))) { selectClass(game, id); return; }
      if (inside(input.pointer.x, input.pointer.y, RECT(178, 211, 124, 23))) { startClassDialogue(game, id); return; }
      if (inside(input.pointer.x, input.pointer.y, RECT(314, 211, 124, 23))) { game.hubOverlay = 'none'; return; }
    }
    if (input.wasPressed('enter')) selectClass(game, id);
    return;
  }
  if (overlay === 'ticket') {
    if (input.wasPressed('1')) chooseTicket(game, 0);
    if (input.wasPressed('2')) chooseTicket(game, 1);
    if (input.wasPressed('3')) chooseTicket(game, 2);
    if (input.pointer.pressed) {
      const i = ticketRects().findIndex((r) => inside(input.pointer.x, input.pointer.y, r));
      if (i >= 0) chooseTicket(game, i);
    }
    return;
  }
  if (overlay === 'prep') {
    if (input.pointer.pressed) {
      if (inside(input.pointer.x, input.pointer.y, RECT(43, 204, 120, 24))) {
        game.hubOverlay = 'none'; enterHubRoom(game, 'classes', [240, 205]); return;
      }
      if (inside(input.pointer.x, input.pointer.y, RECT(180, 204, 120, 24))) { openTicketChoice(game); return; }
      if (inside(input.pointer.x, input.pointer.y, RECT(317, 204, 120, 24))) { launchExpedition(game); return; }
    }
    if (input.wasPressed('enter')) launchExpedition(game);
    return;
  }
  if (overlay === 'weapon') {
    if (input.pointer.pressed) {
      if (inside(input.pointer.x, input.pointer.y, RECT(95, 205, 142, 24))) setPreparedLoadout(game, game.weaponPanelId);
      else if (inside(input.pointer.x, input.pointer.y, RECT(246, 205, 142, 24))) game.hubOverlay = 'none';
    }
  }
}

function findHubTarget(game) {
  const x = game.hubPlayer.x; const y = game.hubPlayer.y;
  const targets = [];
  if (game.hubRoom === 'sanctum') {
    targets.push(
      { id: 'classes', x: 240, y: 40, r: 31, prompt: '[ E ]  ENTER THE CLASS HALL', action: 'room', room: 'classes', spawn: [240, 218] },
      { id: 'farm', x: 32, y: 135, r: 31, prompt: '[ E ]  VISIT THE ROOT FARM', action: 'room', room: 'farm', spawn: [430, 135] },
      { id: 'weapons', x: 448, y: 135, r: 31, prompt: '[ E ]  ENTER THE WEAPON HALL', action: 'room', room: 'weapons', spawn: [50, 135] },
      { id: 'workshop', x: 240, y: 237, r: 31, prompt: '[ E ]  ENTER THE WORKSHOP', action: 'room', room: 'workshop', spawn: [240, 48] },
      { id: 'gate', x: 362, y: 171, r: 31, prompt: '[ E ]  PREPARE FOR AN EXPEDITION', action: 'prep' },
    );
  } else if (game.hubRoom === 'classes') {
    targets.push(
      { id: 'vanguard', x: 147, y: 126, r: 32, prompt: '[ E ]  SPEAK WITH THE VANGUARD', action: 'class', classId: 'vanguard' },
      { id: 'ranger', x: 333, y: 126, r: 32, prompt: '[ E ]  SPEAK WITH THE RANGER', action: 'class', classId: 'ranger' },
      { id: 'exit', x: 240, y: 237, r: 31, prompt: '[ E ]  RETURN TO THE LANTERN HALL', action: 'room', room: 'sanctum', spawn: [240, 55] },
    );
  } else if (game.hubRoom === 'farm') {
    PLOT_POINTS.forEach(([px, py], index) => targets.push({ id: `plot-${index}`, x: px, y: py, r: 27, prompt: plotPrompt(game, index), action: 'plot', index }));
    targets.push({ id: 'exit', x: 451, y: 135, r: 31, prompt: '[ E ]  RETURN TO THE LANTERN HALL', action: 'room', room: 'sanctum', spawn: [57, 135] });
  } else if (game.hubRoom === 'weapons') {
    Object.keys(WEAPONS).forEach((weaponId, index) => {
      const [wx, wy] = RACK_POINTS[index];
      targets.push({ id: `weapon-${weaponId}`, x: wx, y: wy, r: 25, prompt: `[ E ]  INSPECT ${WEAPONS[weaponId].name.toUpperCase()}`, action: 'weapon', weaponId });
    });
    targets.push({ id: 'exit', x: 29, y: 135, r: 31, prompt: '[ E ]  RETURN TO THE LANTERN HALL', action: 'room', room: 'sanctum', spawn: [420, 135] });
  } else if (game.hubRoom === 'workshop') {
    targets.push(
      { id: 'ticket-loom', x: 240, y: 124, r: 40, prompt: '[ E ]  USE THE WEAPON-TICKET LOOM', action: 'ticket' },
      { id: 'exit', x: 240, y: 31, r: 31, prompt: '[ E ]  RETURN TO THE LANTERN HALL', action: 'room', room: 'sanctum', spawn: [240, 215] },
    );
  }
  return targets.map((target) => ({ ...target, distance: dist(x, y, target.x, target.y) }))
    .filter((target) => target.distance <= target.r).sort((a, b) => a.distance - b.distance)[0] || null;
}

function plotPrompt(game, index) {
  const plot = game.save.farm.plots[index];
  if (!plot) return game.save.farm.seeds > 0 ? `[ E ]  PLANT PLOT ${index + 1}` : 'NO SEEDS · VISIT AFTER AN EXPEDITION';
  const ready = Date.now() - plot.plantedAt >= GROW_MS;
  return ready ? `[ E ]  HARVEST PLOT ${index + 1}` : `GROWING ${Math.ceil((GROW_MS - (Date.now() - plot.plantedAt)) / 1000)}s`;
}

function interactHub(game, target) {
  if (!target) { game.showToast('NOTHING CLOSE ENOUGH TO INTERACT WITH', 1.4); return; }
  game.sound.play('portal', .35);
  if (target.action === 'room') enterHubRoom(game, target.room, target.spawn);
  else if (target.action === 'prep') game.hubOverlay = 'prep';
  else if (target.action === 'class') { game.classPanelId = target.classId; game.hubOverlay = 'class'; }
  else if (target.action === 'plot') tendPlot(game, target.index);
  else if (target.action === 'weapon') { game.weaponPanelId = target.weaponId; game.hubOverlay = 'weapon'; }
  else if (target.action === 'ticket') openTicketChoice(game);
}

function tendPlot(game, index) {
  const plot = game.save.farm.plots[index];
  if (!plot) {
    if (game.save.farm.seeds <= 0) { game.showToast('NO SEEDS LEFT. HARVEST A CROP OR RETURN AFTER A RUN.'); return; }
    game.save.farm.seeds--;
    game.save.farm.plots[index] = { plantedAt: Date.now(), crop: 'rootbean' };
    persistSave(game.save); game.sound.play('pickup', .55); game.showToast('ROOTBEAN SEED PLANTED · IT WILL MATURE HERE.');
    return;
  }
  const elapsed = Date.now() - plot.plantedAt;
  if (elapsed < GROW_MS) { game.showToast(`NOT RIPE YET · ${Math.ceil((GROW_MS - elapsed) / 1000)} SECONDS REMAIN.`, 1.6); return; }
  game.save.farm.plots[index] = null;
  game.save.farm.rootFiber++;
  game.save.farm.seeds = Math.min(99, game.save.farm.seeds + 1);
  persistSave(game.save); game.sound.play('pickup'); game.showToast('HARVESTED ROOT FIBER · ONE SEED RETURNED.');
}

function openTicketChoice(game) {
  if (game.save.weaponTickets <= 0 && game.save.farm.rootFiber >= 5) {
    game.save.farm.rootFiber -= 5;
    game.save.weaponTickets++;
    persistSave(game.save);
    game.showToast('FIVE ROOT FIBER WOVEN INTO A WEAPON TICKET.');
  }
  if (game.save.weaponTickets <= 0) {
    game.showToast('NO WEAPON TICKETS · CLEAR AN EXPEDITION OR WEAVE ONE FROM FIVE ROOT FIBER.');
    return;
  }
  const primary = CLASSES[game.selectedClass]?.primary;
  const pool = Object.keys(WEAPONS).filter((id) => id !== primary);
  const rng = makeRng((Date.now() ^ Math.imul(game.save.stats.runs + 1, 0x45d9f3b)) >>> 0);
  game.ticketChoices = [];
  while (game.ticketChoices.length < 3 && pool.length) game.ticketChoices.push(pool.splice(Math.floor(rng() * pool.length), 1)[0]);
  game.hubOverlay = 'ticket';
}

function chooseTicket(game, index) {
  const weaponId = game.ticketChoices?.[index];
  if (!weaponId || game.save.weaponTickets <= 0) return;
  game.save.weaponTickets--;
  game.save.preparedWeapon = weaponId;
  game.preparedWeapon = weaponId;
  persistSave(game.save);
  game.hubOverlay = 'prep';
  game.sound.play('level');
  game.showToast(`${WEAPONS[weaponId].name.toUpperCase()} READY AS YOUR TICKET PICK.`);
}

function launchExpedition(game) {
  const classId = game.selectedClass || game.save.lastClass || 'vanguard';
  const ticketWeapon = game.preparedWeapon || game.save.preparedWeapon;
  game.hubOverlay = 'none';
  game.preparedWeapon = null;
  game.startNewRun(classId, ticketWeapon);
}

function selectClass(game, classId) {
  if (!CLASSES[classId] || !game.save.unlockedClasses.includes(classId)) return;
  game.selectedClass = classId;
  game.lastClass = classId;
  game.save.lastClass = classId;
  persistSave(game.save);
  game.sound.play('level', .75);
  game.showToast(`${CLASSES[classId].name.toUpperCase()} SELECTED FOR THE NEXT EXPEDITION.`);
}

function buyClassUpgrade(game, classId, trackId) {
  const upgrade = game.save.classUpgrades[classId];
  if (!upgrade || !UPGRADE_TRACKS.some((track) => track.id === trackId)) return;
  const tier = upgrade[trackId];
  if (tier >= UPGRADE_COSTS.length) { game.showToast('THIS CLASS PATH IS FULLY WOVEN.'); return; }
  const cost = UPGRADE_COSTS[tier];
  if (game.save.memory < cost) { game.showToast(`NEED ${cost} MEMORY SHARDS FOR THIS CLASS KNOT.`); game.sound.play('hurt', .35); return; }
  game.save.memory -= cost;
  upgrade[trackId]++;
  persistSave(game.save);
  game.sound.play('level');
  game.showToast(`${UPGRADE_TRACKS.find((track) => track.id === trackId).name} RANK ${upgrade[trackId]} WOVEN.`);
}

function setPreparedLoadout(game, weaponId) {
  const classInfo = CLASSES[game.selectedClass];
  if (!game.save.discoveries.weapons.includes(weaponId)) {
    game.showToast('THIS WEAPON MUST BE FOUND ON AN EXPEDITION BEFORE IT CAN BE CARRIED.');
    return;
  }
  if (weaponId === classInfo.primary) { game.showToast('THAT IS ALREADY YOUR PRIMARY WEAPON.'); return; }
  game.save.loadouts[game.selectedClass] = weaponId;
  persistSave(game.save);
  game.sound.play('pickup');
  game.showToast(`${WEAPONS[weaponId].name.toUpperCase()} SET AS ${classInfo.name.toUpperCase()} SECONDARY.`);
}

function startClassDialogue(game, classId) {
  const lines = classId === 'vanguard'
    ? [
      ['Vanguard', 'The hall was built around a root that remembers every name. I keep its doors.'],
      ['Vanguard', 'I do not need you fearless. I need you watching the space beside you.'],
      ['Vanguard', 'Bring a little quiet back from below. The forge has had enough of screaming.'],
    ]
    : [
      ['Ranger', 'I used to carry messages through the upper boughs. The lantern learned all my shortcuts.'],
      ['Ranger', 'When the wick turns blue, breathe once. Then move before the dark decides for you.'],
      ['Ranger', 'If you find a song down there, bring back the last note. I will know where it belongs.'],
    ];
  game.dialogueLines = lines;
  game.dialogueIndex = 0;
  game.hubOverlay = 'dialogue';
}

function testWeapon(game) {
  const player = game.hubPlayer;
  if (dist(player.x, player.y, 240, 181) > 86 || game.hubTestCooldown > 0) return;
  const classInfo = CLASSES[game.selectedClass];
  const weaponId = game.save.loadouts[game.selectedClass] || classInfo.primary;
  const weapon = WEAPONS[weaponId];
  if (!weapon) return;
  game.hubTestCooldown = weapon.interval;
  game.hubTestFlash = .28;
  game.hubTestDamage = weapon.damage * (weapon.kind === 'spread' ? weapon.projectiles : 1);
  game.sound.play(weapon.kind === 'melee' ? 'swing' : 'shoot', .55);
  game.showToast(`${weapon.name.toUpperCase()}  ·  TEST IMPACT ${game.hubTestDamage}`, 1.1);
}

function ticketRects() { return [RECT(39, 99, 128, 92), RECT(176, 99, 128, 92), RECT(313, 99, 128, 92)]; }

export function drawHubWorld(ctx, game) {
  drawHubFloor(ctx, game.hubRoom);
  if (game.hubRoom === 'sanctum') drawSanctum(ctx, game);
  else if (game.hubRoom === 'classes') drawClassHall(ctx, game);
  else if (game.hubRoom === 'farm') drawFarm(ctx, game);
  else if (game.hubRoom === 'weapons') drawWeaponHall(ctx, game);
  else drawWorkshop(ctx, game);
  drawHubActors(ctx, game);
  drawHubLabels(ctx, game);
  if (game.toast && game.toastTimer > 0) {
    panel(ctx, 116, 211, 248, 18, { fill: 'rgba(15,25,25,.92)', border: 'rgba(162,170,115,.62)' });
    text(ctx, game.toast, 240, 217, 6, '#ead897', 'center', 600);
  } else if (game.hubPrompt) {
    panel(ctx, 126, 231, 228, 19, { fill: 'rgba(15,25,25,.93)', border: '#8e9e71' });
    text(ctx, game.hubPrompt, 240, 237, 6, '#f0d58a', 'center', 700);
  }
}

function drawHubFloor(ctx, room) {
  ctx.fillStyle = '#111d20'; ctx.fillRect(0, 0, WIDTH, HEIGHT);
  ctx.fillStyle = '#34433a'; ctx.fillRect(9, 11, 462, 248);
  ctx.fillStyle = '#6c6d4e'; ctx.fillRect(14, 16, 452, 238);
  ctx.fillStyle = '#293c37'; ctx.fillRect(18, 20, 444, 230);
  const colors = ['#2a3e38', '#2d4139', '#30443b', '#293b36'];
  for (let y = 25; y < 246; y += 22) for (let x = 23; x < 458; x += 24) {
    const i = ((x / 24 | 0) * 7 + (y / 22 | 0) * 3) % colors.length;
    ctx.fillStyle = colors[i]; ctx.fillRect(x, y, 22, 20);
    ctx.fillStyle = 'rgba(181,188,132,.08)'; ctx.fillRect(x + 3, y + 3, 3, 1);
  }
  ctx.fillStyle = '#182827'; ctx.fillRect(0, 0, WIDTH, 16); ctx.fillRect(0, HEIGHT - 13, WIDTH, 13);
  ctx.fillStyle = '#50614c'; ctx.fillRect(10, 13, 460, 4); ctx.fillRect(10, 253, 460, 4);
  ctx.fillStyle = '#142322'; ctx.fillRect(12, 17, 5, 235); ctx.fillRect(463, 17, 5, 235);
  if (room !== 'sanctum') {
    ctx.fillStyle = '#597150'; ctx.fillRect(228, 17, 24, 4); ctx.fillRect(228, 249, 24, 4);
  }
}

function drawSanctum(ctx, game) {
  drawDoor(ctx, 240, 25, 'CLASS HALL', '#91b186', 'up');
  drawDoor(ctx, 24, 135, 'ROOT FARM', '#93c595', 'left');
  drawDoor(ctx, 456, 135, 'WEAPON HALL', '#e0c579', 'right');
  drawDoor(ctx, 240, 245, 'WORKSHOP', '#cf956a', 'down');
  drawLantern(ctx, 240, 117, game.time, 1.35);
  drawBench(ctx, 187, 145); drawBench(ctx, 270, 145);
  drawClassSprite(ctx, 'vanguard', 184, 136, { x: 1, y: 0 }, game.time, Math.sin(game.time * .5) > .96, 0, 0, 0);
  drawClassSprite(ctx, 'ranger', 297, 137, { x: -1, y: 0 }, game.time + 1, Math.sin(game.time * .7) > .96, 0, 0, 0);
  sign(ctx, 172, 155, 'CLASS HALL'); sign(ctx, 300, 155, 'READY ROOM');
  drawPortalMark(ctx, 362, 179, game.time);
  text(ctx, 'EXPEDITION GATE', 362, 199, 5, '#d6d5a0', 'center', 600);
  drawWallLamp(ctx, 66, 42, game.time); drawWallLamp(ctx, 414, 42, game.time + 2);
}

function drawClassHall(ctx, game) {
  drawDoor(ctx, 240, 245, 'RETURN', '#91b186', 'down');
  for (const [id, x] of [['vanguard', 147], ['ranger', 333]]) {
    drawPedestal(ctx, x, 145, id === game.selectedClass);
    drawClassSprite(ctx, id, x, 119, { x: 0, y: 1 }, game.time + (id === 'ranger' ? 1 : 0), false, 0, 0, 0);
    sign(ctx, x, 166, CLASSES[id].name.toUpperCase());
    text(ctx, CLASSES[id].title.toUpperCase(), x, 177, 5, CLASSES[id].accent, 'center', 600);
  }
  drawRug(ctx, 201, 196, 78, 22, '#4e6551');
  drawWallLamp(ctx, 78, 53, game.time); drawWallLamp(ctx, 402, 53, game.time + 1);
  text(ctx, 'CLASS VOWS  ·  TRAINING  ·  HANGOUT', 240, 216, 5, '#9aa98d', 'center', 600);
}

function drawFarm(ctx, game) {
  drawDoor(ctx, 456, 135, 'RETURN', '#91b186', 'right');
  text(ctx, `ROOTBEAN SEEDS  ${game.save.farm.seeds}   ·   ROOT FIBER  ${game.save.farm.rootFiber}`, 240, 54, 7, '#d9d09d', 'center', 700);
  PLOT_POINTS.forEach(([x, y], index) => {
    const plot = game.save.farm.plots[index];
    ctx.fillStyle = '#172823'; ctx.fillRect(x - 39, y - 24, 78, 49);
    ctx.fillStyle = '#654e3a'; ctx.fillRect(x - 35, y - 19, 70, 39);
    ctx.fillStyle = '#836449'; ctx.fillRect(x - 34, y - 8, 68, 4); ctx.fillRect(x - 34, y + 4, 68, 4);
    ctx.fillStyle = '#4f7950'; ctx.fillRect(x - 30, y - 16, 60, 2);
    if (plot) {
      const progress = clamp((Date.now() - plot.plantedAt) / GROW_MS, 0, 1);
      const mature = progress >= 1;
      const height = 3 + Math.round(progress * 13);
      for (const offset of [-15, 0, 15]) {
        ctx.fillStyle = mature ? '#a7bf68' : '#77a46d'; ctx.fillRect(x + offset - 2, y - height, 5, height);
        ctx.fillStyle = mature ? '#e0cb79' : '#9aca83'; ctx.fillRect(x + offset - 5, y - height + 3, 4, 3);
        ctx.fillRect(x + offset + 1, y - height + 6, 4, 3);
      }
      if (mature) { ctx.fillStyle = '#efcf76'; ctx.fillRect(x - 3, y - 23, 6, 5); }
    } else {
      ctx.fillStyle = '#a58a58'; ctx.fillRect(x - 2, y - 3, 4, 4);
    }
    sign(ctx, x, y + 34, `PLOT ${index + 1}`);
  });
  drawWallLamp(ctx, 82, 49, game.time); drawWallLamp(ctx, 398, 49, game.time + 1.5);
  text(ctx, 'PLANT · WAIT · HARVEST', 240, 211, 6, '#9cb39a', 'center', 600);
}

function drawWeaponHall(ctx, game) {
  drawDoor(ctx, 24, 135, 'RETURN', '#91b186', 'left');
  ctx.fillStyle = '#675340'; ctx.fillRect(47, 68, 386, 8); ctx.fillRect(47, 112, 386, 7);
  for (let i = 0; i < 5; i++) {
    const weaponId = Object.keys(WEAPONS)[i]; const [x, y] = RACK_POINTS[i];
    ctx.fillStyle = '#785d40'; ctx.fillRect(x - 31, y - 11, 62, 34);
    ctx.fillStyle = '#a17b4f'; ctx.fillRect(x - 31, y - 11, 62, 3);
    drawWeaponGlyph(ctx, weaponId, x - 9, y - 4, 18);
    text(ctx, WEAPONS[weaponId].name.split(' ')[0].toUpperCase(), x, y + 15, 5, rarityColor(WEAPONS[weaponId].rarity), 'center', 600);
  }
  drawDummy(ctx, 240, 181, game.hubTestFlash || 0, game.hubTestDamage || 0);
  drawRug(ctx, 188, 206, 104, 12, '#53684d');
  text(ctx, 'TRAINING DUMMY  ·  SPACE / LEFT CLICK TO TEST', 240, 225, 5, '#a4b099', 'center', 600);
}

function drawWorkshop(ctx, game) {
  drawDoor(ctx, 240, 25, 'RETURN', '#91b186', 'up');
  drawAnvil(ctx, 115, 143);
  drawTicketLoom(ctx, 240, 126, game.time);
  drawWorkbench(ctx, 367, 145);
  sign(ctx, 115, 177, 'REPAIR'); sign(ctx, 240, 165, 'TICKET LOOM'); sign(ctx, 367, 180, 'ASSEMBLY');
  panel(ctx, 82, 194, 316, 24, { fill: 'rgba(20,31,29,.74)', border: '#5a6850' });
  text(ctx, `TICKETS ${game.save.weaponTickets}  ·  ROOT FIBER ${game.save.farm.rootFiber}  ·  5 FIBER = 1 TICKET`, 240, 202, 6, '#dbc985', 'center', 600);
}

function drawHubActors(ctx, game) {
  const player = game.hubPlayer;
  if (!player) return;
  const classId = game.selectedClass || game.save.lastClass || 'vanguard';
  ctx.fillStyle = 'rgba(0,0,0,.28)'; ctx.fillRect(Math.round(player.x - 9), Math.round(player.y + 8), 18, 4);
  drawClassSprite(ctx, classId, player.x, player.y, player.aim || { x: 1, y: 0 }, game.time, player.moving, 0, game.hubTestFlash || 0, 0);
}

function drawHubLabels(ctx, game) {
  panel(ctx, 7, 6, 143, 18, { fill: 'rgba(16,26,27,.92)', border: '#52644f' });
  text(ctx, ROOM_TITLES[game.hubRoom] || 'LANTERN HALL', 14, 12, 6, '#e9dbb5', 'left', 700);
  panel(ctx, 340, 6, 133, 18, { fill: 'rgba(16,26,27,.92)', border: '#52644f' });
  text(ctx, `${game.save.memory} MEMORY  ·  ${game.save.weaponTickets} TICKETS`, 406, 12, 5, '#e6ce88', 'center', 600);
}

function drawDoor(ctx, x, y, label, color, side) {
  if (side === 'left' || side === 'right') {
    const dx = side === 'left' ? 12 : 450;
    ctx.fillStyle = '#172522'; ctx.fillRect(dx, y - 28, 18, 56);
    ctx.fillStyle = '#726347'; ctx.fillRect(dx + 2, y - 26, 14, 52);
    ctx.fillStyle = '#20302c'; ctx.fillRect(dx + 5, y - 19, 8, 39);
    ctx.fillStyle = color; ctx.fillRect(dx + 4, y - 28, 10, 3);
    text(ctx, label, side === 'left' ? 40 : 440, y + 39, 4, color, 'center', 600);
  } else {
    const dy = side === 'up' ? 12 : 234;
    ctx.fillStyle = '#172522'; ctx.fillRect(x - 30, dy, 60, 18);
    ctx.fillStyle = '#726347'; ctx.fillRect(x - 27, dy + 2, 54, 14);
    ctx.fillStyle = '#20302c'; ctx.fillRect(x - 19, dy + 5, 38, 8);
    ctx.fillStyle = color; ctx.fillRect(x - 30, dy + 3, 3, 10);
    text(ctx, label, x, side === 'up' ? 36 : 227, 4, color, 'center', 600);
  }
}

function drawLantern(ctx, x, y, time, scale = 1) {
  ctx.save(); ctx.translate(x, y); ctx.scale(scale, scale);
  ctx.fillStyle = 'rgba(239,197,109,.08)'; ctx.fillRect(-33, -32, 66, 54);
  ctx.fillStyle = '#5d503d'; ctx.fillRect(-22, 17, 44, 5); ctx.fillRect(-15, 12, 30, 5);
  ctx.fillStyle = '#6e8054'; ctx.fillRect(-7, -10, 14, 25); ctx.fillRect(-13, -17, 26, 7);
  ctx.fillStyle = '#dbb66e'; ctx.fillRect(-7, -29, 14, 17); ctx.fillRect(-4, -33, 8, 4);
  ctx.fillStyle = '#fff0a5'; ctx.fillRect(-3, -24, 6, 10);
  ctx.globalAlpha = .2 + Math.sin(time * 4) * .05; ctx.fillStyle = '#ffd578'; ctx.fillRect(-15, -35, 30, 32); ctx.globalAlpha = 1;
  ctx.fillStyle = '#c1d095'; ctx.fillRect(-21, -12, 7, 3); ctx.fillRect(14, -15, 7, 3);
  ctx.restore();
}

function drawPortalMark(ctx, x, y, time) {
  const pulse = .5 + Math.sin(time * 3) * .08;
  ctx.save(); ctx.globalAlpha = pulse;
  ctx.strokeStyle = '#84cdbc'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.ellipse(x, y, 16, 23, 0, 0, Math.PI * 2); ctx.stroke();
  ctx.fillStyle = 'rgba(109,195,174,.12)'; ctx.beginPath(); ctx.ellipse(x, y, 12, 18, 0, 0, Math.PI * 2); ctx.fill();
  ctx.restore(); ctx.fillStyle = '#efc56d'; ctx.fillRect(x - 2, y - 9, 4, 19);
}

function drawClassPortraitLarge(ctx, classId, x, y, scale) { drawClassPortrait(ctx, classId, x, y, scale); }
function drawPedestal(ctx, x, y, selected) {
  ctx.fillStyle = 'rgba(0,0,0,.28)'; ctx.fillRect(x - 24, y + 8, 48, 8);
  ctx.fillStyle = selected ? '#afaa67' : '#777353'; ctx.fillRect(x - 23, y, 46, 8);
  ctx.fillStyle = selected ? '#d3c57a' : '#999064'; ctx.fillRect(x - 18, y - 4, 36, 6);
  ctx.fillStyle = '#455748'; ctx.fillRect(x - 14, y - 9, 28, 7);
}
function drawBench(ctx, x, y) {
  ctx.fillStyle = '#5f4a37'; ctx.fillRect(x - 20, y, 40, 5); ctx.fillRect(x - 15, y + 5, 4, 8); ctx.fillRect(x + 11, y + 5, 4, 8);
  ctx.fillStyle = '#9d7952'; ctx.fillRect(x - 18, y - 2, 36, 3);
}
function drawRug(ctx, x, y, w, h, color) {
  ctx.fillStyle = '#172722'; ctx.fillRect(x - 3, y - 3, w + 6, h + 6);
  ctx.fillStyle = color; ctx.fillRect(x, y, w, h);
  ctx.fillStyle = '#aa9c63'; ctx.fillRect(x + 3, y + 2, w - 6, 2);
}
function drawWallLamp(ctx, x, y, time) {
  ctx.fillStyle = '#73563d'; ctx.fillRect(x - 2, y - 4, 4, 10);
  ctx.fillStyle = '#e4b964'; ctx.fillRect(x - 4, y - 6, 8, 5);
  ctx.globalAlpha = .2 + Math.sin(time * 4) * .06; ctx.fillStyle = '#f4cb70'; ctx.fillRect(x - 9, y - 11, 18, 18); ctx.globalAlpha = 1;
  ctx.fillStyle = '#fff0ae'; ctx.fillRect(x - 1, y - 5, 2, 4);
}
function sign(ctx, x, y, label) {
  ctx.fillStyle = '#5a4633'; ctx.fillRect(x - 27, y - 5, 54, 10);
  ctx.fillStyle = '#a98a5b'; ctx.fillRect(x - 26, y - 5, 52, 2);
  text(ctx, label, x, y - 1, 4, '#e7d7aa', 'center', 700);
}
function drawDummy(ctx, x, y, flash, damage) {
  ctx.fillStyle = 'rgba(0,0,0,.3)'; ctx.fillRect(x - 17, y + 20, 34, 4);
  ctx.fillStyle = '#654a35'; ctx.fillRect(x - 4, y - 5, 8, 28); ctx.fillRect(x - 14, y + 18, 28, 4);
  ctx.fillStyle = flash > 0 ? '#fff0bd' : '#b59865'; ctx.fillRect(x - 13, y - 22, 26, 21);
  ctx.fillStyle = '#78533e'; ctx.fillRect(x - 8, y - 18, 16, 11);
  ctx.fillStyle = '#e1c37a'; ctx.fillRect(x - 4, y - 14, 8, 3);
  ctx.fillStyle = '#5b4935'; ctx.fillRect(x - 3, y - 4, 6, 3);
  if (flash > 0 && damage) { text(ctx, `${damage}`, x, y - 32, 7, '#f1d17d', 'center', 700); }
}
function drawAnvil(ctx, x, y) {
  ctx.fillStyle = '#563e32'; ctx.fillRect(x - 18, y + 3, 36, 14); ctx.fillRect(x - 12, y + 17, 24, 6);
  ctx.fillStyle = '#87938a'; ctx.fillRect(x - 21, y - 3, 42, 8); ctx.fillRect(x - 8, y - 9, 21, 7);
  ctx.fillStyle = '#c0c7af'; ctx.fillRect(x - 6, y - 8, 13, 3);
}
function drawTicketLoom(ctx, x, y, time) {
  ctx.fillStyle = '#6a5139'; ctx.fillRect(x - 27, y - 22, 54, 45);
  ctx.fillStyle = '#a98755'; ctx.fillRect(x - 25, y - 20, 50, 5);
  ctx.fillStyle = '#344841'; ctx.fillRect(x - 19, y - 11, 38, 26);
  ctx.fillStyle = '#d3b466'; ctx.fillRect(x - 14, y - 7, 28, 3); ctx.fillRect(x - 12, y, 24, 3);
  ctx.fillStyle = '#7bc4ad'; ctx.fillRect(x - 2, y - 12, 4, 29);
  ctx.globalAlpha = .3 + Math.sin(time * 3) * .08; ctx.fillStyle = '#8de0c5'; ctx.fillRect(x - 9, y - 16, 18, 35); ctx.globalAlpha = 1;
}
function drawWorkbench(ctx, x, y) {
  ctx.fillStyle = '#634936'; ctx.fillRect(x - 25, y - 11, 50, 22); ctx.fillRect(x - 19, y + 11, 5, 15); ctx.fillRect(x + 14, y + 11, 5, 15);
  ctx.fillStyle = '#a38252'; ctx.fillRect(x - 22, y - 13, 44, 4);
  ctx.fillStyle = '#84937b'; ctx.fillRect(x - 13, y - 8, 8, 6); ctx.fillStyle = '#d1aa63'; ctx.fillRect(x + 3, y - 7, 11, 5);
}

function drawHubOverlay(ctx, game) {
  ctx.fillStyle = 'rgba(5,11,13,.77)'; ctx.fillRect(0, 0, WIDTH, HEIGHT);
  const title = game.hubOverlay === 'class' ? 'CLASS HALL' : game.hubOverlay === 'ticket' ? 'WEAPON TICKET' : game.hubOverlay === 'prep' ? 'EXPEDITION PREPARATION' : game.hubOverlay === 'weapon' ? 'WEAPON REGISTER' : 'A MOMENT BY THE LANTERN';
  panel(ctx, 24, 24, 432, 222, { fill: '#192927', border: '#78845d' });
  text(ctx, title, 240, 32, 12, '#f0dfb6', 'center', 800);
  if (game.hubOverlay === 'class') drawClassPanel(ctx, game);
  else if (game.hubOverlay === 'ticket') drawTicketPanel(ctx, game);
  else if (game.hubOverlay === 'prep') drawPrepPanel(ctx, game);
  else if (game.hubOverlay === 'weapon') drawWeaponPanel(ctx, game);
  else if (game.hubOverlay === 'dialogue') drawDialoguePanel(ctx, game);
}

function drawClassPanel(ctx, game) {
  const classId = game.classPanelId || game.selectedClass;
  const classInfo = CLASSES[classId];
  const upgrades = game.save.classUpgrades[classId];
  drawClassPortraitLarge(ctx, classId, 69, 83, 1.28);
  text(ctx, classInfo.name.toUpperCase(), 101, 51, 13, '#f0dfb6', 'left', 800);
  text(ctx, classInfo.title.toUpperCase(), 101, 67, 7, classInfo.accent, 'left', 700);
  wrap(ctx, classInfo.callout, 101, 78, 8, '#b5c0a4', 196);
  text(ctx, `HP ${classInfo.maxHp + upgrades.vitality}   ARMOR ${classInfo.armor}   SPEED ${classInfo.speed}`, 43, 101, 6, '#d9dfbb', 'left', 600);
  text(ctx, `ENERGY ${classInfo.maxEnergy + upgrades.reservoir * 12}   REGEN ${classInfo.energyRegen + upgrades.reservoir * .65}/s`, 236, 101, 6, '#9ed7bf', 'left', 600);
  text(ctx, `PASSIVE · ${classInfo.passiveName}`, 43, 111, 6, '#e7ca7f', 'left', 700);
  text(ctx, classInfo.passive, 43, 119, 5, '#aeb9a2', 'left', 500);
  text(ctx, `STARTER · ${WEAPONS[classInfo.primary].name.toUpperCase()}`, 43, 129, 5, '#e4d29e', 'left', 600);
  UPGRADE_TRACKS.forEach((track, i) => {
    const rect = RECT(43 + i * 132, 135, 126, 52);
    const level = upgrades[track.id];
    const cost = level >= 5 ? 'MAX RANK' : `${UPGRADE_COSTS[level]} MEMORY`;
    panel(ctx, rect.x, rect.y, rect.w, rect.h, { fill: '#233733', border: track.color });
    text(ctx, track.name, rect.x + 8, rect.y + 7, 6, track.color, 'left', 800);
    text(ctx, track.detail, rect.x + 8, rect.y + 19, 5, '#b8c2a9', 'left', 500);
    text(ctx, `RANK ${level}/5  ·  ${cost}`, rect.x + 8, rect.y + 37, 5, '#e7d8a9', 'left', 600);
  });
  drawButton(ctx, game.input, { id: 'choose', label: game.selectedClass === classId ? 'CLASS SELECTED' : 'SELECT THIS CLASS', ...RECT(42, 211, 124, 23) }, { active: game.selectedClass === classId });
  drawButton(ctx, game.input, { id: 'hangout', label: 'HANG OUT', ...RECT(178, 211, 124, 23) });
  drawButton(ctx, game.input, { id: 'close', label: 'BACK TO THE HALL', ...RECT(314, 211, 124, 23) });
  drawButton(ctx, game.input, { id: 'vanguard', label: 'VANGUARD', ...RECT(280, 43, 75, 16) }, { active: classId === 'vanguard' });
  drawButton(ctx, game.input, { id: 'ranger', label: 'RANGER', ...RECT(360, 43, 75, 16) }, { active: classId === 'ranger' });
  text(ctx, `SKILL · ${classInfo.skillName}  ·  ${classInfo.skillCost} ENERGY`, 43, 194, 6, '#81d1ba', 'left', 600);
  wrap(ctx, classInfo.skill, 43, 201, 5, '#a3c8b6', 380);
}

function drawTicketPanel(ctx, game) {
  text(ctx, `Choose one of three · ${game.save.weaponTickets} ticket${game.save.weaponTickets === 1 ? '' : 's'} remaining`, 240, 61, 6, '#aeba9b', 'center', 600);
  game.ticketChoices.forEach((weaponId, i) => {
    const r = ticketRects()[i]; const weapon = WEAPONS[weaponId];
    const hover = inside(game.input.pointer.x, game.input.pointer.y, r);
    panel(ctx, r.x, r.y, r.w, r.h, { fill: hover ? '#35473b' : '#223632', border: hover ? '#e7cb7d' : rarityColor(weapon.rarity) });
    drawWeaponGlyph(ctx, weaponId, r.x + r.w / 2 - 10, r.y + 10, 20);
    text(ctx, weapon.name.toUpperCase(), r.x + r.w / 2, r.y + 39, 6, '#eee0b6', 'center', 700);
    text(ctx, `${weapon.category} · ${weapon.rarity}`, r.x + r.w / 2, r.y + 51, 5, rarityColor(weapon.rarity), 'center', 600);
    wrap(ctx, weapon.description, r.x + 8, r.y + 63, 5, '#aab6a1', r.w - 16);
    text(ctx, `${i + 1}  ·  CHOOSE`, r.x + r.w / 2, r.y + 82, 5, '#e3c77e', 'center', 700);
  });
  text(ctx, 'A ticket changes the next run’s secondary weapon. The ticket is spent when you choose.', 240, 208, 5, '#95a391', 'center', 500);
}

function drawPrepPanel(ctx, game) {
  const classInfo = CLASSES[game.selectedClass];
  const second = game.preparedWeapon || game.save.preparedWeapon || game.save.loadouts?.[game.selectedClass] || classInfo.secondary;
  drawClassPortrait(ctx, game.selectedClass, 79, 112, 1.25);
  text(ctx, `${classInfo.name.toUpperCase()}  ·  ${classInfo.title.toUpperCase()}`, 122, 68, 8, '#eee0b6', 'left', 700);
  text(ctx, `HP ${classInfo.maxHp + game.save.classUpgrades[game.selectedClass].vitality}   ARMOR ${classInfo.armor}`, 122, 84, 6, '#c1c5a7', 'left', 600);
  text(ctx, `PRIMARY · ${WEAPONS[classInfo.primary].name.toUpperCase()}`, 122, 105, 6, '#d8dfbf', 'left', 600);
  text(ctx, `SECONDARY · ${WEAPONS[second].name.toUpperCase()}`, 122, 118, 6, '#e5c877', 'left', 600);
  text(ctx, `ENERGY ${classInfo.maxEnergy + game.save.classUpgrades[game.selectedClass].reservoir * 12}  ·  ${classInfo.skillName} (${classInfo.skillCost} cost)`, 122, 133, 6, '#8dd2bd', 'left', 600);
  panel(ctx, 49, 158, 382, 26, { fill: '#223531', border: '#54664f' });
  text(ctx, game.preparedWeapon ? `TICKET PICK READY · ${WEAPONS[game.preparedWeapon].name.toUpperCase()}` : `WEAPON TICKETS ${game.save.weaponTickets}  ·  PREPARE A PICK AT THE WORKSHOP`, 240, 167, 6, '#e1cf91', 'center', 600);
  drawButton(ctx, game.input, { id: 'class', label: 'CLASS HALL', ...RECT(43, 204, 120, 24) });
  drawButton(ctx, game.input, { id: 'ticket', label: game.preparedWeapon ? 'CHANGE PICK' : 'USE TICKET', ...RECT(180, 204, 120, 24) }, { active: !!game.preparedWeapon });
  drawButton(ctx, game.input, { id: 'enter', label: 'ENTER DUNGEON', ...RECT(317, 204, 120, 24) }, { active: true });
}

function drawWeaponPanel(ctx, game) {
  const weapon = WEAPONS[game.weaponPanelId];
  drawWeaponGlyph(ctx, weapon.id, 83, 95, 32);
  text(ctx, weapon.name.toUpperCase(), 112, 62, 10, '#f1e2ba', 'left', 800);
  text(ctx, `${weapon.category.toUpperCase()}  ·  ${weapon.rarity.toUpperCase()}  ·  ${weapon.element.toUpperCase()}`, 112, 79, 6, rarityColor(weapon.rarity), 'left', 600);
  text(ctx, `DAMAGE ${weapon.damage}  ·  RATE ${weapon.interval.toFixed(2)}s  ·  RANGE ${weapon.range}`, 44, 128, 6, '#d7dcbc', 'left', 600);
  wrap(ctx, weapon.description, 44, 145, 7, '#aeb9a5', 380);
  const discovered = game.save.discoveries.weapons.includes(weapon.id);
  text(ctx, discovered ? 'RECORDED IN YOUR ARCHIVE' : 'UNSEEN · FIND THIS WEAPON DURING AN EXPEDITION TO KEEP IT', 240, 181, 5, discovered ? '#92bd97' : '#c4a66f', 'center', 600);
  drawButton(ctx, game.input, { id: 'equip', label: discovered ? 'SET AS STARTER' : 'NOT YET FOUND', ...RECT(95, 205, 142, 24) }, { active: discovered });
  drawButton(ctx, game.input, { id: 'close', label: 'BACK TO WEAPON HALL', ...RECT(246, 205, 142, 24) });
}

function drawDialoguePanel(ctx, game) {
  const [speaker, line] = game.dialogueLines[game.dialogueIndex] || ['Lantern', ''];
  drawClassPortrait(ctx, game.classPanelId || game.selectedClass, 79, 106, 1.15);
  text(ctx, speaker.toUpperCase(), 126, 76, 7, '#e2c678', 'left', 700);
  wrap(ctx, line, 126, 91, 7, '#e8e1c5', 270);
  const remaining = `${game.dialogueIndex + 1} / ${game.dialogueLines.length}`;
  text(ctx, remaining, 417, 186, 5, '#a9b59e', 'right', 500);
  panel(ctx, 104, 199, 272, 25, { fill: '#263a34', border: '#647756' });
  text(ctx, 'SPACE  ·  CONTINUE / SKIP', 240, 208, 7, '#f0d18a', 'center', 700);
}

function drawHubOverlayLayer(ctx, game) { drawHubOverlay(ctx, game); }

export function renderHub(ctx, game) {
  drawHubWorld(ctx, game);
  if (game.hubOverlay !== 'none') drawHubOverlayLayer(ctx, game);
}

function wrap(ctx, value, x, y, size, color, width) {
  ctx.save(); ctx.font = `500 ${size}px ui-monospace, monospace`; ctx.textBaseline = 'top'; ctx.fillStyle = color;
  const words = String(value).split(' '); let line = ''; let rows = 0;
  for (const word of words) {
    const next = line ? `${line} ${word}` : word;
    if (ctx.measureText(next).width > width && line) {
      text(ctx, line, x, y + rows * (size + 2), size, color, 'left', 500); rows++; line = word;
      if (rows >= 3) break;
    } else line = next;
  }
  if (rows < 3 && line) text(ctx, line, x, y + rows * (size + 2), size, color, 'left', 500);
  ctx.restore();
}
