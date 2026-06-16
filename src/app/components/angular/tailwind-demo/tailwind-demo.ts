import { Component, signal } from '@angular/core';
import { CodeBlockComponent, CodeTab } from '../../shared/code-block/code-block';
import { TheoryBlockComponent, TheoryPoint } from '../../shared/theory-block/theory-block';
import { QnaBlockComponent, QnaItem } from '../../shared/qna-block/qna-block';
import { QuizBlockComponent, QuizQuestion } from '../../shared/quiz-block/quiz-block';
import { ChallengeBlockComponent, Challenge } from '../../shared/challenge-block/challenge-block';
import { QuickRefComponent, QuickRefItem } from '../../shared/quick-ref/quick-ref';
import { BeforeAfterComponent, BeforeAfterExample } from '../../shared/before-after/before-after';
import { CommonMistakesComponent, CommonMistake } from '../../shared/common-mistakes/common-mistakes';
import { PageMetaComponent } from '../../shared/page-meta/page-meta';
import { PageCompleteComponent } from '../../shared/page-complete/page-complete';
import { RevisionCardComponent, RevisionSummary } from '../../shared/revision-card/revision-card';

@Component({
  selector: 'app-tailwind-demo',
  imports: [
    CodeBlockComponent, TheoryBlockComponent, QnaBlockComponent, QuizBlockComponent,
    ChallengeBlockComponent, QuickRefComponent, BeforeAfterComponent,
    CommonMistakesComponent, PageMetaComponent, PageCompleteComponent, RevisionCardComponent,
  ],
  templateUrl: './tailwind-demo.html',
  styleUrl: './tailwind-demo.scss',
})
export class TailwindDemo {
  darkMode  = signal(false);
  activeTab = signal(0);

  theory: TheoryPoint[] = [
    {
      heading: 'Utility-first CSS philosophy and the JIT engine',
      points: [
        'Instead of authoring named CSS classes in separate stylesheets, you compose small, single-purpose utility classes directly in HTML: <code>class="flex items-center gap-4 rounded-lg bg-indigo-600 px-4 py-2 text-white"</code>. No context-switching between files.',
        'Tailwind\'s Just-In-Time (JIT) engine (default since v3, further refined in v4) scans your source files and generates only the CSS classes that actually appear in those files. The output is tiny — often a few KB in production builds.',
        'The "purge" step that confused v2 users no longer exists as a separate phase; the JIT engine generates classes on-demand during development and emits the same minimal set in the production build automatically.',
        '<strong>Learning curve is front-loaded</strong>: memorise the naming convention once (<code>p-4</code> = padding 1rem, <code>text-sm</code> = font-size 0.875rem, <code>bg-red-500</code> = red background at shade 500) and every project looks the same.',
        'Arbitrary values escape the design system when needed: <code>w-[372px]</code>, <code>text-[13px]</code>, <code>bg-[#bada55]</code>. Use sparingly — they bypass the design token system but provide a safety valve for one-off values.',
      ],
    },
    {
      heading: 'Tailwind v4 setup in Angular 22',
      points: [
        'Tailwind v4 ships as a PostCSS plugin (<code>@tailwindcss/postcss</code>) instead of a standalone CLI. Install with: <code>npm install tailwindcss @tailwindcss/postcss postcss</code> and create <code>postcss.config.js</code>.',
        'Activation is a single line in <code>styles.scss</code>: <code>@import "tailwindcss";</code> — this replaces the old three-directive pattern (<code>@tailwind base; @tailwind components; @tailwind utilities;</code>).',
        'No <code>tailwind.config.js</code> is required in v4. Tailwind auto-discovers your template files through the PostCSS plugin and generates the necessary CSS. Custom configuration is done directly in CSS using <code>@theme</code> and CSS variables.',
        'Angular 22 uses Vite by default, which integrates naturally with Tailwind v4\'s PostCSS plugin. The build pipeline picks up <code>postcss.config.js</code> automatically — no Angular JSON configuration changes needed.',
        'Theming in v4 uses CSS custom properties: <code>@theme { --color-brand: #6366f1; }</code> in <code>styles.scss</code> makes <code>bg-brand</code>, <code>text-brand</code> available across the entire app. Override design tokens per-component using <code>:host { --spacing: 0.25rem; }</code>.',
      ],
    },
    {
      heading: 'Angular class binding patterns with Tailwind',
      points: [
        '<code>[class.bg-red-500]="hasError()"</code> toggles a single Tailwind class based on a boolean expression. This is the preferred pattern for one-class toggles — it keeps the full class string visible to Tailwind\'s file scanner.',
        '<code>[class]="isActive() ? \'bg-indigo-600 text-white\' : \'bg-gray-100 text-gray-600\'"</code> swaps between two complete class strings. Both full strings are present in the template source, so Tailwind includes them in the build output.',
        'Avoid <code>ngClass</code> with object notation when <code>[class.x]</code> bindings suffice — it requires importing <code>NgClass</code>, adds indirection, and makes class names harder for Tailwind to find in static analysis.',
        '<strong>Never build class names dynamically with concatenation</strong>: <code>\'text-\' + color</code> — Tailwind\'s scanner looks for complete strings, so concatenated classes are never found and get dropped from the output. Always write the complete class string.',
        'For signal-driven class lists, precompute the full set in a <code>computed()</code>: <code>cardClasses = computed(() => this.dark() ? \'bg-gray-900 text-white\' : \'bg-white text-gray-900\')</code>. The template then uses <code>[class]="cardClasses()"</code>.',
      ],
    },
    {
      heading: 'Responsive design — breakpoints and container queries',
      points: [
        'Tailwind is <strong>mobile-first</strong>: all utilities apply from 0px upward unless prefixed. <code>sm:</code> (640px), <code>md:</code> (768px), <code>lg:</code> (1024px), <code>xl:</code> (1280px), <code>2xl:</code> (1536px). A class without a prefix always applies.',
        '<code>class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"</code> produces 1 column on phones, 2 on tablets, and 3 on desktops — responsive layout without writing a single media query.',
        'Container queries (CSS <code>@container</code>) are supported in Tailwind v3.2+ via the <code>@tailwindcss/container-queries</code> plugin and natively in v4. Use <code>&#64;lg:grid-cols-3</code> to respond to the <em>parent container</em> rather than the viewport — critical in component-based Angular apps.',
        'Arbitrary breakpoints: <code>min-[900px]:flex</code> applies <code>display: flex</code> above 900 px. Useful for one-off layout thresholds that don\'t map to named breakpoints, without adding a value to the theme.',
        'Print utilities (<code>print:hidden</code>, <code>print:block</code>) use the <code>@media print</code> query. The <code>motion-safe:</code> and <code>motion-reduce:</code> variants respect the <code>prefers-reduced-motion</code> OS preference for animation utilities.',
      ],
    },
    {
      heading: 'Dark mode — class strategy with Angular signals',
      points: [
        'Tailwind supports two dark mode strategies: <code>media</code> (respects OS <code>prefers-color-scheme</code>) and <code>class</code> (activates when a <code>.dark</code> class is present on <code>&lt;html&gt;</code>). DevHub always uses the class strategy — <strong>never media</strong> — because the site toggles dark mode explicitly.',
        'Enable class strategy in Tailwind v4 with a one-liner in <code>styles.scss</code>: <code>@variant dark (&:where(.dark, .dark *));</code>. In v3, set <code>darkMode: \'class\'</code> in <code>tailwind.config.js</code>.',
        'Toggle dark mode in Angular: <code>dark = signal(false);</code> — on toggle call <code>document.documentElement.classList.toggle(\'dark\'); this.dark.update(v => !v);</code>. Persist preference to <code>localStorage</code> and restore in the app shell\'s constructor.',
        'Apply dark utilities by prefixing: <code>class="bg-white text-gray-900 dark:bg-gray-900 dark:text-white"</code>. Add <code>[class.dark]="dark()"</code> to <code>&lt;body&gt;</code> (or the host element) so Angular keeps the DOM in sync.',
        'In v4 with CSS variables theming, dark mode can be done by redefining tokens: <code>html.dark { @theme { --color-surface: #1a1a1a; } }</code>. Components using <code>bg-surface</code> automatically adapt without per-element <code>dark:</code> prefixes.',
      ],
    },
    {
      heading: '@apply, @layer, and managing styles alongside Tailwind',
      points: [
        '<code>@apply</code> extracts repeated utility combinations into a named CSS class: <code>.btn-primary { @apply rounded-lg bg-indigo-600 px-4 py-2 text-sm text-white hover:bg-indigo-700; }</code>. Use when a set of utilities is repeated across many template elements.',
        'Wrap custom classes in <code>@layer components { ... }</code> or <code>@layer utilities { ... }</code> so Tailwind controls cascade order. Without <code>@layer</code>, your custom class may win over utilities due to source order, causing confusing specificity bugs.',
        'Overuse of <code>@apply</code> recreates the class-abstraction problem that utility-first tries to solve. Reserve it for genuine design-system components (buttons, inputs, badges) — not for every div in a template.',
        '<strong>Avoid running Tailwind alongside Bootstrap or a global CSS reset</strong> — they conflict on element baseline styles. Tailwind\'s own <code>@layer base</code> provides a minimal Preflight reset; mixing it with Bootstrap\'s normalize.css causes double-resets and stacking context issues.',
        'When using Angular Material alongside Tailwind, either scope Tailwind utilities behind a CSS layer (<code>@layer tailwind-utilities { @import "tailwindcss/utilities"; }</code>) or use a Tailwind prefix (<code>tw-</code>) in the v3 config to prevent class name conflicts with Material\'s own styles.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Setup (v4)',
      language: 'typescript',
      code: `# Install Tailwind CSS v4 (PostCSS plugin)
npm install tailwindcss @tailwindcss/postcss postcss

# postcss.config.js
export default { plugins: { '@tailwindcss/postcss': {} } };

# styles.scss — one import activates Tailwind v4
@import "tailwindcss";

# For dark mode (class strategy):
@variant dark (&:where(.dark, .dark *));

# No tailwind.config.js needed — Tailwind v4 auto-discovers templates.
# Angular 22's default Vite build picks up postcss.config.js automatically.`,
    },
    {
      label: '[class] bindings',
      language: 'html',
      code: `<!-- Static utilities — included in output because full strings appear in source -->
<button class="rounded-lg bg-indigo-600 px-4 py-2 text-sm text-white hover:bg-indigo-700">
  Click me
</button>

<!-- Dynamic: ternary — both full strings are visible to Tailwind's scanner -->
<div [class]="isActive() ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'">
  Status
</div>

<!-- Single class toggle — preferred over ngClass for one condition -->
<div
  class="rounded-lg px-3 py-1 text-sm font-semibold"
  [class.bg-red-100]="hasError()"
  [class.text-red-700]="hasError()"
  [class.bg-green-100]="!hasError()"
  [class.text-green-700]="!hasError()">
  Badge
</div>

<!-- Computed signal for multiple dynamic classes -->
cardCls = computed(() =>
  this.selected() ? 'ring-2 ring-indigo-500 bg-indigo-50' : 'bg-white'
);
// template: <div [class]="cardCls()">`,
    },
    {
      label: 'Responsive + Dark',
      language: 'html',
      code: `<!-- Mobile-first breakpoints: sm:640 md:768 lg:1024 xl:1280 -->
<div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
  <!-- 1 col on mobile, 2 on sm+, 3 on lg+ — zero media queries in CSS -->
</div>

<!-- Dark mode: dark: prefix activates when .dark is on <html> -->
<div class="bg-white text-gray-900 dark:bg-gray-900 dark:text-white rounded-xl p-6">
  Adapts to dark mode
</div>

<!-- Angular component wiring: signal + DOM class toggle -->
export class AppComponent {
  dark = signal(false);

  toggle() {
    this.dark.update(v => !v);
    document.documentElement.classList.toggle('dark');
    localStorage.setItem('theme', this.dark() ? 'dark' : 'light');
  }
}

// Restore on load (in constructor or APP_INITIALIZER):
if (localStorage.getItem('theme') === 'dark') {
  document.documentElement.classList.add('dark');
}`,
    },
    {
      label: '@apply in SCSS',
      language: 'scss',
      code: `// styles.scss or component .scss
// @layer components keeps cascade order correct alongside Tailwind utilities

@layer components {
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
  }
}

// Use in template without repeating utilities everywhere:
// <button class="btn-primary">Save</button>
// <div class="card">...</div>`,
    },
    {
      label: 'v4 Theming',
      language: 'scss',
      code: `// Tailwind v4 theming — CSS variables replace tailwind.config.js
// In styles.scss:

@import "tailwindcss";

// Define custom design tokens
@theme {
  --color-brand:        #6366f1;
  --color-brand-light:  #818cf8;
  --color-brand-dark:   #4f46e5;
  --color-surface:      #ffffff;
  --font-sans:          'Inter', sans-serif;
  --spacing-card:       1.5rem;
}

// Dark mode token overrides
html.dark {
  @theme {
    --color-surface: #111827;
  }
}

// Now use in templates as Tailwind utilities:
// bg-brand       → background: var(--color-brand)
// text-brand-light
// bg-surface     → adapts automatically in dark mode

// Override per-component in host:
:host {
  --color-brand: #e11d48;  // override locally without touching global theme
}`,
    },
  ];

  quiz: QuizQuestion[] = [
    {
      q: 'Why should you avoid building Tailwind class names dynamically using string concatenation (e.g., `\'text-\' + color`)?',
      options: [
        'It causes runtime errors in Angular\'s change detection cycle',
        'Tailwind scans source files as plain text and won\'t include classes it never sees as complete strings',
        'Angular\'s AOT compiler strips dynamic string expressions from templates',
        'PostCSS cannot process class names that contain JavaScript variables',
      ],
      answer: 1,
      explanation: 'Tailwind generates its CSS by scanning source files for complete class name strings. If you concatenate parts of a class name at runtime, Tailwind never sees the full class during the build scan and omits it from the output bundle, producing a silent styling failure.',
    },
    {
      q: 'Which Angular binding syntax is preferred for toggling a single Tailwind class based on a signal?',
      options: [
        '[ngClass]="{\'bg-red-500\': hasError()}" — because ngClass is the official Angular directive for class toggling',
        '[style.background]="hasError() ? \'red\' : \'\'" — because inline styles always override utility classes',
        '[class.bg-red-500]="hasError()" — because it is explicit, tree-shakeable, and the full class string is visible to Tailwind\'s scanner',
        'class="{{hasError() ? \'bg-red-500\' : \'\'}}" — because interpolation is the most readable approach',
      ],
      answer: 2,
      explanation: 'The [class.bg-red-500] binding keeps the full class string visible in the template so Tailwind can detect and include it at build time. It is also more explicit than ngClass and does not require importing NgClass into the component.',
    },
    {
      q: 'What does the Tailwind class string `grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3` produce?',
      options: [
        'A 3-column grid on all screen sizes, collapsing to 1 column on mobile',
        'A 1-column grid on mobile, switching to 2 columns at 640 px and 3 columns at 1024 px',
        'A 2-column grid by default, growing to 3 columns above 1280 px',
        'A 1-column grid on mobile and a 3-column grid on all other screen sizes',
      ],
      answer: 1,
      explanation: 'Tailwind is mobile-first. The unprefixed `grid-cols-1` applies at all sizes, `sm:` activates at 640 px, and `lg:` activates at 1024 px, so the layout progresses 1 → 2 → 3 columns as the viewport widens. No CSS is written by hand.',
    },
    {
      q: 'What is the correct Angular pattern for toggling global dark mode that works with Tailwind\'s `dark:` class strategy?',
      options: [
        'Set a CSS variable `--theme: dark` on the root element and reference it in the theme config',
        'Use `@media (prefers-color-scheme: dark)` and let the browser handle it automatically',
        'Add a `darkMode` input to every component and pass it through the component tree',
        'Toggle `document.documentElement.classList.toggle(\'dark\')` and bind `[class.dark]` on the host element',
      ],
      answer: 3,
      explanation: 'Tailwind\'s class-based dark mode watches for a `.dark` class on the `<html>` element. Toggling it with `document.documentElement.classList.toggle(\'dark\')` activates all `dark:` prefixed utilities. A paired signal keeps Angular state in sync.',
    },
    {
      q: 'When should you use `@apply` in a component\'s SCSS file instead of repeating Tailwind utilities in every template?',
      options: [
        'Always — @apply is the recommended way to use Tailwind in Angular projects',
        'Never — @apply is deprecated in Tailwind v4 and should be replaced with CSS variables',
        'When the same set of utilities is reused across many elements and extracting them into a named class reduces template duplication',
        'Only when the component uses Angular Material, to avoid specificity conflicts',
      ],
      answer: 2,
      explanation: '@apply is best used to extract repeated utility combinations (like `.btn-primary` or `.card`) into a named CSS class, avoiding copying the same long list of utilities into every template element. Overusing it recreates the problem utility-first tries to solve.',
    },
    {
      q: 'How does Tailwind v4 differ from Tailwind v3 for Angular projects in terms of configuration?',
      options: [
        'v4 requires a separate `tailwind.config.ts` with TypeScript types; v3 used plain JS',
        'v4 uses a PostCSS plugin and CSS-based configuration (`@theme` blocks); no `tailwind.config.js` is required',
        'v4 removes PostCSS support and requires a webpack plugin instead',
        'v4 configuration is done in `angular.json` under the `styles` options object',
      ],
      answer: 1,
      explanation: 'Tailwind v4 is configured purely in CSS via `@theme { ... }` blocks in `styles.scss`. It installs as a PostCSS plugin (`@tailwindcss/postcss`) and auto-discovers template files — no `tailwind.config.js` is needed. v3 required a JS/TS config file to specify content paths and theme extensions.',
    },
    {
      q: 'What cascade layer should wrap custom `@apply` classes to avoid specificity conflicts with Tailwind utilities?',
      options: [
        '@layer base — because base styles have the highest specificity in Tailwind',
        '@layer reset — a special layer Tailwind sets up for overrides',
        '@layer components — so Tailwind controls cascade order and utilities can still override the component class',
        '@layer utilities — because custom classes need the same specificity as built-in Tailwind utilities',
      ],
      answer: 2,
      explanation: '@layer components sits below @layer utilities in Tailwind\'s cascade order. This means if you add a utility directly in the template (e.g., class="btn-primary p-8"), the direct utility `p-8` wins over anything @apply set inside the component class — the intended Tailwind behaviour.',
    },
  ];

  qna: QnaItem[] = [
    { q: 'Why can\'t you build class names dynamically in Tailwind?', a: 'Tailwind scans source files as plain text and generates a CSS file with only the classes it finds. If you build a class like <code>\'text-\' + color</code>, Tailwind never sees the full string and won\'t include that class in the output. Always write complete class strings in templates or data files.' },
    { q: 'How do you toggle Tailwind classes with Angular signals?', a: '<code>[class.bg-indigo-600]="isActive()"</code> or a ternary with <code>[class]="isActive() ? \'bg-indigo-600 text-white\' : \'bg-gray-100\'"</code>. Both work — the classes must appear as complete strings in the template for Tailwind to detect them. Avoid <code>ngClass</code> with computed keys for the same reason.' },
    { q: 'What is @apply in Tailwind?', a: '<code>@apply bg-indigo-600 text-white rounded-lg px-4 py-2;</code> extracts repeated utilities into a named class in your CSS. Wrap it in <code>@layer components { ... }</code> to maintain Tailwind\'s cascade order so direct utilities in the template can still override the applied class.' },
    { q: 'How do responsive prefixes work in Tailwind?', a: '<code>sm:</code>, <code>md:</code>, <code>lg:</code>, <code>xl:</code> are mobile-first breakpoints (640 / 768 / 1024 / 1280 px). <code>sm:grid-cols-2</code> means "apply <code>grid-cols-2</code> at screens ≥ 640 px". No prefix = applies to all screen sizes. Order utilities from smallest to largest breakpoint.' },
    { q: 'How does Tailwind\'s dark: variant work?', a: 'With the class strategy, Tailwind watches for a <code>.dark</code> class on <code>&lt;html&gt;</code>. When present, all <code>dark:</code>-prefixed classes activate. Toggle with: <code>document.documentElement.classList.toggle(\'dark\')</code>. Sync a signal alongside for reactive Angular bindings, and persist preference to <code>localStorage</code>.' },
    { q: 'How do you add custom colours to Tailwind v4?', a: 'In <code>styles.scss</code> use <code>@theme { --color-brand: #6366f1; }</code>. This creates <code>bg-brand</code>, <code>text-brand</code>, <code>border-brand</code> etc. automatically. For dark overrides: <code>html.dark { @theme { --color-brand: #818cf8; } }</code>. In v3 you used <code>theme.extend.colors</code> in <code>tailwind.config.js</code>.' },
    { q: 'How do you use Tailwind alongside Angular Material without style conflicts?', a: 'Two approaches: (1) Wrap Tailwind utilities in a CSS layer so Material wins on element styles: <code>@layer tw-utilities { @import "tailwindcss/utilities"; }</code>. (2) Use a Tailwind prefix (<code>tw-</code> in v3 config) so utility classes become <code>tw-bg-red-500</code> etc. and never collide with Material\'s own class names. Also disable Tailwind\'s Preflight base reset to avoid fighting Material\'s baseline.' },
  ];

  quickRef: QuickRefItem[] = [
    { name: '[class] binding', type: 'directive', desc: 'Dynamically sets one or more CSS classes on an element using an expression or ternary — keeps full class strings visible to Tailwind\'s scanner.', since: '2' },
    { name: '[class.x] binding', type: 'directive', desc: 'Toggles a single named CSS class conditionally based on a truthy expression, e.g. [class.bg-red-500]=\'hasError()\'.', since: '2' },
    { name: 'dark: prefix', type: 'directive', desc: 'Activates a utility only when .dark is on the html element (class strategy). e.g. dark:bg-gray-900 dark:text-white.' },
    { name: 'sm: md: lg: xl: 2xl:', type: 'directive', desc: 'Mobile-first breakpoint prefixes in Tailwind — apply a utility at a minimum viewport width (640 / 768 / 1024 / 1280 / 1536 px).' },
    { name: '@apply', type: 'syntax', desc: 'SCSS directive that extracts a set of Tailwind utilities into a named CSS class. Wrap in @layer components for correct cascade order.' },
    { name: '@layer components/utilities', type: 'syntax', desc: 'CSS cascade layer that controls specificity — @layer components is below @layer utilities so direct template utilities override component classes.' },
    { name: '@theme', type: 'syntax', desc: 'Tailwind v4 block in CSS for defining design tokens (colors, spacing, fonts). Replaces theme.extend in tailwind.config.js.' },
    { name: '@variant dark', type: 'syntax', desc: 'Tailwind v4 directive to register the dark mode variant: @variant dark (&:where(.dark, .dark *)); in styles.scss.' },
    { name: 'Arbitrary values', type: 'syntax', desc: 'Escape-hatch syntax for one-off values: w-[372px], text-[13px], bg-[#bada55]. Uses square brackets.' },
    { name: 'signal()', type: 'function', desc: 'Creates a reactive signal — pair with [class.x] or [class] bindings for reactive Tailwind class toggling without RxJS.', since: '16' },
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
      before: `// Imperative DOM manipulation only — Angular has no state
toggleDark() {
  document.documentElement
    .classList.toggle('dark');
}`,
      after: `dark = signal(false);
toggle() {
  this.dark.update(v => !v);
  document.documentElement.classList.toggle('dark');
  localStorage.setItem('theme', this.dark() ? 'dark' : 'light');
}
// Template: [class.dark]="dark()" on host/body`,
      note: 'Pairing a signal with the DOM class keeps Angular reactive state in sync with the Tailwind dark variant and supports persistence.',
    },
    {
      title: 'Repeated utilities: inline vs @apply extraction',
      before: `<button class="rounded-lg bg-indigo-600 px-4 py-2
  text-sm font-semibold text-white
  hover:bg-indigo-700 disabled:opacity-50">
  Save
</button>
<!-- Same 8 utilities repeated on every button -->`,
      after: `// @layer components keeps cascade order correct
@layer components {
  .btn-primary {
    @apply rounded-lg bg-indigo-600 px-4 py-2
      text-sm font-semibold text-white
      hover:bg-indigo-700 disabled:opacity-50;
  }
}
// Template: <button class="btn-primary">Save</button>`,
      note: '@apply in @layer components extracts repeated utility sets into a named class without losing the ability to override with direct utilities.',
    },
  ];

  mistakes: CommonMistake[] = [
    {
      title: 'Building Tailwind class names with string concatenation',
      wrong: `// Tailwind never sees 'text-red-500' as a full string
const color = 'red-500';
// template: [class]="'text-' + color"`,
      right: `// Write complete class strings so Tailwind's scanner finds them
[class]="hasError() ? 'text-red-500' : 'text-gray-700'"`,
      explanation: 'Tailwind scans source files as plain text at build time. Concatenated class names are never seen as complete strings, so Tailwind omits them from the output bundle — producing a silent styling failure in production.',
    },
    {
      title: 'Hiding class names inside object maps so Tailwind\'s scanner misses them',
      wrong: `// Classes hidden inside a TS map — Tailwind may miss them
statusCls = { active: 'bg-green', error: 'bg-red' };
// template: [class]="statusCls[state]"`,
      right: `// Use a ternary or [class.x] so full strings appear in source
[class]="state === 'active' ? 'bg-green-100' : 'bg-red-100'"`,
      explanation: 'Tailwind scans templates for complete class name strings. If classes are only referenced through object property lookups with variable keys, they may not appear literally in any source file and get purged from the production bundle.',
    },
    {
      title: 'Using NgClass when [class.x] bindings suffice',
      wrong: `import { NgClass } from '@angular/common';
// template: [ngClass]="{ 'bg-red-500': err(), 'text-white': err() }"`,
      right: `<div
  [class.bg-red-500]="err()"
  [class.text-white]="err()">`,
      explanation: 'NgClass requires an import and adds indirection. Multiple [class.x] bindings are explicit, tree-shakeable, and keep class strings visible to Tailwind\'s scanner as literal text in the template.',
    },
    {
      title: 'Omitting @layer when adding custom classes alongside Tailwind utilities',
      wrong: `// styles.scss — custom class may win over utilities due to source order
.card {
  @apply rounded-2xl bg-white p-6;
}`,
      right: `@layer components {
  .card {
    @apply rounded-2xl bg-white p-6;
  }
}`,
      explanation: 'Wrapping custom classes in @layer components ensures Tailwind controls the cascade order. Without @layer, a utility class applied directly in the template (like p-8) might lose to the component class depending on source order.',
    },
    {
      title: 'Not disabling Tailwind Preflight when using Angular Material',
      wrong: `// styles.scss
@import "tailwindcss";
/* Tailwind's Preflight reset fights Material's baseline styles —
   double border-box, different outline styles, broken :focus rings */`,
      right: `// Import base and utilities but skip Preflight (base layer):
@import "tailwindcss/utilities";
@import "tailwindcss/components";
/* Or in v4: suppress just the base layer:
   @import "tailwindcss" layer(utilities, components); */`,
      explanation: 'Tailwind\'s Preflight reset and Angular Material both set baseline element styles. They conflict on inputs, buttons, and focus rings. Skip Preflight and import only utilities/components when using both libraries together.',
    },
  ];

  challenge: Challenge = {
    title: 'Dark Mode Card with Signal Toggle',
    description: 'Build a self-contained Angular component that displays a profile card. The card must respond to a `darkMode` signal: when dark mode is active the card should use dark backgrounds and light text. Use Tailwind utility classes directly in the template along with `[class]` or `[class.x]` bindings driven by the signal. Add a toggle button inside the card that flips the signal. Do NOT build class names with string concatenation.',
    language: 'typescript',
    hints: [
      'Use `[class]` binding with a ternary to swap between two full class strings, e.g. `[class]="darkMode() ? \'bg-gray-900 text-white\' : \'bg-white text-gray-900\'"`.',
      'The toggle button itself can use `[class.bg-indigo-500]="darkMode()"` and `[class.bg-indigo-600]="!darkMode()"` to reflect the current state.',
      'Remember: write every Tailwind class as a complete string — never concatenate prefixes like `\'bg-\' + color`.',
      'Wrap the whole card in a `<div>` that changes its background, border, and shadow via the signal so the entire card flips at once.',
    ],
    starterCode: `// tailwind-card.ts
import { Component, signal } from '@angular/core';

@Component({
  selector: 'app-tailwind-card',
  standalone: true,
  template: \`
    <!-- TODO: bind the outer div's classes to the darkMode signal -->
    <div class="rounded-2xl border p-6 shadow-md transition-colors max-w-sm">

      <!-- TODO: toggle button — update darkMode signal on click -->
      <button class="mb-4 rounded-lg px-4 py-2 text-sm font-semibold text-white">
        Toggle Dark Mode
      </button>

      <!-- Profile section -->
      <div class="flex items-center gap-4">
        <div class="h-14 w-14 rounded-full bg-indigo-500 flex items-center justify-center text-white text-xl font-bold">
          KA
        </div>
        <div>
          <!-- TODO: bind heading and paragraph text colours to darkMode signal -->
          <h2 class="text-lg font-semibold">Karthik Akunuri</h2>
          <p class="text-sm">Angular Developer</p>
        </div>
      </div>

      <p class="mt-4 text-sm leading-relaxed">
        Building modern web apps with Angular 22 and Tailwind CSS.
      </p>
    </div>
  \`,
})
export class TailwindCardComponent {
  darkMode = signal(false);
  // TODO: implement toggle
}`,
    solution: `// tailwind-card.ts (solution)
import { Component, signal } from '@angular/core';

@Component({
  selector: 'app-tailwind-card',
  standalone: true,
  template: \`
    <div
      [class]="darkMode()
        ? 'rounded-2xl border border-gray-700 bg-gray-900 p-6 shadow-md transition-colors max-w-sm'
        : 'rounded-2xl border border-gray-200 bg-white p-6 shadow-md transition-colors max-w-sm'">

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
            [class]="darkMode()
              ? 'text-lg font-semibold text-white'
              : 'text-lg font-semibold text-gray-900'">
            Karthik Akunuri
          </h2>
          <p
            [class]="darkMode() ? 'text-sm text-gray-400' : 'text-sm text-gray-500'">
            Angular Developer
          </p>
        </div>
      </div>

      <p
        [class]="darkMode()
          ? 'mt-4 text-sm leading-relaxed text-gray-300'
          : 'mt-4 text-sm leading-relaxed text-gray-600'">
        Building modern web apps with Angular 22 and Tailwind CSS.
      </p>
    </div>
  \`,
})
export class TailwindCardComponent {
  darkMode = signal(false);
}`,
  };

  revision: RevisionSummary = {
    oneLiner: 'Tailwind CSS is a utility-first CSS framework where you compose small, single-purpose classes directly in HTML. With Angular, the key patterns are [class.x] bindings for reactive class toggling, the class dark-mode strategy paired with a signal, and @layer components for @apply extraction.',
    mustKnow: [
      'Tailwind scans source files as plain text — NEVER concatenate class names dynamically (<code>\'text-\' + color</code>); always write complete class strings',
      '<code>[class.bg-red-500]="hasError()"</code> is preferred over ngClass for single-class toggles — full string visible to scanner, no import needed',
      'Tailwind v4 setup: <code>npm install tailwindcss @tailwindcss/postcss postcss</code>, add <code>@import "tailwindcss";</code> to <code>styles.scss</code>, no config file needed',
      'Mobile-first breakpoints: <code>sm:</code> 640px, <code>md:</code> 768px, <code>lg:</code> 1024px — unprefixed class applies at all sizes',
      'Dark mode (class strategy): toggle <code>document.documentElement.classList.toggle(\'dark\')</code> + sync a signal; use <code>dark:</code> prefix in templates',
      '<code>@layer components { .btn { @apply ...; } }</code> — @layer ensures Tailwind cascade order so direct utilities can override component classes',
      'v4 theming uses CSS variables in <code>@theme { --color-brand: #6366f1; }</code> — replaces <code>tailwind.config.js</code> theme.extend',
    ],
    interviewFocus: [
      'Why does Tailwind miss dynamically concatenated class names, and how do you work around it?',
      'What is the difference between mobile-first and desktop-first in Tailwind breakpoints?',
      'How do you implement dark mode in Angular with Tailwind\'s class strategy, and how is it different from the media strategy?',
      'When should you use @apply, and what cascade layer should it go in?',
      'How do you prevent conflicts between Tailwind and Angular Material?',
    ],
  };
}
