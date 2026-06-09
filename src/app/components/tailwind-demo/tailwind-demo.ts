import { Component, signal } from '@angular/core';
import { CodeBlockComponent, CodeTab } from '../shared/code-block/code-block';
import { TheoryBlockComponent, TheoryPoint } from '../shared/theory-block/theory-block';
import { QnaBlockComponent, QnaItem } from '../shared/qna-block/qna-block';
import { QuizBlockComponent, QuizQuestion } from '../shared/quiz-block/quiz-block';
import { ChallengeBlockComponent, Challenge } from '../shared/challenge-block/challenge-block';
import { QuickRefComponent, QuickRefItem } from '../shared/quick-ref/quick-ref';
import { BeforeAfterComponent, BeforeAfterExample } from '../shared/before-after/before-after';
import { CommonMistakesComponent, CommonMistake } from '../shared/common-mistakes/common-mistakes';
import { VersionBadgeComponent, VersionInfo } from '../shared/version-badge/version-badge';
import { PageMetaComponent } from '../shared/page-meta/page-meta';
import { PageCompleteComponent } from '../shared/page-complete/page-complete';

@Component({
  selector: 'app-tailwind-demo',
  imports: [CodeBlockComponent, TheoryBlockComponent, QnaBlockComponent, QuizBlockComponent, ChallengeBlockComponent, QuickRefComponent, BeforeAfterComponent, CommonMistakesComponent, VersionBadgeComponent, PageMetaComponent, PageCompleteComponent],
  templateUrl: './tailwind-demo.html',
  styleUrl: './tailwind-demo.scss',
})
export class TailwindDemo {
  darkMode  = signal(false);
  activeTab = signal(0);

  qna: QnaItem[] = [
    { q: 'Why can\'t you build class names dynamically in Tailwind?', a: 'Tailwind scans source files as plain text and generates a CSS file with only the classes it finds. If you build a class like <code>\'text-\' + color</code>, Tailwind never sees the full string and won\'t include that class in the output.' },
    { q: 'How do you toggle Tailwind classes with Angular signals?', a: '<code>[class.bg-indigo-600]="isActive()"</code> or <code>[ngClass]="{ \'bg-indigo-600\': isActive(), \'bg-gray-200\': !isActive() }"</code>. Both work — the classes must appear as complete strings in the template for Tailwind to detect them.' },
    { q: 'What is @apply in Tailwind?', a: '<code>@apply bg-indigo-600 text-white rounded-lg px-4 py-2;</code> extracts repeated utilities into a named class in your CSS. Use it for component classes like <code>.btn-primary</code> — avoids repeating the same set of utilities in every template.' },
    { q: 'How do responsive prefixes work in Tailwind?', a: '<code>sm:</code>, <code>md:</code>, <code>lg:</code>, <code>xl:</code> are mobile-first breakpoints. <code>sm:grid-cols-2</code> means "apply grid-cols-2 at screens ≥ 640px". No prefix = applies to all screen sizes.' },
    { q: 'How does Tailwind\'s dark: variant work?', a: 'Tailwind watches for a <code>.dark</code> class on the <code>&lt;html&gt;</code> element. When present, <code>dark:</code>-prefixed classes activate. Toggle with: <code>document.documentElement.classList.toggle(\'dark\')</code>.' },
    { q: 'How do you add custom colours to Tailwind?', a: 'Extend the theme in <code>tailwind.config.js</code>: <code>theme: { extend: { colors: { brand: \'#6366f1\' } } }</code>. Then use <code>bg-brand</code>, <code>text-brand</code> etc. in your templates.' },
  ];

  theory: TheoryPoint[] = [
  {
    heading: 'What is utility-first CSS?',
    points: [
      'Instead of writing named CSS classes, you compose small single-purpose utilities directly in the HTML.',
      'No context-switching between HTML and CSS files — styling lives in the template alongside structure.',
      'Tailwind generates only the classes you use — with v4\'s engine, no config file is needed at all.',
      'Learning curve: memorise the naming convention once and every project looks the same.',
    ],
  },
  {
    heading: 'Angular integration patterns',
    points: [
      'Use <code>[class]</code> binding for fully dynamic classes: <code>[class]="isActive() ? \'bg-green-100\' : \'bg-gray-100\'"</code>.',
      'Use <code>[class.bg-red-500]="hasError()"</code> for toggling a single Tailwind class based on a signal.',
      'Avoid <code>ngClass</code> with string maps — <code>[class.x]</code> bindings are more explicit and tree-shakeable.',
      'Use <code>@apply</code> in component SCSS to extract repeated utility combinations into a named class.',
    ],
  },
  {
    heading: 'Responsive & dark mode',
    points: [
      'Breakpoint prefixes: <code>sm:</code> (640px), <code>md:</code> (768px), <code>lg:</code> (1024px), <code>xl:</code> (1280px). Mobile-first.',
      'Dark mode: add <code>.dark</code> class to <code>&lt;html&gt;</code> and prefix utilities with <code>dark:</code>.',
      'In Angular, toggle dark mode: <code>document.documentElement.classList.toggle(\'dark\')</code>.',
      'Tailwind v4 uses CSS variables for theming — override <code>--color-primary</code> etc. without a config file.',
    ],
  },
  {
    heading: 'Key points to remember',
    points: [
      'Tailwind purges unused classes at build time — never construct class names dynamically with string concatenation.',
      '<code>@layer utilities { .my-class { @apply ...; } }</code> — wrap custom classes in a layer to control specificity.',
      'Use the Tailwind IntelliSense VS Code extension for autocomplete, linting, and hover previews.',
      'Tailwind works alongside Angular Material — scope Tailwind with a prefix or use CSS layers to avoid conflicts.',
    ],
  },
];

  tabs: CodeTab[] = [
    {
      label: 'Setup (Angular 22)',
      language: 'bash',
      code: `# Install Tailwind CSS v4 (PostCSS plugin)
npm install tailwindcss @tailwindcss/postcss postcss

# postcss.config.js
export default { plugins: { '@tailwindcss/postcss': {} } };

# In styles.scss — one line to activate everything:
@import "tailwindcss";

# Angular 22 uses Vite by default so no separate tailwind.config.js needed.
# Tailwind v4 auto-discovers your template files.`,
    },
    {
      label: '[class] binding',
      language: 'html',
      code: `<!-- Static classes -->
<button class="rounded-lg bg-indigo-600 px-4 py-2 text-white hover:bg-indigo-700">
  Click me
</button>

<!-- Dynamic via signal -->
<div [class]="isActive() ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'">
  Status
</div>

<!-- Conditional with ngClass-style object — use [class.xxx] -->
<div
  class="rounded-lg px-3 py-1 text-sm font-semibold"
  [class.bg-red-100]="hasError()"
  [class.text-red-700]="hasError()"
  [class.bg-green-100]="!hasError()"
  [class.text-green-700]="!hasError()">
  Badge
</div>`,
    },
    {
      label: 'Responsive + Dark',
      language: 'html',
      code: `<!-- Responsive breakpoints: sm md lg xl 2xl -->
<div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
  <!-- 1 col on mobile, 2 on sm+, 3 on lg+ -->
</div>

<!-- Dark mode — add 'dark' class to <html> or use CSS media -->
<!-- In styles.scss: @variant dark (&:where(.dark, .dark *)); -->
<body [class.dark]="darkMode()">
  <div class="bg-white text-gray-900 dark:bg-gray-900 dark:text-white">
    Adapts to dark mode
  </div>
</body>

<!-- Angular component toggling dark mode -->
export class App {
  dark = signal(false);
  toggle() {
    this.dark.update(v => !v);
    document.documentElement.classList.toggle('dark');
  }
}`,
    },
    {
      label: '@apply in SCSS',
      language: 'scss',
      code: `// styles.scss or component .scss
// Use @apply to extract reusable utility combinations

.btn-primary {
  @apply rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white
         hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-400
         disabled:cursor-not-allowed disabled:opacity-50 transition-colors;
}

.card {
  @apply rounded-2xl border border-gray-200 bg-white p-6 shadow-sm
         dark:border-gray-700 dark:bg-gray-800;
}

.input {
  @apply block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm
         focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500
         dark:border-gray-600 dark:bg-gray-700 dark:text-white;
}`,
    },
  ];

  quiz: QuizQuestion[] = [
    { q: 'Why should you avoid building Tailwind class names dynamically using string concatenation (e.g., `\'text-\' + color`)?', options: ['It causes runtime errors in Angular\'s change detection cycle', 'Tailwind scans source files as plain text and won\'t include classes it never sees as complete strings', 'Angular\'s AOT compiler strips dynamic string expressions from templates', 'PostCSS cannot process class names that contain JavaScript variables'], answer: 1, explanation: 'Tailwind generates its CSS by scanning source files for complete class name strings. If you concatenate parts of a class name at runtime, Tailwind never sees the full class during the build scan and omits it from the output bundle.' },
    { q: 'Which Angular binding syntax is preferred for toggling a single Tailwind class based on a signal, and why?', options: ['[ngClass]="{\'bg-red-500\': hasError()}" — because ngClass is the official Angular directive for class toggling', '[style.background]="hasError() ? \'red\' : \'\'" — because inline styles always override utility classes', '[class.bg-red-500]="hasError()" — because it is explicit, tree-shakeable, and the full class string is visible to Tailwind\'s scanner', 'class="{{hasError() ? \'bg-red-500\' : \'\'}}" — because interpolation is the most readable approach'], answer: 2, explanation: 'The [class.bg-red-500] binding keeps the full class string visible in the template so Tailwind can detect and include it. It is also more explicit and does not require importing NgClass.' },
    { q: 'What does the Tailwind class string `grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3` produce?', options: ['A 3-column grid on all screen sizes, collapsing to 1 column on mobile', 'A 1-column grid on mobile, switching to 2 columns at 640 px and 3 columns at 1024 px', 'A 2-column grid by default, growing to 3 columns above 1280 px', 'A 1-column grid on mobile and a 3-column grid on all other screen sizes'], answer: 1, explanation: 'Tailwind is mobile-first. The unprefixed `grid-cols-1` applies at all sizes, `sm:` activates at 640 px, and `lg:` activates at 1024 px, so the layout progresses 1 → 2 → 3 columns as the viewport widens.' },
    { q: 'What is the correct Angular pattern for toggling global dark mode that works with Tailwind\'s `dark:` variant?', options: ['Set a CSS variable `--theme: dark` on the root element and reference it in Tailwind config', 'Use `@media (prefers-color-scheme: dark)` and let the browser handle it automatically', 'Add a `darkMode` input to every component and pass it through the component tree', 'Call `document.documentElement.classList.toggle(\'dark\')` and bind `[class.dark]` on the host or body element'], answer: 3, explanation: 'Tailwind\'s class-based dark mode watches for a `.dark` class on the `<html>` element. Toggling it with `document.documentElement.classList.toggle(\'dark\')` (and optionally syncing a signal with `[class.dark]`) activates all `dark:` prefixed utilities.' },
    { q: 'When should you use `@apply` in a component\'s SCSS file instead of repeating Tailwind utilities in every template?', options: ['Always — @apply is the recommended way to use Tailwind in Angular projects', 'Never — @apply is deprecated in Tailwind v4 and should be replaced with CSS variables', 'When the same set of utilities is reused across many elements and extracting them into a named class reduces duplication', 'Only when the component uses Angular Material, to avoid specificity conflicts'], answer: 2, explanation: '@apply is best used to extract repeated utility combinations (like `.btn-primary` or `.card`) into a named CSS class, avoiding the need to copy the same long list of utilities into every template element.' },
  ];

  quickRef: QuickRefItem[] = [
    { name: '[class] binding', type: 'directive', desc: 'Dynamically sets one or more CSS classes on an element using an expression or ternary — keeps full class strings visible to Tailwind\'s scanner.', since: '2' },
    { name: '[class.x] binding', type: 'directive', desc: 'Toggles a single named CSS class conditionally based on a truthy expression, e.g. [class.bg-red-500]=\'hasError()\'.', since: '2' },
    { name: 'signal()', type: 'function', desc: 'Creates a reactive signal holding a value; reading it in a template automatically re-renders when updated — ideal for toggling Tailwind classes.', since: '16' },
    { name: '@apply', type: 'function', desc: 'Tailwind CSS directive used inside SCSS to extract repeated utility combinations into a named class, avoiding duplication across templates.' },
    { name: 'dark: variant', type: 'directive', desc: 'Tailwind prefix that activates a utility only when the .dark class is present on the html element, enabling class-based dark mode toggling.' },
    { name: 'Responsive prefixes (sm: md: lg: xl:)', type: 'directive', desc: 'Mobile-first breakpoint prefixes in Tailwind that apply a utility at a minimum viewport width (640px, 768px, 1024px, 1280px respectively).' },
    { name: '@layer utilities', type: 'function', desc: 'Tailwind CSS at-rule that wraps custom classes in a named cascade layer to control specificity and ensure Tailwind\'s purge step includes them.' },
    { name: 'NgClass', type: 'directive', desc: 'Angular directive that sets classes from an object map — still works with Tailwind but [class.x] bindings are preferred for explicitness and tree-shakeability.', since: '2' },
    { name: 'update()', type: 'function', desc: 'Signal method that accepts a callback receiving the current value and returning the next value, used to toggle boolean signals for dark mode.', since: '16' },
    { name: 'set()', type: 'function', desc: 'Signal method that directly assigns a new value, e.g. darkMode.set(!darkMode()), triggering reactive re-renders in the template.', since: '16' },
  ];

  beforeAfter: BeforeAfterExample[] = [
    {
      title: 'Class toggling: ngClass object vs [class.x] binding',
      before: `<div
  [ngClass]="{
    'bg-indigo-600': isActive(),
    'bg-gray-200': !isActive()
  }">
  Status
</div>`,
      after: `<div
  [class.bg-indigo-600]="isActive()"
  [class.bg-gray-200]="!isActive()">
  Status
</div>`,
      note: '[class.x] keeps full class strings visible to Tailwind\'s scanner and avoids importing NgClass.',
    },
    {
      title: 'Dark mode toggle: manual DOM vs signal-driven binding',
      before: `// Imperative DOM manipulation only
toggleDark() {
  document.documentElement
    .classList.toggle('dark');
}`,
      after: `dark = signal(false);
toggle() {
  this.dark.update(v => !v);
  document.documentElement
    .classList.toggle('dark');
}
// Template: [class.dark]="dark()"`,
      note: 'Pairing a signal with the DOM class keeps Angular state in sync with the Tailwind dark variant.',
    },
    {
      title: 'Repeated utilities: inline vs @apply extraction',
      before: `<button class="rounded-lg bg-indigo-600 px-4 py-2
  text-sm font-semibold text-white
  hover:bg-indigo-700 disabled:opacity-50">
  Save
</button>`,
      after: `// component.scss
.btn-primary {
  @apply rounded-lg bg-indigo-600 px-4 py-2
    text-sm font-semibold text-white
    hover:bg-indigo-700 disabled:opacity-50;
}
// template: <button class="btn-primary">`,
      note: '@apply extracts repeated utility sets into a named class to reduce template duplication.',
    },
  ];

  mistakes: CommonMistake[] = [
    {
      title: 'Building Tailwind class names with string concatenation',
      wrong: `// Tailwind never sees 'text-red-500' as a full string
const color = 'red-500';
// template
[class]="'text-' + color"`,
      right: `// Write complete class strings so Tailwind's scanner finds them
[class]="hasError() ? 'text-red-500' : 'text-gray-700'"`,
      explanation: 'Tailwind scans source files as plain text at build time. Concatenated class names are never seen as complete strings, so Tailwind omits them from the output bundle.',
    },
    {
      title: 'Forgetting to make full class strings visible to Tailwind\'s scanner',
      wrong: `// Classes hidden inside a TS map — Tailwind may miss them
statusCls = { active: 'bg-green', error: 'bg-red' };
[class]="statusCls[state]"`,
      right: `// Use ternary or [class.x] so full strings appear in the template
[class]="state === 'active' ? 'bg-green-100' : 'bg-red-100'"`,
      explanation: 'Tailwind scans templates for complete class name strings. If classes are only referenced through object property lookups, they may not appear literally and get purged.',
    },
    {
      title: 'Using NgClass when [class.x] bindings suffice',
      wrong: `import { NgClass } from '@angular/common';
// template
[ngClass]="{ 'bg-red-500': err(), 'text-white': err() }"`,
      right: `<div
  [class.bg-red-500]="err()"
  [class.text-white]="err()">`,
      explanation: 'NgClass requires an import and adds indirection. Multiple [class.x] bindings are explicit, tree-shakeable, and keep class strings visible to Tailwind\'s scanner.',
    },
    {
      title: 'Omitting @layer when adding custom classes alongside Tailwind utilities',
      wrong: `// styles.scss — custom class may conflict with Tailwind specificity
.card {
  @apply rounded-2xl bg-white p-6;
}`,
      right: `@layer components {
  .card {
    @apply rounded-2xl bg-white p-6;
  }
}`,
      explanation: 'Wrapping custom classes in @layer components ensures Tailwind controls cascade order, preventing specificity conflicts with utility classes applied directly in templates.',
    },
  ];

  versionItems: VersionInfo[] = [
    {
      version: 'Tailwind CSS v4',
      label: 'Zero-config setup',
      features: [
        'No tailwind.config.js required — Tailwind v4 auto-discovers template files using the Vite/PostCSS plugin.',
        'Activate with a single @import \'tailwindcss\'; line in styles.scss.',
        'CSS variables replace JS config for theming — override --color-primary etc. directly in CSS.',
        'Angular 22\'s default Vite build aligns perfectly with Tailwind v4\'s Vite-first approach.',
      ],
    },
    {
      version: 'Angular 16',
      label: 'Signals for reactive class toggling',
      features: [
        'signal(), computed(), and effect() allow reactive state without RxJS or component lifecycle hooks.',
        'Pair signals with [class.x] bindings for concise, reactive Tailwind class toggling.',
        'darkMode = signal(false) with [class.dark]=\'darkMode()\' is the idiomatic Angular 16+ dark mode pattern.',
      ],
    },
  ];

  challenge: Challenge = {
    title: 'Dark Mode Card with Signal Toggle',
    description: 'Build a self-contained Angular component that displays a profile card. The card must respond to a `darkMode` signal: when dark mode is active the card should use dark backgrounds and light text. Use Tailwind utility classes directly in the template along with `[class]` or `[class.x]` bindings driven by the signal. Add a toggle button inside the card that flips the signal. Do NOT build class names with string concatenation.',
    language: 'html',
    hints: [
      'Use `[class]` binding with a ternary to swap between two full class strings, e.g. `[class]="darkMode() ? \'bg-gray-900 text-white\' : \'bg-white text-gray-900\'"`.',
      'The toggle button itself can use `[class.bg-indigo-700]="darkMode()"` and `[class.bg-indigo-600]="!darkMode()"` to reflect the current state.',
      'Remember: write every Tailwind class as a complete string — never concatenate prefixes like `\'bg-\' + color`.',
      'Wrap the whole card in a `<div>` that changes its background, border, and shadow via the signal so the entire card flips at once.',
    ],
    starterCode: `<!-- tailwind-card.html -->
<!-- TODO: bind the outer div's classes to the darkMode signal -->
<div class="rounded-2xl border p-6 shadow-md transition-colors">

  <!-- TODO: toggle button — update darkMode signal on click -->
  <button class="mb-4 rounded-lg px-4 py-2 text-sm font-semibold text-white">
    Toggle Dark Mode
  </button>

  <!-- Profile section -->
  <!-- TODO: bind heading and paragraph text colours to darkMode signal -->
  <div class="flex items-center gap-4">
    <div class="h-14 w-14 rounded-full bg-indigo-500 flex items-center justify-center text-white text-xl font-bold">
      KA
    </div>
    <div>
      <h2 class="text-lg font-semibold">Karthik Akunuri</h2>
      <p class="text-sm">Angular Developer</p>
    </div>
  </div>

  <p class="mt-4 text-sm leading-relaxed">
    Building modern web apps with Angular 22 and Tailwind CSS.
  </p>

</div>`,
    solution: `<!-- tailwind-card.html (solution) -->
<div
  [class]="darkMode()
    ? 'rounded-2xl border border-gray-700 bg-gray-900 p-6 shadow-md transition-colors'
    : 'rounded-2xl border border-gray-200 bg-white p-6 shadow-md transition-colors'">

  <button
    [class]="darkMode()
      ? 'mb-4 rounded-lg bg-indigo-500 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-400'
      : 'mb-4 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700'"
    (click)="darkMode.set(!darkMode())">
    {{ darkMode() ? 'Switch to Light' : 'Switch to Dark' }}
  </button>

  <div class="flex items-center gap-4">
    <div class="h-14 w-14 rounded-full bg-indigo-500 flex items-center justify-center text-white text-xl font-bold">
      KA
    </div>
    <div>
      <h2
        [class]="darkMode() ? 'text-lg font-semibold text-white' : 'text-lg font-semibold text-gray-900'">
        Karthik Akunuri
      </h2>
      <p
        [class]="darkMode() ? 'text-sm text-gray-400' : 'text-sm text-gray-500'">
        Angular Developer
      </p>
    </div>
  </div>

  <p
    [class]="darkMode() ? 'mt-4 text-sm leading-relaxed text-gray-300' : 'mt-4 text-sm leading-relaxed text-gray-600'">
    Building modern web apps with Angular 22 and Tailwind CSS.
  </p>

</div>`,
  };
}
