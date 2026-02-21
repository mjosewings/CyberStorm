/**
 * CYBERSTORM — enemies.js
 * All enemy types: drone, enforcer, elite, boss, UFO
 */

const Enemies = (() => {
  const W = 720, H = 500;
  const C = {
    yellow: '#FFE600', cyan: '#00F5FF', pink: '#FF003C',
    purple: '#BF00FF', green: '#39FF14', orange: '#FF6B00',
  };

  let grid = [];          // regular enemy grid
  let boss = null;
  let ufo = null;
  let ufoTimer = 0;
  let enemyDir = 1;
  let enemyShootTimer = 0;
  let frame = 0;
  let waveKills = 0;
  let totalKills = 0;

  const ROWS_BASE = 4, COLS = 10;
  const CELL_W = 58, CELL_H = 46;
  const START_X = 56, START_Y = 50;

  // ── Init ──────────────────────────────────────────

  function initWave(wave) {
    grid = [];
    boss = null;
    ufo = null;
    ufoTimer = 550 + Math.random() * 600;
    enemyDir = 1;
    waveKills = 0;
    frame = 0;

    const rows = Math.min(ROWS_BASE + Math.floor(wave / 2), 6);

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < COLS; c++) {
        const type = r === 0 ? 'elite' : r <= 1 ? 'medium' : 'drone';
        grid.push({
          x: START_X + c * CELL_W,
          y: START_Y + r * CELL_H,
          w: 38, h: 28,
          type,
          hp: type === 'elite' ? 3 : type === 'medium' ? 2 : 1,
          maxHp: type === 'elite' ? 3 : type === 'medium' ? 2 : 1,
          anim: 0,
          c, r,
          alive: true,
        });
      }
    }
  }

  function initBoss(wave) {
    boss = {
      x: W / 2, y: 80,
      w: 140, h: 80,
      vx: 1.4 + wave * 0.08,
      hp: 40 + wave * 10,
      maxHp: 40 + wave * 10,
      phase: 1,
      shootTimer: 55,
      patternTimer: 0,
      pattern: 'fan',
      armAngle: 0,
      alive: true,
    };
    ufo = null;
  }

  // ── Update ───────────────────────────────────────

  function update(wave) {
    frame++;

    // Animate enemies
    grid.forEach(e => { e.anim = Math.floor(frame / 22) % 2; });

    // Move grid
    if (grid.length > 0) {
      let hitEdge = false;
      const speed = 0.38 + wave * 0.055 + (1 - grid.length / (COLS * 6)) * 0.3;
      grid.forEach(e => { e.x += enemyDir * speed; });
      grid.forEach(e => {
        if (e.x > W - 35 || e.x < 30) hitEdge = true;
      });
      if (hitEdge) {
        enemyDir *= -1;
        grid.forEach(e => { e.y += 14; });
      }

      // Enemy shooting
      enemyShootTimer--;
      if (enemyShootTimer <= 0) {
        shootFromGrid(wave);
        enemyShootTimer = Math.max(28, 80 - wave * 5);
      }
    }

    // Boss
    if (boss && boss.alive) {
      updateBoss(wave);
    }

    // UFO
    if (ufo) {
      ufo.x += ufo.vx;
      if (ufo.x > W + 50) { ufo = null; }
    } else {
      ufoTimer--;
      if (ufoTimer <= 0 && !boss) {
        spawnUfo();
        ufoTimer = 650 + Math.random() * 700;
        AudioManager.SFX.ufoAppear();
      }
    }
  }

  function updateBoss(wave) {
    boss.x += boss.vx;
    if (boss.x > W - 80 || boss.x < 80) boss.vx *= -1;
    boss.armAngle += 0.035;
    boss.patternTimer++;
    boss.shootTimer--;

    // Phase change
    if (boss.hp < boss.maxHp * 0.5 && boss.phase === 1) {
      boss.phase = 2;
      boss.vx *= 1.4;
    }
    if (boss.hp < boss.maxHp * 0.25 && boss.phase === 2) {
      boss.phase = 3;
      boss.vx *= 1.3;
    }

    // Alternate attack patterns
    if (boss.patternTimer > 160) {
      boss.pattern = boss.pattern === 'fan' ? 'aimed' : 'fan';
      boss.patternTimer = 0;
    }

    if (boss.shootTimer <= 0) {
      Bullets.fireEnemy(boss.x, boss.y + 42, wave, `boss_${boss.pattern}`);
      if (boss.phase >= 3) {
        // Extra aimed shot at player in phase 3
        setTimeout(() => {
          if (boss && boss.alive) Bullets.fireEnemy(boss.x - 40, boss.y + 30, wave, 'boss_aimed');
        }, 200);
      }
      boss.shootTimer = boss.phase === 3 ? 35 : boss.phase === 2 ? 45 : 55;
    }
  }

  function shootFromGrid(wave) {
    // Get frontmost enemy per column
    const frontEnemies = {};
    grid.forEach(e => {
      if (!frontEnemies[e.c] || e.y > frontEnemies[e.c].y) frontEnemies[e.c] = e;
    });
    const shooters = Object.values(frontEnemies);
    if (shooters.length === 0) return;

    const shooter = shooters[Math.floor(Math.random() * shooters.length)];
    let pattern = 'single';
    if (wave >= 5 && shooter.type === 'elite') pattern = 'aimed';
    else if (wave >= 3) pattern = 'spread';
    Bullets.fireEnemy(shooter.x, shooter.y + 14, wave, pattern);
  }

  function spawnUfo() {
    ufo = {
      x: -45, y: 28, vx: 1.8,
      w: 64, h: 24,
      points: 100 + Math.floor(Math.random() * 200),
      alive: true,
      pulse: 0,
    };
  }

  // ── Collision ────────────────────────────────────

  function checkPlayerBullets(bullets, wave) {
    const results = [];
    bullets.forEach((b, bi) => {
      const bLeft = b.x - b.w / 2, bTop = b.y - b.h / 2;

      // vs grid enemies
      for (let ei = grid.length - 1; ei >= 0; ei--) {
        const e = grid[ei];
        if (b.x > e.x - e.w / 2 && b.x < e.x + e.w / 2 && b.y > e.y - e.h / 2 && b.y < e.y + e.h / 2) {
          e.hp--;
          Particles.spawnExplosion(e.x, e.y, e.hp > 0 ? 'barrier' : e.type);
          if (e.hp <= 0) {
            const pts = e.type === 'elite' ? 30 : e.type === 'medium' ? 20 : 10;
            PowerUps.trySpawn(e.x, e.y, wave);
            grid.splice(ei, 1);
            waveKills++;
            totalKills++;
            results.push({ type: 'enemy_kill', pts, etype: e.type, x: e.x, y: e.y });
          } else {
            results.push({ type: 'enemy_hit', pts: 0 });
          }
          Bullets.removePlayerBullet(bi);
          return;
        }
      }

      // vs boss
      if (boss && boss.alive && b.x > boss.x - 70 && b.x < boss.x + 70 && b.y > boss.y - 40 && b.y < boss.y + 40) {
        boss.hp--;
        Particles.spawnExplosion(boss.x + (Math.random() - 0.5) * 80, boss.y + (Math.random() - 0.5) * 40, 'barrier');
        AudioManager.SFX.bossHit();
        if (boss.hp <= 0) {
          Particles.spawnExplosion(boss.x, boss.y, 'boss');
          AudioManager.SFX.bossDie();
          PowerUps.forceSpawn(boss.x, boss.y + 40, 'life');
          boss.alive = false;
          boss = null;
          waveKills++;
          totalKills++;
          results.push({ type: 'boss_kill', pts: 500 });
        } else {
          results.push({ type: 'boss_hit', pts: 5 });
        }
        Bullets.removePlayerBullet(bi);
        return;
      }

      // vs UFO
      if (ufo && ufo.alive && b.x > ufo.x - 32 && b.x < ufo.x + 32 && b.y > ufo.y - 12 && b.y < ufo.y + 12) {
        Particles.spawnExplosion(ufo.x, ufo.y, 'ufo');
        const pts = ufo.points;
        ufo.alive = false;
        ufo = null;
        waveKills++;
        totalKills++;
        results.push({ type: 'ufo_kill', pts });
        Bullets.removePlayerBullet(bi);
      }
    });
    return results;
  }

  function checkEnemyReachedBottom() {
    return grid.some(e => e.y > H - 80);
  }

  function checkPlayerCollision(px, py, pw, ph) {
    // Enemies reaching player
    return grid.some(e => px - pw/2 < e.x + e.w/2 && px + pw/2 > e.x - e.w/2 &&
                          py - ph/2 < e.y + e.h/2 && py + ph/2 > e.y - e.h/2);
  }

  // ── Draw ─────────────────────────────────────────

  function draw(ctx) {
    grid.forEach(e => drawEnemy(ctx, e));
    if (boss && boss.alive) drawBoss(ctx);
    if (ufo && ufo.alive) drawUfo(ctx);
  }

  function drawEnemy(ctx, e) {
    const { x, y, type, anim, hp, maxHp } = e;
    ctx.save();

    if (type === 'drone') {
      ctx.shadowColor = C.pink; ctx.shadowBlur = 10;
      ctx.fillStyle = C.pink;
      ctx.fillRect(x - 16 + anim, y - 10, 32, 20);
      ctx.fillStyle = '#FF6090';
      ctx.fillRect(x - 10, y - 6, 20, 12);
      ctx.fillStyle = C.yellow; ctx.shadowColor = C.yellow; ctx.shadowBlur = 8;
      ctx.fillRect(x - 5 + anim, y - 2, 10, 4);
      ctx.strokeStyle = C.pink; ctx.lineWidth = 1.5; ctx.shadowBlur = 4;
      ctx.beginPath();
      ctx.moveTo(x - 8, y - 10); ctx.lineTo(x - 12, y - 18 + anim * 2);
      ctx.moveTo(x + 8, y - 10); ctx.lineTo(x + 12, y - 18 + anim * 2);
      ctx.stroke();
    } else if (type === 'medium') {
      ctx.shadowColor = C.purple; ctx.shadowBlur = 12;
      ctx.fillStyle = C.purple;
      ctx.beginPath();
      ctx.moveTo(x, y - 14); ctx.lineTo(x + 18, y); ctx.lineTo(x + 14, y + 12);
      ctx.lineTo(x - 14, y + 12); ctx.lineTo(x - 18, y); ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#D080FF'; ctx.fillRect(x - 6, y - 4, 12, 12);
      ctx.fillStyle = C.cyan; ctx.shadowColor = C.cyan; ctx.shadowBlur = 8;
      ctx.fillRect(x - 9 - anim, y + 2, 6, 6);
      ctx.fillRect(x + 3 + anim, y + 2, 6, 6);
    } else {
      // Elite — Arasaka Spider
      ctx.shadowColor = C.orange; ctx.shadowBlur = 16;
      ctx.fillStyle = C.orange;
      ctx.beginPath(); ctx.arc(x, y, 14, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#FFA050'; ctx.fillRect(x - 10, y - 6, 20, 12);
      ctx.strokeStyle = C.orange; ctx.lineWidth = 1.5;
      [[-14,-8],[-18,0],[-14,8],[14,-8],[18,0],[14,8]].forEach(([lx,ly]) => {
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x + lx + (anim ? 2 : 0), y + ly + (anim ? 1 : -1));
        ctx.stroke();
      });
      ctx.fillStyle = C.yellow; ctx.shadowColor = C.yellow; ctx.shadowBlur = 10;
      ctx.beginPath(); ctx.arc(x, y, 5, 0, Math.PI * 2); ctx.fill();
    }

    // HP bar (if damaged)
    if (hp < maxHp) {
      ctx.shadowBlur = 0;
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.fillRect(x - 15, y - 18, 30, 3);
      ctx.fillStyle = C.green;
      ctx.fillRect(x - 15, y - 18, 30 * (hp / maxHp), 3);
    }

    ctx.restore();
  }

  function drawBoss(ctx) {
    const b = boss;
    ctx.save();

    // Phase color
    const phaseCol = b.phase === 3 ? C.pink : b.phase === 2 ? C.orange : C.yellow;

    // Outer glow
    const grad = ctx.createRadialGradient(b.x, b.y, 20, b.x, b.y, 80);
    grad.addColorStop(0, `rgba(255,230,0,0.1)`);
    grad.addColorStop(1, `transparent`);
    ctx.fillStyle = grad;
    ctx.beginPath(); ctx.arc(b.x, b.y, 80, 0, Math.PI * 2); ctx.fill();

    // Body
    ctx.shadowColor = phaseCol;
    ctx.shadowBlur = 25;
    ctx.fillStyle = '#0D0800';
    ctx.strokeStyle = phaseCol;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(b.x, b.y - 40);
    ctx.lineTo(b.x + 60, b.y - 10);
    ctx.lineTo(b.x + 70, b.y + 30);
    ctx.lineTo(b.x, b.y + 40);
    ctx.lineTo(b.x - 70, b.y + 30);
    ctx.lineTo(b.x - 60, b.y - 10);
    ctx.closePath();
    ctx.fill(); ctx.stroke();

    // Rotating arms
    for (let i = 0; i < 6; i++) {
      const angle = (i / 6) * Math.PI * 2 + b.armAngle;
      const ax = b.x + Math.cos(angle) * 50;
      const ay = b.y + Math.sin(angle) * 35;
      ctx.strokeStyle = b.phase >= 2 ? C.orange : C.pink;
      ctx.shadowColor = b.phase >= 2 ? C.orange : C.pink;
      ctx.shadowBlur = 10;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(b.x + Math.cos(angle) * 20, b.y + Math.sin(angle) * 15);
      ctx.lineTo(ax, ay);
      ctx.stroke();
      ctx.fillStyle = b.phase >= 2 ? C.orange : C.pink;
      ctx.beginPath(); ctx.arc(ax, ay, 4.5, 0, Math.PI * 2); ctx.fill();
    }

    // Pulsing core
    const pulse = Math.sin(b.armAngle * 3) * 4;
    ctx.fillStyle = phaseCol;
    ctx.shadowColor = phaseCol;
    ctx.shadowBlur = 20 + pulse * 2;
    ctx.beginPath(); ctx.arc(b.x, b.y, 18 + pulse, 0, Math.PI * 2); ctx.fill();

    // Phase indicator
    if (b.phase >= 2) {
      ctx.fillStyle = C.pink;
      ctx.shadowColor = C.pink;
      ctx.shadowBlur = 8;
      ctx.font = 'bold 8px Orbitron';
      ctx.textAlign = 'center';
      ctx.fillText(b.phase === 3 ? '! BERSERK !' : '! PHASE 2 !', b.x, b.y - 50);
    }

    ctx.restore();
  }

  function drawUfo(ctx) {
    const u = ufo;
    u.pulse = (u.pulse || 0) + 0.08;
    const glow = Math.sin(u.pulse) * 0.3 + 0.7;

    ctx.save();
    ctx.shadowColor = C.green;
    ctx.shadowBlur = 16 * glow;
    ctx.fillStyle = C.green;
    ctx.globalAlpha = glow;
    ctx.beginPath();
    ctx.ellipse(u.x, u.y, 32, 12, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#A0FFB0';
    ctx.beginPath();
    ctx.ellipse(u.x, u.y - 6, 14, 8, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = C.yellow;
    ctx.lineWidth = 1;
    for (let i = -2; i <= 2; i++) {
      ctx.beginPath();
      ctx.arc(u.x + i * 10, u.y + 5, 2.5, 0, Math.PI * 2);
      ctx.stroke();
    }

    // Points label
    ctx.globalAlpha = glow;
    ctx.fillStyle = C.yellow;
    ctx.shadowColor = C.yellow;
    ctx.font = 'bold 9px Orbitron';
    ctx.textAlign = 'center';
    ctx.fillText(u.points, u.x, u.y - 20);

    ctx.restore();
  }

  // ── Getters ──────────────────────────────────────

  function isEmpty() { return grid.length === 0 && !boss; }
  function isBossAlive() { return !!(boss && boss.alive); }
  function getBossHpPct() { return boss ? boss.hp / boss.maxHp : 0; }
  function getWaveKills() { return waveKills; }
  function getTotalKills() { return totalKills; }
  function reset() { grid = []; boss = null; ufo = null; waveKills = 0; totalKills = 0; }

  return { initWave, initBoss, update, draw, checkPlayerBullets, checkEnemyReachedBottom, checkPlayerCollision, isEmpty, isBossAlive, getBossHpPct, getWaveKills, getTotalKills, reset };
})();
