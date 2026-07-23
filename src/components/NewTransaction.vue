<script setup>
import { computed, nextTick, ref, watch } from 'vue'
import TheModal from './TheModal.vue'
import SelectionList from './SelectionList.vue'

// The "New Transaction" sheet: a TheModal shell with its own title, a "Save"
// action on the right, and the transaction form as the body. Driven by
// v-model:open from the layout.
const props = defineProps({
  open: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['update:open'])

// The sheet's right-hand action. Its click surfaces via TheModal's button-click.
const rightButtons = [{ id: 'save', label: 'Save' }]

// Transaction form state.
const types = [
  { id: 'expense', label: 'Expense' },
  { id: 'income', label: 'Income' },
  { id: 'transfer', label: 'Transfer' },
]

// Placeholder categories, keyed by transaction type.
const categoriesByType = {
  expense: ['expenseCategory 1', 'expenseCategory 2', 'expenseCategory 3'],
  income: ['incomeCategory 1', 'incomeCategory 2', 'incomeCategory 3'],
  transfer: ['transferCategory 1', 'transferCategory 2', 'transferCategory 3'],
}

const accounts = ['Account 1', 'Account 2', 'Account 3']
const payees = ['Self', 'Payee 1', 'Payee 2', 'Payee 3']
const repeats = ['Never', 'Daily', 'Weekly', 'Monthly', 'Yearly']

const type = ref('expense')
const amount = ref('')
const account = ref('')
const category = ref('')
const payee = ref('Self')
const date = ref('')
const time = ref('')
const repeat = ref('')
const location = ref(false)
const selectedLocation = ref('')

// Keep only digits and a single decimal point, capping the fraction at 2 places.
function onAmountInput(e) {
  let value = e.target.value.replace(/[^\d.]/g, '')
  const [whole, ...rest] = value.split('.')
  value = rest.length ? `${whole}.${rest.join('').slice(0, 2)}` : whole
  amount.value = value
  e.target.value = value
}

// A single pill that slides behind the active type option, matching TabBar's
// spring-driven active indicator.
const toggleRef = ref(null)
const indicatorStyle = ref({})

function updateIndicator() {
  const el = toggleRef.value?.querySelector('.type-option.active')
  if (!el) return
  indicatorStyle.value = {
    width: `${el.offsetWidth}px`,
    height: `${el.offsetHeight}px`,
    transform: `translateX(${el.offsetLeft}px)`,
  }
}

// Expenses read as negative; income and transfers as-is.
const amountSign = computed(() => (type.value === 'expense' ? '-' : ''))
const categories = computed(() => categoriesByType[type.value])

// Native date/time inputs expect `YYYY-MM-DD` and `HH:MM` in local time.
function setNow() {
  const now = new Date()
  const pad = (n) => String(n).padStart(2, '0')
  date.value = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`
  time.value = `${pad(now.getHours())}:${pad(now.getMinutes())}`
}

function resetForm() {
  type.value = 'expense'
  amount.value = ''
  account.value = ''
  category.value = ''
  payee.value = 'Self'
  date.value = ''
  time.value = ''
  repeat.value = ''
  location.value = false
  selectedLocation.value = ''
}

function selectType(id) {
  type.value = id
  // Category is unique per type, so clear it when the type changes.
  category.value = ''
  nextTick(updateIndicator)
}

// Reveal the newly shown "Selected" row when Location is enabled.
watch(location, async (on) => {
  if (!on || !scroller) return
  await nextTick()
  scroller.scrollTo({ top: scroller.scrollHeight, behavior: 'smooth' })
})

function onButton({ id }) {
  if (id === 'save') {
    // TODO: persist the new transaction.
    emit('update:open', false)
  }
}

// The modal panel that scrolls, resolved when the sheet opens.
let scroller = null

watch(
  () => props.open,
  async (isOpen) => {
    if (isOpen) {
      // Wait for the teleported panel to mount.
      await nextTick()
      scroller = document.querySelector('.modal-panel')
      setNow()
      updateIndicator()
    } else {
      scroller = null
      resetForm()
    }
  },
)
</script>

<template>
  <TheModal
    :open="open"
    title="New Transaction"
    :right-buttons="rightButtons"
    full
    @update:open="emit('update:open', $event)"
    @button-click="onButton"
  >
    <div class="amount-card">
      <div class="amount-row">
        <span class="amount-sign">{{ amountSign }}$</span>
        <input
          :value="amount"
          class="amount-input"
          type="text"
          inputmode="decimal"
          placeholder="0"
          @input="onAmountInput"
        />
      </div>

      <div class="amount-divider"></div>

      <div ref="toggleRef" class="type-toggle">
        <div class="type-indicator" :style="indicatorStyle"></div>
        <button
          v-for="t in types"
          :key="t.id"
          type="button"
          class="type-option"
          :class="{ active: type === t.id }"
          @click="selectType(t.id)"
        >
          {{ t.label }}
        </button>
      </div>
    </div>

    <h2 class="section-title">Assignment</h2>
    <div class="field-card">
      <SelectionList v-model="account" label="Account" :options="accounts" />
      <SelectionList v-model="category" label="Category" :options="categories" />
      <SelectionList v-model="payee" label="Payee" :options="payees" />
    </div>

    <h2 class="section-title">Date and Time</h2>
    <div class="field-card">
      <SelectionList v-model="date" label="Date" type="date" />
      <SelectionList v-model="time" label="Time" type="time" />
      <SelectionList v-model="repeat" label="Repeat" :options="repeats" />
    </div>

    <h2 class="section-title">Location</h2>
    <div class="field-card">
      <SelectionList v-model="location" label="Enable Location" type="toggle" />
      <SelectionList
        v-if="location"
        v-model="selectedLocation"
        label="Selected"
        placeholder="Location"
      />
    </div>
  </TheModal>
</template>

<style scoped>
.amount-card {
  background-color: var(--surface-1);
  border-radius: 25px;
  padding: 0.75rem 1rem 0.7rem;
  margin-top: 0.5rem;
}

.amount-row {
  display: flex;
  align-items: baseline;
  gap: 0.1rem;
}

.amount-sign,
.amount-input {
  font-family:
    ui-rounded,
    'SF Pro Rounded',
    -apple-system,
    sans-serif;
}

.amount-sign {
  font-size: 2.25rem;
  font-weight: 600;
}

.amount-input {
  flex: 1;
  min-width: 0;
  border: none;
  background: transparent;
  color: #ffffff;
  caret-color: #ffffff;
  font-size: 2.25rem;
  font-weight: 600;
  outline: none;
  padding: 0;
}

.amount-input::placeholder {
  color: rgba(255, 255, 255, 0.4);
}

.amount-divider {
  height: 1px;
  background-color: rgba(255, 255, 255, 0.1);
  margin: 0.4rem -1rem 0;
}

.type-toggle {
  position: relative;
  display: flex;
  gap: 0.25rem;
  margin-top: 0.7rem;
}

.type-indicator {
  position: absolute;
  top: 0;
  left: 0;
  border-radius: 999px;
  background-color: var(--surface-2);
  transition:
    transform 0.5s cubic-bezier(0.34, 1.2, 0.4, 1),
    width 0.5s cubic-bezier(0.34, 1.2, 0.4, 1),
    height 0.5s cubic-bezier(0.34, 1.2, 0.4, 1);
  will-change: transform;
  pointer-events: none;
  z-index: 0;
}

.type-option {
  position: relative;
  z-index: 1;
  flex: 1;
  border: none;
  background: transparent;
  color: rgba(255, 255, 255, 0.55);
  font-size: 1rem;
  font-weight: 500;
  padding: 0.3rem 0;
  border-radius: 999px;
  cursor: pointer;
  transition: color 0.2s ease;
}

.type-option.active {
  color: #ffffff;
}

.section-title {
  font-size: 1.25rem;
  font-weight: 600;
  margin: 1.75rem 0 0.75rem 14px;
}

.field-card {
  background-color: var(--surface-1);
  border-radius: 25px;
  padding: 0 1.25rem;
}
</style>
