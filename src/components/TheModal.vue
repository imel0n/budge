<script setup>
import { ref, watch, onUnmounted } from 'vue'
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
  // When true, the sheet fills the whole viewport height instead of the default
  // half-height.
  full: {
    type: Boolean,
    default: false,
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

const leftButtons = [{ id: 'close', label: 'Close', icon: closeIcon }]

// Left "×" closes the sheet; anything the caller put on the right bubbles up.
function onHeaderButton({ side, id }) {
  if (side === 'left' && id === 'close') {
    close()
    return
  }
  emit('button-click', { side, id })
}

// Drag-to-dismiss. When the panel is scrolled to its top and the user keeps
// pulling down, the panel follows the finger. Released past 20% of its height,
// the sheet closes (which unmounts the body, clearing its content); otherwise it
// springs back.
const panel = ref(null)
const dragY = ref(0)
const dragging = ref(false)

let pointerId = null
let startY = 0
let active = false

function onPointerDown(e) {
  if (e.pointerType === 'mouse' && e.button !== 0) return
  if (!panel.value || panel.value.scrollTop > 0) return
  pointerId = e.pointerId
  startY = e.clientY
  active = false
}

function onPointerMove(e) {
  if (e.pointerId !== pointerId) return
  const delta = e.clientY - startY

  if (!active) {
    // Only begin dragging on a downward pull while pinned to the top.
    if (delta <= 0 || panel.value.scrollTop > 0) {
      startY = e.clientY
      return
    }
    active = true
    dragging.value = true
    panel.value.setPointerCapture(pointerId)
  }

  e.preventDefault()
  dragY.value = Math.max(0, delta)
}

function endDrag(e) {
  if (e.pointerId !== pointerId) return
  pointerId = null
  if (!active) return
  active = false
  dragging.value = false

  const height = panel.value?.getBoundingClientRect().height ?? 0
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
</script>

<template>
  <Teleport to="body">
    <Transition name="sheet" :duration="{ enter: 600, leave: 500 }">
      <div v-if="open" class="modal-backdrop" @click="close">
        <div
          ref="panel"
          class="modal-panel"
          :class="{ full, dragging }"
          :style="dragY ? { transform: `translateY(${dragY}px)` } : null"
          @click.stop
          @pointerdown="onPointerDown"
          @pointermove="onPointerMove"
          @pointerup="endDrag"
          @pointercancel="endDrag"
        >
        <!-- Non-fixed header that sticks to the top of the panel while the body
             below it scrolls under the grey falloff. -->
          <HeaderBar
            variant="static"
            :title="title"
            :title-visible="titleVisible"
            :left-buttons="leftButtons"
            :right-buttons="rightButtons"
            @button-click="onHeaderButton"
          />
          <div class="modal-body">
            <slot />
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
  width: 100%;
  height: 50vh;
  height: 50lvh;
  background-color: #1c1c1c;
  border-top-left-radius: 48px;
  border-top-right-radius: 48px;
  padding-top: 18px;
  padding-left: 8px;
  padding-right: 8px;
  /* Scroll container for the sticky header: the header pins to the top while
     the body scrolls under it. Clips content to the rounded top corners. */
  overflow-y: auto;
  /* Spring back after a drag that didn't cross the dismiss threshold. */
  transition: transform 0.4s cubic-bezier(0.32, 0.72, 0, 1);
  touch-action: pan-y;
}

/* While actively dragging, the panel tracks the finger with no transition. */
.modal-panel.dragging {
  transition: none;
}

.modal-panel.full {
  height: 92vh;
  height: 92lvh;
}

/* Content area below the header. Aligns to the same gutter as the header. */
.modal-body {
  padding-left: max(var(--app-gutter), env(safe-area-inset-left));
  padding-right: max(var(--app-gutter), env(safe-area-inset-right));
  padding-bottom: calc(env(safe-area-inset-bottom) + 1rem);
}
</style>
