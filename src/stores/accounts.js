import { defineStore } from 'pinia'
import { computed, reactive, watch } from 'vue'
import { uuid } from '../lib/uuid'

const STORAGE_KEY = 'budge.accounts'

export const accountTypes = [
  { id: 'checking', label: 'Checking' },
  { id: 'savings', label: 'Savings' },
  { id: 'credit', label: 'Credit' },
  { id: 'cash', label: 'Cash' },
  { id: 'investment', label: 'Investment' },
]

// Currency is stored but not yet used anywhere — every account is created with
// this until multi-currency is designed.
const DEFAULT_CURRENCY = 'SGD'

function load() {
  const raw = localStorage.getItem(STORAGE_KEY)
  if (!raw) return []
  try {
    return JSON.parse(raw)
  } catch {
    return []
  }
}

export const useAccountsStore = defineStore('accounts', () => {
  const items = reactive(load())

  watch(
    items,
    (value) => {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(value))
    },
    { deep: true },
  )

  const defaultAccount = computed(() => items.find((a) => a.isDefault) ?? null)

  // Only one account can be the default, so setting one clears the rest.
  function setDefaultAccount(id) {
    items.forEach((a) => {
      a.isDefault = a.id === id
    })
  }

  function addAccount({ name, type, currency, isDefault }) {
    const account = {
      id: uuid(),
      name,
      type: type ?? 'checking',
      currency: currency ?? DEFAULT_CURRENCY,
      isDefault: false,
      createdAt: new Date().toISOString(),
    }
    items.push(account)
    if (isDefault) setDefaultAccount(account.id)
    return account
  }

  function updateAccount(id, { name, type, currency, isDefault }) {
    const account = items.find((a) => a.id === id)
    if (!account) return null
    Object.assign(account, { name, type, currency: currency ?? account.currency })
    if (isDefault === true) setDefaultAccount(id)
    else if (isDefault === false) account.isDefault = false
    return account
  }

  // Transactions keep referencing a deleted account's id; they fall back to
  // "Account Deleted" rather than being rewritten or cascaded.
  function deleteAccount(id) {
    const index = items.findIndex((a) => a.id === id)
    if (index !== -1) items.splice(index, 1)
  }

  return { items, defaultAccount, addAccount, updateAccount, setDefaultAccount, deleteAccount }
})
