<script setup>
import { ref, computed, watch, onUnmounted } from 'vue'
import HeaderBar from './HeaderBar.vue'

// A half-height bottom sheet, driven by v-model:open. The sheet is a shell: the
// caller supplies the `title`, any `rightButtons`, and the body via the default
// slot. A "×" close button is always present on the left and dismisses the sheet.
const props = defineProps({
  open: {
    type: Boolean,
    default: false,
  },
  title: {
    type: String,
    default: '',
  },
  // Whether the header's own title is shown. Mirrors HeaderBar: the caller keeps
  // it hidden until its in-body large title scrolls behind the header, then fades
  // it in. Defaults to always-visible for callers that show no in-body title.
  titleVisible: {
    type: Boolean,
    default: true,
  },
  // Passed straight through to the header's right side. Same button descriptor
  // shape as HeaderBar ({ id, label, icon? }); clicks surface via `button-click`.
  rightButtons: {
    type: Array,
    default: () => [],
  },
  // Overrides the left side of the header; empty keeps the built-in "×" close.
  leftButtons: {
    type: Array,
    default: () => [],
  },
  // When true, the sheet fills the whole viewport height instead of the default
  // half-height.
  full: {
    type: Boolean,
    default: false,
  },
  // Passed straight through to the header, same as HeaderBar's own prop: change
  // it to cross-fade the title/buttons when the sheet's content swaps.
  transitionKey: {
    type: [String, Number],
    default: '',
  },
  // When false, the drag-to-dismiss gesture is disabled; the sheet can only be
  // closed via the header's close button.
  dragToClose: {
    type: Boolean,
    default: true,
  },
})

// `button-click` re-emits clicks on the caller's right buttons ({ side, id }).
const emit = defineEmits(['update:open', 'button-click'])

function close() {
  emit('update:open', false)
}

// Lock scrolling of the page behind the sheet while it's open, and restore on
// close or unmount.
watch(
  () => props.open,
  (open) => {
    document.body.style.overflow = open ? 'hidden' : ''
    if (open) dragY.value = 0
  },
)

onUnmounted(() => {
  document.body.style.overflow = ''
})

// The "×" glyph for the always-present close button. No size/fill of its own —
// HeaderButton sizes it and paints it with `currentColor`.
const closeIcon = `<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
  <path d="M6.4 4.99a1 1 0 0 0-1.41 1.42L10.58 12l-5.6 5.59a1 1 0 1 0 1.42 1.42L12 13.41l5.59 5.6a1 1 0 0 0 1.42-1.42L13.41 12l5.6-5.59a1 1 0 0 0-1.42-1.42L12 10.58z" />
</svg>`

const closeButton = [{ id: 'close', label: 'Close', icon: closeIcon }]

const leftButtons = computed(() => (props.leftButtons.length ? props.leftButtons : closeButton))

// Left "×" closes the sheet; anything the caller put on the right bubbles up.
function onHeaderButton({ side, id }) {
  if (side === 'left' && id === 'close') {
    close()
    return
  }
  emit('button-click', { side, id })
}

// Drag-to-dismiss. When the sheet's body is scrolled to its top and the user
// keeps pulling down, the panel follows the finger. Released past 20% of its
// height, the sheet closes (which unmounts the body, clearing its content);
// otherwise it springs back.
//
// Scrolling lives in an inner container (`scroller`) rather than the panel, so
// the header — a plain flow child of the panel — can't be displaced by
// overscroll rubberbanding. On touch the browser owns the vertical gesture
// (`touch-action: pan-y`); to keep native scrolling from preempting the drag
// once the body overflows, the touch path guards moves with a non-passive
// `touchmove` listener that calls `preventDefault()` the instant a downward
// pull begins at the top; the mouse path needs no such guard.
const panel = ref(null)
const scroller = ref(null)
const dragY = ref(0)
const dragging = ref(false)
const sheetHeight = ref(0)

// The backdrop tint follows the drag: fully black at rest, fading toward
// transparent as the sheet approaches its full height.
const backdropStyle = computed(() => {
  if (!dragY.value || !sheetHeight.value) return null
  const progress = Math.min(dragY.value / sheetHeight.value, 1)
  return { backgroundColor: `rgba(0, 0, 0, ${1 - progress})` }
})

let startY = 0
let tracking = false
let active = false

function beginTrack(y) {
  tracking = props.dragToClose && !!scroller.value && scroller.value.scrollTop <= 0
  startY = y
  active = false
}

// Returns true once the gesture has become an actual drag, signalling the touch
// caller to swallow the native scroll.
function moveTrack(y) {
  if (!tracking) return false
  if (!active) {
    // Only begin dragging on a downward pull while pinned to the top.
    if (y - startY <= 0 || scroller.value.scrollTop > 0) {
      startY = y
      return false
    }
    active = true
    dragging.value = true
    sheetHeight.value = panel.value?.getBoundingClientRect().height ?? 0
  }
  dragY.value = Math.max(0, y - startY)
  return true
}

function endTrack() {
  tracking = false
  if (!active) return
  active = false
  dragging.value = false

  const height = sheetHeight.value
  if (height && dragY.value >= height * 0.2) {
    // Continue the drag into a full slide-down from the current position, then
    // close once it's off-screen so the exit looks continuous with the drag.
    const el = panel.value
    const onEnd = () => {
      el.removeEventListener('transitionend', onEnd)
      close()
    }
    el.addEventListener('transitionend', onEnd)
    dragY.value = height
    return
  }
  dragY.value = 0
}

function onTouchStart(e) {
  if (e.touches.length === 1) beginTrack(e.touches[0].clientY)
}

function onTouchMove(e) {
  // Non-passive: swallow the native scroll as soon as the drag takes over.
  if (moveTrack(e.touches[0].clientY)) e.preventDefault()
}

function onMouseMove(e) {
  moveTrack(e.clientY)
}

function onMouseUp() {
  window.removeEventListener('mousemove', onMouseMove)
  window.removeEventListener('mouseup', onMouseUp)
  endTrack()
}

function onMouseDown(e) {
  if (e.button !== 0) return
  beginTrack(e.clientY)
  if (!tracking) return
  window.addEventListener('mousemove', onMouseMove)
  window.addEventListener('mouseup', onMouseUp)
}

// Bind the non-passive touchmove directly — Vue template listeners can't opt out
// of passive, and preventDefault is a no-op on a passive listener.
watch(panel, (el, prev) => {
  if (prev) prev.removeEventListener('touchmove', onTouchMove)
  if (el) el.addEventListener('touchmove', onTouchMove, { passive: false })
})

// The scroller slides fully under the header (so content fades out beneath the
// header's gradient) and pads its content down by the header's height so the
// body still starts below it. The height is measured, not hardcoded, since it
// depends on the header's padding and button sizes.
const headerComp = ref(null)
const headerHeight = ref(0)
let headerObserver = null

watch(
  () => headerComp.value?.$el,
  (el) => {
    headerObserver?.disconnect()
    headerObserver = null
    if (!el) return
    headerObserver = new ResizeObserver(() => {
      headerHeight.value = el.offsetHeight
    })
    headerObserver.observe(el)
  },
)

onUnmounted(() => headerObserver?.disconnect())

function getScrollTop() {
  return scroller.value?.scrollTop ?? 0
}

function setScrollTop(v) {
  if (scroller.value) scroller.value.scrollTop = v
}

defineExpose({ getScrollTop, setScrollTop })
</script>

<template>
  <Teleport to="body">
    <Transition name="sheet" :duration="{ enter: 600, leave: 500 }">
      <div v-if="open" class="modal-backdrop" :class="{ dragging }" :style="backdropStyle" @click="close">
        <div
          ref="panel"
          class="modal-panel"
          :class="{ full, dragging }"
          :style="dragY ? { transform: `translateY(${dragY}px)` } : null"
          @click.stop
          @mousedown="onMouseDown"
          @touchstart="onTouchStart"
          @touchend="endTrack"
          @touchcancel="endTrack"
        >
          <!-- Non-fixed header pinned to the top of the panel. The scroller below
             is the actual scroll container, so overscroll rubberbanding moves
             only the body while the header stays put. -->
          <HeaderBar
            ref="headerComp"
            variant="static"
            :title="title"
            :title-visible="titleVisible"
            :left-buttons="leftButtons"
            :right-buttons="rightButtons"
            :transition-key="transitionKey"
            @button-click="onHeaderButton"
          />
          <div
            ref="scroller"
            class="modal-scroll"
            :style="{ paddingTop: `${headerHeight}px`, '--modal-header-height': `${headerHeight}px` }"
          >
            <div class="modal-body">
              <slot />
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.modal-backdrop {
  position: fixed;
  inset: 0;
  z-index: 100;
  display: flex;
  align-items: flex-end;
  background-color: #000;
  /* Ease the tint back alongside the panel's spring-back / slide-out. */
  transition: background-color 0.4s cubic-bezier(0.32, 0.72, 0, 1);
}

/* While actively dragging, the tint tracks the finger with no transition. */
.modal-backdrop.dragging {
  transition: none;
}

.sheet-enter-active {
  transition: background-color 0.6s ease;
}

.sheet-leave-active {
  transition: background-color 0.5s ease;
}

.sheet-enter-from,
.sheet-leave-to {
  background-color: transparent;
}

.sheet-enter-active .modal-panel {
  transition: transform 0.6s cubic-bezier(0.16, 1, 0.3, 1);
  will-change: transform;
}

.sheet-leave-active .modal-panel {
  transition: transform 0.5s cubic-bezier(0.32, 0.72, 0, 1);
  will-change: transform;
}

.sheet-enter-from .modal-panel,
.sheet-leave-to .modal-panel {
  transform: translateY(100%);
}

.modal-panel {
  position: relative;
  width: 100%;
  height: 50vh;
  height: 50lvh;
  background-color: #1c1c1c;
  border-top-left-radius: 48px;
  border-top-right-radius: 48px;
  padding-left: 8px;
  padding-right: 8px;
  /* The panel itself never scrolls — scrolling lives in .modal-scroll — so
     overscroll rubberbanding can't drag the header down with the content.
     Clips content to the rounded top corners. */
  overflow: hidden;
  /* Spring back after a drag that didn't cross the dismiss threshold. */
  transition: transform 0.4s cubic-bezier(0.32, 0.72, 0, 1);
  touch-action: pan-y;
}

/* The sheet's scroll container. Fills the whole panel so content scrolls out
   under the header's grey falloff; the measured header-height padding (set
   inline) keeps the body starting below the header. */
.modal-scroll {
  position: absolute;
  inset: 0;
  /* Own stacking context so the body's internal z-indexes (e.g. transitioning
     pages) can't escape and paint over the header, which sits above at z-index
     1 in the panel's context. */
  z-index: 0;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  padding-left: 8px;
  padding-right: 8px;
  /* Keep top-boundary overscroll from becoming a page pull-to-refresh, so the
     drag-to-dismiss gesture owns it instead. */
  overscroll-behavior-y: contain;
  touch-action: pan-y;
  scrollbar-width: none;
  -ms-overflow-style: none;
}

.modal-scroll::-webkit-scrollbar {
  display: none;
}

/* While actively dragging, the panel tracks the finger with no transition. */
.modal-panel.dragging {
  transition: none;
}

.modal-panel.full {
  height: 88vh;
  height: 88lvh;
}

/* Content area below the header. Aligns to the same gutter as the header. */
.modal-body {
  flex: 1 0 auto;
  display: flex;
  flex-direction: column;
  padding-left: max(var(--app-gutter), env(safe-area-inset-left));
  padding-right: max(var(--app-gutter), env(safe-area-inset-right));
  padding-bottom: calc(env(safe-area-inset-bottom) + 1rem);
}
</style>
