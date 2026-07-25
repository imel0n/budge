<script setup>
import { inject } from 'vue'
import SelectionList from '../SelectionList.vue'

const { form, accounts, pop } = inject('newTransaction')

function select(id) {
  form.account = id
  pop()
}
</script>

<template>
  <div>
    <div class="field-card">
      <SelectionList label="None" type="option" :selected="!form.account" @select="select('')" />
      <SelectionList
        v-for="account in accounts"
        :key="account.id"
        :label="account.name"
        type="option"
        :selected="form.account === account.id"
        @select="select(account.id)"
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
