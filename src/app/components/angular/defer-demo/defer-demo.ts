import { Component, signal } from '@angular/core';
import { HeavyChartComponent } from './heavy-chart/heavy-chart';
import { CodeBlockComponent, CodeTab } from '../../shared/code-block/code-block';
import { TheoryBlockComponent, TheoryPoint } from '../../shared/theory-block/theory-block';
import { QnaBlockComponent, QnaItem } from '../../shared/qna-block/qna-block';
import { QuizBlockComponent, QuizQuestion } from '../../shared/quiz-block/quiz-block';
import { ChallengeBlockComponent, Challenge } from '../../shared/challenge-block/challenge-block';
import { QuickRefComponent, QuickRefItem } from '../../shared/quick-ref/quick-ref';
import { BeforeAfterComponent, BeforeAfterExample } from '../../shared/before-after/before-after';
import { CommonMistakesComponent, CommonMistake } from '../../shared/common-mistakes/common-mistakes';
import { VersionBadgeComponent, VersionInfo } from '../../shared/version-badge/version-badge';
import { PageMetaComponent } from '../../shared/page-meta/page-meta';
import { PageCompleteComponent } from '../../shared/page-complete/page-complete';
import { RevisionCardComponent, RevisionSummary } from '../../shared/revision-card/revision-card';

@Component({
  selector: 'app-defer-demo',
  imports: [HeavyChartComponent, CodeBlockComponent, TheoryBlockComponent, QnaBlockComponent, QuizBlockComponent, ChallengeBlockComponent, QuickRefComponent, BeforeAfterComponent, CommonMistakesComponent, VersionBadgeComponent, PageMetaComponent, PageCompleteComponent, RevisionCardComponent],
  templateUrl: './defer-demo.html',
  styleUrl: './defer-demo.scss',
})
export class DeferDemo {
  showOnDemand = signal(false);

  qna: QnaItem[] = [
    { q: 'What is the difference between on viewport and on interaction?', a: '<code>on viewport</code> loads the chunk when the @placeholder element enters the visible viewport (IntersectionObserver). <code>on interaction</code> loads on first click, focus, or touch — better for modals or expandable sections above the fold.' },
    { q: 'What renders before the deferred component loads?', a: 'The <code>@placeholder</code> block renders immediately. The <code>@loading</code> block shows while the chunk is downloading. The <code>@error</code> block renders if the download fails. All three are optional.' },
    { q: 'Can @defer be nested?', a: 'Yes — a deferred component can itself contain <code>@defer</code> blocks. Angular handles the nesting correctly. Each deferred block downloads its own chunk independently.' },
    { q: 'How do you trigger @defer from a signal or button?', a: 'Use <code>when</code> trigger: <code>@defer (when showHeavy()) { &lt;app-heavy /&gt; }</code>. When the signal becomes truthy, Angular downloads and renders the component. Use a button click to set the signal.' },
    { q: 'Does @defer work with NgModule-based components?', a: 'No — <code>@defer</code> only works with <strong>standalone</strong> components. Legacy NgModule-based components must be migrated or wrapped in a standalone shell component.' },
    { q: 'How is @defer different from loadComponent()?', a: '<code>loadComponent()</code> is route-level lazy loading — the chunk loads on navigation. <code>@defer</code> is template-level — it loads based on viewport, interaction, or a signal, and can be used anywhere in a template, not just at route boundaries.' },
  ];

  theory: TheoryPoint[] = [
    {
      heading: 'What is @defer?',
      points: [
        '@defer lazy-loads a component\'s JavaScript bundle and renders it only when a trigger condition is met.',
        'The deferred chunk is code-split automatically — no manual loadComponent() needed.',
        '@placeholder shows content immediately; @loading shows during fetch; @error shows on failure.',
        'Without a trigger, @defer loads on browser idle — equivalent to requestIdleCallback.',
      ],
    },
    {
      heading: 'Trigger conditions',
      points: [
        'on viewport — loads when the @placeholder enters the browser viewport (IntersectionObserver).',
        'on interaction — loads on first click, focus, or touch on the @placeholder.',
        'on hover — loads when the mouse enters the @placeholder area.',
        'when expr — loads when a signal or expression becomes truthy — signal-driven deferred loading.',
      ],
    },
    {
      heading: '@placeholder, @loading, @error',
      points: [
        '@placeholder content renders immediately — keep it lightweight (skeleton, spinner icon).',
        '@loading { minimum Xms } prevents flash — shows spinner for at least the given duration.',
        '@error renders when the chunk fetch fails — useful for offline scenarios.',
        'Add after Xms to @placeholder: only show placeholder if loading takes longer than X milliseconds.',
      ],
    },
    {
      heading: 'Key points to remember',
      points: [
        '@defer only works with standalone components — not NgModule-based ones.',
        'Deferred components still participate in change detection normally after they load.',
        'Use @defer for heavy charts, data grids, or rich editors below the fold.',
        'Nest @defer blocks — a deferred component can itself contain @defer blocks.',
      ],
    },
  ];

  deferTabs: CodeTab[] = [
    {
      label: '@defer triggers',
      language: 'html',
      code: `
<!-- on viewport — loads when block scrolls into view -->
@defer (on viewport) {
  <app-heavy-chart />
} @placeholder {
  <div>Chart will load when visible</div>
} @loading (minimum 400ms) {
  <div>Loading chart bundle…</div>
} @error {
  <div>Failed to load chart.</div>
}

<!-- on interaction — loads on first click or keydown -->
@defer (on interaction) {
  <app-heavy-chart />
} @placeholder {
  <div>Click here to load</div>
}

<!-- when — programmatic trigger (signal, expression) -->
@defer (when showOnDemand()) {
  <app-heavy-chart />
}

<!-- on idle — loads when browser is idle (default) -->
@defer { <app-heavy-chart /> }

<!-- on timer(2s) — loads after a delay -->
@defer (on timer(2000ms)) { <app-heavy-chart /> }`,
    },
    {
      label: 'Why @defer?',
      language: 'typescript',
      code: `
// Without @defer: EVERY component in the template is bundled
// into the same JS chunk, even if not immediately visible.

// With @defer: Angular splits the deferred component into its
// OWN lazy chunk. That chunk is only downloaded when the trigger
// fires — never before.

// Build output difference:
//   Without: main.js = 400 kB
//   With:    main.js = 300 kB  +  heavy-chart.js = 100 kB (on demand)

// Rules:
// - Component must be in the imports[] of the host component
// - @placeholder shown before trigger fires (static, always rendered)
// - @loading shown while chunk is downloading
// - @error shown if download fails
// - Use (minimum Xms) on @loading to avoid flashes for fast networks`,
    },
  ];

  quiz: QuizQuestion[] = [
    { q: 'What does Angular\'s @defer block do to a component\'s JavaScript bundle?', options: ['It inlines the component\'s code directly into main.js at build time', 'It splits the component into its own lazy chunk that is only downloaded when a trigger fires', 'It compresses the component using gzip before serving it', 'It converts the component into a Web Component for browser-native lazy loading'], answer: 1, explanation: '@defer tells Angular\'s bundler to code-split the deferred component into its own separate JS chunk. That chunk is never downloaded until the specified trigger condition is met (viewport, interaction, when expression, etc.).' },
    { q: 'You place @defer (on viewport) around a heavy chart component. What does the user see before the component\'s chunk has been downloaded?', options: ['A blank white area — nothing renders until the chunk arrives', 'An Angular error boundary message', 'The content inside the @placeholder block', 'The content inside the @loading block'], answer: 2, explanation: '@placeholder renders immediately in place of the deferred content — before any trigger fires and before any download starts. @loading only appears while the chunk is actively being fetched, after the trigger has fired.' },
    { q: 'Which @defer trigger fires when the user first clicks, focuses, or touches the placeholder element?', options: ['on viewport', 'on hover', 'on idle', 'on interaction'], answer: 3, explanation: 'on interaction fires on the first click, keydown, focus, or touch event directed at the @placeholder element. It is well suited for modals, accordions, or expandable sections where the user must explicitly engage.' },
    { q: 'What is the purpose of (minimum 400ms) in @loading (minimum 400ms)?', options: ['It delays the trigger by 400 ms before starting the download', 'It keeps the @loading block visible for at least 400 ms to prevent a jarring flash on fast networks', 'It sets a timeout — if loading takes longer than 400 ms the @error block is shown', 'It throttles the IntersectionObserver to fire no more than once per 400 ms'], answer: 1, explanation: 'minimum Xms on @loading guarantees the loading indicator is shown for at least that duration. Without it, a very fast network would cause the spinner to flash for only a few milliseconds, which looks broken.' },
    { q: 'A colleague wants to use @defer with a component that is declared inside an NgModule (not standalone). What happens?', options: ['@defer works normally; Angular detects NgModule membership automatically', '@defer only works with standalone components — NgModule-based components must be migrated or wrapped in a standalone shell', 'Angular wraps the NgModule component in a dynamic import automatically at build time', '@defer works but only with the on idle trigger for NgModule components'], answer: 1, explanation: '@defer is a standalone-only feature. The deferred component must be a standalone component listed in the host\'s imports array. Legacy NgModule-based components are not supported and must be refactored or wrapped before they can be used inside a @defer block.' },
  ];

  quickRef: QuickRefItem[] = [
    { name: '@defer', type: 'directive', desc: 'Template block that code-splits a standalone component into its own lazy chunk and only downloads it when a trigger condition is met.' , since: '17'},
    { name: '@placeholder', type: 'directive', desc: 'Block rendered immediately in place of a deferred component before any trigger fires or download starts.' , since: '17'},
    { name: '@loading', type: 'directive', desc: 'Block shown while the deferred chunk is actively being fetched; supports a minimum duration to prevent flash.' , since: '17'},
    { name: '@error', type: 'directive', desc: 'Block rendered when the deferred chunk download fails, enabling graceful offline or network-error handling.' , since: '17'},
    { name: 'on viewport', type: 'directive', desc: 'Defer trigger that fires when the placeholder element enters the browser viewport via IntersectionObserver.' , since: '17'},
    { name: 'on interaction', type: 'directive', desc: 'Defer trigger that fires on the first click, focus, or touch event directed at the placeholder element.' , since: '17'},
    { name: 'on hover', type: 'directive', desc: 'Defer trigger that fires when the mouse pointer enters the placeholder area.' , since: '17'},
    { name: 'when', type: 'directive', desc: 'Defer trigger that activates when a signal or expression evaluates to truthy, enabling programmatic control.' , since: '17'},
    { name: 'on idle', type: 'directive', desc: 'Default defer trigger that loads the chunk when the browser is idle, equivalent to requestIdleCallback.' , since: '17'},
    { name: 'on timer', type: 'directive', desc: 'Defer trigger that fires after a specified time delay, e.g. on timer(2000ms).' , since: '17'},
  ];

  beforeAfter: BeforeAfterExample[] = [
    { title: 'Lazy loading: loadComponent() route-level vs @defer template-level', before: '// Route-level only — loads on navigation, not inside a template\nconst routes = [\n  {\n    path: \'chart\',\n    loadComponent: () => import(\'./heavy-chart\').then(m => m.HeavyChartComponent)\n  }\n];', after: '<!-- Template-level — loads on scroll into view, no route needed -->\n@defer (on viewport) {\n  <app-heavy-chart />\n} @placeholder {\n  <div>Scroll to load chart</div>\n}',
      note: '@defer splits the chunk automatically at build time; no manual dynamic import needed.' },
    { title: 'Conditional rendering: *ngIf (eager) vs @defer with when (lazy)', before: '<!-- *ngIf hides the element but the JS bundle is already downloaded -->\n<app-heavy-chart *ngIf=\'showChart\' />', after: '<!-- @defer downloads the bundle only when showChart() becomes true -->\n@defer (when showChart()) {\n  <app-heavy-chart />\n} @placeholder {\n  <div class=\'skeleton\'></div>\n}',
      note: '*ngIf is visibility-only; @defer with when is a true lazy download trigger.' },
    { title: 'Loading state: manual boolean flag vs @loading block', before: '// Manual approach: track loading state yourself\nisLoading = true;\n<div *ngIf=\'isLoading\'>Loading...</div>\n<app-heavy-chart *ngIf=\'!isLoading\' />', after: '@defer (on viewport) {\n  <app-heavy-chart />\n} @loading (minimum 400ms) {\n  <div>Loading chart bundle...</div>\n} @error {\n  <div>Failed to load.</div>\n}',
      note: '@loading and @error are declarative — no manual signal or flag needed.' },
  ];

  mistakes: CommonMistake[] = [
    { title: 'Using @defer with NgModule-based (non-standalone) components', wrong: '// NgModule-declared component — @defer will not work\n@NgModule({ declarations: [HeavyChartComponent] })\nexport class AppModule {}\n// Template: @defer { <app-heavy-chart /> }  // ERROR', right: '// Component must be standalone\n@Component({ selector: \'app-heavy-chart\', standalone: true, ... })\nexport class HeavyChartComponent {}\n// Then list it in the host imports[] and use inside @defer', explanation: '@defer is a standalone-only feature. NgModule-declared components are not supported and must be migrated or wrapped in a standalone shell component first.'  },
    { title: 'Omitting the component from the host imports[] array', wrong: '// HeavyChartComponent NOT in imports — Angular cannot code-split it\n@Component({ selector: \'app-host\', imports: [] })\nexport class HostComponent {}\n// Template: @defer { <app-heavy-chart /> }  // build error', right: '@Component({\n  selector: \'app-host\',\n  imports: [HeavyChartComponent],  // required\n})\nexport class HostComponent {}', explanation: 'The deferred component must be listed in the host\'s imports array so the Angular compiler knows which chunk to split. Without it the build will fail or the component will not be recognized.'  },
    { title: 'Confusing @placeholder (pre-trigger) with @loading (during download)', wrong: '// Developer expects @loading to show before user interaction\n@defer (on interaction) {\n  <app-heavy-chart />\n} @loading { <div>Waiting for click...</div> }', right: '@defer (on interaction) {\n  <app-heavy-chart />\n} @placeholder { <div>Click to load chart</div> }\n@loading (minimum 300ms) { <div>Downloading bundle...</div> }', explanation: '@placeholder renders before the trigger fires; @loading only appears after the trigger fires while the network fetch is in progress. Using @loading as a pre-trigger label shows nothing until the user interacts.'  },
    { title: 'Skipping minimum duration on @loading, causing a spinner flash', wrong: '@defer (on viewport) {\n  <app-heavy-chart />\n} @loading {\n  <div class=\'spinner\'>Loading...</div>\n}', right: '@defer (on viewport) {\n  <app-heavy-chart />\n} @loading (minimum 400ms) {\n  <div class=\'spinner\'>Loading...</div>\n}', explanation: 'On fast networks the chunk downloads in milliseconds, causing the spinner to flash for an imperceptible moment. Adding minimum Xms ensures the loading indicator is shown long enough to avoid a jarring visual glitch.'  },
  ];

  versionItems: VersionInfo[] = [
    { version: '17', label: 'Angular 17 — @defer introduced', features: ['@defer block with on viewport, on interaction, on hover, on idle, on timer triggers', '@placeholder, @loading, @error companion blocks with minimum/after options', 'when expression trigger for signal-driven or boolean-driven lazy loading', 'Automatic code-splitting at build time — no manual dynamic import() required'] },
    { version: '19', label: 'Angular 19 — @defer stabilized and hydration support', features: ['@defer is no longer developer preview — fully stable API', 'Server-side rendering (SSR) hydration support for deferred blocks'] },
  ];

  revision: RevisionSummary = {
    oneLiner: '@defer lazy-loads a standalone component\'s JS bundle into its own split chunk, downloading it only when a trigger condition (viewport, interaction, hover, idle, when, timer) fires — replacing manual dynamic import() with a declarative template syntax.',
    mustKnow: [
      '@defer requires the deferred component to be standalone and listed in the host\'s imports[] — Angular uses this to know which chunk to split',
      '@placeholder renders before any trigger fires; @loading renders while the chunk downloads; @error renders on download failure',
      'on viewport uses IntersectionObserver; on interaction fires on first click/focus/touch; when expr fires when a signal or boolean becomes truthy',
      '(minimum Xms) on @loading prevents a spinner flash on fast networks by keeping the loading state visible for at least that duration',
      'Without a trigger, @defer defaults to on idle — loads when the browser is idle, equivalent to requestIdleCallback',
      '@defer is template-level lazy loading — complements (not replaces) loadComponent() route-level lazy loading',
      'Nesting is supported — a deferred component can itself contain @defer blocks; each has its own independent chunk',
    ],
    interviewFocus: [
      'What is the difference between @defer and loadComponent() — when would you use each?',
      'What renders inside a @placeholder vs @loading block and when does each show?',
      'How does the when trigger differ from on interaction for programmatic control?',
      'Why is @defer limited to standalone components only?',
    ],
  };

  challenge: Challenge = {
    title: 'Build a Signal-Triggered Deferred Panel',
    description: 'Create an Angular standalone component that uses @defer with a \'when\' trigger to lazily load a details panel only after the user clicks a button. The component must show a skeleton placeholder before loading, a spinner while loading (minimum 500ms), and an error fallback. A signal named \'showDetails\' controls when the deferred block activates.',
    language: 'html',
    hints: [
      'Declare a signal in your component class: showDetails = signal(false); and wire a button\'s (click) handler to showDetails.set(true).',
      'Use @defer (when showDetails()) { ... } to make the block activate the moment the signal becomes truthy.',
      'Add @placeholder { ... } for the skeleton shown before the button is clicked, @loading (minimum 500ms) { ... } for the spinner shown while downloading, and @error { ... } for network failures.',
      'The component you defer must be standalone and listed in the host component\'s imports array — Angular uses this to know which chunks to split.',
    ],
    starterCode: `// details-panel.ts — pretend this is a heavy standalone component
import { Component } from '@angular/core';
@Component({
  selector: 'app-details-panel',
  standalone: true,
  template: '<div class="panel">Loaded! Here are the details.</div>',
})
export class DetailsPanelComponent {}

// -----------------------------------------------------------
// lazy-container.ts — YOUR TASK: fill in the template below
// -----------------------------------------------------------
import { Component, signal } from '@angular/core';
import { DetailsPanelComponent } from './details-panel';

@Component({
  selector: 'app-lazy-container',
  standalone: true,
  imports: [DetailsPanelComponent],
  template: \`
    <!-- TODO 1: Add a button that sets showDetails to true -->

    <!-- TODO 2: Add a @defer block triggered by the showDetails signal -->
    <!--         Inside it render <app-details-panel /> -->

    <!-- TODO 3: Add a @placeholder block with a skeleton div -->

    <!-- TODO 4: Add a @loading (minimum 500ms) block with a spinner message -->

    <!-- TODO 5: Add an @error block with a failure message -->
  \`,
})
export class LazyContainerComponent {
  showDetails = signal(false);
}`,
    solution: `// details-panel.ts
import { Component } from '@angular/core';
@Component({
  selector: 'app-details-panel',
  standalone: true,
  template: '<div class="panel">Loaded! Here are the details.</div>',
})
export class DetailsPanelComponent {}

// lazy-container.ts
import { Component, signal } from '@angular/core';
import { DetailsPanelComponent } from './details-panel';

@Component({
  selector: 'app-lazy-container',
  standalone: true,
  imports: [DetailsPanelComponent],
  template: \`
    <button (click)="showDetails.set(true)" [disabled]="showDetails()">
      {{ showDetails() ? 'Details loaded' : 'Load details' }}
    </button>

    @defer (when showDetails()) {
      <app-details-panel />
    } @placeholder {
      <div class="skeleton">Details will appear here after you click the button.</div>
    } @loading (minimum 500ms) {
      <div class="spinner">Loading details bundle...</div>
    } @error {
      <div class="error">Failed to load details. Please try again.</div>
    }
  \`,
})
export class LazyContainerComponent {
  showDetails = signal(false);
}`,
  };
}
