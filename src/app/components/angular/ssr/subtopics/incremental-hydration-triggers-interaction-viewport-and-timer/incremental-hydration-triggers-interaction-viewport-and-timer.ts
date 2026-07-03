import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../shared/theory-block/theory-block';
import { LivePlaygroundComponent, PlaygroundFile } from '../../../../shared/live-playground/live-playground';
import { TryItComponent, TryItExercise } from '../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-incremental-hydration-triggers-interaction-viewport-and-timer-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent,
    LivePlaygroundComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './incremental-hydration-triggers-interaction-viewport-and-timer.html',
  styleUrl: './incremental-hydration-triggers-interaction-viewport-and-timer.scss',
})
export class IncrementalHydrationTriggersInteractionViewportAndTimerSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'One paragraph in the main topic, one trigger shown — there are several',
      points: [
        'The main SSR page mentions incremental hydration in a single paragraph and shows exactly ONE trigger example: <code>@defer (hydrate on viewport)</code>. In practice, <code>hydrate</code> supports the SAME trigger vocabulary as regular <code>@defer</code> loading — <code>on interaction</code>, <code>on viewport</code>, <code>on timer</code>, <code>on idle</code>, <code>on immediate</code>, and <code>on hover</code> — each suited to a different kind of below-the-fold or non-critical UI, and choosing the right one matters for actual perceived performance.',
      ],
    },
    {
      heading: 'What "dehydrated" actually means for a hydrate-deferred block',
      points: [
        'A <code>@defer (hydrate on X)</code> block IS still server-rendered — its HTML is present and visible in the initial page load, exactly like non-deferred content. What\'s DEFERRED is specifically the JavaScript cost of ATTACHING event listeners and making the block interactive — the block looks fully rendered but doesn\'t respond to clicks/inputs until its trigger fires and hydration for that block completes.',
        'This is a fundamentally different trade-off than a REGULAR (non-hydrate) <code>@defer</code> block, which delays even the initial HTML/render until the trigger fires (showing a <code>@placeholder</code> in the meantime) — a hydrate-deferred block\'s content is visible IMMEDIATELY (good for LCP/perceived load), only its interactivity is delayed (a much smaller, more targeted cost than delaying the content itself).',
      ],
    },
    {
      heading: 'Choosing a trigger by what the block actually is',
      points: [
        '<code>hydrate on interaction</code> — hydrates the FIRST TIME the user clicks, taps, or focuses inside the block. Ideal for below-the-fold interactive widgets a user might never touch on a given visit (a comment form, an "advanced options" accordion) — if they never interact, that JS cost is never paid at all.',
        '<code>hydrate on viewport</code> — hydrates when the block scrolls into view (via <code>IntersectionObserver</code>). Ideal for below-the-fold content the user is LIKELY to reach by scrolling but that isn\'t needed for the initial paint — a related-products carousel, a comments section further down the page.',
        '<code>hydrate on timer(Xms)</code> — hydrates after a fixed delay regardless of user behavior. Useful for content that should become interactive soon but where the exact timing doesn\'t matter — deprioritizing it slightly below the CRITICAL above-the-fold interactive elements without tying it to a specific user action.',
        '<code>hydrate on idle</code> — hydrates once the browser reports it is idle (via <code>requestIdleCallback</code>), letting more urgent work (parsing, the main thread\'s own critical hydration) finish first. This is often the SAFEST default for "should eventually be interactive but isn\'t urgent" content, since it naturally adapts to how busy the browser currently is instead of a fixed guess.',
        'Combine WITH a <code>hydrate on X; hydrate when Y</code> compound trigger (mirroring regular <code>@defer</code>\'s trigger-combination syntax) — e.g. <code>hydrate on viewport; hydrate on interaction</code> — hydrates on WHICHEVER trigger fires first, useful when a block should become interactive either when scrolled to OR when clicked, whichever happens first.',
      ],
    },
    {
      heading: 'Interaction with withEventReplay() — nothing is lost in the gap',
      points: [
        'A common worry: "what if a user clicks a still-dehydrated block before its trigger fires?" — this is EXACTLY what <code>withEventReplay()</code> (covered in the main topic) solves generally for hydration, and it applies identically here: a click on a dehydrated block is CAPTURED, and once that block\'s hydration completes (triggered by that very click, in the case of <code>hydrate on interaction</code>), the captured event is replayed so the click still registers as if hydration had already finished.',
        'This means <code>hydrate on interaction</code> specifically has a neat self-fulfilling property: the interaction that TRIGGERS hydration is the SAME interaction that gets replayed once hydration completes — the user experiences a (typically imperceptibly brief) hydration delay, not a dropped click.',
      ],
    },
  ];

  liveDemoFiles: PlaygroundFile[] = [
    {
      path: 'src/app/comment-form.component.ts',
      content: `import { Component, signal } from '@angular/core';

@Component({
  selector: 'app-comment-form',
  standalone: true,
  template: \`
    <form (submit)="submitted.set(true); $event.preventDefault()">
      <textarea placeholder="Write a comment…"></textarea>
      <button type="submit">Post</button>
    </form>
    @if (submitted()) { <p>Thanks for your comment!</p> }
  \`,
})
export class CommentFormComponent {
  submitted = signal(false);
}
`,
    },
    {
      path: 'src/app/related-products.component.ts',
      content: `import { Component } from '@angular/core';

@Component({
  selector: 'app-related-products',
  standalone: true,
  template: \`
    <h3>Related products</h3>
    <ul>
      <li>Product A</li>
      <li>Product B</li>
      <li>Product C</li>
    </ul>
  \`,
})
export class RelatedProductsComponent {}
`,
    },
    {
      path: 'src/app/app.ts',
      content: `import { Component } from '@angular/core';
import { CommentFormComponent } from './comment-form.component';
import { RelatedProductsComponent } from './related-products.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommentFormComponent, RelatedProductsComponent],
  template: \`
    <h3>Incremental hydration triggers</h3>
    <p>Critical above-the-fold content — hydrated immediately, no @defer here.</p>

    <article>
      <h4>Article content</h4>
      <p>The main article body renders and hydrates normally — it's the most
      important content on the page.</p>

      <!-- hydrate on interaction — the comment form's JS cost is never paid
           at all if this particular visitor never clicks into it. -->
      @defer (hydrate on interaction) {
        <app-comment-form />
      } @placeholder {
        <!-- Note: hydrate-deferred blocks are still server-rendered — this
             placeholder is what shows ONLY for a client-side-only defer,
             not during SSR itself. Included here to show the full syntax. -->
        <p>Loading comment form…</p>
      }

      <!-- hydrate on viewport — hydrates once scrolled into view; content
           further down a long article that most readers WILL reach. -->
      @defer (hydrate on viewport) {
        <app-related-products />
      } @placeholder {
        <p>Loading related products…</p>
      }
    </article>
  \`,
})
export class App {}
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
  <head><title>Incremental Hydration Triggers</title></head>
  <body><app-root></app-root></body>
</html>
`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'Add a third <code>@defer</code> block for a "Newsletter signup" widget that should hydrate on WHICHEVER comes first: the user scrolling it into view, OR clicking directly into it — using a compound trigger.',
    hint: 'Use the compound trigger syntax: @defer (hydrate on viewport; hydrate on interaction) { <app-newsletter-signup /> } @placeholder { <p>Loading newsletter signup…</p> } — this hydrates on whichever trigger fires first.',
    solution: `@defer (hydrate on viewport; hydrate on interaction) {
  <app-newsletter-signup />
} @placeholder {
  <p>Loading newsletter signup…</p>
}

// Whichever trigger fires FIRST wins — if the user scrolls it into view
// before clicking, viewport hydration runs; if they click before it's
// scrolled into view (e.g. via a "skip to newsletter" link), interaction
// hydration runs instead. Either way, hydration happens exactly once.`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'a <code>@defer (hydrate on viewport)</code> block\'s HTML is not present in the initial page load — it appears only once scrolled into view, similar to a regular @defer block.',
      reality: 'a hydrate-deferred block IS still server-rendered and visible immediately in the initial HTML — what\'s deferred is specifically the JavaScript cost of attaching event listeners, not the content itself. This is a fundamentally smaller, more targeted deferral than a regular (non-hydrate) @defer block.',
    },
    {
      thought: 'a user clicking a still-dehydrated "hydrate on interaction" block before hydration completes will have that click silently dropped.',
      reality: 'withEventReplay() captures the click and replays it once that block\'s hydration completes — hydrate on interaction has a neat self-fulfilling property where the SAME click that triggers hydration is the one that gets replayed afterward, so the click still registers.',
    },
    {
      thought: '<code>hydrate on viewport</code> is always the right choice for any below-the-fold content.',
      reality: 'the right trigger depends on what the content actually is — hydrate on interaction is better for content a user might never touch (deferring the JS cost entirely if they don\'t), while hydrate on idle adapts to how busy the browser currently is rather than tying hydration to a specific user action or scroll position.',
    },
  ];
}
