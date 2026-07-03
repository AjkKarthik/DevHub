import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../shared/theory-block/theory-block';
import { LivePlaygroundComponent, PlaygroundFile } from '../../../../shared/live-playground/live-playground';
import { TryItComponent, TryItExercise } from '../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-scam-pattern-incremental-migration-walkthrough-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent,
    LivePlaygroundComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './scam-pattern-incremental-migration-walkthrough.html',
  styleUrl: './scam-pattern-incremental-migration-walkthrough.scss',
})
export class ScamPatternIncrementalMigrationWalkthroughSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'Why reach for SCAM at all when standalone: true already exists',
      points: [
        'The main topic notes SCAM (Single Component Angular Module) predates <code>standalone: true</code> and is "no longer necessary" for NEW code. This subtopic covers the one scenario where it still earns its keep DURING a migration: a large, actively-developed feature module where a full standalone conversion in one PR is too risky, but the team wants to START shrinking a giant shared module\'s surface area immediately, one component at a time, without touching that component\'s consumers at all.',
        'A SCAM wraps exactly ONE component (never several) in its own tiny <code>@NgModule</code> that declares just that component and imports whatever it needs. From the OUTSIDE, nothing about how consumers import or use the component changes — they still import "a module" that happens to contain one thing. This is the key property that makes SCAM a genuinely SAFE intermediate step: it changes internal structure without changing any public import path.',
      ],
    },
    {
      heading: 'The concrete before → SCAM → standalone progression, one component',
      points: [
        'STEP 1 (before): <code>UserCardComponent</code> lives inside a giant <code>SharedModule</code> alongside 40 other unrelated components, all declared together — nobody can import JUST the card without dragging in the whole module\'s dependency graph.',
        'STEP 2 (SCAM): extract <code>UserCardComponent</code> into its own <code>UserCardModule</code> — <code>@NgModule({ declarations: [UserCardComponent], imports: [CommonModule], exports: [UserCardComponent] })</code> — and update <code>SharedModule</code> to <code>exports: [UserCardModule]</code> instead of declaring the component directly. Consumers importing <code>SharedModule</code> still work unchanged; the component is now independently extractable.',
        'STEP 3 (standalone): once isolated in its own SCAM, converting <code>UserCardComponent</code> to <code>standalone: true</code> is a small, LOW-RISK change — its dependency graph is already fully understood from step 2 — and the surrounding <code>UserCardModule</code> can simply be deleted, with consumers switching to importing the component directly instead of through <code>SharedModule</code>.',
      ],
    },
    {
      heading: 'Ordering the migration by dependency graph depth, not alphabetically',
      points: [
        'The main topic\'s advice to "start with leaf components" becomes concrete with SCAM: build a quick dependency graph (which components import which) and migrate in TOPOLOGICAL ORDER — components with ZERO other app components depending on them first, then work UP toward components many other components depend on. A component migrated before its dependents are ready just needs those dependents to import it via its (still-existing) SCAM module until THEY are also migrated.',
        'This ordering minimizes the size of any single PR\'s "blast radius" — migrating a leaf component only requires its OWN spec file changes (see the previous subtopic\'s declarations→imports fix) and does not ripple into every file that happens to use it, since the SCAM boundary absorbs that ripple until the whole chain is eventually cleaned up.',
      ],
    },
  ];

  liveDemoFiles: PlaygroundFile[] = [
    {
      path: 'src/app/step1-shared-module.ts',
      content: `// ── STEP 1: BEFORE — giant SharedModule, everything tangled together ──────
import { Component, NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({ selector: 'app-user-card', template: '<div>{{ name }}</div>' })
export class UserCardComponent { name = 'placeholder'; }

@Component({ selector: 'app-user-avatar', template: '<img [src]="url" />' })
export class UserAvatarComponent { url = ''; }

// 38 more unrelated components declared here in the real app...

@NgModule({
  declarations: [UserCardComponent, UserAvatarComponent /* ...38 more */],
  imports: [CommonModule],
  exports: [UserCardComponent, UserAvatarComponent /* ...38 more */],
})
export class SharedModule {}
`,
    },
    {
      path: 'src/app/step2-scam.ts',
      content: `// ── STEP 2: SCAM — extract JUST UserCardComponent into its own tiny module ──
import { Component, NgModule } from '@angular/core';
import { CommonModule, NgClass } from '@angular/common';

@Component({
  selector: 'app-user-card',
  // no "standalone" or "imports" here — still module-declared,
  // its dependencies (ngClass) come from UserCardModule's own imports below
  template: '<div [ngClass]="role">{{ name }}</div>',
})
export class UserCardComponent {
  name = 'Ada';
  role = 'admin';
}

// A SCAM: declares and exports exactly ONE component
@NgModule({
  declarations: [UserCardComponent],
  imports: [CommonModule], // for ngClass, used inside the template
  exports: [UserCardComponent],
})
export class UserCardModule {}

// SharedModule now RE-EXPORTS the SCAM instead of declaring the component
// directly — consumers importing SharedModule see NO change at all.
@NgModule({
  imports: [UserCardModule /* , UserAvatarModule, ... */],
  exports: [UserCardModule /* , UserAvatarModule, ... */],
})
export class SharedModule {}
`,
    },
    {
      path: 'src/app/step3-standalone.ts',
      content: `// ── STEP 3: standalone — UserCardModule deleted, component is self-contained ──
import { Component } from '@angular/core';
import { NgClass } from '@angular/common';

@Component({
  selector: 'app-user-card',
  standalone: true,
  imports: [NgClass], // only what THIS component's template actually needs
  template: '<div [ngClass]="role">{{ name }}</div>',
})
export class UserCardComponent {
  name = 'Ada';
  role = 'admin';
}

// UserCardModule is deleted entirely.
// Consumers switch from "import { SharedModule }" to
// "import { UserCardComponent } from './user-card'" directly.
`,
    },
    {
      path: 'src/app/app.ts',
      content: `import { Component } from '@angular/core';
import { UserCardComponent } from './step3-standalone';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [UserCardComponent],
  template: \`
    <h3>SCAM pattern — three-step migration</h3>
    <p>Look at step1 (tangled SharedModule), step2 (extracted into its own SCAM
    module — no consumer-visible change), and step3 (fully standalone, SCAM
    deleted). Each step is independently safe to ship.</p>
    <app-user-card />
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
  <head><title>SCAM pattern — incremental migration walkthrough</title></head>
  <body><app-root></app-root></body>
</html>
`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'Extract UserAvatarComponent (currently still in the giant SharedModule) into its own SCAM, following the exact pattern used for UserCardComponent in step2.',
    hint: 'Create an AvatarModule declaring/exporting only UserAvatarComponent, importing CommonModule if needed, then have SharedModule import/export AvatarModule instead of declaring UserAvatarComponent directly.',
    solution: `@NgModule({
  declarations: [UserAvatarComponent],
  imports: [CommonModule],
  exports: [UserAvatarComponent],
})
export class UserAvatarModule {}

@NgModule({
  imports: [UserCardModule, UserAvatarModule],
  exports: [UserCardModule, UserAvatarModule],
})
export class SharedModule {}`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'the SCAM pattern is obsolete and has no legitimate use once standalone: true exists.',
      reality: 'it remains useful as a SAFE intermediate migration step for large, actively-developed feature modules — extracting one component into its own SCAM changes nothing consumer-visible while making that component independently extractable and low-risk to later convert to standalone.',
    },
    {
      thought: 'migrating components in alphabetical or file-listing order is as good as any other order.',
      reality: 'ordering by dependency graph depth — leaf components (nothing else depends on them) first — minimizes each migration step\'s blast radius, since a component migrated before its dependents just continues being imported through its still-existing SCAM module.',
    },
    {
      thought: 'wrapping a SharedModule\'s re-export of a SCAM changes how consumers import that component.',
      reality: 'consumers importing SharedModule see NO change at all after step 2 — the SharedModule still exports the same component, just re-exported through an intermediate SCAM module instead of declaring it directly.',
    },
  ];
}
