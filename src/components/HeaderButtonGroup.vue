<script setup>
// Two (or more) buttons merged into a single segmented pill. The container owns
// all the glass chrome; the buttons inside are chromeless segments so the whole
// thing reads as one object. Each button descriptor is { id, label }; the
// clicked `id` is emitted back to the parent.
defineProps({
  buttons: {
    type: Array,
    default: () => [],
  },
})

const emit = defineEmits(['button-click'])
</script>

<template>
  <div class="group">
    <button
      v-for="button in buttons"
      :key="button.id"
      type="button"
      @click="emit('button-click', button.id)"
    >
      {{ button.label }}
    </button>
  </div>
</template>

<style scoped>
/* The container owns all the glass chrome. `overflow: hidden` clips the
   segments' press states to the pill's rounded corners. */
.group {
  display: flex;
  gap: 0;
  border-radius: 999px;
  overflow: hidden;
  /* Liquid glass: a faint tint over a blurred backdrop. */
  background-color: rgba(255, 255, 255, 0.08);
  backdrop-filter: blur(4px);
  -webkit-backdrop-filter: blur(4px);
  border: 1px solid rgba(255, 255, 255, 0.08);
  box-shadow:
    0 0 0 4px rgba(255, 255, 255, 0.02),
    0 1px 2px rgba(0, 0, 0, 0.4),
    inset 0 1px 0 rgba(255, 255, 255, 0.04);
}

/* Segments drop ALL their own chrome — including the backdrop blur — and become
   flat, transparent segments of the shared pill. */
button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 3rem;
  min-height: 2.5rem;
  padding: 0.85rem;
  background-color: transparent;
  border: none;
  color: #ffffff;
  font-size: 1.0625rem;
  font-weight: 600;
  line-height: 1;
  cursor: pointer;
}
</style>
