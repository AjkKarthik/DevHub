import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../shared/theory-block/theory-block';
import { LivePlaygroundComponent, PlaygroundFile } from '../../../../shared/live-playground/live-playground';
import { TryItComponent, TryItExercise } from '../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-publishing-harnesses-as-a-librarys-public-testing-entry-point-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent,
    LivePlaygroundComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './publishing-harnesses-as-a-librarys-public-testing-entry-point.html',
  styleUrl: './publishing-harnesses-as-a-librarys-public-testing-entry-point.scss',
})
export class PublishingHarnessesAsALibrarysPublicTestingEntryPointSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'A pattern the main topic references but never shows',
      points: [
        'The main Harnesses page says "Publish harnesses alongside components in the same export — <code>import &#123; RatingHarness &#125; from \'@my-lib/rating/testing\'</code> mirrors the pattern Angular Material uses" — but never shows HOW that import path is actually produced. It is a distinct SECONDARY ENTRY POINT in an Angular library, not just a file placed next to the component.',
        'Angular Material itself follows this exact structure: <code>@angular/material/button</code> (the component) and <code>@angular/material/button/testing</code> (its harness) are TWO SEPARATE entry points built from two separate <code>ng-package.json</code> configurations, even though their source lives in adjacent folders in the same package.',
      ],
    },
    {
      heading: 'Why a SEPARATE entry point, not just a co-located export',
      points: [
        'If harness classes were exported from the SAME entry point as the component itself, every consumer\'s PRODUCTION bundle would need to tree-shake away the harness code (which imports <code>@angular/cdk/testing</code>, a testing-only dependency) — a separate <code>/testing</code> entry point means an app that never imports it never even resolves that dependency, guaranteeing zero production bundle impact regardless of how good tree-shaking is.',
        'This also lets the harness depend on <code>@angular/cdk/testing</code> as a dependency of ONLY that entry point\'s build, without polluting the main package\'s public API surface or its own dependency graph with a testing-only library.',
      ],
    },
    {
      heading: 'The ng-packagr secondary entry point structure',
      points: [
        'A secondary entry point requires its own folder with a <code>ng-package.json</code> (declaring its own <code>lib.entryFile</code>) and a barrel <code>public-api.ts</code> that re-exports the harness class(es) — structurally identical to how the library\'s ROOT <code>public-api.ts</code> exports the component itself, just scoped to a subfolder like <code>rating/testing/</code>.',
        'The library\'s root-level <code>package.json</code> (or, in modern ng-packagr, the generated per-entry-point <code>package.json</code>) needs an entry mapping so consumers can resolve <code>@my-lib/rating/testing</code> to the correct compiled output — <code>ng-packagr</code> handles this automatically when the secondary entry point folder is correctly structured and referenced from the library\'s <code>ng-package.json</code> (or <code>project.json</code> in newer Angular CLI library setups).',
        'Consumers then import EXACTLY like they import a Material harness: <code>import &#123; RatingHarness &#125; from \'@my-lib/rating/testing\';</code> — the double-segmented path (<code>rating</code>, then <code>testing</code>) mirrors <code>@angular/material/button/testing</code> precisely, which is why this pattern reads as immediately familiar to anyone who has used Material\'s own harnesses.',
      ],
    },
    {
      heading: 'Versioning and the harness as part of your public API contract',
      points: [
        'Once published, a harness\'s PUBLIC METHODS (<code>setRating()</code>, <code>getValue()</code>) become part of your library\'s semver contract exactly like the component\'s own public <code>@Input()</code>s — removing or renaming a harness method is a BREAKING CHANGE for every consumer\'s test suite, even if the underlying component\'s runtime behavior is unchanged.',
        'This has a practical consequence for internal refactors: you can freely change the component\'s INTERNAL DOM structure (the exact thing harnesses exist to protect against) in a PATCH release, since the harness\'s locators absorb that change — but changing the harness\'s own PUBLIC method signatures needs the same MAJOR-version discipline as any other public API change.',
        'Document harness methods with the same rigor as public component inputs/outputs — a harness with an undocumented, ambiguous <code>getValue()</code> (does it return the numeric rating, or a formatted string?) creates exactly the kind of consumer confusion the harness pattern is meant to eliminate.',
      ],
    },
  ];

  liveDemoFiles: PlaygroundFile[] = [
    {
      path: 'projects/rating-lib/rating/rating.component.ts',
      content: `import { Component, input, output } from '@angular/core';

@Component({
  selector: 'lib-star-rating',
  standalone: true,
  template: \`
    @for (i of [1, 2, 3, 4, 5]; track i) {
      <span class="star" [class.filled]="i <= value()" (click)="valueChange.emit(i)">
        &#9733;
      </span>
    }
  \`,
})
export class RatingComponent {
  value = input(0);
  valueChange = output<number>();
}
`,
    },
    {
      path: 'projects/rating-lib/rating/public-api.ts',
      content: `// Root entry point — @my-lib/rating — production code ONLY.
// Notice: no harness export here. A consumer importing from this path
// never resolves @angular/cdk/testing, guaranteeing zero production impact.
export * from './rating.component';
`,
    },
    {
      path: 'projects/rating-lib/rating/testing/rating-harness.ts',
      content: `import { ComponentHarness } from '@angular/cdk/testing';

// Lives in a SEPARATE folder — rating/testing/ — with its own entry point,
// exactly mirroring @angular/material/button vs @angular/material/button/testing.
export class RatingHarness extends ComponentHarness {
  static hostSelector = 'lib-star-rating';

  private getStars = this.locatorForAll('.star');

  async getValue(): Promise<number> {
    const stars = await this.getStars();
    let rating = 0;
    for (const star of stars) {
      if (await star.hasClass('filled')) rating++;
    }
    return rating;
  }

  async setRating(value: number): Promise<void> {
    const stars = await this.getStars();
    await stars[value - 1].click();
  }
}
`,
    },
    {
      path: 'projects/rating-lib/rating/testing/public-api.ts',
      content: `// Secondary entry point's own barrel file — this is what makes
// "@my-lib/rating/testing" resolvable as a distinct import path.
export * from './rating-harness';
`,
    },
    {
      path: 'projects/rating-lib/rating/testing/ng-package.json',
      content: `{
  "$schema": "../../../../node_modules/ng-packagr/ng-package.schema.json",
  "lib": {
    "entryFile": "public-api.ts"
  }
}
`,
    },
    {
      path: 'consuming-app/rating-usage.component.spec.ts',
      content: `import { TestBed } from '@angular/core/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';

// Imported EXACTLY like a Material harness — the double-segmented path
// ("rating", then "testing") is the whole point of the secondary entry point.
import { RatingHarness } from '@my-lib/rating/testing';
import { RatingUsageComponent } from './rating-usage.component';

describe('RatingUsageComponent', () => {
  it('sets and reads a rating via the published harness', async () => {
    const fixture = TestBed.createComponent(RatingUsageComponent);
    const loader = TestbedHarnessEnvironment.loader(fixture);
    const rating = await loader.getHarness(RatingHarness);

    await rating.setRating(4);

    expect(await rating.getValue()).toBe(4);
  });
});
`,
    },
    {
      path: 'src/app/app.ts',
      content: `import { Component } from '@angular/core';

@Component({
  selector: 'app-root',
  standalone: true,
  template: \`
    <h3>Publishing harnesses as a public testing entry point</h3>
    <p>
      This demo shows a library's folder structure — projects/rating-lib/rating/
      (the component, exported from public-api.ts) and
      projects/rating-lib/rating/testing/ (the harness, its OWN secondary entry
      point with its own ng-package.json and public-api.ts). Open
      rating-usage.component.spec.ts to see how a consumer imports the harness
      exactly like an Angular Material harness.
    </p>
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
  <head><title>Publishing Harnesses as a Public Testing Entry Point</title></head>
  <body><app-root></app-root></body>
</html>
`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'Explain (in a code comment) why adding a brand-new method to <code>RatingHarness</code> — e.g. <code>async isDisabled(): Promise&lt;boolean&gt;</code> — is safe to release as a MINOR version bump, while renaming the existing <code>getValue()</code> method to <code>getRating()</code> is a MAJOR (breaking) change, even though both changes touch the same file.',
    hint: 'Think about semver: adding a new method is purely additive — existing consumer test code that never calls the new method is completely unaffected. Renaming an existing method breaks every consumer test that currently calls harness.getValue() — their code no longer compiles/runs until they update the call site.',
    solution: `// Adding isDisabled() is purely ADDITIVE — every existing consumer test
// that calls rating.setRating() or rating.getValue() continues to work
// completely unchanged. No existing code path is affected. This is safe
// as a MINOR version bump under semver (new functionality, backward compatible).

// Renaming getValue() -> getRating() BREAKS every consumer test currently
// calling harness.getValue() — that method no longer exists, so their test
// files fail to compile (TypeScript) or throw at runtime (JS). This is a
// BREAKING CHANGE requiring a MAJOR version bump, exactly like renaming a
// public @Input() on the component itself would be.`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'a harness class just needs to be exported from the same file/barrel as its component to be "published alongside" it.',
      reality: 'Angular Material\'s pattern (and the recommended pattern generally) uses a SEPARATE secondary entry point (its own ng-package.json + public-api.ts) specifically so a harness\'s testing-only dependency (@angular/cdk/testing) never gets resolved by production code that only imports the component.',
    },
    {
      thought: 'internal refactors of a component\'s DOM structure are safe to ship in a patch release, but so is any change to its harness, since the harness is "just for testing."',
      reality: 'a harness\'s PUBLIC METHODS are part of the library\'s semver contract exactly like a component\'s public Inputs/Outputs — renaming or removing a harness method is a breaking change for every consumer\'s test suite, even though the component\'s own runtime behavior may be completely unaffected.',
    },
    {
      thought: 'since a harness only affects tests, its published API doesn\'t need the same documentation rigor as the component\'s own public API.',
      reality: 'an undocumented or ambiguous harness method (does getValue() return a number or a formatted string?) creates exactly the kind of consumer confusion the harness pattern exists to eliminate — document harness methods with the same care as public component API.',
    },
  ];
}
