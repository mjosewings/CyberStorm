/**
 * CYBERSTORM — bullets.js
 * Player & enemy projectile management
 */

const Bullets = (() => {
  let playerBullets = [];
  let enemyBullets = [];
  let shotsFired = 0;
  let shotsHit = 0;

  const PLAYER_SPEED = 11;
  const ENEMY_SPEED_BASE = 3.5;

  function firePlayer(x, y, multiShot = false) {
    AudioManager.SFX.shoot();
    if (multiShot) {
      AudioManager.SFX.multiShot();
      [{ dx: -1.2, dy: -PLAYER_SPEED }, { dx: 0, dy: -PLAYER_SPEED }, { dx: 1.2, dy: -PLAYER_SPEED }].forEach(d => {
        playerBullets.push({ x, y, vx: d.dx, vy: d.dy, w: 4, h: 14, col: '#39FF14', trail: [] });
      });
      shotsFired += 3;
    } else {
      playerBullets.push({ x, y, vx: 0, vy: -PLAYER_SPEED, w: 4, h: 14, col: '#00F5FF', trail: [] });
      shotsFired++;
    }
  }

  function fireEnemy(x, y, wave, pattern = 'single') {
    const speed = ENEMY_SPEED_BASE + wave * 0.28;
    AudioManager.SFX.enemyShoot();

    switch (pattern) {
      case 'spread':
        [-0.35, 0, 0.35].forEach(vx => {
          enemyBullets.push({ x, y, vx: vx * speed, vy: speed, w: 4, h: 12, col: '#FF003C' });
        });
        break;
      case 'aimed': {
        const px = Game?.player?.x || 360;
        const py = Game?.player?.y || 450;
        const dx = px - x, dy = py - y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        enemyBullets.push({ x, y, vx: (dx / dist) * speed, vy: (dy / dist) * speed, w: 4, h: 12, col: '#BF00FF' });
        break;
      }
      case 'boss_fan':
        [-0.6, -0.3, 0, 0.3, 0.6].forEach(vx => {
          enemyBullets.push({ x, y, vx: vx * speed * 0.9, vy: speed, w: 5, h: 14, col: '#FFE600', glow: true });
        });
        break;
      case 'boss_aimed': {
        const px2 = Game?.player?.x || 360;
        const py2 = Game?.player?.y || 450;
        const dx2 = px2 - x, dy2 = py2 - y;
        const dist2 = Math.sqrt(dx2 * dx2 + dy2 * dy2);
        [-0.15, 0, 0.15].forEach(offset => {
          enemyBullets.push({ x, y, vx: (dx2 / dist2) * speed + offset * speed, vy: (dy2 / dist2) * speed, w: 5, h: 14, col: '#FF6B00', glow: true });
        });
        break;
      }
      default:
        enemyBullets.push({ x, y, vx: 0, vy: speed, w: 4, h: 12, col: '#FF003C' });
    }
  }

  function update(wave) {
    playerBullets.forEach(b => {
      b.trail.push({ x: b.x, y: b.y });
      if (b.trail.length > 5) b.trail.shift();
      b.x += b.vx;
      b.y += b.vy;
    });
    enemyBullets.forEach(b => { b.x += b.vx; b.y += b.vy; });

    playerBullets = playerBullets.filter(b => b.y > -20 && b.x > -20 && b.x < 740);
    enemyBullets = enemyBullets.filter(b => b.y < 520 && b.x > -20 && b.x < 740);
  }

  function draw(ctx) {
    // Player bullets
    playerBullets.forEach(b => {
      // Trail
      b.trail.forEach((t, i) => {
        ctx.save();
        ctx.globalAlpha = (i / b.trail.length) * 0.4;
        ctx.fillStyle = b.col;
        ctx.shadowColor = b.col;
        ctx.shadowBlur = 4;
        ctx.fillRect(t.x - b.w / 2, t.y - b.h / 4, b.w * 0.6, b.h * 0.5);
        ctx.restore();
      });
      ctx.save();
      ctx.fillStyle = b.col;
      ctx.shadowColor = b.col;
      ctx.shadowBlur = 14;
      ctx.fillRect(b.x - b.w / 2, b.y - b.h / 2, b.w, b.h);
      // Inner bright core
      ctx.fillStyle = '#ffffff';
      ctx.shadowBlur = 6;
      ctx.fillRect(b.x - 1, b.y - b.h / 2 + 2, 2, b.h - 4);
      ctx.restore();
    });

    // Enemy bullets
    enemyBullets.forEach(b => {
      ctx.save();
      ctx.fillStyle = b.col;
      ctx.shadowColor = b.col;
      ctx.shadowBlur = b.glow ? 18 : 10;
      ctx.fillRect(b.x - b.w / 2, b.y - b.h / 2, b.w, b.h);
      ctx.fillStyle = 'rgba(255,255,255,0.7)';
      ctx.fillRect(b.x - 1, b.y - b.h / 2 + 2, 2, b.h - 4);
      ctx.restore();
    });
  }

  function removePlayerBullet(idx) { playerBullets.splice(idx, 1); shotsHit++; }
  function removeEnemyBullet(idx) { enemyBullets.splice(idx, 1); }

  function getPlayerBullets() { return playerBullets; }
  function getEnemyBullets() { return enemyBullets; }
  function getAccuracy() {
    if (shotsFired === 0) return 0;
    return Math.round((shotsHit / shotsFired) * 100);
  }
  function resetStats() { shotsFired = 0; shotsHit = 0; }
  function clear() { playerBullets = []; enemyBullets = []; }

  return { firePlayer, fireEnemy, update, draw, removePlayerBullet, removeEnemyBullet, getPlayerBullets, getEnemyBullets, getAccuracy, resetStats, clear };
})();
