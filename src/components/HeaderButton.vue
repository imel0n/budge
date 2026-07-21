<script setup>
// A single standalone header button: a liquid-glass pill. `label` is rendered
// as plain text (no SVG/markup). Clicks bubble up via the native `click` event.
defineProps({
  label: {
    type: String,
    required: true,
  },
})
</script>

<template>
  <button type="button">{{ label }}</button>
</template>

<style scoped>
button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 2.5rem;
  min-height: 2.5rem;
  padding: 0.85rem;
  border-radius: 999px;
  /* Liquid glass: a faint tint over a blurred backdrop, with a subtle ring. */
  background-color: rgba(255, 255, 255, 0.08);
  backdrop-filter: blur(4px);
  -webkit-backdrop-filter: blur(4px);
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
</style>
