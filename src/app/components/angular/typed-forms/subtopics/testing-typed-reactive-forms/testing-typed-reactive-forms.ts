import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../shared/theory-block/theory-block';
import { LivePlaygroundComponent, PlaygroundFile } from '../../../../shared/live-playground/live-playground';
import { TryItComponent, TryItExercise } from '../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-testing-typed-reactive-forms-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent,
    LivePlaygroundComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './testing-typed-reactive-forms.html',
  styleUrl: './testing-typed-reactive-forms.scss',
})
export class TestingTypedReactiveFormsSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'Two kinds of safety to verify — compile-time AND runtime',
      points: [
        'Typed forms give you COMPILE-TIME safety for free — if a test file references <code>form.value.emaill</code>, the TypeScript compiler itself fails the build before any test even runs. This means "does the type system catch a typo" does not need a dedicated unit test; it is verified by the mere act of the test file compiling successfully.',
        'What DOES need runtime tests: the DISABLED-CONTROL EXCLUSION behavior of <code>.value</code> versus <code>.getRawValue()</code> — this is a runtime behavior with type-level consequences, and it is exactly the kind of thing a refactor could silently break (e.g. someone "simplifies" a submit method from <code>getRawValue()</code> back to <code>.value</code> and the compile step alone will not catch that this drops a field at runtime for a disabled control).',
      ],
    },
    {
      heading: 'Testing that getRawValue() includes disabled controls and .value excludes them',
      points: [
        'The precise test: build the form, disable a specific control, then assert TWO separate facts — <code>form.value</code> does NOT contain that key (or it is <code>undefined</code>), while <code>form.getRawValue()</code> DOES contain it with the correct value. Testing only one half of this pair leaves the other half\'s regression undetected.',
        'This is a genuinely common bug source: a form that starts with a control disabled (e.g. a promo code field) but a later refactor accidentally submits via <code>.value</code> instead of <code>getRawValue()</code> — a runtime test catches this immediately; TypeScript alone does not, because <code>form.value.promoCode</code> being typed as OPTIONAL (not an error) means the code still compiles.',
      ],
    },
    {
      heading: 'Testing typed valueChanges and patchValue rejecting invalid shapes',
      points: [
        'Subscribe to <code>form.controls.role.valueChanges</code> in a test, call <code>.setValue(\'admin\')</code>, and assert the subscriber received exactly <code>\'admin\'</code> typed as the union — this confirms the CONTROL\'s specific literal-union type (not just <code>string</code>) survives through to runtime subscribers, which is worth confirming since union-typed form controls are easy to accidentally widen to <code>string</code> during refactors.',
        'For <code>patchValue()</code> rejecting an unknown key, the test IS the TypeScript compiler again — write a test file line attempting <code>form.patchValue({ unknownField: \'x\' })</code> and confirm it fails to COMPILE (not run) — some teams keep a small "type tests" file specifically for this, using tools like <code>expect-type</code> or a bare <code>// @ts-expect-error</code> comment above the invalid line, which fails the build if the line UNEXPECTEDLY compiles.',
      ],
    },
  ];

  liveDemoFiles: PlaygroundFile[] = [
    {
      path: 'src/app/checkout-form.ts',
      content: `import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'app-checkout-form',
  standalone: true,
  imports: [ReactiveFormsModule],
  template: \`<form [formGroup]="form"></form>\`,
})
export class CheckoutFormComponent {
  private fb = inject(FormBuilder);

  form = this.fb.nonNullable.group({
    name: [''],
    email: [''],
    promoCode: [''],
  });

  constructor() {
    this.form.controls.promoCode.disable();
  }
}
`,
    },
    {
      path: 'src/app/checkout-form.spec.ts',
      content: `import { TestBed } from '@angular/core/testing';
import { CheckoutFormComponent } from './checkout-form';

describe('CheckoutFormComponent typed form behavior', () => {
  it('excludes a disabled control from .value', () => {
    const fixture = TestBed.createComponent(CheckoutFormComponent);
    const { form } = fixture.componentInstance;

    // TypeScript already marks promoCode as optional on .value —
    // this test proves the RUNTIME behavior matches that type.
    expect('promoCode' in form.value).toBe(false);
  });

  it('includes the disabled control in getRawValue()', () => {
    const fixture = TestBed.createComponent(CheckoutFormComponent);
    const { form } = fixture.componentInstance;
    form.controls.promoCode.setValue('SAVE10');

    const raw = form.getRawValue();
    expect(raw.promoCode).toBe('SAVE10'); // present even though the control is disabled
  });

  it('emits typed values on valueChanges', (done) => {
    const fixture = TestBed.createComponent(CheckoutFormComponent);
    const { form } = fixture.componentInstance;

    form.controls.name.valueChanges.subscribe(value => {
      expect(value).toBe('Alice'); // typed as string, no null guard needed
      done();
    });

    form.controls.name.setValue('Alice');
  });

  // Type-level test — this line must FAIL TO COMPILE, not fail at runtime.
  // it('rejects an unknown patchValue key', () => {
  //   const fixture = TestBed.createComponent(CheckoutFormComponent);
  //   // @ts-expect-error — 'unknownField' is not a key of the form's typed shape
  //   fixture.componentInstance.form.patchValue({ unknownField: 'x' });
  // });
});
`,
    },
    {
      path: 'src/app/app.ts',
      content: `import { Component } from '@angular/core';
import { CheckoutFormComponent } from './checkout-form';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CheckoutFormComponent],
  template: \`
    <h3>Testing typed reactive forms</h3>
    <p>Open checkout-form.spec.ts — tests verify the .value vs getRawValue() runtime
    contract, typed valueChanges, and a commented-out @ts-expect-error type-level test.</p>
    <app-checkout-form />
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
  <head><title>Testing typed reactive forms</title></head>
  <body><app-root></app-root></body>
</html>
`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'Add a test proving that re-enabling promoCode makes it reappear in .value.',
    hint: 'Call form.controls.promoCode.enable() after setValue(), then assert "promoCode" in form.value is true and form.value.promoCode matches the set value.',
    solution: `it('includes a re-enabled control back in .value', () => {
  const fixture = TestBed.createComponent(CheckoutFormComponent);
  const { form } = fixture.componentInstance;

  form.controls.promoCode.setValue('SAVE10');
  form.controls.promoCode.enable();

  expect('promoCode' in form.value).toBe(true);
  expect(form.value.promoCode).toBe('SAVE10');
});`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'if TypeScript compiles a form-handling test file without errors, the form\'s runtime behavior must be correct too.',
      reality: 'the .value vs getRawValue() disabled-control exclusion is a RUNTIME behavior with type-level consequences — a refactor that swaps getRawValue() for .value still compiles fine (the type just marks the field optional) but silently drops data at runtime, which only a runtime test catches.',
    },
    {
      thought: 'testing that patchValue() rejects an invalid key requires a runtime assertion, like expecting a thrown error.',
      reality: 'patchValue() with an invalid key is a COMPILE-TIME error, not a runtime one — the correct "test" is a line that must fail to compile, verified via @ts-expect-error or a dedicated type-testing tool, not a runtime expect() call.',
    },
    {
      thought: 'testing only that .value excludes a disabled control is sufficient coverage for the disabled-control behavior.',
      reality: 'the getRawValue()-includes-it half needs its own separate assertion — a bug that breaks getRawValue() specifically (while .value still correctly excludes the control) would pass a test that only checks the .value side.',
    },
  ];
}
