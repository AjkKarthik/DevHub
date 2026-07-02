import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../shared/theory-block/theory-block';
import { LivePlaygroundComponent, PlaygroundFile } from '../../../../shared/live-playground/live-playground';
import { TryItComponent, TryItExercise } from '../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-custom-loader-with-blur-up-lqip-placeholder-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent,
    LivePlaygroundComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './custom-loader-with-blur-up-lqip-placeholder.html',
  styleUrl: './custom-loader-with-blur-up-lqip-placeholder.scss',
})
export class CustomLoaderWithBlurUpLqipPlaceholderSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'placeholder needs TWO images, not one — a loader must produce both',
      points: [
        'The main topic mentions <code>placeholder</code> as "a loader that supports small-width requests" without showing the mechanics — this subtopic builds it. A blur-up loader is really TWO functions in one: the regular loader (full-resolution URL for the given width) and a tiny-width variant that the <code>placeholder</code> input requests internally, at a very small width (Angular calls the SAME loader function with a much smaller <code>width</code> value automatically when <code>placeholder</code> is set).',
        'Your custom <code>IMAGE_LOADER</code> function does not need a separate code path for the placeholder — it just needs to correctly honor whatever <code>width</code> it is called with. If your CDN supports on-the-fly resizing (Cloudinary, Imgix), requesting <code>width: 20</code> naturally returns a tiny blurred-looking image; NgOptimizedImage handles displaying it and cross-fading to the full image once loaded.',
      ],
    },
    {
      heading: 'The cross-fade is CSS, driven by the image\'s load event — not a separate component',
      points: [
        'NgOptimizedImage renders the placeholder as a blurred <code>background-image</code> or a stacked <code>&lt;img&gt;</code> element depending on version, and swaps it out once the full <code>ngSrc</code> image fires its native <code>load</code> event. The blur effect itself is plain CSS — <code>filter: blur(20px)</code> scaled up slightly to hide the blurred edges (<code>transform: scale(1.1)</code>) — you do not need to write any JavaScript to orchestrate the swap.',
        'If your CDN has NO resizing capability at all (a plain static file server), you can still implement <code>placeholder</code> by having your custom loader return a hand-crafted tiny base64 data URI for the placeholder width range and the real path for larger widths — this trades a slightly larger inline payload for guaranteed placeholder support without CDN dependency.',
      ],
    },
    {
      heading: 'When blur-up is worth the complexity — and when it is not',
      points: [
        'Blur-up meaningfully helps perceived performance on SLOW connections or LARGE hero images where the full image takes over a second to arrive — the blurred preview signals "content is coming" rather than a blank space. On fast connections or small images, the full image often arrives before a user would even register the placeholder, making the extra loader complexity not worth it.',
        'Never combine <code>placeholder</code> with <code>priority</code> in a way that assumes the placeholder ITSELF needs preloading — the placeholder is intentionally tiny and fast; only the full-resolution image benefits from the <code>priority</code> preload hint.',
      ],
    },
  ];

  liveDemoFiles: PlaygroundFile[] = [
    {
      path: 'src/app/blur-loader.ts',
      content: `import { ImageLoaderConfig } from '@angular/common';

// A single loader function handles BOTH the full-size request and the
// tiny placeholder request — NgOptimizedImage calls it with a very small
// "width" automatically when the placeholder input is set on the image.
export function blurCdnLoader(config: ImageLoaderConfig): string {
  const { src, width } = config;
  // Simulated CDN resizing syntax — swap for your real CDN's URL pattern
  return \`https://cdn.example.com/\${src}?w=\${width}&auto=format\`;
}

// Fallback for CDNs with no resizing support: hand-pick a tiny base64
// placeholder per image instead of relying on a resized URL.
const STATIC_PLACEHOLDERS: Record<string, string> = {
  'hero.jpg': 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD...(tiny blurred jpeg)',
};

export function staticFallbackLoader(config: ImageLoaderConfig): string {
  if (config.width && config.width <= 30 && STATIC_PLACEHOLDERS[config.src]) {
    return STATIC_PLACEHOLDERS[config.src];
  }
  return \`/assets/\${config.src}\`;
}
`,
    },
    {
      path: 'src/app/app.ts',
      content: `import { Component } from '@angular/core';
import { NgOptimizedImage } from '@angular/common';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [NgOptimizedImage],
  template: \`
    <h3>Blur-up placeholder demo</h3>
    <p>The image below requests a tiny blurred placeholder first, then swaps to the
    full-resolution version once it loads — watch the network tab for two requests to
    the same loader with very different "w" values.</p>
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
export class App {}
`,
    },
    {
      path: 'src/main.ts',
      content: `import { bootstrapApplication } from '@angular/platform-browser';
import { IMAGE_LOADER } from '@angular/common';
import { App } from './app/app';
import { blurCdnLoader } from './app/blur-loader';

bootstrapApplication(App, {
  providers: [
    { provide: IMAGE_LOADER, useValue: blurCdnLoader },
  ],
});
`,
    },
    {
      path: 'src/index.html',
      content: `<!doctype html>
<html>
  <head><title>Custom loader with blur-up LQIP placeholder</title></head>
  <body><app-root></app-root></body>
</html>
`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'Switch the app to use staticFallbackLoader instead of blurCdnLoader, and add a "hero.jpg" entry to STATIC_PLACEHOLDERS with a placeholder base64 string.',
    hint: 'Change the IMAGE_LOADER provider useValue to staticFallbackLoader, then add a key to the STATIC_PLACEHOLDERS record matching the ngSrc value used in the template.',
    solution: `// main.ts
providers: [
  { provide: IMAGE_LOADER, useValue: staticFallbackLoader },
],

// blur-loader.ts
const STATIC_PLACEHOLDERS: Record<string, string> = {
  'hero.jpg': 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQ...(your tiny blurred jpeg)',
};`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'the placeholder input requires a completely separate loader function from the regular ngSrc loader.',
      reality: 'the SAME loader function is called for both — NgOptimizedImage just invokes it with a much smaller width value for the placeholder request; the loader only needs to correctly honor whatever width it receives.',
    },
    {
      thought: 'the blur-up cross-fade effect requires custom JavaScript to detect when the full image has loaded and swap it in.',
      reality: 'the swap is driven by the image element\'s native load event and rendered via plain CSS (blur filter + scale) — no JavaScript orchestration is needed from application code.',
    },
    {
      thought: 'placeholder should always be combined with priority since both relate to image loading performance.',
      reality: 'priority preloads the FULL-resolution image; the placeholder is intentionally tiny and loads fast regardless — there is no need or benefit to "prioritizing" the placeholder itself.',
    },
  ];
}
