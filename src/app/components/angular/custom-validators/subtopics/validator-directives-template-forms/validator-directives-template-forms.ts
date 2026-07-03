import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../shared/theory-block/theory-block';
import { LivePlaygroundComponent, PlaygroundFile } from '../../../../shared/live-playground/live-playground';
import { TryItComponent, TryItExercise } from '../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-validator-directives-template-forms-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent,
    LivePlaygroundComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './validator-directives-template-forms.html',
  styleUrl: './validator-directives-template-forms.scss',
})
export class ValidatorDirectivesTemplateFormsSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'A plain function validator does not work with ngModel',
      points: [
        'Everything on the main Custom Validators page — plain <code>ValidatorFn</code> functions passed as array entries — is a REACTIVE FORMS pattern. Template-driven forms (<code>[(ngModel)]</code>) have NO array argument to pass a function into; they discover validators through a completely different mechanism: DIRECTIVES registered on the DOM element itself.',
        'A custom validator for template-driven forms must be a DIRECTIVE that implements the <code>Validator</code> interface (a <code>validate(control: AbstractControl): ValidationErrors | null</code> method) and registers itself via the <code>NG_VALIDATORS</code> multi-provider token.',
      ],
    },
    {
      heading: 'The NG_VALIDATORS multi-provider pattern',
      points: [
        '<code>providers: [{ provide: NG_VALIDATORS, useExisting: forwardRef(() =&gt; MyValidatorDirective), multi: true }]</code> on the directive\'s <code>@Directive()</code> decorator registers it into Angular\'s internal validator collection for whatever element it is applied to.',
        '<code>multi: true</code> is essential — it lets MULTIPLE validator directives coexist on the same element (e.g. <code>required</code> built-in plus your custom one), each contributing to the combined <code>NG_VALIDATORS</code> array rather than one overwriting another.',
        '<code>forwardRef(() =&gt; MyValidatorDirective)</code> is needed because the class is referenced INSIDE its own decorator, before the class declaration has finished being processed — a forward reference resolves this circular-definition-order problem.',
        'Apply the directive by its SELECTOR directly on the input, alongside <code>ngModel</code>: <code>&lt;input ngModel name="age" appMinAge="18" /&gt;</code> — Angular automatically discovers it via the <code>NG_VALIDATORS</code> token and runs it as part of that control\'s validation.',
      ],
    },
    {
      heading: 'Parameterizing a validator directive with an @Input',
      points: [
        'The directive\'s selector doubles as an <code>@Input()</code> name for configuration: <code>@Input(\'appMinAge\') minAge = 0;</code> lets the template pass a value directly through the attribute: <code>appMinAge="18"</code> — mirroring how <code>minlength</code>/<code>maxlength</code> built-in directives take their threshold.',
        'Angular re-runs <code>validate()</code> automatically whenever the bound <code>@Input()</code> changes — implement <code>OnChanges</code> if the directive needs to re-trigger validation explicitly when its configuration input changes (rare, but relevant for dynamically-configured forms).',
      ],
    },
  ];

  liveDemoFiles: PlaygroundFile[] = [
    {
      path: 'src/app/min-age.directive.ts',
      content: `import { Directive, Input, forwardRef } from '@angular/core';
import { NG_VALIDATORS, Validator, AbstractControl, ValidationErrors } from '@angular/forms';

@Directive({
  selector: '[appMinAge]',
  standalone: true,
  providers: [{
    provide: NG_VALIDATORS,
    useExisting: forwardRef(() => MinAgeDirective),
    multi: true,
  }],
})
export class MinAgeDirective implements Validator {
  @Input('appMinAge') minAge = 0;

  validate(control: AbstractControl): ValidationErrors | null {
    const value = Number(control.value);
    if (!control.value || value >= this.minAge) return null;
    return { minAge: { required: this.minAge, actual: value } };
  }
}
`,
    },
    {
      path: 'src/app/app.ts',
      content: `import { Component } from '@angular/core';
import { FormsModule, NgModel } from '@angular/forms';
import { MinAgeDirective } from './min-age.directive';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [FormsModule, MinAgeDirective],
  template: \`
    <h3>Template-driven form with a custom validator DIRECTIVE</h3>
    <input
      name="age"
      [(ngModel)]="age"
      #ageModel="ngModel"
      appMinAge="18"
      type="number" />

    @if (ageModel.errors?.['minAge']; as err) {
      <p style="color: red;">
        Must be at least {{ err.required }} (you entered {{ err.actual }})
      </p>
    }
    <p>Valid: {{ ageModel.valid }}</p>
  \`,
})
export class App {
  age = 15;
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
  <head><title>Validator directives for template forms</title></head>
  <body><app-root></app-root></body>
</html>
`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'Change appMinAge="18" to appMinAge="21" in the template, and verify the error message and threshold update accordingly.',
    hint: 'Just change the attribute value on the input element — the directive\'s @Input(\'appMinAge\') automatically picks up the new value and validate() uses this.minAge in its check.',
    solution: `<input
  name="age"
  [(ngModel)]="age"
  #ageModel="ngModel"
  appMinAge="21"
  type="number" />`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'the same plain ValidatorFn functions used with reactive forms (fb.control array syntax) also work directly with ngModel.',
      reality: 'template-driven forms have no array argument to pass a function into — a custom validator for ngModel must be a DIRECTIVE implementing Validator and registered via the NG_VALIDATORS multi-provider token, a genuinely different mechanism.',
    },
    {
      thought: 'multi: true on the NG_VALIDATORS provider is optional boilerplate.',
      reality: 'without it, registering a second validator directive on the same element would overwrite rather than combine with existing NG_VALIDATORS entries — multi: true is what allows several validator directives to coexist on one element.',
    },
    {
      thought: 'forwardRef() in the provider is unnecessary ceremony that could be simplified away.',
      reality: 'it specifically resolves the circular reference of a class referring to itself inside its own decorator, before the class declaration has finished being processed — removing it causes a "used before its declaration" error.',
    },
  ];
}
