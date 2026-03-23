(function(){
'use strict';

/* ═══════════════════════════════════════════
   PixelPaws — Weather-Based Events System
   Weather quests, limited shop items, event banner
   ═══════════════════════════════════════════ */

const SUPABASE_URL = 'https://xhhmxabftbyxrirvvihn.supabase.co';
const SUPABASE_KEY = 'sb_publishable_NZHoIxqqpSvVBP8MrLHCYA_gmg1AbN-';
const T_WEATHER_QUESTS = 'uNMexs7BYTXQ2_pixelpaws_weather_quest_completions';
const T_PETS = 'uNMexs7BYTXQ2_pixelpaws_pets';

let sb = null;

// ── Weather Quest Definitions ──
const WEATHER_QUESTS = {
  Clear: [
    { id: 'clear_sunbathe', name: 'Sunbathing', icon: '☀️', desc: 'Let your pet soak up the rays', coins: 25, xp: 15, duration: 'Instant' },
    { id: 'clear_rainbow', name: 'Rainbow Chase', icon: '🌈', desc: 'Chase the rainbow across the park', coins: 45, xp: 30, duration: '~2 min' }
  ],
  Cloudy: [
    { id: 'cloudy_gaze', name: 'Cloud Gazer', icon: '☁️', desc: 'Spot shapes in the clouds', coins: 20, xp: 15, duration: 'Instant' },
    { id: 'cloudy_wind', name: 'Wind Rider', icon: '🌬️', desc: 'Ride the gusty winds', coins: 35, xp: 20, duration: '~1 min' }
  ],
  Rain: [
    { id: 'rain_puddle', name: 'Puddle Splasher', icon: '💧', desc: 'Splash in every puddle you find', coins: 30, xp: 20, duration: 'Instant' },
    { id: 'rain_umbrella', name: 'Umbrella Hunt', icon: '☂️', desc: 'Find the lost umbrella in the park', coins: 40, xp: 25, duration: '~2 min' }
  ],
  Snow: [
    { id: 'snow_snowball', name: 'Snowball Fight', icon: '⛄', desc: 'Win a snowball fight!', coins: 35, xp: 25, duration: 'Instant' },
    { id: 'snow_crystal', name: 'Ice Crystal Search', icon: '❄️', desc: 'Find rare ice crystals', coins: 50, xp: 30, duration: '~3 min' }
  ],
  Storm: [
    { id: 'storm_chase', name: 'Storm Chaser', icon: '🌪️', desc: 'Brave the storm for treasure', coins: 60, xp: 40, duration: 'Instant' },
    { id: 'storm_lightning', name: 'Lightning Dodger', icon: '⚡', desc: 'Dodge lightning bolts!', coins: 75, xp: 50, duration: '~2 min' }
  ]
};

// ── Weather Shop Items ──
const WEATHER_SHOP = {
  Clear: [
    { id: 'ws_sunglasses', name: 'Sunglasses', icon: '🕶️', category: 'gear', price: 50, desc: '+3 happiness when sunny', effect_stat: 'happiness', effect_value: 3, rarity: 'common' },
    { id: 'ws_sunscreen', name: 'Sunscreen', icon: '🧴', category: 'healing', price: 35, desc: 'Protect from sunburn, +5 HP', effect_stat: 'hp', effect_value: 5, rarity: 'common' },
    { id: 'ws_beachball', name: 'Beach Ball', icon: '🏖️', category: 'toy', price: 40, desc: 'Fun in the sun! +4 happiness', effect_stat: 'happiness', effect_value: 4, rarity: 'uncommon' }
  ],
  Cloudy: [
    { id: 'ws_windchime', name: 'Wind Chime', icon: '🎐', category: 'toy', price: 55, desc: 'Soothing sounds, +3 happiness', effect_stat: 'happiness', effect_value: 3, rarity: 'uncommon' },
    { id: 'ws_cloudpillow', name: 'Cloud Pillow', icon: '☁️', category: 'toy', price: 45, desc: 'Soft as a cloud! +5 energy', effect_stat: 'energy', effect_value: 5, rarity: 'common' }
  ],
  Rain: [
    { id: 'ws_umbrella', name: 'Umbrella', icon: '☂️', category: 'gear', price: 80, desc: 'Stay dry! +2 all stats in rain', effect_stat: 'happiness', effect_value: 2, rarity: 'uncommon' },
    { id: 'ws_rainboots', name: 'Rain Boots', icon: '🥾', category: 'gear', price: 60, desc: 'Splash-proof +3 energy', effect_stat: 'energy', effect_value: 3, rarity: 'common' },
    { id: 'ws_puddletoy', name: 'Puddle Splash Toy', icon: '💦', category: 'toy', price: 40, desc: 'Splashy fun! +4 happiness', effect_stat: 'happiness', effect_value: 4, rarity: 'common' }
  ],
  Snow: [
    { id: 'ws_snowboots', name: 'Snow Boots', icon: '🥾', category: 'gear', price: 70, desc: 'Warm paws! +4 energy', effect_stat: 'energy', effect_value: 4, rarity: 'uncommon' },
    { id: 'ws_snowball', name: 'Snowball', icon: '🤍', category: 'toy', price: 30, desc: 'Throw it! +3 happiness', effect_stat: 'happiness', effect_value: 3, rarity: 'common' },
    { id: 'ws_hotcocoa', name: 'Hot Cocoa', icon: '☕', category: 'food', price: 45, desc: 'Warm & cozy, +6 hunger +3 happiness', effect_stat: 'hunger', effect_value: 6, rarity: 'uncommon' }
  ],
  Storm: [
    { id: 'ws_thundercloak', name: 'Thunder Cloak', icon: '🧥', category: 'gear', price: 150, desc: 'Harness the storm! +5 all stats', effect_stat: 'happiness', effect_value: 5, rarity: 'rare' },
    { id: 'ws_lightningrod', name: 'Lightning Rod', icon: '🔱', category: 'gear', price: 200, desc: 'Channel lightning power! +8 energy', effect_stat: 'energy', effect_value: 8, rarity: 'legendary' }
  ]
};

// ── Weather Event Names & Themes ──
const WEATHER_EVENTS = {
  Clear:  { name: 'Sunny Day Festival', color: '#FFD700', gradient: 'linear-gradient(135deg, #FFF3B0, #FFD700)', glow: 'rgba(255,215,0,0.3)' },
  Cloudy: { name: 'Misty Breeze Event', color: '#90A4AE', gradient: 'linear-gradient(135deg, #CFD8DC, #90A4AE)', glow: 'rgba(144,164,174,0.3)' },
  Rain:   { name: 'Raindrop Rally', color: '#42A5F5', gradient: 'linear-gradient(135deg, #BBDEFB, #42A5F5)', glow: 'rgba(66,165,245,0.3)' },
  Snow:   { name: 'Frostbite Fiesta', color: '#E0F7FA', gradient: 'linear-gradient(135deg, #E0F7FA, #80DEEA)', glow: 'rgba(224,247,250,0.4)' },
  Storm:  { name: 'Thunderstrike Event', color: '#CE93D8', gradient: 'linear-gradient(135deg, #E1BEE7, #CE93D8)', glow: 'rgba(206,147,216,0.4)' }
};

const WEATHER_ICONS = { Clear: '☀️', Cloudy: '⛅', Rain: '🌧️', Snow: '❄️', Storm: '⛈️' };

// ── Local Cache Keys ──
const CACHE_KEY = 'pp_weather_quest_completions';

function todayStr() { return new Date().toISOString().split('T')[0]; }

function getCachedCompletions() {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return {};
    const data = JSON.parse(raw);
    if (data._date !== todayStr()) { localStorage.removeItem(CACHE_KEY); return {}; }
    return data;
  } catch(e) { return {}; }
}

function setCachedCompletion(questId) {
  const data = getCachedCompletions();
  data._date = todayStr();
  data[questId] = true;
  localStorage.setItem(CACHE_KEY, JSON.stringify(data));
}

function isQuestCompletedToday(questId) {
  return !!getCachedCompletions()[questId];
}

// ── Inject CSS ──
function injectStyles() {
  const style = document.createElement('style');
  style.textContent = `
    /* ═══ Weather Event Banner ═══ */
    .we-banner {
      position: relative; overflow: hidden;
      border-radius: 12px; padding: 14px 16px;
      margin: 10px 12px 6px; cursor: pointer;
      border: 2px solid rgba(255,255,255,0.15);
      transition: transform 0.2s, box-shadow 0.2s;
    }
    .we-banner:active { transform: scale(0.97); }
    .we-banner-bg {
      position: absolute; inset: 0; opacity: 0.18;
      background-size: 40px 40px;
      background-image:
        linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
        linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px);
      pointer-events: none;
    }
    .we-banner-content {
      position: relative; z-index: 1;
      display: flex; align-items: center; gap: 12px;
    }
    .we-banner-icon {
      font-size: 2rem; flex-shrink: 0;
      animation: weBannerPulse 2s ease-in-out infinite;
    }
    @keyframes weBannerPulse {
      0%,100% { transform: scale(1); }
      50% { transform: scale(1.15); }
    }
    .we-banner-info { flex: 1; min-width: 0; }
    .we-banner-title {
      font-family: var(--font-pixel, 'Press Start 2P', monospace);
      font-size: 9px; font-weight: 700; color: #fff;
      text-shadow: 1px 1px 2px rgba(0,0,0,0.5);
      line-height: 1.4;
    }
    .we-banner-sub {
      font-size: 10px; color: rgba(255,255,255,0.85);
      margin-top: 3px;
    }
    .we-banner-arrow {
      font-size: 1.2rem; color: rgba(255,255,255,0.6);
      flex-shrink: 0;
    }
    .we-banner-badge {
      position: absolute; top: -4px; right: -4px;
      background: var(--pixel-red, #ff4757); color: #fff;
      font-family: var(--font-pixel, 'Press Start 2P', monospace);
      font-size: 7px; padding: 3px 6px;
      border-radius: 8px; z-index: 2;
      box-shadow: 0 2px 6px rgba(255,71,87,0.5);
      animation: weBadgeBounce 1s ease infinite;
    }
    @keyframes weBadgeBounce {
      0%,100% { transform: scale(1); }
      50% { transform: scale(1.1); }
    }

    /* ═══ Weather Quest Panel (overlay) ═══ */
    .we-overlay {
      position: fixed; inset: 0; z-index: 9999;
      background: rgba(0,0,0,0.75);
      backdrop-filter: blur(6px);
      display: flex; align-items: flex-end; justify-content: center;
      animation: weFadeIn 0.25s ease;
    }
    @keyframes weFadeIn {
      from { opacity: 0; } to { opacity: 1; }
    }
    .we-panel {
      width: 100%; max-width: 440px;
      max-height: 85vh; overflow-y: auto;
      background: var(--panel, #1a1a2e);
      border-top-left-radius: 20px;
      border-top-right-radius: 20px;
      border: 1px solid var(--border, rgba(255,255,255,0.08));
      border-bottom: none;
      padding: 0 0 env(safe-area-inset-bottom, 20px);
      animation: weSlideUp 0.3s ease;
    }
    @keyframes weSlideUp {
      from { transform: translateY(100%); }
      to { transform: translateY(0); }
    }
    .we-panel-handle {
      text-align: center; padding: 10px 0 6px;
    }
    .we-panel-handle span {
      display: inline-block; width: 40px; height: 4px;
      background: rgba(255,255,255,0.2); border-radius: 2px;
    }
    .we-panel-header {
      padding: 8px 18px 14px; text-align: center;
    }
    .we-panel-event-icon { font-size: 2.5rem; margin-bottom: 4px; }
    .we-panel-event-name {
      font-family: var(--font-pixel, 'Press Start 2P', monospace);
      font-size: 11px; color: #fff;
      text-shadow: 1px 1px 3px rgba(0,0,0,0.5);
    }
    .we-panel-event-sub {
      font-size: 10px; color: var(--text-dim, #888);
      margin-top: 4px;
    }

    /* ── Quest Cards ── */
    .we-section-label {
      font-family: var(--font-pixel, 'Press Start 2P', monospace);
      font-size: 8px; color: var(--pixel-cyan, #00f0ff);
      padding: 0 18px; margin: 12px 0 8px;
      text-transform: uppercase; letter-spacing: 0.08em;
    }
    .we-quest {
      margin: 0 14px 10px; padding: 14px;
      background: var(--panel-light, rgba(255,255,255,0.04));
      border: 1px solid var(--border, rgba(255,255,255,0.08));
      border-radius: 12px;
      display: flex; align-items: flex-start; gap: 12px;
      transition: all 0.2s;
    }
    .we-quest.we-quest-done {
      opacity: 0.55; pointer-events: none;
    }
    .we-quest-icon { font-size: 1.8rem; flex-shrink: 0; margin-top: 2px; }
    .we-quest-info { flex: 1; min-width: 0; }
    .we-quest-name {
      font-family: var(--font-pixel, 'Press Start 2P', monospace);
      font-size: 9px; color: #fff; margin-bottom: 4px;
    }
    .we-quest-desc {
      font-size: 11px; color: var(--text-dim, #888);
      line-height: 1.4; margin-bottom: 8px;
    }
    .we-quest-rewards {
      display: flex; gap: 10px; flex-wrap: wrap;
    }
    .we-quest-reward {
      font-family: var(--font-pixel, 'Press Start 2P', monospace);
      font-size: 7px; padding: 3px 8px;
      border-radius: 6px;
      background: rgba(255,255,255,0.06);
      border: 1px solid rgba(255,255,255,0.1);
    }
    .we-quest-reward.coin { color: var(--pixel-yellow, #ffd32a); }
    .we-quest-reward.xp { color: var(--pixel-green, #0be881); }
    .we-quest-reward.time { color: var(--text-dim, #888); }
    .we-quest-btn {
      flex-shrink: 0; align-self: center;
      padding: 8px 14px; border: none; border-radius: 8px;
      font-family: var(--font-pixel, 'Press Start 2P', monospace);
      font-size: 7px; cursor: pointer;
      color: #000; font-weight: 700;
      transition: all 0.2s;
    }
    .we-quest-btn:active { transform: scale(0.93); }
    .we-quest-btn.start-btn {
      background: linear-gradient(135deg, var(--pixel-green, #0be881), var(--pixel-cyan, #00f0ff));
      box-shadow: 0 3px 12px rgba(11,232,129,0.3);
    }
    .we-quest-btn.done-btn {
      background: rgba(255,255,255,0.1); color: var(--pixel-green, #0be881);
      cursor: default;
    }

    /* ── Weather Shop Section ── */
    .we-shop-section {
      margin: 12px 14px 10px; padding: 14px;
      background: var(--panel-light, rgba(255,255,255,0.04));
      border: 1px solid var(--border, rgba(255,255,255,0.08));
      border-radius: 12px;
    }
    .we-shop-label {
      font-family: var(--font-pixel, 'Press Start 2P', monospace);
      font-size: 8px; margin-bottom: 10px;
      display: flex; align-items: center; gap: 6px;
    }
    .we-shop-items {
      display: flex; gap: 8px; overflow-x: auto;
      padding-bottom: 6px;
      -webkit-overflow-scrolling: touch;
      scrollbar-width: none;
    }
    .we-shop-items::-webkit-scrollbar { display: none; }
    .we-shop-item {
      flex-shrink: 0; width: 110px;
      padding: 12px 10px; text-align: center;
      background: rgba(255,255,255,0.03);
      border: 1px solid rgba(255,255,255,0.08);
      border-radius: 10px;
      cursor: pointer; transition: all 0.2s;
    }
    .we-shop-item:active { transform: scale(0.95); }
    .we-shop-item-icon { font-size: 1.8rem; margin-bottom: 6px; }
    .we-shop-item-name {
      font-family: var(--font-pixel, 'Press Start 2P', monospace);
      font-size: 7px; color: #fff;
      margin-bottom: 4px; line-height: 1.3;
    }
    .we-shop-item-price {
      font-family: var(--font-pixel, 'Press Start 2P', monospace);
      font-size: 8px; color: var(--pixel-yellow, #ffd32a);
    }
    .we-shop-item-rarity {
      font-size: 7px; margin-top: 3px;
      text-transform: uppercase; letter-spacing: 0.06em;
    }
    .we-shop-item-rarity.r-common { color: #aaa; }
    .we-shop-item-rarity.r-uncommon { color: var(--pixel-green, #0be881); }
    .we-shop-item-rarity.r-rare { color: var(--pixel-cyan, #00f0ff); }
    .we-shop-item-rarity.r-legendary { color: var(--pixel-yellow, #ffd32a); }

    /* ── Shop Inject Banner (inside main shop page) ── */
    .we-shop-inject {
      margin: 8px 0 12px;
      padding: 12px 14px;
      border-radius: 12px;
      border: 1.5px dashed rgba(255,255,255,0.15);
      position: relative; overflow: hidden;
    }
    .we-shop-inject-bg {
      position: absolute; inset: 0; opacity: 0.12;
      background-size: 30px 30px;
      background-image:
        linear-gradient(rgba(255,255,255,0.08) 1px, transparent 1px),
        linear-gradient(90deg, rgba(255,255,255,0.08) 1px, transparent 1px);
      pointer-events: none;
    }
    .we-shop-inject-header {
      position: relative; z-index: 1;
      display: flex; align-items: center; gap: 8px;
      margin-bottom: 10px;
    }
    .we-shop-inject-title {
      font-family: var(--font-pixel, 'Press Start 2P', monospace);
      font-size: 8px;
    }
    .we-shop-inject-tag {
      font-family: var(--font-pixel, 'Press Start 2P', monospace);
      font-size: 6px; padding: 2px 6px;
      border-radius: 4px;
      background: rgba(255,71,87,0.2); color: #ff4757;
      animation: weBadgeBounce 1.5s ease infinite;
    }
    .we-shop-inject .we-shop-items { position: relative; z-index: 1; }

    /* ── Quest Complete Toast ── */
    .we-toast {
      position: fixed; top: 70px;
      left: 50%; transform: translateX(-50%);
      padding: 12px 20px; border-radius: 12px;
      z-index: 10000;
      font-family: var(--font-pixel, 'Press Start 2P', monospace);
      font-size: 8px; color: #fff;
      display: flex; align-items: center; gap: 10px;
      box-shadow: 0 6px 24px rgba(0,0,0,0.5);
      animation: weToastIn 0.4s ease, weToastOut 0.4s ease 2.6s forwards;
      white-space: nowrap;
    }
    @keyframes weToastIn {
      from { opacity: 0; transform: translateX(-50%) translateY(-16px) scale(0.9); }
      to { opacity: 1; transform: translateX(-50%) translateY(0) scale(1); }
    }
    @keyframes weToastOut {
      to { opacity: 0; transform: translateX(-50%) translateY(-16px); }
    }
    .we-toast-icon { font-size: 1.4rem; }
    .we-toast-text { line-height: 1.5; }
    .we-toast-coins { color: var(--pixel-yellow, #ffd32a); }
    .we-toast-xp { color: var(--pixel-green, #0be881); }

    /* ── Purchase Confirm Modal ── */
    .we-purchase-modal {
      position: fixed; inset: 0; z-index: 10001;
      background: rgba(0,0,0,0.7);
      backdrop-filter: blur(4px);
      display: flex; align-items: center; justify-content: center;
      animation: weFadeIn 0.2s ease;
    }
    .we-purchase-card {
      background: var(--panel, #1a1a2e);
      border: 1px solid var(--border, rgba(255,255,255,0.08));
      border-radius: 16px; padding: 24px;
      text-align: center; max-width: 300px; width: 85%;
    }
    .we-purchase-icon { font-size: 3rem; margin-bottom: 8px; }
    .we-purchase-name {
      font-family: var(--font-pixel, 'Press Start 2P', monospace);
      font-size: 10px; color: #fff; margin-bottom: 4px;
    }
    .we-purchase-desc {
      font-size: 11px; color: var(--text-dim, #888);
      margin-bottom: 12px; line-height: 1.4;
    }
    .we-purchase-price {
      font-family: var(--font-pixel, 'Press Start 2P', monospace);
      font-size: 12px; color: var(--pixel-yellow, #ffd32a);
      margin-bottom: 16px;
    }
    .we-purchase-btns { display: flex; gap: 8px; justify-content: center; }
    .we-purchase-btns button {
      padding: 10px 18px; border: none; border-radius: 8px;
      font-family: var(--font-pixel, 'Press Start 2P', monospace);
      font-size: 8px; cursor: pointer; transition: all 0.2s;
    }
    .we-purchase-btns button:active { transform: scale(0.93); }
    .we-purchase-buy {
      background: linear-gradient(135deg, var(--pixel-green, #0be881), var(--pixel-cyan, #00f0ff));
      color: #000; font-weight: 700;
    }
    .we-purchase-cancel {
      background: rgba(255,255,255,0.08); color: var(--text-dim, #888);
    }
  `;
  document.head.appendChild(style);
}

// ═══════════════════════════════════
//  Helpers
// ═══════════════════════════════════
function getWeather() {
  return (window.S && window.S.weather) ? window.S.weather.condition : null;
}

function getPet() {
  return window.S ? window.S.pet : null;
}

function getCurrentNav() {
  return window.S ? window.S.nav : null;
}

function esc(s) {
  const d = document.createElement('div');
  d.textContent = s;
  return d.innerHTML;
}

function showWeatherToast(icon, msg, coins, xp) {
  const old = document.querySelector('.we-toast');
  if (old) old.remove();
  const t = document.createElement('div');
  t.className = 'we-toast';
  const evt = WEATHER_EVENTS[getWeather()] || WEATHER_EVENTS.Clear;
  t.style.background = evt.gradient;
  t.style.border = '1px solid ' + evt.color;
  t.innerHTML = `
    <span class="we-toast-icon">${icon}</span>
    <span class="we-toast-text">
      ${esc(msg)}<br>
      <span class="we-toast-coins">+${coins} 🪙</span> 
      <span class="we-toast-xp">+${xp} ⭐</span>
    </span>
  `;
  document.body.appendChild(t);
  setTimeout(() => { if (t.parentNode) t.remove(); }, 3200);
}

// ═══════════════════════════════════
//  Quest Completion Logic
// ═══════════════════════════════════
async function completeQuest(quest) {
  const pet = getPet();
  if (!pet || !sb) return;
  if (isQuestCompletedToday(quest.id)) return;

  const weather = getWeather();
  if (!weather) return;

  // Mark completed locally
  setCachedCompletion(quest.id);

  // Save to DB
  try {
    const { data: { user } } = await sb.auth.getUser();
    if (user) {
      await sb.from(T_WEATHER_QUESTS).insert({
        quest_id: quest.id,
        weather_condition: weather,
        quest_date: todayStr(),
        xp_earned: quest.xp,
        coins_earned: quest.coins
      });
    }
  } catch(e) { console.error('WeatherEvents: quest save error', e); }

  // Award coins & XP to pet
  try {
    const newCoins = (pet.coins || 0) + quest.coins;
    const newXP = (pet.xp || 0) + quest.xp;
    await sb.from(T_PETS).update({ coins: newCoins, xp: newXP }).eq('id', pet.id);
    pet.coins = newCoins;
    pet.xp = newXP;
  } catch(e) { console.error('WeatherEvents: reward error', e); }

  showWeatherToast(quest.icon, `${quest.name} Complete!`, quest.coins, quest.xp);

  // Re-render the panel if open
  setTimeout(() => {
    const panel = document.querySelector('.we-panel');
    if (panel) openWeatherPanel();
    if (typeof window.render === 'function') window.render();
  }, 400);
}

// ═══════════════════════════════════
//  Weather Shop Purchase
// ═══════════════════════════════════
function showPurchaseModal(item) {
  const pet = getPet();
  if (!pet) return;

  const existing = document.querySelector('.we-purchase-modal');
  if (existing) existing.remove();

  const canAfford = (pet.coins || 0) >= item.price;

  const modal = document.createElement('div');
  modal.className = 'we-purchase-modal';
  modal.innerHTML = `
    <div class="we-purchase-card">
      <div class="we-purchase-icon">${item.icon}</div>
      <div class="we-purchase-name">${esc(item.name)}</div>
      <div class="we-purchase-desc">${esc(item.desc)}</div>
      <div class="we-purchase-price">🪙 ${item.price}</div>
      ${!canAfford ? '<div style="font-size:10px;color:var(--pixel-red,#ff4757);margin-bottom:12px;">Not enough coins!</div>' : ''}
      <div class="we-purchase-btns">
        ${canAfford ? '<button class="we-purchase-buy" data-action="buy">Buy</button>' : ''}
        <button class="we-purchase-cancel" data-action="cancel">Cancel</button>
      </div>
    </div>
  `;
  document.body.appendChild(modal);

  modal.addEventListener('click', async (e) => {
    const action = e.target.dataset.action;
    if (action === 'cancel' || e.target === modal) {
      modal.remove(); return;
    }
    if (action === 'buy') {
      await purchaseWeatherItem(item);
      modal.remove();
    }
  });
}

async function purchaseWeatherItem(item) {
  const pet = getPet();
  if (!pet || !sb) return;
  if ((pet.coins || 0) < item.price) return;

  try {
    // Deduct coins
    const newCoins = pet.coins - item.price;
    await sb.from(T_PETS).update({ coins: newCoins }).eq('id', pet.id);
    pet.coins = newCoins;

    // Apply effect
    if (item.effect_stat && item.effect_value) {
      const stat = item.effect_stat;
      if (pet[stat] !== undefined) {
        const newVal = Math.min((pet[stat] || 0) + item.effect_value, 100);
        const upd = {};
        upd[stat] = newVal;
        await sb.from(T_PETS).update(upd).eq('id', pet.id);
        pet[stat] = newVal;
      }
    }

    showWeatherToast(item.icon, `Bought ${item.name}!`, 0, 0);
    // Override toast text for purchase
    const toast = document.querySelector('.we-toast');
    if (toast) {
      const txt = toast.querySelector('.we-toast-text');
      if (txt) txt.innerHTML = `Bought ${esc(item.name)}!<br><span style="color:var(--pixel-yellow,#ffd32a);">-${item.price} 🪙</span>`;
    }

    if (typeof window.render === 'function') window.render();
  } catch(e) {
    console.error('WeatherEvents: purchase error', e);
  }
}

// ═══════════════════════════════════
//  UI — Weather Event Banner (Home)
// ═══════════════════════════════════
function createBanner() {
  const weather = getWeather();
  if (!weather) return null;

  const evt = WEATHER_EVENTS[weather] || WEATHER_EVENTS.Clear;
  const quests = WEATHER_QUESTS[weather] || [];
  const available = quests.filter(q => !isQuestCompletedToday(q.id)).length;
  const icon = WEATHER_ICONS[weather] || '☀️';

  const banner = document.createElement('div');
  banner.className = 'we-banner';
  banner.style.background = evt.gradient;
  banner.style.boxShadow = '0 4px 20px ' + evt.glow;

  if (available > 0) {
    banner.innerHTML = `<div class="we-banner-badge">${available} NEW</div>`;
  }

  banner.innerHTML += `
    <div class="we-banner-bg"></div>
    <div class="we-banner-content">
      <span class="we-banner-icon">${icon}</span>
      <div class="we-banner-info">
        <div class="we-banner-title">${esc(evt.name)}</div>
        <div class="we-banner-sub">${available > 0 ? available + ' quest' + (available > 1 ? 's' : '') + ' available!' : 'All quests done today ✓'}</div>
      </div>
      <span class="we-banner-arrow">›</span>
    </div>
  `;

  banner.addEventListener('click', openWeatherPanel);
  return banner;
}

// ═══════════════════════════════════
//  UI — Weather Quest Panel (Overlay)
// ═══════════════════════════════════
function openWeatherPanel() {
  const old = document.querySelector('.we-overlay');
  if (old) old.remove();

  const weather = getWeather();
  if (!weather) return;

  const evt = WEATHER_EVENTS[weather] || WEATHER_EVENTS.Clear;
  const quests = WEATHER_QUESTS[weather] || [];
  const shopItems = WEATHER_SHOP[weather] || [];
  const icon = WEATHER_ICONS[weather] || '☀️';

  const overlay = document.createElement('div');
  overlay.className = 'we-overlay';

  let questsHTML = quests.map(q => {
    const done = isQuestCompletedToday(q.id);
    return `
      <div class="we-quest ${done ? 'we-quest-done' : ''}" data-quest-id="${q.id}">
        <div class="we-quest-icon">${q.icon}</div>
        <div class="we-quest-info">
          <div class="we-quest-name">${esc(q.name)}</div>
          <div class="we-quest-desc">${esc(q.desc)}</div>
          <div class="we-quest-rewards">
            <span class="we-quest-reward coin">🪙 ${q.coins}</span>
            <span class="we-quest-reward xp">⭐ ${q.xp} XP</span>
            <span class="we-quest-reward time">⏱ ${q.duration}</span>
          </div>
        </div>
        <button class="we-quest-btn ${done ? 'done-btn' : 'start-btn'}" ${done ? 'disabled' : ''} data-quest-id="${q.id}">
          ${done ? '✓ Done' : 'Go!'}
        </button>
      </div>
    `;
  }).join('');

  let shopHTML = '';
  if (shopItems.length > 0) {
    shopHTML = `
      <div class="we-section-label" style="color:${evt.color};">🛍️ Limited Weather Items</div>
      <div style="margin:0 14px 10px;">
        <div class="we-shop-items">
          ${shopItems.map(it => `
            <div class="we-shop-item" data-shop-id="${it.id}">
              <div class="we-shop-item-icon">${it.icon}</div>
              <div class="we-shop-item-name">${esc(it.name)}</div>
              <div class="we-shop-item-price">🪙 ${it.price}</div>
              <div class="we-shop-item-rarity r-${it.rarity}">${it.rarity}</div>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }

  overlay.innerHTML = `
    <div class="we-panel">
      <div class="we-panel-handle"><span></span></div>
      <div class="we-panel-header">
        <div class="we-panel-event-icon">${icon}</div>
        <div class="we-panel-event-name">${esc(evt.name)}</div>
        <div class="we-panel-event-sub">Weather-based quests & items • Resets daily</div>
      </div>

      <div class="we-section-label" style="color:${evt.color};">⚔️ Weather Quests</div>
      ${questsHTML}

      ${shopHTML}

      <div style="padding:14px 18px;">
        <button class="we-quest-btn start-btn" style="width:100%;padding:12px;font-size:8px;" data-action="close">Close</button>
      </div>
    </div>
  `;

  document.body.appendChild(overlay);

  // Bind quest start buttons
  overlay.querySelectorAll('.we-quest-btn.start-btn[data-quest-id]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const qId = btn.dataset.questId;
      const quest = quests.find(q => q.id === qId);
      if (quest) completeQuest(quest);
    });
  });

  // Bind shop items
  overlay.querySelectorAll('.we-shop-item').forEach(el => {
    el.addEventListener('click', () => {
      const sId = el.dataset.shopId;
      const item = shopItems.find(i => i.id === sId);
      if (item) showPurchaseModal(item);
    });
  });

  // Bind close
  overlay.querySelector('[data-action="close"]').addEventListener('click', () => overlay.remove());
  overlay.addEventListener('click', (e) => { if (e.target === overlay) overlay.remove(); });
}

// ═══════════════════════════════════
//  Inject into Main Shop Page
// ═══════════════════════════════════
function injectShopWeatherSection(shopContainer) {
  if (!shopContainer) return;
  if (shopContainer.querySelector('.we-shop-inject')) return; // already injected

  const weather = getWeather();
  if (!weather) return;

  const evt = WEATHER_EVENTS[weather] || WEATHER_EVENTS.Clear;
  const shopItems = WEATHER_SHOP[weather] || [];
  if (shopItems.length === 0) return;
  const icon = WEATHER_ICONS[weather] || '☀️';

  const section = document.createElement('div');
  section.className = 'we-shop-inject';
  section.style.background = evt.gradient.replace(')', ', 0.08)').replace('linear-gradient', 'linear-gradient');
  section.style.borderColor = evt.color + '40';

  section.innerHTML = `
    <div class="we-shop-inject-bg"></div>
    <div class="we-shop-inject-header">
      <span style="font-size:1.2rem;">${icon}</span>
      <span class="we-shop-inject-title" style="color:${evt.color};">${esc(evt.name)} Items</span>
      <span class="we-shop-inject-tag">LIMITED</span>
    </div>
    <div class="we-shop-items">
      ${shopItems.map(it => `
        <div class="we-shop-item" data-shop-id="${it.id}">
          <div class="we-shop-item-icon">${it.icon}</div>
          <div class="we-shop-item-name">${esc(it.name)}</div>
          <div class="we-shop-item-price">🪙 ${it.price}</div>
          <div class="we-shop-item-rarity r-${it.rarity}">${it.rarity}</div>
        </div>
      `).join('')}
    </div>
  `;

  // Bind shop items
  section.querySelectorAll('.we-shop-item').forEach(el => {
    el.addEventListener('click', () => {
      const sId = el.dataset.shopId;
      const item = shopItems.find(i => i.id === sId);
      if (item) showPurchaseModal(item);
    });
  });

  // Insert at top of shop
  shopContainer.insertBefore(section, shopContainer.firstChild);
}

// ═══════════════════════════════════
//  DOM Observer — Inject Banner & Shop
// ═══════════════════════════════════
function observeDOM() {
  let lastNav = null;
  let bannerInjected = false;
  let shopInjected = false;

  function tryInject() {
    const nav = getCurrentNav();
    if (nav !== lastNav) {
      lastNav = nav;
      bannerInjected = false;
      shopInjected = false;
    }

    // Inject banner on home tab
    if (nav === 'home' && !bannerInjected) {
      // Find the pet display area or top of content
      const topbar = document.querySelector('.topbar');
      const petArea = document.querySelector('.pet-area') || document.querySelector('.home-content');
      if (topbar && petArea) {
        // Insert banner just before pet area
        const existing = document.querySelector('.we-banner');
        if (!existing) {
          const banner = createBanner();
          if (banner) {
            petArea.parentNode.insertBefore(banner, petArea);
            bannerInjected = true;
          }
        } else {
          bannerInjected = true;
        }
      }
    }

    // Inject weather items into shop
    if (nav === 'shop' && !shopInjected) {
      // Look for the shop items container
      const shopGrid = document.querySelector('.shop-grid') || document.querySelector('.shop-items') || document.querySelector('[class*="shop"]');
      if (shopGrid) {
        const shopParent = shopGrid.parentNode;
        injectShopWeatherSection(shopParent);
        shopInjected = true;
      }
    }
  }

  // Run on DOM changes
  const observer = new MutationObserver(() => {
    requestAnimationFrame(tryInject);
  });
  observer.observe(document.getElementById('app') || document.body, {
    childList: true, subtree: true
  });

  // Also run periodically as fallback
  setInterval(tryInject, 1500);
}

// ═══════════════════════════════════
//  Sync completions from DB on load
// ═══════════════════════════════════
async function syncCompletionsFromDB() {
  if (!sb) return;
  try {
    const { data: { user } } = await sb.auth.getUser();
    if (!user) return;
    const today = todayStr();
    const { data } = await sb.from(T_WEATHER_QUESTS)
      .select('quest_id')
      .eq('user_id', user.id)
      .eq('quest_date', today);
    if (data && data.length > 0) {
      const cached = getCachedCompletions();
      cached._date = today;
      data.forEach(row => { cached[row.quest_id] = true; });
      localStorage.setItem(CACHE_KEY, JSON.stringify(cached));
    }
  } catch(e) { console.error('WeatherEvents: sync error', e); }
}

// ═══════════════════════════════════
//  Init
// ═══════════════════════════════════
async function init() {
  console.log('[WeatherEvents] Initializing...');
  injectStyles();

  // Create Supabase client
  try {
    const { createClient } = await import('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm');
    sb = createClient(SUPABASE_URL, SUPABASE_KEY);
  } catch(e) {
    console.error('WeatherEvents: Supabase init failed', e);
    return;
  }

  // Sync completions from DB
  await syncCompletionsFromDB();

  // Start observing DOM for injection points
  observeDOM();

  console.log('[WeatherEvents] Ready!');
}

// ── Poll for app readiness ──
let pollCount = 0;
function waitForApp() {
  if (window.S && window.render) {
    init();
  } else if (pollCount++ < 200) {
    setTimeout(waitForApp, 50);
  } else {
    console.warn('[WeatherEvents] Timed out waiting for app');
  }
}
waitForApp();

})();
