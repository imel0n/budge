<script setup>
import { provide, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import HeaderBar from '../components/HeaderBar.vue'
import HeaderButton from '../components/HeaderButton.vue'
import TabBar from '../components/TabBar.vue'
import NewTransaction from '../components/NewTransaction.vue'

// Raw SVG for the "+" glyph. It carries no size or fill of its own — HeaderButton
// sizes it and paints it with `currentColor`.
const plusIcon = `<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
  <path d="M12 3a1 1 0 0 1 1 1v7h7a1 1 0 1 1 0 2h-7v7a1 1 0 1 1-2 0v-7H4a1 1 0 1 1 0-2h7V4a1 1 0 0 1 1-1z" />
</svg>`

// The "New Transaction" sheet, opened by the fixed Add Transaction action.
const newTransactionOpen = ref(false)

// Pages set their own title via the injected setter (see usePageTitle key).
const pageTitle = ref('')

function setPageTitle(title) {
  pageTitle.value = title
}

provide('setPageTitle', setPageTitle)

// Whether the HeaderBar's own title is shown. Pages toggle this (via
// usePageTitle) as their <h1> scrolls behind the fixed header.
const headerTitleVisible = ref(false)

function setHeaderTitleVisible(visible) {
  headerTitleVisible.value = visible
}

provide('setHeaderTitleVisible', setHeaderTitleVisible)

// Pages push their own header buttons the same way they set the title.
const leftButtons = ref([])
const rightButtons = ref([])
// The current page's click handler, invoked with { side, id } on any button.
const buttonHandler = ref(() => {})

function setHeaderButtons({ left = [], right = [], onClick = () => {} } = {}) {
  leftButtons.value = left
  rightButtons.value = right
  buttonHandler.value = onClick
}

provide('setHeaderButtons', setHeaderButtons)

// Reset the header to a blank slate on every navigation, before the incoming
// page's setup runs its own setHeaderButtons(). This makes "a page pushes no
// buttons" mean "no buttons" — so a page can never inherit the previous page's
// buttons. Each page only ever declares what it wants; it never has to clear.
const route = useRoute()
watch(
  () => route.path,
  () => setHeaderButtons(),
)
</script>

<template>
  <HeaderBar
    :title="pageTitle"
    :title-visible="headerTitleVisible"
    :left-buttons="leftButtons"
    :right-buttons="rightButtons"
    :transition-key="route.path"
    @button-click="buttonHandler"
  />
  <main class="page-body">
    <!-- Fade the page body out and in on navigation, in step with the header. -->
    <RouterView v-slot="{ Component }">
      <Transition name="page-fade" mode="out-in">
        <component :is="Component" />
      </Transition>
    </RouterView>
  </main>

  <!-- Fixed "Add Transaction" action, pinned to the bottom-right and lifted
       above the TabBar so it never overlaps the navigation. Lives in the layout
       so it persists across pages. -->
  <HeaderButton
    class="add-transaction"
    label="Add Transaction"
    :icon="plusIcon"
    @click="newTransactionOpen = true"
  />
  <TabBar />

  <!-- The "New Transaction" sheet, driven by the Add Transaction action. -->
  <NewTransaction v-model:open="newTransactionOpen" />
</template>

<style scoped>
/* Cross-fade the page body on navigation, matching the header's fade, and
   expand it up to full size from a slight shrink (same as the header buttons). */
.page-fade-enter-active {
  transition:
    opacity 0.18s ease,
    transform 0.3s ease;
}

.page-fade-enter-from {
  opacity: 0.3;
  transform: scale(0.995);
}

/* Pin the scale pivot to the centre of the visible viewport rather than the
   centre of the (possibly taller-than-viewport) page box, so the zoom stays
   centred on what the user is actually looking at. */
.page-fade-enter-active,
.page-fade-enter-from {
  transform-origin: center 50vh;
}

/* Locked to the bottom-right corner, sitting a comfortable gap above the TabBar
   (which is pinned to the bottom with the safe-area inset). */
.add-transaction {
  position: fixed;
  right: 20px;
  bottom: calc(env(safe-area-inset-bottom) + 88px);
  z-index: 10;
  /* Slightly thinner padding so the pill hugs the glyph a touch more closely. */
  padding: 0.75rem;
}

/* Enlarge the "+" glyph within this button only. */
.add-transaction :deep(.icon svg) {
  width: 1.75rem;
  height: 1.75rem;
}

/* Same gutter as the header content, so page bodies align with it. */
.page-body {
  /* Fill the full viewport height, including the bottom safe-area inset. In a
     standalone PWA, `dvh` stops above the home indicator and leaves a strip of
     the black <body> showing; `lvh` (large viewport) spans the whole screen, so
     the background reaches the very bottom edge. `vh` is the fallback. */
  min-height: 100vh;
  min-height: 100lvh;
  box-sizing: border-box;
  /* Clear the fixed header, which is lifted out of normal flow. */
  padding-top: var(--header-height);
  padding-left: max(var(--app-gutter), env(safe-area-inset-left));
  padding-right: max(var(--app-gutter), env(safe-area-inset-right));
  /* Clear the fixed TabBar (pill height + its bottom offset) plus the safe-area
     inset, so the last of the page content isn't hidden behind it. */
  padding-bottom: calc(6rem + env(safe-area-inset-bottom));
}
</style>
