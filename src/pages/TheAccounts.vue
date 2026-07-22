<script setup>
import { inject } from 'vue'
import { usePageTitle } from '../composables/usePageTitle'

const { titleRef, collapsed } = usePageTitle('Accounts')

// Push two left buttons and one right button up to the shared HeaderBar.
// `label` is rendered as plain text (HeaderBar does not take SVG/markup),
// `id` comes back to us on click.
const setHeaderButtons = inject('setHeaderButtons')
setHeaderButtons({
  left: [
    { id: 'a1', label: 'A1' },
    { id: 'a2', label: 'A2' },
  ],
  right: [{ id: 'a3', label: 'A3' }],
  onClick: ({ side, id }) => {
    console.log('Header button clicked:', side, id)
  },
})
</script>

<template>
  <main>
    <h1 ref="titleRef" :class="{ collapsed }">Accounts</h1>
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
