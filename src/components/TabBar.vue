<script setup>
import { ref, onMounted, nextTick, watch } from 'vue'
import { useRoute } from 'vue-router'

import creditCard from '../assets/icons/credit-card.png'
import creditCardActive from '../assets/icons/credit-card-active.png'
import bank from '../assets/icons/bank.png'
import bankActive from '../assets/icons/bank-active.png'
import wallet from '../assets/icons/wallet.png'
import walletActive from '../assets/icons/wallet-active.png'

const route = useRoute()

const transactionsLink = ref(null)
const accountsLink = ref(null)
const budgetsLink = ref(null)
const indicatorStyle = ref({})

// Tap-to-expand for the whole bar, mirroring HeaderButton: swell up while a
// finger is down, then a bouncy contract on release. We track the phase as a
// class so the keyframes restart cleanly on each tap.
//
// The press-in swell always plays to completion — even on a quick tap that
// lifts mid-swell — so the bar never snaps or reverses partway up. If the finger
// is still down when press-in finishes (a press-and-hold), it stays expanded
// until release. Only then does the release bounce play, always from full size.
const phase = ref('') // '' | 'pressing' | 'releasing'
const pressInDone = ref(false) // press-in swell has reached full size
const releaseWanted = ref(false) // finger lifted; bounce is pending

// A soft glow that radiates from the exact point the finger tapped. We record
// the tap position (as a % of the bar box, so it survives the tap scaling) into
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

  // Slide the indicator to the pressed link right away rather than waiting for
  // the route to change on release. The spring transition then covers the gap.
  const link = event.target.closest('a')
  if (link) moveIndicator(link)
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
  // Ignore the indicator's own press animations bubbling up from its child.
  if (event.animationName.includes('indicator')) return
  if (event.animationName.includes('press-in')) {
    pressInDone.value = true
    // Finger already lifted during the swell → play the bounce now.
    if (releaseWanted.value) phase.value = 'releasing'
  } else if (event.animationName.includes('press-out')) {
    if (phase.value === 'releasing') phase.value = ''
  }
}

function isActive(path) {
  return route.path === path
}

// Size and slide the active indicator to sit behind the active link: pad it out
// past the link box (+32px wide, +16px tall) and offset it back by the same half
// so the pill is centred on the link. The spring transition on the indicator does
// the rest as `route.path` changes.
function moveIndicator(el) {
  if (!el) return
  indicatorStyle.value = {
    width: `${el.offsetWidth + 32}px`,
    height: `${el.offsetHeight + 16}px`,
    transform: `translate(${el.offsetLeft - 16}px, ${el.offsetTop - 8}px)`,
  }
}

function updateIndicator() {
  const links = {
    '/transactions': transactionsLink.value,
    '/accounts': accountsLink.value,
    '/budgets': budgetsLink.value,
  }
  moveIndicator(links[route.path]?.$el)
}

onMounted(() => nextTick(updateIndicator))
watch(
  () => route.path,
  () => nextTick(updateIndicator),
)
</script>

<template>
  <nav
    class="tabbar"
    :class="phase"
    :style="{ '--glow-x': glowX, '--glow-y': glowY }"
    @pointerdown="onPointerDown"
    @pointerup="onRelease"
    @pointercancel="onRelease"
    @pointerleave="onRelease"
    @animationend="onAnimationEnd"
  >
    <span class="glow-clip" aria-hidden="true">
      <span v-if="glowKey" :key="glowKey" class="glow" />
    </span>
    <div class="active-indicator" :style="indicatorStyle">
      <div class="indicator-pill"></div>
    </div>
    <RouterLink ref="transactionsLink" to="/transactions" replace draggable="false">
      <span class="icon-stack">
        <!-- Base (outline) and active (filled) icons are stacked and crossfaded
             via opacity as the route changes. -->
        <img
          class="icon-base"
          :class="{ hidden: isActive('/transactions') }"
          :src="creditCard"
          alt=""
          aria-hidden="true"
        />
        <img
          class="icon-active"
          :class="{ hidden: !isActive('/transactions') }"
          :src="creditCardActive"
          alt=""
          aria-hidden="true"
        />
      </span>
      <span class="label" data-text="Transactions">Transactions</span>
    </RouterLink>
    <RouterLink ref="accountsLink" to="/accounts" replace draggable="false">
      <span class="icon-stack">
        <img
          class="icon-base"
          :class="{ hidden: isActive('/accounts') }"
          :src="bank"
          alt=""
          aria-hidden="true"
        />
        <img
          class="icon-active"
          :class="{ hidden: !isActive('/accounts') }"
          :src="bankActive"
          alt=""
          aria-hidden="true"
        />
      </span>
      <span class="label" data-text="Accounts">Accounts</span>
    </RouterLink>
    <RouterLink ref="budgetsLink" to="/budgets" replace draggable="false">
      <span class="icon-stack">
        <img
          class="icon-base"
          :class="{ hidden: isActive('/budgets') }"
          :src="wallet"
          alt=""
          aria-hidden="true"
        />
        <img
          class="icon-active"
          :class="{ hidden: !isActive('/budgets') }"
          :src="walletActive"
          alt=""
          aria-hidden="true"
        />
      </span>
      <span class="label" data-text="Budgets">Budgets</span>
    </RouterLink>
  </nav>
</template>

<style scoped>
.tabbar {
  display: flex;
  gap: 24px;
  padding: 12px 20px;
  border-radius: 999px;
  position: fixed;
  bottom: max(0px, calc(env(safe-area-inset-bottom) - 12px));
  left: 50%;
  transform: translateX(-50%);
  background: var(--surface-1);
  backdrop-filter: blur(3px) saturate(180%);
  -webkit-backdrop-filter: blur(3px) saturate(180%);
  border: 1px solid rgba(255, 255, 255, 0.08);
  box-shadow:
    0 8px 32px rgba(0, 0, 0, 0.35),
    inset 0 1px 1px rgba(255, 255, 255, 0.1),
    inset 0 -1px 1px rgba(255, 255, 255, 0.03);
  isolation: isolate;
  /* Suppress the Safari long-press callout / "drag image out as asset" gesture
     on the nav and its icons — this is a control surface, not draggable content. */
  -webkit-touch-callout: none;
  -webkit-user-select: none;
  user-select: none;
  /* Grow from the bottom-centre so the tap swell rises off the screen edge
     rather than clipping below it. The resting translateX(-50%) is preserved
     in every keyframe so the bar stays horizontally centred while it scales. */
  transform-origin: bottom center;
  will-change: transform;
}

/* Finger down: swell up quickly and hold there until the finger lifts. */
.tabbar.pressing {
  animation: press-in 130ms cubic-bezier(0.22, 0.61, 0.7, 1) forwards;
}

/* Finger up: contract past the resting size, overshoot, then settle to rest. */
.tabbar.releasing {
  animation: press-out 360ms linear forwards;
}

@keyframes press-in {
  from {
    transform: translateX(-50%) scale(1);
  }
  to {
    transform: translateX(-50%) scale(1.015);
  }
}

@keyframes press-out {
  0% {
    /* press-in always runs to completion, so the bounce always starts from the
       full expanded size. Ease-in-out into the undershoot for a smooth dip. */
    transform: translateX(-50%) scale(1.01);
    animation-timing-function: cubic-bezier(0.3, 0, 0.5, 1);
  }
  /* First bounce: contract past the resting size... */
  40% {
    transform: translateX(-50%) scale(1);
    animation-timing-function: cubic-bezier(0.42, 0, 0.58, 1);
  }
  /* ...spring back up into a smaller overshoot... */
  70% {
    transform: translateX(-50%) scale(1);
    animation-timing-function: cubic-bezier(0.42, 0, 0.58, 1);
  }
  /* ...then settle to rest. */
  100% {
    transform: translateX(-50%) scale(1);
  }
}

@media (prefers-reduced-motion: reduce) {
  .tabbar.pressing,
  .tabbar.releasing {
    animation: none;
  }
  .tabbar .indicator-pill,
  .tabbar.pressing .indicator-pill,
  .tabbar.releasing .indicator-pill {
    animation: none;
  }
  .tabbar.pressing .indicator-pill::before,
  .tabbar.pressing .indicator-pill::after {
    opacity: 0;
  }
  /* The `.tabbar` prefix bumps specificity above the phase-driven glow rules
     below, which would otherwise win on source order. */
  .tabbar .glow,
  .tabbar.pressing .glow,
  .tabbar.releasing .glow {
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

.tabbar a {
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  text-decoration: none;
  color: #ffffff;
  font-family: ui-rounded, 'SF Pro Rounded', system-ui, sans-serif;
  font-size: 11px;
  font-weight: 400;
  /* Links are draggable by default in Safari — long-press lets you drag the
     link chip around the screen. Suppress that; these are nav controls. */
  -webkit-user-drag: none;
}

.tabbar a.router-link-active .label {
  font-weight: 500;
}

/* Reserve the width of the bold (500) label so switching weight never
   changes the link's box size and shifts the layout. */
.label {
  display: inline-flex;
  flex-direction: column;
  align-items: center;
}

.label::after {
  content: attr(data-text);
  font-weight: 500;
  height: 0;
  overflow: hidden;
  visibility: hidden;
  pointer-events: none;
}

.active-indicator {
  position: absolute;
  top: 0;
  left: 0;
  transition:
    transform 0.5s cubic-bezier(0.34, 1.2, 0.4, 1),
    width 0.5s cubic-bezier(0.34, 1.2, 0.4, 1),
    height 0.5s cubic-bezier(0.34, 1.2, 0.4, 1);
  will-change: transform;
  pointer-events: none;
  z-index: 0;
}

/* The visible pill lives on an inner layer so its press scale composes with the
   outer layer's positioning transform. */
.indicator-pill {
  position: relative;
  width: 100%;
  height: 100%;
  border-radius: 999px;
  background: var(--surface-2);
  box-shadow:
    inset 0 1px 1px rgba(255, 255, 255, 0.1),
    inset 0 -1px 1px rgba(255, 255, 255, 0.03);
  isolation: isolate;
  transform: scale(1);
  transform-origin: center;
  will-change: transform;
}

.indicator-pill::before,
.indicator-pill::after {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: inherit;
  pointer-events: none;
  mix-blend-mode: screen;
  filter: blur(0.4px);
  opacity: 0;
  transition: opacity 200ms ease-out;
}

.pressing .indicator-pill::before,
.pressing .indicator-pill::after {
  opacity: 1;
  transition: opacity 150ms ease-out;
}

.indicator-pill::before {
  border: 1px solid rgba(255, 70, 90, 0.28);
  transform: translate(-0.75px, -0.5px);
}

.indicator-pill::after {
  border: 1px solid rgba(70, 200, 255, 0.28);
  transform: translate(0.75px, 0.5px);
}

.pressing .indicator-pill {
  animation: indicator-press-in 260ms cubic-bezier(0.22, 0.61, 0.7, 1) forwards;
}

.releasing .indicator-pill {
  animation: indicator-press-out 480ms cubic-bezier(0.22, 0.61, 0.7, 1) forwards;
}

@keyframes indicator-press-in {
  from {
    transform: scale(1);
  }
  to {
    transform: scale(1.2, 1.3);
  }
}

@keyframes indicator-press-out {
  0% {
    transform: scale(1.2, 1.3);
    animation-timing-function: cubic-bezier(0.3, 0, 0.5, 1);
  }
  40% {
    transform: scale(0.99);
    animation-timing-function: cubic-bezier(0.42, 0, 0.58, 1);
  }
  70% {
    transform: scale(1);
    animation-timing-function: cubic-bezier(0.42, 0, 0.58, 1);
  }
  100% {
    transform: scale(1);
  }
}

/* Clips the tap glow to the pill shape now that the bar itself no longer hides
   overflow (the indicator must be free to extend past the bar's edges). */
.glow-clip {
  position: absolute;
  inset: 0;
  border-radius: 999px;
  overflow: hidden;
  pointer-events: none;
  z-index: 0;
}

/* The tap glow: a soft radial bloom centred on the finger's touch point. It
   plays in two stages tied to the press phase — light up at the tap point while
   the finger is down, then ripple outward and fade when it lifts. The element is
   re-keyed per tap (see script), so the bloom restarts cleanly each time it
   mounts. */
.glow {
  position: absolute;
  /* Oversize and centre on the tap point so the bloom can radiate past the
     bar edges before being clipped. */
  top: var(--glow-y);
  left: var(--glow-x);
  width: 360%;
  height: 1800%;
  transform: translate(-50%, -50%) scale(0.45);
  border-radius: 50%;
  /* The gradient reaches full transparency well inside the element box (by ~55%)
     so only empty space meets the box edge — this avoids a hard clip line that
     would otherwise read as a visible bloom edge. */
  background: radial-gradient(
    circle,
    rgba(255, 255, 255, 0.4) 0%,
    rgba(255, 255, 255, 0.11) 12%,
    rgba(255, 255, 255, 0.05) 22%,
    rgba(255, 255, 255, 0.02) 32%,
    rgba(255, 255, 255, 0.007) 43%,
    rgba(255, 255, 255, 0) 55%
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

.icon-stack {
  position: relative;
  width: 24px;
  height: 24px;
}

.tabbar img {
  width: 24px;
  height: 24px;
  filter: invert(1);
  /* Block the image-drag / save gesture on the icons themselves. */
  -webkit-user-drag: none;
  pointer-events: none;
}

.icon-stack img {
  position: absolute;
  top: 0;
  left: 0;
  opacity: 1;
  transition: opacity 0.25s ease;
}

.icon-stack img.hidden {
  opacity: 0;
}
</style>
