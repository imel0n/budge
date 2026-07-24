<script setup>
import { inject } from 'vue'
import SelectionList from '../SelectionList.vue'
import ellipse from '../../assets/icons/categories/ellipse.png'

const { form, categories, pop } = inject('newTransaction')

function select(category) {
  form.category = category.id
  pop()
}

function selectNone() {
  form.category = ''
  pop()
}
</script>

<template>
  <div>
    <div class="field-card">
      <SelectionList
        label="None"
        type="option"
        :selected="!form.category"
        @select="selectNone"
      >
        <template #icon><img :src="ellipse" alt="" /></template>
      </SelectionList>
      <SelectionList
        v-for="category in categories"
        :key="category.id"
        :label="category.name"
        type="option"
        :selected="form.category === category.id"
        @select="select(category)"
      >
        <template #icon><img :src="category.icon || ellipse" alt="" /></template>
      </SelectionList>
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
