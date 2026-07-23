<script setup>
import { ref } from 'vue'

defineProps({
  label: {
    type: String,
    default: '',
  },

  icon: {
    type: String,
    default: '',
  },
})

const phase = ref('') // '' | 'pressing' | 'releasing'
const pressInDone = ref(false)
const releaseWanted = ref(false)

const glowX = ref('50%')
const glowY = ref('50%')
const glowKey = ref(0)

function onPointerDown(event) {
  const rect = event.currentTarget.getBoundingClientRect()
  glowX.value = `${((event.clientX - rect.left) / rect.width) * 100}%`
  glowY.value = `${((event.clientY - rect.top) / rect.height) * 100}%`
  glowKey.value += 1

  phase.value = 'pressing'
  pressInDone.value = false
  releaseWanted.value = false
}

function onRelease() {
  if (phase.value !== 'pressing') return
  releaseWanted.value = true
  if (pressInDone.value) phase.value = 'releasing'
}

function onAnimationEnd(event) {
  if (event.animationName.includes('press-in')) {
    pressInDone.value = true
    if (releaseWanted.value) phase.value = 'releasing'
  } else if (event.animationName.includes('press-out')) {
    if (phase.value === 'releasing') phase.value = ''
  }
}
</script>

<template>
  <button
    type="button"
    :class="phase"
    :aria-label="icon ? label || undefined : undefined"
    :style="{ '--glow-x': glowX, '--glow-y': glowY }"
    @pointerdown="onPointerDown"
    @pointerup="onRelease"
    @pointercancel="onRelease"
    @pointerleave="onRelease"
    @animationend="onAnimationEnd"
  >
    <span v-if="glowKey" :key="glowKey" class="glow" aria-hidden="true" />
    <span v-if="icon" class="icon" aria-hidden="true" v-html="icon" />
    <span v-else class="label">{{ label }}</span>
  </button>
</template>

<style scoped>
button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 2.5rem;
  min-height: 2.5rem;
  padding: 0.85rem;
  border-radius: 999px;

  background-color: rgba(255, 255, 255, 0.12);
  backdrop-filter: blur(4px);
  -webkit-backdrop-filter: blur(4px);
  border: 1px solid rgba(255, 255, 255, 0.12);
  color: #ffffff;
  font-size: 1.0625rem;
  font-weight: 600;
  line-height: 1;
  cursor: pointer;

  box-shadow:
    0 1px 2px rgba(0, 0, 0, 0.4),
    inset 0 1px 0 rgba(255, 255, 255, 0.04);
  transform: scale(1);
  transform-origin: center;
  will-change: transform;

  position: relative;
  overflow: hidden;
}

/* Keep the label above the glow layer. */
.label {
  position: relative;
  z-index: 1;
}

.icon {
  position: relative;
  z-index: 1;
  display: inline-flex;
}

/* Tighten the icon button's padding and enlarge the glyph so it fills more of
   the round button. */
button:has(.icon) {
  padding: 0.5rem;
}

.icon :deep(svg) {
  width: 1.75rem;
  height: 1.75rem;
  display: block;
  fill: currentColor;
  transform: translateZ(0);
}

.glow {
  position: absolute;
  top: var(--glow-y);
  left: var(--glow-x);
  width: 460%;
  height: 460%;
  transform: translate(-50%, -50%) scale(0.45);
  border-radius: 50%;
  background: radial-gradient(
    circle,
    rgba(255, 255, 255, 0.55) 0%,
    rgba(255, 255, 255, 0.42) 18%,
    rgba(255, 255, 255, 0.26) 36%,
    rgba(255, 255, 255, 0.14) 54%,
    rgba(255, 255, 255, 0.06) 72%,
    rgba(255, 255, 255, 0.02) 86%,
    rgba(255, 255, 255, 0) 100%
  );
  pointer-events: none;
  z-index: 0;
  opacity: 0;
}

.pressing .glow {
  animation: glow-in 150ms ease-out forwards;
}

.releasing .glow {
  animation: glow-out 480ms ease-out forwards;
}

@keyframes glow-in {
  from {
    transform: translate(-50%, -50%) scale(0.45);
    opacity: 0;
  }
  to {
    transform: translate(-50%, -50%) scale(0.55);
    opacity: 1;
  }
}

@keyframes glow-out {
  from {
    transform: translate(-50%, -50%) scale(0.55);
    opacity: 1;
  }
  to {
    transform: translate(-50%, -50%) scale(1);
    opacity: 0;
  }
}

button.pressing {
  animation: press-in 130ms cubic-bezier(0.22, 0.61, 0.7, 1) forwards;
}

button.releasing {
  animation: press-out 360ms linear forwards;
}

@keyframes press-in {
  from {
    transform: scale(1);
  }
  to {
    transform: scale(1.2);
  }
}

@keyframes press-out {
  0% {
    transform: scale(1.2);
    animation-timing-function: cubic-bezier(0.3, 0, 0.5, 1);
  }

  40% {
    transform: scale(0.94);
    animation-timing-function: cubic-bezier(0.42, 0, 0.58, 1);
  }

  70% {
    transform: scale(1.02);
    animation-timing-function: cubic-bezier(0.42, 0, 0.58, 1);
  }

  100% {
    transform: scale(1);
  }
}

@media (prefers-reduced-motion: reduce) {
  button.pressing,
  button.releasing {
    animation: none;
  }
  .glow,
  .pressing .glow,
  .releasing .glow {
    animation: glow-fade 300ms ease-out forwards;
    transform: translate(-50%, -50%) scale(1);
  }
}

@keyframes glow-fade {
  from {
    opacity: 1;
  }
  to {
    opacity: 0;
  }
}
</style>
