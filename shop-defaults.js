/* ═══════════════════════════════════════════
   PixelPaws — Default Shop Items
   Fallback items when database is empty
   ═══════════════════════════════════════════ */
(function() {
  'use strict';

  window.DEFAULT_SHOP_ITEMS = [
    // —— Food ——
    { id:'default-food-1', name:'Pixel Kibble', category:'food', item_type:'food', price:10, icon:'🍖', description:'Basic pet food. Restores 15 hunger.', effect_stat:'hunger', effect_value:15, rarity:'common' },
    { id:'default-food-2', name:'Golden Apple', category:'food', item_type:'food', price:25, icon:'🍎', description:'Juicy fruit! Restores 30 hunger.', effect_stat:'hunger', effect_value:30, rarity:'uncommon' },
    { id:'default-food-3', name:'Dragon Steak', category:'food', item_type:'food', price:60, icon:'🥩', description:'Premium meat. Restores 50 hunger.', effect_stat:'hunger', effect_value:50, rarity:'rare' },
    { id:'default-food-4', name:'Rainbow Cake', category:'food', item_type:'food', price:100, icon:'🎂', description:'Legendary dessert! Full hunger restore.', effect_stat:'hunger', effect_value:100, rarity:'legendary' },
    { id:'default-food-5', name:'Star Cookie', category:'food', item_type:'food', price:15, icon:'🍪', description:'A sparkly cookie. Restores 20 hunger.', effect_stat:'hunger', effect_value:20, rarity:'common' },
    { id:'default-food-6', name:'Mystic Berries', category:'food', item_type:'food', price:40, icon:'🫐', description:'Enchanted berries. Restores 40 hunger.', effect_stat:'hunger', effect_value:40, rarity:'uncommon' },

    // —— Toys ——
    { id:'default-toy-1', name:'Bouncy Ball', category:'toy', item_type:'toy', price:15, icon:'🏀', description:'A fun ball to play with. +15 happiness.', effect_stat:'happiness', effect_value:15, rarity:'common' },
    { id:'default-toy-2', name:'Pixel Frisbee', category:'toy', item_type:'toy', price:30, icon:'🥏', description:'Throw and fetch! +30 happiness.', effect_stat:'happiness', effect_value:30, rarity:'uncommon' },
    { id:'default-toy-3', name:'Enchanted Teddy', category:'toy', item_type:'toy', price:65, icon:'🧸', description:'A magical companion. +50 happiness.', effect_stat:'happiness', effect_value:50, rarity:'rare' },
    { id:'default-toy-4', name:'Legendary Yarn', category:'toy', item_type:'toy', price:120, icon:'🧶', description:'Infinite entertainment! Full happiness.', effect_stat:'happiness', effect_value:100, rarity:'legendary' },
    { id:'default-toy-5', name:'Rubber Ducky', category:'toy', item_type:'toy', price:12, icon:'🦆', description:'Squeaky bath friend. +12 happiness.', effect_stat:'happiness', effect_value:12, rarity:'common' },

    // —— Healing ——
    { id:'default-heal-1', name:'Bandage', category:'healing', item_type:'healing', price:15, icon:'🩹', description:'Basic first aid. Restores 15 HP.', effect_stat:'hp', effect_value:15, rarity:'common' },
    { id:'default-heal-2', name:'Health Potion', category:'healing', item_type:'healing', price:35, icon:'🧪', description:'Bubbling potion. Restores 35 HP.', effect_stat:'hp', effect_value:35, rarity:'uncommon' },
    { id:'default-heal-3', name:'Elixir of Life', category:'healing', item_type:'healing', price:75, icon:'⚗️', description:'Powerful brew. Restores 60 HP.', effect_stat:'hp', effect_value:60, rarity:'rare' },
    { id:'default-heal-4', name:'Phoenix Feather', category:'healing', item_type:'healing', price:150, icon:'🪶', description:'Full restoration! Heals all HP.', effect_stat:'hp', effect_value:999, rarity:'legendary' },
    { id:'default-heal-5', name:'Herbal Tea', category:'healing', item_type:'healing', price:20, icon:'🍵', description:'Soothing brew. Restores 20 HP.', effect_stat:'hp', effect_value:20, rarity:'common' },

    // —— Gear (stat boosts) ——
    { id:'default-gear-1', name:'Iron Shield', category:'gear', item_type:'gear', price:40, icon:'🛡️', description:'Sturdy protection. +3 DEF permanently.', effect_stat:'defense', effect_value:3, rarity:'common' },
    { id:'default-gear-2', name:'Power Gloves', category:'gear', item_type:'gear', price:50, icon:'🥊', description:'Hit harder! +3 ATK permanently.', effect_stat:'attack', effect_value:3, rarity:'uncommon' },
    { id:'default-gear-3', name:'Swift Boots', category:'gear', item_type:'gear', price:55, icon:'👟', description:'Move faster! +3 SPD permanently.', effect_stat:'speed', effect_value:3, rarity:'rare' },
    { id:'default-gear-4', name:'Vitality Gem', category:'gear', item_type:'gear', price:80, icon:'💎', description:'Boost max HP by 15 permanently.', effect_stat:'max_hp', effect_value:15, rarity:'rare' },
    { id:'default-gear-5', name:'Shadow Cloak', category:'gear', item_type:'gear', price:90, icon:'🧥', description:'Evasion boost! +5 SPD permanently.', effect_stat:'speed', effect_value:5, rarity:'rare' },
    { id:'default-gear-6', name:'Dragon Fang', category:'gear', item_type:'gear', price:130, icon:'🦷', description:'Legendary weapon. +8 ATK permanently.', effect_stat:'attack', effect_value:8, rarity:'legendary' }
  ];
})();
