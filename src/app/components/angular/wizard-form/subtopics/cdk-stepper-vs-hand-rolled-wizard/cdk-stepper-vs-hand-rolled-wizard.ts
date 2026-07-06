import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../shared/theory-block/theory-block';
import { LivePlaygroundComponent, PlaygroundFile } from '../../../../shared/live-playground/live-playground';
import { TryItComponent, TryItExercise } from '../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-cdk-stepper-vs-hand-rolled-wizard-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent,
    LivePlaygroundComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './cdk-stepper-vs-hand-rolled-wizard.html',
  styleUrl: './cdk-stepper-vs-hand-rolled-wizard.scss',
})
export class CdkStepperVsHandRolledWizardSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main topic mentions this as an alternative — here it is, actually built',
      points: [
        'The main Wizard Form page\'s "Best practices" section name-drops <code>CdkStepper</code> as an option for complex wizards but never shows it. <code>CdkStepper</code> (from <code>@angular/cdk/stepper</code>) is UNSTYLED — it manages step state, linear/non-linear completion rules, and keyboard navigation, but supplies NO markup or CSS at all. You extend it and write your own template, unlike Angular Material\'s <code>MatStepper</code>, which wraps <code>CdkStepper</code> with ready-made visuals.',
        'This makes <code>CdkStepper</code> a genuine middle ground: less manual state-plumbing than the hand-rolled <code>signal(0)</code> + <code>computed()</code> pattern from the main topic, but full control over the UI — unlike pulling in all of Angular Material for one stepper.',
      ],
    },
    {
      heading: 'What you get for free vs the hand-rolled version',
      points: [
        'State tracking: extending <code>CdkStepper</code> gives you <code>selectedIndex</code>, <code>selected</code> (the active <code>CdkStep</code>), and a <code>steps: QueryList&lt;CdkStep&gt;</code> automatically — replacing the hand-rolled <code>step = signal(0)</code> plus the <code>computed()</code> array-lookup for the active form.',
        'Linear validation gating: setting <code>linear</code> on the stepper and binding <code>[stepControl]="step0"</code> on each <code>&lt;cdk-step&gt;</code> makes CDK block advancing past an invalid step AUTOMATICALLY — this replaces the hand-rolled <code>next()</code>\'s manual <code>form.markAllAsTouched(); if (form.invalid) return;</code> guard with a declarative binding instead of imperative code.',
        'Keyboard navigation and ARIA: in non-linear mode, arrow keys move focus between step headers, and CDK wires the appropriate <code>aria-selected</code>/<code>role="tab"</code> attributes — accessibility behavior the hand-rolled <code>@for</code> stepper loop from the main topic does not get without writing it by hand.',
      ],
    },
    {
      heading: 'Building a custom step header with CdkStepper',
      points: [
        'Extend the class and re-provide it so child <code>&lt;cdk-step&gt;</code> elements can find their parent: <code>@Component(&#123; ..., providers: [&#123; provide: CdkStepper, useExisting: CustomStepperComponent &#125;] &#125;) export class CustomStepperComponent extends CdkStepper &#123;&#125;</code>. This "provide self as the base class" pattern lets Angular\'s DI resolve <code>CdkStepper</code> injections from inside each step even though your subclass is what is actually instantiated.',
        'Render step headers by iterating the inherited <code>steps</code> QueryList: <code>@for (step of steps; track step; let i = $index) &#123; &lt;button (click)="selectedIndex = i"&gt;&#123;&#123; step.label &#125;&#125;&lt;/button&gt; &#125;</code> — setting <code>selectedIndex</code> directly is how you programmatically switch the active step.',
        'Render only the active step\'s projected content with <code>&lt;ng-container [ngTemplateOutlet]="selected?.content ?? null"&gt;&lt;/ng-container&gt;</code> — each <code>&lt;cdk-step&gt;</code>\'s body becomes an <code>ng-template</code> internally, and <code>.content</code> is that template reference.',
        'Wire Back/Next buttons with the built-in directives <code>cdkStepperPrevious</code> and <code>cdkStepperNext</code> instead of hand-writing click handlers — they call the inherited <code>previous()</code>/<code>next()</code> methods, which already respect the linear-mode validation gate.',
      ],
    },
    {
      heading: 'When to still prefer the hand-rolled approach',
      points: [
        '<code>CdkStepper</code>\'s linear-completion model assumes each step maps to ONE <code>AbstractControl</code> via <code>stepControl</code>. Conditional step SKIPPING — e.g. "hide the Preferences step entirely when account type is Free" — has no built-in CDK primitive; you\'d filter the <code>&lt;cdk-step&gt;</code> elements with <code>@if</code> yourself, which partially reintroduces the same manual bookkeeping CdkStepper was meant to remove.',
        'For a SIMPLE 3–4 step wizard with straightforward linear validation (exactly what the main topic\'s example is), the hand-rolled <code>@switch</code> + <code>signal(0)</code> pattern is fewer moving parts — no DI provider trick, no <code>QueryList</code>, no <code>ngTemplateOutlet</code>. Reach for <code>CdkStepper</code> when you specifically need its keyboard/ARIA behavior or are already pulling in Angular CDK for other components.',
      ],
    },
  ];

  liveDemoFiles: PlaygroundFile[] = [
    {
      path: 'src/app/custom-stepper.ts',
      content: `import { Component } from '@angular/core';
import { CdkStepper, CdkStepperModule } from '@angular/cdk/stepper';
import { NgTemplateOutlet } from '@angular/common';

@Component({
  selector: 'app-custom-stepper',
  standalone: true,
  imports: [CdkStepperModule, NgTemplateOutlet],
  templateUrl: './custom-stepper.html',
  // "Provide self" lets child <cdk-step> elements inject CdkStepper and
  // find THIS subclass instance, even though CdkStepper itself is abstract.
  providers: [{ provide: CdkStepper, useExisting: CustomStepperComponent }],
})
export class CustomStepperComponent extends CdkStepper {
  onSelect(index: number): void {
    this.selectedIndex = index;
  }
}
`,
    },
    {
      path: 'src/app/custom-stepper.html',
      content: `<section class="stepper">
  <header class="stepper-header">
    @for (step of steps; track step; let i = $index) {
      <button
        type="button"
        [class.active]="selectedIndex === i"
        [class.done]="step.completed"
        (click)="onSelect(i)">
        {{ i + 1 }}. {{ step.label }}
      </button>
    }
  </header>

  <div class="stepper-body">
    <ng-container [ngTemplateOutlet]="selected?.content ?? null"></ng-container>
  </div>

  <footer class="stepper-footer">
    <button type="button" cdkStepperPrevious [disabled]="selectedIndex === 0">&larr; Back</button>
    <button type="button" cdkStepperNext>Next &rarr;</button>
  </footer>
</section>
`,
    },
    {
      path: 'src/app/wizard.ts',
      content: `import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { CdkStepperModule } from '@angular/cdk/stepper';
import { CustomStepperComponent } from './custom-stepper';

@Component({
  selector: 'app-wizard',
  standalone: true,
  imports: [ReactiveFormsModule, CdkStepperModule, CustomStepperComponent],
  template: \`
    <!-- linear=true blocks Next until [stepControl]'s FormGroup is valid —
         no manual markAllAsTouched()/invalid check needed. -->
    <app-custom-stepper linear>
      <cdk-step [stepControl]="step0" label="Personal">
        <form [formGroup]="step0" class="step-form">
          <input formControlName="firstName" placeholder="First name" />
          @if (step0.get('firstName')?.invalid && step0.get('firstName')?.touched) {
            <p class="error">First name is required.</p>
          }
        </form>
      </cdk-step>

      <cdk-step [stepControl]="step1" label="Account">
        <form [formGroup]="step1" class="step-form">
          <input type="email" formControlName="email" placeholder="Email" />
          @if (step1.get('email')?.invalid && step1.get('email')?.touched) {
            <p class="error">A valid email is required.</p>
          }
        </form>
      </cdk-step>

      <cdk-step label="Review">
        <div class="review">
          <p>{{ step0.value.firstName }} — {{ step1.value.email }}</p>
        </div>
      </cdk-step>
    </app-custom-stepper>
  \`,
})
export class WizardComponent {
  private fb = inject(FormBuilder);

  step0 = this.fb.group({
    firstName: ['', Validators.required],
  });

  step1 = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
  });
}
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
    <h3>CdkStepper: linear mode blocks Next until the step is valid</h3>
    <p>Try clicking Next on the Personal step without typing a first name —
    CdkStepper's own linear-mode gate blocks it, with no next()/markAllAsTouched()
    code required in the wizard component itself.</p>
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
  <head><title>CdkStepper vs a Hand-Rolled Wizard</title></head>
  <body><app-root></app-root></body>
</html>
`,
    },
  ];

  dependencies = { '@angular/cdk': 'latest' };

  exercise: TryItExercise = {
    prompt: 'Add a third data-entry <code>&lt;cdk-step&gt;</code> for "Preferences" (a <code>theme</code> select with no validators) between Account and Review, and give it a <code>[stepControl]</code> just like the other two steps.',
    hint: 'Add a step2 = this.fb.group({ theme: [\'light\'] }) FormGroup to WizardComponent — since it has no Validators, [stepControl]="step2" is always valid, so linear mode never blocks leaving it. Insert the new <cdk-step> between the Account and Review steps in the template.',
    solution: `// In WizardComponent:
step2 = this.fb.group({
  theme: ['light'],
});

// In the template, between the Account and Review <cdk-step> elements:
<cdk-step [stepControl]="step2" label="Preferences">
  <form [formGroup]="step2" class="step-form">
    <select formControlName="theme">
      <option value="light">Light</option>
      <option value="dark">Dark</option>
    </select>
  </form>
</cdk-step>`,
  };

  misconceptions: Misconception[] = [
    {
      thought: '<code>CdkStepper</code> comes with its own visual step indicator and styling out of the box, similar to Angular Material\'s stepper.',
      reality: 'CdkStepper is deliberately UNSTYLED — it manages step state, validation gating, and keyboard/ARIA behavior only. You must write your own template (headers, connector lines, CSS) exactly like the hand-rolled version, just with less state-tracking code.',
    },
    {
      thought: 'switching from the hand-rolled wizard to <code>CdkStepper</code> removes the need for per-step <code>FormGroup</code>s.',
      reality: 'CdkStepper\'s linear-mode validation gate is BUILT on per-step FormGroups — you still create one FormGroup per step and bind it via <code>[stepControl]</code>; CdkStepper just reads its <code>.valid</code> state for you instead of you checking it manually in next().',
    },
    {
      thought: '<code>CdkStepper</code> is strictly better than the hand-rolled <code>signal(0)</code> + <code>@switch</code> pattern and should always be preferred for wizards.',
      reality: 'for a simple linear wizard, CdkStepper trades a small amount of manual state code for a DI provider trick, a QueryList, and an ngTemplateOutlet — more moving parts for the same outcome. It pays off most when you specifically need its keyboard/ARIA behavior or non-linear step selection.',
    },
  ];
}
