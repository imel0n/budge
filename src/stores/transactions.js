import { defineStore } from 'pinia'
import { reactive, watch } from 'vue'

const STORAGE_KEY = 'budge.transactions'

// crypto.randomUUID requires a secure context (https/localhost); falls back over LAN http.
function uuid() {
  if (crypto.randomUUID) return crypto.randomUUID()
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0
    return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16)
  })
}

function load() {
  const raw = localStorage.getItem(STORAGE_KEY)
  if (!raw) return []
  try {
    return JSON.parse(raw)
  } catch {
    return []
  }
}

export const useTransactionsStore = defineStore('transactions', () => {
  const items = reactive(load())

  watch(
    items,
    (value) => {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(value))
    },
    { deep: true },
  )

  function addTransaction({ type, amount, account, category, payee, date, time, repeat, location, selectedLocation }) {
    const transaction = {
      id: uuid(),
      type,
      amount: Math.round(Number(amount) * 100),
      account,
      category,
      payee,
      timestamp: new Date(`${date}T${time}`).toISOString(),
      repeat,
      location,
      selectedLocation: location ? selectedLocation : null,
      createdAt: new Date().toISOString(),
    }
    items.push(transaction)
    return transaction
  }

  function updateTransaction(id, { type, amount, account, category, payee, date, time, repeat, location, selectedLocation }) {
    const transaction = items.find((t) => t.id === id)
    if (!transaction) return null
    Object.assign(transaction, {
      type,
      amount: Math.round(Number(amount) * 100),
      account,
      category,
      payee,
      timestamp: new Date(`${date}T${time}`).toISOString(),
      repeat,
      location,
      selectedLocation: location ? selectedLocation : null,
    })
    return transaction
  }

  return { items, addTransaction, updateTransaction }
})
