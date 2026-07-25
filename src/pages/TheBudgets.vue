<script setup>
import { inject, ref, watchEffect } from 'vue'
import { usePageTitle } from '../composables/usePageTitle'

const { titleRef, collapsed } = usePageTitle('Budgets')

const setHeaderButtons = inject('setHeaderButtons')

const searchIcon = `<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
  <circle cx="10" cy="10" r="6.5" fill="none" stroke="currentColor" stroke-width="2" />
  <path d="M21 21l-6-6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
</svg>`

const ellipsisIcon = `<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
  <circle cx="5" cy="12" r="2" />
  <circle cx="12" cy="12" r="2" />
  <circle cx="19" cy="12" r="2" />
</svg>`

const searchOpen = ref(false)
const searchQuery = ref('')

watchEffect(() => {
  setHeaderButtons({
    right: [
      { id: 'search', label: 'Search', icon: searchIcon },
      { id: 'more', label: 'More', icon: ellipsisIcon },
    ],
    search: searchOpen.value ? { active: true, placeholder: 'Search budgets' } : null,
    onClick: ({ id }) => {
      if (id === 'search') searchOpen.value = true
    },
    onSearchInput: (query) => {
      searchQuery.value = query
    },
    onSearchClose: () => {
      searchOpen.value = false
      searchQuery.value = ''
    },
  })
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
