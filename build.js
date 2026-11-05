// Runs on Vercel at build time: copies the site and its art/ folder into public/,
// then pulls the artwork images from her current site (including the hero banner).
const fs = require('fs'), path = require('path');
const SITE = 'https://www.jeanettejanvier.com';
const OUT = 'public';
fs.mkdirSync(path.join(OUT, 'art'), { recursive: true });
for (const f of ['index.html', 'contact.html', 'feed.js', 'rays.js']) fs.copyFileSync(f, path.join(OUT, f));
for (const f of fs.readdirSync('art')) fs.copyFileSync(path.join('art', f), path.join(OUT, 'art', f));   // her own photos, kept in the repository
(async () => {
  const found = new Set();
  const grab = (txt, base) => {
    txt = txt.replace(/\\\//g, '/').replace(/&quot;/g, '"').replace(/&#39;/g, "'");
    const re = /(?:url\(\s*["']?|src=["']|data-src=["']|srcset=["']|content=["'])([^"')\s,]+?\.(?:jpe?g|png|webp))/gi;
    let m; while ((m = re.exec(txt))) { try { found.add(new URL(m[1], base).href); } catch {} }
  };
  try {
    const html = await (await fetch(SITE + '/')).text();
    grab(html, SITE + '/');
    const css = [...html.matchAll(/<link[^>]+href=["']([^"']+\.css[^"']*)["']/gi)].map(m => new URL(m[1], SITE + '/').href);
    for (const c of css) { try { grab(await (await fetch(c)).text(), c); } catch {} }
  } catch (e) { console.log('fetch failed', e.message); }
  const list = [...found].map(u => u.replace(/^http:/, 'https:')).filter(u => /jeanettejanvier\.com\/(uploads|files)\//.test(u));
  console.log('candidates', [...new Set(list)]);
  const out = []; let i = 0; const seen = new Set();
  for (const u of new Set(list)) {
    try {
      const r = await fetch(u); if (!r.ok) continue;
      const b = Buffer.from(await r.arrayBuffer()); if (b.length < 30000) continue;
      const ext = ((u.match(/\.(jpe?g|png|webp)/i) || [, 'jpg'])[1]).toLowerCase();
      const key = b.length + ':' + b.subarray(0, 64).toString('hex'); if (seen.has(key)) continue; seen.add(key);
      const name = `art/${i++}.${ext}`;
      fs.writeFileSync(path.join(OUT, name), b);
      out.push({ src: '/' + name, orig: u, bytes: b.length, banner: /background|banner|header/i.test(u) && !/image-5_orig/.test(u) });
    } catch {}
  }
  out.sort((a, b) => (b.banner - a.banner) || (b.bytes - a.bytes));
  fs.writeFileSync(path.join(OUT, 'art.json'), JSON.stringify(out, null, 1));
  console.log('saved', out);
})();
