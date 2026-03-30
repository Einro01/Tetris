// ─── GAME LOGIC ────────────────────────────────────────────────────────────
const LOCK_DELAY   = 500;  // ms before auto-lock on ground
const MAX_LOCK_RESETS = 15;

class Game {
  constructor(renderer) {
    this.renderer = renderer;
    this.reset();
  }

  reset() {
    this.board    = Array.from({length: ROWS}, () => Array(COLS).fill(null));
    this.score    = 0;
    this.level    = 1;
    this.lines    = 0;
    this.bag      = new Bag();
    this.queue    = [this.bag.next(), this.bag.next(), this.bag.next(), this.bag.next()];
    this.holds    = [null, null]; // 2 hold slots
    this.activeSlot = 0;         // which hold slot is selected (0 or 1)
    this.canHold  = true;
    this.current  = null;
    this.ghostY   = 0;
    this.lockTimer = null;
    this.lockResets = 0;
    this.isOver   = false;
    this.isPaused = false;
    this.lastTime = 0;
    this.dropAccum = 0;
  }

  // ── SPAWN ─────────────────────────────────────────────────────────────────
  spawn() {
    const type = this.queue.shift();
    this.queue.push(this.bag.next());

    this.current = {
      type,
      rotation: 0,
      x: Math.floor(COLS / 2) - Math.floor(PIECES[type].matrices[0][0].length / 2),
      y: -1,
    };

    this.canHold = true;
    this.lockResets = 0;

    if (this._collides(this.current)) {
      this.isOver = true;
      return false;
    }

    this.updateGhost();
    return true;
  }

  // ── COLLISION ─────────────────────────────────────────────────────────────
  _collides(piece, dx = 0, dy = 0, rot = null) {
    const rotation = rot !== null ? rot : piece.rotation;
    const mat = PIECES[piece.type].matrices[rotation];
    for (let r = 0; r < mat.length; r++) {
      for (let c = 0; c < mat[r].length; c++) {
        if (!mat[r][c]) continue;
        const nx = piece.x + c + dx;
        const ny = piece.y + r + dy;
        if (nx < 0 || nx >= COLS || ny >= ROWS) return true;
        if (ny >= 0 && this.board[ny][nx]) return true;
      }
    }
    return false;
  }

  // ── GHOST ─────────────────────────────────────────────────────────────────
  updateGhost() {
    if (!this.current) return;
    let dy = 0;
    while (!this._collides(this.current, 0, dy + 1)) dy++;
    this.ghostY = this.current.y + dy;
  }

  // ── MOVEMENT ──────────────────────────────────────────────────────────────
  moveLeft()  { this._tryMove(-1, 0); }
  moveRight() { this._tryMove(1, 0); }
  softDrop()  { if (!this._tryMove(0, 1)) { this._lock(); } else { this.score += 1; } }

  _tryMove(dx, dy) {
    if (!this.current || this.isOver || this.isPaused) return false;
    if (!this._collides(this.current, dx, dy)) {
      this.current.x += dx;
      this.current.y += dy;
      this.updateGhost();
      // Reset lock timer on movement
      if (dy === 0 && this._onGround()) this._resetLockTimer();
      return true;
    }
    return false;
  }

  rotate(dir = 1) {
    if (!this.current || this.isOver || this.isPaused) return;
    const rotCount = PIECES[this.current.type].matrices.length;
    const newRot = ((this.current.rotation + dir) % rotCount + rotCount) % rotCount;
    if (!this._wallKick(newRot, dir)) return;
    this.updateGhost();
    audio.sfxRotate();
    if (this._onGround()) this._resetLockTimer();
  }

  _wallKick(newRot, dir) {
    const kicks = [[0,0],[1,0],[-1,0],[2,0],[-2,0],[0,-1],[0,-2]];
    for (const [kx, ky] of kicks) {
      if (!this._collides(this.current, kx, ky, newRot)) {
        this.current.x += kx;
        this.current.y += ky;
        this.current.rotation = newRot;
        return true;
      }
    }
    return false;
  }

  hardDrop() {
    if (!this.current || this.isOver || this.isPaused) return;
    let dropped = 0;
    while (!this._collides(this.current, 0, 1)) {
      this.current.y++;
      dropped++;
    }
    this.score += dropped * 2;
    audio.sfxDrop();
    this._lock();
  }

  // ── HOLD ──────────────────────────────────────────────────────────────────
  holdPiece() {
    if (!this.current || !this.canHold || this.isOver || this.isPaused) return;

    const slot = this.activeSlot;
    const prev = this.holds[slot];
    this.holds[slot] = this.current.type;
    this.canHold = false;

    audio.sfxHold();

    if (prev) {
      // Swap from hold
      this.current = {
        type: prev,
        rotation: 0,
        x: Math.floor(COLS / 2) - Math.floor(PIECES[prev].matrices[0][0].length / 2),
        y: -1,
      };
      this.updateGhost();
    } else {
      this.spawn();
    }
  }

  cycleSlot() {
    if (this.isOver || this.isPaused) return;
    this.activeSlot = (this.activeSlot + 1) % 2;
    this._updateSlotUI();
  }

  _updateSlotUI() {
    document.querySelectorAll('.slot-dot').forEach((el, i) => {
      el.classList.toggle('active', i === this.activeSlot);
    });
  }

  // ── LOCK ──────────────────────────────────────────────────────────────────
  _onGround() {
    return this._collides(this.current, 0, 1);
  }

  _resetLockTimer() {
    if (this.lockResets >= MAX_LOCK_RESETS) return;
    clearTimeout(this.lockTimer);
    this.lockResets++;
    this.lockTimer = setTimeout(() => {
      if (this._onGround()) this._lock();
    }, LOCK_DELAY);
  }

  _lock() {
    clearTimeout(this.lockTimer);
    if (!this.current) return;

    const mat = PIECES[this.current.type].matrices[this.current.rotation];
    mat.forEach((row, r) => {
      row.forEach((v, c) => {
        if (v) {
          const bx = this.current.x + c;
          const by = this.current.y + r;
          if (by >= 0 && by < ROWS) {
            this.board[by][bx] = this.current.type;
          }
        }
      });
    });

    this.current = null;
    this._clearLines();

    if (!this.isOver) {
      this.spawn();
    }
  }

  // ── LINE CLEAR ────────────────────────────────────────────────────────────
  _clearLines() {
    const cleared = [];
    for (let r = ROWS - 1; r >= 0; r--) {
      if (this.board[r].every(c => c !== null)) {
        cleared.push(r);
      }
    }

    if (cleared.length === 0) return;

    // Flash
    this.renderer.flashRows(cleared);

    setTimeout(() => {
      cleared.forEach(r => {
        this.board.splice(r, 1);
        this.board.unshift(Array(COLS).fill(null));
      });

      const pts = [0, 100, 300, 500, 800];
      this.score += (pts[cleared.length] || 800) * this.level;
      this.lines += cleared.length;

      const newLevel = Math.floor(this.lines / 10) + 1;
      if (newLevel > this.level) {
        this.level = newLevel;
        audio.sfxLevelUp();
        // Speed up music
        audio.setTempo(Math.min(200, 120 + (this.level - 1) * 8));
      }

      audio.sfxLineClear(cleared.length);
      this._updateUI();
    }, 80);
  }

  // ── GRAVITY ───────────────────────────────────────────────────────────────
  dropInterval() {
    // ms per row, decreases with level
    return Math.max(50, 1000 * Math.pow(0.85, this.level - 1));
  }

  tick(timestamp) {
    if (this.isOver || this.isPaused || !this.current) return;

    const dt = timestamp - this.lastTime;
    this.lastTime = timestamp;
    this.dropAccum += dt;

    const interval = this.dropInterval();
    if (this.dropAccum >= interval) {
      this.dropAccum -= interval;
      if (!this._tryMove(0, 1)) {
        // Start lock timer if not already
        if (!this.lockTimer) {
          this.lockTimer = setTimeout(() => {
            if (this._onGround()) this._lock();
          }, LOCK_DELAY);
        }
      }
    }
  }

  // ── UI UPDATES ────────────────────────────────────────────────────────────
  _updateUI() {
    document.getElementById('score').textContent = this.score.toLocaleString();
    document.getElementById('level').textContent = this.level;
    document.getElementById('lines').textContent = this.lines;

    const hi = Math.max(this.score, parseInt(localStorage.getItem('tetris-hi') || '0'));
    localStorage.setItem('tetris-hi', hi);
    document.getElementById('high-score').textContent = hi.toLocaleString();
  }

  getState() {
    return {
      board:      this.board,
      current:    this.current,
      ghostY:     this.ghostY,
      holds:      this.holds,
      activeSlot: this.activeSlot,
      queue:      this.queue,
    };
  }
}
