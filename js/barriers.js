/**
 * CYBERSTORM — barriers.js
 * Destructible cover / shields system
 */

const Barriers = (() => {
  let list = [];
  const BLOCK_SIZE = 8;
  const COLS = 7, ROWS = 3;

  // Predefined barrier shape (1 = solid, 0 = empty)
  const SHAPE = [
    [0,1,1,1,1,1,0],
    [1,1,1,1,1,1,1],
    [1,1,0,0,0,1,1],
  ];

  function init(wave) {
    list = [];
    const count = 4;
    const spacing = (720 - 80) / (count - 1);

    for (let i = 0; i < count; i++) {
      const cx = 40 + i * spacing;
      const by = 500 - 110;
      const blocks = [];

      for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
          if (SHAPE[r][c]) {
            blocks.push({
              x: cx - (COLS * BLOCK_SIZE) / 2 + c * BLOCK_SIZE,
              y: by + r * BLOCK_SIZE,
              alive: true,
              hp: 3,
            });
          }
        }
      }
      list.push({ cx, by, blocks });
    }
  }

  function testBullet(bx, by, bw, bh) {
    // Returns true if bullet was absorbed
    for (const barrier of list) {
      for (const blk of barrier.blocks) {
        if (!blk.alive) continue;
        if (bx < blk.x + BLOCK_SIZE && bx + bw > blk.x &&
            by < blk.y + BLOCK_SIZE && by + bh > blk.y) {
          blk.hp--;
          if (blk.hp <= 0) blk.alive = false;
          return true;
        }
      }
    }
    return false;
  }

  function draw(ctx) {
    list.forEach(barrier => {
      barrier.blocks.forEach(blk => {
        if (!blk.alive) return;
        const pct = blk.hp / 3;
        ctx.save();
        ctx.shadowColor = '#00F5FF';
        ctx.shadowBlur = pct > 0.6 ? 8 : 3;
        ctx.fillStyle = `rgba(0,245,255,${0.2 + pct * 0.6})`;
        ctx.fillRect(blk.x, blk.y, BLOCK_SIZE - 1, BLOCK_SIZE - 1);
        // Crack lines at low HP
        if (pct < 0.6) {
          ctx.strokeStyle = `rgba(255,0,60,${0.5})`;
          ctx.lineWidth = 0.5;
          ctx.beginPath();
          ctx.moveTo(blk.x, blk.y + BLOCK_SIZE / 2);
          ctx.lineTo(blk.x + BLOCK_SIZE, blk.y + BLOCK_SIZE / 2);
          ctx.stroke();
        }
        ctx.restore();
      });
    });
  }

  function getAll() { return list; }
  function clear() { list = []; }

  return { init, testBullet, draw, getAll, clear };
})();
