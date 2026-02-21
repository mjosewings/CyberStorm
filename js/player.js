/**
 * CYBERSTORM — player.js
 * Player ship: movement, drawing, power-up states
 */

const Player = (() => {
  const W = 720, H = 500;
  const PLAYER_W = 44, PLAYER_H = 28;
  const BASE_SPEED = 4.8;

  let player = null;
  let activePowerups = {};    // { type: { expiresAt: ms } }
  let fireTimer = 0;
  let frameCount = 0;

  function init() {
    player = {
      x: W / 2,
      y: H - 48,
      w: PLAYER_W,
      h: PLAYER_H,
      speed: BASE_SPEED,
      invincible: 0,   // frames
    };
    activePowerups = {};
    fireTimer = 0;
  }

  function getFireCooldown() {
    return activePowerups.rapid ? 100 : 240;
  }

  function isMultiShot() { return !!activePowerups.multi; }
  function hasShield() { return !!activePowerups.shield; }

  function applyPowerup(type) {
    const info = PowerUps.getInfo(type);
    if (type === 'life') return; // handled externally
    activePowerups[type] = { expiresAt: Date.now() + info.duration };
  }

  function updatePowerups() {
    const now = Date.now();
    Object.keys(activePowerups).forEach(t => {
      if (activePowerups[t].expiresAt && now > activePowerups[t].expiresAt) {
        delete activePowerups[t];
      }
    });
  }

  function getActivePowerupList() {
    return Object.keys(activePowerups).map(t => ({
      type: t,
      remaining: activePowerups[t].expiresAt ? Math.max(0, activePowerups[t].expiresAt - Date.now()) : 0,
    }));
  }

  function update(keys, now) {
    if (!player) return;
    frameCount++;
    updatePowerups();

    if ((keys['ArrowLeft'] || keys['a'] || keys['A']) && player.x - player.w / 2 > 2)
      player.x -= player.speed;
    if ((keys['ArrowRight'] || keys['d'] || keys['D']) && player.x + player.w / 2 < W - 2)
      player.x += player.speed;

    if (player.invincible > 0) player.invincible--;

    // Fire
    if ((keys[' '] || keys['z'] || keys['Z']) && (now - fireTimer > getFireCooldown())) {
      Bullets.firePlayer(player.x, player.y - player.h / 2 + 2, isMultiShot());
      fireTimer = now;
    }
  }

  function hitByBullet() {
    if (!player) return false;
    if (player.invincible > 0) return false;
    if (activePowerups.shield) {
      // Shield absorbs hit
      delete activePowerups.shield;
      player.invincible = 30;
      AudioManager.SFX.shieldBlock();
      Particles.spawnExplosion(player.x, player.y, 'barrier');
      return false; // absorbed
    }
    player.invincible = 130;
    Particles.spawnExplosion(player.x, player.y, 'player');
    AudioManager.SFX.playerHit();
    return true; // took damage
  }

  function draw(ctx) {
    if (!player) return;
    const { x, y, w, h, invincible } = player;
    const flash = invincible > 0 && Math.floor(invincible / 7) % 2 === 0;
    if (flash) return;

    ctx.save();

    // Shield glow
    if (activePowerups.shield) {
      ctx.beginPath();
      ctx.arc(x, y, 30, 0, Math.PI * 2);
      const shieldGrad = ctx.createRadialGradient(x, y, 18, x, y, 30);
      shieldGrad.addColorStop(0, 'rgba(0,245,255,0)');
      shieldGrad.addColorStop(0.7, 'rgba(0,245,255,0.15)');
      shieldGrad.addColorStop(1, 'rgba(0,245,255,0.4)');
      ctx.fillStyle = shieldGrad;
      ctx.fill();
      ctx.strokeStyle = 'rgba(0,245,255,0.7)';
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }

    // Multi-shot glow
    const col = isMultiShot() ? '#39FF14' : (invincible > 0 ? '#FFE600' : '#00F5FF');

    ctx.shadowColor = col;
    ctx.shadowBlur = 16;

    // Hull body
    ctx.fillStyle = col;
    ctx.beginPath();
    ctx.moveTo(x, y - h * 0.6);
    ctx.lineTo(x + 10, y - 4);
    ctx.lineTo(x + w / 2, y - 2);
    ctx.lineTo(x + w / 2, y + h * 0.55);
    ctx.lineTo(x - w / 2, y + h * 0.55);
    ctx.lineTo(x - w / 2, y - 2);
    ctx.lineTo(x - 10, y - 4);
    ctx.closePath();
    ctx.fill();

    // Hull darker outline
    ctx.strokeStyle = 'rgba(0,0,0,0.5)';
    ctx.lineWidth = 1;
    ctx.stroke();

    // Cockpit
    const cockpitCol = isMultiShot() ? '#80FF50' : '#FFE600';
    ctx.fillStyle = cockpitCol;
    ctx.shadowColor = cockpitCol;
    ctx.shadowBlur = 12;
    ctx.beginPath();
    ctx.ellipse(x, y - 2, 8, 11, 0, 0, Math.PI * 2);
    ctx.fill();

    // Wing accent lines
    ctx.strokeStyle = cockpitCol;
    ctx.lineWidth = 1.5;
    ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.moveTo(x - w / 2, y + h * 0.5);
    ctx.lineTo(x - w / 2 + 10, y);
    ctx.moveTo(x + w / 2, y + h * 0.5);
    ctx.lineTo(x + w / 2 - 10, y);
    ctx.stroke();

    // Engine flame
    const flameH = 6 + Math.random() * 7;
    ctx.fillStyle = '#FF6B00';
    ctx.shadowColor = '#FF6B00';
    ctx.shadowBlur = 12;
    ctx.fillRect(x - 9, y + h * 0.5, 5, flameH);
    ctx.fillRect(x + 4, y + h * 0.5, 5, flameH);
    ctx.fillStyle = '#FFE600';
    ctx.shadowBlur = 6;
    ctx.fillRect(x - 8, y + h * 0.5, 3, flameH * 0.6);
    ctx.fillRect(x + 5, y + h * 0.5, 3, flameH * 0.6);

    ctx.restore();
  }

  function get() { return player; }
  function reset() { player = null; activePowerups = {}; }

  return { init, update, draw, hitByBullet, applyPowerup, getActivePowerupList, get, reset, isMultiShot, hasShield };
})();
