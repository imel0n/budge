<script setup>
import { computed, defineComponent, onMounted, provide, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import HeaderBar from '../components/HeaderBar.vue'
import HeaderButton from '../components/HeaderButton.vue'
import TabBar from '../components/TabBar.vue'
import NewTransaction from '../components/NewTransaction.vue'
import TheTransactions from '../pages/TheTransactions.vue'

// Raw SVG for the "+" glyph. It carries no size or fill of its own — HeaderButton
// sizes it and paints it with `currentColor`.
const plusIcon = `<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
  <path d="M12 3a1 1 0 0 1 1 1v7h7a1 1 0 1 1 0 2h-7v7a1 1 0 1 1-2 0v-7H4a1 1 0 1 1 0-2h7V4a1 1 0 0 1 1-1z" />
</svg>`

// The "New Transaction" sheet, opened by the fixed Add Transaction action.
const newTransactionOpen = ref(false)

const route = useRoute()

// Header state is double-buffered: pages write into `pending`, and `header` is
// what the HeaderBar actually shows. Normally every write commits immediately,
// but during slide transitions the commit is held until the incoming page has
// fully slid in, so the header keeps the outgoing page's state mid-flight.
const pending = {
  title: '',
  titleVisible: false,
  left: [],
  right: [],
  onClick: () => {},
}

const header = ref({ ...pending, key: route.path })

let deferHeader = false
let headerCommitTimer = 0

function applyHeader() {
  header.value = { ...pending, key: route.path }
}

// Commit a deferred header mid-slide rather than waiting for the whole page to
// finish sliding in. The header's own cross-fade is 0.3s, so releasing it a
// little into the slide lets it settle right as the page arrives instead of
// visibly lagging behind it.
function commitHeader() {
  clearTimeout(headerCommitTimer)
  if (!deferHeader) return
  deferHeader = false
  applyHeader()
}

function setPageTitle(title) {
  pending.title = title
  if (!deferHeader) applyHeader()
}

provide('setPageTitle', setPageTitle)

// Whether the HeaderBar's own title is shown. Pages toggle this (via
// usePageTitle) as their <h1> scrolls behind the fixed header.
function setHeaderTitleVisible(visible) {
  pending.titleVisible = visible
  if (!deferHeader) applyHeader()
}

provide('setHeaderTitleVisible', setHeaderTitleVisible)

function setHeaderButtons({ left = [], right = [], onClick = () => {} } = {}) {
  pending.left = left
  pending.right = right
  pending.onClick = onClick
  if (!deferHeader) applyHeader()
}

provide('setHeaderButtons', setHeaderButtons)

// ViewTransaction slides in over the list (push) and back out (pop);
// every other navigation keeps the cross-fade.
const transitionName = ref('page-fade')

// While the transaction page is open it covers the "+" button and TabBar, so
// they're hidden once the push completes (already covered by the opaque page)
// and restored the moment a pop starts (still covered until the slide reveals
// them).
const chromeHidden = ref(route.name === 'transaction')

// Reset the header to a blank slate on every navigation, before the incoming
// page's setup runs its own setHeaderButtons() — a page can never inherit the
// previous page's buttons.
watch(
  () => route.name,
  (to, from) => {
    if (swipePop) {
      swipePop = false
      transitionName.value = 'none'
    } else if (to === 'transaction') transitionName.value = 'push'
    else if (from === 'transaction') transitionName.value = 'pop'
    else transitionName.value = 'page-fade'
    clearTimeout(headerCommitTimer)
    deferHeader = transitionName.value === 'push' || transitionName.value === 'pop'
    if (to !== 'transaction') chromeHidden.value = false
    pending.titleVisible = false
    pending.left = []
    pending.right = []
    pending.onClick = () => {}
    if (!deferHeader) applyHeader()
  },
)

// Start of the slide: release the held header partway in, ahead of @after-enter.
function onPageEntering() {
  if (deferHeader) headerCommitTimer = setTimeout(commitHeader, 240)
}

function onPageEnter() {
  if (transitionName.value !== 'push' && transitionName.value !== 'pop') return
  // Slide finished — make sure the header committed even if the timer hasn't.
  commitHeader()
  chromeHidden.value = route.name === 'transaction'
  window.scrollTo(0, 0)
}

// iOS-style edge-swipe back on the transaction page, mirroring the gesture on
// NewTransaction's child pages. While dragging, the transactions list is
// rendered underneath (parallax-offset and dimmed) and the page tracks the
// finger; release either settles into a pop or springs back. The eventual pop
// navigates with no Transition ('none') since the drag already animated it.
const router = useRouter()
let swipePop = false

// The preview mounts a second TheTransactions before it's the active page, so
// its injected header/title writes are swallowed here — the real instance
// pushes them again once the pop actually navigates.
const MutedChrome = defineComponent({
  setup(_, { slots }) {
    provide('setPageTitle', () => {})
    provide('setHeaderTitleVisible', () => {})
    provide('setHeaderButtons', () => {})
    return () => slots.default?.()
  },
})

const bodyEl = ref(null)

const swipe = reactive({
  active: false,
  settling: false,
  complete: false,
  x: 0,
  width: 1,
})

const swipeProgress = computed(() => Math.min(Math.max(swipe.x / swipe.width, 0), 1))
const settleTransition =
  'transform 0.4s cubic-bezier(0.32, 0.72, 0, 1), opacity 0.4s cubic-bezier(0.32, 0.72, 0, 1)'

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
  if (route.name !== 'transaction' || swipe.active || deferHeader) return false
  const rect = bodyEl.value.getBoundingClientRect()
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
    // The chrome belongs to the revealed page; it stays covered by the opaque
    // dragged page until the drag uncovers it.
    chromeHidden.value = false
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
    swipePop = true
    // Keep the drag overlay and preview up until the route has actually
    // swapped, so the preview is replaced by the identical real page.
    router.replace({ name: 'transactions' }).then(() => {
      swipe.active = false
      swipe.x = 0
    })
    return
  }
  chromeHidden.value = true
  swipe.active = false
  swipe.x = 0
}

function onSwipeSettled(e) {
  if (!swipe.settling || e.target !== e.currentTarget || e.propertyName !== 'transform') return
  finishSwipe()
}

function onBodyTouchStart(e) {
  if (e.touches.length === 1) swipeStart(e.touches[0].clientX, e.touches[0].clientY)
}

function onBodyTouchMove(e) {
  if (swipeMove(e.touches[0].clientX, e.touches[0].clientY)) e.preventDefault()
}

function onBodyMouseMove(e) {
  swipeMove(e.clientX, e.clientY)
}

function onBodyMouseUp() {
  window.removeEventListener('mousemove', onBodyMouseMove)
  window.removeEventListener('mouseup', onBodyMouseUp)
  swipeEnd()
}

function onBodyMouseDown(e) {
  if (e.button !== 0) return
  if (!swipeStart(e.clientX, e.clientY)) return
  window.addEventListener('mousemove', onBodyMouseMove)
  window.addEventListener('mouseup', onBodyMouseUp)
}

// Non-passive so preventDefault can swallow the native vertical scroll once the
// horizontal drag takes over (template listeners are passive by default here).
onMounted(() => {
  bodyEl.value.addEventListener('touchmove', onBodyTouchMove, { passive: false })
})
</script>

<template>
  <HeaderBar
    :title="header.title"
    :title-visible="header.titleVisible"
    :left-buttons="header.left"
    :right-buttons="header.right"
    :transition-key="header.key"
    @button-click="header.onClick($event)"
  />
  <main
    ref="bodyEl"
    class="page-body"
    @touchstart="onBodyTouchStart"
    @touchend="swipeEnd"
    @touchcancel="swipeEnd"
    @mousedown="onBodyMouseDown"
  >
    <div v-if="swipe.active" class="swipe-prev" :style="swipePrevStyle">
      <MutedChrome><TheTransactions /></MutedChrome>
      <div class="swipe-dim" :style="swipeDimStyle"></div>
    </div>
    <RouterView v-slot="{ Component }">
      <Transition
        :name="transitionName"
        :mode="transitionName === 'page-fade' ? 'out-in' : undefined"
        @enter="onPageEntering"
        @after-enter="onPageEnter"
      >
        <component
          :is="Component"
          :class="{ 'swipe-current': swipe.active }"
          :style="swipeCurrentStyle"
          @transitionend="onSwipeSettled"
        />
      </Transition>
    </RouterView>
  </main>

  <!-- Fixed "Add Transaction" action, pinned to the bottom-right and lifted
       above the TabBar so it never overlaps the navigation. Lives in the layout
       so it persists across pages. -->
  <HeaderButton
    v-show="!chromeHidden"
    class="add-transaction"
    label="Add Transaction"
    :icon="plusIcon"
    @click="newTransactionOpen = true"
  />
  <TabBar v-show="!chromeHidden" />

  <!-- The "New Transaction" sheet, driven by the Add Transaction action. -->
  <NewTransaction v-model:open="newTransactionOpen" />
</template>

<style scoped>
/* Cross-fade the page body on navigation, matching the header's fade, and
   expand it up to full size from a slight shrink (same as the header buttons). */
.page-fade-enter-active {
  transition:
    opacity 0.18s ease,
    transform 0.3s ease;
}

.page-fade-enter-from {
  opacity: 0.3;
  transform: scale(0.995);
}

/* Pin the scale pivot to the centre of the visible viewport rather than the
   centre of the (possibly taller-than-viewport) page box, so the zoom stays
   centred on what the user is actually looking at. */
.page-fade-enter-active,
.page-fade-enter-from {
  transform-origin: center 50vh;
}

/* The sliding page is lifted out of flow into a fixed, opaque overlay for the
   duration of the slide (or drag), replicating .page-body's insets so its
   content lands exactly where it will sit once back in flow. */
.push-enter-active,
.pop-leave-active,
.swipe-current,
.swipe-prev {
  position: fixed;
  inset: 0;
  background: #000;
  box-sizing: border-box;
  padding-top: var(--header-height);
  padding-left: max(var(--app-gutter), env(safe-area-inset-left));
  padding-right: max(var(--app-gutter), env(safe-area-inset-right));
}

/* z-index keeps the moving page above the "+" button (z 10) and TabBar, but
   under the fixed HeaderBar (z 100), so it slides beneath the header's
   gradient. The swipe preview stays below the chrome, like the page it stands
   in for. */
.push-enter-active,
.pop-leave-active,
.swipe-current {
  z-index: 20;
}

.push-enter-active,
.pop-leave-active {
  transition: transform 0.5s cubic-bezier(0.32, 0.72, 0, 1) 0.1s;
}

.swipe-prev {
  overflow: hidden;
}

/* Solid black so the preview fades from black in step with the drag — its
   opacity tracks 1 − progress. */
.swipe-dim {
  position: absolute;
  inset: 0;
  background-color: #000;
  pointer-events: none;
}

.push-enter-from,
.pop-leave-to {
  transform: translateX(100%);
}

/* The page underneath stays in normal flow, sliding with the same 30% parallax
   as the drag gesture's preview while fading to/from black. Slightly shorter
   than the slide so it's already gone when the sliding page drops back into
   flow. */
.push-leave-active,
.pop-enter-active {
  transition:
    transform 0.45s cubic-bezier(0.32, 0.72, 0, 1) 0.1s,
    opacity 0.45s cubic-bezier(0.32, 0.72, 0, 1) 0.1s;
}

.push-leave-to,
.pop-enter-from {
  transform: translateX(-30%);
  opacity: 0;
}

/* Locked to the bottom-right corner, sitting a comfortable gap above the TabBar
   (which is pinned to the bottom with the safe-area inset). */
.add-transaction {
  position: fixed;
  right: 20px;
  bottom: calc(env(safe-area-inset-bottom) + 72px);
  z-index: 10;
  /* Larger tap target than the header buttons, with matching roomier padding. */
  min-width: 3.5rem;
  min-height: 3.5rem;
  padding: 1rem;
}

/* Enlarge the "+" glyph within this button only. */
.add-transaction :deep(.icon svg) {
  width: 2.25rem;
  height: 2.25rem;
}

/* Same gutter as the header content, so page bodies align with it. */
.page-body {
  /* Fill the full viewport height, including the bottom safe-area inset. In a
     standalone PWA, `dvh` stops above the home indicator and leaves a strip of
     the black <body> showing; `lvh` (large viewport) spans the whole screen, so
     the background reaches the very bottom edge. `vh` is the fallback. */
  min-height: 100vh;
  min-height: 100lvh;
  box-sizing: border-box;
  /* Clear the fixed header, which is lifted out of normal flow. */
  padding-top: var(--header-height);
  padding-left: max(var(--app-gutter), env(safe-area-inset-left));
  padding-right: max(var(--app-gutter), env(safe-area-inset-right));
  /* Clear the fixed TabBar (pill height + its bottom offset) plus the safe-area
     inset, so the last of the page content isn't hidden behind it. */
  padding-bottom: calc(6rem + env(safe-area-inset-bottom));
}
</style>
