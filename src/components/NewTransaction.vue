<script setup>
import TheModal from './TheModal.vue'

// The "New Transaction" sheet: a TheModal shell with its own title, a "Save"
// action on the right, and the transaction form as the body. Driven by
// v-model:open from the layout.
defineProps({
  open: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['update:open'])

// The sheet's right-hand action. Its click surfaces via TheModal's button-click.
const rightButtons = [{ id: 'save', label: 'Save' }]

function onButton({ id }) {
  if (id === 'save') {
    // TODO: persist the new transaction.
    emit('update:open', false)
  }
}
</script>

<template>
  <TheModal
    :open="open"
    title="New Transaction"
    :right-buttons="rightButtons"
    @update:open="emit('update:open', $event)"
    @button-click="onButton"
  >
    <!-- TODO: transaction form fields. -->
  </TheModal>
</template>
