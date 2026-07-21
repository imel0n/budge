<script setup>
import { inject } from 'vue'

const setPageTitle = inject('setPageTitle')
setPageTitle('Transactions')

// Push one left button and two right buttons up to the shared HeaderBar.
// `label` is rendered as plain text (HeaderBar does not take SVG/markup),
// `id` comes back to us on click.
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
  <main></main>
</template>

<style scoped></style>
