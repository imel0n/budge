<script setup>
// A button descriptor looks like: { id: 'save', label: 'Save' }
// `id` is sent back to the parent on click so it knows which button fired.
defineProps({
  title: {
    type: String,
    default: '',
  },
  leftButtons: {
    type: Array,
    default: () => [],
    // 0, 1, or 2 buttons allowed — no more.
    validator: (buttons) => buttons.length <= 2,
  },
  rightButtons: {
    type: Array,
    default: () => [],
    validator: (buttons) => buttons.length <= 2,
  },
  // The title is hidden until the page's <h1> scrolls behind the header, at
  // which point it fades in.
  titleVisible: {
    type: Boolean,
    default: false,
  },
})

// Fires when any button is clicked, telling the parent which side and which id.
const emit = defineEmits(['button-click'])

function onButtonClick(side, button) {
  emit('button-click', { side, id: button.id })
}
</script>

<template>
  <header>
    <div class="left-area" :class="{ grouped: leftButtons.length === 2 }">
      <button
        v-for="button in leftButtons"
        :key="button.id"
        type="button"
        @click="onButtonClick('left', button)"
      >
        {{ button.label }}
      </button>
    </div>

    <h3 class="title" :class="{ visible: titleVisible }">{{ title }}</h3>

    <div class="right-area" :class="{ grouped: rightButtons.length === 2 }">
      <button
        v-for="button in rightButtons"
        :key="button.id"
        type="button"
        @click="onButtonClick('right', button)"
      >
        {{ button.label }}
      </button>
    </div>
  </header>
</template>

<style scoped>
header {
  /* Pinned to the top so it stays put while the page body scrolls under it. */
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 100;
  background-color: #000000;
  display: flex;
  align-items: center;
  justify-content: space-between;
  /* Keep header content clear of the status bar / dynamic island. */
  padding-top: calc(env(safe-area-inset-top) + 0.125rem);
  /* Inset content off the edges while the bar itself stays full-bleed. In
     landscape, honour the notch inset if it's larger than the gutter. */
  padding-left: max(var(--app-gutter), env(safe-area-inset-left));
  padding-right: max(var(--app-gutter), env(safe-area-inset-right));
}

.left-area,
.right-area {
  display: flex;
  gap: 0.5rem;
}

/* Two buttons on a side merge into a single segmented pill. */
.left-area.grouped,
.right-area.grouped {
  gap: 0;
  border-radius: 999px;
  background-color: #1c1c1e;
  border: 1px solid rgba(255, 255, 255, 0.08);
  box-shadow:
    0 0 0 4px rgba(255, 255, 255, 0.02),
    0 1px 2px rgba(0, 0, 0, 0.4),
    inset 0 1px 0 rgba(255, 255, 255, 0.04);
}

/* Inside a group, buttons drop their own pill chrome and become segments. */
.grouped button {
  min-width: 3rem;
  background-color: transparent;
  border: none;
  border-radius: 0;
  box-shadow: none;
}

button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 2.5rem;
  min-height: 2.5rem;
  padding: 0.85rem;
  border-radius: 999px;
  /* Dark fill with a subtle lighter ring, sitting on the dark header. */
  background-color: #1c1c1e;
  border: 1px solid rgba(255, 255, 255, 0.08);
  color: #ffffff;
  font-size: 1.0625rem;
  font-weight: 600;
  line-height: 1;
  cursor: pointer;
  /* Soft outer glow/ring and a touch of inner highlight for depth. */
  box-shadow:
    0 0 0 4px rgba(255, 255, 255, 0.02),
    0 1px 2px rgba(0, 0, 0, 0.4),
    inset 0 1px 0 rgba(255, 255, 255, 0.04);
}

.title {
  position: absolute;
  left: 50%;
  /* Offset by half the safe-area inset so the title stays centered with the
     buttons, which sit below the inset in normal flow. */
  top: calc(50% + (env(safe-area-inset-top) + 0.125rem) / 2);
  margin: 0;
  font-size: 1.0625rem;
  font-weight: 600;
  line-height: 1.2;
  text-align: center;
  color: #ffffff;
  /* Hidden until the Page Title scrolls behind the header, then it fades in
     while rising into place from just below. Kept non-interactive while
     hidden. */
  opacity: 0;
  pointer-events: none;
  transform: translate(-50%, calc(-50% + 0.75rem));
  filter: blur(4px);
  transition:
    opacity 0.3s ease-out,
    transform 0.3s ease-out,
    filter 0.3s ease-out;
}

.title.visible {
  opacity: 1;
  transform: translate(-50%, -50%);
  filter: blur(0);
}
</style>
