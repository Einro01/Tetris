// ─── RENDERER ──────────────────────────────────────────────────────────────
const CELL = 30; // px per cell
const COLS = 10;
const ROWS = 20;
const BG        = '#10101a';
const GRID_LINE = 'rgba(30,30,46,0.8)';

class Renderer {
  constructor() {
    this.boardCanvas = document.getElementById('board');
    this.ctx = this.boardCanvas.getContext('2d');

    this.holdCanvases = [
      document.getElementById('hold1'),
      document.getElementById('hold2'),
    ];
    this.holdCtxs = this.holdCanvases.map(c => c.getContext('2d'));

    this.nextCanvases = [
      document.getElementById('next1'),
      document.getElementById('next2'),
      document.getElementById('next3'),
    ];
    this.nextCtxs = this.nextCanvases.map(c => c.getContext('2d'));
  }

  // Draw a single filled cell
  drawCell(ctx, x, y, color, shadow, alpha = 1, cellSize = CELL) {
    ctx.save();
    ctx.globalAlpha = alpha;
    const px = x * cellSize;
    const py = y * cellSize;
    const pad = 1;

    // Main fill
    ctx.fillStyle = color;
    ctx.fillRect(px + pad, py + pad, cellSize - pad * 2, cellSize - pad * 2);

    // Highlight top-left
    ctx.fillStyle = 'rgba(255,255,255,0.18)';
    ctx.fillRect(px + pad, py + pad, cellSize - pad * 2, 2);
    ctx.fillRect(px + pad, py + pad, 2, cellSize - pad * 2);

    // Shadow bottom-right
    ctx.fillStyle = 'rgba(0,0,0,0.35)';
    ctx.fillRect(px + pad, py + cellSize - pad - 2, cellSize - pad * 2, 2);
    ctx.fillRect(px + cellSize - pad - 2, py + pad, 2, cellSize - pad * 2);

    ctx.restore();
  }

  drawGrid(ctx, w, h, cellSize = CELL) {
    ctx.strokeStyle = GRID_LINE;
    ctx.lineWidth = 0.5;
    for (let x = 0; x <= w; x++) {
      ctx.beginPath();
      ctx.moveTo(x * cellSize, 0);
      ctx.lineTo(x * cellSize, h * cellSize);
      ctx.stroke();
    }
    for (let y = 0; y <= h; y++) {
      ctx.beginPath();
      ctx.moveTo(0, y * cellSize);
      ctx.lineTo(w * cellSize, y * cellSize);
      ctx.stroke();
    }
  }

  drawBoard(state) {
    const { ctx } = this;
    ctx.clearRect(0, 0, COLS * CELL, ROWS * CELL);

    // Background
    ctx.fillStyle = BG;
    ctx.fillRect(0, 0, COLS * CELL, ROWS * CELL);

    // Grid lines
    this.drawGrid(ctx, COLS, ROWS);

    // Locked cells
    for (let row = 0; row < ROWS; row++) {
      for (let col = 0; col < COLS; col++) {
        const cell = state.board[row][col];
        if (cell) {
          const p = PIECES[cell];
          this.drawCell(ctx, col, row, p.color, p.shadow);
        }
      }
    }

    if (!state.current) return;

    const cur = state.current;
    const mat = PIECES[cur.type].matrices[cur.rotation];
    const pc  = PIECES[cur.type];

    // Ghost piece
    const ghostY = state.ghostY;
    mat.forEach((row, r) => {
      row.forEach((v, c) => {
        if (v) {
          const gx = cur.x + c;
          const gy = ghostY + r;
          if (gy >= 0 && gy < ROWS) {
            ctx.save();
            ctx.globalAlpha = 1;
            ctx.fillStyle = 'rgba(255,255,255,0.04)';
            ctx.fillRect(gx * CELL + 1, gy * CELL + 1, CELL - 2, CELL - 2);
            ctx.strokeStyle = pc.color;
            ctx.globalAlpha = 0.25;
            ctx.lineWidth = 1;
            ctx.strokeRect(gx * CELL + 1, gy * CELL + 1, CELL - 2, CELL - 2);
            ctx.restore();
          }
        }
      });
    });

    // Active piece
    mat.forEach((row, r) => {
      row.forEach((v, c) => {
        if (v) {
          const px = cur.x + c;
          const py = cur.y + r;
          if (py >= 0) {
            this.drawCell(ctx, px, py, pc.color, pc.shadow);
          }
        }
      });
    });
  }

  drawMiniPiece(ctx, type, canvasW, canvasH, cellSize = 24) {
    ctx.clearRect(0, 0, canvasW, canvasH);
    ctx.fillStyle = BG;
    ctx.fillRect(0, 0, canvasW, canvasH);

    if (!type) return;

    const pc  = PIECES[type];
    const mat = pc.matrices[0];
    const rows = mat.length;
    const cols = mat[0].length;
    const offsetX = Math.floor((canvasW / cellSize - cols) / 2);
    const offsetY = Math.floor((canvasH / cellSize - rows) / 2);

    mat.forEach((row, r) => {
      row.forEach((v, c) => {
        if (v) {
          this.drawCell(ctx, offsetX + c, offsetY + r, pc.color, pc.shadow, 1, cellSize);
        }
      });
    });
  }

  drawHolds(holds, activeSlot) {
    holds.forEach((type, i) => {
      const ctx = this.holdCtxs[i];
      const c   = this.holdCanvases[i];
      this.drawMiniPiece(ctx, type, c.width, c.height, 22);

      // Highlight active slot
      ctx.strokeStyle = i === activeSlot
        ? 'rgba(0,245,196,0.5)'
        : 'rgba(30,30,46,0.5)';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(0.75, 0.75, c.width - 1.5, c.height - 1.5);
    });
  }

  drawNextQueue(queue) {
    queue.slice(0, 3).forEach((type, i) => {
      const ctx = this.nextCtxs[i];
      const c   = this.nextCanvases[i];
      const sz  = i === 0 ? 24 : 18;
      this.drawMiniPiece(ctx, type, c.width, c.height, sz);
    });
  }

  flashRows(rows) {
    // Flash effect on cleared rows
    const { ctx } = this;
    ctx.save();
    ctx.fillStyle = 'rgba(0,245,196,0.35)';
    rows.forEach(r => {
      ctx.fillRect(0, r * CELL, COLS * CELL, CELL);
    });
    ctx.restore();
  }
}
