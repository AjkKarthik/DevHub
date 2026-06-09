import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

interface Step {
  route: string;
  label: string;
  why: string;
}

interface Path {
  id: string;
  title: string;
  subtitle: string;
  icon: string;
  color: string;
  duration: string;
  steps: Step[];
}

@Component({
  selector: 'app-learning-paths',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './learning-paths.html',
  styleUrl: './learning-paths.scss',
})
export class LearningPathsComponent {
  paths: Path[] = [
    {
      id: 'beginner',
      title: 'Beginner Path',
      subtitle: 'New to Angular? Start here.',
      icon: '🌱',
      color: '#16a34a',
      duration: '~4–6 weeks',
      steps: [
        { route: 'counter',        label: 'Signals & State',     why: 'The core reactivity primitive in modern Angular.' },
        { route: 'templates',      label: 'Template Syntax',     why: 'Understand how Angular renders the DOM.' },
        { route: 'lifecycle',      label: 'Lifecycle Hooks',     why: 'Know when your component is born, updated, and destroyed.' },
        { route: 'pipes',          label: 'Pipes',               why: 'Transform display data cleanly without logic in templates.' },
        { route: 'directives',     label: 'Directives',          why: 'Add behaviour to DOM elements declaratively.' },
        { route: 'parent-child',   label: 'Input / Output',      why: 'Pass data between components — the building block of composition.' },
        { route: 'forms',          label: 'Template vs Reactive',why: 'Learn both form strategies before picking one.' },
        { route: 'routing',        label: 'Routing',             why: 'Navigate between pages in a single-page app.' },
        { route: 'http',           label: 'HTTP Client',         why: 'Fetch data from an API.' },
        { route: 'di',             label: 'Dependency Injection', why: 'Share services across your app cleanly.' },
      ],
    },
    {
      id: 'intermediate',
      title: 'Intermediate Path',
      subtitle: 'Comfortable with basics? Level up.',
      icon: '🚀',
      color: '#4f46e5',
      duration: '~4–6 weeks',
      steps: [
        { route: 'change-detection', label: 'Change Detection',       why: 'OnPush + signals = blazing fast apps.' },
        { route: 'rxjs',             label: 'RxJS Operators',         why: 'Master async patterns: switchMap, combineLatest, and more.' },
        { route: 'form-array',       label: 'FormArray',              why: 'Dynamic, repeating form fields.' },
        { route: 'custom-validators',label: 'Custom Validators',      why: 'Beyond built-in — write and compose your own validators.' },
        { route: 'content-projection',label:'Content Projection',     why: 'Build reusable layout shells with <ng-content>.' },
        { route: 'defer',            label: '@defer Blocks',          why: 'Lazy-load parts of a template with zero boilerplate.' },
        { route: 'route-resolvers',  label: 'Route Resolvers',        why: 'Pre-fetch data before a page renders.' },
        { route: 'preloading',       label: 'Preloading Strategies',  why: 'Speed up navigation by loading lazy routes in advance.' },
        { route: 'animations',       label: 'Animations',             why: 'Bring your UI to life with Angular\'s animation API.' },
        { route: 'testing',          label: 'Testing',                why: 'Write confident unit + integration tests.' },
      ],
    },
    {
      id: 'advanced',
      title: 'Advanced Path',
      subtitle: 'Build production-grade Angular apps.',
      icon: '🏆',
      color: '#7c3aed',
      duration: '~6–8 weeks',
      steps: [
        { route: 'store',         label: 'Signal Store',         why: 'NgRx Signal Store — global state without boilerplate.' },
        { route: 'ngrx-signals',  label: 'NgRx Signals',         why: 'Feature stores, entities, and signalState patterns.' },
        { route: 'resource-api',  label: 'resource() API',       why: 'Signals-native async data fetching — the future of HTTP in Angular.' },
        { route: 'linked-signal', label: 'linkedSignal()',       why: 'Derived writable signals for complex state.' },
        { route: 'zoneless',      label: 'Zoneless Angular',     why: 'Remove zone.js — understand how Angular detects changes natively.' },
        { route: 'destroy-ref',   label: 'DestroyRef',           why: 'Fine-grained cleanup without lifecycle hooks.' },
        { route: 'cva',           label: 'ControlValueAccessor', why: 'Make any component work as a form control.' },
        { route: 'dynamic-forms', label: 'Dynamic Forms',        why: 'Drive forms from schema/config instead of hardcoded HTML.' },
        { route: 'ssr',           label: 'SSR + Hydration',      why: 'Server-side rendering for SEO and performance.' },
        { route: 'e2e',           label: 'E2E with Playwright',  why: 'Test real user flows in a real browser.' },
      ],
    },
    {
      id: 'ui',
      title: 'UI Engineering Path',
      subtitle: 'Build beautiful, accessible UIs.',
      icon: '🎨',
      color: '#db2777',
      duration: '~3–4 weeks',
      steps: [
        { route: 'material',      label: 'Angular Material',    why: 'Production-ready component library following Material Design.' },
        { route: 'cdk',           label: 'Angular CDK',         why: 'Behaviour primitives: drag-drop, virtual scroll, overlay.' },
        { route: 'tailwind',      label: 'Tailwind CSS',        why: 'Utility-first styling inside Angular components.' },
        { route: 'animations',    label: 'Animations',          why: 'Polished micro-interactions with Angular\'s animation API.' },
        { route: 'charts',        label: 'Charts (Chart.js)',   why: 'Data visualisation integration.' },
        { route: 'ag-grid',       label: 'AG Grid',             why: 'Enterprise-grade data grid.' },
        { route: 'ng-image',      label: 'NgOptimizedImage',    why: 'Lazy loading + LCP optimisation baked in.' },
      ],
    },
  ];
}
