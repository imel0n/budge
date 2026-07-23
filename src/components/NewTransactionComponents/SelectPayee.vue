<script setup>
import { inject } from 'vue'
import SelectionList from '../SelectionList.vue'

const { form, payees, pop } = inject('newTransaction')

function select(payee) {
  form.payee = payee
  pop()
}
</script>

<template>
  <div>
    <div class="field-card">
      <SelectionList
        v-for="payee in payees"
        :key="payee"
        :label="payee"
        type="option"
        :selected="form.payee === payee"
        @select="select(payee)"
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
