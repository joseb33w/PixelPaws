/* ═══════════════════════════════════════════════════════
   PixelPaws — Daily Rewards & Pet Mood System
   Monkey-patches into app without modifying app.js
   ═══════════════════════════════════════════════════════ */
(function() {
  'use strict';

  // ── Config ──
  const SUPABASE_URL = 'https://xhhmxabftbyxrirvvihn.supabase.co';
  const SUPABASE_KEY = 'sb_publishable_NZHoIxqqpSvVBP8MrLHCYA_gmg1AbN-';
  const T_REWARDS   = 'uNMexs7BYTXQ2_pixelpaws_daily_rewards';
  const T_USERS     = 'uNMexs7BYTXQ2_pixelpaws_app_users';

  let sb = null;           // local supabase client
  let rewardChecked = false;
  let moodInterval = null;

  // ── Reward schedule (day-of-streak → reward) ──
  const REWARD_SCHEDULE = [
    { day: 1,  type: 'coins', amount: 25,  icon: '🪙', label: '25 Coins' },
    { day: 2,  type: 'coins', amount: 50,  icon: '🪙', label: '50 Coins' },
    { day: 3,  type: 'coins', amount: 75,  icon: '✨', label: '75 Coins' },
    { day: 4,  type: 'coins', amount: 100, icon: '💰', label: '100 Coins' },
    { day: 5,  type: 'coins', amount: 150, icon: '🎁', label: '150 Coins' },
    { day: 6,  type: 'coins', amount: 200, icon: '💎', label: '200 Coins' },
    { day: 7,  type: 'coins', amount: 350, icon: '👑', label: '350 Coins + Bonus!' },
  ];

  function getRewardForDay(streak) {
    const day = ((streak - 1) % 7) + 1; // cycles every 7 days
    const base = REWARD_SCHEDULE.find(r => r.day === day) || REWARD_SCHEDULE[0];
    // Bonus multiplier for completing full weeks
    const weekBonus = Math.floor((streak - 1) / 7);
    const bonusCoins = weekBonus * 50;
    return {
      ...base,
      amount: base.amount + bonusCoins,
      label: bonusCoins > 0 ? `${base.amount + bonusCoins} Coins (Week ${weekBonus + 1})` : base.label
    };
  }

  function todayStr() {
    return new Date().toISOString().split('T')[0];
  }

  // ── Inject CSS ──
  const css = document.createElement('style');
  css.textContent = `

/* ═══════════════════════
   DAILY REWARDS POPUP
   ═══════════════════════ */
.dr-overlay {
  position: fixed; inset: 0; z-index: 500;
  background: rgba(0,0,0,0.75);
  display: flex; align-items: center; justify-content: center;
  animation: drFadeIn 0.3s ease;
  padding: 16px;
}
@keyframes drFadeIn {
  from { opacity: 0; } to { opacity: 1; }
}
.dr-popup {
  background: var(--panel, #231735);
  border: 3px solid var(--pixel-yellow, #ffd700);
  box-shadow: 6px 6px 0 rgba(0,0,0,0.5), 0 0 40px rgba(255,215,0,0.15);
  padding: 24px 20px; width: min(360px, 92vw);
  text-align: center; position: relative;
  animation: drPopIn 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
}
@keyframes drPopIn {
  from { transform: scale(0.5) translateY(30px); opacity: 0; }
  to   { transform: scale(1)   translateY(0);    opacity: 1; }
}
.dr-title {
  font-family: var(--font-pixel, 'Press Start 2P', monospace);
  font-size: 12px; color: var(--pixel-yellow, #ffd700);
  text-shadow: 2px 2px 0 rgba(0,0,0,0.5);
  margin-bottom: 6px;
}
.dr-subtitle {
  font-family: var(--font-pixel, 'Press Start 2P', monospace);
  font-size: 7px; color: var(--text-dim, #9b8abf);
  margin-bottom: 16px; line-height: 1.8;
}

/* streak calendar */
.dr-streak-row {
  display: flex; gap: 6px; justify-content: center;
  margin-bottom: 16px; flex-wrap: wrap;
}
.dr-day {
  width: 38px; height: 44px;
  display: flex; flex-direction: column;
  align-items: center; justify-content: center; gap: 2px;
  border: 2px solid var(--border, #3d2d5c);
  background: var(--bg-deep, #0f0a18);
  position: relative;
}
.dr-day.dr-claimed {
  border-color: var(--pixel-green, #39ff14);
  background: rgba(57,255,20,0.08);
}
.dr-day.dr-today {
  border-color: var(--pixel-yellow, #ffd700);
  box-shadow: 0 0 12px rgba(255,215,0,0.3);
  animation: drDayPulse 1.5s ease-in-out infinite;
}
@keyframes drDayPulse {
  0%,100% { box-shadow: 0 0 8px rgba(255,215,0,0.2); }
  50%     { box-shadow: 0 0 18px rgba(255,215,0,0.45); }
}
.dr-day-num {
  font-family: var(--font-pixel, monospace);
  font-size: 6px; color: var(--text-dim, #9b8abf);
}
.dr-day-icon { font-size: 16px; }
.dr-day-check {
  position: absolute; top: -4px; right: -4px;
  font-size: 10px; filter: drop-shadow(0 1px 0 rgba(0,0,0,0.6));
}

/* today's reward showcase */
.dr-reward-showcase {
  padding: 14px; margin: 12px 0;
  border: 2px solid var(--pixel-cyan, #00f5ff);
  background: rgba(0,245,255,0.06);
  box-shadow: inset 0 0 20px rgba(0,245,255,0.05);
}
.dr-reward-icon {
  font-size: 40px; display: block; margin-bottom: 6px;
  animation: drRewardBounce 1s ease infinite;
}
@keyframes drRewardBounce {
  0%,100% { transform: translateY(0); }
  50%     { transform: translateY(-6px); }
}
.dr-reward-label {
  font-family: var(--font-pixel, monospace);
  font-size: 10px; color: var(--pixel-cyan, #00f5ff);
  text-shadow: 1px 1px 0 rgba(0,0,0,0.5);
}
.dr-reward-desc {
  font-family: var(--font-pixel, monospace);
  font-size: 6px; color: var(--text-dim, #9b8abf);
  margin-top: 4px;
}

/* streak fire */
.dr-streak-badge {
  display: inline-flex; align-items: center; gap: 6px;
  padding: 6px 14px; margin-bottom: 14px;
  border: 2px solid var(--pixel-orange, #ff8c42);
  background: rgba(255,140,66,0.1);
  font-family: var(--font-pixel, monospace);
  font-size: 9px; color: var(--pixel-orange, #ff8c42);
  text-shadow: 1px 1px 0 rgba(0,0,0,0.4);
}
.dr-streak-badge .flame { font-size: 16px; }

.dr-claim-btn {
  font-family: var(--font-pixel, 'Press Start 2P', monospace);
  font-size: 9px; border: 3px solid #2bcc10;
  padding: 12px 24px; cursor: pointer;
  text-transform: uppercase; letter-spacing: 1px;
  background: var(--pixel-green, #39ff14); color: #000;
  box-shadow: 0 4px 0 #1a8a0a;
  transition: transform 0.1s;
  margin-top: 6px;
}
.dr-claim-btn:hover { transform: translateY(-2px); }
.dr-claim-btn:active { transform: translateY(2px); box-shadow: none; }
.dr-claim-btn:disabled {
  opacity: 0.4; cursor: not-allowed;
  transform: none !important; box-shadow: none;
}
.dr-already-claimed {
  font-family: var(--font-pixel, monospace);
  font-size: 7px; color: var(--pixel-green, #39ff14);
  margin-top: 10px; line-height: 1.8;
}

.dr-close-btn {
  position: absolute; top: 6px; right: 8px;
  background: none; border: none;
  color: var(--pixel-red, #ff4757);
  font-family: var(--font-pixel, monospace);
  font-size: 12px; cursor: pointer;
}

/* topbar daily reward button */
.dr-topbar-btn {
  width: 36px; height: 36px; border: 2px solid var(--border, #3d2d5c);
  background: var(--panel-light, #2d1f45); color: var(--text, #f0e6ff);
  cursor: pointer; display: inline-grid; place-items: center;
  font-size: 16px; position: relative;
  transition: border-color 0.2s;
}
.dr-topbar-btn:hover {
  border-color: var(--pixel-yellow, #ffd700);
}
.dr-topbar-btn .dr-notif {
  position: absolute; top: -4px; right: -4px;
  width: 10px; height: 10px; border-radius: 50%;
  background: var(--pixel-red, #ff4757);
  border: 2px solid var(--bg-deep, #0f0a18);
  animation: drNotifPulse 1s ease infinite;
}
@keyframes drNotifPulse {
  0%,100% { transform: scale(1); } 50% { transform: scale(1.3); }
}

/* ═══════════════════════
   PET MOOD BUBBLES
   ═══════════════════════ */
.mood-bubble {
  position: absolute; z-index: 20;
  pointer-events: none;
  animation: moodFloat 2.5s ease-in-out infinite;
}
@keyframes moodFloat {
  0%,100% { transform: translateY(0); }
  50%     { transform: translateY(-4px); }
}
.mood-bubble-inner {
  position: relative;
  background: var(--panel, #231735);
  border: 2px solid var(--border, #3d2d5c);
  box-shadow: 2px 2px 0 rgba(0,0,0,0.4);
  padding: 4px 6px;
  font-size: 18px; line-height: 1;
  white-space: nowrap;
}
/* speech-bubble tail */
.mood-bubble-inner::after {
  content: '';
  position: absolute; bottom: -6px; left: 12px;
  width: 0; height: 0;
  border-left: 5px solid transparent;
  border-right: 5px solid transparent;
  border-top: 6px solid var(--border, #3d2d5c);
}
.mood-bubble-inner::before {
  content: '';
  position: absolute; bottom: -4px; left: 13px;
  width: 0; height: 0;
  border-left: 4px solid transparent;
  border-right: 4px solid transparent;
  border-top: 5px solid var(--panel, #231735);
  z-index: 1;
}
.mood-text {
  font-family: var(--font-pixel, monospace);
  font-size: 5px; color: var(--text-dim, #9b8abf);
  display: block; margin-top: 2px; text-align: center;
}

/* mood thought animations */
@keyframes moodPop {
  0%   { transform: scale(0); opacity: 0; }
  60%  { transform: scale(1.2); opacity: 1; }
  100% { transform: scale(1); opacity: 1; }
}
.mood-bubble.mood-new .mood-bubble-inner {
  animation: moodPop 0.35s ease forwards;
}

  `;
  document.head.appendChild(css);


  // ── Wait for app init ──
  let pollCount = 0;
  function waitForApp() {
    if (window.S && window.render) {
      initSystems();
    } else if (pollCount++ < 200) {
      setTimeout(waitForApp, 50);
    } else {
      console.warn('[DailyRewards] Timed out waiting for app');
    }
  }
  waitForApp();


  // ══════════════════════════════════════
  //  INIT
  // ══════════════════════════════════════
  async function initSystems() {
    console.log('[DailyRewards] App detected, initializing...');

    // Create our own Supabase client (app.js client is module-scoped)
    try {
      const { createClient } = await import('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm');
      sb = createClient(SUPABASE_URL, SUPABASE_KEY);
    } catch (e) {
      console.error('[DailyRewards] Failed to init Supabase:', e);
      return;
    }

    // Start pet mood system immediately
    initPetMood();

    // Add topbar button for daily rewards
    injectTopbarButton();

    // Check daily reward on first load (slight delay for data)
    setTimeout(() => {
      checkAndShowDailyReward();
    }, 1500);

    // Re-inject mood bubbles after each render
    const origRender = window.render;
    if (origRender) {
      window.render = function() {
        const result = origRender.apply(this, arguments);
        setTimeout(() => {
          injectTopbarButton();
          updateMoodBubble();
        }, 80);
        return result;
      };
    }

    console.log('[DailyRewards] Systems ready!');
  }


  // ══════════════════════════════════════
  //  TOPBAR BUTTON
  // ══════════════════════════════════════
  function injectTopbarButton() {
    // Don't add if already exists
    if (document.getElementById('dr-topbar-btn')) return;

    const topStats = document.querySelector('.top-stats');
    if (!topStats) return;

    const btn = document.createElement('button');
    btn.id = 'dr-topbar-btn';
    btn.className = 'dr-topbar-btn';
    btn.title = 'Daily Rewards';
    btn.innerHTML = '🎁';

    // Show red dot if unclaimed today
    if (!rewardChecked) {
      btn.innerHTML += '<span class="dr-notif"></span>';
    }

    btn.addEventListener('click', () => {
      showDailyRewardPopup();
    });

    topStats.prepend(btn);
  }


  // ══════════════════════════════════════
  //  DAILY REWARDS LOGIC
  // ══════════════════════════════════════
  async function checkAndShowDailyReward() {
    if (!sb || !window.S?.user) return;

    const userId = window.S.user.id;
    const today = todayStr();

    try {
      // Check if already claimed today
      const { data } = await sb.from(T_REWARDS)
        .select('*')
        .eq('user_id', userId)
        .eq('login_date', today)
        .limit(1);

      if (data && data.length > 0 && data[0].reward_claimed) {
        rewardChecked = true;
        // Remove notif dot
        const notif = document.querySelector('#dr-topbar-btn .dr-notif');
        if (notif) notif.remove();
        return; // Already claimed
      }

      // Not claimed yet — show popup automatically
      showDailyRewardPopup();
    } catch (e) {
      console.error('[DailyRewards] Check error:', e);
    }
  }

  async function getStreakData() {
    if (!sb || !window.S?.user) return { streak: 1, history: [] };

    const userId = window.S.user.id;
    try {
      const { data } = await sb.from(T_REWARDS)
        .select('*')
        .eq('user_id', userId)
        .order('login_date', { ascending: false })
        .limit(30);

      if (!data || data.length === 0) return { streak: 1, history: [] };

      // Calculate current streak
      let streak = 0;
      const today = todayStr();
      let checkDate = new Date(today);

      // If today is already in there and claimed, start from today
      // If not, start from today (unclaimed)
      for (let i = 0; i < 30; i++) {
        const dateStr = checkDate.toISOString().split('T')[0];
        const entry = data.find(d => d.login_date === dateStr);

        if (i === 0) {
          // Today — doesn't need to be claimed for streak continuation
          // Check yesterday
          if (entry && entry.reward_claimed) {
            streak++;
          } else if (i === 0) {
            // Today unclaimed — still counts if yesterday was claimed
            // We'll add today as 1 if we continue
          }
        }

        if (i > 0) {
          if (entry && entry.reward_claimed) {
            streak++;
          } else {
            break;
          }
        }

        checkDate.setDate(checkDate.getDate() - 1);
      }

      // If today hasn't been claimed yet, the streak from yesterday carries + 1 for today
      const todayEntry = data.find(d => d.login_date === today);
      if (!todayEntry || !todayEntry.reward_claimed) {
        // streak currently counts consecutive past days
        streak = streak + 1; // today will be the next day
      }

      if (streak < 1) streak = 1;

      return { streak, history: data };
    } catch (e) {
      console.error('[DailyRewards] Streak error:', e);
      return { streak: 1, history: [] };
    }
  }

  async function showDailyRewardPopup() {
    if (!window.S?.user) return;

    // Remove existing popup
    const existing = document.querySelector('.dr-overlay');
    if (existing) existing.remove();

    const { streak, history } = await getStreakData();
    const today = todayStr();
    const todayClaimed = history.find(h => h.login_date === today && h.reward_claimed);
    const reward = getRewardForDay(streak);

    // Build 7-day calendar
    let calendarHTML = '';
    for (let d = 1; d <= 7; d++) {
      const r = REWARD_SCHEDULE[d - 1];
      const dayInCycle = ((streak - 1) % 7) + 1;
      const isClaimed = d < dayInCycle || (d === dayInCycle && todayClaimed);
      const isToday = d === dayInCycle && !todayClaimed;
      calendarHTML += `
        <div class="dr-day ${isClaimed ? 'dr-claimed' : ''} ${isToday ? 'dr-today' : ''}">
          <span class="dr-day-num">Day ${d}</span>
          <span class="dr-day-icon">${r.icon}</span>
          ${isClaimed ? '<span class="dr-day-check">✅</span>' : ''}
        </div>
      `;
    }

    const overlay = document.createElement('div');
    overlay.className = 'dr-overlay';
    overlay.innerHTML = `
      <div class="dr-popup">
        <button class="dr-close-btn" id="dr-close">✕</button>
        <div class="dr-title">🎁 Daily Reward</div>
        <div class="dr-subtitle">Log in every day for bigger rewards!</div>

        <div class="dr-streak-badge">
          <span class="flame">🔥</span>
          ${streak}-Day Streak!
        </div>

        <div class="dr-streak-row">
          ${calendarHTML}
        </div>

        <div class="dr-reward-showcase">
          <span class="dr-reward-icon">${reward.icon}</span>
          <span class="dr-reward-label">${reward.label}</span>
          <span class="dr-reward-desc">Day ${streak} reward</span>
        </div>

        ${todayClaimed ? `
          <div class="dr-already-claimed">
            ✅ Already claimed today!<br>Come back tomorrow!
          </div>
        ` : `
          <button class="dr-claim-btn" id="dr-claim-btn">
            ✨ Claim Reward ✨
          </button>
        `}
      </div>
    `;

    document.body.appendChild(overlay);

    // Close handlers
    overlay.querySelector('#dr-close').addEventListener('click', () => overlay.remove());
    overlay.addEventListener('click', (e) => { if (e.target === overlay) overlay.remove(); });

    // Claim handler
    const claimBtn = overlay.querySelector('#dr-claim-btn');
    if (claimBtn) {
      claimBtn.addEventListener('click', async () => {
        claimBtn.disabled = true;
        claimBtn.textContent = 'Claiming...';
        await claimReward(streak, reward);
        overlay.remove();
        showDailyRewardPopup(); // re-open to show claimed state
      });
    }

    // Play SFX if available
    if (window.SFX?.coin) window.SFX.coin();
  }

  async function claimReward(streak, reward) {
    if (!sb || !window.S?.user) return;

    const userId = window.S.user.id;
    const today = todayStr();

    try {
      // Upsert daily reward record
      const { error: insertErr } = await sb.from(T_REWARDS).upsert({
        user_id: userId,
        login_date: today,
        streak_count: streak,
        reward_claimed: true,
        reward_type: reward.type,
        reward_amount: reward.amount
      }, { onConflict: 'user_id,login_date', ignoreDuplicates: false });

      // If upsert not supported on this table, try insert
      if (insertErr) {
        await sb.from(T_REWARDS).insert({
          user_id: userId,
          login_date: today,
          streak_count: streak,
          reward_claimed: true,
          reward_type: reward.type,
          reward_amount: reward.amount
        });
      }

      // Award coins to user
      if (reward.type === 'coins' && window.S.coins !== undefined) {
        const newCoins = (window.S.coins || 0) + reward.amount;
        window.S.coins = newCoins;

        // Update in database
        await sb.from(T_USERS)
          .update({ coins: newCoins })
          .eq('user_id', userId);
      }

      rewardChecked = true;

      // Remove notification dot
      const notif = document.querySelector('#dr-topbar-btn .dr-notif');
      if (notif) notif.remove();

      // Show toast
      if (window.toast) {
        window.toast(`🎁 +${reward.amount} coins claimed!`);
      }

      // Play level up SFX for reward
      if (window.SFX?.levelUp) window.SFX.levelUp();

      // Re-render to update coin display
      if (window.render) window.render();

    } catch (e) {
      console.error('[DailyRewards] Claim error:', e);
      if (window.toast) window.toast('Failed to claim reward');
    }
  }


  // ══════════════════════════════════════
  //  PET MOOD SYSTEM
  // ══════════════════════════════════════
  const MOODS = [
    { id: 'ecstatic',  emoji: '🤩', text: 'Ecstatic!',  check: (h, hp, e) => h > 85 && hp > 85 && e > 85 },
    { id: 'happy',     emoji: '😊', text: 'Happy',      check: (h, hp, e) => h > 65 && hp > 65 && e > 65 },
    { id: 'hungry',    emoji: '🤢', text: 'Hungry...',   check: (h, hp, e) => h <= 25 },
    { id: 'starving',  emoji: '😫', text: 'Starving!',  check: (h, hp, e) => h <= 10 },
    { id: 'sleepy',    emoji: '😴', text: 'Sleepy...',   check: (h, hp, e) => e <= 25 },
    { id: 'exhausted', emoji: '💤', text: 'Exhausted!', check: (h, hp, e) => e <= 10 },
    { id: 'sad',       emoji: '😢', text: 'Sad...',      check: (h, hp, e) => hp <= 25 },
    { id: 'hurt',      emoji: '🤕', text: 'Hurt!',      check: (h, hp, e) => hp <= 10 },
    { id: 'neutral',   emoji: '😐', text: 'Okay',       check: () => true }, // fallback
  ];

  let lastMoodId = null;

  function getPetMood() {
    const pet = window.S?.pet;
    if (!pet) return null;

    const hunger    = pet.hunger    ?? 50;
    const happiness = pet.happiness ?? 50;
    const energy    = pet.energy    ?? 50;

    // Check from most extreme to least
    // Priority: starving/exhausted/hurt first, then hungry/sleepy/sad, then happy states
    if (hunger <= 10)    return MOODS.find(m => m.id === 'starving');
    if (energy <= 10)    return MOODS.find(m => m.id === 'exhausted');
    if (happiness <= 10) return MOODS.find(m => m.id === 'hurt');
    if (hunger <= 25)    return MOODS.find(m => m.id === 'hungry');
    if (energy <= 25)    return MOODS.find(m => m.id === 'sleepy');
    if (happiness <= 25) return MOODS.find(m => m.id === 'sad');
    if (hunger > 85 && happiness > 85 && energy > 85) return MOODS.find(m => m.id === 'ecstatic');
    if (hunger > 65 && happiness > 65 && energy > 65) return MOODS.find(m => m.id === 'happy');
    return MOODS.find(m => m.id === 'neutral');
  }

  function initPetMood() {
    // Update mood bubble periodically
    updateMoodBubble();
    if (moodInterval) clearInterval(moodInterval);
    moodInterval = setInterval(updateMoodBubble, 3000);
  }

  function updateMoodBubble() {
    // Only show on pet-related pages (home/care)
    const nav = window.S?.nav;
    if (!nav || (nav !== 'home' && nav !== 'care')) {
      removeMoodBubble();
      return;
    }

    const mood = getPetMood();
    if (!mood) {
      removeMoodBubble();
      return;
    }

    // Find pet sprite element
    const sprite = document.querySelector('.pet-sprite, .pet-sprite-img, .pet-display');
    if (!sprite) return;

    // Ensure parent is positioned
    const parent = sprite.closest('.card, .pet-area, .page, [style]') || sprite.parentElement;
    if (parent && getComputedStyle(parent).position === 'static') {
      parent.style.position = 'relative';
    }

    let bubble = document.querySelector('.mood-bubble');
    const isNew = mood.id !== lastMoodId;

    if (!bubble) {
      bubble = document.createElement('div');
      bubble.className = 'mood-bubble' + (isNew ? ' mood-new' : '');
      (parent || sprite.parentElement).appendChild(bubble);
    }

    if (isNew) {
      bubble.className = 'mood-bubble mood-new';
      lastMoodId = mood.id;
    }

    // Position above and to the right of the pet sprite
    const spriteRect = sprite.getBoundingClientRect();
    const parentRect = (parent || sprite.parentElement).getBoundingClientRect();

    bubble.style.top = (spriteRect.top - parentRect.top - 10) + 'px';
    bubble.style.left = (spriteRect.left - parentRect.left + spriteRect.width - 10) + 'px';

    bubble.innerHTML = `
      <div class="mood-bubble-inner">
        ${mood.emoji}
        <span class="mood-text">${mood.text}</span>
      </div>
    `;
  }

  function removeMoodBubble() {
    const bubble = document.querySelector('.mood-bubble');
    if (bubble) bubble.remove();
    lastMoodId = null;
  }

})();
