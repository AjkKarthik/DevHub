import { Component } from '@angular/core';
import { SubtopicEyebrowComponent } from '../../../../../../components/shared/subtopic-eyebrow/subtopic-eyebrow';
import { PageMetaComponent } from '../../../../../../components/shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../../components/shared/theory-block/theory-block';
import { LivePlaygroundComponent, PlaygroundFile } from '../../../../../../components/shared/live-playground/live-playground';
import { TryItComponent, TryItExercise } from '../../../../../../components/shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../../components/shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../../components/shared/subtopic-nav/subtopic-nav';

@Component({
  selector: 'app-og-image-dimensions-are-checkable-live-via-the-image-api',
  standalone: true,
  imports: [
    SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent,
    LivePlaygroundComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent
  ],
  templateUrl: './og-image-dimensions-are-checkable-live-via-the-image-api.html',
  styleUrl: './og-image-dimensions-are-checkable-live-via-the-image-api.scss'
})
export class OgImageDimensionsAreCheckableLiveViaTheImageApiSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'og:image is just a URL string — nothing validates its real dimensions automatically',
      points: [
        'The main page\'s Common Mistake and Quiz both center on a specific numeric threshold: "Facebook and other platforms require a minimum image size (usually 1200x630) for full-size previews" and the recommended minimum is exactly "1200x630 px." Writing <code>&lt;meta property="og:image" content="..."&gt;</code> is purely a string assignment — nothing about the HTML itself checks whether that URL actually points to an image meeting the threshold.',
        'This means a genuinely too-small og:image is a completely silent failure at write time: the meta tag is valid HTML, the page renders fine, and the mistake is only ever discovered when a platform like Facebook actually fetches the image and falls back to a small inline thumbnail instead of a full preview card.',
      ]
    },
    {
      heading: 'The real image dimensions ARE directly checkable — by actually loading it',
      points: [
        'The browser\'s own <code>Image</code> constructor (or an <code>&lt;img&gt;</code> element) can fetch the exact URL named in <code>og:image</code> and report its real, actual pixel dimensions via <code>naturalWidth</code>/<code>naturalHeight</code> once loaded — the same real data a social platform\'s own crawler would see.',
        'This turns "is our og:image big enough" from a manual, external-tool-dependent check (Facebook Sharing Debugger, Twitter Card Validator) into something directly scriptable: read the meta tag\'s <code>content</code> attribute, load it as a real image, and compare its actual dimensions against the 1200×630 threshold.',
      ]
    },
  ];

  liveDemoFiles: PlaygroundFile[] = [
    {
      path: 'index.html',
      content: `<!doctype html>
<html>
  <head>
    <title>og:image dimension check</title>
    <meta property="og:image" content="https://picsum.photos/id/1041/400/300">
  </head>
  <body>
    <p>Checking whether this page's actual og:image meets the 1200×630 recommended minimum…</p>
    <pre id="output" style="background:#111;color:#0f0;padding:1rem;white-space:pre-wrap;"></pre>
    <script type="module" src="index.ts"></script>
  </body>
</html>
`,
    },
    {
      path: 'index.ts',
      content: `const output = document.getElementById('output')!;

const MIN_WIDTH = 1200;
const MIN_HEIGHT = 630;

const ogImageMeta = document.querySelector('meta[property="og:image"]') as HTMLMetaElement;
const ogImageUrl = ogImageMeta.content;

const img = new Image();
img.onload = () => {
  const meetsMinimum = img.naturalWidth >= MIN_WIDTH && img.naturalHeight >= MIN_HEIGHT;

  output.textContent =
    \`og:image content attribute: "\${ogImageUrl}"\\n\\n\` +
    \`Actual loaded image dimensions: \${img.naturalWidth}×\${img.naturalHeight}px\\n\` +
    \`Recommended minimum:            \${MIN_WIDTH}×\${MIN_HEIGHT}px\\n\\n\` +
    (meetsMinimum
      ? 'MEETS the minimum — platforms should render this as a full-size preview card.'
      : 'DOES NOT meet the minimum — platforms will likely fall back to a small inline\\nthumbnail instead of a full-width preview card, exactly the failure mode the\\nmain page\\'s "OG Image Too Small" mistake describes.') +
    '\\n\\nNothing about writing the meta tag itself catches this — it only becomes\\n' +
    'visible by actually loading the real image and checking its real dimensions,\\n' +
    'exactly as done here.';
};
img.onerror = () => {
  output.textContent = 'Could not load the og:image URL in this sandbox — the underlying check (load the real URL, compare naturalWidth/naturalHeight against 1200×630) is the same in a real deployment.';
};
img.src = ogImageUrl;
`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'The <code>og:image</code> meta tag above points to a 400×300 image — well below the 1200×630 recommended minimum. Predict: does anything about writing this meta tag itself (an invalid size, a broken URL, anything) get flagged by the browser at parse time?',
    hint: '<code>&lt;meta property="og:image" content="...">&lt;/code&gt; is just a string attribute — the browser has no built-in concept of "og:image" as a special, validated field the way it might validate an <code>&lt;input type="email"&gt;</code>.',
    solution: `Nothing is flagged — meta tags with arbitrary property/content values are always valid HTML,
regardless of what the content string actually points to or whether that resource even exists. The
browser has no special awareness of Open Graph semantics; og:image is purely a convention that
external platforms choose to read and interpret. The only way to catch a too-small image is exactly
what the demo does: actually fetch the URL and inspect the real, loaded dimensions.`
  };

  misconceptions: Misconception[] = [
    {
      thought: 'Since og:image is a well-known, standardized meta property, browsers or HTML validators check that it points to an appropriately-sized image.',
      reality: 'No such validation exists anywhere in HTML or in typical validators — og:image is purely a string convention that social platforms choose to interpret; nothing enforces size requirements at the markup level.'
    },
    {
      thought: 'The only reliable way to check an og:image\'s real dimensions is to use an external tool like the Facebook Sharing Debugger.',
      reality: 'The exact same check is directly scriptable with the plain Image API — load the URL, read naturalWidth/naturalHeight once it loads, and compare against the known threshold, with no external service involved.'
    },
    {
      thought: 'A too-small og:image causes the social share to fail outright or show a broken image icon.',
      reality: 'The image typically still displays — just as a smaller, less prominent inline thumbnail rather than the intended full-width preview card. The failure mode is a downgrade in presentation, not an outright break.'
    },
  ];
}
