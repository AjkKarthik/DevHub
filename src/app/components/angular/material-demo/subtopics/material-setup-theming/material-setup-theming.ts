import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../shared/theory-block/theory-block';
import { LivePlaygroundComponent, PlaygroundFile } from '../../../../shared/live-playground/live-playground';
import { TryItComponent, TryItExercise } from '../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-material-setup-theming-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent,
    LivePlaygroundComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './material-setup-theming.html',
  styleUrl: './material-setup-theming.scss',
})
export class MaterialSetupThemingSubtopic {

  materialDeps = { '@angular/material': 'latest', '@angular/cdk': 'latest' };

  theory: TheoryPoint[] = [
    {
      heading: 'One-command setup',
      points: [
        '<code>ng add &#64;angular/material</code> installs the package, adds a pre-built theme to <code>styles.scss</code>, and wires <code>provideAnimationsAsync()</code> into <code>app.config.ts</code> — one command handles the entire baseline setup.',
        '<code>provideAnimationsAsync()</code> is REQUIRED in <code>app.config.ts</code>\'s providers. Skip it and dialogs, snackbars, and expansion panels open with no animation and can throw <code>ExpressionChangedAfterChecked</code> errors.',
      ],
    },
    {
      heading: 'Standalone-compatible, no NgModule required',
      points: [
        'Every Material component is standalone-compatible — import individual modules (<code>MatButtonModule</code>, <code>MatCardModule</code>, etc.) directly in each component\'s OWN <code>imports</code> array, exactly like any other standalone dependency. No wrapping <code>NgModule</code> anywhere.',
      ],
    },
    {
      heading: 'Built on the CDK',
      points: [
        'Angular Material is built on top of the CDK (<code>&#64;angular/cdk</code>) — installing Material also installs the CDK as a dependency. You can use CDK primitives (overlay, a11y, drag-drop) INDEPENDENTLY of Material\'s visual layer, for custom-styled behavior that does not look "Material" at all.',
      ],
    },
    {
      heading: 'Pre-built themes vs custom SCSS themes',
      points: [
        'The schematic offers a PRE-BUILT theme (auto-applied CSS, like <code>indigo-pink.css</code> or <code>deeppurple-amber.css</code>) for the fastest possible start, or a custom SCSS theme built with <code>mat.define-theme()</code> for full control over colors, typography, and density.',
      ],
    },
  ];

  liveDemoFiles: PlaygroundFile[] = [
    {
      path: 'src/app/app.ts',
      content: `import { Component } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';

@Component({
  selector: 'app-root',
  standalone: true,
  // Standalone-compatible — import the individual module directly, no NgModule
  imports: [MatButtonModule, MatCardModule],
  template: \`
    <mat-card>
      <mat-card-content>
        <p>A minimal Material setup — button + card, no NgModule anywhere.</p>
        <button mat-flat-button color="primary">Primary action</button>
        <button mat-stroked-button color="warn">Warn action</button>
      </mat-card-content>
    </mat-card>
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

bootstrapApplication(App, {
  // Required — without this, dialogs/snackbars/panels open with no animation
  providers: [provideAnimationsAsync()],
});
`,
    },
    {
      path: 'src/index.html',
      content: `<!doctype html>
<html>
  <head>
    <title>Material setup</title>
    <link rel="stylesheet" href="https://fonts.googleapis.com/icon?family=Material+Icons">
    <style>
      @import url('https://fonts.googleapis.com/css2?family=Roboto:wght@400;500&display=swap');
      body { font-family: Roboto, sans-serif; margin: 1rem; }
    </style>
  </head>
  <body><app-root></app-root></body>
</html>
`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'Add a third button using mat-icon-button with color="accent" — icon-only buttons need an aria-label since there is no visible text for screen readers to announce.',
    hint: '<button mat-icon-button color="accent" aria-label="Favorite"><mat-icon>favorite</mat-icon></button> — remember to also import MatIconModule and add it to the imports array for <mat-icon> to work.',
    solution: `import { MatIconModule } from '@angular/material/icon';

// imports: [MatButtonModule, MatCardModule, MatIconModule],

// Template:
// <button mat-icon-button color="accent" aria-label="Favorite">
//   <mat-icon>favorite</mat-icon>
// </button>`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'Angular Material components need to be declared in an NgModule, the same as older Angular library integrations.',
      reality: 'every Material component is standalone-compatible — import the individual module (MatButtonModule, etc.) directly in each component\'s own imports array. There is no MaterialModule wrapper NgModule to declare things in.',
    },
    {
      thought: 'provideAnimationsAsync() is optional — Material components work fine without it, just without animations.',
      reality: 'skipping it is a real bug source, not just a cosmetic loss — dialogs, snackbars, and expansion panels can throw ExpressionChangedAfterChecked errors without it, not just lose their transition effects.',
    },
    {
      thought: 'the CDK is only useful as an internal implementation detail of Material components, not something you would use directly.',
      reality: 'CDK primitives (overlay positioning, focus trapping, drag-drop, a11y utilities) are usable completely INDEPENDENTLY of Material\'s visual layer — for building custom-styled UI that follows none of Material Design\'s visual conventions.',
    },
  ];
}
