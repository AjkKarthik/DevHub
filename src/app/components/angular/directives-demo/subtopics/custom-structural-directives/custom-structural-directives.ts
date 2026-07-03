import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../shared/theory-block/theory-block';
import { LivePlaygroundComponent, PlaygroundFile } from '../../../../shared/live-playground/live-playground';
import { TryItComponent, TryItExercise } from '../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-custom-structural-directives-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent,
    LivePlaygroundComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './custom-structural-directives.html',
  styleUrl: './custom-structural-directives.scss',
})
export class CustomStructuralDirectivesSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'TemplateRef and ViewContainerRef — the two ingredients',
      points: [
        'A custom structural directive injects <code>TemplateRef&lt;C&gt;</code> — the TEMPLATE to stamp out — and <code>ViewContainerRef</code> — WHERE to insert the resulting view into the DOM. Together these are the entire mechanism behind every structural directive, built-in or custom.',
        'Call <code>this.vcr.createEmbeddedView(this.tpl, context)</code> to actually render the template into the DOM. Call <code>this.vcr.clear()</code> to remove every view it has created — the same operation <code>*ngIf</code> performs internally when its condition becomes false.',
      ],
    },
    {
      heading: 'Passing context — $implicit and named properties',
      points: [
        'The context object passed to <code>createEmbeddedView</code> can bind values into the template: <code>{ $implicit: value }</code> binds to <code>let-x</code> in <code>&lt;ng-template let-x&gt;</code> — this is exactly how <code>*ngFor="let item of items"</code> makes <code>item</code> available inside the loop.',
        'NAMED context properties work the same way with an explicit name: <code>{ index: i }</code> binds to <code>let-i="index"</code> in the template — this is how <code>*ngFor</code> exposes <code>index</code>, <code>first</code>, <code>last</code>, etc. alongside the implicit item.',
      ],
    },
    {
      heading: 'The *directive microsyntax',
      points: [
        '<code>*appRepeat="3"</code> is SUGAR that Angular desugars to <code>&lt;ng-template [appRepeat]="3"&gt;</code> — the <code>*attr="value"</code> shorthand maps directly onto a regular property binding on an implicit <code>&lt;ng-template&gt;</code> wrapping the element. Understanding this desugaring is what makes custom structural directive inputs make sense: <code>appRepeat</code> as an <code>input()</code> just receives whatever value follows the <code>*appRepeat=</code>.',
      ],
    },
    {
      heading: 'When to actually build one',
      points: [
        'Prefer <code>&#64;if</code>/<code>&#64;for</code> for ordinary conditions and loops — they are simpler, built into the compiler, and need no directive at all. Reach for a CUSTOM structural directive specifically for reusable logic with more complex inputs than a plain boolean/iterable — permission guards (<code>*appHasRole="\'admin\'"</code>), feature flags, or lazy-load wrappers that need to encapsulate genuinely non-trivial decision logic behind a simple template-level API.',
      ],
    },
  ];

  liveDemoFiles: PlaygroundFile[] = [
    {
      path: 'src/app/repeat.directive.ts',
      content: `import { Directive, TemplateRef, ViewContainerRef, inject, input, effect } from '@angular/core';

@Directive({
  selector: '[appRepeat]',
  standalone: true,
})
export class RepeatDirective {
  private tpl = inject(TemplateRef<{ $implicit: number; index: number }>);
  private vcr = inject(ViewContainerRef);

  // *appRepeat="3" desugars to [appRepeat]="3" on an implicit <ng-template>
  appRepeat = input.required<number>();

  constructor() {
    // Signal inputs do NOT trigger ngOnChanges — effect() is the reactive replacement
    effect(() => {
      this.vcr.clear();
      for (let i = 0; i < this.appRepeat(); i++) {
        // $implicit binds to let-n; the named "index" prop binds to let-i="index"
        this.vcr.createEmbeddedView(this.tpl, { $implicit: i + 1, index: i });
      }
    });
  }
}
`,
    },
    {
      path: 'src/app/app.ts',
      content: `import { Component } from '@angular/core';
import { RepeatDirective } from './repeat.directive';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RepeatDirective],
  template: \`
    <ul>
      <li *appRepeat="5; let n; let i = index">
        Item #{{ n }} (index {{ i }})
      </li>
    </ul>
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
  <head><title>Custom structural directives</title></head>
  <body><app-root></app-root></body>
</html>
`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'Change the directive to also expose "isFirst" and "isLast" named context properties, then use them in the template to add a visual marker on the first and last items.',
    hint: 'Add isFirst: i === 0, isLast: i === this.appRepeat() - 1 to the context object passed to createEmbeddedView. In the template: *appRepeat="5; let n; let first = isFirst; let last = isLast" then use @if (first) or [class.first]="first" on the <li>.',
    solution: `this.vcr.createEmbeddedView(this.tpl, {
  $implicit: i + 1,
  index: i,
  isFirst: i === 0,
  isLast: i === this.appRepeat() - 1,
});

// Template:
// <li *appRepeat="5; let n; let first = isFirst; let last = isLast"
//     [class.first]="first" [class.last]="last">
//   Item #{{ n }}
// </li>`,
  };

  misconceptions: Misconception[] = [
    {
      thought: '*directive="value" syntax is special magic reserved for built-in structural directives — custom ones need a different template syntax.',
      reality: 'the *attr="value" microsyntax works identically for custom structural directives — it desugars to the exact same <ng-template [attr]="value"> pattern regardless of whether the directive is built-in or your own.',
    },
    {
      thought: 'a structural directive can bind as many context properties as it wants directly by name in the template, without any special syntax.',
      reality: 'only $implicit binds without a name (via plain let-x); every OTHER context property needs an explicit let-localName="contextPropertyName" binding in the template to be accessible.',
    },
    {
      thought: 'you should build a custom structural directive for most conditional rendering, since it is more "proper" than plain @if.',
      reality: '@if/@for are simpler and require no directive at all for ordinary conditions and loops — custom structural directives earn their complexity specifically for reusable logic with more nuanced inputs (permission checks, feature flags), not as a general replacement for @if.',
    },
  ];
}
