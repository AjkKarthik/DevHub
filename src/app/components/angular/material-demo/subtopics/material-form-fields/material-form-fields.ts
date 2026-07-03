import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../shared/theory-block/theory-block';
import { LivePlaygroundComponent, PlaygroundFile } from '../../../../shared/live-playground/live-playground';
import { TryItComponent, TryItExercise } from '../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-material-form-fields-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent,
    LivePlaygroundComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './material-form-fields.html',
  styleUrl: './material-form-fields.scss',
})
export class MaterialFormFieldsSubtopic {

  materialDeps = { '@angular/material': 'latest', '@angular/cdk': 'latest' };

  theory: TheoryPoint[] = [
    {
      heading: 'MatFormField — the wrapper every Material form control needs',
      points: [
        '<code>MatFormField</code> wraps any <code>matInput</code>, <code>mat-select</code>, or <code>mat-textarea</code> with a floating label, placeholder, hint text, and error display — it is the cornerstone every other Material form control builds on.',
        'Three appearance options on <code>mat-form-field</code>: <code>fill</code> (the Material Design 3 default), <code>outline</code> (bordered), and legacy <code>standard</code>. Set it globally via <code>MAT_FORM_FIELD_DEFAULT_OPTIONS</code> instead of repeating the attribute on every field.',
      ],
    },
    {
      heading: 'mat-error — validation display with zero manual @if logic',
      points: [
        '<code>&lt;mat-error&gt;</code> inside a form field shows its message automatically once the bound <code>FormControl</code> is BOTH <code>invalid</code> AND <code>touched</code> — no manual <code>&#64;if (control.touched && control.invalid)</code> guard needed anywhere in your template; Material handles that display logic internally.',
      ],
    },
    {
      heading: 'MatSelect — a Material overlay dropdown',
      points: [
        '<code>MatSelect</code> replaces a plain <code>&lt;select&gt;</code> with a Material overlay panel supporting option grouping, multiple selection, and custom option templates — pair it with a reactive <code>FormControl</code> the same way you would any other Material input.',
      ],
    },
    {
      heading: 'MatAutocomplete — suggestions as you type',
      points: [
        '<code>MatAutocomplete</code> overlays suggestion options as the user types into a <code>matInput</code>. Wire it with <code>[matAutocomplete]="auto"</code> on the input, filter options in a <code>computed()</code> or via a <code>switchMap</code> pipeline, and supply the results as either a plain array or an <code>Observable</code>.',
      ],
    },
  ];

  liveDemoFiles: PlaygroundFile[] = [
    {
      path: 'src/app/app.ts',
      content: `import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [ReactiveFormsModule, MatFormFieldModule, MatInputModule, MatSelectModule],
  template: \`
    <form [formGroup]="form">
      <mat-form-field appearance="outline">
        <mat-label>Email</mat-label>
        <input matInput formControlName="email" placeholder="you@example.com" />
        <!-- mat-error shows automatically when invalid + touched — no @if needed -->
        <mat-error>Enter a valid email.</mat-error>
      </mat-form-field>

      <mat-form-field appearance="outline">
        <mat-label>Role</mat-label>
        <mat-select formControlName="role">
          <mat-option value="dev">Developer</mat-option>
          <mat-option value="pm">Product Manager</mat-option>
          <mat-option value="design">Designer</mat-option>
        </mat-select>
      </mat-form-field>
    </form>
  \`,
})
export class App {
  private fb = inject(FormBuilder);

  form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    role: ['dev'],
  });
}
`,
    },
    {
      path: 'src/main.ts',
      content: `import { bootstrapApplication } from '@angular/platform-browser';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { App } from './app/app';

bootstrapApplication(App, { providers: [provideAnimationsAsync()] });
`,
    },
    {
      path: 'src/index.html',
      content: `<!doctype html>
<html>
  <head><title>Material form fields</title></head>
  <body><app-root></app-root></body>
</html>
`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'Add appearance="outline" as a global default using MAT_FORM_FIELD_DEFAULT_OPTIONS instead of repeating it on every mat-form-field, then remove the appearance attribute from both fields in the template.',
    hint: 'In the providers array: { provide: MAT_FORM_FIELD_DEFAULT_OPTIONS, useValue: { appearance: \'outline\' } } — import MAT_FORM_FIELD_DEFAULT_OPTIONS from \'@angular/material/form-field\', add it to bootstrapApplication\'s providers, then delete appearance="outline" from each <mat-form-field> tag.',
    solution: `import { MAT_FORM_FIELD_DEFAULT_OPTIONS } from '@angular/material/form-field';

bootstrapApplication(App, {
  providers: [
    provideAnimationsAsync(),
    { provide: MAT_FORM_FIELD_DEFAULT_OPTIONS, useValue: { appearance: 'outline' } },
  ],
});

// Template — remove appearance="outline" from each <mat-form-field>, it's now the default`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'you need to manually write @if (control.invalid && control.touched) to control when mat-error shows.',
      reality: 'mat-error inside a mat-form-field displays automatically once the bound control is both invalid AND touched — Material handles that visibility logic internally, no manual conditional needed in the template.',
    },
    {
      thought: 'MatSelect and a plain HTML <select> element behave identically, just with different styling.',
      reality: 'MatSelect is a Material OVERLAY panel with genuinely different capabilities — option grouping, multi-select, and custom option templates — none of which a plain <select> supports at all.',
    },
    {
      thought: 'appearance must be set individually on every single mat-form-field in the app.',
      reality: 'MAT_FORM_FIELD_DEFAULT_OPTIONS lets you set the appearance (and other defaults) ONCE, globally, in the providers array — individual fields only need the attribute when they intentionally deviate from that default.',
    },
  ];
}
