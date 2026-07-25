<script setup>
import { inject, ref } from 'vue'
import AccountForm from '../AccountForm.vue'

const { form } = inject('newTransaction')

const formRef = ref(null)

function save() {
  const account = formRef.value.save()
  if (!account) return false
  form.account = account.id
}

defineExpose({ save })
</script>

<template>
  <AccountForm ref="formRef" />
</template>
