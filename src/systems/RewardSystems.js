import { ROOM, clamp, dist, norm } from '../constants.js';
import { HEROES, WEAPONS, BUFFS } from '../content.js';
import { makeRng, pick } from '../rng.js';
import { persistSave } from '../save.js';
import { rollReward } from '../encounters.js';
import { CombatSystems } from './CombatSystems.js';

export class RewardSystems extends CombatSystems {
  damageProp(prop, amount) {
    if (!prop.destructible) return;
    prop.hp -= amount;
    this.emitParticles(prop.x + prop.w / 2, prop.y + prop.h / 2, prop.type === 'crystal' ? '#9bcfc1' : '#ae8158', 4, 28);
    if (prop.hp <= 0) {
      prop.solid = false; prop.destroyed = true;
      this.sound.play('enemyDown', .35);
      this.emitParticles(prop.x + prop.w / 2, prop.y + prop.h / 2, '#bc9a67', 14, 54);
      if (this.rng() < .58) this.currentRoom.drops.push({ id: `drop-${this.nextEntityId++}`, type: 'coins', x: prop.x + prop.w / 2, y: prop.y + prop.h / 2, amount: 2 + Math.floor(this.rng() * 4), phase: this.fxRng() * 6, vx: 0, vy: -10 });
    }
  }

  updateDrops(dt) {
    const p = this.run.player;
    for (const drop of this.currentRoom.drops) {
      if (drop.type === 'weapon') continue;
      const d = dist(drop.x, drop.y, p.x, p.y);
      if (drop.type === 'xp' && d < 76 || drop.type === 'coins' && d < 52) {
        const direction = norm(p.x - drop.x, p.y - drop.y);
        drop.vx = direction.x * 130; drop.vy = direction.y * 130;
      }
      drop.x += (drop.vx || 0) * dt; drop.y += (drop.vy || 0) * dt;
      drop.vx = (drop.vx || 0) * Math.pow(.15, dt); drop.vy = (drop.vy || 0) * Math.pow(.15, dt);
      if (dist(drop.x, drop.y, p.x, p.y) < (drop.type === 'xp' ? 10 : drop.type === 'coins' ? 10 : 18)) this.collectDrop(drop);
    }
    this.currentRoom.drops = this.currentRoom.drops.filter((d) => !d.collected);
  }

  collectDrop(drop) {
    if (drop.collected) return;
    drop.collected = true;
    if (drop.type === 'xp') {
      this.gainXp(drop.amount);
      this.sound.play('pickup', .35);
      this.emitParticles(drop.x, drop.y, '#a9dfac', 5, 30);
    } else if (drop.type === 'coins') {
      this.run.coins += drop.amount;
      this.run.stats.coinsCollected += drop.amount;
      this.sound.play('coin', .55);
      this.showToast(`+${drop.amount} AMBER`);
    } else if (drop.type === 'heal') {
      const before = this.run.player.hp; this.run.player.hp = Math.min(this.run.player.maxHp, this.run.player.hp + drop.amount);
      this.addDamageNumber(this.run.player.x, this.run.player.y - 14, `+${Math.round(this.run.player.hp - before)}`, '#9cd28e', false);
      this.sound.play('pickup');
    } else if (drop.type === 'weapon') {
      this.equipWeapon(drop.weapon, drop.x, drop.y, true);
    }
    if (drop.bossReward) {
      this.currentRoom.bossRewardTaken = true;
      this.currentRoom.portalReady = true;
      this.showToast('BOSS RELIC CLAIMED  ·  THE EXIT IS OPEN');
    }
    if (drop.fromChest && this.currentNode.type === 'treasure') this.currentNode.rewardClaimed = true;
  }

  equipWeapon(weaponId, x = this.run.player.x, y = this.run.player.y, pickup = false) {
    if (!WEAPONS[weaponId]) return;
    const current = this.run.weapons[this.run.activeSlot];
    if (current === weaponId || this.run.weapons.includes(weaponId)) {
      this.run.coins += 8;
      if (pickup) this.showToast(`${WEAPONS[weaponId].name} already carried  ·  +8 AMBER`);
      return;
    }
    const old = this.run.weapons[this.run.activeSlot];
    this.run.weapons[this.run.activeSlot] = weaponId;
    if (pickup && old && this.currentRoom.drops.length < 10) {
      this.currentRoom.drops.push({ id: `drop-${this.nextEntityId++}`, type: 'weapon', weapon: old, x: x - 13, y: y + 3, phase: this.fxRng() * 6, vx: 0, vy: 0 });
    }
    this.save.discoveries.weapons ||= [];
    if (!this.save.discoveries.weapons.includes(weaponId)) this.save.discoveries.weapons.push(weaponId);
    persistSave(this.save);
    this.sound.play('pickup', 1.1);
    this.emitParticles(x, y, '#e6c675', 11, 40);
    this.showToast(`EQUIPPED  ·  ${WEAPONS[weaponId].name.toUpperCase()}  ·  SLOT ${this.run.activeSlot + 1}`);
  }

  gainXp(amount) {
    this.run.xp += amount;
    while (this.run.xp >= this.run.xpNext && this.overlay === 'none') {
      this.run.xp -= this.run.xpNext;
      this.run.level++;
      this.run.xpNext = Math.floor(32 + this.run.level * 18 + this.run.level * this.run.level * 1.5);
      this.run.player.hp = Math.min(this.run.player.maxHp, this.run.player.hp + 7);
      this.openBuffChoice();
      this.sound.play('level');
      break;
    }
  }

  openBuffChoice() {
    const available = Object.values(BUFFS).filter((buff) => this.buffStacks(buff.id) < buff.maxStacks);
    const options = [];
    const pool = [...available];
    while (options.length < 3 && pool.length) options.push(pool.splice(Math.floor(this.rng() * pool.length), 1)[0].id);
    while (options.length < 3) options.push(pick(this.rng, Object.keys(BUFFS)));
    this.buffChoices = options;
    this.overlay = 'buff';
  }

  chooseBuff(index) {
    const id = this.buffChoices[index];
    if (!id) return;
    this.grantBuff(id);
    this.overlay = 'none';
    this.sound.play('level', 1.1);
    this.showToast(`${BUFFS[id].name.toUpperCase()}  ·  BUILD UPDATED`);
    if (this.run.xp >= this.run.xpNext) this.gainXp(0);
  }

  grantBuff(id) {
    const data = BUFFS[id]; if (!data) return;
    let entry = this.run.buffs.find((b) => b.id === id);
    if (!entry) { entry = { id, stacks: 0 }; this.run.buffs.push(entry); }
    if (entry.stacks >= data.maxStacks) return;
    entry.stacks++;
    if (id === 'ironbark') {
      this.run.player.maxHp += 16;
      this.run.player.hp = Math.min(this.run.player.maxHp, this.run.player.hp + 16);
      this.run.player.maxArmor += 1;
      this.run.player.armor += 1;
    }
    this.save.discoveries.buffs ||= [];
    if (!this.save.discoveries.buffs.includes(id)) this.save.discoveries.buffs.push(id);
    persistSave(this.save);
  }

  buffStacks(id) { return this.run?.buffs.find((b) => b.id === id)?.stacks || 0; }

  updateRoomState(dt) {
    const room = this.currentRoom;
    if (room.bossDying > 0) {
      room.bossDying -= dt;
      if (room.bossDying <= 0) this.finishBossRoom();
    }
    if (room.locked && !room.bossDying) {
      const alive = room.enemies.some((enemy) => enemy.alive);
      if (!alive) {
        if (room.waveIndex + 1 < room.waves.length) {
          room.waveDelay += dt;
          if (room.waveDelay > .85) { room.waveIndex++; this.spawnWave(); this.showToast(`WAVE ${room.waveIndex + 1}`); }
        } else if (!room.encounterEnded) this.clearRoom();
      }
    }
    if (room.chest?.opening && !room.chest.open) {
      room.chest.timer -= dt;
      room.chest.shake = room.chest.timer;
      if (room.chest.timer <= 0) this.releaseChestReward(room.chest);
    }
    if (room.portalReady) room.portalPulse = Math.min(1, (room.portalPulse || 0) + dt);
  }

  clearRoom() {
    const node = this.currentNode;
    if (node.cleared) return;
    node.cleared = true;
    this.currentRoom.locked = false;
    this.currentRoom.encounterEnded = true;
    this.run.stats.roomsCleared++;
    const iron = this.buffStacks('ironbark');
    if (iron) this.run.player.hp = Math.min(this.run.player.maxHp, this.run.player.hp + 8 * iron);
    this.updateDoorMap();
    this.sound.play('clear');
    this.emitRing(240, 134, '#cfdb91', 18);
    if (!node.rewardClaimed) this.currentRoom.chest = this.makeChest(240, 134, node.type === 'elite' ? 'elite' : 'room');
    this.showToast(node.type === 'elite' ? 'ELITE FELLED  ·  THE ROOTS OFFER MORE' : 'ROOM CLEAR  ·  A REWARD AWAITS');
  }

  finishBossRoom() {
    const node = this.currentNode;
    if (node.cleared) return;
    node.cleared = true;
    this.currentRoom.locked = false;
    this.currentRoom.encounterEnded = true;
    this.updateDoorMap();
    this.currentRoom.chest = this.makeChest(240, 134, 'boss');
    this.currentRoom.portalReady = false;
    this.currentRoom.bossRewardTaken = false;
    this.sound.setTrack('hub');
    this.sound.play('clear', 1.2);
    this.showToast('BOSS DEFEATED  ·  A RELIC AND A WAY DOWN');
  }

  makeChest(x, y, kind) {
    return { x, y, kind, open: false, opening: false, timer: 0, shake: 0, reward: null, phase: this.fxRng() * 6 };
  }

  interact() {
    if (!this.run || !this.currentRoom) return;
    const player = this.run.player;
    const chest = this.currentRoom.chest;
    if (chest && !chest.open && !chest.opening && dist(player.x, player.y, chest.x, chest.y) < 34) {
      chest.opening = true; chest.timer = .72;
      this.sound.play('chest');
      this.showToast('THE LOCK GIVES WAY…');
      return;
    }
    if (this.currentRoom.portalReady && dist(player.x, player.y, 240, 134) < 34) {
      this.sound.play('portal');
      if (this.run.floor >= 3) this.endRun('victory');
      else {
        this.run.floor++;
        player.hp = Math.min(player.maxHp, player.hp + 22);
        player.armor = player.maxArmor;
        this.createFloor(this.run.floor);
        this.sound.setTrack('dungeon');
        this.showToast(`FLOOR ${this.run.floor}  ·  THE ROOTS GO DEEPER`);
      }
      return;
    }
    const weaponDrop = this.currentRoom.drops.find((d) => !d.collected && d.type === 'weapon' && dist(player.x, player.y, d.x, d.y) < 31);
    if (weaponDrop) { this.collectDrop(weaponDrop); return; }
    if (this.currentNode.type === 'shop') { this.visitShop(); return; }
    if (this.currentNode.type === 'shrine' && !this.currentRoom.eventResolved) { this.visitShrine(); return; }
    this.showToast('NOTHING CLOSE ENOUGH TO INTERACT WITH');
  }

  releaseChestReward(chest) {
    chest.open = true; chest.opening = false; chest.timer = 0;
    const rng = this.rng;
    let reward;
    if (chest.kind === 'boss') {
      const ids = Object.keys(WEAPONS).filter((id) => !this.run.weapons.includes(id));
      reward = { type: 'weapon', weapon: pick(rng, ids.length ? ids : Object.keys(WEAPONS)), bossReward: true, amount: 0 };
      this.run.coins += 16 + this.run.floor * 5;
      this.run.stats.coinsCollected += 16 + this.run.floor * 5;
    } else if (chest.kind === 'elite') {
      reward = { type: 'weapon', weapon: pick(rng, Object.keys(WEAPONS)), amount: 0 };
    } else {
      reward = rollReward(rng, this.run.floor);
      if (reward.type === 'weapon') {
        const candidates = Object.keys(WEAPONS).filter((id) => !this.run.weapons.includes(id));
        reward.weapon = pick(rng, candidates.length ? candidates : Object.keys(WEAPONS));
      }
    }
    const drop = { id: `drop-${this.nextEntityId++}`, ...reward, x: chest.x + 17, y: chest.y - 1, phase: this.fxRng() * 6, vx: 0, vy: -8, fromChest: true };
    this.currentRoom.drops.push(drop);
    chest.reward = reward;
    this.sound.play('pickup', 1.1);
    this.emitParticles(chest.x, chest.y - 8, reward.type === 'weapon' ? '#f0cb75' : '#9cd296', 22, 50);
    this.showToast(reward.type === 'weapon' ? `FOUND  ·  ${WEAPONS[reward.weapon].name.toUpperCase()}` : reward.type === 'coins' ? `CHEST  ·  ${reward.amount} AMBER` : reward.type === 'heal' ? 'CHEST  ·  WARMROOT TONIC' : 'CHEST  ·  A LUMINOUS MEMORY');
  }

  buyShopItem(index) {
    const item = this.shopItems[index];
    if (!item || item.bought) return;
    if (this.run.coins < item.price) { this.showToast('NOT ENOUGH AMBER. THE MERCHANT DOES NOT BARTER.'); this.sound.play('hurt', .5); return; }
    if (item.type === 'heal' && this.run.player.hp >= this.run.player.maxHp) return this.showToast('YOU ARE ALREADY AT FULL HEALTH.');
    if (item.type === 'buff' && this.buffStacks(item.buff) >= BUFFS[item.buff].maxStacks) return this.showToast('THAT KNOT CANNOT STACK FURTHER.');
    this.run.coins -= item.price;
    item.bought = true;
    if (item.type === 'heal') this.run.player.hp = Math.min(this.run.player.maxHp, this.run.player.hp + 38);
    else if (item.type === 'buff') this.grantBuff(item.buff);
    else if (item.type === 'weapon') this.equipWeapon(item.weapon, 240, 136, false);
    else if (item.type === 'coins') { this.run.coins += item.amount; this.run.stats.coinsCollected += item.amount; }
    this.sound.play('buy');
    this.showToast(`${item.name.toUpperCase()}  ·  PURCHASED`);
  }

  updateTransientEffects(dt) {
    for (const particle of this.currentRoom?.particles || []) {
      particle.x += particle.vx * dt; particle.y += particle.vy * dt;
      particle.vx *= Math.pow(.1, dt); particle.vy *= Math.pow(.1, dt);
      particle.life -= dt;
    }
    if (this.currentRoom) this.currentRoom.particles = this.currentRoom.particles.filter((p) => p.life > 0);
    for (const number of this.currentRoom?.numbers || []) { number.y -= 14 * dt; number.life -= dt; }
    if (this.currentRoom) this.currentRoom.numbers = this.currentRoom.numbers.filter((n) => n.life > 0);
  }

  emitParticles(x, y, color, count = 8, speed = 38) {
    const particles = this.currentRoom?.particles;
    if (!particles) return;
    for (let i = 0; i < count && particles.length < 380; i++) {
      const angle = this.fxRng() * Math.PI * 2;
      const velocity = this.fxRng() * speed;
      const life = .18 + this.fxRng() * .5;
      particles.push({ x, y, vx: Math.cos(angle) * velocity, vy: Math.sin(angle) * velocity, color, size: 1 + Math.floor(this.fxRng() * 2), life, maxLife: life });
    }
  }

  emitRing(x, y, color, count = 16) {
    this.emitParticles(x, y, color, count, 70);
    if (this.save.settings.shake) this.screenShake = Math.max(this.screenShake || 0, .09);
  }

  emitLine(x1, y1, x2, y2, color) {
    const length = dist(x1, y1, x2, y2);
    for (let i = 0; i < length; i += 8) {
      const t = i / Math.max(1, length);
      this.emitParticles(x1 + (x2 - x1) * t, y1 + (y2 - y1) * t, color, 1, 3);
    }
  }

  addDamageNumber(x, y, value, color, critical = false) {
    const numbers = this.currentRoom?.numbers;
    if (!numbers) return;
    if (numbers.length > 70) numbers.shift();
    numbers.push({ x, y, value: String(value), color, critical, life: .65, maxLife: .65, offset: this.fxRng() * 8 - 4 });
  }

  damagePlayer(raw, source) {
    const p = this.run.player;
    if (p.invuln > 0 || this.deathTimer > 0) return 0;
    let amount = Math.max(1, raw);
    if (p.armor > 0) {
      const absorbed = Math.min(p.armor, amount * .55);
      p.armor -= absorbed;
      amount -= absorbed;
      p.armorTimer = 6;
    }
    amount = Math.max(1, Math.round(amount));
    p.hp = Math.max(0, p.hp - amount);
    p.invuln = .45;
    p.lastDamage = 0;
    this.run.stats.damageTaken += amount;
    this.addDamageNumber(p.x, p.y - 12, `-${amount}`, '#e98779', false);
    this.emitParticles(p.x, p.y, '#e58a73', 9, 45);
    this.sound.play('hurt');
    if (this.save.settings.shake) this.screenShake = Math.max(this.screenShake || 0, .12);
    if (p.hp <= 0) {
      this.deathTimer = .74;
      p.moving = false;
      this.sound.play('boss', .65);
      this.showToast('THE LANTERN FALTERS…');
    }
    return amount;
  }

  getInteractionHint() {
    if (!this.run || !this.currentRoom) return '';
    const p = this.run.player;
    if (this.currentRoom.portalReady && dist(p.x, p.y, 240, 134) < 40) return this.run.floor >= 3 ? '[ F ]  ENTER THE LAST LIGHT' : '[ F ]  DESCEND TO THE NEXT FLOOR';
    const chest = this.currentRoom.chest;
    if (chest && !chest.open && dist(p.x, p.y, chest.x, chest.y) < 38) return '[ F ]  OPEN THE ' + chest.kind.toUpperCase() + ' CHEST';
    const weapon = this.currentRoom.drops.find((d) => d.type === 'weapon' && !d.collected && dist(p.x, p.y, d.x, d.y) < 34);
    if (weapon) return `[ F ]  EQUIP ${WEAPONS[weapon.weapon]?.name?.toUpperCase() || 'WEAPON'}  ·  SLOT ${this.run.activeSlot + 1}`;
    if (this.currentNode.type === 'shop' && dist(p.x, p.y, 240, 134) < 70) return '[ F ]  BROWSE THE MOSSBACK COUNTER';
    if (this.currentNode.type === 'shrine' && !this.currentRoom.eventResolved) return '[ F ]  LISTEN TO THE SHRINE';
    return '';
  }

  updateSettingsFromRun() { this.sound.setVolumes(this.save.settings); }

  endRun(outcome) {
    if (!this.run || this.screen === 'results') return;
    this.run.stats.elapsed = (performance.now() - this.run.stats.startedAt) / 1000;
    const bosses = this.run.stats.bossesDefeated;
    const baseReward = 2 + this.run.floor * 2 + this.run.stats.roomsCleared + Math.floor(this.run.stats.enemiesDefeated / 7) + bosses * 4;
    const rewardMemory = Math.max(2, baseReward + (outcome === 'victory' ? 10 : outcome === 'retreat' ? 0 : 0));
    const elapsed = Math.floor(this.run.stats.elapsed);
    const prettyTime = `${Math.floor(elapsed / 60)}:${String(elapsed % 60).padStart(2, '0')}`;
    this.endedRun = {
      outcome, heroId: this.run.heroId, floor: this.run.floor, seed: this.run.seed, coins: this.run.coins,
      buffs: this.run.buffs.map((b) => ({ ...b })), stats: { ...this.run.stats, weaponsUsed: { ...this.run.stats.weaponsUsed } },
      rooms: this.run.stats.roomsCleared, kills: this.run.stats.enemiesDefeated, rewardMemory, time: prettyTime,
    };
    this.save.memory += rewardMemory;
    if (outcome === 'victory') { this.save.stats.wins++; this.save.achievements = [...new Set([...this.save.achievements, 'first-victory'])]; }
    else if (outcome === 'death') this.save.stats.deaths++;
    this.save.stats.rooms += this.run.stats.roomsCleared;
    this.save.stats.enemies += this.run.stats.enemiesDefeated;
    this.save.stats.bosses += this.run.stats.bossesDefeated;
    this.save.stats.totalCoins += this.run.stats.coinsCollected;
    this.save.stats.bestFloor = Math.max(this.save.stats.bestFloor, this.run.floor);
    this.save.stats.playSeconds += elapsed;
    this.save.lastRun = { outcome, floor: this.run.floor, kills: this.run.stats.enemiesDefeated, rooms: this.run.stats.roomsCleared, time: prettyTime };
    this.resultMessage = outcome === 'victory' ? 'The Gloamheart is quiet. The root-road is open.' : outcome === 'retreat' ? 'A deliberate retreat; the hall keeps what you found.' : 'Every expedition leaves something behind.';
    persistSave(this.save);
    this.screen = 'results'; this.overlay = 'none';
    this.sound.setTrack(outcome === 'victory' ? 'hub' : 'menu');
    this.sound.play(outcome === 'victory' ? 'level' : 'hurt', 1.2);
  }

  showToast(message, seconds = 2.35) { this.toast = message; this.toastTimer = seconds; }


}
