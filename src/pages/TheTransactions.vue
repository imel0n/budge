<script setup>
import { inject } from 'vue'
import { usePageTitle } from '../composables/usePageTitle'
import HeaderButton from '../components/HeaderButton.vue'

const { titleRef, collapsed } = usePageTitle('Transactions')

// Raw SVG for the "+" glyph. It carries no size or fill of its own — HeaderButton
// sizes it and paints it with `currentColor`.
const plusIcon = `<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
  <path d="M12 5a1 1 0 0 1 1 1v5h5a1 1 0 1 1 0 2h-5v5a1 1 0 1 1-2 0v-5H6a1 1 0 1 1 0-2h5V6a1 1 0 0 1 1-1z" />
</svg>`

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

    <!-- Fixed "Add Transaction" action, pinned to the bottom-right and lifted
         above the TabBar so it never overlaps the navigation. -->
    <HeaderButton
      class="add-transaction"
      label="Add Transaction"
      :icon="plusIcon"
    />
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

/* Locked to the bottom-right corner, sitting a comfortable gap above the TabBar
   (which is pinned to the bottom with the safe-area inset). */
.add-transaction {
  position: fixed;
  right: 20px;
  bottom: calc(env(safe-area-inset-bottom) + 88px);
  z-index: 10;
}
</style>
