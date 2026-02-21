import { useEffect, useState } from 'react'
import './App.css'

const tg = window.Telegram.WebApp

function App() {
  // === Данные персонажа ===
  const [name, setName] = useState('')
  const [hp, setHp] = useState(10)
  const [maxHp, setMaxHp] = useState(10)
  
  // === 6 характеристик D&D ===
  const [stats, setStats] = useState({
    str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10
  })

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
  const [newAttackDamageType, setNewAttackDamageType] = useState('rubbing')
  const [newAttackAbility, setNewAttackAbility] = useState('str')

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
      setHp(data.hp || 10)
      setMaxHp(data.maxHp || 10)
      setStats(data.stats || { str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10 })
      setInventory(data.inventory || [])
      setAttacks(data.attacks || [])
    }
  }, [])

  // === Сохранение всех данных ===
  const saveData = (newData) => {
    const data = { name, hp, maxHp, stats, inventory, attacks, ...newData }
    localStorage.setItem('dndCharacter', JSON.stringify(data))
  }

  // === Расчет модификатора ===
  const getModifier = (score) => {
    const mod = Math.floor((score - 10) / 2)
    return mod
  }

  const getModifierDisplay = (score) => {
    const mod = getModifier(score)
    return mod >= 0 ? `+${mod}` : mod
  }

  // === Изменение характеристики ===
  const changeStat = (statKey, delta) => {
    const newStats = { ...stats, [statKey]: stats[statKey] + delta }
    setStats(newStats)
    saveData({ stats: newStats })
    tg.HapticFeedback.impactOccurred('light')
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
    
    let message = `⚔️ ${attack.name}\n`
    message += `Кубик: ${attackRoll}\n`
    message += `Бонус: ${abilityMod >= 0 ? '+' : ''}${abilityMod} (характеристика) + ${totalBonus} (проф.)\n`
    message += `─────────────\n`
    message += `🎯 Итого: ${total}`
    
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
    
    return { attackRoll, total, isCrit }
  }

  // === Бросок урона ===
  const rollDamage = (attack) => {
    const abilityMod = getModifier(stats[attack.ability])
    
    // Парсим урон (например "1d8" или "2d6")
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
    if (total < 1) total = 1 // Минимум 1 урон
    
    const message = `💥 ${attack.name}\n` +
                   `Кубики: [${rolls.join('+')}] = ${rolls.reduce((a,b)=>a+b,0)}\n` +
                   `Модификатор: ${abilityMod >= 0 ? '+' : ''}${abilityMod}\n` +
                   `Тип: ${getDamageTypeName(attack.damageType)}\n` +
                   `─────────────\n` +
                   `🗡️ Итого: ${total}`
    
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

  // === Название типа урона ===
  const getDamageTypeName = (type) => {
    const types = {
      slashing: 'Рубящий',
      piercing: 'Колющий',
      bludgeoning: 'Дробящий',
      fire: 'Огонь',
      cold: 'Холод',
      lightning: 'Молния',
      psychic: 'Психический',
      necrotic: 'Некротический',
      radiant: 'Излучение',
      force: 'Сила',
      poison: 'Яд',
      thunder: 'Гром',
      acid: 'Кислота'
    }
    return types[type] || type
  }

  // === === ИНВЕНТАРЬ: Функции === ===
  const addItem = () => {
    if (!newItemName.trim()) {
      tg.showAlert('Введите название предмета!')
      return
    }
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

  // === === АТАКИ: Функции === ===
  const addAttack = () => {
    if (!newAttackName.trim()) {
      tg.showAlert('Введите название атаки!')
      return
    }
    
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

  // === Названия характеристик ===
  const statNames = {
    str: '💪 Сила', dex: '🏹 Ловкость', con: '❤️ Телосложение',
    int: '📚 Интеллект', wis: '👁️ Мудрость', cha: '🎭 Харизма'
  }

  const statNamesShort = {
    str: 'СИЛ', dex: 'ЛОВ', con: 'ТЕЛ',
    int: 'ИНТ', wis: 'МУД', cha: 'ХАР'
  }

  return (
    <div className="container">
      <h1>🛡️ D&D Персонаж</h1>
      
      {/* === Имя === */}
      <div className="card">
        <label>Имя персонажа:</label>
        <input 
          value={name} 
          onChange={(e) => {
            setName(e.target.value)
            saveData({ name: e.target.value })
          }}
          placeholder="Введите имя..."
        />
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

      {/* === === АТАКИ === === */}
      <div className="card attacks-card">
        <div className="section-header">
          <h3>⚔️ Атаки</h3>
        </div>

        <button 
          onClick={() => setShowAddAttackForm(!showAddAttackForm)} 
          className="btn-add-section"
        >
          {showAddAttackForm ? '✕ Отмена' : '+ Добавить атаку'}
        </button>

        {showAddAttackForm && (
          <div className="add-form">
            <input 
              value={newAttackName}
              onChange={(e) => setNewAttackName(e.target.value)}
              placeholder="Название (например: Длинный меч)"
            />
            <div className="form-row">
              <input 
                type="number"
                value={newAttackBonus}
                onChange={(e) => setNewAttackBonus(e.target.value)}
                placeholder="Бонус атаки"
              />
              <input 
                value={newAttackDamage}
                onChange={(e) => setNewAttackDamage(e.target.value)}
                placeholder="Урон (1d8)"
              />
            </div>
            <div className="form-row">
              <select 
                value={newAttackDamageType}
                onChange={(e) => setNewAttackDamageType(e.target.value)}
                className="form-select"
              >
                <option value="slashing">Рубящий</option>
                <option value="piercing">Колющий</option>
                <option value="bludgeoning">Дробящий</option>
                <option value="fire">Огонь</option>
                <option value="cold">Холод</option>
                <option value="lightning">Молния</option>
              </select>
              <select 
                value={newAttackAbility}
                onChange={(e) => setNewAttackAbility(e.target.value)}
                className="form-select"
              >
                <option value="str">Сила</option>
                <option value="dex">Ловкость</option>
                <option value="int">Интеллект</option>
                <option value="wis">Мудрость</option>
                <option value="cha">Харизма</option>
              </select>
            </div>
            <button onClick={addAttack} className="btn-confirm">✓ Добавить</button>
          </div>
        )}

        <div className="attacks-list">
          {attacks.length === 0 ? (
            <p className="empty-section">Нет атак</p>
          ) : (
            attacks.map(attack => (
              <div key={attack.id} className="attack-item">
                <div className="attack-info">
                  <span className="attack-name">{attack.name}</span>
                  <span className="attack-details">
                    +{attack.bonus} | {attack.damage} | {getDamageTypeName(attack.damageType)} | {statNamesShort[attack.ability]}
                  </span>
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

      {/* === === ИНВЕНТАРЬ === === */}
      <div className="card inventory-card">
        <div className="section-header">
          <h3>🎒 Инвентарь</h3>
          <span className="total-weight">⚖️ {totalWeight.toFixed(1)} кг</span>
        </div>

        <button 
          onClick={() => setShowAddItemForm(!showAddItemForm)} 
          className="btn-add-section"
        >
          {showAddItemForm ? '✕ Отмена' : '+ Добавить предмет'}
        </button>

        {showAddItemForm && (
          <div className="add-form">
            <input 
              value={newItemName}
              onChange={(e) => setNewItemName(e.target.value)}
              placeholder="Название предмета"
            />
            <div className="form-row">
              <input 
                type="number"
                step="0.1"
                value={newItemWeight}
                onChange={(e) => setNewItemWeight(e.target.value)}
                placeholder="Вес (кг)"
              />
              <input 
                type="number"
                value={newItemQty}
                onChange={(e) => setNewItemQty(e.target.value)}
                placeholder="Кол-во"
              />
            </div>
            <button onClick={addItem} className="btn-confirm">✓ Добавить</button>
          </div>
        )}

        <div className="inventory-list">
          {inventory.length === 0 ? (
            <p className="empty-section">Инвентарь пуст</p>
          ) : (
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

      {/* === Кнопка сброса === */}
      <button 
        onClick={() => {
          if (confirm('Сбросить все данные?')) {
            localStorage.removeItem('dndCharacter')
            window.location.reload()
          }
        }}
        className="btn-reset"
      >
        🗑️ Сбросить персонажа
      </button>
    </div>
  )
}

export default App