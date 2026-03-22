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

  /* ── 1. Default Shop Items ── */
  function patchShopDefaults() {
    if (!window.DEFAULT_SHOP_ITEMS) return;

    // Check immediately
    if (!window.S.shopItems || window.S.shopItems.length === 0) {
      window.S.shopItems = window.DEFAULT_SHOP_ITEMS;
      console.log('[Patches] Injected default shop items');
    }

    // Also watch for future loadAll calls that might clear them
    const originalNav = window._nav;
    if (originalNav) {
      window._nav = function(n) {
        originalNav(n);
        // After navigating, if shop tab and items empty, inject defaults
        setTimeout(() => {
          if (window.S.shopItems && window.S.shopItems.length === 0 && window.DEFAULT_SHOP_ITEMS) {
            window.S.shopItems = window.DEFAULT_SHOP_ITEMS;
            window.render();
          }
        }, 500);
      };
    }

    // Observe state changes via a periodic check
    setInterval(() => {
      if (window.S && (!window.S.shopItems || window.S.shopItems.length === 0) && window.DEFAULT_SHOP_ITEMS) {
        window.S.shopItems = window.DEFAULT_SHOP_ITEMS;
        // Only re-render if we're on the shop page
        if (window.S.nav === 'shop') window.render();
      }
    }, 2000);
  }

  /* ── 2. SFX Event Delegation ── */
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
    }, true); // capture phase so we fire even if handlers stopPropagation
  }

  /* ── 3. Battle Handler Patches ── */
  function patchBattleHandlers() {
    if (!window.BattleFX || !window.SFX) return;

    // Patch _startBattle if it exists
    if (window._startBattle) {
      const orig = window._startBattle;
      window._startBattle = function() {
        window.SFX.battleStart();
        return orig.apply(this, arguments);
      };
    }

    // Patch _battleAction if it exists
    if (window._battleAction) {
      const origAction = window._battleAction;
      window._battleAction = function(action) {
        // Find pet sprite elements for FX
        const myPet = document.querySelector('.battle-my-pet .pet-sprite, .battle-player .pet-sprite, [class*="my-pet"] .pet-sprite-img');
        const enemyPet = document.querySelector('.battle-enemy-pet .pet-sprite, .battle-opponent .pet-sprite, [class*="enemy"] .pet-sprite-img');

        if (action === 'attack') {
          if (enemyPet) {
            const dmg = window.S.battleState?.lastDamage || Math.floor(Math.random() * 15 + 5);
            window.BattleFX.attackSequence(myPet, enemyPet, dmg, false);
          }
        } else if (action === 'defend') {
          window.BattleFX.defendSequence(myPet);
        } else if (action === 'special') {
          if (enemyPet) {
            const dmg = window.S.battleState?.lastDamage || Math.floor(Math.random() * 25 + 10);
            window.BattleFX.specialSequence(myPet, enemyPet, dmg);
          }
        }

        return origAction.apply(this, arguments);
      };
    }

    // Watch for battle outcome by observing state changes
    let lastBattleStatus = null;
    setInterval(() => {
      if (!window.S.battleState) { lastBattleStatus = null; return; }
      const status = window.S.battleState.status || window.S.battleState.phase;
      if (status && status !== lastBattleStatus) {
        if (status === 'won' || status === 'victory') {
          window.SFX.victory();
          const myPet = document.querySelector('.battle-my-pet .pet-sprite, .battle-player .pet-sprite, .pet-sprite');
          if (myPet) window.BattleFX.victorySequence(myPet);
        } else if (status === 'lost' || status === 'defeat') {
          window.SFX.defeat();
          const myPet = document.querySelector('.battle-my-pet .pet-sprite, .battle-player .pet-sprite, .pet-sprite');
          if (myPet) window.BattleFX.defeatSequence(myPet);
        }
        lastBattleStatus = status;
      }
    }, 300);
  }

  /* ── 4. Care Handler Patches ── */
  function patchCareHandlers() {
    // Patch specific care handlers if they exist
    ['_feedPet', '_playPet', '_restPet', '_healPet'].forEach(name => {
      if (window[name]) {
        const orig = window[name];
        window[name] = function() {
          // SFX already handled by event delegation, but let's also trigger XP sound on success
          const result = orig.apply(this, arguments);
          // If it returns a promise, play XP sound after success
          if (result && result.then) {
            result.then(() => {
              if (window.SFX) window.SFX.xp();
            }).catch(() => {});
          }
          return result;
        };
      }
    });

    // Patch quest completion
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

    // Patch level up detection
    let lastLevel = window.S?.pet?.level || 0;
    setInterval(() => {
      if (window.S?.pet?.level && window.S.pet.level > lastLevel && lastLevel > 0) {
        window.SFX?.levelUp();
        // Show sparkles on pet
        const petEl = document.querySelector('.pet-sprite');
        if (petEl && window.BattleFX) window.BattleFX.sparkles(petEl);
      }
      lastLevel = window.S?.pet?.level || 0;
    }, 1000);
  }

  /* ── 5. Sound Toggle Button ── */
  function addSoundToggleToTopbar() {
    if (!window.SFX) return;

    // Use MutationObserver to inject sound toggle when topbar renders
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

  // Start polling for app readiness
  waitForApp();
})();
