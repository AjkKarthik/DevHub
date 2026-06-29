import { Component } from '@angular/core';
import { TheoryBlockComponent, TheoryPoint } from '../../../../components/shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../components/shared/code-block/code-block';
import { QuickRefComponent, QuickRefItem } from '../../../../components/shared/quick-ref/quick-ref';
import { ChallengeBlockComponent, Challenge } from '../../../../components/shared/challenge-block/challenge-block';
import { QuizBlockComponent, QuizQuestion } from '../../../../components/shared/quiz-block/quiz-block';
import { QnaBlockComponent, QnaItem } from '../../../../components/shared/qna-block/qna-block';
import { PageMetaComponent } from '../../../../components/shared/page-meta/page-meta';
import { PageCompleteComponent } from '../../../../components/shared/page-complete/page-complete';
import { CommonMistakesComponent, CommonMistake } from '../../../../components/shared/common-mistakes/common-mistakes';
import { RevisionCardComponent, RevisionSummary } from '../../../../components/shared/revision-card/revision-card';

@Component({
  selector: 'app-html-forms',
  standalone: true,
  imports: [
    TheoryBlockComponent, CodeBlockComponent, QuickRefComponent,
    ChallengeBlockComponent, QuizBlockComponent, QnaBlockComponent,
    PageMetaComponent, PageCompleteComponent, CommonMistakesComponent, RevisionCardComponent
  ],
  templateUrl: './forms.html',
  styleUrl: './forms.scss'
})
export class HtmlForms {

  quickRef: QuickRefItem[] = [
    { name: '<form>', type: 'keyword', desc: 'Container for interactive controls; action + method set where/how data is sent' },
    { name: '<label for="id">', type: 'keyword', desc: 'Associates text with an input — click label focuses the input; required for a11y' },
    { name: '<input type="text">', type: 'keyword', desc: 'Single-line text field — 20+ type values change behaviour and keyboard' },
    { name: '<input type="email">', type: 'keyword', desc: 'Validates email format; shows email keyboard on mobile' },
    { name: '<input type="password">', type: 'keyword', desc: 'Obscures characters; triggers password manager on most browsers' },
    { name: '<input type="checkbox">', type: 'keyword', desc: 'Toggle — use name array for multiple checkboxes in a group' },
    { name: '<input type="radio">', type: 'keyword', desc: 'Single-select from a group — share the same name attribute' },
    { name: '<select>', type: 'keyword', desc: 'Dropdown list; <option> children; multiple attribute for multi-select' },
    { name: '<textarea>', type: 'keyword', desc: 'Multi-line text; rows/cols set visible size; resize via CSS' },
    { name: '<button type="submit">', type: 'keyword', desc: 'Submits the form — default type inside a form is submit' },
    { name: '<fieldset> / <legend>', type: 'keyword', desc: 'Groups related inputs with a visible caption — required for radio/checkbox groups' },
    { name: 'required / pattern / min', type: 'keyword', desc: 'HTML5 constraint validation attributes — browser validates before submit' },
  ];

  theory: TheoryPoint[] = [
    {
      heading: 'The form element: action and method',
      points: [
        '<code>action</code> — URL the form data is sent to. Defaults to the current page URL if omitted.',
        '<code>method="get"</code> — appends data to the URL as query string. Use for search forms and filters. Data is visible in URL and browser history.',
        '<code>method="post"</code> — sends data in the request body. Use for sensitive data (passwords), large payloads, or actions that change server state.',
        '<code>enctype="multipart/form-data"</code> — required when the form includes a file input. Without it, only the filename is sent, not the file content.',
        'Omitting <code>action</code> is valid — the form posts to the current URL. But always set <code>method</code> explicitly.',
      ]
    },
    {
      heading: 'Labels and accessibility',
      points: [
        'Every input must have a label. A visible <code>&lt;label for="inputId"&gt;</code> is the best approach — it also makes the label text clickable to focus the input.',
        '<code>aria-label</code> can label an input without visible text (e.g. a search icon button), but prefer visible labels for usability.',
        'Placeholder text is NOT a label substitute — it disappears when the user types, leaving no hint about what the field expects.',
        '<code>&lt;fieldset&gt;</code> + <code>&lt;legend&gt;</code> groups related controls. Required for radio button and checkbox groups so screen readers announce the group context.',
      ]
    },
    {
      heading: 'Input types and their browser behaviour',
      points: [
        '<code>type="email"</code> — client-side format validation; shows @ keyboard on iOS/Android.',
        '<code>type="number"</code> — spins up/down; use <code>min</code>, <code>max</code>, <code>step</code> for range and increment control.',
        '<code>type="date"</code> — native date picker; value is always ISO format <code>YYYY-MM-DD</code> regardless of locale display.',
        '<code>type="file"</code> — file picker; <code>accept=".pdf,.docx"</code> filters what the OS picker shows; <code>multiple</code> allows selecting several files.',
        '<code>type="range"</code> — slider between min and max; pair with an <code>&lt;output&gt;</code> element to display the current value.',
        '<code>type="hidden"</code> — not rendered; useful for CSRF tokens or passing server-generated values through a form.',
      ]
    },
    {
      heading: 'HTML5 constraint validation',
      points: [
        '<code>required</code> — browser prevents submission if the field is empty. Works on text, email, select, textarea.',
        '<code>pattern="[A-Za-z]+"</code> — validates against a regex. The title attribute provides the error message.',
        '<code>min</code> / <code>max</code> — range constraints for number/date inputs.',
        '<code>minlength</code> / <code>maxlength</code> — character limits. <code>maxlength</code> also hard-blocks typing past the limit.',
        'Validation fires on submit. Use the <code>novalidate</code> attribute on <code>&lt;form&gt;</code> to disable browser validation and handle it yourself with JS.',
        'Style invalid inputs with <code>:invalid</code> and <code>:valid</code> CSS pseudo-classes — but only show errors after user interaction using <code>:user-invalid</code> (modern browsers).',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Login form',
      language: 'html',
      code: `<form action="/login" method="post" novalidate>
  <div class="field">
    <label for="email">Email address</label>
    <input
      id="email"
      type="email"
      name="email"
      autocomplete="email"
      required
      placeholder="you@example.com"
    >
  </div>

  <div class="field">
    <label for="password">Password</label>
    <input
      id="password"
      type="password"
      name="password"
      autocomplete="current-password"
      required
      minlength="8"
    >
  </div>

  <button type="submit">Sign in</button>
  <a href="/reset">Forgot password?</a>
</form>`
    },
    {
      label: 'Radio & checkbox groups',
      language: 'html',
      code: `<!-- Radio group — fieldset + legend required -->
<fieldset>
  <legend>Preferred contact method</legend>

  <label>
    <input type="radio" name="contact" value="email" checked>
    Email
  </label>
  <label>
    <input type="radio" name="contact" value="phone">
    Phone
  </label>
  <label>
    <input type="radio" name="contact" value="sms">
    SMS
  </label>
</fieldset>

<!-- Checkbox group -->
<fieldset>
  <legend>Newsletter topics</legend>

  <label>
    <input type="checkbox" name="topics" value="html">
    HTML
  </label>
  <label>
    <input type="checkbox" name="topics" value="css">
    CSS
  </label>
  <label>
    <input type="checkbox" name="topics" value="js">
    JavaScript
  </label>
</fieldset>`
    },
    {
      label: 'Select & textarea',
      language: 'html',
      code: `<!-- Grouped select (optgroup) -->
<label for="tech">Primary technology</label>
<select id="tech" name="tech" required>
  <option value="">-- choose one --</option>
  <optgroup label="Frontend">
    <option value="html">HTML</option>
    <option value="css">CSS</option>
    <option value="js">JavaScript</option>
  </optgroup>
  <optgroup label="Backend">
    <option value="node">Node.js</option>
    <option value="python">Python</option>
  </optgroup>
</select>

<!-- Textarea with visible label -->
<label for="bio">Short bio</label>
<textarea
  id="bio"
  name="bio"
  rows="4"
  maxlength="500"
  placeholder="Tell us about yourself..."
></textarea>

<!-- Range with live output -->
<label for="volume">Volume: <output id="vol-label">50</output></label>
<input
  type="range"
  id="volume"
  name="volume"
  min="0" max="100" value="50"
  oninput="document.getElementById('vol-label').value = this.value"
>`
    },
  ];

  mistakes: CommonMistake[] = [
    {
      title: 'Using placeholder as a label',
      wrong: `<input type="email" placeholder="Enter your email">`,
      right: `<label for="email">Email address</label>
<input id="email" type="email" placeholder="e.g. you@example.com">`,
      explanation: 'Placeholder disappears on focus/input, giving no reminder of what the field requires. Screen readers may not announce it. Always use a <label>.'
    },
    {
      title: 'Missing for/id pairing on label',
      wrong: `<label>Username</label>
<input type="text" name="username">`,
      right: `<label for="username">Username</label>
<input id="username" type="text" name="username">`,
      explanation: 'Without matching for/id, clicking the label does not focus the input, and screen readers cannot associate the label with its control.'
    },
    {
      title: 'Radio buttons without fieldset + legend',
      wrong: `<p>Size</p>
<input type="radio" name="size" value="S"> Small
<input type="radio" name="size" value="M"> Medium`,
      right: `<fieldset>
  <legend>Size</legend>
  <label><input type="radio" name="size" value="S"> Small</label>
  <label><input type="radio" name="size" value="M"> Medium</label>
</fieldset>`,
      explanation: 'Screen readers announce the legend before each option in the group. Without fieldset/legend, users hear "Small radio button" with no context for what is being selected.'
    },
    {
      title: 'Omitting autocomplete on common fields',
      wrong: `<input type="text" name="name">
<input type="email" name="email">`,
      right: `<input type="text" name="name" autocomplete="name">
<input type="email" name="email" autocomplete="email">`,
      explanation: 'autocomplete hints tell password managers and browsers which saved data to offer. Without it, autofill may not work, slowing form completion especially on mobile.'
    },
    {
      title: 'Using <div> as submit button',
      wrong: `<div class="btn" onclick="submitForm()">Submit</div>`,
      right: `<button type="submit">Submit</button>`,
      explanation: 'A <div> is not keyboard-focusable by default, not announced as a button by screen readers, and does not trigger form submission semantics. Use <button type="submit">.'
    },
  ];

  challenge: Challenge = {
    title: 'Build an accessible registration form',
    language: 'html',
    description: `Build a user registration form with the following requirements:

- Full name (text, required)
- Email address (email type, required, autocomplete)
- Password (password type, required, minlength 8)
- Confirm password (password type, required)
- Gender (radio group — Male, Female, Non-binary, Prefer not to say) in a fieldset
- Notifications (checkboxes — Email, SMS, Push) in a fieldset
- Country (select with at least 3 options, required)
- Bio (textarea, maxlength 300, optional)
- Submit button

All inputs must have proper labels (for/id pairing). Required fields should be marked.`,
    hints: [
      'Radio groups and checkbox groups need <fieldset> + <legend>',
      'Use autocomplete="email", autocomplete="new-password" on the appropriate inputs',
      'Mark required fields with an asterisk in the label AND add the required attribute on the input',
      'For the confirm password, add aria-describedby pointing to a hint text element',
      'The submit button should be type="submit", not type="button"'
    ],
    starterCode: `<form action="/register" method="post">
  <!-- Add your fields here -->

  <button type="submit">Create account</button>
</form>`,
    solution: `<form action="/register" method="post">

  <div class="field">
    <label for="fullname">Full name <span aria-hidden="true">*</span></label>
    <input id="fullname" type="text" name="fullname" autocomplete="name" required>
  </div>

  <div class="field">
    <label for="email">Email address <span aria-hidden="true">*</span></label>
    <input id="email" type="email" name="email" autocomplete="email" required>
  </div>

  <div class="field">
    <label for="password">Password <span aria-hidden="true">*</span></label>
    <input id="password" type="password" name="password" autocomplete="new-password" required minlength="8">
  </div>

  <div class="field">
    <label for="confirm">Confirm password <span aria-hidden="true">*</span></label>
    <input id="confirm" type="password" name="confirm" autocomplete="new-password" required aria-describedby="confirm-hint">
    <span id="confirm-hint" class="hint">Must match the password above.</span>
  </div>

  <fieldset>
    <legend>Gender</legend>
    <label><input type="radio" name="gender" value="male"> Male</label>
    <label><input type="radio" name="gender" value="female"> Female</label>
    <label><input type="radio" name="gender" value="nonbinary"> Non-binary</label>
    <label><input type="radio" name="gender" value="prefer-not"> Prefer not to say</label>
  </fieldset>

  <fieldset>
    <legend>Notifications</legend>
    <label><input type="checkbox" name="notify" value="email"> Email</label>
    <label><input type="checkbox" name="notify" value="sms"> SMS</label>
    <label><input type="checkbox" name="notify" value="push"> Push</label>
  </fieldset>

  <div class="field">
    <label for="country">Country <span aria-hidden="true">*</span></label>
    <select id="country" name="country" required>
      <option value="">-- select country --</option>
      <option value="gb">United Kingdom</option>
      <option value="us">United States</option>
      <option value="au">Australia</option>
    </select>
  </div>

  <div class="field">
    <label for="bio">Bio <span class="optional">(optional)</span></label>
    <textarea id="bio" name="bio" maxlength="300" rows="4"></textarea>
  </div>

  <button type="submit">Create account</button>
</form>`
  };

  quiz: QuizQuestion[] = [
    {
      q: 'Which HTTP method should a login form use?',
      options: ['GET', 'POST', 'PUT', 'DELETE'],
      answer: 1,
      explanation: 'POST sends credentials in the request body, not the URL. GET would expose the password in the URL, browser history, and server logs.'
    },
    {
      q: 'Why is placeholder text insufficient as a form label?',
      options: [
        'Placeholders are not supported in modern browsers',
        'They disappear when the user starts typing, leaving no reminder',
        'Screen readers always ignore placeholder attributes',
        'Placeholder text fails HTML5 validation'
      ],
      answer: 1,
      explanation: 'Placeholder text vanishes on focus or input, so users forget what the field requires. Always use a visible <label> element; use placeholder for hints or format examples.'
    },
    {
      q: 'Which element groups related radio buttons for screen reader accessibility?',
      options: ['<div>', '<section>', '<fieldset> with <legend>', '<ul>'],
      answer: 2,
      explanation: '<fieldset> groups the controls and <legend> provides the group label. Screen readers announce the legend before each radio option so users know what they are choosing.'
    },
    {
      q: 'What enctype is required when a form includes a file upload input?',
      options: [
        'application/x-www-form-urlencoded',
        'text/plain',
        'multipart/form-data',
        'application/json'
      ],
      answer: 2,
      explanation: 'multipart/form-data is required for file uploads. The default enctype (application/x-www-form-urlencoded) only sends the filename, not the file content.'
    },
    {
      q: 'What does the novalidate attribute on a <form> element do?',
      options: [
        'Disables all form inputs',
        'Prevents the form from submitting entirely',
        'Disables browser-native constraint validation so you can handle it with JavaScript',
        'Removes all required attributes from child inputs'
      ],
      answer: 2,
      explanation: 'novalidate tells the browser to skip its built-in validation on submit, allowing you to implement custom validation logic with JavaScript while keeping the required/pattern attributes as hints for your own code.'
    },
    {
      q: 'Which input attribute allows users to paste or scan from camera on mobile?',
      options: ['autocapture', 'camera', 'capture', 'accept'],
      answer: 2,
      explanation: 'The capture attribute on <input type="file"> with accept="image/*" hints to mobile browsers to open the camera directly instead of the file picker. Values: capture="user" for front camera, capture="environment" for rear camera. Ignored on desktops.',
    },
  ];

  qna: QnaItem[] = [
    {
      q: 'What is the difference between name and id on an input?',
      a: 'id must be unique per page and is used to associate a <label for="id"> with the input and for JS DOM queries. name is what gets sent as the key in the form submission (name=value pairs) and can be shared across radio buttons in a group.'
    },
    {
      q: 'When should I use GET vs POST for a form?',
      a: 'GET: search forms, filters, any request that reads data and should be bookmarkable or shareable (the query string in the URL is the state). POST: login, registration, any request that creates/changes data, or where the payload is too large or sensitive for a URL.'
    },
    {
      q: 'Can I style <select> and <input type="file"> with CSS?',
      a: 'Partially. <select> is partially styleable — you can control font, padding, and colors in most browsers, but the open dropdown is OS-rendered and cannot be styled. <input type="file"> is very limited — you can hide the default input and trigger it from a custom-styled button. For full control, use a JS custom component.'
    },
    {
      q: 'Is HTML5 form validation good enough, or do I still need server-side validation?',
      a: 'Always validate server-side too. Browser validation can be bypassed trivially (DevTools, curl, Postman). HTML5 validation is a UX convenience — it catches mistakes early and avoids a round-trip for obvious errors. Server-side validation is your actual security boundary.'
    },
    {
      q: 'What is the difference between the change and input events on a form field?',
      a: 'input fires immediately on every character typed or value change. change fires when the element loses focus (blur) after the value has changed — or for checkboxes/selects, on every change. Use input for real-time search and live validation feedback; use change when you want to wait until the user has finished editing a field.'
    },
    {
      q: 'How do you associate multiple error messages with a single input for accessibility?',
      a: 'Use aria-describedby pointing to one or more error message element IDs: <code>aria-describedby="email-error hint-text"</code>. The values are space-separated IDs. Screen readers read the input label first, then append all described-by text when the input is focused. Also set aria-invalid="true" on the input when it has an error — this announces the error state before the description.'
    },
  ];

  revision: RevisionSummary = {
    oneLiner: 'HTML forms collect user data via typed controls; accessibility, labelling, and server-side validation are non-negotiable.',
    mustKnow: [
      'Every input needs a <label for="id"> — placeholder is not a substitute',
      'Radio/checkbox groups need <fieldset> + <legend> for screen readers',
      'POST for sensitive/state-changing data; GET for search/filter (bookmarkable)',
      'file upload requires enctype="multipart/form-data" on the form',
      'HTML5 constraint validation (required, pattern, min, maxlength) is UX only — always validate server-side',
      '<button type="submit"> is the correct submission control — not <div> or <a>',
    ],
    interviewFocus: [
      'Why placeholder is not a label — disappears on typing, poor a11y',
      'GET vs POST — when to use each and the security implications',
      'Why fieldset/legend is required for radio groups',
      'HTML5 validation limitations — client-side only, bypassable',
    ]
  };
}