/* Smooth, weighted scrolling (Lenis), with a gentle pull onto the two full-screen animations. */
(function () {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches || typeof Lenis === 'undefined') {
    document.documentElement.classList.add('native-snap');                // people who asked for less motion keep normal scrolling
    return;
  }
  const lenis = new Lenis({
    lerp: 0.085,              // how far the page glides after each wheel tick: lower is silkier
    wheelMultiplier: 0.95,
    smoothWheel: true,
    syncTouch: false,         // phones keep their own native momentum, which already feels right
    anchors: { offset: 0, duration: 1.4 }
  });
  window.lenis = lenis;
  (function raf(t) { lenis.raf(t); requestAnimationFrame(raf); })(performance.now());

  // the two animations: when scrolling settles near one, ease it into place so it fills the screen
  const scenes = [...document.querySelectorAll('.scene')];
  if (!scenes.length) return;
  let snapping = false, still = 0, lastY = -1, done = -1;
  const settle = () => {
    const y = lenis.scroll, vh = innerHeight;
    for (const s of scenes) {
      const top = s.getBoundingClientRect().top + y, d = top - y;
      if (Math.abs(d) > 2 && Math.abs(d) < vh * 0.32) {
        snapping = true;
        lenis.scrollTo(top, { duration: 0.9, easing: u => 1 - Math.pow(1 - u, 3), onComplete: () => { snapping = false; done = top; } });
        setTimeout(() => { snapping = false; }, 1300);
        return;
      }
    }
  };
  // check each frame: once the page has stopped moving for a short moment, decide whether to settle onto a scene
  (function watch(t) {
    const y = lenis.scroll;
    if (Math.abs(y - lastY) > 0.5 || lenis.isScrolling) { still = t; lastY = y; }
    else if (!snapping && still && t - still > 140) { still = 0; if (Math.abs(y - done) > 2) settle(); }
    requestAnimationFrame(watch);
  })(performance.now());
})();
