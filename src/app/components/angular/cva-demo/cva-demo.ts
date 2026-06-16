import { Component, signal, forwardRef, input, OnInit, inject } from '@angular/core';
import {
  ControlValueAccessor, NG_VALUE_ACCESSOR, FormBuilder, ReactiveFormsModule, Validators
} from '@angular/forms';
import { JsonPipe } from '@angular/common';
import { CodeBlockComponent, CodeTab } from '../../shared/code-block/code-block';
import { TheoryBlockComponent, TheoryPoint } from '../../shared/theory-block/theory-block';
import { QnaBlockComponent, QnaItem } from '../../shared/qna-block/qna-block';
import { QuizBlockComponent, QuizQuestion } from '../../shared/quiz-block/quiz-block';
import { ChallengeBlockComponent, Challenge } from '../../shared/challenge-block/challenge-block';
import { QuickRefComponent, QuickRefItem } from '../../shared/quick-ref/quick-ref';
import { BeforeAfterComponent, BeforeAfterExample } from '../../shared/before-after/before-after';
import { CommonMistakesComponent, CommonMistake } from '../../shared/common-mistakes/common-mistakes';
import { PageMetaComponent } from '../../shared/page-meta/page-meta';
import { PageCompleteComponent } from '../../shared/page-complete/page-complete';
import { RevisionCardComponent, RevisionSummary } from '../../shared/revision-card/revision-card';
import { PrerequisitesComponent, Prerequisite } from '../../shared/prerequisites/prerequisites';

// ── Star Rating CVA ──────────────────────────────────────────────────────────
@Component({
  selector: 'app-star-rating',
  standalone: true,
  template: `
    <div class="stars" [class.disabled]="isDisabled()">
      @for (star of [1,2,3,4,5]; track star) {
        <span
          class="star"
          [class.filled]="star <= (hovered() || value())"
          [class.hovered]="star <= hovered()"
          (mouseenter)="!isDisabled() && hovered.set(star)"
          (mouseleave)="hovered.set(0)"
          (click)="!isDisabled() && selectStar(star)"
          role="button"
          [attr.aria-label]="'Rate ' + star + ' stars'">★</span>
      }
      <span class="label">{{ value() ? value() + '/5' : 'Not rated' }}</span>
    </div>`,
  styles: [`
    .stars { display:flex; gap:.25rem; align-items:center; cursor:pointer; user-select:none; }
    .star { font-size:1.8rem; color:#d1d5db; transition:color .15s, transform .1s; }
    .star.filled { color:#fbbf24; }
    .star.hovered { transform:scale(1.15); }
    .disabled { cursor:not-allowed; opacity:.5; }
    .label { font-size:.85rem; color:#666; margin-left:.5rem; }
  `],
  providers: [{ provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => StarRatingComponent), multi: true }],
})
export class StarRatingComponent implements ControlValueAccessor {
  maxStars = input(5);

  value      = signal(0);
  hovered    = signal(0);
  isDisabled = signal(false);

  private onChange: (v: number) => void = () => {};
  private onTouched: () => void = () => {};

  selectStar(star: number) {
    if (this.isDisabled()) return;
    const newVal = this.value() === star ? 0 : star;
    this.value.set(newVal);
    this.onChange(newVal);
    this.onTouched();
  }

  writeValue(val: number)                   { this.value.set(val ?? 0); }
  registerOnChange(fn: (v: number) => void) { this.onChange = fn; }
  registerOnTouched(fn: () => void)         { this.onTouched = fn; }
  setDisabledState(disabled: boolean)       { this.isDisabled.set(disabled); }
}

// ── Demo Component ────────────────────────────────────────────────────────────
@Component({
  selector: 'app-cva-demo',
  imports: [
    ReactiveFormsModule, JsonPipe,
    CodeBlockComponent, TheoryBlockComponent, StarRatingComponent,
    QnaBlockComponent, QuizBlockComponent, ChallengeBlockComponent,
    QuickRefComponent, BeforeAfterComponent, CommonMistakesComponent,
    PageMetaComponent, PageCompleteComponent,
    RevisionCardComponent, PrerequisitesComponent,
  ],
  templateUrl: './cva-demo.html',
  styleUrl: './cva-demo.scss',
})
export class CvaDemo implements OnInit {
  private fb = inject(FormBuilder);

  prerequisites: Prerequisite[] = [
    { label: 'Forms (Reactive & Template)', route: '/angular/forms-demo' },
    { label: 'Custom Validators', route: '/angular/custom-validators' },
  ];

  form = this.fb.group({
    productName: ['', Validators.required],
    rating:      [0, [Validators.required, Validators.min(1)]],
    description: [''],
  });

  submitted = signal(false);

  ngOnInit() {
    setTimeout(() => this.form.patchValue({ rating: 3 }), 500);
  }

  submit() {
    this.submitted.set(true);
    if (this.form.valid) console.log('Review submitted:', this.form.value);
  }

  get ratingCtrl() { return this.form.get('rating'); }

  theory: TheoryPoint[] = [
    {
      heading: 'What is ControlValueAccessor?',
      points: [
        '<code>ControlValueAccessor</code> (CVA) is the interface that bridges a custom component and Angular\'s form system — both reactive (<code>FormControl</code>, <code>FormGroup</code>) and template-driven (<code>ngModel</code>).',
        'Any component implementing CVA can be used with <code>formControlName</code>, <code>[formControl]</code>, or <code>[(ngModel)]</code> exactly like a native <code>&lt;input&gt;</code> — validation, dirty, touched, and disabled states all work automatically.',
        'Angular discovers CVA components through the <code>NG_VALUE_ACCESSOR</code> multi-provider token. When Angular wires up a <code>formControlName</code> directive, it injects all accessors registered at that element and picks the component-specific one.',
        'CVA enables reusable, encapsulated form widgets: date pickers, star ratings, tag editors, colour pickers, rich-text editors — all first-class form citizens with no external adapter code.',
        'The alternative — keeping state outside the form and manually syncing with <code>valueChanges</code> subscriptions — leads to drift, race conditions, and broken validation state. CVA eliminates this complexity.',
      ],
    },
    {
      heading: 'The 4 required CVA methods',
      points: [
        '<code>writeValue(val)</code>: Angular calls this to push a value INTO your component (e.g. from <code>patchValue()</code> or initial form setup). Update internal state here — NEVER call <code>onChange()</code> inside; that creates an infinite loop.',
        '<code>registerOnChange(fn)</code>: Angular provides the callback you must call when the user changes the value. Store it as a class field (<code>private onChange: (v: T) => void = () => &#123;&#125;</code>), then call <code>this.onChange(newValue)</code> on every user interaction.',
        '<code>registerOnTouched(fn)</code>: Angular provides the callback you must call when the user finishes interacting (blur or click). Store it (<code>private onTouched: () => void = () => &#123;&#125;</code>) and call <code>this.onTouched()</code> on each user action to enable error-message display.',
        '<code>setDisabledState(disabled: boolean)</code>: Angular calls this when the parent <code>FormControl</code> is programmatically enabled or disabled. Reflect the state in the UI — with signals: <code>this.isDisabled.set(disabled)</code>.',
        'All four methods have no-op defaults in the interface, but omitting <code>setDisabledState</code> means <code>formControl.disable()</code> will silently have no visual effect in your custom widget — always implement all four.',
      ],
    },
    {
      heading: 'Registering with NG_VALUE_ACCESSOR',
      points: [
        'Provide the token in the component\'s <code>providers</code> array: <code>&#123; provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => MyComponent), multi: true &#125;</code>.',
        '<code>multi: true</code> is critical — <code>NG_VALUE_ACCESSOR</code> is a multi-provider. Omitting it silently overwrites Angular\'s built-in accessor registrations for native inputs, breaking the entire form.',
        'Use <code>useExisting</code> (not <code>useClass</code>) so Angular injects the same component instance that is rendered in the template. <code>useClass</code> would create a second, disconnected instance with its own state.',
        '<code>forwardRef(() => MyComponent)</code> is required because the providers array is evaluated inside the <code>@Component</code> decorator, which runs before the class body is fully parsed. <code>forwardRef</code> wraps the reference in a thunk resolved later.',
        'In Angular 14+, you can use <code>inject(NG_VALUE_ACCESSOR, &#123; self: true, optional: true &#125;)</code> inside tests to retrieve a component\'s accessor without the full <code>formControlName</code> machinery.',
      ],
    },
    {
      heading: 'Modern CVA with signals',
      points: [
        'Store the internal value in a <code>signal()</code>: <code>value = signal&lt;number&gt;(0)</code>. In <code>writeValue(val)</code>, call <code>this.value.set(val ?? 0)</code>. The template reads <code>value()</code> reactively — no subscription needed.',
        'Store disabled state as a signal: <code>isDisabled = signal(false)</code>. In <code>setDisabledState(d)</code>, call <code>this.isDisabled.set(d)</code>. Apply to the template with <code>[class.disabled]="isDisabled()"</code>.',
        'On every user interaction call all three in order: <code>this.value.set(newVal); this.onChange(newVal); this.onTouched();</code>. The signal drives the template; <code>onChange</code> notifies the form; <code>onTouched</code> marks the control.',
        'Signals work seamlessly with <code>ChangeDetectionStrategy.OnPush</code> — no <code>ChangeDetectorRef.markForCheck()</code> needed. Angular\'s signal tracking schedules a re-render automatically when <code>value()</code> or <code>isDisabled()</code> changes.',
        'Toggle behaviour (click the active option to deselect): <code>const newVal = this.value() === clicked ? 0 : clicked</code>. This "deselect if already selected" pattern is common in star ratings, toggle buttons, and single-select chips.',
      ],
    },
    {
      heading: 'Validation integration',
      points: [
        'CVA components integrate with all validators applied at the <strong>parent</strong> FormControl level: <code>new FormControl(0, [Validators.required, Validators.min(1)])</code>. The CVA component itself does not need to know about validators.',
        '<code>Validators.required</code> treats falsy values (<code>0</code>, <code>\'\'</code>, <code>null</code>, <code>false</code>) as invalid. For a star rating starting at 0, <code>Validators.min(1)</code> is the correct "at least one star selected" validator.',
        'Touched state is the key to error-message display: always call <code>this.onTouched()</code> on user interaction so conditional error spans in the parent template (<code>@if (ctrl?.touched && ctrl?.invalid)</code>) behave correctly.',
        'For self-validating controls, implement <code>Validator</code> alongside CVA and register with <code>NG_VALIDATORS</code>: <code>&#123; provide: NG_VALIDATORS, useExisting: forwardRef(() => MyControl), multi: true &#125;</code>. Implement <code>validate(control): ValidationErrors | null</code>.',
        'For async self-validation (e.g., checking uniqueness from an API), use <code>NG_ASYNC_VALIDATORS</code> and return an <code>Observable&lt;ValidationErrors | null&gt;</code> from <code>validate()</code>.',
      ],
    },
    {
      heading: 'Best practices',
      points: [
        'Test CVA components in isolation: create the component in a TestBed, call <code>writeValue(5)</code>, verify the signal, trigger a user interaction, and spy on the stored <code>onChange</code> function. No form setup needed for pure logic tests.',
        'Define explicit TypeScript generics for the value type: <code>implements ControlValueAccessor</code> with <code>writeValue(val: number)</code> instead of <code>any</code>. This aligns with typed <code>FormControl&lt;number&gt;</code> on the parent.',
        'Expose configurable inputs — <code>maxStars = input(5)</code>, <code>step = input(1)</code> — so the control adapts to different contexts without cloning. Keep the CVA interface stable even as inputs change.',
        'Debounce rapid user input in controls like search fields or range sliders: call <code>onChange</code> inside a <code>debounceTime(300)</code> RxJS pipe rather than on every keystroke to avoid flooding the parent form with intermediate values.',
        'Always test that <code>form.disable()</code> and <code>form.enable()</code> correctly update your component\'s visual state. <code>setDisabledState</code> is the most commonly forgotten method in CVA implementations.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'CVA implementation',
      language: 'typescript',
      code: `import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { Component, signal, forwardRef } from '@angular/core';

@Component({
  selector: 'app-star-rating',
  standalone: true,
  template: \`
    <div [class.disabled]="isDisabled()">
      @for (star of [1,2,3,4,5]; track star) {
        <span [class.filled]="star <= value()"
              (click)="selectStar(star)">★</span>
      }
    </div>\`,
  providers: [{
    provide: NG_VALUE_ACCESSOR,
    useExisting: forwardRef(() => StarRatingComponent), // forwardRef: class not yet defined
    multi: true,                                        // MUST be true — multi-provider token
  }],
})
export class StarRatingComponent implements ControlValueAccessor {
  value      = signal(0);
  isDisabled = signal(false);

  // Store the Angular-provided callbacks
  private onChange: (v: number) => void = () => {};
  private onTouched: () => void = () => {};

  selectStar(star: number) {
    if (this.isDisabled()) return;
    const newVal = this.value() === star ? 0 : star; // toggle off
    this.value.set(newVal);   // update UI
    this.onChange(newVal);    // notify form of value change
    this.onTouched();         // mark control as touched
  }

  // Angular calls these 4 methods to wire the control:
  writeValue(val: number)                    { this.value.set(val ?? 0); } // DO NOT call onChange here
  registerOnChange(fn: (v: number) => void)  { this.onChange = fn; }
  registerOnTouched(fn: () => void)          { this.onTouched = fn; }
  setDisabledState(disabled: boolean)        { this.isDisabled.set(disabled); }
}`,
    },
    {
      label: 'Usage in template',
      language: 'html',
      code: `<!-- Reactive forms: exactly like a native input -->
<form [formGroup]="form">
  <app-star-rating formControlName="rating" />
  @if (form.get('rating')?.invalid && form.get('rating')?.touched) {
    <span class="error">Please select a rating</span>
  }
</form>

<!-- Template-driven forms with ngModel -->
<app-star-rating [(ngModel)]="myRating" name="rating" required />

<!-- Programmatic control — writeValue() is called -->
<button (click)="form.patchValue({ rating: 5 })">Set 5 stars</button>
<button (click)="form.get('rating')?.disable()">Disable</button>
<button (click)="form.get('rating')?.enable()">Enable</button>`,
    },
    {
      label: 'Validation integration',
      language: 'typescript',
      code: `// Parent component — applies validators TO the CVA control
@Component({
  selector: 'app-review-form',
  imports: [ReactiveFormsModule, StarRatingComponent],
  template: \`
    <form [formGroup]="form" (ngSubmit)="submit()">
      <div class="field">
        <label>Product</label>
        <input formControlName="productName" />
        @if (form.get('productName')?.invalid && form.get('productName')?.touched) {
          <span class="error">Product name is required</span>
        }
      </div>

      <div class="field">
        <label>Rating (required)</label>
        <app-star-rating formControlName="rating" />  <!-- CVA component -->
        @if (form.get('rating')?.invalid && form.get('rating')?.touched) {
          <span class="error">Please select at least 1 star</span>
        }
      </div>

      <button type="submit">Submit</button>
    </form>
  \`,
})
export class ReviewFormComponent {
  private fb = inject(FormBuilder);

  // Validators go here — the CVA component knows nothing about them
  form = this.fb.group({
    productName: ['', Validators.required],
    rating:      [0, [Validators.required, Validators.min(1)]],
  });

  submit() {
    this.form.markAllAsTouched(); // triggers CVA's onTouched → shows errors
    if (this.form.invalid) return;
    console.log('Submitted:', this.form.value);
  }
}`,
    },
  ];

  quiz: QuizQuestion[] = [
    {
      q: 'Which token must be provided in a component\'s providers array to register it as a custom form control?',
      options: ['FORM_CONTROL_TOKEN', 'NG_VALUE_ACCESSOR', 'CONTROL_VALUE_ACCESSOR', 'NG_VALIDATORS'],
      answer: 1,
      explanation: 'NG_VALUE_ACCESSOR is the multi-provider token Angular uses to discover custom form controls. You supply it with { provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => MyComponent), multi: true }.',
    },
    {
      q: 'Why is `forwardRef(() => StarRatingComponent)` required in the NG_VALUE_ACCESSOR provider?',
      options: [
        'forwardRef is required for all multi-providers in Angular',
        'It prevents memory leaks when the component is destroyed',
        'The class is referenced in the decorator metadata before it is fully defined',
        'It enables lazy loading of the component',
      ],
      answer: 2,
      explanation: 'The providers array inside @Component is evaluated when the decorator runs — before the class declaration is complete. forwardRef wraps the reference in a thunk so Angular resolves it later, after the class exists in memory.',
    },
    {
      q: 'Inside `writeValue(val)`, you must NOT call `this.onChange(val)`. Why?',
      options: [
        'onChange is not yet assigned when writeValue is called',
        'It would mark the form control as dirty unexpectedly',
        'It would create an infinite loop between Angular and the component',
        'writeValue is called in a zone where change detection is disabled',
      ],
      answer: 2,
      explanation: 'Angular calls writeValue to push a value into the control. Calling onChange inside it notifies Angular of a new value, which triggers writeValue again — causing an infinite recursive loop until the call stack overflows.',
    },
    {
      q: 'Clicking a star that is already selected (value === star) sets the rating to what in `selectStar()`?',
      options: ['5', '1', '-1', '0'],
      answer: 3,
      explanation: '`selectStar` computes: `const newVal = this.value() === star ? 0 : star`. Clicking the currently selected star deselects it by setting the value to 0, implementing a toggle-off behaviour common in rating controls.',
    },
    {
      q: 'Which method should you call when the user leaves (blurs) your custom control, and what does it accomplish?',
      options: [
        'onChange() — notifies Angular that the value changed',
        'writeValue() — resets the control to its initial value',
        'onTouched() — marks the FormControl as touched so validators display errors',
        'setDisabledState() — prevents further interaction until re-enabled',
      ],
      answer: 2,
      explanation: 'The callback stored from registerOnTouched() should be called on user interaction (click, blur). Angular then marks the FormControl as touched, which is the signal both reactive and template-driven forms use to decide whether to show validation error messages.',
    },
    {
      q: 'What happens if you use `useClass` instead of `useExisting` in the NG_VALUE_ACCESSOR provider?',
      options: [
        'The component fails to compile',
        'A second, separate instance of the component is created that is not the one rendered in the template',
        'The component works identically — useClass and useExisting are interchangeable',
        'Angular throws a circular dependency error at runtime',
      ],
      answer: 1,
      explanation: '`useClass` instructs Angular to instantiate a new instance of the class. The form then communicates with this separate instance, not the rendered component — so writeValue() updates an invisible object and onChange() is never called from the visible UI.',
    },
    {
      q: 'When should you call `this.onTouched()` inside a CVA component?',
      options: [
        'Inside `writeValue()` after updating internal state',
        'Inside `registerOnTouched()` when storing the callback',
        'Whenever the user interacts with the control (click, blur)',
        'Only when the component is destroyed',
      ],
      answer: 2,
      explanation: '`onTouched()` should be called on each user interaction (click, keypress, blur). This marks the parent FormControl as touched, which is Angular\'s signal to show validation error messages. Calling it in writeValue would mark the control as touched on every programmatic update — incorrect behaviour.',
    },
  ];

  qna: QnaItem[] = [
    {
      q: 'What is ControlValueAccessor?',
      a: 'CVA is an interface that makes a custom component work with Angular forms — both template-driven and reactive. It decouples the component\'s internal rendering from Angular\'s form infrastructure. Implement 4 methods: <code>writeValue</code> (Angular → component), <code>registerOnChange</code> (store the value callback), <code>registerOnTouched</code> (store the touched callback), and <code>setDisabledState</code> (component → UI).',
    },
    {
      q: 'How do you register a component as a custom form control?',
      a: 'Add <code>NG_VALUE_ACCESSOR</code> to the component\'s providers with <code>multi: true</code> and <code>useExisting: forwardRef(() => MyControl)</code>. Angular injects it automatically when the component is used with <code>formControlName</code> or <code>ngModel</code>. The <code>multi: true</code> flag is non-negotiable — omitting it silently overwrites Angular\'s built-in accessor registrations.',
    },
    {
      q: 'What does writeValue() do?',
      a: '<code>writeValue(val)</code> is called by Angular when the form sets the control\'s value programmatically — e.g. from <code>form.patchValue()</code>, <code>form.setValue()</code>, or the initial FormControl value. Update your internal signal/state here. <strong>Never</strong> call <code>onChange()</code> inside — it causes an infinite update loop.',
    },
    {
      q: 'What does registerOnChange() do?',
      a: '<code>registerOnChange(fn)</code> receives the callback Angular wants you to call when the <em>user</em> changes the value. Store it: <code>private onChange = fn</code>. Then call <code>this.onChange(newValue)</code> whenever the user interacts with your control. Angular uses this to update the <code>FormControl</code>\'s value and trigger validators.',
    },
    {
      q: 'How do you propagate the touched state?',
      a: 'Store the callback from <code>registerOnTouched(fn)</code> and call <code>this.onTouched()</code> whenever the user interacts with your control (click, keypress). This marks the form control as touched, enabling Angular\'s validation error display. Without this, reactive form validators never show error messages even after the user has used the control.',
    },
    {
      q: 'Can a CVA component work inside both template-driven and reactive forms?',
      a: 'Yes — that is the whole point. Use it with <code>[(ngModel)]="value"</code> (template-driven) or <code>[formControlName]="\'rating\'"</code> (reactive) interchangeably. Angular drives it the same way through the CVA interface regardless of the form type.',
    },
    {
      q: 'How do you add self-validation to a CVA component so it reports its own errors?',
      a: 'Implement <code>Validator</code> alongside <code>ControlValueAccessor</code>, then register via both tokens: <code>&#123; provide: NG_VALIDATORS, useExisting: forwardRef(() => MyControl), multi: true &#125;</code> in the providers array. Implement <code>validate(control: AbstractControl): ValidationErrors | null</code> — return an error object or <code>null</code>. The parent form\'s <code>.errors</code> will merge the component\'s self-reported errors with any externally applied validators.',
    },
  ];

  quickRef: QuickRefItem[] = [
    { name: 'ControlValueAccessor', type: 'interface', desc: 'Interface custom form controls implement to integrate with Angular\'s reactive and template-driven form APIs.',         since: '2'  },
    { name: 'NG_VALUE_ACCESSOR',    type: 'token',     desc: 'Multi-provider token used to register a component as a custom form control recognised by Angular forms.',              since: '2'  },
    { name: 'forwardRef',           type: 'function',  desc: 'Wraps a class reference in a thunk so it can be used in provider metadata before the class declaration is complete.', since: '2'  },
    { name: 'writeValue',           type: 'hook',      desc: 'Called by Angular to push a value into the control; update internal state here but NEVER call onChange() inside.',    since: '2'  },
    { name: 'registerOnChange',     type: 'hook',      desc: 'Receives the Angular callback; store it and call it with the new value on every user interaction.',                    since: '2'  },
    { name: 'registerOnTouched',    type: 'hook',      desc: 'Receives the Angular callback; store it and call it when the user interacts to mark the control as touched.',         since: '2'  },
    { name: 'setDisabledState',     type: 'hook',      desc: 'Called when the parent FormControl is enabled/disabled; reflect the state in the UI with a signal or CSS class.',     since: '2'  },
    { name: 'NG_VALIDATORS',        type: 'token',     desc: 'Multi-provider token for self-validating CVA components; implement validate() to return ValidationErrors | null.',     since: '2'  },
    { name: 'signal()',             type: 'function',  desc: 'Reactive signal primitive ideal for storing value and isDisabled state — template auto-updates without markForCheck.', since: '16' },
    { name: 'useExisting',          type: 'keyword',   desc: 'Provider instruction that reuses the rendered component instance rather than creating a new one — required in CVA.', since: '2'  },
  ];

  beforeAfter: BeforeAfterExample[] = [
    {
      title: 'Storing disabled state: class field vs signal()',
      before: '// Old: plain boolean — requires markForCheck() with OnPush\nexport class MyControl implements ControlValueAccessor {\n  isDisabled = false;\n  setDisabledState(d: boolean) { this.isDisabled = d; }\n  // template must trigger CD manually\n}',
      after: '// New: signal — works seamlessly with OnPush\nexport class MyControl implements ControlValueAccessor {\n  isDisabled = signal(false);\n  setDisabledState(d: boolean) { this.isDisabled.set(d); }\n  // template [class.disabled]="isDisabled()" auto-updates\n}',
      note: 'Signals eliminate the need for manual change detection in CVA components, making OnPush the default without extra boilerplate.',
    },
    {
      title: 'Iterating stars: *ngFor vs @for',
      before: '<!-- Old: requires CommonModule import -->\n<span *ngFor="let star of stars"\n  [class.filled]="star <= value">\n  ★\n</span>',
      after: '<!-- New: built-in control flow (Angular 17+) -->\n@for (star of [1,2,3,4,5]; track star) {\n  <span [class.filled]="star <= value()">★</span>\n}',
      note: '@for requires no CommonModule import, enforces a track expression for performance, and reads value() as a signal call for reactive updates.',
    },
    {
      title: 'Providing the token: useClass vs useExisting',
      before: '// WRONG: useClass creates a second disconnected instance\nproviders: [{\n  provide: NG_VALUE_ACCESSOR,\n  useClass: StarRatingComponent, // not the rendered instance\n  multi: true\n}]',
      after: '// CORRECT: useExisting reuses the rendered component\nproviders: [{\n  provide: NG_VALUE_ACCESSOR,\n  useExisting: forwardRef(() => StarRatingComponent),\n  multi: true\n}]',
      note: 'useExisting is the only correct choice for CVA — it tells Angular to inject the same instance that the template renders, so writeValue() updates the visible component.',
    },
  ];

  mistakes: CommonMistake[] = [
    {
      title: 'Calling onChange() inside writeValue()',
      wrong: 'writeValue(val: number) {\n  this.value.set(val);\n  this.onChange(val); // WRONG — triggers infinite loop\n}',
      right: 'writeValue(val: number) {\n  this.value.set(val ?? 0); // only update internal state\n}',
      explanation: 'Angular calls writeValue to push a value in. Calling onChange inside it notifies Angular of a change, which triggers writeValue again — creating an infinite recursive loop.',
    },
    {
      title: 'Forgetting multi: true on the NG_VALUE_ACCESSOR provider',
      wrong: 'providers: [{\n  provide: NG_VALUE_ACCESSOR,\n  useExisting: forwardRef(() => MyControl)\n  // missing multi: true\n}]',
      right: 'providers: [{\n  provide: NG_VALUE_ACCESSOR,\n  useExisting: forwardRef(() => MyControl),\n  multi: true  // required — NG_VALUE_ACCESSOR is a multi-provider\n}]',
      explanation: 'NG_VALUE_ACCESSOR is a multi-provider token. Omitting multi: true overwrites Angular\'s built-in accessor registrations for native inputs, silently breaking all other inputs in the same form.',
    },
    {
      title: 'Not calling onTouched() on user interaction',
      wrong: 'selectStar(star: number) {\n  this.value.set(star);\n  this.onChange(star);\n  // forgot onTouched — validation errors never display\n}',
      right: 'selectStar(star: number) {\n  this.value.set(star);\n  this.onChange(star);\n  this.onTouched(); // marks control as touched\n}',
      explanation: 'Without calling onTouched(), the FormControl is never marked as touched, so reactive-form validators will not display error messages — the user can submit the form without ever seeing the required-field error.',
    },
    {
      title: 'Using useClass instead of useExisting',
      wrong: 'providers: [{\n  provide: NG_VALUE_ACCESSOR,\n  useClass: StarRatingComponent, // creates a SECOND instance\n  multi: true\n}]',
      right: 'providers: [{\n  provide: NG_VALUE_ACCESSOR,\n  useExisting: forwardRef(() => StarRatingComponent),\n  multi: true\n}]',
      explanation: 'useClass instantiates a new, separate instance that has no connection to the rendered component. writeValue() updates an invisible object and user interactions on the rendered component never reach the form.',
    },
    {
      title: 'Not guarding against interaction when disabled',
      wrong: 'selectStar(star: number) {\n  this.value.set(star);\n  this.onChange(star);\n  this.onTouched();\n  // no disabled check — keyboard/programmatic clicks still fire\n}',
      right: 'selectStar(star: number) {\n  if (this.isDisabled()) return; // guard first\n  this.value.set(star);\n  this.onChange(star);\n  this.onTouched();\n}',
      explanation: 'Even with [disabled]="isDisabled()" on the DOM element, keyboard events or programmatic dispatches may still trigger click handlers. Always guard with if (this.isDisabled()) return at the top of all interaction methods.',
    },
  ];

  challenge: Challenge = {
    title: 'Build a Thumbs-Up / Thumbs-Down CVA Control',
    description: 'Create a standalone Angular component called `ThumbRatingComponent` that lets users vote thumbs-up (1) or thumbs-down (-1). It must implement `ControlValueAccessor` so it works with `formControlName` inside a reactive form. Wire it into a small demo form and display the submitted value.',
    language: 'typescript',
    hints: [
      'Provide NG_VALUE_ACCESSOR with `multi: true` and `useExisting: forwardRef(() => ThumbRatingComponent)` in the @Component providers array.',
      'Store the current value in `signal(0)`. In `vote(val)`, toggle: `const newVal = this.value() === val ? 0 : val`, then call onChange and onTouched.',
      'In `writeValue(val)`, call `this.value.set(val ?? 0)` — do NOT call `this.onChange()` here.',
      'In `setDisabledState(disabled)`, update an `isDisabled` signal and apply `[disabled]="isDisabled()"` to both buttons in the template.',
    ],
    starterCode: `import { Component, signal, forwardRef } from '@angular/core';
import {
  ControlValueAccessor, NG_VALUE_ACCESSOR,
  FormBuilder, ReactiveFormsModule, Validators
} from '@angular/forms';

// TODO 1: Add NG_VALUE_ACCESSOR provider
@Component({
  selector: 'app-thumb-rating',
  standalone: true,
  template: \`
    <div class="thumbs">
      <button type="button" [class.active]="value() === 1"  (click)="vote(1)">👍</button>
      <button type="button" [class.active]="value() === -1" (click)="vote(-1)">👎</button>
      <span>{{ value() === 1 ? 'Liked' : value() === -1 ? 'Disliked' : 'No vote' }}</span>
    </div>\`,
  styles: [\`.thumbs { display:flex; gap:.75rem; align-items:center; }
    button { font-size:1.5rem; background:none; border:2px solid transparent; border-radius:8px; cursor:pointer; padding:.25rem .5rem; }
    button.active { border-color:#6366f1; background:#ede9fe; }\`],
  // providers: [ TODO 1 here ]
})
export class ThumbRatingComponent implements ControlValueAccessor {
  value      = signal(0);
  isDisabled = signal(false);

  private onChange:  (v: number) => void = () => {};
  private onTouched: () => void          = () => {};

  vote(val: number) {
    // TODO 2: toggle logic — clicking the active thumb resets to 0
    // call onChange and onTouched
  }

  // TODO 3: implement all 4 CVA methods
  writeValue(val: number)                   { /* ... */ }
  registerOnChange(fn: (v: number) => void) { /* ... */ }
  registerOnTouched(fn: () => void)         { /* ... */ }
  setDisabledState(disabled: boolean)       { /* ... */ }
}

// ── Demo ──────────────────────────────────────
@Component({
  selector: 'app-thumb-demo',
  standalone: true,
  imports: [ReactiveFormsModule, ThumbRatingComponent],
  template: \`
    <form [formGroup]="form" (ngSubmit)="submit()">
      <app-thumb-rating formControlName="vote" />
      <button type="submit">Submit</button>
      @if (result) { <p>Submitted: {{ result }}</p> }
    </form>\`,
})
export class ThumbDemoComponent {
  form   = new FormBuilder().group({ vote: [0] });
  result = '';
  submit() { if (this.form.valid) this.result = JSON.stringify(this.form.value); }
}`,
    solution: `import { Component, signal, forwardRef } from '@angular/core';
import {
  ControlValueAccessor, NG_VALUE_ACCESSOR,
  FormBuilder, ReactiveFormsModule, Validators
} from '@angular/forms';

@Component({
  selector: 'app-thumb-rating',
  standalone: true,
  template: \`
    <div class="thumbs" [style.opacity]="isDisabled() ? 0.5 : 1">
      <button type="button"
        [class.active]="value() === 1"
        [disabled]="isDisabled()"
        (click)="vote(1)">👍</button>
      <button type="button"
        [class.active]="value() === -1"
        [disabled]="isDisabled()"
        (click)="vote(-1)">👎</button>
      <span>{{ value() === 1 ? 'Liked' : value() === -1 ? 'Disliked' : 'No vote' }}</span>
    </div>\`,
  styles: [\`.thumbs { display:flex; gap:.75rem; align-items:center; }
    button { font-size:1.5rem; background:none; border:2px solid transparent; border-radius:8px; cursor:pointer; padding:.25rem .5rem; }
    button.active { border-color:#6366f1; background:#ede9fe; }\`],
  providers: [{
    provide: NG_VALUE_ACCESSOR,
    useExisting: forwardRef(() => ThumbRatingComponent),
    multi: true,
  }],
})
export class ThumbRatingComponent implements ControlValueAccessor {
  value      = signal(0);
  isDisabled = signal(false);

  private onChange:  (v: number) => void = () => {};
  private onTouched: () => void          = () => {};

  vote(val: number) {
    if (this.isDisabled()) return;
    const newVal = this.value() === val ? 0 : val; // toggle off if same
    this.value.set(newVal);
    this.onChange(newVal);
    this.onTouched();
  }

  writeValue(val: number)                   { this.value.set(val ?? 0); }
  registerOnChange(fn: (v: number) => void) { this.onChange = fn; }
  registerOnTouched(fn: () => void)         { this.onTouched = fn; }
  setDisabledState(disabled: boolean)       { this.isDisabled.set(disabled); }
}

@Component({
  selector: 'app-thumb-demo',
  standalone: true,
  imports: [ReactiveFormsModule, ThumbRatingComponent],
  template: \`
    <form [formGroup]="form" (ngSubmit)="submit()">
      <app-thumb-rating formControlName="vote" />
      <button type="submit">Submit</button>
      @if (result) { <p>Submitted: {{ result }}</p> }
    </form>\`,
})
export class ThumbDemoComponent {
  form   = new FormBuilder().group({ vote: [0] });
  result = '';
  submit() { if (this.form.valid) this.result = JSON.stringify(this.form.value); }
}`,
  };

  revision: RevisionSummary = {
    oneLiner: '<code>ControlValueAccessor</code> is the interface that makes any custom Angular component work seamlessly with both reactive forms (<code>formControlName</code>) and template-driven forms (<code>ngModel</code>) by implementing 4 methods that bridge internal component state to Angular\'s form control layer.',
    mustKnow: [
      'Implement 4 methods: <code>writeValue(val)</code>, <code>registerOnChange(fn)</code>, <code>registerOnTouched(fn)</code>, <code>setDisabledState(disabled)</code>',
      'Register with: <code>&#123; provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => MyControl), multi: true &#125;</code>',
      '<code>writeValue</code>: push value into internal state only — NEVER call <code>onChange()</code> here (infinite loop)',
      '<code>registerOnChange</code>: store the fn; call <code>this.onChange(newVal)</code> on every user interaction',
      '<code>registerOnTouched</code>: store the fn; call <code>this.onTouched()</code> on every user interaction to enable error display',
      'Use <code>signal()</code> for <code>value</code> and <code>isDisabled</code> — template auto-updates with <code>OnPush</code>, no <code>markForCheck()</code>',
      '<code>useExisting</code> (not <code>useClass</code>) reuses the rendered instance; <code>forwardRef</code> defers resolution past the decorator evaluation',
    ],
    interviewFocus: [
      'Q: What are the 4 CVA methods and what does each one do?',
      'Q: Why must you NEVER call <code>onChange()</code> inside <code>writeValue()</code>?',
      'Q: What is the difference between <code>useExisting</code> and <code>useClass</code> in the NG_VALUE_ACCESSOR provider?',
      'Q: Why is <code>forwardRef</code> required in the CVA provider?',
      'Q: How do you add custom validators on top of a CVA component without modifying the component itself?',
    ],
  };
}
