import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../shared/theory-block/theory-block';
import { LivePlaygroundComponent, PlaygroundFile } from '../../../../shared/live-playground/live-playground';
import { TryItComponent, TryItExercise } from '../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-testing-hybrid-standalone-and-ngmodule-components-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent,
    LivePlaygroundComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './testing-hybrid-standalone-and-ngmodule-components.html',
  styleUrl: './testing-hybrid-standalone-and-ngmodule-components.scss',
})
export class TestingHybridStandaloneAndNgmoduleComponentsSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The TestBed config difference is small but easy to get wrong mid-migration',
      points: [
        'For an OLD, NgModule-declared component, <code>TestBed.configureTestingModule({ declarations: [MyComponent], imports: [SomeSharedModule] })</code> is how you register it. For a NEWLY MIGRATED standalone component, the SAME component must instead go in the <code>imports</code> array, NOT <code>declarations</code>: <code>TestBed.configureTestingModule({ imports: [MyComponent] })</code> — standalone components are never declared, only imported, even in a test module.',
        'During a real migration (Pass 1 converts source files one at a time), a codebase temporarily has BOTH kinds of components — some still NgModule-declared, some freshly standalone. Every spec file for a component that got migrated needs this exact one-line change (move it from <code>declarations</code> to <code>imports</code>) or the test fails with a confusing "no component factory found" or "not part of any NgModule" style error that looks unrelated to the actual cause.',
      ],
    },
    {
      heading: 'Testing a standalone component that still depends on an un-migrated NgModule',
      points: [
        'A common transitional state: a freshly-standalone component imports a directive/pipe that STILL lives inside an old, un-migrated <code>SharedModule</code> (not yet broken up into individually-importable pieces). In this case the component\'s own <code>imports: []</code> array lists <code>SharedModule</code> directly — standalone components CAN import whole NgModules, not just other standalone pieces — and the TEST module mirrors this exactly, importing the component (not the SharedModule separately, since the component already re-exports its own dependency through its imports array).',
        'This hybrid capability (a standalone component importing an NgModule) is precisely what makes GRADUAL, file-by-file migration possible — you are never forced to migrate an entire dependency tree in one commit. Tests for a partially-migrated component should reflect this real intermediate state, not an idealized fully-migrated one.',
      ],
    },
    {
      heading: 'A regression test for accidentally forgetting to migrate a spec file alongside its component',
      points: [
        'When a component\'s SOURCE file gets <code>standalone: true</code> added but its SPEC file\'s <code>TestBed.configureTestingModule</code> still lists it under <code>declarations</code>, Angular throws at test-run time with an error that names the component but does NOT explicitly say "you forgot to move it to imports" — this ambiguity is exactly why the recommended migration workflow is to touch the <code>.ts</code> and <code>.spec.ts</code> files IN THE SAME COMMIT, so a broken test surfaces the mismatch immediately in CI rather than being silently skipped or misattributed to an unrelated change later.',
      ],
    },
  ];

  liveDemoFiles: PlaygroundFile[] = [
    {
      path: 'src/app/user-badge.component.ts',
      content: `import { Component, input } from '@angular/core';
import { NgClass } from '@angular/common';

// AFTER migration — standalone: true, self-contained imports
@Component({
  selector: 'app-user-badge',
  standalone: true,
  imports: [NgClass],
  template: \`<span [ngClass]="role()">{{ name() }}</span>\`,
})
export class UserBadgeComponent {
  name = input.required<string>();
  role = input<'admin' | 'member'>('member');
}
`,
    },
    {
      path: 'src/app/user-badge.component.spec.ts',
      content: `import { TestBed } from '@angular/core/testing';
import { UserBadgeComponent } from './user-badge.component';

describe('UserBadgeComponent (migrated to standalone)', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      // Standalone components go in "imports", NEVER "declarations" —
      // this is the single line that changes when a component migrates.
      imports: [UserBadgeComponent],
    }).compileComponents();
  });

  it('renders the name and applies the role class', () => {
    const fixture = TestBed.createComponent(UserBadgeComponent);
    fixture.componentRef.setInput('name', 'Ada');
    fixture.componentRef.setInput('role', 'admin');
    fixture.detectChanges();

    const span = fixture.nativeElement.querySelector('span');
    expect(span.textContent).toContain('Ada');
    expect(span.classList.contains('admin')).toBe(true);
  });
});

// ── The OLD (pre-migration) version of this spec, for comparison ──────────
// TestBed.configureTestingModule({
//   declarations: [UserBadgeComponent],   // <-- would now THROW
//   imports: [CommonModule],
// });
`,
    },
    {
      path: 'src/app/app.ts',
      content: `import { Component } from '@angular/core';
import { UserBadgeComponent } from './user-badge.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [UserBadgeComponent],
  template: \`
    <h3>Testing a migrated standalone component</h3>
    <p>Open user-badge.component.spec.ts — the key difference from a pre-migration
    spec is a single line: the component moves from "declarations" to "imports"
    in TestBed.configureTestingModule().</p>
    <app-user-badge name="Ada" role="admin" />
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
  <head><title>Testing hybrid standalone and NgModule components</title></head>
  <body><app-root></app-root></body>
</html>
`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'Simulate the "forgot to migrate the spec" bug by moving UserBadgeComponent back into declarations in the test config, and observe the error it produces.',
    hint: 'Change `imports: [UserBadgeComponent]` to `declarations: [UserBadgeComponent]` — Angular will throw because a standalone component cannot be declared in an NgModule-style declarations array.',
    solution: `// This throws — standalone components cannot go in declarations
await TestBed.configureTestingModule({
  declarations: [UserBadgeComponent], // WRONG for a standalone component
}).compileComponents();

// Error (approximate): "Component UserBadgeComponent is standalone, and
// cannot be declared in an NgModule. Did you mean to add it to the
// 'imports' array?" — Angular actually does warn about this specific
// mismatch directly in recent versions, making it easier to spot.`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'a component\'s test file automatically stays correct when the component itself is migrated to standalone.',
      reality: 'the spec file needs its own one-line change — moving the component from declarations to imports in TestBed.configureTestingModule() — and this is easy to forget since it lives in a separate file from the migration change itself.',
    },
    {
      thought: 'a standalone component can only import other standalone pieces, never a whole legacy NgModule.',
      reality: 'a standalone component CAN import an entire NgModule directly in its own imports array — this is exactly what makes gradual, file-by-file migration possible without forcing an entire dependency tree to migrate at once.',
    },
    {
      thought: 'migrating a component\'s source file and its spec file can safely happen in separate commits.',
      reality: 'touching both in the SAME commit means a broken test surfaces the declarations-vs-imports mismatch immediately in CI, rather than the mismatch being silently missed or misattributed to a later, unrelated change.',
    },
  ];
}
