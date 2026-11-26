/* The Cycle: ten works hang around a slowly turning ring, told in four chapters.
   Scrolling turns the ring. At the end it breaks open and her wave fills the screen.
   Each work opens on its own quiet page. A plain Index lists everything for quick viewing. */
(function () {
  // ---- the story. Captions marked "stand-in" are placeholders until Jeanette sends her own lines.
  const CHAPTERS = [
    { n: 'I', word: 'Falling', line: 'It starts with losing your footing.' },
    { n: 'II', word: 'Suspended', line: 'Then time stops.' },
    { n: 'III', word: 'Choosing', line: 'Then you push back.' },
    { n: 'IV', word: 'Rising', line: 'And you begin again.' }
  ];
  const WORKS = [
    { slug: 'the-feeling-of-falling', title: 'The Feeling of Falling', year: 2022, ch: 0, n: 4, line: 'A figure in free fall, held in mid-air.' },
    { slug: 'where-i-once-stood', title: 'Where I Once Stood', year: 2026, ch: 0, n: 3, line: 'The pieces of a form, laid out on the studio floor.', table: true },
    { slug: 'what-remains-of-gravity', title: 'What Remains of Gravity', year: 2026, ch: 0, n: 2, line: 'A body pulled down into a splash.' },
    { slug: 'the-space-between', title: 'The Space Between', year: 2026, ch: 1, n: 3, line: 'Fragments hanging, halfway through scattering.' },
    { slug: 'an-instant-without-end', title: 'An Instant Without End', year: 2026, ch: 1, n: 2, line: 'Rings of light and shadow, held in place.' },
    { slug: 'a-moment-held-open', title: 'A Moment Held Open', year: 2026, ch: 1, n: 2, line: 'A splash, frozen the instant it lands.' },
    { slug: 'against-the-current', title: 'Against the Current', year: 2026, ch: 2, n: 3, line: 'A face pushing up through the wave.' },
    { slug: 'i-decide', title: 'I Decide', year: 2022, ch: 2, n: 1, materials: 'Aluminum', line: 'A figure rising out of the metal.' },
    { slug: 'where-i-begin', title: 'Where I Begin', year: 2026, ch: 3, n: 3, line: 'A splash that opens into sky.' },
    { slug: 'break-the-cycle', title: 'Break the Cycle', year: 2026, ch: 3, n: 2, materials: 'Paper, plant fiber, vinyl, cardboard', line: 'A wave closes into a circle. The stingrays break through.' }
  ];
  const AR = {   // width / height of each photo, so cards keep their shape before images load
    'the-feeling-of-falling': [1.417, 1.5, 1.5, .667], 'where-i-once-stood': [2.647, .593, .479], 'what-remains-of-gravity': [.6, .502],
    'the-space-between': [.637, .667, .667], 'an-instant-without-end': [.738, .526], 'a-moment-held-open': [.712, .667],
    'against-the-current': [.479, .667, .666], 'i-decide': [.75], 'where-i-begin': [.667, .667, .788], 'break-the-cycle': [.972, .75]
  };
  const src = (w, i, thumb) => `art/work/${w.slug}-${i}${thumb ? '-t' : ''}.webp`;
  const meta = w => [w.year, w.materials].filter(Boolean).join(' · ');

  const sec = document.getElementById('work'); if (!sec) return;
  const ring = document.getElementById('cyRing'), words = [...document.querySelectorAll('.cy-word')], capEl = document.getElementById('cyCap');
  const endEl = document.getElementById('cyEnd'), chips = [...document.querySelectorAll('.cy-chip')], lineEl = document.getElementById('cyLine');
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const sm = (a, b, x) => { const u = Math.min(1, Math.max(0, (x - a) / (b - a))); return u * u * (3 - 2 * u); };
  const cl = x => Math.min(1, Math.max(0, x));

  // where each work sits on the ring: small gaps between chapters
  const GAP = .8, slot = WORKS.map((w, i) => i + w.ch * GAP), TOTAL = slot[slot.length - 1] + 1 + GAP;
  const theta = WORKS.map((w, i) => slot[i] / TOTAL * Math.PI * 2);

  // build the hanging cards
  const cards = WORKS.map((w, i) => {
    const b = document.createElement('button'); b.type = 'button'; b.className = 'cy-card'; b.dataset.cursor = 'Open';
    b.setAttribute('aria-label', `${w.title}, ${w.year}. Open this work`);
    b.innerHTML = `<span class="cy-str" aria-hidden="true"></span><img src="${src(w, 0, true)}" alt="" loading="${i < 3 || i > 7 ? 'eager' : 'lazy'}" decoding="async">`;
    b.addEventListener('click', () => openWork(i));
    ring.appendChild(b); return b;
  });
  const bigFinal = new Image(); bigFinal.src = src(WORKS[9], 0);   // sharp copy for the ending

  let W = 0, H = 0, base = 0, Rx = 0, Ry = 0, cy = 0, sizes = [];
  function layout() {
    W = innerWidth; H = innerHeight; const small = W < 760;
    base = small ? Math.min(H * .32, W * .46) : Math.min(H * .38, W * .26);
    Rx = small ? W * .5 : Math.min(W * .41, 680); Ry = H * (small ? .11 : .15); cy = H * (small ? .44 : .47);
    sizes = WORKS.map(w => { const ar = AR[w.slug][0]; const h = Math.min(base, (small ? W * .6 : W * .3) / ar); return [h * ar, h]; });
    cards.forEach((c, i) => { c.style.width = sizes[i][0] + 'px'; c.style.height = sizes[i][1] + 'px'; });
  }

  // scroll position inside the section: 0 at the first work, 9 at the last, then the ending
  const SPAN = .86;
  function target() {
    const r = sec.getBoundingClientRect(), P = cl(-r.top / Math.max(1, r.height - H));
    return { P, f: Math.min(9, P / SPAN * 9), e: sm(SPAN + .01, .985, P) };
  }
  // the ring trails the scroll and catches up over about 0.6 seconds, the way the best scroll-driven sites feel
  let sf = null, se = 0, lastT = 0;
  function state(now) {
    const t = target(), dt = lastT ? Math.min(.1, (now - lastT) / 1000) : 1; lastT = now;
    if (sf === null || Math.abs(t.f - sf) > 4) { sf = t.f; se = t.e; }      // big jumps (links, Index) land straight away
    const k = 1 - Math.exp(-dt / .22);
    sf += (t.f - sf) * k; se += (t.e - se) * k;
    return { P: t.P, f: sf, e: se };
  }
  const posFor = k => { const r = sec.getBoundingClientRect(), top = scrollY + r.top; return top + (k / 9) * SPAN * (r.height - H); };

  let shown = -1, t0 = performance.now();
  function draw(now) {
    const { f, e } = state(now), t = (now - t0) / 1000;
    const i0 = Math.min(8, Math.floor(f)), fr = f - i0, rot = theta[i0] + (theta[i0 + 1] - theta[i0]) * fr;
    const front = Math.round(f);
    cards.forEach((c, i) => {
      const phi = theta[i] - rot, z = Math.cos(phi), d = (z + 1) / 2;
      const pop = Math.exp(-Math.pow(Math.atan2(Math.sin(phi), Math.cos(phi)) / .3, 2));      // the piece facing you steps forward
      let x = Math.sin(phi) * Rx, y = cy + (z - .4) * Ry + pop * H * .04, s = (.22 + .62 * Math.pow(d, 2.2)) * (1 + .38 * pop), o = .14 + .66 * Math.pow(d, 2.4) + .2 * pop;
      let sway = reduce ? 0 : Math.sin(t * .7 + i * 1.9) * (1.4 - d * .8), zi = Math.round(d * 100);
      if (e > 0) {
        if (i === 9) {                                   // the last piece grows to fill the screen
          const target = Math.max(Math.min(H * .9 / sizes[i][1], W * .94 / sizes[i][0]), 1); s = s + (target - s) * e; y = cy + (H / 2 - cy) * e; x *= 1 - e; sway *= 1 - e; o = 1; zi = 200;
        } else {                                         // the rest of the ring breaks apart and drifts up and away
          const k = 1 + 2.4 * e * e; x *= k; y -= e * H * (.25 + .2 * Math.sin(i * 3.1)); o *= 1 - sm(.1, .8, e); sway += e * 25 * (i % 2 ? 1 : -1); s *= 1 + e * .3;
        }
      }
      c.style.transform = `translate3d(calc(${x.toFixed(1)}px - 50%), calc(${y.toFixed(1)}px - 50%), 0) scale(${s.toFixed(4)}) rotate(${sway.toFixed(2)}deg)`;
      c.style.opacity = Math.min(1, o).toFixed(3); c.style.zIndex = zi + Math.round(pop * 50);
      c.style.pointerEvents = o > .55 ? 'auto' : 'none';
      c.style.setProperty('--dim', (1 - pop).toFixed(3));
    });
    if (e > .02 && bigFinal.complete && !cards[9].dataset.big) { cards[9].querySelector('img').src = bigFinal.src; cards[9].dataset.big = 1; }
    // the chapter word slides across behind the ring
    CHAPTERS.forEach((ch, c) => {
      const idx = WORKS.map((w, i) => w.ch === c ? i : -1).filter(i => i >= 0), a = idx[0] - .5, b = idx[idx.length - 1] + .5;
      const u = (f - a) / (b - a), op = sm(0, .14, u) * (1 - sm(.86, 1, u)) * (1 - sm(0, .3, e));
      words[c].style.opacity = op.toFixed(3); words[c].style.transform = `translate3d(${((.5 - u) * 36).toFixed(2)}vw, -50%, 0)`;
    });
    // caption for the work at the front
    const w = WORKS[front];
    if (front !== shown) {
      shown = front;
      capEl.querySelector('.t').textContent = w.title; capEl.querySelector('.m').textContent = meta(w);
      capEl.querySelector('.n').textContent = `${String(front + 1).padStart(2, '0')} / ${WORKS.length}`;
      lineEl.innerHTML = `<b>${CHAPTERS[w.ch].n}. ${CHAPTERS[w.ch].word}</b> ${CHAPTERS[w.ch].line}`;
      chips.forEach((ch, c) => ch.classList.toggle('on', c === w.ch));
    }
    capEl.style.opacity = ((1 - Math.min(1, Math.abs(f - front) * 2.6)) * (1 - sm(0, .25, e))).toFixed(3);
    lineEl.style.opacity = (1 - sm(0, .25, e)).toFixed(3);
    endEl.style.opacity = sm(.55, .95, e).toFixed(3); endEl.classList.toggle('on', e > .7);
  }
  let settleT = 0, lastScroll = -1;
  function settle() {
    if (!window.lenis || document.documentElement.classList.contains('cy-locked')) return;
    const { P, f } = target(); if (P <= 0 || P >= SPAN) return;
    const k = Math.round(f); if (Math.abs(f - k) < .03) return;
    window.lenis.scrollTo(posFor(k), { duration: .9, easing: u => 1 - Math.pow(1 - u, 3) });
  }
  addEventListener('scroll', () => { if (!vis) return; clearTimeout(settleT); settleT = setTimeout(settle, 220); }, { passive: true });
  let vis = false, raf = 0;
  const loop = now => { draw(now); raf = vis ? requestAnimationFrame(loop) : 0; };
  new IntersectionObserver(([en]) => { vis = en.isIntersecting; if (vis && !raf) raf = requestAnimationFrame(loop); }, { rootMargin: '200px 0px' }).observe(sec);
  layout(); draw(performance.now());
  addEventListener('resize', () => { layout(); draw(performance.now()); });

  const go = y => window.lenis ? window.lenis.scrollTo(y, { duration: 1.4 }) : scrollTo({ top: y, behavior: reduce ? 'auto' : 'smooth' });
  chips.forEach((ch, c) => ch.addEventListener('click', () => go(posFor(WORKS.findIndex(w => w.ch === c)))));
  capEl.querySelector('button').addEventListener('click', () => openWork(shown));

  // ---------- a quiet page for each work ----------
  const wp = document.getElementById('wp'), wpBody = document.getElementById('wpBody'), wpCh = document.getElementById('wpCh');
  let current = -1, lastFocus = null;
  const lock = on => { document.documentElement.classList.toggle('cy-locked', on); if (window.lenis) on ? window.lenis.stop() : window.lenis.start(); };
  const io = new IntersectionObserver(es => es.forEach(en => en.isIntersecting && en.target.classList.add('in')), { root: wp, threshold: .12 });
  function openWork(i, fromHash) {
    i = (i + WORKS.length) % WORKS.length; const w = WORKS[i]; current = i;
    if (!wp.classList.contains('open')) lastFocus = document.activeElement;
    closeIndex(true);
    const ar = AR[w.slug], more = [];
    for (let k = 1; k < w.n; k++) more.push(`<figure class="wp-fig" style="--ar:${ar[k]};--r:${((k % 2 ? -1 : 1) * (1.5 + k)).toFixed(1)}deg"><img src="${src(w, k)}" alt="${w.title}, view ${k + 1}" loading="lazy" decoding="async"></figure>`);
    const prev = WORKS[(i + WORKS.length - 1) % WORKS.length], next = WORKS[(i + 1) % WORKS.length];
    wpCh.textContent = `${CHAPTERS[w.ch].n}. ${CHAPTERS[w.ch].word}`;
    wpBody.innerHTML = `
      <figure class="wp-hero" style="--ar:${ar[0]}"><img src="${src(w, 0)}" alt="${w.title} by Jeanette Janvier, ${w.year}" decoding="async"></figure>
      <div class="wp-cap"><h2>${w.title}</h2><p class="wp-meta">${meta(w)}</p><p class="wp-line">${w.line}</p></div>
      ${more.length ? `<div class="wp-more${w.table ? ' table' : ''}">${more.join('')}</div>` : ''}
      <div class="wp-nav" role="navigation" aria-label="More works">
        <button type="button" data-go="${i - 1}"><span>Previous</span><b>${prev.title}</b></button>
        <button type="button" data-go="${i + 1}"><span>Next</span><b>${next.title}</b></button>
      </div>`;
    wpBody.querySelectorAll('[data-go]').forEach(b => b.addEventListener('click', () => openWork(+b.dataset.go)));
    wpBody.querySelectorAll('.wp-fig').forEach(f => io.observe(f));
    wp.hidden = false; wp.scrollTop = 0; requestAnimationFrame(() => wp.classList.add('open')); lock(true);
    if (!fromHash) history.replaceState(null, '', '#work/' + w.slug);
    wp.querySelector('.wp-x').focus({ preventScroll: true });
  }
  function closeWork() {
    if (!wp.classList.contains('open')) return;
    wp.classList.remove('open'); setTimeout(() => { wp.hidden = true; wpBody.innerHTML = ''; }, 450);
    lock(false); history.replaceState(null, '', '#work'); current = -1;
    if (lastFocus && document.contains(lastFocus)) lastFocus.focus({ preventScroll: true });
  }
  wp.querySelector('.wp-x').addEventListener('click', closeWork);

  // ---------- the plain Index ----------
  const ix = document.getElementById('ix'), ixList = document.getElementById('ixList'), ixPeek = document.getElementById('ixPeek');
  ixList.innerHTML = CHAPTERS.map((ch, c) => `<li class="ix-ch"><span>${ch.n}</span>${ch.word}</li>` +
    WORKS.map((w, i) => w.ch !== c ? '' : `<li><button type="button" data-i="${i}" data-cursor="Open"><span class="ix-t">${w.title}</span><span class="ix-y">${w.year}</span></button></li>`).join('')).join('');
  ixList.querySelectorAll('button').forEach(b => {
    b.addEventListener('click', () => openWork(+b.dataset.i));
    b.addEventListener('pointerenter', () => { ixPeek.src = src(WORKS[+b.dataset.i], 0, true); ixPeek.classList.add('on'); });
    b.addEventListener('pointerleave', () => ixPeek.classList.remove('on'));
  });
  ix.addEventListener('pointermove', e => { ixPeek.style.transform = `translate(${e.clientX + 24}px, ${e.clientY - 90}px)`; });
  function openIndex() { if (wp.classList.contains('open')) { wp.classList.remove('open'); wp.hidden = true; } ix.hidden = false; requestAnimationFrame(() => ix.classList.add('open')); lock(true); ix.querySelector('.ix-x').focus({ preventScroll: true }); }
  function closeIndex(keepLock) { if (!ix.classList.contains('open')) return; ix.classList.remove('open'); setTimeout(() => { if (!ix.classList.contains('open')) ix.hidden = true; }, 400); if (!keepLock) lock(false); }
  document.querySelectorAll('[data-open-index]').forEach(b => b.addEventListener('click', openIndex));
  ix.querySelector('.ix-x').addEventListener('click', () => closeIndex());

  addEventListener('keydown', e => {
    if (e.key === 'Escape') { if (wp.classList.contains('open')) closeWork(); else closeIndex(); }
    if (wp.classList.contains('open') && (e.key === 'ArrowRight' || e.key === 'ArrowLeft')) openWork(current + (e.key === 'ArrowRight' ? 1 : -1));
  });
  // links like #work/break-the-cycle open that work directly, so pieces can be shared one by one
  const fromHash = () => { const m = location.hash.match(/^#work\/([\w-]+)/); if (m) { const i = WORKS.findIndex(w => w.slug === m[1]); if (i >= 0) openWork(i, true); } };
  fromHash(); addEventListener('hashchange', fromHash);
  window.__cycle = { openWork, openIndex, posFor };
})();
