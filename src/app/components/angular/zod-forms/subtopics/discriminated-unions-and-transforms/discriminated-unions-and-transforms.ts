import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../shared/theory-block/theory-block';
import { LivePlaygroundComponent, PlaygroundFile } from '../../../../shared/live-playground/live-playground';
import { TryItComponent, TryItExercise } from '../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-discriminated-unions-and-transforms-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent,
    LivePlaygroundComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './discriminated-unions-and-transforms.html',
  styleUrl: './discriminated-unions-and-transforms.scss',
})
export class DiscriminatedUnionsAndTransformsSubtopic {

  zodDeps = { zod: 'latest' };

  theory: TheoryPoint[] = [
    {
      heading: 'Discriminated unions — polymorphic forms with a shape-switching field',
      points: [
        '<code>z.discriminatedUnion(\'kind\', [schemaA, schemaB])</code> picks WHICH schema to validate against based on a shared literal field (the discriminant) — perfect for a payment-method form where selecting "card" vs "bank transfer" requires completely different fields.',
        'Each member schema must declare the SAME discriminant key with a distinct <code>z.literal(...)</code> value: <code>z.object({ kind: z.literal(\'card\'), cardNumber: z.string() })</code> and <code>z.object({ kind: z.literal(\'bank\'), accountNumber: z.string() })</code>. Zod picks the matching branch by reading <code>kind</code> BEFORE validating the rest — far faster and clearer than a plain <code>z.union()</code>, which tries every branch and reports confusing combined errors on failure.',
        'The inferred TypeScript type is a real discriminated union: after checking <code>if (result.data.kind === \'card\')</code>, TypeScript narrows to the card branch automatically — no manual type assertion needed.',
      ],
    },
    {
      heading: '.transform() — reshaping data as part of validation',
      points: [
        '<code>.transform(fn)</code> runs AFTER validation succeeds and changes the OUTPUT shape/type — unlike <code>.refine()</code>, which only checks a condition, <code>.transform()</code> returns a new value entirely. <code>z.string().transform(s =&gt; s.trim().toLowerCase())</code> normalizes a raw form string into its canonical form as part of parsing.',
        'Transforms compose with coercion for the exact "raw form value → clean typed value" pipeline: <code>z.string().transform(s =&gt; s.split(\',\').map(t =&gt; t.trim()).filter(Boolean))</code> turns a comma-separated tags input directly into a <code>string[]</code> inside <code>safeParse</code>, replacing manual pre-processing before the parse call.',
        'The schema\'s INPUT type and OUTPUT type can differ once a transform is involved — <code>z.infer&lt;typeof schema&gt;</code> reflects the OUTPUT type (post-transform). Use <code>z.input&lt;typeof schema&gt;</code> if you specifically need the pre-transform input type for the raw form value.',
      ],
    },
  ];

  liveDemoFiles: PlaygroundFile[] = [
    {
      path: 'src/app/app.ts',
      content: `import { Component, signal, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { z } from 'zod';

// Discriminated union — shape depends on the 'kind' field
const paymentSchema = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('card'), cardNumber: z.string().length(16, 'Card number must be 16 digits') }),
  z.object({ kind: z.literal('bank'), accountNumber: z.string().min(6, 'Account number too short') }),
]);

// .transform() — comma string in, clean array out
const tagsSchema = z.string().transform(s => s.split(',').map(t => t.trim()).filter(Boolean));

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [ReactiveFormsModule],
  template: \`
    <h3>Discriminated union — payment method switches shape</h3>
    <form [formGroup]="form" (ngSubmit)="submit()">
      <label>
        <input type="radio" formControlName="kind" value="card" /> Card
      </label>
      <label>
        <input type="radio" formControlName="kind" value="bank" /> Bank transfer
      </label>

      @if (form.value.kind === 'card') {
        <input formControlName="cardNumber" placeholder="16-digit card number" />
      } @else {
        <input formControlName="accountNumber" placeholder="Account number" />
      }

      <button type="submit">Validate</button>
    </form>
    <pre>{{ result() }}</pre>

    <h3>.transform() — tags string → clean array</h3>
    <input [value]="tagsInput()" (input)="onTagsInput($event)" placeholder="angular, forms, zod" />
    <pre>{{ tagsResult() }}</pre>
  \`,
})
export class App {
  private fb = inject(FormBuilder);

  form = this.fb.group({
    kind: ['card' as 'card' | 'bank'],
    cardNumber: [''],
    accountNumber: [''],
  });

  result = signal('Fill out the form and submit.');

  submit() {
    const raw = this.form.value;
    const payload = raw.kind === 'card'
      ? { kind: 'card' as const, cardNumber: raw.cardNumber ?? '' }
      : { kind: 'bank' as const, accountNumber: raw.accountNumber ?? '' };
    const parsed = paymentSchema.safeParse(payload);
    this.result.set(JSON.stringify(parsed, null, 2));
  }

  tagsInput = signal('');
  tagsResult = signal('');

  onTagsInput(e: Event) {
    const value = (e.target as HTMLInputElement).value;
    this.tagsInput.set(value);
    // The transform runs as part of safeParse — output is already a clean array
    const parsed = tagsSchema.safeParse(value);
    this.tagsResult.set(JSON.stringify(parsed.success ? parsed.data : parsed.error.issues));
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
  <head><title>Discriminated unions and transforms</title></head>
  <body><app-root></app-root></body>
</html>
`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'Add a third payment kind, "paypal", requiring an email field — add a new z.object branch to paymentSchema and a matching radio option in the template.',
    hint: 'Add z.object({ kind: z.literal(\'paypal\'), email: z.string().email() }) as a third array entry in z.discriminatedUnion, plus an <input type="radio" formControlName="kind" value="paypal" /> and a matching @else if branch for the email input.',
    solution: `const paymentSchema = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('card'), cardNumber: z.string().length(16) }),
  z.object({ kind: z.literal('bank'), accountNumber: z.string().min(6) }),
  z.object({ kind: z.literal('paypal'), email: z.string().email() }),
]);`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'z.union() and z.discriminatedUnion() behave the same way, just with different syntax.',
      reality: 'z.union() tries EVERY branch and reports a combined, often confusing error on failure — z.discriminatedUnion() reads the discriminant field first to pick exactly ONE branch, giving faster validation and much clearer, branch-specific error messages.',
    },
    {
      thought: '.transform() and .refine() do the same job — checking whether a value is valid.',
      reality: '.refine() only checks a boolean condition and does not change the output — .transform() actually RESHAPES the value, so the schema\'s output type can genuinely differ from its input type.',
    },
    {
      thought: 'z.infer<typeof schema> always reflects the raw shape you passed into safeParse.',
      reality: 'once a .transform() is involved, z.infer reflects the OUTPUT (post-transform) type — use z.input<typeof schema> specifically when you need the pre-transform input type instead.',
    },
  ];
}
