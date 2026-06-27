// ascii.js - fit ASCII art to its container, and optionally animate it in.
//
// Detailed ASCII is wide, so rather than overflow or wrap (which would scramble
// the picture), we scale the glyph size down until the longest line fits.
//
// Markup contract (generate the art with scripts/asciify.mjs --figure):
//   <figure class="se-ascii" role="img" aria-label="...">
//     <pre class="se-ascii-art" aria-hidden="true">...the art...</pre>
//     <figcaption class="se-ascii-caption">...</figcaption>
//   </figure>
//
// Optional reveal animation (opt in on the <figure>):
//   data-reveal="typewriter" | "matrix" | "decode"   - how it builds on load
//   data-reveal-drift                                 - after it settles, a few
//                                                       characters keep quietly
//                                                       shifting so it stays alive
//   data-max="14" on the <pre> caps the glyph size for small art.
//
// With no data-reveal the art is simply fit and shown (the original behavior).
// Honors prefers-reduced-motion: shows the finished art at once, no drift.
// One IIFE, no dependencies.

(function () {
  'use strict';

  var figs = document.querySelectorAll('.se-ascii');
  if (!figs.length) return;

  var REDUCE = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;

  figs.forEach(function (fig) {
    var pre = fig.querySelector('.se-ascii-art') || fig.querySelector('pre');
    if (!pre) return;

    // The art may animate in via .reveal (reveal.js); never leave it trapped
    // invisible when reveal.js is absent (same guard as charts.js).
    if (fig.classList.contains('reveal')) fig.classList.add('is-visible');

    // Final art as a fixed grid, captured once so animation never reflows.
    var raw = pre.textContent.replace(/^\r?\n/, '').replace(/\s+$/, '');
    var lines = raw.split('\n');
    var nRows = lines.length;
    var nCols = 0, i;
    for (i = 0; i < nRows; i++) { if (lines[i].length > nCols) nCols = lines[i].length; }
    if (!nRows || !nCols) return;
    var grid = lines.map(function (l) {
      var a = l.split('');
      while (a.length < nCols) a.push(' ');
      return a;
    });

    var pool = (function () {
      var seen = {}, out = [], r, c, ch;
      for (r = 0; r < nRows; r++) { for (c = 0; c < nCols; c++) { ch = grid[r][c]; if (ch !== ' ' && !seen[ch]) { seen[ch] = 1; out.push(ch); } } }
      if (out.length < 8) out = out.concat('@#%&*+=-:.oO0'.split(''));
      return out;
    })();
    function rnd() { return pool[(Math.random() * pool.length) | 0]; }
    function paint(cells) { var s = '', i; for (i = 0; i < nRows; i++) { s += cells[i].join(''); if (i < nRows - 1) s += '\n'; } pre.textContent = s; }
    function clone() { var g = [], i; for (i = 0; i < nRows; i++) g.push(grid[i].slice()); return g; }
    function blank() { var g = [], i, j; for (i = 0; i < nRows; i++) { var row = []; for (j = 0; j < nCols; j++) row.push(' '); g.push(row); } return g; }

    function fit() {
      var cs = getComputedStyle(fig);
      var avail = fig.clientWidth - parseFloat(cs.paddingLeft || 0) - parseFloat(cs.paddingRight || 0);
      if (avail <= 0) return;
      pre.style.fontSize = '';
      var prev = pre.textContent;
      pre.textContent = lines.join('\n');                 // measure at base size, unwrapped
      var base = parseFloat(getComputedStyle(pre).fontSize) || 14;
      var natural = pre.scrollWidth;
      pre.textContent = prev;
      if (!natural) return;
      var max = parseFloat(pre.getAttribute('data-max')) || 16;
      // Fit a hair under so the art never overflows (which would clip or trap scroll).
      var size = Math.max(3.5, Math.min(max, base * ((avail - 2) / natural)));
      pre.style.fontSize = size.toFixed(2) + 'px';
    }

    var mode = (fig.getAttribute('data-reveal') || '').toLowerCase();
    var wantDrift = fig.hasAttribute('data-reveal-drift');
    var animatable = (mode === 'typewriter' || mode === 'matrix' || mode === 'decode');

    var rafId = null, driftTimer = null, played = false;
    function stopRaf() { if (rafId) { cancelAnimationFrame(rafId); rafId = null; } }
    function stopDrift() { if (driftTimer) { clearInterval(driftTimer); driftTimer = null; } }

    function startDrift() {
      stopDrift();
      if (REDUCE || !wantDrift) return;
      driftTimer = setInterval(function () {
        if (document.hidden || rafId) return;              // idle only; polite in background tabs
        var cells = clone();
        var k = 1 + ((Math.random() * 3) | 0);
        for (var n = 0; n < k; n++) {
          var r = (Math.random() * nRows) | 0, c = (Math.random() * nCols) | 0;
          if (grid[r][c] !== ' ') cells[r][c] = rnd();
        }
        paint(cells);
      }, 150);
    }

    function play() {
      stopRaf();
      fit();
      if (REDUCE) { paint(grid); startDrift(); return; }
      var dur = mode === 'typewriter' ? 1700 : 1500;
      var head = 3, M = nRows + head + 10, spd = [], off = [], lockT = null, c, r;
      if (mode === 'matrix') { for (c = 0; c < nCols; c++) { spd[c] = 1.0 + Math.random() * 0.6; off[c] = Math.random() * 8; } }
      if (mode === 'decode') { lockT = []; for (r = 0; r < nRows; r++) { lockT[r] = []; for (c = 0; c < nCols; c++) lockT[r][c] = grid[r][c] === ' ' ? 0 : Math.random() * dur * 0.72; } }
      paint(blank());
      var start = null;
      function frame(ts) {
        if (start === null) start = ts;
        var t = ts - start, p = t / dur; if (p > 1) p = 1;
        var cells, r2, c2;
        if (mode === 'typewriter') {
          var ease = p * p * (3 - 2 * p);
          var revealed = Math.floor(ease * nRows * nCols), k = 0;
          cells = clone();
          for (r2 = 0; r2 < nRows; r2++) { for (c2 = 0; c2 < nCols; c2++) {
            if (k > revealed) cells[r2][c2] = ' ';
            else if (k === revealed && p < 1) cells[r2][c2] = '█';   // cursor block
            k++;
          } }
        } else if (mode === 'matrix') {
          cells = [];
          for (r2 = 0; r2 < nRows; r2++) cells[r2] = [];
          for (c2 = 0; c2 < nCols; c2++) {
            var front = p * M * spd[c2] - off[c2];
            for (r2 = 0; r2 < nRows; r2++) {
              var g2 = grid[r2][c2];
              if (r2 < front - head) cells[r2][c2] = g2;
              else if (r2 < front) cells[r2][c2] = (g2 === ' ' ? ' ' : rnd());
              else cells[r2][c2] = ' ';
            }
          }
        } else {                                            // decode
          cells = [];
          for (r2 = 0; r2 < nRows; r2++) { cells[r2] = []; for (c2 = 0; c2 < nCols; c2++) { var g3 = grid[r2][c2]; cells[r2][c2] = g3 === ' ' ? ' ' : (t >= lockT[r2][c2] ? g3 : rnd()); } }
        }
        if (p >= 1) { paint(grid); startDrift(); rafId = null; return; }
        paint(cells);
        rafId = requestAnimationFrame(frame);
      }
      rafId = requestAnimationFrame(frame);
    }

    // ---- run it ----
    fit();
    if (animatable) {
      paint(blank());                                       // no flash of the finished art
      var trigger = function () { if (!played) { played = true; play(); } };
      if ('IntersectionObserver' in window) {
        var io = new IntersectionObserver(function (ents) {
          ents.forEach(function (e) { if (e.isIntersecting) { io.unobserve(e.target); trigger(); } });
        }, { threshold: 0.25 });
        io.observe(fig);
      } else {
        trigger();
      }
    }

    var t = 0;
    function onResize() { window.clearTimeout(t); t = window.setTimeout(function () { fit(); if (!rafId) paint(grid); }, 120); }
    if (typeof ResizeObserver !== 'undefined') new ResizeObserver(onResize).observe(fig);
    else window.addEventListener('resize', onResize, { passive: true });

    if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { fit(); if (!rafId && (played || !animatable)) paint(grid); });
  });
})();
