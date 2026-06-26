// ascii.js - fit ASCII art to its container. Detailed ASCII is wide, so rather
// than overflow or wrap (which would scramble the picture), we scale the glyph
// size down until the longest line fits. One IIFE, no dependencies.
//
// Markup contract (generate with scripts/asciify.mjs --figure):
//   <figure class="se-ascii" role="img" aria-label="...">
//     <pre class="se-ascii-art" aria-hidden="true">...the art...</pre>
//     <figcaption class="se-ascii-caption">...</figcaption>
//   </figure>
//
// Optional: data-max="14" on the <pre> caps the glyph size for small art.

(function () {
  'use strict';

  var arts = document.querySelectorAll('.se-ascii .se-ascii-art');
  if (!arts.length) return;

  arts.forEach(function (pre) {
    var fig = pre.closest('.se-ascii') || pre.parentElement;

    // The art animates in via .reveal if present, but must never be trapped
    // invisible when reveal.js is absent (same guard as charts.js).
    if (fig.classList.contains('reveal')) fig.classList.add('is-visible');

    function fit() {
      var cs = getComputedStyle(fig);
      var avail = fig.clientWidth - parseFloat(cs.paddingLeft || 0) - parseFloat(cs.paddingRight || 0);
      if (avail <= 0) return;
      pre.style.fontSize = '';                                   // back to the CSS base
      var base = parseFloat(getComputedStyle(pre).fontSize) || 14;
      var natural = pre.scrollWidth;                             // unwrapped content width at base
      if (!natural) return;
      var max = parseFloat(pre.getAttribute('data-max')) || 16;
      // Fit a hair under the column so the art never overflows (which would clip or trap scroll).
      var size = Math.max(3.5, Math.min(max, base * ((avail - 2) / natural)));
      pre.style.fontSize = size.toFixed(2) + 'px';
    }

    fit();

    var t = 0;
    function onResize() {
      window.clearTimeout(t);
      t = window.setTimeout(fit, 120);
    }
    if (typeof ResizeObserver !== 'undefined') new ResizeObserver(onResize).observe(fig);
    else window.addEventListener('resize', onResize, { passive: true });

    // Re-fit once webfonts settle, in case the mono metrics shifted.
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(fit);
  });
})();
