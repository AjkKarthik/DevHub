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
  templateUrl: './text-can-be-the-lcp-candidate.html',
  styleUrl: './text-can-be-the-lcp-candidate.scss'
})
export class TextCanBeTheLcpCandidateSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The LCP algorithm scores every eligible element by rendered area, not by "is it an image"',
      points: [
        'A real <code>largest-contentful-paint</code> performance entry has a <code>url</code> field — for an image it is the resource URL; for a block-level text element (like a large <code>&lt;h1&gt;</code> or a wide paragraph), the browser reports the SAME entry type with an empty <code>url</code> string, because there was no network resource to name.',
        'This is directly measurable: injecting a large text block into an already-loaded page and watching a live <code>PerformanceObserver({ type: \'largest-contentful-paint\' })</code> produces a genuine new entry — with <code>entry.url === \'\'</code> and <code>entry.element</code> pointing at the actual <code>&lt;h1&gt;</code> DOM node — the exact same observer callback that fires for images.',
      ]
    },
    {
      heading: 'Practical consequence: an LCP optimisation plan that only touches images can miss the real bottleneck entirely',
      points: [
        'A landing page with a modest hero image but a huge, above-the-fold headline (common on text-heavy marketing pages, or any page rendered with a large custom web font) may have the <strong>headline</strong>, not the image, as its LCP element.',
        'If that is the case, image preloading and AVIF conversion do nothing for LCP — the actual fix is font loading (<code>&lt;link rel="preload" as="font"&gt;</code>, <code>font-display: swap</code>) and removing render-blocking CSS that delays when the text can paint.',
        'Always check <code>entry.url</code> (or the "LCP element" shown in Chrome DevTools\' Performance panel) before assuming the LCP candidate is an image — text winning by area is common and easy to overlook.',
      ]
    }
  ];

  liveDemoFiles: PlaygroundFile[] = [
    {
      path: 'index.html',
      content: `<!doctype html>
<html>
  <head>
    <title>text can be the LCP candidate</title>
    <style>
      body { font-family: sans-serif; margin: 2rem; }
      img { display: block; width: 200px; height: 150px; margin-bottom: 2rem; }
      h1 { font-size: 3.5rem; line-height: 1.1; max-width: 700px; }
    </style>
  </head>
  <body>
    <p>Open the browser console (or the StackBlitz Console tab) to see output.</p>
    <img src="https://picsum.photos/200/150" alt="a modest-sized hero image">
    <h1 id="headline">This oversized marketing headline covers far more pixel area than the small image above it</h1>
    <script type="module" src="index.ts"></script>
  </body>
</html>
`,
    },
    {
      path: 'index.ts',
      content: `const observer = new PerformanceObserver((list) => {
  for (const entry of list.getEntries() as any[]) {
    console.log('LCP candidate updated — tag:', entry.element ? entry.element.tagName : null,
      '| url:', JSON.stringify(entry.url), '| size (px^2):', entry.size);
  }
});
observer.observe({ type: 'largest-contentful-paint', buffered: true });

setTimeout(() => {
  observer.disconnect();
  console.log('final LCP candidate settled above — check whether it was the IMG or the H1, and note the H1 entry (if it won) has url: ""');
}, 1000);
`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A page has a 400×300 product photo and a huge <code>&lt;h1&gt;</code> headline set in a large custom web font that takes 900ms to load. The team spends a sprint optimising the product photo (AVIF, preload, CDN) but the field LCP score barely moves. What is the most likely explanation?',
    hint: 'Ask which element actually covers the larger rendered area, and whether that element is even an image.',
    solution: 'The headline text is almost certainly the actual LCP candidate, not the photo — a large heading in a wide custom font frequently covers more pixel area than a modest product photo. Optimising the image did nothing because the LCP element was never the image in the first place; the real bottleneck is the 900ms web font load delaying when the headline can paint. The fix is font optimisation (preload the font file, use font-display: swap, or self-host to cut the request), not more image work.'
  };

  misconceptions: Misconception[] = [
    {
      thought: '"Largest Contentful Paint" is really about images — the name basically means "how fast does the hero photo load".',
      reality: 'LCP scores ANY eligible element by rendered area, and text blocks are a first-class candidate type with their own <code>largest-contentful-paint</code> entries — an empty <code>url</code> field on the entry is the browser\'s own signal that the winner was text, not a missing image.'
    },
    {
      thought: 'If a page has any image on it at all, that image is virtually guaranteed to be the LCP element, since photos are usually "big".',
      reality: 'A single sentence of large heading text easily out-covers a modestly-sized photo in rendered pixel area — the demo in this subtopic shows a 200×150 image losing to a multi-line 3.5rem headline in a real PerformanceObserver measurement.'
    },
    {
      thought: 'Since text renders almost instantly (no network request needed), it can never be a meaningful LCP bottleneck the way a slow image is.',
      reality: 'Text IS instant only with a system font — a custom web font blocks the text from painting until the font file downloads, which can add hundreds of milliseconds to LCP exactly like a slow image would, just via <code>font-display</code>/preload tuning instead of <code>fetchpriority</code>.'
    }
  ];
}
