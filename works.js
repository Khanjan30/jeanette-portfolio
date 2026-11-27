/* The work, laid out like a profile page: one square per piece. Hover shows the title and year, and moving across a square flips its photos.
   Clicking opens the piece like a post: swipe or arrow through its photos, step to the next piece, and go back to the grid with
   the Back button, Escape, a click outside, or the browser's back arrow. */
(function () {
  // Captions are plain descriptions until Jeanette sends her own lines. Sizes and most materials are still to come.
  const WORKS = [
    { slug: 'the-feeling-of-falling', title: 'The Feeling of Falling', year: 2022, n: 6, line: 'A figure in free fall, held in mid-air.' },
    { slug: 'where-i-once-stood', title: 'Where I Once Stood', year: 2026, n: 4, line: 'Three white stingrays swim up out of the painting.' },
    { slug: 'what-remains-of-gravity', title: 'What Remains of Gravity', year: 2026, n: 6, line: 'Feet land in a splash as paper stingrays rise away.' },
    { slug: 'the-space-between', title: 'The Space Between', year: 2026, n: 3, line: 'Fragments hanging, halfway through scattering.' },
    { slug: 'an-instant-without-end', title: 'An Instant Without End', year: 2026, n: 2, line: 'Rings of light and shadow, held in place.' },
    { slug: 'a-moment-held-open', title: 'A Moment Held Open', year: 2026, n: 2, line: 'A splash, frozen the instant it lands.' },
    { slug: 'against-the-current', title: 'Against the Current', year: 2026, n: 3, line: 'A face pushing up through the wave.' },
    { slug: 'i-decide', title: 'I Decide', year: 2022, n: 2, materials: 'Aluminum', line: 'A figure rising out of the metal.' },
    { slug: 'where-i-begin', title: 'Where I Begin', year: 2026, n: 4, line: 'A splash that opens into sky.' },
    { slug: 'break-the-cycle', title: 'Break the Cycle', year: 2026, n: 3, materials: 'Paper, plant fiber, vinyl, cardboard', line: 'A wave closes into a circle. The stingrays break through.' }
  ];
  const src = (w, i, thumb) => `art/work/${w.slug}-${i}${thumb ? '-t' : ''}.webp`;
  const grid = document.getElementById('workGrid'); if (!grid) return;
  const hoverable = matchMedia('(hover:hover)').matches;
  const MULTI = '<svg class="wk-multi" viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M7 3h11a3 3 0 0 1 3 3v11a1 1 0 0 1-1 1h-1V6a1 1 0 0 0-1-1H6V4a1 1 0 0 1 1-1z"/><rect x="3" y="7" width="14" height="14" rx="2.5" fill="currentColor"/></svg>';
  const $n = id => document.getElementById(id);
  if ($n('igWorks')) $n('igWorks').textContent = WORKS.length;
  if ($n('igPhotos')) $n('igPhotos').textContent = WORKS.reduce((a, w) => a + w.n, 0);

  grid.innerHTML = WORKS.map((w, i) => `
    <li class="wk" data-i="${i}">
      <button type="button" class="wk-tile" data-cursor="Open" aria-label="${w.title}, ${w.year}. Open">
        ${Array.from({ length: w.n }, (_, k) => `<img src="${src(w, k, true)}" alt="" loading="lazy" decoding="async" class="${k ? '' : 'on'}">`).join('')}
        ${w.n > 1 ? MULTI + `<span class="wk-dots" aria-hidden="true">${Array.from({ length: w.n }, (_, k) => `<i class="${k ? '' : 'on'}"></i>`).join('')}</span>` : ''}
        <span class="wk-info"><span class="wk-t">${w.title}</span><span class="wk-y">${w.year}</span><span class="wk-more">View</span></span>
      </button>
    </li>`).join('');

  // moving across a square flips through its photos: left edge shows the first, right edge the last
  grid.querySelectorAll('.wk').forEach(li => {
    const w = WORKS[+li.dataset.i], tile = li.querySelector('.wk-tile'), imgs = [...tile.querySelectorAll('img')], dots = [...tile.querySelectorAll('.wk-dots i')];
    let cur = 0;
    const show = k => { if (k === cur) return; imgs[cur].classList.remove('on'); dots[cur] && dots[cur].classList.remove('on'); cur = k; imgs[k].classList.add('on'); dots[k] && dots[k].classList.add('on'); };
    if (hoverable && w.n > 1) {
      tile.addEventListener('pointermove', e => { const r = tile.getBoundingClientRect(); show(Math.min(w.n - 1, Math.floor((e.clientX - r.left) / r.width * w.n))); });
      tile.addEventListener('pointerleave', () => show(0));
    }
    tile.addEventListener('click', () => open(+li.dataset.i));
  });

  // ---------- a piece, opened like a post ----------
  const pn = document.getElementById('panel'), body = document.getElementById('panelBody');
  let curI = -1, k = 0, lastFocus = null, viaHistory = false;
  const lock = on => { document.documentElement.classList.toggle('pn-locked', on); if (window.lenis) on ? window.lenis.stop() : window.lenis.start(); };
  function go(j) {
    const w = WORKS[curI]; k = Math.max(0, Math.min(w.n - 1, j));
    body.querySelector('.pn-track').style.transform = `translateX(${-k * 100}%)`;
    body.querySelectorAll('.pn-dots i').forEach((d, x) => d.classList.toggle('on', x === k));
    const l = body.querySelector('.pn-step.l'), r = body.querySelector('.pn-step.r');
    if (l) { l.disabled = k === 0; r.disabled = k === w.n - 1; }
    body.querySelectorAll('.pn-track img').forEach((im, x) => { if (Math.abs(x - k) <= 1 && !im.src) im.src = im.dataset.src; });
  }
  function fill(i) {
    const w = WORKS[i]; curI = i; k = 0;
    body.innerHTML = `
      <figure class="pn-main">
        <div class="pn-track">${Array.from({ length: w.n }, (_, x) => `<img ${x < 2 ? 'src' : 'data-src'}="${src(w, x)}" data-src="${src(w, x)}" alt="${w.title} by Jeanette Janvier, photo ${x + 1} of ${w.n}" draggable="false">`).join('')}</div>
        ${w.n > 1 ? `<button type="button" class="pn-step l" aria-label="Previous photo">‹</button><button type="button" class="pn-step r" aria-label="Next photo">›</button>
        <span class="pn-dots" aria-hidden="true">${Array.from({ length: w.n }, () => '<i></i>').join('')}</span>` : ''}
      </figure>
      <div class="pn-side">
        <div class="pn-who"><img src="art/work/break-the-cycle-1-t.webp" alt="">Jeanette Janvier</div>
        <div class="pn-text">
          <h3>${w.title}</h3>
          <p class="pn-meta">${w.year}${w.materials ? ' · ' + w.materials : ''}</p>
          <p class="pn-line">${w.line}</p>
        </div>
        <div class="pn-foot"><span>${w.n} photo${w.n > 1 ? 's' : ''}</span><span>${String(i + 1).padStart(2, '0')} / ${WORKS.length}</span></div>
      </div>`;
    const l = body.querySelector('.pn-step.l');
    if (l) { l.addEventListener('click', () => go(k - 1)); body.querySelector('.pn-step.r').addEventListener('click', () => go(k + 1)); }
    // swipe on touch screens
    const main = body.querySelector('.pn-main'), track = body.querySelector('.pn-track');
    let x0 = null, dx = 0;
    main.addEventListener('pointerdown', e => { if (e.pointerType === 'mouse' || w.n < 2) return; x0 = e.clientX; dx = 0; track.style.transition = 'none'; });
    main.addEventListener('pointermove', e => { if (x0 == null) return; dx = e.clientX - x0; track.style.transform = `translateX(calc(${-k * 100}% + ${dx}px))`; });
    const end = () => { if (x0 == null) return; x0 = null; track.style.transition = ''; const wd = main.clientWidth; go(Math.abs(dx) > wd * .18 ? k + (dx < 0 ? 1 : -1) : k); };
    main.addEventListener('pointerup', end); main.addEventListener('pointercancel', end);
    go(0);
  }
  function step(d) { const i = (curI + d + WORKS.length) % WORKS.length; fill(i); history.replaceState(history.state, '', '#work/' + WORKS[i].slug); }
  function open(i, fromHash) {
    lastFocus = document.activeElement; fill(i);
    pn.hidden = false; requestAnimationFrame(() => pn.classList.add('open')); lock(true);
    if (!fromHash) { history.pushState({ panel: WORKS[i].slug }, '', '#work/' + WORKS[i].slug); viaHistory = true; }
    pn.querySelector('.pn-x').focus({ preventScroll: true });
  }
  function hide() {
    if (!pn.classList.contains('open')) return;
    pn.classList.remove('open'); setTimeout(() => { if (!pn.classList.contains('open')) { pn.hidden = true; body.innerHTML = ''; } }, 300);
    lock(false); curI = -1;
    if (lastFocus && document.contains(lastFocus)) lastFocus.focus({ preventScroll: true });
  }
  // every way back goes through the browser history, so the back arrow and the Back button behave the same
  function close() { if (viaHistory && history.state && history.state.panel) history.back(); else { hide(); history.replaceState(null, '', '#work'); } }
  addEventListener('popstate', () => { viaHistory = false; const m = location.hash.match(/^#work\/([\w-]+)/); if (m) { const i = WORKS.findIndex(w => w.slug === m[1]); if (i >= 0) { fill(i); return; } } hide(); });
  pn.querySelector('.pn-x').addEventListener('click', close);
  pn.querySelector('.pn-nav.prev').addEventListener('click', () => step(-1));
  pn.querySelector('.pn-nav.next').addEventListener('click', () => step(1));
  pn.addEventListener('click', e => { if (e.target === pn) close(); });
  addEventListener('keydown', e => {
    if (!pn.classList.contains('open')) return;
    if (e.key === 'Escape') close();
    // arrows move through the photos first, then on to the next piece
    if (e.key === 'ArrowRight') { k < WORKS[curI].n - 1 ? go(k + 1) : step(1); }
    if (e.key === 'ArrowLeft') { k > 0 ? go(k - 1) : step(-1); }
  });
  // a shared link like #work/break-the-cycle opens that piece straight away
  const m = location.hash.match(/^#work\/([\w-]+)/); if (m) { const i = WORKS.findIndex(w => w.slug === m[1]); if (i >= 0) { history.replaceState(null, '', '#work'); open(i); } }
  window.__works = { open, close, go, step };
})();
