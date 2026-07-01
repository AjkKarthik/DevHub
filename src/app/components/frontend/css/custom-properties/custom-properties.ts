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
  { name: '--my-var: value',           type: 'syntax',   desc: 'Declare a custom property (CSS variable) on an element.' },
  { name: 'var(--my-var)',             type: 'function', desc: 'Read a custom property value.' },
  { name: 'var(--my-var, fallback)',   type: 'function', desc: 'Read with fallback if the variable is undefined or invalid.' },
  { name: ':root { --x: y }',         type: 'syntax',   desc: 'Global scope — variables on :root are accessible everywhere.' },
  { name: 'inherit',                   type: 'keyword',  desc: 'Custom properties cascade and inherit through the DOM by default.' },
  { name: '@property',                 type: 'syntax',   desc: 'Register a typed custom property with syntax, initial value, inherits.' },
  { name: 'color-mix()',               type: 'function', desc: 'Mix two colors in a given color space — CSS-native tinting.' },
  { name: 'calc() with var()',         type: 'function', desc: 'Use custom properties inside calc(): calc(var(--size) * 1.5).' },
];

const theory: TheoryPoint[] = [
  {
    heading: 'Declaring and Using Custom Properties',
    points: [
      'Custom properties (CSS variables) are declared with -- prefix: --color-primary: #264de4.',
      'They can hold any valid CSS value: colors, lengths, strings, even partial values.',
      'Read them with var(--name). Add a fallback: var(--name, defaultValue).',
      'Custom properties are case-sensitive: --Color and --color are different variables.',
      ':root is the highest scope — variables there are globally accessible throughout the stylesheet.',
    ],
  },
  {
    heading: 'Cascade and Inheritance',
    points: [
      'Custom properties cascade and inherit just like regular CSS properties.',
      'A variable defined on a parent is available to all its descendants.',
      'Redefine a variable on a child to override it for that subtree — scoped theming.',
      'Variables defined inline (style attribute) override stylesheets.',
      'A variable with an invalid value at used-value time uses the property\'s inherited or initial value, not the fallback.',
    ],
  },
  {
    heading: 'Design Tokens and Theming Patterns',
    points: [
      'Define all design tokens (colors, spacing, radii, shadows) as custom properties on :root.',
      'Dark mode: swap variable values under body.dark rather than rewriting every rule.',
      'Component theming: expose --component-accent on the component root for external customisation.',
      'Token naming convention: --color-surface, --spacing-md, --radius-card, --shadow-lg.',
      'Use CSS variables for theming over Sass variables — they work at runtime, not compile time.',
    ],
  },
  {
    heading: '@property — Registered Custom Properties',
    points: [
      '@property --hue { syntax: "<angle>"; initial-value: 0deg; inherits: false; } enables typed custom properties.',
      'Typed properties can be animated — unregistered custom properties cannot be interpolated.',
      'syntax: "<color>" allows gradients and transitions to animate between color variable values.',
      'initial-value is required when inherits: false so the browser has a concrete fallback.',
      'Registered properties unlock CSS animations driven by custom property changes.',
    ],
  },
  {
    heading: 'Custom Properties vs Sass/Preprocessor Variables',
    points: [
      'CSS custom properties (--variable-name) are resolved at runtime in the browser and are genuinely part of the DOM/CSSOM, meaning they can be read, written, and changed dynamically via JavaScript and respond live to changes — Sass variables are compiled away entirely at build time into static values.',
      'This runtime nature is what enables custom properties to change based on context — a custom property can have a different value inside a specific component, media query, or user-toggled theme, cascading and inheriting just like any other CSS property.',
      'Custom properties integrate naturally with the cascade and inheritance model — a value set on a parent element automatically flows down to children unless overridden, exactly like color or font-size, which Sass variables (resolved entirely at compile time) cannot replicate.',
      'For genuinely static values that never change at runtime (a fixed set of breakpoint values used only in media queries, for example), Sass variables remain perfectly reasonable — custom properties add the most value specifically for values that need to respond to runtime context like theming or user preference.',
    ],
  },
];

const codeTabs: CodeTab[] = [
  {
    label: 'Design Token System',
    language: 'css',
    code: `:root {
  /* Color tokens */
  --color-primary:   #264de4;
  --color-primary-light: #5b80f0;
  --color-surface:   #ffffff;
  --color-text:      #1e293b;
  --color-border:    #e2e8f0;

  /* Spacing scale */
  --space-xs: 0.25rem;
  --space-sm: 0.5rem;
  --space-md: 1rem;
  --space-lg: 1.5rem;
  --space-xl: 2rem;

  /* Typography */
  --font-size-sm: 0.875rem;
  --font-size-base: 1rem;
  --font-size-lg: 1.125rem;
  --font-size-xl: 1.5rem;

  /* Radii & shadows */
  --radius-sm: 4px;
  --radius-md: 8px;
  --radius-lg: 12px;
  --shadow-card: 0 1px 4px rgba(0,0,0,.08), 0 4px 16px rgba(0,0,0,.06);
}

.card {
  background: var(--color-surface);
  color: var(--color-text);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  padding: var(--space-lg);
  box-shadow: var(--shadow-card);
}`,
  },
  {
    label: 'Dark Mode Theming',
    language: 'css',
    code: `:root {
  --bg:          #ffffff;
  --bg-surface:  #f8fafc;
  --text:        #1e293b;
  --text-muted:  #64748b;
  --border:      #e2e8f0;
  --accent:      #264de4;
  --accent-text: #ffffff;
}

/* Swap tokens — components don't change at all */
body.dark {
  --bg:          #0f172a;
  --bg-surface:  #1e293b;
  --text:        #f1f5f9;
  --text-muted:  #94a3b8;
  --border:      #334155;
  --accent:      #93c5fd;
  --accent-text: #0f172a;
}

/* Components reference tokens, never raw colors */
.btn-primary {
  background: var(--accent);
  color: var(--accent-text);
  padding: 0.5rem 1.25rem;
  border-radius: 6px;
  border: none;
  cursor: pointer;
}`,
  },
  {
    label: 'Component Scoping',
    language: 'css',
    code: `/* Default: blue accent */
.alert {
  --alert-color: #3b82f6;
  --alert-bg: #eff6ff;
  --alert-border: #bfdbfe;

  background: var(--alert-bg);
  border-left: 4px solid var(--alert-color);
  padding: 1rem 1.25rem;
  border-radius: 0 8px 8px 0;
  color: var(--alert-color);
}

/* Override by modifier class */
.alert.alert--danger {
  --alert-color: #ef4444;
  --alert-bg: #fef2f2;
  --alert-border: #fecaca;
}

.alert.alert--success {
  --alert-color: #22c55e;
  --alert-bg: #f0fdf4;
  --alert-border: #bbf7d0;
}`,
  },
  {
    label: '@property Animation',
    language: 'css',
    code: `/* Register a typed custom property to enable animation */
@property --hue {
  syntax: '<angle>';
  initial-value: 0deg;
  inherits: false;
}

.rainbow-btn {
  --hue: 0deg;
  background: hsl(var(--hue), 80%, 55%);
  transition: --hue 0.4s ease;
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 8px;
  color: #fff;
  cursor: pointer;
}

.rainbow-btn:hover { --hue: 240deg; }

/* Animated gradient using @property */
@property --angle {
  syntax: '<angle>';
  initial-value: 0deg;
  inherits: false;
}

@keyframes spin-gradient { to { --angle: 360deg; } }

.gradient-border {
  background: conic-gradient(from var(--angle), #264de4, #7c3aed, #0ea5e9, #264de4);
  animation: spin-gradient 3s linear infinite;
}`,
  },
];

const mistakes: CommonMistake[] = [
  {
    title: 'Expecting the fallback to catch an invalid value',
    wrong: `--size: "large";  /* string, not a length */
.box { width: var(--size, 100px); }  /* 100px fallback won't apply */`,
    right: `--size: 200px;  /* valid length */
.box { width: var(--size, 100px); }`,
    explanation: 'The fallback in var() only applies when the variable is undefined. If it\'s defined but invalid for the property, the browser uses the property\'s inherited or initial value — not the fallback.',
  },
  {
    title: 'Using Sass variables for runtime theming',
    wrong: `$accent: #264de4;
body.dark { /* can't change $accent at runtime */
  $accent: #93c5fd;  /* Sass variable — compile-time only */
}`,
    right: `:root { --accent: #264de4; }
body.dark { --accent: #93c5fd; }  /* CSS variable — works at runtime */`,
    explanation: 'Sass variables are compiled away — they can\'t change based on DOM state. CSS custom properties resolve at runtime and can be swapped by toggling a class.',
  },
  {
    title: 'Forgetting units when doing math',
    wrong: `--multiplier: 2;
.box { padding: calc(var(--multiplier) * rem); }  /* invalid */`,
    right: `--base: 1rem;
.box { padding: calc(var(--base) * 2); }  /* valid */`,
    explanation: 'Numbers stored in custom properties are unitless. For calc() to work, ensure units are attached to the variable value or to the constant inside calc().',
  },
  {
    title: 'Defining variables in a component instead of :root for global tokens',
    wrong: `.btn { --color-primary: #264de4; }  /* only available inside .btn */`,
    right: `:root { --color-primary: #264de4; }  /* globally available */
.btn { background: var(--color-primary); }`,
    explanation: 'Custom properties cascade downward. A variable on .btn is invisible to siblings or ancestors. Global design tokens belong on :root.',
  },
];

const challenge: Challenge = {
  title: 'Themeable Card Component',
  language: 'html',
  description: 'Build a card component that uses CSS custom properties for all colors and spacing. The card should have a default (light) theme and a .card--dark modifier that swaps the tokens. No hardcoded colors allowed — everything must go through a custom property.',
  hints: [
    'Declare all tokens (--card-bg, --card-text, --card-border, --card-accent) on the .card selector.',
    'Use var() for every color and spacing value in the card styles.',
    'Override the tokens in .card--dark without changing any other rule.',
    'Add a hover state that uses the same --card-accent token.',
  ],
  starterCode: `<div class="card">
  <h3 class="card-title">Light Theme</h3>
  <p class="card-body">This card uses CSS custom properties for theming.</p>
  <a class="card-link" href="#">Learn more →</a>
</div>

<div class="card card--dark">
  <h3 class="card-title">Dark Theme</h3>
  <p class="card-body">Same component, different tokens.</p>
  <a class="card-link" href="#">Learn more →</a>
</div>`,
  solution: `.card {
  --card-bg:      #ffffff;
  --card-text:    #1e293b;
  --card-muted:   #64748b;
  --card-border:  #e2e8f0;
  --card-accent:  #264de4;
  --card-radius:  12px;
  --card-padding: 1.5rem;

  background:    var(--card-bg);
  color:         var(--card-text);
  border:        1px solid var(--card-border);
  border-radius: var(--card-radius);
  padding:       var(--card-padding);
  max-width:     360px;
  box-shadow:    0 1px 4px rgba(0,0,0,.06);
}

.card--dark {
  --card-bg:     #1e293b;
  --card-text:   #f1f5f9;
  --card-muted:  #94a3b8;
  --card-border: #334155;
  --card-accent: #93c5fd;
}

.card-title {
  margin: 0 0 0.5rem;
  font-size: 1.1rem;
  font-weight: 700;
}

.card-body {
  color: var(--card-muted);
  font-size: 0.9rem;
  margin-bottom: 1rem;
}

.card-link {
  color: var(--card-accent);
  font-weight: 600;
  text-decoration: none;
  font-size: 0.9rem;
}

.card-link:hover {
  text-decoration: underline;
}`,
};

const quiz: QuizQuestion[] = [
  {
    q: 'When does the fallback in var(--x, fallback) apply?',
    options: [
      'When the variable value is 0',
      'When the variable is undefined or not inherited',
      'When the variable value is invalid for the property it\'s used in',
      'Always — it is the default value',
    ],
    answer: 1,
    explanation: 'The fallback applies only when the variable is undefined (not declared in the current scope or inherited). An invalid value does not trigger the fallback — the property uses its inherited or initial value instead.',
  },
  {
    q: 'Which selector is used to declare global CSS custom properties?',
    options: ['html', ':root', 'body', '*'],
    answer: 1,
    explanation: ':root matches the document root element (same as html but with higher specificity). It\'s the conventional place for global tokens since custom properties cascade downward from it.',
  },
  {
    q: 'What is the main advantage of CSS custom properties over Sass variables for theming?',
    options: [
      'Custom properties have better browser support',
      'Custom properties can be changed at runtime by JS or class toggles',
      'Custom properties are scoped to components automatically',
      'Custom properties generate smaller CSS bundles',
    ],
    answer: 1,
    explanation: 'Sass variables are replaced at compile time — they can\'t respond to DOM state. CSS custom properties resolve at runtime and can be swapped by toggling a class (e.g. body.dark), no JavaScript required.',
  },
  {
    q: 'What does @property enable that regular custom properties cannot do?',
    options: [
      'Scoping variables to a single component',
      'Using variables inside media queries',
      'Animating/transitioning between custom property values',
      'Declaring variables without a -- prefix',
    ],
    answer: 2,
    explanation: '@property registers a typed custom property. Because the browser knows the type (e.g. <color>, <angle>), it can interpolate between values for animations and transitions.',
  },
  {
    q: 'How do you scope a CSS variable to a specific component?',
    options: [
      'Declare it in a <style scoped> block',
      'Prefix it with the component name',
      'Declare it on the component\'s root selector instead of :root',
      'Use @property with inherits: false',
    ],
    answer: 2,
    explanation: 'Custom properties cascade downward. Declaring --var on .card makes it available only inside .card descendants. Declaring on :root makes it global.',
  },
  {
    q: 'What is the correct way to use a unitless custom property in a calc() expression?',
    options: [
      '--ratio: 1.5; width: calc(var(--ratio)px)',
      '--base: 1rem; width: calc(var(--base) * 1.5)',
      '--px: px; width: calc(100 + var(--px))',
      '--size: 100; width: calc(var(--size))',
    ],
    answer: 1,
    explanation: 'Attach units to the variable value itself (--base: 1rem) and multiply by a unitless number in calc(). Concatenating a unit string after var() is invalid CSS.',
  },
];

const qna: QnaItem[] = [
  {
    q: 'Can CSS custom properties be read and written with JavaScript?',
    a: 'Yes — getComputedStyle(el).getPropertyValue("--my-var") reads a variable, and el.style.setProperty("--my-var", "value") writes it. This enables JS-driven theming, animations, and data visualizations that use CSS rendering for performance.',
  },
  {
    q: 'Are CSS custom properties the same as Sass/Less variables?',
    a: 'No. Sass/Less variables are preprocessor constructs replaced at compile time — the browser never sees them. CSS custom properties are real CSS features resolved at runtime by the browser. They can change based on DOM state, media queries, and JavaScript, whereas preprocessor variables are static after compilation.',
  },
  {
    q: 'Can I use custom properties inside media queries?',
    a: 'Custom properties cannot be used as media query values (e.g. @media (min-width: var(--bp-md)) is invalid). Media query values must be static. You can however change the values of custom properties inside a media query: @media (prefers-color-scheme: dark) { :root { --bg: #0f172a; } }.',
  },
  {
    q: 'What happens if a custom property is used on a property where its value is invalid?',
    a: 'The browser uses the property\'s inherited value if the property inherits, or its initial value if it doesn\'t. The var() fallback does NOT apply — it only fires when the variable is undefined. This is called "invalid at computed-value time" and is a common source of confusion.',
  },
  {
    q: 'How many CSS custom properties should a design system have?',
    a: 'A well-structured design system typically has 30–80 tokens: ~10 for color, ~8 for spacing, ~5 for typography scale, ~5 for border radii, ~5 for shadows, ~5 for z-index levels. Start small and expand — too many tokens create decision paralysis.',
  },
  {
    q: 'Can custom properties reference other custom properties?',
    a: 'Yes — --color-primary-dark: color-mix(in srgb, var(--color-primary) 80%, black) or --space-lg: calc(var(--space-md) * 1.5). Circular references are resolved to the initial value of the property.',
  },
];

const revision: RevisionSummary = {
  oneLiner: 'CSS custom properties are runtime variables that cascade, inherit, and can be swapped at any scope — the foundation of scalable theming.',
  mustKnow: [
    'Declare with -- prefix: --color: #264de4. Read with var(--color).',
    ':root = global scope. Component selector = scoped to that subtree.',
    'Fallback in var() only fires when variable is undefined, not when invalid.',
    'Dark mode: redefine tokens under body.dark — components need no changes.',
    '@property enables typed custom properties that can be animated.',
    'Custom properties are runtime — they respond to class changes and JS. Sass variables are compile-time.',
  ],
  interviewFocus: [
    'How do CSS custom properties differ from Sass variables?',
    'When does the var() fallback apply vs not apply?',
    'How would you implement dark mode using CSS variables?',
    'What does @property unlock that regular custom properties can\'t do?',
  ],
};

@Component({
  selector: 'app-css-custom-properties',
  standalone: true,
  imports: [PageMetaComponent, QuickRefComponent, TheoryBlockComponent, CodeBlockComponent,
            CommonMistakesComponent, ChallengeBlockComponent, QuizBlockComponent,
            QnaBlockComponent, RevisionCardComponent, PageCompleteComponent],
  templateUrl: './custom-properties.html',
  styleUrl: './custom-properties.scss',
})
export class CssCustomProperties {
  quickRef = quickRef;
  theory = theory;
  codeTabs = codeTabs;
  mistakes = mistakes;
  challenge = challenge;
  quiz = quiz;
  qna = qna;
  revision = revision;
}
