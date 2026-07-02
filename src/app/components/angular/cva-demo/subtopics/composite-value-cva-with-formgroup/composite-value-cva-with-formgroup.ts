import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../shared/theory-block/theory-block';
import { LivePlaygroundComponent, PlaygroundFile } from '../../../../shared/live-playground/live-playground';
import { TryItComponent, TryItExercise } from '../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-composite-value-cva-with-formgroup-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent,
    LivePlaygroundComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './composite-value-cva-with-formgroup.html',
  styleUrl: './composite-value-cva-with-formgroup.scss',
})
export class CompositeValueCvaWithFormgroupSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The value doesn\'t have to be a primitive',
      points: [
        'Every CVA example so far has a single primitive value (a number, a string) — but <code>writeValue</code>/<code>onChange</code> work identically for a whole OBJECT: <code>writeValue(val: Address)</code>, <code>onChange(v: Address)</code>. This is how you build a composite widget — an address block with street/city/zip, a date range, a full name split into first/last — that plugs into a SINGLE <code>formControlName</code> on the parent, appearing as one atomic field despite having multiple internal inputs.',
        'Internally, the composite CVA component commonly uses its OWN <code>FormGroup</code> to manage the sub-fields\' own validation/dirty/touched state — this INNER FormGroup is entirely private to the component; the PARENT form only ever sees ONE value (the whole object), never the individual sub-controls.',
      ],
    },
    {
      heading: 'Wiring the internal FormGroup to the CVA methods',
      points: [
        '<code>writeValue(val: Address)</code> calls <code>this.internalForm.patchValue(val, { emitEvent: false })</code> — the <code>{ emitEvent: false }</code> is ESSENTIAL, because without it, patching the internal form would fire its own <code>valueChanges</code>, which would call <code>onChange</code>, which tells the PARENT the value changed — creating a feedback loop that fires spuriously whenever the parent pushes a value in (e.g., initial form setup).',
        'Subscribe to <code>this.internalForm.valueChanges</code> ONCE in the constructor (with <code>takeUntilDestroyed()</code>) to call <code>this.onChange(this.internalForm.value)</code> and <code>this.onTouched()</code> whenever the user actually edits a sub-field — this is the single point where user-driven changes flow OUT to the parent.',
      ],
    },
    {
      heading: 'Disabled state propagation to sub-controls',
      points: [
        '<code>setDisabledState(disabled)</code> must propagate to the INTERNAL form, not just a top-level flag: <code>disabled ? this.internalForm.disable({ emitEvent: false }) : this.internalForm.enable({ emitEvent: false })</code> — disabling the outer FormGroup automatically disables all of its child controls, correctly graying out every sub-field in the composite widget at once.',
      ],
    },
  ];

  liveDemoFiles: PlaygroundFile[] = [
    {
      path: 'src/app/address-input.ts',
      content: `import { Component, inject, DestroyRef, forwardRef } from '@angular/core';
import { ControlValueAccessor, FormBuilder, ReactiveFormsModule, NG_VALUE_ACCESSOR } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

interface Address { street: string; city: string; zip: string; }

@Component({
  selector: 'app-address-input',
  standalone: true,
  imports: [ReactiveFormsModule],
  providers: [{
    provide: NG_VALUE_ACCESSOR,
    useExisting: forwardRef(() => AddressInputComponent),
    multi: true,
  }],
  template: \`
    <form [formGroup]="internalForm">
      <input formControlName="street" placeholder="Street" />
      <input formControlName="city" placeholder="City" />
      <input formControlName="zip" placeholder="ZIP" />
    </form>
  \`,
})
export class AddressInputComponent implements ControlValueAccessor {
  private fb = inject(FormBuilder);
  private destroyRef = inject(DestroyRef);

  internalForm = this.fb.group({
    street: [''],
    city: [''],
    zip: [''],
  });

  private onChange: (v: Address) => void = () => {};
  private onTouched: () => void = () => {};

  constructor() {
    // The ONE place user edits flow out to the parent form
    this.internalForm.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(v => {
        this.onChange(v as Address);
        this.onTouched();
      });
  }

  writeValue(val: Address): void {
    // emitEvent: false prevents this programmatic write from re-triggering onChange
    this.internalForm.patchValue(val ?? { street: '', city: '', zip: '' }, { emitEvent: false });
  }

  registerOnChange(fn: (v: Address) => void): void { this.onChange = fn; }
  registerOnTouched(fn: () => void): void { this.onTouched = fn; }

  setDisabledState(disabled: boolean): void {
    disabled
      ? this.internalForm.disable({ emitEvent: false })
      : this.internalForm.enable({ emitEvent: false });
  }
}
`,
    },
    {
      path: 'src/app/app.ts',
      content: `import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { JsonPipe } from '@angular/common';
import { AddressInputComponent } from './address-input';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [ReactiveFormsModule, AddressInputComponent, JsonPipe],
  template: \`
    <h3>Composite CVA — one formControlName, three internal fields</h3>
    <form [formGroup]="form">
      <app-address-input formControlName="shippingAddress" />
    </form>
    <p>Parent sees ONE value: {{ form.value | json }}</p>
    <button (click)="prefill()">Prefill with initial data</button>
    <button (click)="toggleDisabled()">Toggle disabled</button>
  \`,
})
export class App {
  private fb = inject(FormBuilder);
  form = this.fb.group({
    shippingAddress: [{ street: '', city: '', zip: '' }],
  });

  prefill() {
    // patchValue on the PARENT triggers writeValue() on the child — with emitEvent: false internally
    this.form.patchValue({ shippingAddress: { street: '123 Main St', city: 'Springfield', zip: '12345' } });
  }

  toggleDisabled() {
    const ctrl = this.form.get('shippingAddress')!;
    ctrl.disabled ? ctrl.enable() : ctrl.disable();
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
  <head><title>Composite value CVA with FormGroup</title></head>
  <body><app-root></app-root></body>
</html>
`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'Click "Prefill with initial data", then check the console/parent value to confirm it does NOT cause a duplicate/spurious update loop (the value should update exactly once).',
    hint: 'Because writeValue() uses { emitEvent: false } when patching the internal form, the programmatic prefill does not trigger the internalForm.valueChanges subscription, so onChange only fires from genuine USER edits, not from this parent-initiated write.',
    solution: `// No code change needed — this confirms the { emitEvent: false } guard
// in writeValue() correctly prevents the parent's patchValue() call
// from looping back through the internal form's valueChanges
// subscription and re-notifying the parent redundantly.`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'a CVA component\'s value must always be a single primitive like a string or number.',
      reality: 'writeValue/onChange work identically for a whole object — this is exactly how composite widgets (address blocks, date ranges, split name fields) present multiple internal inputs as one atomic value to the parent form.',
    },
    {
      thought: 'calling internalForm.patchValue() inside writeValue() without { emitEvent: false } is a harmless simplification.',
      reality: 'without it, the programmatic write triggers the internal form\'s own valueChanges, which calls onChange, which tells the parent the value changed — creating a spurious feedback loop every time the parent pushes a value in, not just when the user actually edits something.',
    },
    {
      thought: 'setDisabledState only needs to set a boolean flag that the template checks to gray out the UI.',
      reality: 'for a composite CVA with an internal FormGroup, setDisabledState should call disable()/enable() on that internal form directly — this correctly propagates to every sub-control at once, rather than requiring each sub-field to separately check a flag.',
    },
  ];
}
