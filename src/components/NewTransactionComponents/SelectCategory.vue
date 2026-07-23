<script setup>
import { inject } from 'vue'
import SelectionList from '../SelectionList.vue'

const { form, categories, pop } = inject('newTransaction')

function select(category) {
  form.category = category
  pop()
}
</script>

<template>
  <div>
    <div class="field-card">
      <SelectionList
        v-for="category in categories"
        :key="category"
        :label="category"
        type="option"
        :selected="form.category === category"
        @select="select(category)"
      />
    </div>
  </div>
</template>

<style scoped>
.field-card {
  background-color: var(--surface-1);
  border-radius: 25px;
  padding: 0 1.25rem;
  margin-top: 0.5rem;
}
</style>
