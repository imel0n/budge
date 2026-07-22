<script setup>
import { ref, onMounted, nextTick, watch } from 'vue'
import { useRoute } from 'vue-router'

import creditCard from '../assets/icons/credit-card.png'
import creditCardActive from '../assets/icons/credit-card-active.png'
import bank from '../assets/icons/bank.png'
import bankActive from '../assets/icons/bank-active.png'

const route = useRoute()

const transactionsLink = ref(null)
const accountsLink = ref(null)
const indicatorStyle = ref({})

function isActive(path) {
  return route.path === path
}

// Size and slide the active indicator to sit behind the active link: pad it out
// past the link box (+32px wide, +8px tall) and offset it back by the same half
// so the pill is centred on the link. The spring transition on the indicator does
// the rest as `route.path` changes.
function updateIndicator() {
  const activeLink = isActive('/transactions') ? transactionsLink.value : accountsLink.value
  const el = activeLink?.$el
  if (!el) return
  indicatorStyle.value = {
    width: `${el.offsetWidth + 32}px`,
    height: `${el.offsetHeight + 8}px`,
    transform: `translate(${el.offsetLeft - 16}px, ${el.offsetTop - 4}px)`,
  }
}

onMounted(() => nextTick(updateIndicator))
watch(
  () => route.path,
  () => nextTick(updateIndicator),
)
</script>

<template>
  <nav class="tabbar">
    <div class="active-indicator" :style="indicatorStyle"></div>
    <RouterLink ref="transactionsLink" to="/transactions" replace>
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
    <RouterLink ref="accountsLink" to="/accounts" replace>
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
  </nav>
</template>

<style scoped>
.tabbar {
  display: flex;
  gap: 24px;
  padding: 8px 20px;
  border-radius: 999px;
  position: fixed;
  bottom: env(safe-area-inset-bottom);
  left: 50%;
  transform: translateX(-50%);
  background: var(--surface-1);
  backdrop-filter: blur(3px) saturate(180%);
  -webkit-backdrop-filter: blur(3px) saturate(180%);
  box-shadow:
    0 8px 32px rgba(0, 0, 0, 0.35),
    inset 0 1px 1px rgba(255, 255, 255, 0.25),
    inset 0 -1px 1px rgba(255, 255, 255, 0.08);
  isolation: isolate;
}

.tabbar::before {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: inherit;
  padding: 1px;
  background: conic-gradient(
    from 135deg,
    rgba(180, 180, 180, 0.25) 0deg,
    rgba(120, 120, 120, 0.05) 60deg,
    rgba(160, 160, 160, 0.15) 140deg,
    rgba(100, 100, 100, 0.03) 220deg,
    rgba(170, 170, 170, 0.2) 300deg,
    rgba(180, 180, 180, 0.25) 360deg
  );
  -webkit-mask:
    linear-gradient(#000 0 0) content-box,
    linear-gradient(#000 0 0);
  mask:
    linear-gradient(#000 0 0) content-box,
    linear-gradient(#000 0 0);
  -webkit-mask-composite: xor;
  mask-composite: exclude;
  pointer-events: none;
  z-index: -1;
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
  font-size: 11px;
  font-weight: 400;
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
  border-radius: 999px;
  background: var(--surface-2);
  box-shadow:
    inset 0 1px 1px rgba(255, 255, 255, 0.25),
    inset 0 -1px 1px rgba(255, 255, 255, 0.08);
  isolation: isolate;
  transition:
    transform 0.4s cubic-bezier(0.34, 1.2, 0.4, 1),
    width 0.4s cubic-bezier(0.34, 1.2, 0.4, 1),
    height 0.4s cubic-bezier(0.34, 1.2, 0.4, 1);
  will-change: transform;
  pointer-events: none;
  z-index: 0;
}

.active-indicator::before {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: inherit;
  padding: 1px;
  background: conic-gradient(
    from 135deg,
    rgba(180, 180, 180, 0.25) 0deg,
    rgba(120, 120, 120, 0.05) 60deg,
    rgba(160, 160, 160, 0.15) 140deg,
    rgba(100, 100, 100, 0.03) 220deg,
    rgba(170, 170, 170, 0.2) 300deg,
    rgba(180, 180, 180, 0.25) 360deg
  );
  -webkit-mask:
    linear-gradient(#000 0 0) content-box,
    linear-gradient(#000 0 0);
  mask:
    linear-gradient(#000 0 0) content-box,
    linear-gradient(#000 0 0);
  -webkit-mask-composite: xor;
  mask-composite: exclude;
  pointer-events: none;
  z-index: -1;
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
