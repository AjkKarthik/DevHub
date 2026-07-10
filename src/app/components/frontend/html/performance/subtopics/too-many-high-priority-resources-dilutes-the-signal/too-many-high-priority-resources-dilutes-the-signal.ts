import { Component } from '@angular/core';
import { SubtopicEyebrowComponent } from '../../../../../../components/shared/subtopic-eyebrow/subtopic-eyebrow';
import { PageMetaComponent } from '../../../../../../components/shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../../components/shared/theory-block/theory-block';
import { LivePlaygroundComponent, PlaygroundFile } from '../../../../../../components/shared/live-playground/live-playground';
import { TryItComponent, TryItExercise } from '../../../../../../components/shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../../components/shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../../components/shared/subtopic-nav/subtopic-nav';

@Component({
  selector: 'app-too-many-high-priority-resources-dilutes-the-signal',
  standalone: true,
  imports: [
    SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent,
    LivePlaygroundComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent
  ],
  templateUrl: './too-many-high-priority-resources-dilutes-the-signal.html',
  styleUrl: './too-many-high-priority-resources-dilutes-the-signal.scss'
})
export class TooManyHighPriorityResourcesDilutesTheSignalSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'fetchpriority is relative, not a guarantee of parallel first-class treatment',
      points: [
        'The main page\'s own quiz question spells this out precisely: marking five images <code>fetchpriority="high"</code> does not make all five load faster in parallel — "five \'high\' resources compete with each other the same way five unmarked resources would, defeating the purpose of using the hint to single out the ONE genuinely critical resource."',
        'The hint only means "prioritize this over OTHER SAME-TYPE resources." When every resource on the page carries that same label, the browser is back to making its own ordering decisions among a pool of equally-labeled items — functionally the same problem as having no hints at all.',
      ]
    },
    {
      heading: 'This is directly observable via real Resource Timing start times',
      points: [
        'The Resource Timing API\'s <code>fetchStart</code> value records exactly when the browser began fetching a given resource. In a scenario with ONE genuinely high-priority image among several normal ones, that one image should reliably start noticeably earlier than the others.',
        'In a scenario where ALL images are marked high, the gap between their <code>fetchStart</code> times should shrink toward what you would see with NO priority hints at all — the browser has lost the ability to distinguish "this one matters most" from the rest.',
      ]
    },
  ];

  liveDemoFiles: PlaygroundFile[] = [
    {
      path: 'index.html',
      content: `<!doctype html>
<html>
  <head><title>fetchpriority dilution</title></head>
  <body>
    <h3>Scenario A: ONE image marked high, four unmarked</h3>
    <img id="a0" src="https://picsum.photos/id/1020/200/150" fetchpriority="high" width="200" height="150">
    <img id="a1" src="https://picsum.photos/id/1021/200/150" width="200" height="150">
    <img id="a2" src="https://picsum.photos/id/1022/200/150" width="200" height="150">
    <img id="a3" src="https://picsum.photos/id/1023/200/150" width="200" height="150">
    <img id="a4" src="https://picsum.photos/id/1024/200/150" width="200" height="150">

    <h3>Scenario B: ALL FIVE images marked high</h3>
    <img id="b0" src="https://picsum.photos/id/1025/200/150" fetchpriority="high" width="200" height="150">
    <img id="b1" src="https://picsum.photos/id/1026/200/150" fetchpriority="high" width="200" height="150">
    <img id="b2" src="https://picsum.photos/id/1027/200/150" fetchpriority="high" width="200" height="150">
    <img id="b3" src="https://picsum.photos/id/1028/200/150" fetchpriority="high" width="200" height="150">
    <img id="b4" src="https://picsum.photos/id/1029/200/150" fetchpriority="high" width="200" height="150">

    <pre id="output" style="background:#111;color:#0f0;padding:1rem;white-space:pre-wrap;"></pre>
    <script type="module" src="index.ts"></script>
  </body>
</html>
`,
    },
    {
      path: 'index.ts',
      content: `const output = document.getElementById('output')!;

function fetchStartSpread(ids: string[]): { spread: number; starts: number[] } {
  const entries = ids
    .map(id => performance.getEntriesByName((document.getElementById(id) as HTMLImageElement).src)[0] as PerformanceResourceTiming)
    .filter(Boolean);
  const starts = entries.map(e => Math.round(e.fetchStart));
  const spread = starts.length ? Math.max(...starts) - Math.min(...starts) : 0;
  return { spread, starts };
}

window.addEventListener('load', () => {
  setTimeout(() => {
    const a = fetchStartSpread(['a0', 'a1', 'a2', 'a3', 'a4']);
    const b = fetchStartSpread(['b0', 'b1', 'b2', 'b3', 'b4']);

    output.textContent =
      \`Scenario A (one high, four unmarked) — fetchStart values (ms): [\${a.starts.join(', ')}]\\n\` +
      \`  spread between earliest and latest start: \${a.spread}ms\\n\\n\` +
      \`Scenario B (all five high) — fetchStart values (ms): [\${b.starts.join(', ')}]\\n\` +
      \`  spread between earliest and latest start: \${b.spread}ms\\n\\n\` +
      'Network conditions vary run to run, but the underlying mechanism is fixed:\\n' +
      'a single high-priority resource among normal ones has a real signal to act on;\\n' +
      'five equally "high" resources give the browser nothing left to distinguish them by.';
  }, 1500);
});
`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'In Scenario A, only image "a0" is marked <code>fetchpriority="high"</code>. Predict: is a0 guaranteed to finish downloading before a1-a4, or does the browser only guarantee it STARTS earlier?',
    hint: 'fetchpriority is documented as an ordering/queueing hint for when the browser BEGINS fetching a resource — it says nothing about download speed, file size, or CDN response time, which are the actual determinants of finish time.',
    solution: `Only the START is influenced, not the finish time. fetchpriority affects the browser's internal
request-queue ordering — when competing for limited connection slots, higher-priority requests get
dispatched first. It has no control over network latency, server response time, or how large the
actual file turns out to be. A high-priority request for a huge file can still finish AFTER a
lower-priority request for a tiny one — the hint only front-loads the START of the race, not its
outcome.`
  };

  misconceptions: Misconception[] = [
    {
      thought: 'Marking every important-looking resource on a page fetchpriority="high" is a safe, purely-additive performance improvement.',
      reality: 'The main page\'s own quiz makes this explicit: over-applying the hint dilutes its effect back down to roughly the same outcome as using no hints at all — it should be reserved for the single resource that actually determines a Core Web Vital.'
    },
    {
      thought: 'fetchpriority guarantees a resource loads in parallel with, and independently of, every other resource\'s priority level.',
      reality: 'It only influences the browser\'s own internal queue ordering relative to OTHER resources of the same type — it does not grant a dedicated connection or bypass the browser\'s finite concurrent-connection limits.'
    },
    {
      thought: 'The effect of fetchpriority is a permanent, fixed improvement you can set once and never need to reconsider.',
      reality: 'Its value depends entirely on what else is competing for priority on that specific page at that specific moment — adding new "high" resources later can silently dilute the effectiveness of ones already marked that way.'
    },
  ];
}
