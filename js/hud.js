/**
 * CYBERSTORM — hud.js
 * HUD: score display, lives icons, kill feed, status, boss bar
 */

const HUD = (() => {
  let displayScore = 0;   // animated score
  let targetScore = 0;
  let hiScore = parseInt(localStorage.getItem('cyberstorm_hi') || '0');

  const killFeedEl = document.getElementById('kill-feed');
  const statusEl = document.getElementById('hud-status');
  const livesEl = document.getElementById('livesIcons');
  const activePuEl = document.getElementById('active-powerups');
  const bossBarEl = document.getElementById('boss-bar');
  const bossHpFillEl = document.getElementById('bossHpFill');
  const powerupNotifyEl = document.getElementById('powerup-notify');
  let powerupNotifyTimer = null;

  function init(lives) {
    displayScore = 0;
    targetScore = 0;
    updateScore();
    updateLives(lives);
    updateHiScore();
    bossBarEl.classList.add('hidden');
    killFeedEl.innerHTML = '';
    statusEl.textContent = '';
  }

  function setScore(score) {
    targetScore = score;
  }

  function addKillFeed(text, col = '#FFE600') {
    const el = document.createElement('div');
    el.className = 'kill-entry';
    el.style.color = col;
    el.textContent = text;
    killFeedEl.appendChild(el);
    setTimeout(() => el.remove(), 2100);
  }

  function setStatus(msg) {
    statusEl.textContent = msg;
  }

  function updateLives(count) {
    livesEl.innerHTML = '';
    for (let i = 0; i < 3; i++) {
      const pip = document.createElement('div');
      pip.className = 'life-pip' + (i >= count ? ' dead' : '');
      livesEl.appendChild(pip);
    }
  }

  function updateActivePowerups(list) {
    activePuEl.innerHTML = '';
    list.forEach(({ type, remaining }) => {
      const chip = document.createElement('div');
      chip.className = `powerup-chip ${type}`;
      const secs = Math.ceil(remaining / 1000);
      const labels = { rapid: '⚡ RAPID', shield: '🛡 SHIELD', multi: '⫸ MULTI' };
      chip.textContent = `${labels[type] || type} ${secs}s`;
      activePuEl.appendChild(chip);
    });
  }

  function showBossBar(pct) {
    bossBarEl.classList.remove('hidden');
    bossHpFillEl.style.width = `${Math.max(0, pct * 100)}%`;
  }

  function hideBossBar() {
    bossBarEl.classList.add('hidden');
  }

  function showPowerupNotify(type) {
    const info = PowerUps.getInfo(type);
    if (!info) return;
    if (powerupNotifyTimer) clearTimeout(powerupNotifyTimer);
    powerupNotifyEl.textContent = `${info.icon} ${info.label} ACTIVATED`;
    powerupNotifyEl.style.borderColor = info.col;
    powerupNotifyEl.style.color = info.col;
    powerupNotifyEl.style.boxShadow = `0 0 20px ${info.col}66`;
    powerupNotifyEl.classList.remove('hidden');
    powerupNotifyEl.style.animation = 'none';
    requestAnimationFrame(() => {
      powerupNotifyEl.style.animation = 'powerupFade 2.5s forwards';
    });
    powerupNotifyTimer = setTimeout(() => powerupNotifyEl.classList.add('hidden'), 2600);
  }

  function updateHiScore() {
    document.getElementById('hudHiScore').textContent = String(hiScore).padStart(6, '0');
    document.getElementById('menuHiScore').textContent = String(hiScore).padStart(6, '0');
  }

  function saveHiScore(score) {
    if (score > hiScore) {
      hiScore = score;
      localStorage.setItem('cyberstorm_hi', hiScore);
      updateHiScore();
      return true;
    }
    return false;
  }

  function getHiScore() { return hiScore; }

  function updateScore() {
    // Smooth score counter
    if (displayScore < targetScore) {
      displayScore = Math.min(targetScore, displayScore + Math.max(1, Math.ceil((targetScore - displayScore) / 8)));
    }
    const scoreEl = document.getElementById('hudScore');
    if (scoreEl) scoreEl.textContent = String(Math.floor(displayScore)).padStart(6, '0');
  }

  function tick() {
    updateScore();
  }

  return { init, setScore, addKillFeed, setStatus, updateLives, updateActivePowerups, showBossBar, hideBossBar, showPowerupNotify, saveHiScore, getHiScore, tick, updateHiScore };
})();
