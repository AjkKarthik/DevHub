import { Component, signal, computed } from '@angular/core';

interface Guide {
  title: string;
  options: string[];
  rows: { criterion: string; cells: string[] }[];
  ruleOfThumb: string;
  verdict: string;
}

@Component({
  selector: 'app-decision-guides',
  standalone: true,
  imports: [],
  templateUrl: './decision-guides.html',
  styleUrl: './decision-guides.scss',
})
export class DecisionGuidesComponent {
  active = signal(0);

  guides: Guide[] = [
    {
      title: 'Signal vs Observable',
      options: ['Signal', 'Observable'],
      rows: [
        { criterion: 'Synchronous current value', cells: ['✓ always has a value', '✗ may not emit yet'] },
        { criterion: 'Async streams (HTTP, websockets)', cells: ['✗ not designed for it', '✓ first-class'] },
        { criterion: 'Operators (debounce, retry, merge)', cells: ['✗ minimal', '✓ full RxJS toolbox'] },
        { criterion: 'Change detection integration', cells: ['✓ fine-grained, zoneless-ready', 'Needs async pipe / subscribe'] },
        { criterion: 'Subscription management', cells: ['✓ none needed', 'Must unsubscribe / async pipe'] },
        { criterion: 'Glitch-free derived state', cells: ['✓ computed()', 'combineLatest can glitch'] },
      ],
      ruleOfThumb: 'Signals for state, Observables for events. If the value "is", use a signal; if the value "happens", use an observable.',
      verdict: 'Default to signals for component and shared state; reach for RxJS when you need time-based or multi-source event composition.',
    },
    {
      title: 'Reactive Forms vs Template-driven Forms',
      options: ['Reactive', 'Template-driven'],
      rows: [
        { criterion: 'Setup effort', cells: ['More TS boilerplate', '✓ minimal, mostly HTML'] },
        { criterion: 'Dynamic controls (add/remove)', cells: ['✓ FormArray, programmatic', '✗ awkward'] },
        { criterion: 'Custom & cross-field validation', cells: ['✓ functions, easy to compose', 'Needs validator directives'] },
        { criterion: 'Unit testability', cells: ['✓ test without rendering', '✗ requires DOM + whenStable'] },
        { criterion: 'Typed forms support', cells: ['✓ strict typing built in', 'Partial'] },
        { criterion: 'Best fit', cells: ['Complex, multi-step, dynamic', 'Small login/contact forms'] },
      ],
      ruleOfThumb: 'More than ~3 fields, any dynamic behavior, or serious validation? Go reactive.',
      verdict: 'Reactive forms are the default for application work; template-driven remains fine for trivial forms.',
    },
    {
      title: 'Component vs Directive vs Pipe',
      options: ['Component', 'Directive', 'Pipe'],
      rows: [
        { criterion: 'Has its own template', cells: ['✓', '✗ attaches to host', '✗'] },
        { criterion: 'Transforms values in templates', cells: ['✗', '✗', '✓ pure functions'] },
        { criterion: 'Adds behavior to existing elements', cells: ['✗ replaces markup', '✓ ideal', '✗'] },
        { criterion: 'Reusable across many hosts', cells: ['As a tag', '✓ any element', '✓ any expression'] },
        { criterion: 'Can manage structural DOM', cells: ['Via @if/@for', '✓ structural directives', '✗'] },
        { criterion: 'Example', cells: ['<app-card>', 'appTooltip, appAutofocus', 'date, currency, custom'] },
      ],
      ruleOfThumb: 'New UI block → component. Behavior on existing markup → directive. Display formatting → pipe.',
      verdict: 'Pick by responsibility: components own markup, directives own behavior, pipes own formatting.',
    },
    {
      title: "providedIn: 'root' vs Component providers",
      options: ["providedIn: 'root'", 'Component providers'],
      rows: [
        { criterion: 'Instance count', cells: ['✓ one app-wide singleton', 'One per component instance'] },
        { criterion: 'Tree-shakable', cells: ['✓ removed if unused', '✗ always bundled with component'] },
        { criterion: 'State isolation', cells: ['✗ shared by everyone', '✓ each widget gets fresh state'] },
        { criterion: 'Lifetime', cells: ['App lifetime', '✓ destroyed with component'] },
        { criterion: 'Typical use', cells: ['Auth, HTTP, config, caches', 'Per-widget stores, wizards'] },
      ],
      ruleOfThumb: 'Singleton until proven otherwise. Scope to a component only when two instances must not share state.',
      verdict: "providedIn: 'root' is the right default; component providers are a deliberate isolation tool.",
    },
    {
      title: '@defer vs Lazy Route',
      options: ['@defer', 'Lazy route'],
      rows: [
        { criterion: 'Granularity', cells: ['✓ any template fragment', 'Whole page / feature'] },
        { criterion: 'Trigger options', cells: ['✓ viewport, idle, hover, interaction', 'Navigation only'] },
        { criterion: 'URL changes', cells: ['✗ same page', '✓ deep-linkable'] },
        { criterion: 'Placeholder / loading UI', cells: ['✓ built-in blocks', 'Router loading indicators'] },
        { criterion: 'Best for', cells: ['Below-the-fold widgets, charts, comments', 'Feature areas, admin sections'] },
      ],
      ruleOfThumb: 'Split by route first; then use @defer to trim heavy widgets inside an already-loaded page.',
      verdict: 'They compose: lazy routes shape the app bundle, @defer fine-tunes each page.',
    },
    {
      title: 'NgRx vs Signal Store Service',
      options: ['NgRx (or SignalStore)', 'Plain signal service'],
      rows: [
        { criterion: 'Boilerplate', cells: ['More structure & files', '✓ a class with signals'] },
        { criterion: 'Devtools / time travel', cells: ['✓ excellent', '✗ none built in'] },
        { criterion: 'Team conventions at scale', cells: ['✓ enforced patterns', 'Discipline required'] },
        { criterion: 'Learning curve', cells: ['Steeper', '✓ just Angular'] },
        { criterion: 'Side-effect orchestration', cells: ['✓ effects/rxMethod', 'Manual'] },
        { criterion: 'Best fit', cells: ['Large apps, many teams', 'Small/medium apps, local features'] },
      ],
      ruleOfThumb: "Start with a signal service. Adopt NgRx when state interactions, audit needs, or team size outgrow it.",
      verdict: 'Most apps never need full NgRx; a well-shaped signal service covers the majority of cases.',
    },
    {
      title: 'SSR vs CSR vs Prerender',
      options: ['SSR', 'CSR', 'Prerender (SSG)'],
      rows: [
        { criterion: 'First paint speed', cells: ['✓ fast, server HTML', '✗ blank until JS', '✓ fastest, static HTML'] },
        { criterion: 'SEO', cells: ['✓ full', '✗ weak', '✓ full'] },
        { criterion: 'Per-request dynamic data', cells: ['✓ rendered per request', '✓ client fetch', '✗ data frozen at build'] },
        { criterion: 'Server cost / complexity', cells: ['Node server needed', '✓ static hosting', '✓ static hosting'] },
        { criterion: 'Best for', cells: ['Logged-in dynamic content + SEO', 'Internal dashboards, tools', 'Marketing, docs, blogs'] },
      ],
      ruleOfThumb: 'Public + dynamic → SSR. Public + static → prerender. Behind a login → CSR is usually enough.',
      verdict: 'Angular lets you mix per-route: prerender static pages, SSR dynamic ones, CSR the app shell.',
    },
    {
      title: 'input() vs Route Param vs Service for Data Passing',
      options: ['input()', 'Route param', 'Shared service'],
      rows: [
        { criterion: 'Relationship', cells: ['✓ parent → child', 'URL → page component', 'Any → any'] },
        { criterion: 'Survives refresh / shareable URL', cells: ['✗', '✓ in the URL', '✗ unless persisted'] },
        { criterion: 'Distance between components', cells: ['Adjacent only', 'Across navigation', '✓ unrelated components'] },
        { criterion: 'Type safety', cells: ['✓ typed inputs', 'Strings (withComponentInputBinding helps)', '✓ typed signals'] },
        { criterion: 'Best for', cells: ['Presentational children', 'Entity ids, filters, tabs', 'Cross-cutting state'] },
      ],
      ruleOfThumb: 'If the data identifies what the page shows, put it in the URL. Parent-child → input(). Everything else → a service.',
      verdict: 'Choose by ownership: URL owns navigation state, parents own child config, services own shared state.',
    },
  ];

  guide = computed(() => this.guides[this.active()]);
}
