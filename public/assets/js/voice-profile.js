/*
  Voice Profile Builder.
  A guided, client-side walkthrough that turns a few choices into a markdown
  voice guide (a Claude-style SKILL file with YAML front matter) you can paste
  into ChatGPT, Claude, or any AI.

  No build step, no framework, no network, no AI call. Examples are pre-written
  and keyed to the user's job-function archetype so they feel relevant.
*/
(function () {
  'use strict';

  /* ------------------------------------------------------------------ */
  /* Inline line-icons (lucide, ISC license).                            */
  /* ------------------------------------------------------------------ */
  var ICON = {
    mail: '<rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>',
    linkedin: '<path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/><rect width="4" height="12" x="2" y="9"/><circle cx="4" cy="4" r="2"/>',
    messageCircle: '<path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z"/>',
    messageSquare: '<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>',
    slack: '<rect width="3" height="8" x="13" y="2" rx="1.5"/><path d="M19 8.5V10h1.5A1.5 1.5 0 1 0 19 8.5"/><rect width="3" height="8" x="8" y="14" rx="1.5"/><path d="M5 15.5V14H3.5A1.5 1.5 0 1 0 5 15.5"/><rect width="8" height="3" x="14" y="13" rx="1.5"/><path d="M15.5 19H14v1.5a1.5 1.5 0 1 0 1.5-1.5"/><rect width="8" height="3" x="2" y="8" rx="1.5"/><path d="M8.5 5H10V3.5A1.5 1.5 0 1 0 8.5 5"/>',
    newspaper: '<path d="M4 22h16a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v16a2 2 0 0 1-2 2Zm0 0a2 2 0 0 1-2-2v-9c0-1.1.9-2 2-2h2"/><path d="M18 14h-8"/><path d="M15 18h-5"/><path d="M10 6h8v4h-8V6Z"/>',
    fileText: '<path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/><path d="M10 9H8"/><path d="M16 13H8"/><path d="M16 17H8"/>',
    send: '<path d="M14.536 21.686a.5.5 0 0 0 .937-.024l6.5-19a.496.496 0 0 0-.635-.635l-19 6.5a.5.5 0 0 0-.024.937l7.93 3.18a2 2 0 0 1 1.112 1.11z"/><path d="m21.854 2.147-10.94 10.939"/>',
    globe: '<circle cx="12" cy="12" r="10"/><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"/><path d="M2 12h20"/>',
    coffee: '<path d="M10 2v2"/><path d="M14 2v2"/><path d="M16 8a1 1 0 0 1 1 1v8a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4V9a1 1 0 0 1 1-1h14a4 4 0 1 1 0 8h-1"/><path d="M6 2v2"/>',
    smile: '<circle cx="12" cy="12" r="10"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/><line x1="9" x2="9.01" y1="9" y2="9"/><line x1="15" x2="15.01" y1="9" y2="9"/>',
    briefcase: '<path d="M16 20V4a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/><rect width="20" height="14" x="2" y="6" rx="2"/>',
    target: '<circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/>',
    zap: '<path d="M4 14a1 1 0 0 1-.78-1.63l9.9-10.2a.5.5 0 0 1 .86.46l-1.92 6.02A1 1 0 0 0 13 10h7a1 1 0 0 1 .78 1.63l-9.9 10.2a.5.5 0 0 1-.86-.46l1.92-6.02A1 1 0 0 0 11 14z"/>',
    graduationCap: '<path d="M21.42 10.922a1 1 0 0 0-.019-1.838L12.83 5.18a2 2 0 0 0-1.66 0L2.6 9.08a1 1 0 0 0 0 1.832l8.57 3.908a2 2 0 0 0 1.66 0z"/><path d="M22 10v6"/><path d="M6 12.5V16a6 3 0 0 0 12 0v-3.5"/>',
    equal: '<line x1="5" x2="19" y1="9" y2="9"/><line x1="5" x2="19" y1="15" y2="15"/>',
    sparkles: '<path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z"/><path d="M20 3v4"/><path d="M22 5h-4"/><path d="M4 17v2"/><path d="M5 18H3"/>'
  };

  /* ------------------------------------------------------------------ */
  /* Audience taxonomies (Splendid standard job functions; concise        */
  /* LinkedIn-style industries). Used to tailor examples + the profile.   */
  /* ------------------------------------------------------------------ */

  // Splendid's standard contact job-function taxonomy (value === label).
  var JOB_FUNCTIONS = [
    'Accounting', 'Administrative', 'Agriculture, Horticulture, and the Outdoors', 'Arts and Design',
    'Business Development', 'Community and Social Services', 'Construction, Extraction, and Architecture',
    'Customer Success and Support', 'Education', 'Engineering', 'Finance', 'Healthcare',
    'Hospitality, Food, and Tourism', 'Human Resources and Recruiting',
    'Information Technology (IT) and Computer Science', 'Legal, Compliance, and Public Safety',
    'Maintenance, Repair, and Installation', 'Manufacturing and Production',
    'Marketing and Public Relations', 'Military', 'Performing Arts', 'Personal Services', 'Sales',
    'Science and Research', 'Social Analysis and Planning', 'Student', 'Transportation', 'Unemployed'
  ];

  // Each function maps to an example archetype (keeps the example set small).
  var JOB_FUNCTION_ARCHETYPE = {
    'Sales': 'sales', 'Business Development': 'sales',
    'Marketing and Public Relations': 'marketing',
    'Customer Success and Support': 'success',
    'Engineering': 'technical', 'Information Technology (IT) and Computer Science': 'technical',
    'Science and Research': 'technical', 'Manufacturing and Production': 'technical',
    'Construction, Extraction, and Architecture': 'technical',
    'Maintenance, Repair, and Installation': 'technical',
    'Accounting': 'ops', 'Finance': 'ops', 'Administrative': 'ops',
    'Human Resources and Recruiting': 'ops', 'Legal, Compliance, and Public Safety': 'ops',
    'Social Analysis and Planning': 'ops'
    // everything else falls through to 'general'
  };

  // Concise, LinkedIn-style industry groups.
  var INDUSTRIES = [
    'Technology, Information, and Media', 'Financial Services', 'Professional Services',
    'Manufacturing', 'Health Care', 'Retail and Consumer Goods', 'Education',
    'Government and Public Administration', 'Construction', 'Real Estate', 'Energy and Utilities',
    'Transportation and Logistics', 'Media and Entertainment', 'Hospitality and Travel',
    'Nonprofit', 'Agriculture', 'Legal', 'Telecommunications', 'Wholesale and Distribution', 'Other'
  ];

  /* ------------------------------------------------------------------ */
  /* Option data.                                                        */
  /* ------------------------------------------------------------------ */

  var TONES = [
    { value: '', label: 'No preference', desc: 'Let the AI choose a fitting tone.', icon: ICON.sparkles },
    { value: 'casual', label: 'Casual', desc: 'Relaxed and informal, like talking to a friend.', icon: ICON.coffee },
    { value: 'friendly', label: 'Friendly', desc: 'Warm and approachable, but still clear.', icon: ICON.smile },
    { value: 'professional', label: 'Professional', desc: 'Polished and businesslike. Safe anywhere at work.', icon: ICON.briefcase },
    { value: 'assertive', label: 'Assertive', desc: 'Confident and direct. Takes a clear stand.', icon: ICON.target },
    { value: 'bold', label: 'Bold', desc: 'Punchy and high energy. Strong claims.', icon: ICON.zap },
    { value: 'academic', label: 'Academic', desc: 'Precise and formal. Explains and backs things up.', icon: ICON.graduationCap },
    { value: 'neutral', label: 'Neutral', desc: 'Plain and even, with no strong slant.', icon: ICON.equal }
  ];

  var MANUALS = [
    { value: '', label: 'No preference', desc: 'No specific style guide.' },
    { value: 'ap', label: 'AP style', desc: 'Newsrooms, PR, and most marketing.', name: 'the Associated Press (AP) style guide' },
    { value: 'chicago_manual_of_style', label: 'Chicago', desc: 'Books, long form, and academic work.', name: 'the Chicago Manual of Style' },
    { value: 'other', label: 'Other / house style', desc: 'Your own in-house style guide.', name: 'your own house style guide' }
  ];

  // Reading level: grade 4 to graduate. Examples are neutral (they teach the
  // mechanic of complexity, not a topic), so they fit any role.
  var READING_LEVELS = [
    { value: 'grade_4', step: 1, label: 'Grade 4', blurb: 'Very simple. Short words, short sentences.',
      example: 'We changed how the team works.' },
    { value: 'grade_5', step: 2, label: 'Grade 5', blurb: 'Simple and clear. Easy for almost anyone.',
      example: 'We changed the way our team works together.' },
    { value: 'grade_6', step: 3, label: 'Grade 6', blurb: 'Plain and easy to scan. The widest audience can read it.', recommended: true,
      example: 'We changed how the team works, and it is going well.' },
    { value: 'grade_7', step: 4, label: 'Grade 7', blurb: 'Clear, with a little more range.',
      example: 'We changed how the team works together, and the early results look good.' },
    { value: 'grade_8', step: 5, label: 'Grade 8', blurb: 'Comfortable for a general business reader.',
      example: 'We reworked how the team operates, and the early results have been encouraging.' },
    { value: 'grade_9', step: 6, label: 'Grade 9', blurb: 'A bit denser. Longer sentences are fine.',
      example: 'We restructured how the team operates day to day, and the early results have been encouraging.' },
    { value: 'grade_10', step: 7, label: 'Grade 10', blurb: 'For a well read audience.',
      example: 'We restructured the team’s daily operating model, and the initial results have been encouraging across the board.' },
    { value: 'grade_11', step: 8, label: 'Grade 11', blurb: 'Formal and complex.',
      example: 'We overhauled the team’s operating model, and preliminary results have proven encouraging across nearly every measure.' },
    { value: 'grade_12', step: 9, label: 'Grade 12', blurb: 'Advanced. Long, layered sentences.',
      example: 'We overhauled the team’s operating model, and preliminary indicators suggest encouraging gains across nearly every dimension we track.' },
    { value: 'college', step: 10, label: 'College', blurb: 'Undergraduate level. Specialist words are fine.',
      example: 'We overhauled the team’s operating model, and preliminary indicators suggest meaningful, encouraging gains across nearly every dimension we currently track.' },
    { value: 'graduate', step: 11, label: 'Graduate', blurb: 'Expert level. Dense and technical.',
      example: 'Our overhaul of the team’s operating model has yielded preliminary indicators of meaningful, broadly encouraging gains across virtually every dimension under measurement.' }
  ];
  var READING_RECOMMENDED_STEP = 3; // grade 6

  var CONCISION = [
    { value: 'very_concise', step: 1, label: 'Very concise', blurb: 'Trim to the bone. Cut every needless word.',
      sentence: '6-10 words', linkedin: '1-2 sentences (about 20-35 words)', email: '40-70 words' },
    { value: 'concise', step: 2, label: 'Concise', blurb: 'Lean and direct. Short sentences, little setup.',
      sentence: '10-14 words', linkedin: '2-3 sentences (about 35-55 words)', email: '70-110 words' },
    { value: 'balanced', step: 3, label: 'Balanced', blurb: 'A natural middle. Room to explain, no padding.',
      sentence: '14-18 words', linkedin: '3-4 sentences (about 55-80 words)', email: '110-160 words' },
    { value: 'expansive', step: 4, label: 'Expansive', blurb: 'Room to elaborate. Fuller sentences and more context.',
      sentence: '18-24 words', linkedin: '4-6 sentences (about 80-120 words)', email: '160-230 words' },
    { value: 'very_expansive', step: 5, label: 'Very expansive', blurb: 'Loquacious. Rich detail and longer, flowing sentences.',
      sentence: '24-32 words', linkedin: '6+ sentences (about 120-180 words)', email: '230-350 words' }
  ];

  var GREETINGS = [
    { value: 'hi', label: 'Hi', example: '"Hi {first name},"' },
    { value: 'hello', label: 'Hello', example: '"Hello {first name},"' },
    { value: 'hey', label: 'Hey', example: '"Hey {first name},"' },
    { value: 'dear', label: 'Dear', example: '"Dear {first name}," (formal)' },
    { value: 'name_only', label: '(Name only)', example: 'lead with the name and no greeting word ("{first name},")' },
    { value: 'hi_there', label: 'Hi there', example: '"Hi there," (a greeting with no name)' }
  ];
  // Greetings that fit each tone (auto-applied unless the user edits greetings).
  var TONE_GREETINGS = {
    casual: ['hi', 'hey'], friendly: ['hi', 'hello'], professional: ['hello', 'dear'],
    assertive: ['hi', 'hey'], bold: ['hey', 'hi'], academic: ['dear', 'hello'], neutral: ['hello', 'hi']
  };

  var ABBREVIATIONS = {
    choices: [{ value: '', label: 'No preference' }, { value: 'use', label: 'Use them' }, { value: 'avoid', label: 'Spell out' }],
    guidance: {
      use: 'Abbreviations: use common abbreviations and acronyms where they read naturally (e.g. TBD, WFH, ASAP, EOD).',
      avoid: 'Abbreviations: spell terms out in full and do not use abbreviations or acronyms (write "work from home", not "WFH").'
    }
  };
  var CONVERSATIONAL = {
    choices: [{ value: '', label: 'No preference' }, { value: 'use', label: 'Conversational' }, { value: 'avoid', label: 'Full sentences' }],
    guidance: {
      use: 'Conversational phrasing: write the way people actually speak. Drop the leading subject where it reads naturally ("Would be great to connect", not "It would be great to connect"), use contractions, and allow the occasional short fragment.',
      avoid: 'Conversational phrasing: write in complete, grammatically full sentences. Keep the subject and avoid clipped, conversational constructions.'
    }
  };
  var JARGON = {
    choices: [{ value: '', label: 'No preference' }, { value: 'use', label: 'Use jargon' }, { value: 'avoid', label: 'Avoid jargon' }],
    guidance: {
      use: 'Jargon: use industry jargon and technical terms freely. The audience knows them.',
      avoid: 'Jargon: avoid industry jargon. Explain ideas in plain language anyone can follow.'
    }
  };
  var NAME_BASIS_CHOICES = [
    { value: '', label: 'No preference' },
    { value: 'first', label: 'First name' },
    { value: 'last', label: 'Last name' }
  ];
  var HONORIFIC_CHOICES = [
    { value: '', label: 'No preference' },
    { value: 'off', label: 'Off' },
    { value: 'on', label: 'On' }
  ];

  // Short examples shown under each phrasing toggle.
  var PHRASING_EXAMPLES = {
    name_basis: { first: 'Brandon', last: 'Mr. Gaulin' },
    honorifics: { on: 'Dr. Gaulin', off: 'No title, just the name' },
    jargon: { use: 'Let’s align on the funnel KPIs.', avoid: 'Let’s agree on the numbers we track.' },
    abbreviations: { use: 'WFH until EOD.', avoid: 'Working from home until end of day.' },
    conversational: { use: 'Would be great to connect.', avoid: 'It would be great to connect.' }
  };

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

  // Preset hard-rule lozenges. Toggling one on adds it to the enabled set.
  var PRESET_RULES = [
    'No em-dashes', 'No en-dashes', 'No emoji', 'No exclamation points', 'No buzzwords',
    'No clichés', 'No "I hope this finds you well"', 'No "circle back"', 'No "leverage" as a verb',
    'No hashtags', 'No rhetorical questions'
  ];

  /* ------------------------------------------------------------------ */
  /* Tailored examples, keyed by job-function archetype (no AI).         */
  /* ------------------------------------------------------------------ */

  var ARCHETYPE_TONE = {
    sales: {
      casual: 'Hey, saw your post on pricing. Smart take. Want to swap notes sometime?',
      friendly: 'Hi! Loved your post on pricing. I would happily compare notes if you are open to it.',
      professional: 'Your recent post on pricing raised a strong point. I would welcome a chance to compare approaches.',
      assertive: 'Your pricing post nailed it. Most teams get this wrong. Let us talk this week.',
      bold: 'Your pricing post says what nobody else will. This is the whole game. Let us talk.',
      academic: 'Your post on pricing made a notable point. I would value a discussion of the assumptions behind it.',
      neutral: 'You posted about pricing. It made a useful point. I am open to comparing notes.'
    },
    marketing: {
      casual: 'Hey, that campaign of yours is everywhere. Nice work. Want to trade ideas sometime?',
      friendly: 'Hi! Your latest campaign really landed. I would love to swap ideas if you are up for it.',
      professional: 'Your recent campaign stood out. I would welcome the chance to exchange notes on what worked.',
      assertive: 'Your campaign worked because it had a clear point of view. Most do not. Let us talk.',
      bold: 'Your campaign broke through the noise while everyone else blended in. Let us talk.',
      academic: 'Your campaign was effective. I would value a discussion of the messaging choices behind it.',
      neutral: 'You ran a campaign. It performed well. I am open to comparing notes on the approach.'
    },
    success: {
      casual: 'Hey, saw your team is leaning on the new feature. Love it. Want a quick tips call?',
      friendly: 'Hi! Glad to see your team using the new feature. Happy to share a few tips if useful.',
      professional: 'I noticed your team has adopted the new feature. I would be glad to share a few best practices.',
      assertive: 'Your team is close to real value here. A few tweaks will get you there. Let us talk.',
      bold: 'You are one workflow away from a result most teams never reach. Let us set it up.',
      academic: 'Your usage pattern suggests strong adoption. I would value reviewing the workflow with you.',
      neutral: 'Your team started using the feature. A short call could help. I am happy to set one up.'
    },
    technical: {
      casual: 'Hey, saw your write-up on the migration. Sharp. Want to compare notes sometime?',
      friendly: 'Hi! Really enjoyed your write-up on the migration. I would love to compare approaches.',
      professional: 'Your write-up on the migration was clear and useful. I would welcome a chance to compare approaches.',
      assertive: 'Your migration approach is right. Most teams overcomplicate this. Let us compare notes.',
      bold: 'Your migration write-up just saved teams months of pain. Let us talk.',
      academic: 'Your migration write-up was rigorous. I would value discussing the trade-offs you weighed.',
      neutral: 'You wrote up the migration. It was clear. I am open to comparing approaches.'
    },
    ops: {
      casual: 'Hey, saw the new close process. Way cleaner. Want to compare notes sometime?',
      friendly: 'Hi! The new close process looks much cleaner. I would love to compare notes if useful.',
      professional: 'Your revised close process is a clear improvement. I would welcome a chance to compare notes.',
      assertive: 'Your new process fixes the real bottleneck. Most teams miss it. Let us talk.',
      bold: 'Your new process turns a week of work into a day. Let us talk.',
      academic: 'Your revised process appears more efficient. I would value reviewing the controls behind it.',
      neutral: 'You changed the close process. It looks cleaner. I am open to comparing notes.'
    },
    general: {
      casual: 'Hey, saw what you have been working on. Really cool. Want to connect sometime?',
      friendly: 'Hi! I have enjoyed following your work. I would love to connect if you are open to it.',
      professional: 'I have followed your recent work with interest. I would welcome the chance to connect.',
      assertive: 'Your work stands out, and most does not. Let us connect this week.',
      bold: 'Your work is the kind most people only talk about doing. Let us connect.',
      academic: 'Your recent work is compelling. I would value a conversation about the thinking behind it.',
      neutral: 'I have seen your recent work. It is interesting. I am open to connecting.'
    }
  };

  var ARCHETYPE_CONCISION = {
    sales: {
      very_concise: 'Saw your pricing post. Open to a quick call?',
      concise: 'Your post on pricing stuck with me. We shipped something similar last month. Worth comparing notes?',
      balanced: 'Your post on pricing got me thinking about how rarely teams test willingness to pay. We just ran that experiment and the result surprised us. Happy to share what we found.',
      expansive: 'I caught your post on pricing and it stayed with me, because so few teams actually test willingness to pay before they set a number. We ran that experiment across two segments last quarter, and the outcome was not what we predicted. Happy to share what we learned if it is useful.',
      very_expansive: 'I read your post on pricing last week and it has been on my mind ever since, largely because it named something teams rarely discuss openly: how seldom anyone tests real willingness to pay before committing to a number. We worked through the same question last quarter, ran a structured experiment across two very different segments, and the results reshaped how we package the product. I would be glad to walk you through what we found.'
    },
    marketing: {
      very_concise: 'Loved your campaign. Want to trade ideas?',
      concise: 'Your campaign really landed. We tried a similar angle last month. Worth comparing notes?',
      balanced: 'Your campaign got me thinking about how rarely teams commit to one clear message. We just tried that and engagement jumped. Happy to share what worked.',
      expansive: 'Your campaign stayed with me, because so few teams commit to a single clear message instead of hedging. We made that bet last quarter across two channels, and the lift surprised us. Happy to share what worked if it is useful.',
      very_expansive: 'Your campaign has been on my mind since I saw it, mostly because it did the thing most teams avoid: it committed to one sharp message instead of trying to please everyone. We ran a similar bet last quarter across two channels, measured it carefully, and the results changed how we plan campaigns. I would be glad to walk you through what we learned.'
    },
    success: {
      very_concise: 'Saw your team adopt the feature. Quick tips call?',
      concise: 'Glad your team is using the new feature. A few tweaks could go a long way. Want a quick call?',
      balanced: 'I noticed your team picking up the new feature. A couple of small changes tend to unlock most of the value. Happy to walk through them on a short call.',
      expansive: 'I noticed your team adopting the new feature, which is great to see. In our experience a couple of small workflow changes unlock most of the value, and teams that skip them tend to stall. Happy to walk through what works on a short call.',
      very_expansive: 'I noticed your team has started using the new feature, which is exactly the right move, and it tends to pay off fastest when a couple of small workflow changes are in place from the start. Teams that add them early see results within weeks, while teams that skip them often stall and assume the feature is the problem. I would be glad to walk you through the handful of changes that matter most.'
    },
    technical: {
      very_concise: 'Read your migration write-up. Compare notes?',
      concise: 'Your migration write-up was sharp. We hit the same problem last quarter. Worth comparing notes?',
      balanced: 'Your migration write-up got me thinking about how teams handle backfills under load. We solved it a different way last quarter. Happy to share the trade-offs.',
      expansive: 'Your migration write-up stayed with me, because the backfill-under-load problem is one most teams underestimate. We took a different path last quarter and learned a few things the hard way. Happy to share the trade-offs if it is useful.',
      very_expansive: 'Your migration write-up has been on my mind since I read it, mainly because the backfill-under-load problem is one most teams underestimate until it is in production. We took a different path last quarter, hit a couple of failure modes we did not expect, and came out with a clearer view of the trade-offs. I would be glad to walk you through what we would do differently.'
    },
    ops: {
      very_concise: 'Saw the new close process. Compare notes?',
      concise: 'Your new close process looks much cleaner. We reworked ours last quarter. Worth comparing notes?',
      balanced: 'Your new close process got me thinking about where teams lose the most time. We cut ours from a week to two days last quarter. Happy to share how.',
      expansive: 'Your new close process stayed with me, because most teams accept a slow close as a fact of life. We cut ours from a week to two days last quarter by changing a few handoffs. Happy to share what worked if it is useful.',
      very_expansive: 'Your new close process has been on my mind since I saw it, largely because most teams treat a slow month-end close as unavoidable rather than a process problem. We cut ours from a week to two days last quarter by reworking a handful of handoffs and automating two reconciliations. I would be glad to walk you through exactly what we changed.'
    },
    general: {
      very_concise: 'Saw your work. Want to connect?',
      concise: 'I have enjoyed following your work. We are working on something related. Want to connect?',
      balanced: 'I have been following your work and it got me thinking about how rarely people share what actually worked. We learned a few things recently. Happy to compare notes.',
      expansive: 'I have been following your work for a while, and it stayed with me because so few people share the parts that did not go to plan. We went through something similar recently and learned a lot. Happy to compare notes if it is useful.',
      very_expansive: 'I have been following your work for a while now, and it has stuck with me because you share the parts most people leave out, including what did not go to plan. We worked through something similar over the past few months, made a few wrong turns, and came out with a clearer view of what matters. I would be glad to compare notes if it is useful.'
    }
  };

  /* ------------------------------------------------------------------ */
  /* State (with localStorage persistence).                             */
  /* ------------------------------------------------------------------ */

  var STORAGE_KEY = 'se_voice_profile_v3';

  function blankState() {
    return {
      name: '',
      industry: '',
      job_function: '',
      formats: [],
      reading_level: 'grade_6',
      tone: '',
      manual: '',
      concision: 'concise',
      greetings: [],
      greetings_touched: false,
      name_basis: '',
      honorifics: '',
      jargon: '',
      abbreviations: '',
      conversational: '',
      hard_rules: [],        // enabled rule strings (presets + customs that are on)
      custom_rules: []       // custom lozenges the user added (persist even if toggled off)
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
    } catch (e) { /* ignore */ }
  }
  function save() {
    try { window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch (e) { /* ignore */ }
  }

  /* ------------------------------------------------------------------ */
  /* Helpers.                                                            */
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
  function currentArchetype() {
    return JOB_FUNCTION_ARCHETYPE[state.job_function] || 'general';
  }
  function toneExample(v) {
    return v ? (ARCHETYPE_TONE[currentArchetype()][v] || '') : '';
  }
  function concisionExample(v) {
    return v ? (ARCHETYPE_CONCISION[currentArchetype()][v] || '') : '';
  }

  /* ------------------------------------------------------------------ */
  /* Renderers.                                                          */
  /* ------------------------------------------------------------------ */

  // Single-select option cards (optional icon + optional example preview + onChange).
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
        state[key] = (state[key] === item.value && !item.alwaysSet) ? '' : item.value;
        save();
        renderOptions(containerId, items, key, opts);
        if (opts.onChange) opts.onChange();
      });
      box.appendChild(btn);
    });
    if (opts.previewId) {
      var pv = el(opts.previewId);
      if (pv) {
        var ex = opts.exampleFor ? opts.exampleFor(state[key]) : null;
        if (!ex) { var sel = byValue(items, state[key]); ex = sel && sel.example ? sel.example : ''; }
        if (ex) {
          clear(pv);
          pv.style.display = '';
          pv.appendChild(make('span', 'vpb-ex-label', 'Example'));
          pv.appendChild(make('p', 'vpb-ex-text', '“' + ex + '”'));
        } else {
          pv.style.display = 'none';
        }
      }
    }
  }

  // Multi-select pills (optional leading icon, optional onChange).
  function renderPills(containerId, items, key, opts) {
    opts = opts || {};
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
      btn.addEventListener('click', function () {
        var i = state[key].indexOf(item.value);
        if (i === -1) state[key].push(item.value); else state[key].splice(i, 1);
        save();
        renderPills(containerId, items, key, opts);
        if (opts.onChange) opts.onChange();
      });
      box.appendChild(btn);
    });
  }

  function renderSegmented(containerId, choices, key, opts) {
    opts = opts || {};
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
        renderSegmented(containerId, choices, key, opts);
        if (opts.onChange) opts.onChange();
      });
      box.appendChild(btn);
    });
    if (opts.exampleId) {
      var exEl = el(opts.exampleId);
      if (exEl) {
        var ex = opts.examples ? opts.examples[state[key]] : null;
        if (ex) { exEl.style.display = ''; exEl.textContent = 'Example: ' + ex; }
        else { exEl.style.display = 'none'; }
      }
    }
  }

  // Hard rules: one set of toggle lozenges (presets + customs) above a custom
  // text input. A lozenge is "on" when its rule is in the enabled set.
  function renderHardRules() {
    var box = el('vpb-rules-pills');
    clear(box);
    var all = PRESET_RULES.concat(state.custom_rules.filter(function (r) {
      return PRESET_RULES.indexOf(r) === -1;
    }));
    all.forEach(function (rule) {
      var on = state.hard_rules.indexOf(rule) !== -1;
      var btn = make('button', 'vpb-pill' + (on ? ' is-on' : ''));
      btn.type = 'button';
      btn.setAttribute('aria-pressed', on ? 'true' : 'false');
      btn.appendChild(make('span', 'vpb-pill-mark', on ? '✓' : '+'));
      btn.appendChild(document.createTextNode(' ' + rule));
      btn.addEventListener('click', function () {
        var i = state.hard_rules.indexOf(rule);
        if (i === -1) state.hard_rules.push(rule); else state.hard_rules.splice(i, 1);
        save();
        renderHardRules();
      });
      box.appendChild(btn);
    });
  }
  function addCustomRule(raw) {
    var val = (raw || '').trim().replace(/,+$/, '').trim();
    if (!val) return;
    var exists = PRESET_RULES.concat(state.custom_rules).some(function (r) { return r.toLowerCase() === val.toLowerCase(); });
    if (!exists) state.custom_rules.push(val);
    if (state.hard_rules.indexOf(val) === -1) {
      // match case of an existing entry if present
      var match = PRESET_RULES.concat(state.custom_rules).filter(function (r) { return r.toLowerCase() === val.toLowerCase(); })[0] || val;
      if (state.hard_rules.indexOf(match) === -1) state.hard_rules.push(match);
    }
    save();
    renderHardRules();
  }

  /* ---------- Sliders (always set: reading defaults to Grade 6, concision to Concise) ---------- */
  function renderReading() {
    var range = el('vpb-reading-range');
    var lvl = byValue(READING_LEVELS, state.reading_level) || byStep(READING_LEVELS, READING_RECOMMENDED_STEP);
    range.value = lvl.step;
    el('vpb-reading-value').textContent = lvl.label;
    el('vpb-reading-blurb').innerHTML =
      '<b>' + lvl.label + (lvl.recommended ? ' (recommended)' : '') + ':</b> ' + lvl.blurb;
    el('vpb-reading-example').textContent = '“' + lvl.example + '”';
    var note = el('vpb-reading-note');
    if (lvl.step > READING_RECOMMENDED_STEP) {
      note.style.display = '';
      note.textContent = 'Above our Grade 6 recommendation. Fewer people will read it with ease.';
    } else {
      note.style.display = 'none';
    }
  }

  function renderConcision() {
    var range = el('vpb-concision-range');
    var lvl = byValue(CONCISION, state.concision) || CONCISION[1]; // default: Concise
    range.value = lvl.step;
    el('vpb-concision-value').textContent = lvl.label;
    el('vpb-concision-blurb').innerHTML = '<b>' + lvl.label + ':</b> ' + lvl.blurb;
    el('vpb-cp-sentence').textContent = lvl.sentence;
    el('vpb-cp-linkedin').textContent = lvl.linkedin;
    el('vpb-cp-email').textContent = lvl.email;
    var ex = concisionExample(lvl.value);
    var exEl = el('vpb-concision-example');
    if (ex) { exEl.style.display = ''; exEl.textContent = '“' + ex + '”'; }
    else { exEl.style.display = 'none'; }
  }

  /* ---------- Greetings (with tone auto-fill note) ---------- */
  function renderGreetings() {
    renderPills('vpb-greetings', GREETINGS, 'greetings', {
      onChange: function () { state.greetings_touched = true; save(); updateGreetingNote(); }
    });
    updateGreetingNote();
  }
  function updateGreetingNote() {
    var note = el('vpb-greetings-note');
    if (!note) return;
    if (!state.greetings_touched && state.tone && state.greetings.length) {
      note.style.display = '';
      note.textContent = 'We turned on the greetings that fit your tone. Add or remove any.';
    } else {
      note.style.display = 'none';
    }
  }
  function syncGreetingsToTone() {
    if (state.greetings_touched) return;
    state.greetings = (TONE_GREETINGS[state.tone] || []).slice();
    save();
    renderGreetings();
  }

  /* ------------------------------------------------------------------ */
  /* Step navigation.                                                    */
  /* ------------------------------------------------------------------ */

  var STEP_NAMES = ['Basics', 'Reading level', 'Tone', 'Style guide', 'Concision', 'Greetings', 'Phrasing', 'Hard rules', 'Your profile'];
  var TOTAL_INPUT_STEPS = 8;
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
    el('vpb-next').hidden = (n >= TOTAL_INPUT_STEPS);
    el('vpb-finish').hidden = (n !== TOTAL_INPUT_STEPS);
    if (n > TOTAL_INPUT_STEPS) regenerate();
    var tk = document.getElementById('vpb-takeover');
    if (tk && document.body.classList.contains('vpb-wizard-open')) tk.scrollTo({ top: 0, behavior: 'smooth' });
  }

  /* ------------------------------------------------------------------ */
  /* Markdown generation (a Claude-style SKILL file).                    */
  /* ------------------------------------------------------------------ */

  function slug(s) {
    return (s || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 48);
  }
  function listJoin(arr) {
    if (arr.length <= 1) return arr.join('');
    if (arr.length === 2) return arr[0] + ' and ' + arr[1];
    return arr.slice(0, -1).join(', ') + ', and ' + arr[arr.length - 1];
  }
  function cap(s) { return s ? s.charAt(0).toUpperCase() + s.slice(1) : s; }

  function generateMarkdown() {
    var rawName = (state.name || '').trim();
    var name = rawName || 'My voice';
    var fmtLabels = state.formats.map(function (v) { var f = byValue(FORMATS, v); return f ? f.label.toLowerCase() : v; });

    // ---- YAML front matter (how a Claude skill is discovered + used) ----
    var skillName = slug(rawName) || 'my-voice';
    var head = 'Write in ' + (rawName ? rawName + '’s voice' : 'my voice');
    if (fmtLabels.length) head += ' when drafting ' + listJoin(fmtLabels) + ' (or any copy)';
    var ctxBits = [];
    if (state.job_function) ctxBits.push(state.job_function);
    if (state.industry) ctxBits.push(state.industry);
    var ctxStr = ctxBits.length ? (' The voice belongs to someone in ' + listJoin(ctxBits) + '.') : '';
    var description = head + '. Use this skill whenever writing or editing copy for this person.' + ctxStr +
      ' It sets the tone, reading level, length, greetings, and hard rules, and governs how the writing reads, not what it says.';

    var lines = [];
    lines.push('---');
    lines.push('name: ' + skillName);
    lines.push('description: ' + JSON.stringify(description));
    lines.push('---');
    lines.push('');
    lines.push('# Voice Profile: ' + name);
    lines.push('');
    if (fmtLabels.length) { lines.push('_Used for: ' + fmtLabels.join(', ') + '._'); }
    var ctxBody = [];
    if (state.job_function) ctxBody.push(state.job_function);
    if (state.industry) ctxBody.push(state.industry);
    if (ctxBody.length) lines.push('_Context: ' + ctxBody.join(' · ') + '._');
    if (fmtLabels.length || state.job_function || state.industry) lines.push('');
    lines.push('You are writing in my voice. This profile sets **how** the writing should read: the tone, the length, and the rules. It does not tell you **what** to say. The topic, the facts, and the message come from me. Apply this voice to everything you draft for me, and ask me for the substance when you need it.');
    lines.push('');

    // Style
    var style = [];
    var rl = byValue(READING_LEVELS, state.reading_level);
    if (rl) style.push('- **Reading level:** Write at a ' + rl.label.toLowerCase() + ' reading level. ' + rl.blurb);
    var t = byValue(TONES, state.tone);
    if (state.tone && t) style.push('- **Tone:** ' + t.label + '. ' + t.desc);
    var m = byValue(MANUALS, state.manual);
    if (state.manual && m && m.name) style.push('- **Style guide:** Follow ' + m.name + '.');
    var c = byValue(CONCISION, state.concision);
    if (c) style.push('- **Concision:** ' + c.label + '. ' + c.blurb + ' Aim for sentences of ' + c.sentence + '. A short message (such as LinkedIn) runs ' + c.linkedin + '; an email runs ' + c.email + '.');
    if (style.length) { lines.push('## Style'); lines = lines.concat(style); lines.push(''); }

    // Greeting and address
    var greet = [];
    if (state.greetings.length) {
      var ex = state.greetings.map(function (v) { var g = byValue(GREETINGS, v); return g ? g.label + ' (' + g.example + ')' : v; }).join('; ');
      greet.push('- **Greeting:** Open with one of these salutations only: ' + ex + '. Pick whichever best fits the person and the channel. Do not open with any other greeting.');
    }
    var addr = [];
    if (state.name_basis === 'first') addr.push('address the person by their first name (for example Brandon)');
    else if (state.name_basis === 'last') addr.push('address the person by a courtesy title and last name (for example Mr. Gaulin)');
    if (state.honorifics === 'on') addr.push('when they hold a professional or academic title, use it (for example Dr. Gaulin or Prof. Gaulin)');
    else if (state.honorifics === 'off') addr.push('do not use titles such as Dr. or Prof.');
    if (addr.length) greet.push('- **Form of address:** ' + cap(listJoin(addr)) + '.');
    if (greet.length) { lines.push('## Greeting and address'); lines = lines.concat(greet); lines.push(''); }

    // Phrasing
    var phrasing = [];
    if (JARGON.guidance[state.jargon]) phrasing.push('- **' + JARGON.guidance[state.jargon]);
    if (ABBREVIATIONS.guidance[state.abbreviations]) phrasing.push('- **' + ABBREVIATIONS.guidance[state.abbreviations]);
    if (CONVERSATIONAL.guidance[state.conversational]) phrasing.push('- **' + CONVERSATIONAL.guidance[state.conversational]);
    if (phrasing.length) {
      phrasing = phrasing.map(function (p) { return p.replace(/^- \*\*([^:]+):/, '- **$1:**'); });
      lines.push('## Phrasing'); lines = lines.concat(phrasing); lines.push('');
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

  function copyMarkdown() {
    var flag = el('vpb-copy-flag');
    var done = function () { flag.classList.add('is-on'); setTimeout(function () { flag.classList.remove('is-on'); }, 2000); };
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(lastMarkdown).then(done, fallbackCopy);
    } else { fallbackCopy(); }
    function fallbackCopy() {
      var ta = document.createElement('textarea');
      ta.value = lastMarkdown; ta.style.position = 'fixed'; ta.style.opacity = '0';
      document.body.appendChild(ta); ta.select();
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
    a.href = url; a.download = fname;
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
  }

  /* ------------------------------------------------------------------ */
  /* Mockup flourish: typed line + cursor-reactive tilt.                 */
  /* ------------------------------------------------------------------ */
  function animateMockup() {
    var node = el('vpb-type');
    if (node) {
      var full = node.textContent;
      var caret = make('span', 'vpb-caret');
      var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      if (reduce) { node.textContent = full; node.appendChild(caret); }
      else {
        node.textContent = '';
        var txt = document.createTextNode('');
        node.appendChild(txt); node.appendChild(caret);
        var i = 0;
        var tick = function () { txt.nodeValue = full.slice(0, i); if (i < full.length) { i++; setTimeout(tick, 95); } };
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
    hero.addEventListener('mouseleave', function () { if (raf) cancelAnimationFrame(raf); mock.style.transform = ''; });
  }

  /* ------------------------------------------------------------------ */
  /* Wire up.                                                            */
  /* ------------------------------------------------------------------ */

  function fillSelect(sel, values, placeholder) {
    sel.appendChild(new Option(placeholder, ''));
    values.forEach(function (v) { sel.appendChild(new Option(v, v)); });
  }

  var toneOpts = {
    previewId: 'vpb-tone-example',
    exampleFor: toneExample,
    onChange: syncGreetingsToTone
  };

  function renderFormats() {
    renderPills('vpb-formats', FORMATS, 'formats', { onChange: updateFormatsAllBtn });
    updateFormatsAllBtn();
  }
  function updateFormatsAllBtn() {
    var btn = el('vpb-formats-all');
    if (!btn) return;
    btn.textContent = state.formats.length === FORMATS.length ? 'Clear all' : 'Select all';
  }

  function renderAll() {
    renderSelectValues();
    renderFormats();
    renderReading();
    renderOptions('vpb-tones', TONES, 'tone', toneOpts);
    renderOptions('vpb-manual', MANUALS, 'manual');
    renderConcision();
    renderGreetings();
    renderSegmented('vpb-name-basis', NAME_BASIS_CHOICES, 'name_basis', { examples: PHRASING_EXAMPLES.name_basis, exampleId: 'vpb-name-basis-ex' });
    renderSegmented('vpb-honorifics', HONORIFIC_CHOICES, 'honorifics', { examples: PHRASING_EXAMPLES.honorifics, exampleId: 'vpb-honorifics-ex' });
    renderSegmented('vpb-jargon', JARGON.choices, 'jargon', { examples: PHRASING_EXAMPLES.jargon, exampleId: 'vpb-jargon-ex' });
    renderSegmented('vpb-abbreviations', ABBREVIATIONS.choices, 'abbreviations', { examples: PHRASING_EXAMPLES.abbreviations, exampleId: 'vpb-abbreviations-ex' });
    renderSegmented('vpb-conversational', CONVERSATIONAL.choices, 'conversational', { examples: PHRASING_EXAMPLES.conversational, exampleId: 'vpb-conversational-ex' });
    renderHardRules();
  }
  function renderSelectValues() {
    el('vpb-industry').value = state.industry;
    el('vpb-job-function').value = state.job_function;
  }

  function init() {
    load();

    var nameInput = el('vpb-name');
    nameInput.value = state.name;
    nameInput.addEventListener('input', function () { state.name = nameInput.value; save(); });

    var industrySel = el('vpb-industry');
    var funcSel = el('vpb-job-function');
    fillSelect(industrySel, INDUSTRIES, 'Select your industry (or the closest)');
    fillSelect(funcSel, JOB_FUNCTIONS, 'Select your role (or the closest)');
    industrySel.addEventListener('change', function () { state.industry = industrySel.value; save(); });
    funcSel.addEventListener('change', function () {
      state.job_function = funcSel.value; save();
      // archetype changed: refresh the tailored examples
      renderOptions('vpb-tones', TONES, 'tone', toneOpts);
      renderConcision();
    });

    var fmtAll = el('vpb-formats-all');
    if (fmtAll) fmtAll.addEventListener('click', function () {
      state.formats = state.formats.length === FORMATS.length ? [] : FORMATS.map(function (f) { return f.value; });
      save();
      renderFormats();
    });

    var readingRange = el('vpb-reading-range');
    readingRange.addEventListener('input', function () { state.reading_level = byStep(READING_LEVELS, Number(readingRange.value)).value; save(); renderReading(); });

    var concRange = el('vpb-concision-range');
    concRange.addEventListener('input', function () { state.concision = byStep(CONCISION, Number(concRange.value)).value; save(); renderConcision(); });

    var ruleInput = el('vpb-rules-input');
    ruleInput.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); addCustomRule(ruleInput.value); ruleInput.value = ''; }
    });
    ruleInput.addEventListener('blur', function () { if (ruleInput.value.trim()) { addCustomRule(ruleInput.value); ruleInput.value = ''; } });

    renderAll();

    el('vpb-back').addEventListener('click', function () { if (current > 1) showStep(current - 1); });
    el('vpb-next').addEventListener('click', function () { if (current < TOTAL_INPUT_STEPS) showStep(current + 1); });
    el('vpb-finish').addEventListener('click', function () { showStep(TOTAL_INPUT_STEPS + 1); });

    el('vpb-copy').addEventListener('click', copyMarkdown);
    el('vpb-download').addEventListener('click', downloadMarkdown);
    el('vpb-startover').addEventListener('click', function () {
      if (!window.confirm('Clear all your answers and start another voice?')) return;
      state = blankState();
      try { window.localStorage.removeItem(STORAGE_KEY); } catch (e) { /* ignore */ }
      nameInput.value = '';
      ruleInput.value = '';
      renderAll();
      showStep(1);
    });

    var takeover = el('vpb-takeover');
    var getStarted = el('vpb-get-started');
    function openWizard() {
      document.body.classList.add('vpb-wizard-open');
      if (takeover) { takeover.setAttribute('aria-hidden', 'false'); takeover.scrollTop = 0; }
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

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
