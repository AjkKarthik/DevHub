import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../shared/theory-block/theory-block';
import { LivePlaygroundComponent, PlaygroundFile } from '../../../../shared/live-playground/live-playground';
import { TryItComponent, TryItExercise } from '../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-view-content-hooks-afternextrender-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent,
    LivePlaygroundComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './view-content-hooks-afternextrender.html',
  styleUrl: './view-content-hooks-afternextrender.scss',
})
export class ViewContentHooksAfternextrenderSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'ngAfterViewInit — the earliest safe point to touch the DOM',
      points: [
        '<code>ngAfterViewInit</code> fires ONCE, after Angular has fully rendered the component\'s OWN template AND its child component trees. This is the earliest safe point to read <code>&#64;ViewChild</code>/<code>viewChild()</code> element dimensions, call methods on child components, or integrate a third-party library that needs a real DOM node to attach to.',
      ],
    },
    {
      heading: 'ngAfterContentInit — for projected content',
      points: [
        '<code>ngAfterContentInit</code> fires ONCE, after content PROJECTED via <code>&lt;ng-content&gt;</code> has been initialized — use it to access <code>&#64;ContentChild</code>/<code>contentChild()</code> references. It fires BEFORE <code>ngAfterViewInit</code> in the documented sequence — content from outside is initialized before the component\'s own view finishes.',
      ],
    },
    {
      heading: 'The "Checked" variants — side-effect-free or risk an error',
      points: [
        '<code>ngAfterViewChecked</code> and <code>ngAfterContentChecked</code> fire after EVERY change detection cycle, including cycles triggered by CHILD components. Keep them side-effect free — writing to any signal or data property inside them risks <code>ExpressionChangedAfterCheckedError</code>, because Angular has already snapshotted values for the CURRENT cycle by the time these fire.',
      ],
    },
    {
      heading: 'afterNextRender / afterRender — the SSR-safe modern replacement',
      points: [
        '<code>afterNextRender(callback)</code> (Angular 17+) runs EXACTLY ONCE, after the browser paints the first frame — the SSR-safe replacement for DOM access that used to live in <code>ngAfterViewInit</code>. <code>afterRender(callback)</code> runs after EVERY paint instead — reach for it specifically for animations or continuous DOM synchronization, not as a default.',
        'Both accept an optional PHASE: <code>{ earlyRead, read, mixedReadWrite, write }</code> — specifying the correct phase lets Angular batch DOM reads and writes efficiently across all registered callbacks and avoid layout thrashing. The default is <code>mixedReadWrite</code>, which is safe but not the most efficient option when you know in advance whether your callback only reads or only writes.',
      ],
    },
  ];

  liveDemoFiles: PlaygroundFile[] = [
    {
      path: 'src/app/measured-box.ts',
      content: `import { Component, ElementRef, afterNextRender, viewChild } from '@angular/core';

@Component({
  selector: 'app-measured-box',
  standalone: true,
  template: \`<div #box style="padding: 1rem; background: #dbeafe; width: fit-content;">Measure me</div>
    <p>Width: {{ width }}px</p>\`,
})
export class MeasuredBox {
  boxRef = viewChild.required<ElementRef<HTMLDivElement>>('box');
  width = 0;

  constructor() {
    // SSR-safe — runs once after the browser has actually painted the first frame
    afterNextRender(() => {
      this.width = this.boxRef().nativeElement.getBoundingClientRect().width;
    }, { phase: 'read' });
  }
}
`,
    },
    {
      path: 'src/app/app.ts',
      content: `import { Component } from '@angular/core';
import { MeasuredBox } from './measured-box';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [MeasuredBox],
  template: \`<app-measured-box />\`,
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
  <head><title>View and content hooks</title></head>
  <body><app-root></app-root></body>
</html>
`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'Add a second afterRender() call (not afterNextRender) that logs the box\'s current width to the console on every single paint — and note in a comment why this would be wasteful to leave in production code for a static (non-animating) box.',
    hint: 'afterRender(() => { console.log(this.boxRef().nativeElement.getBoundingClientRect().width); }); — afterRender fires on EVERY paint, so for a box that never changes size, this logs the exact same value repeatedly forever, wasted work with no benefit.',
    solution: `import { afterRender } from '@angular/core';

constructor() {
  afterNextRender(() => {
    this.width = this.boxRef().nativeElement.getBoundingClientRect().width;
  }, { phase: 'read' });

  // Wasteful for a static box — logs on every paint even though nothing changes.
  // afterRender() is meant for genuinely continuous sync (animations), not one-off reads.
  afterRender(() => {
    console.log('width:', this.boxRef().nativeElement.getBoundingClientRect().width);
  });
}`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'ngAfterContentInit fires after ngAfterViewInit, since "content" sounds like it should come after the main "view".',
      reality: 'ngAfterContentInit fires BEFORE ngAfterViewInit in the documented sequence — projected content initializes before the component\'s own view finishes rendering, the opposite order the names might suggest.',
    },
    {
      thought: 'it is safe to update a signal or data property inside ngAfterViewChecked as long as the update is simple.',
      reality: 'any write inside a "Checked" hook risks ExpressionChangedAfterCheckedError, regardless of how simple the write is — Angular has already snapshotted values for the current cycle by the time these hooks run, and a change violates that snapshot.',
    },
    {
      thought: 'afterRender() and afterNextRender() are just two names for the same thing, one newer than the other.',
      reality: 'they behave genuinely differently — afterNextRender() runs exactly ONCE, while afterRender() runs after EVERY single paint. Using afterRender() where afterNextRender() was intended means the callback keeps re-running forever, often pointlessly.',
    },
  ];
}
