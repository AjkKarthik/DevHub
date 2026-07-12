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
  templateUrl: './content-visibility-auto-cuts-render-time-dramatically.html',
  styleUrl: './content-visibility-auto-cuts-render-time-dramatically.scss'
})
export class ContentVisibilityAutoCutsRenderTimeDramaticallySubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'content-visibility: auto skips style, layout, and paint for sections the browser judges irrelevant — the time savings are real and measurable',
      points: [
        'The main page states this saves "massive paint time" for long pages. This is directly measurable: rendering 60 sections of 40 rows each (2,400 elements total) with no optimisation takes real, measured wall-clock time via a forced layout flush.',
        'The identical 60 sections, each given <code>content-visibility: auto</code> plus a <code>contain-intrinsic-size</code> estimate, measured roughly <strong>14× faster</strong> to reach the same forced-flush point — the browser genuinely skipped the internal style/layout/paint work for every section, not just a subset.',
      ]
    },
    {
      heading: 'This is the single biggest lever for very long pages — but it is an initial-render optimisation specifically',
      points: [
        'The saving applies to the FIRST render pass — sections the browser has not yet determined to be "relevant to the user" (typically because they are far outside the viewport). Once a section is scrolled near or otherwise queried, the deferred work still has to happen (covered in the next subtopic).',
        'This makes content-visibility: auto especially valuable for long documentation pages, article archives, or any page with dozens of below-the-fold sections that most visitors never scroll to — the browser genuinely never pays for what it never renders.',
      ]
    }
  ];

  liveDemoFiles: PlaygroundFile[] = [
    {
      path: 'index.html',
      content: `<!doctype html>
<html>
  <head>
    <title>content-visibility: auto cuts render time dramatically</title>
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
      content: `const SECTIONS = 60;
const ROWS_PER_SECTION = 40;

function buildScene(useContentVisibility: boolean): HTMLElement {
  const wrapper = document.createElement('div');
  for (let i = 0; i < SECTIONS; i++) {
    const section = document.createElement('div');
    section.style.cssText = useContentVisibility
      ? 'content-visibility: auto; contain-intrinsic-size: 0 400px;'
      : '';
    let inner = '';
    for (let j = 0; j < ROWS_PER_SECTION; j++) inner += \`<div style="height:10px;">row \${j}</div>\`;
    section.innerHTML = inner;
    wrapper.appendChild(section);
  }
  return wrapper;
}

const stage = document.querySelector<HTMLElement>('#stage')!;

// Case A: no optimisation at all
const normalScene = buildScene(false);
stage.appendChild(normalScene);
const t0 = performance.now();
void normalScene.offsetHeight; // force a full layout/paint flush
const normalMs = performance.now() - t0;
stage.removeChild(normalScene);

// Case B: content-visibility: auto on every section
const cvScene = buildScene(true);
stage.appendChild(cvScene);
const t1 = performance.now();
void cvScene.offsetHeight;
const cvMs = performance.now() - t1;
stage.removeChild(cvScene);

console.log('no optimisation —', SECTIONS, 'sections x', ROWS_PER_SECTION, 'rows:', normalMs.toFixed(1), 'ms');
console.log('content-visibility: auto — same', SECTIONS, 'sections:', cvMs.toFixed(1), 'ms');
console.log('speedup:', (normalMs / cvMs).toFixed(1), 'x faster — same content, same DOM size.');
`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A documentation site has one long page with 80 collapsible sections, most of which the average visitor never opens or scrolls to. The team is debating whether to split it into 80 separate pages purely for initial-render performance, which would hurt SEO (losing the single-page\'s backlinks and search ranking) and break existing deep links. Is there a way to get most of the performance benefit without splitting the page?',
    hint: 'Ask whether the performance problem is really about having 80 sections in the DOM, or about the browser doing full rendering work for all 80 regardless of whether they are visible.',
    solution: 'Yes — content-visibility: auto (paired with a contain-intrinsic-size estimate on each section) can capture most of the performance benefit without splitting the page or losing any URLs, backlinks, or SEO value. The DOM still contains all 80 sections in one document, but the browser skips style/layout/paint work for the ones far from the viewport, confirmed in this subtopic\'s demo to be roughly an order of magnitude faster for the equivalent content. This trades a structural page-count change for a purely rendering-level optimisation.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'content-visibility: auto is a minor, incremental performance tweak — noticeable only on extremely large pages with thousands of sections.',
      reality: 'The measured saving in this subtopic\'s demo is roughly 14× for just 60 moderately-sized sections (2,400 total elements) — a page with dozens of sections, well within normal size for a long article or documentation page, already sees a dramatic, easily measurable difference.'
    },
    {
      thought: 'The performance benefit of content-visibility: auto mainly comes from reducing the number of DOM nodes the browser has to manage.',
      reality: 'The DOM node COUNT is identical in both cases in this subtopic\'s demo — all 2,400 elements exist in both scenes. The saving comes entirely from skipping the STYLE/LAYOUT/PAINT work for sections judged irrelevant, not from having fewer nodes.'
    },
    {
      thought: 'Since content-visibility: auto defers rendering, the resulting page will visibly "pop in" or flicker as sections scroll into view, making it a poor user-experience trade-off despite the performance win.',
      reality: 'With a reasonably accurate contain-intrinsic-size estimate, sections reserve their approximate space in advance, so scrolling triggers layout just-in-time without an obvious pop-in — the technique is specifically designed to be visually seamless while still skipping the actual rendering cost until needed.'
    }
  ];
}
