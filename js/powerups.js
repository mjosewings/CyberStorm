/**
 * CYBERSTORM — powerups.js
 * Drop system with 4 power-up types
 */

const PowerUps = (() => {
  let list = [];

  const TYPES = {
    rapid: { col: '#FFE600', label: 'RAPID FIRE', icon: '⚡', duration: 8000 },
    shield: { col: '#00F5FF', label: 'SHIELD', icon: '🛡', duration: 6000 },
    multi: { col: '#39FF14', label: 'MULTI-SHOT', icon: '⫸', duration: 7000 },
    life: { col: '#FF003C', label: 'EXTRA LIFE', icon: '♥', duration: 0 },
  };

  const DROP_CHANCE = 0.18; // 18% chance per kill

  function trySpawn(x, y, waveBonus = 0) {
    if (Math.random() > DROP_CHANCE + waveBonus * 0.01) return;
    const keys = Object.keys(TYPES);
    const type = keys[Math.floor(Math.random() * keys.length)];
    list.push({
      x, y,
      vy: 1.2,
      type,
      w: 20, h: 20,
      pulse: 0,
      alive: true,
    });
  }

  function forceSpawn(x, y, type) {
    list.push({ x, y, vy: 1.2, type, w: 20, h: 20, pulse: 0, alive: true });
  }

  function update() {
    list.forEach(p => {
      p.y += p.vy;
      p.pulse += 0.1;
    });
    list = list.filter(p => p.alive && p.y < 530);
  }

  function draw(ctx) {
    list.forEach(p => {
      if (!p.alive) return;
      const info = TYPES[p.type];
      const glow = Math.sin(p.pulse) * 0.4 + 0.6;

      ctx.save();
      ctx.shadowColor = info.col;
      ctx.shadowBlur = 14 * glow;

      // Outer ring
      ctx.strokeStyle = info.col;
      ctx.globalAlpha = glow;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(p.x, p.y, 13, 0, Math.PI * 2);
      ctx.stroke();

      // Inner fill
      ctx.globalAlpha = 0.15 * glow;
      ctx.fillStyle = info.col;
      ctx.beginPath();
      ctx.arc(p.x, p.y, 12, 0, Math.PI * 2);
      ctx.fill();

      // Icon
      ctx.globalAlpha = glow;
      ctx.font = '11px Share Tech Mono';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = '#ffffff';
      ctx.shadowBlur = 0;
      ctx.fillText(info.icon, p.x, p.y);

      ctx.restore();
    });
  }

  function checkPlayerCollision(px, py, pw, ph) {
    const collected = [];
    list.forEach((p, i) => {
      if (!p.alive) return;
      if (px - pw / 2 < p.x + p.w && px + pw / 2 > p.x - p.w &&
          py - ph / 2 < p.y + p.h && py + ph / 2 > p.y - p.h) {
        p.alive = false;
        collected.push(p.type);
      }
    });
    return collected;
  }

  function getInfo(type) { return TYPES[type]; }
  function clear() { list = []; }

  return { trySpawn, forceSpawn, update, draw, checkPlayerCollision, getInfo, clear };
})();
