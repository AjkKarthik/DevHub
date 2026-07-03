import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../shared/theory-block/theory-block';
import { LivePlaygroundComponent, PlaygroundFile } from '../../../../shared/live-playground/live-playground';
import { TryItComponent, TryItExercise } from '../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-nested-schemas-error-formatting-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent,
    LivePlaygroundComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './nested-schemas-error-formatting.html',
  styleUrl: './nested-schemas-error-formatting.scss',
})
export class NestedSchemasErrorFormattingSubtopic {

  zodDeps = { zod: 'latest' };

  theory: TheoryPoint[] = [
    {
      heading: 'Nested object and array schemas — mirroring FormArray structures',
      points: [
        'A schema can nest another schema directly: <code>z.object({ address: z.object({ street: z.string(), city: z.string() }) })</code>. Failed nested fields report a MULTI-SEGMENT path, e.g. <code>[\'address\', \'city\']</code>, not just a single field name.',
        '<code>z.array(z.object({ label: z.string(), value: z.string() }))</code> validates a FormArray-shaped list of groups — exactly the data shape produced by an Angular <code>FormArray</code> of <code>FormGroup</code>s. Each failing entry\'s path includes its numeric index: <code>[\'items\', 2, \'label\']</code>.',
        'Nested schemas compose the same way top-level ones do — <code>.min()</code>, <code>.refine()</code>, and <code>.transform()</code> all work identically whether applied to a top-level field or deep inside a nested object/array.',
      ],
    },
    {
      heading: 'Formatting ZodError — beyond manually searching .issues',
      points: [
        'Manually finding an error for one field (<code>err.issues.find(i =&gt; i.path[0] === field)</code>) breaks down for nested paths and doesn\'t scale past a handful of fields. <code>error.flatten()</code> returns <code>{ formErrors: string[], fieldErrors: { [key: string]: string[] } }</code> — a ready-to-use map keyed by TOP-LEVEL field name.',
        '<code>error.flatten()</code> only keys by the FIRST path segment — for genuinely nested errors (<code>[\'address\', \'city\']</code>), use <code>error.format()</code> instead, which returns a tree mirroring the schema\'s own nested shape: <code>formatted.address?.city?._errors</code>.',
        'For a FormArray-shaped array error, <code>error.format()</code> produces a tree with NUMERIC keys matching each array index — <code>formatted.items?.[2]?.label?._errors</code> — which maps directly onto the corresponding Angular <code>FormArray</code> control at that index.',
      ],
    },
  ];

  liveDemoFiles: PlaygroundFile[] = [
    {
      path: 'src/app/app.ts',
      content: `import { Component, signal } from '@angular/core';
import { z } from 'zod';

const orderSchema = z.object({
  customer: z.object({
    name: z.string().min(2, 'Name too short'),
    address: z.object({
      street: z.string().min(1, 'Street required'),
      city: z.string().min(1, 'City required'),
    }),
  }),
  items: z.array(
    z.object({
      label: z.string().min(1, 'Item label required'),
      qty: z.coerce.number().positive('Quantity must be positive'),
    }),
  ).min(1, 'Add at least one item'),
});

// Deliberately invalid sample data — nested + array errors
const badOrder = {
  customer: { name: 'A', address: { street: '', city: 'Springfield' } },
  items: [
    { label: 'Widget', qty: 3 },
    { label: '', qty: -1 },
  ],
};

@Component({
  selector: 'app-root',
  standalone: true,
  template: \`
    <h3>flatten() — top-level field map</h3>
    <pre>{{ flattened() }}</pre>

    <h3>format() — full nested error tree</h3>
    <pre>{{ formatted() }}</pre>
  \`,
})
export class App {
  flattened = signal('');
  formatted = signal('');

  constructor() {
    const result = orderSchema.safeParse(badOrder);
    if (!result.success) {
      // flatten() only sees top-level keys: 'customer', 'items'
      this.flattened.set(JSON.stringify(result.error.flatten(), null, 2));
      // format() mirrors the nested schema shape exactly
      this.formatted.set(JSON.stringify(result.error.format(), null, 2));
    }
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
  <head><title>Nested schemas and error formatting</title></head>
  <body><app-root></app-root></body>
</html>
`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'Fix badOrder so customer.name is "Alice" (valid) but leave the address.street and items[1].label errors in place — observe how flatten() and format() output change.',
    hint: 'Change name: \'A\' to name: \'Alice\' inside customer — the customer top-level key disappears from flattened().fieldErrors, and formatted().customer.name._errors goes away, while the nested address.street and items[1].label errors remain.',
    solution: `const badOrder = {
  customer: { name: 'Alice', address: { street: '', city: 'Springfield' } },
  items: [
    { label: 'Widget', qty: 3 },
    { label: '', qty: -1 },
  ],
};`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'error.flatten() gives a complete picture of every validation error, including deeply nested ones.',
      reality: 'flatten() only keys errors by their TOP-LEVEL field name — a nested error like [\'customer\', \'address\', \'city\'] gets grouped under the single \'customer\' key without preserving the deeper path; use format() when you need the full nested tree.',
    },
    {
      thought: 'manually searching error.issues with .find() is the standard, scalable way to map Zod errors to form fields.',
      reality: 'that approach breaks down for nested paths and repeated array items — error.flatten() and error.format() are the built-in Zod utilities designed specifically to avoid hand-rolled issue-searching.',
    },
    {
      thought: 'z.array(z.object({...})) validates each item independently, so one bad item doesn\'t affect how others are reported.',
      reality: 'validation of each item IS independent, but the resulting error paths include the numeric array index (e.g. [\'items\', 2, \'label\']) — reading format() output requires indexing into the tree by that same numeric key to find a specific item\'s errors.',
    },
  ];
}
