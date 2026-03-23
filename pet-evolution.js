/* ═══════════════════════════════════════════════════════
   PixelPaws — Pet Evolution System
   Pets visually evolve at certain levels with new sprites,
   stat boosts, and special abilities.
   Monkey-patches into app without modifying app.js
   ═══════════════════════════════════════════════════════ */
(function() {
  'use strict';

  // ── Config ──
  const SUPABASE_URL = 'https://xhhmxabftbyxrirvvihn.supabase.co';
  const SUPABASE_KEY = 'sb_publishable_NZHoIxqqpSvVBP8MrLHCYA_gmg1AbN-';
  const T_PETS = 'uNMexs7BYTXQ2_pixelpaws_pets';

  let sb = null;

  // ══════════════════════════════════════
  //  EVOLUTION DEFINITIONS
  // ══════════════════════════════════════
  const EVOLUTION_MAP = {
    cat: [
      { stage: 1, name: 'Kitten',       emoji: '🐱', minLevel: 1,  statBoost: null,                              ability: null },
      { stage: 2, name: 'Shadow Cat',    emoji: '😺', minLevel: 10, statBoost: { hp: 15, attack: 5, speed: 4 },    ability: { name: 'Shadow Strike', desc: 'A sneaky critical hit with +30% crit chance', type: 'crit_boost', value: 0.30 } },
      { stage: 3, name: 'Lion King',     emoji: '🦁', minLevel: 25, statBoost: { hp: 30, attack: 10, defense: 5, speed: 6 }, ability: { name: 'Royal Roar', desc: 'Terrifying roar that reduces enemy ATK by 25%', type: 'enemy_debuff_atk', value: 0.25 } }
    ],
    dog: [
      { stage: 1, name: 'Puppy',         emoji: '🐶', minLevel: 1,  statBoost: null,                              ability: null },
      { stage: 2, name: 'Guard Dog',     emoji: '🐕', minLevel: 10, statBoost: { hp: 20, defense: 6, attack: 3 },  ability: { name: 'Loyal Guard', desc: 'Block next attack completely (once per battle)', type: 'full_block', value: 1 } },
      { stage: 3, name: 'Alpha Wolf',    emoji: '🐺', minLevel: 25, statBoost: { hp: 40, defense: 10, attack: 8, speed: 4 }, ability: { name: 'Pack Howl', desc: 'Heal 30% max HP and boost all stats by 10%', type: 'self_buff_all', value: 0.10 } }
    ],
    dragon: [
      { stage: 1, name: 'Hatchling',     emoji: '🐉', minLevel: 1,  statBoost: null,                              ability: null },
      { stage: 2, name: 'Drake',         emoji: '🐲', minLevel: 10, statBoost: { hp: 15, attack: 8, defense: 3 },  ability: { name: 'Fire Breath', desc: 'Deal bonus fire damage equal to 40% ATK', type: 'bonus_damage', value: 0.40 } },
      { stage: 3, name: 'Elder Dragon',  emoji: '🔥', minLevel: 25, statBoost: { hp: 35, attack: 15, defense: 8, speed: 5 }, ability: { name: 'Inferno', desc: 'Massive fire blast dealing 60% ATK as bonus + burn for 3 turns', type: 'bonus_damage_dot', value: 0.60 } }
    ],
    fox: [
      { stage: 1, name: 'Kit',           emoji: '🦊', minLevel: 1,  statBoost: null,                              ability: null },
      { stage: 2, name: 'Spirit Fox',    emoji: '🔶', minLevel: 10, statBoost: { hp: 10, speed: 7, attack: 4 },    ability: { name: 'Illusion', desc: '30% chance to dodge any attack completely', type: 'dodge_chance', value: 0.30 } },
      { stage: 3, name: 'Celestial Fox', emoji: '🌟', minLevel: 25, statBoost: { hp: 25, speed: 12, attack: 8, defense: 5 }, ability: { name: 'Starfall', desc: 'Triple strike hitting 3 times at 50% ATK each', type: 'multi_hit', value: 3 } }
    ],
    robot: [
      { stage: 1, name: 'Bot',           emoji: '🤖', minLevel: 1,  statBoost: null,                              ability: null },
      { stage: 2, name: 'Mech',          emoji: '⚙️', minLevel: 10, statBoost: { hp: 25, defense: 8, attack: 2 },  ability: { name: 'Shield Matrix', desc: 'Reduce all incoming damage by 20%', type: 'damage_reduction', value: 0.20 } },
      { stage: 3, name: 'Titan',         emoji: '🦾', minLevel: 25, statBoost: { hp: 50, defense: 15, attack: 6, speed: 3 }, ability: { name: 'Overclock', desc: 'Double ATK and SPD for 3 turns, then reboot', type: 'self_buff_temp', value: 2.0 } }
    ]
  };

  // ══════════════════════════════════════
  //  HELPER FUNCTIONS
  // ══════════════════════════════════════
  function getEvolutionStage(species, level) {
    const stages = EVOLUTION_MAP[species];
    if (!stages) return null;
    let current = stages[0];
    for (const s of stages) {
      if (level >= s.minLevel) current = s;
    }
    return current;
  }

  function getNextEvolution(species, level) {
    const stages = EVOLUTION_MAP[species];
    if (!stages) return null;
    for (const s of stages) {
      if (level < s.minLevel) return s;
    }
    return null; // fully evolved
  }

  function getEvolvedEmoji(species, level) {
    const stage = getEvolutionStage(species, level);
    return stage ? stage.emoji : null;
  }

  function getAllStages(species) {
    return EVOLUTION_MAP[species] || [];
  }

  // LocalStorage tracking for evolution popups
  function getEvoState() {
    try { return JSON.parse(localStorage.getItem('pp_evo_state') || '{}'); } catch(e) { return {}; }
  }
  function setEvoState(state) {
    localStorage.setItem('pp_evo_state', JSON.stringify(state));
  }
  function hasSeenEvolution(petId, stage) {
    const state = getEvoState();
    return state[petId + '_' + stage] === true;
  }
  function markEvolutionSeen(petId, stage) {
    const state = getEvoState();
    state[petId + '_' + stage] = true;
    setEvoState(state);
  }

  // ══════════════════════════════════════
  //  INJECT CSS
  // ══════════════════════════════════════
  const style = document.createElement('style');
  style.textContent = `

/* ── Evolution Overlay ── */
.evo-overlay {
  position: fixed; inset: 0; z-index: 600;
  background: rgba(0,0,0,0.85);
  display: flex; align-items: center; justify-content: center;
  animation: evoFadeIn 0.4s ease;
  padding: 16px;
}
@keyframes evoFadeIn {
  from { opacity: 0; } to { opacity: 1; }
}

.evo-popup {
  background: var(--panel, #231735);
  border: 3px solid var(--pixel-yellow, #ffd700);
  box-shadow: 6px 6px 0 rgba(0,0,0,0.5), 0 0 60px rgba(255,215,0,0.25);
  padding: 28px 22px; width: min(380px, 92vw);
  text-align: center; position: relative;
  animation: evoPopIn 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
}
@keyframes evoPopIn {
  from { transform: scale(0.3) translateY(40px); opacity: 0; }
  to   { transform: scale(1) translateY(0); opacity: 1; }
}

.evo-title {
  font-family: var(--font-pixel, 'Press Start 2P', monospace);
  font-size: 11px; color: var(--pixel-yellow, #ffd700);
  text-shadow: 2px 2px 0 rgba(0,0,0,0.6);
  margin-bottom: 4px; text-transform: uppercase;
  letter-spacing: 1px;
}
.evo-subtitle {
  font-family: var(--font-pixel, 'Press Start 2P', monospace);
  font-size: 7px; color: var(--text-dim, #9b8abf);
  margin-bottom: 18px; line-height: 1.8;
}

/* Transformation animation area */
.evo-transform {
  position: relative; height: 120px;
  display: flex; align-items: center; justify-content: center;
  margin-bottom: 16px;
}
.evo-old-sprite, .evo-new-sprite {
  font-size: 64px; position: absolute;
  filter: drop-shadow(0 4px 0 rgba(0,0,0,0.5));
}
.evo-old-sprite {
  animation: evoOldOut 1.8s ease forwards;
}
@keyframes evoOldOut {
  0%   { opacity: 1; transform: scale(1); filter: brightness(1) drop-shadow(0 4px 0 rgba(0,0,0,0.5)); }
  40%  { opacity: 1; transform: scale(1.1); filter: brightness(2) drop-shadow(0 0 20px #fff); }
  50%  { opacity: 0; transform: scale(1.3); filter: brightness(4) drop-shadow(0 0 40px #ffd700); }
  100% { opacity: 0; transform: scale(2); }
}
.evo-new-sprite {
  opacity: 0;
  animation: evoNewIn 1.2s ease 1.2s forwards;
}
@keyframes evoNewIn {
  0%   { opacity: 0; transform: scale(0.3) rotate(-20deg); filter: brightness(4) drop-shadow(0 0 30px #ffd700); }
  40%  { opacity: 1; transform: scale(1.3) rotate(5deg); filter: brightness(2) drop-shadow(0 0 20px #ffd700); }
  70%  { transform: scale(0.95) rotate(-2deg); filter: brightness(1.2); }
  100% { opacity: 1; transform: scale(1) rotate(0deg); filter: brightness(1) drop-shadow(0 4px 0 rgba(0,0,0,0.5)); }
}

/* Particle burst during transform */
.evo-particles {
  position: absolute; inset: 0; pointer-events: none; overflow: hidden;
}
.evo-particle {
  position: absolute; top: 50%; left: 50%;
  width: 6px; height: 6px;
  animation: evoParticle 1.5s ease-out 0.8s forwards;
  opacity: 0;
}
@keyframes evoParticle {
  0%   { opacity: 1; transform: translate(-50%,-50%) scale(1); }
  100% { opacity: 0; transform: translate(var(--epx), var(--epy)) scale(0); }
}

/* Flash during evolution */
.evo-flash {
  position: absolute; inset: -20px; border-radius: 50%;
  background: radial-gradient(circle, rgba(255,215,0,0.6), rgba(255,215,0,0.2), transparent 70%);
  opacity: 0;
  animation: evoFlash 0.6s ease 0.9s forwards;
  pointer-events: none;
}
@keyframes evoFlash {
  0%   { opacity: 0; transform: scale(0.5); }
  50%  { opacity: 1; transform: scale(1.5); }
  100% { opacity: 0; transform: scale(2.5); }
}

/* Evolution info section */
.evo-info {
  margin-top: 8px;
}
.evo-new-name {
  font-family: var(--font-pixel, 'Press Start 2P', monospace);
  font-size: 13px; color: var(--pixel-yellow, #ffd700);
  text-shadow: 2px 2px 0 rgba(0,0,0,0.5);
  margin-bottom: 6px;
}
.evo-stage-label {
  font-family: var(--font-pixel, monospace);
  font-size: 7px; color: var(--pixel-cyan, #00f5ff);
  text-transform: uppercase; letter-spacing: 1px;
  margin-bottom: 12px;
}

.evo-stat-boosts {
  display: flex; gap: 8px; justify-content: center;
  flex-wrap: wrap; margin-bottom: 12px;
}
.evo-stat-chip {
  padding: 4px 10px;
  border: 2px solid var(--pixel-green, #39ff14);
  background: rgba(57,255,20,0.08);
  font-family: var(--font-pixel, monospace);
  font-size: 7px; color: var(--pixel-green, #39ff14);
  text-shadow: 1px 1px 0 rgba(0,0,0,0.4);
}

.evo-ability-box {
  padding: 10px 14px;
  border: 2px solid var(--pixel-purple, #bf5af2);
  background: rgba(191,90,242,0.08);
  margin-bottom: 14px;
}
.evo-ability-label {
  font-family: var(--font-pixel, monospace);
  font-size: 6px; color: var(--pixel-purple, #bf5af2);
  text-transform: uppercase; letter-spacing: 1px;
  margin-bottom: 4px;
}
.evo-ability-name {
  font-family: var(--font-pixel, monospace);
  font-size: 9px; color: var(--pixel-pink, #ff6eb4);
  text-shadow: 1px 1px 0 rgba(0,0,0,0.4);
  margin-bottom: 4px;
}
.evo-ability-desc {
  font-family: var(--font-pixel, monospace);
  font-size: 6px; color: var(--text-dim, #9b8abf);
  line-height: 1.8;
}

.evo-dismiss-btn {
  font-family: var(--font-pixel, 'Press Start 2P', monospace);
  font-size: 8px; border: 3px solid #2bcc10;
  padding: 10px 20px; cursor: pointer;
  text-transform: uppercase; letter-spacing: 1px;
  background: var(--pixel-green, #39ff14); color: #000;
  box-shadow: 0 4px 0 #1a8a0a;
  transition: transform 0.1s;
}
.evo-dismiss-btn:hover { transform: translateY(-2px); }
.evo-dismiss-btn:active { transform: translateY(2px); box-shadow: none; }

/* ── Evolution Progress Panel (Home Page) ── */
.evo-panel {
  background: var(--panel, #231735);
  border: 3px solid var(--border, #3d2d5c);
  box-shadow: 4px 4px 0 rgba(0,0,0,0.4);
  padding: 14px; margin-top: 14px;
}
.evo-panel-title {
  font-family: var(--font-pixel, 'Press Start 2P', monospace);
  font-size: 9px; color: var(--pixel-yellow, #ffd700);
  text-shadow: 2px 2px 0 rgba(0,0,0,0.5);
  margin-bottom: 12px; text-align: center;
}

.evo-path {
  display: flex; align-items: center; justify-content: center;
  gap: 6px; margin-bottom: 12px;
}
.evo-path-stage {
  display: flex; flex-direction: column;
  align-items: center; gap: 3px;
  padding: 8px 6px;
  border: 2px solid var(--border, #3d2d5c);
  background: var(--bg-deep, #0f0a18);
  min-width: 60px; position: relative;
  transition: all 0.3s;
}
.evo-path-stage.evo-active {
  border-color: var(--pixel-yellow, #ffd700);
  box-shadow: 0 0 12px rgba(255,215,0,0.2);
  background: rgba(255,215,0,0.06);
}
.evo-path-stage.evo-locked {
  opacity: 0.4; filter: grayscale(0.6);
}
.evo-path-stage.evo-unlocked {
  border-color: var(--pixel-green, #39ff14);
  background: rgba(57,255,20,0.06);
}
.evo-path-emoji { font-size: 28px; line-height: 1; }
.evo-path-name {
  font-family: var(--font-pixel, monospace);
  font-size: 5px; color: var(--text, #f0e6ff);
  text-align: center; white-space: nowrap;
}
.evo-path-lvl {
  font-family: var(--font-pixel, monospace);
  font-size: 5px; color: var(--text-dim, #9b8abf);
}
.evo-path-check {
  position: absolute; top: -4px; right: -4px;
  font-size: 10px;
  filter: drop-shadow(0 1px 0 rgba(0,0,0,0.6));
}
.evo-path-arrow {
  font-family: var(--font-pixel, monospace);
  font-size: 14px; color: var(--text-dim, #9b8abf);
  flex-shrink: 0;
}

/* Progress to next evo */
.evo-progress {
  margin-top: 10px;
}
.evo-progress-label {
  display: flex; justify-content: space-between;
  font-family: var(--font-pixel, monospace);
  font-size: 6px; color: var(--text-dim, #9b8abf);
  margin-bottom: 4px;
}
.evo-progress-bar {
  height: 10px; border: 2px solid var(--border, #3d2d5c);
  background: var(--bg-deep, #0f0a18);
  overflow: hidden; position: relative;
}
.evo-progress-fill {
  height: 100%; transition: width 0.5s ease;
  background: linear-gradient(90deg, var(--pixel-purple, #bf5af2), var(--pixel-yellow, #ffd700));
  box-shadow: 0 0 8px rgba(191,90,242,0.3);
  position: relative;
}
.evo-progress-fill::after {
  content: ''; position: absolute; inset: 0;
  background: repeating-linear-gradient(
    90deg, transparent, transparent 4px,
    rgba(255,255,255,0.1) 4px, rgba(255,255,255,0.1) 8px
  );
}

/* Current ability display */
.evo-current-ability {
  margin-top: 10px; padding: 8px 10px;
  border: 2px solid var(--pixel-purple, #bf5af2);
  background: rgba(191,90,242,0.06);
  text-align: center;
}
.evo-current-ability-label {
  font-family: var(--font-pixel, monospace);
  font-size: 5px; color: var(--pixel-purple, #bf5af2);
  text-transform: uppercase; letter-spacing: 1px;
  margin-bottom: 3px;
}
.evo-current-ability-name {
  font-family: var(--font-pixel, monospace);
  font-size: 8px; color: var(--pixel-pink, #ff6eb4);
  text-shadow: 1px 1px 0 rgba(0,0,0,0.4);
}
.evo-current-ability-desc {
  font-family: var(--font-pixel, monospace);
  font-size: 5px; color: var(--text-dim, #9b8abf);
  line-height: 1.8; margin-top: 2px;
}

.evo-fully-evolved {
  text-align: center; margin-top: 8px;
  font-family: var(--font-pixel, monospace);
  font-size: 7px; color: var(--pixel-yellow, #ffd700);
  text-shadow: 1px 1px 0 rgba(0,0,0,0.4);
}

  `;
  document.head.appendChild(style);


  // ══════════════════════════════════════
  //  WAIT FOR APP
  // ══════════════════════════════════════
  let pollCount = 0;
  function waitForApp() {
    if (window.S && window.render) {
      initEvolutionSystem();
    } else if (pollCount++ < 200) {
      setTimeout(waitForApp, 50);
    } else {
      console.warn('[Evolution] Timed out waiting for app');
    }
  }
  waitForApp();


  // ══════════════════════════════════════
  //  INIT
  // ══════════════════════════════════════
  async function initEvolutionSystem() {
    console.log('[Evolution] App detected, initializing...');

    // Create our own Supabase client
    try {
      const { createClient } = await import('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm');
      sb = createClient(SUPABASE_URL, SUPABASE_KEY);
    } catch (e) {
      console.error('[Evolution] Failed to create Supabase client:', e);
    }

    // Expose evolution helpers globally for other patches
    window.EVO = {
      getStage: getEvolutionStage,
      getNext: getNextEvolution,
      getEmoji: getEvolvedEmoji,
      getAllStages: getAllStages,
      MAP: EVOLUTION_MAP
    };

    // Wrap render to post-process DOM
    const origRender = window.render;
    window.render = function() {
      const result = origRender.apply(this, arguments);
      // Small delay to let DOM update
      setTimeout(() => {
        swapAllPetEmojis();
        injectEvolutionPanel();
        checkForEvolutions();
      }, 50);
      return result;
    };

    // Also run immediately
    setTimeout(() => {
      swapAllPetEmojis();
      injectEvolutionPanel();
      checkForEvolutions();
    }, 300);

    // Periodic sprite swap (catches async updates)
    setInterval(() => {
      swapAllPetEmojis();
    }, 2000);

    console.log('[Evolution] System initialized!');
  }


  // ══════════════════════════════════════
  //  DOM EMOJI SWAP
  // ══════════════════════════════════════
  function swapAllPetEmojis() {
    if (!window.S) return;

    // Get active pet and all pets
    const pets = window.S.pets || [];
    const activePet = window.S.activePet || pets.find(p => p.is_active);

    if (!activePet) return;

    const species = activePet.species;
    const level = activePet.level || 1;
    const evolvedEmoji = getEvolvedEmoji(species, level);
    if (!evolvedEmoji) return;

    // Original base emoji from SPECIES
    const baseEmojis = {
      cat: '🐱', dog: '🐶', dragon: '🐉', fox: '🦊', robot: '🤖'
    };
    const baseEmoji = baseEmojis[species];
    if (!baseEmoji || evolvedEmoji === baseEmoji) return; // No evolution needed

    // Find all elements that display the pet sprite and swap
    // Target: .pet-sprite-img elements, any element with the base emoji as text
    const spriteImgs = document.querySelectorAll('.pet-sprite-img');
    spriteImgs.forEach(el => {
      const txt = el.textContent.trim();
      // Check all base emojis for this species' evolution chain
      const stages = EVOLUTION_MAP[species] || [];
      const stageEmojis = stages.map(s => s.emoji);
      // If it shows any of the species emojis but not the correct evolved one, swap it
      if (stageEmojis.includes(txt) || txt === baseEmoji) {
        if (txt !== evolvedEmoji) {
          el.textContent = evolvedEmoji;
        }
      }
    });

    // Also check for loose emoji text in pet displays
    // Look for pet name containers that contain the base emoji
    document.querySelectorAll('.pet-sprite').forEach(sprite => {
      const img = sprite.querySelector('.pet-sprite-img');
      if (img) {
        const txt = img.textContent.trim();
        if (txt === baseEmoji && evolvedEmoji !== baseEmoji) {
          img.textContent = evolvedEmoji;
        }
      }
    });

    // Swap emojis in park pets too
    document.querySelectorAll('.park-pet-emoji').forEach(el => {
      // For park, we need to match by pet data
      // Just swap all instances of the active pet's base emoji
      const txt = el.textContent.trim();
      if (txt === baseEmoji) {
        el.textContent = evolvedEmoji;
      }
    });

    // Swap for ALL owned pets (not just active)
    pets.forEach(pet => {
      const pSpecies = pet.species;
      const pLevel = pet.level || 1;
      const pEvolved = getEvolvedEmoji(pSpecies, pLevel);
      const pBase = baseEmojis[pSpecies];
      if (!pEvolved || pEvolved === pBase) return;

      // Find pet cards by name text
      document.querySelectorAll('.card, .pet-card, .pet-list-item').forEach(card => {
        const nameEl = card.querySelector('[class*="pet-name"], .pet-info h3, h3');
        if (nameEl && nameEl.textContent.includes(pet.name)) {
          const spriteEl = card.querySelector('.pet-sprite-img');
          if (spriteEl && spriteEl.textContent.trim() === pBase) {
            spriteEl.textContent = pEvolved;
          }
        }
      });
    });
  }


  // ══════════════════════════════════════
  //  EVOLUTION CHECK (on level up)
  // ══════════════════════════════════════
  let lastKnownLevels = {};

  function checkForEvolutions() {
    if (!window.S) return;
    const pets = window.S.pets || [];

    pets.forEach(pet => {
      const prevLevel = lastKnownLevels[pet.id];
      const currentLevel = pet.level || 1;

      // Store current level
      lastKnownLevels[pet.id] = currentLevel;

      // Skip first load (no previous level known)
      if (prevLevel === undefined) return;

      // Check if we crossed an evolution threshold
      if (currentLevel > prevLevel) {
        const stages = EVOLUTION_MAP[pet.species] || [];
        for (const stage of stages) {
          if (stage.minLevel > 1 && currentLevel >= stage.minLevel && prevLevel < stage.minLevel) {
            // Crossed an evolution boundary!
            if (!hasSeenEvolution(pet.id, stage.stage)) {
              showEvolutionPopup(pet, stage);
              markEvolutionSeen(pet.id, stage.stage);
            }
          }
        }
      }
    });
  }

  // Also watch for level changes via interval (catches XP from battles etc)
  setInterval(() => {
    checkForEvolutions();
  }, 3000);


  // ══════════════════════════════════════
  //  EVOLUTION POPUP
  // ══════════════════════════════════════
  function showEvolutionPopup(pet, newStage) {
    // Remove any existing popup
    const old = document.querySelector('.evo-overlay');
    if (old) old.remove();

    // Get previous stage emoji
    const stages = EVOLUTION_MAP[pet.species] || [];
    const prevStage = stages.find(s => s.stage === newStage.stage - 1);
    const oldEmoji = prevStage ? prevStage.emoji : '❓';

    // Play SFX if available
    if (window.SFX && window.SFX.levelUp) {
      setTimeout(() => window.SFX.levelUp(), 800);
    }

    // Screen flash
    if (window.BattleFX && window.BattleFX.screenFlash) {
      setTimeout(() => window.BattleFX.screenFlash('rgba(255,215,0,0.4)'), 900);
    }

    // Generate particles
    const particleColors = ['#ffd700', '#ff6eb4', '#bf5af2', '#00f5ff', '#39ff14', '#ff8c42'];
    let particlesHTML = '';
    for (let i = 0; i < 24; i++) {
      const angle = (i / 24) * Math.PI * 2;
      const dist = 60 + Math.random() * 80;
      const px = Math.cos(angle) * dist;
      const py = Math.sin(angle) * dist;
      const color = particleColors[i % particleColors.length];
      const size = 4 + Math.random() * 6;
      particlesHTML += `<div class="evo-particle" style="--epx:${px}px; --epy:${py}px; width:${size}px; height:${size}px; background:${color}; animation-delay:${0.7 + Math.random() * 0.4}s;"></div>`;
    }

    // Build stat boost chips
    let statsHTML = '';
    if (newStage.statBoost) {
      const statNames = { hp: 'HP', attack: 'ATK', defense: 'DEF', speed: 'SPD' };
      for (const [stat, val] of Object.entries(newStage.statBoost)) {
        statsHTML += `<div class="evo-stat-chip">+${val} ${statNames[stat] || stat}</div>`;
      }
    }

    // Build ability section
    let abilityHTML = '';
    if (newStage.ability) {
      abilityHTML = `
        <div class="evo-ability-box">
          <div class="evo-ability-label">⚡ New Ability Unlocked</div>
          <div class="evo-ability-name">${newStage.ability.name}</div>
          <div class="evo-ability-desc">${newStage.ability.desc}</div>
        </div>
      `;
    }

    const overlay = document.createElement('div');
    overlay.className = 'evo-overlay';
    overlay.innerHTML = `
      <div class="evo-popup">
        <div class="evo-title">✨ Evolution! ✨</div>
        <div class="evo-subtitle">${esc(pet.name)} is evolving!</div>

        <div class="evo-transform">
          <div class="evo-particles">${particlesHTML}</div>
          <div class="evo-flash"></div>
          <div class="evo-old-sprite">${oldEmoji}</div>
          <div class="evo-new-sprite">${newStage.emoji}</div>
        </div>

        <div class="evo-info">
          <div class="evo-new-name">${esc(newStage.name)}</div>
          <div class="evo-stage-label">Stage ${newStage.stage} Evolution</div>
          ${statsHTML ? `<div class="evo-stat-boosts">${statsHTML}</div>` : ''}
          ${abilityHTML}
          <button class="evo-dismiss-btn" id="evo-dismiss">Awesome!</button>
        </div>
      </div>
    `;

    document.body.appendChild(overlay);

    // Dismiss handler
    overlay.querySelector('#evo-dismiss').addEventListener('click', () => {
      overlay.style.animation = 'evoFadeIn 0.3s ease reverse forwards';
      setTimeout(() => overlay.remove(), 300);
    });

    // Auto-dismiss after 15s
    setTimeout(() => {
      if (overlay.parentNode) {
        overlay.style.animation = 'evoFadeIn 0.3s ease reverse forwards';
        setTimeout(() => { if (overlay.parentNode) overlay.remove(); }, 300);
      }
    }, 15000);

    // Apply stat boosts to the pet in Supabase
    applyStatBoosts(pet, newStage);
  }

  function esc(s) {
    const d = document.createElement('div');
    d.textContent = s;
    return d.innerHTML;
  }


  // ══════════════════════════════════════
  //  APPLY STAT BOOSTS
  // ══════════════════════════════════════
  async function applyStatBoosts(pet, stage) {
    if (!sb || !stage.statBoost) return;
    try {
      const updates = {};
      if (stage.statBoost.hp) {
        updates.max_hp = (pet.max_hp || 100) + stage.statBoost.hp;
        updates.hp = Math.min((pet.hp || pet.max_hp || 100) + stage.statBoost.hp, updates.max_hp);
      }
      if (stage.statBoost.attack) updates.attack = (pet.attack || 10) + stage.statBoost.attack;
      if (stage.statBoost.defense) updates.defense = (pet.defense || 10) + stage.statBoost.defense;
      if (stage.statBoost.speed) updates.speed = (pet.speed || 10) + stage.statBoost.speed;

      if (Object.keys(updates).length > 0) {
        await sb.from(T_PETS).update(updates).eq('id', pet.id);
        // Update local state too
        Object.assign(pet, updates);
        console.log('[Evolution] Applied stat boosts:', updates);
      }
    } catch (e) {
      console.error('[Evolution] Failed to apply stat boosts:', e);
    }
  }


  // ══════════════════════════════════════
  //  EVOLUTION PANEL (injected on home)
  // ══════════════════════════════════════
  function injectEvolutionPanel() {
    if (!window.S || window.S.nav !== 'home') return;

    // Don't inject if already present
    if (document.querySelector('.evo-panel')) return;

    const pets = window.S.pets || [];
    const activePet = window.S.activePet || pets.find(p => p.is_active);
    if (!activePet) return;

    const species = activePet.species;
    const level = activePet.level || 1;
    const stages = getAllStages(species);
    if (stages.length === 0) return;

    const currentStage = getEvolutionStage(species, level);
    const nextEvo = getNextEvolution(species, level);

    // Build evolution path
    let pathHTML = '';
    stages.forEach((s, i) => {
      const isActive = currentStage && currentStage.stage === s.stage;
      const isUnlocked = level >= s.minLevel;
      const cls = isActive ? 'evo-active' : (isUnlocked ? 'evo-unlocked' : 'evo-locked');

      pathHTML += `
        <div class="evo-path-stage ${cls}">
          ${isUnlocked && !isActive ? '<div class="evo-path-check">✅</div>' : ''}
          <div class="evo-path-emoji">${s.emoji}</div>
          <div class="evo-path-name">${s.name}</div>
          <div class="evo-path-lvl">${s.minLevel === 1 ? 'Lv 1' : 'Lv ' + s.minLevel}</div>
        </div>
      `;
      if (i < stages.length - 1) {
        pathHTML += '<div class="evo-path-arrow">▸</div>';
      }
    });

    // Progress bar to next evolution
    let progressHTML = '';
    if (nextEvo) {
      const prevThreshold = currentStage ? currentStage.minLevel : 1;
      const range = nextEvo.minLevel - prevThreshold;
      const progress = level - prevThreshold;
      const pct = Math.min(100, Math.round((progress / range) * 100));
      progressHTML = `
        <div class="evo-progress">
          <div class="evo-progress-label">
            <span>Lv ${level}</span>
            <span>Next: ${nextEvo.name} (Lv ${nextEvo.minLevel})</span>
          </div>
          <div class="evo-progress-bar">
            <div class="evo-progress-fill" style="width:${pct}%"></div>
          </div>
        </div>
      `;
    } else {
      progressHTML = '<div class="evo-fully-evolved">🌟 Fully Evolved! 🌟</div>';
    }

    // Current ability
    let abilityHTML = '';
    if (currentStage && currentStage.ability) {
      abilityHTML = `
        <div class="evo-current-ability">
          <div class="evo-current-ability-label">⚡ Active Ability</div>
          <div class="evo-current-ability-name">${currentStage.ability.name}</div>
          <div class="evo-current-ability-desc">${currentStage.ability.desc}</div>
        </div>
      `;
    }

    const panel = document.createElement('div');
    panel.className = 'evo-panel';
    panel.innerHTML = `
      <div class="evo-panel-title">✨ Evolution Path</div>
      <div class="evo-path">${pathHTML}</div>
      ${progressHTML}
      ${abilityHTML}
    `;

    // Find insertion point — after the main pet display area
    const page = document.querySelector('.page');
    if (page) {
      // Try to insert after the first card or section
      const firstSection = page.querySelector('.section, .card');
      if (firstSection && firstSection.nextSibling) {
        firstSection.parentNode.insertBefore(panel, firstSection.nextSibling);
      } else {
        page.appendChild(panel);
      }
    }
  }

})();
