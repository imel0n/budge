<script setup>
import { computed } from 'vue'
import { usePageTitle } from '../composables/usePageTitle'
import { useAccountsStore, accountTypes } from '../stores/accounts'
import { useTransactionsStore } from '../stores/transactions'

const { titleRef, collapsed } = usePageTitle('Accounts')

const accountsStore = useAccountsStore()
const transactionsStore = useTransactionsStore()

const amountSign = { expense: -1, income: 1, transfer: -1 }

// Balances are derived, never stored — a running total on the account would
// drift the moment a transaction is edited or deleted.
const balancesById = computed(() => {
  const totals = new Map()
  for (const t of transactionsStore.items) {
    if (!t.account) continue
    const delta = (amountSign[t.type] ?? 1) * t.amount
    totals.set(t.account, (totals.get(t.account) ?? 0) + delta)
  }
  return totals
})

const typeLabels = new Map(accountTypes.map((t) => [t.id, t.label]))

const accounts = computed(() =>
  accountsStore.items.map((account) => ({
    ...account,
    typeLabel: typeLabels.get(account.type) ?? 'Account',
    balance: balancesById.value.get(account.id) ?? 0,
  })),
)

const total = computed(() => accounts.value.reduce((sum, a) => sum + a.balance, 0))

function formatAmount(cents) {
  const sign = cents < 0 ? '-' : ''
  return `${sign}$${(Math.abs(cents) / 100).toFixed(2)}`
}
</script>

<template>
  <main>
    <h1 ref="titleRef" :class="{ collapsed }">Accounts</h1>

    <section class="total-card">
      <span class="total-label">Total Balance</span>
      <span class="total-amount" :class="{ negative: total < 0 }">{{ formatAmount(total) }}</span>
    </section>

    <div v-if="accounts.length" class="accounts-card">
      <div v-for="account in accounts" :key="account.id" class="account-row">
        <div class="account-main">
          <span class="account-name">{{ account.name }}</span>
          <span class="account-type">{{ account.typeLabel }}</span>
        </div>
        <span
          class="account-balance"
          :class="{ negative: account.balance < 0, positive: account.balance > 0 }"
        >
          {{ formatAmount(account.balance) }}
        </span>
      </div>
    </div>

    <p v-else class="empty">No accounts yet. Tap + to add one.</p>
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

.total-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.4rem;
  padding: 2.25rem 0 2.5rem;
}

.total-label {
  font-size: 1.05rem;
  color: rgba(255, 255, 255, 0.55);
}

.total-amount {
  font-family:
    ui-rounded,
    'SF Pro Rounded',
    'SF Pro Display',
    -apple-system,
    sans-serif;
  font-size: 2.75rem;
  font-weight: 700;
  letter-spacing: -0.02em;
  line-height: 1;
}

.total-amount.negative {
  color: #ff8a8a;
}

.accounts-card {
  background-color: rgba(255, 255, 255, 0.09);
  border-radius: 25px;
  overflow: hidden;
}

.account-row {
  position: relative;
  display: flex;
  align-items: center;
  gap: 0.85rem;
  padding: 0.75rem 1.25rem;
  background-color: rgb(34, 34, 34);
}

/* Inset divider, matching the transaction list's rows. */
.account-row:not(:first-child)::before {
  content: '';
  position: absolute;
  top: 0;
  left: 1.25rem;
  right: 0;
  height: 1px;
  background: rgba(255, 255, 255, 0.1);
}

.account-main {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.account-name {
  font-size: 0.95rem;
  font-weight: 500;
}

.account-type {
  font-size: 0.95rem;
  color: rgba(255, 255, 255, 0.55);
}

.account-balance {
  margin-left: auto;
  font-size: 1rem;
  font-weight: 600;
}

.account-balance.negative {
  color: #ff8a8a;
}

.account-balance.positive {
  color: #7ee08a;
}

.empty {
  margin: 0 14px;
  font-size: 1.05rem;
  color: rgba(255, 255, 255, 0.55);
}
</style>
