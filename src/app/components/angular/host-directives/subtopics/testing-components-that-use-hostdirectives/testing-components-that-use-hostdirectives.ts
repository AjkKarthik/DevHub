import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../shared/theory-block/theory-block';
import { LivePlaygroundComponent, PlaygroundFile } from '../../../../shared/live-playground/live-playground';
import { TryItComponent, TryItExercise } from '../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-testing-components-that-use-hostdirectives-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent,
    LivePlaygroundComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './testing-components-that-use-hostdirectives.html',
  styleUrl: './testing-components-that-use-hostdirectives.scss',
})
export class TestingComponentsThatUseHostdirectivesSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'Testing an exposed input/output — through the component\'s public alias',
      points: [
        'When a component exposes a host directive input via <code>inputs: [\'cdkDragDisabled: disabled\']</code>, tests should set the PUBLIC alias (<code>disabled</code>) via <code>fixture.componentRef.setInput(\'disabled\', true)</code> — exactly as a real consumer would — not reach into the host directive instance directly to set <code>cdkDragDisabled</code>. Testing through the public alias verifies the WIRING is correct, which is exactly the thing most likely to break during a refactor (a typo in the alias string, a forgotten <code>inputs: []</code> entry).',
        'To confirm the value actually reached the underlying directive, inject the host directive instance in the test via <code>fixture.debugElement.injector.get(CdkDrag)</code> (the SAME injector the component itself uses) and read its property directly — this closes the loop: public alias set → underlying directive\'s actual state updated.',
      ],
    },
    {
      heading: 'Asserting the host directive\'s host bindings actually rendered',
      points: [
        'A host directive\'s host bindings (like <code>[class.resizable]</code> or an <code>[attr.aria-busy]</code>) render onto the SAME native element as the component\'s own host bindings — from the DOM\'s perspective, there is no distinction between "the component\'s own class binding" and "a stacked host directive\'s class binding." Assert on <code>fixture.nativeElement.classList.contains(\'resizable\')</code> or <code>fixture.nativeElement.getAttribute(\'aria-busy\')</code> exactly as you would for any other rendered attribute — no special host-directive-aware test API is needed.',
        'This is a useful sanity check specifically for the "did I forget to add the directive to hostDirectives array" class of mistake — the component would still compile and even instantiate fine if the array entry is accidentally removed, but the expected class/attribute would silently disappear from the DOM, exactly the kind of regression a rendered-output assertion catches immediately.',
      ],
    },
    {
      heading: 'Testing multiple stacked host directives without interference',
      points: [
        'When a component stacks several host directives (<code>hostDirectives: [FocusRingDirective, TooltipDirective, LoadingStateDirective]</code>), inject EACH instance separately in the test via <code>fixture.debugElement.injector.get(...)</code> and assert on each independently — this verifies that exercising one directive\'s behavior (e.g. focusing the element to trigger <code>FocusRingDirective</code>) does not have unintended side effects on the others\' state.',
        'A particularly useful regression test for a stacked-directives component: assert that TOGGLING one exposed input (e.g. <code>loading</code>) does not accidentally affect an UNRELATED directive\'s rendered output (e.g. the focus ring class) — this catches accidental coupling introduced by directives sharing host bindings on overlapping DOM properties.',
      ],
    },
  ];

  liveDemoFiles: PlaygroundFile[] = [
    {
      path: 'src/app/loading-state.directive.ts',
      content: `import { Directive, input } from '@angular/core';

@Directive({
  selector: '[appLoadingState]',
  standalone: true,
  host: {
    '[attr.aria-busy]': 'loading()',
    '[class.loading]': 'loading()',
  },
})
export class LoadingStateDirective {
  loading = input(false);
}
`,
    },
    {
      path: 'src/app/action-card.ts',
      content: `import { Component } from '@angular/core';
import { LoadingStateDirective } from './loading-state.directive';

@Component({
  selector: 'app-action-card',
  standalone: true,
  template: \`<ng-content />\`,
  hostDirectives: [
    {
      directive: LoadingStateDirective,
      inputs: ['loading'], // publicly exposed as "loading" — same name, no alias
    },
  ],
})
export class ActionCardComponent {}
`,
    },
    {
      path: 'src/app/action-card.spec.ts',
      content: `import { TestBed } from '@angular/core/testing';
import { ActionCardComponent } from './action-card';
import { LoadingStateDirective } from './loading-state.directive';

describe('ActionCardComponent host directive', () => {
  it('applies aria-busy and the loading class when loading is set', () => {
    const fixture = TestBed.createComponent(ActionCardComponent);
    fixture.componentRef.setInput('loading', true); // through the public alias
    fixture.detectChanges();

    expect(fixture.nativeElement.getAttribute('aria-busy')).toBe('true');
    expect(fixture.nativeElement.classList.contains('loading')).toBe(true);
  });

  it('removes aria-busy when loading is false', () => {
    const fixture = TestBed.createComponent(ActionCardComponent);
    fixture.componentRef.setInput('loading', false);
    fixture.detectChanges();

    expect(fixture.nativeElement.getAttribute('aria-busy')).toBe('false');
    expect(fixture.nativeElement.classList.contains('loading')).toBe(false);
  });

  it('reaches the underlying LoadingStateDirective instance', () => {
    const fixture = TestBed.createComponent(ActionCardComponent);
    fixture.componentRef.setInput('loading', true);
    fixture.detectChanges();

    // Same injector the component itself uses to inject the host directive
    const loadingDir = fixture.debugElement.injector.get(LoadingStateDirective);
    expect(loadingDir.loading()).toBe(true);
  });
});
`,
    },
    {
      path: 'src/app/app.ts',
      content: `import { Component } from '@angular/core';
import { ActionCardComponent } from './action-card';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [ActionCardComponent],
  template: \`
    <h3>Testing components that use hostDirectives</h3>
    <p>Open action-card.spec.ts — tests set the exposed "loading" alias, assert the
    rendered aria-busy/class on the host element, and inject the directive instance
    directly to confirm the value reached it.</p>
    <app-action-card>Click me</app-action-card>
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
  <head><title>Testing components that use hostDirectives</title></head>
  <body><app-root></app-root></body>
</html>
`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'Stack a second host directive (a simple FocusRingDirective) onto ActionCardComponent, and add a test proving toggling "loading" does not affect the focus ring state.',
    hint: 'Add FocusRingDirective to hostDirectives, inject both directive instances in a test, toggle loading via setInput, and assert the focus ring directive\'s own state is unaffected.',
    solution: `// focus-ring.directive.ts
@Directive({ selector: '[appFocusRing]', standalone: true,
  host: { '(focus)': 'hasFocus.set(true)', '(blur)': 'hasFocus.set(false)',
          '[class.ring]': 'hasFocus()' } })
export class FocusRingDirective {
  hasFocus = signal(false);
}

// action-card.ts
hostDirectives: [
  { directive: LoadingStateDirective, inputs: ['loading'] },
  FocusRingDirective,
],

// action-card.spec.ts
it('toggling loading does not affect the focus ring', () => {
  const fixture = TestBed.createComponent(ActionCardComponent);
  const focusRing = fixture.debugElement.injector.get(FocusRingDirective);

  fixture.componentRef.setInput('loading', true);
  fixture.detectChanges();

  expect(focusRing.hasFocus()).toBe(false); // unaffected by the unrelated directive
});`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'testing a host directive\'s exposed input means setting the directive\'s original property name directly on the injected instance.',
      reality: 'tests should go through the component\'s PUBLIC alias via fixture.componentRef.setInput() — exactly as a real consumer would — since that verifies the exposure wiring itself, which is what actually breaks during refactors.',
    },
    {
      thought: 'asserting a host directive\'s rendered class/attribute requires a special host-directive-aware test API.',
      reality: 'a host directive\'s bindings render onto the same native element as the component\'s own bindings — a plain fixture.nativeElement.classList/getAttribute check works identically, no special API needed.',
    },
    {
      thought: 'if a component stacks multiple host directives, testing one of them in isolation is sufficient coverage.',
      reality: 'stacked directives can accidentally interfere through shared DOM bindings — a regression test that toggles one directive\'s input and asserts an UNRELATED directive\'s state is unaffected catches this class of coupling bug.',
    },
  ];
}
