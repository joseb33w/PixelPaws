/* ═══════════════════════════════════════════
   PixelPaws — 8-Bit Sound Effects Engine
   Web Audio API oscillator-based retro sounds
   ═══════════════════════════════════════════ */
(function() {
  'use strict';

  let ctx = null;
  let masterGain = null;
  let muted = false;
  let volume = 0.3;

  function getCtx() {
    if (!ctx) {
      ctx = new (window.AudioContext || window.webkitAudioContext)();
      masterGain = ctx.createGain();
      masterGain.gain.value = volume;
      masterGain.connect(ctx.destination);
    }
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
  }

  function osc(type, freq, duration, startTime, gainVal) {
    const c = getCtx();
    if (muted) return;
    const o = c.createOscillator();
    const g = c.createGain();
    o.type = type;
    o.frequency.value = freq;
    g.gain.value = gainVal !== undefined ? gainVal : 0.3;
    o.connect(g);
    g.connect(masterGain);
    const t = startTime || c.currentTime;
    o.start(t);
    g.gain.exponentialRampToValueAtTime(0.001, t + duration);
    o.stop(t + duration + 0.05);
  }

  function noise(duration, gainVal) {
    const c = getCtx();
    if (muted) return;
    const bufSize = c.sampleRate * duration;
    const buf = c.createBuffer(1, bufSize, c.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < bufSize; i++) data[i] = Math.random() * 2 - 1;
    const src = c.createBufferSource();
    src.buffer = buf;
    const g = c.createGain();
    g.gain.value = gainVal || 0.15;
    src.connect(g);
    g.connect(masterGain);
    src.start();
    g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + duration);
    src.stop(c.currentTime + duration + 0.05);
  }

  const SFX = {
    // UI click — short blip
    click() {
      osc('square', 800, 0.06);
    },

    // Navigation tab switch
    nav() {
      const c = getCtx();
      osc('square', 600, 0.05, c.currentTime);
      osc('square', 900, 0.05, c.currentTime + 0.05);
    },

    // Coin / purchase
    coin() {
      const c = getCtx();
      osc('square', 988, 0.08, c.currentTime);
      osc('square', 1319, 0.15, c.currentTime + 0.08);
    },

    // Attack hit
    hit() {
      noise(0.1, 0.25);
      osc('sawtooth', 200, 0.1);
    },

    // Critical hit
    crit() {
      const c = getCtx();
      noise(0.15, 0.3);
      osc('sawtooth', 150, 0.08, c.currentTime);
      osc('square', 600, 0.06, c.currentTime + 0.08);
      osc('square', 800, 0.1, c.currentTime + 0.14);
    },

    // Defend / block
    defend() {
      const c = getCtx();
      osc('triangle', 300, 0.12, c.currentTime);
      osc('triangle', 250, 0.12, c.currentTime + 0.06);
    },

    // Miss / dodge
    miss() {
      const c = getCtx();
      const o = c.createOscillator();
      const g = c.createGain();
      o.type = 'sine';
      o.frequency.setValueAtTime(600, c.currentTime);
      o.frequency.linearRampToValueAtTime(200, c.currentTime + 0.2);
      g.gain.value = muted ? 0 : 0.2;
      o.connect(g);
      g.connect(masterGain);
      o.start();
      g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.25);
      o.stop(c.currentTime + 0.3);
    },

    // Heal
    heal() {
      const c = getCtx();
      osc('sine', 523, 0.1, c.currentTime);
      osc('sine', 659, 0.1, c.currentTime + 0.1);
      osc('sine', 784, 0.15, c.currentTime + 0.2);
    },

    // Feed pet
    feed() {
      const c = getCtx();
      osc('square', 440, 0.06, c.currentTime);
      osc('square', 554, 0.06, c.currentTime + 0.07);
      osc('square', 659, 0.08, c.currentTime + 0.14);
    },

    // Play with pet
    play() {
      const c = getCtx();
      osc('triangle', 700, 0.08, c.currentTime);
      osc('triangle', 880, 0.08, c.currentTime + 0.1);
      osc('triangle', 700, 0.08, c.currentTime + 0.2);
      osc('triangle', 1047, 0.12, c.currentTime + 0.3);
    },

    // Rest
    rest() {
      const c = getCtx();
      osc('sine', 392, 0.2, c.currentTime, 0.15);
      osc('sine', 330, 0.25, c.currentTime + 0.2, 0.12);
      osc('sine', 262, 0.3, c.currentTime + 0.4, 0.08);
    },

    // Level up fanfare
    levelUp() {
      const c = getCtx();
      const notes = [523, 659, 784, 1047];
      notes.forEach((f, i) => {
        osc('square', f, 0.12, c.currentTime + i * 0.1);
      });
      osc('square', 1047, 0.3, c.currentTime + 0.4);
    },

    // Adopt pet
    adopt() {
      const c = getCtx();
      const notes = [262, 330, 392, 523, 659, 784];
      notes.forEach((f, i) => {
        osc('square', f, 0.1, c.currentTime + i * 0.08);
      });
      osc('triangle', 1047, 0.4, c.currentTime + 0.5);
    },

    // Battle start
    battleStart() {
      const c = getCtx();
      osc('sawtooth', 200, 0.1, c.currentTime, 0.2);
      osc('sawtooth', 250, 0.1, c.currentTime + 0.1, 0.2);
      osc('sawtooth', 300, 0.1, c.currentTime + 0.2, 0.2);
      osc('sawtooth', 400, 0.2, c.currentTime + 0.3, 0.25);
      noise(0.05, 0.2);
    },

    // Special attack
    special() {
      const c = getCtx();
      const o = c.createOscillator();
      const g = c.createGain();
      o.type = 'sawtooth';
      o.frequency.setValueAtTime(300, c.currentTime);
      o.frequency.exponentialRampToValueAtTime(1200, c.currentTime + 0.2);
      o.frequency.exponentialRampToValueAtTime(400, c.currentTime + 0.4);
      g.gain.value = muted ? 0 : 0.2;
      o.connect(g);
      g.connect(masterGain);
      o.start();
      g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.5);
      o.stop(c.currentTime + 0.55);
      noise(0.08, 0.15);
    },

    // Victory
    victory() {
      const c = getCtx();
      const melody = [523, 523, 523, 698, 880, 784, 698, 880, 1047];
      const durs =  [0.1, 0.1, 0.1, 0.15, 0.15, 0.1, 0.1, 0.15, 0.3];
      let t = c.currentTime;
      melody.forEach((f, i) => {
        osc('square', f, durs[i], t);
        t += durs[i] + 0.02;
      });
    },

    // Defeat
    defeat() {
      const c = getCtx();
      osc('sawtooth', 400, 0.2, c.currentTime, 0.2);
      osc('sawtooth', 300, 0.2, c.currentTime + 0.2, 0.18);
      osc('sawtooth', 200, 0.3, c.currentTime + 0.4, 0.15);
      osc('sawtooth', 100, 0.5, c.currentTime + 0.6, 0.1);
    },

    // XP gain
    xp() {
      const c = getCtx();
      osc('square', 880, 0.05, c.currentTime);
      osc('square', 1108, 0.08, c.currentTime + 0.06);
    },

    // Error / deny
    error() {
      const c = getCtx();
      osc('square', 200, 0.15, c.currentTime);
      osc('square', 150, 0.2, c.currentTime + 0.15);
    },

    // Quest complete
    questComplete() {
      const c = getCtx();
      osc('square', 784, 0.1, c.currentTime);
      osc('square', 988, 0.1, c.currentTime + 0.1);
      osc('square', 1175, 0.1, c.currentTime + 0.2);
      osc('triangle', 1568, 0.25, c.currentTime + 0.3);
    },

    // Toggle mute
    toggleMute() {
      muted = !muted;
      if (masterGain) masterGain.gain.value = muted ? 0 : volume;
      return muted;
    },

    isMuted() { return muted; },

    setVolume(v) {
      volume = Math.max(0, Math.min(1, v));
      if (masterGain && !muted) masterGain.gain.value = volume;
    }
  };

  window.SFX = SFX;
})();
