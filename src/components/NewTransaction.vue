<script setup>
import { nextTick, ref, watch } from 'vue'
import TheModal from './TheModal.vue'

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

function onButton({ id }) {
  if (id === 'save') {
    // TODO: persist the new transaction.
    emit('update:open', false)
  }
}

// iOS-style large-title collapse, same as the pages but scoped to the modal's
// own scroll container (the panel) and its static header rather than the window
// and the fixed header. The in-body <h1> fades out as it scrolls behind the
// header, and `collapsed` fades the header's own title in.
const titleRef = ref(null)
const collapsed = ref(false)

// Coalesce bursts of scroll events into one measurement per frame.
let frame = 0
// The modal panel that scrolls, resolved when the sheet opens.
let scroller = null

function measure() {
  frame = 0
  const el = titleRef.value
  if (!el || !scroller) return

  // The sticky header pins to the top of the panel, so its bottom edge sits at
  // the panel's top plus the header's height — the strip the title hides behind.
  const header = scroller.querySelector('header')
  const headerHeight = header ? header.getBoundingClientRect().height : 0
  const scrollerTop = scroller.getBoundingClientRect().top

  // Trigger once the <h1>'s vertical center passes behind the header's bottom.
  const { top, bottom } = el.getBoundingClientRect()
  collapsed.value = (top + bottom) / 2 <= scrollerTop + headerHeight
}

function onScroll() {
  if (frame) return
  frame = requestAnimationFrame(measure)
}

watch(
  () => props.open,
  async (isOpen) => {
    if (isOpen) {
      // Wait for the teleported panel to mount, then bind to its scroll.
      await nextTick()
      scroller = titleRef.value?.closest('.modal-panel') ?? null
      collapsed.value = false
      if (scroller) {
        scroller.addEventListener('scroll', onScroll, { passive: true })
        window.addEventListener('resize', onScroll, { passive: true })
        measure()
      }
    } else {
      if (scroller) scroller.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
      if (frame) cancelAnimationFrame(frame)
      frame = 0
      scroller = null
      collapsed.value = false
    }
  },
)
</script>

<template>
  <TheModal
    :open="open"
    title="New Transaction"
    :title-visible="collapsed"
    :right-buttons="rightButtons"
    @update:open="emit('update:open', $event)"
    @button-click="onButton"
  >
    <h1 ref="titleRef" :class="{ collapsed }">New Transaction</h1>
    <!-- TODO: transaction form fields. -->
  </TheModal>
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
</style>
