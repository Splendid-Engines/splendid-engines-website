// Splendid chart module — small, dependency-free SVG charts for writing pieces.
// A data-driven cousin of talking-head.js: the article carries only the data,
// this file draws it. Change the look or the motion here and every chart on the
// site updates at once. One IIFE, no libraries.
//
// Markup contract (the article holds data + options only):
//
//   <figure class="se-chart reveal" data-se-chart>
//     <figcaption class="se-chart-title">Most trusted source for upskilling</figcaption>
//     <script type="application/json" class="se-chart-data">
//     {
//       "type": "bar",            // "bar" | "line" | "area"
//       "format": "percent",      // "percent" | "number" (axis + readout formatting)
//       "categories": ["Industry peers", "Vendor content", "Trade journalists"],
//       "series": [
//         { "name": "All buyers", "color": "lagoon", "values": [47, 15, 13] }
//       ]
//     }
//     </script>
//   </figure>
//
// Colors are brand-token names (lagoon / poppy / lake / daffodil / mate); the
// renderer reads the live CSS variable so a palette change in custom.css flows
// through. Multiple series render as a legend of toggle chips (click to show or
// hide a series — the "toggleable" charts). Charts animate in on first scroll
// into view and respect prefers-reduced-motion. A visually-hidden data table is
// always emitted for screen readers, and a <noscript> author fallback is honored
// if present, so the data is never trapped in JavaScript.

(function () {
  'use strict';

  var figures = document.querySelectorAll('figure.se-chart[data-se-chart]');
  if (!figures.length) return;

  var SVGNS = 'http://www.w3.org/2000/svg';
  var mq = window.matchMedia;
  var prefersReduced = mq && mq('(prefers-reduced-motion: reduce)').matches;

  // Brand palette fallbacks (the locked hexes). The live value of the matching
  // CSS custom property wins when present, so editing the token cascades here.
  var PALETTE = {
    lagoon: '#153047',
    poppy: '#DB4937',
    lake: '#377BDB',
    daffodil: '#F2ED44',
    mate: '#575C45'
  };
  var DEFAULT_SERIES_COLORS = ['lagoon', 'poppy', 'lake', 'mate'];

  function tokenColor(name) {
    if (!name) return PALETTE.lagoon;
    if (name.charAt(0) === '#') return name;             // explicit hex passes through
    try {
      var v = getComputedStyle(document.documentElement)
        .getPropertyValue('--' + name).trim();
      if (v) return v;
    } catch (e) { /* fall through to the static map */ }
    return PALETTE[name] || PALETTE.lagoon;
  }

  figures.forEach(function (fig) {
    // Never break the page over one chart, but do surface the reason in the console.
    try { initChart(fig); } catch (e) { if (window.console && console.warn) console.warn('[se-chart] init failed:', e); }
  });

  function initChart(fig) {
    var dataEl = fig.querySelector('script.se-chart-data');
    if (!dataEl || !dataEl.textContent.trim()) return;

    var spec;
    try { spec = JSON.parse(dataEl.textContent); } catch (e) { return; }
    spec = normalize(spec);
    if (!spec) return;

    // A chart animates itself (below), so it must never be left invisible by the
    // reveal.js entrance gate. If an author tagged the figure .reveal, un-hide it
    // here; the bar/line draw-in is the entrance.
    if (fig.classList.contains('reveal')) fig.classList.add('is-visible');

    // Build the structure once: a draw surface + a legend + a readout tooltip.
    var surface = document.createElement('div');
    surface.className = 'se-chart-surface';

    var tip = document.createElement('div');
    tip.className = 'se-chart-tip';
    tip.setAttribute('role', 'status');
    tip.setAttribute('aria-live', 'polite');
    tip.hidden = true;
    surface.appendChild(tip);

    var legend = document.createElement('div');
    legend.className = 'se-chart-legend';

    // Insert the rendered pieces right after the JSON (and any figcaption stays on top).
    fig.appendChild(surface);
    if (spec.series.length > 1) fig.appendChild(legend);

    // A visually-hidden table is the canonical accessible representation. We add
    // it always (it doubles as the no-JS fallback if the author left none).
    if (!fig.querySelector('noscript')) {
      fig.appendChild(buildTable(spec, true));
    }

    var hidden = {};                 // series name -> hidden?
    var hasAnimated = false;

    function visibleSeries() {
      return spec.series.filter(function (s) { return !hidden[s.name]; });
    }

    function render(animate) {
      var width = Math.max(280, Math.floor(surface.clientWidth || fig.clientWidth || 640));
      var height = Math.round(Math.min(420, Math.max(240, width * 0.52)));
      var svg = drawChart(spec, visibleSeries(), width, height, {
        animate: animate && !prefersReduced,
        onReadout: showTip,
        onClear: hideTip
      });
      var old = surface.querySelector('svg');
      if (old) surface.removeChild(old);
      surface.insertBefore(svg, tip);
    }

    function showTip(label, x, y) {
      tip.textContent = label;
      tip.hidden = false;
      // Clamp within the surface so the readout never spills past the edges.
      var w = surface.clientWidth;
      tip.style.left = Math.max(4, Math.min(w - tip.offsetWidth - 4, x - tip.offsetWidth / 2)) + 'px';
      tip.style.top = Math.max(0, y - tip.offsetHeight - 10) + 'px';
    }
    function hideTip() { tip.hidden = true; }

    if (spec.series.length > 1) buildLegend();

    function buildLegend() {
      legend.innerHTML = '';
      spec.series.forEach(function (s) {
        var chip = document.createElement('button');
        chip.type = 'button';
        chip.className = 'se-chart-chip';
        chip.setAttribute('aria-pressed', hidden[s.name] ? 'false' : 'true');
        var sw = document.createElement('span');
        sw.className = 'se-chart-swatch';
        sw.style.background = tokenColor(s.color);
        chip.appendChild(sw);
        chip.appendChild(document.createTextNode(s.name));
        chip.addEventListener('click', function () {
          // Keep at least one series on screen.
          if (!hidden[s.name] && visibleSeries().length === 1) return;
          hidden[s.name] = !hidden[s.name];
          chip.setAttribute('aria-pressed', hidden[s.name] ? 'false' : 'true');
          chip.classList.toggle('is-off', !!hidden[s.name]);
          render(false);
        });
        legend.appendChild(chip);
      });
    }

    // First paint with no animation (so layout is correct even off-screen),
    // then animate the first time it scrolls into view.
    render(false);

    if (prefersReduced || typeof IntersectionObserver === 'undefined') {
      hasAnimated = true;
    } else {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting || hasAnimated) return;
          hasAnimated = true;
          render(true);
          io.unobserve(fig);
        });
      }, { threshold: 0.25 });
      io.observe(fig);
    }

    // Re-render (no animation) on width changes so labels and bars stay crisp.
    var resizeTimer = 0, lastWidth = surface.clientWidth;
    function onResize() {
      window.clearTimeout(resizeTimer);
      resizeTimer = window.setTimeout(function () {
        var w = surface.clientWidth;
        if (Math.abs(w - lastWidth) < 8) return;   // ignore sub-pixel jitter
        lastWidth = w;
        render(false);
      }, 150);
    }
    if (typeof ResizeObserver !== 'undefined') {
      new ResizeObserver(onResize).observe(surface);
    } else {
      window.addEventListener('resize', onResize, { passive: true });
    }
  }

  // ---- spec hygiene ----------------------------------------------------------

  function normalize(spec) {
    if (!spec || typeof spec !== 'object') return null;
    var type = (spec.type || 'bar').toLowerCase();
    if (type !== 'bar' && type !== 'line' && type !== 'area') type = 'bar';
    var categories = Array.isArray(spec.categories) ? spec.categories.map(String) : [];
    if (!categories.length) return null;

    var rawSeries = Array.isArray(spec.series) ? spec.series : [];
    var series = [];
    rawSeries.forEach(function (s, i) {
      if (!s || !Array.isArray(s.values)) return;
      series.push({
        name: s.name != null ? String(s.name) : ('Series ' + (i + 1)),
        color: s.color || DEFAULT_SERIES_COLORS[i % DEFAULT_SERIES_COLORS.length],
        values: categories.map(function (_, j) {
          var n = parseFloat(s.values[j]);
          return isFinite(n) ? n : 0;
        })
      });
    });
    if (!series.length) return null;

    return {
      type: type,
      format: spec.format === 'number' ? 'number' : (spec.format === 'percent' ? 'percent' : (spec.format || null)),
      prefix: spec.prefix || '',
      suffix: spec.suffix != null ? spec.suffix : (spec.format === 'percent' ? '%' : ''),
      yLabel: spec.yLabel || '',
      max: isFinite(parseFloat(spec.max)) ? parseFloat(spec.max) : null,
      categories: categories,
      series: series
    };
  }

  function fmt(spec, v) {
    var s = (Math.round(v * 100) / 100).toLocaleString();
    return spec.prefix + s + spec.suffix;
  }

  // "Nice" axis maximum a touch above the data so bars don't kiss the ceiling.
  function niceMax(spec, series) {
    if (spec.max != null) return spec.max;
    var m = 0;
    series.forEach(function (s) { s.values.forEach(function (v) { if (v > m) m = v; }); });
    if (m <= 0) return 1;
    var pow = Math.pow(10, Math.floor(Math.log(m) / Math.LN10));
    var steps = [1, 2, 2.5, 5, 10];
    for (var i = 0; i < steps.length; i++) {
      var cand = steps[i] * pow;
      if (cand >= m * 1.05) return cand;
    }
    return 10 * pow;
  }

  // ---- drawing ---------------------------------------------------------------

  function el(name, attrs) {
    var node = document.createElementNS(SVGNS, name);
    if (attrs) for (var k in attrs) if (attrs.hasOwnProperty(k)) node.setAttribute(k, attrs[k]);
    return node;
  }

  function drawChart(spec, series, width, height, opts) {
    var padL = 44, padR = 12, padT = 12, padB = 38;
    var plotW = width - padL - padR;
    var plotH = height - padT - padB;
    var max = niceMax(spec, series);

    var svg = el('svg', {
      viewBox: '0 0 ' + width + ' ' + height,
      width: width, height: height,
      class: 'se-chart-svg', role: 'img'
    });
    svg.setAttribute('aria-label', ariaSummary(spec, series));

    function y(v) { return padT + plotH - (v / max) * plotH; }

    // Gridlines + y labels (5 steps).
    var TICKS = 4;
    for (var t = 0; t <= TICKS; t++) {
      var gv = (max / TICKS) * t;
      var gy = y(gv);
      svg.appendChild(el('line', {
        x1: padL, x2: width - padR, y1: gy, y2: gy, class: 'se-chart-grid'
      }));
      var lbl = el('text', { x: padL - 8, y: gy + 4, class: 'se-chart-axis se-chart-axis-y' });
      lbl.textContent = fmt(spec, gv);
      svg.appendChild(lbl);
    }

    var n = spec.categories.length;
    var band = plotW / n;

    // X category labels.
    spec.categories.forEach(function (cat, i) {
      var cx = padL + band * (i + 0.5);
      var tx = el('text', { x: cx, y: height - padB + 18, class: 'se-chart-axis se-chart-axis-x' });
      tx.textContent = cat;
      svg.appendChild(tx);
    });

    if (spec.type === 'bar') {
      drawBars(svg, spec, series, { padL: padL, band: band, y: y, baseY: y(0), animate: opts.animate, onReadout: opts.onReadout, onClear: opts.onClear });
    } else {
      drawLines(svg, spec, series, { padL: padL, band: band, plotH: plotH, y: y, baseY: y(0), area: spec.type === 'area', animate: opts.animate, onReadout: opts.onReadout, onClear: opts.onClear });
    }

    return svg;
  }

  function drawBars(svg, spec, series, g) {
    var k = series.length;
    var groupW = g.band * 0.7;
    var gap = g.band * 0.04;
    var barW = (groupW - gap * (k - 1)) / k;

    series.forEach(function (s, si) {
      var color = tokenColor(s.color);
      s.values.forEach(function (v, i) {
        var x = g.padL + g.band * i + (g.band - groupW) / 2 + si * (barW + gap);
        var topY = g.y(v);
        var h = Math.max(0, g.baseY - topY);
        var rect = el('rect', {
          x: x, width: barW, rx: 2,
          y: g.animate ? g.baseY : topY,
          height: g.animate ? 0 : h,
          fill: color, class: 'se-chart-bar', tabindex: '0',
          role: 'img', 'aria-label': s.name + ', ' + spec.categories[i] + ': ' + fmt(spec, v)
        });
        bindReadout(rect, g, x + barW / 2, topY, label(spec, s, i, v));
        svg.appendChild(rect);
        if (g.animate) {
          // Grow from the baseline. A tiny per-bar stagger gives it life.
          rect.style.transition = 'y 0.7s cubic-bezier(0.22,1,0.36,1), height 0.7s cubic-bezier(0.22,1,0.36,1)';
          rect.style.transitionDelay = (i * 45 + si * 20) + 'ms';
          requestAnimationFrame(function () {
            requestAnimationFrame(function () {
              rect.setAttribute('y', topY);
              rect.setAttribute('height', h);
            });
          });
        }
      });
    });
  }

  function drawLines(svg, spec, series, g) {
    series.forEach(function (s) {
      var color = tokenColor(s.color);
      var pts = s.values.map(function (v, i) {
        return { x: g.padL + g.band * (i + 0.5), y: g.y(v), v: v, i: i };
      });
      var d = pts.map(function (p, i) { return (i ? 'L' : 'M') + p.x + ' ' + p.y; }).join(' ');

      if (g.area) {
        var areaD = d + ' L' + pts[pts.length - 1].x + ' ' + g.baseY + ' L' + pts[0].x + ' ' + g.baseY + ' Z';
        var fill = el('path', { d: areaD, fill: color, class: 'se-chart-area' });
        svg.appendChild(fill);
      }

      var path = el('path', { d: d, fill: 'none', stroke: color, class: 'se-chart-line' });
      svg.appendChild(path);

      if (g.animate && path.getTotalLength) {
        var len = path.getTotalLength();
        path.style.strokeDasharray = len;
        path.style.strokeDashoffset = len;
        path.style.transition = 'stroke-dashoffset 0.9s ease-out';
        requestAnimationFrame(function () {
          requestAnimationFrame(function () { path.style.strokeDashoffset = '0'; });
        });
      }

      pts.forEach(function (p) {
        var dot = el('circle', {
          cx: p.x, cy: p.y, r: 4, fill: color, class: 'se-chart-dot', tabindex: '0',
          role: 'img', 'aria-label': s.name + ', ' + spec.categories[p.i] + ': ' + fmt(spec, p.v)
        });
        bindReadout(dot, g, p.x, p.y, label(spec, s, p.i, p.v));
        svg.appendChild(dot);
        if (g.animate) {
          dot.style.opacity = '0';
          dot.style.transition = 'opacity 0.3s ease-out';
          dot.style.transitionDelay = (350 + p.i * 60) + 'ms';
          requestAnimationFrame(function () {
            requestAnimationFrame(function () { dot.style.opacity = '1'; });
          });
        }
      });
    });
  }

  function label(spec, s, i, v) {
    var prefix = spec.series.length > 1 ? s.name + ' — ' : '';
    return prefix + spec.categories[i] + ': ' + fmt(spec, v);
  }

  // Hover and keyboard focus both surface the readout near the mark.
  function bindReadout(node, g, px, py, text) {
    function show() { if (g.onReadout) g.onReadout(text, px, py); }
    function clear() { if (g.onClear) g.onClear(); }
    node.addEventListener('mouseenter', show);
    node.addEventListener('mouseleave', clear);
    node.addEventListener('focus', show);
    node.addEventListener('blur', clear);
  }

  function ariaSummary(spec, series) {
    var head = (spec.type === 'bar' ? 'Bar chart' : (spec.type === 'area' ? 'Area chart' : 'Line chart'));
    var names = series.map(function (s) { return s.name; }).join(', ');
    return head + (series.length > 1 ? ' comparing ' + names : '') +
      ' across ' + spec.categories.length + ' categories. See the data table that follows.';
  }

  function buildTable(spec, visuallyHidden) {
    var wrap = document.createElement('div');
    wrap.className = 'se-chart-table' + (visuallyHidden ? ' se-visually-hidden' : '');
    var table = document.createElement('table');
    var thead = document.createElement('thead');
    var hrow = document.createElement('tr');
    hrow.appendChild(th(''));
    spec.series.forEach(function (s) { hrow.appendChild(th(s.name)); });
    thead.appendChild(hrow);
    table.appendChild(thead);
    var tbody = document.createElement('tbody');
    spec.categories.forEach(function (cat, i) {
      var row = document.createElement('tr');
      row.appendChild(th(cat));
      spec.series.forEach(function (s) {
        var td = document.createElement('td');
        td.textContent = fmt(spec, s.values[i]);
        row.appendChild(td);
      });
      tbody.appendChild(row);
    });
    table.appendChild(tbody);
    wrap.appendChild(table);
    return wrap;
  }

  function th(text) { var c = document.createElement('th'); c.scope = 'col'; c.textContent = text; return c; }
})();
