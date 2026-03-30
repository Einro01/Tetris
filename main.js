// ─── MAIN ──────────────────────────────────────────────────────────────────
const renderer = new Renderer();
let game = new Game(renderer);
let rafId = null;
let running = false;

// ── OVERLAY HELPERS ────────────────────────────────────────────────────────
const overlay    = document.getElementById('overlay');
const oTitle     = document.getElementById('overlay-title');
const oSub       = document.getElementById('overlay-sub');
const oBtn       = document.getElementById('overlay-btn');

function showOverlay(title, sub, btnText, onStart) {
  oTitle.textContent = title;
  oSub.innerHTML = sub;
  oBtn.textContent = btnText;
  oBtn.onclick = () => {
    overlay.classList.add('hidden');
    onStart();
  };
  overlay.classList.remove('hidden');
}

function hideOverlay() {
  overlay.classList.add('hidden');
}

// ── GAME LOOP ──────────────────────────────────────────────────────────────
function loop(timestamp) {
  if (!running) return;

  game.tick(timestamp);

  const state = game.getState();
  renderer.drawBoard(state);
  renderer.drawHolds(state.holds, state.activeSlot);
  renderer.drawNextQueue(state.queue);
  game._updateUI();

  if (game.isOver) {
    running = false;
    audio.stopMusic();
    audio.sfxGameOver();

    const hi = localStorage.getItem('tetris-hi') || 0;
    setTimeout(() => {
      showOverlay(
        'GAME OVER',
        `Score: <strong style="color:var(--accent)">${game.score.toLocaleString()}</strong><br>High Score: ${parseInt(hi).toLocaleString()}`,
        'PLAY AGAIN',
        startGame
      );
    }, 600);
    return;
  }

  rafId = requestAnimationFrame(loop);
}

function startGame() {
  cancelAnimationFrame(rafId);
  game = new Game(renderer);
  game.spawn();
  game._updateUI();
  document.getElementById('high-score').textContent =
    parseInt(localStorage.getItem('tetris-hi') || '0').toLocaleString();

  audio.stopMusic();
  audio.startMusic();

  running = true;
  game.lastTime = performance.now();
  rafId = requestAnimationFrame(loop);
}

// ── DAS (Delayed Auto Shift) ───────────────────────────────────────────────
const DAS_DELAY = 170;
const DAS_REPEAT = 50;
const dasState = {};

function dasStart(key, fn) {
  if (dasState[key]) return;
  fn();
  dasState[key] = {
    timer: setTimeout(() => {
      dasState[key].interval = setInterval(fn, DAS_REPEAT);
    }, DAS_DELAY)
  };
}

function dasStop(key) {
  if (!dasState[key]) return;
  clearTimeout(dasState[key].timer);
  clearInterval(dasState[key].interval);
  delete dasState[key];
}

// ── INPUT ──────────────────────────────────────────────────────────────────
const keyActions = {
  ArrowLeft:  { down: () => dasStart('left',  () => game.moveLeft()),  up: () => dasStop('left') },
  ArrowRight: { down: () => dasStart('right', () => game.moveRight()), up: () => dasStop('right') },
  ArrowDown:  { down: () => dasStart('down',  () => game.softDrop()),  up: () => dasStop('down') },
  ArrowUp:    { down: () => game.rotate(1) },
  AltLeft:    { down: () => game.rotate(-1) },
  AltRight:   { down: () => game.rotate(-1) },
  Space:      { down: () => game.hardDrop() },
  ShiftLeft:  { down: () => game.holdPiece() },
  ShiftRight: { down: () => game.holdPiece() },
  ControlLeft:  { down: () => game.cycleSlot() },
  ControlRight: { down: () => game.cycleSlot() },
  KeyP:       { down: () => togglePause() },
  Escape:     { down: () => togglePause() },
};

document.addEventListener('keydown', e => {
  if (!running && !game.isPaused) return;
  const action = keyActions[e.code];
  if (!action) return;
  e.preventDefault();
  if (action.down) action.down();

  // SFX for movement
  if (e.code === 'ArrowLeft' || e.code === 'ArrowRight') audio.sfxMove();
});

document.addEventListener('keyup', e => {
  const action = keyActions[e.code];
  if (action?.up) action.up();
});

function togglePause() {
  if (game.isOver) return;
  game.isPaused = !game.isPaused;
  if (game.isPaused) {
    audio.stopMusic();
    showOverlay('PAUSED', '', 'RESUME', () => {
      game.isPaused = false;
      audio.startMusic();
      game.lastTime = performance.now();
      rafId = requestAnimationFrame(loop);
    });
  } else {
    hideOverlay();
    audio.startMusic();
    game.lastTime = performance.now();
    rafId = requestAnimationFrame(loop);
  }
}

// ── MUTE BUTTON ───────────────────────────────────────────────────────────
document.getElementById('muteBtn').addEventListener('click', () => {
  const muted = audio.toggleMute();
  const btn = document.getElementById('muteBtn');
  btn.textContent = muted ? '✕' : '♪';
  btn.classList.toggle('muted', muted);
});

// ── INIT ───────────────────────────────────────────────────────────────────
document.getElementById('high-score').textContent =
  parseInt(localStorage.getItem('tetris-hi') || '0').toLocaleString();

showOverlay(
  'TETRIS',
  'Press START to play<br><small style="color:var(--text-dim)">Use arrow keys, Space, Shift & Ctrl</small>',
  'START GAME',
  startGame
);
