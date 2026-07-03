import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../shared/theory-block/theory-block';
import { LivePlaygroundComponent, PlaygroundFile } from '../../../../shared/live-playground/live-playground';
import { TryItComponent, TryItExercise } from '../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-reactive-forms-basics-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent,
    LivePlaygroundComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './reactive-forms-basics.html',
  styleUrl: './reactive-forms-basics.scss',
})
export class ReactiveFormsBasicsSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'FormBuilder — building a typed form model in the class',
      points: [
        '<code>fb.group({ title: [\'\', [Validators.required, Validators.minLength(3)]] })</code> creates a <code>FormGroup</code>. Each field is an array: first element is the default value, second is the synchronous validators array, an optional third is async validators.',
        'The form model lives entirely in the TypeScript class — this is the defining difference from template-driven forms. The template only SYNCS to it, via the <code>[formGroup]</code> and <code>formControlName</code> directives, which is what makes reactive forms straightforward to unit test without rendering anything.',
      ],
    },
    {
      heading: 'Typed forms — nonNullable removes the null noise',
      points: [
        'Since Angular 14, <code>form.controls.title</code> is typed as <code>FormControl&lt;string | null&gt;</code> by default — reflecting that <code>.reset()</code> can set a control back to <code>null</code>. Call <code>fb.nonNullable.group({...})</code> instead of <code>fb.group({...})</code> to get <code>FormControl&lt;string&gt;</code> (no <code>null</code>) — cleaner typings when you know a field should never actually be null after reset (it resets to the default value instead).',
      ],
    },
    {
      heading: 'form.value vs form.getRawValue()',
      points: [
        '<code>form.value</code> silently EXCLUDES any disabled control from the returned object. <code>form.getRawValue()</code> always includes every control regardless of its disabled state. This distinction only matters once a form has disabled fields — but when it does matter, using the wrong one is a real, easy-to-miss bug: a disabled field\'s value quietly goes missing from your submit payload.',
      ],
    },
    {
      heading: 'Reading validation errors',
      points: [
        '<code>control.errors</code> is <code>null</code> when the control is valid, or an object like <code>{ required: true }</code> or <code>{ minlength: { requiredLength: 3, actualLength: 1 } }</code> when invalid — one key per failing validator. Access a specific error with <code>control.errors?.[\'minlength\']</code>.',
        '<code>Validators.compose([v1, v2])</code> merges multiple validator functions into one — but you rarely need it explicitly, since passing an array of validators to <code>fb.group()</code> already composes them for you.',
      ],
    },
  ];

  liveDemoFiles: PlaygroundFile[] = [
    {
      path: 'src/app/app.ts',
      content: `import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { JsonPipe } from '@angular/common';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [ReactiveFormsModule, JsonPipe],
  template: \`
    <form [formGroup]="form" (ngSubmit)="submit()">
      <input
        formControlName="title"
        placeholder="Title (min 3 chars)"
        [class.error]="titleControl.invalid && titleControl.touched" />

      @if (titleControl.touched && titleControl.errors) {
        @if (titleControl.errors['required'])  { <p>Title is required.</p> }
        @if (titleControl.errors['minlength']) { <p>Minimum 3 characters.</p> }
      }

      <button type="submit">Submit</button>
    </form>
    <pre>value: {{ form.value | json }}</pre>
  \`,
  styles: [\`.error { border-color: red; }\`],
})
export class App {
  private fb = inject(FormBuilder);

  form = this.fb.nonNullable.group({
    title: ['', [Validators.required, Validators.minLength(3)]],
  });

  get titleControl() { return this.form.controls.title; }

  submit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    console.log('submitted:', this.form.getRawValue());
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
  <head><title>Reactive forms basics</title></head>
  <body><app-root></app-root></body>
</html>
`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'Add an "email" field to the form with Validators.required and Validators.email, and show a "Enter a valid email." message when the email error is present and the field is touched.',
    hint: 'email: [\'\', [Validators.required, Validators.email]] in the fb.nonNullable.group() call, then a get emailControl() { return this.form.controls.email; } getter, then the same touched-and-errors pattern in the template with errors[\'email\'].',
    solution: `form = this.fb.nonNullable.group({
  title: ['', [Validators.required, Validators.minLength(3)]],
  email: ['', [Validators.required, Validators.email]],
});

get emailControl() { return this.form.controls.email; }

// Template:
// @if (emailControl.touched && emailControl.errors?.['email']) {
//   <p>Enter a valid email.</p>
// }`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'FormsModule and ReactiveFormsModule are interchangeable — either works for formControlName.',
      reality: '<code>FormsModule</code> provides template-driven directives (<code>ngModel</code>). <code>ReactiveFormsModule</code> provides reactive directives (<code>formGroup</code>, <code>formControlName</code>). Importing the wrong one for <code>formControlName</code> throws a runtime error: "NG8002: Can\'t bind to \'formControlName\'".',
    },
    {
      thought: 'control.errors is an empty object {} when the control is valid.',
      reality: '<code>control.errors</code> is <code>null</code> when valid, not an empty object — checking <code>if (control.errors)</code> works correctly because <code>null</code> is falsy, but assuming it is always an object (e.g. calling <code>Object.keys(control.errors)</code> unconditionally) throws when the control is valid.',
    },
    {
      thought: 'form.value always contains every control\'s value, the same as getRawValue().',
      reality: 'form.value silently omits any DISABLED control — it will not even appear as a key in the returned object. form.getRawValue() always includes every control. This only differs once a form has disabled fields, but it is a genuinely common production bug when it does.',
    },
  ];
}
