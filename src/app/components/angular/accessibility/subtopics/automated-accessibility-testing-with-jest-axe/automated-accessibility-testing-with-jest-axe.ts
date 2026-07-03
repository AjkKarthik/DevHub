import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../shared/theory-block/theory-block';
import { LivePlaygroundComponent, PlaygroundFile } from '../../../../shared/live-playground/live-playground';
import { TryItComponent, TryItExercise } from '../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-automated-accessibility-testing-with-jest-axe-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent,
    LivePlaygroundComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './automated-accessibility-testing-with-jest-axe.html',
  styleUrl: './automated-accessibility-testing-with-jest-axe.scss',
})
export class AutomatedAccessibilityTestingWithJestAxeSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'One line of theory becomes a real test suite',
      points: [
        'The main topic\'s QnA shows a single line — <code>await expect(axe(fixture.nativeElement)).resolves.toHaveNoViolations()</code> — as the whole story. In practice this needs: rendering the component fully (with realistic data, not an empty state, since violations often only appear once real content is present), running the scan AFTER <code>fixture.detectChanges()</code> has settled, and registering the custom Jest matcher (<code>toHaveNoViolations</code>) via <code>expect.extend(toHaveNoViolations)</code> from <code>jest-axe</code> in a setup file — none of which the one-liner alone communicates.',
        'axe-core (the engine behind jest-axe) checks the RENDERED DOM against a large ruleset — missing form labels, insufficient color contrast (when computable in the test environment), missing alt text, invalid ARIA attribute values, and more. It does NOT understand your application\'s INTENT — it cannot tell you an announcement says the wrong thing, or that keyboard focus order is logically confusing even if every individual element is technically compliant.',
      ],
    },
    {
      heading: 'A concrete violation axe catches, and one it cannot',
      points: [
        'Axe WILL catch: a button with no accessible name (<code>&lt;button&gt;&lt;svg&gt;...&lt;/svg&gt;&lt;/button&gt;</code> with no <code>aria-label</code> and no text content) — this fails the "button-name" rule deterministically, and a jest-axe test on that component fails immediately with a clear violation message naming the exact rule and element.',
        'Axe will NOT catch: a <code>LiveAnnouncer.announce()</code> call with confusing or wrong WORDING (e.g. announcing "Item deleted" when the item was actually just archived) — the DOM is perfectly valid ARIA-wise (the live region exists, is correctly marked up), but the MEANING conveyed to a screen reader user is wrong. This class of bug needs a real screen reader session or a targeted assertion on the announcer\'s call arguments, not an axe scan.',
      ],
    },
    {
      heading: 'Running axe as part of the normal component test suite, not a separate a11y-only suite',
      points: [
        'The main topic\'s "~30% of issues" caveat is a reason to run axe scans WITHIN existing component tests (right after the normal functional assertions), not to treat accessibility testing as a separate, optional, easily-skipped test file — a scan added directly to <code>it(\'renders correctly\', ...)</code> costs almost nothing extra to run and catches regressions the moment they are introduced, at the same point a functional test would already fail for a broken feature.',
        'For components with MULTIPLE meaningful states (loading, error, populated, empty), run a separate axe scan for EACH state — a component might be fully accessible in its default state but introduce a violation only in its error state (e.g. an error message with no <code>role="alert"</code>) that a single "happy path" axe scan would never surface.',
      ],
    },
  ];

  liveDemoFiles: PlaygroundFile[] = [
    {
      path: 'src/app/icon-button.ts',
      content: `import { Component, input } from '@angular/core';

// Intentionally has a BUG for the demo — no accessible name on the button.
@Component({
  selector: 'app-icon-button',
  standalone: true,
  template: \`
    <button (click)="onClick()">
      <svg width="16" height="16" aria-hidden="true"><circle cx="8" cy="8" r="6" /></svg>
    </button>
  \`,
})
export class IconButtonComponent {
  label = input('');
  onClick() { /* ... */ }
}
`,
    },
    {
      path: 'src/app/icon-button.spec.ts',
      content: `import { TestBed } from '@angular/core/testing';
import { axe, toHaveNoViolations } from 'jest-axe';
import { IconButtonComponent } from './icon-button';

expect.extend(toHaveNoViolations);

describe('IconButtonComponent accessibility', () => {
  it('has no axe violations when given an accessible label', async () => {
    const fixture = TestBed.createComponent(IconButtonComponent);
    fixture.componentRef.setInput('label', 'Close');
    fixture.detectChanges();

    // FIX applied in the button template: [attr.aria-label]="label()"
    const results = await axe(fixture.nativeElement);
    expect(results).toHaveNoViolations();
  });

  it('FAILS axe when the button has no accessible name (demonstrates a real catch)', async () => {
    const fixture = TestBed.createComponent(IconButtonComponent);
    // No label input set — the button element has no accessible name at all
    fixture.detectChanges();

    const results = await axe(fixture.nativeElement);
    // This assertion is commented out because it demonstrates a REAL failure —
    // uncomment to see jest-axe report the "button-name" rule violation:
    // expect(results).toHaveNoViolations();
    expect(results.violations.length).toBeGreaterThan(0);
    expect(results.violations[0].id).toBe('button-name');
  });
});
`,
    },
    {
      path: 'src/app/app.ts',
      content: `import { Component } from '@angular/core';
import { IconButtonComponent } from './icon-button';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [IconButtonComponent],
  template: \`
    <h3>Automated accessibility testing with jest-axe</h3>
    <p>Open icon-button.spec.ts — one test shows axe passing with a proper aria-label,
    the other demonstrates a REAL caught violation ("button-name") when the label is
    missing, with the exact rule id asserted.</p>
    <app-icon-button label="Close" />
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
  <head><title>Automated accessibility testing with jest-axe</title></head>
  <body><app-root></app-root></body>
</html>
`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'Fix IconButtonComponent\'s template to bind [attr.aria-label]="label()" on the button, then confirm the "with a proper aria-label" test now genuinely passes axe with zero violations.',
    hint: 'Add [attr.aria-label]="label()" to the <button> element in icon-button.ts\'s template, matching the attr. prefix rule from the main topic.',
    solution: `@Component({
  selector: 'app-icon-button',
  standalone: true,
  template: \`
    <button [attr.aria-label]="label()" (click)="onClick()">
      <svg width="16" height="16" aria-hidden="true"><circle cx="8" cy="8" r="6" /></svg>
    </button>
  \`,
})
export class IconButtonComponent {
  label = input('');
  onClick() {}
}`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'a single axe scan on a component\'s default rendered state is sufficient accessibility test coverage for that component.',
      reality: 'a component can be fully accessible in its default state but introduce a violation only in another state (loading, error, empty) — each meaningful state deserves its own scan.',
    },
    {
      thought: 'if jest-axe reports zero violations, the component is fully accessible.',
      reality: 'axe-core checks the DOM against a technical ruleset — it cannot catch wrong announcement wording, confusing focus order, or other INTENT-level problems that require a real screen reader session or targeted assertions.',
    },
    {
      thought: 'accessibility testing should live in a separate, dedicated a11y test suite from regular component tests.',
      reality: 'adding an axe scan directly inside existing functional tests costs almost nothing extra and catches regressions the moment they are introduced, rather than in a suite that is easy to skip or forget to run.',
    },
  ];
}
