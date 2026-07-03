import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../shared/theory-block/theory-block';
import { LivePlaygroundComponent, PlaygroundFile } from '../../../../shared/live-playground/live-playground';
import { TryItComponent, TryItExercise } from '../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-control-flow-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent,
    LivePlaygroundComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './control-flow.html',
  styleUrl: './control-flow.scss',
})
export class ControlFlowSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'Signals read directly inside @if and @for — no pipe, no subscription',
      points: [
        'The built-in control flow blocks (<code>&#64;if</code>, <code>&#64;for</code>, <code>&#64;switch</code>) just call your signal like any other expression: <code>&#64;if (count() > 0) { ... }</code>, <code>&#64;for (item of items(); track item.id) { ... }</code>. There is no <code>| async</code> equivalent needed — a signal read in a template is automatically tracked, exactly like a signal read inside <code>computed()</code>.',
        'Because it is tracked, the block only re-evaluates when a signal it actually reads changes — the same fine-grained reactivity you get everywhere else with signals.',
      ],
    },
    {
      heading: '@if — narrowing and aliasing with "as"',
      points: [
        '<code>&#64;if (user(); as u) { <p>{{ u.name }}</p> }</code> — the expression\'s value is captured into a local template variable <code>u</code>, available inside that block (and any <code>&#64;else if</code>/<code>&#64;else</code> attached to it). This is the direct replacement for <code>*ngIf="user$ | async as u"</code>, but reading a signal instead of piping an observable.',
        '<code>&#64;else if (...)</code> and a trailing <code>&#64;else { ... }</code> chain onto the same <code>&#64;if</code> block — no separate <code>&lt;ng-template&gt;</code> needed like the old structural-directive syntax required.',
      ],
    },
    {
      heading: '@for — track is mandatory, not optional',
      points: [
        '<code>&#64;for (item of items(); track item.id) { ... }</code> — unlike <code>*ngFor</code>\'s optional <code>trackBy</code>, the new <code>&#64;for</code> block will not compile without a <code>track</code> expression. This is deliberate: Angular wants every loop to have a stable identity so it can reuse DOM nodes instead of tearing down and rebuilding them on every change.',
        'Track by a unique, stable field (<code>item.id</code>) whenever one exists. Falling back to <code>track $index</code> is allowed and sometimes fine for static lists, but for anything that reorders, inserts, or removes items, index-tracking causes Angular to reuse the wrong DOM node for the wrong item — form inputs and component state can end up attached to the wrong row.',
        'Inside the block you get implicit context variables: <code>$index</code>, <code>$first</code>, <code>$last</code>, <code>$even</code>, <code>$odd</code>, <code>$count</code> — no <code>let i = index</code> syntax required.',
      ],
    },
    {
      heading: '@empty — a built-in empty state for @for',
      points: [
        '<code>&#64;for (item of items(); track item.id) { ... } &#64;empty { <p>No items yet.</p> }</code> — the <code>&#64;empty</code> block renders automatically when the iterable is empty, replacing the old pattern of a separate <code>&#64;if (items().length === 0)</code> check living next to the loop.',
      ],
    },
  ];

  liveDemoFiles: PlaygroundFile[] = [
    {
      path: 'src/app/app.ts',
      content: `import { Component, signal } from '@angular/core';

interface Task { id: number; label: string; done: boolean; }

@Component({
  selector: 'app-root',
  standalone: true,
  template: \`
    <h2>Tasks ({{ tasks().length }})</h2>

    <button (click)="showDone.set(!showDone())">
      {{ showDone() ? 'Hide' : 'Show' }} completed
    </button>

    <ul>
      @for (t of visibleTasks(); track t.id) {
        <li [class.done]="t.done">
          {{ t.label }}
          @if (t.done) { <span> ✓</span> }
        </li>
      } @empty {
        <li><em>Nothing to show.</em></li>
      }
    </ul>

    <button (click)="toggleFirst()">Toggle first task</button>
  \`,
  styles: [\`.done { text-decoration: line-through; opacity: .6; }\`],
})
export class App {
  tasks = signal<Task[]>([
    { id: 1, label: 'Learn signal()', done: true },
    { id: 2, label: 'Learn computed()', done: true },
    { id: 3, label: 'Learn @if / @for', done: false },
  ]);

  showDone = signal(true);

  // A derived, filtered view — computed() + @for work together naturally
  visibleTasks = () =>
    this.showDone() ? this.tasks() : this.tasks().filter(t => !t.done);

  toggleFirst() {
    this.tasks.update(list =>
      list.map((t, i) => (i === 0 ? { ...t, done: !t.done } : t))
    );
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
  <head><title>@if / @for basics</title></head>
  <body><app-root></app-root></body>
</html>
`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'Add an @else block to the "Toggle first task" example\'s @if(t.done) so it shows "⏳" for tasks that are not done, instead of showing nothing.',
    hint: '@if (t.done) { <span> &#10003;</span> } @else { <span> &#9203;</span> } — @else attaches directly to the preceding @if, no separate template needed.',
    solution: `<li [class.done]="t.done">
  {{ t.label }}
  @if (t.done) {
    <span> ✓</span>
  } @else {
    <span> ⏳</span>
  }
</li>`,
  };

  misconceptions: Misconception[] = [
    {
      thought: '@for works like *ngFor, so track is optional and defaults to identity comparison.',
      reality: '<code>track</code> is a required part of the <code>&#64;for</code> syntax — the template will not compile without it. There is no implicit default; you must always say what to track by (an id field, or <code>$index</code> as a fallback).',
    },
    {
      thought: 'you need "| async" or a subscription to read a signal inside @if/@for, same as you would for an Observable.',
      reality: 'signals are read by simply calling them — <code>&#64;if (count() > 0)</code> — no pipe needed. The <code>| async</code> pipe is for Observables specifically; it does not apply to signals at all.',
    },
    {
      thought: '@empty is a general-purpose "else" you can attach to any block, including @if.',
      reality: '<code>&#64;empty</code> is specific to <code>&#64;for</code> and only fires when the iterated collection has zero items. For <code>&#64;if</code>, the equivalent is <code>&#64;else</code>.',
    },
  ];
}
