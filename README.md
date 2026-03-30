# 🟦 TETRIS

A minimalistic, dark-mode Tetris game built with vanilla HTML/CSS/JavaScript. No dependencies, no build step — just open `index.html` and play.

## 🎮 Controls

| Key | Action |
|-----|--------|
| `←` `→` | Move piece left / right |
| `↑` | Rotate clockwise |
| `Alt` | Rotate counter-clockwise |
| `↓` | Soft drop |
| `Space` | Hard drop (instant) |
| `Shift` | Store piece in active hold slot |
| `Ctrl` | Cycle active hold slot (slot 1 ↔ slot 2) |
| `P` / `Esc` | Pause / Resume |
| `♪` button | Toggle 8-bit music |

## ✨ Features

- **2 Hold Slots** — Store up to 2 pieces, cycle between them with `Ctrl`
- **Ghost Piece** — See where your piece will land
- **7-Bag Randomizer** — Fair piece distribution
- **Wall Kicks** — Rotate near walls
- **DAS (Delayed Auto Shift)** — Smooth, responsive horizontal movement
- **Level Progression** — Speed increases every 10 lines
- **8-bit Soundtrack** — Korobeiniki (Tetris Theme A) via Web Audio API
- **Sound Effects** — Move, rotate, drop, hold, line clear, level up, game over
- **High Score** — Persisted in localStorage
- **Dark Minimalist UI** — Orbitron + Share Tech Mono fonts

## 🚀 How to Play

### Option 1: Open directly
```bash
git clone https://github.com/YOUR_USERNAME/tetris.git
cd tetris
open index.html   # macOS
# or just double-click index.html
```

### Option 2: Serve locally (recommended for audio)
```bash
# Python 3
python -m http.server 8080
# then open http://localhost:8080

# Node.js
npx serve .
```

> **Note:** Some browsers block Web Audio on `file://` URLs. Use a local server for the best experience.

## 🏗️ Project Structure

```
tetris/
├── index.html          # Main HTML
├── css/
│   └── style.css       # Dark minimalist theme
├── js/
│   ├── audio.js        # 8-bit Web Audio engine + Tetris music
│   ├── pieces.js       # Piece definitions & 7-bag randomizer
│   ├── renderer.js     # Canvas rendering (board, ghost, mini previews)
│   ├── game.js         # Game logic (movement, rotation, locking, scoring)
│   └── main.js         # Game loop, input handling, DAS, UI
└── README.md
```

## 📐 Scoring

| Lines Cleared | Points (× Level) |
|--------------|-----------------|
| 1 (Single)   | 100             |
| 2 (Double)   | 300             |
| 3 (Triple)   | 500             |
| 4 (Tetris!)  | 800             |
| Soft Drop    | 1 per row       |
| Hard Drop    | 2 per row       |

## 🎨 Design

- **Font:** Orbitron (headers) + Share Tech Mono (body)
- **Theme:** Pure dark — `#0a0a0f` background
- **Accent:** Cyan `#00f5c4`
- **Piece Colors:** Classic NES-inspired palette

## 📄 License

MIT — free to use, modify, and distribute.
