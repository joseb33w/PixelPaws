import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm'

const SUPABASE_URL = 'https://xhhmxabftbyxrirvvihn.supabase.co'
const SUPABASE_ANON_KEY = 'sb_publishable_NZHoIxqqpSvVBP8MrLHCYA_gmg1AbN-'
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, { auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true } })

/* ═══ Table Names ═══ */
const T = {
  users: 'uNMexs7BYTXQ2_pixelpaws_app_users',
  pets: 'uNMexs7BYTXQ2_pixelpaws_pets',
  statsHist: 'uNMexs7BYTXQ2_pixelpaws_pet_stats_history',
  battles: 'uNMexs7BYTXQ2_pixelpaws_battles',
  shopItems: 'uNMexs7BYTXQ2_pixelpaws_shop_items',
  inventory: 'uNMexs7BYTXQ2_pixelpaws_inventory',
  quests: 'uNMexs7BYTXQ2_pixelpaws_quest_completions',
  accessories: 'uNMexs7BYTXQ2_pixelpaws_accessories'
}

/* ═══ Constants ═══ */
const SPECIES = {
  cat:    { emoji:'🐱', name:'Cat',    hp:90,  atk:12, def:8,  spd:15, desc:'Fast & sneaky' },
  dog:    { emoji:'🐶', name:'Dog',    hp:110, atk:10, def:12, spd:10, desc:'Balanced & loyal' },
  dragon: { emoji:'🐉', name:'Dragon', hp:100, atk:15, def:10, spd:8,  desc:'High attack power' },
  fox:    { emoji:'🦊', name:'Fox',    hp:85,  atk:11, def:9,  spd:14, desc:'Cunning & quick' },
  robot:  { emoji:'🤖', name:'Robot',  hp:120, atk:8,  def:15, spd:6,  desc:'Tanky & durable' }
}
const RANKS = [
  { min:0,    name:'Newbie Trainer', icon:'🌱' },
  { min:100,  name:'Pet Tamer',      icon:'🎯' },
  { min:500,  name:'Beast Keeper',   icon:'🛡️' },
  { min:1500, name:'Monster Ranger', icon:'⚔️' },
  { min:5000, name:'Pet Master',     icon:'👑' }
]
const COOLDOWN_MS = 4 * 60 * 60 * 1000 // 4 hours
const DECAY_RATE_PER_HOUR = { hunger: -3, happiness: -2, energy: -1.5 }

/* ═══ State ═══ */
const S = {
  screen: 'loading', authMode: 'signin', authBusy: false, authError: '', pendingEmail: '',
  session: null, user: null, appUser: null,
  nav: 'home', notice: '', modal: null,
  pet: null, allPets: [], shopItems: [], inventory: [], questData: null,
  battleState: null, battleOpponent: null,
  weather: null, weatherCached: null,
  adoptSpecies: null, adoptName: '',
  questProgress: { qIdx: 0, correct: 0, total: 5, questions: [], answered: false, done: false },
  statsCharts: {}, statsTab: 'overview',
  parkPets: [],
  allUsers: [],
  profileEdit: false, editName: '', editBio: '', editEmoji: ''
}

const $ = document.getElementById('app')

/* ═══ Helpers ═══ */
function esc(v = '') { return String(v).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;') }
function toast(m) { S.notice = m; render(); setTimeout(() => { if (S.notice === m) { S.notice = ''; render() } }, 2500) }
function rankFor(xp) { let r = RANKS[0]; for (const rk of RANKS) { if (xp >= rk.min) r = rk }; return r }
function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)) }
function rng(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min }
function hpClass(pct) { return pct > 50 ? 'hp-high' : pct > 25 ? 'hp-mid' : 'hp-low' }
function fmtTime(ms) {
  if (ms <= 0) return 'Ready!'
  const h = Math.floor(ms / 3600000), m = Math.floor((ms % 3600000) / 60000)
  return `${h}h ${m}m`
}
function timeSince(iso) {
  if (!iso) return Infinity
  return Date.now() - new Date(iso).getTime()
}
function canAct(lastIso) { return timeSince(lastIso) >= COOLDOWN_MS }
function cooldownLeft(lastIso) { return Math.max(0, COOLDOWN_MS - timeSince(lastIso)) }

function applyDecay(pet) {
  if (!pet || !pet.last_fed) return pet
  const hours = timeSince(pet.last_fed) / 3600000
  const p = { ...pet }
  p.hunger = clamp(Math.round(pet.hunger + DECAY_RATE_PER_HOUR.hunger * hours), 0, 100)
  p.happiness = clamp(Math.round(pet.happiness + DECAY_RATE_PER_HOUR.happiness * hours), 0, 100)
  p.energy = clamp(Math.round(pet.energy + DECAY_RATE_PER_HOUR.energy * hours), 0, 100)
  return p
}

function speciesEmoji(species) { return SPECIES[species]?.emoji || '🐾' }

function barHtml(label, val, max, cls) {
  const pct = max > 0 ? Math.round(val / max * 100) : 0
  return `<div class="bar-wrap">
    <div class="bar-label"><span>${label}</span><span>${val}/${max}</span></div>
    <div class="bar-track"><div class="bar-fill ${cls}" style="width:${pct}%"></div></div>
  </div>`
}

function petSpriteHtml(pet, size = '', animClass = '') {
  const sp = SPECIES[pet.species] || SPECIES.cat
  let accHtml = ''
  try {
    const accData = pet.accessories_data ? JSON.parse(pet.accessories_data) : []
    accData.forEach(a => {
      const posClass = a.type === 'hat' ? 'acc-hat' : a.type === 'face' ? 'acc-face' : 'acc-body'
      accHtml += `<span class="pet-accessory ${posClass}">${a.icon || ''}</span>`
    })
  } catch (e) { /* ignore */ }
  return `<div class="pet-sprite ${size}">
    <span class="pet-sprite-img ${animClass}">${sp.emoji}</span>
    ${accHtml}
  </div>`
}

/* ═══ Auth ═══ */
async function handleAuth(mode, email, password, displayName) {
  S.authBusy = true; S.authError = ''; render()
  try {
    if (mode === 'signup') {
      const { data, error } = await supabase.auth.signUp({ email, password, options: { emailRedirectTo: 'https://sling-gogiapp.web.app/email-confirmed.html' } })
      if (error) {
        if (/already.*registered/i.test(error.message)) {
          const r2 = await supabase.auth.signInWithPassword({ email, password })
          if (r2.error) { S.authError = 'Wrong password for existing account.'; S.authBusy = false; render(); return }
          await ensureAppUser(r2.data.user, email, displayName); return
        }
        S.authError = error.message; S.authBusy = false; render(); return
      }
      S.pendingEmail = email; S.screen = 'check-email'; S.authBusy = false; render()
    } else {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) {
        S.authError = /email not confirmed/i.test(error.message) ? 'Check your email for the confirmation link first.' : error.message
        S.authBusy = false; render(); return
      }
      await ensureAppUser(data.user, email)
    }
  } catch (e) { S.authError = e.message }
  S.authBusy = false; render()
}

async function ensureAppUser(user, email, displayName) {
  S.session = { user }; S.user = user
  const { data } = await supabase.from(T.users).select('*').eq('user_id', user.id).maybeSingle()
  if (data) { S.appUser = data } else {
    const { data: nu } = await supabase.from(T.users).insert({ email, display_name: displayName || email.split('@')[0], coins: 100, xp: 0, rank: 'Newbie Trainer' }).select().single()
    S.appUser = nu
  }
  S.screen = 'app'; await loadAll()
}

async function signOut() {
  await supabase.auth.signOut()
  Object.assign(S, { session: null, user: null, appUser: null, screen: 'auth', authMode: 'signin', pet: null, nav: 'home' })
  render()
}

/* ═══ Data Loading ═══ */
async function loadAll() {
  try {
    const [petR, shopR, invR, usersR, allPetsR] = await Promise.all([
      supabase.from(T.pets).select('*').eq('user_id', S.user.id).eq('is_active', true).maybeSingle(),
      supabase.from(T.shopItems).select('*').order('price'),
      supabase.from(T.inventory).select('*').eq('user_id', S.user.id),
      supabase.from(T.users).select('*'),
      supabase.from(T.pets).select('*').eq('is_active', true)
    ])
    S.pet = petR.data ? applyDecay(petR.data) : null
    S.shopItems = shopR.data || []
    S.inventory = invR.data || []
    S.allUsers = usersR.data || []
    S.allPets = allPetsR.data || []
    S.parkPets = S.allPets.map(p => ({
      ...p,
      owner: S.allUsers.find(u => u.user_id === p.user_id)
    }))
  } catch (e) { console.error('loadAll:', e) }
  fetchWeather()
  render()
}

/* ═══ Weather (Open-Meteo) ═══ */
async function fetchWeather() {
  const cached = localStorage.getItem('pp_weather')
  if (cached) {
    try {
      const c = JSON.parse(cached)
      if (Date.now() - c.ts < 1800000) { S.weather = c.data; return }
    } catch (e) { /* stale */ }
  }
  try {
    const r = await fetch('https://api.open-meteo.com/v1/forecast?latitude=40.71&longitude=-74.01&current=temperature_2m,weathercode&timezone=auto')
    const j = await r.json()
    const wc = j.current?.weathercode || 0
    const temp = j.current?.temperature_2m || 20
    let condition = 'Clear'
    if (wc >= 1 && wc <= 3) condition = 'Cloudy'
    else if (wc >= 51 && wc <= 67) condition = 'Rain'
    else if (wc >= 71 && wc <= 77) condition = 'Snow'
    else if (wc >= 95) condition = 'Storm'
    const weatherIcon = condition === 'Clear' ? '☀️' : condition === 'Cloudy' ? '☁️' : condition === 'Rain' ? '🌧️' : condition === 'Snow' ? '❄️' : '⛈️'
    S.weather = { temp: Math.round(temp), condition, icon: weatherIcon, code: wc }
    localStorage.setItem('pp_weather', JSON.stringify({ ts: Date.now(), data: S.weather }))
  } catch (e) { S.weather = { temp: 22, condition: 'Clear', icon: '☀️', code: 0 } }
}

function weatherBonus() {
  if (!S.weather) return { stat: '', val: 0, desc: '' }
  switch (S.weather.condition) {
    case 'Rain': return { stat: 'def', val: 2, desc: '+2 DEF (rainy day armor)' }
    case 'Snow': return { stat: 'hp', val: 10, desc: '+10 HP (snow vigor)' }
    case 'Storm': return { stat: 'atk', val: 3, desc: '+3 ATK (storm fury)' }
    case 'Cloudy': return { stat: 'spd', val: 1, desc: '+1 SPD (cool breeze)' }
    default: return { stat: 'happiness', val: 5, desc: '+5 Happiness (sunny day!)' }
  }
}

/* ═══ Pet Adoption ═══ */
async function adoptPet() {
  if (!S.adoptSpecies || !S.adoptName.trim()) { toast('Pick a species and name!'); return }
  const sp = SPECIES[S.adoptSpecies]
  const { data, error } = await supabase.from(T.pets).insert({
    name: S.adoptName.trim(), species: S.adoptSpecies,
    level: 1, xp: 0, hp: sp.hp, max_hp: sp.hp,
    attack: sp.atk, defense: sp.def, speed: sp.spd,
    happiness: 80, hunger: 80, energy: 80,
    last_fed: new Date().toISOString(), last_played: new Date().toISOString(),
    last_rested: new Date().toISOString(),
    accessories_data: '[]', is_active: true,
    sprite_color: '#ffffff'
  }).select().single()
  if (error) { toast(error.message); return }
  S.pet = data; S.modal = null; toast(`${sp.emoji} ${S.adoptName} joined your team!`)
  // Reload park pets
  const { data: ap } = await supabase.from(T.pets).select('*').eq('is_active', true)
  S.allPets = ap || []
  S.parkPets = S.allPets.map(p => ({ ...p, owner: S.allUsers.find(u => u.user_id === p.user_id) }))
  render()
}

/* ═══ Pet Care ═══ */
async function feedPet() {
  if (!S.pet || !canAct(S.pet.last_fed)) { toast('Not hungry yet!'); return }
  const newHunger = clamp(S.pet.hunger + 30, 0, 100)
  const newHappy = clamp(S.pet.happiness + 5, 0, 100)
  await supabase.from(T.pets).update({ hunger: newHunger, happiness: newHappy, last_fed: new Date().toISOString() }).eq('id', S.pet.id)
  S.pet.hunger = newHunger; S.pet.happiness = newHappy; S.pet.last_fed = new Date().toISOString()
  await recordStats()
  toast('🍖 Yum! Your pet is happier!'); render()
}

async function playWithPet() {
  if (!S.pet || !canAct(S.pet.last_played)) { toast('Already played recently!'); return }
  const newHappy = clamp(S.pet.happiness + 25, 0, 100)
  const newEnergy = clamp(S.pet.energy - 10, 0, 100)
  await supabase.from(T.pets).update({ happiness: newHappy, energy: newEnergy, last_played: new Date().toISOString() }).eq('id', S.pet.id)
  S.pet.happiness = newHappy; S.pet.energy = newEnergy; S.pet.last_played = new Date().toISOString()
  await recordStats()
  toast('🎾 Play time! So much fun!'); render()
}

async function restPet() {
  if (!S.pet || !canAct(S.pet.last_rested)) { toast('Not tired yet!'); return }
  const newEnergy = clamp(S.pet.energy + 40, 0, 100)
  const newHp = clamp(S.pet.hp + 15, 0, S.pet.max_hp)
  await supabase.from(T.pets).update({ energy: newEnergy, hp: newHp, last_rested: new Date().toISOString() }).eq('id', S.pet.id)
  S.pet.energy = newEnergy; S.pet.hp = newHp; S.pet.last_rested = new Date().toISOString()
  await recordStats()
  toast('💤 Zzz... feeling refreshed!'); render()
}

async function healPet() {
  if (!S.pet) return
  // Use HP potion from inventory
  const potion = S.inventory.find(i => i.effect_stat === 'hp' && i.quantity > 0)
  if (!potion) { toast('No HP potions! Visit the shop.'); return }
  const heal = potion.effect_value || 30
  const newHp = clamp(S.pet.hp + heal, 0, S.pet.max_hp)
  await supabase.from(T.pets).update({ hp: newHp }).eq('id', S.pet.id)
  S.pet.hp = newHp
  // Decrease potion qty
  if (potion.quantity <= 1) {
    await supabase.from(T.inventory).delete().eq('id', potion.id)
    S.inventory = S.inventory.filter(i => i.id !== potion.id)
  } else {
    await supabase.from(T.inventory).update({ quantity: potion.quantity - 1 }).eq('id', potion.id)
    potion.quantity--
  }
  await recordStats()
  toast(`🧪 Healed +${heal} HP!`); render()
}

async function useItem(invItem) {
  if (!S.pet || !invItem || invItem.quantity <= 0) return
  const stat = invItem.effect_stat
  const val = invItem.effect_value || 0
  const updates = {}
  if (stat === 'hp') updates.hp = clamp(S.pet.hp + val, 0, S.pet.max_hp)
  else if (stat === 'hunger') updates.hunger = clamp(S.pet.hunger + val, 0, 100)
  else if (stat === 'happiness') updates.happiness = clamp(S.pet.happiness + val, 0, 100)
  else if (stat === 'energy') updates.energy = clamp(S.pet.energy + val, 0, 100)
  else if (stat === 'attack') updates.attack = S.pet.attack + val
  else if (stat === 'defense') updates.defense = S.pet.defense + val
  else if (stat === 'speed') updates.speed = S.pet.speed + val
  else if (stat === 'style') {
    // Accessory — add to pet's accessories
    try {
      const accData = S.pet.accessories_data ? JSON.parse(S.pet.accessories_data) : []
      accData.push({ icon: invItem.icon, type: invItem.item_type === 'accessory' ? 'hat' : 'body', name: invItem.item_name })
      updates.accessories_data = JSON.stringify(accData)
    } catch (e) { /* */ }
  }
  if (Object.keys(updates).length) {
    await supabase.from(T.pets).update(updates).eq('id', S.pet.id)
    Object.assign(S.pet, updates)
  }
  // Decrease qty
  if (invItem.quantity <= 1) {
    await supabase.from(T.inventory).delete().eq('id', invItem.id)
    S.inventory = S.inventory.filter(i => i.id !== invItem.id)
  } else {
    await supabase.from(T.inventory).update({ quantity: invItem.quantity - 1 }).eq('id', invItem.id)
    invItem.quantity--
  }
  toast(`Used ${invItem.icon} ${invItem.item_name}!`); render()
}

async function recordStats() {
  if (!S.pet) return
  try {
    await supabase.from(T.statsHist).insert({
      pet_id: S.pet.id, hp: S.pet.hp, happiness: S.pet.happiness,
      hunger: S.pet.hunger, energy: S.pet.energy, level: S.pet.level,
      recorded_at: new Date().toISOString()
    })
  } catch (e) { /* non-critical */ }
}

/* ═══ Shop ═══ */
async function buyItem(shopItem) {
  if (!S.appUser || S.appUser.coins < shopItem.price) { toast('Not enough coins!'); return }
  // Deduct coins
  const newCoins = S.appUser.coins - shopItem.price
  await supabase.from(T.users).update({ coins: newCoins }).eq('id', S.appUser.id)
  S.appUser.coins = newCoins
  // Add to inventory
  const existing = S.inventory.find(i => i.item_name === shopItem.name)
  if (existing) {
    await supabase.from(T.inventory).update({ quantity: existing.quantity + 1 }).eq('id', existing.id)
    existing.quantity++
  } else {
    const { data } = await supabase.from(T.inventory).insert({
      item_id: shopItem.id, item_name: shopItem.name, item_type: shopItem.item_type,
      effect_stat: shopItem.effect_stat, effect_value: shopItem.effect_value,
      quantity: 1, icon: shopItem.icon
    }).select().single()
    if (data) S.inventory.push(data)
  }
  toast(`Bought ${shopItem.icon} ${shopItem.name}!`); render()
}

/* ═══ Quests (Open Trivia DB) ═══ */
async function startQuest() {
  S.questProgress = { qIdx: 0, correct: 0, total: 5, questions: [], answered: false, done: false }
  try {
    const r = await fetch('https://opentdb.com/api.php?amount=5&type=multiple&category=9')
    const j = await r.json()
    if (!j.results?.length) { toast('No trivia available. Try again!'); return }
    const decode = t => { const e = document.createElement('div'); e.innerHTML = t; return e.textContent }
    S.questProgress.questions = j.results.map(q => {
      const answers = [decode(q.correct_answer), ...q.incorrect_answers.map(decode)].sort(() => Math.random() - 0.5)
      return { question: decode(q.question), answers, correct: decode(q.correct_answer), difficulty: q.difficulty }
    })
    S.modal = 'quest'; render()
  } catch (e) { toast('Quest failed to load!') }
}

async function answerQuest(answer) {
  const qp = S.questProgress
  const q = qp.questions[qp.qIdx]
  if (!q || qp.answered) return
  qp.answered = true
  if (answer === q.correct) qp.correct++
  render()
  setTimeout(async () => {
    qp.qIdx++
    qp.answered = false
    if (qp.qIdx >= qp.total) {
      // Quest complete!
      qp.done = true
      const coinsEarned = qp.correct * 15
      const xpEarned = qp.correct * 10
      S.appUser.coins = (S.appUser.coins || 0) + coinsEarned
      S.appUser.xp = (S.appUser.xp || 0) + xpEarned
      const newRank = rankFor(S.appUser.xp).name
      await supabase.from(T.users).update({ coins: S.appUser.coins, xp: S.appUser.xp, rank: newRank }).eq('id', S.appUser.id)
      S.appUser.rank = newRank
      await supabase.from(T.quests).insert({
        quest_date: new Date().toISOString().slice(0, 10),
        trivia_category: 'General', difficulty: 'mixed',
        correct_answers: qp.correct, total_questions: qp.total,
        coins_earned: coinsEarned, xp_earned: xpEarned
      })
      // Level up pet
      if (S.pet) {
        const newXp = (S.pet.xp || 0) + xpEarned
        const newLevel = Math.floor(newXp / 50) + 1
        const lvlUp = newLevel > S.pet.level
        const updates = { xp: newXp, level: newLevel }
        if (lvlUp) {
          updates.max_hp = S.pet.max_hp + 5
          updates.attack = S.pet.attack + 1
          updates.defense = S.pet.defense + 1
        }
        await supabase.from(T.pets).update(updates).eq('id', S.pet.id)
        Object.assign(S.pet, updates)
      }
    }
    render()
  }, 1200)
}

/* ═══ Battles ═══ */
function initBattle() {
  if (!S.pet) { toast('Adopt a pet first!'); return }
  // Pick a random opponent from other users
  const opponents = S.allPets.filter(p => p.user_id !== S.user.id)
  if (!opponents.length) {
    // Create NPC opponent
    const species = ['cat', 'dog', 'dragon', 'fox', 'robot']
    const sp = species[rng(0, 4)]
    const base = SPECIES[sp]
    const lvl = Math.max(1, S.pet.level + rng(-1, 1))
    S.battleOpponent = {
      id: 'npc', name: 'Wild ' + base.name, species: sp,
      level: lvl, hp: base.hp + lvl * 3, max_hp: base.hp + lvl * 3,
      attack: base.atk + lvl, defense: base.def + lvl, speed: base.spd + lvl,
      accessories_data: '[]'
    }
  } else {
    const op = opponents[rng(0, opponents.length - 1)]
    S.battleOpponent = { ...op }
  }
  const wb = weatherBonus()
  const myHp = S.pet.hp > 0 ? S.pet.hp : S.pet.max_hp
  S.battleState = {
    myHp, myMaxHp: S.pet.max_hp,
    opHp: S.battleOpponent.hp, opMaxHp: S.battleOpponent.max_hp,
    log: [`⚔️ Battle Start! ${S.pet.name} vs ${S.battleOpponent.name}!`],
    turn: 'player', done: false, won: false,
    weatherApplied: false, wb
  }
  if (wb.stat && wb.val) {
    S.battleState.log.push(`${S.weather?.icon || '🌤️'} Weather: ${wb.desc}`)
  }
  S.nav = 'battle'; render()
}

function battleAction(action) {
  const bs = S.battleState
  if (!bs || bs.done) return
  const pet = S.pet
  const op = S.battleOpponent
  const wb = bs.wb
  let myAtk = pet.attack + (wb.stat === 'atk' ? wb.val : 0)
  let myDef = pet.defense + (wb.stat === 'def' ? wb.val : 0)
  let mySpd = pet.speed + (wb.stat === 'spd' ? wb.val : 0)
  let opAtk = op.attack
  let opDef = op.defense

  // Player turn
  if (action === 'attack') {
    const dmg = Math.max(1, myAtk - Math.floor(opDef * 0.4) + rng(-2, 3))
    bs.opHp = Math.max(0, bs.opHp - dmg)
    bs.log.push(`🗡️ ${pet.name} attacks for ${dmg} damage!`)
  } else if (action === 'defend') {
    myDef += 5
    bs.log.push(`🛡️ ${pet.name} braces for impact! (+5 DEF this turn)`)
  } else if (action === 'special') {
    if (Math.random() < 0.65) {
      const dmg = Math.max(1, Math.floor(myAtk * 1.6) - Math.floor(opDef * 0.3) + rng(0, 5))
      bs.opHp = Math.max(0, bs.opHp - dmg)
      bs.log.push(`✨ ${pet.name} uses SPECIAL ATTACK for ${dmg} damage!`)
    } else {
      bs.log.push(`💨 ${pet.name}'s special attack missed!`)
    }
  }

  // Check if opponent KO
  if (bs.opHp <= 0) { finishBattle(true); return }

  // Opponent turn
  const opAction = Math.random()
  if (opAction < 0.6) {
    const dmg = Math.max(1, opAtk - Math.floor(myDef * 0.4) + rng(-2, 3))
    bs.myHp = Math.max(0, bs.myHp - dmg)
    bs.log.push(`👊 ${op.name} attacks for ${dmg} damage!`)
  } else if (opAction < 0.8) {
    bs.log.push(`🛡️ ${op.name} defends!`)
  } else {
    if (Math.random() < 0.5) {
      const dmg = Math.max(1, Math.floor(opAtk * 1.5) - Math.floor(myDef * 0.3) + rng(0, 4))
      bs.myHp = Math.max(0, bs.myHp - dmg)
      bs.log.push(`💥 ${op.name} uses SPECIAL for ${dmg}!`)
    } else {
      bs.log.push(`💨 ${op.name}'s special missed!`)
    }
  }

  // Shake screen
  document.querySelector('.battle-arena')?.classList.add('shake')
  setTimeout(() => document.querySelector('.battle-arena')?.classList.remove('shake'), 400)

  if (bs.myHp <= 0) { finishBattle(false); return }
  render()
}

async function finishBattle(won) {
  const bs = S.battleState
  bs.done = true; bs.won = won
  if (won) {
    const coinsR = rng(15, 40)
    const xpR = rng(10, 30)
    bs.log.push(`🎉 ${S.pet.name} wins! +${coinsR} coins, +${xpR} XP`)
    S.appUser.coins = (S.appUser.coins || 0) + coinsR
    S.appUser.xp = (S.appUser.xp || 0) + xpR
    S.appUser.battles_won = (S.appUser.battles_won || 0) + 1
    const newRank = rankFor(S.appUser.xp).name
    await supabase.from(T.users).update({ coins: S.appUser.coins, xp: S.appUser.xp, battles_won: S.appUser.battles_won, rank: newRank }).eq('id', S.appUser.id)
    S.appUser.rank = newRank
    // Pet XP
    const newXp = (S.pet.xp || 0) + xpR
    const newLevel = Math.floor(newXp / 50) + 1
    const updates = { xp: newXp, level: newLevel, hp: bs.myHp }
    if (newLevel > S.pet.level) { updates.max_hp = S.pet.max_hp + 5; updates.attack = S.pet.attack + 1; updates.defense = S.pet.defense + 1 }
    await supabase.from(T.pets).update(updates).eq('id', S.pet.id)
    Object.assign(S.pet, updates)
    // Record battle
    await supabase.from(T.battles).insert({
      challenger_user_id: S.user.id, challenger_pet_id: S.pet.id,
      defender_user_id: S.battleOpponent.user_id || 'npc',
      defender_pet_id: S.battleOpponent.id || 'npc',
      winner_user_id: S.user.id, winner_pet_id: S.pet.id,
      battle_log: JSON.stringify(bs.log), coins_reward: coinsR, xp_reward: xpR, status: 'completed'
    })
  } else {
    bs.log.push(`💀 ${S.pet.name} was defeated...`)
    S.appUser.battles_lost = (S.appUser.battles_lost || 0) + 1
    await supabase.from(T.users).update({ battles_lost: S.appUser.battles_lost }).eq('id', S.appUser.id)
    await supabase.from(T.pets).update({ hp: Math.max(1, Math.floor(S.pet.max_hp * 0.1)) }).eq('id', S.pet.id)
    S.pet.hp = Math.max(1, Math.floor(S.pet.max_hp * 0.1))
  }
  render()
}

/* ═══ Profile ═══ */
async function updateProfile(updates) {
  const { data } = await supabase.from(T.users).update(updates).eq('id', S.appUser.id).select().single()
  if (data) S.appUser = data
  S.profileEdit = false; toast('Profile updated!'); render()
}

/* ═══ RENDER ═══ */
function render() {
  destroyCharts()
  if (S.screen === 'loading') { $.innerHTML = renderLoading(); return }
  if (S.screen === 'auth') { $.innerHTML = renderAuth(); setupAuthEvents(); return }
  if (S.screen === 'check-email') { $.innerHTML = renderCheckEmail(); return }
  $.innerHTML = renderTopbar() + '<div class="page">' + renderPage() + '</div>' + renderNav() + renderModal() + renderToast()
  setupEvents()
  requestAnimationFrame(renderCharts)
}

function destroyCharts() {
  Object.values(S.statsCharts).forEach(c => { try { c.destroy() } catch (e) { } })
  S.statsCharts = {}
}

/* ── Loading ── */
function renderLoading() {
  return '<div class="loading-screen"><div><span style="font-size:48px;display:block;margin-bottom:16px">🐾</span><div class="loading-dots" style="font-size:14px;color:var(--pixel-yellow)">Loading...</div><p style="font-size:7px;color:var(--text-dim);margin-top:12px">Booting PixelPaws...</p></div></div>'
}

/* ── Auth ── */
function renderAuth() {
  const up = S.authMode === 'signup'
  return `<div class="auth-wrap"><div class="card auth-card">
    <span class="auth-logo">🐾</span>
    <div class="auth-title">PixelPaws</div>
    <div class="auth-sub">${up ? 'Create your trainer account' : 'Welcome back, trainer!'}</div>
    <div class="form-stack">
      ${up ? '<div><label class="label">Trainer Name</label><input class="input" id="authName" placeholder="Your name"></div>' : ''}
      <div><label class="label">Email</label><input class="input" id="authEmail" type="email" placeholder="you@email.com"></div>
      <div><label class="label">Password</label><input class="input" id="authPass" type="password" placeholder="••••••"></div>
      <div class="auth-error">${esc(S.authError)}</div>
      <button class="btn btn-primary btn-block" id="authBtn" ${S.authBusy ? 'disabled' : ''}>${S.authBusy ? 'Loading...' : up ? 'Sign Up' : 'Sign In'}</button>
    </div>
    <button class="auth-switch" id="authSwitch">${up ? 'Have an account? <b>Sign In</b>' : 'No account? <b>Sign Up</b>'}</button>
  </div></div>`
}

function setupAuthEvents() {
  const btn = document.getElementById('authBtn')
  const sw = document.getElementById('authSwitch')
  if (btn) btn.onclick = () => {
    const e = document.getElementById('authEmail')?.value?.trim()
    const p = document.getElementById('authPass')?.value
    const n = document.getElementById('authName')?.value?.trim()
    if (!e || !p) { S.authError = 'Email & password required'; render(); return }
    handleAuth(S.authMode, e, p, n)
  }
  if (sw) sw.onclick = () => { S.authMode = S.authMode === 'signin' ? 'signup' : 'signin'; S.authError = ''; render() }
  document.getElementById('authPass')?.addEventListener('keydown', e => { if (e.key === 'Enter') btn?.click() })
}

function renderCheckEmail() {
  return `<div class="auth-wrap"><div class="card auth-card">
    <span class="auth-logo">📧</span>
    <div class="auth-title">Check Email!</div>
    <div class="auth-sub">We sent a link to<br><b style="color:var(--pixel-cyan)">${esc(S.pendingEmail)}</b><br>Click it, then sign in.</div>
    <button class="btn btn-primary btn-block" onclick="S.screen='auth';S.authMode='signin';render()" style="margin-top:14px">Go to Sign In</button>
  </div></div>`
}
window.S = S; window.render = render

/* ── Topbar ── */
function renderTopbar() {
  const rank = rankFor(S.appUser?.xp || 0)
  return `<div class="topbar"><div class="topbar-inner">
    <div class="top-brand"><span>🐾</span><h1>PixelPaws</h1></div>
    <div class="top-stats">
      <div class="top-stat"><span class="coin">🪙</span> ${S.appUser?.coins || 0}</div>
      <div class="top-stat"><span class="xp">⭐</span> ${S.appUser?.xp || 0}</div>
      <button class="btn-icon" onclick="window._signOut()" title="Sign Out"><i class="fa-solid fa-right-from-bracket" style="font-size:11px"></i></button>
    </div>
  </div></div>`
}

/* ── Nav ── */
function renderNav() {
  const tabs = [
    { id: 'home', icon: 'fa-house', label: 'Home' },
    { id: 'battle', icon: 'fa-bolt', label: 'Battle' },
    { id: 'shop', icon: 'fa-store', label: 'Shop' },
    { id: 'quest', icon: 'fa-scroll', label: 'Quest' },
    { id: 'park', icon: 'fa-tree', label: 'Park' },
    { id: 'profile', icon: 'fa-user', label: 'Profile' }
  ]
  return `<div class="nav-bar"><div class="nav-inner">
    ${tabs.map(t => `<button class="nav-btn ${S.nav === t.id ? 'active' : ''}" onclick="window._nav('${t.id}')">
      <i class="fa-solid ${t.icon}"></i>${t.label}
    </button>`).join('')}
  </div></div>`
}

/* ── Page Router ── */
function renderPage() {
  switch (S.nav) {
    case 'home': return renderHome()
    case 'battle': return renderBattle()
    case 'shop': return renderShop()
    case 'quest': return renderQuest()
    case 'park': return renderPark()
    case 'profile': return renderProfile()
    default: return renderHome()
  }
}

/* ══════════════════════════════════
   HOME PAGE
   ══════════════════════════════════ */
function renderHome() {
  if (!S.pet) return renderNoPet()
  const pet = S.pet
  const sp = SPECIES[pet.species]
  const hpPct = pet.max_hp > 0 ? Math.round(pet.hp / pet.max_hp * 100) : 0
  const xpForNext = pet.level * 50
  const xpPct = xpForNext > 0 ? Math.round((pet.xp % 50) / 50 * 100) : 0
  const potionCount = S.inventory.filter(i => i.effect_stat === 'hp').reduce((s, i) => s + i.quantity, 0)

  return `
    ${renderWeatherBar()}
    <div class="card pet-home-card card-glow">
      ${petSpriteHtml(pet, 'pet-sprite-xl')}
      <div class="pet-name">${esc(pet.name)}</div>
      <div class="pet-species">${sp?.name || pet.species} · Lv.${pet.level}</div>
      <div class="pet-level-badge">LV ${pet.level}</div>

      <div style="margin-top:14px;max-width:320px;margin-left:auto;margin-right:auto">
        ${barHtml('HP', pet.hp, pet.max_hp, hpClass(hpPct))}
        ${barHtml('XP', pet.xp % 50, 50, 'xp')}
        ${barHtml('Hunger', pet.hunger, 100, 'hunger')}
        ${barHtml('Happy', pet.happiness, 100, 'happiness')}
        ${barHtml('Energy', pet.energy, 100, 'energy')}
      </div>

      <div class="care-buttons">
        <button class="care-btn" onclick="window._feed()" ${!canAct(pet.last_fed) ? 'disabled' : ''}>
          <i class="fa-solid fa-drumstick-bite" style="color:var(--pixel-orange)"></i>
          <span>Feed</span>
          ${!canAct(pet.last_fed) ? `<div class="cooldown-timer">${fmtTime(cooldownLeft(pet.last_fed))}</div>` : ''}
        </button>
        <button class="care-btn" onclick="window._play()" ${!canAct(pet.last_played) ? 'disabled' : ''}>
          <i class="fa-solid fa-baseball" style="color:var(--pixel-pink)"></i>
          <span>Play</span>
          ${!canAct(pet.last_played) ? `<div class="cooldown-timer">${fmtTime(cooldownLeft(pet.last_played))}</div>` : ''}
        </button>
        <button class="care-btn" onclick="window._rest()" ${!canAct(pet.last_rested) ? 'disabled' : ''}>
          <i class="fa-solid fa-moon" style="color:var(--pixel-cyan)"></i>
          <span>Rest</span>
          ${!canAct(pet.last_rested) ? `<div class="cooldown-timer">${fmtTime(cooldownLeft(pet.last_rested))}</div>` : ''}
        </button>
        <button class="care-btn" onclick="window._heal()" ${potionCount <= 0 ? 'disabled' : ''}>
          <i class="fa-solid fa-flask" style="color:var(--pixel-green)"></i>
          <span>Heal (${potionCount})</span>
        </button>
      </div>
    </div>

    <div class="section">
      <div class="section-head"><h2>Stats</h2></div>
      <div class="stats-grid">
        <div class="stat-box"><span class="stat-val">${pet.attack}</span><span class="stat-label">Attack</span></div>
        <div class="stat-box"><span class="stat-val">${pet.defense}</span><span class="stat-label">Defense</span></div>
        <div class="stat-box"><span class="stat-val">${pet.speed}</span><span class="stat-label">Speed</span></div>
        <div class="stat-box"><span class="stat-val">${pet.level}</span><span class="stat-label">Level</span></div>
      </div>
    </div>

    ${renderInventorySection()}
  `
}

function renderNoPet() {
  return `<div class="section" style="text-align:center;padding-top:40px">
    <span style="font-size:64px;display:block;margin-bottom:16px">🥚</span>
    <h2 style="font-size:14px;color:var(--pixel-yellow);margin-bottom:8px">No Pet Yet!</h2>
    <p style="font-size:8px;color:var(--text-dim);line-height:2;margin-bottom:16px">Adopt your first pixel pet to begin your adventure!</p>
    <button class="btn btn-primary" onclick="S.modal='adopt';S.adoptSpecies=null;S.adoptName='';render()">🥚 Adopt a Pet</button>
  </div>`
}

function renderWeatherBar() {
  if (!S.weather) return ''
  const wb = weatherBonus()
  return `<div class="weather-bar">
    <span class="weather-icon">${S.weather.icon}</span>
    <span>${S.weather.temp}°C · ${S.weather.condition}</span>
    ${wb.desc ? `<span style="color:var(--pixel-green);margin-left:auto">${wb.desc}</span>` : ''}
  </div>`
}

function renderInventorySection() {
  if (!S.inventory.length) return ''
  return `<div class="section">
    <div class="section-head"><h2>Inventory</h2></div>
    <div class="inv-grid">
      ${S.inventory.map(i => `<div class="inv-slot" onclick="window._useItem('${i.id}')">
        <span class="inv-icon">${i.icon || '📦'}</span>
        <div class="inv-qty">x${i.quantity}</div>
        <div class="inv-name">${esc(i.item_name)}</div>
      </div>`).join('')}
    </div>
  </div>`
}

/* ══════════════════════════════════
   BATTLE PAGE
   ══════════════════════════════════ */
function renderBattle() {
  if (!S.pet) return renderNoPet()
  if (!S.battleState) {
    return `<div class="section" style="text-align:center">
      ${renderWeatherBar()}
      <div class="card" style="padding:30px">
        ${petSpriteHtml(S.pet, 'pet-sprite-xl')}
        <h2 style="font-size:12px;color:var(--pixel-yellow);margin-top:14px">Battle Arena</h2>
        <p style="font-size:8px;color:var(--text-dim);line-height:2;margin:10px 0">Challenge wild pets or other trainers!</p>
        <div class="stats-grid" style="margin:14px 0">
          <div class="stat-box"><span class="stat-val">${S.pet.hp}/${S.pet.max_hp}</span><span class="stat-label">HP</span></div>
          <div class="stat-box"><span class="stat-val">${S.pet.attack}</span><span class="stat-label">ATK</span></div>
          <div class="stat-box"><span class="stat-val">${S.pet.defense}</span><span class="stat-label">DEF</span></div>
          <div class="stat-box"><span class="stat-val">${S.pet.speed}</span><span class="stat-label">SPD</span></div>
        </div>
        <button class="btn btn-danger btn-block" onclick="window._startBattle()" ${S.pet.hp <= 0 ? 'disabled' : ''}>
          ⚔️ Find Opponent
        </button>
        ${S.pet.hp <= 0 ? '<p style="color:var(--pixel-red);font-size:7px;margin-top:8px">Your pet needs healing first!</p>' : ''}
      </div>
    </div>`
  }

  const bs = S.battleState
  const op = S.battleOpponent
  const myHpPct = bs.myMaxHp > 0 ? Math.round(bs.myHp / bs.myMaxHp * 100) : 0
  const opHpPct = bs.opMaxHp > 0 ? Math.round(bs.opHp / bs.opMaxHp * 100) : 0

  return `<div class="section">
    <div class="battle-arena">
      <div class="battle-field">
        <div class="battle-pet">
          ${petSpriteHtml(S.pet, 'pet-sprite-lg')}
          <div class="battle-pet-name">${esc(S.pet.name)} Lv.${S.pet.level}</div>
          ${barHtml('HP', bs.myHp, bs.myMaxHp, hpClass(myHpPct))}
        </div>
        <div class="battle-vs">VS</div>
        <div class="battle-pet">
          ${petSpriteHtml(op, 'pet-sprite-lg')}
          <div class="battle-pet-name">${esc(op.name)} Lv.${op.level}</div>
          ${barHtml('HP', bs.opHp, bs.opMaxHp, hpClass(opHpPct))}
        </div>
      </div>

      <div class="battle-log-box">
        ${bs.log.map(l => `<div class="log-line ${l.includes('damage') || l.includes('defeated') ? 'log-dmg' : l.includes('Heal') ? 'log-heal' : l.includes('wins') ? 'log-info' : l.includes('missed') ? 'log-miss' : 'log-info'}">${l}</div>`).join('')}
      </div>

      ${!bs.done ? `<div class="battle-actions">
        <button class="btn btn-danger" onclick="window._battleAct('attack')">🗡️ Attack</button>
        <button class="btn btn-secondary" onclick="window._battleAct('defend')">🛡️ Defend</button>
        <button class="btn btn-gold" onclick="window._battleAct('special')">✨ Special</button>
      </div>` : `
        <div class="battle-reward">
          <h3>${bs.won ? '🎉 Victory!' : '💀 Defeated!'}</h3>
          <p style="font-size:8px;color:var(--text-dim);margin-top:6px;line-height:2">${bs.won ? 'Great battle, trainer!' : 'Heal up and try again!'}</p>
          <button class="btn btn-primary" onclick="S.battleState=null;S.nav='home';render()" style="margin-top:10px">Continue</button>
        </div>
      `}
    </div>
  </div>`
}

/* ══════════════════════════════════
   SHOP PAGE
   ══════════════════════════════════ */
function renderShop() {
  const tabs = ['food', 'toy', 'healing', 'accessory']
  const activeTab = S.shopTab || 'food'
  const filtered = S.shopItems.filter(i => i.item_type === activeTab)

  return `<div class="section">
    <div class="section-head"><h2>🏪 Shop</h2><span style="font-size:9px;color:var(--coin-gold)">🪙 ${S.appUser?.coins || 0}</span></div>
    <div class="tabs-row">
      ${tabs.map(t => `<button class="tab-btn ${activeTab === t ? 'active' : ''}" onclick="S.shopTab='${t}';render()">${t === 'food' ? '🍖 Food' : t === 'toy' ? '🎾 Toys' : t === 'healing' ? '🧪 Healing' : '👒 Gear'}</button>`).join('')}
    </div>
    <div class="shop-grid">
      ${filtered.map(item => `<div class="shop-item rarity-${item.rarity || 'common'}">
        <span class="item-icon">${item.icon || '📦'}</span>
        <div class="item-name">${esc(item.name)}</div>
        <div class="item-desc">${esc(item.description || '')}</div>
        <div class="item-price">🪙 ${item.price}</div>
        <button class="btn btn-gold btn-sm btn-block" onclick="window._buyItem('${item.id}')" ${(S.appUser?.coins || 0) < item.price ? 'disabled' : ''}>
          Buy
        </button>
      </div>`).join('')}
      ${!filtered.length ? '<div class="empty-state" style="grid-column:1/-1"><i class="fa-solid fa-store"></i><p>No items in this category</p></div>' : ''}
    </div>
  </div>`
}

/* ══════════════════════════════════
   QUEST PAGE
   ══════════════════════════════════ */
function renderQuest() {
  if (!S.pet) return renderNoPet()
  return `<div class="section">
    <div class="section-head"><h2>📜 Daily Quest</h2></div>
    <div class="rpg-textbox" style="margin-bottom:14px">
      Welcome, trainer! Complete trivia quests to earn coins and XP for your pet. Each quest has 5 questions.
    </div>
    <div style="text-align:center">
      <button class="btn btn-primary" onclick="window._startQuest()">
        🗡️ Start Quest
      </button>
    </div>
  </div>`
}

/* ══════════════════════════════════
   PARK PAGE
   ══════════════════════════════════ */
function renderPark() {
  const stars = Array.from({ length: 30 }, () =>
    `<div class="park-star" style="left:${rng(2, 98)}%;top:${rng(2, 50)}%;animation-delay:${Math.random() * 3}s"></div>`
  ).join('')

  const pets = S.parkPets.map((p, i) => {
    const leftPos = 5 + (i * 18) % 85
    const bottomPos = 5 + rng(0, 25)
    const owner = p.owner
    return `<div class="park-pet" style="left:${leftPos}%;bottom:${bottomPos}%">
      <div class="park-pet-emoji" style="animation-delay:${i * 0.3}s">${speciesEmoji(p.species)}</div>
      <div class="park-pet-name">${esc(p.name)}${owner ? '<br>' + esc(owner.display_name) : ''}</div>
    </div>`
  }).join('')

  return `<div class="section">
    <div class="section-head"><h2>🌳 Pet Park</h2><span style="font-size:7px;color:var(--text-dim)">${S.parkPets.length} pets roaming</span></div>
    <div class="park-scene">
      <div class="park-stars">${stars}</div>
      <div class="park-ground"></div>
      ${pets}
      ${!S.parkPets.length ? '<div class="empty-state" style="position:relative;z-index:1"><p>The park is empty... be the first to adopt!</p></div>' : ''}
    </div>
  </div>`
}

/* ══════════════════════════════════
   PROFILE PAGE
   ══════════════════════════════════ */
function renderProfile() {
  const u = S.appUser
  if (!u) return ''
  const rank = rankFor(u.xp || 0)
  const xpToNext = RANKS.find(r => r.min > (u.xp || 0))?.min || 99999

  return `<div class="section">
    <div class="card profile-card">
      ${S.profileEdit ? renderProfileEdit() : `
        <span class="profile-emoji">${u.avatar_emoji || '🧑‍🎮'}</span>
        <div class="profile-name">${esc(u.display_name)}</div>
        <div class="profile-rank-badge">${rank.icon} ${rank.name}</div>
        ${u.bio ? `<div class="profile-bio">${esc(u.bio)}</div>` : ''}
        <button class="btn btn-secondary btn-sm" onclick="S.profileEdit=true;S.editName=S.appUser.display_name||'';S.editBio=S.appUser.bio||'';S.editEmoji=S.appUser.avatar_emoji||'🧑‍🎮';render()" style="margin-top:10px">
          ✏️ Edit
        </button>
        <div class="profile-stats-row">
          <div class="stat-box"><span class="stat-val">${u.coins || 0}</span><span class="stat-label">Coins</span></div>
          <div class="stat-box"><span class="stat-val">${u.xp || 0}</span><span class="stat-label">XP</span></div>
          <div class="stat-box"><span class="stat-val">${u.battles_won || 0}</span><span class="stat-label">Wins</span></div>
          <div class="stat-box"><span class="stat-val">${u.quests_completed || 0}</span><span class="stat-label">Quests</span></div>
        </div>
        <div class="bar-wrap" style="margin-top:10px;max-width:300px;margin-left:auto;margin-right:auto">
          <div class="bar-label"><span>Next Rank</span><span>${u.xp || 0}/${xpToNext} XP</span></div>
          <div class="bar-track"><div class="bar-fill xp" style="width:${Math.min(100, Math.round((u.xp || 0) / xpToNext * 100))}%"></div></div>
        </div>
      `}
    </div>

    ${S.pet ? `<div class="section">
      <div class="section-head"><h2>📊 Pet Stats</h2></div>
      <div class="tabs-row">
        ${['overview', 'charts'].map(t => `<button class="tab-btn ${S.statsTab === t ? 'active' : ''}" onclick="S.statsTab='${t}';render()">${t === 'overview' ? 'Overview' : 'Charts'}</button>`).join('')}
      </div>
      ${S.statsTab === 'overview' ? renderStatsOverview() : renderStatsCharts()}
    </div>` : ''}

    <div class="section">
      <div class="section-head"><h2>🏆 Leaderboard</h2></div>
      ${renderLeaderboard()}
    </div>
  </div>`
}

function renderProfileEdit() {
  const emojis = ['🧑‍🎮', '🐱', '🐶', '🐉', '🦊', '🤖', '🧙', '🥷', '👾', '🦸', '🧛', '🎮', '🏆', '⚔️', '🛡️', '🌟', '🔥', '❄️']
  return `<div style="text-align:center">
    <div style="font-size:48px;margin-bottom:12px">${S.editEmoji}</div>
    <div style="display:flex;flex-wrap:wrap;gap:4px;justify-content:center;margin-bottom:14px">
      ${emojis.map(e => `<button style="font-size:22px;background:${S.editEmoji === e ? 'rgba(255,215,0,0.2)' : 'none'};border:2px solid ${S.editEmoji === e ? 'var(--pixel-yellow)' : 'var(--border)'};padding:4px;cursor:pointer" onclick="S.editEmoji='${e}';render()">${e}</button>`).join('')}
    </div>
    <div class="form-stack" style="text-align:left">
      <div><label class="label">Name</label><input class="input" id="editName" value="${esc(S.editName)}"></div>
      <div><label class="label">Bio</label><input class="input" id="editBio" value="${esc(S.editBio)}" placeholder="Tell the world..."></div>
    </div>
    <div style="display:flex;gap:8px;margin-top:12px;justify-content:center">
      <button class="btn btn-primary" onclick="window._saveProfile()">Save</button>
      <button class="btn btn-secondary" onclick="S.profileEdit=false;render()">Cancel</button>
    </div>
  </div>`
}

function renderStatsOverview() {
  const pet = S.pet
  if (!pet) return ''
  return `<div class="stats-grid">
    <div class="stat-box"><span class="stat-val">${pet.level}</span><span class="stat-label">Level</span></div>
    <div class="stat-box"><span class="stat-val">${pet.hp}/${pet.max_hp}</span><span class="stat-label">HP</span></div>
    <div class="stat-box"><span class="stat-val">${pet.attack}</span><span class="stat-label">ATK</span></div>
    <div class="stat-box"><span class="stat-val">${pet.defense}</span><span class="stat-label">DEF</span></div>
    <div class="stat-box"><span class="stat-val">${pet.speed}</span><span class="stat-label">SPD</span></div>
    <div class="stat-box"><span class="stat-val">${pet.xp}</span><span class="stat-label">Total XP</span></div>
    <div class="stat-box"><span class="stat-val">${pet.happiness}</span><span class="stat-label">Happy</span></div>
    <div class="stat-box"><span class="stat-val">${pet.hunger}</span><span class="stat-label">Hunger</span></div>
  </div>`
}

function renderStatsCharts() {
  return `<div class="grid-2">
    <div><div class="chart-wrap"><canvas id="speciesChart"></canvas></div></div>
    <div><div class="chart-wrap"><canvas id="battleChart"></canvas></div></div>
  </div>`
}

function renderLeaderboard() {
  const sorted = [...S.allUsers].sort((a, b) => (b.xp || 0) - (a.xp || 0)).slice(0, 10)
  return `<div class="card" style="padding:0;overflow:hidden">
    ${sorted.map((u, i) => {
      const r = rankFor(u.xp || 0)
      return `<div class="lb-row">
        <div class="lb-pos ${i === 0 ? 'gold' : i === 1 ? 'silver' : i === 2 ? 'bronze' : ''}">${i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : i + 1}</div>
        <div>
          <span style="font-size:8px">${esc(u.display_name)} ${u.avatar_emoji || ''}</span>
          <div style="font-size:6px;color:var(--text-dim)">${r.icon} ${r.name} · ${u.xp || 0} XP</div>
        </div>
        <div style="font-size:8px;color:var(--pixel-yellow)">${u.battles_won || 0}W</div>
      </div>`
    }).join('')}
    ${!sorted.length ? '<div class="empty-state"><p>No trainers yet</p></div>' : ''}
  </div>`
}

/* ══════════════════════════════════
   MODALS
   ══════════════════════════════════ */
function renderModal() {
  if (!S.modal) return ''
  let inner = ''
  if (S.modal === 'adopt') inner = renderAdoptModal()
  else if (S.modal === 'quest') inner = renderQuestModal()
  return `<div class="modal-overlay" onclick="if(event.target===this){S.modal=null;render()}">
    <div class="card modal">${inner}</div>
  </div>`
}

function renderAdoptModal() {
  const species = Object.entries(SPECIES)
  return `<h2 style="font-size:12px;color:var(--pixel-yellow);margin-bottom:14px">🥚 Choose Your Pet</h2>
    <div class="adopt-grid">
      ${species.map(([k, sp]) => `<div class="adopt-card ${S.adoptSpecies === k ? 'selected' : ''}" onclick="S.adoptSpecies='${k}';render()">
        <span class="adopt-emoji">${sp.emoji}</span>
        <div class="adopt-name">${sp.name}</div>
        <div class="adopt-stats">
          HP:${sp.hp} ATK:${sp.atk}<br>DEF:${sp.def} SPD:${sp.spd}<br>${sp.desc}
        </div>
      </div>`).join('')}
    </div>
    <div style="margin-top:14px">
      <label class="label">Name Your Pet</label>
      <input class="input" id="adoptNameInput" placeholder="Enter a name..." value="${esc(S.adoptName)}">
    </div>
    <button class="btn btn-primary btn-block" style="margin-top:12px" onclick="window._adoptPet()" ${!S.adoptSpecies ? 'disabled' : ''}>Adopt!</button>`
}

function renderQuestModal() {
  const qp = S.questProgress
  if (qp.done) {
    const coins = qp.correct * 15
    const xp = qp.correct * 10
    return `<div style="text-align:center">
      <span style="font-size:48px;display:block;margin-bottom:12px">${qp.correct >= 4 ? '🏆' : qp.correct >= 2 ? '⭐' : '💪'}</span>
      <h2 style="font-size:12px;color:var(--pixel-yellow);margin-bottom:8px">Quest Complete!</h2>
      <p style="font-size:9px;color:var(--text-dim);line-height:2">${qp.correct}/${qp.total} correct</p>
      <div class="stats-grid" style="margin:14px 0">
        <div class="stat-box"><span class="stat-val" style="color:var(--coin-gold)">+${coins}</span><span class="stat-label">Coins</span></div>
        <div class="stat-box"><span class="stat-val" style="color:var(--xp-blue)">+${xp}</span><span class="stat-label">XP</span></div>
      </div>
      <button class="btn btn-primary btn-block" onclick="S.modal=null;render()">Continue</button>
    </div>`
  }

  const q = qp.questions[qp.qIdx]
  if (!q) return '<p style="font-size:8px;color:var(--text-dim)">Loading...</p>'

  return `<div>
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px">
      <span style="font-size:8px;color:var(--pixel-cyan)">Q${qp.qIdx + 1}/${qp.total}</span>
      <span style="font-size:8px;color:var(--pixel-green)">${qp.correct} correct</span>
    </div>
    <div class="quest-question">${esc(q.question)}</div>
    <div class="quest-answers">
      ${q.answers.map(a => {
        let cls = ''
        if (qp.answered) {
          if (a === q.correct) cls = 'correct'
          else cls = 'wrong'
        }
        return `<button class="quest-ans-btn ${cls}" onclick="window._answerQuest('${esc(a).replace(/'/g, "\\'")}')"
          ${qp.answered ? 'disabled' : ''}>${esc(a)}</button>`
      }).join('')}
    </div>
  </div>`
}

/* ── Toast ── */
function renderToast() {
  if (!S.notice) return ''
  return `<div class="toast">${esc(S.notice)}</div>`
}

/* ── Charts ── */
function renderCharts() {
  if (S.nav === 'profile' && S.statsTab === 'charts') {
    // Species distribution pie
    const speciesCanvas = document.getElementById('speciesChart')
    if (speciesCanvas) {
      const counts = {}
      S.allPets.forEach(p => { counts[p.species] = (counts[p.species] || 0) + 1 })
      const labels = Object.keys(counts).map(k => SPECIES[k]?.name || k)
      const data = Object.values(counts)
      const colors = ['#ff6eb4', '#39ff14', '#ff4757', '#00f5ff', '#ffd700']
      S.statsCharts.species = new Chart(speciesCanvas, {
        type: 'pie', data: { labels, datasets: [{ data, backgroundColor: colors }] },
        options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { labels: { color: '#f0e6ff', font: { family: "'Press Start 2P'", size: 7 } } } } }
      })
    }
    // Battle chart
    const battleCanvas = document.getElementById('battleChart')
    if (battleCanvas && S.appUser) {
      S.statsCharts.battle = new Chart(battleCanvas, {
        type: 'bar',
        data: {
          labels: ['Wins', 'Losses'],
          datasets: [{ data: [S.appUser.battles_won || 0, S.appUser.battles_lost || 0], backgroundColor: ['#39ff14', '#ff4757'] }]
        },
        options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } },
          scales: { x: { ticks: { color: '#9b8abf', font: { family: "'Press Start 2P'", size: 7 } } }, y: { ticks: { color: '#9b8abf', font: { family: "'Press Start 2P'", size: 7 } }, grid: { color: 'rgba(255,255,255,0.05)' } } }
        }
      })
    }
  }
}

/* ── Events ── */
function setupEvents() {
  const adoptInput = document.getElementById('adoptNameInput')
  if (adoptInput) adoptInput.oninput = () => { S.adoptName = adoptInput.value }
}

/* ── Global Handlers ── */
window._nav = n => { S.nav = n; S.battleState = null; render() }
window._signOut = signOut
window._feed = feedPet
window._play = playWithPet
window._rest = restPet
window._heal = healPet
window._useItem = id => { const item = S.inventory.find(i => i.id === id); if (item) useItem(item) }
window._buyItem = id => { const item = S.shopItems.find(i => i.id === id); if (item) buyItem(item) }
window._startBattle = initBattle
window._battleAct = action => battleAction(action)
window._startQuest = startQuest
window._answerQuest = answer => answerQuest(answer)
window._adoptPet = () => { S.adoptName = document.getElementById('adoptNameInput')?.value || S.adoptName; adoptPet() }
window._saveProfile = () => {
  const name = document.getElementById('editName')?.value?.trim()
  const bio = document.getElementById('editBio')?.value?.trim()
  updateProfile({ display_name: name || S.appUser?.display_name, bio: bio || '', avatar_emoji: S.editEmoji })
}

/* ── Realtime ── */
function initRealtime() {
  supabase.channel('pixelpaws-live')
    .on('postgres_changes', { event: '*', schema: 'public', table: T.pets }, () => loadAll())
    .on('postgres_changes', { event: '*', schema: 'public', table: T.battles }, () => loadAll())
    .subscribe()
}

/* ── Init ── */
async function init() {
  try {
    const { data: { session } } = await supabase.auth.getSession()
    if (session?.user) {
      S.session = session; S.user = session.user
      await ensureAppUser(session.user, session.user.email)
      initRealtime()
    } else {
      S.screen = 'auth'; render()
    }
    supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session?.user && !S.user) {
        await ensureAppUser(session.user, session.user.email)
        initRealtime()
      }
    })
  } catch (e) { console.error('Init error:', e); S.screen = 'auth'; render() }
}

init()
