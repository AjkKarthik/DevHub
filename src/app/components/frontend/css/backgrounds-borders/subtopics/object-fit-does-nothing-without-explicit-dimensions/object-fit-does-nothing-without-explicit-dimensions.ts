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
  templateUrl: './object-fit-does-nothing-without-explicit-dimensions.html',
  styleUrl: './object-fit-does-nothing-without-explicit-dimensions.scss'
})
export class ObjectFitDoesNothingWithoutExplicitDimensionsSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'object-fit only controls how an image is cropped or stretched WITHIN a box the element already has — it never creates that box for you',
      points: [
        '<code>object-fit</code> tells the browser how to fit the image\'s intrinsic content into the element\'s own content box — <code>cover</code> crops to fill it, <code>contain</code> letterboxes to fit inside it, <code>fill</code> stretches to match it exactly.',
        'If the <code>&lt;img&gt;</code> has no explicit <code>width</code>/<code>height</code> (via CSS or attributes), its content box IS its intrinsic size — so there is no gap between "the box" and "the image" for object-fit to reconcile. The image simply renders at its natural dimensions, and object-fit has nothing to do.',
      ]
    },
    {
      heading: 'This is directly measurable: the same image, same object-fit: cover, renders at its raw intrinsic size with no sizing, but at the exact box size once width/height are set',
      points: [
        'An image with only <code>object-fit: cover</code> and no sizing renders at its <code>naturalWidth</code>/<code>naturalHeight</code> — identical to an <code>&lt;img&gt;</code> with no object-fit at all.',
        'The same image with <code>width: 100px; height: 50px</code> added renders at exactly 100×50, with the intrinsic content cropped to fill that box — object-fit only becomes observable once an explicit box exists to fit into.',
      ]
    }
  ];

  liveDemoFiles: PlaygroundFile[] = [
    {
      path: 'index.html',
      content: `<!doctype html>
<html>
  <head>
    <title>object-fit does nothing without explicit dimensions</title>
    <style>
      #noSize { object-fit: cover; }
      #withSize { object-fit: cover; width: 100px; height: 50px; }
    </style>
  </head>
  <body>
    <p>Open the browser console (or the StackBlitz Console tab) to see output.</p>
    <img id="noSize" src="data:image/gif;base64,R0lGODlhAgABAPAAAP8AAAAAACH5BAEAAAAALAAAAAACAAEAAAICBAoAOw==" alt="">
    <img id="withSize" src="data:image/gif;base64,R0lGODlhAgABAPAAAP8AAAAAACH5BAEAAAAALAAAAAACAAEAAAICBAoAOw==" alt="">
    <script type="module" src="index.ts"></script>
  </body>
</html>
`,
    },
    {
      path: 'index.ts',
      content: `function report(id: string) {
  const img = document.querySelector<HTMLImageElement>('#' + id)!;
  const rect = img.getBoundingClientRect();
  console.log(\`\${id} — rendered: \${rect.width}x\${rect.height}, intrinsic: \${img.naturalWidth}x\${img.naturalHeight}\`);
  return rect;
}

const noSizeRect = report('noSize');
const withSizeRect = report('withSize');

console.log('no explicit dimensions — object-fit did nothing, rendered size matches intrinsic size:', noSizeRect.width === 2 && noSizeRect.height === 1);
console.log('explicit 100x50 dimensions — object-fit now actively resizes/crops the image:', withSizeRect.width === 100 && withSizeRect.height === 50);
`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A gallery thumbnail has <code>object-fit: cover;</code> in its CSS, but the designer forgot to give it a fixed width/height — the CSS only sets a max-width for the whole gallery grid. Will the thumbnail crop to a uniform square like the design calls for?',
    hint: 'Ask whether the image element actually has an explicit content box for object-fit to fit content into, or whether its box is still just its own intrinsic size.',
    solution: 'No — without an explicit width and height on the &lt;img&gt; itself, its box is its own intrinsic (natural) size, so there is nothing for object-fit to crop into. Each thumbnail renders at its own original aspect ratio and size instead of a uniform cropped square. Fixing it requires setting explicit width/height (or a fixed aspect-ratio) on the image element itself.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'object-fit: cover automatically makes an image fill and crop to whatever container it happens to be inside.',
      reality: 'object-fit only affects how the image fits its OWN box — not a surrounding container. If the image element itself has no explicit width/height, its own box is just its intrinsic size, and cover has nothing to crop.'
    },
    {
      thought: 'Setting object-fit on an <code>&lt;img&gt;</code> is enough on its own to get consistent, cropped thumbnail sizing in a gallery grid.',
      reality: 'object-fit is only half the recipe — it needs an explicit width and height (or aspect-ratio) on the image element itself to have any box to fit content into. Without that, every thumbnail just renders at its own natural size, uncropped.'
    },
    {
      thought: 'A parent container with a fixed width/height should be enough to constrain an object-fit image inside it, similar to how overflow: hidden works on a parent.',
      reality: 'object-fit only looks at the sizing of the element it\'s applied to, not any ancestor. A percentage-based width/height on the image itself (e.g. width: 100%; height: 100%;) would work, since that resolves to an explicit box — but the parent\'s own size alone does nothing unless the image inherits it.'
    }
  ];
}
