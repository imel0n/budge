<script setup>
// A button descriptor looks like: { id: 'save', label: 'Save' }
// `id` is sent back to the parent on click so it knows which button fired.
const props = defineProps({
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

    <h1 class="title">{{ title }}</h1>

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

<style scoped></style>
