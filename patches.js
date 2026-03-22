/* ═══════════════════════════════════════════
   PixelPaws — Integration Patches
   Hooks SFX, BattleFX, & default shop items
   into the main app without modifying app.js
   ═══════════════════════════════════════════ */
(function() {
  'use strict';

  // Wait for the app module to initialize (it sets window.S)
  let pollCount = 0;
  const MAX_POLLS = 200; // 10 seconds max

  function waitForApp() {
    if (window.S && window.render) {
      init();
    } else if (pollCount++ < MAX_POLLS) {
      setTimeout(waitForApp, 50);
    } else {
      console.warn('[Patches] Timed out waiting for app to init');
    }
  }

  function init() {
    console.log('[Patches] App detected, applying patches...');
    patchShopDefaults();
    patchSFXEventDelegation();
    patchBattleHandlers();
    patchCareHandlers();
    addSoundToggleToTopbar();
    console.log('[Patches] All patches applied!');
  }

  /* —— Shop Item Normalization —— */
  function normalizeShopItems() {
    if (!window.S?.shopItems || !Array.isArray(window.S.shopItems)) return;
    const pluralMap = { toys: 'toy', foods: 'food', heals: 'healing', weapons: 'gear', items: 'gear' };
    const categoryToType = { 'Food': 'food', 'Toys': 'toy', 'Healing': 'healing', 'Gear': 'gear' };

    window.S.shopItems.forEach(item => {
      // If one field exists but not the other, copy it
      if (item.item_type && !item.category) item.category = item.item_type;
      if (item.category && !item.item_type) item.item_type = item.category;

      // Map capitalized categories to lowercase item_type
      if (item.category && categoryToType[item.category]) {
        item.item_type = categoryToType[item.category];
        item.category = categoryToType[item.category];
      }

      // Normalize to lowercase
      if (item.category && typeof item.category === 'string') item.category = item.category.toLowerCase();
      if (item.item_type && typeof item.item_type === 'string') item.item_type = item.item_type.toLowerCase();

      // Handle plurals
      if (item.category && pluralMap[item.category]) item.category = pluralMap[item.category];
      if (item.item_type && pluralMap[item.item_type]) item.item_type = pluralMap[item.item_type];
    });
  }

  /* —— 1. Default Shop Items —— */
  function patchShopDefaults() {
    if (!window.DEFAULT_SHOP_ITEMS) return;

    function injectDefaults() {
      if (!window.S.shopItems || window.S.shopItems.length === 0) {
        window.S.shopItems = JSON.parse(JSON.stringify(window.DEFAULT_SHOP_ITEMS));
        console.log('[Patches] Injected default shop items:', window.S.shopItems.length);
      }
      normalizeShopItems();
    }

    // Inject immediately
    injectDefaults();

    // Patch _nav to re-inject after navigation
    const originalNav = window._nav;
    if (originalNav) {
      window._nav = function(n) {
        originalNav(n);
        setTimeout(() => {
          injectDefaults();
          if (n === 'shop') window.render();
        }, 300);
      };
    }

    // Periodic check — keeps items alive
    setInterval(() => {
      if (window.S && (!window.S.shopItems || window.S.shopItems.length === 0) && window.DEFAULT_SHOP_ITEMS) {
        window.S.shopItems = JSON.parse(JSON.stringify(window.DEFAULT_SHOP_ITEMS));
        normalizeShopItems();
        if (window.S.nav === 'shop') window.render();
      } else if (window.S?.shopItems?.length > 0) {
        normalizeShopItems();
      }
    }, 1500);

    // Also normalize after any loadAll completes
    // Intercept render to normalize before each render when on shop page
    const origRender = window.render;
    if (origRender) {
      window.render = function() {
        if (window.S?.nav === 'shop') {
          injectDefaults();
        }
        return origRender.apply(this, arguments);
      };
    }
  }

  /* —— 2. SFX Event Delegation —— */
  function patchSFXEventDelegation() {
    if (!window.SFX) return;

    document.addEventListener('click', function(e) {
      const el = e.target.closest('button, .nav-btn, .care-btn, .btn-icon, .btn');
      if (!el) return;

      // Navigation tabs
      if (el.classList.contains('nav-btn')) {
        window.SFX.nav();
        return;
      }

      // Care buttons
      if (el.classList.contains('care-btn')) {
        const text = el.textContent.toLowerCase();
        if (text.includes('feed')) window.SFX.feed();
        else if (text.includes('play')) window.SFX.play();
        else if (text.includes('rest') || text.includes('sleep')) window.SFX.rest();
        else if (text.includes('heal')) window.SFX.heal();
        else window.SFX.click();
        return;
      }

      // Shop buy button
      if (el.textContent && (el.textContent.toLowerCase().includes('buy') || el.textContent.toLowerCase().includes('purchase'))) {
        window.SFX.coin();
        return;
      }

      // Battle action buttons
      if (el.dataset.action === 'attack' || (el.textContent && el.textContent.toLowerCase().includes('attack'))) {
        window.SFX.hit();
        return;
      }
      if (el.dataset.action === 'defend' || (el.textContent && el.textContent.toLowerCase().includes('defend'))) {
        window.SFX.defend();
        return;
      }
      if (el.dataset.action === 'special' || (el.textContent && el.textContent.toLowerCase().includes('special'))) {
        window.SFX.special();
        return;
      }

      // Adopt button
      if (el.textContent && el.textContent.toLowerCase().includes('adopt')) {
        window.SFX.adopt();
        return;
      }

      // Quest answer / complete
      if (el.textContent && (el.textContent.toLowerCase().includes('quest') || el.textContent.toLowerCase().includes('answer'))) {
        window.SFX.click();
        return;
      }

      // Danger / error buttons
      if (el.classList.contains('btn-danger')) {
        window.SFX.error();
        return;
      }

      // Generic button click
      if (el.classList.contains('btn') || el.classList.contains('btn-icon') || el.classList.contains('btn-primary') || el.classList.contains('btn-secondary') || el.classList.contains('btn-gold')) {
        window.SFX.click();
      }
    }, true);
  }

  /* —— 3. Battle Handler Patches —— */
  function patchBattleHandlers() {
    if (!window.BattleFX || !window.SFX) return;

    // Patch _startBattle if it exists
    if (window._startBattle) {
      const orig = window._startBattle;
      window._startBattle = function() {
        window.SFX.battleStart();
        // Flash the screen on battle start
        window.BattleFX.screenFlash('rgba(191,90,242,0.4)');
        return orig.apply(this, arguments);
      };
    }

    // Patch _battleAction if it exists
    if (window._battleAction) {
      const origAction = window._battleAction;
      window._battleAction = function(action) {
        const myPet = document.querySelector('.battle-my-pet .pet-sprite, .battle-player .pet-sprite, [class*="my-pet"] .pet-sprite-img, .battle-sprite-left .pet-sprite-img');
        const enemyPet = document.querySelector('.battle-enemy-pet .pet-sprite, .battle-opponent .pet-sprite, [class*="enemy"] .pet-sprite-img, .battle-sprite-right .pet-sprite-img');

        if (action === 'attack') {
          const dmg = window.S.battleState?.lastDamage || Math.floor(Math.random() * 15 + 5);
          if (enemyPet) {
            window.BattleFX.attackSequence(myPet, enemyPet, dmg, Math.random() < 0.15);
          }
          // Shake screen on attack
          window.BattleFX.shake();
        } else if (action === 'defend') {
          window.BattleFX.defendSequence(myPet);
        } else if (action === 'special') {
          const dmg = window.S.battleState?.lastDamage || Math.floor(Math.random() * 25 + 10);
          if (enemyPet) {
            window.BattleFX.specialSequence(myPet, enemyPet, dmg);
          }
          // Big flash for special
          window.BattleFX.screenFlash('rgba(255,215,0,0.3)');
          window.BattleFX.shake();
        }

        return origAction.apply(this, arguments);
      };
    }

    // Watch for battle outcome by observing state changes
    let lastBattleStatus = null;
    let lastEnemyHp = null;
    let lastMyHp = null;
    setInterval(() => {
      if (!window.S.battleState) { lastBattleStatus = null; lastEnemyHp = null; lastMyHp = null; return; }

      const bs = window.S.battleState;
      const status = bs.status || bs.phase;

      // Detect HP changes for reactive effects
      if (bs.enemyHp !== undefined && lastEnemyHp !== null && bs.enemyHp < lastEnemyHp) {
        const enemyBar = document.querySelector('.battle-enemy-hp .bar-fill, .enemy-hp-bar .bar-fill, [class*="enemy"] .bar-fill');
        if (enemyBar) window.BattleFX.hpGlow(enemyBar);
      }
      if (bs.myHp !== undefined && lastMyHp !== null && bs.myHp < lastMyHp) {
        const myBar = document.querySelector('.battle-my-hp .bar-fill, .my-hp-bar .bar-fill, [class*="player"] .bar-fill');
        if (myBar) window.BattleFX.hpGlow(myBar);
        // Enemy attacked us — show effects on our pet
        const myPet = document.querySelector('.battle-my-pet .pet-sprite-img, .battle-sprite-left .pet-sprite-img, [class*="my-pet"] .pet-sprite-img');
        if (myPet) {
          window.BattleFX.hitFlash(myPet);
          window.BattleFX.particles(myPet, 5, '#ff4757');
        }
      }
      lastEnemyHp = bs.enemyHp;
      lastMyHp = bs.myHp;

      // Win/lose detection
      if (status && status !== lastBattleStatus) {
        if (status === 'won' || status === 'victory') {
          window.SFX.victory();
          const myPet = document.querySelector('.battle-my-pet .pet-sprite, .battle-player .pet-sprite, .pet-sprite');
          if (myPet) window.BattleFX.victorySequence(myPet);
          window.BattleFX.screenFlash('rgba(57,255,20,0.3)');
        } else if (status === 'lost' || status === 'defeat') {
          window.SFX.defeat();
          const myPet = document.querySelector('.battle-my-pet .pet-sprite, .battle-player .pet-sprite, .pet-sprite');
          if (myPet) window.BattleFX.defeatSequence(myPet);
          window.BattleFX.screenFlash('rgba(255,71,87,0.3)');
        }
        lastBattleStatus = status;
      }
    }, 200);
  }

  /* —— 4. Care Handler Patches —— */
  function patchCareHandlers() {
    ['_feedPet', '_playPet', '_restPet', '_healPet'].forEach(name => {
      if (window[name]) {
        const orig = window[name];
        window[name] = function() {
          const result = orig.apply(this, arguments);
          if (result && result.then) {
            result.then(() => {
              if (window.SFX) window.SFX.xp();
            }).catch(() => {});
          }
          return result;
        };
      }
    });

    if (window._submitQuest) {
      const origQuest = window._submitQuest;
      window._submitQuest = function() {
        const result = origQuest.apply(this, arguments);
        if (result && result.then) {
          result.then(() => {
            if (window.SFX) window.SFX.questComplete();
          }).catch(() => {});
        }
        return result;
      };
    }

    // Level up detection
    let lastLevel = window.S?.pet?.level || 0;
    setInterval(() => {
      if (window.S?.pet?.level && window.S.pet.level > lastLevel && lastLevel > 0) {
        window.SFX?.levelUp();
        const petEl = document.querySelector('.pet-sprite');
        if (petEl && window.BattleFX) window.BattleFX.sparkles(petEl);
      }
      lastLevel = window.S?.pet?.level || 0;
    }, 1000);
  }

  /* —— 5. Sound Toggle Button —— */
  function addSoundToggleToTopbar() {
    if (!window.SFX) return;

    const observer = new MutationObserver(() => {
      const topbar = document.querySelector('.top-actions, .top-stats');
      if (topbar && !document.getElementById('sfx-toggle-btn')) {
        const btn = document.createElement('button');
        btn.id = 'sfx-toggle-btn';
        btn.className = 'btn-icon';
        btn.title = 'Toggle Sound';
        btn.innerHTML = '<i class="fa-solid fa-volume-high"></i>';
        btn.style.cssText = 'width:32px;height:32px;font-size:12px;border:2px solid var(--border);background:var(--panel-light);color:var(--pixel-cyan);cursor:pointer;display:inline-grid;place-items:center;';
        btn.onclick = function(e) {
          e.stopPropagation();
          const muted = window.SFX.toggleMute();
          btn.innerHTML = muted ? '<i class="fa-solid fa-volume-xmark"></i>' : '<i class="fa-solid fa-volume-high"></i>';
          btn.style.color = muted ? 'var(--muted)' : 'var(--pixel-cyan)';
        };
        topbar.prepend(btn);
      }
    });
    observer.observe(document.getElementById('app') || document.body, { childList: true, subtree: true });
  }

  waitForApp();
})();
