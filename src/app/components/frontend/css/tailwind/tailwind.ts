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
  { name: 'flex / grid / block / hidden',  type: 'keyword', desc: 'Display utilities: flex, grid, block, inline-block, hidden (display:none).' },
  { name: 'p-4 / px-4 / py-2 / pt-1',     type: 'keyword', desc: 'Padding: p-4=1rem all sides, px-4=horizontal, py-2=vertical, pt-1=top only.' },
  { name: 'mt-4 / mb-2 / mx-auto',         type: 'keyword', desc: 'Margin: mt-4=margin-top 1rem, mx-auto=horizontal auto (centering).' },
  { name: 'text-sm / text-xl / font-bold', type: 'keyword', desc: 'Typography: text-sm=0.875rem, text-xl=1.25rem, font-bold=font-weight:700.' },
  { name: 'bg-blue-500 / text-white',      type: 'keyword', desc: 'Colors: bg-blue-500=background, text-white=color. Scale 50–950.' },
  { name: 'rounded / rounded-lg / rounded-full', type: 'keyword', desc: 'Border radius: rounded=4px, rounded-lg=8px, rounded-full=9999px.' },
  { name: 'hover:bg-blue-600 / focus:ring', type: 'keyword', desc: 'State variants: hover:, focus:, active:, disabled:, group-hover:.' },
  { name: 'md:flex / lg:grid-cols-3',      type: 'keyword', desc: 'Responsive variants: sm:, md:, lg:, xl:, 2xl: — mobile-first min-width.' },
  { name: 'dark:bg-gray-900',              type: 'keyword', desc: 'Dark mode variant: applies when .dark class is on html (class strategy).' },
  { name: '@apply',                        type: 'keyword', desc: 'Extract repeated utility combinations into a CSS class: .btn { @apply px-4 py-2 bg-blue-500 text-white rounded; }' },
];

const theory: TheoryPoint[] = [
  {
    heading: 'Utility-First CSS',
    points: [
      'Tailwind provides atomic utility classes — each class does exactly one thing: p-4 adds padding, text-blue-500 sets color, flex enables flexbox.',
      'Instead of writing custom CSS, you compose utilities directly in HTML: <button class="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">.',
      'The build step (JIT — Just In Time) scans your HTML/JS/templates and generates CSS only for the classes you actually use — production bundles are typically 5–15 kB.',
      'The design constraint is the feature: Tailwind\'s predefined scale (spacing 0–96, color palette 50–950) enforces consistency without a design system document.',
      'Tailwind does not replace CSS — it generates utility CSS. You still write custom CSS for complex animations, generated content (::before), and unique one-off styles.',
    ],
  },
  {
    heading: 'Configuration and Customisation',
    points: [
      'tailwind.config.ts: extend the theme to add brand colors, custom spacing, or custom fonts without overwriting defaults.',
      'content: array tells Tailwind where to scan for class names — if a file is missing, its classes won\'t appear in the output.',
      'Plugins: add custom utility classes, components, or base styles via the plugins array (e.g. @tailwindcss/forms, @tailwindcss/typography).',
      'Arbitrary values: use square-bracket syntax for one-off values: top-[117px], text-[#264de4], grid-cols-[1fr_2fr_1fr].',
      'CSS variables in Tailwind 4: the config moves to CSS — @theme { --color-primary: #264de4; } — no tailwind.config.ts needed.',
    ],
  },
  {
    heading: 'Variants, Dark Mode, and @apply',
    points: [
      'Variants prefix utilities: hover:bg-blue-600, focus:ring-2, disabled:opacity-50, md:flex, lg:grid-cols-3.',
      'Responsive variants are mobile-first: md:flex means "apply flex at md breakpoint and above" (min-width: 768px).',
      'Dark mode: two strategies — class (dark: prefix applies when html has .dark class) or media (responds to prefers-color-scheme).',
      '@apply extracts repeated utility groups into a CSS class — use sparingly for truly reused patterns like .btn or .card, not for one-off elements.',
      'group and peer utilities: group-hover:text-white applies to children when the group parent is hovered. peer-checked:block applies to siblings.',
    ],
  },
  {
    heading: 'Utility-First CSS Philosophy',
    points: [
      'Tailwind\'s utility-first approach applies single-purpose classes (p-4, flex, text-center) directly in markup rather than writing custom semantic CSS classes — trading traditional CSS/HTML separation for colocation of styling decisions directly alongside the markup they affect.',
      'This colocation eliminates a common maintenance problem in traditional CSS: unused, orphaned CSS rules that accumulate over time as components are modified or removed, since Tailwind\'s build process can tree-shake to only the utility classes actually referenced in the codebase.',
      'Design system consistency is enforced through Tailwind\'s configuration (a constrained set of spacing, color, and typography scale values) rather than through developer discipline alone — developers select from predefined design tokens rather than writing arbitrary pixel or color values freely.',
      'The tradeoff for utility-first is markup verbosity — a component with many utility classes can become visually noisy in the HTML/JSX, which Tailwind addresses partly through component extraction (wrapping repeated utility combinations in a reusable component) rather than CSS-level abstraction.',
    ],
  },
  {
    heading: 'When Tailwind Fits and When It Does Not',
    points: [
      'Tailwind excels for rapid UI development within a component-based framework (React, Vue, Angular) where component extraction naturally handles reducing utility class repetition — the component becomes the reusable unit, not a custom CSS class.',
      'Teams transitioning from traditional semantic CSS (BEM, CSS Modules) to Tailwind should expect a genuine mental model shift — styling decisions move from "define a reusable class with meaning" to "compose a specific look from atomic utilities," which some developers find faster and others find less intuitive.',
      'Tailwind\'s generated CSS bundle, when properly configured with content-based purging, is typically smaller than an equivalent hand-written CSS codebase for the same UI, since unused utility combinations are never generated at all — a genuine, measurable production performance advantage.',
      'For highly custom, design-heavy interfaces with unique, non-repeating visual treatments, the utility-first approach can feel less natural than component-scoped custom CSS — Tailwind\'s value is strongest for interfaces built from a consistent, repeatable design system with well-defined constraints.',
    ],
  },
];

const codeTabs: CodeTab[] = [
  {
    label: 'Core Utilities',
    language: 'html',
    code: `<!-- Card with Tailwind utilities -->
<div class="bg-white border border-gray-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
  <div class="flex items-center gap-3 mb-4">
    <div class="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
      <span class="text-blue-600 font-bold text-sm">AK</span>
    </div>
    <div>
      <p class="font-semibold text-gray-900 text-sm">Ajk Karthik</p>
      <p class="text-gray-500 text-xs">Frontend Developer</p>
    </div>
  </div>
  <p class="text-gray-600 text-sm leading-relaxed mb-4">
    Building scalable design systems with modern CSS.
  </p>
  <div class="flex gap-2">
    <button class="px-3 py-1.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors">
      Follow
    </button>
    <button class="px-3 py-1.5 border border-gray-200 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors">
      Message
    </button>
  </div>
</div>`,
  },
  {
    label: 'Responsive + Dark Mode',
    language: 'html',
    code: `<!-- Mobile-first responsive grid with dark mode -->
<div class="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 md:p-8">

  <!-- Responsive hero -->
  <section class="text-center md:text-left mb-12">
    <h1 class="text-3xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">
      Build faster with Tailwind
    </h1>
    <p class="text-gray-600 dark:text-gray-400 text-lg max-w-xl md:mx-0 mx-auto">
      Utility-first CSS framework for rapidly building custom designs.
    </p>
  </section>

  <!-- Responsive card grid: 1 col → 2 col → 3 col -->
  <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
    <div class="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm
                border border-gray-100 dark:border-gray-700">
      <div class="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-lg mb-4
                  flex items-center justify-center">
        <span class="text-blue-600 dark:text-blue-400 text-sm font-bold">01</span>
      </div>
      <h3 class="font-semibold text-gray-900 dark:text-white mb-2">Fast Setup</h3>
      <p class="text-gray-500 dark:text-gray-400 text-sm">
        Zero config, JIT, tiny production bundles.
      </p>
    </div>
    <!-- More cards... -->
  </div>
</div>`,
  },
  {
    label: 'Variants & @apply',
    language: 'css',
    code: `/* tailwind.config.ts — extend the theme */
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{html,ts,tsx}'],
  darkMode: 'class',  /* or 'media' */
  theme: {
    extend: {
      colors: {
        brand: {
          50:  '#eff6ff',
          500: '#264de4',
          600: '#1d3db8',
          900: '#1e3a8a',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        '4xl': '2rem',
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/typography'),
  ],
};

/* styles.css — @apply for reusable component patterns */
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer components {
  /* Extract repeated utility combos into semantic classes */
  .btn {
    @apply inline-flex items-center justify-center gap-2
           px-4 py-2 rounded-lg font-medium text-sm
           transition-colors focus-visible:outline-none
           focus-visible:ring-2 focus-visible:ring-offset-2
           disabled:opacity-50 disabled:pointer-events-none;
  }

  .btn-primary {
    @apply btn bg-brand-500 text-white hover:bg-brand-600
           focus-visible:ring-brand-500;
  }

  .card {
    @apply bg-white dark:bg-gray-800 rounded-xl border
           border-gray-100 dark:border-gray-700 p-6 shadow-sm;
  }
}`,
  },
  {
    label: 'group / peer / arbitrary',
    language: 'html',
    code: `<!-- group: parent hover affects children -->
<div class="group relative cursor-pointer">
  <img src="/product.jpg" class="rounded-lg w-full" alt="">
  <!-- Only visible on group hover -->
  <div class="absolute inset-0 bg-black/50 rounded-lg
              opacity-0 group-hover:opacity-100 transition-opacity
              flex items-center justify-center">
    <button class="px-4 py-2 bg-white text-gray-900 rounded-lg font-medium
                   group-hover:scale-100 scale-95 transition-transform">
      Quick View
    </button>
  </div>
</div>

<!-- peer: sibling state affects other sibling -->
<label class="flex items-center gap-3 cursor-pointer">
  <input type="checkbox" class="peer sr-only">
  <div class="w-5 h-5 rounded border border-gray-300
              peer-checked:bg-blue-600 peer-checked:border-blue-600
              transition-colors flex items-center justify-center">
    <svg class="hidden peer-checked:block w-3 h-3 text-white" ...></svg>
  </div>
  <span class="text-gray-700 peer-checked:text-blue-600 peer-checked:font-medium">
    Agree to terms
  </span>
</label>

<!-- Arbitrary values for one-off dimensions -->
<div class="top-[117px] left-[calc(50%-2rem)] w-[clamp(200px,50%,480px)]
            bg-[#264de4] text-[0.9375rem] grid-cols-[1fr_auto_1fr]">
  Arbitrary values with bracket syntax
</div>`,
  },
];

const mistakes: CommonMistake[] = [
  {
    title: 'Forgetting to add files to the content array',
    wrong: `// tailwind.config.ts
content: ['./src/**/*.html']
// Missing .ts files — Angular component classes not scanned`,
    right: `// tailwind.config.ts
content: ['./src/**/*.{html,ts}']
// Scans both HTML templates and TypeScript for class names`,
    explanation: 'Tailwind JIT only generates CSS for classes it finds in the scanned files. If .ts files are excluded, any utility classes added dynamically via TypeScript (e.g. conditional classes in Angular templates) will not appear in the output.',
  },
  {
    title: 'Using @apply for everything instead of just reusable patterns',
    wrong: `/* Over-using @apply — defeats the purpose of utility-first */
.hero-title {
  @apply text-4xl font-bold text-gray-900 mb-6 leading-tight tracking-tight;
}`,
    right: `<!-- Keep utilities in HTML for one-off styles -->
<h1 class="text-4xl font-bold text-gray-900 mb-6 leading-tight tracking-tight">

/* Use @apply only for genuinely reused patterns */
.btn-primary { @apply px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700; }`,
    explanation: '@apply is meant for extracting truly reused patterns like buttons, badges, and form inputs — not for every element. Overusing it recreates the problem Tailwind solves (scattered CSS that is hard to trace) and loses the co-location benefit.',
  },
  {
    title: 'Building class names dynamically with string concatenation',
    wrong: `// Angular — dynamic class string is not scanned by Tailwind JIT
const color = 'blue';
const cls = \`bg-\${color}-500\`;  // 'bg-blue-500' never appears in source — not generated`,
    right: `// Use complete class names — Tailwind scans for string literals
const classes = {
  blue:  'bg-blue-500',
  red:   'bg-red-500',
  green: 'bg-green-500',
};
const cls = classes[color];  // full class name present in source`,
    explanation: 'Tailwind JIT scans source files for complete class name strings. Dynamically constructed class names (bg-${color}-500) are never found and therefore never generated. Always use full class name strings in lookup objects or conditional expressions.',
  },
  {
    title: 'Using arbitrary values for everything instead of the design scale',
    wrong: `<!-- Bypassing the design system with arbitrary values -->
<div class="text-[14.5px] mt-[23px] p-[11px] rounded-[5px]">`,
    right: `<!-- Use the built-in scale — it enforces consistency -->
<div class="text-sm mt-6 p-3 rounded">
<!-- If a value is genuinely needed, use arbitrary — but question it first -->`,
    explanation: 'Tailwind\'s predefined scale (text-sm=14px, mt-6=24px, p-3=12px) enforces design consistency. Arbitrary values are escape hatches for genuine one-off needs. Reaching for arbitrary values for standard spacings means you are working against the design system.',
  },
];

const challenge: Challenge = {
  title: 'Build a Pricing Card with Tailwind',
  language: 'html',
  description: 'Build a pricing card using only Tailwind utilities (no custom CSS). Requirements: (1) Three-tier layout: Free, Pro (highlighted), Enterprise. (2) The Pro card should be visually elevated: blue background, white text, larger scale or shadow ring. (3) Feature list with checkmarks using flex. (4) A CTA button per card. (5) Responsive: stacked on mobile, 3-column on md:. (6) Dark mode: dark:bg-gray-800 for Free/Enterprise cards.',
  hints: [
    'Use ring-2 ring-blue-500 ring-offset-2 on the Pro card instead of a border to elevate it.',
    'For the checkmark icons, use ✓ in a span with text-green-500 or text-white depending on the card.',
    'md:grid-cols-3 on the wrapper gives you 3 columns at medium breakpoints.',
    'Use -mt-4 or scale-105 on the Pro card to make it visually pop above the others.',
  ],
  starterCode: `<!-- Pricing cards wrapper -->
<div class="grid grid-cols-1 gap-6 p-8 max-w-5xl mx-auto">

  <!-- Free Card -->
  <div class="">
    <h3 class="">Free</h3>
    <!-- Add price, features, CTA -->
  </div>

  <!-- Pro Card (highlighted) -->
  <div class="">
    <h3 class="">Pro</h3>
  </div>

  <!-- Enterprise Card -->
  <div class="">
    <h3 class="">Enterprise</h3>
  </div>

</div>`,
  solution: `<div class="grid grid-cols-1 md:grid-cols-3 gap-6 p-8 max-w-5xl mx-auto items-start">

  <!-- Free Card -->
  <div class="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700
              rounded-2xl p-6 flex flex-col gap-6">
    <div>
      <h3 class="text-lg font-semibold text-gray-900 dark:text-white">Free</h3>
      <p class="text-4xl font-bold text-gray-900 dark:text-white mt-2">$0
        <span class="text-base font-normal text-gray-500">/mo</span>
      </p>
    </div>
    <ul class="flex flex-col gap-3 text-sm text-gray-600 dark:text-gray-300">
      <li class="flex items-center gap-2"><span class="text-green-500 font-bold">✓</span>5 projects</li>
      <li class="flex items-center gap-2"><span class="text-green-500 font-bold">✓</span>1 GB storage</li>
      <li class="flex items-center gap-2"><span class="text-gray-300">✗</span>Priority support</li>
    </ul>
    <button class="mt-auto w-full py-2.5 border border-gray-200 dark:border-gray-600
                   text-gray-700 dark:text-gray-200 rounded-xl font-medium
                   hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
      Get started
    </button>
  </div>

  <!-- Pro Card (elevated) -->
  <div class="bg-blue-600 rounded-2xl p-6 flex flex-col gap-6 shadow-xl
              ring-4 ring-blue-600 ring-offset-2 md:-mt-4 md:mb-4">
    <div>
      <span class="text-xs font-semibold text-blue-200 uppercase tracking-wider">Most Popular</span>
      <h3 class="text-lg font-semibold text-white mt-1">Pro</h3>
      <p class="text-4xl font-bold text-white mt-2">$12
        <span class="text-base font-normal text-blue-200">/mo</span>
      </p>
    </div>
    <ul class="flex flex-col gap-3 text-sm text-blue-100">
      <li class="flex items-center gap-2"><span class="text-white font-bold">✓</span>Unlimited projects</li>
      <li class="flex items-center gap-2"><span class="text-white font-bold">✓</span>50 GB storage</li>
      <li class="flex items-center gap-2"><span class="text-white font-bold">✓</span>Priority support</li>
    </ul>
    <button class="mt-auto w-full py-2.5 bg-white text-blue-600 rounded-xl font-semibold
                   hover:bg-blue-50 transition-colors">
      Start free trial
    </button>
  </div>

  <!-- Enterprise Card -->
  <div class="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700
              rounded-2xl p-6 flex flex-col gap-6">
    <div>
      <h3 class="text-lg font-semibold text-gray-900 dark:text-white">Enterprise</h3>
      <p class="text-4xl font-bold text-gray-900 dark:text-white mt-2">Custom</p>
    </div>
    <ul class="flex flex-col gap-3 text-sm text-gray-600 dark:text-gray-300">
      <li class="flex items-center gap-2"><span class="text-green-500 font-bold">✓</span>Unlimited everything</li>
      <li class="flex items-center gap-2"><span class="text-green-500 font-bold">✓</span>SLA guarantee</li>
      <li class="flex items-center gap-2"><span class="text-green-500 font-bold">✓</span>Dedicated support</li>
    </ul>
    <button class="mt-auto w-full py-2.5 border border-gray-200 dark:border-gray-600
                   text-gray-700 dark:text-gray-200 rounded-xl font-medium
                   hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
      Contact sales
    </button>
  </div>

</div>`,
};

const quiz: QuizQuestion[] = [
  {
    q: 'What does Tailwind\'s JIT (Just In Time) engine do?',
    options: [
      'Generates all possible utility classes upfront',
      'Scans your source files and generates CSS only for classes actually used',
      'Compiles Tailwind utilities to inline styles',
      'Replaces PostCSS with a faster compiler',
    ],
    answer: 1,
    explanation: 'JIT scans your content files for class names and generates CSS only for those classes. This makes production bundles tiny (5–15 kB) compared to the full Tailwind CSS which is several megabytes.',
  },
  {
    q: 'What is the correct way to use a custom one-off value in Tailwind?',
    options: [
      'Write a custom CSS class and @apply the utilities',
      'Use square-bracket arbitrary value syntax: top-[117px]',
      'Add it to theme.extend in tailwind.config.ts',
      'Use a CSS variable with var(--custom)',
    ],
    answer: 1,
    explanation: 'Arbitrary values use square-bracket syntax: top-[117px], text-[#264de4], w-[clamp(200px,50%,600px)]. This is the escape hatch for one-off values that don\'t belong in the design scale.',
  },
  {
    q: 'Which Tailwind class applies a style only at the md breakpoint and above?',
    options: [
      '@md:flex',
      'flex-md',
      'md:flex',
      'breakpoint-md:flex',
    ],
    answer: 2,
    explanation: 'Responsive variants prefix the utility: md:flex applies display:flex at min-width: 768px (the md breakpoint) and above. Tailwind is mobile-first — md:flex means "md and larger", not "md only".',
  },
  {
    q: 'Why should you avoid building Tailwind class names dynamically (e.g. `bg-${color}-500`)?',
    options: [
      'It causes runtime errors in JavaScript',
      'Dynamic strings are not scanned by JIT — the class is never generated',
      'Tailwind does not support template literals',
      'It increases bundle size significantly',
    ],
    answer: 1,
    explanation: 'Tailwind JIT scans source files as text and looks for complete class name strings. A dynamically constructed string like `bg-${color}-500` is never seen as a complete class name and therefore the CSS is never generated. Use full class name strings in lookup objects.',
  },
  {
    q: 'When should you use @apply?',
    options: [
      'For every component to keep HTML clean',
      'Only for genuinely reused patterns like .btn and .card — not for one-off styles',
      'Whenever a utility class is used more than once on a page',
      'For all responsive utilities to avoid long class strings in HTML',
    ],
    answer: 1,
    explanation: '@apply extracts repeated utility combinations into a CSS class. Use it for truly reused design patterns (.btn, .card, .badge) where the same combination appears across many components. Using it everywhere recreates scattered CSS and loses the co-location benefit of utility-first CSS.',
  },
  {
    q: 'What does the group-hover: variant enable?',
    options: [
      'Applies a style when any element in a group is hovered',
      'Applies a style to child elements when the group parent is hovered',
      'Groups multiple hover states into one declaration',
      'Applies hover styles to elements inside a CSS grid',
    ],
    answer: 1,
    explanation: 'Add class="group" to a parent element, then use group-hover: on children. When the parent is hovered, group-hover: styles apply to the marked children. This enables overlay effects, icon color changes, and reveal patterns without JavaScript.',
  },
];

const qna: QnaItem[] = [
  {
    q: 'How do I set up dark mode with Tailwind?',
    a: 'Two strategies: (1) class strategy — add darkMode: "class" to tailwind.config.ts. Dark mode activates when html has a .dark class. Toggle it with JS. Use dark: prefix: dark:bg-gray-900. (2) media strategy — dark: prefix responds to prefers-color-scheme: dark automatically. The class strategy is preferred for sites with a manual dark/light toggle; media is simpler for automatic system-preference-only dark mode.',
  },
  {
    q: 'Does Tailwind work with Angular?',
    a: 'Yes — install Tailwind v3+ with npm install -D tailwindcss postcss autoprefixer, then run npx tailwindcss init. Set content in tailwind.config.ts to include src/**/*.{html,ts}. Add @tailwind base/components/utilities to styles.scss. Angular\'s build pipeline (esbuild via ng build) picks up PostCSS automatically. For Tailwind v4, use the Vite plugin or the standalone CLI.',
  },
  {
    q: 'What is the difference between Tailwind v3 and v4?',
    a: 'Tailwind v4 (2025): configuration moves to CSS (@theme in a CSS file, no tailwind.config.ts needed), the build is dramatically faster (Rust-based Oxide engine), and arbitrary properties are simpler. v3 uses tailwind.config.ts for configuration and PostCSS for the build. v4 also introduces a new CSS-first API for plugins. For new projects, prefer v4; for existing v3 projects, migration is straightforward but not required.',
  },
  {
    q: 'How do I add custom components to Tailwind?',
    a: 'Three options: (1) @layer components { .btn { @apply ... } } in your CSS — adds to Tailwind\'s component layer. (2) A Tailwind plugin in tailwind.config.ts: plugins: [plugin(({ addComponents }) => addComponents({ ".btn": { ... } }))] — programmatic and theme-aware. (3) Just write the utilities in HTML and extract with @apply only when the pattern repeats across 3+ places.',
  },
  {
    q: 'Can I use Tailwind with CSS custom properties (variables)?',
    a: 'Yes — Tailwind v3 generates CSS variables for theme values: --tw-shadow, --tw-ring-color, etc. You can also define your own variables in @layer base { :root { --brand: #264de4; } } and reference them in arbitrary values: text-[var(--brand)]. In Tailwind v4, the entire theme is CSS variables by default and you define your design tokens in a @theme block.',
  },
  {
    q: 'Is Tailwind just inline styles?',
    a: 'No — Tailwind generates real CSS classes in a stylesheet, not inline styles. The distinction matters: (1) Tailwind classes can use pseudo-classes (:hover, :focus), pseudo-elements (::before), and at-rules (@media, @container) — inline styles cannot. (2) Specificity is standard class specificity (0,1,0). (3) The browser caches the stylesheet. Tailwind is a utility-first CSS methodology that happens to look like inline styles in HTML — but it is regular CSS.',
  },
];

const revision: RevisionSummary = {
  oneLiner: 'Tailwind CSS is utility-first — compose atomic classes (flex, p-4, bg-blue-500) directly in HTML; JIT generates only the CSS you use, keeping bundles tiny.',
  mustKnow: [
    'JIT scans source files for complete class name strings — never build class names dynamically with string interpolation.',
    'content array in tailwind.config.ts must include all files that use Tailwind classes, including .ts files.',
    'Responsive variants are mobile-first: md:flex = "display:flex at md and above".',
    'group-hover: applies to children when the group parent is hovered. peer-checked: applies to siblings.',
    'Use @apply sparingly — only for genuinely reused patterns (.btn, .card), not every element.',
    'dark: prefix requires darkMode: "class" config + .dark on html, or darkMode: "media" for system preference.',
  ],
  interviewFocus: [
    'How does Tailwind JIT work and why does it keep bundle sizes small?',
    'Why can you not build Tailwind class names dynamically with template literals?',
    'When would you use @apply and when would you keep utilities in HTML?',
    'What is the difference between group-hover: and peer-checked: variants?',
  ],
};

@Component({
  selector: 'app-css-tailwind',
  standalone: true,
  imports: [PageMetaComponent, QuickRefComponent, TheoryBlockComponent, CodeBlockComponent,
            CommonMistakesComponent, ChallengeBlockComponent, QuizBlockComponent,
            QnaBlockComponent, RevisionCardComponent, PageCompleteComponent],
  templateUrl: './tailwind.html',
  styleUrl: './tailwind.scss',
})
export class CssTailwind {
  quickRef = quickRef;
  theory = theory;
  codeTabs = codeTabs;
  mistakes = mistakes;
  challenge = challenge;
  quiz = quiz;
  qna = qna;
  revision = revision;
}
