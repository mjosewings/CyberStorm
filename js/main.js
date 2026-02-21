/**
 * CYBERSTORM — main.js
 * Game loop, state machine, collision orchestration
 */

const Game = (() => {
  const canvas = document.getElementById('gameCanvas');
  const ctx = canvas.getContext('2d');
  const W = canvas.width, H = canvas.height;

  // ── State ─────────────────────────────────────────
  let score = 0;
  let lives = 3;
  let wave = 1;
  let paused = false;
  let rafId = null;
  let state = 'idle'; // idle | playing | boss | transitioning
  let keys = {};
  let lastTime = 0;
  let screenShake = 0;
  let starfield = [];
  let waveTransitionTimer = 0; // cooldown after wave clear
  let player = null; // reference for bullets.js

  // Expose player for enemies.js aimed shots
  Object.defineProperty(window, 'Game', { value: null, writable: true });

  // ── Starfield ────────────────────────────────────

  function initStars() {
    starfield = Array.from({ length: 130 }, () => ({
      x: Math.random() * W,
      y: Math.random() * H,
      s: Math.random() * 1.6 + 0.2,
      sp: Math.random() * 0.28 + 0.04,
    }));
  }

  // ── Init / Reset ────────────────────────────────

  function startNewGame() {
    score = 0;
    lives = 3;
    wave = 1;
    paused = false;
    state = 'playing';
    Bullets.clear();
    Bullets.resetStats();
    Particles.clear();
    PowerUps.clear();
    Enemies.reset();
    Player.init();
    player = Player.get();
    HUD.init(lives);
    Barriers.init(wave);
    Enemies.initWave(wave);
    initStars();
    HUD.setStatus('WAVE 1 — CORP DRONES INCOMING');
    HUD.setScore(0);
    waveTransitionTimer = 0;
    document.getElementById('hudWave').textContent = '01';
    GameScreens.showGame();
    AudioManager.SFX.waveStart();

    if (rafId) cancelAnimationFrame(rafId);
    rafId = requestAnimationFrame(loop);
  }

  function stop() {
    if (rafId) { cancelAnimationFrame(rafId); rafId = null; }
    Bullets.clear();
    Particles.clear();
    PowerUps.clear();
    Enemies.reset();
    Player.reset();
    state = 'idle';
  }

  function setPaused(val) { paused = val; if (!val && !rafId) { rafId = requestAnimationFrame(loop); } }

  // ── Game Loop ────────────────────────────────────

  function loop(timestamp) {
    rafId = requestAnimationFrame(loop);
    if (paused) return;

    const dt = Math.min(timestamp - lastTime, 50); // cap dt
    lastTime = timestamp;

    update(timestamp);
    draw();
  }

  // ── Update ───────────────────────────────────────

  function update(now) {
    HUD.tick();
    if (screenShake > 0) screenShake--;

    const p = Player.get();
    if (!p) return;

    // Update subsystems
    Player.update(keys, now);
    PowerUps.update();
    Bullets.update(wave);
    Particles.update();

    if (waveTransitionTimer > 0) {
      waveTransitionTimer--;
      return;
    }

    Enemies.update(wave);

    // ── Collision: player bullets vs enemies ──────
    const killEvents = Enemies.checkPlayerBullets(Bullets.getPlayerBullets(), wave);
    killEvents.forEach(ev => {
      if (ev.pts) {
        score += ev.pts;
        HUD.setScore(score);
      }
      if (ev.type === 'enemy_kill') {
        const labels = { drone: `DRONE +${ev.pts}`, medium: `ENFORCER +${ev.pts}`, elite: `ELITE +${ev.pts}` };
        HUD.addKillFeed(labels[ev.etype] || `+${ev.pts}`);
      }
      if (ev.type === 'ufo_kill') HUD.addKillFeed(`UFO BONUS +${ev.pts}`, '#39FF14');
      if (ev.type === 'boss_kill') HUD.addKillFeed('BOSS ELIMINATED +500', '#FFE600');
    });

    // ── Collision: enemy bullets vs barriers ──────
    Bullets.getEnemyBullets().forEach((b, bi) => {
      if (Barriers.testBullet(b.x - b.w / 2, b.y - b.h / 2, b.w, b.h)) {
        Particles.spawnExplosion(b.x, b.y, 'barrier');
        Bullets.removeEnemyBullet(bi);
      }
    });

    // ── Collision: player bullets vs barriers ─────
    Bullets.getPlayerBullets().forEach((b, bi) => {
      if (Barriers.testBullet(b.x - b.w / 2, b.y - b.h / 2, b.w, b.h)) {
        Particles.spawnExplosion(b.x, b.y, 'barrier');
        Bullets.removePlayerBullet(bi);
      }
    });

    // ── Collision: enemy bullets vs player ────────
    if (p.invincible === 0) {
      Bullets.getEnemyBullets().forEach((b, bi) => {
        if (b.x > p.x - p.w / 2 && b.x < p.x + p.w / 2 &&
            b.y > p.y - p.h / 2 && b.y < p.y + p.h / 2) {
          const took = Player.hitByBullet();
          Bullets.removeEnemyBullet(bi);
          if (took) {
            lives--;
            HUD.updateLives(lives);
            HUD.setStatus(lives > 0 ? 'FLATLINED — RESPAWNING...' : 'GAME OVER');
            screenShake = 20;
            if (lives <= 0) { endGame(); return; }
          }
        }
      });
    }

    // ── Collision: enemy grid reaches player ──────
    if (Enemies.checkEnemyReachedBottom() || Enemies.checkPlayerCollision(p.x, p.y, p.w, p.h)) {
      endGame();
      return;
    }

    // ── Power-up collection ───────────────────────
    const collected = PowerUps.checkPlayerCollision(p.x, p.y, p.w, p.h);
    collected.forEach(type => {
      AudioManager.SFX.powerup();
      if (type === 'life') {
        lives = Math.min(lives + 1, 5);
        HUD.updateLives(lives);
        HUD.addKillFeed('♥ EXTRA LIFE', '#FF003C');
      } else {
        Player.applyPowerup(type);
        HUD.showPowerupNotify(type);
      }
    });

    // ── Boss HP bar ───────────────────────────────
    if (Enemies.isBossAlive()) {
      HUD.showBossBar(Enemies.getBossHpPct());
    } else {
      HUD.hideBossBar();
    }

    // ── Active powerups HUD ───────────────────────
    HUD.updateActivePowerups(Player.getActivePowerupList());

    // ── Wave clear check ──────────────────────────
    if (Enemies.isEmpty() && waveTransitionTimer === 0) {
      waveTransitionTimer = 60; // brief pause
      nextWave();
    }
  }

  // ── Wave Transitions ──────────────────────────────

  function nextWave() {
    const bonus = Math.round(wave * 100 * (lives / 3));
    score += bonus;
    HUD.setScore(score);

    const kills = Enemies.getWaveKills();
    const accuracy = Bullets.getAccuracy();
    Bullets.resetStats();

    GameScreens.showWaveComplete(wave, score, kills, accuracy, bonus);

    // Setup next wave
    wave++;
    Bullets.clear();
    PowerUps.clear();
    Barriers.init(wave);

    document.getElementById('hudWave').textContent = String(wave).padStart(2, '0');

    // Boss every 3rd wave
    const isBossWave = wave % 3 === 0;
    if (isBossWave) {
      Enemies.initBoss(wave);
      HUD.setStatus(`BOSS WAVE ${wave} — ARASAKA SOVEREIGN INCOMING`);
    } else {
      Enemies.initWave(wave);
      HUD.setStatus(`WAVE ${wave} — CORP REINFORCEMENTS DEPLOYED`);
    }
  }

  function continueAfterResult() {
    const isBossWave = wave % 3 === 0;
    if (isBossWave) {
      GameScreens.showBossFight();
    } else {
      GameScreens.showLevelMusic();
    }
    AudioManager.SFX.waveStart();
    GameScreens.showGame();
    waveTransitionTimer = 0;
  }

  function endGame() {
    cancelAnimationFrame(rafId);
    rafId = null;
    state = 'gameover';
    GameScreens.showGameOver(score, wave, Enemies.getTotalKills());
  }

  // ── Draw ─────────────────────────────────────────

  function draw() {
    // Screen shake
    ctx.save();
    if (screenShake > 0) {
      const sx = (Math.random() - 0.5) * screenShake * 0.5;
      const sy = (Math.random() - 0.5) * screenShake * 0.3;
      ctx.translate(sx, sy);
    }

    ctx.clearRect(-10, -10, W + 20, H + 20);
    ctx.fillStyle = '#050812';
    ctx.fillRect(-10, -10, W + 20, H + 20);

    // Starfield
    drawStars();

    // City silhouette
    drawCity();

    // Game elements
    Barriers.draw(ctx);
    Enemies.draw(ctx);
    Player.draw(ctx);
    PowerUps.draw(ctx);
    Bullets.draw(ctx);
    Particles.draw(ctx);

    // Vignette
    drawVignette();

    ctx.restore();
  }

  function drawStars() {
    starfield.forEach(s => {
      s.y += s.sp;
      if (s.y > H) s.y = 0;
      ctx.fillStyle = `rgba(255,255,255,${0.2 + s.s * 0.15})`;
      ctx.fillRect(s.x, s.y, s.s, s.s);
    });
  }

  function drawCity() {
    ctx.save();
    ctx.fillStyle = 'rgba(0,245,255,0.025)';
    const buildings = [
      [0, 100, 55], [55, 70, 38], [93, 130, 50], [143, 90, 34],
      [177, 150, 46], [223, 80, 30], [600, 110, 52], [652, 85, 38],
      [690, 140, 44],
    ];
    buildings.forEach(([bx, bh, bw]) => {
      ctx.fillRect(bx, H - bh, bw, bh);
    });
    // Horizontal line accent
    ctx.strokeStyle = 'rgba(0,245,255,0.06)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, H - 65); ctx.lineTo(W, H - 65);
    ctx.stroke();
    ctx.restore();
  }

  function drawVignette() {
    const grad = ctx.createRadialGradient(W / 2, H / 2, W * 0.3, W / 2, H / 2, W * 0.75);
    grad.addColorStop(0, 'transparent');
    grad.addColorStop(1, 'rgba(5,8,18,0.55)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);
  }

  // ── Input ────────────────────────────────────────

  document.addEventListener('keydown', e => {
    keys[e.key] = true;
    if (e.key === ' ') e.preventDefault();
    if (e.key === 'p' || e.key === 'P') {
      if (state === 'playing' || state === 'boss') {
        paused = !paused;
        if (paused) GameScreens.pause();
        else { GameScreens.resume(); }
      }
    }
    if (e.key === 'm' || e.key === 'M') {
      const muted = AudioManager.isMusicMuted();
      AudioManager.setMusicMuted(!muted);
      document.getElementById('btnMuteMusic').classList.toggle('muted', !muted);
      document.getElementById('btnMuteMusic').textContent = muted ? '🔊' : '🔇';
    }
  });
  document.addEventListener('keyup', e => { keys[e.key] = false; });

  // ── Button wiring ────────────────────────────────

  document.getElementById('btnPlay').addEventListener('click', () => {
    AudioManager.initCtx();
    AudioManager.SFX.click();
    startNewGame();
  });

  document.getElementById('btnHowto').addEventListener('click', () => {
    AudioManager.SFX.click();
    document.getElementById('panelHowto').classList.remove('hidden');
  });

  document.getElementById('btnCredits').addEventListener('click', () => {
    AudioManager.SFX.click();
    document.getElementById('panelCredits').classList.remove('hidden');
  });

  document.getElementById('btnNextWave').addEventListener('click', () => {
    AudioManager.SFX.click();
    continueAfterResult();
  });

  document.getElementById('btnRetry').addEventListener('click', () => {
    AudioManager.initCtx();
    AudioManager.SFX.click();
    startNewGame();
  });

  document.getElementById('btnGoMenu').addEventListener('click', () => {
    AudioManager.SFX.click();
    stop();
    GameScreens.showMenu();
  });

  document.getElementById('btnMuteMusic').addEventListener('click', () => {
    AudioManager.initCtx();
    const muted = AudioManager.isMusicMuted();
    AudioManager.setMusicMuted(!muted);
    document.getElementById('btnMuteMusic').classList.toggle('muted', !muted);
    document.getElementById('btnMuteMusic').textContent = muted ? '🔊' : '🔇';
  });

  document.getElementById('btnMuteSfx').addEventListener('click', () => {
    AudioManager.initCtx();
    const muted = AudioManager.isSfxMuted();
    AudioManager.setSfxMuted(!muted);
    document.getElementById('btnMuteSfx').classList.toggle('muted', !muted);
    document.getElementById('btnMuteSfx').textContent = muted ? '🔔' : '🔕';
  });

  document.getElementById('volumeSlider').addEventListener('input', e => {
    AudioManager.initCtx();
    AudioManager.setVolume(parseFloat(e.target.value));
  });

  // expose player ref for aimed shots
  window.Game = { get player() { return Player.get(); }, setPaused, stop };

  // ── Boot ─────────────────────────────────────────

  GameScreens.runLoading();

  return { stop, setPaused };
})();
