// Adds .scrolled class to the sticky navbar after the user scrolls past 12px.
// Drives the smaller-padding state defined in custom.css (.navbar.scrolled).
(function () {
  'use strict';
  var nav = document.querySelector('nav.navbar');
  if (!nav) return;
  var threshold = 12;
  var ticking = false;
  function update() {
    var y = window.scrollY || document.documentElement.scrollTop;
    if (y > threshold) {
      nav.classList.add('scrolled');
    } else {
      nav.classList.remove('scrolled');
    }
    ticking = false;
  }
  window.addEventListener('scroll', function () {
    if (!ticking) {
      window.requestAnimationFrame(update);
      ticking = true;
    }
  }, { passive: true });
  update();
})();
