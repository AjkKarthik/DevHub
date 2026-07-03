import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../shared/theory-block/theory-block';
import { LivePlaygroundComponent, PlaygroundFile } from '../../../../shared/live-playground/live-playground';
import { TryItComponent, TryItExercise } from '../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-form-state-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent,
    LivePlaygroundComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './form-state.html',
  styleUrl: './form-state.scss',
})
export class FormStateSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'touched vs dirty — two different questions',
      points: [
        '<code>control.touched</code> becomes <code>true</code> once the user focuses AND THEN blurs the field — it says nothing about whether the value actually changed. A user who tabs through a field without typing still makes it touched.',
        '<code>control.dirty</code> becomes <code>true</code> the moment the VALUE changes from its initial value — it says nothing about focus/blur. Programmatically calling <code>control.setValue(...)</code> also makes it dirty.',
        'The standard pattern — show validation errors only when <code>touched && invalid</code> — deliberately uses touched, not dirty: it catches the common case of a user tabbing past a required field without typing anything, which dirty alone would miss.',
      ],
    },
    {
      heading: 'markAllAsTouched() — for the submit button',
      points: [
        '<code>form.markAllAsTouched()</code> marks every control (and nested group) as touched in one call — the standard thing to run in a submit handler BEFORE checking <code>form.invalid</code>, so that a user who never focused a required field still sees its error the moment they try to submit.',
      ],
    },
    {
      heading: 'reset(), patchValue(), and setValue() — three different operations',
      points: [
        '<code>form.reset()</code> resets every control back to its INITIAL value and clears touched/dirty/errors on all of them — this is a full reset, not just a value clear.',
        '<code>form.reset({ title: \'default\' })</code> resets to specific values instead of the original initial values, still clearing touched/dirty.',
        '<code>form.patchValue({ title: \'x\' })</code> updates ONLY the keys you provide, leaving everything else untouched — safe to call with a partial object. <code>form.setValue({...})</code> requires EVERY control\'s key to be present — it throws if any is missing. Use <code>patchValue()</code> when pre-filling from an API response that might not include every field.',
      ],
    },
    {
      heading: 'valueChanges and statusChanges — the form as an Observable stream',
      points: [
        '<code>control.valueChanges</code> is an <code>Observable</code> that emits every time the value changes — pipe it through <code>debounceTime(300)</code> for a live-search-style UI reacting to typed input.',
        '<code>form.statusChanges</code> emits <code>\'VALID\'</code> / <code>\'INVALID\'</code> / <code>\'PENDING\'</code> every time validation re-runs — useful for driving a submit button\'s disabled state reactively instead of re-checking <code>form.invalid</code> manually on every change.',
      ],
    },
    {
      heading: 'disable() and enable() — form-level vs control-level',
      points: [
        '<code>form.disable()</code>/<code>form.enable()</code> affects every control in the group at once; <code>control.disable()</code>/<code>control.enable()</code> affects just that one control. A disabled control is excluded from <code>form.value</code> (but still present in <code>form.getRawValue()</code>, as covered earlier) and does not run its validators — a disabled required field reads as VALID.',
      ],
    },
  ];

  liveDemoFiles: PlaygroundFile[] = [
    {
      path: 'src/app/app.ts',
      content: `import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [ReactiveFormsModule],
  template: \`
    <form [formGroup]="form">
      <input formControlName="title" placeholder="Title" />
    </form>

    <p>touched: {{ titleControl.touched }} | dirty: {{ titleControl.dirty }}</p>
    <p>form status: {{ form.status }}</p>

    <button (click)="form.markAllAsTouched()">Mark all touched</button>
    <button (click)="form.reset()">Reset (clears value + touched + dirty)</button>
    <button (click)="form.patchValue({ title: 'Patched value' })">Patch title only</button>
  \`,
})
export class App {
  private fb = inject(FormBuilder);

  form = this.fb.nonNullable.group({
    title: ['', [Validators.required, Validators.minLength(3)]],
  });

  get titleControl() { return this.form.controls.title; }

  constructor() {
    this.form.valueChanges.subscribe(v => console.log('valueChanges:', v));
    this.form.statusChanges.subscribe(s => console.log('statusChanges:', s));
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
  <head><title>Form state</title></head>
  <body><app-root></app-root></body>
</html>
`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'Add a "Fill sample data" button that calls form.patchValue({ title: \'Sample task\' }) — verify it updates the value but does NOT reset touched/dirty state the way reset() does.',
    hint: 'A single new button: `<button (click)="form.patchValue({ title: \'Sample task\' })">Fill sample data</button>` — patchValue() only changes the value/dirty-from-typing state, it does not clear touched or reset dirty back to false the way reset() does.',
    solution: `<button (click)="form.patchValue({ title: 'Sample task' })">
  Fill sample data
</button>`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'touched and dirty mean the same thing — both become true as soon as the user interacts with the field.',
      reality: 'touched tracks focus+blur; dirty tracks whether the VALUE changed. A user can tab through a field (touched=true) without typing (dirty stays false), or a value can be set programmatically (dirty=true) without any focus event ever happening (touched stays false).',
    },
    {
      thought: 'form.reset() only clears the displayed value — touched and dirty state persist so errors stay visible.',
      reality: 'form.reset() clears value AND resets touched/dirty/errors on every control back to their initial state — validation error messages disappear immediately after reset() because the controls are no longer touched.',
    },
    {
      thought: 'patchValue() and setValue() behave the same way, just with different names.',
      reality: 'patchValue() accepts a PARTIAL object and silently ignores missing keys. setValue() requires every control\'s key to be present in the object and THROWS if any is missing — they are not interchangeable, and using setValue() with an incomplete object is a runtime error, not a silent partial update.',
    },
  ];
}
