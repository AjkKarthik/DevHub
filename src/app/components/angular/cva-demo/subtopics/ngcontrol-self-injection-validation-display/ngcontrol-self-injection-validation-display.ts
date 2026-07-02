import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../shared/theory-block/theory-block';
import { LivePlaygroundComponent, PlaygroundFile } from '../../../../shared/live-playground/live-playground';
import { TryItComponent, TryItExercise } from '../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-ngcontrol-self-injection-validation-display-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent,
    LivePlaygroundComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './ngcontrol-self-injection-validation-display.html',
  styleUrl: './ngcontrol-self-injection-validation-display.scss',
})
export class NgcontrolSelfInjectionValidationDisplaySubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The problem — a CVA component has no built-in way to know it is invalid',
      points: [
        'The basic 4-method CVA interface (<code>writeValue</code>, <code>registerOnChange</code>, <code>registerOnTouched</code>, <code>setDisabledState</code>) never tells your component whether the PARENT FormControl currently considers it invalid — by default, a custom star-rating or color-picker component has no way to show its own red error border without the PARENT template manually passing that information down as an <code>&#64;Input()</code>, which is extra boilerplate for every consumer.',
        '<code>inject(NgControl, { self: true })</code> — injected INSIDE the CVA component itself — gives direct access to the SAME <code>NgControl</code> instance (<code>FormControlName</code>, <code>FormControlDirective</code>, or <code>NgModel</code>) that wraps this component, exposing <code>ngControl.invalid</code>, <code>ngControl.touched</code>, and <code>ngControl.errors</code> directly — no parent wiring needed.',
      ],
    },
    {
      heading: 'Avoiding the circular DI problem',
      points: [
        'Injecting <code>NgControl</code> directly with the standard <code>{ self: true }</code> option can throw a CIRCULAR DEPENDENCY error, because <code>NgControl</code> itself depends on the <code>NG_VALUE_ACCESSOR</code> your component is simultaneously trying to register as. The standard fix: inject it with <code>{ optional: true }</code> too, and in the constructor manually assign <code>this.ngControl.valueAccessor = this;</code> — bypassing the normal <code>NG_VALUE_ACCESSOR</code> multi-provider registration ENTIRELY.',
        'This is a genuinely DIFFERENT registration technique from the <code>providers: [{ provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(...), multi: true }]</code> pattern on the main topic page — you use ONE approach or the OTHER, not both, since manually setting <code>valueAccessor</code> already tells Angular which accessor to use for this control.',
      ],
    },
    {
      heading: 'Reading validation state reactively',
      points: [
        'Since <code>ngControl.invalid</code>/<code>touched</code> are plain getters on a class instance (not signals or Observables), they will NOT automatically trigger change detection when they change — combine with <code>ngControl.statusChanges</code> (an Observable) piped through <code>toSignal()</code>, or call <code>markForCheck()</code> manually inside a subscription, to make the error display update reactively under <code>OnPush</code>.',
        'The template can then show its OWN error styling directly: <code>[class.is-invalid]="ngControl.invalid && ngControl.touched"</code> — completely self-contained, with zero extra input bindings the consuming form template needs to wire up.',
      ],
    },
  ];

  liveDemoFiles: PlaygroundFile[] = [
    {
      path: 'src/app/star-rating.ts',
      content: `import { Component, inject, signal, computed } from '@angular/core';
import { ControlValueAccessor, NgControl } from '@angular/forms';
import { toSignal } from '@angular/core/rxjs-interop';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-star-rating',
  standalone: true,
  template: \`
    <div [class.is-invalid]="isInvalid()">
      @for (i of [1,2,3,4,5]; track i) {
        <span (click)="select(i)" style="cursor: pointer; font-size: 1.5rem;">
          {{ i <= value() ? '★' : '☆' }}
        </span>
      }
    </div>
    @if (isInvalid()) {
      <p style="color: red;">Please select at least one star.</p>
    }
  \`,
})
export class StarRatingComponent implements ControlValueAccessor {
  value = signal(0);
  private onChange: (v: number) => void = () => {};
  private onTouched: () => void = () => {};

  // Self-inject NgControl — optional to avoid a circular DI error
  private ngControl = inject(NgControl, { self: true, optional: true });

  constructor() {
    if (this.ngControl) {
      // Manually assign — an alternative to the NG_VALUE_ACCESSOR provider array
      this.ngControl.valueAccessor = this;
    }
  }

  // statusChanges is an Observable — bridge to a signal for reactive templates
  private status = toSignal(this.ngControl?.statusChanges ?? new Observable<string>(), { initialValue: 'PENDING' });
  isInvalid = computed(() => this.ngControl?.invalid && this.ngControl?.touched);

  select(i: number) {
    const newVal = this.value() === i ? 0 : i;
    this.value.set(newVal);
    this.onChange(newVal);
    this.onTouched();
  }

  writeValue(val: number): void { this.value.set(val ?? 0); }
  registerOnChange(fn: (v: number) => void): void { this.onChange = fn; }
  registerOnTouched(fn: () => void): void { this.onTouched = fn; }
  setDisabledState(): void {}
}
`,
    },
    {
      path: 'src/app/app.ts',
      content: `import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { StarRatingComponent } from './star-rating';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [ReactiveFormsModule, StarRatingComponent],
  template: \`
    <h3>Self-validating CVA — no parent wiring needed for the error display</h3>
    <form [formGroup]="form">
      <app-star-rating formControlName="rating" />
    </form>
    <button (click)="form.get('rating')!.markAsTouched()">Mark touched (simulate blur)</button>
  \`,
})
export class App {
  private fb = inject(FormBuilder);
  form = this.fb.group({
    rating: [0, Validators.min(1)],
  });
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
  <head><title>NgControl self-injection for validation display</title></head>
  <body><app-root></app-root></body>
</html>
`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'Click "Mark touched" without selecting any stars, and confirm the error message appears — then click a star and confirm it disappears.',
    hint: 'markAsTouched() sets ngControl.touched to true; combined with Validators.min(1) making the control invalid at value 0, isInvalid() becomes true and the error message renders. Selecting a star sets the value to >= 1, making the control valid.',
    solution: `// No code change needed — this confirms the existing self-validation flow:
// markAsTouched() + an invalid value (0) makes isInvalid() true,
// showing the error. Selecting any star sets a valid value >= 1,
// making isInvalid() false again.`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'a CVA component always needs the parent template to pass touched/invalid state down as explicit @Input() bindings.',
      reality: 'injecting NgControl with { self: true } inside the CVA component itself gives direct access to invalid/touched/errors — the component can manage its own error display with zero extra input bindings from the consumer.',
    },
    {
      thought: 'you should use both the NG_VALUE_ACCESSOR providers array AND manually set ngControl.valueAccessor = this for extra safety.',
      reality: 'these are two ALTERNATIVE registration techniques — use one or the other, not both; manually assigning valueAccessor already tells Angular which accessor to use, making the providers array registration redundant (and potentially conflicting).',
    },
    {
      thought: 'ngControl.invalid and ngControl.touched automatically trigger change detection when they change.',
      reality: 'they are plain getters, not signals or Observables — under OnPush, you need to bridge ngControl.statusChanges (an Observable) through toSignal() or manually call markForCheck() to make the error display update reactively.',
    },
  ];
}
