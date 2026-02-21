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