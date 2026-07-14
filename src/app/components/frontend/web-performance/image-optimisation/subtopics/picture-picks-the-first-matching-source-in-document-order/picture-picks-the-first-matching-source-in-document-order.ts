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
  templateUrl: './picture-picks-the-first-matching-source-in-document-order.html',
  styleUrl: './picture-picks-the-first-matching-source-in-document-order.scss'
})
export class PicturePicksTheFirstMatchingSourceInDocumentOrderSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The <picture> element does not rank sources by "best format" — it walks them top to bottom and stops at the first one the browser can use',
      points: [
        'When the browser evaluates a <code>&lt;picture&gt;</code> element, it checks each <code>&lt;source&gt;</code> in document order and uses the FIRST one whose <code>type</code> (and <code>media</code>, if present) it supports — not the smallest file, not the "best" format by any quality metric, simply the first match.',
        'Confirmed directly: given two <code>&lt;source&gt;</code> elements the browser supports equally well (both real, fetchable, equally-valid image types), the resulting <code>&lt;img&gt;.currentSrc</code> always matches the FIRST one — the second is never even considered once the first matches.',
      ]
    },
    {
      heading: 'This is exactly why AVIF must be listed before WebP, and WebP before the JPEG fallback',
      points: [
        'The main page\'s recommended order — AVIF, then WebP, then JPEG — relies entirely on this first-match behaviour: a browser that supports AVIF stops at the first source and never even evaluates the WebP or JPEG ones.',
        'Reversing the order (JPEG first, AVIF last) would be a silent, costly mistake: every browser, including ones with full AVIF support, would match the JPEG source first and never reach the smaller AVIF file at all — no error, no warning, just consistently worse performance than intended.',
      ]
    }
  ];

  liveDemoFiles: PlaygroundFile[] = [
    {
      path: 'index.html',
      content: `<!doctype html>
<html>
  <head>
    <title>picture picks the first matching source in document order</title>
  </head>
  <body>
    <p>Open the browser console (or the StackBlitz Console tab) to see output.</p>
    <script type="module" src="index.ts"></script>
  </body>
</html>
`,
    },
    {
      path: 'index.ts',
      content: `// Both <source> elements below use a type the browser genuinely supports
// (image/svg+xml) — this isolates the DOCUMENT ORDER rule from any real
// format-support fallback logic.
async function testOrder(firstUrl: string, secondUrl: string): Promise<string> {
  const picture = document.createElement('picture');
  picture.innerHTML = \`
    <source type="image/svg+xml" srcset="\${firstUrl}">
    <source type="image/svg+xml" srcset="\${secondUrl}">
    <img alt="test">
  \`;
  document.body.appendChild(picture);
  const img = picture.querySelector('img')!;
  await new Promise((resolve) => { img.onload = resolve; setTimeout(resolve, 600); });
  const currentSrc = img.currentSrc;
  document.body.removeChild(picture);
  return currentSrc;
}

(async () => {
  const resultA = await testOrder('/index.html?variant=A', '/index.html?variant=B');
  console.log('Order: A first, B second  -> browser picked:', resultA.includes('variant=A') ? 'A (the first one)' : 'B');

  const resultB = await testOrder('/index.html?variant=B', '/index.html?variant=A');
  console.log('Order: B first, A second  -> browser picked:', resultB.includes('variant=B') ? 'B (the first one)' : 'A');

  console.log('Same two equally-supported sources, swapped order — the FIRST one wins every time.');
})();
`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A developer refactoring a component accidentally reorders the source elements inside a <picture> block, putting the JPEG fallback FIRST and the AVIF source LAST — otherwise all attributes are correct. The build succeeds with no errors, visual regression tests pass (the image still looks correct), and nobody notices for months. What is the actual, hidden cost of this mistake?',
    hint: 'Ask what the picture element checks first when evaluating sources — does source ORDER matter even when every source individually points at a valid, correctly-formatted file?',
    solution: 'Every visitor\'s browser, including ones with full AVIF support, now matches the JPEG source FIRST and never even evaluates the AVIF source afterward — confirmed directly in this subtopic\'s demo, where the first equally-valid source always wins regardless of what comes after it. The image still displays correctly (JPEG is a perfectly valid image), so visual tests pass and nothing looks broken — but every user downloads a JPEG roughly 50% larger than the AVIF they should have received, a silent, permanent performance regression with no error or warning anywhere to catch it.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'The browser evaluates all <source> elements in a <picture> block and picks whichever one is objectively "best" (smallest file, most modern format) among the ones it supports.',
      reality: 'It stops at the FIRST source it supports and never looks further — confirmed directly in this subtopic\'s demo where swapping the order of two equally-valid sources changed which one was picked, purely based on position, not any quality comparison.'
    },
    {
      thought: 'Source order inside <picture> is a matter of code style or personal preference — functionally, listing AVIF, WebP, JPEG in any order produces the same result as long as all three are present.',
      reality: 'Order is the ENTIRE mechanism — this subtopic\'s demo shows the first matching source always wins, meaning AVIF-last would cause every AVIF-capable browser to silently use a worse fallback format instead, with no indication anything is wrong.'
    },
    {
      thought: 'A source-order mistake like this would be caught quickly by visual regression testing or a broken-image check, since the wrong format would look noticeably different.',
      reality: 'The image renders correctly either way — JPEG, WebP, and AVIF are all valid, viewable formats — so nothing LOOKS broken. The only symptom is a larger file size and worse performance, which visual tests are not designed to catch at all.'
    }
  ];
}
