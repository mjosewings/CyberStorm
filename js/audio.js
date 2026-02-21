/**
 * CYBERSTORM — audio.js
 * Music context manager + Web Audio API SFX
 *
 * ─── HOW TO ADD YOUR OWN MUSIC ───────────────────
 * 1. Place your music files in:  assets/music/
 * 2. Update the MUSIC_TRACKS object below with your filenames.
 * 3. Supported formats: .mp3, .ogg, .wav
 *
 * Example:
 *   menu:    'assets/music/my-menu-song.mp3'
 *   level:   'assets/music/my-level-music.ogg'
 *   boss:    'assets/music/boss-theme.mp3'
 *   win:     'assets/music/victory.mp3'
 *   defeat:  'assets/music/game-over.mp3'
 * ──────────────────────────────────────────────────
 */

const MUSIC_TRACKS = {
  menu:    'assets/music/level.mp3',      // ← Replace with your menu music filename
  level:   'assets/music/level.mp3',     // ← Replace with your level music filename
  boss:    'assets/music/boss.mp3',      // ← Replace with your boss music filename
  win:     'assets/music/win.mp3',       // ← Replace with your wave complete music
  defeat:  'assets/music/defeat.mp3',   // ← Replace with your game over music
};

const AudioManager = (() => {
  let ctx = null;
  let musicEl = null;
  let currentTrack = null;
  let musicMuted = false;
  let sfxMuted = false;
  let masterVolume = 0.6;
  let musicVolume = 0.5;

  function initCtx() {
    if (!ctx) {
      ctx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (ctx.state === 'suspended') ctx.resume();
  }

  // ── MUSIC ─────────────────────────────────────────

  function playMusic(trackKey, loop = true) {
    const src = MUSIC_TRACKS[trackKey];
    if (!src || currentTrack === trackKey) return;

    stopMusic(0.3);

    setTimeout(() => {
      if (!musicEl) {
        musicEl = new Audio();
        musicEl.loop = loop;
      }
      currentTrack = trackKey;
      musicEl.loop = loop;
      musicEl.src = src;
      musicEl.volume = musicMuted ? 0 : musicVolume * masterVolume;
      musicEl.play().catch(() => {
        // Autoplay blocked — will play on next user interaction
        const resume = () => { musicEl.play().catch(() => {}); document.removeEventListener('click', resume); document.removeEventListener('keydown', resume); };
        document.addEventListener('click', resume, { once: true });
        document.addEventListener('keydown', resume, { once: true });
      });
    }, currentTrack ? 350 : 0);
  }

  function stopMusic(fadeDuration = 0.5) {
    if (!musicEl) return;
    currentTrack = null;
    if (fadeDuration > 0) {
      const startVol = musicEl.volume;
      const steps = 20;
      const interval = (fadeDuration * 1000) / steps;
      let step = 0;
      const fade = setInterval(() => {
        step++;
        musicEl.volume = Math.max(0, startVol * (1 - step / steps));
        if (step >= steps) { clearInterval(fade); musicEl.pause(); musicEl.volume = musicVolume * masterVolume; }
      }, interval);
    } else {
      musicEl.pause();
    }
  }

  function setMusicMuted(muted) {
    musicMuted = muted;
    if (musicEl) musicEl.volume = muted ? 0 : musicVolume * masterVolume;
  }

  function setSfxMuted(muted) { sfxMuted = muted; }

  function setVolume(vol) {
    masterVolume = vol;
    if (musicEl && !musicMuted) musicEl.volume = musicVolume * masterVolume;
  }

  // ── SFX (Web Audio API — procedurally generated) ─

  function playTone(freq, type, duration, vol = 0.3, env = null) {
    if (sfxMuted) return;
    initCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = type || 'square';
    osc.frequency.setValueAtTime(freq, ctx.currentTime);
    if (env) {
      gain.gain.setValueAtTime(0, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(vol * masterVolume, ctx.currentTime + env.attack);
      gain.gain.linearRampToValueAtTime(0, ctx.currentTime + duration);
    } else {
      gain.gain.setValueAtTime(vol * masterVolume, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
    }
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + duration);
  }

  function playNoise(duration, vol = 0.2, highpass = 800) {
    if (sfxMuted) return;
    initCtx();
    const bufLen = ctx.sampleRate * duration;
    const buf = ctx.createBuffer(1, bufLen, ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < bufLen; i++) data[i] = Math.random() * 2 - 1;
    const src = ctx.createBufferSource();
    src.buffer = buf;
    const filter = ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.value = highpass;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(vol * masterVolume, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
    src.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    src.start();
    src.stop(ctx.currentTime + duration);
  }

  // ── SFX LIBRARY ─────────────────────────────────

  const SFX = {
    shoot() {
      initCtx();
      if (sfxMuted) return;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain); gain.connect(ctx.destination);
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(880, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(220, ctx.currentTime + 0.12);
      gain.gain.setValueAtTime(0.22 * masterVolume, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12);
      osc.start(); osc.stop(ctx.currentTime + 0.15);
    },

    enemyShoot() {
      initCtx();
      if (sfxMuted) return;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain); gain.connect(ctx.destination);
      osc.type = 'square';
      osc.frequency.setValueAtTime(280, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(140, ctx.currentTime + 0.1);
      gain.gain.setValueAtTime(0.15 * masterVolume, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1);
      osc.start(); osc.stop(ctx.currentTime + 0.12);
    },

    enemyDie(type = 'drone') {
      initCtx();
      if (sfxMuted) return;
      if (type === 'elite') {
        playNoise(0.3, 0.35, 200);
        setTimeout(() => playTone(120, 'sawtooth', 0.3, 0.2), 60);
      } else if (type === 'medium') {
        playNoise(0.2, 0.28, 400);
      } else {
        playNoise(0.15, 0.22, 600);
      }
    },

    playerHit() {
      initCtx();
      if (sfxMuted) return;
      playNoise(0.5, 0.4, 100);
      playTone(110, 'sawtooth', 0.4, 0.3);
    },

    powerup() {
      initCtx();
      if (sfxMuted) return;
      [523, 659, 784, 1046].forEach((f, i) => {
        setTimeout(() => playTone(f, 'sine', 0.15, 0.25), i * 60);
      });
    },

    bossHit() {
      initCtx();
      if (sfxMuted) return;
      playNoise(0.1, 0.3, 300);
      playTone(440, 'square', 0.08, 0.15);
    },

    bossDie() {
      initCtx();
      if (sfxMuted) return;
      [220, 180, 140, 100, 80].forEach((f, i) => {
        setTimeout(() => { playTone(f, 'sawtooth', 0.3, 0.3); playNoise(0.3, 0.35, f * 0.5); }, i * 120);
      });
    },

    ufoAppear() {
      initCtx();
      if (sfxMuted) return;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const lfo = ctx.createOscillator();
      const lfoGain = ctx.createGain();
      lfo.connect(lfoGain); lfoGain.connect(osc.frequency);
      lfo.frequency.value = 6;
      lfoGain.gain.value = 80;
      osc.connect(gain); gain.connect(ctx.destination);
      osc.type = 'sine';
      osc.frequency.value = 600;
      gain.gain.setValueAtTime(0.2 * masterVolume, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.0);
      lfo.start(); osc.start(); lfo.stop(ctx.currentTime + 1); osc.stop(ctx.currentTime + 1);
    },

    waveStart() {
      if (sfxMuted) return;
      [220, 330, 440, 660].forEach((f, i) => {
        setTimeout(() => playTone(f, 'square', 0.2, 0.2), i * 80);
      });
    },

    click() {
      playTone(880, 'square', 0.06, 0.1);
    },

    shieldBlock() {
      playTone(1200, 'sine', 0.1, 0.15);
      playNoise(0.08, 0.1, 1000);
    },

    multiShot() {
      [880, 1100, 1320].forEach((f, i) => {
        setTimeout(() => playTone(f, 'sawtooth', 0.1, 0.15), i * 20);
      });
    },
  };

  return {
    playMusic, stopMusic,
    setMusicMuted, setSfxMuted, setVolume,
    isMusicMuted: () => musicMuted,
    isSfxMuted: () => sfxMuted,
    SFX,
    initCtx,
  };
})();
