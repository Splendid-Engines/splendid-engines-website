// copy.js - click-to-copy for the se-prompt module (and any [data-copy] button).
//
// A button with [data-copy] copies text to the clipboard:
//   - data-copy-target="#sel"  copies that element's text, or
//   - (default) copies the [data-copy-text] element inside the nearest
//     [data-se-prompt] ancestor.
// On success the button flashes "Copied". Delegated, so it works for any
// number of prompt blocks on the page with no per-element wiring.
(function () {
  function textFor(btn) {
    var sel = btn.getAttribute('data-copy-target');
    if (sel) {
      var el = document.querySelector(sel);
      return el ? el.textContent : '';
    }
    var root = btn.closest('[data-se-prompt]') || document;
    var src = root.querySelector('[data-copy-text]');
    return src ? src.textContent : '';
  }

  function flash(btn) {
    var label = btn.querySelector('.se-prompt-copy-label') || btn;
    if (btn.dataset.copyBusy) return;
    btn.dataset.copyBusy = '1';
    var prev = label.textContent;
    btn.classList.add('is-copied');
    label.textContent = 'Copied';
    setTimeout(function () {
      btn.classList.remove('is-copied');
      label.textContent = prev;
      delete btn.dataset.copyBusy;
    }, 1800);
  }

  function fallbackCopy(text, btn) {
    var ta = document.createElement('textarea');
    ta.value = text;
    ta.setAttribute('readonly', '');
    ta.style.position = 'fixed';
    ta.style.top = '-9999px';
    document.body.appendChild(ta);
    ta.select();
    try { document.execCommand('copy'); flash(btn); } catch (e) { /* no-op */ }
    document.body.removeChild(ta);
  }

  function copy(text, btn) {
    if (!text) return;
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(
        function () { flash(btn); },
        function () { fallbackCopy(text, btn); }
      );
    } else {
      fallbackCopy(text, btn);
    }
  }

  document.addEventListener('click', function (e) {
    var btn = e.target.closest ? e.target.closest('[data-copy]') : null;
    if (!btn) return;
    e.preventDefault();
    copy(textFor(btn), btn);
  });
})();
