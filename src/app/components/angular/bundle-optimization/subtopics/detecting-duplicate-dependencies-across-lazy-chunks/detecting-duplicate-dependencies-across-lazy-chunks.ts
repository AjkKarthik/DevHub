import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../shared/theory-block/theory-block';
import { LivePlaygroundComponent, PlaygroundFile } from '../../../../shared/live-playground/live-playground';
import { TryItComponent, TryItExercise } from '../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-detecting-duplicate-dependencies-across-lazy-chunks-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent,
    LivePlaygroundComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './detecting-duplicate-dependencies-across-lazy-chunks.html',
  styleUrl: './detecting-duplicate-dependencies-across-lazy-chunks.scss',
})
export class DetectingDuplicateDependenciesAcrossLazyChunksSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The quiz answer explains the common-chunk MECHANISM — this subtopic shows detecting when it FAILS',
      points: [
        'The main topic\'s quiz confirms that shared code used by multiple lazy chunks SHOULD be extracted into a common chunk, avoiding duplication. But common-chunk extraction is a build HEURISTIC, not a guarantee — a large shared dependency imported slightly differently across two feature modules (a different import PATH, a different re-export layer, or one feature importing a whole barrel file while another imports a specific submodule) can defeat the heuristic, silently causing the SAME library to be bundled twice, once inside each lazy chunk, with neither the developer nor a casual glance at file sizes revealing WHY two unrelated features both got noticeably larger.',
      ],
    },
    {
      heading: 'Reading the esbuild metafile to find exact duplication',
      points: [
        'Angular\'s esbuild-based production builder can emit a build METAFILE (a detailed JSON describing every input file\'s contribution to every output chunk) — run <code>ng build --configuration=production --stats-json</code> and inspect the generated stats/metafile with <code>esbuild-visualizer</code> or by loading it directly at <code>https://esbuild.github.io/analyze/</code> (paste the JSON) — this shows, PER OUTPUT CHUNK, exactly which SOURCE files contributed how many bytes, making a library appearing inside TWO SEPARATE chunk entries immediately visible as two distinct treemap regions with the same package name.',
        'A faster, scriptable check without a visualizer: <code>grep -c \'"node_modules/heavy-lib\' metafile.json</code> across the ENTIRE metafile — if the count is higher than the number of times you EXPECT that library to be a genuinely separate entry point (usually 1, for a properly shared dependency, or a small number matching legitimate multiple entry points), it is a strong signal of accidental duplication worth investigating in the visualizer.',
      ],
    },
    {
      heading: 'The fix: a shared barrel import, consistently used across features',
      points: [
        'Once duplication is confirmed, the fix is usually import-path CONSISTENCY: ensure every feature module importing the shared library does so through the EXACT SAME module specifier (the same barrel file or the same submodule path) — bundlers deduplicate based on resolving to the SAME underlying module instance, and two import paths that RESOLVE differently (even if they ultimately point to logically equivalent code) can be treated as two separate modules to bundle.',
        'For a genuinely large shared dependency used by 3+ lazy features, consider extracting the shared usage into your OWN small wrapper module (e.g. <code>shared/chart-lib.ts</code> that re-exports only what your app needs from the underlying library) — every feature then imports from YOUR wrapper (one consistent path) instead of each feature importing directly from the third-party package with its own resolution nuances, making deduplication far more reliable.',
      ],
    },
  ];

  liveDemoFiles: PlaygroundFile[] = [
    {
      path: 'src/app/shared/chart-lib.ts',
      content: `// A thin, consistent wrapper around a hypothetical charting library —
// every feature imports FROM HERE, not directly from the third-party
// package, guaranteeing bundlers resolve to the exact same module instance.
export { Chart, registerables } from 'chart.js';

export function createLineChart(canvas: HTMLCanvasElement, data: number[]) {
  // Wraps the shared library's setup boilerplate in one place
  console.log('creating line chart with', data.length, 'points');
}
`,
    },
    {
      path: 'src/app/dashboard/dashboard-chart.ts',
      content: `import { Component, ElementRef, viewChild, afterNextRender, input } from '@angular/core';
// CORRECT — imports through the shared wrapper, same resolved module
// as every other feature that needs charting.
import { createLineChart } from '../shared/chart-lib';

@Component({
  selector: 'app-dashboard-chart',
  standalone: true,
  template: \`<canvas #canvas></canvas>\`,
})
export class DashboardChartComponent {
  data = input.required<number[]>();
  private canvas = viewChild.required<ElementRef<HTMLCanvasElement>>('canvas');

  constructor() {
    afterNextRender(() => createLineChart(this.canvas().nativeElement, this.data()));
  }
}
`,
    },
    {
      path: 'src/app/reports/reports-chart.ts',
      content: `import { Component, ElementRef, viewChild, afterNextRender, input } from '@angular/core';
// CORRECT — same wrapper import path as dashboard-chart.ts.
// If this instead imported directly from 'chart.js' with a different
// specifier or a deep sub-path, the bundler could treat it as a
// SEPARATE module and duplicate the library into BOTH lazy chunks.
import { createLineChart } from '../shared/chart-lib';

@Component({
  selector: 'app-reports-chart',
  standalone: true,
  template: \`<canvas #canvas></canvas>\`,
})
export class ReportsChartComponent {
  data = input.required<number[]>();
  private canvas = viewChild.required<ElementRef<HTMLCanvasElement>>('canvas');

  constructor() {
    afterNextRender(() => createLineChart(this.canvas().nativeElement, this.data()));
  }
}
`,
    },
    {
      path: 'src/app/app.ts',
      content: `import { Component } from '@angular/core';
import { DashboardChartComponent } from './dashboard/dashboard-chart';
import { ReportsChartComponent } from './reports/reports-chart';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [DashboardChartComponent, ReportsChartComponent],
  template: \`
    <h3>Detecting duplicate dependencies across lazy chunks</h3>
    <p>Both dashboard-chart.ts and reports-chart.ts import createLineChart from the SAME
    shared wrapper path (../shared/chart-lib) — this consistency is what lets a bundler
    reliably deduplicate the underlying charting library into one shared chunk instead
    of bundling it twice, once per feature.</p>
    <app-dashboard-chart [data]="[1,2,3]" />
    <app-reports-chart [data]="[4,5,6]" />
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
  <head><title>Detecting duplicate dependencies across lazy chunks</title></head>
  <body><app-root></app-root></body>
</html>
`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'Introduce the duplication bug: change reports-chart.ts to import createLineChart from a slightly different (but logically equivalent) path, simulating what breaks bundler deduplication.',
    hint: 'Change the import in reports-chart.ts from `../shared/chart-lib` to a re-exported alias file, e.g. `../shared/chart-lib-alias` that just does `export * from \'./chart-lib\';` — even though it re-exports the same functions, the bundler may resolve it as a logically distinct module boundary in some configurations.',
    solution: `// src/app/shared/chart-lib-alias.ts — a re-export that can defeat deduplication
export * from './chart-lib';

// reports-chart.ts — now imports through a DIFFERENT path than dashboard-chart.ts
import { createLineChart } from '../shared/chart-lib-alias'; // was '../shared/chart-lib'

// Even though chart-lib-alias.ts re-exports the exact same functions,
// some bundler configurations treat this as a distinct module boundary,
// risking duplication of the underlying chart.js code across both
// feature chunks. Always import through the SAME consistent path.`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'a bundler\'s common-chunk extraction guarantees shared dependencies are never duplicated across lazy chunks, regardless of how each feature imports them.',
      reality: 'common-chunk extraction is a heuristic that relies on resolving to the SAME underlying module — inconsistent import paths (different barrel files, different sub-module specifiers) across features can defeat it, silently duplicating a large dependency.',
    },
    {
      thought: 'comparing raw chunk FILE SIZES is enough to detect duplicate dependencies across lazy chunks.',
      reality: 'the esbuild metafile shows exactly which SOURCE files contributed to each output chunk — a library appearing as a distinct entry in TWO separate chunks is the concrete signal, not just an unexplained size increase.',
    },
    {
      thought: 'fixing detected duplication means changing how the bundler is configured.',
      reality: 'the usual fix is application-level: ensuring every feature imports the shared dependency through the EXACT SAME consistent path (often via a small shared wrapper module), which lets the bundler\'s existing deduplication logic work correctly.',
    },
  ];
}
