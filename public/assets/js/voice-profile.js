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
  /* Option data (mirrors the Splendid voice-profile object).            */
  /* ------------------------------------------------------------------ */

  var TONES = [
    { value: 'casual', label: 'Casual', desc: 'Relaxed and informal, like talking to a friend.' },
    { value: 'friendly', label: 'Friendly', desc: 'Warm and approachable, but still clear.' },
    { value: 'professional', label: 'Professional', desc: 'Polished and businesslike. Safe anywhere at work.' },
    { value: 'assertive', label: 'Assertive', desc: 'Confident and direct. Takes a clear stand.' },
    { value: 'bold', label: 'Bold', desc: 'Punchy and high energy. Strong claims.' },
    { value: 'academic', label: 'Academic', desc: 'Precise and formal. Explains and backs things up.' },
    { value: 'neutral', label: 'Neutral', desc: 'Plain and even, with no strong slant.' }
  ];

  var STRUCTURES = [
    { value: 'personal_narrative', label: 'Personal narrative', desc: 'Tells a story from your point of view.' },
    { value: 'instructional', label: 'Instructional', desc: 'Step by step. Shows how to do something.' },
    { value: 'explanatory', label: 'Explanatory', desc: 'Lays out how something works.' },
    { value: 'diagnostic', label: 'Diagnostic', desc: 'Names a problem, then digs into why.' },
    { value: 'argumentative', label: 'Argumentative', desc: 'Makes a case and backs it up.' },
    { value: 'prescriptive', label: 'Prescriptive', desc: 'Tells the reader what to do.' }
  ];

  // Style manual. Empty selection means no preference, so we do not list one.
  var MANUALS = [
    { value: 'ap', label: 'AP style', name: 'the Associated Press (AP) style guide' },
    { value: 'chicago_manual_of_style', label: 'Chicago', name: 'the Chicago Manual of Style' },
    { value: 'other', label: 'Other / house style', name: 'your own house style guide' }
  ];

  // Reading level: grade 4 to 12. Captions guide the extremes.
  function readingCaption(grade) {
    if (grade <= 5) return 'Very easy. Short words and short sentences.';
    if (grade <= 7) return 'Easy to scan. A good default for most readers.';
    if (grade <= 9) return 'Comfortable for a general business reader.';
    if (grade <= 11) return 'Denser. Assumes a well read audience.';
    return 'Expert level. Long sentences and specialist words are fine.';
  }

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

  var SUGGESTED_TRAITS = ['Plain spoken', 'Warm', 'Specific', 'No fluff', 'Curious', 'Confident', 'Practical', 'Wry'];
  var QUICK_HARD_RULES = ['No em-dashes', 'No en-dashes', 'No emoji', 'No exclamation points', 'No buzzwords', 'No "I hope this finds you well"'];

  /* ------------------------------------------------------------------ */
  /* State (with localStorage persistence).                             */
  /* ------------------------------------------------------------------ */

  var STORAGE_KEY = 'se_voice_profile_v1';

  function blankState() {
    return {
      name: '',
      description: '',
      reading_grade: null,        // 4-12 or null
      tone: '',
      structure: '',
      manual: '',
      concision: '',              // value string or ''
      greetings: [],
      honorifics: false,          // false = first name, true = honorific
      abbreviations: '',
      conversational: '',
      traits: [],
      samples: '',
      hard_rules: [],
      ack_template: '',
      cta_template: ''
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

  var CHECK_SVG = '<svg class="vpb-option-check" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="square"><path d="M5 13l4 4L19 7"/></svg>';

  /* ------------------------------------------------------------------ */
  /* Renderers for each control.                                         */
  /* ------------------------------------------------------------------ */

  // Single-select option cards. Click a selected card again to clear it.
  function renderOptions(containerId, items, key) {
    var box = el(containerId);
    clear(box);
    items.forEach(function (item) {
      var btn = make('button', 'vpb-option');
      btn.type = 'button';
      btn.setAttribute('aria-pressed', state[key] === item.value ? 'true' : 'false');
      if (state[key] === item.value) btn.classList.add('is-selected');
      btn.innerHTML = CHECK_SVG;
      btn.appendChild(make('span', 'vpb-option-title', item.label));
      if (item.desc) btn.appendChild(make('span', 'vpb-option-desc', item.desc));
      btn.addEventListener('click', function () {
        state[key] = (state[key] === item.value) ? '' : item.value;
        save();
        renderOptions(containerId, items, key);
      });
      box.appendChild(btn);
    });
  }

  // Multi-select pills.
  function renderPills(containerId, items, key, withExamples) {
    var box = el(containerId);
    clear(box);
    items.forEach(function (item) {
      var on = state[key].indexOf(item.value) !== -1;
      var btn = make('button', 'vpb-pill' + (on ? ' is-on' : ''));
      btn.type = 'button';
      btn.setAttribute('aria-pressed', on ? 'true' : 'false');
      btn.appendChild(document.createTextNode(item.label));
      if (withExamples && item.example) {
        var ex = make('span', 'vpb-pill-ex', ' ' + item.example);
        btn.appendChild(ex);
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

  // Tag input (traits + hard rules), with optional suggestion chips.
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
          if (!used) {
            state[opts.key].push(s);
            save();
            renderTags(opts);
          }
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
    var value = el('vpb-reading-value');
    var caption = el('vpb-reading-caption');
    var clearBtn = el('vpb-reading-clear');
    var isSet = state.reading_grade !== null;
    range.value = isSet ? state.reading_grade : 7;
    range.classList.toggle('is-unset', !isSet);
    if (isSet) {
      value.textContent = 'Grade ' + state.reading_grade;
      caption.textContent = readingCaption(state.reading_grade);
      clearBtn.hidden = false;
    } else {
      value.textContent = 'Not set';
      caption.textContent = 'Drag to set a reading level, or leave it for the AI to decide.';
      clearBtn.hidden = true;
    }
  }

  function renderConcision() {
    var range = el('vpb-concision-range');
    var value = el('vpb-concision-value');
    var clearBtn = el('vpb-concision-clear');
    var preview = el('vpb-concision-preview');
    var lvl = byValue(CONCISION, state.concision);
    var isSet = !!lvl;
    if (!lvl) lvl = CONCISION[2]; // balanced, shown muted
    range.value = lvl.step;
    range.classList.toggle('is-unset', !isSet);
    value.textContent = isSet ? lvl.label : 'Not set';
    clearBtn.hidden = !isSet;
    preview.classList.toggle('is-unset', !isSet);
    el('vpb-concision-blurb').innerHTML = isSet
      ? '<b>' + lvl.label + ':</b> ' + lvl.blurb
      : 'Drag to set how lean or expansive the writing is.';
    el('vpb-cp-sentence').textContent = lvl.sentence;
    el('vpb-cp-linkedin').textContent = lvl.linkedin;
    el('vpb-cp-email').textContent = lvl.email;
    el('vpb-concision-example').textContent = '“' + lvl.example + '”';
  }

  function byValue(list, v) {
    for (var i = 0; i < list.length; i++) if (list[i].value === v) return list[i];
    return null;
  }
  function byStep(list, step) {
    var i = Math.min(list.length, Math.max(1, Math.round(step))) - 1;
    return list[i];
  }

  /* ------------------------------------------------------------------ */
  /* Step navigation.                                                    */
  /* ------------------------------------------------------------------ */

  var STEP_NAMES = ['Basics', 'The feel', 'The shape', 'Length', 'Greetings & phrasing', 'Your words', 'Rules & extras', 'Your profile'];
  var TOTAL_INPUT_STEPS = 7; // the last step is the result
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

    // Scroll the wizard back into view on step change.
    var card = el('vpb-card');
    if (card && card.getBoundingClientRect().top < 0) {
      card.scrollIntoView({ behavior: 'smooth', block: 'start' });
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
    if ((state.description || '').trim()) {
      lines.push('_' + state.description.trim() + '_');
      lines.push('');
    }
    lines.push('You are writing in my voice. This profile sets **how** the writing should read: the tone, the length, and the rules. It does not tell you **what** to say. The topic, the facts, and the message come from me. Apply this voice to everything you draft for me, and ask me for the substance when you need it.');
    lines.push('');

    // Style
    var style = [];
    if (state.reading_grade !== null) {
      style.push('- **Reading level:** Write so a grade ' + state.reading_grade + ' reader follows easily. ' + readingCaption(state.reading_grade));
    }
    if (state.tone) {
      var t = byValue(TONES, state.tone);
      if (t) style.push('- **Tone:** ' + t.label + '. ' + t.desc);
    }
    if (state.structure) {
      var s = byValue(STRUCTURES, state.structure);
      if (s) style.push('- **Structure:** Lean toward a ' + s.label.toLowerCase() + ' shape. ' + s.desc);
    }
    if (state.manual) {
      var m = byValue(MANUALS, state.manual);
      if (m) style.push('- **Style guide:** Follow ' + m.name + '.');
    }
    if (state.concision) {
      var c = byValue(CONCISION, state.concision);
      if (c) {
        style.push('- **Length:** ' + c.label + '. ' + c.blurb + ' Aim for sentences of ' + c.sentence +
          '. A short message (such as LinkedIn) runs ' + c.linkedin + '; an email runs ' + c.email + '.');
      }
    }
    if (style.length) {
      lines.push('## Style');
      lines = lines.concat(style);
      lines.push('');
    }

    // Greeting & address
    var greet = [];
    if (state.greetings.length) {
      var ex = state.greetings.map(function (v) {
        var g = byValue(GREETINGS, v);
        return g ? g.label + ' (' + g.example + ')' : v;
      }).join('; ');
      greet.push('- **Greeting:** Open with one of these salutations only: ' + ex + '. Pick whichever best fits the person and the channel. Do not open with any other greeting.');
    }
    greet.push(state.honorifics
      ? '- **Form of address:** Address the person by their professional or academic honorific and surname (for example "Dr." for an MD or PhD, "Prof." for a professor), inferred from their title or credentials. If no honorific is clear, use their first name.'
      : '- **Form of address:** Address the person by their first name.');
    if (greet.length) {
      lines.push('## Greeting and address');
      lines = lines.concat(greet);
      lines.push('');
    }

    // Phrasing
    var phrasing = [];
    if (ABBREVIATIONS.guidance[state.abbreviations]) {
      phrasing.push('- **' + ABBREVIATIONS.guidance[state.abbreviations]);
    }
    if (CONVERSATIONAL.guidance[state.conversational]) {
      phrasing.push('- **' + CONVERSATIONAL.guidance[state.conversational]);
    }
    if (phrasing.length) {
      // Tidy the bold marker: bold just the label up to the first colon.
      phrasing = phrasing.map(function (p) {
        return p.replace(/^- \*\*([^:]+):/, '- **$1:**');
      });
      lines.push('## Phrasing');
      lines = lines.concat(phrasing);
      lines.push('');
    }

    // Traits
    if (state.traits.length) {
      lines.push('## Voice traits');
      lines.push('The voice should come across as:');
      state.traits.forEach(function (tr) { lines.push('- ' + tr); });
      lines.push('');
    }

    // Samples
    var samples = (state.samples || '').split('\n').map(function (x) { return x.trim(); }).filter(Boolean);
    if (samples.length) {
      lines.push('## Sample messages');
      lines.push('Match the rhythm and length of these. They are calibration, not templates to copy:');
      lines.push('');
      samples.forEach(function (sm) { lines.push('> ' + sm); });
      lines.push('');
    }

    // Hard rules
    if (state.hard_rules.length) {
      lines.push('## Hard rules (never break these)');
      state.hard_rules.forEach(function (r) { lines.push('- ' + r); });
      lines.push('');
    }

    // Patterns
    var patterns = [];
    if ((state.ack_template || '').trim()) patterns.push('- **Opener pattern:** ' + state.ack_template.trim());
    if ((state.cta_template || '').trim()) patterns.push('- **Call-to-action pattern:** ' + state.cta_template.trim());
    if (patterns.length) {
      lines.push('## Patterns');
      lines.push('Use these as patterns to adapt, not as fixed text:');
      lines = lines.concat(patterns);
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

  function init() {
    load();

    // Text fields
    var nameInput = el('vpb-name');
    var descInput = el('vpb-description');
    nameInput.value = state.name;
    descInput.value = state.description;
    nameInput.addEventListener('input', function () { state.name = nameInput.value; save(); });
    descInput.addEventListener('input', function () { state.description = descInput.value; save(); });

    var samplesInput = el('vpb-samples');
    samplesInput.value = state.samples;
    samplesInput.addEventListener('input', function () { state.samples = samplesInput.value; save(); });

    var ackInput = el('vpb-ack');
    var ctaInput = el('vpb-cta');
    ackInput.value = state.ack_template;
    ctaInput.value = state.cta_template;
    ackInput.addEventListener('input', function () { state.ack_template = ackInput.value; save(); });
    ctaInput.addEventListener('input', function () { state.cta_template = ctaInput.value; save(); });

    // Option groups
    renderOptions('vpb-tones', TONES, 'tone');
    renderOptions('vpb-structures', STRUCTURES, 'structure');

    // Style manual select
    var manualSel = el('vpb-manual');
    manualSel.value = state.manual;
    manualSel.addEventListener('change', function () { state.manual = manualSel.value; save(); });

    // Reading level slider
    var readingRange = el('vpb-reading-range');
    readingRange.addEventListener('input', function () {
      state.reading_grade = Number(readingRange.value);
      save();
      renderReading();
    });
    el('vpb-reading-clear').addEventListener('click', function () {
      state.reading_grade = null; save(); renderReading();
    });
    renderReading();

    // Concision slider
    var concRange = el('vpb-concision-range');
    concRange.addEventListener('input', function () {
      state.concision = byStep(CONCISION, Number(concRange.value)).value;
      save();
      renderConcision();
    });
    el('vpb-concision-clear').addEventListener('click', function () {
      state.concision = ''; save(); renderConcision();
    });
    renderConcision();

    // Greetings + phrasing
    renderPills('vpb-greetings', GREETINGS, 'greetings', true);
    renderSegmented('vpb-honorifics', [
      { value: false, label: 'First name' },
      { value: true, label: 'Honorific (Dr., Prof.)' }
    ], 'honorifics');
    renderSegmented('vpb-abbreviations', ABBREVIATIONS.choices, 'abbreviations');
    renderSegmented('vpb-conversational', CONVERSATIONAL.choices, 'conversational');

    // Traits
    var traitsOpts = { key: 'traits', tagsId: 'vpb-traits-tags', inputId: 'vpb-traits-input', suggestId: 'vpb-traits-suggest', suggestions: SUGGESTED_TRAITS };
    renderTags(traitsOpts);
    wireTagInput(traitsOpts);

    // Hard rules
    var rulesOpts = { key: 'hard_rules', tagsId: 'vpb-rules-tags', inputId: 'vpb-rules-input', suggestId: 'vpb-rules-suggest', suggestions: QUICK_HARD_RULES };
    renderTags(rulesOpts);
    wireTagInput(rulesOpts);

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
      // Reset the text inputs and re-render every control.
      nameInput.value = ''; descInput.value = ''; samplesInput.value = '';
      ackInput.value = ''; ctaInput.value = ''; manualSel.value = '';
      renderOptions('vpb-tones', TONES, 'tone');
      renderOptions('vpb-structures', STRUCTURES, 'structure');
      renderReading(); renderConcision();
      renderPills('vpb-greetings', GREETINGS, 'greetings', true);
      renderSegmented('vpb-honorifics', [{ value: false, label: 'First name' }, { value: true, label: 'Honorific (Dr., Prof.)' }], 'honorifics');
      renderSegmented('vpb-abbreviations', ABBREVIATIONS.choices, 'abbreviations');
      renderSegmented('vpb-conversational', CONVERSATIONAL.choices, 'conversational');
      renderTags(traitsOpts); renderTags(rulesOpts);
      showStep(1);
    });

    // "Start" link in the hero jumps to step 1 of the wizard.
    var startLink = el('vpb-start-link');
    if (startLink) {
      startLink.addEventListener('click', function (e) {
        e.preventDefault();
        el('vpb-card').scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    }

    showStep(1);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
