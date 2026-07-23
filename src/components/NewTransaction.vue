<script setup>
import { computed, nextTick, provide, reactive, ref, watch } from 'vue'
import TheModal from './TheModal.vue'
import TransactionForm from './NewTransactionComponents/TransactionForm.vue'
import SelectAccount from './NewTransactionComponents/SelectAccount.vue'
import SelectCategory from './NewTransactionComponents/SelectCategory.vue'
import SelectPayee from './NewTransactionComponents/SelectPayee.vue'

const props = defineProps({
  open: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['update:open'])

const form = reactive({
  type: 'expense',
  amount: '',
  account: '',
  category: '',
  payee: 'Self',
  date: '',
  time: '',
  repeat: '',
  location: false,
  selectedLocation: '',
})

const types = [
  { id: 'expense', label: 'Expense' },
  { id: 'income', label: 'Income' },
  { id: 'transfer', label: 'Transfer' },
]

const categoriesByType = {
  expense: ['expenseCategory 1', 'expenseCategory 2', 'expenseCategory 3'],
  income: ['incomeCategory 1', 'incomeCategory 2', 'incomeCategory 3'],
  transfer: ['transferCategory 1', 'transferCategory 2', 'transferCategory 3'],
}

const accounts = ['Account 1', 'Account 2', 'Account 3']
const payees = ['Self', 'Payee 1', 'Payee 2', 'Payee 3']
const repeats = ['Never', 'Daily', 'Weekly', 'Monthly', 'Yearly']

const categories = computed(() => categoriesByType[form.type])

const stack = ref(['root'])
const direction = ref('forward')
const current = computed(() => stack.value[stack.value.length - 1])

const modal = ref(null)
let scrollPositions = {}

// The two pages share one scroll container, so restoring the incoming page's
// scroll position would visibly yank the outgoing page mid-slide. The leaving
// page is offset by the scroll delta to keep it visually pinned.
const leaveTop = ref(0)

function restoreScroll(view) {
  nextTick(() => modal.value?.setScrollTop(scrollPositions[view] ?? 0))
}

function navigateTo(view, dir) {
  const from = modal.value?.getScrollTop() ?? 0
  scrollPositions[current.value] = from
  leaveTop.value = (scrollPositions[view] ?? 0) - from
  direction.value = dir
  restoreScroll(view)
}

function push(view) {
  navigateTo(view, 'forward')
  stack.value = [...stack.value, view]
}

function pop() {
  const next = stack.value[stack.value.length - 2]
  navigateTo(next, 'back')
  stack.value = stack.value.slice(0, -1)
}

provide('newTransaction', {
  form,
  types,
  accounts,
  categories,
  payees,
  repeats,
  push,
  pop,
})

const views = { account: SelectAccount, category: SelectCategory, payee: SelectPayee }
const viewComponent = computed(() => views[current.value] ?? TransactionForm)

const backIcon = `<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
  <path d="M15 5a1 1 0 0 1 0 1.41L9.42 12l5.58 5.59A1 1 0 0 1 13.6 19l-6.3-6.3a1 1 0 0 1 0-1.4l6.3-6.3A1 1 0 0 1 15 5z" />
</svg>`

const titles = {
  root: 'New Transaction',
  account: 'Select Account',
  category: 'Select Category',
  payee: 'Select Payee',
}

const isRoot = computed(() => current.value === 'root')
const title = computed(() => titles[current.value] ?? '')
const leftButtons = computed(() => (isRoot.value ? [] : [{ id: 'back', label: 'Back', icon: backIcon }]))
const rightButtons = computed(() => (isRoot.value ? [{ id: 'save', label: 'Save' }] : []))

function setNow() {
  const now = new Date()
  const pad = (n) => String(n).padStart(2, '0')
  form.date = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`
  form.time = `${pad(now.getHours())}:${pad(now.getMinutes())}`
}

function reset() {
  Object.assign(form, {
    type: 'expense',
    amount: '',
    account: '',
    category: '',
    payee: 'Self',
    date: '',
    time: '',
    repeat: '',
    location: false,
    selectedLocation: '',
  })
  stack.value = ['root']
  direction.value = 'forward'
  scrollPositions = {}
}

function onButton({ id }) {
  if (id === 'back') {
    pop()
  } else if (id === 'save') {
    emit('update:open', false)
  }
}

watch(
  () => props.open,
  (isOpen) => {
    if (isOpen) setNow()
    else reset()
  },
)
</script>

<template>
  <TheModal
    ref="modal"
    :open="open"
    :title="title"
    :left-buttons="leftButtons"
    :right-buttons="rightButtons"
    :transition-key="current"
    full
    @update:open="emit('update:open', $event)"
    @button-click="onButton"
  >
    <div class="nav-stack" :style="{ '--leave-top': `${leaveTop}px` }">
      <Transition :name="`nav-${direction}`">
        <component :is="viewComponent" :key="current" />
      </Transition>
    </div>
  </TheModal>
</template>

<style scoped>
.nav-stack {
  position: relative;
  flex: 1;
  /* During a transition both pages share the single grid cell, so each one
     stretches to the full stack height — the incoming opaque page always
     covers the outgoing one, whichever is taller. */
  display: grid;
  /* Bleed to the sheet's full width past the body gutter and the scroller's
     inset, so the sliding pages' opaque backgrounds cover edge to edge — the
     gutter is re-applied as padding on each page below. */
  --page-inset-left: calc(max(var(--app-gutter), env(safe-area-inset-left)) + 8px);
  --page-inset-right: calc(max(var(--app-gutter), env(safe-area-inset-right)) + 8px);
  margin-left: calc(-1 * var(--page-inset-left));
  margin-right: calc(-1 * var(--page-inset-right));
  /* Bleed upward under the header the same way, so a page sliding in covers
     the outgoing page's content showing through the header's translucent
     falloff. The inset is re-applied as padding on each page below. */
  margin-top: calc(-1 * var(--modal-header-height, 0px));
}

.nav-stack > * {
  grid-area: 1 / 1;
  min-width: 0;
  background-color: #1c1c1c;
  padding-left: var(--page-inset-left);
  padding-right: var(--page-inset-right);
  box-sizing: border-box;
  /* Header-height bleed plus breathing room below the header. Lives on the
     page itself (not .nav-stack) so each page's top margin can't collapse out
     of the stack, which caused a jump mid-transition. */
  padding-top: calc(var(--modal-header-height, 0px) + 0.75rem);
}

.nav-forward-enter-active,
.nav-forward-leave-active,
.nav-back-enter-active,
.nav-back-leave-active {
  transition: transform 0.5s cubic-bezier(0.32, 0.72, 0, 1);
}

/* Keep the leaving page visually pinned while the shared scroller jumps to the
   incoming page's restored scroll position. */
.nav-forward-leave-active,
.nav-back-leave-active {
  position: relative;
  top: var(--leave-top, 0px);
}

/* Whichever page slides over the other sits on top: the entering page when
   pushing, the leaving page when popping. */
.nav-forward-enter-active,
.nav-back-leave-active {
  z-index: 1;
}

.nav-forward-enter-from {
  transform: translateX(100%);
}

.nav-forward-leave-to {
  transform: translateX(-30%);
}

.nav-back-enter-from {
  transform: translateX(-30%);
}

.nav-back-leave-to {
  transform: translateX(100%);
}
</style>
