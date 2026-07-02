import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../shared/theory-block/theory-block';
import { LivePlaygroundComponent, PlaygroundFile } from '../../../../shared/live-playground/live-playground';
import { TryItComponent, TryItExercise } from '../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-defer-requirements-nesting-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent,
    LivePlaygroundComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './defer-requirements-nesting.html',
  styleUrl: './defer-requirements-nesting.scss',
})
export class DeferRequirementsNestingSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'Standalone components only',
      points: [
        '<code>&#64;defer</code> ONLY works with standalone components. An NgModule-declared component cannot be deferred directly — it has to be migrated to standalone, or wrapped in a small standalone shell component, before it can go inside an <code>&#64;defer</code> block.',
        'The deferred component must STILL be listed in the host\'s <code>imports[]</code> array, even though it is lazy-loaded — Angular\'s compiler uses that declaration to identify which component to split into its own chunk. Omit it, and the build either fails or (depending on version) silently bundles the component eagerly into <code>main.js</code>, defeating the whole point.',
      ],
    },
    {
      heading: 'Runtime behavior is unchanged once loaded',
      points: [
        'After the chunk downloads, the deferred component participates in change detection completely NORMALLY — signals, inputs, outputs, and lifecycle hooks all behave exactly like an eagerly-loaded component. <code>&#64;defer</code> only changes WHEN the JavaScript arrives, never HOW the component behaves once it has.',
      ],
    },
    {
      heading: 'Nesting is fully supported',
      points: [
        'A deferred component can itself contain its OWN <code>&#64;defer</code> blocks. Each nested block gets its own independent chunk and its own independent trigger — Angular does not require the parent\'s block to resolve before a child\'s block can start its own download or fire its own trigger.',
      ],
    },
    {
      heading: 'Server-side rendering (SSR) support',
      points: [
        'SSR support for <code>&#64;defer</code> has been stable since Angular 19. In SSR mode, the <code>&#64;placeholder</code> content is what gets rendered on the SERVER — the actual deferred component only downloads and hydrates on the CLIENT, once its trigger fires there.',
      ],
    },
  ];

  liveDemoFiles: PlaygroundFile[] = [
    {
      path: 'src/app/inner-widget.ts',
      content: `import { Component } from '@angular/core';

@Component({
  selector: 'app-inner-widget',
  standalone: true,
  template: \`<p style="padding:.5rem;background:#dcfce7;">🟢 Inner widget loaded (its own independent chunk)</p>\`,
})
export class InnerWidget {}
`,
    },
    {
      path: 'src/app/outer-widget.ts',
      content: `import { Component, signal } from '@angular/core';
import { InnerWidget } from './inner-widget';

@Component({
  selector: 'app-outer-widget',
  standalone: true,
  imports: [InnerWidget],
  template: \`
    <div style="padding:1rem;background:#dbeafe;">
      🔵 Outer widget loaded.
      <button (click)="showInner.set(true)">Load nested inner widget</button>
      @defer (when showInner()) {
        <app-inner-widget />
      } @placeholder {
        <p>⬜ Inner widget not loaded yet — its OWN independent defer block.</p>
      }
    </div>
  \`,
})
export class OuterWidget {
  showInner = signal(false);
}
`,
    },
    {
      path: 'src/app/app.ts',
      content: `import { Component, signal } from '@angular/core';
import { OuterWidget } from './outer-widget';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [OuterWidget], // still required, even though lazy-loaded
  template: \`
    <button (click)="showOuter.set(true)">Load outer widget</button>
    @defer (when showOuter()) {
      <app-outer-widget />
    } @placeholder {
      <p>⬜ Outer widget not loaded yet.</p>
    }
  \`,
})
export class App {
  showOuter = signal(false);
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
  <head><title>@defer requirements and nesting</title></head>
  <body><app-root></app-root></body>
</html>
`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'Add a THIRD level of nesting — a DeepWidget deferred inside InnerWidget, following the exact same pattern (its own signal trigger, its own placeholder, added to InnerWidget\'s imports[]).',
    hint: 'Create deep-widget.ts the same shape as inner-widget.ts, then in inner-widget.ts add: imports: [DeepWidget], a showDeep = signal(false) field, a button, and its own @defer (when showDeep()) { <app-deep-widget /> } @placeholder { ... } block — each level is independent, following the identical pattern one level deeper.',
    solution: `// deep-widget.ts — identical shape to inner-widget.ts
@Component({
  selector: 'app-deep-widget',
  standalone: true,
  template: \`<p>🟣 Deep widget loaded — third independent chunk.</p>\`,
})
export class DeepWidget {}

// inner-widget.ts additions:
import { DeepWidget } from './deep-widget';

@Component({
  selector: 'app-inner-widget',
  standalone: true,
  imports: [DeepWidget],
  template: \`
    <div>
      🟢 Inner widget loaded.
      <button (click)="showDeep.set(true)">Load deep widget</button>
      @defer (when showDeep()) {
        <app-deep-widget />
      } @placeholder {
        <p>⬜ Deep widget not loaded yet.</p>
      }
    </div>
  \`,
})
export class InnerWidget {
  showDeep = signal(false);
}`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'any Angular component, including NgModule-declared ones, can be wrapped in an @defer block.',
      reality: '@defer works ONLY with standalone components — an NgModule-declared component must first be migrated to standalone (or wrapped in a small standalone shell) before it can be deferred at all.',
    },
    {
      thought: 'since a deferred component is lazy-loaded, you can skip adding it to the host component\'s imports[] array.',
      reality: 'the deferred component must STILL be listed in imports[] — Angular\'s compiler relies on that declaration to identify which component to split into its own chunk. Skipping it breaks the build or the chunking.',
    },
    {
      thought: 'a deferred component behaves differently at runtime (different change detection, different signal behavior) once it eventually loads.',
      reality: '@defer changes ONLY when the JavaScript is downloaded — once loaded, the component participates in change detection completely normally, with signals/inputs/outputs/lifecycle hooks behaving exactly as they would if it had been eagerly loaded from the start.',
    },
  ];
}
