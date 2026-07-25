<script setup>
import { inject } from 'vue'
import SelectionList from '../SelectionList.vue'

const { form, repeats, pop } = inject('newTransaction')

function select(repeat) {
  form.repeat = repeat
  pop()
}
</script>

<template>
  <div>
    <div class="field-card">
      <SelectionList
        v-for="repeat in repeats"
        :key="repeat"
        :label="repeat"
        type="option"
        :selected="form.repeat === repeat"
        @select="select(repeat)"
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
