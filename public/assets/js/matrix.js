// matrix.js — a basic framework matrix: a labeled grid where each cell reveals
// its detail on hover, tap, or keyboard focus. Data-driven, like charts.js; the
// article carries only the config. One IIFE, no dependencies.
//
// Markup contract:
//   <figure class="se-matrix" data-se-matrix>
//     <figcaption class="se-matrix-title">Optional title</figcaption>
//     <script type="application/json" class="se-matrix-data">
//     {
//       "xLabel": "Time", "yLabel": "Stance",
//       "columns": ["Past", "Present", "Future"],
//       "rows": ["Analytical", "Opinion"],
//       "cells": [
//         { "row": 0, "col": 0, "title": "Case study", "detail": "What happened and why it worked." }
//       ]
//     }
//     </script>
//   </figure>
//
// `cells` may be a flat list with row/col indices (above) or a 2D array
// [[{title,detail}, ...rows]]. Each cell: title (required), detail, tag (optional).

(function () {
  'use strict';

  var figures = document.querySelectorAll('figure.se-matrix[data-se-matrix]');
  if (!figures.length) return;

  figures.forEach(function (fig) {
    try { initMatrix(fig); } catch (e) { if (window.console && console.warn) console.warn('[se-matrix] init failed:', e); }
  });

  function initMatrix(fig) {
    var dataEl = fig.querySelector('script.se-matrix-data');
    if (!dataEl || !dataEl.textContent.trim()) return;
    var spec = normalize(JSON.parse(dataEl.textContent));
    if (!spec) return;

    if (fig.classList.contains('reveal')) fig.classList.add('is-visible');

    var nCols = spec.columns.length, nRows = spec.rows.length;

    var wrap = document.createElement('div');
    wrap.className = 'se-matrix-wrap';

    // Optional vertical y-axis label.
    if (spec.yLabel) {
      var yl = document.createElement('div');
      yl.className = 'se-matrix-ylabel';
      yl.textContent = spec.yLabel;
      wrap.appendChild(yl);
    }

    var grid = document.createElement('div');
    grid.className = 'se-matrix-grid';
    grid.style.gridTemplateColumns = 'minmax(0,auto) repeat(' + nCols + ', minmax(0,1fr))';

    // Header row: corner + column labels.
    grid.appendChild(cellDiv('se-matrix-corner', ''));
    spec.columns.forEach(function (c) { grid.appendChild(cellDiv('se-matrix-colhead', c)); });

    var cellButtons = [];
    for (var r = 0; r < nRows; r++) {
      grid.appendChild(cellDiv('se-matrix-rowhead', spec.rows[r]));
      for (var c = 0; c < nCols; c++) {
        var data = spec.grid[r][c];
        var btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'se-matrix-cell';
        btn.setAttribute('aria-label', label(spec, r, c, data));
        if (data && data.title) {
          var t = document.createElement('span');
          t.className = 'se-matrix-cell-title';
          t.textContent = data.title;
          btn.appendChild(t);
          if (data.tag) {
            var tg = document.createElement('span');
            tg.className = 'se-matrix-cell-tag';
            tg.textContent = data.tag;
            btn.appendChild(tg);
          }
        } else {
          btn.classList.add('is-empty');
          btn.disabled = true;
        }
        (function (rr, cc, b, d) {
          if (!d || !d.title) return;
          b.addEventListener('mouseenter', function () { showDetail(rr, cc); });
          b.addEventListener('focus', function () { setActive(rr, cc); });
          b.addEventListener('click', function () { setActive(rr, cc); });
        })(r, c, btn, data);
        cellButtons.push({ r: r, c: c, el: btn });
        grid.appendChild(btn);
      }
    }
    wrap.appendChild(grid);
    fig.appendChild(wrap);

    if (spec.xLabel) {
      var xl = document.createElement('div');
      xl.className = 'se-matrix-xlabel';
      xl.textContent = spec.xLabel;
      fig.appendChild(xl);
    }

    var detail = document.createElement('div');
    detail.className = 'se-matrix-detail';
    detail.setAttribute('aria-live', 'polite');
    fig.appendChild(detail);

    // Pick the first non-empty cell as the default active one.
    var first = null;
    for (var i = 0; i < cellButtons.length; i++) {
      var cb = cellButtons[i], dd = spec.grid[cb.r][cb.c];
      if (dd && dd.title) { first = cb; break; }
    }
    var active = first ? { r: first.r, c: first.c } : null;

    function cellAt(r, c) {
      for (var i = 0; i < cellButtons.length; i++) if (cellButtons[i].r === r && cellButtons[i].c === c) return cellButtons[i].el;
      return null;
    }
    function renderDetail(r, c) {
      var d = spec.grid[r][c];
      if (!d || !d.title) { detail.innerHTML = ''; return; }
      var coord = spec.rows[r] + ' / ' + spec.columns[c];
      detail.innerHTML = '';
      var eb = document.createElement('span'); eb.className = 'se-matrix-detail-coord'; eb.textContent = coord;
      var h = document.createElement('strong'); h.className = 'se-matrix-detail-title'; h.textContent = d.title;
      var p = document.createElement('p'); p.className = 'se-matrix-detail-body'; p.textContent = d.detail || '';
      detail.appendChild(eb); detail.appendChild(h); detail.appendChild(p);
    }
    function showDetail(r, c) { renderDetail(r, c); }
    function setActive(r, c) {
      active = { r: r, c: c };
      cellButtons.forEach(function (cb) { cb.el.classList.toggle('is-active', cb.r === r && cb.c === c); });
      renderDetail(r, c);
    }

    // Restore the active cell's detail when the pointer leaves the grid.
    grid.addEventListener('mouseleave', function () { if (active) renderDetail(active.r, active.c); });

    if (active) setActive(active.r, active.c);
  }

  // ---- helpers ----

  function cellDiv(cls, text) {
    var d = document.createElement('div');
    d.className = cls;
    d.textContent = text;
    return d;
  }

  function label(spec, r, c, data) {
    var base = spec.rows[r] + ', ' + spec.columns[c];
    return data && data.title ? base + ': ' + data.title : base + ': empty';
  }

  function normalize(spec) {
    if (!spec || typeof spec !== 'object') return null;
    var columns = Array.isArray(spec.columns) ? spec.columns.map(String) : [];
    var rows = Array.isArray(spec.rows) ? spec.rows.map(String) : [];
    if (!columns.length || !rows.length) return null;

    // Build a rows x cols grid of cell objects from either shape.
    var grid = [];
    for (var r = 0; r < rows.length; r++) {
      grid[r] = [];
      for (var c = 0; c < columns.length; c++) grid[r][c] = null;
    }
    if (Array.isArray(spec.cells) && spec.cells.length && Array.isArray(spec.cells[0])) {
      // 2D array form.
      for (var r2 = 0; r2 < rows.length; r2++) {
        for (var c2 = 0; c2 < columns.length; c2++) {
          var v = spec.cells[r2] && spec.cells[r2][c2];
          if (v) grid[r2][c2] = { title: v.title != null ? String(v.title) : '', detail: v.detail || '', tag: v.tag || '' };
        }
      }
    } else if (Array.isArray(spec.cells)) {
      spec.cells.forEach(function (v) {
        if (!v || v.row == null || v.col == null) return;
        if (v.row < 0 || v.row >= rows.length || v.col < 0 || v.col >= columns.length) return;
        grid[v.row][v.col] = { title: v.title != null ? String(v.title) : '', detail: v.detail || '', tag: v.tag || '' };
      });
    }
    return { xLabel: spec.xLabel || '', yLabel: spec.yLabel || '', columns: columns, rows: rows, grid: grid };
  }
})();
