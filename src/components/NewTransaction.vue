<script setup>
import { computed, nextTick, provide, reactive, ref, watch } from 'vue'
import TheModal from './TheModal.vue'
import TransactionForm from './NewTransactionComponents/TransactionForm.vue'
import SelectAccount from './NewTransactionComponents/SelectAccount.vue'
import SelectCategory from './NewTransactionComponents/SelectCategory.vue'
import SelectPayee from './NewTransactionComponents/SelectPayee.vue'
import SelectLocation from './NewTransactionComponents/SelectLocation.vue'
import NewAccount from './NewTransactionComponents/NewAccount.vue'
import NewCategory from './NewTransactionComponents/NewCategory.vue'
import NewPayee from './NewTransactionComponents/NewPayee.vue'
import NewLocation from './NewTransactionComponents/NewLocation.vue'
import { useCategoriesStore } from '../stores/categories'

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

const accounts = ['Account 1', 'Account 2', 'Account 3']
const payees = ['Self']
const repeats = ['Never', 'Daily', 'Weekly', 'Monthly', 'Yearly']
const locations = {
  saved: [],
  recents: [],
}

const categoriesStore = useCategoriesStore()
const categories = computed(() => categoriesStore.byType[form.type] ?? [])

const stack = ref(['root'])
const direction = ref('forward')
const current = computed(() => stack.value[stack.value.length - 1])

const modal = ref(null)
const viewRef = ref(null)
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
  locations,
  push,
  pop,
})

const views = {
  account: SelectAccount,
  category: SelectCategory,
  payee: SelectPayee,
  location: SelectLocation,
  newAccount: NewAccount,
  newCategory: NewCategory,
  newPayee: NewPayee,
  newLocation: NewLocation,
}

const newViews = {
  account: 'newAccount',
  category: 'newCategory',
  payee: 'newPayee',
  location: 'newLocation',
}
const viewComponent = computed(() => views[current.value] ?? TransactionForm)

// iOS-style edge-swipe back. While dragging, the previous page is rendered
// underneath (parallax-offset and dimmed) and the current page tracks the
// finger; release either settles into a pop or springs back. The eventual pop
// swaps views with no Transition ('none') since the drag already animated it.
const stackEl = ref(null)
const prevView = computed(() => stack.value[stack.value.length - 2])
const prevComponent = computed(() => views[prevView.value] ?? TransactionForm)

const swipe = reactive({
  active: false,
  settling: false,
  complete: false,
  x: 0,
  width: 1,
  scrollOffset: 0,
})

const swipeProgress = computed(() => Math.min(Math.max(swipe.x / swipe.width, 0), 1))
const settleTransition = 'transform 0.4s cubic-bezier(0.32, 0.72, 0, 1), opacity 0.4s cubic-bezier(0.32, 0.72, 0, 1)'

const swipeCurrentStyle = computed(() => {
  if (!swipe.active) return null
  return {
    transform: `translateX(${swipeProgress.value * 100}%)`,
    transition: swipe.settling ? settleTransition : 'none',
    boxShadow: '0 0 24px rgba(0, 0, 0, 0.4)',
  }
})

const swipePrevStyle = computed(() => ({
  transform: `translateX(${(swipeProgress.value - 1) * 30}%)`,
  // Pin the preview where the previous page's own scroll position will put it
  // once the shared scroller is restored on pop.
  top: `${swipe.scrollOffset}px`,
  transition: swipe.settling ? settleTransition : 'none',
}))

const swipeDimStyle = computed(() => ({
  opacity: 1 - swipeProgress.value,
  transition: swipe.settling ? settleTransition : 'none',
}))

let swipeTracking = false
let swipeStartX = 0
let swipeStartY = 0
let swipeLastX = 0
let swipeLastT = 0
let swipeVelocity = 0

function swipeStart(x, y) {
  if (isRoot.value || swipe.active) return false
  const rect = stackEl.value.getBoundingClientRect()
  if (x - rect.left > 32) return false
  swipeTracking = true
  swipeStartX = x
  swipeStartY = y
  swipeLastX = x
  swipeLastT = performance.now()
  swipeVelocity = 0
  swipe.width = rect.width
  return true
}

function swipeMove(x, y) {
  if (!swipeTracking) return false
  if (!swipe.active) {
    const dx = x - swipeStartX
    const dy = y - swipeStartY
    if (Math.abs(dy) > Math.abs(dx)) {
      swipeTracking = false
      return false
    }
    if (dx < 6) return false
    swipe.active = true
    swipe.settling = false
    swipe.complete = false
    swipe.scrollOffset = (modal.value?.getScrollTop() ?? 0) - (scrollPositions[prevView.value] ?? 0)
  }
  const now = performance.now()
  if (now > swipeLastT) swipeVelocity = (x - swipeLastX) / (now - swipeLastT)
  swipeLastX = x
  swipeLastT = now
  swipe.x = Math.max(0, x - swipeStartX)
  return true
}

function swipeEnd() {
  if (!swipeTracking) return
  swipeTracking = false
  if (!swipe.active) return
  const complete = swipeVelocity > 0.4 || (swipeProgress.value > 0.35 && swipeVelocity > -0.2)
  swipe.complete = complete
  const target = complete ? swipe.width : 0
  if (swipe.x === target) {
    finishSwipe()
    return
  }
  swipe.settling = true
  swipe.x = target
}

function finishSwipe() {
  swipe.settling = false
  if (swipe.complete) {
    navigateTo(prevView.value, 'none')
    stack.value = stack.value.slice(0, -1)
  }
  swipe.active = false
  swipe.x = 0
}

function onSwipeSettled(e) {
  if (!swipe.settling || e.target !== e.currentTarget || e.propertyName !== 'transform') return
  finishSwipe()
}

// stopPropagation keeps the edge gesture from also engaging the sheet's own
// drag-to-dismiss tracking on the panel.
function onStackTouchStart(e) {
  if (e.touches.length === 1 && swipeStart(e.touches[0].clientX, e.touches[0].clientY)) e.stopPropagation()
}

function onStackTouchMove(e) {
  if (swipeMove(e.touches[0].clientX, e.touches[0].clientY)) {
    e.preventDefault()
    e.stopPropagation()
  }
}

function onStackMouseMove(e) {
  swipeMove(e.clientX, e.clientY)
}

function onStackMouseUp() {
  window.removeEventListener('mousemove', onStackMouseMove)
  window.removeEventListener('mouseup', onStackMouseUp)
  swipeEnd()
}

function onStackMouseDown(e) {
  if (e.button !== 0) return
  if (!swipeStart(e.clientX, e.clientY)) return
  e.stopPropagation()
  window.addEventListener('mousemove', onStackMouseMove)
  window.addEventListener('mouseup', onStackMouseUp)
}

// Non-passive so preventDefault can swallow the native vertical scroll once the
// horizontal drag takes over (template listeners are passive by default here).
watch(stackEl, (el, prev) => {
  if (prev) prev.removeEventListener('touchmove', onStackTouchMove)
  if (el) el.addEventListener('touchmove', onStackTouchMove, { passive: false })
})

const backIcon = `<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
  <path d="M15 5a1 1 0 0 1 0 1.41L9.42 12l5.58 5.59A1 1 0 0 1 13.6 19l-6.3-6.3a1 1 0 0 1 0-1.4l6.3-6.3A1 1 0 0 1 15 5z" />
</svg>`

const addIcon = `<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" stroke="currentColor" stroke-width="2.5" stroke-linecap="round">
  <path d="M12 5v14M5 12h14" />
</svg>`

const titles = {
  root: 'New Transaction',
  account: 'Select Account',
  category: 'Select Category',
  payee: 'Select Payee',
  location: 'Select Location',
  newAccount: 'New Account',
  newCategory: 'New Category',
  newPayee: 'New Payee',
  newLocation: 'New Location',
}

const isRoot = computed(() => current.value === 'root')
const title = computed(() => titles[current.value] ?? '')
const leftButtons = computed(() => (isRoot.value ? [] : [{ id: 'back', label: 'Back', icon: backIcon }]))
const rightButtons = computed(() => {
  if (newViews[current.value]) return [{ id: 'add', label: 'Add', icon: addIcon }]
  return [{ id: 'save', label: 'Save' }]
})

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
  swipeTracking = false
  Object.assign(swipe, { active: false, settling: false, complete: false, x: 0 })
}

function onButton({ id }) {
  if (id === 'back') {
    pop()
  } else if (id === 'add') {
    push(newViews[current.value])
  } else if (id === 'save') {
    if (isRoot.value) {
      emit('update:open', false)
      return
    }
    if (viewRef.value?.save?.() === false) return
    pop()
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
    :drag-to-close="isRoot"
    full
    @update:open="emit('update:open', $event)"
    @button-click="onButton"
  >
    <div
      ref="stackEl"
      class="nav-stack"
      :style="{ '--leave-top': `${leaveTop}px` }"
      @touchstart="onStackTouchStart"
      @touchend="swipeEnd"
      @touchcancel="swipeEnd"
      @mousedown="onStackMouseDown"
    >
      <div v-if="swipe.active" class="swipe-prev" :style="swipePrevStyle">
        <component :is="prevComponent" />
        <div class="swipe-dim" :style="swipeDimStyle"></div>
      </div>
      <Transition :name="`nav-${direction}`">
        <component
          :is="viewComponent"
          ref="viewRef"
          :key="current"
          :style="swipeCurrentStyle"
          @transitionend="onSwipeSettled"
        />
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

.swipe-prev {
  position: relative;
}

.swipe-dim {
  position: absolute;
  inset: 0;
  background-color: rgba(0, 0, 0, 0.25);
  pointer-events: none;
}
</style>
