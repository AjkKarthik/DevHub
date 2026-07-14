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
  templateUrl: './content-visibility-defers-work-it-doesnt-eliminate-it.html',
  styleUrl: './content-visibility-defers-work-it-doesnt-eliminate-it.scss'
})
export class ContentVisibilityDefersWorkItDoesntEliminateItSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The moment something needs a skipped section\'s real geometry, the browser must do the deferred work right then, synchronously',
      points: [
        'The previous subtopic showed content-visibility: auto genuinely skips work on the initial render. That work has not vanished — it has been deferred until the browser is forced to answer a real question about the section\'s actual layout.',
        'Measured directly: querying <code>getBoundingClientRect()</code> on a deeply nested child inside a NEVER-YET-RENDERED content-visibility: auto section costs a real, measurable few milliseconds — the browser must synchronously lay out that section\'s contents right there to answer the query correctly. The identical query on an already-rendered, unoptimised section costs close to zero (already cached).',
        'Both queries return the CORRECT real value either way — the optimisation never produces wrong answers, it only shifts WHEN the cost is paid.',
      ]
    },
    {
      heading: 'This is exactly why over-eager measurement code defeats the whole point of the optimisation',
      points: [
        'A common real-world mistake: wrapping every section in <code>content-visibility: auto</code> for the render-time win, then immediately measuring every section\'s height with a <code>ResizeObserver</code> or a loop of <code>getBoundingClientRect()</code> calls for virtualisation or analytics — this forces every single "skipped" section to do its deferred layout work immediately anyway, silently cancelling the optimisation.',
        'The fix is not avoiding measurement entirely — it is measuring lazily, only for sections that are actually about to become relevant (e.g. via <code>IntersectionObserver</code>), so the deferred cost is paid only for the sections that genuinely need it, at the moment they need it.',
      ]
    }
  ];

  liveDemoFiles: PlaygroundFile[] = [
    {
      path: 'index.html',
      content: `<!doctype html>
<html>
  <head>
    <title>content-visibility defers work, it doesn't eliminate it</title>
    <style>#stage { position: fixed; top: -9999999px; left: 0; width: 800px; }</style>
  </head>
  <body>
    <p>Open the browser console (or the StackBlitz Console tab) to see output.</p>
    <div id="stage"></div>
    <script type="module" src="index.ts"></script>
  </body>
</html>
`,
    },
    {
      path: 'index.ts',
      content: `function buildSection(useContentVisibility: boolean): HTMLElement {
  const section = document.createElement('div');
  section.style.cssText = useContentVisibility
    ? 'content-visibility: auto; contain-intrinsic-size: 0 400px;'
    : '';
  let inner = '';
  for (let j = 0; j < 300; j++) inner += \`<div class="row" style="height:10px;">row \${j} <span>nested</span></div>\`;
  section.innerHTML = inner;
  return section;
}

const stage = document.querySelector<HTMLElement>('#stage')!;

// Case A: normal section, already fully rendered — query a deep child (should be instant, cached)
const normalSection = buildSection(false);
stage.appendChild(normalSection);
void normalSection.offsetHeight; // pre-render it fully
const normalLastRow = normalSection.querySelectorAll('.row')[299];
const t0 = performance.now();
const normalRect = normalLastRow.getBoundingClientRect();
const normalQueryMs = performance.now() - t0;
stage.removeChild(normalSection);

// Case B: content-visibility: auto section, NEVER rendered — query the same deep child (first touch)
const cvSection = buildSection(true);
stage.appendChild(cvSection);
const cvLastRow = cvSection.querySelectorAll('.row')[299];
const t1 = performance.now();
const cvRect = cvLastRow.getBoundingClientRect();
const cvFirstQueryMs = performance.now() - t1;
stage.removeChild(cvSection);

console.log('already-rendered normal section — querying a nested child:', normalQueryMs.toFixed(2), 'ms | height:', normalRect.height);
console.log('NEVER-rendered content-visibility:auto section — querying the SAME nested child:', cvFirstQueryMs.toFixed(2), 'ms | height:', cvRect.height);
console.log('both report the correct height — but the first touch on the skipped section pays the deferred layout cost right there.');
`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A team adds content-visibility: auto to every card in a long product grid to speed up initial render. To make the grid "virtualised", they also add a ResizeObserver that measures every card\'s height as soon as it mounts, to precompute row positions. After shipping, Lighthouse shows almost no improvement in rendering time despite the content-visibility change. Why?',
    hint: 'Ask what happens to the deferred layout work the moment something asks for a card\'s real size — does mounting the ResizeObserver count as "asking"?',
    solution: 'The ResizeObserver measuring every card immediately on mount forces each card\'s deferred layout work to happen right away, synchronously — exactly as shown in this subtopic\'s demo, where querying a skipped section\'s geometry pays its full deferred cost the moment it is touched. Since every card gets measured immediately regardless of whether it is actually visible, the content-visibility: auto optimisation never gets a chance to skip anything — the team is paying the full rendering cost anyway, just relabelled as "ResizeObserver work" instead of "initial layout work". The fix is deferring the measurement itself (e.g. only measuring cards as they approach the viewport via IntersectionObserver) so content-visibility can actually skip the ones that are never measured.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'Once an element has content-visibility: auto applied, ANY code that reads its layout will get a cheap, pre-computed answer — the browser has already done the work in advance regardless of what triggers the read.',
      reality: 'The opposite is true for a section that has not yet been rendered — this subtopic\'s demo shows the FIRST query after mounting costs real, measurable time (the browser does the deferred layout synchronously, right then) while a normal already-rendered section\'s equivalent query is essentially free.'
    },
    {
      thought: 'Since content-visibility: auto always returns the correct value when queried, there is no real downside to measuring skipped sections early — worst case it is no slower than not using the optimisation at all.',
      reality: 'Measuring every skipped section immediately is WORSE than the baseline in practice, since it forces all the deferred work to happen synchronously, likely blocking longer up front than doing normal (undeferred) rendering would have — the entire benefit of the optimisation is lost, and the code doing the eager measurement pays the whole bill at once instead of the browser spreading it out.'
    },
    {
      thought: 'This "defer, not eliminate" caveat only matters for exotic measurement code (custom virtualisation, analytics) — ordinary page code that just displays content is unaffected.',
      reality: 'Any code path that reads layout — including something as ordinary as a CSS :hover effect that depends on JS-measured dimensions, a scroll handler calling getBoundingClientRect(), or even certain browser DevTools panels open while debugging — can trigger the same forced, synchronous deferred-work payment described here.'
    }
  ];
}
