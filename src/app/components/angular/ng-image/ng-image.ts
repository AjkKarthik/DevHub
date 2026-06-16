import { Component } from '@angular/core';
import { NgOptimizedImage } from '@angular/common';
import { CodeBlockComponent, CodeTab } from '../../shared/code-block/code-block';
import { TheoryBlockComponent, TheoryPoint } from '../../shared/theory-block/theory-block';
import { QnaBlockComponent, QnaItem } from '../../shared/qna-block/qna-block';
import { QuizBlockComponent, QuizQuestion } from '../../shared/quiz-block/quiz-block';
import { ChallengeBlockComponent, Challenge } from '../../shared/challenge-block/challenge-block';
import { QuickRefComponent, QuickRefItem } from '../../shared/quick-ref/quick-ref';
import { BeforeAfterComponent, BeforeAfterExample } from '../../shared/before-after/before-after';
import { CommonMistakesComponent, CommonMistake } from '../../shared/common-mistakes/common-mistakes';
import { PageMetaComponent } from '../../shared/page-meta/page-meta';
import { PageCompleteComponent } from '../../shared/page-complete/page-complete';
import { RevisionCardComponent, RevisionSummary } from '../../shared/revision-card/revision-card';

@Component({
  selector: 'app-ng-image',
  imports: [
    NgOptimizedImage, CodeBlockComponent, TheoryBlockComponent, QnaBlockComponent,
    QuizBlockComponent, ChallengeBlockComponent, QuickRefComponent, BeforeAfterComponent,
    CommonMistakesComponent, PageMetaComponent, PageCompleteComponent, RevisionCardComponent,
  ],
  templateUrl: './ng-image.html',
  styleUrl: './ng-image.scss',
})
export class NgImageDemo {
  theory: TheoryPoint[] = [
    {
      heading: 'What NgOptimizedImage is and why it exists',
      points: [
        'NgOptimizedImage is a built-in Angular directive (stable since Angular 15) that replaces the native <code>&lt;img src="..."&gt;</code> with <code>&lt;img ngSrc="..."&gt;</code>. It wraps the native image element and adds automatic performance optimisations with zero extra bundle cost beyond the directive itself.',
        'The core problem it solves is <strong>Cumulative Layout Shift (CLS)</strong> — when images load and push surrounding content down. By requiring explicit <code>width</code> and <code>height</code> attributes at build time, the browser can reserve the correct space before the image loads, keeping the layout stable.',
        'For non-priority images, NgOptimizedImage automatically adds <code>loading="lazy"</code>, so images below the fold are not fetched until the user scrolls toward them. This reduces initial page payload and speeds up Time to Interactive. You never need to add <code>loading="lazy"</code> manually when using <code>ngSrc</code>.',
        'For the LCP (Largest Contentful Paint) image — usually the hero — add the <code>priority</code> boolean attribute. This sets <code>fetchpriority="high"</code> on the image element AND injects a <code>&lt;link rel="preload"&gt;</code> into the document <code>&lt;head&gt;</code>. The browser starts downloading the image as early as possible, directly improving the LCP score.',
        'NgOptimizedImage is a standalone directive in <code>@angular/common</code> — import it like any other standalone import: <code>imports: [NgOptimizedImage]</code> in the component. It does NOT need to be in an NgModule unless you are still using module-based components.',
      ],
    },
    {
      heading: 'CDN image loaders — automatic URL generation',
      points: [
        'An image loader is a function that accepts <code>{ src, width }</code> and returns a full CDN URL string. When a loader is configured, you pass just the image identifier to <code>ngSrc</code> (e.g. <code>ngSrc="photo.jpg"</code>) and Angular builds the full URL with the right width parameter for each srcset breakpoint automatically.',
        'Built-in loaders: <code>provideCloudinaryLoader(\'https://res.cloudinary.com/my-cloud\')</code>, <code>provideImgixLoader(\'https://my-site.imgix.net\')</code>, <code>provideImageKitLoader(\'https://ik.imagekit.io/my-id\')</code>. Register them in <code>app.config.ts</code> inside the <code>providers</code> array.',
        'Custom loader: provide the <code>IMAGE_LOADER</code> token with a <code>useValue</code> function. The function receives an <code>ImageLoaderConfig</code> object and must return a string URL. Example: <code>useValue: (c: ImageLoaderConfig) => `https://cdn.example.com/\${c.src}?w=\${c.width}`</code>.',
        'Without any loader, NgOptimizedImage uses the raw <code>ngSrc</code> value as the URL. You lose automatic resizing and CDN URL generation, but still get lazy loading enforcement, width/height validation, and the priority preload behaviour.',
        'Loaders also power LQIP (Low-Quality Image Placeholder) patterns — if you set <code>[loaderParams]="{ blur: true }"</code> on an image, a custom loader can generate a tiny blurred placeholder URL and swap it with the full-resolution image once loaded.',
      ],
    },
    {
      heading: 'priority and LCP optimisation',
      points: [
        'The <code>priority</code> attribute does two things simultaneously: it sets <code>fetchpriority="high"</code> on the image element (telling the browser to treat this download as high priority) AND injects a <code>&lt;link rel="preload" as="image"&gt;</code> in the <code>&lt;head&gt;</code> via a Transfer State hook so the browser discovers the image without waiting for HTML parsing to reach the <code>&lt;img&gt;</code> element.',
        'Use <code>priority</code> on exactly <strong>one</strong> image per page — the element that will be the LCP. That is typically the above-the-fold hero image or the first product photo in an e-commerce listing. Using it on multiple images wastes preload slots and can compete with other critical resources.',
        'NgOptimizedImage logs a build-time warning if it detects a large image without <code>priority</code> above the fold. This heuristic does not replace judgment — if your hero image is served from a CDN with edge caching, it may load fast enough without priority; but on uncached first loads, priority makes a measurable CWV difference.',
        'For SSR applications, the preload link is injected server-side so it appears in the HTML sent to the client. This is significantly more effective than client-side-only preload hints because the browser can start fetching before any JavaScript executes.',
        'The <code>priority</code> attribute implicitly disables lazy loading on that image. You should never write both <code>priority</code> and <code>loading="lazy"</code> — NgOptimizedImage will warn about this combination.',
      ],
    },
    {
      heading: 'fill mode and responsive srcset',
      points: [
        '<code>fill</code> is a boolean attribute that removes the requirement for explicit <code>width</code> and <code>height</code> inputs. Instead, the image is absolutely positioned to fill its nearest positioned ancestor. The container must have <code>position: relative</code> (or absolute/fixed/sticky) and an explicit height — otherwise the image either overflows the page or collapses to zero height.',
        'Use <code>fill</code> for images whose intrinsic dimensions are unknown or highly variable: hero banners that span the full viewport, card thumbnail images where the card defines the height, or avatar images where the container is a fixed circle. Do not use <code>fill</code> for inline content images where natural aspect ratio must be preserved.',
        '<code>ngSrcset="400w, 800w, 1200w"</code> generates a native <code>srcset</code> attribute with entries at each width. The browser reads the <code>sizes</code> attribute (or defaults to 100vw) and downloads only the breakpoint closest to the actual display width — reducing data transfer on mobile devices by 50–80% compared to always loading the largest image.',
        'The <code>sizes</code> attribute on an <code>ngSrc</code> image works identically to native srcset: <code>sizes="(max-width: 600px) 100vw, 50vw"</code> tells the browser the image occupies full width on mobile and half-width on wider screens. Without <code>sizes</code>, the browser assumes 100vw and may download a larger breakpoint than needed.',
        'When a CDN loader is configured, each width in <code>ngSrcset</code> is passed to the loader function, so the srcset entries become full CDN URLs. Without a loader the srcset entries are the raw <code>ngSrc</code> value — the server must serve the right size when the URL is called without a query parameter.',
      ],
    },
    {
      heading: 'Developer warnings and build-time enforcement',
      points: [
        'NgOptimizedImage emits console warnings (development mode only) for common mistakes: missing <code>width</code>/<code>height</code>, oversized images (intrinsic size much larger than the rendered size), missing <code>priority</code> on what appears to be the LCP image, and <code>priority</code> images that lack a <code>&lt;link rel="preconnect"&gt;</code> to the image CDN domain.',
        'The "oversized image" warning fires when an image is rendered at a size significantly smaller than its intrinsic resolution — e.g. a 2400×1600 image rendered at 400×267. This wastes bandwidth. NgOptimizedImage recommends either using a CDN with resizing or providing a smaller source file.',
        'The "missing preconnect" warning tells you to add <code>&lt;link rel="preconnect" href="https://res.cloudinary.com"&gt;</code> to <code>index.html</code>. Preconnect establishes the TCP connection and TLS handshake early, before the browser even begins fetching images, reducing time-to-first-byte on CDN requests.',
        'All NgOptimizedImage checks are <strong>development-only</strong> — they are stripped from production builds via tree-shaking. The production bundle only includes the optimisation code, not the diagnostic machinery. This means warnings caught in development must be fixed before pushing to production.',
        'The <code>disableOptimizedSrcset</code> input disables automatic srcset generation for a specific image when you need full control over the <code>srcset</code> attribute. Use it sparingly — the default automatic srcset is correct for most use cases.',
      ],
    },
    {
      heading: 'Integration with SSR, placeholders, and advanced patterns',
      points: [
        'In Angular SSR (server-side rendering), NgOptimizedImage injects the <code>&lt;link rel="preload"&gt;</code> for <code>priority</code> images server-side via Angular\'s Transfer State mechanism. This means the preload hint appears in the initial HTML payload — the browser can start fetching the hero image before hydration completes.',
        '<code>placeholder</code> is an optional boolean that shows a tiny blurred placeholder while the full image loads. The placeholder URL is generated by calling the configured loader with a very small width (typically 10–30px). Not all loaders support this natively — Cloudinary and Imgix do via transformation parameters.',
        '<code>loaderParams</code> is an optional object input that passes additional parameters to the loader function: <code>[loaderParams]="{ quality: 80, format: \'webp\' }"</code>. These are available on the <code>ImageLoaderConfig</code> object as <code>config.loaderParams</code>. Use it to pass per-image CDN transformation options.',
        'NgOptimizedImage works with lazy-loaded route modules — the directive is tree-shaken per-component, so routes that do not use images do not pay any overhead. In defer blocks, deferred images must not use <code>priority</code> since they are intentionally loaded later.',
        'For art direction (different images at different breakpoints) use the native <code>&lt;picture&gt;</code> element with <code>&lt;source&gt;</code> elements alongside NgOptimizedImage on the fallback <code>&lt;img&gt;</code> tag. NgOptimizedImage does not replicate the full <code>&lt;picture&gt;</code> API — it focuses on the common case of one image at multiple sizes.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Basic usage',
      language: 'html',
      code: `<!-- 1. Import NgOptimizedImage in the component -->
<!-- imports: [NgOptimizedImage] in the @Component decorator -->

<!-- Standard non-fill image — always include width and height -->
<img ngSrc="/hero.jpg" width="800" height="400" alt="Hero" />

<!-- LCP image: add priority to preload and set fetchpriority="high" -->
<img ngSrc="/hero.jpg" width="800" height="400" alt="Hero" priority />

<!-- Fill mode — fills the container (parent needs position:relative + height) -->
<div style="position:relative; height:300px; overflow:hidden;">
  <img ngSrc="/hero.jpg" fill alt="Hero" style="object-fit:cover;" />
</div>

<!-- Responsive srcset — browser picks the right size automatically -->
<img ngSrc="/photo.jpg" width="800" height="600"
     ngSrcset="400w, 800w, 1200w"
     sizes="(max-width:600px) 100vw, 50vw"
     alt="Photo" />`,
    },
    {
      label: 'CDN loaders',
      language: 'typescript',
      code: `// app.config.ts — pick one of the built-in loaders

import {
  provideCloudinaryLoader,
  provideImgixLoader,
  provideImageKitLoader,
} from '@angular/common';

export const appConfig: ApplicationConfig = {
  providers: [
    // Cloudinary — ngSrc becomes a Cloudinary public ID
    provideCloudinaryLoader('https://res.cloudinary.com/my-cloud'),
    // → ngSrc="sample.jpg" + width=400
    // → https://res.cloudinary.com/my-cloud/image/upload/f_auto,q_auto,w_400/sample.jpg

    // Imgix
    // provideImgixLoader('https://my-site.imgix.net'),

    // ImageKit
    // provideImageKitLoader('https://ik.imagekit.io/my-id'),
  ],
};

// Custom loader — IMAGE_LOADER token
import { IMAGE_LOADER, ImageLoaderConfig } from '@angular/common';

providers: [
  {
    provide: IMAGE_LOADER,
    useValue: (config: ImageLoaderConfig): string => {
      // config.src    — the ngSrc value
      // config.width  — requested width from ngSrcset
      // config.loaderParams — any extra [loaderParams] passed on the image
      const quality = config.loaderParams?.['quality'] ?? 80;
      return \`https://cdn.example.com/\${config.src}?w=\${config.width}&q=\${quality}\`;
    },
  },
];`,
    },
    {
      label: 'Priority + preconnect',
      language: 'html',
      code: `<!-- index.html — add preconnect for the CDN domain -->
<!-- This establishes the TCP/TLS connection early, before the browser
     parses the <img> element. NgOptimizedImage warns if this is missing. -->
<head>
  <link rel="preconnect" href="https://res.cloudinary.com" />
</head>

<!-- In the template: ONE priority image per page -->
<!-- Priority = fetchpriority="high" + <link rel="preload"> in <head> -->
<img
  ngSrc="hero.jpg"
  width="1200"
  height="600"
  alt="Hero banner"
  priority
  ngSrcset="600w, 900w, 1200w"
  sizes="100vw"
/>

<!-- NON-priority above-fold images: no priority, still lazy by default -->
<!-- Only the LCP image gets priority — avoid multiple priority imgs -->
<img ngSrc="card-thumbnail.jpg" width="400" height="300" alt="Card" />`,
    },
    {
      label: 'loaderParams + placeholder',
      language: 'typescript',
      code: `// Passing per-image CDN transformation params via loaderParams
// Custom loader reads config.loaderParams for extra options

@Component({
  template: \`
    <!-- loaderParams passes { quality, format } to your loader -->
    <img
      ngSrc="photo.jpg"
      width="800"
      height="600"
      [loaderParams]="{ quality: 90, format: 'webp' }"
      ngSrcset="400w, 800w, 1200w"
      alt="Product"
    />

    <!-- placeholder: shows a tiny blurred version while loading -->
    <!-- Requires a loader that supports small-width requests -->
    <img
      ngSrc="hero.jpg"
      width="1200"
      height="600"
      alt="Hero"
      priority
      placeholder
    />
  \`,
})
export class GalleryComponent {}

// Loader receives loaderParams:
// { provide: IMAGE_LOADER, useValue: (c: ImageLoaderConfig) => {
//   const fmt  = c.loaderParams?.['format'] ?? 'auto';
//   const qual = c.loaderParams?.['quality'] ?? 80;
//   return \`https://cdn.example.com/\${c.src}?w=\${c.width}&fmt=\${fmt}&q=\${qual}\`;
// }}`,
    },
    {
      label: 'SSR integration',
      language: 'typescript',
      code: `// app.config.server.ts — SSR configuration
// NgOptimizedImage's priority preload is injected server-side automatically
// when you use Angular SSR. No extra configuration is needed.

// The <link rel="preload"> for priority images appears in the initial HTML
// served by the server — the browser begins fetching the hero image before
// any JavaScript hydrates.

// Example server-rendered HTML output:
// <head>
//   <link rel="preconnect" href="https://res.cloudinary.com" />
//   <!-- Injected by NgOptimizedImage for priority images: -->
//   <link rel="preload" as="image"
//         href="https://res.cloudinary.com/.../hero.jpg?w=1200"
//         imagesrcset="...400w, ...800w, ...1200w"
//         imagesizes="100vw" />
// </head>

// In a defer block — do NOT use priority on deferred images
// (they are intentionally loaded late)
@defer (on viewport) {
  <!-- No priority here — this image is loaded lazily by design -->
  <img ngSrc="lazy-content.jpg" width="800" height="600" alt="Lazy" />
}`,
    },
  ];

  quiz: QuizQuestion[] = [
    {
      q: 'Which module must be added to a standalone component\'s imports array to use the ngSrc directive?',
      options: [
        'HttpClientModule from @angular/common/http',
        'NgOptimizedImage from @angular/common',
        'CommonModule from @angular/common',
        'ImageModule from @angular/common',
      ],
      answer: 1,
      explanation: 'NgOptimizedImage is a standalone directive in @angular/common and must be explicitly listed in the component\'s imports array. It is not part of CommonModule — you cannot rely on CommonModule to provide ngSrc.',
    },
    {
      q: 'What two HTML attributes does NgOptimizedImage require on every non-fill image, and why?',
      options: [
        'alt and title — required for accessibility and SEO compliance',
        'width and height — to allow the browser to reserve space before the image loads, preventing CLS',
        'loading and fetchpriority — for browser performance hints',
        'src and srcset — for browser compatibility with older engines',
      ],
      answer: 1,
      explanation: 'NgOptimizedImage enforces explicit width and height at build time (with a runtime warning). These tell the browser the aspect ratio before the image downloads, allowing it to reserve the correct space and preventing Cumulative Layout Shift (CLS). Missing them triggers a console error.',
    },
    {
      q: 'What two things happen when you add the priority attribute to an ngSrc image?',
      options: [
        'Sets loading="eager" and adds a <link rel="dns-prefetch"> to the head',
        'Sets fetchpriority="high" on the img element AND injects a <link rel="preload"> into the document head',
        'Disables lazy loading and forces a synchronous fetch before DOMContentLoaded',
        'Adds an HTTP/2 server push header and sets loading="auto"',
      ],
      answer: 1,
      explanation: 'The priority attribute does two things: it sets fetchpriority="high" on the img element to elevate browser download priority, and it injects a <link rel="preload"> into the document head so the browser begins fetching the image even before parsing reaches the img element. Use it on exactly one image per page — the LCP element.',
    },
    {
      q: 'When using fill mode, which CSS rule must the container element have?',
      options: [
        'display: flex and a flex direction',
        'overflow: hidden on the container',
        'position: relative (or absolute/fixed/sticky) plus an explicit height',
        'width: 100% and aspect-ratio',
      ],
      answer: 2,
      explanation: 'fill mode absolutely positions the image to fill its nearest positioned ancestor. Without position: relative on the container the image either escapes the layout or collapses to zero. An explicit height is also required — otherwise the container has no height for the image to fill.',
    },
    {
      q: 'What is the role of a CDN image loader such as provideCloudinaryLoader()?',
      options: [
        'It compresses images on the client side before the browser displays them',
        'It transforms the ngSrc string and a requested width into a full CDN URL, enabling automatic on-the-fly resizing',
        'It adds Content-Security-Policy headers to all image responses from the CDN',
        'It caches images in a service worker so the page loads offline',
      ],
      answer: 1,
      explanation: 'A loader is a function (registered via a provider) that maps the ngSrc value and a requested width to a full CDN URL. For example, provideCloudinaryLoader builds URLs like https://res.cloudinary.com/.../w_400/sample.jpg. This enables automatic srcset generation and on-the-fly resizing from a single source image.',
    },
    {
      q: 'What does ngSrcset="400w, 800w, 1200w" tell the browser to do?',
      options: [
        'Download all three image sizes and display the largest one that fits',
        'Show a 400px-wide image on mobile, 800px on tablet, and 1200px on desktop',
        'Generate a srcset attribute so the browser downloads only the breakpoint size closest to the actual display width',
        'Lazy-load the image only when the viewport is at least 400px wide',
      ],
      answer: 2,
      explanation: 'ngSrcset instructs NgOptimizedImage to generate a native srcset attribute with entries at 400w, 800w, and 1200w. Combined with the sizes attribute, the browser selects and downloads only the most appropriate size for the current screen — typically reducing image payload by 50–80% on mobile compared to always serving the largest size.',
    },
    {
      q: 'Are NgOptimizedImage developer warnings (missing width/height, oversized image, missing preconnect) included in the production bundle?',
      options: [
        'Yes — they are always active so monitoring tools can detect issues in production',
        'Yes — but only in Angular Universal/SSR builds, not in browser builds',
        'No — the warning checks are stripped by tree-shaking in production builds',
        'No — but only if AOT compilation is enabled',
      ],
      answer: 2,
      explanation: 'NgOptimizedImage development warnings are wrapped in NgDevMode checks which are tree-shaken to false in production builds. The production bundle contains only the runtime optimisation code (lazy loading, srcset generation, preload injection), not the diagnostic machinery. Warnings must therefore be caught and fixed during development.',
    },
  ];

  qna: QnaItem[] = [
    { q: 'What is the main benefit of NgOptimizedImage over a regular img tag?', a: 'It enforces best practices at build time — requires explicit <code>width</code>/<code>height</code> to prevent CLS, auto-adds <code>loading="lazy"</code> for non-priority images, and integrates with CDN loaders for automatic URL generation with responsive <code>srcset</code>. It also injects LCP preload hints server-side in SSR applications.' },
    { q: 'What does the priority attribute do, and when should you use it?', a: 'It does two things: sets <code>fetchpriority="high"</code> on the element, and injects a <code>&lt;link rel="preload"&gt;</code> in the <code>&lt;head&gt;</code> so the browser fetches the image before parsing reaches the <code>&lt;img&gt;</code>. Use it on exactly <strong>one</strong> image per page — the LCP element (usually the hero or first product image). Multiple priority images compete for preload slots and can slow each other down.' },
    { q: 'What is fill mode and when do you use it?', a: '<code>fill</code> makes the image absolutely fill its nearest positioned ancestor, removing the requirement for explicit <code>width</code>/<code>height</code>. Use it for images with unknown or variable dimensions — hero banners, card thumbnails, avatar circles. The container must have <code>position: relative</code> and an explicit <code>height</code>. Add <code>style="object-fit:cover"</code> to prevent distortion.' },
    { q: 'How do CDN loaders work with NgOptimizedImage?', a: 'A loader is a function that receives <code>{ src, width, loaderParams? }</code> and returns a full CDN URL string. Register it with <code>provideCloudinaryLoader(base)</code> (or custom via <code>IMAGE_LOADER</code> token). When you add <code>ngSrcset="400w, 800w"</code>, Angular calls the loader for each width and builds the <code>srcset</code> attribute — one source image, many output sizes, no manual URL maintenance.' },
    { q: 'How do you generate a responsive srcset with NgOptimizedImage?', a: 'Add <code>ngSrcset="400w, 800w, 1200w"</code> alongside <code>ngSrc</code>. Angular generates native <code>srcset</code> entries for each width. Add a <code>sizes</code> attribute to tell the browser how wide the image will be at each breakpoint: <code>sizes="(max-width:600px) 100vw, 50vw"</code>. The browser downloads only the size it actually needs.' },
    { q: 'Does NgOptimizedImage work without a CDN loader?', a: 'Yes — without a loader, the raw <code>ngSrc</code> value is used as the URL. You lose automatic resizing and CDN URL generation, but still get: lazy loading enforcement, build-time width/height validation, and the <code>priority</code> preload behaviour. This is perfectly fine for static assets served from the same origin.' },
    { q: 'How does NgOptimizedImage help in Angular SSR applications?', a: 'For <code>priority</code> images, NgOptimizedImage injects the <code>&lt;link rel="preload"&gt;</code> server-side via Angular\'s Transfer State — it appears in the HTML payload sent to the client. The browser can start fetching the LCP image before any JavaScript hydrates, directly improving the LCP Core Web Vital score. No extra SSR configuration is needed.' },
    { q: 'What is the loaderParams input used for?', a: '<code>[loaderParams]="{ quality: 80, format: \'webp\' }"</code> passes a per-image options object to the loader function. The loader accesses it via <code>config.loaderParams</code> and can include these values in the CDN URL (e.g. appending <code>?q=80&fmt=webp</code>). Use it when different images on the same page need different CDN transformations.' },
  ];

  quickRef: QuickRefItem[] = [
    { name: 'NgOptimizedImage', type: 'directive', desc: 'Drop-in replacement for <img> that enforces best practices, adds lazy loading, and integrates with CDN loaders. Import from @angular/common.', since: '15' },
    { name: 'ngSrc', type: 'directive', desc: 'Replaces src. Activates NgOptimizedImage on the element. Pass a URL or a loader-specific key (e.g. "photo.jpg" with a Cloudinary loader).', since: '15' },
    { name: 'ngSrcset', type: 'directive', desc: 'Comma-separated width descriptors (e.g. "400w, 800w"). Generates a native srcset using the configured loader. Browser picks the closest size.', since: '15' },
    { name: 'priority', type: 'directive', desc: 'Boolean. Sets fetchpriority="high" and injects a preload link into <head>. Use on exactly one image per page — the LCP element.', since: '15' },
    { name: 'fill', type: 'directive', desc: 'Boolean. Removes width/height requirement. Image fills its nearest positioned ancestor. Container needs position:relative + height.', since: '15' },
    { name: 'loaderParams', type: 'directive', desc: 'Object input passed to the loader function as config.loaderParams. Use for per-image CDN transformation options (quality, format, etc.).', since: '17' },
    { name: 'placeholder', type: 'directive', desc: 'Boolean. Shows a tiny blurred placeholder while the full image loads. Requires a loader that supports small-width requests.', since: '17' },
    { name: 'IMAGE_LOADER', type: 'token', desc: 'DI token for a custom loader function: (config: ImageLoaderConfig) => string. Overrides the built-in URL behaviour.', since: '15' },
    { name: 'provideCloudinaryLoader', type: 'function', desc: 'Registers the built-in Cloudinary CDN loader with the given base URL. ngSrc values become Cloudinary public IDs.', since: '15' },
    { name: 'ImageLoaderConfig', type: 'interface', desc: 'Shape of the object passed to a custom loader: { src: string, width: number, loaderParams?: Record<string, any> }.', since: '15' },
  ];

  beforeAfter: BeforeAfterExample[] = [
    {
      title: 'Native img vs NgOptimizedImage',
      before: `<!-- Old: plain img — browser guesses space, may shift layout -->
<img
  src="/hero.jpg"
  alt="Hero"
  loading="lazy"
/>`,
      after: `<!-- New: NgOptimizedImage — space reserved, preloaded if LCP -->
<img
  ngSrc="/hero.jpg"
  width="800"
  height="400"
  alt="Hero"
  priority
/>`,
      note: 'NgOptimizedImage requires explicit width and height to prevent CLS, adds lazy loading automatically, and injects a preload link for priority images.',
    },
    {
      title: 'Manual srcset vs ngSrcset with CDN loader',
      before: `<!-- Old: hand-crafted srcset — must maintain URLs manually -->
<img
  src="/img/photo-800.jpg"
  srcset="/img/photo-400.jpg 400w,
          /img/photo-800.jpg 800w,
          /img/photo-1200.jpg 1200w"
  sizes="(max-width:600px) 100vw, 50vw"
  alt="Photo"
/>`,
      after: `<!-- New: ngSrcset + CDN loader builds all URLs automatically -->
<img
  ngSrc="photo.jpg"
  width="800"
  height="600"
  ngSrcset="400w, 800w, 1200w"
  sizes="(max-width:600px) 100vw, 50vw"
  alt="Photo"
/>`,
      note: 'With a CDN loader, ngSrcset auto-generates all CDN URLs. Add a new breakpoint by changing one string — no URL management needed.',
    },
    {
      title: 'Object-fit wrapper div vs fill mode',
      before: `<!-- Old: extra wrapper + CSS to simulate fill -->
<div style="width:100%; height:300px; overflow:hidden;">
  <img
    src="/hero.jpg"
    style="width:100%; height:100%; object-fit:cover;"
    alt="Hero"
  />
</div>`,
      after: `<!-- New: fill attribute handles positioning -->
<div style="position:relative; height:300px; overflow:hidden;">
  <img
    ngSrc="/hero.jpg"
    fill
    alt="Hero"
    style="object-fit:cover;"
  />
</div>`,
      note: 'fill removes the need for explicit width/height. The container must have position:relative — without it the image overflows its context.',
    },
  ];

  mistakes: CommonMistake[] = [
    {
      title: 'Forgetting width and height on non-fill images',
      wrong: `<!-- BUG: NgOptimizedImage throws a runtime error -->
<img ngSrc="/photo.jpg" alt="Photo" />`,
      right: `<!-- Correct: always provide width and height -->
<img ngSrc="/photo.jpg" width="800" height="600" alt="Photo" />`,
      explanation: 'NgOptimizedImage requires explicit width and height on every non-fill image so the browser can reserve space before the image loads, preventing Cumulative Layout Shift (CLS). Omitting them causes an immediate runtime error, not a warning.',
    },
    {
      title: 'Using priority on multiple images per page',
      wrong: `<!-- BUG: competing preloads slow each other down -->
<img ngSrc="/hero.jpg" width="800" height="400" priority alt="Hero" />
<img ngSrc="/card1.jpg" width="400" height="300" priority alt="Card 1" />`,
      right: `<!-- Correct: priority on the single LCP image only -->
<img ngSrc="/hero.jpg" width="800" height="400" priority alt="Hero" />
<img ngSrc="/card1.jpg" width="400" height="300" alt="Card 1" />`,
      explanation: 'Only one image per page should carry priority — the Largest Contentful Paint element. Multiple priority images compete for the browser\'s limited preload slots. Other above-fold images load fast enough without it and do not need a preload hint.',
    },
    {
      title: 'Using fill without position:relative on the container',
      wrong: `<!-- BUG: image escapes or collapses — no positioned ancestor -->
<div style="height:300px;">
  <img ngSrc="/hero.jpg" fill alt="Hero" />
</div>`,
      right: `<!-- Correct: container is positioned so the fill image stays inside -->
<div style="position:relative; height:300px; overflow:hidden;">
  <img ngSrc="/hero.jpg" fill alt="Hero" style="object-fit:cover;" />
</div>`,
      explanation: 'fill mode absolutely positions the image to its nearest positioned ancestor. Without position:relative the image overflows the page or collapses to 0px — rendering invisibly with no console error.',
    },
    {
      title: 'Not importing NgOptimizedImage in the component',
      wrong: `// BUG: directive not imported — ngSrc is treated as unknown attribute
@Component({
  selector: 'app-gallery',
  template: '<img ngSrc="/photo.jpg" width="400" height="300" alt="" />',
})
export class GalleryComponent {}`,
      right: `// Correct: NgOptimizedImage in the imports array
@Component({
  imports: [NgOptimizedImage],
  template: '<img ngSrc="/photo.jpg" width="400" height="300" alt="" />',
})
export class GalleryComponent {}`,
      explanation: 'NgOptimizedImage is not part of CommonModule — it is a standalone directive and must be explicitly listed in the imports array. Without it, ngSrc is silently treated as an unknown attribute and the img element falls back to native img behaviour with no error.',
    },
    {
      title: 'Omitting sizes when using ngSrcset — browser always downloads the largest breakpoint',
      wrong: `<!-- BUG: without sizes, browser assumes image is 100vw wide on all devices -->
<!-- → always downloads the 1200w image, even on a 375px mobile screen -->
<img ngSrc="photo.jpg" width="800" height="600"
     ngSrcset="400w, 800w, 1200w" alt="Photo" />`,
      right: `<!-- Correct: sizes tells the browser the actual rendered width -->
<img ngSrc="photo.jpg" width="800" height="600"
     ngSrcset="400w, 800w, 1200w"
     sizes="(max-width:600px) 100vw, 50vw"
     alt="Photo" />`,
      explanation: 'Without a sizes attribute, browsers default to 100vw (full viewport width) and download the largest srcset candidate. Adding sizes lets the browser pick the correct breakpoint and can reduce mobile image payload by 50–80%.',
    },
  ];

  challenge: Challenge = {
    title: 'Build a Responsive Image Gallery with NgOptimizedImage',
    description: 'Create an Angular component that shows three image cards. The first card must use the priority attribute (it is the LCP image), explicit width and height, and a responsive srcset at 400w, 800w, and 1200w. The second card must use fill mode inside a fixed-height container with object-fit:cover. The third card must pass loaderParams with quality: 80 to a custom loader function that appends a ?q= query parameter.',
    language: 'typescript',
    hints: [
      'Replace src with ngSrc on every img element. NgOptimizedImage will not activate if src is still present.',
      'For the priority (first) image: add width, height, priority, and ngSrcset="400w, 800w, 1200w". Also add a sizes attribute describing the image\'s rendered width.',
      'For the fill (second) image: add fill to the img and position:relative plus an explicit height (e.g. height:250px) to the container div.',
      'For the loaderParams (third) image: provide IMAGE_LOADER in the component providers with a useValue function that reads config.loaderParams?.["quality"] and appends it as a ?q= query parameter to the URL.',
    ],
    starterCode: `import { Component } from '@angular/core';
import { NgOptimizedImage, IMAGE_LOADER, ImageLoaderConfig } from '@angular/common';

@Component({
  selector: 'app-gallery',
  imports: [NgOptimizedImage],
  providers: [
    // TODO: Provide a custom IMAGE_LOADER that appends ?q=<quality> to the URL
  ],
  template: \`
    <div class="gallery">

      <!-- Card 1: LCP hero image — priority, srcset, sizes -->
      <!-- TODO: Add priority, ngSrcset="400w, 800w, 1200w", sizes -->
      <div class="card">
        <img src="/assets/hero.jpg" width="800" height="500" alt="Hero" />
        <p>Hero (LCP)</p>
      </div>

      <!-- Card 2: Fill mode — fills a fixed-height container -->
      <!-- TODO: Add fill mode. Give the container position:relative + height:250px -->
      <div class="card">
        <div class="img-container">
          <img src="/assets/landscape.jpg" alt="Landscape" />
        </div>
        <p>Landscape (fill)</p>
      </div>

      <!-- Card 3: loaderParams — pass quality:80 -->
      <!-- TODO: Replace src with ngSrc, add [loaderParams]="{ quality: 80 }" -->
      <div class="card">
        <img src="product.jpg" width="400" height="400" alt="Product" />
        <p>Product (loaderParams)</p>
      </div>

    </div>
  \`,
})
export class GalleryComponent {}`,
    solution: `import { Component } from '@angular/core';
import { NgOptimizedImage, IMAGE_LOADER, ImageLoaderConfig } from '@angular/common';

@Component({
  selector: 'app-gallery',
  imports: [NgOptimizedImage],
  providers: [
    {
      provide: IMAGE_LOADER,
      useValue: (c: ImageLoaderConfig): string => {
        const q = c.loaderParams?.['quality'] ?? 'auto';
        return \`\${c.src}?w=\${c.width}&q=\${q}\`;
      },
    },
  ],
  template: \`
    <div class="gallery">

      <!-- Card 1: LCP hero image — priority, srcset, sizes -->
      <div class="card">
        <img
          ngSrc="/assets/hero.jpg"
          width="800"
          height="500"
          alt="Hero"
          priority
          ngSrcset="400w, 800w, 1200w"
          sizes="(max-width:600px) 100vw, 66vw"
        />
        <p>Hero (LCP)</p>
      </div>

      <!-- Card 2: Fill mode inside a fixed-height container -->
      <div class="card">
        <div class="img-container" style="position:relative; height:250px; overflow:hidden;">
          <img
            ngSrc="/assets/landscape.jpg"
            fill
            alt="Landscape"
            style="object-fit:cover;"
          />
        </div>
        <p>Landscape (fill)</p>
      </div>

      <!-- Card 3: loaderParams passes quality to the custom loader -->
      <div class="card">
        <img
          ngSrc="product.jpg"
          width="400"
          height="400"
          alt="Product"
          [loaderParams]="{ quality: 80 }"
          ngSrcset="200w, 400w, 800w"
        />
        <p>Product (loaderParams)</p>
      </div>

    </div>
  \`,
})
export class GalleryComponent {}`,
  };

  revision: RevisionSummary = {
    oneLiner: 'NgOptimizedImage is a built-in Angular directive that replaces <img src> with <img ngSrc> to automatically enforce CLS-preventing width/height requirements, add lazy loading, inject LCP preloads, and integrate with CDN loaders for automatic srcset generation.',
    mustKnow: [
      'Import <code>NgOptimizedImage</code> from <code>@angular/common</code> into the component\'s <code>imports</code> array — it is NOT part of CommonModule',
      'Every non-fill image requires explicit <code>width</code> and <code>height</code> to prevent Cumulative Layout Shift (CLS) — missing them causes a runtime error',
      '<code>priority</code> does two things: sets <code>fetchpriority="high"</code> AND injects a <code>&lt;link rel="preload"&gt;</code> into <code>&lt;head&gt;</code> — use on exactly ONE image per page (the LCP)',
      '<code>fill</code> mode removes width/height requirement; container needs <code>position: relative</code> and an explicit height — without it the image is invisible',
      '<code>ngSrcset="400w, 800w, 1200w"</code> generates a native srcset; always pair it with a <code>sizes</code> attribute or the browser defaults to 100vw and downloads the largest image on every device',
      'CDN loaders (<code>provideCloudinaryLoader</code>, etc.) transform the bare <code>ngSrc</code> key into full CDN URLs per breakpoint — configure once in <code>app.config.ts</code>, works everywhere',
      'All developer warnings (oversized image, missing preconnect, missing priority) are development-only and are tree-shaken from production builds',
    ],
    interviewFocus: [
      'What problem does NgOptimizedImage solve that a regular img tag cannot? (CLS via enforced width/height, automatic lazy loading, LCP preload injection)',
      'What does the priority attribute do that loading="eager" does not? (Adds a preload link in the document head — browser fetches before parsing reaches the img element)',
      'Why does fill mode need position:relative on the container? (Images are absolutely positioned — without a positioned ancestor they overflow or collapse to 0px)',
      'What is the purpose of an image loader? (Transforms a bare ngSrc key + width into a full CDN URL, enabling automatic srcset generation with on-the-fly resizing)',
      'Why must you add a sizes attribute alongside ngSrcset? (Without it, the browser assumes 100vw and always downloads the largest breakpoint, negating all mobile savings)',
    ],
  };
}
