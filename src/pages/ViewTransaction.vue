<script setup>
import { computed, inject, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useTransactionsStore } from '../stores/transactions'
import { useCategoriesStore } from '../stores/categories'
import { useAccountsStore } from '../stores/accounts'
import SelectionList from '../components/SelectionList.vue'
import NewTransaction from '../components/NewTransaction.vue'

const route = useRoute()
const router = useRouter()

const backIcon = `<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
  <path d="M15 5a1 1 0 0 1 0 1.41L9.42 12l5.58 5.59A1 1 0 0 1 13.6 19l-6.3-6.3a1 1 0 0 1 0-1.4l6.3-6.3A1 1 0 0 1 15 5z" />
</svg>`

const editIcon = `<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
  <path d="M4 20l4-1L19.3 7.7a1.5 1.5 0 0 0 0-2.1l-.9-.9a1.5 1.5 0 0 0-2.1 0L5 16l-1 4z" />
</svg>`

const setPageTitle = inject('setPageTitle')
const setHeaderTitleVisible = inject('setHeaderTitleVisible')
const setHeaderButtons = inject('setHeaderButtons')

const editOpen = ref(false)

setPageTitle('Transaction')
setHeaderTitleVisible(true)
setHeaderButtons({
  left: [{ id: 'back', label: 'Back', icon: backIcon }],
  right: [{ id: 'edit', label: 'Edit', icon: editIcon }],
  onClick: ({ id }) => {
    if (id === 'back') router.replace({ name: 'transactions' })
    else if (id === 'edit') editOpen.value = true
  },
})

const transactionsStore = useTransactionsStore()
const categoriesStore = useCategoriesStore()
const accountsStore = useAccountsStore()

const transaction = computed(() => transactionsStore.items.find((t) => t.id === route.params.id))

const categoriesById = computed(() => {
  const map = new Map()
  for (const list of Object.values(categoriesStore.byType)) {
    for (const category of list) map.set(category.id, category)
  }
  return map
})

const category = computed(() => categoriesById.value.get(transaction.value?.category))

const amountSign = { expense: -1, income: 1, transfer: -1 }

const signedAmount = computed(() => {
  const t = transaction.value
  if (!t) return 0
  return (amountSign[t.type] ?? 1) * t.amount
})

const amountText = computed(() => {
  const cents = signedAmount.value
  const sign = cents < 0 ? '-' : '+'
  return `${sign}$${(Math.abs(cents) / 100).toFixed(2)}`
})

const dateText = computed(() =>
  new Date(transaction.value.timestamp).toLocaleDateString(undefined, {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }),
)

const timeText = computed(() => {
  const date = new Date(transaction.value.timestamp)
  const pad = (n) => String(n).padStart(2, '0')
  return `${pad(date.getHours())}:${pad(date.getMinutes())}`
})

const locationText = computed(() => transaction.value.selectedLocation || 'None')

// transaction.account holds an account id; one whose account is gone reads as
// deleted rather than leaking the raw uuid into the row.
const accountText = computed(() => {
  const id = transaction.value?.account
  if (!id) return 'No Account'
  return accountsStore.items.find((a) => a.id === id)?.name ?? 'Account Deleted'
})
</script>

<template>
  <main v-if="transaction">
    <section class="hero">
      <span class="hero-amount" :class="{ negative: signedAmount < 0, positive: signedAmount > 0 }">
        {{ amountText }}
      </span>
    </section>

    <div class="card">
      <SelectionList label="Account" type="info" :model-value="accountText" />
      <SelectionList
        label="Category"
        type="info"
        :model-value="category?.name ?? 'Uncategorized'"
      />
      <SelectionList label="Date" type="info" :model-value="dateText" />
      <SelectionList label="Time" type="info" :model-value="timeText" />
      <SelectionList label="Location" type="info" :model-value="locationText" />
    </div>

    <NewTransaction v-model:open="editOpen" :transaction="transaction" />
  </main>
</template>

<style scoped>
.hero {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.75rem;
  padding: 5rem 0 5rem;
}

.hero-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 4rem;
  height: 4rem;
  border-radius: 1.25rem;
  background: linear-gradient(160deg, #48484a 0%, #232325 55%, #0a0a0b 100%);
  box-shadow:
    inset 0 1px 1px rgba(255, 255, 255, 0.35),
    inset 0 -1px 2px rgba(0, 0, 0, 0.5),
    0 1px 2px rgba(0, 0, 0, 0.4);
}

.hero-icon img {
  width: 2rem;
  height: 2rem;
  object-fit: contain;
  filter: invert(1);
}

.hero-amount {
  font-family:
    ui-rounded,
    'SF Pro Rounded',
    'SF Pro Display',
    -apple-system,
    sans-serif;
  font-size: 3.25rem;
  font-weight: 700;
  letter-spacing: -0.02em;
  line-height: 1;
}

.hero-amount.negative {
  color: #ff8a8a;
}

.hero-amount.positive {
  color: #7ee08a;
}

.hero-caption {
  font-size: 1.05rem;
  color: rgba(255, 255, 255, 0.55);
}

.card {
  background-color: rgba(255, 255, 255, 0.09);
  border-radius: 25px;
  padding: 0 1.25rem;
}
</style>
