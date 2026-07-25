<script setup>
import TheModal from './TheModal.vue'
import SelectionList from './SelectionList.vue'

defineProps({
  open: {
    type: Boolean,
    default: false,
  },
  modelValue: {
    type: String,
    default: 'month',
  },
})

const emit = defineEmits(['update:open', 'update:modelValue'])

const periods = [
  { id: 'week', label: 'Current Week' },
  { id: 'month', label: 'Current Month' },
  { id: 'year', label: 'Current Year' },
]

function select(period) {
  emit('update:modelValue', period)
  emit('update:open', false)
}
</script>

<template>
  <TheModal
    title="Select Period"
    :open="open"
    :backdrop-opacity="0.5"
    @update:open="emit('update:open', $event)"
  >
    <div class="field-card">
      <SelectionList
        v-for="period in periods"
        :key="period.id"
        :label="period.label"
        type="option"
        :selected="modelValue === period.id"
        @select="select(period.id)"
      />
    </div>
  </TheModal>
</template>

<style scoped>
.field-card {
  background-color: var(--surface-1);
  border-radius: 25px;
  padding: 0 1.25rem;
  margin-top: 0.5rem;
}
</style>
