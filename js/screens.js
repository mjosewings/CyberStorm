/**
 * CYBERSTORM — screens.js
 * Loading screen, main menu, game over, wave complete
 */

const GameScreens = (() => {
  const SCREENS = {
    loading: document.getElementById('screen-loading'),
    menu: document.getElementById('screen-menu'),
    game: document.getElementById('screen-game'),
    waveComplete: document.getElementById('screen-wavecomplete'),
    gameover: document.getElementById('screen-gameover'),
  };

  let menuBgCanvas = null, menuBgCtx = null, menuBgRaf = null;

  // ── SHOW/HIDE ───────────────────────────────────

  function showOnly(name) {
    Object.entries(SCREENS).forEach(([k, el]) => {
      if (!el) return;
      if (k === name) el.classList.remove('hidden');
      else el.classList.add('hidden');
    });
  }

  // ── LOADING SCREEN ───────────────────────────────

  const LOAD_STEPS = [
    'INITIALIZING NEURAL LINK...',
    'HACKING CORPO FIREWALL...',
    'LOADING NIGHT CITY MAP...',
    'CALIBRATING WEAPON SYSTEMS...',
    'SPAWNING ENEMY DRONES...',
    'SYNCING ARASAKA DATABASE...',
    'CRACKING ENCRYPTION LAYER...',
    'NEURAL LINK ESTABLISHED.',
    'WELCOME, NETRUNNER.',
  ];

  async function runLoading() {
    showOnly('loading');
    const bar = document.getElementById('loadBarFill');
    const pct = document.getElementById('loadPct');
    const status = document.getElementById('loadStatusText');

    for (let i = 0; i < LOAD_STEPS.length; i++) {
      await delay(200 + Math.random() * 180);
      const p = Math.round(((i + 1) / LOAD_STEPS.length) * 100);
      bar.style.width = p + '%';
      pct.textContent = p + '%';
      status.textContent = LOAD_STEPS[i];
    }

    await delay(600);
    showMenu();
  }

  // ── MAIN MENU ────────────────────────────────────

  function showMenu() {
    showOnly('menu');
    AudioManager.playMusic('menu');
    HUD.updateHiScore();
    startMenuBgAnim();
  }

  function startMenuBgAnim() {
    if (!menuBgCanvas) {
      menuBgCanvas = document.getElementById('menuBg');
      menuBgCanvas.width = window.innerWidth;
      menuBgCanvas.height = window.innerHeight;
      menuBgCtx = menuBgCanvas.getContext('2d');
    }
    if (menuBgRaf) cancelAnimationFrame(menuBgRaf);

    // Animated starfield + city skyline for menu bg
    const stars = Array.from({ length: 160 }, () => ({
      x: Math.random() * menuBgCanvas.width,
      y: Math.random() * menuBgCanvas.height,
      s: Math.random() * 1.8 + 0.2,
      sp: Math.random() * 0.25 + 0.05,
    }));

    const buildings = [];
    let bx = 0;
    while (bx < menuBgCanvas.width) {
      const bw = 30 + Math.random() * 80;
      const bh = 80 + Math.random() * 260;
      buildings.push({ x: bx, w: bw, h: bh, windows: [] });
      for (let wy = 10; wy < bh - 10; wy += 20) {
        for (let wx2 = 6; wx2 < bw - 6; wx2 += 14) {
          if (Math.random() > 0.45) buildings[buildings.length - 1].windows.push({ x: wx2, y: wy });
        }
      }
      bx += bw + 2 + Math.random() * 6;
    }

    let frame = 0;
    const draw = () => {
      const ctx = menuBgCtx;
      const W = menuBgCanvas.width, H = menuBgCanvas.height;
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = '#05060F';
      ctx.fillRect(0, 0, W, H);

      // Stars
      stars.forEach(s => {
        s.y += s.sp;
        if (s.y > H) s.y = 0;
        ctx.fillStyle = `rgba(255,255,255,${0.3 + s.s * 0.2})`;
        ctx.fillRect(s.x, s.y, s.s, s.s);
      });

      // Ground glow
      const groundY = H - 140;
      const groundGrad = ctx.createLinearGradient(0, groundY, 0, H);
      groundGrad.addColorStop(0, 'rgba(255,0,60,0.0)');
      groundGrad.addColorStop(1, 'rgba(255,0,60,0.06)');
      ctx.fillStyle = groundGrad;
      ctx.fillRect(0, groundY, W, H - groundY);

      // Buildings
      buildings.forEach(b => {
        const by = H - b.h;
        ctx.fillStyle = '#080914';
        ctx.fillRect(b.x, by, b.w, b.h);
        ctx.strokeStyle = 'rgba(0,245,255,0.07)';
        ctx.lineWidth = 1;
        ctx.strokeRect(b.x, by, b.w, b.h);
        b.windows.forEach(w => {
          const flicker = Math.random() > 0.996;
          if (flicker) return;
          ctx.fillStyle = Math.random() > 0.8 ? 'rgba(255,0,60,0.4)' : 'rgba(255,230,0,0.25)';
          ctx.fillRect(b.x + w.x, by + w.y, 8, 10);
        });
      });

      // Distant neon signs effect
      const t = frame * 0.012;
      ctx.save();
      ctx.globalAlpha = 0.04 + Math.sin(t) * 0.015;
      ctx.fillStyle = '#FF003C';
      ctx.fillRect(0, H - 145, W, 2);
      ctx.fillStyle = '#00F5FF';
      ctx.fillRect(0, H - 143, W, 1);
      ctx.restore();

      frame++;
      menuBgRaf = requestAnimationFrame(draw);
    };
    draw();
  }

  function stopMenuBgAnim() {
    if (menuBgRaf) { cancelAnimationFrame(menuBgRaf); menuBgRaf = null; }
  }

  // ── GAME START ───────────────────────────────────

  function showGame() {
    stopMenuBgAnim();
    showOnly('game');
    AudioManager.playMusic('level');
  }

  function pause() {
    document.getElementById('pause-overlay').classList.remove('hidden');
  }

  function resume() {
    document.getElementById('pause-overlay').classList.add('hidden');
    Game.setPaused(false);
  }

  function quitToMenu() {
    document.getElementById('pause-overlay').classList.add('hidden');
    Game.stop();
    showMenu();
  }

  // ── BOSS FIGHT ───────────────────────────────────

  function showBossFight() {
    AudioManager.playMusic('boss');
  }

  function showLevelMusic() {
    AudioManager.playMusic('level');
  }

  // ── WAVE COMPLETE ────────────────────────────────

  const FLAVORS = [
    'The corps retreat... for now.',
    'Night City breathes again. Briefly.',
    'Another wave, another corpo graveyard.',
    'V is unstoppable. The legend grows.',
    '"What a save!" — Alt Cunningham',
    'You can\'t kill what the city already owns.',
    'The flatline calls... but not today.',
    'Fear the netrunner with nothing to lose.',
  ];

  function showWaveComplete(wave, score, kills, accuracy, bonus) {
    AudioManager.playMusic('win', false);
    document.getElementById('wcWaveNum').textContent = `WAVE ${wave} COMPLETE`;
    document.getElementById('wcScore').textContent = String(score).padStart(6, '0');
    document.getElementById('wcKills').textContent = kills;
    document.getElementById('wcAccuracy').textContent = accuracy + '%';
    document.getElementById('wcBonus').textContent = '+' + bonus;
    document.getElementById('wcFlavor').textContent = FLAVORS[Math.floor(Math.random() * FLAVORS.length)];
    showOnly('waveComplete');
  }

  // ── GAME OVER ────────────────────────────────────

  function showGameOver(score, wave, kills, isVictory = false) {
    AudioManager.playMusic('defeat', false);
    const isNew = HUD.saveHiScore(score);

    document.getElementById('goTitle').textContent = isVictory ? 'CITY SAVED' : 'FLATLINED';
    document.getElementById('goTitle').style.color = isVictory ? '#00F5FF' : '#FF003C';
    document.getElementById('goSub').textContent = isVictory
      ? 'THE CORPS HAVE BEEN DEFEATED — FOR NOW'
      : 'THE CORPS WIN... FOR NOW';
    document.getElementById('goScore').textContent = String(score).padStart(6, '0');
    document.getElementById('goWave').textContent = wave;
    document.getElementById('goKills').textContent = kills;
    document.getElementById('goHiScore').textContent = String(HUD.getHiScore()).padStart(6, '0');

    const newRecordEl = document.getElementById('goNewRecord');
    if (isNew) newRecordEl.classList.remove('hidden');
    else newRecordEl.classList.add('hidden');

    showOnly('gameover');
  }

  // ── HELPERS ──────────────────────────────────────

  function delay(ms) { return new Promise(r => setTimeout(r, ms)); }

  return { runLoading, showMenu, showGame, showBossFight, showLevelMusic, showWaveComplete, showGameOver, pause, resume, quitToMenu, stopMenuBgAnim };
})();
