import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../shared/theory-block/theory-block';
import { LivePlaygroundComponent, PlaygroundFile } from '../../../../shared/live-playground/live-playground';
import { TryItComponent, TryItExercise } from '../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-template-refs-and-let-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent,
    LivePlaygroundComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './template-refs-and-let.html',
  styleUrl: './template-refs-and-let.scss',
})
export class TemplateRefsAndLetSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'Template reference variables — a direct handle, no class involved',
      points: [
        'A template reference <code>#ref</code> gives you a direct handle to a DOM element or component instance, usable ANYWHERE ELSE in the same template — no component class code needed at all. <code>#myInput</code> on an <code>&lt;input&gt;</code> lets you read <code>myInput.value</code> in an event handler elsewhere in the same template.',
        'What TYPE the reference resolves to depends on what it is placed on: a DOM element gives <code>HTMLElement</code>, a component gives the component INSTANCE, a directive gives the DIRECTIVE instance, and <code>&lt;ng-template&gt;</code> gives a <code>TemplateRef</code>. Disambiguate with <code>#f="ngForm"</code> to explicitly get the <code>NgForm</code> directive instance from a <code>&lt;form&gt;</code> element instead of the plain <code>HTMLFormElement</code>.',
      ],
    },
    {
      heading: '@let — a template-local variable',
      points: [
        '<code>&#64;let</code> (Angular 18+) declares a variable scoped to the CURRENT BLOCK: <code>&#64;let user = currentUser();</code>. It is ideal for aliasing the result of a signal call, an <code>async</code> pipe, or any expression you read MULTIPLE TIMES in the same block — computing it once instead of re-evaluating the same expression repeatedly.',
      ],
    },
    {
      heading: 'Scoping rules — both follow the same block boundaries',
      points: [
        'Template reference variables are scoped to their TEMPLATE. Inside a structural block (<code>&#64;if</code>/<code>&#64;for</code>) or an <code>&lt;ng-template&gt;</code>, a <code>#ref</code> declared inside is NOT accessible outside that block. <code>&#64;let</code> follows the exact same scoping rule — a variable declared inside an <code>&#64;if</code> block cannot be read outside it.',
      ],
    },
    {
      heading: 'Reading elements from the class — viewChild()/@ViewChild()',
      points: [
        'Both <code>viewChild(\'ref\')</code> (the signal API) and <code>&#64;ViewChild(\'ref\')</code> (the older decorator API) access a template reference variable FROM THE COMPONENT CLASS, not just within the template itself — covered in depth in the Parent-Child Communication topic. The signal-based <code>viewChild()</code> returns a <code>Signal</code> that resolves once the view has initialized, with no separate lifecycle hook required to know when.',
      ],
    },
  ];

  liveDemoFiles: PlaygroundFile[] = [
    {
      path: 'src/app/app.ts',
      content: `import { Component, signal } from '@angular/core';

interface User { name: string; role: string; }

@Component({
  selector: 'app-root',
  standalone: true,
  template: \`
    <!-- Template reference variable — a direct handle, read elsewhere in this template -->
    <input #nameInput placeholder="Type something" />
    <button (click)="log(nameInput.value)">Log input value</button>

    <!-- @let — computed once, reused twice in this block without re-evaluating -->
    @let user = currentUser();
    <p>Hello, {{ user.name }}!</p>
    <p>Your role is: {{ user.role }}</p>

    @if (user.role === 'admin') {
      <!-- @let scoping: this ONLY exists inside this @if block -->
      @let adminNote = 'You have elevated permissions.';
      <p>{{ adminNote }}</p>
    }
  \`,
})
export class App {
  currentUser = signal<User>({ name: 'Ada', role: 'admin' });

  log(value: string) {
    console.log('Input value:', value);
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
  <head><title>Template refs and @let</title></head>
  <body><app-root></app-root></body>
</html>
`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'Add a #confirmCheckbox template reference to a new checkbox input, and a button that logs whether it is checked using confirmCheckbox.checked.',
    hint: '<input #confirmCheckbox type="checkbox" /> then <button (click)="log(confirmCheckbox.checked)">Log checked state</button> — same pattern as nameInput, just reading .checked instead of .value.',
    solution: `<input #confirmCheckbox type="checkbox" />
<button (click)="log(confirmCheckbox.checked)">Log checked state</button>

// log() already accepts any value and logs it, so no class changes needed`,
  };

  misconceptions: Misconception[] = [
    {
      thought: '@let works like a regular JavaScript variable — declare it once and read it anywhere in the whole component template.',
      reality: '@let is scoped to the block it is declared in, exactly like a template reference variable — a @let declared inside an @if block is not accessible outside that block, the same scoping rule that applies to #ref variables.',
    },
    {
      thought: 'a template reference variable always gives you the plain DOM element, regardless of what it is placed on.',
      reality: 'the type depends entirely on what the reference is placed ON — a DOM element gives HTMLElement, but placing it on a COMPONENT gives the component instance, and on a directive gives the directive instance. #f="ngForm" is how you explicitly request the NgForm directive instance instead of the raw form element.',
    },
    {
      thought: '@let and template reference variables serve completely different, unrelated purposes.',
      reality: 'they solve related problems from different angles — #ref gives a handle to an ELEMENT/component, while @let gives a name to the result of an EXPRESSION (like a signal call or async-piped value) — both exist to avoid re-writing or re-evaluating the same thing repeatedly in a template.',
    },
  ];
}
