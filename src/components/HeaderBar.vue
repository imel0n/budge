<script setup>
import HeaderButton from './HeaderButton.vue'
import HeaderButtonGroup from './HeaderButtonGroup.vue'

// A button descriptor looks like: { id: 'save', label: 'Save', icon?: '<svg…>' }
// When `icon` (raw SVG markup) is present it's shown instead of the text, and
// `label` becomes the button's accessible name. `id` is sent back to the parent
// on click so it knows which button fired.
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
  // Placement variant. `fixed` (default) pins the bar to the top of the viewport
  // over the page body, honouring the status-bar safe-area inset and painting a
  // black falloff. `static` drops it into normal flow with no top inset and a
  // panel-grey falloff — used inside the modal sheet, where it sits at the top
  // of the panel and content scrolls under it.
  variant: {
    type: String,
    default: 'fixed',
    validator: (v) => ['fixed', 'static'].includes(v),
  },
})

// Fires when any button is clicked, telling the parent which side and which id.
const emit = defineEmits(['button-click'])

function onButtonClick(side, id) {
  emit('button-click', { side, id })
}
</script>

<template>
  <header :class="variant">
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
            :icon="leftButtons[0].icon"
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
            :icon="rightButtons[0].icon"
            @click="onButtonClick('right', rightButtons[0].id)"
          />
        </div>
      </div>
    </Transition>
  </header>
</template>

<style scoped>
/* Shared header shell. The two variants differ only in how the bar is placed
   and painted; everything below is common to both. */
header {
  /* Top inset the content clears. The `fixed` variant sits under the status bar
     / dynamic island so it honours the safe-area inset; the `static` variant
     has no status bar above it and zeroes this out (see header.static). */
  --safe-top: env(safe-area-inset-top);
  /* A small chin below the content so the gradient fade has room to breathe. */
  --chin: 8px;
  /* Vertical center of the page title — matches .title's `top`. The gradient
     is fully opaque from the top down to this line, then fades to nothing.
     The buttons center within the content box (between the top inset and the
     chin), so offset by half of (inset − chin) to line the title up with them. */
  --title-mid: calc(50% + (var(--safe-top) + 0.125rem - var(--chin)) / 2);
  /* Keep header content clear of the status bar / dynamic island. */
  padding-top: calc(var(--safe-top) + 0.125rem);
  padding-bottom: var(--chin);
  /* Inset content off the edges while the bar itself stays full-bleed. In
     landscape, honour the notch inset if it's larger than the gutter. */
  padding-left: max(var(--app-gutter), env(safe-area-inset-left));
  padding-right: max(var(--app-gutter), env(safe-area-inset-right));
}

/* Default placement: pinned to the top of the viewport so the page body scrolls
   under it, painting a black falloff over the black page. */
header.fixed {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 100;
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
}

/* Modal placement: sits in normal flow at the top of the (non-scrolling) modal
   panel; the sheet's scroll container slides its content under it. No status
   bar above the sheet, so no top inset. */
header.static {
  /* Stands in for the sheet's top spacing. Keeping this space in the header
     (rather than the panel's padding-top) lets the header background reach the
     very top of the panel instead of leaving a strip above it. */
  --safe-top: 18px;
  position: relative;
  z-index: 1;
  /* The panel's own gutter, no longer supplied by the panel itself (which
     would also inset the header's full-bleed background) — added here so it
     only narrows the button/title content. */
  padding-left: calc(max(var(--app-gutter), env(safe-area-inset-left)) + 8px);
  padding-right: calc(max(var(--app-gutter), env(safe-area-inset-right)) + 8px);
  /* Solid panel-grey down to the title midpoint, then 32 smoothstep-eased steps
     fading to transparent so content scrolls out under a soft falloff. */
  background: linear-gradient(
    to bottom,
    #1c1c1c 0%,
    #1c1c1c var(--title-mid),
    rgba(28, 28, 28, 0.9973) calc(var(--title-mid) * 0.9697 + 100% * 0.0303),
    rgba(28, 28, 28, 0.9894) calc(var(--title-mid) * 0.9394 + 100% * 0.0606),
    rgba(28, 28, 28, 0.9767) calc(var(--title-mid) * 0.9091 + 100% * 0.0909),
    rgba(28, 28, 28, 0.9595) calc(var(--title-mid) * 0.8788 + 100% * 0.1212),
    rgba(28, 28, 28, 0.9381) calc(var(--title-mid) * 0.8485 + 100% * 0.1515),
    rgba(28, 28, 28, 0.9128) calc(var(--title-mid) * 0.8182 + 100% * 0.1818),
    rgba(28, 28, 28, 0.8841) calc(var(--title-mid) * 0.7879 + 100% * 0.2121),
    rgba(28, 28, 28, 0.8522) calc(var(--title-mid) * 0.7576 + 100% * 0.2424),
    rgba(28, 28, 28, 0.8174) calc(var(--title-mid) * 0.7273 + 100% * 0.2727),
    rgba(28, 28, 28, 0.7802) calc(var(--title-mid) * 0.697 + 100% * 0.303),
    rgba(28, 28, 28, 0.7407) calc(var(--title-mid) * 0.6667 + 100% * 0.3333),
    rgba(28, 28, 28, 0.6994) calc(var(--title-mid) * 0.6364 + 100% * 0.3636),
    rgba(28, 28, 28, 0.6567) calc(var(--title-mid) * 0.6061 + 100% * 0.3939),
    rgba(28, 28, 28, 0.6128) calc(var(--title-mid) * 0.5758 + 100% * 0.4242),
    rgba(28, 28, 28, 0.568) calc(var(--title-mid) * 0.5455 + 100% * 0.4545),
    rgba(28, 28, 28, 0.5227) calc(var(--title-mid) * 0.5152 + 100% * 0.4848),
    rgba(28, 28, 28, 0.4773) calc(var(--title-mid) * 0.4848 + 100% * 0.5152),
    rgba(28, 28, 28, 0.432) calc(var(--title-mid) * 0.4545 + 100% * 0.5455),
    rgba(28, 28, 28, 0.3872) calc(var(--title-mid) * 0.4242 + 100% * 0.5758),
    rgba(28, 28, 28, 0.3432) calc(var(--title-mid) * 0.3939 + 100% * 0.6061),
    rgba(28, 28, 28, 0.3005) calc(var(--title-mid) * 0.3636 + 100% * 0.6364),
    rgba(28, 28, 28, 0.2593) calc(var(--title-mid) * 0.3333 + 100% * 0.6667),
    rgba(28, 28, 28, 0.2198) calc(var(--title-mid) * 0.303 + 100% * 0.697),
    rgba(28, 28, 28, 0.1826) calc(var(--title-mid) * 0.2727 + 100% * 0.7273),
    rgba(28, 28, 28, 0.1478) calc(var(--title-mid) * 0.2424 + 100% * 0.7576),
    rgba(28, 28, 28, 0.1159) calc(var(--title-mid) * 0.2121 + 100% * 0.7879),
    rgba(28, 28, 28, 0.0872) calc(var(--title-mid) * 0.1818 + 100% * 0.8182),
    rgba(28, 28, 28, 0.0619) calc(var(--title-mid) * 0.1515 + 100% * 0.8485),
    rgba(28, 28, 28, 0.0405) calc(var(--title-mid) * 0.1212 + 100% * 0.8788),
    rgba(28, 28, 28, 0.0233) calc(var(--title-mid) * 0.0909 + 100% * 0.9091),
    rgba(28, 28, 28, 0.0106) calc(var(--title-mid) * 0.0606 + 100% * 0.9394),
    rgba(28, 28, 28, 0.0027) calc(var(--title-mid) * 0.0303 + 100% * 0.9697),
    rgba(28, 28, 28, 0) 100%
  );
}

/* The keyed wrapper that cross-fades on navigation. It carries the flex layout
   so the header shell (gradient + padding) stays put while its content swaps. */
.header-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  /* Keep the bar's height consistent even when a page has no left/right
     buttons — matches HeaderButton's min-height so it doesn't collapse. */
  min-height: 2.5rem;
}

.left-area,
.right-area {
  display: flex;
}

/* Cross-fade the header content when the route (and thus the key) changes. With
   `mode="out-in"` the outgoing content fades fully out before the new content
   fades in, so the two never overlap and the layout stays simple. */
.header-fade-enter-active {
  transition: opacity 0.3s ease;
}

.header-fade-enter-from {
  opacity: 0.8;
}

/* Scale the button groups on each side rather than the whole content, so each
   group shrinks/expands around its own centre instead of drifting toward the
   middle of the bar. */
.header-fade-enter-active .left-area,
.header-fade-enter-active .right-area,
.header-fade-leave-active .left-area,
.header-fade-leave-active .right-area {
  transition: transform 0.3s ease;
}

.header-fade-enter-from .left-area,
.header-fade-enter-from .right-area,
.header-fade-leave-to .left-area,
.header-fade-leave-to .right-area {
  transform: scale(0.95);
}

.title {
  position: absolute;
  left: 50%;
  /* Matches the gradient's opaque midpoint. Offset by half the top inset so the
     title stays centered with the buttons, which sit below the inset in normal
     flow. Follows --safe-top, so it re-centers correctly in the static variant. */
  top: var(--title-mid);
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
