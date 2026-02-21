# 🌆 CYBERSTORM — Setup Guide

A Cyberpunk 2077-inspired Space Invaders game built in vanilla HTML/CSS/JavaScript.

---

## 📁 File Structure

```
cyberstorm/
├── index.html            ← Open this to play
├── css/
│   └── style.css         ← All styling
├── js/
│   ├── audio.js          ← Music + SFX system  ← EDIT THIS
│   ├── particles.js      ← Explosion FX
│   ├── barriers.js       ← Cover system
│   ├── bullets.js        ← Projectiles
│   ├── powerups.js       ← Drop system
│   ├── player.js         ← Player ship
│   ├── enemies.js        ← All enemy types
│   ├── hud.js            ← HUD display
│   ├── screens.js        ← All screens
│   └── main.js           ← Game loop
└── assets/
    └── music/            ← PUT YOUR MUSIC HERE
```

---

## 🎵 Adding Your Music

### Step 1 — Place your files
Put your music files in the `assets/music/` folder:
```
assets/music/menu.mp3
assets/music/level.mp3
assets/music/boss.mp3
assets/music/win.mp3
assets/music/defeat.mp3
```

### Step 2 — Update audio.js
Open `js/audio.js` and edit the `MUSIC_TRACKS` object at the top:

```javascript
const MUSIC_TRACKS = {
  menu:    'assets/music/YOUR_MENU_SONG.mp3',
  level:   'assets/music/YOUR_LEVEL_MUSIC.mp3',
  boss:    'assets/music/YOUR_BOSS_THEME.mp3',
  win:     'assets/music/YOUR_VICTORY_MUSIC.mp3',
  defeat:  'assets/music/YOUR_GAME_OVER_MUSIC.mp3',
};
```

### Supported formats
`.mp3`, `.ogg`, `.wav` — MP3 is recommended for widest browser support.

### When does each track play?
| Track   | When it plays                                        |
|---------|------------------------------------------------------|
| `menu`  | On the main menu screen                             |
| `level` | During normal gameplay waves                        |
| `boss`  | When a boss wave begins (every 3rd wave)            |
| `win`   | Wave complete screen (plays once, no loop)          |
| `defeat`| Game over screen (plays once, no loop)              |

---

## 🎮 How to Play

| Control       | Action                |
|---------------|----------------------|
| `←` `→`       | Move your ship       |
| `Space`       | Shoot (hold = rapid) |
| `P`           | Pause               |
| `M`           | Toggle music         |

### Power-ups (random drops from enemies)
| Icon | Name        | Effect                          |
|------|-------------|--------------------------------|
| ⚡   | Rapid Fire  | Faster shooting for 8 seconds  |
| 🛡   | Shield      | Absorbs 1 hit for 6 seconds    |
| ⫸   | Multi-Shot  | Triple bullets for 7 seconds   |
| ♥   | Extra Life  | +1 life (max 5)                |

### Scoring
| Enemy    | Points |
|----------|--------|
| Drone    | 10 pts |
| Enforcer | 20 pts |
| Elite    | 30 pts |
| UFO      | 100–300 pts (random) |
| Boss     | 500 pts |
| Wave bonus | Wave × 100 × (lives/3) |

---

## 🌐 Running Locally

Because this game uses ES modules and audio, you need to serve it from a local server (not just open the file directly).

### Option A — VS Code Live Server
Install the "Live Server" extension, right-click `index.html` → "Open with Live Server"

### Option B — Python
```bash
cd cyberstorm
python -m http.server 8080
# Open: http://localhost:8080
```

### Option C — Node.js
```bash
cd cyberstorm
npx serve .
```

---

## 🏙️ Enemy Types
- **Drones** — Pink corp drones. 1 hit. Fast, numerous.
- **Enforcers** — Purple corpo warriors. 2 hits. Shoot spread patterns.
- **Arasaka Elites** — Orange spider mechs. 3 hits. Aimed fire.
- **Arasaka Sovereign** — Boss (every 3rd wave). 3 phases, escalating attacks.
- **Ghost UFO** — Bonus ship, appears randomly. Shoot for big points.

---

*Inspired by Cyberpunk 2077 by CD Projekt RED and Space Invaders by Taito.*
