<script setup>
import { inject } from 'vue'
import { usePageTitle } from '../composables/usePageTitle'

const { titleRef, collapsed } = usePageTitle('Transactions')

// Push one left button and two right buttons up to the shared HeaderBar. Each
// descriptor is { id, label, icon? }: pass `icon` (raw SVG markup) to show a
// glyph instead of the text `label`. `id` comes back to us on click.
const setHeaderButtons = inject('setHeaderButtons')
setHeaderButtons({
  left: [{ id: 'b1', label: 'B1' }],
  right: [
    { id: 'b2', label: 'B2' },
    { id: 'b3', label: 'B3' },
  ],
  onClick: ({ side, id }) => {
    console.log('Header button clicked:', side, id)
  },
})
</script>

<template>
  <main>
    <h1 ref="titleRef" :class="{ collapsed }">Transactions</h1>
  </main>
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
