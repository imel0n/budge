<script setup>
import { computed } from 'vue'

// An Apple-Settings-style disclosure row: an optional leading icon, a label,
// and a right-hand value. Tapping either opens a native picker (when `options`
// are given) or navigates like a link (when `to` is given). Stack several
// inside a card and dividers appear automatically between rows.
const props = defineProps({
  modelValue: {
    type: [String, Number],
    default: '',
  },
  label: {
    type: String,
    required: true,
  },
  // Either plain strings or { value, label } objects.
  options: {
    type: Array,
    default: () => [],
  },
  placeholder: {
    type: String,
    default: 'None',
  },
  // When set, the row behaves like a router-link instead of a picker.
  to: {
    type: [String, Object],
    default: null,
  },
})

const emit = defineEmits(['update:modelValue'])

const normalized = computed(() =>
  props.options.map((o) => (typeof o === 'object' ? o : { value: o, label: String(o) })),
)

const displayLabel = computed(() => {
  const match = normalized.value.find((o) => o.value === props.modelValue)
  return match ? match.label : props.placeholder
})
</script>

<template>
  <component
    :is="to ? 'router-link' : 'div'"
    :to="to"
    class="settings-row"
    :class="{ 'has-icon': $slots.icon }"
  >
    <span v-if="$slots.icon" class="settings-icon">
      <slot name="icon" />
    </span>
    <span class="settings-label">{{ label }}</span>
    <div class="settings-select">
      <select
        v-if="!to"
        :value="modelValue"
        @change="emit('update:modelValue', $event.target.value)"
      >
        <option value="">{{ placeholder }}</option>
        <option v-for="o in normalized" :key="o.value" :value="o.value">
          {{ o.label }}
        </option>
      </select>
      <span class="settings-value">{{ displayLabel }}</span>
      <svg class="chevron" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path
          d="M9 6l6 6-6 6"
          stroke="currentColor"
          stroke-width="2.5"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
      </svg>
    </div>
  </component>
</template>

<style scoped>
.settings-row {
  position: relative;
  display: flex;
  align-items: center;
  gap: 0.85rem;
  padding: 0.85rem 0;
  color: inherit;
  text-decoration: none;
}

/* Inset divider: starts at the label (past the icon), runs to the edge. */
.settings-row:not(:first-child)::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 1px;
  background: rgba(255, 255, 255, 0.1);
}

.settings-row.has-icon:not(:first-child)::before {
  left: 3.6rem;
}

.settings-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  flex: none;
  width: 2.75rem;
  height: 2.75rem;
  border-radius: 0.75rem;
  background: rgba(255, 255, 255, 0.08);
}

.settings-icon :deep(svg),
.settings-icon :deep(img) {
  width: 1.5rem;
  height: 1.5rem;
}

.settings-label {
  font-size: 1.1rem;
  font-weight: 400;
}

.settings-select {
  position: relative;
  display: flex;
  align-items: center;
  gap: 0.35rem;
  margin-left: auto;
  color: rgba(255, 255, 255, 0.55);
}

.settings-select select {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  opacity: 0;
  cursor: pointer;
}

.settings-value {
  font-size: 1.1rem;
}

.chevron {
  width: 1.1rem;
  height: 1.1rem;
  margin-right: -0.35rem;
  color: rgba(255, 255, 255, 0.35);
}
</style>
