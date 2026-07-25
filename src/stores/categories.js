import { defineStore } from 'pinia'
import { reactive, watch } from 'vue'
import restaurant from '../assets/icons/categories/restaurant.png'
import car from '../assets/icons/categories/car.png'
import shoppingBag from '../assets/icons/categories/shopping-bag.png'
import moneyBag from '../assets/icons/categories/money-bag.png'
import giftBox from '../assets/icons/categories/gift-box.png'
import twoArrows from '../assets/icons/categories/two-arrows.png'
import groceryStore from '../assets/icons/categories/grocery-store.png'
import ticket from '../assets/icons/categories/ticket.png'

const STORAGE_KEY = 'budge.categories'

// crypto.randomUUID requires a secure context (https/localhost); falls back over LAN http.
function uuid() {
  if (crypto.randomUUID) return crypto.randomUUID()
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0
    return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16)
  })
}

const defaults = {
  expense: [
    { id: 'expense-1', name: 'Eating Out', icon: restaurant },
    { id: 'expense-2', name: 'Transport', icon: car },
    { id: 'expense-3', name: 'Shopping', icon: shoppingBag },
    { id: 'expense-4', name: 'Groceries', icon: groceryStore },
    { id: 'expense-5', name: 'Entertainment', icon: ticket },
  ],
  income: [
    { id: 'income-1', name: 'Salary', icon: moneyBag },
    { id: 'income-2', name: 'Gift', icon: giftBox },
  ],
  transfer: [{ id: 'transfer-1', name: 'Transfer', icon: twoArrows }],
}

function load() {
  const raw = localStorage.getItem(STORAGE_KEY)
  if (!raw) return JSON.parse(JSON.stringify(defaults))
  try {
    return JSON.parse(raw)
  } catch {
    return JSON.parse(JSON.stringify(defaults))
  }
}

export const useCategoriesStore = defineStore('categories', () => {
  const byType = reactive(load())

  watch(
    byType,
    (value) => {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(value))
    },
    { deep: true },
  )

  function addCategory(type, { name, icon }) {
    if (!byType[type]) byType[type] = []
    const category = { id: uuid(), name, icon }
    byType[type].push(category)
    return category
  }

  return { byType, addCategory }
})
