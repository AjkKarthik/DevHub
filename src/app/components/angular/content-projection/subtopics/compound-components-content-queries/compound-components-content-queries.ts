import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../shared/theory-block/theory-block';
import { LivePlaygroundComponent, PlaygroundFile } from '../../../../shared/live-playground/live-playground';
import { TryItComponent, TryItExercise } from '../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-compound-components-content-queries-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent,
    LivePlaygroundComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './compound-components-content-queries.html',
  styleUrl: './compound-components-content-queries.scss',
})
export class CompoundComponentsContentQueriesSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The compound component pattern',
      points: [
        'A COMPOUND COMPONENT is a parent (e.g. <code>&lt;app-tabs&gt;</code>) that orchestrates a set of children (<code>&lt;app-tab&gt;</code>) projected directly into it — the parent discovers its children via <code>contentChildren()</code> rather than the children being passed as a data array input.',
        'This gives the CONSUMER a natural, declarative markup API — <code>&lt;app-tabs&gt;&lt;app-tab title="One"&gt;...&lt;/app-tab&gt;&lt;app-tab title="Two"&gt;...&lt;/app-tab&gt;&lt;/app-tabs&gt;</code> — instead of an awkward <code>[tabs]="[{title, content}, ...]"</code> input array that can\'t hold arbitrary projected markup per tab.',
        'The parent queries <code>contentChildren(TabComponent)</code> to get a live signal array of every projected <code>TabComponent</code> instance — it can then read/set properties directly on each child instance (like <code>active</code>) to coordinate state.',
      ],
    },
    {
      heading: 'Coordinating state between parent and self-registering children',
      points: [
        'Each child component (<code>TabComponent</code>) exposes a simple public signal or property (<code>active = signal(false)</code>) that the PARENT sets — the parent iterates its <code>contentChildren()</code> array and sets <code>active</code> to <code>true</code> only on the selected one, <code>false</code> on the rest.',
        'The child\'s own template reads its OWN <code>active</code> signal to conditionally render its content (<code>&#64;if (active()) { &lt;ng-content /&gt; }</code>) — the parent never touches the child\'s DOM directly, it only flips a signal the child template already reacts to.',
        'This differs from a plain <code>&#64;for</code> loop over a data array specifically because the PROJECTED CONTENT of each tab can be arbitrary markup (forms, charts, nested components) supplied declaratively by the consumer — a data-array approach would require passing templates through inputs instead.',
      ],
    },
  ];

  liveDemoFiles: PlaygroundFile[] = [
    {
      path: 'src/app/tab.ts',
      content: `import { Component, signal, input } from '@angular/core';

@Component({
  selector: 'app-tab',
  standalone: true,
  template: \`
    @if (active()) {
      <div style="padding: 1rem; border: 1px solid #ddd;"><ng-content /></div>
    }
  \`,
})
export class TabComponent {
  title = input.required<string>();
  // The parent (TabsComponent) sets this — the tab itself just reacts to it
  active = signal(false);
}
`,
    },
    {
      path: 'src/app/tabs.ts',
      content: `import { Component, contentChildren, signal } from '@angular/core';
import { TabComponent } from './tab';

@Component({
  selector: 'app-tabs',
  standalone: true,
  template: \`
    <div style="display: flex; gap: 0.5rem; margin-bottom: 0.5rem;">
      @for (tab of tabs(); track tab.title(); let i = $index) {
        <button
          (click)="select(i)"
          [style.fontWeight]="i === selectedIndex() ? 'bold' : 'normal'">
          {{ tab.title() }}
        </button>
      }
    </div>
    <ng-content />
  \`,
})
export class TabsComponent {
  // Discovers every <app-tab> projected inside <app-tabs>...</app-tabs>
  tabs = contentChildren(TabComponent);
  selectedIndex = signal(0);

  constructor() {
    // Activate the first tab once children are available (effect would also work)
    queueMicrotask(() => this.select(0));
  }

  select(index: number) {
    this.selectedIndex.set(index);
    this.tabs().forEach((tab, i) => tab.active.set(i === index));
  }
}
`,
    },
    {
      path: 'src/app/app.ts',
      content: `import { Component } from '@angular/core';
import { TabsComponent } from './tabs';
import { TabComponent } from './tab';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [TabsComponent, TabComponent],
  template: \`
    <h3>Compound component — &lt;app-tabs&gt; orchestrates projected &lt;app-tab&gt; children</h3>
    <app-tabs>
      <app-tab title="Profile">
        <p>Profile content — could be any arbitrary markup, a form, a chart...</p>
      </app-tab>
      <app-tab title="Settings">
        <p>Settings content goes here.</p>
      </app-tab>
      <app-tab title="Billing">
        <p>Billing content goes here.</p>
      </app-tab>
    </app-tabs>
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
  <head><title>Compound components with content queries</title></head>
  <body><app-root></app-root></body>
</html>
`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'Add a fourth <app-tab title="Notifications"> with some content, and verify the new tab button appears and works without touching tabs.ts.',
    hint: 'Add a new <app-tab title="Notifications"><p>Notification settings here.</p></app-tab> block inside <app-tabs> in app.ts — tabs.ts already discovers every projected tab automatically via contentChildren(TabComponent).',
    solution: `<app-tabs>
  <app-tab title="Profile"><p>Profile content...</p></app-tab>
  <app-tab title="Settings"><p>Settings content...</p></app-tab>
  <app-tab title="Billing"><p>Billing content...</p></app-tab>
  <app-tab title="Notifications"><p>Notification settings here.</p></app-tab>
</app-tabs>`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'a compound component like <app-tabs> needs an [items] input array of tab data to know what tabs exist.',
      reality: 'contentChildren(TabComponent) discovers projected <app-tab> instances directly from the markup between <app-tabs> tags — no data array input is needed, and each tab can contain genuinely arbitrary projected markup.',
    },
    {
      thought: 'the parent component directly manipulates each child\'s DOM to show/hide its content.',
      reality: 'the parent only sets a signal (active) on each child instance — the CHILD\'s own template reacts to that signal to conditionally render its projected content; the parent never touches the child\'s DOM directly.',
    },
    {
      thought: 'contentChildren() results are available immediately in the constructor.',
      reality: 'like all content queries, contentChildren() only reflects fully-initialized projected content after ngAfterContentInit — reading or acting on it too early (e.g. synchronously in the constructor without deferring) can see a stale or empty result.',
    },
  ];
}
