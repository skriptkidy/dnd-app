import { useEffect, useState } from 'react'
import './App.css'

const tg = window.Telegram.WebApp

function App() {
  // Данные персонажа
  const [name, setName] = useState('')
  const [hp, setHp] = useState(10)
  const [maxHp, setMaxHp] = useState(10)
  
  // 6 характеристик D&D
  const [stats, setStats] = useState({
    str: 10, // Сила
    dex: 10, // Ловкость
    con: 10, // Телосложение
    int: 10, // Интеллект
    wis: 10, // Мудрость
    cha: 10  // Харизма
  })

  // Результат броска кубика
  const [diceResult, setDiceResult] = useState(null)

  // При запуске загружаем сохраненные данные
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
    }
  }, [])

  // Сохранение всех данных
  const saveData = (newData) => {
    const data = { name, hp, maxHp, stats, ...newData }
    localStorage.setItem('dndCharacter', JSON.stringify(data))
  }

  // Расчет модификатора: (значение - 10) / 2
  const getModifier = (score) => {
    const mod = Math.floor((score - 10) / 2)
    return mod >= 0 ? `+${mod}` : mod
  }

  // Изменение характеристики
  const changeStat = (statKey, delta) => {
    const newStats = { ...stats, [statKey]: stats[statKey] + delta }
    setStats(newStats)
    saveData({ stats: newStats })
    tg.HapticFeedback.impactOccurred('light')
  }

  // Изменение здоровья
  const changeHp = (amount) => {
    const newHp = hp + amount
    if (newHp >= 0) {
      setHp(newHp)
      saveData({ hp: newHp })
      tg.HapticFeedback.impactOccurred('medium')
    }
  }

  // Бросок кубика d20
  const rollDice = (sides = 20) => {
    const result = Math.floor(Math.random() * sides) + 1
    setDiceResult(result)
    tg.HapticFeedback.notificationOccurred('success')
    
    // Показать результат в главном боте (если открыто)
    tg.MainButton.setText(`🎲 Выпало: ${result}`)
    tg.MainButton.show()
    
    // Скрыть через 2 секунды
    setTimeout(() => {
      tg.MainButton.hide()
      setDiceResult(null)
    }, 2000)
  }

  // Названия характеристик
  const statNames = {
    str: '💪 Сила',
    dex: '🏹 Ловкость',
    con: '❤️ Телосложение',
    int: '📚 Интеллект',
    wis: '👁️ Мудрость',
    cha: '🎭 Харизма'
  }

  return (
    <div className="container">
      <h1>🛡️ D&D Персонаж</h1>
      
      {/* Имя */}
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

      {/* Здоровье */}
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

      {/* Бросок кубика */}
      <div className="card dice-card">
        <h3>🎲 Бросок кубика</h3>
        <button onClick={() => rollDice(20)} className="btn-d20">Бросить d20</button>
        {diceResult && (
          <div className="dice-result">
            Результат: <strong>{diceResult}</strong>
          </div>
        )}
      </div>

      {/* Характеристики */}
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

      {/* Кнопка сброса */}
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