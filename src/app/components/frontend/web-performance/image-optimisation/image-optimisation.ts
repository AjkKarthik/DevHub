import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { QuickRefComponent, QuickRefItem }         from '../../../shared/quick-ref/quick-ref';
import { TheoryBlockComponent, TheoryPoint }       from '../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab }             from '../../../shared/code-block/code-block';
import { CommonMistakesComponent, CommonMistake }  from '../../../shared/common-mistakes/common-mistakes';
import { ChallengeBlockComponent, Challenge }      from '../../../shared/challenge-block/challenge-block';
import { QuizBlockComponent, QuizQuestion }        from '../../../shared/quiz-block/quiz-block';
import { QnaBlockComponent, QnaItem }              from '../../../shared/qna-block/qna-block';
import { RevisionCardComponent, RevisionSummary }  from '../../../shared/revision-card/revision-card';
import { PageMetaComponent }                       from '../../../shared/page-meta/page-meta';
import { PageCompleteComponent }                   from '../../../shared/page-complete/page-complete';

@Component({
  selector: 'app-perf-image-optimisation',
  standalone: true,
  imports: [CommonModule, QuickRefComponent, TheoryBlockComponent, CodeBlockComponent,
    CommonMistakesComponent, ChallengeBlockComponent, QuizBlockComponent,
    QnaBlockComponent, RevisionCardComponent, PageMetaComponent, PageCompleteComponent],
  templateUrl: './image-optimisation.html',
  styleUrl: './image-optimisation.scss',
})
export class PerfImageOptimisation {

  quickRef: QuickRefItem[] = [
    { name: 'AVIF',               type: 'keyword', desc: 'AV1 Image Format — ~50% smaller than JPEG, ~20% smaller than WebP; Chrome 85+, Firefox 93+, Safari 16+' },
    { name: 'WebP',               type: 'keyword', desc: 'Google\'s format — ~30% smaller than JPEG with similar quality; supported by all modern browsers' },
    { name: 'srcset',             type: 'syntax',  desc: 'Comma-separated list of image candidates with width descriptors — browser picks best for device DPR and viewport' },
    { name: 'sizes',              type: 'syntax',  desc: 'Tells browser how wide the image will be rendered — critical for srcset to pick the right candidate' },
    { name: 'loading="lazy"',     type: 'syntax',  desc: 'Native browser lazy-loading — defers off-screen images until near viewport; never use on LCP image' },
    { name: 'fetchpriority="high"', type: 'syntax', desc: 'Boost LCP image above other images of same type — combine with preload for max effect' },
    { name: 'decoding="async"',   type: 'syntax',  desc: 'Browser decodes image off main thread — use on all non-LCP images' },
    { name: 'object-fit',         type: 'syntax',  desc: 'CSS: control how image fills container without distortion (cover, contain, fill)' },
  ];

  theory: TheoryPoint[] = [
    {
      heading: 'Image format hierarchy — AVIF → WebP → JPEG/PNG',
      points: [
        'AVIF: best compression (~50% smaller than JPEG, ~20% smaller than WebP), but slower to encode; use for hero images and key product images.',
        'WebP: excellent compression (~30% smaller than JPEG), fast encode, widely supported — good fallback for AVIF.',
        'JPEG: best for complex photos when AVIF/WebP not supported (use as <picture> fallback).',
        'PNG: only for images needing transparency without WebP/AVIF support; otherwise use WebP.',
        'SVG: for logos, icons, illustrations — infinitely scalable, tiny file size; never rasterise vector art.',
        'Use <picture> with multiple <source> elements to serve AVIF → WebP → JPEG in order.',
      ],
    },
    {
      heading: 'srcset and sizes — responsive images',
      points: [
        'srcset="img-400.webp 400w, img-800.webp 800w, img-1200.webp 1200w" gives candidates with pixel widths.',
        'sizes="(max-width: 768px) 100vw, 50vw" tells the browser how wide the image renders — essential for choosing the right srcset candidate.',
        'Without sizes the browser assumes 100vw and fetches the largest candidate on wide monitors — wastes bandwidth.',
        'DPR awareness: on a 2× Retina screen with a 400px container, the browser selects the 800w candidate.',
        'Use the <picture> element to combine srcset with format fallbacks (AVIF → WebP → JPEG).',
      ],
    },
    {
      heading: 'loading="lazy" and LCP',
      points: [
        'loading="lazy" defers image requests until the image is near the viewport — native, no JS needed.',
        'NEVER apply loading="lazy" to the LCP image — it delays the most important paint.',
        'Apply decoding="async" to all non-LCP images — the browser decodes them off the main thread.',
        'Apply fetchpriority="high" to the LCP image — boosts it above other images in the browser\'s priority queue.',
        'Combine with <link rel="preload"> for LCP images below the fold of the initial HTML (late discovery).',
      ],
    },
    {
      heading: 'Image dimensions and CLS',
      points: [
        'Always set width and height attributes on <img> — the browser reserves space before the image loads, preventing CLS.',
        'Responsive pattern: set explicit width/height for aspect-ratio hint, then override with CSS width: 100%; height: auto.',
        'aspect-ratio CSS property: alternative to explicit dimensions — aspect-ratio: 16/9 reserves proportional space.',
        'Omitting dimensions is the #1 cause of high CLS — even one missing pair on a large image can cause poor CLS.',
      ],
    },
    {
      heading: 'Compression and tooling',
      points: [
        'Squoosh (web.dev/squoosh): browser-based AVIF/WebP encoder — best for manual optimisation of hero images.',
        'sharp (Node.js): high-performance image processing — use in build pipelines to generate srcset variants.',
        'imagemin: webpack/Vite plugin ecosystem for automated compression (imagemin-webp, imagemin-avif).',
        'Cloudinary/Imgix/Vercel Image Optimization: CDN-level format conversion and resizing via URL params.',
        'Target: JPEG < 100 KB for typical content images; hero images < 200 KB; thumbnails < 20 KB.',
      ],
    },
    {
      heading: 'CSS background images and LCP',
      points: [
        'CSS background-image is discovered after the stylesheet downloads and applies — later than <img> in the HTML.',
        'If a background image is the LCP element, preload it explicitly: <link rel="preload" as="image" href="hero.avif">.',
        'background-image cannot use srcset — use image-set() for responsive backgrounds (limited browser support).',
        'For hero backgrounds: prefer <img> in HTML over CSS background-image for better LCP and SEO.',
        'background-size: cover + object-fit: cover on a positioned <img> achieve the same effect as background-image with better performance.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Responsive image with format fallback',
      language: 'html',
      code: `<!-- Full responsive image setup: format fallback + srcset + lazy/eager -->

<!-- LCP hero image: eager + fetchpriority + preloaded, no lazy -->
<picture>
  <source
    type="image/avif"
    srcset="/hero-400.avif 400w, /hero-800.avif 800w, /hero-1200.avif 1200w"
    sizes="(max-width: 768px) 100vw, 1200px" />
  <source
    type="image/webp"
    srcset="/hero-400.webp 400w, /hero-800.webp 800w, /hero-1200.webp 1200w"
    sizes="(max-width: 768px) 100vw, 1200px" />
  <img
    src="/hero-1200.jpg"
    alt="Hero image"
    width="1200" height="630"
    fetchpriority="high"
    decoding="sync"
    style="width:100%;height:auto" />
</picture>

<!-- Below-fold content image: lazy + async decode -->
<picture>
  <source type="image/avif" srcset="/product-400.avif 400w, /product-800.avif 800w"
          sizes="(max-width: 640px) 100vw, 400px" />
  <source type="image/webp" srcset="/product-400.webp 400w, /product-800.webp 800w"
          sizes="(max-width: 640px) 100vw, 400px" />
  <img src="/product-400.jpg" alt="Product" width="400" height="300"
       loading="lazy" decoding="async" style="width:100%;height:auto" />
</picture>`,
    },
    {
      label: 'Generate srcset variants (sharp)',
      language: 'typescript',
      code: `import sharp from 'sharp';
import path from 'path';

const WIDTHS  = [400, 800, 1200, 1600];
const FORMATS = ['avif', 'webp', 'jpeg'] as const;

async function generateSrcset(inputPath: string, outputDir: string) {
  const name = path.basename(inputPath, path.extname(inputPath));

  for (const format of FORMATS) {
    for (const width of WIDTHS) {
      const outFile = path.join(outputDir, \`\${name}-\${width}.\${format}\`);

      await sharp(inputPath)
        .resize(width)
        [format]({
          quality: format === 'avif' ? 60 : format === 'webp' ? 75 : 80,
          effort:  format === 'avif' ? 4 : undefined,  // 0-9; higher = better compression, slower
        })
        .toFile(outFile);

      console.log('Generated:', outFile);
    }
  }
}

// Usage
await generateSrcset('./src/hero.jpg', './dist/images');

// Output: hero-400.avif, hero-400.webp, hero-400.jpeg, hero-800.avif ...
// Then reference in HTML:
// srcset="hero-400.avif 400w, hero-800.avif 800w" etc.`,
    },
    {
      label: 'Vite image optimisation plugin',
      language: 'typescript',
      code: `// vite.config.ts — auto-optimise images at build time
import { defineConfig } from 'vite';
import { imagetools } from 'vite-imagetools';   // npm i -D vite-imagetools

export default defineConfig({
  plugins: [
    imagetools({
      defaultDirectives: new URLSearchParams([
        ['format', 'avif;webp;jpeg'],   // generate all three formats
        ['quality', '80'],
      ]),
    }),
  ],
});

// In HTML/JS — import generates srcset string automatically:
// import heroSrcset from './hero.jpg?w=400;800;1200&format=avif;webp&as=srcset';
// <img srcset={heroSrcset} sizes="100vw" />

// Cloudinary URL-based optimisation (no build step needed):
// https://res.cloudinary.com/demo/image/upload/f_auto,q_auto,w_800/hero.jpg
// f_auto: best format for browser (AVIF/WebP/JPEG)
// q_auto: automatic quality
// w_800: resize to 800px`,
    },
    {
      label: 'image-set() for CSS backgrounds',
      language: 'css',
      code: `/* CSS image-set() — responsive background images */
.hero {
  background-image:
    image-set(
      url('/hero.avif') type('image/avif'),   /* best quality */
      url('/hero.webp') type('image/webp'),   /* fallback */
      url('/hero.jpg')  1x                    /* universal fallback */
    );
  background-size: cover;
  background-position: center;
}

/* DPR-aware background with srcset-style descriptors */
.icon {
  background-image: image-set(
    url('/icon.png')   1x,
    url('/icon@2x.png') 2x
  );
}

/* Prefer <img> over background-image for LCP elements:
   - Parser discovers <img> earlier (no CSS download required first)
   - Can use loading, fetchpriority, decoding, srcset attributes
   - Better SEO (alt text), accessibility, and LCP scoring */

/* If you must use background-image for LCP, preload it: */
/* <link rel="preload" as="image" href="/hero.avif" /> */`,
    },
  ];

  mistakes: CommonMistake[] = [
    {
      title: 'Using loading="lazy" on the LCP image',
      wrong: `<!-- Hero image is LCP — lazy-loading it delays the most important paint -->
<img src="hero.webp" alt="Hero" loading="lazy" />`,
      right: `<!-- LCP image: eager (default) + fetchpriority high -->
<img src="hero.webp" alt="Hero" fetchpriority="high" decoding="sync" />`,
      explanation: 'loading="lazy" defers the image request until the browser determines it is near the viewport — this can add hundreds of milliseconds to LCP. The LCP image should always be fetched eagerly, ideally with a preload hint.',
    },
    {
      title: 'Missing width and height on images',
      wrong: `<!-- No dimensions → CLS when image loads -->
<img src="product.webp" alt="Product" />`,
      right: `<!-- Set dimensions for aspect-ratio hint, override with CSS -->
<img src="product.webp" alt="Product" width="800" height="600"
     style="width:100%;height:auto" />`,
      explanation: 'Without dimensions the browser cannot reserve space for the image before it loads. When the image arrives it pushes content down — causing CLS. Always set width and height; override with CSS for responsiveness.',
    },
    {
      title: 'Serving JPEG/PNG without format negotiation',
      wrong: `<!-- Serving the same JPEG to all browsers — 500 KB -->
<img src="hero.jpg" alt="Hero" />`,
      right: `<!-- Serve AVIF to Chrome, WebP to older browsers, JPEG as fallback -->
<picture>
  <source type="image/avif" srcset="hero.avif" />
  <source type="image/webp" srcset="hero.webp" />
  <img src="hero.jpg" alt="Hero" />
</picture>`,
      explanation: 'JPEG was the only option in 2010. AVIF is ~50% smaller at the same quality; WebP is ~30% smaller. The <picture> element lets all browsers get the best format they support with a single markup block.',
    },
    {
      title: 'Omitting sizes attribute with srcset',
      wrong: `<!-- No sizes — browser assumes 100vw and picks the largest candidate on desktop -->
<img srcset="img-400.webp 400w, img-800.webp 800w, img-1600.webp 1600w"
     src="img-1600.webp" alt="Gallery" />`,
      right: `<!-- sizes tells browser the rendered width — picks right candidate -->
<img srcset="img-400.webp 400w, img-800.webp 800w, img-1600.webp 1600w"
     sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 400px"
     src="img-800.webp" alt="Gallery" />`,
      explanation: 'Without sizes, the browser assumes the image spans the full viewport width and fetches the largest srcset candidate on wide screens. A 400px thumbnail should have sizes="400px" so the 400w candidate is selected.',
    },
    {
      title: 'Not setting decoding="async" on non-critical images',
      wrong: `<!-- Synchronous decode blocks main thread while decoding -->
<img src="gallery-1.webp" alt="Gallery 1" loading="lazy" />`,
      right: `<!-- Async decode happens off-thread — doesn't block INP -->
<img src="gallery-1.webp" alt="Gallery 1"
     loading="lazy" decoding="async" />`,
      explanation: 'By default browsers decode images synchronously on the main thread, potentially blocking script execution and increasing INP. decoding="async" moves the decode off the main thread. Use decoding="sync" only for the LCP image to ensure it renders as fast as possible.',
    },
    {
      title: 'Using raster images for icons and logos',
      wrong: `<!-- PNG icon — blurry at 2× DPR, large file size -->
<img src="logo.png" alt="Logo" width="200" height="50" />`,
      right: `<!-- SVG icon — sharp at any DPR, typically 3-10× smaller than PNG -->
<img src="logo.svg" alt="Logo" width="200" height="50" />
<!-- Or inline SVG for zero network request and CSS animatability -->`,
      explanation: 'Raster PNG/JPEG logos look blurry on Retina (2×, 3×) screens and require multiple @2x/@3x versions. SVG is resolution-independent, supports CSS styling and animation, and is usually much smaller than a comparable PNG.',
    },
  ];

  challenge: Challenge = {
    title: 'Optimise a product image grid',
    language: 'html',
    description: `The product listing below has five image anti-patterns. Fix all of them:

1. All images served as JPEG — no modern format fallback
2. No srcset — full 1200px image served on mobile
3. Hero product image has loading="lazy" (it's the LCP element)
4. Thumbnails have no width/height — causing CLS
5. No decoding="async" on non-LCP thumbnails`,
    hints: [
      'Wrap each img in <picture> with AVIF and WebP <source> elements',
      'Add srcset with 400w, 800w candidates and sizes="(max-width:640px) 100vw, 33vw"',
      'Remove loading="lazy" from the first product (LCP), add fetchpriority="high"',
      'Add width="400" height="300" to all img tags',
      'Add decoding="async" to thumbnails (not the LCP image)',
    ],
    starterCode: `<!-- Product listing — fix the 5 issues -->
<section class="product-grid">
  <!-- Issue 3: LCP image has lazy loading -->
  <img src="/products/featured-1200.jpg" alt="Featured Product"
       loading="lazy" />

  <!-- Issues 1, 2, 4, 5: thumbnails with JPEG, no srcset, no dims, no async -->
  <img src="/products/thumb-a-1200.jpg" alt="Product A" />
  <img src="/products/thumb-b-1200.jpg" alt="Product B" />
  <img src="/products/thumb-c-1200.jpg" alt="Product C" />
</section>`,
    solution: `<section class="product-grid">
  <!-- Fix 3: LCP image — no lazy, high priority, sync decode -->
  <picture>
    <source type="image/avif"
            srcset="/products/featured-400.avif 400w, /products/featured-800.avif 800w, /products/featured-1200.avif 1200w"
            sizes="(max-width:768px) 100vw, 1200px" />
    <source type="image/webp"
            srcset="/products/featured-400.webp 400w, /products/featured-800.webp 800w, /products/featured-1200.webp 1200w"
            sizes="(max-width:768px) 100vw, 1200px" />
    <img src="/products/featured-1200.jpg" alt="Featured Product"
         width="1200" height="800"
         fetchpriority="high" decoding="sync"
         style="width:100%;height:auto" />
  </picture>

  <!-- Fix 1+2+4+5: thumbnails with AVIF/WebP, srcset, dims, async decode -->
  <picture>
    <source type="image/avif"
            srcset="/products/thumb-a-400.avif 400w, /products/thumb-a-800.avif 800w"
            sizes="(max-width:640px) 100vw, 33vw" />
    <source type="image/webp"
            srcset="/products/thumb-a-400.webp 400w, /products/thumb-a-800.webp 800w"
            sizes="(max-width:640px) 100vw, 33vw" />
    <img src="/products/thumb-a-400.jpg" alt="Product A"
         width="400" height="300" loading="lazy" decoding="async"
         style="width:100%;height:auto" />
  </picture>

  <!-- Repeat <picture> pattern for B and C thumbnails -->
</section>`,
  };

  quiz: QuizQuestion[] = [
    {
      q: 'What is the recommended image format hierarchy for web images?',
      options: [
        'JPEG → WebP → AVIF (oldest first)',
        'PNG → WebP → AVIF (transparency first)',
        'AVIF → WebP → JPEG (best compression first)',
        'GIF → PNG → JPEG (legacy first)',
      ],
      answer: 2,
      explanation: 'AVIF offers the best compression (~50% smaller than JPEG). Serve it first in <picture>, with WebP as fallback for browsers without AVIF support, and JPEG/PNG as the universal fallback.',
    },
    {
      q: 'Which attribute tells the browser how wide an image will be rendered — crucial for srcset selection?',
      options: ['width', 'srcset', 'sizes', 'decoding'],
      answer: 2,
      explanation: 'sizes describes the rendered width of the image (e.g. "100vw" or "(max-width:768px) 100vw, 50vw"). Without it, the browser assumes 100vw and may download a much larger image than necessary.',
    },
    {
      q: 'Which combination is correct for the LCP image?',
      options: [
        'loading="lazy" decoding="async"',
        'fetchpriority="high" decoding="sync"',
        'loading="eager" decoding="async" fetchpriority="low"',
        'loading="lazy" fetchpriority="high"',
      ],
      answer: 1,
      explanation: 'The LCP image should use fetchpriority="high" to boost its priority above other images, and decoding="sync" so it is decoded immediately on the main thread for the fastest first paint. Never lazy-load the LCP image.',
    },
    {
      q: 'Why should you prefer <img> over CSS background-image for hero images?',
      options: [
        'background-image doesn\'t support AVIF format',
        '<img> supports srcset, loading, fetchpriority, and is discovered earlier by the parser',
        'background-image always loads at full resolution ignoring DPR',
        '<img> is faster because it bypasses the CSSOM',
      ],
      answer: 1,
      explanation: '<img> is discovered during HTML parsing before CSS is fully processed. It supports srcset (responsive), loading (lazy), fetchpriority, and decoding attributes. CSS background-image is discovered only after the stylesheet downloads and matches — adding latency for LCP.',
    },
    {
      q: 'What does decoding="async" do?',
      options: [
        'Delays image loading until the page is idle',
        'Fetches the image over an async HTTP/2 stream',
        'Moves image decoding off the main thread to avoid blocking script execution',
        'Enables progressive JPEG-style rendering',
      ],
      answer: 2,
      explanation: 'Image decoding (converting compressed bytes to raw pixels) normally happens on the main thread and can block script execution, increasing INP. decoding="async" tells the browser to decode off the main thread. Use decoding="sync" only for the LCP image.',
    },
    {
      q: 'What is the key difference between WebP and AVIF image formats?',
      options: ['WebP has wider browser support; AVIF has better compression ratios at the same visual quality', 'AVIF is a Google format; WebP is Apple\'s format', 'WebP supports animation; AVIF does not', 'AVIF is only for video, not static images'],
      answer: 0,
      explanation: 'AVIF offers 30–50% smaller files than WebP at the same visual quality — but it has slightly less browser support (no IE, limited old Safari). WebP is supported in all modern browsers and is the safe default. Use <picture> with <source type="image/avif"> first and <img src=".webp"> as fallback to serve AVIF where supported and WebP elsewhere.',
    },
  ];

  qna: QnaItem[] = [
    {
      q: 'How do I convert existing JPEG images to AVIF and WebP at scale?',
      a: 'Use sharp in a Node.js build script, or imagemin with imagemin-avif and imagemin-webp plugins. For a CMS or CDN approach, Cloudinary (f_auto), Imgix, or Vercel Image Optimization convert on the fly via URL parameters — no build step needed. For manual one-off conversions, Squoosh (squoosh.app) is an excellent browser-based tool.',
    },
    {
      q: 'What is the right quality setting for AVIF and WebP?',
      a: 'Generally: AVIF quality 55–65 (0–100 scale, higher = better quality) and WebP quality 75–85 produce results visually indistinguishable from JPEG quality 85–90 at roughly half the file size. Run visual comparisons with Squoosh to find the minimum quality where artefacts become invisible for your specific images.',
    },
    {
      q: 'Should I use loading="lazy" for all images below the fold?',
      a: 'Yes, with two exceptions: the LCP image (never lazy-load it) and images that appear within ~300px of the initial viewport (they\'re about to be visible — lazy-loading adds unnecessary delay). For all other images, loading="lazy" is safe and significantly reduces data usage for users who don\'t scroll.',
    },
    {
      q: 'How does the browser choose between srcset candidates?',
      a: 'The browser multiplies the value from sizes (the rendered width in CSS pixels) by the device pixel ratio (DPR) to get the required pixel width, then picks the smallest srcset candidate that meets or exceeds that requirement. On a 2× DPR screen with sizes="400px", the 800w candidate is chosen. The browser may also consider available bandwidth.',
    },
    {
      q: 'Are there any downsides to AVIF?',
      a: 'AVIF\'s main downsides: (1) encoding is significantly slower than WebP/JPEG — generating AVIF variants at build time adds minutes to large image pipelines; (2) older browsers (pre-2021) don\'t support it — always provide a WebP or JPEG fallback in <picture>; (3) Safari only added full AVIF support in iOS 16 / macOS Ventura (2022).',
    },
    {
      q: 'When should you use AVIF over WebP, and what are the tradeoffs?',
      a: 'AVIF typically produces 20-30% smaller files than WebP at equivalent visual quality, especially for photographic content, and supports higher dynamic range and better gradients with less banding. The tradeoffs: AVIF encoding is significantly slower (impacts build/CI time for static generation), and browser support, while now broad in modern Chrome/Firefox/Safari, still lags WebP in some embedded/older contexts. Practical approach: use a <picture> element with AVIF as the first source, WebP as fallback, and JPEG/PNG as the final fallback — letting the browser pick the best format it supports rather than forcing a single format choice.',
    },
  ];

  revision: RevisionSummary = {
    oneLiner: 'Serve AVIF → WebP → JPEG via <picture>, use srcset + sizes for responsive loading, never lazy-load the LCP image, always set explicit dimensions.',
    mustKnow: [
      'Format order: AVIF (~50% smaller than JPEG) → WebP (~30% smaller) → JPEG fallback',
      'srcset gives candidates; sizes tells the browser the rendered width — both are needed',
      'LCP image: fetchpriority="high" + decoding="sync", NEVER loading="lazy"',
      'All other images: loading="lazy" + decoding="async"',
      'Always set width + height to prevent CLS; override with CSS width:100%;height:auto',
      'SVG for logos/icons — scalable, tiny, Retina-perfect',
    ],
    interviewFocus: [
      'What is the difference between AVIF, WebP, and JPEG? When do you use each?',
      'How does srcset work? What does the sizes attribute add?',
      'Why should the LCP image never have loading="lazy"?',
      'What attributes cause CLS if omitted from an <img> tag?',
    ],
  };
}
