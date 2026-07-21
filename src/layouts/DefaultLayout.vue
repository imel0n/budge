<script setup>
import { provide, ref } from 'vue'
import HeaderBar from '../components/HeaderBar.vue'

// Pages set their own title via the injected setter (see usePageTitle key).
const pageTitle = ref('')

function setPageTitle(title) {
  pageTitle.value = title
}

provide('setPageTitle', setPageTitle)

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
    :left-buttons="leftButtons"
    :right-buttons="rightButtons"
    @button-click="buttonHandler"
  />
  <main class="page-body">
    <RouterView />
  </main>
</template>

<style scoped>
/* Same gutter as the header content, so page bodies align with it. */
.page-body {
  /* Clear the fixed header, which is lifted out of normal flow. */
  padding-top: var(--header-height);
  padding-left: max(var(--app-gutter), env(safe-area-inset-left));
  padding-right: max(var(--app-gutter), env(safe-area-inset-right));
}
</style>
