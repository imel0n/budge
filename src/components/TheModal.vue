<script setup>
import { watch, onUnmounted } from 'vue'
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
</script>

<template>
  <Teleport to="body">
    <Transition name="sheet" :duration="500">
      <div v-if="open" class="modal-backdrop" @click="close">
        <div class="modal-panel" @click.stop>
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

.sheet-enter-active .modal-panel,
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
}

/* Content area below the header. Aligns to the same gutter as the header. */
.modal-body {
  padding-left: max(var(--app-gutter), env(safe-area-inset-left));
  padding-right: max(var(--app-gutter), env(safe-area-inset-right));
  padding-bottom: calc(env(safe-area-inset-bottom) + 1rem);
}
</style>
