import { useEffect, useState } from 'react'
import './App.css'

const tg = window.Telegram.WebApp

function App() {
  // === Данные персонажа ===
  const [name, setName] = useState('')
  const [level, setLevel] = useState(1)
  const [className, setClassName] = useState('')
  const [hp, setHp] = useState(10)
  const [maxHp, setMaxHp] = useState(10)
  const [ac, setAc] = useState(10) // Класс Доспеха
  const [proficiencyBonus, setProficiencyBonus] = useState(2)

  // === 6 характеристик D&D ===
  const [stats, setStats] = useState({
    str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10
  })

  // === Навыки ===
  const [skills, setSkills] = useState([
    { key: 'acrobatics', name: 'Акробатика', ability: 'dex', proficient: false },
    { key: 'animal_handling', name: 'Обращение с животными', ability: 'wis', proficient: false },
    { key: 'arcana', name: 'Магия', ability: 'int', proficient: false },
    { key: 'athletics', name: 'Атлетика', ability: 'str', proficient: false },
    { key: 'deception', name: 'Обман', ability: 'cha', proficient: false },
    { key: 'history', name: 'История', ability: 'int', proficient: false },
    { key: 'insight', name: 'Проницательность', ability: 'wis', proficient: false },
    { key: 'intimidation', name: 'Запугивание', ability: 'cha', proficient: false },
    { key: 'investigation', name: 'Расследование', ability: 'int', proficient: false },
    { key: 'medicine', name: 'Медицина', ability: 'wis', proficient: false },
    { key: 'nature', name: 'Природа', ability: 'int', proficient: false },
    { key: 'perception', name: 'Внимательность', ability: 'wis', proficient: false },
    { key: 'performance', name: 'Выступление', ability: 'cha', proficient: false },
    { key: 'persuasion', name: 'Убеждение', ability: 'cha', proficient: false },
    { key: 'religion', name: 'Религия', ability: 'int', proficient: false },
    { key: 'sleight_of_hand', name: 'Ловкость рук', ability: 'dex', proficient: false },
    { key: 'stealth', name: 'Скрытность', ability: 'dex', proficient: false },
    { key: 'survival', name: 'Выживание', ability: 'wis', proficient: false },
  ])

  // === Инвентарь ===
  const [inventory, setInventory] = useState([])
  const [newItemName, setNewItemName] = useState('')
  const [newItemWeight, setNewItemWeight] = useState('')
  const [newItemQty, setNewItemQty] = useState('1')
  const [showAddItemForm, setShowAddItemForm] = useState(false)

  // === Атаки ===
  const [attacks, setAttacks] = useState([])
  const [showAddAttackForm, setShowAddAttackForm] = useState(false)
  const [newAttackName, setNewAttackName] = useState('')
  const [newAttackBonus, setNewAttackBonus] = useState('')
  const [newAttackDamage, setNewAttackDamage] = useState('')
  const [newAttackDamageType, setNewAttackDamageType] = useState('slashing')
  const [newAttackAbility, setNewAttackAbility] = useState('str')

  // === Заклинания ===
  const [spellSlots, setSpellSlots] = useState({
    1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0, 9: 0
  })
  const [maxSpellSlots, setMaxSpellSlots] = useState({
    1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0, 9: 0
  })
  const [spells, setSpells] = useState([])
  const [showAddSpellForm, setShowAddSpellForm] = useState(false)
  const [newSpellName, setNewSpellName] = useState('')
  const [newSpellLevel, setNewSpellLevel] = useState('1')
  const [newSpellDescription, setNewSpellDescription] = useState('')

  // === Заметки ===
  const [notes, setNotes] = useState('')

  // === Результат броска кубика ===
  const [diceResult, setDiceResult] = useState(null)
  const [diceDetails, setDiceDetails] = useState('')

  // === Загрузка данных при старте ===
  useEffect(() => {
    tg.ready()
    tg.expand()

    const saved = localStorage.getItem('dndCharacter')
    if (saved) {
      const data = JSON.parse(saved)
      setName(data.name || '')
      setLevel(data.level || 1)
      setClassName(data.className || '')
      setHp(data.hp || 10)
      setMaxHp(data.maxHp || 10)
      setAc(data.ac || 10)
      setStats(data.stats || { str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10 })
      setSkills(data.skills || skills)
      setInventory(data.inventory || [])
      setAttacks(data.attacks || [])
      setSpellSlots(data.spellSlots || spellSlots)
      setMaxSpellSlots(data.maxSpellSlots || maxSpellSlots)
      setSpells(data.spells || [])
      setNotes(data.notes || '')
    }

    // Обновляем бонус мастерства при изменении уровня
    updateProficiencyBonus(data?.level || 1)
  }, [])

  // === Обновление бонуса мастерства ===
  const updateProficiencyBonus = (lvl) => {
    const bonus = 2 + Math.floor((lvl - 1) / 4)
    setProficiencyBonus(bonus)
  }

  // === Сохранение всех данных ===
  const saveData = (newData) => {
    const data = { 
      name, level, className, hp, maxHp, ac, stats, skills, 
      inventory, attacks, spellSlots, maxSpellSlots, spells, notes, 
      ...newData 
    }
    localStorage.setItem('dndCharacter', JSON.stringify(data))
  }

  // === Расчет модификатора ===
  const getModifier = (score) => Math.floor((score - 10) / 2)

  const getModifierDisplay = (score) => {
    const mod = getModifier(score)
    return mod >= 0 ? `+${mod}` : mod
  }

  // === Расчет бонуса навыка ===
  const getSkillBonus = (skill) => {
    const abilityMod = getModifier(stats[skill.ability])
    const profBonus = skill.proficient ? proficiencyBonus : 0
    const total = abilityMod + profBonus
    return total >= 0 ? `+${total}` : total
  }

  // === Изменение характеристики ===
  const changeStat = (statKey, delta) => {
    const newStats = { ...stats, [statKey]: stats[statKey] + delta }
    setStats(newStats)
    saveData({ stats: newStats })
    tg.HapticFeedback.impactOccurred('light')
  }

  // === Переключение владения навыком ===
  const toggleSkillProficiency = (key) => {
    const newSkills = skills.map(skill => 
      skill.key === key ? { ...skill, proficient: !skill.proficient } : skill
    )
    setSkills(newSkills)
    saveData({ skills: newSkills })
    tg.HapticFeedback.impactOccurred('light')
  }

  // === Бросок навыка ===
  const rollSkill = (skill) => {
    const abilityMod = getModifier(stats[skill.ability])
    const profBonus = skill.proficient ? proficiencyBonus : 0
    const totalBonus = abilityMod + profBonus
    const roll = Math.floor(Math.random() * 20) + 1
    const total = roll + totalBonus

    const message = `📜 ${skill.name}\n` +
                   `Кубик: ${roll}\n` +
                   `Характеристика: ${abilityMod >= 0 ? '+' : ''}${abilityMod}\n` +
                   `Мастерство: ${profBonus > 0 ? `+${profBonus}` : '—'}\n` +
                   `─────────────\n` +
                   `🎯 Итого: ${total}`

    setDiceResult(total)
    setDiceDetails(message)
    tg.HapticFeedback.notificationOccurred('success')
    tg.MainButton.setText(`📜 ${skill.name}: ${total}`)
    tg.MainButton.show()
    setTimeout(() => {
      tg.MainButton.hide()
      setDiceResult(null)
      setDiceDetails('')
    }, 3000)
  }

  // === Изменение здоровья ===
  const changeHp = (amount) => {
    const newHp = hp + amount
    if (newHp >= 0) {
      setHp(newHp)
      saveData({ hp: newHp })
      tg.HapticFeedback.impactOccurred('medium')
    }
  }

  // === Бросок кубика (универсальный) ===
  const rollDice = (sides, count = 1, bonus = 0, label = '') => {
    let total = 0
    const rolls = []
    for (let i = 0; i < count; i++) {
      const roll = Math.floor(Math.random() * sides) + 1
      rolls.push(roll)
      total += roll
    }
    total += bonus
    const resultText = rolls.length > 1 ? `[${rolls.join('+')}]` : rolls[0]
    setDiceResult(total)
    setDiceDetails(`${label}: ${resultText}${bonus >= 0 ? `+${bonus}` : bonus} = ${total}`)
    tg.HapticFeedback.notificationOccurred('success')
    tg.MainButton.setText(`🎲 ${label}: ${total}`)
    tg.MainButton.show()
    setTimeout(() => {
      tg.MainButton.hide()
      setDiceResult(null)
      setDiceDetails('')
    }, 3000)
  }

  // === Бросок атаки ===
  const rollAttack = (attack) => {
    const abilityMod = getModifier(stats[attack.ability])
    const totalBonus = parseInt(attack.bonus) || 0
    const attackRoll = Math.floor(Math.random() * 20) + 1
    const total = attackRoll + abilityMod + totalBonus
    const isCrit = attackRoll === 20
    const isMiss = attackRoll === 1

    let message = `⚔️ ${attack.name}\nКубик: ${attackRoll}\n` +
                  `Бонус: ${abilityMod >= 0 ? '+' : ''}${abilityMod} + ${totalBonus}\n` +
                  `─────────────\n🎯 Итого: ${total}`
    if (isCrit) message += '\n🔥 КРИТИЧЕСКИЙ УДАР!'
    if (isMiss) message += '\n❌ КРИТИЧЕСКИЙ ПРОМАХ!'

    setDiceResult(total)
    setDiceDetails(message)
    tg.HapticFeedback.notificationOccurred(isCrit ? 'success' : isMiss ? 'error' : 'warning')
    tg.MainButton.setText(`⚔️ Атака: ${total}${isCrit ? ' 🔥' : ''}`)
    tg.MainButton.show()
    setTimeout(() => {
      tg.MainButton.hide()
      setDiceResult(null)
      setDiceDetails('')
    }, 4000)
  }

  // === Бросок урона ===
  const rollDamage = (attack) => {
    const abilityMod = getModifier(stats[attack.ability])
    const damageMatch = attack.damage.match(/(\d+)d(\d+)/i)
    if (!damageMatch) {
      tg.showAlert('Неверный формат урона! Используйте 1d8, 2d6 и т.д.')
      return
    }
    const diceCount = parseInt(damageMatch[1])
    const diceSides = parseInt(damageMatch[2])
    let total = 0
    const rolls = []
    for (let i = 0; i < diceCount; i++) {
      const roll = Math.floor(Math.random() * diceSides) + 1
      rolls.push(roll)
      total += roll
    }
    total += abilityMod
    if (total < 1) total = 1

    const message = `💥 ${attack.name}\nКубики: [${rolls.join('+')}] = ${rolls.reduce((a,b)=>a+b,0)}\n` +
                   `Модификатор: ${abilityMod >= 0 ? '+' : ''}${abilityMod}\n` +
                   `Тип: ${getDamageTypeName(attack.damageType)}\n` +
                   `─────────────\n🗡️ Итого: ${total}`

    setDiceResult(total)
    setDiceDetails(message)
    tg.HapticFeedback.notificationOccurred('success')
    tg.MainButton.setText(`💥 Урон: ${total}`)
    tg.MainButton.show()
    setTimeout(() => {
      tg.MainButton.hide()
      setDiceResult(null)
      setDiceDetails('')
    }, 4000)
  }

  const getDamageTypeName = (type) => {
    const types = {
      slashing: 'Рубящий', piercing: 'Колющий', bludgeoning: 'Дробящий',
      fire: 'Огонь', cold: 'Холод', lightning: 'Молния', psychic: 'Психический',
      necrotic: 'Некротический', radiant: 'Излучение', force: 'Сила',
      poison: 'Яд', thunder: 'Гром', acid: 'Кислота'
    }
    return types[type] || type
  }

  // === === ИНВЕНТАРЬ === ===
  const addItem = () => {
    if (!newItemName.trim()) { tg.showAlert('Введите название предмета!'); return }
    const weight = parseFloat(newItemWeight) || 0
    const qty = parseInt(newItemQty) || 1
    const newItem = { id: Date.now(), name: newItemName.trim(), weight, qty }
    const newInventory = [...inventory, newItem]
    setInventory(newInventory)
    saveData({ inventory: newInventory })
    setNewItemName('')
    setNewItemWeight('')
    setNewItemQty('1')
    setShowAddItemForm(false)
    tg.HapticFeedback.notificationOccurred('success')
  }

  const removeItem = (id) => {
    const newInventory = inventory.filter(item => item.id !== id)
    setInventory(newInventory)
    saveData({ inventory: newInventory })
    tg.HapticFeedback.impactOccurred('light')
  }

  const changeQty = (id, delta) => {
    const newInventory = inventory.map(item => {
      if (item.id === id) {
        const newQty = item.qty + delta
        if (newQty <= 0) return item
        return { ...item, qty: newQty }
      }
      return item
    })
    setInventory(newInventory)
    saveData({ inventory: newInventory })
    tg.HapticFeedback.impactOccurred('light')
  }

  const totalWeight = inventory.reduce((sum, item) => sum + (item.weight * item.qty), 0)

  // === === АТАКИ === ===
  const addAttack = () => {
    if (!newAttackName.trim()) { tg.showAlert('Введите название атаки!'); return }
    const newAttack = {
      id: Date.now(),
      name: newAttackName.trim(),
      bonus: parseInt(newAttackBonus) || 0,
      damage: newAttackDamage || '1d4',
      damageType: newAttackDamageType,
      ability: newAttackAbility
    }
    const newAttacks = [...attacks, newAttack]
    setAttacks(newAttacks)
    saveData({ attacks: newAttacks })
    setNewAttackName('')
    setNewAttackBonus('')
    setNewAttackDamage('')
    setNewAttackDamageType('slashing')
    setNewAttackAbility('str')
    setShowAddAttackForm(false)
    tg.HapticFeedback.notificationOccurred('success')
  }

  const removeAttack = (id) => {
    const newAttacks = attacks.filter(attack => attack.id !== id)
    setAttacks(newAttacks)
    saveData({ attacks: newAttacks })
    tg.HapticFeedback.impactOccurred('light')
  }

  // === === ЗАКЛИНАНИЯ === ===
  const changeSpellSlot = (level, delta) => {
    const newSlots = { ...spellSlots, [level]: Math.max(0, spellSlots[level] + delta) }
    setSpellSlots(newSlots)
    saveData({ spellSlots: newSlots })
    tg.HapticFeedback.impactOccurred('light')
  }

  const setMaxSlotsForLevel = (casterLevel) => {
    // Упрощенная таблица ячеек для полнозаклинателя
    const tables = {
      1: {1:2}, 2: {1:3}, 3: {1:4,2:2}, 4: {1:4,2:3}, 5: {1:4,2:3,3:2},
      6: {1:4,2:3,3:3}, 7: {1:4,2:3,3:3,4:1}, 8: {1:4,2:3,3:3,4:2},
      9: {1:4,2:3,3:3,4:3,5:1}, 10: {1:4,2:3,3:3,4:3,5:2}
    }
    const slots = tables[casterLevel] || {1:2}
    setMaxSpellSlots({ ...maxSpellSlots, ...slots })
    setSpellSlots({ ...spellSlots, ...slots })
    saveData({ spellSlots: { ...spellSlots, ...slots }, maxSpellSlots: { ...maxSpellSlots, ...slots } })
    tg.HapticFeedback.notificationOccurred('success')
  }

  const addSpell = () => {
    if (!newSpellName.trim()) { tg.showAlert('Введите название заклинания!'); return }
    const newSpell = {
      id: Date.now(),
      name: newSpellName.trim(),
      level: parseInt(newSpellLevel),
      description: newSpellDescription
    }
    const newSpells = [...spells, newSpell]
    setSpells(newSpells)
    saveData({ spells: newSpells })
    setNewSpellName('')
    setNewSpellLevel('1')
    setNewSpellDescription('')
    setShowAddSpellForm(false)
    tg.HapticFeedback.notificationOccurred('success')
  }

  const removeSpell = (id) => {
    const newSpells = spells.filter(spell => spell.id !== id)
    setSpells(newSpells)
    saveData({ spells: newSpells })
    tg.HapticFeedback.impactOccurred('light')
  }

  // === === Заметки === ===
  const saveNotes = (text) => {
    setNotes(text)
    saveData({ notes: text })
  }

  // === Названия характеристик ===
  const statNames = {
    str: '💪 Сила', dex: '🏹 Ловкость', con: '❤️ Телосложение',
    int: '📚 Интеллект', wis: '👁️ Мудрость', cha: '🎭 Харизма'
  }

  return (
    <div className="container">
      <h1>🛡️ D&D Персонаж</h1>
      
      {/* === Профиль === */}
      <div className="card profile-card">
        <input 
          value={name} 
          onChange={(e) => { setName(e.target.value); saveData({ name: e.target.value }) }}
          placeholder="Имя персонажа"
          className="input-large"
        />
        <div className="profile-row">
          <input 
            type="number"
            value={level} 
            onChange={(e) => { 
              const lvl = parseInt(e.target.value) || 1
              setLevel(lvl)
              updateProficiencyBonus(lvl)
              saveData({ level: lvl })
            }}
            placeholder="Уровень"
            className="input-small"
          />
          <input 
            value={className} 
            onChange={(e) => { setClassName(e.target.value); saveData({ className: e.target.value }) }}
            placeholder="Класс"
            className="input-small"
          />
        </div>
        <div className="profile-stats">
          <div className="stat-box">
            <span className="stat-label">КД (AC)</span>
            <input 
              type="number"
              value={ac} 
              onChange={(e) => { setAc(parseInt(e.target.value) || 10); saveData({ ac: parseInt(e.target.value) || 10 }) }}
              className="stat-input"
            />
          </div>
          <div className="stat-box">
            <span className="stat-label">Мастерство</span>
            <span className="stat-value-big">+{proficiencyBonus}</span>
          </div>
        </div>
      </div>

      {/* === Здоровье === */}
      <div className="card hp-card">
        <div className="hp-display">
          <span>❤️ HP:</span>
          <span className={`hp-value ${hp <= 0 ? 'critical' : ''}`}>{hp} / {maxHp}</span>
        </div>
        <div className="buttons">
          <button onClick={() => changeHp(-5)} className="btn-dmg">-5</button>
          <button onClick={() => changeHp(-1)} className="btn-dmg">-1</button>
          <button onClick={() => changeHp(1)} className="btn-heal">+1</button>
          <button onClick={() => changeHp(5)} className="btn-heal">+5</button>
        </div>
      </div>

      {/* === Бросок кубика === */}
      <div className="card dice-card">
        <h3>🎲 Бросок кубика</h3>
        <button onClick={() => rollDice(20, 1, 0, 'd20')} className="btn-d20">Бросить d20</button>
        {diceDetails && (
          <div className="dice-result">
            <pre className="dice-details">{diceDetails}</pre>
          </div>
        )}
      </div>

      {/* === Характеристики === */}
      <div className="card">
        <h3>📊 Характеристики</h3>
        {Object.entries(stats).map(([key, value]) => (
          <div key={key} className="stat-row">
            <span className="stat-name">{statNames[key]}</span>
            <div className="stat-controls">
              <button onClick={() => changeStat(key, -1)} className="btn-small">-</button>
              <span className="stat-value">{value} ({getModifierDisplay(value)})</span>
              <button onClick={() => changeStat(key, 1)} className="btn-small">+</button>
            </div>
          </div>
        ))}
      </div>

      {/* === Навыки === */}
      <div className="card skills-card">
        <h3>📜 Навыки</h3>
        <div className="skills-list">
          {skills.map(skill => (
            <div key={skill.key} className={`skill-row ${skill.proficient ? 'proficient' : ''}`}>
              <button onClick={() => toggleSkillProficiency(skill.key)} className="skill-prof">
                {skill.proficient ? '✓' : '○'}
              </button>
              <span className="skill-name">{skill.name}</span>
              <span className="skill-ability">({statNames[skill.ability].split(' ')[1]})</span>
              <button onClick={() => rollSkill(skill)} className="btn-skill-roll">
                {getSkillBonus(skill)}
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* === Атаки === */}
      <div className="card attacks-card">
        <div className="section-header">
          <h3>⚔️ Атаки</h3>
        </div>
        <button onClick={() => setShowAddAttackForm(!showAddAttackForm)} className="btn-add-section">
          {showAddAttackForm ? '✕ Отмена' : '+ Добавить атаку'}
        </button>
        {showAddAttackForm && (
          <div className="add-form">
            <input value={newAttackName} onChange={(e) => setNewAttackName(e.target.value)} placeholder="Название" />
            <div className="form-row">
              <input type="number" value={newAttackBonus} onChange={(e) => setNewAttackBonus(e.target.value)} placeholder="Бонус" />
              <input value={newAttackDamage} onChange={(e) => setNewAttackDamage(e.target.value)} placeholder="Урон (1d8)" />
            </div>
            <div className="form-row">
              <select value={newAttackDamageType} onChange={(e) => setNewAttackDamageType(e.target.value)} className="form-select">
                <option value="slashing">Рубящий</option>
                <option value="piercing">Колющий</option>
                <option value="bludgeoning">Дробящий</option>
                <option value="fire">Огонь</option>
              </select>
              <select value={newAttackAbility} onChange={(e) => setNewAttackAbility(e.target.value)} className="form-select">
                <option value="str">Сила</option>
                <option value="dex">Ловкость</option>
              </select>
            </div>
            <button onClick={addAttack} className="btn-confirm">✓ Добавить</button>
          </div>
        )}
        <div className="attacks-list">
          {attacks.length === 0 ? (<p className="empty-section">Нет атак</p>) : (
            attacks.map(attack => (
              <div key={attack.id} className="attack-item">
                <div className="attack-info">
                  <span className="attack-name">{attack.name}</span>
                  <span className="attack-details">+{attack.bonus} | {attack.damage} | {getDamageTypeName(attack.damageType)}</span>
                </div>
                <div className="attack-controls">
                  <button onClick={() => rollAttack(attack)} className="btn-attack">⚔️</button>
                  <button onClick={() => rollDamage(attack)} className="btn-damage">💥</button>
                  <button onClick={() => removeAttack(attack.id)} className="btn-delete">🗑️</button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* === Заклинания === */}
      <div className="card spells-card">
        <div className="section-header">
          <h3>✨ Заклинания</h3>
          <button onClick={() => setMaxSlotsForLevel(level)} className="btn-set-slots">📊 По уровню</button>
        </div>
        
        <div className="spell-slots">
          {[1,2,3,4,5].map(lvl => (
            maxSpellSlots[lvl] > 0 && (
              <div key={lvl} className="spell-slot-row">
                <span className="slot-level">Ур. {lvl}</span>
                <div className="slot-dots">
                  {Array(maxSpellSlots[lvl]).fill(0).map((_, i) => (
                    <button 
                      key={i} 
                      onClick={() => changeSpellSlot(lvl, i < spellSlots[lvl] ? -1 : 1)}
                      className={`slot-dot ${i < spellSlots[lvl] ? 'used' : 'unused'}`}
                    />
                  ))}
                </div>
                <span className="slot-count">{spellSlots[lvl]}/{maxSpellSlots[lvl]}</span>
              </div>
            )
          ))}
        </div>

        <button onClick={() => setShowAddSpellForm(!showAddSpellForm)} className="btn-add-section">
          {showAddSpellForm ? '✕ Отмена' : '+ Добавить заклинание'}
        </button>
        {showAddSpellForm && (
          <div className="add-form">
            <input value={newSpellName} onChange={(e) => setNewSpellName(e.target.value)} placeholder="Название заклинания" />
            <div className="form-row">
              <select value={newSpellLevel} onChange={(e) => setNewSpellLevel(e.target.value)} className="form-select">
                {[1,2,3,4,5,6,7,8,9].map(l => <option key={l} value={l}>Уровень {l}</option>)}
              </select>
            </div>
            <textarea value={newSpellDescription} onChange={(e) => setNewSpellDescription(e.target.value)} placeholder="Описание" rows="2" />
            <button onClick={addSpell} className="btn-confirm">✓ Добавить</button>
          </div>
        )}
        <div className="spells-list">
          {spells.length === 0 ? (<p className="empty-section">Нет заклинаний</p>) : (
            spells.map(spell => (
              <div key={spell.id} className="spell-item">
                <div className="spell-info">
                  <span className="spell-name">{spell.name}</span>
                  <span className="spell-level">Ур. {spell.level}</span>
                </div>
                <button onClick={() => removeSpell(spell.id)} className="btn-delete">🗑️</button>
              </div>
            ))
          )}
        </div>
      </div>

      {/* === Инвентарь === */}
      <div className="card inventory-card">
        <div className="section-header">
          <h3>🎒 Инвентарь</h3>
          <span className="total-weight">⚖️ {totalWeight.toFixed(1)} кг</span>
        </div>
        <button onClick={() => setShowAddItemForm(!showAddItemForm)} className="btn-add-section">
          {showAddItemForm ? '✕ Отмена' : '+ Добавить предмет'}
        </button>
        {showAddItemForm && (
          <div className="add-form">
            <input value={newItemName} onChange={(e) => setNewItemName(e.target.value)} placeholder="Название" />
            <div className="form-row">
              <input type="number" step="0.1" value={newItemWeight} onChange={(e) => setNewItemWeight(e.target.value)} placeholder="Вес" />
              <input type="number" value={newItemQty} onChange={(e) => setNewItemQty(e.target.value)} placeholder="Кол-во" />
            </div>
            <button onClick={addItem} className="btn-confirm">✓ Добавить</button>
          </div>
        )}
        <div className="inventory-list">
          {inventory.length === 0 ? (<p className="empty-section">Пусто</p>) : (
            inventory.map(item => (
              <div key={item.id} className="inventory-item">
                <div className="item-info">
                  <span className="item-name">{item.name}</span>
                  <span className="item-weight">{item.weight} кг × {item.qty}</span>
                </div>
                <div className="item-controls">
                  <button onClick={() => changeQty(item.id, -1)} className="btn-qty">-</button>
                  <span className="item-qty">{item.qty}</span>
                  <button onClick={() => changeQty(item.id, 1)} className="btn-qty">+</button>
                  <button onClick={() => removeItem(item.id)} className="btn-delete">🗑️</button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* === Заметки === */}
      <div className="card notes-card">
        <h3>📝 Заметки</h3>
        <textarea 
          value={notes} 
          onChange={(e) => saveNotes(e.target.value)}
          placeholder="Квесты, NPC, важные заметки..."
          rows="5"
          className="notes-textarea"
        />
      </div>

      {/* === Кнопка сброса === */}
      <button onClick={() => { if(confirm('Сбросить все данные?')) { localStorage.removeItem('dndCharacter'); window.location.reload() }}} className="btn-reset">
        🗑️ Сбросить персонажа
      </button>
    </div>
  )
}

export default App