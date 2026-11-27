/* The work: a clean grid. Hover a piece to see its title, year and See more; move across it to flip through its photos.
   See more opens a panel with every photo and the details. Close it with the X, Escape, a click outside, or the browser's back button. */
(function () {
  // Captions are plain descriptions until Jeanette sends her own lines. Sizes and most materials are still to come.
  const WORKS = [
    { slug: 'the-feeling-of-falling', title: 'The Feeling of Falling', year: 2022, n: 4, line: 'A figure in free fall, held in mid-air.' },
    { slug: 'where-i-once-stood', title: 'Where I Once Stood', year: 2026, n: 3, line: 'The pieces of a form, laid out on the studio floor.' },
    { slug: 'what-remains-of-gravity', title: 'What Remains of Gravity', year: 2026, n: 2, line: 'A body pulled down into a splash.' },
    { slug: 'the-space-between', title: 'The Space Between', year: 2026, n: 3, line: 'Fragments hanging, halfway through scattering.' },
    { slug: 'an-instant-without-end', title: 'An Instant Without End', year: 2026, n: 2, line: 'Rings of light and shadow, held in place.' },
    { slug: 'a-moment-held-open', title: 'A Moment Held Open', year: 2026, n: 2, line: 'A splash, frozen the instant it lands.' },
    { slug: 'against-the-current', title: 'Against the Current', year: 2026, n: 3, line: 'A face pushing up through the wave.' },
    { slug: 'i-decide', title: 'I Decide', year: 2022, n: 1, materials: 'Aluminum', line: 'A figure rising out of the metal.' },
    { slug: 'where-i-begin', title: 'Where I Begin', year: 2026, n: 3, line: 'A splash that opens into sky.' },
    { slug: 'break-the-cycle', title: 'Break the Cycle', year: 2026, n: 2, materials: 'Paper, plant fiber, vinyl, cardboard', line: 'A wave closes into a circle. The stingrays break through.', hd: true }
  ];
  const src = (w, i, thumb) => `art/work/${w.slug}-${i}${thumb ? '-t' : (w.hd && i === 0 ? '-hd' : '')}.webp`;
  const grid = document.getElementById('workGrid'); if (!grid) return;
  const hoverable = matchMedia('(hover:hover)').matches;

  grid.innerHTML = WORKS.map((w, i) => `
    <li class="wk" data-i="${i}">
      <button type="button" class="wk-tile" data-cursor="See more" aria-label="${w.title}, ${w.year}. See more">
        ${Array.from({ length: w.n }, (_, k) => `<img src="${src(w, k, true)}" alt="" loading="lazy" decoding="async" class="${k ? '' : 'on'}">`).join('')}
        ${w.n > 1 ? `<span class="wk-bars" aria-hidden="true">${Array.from({ length: w.n }, (_, k) => `<i class="${k ? '' : 'on'}"></i>`).join('')}</span>` : ''}
        <span class="wk-info"><span class="wk-t">${w.title}</span><span class="wk-y">${w.year}</span><span class="wk-more">See more</span></span>
      </button>
    </li>`).join('');

  // moving across a piece flips through its photos: left edge shows the first, right edge the last
  grid.querySelectorAll('.wk').forEach(li => {
    const w = WORKS[+li.dataset.i], tile = li.querySelector('.wk-tile'), imgs = [...tile.querySelectorAll('img')], bars = [...tile.querySelectorAll('.wk-bars i')];
    let cur = 0;
    const show = k => { if (k === cur) return; imgs[cur].classList.remove('on'); bars[cur] && bars[cur].classList.remove('on'); cur = k; imgs[k].classList.add('on'); bars[k] && bars[k].classList.add('on'); };
    if (hoverable && w.n > 1) {
      tile.addEventListener('pointermove', e => { const r = tile.getBoundingClientRect(); show(Math.min(w.n - 1, Math.floor((e.clientX - r.left) / r.width * w.n))); });
      tile.addEventListener('pointerleave', () => show(0));
    }
    tile.addEventListener('click', () => open(+li.dataset.i));
  });

  // ---------- the See more panel ----------
  const pn = document.getElementById('panel'), body = document.getElementById('panelBody');
  let curI = -1, lastFocus = null, viaHistory = false;
  const lock = on => { document.documentElement.classList.toggle('pn-locked', on); if (window.lenis) on ? window.lenis.stop() : window.lenis.start(); };
  function fill(i) {
    const w = WORKS[i]; curI = i;
    const pics = Array.from({ length: w.n }, (_, k) => `<button type="button" class="pn-th${k ? '' : ' on'}" data-k="${k}" aria-label="View photo ${k + 1}"><img src="${src(w, k, true)}" alt=""></button>`).join('');
    body.innerHTML = `
      <figure class="pn-main"><img id="pnImg" src="${src(w, 0)}" alt="${w.title} by Jeanette Janvier, ${w.year}"></figure>
      <div class="pn-side">
        <h3>${w.title}</h3>
        <p class="pn-meta">${w.year}${w.materials ? ' · ' + w.materials : ''}</p>
        <p class="pn-line">${w.line}</p>
        ${w.n > 1 ? `<div class="pn-thumbs">${pics}</div>` : ''}
        <p class="pn-count">${String(i + 1).padStart(2, '0')} / ${WORKS.length}</p>
      </div>`;
    const main = body.querySelector('#pnImg');
    body.querySelectorAll('.pn-th').forEach(b => b.addEventListener('click', () => {
      body.querySelectorAll('.pn-th').forEach(x => x.classList.toggle('on', x === b));
      main.classList.add('swap'); const k = +b.dataset.k;
      setTimeout(() => { main.src = src(w, k); main.onload = () => main.classList.remove('swap'); }, 160);
    }));
  }
  function open(i, fromHash) {
    lastFocus = document.activeElement; fill(i);
    pn.hidden = false; requestAnimationFrame(() => pn.classList.add('open')); lock(true);
    if (!fromHash) { history.pushState({ panel: WORKS[i].slug }, '', '#work/' + WORKS[i].slug); viaHistory = true; }
    pn.querySelector('.pn-x').focus({ preventScroll: true });
  }
  function hide() {
    if (!pn.classList.contains('open')) return;
    pn.classList.remove('open'); setTimeout(() => { if (!pn.classList.contains('open')) { pn.hidden = true; body.innerHTML = ''; } }, 350);
    lock(false); curI = -1;
    if (lastFocus && document.contains(lastFocus)) lastFocus.focus({ preventScroll: true });
  }
  // every way out goes through the browser history, so the back button and the X behave the same
  function close() { if (viaHistory && history.state && history.state.panel) history.back(); else { hide(); history.replaceState(null, '', '#work'); } }
  addEventListener('popstate', () => { viaHistory = false; const m = location.hash.match(/^#work\/([\w-]+)/); if (m) { const i = WORKS.findIndex(w => w.slug === m[1]); if (i >= 0) { fill(i); return; } } hide(); });
  pn.querySelector('.pn-x').addEventListener('click', close);
  pn.addEventListener('click', e => { if (e.target === pn) close(); });
  addEventListener('keydown', e => {
    if (!pn.classList.contains('open')) return;
    if (e.key === 'Escape') close();
    if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') { const i = (curI + (e.key === 'ArrowRight' ? 1 : WORKS.length - 1)) % WORKS.length; fill(i); history.replaceState(history.state, '', '#work/' + WORKS[i].slug); }
  });
  // a shared link like #work/break-the-cycle opens that piece straight away
  const m = location.hash.match(/^#work\/([\w-]+)/); if (m) { const i = WORKS.findIndex(w => w.slug === m[1]); if (i >= 0) { history.replaceState(null, '', '#work'); open(i); } }
  window.__works = { open, close };
})();
