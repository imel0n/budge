<script setup>
import { computed } from 'vue'

// An Apple-Settings-style disclosure row: an optional leading icon, a label,
// and a right-hand value. Tapping either opens a native picker (when `options`
// are given) or navigates like a link (when `to` is given). Stack several
// inside a card and dividers appear automatically between rows.
const props = defineProps({
  modelValue: {
    type: [String, Number, Boolean],
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
  // 'select' picker; 'date'/'time' native inputs; 'toggle' switch; 'nav' emits
  // `navigate`; 'option' emits `select` and shows a checkmark when `selected`.
  type: {
    type: String,
    default: 'select',
  },
  selected: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['update:modelValue', 'navigate', 'select'])

const normalized = computed(() =>
  props.options.map((o) => (typeof o === 'object' ? o : { value: o, label: String(o) })),
)

const displayLabel = computed(() => {
  const match = normalized.value.find((o) => o.value === props.modelValue)
  if (match) return match.label
  if (props.modelValue !== '' && props.modelValue != null) return String(props.modelValue)
  return props.placeholder
})

const checkIcon = `<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" fill="currentColor">
  <path d="M20 6.5a1 1 0 0 1 0 1.4l-9.6 9.6a1 1 0 0 1-1.42 0l-4.5-4.5a1 1 0 1 1 1.42-1.4l3.79 3.78L18.6 6.5a1 1 0 0 1 1.4 0z" />
</svg>`

function onRowClick() {
  if (props.type === 'nav') emit('navigate')
  else if (props.type === 'option') emit('select')
}
</script>

<template>
  <component
    :is="to ? 'router-link' : 'div'"
    :to="to"
    class="settings-row"
    :class="{
      'has-icon': $slots.icon,
      'is-nav': type === 'nav',
      'is-option': type === 'option',
    }"
    @click="onRowClick"
  >
    <span v-if="$slots.icon" class="settings-icon">
      <slot name="icon" />
    </span>
    <span class="settings-label">{{ label }}</span>
    <div class="settings-select">
      <button
        v-if="type === 'toggle'"
        type="button"
        class="settings-toggle"
        :class="{ on: modelValue }"
        role="switch"
        :aria-checked="modelValue ? 'true' : 'false'"
        @click="emit('update:modelValue', !modelValue)"
      >
        <span class="toggle-knob"></span>
      </button>
      <input
        v-else-if="!to && (type === 'date' || type === 'time')"
        class="settings-input"
        :type="type"
        :value="modelValue"
        @input="emit('update:modelValue', $event.target.value)"
      />
      <span v-else-if="type === 'nav'" class="settings-value">{{ displayLabel }}</span>
      <span
        v-else-if="type === 'option'"
        class="settings-check"
        :class="{ shown: selected }"
        v-html="checkIcon"
      ></span>
      <template v-else>
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
      </template>
      <svg
        v-if="type === 'select' || type === 'nav'"
        class="chevron"
        viewBox="0 0 24 24"
        fill="none"
        aria-hidden="true"
      >
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
  -webkit-tap-highlight-color: transparent;
}

.settings-row.is-nav,
.settings-row.is-option {
  cursor: pointer;
}

.settings-check {
  display: flex;
  align-items: center;
  color: #ffffff;
  opacity: 0;
  transition: opacity 0.15s ease;
}

.settings-check.shown {
  opacity: 1;
}

.settings-check :deep(svg) {
  width: 1.4rem;
  height: 1.4rem;
}

/* Inset divider: starts at the label (past the icon), runs to the edge. */
.settings-row:not(:first-child)::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: -1.25rem;
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

.settings-input {
  border: none;
  background: transparent;
  color: rgba(255, 255, 255, 0.55);
  font-family: inherit;
  font-size: 1.1rem;
  line-height: 1.1;
  text-align: right;
  outline: none;
  margin: -0.5rem 0;
  padding: 0;
  height: 1.1rem;
}

.settings-input::-webkit-date-and-time-value {
  margin: 0;
}

.settings-input::-webkit-calendar-picker-indicator {
  margin: 0;
  padding: 0;
}

.settings-toggle {
  flex: none;
  width: 3.75rem;
  height: 1.95rem;
  /* Keep the taller switch from stretching the row past the text rows. */
  margin: -0.425rem 0;
  padding: 0;
  border: none;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.15);
  cursor: pointer;
  transition: background 0.25s ease;
}

.settings-toggle.on {
  background: #34c759;
}

.toggle-knob {
  display: block;
  width: 2.25rem;
  height: 1.65rem;
  margin: 0.15rem;
  border-radius: 999px;
  background: #ffffff;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
  transition: transform 0.25s cubic-bezier(0.34, 1.2, 0.4, 1);
}

.settings-toggle.on .toggle-knob {
  transform: translateX(1.2rem);
}

.chevron {
  width: 1.1rem;
  height: 1.1rem;
  margin-right: -0.35rem;
  color: rgba(255, 255, 255, 0.35);
}
</style>
