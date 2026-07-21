<script setup>
import { inject } from 'vue'

const setPageTitle = inject('setPageTitle')
setPageTitle('Accounts')
</script>

<template>
  <main></main>
</template>

<style scoped></style>
