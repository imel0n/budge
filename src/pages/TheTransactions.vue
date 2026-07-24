<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { usePageTitle } from '../composables/usePageTitle'
import { useTransactionsStore } from '../stores/transactions'
import { useCategoriesStore } from '../stores/categories'

const { titleRef, collapsed } = usePageTitle('Transactions')

const router = useRouter()

function viewTransaction(transaction) {
  router.replace({ name: 'transaction', params: { id: transaction.id } })
}

const transactionsStore = useTransactionsStore()
const categoriesStore = useCategoriesStore()

const categoriesById = computed(() => {
  const map = new Map()
  for (const list of Object.values(categoriesStore.byType)) {
    for (const category of list) map.set(category.id, category)
  }
  return map
})

function categoryFor(transaction) {
  return categoriesById.value.get(transaction.category)
}

const amountSign = { expense: -1, income: 1, transfer: -1 }

function signedAmount(transaction) {
  return (amountSign[transaction.type] ?? 1) * transaction.amount
}

function formatAmount(cents) {
  const sign = cents < 0 ? '-' : '+'
  return `${sign}$${(Math.abs(cents) / 100).toFixed(2)}`
}

function formatTime(timestamp) {
  const date = new Date(timestamp)
  const pad = (n) => String(n).padStart(2, '0')
  return `${pad(date.getHours())}:${pad(date.getMinutes())}`
}

function formatDay(timestamp) {
  return new Date(timestamp).toLocaleDateString(undefined, {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

const groups = computed(() => {
  const sorted = [...transactionsStore.items].sort(
    (a, b) => new Date(b.timestamp) - new Date(a.timestamp),
  )

  const byDay = new Map()
  for (const transaction of sorted) {
    const key = new Date(transaction.timestamp).toDateString()
    if (!byDay.has(key)) byDay.set(key, [])
    byDay.get(key).push(transaction)
  }

  return [...byDay.values()].map((transactions) => ({
    label: formatDay(transactions[0].timestamp),
    transactions,
    sum: transactions.reduce((total, t) => total + signedAmount(t), 0),
  }))
})
</script>

<template>
  <main>
    <h1 ref="titleRef" :class="{ collapsed }">Transactions</h1>

    <section v-for="group in groups" :key="group.label" class="day-group">
      <h2 class="day-heading">{{ group.label }}</h2>

      <div class="day-card">
        <div
          v-for="transaction in group.transactions"
          :key="transaction.id"
          class="transaction-row"
          @click="viewTransaction(transaction)"
        >
          <span class="transaction-icon">
            <img
              v-if="categoryFor(transaction)?.icon"
              :src="categoryFor(transaction).icon"
              alt=""
            />
          </span>
          <div class="transaction-main">
            <span class="transaction-name">{{
              categoryFor(transaction)?.name ?? 'Uncategorized'
            }}</span>
            <span class="transaction-account">{{ transaction.account || 'No Account' }}</span>
          </div>
          <div class="transaction-end">
            <span class="transaction-time">{{ formatTime(transaction.timestamp) }}</span>
            <span
              class="transaction-amount"
              :class="{
                negative: signedAmount(transaction) < 0,
                positive: signedAmount(transaction) > 0,
              }"
            >
              {{ formatAmount(signedAmount(transaction)) }}
            </span>
          </div>
          <svg class="chevron" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path
              d="M9 6l6 6-6 6"
              stroke="currentColor"
              stroke-width="2.5"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          </svg>
        </div>
      </div>

      <div class="day-sum">
        Sum:
        <span :class="{ negative: group.sum < 0, positive: group.sum > 0 }">
          {{ formatAmount(group.sum) }}
        </span>
      </div>
    </section>
  </main>
</template>

<style scoped>
/* The <h1> keeps its box (so it still scrolls behind the header like a blank
   div), but its text fades out quickly once collapsed, and back in on return. */
h1 {
  transition: opacity 0.1s ease-out;
}

h1.collapsed {
  opacity: 0;
}

.day-group {
  margin-top: 1.5rem;
}

.day-heading {
  font-size: 1.1rem;
  font-weight: 700;
  margin: 0 0 0.75rem 14px;
}

.day-card {
  background-color: rgba(255, 255, 255, 0.09);
  border-radius: 25px;
  padding: 0 1.25rem;
}

.transaction-row {
  position: relative;
  display: flex;
  align-items: center;
  gap: 0.85rem;
  padding: 0.55rem 0;
}

.transaction-row:not(:first-child)::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: -1.25rem;
  height: 1px;
  background: rgba(255, 255, 255, 0.1);
}

.transaction-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  flex: none;
  width: 2.25rem;
  height: 2.25rem;
  border-radius: 0.75rem;
  background: linear-gradient(160deg, #48484a 0%, #232325 55%, #0a0a0b 100%);
  box-shadow:
    inset 0 1px 1px rgba(255, 255, 255, 0.35),
    inset 0 -1px 2px rgba(0, 0, 0, 0.5),
    0 1px 2px rgba(0, 0, 0, 0.4);
}

.transaction-icon img {
  width: 1.2rem;
  height: 1.2rem;
  object-fit: contain;
  filter: invert(1);
}

.transaction-main {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.transaction-name {
  font-size: 1.1rem;
  font-weight: 500;
}

.transaction-account {
  font-size: 0.95rem;
  color: rgba(255, 255, 255, 0.55);
}

.transaction-end {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 0.3rem;
  margin-left: auto;
}

.transaction-time {
  font-size: 0.95rem;
  color: rgba(255, 255, 255, 0.55);
}

.transaction-amount {
  font-size: 0.9rem;
  font-weight: 600;
  padding: 0.15rem 0.6rem;
  border-radius: 999px;
}

.transaction-amount.negative {
  color: #ff8a8a;
  background: rgba(255, 69, 58, 0.18);
}

.transaction-amount.positive {
  color: #7ee08a;
  background: rgba(52, 199, 89, 0.18);
}

.chevron {
  flex: none;
  width: 1.1rem;
  height: 1.1rem;
  color: rgba(255, 255, 255, 0.35);
}

.day-sum {
  margin-top: 0.75rem;
  padding: 0 0.25rem;
  margin-left: 14px;
  font-size: 1.05rem;
  color: rgba(255, 255, 255, 0.55);
}

.day-sum .negative {
  color: #ff8a8a;
}

.day-sum .positive {
  color: #7ee08a;
}
</style>
