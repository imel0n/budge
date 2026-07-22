<script setup>
import { provide, ref } from 'vue'
import HeaderBar from '../components/HeaderBar.vue'
import TabBar from '../components/TabBar.vue'

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
</script>

<template>
  <HeaderBar
    :title="pageTitle"
    :title-visible="headerTitleVisible"
    :left-buttons="leftButtons"
    :right-buttons="rightButtons"
    @button-click="buttonHandler"
  />
  <main class="page-body">
    <RouterView />
  </main>
  <TabBar />
</template>

<style scoped>
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
