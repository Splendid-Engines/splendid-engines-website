// writing-index.js - keep a writing-index entry's title in sync with the article
// it links to. Opt in per entry by adding `data-sync-title` to the entry's title
// <a>. The script fetches the linked article and reads its canonical title from
// og:title (falling back to <title> minus the " - Splendid Engines" suffix), then
// updates the entry's heading only if it has drifted.
//
// This is progressive enhancement: the hardcoded title in the markup is the
// instant, no-JS, SEO-visible value, so a fetch failure or a no-JS visit just
// shows that. The site has no build step, so this is how an index entry can track
// its article's title without a manual edit. Curated entries (most of the list)
// simply omit the attribute and are never touched.
(function () {
  var links = document.querySelectorAll('a[data-sync-title]');
  if (!links.length || !window.fetch) return;

  function decodeEntities(s) {
    var el = document.createElement('textarea');
    el.innerHTML = s;
    return el.value;
  }

  function titleFromHtml(html) {
    var og = html.match(/<meta[^>]+property=["']og:title["'][^>]*>/i);
    if (og) {
      var c = og[0].match(/content=["']([^"']+)["']/i);
      if (c) return decodeEntities(c[1]).trim();
    }
    var t = html.match(/<title>([^<]*)<\/title>/i);
    if (t) return decodeEntities(t[1]).replace(/\s*[-–|]\s*Splendid Engines\s*$/i, '').trim();
    return '';
  }

  links.forEach(function (a) {
    var heading = a.querySelector('h1, h2, h3');
    var href = a.getAttribute('href');
    if (!heading || !href) return;
    fetch(href, { credentials: 'same-origin' })
      .then(function (r) { return r.ok ? r.text() : null; })
      .then(function (html) {
        if (!html) return;
        var title = titleFromHtml(html);
        if (title && heading.textContent.trim() !== title) heading.textContent = title;
      })
      .catch(function () { /* leave the hardcoded title in place */ });
  });
})();
