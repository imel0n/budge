<script setup>
import { ref } from 'vue'

// A single standalone header button: a liquid-glass pill. It shows either an
// `icon` (raw SVG markup, sized to the button and inheriting its colour) or, if
// no icon is given, the `label` as plain text. `label` is always used as the
// accessible name, so pass it even for icon-only buttons. Clicks bubble up via
// the native `click` event.
defineProps({
  label: {
    type: String,
    default: '',
  },
  // Raw inline SVG markup. When present it replaces the text label.
  icon: {
    type: String,
    default: '',
  },
})

// Drive a liquid-glass tap animation off pointer events: expand while the finger
// is down, then a bouncy contract (undershoot past the resting size, then settle
// back) when it lifts. We track the phase as a class so keyframes can restart
// cleanly on each tap.
//
// The press-in swell always plays to completion — even on a quick tap that lifts
// mid-swell — so the button never snaps or reverses partway up. If the finger is
// still down when press-in finishes (a press-and-hold), it simply stays expanded
// until release. Only then does the release bounce play, always from full size.
const phase = ref('') // '' | 'pressing' | 'releasing'
const pressInDone = ref(false) // press-in swell has reached full size
const releaseWanted = ref(false) // finger lifted; bounce is pending

// A soft glow that radiates from the exact point the finger tapped. We record
// the tap position (as a % of the button box, so it survives the tap scaling)
// into CSS variables and re-key the glow element on every tap so its bloom
// keyframes restart cleanly, even on rapid repeat taps.
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
  // Only bounce back if we were actually pressed (ignore stray leave/up events).
  if (phase.value !== 'pressing') return
  releaseWanted.value = true
  // If the swell has already finished, start the bounce now; otherwise wait for
  // press-in to complete (handled in onAnimationEnd).
  if (pressInDone.value) phase.value = 'releasing'
}

function onAnimationEnd(event) {
  // Keyframe names are scoped by Vue (suffixed with a hash), so match by prefix.
  if (event.animationName.includes('press-in')) {
    pressInDone.value = true
    // Finger already lifted during the swell → play the bounce now.
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
  /* Liquid glass: a faint tint over a blurred backdrop, with a subtle ring. */
  background-color: rgba(255, 255, 255, 0.08);
  backdrop-filter: blur(4px);
  -webkit-backdrop-filter: blur(4px);
  border: 1px solid rgba(255, 255, 255, 0.08);
  color: #ffffff;
  font-size: 1.0625rem;
  font-weight: 600;
  line-height: 1;
  cursor: pointer;
  /* Soft outer glow/ring and a touch of inner highlight for depth. */
  box-shadow:
    0 0 0 4px rgba(255, 255, 255, 0.02),
    0 1px 2px rgba(0, 0, 0, 0.4),
    inset 0 1px 0 rgba(255, 255, 255, 0.04);
  transform: scale(1);
  transform-origin: center;
  will-change: transform;
  /* Contain the tap glow within the pill. */
  position: relative;
  overflow: hidden;
}

/* Keep the label above the glow layer. */
.label {
  position: relative;
  z-index: 1;
}

/* The icon sits in the same stacking context as the label. The inline SVG is
   sized to a consistent glyph box and inherits the button's colour, so icons
   can be authored without their own dimensions or fills. */
.icon {
  position: relative;
  z-index: 1;
  display: inline-flex;
}

.icon :deep(svg) {
  width: 1.375rem;
  height: 1.375rem;
  display: block;
  fill: currentColor;
}

/* The tap glow: a soft radial bloom centred on the finger's touch point. It
   starts small and bright at the tap coordinates, then expands and fades. The
   element is re-keyed per tap (see script), so this animation restarts each
   time it mounts. */
.glow {
  position: absolute;
  /* Oversize and centre on the tap point so the bloom can radiate past the
     pill edges before being clipped. */
  top: var(--glow-y);
  left: var(--glow-x);
  width: 280%;
  height: 280%;
  transform: translate(-50%, -50%) scale(0.45);
  border-radius: 50%;
  background: radial-gradient(
    circle,
    rgba(255, 255, 255, 0.95) 0%,
    rgba(255, 255, 255, 0.6) 30%,
    rgba(255, 255, 255, 0.28) 50%,
    rgba(255, 255, 255, 0.12) 66%,
    rgba(255, 255, 255, 0.04) 82%,
    rgba(255, 255, 255, 0) 100%
  );
  pointer-events: none;
  z-index: 0;
  animation: glow-bloom 500ms ease-out forwards;
}

@keyframes glow-bloom {
  from {
    transform: translate(-50%, -50%) scale(0.45);
    opacity: 1;
  }
  to {
    transform: translate(-50%, -50%) scale(1);
    opacity: 0;
  }
}

/* Finger down: swell up quickly and hold there until the finger lifts.
   A decelerating ease-out curve moves fast at the start then eases into the
   held size, so it feels responsive without snapping. */
button.pressing {
  animation: press-in 130ms cubic-bezier(0.22, 0.61, 0.7, 1) forwards;
}

/* Finger up: contract past the resting size, overshoot, then settle to rest in
   two decaying bounces. Per-segment easing (set in the keyframes) keeps each
   phase of the bounce gliding smoothly rather than snapping. */
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
    /* press-in always runs to completion, so the bounce always starts from the
       full expanded size. Ease-in-out into the undershoot for a smooth dip. */
    transform: scale(1.2);
    animation-timing-function: cubic-bezier(0.3, 0, 0.5, 1);
  }
  /* First bounce: contract past the resting size... */
  40% {
    transform: scale(0.94);
    animation-timing-function: cubic-bezier(0.42, 0, 0.58, 1);
  }
  /* ...spring back up into a smaller overshoot... */
  70% {
    transform: scale(1.02);
    animation-timing-function: cubic-bezier(0.42, 0, 0.58, 1);
  }
  /* ...then settle to rest with a decelerating ease-out so the finish is soft. */
  100% {
    transform: scale(1);
  }
}

@media (prefers-reduced-motion: reduce) {
  button.pressing,
  button.releasing {
    animation: none;
  }
  .glow {
    /* Skip the motion; a brief static bloom still gives tap feedback. */
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
