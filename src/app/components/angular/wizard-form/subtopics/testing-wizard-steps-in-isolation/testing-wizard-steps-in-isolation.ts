import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../shared/theory-block/theory-block';
import { LivePlaygroundComponent, PlaygroundFile } from '../../../../shared/live-playground/live-playground';
import { TryItComponent, TryItExercise } from '../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-testing-wizard-steps-in-isolation-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent,
    LivePlaygroundComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './testing-wizard-steps-in-isolation.html',
  styleUrl: './testing-wizard-steps-in-isolation.scss',
})
export class TestingWizardStepsInIsolationSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main topic\'s last bullet, actually demonstrated',
      points: [
        'The main Wizard Form page\'s "Best practices" section ends with "test each step\'s FormGroup in isolation with inject(FormBuilder) — no component fixture needed" but never shows the test code. This subtopic writes both tiers: fixture-FREE FormGroup unit tests, and full-fixture tests that simulate real Next/Back navigation through the component.',
      ],
    },
    {
      heading: 'Tier 1 — testing a FormGroup with zero Angular test machinery',
      points: [
        '<code>FormBuilder</code> has no constructor dependencies, so you can write <code>new FormBuilder()</code> directly in a plain <code>describe</code> block — no <code>TestBed.configureTestingModule</code>, no fixture, no <code>async</code>/<code>await</code>. This is the FASTEST tier of test: pure logic, milliseconds to run, and it exercises the exact validators the component uses.',
        'Build the same step group the component builds, then assert directly: <code>expect(step0.invalid).toBe(true)</code> for empty required fields, then <code>step0.patchValue(&#123; firstName: \'Ada\' &#125;)</code> and assert <code>.valid</code> flips. This tests the VALIDATION RULES in total isolation from navigation, DOM, or change detection.',
        'Because there is no fixture, this tier cannot catch template-binding mistakes (e.g., a typo in <code>formControlName</code>) — it only proves the validators themselves are correct. Pair it with Tier 2 for full coverage.',
      ],
    },
    {
      heading: 'Tier 2 — full-fixture navigation tests',
      points: [
        '<code>TestBed.createComponent(WizardFormDemo)</code> plus <code>fixture.detectChanges()</code> gives you the REAL component, including its <code>step</code> signal and <code>next()</code>/<code>back()</code> methods — call <code>component.next()</code> directly rather than simulating a button click, since the click handler is a thin wrapper with no logic of its own to test separately.',
        'To assert blocked navigation: leave step0 empty, call <code>component.next()</code>, then assert <code>component.step()</code> is STILL <code>0</code> — this proves the invalid-step guard actually prevented advancement, not just that the button exists.',
        'To assert successful navigation: patch valid values into <code>component.step0</code>, call <code>next()</code>, then assert <code>component.step() === 1</code> AND (after <code>fixture.detectChanges()</code>) that the DOM\'s <code>@switch</code> now renders step 1\'s markup — checking both the signal AND the rendered output catches bugs in either layer.',
        'To assert Back never blocks: make step1 deliberately invalid, call <code>component.back()</code>, and assert <code>component.step()</code> decremented anyway — this is the one navigation path the main topic explicitly says must NEVER validate, so it deserves its own explicit test rather than being assumed correct.',
      ],
    },
    {
      heading: 'Testing the final payload assembly without touching the DOM',
      points: [
        'The <code>allValues</code> getter spreads three FormGroups\' <code>.value</code> into one object — test it directly: <code>component.step0.setValue(...); component.step1.setValue(...); component.step2.setValue(...); expect(component.allValues).toEqual(&#123; ...expected &#125;)</code>. No fixture rendering, no button clicks — just a plain-object equality assertion on the getter\'s output.',
        'Use <code>setValue()</code> (not <code>patchValue()</code>) in this specific test — it forces you to provide every key in the group, which doubles as a regression check: if a future edit adds a new field to <code>step0</code> without updating the test, <code>setValue()</code> throws immediately instead of silently leaving the new field at its default.',
      ],
    },
  ];

  liveDemoFiles: PlaygroundFile[] = [
    {
      path: 'src/app/wizard.ts',
      content: `import { Component, signal, computed, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

@Component({
  selector: 'app-wizard',
  standalone: true,
  imports: [ReactiveFormsModule],
  template: \`
    @switch (step()) {
      @case (0) {
        <form [formGroup]="step0" class="step-form">
          <input formControlName="firstName" placeholder="First name" />
        </form>
      }
      @case (1) {
        <form [formGroup]="step1" class="step-form">
          <input type="email" formControlName="email" placeholder="Email" />
        </form>
      }
    }
    <div class="nav">
      <button (click)="back()" [disabled]="step() === 0">Back</button>
      <button (click)="next()">Next</button>
    </div>
  \`,
})
export class WizardComponent {
  private fb = inject(FormBuilder);

  step = signal(0);

  step0 = this.fb.group({
    firstName: ['', Validators.required],
  });

  step1 = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
  });

  currentForm = computed(() => [this.step0, this.step1][this.step()] ?? null);

  next() {
    const form = this.currentForm();
    if (form) { form.markAllAsTouched(); if (form.invalid) return; }
    this.step.update(s => Math.min(s + 1, 1));
  }

  back() {
    this.step.update(s => Math.max(s - 1, 0));
  }

  get allValues() {
    return { ...this.step0.value, ...this.step1.value };
  }
}
`,
    },
    {
      path: 'src/app/wizard.spec.ts',
      content: `import { TestBed } from '@angular/core/testing';
import { FormBuilder, Validators } from '@angular/forms';
import { WizardComponent } from './wizard';

describe('Tier 1 — step0 FormGroup validators, no TestBed at all', () => {
  it('is invalid when firstName is empty', () => {
    const fb = new FormBuilder(); // no DI needed — FormBuilder has no deps
    const step0 = fb.group({ firstName: ['', Validators.required] });
    expect(step0.invalid).toBe(true);
  });

  it('becomes valid once firstName is patched in', () => {
    const fb = new FormBuilder();
    const step0 = fb.group({ firstName: ['', Validators.required] });
    step0.patchValue({ firstName: 'Ada' });
    expect(step0.valid).toBe(true);
  });
});

describe('Tier 2 — WizardComponent navigation, full fixture', () => {
  function createWizard() {
    const fixture = TestBed.createComponent(WizardComponent);
    fixture.detectChanges();
    return { fixture, component: fixture.componentInstance };
  }

  it('blocks next() when step0 is invalid', () => {
    const { component } = createWizard();
    component.next();
    expect(component.step()).toBe(0); // did NOT advance
  });

  it('advances on next() once step0 is valid, and the DOM updates', () => {
    const { fixture, component } = createWizard();
    component.step0.patchValue({ firstName: 'Ada' });
    component.next();
    fixture.detectChanges();

    expect(component.step()).toBe(1);
    const emailInput = fixture.nativeElement.querySelector('input[type="email"]');
    expect(emailInput).not.toBeNull(); // step 1's markup actually rendered
  });

  it('back() always succeeds, even from an invalid step1', () => {
    const { component } = createWizard();
    component.step0.patchValue({ firstName: 'Ada' });
    component.next(); // now on step 1
    expect(component.step()).toBe(1);

    // step1.email is left empty/invalid — back() must not care
    component.back();
    expect(component.step()).toBe(0);
  });

  it('allValues merges both steps without touching the DOM', () => {
    const { component } = createWizard();
    component.step0.setValue({ firstName: 'Ada' });
    component.step1.setValue({ email: 'ada@example.com' });

    expect(component.allValues).toEqual({
      firstName: 'Ada',
      email: 'ada@example.com',
    });
  });
});
`,
    },
    {
      path: 'src/app/app.ts',
      content: `import { Component } from '@angular/core';
import { WizardComponent } from './wizard';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [WizardComponent],
  template: \`
    <h3>Testing wizard steps in isolation</h3>
    <p>Open wizard.spec.ts — Tier 1 tests a FormGroup with zero Angular test
    machinery (plain "new FormBuilder()"); Tier 2 drives the real component's
    next()/back() and asserts both the step() signal and the rendered DOM.</p>
    <app-wizard />
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
  <head><title>Testing Wizard Steps in Isolation</title></head>
  <body><app-root></app-root></body>
</html>
`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'Add a Tier 2 test proving that calling <code>next()</code> on the LAST step (step 1) does not advance past the array bounds — <code>component.step()</code> should stay at <code>1</code>, not become <code>2</code>.',
    hint: 'Get the wizard onto step 1 first (patch step0 valid, call next()), then fill step1 with a valid email and call next() again. Assert component.step() is still 1, since the clamp is Math.min(s + 1, 1).',
    solution: `it('does not advance past the last step', () => {
  const { component } = createWizard();

  component.step0.patchValue({ firstName: 'Ada' });
  component.next();
  expect(component.step()).toBe(1);

  component.step1.patchValue({ email: 'ada@example.com' });
  component.next(); // already on the last step — should clamp, not overflow

  expect(component.step()).toBe(1);
});`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'testing a wizard\'s per-step <code>FormGroup</code> validators requires a full <code>TestBed.createComponent</code> fixture.',
      reality: '<code>FormBuilder</code> has no constructor dependencies — <code>new FormBuilder()</code> works in a plain describe block with no TestBed setup at all, making pure validator tests the fastest tier available.',
    },
    {
      thought: 'clicking the Next button in a test (via <code>fixture.nativeElement.querySelector(\'button\').click()</code>) is necessary to test navigation logic.',
      reality: 'the click handler is a thin wrapper with no logic of its own — calling <code>component.next()</code> directly tests the exact same code path with less test brittleness (no dependency on button ordering or selectors).',
    },
    {
      thought: 'if <code>next()</code> is tested to correctly block on an invalid step, <code>back()</code> must also correctly block on an invalid step — the two are symmetric.',
      reality: 'they are deliberately ASYMMETRIC by design — back() must never validate. This needs its own explicit test with a deliberately invalid step, rather than being assumed to mirror next()\'s behavior.',
    },
  ];
}
