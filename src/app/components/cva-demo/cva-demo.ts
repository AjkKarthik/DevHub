import { Component, signal, forwardRef, input, OnInit } from '@angular/core';
import {
  ControlValueAccessor, NG_VALUE_ACCESSOR, FormBuilder, ReactiveFormsModule, Validators
} from '@angular/forms';
import { CodeBlockComponent, CodeTab } from '../shared/code-block/code-block';
import { TheoryBlockComponent, TheoryPoint } from '../shared/theory-block/theory-block';
import { QnaBlockComponent, QnaItem } from '../shared/qna-block/qna-block';
import { QuizBlockComponent, QuizQuestion } from '../shared/quiz-block/quiz-block';
import { ChallengeBlockComponent, Challenge } from '../shared/challenge-block/challenge-block';
import { QuickRefComponent, QuickRefItem } from '../shared/quick-ref/quick-ref';
import { BeforeAfterComponent, BeforeAfterExample } from '../shared/before-after/before-after';
import { CommonMistakesComponent, CommonMistake } from '../shared/common-mistakes/common-mistakes';
import { VersionBadgeComponent, VersionInfo } from '../shared/version-badge/version-badge';
import { PageMetaComponent } from '../shared/page-meta/page-meta';
import { PageCompleteComponent } from '../shared/page-complete/page-complete';

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

  value    = signal(0);
  hovered  = signal(0);
  isDisabled = signal(false);

  private onChange: (v: number) => void = () => {};
  private onTouched: () => void = () => {};

  selectStar(star: number) {
    const newVal = this.value() === star ? 0 : star;
    this.value.set(newVal);
    this.onChange(newVal);
    this.onTouched();
  }

  writeValue(val: number) { this.value.set(val ?? 0); }
  registerOnChange(fn: (v: number) => void) { this.onChange = fn; }
  registerOnTouched(fn: () => void) { this.onTouched = fn; }
  setDisabledState(disabled: boolean) { this.isDisabled.set(disabled); }
}

// ── Demo Component ────────────────────────────────────────────────────────────
@Component({
  selector: 'app-cva-demo',
  imports: [ReactiveFormsModule, CodeBlockComponent, TheoryBlockComponent, StarRatingComponent, QnaBlockComponent, QuizBlockComponent, ChallengeBlockComponent, QuickRefComponent, BeforeAfterComponent, CommonMistakesComponent, VersionBadgeComponent, PageMetaComponent, PageCompleteComponent],
  templateUrl: './cva-demo.html',
  styleUrl: './cva-demo.scss',
})
export class CvaDemo implements OnInit {
  private fb = new FormBuilder() as unknown as FormBuilder;

  form = new FormBuilder().group({
    productName: ['', Validators.required],
    rating:      [0, [Validators.required, Validators.min(1)]],
    description: [''],
  });

  submitted = signal(false);

  ngOnInit() {
    // Programmatic value set to show CVA works both ways
    setTimeout(() => this.form.patchValue({ rating: 3 }), 500);
  }

  submit() {
    this.submitted.set(true);
    if (this.form.valid) {
      console.log('Review submitted:', this.form.value);
    }
  }

  get ratingCtrl() { return this.form.get('rating'); }

  qna: QnaItem[] = [
    { q: 'What is ControlValueAccessor?', a: 'CVA is an interface that makes a custom component work with Angular forms — both template-driven and reactive. Implement 4 methods: <code>writeValue</code>, <code>registerOnChange</code>, <code>registerOnTouched</code>, <code>setDisabledState</code>.' },
    { q: 'How do you register a component as a custom form control?', a: 'Add <code>NG_VALUE_ACCESSOR</code> to the component\'s providers: <code>{ provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => MyControl), multi: true }</code>. Angular injects it automatically when the component is used with <code>formControlName</code>.' },
    { q: 'What does writeValue() do?', a: '<code>writeValue(val)</code> is called by Angular when the form sets the control\'s value programmatically (e.g. <code>form.patchValue()</code>). Update your internal signal/state here. <strong>Never</strong> call <code>onChange()</code> inside — it causes an infinite loop.' },
    { q: 'What does registerOnChange() do?', a: '<code>registerOnChange(fn)</code> receives the callback Angular wants you to call when the user changes the value. Store it: <code>onChange = fn</code>. Then call <code>this.onChange(newValue)</code> whenever the user interacts with your control.' },
    { q: 'How do you propagate the touched state?', a: 'Store the callback from <code>registerOnTouched(fn)</code>. Call <code>this.onTouched()</code> when the user blurs/leaves your control — typically in a <code>(blur)</code> event handler. This marks the form control as touched.' },
    { q: 'Can a CVA component work inside both template-driven and reactive forms?', a: 'Yes — that\'s the whole point. Use it with <code>[(ngModel)]="value"</code> (template-driven) or <code>[formControlName]="\'rating\'"</code> (reactive) interchangeably. Angular drives it the same way through the CVA interface.' },
  ];

  theory: TheoryPoint[] = [
  {
    heading: 'What is ControlValueAccessor?',
    points: [
      'CVA is the bridge between a custom DOM element and Angular\'s form system (<code>FormControl</code> / <code>ngModel</code>).',
      'Any component implementing <code>ControlValueAccessor</code> can be used with <code>formControlName</code> exactly like a native input.',
      'You register it by providing <code>NG_VALUE_ACCESSOR</code> in the component\'s providers with <code>multi: true</code>.',
      'Use <code>forwardRef(() => MyComponent)</code> in the provider because the class is not yet defined at the point of use.',
    ],
  },
  {
    heading: 'The 4 methods you must implement',
    points: [
      '<code>writeValue(val)</code>: Angular calls this to push a value INTO your control (e.g. from <code>patchValue</code>).',
      '<code>registerOnChange(fn)</code>: Angular gives you a callback. Call <code>fn(newValue)</code> whenever the user changes the value.',
      '<code>registerOnTouched(fn)</code>: Angular gives you a callback. Call <code>fn()</code> when the user blurs or finishes interacting.',
      '<code>setDisabledState(disabled)</code>: called when the parent form control is programmatically enabled/disabled.',
    ],
  },
  {
    heading: 'Modern CVA with signals',
    points: [
      'Store value in <code>signal()</code> and call it in <code>writeValue</code>: <code>this.value.set(val)</code>.',
      'Store <code>isDisabled</code> in a signal too — <code>setDisabledState</code> calls <code>this.isDisabled.set(disabled)</code>.',
      'On user interaction: <code>this.value.set(newVal); this.onChange(newVal); this.onTouched();</code>.',
      'Signals in the template auto-update — no <code>ChangeDetectorRef.markForCheck()</code> needed even with OnPush.',
    ],
  },
  {
    heading: 'Key points to remember',
    points: [
      'CVA makes your component a first-class Angular form citizen — validation, dirty/touched state all work automatically.',
      'You can layer validators on top: <code>new FormControl(0, Validators.min(1))</code> works with any CVA component.',
      'Do NOT call <code>onChange</code> inside <code>writeValue</code> — that would create an infinite loop.',
      'Test with both <code>formControlName</code> and standalone <code>[(ngModel)]</code> to ensure both paths work.',
    ],
  },
];

  quiz: QuizQuestion[] = [
    { q: 'Which Angular token must be provided in a component\'s providers array to register it as a custom form control?', options: ['FORM_CONTROL_TOKEN', 'NG_VALUE_ACCESSOR', 'CONTROL_VALUE_ACCESSOR', 'NG_VALIDATORS'], answer: 1, explanation: 'NG_VALUE_ACCESSOR is the multi-provider token Angular uses to discover custom form controls. You supply it with { provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => MyComponent), multi: true }.' },
    { q: 'Why is forwardRef(() => StarRatingComponent) used when providing NG_VALUE_ACCESSOR?', options: ['forwardRef is required for all multi-providers in Angular', 'It prevents memory leaks when the component is destroyed', 'The class is referenced in the decorator metadata before it is fully defined', 'It enables lazy loading of the component'], answer: 2, explanation: 'The providers array inside @Component is evaluated before the class declaration is complete. forwardRef wraps the reference in a thunk so Angular resolves it later, after the class exists.' },
    { q: 'Inside writeValue(val), you must NOT call this.onChange(val). Why?', options: ['onChange is not yet assigned when writeValue is called', 'It would mark the form control as dirty unexpectedly', 'It would create an infinite loop between Angular and the component', 'writeValue is called in a zone where change detection is disabled'], answer: 2, explanation: 'Angular calls writeValue to push a value into the control. If you call onChange inside it, that notifies Angular of a value change, which triggers writeValue again — causing an infinite loop.' },
    { q: 'In the StarRatingComponent, clicking a star that is already selected (value === star) sets the rating to what?', options: ['5', '1', '-1', '0'], answer: 3, explanation: 'selectStar computes: const newVal = this.value() === star ? 0 : star. Clicking the currently selected star deselects it by setting the value to 0, acting as a toggle.' },
    { q: 'Which method should you call when the user leaves (blurs) your custom control, and what does it accomplish?', options: ['onChange() — notifies Angular that the value changed', 'writeValue() — resets the control to its initial value', 'onTouched() — marks the FormControl as touched so validators display errors', 'setDisabledState() — prevents further interaction until re-enabled'], answer: 2, explanation: 'The callback stored from registerOnTouched() should be called on blur. Angular then marks the FormControl as touched, which is the signal template-driven and reactive forms use to decide whether to show validation errors.' },
  ];

  challenge: Challenge = {
    title: 'Build a Thumbs-Up / Thumbs-Down CVA Control',
    description: 'Create a standalone Angular component called ThumbRatingComponent that lets users vote thumbs-up (1) or thumbs-down (-1). It must implement ControlValueAccessor so it works with formControlName inside a ReactiveForm. Wire it into a small demo form and display the current value below the buttons.',
    language: 'typescript',
    hints: [
      'Provide NG_VALUE_ACCESSOR with multi: true and useExisting: forwardRef(() => ThumbRatingComponent) in the @Component providers.',
      'Store the current value in a signal(0) and call this.onChange(newVal) plus this.onTouched() whenever a thumb button is clicked.',
      'In writeValue(val), call this.value.set(val ?? 0) — do NOT call this.onChange() here.',
      'Use setDisabledState(disabled) to toggle a signal and conditionally apply a CSS class / pointer-events style on the host.',
    ],
    starterCode: `import { Component, signal, forwardRef } from '@angular/core';
import {
  ControlValueAccessor, NG_VALUE_ACCESSOR,
  FormBuilder, ReactiveFormsModule, Validators
} from '@angular/forms';

// TODO 1: Add NG_VALUE_ACCESSOR provider to register this as a CVA
@Component({
  selector: 'app-thumb-rating',
  standalone: true,
  template: \`
    <div class="thumbs">
      <button type="button"
        [class.active]="value() === 1"
        (click)="vote(1)">👍</button>
      <button type="button"
        [class.active]="value() === -1"
        (click)="vote(-1)">👎</button>
      <span>{{ value() === 1 ? 'Liked' : value() === -1 ? 'Disliked' : 'No vote' }}</span>
    </div>\`,
  styles: [\`.thumbs { display:flex; gap:.75rem; align-items:center; }
    button { font-size:1.5rem; background:none; border:2px solid transparent; border-radius:8px;
      cursor:pointer; padding:.25rem .5rem; }
    button.active { border-color:#6366f1; background:#ede9fe; }\`],
  // TODO 1: providers: [...]
})
export class ThumbRatingComponent implements ControlValueAccessor {
  value = signal(0);
  isDisabled = signal(false);

  private onChange: (v: number) => void = () => {};
  private onTouched: () => void = () => {};

  vote(val: number) {
    // TODO 2: toggle (clicking the active thumb again resets to 0)
    // then update the signal, call onChange and onTouched
  }

  // TODO 3: implement all 4 CVA methods
  writeValue(val: number) { /* ... */ }
  registerOnChange(fn: (v: number) => void) { /* ... */ }
  registerOnTouched(fn: () => void) { /* ... */ }
  setDisabledState(disabled: boolean) { /* ... */ }
}

// ── Demo ────────────────────────────────────────────────
@Component({
  selector: 'app-root',
  standalone: true,
  imports: [ReactiveFormsModule, ThumbRatingComponent],
  template: \`
    <form [formGroup]="form" (ngSubmit)="submit()">
      <label>Rate this article:</label>
      <app-thumb-rating formControlName="vote" />
      <button type="submit">Submit</button>
      <p *ngIf="result">You submitted: {{ result }}</p>
    </form>\`,
})
export class AppComponent {
  form = new FormBuilder().group({ vote: [0, Validators.required] });
  result = '';
  submit() {
    if (this.form.valid) this.result = JSON.stringify(this.form.value);
  }
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
    button { font-size:1.5rem; background:none; border:2px solid transparent; border-radius:8px;
      cursor:pointer; padding:.25rem .5rem; }
    button.active { border-color:#6366f1; background:#ede9fe; }\`],
  providers: [{
    provide: NG_VALUE_ACCESSOR,
    useExisting: forwardRef(() => ThumbRatingComponent),
    multi: true,
  }],
})
export class ThumbRatingComponent implements ControlValueAccessor {
  value = signal(0);
  isDisabled = signal(false);

  private onChange: (v: number) => void = () => {};
  private onTouched: () => void = () => {};

  vote(val: number) {
    if (this.isDisabled()) return;
    const newVal = this.value() === val ? 0 : val; // toggle off if same
    this.value.set(newVal);
    this.onChange(newVal);
    this.onTouched();
  }

  writeValue(val: number) { this.value.set(val ?? 0); }
  registerOnChange(fn: (v: number) => void) { this.onChange = fn; }
  registerOnTouched(fn: () => void) { this.onTouched = fn; }
  setDisabledState(disabled: boolean) { this.isDisabled.set(disabled); }
}

// ── Demo ────────────────────────────────────────────────
@Component({
  selector: 'app-root',
  standalone: true,
  imports: [ReactiveFormsModule, ThumbRatingComponent],
  template: \`
    <form [formGroup]="form" (ngSubmit)="submit()">
      <label>Rate this article:</label>
      <app-thumb-rating formControlName="vote" />
      <button type="submit">Submit</button>
      <p>Form value: {{ form.value | json }}</p>
      <p>Valid: {{ form.valid }}</p>
    </form>\`,
})
export class AppComponent {
  form = new FormBuilder().group({ vote: [0, Validators.required] });
  submit() { console.log('Submitted:', this.form.value); }
}`,
  };

  quickRef: QuickRefItem[] = [
    { name: 'ControlValueAccessor', type: 'interface', desc: 'Interface that custom form controls implement to integrate with Angular\'s reactive and template-driven form APIs.' , since: '2'},
    { name: 'NG_VALUE_ACCESSOR', type: 'token', desc: 'Multi-provider injection token used to register a component as a custom form control recognized by Angular forms.' , since: '2'},
    { name: 'forwardRef', type: 'function', desc: 'Wraps a class reference in a thunk so it can be used in provider metadata before the class declaration is complete.' , since: '2'},
    { name: 'writeValue', type: 'hook', desc: 'Called by Angular to push a value into the custom control; update internal state here but never call onChange() inside it.' , since: '2'},
    { name: 'registerOnChange', type: 'hook', desc: 'Receives the Angular callback to store; call it with the new value whenever the user changes the control\'s value.' , since: '2'},
    { name: 'registerOnTouched', type: 'hook', desc: 'Receives the Angular callback to store; call it when the user blurs or finishes interacting to mark the control as touched.' , since: '2'},
    { name: 'setDisabledState', type: 'hook', desc: 'Called by Angular when the parent FormControl is programmatically enabled or disabled; reflect the state in the UI.' , since: '2'},
    { name: 'signal', type: 'function', desc: 'Creates a reactive signal primitive; ideal for storing value and isDisabled state inside a CVA component for automatic UI updates.' , since: '16'},
    { name: 'FormBuilder', type: 'class', desc: 'Service that provides shorthand methods for constructing reactive form groups and controls.' , since: '2'},
    { name: 'ReactiveFormsModule', type: 'class', desc: 'NgModule (or standalone import) that enables reactive form directives like formGroup and formControlName in templates.' , since: '2'},
  ];

  beforeAfter: BeforeAfterExample[] = [
    { title: 'Registering a CVA: class field vs signal for disabled state', before: '// Old: plain boolean class field\nexport class MyControl implements ControlValueAccessor {\n  isDisabled = false;\n  setDisabledState(d: boolean) { this.isDisabled = d; }\n  // template must use ChangeDetectorRef with OnPush\n}', after: '// New: signal — works seamlessly with OnPush\nexport class MyControl implements ControlValueAccessor {\n  isDisabled = signal(false);\n  setDisabledState(d: boolean) { this.isDisabled.set(d); }\n  // template auto-updates; no markForCheck needed\n}',
      note: 'Signals eliminate the need for manual change detection in CVA components.' },
    { title: 'Iterating star options: *ngFor vs @for', before: '<!-- Old: structural directive -->\n<span *ngFor=\'let star of stars\'\n  [class.filled]=\'star <= value\'>\n  ★\n</span>', after: '<!-- New: built-in control flow (Angular 17+) -->\n@for (star of [1,2,3,4,5]; track star) {\n  <span [class.filled]=\'star <= value()\'>★</span>\n}',
      note: '@for with track replaces *ngFor and provides better performance and required tracking.' },
    { title: 'Providing the token: forwardRef with useExisting', before: '// Old pattern without forwardRef (causes runtime error)\nproviders: [{\n  provide: NG_VALUE_ACCESSOR,\n  useExisting: StarRatingComponent, // class not yet defined\n  multi: true\n}]', after: '// Correct: forwardRef defers resolution\nproviders: [{\n  provide: NG_VALUE_ACCESSOR,\n  useExisting: forwardRef(() => StarRatingComponent),\n  multi: true\n}]',
      note: 'forwardRef is required because the providers array is evaluated before the class body is fully defined.' },
  ];

  mistakes: CommonMistake[] = [
    { title: 'Calling onChange() inside writeValue()', wrong: 'writeValue(val: number) {\n  this.value.set(val);\n  this.onChange(val); // WRONG: triggers infinite loop\n}', right: 'writeValue(val: number) {\n  this.value.set(val ?? 0); // only update internal state\n}', explanation: 'Angular calls writeValue to push a value in. Calling onChange inside it notifies Angular of a change, which triggers writeValue again, creating an infinite loop.'  },
    { title: 'Forgetting multi: true on the NG_VALUE_ACCESSOR provider', wrong: 'providers: [{\n  provide: NG_VALUE_ACCESSOR,\n  useExisting: forwardRef(() => MyControl)\n  // missing multi: true\n}]', right: 'providers: [{\n  provide: NG_VALUE_ACCESSOR,\n  useExisting: forwardRef(() => MyControl),\n  multi: true\n}]', explanation: 'NG_VALUE_ACCESSOR is a multi-provider token. Omitting multi: true overwrites Angular\'s built-in accessor registrations and breaks native inputs in the same form.'  },
    { title: 'Not calling onTouched() on user interaction', wrong: 'selectStar(star: number) {\n  this.value.set(star);\n  this.onChange(star);\n  // forgot onTouched — validators never display errors\n}', right: 'selectStar(star: number) {\n  this.value.set(star);\n  this.onChange(star);\n  this.onTouched(); // marks control as touched\n}', explanation: 'Without calling onTouched(), the FormControl is never marked as touched, so reactive-form validators will not display error messages to the user.'  },
    { title: 'Using useClass instead of useExisting for the CVA provider', wrong: 'providers: [{\n  provide: NG_VALUE_ACCESSOR,\n  useClass: StarRatingComponent, // creates a SECOND instance\n  multi: true\n}]', right: 'providers: [{\n  provide: NG_VALUE_ACCESSOR,\n  useExisting: forwardRef(() => StarRatingComponent),\n  multi: true\n}]', explanation: 'useClass creates a new instance separate from the component Angular renders; useExisting reuses the same instance so the form and the template stay in sync.'  },
  ];

  versionItems: VersionInfo[] = [
    { version: 'Angular 16', label: 'Signals in CVA', features: ['Store value and isDisabled as signal() primitives inside ControlValueAccessor components', 'Templates auto-update without ChangeDetectorRef.markForCheck() even with OnPush strategy', 'setDisabledState becomes a one-liner: this.isDisabled.set(disabled)'] },
    { version: 'Angular 17', label: '@for / @if in CVA templates', features: ['Replace *ngFor with @for (star of stars; track star) in custom control templates', 'Built-in control flow (@if, @for) is more performant and requires no CommonModule import', 'track expression is mandatory in @for, improving reconciliation performance'] },
  ];

  tabs: CodeTab[] = [
    {
      label: 'ControlValueAccessor',
      language: 'typescript',
      code: `import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { forwardRef } from '@angular/core';

@Component({
  providers: [{
    provide: NG_VALUE_ACCESSOR,
    useExisting: forwardRef(() => StarRatingComponent),
    multi: true,
  }],
})
export class StarRatingComponent implements ControlValueAccessor {
  value    = signal(0);
  isDisabled = signal(false);

  // Angular calls these 3 to wire up form control:
  writeValue(val: number)              { this.value.set(val ?? 0); }
  registerOnChange(fn: (v: number) => void) { this.onChange = fn; }
  registerOnTouched(fn: () => void)    { this.onTouched = fn; }
  setDisabledState(disabled: boolean)  { this.isDisabled.set(disabled); }

  // When user interacts:
  selectStar(star: number) {
    this.value.set(star);
    this.onChange(star);   // ← notify form
    this.onTouched();      // ← mark touched
  }
}`,
    },
    {
      label: 'Usage in template',
      language: 'html',
      code: `<!-- Use exactly like a native input inside a form -->
<form [formGroup]="form">
  <app-star-rating formControlName="rating" />
</form>

<!-- Or standalone with ngModel -->
<app-star-rating [(ngModel)]="myRating" />

<!-- Or with template-driven forms -->
<app-star-rating name="rating" ngModel required />`,
    },
  ];
}
