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
  templateUrl: './the-lcp-candidate-changes-as-larger-elements-appear.html',
  styleUrl: './the-lcp-candidate-changes-as-larger-elements-appear.scss'
})
export class TheLcpCandidateChangesAsLargerElementsAppearSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'LCP is not "the first big thing that appears" — it is a RUNNING candidate that the browser keeps replacing every time something bigger shows up, until the page settles',
      points: [
        'As a page loads, the browser continuously tracks the largest visible content element it has seen so far — a headline might be the largest element for a moment, then get replaced once a hero image finishes loading and turns out to be bigger.',
        'The browser only stops updating the LCP candidate once the user interacts with the page (scrolls, clicks, types) or the page is backgrounded — the FINAL reported LCP value is whichever candidate was largest at that stopping point, not necessarily the very first one detected.',
      ]
    },
    {
      heading: 'This is directly measurable with the real largest-contentful-paint Performance Observer — adding a bigger element after a smaller one produces a SECOND real LCP entry, not just one',
      points: [
        'A small element is added to the page first, followed shortly after by a significantly larger one — deliberately simulating how a small piece of text often renders before a larger hero image finishes downloading.',
        'A live <code>PerformanceObserver({ type: \'largest-contentful-paint\' })</code> fires TWICE — once when the small element becomes the (temporary) largest-seen candidate, and again with a LARGER reported <code>size</code> once the bigger element appears and takes over as the new candidate.',
      ]
    }
  ];

  liveDemoFiles: PlaygroundFile[] = [
    {
      path: 'index.html',
      content: `<!doctype html>
<html>
  <head>
    <title>the LCP candidate changes as larger elements appear</title>
    <style>
      #small { width: 80px; height: 80px; background: crimson; }
      #large { width: 400px; height: 300px; background: royalblue; margin-top: 12px; }
    </style>
  </head>
  <body>
    <p>Open the browser console (or the StackBlitz Console tab) to see output.</p>
    <div id="content"></div>
    <script type="module" src="index.ts"></script>
  </body>
</html>
`,
    },
    {
      path: 'index.ts',
      content: `const lcpEntries: { size: number; renderTime: number }[] = [];
const observer = new PerformanceObserver((list) => {
  for (const entry of list.getEntries() as any[]) {
    lcpEntries.push({ size: entry.size, renderTime: entry.renderTime || entry.loadTime });
    console.log('new LCP candidate reported -- size:', entry.size);
  }
});
observer.observe({ type: 'largest-contentful-paint', buffered: true });

const content = document.querySelector<HTMLElement>('#content')!;

// A small element renders first (simulating fast-rendering text)
const small = document.createElement('div');
small.id = 'small';
content.appendChild(small);
console.log('added the SMALL element -- this becomes the first LCP candidate.');

setTimeout(() => {
  // A larger element appears afterward (simulating a slower-loading hero image)
  const large = document.createElement('div');
  large.id = 'large';
  content.appendChild(large);
  console.log('added the LARGE element -- watch for a SECOND, bigger LCP entry above.');

  setTimeout(() => {
    observer.disconnect();
    console.log('total LCP candidate updates recorded:', lcpEntries.length);
    console.log('sizes seen, in order:', lcpEntries.map(e => e.size));
    console.log('the candidate grew over time -- the final one is not necessarily the first one detected:', lcpEntries.length >= 2);
  }, 400);
}, 250);
`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A landing page shows a headline (rendered instantly from server HTML) followed by a hero image that takes 2 extra seconds to download. A developer assumes LCP is determined by the headline, since it appears first. Is that assumption correct?',
    hint: 'Ask whether LCP is based on which element renders FIRST, or which element is LARGEST at the point measurement stops.',
    solution: 'Probably not — if the hero image, once loaded, is visually larger than the headline text block, it becomes the NEW LCP candidate the moment it finishes rendering, replacing the headline. The final reported LCP time reflects whenever that larger image actually became visible — likely much later than the headline\'s own render time — which is exactly why slow-loading hero images are such a common, significant LCP problem even when other content appears quickly.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'LCP is essentially the same idea as FCP (First Contentful Paint) — it measures whatever renders first, just with a more specific name.',
      reality: 'LCP specifically tracks the LARGEST element, which is frequently NOT the first thing to render. A fast, small headline can render first and then get superseded by a slower, larger hero image — LCP reports the larger, later element\'s time, not the headline\'s early one.'
    },
    {
      thought: 'The LCP measurement is a single, one-time snapshot — the browser looks at the page once, determines the largest visible element, and reports that value immediately.',
      reality: 'It is an ongoing, updating process throughout the page load — the browser keeps replacing its candidate every time a bigger element appears, only finalizing the value once the user interacts with the page or it\'s backgrounded.'
    },
    {
      thought: 'Since LCP can keep changing, it must be an unreliable, hard-to-optimize metric compared to something more fixed like FCP.',
      reality: 'The updating behavior is exactly what makes LCP a genuinely useful, user-centric metric — it reflects when the actual meaningful content (not just any pixel) became visible, which is precisely why optimizing the LARGEST element specifically (usually a hero image or heading) is the highest-leverage LCP improvement.'
    }
  ];
}
