/* ═══════════════════════════════════════════
   PixelPaws — Battle Visual Effects Engine
   Enhanced retro animations for battles
   ═══════════════════════════════════════════ */
(function() {
  'use strict';

  // Inject CSS for battle effects
  const style = document.createElement('style');
  style.textContent = `
    /* ── Damage Numbers ── */
    @keyframes dmgFloat {
      0% { opacity: 1; transform: translate(-50%, 0) scale(1); }
      30% { transform: translate(-50%, -30px) scale(1.3); }
      100% { opacity: 0; transform: translate(-50%, -60px) scale(0.8); }
    }
    .dmg-number {
      position: absolute; font-family: 'Press Start 2P', monospace;
      font-size: 18px; font-weight: bold; z-index: 100;
      animation: dmgFloat 0.9s ease-out forwards;
      text-shadow: 2px 2px 0 rgba(0,0,0,0.8), -1px -1px 0 rgba(0,0,0,0.5);
      pointer-events: none; white-space: nowrap;
    }
    .dmg-number.crit { font-size: 24px; }
    .dmg-number.heal { color: #39ff14; }
    .dmg-number.miss { color: #9b8abf; font-size: 14px; }

    /* ── Slash Effect ── */
    @keyframes slashAnim {
      0% { opacity: 0; transform: translate(-50%,-50%) rotate(-45deg) scaleX(0); }
      30% { opacity: 1; transform: translate(-50%,-50%) rotate(-45deg) scaleX(1); }
      100% { opacity: 0; transform: translate(-50%,-50%) rotate(-45deg) scaleX(1.5); }
    }
    .slash-fx {
      position: absolute; width: 80px; height: 6px; z-index: 99;
      background: linear-gradient(90deg, transparent, #fff, var(--pixel-yellow), transparent);
      animation: slashAnim 0.35s ease-out forwards;
      pointer-events: none; border-radius: 3px;
      box-shadow: 0 0 12px var(--pixel-yellow), 0 0 24px rgba(255,215,0,0.3);
    }

    /* ── Shield Effect ── */
    @keyframes shieldPulse {
      0% { opacity: 0; transform: translate(-50%,-50%) scale(0.5); }
      30% { opacity: 0.8; transform: translate(-50%,-50%) scale(1); }
      100% { opacity: 0; transform: translate(-50%,-50%) scale(1.3); }
    }
    .shield-fx {
      position: absolute; width: 70px; height: 70px; z-index: 99;
      border: 4px solid var(--pixel-cyan); border-radius: 50%;
      animation: shieldPulse 0.5s ease-out forwards;
      pointer-events: none;
      box-shadow: 0 0 20px rgba(0,245,255,0.4), inset 0 0 20px rgba(0,245,255,0.1);
    }

    /* ── Special Attack Burst ── */
    @keyframes burstAnim {
      0% { opacity: 0; transform: translate(-50%,-50%) scale(0); }
      40% { opacity: 1; transform: translate(-50%,-50%) scale(1.2); }
      100% { opacity: 0; transform: translate(-50%,-50%) scale(2); }
    }
    .burst-fx {
      position: absolute; width: 90px; height: 90px; z-index: 99;
      border-radius: 50%; pointer-events: none;
      background: radial-gradient(circle, var(--pixel-purple), var(--pixel-pink), transparent 70%);
      animation: burstAnim 0.6s ease-out forwards;
      box-shadow: 0 0 30px rgba(191,90,242,0.5);
    }

    /* ── Hit Flash ── */
    @keyframes hitFlash {
      0%, 100% { opacity: 1; filter: none; }
      25% { opacity: 0.3; filter: brightness(3); }
      50% { opacity: 1; filter: brightness(2); }
      75% { opacity: 0.5; filter: brightness(3); }
    }
    .hit-flash { animation: hitFlash 0.3s ease; }

    /* ── Victory Sparkles ── */
    @keyframes sparkle {
      0% { opacity: 0; transform: translate(var(--sx), var(--sy)) scale(0); }
      50% { opacity: 1; transform: translate(var(--sx), calc(var(--sy) - 30px)) scale(1); }
      100% { opacity: 0; transform: translate(var(--sx), calc(var(--sy) - 60px)) scale(0.5); }
    }
    .sparkle-fx {
      position: absolute; font-size: 16px; z-index: 99;
      animation: sparkle 0.8s ease-out forwards;
      pointer-events: none;
    }

    /* ── Screen Flash ── */
    @keyframes screenFlash {
      0% { opacity: 0.6; } 100% { opacity: 0; }
    }
    .screen-flash {
      position: fixed; inset: 0; z-index: 200; pointer-events: none;
      animation: screenFlash 0.3s ease-out forwards;
    }

    /* ── Improved Screen Shake ── */
    @keyframes battleShake {
      0%, 100% { transform: translate(0); }
      10% { transform: translate(-4px, 3px); }
      20% { transform: translate(4px, -2px); }
      30% { transform: translate(-3px, -3px); }
      40% { transform: translate(3px, 2px); }
      50% { transform: translate(-2px, 4px); }
      60% { transform: translate(2px, -4px); }
      70% { transform: translate(-4px, 1px); }
      80% { transform: translate(3px, -1px); }
      90% { transform: translate(-1px, 2px); }
    }
    .battle-shake { animation: battleShake 0.5s ease; }

    /* ── HP Bar Glow on damage ── */
    @keyframes hpGlow {
      0%, 100% { box-shadow: none; }
      50% { box-shadow: 0 0 8px var(--pixel-red), inset 0 0 4px rgba(255,71,87,0.3); }
    }
    .hp-damage-glow { animation: hpGlow 0.4s ease; }

    /* ── Pixelated explosion particles ── */
    @keyframes particleExplode {
      0% { opacity: 1; transform: translate(0,0) scale(1); }
      100% { opacity: 0; transform: translate(var(--px), var(--py)) scale(0); }
    }
    .pixel-particle {
      position: absolute; width: 6px; height: 6px; z-index: 99;
      image-rendering: pixelated; pointer-events: none;
      animation: particleExplode 0.6s ease-out forwards;
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

  const BattleFX = {
    // Show floating damage number near a target element
    damageNumber(targetEl, amount, type) {
      const center = getCenter(targetEl);
      const colors = { normal: '#ff4757', crit: '#ffd700', heal: '#39ff14', miss: '#9b8abf' };
      const text = type === 'miss' ? 'MISS!' : type === 'heal' ? `+${amount}` : `-${amount}`;
      const el = tempEl('div', `dmg-number ${type || ''}`, document.body, {
        left: (center.x + (Math.random() * 30 - 15)) + 'px',
        top: (center.y - 20) + 'px',
        color: colors[type] || colors.normal
      }, 1000);
      el.textContent = text;
    },

    // Slash line effect across a target
    slash(targetEl) {
      const center = getCenter(targetEl);
      tempEl('div', 'slash-fx', document.body, {
        left: center.x + 'px',
        top: center.y + 'px'
      }, 400);
    },

    // Shield bubble around defender
    shield(targetEl) {
      const center = getCenter(targetEl);
      tempEl('div', 'shield-fx', document.body, {
        left: center.x + 'px',
        top: center.y + 'px'
      }, 600);
    },

    // Energy burst for special attacks
    burst(targetEl) {
      const center = getCenter(targetEl);
      tempEl('div', 'burst-fx', document.body, {
        left: center.x + 'px',
        top: center.y + 'px'
      }, 700);
    },

    // Flash the target sprite (hit feedback)
    hitFlash(targetEl) {
      if (!targetEl) return;
      targetEl.classList.add('hit-flash');
      setTimeout(() => targetEl.classList.remove('hit-flash'), 350);
    },

    // Shake the page element
    shake(el) {
      const target = el || document.getElementById('app');
      if (!target) return;
      target.classList.add('battle-shake');
      setTimeout(() => target.classList.remove('battle-shake'), 500);
    },

    // Full-screen color flash
    screenFlash(color) {
      tempEl('div', 'screen-flash', document.body, {
        backgroundColor: color || 'rgba(255,255,255,0.5)'
      }, 350);
    },

    // HP bar glow effect
    hpGlow(barEl) {
      if (!barEl) return;
      barEl.classList.add('hp-damage-glow');
      setTimeout(() => barEl.classList.remove('hp-damage-glow'), 450);
    },

    // Pixel particles explosion
    particles(targetEl, count, color) {
      const center = getCenter(targetEl);
      const colors = color ? [color] : ['#ff4757','#ffd700','#ff6eb4','#00f5ff','#39ff14'];
      for (let i = 0; i < (count || 8); i++) {
        const angle = (Math.PI * 2 / (count || 8)) * i;
        const dist = 30 + Math.random() * 40;
        tempEl('div', 'pixel-particle', document.body, {
          left: center.x + 'px',
          top: center.y + 'px',
          backgroundColor: colors[i % colors.length],
          '--px': Math.cos(angle) * dist + 'px',
          '--py': Math.sin(angle) * dist + 'px'
        }, 700);
      }
    },

    // Victory sparkles around target
    sparkles(targetEl) {
      const center = getCenter(targetEl);
      const sparks = ['✨','⭐','💫','🌟','✨'];
      sparks.forEach((s, i) => {
        const el = tempEl('div', 'sparkle-fx', document.body, {
          left: center.x + 'px',
          top: center.y + 'px',
          '--sx': (Math.random() * 60 - 30) + 'px',
          '--sy': (Math.random() * -20) + 'px',
          animationDelay: (i * 0.15) + 's'
        }, 1200);
        el.textContent = s;
      });
    },

    // Combined attack sequence (call this for a full attack animation)
    async attackSequence(attackerEl, defenderEl, damage, isCrit) {
      // 1. Attacker lunges
      if (attackerEl) {
        const sprite = attackerEl.querySelector('.pet-sprite-img') || attackerEl;
        sprite.classList.add('attack');
        setTimeout(() => sprite.classList.remove('attack'), 500);
      }
      // 2. After lunge, show effects on defender
      await new Promise(r => setTimeout(r, 250));
      this.slash(defenderEl);
      this.hitFlash(defenderEl);
      this.shake();
      if (isCrit) {
        this.screenFlash('rgba(255,215,0,0.3)');
        this.particles(defenderEl, 12);
      } else {
        this.particles(defenderEl, 6);
      }
      // 3. Show damage number
      await new Promise(r => setTimeout(r, 100));
      this.damageNumber(defenderEl, damage, isCrit ? 'crit' : 'normal');
      // 4. Defender hurt animation
      if (defenderEl) {
        const dSprite = defenderEl.querySelector('.pet-sprite-img') || defenderEl;
        dSprite.classList.add('hurt');
        setTimeout(() => dSprite.classList.remove('hurt'), 400);
      }
    },

    // Special attack sequence
    async specialSequence(attackerEl, defenderEl, damage) {
      this.screenFlash('rgba(191,90,242,0.3)');
      await new Promise(r => setTimeout(r, 150));
      this.burst(defenderEl);
      this.shake();
      await new Promise(r => setTimeout(r, 300));
      this.particles(defenderEl, 16, null);
      this.damageNumber(defenderEl, damage, 'crit');
      this.hitFlash(defenderEl);
    },

    // Defend sequence
    defendSequence(defenderEl) {
      this.shield(defenderEl);
    },

    // Victory sequence
    victorySequence(winnerEl) {
      this.sparkles(winnerEl);
      this.screenFlash('rgba(57,255,20,0.15)');
      setTimeout(() => this.sparkles(winnerEl), 500);
    },

    // Defeat sequence
    defeatSequence(loserEl) {
      this.screenFlash('rgba(255,71,87,0.2)');
      this.particles(loserEl, 10, '#ff4757');
    }
  };

  window.BattleFX = BattleFX;
})();
