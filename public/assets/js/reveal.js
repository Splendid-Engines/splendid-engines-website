// Scroll-triggered reveals + count-up for big stat numbers.
// Opt in by adding .reveal or .reveal-stat to elements you want animated.
// Inside a .reveal-stat, any .stat-feature or .stat-number is counted up.

(function () {
  'use strict';

  var prefersReduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var targets = document.querySelectorAll('.reveal, .reveal-stat');

  // No IntersectionObserver or reduced-motion: just show everything.
  if (prefersReduced || typeof IntersectionObserver === 'undefined') {
    targets.forEach(function (el) {
      el.classList.add('is-visible');
      var num = el.querySelector('.stat-feature, .stat-number');
      // No animation; static numbers already render correct value.
      if (num) num.dataset.counted = '1';
    });
    return;
  }

  function animateCount(el) {
    if (el.dataset.counted === '1') return;
    el.dataset.counted = '1';

    // Walk text nodes; animate the FIRST digit run we find.
    var walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT, null);
    var node;
    while ((node = walker.nextNode())) {
      var value = node.nodeValue;
      var match = value.match(/(\d+)/);
      if (!match) continue;
      var target = parseInt(match[1], 10);
      if (target < 2) return;
      var prefix = value.slice(0, match.index);
      var suffix = value.slice(match.index + match[0].length);
      var duration = Math.min(1100, 400 + target * 6); // longer for bigger numbers
      var start = null;
      node.nodeValue = prefix + '0' + suffix;
      function step(now) {
        if (start === null) start = now;
        var t = Math.min(1, (now - start) / duration);
        var eased = 1 - Math.pow(1 - t, 3); // ease-out cubic
        var current = Math.round(eased * target);
        node.nodeValue = prefix + current + suffix;
        if (t < 1) requestAnimationFrame(step);
      }
      requestAnimationFrame(step);
      return;
    }
  }

  var observer = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (!entry.isIntersecting) return;
      var el = entry.target;
      el.classList.add('is-visible');
      var num = el.querySelector('.stat-feature, .stat-number');
      if (num) animateCount(num);
      observer.unobserve(el);
    });
  }, { threshold: 0.18, rootMargin: '0px 0px -6% 0px' });

  targets.forEach(function (el) { observer.observe(el); });
})();
