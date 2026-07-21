// Belt-and-suspenders gesture disabling for iOS Safari, which ignores
// `user-scalable=no` and doesn't always honor `touch-action: manipulation`
// for its document-level double-tap gesture. The CSS in app.css handles the
// tap-flash, long-press callout, and selection; this handles the gestures.

// Cancel the second tap of a double-tap (which iOS turns into zoom, or — when
// zoom is capped — a scroll-to-block jump). The first tap still fires its click.
let lastTouchEnd = 0
document.addEventListener(
  'touchend',
  (event) => {
    const now = Date.now()
    if (now - lastTouchEnd <= 300) {
      event.preventDefault()
    }
    lastTouchEnd = now
  },
  { passive: false },
)

// Cancel pinch-zoom gestures (Safari-specific events).
for (const type of ['gesturestart', 'gesturechange', 'gestureend']) {
  document.addEventListener(type, (event) => event.preventDefault(), { passive: false })
}
