import { ROOM, clamp, dist, norm } from '../constants.js';
import { CLASSES, WEAPONS, BUFFS, SHOP_STOCK } from '../content.js';
import { generateFloor, directionBetween } from '../dungeon.js';
import { makeRng, randomSeed, pick } from '../rng.js';
import { persistSave } from '../save.js';
import { makeBoss, makeEnemy, makeEncounter, makeProps } from '../encounters.js';
import { OPPOSITE, SPAWN_POINTS, SAFE_ROOM_TYPES } from './shared.js';

export class RunWorld {
  startNewRun(classId = 'vanguard', ticketWeapon = null) {
    this.sound.unlock();
    this.sound.play('portal');
    const classInfo = CLASSES[classId] || CLASSES.vanguard;
    classId = classInfo.id;
    this.lastClass = classId;
    this.selectedClass = classId;
    this.save.lastClass = classId;
    const upgrades = this.save.classUpgrades?.[classId] || { vitality: 0, reservoir: 0, mastery: 0 };
    const seed = randomSeed();
    const maxHp = classInfo.maxHp + upgrades.vitality;
    const maxEnergy = classInfo.maxEnergy + upgrades.reservoir * 12;
    const chosenSecondary = ticketWeapon || this.save.preparedWeapon || this.save.loadouts?.[classId];
    const secondaryWeapon = WEAPONS[chosenSecondary] && chosenSecondary !== classInfo.primary ? chosenSecondary : classInfo.secondary;
    this.save.preparedWeapon = null;
    const skillCost = Math.max(8, classInfo.skillCost - upgrades.mastery);
    this.run = {
      classId, seed, floor: 1, level: 1, xp: 0, xpNext: 32, coins: 9,
      buffs: [], weapons: [classInfo.primary, secondaryWeapon], activeSlot: 0,
      player: {
        x: 240, y: 180, hp: maxHp, maxHp, speed: classInfo.speed, crit: classInfo.crit,
        attackMult: classInfo.attackMult * (1 + upgrades.mastery * .025),
        armor: classInfo.armor, maxArmor: classInfo.armor, aim: { x: 1, y: 0 }, attackCd: 0, attackAnim: 0,
        currentEnergy: maxEnergy, maxEnergy, energyRegen: classInfo.energyRegen + upgrades.reservoir * .65,
        skillCost, skillPower: 1 + upgrades.mastery * .04, skillCd: 0, skillAnim: 0,
        energyWarning: 0, dodgeCd: 0, dodgeTime: 0, invuln: 0, flow: 0, flowReady: false,
        passiveCount: 0, barkBurst: false, armorTimer: 0, lastDamage: 0, moving: false,
      },
      stats: { roomsCleared: 0, enemiesDefeated: 0, bossesDefeated: 0, damageDealt: 0, damageTaken: 0, coinsCollected: 0, startedAt: performance.now(), weaponsUsed: {} },
    };
    this.save.stats.runs += 1;
    this.save.discoveries.weapons ||= [];
    for (const weaponId of [classInfo.primary, secondaryWeapon]) {
      if (!this.save.discoveries.weapons.includes(weaponId)) this.save.discoveries.weapons.push(weaponId);
    }
    persistSave(this.save);
    this.rng = makeRng(seed);
    this.fxRng = makeRng(seed ^ 0xa5a5c3e1);
    this.nextEntityId = 1;
    this.deathTimer = 0;
    this.endedRun = null;
    this.createFloor(1);
    this.screen = 'run';
    this.overlay = 'none';
    this.sound.setTrack('dungeon');
    this.showToast(`RUN SEED ${seed}  ·  THE GLOAM IS LISTENING`);
  }

  createFloor(floor) {
    this.run.floor = floor;
    const floorSeed = (this.run.seed + Math.imul(floor, 0x9e3779b9)) >>> 0;
    this.map = generateFloor(floorSeed, floor);
    this.roomRecords = {};
    for (const node of this.map.nodes) {
      const seed = this.hashRoomSeed(floorSeed, node.id);
      this.roomRecords[node.id] = {
        seed, type: node.type, props: makeProps(seed, node.type), enemies: [], projectiles: [], particles: [], numbers: [], drops: [],
        waves: [], waveIndex: 0, started: false, locked: false, waveDelay: 0, chest: null, portalReady: false,
        shopItems: null, shopVisited: false, eventResolved: false, encounterEnded: false,
      };
    }
    this.boss = null;
    this.enterRoom(this.map.startId, null);
  }

  hashRoomSeed(seed, label) {
    let hash = seed >>> 0;
    for (let i = 0; i < label.length; i++) hash = Math.imul(hash ^ label.charCodeAt(i), 16777619);
    return hash >>> 0;
  }

  enterRoom(id, fromDirection) {
    const node = this.map.byId[id];
    if (!node) return;
    this.currentNode = node;
    this.currentRoom = this.roomRecords[id];
    const wasVisited = node.visited;
    node.visited = true;
    if (fromDirection) {
      const entrance = OPPOSITE[fromDirection];
      if (entrance === 'west') { this.run.player.x = ROOM.left + 18; this.run.player.y = ROOM.centerY; }
      else if (entrance === 'east') { this.run.player.x = ROOM.right - 18; this.run.player.y = ROOM.centerY; }
      else if (entrance === 'north') { this.run.player.x = ROOM.centerX; this.run.player.y = ROOM.top + 18; }
      else { this.run.player.x = ROOM.centerX; this.run.player.y = ROOM.bottom - 18; }
    } else { this.run.player.x = 240; this.run.player.y = 184; }
    this.updateDoorMap();
    if (!wasVisited) {
      this.showToast(`${this.roomTitle(node.type)}  ·  ${this.map.linkMap[node.id].length} PATH${this.map.linkMap[node.id].length === 1 ? '' : 'S'}`);
      if (node.type === 'shop') this.currentRoom.shopVisited = false;
    }
    if (SAFE_ROOM_TYPES.has(node.type)) {
      if (node.type === 'treasure' && !this.currentRoom.chest && !node.rewardClaimed) this.currentRoom.chest = this.makeChest(240, 137, 'treasure');
      if (node.type === 'shop') this.visitShop();
      if (node.type === 'shrine') this.visitShrine();
      return;
    }
    if (node.type === 'boss') {
      if (!this.currentRoom.started && !node.cleared) {
        this.currentRoom.started = true;
        this.currentRoom.locked = true;
        this.boss = makeBoss(this.run.floor, this.fxRng);
        this.boss.id = `boss-${this.nextEntityId++}`;
        this.currentRoom.enemies = [this.boss];
        this.sound.setTrack('boss');
        this.sound.play('boss');
        this.showToast('THE HOLLOW BLOOM STIRS');
      } else if (node.cleared) this.boss = this.currentRoom.enemies.find((e) => e.role === 'boss') || null;
      this.updateDoorMap();
      return;
    }
    if (!node.cleared && !this.currentRoom.started) this.startEncounter();
    this.updateDoorMap();
  }

  roomTitle(type) {
    return ({ start: 'Waystone', combat: 'Overgrown chamber', elite: 'Thorn trial', treasure: 'Root-vault', shop: 'Mossback counter', shrine: 'Listening shrine', boss: 'Hollow court' })[type] || 'Old room';
  }

  updateDoorMap() {
    if (!this.currentNode || !this.currentRoom) return;
    const doorMap = { north: 'none', east: 'none', south: 'none', west: 'none' };
    const open = this.currentNode.cleared || SAFE_ROOM_TYPES.has(this.currentNode.type);
    for (const nextId of this.map.linkMap[this.currentNode.id] || []) {
      const dir = directionBetween(this.currentNode, this.map.byId[nextId]);
      if (dir) doorMap[dir] = open;
    }
    this.currentRoom.doors = doorMap;
  }

  startEncounter() {
    this.currentRoom.started = true;
    this.currentRoom.locked = true;
    this.currentRoom.waves = makeEncounter(this.currentNode, this.run.floor, this.currentRoom.seed);
    this.currentRoom.waveIndex = 0;
    if (!this.currentRoom.waves.length) return this.clearRoom();
    this.spawnWave();
    this.sound.play('clear', .35);
    this.updateDoorMap();
  }

  spawnWave() {
    const wave = this.currentRoom.waves[this.currentRoom.waveIndex] || [];
    this.currentRoom.enemies = [];
    for (let i = 0; i < wave.length; i++) {
      const candidates = SPAWN_POINTS.map((point) => ({ point, tie: this.rng() })).sort((a, b) => a.tie - b.tie);
      let selected = candidates.find(({ point }) => dist(point[0], point[1], this.run.player.x, this.run.player.y) >= 66
        && !this.collidesSolid(point[0], point[1], 11)
        && !this.currentRoom.enemies.some((e) => dist(point[0], point[1], e.x, e.y) < 26));
      const [x, y] = selected?.point || SPAWN_POINTS[(this.nextEntityId + i * 3) % SPAWN_POINTS.length];
      const enemy = makeEnemy(wave[i], x, y, this.run.floor, this.fxRng);
      if (!enemy) continue;
      enemy.id = `enemy-${this.nextEntityId++}`;
      enemy.x = Math.round(x + (this.rng() - .5) * 14);
      enemy.y = Math.round(y + (this.rng() - .5) * 12);
      enemy.phase = this.fxRng() * 6;
      enemy.attackTimer = .5 + this.rng() * .9;
      enemy.contactCd = 0;
      this.currentRoom.enemies.push(enemy);
      this.emitParticles(enemy.x, enemy.y, enemy.color, 6, 18);
    }
    this.currentRoom.waveDelay = 0;
  }

  visitShop() {
    if (!this.currentRoom.shopItems) {
      const r = makeRng(this.currentRoom.seed ^ 0x7a3211);
      const picks = [];
      const stock = [...SHOP_STOCK];
      while (picks.length < 3 && stock.length) {
        const i = Math.floor(r() * stock.length);
        const item = stock.splice(i, 1)[0];
        picks.push({ ...item, price: item.price + (this.run.floor - 1) * 2, bought: false });
      }
      this.currentRoom.shopItems = picks;
    }
    this.shopItems = this.currentRoom.shopItems;
    if (!this.currentRoom.shopVisited) {
      this.currentRoom.shopVisited = true;
      this.overlay = 'shop';
    }
  }

  visitShrine() {
    if (this.currentRoom.eventResolved || this.overlay === 'event') return;
    this.eventData = {
      title: 'THE LISTENING SHRINE',
      subtitle: 'Something beneath the stone offers a bargain.',
      options: [
        { id: 'blood', title: 'PAY IN BLOOD', description: 'Lose 1 Health · gain a rare knot.', action: 'blood' },
        { id: 'warmth', title: 'ASK FOR WARMTH', description: 'Restore up to 2 Health · no other price.', action: 'warmth' },
        { id: 'amber', title: 'LEAVE AN OFFERING', description: 'Spend 7 amber · gain 18 amber back.', action: 'amber' },
      ],
    };
    this.overlay = 'event';
  }

  chooseEvent(index) {
    if (!this.eventData || !this.eventData.options[index]) return;
    const action = this.eventData.options[index].action;
    if (action === 'blood') {
      this.run.player.hp = Math.max(1, this.run.player.hp - 1);
      const rare = ['stormpollen', 'cinderblood', 'splitseed'].filter((id) => this.buffStacks(id) < BUFFS[id].maxStacks);
      this.grantBuff(rare.length ? pick(this.rng, rare) : 'quickbloom');
      this.showToast('The shrine takes a heartbeat and gives back a spark.');
    } else if (action === 'warmth') {
      const before = this.run.player.hp;
      this.run.player.hp = Math.min(this.run.player.maxHp, this.run.player.hp + 2);
      this.showToast(`Warmth restored ${Math.round(this.run.player.hp - before)} HP.`);
    } else if (action === 'amber') {
      if (this.run.coins >= 7) { this.run.coins -= 7; this.run.coins += 18; this.showToast('The offering returns as a brighter handful.'); }
      else this.showToast('You have less than seven amber; the shrine lets you pass.');
    }
    this.currentRoom.eventResolved = true;
    this.currentNode.cleared = true;
    this.overlay = 'none';
    this.updateDoorMap();
    this.sound.play('level');
  }


}
