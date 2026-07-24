import { inject, onBeforeUnmount, onMounted, ref } from 'vue'

// Sets the page's title and drives the iOS-style large-title collapse:
// the page's <h1> (the "Page Title") starts in normal flow with the HeaderBar's
// title hidden. Once the <h1> scrolls up behind the fixed HeaderBar, the
// HeaderBar's title fades in.
//
// We measure the <h1>'s live position against the header on every scroll rather
// than using an IntersectionObserver, because IO callbacks are async/debounced
// and miss iOS rubber-banding: on a page too short to scroll, an overscroll
// bounce still tucks the <h1> behind the header and snaps back within a few
// frames. iOS fires `scroll` events throughout that bounce and
// getBoundingClientRect() reflects the bounced position, so this catches it.
//
// Usage:
//   const { titleRef, collapsed } = usePageTitle('Transactions')
//   <h1 ref="titleRef" :class="{ collapsed }">Transactions</h1>
export function usePageTitle(title) {
  const setPageTitle = inject('setPageTitle')
  const setHeaderTitleVisible = inject('setHeaderTitleVisible')

  setPageTitle(title)
  // Start hidden — the Page Title is in view, so the HeaderBar title stays out.
  setHeaderTitleVisible(false)

  // Attach this to the page's <h1>.
  const titleRef = ref(null)
  // Reactive mirror of the collapse state, for the page to fade its own <h1>.
  const collapsed = ref(false)

  // Coalesce bursts of scroll events into one measurement per frame.
  let frame = 0

  function measure() {
    frame = 0
    const el = titleRef.value
    if (!el) return

    // The fixed header sits flush against the viewport top, so its rendered
    // height is exactly the strip the Page Title disappears behind.
    const header = document.querySelector('header')
    const headerHeight = header ? header.getBoundingClientRect().height : 0

    // Trigger once the <h1>'s vertical center passes behind the header's bottom
    // edge — a lower threshold than waiting for the whole title to disappear,
    // so the swap happens with less scrolling.
    const { top, bottom } = el.getBoundingClientRect()
    const isCollapsed = (top + bottom) / 2 <= headerHeight
    collapsed.value = isCollapsed
    setHeaderTitleVisible(isCollapsed)
  }

  function onScroll() {
    if (frame) return
    frame = requestAnimationFrame(measure)
  }

  onMounted(() => {
    // Passive listeners: we never preventDefault, so let the browser scroll
    // without waiting on us. `scroll` fires during iOS rubber-banding too.
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll, { passive: true })
    // Establish the initial state once layout has settled.
    measure()
  })

  onBeforeUnmount(() => {
    window.removeEventListener('scroll', onScroll)
    window.removeEventListener('resize', onScroll)
    if (frame) cancelAnimationFrame(frame)
    // The next page's title state is reset by the layout on navigation, so
    // there's nothing to clean up here.
  })

  return { titleRef, collapsed }
}
