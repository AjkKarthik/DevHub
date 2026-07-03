import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../shared/theory-block/theory-block';
import { LivePlaygroundComponent, PlaygroundFile } from '../../../../shared/live-playground/live-playground';
import { TryItComponent, TryItExercise } from '../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-measuring-lcp-impact-with-performanceobserver-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent,
    LivePlaygroundComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './measuring-lcp-impact-with-performanceobserver.html',
  styleUrl: './measuring-lcp-impact-with-performanceobserver.scss',
})
export class MeasuringLcpImpactWithPerformanceobserverSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The browser reports LCP directly — no manual timing math needed',
      points: [
        'Unlike navigation timing (which requires computing a duration between two events yourself), the Largest Contentful Paint metric is reported DIRECTLY by the browser via <code>PerformanceObserver</code> with <code>type: \'largest-contentful-paint\'</code>. Each entry\'s <code>startTime</code> IS the LCP timestamp — no subtraction needed.',
        '<code>new PerformanceObserver(list =&gt; { ... }).observe({ type: \'largest-contentful-paint\', buffered: true })</code> — the <code>buffered: true</code> option is essential; without it, the observer only sees entries reported AFTER it starts observing, missing LCP candidates that occurred during initial page load before your Angular code even ran.',
      ],
    },
    {
      heading: 'LCP can fire MULTIPLE times per page — only the last one counts',
      points: [
        'As the browser paints progressively larger content, it may report several <code>largest-contentful-paint</code> entries over the course of a page load, each one superseding the last. The FINAL entry (until the user\'s first interaction, which freezes LCP) is the one that determines the Core Web Vitals score — always take the LAST entry from the list, not the first.',
        'This is directly relevant to the <code>priority</code> attribute: without it, a hero image might arrive AFTER text has already painted, making the image itself the final (and larger) LCP candidate at a late timestamp. With <code>priority</code>, the same image arrives earlier, producing an earlier final LCP entry — the measurable proof the preload hint worked.',
      ],
    },
    {
      heading: 'A/B comparison in one demo — priority on vs off, same image',
      points: [
        'To PROVE the effect (not just assert it), run the same hero image twice — once with <code>priority</code> and once without — each in a fresh navigation (LCP is per-page-load, it cannot be reset mid-session), and log the LCP <code>startTime</code> for each. The gap between the two numbers is the real, measured benefit of <code>priority</code> for that specific image and connection speed, which will vary — on a fast cached connection the gap may be small; on a slow first load it can be substantial.',
        'For production monitoring (not just local demos), send the LCP value to your analytics/RUM (Real User Monitoring) endpoint inside the observer callback — this is how tools like web-vitals.js capture and report the metric from real users across many devices and connection speeds, rather than trusting a single local measurement.',
      ],
    },
  ];

  liveDemoFiles: PlaygroundFile[] = [
    {
      path: 'src/app/lcp-observer.ts',
      content: `// Reports LCP directly from the browser — buffered:true catches entries
// that fired before this code even ran.
export function observeLcp(onReport: (lcpMs: number, element: string) => void): void {
  if (!('PerformanceObserver' in window)) return;

  const observer = new PerformanceObserver((list) => {
    const entries = list.getEntries() as PerformanceEntry[];
    // Multiple entries can arrive as painting progresses — only the LAST
    // one (until user interaction freezes it) is the real LCP value.
    const lastEntry = entries[entries.length - 1] as any;
    if (lastEntry) {
      const elementDescription = lastEntry.element?.tagName ?? 'unknown';
      onReport(lastEntry.startTime, elementDescription);
    }
  });

  observer.observe({ type: 'largest-contentful-paint', buffered: true });
}
`,
    },
    {
      path: 'src/app/app.ts',
      content: `import { Component, OnInit } from '@angular/core';
import { NgOptimizedImage } from '@angular/common';
import { observeLcp } from './lcp-observer';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [NgOptimizedImage],
  template: \`
    <h3>Measuring LCP with PerformanceObserver</h3>
    <p>Open the console — the LCP timestamp for this hero image (with priority set) is
    logged as soon as the browser reports it. Compare against the "no priority" variant
    in the Try It exercise.</p>
    <img
      ngSrc="hero.jpg"
      width="1200"
      height="600"
      alt="Hero"
      priority
    />
  \`,
})
export class App implements OnInit {
  ngOnInit() {
    observeLcp((lcpMs, element) => {
      console.log(\`LCP reported: \${lcpMs.toFixed(0)}ms — element: <\${element.toLowerCase()}>\`);
    });
  }
}
`,
    },
    {
      path: 'src/main.ts',
      content: `import { bootstrapApplication } from '@angular/platform-browser';
import { App } from './app/app';

bootstrapApplication(App);
`,
    },
    {
      path: 'src/index.html',
      content: `<!doctype html>
<html>
  <head><title>Measuring LCP impact with PerformanceObserver</title></head>
  <body><app-root></app-root></body>
</html>
`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'Create a second variant of the app WITHOUT the priority attribute on the same hero image, and compare the logged LCP timestamps between the two versions.',
    hint: 'Remove priority from the img element in a copy of app.ts, run both variants (in separate tabs or navigations, since LCP is per-page-load), and compare the LCP startTime values logged to the console.',
    solution: `// No-priority variant — remove the priority attribute
<img
  ngSrc="hero.jpg"
  width="1200"
  height="600"
  alt="Hero"
  <!-- priority removed -->
/>

// Same observeLcp() call logs a LATER startTime than the priority
// version, since the image is no longer preloaded via <link rel="preload">
// and competes with other resources for bandwidth after HTML parsing.`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'measuring LCP requires manually timing how long the image element takes to load, similar to Navigation Timing.',
      reality: 'the browser reports LCP directly via PerformanceObserver with type "largest-contentful-paint" — the entry\'s startTime IS the LCP value, no manual duration calculation needed.',
    },
    {
      thought: 'the FIRST largest-contentful-paint entry reported is the final LCP score for the page.',
      reality: 'multiple entries can be reported as painting progresses, each superseding the last — only the LAST entry (until user interaction freezes it) is the value that counts for Core Web Vitals.',
    },
    {
      thought: 'a PerformanceObserver started inside an Angular component will see every LCP candidate that occurred on the page.',
      reality: 'without the buffered:true option, the observer only sees entries reported AFTER it starts observing — it can miss LCP candidates painted during initial load before Angular\'s JavaScript even executes.',
    },
  ];
}
