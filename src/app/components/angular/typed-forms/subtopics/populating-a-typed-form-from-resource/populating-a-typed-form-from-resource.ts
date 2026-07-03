import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../shared/theory-block/theory-block';
import { LivePlaygroundComponent, PlaygroundFile } from '../../../../shared/live-playground/live-playground';
import { TryItComponent, TryItExercise } from '../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-populating-a-typed-form-from-resource-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent,
    LivePlaygroundComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './populating-a-typed-form-from-resource.html',
  styleUrl: './populating-a-typed-form-from-resource.scss',
})
export class PopulatingATypedFormFromResourceSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'patchValue() vs setValue() when populating from an async fetch',
      points: [
        'When a <code>resource()</code> resolves with a fetched record, use <code>form.patchValue(record)</code> rather than <code>form.setValue(record)</code> if the fetched shape might have FEWER fields than the form (e.g. the API omits a field that has a client-only default) — <code>patchValue()</code> accepts a <code>Partial&lt;T&gt;</code> and only updates the fields present, while <code>setValue()</code> requires the EXACT full shape and throws if anything is missing.',
        'Both remain fully typed: <code>patchValue()</code>\'s parameter type is <code>Partial&lt;T&gt;</code> where <code>T</code> is the form\'s value type — passing a field that does not exist on the form, or a wrong value type for an existing field, is still a compile-time TypeScript error, exactly like the main topic\'s coverage of typed <code>patchValue()</code>.',
      ],
    },
    {
      heading: 'Effect-driven sync: patching the form when the resource resolves',
      points: [
        'A <code>resource()</code>\'s <code>.value()</code> signal changing (from <code>undefined</code> during loading to the fetched record) needs an <code>effect()</code> to drive the form patch, since a <code>FormGroup</code> is not itself a signal — <code>effect(() =&gt; { const record = this.userResource.value(); if (record) { this.form.patchValue(record); } });</code> — this effect reads a signal (tracked) and performs a side effect (mutating the form), which is exactly the kind of imperative bridging <code>effect()</code> exists for.',
        'Guard against re-patching on every resource re-fetch overwriting IN-PROGRESS user edits — exactly the same "dirty draft" concern from the linkedSignal+resource() pattern, but solved differently here since <code>FormGroup</code> has its OWN built-in dirty tracking: <code>if (record && !this.form.dirty) { this.form.patchValue(record); }</code> — check <code>form.dirty</code> before patching, so a background refetch does not clobber unsaved edits.',
      ],
    },
    {
      heading: 'Typing the whole pipeline: resource() type flows into the form\'s patch call',
      points: [
        'Declare the <code>resource()</code>\'s type parameter explicitly (or let it infer from the loader\'s return type) so that <code>this.userResource.value()</code> is typed as <code>UserRecord | undefined</code> — this makes the <code>form.patchValue(record)</code> call itself get checked against the FORM\'s value type: if the API record and the form\'s field names or types diverge (e.g. the API returns <code>fullName</code> but the form has separate <code>firstName</code>/<code>lastName</code> controls), TypeScript flags the mismatch immediately rather than silently patching nothing for those fields at runtime.',
        'For a field-name mismatch that is intentional (API uses different naming than the form), write a small typed MAPPING function between the two shapes — <code>function toFormValue(record: UserRecord): Partial&lt;FormValue&gt; { return { firstName: record.fullName.split(\' \')[0], ... }; }</code> — rather than trying to force the API shape and the form shape to match exactly, which often is not realistic for real APIs.',
      ],
    },
  ];

  liveDemoFiles: PlaygroundFile[] = [
    {
      path: 'src/app/user-record.ts',
      content: `export interface UserRecord {
  id: number;
  name: string;
  email: string;
}

export async function fetchUser(id: number): Promise<UserRecord> {
  await new Promise(r => setTimeout(r, 500));
  return { id, name: 'Ada Lovelace', email: 'ada@example.com' };
}
`,
    },
    {
      path: 'src/app/user-edit-form.ts',
      content: `import { Component, signal, resource, effect, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { fetchUser } from './user-record';

@Component({
  selector: 'app-user-edit-form',
  standalone: true,
  imports: [ReactiveFormsModule],
  template: \`
    @if (userResource.isLoading()) {
      <p>Loading…</p>
    } @else {
      <form [formGroup]="form">
        <label>Name  <input formControlName="name" /></label>
        <label>Email <input formControlName="email" /></label>
      </form>
      <p>Form dirty: {{ form.dirty }}</p>
      <button (click)="userResource.reload()">Reload from server</button>
    }
  \`,
})
export class UserEditFormComponent {
  private fb = inject(FormBuilder);

  userId = signal(1);

  userResource = resource({
    params: () => this.userId(),
    loader: ({ params: id }) => fetchUser(id),
  });

  // Typed form — patchValue(record) below is checked against this shape
  form = this.fb.nonNullable.group({
    name: [''],
    email: [''],
  });

  constructor() {
    effect(() => {
      const record = this.userResource.value();
      // Only patch if the form has no unsaved user edits —
      // a background reload should not clobber an in-progress draft.
      if (record && !this.form.dirty) {
        this.form.patchValue(record); // typed — record must match Partial<form value>
      }
    });
  }
}
`,
    },
    {
      path: 'src/app/app.ts',
      content: `import { Component } from '@angular/core';
import { UserEditFormComponent } from './user-edit-form';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [UserEditFormComponent],
  template: \`
    <h3>Populating a typed form from resource()</h3>
    <p>Once loaded, edit a field (form becomes dirty), then click "Reload from server" —
    the effect skips patchValue() because the form is dirty, preserving your edit.</p>
    <app-user-edit-form />
  \`,
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
  <head><title>Populating a typed form from resource()</title></head>
  <body><app-root></app-root></body>
</html>
`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'Add a "Discard changes" button that force-patches the form from the current resource value and clears the dirty flag, bypassing the dirty guard.',
    hint: 'Call form.patchValue(record) directly (not gated on !form.dirty) followed by form.markAsPristine() to reset the dirty flag, reading userResource.value() at click time.',
    solution: `discardChanges() {
  const record = this.userResource.value();
  if (record) {
    this.form.patchValue(record);
    this.form.markAsPristine();
  }
}

// Template:
// <button (click)="discardChanges()">Discard changes</button>`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'form.setValue(record) and form.patchValue(record) are interchangeable when populating from an API response.',
      reality: 'setValue() requires the EXACT full shape and throws if any field is missing, while patchValue() accepts a Partial and only updates fields present — patchValue() is the safer choice when the API response might omit fields the form has defaults for.',
    },
    {
      thought: 'a FormGroup can be driven directly by a resource() signal without any bridging code, similar to how a template binding reads a signal.',
      reality: 'FormGroup is not itself a signal — an effect() is needed to read the resource\'s value signal and imperatively call patchValue() on the form as a side effect.',
    },
    {
      thought: 'patching the form every time the resource re-fetches is always the correct behavior.',
      reality: 'without a dirty check, a background reload silently overwrites in-progress unsaved edits — checking form.dirty before patching (or using a more explicit policy) prevents this data-loss bug.',
    },
  ];
}
