import { Component, signal } from '@angular/core';
import { NgOptimizedImage } from '@angular/common';
import { CodeBlockComponent, CodeTab } from '../shared/code-block/code-block';
import { TheoryBlockComponent, TheoryPoint } from '../shared/theory-block/theory-block';
import { QnaBlockComponent, QnaItem } from '../shared/qna-block/qna-block';
import { QuizBlockComponent, QuizQuestion } from '../shared/quiz-block/quiz-block';
import { ChallengeBlockComponent, Challenge } from '../shared/challenge-block/challenge-block';
import { QuickRefComponent, QuickRefItem } from '../shared/quick-ref/quick-ref';
import { BeforeAfterComponent, BeforeAfterExample } from '../shared/before-after/before-after';
import { CommonMistakesComponent, CommonMistake } from '../shared/common-mistakes/common-mistakes';
import { VersionBadgeComponent, VersionInfo } from '../shared/version-badge/version-badge';
import { PageMetaComponent } from '../shared/page-meta/page-meta';
import { PageCompleteComponent } from '../shared/page-complete/page-complete';

@Component({
  selector: 'app-ng-image',
  imports: [NgOptimizedImage, CodeBlockComponent, TheoryBlockComponent, QnaBlockComponent, QuizBlockComponent, ChallengeBlockComponent, QuickRefComponent, BeforeAfterComponent, CommonMistakesComponent, VersionBadgeComponent, PageMetaComponent, PageCompleteComponent],
  templateUrl: './ng-image.html',
  styleUrl: './ng-image.scss',
})
export class NgImageDemo {
  priority = signal(false);

  qna: QnaItem[] = [
    { q: 'What is the main benefit of NgOptimizedImage over a regular img tag?', a: 'It enforces best practices at build time (requires explicit <code>width</code>/<code>height</code> to prevent CLS), auto-adds <code>loading="lazy"</code> for non-priority images, and integrates with CDN loaders for automatic URL generation and resizing.' },
    { q: 'What does the priority attribute do?', a: 'It sets <code>fetchpriority="high"</code> and adds a preload link in the document head — telling the browser to download this image immediately. Use only on the LCP (Largest Contentful Paint) image. Only one per page.' },
    { q: 'What is fill mode and when do you use it?', a: '<code>fill</code> makes the image fill its nearest positioned ancestor. Use it when the image dimensions are unknown or variable (hero images, card thumbnails). Add <code>position: relative</code> and a fixed height to the container.' },
    { q: 'How do CDN loaders work with NgOptimizedImage?', a: 'A loader transforms the <code>ngSrc</code> string (e.g. "photo.jpg") into a full CDN URL with width parameter (e.g. "https://cdn.example.com/photo.jpg?w=400"). The browser\'s srcset picks the right size. Built-in loaders exist for Cloudinary, Imgix, and ImageKit.' },
    { q: 'How do you generate a responsive srcset with NgOptimizedImage?', a: 'Add <code>ngSrcset="400w, 800w, 1200w"</code>. Angular generates srcset entries for each width using the configured loader. The browser downloads only the size appropriate for the device screen.' },
    { q: 'Does NgOptimizedImage work without a CDN loader?', a: 'Yes — without a loader it uses the <code>ngSrc</code> value as-is. You lose automatic resizing and CDN URL generation, but still get lazy loading enforcement, width/height validation, and the priority attribute.' },
  ];

  theory: TheoryPoint[] = [
    {
      heading: 'What is NgOptimizedImage?',
      points: [
        'NgOptimizedImage is a built-in Angular directive that replaces <img src="..."> with <img ngSrc="...">.',
        'It automatically adds width and height attributes, preventing layout shift (CLS).',
        'It sets loading="lazy" on non-priority images and fetchpriority="high" on priority ones.',
        'It enforces best practices at build time — missing width/height or oversized images trigger warnings.',
      ],
    },
    {
      heading: 'Image loaders',
      points: [
        'Loaders transform the ngSrc string into a CDN-optimised URL with the right dimensions.',
        'Built-in loaders: provideImgixLoader(), provideCloudinaryLoader(), provideImageKitLoader(), provideNgOptimizedImage().',
        'Custom loader: provide({ provide: IMAGE_LOADER, useValue: (config) => `https://cdn.example.com/${config.src}?w=${config.width}` }).',
        'Without a loader, NgOptimizedImage uses the src string as-is and still enforces size attributes.',
      ],
    },
    {
      heading: 'priority and fill',
      points: [
        'Add priority to the LCP (Largest Contentful Paint) image — sets fetchpriority="high" and preloads the image.',
        'fill makes the image fill its containing element — use with position: relative on the container.',
        'fill replaces fixed width/height — good for hero images, cards with variable aspect ratios.',
        'Only one priority image per page — the LCP element. Other above-fold images do NOT need priority.',
      ],
    },
    {
      heading: 'Key points to remember',
      points: [
        'NgOptimizedImage is imported from @angular/common — no separate package needed.',
        'Always provide explicit width and height unless using fill — prevents layout shift.',
        'Use ngSrcset="200w, 400w, 800w" to let the browser pick the right size for the screen.',
        'Pair with a CDN image loader for best results — on-the-fly resizing means one source image, many output sizes.',
      ],
    },
  ];

  tabs: CodeTab[] = [
    {
      label: 'Basic usage',
      language: 'html',
      code: `<!-- Import NgOptimizedImage in component imports -->

<!-- Basic — replaces src with ngSrc -->
<img ngSrc="/hero.jpg" width="800" height="400" alt="Hero" />

<!-- Priority (LCP image) — preloaded -->
<img ngSrc="/hero.jpg" width="800" height="400" alt="Hero" priority />

<!-- Fill mode — fills container (add position:relative to parent) -->
<div style="position:relative; height:300px">
  <img ngSrc="/hero.jpg" fill alt="Hero" />
</div>

<!-- Responsive srcset -->
<img ngSrc="/photo.jpg" width="800" height="600" ngSrcset="400w, 800w, 1200w" alt="Photo" />`,
    },
    {
      label: 'CDN Loader',
      language: 'typescript',
      code: `// app.config.ts — Cloudinary loader
import { provideCloudinaryLoader } from '@angular/common';

providers: [
  provideCloudinaryLoader('https://res.cloudinary.com/my-cloud'),
]

// Template: ngSrc is now just the public ID
// <img ngSrc="sample.jpg" width="400" height="300" />
// → renders: https://res.cloudinary.com/my-cloud/image/upload/f_auto,q_auto,w_400/sample.jpg

// Custom loader:
import { IMAGE_LOADER, ImageLoaderConfig } from '@angular/common';
providers: [
  { provide: IMAGE_LOADER, useValue: (config: ImageLoaderConfig) =>
    \`https://cdn.example.com/\${config.src}?w=\${config.width}\` },
]`,
    },
  ];

  quiz: QuizQuestion[] = [
    { q: 'Which module must be added to a component\'s imports array to use the ngSrc directive?', options: ['HttpClientModule', 'NgOptimizedImage', 'CommonModule', 'ImageModule'], answer: 1, explanation: 'NgOptimizedImage is imported directly from @angular/common and must be listed in the component\'s imports array. It is not part of CommonModule — it must be imported explicitly.' },
    { q: 'What two HTML attributes does NgOptimizedImage require on every non-fill image, and why?', options: ['alt and title — for accessibility', 'width and height — to prevent Cumulative Layout Shift (CLS)', 'loading and fetchpriority — for performance hints', 'src and srcset — for browser compatibility'], answer: 1, explanation: 'NgOptimizedImage enforces explicit width and height at build time. These tell the browser the aspect ratio before the image loads, reserving the correct space and preventing layout shift (CLS).' },
    { q: 'What effect does adding the priority attribute to an ngSrc image have?', options: ['It sets loading=\'eager\' and adds a DNS prefetch link', 'It sets fetchpriority=\'high\' and adds a preload link in the document head', 'It disables lazy loading but does not affect fetch priority', 'It forces the image to load before any JavaScript on the page'], answer: 1, explanation: 'The priority attribute sets fetchpriority=\'high\' on the img element AND injects a <link rel=\'preload\'> into the document head so the browser starts downloading the image immediately. It should be used only on the LCP image.' },
    { q: 'When using fill mode on NgOptimizedImage, which CSS rule must be applied to the parent container?', options: ['display: flex', 'overflow: hidden', 'position: relative', 'width: 100%'], answer: 2, explanation: 'Fill mode makes the image absolutely positioned to fill its nearest positioned ancestor. The container must have position: relative (or absolute/fixed/sticky) so the image expands to fill it correctly. A fixed height on the container is also needed.' },
    { q: 'What is the purpose of providing a CDN image loader such as provideCloudinaryLoader()?', options: ['It compresses images on the client side before uploading them', 'It transforms the ngSrc string into a full CDN URL that includes a width parameter, enabling automatic on-the-fly resizing', 'It adds Content-Security-Policy headers to all image requests', 'It caches images in a service worker so they load offline'], answer: 1, explanation: 'A CDN loader is a function that takes the ngSrc value (e.g. \'photo.jpg\') and a requested width, and returns a full CDN URL (e.g. \'https://res.cloudinary.com/my-cloud/image/upload/f_auto,q_auto,w_400/photo.jpg\'). This enables automatic resizing and srcset generation from a single source image.' },
  ];

  quickRef: QuickRefItem[] = [
    { name: 'NgOptimizedImage', type: 'directive', desc: 'Drop-in replacement for the native img tag that enforces best practices (width/height, lazy loading, priority hints) and integrates with CDN loaders.' , since: '15'},
    { name: 'ngSrc', type: 'directive', desc: 'Replaces the standard src attribute on an img element to activate NgOptimizedImage and all its optimizations.' , since: '15'},
    { name: 'ngSrcset', type: 'directive', desc: 'Accepts a comma-separated list of width descriptors (e.g. \'400w, 800w\') and generates a browser-native srcset so the browser downloads the right image size.' , since: '15'},
    { name: 'priority', type: 'directive', desc: 'Boolean input that sets fetchpriority=\'high\' and injects a preload link for the LCP image — use on exactly one image per page.' , since: '15'},
    { name: 'fill', type: 'directive', desc: 'Boolean input that removes the requirement for explicit width/height and makes the image absolutely fill its nearest positioned ancestor.' , since: '15'},
    { name: 'IMAGE_LOADER', type: 'token', desc: 'DI token used to provide a custom loader function that maps an ngSrc string and requested width to a full CDN URL.' , since: '15'},
    { name: 'provideCloudinaryLoader', type: 'function', desc: 'Helper that registers a built-in Cloudinary CDN loader so ngSrc values are automatically expanded into Cloudinary transformation URLs.' , since: '15'},
    { name: 'provideImgixLoader', type: 'function', desc: 'Helper that registers a built-in Imgix CDN loader for automatic URL generation and on-the-fly image resizing.' , since: '15'},
    { name: 'provideImageKitLoader', type: 'function', desc: 'Helper that registers a built-in ImageKit CDN loader for automatic URL generation and responsive image delivery.' , since: '15'},
    { name: 'ImageLoaderConfig', type: 'interface', desc: 'Interface for the config object passed to a custom IMAGE_LOADER function, containing src, width, and optional loaderParams.' , since: '15'},
  ];

  beforeAfter: BeforeAfterExample[] = [
    { title: 'Native img tag vs NgOptimizedImage', before: `<!-- Old: plain img tag, no size enforcement -->
<img
  src='/hero.jpg'
  alt='Hero'
/>`, after: `<!-- New: NgOptimizedImage with required dimensions -->
<img
  ngSrc='/hero.jpg'
  width='800'
  height='400'
  alt='Hero'
  priority
/>`,
      note: 'NgOptimizedImage requires explicit width and height on every non-fill image to prevent Cumulative Layout Shift (CLS).' },
    { title: 'Manual srcset vs ngSrcset with CDN loader', before: `<!-- Old: hand-crafted srcset with hardcoded URLs -->
<img
  src='/img/photo-800.jpg'
  srcset='/img/photo-400.jpg 400w,
          /img/photo-800.jpg 800w'
  alt='Photo'
/>`, after: `<!-- New: ngSrcset generates URLs via the CDN loader -->
<img
  ngSrc='photo.jpg'
  width='800'
  height='600'
  ngSrcset='400w, 800w, 1200w'
  alt='Photo'
/>`,
      note: 'With a CDN loader configured, ngSrcset automatically builds full CDN URLs for each breakpoint.' },
    { title: 'Fixed-size fill workaround vs fill mode', before: `<!-- Old: wrapper trick with object-fit in CSS -->
<div style='width:100%; height:300px; overflow:hidden;'>
  <img src='/hero.jpg' style='width:100%; height:100%; object-fit:cover;' />
</div>`, after: `<!-- New: fill input handles the positioning -->
<div style='position:relative; height:300px;'>
  <img ngSrc='/hero.jpg' fill alt='Hero'
       style='object-fit:cover;' />
</div>`,
      note: 'fill removes the need for explicit width/height but requires position:relative on the container.' },
  ];

  mistakes: CommonMistake[] = [
    { title: 'Forgetting width and height on non-fill images', wrong: `<!-- Missing width/height causes a runtime error -->
<img ngSrc='/photo.jpg' alt='Photo' />`, right: `<img ngSrc='/photo.jpg' width='800' height='600' alt='Photo' />`, explanation: 'NgOptimizedImage requires explicit width and height on every non-fill image so the browser can reserve space before the image loads, preventing CLS.'  },
    { title: 'Using priority on every above-fold image', wrong: `<!-- Wrong: priority on multiple images wastes preload slots -->
<img ngSrc='/hero.jpg' width='800' height='400' priority alt='Hero' />
<img ngSrc='/card1.jpg' width='400' height='300' priority alt='Card 1' />`, right: `<!-- Correct: priority only on the single LCP image -->
<img ngSrc='/hero.jpg' width='800' height='400' priority alt='Hero' />
<img ngSrc='/card1.jpg' width='400' height='300' alt='Card 1' />`, explanation: 'Only one image per page should carry priority — the Largest Contentful Paint element. Adding it to multiple images competes for the same preload slots and can slow down the actual LCP image.'  },
    { title: 'Using fill without positioning the container', wrong: `<!-- Wrong: container has no position, fill image escapes layout -->
<div style='height:300px;'>
  <img ngSrc='/hero.jpg' fill alt='Hero' />
</div>`, right: `<!-- Correct: container is positioned so fill image stays inside -->
<div style='position:relative; height:300px;'>
  <img ngSrc='/hero.jpg' fill alt='Hero' style='object-fit:cover;' />
</div>`, explanation: 'fill mode absolutely positions the image to its nearest positioned ancestor. Without position:relative on the container the image overflows or collapses to zero size.'  },
    { title: 'Keeping NgOptimizedImage out of the imports array', wrong: `// Wrong: NgOptimizedImage not imported — directive is unknown
@Component({
  selector: 'app-gallery',
  template: '<img ngSrc="/photo.jpg" width="400" height="300" alt="" />',
})
export class GalleryComponent {}`, right: `// Correct: NgOptimizedImage added to imports
@Component({
  selector: 'app-gallery',
  imports: [NgOptimizedImage],
  template: '<img ngSrc="/photo.jpg" width="400" height="300" alt="" />',
})
export class GalleryComponent {}`, explanation: 'NgOptimizedImage is not part of CommonModule. It must be explicitly added to the standalone component\'s imports array (or an NgModule\'s imports) before ngSrc is recognised.'  },
  ];

  versionItems: VersionInfo[] = [
    { version: 'Angular 15', label: 'NgOptimizedImage stable', features: ['NgOptimizedImage graduated from developer preview to stable in Angular 15', 'Built-in CDN loaders added: provideCloudinaryLoader, provideImgixLoader, provideImageKitLoader', 'ngSrcset directive introduced for declarative responsive image generation', 'IMAGE_LOADER token available for fully custom CDN URL transformation'] },
    { version: 'Angular 17', label: 'fill and srcset improvements', features: ['fill mode stabilised — makes the image fill its nearest positioned ancestor without fixed width/height', 'Improved developer warnings for oversized images and missing preconnect hints', 'Works seamlessly in standalone components introduced broadly in Angular 17'] },
  ];

  challenge: Challenge = {
    title: 'Build a Responsive Image Card with NgOptimizedImage',
    description: 'Create an Angular component that displays a product image card using NgOptimizedImage. The card must use a fixed-size image with explicit width/height to prevent CLS, mark the first image as the LCP priority image, and add a responsive srcset so the browser can pick the right size. A second card should use fill mode inside a fixed-height container.',
    language: 'html',
    hints: [
      'Replace the standard src attribute with ngSrc on your img elements — NgOptimizedImage will not activate without it.',
      'The priority attribute takes no value: write it as just priority on the first img tag.',
      'For fill mode, the parent container needs position: relative and an explicit height (e.g. height: 200px) in its inline style or CSS class.',
      'Add ngSrcset=\'400w, 800w, 1200w\' alongside ngSrc to let the browser automatically select the right resolution for the device.',
    ],
    starterCode: `<div class="cards">

  <!-- Card 1: Fixed-size LCP image with responsive srcset -->
  <!-- TODO: Replace <img src> with NgOptimizedImage directive -->
  <!-- TODO: Add explicit width and height -->
  <!-- TODO: Mark as the LCP priority image -->
  <!-- TODO: Add ngSrcset for 400w, 800w, and 1200w -->
  <div class="card">
    <img
      src="https://picsum.photos/seed/product1/800/600"
      alt="Featured product"
    />
    <p>Featured Product (LCP)</p>
  </div>

  <!-- Card 2: Fill mode image inside a fixed-height container -->
  <!-- TODO: Convert to fill mode — remove fixed width/height -->
  <!-- TODO: Add position:relative and height:200px to the wrapper div -->
  <div class="card">
    <div class="img-container">
      <img
        src="https://picsum.photos/seed/product2/800/600"
        alt="Secondary product"
      />
    </div>
    <p>Secondary Product (fill)</p>
  </div>

</div>`,
    solution: `<div class="cards">

  <!-- Card 1: Fixed-size LCP image with responsive srcset -->
  <div class="card">
    <img
      ngSrc="https://picsum.photos/seed/product1/800/600"
      width="800"
      height="600"
      alt="Featured product"
      priority
      ngSrcset="400w, 800w, 1200w"
      style="max-width:100%; border-radius:8px;"
    />
    <p>Featured Product (LCP)</p>
  </div>

  <!-- Card 2: Fill mode image inside a fixed-height container -->
  <div class="card">
    <div class="img-container" style="position:relative; height:200px; border-radius:8px; overflow:hidden;">
      <img
        ngSrc="https://picsum.photos/seed/product2/800/600"
        fill
        alt="Secondary product"
        style="object-fit:cover;"
      />
    </div>
    <p>Secondary Product (fill)</p>
  </div>

</div>`,
  };
}
