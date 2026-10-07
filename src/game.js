import { CANVAS_HEIGHT, CANVAS_WIDTH, HEIGHT, RENDER_SCALE, WIDTH, clamp } from './constants.js';
import { ENEMIES } from './content.js';
import { makeRng } from './rng.js';
import { loadSave, persistSave } from './save.js';
import { Sound } from './audio.js';
import { Input } from './input.js';
import * as UI from './ui.js';
import { drawBackdrop, drawRoom, drawChest, drawDrop, drawEnemy, drawClassSprite, drawProp, drawProjectile, panel, text } from './art.js';
import { RewardSystems } from './systems/RewardSystems.js';
import { enterHubRoom, renderHub, updateHub } from './hub.js';

export class Game extends RewardSystems {

  constructor(canvas) {
    super();
    this.canvas = canvas;
    this.canvas.width = CANVAS_WIDTH;
    this.canvas.height = CANVAS_HEIGHT;
    this.canvas.style ||= {};
    this.resizeCanvas();
    this.ctx = canvas.getContext('2d', { alpha: false });
    this.ctx.imageSmoothingEnabled = false;
    this.input = new Input(canvas);
    this.ui = UI;
    this.sound = new Sound();
    this.save = loadSave();
    this.sound.setVolumes(this.save.settings);
    this.contentEnemies = ENEMIES;
    this.version = '0.1.0';
    this.screen = 'menu';
    this.overlay = 'none';
    this.time = 0;
    this.lastFrame = 0;
    this.raf = 0;
    this.menuFocus = 'start';
    this.selectedClass = this.save.lastClass || 'vanguard';
    this.lastClass = this.save.lastClass || 'vanguard';
    this.preparedWeapon = this.save.preparedWeapon || null;
    this.hubRoom = 'sanctum';
    this.hubPlayer = { x: 240, y: 188, aim: { x: 1, y: 0 }, moving: false };
    this.hubOverlay = 'none';
    this.hubPrompt = '';
    this.ticketChoices = [];
    this.menuParticles = [];
    this.toast = '';
    this.toastTimer = 0;
    this.screenBeforeSettings = 'menu';
    this.overlayBeforeSettings = 'none';
    this.returnScreen = 'menu';
    this.dragSetting = null;
    this.run = null;
    this.map = null;
    this.currentNode = null;
    this.currentRoom = null;
    this.roomRecords = {};
    this.rng = makeRng(1);
    this.nextEntityId = 1;
    this.boss = null;
    this.deathTimer = 0;
    this.buffChoices = [];
    this.shopItems = [];
    this.eventData = null;
    this.endedRun = null;
    this.resultMessage = '';
    this.lastTimestamp = 0;
    this.inFrame = false;
    this.boundResize = () => { this.resizeCanvas(); this.ctx.imageSmoothingEnabled = false; };
    window.addEventListener('resize', this.boundResize);
    document.addEventListener('visibilitychange', this.onVisibility = () => {
      if (document.hidden && this.screen === 'run' && this.overlay === 'none') this.overlay = 'pause';
    });
  }

  resizeCanvas() {
    const viewportWidth = Math.max(320, window.innerWidth || CANVAS_WIDTH);
    const viewportHeight = Math.max(180, window.innerHeight || CANVAS_HEIGHT);
    const fit = Math.min(viewportWidth / CANVAS_WIDTH, viewportHeight / CANVAS_HEIGHT);
    const scale = fit >= 1 ? Math.max(1, Math.floor(fit)) : fit;
    this.canvas.style.width = `${CANVAS_WIDTH * scale}px`;
    this.canvas.style.height = `${CANVAS_HEIGHT * scale}px`;
  }

  start() {
    if (this.raf) return;
    this.lastFrame = performance.now();
    this.raf = requestAnimationFrame((ts) => this.frame(ts));
    this.sound.setTrack('menu');
  }

  stop() {
    if (this.raf) cancelAnimationFrame(this.raf);
    this.raf = 0;
    this.input.destroy();
    this.sound.stop();
    window.removeEventListener('resize', this.boundResize);
    document.removeEventListener('visibilitychange', this.onVisibility);
  }

  frame(timestamp) {
    this.raf = requestAnimationFrame((ts) => this.frame(ts));
    const dt = Math.min(0.04, Math.max(0, (timestamp - this.lastFrame) / 1000));
    this.lastFrame = timestamp;
    this.time += dt;
    this.update(dt);
    this.render();
    this.input.endFrame();
  }

  update(dt) {
    this.updateFeedback(dt);
    this.updateMenuParticles(dt);
    if (this.screen === 'menu') {
      if (this.input.wasPressed('arrowdown') || this.input.wasPressed('s')) this.moveMenuFocus(1);
      if (this.input.wasPressed('arrowup') || this.input.wasPressed('w')) this.moveMenuFocus(-1);
      if (this.input.wasPressed('enter') || this.input.wasPressed('space')) this.activateMenu(this.menuFocus);
      if (this.input.pointer.pressed) this.handleMenuClick();
      return;
    }
    if (this.screen === 'select') {
      if (this.input.wasPressed('arrowleft') || this.input.wasPressed('a')) this.selectedClass = 'vanguard';
      if (this.input.wasPressed('arrowright') || this.input.wasPressed('d')) this.selectedClass = 'ranger';
      if (this.input.wasPressed('enter') || this.input.wasPressed('space')) this.startNewRun(this.selectedClass);
      if (this.input.wasPressed('escape')) this.screen = 'menu';
      if (this.input.pointer.pressed) this.handleSelectClick();
      return;
    }
    if (this.screen === 'hub') {
      updateHub(this, dt);
      return;
    }
    if (this.screen === 'settings') {
      this.updateSettingsInput();
      return;
    }
    if (this.screen === 'collection' || this.screen === 'help') {
      if (this.input.wasPressed('escape') || this.input.wasPressed('backspace')) this.screen = this.returnScreen;
      if (this.input.pointer.pressed && UI.inside(this.input.pointer.x, this.input.pointer.y, { x: 32, y: 238, w: 100, h: 25 })) this.screen = this.returnScreen;
      return;
    }
    if (this.screen === 'results') {
      if (this.input.wasPressed('enter') || this.input.wasPressed('space')) {
        enterHubRoom(this, 'sanctum'); this.screen = 'hub'; this.sound.setTrack('hub');
      }
      if (this.input.pointer.pressed) this.handleResultsClick();
      return;
    }
    if (this.screen !== 'run' || !this.run) return;

    if (this.overlay === 'none') {
      if (this.input.wasPressed('escape')) { this.overlay = 'pause'; return; }
      if (this.input.wasPressed('tab')) { this.overlay = 'build'; return; }
      if (this.input.pointer.pressed) this.handleRunHudClick();
      this.updateRun(dt);
      return;
    }
    this.updateRunOverlay();
  }

  updateFeedback(dt) {
    if (this.toastTimer > 0) {
      this.toastTimer -= dt;
      if (this.toastTimer <= 0) this.toast = '';
    }
  }

  updateMenuParticles(dt) {
    while (this.menuParticles.length < 38) {
      this.menuParticles.push({ x: Math.random() * WIDTH, y: 80 + Math.random() * HEIGHT, vx: -3 + Math.random() * 6, vy: -5 - Math.random() * 8, life: 5 + Math.random() * 7, maxLife: 12, size: 1 + Math.floor(Math.random() * 2), color: Math.random() < .4 ? '#d7bf78' : '#a4c18a' });
    }
    this.menuParticles = this.menuParticles.filter((p) => {
      p.x += p.vx * dt; p.y += p.vy * dt; p.life -= dt;
      if (p.life <= 0 || p.y < 42) { p.x = Math.random() * WIDTH; p.y = 248 + Math.random() * 26; p.life = p.maxLife = 7 + Math.random() * 6; }
      return true;
    });
  }

  moveMenuFocus(delta) {
    const index = UI.MENU_BUTTONS.findIndex((b) => b.id === this.menuFocus);
    this.menuFocus = UI.MENU_BUTTONS[(index + delta + UI.MENU_BUTTONS.length) % UI.MENU_BUTTONS.length].id;
    this.sound.play('menu', .5);
  }

  handleMenuClick() {
    const button = UI.MENU_BUTTONS.find((b) => UI.inside(this.input.pointer.x, this.input.pointer.y, b));
    if (button) this.activateMenu(button.id);
  }

  activateMenu(id) {
    this.sound.unlock();
    this.sound.play('menu');
    if (id === 'start') {
      this.selectedClass = this.save.lastClass || this.lastClass || 'vanguard';
      enterHubRoom(this, 'sanctum'); this.screen = 'hub'; this.sound.setTrack('hub');
    } else if (id === 'hub') {
      this.selectedClass = this.save.lastClass || this.lastClass || 'vanguard';
      enterHubRoom(this, 'classes'); this.screen = 'hub'; this.sound.setTrack('hub');
    }
    else if (id === 'help') { this.returnScreen = 'menu'; this.screen = 'help'; }
    else if (id === 'collection') { this.returnScreen = 'menu'; this.screen = 'collection'; }
    else if (id === 'settings') this.openSettings('menu', 'none');
    else if (id === 'exit') this.showToast('Your lantern is safe to close. See you next expedition.');
  }

  handleSelectClick() {
    const card = UI.SELECT_CARDS.find((item) => UI.inside(this.input.pointer.x, this.input.pointer.y, item));
    if (card) { this.selectedClass = card.id; this.sound.play('menu', .45); }
    if (UI.inside(this.input.pointer.x, this.input.pointer.y, UI.SELECT_BUTTONS[0])) this.screen = 'menu';
    if (UI.inside(this.input.pointer.x, this.input.pointer.y, UI.SELECT_BUTTONS[1])) this.startNewRun(this.selectedClass);
  }

  openSettings(screen, overlay) {
    this.screenBeforeSettings = screen;
    this.overlayBeforeSettings = overlay;
    this.screen = 'settings';
    this.dragSetting = null;
  }

  updateSettingsInput() {
    const sliders = [
      { key: 'master', rect: { x: 230, y: 98, w: 144, h: 16 } },
      { key: 'music', rect: { x: 230, y: 133, w: 144, h: 16 } },
      { key: 'sfx', rect: { x: 230, y: 168, w: 144, h: 16 } },
    ];
    if (this.input.pointer.pressed) {
      const slider = sliders.find((s) => UI.inside(this.input.pointer.x, this.input.pointer.y, s.rect));
      if (slider) this.dragSetting = slider.key;
      else if (UI.inside(this.input.pointer.x, this.input.pointer.y, { x: 94, y: 193, w: 180, h: 20 })) {
        this.save.settings.shake = !this.save.settings.shake; persistSave(this.save); this.sound.play('menu');
      } else if (UI.inside(this.input.pointer.x, this.input.pointer.y, { x: 320, y: 193, w: 70, h: 20 })) this.closeSettings();
    }
    if (this.dragSetting && this.input.pointer.down) {
      const slider = sliders.find((s) => s.key === this.dragSetting);
      this.save.settings[this.dragSetting] = clamp((this.input.pointer.x - slider.rect.x) / slider.rect.w, 0, 1);
      this.sound.setVolumes(this.save.settings);
      persistSave(this.save);
    }
    if (this.input.wasReleased('pointer')) this.dragSetting = null;
    if (this.input.wasPressed('escape')) this.closeSettings();
  }

  closeSettings() {
    this.screen = this.screenBeforeSettings;
    this.overlay = this.overlayBeforeSettings;
    this.dragSetting = null;
    this.sound.setVolumes(this.save.settings);
  }

  handleResultsClick() {
    const item = UI.RESULTS_BUTTONS.find((b) => UI.inside(this.input.pointer.x, this.input.pointer.y, b));
    if (!item) return;
    if (item.id === 'again') this.selectedClass = this.endedRun.classId;
    enterHubRoom(this, 'sanctum'); this.screen = 'hub'; this.sound.setTrack('hub');
  }

  updateRunOverlay() {
    if (this.overlay === 'pause') {
      if (this.input.wasPressed('escape')) { this.overlay = 'none'; return; }
      if (!this.input.pointer.pressed) return;
      const b = UI.PAUSE_BUTTONS.find((item) => UI.inside(this.input.pointer.x, this.input.pointer.y, item));
      if (!b) return;
      if (b.id === 'resume') this.overlay = 'none';
      else if (b.id === 'build') this.overlay = 'build';
      else if (b.id === 'settings') this.openSettings('run', 'pause');
      else if (b.id === 'restart') this.startNewRun(this.run.classId);
      else if (b.id === 'hub') this.endRun('retreat');
      return;
    }
    if (this.overlay === 'build') {
      if (this.input.wasPressed('escape') || this.input.wasPressed('tab')) this.overlay = 'none';
      if (this.input.pointer.pressed && UI.inside(this.input.pointer.x, this.input.pointer.y, { x: 155, y: 216, w: 170, h: 19 })) this.overlay = 'none';
      return;
    }
    if (this.overlay === 'buff') {
      if (this.input.wasPressed('1')) this.chooseBuff(0);
      if (this.input.wasPressed('2')) this.chooseBuff(1);
      if (this.input.wasPressed('3')) this.chooseBuff(2);
      if (this.input.pointer.pressed) {
        const i = UI.BUFF_CARDS.findIndex((r) => UI.inside(this.input.pointer.x, this.input.pointer.y, r));
        if (i >= 0) this.chooseBuff(i);
      }
      return;
    }
    if (this.overlay === 'shop') {
      if (this.input.wasPressed('escape') || this.input.wasPressed('e')) { this.overlay = 'none'; return; }
      if (!this.input.pointer.pressed) return;
      const i = UI.SHOP_CARDS.findIndex((r) => UI.inside(this.input.pointer.x, this.input.pointer.y, r));
      if (i >= 0) this.buyShopItem(i);
      else if (this.input.pointer.y > 205) this.overlay = 'none';
      return;
    }
    if (this.overlay === 'event') {
      if (this.input.wasPressed('1')) this.chooseEvent(0);
      if (this.input.wasPressed('2')) this.chooseEvent(1);
      if (this.input.wasPressed('3') || this.input.wasPressed('escape')) this.chooseEvent(2);
      if (this.input.pointer.pressed) {
        const i = UI.EVENT_CARDS.findIndex((r) => UI.inside(this.input.pointer.x, this.input.pointer.y, r));
        if (i >= 0) this.chooseEvent(i);
      }
    }
  }

  handleRunHudClick() {
    const x = this.input.pointer.x; const y = this.input.pointer.y;
    if (y >= 233 && y <= 254) {
      if (x >= 13 && x <= 34) this.run.activeSlot = 0;
      else if (x >= 71 && x <= 93) this.run.activeSlot = 1;
    }
    if (x >= 142 && x <= 187 && y >= 8 && y <= 27) this.activateSkill();
  }

  render() {
    const ctx = this.ctx;
    ctx.setTransform(RENDER_SCALE, 0, 0, RENDER_SCALE, 0, 0);
    ctx.imageSmoothingEnabled = false;
    const shake = (this.screenShake || 0) > 0 && this.screen === 'run';
    ctx.clearRect(0, 0, WIDTH, HEIGHT);
    if (shake) {
      ctx.translate(Math.sin(this.time * 73) * 2, Math.cos(this.time * 61) * 1.5);
      this.screenShake = Math.max(0, this.screenShake - .025);
    }
    if (this.screen === 'menu') {
      drawBackdrop(ctx, this.time, this.menuParticles);
      UI.drawMenu(ctx, this);
    } else if (this.screen === 'select') {
      drawBackdrop(ctx, this.time, this.menuParticles);
      UI.drawClassSelect(ctx, this);
    } else if (this.screen === 'hub') {
      renderHub(ctx, this);
    } else if (this.screen === 'collection') {
      drawBackdrop(ctx, this.time, this.menuParticles);
      UI.drawCollection(ctx, this);
    } else if (this.screen === 'help') {
      drawBackdrop(ctx, this.time, this.menuParticles);
      UI.drawHelp(ctx, this);
    } else if (this.screen === 'settings') {
      drawBackdrop(ctx, this.time, this.menuParticles);
      UI.drawSettings(ctx, this);
    } else if (this.screen === 'results' && this.endedRun) {
      UI.drawResults(ctx, this);
    } else if (this.screen === 'run' && this.run && this.currentRoom) this.renderRun(ctx);
    ctx.setTransform(RENDER_SCALE, 0, 0, RENDER_SCALE, 0, 0);
  }

  renderRun(ctx) {
    const room = this.currentRoom;
    drawBackdrop(ctx, this.time * .2, []);
    const biomeFloor = this.run.floor;
    // The first biome gradually changes color temperature deeper down, without swapping tilesets.
    drawRoom(ctx, room, this.time, biomeFloor);
    for (const prop of room.props) if (!prop.destroyed) drawProp(ctx, prop, this.time);
    if (room.chest) drawChest(ctx, room.chest, this.time);
    if (room.portalReady) this.drawPortal(ctx, this.time);
    for (const drop of room.drops) if (!drop.collected) drawDrop(ctx, drop, this.time);
    const actors = room.enemies.filter((e) => e.alive).map((e) => ({ kind: 'enemy', y: e.y, value: e }));
    actors.push({ kind: 'player', y: this.run.player.y, value: this.run.player });
    actors.sort((a, b) => a.y - b.y);
    for (const actor of actors) {
      if (actor.kind === 'enemy') drawEnemy(ctx, actor.value, this.time);
      else drawClassSprite(ctx, this.run.classId, actor.value.x, actor.value.y, actor.value.aim, this.time, actor.value.moving, actor.value.invuln, actor.value.attackAnim, actor.value.skillAnim);
    }
    for (const projectile of room.projectiles) drawProjectile(ctx, projectile);
    for (const p of room.particles) {
      ctx.globalAlpha = clamp(p.life / p.maxLife, 0, 1);
      ctx.fillStyle = p.color; ctx.fillRect(Math.round(p.x), Math.round(p.y), p.size, p.size);
    }
    ctx.globalAlpha = 1;
    for (const n of room.numbers) {
      ctx.globalAlpha = clamp(n.life / n.maxLife, 0, 1);
      text(ctx, n.value, n.x + n.offset, n.y, n.critical ? 9 : 7, n.color, 'center', n.critical ? 800 : 600);
    }
    ctx.globalAlpha = 1;
    UI.drawRunHud(ctx, this);
    if (this.overlay === 'pause') UI.drawPause(ctx, this);
    else if (this.overlay === 'buff') UI.drawBuffChoice(ctx, this);
    else if (this.overlay === 'shop') UI.drawShop(ctx, this);
    else if (this.overlay === 'event') UI.drawEvent(ctx, this);
    else if (this.overlay === 'build') UI.drawBuild(ctx, this);
    if (this.toast && this.toastTimer > 0 && this.overlay === 'none') {
      panel(ctx, 136, 185, 208, 15, { fill: 'rgba(17,28,28,.84)', border: 'rgba(155,164,105,.55)' });
      text(ctx, this.toast, 240, 189, 6, '#eee0b6', 'center', 600);
    }
  }

  drawPortal(ctx, time) {
    const p = (Math.sin(time * 4) + 1) / 2;
    ctx.save(); ctx.globalAlpha = .32 + p * .16; ctx.fillStyle = '#86d8bd'; ctx.beginPath(); ctx.ellipse(240, 134, 24 + p * 3, 31 + p * 3, 0, 0, Math.PI * 2); ctx.fill(); ctx.restore();
    ctx.strokeStyle = '#b7dfaa'; ctx.lineWidth = 2; ctx.beginPath(); ctx.ellipse(240, 134, 15 + p * 2, 23 + p * 2, 0, 0, Math.PI * 2); ctx.stroke();
    ctx.fillStyle = '#e6d589'; ctx.fillRect(238, 122, 4, 25); ctx.fillStyle = '#7bbdac'; ctx.fillRect(234, 128, 3, 12); ctx.fillRect(243, 131, 3, 10);
    text(ctx, this.run.floor >= 3 ? 'LAST LIGHT' : 'DOWNWARD', 240, 165, 5, '#d2e2ad', 'center', 600);
  }
}
