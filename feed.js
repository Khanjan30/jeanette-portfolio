/* Feeding the paper stingrays.
   A small paper box of food flakes. Drag a pinch out, drop it near a ray, and it swims over to eat.
   Every bite puffs her up a little (about 17 bites, or 2 to 3 pinches, to fully chubby). Fully chubby, she has one pup
   and slims back down. (Real stingrays give birth to live young.) Left alone, a chubby ray slowly slims. */
(function () {
  const css = `
  .feed{position:absolute;z-index:30;width:66px;height:62px;user-select:none;-webkit-user-select:none}
  .feed-box{position:absolute;inset:0;border:0;background:none;padding:0;cursor:grab;touch-action:none;-webkit-tap-highlight-color:transparent;color:inherit;font:inherit}
  .feed.no-cursor .feed-box{cursor:none}
  .feed-body{position:absolute;left:3px;right:3px;bottom:0;height:42px;filter:drop-shadow(0 10px 10px rgba(20,20,30,.22));transform:rotate(-4deg);transition:transform .45s cubic-bezier(.2,.8,.2,1)}
  .feed-body::before{content:"";position:absolute;inset:0;background:#f6f4ec repeating-linear-gradient(0deg,transparent 0 4px,rgba(30,30,30,.07) 4px 5px);clip-path:polygon(0 0,100% 0,91% 100%,9% 100%)}
  .feed-body::after{content:"";position:absolute;left:0;right:0;top:0;height:6px;background:#e6e3d8;clip-path:polygon(0 0,100% 0,99% 100%,1% 100%)}
  .feed-word{position:absolute;left:50%;top:56%;transform:translate(-50%,-50%);font:500 10px/1 Inter,system-ui,sans-serif;letter-spacing:.26em;padding:4px 4px 4px 7px;text-transform:uppercase;color:#131313;border:1px solid rgba(19,19,19,.55);background:rgba(246,244,236,.9)}
  .feed-flakes{position:absolute;left:10px;right:10px;top:10px;height:14px;transform:rotate(-4deg)}
  .feed-flakes i{position:absolute;bottom:0;width:7px;height:6px;clip-path:polygon(10% 20%,70% 0,100% 60%,45% 100%,0 70%);transition:transform .45s cubic-bezier(.2,.8,.2,1)}
  .feed-flakes i:nth-child(1){left:2px;background:#2a3bd1}
  .feed-flakes i:nth-child(2){left:12px;background:#f0c030;bottom:2px}
  .feed-flakes i:nth-child(3){left:22px;background:#7f45cc}
  .feed-flakes i:nth-child(4){left:31px;background:#2a3bd1;bottom:3px}
  .feed-flakes i:nth-child(5){left:39px;background:#f0c030}
  .feed:hover .feed-body,.feed.open .feed-body{transform:rotate(0) translateY(-3px)}
  .feed:hover .feed-flakes i,.feed.open .feed-flakes i{transform:translateY(-5px) rotate(20deg)}
  .feed.idle .feed-flakes i:nth-child(2){animation:feedHop 4.5s ease-in-out infinite}
  @keyframes feedHop{0%,82%,100%{transform:none}88%{transform:translateY(-9px) rotate(90deg)}94%{transform:translateY(-2px) rotate(160deg)}}
  .feed-box:focus-visible{outline:2px solid #2a3bd1;outline-offset:6px}
  .feed-tip{position:absolute;bottom:calc(100% + 10px);width:max-content;max-width:min(230px,70vw);padding:9px 13px;font:400 12.5px/1.4 Inter,system-ui,sans-serif;color:#131313;background:rgba(251,250,246,.97);box-shadow:0 10px 22px -12px rgba(0,0,0,.45);opacity:0;transform:translateY(6px);transition:opacity .3s,transform .3s;pointer-events:none;clip-path:polygon(0 6%,5% 0,50% 4%,96% 0,100% 10%,99% 55%,100% 94%,94% 100%,50% 96%,4% 100%,0 90%,1% 45%)}
  .feed-tip b{font-weight:500;color:#2a3bd1}
  .feed.right .feed-tip{right:-4px;text-align:right}
  .feed.left .feed-tip{left:-4px}
  .feed.tip .feed-tip{opacity:1;transform:none}
  .feed-pinch{position:fixed;left:0;top:0;width:0;height:0;z-index:120;pointer-events:none;opacity:0;transition:opacity .2s}
  .feed-pinch.on{opacity:1}
  .feed-pinch i{position:absolute;width:8px;height:7px;clip-path:polygon(10% 20%,70% 0,100% 60%,45% 100%,0 70%);animation:feedJiggle .5s ease-in-out infinite alternate}
  @keyframes feedJiggle{to{transform:translateY(-2px) rotate(25deg)}}
  @media (max-width:600px){.feed{width:58px;height:56px}.feed-body{height:37px}.feed-word{font-size:9px}}
  `;
  const COLS = ['#2a3bd1', '#2a3bd1', '#7f45cc', '#f0c030', '#f0c030', '#3e8fa8'];
  const MOUSE_TIP = 'Drag a pinch of food out and drop it near a stingray.';
  const TOUCH_TIP = 'Press the box, drag out, and let go near a stingray.';
  const angDiff = (a, b) => Math.atan2(Math.sin(a - b), Math.cos(a - b));

  window.RayFeed = function (o) {
    if (!document.getElementById('feed-css')) { const s = document.createElement('style'); s.id = 'feed-css'; s.textContent = css; document.head.appendChild(s); }
    const host = o.host, side = o.side || 'right';
    host.classList.add('feed', side, 'idle'); if (o.hideCursor) host.classList.add('no-cursor');
    host.innerHTML = `<span class="feed-tip" role="status" aria-live="polite"></span>
      <button class="feed-box" type="button" aria-label="Fish food. Drag a pinch onto the stingrays to feed them, or press Enter to drop some.">
        <span class="feed-flakes" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i></span>
        <span class="feed-body" aria-hidden="true"><span class="feed-word">Food</span></span>
      </button>`;
    const box = host.querySelector('.feed-box'), tip = host.querySelector('.feed-tip');
    const pinch = document.createElement('div'); pinch.className = 'feed-pinch';
    for (let i = 0; i < 8; i++) {
      const f = document.createElement('i'); const a = i / 8 * 6.283, r = 3 + Math.random() * 7;
      f.style.cssText = `left:${Math.cos(a) * r - 3}px;top:${Math.sin(a) * r - 3}px;background:${COLS[i % COLS.length]};animation-delay:${-Math.random() * .5}s`;
      pinch.appendChild(f);
    }
    document.body.appendChild(pinch);

    const flakes = [], pups = [], notes = [];
    let fedTotal = 0, pupTotal = 0, tipTimer = 0, start = null, hovering = false, touchy = false;
    const api = { dragging: false, hover: false, flakes, pups };

    /* the little sign above the box */
    const hint = () => pupTotal ? 'A well fed ray has a <b>pup</b>. Drag out more food.' : fedTotal ? 'Keep feeding. <b>Watch them change.</b>' : (touchy ? TOUCH_TIP : MOUSE_TIP);
    function say(html, ms) {
      tip.innerHTML = html; host.classList.add('tip'); clearTimeout(tipTimer);
      if (ms) tipTimer = setTimeout(() => { if (!hovering) host.classList.remove('tip'); }, ms);
    }
    box.addEventListener('pointerenter', e => { if (e.pointerType !== 'mouse') return; hovering = api.hover = true; host.classList.remove('idle'); if (!api.dragging) say(hint()); });
    box.addEventListener('pointerleave', e => { if (e.pointerType !== 'mouse') return; hovering = api.hover = false; host.classList.add('idle'); if (!api.dragging) host.classList.remove('tip'); });

    /* drag a pinch out of the box */
    const toCanvas = (cx, cy) => { const r = o.canvas.getBoundingClientRect(); return [cx - r.left, cy - r.top, cx >= r.left && cx <= r.right && cy >= r.top && cy <= r.bottom]; };
    const movePinch = (x, y) => { pinch.style.transform = `translate(${x}px,${y}px)`; };
    box.addEventListener('pointerdown', e => {
      e.stopPropagation(); e.preventDefault();
      touchy = e.pointerType !== 'mouse';
      try { box.setPointerCapture(e.pointerId); } catch (_) {}
      start = { x: e.clientX, y: e.clientY }; host.classList.add('open');
    });
    box.addEventListener('pointermove', e => {
      if (!start) return;
      if (!api.dragging && Math.hypot(e.clientX - start.x, e.clientY - start.y) > 6) {
        api.dragging = true; pinch.classList.add('on'); host.classList.remove('tip');
      }
      if (api.dragging) movePinch(e.clientX, e.clientY - (touchy ? 28 : 0));
    });
    const end = e => {
      if (!start) return;
      const wasDrag = api.dragging; start = null; api.dragging = false;
      host.classList.remove('open'); pinch.classList.remove('on');
      if (!wasDrag) { say(hint(), touchy ? 4200 : 3000); return; }
      const [x, y, inside] = toCanvas(e.clientX, e.clientY - (touchy ? 28 : 0));
      const br = box.getBoundingClientRect(), overBox = e.clientX > br.left - 10 && e.clientX < br.right + 10 && e.clientY > br.top - 10 && e.clientY < br.bottom + 10;
      if (inside && !overBox && e.type !== 'pointercancel') drop(x, y, 9);
    };
    box.addEventListener('pointerup', end); box.addEventListener('pointercancel', end);
    box.addEventListener('lostpointercapture', e => { if (start) end(e); });
    box.addEventListener('click', e => e.preventDefault());
    box.addEventListener('keydown', e => {          // keyboard: drop food just in front of a ray
      if (e.key !== 'Enter' && e.key !== ' ') return; e.preventDefault();
      const rs = o.rays(); if (!rs.length) return; const r = rs[Math.random() * rs.length | 0];
      drop(r.x + Math.cos(r.h) * r.L * 2.2, r.y + Math.sin(r.h) * r.L * 2.2, 9);
    });

    function drop(x, y, n) {
      const [W, H] = o.size();                       // keep the food where people (and rays) can see it
      x = Math.max(30, Math.min(W - 30, x)); y = Math.max(90, Math.min(H * (o.floor || .8), y));
      for (let i = 0; i < n; i++) {
        const a = Math.random() * 6.283, s = .5 + Math.random() * 1.7;
        flakes.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s - .4, rot: Math.random() * 6.28, vr: (Math.random() - .5) * .08,
          s: 3.2 + Math.random() * 2.6, col: COLS[Math.random() * COLS.length | 0], ph: Math.random() * 6.28, life: 24 + Math.random() * 6 });
      }
    }

    /* each frame: flakes drift down, rays pick a flake, eat, grow, have pups */
    let time = 0;
    api.step = function () {
      time += 1 / 60;
      const [W, H] = o.size();
      for (let i = flakes.length - 1; i >= 0; i--) {
        const f = flakes[i];
        f.vx *= .95; f.vy = Math.min(.28, f.vy * .95 + .008);
        if (f.y > H * (o.floor || .8)) f.vy = Math.min(f.vy, -.02);   // food hangs in the water instead of sinking out of view
        if (f.y < 80) f.vy = Math.max(f.vy, .1);
        if (f.x < 16) f.vx = Math.abs(f.vx) + .05; else if (f.x > W - 16) f.vx = -Math.abs(f.vx) - .05;
        f.x += f.vx + Math.sin(time * 1.6 + f.ph) * .18; f.y += f.vy; f.rot += f.vr; f.life -= 1 / 60;
        if (f.life <= 0 || f.y > H + 12 || f.x < -40 || f.x > W + 40) flakes.splice(i, 1);
      }
      const eaters = o.rays().concat(pups);
      for (const r of eaters) {
        if (r.Lbase == null) { r.Lbase = r.L; r.Lcur = r.L; r.fat = r.fatT = 0; r.gulp = 0; }
        r.food = null;
        if (r.loop > 0) continue;
        let bd = (r.mom ? 260 : 900) ** 2;
        for (const f of flakes) { const d = (f.x - r.x) ** 2 + (f.y - r.y) ** 2; if (d < bd) { bd = d; r.food = f; } }
        if (r.food) {
          const mx = r.x + Math.cos(r.h) * r.L * .42, my = r.y + Math.sin(r.h) * r.L * .42;
          if (Math.hypot(r.food.x - mx, r.food.y - my) < r.L * .32 + 6) eat(r, r.food);
        }
      }
      for (const r of eaters) {                       // puff up smoothly, slim down slowly when left alone
        r.fatT = Math.max(0, r.fatT - .0002);         // about two minutes from fully chubby to slim
        r.fat += (r.fatT - r.fat) * .035; r.gulp *= .92;
        if (r.fatT < .6) r.full = false;
        if (!r.mom && r.fatT > .97 && r.fat > .93 && !r.full) {
          r.full = true;
          if (!pups.some(p => p.mom === r) && pupTotal < (o.maxPups || 4)) { birth(r); r.fatT = .15; }
          else { r.loop = 1.6; notes.push({ ray: r, text: 'so full', t: 2.2 }); }
        }
        const target = r.mom ? r.Lt : r.Lbase;
        r.Lcur += (target - r.Lcur) * .05;
        r.L = r.Lcur * (1 + .42 * r.fat) * (1 + .06 * r.gulp);   // chubby rays are also bigger
      }
      for (const p of pups) followMom(p);
      for (let i = notes.length - 1; i >= 0; i--) { notes[i].t -= 1 / 60; if (notes[i].t <= 0) notes.splice(i, 1); }
    };

    function eat(r, f) {
      flakes.splice(flakes.indexOf(f), 1); r.food = null; r.gulp = 1; fedTotal++;
      if (r.mom) { r.Lt = Math.min(r.mom.Lbase * .55, r.Lt + .5); r.fatT = Math.min(.8, r.fatT + .1); return; }
      r.fatT = Math.min(1, r.fatT + .06);
    }
    function birth(r) {
      const bx = r.x - Math.cos(r.h) * r.L * .5, by = r.y - Math.sin(r.h) * r.L * .5;
      pups.push({ mom: r, x: bx, y: by, h: r.h + (Math.random() - .5), L: 1, Lcur: 1, Lt: r.Lbase * .38, Lbase: null, ph: Math.random() * 6.28,
        side: Math.random() < .5 ? 1 : -1, v: 0, gulp: 0, col: r.col, light: .45 });
      pupTotal++;
      notes.push({ ray: r, text: 'a pup!', t: 2.6 });
      if (pupTotal === 1) say('<b>A pup!</b> Real stingrays give birth to live young.', 5200);
    }
    function followMom(p) {
      p.ph += .07;
      let tx, ty, sp;
      if (p.food) { tx = p.food.x; ty = p.food.y; sp = 1.4; }
      else {
        const m = p.mom, c = Math.cos(m.h), s = Math.sin(m.h), bx = -m.L * 1.15, by = p.side * m.L * .8;
        tx = m.x + bx * c - by * s; ty = m.y + bx * s + by * c;
        sp = Math.max(.25, Math.min(1.8, Math.hypot(tx - p.x, ty - p.y) * .025));
      }
      p.h += Math.max(-.06, Math.min(.06, angDiff(Math.atan2(ty - p.y, tx - p.x), p.h) * .1));
      p.v += (sp - p.v) * .05;
      p.x += Math.cos(p.h) * p.v; p.y += Math.sin(p.h) * p.v;
    }

    /* steering for the page's own rays: returns null when there is nothing to chase */
    api.steer = function (r) {
      if (r.loop > 0) { r.loop -= 1 / 60; return { turn: .065, sp: 1.5 }; }
      if (!r.food) return null;
      const d = angDiff(Math.atan2(r.food.y - r.y, r.food.x - r.x), r.h);
      return { turn: Math.max(-.05, Math.min(.05, d * .1)), sp: 1.7 };
    };

    api.draw = function (c) {
      for (const f of flakes) {
        const a = Math.min(1, f.life / 2);
        c.save(); c.translate(f.x, f.y); c.rotate(f.rot); c.globalAlpha = a;
        c.fillStyle = f.col; c.beginPath(); c.moveTo(-f.s, -f.s * .4); c.lineTo(f.s * .5, -f.s * .8); c.lineTo(f.s, f.s * .3); c.lineTo(-f.s * .2, f.s * .8); c.closePath(); c.fill();
        c.restore();
      }
      for (const p of pups) o.drawPup(c, p);
    };
    api.drawNotes = function (c) {
      c.font = 'italic 300 15px Fraunces, Georgia, serif'; c.textAlign = 'center';
      for (const n of notes) {
        const a = Math.min(1, n.t / .5, (2.6 - n.t) * 4 + .2);
        c.fillStyle = `rgba(42,59,209,${Math.max(0, a)})`;
        c.fillText(n.text, n.ray.x, Math.max(84, n.ray.y - n.ray.L - 14 - (2.6 - n.t) * 10));
      }
      c.textAlign = 'start';
    };
    return api;
  };
})();
