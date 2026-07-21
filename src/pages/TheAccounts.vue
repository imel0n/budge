<script setup>
import { usePageTitle } from '../composables/usePageTitle'

const { titleRef, collapsed } = usePageTitle('Accounts')
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
