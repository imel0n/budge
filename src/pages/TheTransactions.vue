<script setup>
import { computed, inject, onMounted, onUnmounted, reactive, ref, watchEffect } from 'vue'
import { useRouter } from 'vue-router'
import { usePageTitle } from '../composables/usePageTitle'
import { useTransactionsStore } from '../stores/transactions'
import { useCategoriesStore } from '../stores/categories'
import SelectTransactionPeriod from '../components/SelectTransactionPeriod.vue'

const { titleRef, collapsed } = usePageTitle('Transactions')

const router = useRouter()

const setHeaderButtons = inject('setHeaderButtons')

const periodOpen = ref(false)
const period = ref('month')

const searchIcon = `<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
  <circle cx="10" cy="10" r="6.5" fill="none" stroke="currentColor" stroke-width="2" />
  <path d="M21 21l-6-6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
</svg>`

const ellipsisIcon = `<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
  <circle cx="5" cy="12" r="2" />
  <circle cx="12" cy="12" r="2" />
  <circle cx="19" cy="12" r="2" />
</svg>`

function weekNumber(date) {
  const target = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
  const dayNumber = (target.getUTCDay() + 6) % 7
  target.setUTCDate(target.getUTCDate() - dayNumber + 3)
  const firstThursday = new Date(Date.UTC(target.getUTCFullYear(), 0, 4))
  const firstDayNumber = (firstThursday.getUTCDay() + 6) % 7
  firstThursday.setUTCDate(firstThursday.getUTCDate() - firstDayNumber + 3)
  return 1 + Math.round((target - firstThursday) / (7 * 24 * 60 * 60 * 1000))
}

const periodLabel = computed(() => {
  const now = new Date()
  if (period.value === 'week') return `Week ${weekNumber(now)}`
  if (period.value === 'year') return `Year ${now.getFullYear()}`
  return `${now.toLocaleDateString(undefined, { month: 'long' })} ${now.getFullYear()}`
})

// Search mode is owned here and handed to the header, which cross-fades its own
// content out and a search field in. The query comes back on every keystroke.
const searchOpen = ref(false)
const searchQuery = ref('')

watchEffect(() => {
  setHeaderButtons({
    left: [{ id: 'period', label: periodLabel.value }],
    right: [
      { id: 'search', label: 'Search', icon: searchIcon },
      { id: 'more', label: 'More', icon: ellipsisIcon },
    ],
    search: searchOpen.value ? { active: true, placeholder: 'Search transactions' } : null,
    onClick: ({ id }) => {
      if (id === 'period') periodOpen.value = true
      else if (id === 'search') searchOpen.value = true
    },
    onSearchInput: (query) => {
      searchQuery.value = query
    },
    onSearchClose: () => {
      searchOpen.value = false
      searchQuery.value = ''
    },
  })
})

function viewTransaction(transaction) {
  router.replace({ name: 'transaction', params: { id: transaction.id } })
}

// iOS-style swipe-to-delete: each row tracks its own translateX offset, keyed
// by transaction id. Horizontal drags reveal the delete action; rows rely on
// touch-action: pan-y so vertical list scrolling keeps working untouched.
const DELETE_WIDTH = 88
const FULL_SWIPE_RATIO = 0.55

const rowX = reactive({})
const rowWidths = reactive({})
const draggingId = ref(null)

function xFor(id) {
  return rowX[id] ?? 0
}

function deleteActionStyle(id) {
  return {
    width: `${Math.max(DELETE_WIDTH, -xFor(id))}px`,
    visibility: xFor(id) === 0 && draggingId.value !== id ? 'hidden' : 'visible',
    transition: draggingId.value === id ? 'none' : 'width 0.25s cubic-bezier(0.2, 0.8, 0.2, 1)',
  }
}

function isFullSwipe(id) {
  const width = rowWidths[id]
  return !!width && -xFor(id) >= width * FULL_SWIPE_RATIO
}

function closeAll() {
  for (const id of Object.keys(rowX)) rowX[id] = 0
}

let dragId = null
let dragStartX = 0
let dragStartY = 0
let dragOriginX = 0
let dragDeciding = true
let dragHorizontal = false
let dragLastX = 0
let dragLastT = 0
let dragVelocity = 0
let dragRowWidth = DELETE_WIDTH

function beginDrag(id, x, y, width) {
  dragId = id
  dragStartX = x
  dragStartY = y
  dragOriginX = xFor(id)
  dragDeciding = true
  dragHorizontal = false
  dragLastX = x
  dragLastT = performance.now()
  dragVelocity = 0
  dragRowWidth = width || DELETE_WIDTH
  rowWidths[id] = dragRowWidth
}

function updateDrag(x, y) {
  if (dragId === null) return
  if (dragDeciding) {
    const dx = x - dragStartX
    const dy = y - dragStartY
    if (Math.abs(dx) < 6 && Math.abs(dy) < 6) return
    dragDeciding = false
    dragHorizontal = Math.abs(dx) > Math.abs(dy)
    if (!dragHorizontal) {
      dragId = null
      return
    }
    for (const id of Object.keys(rowX)) {
      if (id !== dragId) rowX[id] = 0
    }
    draggingId.value = dragId
  }
  if (!dragHorizontal) return
  const now = performance.now()
  if (now > dragLastT) dragVelocity = (x - dragLastX) / (now - dragLastT)
  dragLastX = x
  dragLastT = now
  const raw = dragOriginX + (x - dragStartX)
  rowX[dragId] = Math.min(0, Math.max(-dragRowWidth, raw))
}

function endDrag() {
  draggingId.value = null
  if (dragId === null) return
  const id = dragId
  const width = dragRowWidth
  dragId = null
  if (dragDeciding || !dragHorizontal) return
  if (-rowX[id] >= width * FULL_SWIPE_RATIO) {
    rowX[id] = -width
    setTimeout(() => {
      transactionsStore.deleteTransaction(id)
      delete rowX[id]
      delete rowWidths[id]
    }, 220)
    return
  }
  const open = dragVelocity < -0.4 || (rowX[id] < -DELETE_WIDTH / 2 && dragVelocity < 0.4)
  rowX[id] = open ? -DELETE_WIDTH : 0
}

function onTouchStart(transaction, e) {
  if (e.touches.length === 1) {
    beginDrag(
      transaction.id,
      e.touches[0].clientX,
      e.touches[0].clientY,
      e.currentTarget.getBoundingClientRect().width,
    )
  }
}
function onTouchMove(e) {
  updateDrag(e.touches[0].clientX, e.touches[0].clientY)
}
function onTouchEnd() {
  endDrag()
}

function onBodyMouseMove(e) {
  updateDrag(e.clientX, e.clientY)
}
function onBodyMouseUp() {
  window.removeEventListener('mousemove', onBodyMouseMove)
  window.removeEventListener('mouseup', onBodyMouseUp)
  endDrag()
}
function onMouseDown(transaction, e) {
  if (e.button !== 0) return
  beginDrag(transaction.id, e.clientX, e.clientY, e.currentTarget.getBoundingClientRect().width)
  window.addEventListener('mousemove', onBodyMouseMove)
  window.addEventListener('mouseup', onBodyMouseUp)
}

function rowStyle(id) {
  return {
    transform: `translateX(${xFor(id)}px)`,
    transition: draggingId.value === id ? 'none' : 'transform 0.25s cubic-bezier(0.2, 0.8, 0.2, 1)',
  }
}

function onRowClick(transaction) {
  if (xFor(transaction.id) !== 0) {
    rowX[transaction.id] = 0
    return
  }
  viewTransaction(transaction)
}

function deleteTransaction(transaction) {
  delete rowX[transaction.id]
  transactionsStore.deleteTransaction(transaction.id)
}

function onOutsideClick(e) {
  if (!e.target.closest('.transaction-wrap')) closeAll()
}

onMounted(() => document.addEventListener('mousedown', onOutsideClick))
onUnmounted(() => document.removeEventListener('mousedown', onOutsideClick))

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

function matchesQuery(transaction, query) {
  const haystack = [
    categoryFor(transaction)?.name,
    transaction.account,
    transaction.payee,
    transaction.notes,
    (transaction.amount / 100).toFixed(2),
  ]
  return haystack.some((field) => field?.toLowerCase().includes(query))
}

const groups = computed(() => {
  const query = searchQuery.value.trim().toLowerCase()
  const matching = query
    ? transactionsStore.items.filter((t) => matchesQuery(t, query))
    : transactionsStore.items

  const sorted = [...matching].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))

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
          class="transaction-wrap"
        >
          <button
            class="delete-action"
            :style="deleteActionStyle(transaction.id)"
            aria-label="Delete transaction"
            @click="deleteTransaction(transaction)"
          >
            <span class="delete-pill" :class="{ expanded: isFullSwipe(transaction.id) }">
              <svg class="delete-icon" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path
                  d="M4 7h16M9 7V4h6v3M6 7l1 13a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-13M10 11v6M14 11v6"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
              </svg>
            </span>
          </button>

          <div
            class="transaction-row"
            :style="rowStyle(transaction.id)"
            @click="onRowClick(transaction)"
            @touchstart="onTouchStart(transaction, $event)"
            @touchmove="onTouchMove"
            @touchend="onTouchEnd"
            @touchcancel="onTouchEnd"
            @mousedown="onMouseDown(transaction, $event)"
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
      </div>

      <div class="day-sum">
        Sum:
        <span :class="{ negative: group.sum < 0, positive: group.sum > 0 }">
          {{ formatAmount(group.sum) }}
        </span>
      </div>
    </section>

    <SelectTransactionPeriod v-model:open="periodOpen" v-model="period" />
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
  overflow: hidden;
}

.transaction-wrap {
  position: relative;
}

/* Inset divider: starts at the name (past the icon), runs to the edge. Lives on
   the row so it travels with a swipe instead of sitting under the delete action. */
.transaction-wrap:not(:first-child) .transaction-row::before {
  content: '';
  position: absolute;
  top: 0;
  left: 4.35rem;
  right: 0;
  height: 1px;
  background: rgba(255, 255, 255, 0.1);
}

.delete-action {
  position: absolute;
  z-index: 0;
  top: 0;
  right: 0;
  bottom: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  border: none;
  background: #000000;
  cursor: pointer;
  overflow: hidden;
}

.delete-pill {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 2.25rem;
  height: 2.25rem;
  padding: 0;
  border-radius: 999px;

  background-color: rgba(255, 69, 58, 0.85);
  backdrop-filter: blur(4px);
  -webkit-backdrop-filter: blur(4px);
  border: 1px solid rgba(255, 255, 255, 0.16);
  color: #fff;

  box-shadow:
    0 1px 2px rgba(0, 0, 0, 0.4),
    inset 0 1px 0 rgba(255, 255, 255, 0.08);

  transition:
    width 0.2s ease,
    height 0.2s ease,
    border-radius 0.2s ease,
    background-color 0.2s ease;
}

.delete-pill.expanded {
  width: 100%;
  height: 100%;
  border-radius: 0;
  background-color: rgba(255, 69, 58, 1);
  border-color: transparent;
}

.delete-icon {
  width: 1.1rem;
  height: 1.1rem;
  fill: none;
}

.transaction-row {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: center;
  gap: 0.85rem;
  padding: 0.55rem 1.25rem;
  background-color: rgb(34, 34, 34);
  touch-action: pan-y;
}

.transaction-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  flex: none;
  width: 2rem;
  height: 2rem;
  border-radius: 0.65rem;
  background: linear-gradient(160deg, #48484a 0%, #232325 55%, #0a0a0b 100%);
  box-shadow:
    inset 0 1px 1px rgba(255, 255, 255, 0.35),
    inset 0 -1px 2px rgba(0, 0, 0, 0.5),
    0 1px 2px rgba(0, 0, 0, 0.4);
}

.transaction-icon img {
  width: 1.05rem;
  height: 1.05rem;
  object-fit: contain;
  filter: invert(1);
}

.transaction-main {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.transaction-name {
  font-size: 0.95rem;
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
}

.transaction-amount.negative {
  color: #ff8a8a;
}

.transaction-amount.positive {
  color: #7ee08a;
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
