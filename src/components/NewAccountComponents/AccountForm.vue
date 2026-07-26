<script setup>
import { ref } from 'vue'
import { useAccountsStore, accountTypes } from '../../stores/accounts'
import SelectionList from '../SelectionList.vue'

// The body of the "New Account" form, shared by the standalone CreateAccountModal sheet
// and the New Transaction flow's newAccount page. `save()` returns the created
// account, or false when the name is blank so the caller can stay put.
const accountsStore = useAccountsStore()

const name = ref('')
const type = ref('checking')
const isDefault = ref(false)

function save() {
  const trimmed = name.value.trim()
  if (!trimmed) return false
  return accountsStore.addAccount({ name: trimmed, type: type.value, isDefault: isDefault.value })
}

defineExpose({ save })
</script>

<template>
  <div>
    <div class="field-card">
      <input v-model="name" class="name-input" type="text" placeholder="Account Name" />
    </div>

    <h2 class="section-title">Type</h2>
    <div class="list-card">
      <SelectionList
        v-for="t in accountTypes"
        :key="t.id"
        :label="t.label"
        type="option"
        :selected="type === t.id"
        @select="type = t.id"
      />
    </div>

    <h2 class="section-title">Options</h2>
    <div class="list-card">
      <SelectionList v-model="isDefault" label="Default Account" type="toggle" />
    </div>
    <p class="section-note">Preselect this account when creating a new transaction.</p>
  </div>
</template>

<style scoped>
.field-card {
  background-color: var(--surface-1);
  border-radius: 25px;
  padding: 0.85rem 1.25rem;
  margin-top: 0.5rem;
}

.name-input {
  width: 100%;
  border: none;
  background: transparent;
  color: #ffffff;
  caret-color: #ffffff;
  font-family: inherit;
  font-size: 1.1rem;
  outline: none;
  padding: 0;
}

.name-input::placeholder {
  color: rgba(255, 255, 255, 0.4);
}

.list-card {
  background-color: var(--surface-1);
  border-radius: 25px;
  padding: 0 1.25rem;
}

.section-note {
  margin: 0.6rem 0 0 14px;
  font-size: 0.85rem;
  color: rgba(255, 255, 255, 0.45);
}

.section-title {
  font-size: 1.25rem;
  font-weight: 600;
  margin: 1.75rem 0 0.75rem 14px;
}
</style>
