<script setup>
import { ref } from 'vue'

// Two (or more) buttons merged into a single segmented pill. The container owns
// all the glass chrome; the buttons inside are chromeless segments so the whole
// thing reads as one object. Each button descriptor is { id, label, icon? }:
// when `icon` (raw SVG markup) is present the segment shows it instead of the
// text, and `label` is used as the segment's accessible name. The clicked `id`
// is emitted back to the parent.
defineProps({
  buttons: {
    type: Array,
    default: () => [],
  },
})

const emit = defineEmits(['button-click'])

// Liquid-glass tap animation, identical in behaviour to HeaderButton, but driven
// on the WHOLE pill: tapping any segment swells the entire pill while the finger
// is down, then plays a bouncy contract (undershoot past the resting size, then
// settle back) when it lifts. Pointer events live on the container so the whole
// group is one animating object; segments only report which `id` was clicked.
//
// The press-in swell always plays to completion — even on a quick tap that lifts
// mid-swell — so the pill never snaps or reverses partway up. If the finger is
// still down when press-in finishes (a press-and-hold), it stays expanded until
// release. Only then does the release bounce play, always from full size.
const phase = ref('') // '' | 'pressing' | 'releasing'
const pressInDone = ref(false) // press-in swell has reached full size
const releaseWanted = ref(false) // finger lifted; bounce is pending

// A soft glow that radiates from the exact point the finger tapped. We record
// the tap position (as a % of the pill box, so it survives the tap scaling) into
// CSS variables and re-key the glow element on every tap so its bloom keyframes
// restart cleanly, even on rapid repeat taps.
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
  <div
    class="group"
    :class="phase"
    :style="{ '--glow-x': glowX, '--glow-y': glowY }"
    @pointerdown="onPointerDown"
    @pointerup="onRelease"
    @pointercancel="onRelease"
    @pointerleave="onRelease"
    @animationend="onAnimationEnd"
  >
    <span v-if="glowKey" :key="glowKey" class="glow" aria-hidden="true" />
    <button
      v-for="button in buttons"
      :key="button.id"
      type="button"
      :aria-label="button.icon ? button.label || undefined : undefined"
      @click="emit('button-click', button.id)"
    >
      <span v-if="button.icon" class="icon" aria-hidden="true" v-html="button.icon" />
      <template v-else>{{ button.label }}</template>
    </button>
  </div>
</template>

<style scoped>
.group {
  display: flex;
  gap: 0;
  border-radius: 999px;
  overflow: hidden;
  /* Liquid glass: a faint tint over a blurred backdrop. */
  background-color: rgba(255, 255, 255, 0.12);
  backdrop-filter: blur(4px);
  -webkit-backdrop-filter: blur(4px);
  border: 1px solid rgba(255, 255, 255, 0.12);
  box-shadow:
    0 1px 2px rgba(0, 0, 0, 0.4),
    inset 0 1px 0 rgba(255, 255, 255, 0.04);
  /* The whole pill is the animating object. */
  transform: scale(1);
  transform-origin: center;
  will-change: transform;
  position: relative;
}

/* Segments drop ALL their own chrome — including the backdrop blur — and become
   flat, transparent segments of the shared pill. */
button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 3rem;
  min-height: 2.5rem;
  padding: 0.85rem;
  background-color: transparent;
  border: none;
  color: #ffffff;
  font-size: 1.0625rem;
  font-weight: 600;
  line-height: 1;
  cursor: pointer;
  /* Keep the labels above the glow layer. */
  position: relative;
  z-index: 1;
}

/* Icon segments only need enough vertical padding to hit the tap target height;
   the label's line-height doesn't apply, so the full 0.85rem reads as excess. */
button:has(.icon) {
  padding-top: 0.7rem;
  padding-bottom: 0.7rem;
}

/* Inline SVG icons are sized to a consistent glyph box and inherit the segment's
   colour, so icons can be authored without their own dimensions or fills. */
.icon {
  display: inline-flex;
}

.icon :deep(svg) {
  width: 1.375rem;
  height: 1.375rem;
  display: block;
  fill: currentColor;
  /* Promote the glyph to its own compositor layer. The pill animates a scale
     bounce on tap while carrying a backdrop-filter, which otherwise forces the
     icon to re-rasterize every frame — making diagonal edges shimmer and appear
     to wiggle. Painting it once and letting the compositor scale the cached
     raster keeps it stable. */
  transform: translateZ(0);
}

/* The tap glow: a soft radial bloom centred on the finger's touch point. It
   plays in two stages tied to the press phase — light up at the tap point while
   the finger is down, then ripple outward across the pill and fade when it
   lifts. The element is re-keyed per tap (see script), so the bloom restarts
   cleanly each time it mounts. */
.glow {
  position: absolute;
  /* Oversize and centre on the tap point so the bloom can radiate past the pill
     edges before being clipped. */
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
  /* At rest the glow is invisible; the press phase drives its two stages. */
  opacity: 0;
}

/* Stage 1 — finger down: the glow lights up at the tap point and holds. Like
   press-in, this always runs to completion, so it reaches full brightness even
   on a quick tap, and stays lit through a press-and-hold. */
.pressing .glow {
  animation: glow-in 150ms ease-out forwards;
}

/* Stage 2 — finger up: the lit glow expands outward and fades. The ripple. */
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

/* Finger down: swell up quickly and hold there until the finger lifts.
   A decelerating ease-out curve moves fast at the start then eases into the
   held size, so it feels responsive without snapping. */
.group.pressing {
  animation: press-in 130ms cubic-bezier(0.22, 0.61, 0.7, 1) forwards;
}

/* Finger up: contract past the resting size, overshoot, then settle to rest in
   two decaying bounces. Per-segment easing (set in the keyframes) keeps each
   phase of the bounce gliding smoothly rather than snapping. */
.group.releasing {
  animation: press-out 360ms linear forwards;
}

@keyframes press-in {
  from {
    transform: scale(1);
  }
  to {
    transform: scale(1.15);
  }
}

@keyframes press-out {
  0% {
    /* press-in always runs to completion, so the bounce always starts from the
       full expanded size. Ease-in-out into the undershoot for a smooth dip. */
    transform: scale(1.15);
    animation-timing-function: cubic-bezier(0.3, 0, 0.5, 1);
  }
  /* First bounce: contract past the resting size... */
  40% {
    transform: scale(0.96);
    animation-timing-function: cubic-bezier(0.42, 0, 0.58, 1);
  }
  /* ...spring back up into a smaller overshoot... */
  70% {
    transform: scale(1.01);
    animation-timing-function: cubic-bezier(0.42, 0, 0.58, 1);
  }
  /* ...then settle to rest with a decelerating ease-out so the finish is soft. */
  100% {
    transform: scale(1);
  }
}

@media (prefers-reduced-motion: reduce) {
  .group.pressing,
  .group.releasing {
    animation: none;
  }
  .glow,
  .pressing .glow,
  .releasing .glow {
    /* Skip the two-stage motion; a brief static fade still gives tap feedback. */
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
