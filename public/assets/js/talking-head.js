// Talking-head quote — hover (or tap) a short clip of a person while their quote
// lights up word-by-word in time with the audio. A richer take on the static
// .pull-quote / .testimonial-attr blocks. No dependencies; one IIFE, like reveal.js.
//
// Opt in with [data-th] on a <figure class="talking-head">. Markup contract lives
// in writing/_template/index.html. In short:
//   <figure class="talking-head" data-th data-timings="/assets/video/<slug>/clip.timings.json">
//     <div class="th-media">
//       <video class="th-video" preload="metadata" playsinline muted poster="..." src="...mp4"></video>
//       <span class="th-affordance" aria-hidden="true"></span>
//     </div>
//     <blockquote class="th-quote">
//       <p class="th-text">The quote, as plain readable prose.</p>
//       <figcaption class="testimonial-attr d-flex align-items-center th-attr">…name / role…</figcaption>
//     </blockquote>
//   </figure>
//
// Timings are positional: entry i maps to word i of .th-text (words split on
// whitespace). Shape: [{ "w": "word", "start": <sec>, "end": <sec> }, …], loaded
// from data-timings or an inline <script type="application/json" class="th-timings">.
// The VISIBLE text is always the source of truth — if the timing count disagrees,
// the clip still plays with no highlight. The karaoke is strictly additive.
//
// Notes that drive the design:
//  - Word-sync needs a native <video> (currentTime is readable). A YouTube iframe
//    can't drive this; clips are self-hosted.
//  - mouseenter is NOT a user-activation gesture, so unmuted play() can be blocked.
//    We play muted on hover until a real gesture (click / Enter / tap) unlocks sound.

(function () {
  'use strict';

  var figures = document.querySelectorAll('figure.talking-head[data-th]');
  if (!figures.length) return;

  var mq = window.matchMedia;
  var prefersReduced = mq && mq('(prefers-reduced-motion: reduce)').matches;
  var noHover = mq && mq('(hover: none)').matches;

  // Only one clip plays at a time across the whole page.
  var current = null;

  figures.forEach(function (fig) {
    try { initFigure(fig); } catch (e) { /* never break the page over one block */ }
  });

  function initFigure(fig) {
    var video = fig.querySelector('video.th-video');
    var textEl = fig.querySelector('.th-text');
    var media = fig.querySelector('.th-media');
    var chip = fig.querySelector('.th-affordance');
    if (!video || !textEl || !media) return;

    // ---- Tokenize the visible quote into word spans (whitespace preserved) ----
    var words = tokenize(textEl);

    // ---- Highlight state ------------------------------------------------------
    var starts = null, ends = null, canHighlight = false;
    var activeIndex = -1, rafId = 0;

    // ---- Playback state -------------------------------------------------------
    var hasGesture = false;   // has THIS clip had a real activation (so sound is allowed)?
    var wantPlaying = false;  // guards the async play()/pause() race

    // Timings are an enhancement layer — failures are silent, the clip still plays.
    loadTimings(fig)
      .then(function (timings) { applyTimings(timings); })
      .catch(function () { /* no highlight */ });

    function applyTimings(timings) {
      if (!timings || timings.length !== words.length) return;   // count must match
      if (!sampledTextMatches(timings, words)) return;           // shifted / wrong array
      starts = new Float32Array(timings.length);
      ends = new Float32Array(timings.length);
      for (var i = 0; i < timings.length; i++) {
        starts[i] = timings[i].start;
        ends[i] = timings[i].end;
      }
      canHighlight = true;
    }

    // ---- The sync loop --------------------------------------------------------
    function tick() {
      if (video.paused || video.ended) { rafId = 0; return; }
      if (canHighlight) {
        var i = findActiveWord(video.currentTime);
        if (i !== activeIndex) {
          if (activeIndex >= 0 && words[activeIndex]) words[activeIndex].classList.remove('is-active');
          if (i >= 0 && words[i]) words[i].classList.add('is-active');
          activeIndex = i;
        }
      }
      rafId = window.requestAnimationFrame(tick);
    }

    // Rightmost start <= t, then confirm we're still inside that word's [start,end).
    // Returns -1 before the first word, inside gaps between words, and after the last.
    function findActiveWord(t) {
      if (!starts) return -1;
      var lo = 0, hi = starts.length - 1, best = -1;
      while (lo <= hi) {
        var mid = (lo + hi) >> 1;
        if (starts[mid] <= t) { best = mid; lo = mid + 1; }
        else { hi = mid - 1; }
      }
      if (best < 0) return -1;
      return t < ends[best] ? best : -1;
    }

    function clearHighlight() {
      if (activeIndex >= 0 && words[activeIndex]) words[activeIndex].classList.remove('is-active');
      activeIndex = -1;
    }

    // ---- Play / stop ----------------------------------------------------------
    function play(withSound) {
      if (current && current !== api) current.stop();
      current = api;
      wantPlaying = true;
      fig.classList.add('is-playing');
      media.setAttribute('aria-pressed', 'true');

      // Already playing this clip? Just upgrade to sound if a gesture allows it.
      if (!video.paused) {
        if (withSound && video.muted) { video.muted = false; hideChip(); }
        return;
      }

      video.muted = !withSound;
      try { video.currentTime = 0; } catch (e) {}   // replay from the top each time
      if (!rafId) rafId = window.requestAnimationFrame(tick);

      var p = video.play();
      if (p && typeof p.then === 'function') {
        p.then(function () {
          if (!wantPlaying) return;
          if (video.muted) showChip(); else hideChip();
        }).catch(function () {
          // Unmuted play was blocked. Retry muted so the visual still runs.
          if (!wantPlaying) return;
          video.muted = true;
          var p2 = video.play();
          if (p2 && p2.catch) p2.catch(function () { stop(); });  // give up: poster stays
          showChip();
        });
      }
    }

    function stop() {
      wantPlaying = false;
      if (rafId) { window.cancelAnimationFrame(rafId); rafId = 0; }
      try { video.pause(); } catch (e) {}
      try { video.currentTime = 0; } catch (e) {}   // back to the resting frame / poster
      video.muted = true;                            // re-arm the safe default
      clearHighlight();
      fig.classList.remove('is-playing');
      media.setAttribute('aria-pressed', 'false');
      hideChip();
      if (current === api) current = null;
    }

    var api = { stop: stop };

    function showChip() { if (chip) fig.classList.add('needs-sound'); }
    function hideChip() { fig.classList.remove('needs-sound'); }

    function pageActivated() {
      return hasGesture ||
        (navigator.userActivation && navigator.userActivation.hasBeenActive);
    }

    // ---- a11y: the portrait is the focusable button; the WHOLE figure is the
    //      pointer hit area, so hovering/clicking anywhere on the module plays it. --
    media.setAttribute('role', 'button');
    media.setAttribute('tabindex', '0');
    media.setAttribute('aria-pressed', 'false');
    if (!media.getAttribute('aria-label')) {
      media.setAttribute('aria-label',
        fig.getAttribute('aria-label') || video.getAttribute('aria-label') || 'Play clip with sound');
    }

    // A click anywhere on the module toggles play-with-sound (a real gesture).
    fig.addEventListener('click', function () {
      // don't hijack a click that's finishing a text selection inside the quote
      var sel = window.getSelection && window.getSelection();
      if (sel && sel.toString() && fig.contains(sel.anchorNode)) return;
      hasGesture = true;
      if (fig.classList.contains('is-playing') && noHover) stop();  // tap again to stop
      else play(true);
    });

    // Keyboard activation lives on the focusable portrait.
    media.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ' || e.key === 'Spacebar') {
        e.preventDefault();
        hasGesture = true;
        if (fig.classList.contains('is-playing')) stop(); else play(true);
      } else if (e.key === 'Escape') {
        stop();
      }
    });
    if (chip) {
      chip.addEventListener('click', function (e) {
        e.stopPropagation();            // don't also trigger the figure click (which restarts)
        hasGesture = true;
        video.muted = false;
        hideChip();
        if (video.paused) play(true);
      });
    }

    video.addEventListener('ended', stop);

    // Reduced motion: no autoplay, no hover preview, no per-word highlight.
    // The clip is still explicitly playable (with sound) via click / Enter.
    if (prefersReduced) {
      canHighlight = false;
      return;
    }

    // Desktop: hovering anywhere on the module previews the clip. Sound rides along
    // once the page has been interacted with; before that it previews muted with a
    // "tap for sound" chip.
    if (!noHover) {
      fig.addEventListener('mouseenter', function () { play(pageActivated()); });
      fig.addEventListener('mouseleave', stop);
    }
  }

  // ---- helpers ----------------------------------------------------------------

  // Split visible text into word spans, keeping the whitespace between them so the
  // paragraph wraps and spaces exactly as before. Returns the word spans in order.
  function tokenize(textEl) {
    var parts = textEl.textContent.split(/(\s+)/);
    var frag = document.createDocumentFragment();
    var spans = [];
    parts.forEach(function (part) {
      if (part === '') return;
      if (/^\s+$/.test(part)) {
        frag.appendChild(document.createTextNode(part));
      } else {
        var span = document.createElement('span');
        span.className = 'th-word';
        span.textContent = part;
        frag.appendChild(span);
        spans.push(span);
      }
    });
    textEl.textContent = '';
    textEl.appendChild(frag);
    return spans;
  }

  function loadTimings(fig) {
    var inline = fig.querySelector('script.th-timings');
    if (inline && inline.textContent.trim()) {
      return Promise.resolve(parseTimings(inline.textContent));
    }
    var url = fig.getAttribute('data-timings');
    if (!url || typeof fetch === 'undefined') return Promise.resolve(null);
    return fetch(url).then(function (r) {
      if (!r.ok) throw new Error('timings HTTP ' + r.status);
      return r.text();
    }).then(parseTimings);
  }

  // Accepts a bare array or a { words: [...] } wrapper (common in transcription
  // exports). This is the one place to adapt if a supplied export differs.
  function parseTimings(text) {
    var data = JSON.parse(text);
    var arr = Array.isArray(data) ? data : (data && data.words);
    if (!Array.isArray(arr)) return null;
    var out = [];
    for (var i = 0; i < arr.length; i++) {
      var it = arr[i] || {};
      var start = num(it.start != null ? it.start : it.s);
      var end = num(it.end != null ? it.end : it.e);
      if (!isFinite(start) || !isFinite(end)) continue;
      out.push({ w: it.w != null ? it.w : (it.word != null ? it.word : ''), start: start, end: end });
    }
    return out;
  }

  function num(v) { var n = parseFloat(v); return isFinite(n) ? n : NaN; }

  // Cheap integrity check: sample a few positions; if most disagree, the array is
  // shifted/stale, so we skip the highlight rather than light the wrong words.
  function sampledTextMatches(timings, spans) {
    var n = timings.length, checks = Math.min(4, n), miss = 0, compared = 0;
    for (var k = 0; k < checks; k++) {
      var i = Math.floor((k + 0.5) * n / checks);
      var a = normalize(timings[i] && timings[i].w);
      var b = normalize(spans[i] && spans[i].textContent);
      if (!a || !b) continue;               // punctuation-only token, skip
      compared++;
      if (a !== b) miss++;
    }
    return compared === 0 || miss <= Math.floor(compared / 2);
  }

  function normalize(s) {
    return (s || '').toLowerCase().replace(/[^a-z0-9']/g, '');
  }
})();
