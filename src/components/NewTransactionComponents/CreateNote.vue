<script setup>
import { inject, onUnmounted } from 'vue'

const { form } = inject('newTransaction')

// Focusing the textarea opens the on-screen keyboard; iOS Safari responds by
// scrolling the layout viewport itself to bring the field into view, even
// though it's already visible and even though the body is overflow: hidden
// while the sheet is open — the `visualViewport` resize event alone isn't
// enough to catch this, since Safari drives it directly and can re-trigger it
// while typing as the caret moves. Fight it every frame for as long as the
// field is focused.
let raf = null

function pinScroll() {
  const scroller = document.querySelector('.modal-scroll')
  if (scroller) scroller.scrollTop = 0
  window.scrollTo(0, 0)
  raf = requestAnimationFrame(pinScroll)
}

function onFocus() {
  if (raf == null) raf = requestAnimationFrame(pinScroll)
}

function onBlur() {
  if (raf != null) cancelAnimationFrame(raf)
  raf = null
}

onUnmounted(onBlur)
</script>

<template>
  <div>
    <div class="field-card">
      <textarea
        v-model="form.notes"
        class="notes-input"
        placeholder="Add a note"
        rows="6"
        autofocus
        @focus="onFocus"
        @blur="onBlur"
      ></textarea>
    </div>
  </div>
</template>

<style scoped>
.field-card {
  background-color: var(--surface-1);
  border-radius: 25px;
  padding: 0.85rem 1.25rem;
  margin-top: 0.5rem;
}

.notes-input {
  width: 100%;
  border: none;
  background: transparent;
  color: inherit;
  font-family: inherit;
  font-size: 1.1rem;
  resize: none;
  outline: none;
  padding: 0;
}

.notes-input::placeholder {
  color: rgba(255, 255, 255, 0.4);
}
</style>
