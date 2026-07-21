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
})

// Fires when any button is clicked, telling the parent which side and which id.
const emit = defineEmits(['button-click'])

function onButtonClick(side, button) {
  emit('button-click', { side, id: button.id })
}
</script>

<template>
  <header>
    <div class="left-area">
      <button
        v-for="button in leftButtons"
        :key="button.id"
        type="button"
        @click="onButtonClick('left', button)"
      >
        {{ button.label }}
      </button>
    </div>

    <h3 class="title">{{ title }}</h3>

    <div class="right-area">
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
  position: relative;
  /* Keep header content clear of the status bar / dynamic island. */
  padding-top: calc(env(safe-area-inset-top) + 1.5rem);
}

.title {
  position: absolute;
  left: 50%;
  /* Offset by half the safe-area inset so the title stays centered with the
     buttons, which sit below the inset in normal flow. */
  top: calc(50% + (env(safe-area-inset-top) + 1.5rem) / 2);
  transform: translate(-50%, -50%);
  margin: 0;
  font-size: 1.0625rem;
  font-weight: 600;
  line-height: 1.2;
  text-align: center;
  color: #ffffff;
}
</style>
