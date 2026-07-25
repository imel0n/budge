<script setup>
import { usePageTitle } from '../composables/usePageTitle'

const { titleRef, collapsed } = usePageTitle('Settings')
</script>

<template>
  <main>
    <h1 ref="titleRef" :class="{ collapsed }">Settings</h1>
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
