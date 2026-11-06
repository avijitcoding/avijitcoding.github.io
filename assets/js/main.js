/* Avijit Saha Asru: personal site scripts
   1. Theme toggle   2. Section highlighting in the nav
   3. Copy BibTeX    4. Live Pareto-front animation in the hero */

(function () {
  'use strict';

  var root = document.documentElement;
  var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- 1. Theme toggle ---------- */
  var themeBtn = document.getElementById('theme-toggle');
  function currentTheme() {
    var set = root.getAttribute('data-theme');
    if (set) return set;
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  function syncThemeLabel() {
    if (!themeBtn) return;
    themeBtn.setAttribute('aria-label', currentTheme() === 'dark' ? 'Switch to light theme' : 'Switch to dark theme');
  }
  if (themeBtn) {
    syncThemeLabel();
    themeBtn.addEventListener('click', function () {
      var next = currentTheme() === 'dark' ? 'light' : 'dark';
      root.setAttribute('data-theme', next);
      try { localStorage.setItem('theme', next); } catch (e) { /* storage unavailable: theme lasts for this visit */ }
      syncThemeLabel();
    });
  }

  /* ---------- 2. Highlight the current section in the nav ----------
     The active link is the last linked section whose top has passed 40% of the
     viewport, so unlisted sections (News, Education, ...) keep the link above them lit. */
  var navLinks = Array.prototype.slice.call(document.querySelectorAll('.site-nav a[href^="#"]'));
  var targets = navLinks.map(function (a) { return document.getElementById(a.getAttribute('href').slice(1)); });
  var spyQueued = false;
  function updateSpy() {
    spyQueued = false;
    var line = window.innerHeight * 0.4, active = -1;
    targets.forEach(function (sec, i) { if (sec && sec.getBoundingClientRect().top <= line) active = i; });
    if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4) active = targets.length - 1;
    navLinks.forEach(function (a, i) {
      if (i === active) a.setAttribute('aria-current', 'true'); else a.removeAttribute('aria-current');
    });
  }
  if (navLinks.length) {
    window.addEventListener('scroll', function () { if (!spyQueued) { spyQueued = true; requestAnimationFrame(updateSpy); } }, { passive: true });
    window.addEventListener('resize', updateSpy);
    updateSpy();
  }

  /* ---------- 3. Copy BibTeX ---------- */
  document.querySelectorAll('[data-copy]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var src = document.getElementById(btn.getAttribute('data-copy'));
      if (!src) return;
      var label = btn.textContent;
      var done = function (msg) { btn.textContent = msg; setTimeout(function () { btn.textContent = label; }, 1600); };
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(src.textContent).then(function () { done('Copied'); }, function () { done('Select and copy the text above'); });
      } else {
        done('Select and copy the text above');
      }
    });
  });

  /* ---------- 4. Pareto-front animation ----------
     Two objectives, both maximized. The true front is a superellipse
     x^P + y^P = 1. A toy sequential optimizer starts with a few
     space-filling points, then samples near the largest gap in the
     current front, getting closer to the true front over time.
     The gold region is the hypervolume dominated by the front,
     measured against the reference point (0, 0). */
  var svg = document.getElementById('pareto');
  if (!svg) return;

  var NS = 'http://www.w3.org/2000/svg';
  var W = 420, H = 316, pad = { l: 40, r: 14, t: 10, b: 40 };
  var iw = W - pad.l - pad.r, ih = H - pad.t - pad.b;
  var P = 2.6, TOTAL = 40, INIT = 6, TICK = 170;
  var nOut = document.getElementById('pf-n');
  var hvOut = document.getElementById('pf-hv');
  var runBtn = document.getElementById('pf-run');

  function sx(v) { return (pad.l + v * iw).toFixed(1); }
  function sy(v) { return (pad.t + (1 - v) * ih).toFixed(1); }
  function el(name, attrs, parent) {
    var n = document.createElementNS(NS, name);
    for (var k in attrs) n.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(n);
    return n;
  }
  function frontAt(theta) {
    var c = Math.cos(theta), s = Math.sin(theta);
    var t = Math.pow(Math.pow(c, P) + Math.pow(s, P), -1 / P);
    return [t * c, t * s];
  }
  var TRUE_HV = (function () {
    var a = 0, n = 2000;
    for (var i = 0; i < n; i++) { var x = (i + 0.5) / n; a += Math.pow(1 - Math.pow(x, P), 1 / P) / n; }
    return a;
  })();
  function rng(seed) { // mulberry32
    return function () {
      seed |= 0; seed = (seed + 0x6D2B79F5) | 0;
      var t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  function paretoFront(pts) { // returns front sorted by x descending (y ascending)
    var s = pts.slice().sort(function (a, b) { return b.x - a.x || b.y - a.y; });
    var f = [], best = -1;
    for (var i = 0; i < s.length; i++) if (s[i].y > best) { f.push(s[i]); best = s[i].y; }
    return f;
  }
  function hypervolume(f) {
    var a = 0, prev = 0;
    for (var i = 0; i < f.length; i++) { a += f[i].x * (f[i].y - prev); prev = f[i].y; }
    return a;
  }
  function clamp(v) { return Math.min(0.985, Math.max(0.03, v)); }

  function generate(seed) {
    var r = rng(seed), pts = [];
    for (var k = 0; k < TOTAL; k++) {
      var p;
      if (k < INIT || r() < 0.12) {
        var th0 = r() * Math.PI / 2, rad0 = 0.22 + 0.5 * r(), q0 = frontAt(th0);
        p = { x: q0[0] * rad0, y: q0[1] * rad0 };
      } else {
        var f = paretoFront(pts);
        var angs = f.map(function (q) { return Math.atan2(q.y, q.x); }).sort(function (a, b) { return a - b; });
        angs.unshift(0); angs.push(Math.PI / 2);
        var gi = 1, gap = 0;
        for (var i = 1; i < angs.length; i++) { var d = angs[i] - angs[i - 1]; if (d > gap) { gap = d; gi = i; } }
        var th = angs[gi - 1] + gap * (0.25 + 0.5 * r());
        var prog = (k - INIT) / (TOTAL - INIT);
        var rad = 1 - (0.26 * (1 - prog) + 0.02) * r() - 0.012;
        var q = frontAt(th);
        p = { x: q[0] * rad, y: q[1] * rad };
      }
      p.x = clamp(p.x); p.y = clamp(p.y); p.k = k;
      pts.push(p);
    }
    return pts;
  }

  // Static layers
  var gGrid = el('g', { 'class': 'pf-grid' }, svg);
  for (var gx = 0; gx <= 4; gx++) {
    var v = gx / 4;
    el('line', { x1: sx(v), y1: sy(0), x2: sx(v), y2: sy(1) }, gGrid);
    el('line', { x1: sx(0), y1: sy(v), x2: sx(1), y2: sy(v) }, gGrid);
  }
  var hvPath = el('path', { 'class': 'pf-hv', d: '' }, svg);
  var trueD = '';
  for (var ti = 0; ti <= 60; ti++) {
    var tq = frontAt((ti / 60) * Math.PI / 2);
    trueD += (ti ? 'L' : 'M') + sx(tq[0]) + ' ' + sy(tq[1]);
  }
  el('path', { 'class': 'pf-true', d: trueD }, svg);
  var frontPath = el('path', { 'class': 'pf-front', d: '' }, svg);
  el('path', { 'class': 'pf-axis', d: 'M' + sx(0) + ' ' + sy(1.02) + 'V' + sy(0) + 'H' + sx(1.02) }, svg);
  var ref = el('g', { 'class': 'pf-ref' }, svg);
  el('line', { x1: +sx(0) - 4, y1: +sy(0) - 4, x2: +sx(0) + 4, y2: +sy(0) + 4 }, ref);
  el('line', { x1: +sx(0) - 4, y1: +sy(0) + 4, x2: +sx(0) + 4, y2: +sy(0) - 4 }, ref);
  var lx = el('text', { 'class': 'pf-label', x: sx(1), y: H - 12, 'text-anchor': 'end' }, svg);
  lx.textContent = 'objective 1 → maximize';
  var ly = el('text', { 'class': 'pf-label', x: 0, y: 0, 'text-anchor': 'end', transform: 'translate(' + (pad.l - 14) + ' ' + sy(1) + ') rotate(-90)' }, svg);
  ly.textContent = 'objective 2 → maximize';
  var lr = el('text', { 'class': 'pf-label', x: +sx(0) + 8, y: +sy(0) + 16 }, svg);
  lr.textContent = 'reference point';
  var gDots = el('g', {}, svg);

  var pts = [], shown = 0, timer = null, circles = [];

  function draw(animateNewest) {
    var cur = pts.slice(0, shown);
    var f = paretoFront(cur);
    var onFront = {};
    f.forEach(function (p) { onFront[p.k] = true; });

    if (f.length) {
      var hd = 'M' + sx(0) + ' ' + sy(0) + 'L' + sx(f[0].x) + ' ' + sy(0);
      var fd = 'M' + sx(f[0].x) + ' ' + sy(0) + 'L' + sx(f[0].x) + ' ' + sy(f[0].y);
      hd += 'L' + sx(f[0].x) + ' ' + sy(f[0].y);
      for (var i = 1; i < f.length; i++) {
        hd += 'L' + sx(f[i].x) + ' ' + sy(f[i - 1].y) + 'L' + sx(f[i].x) + ' ' + sy(f[i].y);
        fd += 'L' + sx(f[i].x) + ' ' + sy(f[i - 1].y) + 'L' + sx(f[i].x) + ' ' + sy(f[i].y);
      }
      var last = f[f.length - 1];
      hd += 'L' + sx(0) + ' ' + sy(last.y) + 'Z';
      fd += 'L' + sx(0) + ' ' + sy(last.y);
      hvPath.setAttribute('d', hd);
      frontPath.setAttribute('d', fd);
    } else {
      hvPath.setAttribute('d', '');
      frontPath.setAttribute('d', '');
    }

    for (var j = 0; j < cur.length; j++) {
      var p = cur[j];
      if (!circles[j]) {
        circles[j] = el('circle', { 'class': 'pf-dot', cx: sx(p.x), cy: sy(p.y), r: 4 }, gDots);
        if (animateNewest && j === cur.length - 1) {
          circles[j].classList.add('is-new');
          var ring = el('circle', { 'class': 'pf-ring', cx: sx(p.x), cy: sy(p.y), r: 5 }, gDots);
          setTimeout(ring.remove.bind(ring), 900);
        }
      }
      circles[j].classList.toggle('is-front', !!onFront[p.k]);
    }

    if (nOut) nOut.textContent = String(shown);
    if (hvOut) hvOut.textContent = Math.round(100 * hypervolume(f) / TRUE_HV) + '%';
  }

  function run(seed) {
    if (timer) { clearInterval(timer); timer = null; }
    while (gDots.firstChild) gDots.removeChild(gDots.firstChild);
    circles = [];
    pts = generate(seed);
    if (reduceMotion) { shown = TOTAL; draw(false); return; }
    shown = 0; draw(false);
    timer = setInterval(function () {
      shown++;
      draw(true);
      if (shown >= TOTAL) { clearInterval(timer); timer = null; }
    }, TICK);
  }

  if (runBtn) runBtn.addEventListener('click', function () { run((Date.now() % 100000) + 1); });

  // Start when the chart scrolls into view (it is in view on load for most screens).
  var started = false;
  function start() { if (!started) { started = true; setTimeout(function () { run(20261105); }, reduceMotion ? 0 : 450); } }
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      if (entries[0].isIntersecting) { start(); io.disconnect(); }
    }, { threshold: 0.3 });
    io.observe(svg);
  } else {
    start();
  }
})();
