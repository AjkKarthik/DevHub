import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../shared/theory-block/theory-block';
import { LivePlaygroundComponent, PlaygroundFile } from '../../../../shared/live-playground/live-playground';
import { TryItComponent, TryItExercise } from '../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-component-variant-patterns-with-cva-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent,
    LivePlaygroundComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './component-variant-patterns-with-cva.html',
  styleUrl: './component-variant-patterns-with-cva.scss',
})
export class ComponentVariantPatternsWithCvaSubtopic {

  cvaDeps = { 'class-variance-authority': 'latest' };

  theory: TheoryPoint[] = [
    {
      heading: 'The problem — ad-hoc ternaries don\'t scale past 2 variants',
      points: [
        'The main topic\'s <code>computed()</code>-based class pattern (<code>this.dark() ? \'...\' : \'...\'</code>) works fine for ONE binary toggle — but a real button component with <code>variant</code> (primary/secondary/danger) AND <code>size</code> (sm/md/lg) has 9 COMBINATIONS, and nested ternaries for that quickly become unreadable and error-prone.',
        '<code>class-variance-authority</code> (cva) — a small, framework-agnostic utility — declares each variant AXIS and its possible VALUES as a plain object, then generates the correct combined class string for you: <code>cva(\'base classes\', { variants: { variant: { primary: \'...\', secondary: \'...\' }, size: { sm: \'...\', lg: \'...\' } } })</code>.',
      ],
    },
    {
      heading: 'Wiring cva into an Angular component with signal inputs',
      points: [
        'Define the cva function OUTSIDE the component class (module scope) — it is pure configuration, not component state. Inside the component, expose <code>variant = input&lt;\'primary\' | \'secondary\'&gt;(\'primary\')</code> and <code>size = input&lt;\'sm\' | \'md\' | \'lg\'&gt;(\'md\')</code> as typed signal inputs.',
        'A <code>computed()</code> reads both inputs and calls the cva function: <code>classes = computed(() =&gt; buttonVariants({ variant: this.variant(), size: this.size() }))</code> — the template then binds <code>[class]="classes()"</code>, getting a fully type-checked, autocomplete-friendly variant API instead of a stringly-typed prop.',
      ],
    },
    {
      heading: 'TypeScript infers the valid variant values automatically',
      points: [
        '<code>VariantProps&lt;typeof buttonVariants&gt;</code> (a helper type cva exports) extracts the exact union of allowed variant values DIRECTLY FROM the cva configuration object — you never separately hand-write <code>\'primary\' | \'secondary\' | \'danger\'</code> as a type; it is derived, so adding a new variant to the cva config automatically updates the allowed values everywhere that type is used.',
        'This eliminates a genuinely common bug class: a consumer passing <code>variant="primry"</code> (typo) is now a COMPILE ERROR rather than a silently-ignored/broken class string at runtime.',
      ],
    },
  ];

  liveDemoFiles: PlaygroundFile[] = [
    {
      path: 'src/app/button.ts',
      content: `import { Component, input, computed } from '@angular/core';
import { cva, type VariantProps } from 'class-variance-authority';

// Pure configuration — declared once, outside the component class
const buttonVariants = cva(
  'rounded-lg font-medium transition-colors focus:outline-none focus:ring-2',
  {
    variants: {
      variant: {
        primary: 'bg-indigo-600 text-white hover:bg-indigo-700 focus:ring-indigo-500',
        secondary: 'bg-gray-200 text-gray-900 hover:bg-gray-300 focus:ring-gray-400',
        danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500',
      },
      size: {
        sm: 'px-3 py-1.5 text-sm',
        md: 'px-4 py-2 text-base',
        lg: 'px-6 py-3 text-lg',
      },
    },
    defaultVariants: { variant: 'primary', size: 'md' },
  },
);

// TypeScript DERIVES the allowed values from the cva config — no manual union type
type ButtonVariantProps = VariantProps<typeof buttonVariants>;

@Component({
  selector: 'app-button',
  standalone: true,
  template: \`<button [class]="classes()"><ng-content /></button>\`,
})
export class ButtonComponent {
  variant = input<ButtonVariantProps['variant']>('primary');
  size = input<ButtonVariantProps['size']>('md');

  classes = computed(() => buttonVariants({ variant: this.variant(), size: this.size() }));
}
`,
    },
    {
      path: 'src/app/app.ts',
      content: `import { Component } from '@angular/core';
import { ButtonComponent } from './button';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [ButtonComponent],
  template: \`
    <h3>Typed variant API — try changing variant/size in the template</h3>
    <div style="display: flex; gap: 0.5rem; flex-wrap: wrap;">
      <app-button variant="primary" size="sm">Primary SM</app-button>
      <app-button variant="secondary" size="md">Secondary MD</app-button>
      <app-button variant="danger" size="lg">Danger LG</app-button>
    </div>
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
    <title>Component variant patterns with cva</title>
    <script src="https://cdn.tailwindcss.com"></script>
  </head>
  <body><app-root></app-root></body>
</html>
`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'Add a fourth variant "ghost" (transparent background, colored text, hover background) to the cva config, and use it on a new button in the template.',
    hint: 'Add ghost: \'bg-transparent text-indigo-600 hover:bg-indigo-50\' as a new entry in the variant.variant object inside cva(), then add <app-button variant="ghost">Ghost</app-button> to the template.',
    solution: `variant: {
  primary: 'bg-indigo-600 text-white hover:bg-indigo-700 focus:ring-indigo-500',
  secondary: 'bg-gray-200 text-gray-900 hover:bg-gray-300 focus:ring-gray-400',
  danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500',
  ghost: 'bg-transparent text-indigo-600 hover:bg-indigo-50 focus:ring-indigo-500',
},`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'nested ternary expressions for variant + size combinations are just as maintainable as a cva config once you get used to them.',
      reality: 'a button with 3 variants and 3 sizes has 9 combinations — ternary logic for that grows unreadable fast, while cva expresses each axis independently and combines them automatically, staying readable as axes are added.',
    },
    {
      thought: 'the allowed variant values (like "primary" | "secondary") must be manually typed as a union type separately from the cva config.',
      reality: 'VariantProps<typeof buttonVariants> DERIVES the exact allowed union directly from the cva configuration object — adding a new variant to the config automatically updates the type everywhere it\'s used, no manual sync required.',
    },
    {
      thought: 'a typo in a variant prop value (e.g. variant="primry") would just silently apply no special styling at runtime.',
      reality: 'with the derived VariantProps type on a typed signal input, passing an invalid variant value is a COMPILE ERROR — TypeScript catches it before the app even runs, not a silent runtime styling bug.',
    },
  ];
}
