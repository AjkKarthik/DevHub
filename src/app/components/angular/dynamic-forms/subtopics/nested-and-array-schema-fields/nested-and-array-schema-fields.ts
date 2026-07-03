import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../shared/theory-block/theory-block';
import { LivePlaygroundComponent, PlaygroundFile } from '../../../../shared/live-playground/live-playground';
import { TryItComponent, TryItExercise } from '../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-nested-and-array-schema-fields-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent,
    LivePlaygroundComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './nested-and-array-schema-fields.html',
  styleUrl: './nested-and-array-schema-fields.scss',
})
export class NestedAndArraySchemaFieldsSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'A "group" field type — recursive schema nesting',
      points: [
        'The main topic\'s schema is FLAT — every field maps to one <code>FormControl</code>. A <code>type: \'group\'</code> field instead carries its OWN nested <code>fields: FieldConfig[]</code> array, and <code>buildForm()</code> must call ITSELF recursively for that entry: <code>group[field.key] = this.buildForm(field.fields)</code> — producing a NESTED <code>FormGroup</code> rather than a <code>FormControl</code>.',
        'The template needs a MATCHING recursive structure — a field-list component that renders itself again for a group field\'s nested <code>fields</code> array, wrapped in <code>[formGroupName]="field.key"</code> instead of <code>[formControlName]</code> at that level.',
      ],
    },
    {
      heading: 'An "array" field type — repeatable groups from a schema',
      points: [
        'A <code>type: \'array\'</code> field carries an <code>itemSchema: FieldConfig[]</code> describing the shape of EACH repeated item — <code>buildForm()</code> creates a <code>FormArray</code> whose entries are each built by calling <code>buildForm(field.itemSchema)</code> again, producing a <code>FormArray&lt;FormGroup&gt;</code> for something like a dynamic list of "emergency contacts" or "line items."',
        'Adding a new item at runtime means pushing a NEW group built from the same <code>itemSchema</code>: <code>(formArray as FormArray).push(this.buildForm(field.itemSchema))</code> — the schema is the template for EVERY item, so the shape stays consistent no matter how many are added.',
      ],
    },
    {
      heading: 'Rendering nested/array structures with recursive components',
      points: [
        'A single flat <code>@switch</code> cannot express recursion — the correct pattern is a SEPARATE, small "field renderer" component that takes a <code>FieldConfig[]</code> and a parent <code>FormGroup</code>/<code>FormArray</code> as inputs, and for a <code>group</code>/<code>array</code> field type, renders ITSELF again (via its own selector inside its own template) for the nested schema — the SAME recursive-component technique used for tree/file-explorer UIs elsewhere, applied here to forms.',
        'Track array items by a STABLE identity, not index — if items can be reordered or removed from the middle, tracking by <code>$index</code> in <code>&#64;for</code> causes Angular to reuse the WRONG <code>FormGroup</code> for the wrong visual row after a removal, silently corrupting which control shows which validation state.',
      ],
    },
  ];

  liveDemoFiles: PlaygroundFile[] = [
    {
      path: 'src/app/form-builder.ts',
      content: `import { FormGroup, FormArray, FormControl, FormBuilder, Validators } from '@angular/forms';

export interface FieldConfig {
  key: string;
  type: 'text' | 'group' | 'array';
  label: string;
  required?: boolean;
  fields?: FieldConfig[];      // used when type === 'group'
  itemSchema?: FieldConfig[];  // used when type === 'array'
}

export function buildForm(fb: FormBuilder, schema: FieldConfig[]): FormGroup {
  const group: Record<string, any> = {};

  for (const field of schema) {
    if (field.type === 'group') {
      // Recursive call — a group field nests its own FormGroup
      group[field.key] = buildForm(fb, field.fields ?? []);
    } else if (field.type === 'array') {
      // FormArray whose entries are each built from the same itemSchema
      group[field.key] = fb.array([]);
    } else {
      const validators = field.required ? [Validators.required] : [];
      group[field.key] = fb.control('', validators);
    }
  }

  return fb.group(group);
}

export function buildArrayItem(fb: FormBuilder, itemSchema: FieldConfig[]): FormGroup {
  return buildForm(fb, itemSchema);
}
`,
    },
    {
      path: 'src/app/app.ts',
      content: `import { Component, inject } from '@angular/core';
import { FormBuilder, FormArray, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { JsonPipe } from '@angular/common';
import { buildForm, buildArrayItem, FieldConfig } from './form-builder';

const contactItemSchema: FieldConfig[] = [
  { key: 'name', type: 'text', label: 'Name', required: true },
  { key: 'phone', type: 'text', label: 'Phone' },
];

const schema: FieldConfig[] = [
  { key: 'fullName', type: 'text', label: 'Full Name', required: true },
  {
    key: 'address',
    type: 'group',
    label: 'Address',
    fields: [
      { key: 'street', type: 'text', label: 'Street' },
      { key: 'city', type: 'text', label: 'City' },
    ],
  },
  { key: 'emergencyContacts', type: 'array', label: 'Emergency Contacts' },
];

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [ReactiveFormsModule, JsonPipe],
  template: \`
    <h3>Nested group + repeatable array, built from one schema</h3>
    <form [formGroup]="form">
      <input formControlName="fullName" placeholder="Full name" />

      <div formGroupName="address">
        <input formControlName="street" placeholder="Street" />
        <input formControlName="city" placeholder="City" />
      </div>

      <div formArrayName="emergencyContacts">
        @for (group of contacts.controls; track $index) {
          <div [formGroupName]="$index">
            <input formControlName="name" placeholder="Contact name" />
            <input formControlName="phone" placeholder="Phone" />
            <button type="button" (click)="removeContact($index)">Remove</button>
          </div>
        }
      </div>
      <button type="button" (click)="addContact()">Add Emergency Contact</button>
    </form>

    <pre>{{ form.value | json }}</pre>
  \`,
})
export class App {
  private fb = inject(FormBuilder);
  form = buildForm(this.fb, schema);

  get contacts(): FormArray {
    return this.form.get('emergencyContacts') as FormArray;
  }

  addContact() {
    this.contacts.push(buildArrayItem(this.fb, contactItemSchema));
  }

  removeContact(index: number) {
    this.contacts.removeAt(index);
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
  <head><title>Nested and array schema fields</title></head>
  <body><app-root></app-root></body>
</html>
`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'Add a third field to contactItemSchema, "relationship", and confirm every NEW emergency contact added afterward includes the field (existing added contacts before your change do not need to be retrofitted).',
    hint: 'Add { key: \'relationship\', type: \'text\', label: \'Relationship\' } to the contactItemSchema array — every subsequent addContact() call builds a fresh group from the updated schema.',
    solution: `const contactItemSchema: FieldConfig[] = [
  { key: 'name', type: 'text', label: 'Name', required: true },
  { key: 'phone', type: 'text', label: 'Phone' },
  { key: 'relationship', type: 'text', label: 'Relationship' },
];`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'a flat @switch on field.type can express nested groups and repeatable arrays with a few extra cases.',
      reality: 'group and array fields genuinely require RECURSION — buildForm() calling itself for a group\'s nested fields, and a recursive rendering component, since a flat switch cannot represent arbitrarily nested structure.',
    },
    {
      thought: 'tracking array-rendered form groups by $index in @for is fine as long as the array items have unique content.',
      reality: 'if items can be reordered or removed from the middle, tracking by index causes Angular to reuse the WRONG FormGroup for the wrong visual row after a removal — a genuine, silent data-corruption bug, not just a minor inefficiency.',
    },
    {
      thought: 'adding a new array item means manually declaring its FormGroup fields each time in the component code.',
      reality: 'the itemSchema is the template for EVERY item — buildArrayItem() rebuilds a fresh group from that same schema on each addContact() call, keeping every item\'s shape consistent automatically.',
    },
  ];
}
