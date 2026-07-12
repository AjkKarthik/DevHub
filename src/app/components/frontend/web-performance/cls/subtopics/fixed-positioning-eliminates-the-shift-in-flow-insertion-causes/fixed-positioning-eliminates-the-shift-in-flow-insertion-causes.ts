import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { LivePlaygroundComponent, PlaygroundFile } from '../../../../../shared/live-playground/live-playground';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  standalone: true,
  imports: [PageMetaComponent, TheoryBlockComponent, LivePlaygroundComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent, SubtopicEyebrowComponent],
  templateUrl: './fixed-positioning-eliminates-the-shift-in-flow-insertion-causes.html',
  styleUrl: './fixed-positioning-eliminates-the-shift-in-flow-insertion-causes.scss'
})
export class FixedPositioningEliminatesTheShiftInFlowInsertionCausesSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'Inserting an element into the normal document flow physically displaces every element below it — a real, measurable layout shift',
      points: [
        'Prepending a new 80px-tall banner to the top of <code>&lt;body&gt;</code> with normal (static) positioning pushes every existing element below it down by exactly 80px.',
        'This is directly measurable: a live <code>PerformanceObserver({ type: \'layout-shift\' })</code> records a genuine, nonzero-value entry the instant this happens — the exact same mechanism used to compute the real CLS score.',
      ]
    },
    {
      heading: 'The identical banner, inserted as position: fixed instead, produces ZERO layout-shift entries',
      points: [
        'An element with <code>position: fixed</code> (or <code>sticky</code>, once stuck) is taken out of the normal document flow entirely — the browser lays out every other element as if it were not there at all.',
        'Confirmed directly: the exact same 80px banner, appended with <code>position: fixed; top: 0; left: 0; width: 100%</code> instead of being inserted at the top of the flow, produces no layout-shift entries whatsoever — verified in isolation with a live observer.',
        'This is a structural difference, not a magnitude difference — a position: fixed banner never causes CLS no matter how large it is, because it never displaces anything to begin with.',
      ]
    }
  ];

  liveDemoFiles: PlaygroundFile[] = [
    {
      path: 'index.html',
      content: `<!doctype html>
<html>
  <head>
    <title>fixed positioning eliminates the shift in-flow insertion causes</title>
    <style>
      body { margin: 0; padding: 2rem; }
      #main-content { background: #eee; padding: 2rem; }
    </style>
  </head>
  <body>
    <p>Open the browser console (or the StackBlitz Console tab) to see output.</p>
    <div id="main-content">This content should NOT move when the fixed banner appears.</div>
    <script type="module" src="index.ts"></script>
  </body>
</html>
`,
    },
    {
      path: 'index.ts',
      content: `function observeShifts(label: string, trigger: () => void): Promise<number[]> {
  return new Promise((resolve) => {
    const values: number[] = [];
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries() as any[]) values.push(entry.value);
    });
    observer.observe({ type: 'layout-shift', buffered: false });

    setTimeout(() => {
      trigger();
      setTimeout(() => {
        observer.disconnect();
        console.log(label, '— layout-shift entries:', values.length, values);
        resolve(values);
      }, 500);
    }, 100);
  });
}

(async () => {
  // Version A: banner inserted INTO the normal document flow — pushes content down
  await observeShifts('IN-FLOW banner (normal position)', () => {
    const banner = document.createElement('div');
    banner.id = 'banner-in-flow';
    banner.style.cssText = 'width:100%;height:80px;background:orange;';
    document.body.insertBefore(banner, document.body.firstChild);
  });

  document.querySelector('#banner-in-flow')?.remove();

  // Version B: identical-looking banner, but position: fixed — overlays, never displaces
  await observeShifts('FIXED banner (position: fixed)', () => {
    const banner = document.createElement('div');
    banner.id = 'banner-fixed';
    banner.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:80px;background:orange;z-index:9999;';
    document.body.appendChild(banner);
  });

  console.log('same visual size, same insertion moment — only the CSS position differs.');
})();
`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A cookie consent bar needs to appear 1.5 seconds after page load. One implementation option inserts it as the first child of <code>&lt;body&gt;</code> with normal positioning. Another wraps the same markup in <code>position: fixed; bottom: 0</code>. Both look visually identical once rendered. Does the CSS positioning choice actually matter for CLS?',
    hint: 'Ask what happens to the elements ALREADY on the page when each version is inserted — does anything below or around it have to move?',
    solution: 'Yes, it matters — a lot, even though both look the same once settled. The normally-positioned version physically pushes every element below its insertion point down by its own height, which the browser records as a genuine layout-shift entry contributing to CLS. The position: fixed version never displaces anything — it is removed from the normal flow entirely, so every other element is laid out exactly as if the banner were not there. Confirmed directly: the in-flow version produces a real, nonzero layout-shift entry; the fixed version produces none at all, verified in isolation with a live PerformanceObserver.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'Whether an inserted element causes CLS depends mainly on its SIZE — a small 80px banner should cause a small, mostly-negligible shift either way.',
      reality: 'It depends on POSITIONING, not size — a position: fixed banner of any size (80px or 800px) causes zero layout-shift entries, while the identical banner inserted into normal flow always displaces content and always registers a real shift, confirmed directly with a live observer.'
    },
    {
      thought: 'Since position: fixed and position: sticky both take an element out of normal document flow (once stuck for sticky), they must be interchangeable choices for avoiding CLS.',
      reality: 'Fixed elements are removed from flow from the moment they exist; sticky elements participate in normal flow until they reach their stuck threshold — inserting a NEW sticky element can still cause a shift at insertion time, depending on where in the layout it lands, in a way a fixed element never will.'
    },
    {
      thought: 'The main page\'s advice to use position: fixed for banners/cookie bars is mainly a visual-design recommendation (so the banner overlays nicely) rather than a CLS-specific technical requirement.',
      reality: 'It is a direct, structural CLS fix, not a styling preference — this subtopic\'s demo shows the in-flow version producing a real, measured layout-shift value, and the fixed version producing exactly zero, confirming the positioning choice is what determines whether CLS is affected at all.'
    }
  ];
}
