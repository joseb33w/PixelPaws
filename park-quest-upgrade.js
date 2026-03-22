/* ═══════════════════════════════════════════════════
   PixelPaws — Park & Quest Visual Upgrade
   Overrides park + quest rendering with enhanced UI
   ═══════════════════════════════════════════════════ */
(function () {
  'use strict';

  /* ── Inject all CSS ── */
  const css = document.createElement('style');
  css.textContent = `

/* ═══════════════════════════
   PARK — Living Pixel Scene
   ═══════════════════════════ */
.park-scene {
  position: relative; width: 100%; min-height: 420px;
  border: 3px solid var(--border);
  box-shadow: 4px 4px 0 rgba(0,0,0,0.4);
  overflow: hidden; image-rendering: pixelated;
  background: linear-gradient(180deg, #1b0e3a 0%, #2a1450 35%, #3d2060 50%, #234518 50%, #1a3312 100%);
}

/* sky gradient overlay for day/night */
.park-sky {
  position: absolute; inset: 0; bottom: 50%; z-index: 0;
  pointer-events: none;
}
.park-sky.clear  { background: linear-gradient(180deg, #0c0824 0%, #1a0e44 40%, #3a1878 100%); }
.park-sky.cloudy { background: linear-gradient(180deg, #16102a 0%, #2a2244 40%, #3d3060 100%); }
.park-sky.rain   { background: linear-gradient(180deg, #0a0a18 0%, #1a1830 40%, #282040 100%); }
.park-sky.snow   { background: linear-gradient(180deg, #1a1a2e 0%, #2a2a44 40%, #3a3a58 100%); }
.park-sky.storm  { background: linear-gradient(180deg, #080810 0%, #121220 40%, #1a1a30 100%); }

/* ground */
.park-ground {
  position: absolute; left: 0; right: 0; bottom: 0; height: 50%; z-index: 1;
  background: 
    repeating-linear-gradient(90deg,
      #1a3312 0px, #1a3312 8px,
      #1d3814 8px, #1d3814 16px,
      #163010 16px, #163010 24px,
      #1a3312 24px, #1a3312 32px
    );
}
.park-ground::before {
  content: ''; position: absolute; top: 0; left: 0; right: 0; height: 12px;
  background: repeating-linear-gradient(90deg,
    #2a5a1e 0px, #2a5a1e 6px,
    #34701e 6px, #34701e 10px,
    #2a5a1e 10px, #2a5a1e 14px,
    #408a22 14px, #408a22 18px
  );
  z-index: 2;
}

/* pixel clouds */
@keyframes cloudDrift {
  0%   { transform: translateX(-120px); }
  100% { transform: translateX(calc(100vw + 60px)); }
}
.park-cloud {
  position: absolute; z-index: 2; pointer-events: none;
  width: 64px; height: 24px;
  background: rgba(200,190,240,0.25);
  box-shadow:
    16px 0 0 rgba(200,190,240,0.25),
    -16px 0 0 rgba(200,190,240,0.25),
    0 -8px 0 rgba(200,190,240,0.2),
    8px -8px 0 rgba(200,190,240,0.2),
    -8px -8px 0 rgba(200,190,240,0.2),
    16px -8px 0 rgba(200,190,240,0.18);
  animation: cloudDrift linear infinite;
}

/* pixel trees */
.park-tree {
  position: absolute; z-index: 3; pointer-events: none;
  bottom: 50%; /* sits on ground line */
}
.park-tree-trunk {
  width: 10px; height: 20px; margin: 0 auto;
  background: #5a3a1e;
  box-shadow: inset -3px 0 0 #4a2a10;
}
.park-tree-top {
  width: 36px; height: 28px; margin: 0 auto -2px;
  background: #1a6a10;
  clip-path: polygon(50% 0%, 10% 100%, 90% 100%);
  position: relative;
}
.park-tree-top::after {
  content: ''; position: absolute; bottom: -6px; left: -6px; right: -6px; height: 22px;
  background: #228a18;
  clip-path: polygon(50% 0%, 5% 100%, 95% 100%);
}
.park-tree.tree-sm .park-tree-top { width: 28px; height: 22px; }
.park-tree.tree-sm .park-tree-trunk { width: 8px; height: 14px; }

/* fence */
.park-fence {
  position: absolute; bottom: calc(50% - 6px); left: 0; right: 0; height: 18px;
  z-index: 2; pointer-events: none; display: flex;
}
.park-fence-post {
  width: 6px; height: 18px; background: #6a4a2a;
  box-shadow: inset -2px 0 0 #5a3a1a;
  flex-shrink: 0;
}
.park-fence-rail {
  flex: 1; height: 4px; background: #7a5a3a;
  margin-top: 5px;
  box-shadow: 0 8px 0 #7a5a3a;
}

/* stars */
@keyframes twinkle {
  0%, 100% { opacity: 0.3; } 50% { opacity: 1; }
}
.park-star {
  position: absolute; z-index: 1;
  width: 3px; height: 3px; background: #fff;
  box-shadow: 0 0 4px 1px rgba(255,255,255,0.4);
  animation: twinkle ease-in-out infinite;
  pointer-events: none;
}

/* weather overlays */
@keyframes rainDrop {
  0%   { transform: translateY(-20px); opacity: 0.7; }
  100% { transform: translateY(420px); opacity: 0; }
}
.park-rain-layer {
  position: absolute; inset: 0; z-index: 10; pointer-events: none; overflow: hidden;
}
.park-raindrop {
  position: absolute; top: -10px;
  width: 2px; height: 10px;
  background: linear-gradient(180deg, transparent, rgba(130,160,255,0.6));
  animation: rainDrop linear infinite;
}

@keyframes snowFall {
  0%   { transform: translate(0, -20px) rotate(0deg); opacity: 0.8; }
  50%  { transform: translate(15px, 200px) rotate(180deg); opacity: 0.9; }
  100% { transform: translate(-5px, 440px) rotate(360deg); opacity: 0; }
}
.park-snow-layer {
  position: absolute; inset: 0; z-index: 10; pointer-events: none; overflow: hidden;
}
.park-snowflake {
  position: absolute; top: -10px;
  width: 5px; height: 5px; border-radius: 50%;
  background: rgba(220,225,255,0.7);
  animation: snowFall linear infinite;
}

@keyframes stormFlash {
  0%, 94%, 100% { opacity: 0; }
  95% { opacity: 0.6; }
  97% { opacity: 0; }
  98% { opacity: 0.4; }
}
.park-storm-flash {
  position: absolute; inset: 0; z-index: 11; pointer-events: none;
  background: rgba(200,180,255,0.15);
  animation: stormFlash 4s ease-in-out infinite;
}

/* sun rays */
@keyframes sunPulse {
  0%, 100% { transform: translate(-50%,-50%) scale(1); opacity: 0.12; }
  50% { transform: translate(-50%,-50%) scale(1.15); opacity: 0.18; }
}
.park-sun {
  position: absolute; top: 12%; right: 12%; z-index: 2; pointer-events: none;
  width: 50px; height: 50px; border-radius: 50%;
  background: radial-gradient(circle, rgba(255,215,0,0.5), rgba(255,180,0,0.2), transparent 70%);
  box-shadow: 0 0 40px 15px rgba(255,215,0,0.12);
  animation: sunPulse 4s ease-in-out infinite;
}

/* roaming pets */
@keyframes roamRight {
  0%   { transform: translate(0, 0); }
  25%  { transform: translate(30px, -8px); }
  50%  { transform: translate(10px, 5px); }
  75%  { transform: translate(-20px, -3px); }
  100% { transform: translate(0, 0); }
}
@keyframes roamLeft {
  0%   { transform: translate(0, 0); }
  25%  { transform: translate(-25px, 5px); }
  50%  { transform: translate(-10px, -8px); }
  75%  { transform: translate(15px, 3px); }
  100% { transform: translate(0, 0); }
}
@keyframes petBob {
  0%, 100% { transform: translateY(0); }
  50%      { transform: translateY(-4px); }
}
.park-pet {
  position: absolute; z-index: 5; cursor: pointer;
  transition: filter 0.2s;
  text-align: center;
}
.park-pet:hover { filter: brightness(1.3) drop-shadow(0 0 6px var(--pixel-yellow)); z-index: 8; }
.park-pet-emoji {
  font-size: 42px; display: block; line-height: 1;
  filter: drop-shadow(0 3px 0 rgba(0,0,0,0.5));
  animation: petBob 1.8s ease-in-out infinite;
}
.park-pet.roam-r .park-pet-emoji { animation: petBob 1.8s ease-in-out infinite, roamRight var(--roam-dur) ease-in-out infinite; }
.park-pet.roam-l .park-pet-emoji { animation: petBob 1.8s ease-in-out infinite, roamLeft var(--roam-dur) ease-in-out infinite; }
.park-pet-name {
  font-family: var(--font-pixel); font-size: 6px; color: var(--text);
  background: rgba(0,0,0,0.55); padding: 2px 5px;
  white-space: nowrap; margin-top: 2px; display: inline-block;
}
.park-pet-lvl {
  font-family: var(--font-pixel); font-size: 5px;
  color: var(--pixel-yellow); display: block; margin-top: 1px;
}
.park-pet-owner {
  font-family: var(--font-pixel); font-size: 5px;
  color: var(--pixel-cyan); display: block;
}

/* pet detail popup */
.park-popup {
  position: fixed; top: 50%; left: 50%; z-index: 200;
  transform: translate(-50%, -50%);
  background: var(--panel); border: 3px solid var(--pixel-yellow);
  box-shadow: 6px 6px 0 rgba(0,0,0,0.5), 0 0 30px rgba(255,215,0,0.15);
  padding: 20px; width: min(320px, 90vw);
  text-align: center;
}
.park-popup-close {
  position: absolute; top: 6px; right: 8px;
  background: none; border: none; color: var(--pixel-red);
  font-family: var(--font-pixel); font-size: 12px; cursor: pointer;
}
.park-popup-emoji { font-size: 64px; display: block; margin: 8px 0;
  filter: drop-shadow(0 4px 0 rgba(0,0,0,0.4));
}
.park-popup-name { font-size: 11px; color: var(--pixel-yellow); }
.park-popup-detail { font-size: 7px; color: var(--text-dim); margin-top: 6px; line-height: 2; }
.park-popup-overlay {
  position: fixed; inset: 0; background: rgba(0,0,0,0.5); z-index: 199; cursor: pointer;
}

/* park header */
.park-header {
  display: flex; justify-content: space-between; align-items: center;
  margin-bottom: 12px; flex-wrap: wrap; gap: 8px;
}
.park-header h2 { font-size: 11px; color: var(--pixel-yellow); text-shadow: 2px 2px 0 rgba(0,0,0,0.5); }
.park-weather {
  display: flex; align-items: center; gap: 6px;
  font-size: 8px; color: var(--text-dim);
  background: var(--panel); border: 2px solid var(--border);
  padding: 4px 10px;
}
.park-weather-icon { font-size: 16px; }
.park-count {
  font-size: 7px; color: var(--pixel-cyan); margin-top: 10px; text-align: center;
}


/* ═══════════════════════════
   QUEST — RPG Dialogue UI
   ═══════════════════════════ */
.quest-wrap {
  max-width: 800px; margin: 0 auto; padding: 14px 12px;
}
.quest-header {
  text-align: center; margin-bottom: 14px;
}
.quest-header h2 {
  font-size: 13px; color: var(--pixel-yellow);
  text-shadow: 2px 2px 0 rgba(0,0,0,0.5);
}
.quest-header-sub {
  font-size: 7px; color: var(--text-dim); margin-top: 6px;
}

/* progress bar */
.quest-progress-wrap {
  margin-bottom: 14px;
}
.quest-progress-label {
  display: flex; justify-content: space-between; font-size: 7px;
  color: var(--text-dim); margin-bottom: 4px;
}
.quest-progress-bar {
  height: 12px; background: var(--bg-deep); border: 2px solid var(--border);
  overflow: hidden; position: relative;
}
.quest-progress-fill {
  height: 100%; background: var(--pixel-green);
  transition: width 0.4s ease;
  box-shadow: inset 0 -2px 0 rgba(0,0,0,0.3), 0 0 8px rgba(57,255,20,0.3);
}
.quest-progress-pips {
  position: absolute; inset: 0; display: flex;
}
.quest-progress-pip {
  flex: 1; border-right: 2px solid rgba(0,0,0,0.3);
}
.quest-progress-pip:last-child { border-right: none; }

/* question dialogue box */
.quest-dialogue {
  background: var(--panel);
  border: 3px solid var(--pixel-yellow);
  box-shadow: 4px 4px 0 rgba(0,0,0,0.4), inset 1px 1px 0 rgba(255,255,255,0.05);
  padding: 20px; margin-bottom: 14px;
  position: relative;
}
.quest-dialogue::after {
  content: ''; position: absolute; bottom: -12px; left: 30px;
  width: 0; height: 0;
  border-left: 10px solid transparent;
  border-right: 10px solid transparent;
  border-top: 12px solid var(--pixel-yellow);
}
.quest-category {
  display: inline-block; font-size: 6px; padding: 3px 8px;
  background: rgba(191,90,242,0.2); border: 1px solid var(--pixel-purple);
  color: var(--pixel-purple); margin-bottom: 10px;
  text-transform: uppercase; letter-spacing: 1px;
}
.quest-question {
  font-family: var(--font-pixel); font-size: 10px;
  color: var(--text); line-height: 2.2;
}
.quest-difficulty {
  margin-top: 8px; font-size: 6px; color: var(--text-dim);
}
.quest-difficulty-star { color: var(--pixel-yellow); }

/* answer grid 2x2 */
.quest-answers {
  display: grid; grid-template-columns: 1fr 1fr; gap: 10px;
  margin-bottom: 14px;
}
.quest-answer-btn {
  font-family: var(--font-pixel); font-size: 8px;
  padding: 14px 10px; line-height: 1.8;
  border: 3px solid var(--border);
  background: var(--panel-light);
  color: var(--text); cursor: pointer;
  text-align: center;
  box-shadow: 0 4px 0 rgba(0,0,0,0.4);
  transition: all 0.15s;
  word-break: break-word;
  min-height: 52px;
  display: flex; align-items: center; justify-content: center;
}
.quest-answer-btn:hover {
  border-color: var(--pixel-cyan);
  background: #2d1f50;
  transform: translateY(-2px);
}
.quest-answer-btn:active {
  transform: translateY(2px); box-shadow: none;
}
.quest-answer-btn.disabled {
  pointer-events: none; opacity: 0.6;
}

/* feedback states */
@keyframes correctPulse {
  0%   { box-shadow: 0 4px 0 rgba(0,0,0,0.4), 0 0 0 0 rgba(57,255,20,0.4); }
  50%  { box-shadow: 0 4px 0 rgba(0,0,0,0.4), 0 0 20px 4px rgba(57,255,20,0.3); }
  100% { box-shadow: 0 4px 0 rgba(0,0,0,0.4), 0 0 0 0 rgba(57,255,20,0); }
}
@keyframes wrongShake {
  0%, 100% { transform: translateX(0); }
  15% { transform: translateX(-6px); }
  30% { transform: translateX(6px); }
  45% { transform: translateX(-4px); }
  60% { transform: translateX(4px); }
  75% { transform: translateX(-2px); }
  90% { transform: translateX(2px); }
}
.quest-answer-btn.correct {
  border-color: var(--pixel-green) !important;
  background: rgba(57,255,20,0.15) !important;
  color: var(--pixel-green) !important;
  animation: correctPulse 0.6s ease;
}
.quest-answer-btn.wrong {
  border-color: var(--pixel-red) !important;
  background: rgba(255,71,87,0.15) !important;
  color: var(--pixel-red) !important;
  animation: wrongShake 0.4s ease;
}
.quest-answer-btn.reveal-correct {
  border-color: var(--pixel-green) !important;
  background: rgba(57,255,20,0.08) !important;
}

/* feedback text */
.quest-feedback {
  text-align: center; font-size: 9px; font-family: var(--font-pixel);
  padding: 10px; min-height: 36px;
}
.quest-feedback.fb-correct { color: var(--pixel-green); }
.quest-feedback.fb-wrong   { color: var(--pixel-red); }

/* results card */
.quest-results {
  background: var(--panel); border: 3px solid var(--pixel-yellow);
  box-shadow: 4px 4px 0 rgba(0,0,0,0.4);
  padding: 24px; text-align: center;
}
@keyframes resultBounce {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.08); }
}
.quest-results-trophy {
  font-size: 48px; display: block; margin-bottom: 12px;
  animation: resultBounce 1s ease infinite;
}
.quest-results h3 {
  font-size: 13px; color: var(--pixel-yellow);
  text-shadow: 2px 2px 0 rgba(0,0,0,0.5);
}
.quest-results-score {
  font-size: 10px; color: var(--text); margin-top: 10px; line-height: 2.4;
}
.quest-results-rewards {
  display: flex; justify-content: center; gap: 16px; margin-top: 14px;
}
.quest-reward-badge {
  background: var(--panel-light); border: 2px solid var(--border);
  padding: 10px 14px; text-align: center;
}
.quest-reward-badge .val {
  font-size: 14px; font-family: var(--font-pixel); display: block;
}
.quest-reward-badge .lbl {
  font-size: 6px; color: var(--text-dim); margin-top: 4px; display: block;
}
.quest-reward-badge.coins .val { color: var(--coin-gold); }
.quest-reward-badge.xp .val    { color: var(--xp-blue); }

/* start quest card */
.quest-start {
  background: var(--panel); border: 3px solid var(--border);
  box-shadow: 4px 4px 0 rgba(0,0,0,0.4);
  padding: 28px; text-align: center;
}
.quest-start-icon { font-size: 48px; display: block; margin-bottom: 14px; }
.quest-start p { font-size: 8px; color: var(--text-dim); line-height: 2; margin-top: 10px; }

`;
  document.head.appendChild(css);


  /* ── Utility ── */
  function esc(v) { return String(v || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }
  function decodeHtml(s) { const e = document.createElement('div'); e.innerHTML = s; return e.textContent; }

  const SPECIES_EMOJI = { cat:'🐱', dog:'🐶', dragon:'🐉', fox:'🦊', robot:'🤖' };
  function specEmoji(sp) { return SPECIES_EMOJI[(sp || 'cat').toLowerCase()] || '🐾'; }

  const CORRECT_MSGS = [
    'Correct! ⭐', 'Nailed it! 🎯', 'You got it! ✨', 'Right on! 🏆',
    'Genius! 🧠', 'Perfect! 💯'
  ];
  const WRONG_MSGS = [
    'Not quite! 💫', 'Wrong! 😅', 'Nope! 🙈', 'So close! 😬'
  ];
  function rndPick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

  /* ── Wait for app ── */
  let polls = 0;
  function waitForApp() {
    if (window.S && window.render) {
      patch();
    } else if (polls++ < 200) {
      setTimeout(waitForApp, 50);
    }
  }
  waitForApp();

  /* ── Main patch ── */
  function patch() {
    console.log('[ParkQuest] Patching render...');
    const origRender = window.render;

    window.render = function () {
      origRender.apply(this, arguments);

      // After original render, override park / quest sections
      try {
        if (window.S.nav === 'park')  overridePark();
        if (window.S.nav === 'quest') overrideQuest();
      } catch (e) {
        console.error('[ParkQuest] render error:', e);
      }
    };

    // If already on park/quest, apply now
    if (window.S.nav === 'park')  setTimeout(overridePark, 50);
    if (window.S.nav === 'quest') setTimeout(overrideQuest, 50);

    console.log('[ParkQuest] Patches applied ✓');
  }


  /* ═══════════════════════════════
     PARK — Enhanced Rendering
     ═══════════════════════════════ */
  let parkPopup = null; // currently shown pet id or null

  function overridePark() {
    const page = document.querySelector('.page');
    if (!page) return;

    const S = window.S;
    const pets = S.parkPets || S.allPets || [];
    const w = S.weather || { condition: 'Clear', temp: 22, icon: '☀️' };
    const cond = (w.condition || 'Clear').toLowerCase();
    const condCls = cond.includes('rain') ? 'rain'
                  : cond.includes('snow') ? 'snow'
                  : cond.includes('storm') || cond.includes('thunder') ? 'storm'
                  : cond.includes('cloud') || cond.includes('overcast') ? 'cloudy'
                  : 'clear';

    let html = '';

    /* header */
    html += `<div class="park-header">
      <h2>🌳 Pixel Park</h2>
      <div class="park-weather">
        <span class="park-weather-icon">${esc(w.icon || '☀️')}</span>
        <span>${esc(w.condition)} ${w.temp != null ? Math.round(w.temp) + '°' : ''}</span>
      </div>
    </div>`;

    /* scene container */
    html += `<div class="park-scene" id="parkScene">`;

    /* sky */
    html += `<div class="park-sky ${condCls}"></div>`;

    /* sun (only on clear) */
    if (condCls === 'clear') {
      html += `<div class="park-sun"></div>`;
    }

    /* stars */
    for (let i = 0; i < 18; i++) {
      const x = Math.random() * 96 + 2;
      const y = Math.random() * 40 + 2;
      const dur = 2 + Math.random() * 3;
      const del = Math.random() * 3;
      html += `<div class="park-star" style="left:${x}%;top:${y}%;animation-duration:${dur}s;animation-delay:${del}s"></div>`;
    }

    /* clouds */
    const numClouds = condCls === 'cloudy' ? 6 : condCls === 'rain' || condCls === 'storm' ? 5 : 3;
    for (let i = 0; i < numClouds; i++) {
      const t = 5 + Math.random() * 8 + '%';
      const dur = 20 + Math.random() * 30;
      const del = -(Math.random() * dur);
      const opacity = 0.2 + Math.random() * 0.3;
      html += `<div class="park-cloud" style="top:${t};animation-duration:${dur}s;animation-delay:${del}s;opacity:${opacity}"></div>`;
    }

    /* trees */
    const treePositions = [5, 18, 42, 65, 82, 93];
    treePositions.forEach((x, i) => {
      const sm = i % 3 === 1 ? ' tree-sm' : '';
      html += `<div class="park-tree${sm}" style="left:${x}%">
        <div class="park-tree-top"></div>
        <div class="park-tree-trunk"></div>
      </div>`;
    });

    /* fence */
    html += `<div class="park-fence">`;
    const posts = 14;
    for (let i = 0; i < posts; i++) {
      html += `<div class="park-fence-post"></div>`;
      if (i < posts - 1) html += `<div class="park-fence-rail"></div>`;
    }
    html += `</div>`;

    /* ground */
    html += `<div class="park-ground"></div>`;

    /* weather particles */
    if (condCls === 'rain' || condCls === 'storm') {
      html += `<div class="park-rain-layer">`;
      const drops = condCls === 'storm' ? 60 : 40;
      for (let i = 0; i < drops; i++) {
        const x = Math.random() * 100;
        const dur = 0.4 + Math.random() * 0.5;
        const del = Math.random() * 2;
        html += `<div class="park-raindrop" style="left:${x}%;animation-duration:${dur}s;animation-delay:${del}s"></div>`;
      }
      html += `</div>`;
    }
    if (condCls === 'storm') {
      html += `<div class="park-storm-flash"></div>`;
    }
    if (condCls === 'snow') {
      html += `<div class="park-snow-layer">`;
      for (let i = 0; i < 35; i++) {
        const x = Math.random() * 100;
        const dur = 3 + Math.random() * 4;
        const del = Math.random() * 5;
        const sz = 3 + Math.random() * 4;
        html += `<div class="park-snowflake" style="left:${x}%;animation-duration:${dur}s;animation-delay:${del}s;width:${sz}px;height:${sz}px"></div>`;
      }
      html += `</div>`;
    }

    /* pets in the park */
    const petSlots = spreadPets(pets.length);
    pets.forEach((pet, idx) => {
      const pos = petSlots[idx] || { x: 10 + Math.random() * 80, y: 55 + Math.random() * 35 };
      const dir = Math.random() > 0.5 ? 'roam-r' : 'roam-l';
      const dur = 6 + Math.random() * 8;
      const flipStyle = dir === 'roam-l' ? 'transform: scaleX(-1);' : '';
      const ownerName = pet.owner?.display_name || pet.owner_name || '';
      const name = pet.name || 'Pet';
      const emoji = specEmoji(pet.species);
      const lvl = pet.level || 1;

      html += `<div class="park-pet ${dir}" style="left:${pos.x}%;top:${pos.y}%;--roam-dur:${dur}s"
                   onclick="window._parkPetClick('${esc(pet.id || idx)}')">
        <span class="park-pet-emoji" style="${flipStyle}">${emoji}</span>
        <span class="park-pet-name">${esc(name)}</span>
        <span class="park-pet-lvl">Lv.${lvl}</span>
        ${ownerName ? `<span class="park-pet-owner">${esc(ownerName)}</span>` : ''}
      </div>`;
    });

    html += `</div>`; // close park-scene

    html += `<div class="park-count">${pets.length} pet${pets.length !== 1 ? 's' : ''} roaming the park 🐾</div>`;

    /* popup overlay */
    if (parkPopup) {
      const p = pets.find(x => String(x.id) === String(parkPopup));
      if (p) {
        const ownerName = p.owner?.display_name || p.owner_name || 'Unknown';
        html += `<div class="park-popup-overlay" onclick="window._parkClosePopup()"></div>`;
        html += `<div class="park-popup">
          <button class="park-popup-close" onclick="window._parkClosePopup()">✕</button>
          <span class="park-popup-emoji">${specEmoji(p.species)}</span>
          <div class="park-popup-name">${esc(p.name || 'Pet')}</div>
          <div class="park-popup-detail">
            Species: ${esc(p.species || '?')} · Level ${p.level || 1}<br>
            Owner: ${esc(ownerName)}<br>
            ${p.attack != null ? `ATK ${p.attack} · DEF ${p.defense} · SPD ${p.speed}` : ''}
          </div>
        </div>`;
      }
    }

    page.innerHTML = html;
  }

  /* spread pets evenly in park area (bottom 45%) */
  function spreadPets(count) {
    const slots = [];
    const cols = Math.ceil(Math.sqrt(count * 2));
    const rows = Math.ceil(count / cols);
    let idx = 0;
    for (let r = 0; r < rows && idx < count; r++) {
      for (let c = 0; c < cols && idx < count; c++) {
        const x = 6 + (c / cols) * 84 + (Math.random() * 8 - 4);
        const y = 54 + (r / rows) * 38 + (Math.random() * 6 - 3);
        slots.push({ x: Math.max(3, Math.min(93, x)), y: Math.max(52, Math.min(92, y)) });
        idx++;
      }
    }
    return slots;
  }

  window._parkPetClick = function (id) {
    parkPopup = id;
    overridePark();
  };
  window._parkClosePopup = function () {
    parkPopup = null;
    overridePark();
  };


  /* ═══════════════════════════════
     QUEST — RPG Dialogue UI
     ═══════════════════════════════ */
  let questFeedback = null; // { type:'correct'|'wrong', msg:'' }
  let feedbackTimer = null;

  function overrideQuest() {
    const page = document.querySelector('.page');
    if (!page) return;

    const S = window.S;
    const qp = S.questProgress;

    let html = '<div class="quest-wrap">';

    /* header */
    html += `<div class="quest-header">
      <h2>⚔️ Trivia Quest</h2>
      <div class="quest-header-sub">Test your knowledge, earn rewards!</div>
    </div>`;

    /* no active quest — show start screen */
    if (!qp || !qp.questions || !qp.questions.length) {
      html += `<div class="quest-start">
        <span class="quest-start-icon">📜</span>
        <h3 style="font-size:11px;color:var(--pixel-yellow);text-shadow:2px 2px 0 rgba(0,0,0,0.5)">Ready for a Quest?</h3>
        <p>Answer 5 trivia questions to earn<br>coins and XP for your pet!</p>
        <button class="btn btn-gold btn-block" style="margin-top:16px" onclick="window._startQuest && window._startQuest()">
          ⚔️ BEGIN QUEST
        </button>
      </div>`;
      html += '</div>';
      page.innerHTML = html;
      return;
    }

    /* quest complete — show results */
    if (qp.done) {
      const pct = qp.total > 0 ? Math.round((qp.correct / qp.total) * 100) : 0;
      const trophy = pct === 100 ? '👑' : pct >= 60 ? '🏆' : '📜';
      const coins = qp.correct * 10;
      const xp = qp.correct * 15;
      html += `<div class="quest-results">
        <span class="quest-results-trophy">${trophy}</span>
        <h3>${pct === 100 ? 'PERFECT SCORE!' : pct >= 60 ? 'QUEST COMPLETE!' : 'QUEST ENDED'}</h3>
        <div class="quest-results-score">
          You got <span style="color:var(--pixel-green)">${qp.correct}</span> out of <span style="color:var(--pixel-cyan)">${qp.total}</span> correct (${pct}%)
        </div>
        <div class="quest-results-rewards">
          <div class="quest-reward-badge coins">
            <span class="val">+${coins} 🪙</span>
            <span class="lbl">COINS</span>
          </div>
          <div class="quest-reward-badge xp">
            <span class="val">+${xp} ⚡</span>
            <span class="lbl">XP</span>
          </div>
        </div>
        <button class="btn btn-gold btn-block" style="margin-top:18px" onclick="window._startQuest && window._startQuest()">
          🔄 NEW QUEST
        </button>
      </div>`;
      html += '</div>';
      page.innerHTML = html;
      return;
    }

    /* active question */
    const q = qp.questions[qp.qIdx];
    if (!q) { page.innerHTML = html + '</div>'; return; }

    const total = qp.total || qp.questions.length;
    const current = (qp.qIdx || 0) + 1;
    const pct = ((qp.qIdx || 0) / total) * 100;

    /* progress bar */
    html += `<div class="quest-progress-wrap">
      <div class="quest-progress-label">
        <span>Question ${current} of ${total}</span>
        <span>${qp.correct || 0} correct</span>
      </div>
      <div class="quest-progress-bar">
        <div class="quest-progress-fill" style="width:${pct}%"></div>
        <div class="quest-progress-pips">`;
    for (let i = 0; i < total; i++) {
      html += `<div class="quest-progress-pip"></div>`;
    }
    html += `</div></div></div>`;

    /* dialogue box */
    const qText = decodeHtml(q.question || q.text || '');
    const category = q.category || 'General';
    const difficulty = q.difficulty || 'medium';
    const diffStars = difficulty === 'easy' ? '★☆☆' : difficulty === 'hard' ? '★★★' : '★★☆';

    html += `<div class="quest-dialogue">
      <span class="quest-category">${esc(category)}</span>
      <div class="quest-question">${esc(qText)}</div>
      <div class="quest-difficulty">Difficulty: <span class="quest-difficulty-star">${diffStars}</span></div>
    </div>`;

    /* answers — build shuffled 4-option array */
    let answers = q._shuffled;
    if (!answers) {
      const correct = decodeHtml(q.correct_answer || '');
      const wrongs = (q.incorrect_answers || []).map(a => decodeHtml(a));
      answers = [...wrongs, correct].sort(() => Math.random() - 0.5);
      q._shuffled = answers;
      q._correctIdx = answers.indexOf(correct);
    }

    html += `<div class="quest-answers">`;
    answers.forEach((a, i) => {
      let cls = '';
      if (qp.answered) {
        if (i === q._correctIdx) cls = qp._chosenIdx === i ? 'correct' : 'reveal-correct';
        else if (qp._chosenIdx === i) cls = 'wrong';
        cls += ' disabled';
      }
      const label = ['A','B','C','D'][i] || '';
      html += `<button class="quest-answer-btn ${cls}" onclick="window._pqAnswer(${i})">
        <span>${label}. ${esc(a)}</span>
      </button>`;
    });
    html += `</div>`;

    /* feedback */
    if (questFeedback) {
      html += `<div class="quest-feedback fb-${questFeedback.type}">${questFeedback.msg}</div>`;
    } else {
      html += `<div class="quest-feedback"></div>`;
    }

    html += '</div>';
    page.innerHTML = html;
  }

  /* ── Quest Answer Handler ── */
  window._pqAnswer = function (idx) {
    const S = window.S;
    const qp = S.questProgress;
    if (!qp || qp.done || qp.answered) return;

    const q = qp.questions[qp.qIdx];
    if (!q || !q._shuffled) return;

    qp.answered = true;
    qp._chosenIdx = idx;
    const isCorrect = idx === q._correctIdx;

    if (isCorrect) {
      qp.correct = (qp.correct || 0) + 1;
      questFeedback = { type: 'correct', msg: rndPick(CORRECT_MSGS) };
      if (window.SFX) window.SFX.coin();
    } else {
      const correctText = q._shuffled[q._correctIdx];
      questFeedback = { type: 'wrong', msg: rndPick(WRONG_MSGS) + ' Answer: ' + correctText };
      if (window.SFX) window.SFX.error();
    }

    overrideQuest();

    /* auto-advance after delay */
    clearTimeout(feedbackTimer);
    feedbackTimer = setTimeout(() => {
      questFeedback = null;
      qp.answered = false;
      qp._chosenIdx = undefined;
      qp.qIdx = (qp.qIdx || 0) + 1;
      if (qp.qIdx >= (qp.total || qp.questions.length)) {
        qp.done = true;
        // try to call original completion handler for XP/coins
        if (window._questComplete) {
          try { window._questComplete(); } catch(e) {}
        }
      }
      overrideQuest();
    }, isCorrect ? 1200 : 2200);
  };

})();
