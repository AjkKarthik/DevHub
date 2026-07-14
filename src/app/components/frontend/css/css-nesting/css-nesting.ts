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
  { name: '& (parent selector)',         type: 'syntax',  desc: 'Refers to the parent selector in a nesting context. Required when the nested selector starts with a non-identifier (e.g. &:hover, &.active, &[aria-*]).' },
  { name: 'Implicit nesting',            type: 'syntax',  desc: 'Child rules that start with a tag name or class don\'t need & — .card { p { } } is valid and means .card p { }.' },
  { name: '& combinators',               type: 'syntax',  desc: '& + p, & ~ span, & > li — use & with any combinator inside a nested rule.' },
  { name: 'Nested @media',               type: 'syntax',  desc: '.card { @media (min-width: 768px) { flex-direction: row; } } — context-aware breakpoints alongside the component.' },
  { name: 'Nested @layer',               type: 'syntax',  desc: '@layer can be nested inside @layer blocks (but not inside rule blocks).' },
  { name: 'Specificity in nesting',      type: 'keyword', desc: 'Specificity is the same as the equivalent non-nested selector — nesting is purely a authoring convenience.' },
  { name: 'Browser support',             type: 'keyword', desc: 'Chrome 112+, Firefox 117+, Safari 17.2+ — all modern browsers. No preprocessor needed.' },
];

const theory: TheoryPoint[] = [
  {
    heading: 'What is Native CSS Nesting?',
    points: [
      'CSS nesting lets you write child selectors inside their parent rule — exactly like SCSS/Sass, but built into the browser with no build step.',
      'Before nesting, you had to repeat the parent selector: .card { } .card:hover { } .card .title { } — three separate rules.',
      'With nesting: .card { &:hover { } .title { } } — everything related to .card lives in one block, improving readability and co-location.',
      'Nesting shipped in all major browsers in 2023 (Chrome 112, Firefox 117, Safari 17.2) — safe to use without a preprocessor today.',
      'The specificity of nested rules is identical to writing them flat — nesting is purely a syntax convenience, not a new cascade mechanism.',
    ],
  },
  {
    heading: 'The & Selector and When to Use It',
    points: [
      '& always refers to the parent selector. .card { &:hover { } } expands to .card:hover { }.',
      '& is REQUIRED when the nested selector starts with a non-identifier: pseudo-classes (&:hover), pseudo-elements (&::before), attributes (&[disabled]), combinator-only rules.',
      '& is optional when the nested selector starts with a class, tag, or id — .card { p { } } implicitly means .card p { }.',
      '& can appear anywhere in the nested selector: .nav { .dark & { } } expands to .dark .nav — allows parent-context overrides.',
      'Multiple & in one selector: & + & expands to .card + .card (sibling of the same element).',
    ],
  },
  {
    heading: 'Nesting @media and Other At-Rules',
    points: [
      'You can nest @media, @supports, @layer, and @container inside rule blocks — putting breakpoints right next to the styles they modify.',
      '.card { display: grid; @media (width >= 600px) { grid-template-columns: 1fr 1fr; } } — the breakpoint lives with the grid rule.',
      'This eliminates the "scattered breakpoints" problem where responsive overrides are far from the original declarations.',
      'Nested @media is equivalent to the same @media at the top level — specificity and order are unchanged.',
      '@container can be nested inside rules to combine container queries with component styles in one block.',
    ],
  },
  {
    heading: 'Native CSS Nesting vs Preprocessor Nesting',
    points: [
      'Native CSS nesting (supported directly by modern browsers without a build step) requires the & symbol to reference the parent selector when combining with a pseudo-class or combining directly (like &:hover or &.active), whereas Sass nesting allows more implicit, flexible nesting patterns without this requirement.',
      'Because native nesting compiles to real CSS understood natively by the browser, there is no build step overhead and no risk of preprocessor-specific syntax that becomes a dependency on a build toolchain — a meaningful simplification for projects that do not otherwise need a CSS preprocessor.',
      'Excessive nesting depth (whether native or Sass) produces increasingly specific, hard-to-override selectors — the same specificity escalation problem that flat naming conventions like BEM were designed to avoid; nesting should generally be kept shallow (2-3 levels) even when the syntax technically permits deeper nesting.',
      'Native CSS nesting has slightly different scoping and specificity calculation rules compared to Sass nesting in some edge cases — teams migrating from Sass nesting to native CSS nesting should verify the compiled output matches expectations rather than assuming byte-for-byte identical behavior.',
    ],
  },
  {
    heading: 'When Nesting Improves vs Hurts Readability',
    points: [
      'Nesting genuinely improves readability when it mirrors the actual DOM structure being styled (a .card containing nested .card-title and .card-body rules) — the visual nesting in the CSS matches the mental model of the HTML structure, making the relationship between rules immediately clear.',
      'Nesting hurts readability when used purely to avoid repeating a parent selector for unrelated, loosely-connected rules — deeply nested selectors targeting elements several DOM levels away from the nesting root obscure rather than clarify the actual specificity and applicability of the resulting compiled selector.',
      'A useful heuristic: nest pseudo-classes, pseudo-elements, and direct state modifiers of the current selector (&:hover, &.is-active, &::before) freely, since these clearly belong to the parent — but be more cautious about nesting unrelated descendant selectors many levels deep.',
      'Tooling (browser DevTools showing the fully compiled selector, or a CSS linter enforcing a maximum nesting depth) helps catch nesting that has grown beyond what is genuinely readable, since deeply nested source code can visually "look fine" while producing an unexpectedly specific and hard-to-override compiled selector.',
    ],
  },
];

const codeTabs: CodeTab[] = [
  {
    label: 'Basic Nesting',
    language: 'css',
    code: `/* Before nesting — repeated parent selectors */
.card { background: #fff; border-radius: 8px; padding: 1.5rem; }
.card:hover { box-shadow: 0 4px 16px rgba(0,0,0,.1); }
.card .card-title { font-size: 1.25rem; font-weight: 700; margin: 0 0 .5rem; }
.card .card-title::before { content: ''; display: block; }
.card .card-body { color: #6b7280; line-height: 1.6; }
.card .card-footer { margin-top: 1rem; display: flex; gap: .5rem; }

/* After nesting — everything in one block */
.card {
  background: #fff;
  border-radius: 8px;
  padding: 1.5rem;

  &:hover { box-shadow: 0 4px 16px rgba(0,0,0,.1); }

  .card-title {
    font-size: 1.25rem;
    font-weight: 700;
    margin: 0 0 .5rem;

    &::before { content: ''; display: block; }
  }

  .card-body  { color: #6b7280; line-height: 1.6; }
  .card-footer { margin-top: 1rem; display: flex; gap: .5rem; }
}`,
  },
  {
    label: '& Parent Selector Tricks',
    language: 'css',
    code: `/* & is required for pseudo-classes, pseudo-elements, and attributes */
.btn {
  padding: .5rem 1.25rem;
  border-radius: 4px;

  &:hover  { opacity: .85; }
  &:focus-visible { outline: 2px solid currentColor; outline-offset: 2px; }
  &:disabled { opacity: .4; cursor: not-allowed; }
  &::before { content: ''; }

  /* & with combinators */
  & + & { margin-left: .5rem; }   /* btn immediately after btn */
  & > span { pointer-events: none; }
}

/* & reversed: parent-context overrides */
.nav-link {
  color: #264de4;

  /* When .nav-link is inside .dark — no JS needed */
  .dark & { color: #93c5fd; }

  /* When .nav-link is inside a sidebar */
  .sidebar & { font-size: .875rem; }
}

/* BEM elements/modifiers: write them flat, not concatenated with & */
.block { }
.block__element { color: red; }
.block--modifier { font-weight: 700; }

/* Nesting still works for combining & with a FULL class name */
.block__element {
  &.block__element--highlighted { color: blue; }
}`,
  },
  {
    label: 'Nested @media',
    language: 'css',
    code: `/* Breakpoints co-located with their component */
.card {
  display: grid;
  grid-template-columns: 1fr;
  gap: 1rem;
  padding: 1rem;

  /* Tablet */
  @media (width >= 600px) {
    grid-template-columns: 200px 1fr;
    padding: 1.5rem;
  }

  /* Desktop */
  @media (width >= 1024px) {
    grid-template-columns: 280px 1fr;
    gap: 2rem;
    padding: 2rem;
  }

  /* High contrast mode */
  @media (forced-colors: active) {
    border: 2px solid ButtonText;
  }

  /* Reduced motion */
  .card-img {
    transition: transform .3s ease;

    @media (prefers-reduced-motion: reduce) {
      transition: none;
    }
  }
}`,
  },
  {
    label: 'Nesting + @container + @layer',
    language: 'css',
    code: `@layer components;

@layer components {
  .widget {
    container-type: inline-size;
    padding: 1rem;
    background: #fff;

    /* Container query nested inside rule */
    @container (width >= 400px) {
      display: grid;
      grid-template-columns: 120px 1fr;
    }

    /* @supports nested inside rule */
    @supports (display: subgrid) {
      .widget-inner { display: subgrid; }
    }

    /* Pseudo nested with & */
    &:hover { background: #f9fafb; }

    /* Dark mode */
    :host-context(body.dark) & {
      background: #1f2937;
      color: #f9fafb;
    }

    .widget-title {
      font-weight: 700;
      margin: 0 0 .5rem;

      @media (width >= 600px) { font-size: 1.25rem; }
    }
  }
}`,
  },
];

const mistakes: CommonMistake[] = [
  {
    title: 'Omitting & before pseudo-classes in older syntax',
    wrong: `.card {
  :hover { background: #f0f0f0; }  /* matches ANY :hover inside .card */
}`,
    right: `.card {
  &:hover { background: #f0f0f0; }  /* matches .card:hover specifically */
}`,
    explanation: 'Without &, :hover is treated as a descendant selector — .card :hover — which matches any hovered element inside the card. Always use & when the nested selector starts with a pseudo-class or pseudo-element.',
  },
  {
    title: 'Nesting too deeply',
    wrong: `.nav {
  .nav-list {
    .nav-item {
      .nav-link {
        &:hover {
          span { color: red; }
        }
      }
    }
  }
}`,
    right: `.nav { }
.nav-link { color: inherit; }
.nav-link:hover { color: #264de4; }
.nav-link:hover span { color: #264de4; }`,
    explanation: 'Deep nesting produces high-specificity selectors and makes styles hard to override. Keep nesting to 2–3 levels maximum. If you need more, it is usually a sign the component should be broken up.',
  },
  {
    title: 'Using & for BEM concatenation incorrectly',
    wrong: `.block {
  &__element { }   /* invalid — the entire rule is silently dropped */
}`,
    right: `/* Native CSS nesting does NOT concatenate strings — & is the full selector */
.block { }
.block__element { }  /* write BEM selectors flat in native CSS */

/* To combine & with a full class name, include the leading dot */
.block__element {
  &:hover { }
  &.block__element--modifier { }   /* & + full class name, not just the suffix */
}`,
    explanation: '& is always the full parent selector (.block), not a string fragment, and a bare identifier immediately after & (like __element or --modifier with no leading dot) is not valid CSS — a type selector cannot follow another selector in a compound. The whole nested rule is silently dropped, with no console warning. Sass-style BEM concatenation only works in preprocessors; in native CSS either write BEM selectors flat, or nest using the full class name with its leading dot (&.block__element--modifier).',
  },
  {
    title: 'Expecting nesting to change specificity',
    wrong: `/* Thinking nested rules have higher specificity */
.card {
  color: red;        /* specificity: 0,1,0 */
  .title { color: blue; }  /* still 0,2,0 — same as .card .title flat */
}`,
    right: `/* Nesting is purely syntactic — no specificity bonus */
.card .title { color: blue; }  /* identical specificity to nested version */`,
    explanation: 'CSS nesting does not add a specificity bonus. .card { .title { } } is exactly equivalent to .card .title { } — same specificity. This means you still need to be mindful of specificity when overriding nested rules.',
  },
];

const challenge: Challenge = {
  title: 'Nest a Navigation Component',
  language: 'scss',
  description: 'Rewrite this flat CSS as native CSS nesting. Requirements: (1) All .nav-* rules nested inside .nav. (2) Hover/focus-visible states use &. (3) Active link style uses &.active. (4) The responsive breakpoint (show hamburger below 768px) is nested inside .nav using @media. (5) Keep nesting max 3 levels deep.',
  hints: [
    'Start with .nav { } and nest .nav-list, .nav-item, .nav-link inside it.',
    'Use & for :hover, :focus-visible, and .active — they attach directly to the element.',
    'Nest the @media (max-width: 767px) block inside .nav to keep the breakpoint co-located.',
    '.nav-link { & + & { } } to style a link immediately following another link.',
  ],
  starterCode: `.nav { display: flex; align-items: center; gap: 1rem; padding: .75rem 1rem; }
.nav-list { display: flex; list-style: none; margin: 0; padding: 0; gap: .5rem; }
.nav-item { display: flex; }
.nav-link { color: #374151; text-decoration: none; padding: .5rem .75rem; border-radius: 4px; }
.nav-link:hover { background: #f3f4f6; color: #111827; }
.nav-link:focus-visible { outline: 2px solid #264de4; outline-offset: 2px; }
.nav-link.active { background: #eff6ff; color: #264de4; font-weight: 600; }
@media (max-width: 767px) { .nav { flex-direction: column; align-items: flex-start; } }`,
  solution: `.nav {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: .75rem 1rem;

  @media (max-width: 767px) {
    flex-direction: column;
    align-items: flex-start;
  }

  .nav-list {
    display: flex;
    list-style: none;
    margin: 0;
    padding: 0;
    gap: .5rem;
  }

  .nav-item { display: flex; }

  .nav-link {
    color: #374151;
    text-decoration: none;
    padding: .5rem .75rem;
    border-radius: 4px;

    &:hover        { background: #f3f4f6; color: #111827; }
    &:focus-visible { outline: 2px solid #264de4; outline-offset: 2px; }
    &.active       { background: #eff6ff; color: #264de4; font-weight: 600; }
  }
}`,
};

const quiz: QuizQuestion[] = [
  {
    q: 'What does & represent in native CSS nesting?',
    options: [
      'The root element of the page',
      'Any element that matches the nested selector',
      'The full parent selector in the current nesting context',
      'A wildcard that matches any selector',
    ],
    answer: 2,
    explanation: '& always refers to the complete parent selector. Inside .card { &:hover { } }, & is .card, so &:hover expands to .card:hover.',
  },
  {
    q: 'Which nested rule is INCORRECT and will not match .card:hover?',
    options: [
      '.card { &:hover { color: red; } }',
      '.card { :hover { color: red; } }',
      '.card:hover { color: red; }',
      'None — all three are equivalent',
    ],
    answer: 1,
    explanation: '.card { :hover { color: red; } } without & produces .card :hover — a descendant selector that matches any hovered element inside .card. To match .card:hover, you must write &:hover.',
  },
  {
    q: 'Does nesting increase the specificity of the nested rule?',
    options: [
      'Yes — each nesting level adds 0,1,0 to specificity',
      'No — nesting is syntactic sugar; specificity equals the flat equivalent',
      'Only when & is used',
      'Yes, but only for pseudo-classes',
    ],
    answer: 1,
    explanation: 'CSS nesting does not add any specificity. .card { .title { color: blue; } } has the same specificity as .card .title { color: blue; } — both are 0,2,0. Nesting is purely an authoring convenience.',
  },
  {
    q: 'How do you write a nested @media query inside a component rule?',
    options: [
      '.card { media(min-width: 600px) { } }',
      '.card { @media (min-width: 600px) { grid-template-columns: 1fr 1fr; } }',
      '@media (min-width: 600px) { .card nested { } }',
      '.card { breakpoint(600px) { } }',
    ],
    answer: 1,
    explanation: '@media can be nested directly inside a rule block. The styles inside apply to .card when the media condition is met — equivalent to writing @media (min-width: 600px) { .card { } } at the top level.',
  },
  {
    q: 'You want .dark .nav-link to style .nav-link when it is inside a .dark parent. Which nesting is correct?',
    options: [
      '.nav-link { .dark { color: #fff; } }',
      '.nav-link { .dark & { color: #fff; } }',
      '.nav-link { &.dark { color: #fff; } }',
      '.nav-link { dark& { color: #fff; } }',
    ],
    answer: 1,
    explanation: '.dark & inside .nav-link { } expands to .dark .nav-link — the & is the full parent selector placed after .dark. This is the ancestor-context pattern that lets you write dark-mode or layout-context overrides co-located with the component.',
  },
  {
    q: 'What is the browser support for native CSS nesting (without a build tool)?',
    options: [
      'Only Chrome 120+ — too new for production',
      'Chrome 112+, Firefox 117+, Safari 17.2+ — all modern browsers',
      'Only available behind a flag in all browsers',
      'Requires the PostCSS nesting plugin to work anywhere',
    ],
    answer: 1,
    explanation: 'Native CSS nesting shipped in Chrome 112 (April 2023), Firefox 117 (August 2023), and Safari 17.2 (December 2023). It is safe to use without a preprocessor in modern browsers as of 2024.',
  },
];

const qna: QnaItem[] = [
  {
    q: 'Is native CSS nesting the same as Sass nesting?',
    a: 'Mostly yes, with one key difference: native CSS nesting does NOT support string concatenation. In Sass, .block { &__element { } } produces .block__element. In native CSS, & must be immediately followed by a selector type that is legal after another selector (a class, ID, pseudo-class, pseudo-element, or attribute) — a bare identifier like __element is not, so the whole rule is a syntax error and gets silently dropped, not turned into a descendant selector. Everything else — pseudo-classes, pseudo-elements, media queries, combinators — works the same way.',
  },
  {
    q: 'Do I still need PostCSS or Sass for nesting?',
    a: 'For modern-browser-only projects: no. Native nesting is supported in Chrome 112+, Firefox 117+, Safari 17.2+. If you need to support older browsers (pre-2023 releases), a PostCSS plugin or Sass preprocessor is still required. Check caniuse.com/css-nesting for exact coverage. Many frameworks (Vite, Next.js) use PostCSS under the hood and can transpile nesting automatically via postcss-nesting.',
  },
  {
    q: 'What happens to specificity when I nest rules?',
    a: 'Specificity is identical to the flat equivalent. .card { .title { } } has exactly the same specificity as .card .title { } — both 0,2,0. Nesting does not add or subtract specificity. This means you get no "free" specificity boost from nesting, and overriding nested styles requires the same effort as overriding flat styles.',
  },
  {
    q: 'How deep should I nest my CSS rules?',
    a: 'Keep nesting to 2–3 levels maximum. Deeper nesting produces long, high-specificity selectors that are hard to read and override. If you find yourself at 4+ levels, the component probably needs to be decomposed into smaller, independent pieces. A good rule of thumb: if the generated selector would feel overly specific when written flat (.nav .list .item .link:hover span), refactor the structure.',
  },
  {
    q: 'Can I nest @keyframes or @font-face inside a rule?',
    a: 'No — @keyframes, @font-face, @charset, and @import cannot be nested inside rule blocks. Only at-rules that produce rule blocks themselves (@media, @supports, @layer, @container, @scope) can be nested. For animations, define @keyframes at the top level and reference the animation-name inside the nested rule.',
  },
  {
    q: 'How does nesting interact with the :is() selector?',
    a: 'They complement each other well. :is() groups alternatives with a single specificity value: .card :is(h1, h2, h3) { } — can be written nested as .card { :is(h1, h2, h3) { } }. :is() is also useful for reducing specificity: instead of .nav .link, .sidebar .link { } (two selectors), write :is(.nav, .sidebar) .link { } — the specificity is just 0,1,0 because :is() takes the specificity of its most specific argument.',
  },
];

const revision: RevisionSummary = {
  oneLiner: 'Native CSS nesting lets you write child rules inside parent rules — & is the parent selector, @media/@container can be nested inline, and specificity is identical to the flat equivalent.',
  mustKnow: [
    '& always equals the full parent selector — &:hover on .card becomes .card:hover.',
    '& is required when the nested selector starts with a pseudo-class, pseudo-element, or attribute.',
    'Omitting & before :hover produces a descendant selector (.card :hover), not .card:hover.',
    'Nesting @media inside a rule keeps breakpoints co-located with the component styles they modify.',
    'Specificity of nested rules is identical to their flat equivalent — nesting adds no specificity.',
    'Native nesting does NOT support BEM string concatenation — .block { &__element } ≠ .block__element.',
  ],
  interviewFocus: [
    'What is the difference between .card { :hover { } } and .card { &:hover { } }?',
    'Does CSS nesting change the specificity of selectors?',
    'What at-rules can be nested inside CSS rule blocks?',
    'How does native CSS nesting differ from Sass nesting?',
  ],
};

@Component({
  selector: 'app-css-nesting',
  standalone: true,
  imports: [PageMetaComponent, QuickRefComponent, TheoryBlockComponent, CodeBlockComponent,
            CommonMistakesComponent, ChallengeBlockComponent, QuizBlockComponent,
            QnaBlockComponent, RevisionCardComponent, PageCompleteComponent],
  templateUrl: './css-nesting.html',
  styleUrl: './css-nesting.scss',
})
export class CssCssNesting {
  quickRef = quickRef;
  theory = theory;
  codeTabs = codeTabs;
  mistakes = mistakes;
  challenge = challenge;
  quiz = quiz;
  qna = qna;
  revision = revision;
}
