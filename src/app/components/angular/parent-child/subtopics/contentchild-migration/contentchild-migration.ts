import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../shared/theory-block/theory-block';
import { LivePlaygroundComponent, PlaygroundFile } from '../../../../shared/live-playground/live-playground';
import { TryItComponent, TryItExercise } from '../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-contentchild-migration-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent,
    LivePlaygroundComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './contentchild-migration.html',
  styleUrl: './contentchild-migration.scss',
})
export class ContentchildMigrationSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'contentChild() — content the PARENT projected in, not your own template',
      points: [
        '<code>contentChild()</code> queries content projected INTO this component\'s <code>&lt;ng-content&gt;</code> slot BY THE PARENT — this is the key distinction from <code>viewChild()</code>, which queries the component\'s OWN template. If a <code>Tabs</code> wrapper component receives <code>&lt;app-tab&gt;</code> elements from whoever uses it, those are content children of <code>Tabs</code>, not view children.',
        '<code>contentChildren(TokenType)</code> returns <code>Signal&lt;readonly T[]&gt;</code> of every projected match — the direct replacement for <code>&#64;ContentChildren</code>. This is exactly the shape a wrapper/container component (tabs, accordion, form group) needs to read or configure the items it was handed.',
        '<code>contentChild.required()</code> asserts that AT LEAST ONE matching item is projected — useful for a layout container that genuinely cannot function with zero content, the same required/optional distinction as <code>input.required()</code>.',
      ],
    },
    {
      heading: 'Migrating from the old decorator APIs — mostly mechanical',
      points: [
        '<code>&#64;Input() prop!: T</code> → <code>prop = input.required&lt;T&gt;();</code>, then update every READ from <code>this.prop</code> to <code>this.prop()</code> — the parent\'s template binding does not change at all.',
        '<code>&#64;Output() evt = new EventEmitter&lt;T&gt;();</code> → <code>evt = output&lt;T&gt;();</code> — the <code>.emit()</code> call site and the parent binding are both unchanged.',
        'Signal inputs do NOT trigger <code>ngOnChanges</code> — replace that lifecycle hook with <code>effect(() =&gt; { const v = this.prop(); ... })</code> to react to changes reactively instead.',
      ],
    },
    {
      heading: 'Two rules worth internalizing',
      points: [
        'NEVER mix <code>input()</code> and <code>&#64;Input()</code> on the SAME property — pick one API per property, consistently. Mixing them causes Angular to apply both bindings simultaneously, producing genuinely confusing behavior that is hard to debug.',
        'For deeply nested component trees, prefer a shared injectable service (or signals on one) over long chains of inputs and outputs passed down through every intermediate level. More than two levels of prop-drilling is a real signal to stop and refactor toward shared state instead.',
      ],
    },
  ];

  liveDemoFiles: PlaygroundFile[] = [
    {
      path: 'src/app/tab.ts',
      content: `import { Component, input } from '@angular/core';

@Component({
  selector: 'app-tab',
  standalone: true,
  template: \`
    @if (active()) {
      <div class="tab-content"><ng-content /></div>
    }
  \`,
})
export class Tab {
  label = input.required<string>();
  active = input(false);
}
`,
    },
    {
      path: 'src/app/tabs.ts',
      content: `import { Component, contentChildren, signal } from '@angular/core';
import { Tab } from './tab';

@Component({
  selector: 'app-tabs',
  standalone: true,
  template: \`
    <div class="tab-bar">
      @for (tab of tabs(); track tab.label()) {
        <button
          [class.active]="tab.label() === activeLabel()"
          (click)="activeLabel.set(tab.label())">
          {{ tab.label() }}
        </button>
      }
    </div>
    <ng-content />
  \`,
})
export class Tabs {
  // Content children — projected <app-tab> elements from whoever USES <app-tabs>
  tabs = contentChildren(Tab);

  activeLabel = signal('First');
}
`,
    },
    {
      path: 'src/app/app.ts',
      content: `import { Component } from '@angular/core';
import { Tabs } from './tabs';
import { Tab } from './tab';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [Tabs, Tab],
  template: \`
    <app-tabs>
      <app-tab label="First" [active]="true">First tab's content</app-tab>
      <app-tab label="Second">Second tab's content</app-tab>
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
  <head><title>contentChild and migration</title></head>
  <body><app-root></app-root></body>
</html>
`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'Wire up the tab-bar buttons so clicking one actually shows the matching tab\'s content — each app-tab\'s [active] input should be true only when its own label matches Tabs\' activeLabel signal.',
    hint: 'Since Tab already reads its own active input to decide whether to render its projected content, the parent (app.ts) needs to bind [active]="tab.label() === \'First\'" per tab dynamically — or simpler: change Tab to accept the shared activeLabel via contentChild coordination. The straightforward fix: bind each <app-tab>\'s [active] from a per-tab computed in app.ts, e.g. [active]="selected() === \'First\'".',
    solution: `// app.ts
import { Component, signal } from '@angular/core';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [Tabs, Tab],
  template: \`
    <app-tabs>
      <app-tab label="First" [active]="selected() === 'First'">First tab's content</app-tab>
      <app-tab label="Second" [active]="selected() === 'Second'">Second tab's content</app-tab>
    </app-tabs>
  \`,
})
export class App {
  selected = signal('First');
}`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'contentChild() queries the component\'s own template, the same content viewChild() would find.',
      reality: 'contentChild() queries content PROJECTED IN by whoever uses this component (via ng-content) — genuinely different content from viewChild(), which only sees the component\'s OWN template markup.',
    },
    {
      thought: 'it is fine to use both @Input() and input() on the same property for extra flexibility during a gradual migration.',
      reality: 'mixing the two APIs on the SAME property causes Angular to apply both bindings at once, producing confusing, hard-to-debug behavior — pick one API per property and migrate it fully, not partially.',
    },
    {
      thought: 'ngOnChanges still fires normally when a component uses signal-based input() instead of the decorator @Input().',
      reality: 'signal inputs do NOT trigger ngOnChanges at all — the reactive replacement is effect(() => { const v = this.prop(); ... }), which re-runs whenever the input signal\'s value changes.',
    },
  ];
}
