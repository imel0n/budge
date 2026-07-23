<script setup>
import { ref } from 'vue'

const name = ref('')
</script>

<template>
  <div>
    <div class="field-card">
      <input v-model="name" class="name-input" type="text" placeholder="Payee Name" />
    </div>
  </div>
</template>

<style scoped>
.field-card {
  background-color: var(--surface-1);
  border-radius: 25px;
  padding: 0.85rem 1.25rem;
  margin-top: 0.5rem;
}

.name-input {
  width: 100%;
  border: none;
  background: transparent;
  color: #ffffff;
  caret-color: #ffffff;
  font-family: inherit;
  font-size: 1.1rem;
  outline: none;
  padding: 0;
}

.name-input::placeholder {
  color: rgba(255, 255, 255, 0.4);
}
</style>
