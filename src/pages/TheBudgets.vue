<script setup>
import { inject } from 'vue'
import { usePageTitle } from '../composables/usePageTitle'

const { titleRef, collapsed } = usePageTitle('Budgets')

const setHeaderButtons = inject('setHeaderButtons')
setHeaderButtons({
  left: [
    { id: 'b1', label: 'B1' },
    { id: 'b2', label: 'B2' },
  ],
  right: [{ id: 'b3', label: 'B3' }],
  onClick: ({ side, id }) => {
    console.log('Header button clicked:', side, id)
  },
})
</script>

<template>
  <main>
    <h1 ref="titleRef" :class="{ collapsed }">Budgets</h1>
  </main>
</template>

<style scoped>
h1 {
  transition: opacity 0.1s ease-out;
}

h1.collapsed {
  opacity: 0;
}
</style>
