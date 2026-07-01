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
  { name: 'Cascade',           type: 'keyword', desc: 'Browser resolves conflicting rules by importance → specificity → source order.' },
  { name: 'Specificity',       type: 'keyword', desc: 'Inline (1,0,0,0) > ID (0,1,0,0) > class/attr/pseudo-class (0,0,1,0) > element (0,0,0,1).' },
  { name: '!important',        type: 'keyword', desc: 'Overrides all specificity. Only use for utilities and resets — hard to override later.' },
  { name: ':where()',          type: 'syntax',  desc: 'Zero-specificity selector list. Same as :is() but contributes 0 to specificity.' },
  { name: ':is()',             type: 'syntax',  desc: 'Forgiving selector list — specificity = highest-specificity argument inside.' },
  { name: 'inherit',           type: 'keyword', desc: 'Forces a property to inherit from its parent (even if not inherited by default).' },
  { name: 'initial',          type: 'keyword', desc: 'Resets a property to its CSS specification default (not the browser default).' },
  { name: 'unset',            type: 'keyword', desc: 'If naturally inherited → inherit; if not → initial. Useful in resets.' },
  { name: 'revert',           type: 'keyword', desc: 'Rolls back to the browser (UA) default — more useful than initial in resets.' },
  { name: '@layer',           type: 'keyword', desc: 'Cascade layers — explicitly control rule priority order independent of specificity.' },
];

const theory: TheoryPoint[] = [
  {
    heading: 'The Cascade — How Conflicts Are Resolved',
    points: [
      'When multiple CSS rules target the same element and property, the cascade determines which wins. The cascade evaluates in order: (1) Origin and importance, (2) Specificity, (3) Source order.',
      'Origin priority (highest to lowest): !important user styles → !important author styles → !important UA styles → author styles → user styles → UA (browser) styles.',
      'Within the same origin, !important reverses the priority — an !important rule in author CSS beats a non-!important rule even at higher specificity.',
      'Source order is the tiebreaker: when two rules have identical origin and specificity, the one that appears later in the source wins.',
      '@layer (cascade layers) adds a layer of control: rules in later-declared layers win over earlier layers, regardless of specificity. Unlayered styles beat all layered styles.',
    ],
  },
  {
    heading: 'Specificity',
    points: [
      'Specificity is a four-part score: (inline, ID, class/attribute/pseudo-class, element). Compare left to right — the first column that differs decides.',
      'Inline styles: 1,0,0,0. ID selectors: 0,1,0,0. Class selectors, attribute selectors, pseudo-classes: 0,0,1,0. Element selectors, pseudo-elements: 0,0,0,1.',
      ':is() and :not() adopt the specificity of their most specific argument. :where() always contributes 0 specificity — ideal for resets and defaults.',
      'Specificity is NOT a decimal: 0,0,10,0 does NOT equal 0,1,0,0 — a single ID selector always beats any number of class selectors.',
      'Universal selector (*), combinators (+, >, ~, space), and :where() all contribute 0 to specificity.',
    ],
  },
  {
    heading: 'Inheritance',
    points: [
      'CSS properties are either inherited or non-inherited. Inherited properties (color, font-size, font-family, line-height, etc.) automatically flow from parent to children.',
      'Non-inherited properties (border, padding, margin, background, display, position, etc.) do NOT pass to children — each element uses its initial value unless explicitly set.',
      'inherit, initial, unset, and revert are CSS-wide keywords that control inheritance explicitly on any property.',
      'Use inherit when you want a non-inherited property to follow the parent: .child { border: inherit; }.',
      'The all: unset shorthand resets every CSS property on an element to its unset value — a powerful reset starting point.',
    ],
  },
  {
    heading: 'The Box Model and display',
    points: [
      'Every element is a rectangular box: content → padding → border → margin. box-sizing: border-box (universal via *) makes width/height include padding and border — the default content-box excludes them.',
      'display controls how an element participates in layout: block (full width, new line), inline (flows with text, no width/height), inline-block (flows like inline, accepts width/height), flex, grid, none.',
      'display: none removes the element from layout entirely (no space taken). visibility: hidden hides it but preserves the space.',
      'Margin collapse: adjacent vertical margins between block elements collapse to the larger value. Horizontal margins never collapse. Flex/grid children do not collapse.',
    ],
  },
  {
    heading: 'CSS Selectors and Specificity Interactions',
    points: [
      'Specificity is calculated as a tuple (inline styles, IDs, classes/attributes/pseudo-classes, elements/pseudo-elements) — comparing selectors by this tuple, not by simply counting total selector segments, which is why a single ID selector beats any number of class selectors combined.',
      'The !important flag overrides normal specificity rules entirely, but at the cost of making the cascade significantly harder to reason about — a codebase using !important liberally often ends up needing even more !important declarations to override the previous ones, escalating into unmaintainable specificity wars.',
      'CSS custom properties (--variable) have no inherent specificity of their own since they are just custom-named values — but the specificity of the SELECTOR that sets the variable follows normal cascade rules, determining which declared value actually takes effect where the variable is used.',
      'Source order matters as a final tiebreaker only when specificity is exactly equal — a later rule with identical specificity to an earlier one wins, which is why the order stylesheets and style blocks are loaded/declared in can silently change which rule actually applies.',
    ],
  },
];

const codeTabs: CodeTab[] = [
  {
    label: 'Cascade & Specificity',
    language: 'css',
    code: `/* Specificity examples — scored as (inline, ID, class, element) */

p { color: blue; }               /* (0,0,0,1) */
.text { color: green; }          /* (0,0,1,0) — wins over element selector */
#intro { color: red; }           /* (0,1,0,0) — wins over class */
<p style="color:purple">         /* (1,0,0,0) — inline wins over everything except !important */

/* :is() takes specificity of its highest-specificity argument */
:is(#id, .class, p) { }  /* specificity = (0,1,0,0) — matches an ID */

/* :where() always contributes 0 specificity */
:where(#id, .class, p) { }  /* specificity = (0,0,0,0) */

/* Cascade layers — later layer wins regardless of specificity */
@layer reset, base, components, utilities;

@layer reset {
  * { margin: 0; padding: 0; }
}

@layer components {
  .btn { background: blue; }      /* wins over @layer reset even with low specificity */
}

/* Unlayered rules win over ALL layered rules */
.urgent { color: red; }  /* beats anything in a @layer */`,
  },
  {
    label: 'Inheritance',
    language: 'css',
    code: `/* Inherited properties flow from parent to children */
body {
  font-family: 'Inter', system-ui, sans-serif;
  font-size: 16px;
  color: #1e293b;
  line-height: 1.6;
}
/* All descendants inherit font-family, font-size, color, line-height */

/* Non-inherited property — does NOT flow down */
.card {
  border: 1px solid #e2e8f0;
  padding: 1rem;
}
/* Children of .card do NOT get border or padding */

/* Force inheritance with the inherit keyword */
.child-with-parent-border {
  border: inherit;  /* gets .card's border */
}

/* Reset all properties */
.isolated-widget {
  all: unset;       /* resets everything to unset (inherit if inheritable, initial otherwise) */
  display: block;   /* set back what you need */
}

/* CSS-wide keywords */
.el {
  color: inherit;   /* inherit from parent — even for non-inherited props */
  margin: initial;  /* CSS spec default (0 for margin) */
  border: unset;    /* inherited props: inherit; non-inherited: initial */
  display: revert;  /* browser UA default (block for div, inline for span) */
}`,
  },
  {
    label: 'Box Sizing & display',
    language: 'css',
    code: `/* Universal border-box — always add to your reset */
*,
*::before,
*::after {
  box-sizing: border-box;
}

/* content-box (default — painful) */
.content-box-el {
  box-sizing: content-box;
  width: 200px;
  padding: 20px;
  border: 2px solid;
  /* Total visual width = 200 + 40 + 4 = 244px */
}

/* border-box (use this) */
.border-box-el {
  box-sizing: border-box;
  width: 200px;
  padding: 20px;
  border: 2px solid;
  /* Total visual width = exactly 200px */
}

/* display values */
span       { display: inline;        } /* flows with text, no width/height */
div        { display: block;         } /* full width, new line */
img        { display: inline-block;  } /* inline flow + accepts width/height */
.hidden    { display: none;          } /* removed from layout — no space */
.invisible { visibility: hidden;     } /* hidden but space preserved */
.flex      { display: flex;          } /* flex container */
.grid      { display: grid;          } /* grid container */

/* Margin collapse — vertical only, block only */
.top    { margin-bottom: 32px; }
.bottom { margin-top: 16px; }
/* Gap between .top and .bottom = 32px (larger wins), NOT 48px */`,
  },
  {
    label: 'Resets & Best Practices',
    language: 'css',
    code: `/* Modern minimal CSS reset */
*,
*::before,
*::after {
  box-sizing: border-box;
}

* {
  margin: 0;
  padding: 0;
}

html {
  font-size: 100%;          /* respect user's browser font size setting */
  -webkit-text-size-adjust: 100%;
}

body {
  line-height: 1.5;
  -webkit-font-smoothing: antialiased;
}

img, picture, video, canvas, svg {
  display: block;
  max-width: 100%;
}

input, button, textarea, select {
  font: inherit;            /* form elements don't inherit font by default */
}

p, h1, h2, h3, h4, h5, h6 {
  overflow-wrap: break-word;
}

/* ── Specificity management patterns ── */

/* Low specificity: prefer class selectors */
.heading { font-size: 1.5rem; }   /* (0,0,1,0) */

/* Use :where() for reusable defaults — easy to override */
:where(ul, ol) { list-style: none; }   /* (0,0,0,0) — anything overrides */

/* Use :is() for grouped selectors — specificity = highest arg */
:is(h1, h2, h3) { line-height: 1.2; } /* (0,0,0,1) */`,
  },
];

const mistakes: CommonMistake[] = [
  {
    title: 'Treating specificity as a decimal number',
    wrong: `/* WRONG mental model: 10 classes = 1 ID */
/* Assume .a.b.c.d.e.f.g.h.i.j beats #id */
.a.b.c.d.e.f.g.h.i.j { color: blue; }  /* (0,0,10,0) */
#id                    { color: red; }  /* (0,1,0,0) */
/* Red wins — ID always beats any number of classes */`,
    right: `/* Specificity is a tuple compared column-by-column */
/* (0,1,0,0) vs (0,0,10,0) — compare the second column: 1 > 0, ID wins */
/* No number of classes can beat a single ID */
/* Solution: avoid IDs in CSS; use classes and @layer instead */`,
    explanation: 'Specificity is NOT a decimal system where 10 classes equal 1 ID. It is a tuple (a,b,c,d) compared column-by-column from left to right. A single ID (0,1,0,0) always beats any number of classes (0,0,N,0) regardless of N. Avoid ID selectors in CSS; use classes and cascade layers for specificity management.',
  },
  {
    title: 'Forgetting box-sizing: border-box',
    wrong: `/* Default content-box: padding/border add to specified width */
.col {
  width: 50%;
  padding: 1rem;
  /* Actual width = 50% + 2rem — overflows container */
}`,
    right: `/* Add this to your global reset — then width includes padding */
*,
*::before,
*::after { box-sizing: border-box; }

.col {
  width: 50%;
  padding: 1rem;
  /* Actual width = exactly 50% */
}`,
    explanation: 'CSS defaults to box-sizing: content-box, where specified width/height do not include padding or border — they are added on top. This makes percentage-based layouts break constantly. The universal border-box reset (*,*::before,*::after { box-sizing: border-box }) should be in every project.',
  },
  {
    title: 'Using !important to fix specificity battles',
    wrong: `/* Escalating !important war — impossible to maintain */
.sidebar .widget .title { color: blue !important; }
.theme-dark .sidebar .widget .title { color: white !important; }
/* Now you need !important to override !important — impossible */`,
    right: `/* Use cascade layers to control priority without specificity tricks */
@layer base { .title { color: blue; } }
@layer theme { .title { color: white; } }  /* theme layer declared later — wins */`,
    explanation: '!important overrides all specificity and source order. Once you use !important to fix a specificity battle, the next override requires another !important — and you cannot override !important without another !important (or a user stylesheet). Use cascade layers (@layer) to manage rule priority instead.',
  },
  {
    title: 'Expecting non-inherited properties to flow to children',
    wrong: `/* margin, padding, border do NOT inherit */
.parent {
  border: 1px solid red;
  padding: 1rem;
}
/* Child does NOT get border or padding — must set explicitly */
.parent .child {
  /* no border or padding here — browser uses initial (0) */
}`,
    right: `/* Explicitly inherit or re-declare non-inherited properties */
.parent .child {
  border: inherit;   /* explicitly copies parent's border */
  padding: inherit;  /* explicitly copies parent's padding */
}`,
    explanation: 'Only a small set of CSS properties inherit by default (color, font-*, line-height, visibility, etc.). Layout properties (border, padding, margin, background, display, width) do NOT inherit. Children use their initial value (usually 0 or none) unless explicitly set or forced with border: inherit.',
  },
];

const challenge: Challenge = {
  title: 'Tame a Specificity War',
  language: 'html',
  description: 'The CSS below has a specificity mess — buttons are styled inconsistently because of escalating selectors and !important. Refactor it using: (1) A single consistent .btn class with appropriate specificity. (2) Modifier classes (.btn--primary, .btn--danger) for variations. (3) NO !important anywhere. (4) Use @layer if needed to manage priority. The visual result must look the same — primary is blue, danger is red, default is grey.',
  hints: [
    'Remove all ID selectors and !important from the CSS.',
    'Use class selectors only: .btn for base, .btn--primary for blue, .btn--danger for red.',
    'The cascade rule: later source order wins ties. Order your rules: .btn first, then modifiers.',
    'If you have conflicts, use @layer base and @layer variants — variants layer last wins.',
  ],
  starterCode: `<style>
  /* MESSY — specificity war with !important */
  #main button { background: grey; color: white; padding: .5rem 1rem; border: none; border-radius: 6px; cursor: pointer; }
  .actions .btn-primary { background: blue !important; }
  #main .actions button.btn-danger { background: red !important; color: white !important; }
  button { font-size: .9rem; }
</style>

<div id="main">
  <div class="actions">
    <button>Default</button>
    <button class="btn-primary">Primary</button>
    <button class="btn-danger">Danger</button>
  </div>
</div>`,
  solution: `<style>
  /* CLEAN — class selectors only, no !important, source order handles priority */
  .btn {
    background: #6b7280;
    color: white;
    padding: .5rem 1rem;
    border: none;
    border-radius: 6px;
    cursor: pointer;
    font-size: .9rem;
    transition: background .15s;
  }

  .btn--primary {
    background: #2563eb;
  }
  .btn--primary:hover { background: #1d4ed8; }

  .btn--danger {
    background: #dc2626;
  }
  .btn--danger:hover { background: #b91c1c; }
</style>

<div class="actions" style="display:flex;gap:.5rem;padding:1rem;">
  <button class="btn">Default</button>
  <button class="btn btn--primary">Primary</button>
  <button class="btn btn--danger">Danger</button>
</div>`,
};

const quiz: QuizQuestion[] = [
  {
    q: 'Which CSS declaration wins when all rules target the same element and property?',
    options: [
      'The rule with the most selectors',
      'The rule with the highest specificity; ties broken by source order (last wins)',
      'The rule that appears first in the stylesheet',
      'The rule closest to the element in the HTML',
    ],
    answer: 1,
    explanation: 'The cascade resolves conflicts in order: origin/importance first, then specificity, then source order. When specificity is equal, the last rule in source order wins. The rule with the most selectors does not necessarily have the highest specificity.',
  },
  {
    q: 'What is the specificity of #nav .menu li a:hover?',
    options: [
      '(0,0,3,2)',
      '(0,1,2,2)',
      '(0,1,1,2)',
      '(0,1,2,1)',
    ],
    answer: 1,
    explanation: '#nav = 1 ID (0,1,0,0). .menu = 1 class (0,0,1,0). li = 1 element (0,0,0,1). a = 1 element (0,0,0,1). :hover = 1 pseudo-class (0,0,1,0). Total: (0,1,2,2). Count: 1 ID + 2 class-level (class + pseudo-class) + 2 elements.',
  },
  {
    q: 'What does box-sizing: border-box change?',
    options: [
      'It makes the margin included in the element\'s total width',
      'It makes padding and border included in the width/height values',
      'It uses the border as the reference box for percentage calculations',
      'It prevents margin collapse between sibling elements',
    ],
    answer: 1,
    explanation: 'border-box changes the box model so that the specified width and height include padding and border. A 200px wide element with 20px padding stays 200px total. The default content-box adds padding and border on top of the specified width, causing unexpected overflow.',
  },
  {
    q: 'Which CSS properties are inherited by default?',
    options: [
      'color, font-family, line-height',
      'margin, padding, border',
      'display, position, z-index',
      'background, width, overflow',
    ],
    answer: 0,
    explanation: 'Inherited properties are those that make sense to pass down to children: color, font-family, font-size, font-weight, line-height, text-align, visibility, cursor, and similar text/font properties. Layout properties (margin, padding, border, display, position, background) are NOT inherited — each element starts from the initial value.',
  },
  {
    q: 'What does the :where() pseudo-class do to specificity?',
    options: [
      'It doubles the specificity of its arguments',
      'It contributes 0 specificity regardless of its arguments',
      'It takes the specificity of its least-specific argument',
      'It strips specificity from all rules in the stylesheet',
    ],
    answer: 1,
    explanation: ':where() accepts a forgiving selector list but always contributes 0 (zero) specificity, no matter how specific the selectors inside are. :where(#id.class > p) = (0,0,0,0). This makes it ideal for CSS resets and default styles that should be trivially overridable.',
  },
  {
    q: 'Two block elements have margin-bottom: 32px and margin-top: 16px. What is the space between them?',
    options: [
      '48px — margins add together',
      '32px — the larger margin wins (margin collapse)',
      '16px — only the top margin of the lower element applies',
      '24px — margins average when adjacent',
    ],
    answer: 1,
    explanation: 'Adjacent vertical margins between block-level siblings collapse to the larger of the two values. margin-bottom: 32px + margin-top: 16px = 32px gap (not 48px). This is CSS margin collapse. It only applies vertically (block axis), never horizontally or inside flex/grid containers.',
  },
];

const qna: QnaItem[] = [
  {
    q: 'What is the difference between the cascade and specificity?',
    a: 'They are two stages of the same conflict-resolution algorithm. The cascade is the overall algorithm that determines which CSS rule applies when multiple rules target the same property on the same element. Specificity is one of the three criteria the cascade uses to break ties within the same origin: (1) First compare origin and importance (user agent vs author vs !important). (2) Then compare specificity (inline > ID > class > element). (3) Finally compare source order (later wins). Specificity only matters when two rules have the same origin/importance.',
  },
  {
    q: 'When does the cascade NOT use specificity?',
    a: 'Specificity is only compared within the same cascade origin. If two rules are in different origins, the cascade resolves by origin priority before ever checking specificity. For example: a user stylesheet rule with low specificity beats an author stylesheet rule with high specificity. Similarly, with cascade layers (@layer), a rule in a later-declared layer beats a rule in an earlier layer regardless of specificity — specificity is only compared within the same layer.',
  },
  {
    q: 'What is the difference between display: none and visibility: hidden?',
    a: 'display: none removes the element from the layout entirely — it takes no space, is not rendered, and its children are also removed. visibility: hidden hides the element visually but it still occupies its space in layout (a gap remains where it was). Additionally, visibility is an inherited property: visibility: hidden on a parent hides children, but a child can override with visibility: visible to show itself. display: none cannot be overridden by children.',
  },
  {
    q: 'What does all: unset do?',
    a: 'all: unset resets every CSS property (except direction and unicode-bidi) to its "unset" value on the element. For inherited properties (color, font-size, etc.), unset means inherit — they pick up the parent\'s value. For non-inherited properties (margin, padding, border, etc.), unset means initial — they reset to the CSS specification default. It is a powerful reset shorthand used in shadow DOM, web components, and isolated widget styles to strip all inherited and author styles in one declaration.',
  },
  {
    q: 'Why do percentage margins/padding use the parent\'s WIDTH even for vertical margins?',
    a: 'In CSS, percentage values for margin and padding always refer to the width of the containing block — even for top, bottom margin-top, margin-bottom, padding-top, and padding-bottom. This is intentional and allows the classic aspect-ratio hack: padding-top: 56.25% (16:9 ratio). The rule is: all four padding/margin percentage values use the parent\'s inline size (width in horizontal writing modes).',
  },
  {
    q: 'What is the difference between initial, inherit, unset, and revert?',
    a: 'initial: resets to the CSS specification default (not browser stylesheet). revert: rolls back to the browser\'s UA stylesheet default — more useful than initial because browsers have meaningful defaults (h1 is bold, a is underlined). inherit: forces the property to take the parent\'s computed value, even for non-inherited properties. unset: if the property normally inherits → inherit; if not → initial. Most useful in resets: all: unset gives you inherit for font/color (good) and initial for layout (starts fresh).',
  },
];

const revision: RevisionSummary = {
  oneLiner: 'CSS resolves conflicts through the cascade (origin → specificity → source order). Specificity is a (ID, class, element) tuple, not a decimal. Inherited properties flow down; layout properties don\'t.',
  mustKnow: [
    'Cascade order: importance → origin → @layer order → specificity → source order (last wins).',
    'Specificity: inline (1,0,0,0) > ID (0,1,0,0) > class/attr/pseudo-class (0,0,1,0) > element (0,0,0,1). Never treat as decimal.',
    ':where() contributes 0 specificity. :is() takes the specificity of its highest argument.',
    'box-sizing: border-box makes width/height include padding and border — always apply universally.',
    'Inherited properties: color, font-*, line-height. Non-inherited: margin, padding, border, background, display.',
    'Vertical margins between adjacent blocks collapse to the larger value. Flex/grid children do not collapse.',
  ],
  interviewFocus: [
    'How does the CSS cascade resolve conflicting rules?',
    'How is specificity calculated and compared?',
    'What is the difference between inherited and non-inherited properties?',
    'What does box-sizing: border-box change about the box model?',
  ],
};

@Component({
  selector: 'app-css-fundamentals',
  standalone: true,
  imports: [PageMetaComponent, QuickRefComponent, TheoryBlockComponent, CodeBlockComponent,
            CommonMistakesComponent, ChallengeBlockComponent, QuizBlockComponent,
            QnaBlockComponent, RevisionCardComponent, PageCompleteComponent],
  templateUrl: './fundamentals.html',
  styleUrl: './fundamentals.scss',
})
export class CssFundamentals {
  quickRef = quickRef;
  theory = theory;
  codeTabs = codeTabs;
  mistakes = mistakes;
  challenge = challenge;
  quiz = quiz;
  qna = qna;
  revision = revision;
}
