// subscribe.js - submit a .se-subscribe form to a HubSpot form via the public
// Forms Submissions API. No HubSpot script needed; the email lands in HubSpot
// and triggers whatever follow-up / list the form is set up with.
//
// Markup contract:
//   <form class="se-subscribe" data-portal-id="46343543" data-form-guid="<FORM-ID>">
//     <p class="se-subscribe-eyebrow">Newsletter</p>            (optional)
//     <h2 class="se-subscribe-title">Get new posts by email</h2> (optional)
//     <div class="se-subscribe-row">
//       <label class="se-visually-hidden" for="se-sub">Email</label>
//       <input class="se-subscribe-input" id="se-sub" type="email" name="email"
//              required placeholder="you@company.com" autocomplete="email">
//       <button class="se-subscribe-btn" type="submit">Subscribe</button>
//     </div>
//     <p class="se-subscribe-msg" role="status" aria-live="polite"></p>
//   </form>
//
// Create the form once in HubSpot (Marketing > Forms; an embedded form with a
// single Email field), then paste its Form ID into data-form-guid. One IIFE.

(function () {
  'use strict';

  var forms = document.querySelectorAll('form.se-subscribe');
  if (!forms.length) return;

  forms.forEach(function (form) {
    var portalId = form.getAttribute('data-portal-id');
    var formGuid = form.getAttribute('data-form-guid');
    var input = form.querySelector('input[type="email"]');
    var btn = form.querySelector('button[type="submit"]');
    var msg = form.querySelector('.se-subscribe-msg');
    if (!input || !btn) return;

    function setMsg(text, isError) {
      if (!msg) return;
      msg.textContent = text || '';
      msg.classList.toggle('is-error', !!isError);
    }

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var email = (input.value || '').trim();
      if (!email || !input.checkValidity()) { input.reportValidity && input.reportValidity(); return; }

      if (!portalId || !formGuid || /PASTE|REPLACE|FORM-ID/i.test(formGuid)) {
        setMsg('Subscribe is not connected yet.', true);
        return;
      }

      btn.disabled = true;
      form.classList.add('is-loading');
      setMsg('', false);

      var payload = {
        fields: [{ objectTypeId: '0-1', name: 'email', value: email }],
        context: { pageUri: window.location.href, pageName: document.title }
      };

      fetch('https://api.hsforms.com/submissions/v3/integration/submit/' + portalId + '/' + formGuid, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
        .then(function (r) {
          return r.json().catch(function () { return {}; }).then(function (j) { return { ok: r.ok, body: j }; });
        })
        .then(function (res) {
          if (res.ok) {
            form.classList.add('is-done');
            setMsg(res.body.inlineMessage || "You're subscribed. Check your inbox to confirm.", false);
            input.value = '';
          } else {
            var err = res.body && res.body.errors && res.body.errors[0] && res.body.errors[0].message;
            setMsg(err || 'Something went wrong. Please try again.', true);
          }
        })
        .catch(function () {
          setMsg('Could not reach the server. Please try again.', true);
        })
        .then(function () {
          btn.disabled = false;
          form.classList.remove('is-loading');
        });
    });
  });
})();
