/*
  Voice Profile Builder.
  A guided, client-side walkthrough that turns a few choices into a markdown
  voice guide you can paste into ChatGPT, Claude, or any AI.

  No build step, no framework, no network. The option set mirrors the Splendid
  voice-profile object so the output matches what our own drafters work from.
  Nothing here calls an API or spends credits: it is pure form -> markdown.
*/
(function () {
  'use strict';

  /* ------------------------------------------------------------------ */
  /* Inline line-icons (lucide, ISC license). Rendered to the brand      */
  /* line-icon spec (square caps, miter joins) via CSS.                  */
  /* ------------------------------------------------------------------ */
  var ICON = {
    // formats / channels
    mail: '<rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>',
    linkedin: '<path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/><rect width="4" height="12" x="2" y="9"/><circle cx="4" cy="4" r="2"/>',
    messageCircle: '<path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z"/>',
    messageSquare: '<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>',
    slack: '<rect width="3" height="8" x="13" y="2" rx="1.5"/><path d="M19 8.5V10h1.5A1.5 1.5 0 1 0 19 8.5"/><rect width="3" height="8" x="8" y="14" rx="1.5"/><path d="M5 15.5V14H3.5A1.5 1.5 0 1 0 5 15.5"/><rect width="8" height="3" x="14" y="13" rx="1.5"/><path d="M15.5 19H14v1.5a1.5 1.5 0 1 0 1.5-1.5"/><rect width="8" height="3" x="2" y="8" rx="1.5"/><path d="M8.5 5H10V3.5A1.5 1.5 0 1 0 8.5 5"/>',
    newspaper: '<path d="M4 22h16a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v16a2 2 0 0 1-2 2Zm0 0a2 2 0 0 1-2-2v-9c0-1.1.9-2 2-2h2"/><path d="M18 14h-8"/><path d="M15 18h-5"/><path d="M10 6h8v4h-8V6Z"/>',
    fileText: '<path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/><path d="M10 9H8"/><path d="M16 13H8"/><path d="M16 17H8"/>',
    send: '<path d="M14.536 21.686a.5.5 0 0 0 .937-.024l6.5-19a.496.496 0 0 0-.635-.635l-19 6.5a.5.5 0 0 0-.024.937l7.93 3.18a2 2 0 0 1 1.112 1.11z"/><path d="m21.854 2.147-10.94 10.939"/>',
    globe: '<circle cx="12" cy="12" r="10"/><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"/><path d="M2 12h20"/>',
    // tones
    coffee: '<path d="M10 2v2"/><path d="M14 2v2"/><path d="M16 8a1 1 0 0 1 1 1v8a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4V9a1 1 0 0 1 1-1h14a4 4 0 1 1 0 8h-1"/><path d="M6 2v2"/>',
    smile: '<circle cx="12" cy="12" r="10"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/><line x1="9" x2="9.01" y1="9" y2="9"/><line x1="15" x2="15.01" y1="9" y2="9"/>',
    briefcase: '<path d="M16 20V4a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/><rect width="20" height="14" x="2" y="6" rx="2"/>',
    target: '<circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/>',
    zap: '<path d="M4 14a1 1 0 0 1-.78-1.63l9.9-10.2a.5.5 0 0 1 .86.46l-1.92 6.02A1 1 0 0 0 13 10h7a1 1 0 0 1 .78 1.63l-9.9 10.2a.5.5 0 0 1-.86-.46l1.92-6.02A1 1 0 0 0 11 14z"/>',
    graduationCap: '<path d="M21.42 10.922a1 1 0 0 0-.019-1.838L12.83 5.18a2 2 0 0 0-1.66 0L2.6 9.08a1 1 0 0 0 0 1.832l8.57 3.908a2 2 0 0 0 1.66 0z"/><path d="M22 10v6"/><path d="M6 12.5V16a6 3 0 0 0 12 0v-3.5"/>',
    equal: '<line x1="5" x2="19" y1="9" y2="9"/><line x1="5" x2="19" y1="15" y2="15"/>'
  };

  /* ------------------------------------------------------------------ */
  /* Option data (mirrors the Splendid voice-profile object).            */
  /* ------------------------------------------------------------------ */

  var TONES = [
    { value: 'casual', label: 'Casual', desc: 'Relaxed and informal, like talking to a friend.', icon: ICON.coffee,
      example: 'Hey, saw your post on pricing. Smart take. Want to swap notes sometime?' },
    { value: 'friendly', label: 'Friendly', desc: 'Warm and approachable, but still clear.', icon: ICON.smile,
      example: 'Hi! I really liked your post on pricing. I would love to compare notes if you are open to it.' },
    { value: 'professional', label: 'Professional', desc: 'Polished and businesslike. Safe anywhere at work.', icon: ICON.briefcase,
      example: 'Your recent post on pricing raised a strong point. I would welcome the chance to compare approaches.' },
    { value: 'assertive', label: 'Assertive', desc: 'Confident and direct. Takes a clear stand.', icon: ICON.target,
      example: 'Your pricing post nailed it. Most teams get this wrong. Let us talk this week.' },
    { value: 'bold', label: 'Bold', desc: 'Punchy and high energy. Strong claims.', icon: ICON.zap,
      example: 'Your pricing post says what nobody else will. This is the whole game. Let us talk.' },
    { value: 'academic', label: 'Academic', desc: 'Precise and formal. Explains and backs things up.', icon: ICON.graduationCap,
      example: 'Your post on pricing articulated a notable point. I would value a discussion of the underlying assumptions.' },
    { value: 'neutral', label: 'Neutral', desc: 'Plain and even, with no strong slant.', icon: ICON.equal,
      example: 'You wrote a post about pricing. It made a useful point. I am open to comparing notes.' }
  ];

  // Style manuals (rendered as cards). `name` is used in the output sentence.
  var MANUALS = [
    { value: 'ap', label: 'AP style', desc: 'Newsrooms, PR, and most marketing.', name: 'the Associated Press (AP) style guide' },
    { value: 'chicago_manual_of_style', label: 'Chicago', desc: 'Books, long form, and academic work.', name: 'the Chicago Manual of Style' },
    { value: 'other', label: 'Other / house style', desc: 'Your own in-house style guide.', name: 'your own house style guide' }
  ];

  // Reading level: an ordered scale from grade 4 to graduate, with a per-level
  // example so the difference is concrete. Grade 6 is the recommended ceiling.
  var READING_LEVELS = [
    { value: 'grade_4', step: 1, label: 'Grade 4', blurb: 'Very simple. Short words, short sentences.',
      example: 'We help you find the right people to talk to.' },
    { value: 'grade_5', step: 2, label: 'Grade 5', blurb: 'Simple and clear. Easy for almost anyone.',
      example: 'We help you find the right buyers and reach out to them.' },
    { value: 'grade_6', step: 3, label: 'Grade 6', blurb: 'Plain and easy to scan. Reads fast for most people.', recommended: true,
      example: 'We help you find the right buyers and start real conversations.' },
    { value: 'grade_7', step: 4, label: 'Grade 7', blurb: 'Clear, with a little more range.',
      example: 'We help you find the buyers who matter and open real conversations with them.' },
    { value: 'grade_8', step: 5, label: 'Grade 8', blurb: 'Comfortable for a general business reader.',
      example: 'We help you identify the buyers who matter most and begin genuine conversations.' },
    { value: 'grade_9', step: 6, label: 'Grade 9', blurb: 'A bit denser. Longer sentences are fine.',
      example: 'We help you pinpoint the buyers who matter most and start authentic conversations that build trust.' },
    { value: 'grade_10', step: 7, label: 'Grade 10', blurb: 'For a well read audience.',
      example: 'We help you identify high-value buyers and start authentic conversations designed to build trust.' },
    { value: 'grade_11', step: 8, label: 'Grade 11', blurb: 'Formal and complex.',
      example: 'We help you isolate high-value buyers and cultivate authentic conversations built to earn lasting trust.' },
    { value: 'grade_12', step: 9, label: 'Grade 12', blurb: 'Advanced. Long, layered sentences.',
      example: 'We help you isolate high-value prospects and cultivate substantive dialogue engineered to earn enduring trust.' },
    { value: 'college', step: 10, label: 'College', blurb: 'Undergraduate level. Specialist words are fine.',
      example: 'We enable you to isolate high-value prospects and cultivate substantive dialogue calibrated to earn enduring, reciprocal trust.' },
    { value: 'graduate', step: 11, label: 'Graduate', blurb: 'Expert level. Dense and technical.',
      example: 'We enable the systematic identification of high-value prospects and the cultivation of substantive dialogue calibrated to engender enduring, reciprocal trust.' }
  ];
  var READING_RECOMMENDED_STEP = 3; // grade 6

  // Concision scale, copied from the Splendid voice-profile concision model.
  var CONCISION = [
    { value: 'very_concise', step: 1, label: 'Very concise', blurb: 'Trim to the bone. Cut every needless word.',
      sentence: '6-10 words', linkedin: '1-2 sentences (about 20-35 words)', email: '40-70 words',
      example: 'Saw your CFO panel at SaaStr. Open to a quick call?' },
    { value: 'concise', step: 2, label: 'Concise', blurb: 'Lean and direct. Short sentences, little setup.',
      sentence: '10-14 words', linkedin: '2-3 sentences (about 35-55 words)', email: '70-110 words',
      example: 'Your post on usage-based pricing stuck with me. We shipped something similar last month. Worth comparing notes?' },
    { value: 'balanced', step: 3, label: 'Balanced', blurb: 'A natural middle. Room to explain, no padding.',
      sentence: '14-18 words', linkedin: '3-4 sentences (about 55-80 words)', email: '110-160 words',
      example: 'Your panel on pricing got me thinking about how rarely teams test willingness to pay. We just ran that experiment and the result surprised us. Happy to share what we found if it is useful.' },
    { value: 'expansive', step: 4, label: 'Expansive', blurb: 'Room to elaborate. Fuller sentences and more context.',
      sentence: '18-24 words', linkedin: '4-6 sentences (about 80-120 words)', email: '160-230 words',
      example: 'I caught your panel on pricing last week and it stayed with me, because so few teams actually test willingness to pay before they set a number. We went through the same debate internally and decided to run a real experiment across two segments. The outcome was not what any of us predicted, and it changed how we package the product.' },
    { value: 'very_expansive', step: 5, label: 'Very expansive', blurb: 'Loquacious. Rich detail and longer, flowing sentences.',
      sentence: '24-32 words', linkedin: '6+ sentences (about 120-180 words)', email: '230-350 words',
      example: 'I had the chance to catch your panel on pricing last week, and it has been on my mind ever since, largely because it named something I rarely hear discussed openly: how few teams genuinely test their customers willingness to pay before they commit to a number. We wrestled with exactly that question last quarter, and rather than keep debating it in the abstract, we ran a structured experiment across two very different segments to see what would hold.' }
  ];

  // Greetings, copied from the Splendid greetings model.
  var GREETINGS = [
    { value: 'hi', label: 'Hi', example: '"Hi {first name},"' },
    { value: 'hello', label: 'Hello', example: '"Hello {first name},"' },
    { value: 'hey', label: 'Hey', example: '"Hey {first name},"' },
    { value: 'dear', label: 'Dear', example: '"Dear {first name}," (formal)' },
    { value: 'name_only', label: 'Name only', example: 'lead with the name and no greeting word ("{first name},")' },
    { value: 'hi_there', label: 'Hi there', example: '"Hi there," (a greeting with no name)' }
  ];

  // Three-state phrasing knobs, with the exact instructions our drafters use.
  var ABBREVIATIONS = {
    choices: [
      { value: '', label: 'No preference' },
      { value: 'use', label: 'Use abbreviations' },
      { value: 'avoid', label: 'Spell out in full' }
    ],
    guidance: {
      use: 'Abbreviations: use common abbreviations and acronyms where they read naturally (e.g. TBD, WFH, ASAP, EOD).',
      avoid: 'Abbreviations: spell terms out in full and do not use abbreviations or acronyms (write "work from home", not "WFH").'
    }
  };
  var CONVERSATIONAL = {
    choices: [
      { value: '', label: 'No preference' },
      { value: 'use', label: 'Conversational' },
      { value: 'avoid', label: 'Complete sentences' }
    ],
    guidance: {
      use: 'Conversational phrasing: write the way people actually speak. Drop the leading subject where it reads naturally ("Would be great to connect", not "It would be great to connect"), use contractions, and allow the occasional short fragment.',
      avoid: 'Conversational phrasing: write in complete, grammatically full sentences. Keep the subject and avoid clipped, conversational constructions.'
    }
  };
  var JARGON = {
    choices: [
      { value: '', label: 'No preference' },
      { value: 'use', label: 'Use jargon' },
      { value: 'avoid', label: 'Plain language' }
    ],
    guidance: {
      use: 'Jargon: use industry jargon and technical terms freely. The audience knows them.',
      avoid: 'Jargon: avoid industry jargon. Explain ideas in plain language anyone can follow.'
    }
  };

  // Content formats / channels this voice is for (multi-select lozenges, step 1).
  var FORMATS = [
    { value: 'email', label: 'Email', icon: ICON.mail },
    { value: 'linkedin_posts', label: 'LinkedIn posts', icon: ICON.linkedin },
    { value: 'linkedin_dms', label: 'LinkedIn DMs', icon: ICON.messageCircle },
    { value: 'comments', label: 'Comments', icon: ICON.messageSquare },
    { value: 'slack', label: 'Slack', icon: ICON.slack },
    { value: 'newsletters', label: 'Newsletters', icon: ICON.send },
    { value: 'blog_posts', label: 'Blog posts', icon: ICON.newspaper },
    { value: 'case_studies', label: 'Case studies', icon: ICON.fileText },
    { value: 'website_copy', label: 'Website copy', icon: ICON.globe }
  ];

  var QUICK_HARD_RULES = ['No em-dashes', 'No en-dashes', 'No emoji', 'No exclamation points', 'No buzzwords', 'No "I hope this finds you well"'];

  /* ------------------------------------------------------------------ */
  /* State (with localStorage persistence).                             */
  /* ------------------------------------------------------------------ */

  var STORAGE_KEY = 'se_voice_profile_v2';

  function blankState() {
    return {
      name: '',
      formats: [],                // content formats / channels this voice is for
      reading_level: '',          // a READING_LEVELS value, or '' for unset
      tone: '',
      manual: '',
      concision: '',              // a CONCISION value, or ''
      greetings: [],
      name_basis: 'first',        // 'first' (Brandon) or 'last' (Mr. Gaulin)
      honorifics: false,          // use Dr./Prof. + surname when present
      jargon: '',                 // '' | 'use' | 'avoid'
      abbreviations: '',
      conversational: '',
      hard_rules: []
    };
  }

  var state = blankState();

  function load() {
    try {
      var raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        var saved = JSON.parse(raw);
        var fresh = blankState();
        Object.keys(fresh).forEach(function (k) {
          if (saved[k] !== undefined && saved[k] !== null) fresh[k] = saved[k];
        });
        state = fresh;
      }
    } catch (e) { /* ignore bad/blocked storage */ }
  }

  function save() {
    try { window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch (e) { /* ignore */ }
  }

  /* ------------------------------------------------------------------ */
  /* Small DOM helpers.                                                  */
  /* ------------------------------------------------------------------ */

  function el(id) { return document.getElementById(id); }
  function clear(node) { while (node.firstChild) node.removeChild(node.firstChild); }
  function make(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text !== undefined) n.textContent = text;
    return n;
  }
  function iconSvg(inner) { return '<svg viewBox="0 0 24 24" aria-hidden="true">' + inner + '</svg>'; }

  var CHECK_SVG = '<svg class="vpb-option-check" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="square"><path d="M5 13l4 4L19 7"/></svg>';

  function byValue(list, v) {
    for (var i = 0; i < list.length; i++) if (list[i].value === v) return list[i];
    return null;
  }
  function byStep(list, step) {
    var i = Math.min(list.length, Math.max(1, Math.round(step))) - 1;
    return list[i];
  }

  /* ------------------------------------------------------------------ */
  /* Renderers for each control.                                         */
  /* ------------------------------------------------------------------ */

  // Single-select option cards (optional icon + optional example preview).
  // Click a selected card again to clear it.
  function renderOptions(containerId, items, key, opts) {
    opts = opts || {};
    var box = el(containerId);
    clear(box);
    items.forEach(function (item) {
      var btn = make('button', 'vpb-option' + (item.icon ? ' vpb-option-iconed' : ''));
      btn.type = 'button';
      btn.setAttribute('aria-pressed', state[key] === item.value ? 'true' : 'false');
      if (state[key] === item.value) btn.classList.add('is-selected');
      btn.innerHTML = CHECK_SVG;
      if (item.icon) {
        var ico = make('span', 'vpb-option-ico');
        ico.innerHTML = iconSvg(item.icon);
        btn.appendChild(ico);
      }
      btn.appendChild(make('span', 'vpb-option-title', item.label));
      if (item.desc) btn.appendChild(make('span', 'vpb-option-desc', item.desc));
      btn.addEventListener('click', function () {
        state[key] = (state[key] === item.value) ? '' : item.value;
        save();
        renderOptions(containerId, items, key, opts);
      });
      box.appendChild(btn);
    });
    if (opts.previewId) {
      var pv = el(opts.previewId);
      if (pv) {
        var sel = byValue(items, state[key]);
        if (sel && sel.example) {
          clear(pv);
          pv.style.display = '';
          pv.appendChild(make('span', 'vpb-ex-label', 'Example'));
          pv.appendChild(make('p', 'vpb-ex-text', '“' + sel.example + '”'));
        } else {
          pv.style.display = 'none';
        }
      }
    }
  }

  // Multi-select pills (optionally with a leading line-icon).
  function renderPills(containerId, items, key, withExamples) {
    var box = el(containerId);
    clear(box);
    items.forEach(function (item) {
      var on = state[key].indexOf(item.value) !== -1;
      var btn = make('button', 'vpb-pill' + (item.icon ? ' vpb-pill-fmt' : '') + (on ? ' is-on' : ''));
      btn.type = 'button';
      btn.setAttribute('aria-pressed', on ? 'true' : 'false');
      if (item.icon) {
        var ico = make('span', 'vpb-pill-ico');
        ico.innerHTML = iconSvg(item.icon);
        btn.appendChild(ico);
      }
      btn.appendChild(document.createTextNode(item.label));
      if (withExamples && item.example) {
        btn.appendChild(make('span', 'vpb-pill-ex', ' ' + item.example));
      }
      btn.addEventListener('click', function () {
        var i = state[key].indexOf(item.value);
        if (i === -1) state[key].push(item.value); else state[key].splice(i, 1);
        save();
        renderPills(containerId, items, key, withExamples);
      });
      box.appendChild(btn);
    });
  }

  // Segmented control (2 or 3 state).
  function renderSegmented(containerId, choices, key) {
    var box = el(containerId);
    clear(box);
    choices.forEach(function (c) {
      var on = String(state[key]) === String(c.value);
      var btn = make('button', 'vpb-seg-btn' + (on ? ' is-on' : ''), c.label);
      btn.type = 'button';
      btn.setAttribute('aria-pressed', on ? 'true' : 'false');
      btn.addEventListener('click', function () {
        state[key] = c.value;
        save();
        renderSegmented(containerId, choices, key);
      });
      box.appendChild(btn);
    });
  }

  // Tag input (hard rules), with suggestion chips.
  function renderTags(opts) {
    var box = el(opts.tagsId);
    clear(box);
    state[opts.key].forEach(function (val, idx) {
      var tag = make('span', 'vpb-tag', val);
      var x = make('button', 'vpb-tag-x', '×');
      x.type = 'button';
      x.setAttribute('aria-label', 'Remove ' + val);
      x.addEventListener('click', function () {
        state[opts.key].splice(idx, 1);
        save();
        renderTags(opts);
      });
      tag.appendChild(x);
      box.appendChild(tag);
    });
    if (opts.suggestId) {
      var sbox = el(opts.suggestId);
      clear(sbox);
      opts.suggestions.forEach(function (s) {
        var used = state[opts.key].some(function (v) { return v.toLowerCase() === s.toLowerCase(); });
        var chip = make('button', 'vpb-suggest-pill' + (used ? ' is-used' : ''), '+ ' + s);
        chip.type = 'button';
        chip.addEventListener('click', function () {
          if (!used) { state[opts.key].push(s); save(); renderTags(opts); }
        });
        sbox.appendChild(chip);
      });
    }
  }

  function wireTagInput(opts) {
    var input = el(opts.inputId);
    input.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ',') {
        e.preventDefault();
        addTag(opts, input.value);
        input.value = '';
      }
    });
    input.addEventListener('blur', function () {
      if (input.value.trim()) { addTag(opts, input.value); input.value = ''; }
    });
  }

  function addTag(opts, raw) {
    var val = raw.trim().replace(/,+$/, '').trim();
    if (!val) return;
    var dupe = state[opts.key].some(function (v) { return v.toLowerCase() === val.toLowerCase(); });
    if (!dupe) { state[opts.key].push(val); save(); renderTags(opts); }
  }

  /* ------------------------------------------------------------------ */
  /* Slider renderers.                                                   */
  /* ------------------------------------------------------------------ */

  function renderReading() {
    var range = el('vpb-reading-range');
    var lvl = byValue(READING_LEVELS, state.reading_level);
    var isSet = !!lvl;
    if (!lvl) lvl = byStep(READING_LEVELS, READING_RECOMMENDED_STEP); // grade 6, shown muted
    range.value = lvl.step;
    range.classList.toggle('is-unset', !isSet);
    el('vpb-reading-value').textContent = isSet ? lvl.label : 'Not set';
    el('vpb-reading-clear').hidden = !isSet;
    var preview = el('vpb-reading-preview');
    preview.classList.toggle('is-unset', !isSet);
    el('vpb-reading-blurb').innerHTML = isSet
      ? '<b>' + lvl.label + (lvl.recommended ? ' (recommended)' : '') + ':</b> ' + lvl.blurb
      : 'Drag to set a reading level.';
    el('vpb-reading-example').textContent = '“' + lvl.example + '”';
    var note = el('vpb-reading-note');
    if (isSet && lvl.step > READING_RECOMMENDED_STEP) {
      note.style.display = '';
      note.textContent = 'Above our Grade 6 recommendation. Readability drops as the level rises.';
    } else {
      note.style.display = 'none';
    }
  }

  function renderConcision() {
    var range = el('vpb-concision-range');
    var lvl = byValue(CONCISION, state.concision);
    var isSet = !!lvl;
    if (!lvl) lvl = CONCISION[2]; // balanced, shown muted
    range.value = lvl.step;
    range.classList.toggle('is-unset', !isSet);
    el('vpb-concision-value').textContent = isSet ? lvl.label : 'Not set';
    el('vpb-concision-clear').hidden = !isSet;
    el('vpb-concision-preview').classList.toggle('is-unset', !isSet);
    el('vpb-concision-blurb').innerHTML = isSet
      ? '<b>' + lvl.label + ':</b> ' + lvl.blurb
      : 'Drag to set how lean or expansive the writing is.';
    el('vpb-cp-sentence').textContent = lvl.sentence;
    el('vpb-cp-linkedin').textContent = lvl.linkedin;
    el('vpb-cp-email').textContent = lvl.email;
    el('vpb-concision-example').textContent = '“' + lvl.example + '”';
  }

  /* ------------------------------------------------------------------ */
  /* Step navigation.                                                    */
  /* ------------------------------------------------------------------ */

  var STEP_NAMES = ['Basics', 'Reading level', 'Tone', 'Style guide', 'Concision', 'Greetings', 'Phrasing', 'Hard rules', 'Your profile'];
  var TOTAL_INPUT_STEPS = 8; // the last step is the result
  var current = 1;

  function showStep(n) {
    current = n;
    var steps = document.querySelectorAll('.vpb-step');
    for (var i = 0; i < steps.length; i++) {
      steps[i].classList.toggle('is-active', Number(steps[i].getAttribute('data-step')) === n);
    }
    var pct = Math.round(((n - 1) / TOTAL_INPUT_STEPS) * 100);
    el('vpb-fill').style.width = (n > TOTAL_INPUT_STEPS ? 100 : pct) + '%';
    el('vpb-step-count').textContent = n > TOTAL_INPUT_STEPS ? 'Done' : 'Step ' + n + ' of ' + TOTAL_INPUT_STEPS;
    el('vpb-step-name').textContent = STEP_NAMES[n - 1];

    el('vpb-back').hidden = (n === 1);
    el('vpb-next').hidden = (n >= TOTAL_INPUT_STEPS);   // hidden on the last input step + result
    el('vpb-finish').hidden = (n !== TOTAL_INPUT_STEPS); // only on the last input step

    if (n > TOTAL_INPUT_STEPS) regenerate();

    // Within the full-screen takeover, send each new step back to the top.
    var tk = document.getElementById('vpb-takeover');
    if (tk && document.body.classList.contains('vpb-wizard-open')) {
      tk.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  /* ------------------------------------------------------------------ */
  /* Markdown generation.                                                */
  /* ------------------------------------------------------------------ */

  function generateMarkdown() {
    var name = (state.name || '').trim() || 'My voice';
    var lines = [];
    lines.push('# Voice Profile: ' + name);
    lines.push('');
    if (state.formats.length) {
      var fmtLabels = state.formats.map(function (v) { var f = byValue(FORMATS, v); return f ? f.label : v; });
      lines.push('_Used for: ' + fmtLabels.join(', ') + '._');
      lines.push('');
    }
    lines.push('You are writing in my voice. This profile sets **how** the writing should read: the tone, the length, and the rules. It does not tell you **what** to say. The topic, the facts, and the message come from me. Apply this voice to everything you draft for me, and ask me for the substance when you need it.');
    lines.push('');

    // Style
    var style = [];
    var rl = byValue(READING_LEVELS, state.reading_level);
    if (rl) style.push('- **Reading level:** Write at a ' + rl.label.toLowerCase() + ' reading level. ' + rl.blurb);
    var t = byValue(TONES, state.tone);
    if (t) style.push('- **Tone:** ' + t.label + '. ' + t.desc);
    var m = byValue(MANUALS, state.manual);
    if (m) style.push('- **Style guide:** Follow ' + m.name + '.');
    var c = byValue(CONCISION, state.concision);
    if (c) {
      style.push('- **Concision:** ' + c.label + '. ' + c.blurb + ' Aim for sentences of ' + c.sentence +
        '. A short message (such as LinkedIn) runs ' + c.linkedin + '; an email runs ' + c.email + '.');
    }
    if (style.length) { lines.push('## Style'); lines = lines.concat(style); lines.push(''); }

    // Greeting and address
    var greet = [];
    if (state.greetings.length) {
      var ex = state.greetings.map(function (v) {
        var g = byValue(GREETINGS, v);
        return g ? g.label + ' (' + g.example + ')' : v;
      }).join('; ');
      greet.push('- **Greeting:** Open with one of these salutations only: ' + ex + '. Pick whichever best fits the person and the channel. Do not open with any other greeting.');
    }
    var addr;
    if (state.honorifics) {
      addr = 'Address the person by their professional or academic honorific and surname (for example Dr. Gaulin or Prof. Gaulin), inferred from their title or credentials. If none is evident, ' +
        (state.name_basis === 'last' ? 'use a courtesy title and their last name (for example Mr. Gaulin).' : 'use their first name (for example Brandon).');
    } else if (state.name_basis === 'last') {
      addr = 'Address the person by a courtesy title and their last name (for example Mr. Gaulin).';
    } else {
      addr = 'Address the person by their first name (for example Brandon).';
    }
    greet.push('- **Form of address:** ' + addr);
    lines.push('## Greeting and address');
    lines = lines.concat(greet);
    lines.push('');

    // Phrasing
    var phrasing = [];
    if (JARGON.guidance[state.jargon]) phrasing.push('- **' + JARGON.guidance[state.jargon]);
    if (ABBREVIATIONS.guidance[state.abbreviations]) phrasing.push('- **' + ABBREVIATIONS.guidance[state.abbreviations]);
    if (CONVERSATIONAL.guidance[state.conversational]) phrasing.push('- **' + CONVERSATIONAL.guidance[state.conversational]);
    if (phrasing.length) {
      phrasing = phrasing.map(function (p) { return p.replace(/^- \*\*([^:]+):/, '- **$1:**'); });
      lines.push('## Phrasing');
      lines = lines.concat(phrasing);
      lines.push('');
    }

    // Hard rules
    if (state.hard_rules.length) {
      lines.push('## Hard rules (never break these)');
      state.hard_rules.forEach(function (r) { lines.push('- ' + r); });
      lines.push('');
    }

    lines.push('---');
    lines.push('Remember: this profile governs form, not content. Never invent claims, facts, or offers to fit the voice. When in doubt about substance, ask.');
    lines.push('');
    return lines.join('\n').replace(/\n{3,}/g, '\n\n');
  }

  var lastMarkdown = '';

  function regenerate() {
    lastMarkdown = generateMarkdown();
    el('vpb-output-text').textContent = lastMarkdown;
  }

  function slug(s) {
    return (s || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 40);
  }

  function copyMarkdown() {
    var flag = el('vpb-copy-flag');
    var done = function () { flag.classList.add('is-on'); setTimeout(function () { flag.classList.remove('is-on'); }, 2000); };
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(lastMarkdown).then(done, fallbackCopy);
    } else {
      fallbackCopy();
    }
    function fallbackCopy() {
      var ta = document.createElement('textarea');
      ta.value = lastMarkdown;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      try { document.execCommand('copy'); done(); } catch (e) { /* ignore */ }
      document.body.removeChild(ta);
    }
  }

  function downloadMarkdown() {
    var base = slug(state.name);
    var fname = (base ? 'voice-profile-' + base : 'voice-profile') + '.md';
    var blob = new Blob([lastMarkdown], { type: 'text/markdown;charset=utf-8' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = fname;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
  }

  /* ------------------------------------------------------------------ */
  /* Wire everything on load.                                            */
  /* ------------------------------------------------------------------ */

  var NAME_BASIS_CHOICES = [
    { value: 'first', label: 'First name (Brandon)' },
    { value: 'last', label: 'Last name (Mr. Gaulin)' }
  ];
  var HONORIFIC_CHOICES = [
    { value: false, label: 'Off' },
    { value: true, label: 'On (Dr. Gaulin)' }
  ];

  function renderAllControls() {
    renderPills('vpb-formats', FORMATS, 'formats', false);
    renderReading();
    renderOptions('vpb-tones', TONES, 'tone', { previewId: 'vpb-tone-example' });
    renderOptions('vpb-manual', MANUALS, 'manual');
    renderConcision();
    renderPills('vpb-greetings', GREETINGS, 'greetings', true);
    renderSegmented('vpb-name-basis', NAME_BASIS_CHOICES, 'name_basis');
    renderSegmented('vpb-honorifics', HONORIFIC_CHOICES, 'honorifics');
    renderSegmented('vpb-jargon', JARGON.choices, 'jargon');
    renderSegmented('vpb-abbreviations', ABBREVIATIONS.choices, 'abbreviations');
    renderSegmented('vpb-conversational', CONVERSATIONAL.choices, 'conversational');
  }

  // Landing-mockup flourish: type the last line then leave a blinking cursor,
  // plus a subtle cursor-reactive tilt on the file window. Respects reduced motion.
  function animateMockup() {
    var node = el('vpb-type');
    if (node) {
      var full = node.textContent;
      var caret = make('span', 'vpb-caret');
      var reduceTxt = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      if (reduceTxt) {
        node.textContent = full;
        node.appendChild(caret);
      } else {
        node.textContent = '';
        var txt = document.createTextNode('');
        node.appendChild(txt);
        node.appendChild(caret);
        var i = 0;
        var tick = function () {
          txt.nodeValue = full.slice(0, i);
          if (i < full.length) { i++; setTimeout(tick, 95); }
        };
        setTimeout(tick, 650);
      }
    }

    var mock = document.querySelector('.vpb-file-mock');
    var hero = document.querySelector('.vpb-hero-split');
    if (!mock || !hero || !window.matchMedia) return;
    if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    var raf = null;
    hero.addEventListener('mousemove', function (e) {
      var r = mock.getBoundingClientRect();
      var dx = Math.max(-1, Math.min(1, (e.clientX - (r.left + r.width / 2)) / (r.width / 2)));
      var dy = Math.max(-1, Math.min(1, (e.clientY - (r.top + r.height / 2)) / (r.height / 2)));
      if (raf) cancelAnimationFrame(raf);
      raf = requestAnimationFrame(function () {
        mock.style.transform = 'rotateX(' + (dy * -4).toFixed(2) + 'deg) rotateY(' + (dx * 5).toFixed(2) + 'deg)';
      });
    });
    hero.addEventListener('mouseleave', function () {
      if (raf) cancelAnimationFrame(raf);
      mock.style.transform = '';
    });
  }

  function init() {
    load();

    // Name
    var nameInput = el('vpb-name');
    nameInput.value = state.name;
    nameInput.addEventListener('input', function () { state.name = nameInput.value; save(); });

    // Reading-level slider
    var readingRange = el('vpb-reading-range');
    readingRange.addEventListener('input', function () {
      state.reading_level = byStep(READING_LEVELS, Number(readingRange.value)).value;
      save();
      renderReading();
    });
    el('vpb-reading-clear').addEventListener('click', function () { state.reading_level = ''; save(); renderReading(); });

    // Concision slider
    var concRange = el('vpb-concision-range');
    concRange.addEventListener('input', function () {
      state.concision = byStep(CONCISION, Number(concRange.value)).value;
      save();
      renderConcision();
    });
    el('vpb-concision-clear').addEventListener('click', function () { state.concision = ''; save(); renderConcision(); });

    // Hard rules
    var rulesOpts = { key: 'hard_rules', tagsId: 'vpb-rules-tags', inputId: 'vpb-rules-input', suggestId: 'vpb-rules-suggest', suggestions: QUICK_HARD_RULES };
    wireTagInput(rulesOpts);

    // Render every control from current state.
    renderAllControls();
    renderTags(rulesOpts);

    // Nav buttons
    el('vpb-back').addEventListener('click', function () { if (current > 1) showStep(current - 1); });
    el('vpb-next').addEventListener('click', function () { if (current < TOTAL_INPUT_STEPS) showStep(current + 1); });
    el('vpb-finish').addEventListener('click', function () { showStep(TOTAL_INPUT_STEPS + 1); });

    // Result actions
    el('vpb-copy').addEventListener('click', copyMarkdown);
    el('vpb-download').addEventListener('click', downloadMarkdown);
    el('vpb-startover').addEventListener('click', function () {
      if (!window.confirm('Clear all your answers and start fresh?')) return;
      state = blankState();
      try { window.localStorage.removeItem(STORAGE_KEY); } catch (e) { /* ignore */ }
      nameInput.value = '';
      renderAllControls();
      renderTags(rulesOpts);
      showStep(1);
    });

    // Landing -> full-screen wizard takeover (and back).
    var takeover = el('vpb-takeover');
    var getStarted = el('vpb-get-started');
    function openWizard() {
      document.body.classList.add('vpb-wizard-open');
      if (takeover) {
        takeover.setAttribute('aria-hidden', 'false');
        takeover.scrollTop = 0;
      }
      showStep(current);
      if (takeover) { try { takeover.focus(); } catch (e) { /* ignore */ } }
    }
    function closeWizard() {
      document.body.classList.remove('vpb-wizard-open');
      if (takeover) takeover.setAttribute('aria-hidden', 'true');
      if (getStarted) { try { getStarted.focus(); } catch (e) { /* ignore */ } }
    }
    if (getStarted) getStarted.addEventListener('click', openWizard);
    var closeBtn = el('vpb-close');
    if (closeBtn) closeBtn.addEventListener('click', closeWizard);
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && document.body.classList.contains('vpb-wizard-open')) closeWizard();
    });

    animateMockup();
    showStep(1);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
