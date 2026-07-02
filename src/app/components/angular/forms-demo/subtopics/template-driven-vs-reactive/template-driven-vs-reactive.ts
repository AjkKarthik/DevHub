import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../shared/theory-block/theory-block';
import { LivePlaygroundComponent, PlaygroundFile } from '../../../../shared/live-playground/live-playground';
import { TryItComponent, TryItExercise } from '../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-template-driven-vs-reactive-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent,
    LivePlaygroundComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './template-driven-vs-reactive.html',
  styleUrl: './template-driven-vs-reactive.scss',
})
export class TemplateDrivenVsReactiveSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'Template-driven — the form model lives in the DOM',
      points: [
        '<code>FormsModule</code> + <code>[(ngModel)]</code> — Angular creates <code>FormControl</code> instances implicitly, one per <code>ngModel</code>-bound element, and tracks them internally. You never see a <code>FormGroup</code> object in your class.',
        'Validation is declared as HTML attributes: <code>required</code>, <code>minlength</code>, <code>pattern</code>, <code>email</code>. Angular reads these and attaches the matching built-in validator automatically — no TypeScript validator array to write.',
        'You access control state via a template reference variable: <code>#email="ngModel"</code>, then <code>email.invalid</code> / <code>email.touched</code> / <code>email.errors</code> anywhere later in the SAME template. The whole form is <code>#f="ngForm"</code>.',
      ],
    },
    {
      heading: 'Reactive — the form model lives in the class',
      points: [
        '<code>ReactiveFormsModule</code> + <code>FormBuilder</code> — you explicitly define the model as a <code>FormGroup</code> in the component class; the template just binds to it via <code>[formGroup]</code> and <code>formControlName</code>. The template is a VIEW of a model that exists independently of it.',
        'Because the model is a plain TypeScript object, it can be constructed, populated, and asserted on in a unit test with zero DOM involved — this is the core practical advantage over template-driven forms as complexity grows.',
      ],
    },
    {
      heading: 'Choosing between them is not a style preference — it is about form complexity',
      points: [
        'Template-driven suits small, static forms with straightforward validation — a login form, a search box, a one-off contact form. Less boilerplate, but harder to unit-test and harder to add dynamic fields to.',
        'Reactive suits anything with cross-field validation, dynamically added/removed fields (<code>FormArray</code>), complex conditional logic, or a genuine need to unit-test form behavior in isolation. Nearly every Angular style guide recommends reactive forms as the default for forms with more than a couple of fields.',
      ],
    },
    {
      heading: 'Never mix the two APIs on the same form',
      points: [
        'Importing both <code>FormsModule</code> and <code>ReactiveFormsModule</code> and using <code>ngModel</code> INSIDE a <code>[formGroup]</code>-bound form produces a real Angular console error — the two APIs both try to own the control\'s value and conflict. Pick one per form; it is fine for different forms in the same app to use different approaches.',
      ],
    },
  ];

  liveDemoFiles: PlaygroundFile[] = [
    {
      path: 'src/app/app.ts',
      content: `import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [FormsModule, ReactiveFormsModule],
  template: \`
    <h3>Template-driven</h3>
    <form #f="ngForm" (ngSubmit)="submitTemplate()">
      <input name="email" [(ngModel)]="templateEmail" required email #email="ngModel" />
      @if (email.invalid && email.touched) {
        <p>Enter a valid email.</p>
      }
      <button type="submit" [disabled]="f.invalid">Submit (template-driven)</button>
    </form>

    <h3>Reactive</h3>
    <form [formGroup]="reactiveForm" (ngSubmit)="submitReactive()">
      <input formControlName="email" />
      @if (reactiveForm.controls.email.invalid && reactiveForm.controls.email.touched) {
        <p>Enter a valid email.</p>
      }
      <button type="submit" [disabled]="reactiveForm.invalid">Submit (reactive)</button>
    </form>

    <p>Last submitted: {{ lastSubmitted() }}</p>
  \`,
})
export class App {
  private fb = inject(FormBuilder);

  templateEmail = '';
  reactiveForm = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
  });

  lastSubmitted = signal('nothing yet');

  submitTemplate() { this.lastSubmitted.set('template-driven: ' + this.templateEmail); }
  submitReactive() { this.lastSubmitted.set('reactive: ' + this.reactiveForm.getRawValue().email); }
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
  <head><title>Template-driven vs reactive</title></head>
  <body><app-root></app-root></body>
</html>
`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'Add a "name" field (required, min length 2) to BOTH forms — the template-driven one with ngModel + a template reference variable, and the reactive one via the FormBuilder group.',
    hint: 'Template-driven: `<input name="name" [(ngModel)]="templateName" required minlength="2" #name="ngModel" />`. Reactive: add `name: [\'\', [Validators.required, Validators.minLength(2)]]` to the fb.nonNullable.group() call.',
    solution: `// Template-driven template addition:
// <input name="name" [(ngModel)]="templateName" required minlength="2" #name="ngModel" />
templateName = '';

// Reactive form addition:
reactiveForm = this.fb.nonNullable.group({
  name:  ['', [Validators.required, Validators.minLength(2)]],
  email: ['', [Validators.required, Validators.email]],
});`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'reactive forms are strictly "better" and template-driven forms are outdated / should not be used anymore.',
      reality: 'both are fully supported, actively maintained APIs — template-driven forms remain genuinely simpler and less boilerplate-heavy for small, static forms. Reactive forms win specifically as complexity grows (cross-field validation, dynamic fields, unit testing), not universally.',
    },
    {
      thought: 'you can mix ngModel and formControlName on the same form for extra flexibility.',
      reality: 'using ngModel inside a form bound with [formGroup] causes a real conflict — both APIs try to control the same value and Angular logs a console error. Each form must pick one approach, though different forms in the same app can differ.',
    },
    {
      thought: 'in a template-driven form, validation logic lives in the component class, same as reactive forms.',
      reality: 'template-driven validation is declared as HTML attributes (required, minlength, pattern) directly on the element — there is no validators array in the class. The class only reads the resulting state via template reference variables like #email="ngModel".',
    },
  ];
}
