<script setup>
import { inject } from 'vue'
import SelectionList from '../SelectionList.vue'

const { form, accounts, pop } = inject('newTransaction')

function select(account) {
  form.account = account
  pop()
}

function selectNone() {
  form.account = ''
  pop()
}
</script>

<template>
  <div>
    <div class="field-card">
      <SelectionList label="None" type="option" :selected="!form.account" @select="selectNone" />
      <SelectionList
        v-for="account in accounts"
        :key="account"
        :label="account"
        type="option"
        :selected="form.account === account"
        @select="select(account)"
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
