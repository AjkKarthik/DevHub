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
  selector: 'app-html-accessibility',
  standalone: true,
  imports: [
    TheoryBlockComponent, CodeBlockComponent, QuickRefComponent,
    ChallengeBlockComponent, QuizBlockComponent, QnaBlockComponent,
    PageMetaComponent, PageCompleteComponent, CommonMistakesComponent, RevisionCardComponent
  ],
  templateUrl: './accessibility.html',
  styleUrl: './accessibility.scss'
})
export class HtmlAccessibility {

  quickRef: QuickRefItem[] = [
    { name: 'role="..."', type: 'keyword', desc: 'Overrides or adds semantic meaning — only use when no native HTML element fits' },
    { name: 'aria-label', type: 'keyword', desc: 'Provides an accessible name when no visible text label exists' },
    { name: 'aria-labelledby', type: 'keyword', desc: 'Points to an existing element whose text becomes the accessible name' },
    { name: 'aria-describedby', type: 'keyword', desc: 'Points to descriptive text — announced after the element name' },
    { name: 'aria-live="polite"', type: 'keyword', desc: 'Announces dynamic updates when the user is idle — for status messages' },
    { name: 'aria-live="assertive"', type: 'keyword', desc: 'Interrupts the screen reader immediately — for critical error alerts' },
    { name: 'aria-expanded', type: 'keyword', desc: 'True/false: whether a controlled element (menu, accordion) is open' },
    { name: 'aria-hidden="true"', type: 'keyword', desc: 'Hides element and descendants from the accessibility tree — never on focusable elements' },
    { name: 'aria-current="page"', type: 'keyword', desc: 'Marks the active link in navigation — announced as "current page"' },
    { name: 'tabindex="0"', type: 'keyword', desc: 'Makes non-interactive element focusable in document order' },
    { name: 'tabindex="-1"', type: 'keyword', desc: 'Removes from tab order but allows programmatic .focus() calls' },
    { name: 'WCAG 2.1 A/AA/AAA', type: 'keyword', desc: 'Accessibility levels: A (minimum), AA (legal target), AAA (enhanced)' },
  ];

  theory: TheoryPoint[] = [
    {
      heading: 'ARIA — what it is and the 5 rules',
      points: [
        'ARIA (Accessible Rich Internet Applications) adds semantic meaning to elements that HTML alone cannot express — enabling complex interactive widgets (tabs, sliders, dialogs) to work with screen readers.',
        '<strong>Rule 1 — Use native HTML first.</strong> <code>&lt;button&gt;</code> is better than <code>&lt;div role="button"&gt;</code>. Native elements are focusable and have keyboard handling built in. ARIA is a patch, not a replacement.',
        '<strong>Rule 2 — Do not change semantics.</strong> Adding <code>role="heading"</code> to a <code>&lt;button&gt;</code> produces contradictory semantics that confuse screen readers.',
        '<strong>Rule 3 — All interactive ARIA controls must be keyboard operable.</strong> If you give something <code>role="button"</code>, you must also add keyboard event handlers (Enter + Space).',
        '<strong>Rule 4 — Do not hide focusable elements.</strong> <code>aria-hidden="true"</code> on a button that is still in the tab order leaves a keyboard user stranded on an invisible control.',
        '<strong>Rule 5 — Interactive elements must have an accessible name.</strong> Every button, input, and widget needs a label — via visible text, <code>aria-label</code>, or <code>aria-labelledby</code>.',
      ]
    },
    {
      heading: 'Landmark roles and page structure',
      points: [
        'Semantic HTML elements map directly to ARIA landmark roles: <code>&lt;header&gt;</code> → banner, <code>&lt;nav&gt;</code> → navigation, <code>&lt;main&gt;</code> → main, <code>&lt;footer&gt;</code> → contentinfo, <code>&lt;aside&gt;</code> → complementary.',
        'Screen reader users jump between landmarks to navigate the page — like sighted users scan visually. Well-structured landmarks replace the "click here" navigation model for AT users.',
        'Multiple landmarks of the same type need distinguishing labels: <code>&lt;nav aria-label="Primary navigation"&gt;</code> vs <code>&lt;nav aria-label="Breadcrumb"&gt;</code>.',
        'Heading hierarchy (h1 → h2 → h3) is a separate navigation tree. Screen readers list all headings — every heading should make sense as a mini table of contents entry. Never skip levels (h1 → h3).',
        'The skip-to-content link (<code>&lt;a href="#main"&gt;Skip to main content&lt;/a&gt;</code>) is the most impactful single a11y feature. It must be the first focusable element in the DOM.',
      ]
    },
    {
      heading: 'Accessible names and descriptions',
      points: [
        'An accessible name is the text announced by a screen reader for an element. The browser computes it via the Accessible Name Computation algorithm, checking (in order): <code>aria-labelledby</code>, <code>aria-label</code>, native labelling (for + id, alt, title), then inner text.',
        '<code>aria-labelledby="heading-id"</code> — references the text of an existing element as the label. Stronger than <code>aria-label</code> because the label is visible and localisation-friendly.',
        '<code>aria-label="Close modal"</code> — inline string label. Use when there is no suitable visible text to reference. Overrides inner text completely.',
        '<code>aria-describedby="hint-id"</code> — additional descriptive text announced after the name and role. Use for password hints, error messages, or important caveats.',
        'For images: <code>alt</code> is the accessible name. Empty <code>alt=""</code> = decorative (skipped). For SVG icons used as buttons: always provide an accessible name on the button, not the SVG.',
      ]
    },
    {
      heading: 'Live regions — announcing dynamic updates',
      points: [
        'When content changes dynamically (a counter updates, a form error appears, a toast notification shows), screen readers miss it unless you use a live region.',
        '<code>aria-live="polite"</code> — the change is announced when the user finishes their current action. Use for status messages, loading complete notifications, cart updates.',
        '<code>aria-live="assertive"</code> — immediately interrupts the screen reader. Use sparingly: only for critical errors that the user must hear right now.',
        'The live region container must exist in the DOM before the content is injected. Adding <code>aria-live</code> to a dynamically created element does not work reliably.',
        '<code>role="status"</code> is equivalent to <code>aria-live="polite"</code>. <code>role="alert"</code> is equivalent to <code>aria-live="assertive"</code>. These roles also imply <code>aria-atomic="true"</code> — the whole region is announced, not just the changed portion.',
      ]
    },
    {
      heading: 'Keyboard accessibility and focus management',
      points: [
        'Every interactive element must be reachable and operable via keyboard. The tab key moves through interactive elements in DOM order. Shift+Tab goes backwards.',
        '<code>tabindex="0"</code> — adds a non-interactive element to the tab order at its natural DOM position. Use when you make a <code>&lt;div&gt;</code> interactive (but prefer native elements instead).',
        '<code>tabindex="-1"</code> — removes from tab order but allows <code>element.focus()</code> calls from JavaScript. Essential for dialog and menu focus management.',
        'When a modal opens: move focus into the modal, trap Tab/Shift+Tab within it, and return focus to the trigger element when the modal closes.',
        'Visible focus indicators are mandatory (WCAG 2.1 AA). Never do <code>:focus { outline: none }</code> without providing a visible alternative. The default browser outline is acceptable; a custom <code>outline: 3px solid currentColor; outline-offset: 2px</code> is better.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Landmark regions',
      language: 'html',
      code: `<!-- Skip link (first focusable element) -->
<a href="#main" class="skip-link">Skip to main content</a>

<header>
  <!-- <header> maps to role="banner" — no explicit role needed -->
  <a href="/">DevHub</a>

  <nav aria-label="Primary navigation">
    <!-- <nav> maps to role="navigation" -->
    <ul>
      <li><a href="/" aria-current="page">Home</a></li>
      <li><a href="/html">HTML</a></li>
    </ul>
  </nav>

  <nav aria-label="Breadcrumb">
    <!-- Second nav needs a distinguishing aria-label -->
    <ol>
      <li><a href="/">Home</a></li>
      <li><a href="/html" aria-current="page">HTML</a></li>
    </ol>
  </nav>
</header>

<!-- Exactly one <main> per page — maps to role="main" -->
<main id="main">
  <h1>Accessibility</h1>

  <!-- section needs aria-label or a heading to be a landmark -->
  <section aria-labelledby="intro-heading">
    <h2 id="intro-heading">Introduction</h2>
    <p>Content here.</p>
  </section>

  <!-- aside maps to role="complementary" -->
  <aside aria-label="Related links">
    <h2>See also</h2>
    <ul>
      <li><a href="/html/semantic-elements">Semantic Elements</a></li>
    </ul>
  </aside>
</main>

<!-- <footer> maps to role="contentinfo" -->
<footer>
  <p>&copy; 2025 DevHub</p>
</footer>`
    },
    {
      label: 'ARIA widgets',
      language: 'html',
      code: `<!-- Accordion (disclosure widget) -->
<div class="accordion">
  <button
    type="button"
    aria-expanded="false"
    aria-controls="panel-1"
    id="btn-1"
  >
    What is ARIA?
  </button>
  <div id="panel-1" role="region" aria-labelledby="btn-1" hidden>
    <p>Accessible Rich Internet Applications — a set of attributes that add
       semantic meaning to HTML elements for assistive technologies.</p>
  </div>
</div>

<!-- Modal dialog -->
<button type="button" id="open-modal">Open settings</button>

<div
  id="settings-modal"
  role="dialog"
  aria-modal="true"
  aria-labelledby="modal-title"
  aria-describedby="modal-desc"
  hidden
>
  <h2 id="modal-title">Settings</h2>
  <p id="modal-desc">Adjust your preferences below.</p>

  <form>
    <label for="theme">Theme</label>
    <select id="theme" name="theme">
      <option value="light">Light</option>
      <option value="dark">Dark</option>
    </select>
  </form>

  <button type="button" id="close-modal" aria-label="Close settings modal">
    &times;
  </button>
</div>

<!-- Tab widget -->
<div role="tablist" aria-label="Code examples">
  <button role="tab" aria-selected="true" aria-controls="panel-html" id="tab-html">HTML</button>
  <button role="tab" aria-selected="false" aria-controls="panel-css" id="tab-css" tabindex="-1">CSS</button>
</div>
<div role="tabpanel" id="panel-html" aria-labelledby="tab-html">
  <p>HTML content here.</p>
</div>
<div role="tabpanel" id="panel-css" aria-labelledby="tab-css" hidden>
  <p>CSS content here.</p>
</div>`
    },
    {
      label: 'Live regions & focus',
      language: 'html',
      code: `<!-- Live region for status updates -->
<!-- Must exist in DOM before content is injected -->
<div role="status" aria-live="polite" aria-atomic="true" id="status-msg"></div>
<div role="alert" aria-live="assertive" aria-atomic="true" id="error-msg"></div>

<form>
  <div class="field">
    <label for="email">Email address</label>
    <input
      id="email"
      type="email"
      name="email"
      aria-describedby="email-error"
      aria-required="true"
    >
    <!-- Error is inserted here by JS when validation fails -->
    <span id="email-error" role="alert" class="field-error"></span>
  </div>
  <button type="submit">Subscribe</button>
</form>

<script>
const form = document.querySelector('form');
const emailInput = document.getElementById('email');
const emailError = document.getElementById('email-error');
const statusMsg = document.getElementById('status-msg');

form.addEventListener('submit', async (e) => {
  e.preventDefault();

  // Clear previous error
  emailError.textContent = '';

  if (!emailInput.validity.valid) {
    emailError.textContent = 'Please enter a valid email address.';
    emailInput.focus(); // Move focus to the field with the error
    return;
  }

  // Simulate API call
  statusMsg.textContent = 'Subscribing…';
  await new Promise(r => setTimeout(r, 1000));
  statusMsg.textContent = 'Subscribed successfully! Check your inbox.';
});
</script>

<!-- Focus trap for modal (simplified) -->
<script>
function trapFocus(modal) {
  const focusable = modal.querySelectorAll(
    'a[href], button:not([disabled]), input, select, textarea, [tabindex="0"]'
  );
  const first = focusable[0];
  const last = focusable[focusable.length - 1];

  modal.addEventListener('keydown', (e) => {
    if (e.key !== 'Tab') return;
    if (e.shiftKey) {
      if (document.activeElement === first) {
        e.preventDefault();
        last.focus();
      }
    } else {
      if (document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
  });
}
</script>`
    },
  ];

  mistakes: CommonMistake[] = [
    {
      title: 'role="button" on div without keyboard handler',
      wrong: `<div role="button" onclick="doThing()">Click me</div>`,
      right: `<button type="button" onclick="doThing()">Click me</button>`,
      explanation: 'Native <button> is focusable, handles Enter and Space, and is announced as "button". A div with role="button" still needs tabindex="0" plus separate keydown handlers for Enter and Space — adding ARIA when the native element works perfectly is always wrong.'
    },
    {
      title: 'aria-hidden="true" on a focusable element',
      wrong: `<button aria-hidden="true">Close</button>`,
      right: `<!-- If decorative, remove from DOM: -->
<span aria-hidden="true">✕</span>
<!-- If the button must stay: -->
<button aria-label="Close modal">✕</button>`,
      explanation: 'aria-hidden removes an element from the accessibility tree but NOT the tab order. Keyboard users can tab to an invisible control with no name — a critical trap. Never use aria-hidden on buttons, links, or inputs.'
    },
    {
      title: 'Broken heading hierarchy (skipping levels)',
      wrong: `<h1>DevHub</h1>
<h3>HTML Topics</h3>  <!-- skipped h2 -->
<h5>Forms</h5>        <!-- skipped h4 -->`,
      right: `<h1>DevHub</h1>
<h2>HTML Topics</h2>
<h3>Forms</h3>`,
      explanation: 'Screen reader users navigate by heading level. Skipping levels breaks the document outline and makes the heading tree confusing. Headings must form a logical hierarchy — never skip a level for visual styling (use CSS instead).'
    },
    {
      title: 'Live region added after content injection',
      wrong: `<script>
// Dynamically adding both the region and content at the same time
const div = document.createElement('div');
div.setAttribute('aria-live', 'polite');
div.textContent = 'File uploaded successfully';
document.body.appendChild(div);
</script>`,
      right: `<!-- Live region in HTML from page load -->
<div role="status" aria-live="polite" id="status"></div>

<script>
// Only inject content — the region already exists
document.getElementById('status').textContent = 'File uploaded successfully';
</script>`,
      explanation: 'Screen readers only observe live region updates for elements that were in the DOM when the page loaded (or when the observer was set up). Creating the region and injecting content simultaneously means the update is missed.'
    },
    {
      title: 'Using placeholder text as an accessible label',
      wrong: `<input type="search" placeholder="Search topics...">`,
      right: `<label for="search" class="sr-only">Search topics</label>
<input id="search" type="search" placeholder="e.g. flexbox, async">`,
      explanation: 'placeholder disappears when the user types. Screen readers may not announce it at all, or may only read it on first focus. Every input must have a visible or sr-only <label> associated via for/id. Placeholder is for format hints, not field names.'
    },
  ];

  challenge: Challenge = {
    title: 'Build an accessible modal dialog',
    language: 'html',
    description: `Build a fully accessible modal dialog that meets WCAG 2.1 AA requirements:

1. A "Show preferences" button that opens the modal
2. The modal must have:
   - role="dialog" and aria-modal="true"
   - aria-labelledby pointing to a visible heading inside the modal
   - aria-describedby pointing to a short description paragraph
   - Focus moves into the modal when it opens (focus the first interactive element)
   - Tab key is trapped within the modal
   - Escape key closes the modal
   - Focus returns to the trigger button when the modal closes
3. The modal must contain: a heading, a paragraph description, a labelled checkbox, and a "Save" and "Cancel" button
4. Include a visually hidden live region that announces "Preferences saved" after Save`,
    hints: [
      'Use aria-labelledby on the dialog pointing to the h2 id',
      'tabindex="-1" on the modal div allows programmatic .focus()',
      'The focus trap queries for all focusable elements: button, input, select, a[href], [tabindex="0"]',
      'On Escape key: close modal and return focus to the trigger element',
      'On Save: announce via aria-live="polite" region, then close'
    ],
    starterCode: `<!-- trigger button -->

<!-- modal markup -->

<!-- live region for confirmation -->

<style>
  [hidden] { display: none; }
  .modal-backdrop { position:fixed; inset:0; background:rgba(0,0,0,.5); }
  .modal-box { position:fixed; top:50%; left:50%; transform:translate(-50%,-50%); background:#fff; padding:2rem; border-radius:8px; min-width:320px; }
</style>

<script>/* add open/close/trap focus logic */</script>`,
    solution: `<button type="button" id="open-prefs">Show preferences</button>

<div id="prefs-modal" role="dialog" aria-modal="true"
     aria-labelledby="prefs-title" aria-describedby="prefs-desc"
     hidden tabindex="-1">
  <div class="modal-backdrop" id="backdrop"></div>
  <div class="modal-box">
    <h2 id="prefs-title">Preferences</h2>
    <p id="prefs-desc">Adjust your site preferences below. Changes are saved immediately.</p>
    <label>
      <input type="checkbox" id="dark-mode"> Enable dark mode
    </label>
    <div style="margin-top:1rem; display:flex; gap:0.5rem;">
      <button type="button" id="save-prefs">Save</button>
      <button type="button" id="close-prefs">Cancel</button>
    </div>
  </div>
</div>

<div role="status" aria-live="polite" id="prefs-status"
     style="position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0,0,0,0);"></div>

<style>
  [hidden] { display: none; }
  .modal-backdrop { position:fixed; inset:0; background:rgba(0,0,0,.5); }
  .modal-box { position:fixed; top:50%; left:50%; transform:translate(-50%,-50%); background:#fff; padding:2rem; border-radius:8px; min-width:320px; }
</style>

<script>
const modal = document.getElementById('prefs-modal');
const openBtn = document.getElementById('open-prefs');
const saveBtn = document.getElementById('save-prefs');
const closeBtn = document.getElementById('close-prefs');
const status = document.getElementById('prefs-status');

function getFocusable() {
  return [...modal.querySelectorAll('button, input, select, textarea, a[href], [tabindex="0"]')];
}

function openModal() {
  modal.hidden = false;
  const first = getFocusable()[0];
  first?.focus();
}

function closeModal() {
  modal.hidden = true;
  openBtn.focus();
}

openBtn.addEventListener('click', openModal);
closeBtn.addEventListener('click', closeModal);
document.getElementById('backdrop').addEventListener('click', closeModal);

saveBtn.addEventListener('click', () => {
  status.textContent = 'Preferences saved.';
  closeModal();
  setTimeout(() => { status.textContent = ''; }, 3000);
});

modal.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') { closeModal(); return; }
  if (e.key !== 'Tab') return;
  const focusable = getFocusable();
  const first = focusable[0];
  const last = focusable[focusable.length - 1];
  if (e.shiftKey) {
    if (document.activeElement === first) { e.preventDefault(); last.focus(); }
  } else {
    if (document.activeElement === last) { e.preventDefault(); first.focus(); }
  }
});
</script>`
  };

  quiz: QuizQuestion[] = [
    {
      q: 'Which of the 5 rules of ARIA says you should prefer native HTML elements?',
      options: [
        'Rule 1 — Use native HTML elements first',
        'Rule 2 — Do not change semantics unnecessarily',
        'Rule 3 — All interactive controls must be keyboard operable',
        'Rule 5 — Interactive elements must have an accessible name'
      ],
      answer: 0,
      explanation: 'Rule 1 is the most important: if a native HTML element (button, input, select) provides the semantics you need, use it. Native elements have built-in keyboard handling, focus management, and ARIA roles. ARIA should only fill gaps.'
    },
    {
      q: 'What is the minimum WCAG 2.1 level required by most accessibility laws (e.g. EAA, ADA)?',
      options: ['Level A', 'Level AA', 'Level AAA', 'Level A and AAA combined'],
      answer: 1,
      explanation: 'WCAG 2.1 Level AA is the legal target in most jurisdictions — including the EU Web Accessibility Directive, the UK Equality Act, and US ADA Section 508. Level A is the minimum baseline. Level AAA is optional enhanced conformance.'
    },
    {
      q: 'A counter dynamically increments when the user clicks a button. What is the correct way to announce the update?',
      options: [
        'Add aria-live="polite" to the button',
        'Use document.title changes',
        'Add a pre-existing <div role="status" aria-live="polite"> and update its text content',
        'Create a new <div aria-live="polite"> each time the count changes'
      ],
      answer: 2,
      explanation: 'The live region container must exist in the DOM before content is injected — creating and populating it simultaneously does not trigger screen reader announcements. role="status" implies aria-live="polite". Update the text content of the existing region; never recreate it.'
    },
    {
      q: 'When should you use aria-labelledby instead of aria-label?',
      options: [
        'When the label text is more than 5 words',
        'When there is a visible element whose text can serve as the label',
        'When the element is a form input',
        'aria-labelledby is deprecated — always use aria-label'
      ],
      answer: 1,
      explanation: 'aria-labelledby references the text of an existing visible element. It is preferred over aria-label because the label is visible to all users, works with localisation/translation tools automatically, and does not create a disconnect between what sighted users and screen reader users experience.'
    },
    {
      q: 'Why must aria-hidden="true" never be applied to a focusable element?',
      options: [
        'aria-hidden conflicts with tabindex and causes a build error',
        'The element is hidden from the accessibility tree but remains in the tab order, leaving keyboard users on a control with no name or role',
        'Screen readers ignore aria-hidden completely',
        'aria-hidden only works on div and span elements'
      ],
      answer: 1,
      explanation: 'aria-hidden removes an element from the accessibility tree (no name, no role announced) but does NOT remove it from the tab order. A keyboard user can tab to an invisible, unnamed control — they hear nothing but lose their place. Either remove the element from the DOM, use display:none, or remove the tabindex.'
    },
    {
      q: 'Which WCAG success criterion covers keyboard accessibility?',
      options: ['1.1.1 Non-text Content', '2.1.1 Keyboard', '3.1.1 Language of Page', '4.1.2 Name, Role, Value'],
      answer: 1,
      explanation: 'WCAG 2.1.1 (Keyboard) requires that all functionality be operable via keyboard without requiring specific timings for keystrokes. This covers form controls, links, modals, and custom widgets. 4.1.2 (Name, Role, Value) is the ARIA semantic requirement.'
    },
  ];

  qna: QnaItem[] = [
    {
      q: 'What is the difference between aria-label and aria-labelledby?',
      a: '<code>aria-label</code> provides an inline string as the accessible name — good for icon buttons and controls with no visible label. <code>aria-labelledby</code> references the id(s) of existing visible elements — the referenced text becomes the accessible name. <code>aria-labelledby</code> is preferred when visible text exists: it stays in sync with visual content and works with translation tools automatically.'
    },
    {
      q: 'Does adding ARIA make a site more accessible?',
      a: 'Not necessarily — incorrect ARIA makes accessibility worse. According to the WebAIM Million study, pages with more ARIA have measurably more errors on average than pages without it. ARIA only adds semantics; it does not add keyboard handling, visible focus, or proper colour contrast. The safest path is native HTML first, ARIA only where no native element fits, and always test with an actual screen reader.'
    },
    {
      q: 'What should happen to focus when a modal dialog closes?',
      a: 'Focus must return to the element that triggered the modal — usually the button that opened it. Without this, a keyboard user\'s focus drops to an unpredictable place in the document (often the body), forcing them to navigate from the beginning. Store a reference to <code>document.activeElement</code> before opening the modal and call <code>.focus()</code> on it when closing.'
    },
    {
      q: 'Is colour contrast an ARIA concern?',
      a: 'No — colour contrast is a CSS/design concern covered by WCAG Success Criterion 1.4.3 (Contrast Minimum, AA level). The requirement is a minimum 4.5:1 ratio for normal text and 3:1 for large text (18pt/14pt bold). ARIA does not affect contrast. Use tools like the WebAIM Contrast Checker or browser DevTools accessibility panel to verify.'
    },
    {
      q: 'If an element has both a visible text label AND an aria-label attribute, which one does a screen reader announce?',
      a: 'The aria-label — it takes precedence over the element\'s own visible text content when computing the accessible name. This is a common, hard-to-spot bug: a developer adds aria-label="Submit" for a button whose visible text has since been changed to "Save Changes," and screen reader users hear the STALE "Submit" label while sighted users see "Save Changes" — the two experiences silently diverge. If visible text already exists and is accurate, it is usually safer to omit aria-label entirely and let the visible text serve as the accessible name.'
    },
    {
      q: 'What is a focus trap and when should you implement one?',
      a: 'A focus trap keeps keyboard focus within a container (like a modal dialog) so Tab cycles through only the elements inside. Without it, users can tab behind the overlay, interacting with hidden content. Implement it when: modal dialogs are open, off-canvas menus are open, or any overlay that covers the rest of the page. Release the trap on close and return focus to the triggering element.'
    },
  ];

  revision: RevisionSummary = {
    oneLiner: 'ARIA attributes add semantic meaning to HTML for assistive technologies — but native HTML is always the first choice.',
    mustKnow: [
      'Rule 1: use native HTML first — <code>&lt;button&gt;</code> beats <code>&lt;div role="button"&gt;</code> every time',
      'Every interactive element needs an accessible name via visible text, aria-label, or aria-labelledby',
      'aria-hidden="true" must never appear on focusable elements — users get trapped on invisible controls',
      'Live regions (aria-live="polite"/role="status") must exist in the DOM before content is injected',
      'Modal dialogs: move focus in on open, trap Tab within, return focus to trigger on close, handle Escape',
      'WCAG 2.1 AA is the legal target — Level A is minimum, Level AAA is optional',
    ],
    interviewFocus: [
      'The 5 ARIA rules — especially Rule 1 (native HTML first) and Rule 3 (keyboard operability)',
      'aria-hidden on focusable elements — why it\'s a critical bug',
      'Live region lifecycle — why the container must pre-exist',
      'Modal focus management — the open/trap/close/return pattern',
    ]
  };
}