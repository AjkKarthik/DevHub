import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../shared/theory-block/theory-block';
import { LivePlaygroundComponent, PlaygroundFile } from '../../../../shared/live-playground/live-playground';
import { TryItComponent, TryItExercise } from '../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-defer-basics-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent,
    LivePlaygroundComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './defer-basics.html',
  styleUrl: './defer-basics.scss',
})
export class DeferBasicsSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'What &#64;defer actually does',
      points: [
        '<code>&#64;defer</code> (Angular 17+) lazy-loads a standalone component\'s JavaScript and renders it only once a trigger condition fires — instead of that component\'s code sitting eagerly inside <code>main.js</code> from the very first page load, it gets split into its OWN separate chunk at build time.',
        'You never write a manual <code>dynamic import()</code> yourself — Angular\'s compiler detects standalone components inside <code>&#64;defer</code> blocks and code-splits them automatically. The only thing YOU have to do is list the deferred component in the host\'s <code>imports[]</code> array, same as any normal import.',
      ],
    },
    {
      heading: 'The default trigger — on idle',
      points: [
        'With NO explicit trigger written, <code>&#64;defer</code> defaults to <code>on idle</code> — the chunk loads once the browser\'s main thread goes idle, equivalent to <code>requestIdleCallback()</code>. This is a reasonable default for below-the-fold content that should be READY without being urgent, though the next subtopic covers more targeted triggers.',
      ],
    },
    {
      heading: '@defer complements route-level lazy loading — it does not replace it',
      points: [
        '<code>loadComponent()</code> in the router splits code at ROUTE boundaries — a whole page\'s worth of code, loaded when the user navigates there. <code>&#64;defer</code> splits code at the TEMPLATE level — a single heavy widget, editor, or chart INSIDE an already-loaded page. Use route-level lazy loading for pages; use <code>&#64;defer</code> for the expensive parts of a page that not every visitor actually needs.',
      ],
    },
  ];

  liveDemoFiles: PlaygroundFile[] = [
    {
      path: 'src/app/heavy-widget.ts',
      content: `import { Component } from '@angular/core';

@Component({
  selector: 'app-heavy-widget',
  standalone: true,
  template: \`
    <div style="padding: 1rem; background: #dbeafe; border-radius: 8px;">
      📊 I'm the "heavy" widget — imagine a chart library or rich editor here.
      My JS chunk only downloaded once the trigger fired.
    </div>
  \`,
})
export class HeavyWidget {}
`,
    },
    {
      path: 'src/app/app.ts',
      content: `import { Component } from '@angular/core';
import { HeavyWidget } from './heavy-widget';

@Component({
  selector: 'app-root',
  standalone: true,
  // HeavyWidget must still be listed here — the compiler needs this to identify the chunk
  imports: [HeavyWidget],
  template: \`
    <h2>Scroll or wait — the widget below loads deferred (on idle, the default)</h2>
    <div style="height: 40vh; background: #f3f4f6;">(spacer — imagine page content here)</div>

    @defer {
      <app-heavy-widget />
    } @placeholder {
      <p>⬜ Placeholder — widget not loaded yet</p>
    }
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
  <head><title>@defer basics</title></head>
  <body><app-root></app-root></body>
</html>
`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'Add a second, EAGERLY-loaded (non-deferred) SmallWidget component right above the @defer block, so you can compare — it should render immediately with no placeholder involved.',
    hint: 'Create a small SmallWidget standalone component similar to HeavyWidget, add it to imports[], and just use it normally in the template: <app-small-widget /> above the @defer block — no @defer wrapper needed since it is not being deferred.',
    solution: `// small-widget.ts
@Component({
  selector: 'app-small-widget',
  standalone: true,
  template: \`<p>I loaded immediately — no @defer, no placeholder.</p>\`,
})
export class SmallWidget {}

// app.ts template:
// <app-small-widget />
// @defer { <app-heavy-widget /> } @placeholder { ... }`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'you need to write your own dynamic import() to make @defer work, similar to manual code-splitting in plain JavaScript.',
      reality: 'Angular\'s compiler handles the code-splitting automatically for any standalone component inside an @defer block — you write plain component syntax and normal imports[] entries; no manual import() call anywhere.',
    },
    {
      thought: '@defer is a replacement for route-level lazy loading (loadComponent()) — you should pick one or the other for a whole app.',
      reality: 'the two operate at different granularities and are meant to be used TOGETHER — loadComponent() splits at route boundaries (whole pages), @defer splits at the template level (individual heavy widgets within an already-loaded page).',
    },
    {
      thought: 'without an explicit trigger, a bare @defer block never loads its content at all.',
      reality: 'a bare @defer with no trigger written defaults to on idle — it still loads, just once the browser\'s main thread becomes idle (via requestIdleCallback()), not immediately on render.',
    },
  ];
}
