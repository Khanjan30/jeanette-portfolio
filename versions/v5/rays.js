/* Folded paper stingrays, shared by the home and contact pages.
   Slim: a crisp origami diamond with a centre crease and angled wing panels.
   Chubby (r.fat 0..1): the paper puffs up into a round, soft pillow and the creases relax.
   Wings flap in a wave that rolls from the front of the wing to the back, like a ray swimming. */
(function () {
  const hex = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));
  const mix = (a, b, t) => a.map((v, i) => Math.round(v + (b[i] - v) * t));
  const rgba = (c, a) => `rgba(${c[0]},${c[1]},${c[2]},${a})`;
  const WHITE = [255, 255, 255], INK = [30, 34, 52];
  // soft colours taken from her reference pictures: cut paper blue, periwinkle, origami white, grey paper, sky, lavender
  const COLORS = {
    home: ['#8fb2da', '#b0b9e6', '#e8eaf0', '#a6b0bc'],
    contact: ['#a8c7e5', '#bdb6e2']
  };
  const grains = new WeakMap();
  function grain(c) {
    if (grains.has(c)) return grains.get(c);
    const g = document.createElement('canvas'); g.width = g.height = 48; const o = g.getContext('2d');
    for (let i = 0; i < 700; i++) { o.fillStyle = Math.random() < .55 ? 'rgba(255,255,255,.22)' : 'rgba(0,0,0,.07)'; o.fillRect(Math.random() * 48, Math.random() * 48, 1, 1); }
    const p = c.createPattern(g, 'repeat'); grains.set(c, p); return p;
  }
  // half outline (right side), x along the body in units of L, y in units of the half span S
  const SLIM = [[.48, 0], [.46, .3], [.14, .7], [-.16, 1], [-.28, .66], [-.48, .2], [-.64, .05]];
  const FAT = [[.6, 0], [.62, .5], [.32, 1], [-.12, 1], [-.44, .98], [-.58, .44], [-.64, .08]];
  const lerp = (a, b, t) => a + (b - a) * t;

  function draw(c, r, hov) {
    const L = r.L, fat = r.fat || 0, ph = r.ph, S = L * (.95 - .05 * fat);
    const base = hex(r.col || '#b0b9e6'), col = r.light ? mix(base, WHITE, r.light) : base;
    const edge = mix(col, INK, .35), dark = mix(col, INK, .2);
    // wave along the wing: s = 0 at the nose, 1 at the tail; tips move most
    const A = .42 - .14 * fat;
    const wave = (x, y) => {
      const s = Math.min(1, Math.max(0, (.6 - x) / 1.24)), w = Math.min(1, Math.abs(y));
      const k = 1 - A * (.5 + .5 * Math.sin(ph - 3.4 * s)) * w * w;
      return [(x - .1 * w * w * Math.sin(ph - 3.4 * s)) * L, y * k * S];
    };
    const pts = SLIM.map((p, i) => wave(lerp(p[0], FAT[i][0], fat), lerp(p[1], FAT[i][1], fat)));
    const P = (i, sgn) => [pts[i][0], pts[i][1] * sgn];

    c.save(); c.translate(r.x, r.y); c.rotate(r.h);
    // tail: long and thin, following the swim
    const sway = Math.sin(ph * .8 - 1.2) * L * .28, bx = pts[6][0];
    c.lineCap = 'round'; c.strokeStyle = rgba(dark, .9);
    c.lineWidth = Math.max(1, L * .028); c.beginPath(); c.moveTo(bx + 2, 0); c.bezierCurveTo(bx - L * .5, sway * .3, bx - L * .9, sway, bx - L * 1.55, sway * .4); c.stroke();
    c.lineWidth = Math.max(1.6, L * .05); c.beginPath(); c.moveTo(bx + 2, 0); c.quadraticCurveTo(bx - L * .25, sway * .08, bx - L * .45, sway * .25); c.stroke();

    const outline = () => {
      c.beginPath(); c.moveTo(...P(0, 1));
      c.bezierCurveTo(...P(1, 1), ...P(2, 1), ...P(3, 1)); c.bezierCurveTo(...P(4, 1), ...P(5, 1), ...P(6, 1));
      c.lineTo(...P(6, -1));
      c.bezierCurveTo(...P(5, -1), ...P(4, -1), ...P(3, -1)); c.bezierCurveTo(...P(2, -1), ...P(1, -1), ...P(0, -1));
      c.closePath();
    };
    const wing = sgn => {
      c.beginPath(); c.moveTo(...P(0, sgn));
      c.bezierCurveTo(...P(1, sgn), ...P(2, sgn), ...P(3, sgn)); c.bezierCurveTo(...P(4, sgn), ...P(5, sgn), ...P(6, sgn));
      c.lineTo(pts[6][0], 0); c.closePath();
    };
    // body with a soft paper shadow
    outline();
    c.shadowColor = 'rgba(20,24,40,.17)'; c.shadowBlur = 16 + 8 * fat; c.shadowOffsetX = 6; c.shadowOffsetY = 12;
    c.fillStyle = rgba(hov ? mix(col, WHITE, .25) : col, 1); c.fill();
    c.shadowColor = 'transparent'; c.shadowOffsetX = c.shadowOffsetY = 0;
    c.fillStyle = grain(c); c.fill();

    // each wing panel catches the light differently as the wave passes; the creases relax as she gets chubby
    const crisp = 1 - .85 * fat;
    for (const sgn of [1, -1]) {
      c.save(); wing(sgn); c.clip();
      const g = c.createLinearGradient(.6 * L, 0, -.64 * L, 0);
      for (const s of [0, .33, .66, 1]) {
        const v = .5 + sgn * .36 * Math.cos(ph - 3.4 * s) - (sgn > 0 ? .08 : -.04);
        g.addColorStop(s, v > .5 ? `rgba(255,255,255,${((v - .5) * .9 * crisp + .04).toFixed(3)})` : `rgba(20,24,40,${((.5 - v) * .32 * crisp).toFixed(3)})`);
      }
      c.fillStyle = g; c.fillRect(-L, -S * 1.2, L * 2, S * 2.4);
      // the fold along the spine: shadow on one side of the ridge, light on the other
      const f = c.createLinearGradient(0, 0, 0, sgn * S * .5);
      f.addColorStop(0, sgn > 0 ? `rgba(20,24,40,${(.16 * crisp).toFixed(3)})` : `rgba(255,255,255,${(.45 * crisp).toFixed(3)})`);
      f.addColorStop(1, 'rgba(255,255,255,0)');
      c.fillStyle = f; c.fillRect(-L, -S * 1.2, L * 2, S * 2.4);
      c.restore();
    }
    // folded creases: spine and the two diagonal wing folds
    if (crisp > .05) {
      c.lineWidth = 1;
      const crease = (x0, y0, x1, y1) => {
        c.strokeStyle = `rgba(255,255,255,${(.55 * crisp).toFixed(3)})`; c.beginPath(); c.moveTo(x0, y0 - .6); c.lineTo(x1, y1 - .6); c.stroke();
        c.strokeStyle = `rgba(20,24,40,${(.14 * crisp).toFixed(3)})`; c.beginPath(); c.moveTo(x0, y0 + .6); c.lineTo(x1, y1 + .6); c.stroke();
      };
      crease(pts[0][0] - 2, 0, pts[6][0] + 2, 0);
      for (const sgn of [1, -1]) { const t = P(3, sgn); crease(.06 * L, 0, t[0] * .92, t[1] * .92); }
    }
    // chubby: a pillowy puff with a little shine
    if (fat > .02) {
      c.save(); outline(); c.clip();
      const pg = c.createRadialGradient(.08 * L, 0, S * .1, .02 * L, 0, S * 1.05);
      pg.addColorStop(0, `rgba(255,255,255,${(.32 * fat).toFixed(3)})`); pg.addColorStop(.65, 'rgba(255,255,255,0)'); pg.addColorStop(1, `rgba(20,24,40,${(.16 * fat).toFixed(3)})`);
      c.fillStyle = pg; c.fillRect(-L, -S * 1.2, L * 2, S * 2.4);
      c.fillStyle = `rgba(255,255,255,${(.55 * fat).toFixed(3)})`;
      c.beginPath(); c.ellipse(.22 * L, -.42 * S, .12 * L, .045 * L, -.5, 0, 6.283); c.fill();
      c.restore();
    }
    // a few small light dots on the back
    if (!r.dots) r.dots = Array.from({ length: 5 }, () => [-.3 + Math.random() * .5, (Math.random() - .5) * .7, .02 + Math.random() * .012]);
    c.fillStyle = rgba(mix(col, WHITE, .7), .75);
    for (const [dx, dy, dr] of r.dots) { c.beginPath(); c.arc(dx * L, dy * S, Math.max(1, dr * L), 0, 6.283); c.fill(); }
    // edge
    outline(); c.lineJoin = 'round';
    c.lineWidth = hov ? 1.5 : .9; c.strokeStyle = hov ? 'rgba(42,59,209,.7)' : rgba(edge, .45); c.stroke();
    // eyes at the front corners of the head
    const ex = (.4 + .04 * fat) * L, ey = (.17 + .05 * fat) * S, er = Math.max(1.5, L * (.034 + .01 * fat));
    c.fillStyle = 'rgba(24,26,36,.88)';
    c.beginPath(); c.arc(ex, ey, er, 0, 6.283); c.arc(ex, -ey, er, 0, 6.283); c.fill();
    c.fillStyle = 'rgba(255,255,255,.9)';
    c.beginPath(); c.arc(ex + er * .3, ey - er * .35, er * .38, 0, 6.283); c.arc(ex + er * .3, -ey - er * .35, er * .38, 0, 6.283); c.fill();
    c.restore();
    return S;
  }
  window.PaperRay = { draw, COLORS };
})();
