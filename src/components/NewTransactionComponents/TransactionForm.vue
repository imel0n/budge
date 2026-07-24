<script setup>
import { computed, inject, nextTick, onMounted, ref, watch } from 'vue'
import SelectionList from '../SelectionList.vue'

const { form, types, accounts, categories, payees, repeats, push } = inject('newTransaction')

function onAmountInput(e) {
  let value = e.target.value.replace(/[^\d.]/g, '')
  const [whole, ...rest] = value.split('.')
  value = rest.length ? `${whole}.${rest.join('').slice(0, 2)}` : whole
  form.amount = value
  e.target.value = value
}

const amountSign = computed(() => (form.type === 'expense' ? '-' : ''))

const categoryOptions = computed(() =>
  categories.value.map((c) => ({ value: c.id, label: c.name })),
)

const toggleRef = ref(null)
const indicatorStyle = ref({})

function updateIndicator() {
  const el = toggleRef.value?.querySelector('.type-option.active')
  if (!el) return
  indicatorStyle.value = {
    width: `${el.offsetWidth}px`,
    height: `${el.offsetHeight}px`,
    transform: `translateX(${el.offsetLeft}px)`,
  }
}

function selectType(id) {
  form.type = id
  form.category = ''
  nextTick(updateIndicator)
}

onMounted(() => nextTick(updateIndicator))

watch(
  () => form.location,
  async (on) => {
    if (!on) return
    await nextTick()
    const scroller = document.querySelector('.modal-scroll')
    scroller?.scrollTo({ top: scroller.scrollHeight, behavior: 'smooth' })
  },
)
</script>

<template>
  <div>
    <div class="amount-card">
      <div class="amount-row">
        <span class="amount-sign">{{ amountSign }}$</span>
        <input
          :value="form.amount"
          class="amount-input"
          type="text"
          inputmode="decimal"
          placeholder="0"
          @input="onAmountInput"
        />
      </div>

      <div class="amount-divider"></div>

      <div ref="toggleRef" class="type-toggle">
        <div class="type-indicator" :style="indicatorStyle"></div>
        <button
          v-for="t in types"
          :key="t.id"
          type="button"
          class="type-option"
          :class="{ active: form.type === t.id }"
          @click="selectType(t.id)"
        >
          {{ t.label }}
        </button>
      </div>
    </div>

    <h2 class="section-title">Assignment</h2>
    <div class="field-card">
      <SelectionList
        :model-value="form.account"
        label="Account"
        type="nav"
        :options="accounts"
        @navigate="push('account')"
      />
      <SelectionList
        :model-value="form.category"
        label="Category"
        type="nav"
        :options="categoryOptions"
        @navigate="push('category')"
      />
      <SelectionList
        :model-value="form.payee"
        label="Payee"
        type="nav"
        :options="payees"
        @navigate="push('payee')"
      />
    </div>

    <h2 class="section-title">Date and Time</h2>
    <div class="field-card">
      <SelectionList v-model="form.date" label="Date" type="date" />
      <SelectionList v-model="form.time" label="Time" type="time" />
      <SelectionList v-model="form.repeat" label="Repeat" :options="repeats" />
    </div>

    <h2 class="section-title">Location</h2>
    <div class="field-card">
      <SelectionList v-model="form.location" label="Enable Location" type="toggle" />
      <SelectionList
        v-if="form.location"
        :model-value="form.selectedLocation"
        label="Selected"
        type="nav"
        placeholder="Location"
        @navigate="push('location')"
      />
    </div>
  </div>
</template>

<style scoped>
.amount-card {
  background-color: var(--surface-1);
  border-radius: 25px;
  padding: 0.75rem 1rem 0.7rem;
  margin-top: 0.5rem;
}

.amount-row {
  display: flex;
  align-items: baseline;
  gap: 0.1rem;
}

.amount-sign,
.amount-input {
  font-family:
    ui-rounded,
    'SF Pro Rounded',
    -apple-system,
    sans-serif;
}

.amount-sign {
  font-size: 2.25rem;
  font-weight: 600;
}

.amount-input {
  flex: 1;
  min-width: 0;
  border: none;
  background: transparent;
  color: #ffffff;
  caret-color: #ffffff;
  font-size: 2.25rem;
  font-weight: 600;
  outline: none;
  padding: 0;
}

.amount-input::placeholder {
  color: rgba(255, 255, 255, 0.4);
}

.amount-divider {
  height: 1px;
  background-color: rgba(255, 255, 255, 0.1);
  margin: 0.4rem -1rem 0;
}

.type-toggle {
  position: relative;
  display: flex;
  gap: 0.25rem;
  margin-top: 0.7rem;
}

.type-indicator {
  position: absolute;
  top: 0;
  left: 0;
  border-radius: 999px;
  background-color: var(--surface-2);
  transition:
    transform 0.5s cubic-bezier(0.34, 1.2, 0.4, 1),
    width 0.5s cubic-bezier(0.34, 1.2, 0.4, 1),
    height 0.5s cubic-bezier(0.34, 1.2, 0.4, 1);
  will-change: transform;
  pointer-events: none;
  z-index: 0;
}

.type-option {
  position: relative;
  z-index: 1;
  flex: 1;
  border: none;
  background: transparent;
  color: rgba(255, 255, 255, 0.55);
  font-size: 1rem;
  font-weight: 500;
  padding: 0.3rem 0;
  border-radius: 999px;
  cursor: pointer;
  transition: color 0.2s ease;
}

.type-option.active {
  color: #ffffff;
}

.section-title {
  font-size: 1.25rem;
  font-weight: 600;
  margin: 1.75rem 0 0.75rem 14px;
}

.field-card {
  background-color: var(--surface-1);
  border-radius: 25px;
  padding: 0 1.25rem;
}
</style>
