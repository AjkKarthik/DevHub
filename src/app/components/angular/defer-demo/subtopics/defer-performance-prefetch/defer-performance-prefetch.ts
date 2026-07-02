import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../shared/theory-block/theory-block';
import { LivePlaygroundComponent, PlaygroundFile } from '../../../../shared/live-playground/live-playground';
import { TryItComponent, TryItExercise } from '../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-defer-performance-prefetch-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent,
    LivePlaygroundComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './defer-performance-prefetch.html',
  styleUrl: './defer-performance-prefetch.scss',
})
export class DeferPerformancePrefetchSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The metric @defer actually improves: Time to Interactive',
      points: [
        'By splitting heavy components OUT of <code>main.js</code>, the initial JavaScript parse-and-execute time drops — the page becomes interactive SOONER, since the browser has less code to process before it can respond to input. This is Time to Interactive (TTI), not necessarily visual load speed.',
        'Use <code>on viewport</code> for content below the fold, and the default <code>on idle</code> for content that is rarely used but should still be ready reasonably soon. Use <code>on hover</code>/<code>on interaction</code> for things users may never open at all (modals, dropdowns) — these give a real head-start on the download before the click, making the eventual interaction feel instant.',
      ],
    },
    {
      heading: 'When NOT to use @defer',
      points: [
        'Do NOT defer small or simple components. The overhead of a SEPARATE HTTP request for a tiny chunk is often larger than whatever you saved by deferring it. Reserve <code>&#64;defer</code> for genuinely large standalone components — data grids, charting libraries, rich text editors, video players — not a small badge or icon component.',
      ],
    },
    {
      heading: 'prefetch — download early without blocking or rendering',
      points: [
        '<code>&#64;defer (on viewport; prefetch on idle) { ... }</code> (Angular 17.2+) downloads the chunk in the BACKGROUND as soon as the prefetch condition fires — WITHOUT inserting/rendering the component yet. When the actual render trigger (<code>on viewport</code> here) later fires, the component appears INSTANTLY, because its chunk is already cached.',
        'The distinction matters: the FIRST condition in the parentheses controls when the component actually RENDERS; <code>prefetch</code> plus its own condition controls only when the chunk starts DOWNLOADING in the background. They are two separate, independently-configurable triggers working together.',
      ],
    },
    {
      heading: 'Monitor deferred chunks — don\'t just assume it worked',
      points: [
        'Check the browser\'s Network tab — each deferred component appears as its own separate <code>.js</code> chunk request. If a chunk is STILL unexpectedly large after deferring it, the component likely has heavy STATIC imports pulling in library code that should itself be refactored or deferred separately — <code>&#64;defer</code> only splits the component\'s own code, not automatically every dependency it statically imports.',
      ],
    },
  ];

  liveDemoFiles: PlaygroundFile[] = [
    {
      path: 'src/app/chart-widget.ts',
      content: `import { Component } from '@angular/core';

@Component({
  selector: 'app-chart-widget',
  standalone: true,
  template: \`<p style="padding:1rem;background:#fef3c7;">📈 "Chart library" loaded — imagine this pulling in a heavy charting dependency.</p>\`,
})
export class ChartWidget {}
`,
    },
    {
      path: 'src/app/app.ts',
      content: `import { Component } from '@angular/core';
import { ChartWidget } from './chart-widget';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [ChartWidget],
  template: \`
    <p>The chart chunk starts PREFETCHING as soon as the browser is idle — but only
       RENDERS once you actually scroll it into view (on viewport).</p>
    <div style="height: 50vh; background: #f3f4f6;">(spacer — scroll down)</div>

    @defer (on viewport; prefetch on idle) {
      <app-chart-widget />
    } @placeholder {
      <p>⬜ Chart placeholder — but its chunk may already be cached by the time you see this!</p>
    } @loading {
      <p>⏳ Loading chart (should be fast if prefetch already ran)...</p>
    }
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
  <head><title>@defer performance and prefetch</title></head>
  <body><app-root></app-root></body>
</html>
`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'Change the trigger to use "on interaction" for rendering (instead of on viewport) while keeping "prefetch on hover" — so the chunk starts downloading as soon as the user hovers, but only renders once they actually click.',
    hint: '@defer (on interaction; prefetch on hover) { ... } — the first condition (on interaction) controls when it renders; prefetch on hover is a separate, independent condition controlling only when the download starts.',
    solution: `@defer (on interaction; prefetch on hover) {
  <app-chart-widget />
} @placeholder {
  <p>⬜ Hover to prefetch, click to render.</p>
}`,
  };

  misconceptions: Misconception[] = [
    {
      thought: '@defer always improves performance, so it is safe to wrap every component in it as a general habit.',
      reality: 'a small or simple component deferred unnecessarily pays the overhead of a SEPARATE HTTP request for a tiny chunk — that overhead can be larger than whatever was saved. Reserve @defer for genuinely large components; it is not a blanket performance win applied indiscriminately.',
    },
    {
      thought: 'prefetch causes the deferred component to render immediately once the prefetch condition fires.',
      reality: 'prefetch controls ONLY when the chunk starts downloading in the background — the component still does not RENDER until its own separate primary trigger condition fires. Prefetching just means that when the render trigger does fire, the content appears instantly because the chunk is already cached.',
    },
    {
      thought: 'since @defer automatically optimizes loading, there is no need to check chunk sizes afterward.',
      reality: '@defer only splits the component\'s OWN code — if that component has heavy static imports (a large library pulled in eagerly), the resulting chunk can still be unexpectedly large. Checking the Network tab is the only way to confirm the deferred chunk is actually small.',
    },
  ];
}
