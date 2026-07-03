import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../shared/theory-block/theory-block';
import { LivePlaygroundComponent, PlaygroundFile } from '../../../../shared/live-playground/live-playground';
import { TryItComponent, TryItExercise } from '../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-custom-field-renderer-registry-pattern-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent,
    LivePlaygroundComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './custom-field-renderer-registry-pattern.html',
  styleUrl: './custom-field-renderer-registry-pattern.scss',
})
export class CustomFieldRendererRegistryPatternSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The problem with @switch — it doesn\'t scale to consumer-defined field types',
      points: [
        'The main topic\'s <code>&#64;switch (field.type)</code> pattern requires EDITING THE CORE TEMPLATE every time a new field type is added — fine for a fixed, known set of types, but genuinely limiting when different TEAMS or PLUGINS need to register their own custom field renderer (a color picker, a rich-text editor, a file uploader) without touching the shared dynamic-form component\'s source.',
        'The library-grade solution (what Angular Formly does internally) is a REGISTRY mapping type strings to Angular COMPONENT CLASSES: <code>const FIELD_REGISTRY = new Map&lt;string, Type&lt;any&gt;&gt;([[\'text\', TextFieldComponent], [\'select\', SelectFieldComponent]])</code> — consumers register new entries by calling <code>FIELD_REGISTRY.set(\'color-picker\', ColorPickerFieldComponent)</code>, with zero changes to the core rendering logic.',
      ],
    },
    {
      heading: 'Rendering a component from the registry with NgComponentOutlet',
      points: [
        '<code>&lt;ng-container *ngComponentOutlet="registry.get(field.type); inputs: { field, control }" /&gt;</code> — Angular\'s built-in <code>NgComponentOutlet</code> directive dynamically creates and renders WHATEVER component class the registry lookup returns, passing it typed inputs, exactly like a static <code>&lt;app-text-field [field]="..." [control]="..." /&gt;</code> would, but resolved at runtime from a lookup instead of hardcoded in the template.',
        'Each registered field component receives the SAME contract — a <code>field: FieldConfig</code> input and a <code>control: FormControl</code> input — so the core dynamic-form renderer never needs to know the SPECIFICS of any individual field type; it only needs to know the shared input contract every registered component agrees to implement.',
      ],
    },
    {
      heading: 'A fallback for unregistered types',
      points: [
        'If <code>registry.get(field.type)</code> returns <code>undefined</code> (a schema references a type that was never registered — a genuinely common bug when a schema evolves faster than the registered field components), <code>NgComponentOutlet</code> given <code>undefined</code> renders NOTHING silently — always provide a fallback: <code>registry.get(field.type) ?? UnknownFieldComponent</code>, where <code>UnknownFieldComponent</code> visibly displays "Unsupported field type: X" rather than leaving a confusing blank gap in the form.',
      ],
    },
  ];

  liveDemoFiles: PlaygroundFile[] = [
    {
      path: 'src/app/field-registry.ts',
      content: `import { Component, input, Type } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';

export interface FieldConfig { key: string; type: string; label: string; }

@Component({
  selector: 'app-text-field',
  standalone: true,
  imports: [ReactiveFormsModule],
  template: \`<label>{{ field().label }}<input [formControl]="control()" /></label>\`,
})
export class TextFieldComponent {
  field = input.required<FieldConfig>();
  control = input.required<FormControl>();
}

@Component({
  selector: 'app-toggle-field',
  standalone: true,
  imports: [ReactiveFormsModule],
  template: \`<label><input type="checkbox" [formControl]="control()" /> {{ field().label }}</label>\`,
})
export class ToggleFieldComponent {
  field = input.required<FieldConfig>();
  control = input.required<FormControl>();
}

@Component({
  selector: 'app-unknown-field',
  standalone: true,
  template: \`<p style="color: red;">Unsupported field type: {{ field().type }}</p>\`,
})
export class UnknownFieldComponent {
  field = input.required<FieldConfig>();
  control = input.required<FormControl>();
}

// The registry — consumers add entries here to register NEW field types,
// with zero changes needed to the core dynamic-form rendering component
export const FIELD_REGISTRY = new Map<string, Type<any>>([
  ['text', TextFieldComponent],
  ['toggle', ToggleFieldComponent],
]);
`,
    },
    {
      path: 'src/app/app.ts',
      content: `import { Component } from '@angular/core';
import { NgComponentOutlet } from '@angular/common';
import { FormControl } from '@angular/forms';
import { FIELD_REGISTRY, FieldConfig, UnknownFieldComponent } from './field-registry';

const schema: FieldConfig[] = [
  { key: 'name', type: 'text', label: 'Name' },
  { key: 'subscribe', type: 'toggle', label: 'Subscribe to updates' },
  { key: 'unknownDemo', type: 'color-picker', label: 'This type was never registered' },
];

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [NgComponentOutlet],
  template: \`
    <h3>Registry-based field rendering — @switch never appears anywhere</h3>
    @for (field of schema; track field.key) {
      <ng-container
        *ngComponentOutlet="
          (registry.get(field.type) ?? unknownComponent);
          inputs: { field: field, control: controls[field.key] }
        " />
    }
  \`,
})
export class App {
  schema = schema;
  registry = FIELD_REGISTRY;
  unknownComponent = UnknownFieldComponent;

  controls: Record<string, FormControl> = Object.fromEntries(
    schema.map(f => [f.key, new FormControl(f.type === 'toggle' ? false : '')]),
  );
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
  <head><title>Custom field renderer registry pattern</title></head>
  <body><app-root></app-root></body>
</html>
`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'Register a new "number" field type by creating a NumberFieldComponent and adding it to FIELD_REGISTRY, then add a number field to the schema — with zero changes to app.ts\'s rendering logic.',
    hint: 'Create a NumberFieldComponent similar to TextFieldComponent but with type="number" on the input, add FIELD_REGISTRY.set(\'number\', NumberFieldComponent) (or add it directly to the Map literal), and add a new schema entry with type: \'number\'.',
    solution: `@Component({
  selector: 'app-number-field',
  standalone: true,
  imports: [ReactiveFormsModule],
  template: \`<label>{{ field().label }}<input type="number" [formControl]="control()" /></label>\`,
})
export class NumberFieldComponent {
  field = input.required<FieldConfig>();
  control = input.required<FormControl>();
}

export const FIELD_REGISTRY = new Map<string, Type<any>>([
  ['text', TextFieldComponent],
  ['toggle', ToggleFieldComponent],
  ['number', NumberFieldComponent],
]);`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'a @switch statement on field.type scales fine to any number of field types, including ones defined by consumers of a shared component.',
      reality: 'a switch requires EDITING the core template for every new type — a registry (Map<string, Type>) lets consumers add entirely new field types by registering a component, with zero changes to the shared rendering logic.',
    },
    {
      thought: 'NgComponentOutlet given an undefined component reference throws a clear error.',
      reality: 'it silently renders NOTHING — always provide a fallback component (registry.get(type) ?? UnknownFieldComponent) so an unregistered type shows a visible message instead of a confusing blank gap.',
    },
    {
      thought: 'each registered field component can have its own unique input names and shape.',
      reality: 'every registered component must agree to the SAME shared input contract (e.g. field and control) — this uniformity is exactly what lets the core renderer treat every registered type identically without knowing its specifics.',
    },
  ];
}
