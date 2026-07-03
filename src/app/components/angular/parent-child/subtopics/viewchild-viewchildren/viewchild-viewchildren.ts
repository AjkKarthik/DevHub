import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../shared/theory-block/theory-block';
import { LivePlaygroundComponent, PlaygroundFile } from '../../../../shared/live-playground/live-playground';
import { TryItComponent, TryItExercise } from '../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-viewchild-viewchildren-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent,
    LivePlaygroundComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './viewchild-viewchildren.html',
  styleUrl: './viewchild-viewchildren.scss',
})
export class ViewchildViewchildrenSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'viewChild() — a signal, no ngAfterViewInit needed',
      points: [
        '<code>myEl = viewChild&lt;ElementRef&gt;(\'refName\');</code> queries a single child by template reference variable and returns <code>Signal&lt;T | undefined&gt;</code> — <code>undefined</code> before the view has rendered it, and the actual value once it has. There is no <code>ngAfterViewInit</code> lifecycle hook to write; just read the signal whenever and wherever you need it.',
        '<code>viewChild.required&lt;T&gt;(\'refName\')</code> asserts the element is ALWAYS present, returning <code>Signal&lt;T&gt;</code> with no <code>undefined</code> case in its type — use it when the queried element is structurally guaranteed to exist (not behind an <code>&#64;if</code>), removing null-checks everywhere it is read.',
      ],
    },
    {
      heading: 'viewChildren() — a reactive list',
      points: [
        '<code>viewChildren(ComponentType)</code> returns <code>Signal&lt;readonly T[]&gt;</code> containing every instance of that component type in the current view — the direct replacement for the old <code>&#64;ViewChildren</code> decorator.',
      ],
    },
    {
      heading: 'Reading inside computed() or effect() — genuinely reactive',
      points: [
        'Because <code>viewChild()</code>/<code>viewChildren()</code> return signals, reading them inside <code>computed()</code> or <code>effect()</code> makes those DEPEND on the query — Angular re-runs the computation/effect automatically whenever the view changes (for example, when an <code>&#64;if</code> block adds or removes the queried element), with no manual re-query call.',
      ],
    },
    {
      heading: 'Querying by more than just a template ref',
      points: [
        'You can query by COMPONENT TYPE (<code>viewChild(MyComponent)</code>), by DIRECTIVE type, or by INJECTION TOKEN — not only by a string template reference variable. This gives flexibility to query structural directive instances or any injectable marker, not just plain DOM elements.',
        'Both <code>viewChild</code> and <code>contentChild</code> support a <code>read</code> option: <code>viewChild(\'ref\', { read: ElementRef })</code> returns the underlying <code>ElementRef</code> of the queried element instead of the component instance — useful when you specifically need direct DOM access rather than the component\'s public API.',
      ],
    },
  ];

  liveDemoFiles: PlaygroundFile[] = [
    {
      path: 'src/app/fancy-input.ts',
      content: `import { Component, ElementRef, viewChild } from '@angular/core';

@Component({
  selector: 'app-fancy-input',
  standalone: true,
  template: \`<input #box type="text" placeholder="Click 'Focus' in the parent" />\`,
})
export class FancyInput {
  // required() — this element is always in the template, never conditionally rendered
  box = viewChild.required<ElementRef<HTMLInputElement>>('box');

  focus() {
    this.box().nativeElement.focus();
  }
}
`,
    },
    {
      path: 'src/app/app.ts',
      content: `import { Component, viewChild, effect } from '@angular/core';
import { FancyInput } from './fancy-input';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [FancyInput],
  template: \`
    <app-fancy-input />
    <button (click)="focusChild()">Focus the child's input</button>
  \`,
})
export class App {
  // Query the CHILD COMPONENT by its type — not a template ref string
  input = viewChild.required(FancyInput);

  constructor() {
    // Reading a viewChild() signal inside effect() re-runs reactively if the view changes
    effect(() => {
      console.log('FancyInput instance is available:', !!this.input());
    });
  }

  focusChild() {
    this.input().focus(); // calling a method directly on the queried child instance
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
  <head><title>viewChild and viewChildren</title></head>
  <body><app-root></app-root></body>
</html>
`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'Render three <app-fancy-input /> elements in the parent template and use viewChildren(FancyInput) to focus ALL of them at once when a button is clicked.',
    hint: 'inputs = viewChildren(FancyInput); then a method: focusAll() { this.inputs().forEach(i => i.focus()); } — viewChildren returns a readonly array signal, so .forEach() works directly on the result of calling it.',
    solution: `inputs = viewChildren(FancyInput);

focusAll() {
  this.inputs().forEach(input => input.focus());
}

// Template:
// <app-fancy-input /><app-fancy-input /><app-fancy-input />
// <button (click)="focusAll()">Focus all</button>`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'you need ngAfterViewInit to safely read a viewChild() value, same as the old @ViewChild decorator.',
      reality: 'viewChild() is a SIGNAL — read it anywhere, anytime; it simply returns undefined before the view has rendered the queried element and the real value once it has. There is no lifecycle hook required to know when it becomes available.',
    },
    {
      thought: 'viewChild()/viewChildren() can only query plain DOM elements by template reference variable.',
      reality: 'you can query by COMPONENT TYPE, DIRECTIVE TYPE, or INJECTION TOKEN as well — not just a string ref. The read option additionally lets you request the ElementRef of a queried item instead of its component instance.',
    },
    {
      thought: 'viewChild.required() still has to return undefined until the view finishes initializing, same as the non-required version.',
      reality: 'viewChild.required() returns Signal&lt;T&gt; with NO undefined case in its type at all — it is meant for elements structurally guaranteed to exist (never behind an @if), letting you skip null-checks entirely everywhere you read it.',
    },
  ];
}
