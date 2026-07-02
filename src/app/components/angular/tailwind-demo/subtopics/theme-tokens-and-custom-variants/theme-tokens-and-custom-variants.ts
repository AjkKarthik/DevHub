import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../shared/theory-block/theory-block';
import { LivePlaygroundComponent, PlaygroundFile } from '../../../../shared/live-playground/live-playground';
import { TryItComponent, TryItExercise } from '../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-theme-tokens-and-custom-variants-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent,
    LivePlaygroundComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './theme-tokens-and-custom-variants.html',
  styleUrl: './theme-tokens-and-custom-variants.scss',
})
export class ThemeTokensAndCustomVariantsSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: '@theme — design tokens ARE CSS custom properties',
      points: [
        'In Tailwind v4, <code>@theme { --color-brand: #6366f1; --spacing-18: 4.5rem; }</code> does TWO things simultaneously: it registers <code>--color-brand</code>/<code>--spacing-18</code> as real CSS custom properties (inspectable in DevTools, usable in plain <code>var(--color-brand)</code> anywhere), AND it generates matching utility classes (<code>bg-brand</code>, <code>text-brand</code>, <code>p-18</code>) automatically — one declaration, both outcomes.',
        'Token NAMESPACES determine which utilities get generated: <code>--color-*</code> tokens produce <code>bg-*</code>/<code>text-*</code>/<code>border-*</code> utilities; <code>--spacing-*</code> tokens produce <code>p-*</code>/<code>m-*</code>/<code>gap-*</code> utilities; <code>--font-*</code> tokens produce <code>font-*</code> utilities — the prefix in the variable name is what wires it to the right utility family.',
      ],
    },
    {
      heading: 'Per-component token overrides with :host',
      points: [
        'Because theme tokens are just CSS custom properties, they inherit and CASCADE normally — <code>:host { --color-brand: #16a34a; }</code> on ONE Angular component overrides the brand color for everything inside that component\'s view, while the rest of the app keeps the global value, with zero JavaScript or `&#64;Input()` involved.',
        'This is a genuinely different mechanism from Angular\'s own component styling encapsulation — the CSS VARIABLE cascades through Shadow-DOM-like view encapsulation boundaries (since custom properties always inherit), while Angular\'s CSS class scoping does not leak between components the same way.',
      ],
    },
    {
      heading: '@custom-variant — inventing your own conditional utility prefix',
      points: [
        '<code>@custom-variant hocus (&:hover, &:focus);</code> defines a NEW variant prefix — after this declaration, <code>hocus:bg-indigo-700</code> applies that background on EITHER hover OR focus, letting you write one utility instead of duplicating <code>hover:bg-indigo-700 focus:bg-indigo-700</code>.',
        'Custom variants can target ANY selector pattern, not just pseudo-classes — <code>@custom-variant group-open (&:where([data-state="open"] *));</code> creates a variant that only applies when an ancestor has a specific data attribute, useful for accordion/disclosure component states without writing raw CSS.',
      ],
    },
  ];

  liveDemoFiles: PlaygroundFile[] = [
    {
      path: 'src/app/app.ts',
      content: `import { Component, signal } from '@angular/core';

@Component({
  selector: 'app-root',
  standalone: true,
  template: \`
    <h3>@theme tokens — bg-brand comes from a CSS custom property</h3>
    <!-- This sandbox uses the Tailwind CDN build (JS config, v3-style) to keep the
         demo actually runnable — in a real v4 project with @custom-variant hocus
         (&:hover, &:focus); declared once, this would be hocus:bg-brand-dark
         instead of repeating hover:/focus: separately. -->
    <button class="bg-brand text-white px-4 py-2 rounded-lg hover:bg-brand-dark focus:bg-brand-dark transition-colors">
      Hover or focus me (hover: + focus: — one custom variant in real v4)
    </button>

    <h3>Per-component token override via :host</h3>
    <div class="scoped-override p-4 rounded-lg mt-4">
      <span class="bg-brand text-white px-3 py-1 rounded">This uses the OVERRIDDEN brand color</span>
    </div>
  \`,
  styles: \`
    /* :host overrides the --color-brand token ONLY within this component's view */
    .scoped-override { --color-brand: #16a34a; background: #f0fdf4; }
  \`,
})
export class App {}
`,
    },
    {
      path: 'src/main.ts',
      content: `import { bootstrapApplication } from '@angular/platform-browser';
import { App } from './app/app';

bootstrapApplication(App);
`,
    },
    {
      path: 'src/index.html',
      content: `<!doctype html>
<html>
  <head>
    <title>Theme tokens and custom variants</title>
    <!-- Tailwind's official browser build — perfect for sandbox/demo purposes, no build step -->
    <script src="https://cdn.tailwindcss.com"></script>
    <script>
      // Inline config approximates @theme tokens for this CDN-based demo
      tailwind.config = {
        theme: {
          extend: {
            colors: {
              brand: 'var(--color-brand, #6366f1)',
              'brand-dark': '#4338ca',
            },
          },
        },
      };
    </script>
  </head>
  <body><app-root></app-root></body>
</html>
`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'Change the scoped-override color from green (#16a34a) to orange (#ea580c), and confirm only the second box changes while the first button keeps the default indigo brand color.',
    hint: 'Change --color-brand: #16a34a; to --color-brand: #ea580c; inside the .scoped-override CSS rule — this only affects elements within that specific component view.',
    solution: `.scoped-override { --color-brand: #ea580c; background: #fff7ed; }`,
  };

  misconceptions: Misconception[] = [
    {
      thought: '@theme tokens in Tailwind v4 are compile-time-only values, like Sass variables.',
      reality: 'they are real CSS custom properties that exist at runtime — inspectable in DevTools, overridable per-component with plain CSS (:host { --color-brand: ... }), and usable directly with var() anywhere, not just through Tailwind utility classes.',
    },
    {
      thought: 'overriding a theme token for one Angular component requires an @Input() or a service to pass the new value down.',
      reality: 'because theme tokens are CSS custom properties, a plain :host { --color-brand: ... } rule in that component\'s own stylesheet overrides it for everything inside that view — no JavaScript or input binding involved.',
    },
    {
      thought: 'custom variants like hocus: can only combine pseudo-classes such as hover and focus.',
      reality: '@custom-variant can target any selector pattern, including attribute selectors and ancestor-based conditions (e.g. a parent\'s data-state attribute) — not limited to pseudo-class combinations.',
    },
  ];
}
