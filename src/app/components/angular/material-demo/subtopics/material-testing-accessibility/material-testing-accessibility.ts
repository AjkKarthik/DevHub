import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../shared/theory-block/theory-block';
import { LivePlaygroundComponent, PlaygroundFile } from '../../../../shared/live-playground/live-playground';
import { TryItComponent, TryItExercise } from '../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-material-testing-accessibility-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent,
    LivePlaygroundComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './material-testing-accessibility.html',
  styleUrl: './material-testing-accessibility.scss',
})
export class MaterialTestingAccessibilitySubtopic {

  materialDeps = { '@angular/material': 'latest', '@angular/cdk': 'latest' };

  theory: TheoryPoint[] = [
    {
      heading: 'Testing — animations make tests non-deterministic',
      points: [
        'Use <code>provideNoopAnimations()</code> (or the older <code>NoopAnimationsModule</code>) in test beds. Real Material animations run asynchronously over time, which makes component tests FLAKY and non-deterministic — the no-op variant replaces every animation with an instant, synchronous no-op, so assertions about DOM state right after a state change are reliable.',
      ],
    },
    {
      heading: 'Accessibility — a lot is automatic, but not everything',
      points: [
        'All Material components follow WCAG 2.1 AA out of the box. <code>mat-form-field</code> auto-wires ARIA labels for its inner input; <code>MatDialog</code> traps focus inside the modal and manages <code>aria-modal</code>; buttons and inputs get correct ARIA roles automatically.',
        'The one thing that is NEVER automatic: icon-only buttons (<code>mat-icon-button</code>, <code>mat-fab</code> with just an icon) have no visible text for a screen reader to announce. ALWAYS add an explicit <code>aria-label</code> to these — Material cannot infer meaningful label text from an icon name alone.',
      ],
    },
    {
      heading: 'Tree-shaking — always import individual modules',
      points: [
        'Import individual modules per component (<code>MatButtonModule</code>, <code>MatCardModule</code>) — NEVER a barrel <code>MaterialModule</code> that re-exports everything. Angular\'s build system drops unused component code when entry points are granular; a barrel import defeats that entirely and can pull the whole library into your bundle regardless of what you actually use.',
      ],
    },
    {
      heading: 'Two practical performance notes',
      points: [
        'Avoid combining Material with a global CSS reset library (like Bootstrap\'s <code>normalize.css</code>) — the two conflict on baseline element styles. Material applies its own baseline via <code>mat.core()</code>, and layering another reset on top produces inconsistent, hard-to-debug visual bugs.',
        'For large tables, prefer SERVER-side pagination over client-side (covered in the previous subtopic\'s custom <code>DataSource</code> pattern). <code>MatTableDataSource.filterPredicate</code> can be overridden for custom filter logic without needing to re-fetch from the server on every keystroke.',
      ],
    },
  ];

  liveDemoFiles: PlaygroundFile[] = [
    {
      path: 'src/app/app.ts',
      content: `import { Component } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [MatButtonModule, MatIconModule],
  template: \`
    <h3>Correct — icon-only buttons WITH aria-label</h3>
    <button mat-icon-button aria-label="Add to favorites">
      <mat-icon>favorite</mat-icon>
    </button>
    <button mat-icon-button aria-label="Delete item">
      <mat-icon>delete</mat-icon>
    </button>

    <h3>Broken — icon-only button with NO aria-label (screen readers announce nothing useful)</h3>
    <button mat-icon-button>
      <mat-icon>share</mat-icon>
    </button>
  \`,
})
export class App {}
`,
    },
    {
      path: 'src/main.ts',
      content: `import { bootstrapApplication } from '@angular/platform-browser';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { App } from './app/app';

bootstrapApplication(App, { providers: [provideAnimationsAsync()] });
`,
    },
    {
      path: 'src/index.html',
      content: `<!doctype html>
<html>
  <head>
    <title>Material testing and accessibility</title>
    <link rel="stylesheet" href="https://fonts.googleapis.com/icon?family=Material+Icons">
  </head>
  <body><app-root></app-root></body>
</html>
`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'Fix the broken "share" button by adding aria-label="Share this item" to it, matching the pattern used by the two correct buttons above it.',
    hint: 'Just add the missing attribute: <button mat-icon-button aria-label="Share this item"> <mat-icon>share</mat-icon> </button> — the same pattern as the favorite/delete buttons.',
    solution: `<button mat-icon-button aria-label="Share this item">
  <mat-icon>share</mat-icon>
</button>`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'Material\'s built-in animations do not affect the reliability of component tests, only their visual appearance.',
      reality: 'real animations run asynchronously over time, which makes assertions about DOM state right after a change genuinely FLAKY — provideNoopAnimations() in the test bed replaces them with instant synchronous no-ops specifically to fix this.',
    },
    {
      thought: 'since Material components are WCAG 2.1 AA by default, icon-only buttons are accessible automatically too, same as text buttons.',
      reality: 'icon-only buttons are the ONE case that is never automatic — there is no visible text for Material to infer a label from, so you must always add an explicit aria-label yourself for a screen reader to announce anything meaningful.',
    },
    {
      thought: 'importing a single barrel MaterialModule that re-exports everything is fine for tree-shaking, as long as you only actually use a few components.',
      reality: 'a barrel import can defeat tree-shaking entirely, pulling in far more of the library than what is actually used — always import the specific individual module (MatButtonModule, MatCardModule, etc.) each component needs.',
    },
  ];
}
