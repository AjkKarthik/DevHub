import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../shared/page-meta/page-meta';
import { QuickRefComponent, QuickRefItem } from '../../../shared/quick-ref/quick-ref';
import { TheoryBlockComponent, TheoryPoint } from '../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../shared/code-block/code-block';
import { CommonMistakesComponent, CommonMistake } from '../../../shared/common-mistakes/common-mistakes';
import { ChallengeBlockComponent, Challenge } from '../../../shared/challenge-block/challenge-block';
import { QuizBlockComponent, QuizQuestion } from '../../../shared/quiz-block/quiz-block';
import { QnaBlockComponent, QnaItem } from '../../../shared/qna-block/qna-block';
import { RevisionCardComponent, RevisionSummary } from '../../../shared/revision-card/revision-card';
import { PageCompleteComponent } from '../../../shared/page-complete/page-complete';

const quickRef: QuickRefItem[] = [
  { name: ':is()',    type: 'function', desc: 'Matches any of a list of selectors. Takes specificity of its most specific argument.' },
  { name: ':where()', type: 'function', desc: 'Like :is() but always zero specificity — great for resets and defaults.' },
  { name: ':has()',   type: 'function', desc: 'Parent selector — matches element if it contains a matching descendant.' },
  { name: ':not()',   type: 'function', desc: 'Negation — matches element that does NOT match the argument.' },
  { name: '::before / ::after', type: 'syntax', desc: 'Pseudo-elements that insert generated content before/after element.' },
  { name: '[attr~=val]', type: 'syntax', desc: 'Attribute contains word. [class~="active"] matches class="foo active".' },
  { name: '[attr^=val]', type: 'syntax', desc: 'Attribute starts with value. [href^="https"] targets secure links.' },
  { name: ':nth-child()', type: 'function', desc: 'Matches elements by position. :nth-child(2n+1) = odd rows.' },
];

const theory: TheoryPoint[] = [
  {
    heading: 'Specificity and the Cascade',
    points: [
      'Specificity determines which rule wins when multiple selectors target the same element.',
      'Scoring: inline style (1-0-0-0) > ID (0-1-0-0) > class/attribute/pseudo-class (0-0-1-0) > element/pseudo-element (0-0-0-1).',
      'Higher specificity always wins regardless of source order.',
      '!important overrides everything but breaks the cascade — use only for utilities and overrides you own.',
      ':where() has zero specificity making it ideal for base styles that are easy to override.',
    ],
  },
  {
    heading: 'Modern Pseudo-Classes: :is(), :where(), :has()',
    points: [
      ':is(h1, h2, h3) { margin: 0 } is equivalent to h1, h2, h3 { margin: 0 } but more readable.',
      ':is() takes the specificity of its most specific argument — :is(#id, .class) has ID specificity.',
      ':where() is identical to :is() but always contributes zero specificity.',
      ':has() is the CSS parent selector — .card:has(img) matches cards that contain an image.',
      ':has() can look forward in the DOM: label:has(+ input:invalid) styles a label next to an invalid input.',
    ],
  },
  {
    heading: 'Combinators',
    points: [
      'Descendant (space): A B — B anywhere inside A.',
      'Child (>): A > B — B that is a direct child of A.',
      'Adjacent sibling (+): A + B — B immediately after A at the same level.',
      'General sibling (~): A ~ B — all B siblings that follow A.',
      'Column combinator (||): for table column targeting (limited support).',
    ],
  },
  {
    heading: 'Attribute Selectors',
    points: [
      '[attr] — element has the attribute regardless of value.',
      '[attr="val"] — exact match. [type="submit"] targets only submit buttons.',
      '[attr~="val"] — value appears in a space-separated list. [class~="active"].',
      '[attr^="val"] — value starts with. [href^="https"] for secure links.',
      '[attr$="val"] — value ends with. [href$=".pdf"] for PDF links.',
      '[attr*="val"] — value contains. [class*="btn"] matches btn, btn-primary, etc.',
    ],
  },
];

const codeTabs: CodeTab[] = [
  {
    label: ':is() :where() :has()',
    language: 'css',
    code: `/* :is() — readable multi-selector, takes highest specificity */
:is(h1, h2, h3, h4) {
  line-height: 1.2;
  font-weight: 700;
}

/* :where() — same but zero specificity (easy to override) */
:where(article, section, aside) p {
  margin-bottom: 1rem;
}

/* :has() — parent selector */
.card:has(img) {
  padding: 0;              /* remove padding if card has an image */
}

.form-group:has(input:invalid) label {
  color: #ef4444;          /* red label when sibling input is invalid */
}

.nav:has(.nav-item:hover) .nav-item:not(:hover) {
  opacity: 0.5;            /* dim non-hovered items when any is hovered */
}`,
  },
  {
    label: 'Pseudo-classes',
    language: 'css',
    code: `/* Structural pseudo-classes */
li:first-child  { border-top: none; }
li:last-child   { border-bottom: none; }
li:nth-child(odd)  { background: #f8fafc; }
li:nth-child(3n+1) { color: var(--accent); } /* every 3rd starting at 1 */

/* :not() — negation */
.btn:not(.btn--ghost):not(:disabled) {
  box-shadow: 0 2px 4px rgba(0,0,0,.12);
}

/* Form state pseudo-classes */
input:focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; }
input:invalid:not(:placeholder-shown) { border-color: #ef4444; }
input:valid:not(:placeholder-shown)   { border-color: #22c55e; }

/* :empty — matches elements with no children */
.placeholder:empty::before {
  content: 'No items yet';
  color: #94a3b8;
  font-style: italic;
}`,
  },
  {
    label: 'Pseudo-elements',
    language: 'css',
    code: `/* ::before / ::after — generated content */
.required-field::after {
  content: ' *';
  color: #ef4444;
}

/* Decorative separator */
.breadcrumb-item + .breadcrumb-item::before {
  content: '›';
  margin: 0 0.5rem;
  color: #94a3b8;
}

/* Gradient text */
.gradient-heading::before { display: none; }
.gradient-heading {
  background: linear-gradient(135deg, #264de4, #7c3aed);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

/* ::placeholder — style input placeholder */
input::placeholder { color: #94a3b8; font-style: italic; }

/* ::selection — user text selection */
::selection { background: #264de4; color: #fff; }`,
  },
  {
    label: 'Attribute Selectors',
    language: 'css',
    code: `/* Style all external links */
a[href^="http"]:not([href*="yoursite.com"])::after {
  content: ' ↗';
  font-size: 0.8em;
  opacity: 0.6;
}

/* PDF download link icon */
a[href$=".pdf"]::before {
  content: '📄 ';
}

/* Style buttons by their type attribute */
[type="submit"]  { background: var(--accent); color: #fff; }
[type="reset"]   { background: transparent; border: 1px solid currentColor; }

/* Data attribute theming */
[data-variant="primary"]   { --btn-bg: #264de4; }
[data-variant="danger"]    { --btn-bg: #ef4444; }
[data-variant="success"]   { --btn-bg: #22c55e; }`,
  },
];

const mistakes: CommonMistake[] = [
  {
    title: 'Using :is() when :where() is appropriate for base styles',
    wrong: `/* High specificity — hard to override in components */
:is(h1, h2, h3) { color: #1e293b; }`,
    right: `/* Zero specificity — component styles easily win */
:where(h1, h2, h3) { color: #1e293b; }`,
    explanation: ':is() inherits the highest specificity of its arguments. For base/reset styles, :where() gives zero specificity so component styles can override without fighting specificity.',
  },
  {
    title: 'Confusing ::before/::after with :before/:after',
    wrong: `.btn:after { content: ' →'; }  /* single colon — legacy syntax */`,
    right: `.btn::after { content: ' →'; }  /* double colon — pseudo-element */`,
    explanation: 'Double colon (::) is the modern standard for pseudo-elements (::before, ::after, ::placeholder). Single colon is the legacy CSS2 syntax. Browsers support both, but use :: for clarity.',
  },
  {
    title: 'Forgetting content: "" on ::before/::after',
    wrong: `.icon::before { display: block; width: 10px; }  /* won't render */`,
    right: `.icon::before { content: ''; display: block; width: 10px; }`,
    explanation: 'Pseudo-elements require content property to render — even an empty string content: "". Without it, the pseudo-element doesn\'t exist in the layout.',
  },
  {
    title: 'Using * selector without performance awareness',
    wrong: `* { box-shadow: 0 0 0 1px red; }  /* visual debug on every element */`,
    right: `/* Scope the universal selector */
.debug * { outline: 1px solid red; }`,
    explanation: 'The universal selector * matches every element. Applying expensive properties (box-shadow, transform) via * causes full-page repaints. Scope it when debugging.',
  },
  {
    title: 'Chaining :not() instead of using :is() or :where()',
    wrong: `a:not(h1):not(h2):not(h3):not(h4) { color: blue; }`,
    right: `a:not(:is(h1, h2, h3, h4)) { color: blue; }`,
    explanation: ':not() accepts a selector list in modern CSS. Use :is() or :where() inside :not() for cleaner syntax instead of chaining multiple :not() calls.',
  },
];

const challenge: Challenge = {
  title: 'Advanced Selector Patterns',
  language: 'html',
  description: 'Using only CSS selectors (no JavaScript), implement: (1) A form that shows a green border on valid inputs and red on invalid inputs, but only after the user has interacted (not on page load). (2) A navigation where non-hovered links dim when any link is hovered. (3) Style external links with an arrow icon using attribute selectors.',
  hints: [
    'Use :invalid:not(:placeholder-shown) to avoid showing errors before interaction.',
    'Use .nav:has(.link:hover) .link:not(:hover) { opacity: 0.5 } for the dim effect.',
    'Use a[href^="http"]::after { content: " ↗" } for external links.',
    'Combine :valid and :invalid with :not(:placeholder-shown) or :not(:focus).',
  ],
  starterCode: `<form>
  <input type="email" placeholder="Email address" required />
  <input type="url" placeholder="Website URL" />
</form>

<nav class="main-nav">
  <a class="link" href="/">Home</a>
  <a class="link" href="/about">About</a>
  <a class="link" href="/contact">Contact</a>
</nav>

<p>
  <a href="/internal">Internal link</a> vs
  <a href="https://example.com">External link</a>
</p>`,
  solution: `/* Form validation styles — only after interaction */
input {
  padding: 0.5rem 0.75rem;
  border: 2px solid #e2e8f0;
  border-radius: 6px;
  outline: none;
  transition: border-color 0.2s;
  display: block;
  margin-bottom: 0.75rem;
}

input:focus { border-color: #264de4; }

input:invalid:not(:placeholder-shown):not(:focus) {
  border-color: #ef4444;
}

input:valid:not(:placeholder-shown) {
  border-color: #22c55e;
}

/* Navigation dim effect with :has() */
.main-nav {
  display: flex;
  gap: 1.5rem;
}

.main-nav .link {
  text-decoration: none;
  color: #1e293b;
  font-weight: 500;
  transition: opacity 0.15s;
}

.main-nav:has(.link:hover) .link:not(:hover) {
  opacity: 0.4;
}

/* External link arrow */
a[href^="http"]::after {
  content: ' ↗';
  font-size: 0.8em;
  opacity: 0.6;
}`,
};

const quiz: QuizQuestion[] = [
  {
    q: 'What is the specificity difference between :is() and :where()?',
    options: [
      'They have identical specificity',
      ':is() takes the highest specificity of its arguments; :where() always contributes zero',
      ':where() is more specific than :is()',
      ':is() has zero specificity; :where() takes the argument\'s specificity',
    ],
    answer: 1,
    explanation: ':is() takes the specificity of its most specific argument. :where() always contributes 0 specificity, making it ideal for base/reset styles that should be easy to override.',
  },
  {
    q: 'Which selector matches a label that is immediately followed by an invalid input?',
    options: [
      'label ~ input:invalid',
      'label:has(+ input:invalid)',
      'label + input:invalid',
      'label:adjacent(input:invalid)',
    ],
    answer: 1,
    explanation: ':has() with the + combinator inside lets you select a preceding element based on what follows it. label:has(+ input:invalid) matches the label, not the input.',
  },
  {
    q: 'What does [href$=".pdf"] match?',
    options: [
      'Links whose href starts with .pdf',
      'Links whose href contains .pdf anywhere',
      'Links whose href ends with .pdf',
      'Links whose href is exactly .pdf',
    ],
    answer: 2,
    explanation: 'The $ in attribute selector means "ends with". [href$=".pdf"] matches any element whose href attribute value ends with ".pdf".',
  },
  {
    q: 'Why must ::before and ::after have a content property?',
    options: [
      'It is optional — they render without content',
      'content sets the z-index of the pseudo-element',
      'Without content the pseudo-element does not exist in the layout',
      'content is only required for ::after, not ::before',
    ],
    answer: 2,
    explanation: 'Pseudo-elements are only generated when the content property is set, even if the value is an empty string "". Without it, the pseudo-element is not created.',
  },
  {
    q: 'What does :nth-child(3n+1) select?',
    options: [
      'Every 3rd element starting from element 3',
      'Elements 1, 4, 7, 10 … (every 3rd starting from 1)',
      'The first 3 elements only',
      'Elements at positions that are multiples of 3',
    ],
    answer: 1,
    explanation: ':nth-child(An+B) matches elements at positions B, A+B, 2A+B, … With 3n+1: positions 1, 4, 7, 10 — every third element starting from the first.',
  },
  {
    q: 'Which combinator selects ALL following siblings, not just the adjacent one?',
    options: ['+ (adjacent sibling)', '> (child)', '~ (general sibling)', '|| (column)'],
    answer: 2,
    explanation: '~ is the general sibling combinator. A ~ B matches all B elements that are siblings of A and come after it. + only matches the immediately adjacent sibling.',
  },
];

const qna: QnaItem[] = [
  {
    q: 'What is the difference between :nth-child() and :nth-of-type()?',
    a: ':nth-child(n) counts all siblings regardless of type. :nth-of-type(n) counts only siblings of the same element type. p:nth-child(2) matches a <p> only if it is the 2nd child among all siblings. p:nth-of-type(2) matches the 2nd <p> regardless of what other elements are siblings.',
  },
  {
    q: 'Is :has() safe to use in production?',
    a: 'Yes — :has() has been supported in all major browsers since December 2023 (Chrome 105+, Safari 15.4+, Firefox 121+). It is safe for production use. Check caniuse.com for the latest support table.',
  },
  {
    q: 'Can I select a parent element in CSS?',
    a: 'Yes, with :has(). .parent:has(.child) selects .parent when it contains .child. Before :has(), this required JavaScript. :has() can also look at adjacent siblings: h2:has(+ p) selects h2 elements followed immediately by a p.',
  },
  {
    q: 'What is the difference between the > child combinator and a descendant space?',
    a: 'The descendant combinator (space: A B) matches B anywhere inside A at any nesting depth. The child combinator (>: A > B) matches B only as a direct child of A. Use > when you want to limit a rule to immediate children and avoid accidentally targeting deeply nested elements.',
  },
  {
    q: 'When should I use :not() vs a modifier class?',
    a: 'Use :not() for structural exclusions that are clear from the HTML (e.g. :not(:last-child) for separators, :not([disabled]) for active states). Use a modifier class (e.g. .btn--ghost) when the meaning needs to be explicit or when multiple properties change. Avoid deeply nested :not() chains — they hurt readability.',
  },
  {
    q: 'What is the forgiving selector list in :is() and :where()?',
    a: ':is() and :where() use a forgiving selector list — if one selector in the list is invalid, the browser ignores it and continues with the rest. Standard comma-separated selector lists are not forgiving: one invalid selector invalidates the entire rule. This makes :is()/:where() safer for cross-browser selector lists.',
  },
];

const revision: RevisionSummary = {
  oneLiner: 'Modern CSS selectors — :is(), :where(), :has(), combinators, and attribute selectors — let you target any element based on structure, state, and content.',
  mustKnow: [
    ':is() = multi-selector shorthand, takes highest argument specificity.',
    ':where() = identical to :is() but zero specificity — ideal for base styles.',
    ':has() = parent selector: .card:has(img) matches a card containing an image.',
    '::before/::after require content: "" to render.',
    '[attr^=] starts-with, [attr$=] ends-with, [attr*=] contains.',
    ':nth-child(An+B) — A is cycle length, B is offset.',
  ],
  interviewFocus: [
    'Explain the specificity difference between :is() and :where().',
    'How does :has() work, and what problem does it solve?',
    'What combinators exist in CSS and when would you use each?',
    'How do you style elements differently based on their attributes?',
  ],
};

@Component({
  selector: 'app-css-selectors',
  standalone: true,
  imports: [PageMetaComponent, QuickRefComponent, TheoryBlockComponent, CodeBlockComponent,
            CommonMistakesComponent, ChallengeBlockComponent, QuizBlockComponent,
            QnaBlockComponent, RevisionCardComponent, PageCompleteComponent],
  templateUrl: './selectors.html',
  styleUrl: './selectors.scss',
})
export class CssSelectors {
  quickRef = quickRef;
  theory = theory;
  codeTabs = codeTabs;
  mistakes = mistakes;
  challenge = challenge;
  quiz = quiz;
  qna = qna;
  revision = revision;
}
