import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../shared/theory-block/theory-block';
import { LivePlaygroundComponent, PlaygroundFile } from '../../../../shared/live-playground/live-playground';
import { TryItComponent, TryItExercise } from '../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-embedded-views-dynamic-cd-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent,
    LivePlaygroundComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './embedded-views-dynamic-cd.html',
  styleUrl: './embedded-views-dynamic-cd.scss',
})
export class EmbeddedViewsDynamicCdSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'Embedded views — what @for and @if actually create',
      points: [
        'Every <code>&#64;for</code> iteration and every truthy <code>&#64;if</code> branch creates an EMBEDDED VIEW — a distinct unit in Angular\'s internal view tree, each with its own change-detection participation, separate from the "component" concept entirely. This is why structural directives historically compiled down to <code>&lt;ng-template&gt;</code> — a template is exactly the blueprint an embedded view is instantiated from.',
        'Embedded views created inside an OnPush component are still subject to that component\'s OnPush gate — they are only checked when the HOST component is checked. A signal read inside an <code>&#64;for</code> loop body still participates in the SAME surgical tracking as any other template expression in that component.',
        'When <code>&#64;for</code>\'s tracked collection changes, Angular reconciles by <code>track</code> key — matching, moving, creating, and destroying individual embedded views rather than tearing down and rebuilding the whole list. Each surviving embedded view keeps its own local state (e.g. an expanded/collapsed toggle) across reorders, as long as the tracked key is stable.',
      ],
    },
    {
      heading: 'Dynamically created components and CD attachment',
      points: [
        '<code>viewContainerRef.createComponent(MyComponent)</code> creates a component instance that IS automatically attached to the CD tree at the container\'s position — it participates in future CD cycles exactly like a component that existed in the template from the start, no manual registration required.',
        'The returned <code>ComponentRef</code> exposes its own <code>changeDetectorRef</code> — call <code>ref.changeDetectorRef.detectChanges()</code> to force an immediate update of just that dynamically created instance, independent of its host\'s next cycle.',
        'Destroying dynamically created components MATTERS for CD, not just memory — a component left in the tree via a stale <code>ComponentRef</code> that is never <code>.destroy()</code>-ed continues being visited on every CD cycle that reaches its position, silently costing performance even if it renders nothing visible.',
      ],
    },
  ];

  liveDemoFiles: PlaygroundFile[] = [
    {
      path: 'src/app/app.ts',
      content: `import { Component, ViewContainerRef, viewChild, signal, ChangeDetectionStrategy } from '@angular/core';

@Component({
  selector: 'app-counter-widget',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: \`<button (click)="count.set(count() + 1)">Dynamic widget clicks: {{ count() }}</button>\`,
})
class CounterWidget {
  count = signal(0);
}

@Component({
  selector: 'app-root',
  standalone: true,
  template: \`
    <h3>Dynamically created components auto-attach to the CD tree</h3>
    <button (click)="addWidget()">Add a dynamic widget</button>
    <button (click)="removeLast()">Remove last widget</button>
    <div #host></div>
    <p>Active widgets: {{ refs.length }}</p>
  \`,
})
export class App {
  private host = viewChild.required('host', { read: ViewContainerRef });
  refs: any[] = [];

  addWidget() {
    // Auto-attached to CD — no manual registration needed
    const ref = this.host().createComponent(CounterWidget);
    this.refs.push(ref);
  }

  removeLast() {
    // .destroy() removes it from the CD tree — forgetting this leaks a CD-visited node
    const ref = this.refs.pop();
    ref?.destroy();
  }
}
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
  <head><title>Embedded views and dynamic component CD</title></head>
  <body><app-root></app-root></body>
</html>
`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'Add a "Remove all" button that pops and destroys every ref in the refs array, verifying the widget count drops to 0.',
    hint: 'Add a removeAll() method that loops: while (this.refs.length) { this.refs.pop()?.destroy(); } — then wire it to a new button in the template.',
    solution: `removeAll() {
  while (this.refs.length) {
    this.refs.pop()?.destroy();
  }
}`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'a component created via viewContainerRef.createComponent() needs to be manually registered with Angular\'s change detection before it will update.',
      reality: 'it is automatically attached to the CD tree at the container\'s position the moment it is created — it participates in future cycles exactly like a template-declared component, with no manual registration step.',
    },
    {
      thought: '@for reordering a list always destroys and recreates the DOM/component instances for reordered items.',
      reality: 'with a stable track key, Angular reconciles embedded views by matching, moving, creating, and destroying individually — surviving items keep their own local state across reorders instead of being torn down and rebuilt.',
    },
    {
      thought: 'forgetting to call .destroy() on a dynamically created ComponentRef is only a memory-leak concern.',
      reality: 'it is also a CD performance concern — a component left attached but never destroyed continues being visited on every CD cycle that reaches its position, even if it is invisible or produces no useful output.',
    },
  ];
}
