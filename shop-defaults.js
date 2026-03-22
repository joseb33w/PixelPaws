/* ═══════════════════════════════════════════
   PixelPaws — Default Shop Items
   Fallback items when database is empty
   ═══════════════════════════════════════════ */
(function() {
  'use strict';

  window.DEFAULT_SHOP_ITEMS = [
    // ── Food ──
    { id:'default-food-1', name:'Pixel Kibble', category:'Food', price:10, icon:'🍖', description:'Basic pet food. Restores 15 hunger.', effect_stat:'hunger', effect_value:15, rarity:'common' },
    { id:'default-food-2', name:'Golden Apple', category:'Food', price:25, icon:'🍎', description:'Juicy fruit! Restores 30 hunger.', effect_stat:'hunger', effect_value:30, rarity:'uncommon' },
    { id:'default-food-3', name:'Dragon Steak', category:'Food', price:60, icon:'🥩', description:'Premium meat. Restores 50 hunger.', effect_stat:'hunger', effect_value:50, rarity:'rare' },
    { id:'default-food-4', name:'Rainbow Cake', category:'Food', price:100, icon:'🍰', description:'Legendary dessert! Full hunger restore.', effect_stat:'hunger', effect_value:100, rarity:'legendary' },

    // ── Toys ──
    { id:'default-toy-1', name:'Bouncy Ball', category:'Toys', price:15, icon:'🏀', description:'A fun ball to play with. +15 happiness.', effect_stat:'happiness', effect_value:15, rarity:'common' },
    { id:'default-toy-2', name:'Pixel Frisbee', category:'Toys', price:30, icon:'🥏', description:'Throw and fetch! +30 happiness.', effect_stat:'happiness', effect_value:30, rarity:'uncommon' },
    { id:'default-toy-3', name:'Enchanted Teddy', category:'Toys', price:65, icon:'🧸', description:'A magical companion. +50 happiness.', effect_stat:'happiness', effect_value:50, rarity:'rare' },
    { id:'default-toy-4', name:'Legendary Yarn', category:'Toys', price:120, icon:'🧶', description:'Infinite entertainment! Full happiness.', effect_stat:'happiness', effect_value:100, rarity:'legendary' },

    // ── Healing ──
    { id:'default-heal-1', name:'Bandage', category:'Healing', price:15, icon:'🩹', description:'Basic first aid. Restores 15 HP.', effect_stat:'hp', effect_value:15, rarity:'common' },
    { id:'default-heal-2', name:'Health Potion', category:'Healing', price:35, icon:'🧪', description:'Bubbling potion. Restores 35 HP.', effect_stat:'hp', effect_value:35, rarity:'uncommon' },
    { id:'default-heal-3', name:'Elixir of Life', category:'Healing', price:75, icon:'⚗️', description:'Powerful brew. Restores 60 HP.', effect_stat:'hp', effect_value:60, rarity:'rare' },
    { id:'default-heal-4', name:'Phoenix Feather', category:'Healing', price:150, icon:'🪶', description:'Full restoration! Heals all HP.', effect_stat:'hp', effect_value:999, rarity:'legendary' },

    // ── Gear (stat boosts) ──
    { id:'default-gear-1', name:'Iron Shield', category:'Gear', price:40, icon:'🛡️', description:'Sturdy protection. +3 DEF permanently.', effect_stat:'defense', effect_value:3, rarity:'common' },
    { id:'default-gear-2', name:'Power Gloves', category:'Gear', price:50, icon:'🥊', description:'Hit harder! +3 ATK permanently.', effect_stat:'attack', effect_value:3, rarity:'uncommon' },
    { id:'default-gear-3', name:'Swift Boots', category:'Gear', price:55, icon:'👟', description:'Move faster! +3 SPD permanently.', effect_stat:'speed', effect_value:3, rarity:'rare' },
    { id:'default-gear-4', name:'Vitality Gem', category:'Gear', price:80, icon:'💎', description:'Boost max HP by 15 permanently.', effect_stat:'max_hp', effect_value:15, rarity:'rare' }
  ];
})();
