<script setup>
import { ref } from 'vue'
import TheModal from '../TheModal.vue'
import AccountForm from './AccountForm.vue'

// The standalone "New Account" sheet, opened by the layout's "+" action while
// the Accounts page is showing. The sheet unmounts its body on close, so the
// form starts blank on every open.
defineProps({
  open: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['update:open'])

const rightButtons = [{ id: 'save', label: 'Save' }]

const formRef = ref(null)

function onButton({ id }) {
  if (id !== 'save') return
  if (formRef.value?.save() === false) return
  emit('update:open', false)
}
</script>

<template>
  <TheModal
    title="New Account"
    :open="open"
    :right-buttons="rightButtons"
    :backdrop-opacity="0.5"
    full
    @update:open="emit('update:open', $event)"
    @button-click="onButton"
  >
    <AccountForm ref="formRef" />
  </TheModal>
</template>
