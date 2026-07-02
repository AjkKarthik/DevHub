import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../shared/theory-block/theory-block';
import { LivePlaygroundComponent, PlaygroundFile } from '../../../../shared/live-playground/live-playground';
import { TryItComponent, TryItExercise } from '../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-placeholder-loading-error-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent,
    LivePlaygroundComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './placeholder-loading-error.html',
  styleUrl: './placeholder-loading-error.scss',
})
export class PlaceholderLoadingErrorSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: '@placeholder — what shows before any trigger fires',
      points: [
        '<code>&#64;placeholder</code> renders immediately, before any trigger fires and before any download starts. Keep it LIGHTWEIGHT — a skeleton card, a spinner icon, or even empty space. A heavy placeholder defeats the entire purpose of deferring the real content.',
        '<code>&#64;placeholder (after 100ms) { ... }</code> delays showing the placeholder until loading has ALREADY taken longer than the given duration — this prevents a skeleton flashing on screen for content that turns out to load near-instantly on a fast connection.',
      ],
    },
    {
      heading: '@loading — what shows while the chunk is actually downloading',
      points: [
        '<code>&#64;loading</code> replaces <code>&#64;placeholder</code> once the trigger fires and the network fetch begins. <code>&#64;loading (minimum 500ms) { ... }</code> ensures the loading indicator stays visible for AT LEAST that duration — without it, a fast network can cause a jarring one-frame flash of the spinner that is more distracting than no spinner at all.',
      ],
    },
    {
      heading: '@error — what shows if the download genuinely fails',
      points: [
        '<code>&#64;error</code> renders specifically when the chunk DOWNLOAD fails — offline, a 404, a CDN outage. Without an <code>&#64;error</code> block, a failed download just leaves the user staring at nothing, with no indication anything went wrong. Provide a retry button or at least a clear fallback message.',
      ],
    },
    {
      heading: 'All three are optional — but not free to skip in production',
      points: [
        'A bare <code>&#64;defer { ... }</code> with none of the companion blocks is perfectly valid syntax — it simply renders nothing until the chunk loads. But in real production UI, always include at LEAST <code>&#64;placeholder</code> and <code>&#64;loading</code>, to avoid layout shift and a confusing blank period where the user has no idea whether anything is happening.',
      ],
    },
  ];

  liveDemoFiles: PlaygroundFile[] = [
    {
      path: 'src/app/slow-widget.ts',
      content: `import { Component } from '@angular/core';

@Component({
  selector: 'app-slow-widget',
  standalone: true,
  template: \`<p>✅ Loaded! (imagine this chunk took a while to download)</p>\`,
})
export class SlowWidget {}
`,
    },
    {
      path: 'src/app/app.ts',
      content: `import { Component, signal } from '@angular/core';
import { SlowWidget } from './slow-widget';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [SlowWidget],
  template: \`
    <button (click)="show.set(true)">Load the widget</button>

    @defer (when show()) {
      <app-slow-widget />
    } @placeholder (after 100ms) {
      <p>⬜ Placeholder (only appears if loading takes > 100ms)</p>
    } @loading (minimum 800ms) {
      <p>⏳ Loading... (shown for AT LEAST 800ms, even on a fast connection)</p>
    } @error {
      <p>❌ Failed to load — check your connection and try again.</p>
    }
  \`,
})
export class App {
  show = signal(false);
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
  <head><title>@placeholder, @loading, @error</title></head>
  <body><app-root></app-root></body>
</html>
`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'Change the @loading block\'s minimum duration to 200ms instead of 800ms, and observe (conceptually) how a shorter minimum reduces perceived wait time on fast connections while still avoiding a one-frame flash.',
    hint: 'Just change the number: @loading (minimum 200ms) { ... } — the minimum value is a straightforward tradeoff: too short risks a flash on fast connections, too long makes even fast loads feel artificially slow.',
    solution: `@loading (minimum 200ms) {
  <p>⏳ Loading...</p>
}`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'you must include all three companion blocks (@placeholder, @loading, @error) or the @defer block will not compile.',
      reality: 'a bare @defer { ... } with NO companion blocks at all is completely valid — it just renders nothing until the content loads. All three are optional, though skipping them in production UI risks layout shift and a confusing blank period.',
    },
    {
      thought: '@loading shows for exactly as long as the actual download takes, with no way to guarantee a minimum display time.',
      reality: '@loading (minimum Xms) exists specifically to guarantee a MINIMUM display duration, regardless of how fast the actual download finishes — this prevents a jarring one-frame flash of the loading indicator on fast connections.',
    },
    {
      thought: '@error fires for any kind of runtime error inside the deferred component, not just download failures.',
      reality: '@error is specifically for the chunk DOWNLOAD failing (offline, 404, CDN outage) — it has nothing to do with runtime errors thrown by the component\'s own code once it has successfully loaded and rendered.',
    },
  ];
}
