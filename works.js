/* The work: a grid of squares, one per piece. Hover shows a paper tag with the title, and moving across a square flips its photos.
   Clicking grows the square into a full view of the piece. Back to the grid, Escape, or the browser's back arrow shrinks it home. */
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
  const calm = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const nn = i => String(i + 1).padStart(2, '0');

  grid.innerHTML = WORKS.map((w, i) => `
    <li class="wk" data-i="${i}">
      <button type="button" class="wk-tile" data-cursor="Open" aria-label="${w.title}, ${w.year}. Open">
        ${Array.from({ length: w.n }, (_, k) => `<img src="${src(w, k, true)}" alt="" loading="lazy" decoding="async" class="${k ? '' : 'on'}">`).join('')}
        <span class="wk-num">${nn(i)}</span>
        <span class="wk-tag"><b>${w.title}</b><small>${w.year}</small></span>
      </button>
    </li>`).join('');

  // moving across a square flips through its photos: left edge shows the first, right edge the last
  grid.querySelectorAll('.wk').forEach(li => {
    const w = WORKS[+li.dataset.i], tile = li.querySelector('.wk-tile'), imgs = [...tile.querySelectorAll('img')];
    let cur = 0;
    const show = k => { if (k === cur) return; imgs[cur].classList.remove('on'); cur = k; imgs[k].classList.add('on'); };
    if (hoverable && w.n > 1) {
      tile.addEventListener('pointermove', e => { const r = tile.getBoundingClientRect(); show(Math.min(w.n - 1, Math.floor((e.clientX - r.left) / r.width * w.n))); });
      tile.addEventListener('pointerleave', () => show(0));
    }
    tile.addEventListener('click', () => open(+li.dataset.i));
  });

  // ---------- the open piece ----------
  const pn = document.getElementById('panel'), body = document.getElementById('panelBody');
  let curI = -1, k = 0, lastFocus = null, viaHistory = false;
  const lock = on => { document.documentElement.classList.toggle('pn-locked', on); if (window.lenis) on ? window.lenis.stop() : window.lenis.start(); };
  const tileOf = i => grid.querySelector(`.wk[data-i="${i}"] .wk-tile`);

  // a copy of the photo that travels between the square and the big view
  function fly(fromR, toR, url, fit, done) {
    if (calm || !fromR || !toR || !toR.width) { done && done(); return; }
    const im = new Image(); im.src = url; im.className = 'pn-fly'; im.style.objectFit = fit;
    Object.assign(im.style, { left: fromR.left + 'px', top: fromR.top + 'px', width: fromR.width + 'px', height: fromR.height + 'px' });
    document.body.appendChild(im);
    requestAnimationFrame(() => requestAnimationFrame(() => Object.assign(im.style, { left: toR.left + 'px', top: toR.top + 'px', width: toR.width + 'px', height: toR.height + 'px' })));
    setTimeout(() => { done && done(); im.style.opacity = '0'; im.style.transition = 'opacity .2s'; setTimeout(() => im.remove(), 220); }, 560);
  }

  function go(j) {
    const w = WORKS[curI]; j = Math.max(0, Math.min(w.n - 1, j)); if (j === k && body.querySelector('#pnImg').dataset.k == j) return;
    k = j; const main = body.querySelector('#pnImg');
    body.querySelectorAll('.pn-th').forEach((b, x) => b.classList.toggle('on', x === k));
    const l = body.querySelector('.pn-step.l'); if (l) { l.disabled = k === 0; body.querySelector('.pn-step.r').disabled = k === w.n - 1; }
    main.classList.add('swap'); main.dataset.k = k;
    setTimeout(() => { main.onload = () => main.classList.remove('swap'); main.src = src(w, k); if (main.complete) main.classList.remove('swap'); }, 180);
  }
  function fill(i) {
    const w = WORKS[i], nx = WORKS[(i + 1) % WORKS.length]; curI = i; k = 0;
    body.innerHTML = `
      <figure class="pn-main">
        <img id="pnImg" data-k="0" src="${src(w, 0)}" alt="${w.title} by Jeanette Janvier, ${w.year}" draggable="false">
        ${w.n > 1 ? '<button type="button" class="pn-step l" aria-label="Previous photo" disabled>‹</button><button type="button" class="pn-step r" aria-label="Next photo">›</button>' : ''}
      </figure>
      <div class="pn-side">
        <p class="pn-no">${nn(i)} / ${WORKS.length}</p>
        <h3>${w.title}</h3>
        <p class="pn-meta">${w.year}${w.materials ? ' · ' + w.materials : ''}</p>
        <p class="pn-line">${w.line}</p>
        ${w.n > 1 ? `<div class="pn-thumbs">${Array.from({ length: w.n }, (_, x) => `<button type="button" class="pn-th${x ? '' : ' on'}" aria-label="Photo ${x + 1}"><img src="${src(w, x, true)}" alt=""></button>`).join('')}</div>` : ''}
        <button type="button" class="pn-next"><small>Next</small><b>${nx.title} →</b></button>
      </div>`;
    body.querySelectorAll('.pn-th').forEach((b, x) => b.addEventListener('click', () => go(x)));
    const l = body.querySelector('.pn-step.l');
    if (l) { l.addEventListener('click', () => go(k - 1)); body.querySelector('.pn-step.r').addEventListener('click', () => go(k + 1)); }
    body.querySelector('.pn-next').addEventListener('click', () => step(1));
    // swipe on touch screens
    const main = body.querySelector('.pn-main'); let x0 = null;
    main.addEventListener('pointerdown', e => { if (e.pointerType !== 'mouse') x0 = e.clientX; });
    main.addEventListener('pointerup', e => { if (x0 == null) return; const dx = e.clientX - x0; x0 = null; if (Math.abs(dx) > 40) go(k + (dx < 0 ? 1 : -1)); });
    pn.querySelector('.pn-card').scrollTop = 0;
  }
  function step(d) { const i = (curI + d + WORKS.length) % WORKS.length; fill(i); history.replaceState(history.state, '', '#work/' + WORKS[i].slug); }
  function open(i, fromHash) {
    lastFocus = document.activeElement; fill(i);
    const t = tileOf(i), from = t && t.getBoundingClientRect(), img = body.querySelector('#pnImg');
    pn.hidden = false; lock(true);
    if (!fromHash) { history.pushState({ panel: WORKS[i].slug }, '', '#work/' + WORKS[i].slug); viaHistory = true; }
    const reveal = () => requestAnimationFrame(() => pn.classList.add('open'));
    const start = () => {
      img.style.visibility = 'hidden'; pn.style.transition = 'opacity .3s ease'; reveal();
      fly(from, img.getBoundingClientRect(), src(WORKS[i], 0), 'contain', () => { img.style.visibility = ''; });
    };
    if (img.complete && img.naturalWidth) start(); else { img.onload = start; setTimeout(() => { if (!pn.classList.contains('open')) reveal(); }, 700); }
    pn.querySelector('.pn-x').focus({ preventScroll: true });
  }
  function hide() {
    if (!pn.classList.contains('open')) return;
    const i = curI, img = body.querySelector('#pnImg'), t = tileOf(i);
    const from = img && img.getBoundingClientRect(), to = t && t.getBoundingClientRect();
    const onScreen = to && to.bottom > 0 && to.top < innerHeight;
    if (onScreen && img) { fly(from, to, img.src, 'cover'); }
    pn.classList.remove('open'); setTimeout(() => { if (!pn.classList.contains('open')) { pn.hidden = true; body.innerHTML = ''; } }, 360);
    lock(false); curI = -1;
    if (lastFocus && document.contains(lastFocus)) lastFocus.focus({ preventScroll: true });
  }
  // every way back goes through the browser history, so the back arrow and the Back button behave the same
  function close() { if (viaHistory && history.state && history.state.panel) history.back(); else { hide(); history.replaceState(null, '', '#work'); } }
  addEventListener('popstate', () => { viaHistory = false; const m = location.hash.match(/^#work\/([\w-]+)/); if (m) { const i = WORKS.findIndex(w => w.slug === m[1]); if (i >= 0) { fill(i); return; } } hide(); });
  pn.querySelector('.pn-x').addEventListener('click', close);
  addEventListener('keydown', e => {
    if (!pn.classList.contains('open')) return;
    if (e.key === 'Escape') close();
    if (e.key === 'ArrowRight') { k < WORKS[curI].n - 1 ? go(k + 1) : step(1); }
    if (e.key === 'ArrowLeft') { k > 0 ? go(k - 1) : step(-1); }
  });
  // a shared link like #work/break-the-cycle opens that piece straight away
  const m = location.hash.match(/^#work\/([\w-]+)/); if (m) { const i = WORKS.findIndex(w => w.slug === m[1]); if (i >= 0) { history.replaceState(null, '', '#work'); open(i); } }
  window.__works = { open, close, go, step };
})();
