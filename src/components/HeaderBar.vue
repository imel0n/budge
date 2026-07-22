<script setup>
import HeaderButton from './HeaderButton.vue'
import HeaderButtonGroup from './HeaderButtonGroup.vue'

// A button descriptor looks like: { id: 'save', label: 'Save' }
// `id` is sent back to the parent on click so it knows which button fired.
defineProps({
  title: {
    type: String,
    default: '',
  },
  leftButtons: {
    type: Array,
    default: () => [],
    // 0, 1, or 2 buttons allowed — no more.
    validator: (buttons) => buttons.length <= 2,
  },
  rightButtons: {
    type: Array,
    default: () => [],
    validator: (buttons) => buttons.length <= 2,
  },
  // The title is hidden until the page's <h1> scrolls behind the header, at
  // which point it fades in.
  titleVisible: {
    type: Boolean,
    default: false,
  },
  // Changes whenever the page changes (the layout passes the route path). When
  // it changes, the header content cross-fades out and the new page's content
  // fades in.
  transitionKey: {
    type: [String, Number],
    default: '',
  },
})

// Fires when any button is clicked, telling the parent which side and which id.
const emit = defineEmits(['button-click'])

function onButtonClick(side, id) {
  emit('button-click', { side, id })
}
</script>

<template>
  <header>
    <!-- Keyed on the route so the whole header (title + buttons) cross-fades
         out and back in when the page changes. -->
    <Transition name="header-fade" mode="out-in">
      <div class="header-content" :key="transitionKey">
        <div class="left-area">
          <HeaderButtonGroup
            v-if="leftButtons.length === 2"
            :buttons="leftButtons"
            @button-click="onButtonClick('left', $event)"
          />
          <HeaderButton
            v-else-if="leftButtons.length === 1"
            :label="leftButtons[0].label"
            @click="onButtonClick('left', leftButtons[0].id)"
          />
        </div>

        <h3 class="title" :class="{ visible: titleVisible }">{{ title }}</h3>

        <div class="right-area">
          <HeaderButtonGroup
            v-if="rightButtons.length === 2"
            :buttons="rightButtons"
            @button-click="onButtonClick('right', $event)"
          />
          <HeaderButton
            v-else-if="rightButtons.length === 1"
            :label="rightButtons[0].label"
            @click="onButtonClick('right', rightButtons[0].id)"
          />
        </div>
      </div>
    </Transition>
  </header>
</template>

<style scoped>
header {
  /* Pinned to the top so it stays put while the page body scrolls under it. */
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 100;
  /* Vertical center of the page title — matches .title's `top`. The gradient
     is fully opaque from the top down to this line, then fades to nothing. */
  --title-mid: calc(50% + (env(safe-area-inset-top) + 0.125rem) / 2);
  /* Solid black down to the title midpoint, then 36 smoothstep-eased steps
     fading to 0 opacity at the bottom edge for a soft iOS-style falloff. */
  background: linear-gradient(
    to bottom,
    #000 0%,
    #000 var(--title-mid),
    rgba(0, 0, 0, 0.9978) calc(var(--title-mid) * 0.973 + 100% * 0.027),
    rgba(0, 0, 0, 0.9916) calc(var(--title-mid) * 0.9459 + 100% * 0.0541),
    rgba(0, 0, 0, 0.9813) calc(var(--title-mid) * 0.9189 + 100% * 0.0811),
    rgba(0, 0, 0, 0.9675) calc(var(--title-mid) * 0.8919 + 100% * 0.1081),
    rgba(0, 0, 0, 0.9502) calc(var(--title-mid) * 0.8649 + 100% * 0.1351),
    rgba(0, 0, 0, 0.9296) calc(var(--title-mid) * 0.8378 + 100% * 0.1622),
    rgba(0, 0, 0, 0.9062) calc(var(--title-mid) * 0.8108 + 100% * 0.1892),
    rgba(0, 0, 0, 0.88) calc(var(--title-mid) * 0.7838 + 100% * 0.2162),
    rgba(0, 0, 0, 0.8513) calc(var(--title-mid) * 0.7568 + 100% * 0.2432),
    rgba(0, 0, 0, 0.8203) calc(var(--title-mid) * 0.7297 + 100% * 0.2703),
    rgba(0, 0, 0, 0.7874) calc(var(--title-mid) * 0.7027 + 100% * 0.2973),
    rgba(0, 0, 0, 0.7527) calc(var(--title-mid) * 0.6757 + 100% * 0.3243),
    rgba(0, 0, 0, 0.7164) calc(var(--title-mid) * 0.6486 + 100% * 0.3514),
    rgba(0, 0, 0, 0.6788) calc(var(--title-mid) * 0.6216 + 100% * 0.3784),
    rgba(0, 0, 0, 0.6402) calc(var(--title-mid) * 0.5946 + 100% * 0.4054),
    rgba(0, 0, 0, 0.6007) calc(var(--title-mid) * 0.5676 + 100% * 0.4324),
    rgba(0, 0, 0, 0.5607) calc(var(--title-mid) * 0.5405 + 100% * 0.4595),
    rgba(0, 0, 0, 0.5203) calc(var(--title-mid) * 0.5135 + 100% * 0.4865),
    rgba(0, 0, 0, 0.4797) calc(var(--title-mid) * 0.4865 + 100% * 0.5135),
    rgba(0, 0, 0, 0.4393) calc(var(--title-mid) * 0.4595 + 100% * 0.5405),
    rgba(0, 0, 0, 0.3993) calc(var(--title-mid) * 0.4324 + 100% * 0.5676),
    rgba(0, 0, 0, 0.3598) calc(var(--title-mid) * 0.4054 + 100% * 0.5946),
    rgba(0, 0, 0, 0.3212) calc(var(--title-mid) * 0.3784 + 100% * 0.6216),
    rgba(0, 0, 0, 0.2836) calc(var(--title-mid) * 0.3514 + 100% * 0.6486),
    rgba(0, 0, 0, 0.2473) calc(var(--title-mid) * 0.3243 + 100% * 0.6757),
    rgba(0, 0, 0, 0.2126) calc(var(--title-mid) * 0.2973 + 100% * 0.7027),
    rgba(0, 0, 0, 0.1797) calc(var(--title-mid) * 0.2703 + 100% * 0.7297),
    rgba(0, 0, 0, 0.1487) calc(var(--title-mid) * 0.2432 + 100% * 0.7568),
    rgba(0, 0, 0, 0.12) calc(var(--title-mid) * 0.2162 + 100% * 0.7838),
    rgba(0, 0, 0, 0.0938) calc(var(--title-mid) * 0.1892 + 100% * 0.8108),
    rgba(0, 0, 0, 0.0704) calc(var(--title-mid) * 0.1622 + 100% * 0.8378),
    rgba(0, 0, 0, 0.0498) calc(var(--title-mid) * 0.1351 + 100% * 0.8649),
    rgba(0, 0, 0, 0.0325) calc(var(--title-mid) * 0.1081 + 100% * 0.8919),
    rgba(0, 0, 0, 0.0187) calc(var(--title-mid) * 0.0811 + 100% * 0.9189),
    rgba(0, 0, 0, 0.0084) calc(var(--title-mid) * 0.0541 + 100% * 0.9459),
    rgba(0, 0, 0, 0.0022) calc(var(--title-mid) * 0.027 + 100% * 0.973),
    rgba(0, 0, 0, 0) 100%
  );
  /* Keep header content clear of the status bar / dynamic island. */
  padding-top: calc(env(safe-area-inset-top) + 0.125rem);
  /* A small chin below the content so the gradient fade has room to breathe. */
  padding-bottom: 8px;
  /* Inset content off the edges while the bar itself stays full-bleed. In
     landscape, honour the notch inset if it's larger than the gutter. */
  padding-left: max(var(--app-gutter), env(safe-area-inset-left));
  padding-right: max(var(--app-gutter), env(safe-area-inset-right));
}

/* The keyed wrapper that cross-fades on navigation. It carries the flex layout
   so the header shell (gradient + padding) stays put while its content swaps. */
.header-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
}

.left-area,
.right-area {
  display: flex;
}

/* Cross-fade the header content when the route (and thus the key) changes. With
   `mode="out-in"` the outgoing content fades fully out before the new content
   fades in, so the two never overlap and the layout stays simple. */
.header-fade-enter-active {
  transition: opacity 0.13s ease;
}

.header-fade-enter-from {
  opacity: 0.5;
}

/* Scale the button groups on each side rather than the whole content, so each
   group shrinks/expands around its own centre instead of drifting toward the
   middle of the bar. */
.header-fade-enter-active .left-area,
.header-fade-enter-active .right-area,
.header-fade-leave-active .left-area,
.header-fade-leave-active .right-area {
  transition: transform 0.18s ease;
}

.header-fade-enter-from .left-area,
.header-fade-enter-from .right-area,
.header-fade-leave-to .left-area,
.header-fade-leave-to .right-area {
  transform: scale(0.9);
}

.title {
  position: absolute;
  left: 50%;
  /* Offset by half the safe-area inset so the title stays centered with the
     buttons, which sit below the inset in normal flow. */
  top: calc(50% + (env(safe-area-inset-top) + 0.125rem) / 2);
  margin: 0;
  font-size: 1.0625rem;
  font-weight: 600;
  line-height: 1.2;
  text-align: center;
  color: #ffffff;
  /* Hidden until the Page Title scrolls behind the header, then it fades in
     while rising into place from just below. Kept non-interactive while
     hidden. */
  opacity: 0;
  pointer-events: none;
  transform: translate(-50%, calc(-50% + 0.75rem));
  filter: blur(4px);
  transition:
    opacity 0.3s ease-out,
    transform 0.3s ease-out,
    filter 0.3s ease-out;
}

.title.visible {
  opacity: 1;
  transform: translate(-50%, -50%);
  filter: blur(0);
}
</style>
