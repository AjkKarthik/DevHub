import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../shared/theory-block/theory-block';
import { LivePlaygroundComponent, PlaygroundFile } from '../../../../shared/live-playground/live-playground';
import { TryItComponent, TryItExercise } from '../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-testing-cva-components-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent,
    LivePlaygroundComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './testing-cva-components.html',
  styleUrl: './testing-cva-components.scss',
})
export class TestingCvaComponentsSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'Two testing strategies — isolated CVA logic vs. full form integration',
      points: [
        'ISOLATED tests create the component directly via <code>TestBed.createComponent(StarRatingComponent)</code> and call the CVA interface methods (<code>writeValue</code>, <code>registerOnChange</code>) DIRECTLY as plain method calls — no <code>FormControl</code>, no <code>formControlName</code>, no host template needed. This tests the component\'s CVA LOGIC in complete isolation, fast and simple.',
        'INTEGRATION tests wrap the component in a real <code>FormGroup</code> via a test HOST component with <code>formControlName="rating"</code> in its template — this verifies the FULL WIRING actually works end-to-end (the <code>NG_VALUE_ACCESSOR</code> registration, <code>forwardRef</code>, DOM events reaching the form) — catching bugs the isolated test cannot, like a forgotten <code>multi: true</code>.',
      ],
    },
    {
      heading: 'Spying on the registered callbacks',
      points: [
        '<code>registerOnChange</code> and <code>registerOnTouched</code> exist specifically so Angular can hand your component ITS OWN callbacks — in an isolated test, call <code>component.registerOnChange(jasmine.createSpy(\'onChange\'))</code> yourself, trigger a user interaction, and assert the spy was called WITH THE EXPECTED VALUE: <code>expect(onChangeSpy).toHaveBeenCalledWith(3)</code>.',
        'Testing <code>setDisabledState</code> is specifically important because it is the MOST commonly forgotten CVA method in real implementations — call <code>component.setDisabledState(true)</code> directly and assert the component\'s internal disabled signal/flag updated, and that the rendered DOM reflects it (e.g., a disabled attribute or a CSS class).',
      ],
    },
    {
      heading: 'What integration tests catch that isolated tests miss',
      points: [
        'A test that only calls CVA methods directly CANNOT catch a missing <code>multi: true</code> on the <code>NG_VALUE_ACCESSOR</code> provider, a wrong <code>forwardRef</code> reference, or a typo in the component selector used in a host template — these are WIRING bugs, only visible when the component is actually used inside a real <code>[formControl]</code>/<code>formControlName</code> context in a host component.',
        'The standard pattern: write a small TEST-ONLY host component with a <code>FormGroup</code> and the CVA component bound via <code>formControlName</code>, call <code>fixture.detectChanges()</code>, interact with the DOM (click a star, type in an input), and assert the FormGroup\'s value updated — this is the test that actually proves the component works as a real form field, not just that its internal logic is correct.',
      ],
    },
  ];

  liveDemoFiles: PlaygroundFile[] = [
    {
      path: 'src/app/star-rating.ts',
      content: `import { Component, forwardRef, signal } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

@Component({
  selector: 'app-star-rating',
  standalone: true,
  providers: [{
    provide: NG_VALUE_ACCESSOR,
    useExisting: forwardRef(() => StarRatingComponent),
    multi: true,
  }],
  template: \`
    <div [class.disabled]="disabled()">
      @for (i of [1,2,3,4,5]; track i) {
        <button type="button" [disabled]="disabled()" (click)="select(i)" data-testid="star">
          {{ i <= value() ? '★' : '☆' }}
        </button>
      }
    </div>
  \`,
})
export class StarRatingComponent implements ControlValueAccessor {
  value = signal(0);
  disabled = signal(false);
  private onChange: (v: number) => void = () => {};
  private onTouched: () => void = () => {};

  select(i: number) {
    if (this.disabled()) return;
    const newVal = this.value() === i ? 0 : i;
    this.value.set(newVal);
    this.onChange(newVal);
    this.onTouched();
  }

  writeValue(val: number): void { this.value.set(val ?? 0); }
  registerOnChange(fn: (v: number) => void): void { this.onChange = fn; }
  registerOnTouched(fn: () => void): void { this.onTouched = fn; }
  setDisabledState(disabled: boolean): void { this.disabled.set(disabled); }
}
`,
    },
    {
      path: 'src/app/star-rating.spec.ts',
      content: `import { TestBed, ComponentFixture } from '@angular/core/testing';
import { Component } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { StarRatingComponent } from './star-rating';

describe('StarRatingComponent — isolated CVA logic', () => {
  let fixture: ComponentFixture<StarRatingComponent>;
  let component: StarRatingComponent;

  beforeEach(() => {
    fixture = TestBed.createComponent(StarRatingComponent);
    component = fixture.componentInstance;
  });

  it('calls the registered onChange callback with the new value', () => {
    const onChangeSpy = jasmine.createSpy('onChange');
    component.registerOnChange(onChangeSpy);

    component.select(3);

    expect(onChangeSpy).toHaveBeenCalledWith(3);
  });

  it('deselects when clicking the already-selected star', () => {
    const onChangeSpy = jasmine.createSpy('onChange');
    component.registerOnChange(onChangeSpy);
    component.writeValue(3);

    component.select(3); // clicking the same star again

    expect(component.value()).toBe(0);
    expect(onChangeSpy).toHaveBeenCalledWith(0);
  });

  it('setDisabledState updates the disabled signal', () => {
    component.setDisabledState(true);
    expect(component.disabled()).toBe(true);
  });
});

// Test host component — verifies the FULL formControlName wiring
@Component({
  standalone: true,
  imports: [ReactiveFormsModule, StarRatingComponent],
  template: \`<form [formGroup]="form"><app-star-rating formControlName="rating" /></form>\`,
})
class TestHostComponent {
  form = new FormBuilder().group({ rating: [0] });
}

describe('StarRatingComponent — full form integration', () => {
  it('updates the parent FormGroup value when a star is clicked', () => {
    const fixture = TestBed.createComponent(TestHostComponent);
    fixture.detectChanges();

    const stars = fixture.nativeElement.querySelectorAll('[data-testid="star"]');
    stars[2].click(); // click the 3rd star
    fixture.detectChanges();

    expect(fixture.componentInstance.form.get('rating')!.value).toBe(3);
  });
});
`,
    },
    {
      path: 'src/app/app.ts',
      content: `import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { JsonPipe } from '@angular/common';
import { StarRatingComponent } from './star-rating';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [ReactiveFormsModule, StarRatingComponent, JsonPipe],
  template: \`
    <h3>The component under test — see star-rating.spec.ts for the actual CVA tests</h3>
    <form [formGroup]="form">
      <app-star-rating formControlName="rating" />
    </form>
    <p>{{ form.value | json }}</p>
  \`,
})
export class App {
  private fb = inject(FormBuilder);
  form = this.fb.group({ rating: [0] });
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
  <head><title>Testing CVA components</title></head>
  <body><app-root></app-root></body>
</html>
`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'Add a fourth isolated test asserting that registerOnTouched\'s callback fires when select() is called.',
    hint: 'const onTouchedSpy = jasmine.createSpy(\'onTouched\'); component.registerOnTouched(onTouchedSpy); component.select(2); expect(onTouchedSpy).toHaveBeenCalled();',
    solution: `it('calls the registered onTouched callback on interaction', () => {
  const onTouchedSpy = jasmine.createSpy('onTouched');
  component.registerOnTouched(onTouchedSpy);

  component.select(2);

  expect(onTouchedSpy).toHaveBeenCalled();
});`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'testing a CVA component always requires wrapping it in a real FormGroup with formControlName.',
      reality: 'isolated tests that call writeValue/registerOnChange directly (with no FormGroup at all) are faster and sufficient for testing the component\'s internal logic — integration tests with a real form are a SEPARATE, complementary check for the wiring itself.',
    },
    {
      thought: 'an isolated test calling CVA methods directly can catch a missing multi: true on the NG_VALUE_ACCESSOR provider.',
      reality: 'wiring bugs like a missing multi: true, a wrong forwardRef, or a selector typo are only visible in an INTEGRATION test using a real formControlName — isolated tests bypass that registration mechanism entirely.',
    },
    {
      thought: 'setDisabledState is a minor method not worth dedicated test coverage.',
      reality: 'it is specifically called out as the MOST commonly forgotten CVA method in real implementations — dedicated test coverage for it catches a genuinely common class of bug (form.disable() silently having no visual effect).',
    },
  ];
}
