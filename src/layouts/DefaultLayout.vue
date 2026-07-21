<script setup>
import { provide, ref } from 'vue'
import HeaderBar from '../components/HeaderBar.vue'

// Pages set their own title via the injected setter (see usePageTitle key).
const pageTitle = ref('')

function setPageTitle(title) {
  pageTitle.value = title
}

provide('setPageTitle', setPageTitle)
</script>

<template>
  <HeaderBar :title="pageTitle" />
  <RouterView />
</template>

<style scoped></style>
