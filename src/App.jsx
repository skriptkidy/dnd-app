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
  const [showAddForm, setShowAddForm] = useState(false)

  // === Результат броска кубика ===
  const [diceResult, setDiceResult] = useState(null)

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
    }
  }, [])

  // === Сохранение всех данных ===
  const saveData = (newData) => {
    const data = { name, hp, maxHp, stats, inventory, ...newData }
    localStorage.setItem('dndCharacter', JSON.stringify(data))
  }

  // === Расчет модификатора ===
  const getModifier = (score) => {
    const mod = Math.floor((score - 10) / 2)
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

  // === Бросок кубика d20 ===
  const rollDice = (sides = 20) => {
    const result = Math.floor(Math.random() * sides) + 1
    setDiceResult(result)
    tg.HapticFeedback.notificationOccurred('success')
    tg.MainButton.setText(`🎲 Выпало: ${result}`)
    tg.MainButton.show()
    setTimeout(() => {
      tg.MainButton.hide()
      setDiceResult(null)
    }, 2000)
  }

  // === === ИНВЕНТАРЬ: Функции === ===
  
  // Добавить предмет
  const addItem = () => {
    if (!newItemName.trim()) {
      tg.showAlert('Введите название предмета!')
      return
    }

    const weight = parseFloat(newItemWeight) || 0
    const qty = parseInt(newItemQty) || 1

    const newItem = {
      id: Date.now(), // Уникальный ID
      name: newItemName.trim(),
      weight: weight,
      qty: qty
    }

    const newInventory = [...inventory, newItem]
    setInventory(newInventory)
    saveData({ inventory: newInventory })

    // Очистить форму
    setNewItemName('')
    setNewItemWeight('')
    setNewItemQty('1')
    setShowAddForm(false)
    tg.HapticFeedback.notificationOccurred('success')
  }

  // Удалить предмет
  const removeItem = (id) => {
    const newInventory = inventory.filter(item => item.id !== id)
    setInventory(newInventory)
    saveData({ inventory: newInventory })
    tg.HapticFeedback.impactOccurred('light')
  }

  // Изменить количество
  const changeQty = (id, delta) => {
    const newInventory = inventory.map(item => {
      if (item.id === id) {
        const newQty = item.qty + delta
        if (newQty <= 0) return item // Не удаляем через эту кнопку
        return { ...item, qty: newQty }
      }
      return item
    })
    setInventory(newInventory)
    saveData({ inventory: newInventory })
    tg.HapticFeedback.impactOccurred('light')
  }

  // Посчитать общий вес
  const totalWeight = inventory.reduce((sum, item) => sum + (item.weight * item.qty), 0)

  // === Названия характеристик ===
  const statNames = {
    str: '💪 Сила', dex: '🏹 Ловкость', con: '❤️ Телосложение',
    int: '📚 Интеллект', wis: '👁️ Мудрость', cha: '🎭 Харизма'
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
        <button onClick={() => rollDice(20)} className="btn-d20">Бросить d20</button>
        {diceResult && (
          <div className="dice-result">
            Результат: <strong>{diceResult}</strong>
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
              <span className="stat-value">{value} ({getModifier(value)})</span>
              <button onClick={() => changeStat(key, 1)} className="btn-small">+</button>
            </div>
          </div>
        ))}
      </div>

      {/* === === ИНВЕНТАРЬ === === */}
      <div className="card inventory-card">
        <div className="inventory-header">
          <h3>🎒 Инвентарь</h3>
          <span className="total-weight">⚖️ {totalWeight.toFixed(1)} кг</span>
        </div>

        {/* Кнопка добавить */}
        <button 
          onClick={() => setShowAddForm(!showAddForm)} 
          className="btn-add-item"
        >
          {showAddForm ? '✕ Отмена' : '+ Добавить предмет'}
        </button>

        {/* Форма добавления */}
        {showAddForm && (
          <div className="add-item-form">
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

        {/* Список предметов */}
        <div className="inventory-list">
          {inventory.length === 0 ? (
            <p className="empty-inventory">Инвентарь пуст</p>
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