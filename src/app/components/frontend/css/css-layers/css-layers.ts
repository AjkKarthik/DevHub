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
  { name: '@layer base, components, utilities', type: 'syntax',  desc: 'Declare layer order upfront — later declarations in the list win over earlier ones.' },
  { name: '@layer components { ... }',          type: 'syntax',  desc: 'Block form: assign styles to a named layer. Can appear multiple times.' },
  { name: '@layer',                             type: 'keyword', desc: 'Anonymous layer — styles placed here are grouped but cannot be targeted by name later.' },
  { name: 'revert-layer',                       type: 'keyword', desc: 'Reverts a property to its value in the previous layer (not initial/inherited).' },
  { name: 'Unlayered styles',                   type: 'keyword', desc: 'Styles NOT inside any @layer always beat layered styles, regardless of specificity.' },
  { name: 'layer() in @import',                 type: 'syntax',  desc: '@import url("reset.css") layer(reset) — imports a stylesheet directly into a named layer.' },
  { name: '!important reversal',                type: 'keyword', desc: '!important inside a layer reverses the layer order — lower-priority layers win for !important.' },
];

const theory: TheoryPoint[] = [
  {
    heading: 'The Problem @layer Solves',
    points: [
      'Traditional CSS specificity battles: a utility class (.mt-4) fails to override a component rule (.card p) because the component has higher specificity.',
      'Third-party libraries (Bootstrap, Tailwind base) often require !important or duplicating selectors to override — this creates unmaintainable CSS.',
      'Cascade layers add a new level above specificity: if two rules are in different layers, the layer order decides the winner, not specificity.',
      'Inside a layer, normal specificity rules still apply. Across layers, the layer with the highest declared priority always wins.',
      '@layer shipped in all major browsers in 2022 (Chrome 99, Firefox 97, Safari 15.4).',
    ],
  },
  {
    heading: 'Declaring and Ordering Layers',
    points: [
      'The @layer statement at the top declares the priority order: @layer base, components, utilities — "utilities" has the highest priority.',
      'Later layers win. If you declare @layer base, components, utilities — styles in utilities beat components, and components beat base.',
      'You can split layer contents across multiple blocks: @layer components { .btn { } } later in the file still belongs to the "components" layer.',
      'Anonymous layers: @layer { .foo { color: red; } } creates an unnamed layer. It cannot be appended to later and appears at that point in the priority.',
      'Nested layers: @layer components { @layer button { } @layer card { } } — creates components.button and components.card sub-layers.',
    ],
  },
  {
    heading: 'Unlayered Styles Always Win',
    points: [
      'Styles written outside any @layer are implicitly in the "unlayered" group, which has the highest priority of all.',
      'This makes adopting layers safe: existing code stays unlayered and continues to win. New code can be placed in layers without breaking anything.',
      'Practical pattern: put third-party resets and libraries in a low-priority layer (e.g. @layer vendor) so your utilities never need !important to override them.',
      'revert-layer: sets a property back to the value it would have had from the previous layer — useful for opt-out overrides inside a component layer.',
      '!important inside layers reverses order: !important in "base" beats !important in "utilities". This is the opposite of the normal rule — useful for base resets.',
    ],
  },
  {
    heading: 'Cascade Layers (@layer) for Predictable Specificity',
    points: [
      '@layer creates named cascade layers that are ordered independently of source order and specificity — a rule in an earlier-declared layer always loses to a rule in a later-declared layer, regardless of selector specificity, giving explicit control over which styles should win.',
      'This solves a longstanding CSS pain point: safely overriding third-party library styles (a component library, a CSS reset) without needing to resort to !important or artificially inflating selector specificity, since your own application layer can simply be declared after the library\'s layer.',
      'Layers are declared once (typically at the top of a stylesheet: @layer reset, base, components, utilities) establishing their relative order, and rules can be added to any declared layer from anywhere in the codebase, in any file, without needing to worry about source order between files.',
      'Unlayered styles (any CSS not explicitly assigned to a layer) always have the HIGHEST priority, overriding every layered style regardless of layer order — an important nuance, since accidentally leaving override styles unlayered gives them more power than intended relative to the layer system.',
    ],
  },
  {
    heading: 'Practical Layer Organization Strategies',
    points: [
      'A common layer ordering convention: reset (browser default overrides), base (element defaults, typography), tokens (custom properties), components (reusable component styles), utilities (single-purpose override classes) — utilities last ensures they can always override component styles when needed.',
      'Third-party CSS (a component library, a CSS framework) can be imported into its own dedicated layer, explicitly ordered before your application\'s own layers — guaranteeing your application styles always win in conflicts without needing to inspect or match the library\'s specific selector specificity.',
      'Layers nest — a layer can contain sub-layers (@layer components.buttons), allowing fine-grained organization within a broader layer while still maintaining the overall layer ordering relative to other top-level layers.',
      'Browser support for @layer is now broad across modern browsers, but projects needing to support significantly older browsers should verify actual target browser support before relying on cascade layers as the primary specificity management strategy, since there is no straightforward polyfill for the cascade-order semantics.',
    ],
  },
];

const codeTabs: CodeTab[] = [
  {
    label: 'Layer Order Basics',
    language: 'css',
    code: `/* Step 1: Declare layer order at the top of your stylesheet.
   Last layer listed = highest priority. */
@layer reset, base, components, utilities;

/* Step 2: Put third-party reset in the lowest layer */
@layer reset {
  *, *::before, *::after { box-sizing: border-box; }
  body, h1, h2, h3, p { margin: 0; }
}

/* Step 3: Base element styles */
@layer base {
  body  { font-family: system-ui, sans-serif; line-height: 1.6; }
  a     { color: #264de4; text-decoration: underline; }
  h1    { font-size: 2rem; font-weight: 700; }
}

/* Step 4: Component styles (higher priority than base) */
@layer components {
  .card {
    background: #fff;
    border: 1px solid #e5e7eb;
    border-radius: 8px;
    padding: 1.5rem;
  }

  .card a { color: inherit; text-decoration: none; }
  /* .card a wins over base a{} because components > base */
}

/* Step 5: Utility classes always win */
@layer utilities {
  .text-blue { color: #264de4 !important; }
  .mt-4      { margin-top: 1rem; }
  .hidden    { display: none; }
}`,
  },
  {
    label: 'Third-Party Containment',
    language: 'css',
    code: `/* Import third-party library directly into a low-priority layer */
@import url("https://cdn.example.com/bootstrap.css") layer(vendor);

/* Declare our layers above the vendor layer */
@layer vendor, base, components, utilities;

/* Now Bootstrap styles are in "vendor" — the lowest priority.
   Our utility classes never need !important to override Bootstrap. */
@layer utilities {
  /* This wins over Bootstrap .text-primary without !important */
  .text-primary { color: #264de4; }

  /* This wins over Bootstrap .p-4 */
  .p-4 { padding: 1rem; }
}

/* Unlayered styles beat everything */
.override {
  /* Not in any layer — automatically higher priority than all layers */
  color: red;
}`,
  },
  {
    label: 'Nested Layers',
    language: 'css',
    code: `/* Nested layers: create sub-layers within a parent layer */
@layer components {
  @layer button, card, modal;

  @layer button {
    .btn            { padding: 0.5rem 1rem; border-radius: 4px; cursor: pointer; }
    .btn-primary    { background: #264de4; color: #fff; border: none; }
    .btn-secondary  { background: transparent; color: #264de4; border: 1px solid #264de4; }
  }

  @layer card {
    .card           { background: #fff; border: 1px solid #e5e7eb; border-radius: 8px; padding: 1.5rem; }
    .card .btn      { width: 100%; }  /* overrides components.button because card > button */
  }

  @layer modal {
    .modal          { position: fixed; inset: 0; background: rgba(0,0,0,0.5); }
    .modal .card    { max-width: 480px; margin: 10vh auto; }
  }
}

/* Reference nested layers from outside with dot notation */
@layer components.button {
  .btn-danger { background: #dc2626; color: #fff; }
}`,
  },
  {
    label: 'revert-layer & !important',
    language: 'css',
    code: `@layer reset, base, components, utilities;

@layer base {
  a { color: #264de4; text-decoration: underline; }
}

@layer components {
  /* nav links: undo the base color and go back to inherited color */
  .nav-link {
    color: revert-layer;          /* resolves to base-layer value: #264de4 */
    text-decoration: none;
  }

  /* sidebar links: fully undo — go back to browser default */
  .sidebar-link {
    color: revert;                /* browser default link color */
  }
}

/* !important reverses layer order.
   !important in 'reset' beats !important in 'utilities'.
   Use this for "this must not be overridden by utilities" */
@layer reset {
  [hidden] { display: none !important; }  /* beats utilities !important */
}

@layer utilities {
  .hidden { display: none !important; }  /* loses to reset's !important above */
}`,
  },
];

const mistakes: CommonMistake[] = [
  {
    title: 'Declaring layers after styles that use them',
    wrong: `@layer components { .card { color: red; } }
@layer base, components, utilities;  /* too late — order already implicit */`,
    right: `/* Declare order FIRST, then fill layers */
@layer base, components, utilities;
@layer components { .card { color: red; } }`,
    explanation: 'The first @layer that the browser encounters (statement OR block) establishes layer positions. If you write @layer components { } before @layer base, components, utilities — the order is components first, then base and utilities are appended. Always declare order at the very top.',
  },
  {
    title: 'Forgetting that unlayered styles always beat layers',
    wrong: `@layer utilities;
@layer utilities { .text-red { color: red; } }
/* Somewhere else, unlayered: */
p { color: black; }   /* this beats .text-red even on <p class="text-red"> */`,
    right: `/* Move overrides into a layer, or keep them unlayered intentionally */
@layer utilities { .text-red { color: red; } }
/* Only put "final authority" styles outside layers */`,
    explanation: 'Unlayered styles always win over all layers regardless of specificity. If legacy CSS outside layers is overriding your utility layer, either move the legacy code into an appropriate layer, or accept the priority intentionally.',
  },
  {
    title: 'Using !important expecting it to behave like normal',
    wrong: `@layer base, utilities;
@layer utilities { .text-blue { color: blue !important; } }
@layer base    { body { color: black !important; } }
/* Expected: .text-blue wins because utilities > base */
/* Actual: base wins because !important reverses layer order */`,
    right: `/* Avoid !important inside layers unless you specifically need the reversal */
@layer base, utilities;
@layer utilities { .text-blue { color: blue; } }  /* wins without !important */`,
    explanation: '!important reverses cascade layer priority. An !important declaration in a lower-priority layer beats an !important in a higher-priority layer. Use !important inside layers only for reset patterns ([hidden] { display: none !important; }) not for typical utility overrides.',
  },
  {
    title: 'Appending to an anonymous layer by name',
    wrong: `@layer { .foo { color: red; } }   /* anonymous layer */
@layer { .bar { color: blue; } }  /* different anonymous layer, not the same one */`,
    right: `/* Named layers can be appended */
@layer components { .foo { color: red; } }
@layer components { .bar { color: blue; } }  /* same layer, appended */`,
    explanation: 'Each anonymous @layer { } block creates a separate, unique layer that cannot be referenced or extended. If you want to split a layer across the file, give it a name.',
  },
  {
    title: 'Nesting @layer inside rules other than @layer',
    wrong: `@media (min-width: 768px) {
  @layer utilities { .flex { display: flex; } }  /* invalid nesting */
}`,
    right: `/* @layer cannot be nested inside @media, @supports, etc. */
@layer utilities;
@layer utilities { .flex { display: flex; } }

/* Apply responsive styles inside the layer block normally */
@layer utilities {
  @media (min-width: 768px) { .md\\:flex { display: flex; } }
}`,
    explanation: '@layer cannot be nested inside conditional at-rules like @media or @supports. The layer declaration must be at the top level of the stylesheet. @media and @supports can be nested inside @layer blocks.',
  },
];

const challenge: Challenge = {
  title: 'Layer Your Design System',
  language: 'scss',
  description: 'Build a mini design system using CSS cascade layers. Requirements: (1) Declare 4 layers in order: reset, tokens, components, utilities. (2) Reset: remove default margins on body, h1–h3, p. (3) Tokens layer: define --color-primary, --color-text, --space-4 as custom properties on :root. (4) Components: style a .card (border, padding, border-radius) and a .btn (background using --color-primary, white text, padding). (5) Utilities: add .mt-4 (margin-top: var(--space-4)), .text-primary (color: var(--color-primary)). Verify that .text-primary on a .card element overrides the card\'s default color without !important.',
  hints: [
    'Put the @layer reset, tokens, components, utilities; declaration as the very first line.',
    'Custom properties defined in the tokens layer are accessible in all other layers — they cascade normally.',
    'The .text-primary utility should work without !important because utilities is the last (highest priority) layer.',
    'Test by creating an element with both .card and .text-primary — the utility color should win.',
  ],
  starterCode: `/* Declare layer order here */

/* Reset layer */

/* Tokens layer */

/* Components layer */

/* Utilities layer */`,
  solution: `@layer reset, tokens, components, utilities;

@layer reset {
  *, *::before, *::after { box-sizing: border-box; }
  body, h1, h2, h3, p { margin: 0; }
}

@layer tokens {
  :root {
    --color-primary: #264de4;
    --color-text:    #1f2937;
    --space-4:       1rem;
    --radius:        8px;
  }
}

@layer components {
  .card {
    background:    #fff;
    border:        1px solid #e5e7eb;
    border-radius: var(--radius);
    padding:       var(--space-4);
    color:         var(--color-text);
  }

  .btn {
    background:    var(--color-primary);
    color:         #fff;
    border:        none;
    border-radius: var(--radius);
    padding:       0.5rem 1.25rem;
    cursor:        pointer;
    font-size:     1rem;
  }
}

@layer utilities {
  .mt-4        { margin-top: var(--space-4); }
  .text-primary { color: var(--color-primary); }  /* wins over .card color — no !important needed */
}`,
};

const quiz: QuizQuestion[] = [
  {
    q: 'In @layer reset, base, components, utilities — which layer has the highest priority?',
    options: ['reset', 'base', 'components', 'utilities'],
    answer: 3,
    explanation: 'Later-declared layers win. In the declaration @layer reset, base, components, utilities — "utilities" is last and therefore has the highest priority.',
  },
  {
    q: 'Where do unlayered styles (styles not inside any @layer) rank in priority?',
    options: [
      'Below all layers',
      'Between base and components',
      'Above all layers — they always win',
      'Equal to the last declared layer',
    ],
    answer: 2,
    explanation: 'Unlayered styles are implicitly placed above all layers, giving them the highest priority regardless of specificity. This makes adopting layers incrementally safe — existing code continues to win.',
  },
  {
    q: 'How does !important behave inside cascade layers?',
    options: [
      'It behaves the same as outside layers — specificity still decides',
      'It is ignored inside layers',
      'It reverses layer priority — !important in lower-priority layers wins',
      'It promotes the rule to the unlayered group',
    ],
    answer: 2,
    explanation: '!important reverses cascade layer order. An !important rule in the "reset" layer (lowest priority) beats an !important rule in the "utilities" layer (highest priority). This is the opposite of normal layer behavior.',
  },
  {
    q: 'What does revert-layer do to a property value?',
    options: [
      'Resets the property to its initial (browser default) value',
      'Removes the property declaration entirely',
      'Sets the value to what it would be from the previous lower-priority layer',
      'Reverts to the inherited value from the parent element',
    ],
    answer: 2,
    explanation: 'revert-layer rolls back the property to the value it would have had from the next lower-priority layer in the cascade. It is different from revert (which goes to the browser default) and initial (which goes to the CSS specification default).',
  },
  {
    q: 'You write @layer components { } before @layer base, components, utilities. What priority does "components" get?',
    options: [
      'Highest, because it was declared first',
      'Lowest, because the order statement overrides it',
      'Lowest, because "components" appears first in the implicit order established by the block',
      'It is ignored because it conflicts with the later statement',
    ],
    answer: 2,
    explanation: 'The first @layer (block or statement) encountered establishes positions. When @layer components { } appears before the order statement, "components" is registered first — giving it the lowest priority. The @layer base, components, utilities statement then appends "base" and "utilities" after it.',
  },
  {
    q: 'How do you import a third-party CSS file directly into a named layer?',
    options: [
      '@layer vendor { @import "lib.css"; }',
      '@import "lib.css" layer(vendor);',
      '@import layer(vendor) from "lib.css";',
      '@layer vendor; @include "lib.css";',
    ],
    answer: 1,
    explanation: '@import "url" layer(name) is the correct syntax to import a stylesheet into a named layer. This assigns all the imported styles to that layer, making them easy to override with higher-priority layers.',
  },
];

const qna: QnaItem[] = [
  {
    q: 'Should I use @layer in every project?',
    a: 'It depends on the project size and team. Small single-developer projects with no third-party CSS conflicts may not need layers. Layers are most valuable in: (1) projects using utility-first frameworks like Tailwind alongside component styles, (2) projects that import multiple third-party libraries that fight each other, (3) design systems where you need a strict override hierarchy. If you are not experiencing specificity conflicts, layers may add unnecessary complexity.',
  },
  {
    q: 'Can I use @layer with Tailwind CSS?',
    a: 'Yes — Tailwind v3+ wraps its base, components, and utilities in @layer by default when using PostCSS. This means Tailwind styles participate in the cascade layer system and can be overridden by unlayered styles or higher-priority layers without !important. If you add custom @layer declarations, make sure your Tailwind layers are declared in the correct position relative to yours.',
  },
  {
    q: 'How many layers should I have?',
    a: 'A common pattern is 3–5 layers: reset, tokens/variables, base (element defaults), components, utilities. Avoid creating too many layers — each extra layer adds cognitive overhead. Start with the minimum and add layers only when you have a real priority conflict to solve. More than 6–7 top-level layers is usually a sign of over-engineering.',
  },
  {
    q: 'What is the difference between revert-layer, revert, and initial?',
    a: 'revert-layer: rolls back to the value from the previous cascade layer — the most targeted option. revert: rolls back to the browser\'s built-in stylesheet (UA style sheet) default — ignores author styles entirely. initial: sets the property to its CSS specification default (e.g. display: initial is "inline" for most elements) — ignores both browser defaults and author styles. revert-layer is the right choice when you want "undo this layer\'s rule but keep whatever the layer below set".',
  },
  {
    q: 'Do cascade layers affect custom properties (CSS variables)?',
    a: 'Custom properties follow normal cascade rules including layer priority. A custom property defined in a higher-priority layer (utilities) overrides the same property in a lower-priority layer (base). However, since custom properties inherit down the DOM, the usual pattern is to define them on :root in a dedicated "tokens" layer and override them locally in component layers — the layer mechanism is less critical for custom properties than for regular declarations.',
  },
  {
    q: 'Can @layer be used inside @media or @supports?',
    a: '@layer blocks can contain @media and @supports at-rules (inside out). But @layer declarations cannot be nested inside @media or @supports (outside in). This means you cannot conditionally create a layer inside a media query. The correct pattern is: declare your layers at the top level, then put @media rules inside the @layer blocks.',
  },
];

const revision: RevisionSummary = {
  oneLiner: '@layer adds a cascade level above specificity — layer order declared at the top decides winners; later layers beat earlier ones, and unlayered styles beat all layers.',
  mustKnow: [
    'Declare layer order first: @layer reset, base, components, utilities — last in list = highest priority.',
    'Unlayered styles (outside any @layer) always beat all layers regardless of specificity.',
    '@layer can be a statement (order) or a block (assignment) — you can append to a named layer multiple times.',
    '!important reverses layer order: !important in a low-priority layer beats !important in a high-priority layer.',
    'revert-layer rolls a property back to the value from the previous layer — not to initial or inherited.',
    '@import "url" layer(name) imports third-party CSS into a named low-priority layer — no more !important battles.',
  ],
  interviewFocus: [
    'What problem does @layer solve that specificity-based approaches cannot?',
    'If unlayered styles always win, how do you safely adopt layers in an existing codebase?',
    'Explain how !important behaves differently inside cascade layers compared to normal rules.',
    'What is revert-layer and when would you use it?',
  ],
};

@Component({
  selector: 'app-css-layers',
  standalone: true,
  imports: [PageMetaComponent, QuickRefComponent, TheoryBlockComponent, CodeBlockComponent,
            CommonMistakesComponent, ChallengeBlockComponent, QuizBlockComponent,
            QnaBlockComponent, RevisionCardComponent, PageCompleteComponent],
  templateUrl: './css-layers.html',
  styleUrl: './css-layers.scss',
})
export class CssCssLayers {
  quickRef = quickRef;
  theory = theory;
  codeTabs = codeTabs;
  mistakes = mistakes;
  challenge = challenge;
  quiz = quiz;
  qna = qna;
  revision = revision;
}
