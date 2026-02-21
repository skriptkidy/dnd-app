import { useEffect, useState } from 'react'
import './App.css'

// Объявляем переменную для Telegram
const tg = window.Telegram.WebApp

function App() {
  // Здесь мы храним данные персонажа
  const [name, setName] = useState('')
  const [hp, setHp] = useState(10)
  const [maxHp, setMaxHp] = useState(10)

  // При запуске проверяем, есть ли сохраненные данные
  useEffect(() => {
    tg.ready() // Говорим Телеграму, что мы готовы
    tg.expand() // Раскрываем на весь экран

    // Пытаемся достать данные из памяти телефона
    const savedName = localStorage.getItem('charName')
    const savedHp = localStorage.getItem('charHp')
    const savedMaxHp = localStorage.getItem('charMaxHp')

    if (savedName) setName(savedName)
    if (savedHp) setHp(parseInt(savedHp))
    if (savedMaxHp) setMaxHp(parseInt(savedMaxHp))
  }, [])

  // Функция сохранения
  const saveData = (newName, newHp, newMaxHp) => {
    localStorage.setItem('charName', newName)
    localStorage.setItem('charHp', newHp)
    localStorage.setItem('charMaxHp', newMaxHp)
  }

  // Изменение здоровья
  const changeHp = (amount) => {
    const newHp = hp + amount
    if (newHp >= 0) {
      setHp(newHp)
      saveData(name, newHp, maxHp)
      // Вибрация при изменении (фишка Телеграма)
      tg.HapticFeedback.impactOccurred('light')
    }
  }

  return (
    <div className="container">
      <h1>🛡️ Лист Персонажа</h1>
      
      <div className="card">
        <label>Имя персонажа:</label>
        <input 
          value={name} 
          onChange={(e) => {
            setName(e.target.value)
            saveData(e.target.value, hp, maxHp)
          }}
          placeholder="Введите имя..."
        />
      </div>

      <div className="card hp-card">
        <div className="hp-display">
          <span>❤️ HP:</span>
          <span className="hp-value">{hp} / {maxHp}</span>
        </div>
        
        <div className="buttons">
          <button onClick={() => changeHp(-1)} className="btn-dmg">-1</button>
          <button onClick={() => changeHp(-5)} className="btn-dmg">-5</button>
          <button onClick={() => changeHp(1)} className="btn-heal">+1</button>
          <button onClick={() => changeHp(5)} className="btn-heal">+5</button>
        </div>
      </div>

      <div className="card">
        <p>Статус: <b>{hp > 0 ? 'В строю' : 'Без сознания'}</b></p>
      </div>
    </div>
  )
}

export default App