import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../shared/theory-block/theory-block';
import { LivePlaygroundComponent, PlaygroundFile } from '../../../../shared/live-playground/live-playground';
import { TryItComponent, TryItExercise } from '../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-typed-forms-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent,
    LivePlaygroundComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './typed-forms.html',
  styleUrl: './typed-forms.scss',
})
export class TypedFormsSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'Since Angular 14, reactive forms are typed by default',
      points: [
        '<code>FormControl&lt;string&gt;</code>, <code>FormGroup&lt;{ name: FormControl&lt;string&gt; }&gt;</code> carry generic type parameters that describe exactly what shape of data the form holds — this is not an opt-in feature you have to enable, it is how <code>FormBuilder</code>/<code>FormGroup</code>/<code>FormControl</code> behave by default since Angular 14.',
        'You almost never write these generics by hand: <code>fb.group({ name: [\'\', Validators.required] })</code> INFERS <code>FormGroup&lt;{ name: FormControl&lt;string | null&gt; }&gt;</code> automatically from the initial value you passed.',
      ],
    },
    {
      heading: 'The payoff: typos and shape mistakes become compile errors',
      points: [
        '<code>form.controls.emal</code> (a typo for <code>email</code>) is a TypeScript compile error, not a silent <code>undefined</code> at runtime that only surfaces as a bug report later. This is the single biggest practical benefit of typed forms — the exact class of bug that used to only appear in production now gets caught while you are still writing the code.',
      ],
    },
    {
      heading: 'form.value vs form.getRawValue() — the types differ, not just the runtime behavior',
      points: [
        '<code>form.value</code> is typed as a PARTIAL object — every field is optional in the type — because disabled controls are silently omitted at runtime, and TypeScript reflects that possibility in the type. <code>form.getRawValue()</code> returns the COMPLETE, non-partial typed object, since it always includes every control. This mirrors the runtime behavior covered earlier, but now the type checker itself will flag code that assumes a <code>form.value</code> field is always present.',
      ],
    },
    {
      heading: 'Migrating older code — UntypedFormControl / UntypedFormGroup',
      points: [
        'For incremental migration from Angular 13 and earlier (where forms were effectively typed as <code>any</code>), Angular provides <code>UntypedFormControl</code> / <code>UntypedFormGroup</code> / <code>UntypedFormBuilder</code> — these preserve the OLD, loosely-typed behavior so a large codebase does not need to fix every form at once. New code should use the typed versions; untyped ones exist purely as a migration bridge, not a recommended long-term choice.',
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
      <input formControlName="name" placeholder="Name" />
      <input formControlName="age" type="number" placeholder="Age" />
    </form>

    <!-- TypeScript knows form.controls.name is FormControl<string>
         and form.controls.age is FormControl<number> — try renaming
         a field below to "nam" and see the type error in the console. -->
    <p>Typed access: {{ form.controls.name.value }} is {{ form.controls.age.value }}</p>
  \`,
})
export class App {
  private fb = inject(FormBuilder);

  // fb.nonNullable.group() infers:
  // FormGroup<{ name: FormControl<string>; age: FormControl<number> }>
  form = this.fb.nonNullable.group({
    name: ['', Validators.required],
    age: [0, [Validators.required, Validators.min(0)]],
  });

  logTypedValue() {
    // form.controls.name — fully typed, autocompletes, typo-checked at compile time
    console.log(this.form.controls.name.value, this.form.controls.age.value);
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
  <head><title>Typed forms</title></head>
  <body><app-root></app-root></body>
</html>
`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'Add an "email" field to the typed form (fb.nonNullable.group()) and read it via the typed form.controls.email.value accessor in the template, the same way name and age are read.',
    hint: 'Add `email: [\'\', [Validators.required, Validators.email]]` inside the fb.nonNullable.group({...}) call — TypeScript will automatically infer form.controls.email as FormControl<string>, with no manual generic needed.',
    solution: `form = this.fb.nonNullable.group({
  name: ['', Validators.required],
  age: [0, [Validators.required, Validators.min(0)]],
  email: ['', [Validators.required, Validators.email]],
});

// Template:
// {{ form.controls.email.value }}`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'you have to manually write out FormGroup<{...}> generic types yourself for typed forms to work.',
      reality: 'FormBuilder INFERS the full generic type automatically from the initial values you pass to fb.group() — you almost never write these generics by hand. Manual generics are only needed for unusual edge cases the inference cannot handle.',
    },
    {
      thought: 'typed forms are an opt-in feature — you need a special import or configuration flag to enable them.',
      reality: 'since Angular 14, FormBuilder/FormGroup/FormControl are typed by DEFAULT — there is nothing to opt into. UntypedFormBuilder/UntypedFormGroup exist as the OPT-OUT, for migrating older code that relied on the previous loosely-typed behavior.',
    },
    {
      thought: 'form.value and form.getRawValue() have the exact same TypeScript type, just different runtime behavior around disabled controls.',
      reality: 'the TYPES differ too: form.value is typed as a Partial (every field optional) because disabled controls can be silently missing at runtime, while form.getRawValue() is typed as the complete, non-partial shape since it always includes every control.',
    },
  ];
}
