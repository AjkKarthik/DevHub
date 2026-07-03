import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../shared/theory-block/theory-block';
import { LivePlaygroundComponent, PlaygroundFile } from '../../../../shared/live-playground/live-playground';
import { TryItComponent, TryItExercise } from '../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-directive-composition-api-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent,
    LivePlaygroundComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './directive-composition-api.html',
  styleUrl: './directive-composition-api.scss',
})
export class DirectiveCompositionApiSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'hostDirectives — apply directives without the consumer adding them',
      points: [
        '<code>hostDirectives</code> in a <code>&#64;Directive</code> or <code>&#64;Component</code> decorator applies one or more OTHER directives to the host automatically — the CONSUMER never has to add them in their own template. A <code>ButtonComponent</code> can bundle a ripple effect, a tooltip, and disabled-state handling in ONE declaration, invisible to whoever just writes <code>&lt;app-button&gt;</code>.',
      ],
    },
    {
      heading: 'Encapsulation — composed behavior is invisible unless re-exposed',
      points: [
        'By default, consumers see ONLY the composed directive\'s own public API — the individual directives bundled via <code>hostDirectives</code> and their inputs/outputs are NOT automatically visible on the host component. This is a deliberate encapsulation boundary, not an oversight.',
      ],
    },
    {
      heading: 'Re-exposing specific inputs/outputs',
      points: [
        '<code>{ directive: TooltipDirective, inputs: [\'appTooltip\'] }</code> in the <code>hostDirectives</code> array selectively re-exposes JUST that input — the consumer can then bind <code>[appTooltip]="text"</code> directly on the composed component\'s own selector, as if it were declared there natively. Outputs work the same way via an <code>outputs: [...]</code> entry.',
      ],
    },
    {
      heading: 'A cleaner alternative to mixins and wrapper components',
      points: [
        'This pattern replaces both mixin-style base classes AND wrapper components that manually forward inputs/outputs to an inner directive — <code>hostDirectives</code> does the composition declaratively, in the decorator, with no boilerplate forwarding code.',
        'COMPOSED directives can themselves have their own <code>hostDirectives</code>, enabling MULTI-LEVEL composition trees — a genuinely useful pattern for design-system primitives that accumulate behavior across several layers (a base interactive-element directive, composed into a button directive, composed into a full button component).',
      ],
    },
  ];

  liveDemoFiles: PlaygroundFile[] = [
    {
      path: 'src/app/tooltip.directive.ts',
      content: `import { Directive, ElementRef, Renderer2, inject, input } from '@angular/core';

@Directive({ selector: '[appTooltip]', standalone: true })
export class TooltipDirective {
  private el = inject(ElementRef);
  private renderer = inject(Renderer2);

  appTooltip = input.required<string>();

  constructor() {
    this.el.nativeElement.addEventListener('mouseenter', () => {
      this.renderer.setAttribute(this.el.nativeElement, 'title', this.appTooltip());
    });
  }
}
`,
    },
    {
      path: 'src/app/ripple.directive.ts',
      content: `import { Directive, ElementRef, Renderer2, inject } from '@angular/core';

@Directive({ selector: '[appRipple]', standalone: true })
export class RippleDirective {
  private el = inject(ElementRef);
  private renderer = inject(Renderer2);

  constructor() {
    this.renderer.setStyle(this.el.nativeElement, 'transition', 'opacity 0.2s');
    this.el.nativeElement.addEventListener('mousedown', () => {
      this.renderer.setStyle(this.el.nativeElement, 'opacity', '0.6');
    });
    this.el.nativeElement.addEventListener('mouseup', () => {
      this.renderer.setStyle(this.el.nativeElement, 'opacity', '1');
    });
  }
}
`,
    },
    {
      path: 'src/app/fancy-button.ts',
      content: `import { Component } from '@angular/core';
import { TooltipDirective } from './tooltip.directive';
import { RippleDirective } from './ripple.directive';

@Component({
  selector: 'app-fancy-button',
  standalone: true,
  // Consumers of <app-fancy-button> get BOTH ripple and tooltip automatically —
  // they never write [appRipple] or [appTooltip] themselves.
  hostDirectives: [
    RippleDirective,
    { directive: TooltipDirective, inputs: ['appTooltip: tooltip'] }, // re-exposed as "tooltip"
  ],
  template: \`<button><ng-content /></button>\`,
  styles: [\`button { padding: .6rem 1.2rem; border-radius: 6px; }\`],
})
export class FancyButton {}
`,
    },
    {
      path: 'src/app/app.ts',
      content: `import { Component } from '@angular/core';
import { FancyButton } from './fancy-button';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [FancyButton],
  template: \`
    <!-- Ripple is completely invisible here — bundled automatically.
         "tooltip" is the RE-EXPOSED input name, bound directly on app-fancy-button. -->
    <app-fancy-button tooltip="Click to save">Save</app-fancy-button>
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
  <head><title>Directive Composition API</title></head>
  <body><app-root></app-root></body>
</html>
`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'Add a third directive, FocusOutlineDirective, that adds a visible focus outline style on the host\'s focus event, and bundle it into FancyButton\'s hostDirectives array alongside the existing two.',
    hint: 'Create focus-outline.directive.ts with the same ElementRef+Renderer2+addEventListener(\'focus\'/\'blur\') pattern as RippleDirective, then add FocusOutlineDirective to the hostDirectives array in fancy-button.ts: hostDirectives: [RippleDirective, FocusOutlineDirective, { directive: TooltipDirective, inputs: [...] }].',
    solution: `// focus-outline.directive.ts
@Directive({ selector: '[appFocusOutline]', standalone: true })
export class FocusOutlineDirective {
  private el = inject(ElementRef);
  private renderer = inject(Renderer2);

  constructor() {
    this.el.nativeElement.addEventListener('focus', () =>
      this.renderer.setStyle(this.el.nativeElement, 'outline', '2px solid #4f46e5'));
    this.el.nativeElement.addEventListener('blur', () =>
      this.renderer.removeStyle(this.el.nativeElement, 'outline'));
  }
}

// fancy-button.ts
hostDirectives: [
  RippleDirective,
  FocusOutlineDirective,
  { directive: TooltipDirective, inputs: ['appTooltip: tooltip'] },
],`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'hostDirectives automatically expose every input and output of the bundled directives on the composed component.',
      reality: 'nothing is exposed by default — only inputs/outputs explicitly listed in the inputs/outputs arrays of a hostDirectives entry become accessible on the composed component\'s own selector. This is a deliberate encapsulation boundary.',
    },
    {
      thought: 'the Directive Composition API is just a marginally cleaner syntax for what a wrapper component with manually forwarded @Input()/@Output() already achieves.',
      reality: 'hostDirectives eliminates an entire category of boilerplate — no forwarding code, no wrapper component layer at all. It genuinely removes the manual plumbing, not just makes it look nicer.',
    },
    {
      thought: 'a component using hostDirectives cannot itself be composed further into another component\'s hostDirectives.',
      reality: 'composed directives/components can themselves have their own hostDirectives, enabling multi-level composition trees — a real, supported pattern for building up layered design-system primitives.',
    },
  ];
}
