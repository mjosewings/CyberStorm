/**
 * CYBERSTORM — particles.js
 * Explosion, spark, and visual FX system
 */

const Particles = (() => {
  let list = [];

  const C = {
    yellow: '#FFE600', cyan: '#00F5FF', pink: '#FF003C',
    purple: '#BF00FF', green: '#39FF14', orange: '#FF6B00', white: '#ffffff',
  };

  function spawn(x, y, col, count = 12, opts = {}) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = (opts.minSpeed || 1) + Math.random() * (opts.maxSpeed || 4);
      list.push({
        x, y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        r: (opts.minR || 1.5) + Math.random() * (opts.maxR || 3),
        col: Array.isArray(col) ? col[Math.floor(Math.random() * col.length)] : col,
        life: (opts.life || 40) + Math.random() * (opts.lifeVar || 30),
        maxLife: 0,
        gravity: opts.gravity !== undefined ? opts.gravity : 0.06,
        shape: opts.shape || 'circle',
        trail: opts.trail || false,
      });
      list[list.length - 1].maxLife = list[list.length - 1].life;
    }
  }

  function spawnExplosion(x, y, type) {
    switch (type) {
      case 'drone':
        spawn(x, y, [C.pink, '#FF6090', C.white], 14, { minSpeed: 1, maxSpeed: 5, life: 35, lifeVar: 25 });
        spawn(x, y, C.pink, 6, { minSpeed: 0.5, maxSpeed: 2, minR: 3, maxR: 6, life: 20, shape: 'square' });
        break;
      case 'medium':
        spawn(x, y, [C.purple, '#E080FF', C.white], 18, { minSpeed: 1.5, maxSpeed: 6, life: 40, lifeVar: 30 });
        spawn(x, y, C.purple, 8, { minSpeed: 0.5, maxSpeed: 2.5, minR: 3, maxR: 7, life: 25, shape: 'square' });
        break;
      case 'elite':
        spawn(x, y, [C.orange, '#FFA040', C.yellow, C.white], 24, { minSpeed: 2, maxSpeed: 8, life: 50, lifeVar: 40 });
        spawn(x, y, C.orange, 10, { minSpeed: 1, maxSpeed: 4, minR: 4, maxR: 9, life: 35, shape: 'square' });
        spawn(x, y, C.yellow, 6, { minSpeed: 3, maxSpeed: 10, minR: 1, maxR: 2, life: 25 });
        break;
      case 'boss':
        spawn(x, y, [C.yellow, C.orange, C.pink, C.white], 60, { minSpeed: 2, maxSpeed: 12, life: 70, lifeVar: 50 });
        spawn(x, y, [C.yellow, C.orange], 20, { minSpeed: 1, maxSpeed: 5, minR: 5, maxR: 12, life: 50, shape: 'square' });
        spawn(x, y, C.white, 15, { minSpeed: 5, maxSpeed: 15, minR: 1, maxR: 2, life: 30 });
        break;
      case 'ufo':
        spawn(x, y, [C.green, '#80FFA0', C.white], 20, { minSpeed: 1.5, maxSpeed: 7, life: 45, lifeVar: 35 });
        spawn(x, y, C.green, 8, { minSpeed: 0.5, maxSpeed: 3, minR: 3, maxR: 8, life: 30, shape: 'square' });
        break;
      case 'player':
        spawn(x, y, [C.cyan, '#80FFFF', C.white], 22, { minSpeed: 1.5, maxSpeed: 7, life: 50, lifeVar: 40 });
        spawn(x, y, C.cyan, 8, { minSpeed: 1, maxSpeed: 4, minR: 3, maxR: 8, life: 35, shape: 'square' });
        break;
      case 'barrier':
        spawn(x, y, [C.cyan, 'rgba(0,245,255,0.5)'], 6, { minSpeed: 0.5, maxSpeed: 3, minR: 1, maxR: 3, life: 20, lifeVar: 15 });
        break;
      case 'powerup':
        spawn(x, y, [C.yellow, C.green, C.white], 16, { minSpeed: 1, maxSpeed: 5, life: 40, gravity: -0.03 });
        break;
      default:
        spawn(x, y, C.cyan, 12);
    }
  }

  function update() {
    list.forEach(p => {
      p.x += p.vx;
      p.y += p.vy;
      p.vy += p.gravity;
      p.vx *= 0.97;
      p.life--;
    });
    list = list.filter(p => p.life > 0);
  }

  function draw(ctx) {
    list.forEach(p => {
      const alpha = Math.min(1, p.life / p.maxLife);
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.fillStyle = p.col;
      ctx.shadowColor = p.col;
      ctx.shadowBlur = 6;
      if (p.shape === 'square') {
        ctx.fillRect(p.x - p.r / 2, p.y - p.r / 2, p.r, p.r);
      } else {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    });
  }

  function clear() { list = []; }

  return { spawn, spawnExplosion, update, draw, clear };
})();
