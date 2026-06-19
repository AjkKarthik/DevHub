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
  { name: 'BEM Block',        type: 'syntax',  desc: '.block — a standalone component (e.g. .card, .nav, .btn). Independent and reusable.' },
  { name: 'BEM Element',      type: 'syntax',  desc: '.block__element — a part of the block with no standalone meaning (e.g. .card__title, .nav__item).' },
  { name: 'BEM Modifier',     type: 'syntax',  desc: '.block--modifier or .block__element--modifier — a variant or state (e.g. .btn--primary, .card--featured).' },
  { name: 'ITCSS Settings',   type: 'keyword', desc: 'Layer 1: design tokens, custom properties, Sass variables — no CSS output.' },
  { name: 'ITCSS Tools',      type: 'keyword', desc: 'Layer 2: global mixins and functions — no CSS output.' },
  { name: 'ITCSS Generic',    type: 'keyword', desc: 'Layer 3: resets and normalize — lowest specificity rules.' },
  { name: 'ITCSS Elements',   type: 'keyword', desc: 'Layer 4: bare element styles (h1, p, a) — no class selectors.' },
  { name: 'ITCSS Objects',    type: 'keyword', desc: 'Layer 5: layout patterns (.container, .grid) — structure without cosmetics.' },
  { name: 'ITCSS Components', type: 'keyword', desc: 'Layer 6: UI components (.card, .btn) — designed pieces with BEM classes.' },
  { name: 'ITCSS Utilities',  type: 'keyword', desc: 'Layer 7: single-purpose utility classes (.text-center, .mt-4) — highest specificity, often !important.' },
];

const theory: TheoryPoint[] = [
  {
    heading: 'Why CSS Architecture Matters',
    points: [
      'Without architecture, CSS grows into a specificity war: every developer adds overrides, !important proliferates, and changes break unrelated components.',
      'CSS architecture methodologies impose naming conventions and file organisation that keep specificity flat and intent explicit.',
      'The goal is predictability: any developer should be able to read a class name and understand what it does, where it lives, and what it can affect.',
      'BEM solves naming collision and makes component boundaries explicit. ITCSS solves file organisation and specificity order. CSS Modules solves scope. Utility-first (Tailwind) solves composition speed.',
      'These methodologies are not mutually exclusive — BEM + ITCSS is a popular combination; Tailwind + CSS Modules is common in React.',
    ],
  },
  {
    heading: 'BEM: Block, Element, Modifier',
    points: [
      'Block: an independent, reusable component — .card, .nav, .btn. Never depends on page context.',
      'Element: a child piece that has no meaning outside its block — .card__title, .card__body, .nav__item. Double underscore separates block from element.',
      'Modifier: a variant or state of a block or element — .btn--primary, .btn--disabled, .card__title--truncated. Double dash separates modifier.',
      'BEM eliminates descendant selectors: you never write .nav .item — you write .nav__item. Specificity stays at exactly 0,1,0 (one class).',
      'The flat specificity is the key benefit: any modifier can override any base style without adding specificity.',
    ],
  },
  {
    heading: 'ITCSS, CSS Modules, and Choosing an Approach',
    points: [
      'ITCSS (Inverted Triangle CSS): organise files in 7 layers from generic to specific. Specificity only ever increases as you go down the triangle — no specificity wars.',
      'CSS Modules: CSS files where all class names are locally scoped by the build tool. Generates unique names like .card___abc123 — zero collision guarantee.',
      'CSS Modules work naturally with component frameworks (React, Angular, Vue) where each component has its own stylesheet.',
      'Utility-first (Tailwind): apply pre-built single-purpose classes directly in HTML. No custom CSS for common patterns — design system enforced at the class level.',
      'Choice guide: BEM+ITCSS for traditional multi-page sites; CSS Modules for React/Vue SPAs; Tailwind for rapid prototyping and design-system-first teams.',
    ],
  },
];

const codeTabs: CodeTab[] = [
  {
    label: 'BEM Naming',
    language: 'css',
    code: `/* Block — standalone, reusable component */
.card {
  background: #fff;
  border-radius: 8px;
  padding: 1.5rem;
  border: 1px solid #e5e7eb;
}

/* Elements — parts of the block (double underscore) */
.card__header { border-bottom: 1px solid #e5e7eb; padding-bottom: 1rem; margin-bottom: 1rem; }
.card__title  { font-size: 1.25rem; font-weight: 700; margin: 0; }
.card__body   { color: #6b7280; line-height: 1.6; }
.card__footer { display: flex; justify-content: flex-end; margin-top: 1rem; gap: .5rem; }

/* Modifiers — variants (double dash) */
.card--featured  { border-color: #264de4; box-shadow: 0 0 0 2px rgba(38,77,228,.2); }
.card--compact   { padding: .75rem; }
.card__title--truncated { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

/* Button block with modifiers */
.btn { padding: .5rem 1.25rem; border-radius: 4px; border: none; cursor: pointer; font-size: 1rem; }
.btn--primary   { background: #264de4; color: #fff; }
.btn--secondary { background: transparent; color: #264de4; border: 1px solid #264de4; }
.btn--danger    { background: #dc2626; color: #fff; }
.btn--sm        { padding: .25rem .75rem; font-size: .875rem; }
.btn--disabled  { opacity: .4; cursor: not-allowed; pointer-events: none; }

/* HTML usage:
   <div class="card card--featured">
     <div class="card__header">
       <h2 class="card__title card__title--truncated">Long Title</h2>
     </div>
     <div class="card__body">...</div>
     <div class="card__footer">
       <button class="btn btn--primary">Save</button>
       <button class="btn btn--secondary btn--sm">Cancel</button>
     </div>
   </div>
*/`,
  },
  {
    label: 'ITCSS Structure',
    language: 'css',
    code: `/* ── Layer 1: Settings (no CSS output) ──────────────────── */
/* _settings.colors.css */
:root {
  --color-primary:   #264de4;
  --color-text:      #1f2937;
  --color-border:    #e5e7eb;
  --space-4:         1rem;
  --radius:          8px;
}

/* ── Layer 2: Tools (no CSS output — mixins in Sass) ──────── */
/* Skipped in plain CSS */

/* ── Layer 3: Generic (lowest specificity) ────────────────── */
/* _generic.reset.css */
*, *::before, *::after { box-sizing: border-box; }
body, h1, h2, h3, p, ul, ol { margin: 0; padding: 0; }
img, video { max-width: 100%; display: block; }

/* ── Layer 4: Elements (bare HTML tags) ───────────────────── */
/* _elements.typography.css */
body   { font-family: system-ui, sans-serif; line-height: 1.6; color: var(--color-text); }
h1     { font-size: 2rem; font-weight: 800; }
h2     { font-size: 1.5rem; font-weight: 700; }
a      { color: var(--color-primary); }

/* ── Layer 5: Objects (layout, no cosmetics) ──────────────── */
/* _objects.container.css */
.o-container { max-width: 1200px; margin-inline: auto; padding-inline: 1rem; }
.o-grid      { display: grid; gap: var(--space-4); }
.o-stack > * + * { margin-block-start: var(--space-4); }

/* ── Layer 6: Components (designed BEM blocks) ────────────── */
/* _components.card.css */
.card { background: #fff; border-radius: var(--radius); border: 1px solid var(--color-border); }
.card--featured { border-color: var(--color-primary); }

/* ── Layer 7: Utilities (single-purpose, may use !important) ─ */
/* _utilities.spacing.css */
.mt-4   { margin-block-start: var(--space-4) !important; }
.hidden { display: none !important; }
.sr-only { position: absolute; width: 1px; height: 1px; clip: rect(0,0,0,0); overflow: hidden; }`,
  },
  {
    label: 'CSS Modules',
    language: 'css',
    code: `/* card.module.css — locally scoped, no collisions */

/* These class names are transformed to unique identifiers at build time:
   .root → .card_root__abc12
   .title → .card_title__xyz89
   Other components' .root never conflicts with this one. */

.root {
  background: #fff;
  border-radius: 8px;
  padding: 1.5rem;
  border: 1px solid #e5e7eb;
}

.title {
  font-size: 1.25rem;
  font-weight: 700;
  margin: 0 0 .5rem;
}

.body {
  color: #6b7280;
  line-height: 1.6;
}

/* Modifiers via composes (CSS Modules feature) */
.featured {
  composes: root;   /* inherits root styles */
  border-color: #264de4;
  box-shadow: 0 0 0 2px rgba(38,77,228,.2);
}

/* Global escape hatch — NOT scoped */
:global(.card-override) {
  padding: .5rem;
}

/* Usage in React (JSX):
   import styles from './card.module.css';
   <div className={styles.root}>
     <h2 className={styles.title}>...</h2>
   </div>
*/`,
  },
  {
    label: 'ITCSS + @layer Integration',
    language: 'css',
    code: `/* Modern ITCSS: map each layer to a CSS cascade layer */
@layer settings, generic, elements, objects, components, utilities;

@layer settings {
  :root {
    --color-primary: #264de4;
    --space-4: 1rem;
    --radius: 8px;
  }
}

@layer generic {
  *, *::before, *::after { box-sizing: border-box; }
  body, h1, h2, p { margin: 0; }
}

@layer elements {
  body { font-family: system-ui, sans-serif; line-height: 1.6; }
  a    { color: var(--color-primary); }
}

@layer objects {
  .o-container { max-width: 1200px; margin-inline: auto; }
  .o-stack > * + * { margin-block-start: var(--space-4); }
}

@layer components {
  .card {
    background: #fff;
    border-radius: var(--radius);
    border: 1px solid #e5e7eb;
    padding: var(--space-4);
  }
  .btn { padding: .5rem 1.25rem; border-radius: 4px; cursor: pointer; }
  .btn--primary { background: var(--color-primary); color: #fff; border: none; }
}

@layer utilities {
  .mt-4   { margin-block-start: var(--space-4); }
  .hidden { display: none; }
}
/* Utilities beat components beat elements — cascade layers enforce ITCSS order */`,
  },
];

const mistakes: CommonMistake[] = [
  {
    title: 'Writing BEM elements with descendant selectors',
    wrong: `.card .title { font-size: 1.25rem; }   /* specificity: 0,2,0 */
.card .body  { color: #6b7280; }`,
    right: `.card__title { font-size: 1.25rem; }    /* specificity: 0,1,0 */
.card__body  { color: #6b7280; }`,
    explanation: 'BEM elements use double-underscore flat selectors, not descendant selectors. Descendant selectors raise specificity to 0,2,0, making them harder to override. Flat BEM class selectors stay at 0,1,0 — consistent and predictable.',
  },
  {
    title: 'Nesting BEM elements inside blocks in CSS',
    wrong: `.card {
  background: #fff;
  .card__title { font-size: 1.25rem; }  /* violates BEM — don't nest */
}`,
    right: `/* BEM elements are siblings in CSS, not nested */
.card        { background: #fff; }
.card__title { font-size: 1.25rem; }`,
    explanation: 'BEM elements should be written as flat sibling selectors in your CSS. Nesting .card__title inside .card creates a descendant selector that increases specificity. The flat pattern is the BEM convention and keeps specificity at one class.',
  },
  {
    title: 'Using ITCSS components layer for layout/structure',
    wrong: `/* Putting layout objects in the components layer */
.card { display: grid; grid-template-columns: 1fr 1fr; }  /* layout in components */`,
    right: `/* Layout goes in objects; cosmetics go in components */
.o-two-col { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }  /* objects */
.card      { background: #fff; border-radius: 8px; padding: 1.5rem; }     /* components */`,
    explanation: 'ITCSS separates structure (objects) from cosmetics (components). Layout grids, containers, and spacing primitives belong in the objects layer with .o- prefix. Components layer handles visual design. Mixing them blurs the architecture.',
  },
  {
    title: 'Creating too many BEM modifier combinations',
    wrong: `.btn--primary-large { }
.btn--primary-small { }
.btn--secondary-large { }
.btn--secondary-small { }   /* combinatorial explosion */`,
    right: `/* Compose independent modifiers */
.btn--primary { }
.btn--secondary { }
.btn--lg { }
.btn--sm { }
/* HTML: <button class="btn btn--primary btn--sm"> */`,
    explanation: 'BEM modifiers should be independent and composable — not pre-combined. Use separate modifiers (.btn--primary and .btn--sm) applied together in HTML rather than creating combined modifier classes for every possible pairing.',
  },
];

const challenge: Challenge = {
  title: 'Build a BEM Card System',
  language: 'scss',
  description: 'Create a complete BEM card component with the following requirements: (1) .card block with padding, border, border-radius. (2) Elements: .card__header, .card__title, .card__body, .card__footer, .card__badge. (3) Modifiers: .card--featured (accent border + shadow), .card--horizontal (image left, content right using flex), .card--compact (reduced padding). (4) All selectors must be flat BEM classes — no descendant selectors. (5) Specificity must stay at exactly 0,1,0 for all base rules.',
  hints: [
    'Write all .card__* elements as flat sibling rules, not nested inside .card { }.',
    'Modifiers use the base class first: class="card card--featured" — modifier only changes what differs.',
    '.card--horizontal can use flexbox: display: flex; flex-direction: row on the .card itself.',
    'Verify your work: every selector in your CSS should be a single class (0,1,0 specificity).',
  ],
  starterCode: `/* Write your BEM card system below */
/* Block */

/* Elements */

/* Modifiers */`,
  solution: `/* Block */
.card {
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 1.5rem;
  overflow: hidden;
}

/* Elements */
.card__header {
  border-bottom: 1px solid #e5e7eb;
  padding-bottom: 1rem;
  margin-bottom: 1rem;
  display: flex;
  align-items: center;
  gap: .5rem;
}

.card__badge {
  background: #eff6ff;
  color: #264de4;
  font-size: .75rem;
  font-weight: 600;
  padding: .2rem .6rem;
  border-radius: 999px;
}

.card__title {
  font-size: 1.125rem;
  font-weight: 700;
  margin: 0;
  color: #111827;
}

.card__body {
  color: #6b7280;
  line-height: 1.6;
  font-size: .9375rem;
}

.card__footer {
  display: flex;
  justify-content: flex-end;
  gap: .5rem;
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid #e5e7eb;
}

.card__img {
  width: 100%;
  aspect-ratio: 16/9;
  object-fit: cover;
}

/* Modifiers */
.card--featured {
  border-color: #264de4;
  box-shadow: 0 0 0 3px rgba(38,77,228,.15);
}

.card--compact {
  padding: .75rem;
}

.card--horizontal {
  display: flex;
  flex-direction: row;
  align-items: stretch;
  padding: 0;
}`,
};

const quiz: QuizQuestion[] = [
  {
    q: 'In BEM, what does the double underscore (__) signify?',
    options: [
      'A modifier — a variant of the block',
      'An element — a child part of the block',
      'A nested block inside another block',
      'A utility class applied to the block',
    ],
    answer: 1,
    explanation: 'Double underscore separates a block from its element: .card__title means "title element of the card block". The element has no meaning outside its block.',
  },
  {
    q: 'What is the specificity of a standard BEM element selector like .card__title?',
    options: ['0,0,0', '0,1,0', '0,2,0', '1,0,0'],
    answer: 1,
    explanation: '.card__title is a single class selector — specificity 0,1,0. This is the key BEM advantage: all base rules share the same specificity, making overrides predictable without escalating specificity.',
  },
  {
    q: 'In ITCSS, which layer has the LOWEST specificity and broadest reach?',
    options: ['Components', 'Utilities', 'Generic', 'Elements'],
    answer: 2,
    explanation: 'The Generic layer (resets, normalize) has the lowest specificity — it uses element selectors and universal selectors. Each subsequent ITCSS layer increases in specificity and decreases in reach.',
  },
  {
    q: 'What problem does CSS Modules solve that BEM does not?',
    options: [
      'It enforces a naming convention across the team',
      'It provides locally-scoped class names to prevent name collisions at build time',
      'It reduces the number of CSS files needed',
      'It eliminates the need for media queries',
    ],
    answer: 1,
    explanation: 'CSS Modules generates unique, hashed class names at build time (.card_root__abc12) — two components can both have a .root class and they will never conflict. BEM prevents collisions by convention; Modules prevents them by tooling.',
  },
  {
    q: 'You have .btn--primary and .btn--lg — should you create .btn--primary-lg?',
    options: [
      'Yes — always pre-combine modifiers for performance',
      'No — use independent composable modifiers: class="btn btn--primary btn--lg"',
      'Yes — BEM requires a combined modifier for each combination',
      'No — you should use a data attribute instead',
    ],
    answer: 1,
    explanation: 'BEM modifiers should be independent and composable. Apply multiple modifiers in HTML (class="btn btn--primary btn--lg") rather than creating a combined modifier for every pairing. This prevents combinatorial explosion.',
  },
  {
    q: 'Which ITCSS layer uses the .o- prefix?',
    options: ['Settings', 'Objects', 'Components', 'Utilities'],
    answer: 1,
    explanation: 'The Objects layer uses the .o- prefix (e.g. .o-container, .o-grid). Objects are layout patterns with no visual cosmetics — they provide structure. The .o- prefix makes it clear the class is a layout primitive, not a designed component.',
  },
];

const qna: QnaItem[] = [
  {
    q: 'Can I use BEM with native CSS nesting?',
    a: 'Yes — but carefully. You can nest modifiers inside the block: .card { &--featured { } } works in native CSS because & is the full selector. However, do NOT nest elements: .card { &__title { } } will NOT produce .card__title — it produces .card __title (a descendant selector). Write BEM elements as flat sibling rules, and use nesting only for pseudo-classes, modifiers on the same element, and at-rules.',
  },
  {
    q: 'Is ITCSS still relevant with CSS cascade layers (@layer)?',
    a: 'Yes — they complement each other. ITCSS provides the conceptual layer order; @layer enforces it in the browser with no specificity wars. The modern pattern is: map each ITCSS layer to a @layer: @layer settings, generic, elements, objects, components, utilities. The cascade layer order guarantees utilities always beat components, which always beat elements — regardless of specificity.',
  },
  {
    q: 'BEM class names can get very long — is that a problem?',
    a: 'Long names are a trade-off of BEM\'s explicitness. .product-card__price-badge--sale-active is verbose but self-documenting. In practice, teams often abbreviate to 2–3 word names: .card__badge--sale. The verbosity is also eliminated in CSS Modules (where class names are short locally and hashed globally) and Tailwind (where composition happens in HTML with short utility names). Choose the approach whose trade-offs fit your team.',
  },
  {
    q: 'What is the difference between an ITCSS Object and a Component?',
    a: 'An Object is a structural pattern with no cosmetics — .o-container, .o-grid, .o-media. It provides layout without deciding colors, fonts, or borders. A Component is a fully designed UI element — .card, .btn, .badge. The separation lets you change the visual design (component) without touching the layout (object), and reuse layout patterns across visually different components.',
  },
  {
    q: 'Should utility classes have !important?',
    a: 'In ITCSS and Tailwind, yes — utility classes are at the top of the specificity hierarchy by design. !important prevents any component-level rule from overriding a utility. In modern CSS, you can achieve the same effect without !important by using @layer utilities as the highest-priority layer — utilities win over components by layer order, not !important. This is the preferred modern approach.',
  },
  {
    q: 'Can I mix BEM with Tailwind?',
    a: 'Yes — many teams use a hybrid: Tailwind utilities for spacing, color, and typography (avoiding custom CSS for common patterns), and BEM naming for complex stateful components that need custom CSS. The .card BEM block handles card-specific layout and interactions; Tailwind classes handle padding variants and colors. Just ensure Tailwind is in a higher-priority @layer than your component CSS so utilities can override component defaults without !important.',
  },
];

const revision: RevisionSummary = {
  oneLiner: 'CSS architecture methodologies — BEM, ITCSS, CSS Modules — solve naming collisions and specificity wars through naming conventions, file organisation, and build-time scoping.',
  mustKnow: [
    'BEM: .block, .block__element, .block--modifier — flat selectors, all at 0,1,0 specificity.',
    'Never write .block .block__element — BEM elements are flat siblings, not descendant selectors.',
    'ITCSS 7 layers in order: Settings, Tools, Generic, Elements, Objects, Components, Utilities.',
    'Objects (.o-*) are structural layout patterns with no visual cosmetics.',
    'CSS Modules scope class names at build time — two .root classes in different files never collide.',
    'Modern pattern: ITCSS layer order + CSS @layer = specificity-safe architecture with no !important.',
  ],
  interviewFocus: [
    'Explain BEM and what problem it solves compared to plain CSS.',
    'What is the difference between ITCSS Objects and Components?',
    'How does CSS Modules prevent class name collisions?',
    'How would you combine ITCSS with CSS cascade layers (@layer)?',
  ],
};

@Component({
  selector: 'app-css-architecture',
  standalone: true,
  imports: [PageMetaComponent, QuickRefComponent, TheoryBlockComponent, CodeBlockComponent,
            CommonMistakesComponent, ChallengeBlockComponent, QuizBlockComponent,
            QnaBlockComponent, RevisionCardComponent, PageCompleteComponent],
  templateUrl: './css-architecture.html',
  styleUrl: './css-architecture.scss',
})
export class CssCssArchitecture {
  quickRef = quickRef;
  theory = theory;
  codeTabs = codeTabs;
  mistakes = mistakes;
  challenge = challenge;
  quiz = quiz;
  qna = qna;
  revision = revision;
}
