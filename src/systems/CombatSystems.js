import { ROOM, clamp, dist, norm } from '../constants.js';
import { CLASSES, WEAPONS } from '../content.js';
import { directionBetween } from '../dungeon.js';
import { makeEnemy } from '../encounters.js';
import { persistSave } from '../save.js';
import { RunWorld } from './RunWorld.js';
import { INTERIOR } from './shared.js';

export class CombatSystems extends RunWorld {
  updateRun(dt) {
    if (!this.run || !this.currentRoom || !this.currentNode) return;
    if (this.deathTimer > 0) {
      this.deathTimer -= dt;
      if (this.deathTimer <= 0) this.endRun('death');
      this.updateTransientEffects(dt);
      return;
    }
    const player = this.run.player;
    const room = this.currentRoom;
    this.run.stats.elapsed = (performance.now() - this.run.stats.startedAt) / 1000;
    player.attackCd = Math.max(0, player.attackCd - dt);
    player.attackAnim = Math.max(0, player.attackAnim - dt);
    player.skillCd = Math.max(0, player.skillCd - dt);
    player.skillAnim = Math.max(0, player.skillAnim - dt);
    player.dodgeCd = Math.max(0, player.dodgeCd - dt);
    player.dodgeTime = Math.max(0, player.dodgeTime - dt);
    player.invuln = Math.max(0, player.invuln - dt);
    player.armorTimer = Math.max(0, player.armorTimer - dt);
    player.currentEnergy = clamp(player.currentEnergy + player.energyRegen * dt, 0, player.maxEnergy);
    player.energyWarning = Math.max(0, player.energyWarning - dt);
    player.lastDamage += dt;
    if (player.armorTimer <= 0 && player.armor < player.maxArmor && player.lastDamage > 4) {
      player.armor = Math.min(player.maxArmor, player.armor + dt * .25);
    }
    if (player.flowReady) player.flow = Math.max(.9, player.flow);

    if (this.input.wasPressed('1')) this.run.activeSlot = 0;
    if (this.input.wasPressed('2')) this.run.activeSlot = 1;
    if (this.input.wasPressed('q')) this.activateSkill();
    if (this.input.wasPressed('shift')) this.startDodge();
    if (this.input.wasPressed('e')) {
      this.interact();
      if (this.overlay !== 'none') return;
    }

    const dx = (this.input.isDown('d') || this.input.isDown('arrowright') ? 1 : 0) - (this.input.isDown('a') || this.input.isDown('arrowleft') ? 1 : 0);
    const dy = (this.input.isDown('s') || this.input.isDown('arrowdown') ? 1 : 0) - (this.input.isDown('w') || this.input.isDown('arrowup') ? 1 : 0);
    const moving = Math.hypot(dx, dy) > .1;
    player.moving = moving;
    if (moving) {
      const direction = norm(dx, dy);
      player.flow = Math.min(1.15, player.flow + dt);
      if (this.run.classId === 'ranger' && player.flow >= .95) player.flowReady = true;
      const speed = player.speed * (1 + this.buffStacks('quickbloom') * .08) * (player.dodgeTime > 0 ? 3.0 : 1);
      if (this.movePlayer(direction.x * speed * dt, direction.y * speed * dt)) return;
    } else if (this.run.classId === 'ranger' && !player.flowReady) player.flow = Math.max(0, player.flow - dt * .72);

    const pointer = this.input.pointer;
    const pointerOnHud = (pointer.x >= 6 && pointer.x <= 196 && pointer.y >= 6 && pointer.y <= 62)
      || (pointer.x >= 205 && pointer.x <= 403 && pointer.y >= 7 && pointer.y <= 55)
      || (pointer.x >= 414 && pointer.x <= 475 && pointer.y >= 7 && pointer.y <= 61)
      || (pointer.x >= 6 && pointer.x <= 132 && pointer.y >= 226 && pointer.y <= 264)
      || (pointer.x >= 137 && pointer.x <= 344 && pointer.y >= 228 && pointer.y <= 247);
    if (pointer.active && !pointerOnHud) player.aim = norm(pointer.x - player.x, pointer.y - player.y);
    if ((pointer.down && !pointerOnHud) || this.input.isDown('space')) this.tryAttack();

    this.updateEnemies(dt);
    this.updateProjectiles(dt);
    this.updateDrops(dt);
    this.updateRoomState(dt);
    this.updateTransientEffects(dt);
  }

  movePlayer(dx, dy) {
    const p = this.run.player;
    let nextX = p.x + dx;
    if (!this.collidesSolid(nextX, p.y, 6)) p.x = nextX;
    let nextY = p.y + dy;
    if (!this.collidesSolid(p.x, nextY, 6)) p.y = nextY;
    const x = p.x; const y = p.y; const door = this.currentRoom.doors || {};
    if (x < ROOM.left + 7 && Math.abs(y - ROOM.centerY) < 16 && door.west === true) return this.traverse('west');
    if (x > ROOM.right - 7 && Math.abs(y - ROOM.centerY) < 16 && door.east === true) return this.traverse('east');
    if (y < ROOM.top + 6 && Math.abs(x - ROOM.centerX) < 17 && door.north === true) return this.traverse('north');
    if (y > ROOM.bottom - 6 && Math.abs(x - ROOM.centerX) < 17 && door.south === true) return this.traverse('south');
    p.x = clamp(p.x, INTERIOR.minX, INTERIOR.maxX);
    p.y = clamp(p.y, INTERIOR.minY, INTERIOR.maxY);
    return false;
  }

  collidesSolid(x, y, radius) {
    for (const prop of this.currentRoom.props) {
      if (!prop.solid) continue;
      const nearX = clamp(x, prop.x, prop.x + prop.w);
      const nearY = clamp(y, prop.y, prop.y + prop.h);
      if (dist(x, y, nearX, nearY) < radius + .2) return true;
    }
    return false;
  }

  moveEnemy(enemy, dx, dy) {
    const nx = enemy.x + dx;
    if (!this.collidesSolid(nx, enemy.y, enemy.radius * .68)) enemy.x = nx;
    const ny = enemy.y + dy;
    if (!this.collidesSolid(enemy.x, ny, enemy.radius * .68)) enemy.y = ny;
    enemy.x = clamp(enemy.x, ROOM.left + enemy.radius, ROOM.right - enemy.radius);
    enemy.y = clamp(enemy.y, ROOM.top + enemy.radius, ROOM.bottom - enemy.radius);
  }

  traverse(direction) {
    const neighborId = (this.map.linkMap[this.currentNode.id] || []).find((id) => directionBetween(this.currentNode, this.map.byId[id]) === direction);
    if (!neighborId) return false;
    const target = this.map.byId[neighborId];
    if (!this.currentRoom.doors?.[direction]) return false;
    this.sound.play('portal', .35);
    this.enterRoom(neighborId, direction);
    return true;
  }

  startDodge() {
    const p = this.run.player;
    if (p.dodgeCd > 0 || p.invuln > 0) return;
    const x = (this.input.isDown('d') ? 1 : 0) - (this.input.isDown('a') ? 1 : 0);
    const y = (this.input.isDown('s') ? 1 : 0) - (this.input.isDown('w') ? 1 : 0);
    const d = Math.hypot(x, y) > 0 ? norm(x, y) : p.aim;
    p.dodgeCd = .76; p.dodgeTime = .19; p.invuln = .38;
    this.sound.play('skill', .55);
    this.emitParticles(p.x - d.x * 7, p.y - d.y * 7, this.run.classId === 'vanguard' ? '#a9bf82' : '#77d3c0', 8, 42);
  }

  activateSkill() {
    const player = this.run?.player;
    if (!player || player.skillCd > 0 || this.overlay !== 'none') return false;
    const classInfo = CLASSES[this.run.classId];
    if (player.currentEnergy < player.skillCost) {
      player.energyWarning = .8;
      this.showToast(`NOT ENOUGH ENERGY  ·  ${Math.ceil(player.skillCost - player.currentEnergy)} NEEDED`, 1.4);
      this.sound.play('hurt', .35);
      return false;
    }
    player.currentEnergy = clamp(player.currentEnergy - player.skillCost, 0, player.maxEnergy);
    player.skillCd = classInfo.skillCooldown;
    player.skillAnim = .8;
    player.energyWarning = 0;
    this.sound.play('skill', 1.1);
    if (classInfo.id === 'vanguard') {
      this.emitRing(player.x, player.y, '#bbd58e', 14);
      for (const enemy of this.currentRoom.enemies) {
        if (!enemy.alive) continue;
        if (dist(player.x, player.y, enemy.x, enemy.y) <= 78) {
          this.damageEnemy(enemy, 4 * player.attackMult * player.skillPower, { element: 'Physical', knockback: 105, stagger: .48, skill: true });
        }
      }
      player.armor = Math.min(player.maxArmor, player.armor + 1);
      this.showToast('FAULTLINE  ·  roots answer the hammer');
    } else {
      const dx = (this.input.isDown('d') ? 1 : 0) - (this.input.isDown('a') ? 1 : 0);
      const dy = (this.input.isDown('s') ? 1 : 0) - (this.input.isDown('w') ? 1 : 0);
      const d = Math.hypot(dx, dy) > 0 ? norm(dx, dy) : player.aim;
      const ox = player.x; const oy = player.y;
      for (let i = 0; i < 12; i++) {
        const didTransition = this.movePlayer(d.x * 9, d.y * 9);
        if (didTransition) break;
      }
      player.invuln = Math.max(player.invuln, .5);
      this.emitParticles(ox, oy, '#8ce0c1', 16, 60);
      this.emitParticles(player.x, player.y, '#f2be68', 13, 55);
      for (const enemy of this.currentRoom.enemies) {
        if (!enemy.alive) continue;
        const a = dist(ox, oy, enemy.x, enemy.y); const b = dist(player.x, player.y, enemy.x, enemy.y);
        if (Math.min(a, b) < 27 || this.distanceToSegment(enemy.x, enemy.y, ox, oy, player.x, player.y) < 13) {
          this.damageEnemy(enemy, 3.5 * player.attackMult * player.skillPower, { element: 'Fire', knockback: 80, skill: true });
        }
      }
      this.showToast('LANTERN SKIP  ·  leave a burning afterimage');
    }
    return true;
  }

  distanceToSegment(px, py, x1, y1, x2, y2) {
    const dx = x2 - x1; const dy = y2 - y1;
    const t = clamp(((px - x1) * dx + (py - y1) * dy) / (dx * dx + dy * dy || 1), 0, 1);
    return dist(px, py, x1 + t * dx, y1 + t * dy);
  }

  tryAttack() {
    const p = this.run.player;
    if (p.attackCd > 0 || this.deathTimer > 0) return;
    const weapon = WEAPONS[this.run.weapons[this.run.activeSlot]];
    if (!weapon) return;
    const quick = this.buffStacks('quickbloom');
    p.attackCd = Math.max(.2, weapon.interval / (1 + quick * .07));
    p.attackAnim = .22;
    this.run.stats.weaponsUsed[weapon.id] = (this.run.stats.weaponsUsed[weapon.id] || 0) + 1;
    if (weapon.kind === 'melee') {
      this.sound.play('swing');
      const burst = this.run.classId === 'vanguard' && p.barkBurst;
      let meleeHits = 0;
      for (const enemy of this.currentRoom.enemies) {
        if (!enemy.alive) continue;
        const dx = enemy.x - p.x; const dy = enemy.y - p.y; const d = Math.hypot(dx, dy);
        const dot = (dx * p.aim.x + dy * p.aim.y) / (d || 1);
        if (d <= weapon.range + (burst ? 14 : 0) + enemy.radius && (dot > -.1 || d < 17)) {
          const damage = weapon.damage * p.attackMult * (burst ? 1.7 : 1);
          this.damageEnemy(enemy, damage, { element: weapon.element, knockback: weapon.knockback + (burst ? 40 : 0), forceCrit: this.consumeFlowBonus(), isMelee: true });
          meleeHits++;
        }
      }
      if (this.run.classId === 'vanguard' && meleeHits > 0) {
        if (p.barkBurst) { p.barkBurst = false; p.armor = Math.min(p.maxArmor, p.armor + 1); p.hp = Math.min(p.maxHp, p.hp + 1); this.emitRing(p.x, p.y, '#a6c27a', 10); }
        else {
          p.passiveCount += meleeHits;
          if (p.passiveCount >= 3) { p.passiveCount %= 3; p.barkBurst = true; this.showToast('KNOT OF THREE  ·  next maul bursts'); }
        }
      }
    } else {
      this.sound.play('shoot', .7);
      let count = weapon.projectiles || 1;
      if (weapon.kind !== 'chain') count += this.buffStacks('splitseed');
      const center = Math.atan2(p.aim.y, p.aim.x);
      const spread = weapon.spread || (count > 1 ? .14 : 0);
      for (let i = 0; i < count; i++) {
        const offset = count === 1 ? 0 : (i - (count - 1) / 2) * spread;
        const angle = center + offset;
        const speed = weapon.projectileSpeed || 180;
        const multiplier = i < (weapon.projectiles || 1) ? 1 : .72;
        this.currentRoom.projectiles.push({
          id: `p-${this.nextEntityId++}`, friendly: true, x: p.x + Math.cos(angle) * 10, y: p.y + Math.sin(angle) * 9,
          vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed, damage: weapon.damage * p.attackMult * multiplier,
          element: weapon.element, life: (weapon.range || 180) / speed, pierce: weapon.pierce || 0,
          chain: weapon.chain || 0, kind: weapon.kind, returning: false, age: 0, hit: new Set(), forceCrit: this.consumeFlowBonus(),
        });
      }
    }
  }

  consumeFlowBonus() {
    const p = this.run.player;
    if (this.run.classId === 'ranger' && p.flowReady) {
      p.flowReady = false; p.flow = 0;
      return true;
    }
    return 0;
  }

  damageEnemy(enemy, raw, options = {}) {
    if (!enemy?.alive) return 0;
    const p = this.run.player;
    let damage = raw;
    const critChance = clamp(p.crit + (options.critBonus || 0), 0, .75);
    const critical = !options.noCrit && (options.forceCrit || this.rng() < critChance);
    if (critical) damage *= 1.65;
    if (enemy.shield > 0) {
      const absorbed = Math.min(enemy.shield, damage * .75);
      enemy.shield -= absorbed;
      damage -= absorbed;
    }
    damage = Math.max(1, Math.round(damage));
    enemy.hp -= damage;
    enemy.flash = .085;
    enemy.stagger = Math.max(enemy.stagger, options.stagger || 0);
    if (options.knockback) {
      const d = norm(enemy.x - p.x, enemy.y - p.y);
      enemy.vx += d.x * options.knockback;
      enemy.vy += d.y * options.knockback;
    }
    this.run.stats.damageDealt += damage;
    this.addDamageNumber(enemy.x, enemy.y - (enemy.role === 'boss' ? 30 : 8), damage, critical ? '#f4ce73' : (options.status ? '#bdcf8b' : '#f0e5c3'), critical);
    this.emitParticles(enemy.x, enemy.y, critical ? '#f4ce73' : (options.element === 'Fire' ? '#ee9160' : '#e7dbb7'), critical ? 8 : 4, critical ? 48 : 30);
    this.sound.play(critical ? 'crit' : 'hit', critical ? 1 : .5);

    if (!options.status && (options.element === 'Fire' || this.buffStacks('cinderblood') > 0)) {
      const stacks = this.buffStacks('cinderblood');
      enemy.burn = Math.max(enemy.burn, 1.5 + stacks * .45);
      enemy.burnDps = Math.max(enemy.burnDps || 0, Math.max(1, damage * (.16 + stacks * .07)));
    }
    if (this.buffStacks('stormpollen') > 0 && !options.noChain) {
      const nearby = this.currentRoom.enemies.find((other) => other.alive && other.id !== enemy.id && dist(enemy.x, enemy.y, other.x, other.y) < 68 + this.buffStacks('stormpollen') * 8);
      if (nearby) {
        this.emitLine(enemy.x, enemy.y, nearby.x, nearby.y, '#f2d66f');
        this.damageEnemy(nearby, damage * .45, { element: 'Lightning', noCrit: true, noChain: true, status: true });
      }
    }
    if (enemy.kind === 'brassback' && !enemy.chargeTime) enemy.stagger = Math.max(enemy.stagger, .07);
    if (enemy.hp <= 0) this.killEnemy(enemy);
    return damage;
  }

  killEnemy(enemy) {
    if (!enemy.alive) return;
    enemy.alive = false;
    const room = this.currentRoom;
    this.run.stats.enemiesDefeated++;
    if (this.save.discoveries.enemies && !this.save.discoveries.enemies.includes(enemy.kind)) {
      this.save.discoveries.enemies.push(enemy.kind);
      persistSave(this.save);
    }
    this.sound.play('enemyDown', .7);
    this.emitParticles(enemy.x, enemy.y, enemy.color || '#a4bd80', enemy.role === 'boss' ? 36 : 13, enemy.role === 'boss' ? 65 : 46);
    room.drops.push({ id: `drop-${this.nextEntityId++}`, type: 'xp', x: enemy.x, y: enemy.y, amount: enemy.xp, phase: this.fxRng() * 6, vx: (this.fxRng() - .5) * 22, vy: (this.fxRng() - .5) * 22 });
    if (enemy.coins > 0) room.drops.push({ id: `drop-${this.nextEntityId++}`, type: 'coins', x: enemy.x + 6, y: enemy.y - 3, amount: enemy.coins, phase: this.fxRng() * 6, vx: (this.fxRng() - .5) * 30, vy: (this.fxRng() - .5) * 30 });
    if (enemy.role === 'boss') {
      this.run.stats.bossesDefeated++;
      this.boss = enemy;
      this.currentRoom.bossDying = 1.65;
      this.currentRoom.locked = true;
      this.save.discoveries.bosses ||= [];
      if (!this.save.discoveries.bosses.includes(enemy.name)) this.save.discoveries.bosses.push(enemy.name);
      this.save.achievements = [...new Set([...this.save.achievements, 'first-boss'])];
      persistSave(this.save);
      this.sound.play('boss', .8);
      this.showToast('THE BLOOM FALTERS  ·  THE ARENA IS QUIET');
    }
  }

  updateEnemies(dt) {
    const p = this.run.player;
    const enemies = this.currentRoom.enemies;
    for (const enemy of enemies) {
      if (!enemy.alive) continue;
      enemy.flash = Math.max(0, enemy.flash - dt);
      enemy.stagger = Math.max(0, enemy.stagger - dt);
      enemy.contactCd = Math.max(0, (enemy.contactCd || 0) - dt);
      enemy.slow = Math.max(0, enemy.slow - dt);
      if (enemy.burn > 0) {
        enemy.burn -= dt; enemy.burnTick = (enemy.burnTick || 0) - dt;
        if (enemy.burnTick <= 0 && enemy.alive) {
          enemy.burnTick = .45;
          this.damageEnemy(enemy, Math.max(1, (enemy.burnDps || 4) * .45), { noCrit: true, noChain: true, status: true, element: 'Fire' });
        }
      }
      if (!enemy.alive) continue;
      enemy.vx *= Math.pow(.02, dt); enemy.vy *= Math.pow(.02, dt);
      if (Math.abs(enemy.vx) + Math.abs(enemy.vy) > 1) this.moveEnemy(enemy, enemy.vx * dt, enemy.vy * dt);
      if (enemy.stagger > 0) continue;
      if (enemy.role === 'boss') { this.updateBoss(enemy, dt); continue; }
      if (enemy.telegraph > 0) {
        enemy.telegraph -= dt;
        if (enemy.telegraph <= 0) this.resolveEnemyTelegraph(enemy);
        continue;
      }
      if (enemy.chargeTime > 0) {
        enemy.chargeTime -= dt;
        this.moveEnemy(enemy, enemy.vx * dt, enemy.vy * dt);
        if (dist(enemy.x, enemy.y, p.x, p.y) < enemy.radius + 9) this.damagePlayer(enemy.touch + 1, enemy);
        continue;
      }
      const d = dist(enemy.x, enemy.y, p.x, p.y);
      const direction = norm(p.x - enemy.x, p.y - enemy.y);
      if (enemy.role === 'ranged') {
        if (d > enemy.range - 16) this.moveEnemy(enemy, direction.x * enemy.speed * dt, direction.y * enemy.speed * dt);
        else if (d < enemy.range - 45) this.moveEnemy(enemy, -direction.x * enemy.speed * .7 * dt, -direction.y * enemy.speed * .7 * dt);
        enemy.attackTimer -= dt;
        if (enemy.attackTimer <= 0 && d < 185) {
          enemy.attackMode = 'shoot'; enemy.targetX = p.x; enemy.targetY = p.y; enemy.telegraph = .54; enemy.attackTimer = 1.35 + this.rng() * .5;
        }
      } else if (enemy.role === 'charger') {
        if (d > 37) this.moveEnemy(enemy, direction.x * enemy.speed * dt, direction.y * enemy.speed * dt);
        enemy.attackTimer -= dt;
        if (enemy.attackTimer <= 0 && d < 185) {
          enemy.attackMode = 'charge'; enemy.targetX = p.x; enemy.targetY = p.y; enemy.telegraph = .68; enemy.attackTimer = 2.15;
        }
      } else if (enemy.role === 'support') {
        const ally = enemies.find((e) => e.alive && e.id !== enemy.id && e.hp < e.maxHp && dist(e.x, e.y, enemy.x, enemy.y) < 100);
        if (!ally && d > 88) this.moveEnemy(enemy, direction.x * enemy.speed * dt, direction.y * enemy.speed * dt);
        enemy.attackTimer -= dt;
        if (enemy.attackTimer <= 0) {
          enemy.attackMode = ally ? 'heal' : 'shoot'; enemy.targetX = ally ? ally.x : p.x; enemy.targetY = ally ? ally.y : p.y;
          enemy.targetId = ally?.id; enemy.telegraph = .75; enemy.attackTimer = 2.2;
        }
      } else if (enemy.kind === 'thornsentinel') {
        if (d > 73) this.moveEnemy(enemy, direction.x * enemy.speed * .76 * dt, direction.y * enemy.speed * .76 * dt);
        enemy.attackTimer -= dt;
        if (enemy.attackTimer <= 0) {
          enemy.attackMode = 'ring'; enemy.targetX = p.x; enemy.targetY = p.y; enemy.telegraph = .75; enemy.attackTimer = 2.2;
        }
      } else {
        if (d > enemy.radius + 9) this.moveEnemy(enemy, direction.x * enemy.speed * dt, direction.y * enemy.speed * dt);
      }
      if (d < enemy.radius + 8 && enemy.contactCd <= 0) {
        this.damagePlayer(enemy.touch, enemy);
        enemy.contactCd = .83;
      }
    }
  }

  resolveEnemyTelegraph(enemy) {
    if (!enemy.alive) return;
    if (enemy.attackMode === 'shoot') {
      this.enemyShot(enemy, enemy.targetX, enemy.targetY, enemy.role === 'support' ? 92 : 122, 1);
    } else if (enemy.attackMode === 'charge') {
      const d = norm(enemy.targetX - enemy.x, enemy.targetY - enemy.y);
      enemy.vx = d.x * 270; enemy.vy = d.y * 270; enemy.chargeTime = .48;
      this.emitParticles(enemy.x, enemy.y, '#de9864', 6, 45);
    } else if (enemy.attackMode === 'heal') {
      const ally = this.currentRoom.enemies.find((e) => e.id === enemy.targetId && e.alive);
      if (ally) {
        const amount = Math.min(2, ally.maxHp - ally.hp); ally.hp += amount; ally.flash = .14;
        this.addDamageNumber(ally.x, ally.y - 10, `+${Math.round(amount)}`, '#a7da91', false);
        this.emitParticles(ally.x, ally.y, '#a9d892', 7, 28);
      }
    } else if (enemy.attackMode === 'ring') {
      for (let i = 0; i < 8; i++) {
        const a = i * Math.PI / 4 + this.time * .2;
        this.enemyShot(enemy, enemy.x + Math.cos(a) * 40, enemy.y + Math.sin(a) * 40, 82, 9);
      }
    }
    enemy.attackMode = '';
  }

  updateBoss(enemy, dt) {
    if (enemy.entrance > 0) {
      enemy.entrance -= dt;
      if (enemy.entrance <= 0) this.showToast(`${enemy.name.toUpperCase()}  ·  PHASE I`);
      return;
    }
    const ratio = enemy.hp / enemy.maxHp;
    if (ratio <= .65 && enemy.bossPhase === 1) {
      enemy.bossPhase = 2; enemy.attackTimer = .7; this.sound.play('boss', 1.2); this.showToast('THE HOLLOW BLOOM OPENS  ·  PHASE II');
      this.emitParticles(enemy.x, enemy.y, '#df8c64', 25, 48);
    }
    if (ratio <= .28 && enemy.bossPhase === 2) {
      enemy.bossPhase = 3; enemy.attackTimer = .65; this.sound.play('boss', 1.35); this.showToast('THE HEART ROOTS BREAK  ·  FINAL PHASE');
      this.emitRing(enemy.x, enemy.y, '#ea9b68', 26);
    }
    if (enemy.telegraph > 0) {
      enemy.telegraph -= dt;
      if (enemy.telegraph <= 0) this.resolveBossTelegraph(enemy);
      return;
    }
    const d = dist(enemy.x, enemy.y, this.run.player.x, this.run.player.y);
    const direction = norm(this.run.player.x - enemy.x, this.run.player.y - enemy.y);
    if (d > 76) this.moveEnemy(enemy, direction.x * enemy.speed * dt, direction.y * enemy.speed * dt);
    else if (d < 62) this.moveEnemy(enemy, -direction.x * enemy.speed * .7 * dt, -direction.y * enemy.speed * .7 * dt);
    enemy.attackTimer -= dt;
    if (enemy.attackTimer <= 0) {
      const pattern = enemy.pattern++ % 3;
      enemy.attackMode = pattern === 0 ? 'slam' : pattern === 1 ? 'bloom' : 'fan';
      enemy.targetX = this.run.player.x; enemy.targetY = this.run.player.y;
      enemy.telegraph = enemy.attackMode === 'slam' ? .82 : .68;
      enemy.attackTimer = (enemy.bossPhase === 3 ? 1.16 : enemy.bossPhase === 2 ? 1.52 : 1.95);
    }
    if (d < enemy.radius + 8 && enemy.contactCd <= 0) {
      this.damagePlayer(enemy.touch, enemy); enemy.contactCd = .9;
    }
  }

  resolveBossTelegraph(enemy) {
    const phase = enemy.bossPhase;
    if (enemy.attackMode === 'slam') {
      this.emitRing(enemy.targetX, enemy.targetY, '#e88b64', 19);
      if (dist(this.run.player.x, this.run.player.y, enemy.targetX, enemy.targetY) < 32) this.damagePlayer(2, enemy);
      const count = phase === 1 ? 5 : phase === 2 ? 8 : 12;
      for (let i = 0; i < count; i++) {
        const a = i * Math.PI * 2 / count + this.time * .12;
        this.enemyShot(enemy, enemy.x + Math.cos(a) * 38, enemy.y + Math.sin(a) * 38, 93 + phase * 8, 1);
      }
    } else if (enemy.attackMode === 'bloom') {
      const count = phase === 3 ? 14 : phase === 2 ? 10 : 7;
      for (let i = 0; i < count; i++) {
        const a = i * Math.PI * 2 / count + this.time * .28;
        this.enemyShot(enemy, enemy.x + Math.cos(a) * 18, enemy.y + Math.sin(a) * 18, 83 + phase * 6, 1);
      }
    } else if (enemy.attackMode === 'fan') {
      const base = Math.atan2(enemy.targetY - enemy.y, enemy.targetX - enemy.x);
      const n = phase === 3 ? 5 : 3;
      for (let i = 0; i < n; i++) {
        const angle = base + (i - (n - 1) / 2) * .2;
        this.currentRoom.projectiles.push({ id: `ep-${this.nextEntityId++}`, friendly: false, x: enemy.x, y: enemy.y, vx: Math.cos(angle) * 125, vy: Math.sin(angle) * 125, damage: 1, life: 2.3, radius: 3, element: 'Poison' });
      }
    }
    enemy.attackMode = '';
    this.sound.play('boss', .6);
  }

  enemyShot(enemy, targetX, targetY, speed = 112, damage = 1) {
    const d = norm(targetX - enemy.x, targetY - enemy.y);
    this.currentRoom.projectiles.push({ id: `ep-${this.nextEntityId++}`, friendly: false, x: enemy.x, y: enemy.y, vx: d.x * speed, vy: d.y * speed, damage, life: 2.8, radius: 3, element: 'Poison' });
  }

  updateProjectiles(dt) {
    const room = this.currentRoom;
    for (const projectile of room.projectiles) {
      if (projectile.dead) continue;
      projectile.age = (projectile.age || 0) + dt;
      if (projectile.friendly && projectile.kind === 'boomerang') {
        if (projectile.age > .62) projectile.returning = true;
        if (projectile.returning) {
          const d = norm(this.run.player.x - projectile.x, this.run.player.y - projectile.y);
          projectile.vx = d.x * 170; projectile.vy = d.y * 170;
          if (dist(projectile.x, projectile.y, this.run.player.x, this.run.player.y) < 10) projectile.dead = true;
        }
      }
      projectile.x += projectile.vx * dt;
      projectile.y += projectile.vy * dt;
      projectile.life -= dt;
      if (projectile.life <= 0 || projectile.x < ROOM.left + 2 || projectile.x > ROOM.right - 2 || projectile.y < ROOM.top + 2 || projectile.y > ROOM.bottom - 2) projectile.dead = true;
      if (projectile.dead) continue;
      const prop = room.props.find((p) => p.solid && projectile.x >= p.x - 2 && projectile.x <= p.x + p.w + 2 && projectile.y >= p.y - 2 && projectile.y <= p.y + p.h + 2);
      if (prop) {
        if (projectile.friendly && prop.destructible) this.damageProp(prop, projectile.damage * .7);
        projectile.dead = true;
        continue;
      }
      if (projectile.friendly) {
        for (const enemy of room.enemies) {
          if (!enemy.alive || projectile.hit?.has(enemy.id)) continue;
          if (dist(projectile.x, projectile.y, enemy.x, enemy.y) < enemy.radius + 4) {
            projectile.hit ||= new Set(); projectile.hit.add(enemy.id);
            this.damageEnemy(enemy, projectile.damage, { element: projectile.element, forceCrit: projectile.forceCrit || false, knockback: projectile.kind === 'pierce' ? 14 : 24, noChain: (projectile.chain || 0) > 0 || this.buffStacks('stormpollen') > 0 });
            const chainCount = (projectile.chain || 0) + this.buffStacks('stormpollen');
            if (chainCount > 0) {
              const chained = new Set([enemy.id]); let source = enemy;
              for (let jump = 0; jump < chainCount; jump++) {
                const target = room.enemies.filter((candidate) => candidate.alive && !chained.has(candidate.id))
                  .map((candidate) => ({ candidate, distance: dist(source.x, source.y, candidate.x, candidate.y) }))
                  .filter((entry) => entry.distance < 72 + this.buffStacks('stormpollen') * 8)
                  .sort((a, b) => a.distance - b.distance)[0]?.candidate;
                if (!target) break;
                chained.add(target.id);
                this.emitLine(source.x, source.y, target.x, target.y, '#f2d66f');
                this.damageEnemy(target, projectile.damage * .55, { element: 'Lightning', noCrit: true, noChain: true, status: true });
                source = target;
              }
            }
            if (projectile.pierce > 0) projectile.pierce--;
            else if (projectile.kind !== 'boomerang') projectile.dead = true;
            break;
          }
        }
      } else if (dist(projectile.x, projectile.y, this.run.player.x, this.run.player.y) < 9) {
        this.damagePlayer(projectile.damage, null);
        projectile.dead = true;
      }
    }
    room.projectiles = room.projectiles.filter((p) => !p.dead);
  }


}
