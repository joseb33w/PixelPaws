/* ═══════════════════════════════════════════
   PixelPaws — Battle Visual Effects Engine
   Enhanced retro animations for battles
   ═══════════════════════════════════════════ */
(function() {
  'use strict';

  // Inject CSS for battle effects
  const style = document.createElement('style');
  style.textContent = `
    /* —— Damage Numbers —— */
    @keyframes dmgFloat {
      0% { opacity: 1; transform: translate(-50%, 0) scale(1); }
      15% { transform: translate(-50%, -20px) scale(1.5); }
      30% { transform: translate(-50%, -35px) scale(1.3); }
      100% { opacity: 0; transform: translate(-50%, -70px) scale(0.7); }
    }
    .dmg-number {
      position: absolute; font-family: 'Press Start 2P', monospace;
      font-size: 18px; font-weight: bold; z-index: 100;
      animation: dmgFloat 1.1s ease-out forwards;
      text-shadow: 2px 2px 0 rgba(0,0,0,0.9), -1px -1px 0 rgba(0,0,0,0.6), 0 0 8px currentColor;
      pointer-events: none; white-space: nowrap;
    }
    .dmg-number.crit { font-size: 28px; animation-duration: 1.3s; }
    .dmg-number.heal { color: #39ff14; }
    .dmg-number.miss { color: #9b8abf; font-size: 14px; }
    .dmg-number.super { color: #ffd700; font-size: 32px; }

    /* —— Slash Effect —— */
    @keyframes slashAnim {
      0% { opacity: 0; transform: translate(-50%,-50%) rotate(-45deg) scaleX(0); }
      20% { opacity: 1; transform: translate(-50%,-50%) rotate(-45deg) scaleX(1); }
      60% { opacity: 0.8; transform: translate(-50%,-50%) rotate(-45deg) scaleX(1.3); }
      100% { opacity: 0; transform: translate(-50%,-50%) rotate(-45deg) scaleX(1.8); }
    }
    .slash-fx {
      position: absolute; width: 100px; height: 8px; z-index: 99;
      background: linear-gradient(90deg, transparent, #fff, var(--pixel-yellow), #fff, transparent);
      animation: slashAnim 0.4s ease-out forwards;
      pointer-events: none; border-radius: 4px;
      box-shadow: 0 0 16px var(--pixel-yellow), 0 0 32px rgba(255,215,0,0.4);
    }

    /* —— Double Slash (X pattern) —— */
    .slash-fx.slash-x {
      animation-delay: 0.1s;
      transform: translate(-50%,-50%) rotate(45deg) scaleX(0);
    }
    @keyframes slashAnimX {
      0% { opacity: 0; transform: translate(-50%,-50%) rotate(45deg) scaleX(0); }
      20% { opacity: 1; transform: translate(-50%,-50%) rotate(45deg) scaleX(1); }
      60% { opacity: 0.8; transform: translate(-50%,-50%) rotate(45deg) scaleX(1.3); }
      100% { opacity: 0; transform: translate(-50%,-50%) rotate(45deg) scaleX(1.8); }
    }
    .slash-fx.slash-x { animation: slashAnimX 0.4s ease-out 0.08s forwards; }

    /* —— Shield Effect —— */
    @keyframes shieldPulse {
      0% { opacity: 0; transform: translate(-50%,-50%) scale(0.3); }
      20% { opacity: 0.9; transform: translate(-50%,-50%) scale(1.1); }
      50% { opacity: 0.7; transform: translate(-50%,-50%) scale(1); border-width: 6px; }
      100% { opacity: 0; transform: translate(-50%,-50%) scale(1.4); }
    }
    .shield-fx {
      position: absolute; width: 80px; height: 80px; z-index: 99;
      border: 4px solid var(--pixel-cyan); border-radius: 50%;
      animation: shieldPulse 0.6s ease-out forwards;
      pointer-events: none;
      box-shadow: 0 0 24px rgba(0,245,255,0.5), inset 0 0 24px rgba(0,245,255,0.15);
      background: radial-gradient(circle, rgba(0,245,255,0.08), transparent 70%);
    }

    /* —— Special Attack Burst —— */
    @keyframes burstAnim {
      0% { opacity: 0; transform: translate(-50%,-50%) scale(0) rotate(0deg); }
      30% { opacity: 1; transform: translate(-50%,-50%) scale(1.3) rotate(90deg); }
      60% { opacity: 0.7; transform: translate(-50%,-50%) scale(1.8) rotate(180deg); }
      100% { opacity: 0; transform: translate(-50%,-50%) scale(2.5) rotate(270deg); }
    }
    .burst-fx {
      position: absolute; width: 100px; height: 100px; z-index: 99;
      border-radius: 50%; pointer-events: none;
      background: radial-gradient(circle, rgba(255,255,255,0.3), var(--pixel-purple), var(--pixel-pink), transparent 70%);
      animation: burstAnim 0.7s ease-out forwards;
      box-shadow: 0 0 40px rgba(191,90,242,0.6), 0 0 80px rgba(255,110,180,0.3);
    }

    /* —— Energy Charge Ring —— */
    @keyframes chargeRing {
      0% { opacity: 0; transform: translate(-50%,-50%) scale(2) rotate(0deg); border-width: 1px; }
      50% { opacity: 1; transform: translate(-50%,-50%) scale(0.8) rotate(180deg); border-width: 4px; }
      100% { opacity: 0; transform: translate(-50%,-50%) scale(0.3) rotate(360deg); border-width: 8px; }
    }
    .charge-ring-fx {
      position: absolute; width: 90px; height: 90px; z-index: 98;
      border: 2px solid var(--pixel-yellow); border-radius: 50%;
      animation: chargeRing 0.5s ease-in forwards;
      pointer-events: none;
      box-shadow: 0 0 20px rgba(255,215,0,0.3);
    }

    /* —— Hit Flash —— */
    @keyframes hitFlash {
      0%, 100% { opacity: 1; filter: none; }
      15% { opacity: 0.2; filter: brightness(4) saturate(0); }
      30% { opacity: 1; filter: brightness(2.5); }
      45% { opacity: 0.3; filter: brightness(4) saturate(0); }
      60% { opacity: 1; filter: brightness(2); }
      75% { opacity: 0.5; filter: brightness(3); }
    }
    .hit-flash { animation: hitFlash 0.4s ease; }

    /* —— Victory Sparkles —— */
    @keyframes sparkle {
      0% { opacity: 0; transform: translate(var(--sx), var(--sy)) scale(0) rotate(0deg); }
      40% { opacity: 1; transform: translate(var(--sx), calc(var(--sy) - 25px)) scale(1.2) rotate(180deg); }
      100% { opacity: 0; transform: translate(var(--sx), calc(var(--sy) - 70px)) scale(0.3) rotate(360deg); }
    }
    .sparkle-fx {
      position: absolute; font-size: 18px; z-index: 99;
      animation: sparkle 1s ease-out forwards;
      pointer-events: none;
    }

    /* —— Screen Flash —— */
    @keyframes screenFlash {
      0% { opacity: 0.7; } 100% { opacity: 0; }
    }
    .screen-flash {
      position: fixed; inset: 0; z-index: 200; pointer-events: none;
      animation: screenFlash 0.35s ease-out forwards;
    }

    /* —— Improved Screen Shake —— */
    @keyframes battleShake {
      0%, 100% { transform: translate(0); }
      8% { transform: translate(-6px, 4px); }
      16% { transform: translate(6px, -3px); }
      24% { transform: translate(-5px, -4px); }
      32% { transform: translate(5px, 3px); }
      40% { transform: translate(-3px, 5px); }
      48% { transform: translate(3px, -5px); }
      56% { transform: translate(-5px, 2px); }
      64% { transform: translate(4px, -2px); }
      72% { transform: translate(-2px, 3px); }
      80% { transform: translate(2px, -1px); }
      90% { transform: translate(-1px, 1px); }
    }
    .battle-shake { animation: battleShake 0.6s ease; }

    /* Heavy shake for crits/specials */
    @keyframes battleShakeHeavy {
      0%, 100% { transform: translate(0); }
      5% { transform: translate(-10px, 6px) rotate(-1deg); }
      10% { transform: translate(10px, -5px) rotate(1deg); }
      15% { transform: translate(-8px, -6px) rotate(-0.5deg); }
      20% { transform: translate(8px, 5px) rotate(0.5deg); }
      30% { transform: translate(-6px, 4px); }
      40% { transform: translate(6px, -4px); }
      50% { transform: translate(-4px, 3px); }
      60% { transform: translate(3px, -2px); }
      70% { transform: translate(-2px, 2px); }
      80% { transform: translate(1px, -1px); }
    }
    .battle-shake-heavy { animation: battleShakeHeavy 0.8s ease; }

    /* —— HP Bar Glow on damage —— */
    @keyframes hpGlow {
      0%, 100% { box-shadow: none; }
      25% { box-shadow: 0 0 12px var(--pixel-red), inset 0 0 6px rgba(255,71,87,0.4); }
      50% { box-shadow: 0 0 8px var(--pixel-red), inset 0 0 4px rgba(255,71,87,0.3); }
      75% { box-shadow: 0 0 12px var(--pixel-red), inset 0 0 6px rgba(255,71,87,0.4); }
    }
    .hp-damage-glow { animation: hpGlow 0.5s ease; }

    /* —— Pixelated explosion particles —— */
    @keyframes particleExplode {
      0% { opacity: 1; transform: translate(0,0) scale(1); }
      50% { opacity: 0.8; }
      100% { opacity: 0; transform: translate(var(--px), var(--py)) scale(0); }
    }
    .pixel-particle {
      position: absolute; width: 6px; height: 6px; z-index: 99;
      image-rendering: pixelated; pointer-events: none;
      animation: particleExplode 0.7s ease-out forwards;
    }

    /* —— Elemental effects —— */
    @keyframes fireTrail {
      0% { opacity: 1; transform: translate(-50%,-50%) scale(1); filter: hue-rotate(0deg); }
      50% { opacity: 0.8; transform: translate(-50%, calc(-50% - 15px)) scale(1.2); filter: hue-rotate(20deg); }
      100% { opacity: 0; transform: translate(-50%, calc(-50% - 40px)) scale(0.5); filter: hue-rotate(40deg); }
    }
    .fire-fx {
      position: absolute; font-size: 28px; z-index: 99; pointer-events: none;
      animation: fireTrail 0.6s ease-out forwards;
    }

    @keyframes iceShatter {
      0% { opacity: 1; transform: translate(-50%,-50%) scale(0.5); }
      30% { opacity: 1; transform: translate(-50%,-50%) scale(1.2); }
      100% { opacity: 0; transform: translate(-50%,-50%) scale(2); filter: blur(4px); }
    }
    .ice-fx {
      position: absolute; width: 70px; height: 70px; z-index: 99; pointer-events: none;
      background: radial-gradient(circle, rgba(0,245,255,0.4), rgba(0,245,255,0.1), transparent 70%);
      border: 2px solid rgba(0,245,255,0.5); border-radius: 30% 70% 70% 30% / 30% 30% 70% 70%;
      animation: iceShatter 0.5s ease-out forwards;
      box-shadow: 0 0 20px rgba(0,245,255,0.4);
    }

    @keyframes thunderStrike {
      0% { opacity: 0; transform: translate(-50%, -100px) scaleY(0); }
      10% { opacity: 1; transform: translate(-50%, 0) scaleY(1); }
      30% { opacity: 1; }
      100% { opacity: 0; }
    }
    .thunder-fx {
      position: absolute; width: 6px; height: 80px; z-index: 99; pointer-events: none;
      background: linear-gradient(180deg, transparent, #ffd700, #fff, #ffd700, transparent);
      animation: thunderStrike 0.4s ease-out forwards;
      box-shadow: 0 0 20px rgba(255,215,0,0.6), 0 0 40px rgba(255,215,0,0.3);
    }

    /* —— Impact ring for heavy hits —— */
    @keyframes impactRing {
      0% { opacity: 1; transform: translate(-50%,-50%) scale(0); border-width: 6px; }
      50% { opacity: 0.6; transform: translate(-50%,-50%) scale(1); border-width: 3px; }
      100% { opacity: 0; transform: translate(-50%,-50%) scale(2); border-width: 1px; }
    }
    .impact-ring-fx {
      position: absolute; width: 60px; height: 60px; z-index: 99;
      border: 4px solid #fff; border-radius: 50%;
      animation: impactRing 0.5s ease-out forwards;
      pointer-events: none;
    }

    /* —— Combo counter —— */
    @keyframes comboPopIn {
      0% { opacity: 0; transform: translate(-50%, -50%) scale(0) rotate(-20deg); }
      40% { opacity: 1; transform: translate(-50%, -50%) scale(1.3) rotate(5deg); }
      60% { transform: translate(-50%, -50%) scale(0.95) rotate(-2deg); }
      100% { opacity: 1; transform: translate(-50%, -50%) scale(1) rotate(0deg); }
    }
    @keyframes comboGlow {
      0%, 100% { text-shadow: 2px 2px 0 rgba(0,0,0,0.8), 0 0 10px var(--pixel-yellow); }
      50% { text-shadow: 2px 2px 0 rgba(0,0,0,0.8), 0 0 25px var(--pixel-yellow), 0 0 50px rgba(255,215,0,0.4); }
    }
    .combo-counter {
      position: absolute; font-family: 'Press Start 2P', monospace;
      font-size: 14px; color: var(--pixel-yellow); z-index: 100;
      animation: comboPopIn 0.4s ease-out forwards, comboGlow 1s ease infinite 0.4s;
      pointer-events: none;
    }

    /* —— Energy wave (ground effect) —— */
    @keyframes energyWave {
      0% { opacity: 0.8; transform: translate(-50%, 0) scaleX(0.2) scaleY(1); }
      100% { opacity: 0; transform: translate(-50%, 0) scaleX(3) scaleY(0.3); }
    }
    .energy-wave-fx {
      position: absolute; width: 80px; height: 20px; z-index: 98;
      background: radial-gradient(ellipse, var(--pixel-purple), transparent 70%);
      animation: energyWave 0.6s ease-out forwards;
      pointer-events: none; border-radius: 50%;
    }
  `;
  document.head.appendChild(style);

  // Utility: find an element's center coords
  function getCenter(el) {
    if (!el) return { x: window.innerWidth / 2, y: window.innerHeight / 2 };
    const r = el.getBoundingClientRect();
    return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
  }

  // Utility: append temp element, auto-remove
  function tempEl(tag, cls, parentEl, style, duration) {
    const el = document.createElement(tag);
    el.className = cls;
    if (style) Object.assign(el.style, style);
    (parentEl || document.body).appendChild(el);
    setTimeout(() => el.remove(), duration || 1000);
    return el;
  }

  // Combo tracking
  let comboCount = 0;
  let comboTimeout = null;

  const BattleFX = {
    // Show floating damage number near a target element
    damageNumber(targetEl, amount, type) {
      const center = getCenter(targetEl);
      const colors = { normal: '#ff4757', crit: '#ffd700', heal: '#39ff14', miss: '#9b8abf', super: '#ff6eb4' };
      const text = type === 'miss' ? 'MISS!' : type === 'heal' ? `+${amount}` : `-${amount}`;
      const el = tempEl('div', `dmg-number ${type || ''}`, document.body, {
        left: (center.x + (Math.random() * 40 - 20)) + 'px',
        top: (center.y - 20) + 'px',
        color: colors[type] || colors.normal
      }, 1200);
      el.textContent = text;
    },

    // Slash line effect across a target
    slash(targetEl) {
      const center = getCenter(targetEl);
      tempEl('div', 'slash-fx', document.body, {
        left: center.x + 'px',
        top: center.y + 'px'
      }, 500);
    },

    // Double X slash for crits
    doubleSlash(targetEl) {
      const center = getCenter(targetEl);
      tempEl('div', 'slash-fx', document.body, {
        left: center.x + 'px',
        top: center.y + 'px'
      }, 500);
      tempEl('div', 'slash-fx slash-x', document.body, {
        left: center.x + 'px',
        top: center.y + 'px'
      }, 600);
    },

    // Shield bubble around defender
    shield(targetEl) {
      const center = getCenter(targetEl);
      tempEl('div', 'shield-fx', document.body, {
        left: center.x + 'px',
        top: center.y + 'px'
      }, 700);
    },

    // Energy burst for special attacks
    burst(targetEl) {
      const center = getCenter(targetEl);
      tempEl('div', 'burst-fx', document.body, {
        left: center.x + 'px',
        top: center.y + 'px'
      }, 800);
    },

    // Impact ring for heavy hits
    impactRing(targetEl, color) {
      const center = getCenter(targetEl);
      tempEl('div', 'impact-ring-fx', document.body, {
        left: center.x + 'px',
        top: center.y + 'px',
        borderColor: color || '#fff'
      }, 600);
    },

    // Energy charge ring (sucking in before attack)
    chargeRing(targetEl) {
      const center = getCenter(targetEl);
      tempEl('div', 'charge-ring-fx', document.body, {
        left: center.x + 'px',
        top: center.y + 'px'
      }, 600);
    },

    // Elemental attacks
    fireAttack(targetEl) {
      const center = getCenter(targetEl);
      const flames = ['🔥','🔥','💥','🔥','💫'];
      flames.forEach((f, i) => {
        const el = tempEl('div', 'fire-fx', document.body, {
          left: (center.x + (Math.random()*50-25)) + 'px',
          top: (center.y + (Math.random()*30-15)) + 'px',
          animationDelay: (i*0.08) + 's'
        }, 800);
        el.textContent = f;
      });
    },

    iceAttack(targetEl) {
      const center = getCenter(targetEl);
      tempEl('div', 'ice-fx', document.body, {
        left: center.x + 'px',
        top: center.y + 'px'
      }, 600);
      // Ice crystal particles
      for(let i=0; i<6; i++) {
        const angle = (Math.PI*2/6)*i;
        const dist = 25+Math.random()*20;
        tempEl('div', 'pixel-particle', document.body, {
          left: center.x + 'px',
          top: center.y + 'px',
          backgroundColor: i%2 ? '#00f5ff' : '#b0f0ff',
          '--px': Math.cos(angle)*dist + 'px',
          '--py': Math.sin(angle)*dist + 'px',
          width: '4px', height: '8px'
        }, 700);
      }
    },

    thunderAttack(targetEl) {
      const center = getCenter(targetEl);
      for(let i=0; i<3; i++) {
        tempEl('div', 'thunder-fx', document.body, {
          left: (center.x + (i-1)*15) + 'px',
          top: center.y + 'px',
          animationDelay: (i*0.1) + 's',
          transform: `translate(-50%, -40px) rotate(${(Math.random()*20-10)}deg)`
        }, 500);
      }
      this.screenFlash('rgba(255,215,0,0.4)');
    },

    // Energy wave
    energyWave(targetEl) {
      const center = getCenter(targetEl);
      tempEl('div', 'energy-wave-fx', document.body, {
        left: center.x + 'px',
        top: (center.y + 30) + 'px'
      }, 700);
    },

    // Flash the target sprite (hit feedback)
    hitFlash(targetEl) {
      if (!targetEl) return;
      targetEl.classList.add('hit-flash');
      setTimeout(() => targetEl.classList.remove('hit-flash'), 450);
    },

    // Shake the page element
    shake(el, heavy) {
      const target = el || document.getElementById('app');
      if (!target) return;
      const cls = heavy ? 'battle-shake-heavy' : 'battle-shake';
      target.classList.remove('battle-shake', 'battle-shake-heavy');
      void target.offsetWidth; // force reflow
      target.classList.add(cls);
      setTimeout(() => target.classList.remove(cls), heavy ? 800 : 600);
    },

    // Full-screen color flash
    screenFlash(color) {
      tempEl('div', 'screen-flash', document.body, {
        backgroundColor: color || 'rgba(255,255,255,0.5)'
      }, 400);
    },

    // HP bar glow effect
    hpGlow(barEl) {
      if (!barEl) return;
      barEl.classList.remove('hp-damage-glow');
      void barEl.offsetWidth;
      barEl.classList.add('hp-damage-glow');
      setTimeout(() => barEl.classList.remove('hp-damage-glow'), 550);
    },

    // Pixel particles explosion
    particles(targetEl, count, color) {
      const center = getCenter(targetEl);
      const colors = color ? [color] : ['#ff4757','#ffd700','#ff6eb4','#00f5ff','#39ff14'];
      for (let i = 0; i < (count || 8); i++) {
        const angle = (Math.PI * 2 / (count || 8)) * i + Math.random()*0.5;
        const dist = 30 + Math.random() * 50;
        tempEl('div', 'pixel-particle', document.body, {
          left: center.x + 'px',
          top: center.y + 'px',
          backgroundColor: colors[i % colors.length],
          '--px': Math.cos(angle) * dist + 'px',
          '--py': Math.sin(angle) * dist + 'px',
          width: (4+Math.random()*4) + 'px',
          height: (4+Math.random()*4) + 'px'
        }, 800);
      }
    },

    // Victory sparkles around target
    sparkles(targetEl) {
      const center = getCenter(targetEl);
      const sparks = ['✨','⭐','🌟','💫','✨','🎆','⭐','💥'];
      sparks.forEach((s, i) => {
        const el = tempEl('div', 'sparkle-fx', document.body, {
          left: center.x + 'px',
          top: center.y + 'px',
          '--sx': (Math.random() * 80 - 40) + 'px',
          '--sy': (Math.random() * -30) + 'px',
          animationDelay: (i * 0.12) + 's'
        }, 1400);
        el.textContent = s;
      });
    },

    // Combo counter display
    showCombo(targetEl) {
      comboCount++;
      clearTimeout(comboTimeout);
      comboTimeout = setTimeout(() => { comboCount = 0; }, 3000);

      if (comboCount < 2) return;

      // Remove old combo counter
      document.querySelectorAll('.combo-counter').forEach(el => el.remove());

      const center = getCenter(targetEl);
      const el = tempEl('div', 'combo-counter', document.body, {
        left: center.x + 'px',
        top: (center.y - 50) + 'px'
      }, 2500);
      el.textContent = `${comboCount}x COMBO!`;

      if (comboCount >= 3) {
        this.screenFlash('rgba(255,215,0,0.15)');
      }
    },

    // Combined attack sequence (call this for a full attack animation)
    async attackSequence(attackerEl, defenderEl, damage, isCrit) {
      // Increment combo
      this.showCombo(defenderEl);

      // 1. Attacker lunges
      if (attackerEl) {
        const sprite = attackerEl.querySelector?.('.pet-sprite-img') || attackerEl;
        sprite.classList.add('attack');
        setTimeout(() => sprite.classList.remove('attack'), 500);
      }

      // 2. After short delay, effects on defender
      await new Promise(r => setTimeout(r, 150));

      if (isCrit) {
        this.doubleSlash(defenderEl);
        this.screenFlash('rgba(255,215,0,0.35)');
        this.shake(null, true);
        this.impactRing(defenderEl, '#ffd700');
        await new Promise(r => setTimeout(r, 100));
        this.particles(defenderEl, 12);
        this.damageNumber(defenderEl, damage, 'crit');
        if (window.SFX) window.SFX.crit();
      } else {
        this.slash(defenderEl);
        this.shake();
        this.impactRing(defenderEl);
        await new Promise(r => setTimeout(r, 80));
        this.particles(defenderEl, 6);
        this.damageNumber(defenderEl, damage, 'normal');
        if (window.SFX) window.SFX.hit();
      }

      // 3. Hit flash on defender
      const defSprite = defenderEl?.querySelector?.('.pet-sprite-img') || defenderEl;
      this.hitFlash(defSprite);
      if (defSprite) {
        defSprite.classList.add('hurt');
        setTimeout(() => defSprite.classList.remove('hurt'), 400);
      }
    },

    // Defend sequence
    async defendSequence(defenderEl) {
      this.shield(defenderEl);
      this.chargeRing(defenderEl);
      if (window.SFX) window.SFX.defend();
      await new Promise(r => setTimeout(r, 200));
      this.damageNumber(defenderEl, 0, 'miss');
    },

    // Special attack sequence
    async specialSequence(attackerEl, defenderEl, damage) {
      // Reset combo for special
      comboCount = 0;

      // 1. Charge up
      this.chargeRing(attackerEl);
      this.energyWave(attackerEl);
      if (window.SFX) window.SFX.special();
      await new Promise(r => setTimeout(r, 300));

      // 2. Burst on attacker (power up)
      this.burst(attackerEl);
      this.screenFlash('rgba(191,90,242,0.3)');
      await new Promise(r => setTimeout(r, 200));

      // 3. Random elemental effect on defender
      const elements = ['fire', 'ice', 'thunder'];
      const elem = elements[Math.floor(Math.random() * elements.length)];
      switch(elem) {
        case 'fire': this.fireAttack(defenderEl); break;
        case 'ice': this.iceAttack(defenderEl); break;
        case 'thunder': this.thunderAttack(defenderEl); break;
      }

      this.shake(null, true);
      await new Promise(r => setTimeout(r, 150));

      // 4. Impact
      this.doubleSlash(defenderEl);
      this.impactRing(defenderEl, '#bf5af2');
      this.particles(defenderEl, 14, '#bf5af2');
      this.damageNumber(defenderEl, damage, 'super');

      // 5. Hit flash
      const defSprite = defenderEl?.querySelector?.('.pet-sprite-img') || defenderEl;
      this.hitFlash(defSprite);
      if (defSprite) {
        defSprite.classList.add('hurt');
        setTimeout(() => defSprite.classList.remove('hurt'), 500);
      }
    },

    // Victory celebration
    async victorySequence(winnerEl) {
      this.sparkles(winnerEl);
      this.screenFlash('rgba(57,255,20,0.25)');
      await new Promise(r => setTimeout(r, 300));
      this.particles(winnerEl, 16, '#ffd700');
      this.sparkles(winnerEl);
      if (window.SFX) window.SFX.victory();
    },

    // Defeat sequence
    async defeatSequence(loserEl) {
      this.screenFlash('rgba(255,71,87,0.3)');
      this.shake(null, true);
      if (window.SFX) window.SFX.defeat();
    }
  };

  window.BattleFX = BattleFX;
})();
