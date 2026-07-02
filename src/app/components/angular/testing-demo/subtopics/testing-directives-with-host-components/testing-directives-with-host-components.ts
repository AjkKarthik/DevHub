import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../shared/theory-block/theory-block';
import { LivePlaygroundComponent, PlaygroundFile } from '../../../../shared/live-playground/live-playground';
import { TryItComponent, TryItExercise } from '../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-testing-directives-with-host-components-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent,
    LivePlaygroundComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './testing-directives-with-host-components.html',
  styleUrl: './testing-directives-with-host-components.scss',
})
export class TestingDirectivesWithHostComponentsSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'Why a directive can\'t be tested by creating it directly',
      points: [
        'A directive has NO template of its own — <code>TestBed.createComponent(MyDirective)</code> does not even compile, because directives are not renderable on their own. The standard technique is a small TEST-ONLY HOST COMPONENT with an inline template that applies the directive to a real element, then you test through THAT host.',
        'The host component\'s template is written specifically for the test — <code>@Component({ template: \'&lt;div appHighlight [color]="color"&gt;Text&lt;/div&gt;\', imports: [HighlightDirective] })</code> — giving you full control over the exact markup and bindings under test.',
      ],
    },
    {
      heading: 'Querying the directive instance and the host element',
      points: [
        'Get the DIRECTIVE instance itself (not just the DOM element it\'s attached to) via <code>fixture.debugElement.query(By.directive(HighlightDirective)).injector.get(HighlightDirective)</code> — this lets you inspect the directive\'s internal state directly, not just its rendered side-effects.',
        'For a directive that manipulates styles/classes on its host element, query the host element and assert on its <code>nativeElement.style</code> or <code>classList</code>: <code>const el = fixture.debugElement.query(By.directive(HighlightDirective)).nativeElement; expect(el.style.backgroundColor).toBe(\'yellow\')</code> — this verifies the directive\'s actual DOM EFFECT, which is usually what matters most.',
      ],
    },
    {
      heading: 'Testing structural directives with a host template',
      points: [
        'A structural directive (like a custom <code>*appUnless</code>) is tested the SAME way — a host template using <code>*appUnless="condition"</code> around some content, then asserting the content IS or IS NOT present in the DOM after <code>fixture.detectChanges()</code>, by changing the host component\'s bound condition and re-running <code>detectChanges()</code>.',
        'Because structural directives create/destroy EMBEDDED VIEWS, a robust test toggles the condition through multiple states (true → false → true) and re-queries the DOM each time — a single-state test can miss a bug where the directive fails to properly clean up or re-create the view on toggle.',
      ],
    },
  ];

  liveDemoFiles: PlaygroundFile[] = [
    {
      path: 'src/app/highlight.directive.ts',
      content: `import { Directive, ElementRef, Input, inject } from '@angular/core';

@Directive({
  selector: '[appHighlight]',
  standalone: true,
})
export class HighlightDirective {
  private el = inject(ElementRef<HTMLElement>);

  @Input() set appHighlight(color: string) {
    this.el.nativeElement.style.backgroundColor = color || 'transparent';
  }
}
`,
    },
    {
      path: 'src/app/highlight.directive.spec.ts',
      content: `import { TestBed } from '@angular/core/testing';
import { Component } from '@angular/core';
import { By } from '@angular/platform-browser';
import { HighlightDirective } from './highlight.directive';

// Test-only host component — gives full control over the markup under test
@Component({
  standalone: true,
  imports: [HighlightDirective],
  template: \`<div [appHighlight]="color">Highlighted text</div>\`,
})
class TestHostComponent {
  color = 'yellow';
}

describe('HighlightDirective', () => {
  it('applies the bound color as the background', () => {
    const fixture = TestBed.createComponent(TestHostComponent);
    fixture.detectChanges();

    const el: HTMLElement = fixture.debugElement.query(By.directive(HighlightDirective)).nativeElement;
    expect(el.style.backgroundColor).toBe('yellow');
  });

  it('updates the background when the bound color changes', () => {
    const fixture = TestBed.createComponent(TestHostComponent);
    fixture.detectChanges();

    fixture.componentInstance.color = 'red';
    fixture.detectChanges();

    const el: HTMLElement = fixture.debugElement.query(By.directive(HighlightDirective)).nativeElement;
    expect(el.style.backgroundColor).toBe('red');
  });

  it('exposes the directive instance itself for internal state inspection', () => {
    const fixture = TestBed.createComponent(TestHostComponent);
    fixture.detectChanges();

    const directiveInstance = fixture.debugElement
      .query(By.directive(HighlightDirective))
      .injector.get(HighlightDirective);

    expect(directiveInstance).toBeTruthy();
  });
});
`,
    },
    {
      path: 'src/app/app.ts',
      content: `import { Component, signal } from '@angular/core';
import { HighlightDirective } from './highlight.directive';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [HighlightDirective],
  template: \`
    <h3>The directive under test — see highlight.directive.spec.ts for the actual tests</h3>
    <div [appHighlight]="color()">Highlighted text</div>
    <button (click)="color.set('red')">Red</button>
    <button (click)="color.set('yellow')">Yellow</button>
  \`,
})
export class App {
  color = signal('yellow');
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
  <head><title>Testing directives with host components</title></head>
  <body><app-root></app-root></body>
</html>
`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'Add a fourth test that toggles the color through three states (yellow -> red -> yellow) in one test, asserting the background updates correctly each time.',
    hint: 'Set fixture.componentInstance.color, call fixture.detectChanges(), and query+assert after each of the three assignments within a single it() block.',
    solution: `it('correctly updates across multiple color changes', () => {
  const fixture = TestBed.createComponent(TestHostComponent);
  fixture.detectChanges();
  const getEl = () => fixture.debugElement.query(By.directive(HighlightDirective)).nativeElement;

  expect(getEl().style.backgroundColor).toBe('yellow');

  fixture.componentInstance.color = 'red';
  fixture.detectChanges();
  expect(getEl().style.backgroundColor).toBe('red');

  fixture.componentInstance.color = 'yellow';
  fixture.detectChanges();
  expect(getEl().style.backgroundColor).toBe('yellow');
});`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'a directive can be tested by calling TestBed.createComponent(MyDirective) directly, just like a component.',
      reality: 'a directive has no template of its own and cannot be created directly this way — the standard technique is a small test-only host component whose template applies the directive to a real element.',
    },
    {
      thought: 'testing a directive means only checking that fixture.debugElement.query finds it in the DOM.',
      reality: 'the more meaningful assertion is on the directive\'s actual DOM EFFECT (e.g. the host element\'s style or classList) — merely finding the directive proves it was applied, not that it behaves correctly.',
    },
    {
      thought: 'a single test asserting a structural directive shows/hides content once is sufficient coverage.',
      reality: 'toggling the condition through multiple states (true → false → true) in one test catches bugs where the directive fails to properly clean up or recreate its embedded view on repeated toggles — a single-state test can miss this entirely.',
    },
  ];
}
