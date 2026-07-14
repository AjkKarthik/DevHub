import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  standalone: true,
  imports: [PageMetaComponent, TheoryBlockComponent, CodeBlockComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent, SubtopicEyebrowComponent],
  templateUrl: './oninitializedasync-genuinely-runs-twice-during-prerender-then-hydrate.html',
  styleUrl: './oninitializedasync-genuinely-runs-twice-during-prerender-then-hydrate.scss'
})
export class OninitializedasyncGenuinelyRunsTwiceDuringPrerenderThenHydrateSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'Two full renders, two full lifecycle passes — by design, not by accident',
      points: [
        'The main page states this plainly, but the reason is worth walking through: by default, an interactive-mode component (InteractiveServer or InteractiveWebAssembly) still gets PRERENDERED first — Blazor runs the ENTIRE component lifecycle once server-side to produce initial static HTML for a fast first paint, before any interactive runtime (SignalR circuit or WASM) has even connected.',
        'Once the interactive runtime DOES connect (the SignalR circuit opens, or the WASM app finishes booting), Blazor runs the component lifecycle a SECOND time, from scratch, to establish the actual live, interactive component instance — this is a completely separate object from the one that ran during prerendering, not a resumption of it.',
        'This means any lifecycle method — OnInitialized, OnInitializedAsync, OnParametersSet — genuinely executes twice for a normal interactive component: once during the disposable prerender pass, once during the real interactive startup.',
      ]
    },
    {
      heading: 'Why this becomes a real bug the moment initialization logic is not idempotent',
      points: [
        'A GET request to fetch data (Products.GetAllAsync()) is idempotent — running it twice fetches the same data twice, wasteful but harmless. A POST-like side effect (incrementing a visit counter, sending a welcome email, appending to an audit log) is NOT idempotent — running it twice during prerender-then-hydrate genuinely double-counts, double-sends, or double-logs, even though the code looks completely correct in isolation.',
        'The fix depends on the specific side effect: for wasted-but-harmless double-fetches, PersistentComponentState avoids the redundant work entirely (the prerendered result is embedded in the page and reused rather than re-fetched); for genuinely non-idempotent side effects, prerendering must be disabled outright for that component (@rendermode="new InteractiveServerRenderMode(prerender: false)"), since no amount of state-sharing changes the fact that the side-effecting code itself must only run once.',
        'Distinguishing these two cases — "wasteful re-fetch, fixable with persisted state" versus "genuine double side-effect, needs prerendering disabled" — is the practical skill this topic is really testing; treating every double-execution symptom with the same fix is itself a common mistake.',
      ]
    }
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'The harmless case — wasted double-fetch',
      language: 'csharp',
      code: `@page "/products"
@rendermode InteractiveServer
@inject ProductService Products

<h1>Products (@productList.Count)</h1>

@code {
    private List<Product> productList = new();

    protected override async Task OnInitializedAsync()
    {
        // Runs TWICE: once during prerender (produces the initial HTML),
        // once again when the real interactive circuit connects.
        // Wasteful (two DB round-trips instead of one) but NOT harmful —
        // GetAllAsync() is a read, so the second call just re-fetches
        // the same (or very slightly staler) data.
        productList = await Products.GetAllAsync();
    }
}`,
    },
    {
      label: 'The dangerous case — a genuine double side-effect',
      language: 'csharp',
      code: `@page "/article/{id}"
@rendermode InteractiveServer
@inject AnalyticsService Analytics

<h1>@article.Title</h1>
<p>@article.Body</p>

@code {
    [Parameter] public string Id { get; set; } = "";
    private Article article = default!;

    protected override async Task OnInitializedAsync()
    {
        article = await ArticleService.GetAsync(Id);

        // BUG: this runs TWICE — once during prerender, once during
        // real interactive startup — silently double-counting every
        // single page view. Not a rare edge case; this happens on
        // EVERY normal page load with the default prerender: true.
        await Analytics.RecordViewAsync(Id);
    }
}`,
    },
    {
      label: 'The fix — disable prerendering for non-idempotent components',
      language: 'csharp',
      code: `@page "/article/{id}"
@rendermode @(new InteractiveServerRenderMode(prerender: false))
@inject AnalyticsService Analytics

<h1>@article.Title</h1>
<p>@article.Body</p>

@code {
    [Parameter] public string Id { get; set; } = "";
    private Article article = default!;

    protected override async Task OnInitializedAsync()
    {
        article = await ArticleService.GetAsync(Id);

        // Now runs exactly ONCE — with prerendering disabled, there is
        // no separate prerender pass, only the real interactive
        // component's own single lifecycle run.
        await Analytics.RecordViewAsync(Id);
    }
}
// Trade-off: this component no longer gets fast prerendered HTML —
// the browser sees a blank/loading state until the interactive
// runtime fully connects, since there's no static-HTML fallback
// produced ahead of time.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A developer notices OnInitializedAsync runs twice on their InteractiveServer-mode page and "fixes" it by adding a static bool field (private static bool hasRun = false;) checked at the top of the method, reasoning that the second call will see hasRun == true and skip the work. Does this reliably prevent the double execution?',
    hint: 'Think about WHAT gets a fresh instance during the prerender-to-interactive transition — is the static field shared between the prerendered instance and the later interactive instance, and what about DIFFERENT USERS hitting the same page?',
    solution: 'This is unreliable and introduces a worse bug. A static field IS shared across the prerendered instance and the later interactive instance (both run within the same server process, unlike the InteractiveAuto Server-to-WASM case), so it MIGHT suppress the second call for a single user\'s own request — but it is also shared across EVERY user hitting the same page on the same server process. The first user\'s prerender sets hasRun to true, and now EVERY subsequent user\'s OnInitializedAsync — both their prerender AND their real interactive pass — gets silently skipped, since the static field never resets. The correct fix is the one the main page and this subtopic actually document: disable prerendering for genuinely non-idempotent initialization logic (prerender: false), which prevents the redundant pass from happening at all, scoped correctly per-request rather than leaking state across users via a static field.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'OnInitializedAsync running twice is an occasional glitch that happens under specific conditions (slow network, particular browsers) — most of the time it runs once as expected.',
      reality: 'This is default, expected behavior for EVERY interactive-mode component with prerendering enabled (the .NET 8 default) — it happens on every single normal page load, not as an intermittent glitch. The main page and this subtopic both confirm it is the prerender-then-hydrate lifecycle working exactly as designed, not something to "catch" as a bug in the framework.'
    },
    {
      thought: 'The fix for double-executing initialization logic is always to disable prerendering, since that is the root cause of the double call.',
      reality: 'Disabling prerendering is the correct fix ONLY for genuinely non-idempotent side effects (analytics recording, sending emails, incrementing counters) — for a simple data-fetch, PersistentComponentState is the better fix, since it PRESERVES the fast-prerendered-HTML benefit while avoiding the redundant second fetch, rather than giving up prerendering\'s performance benefit entirely.'
    },
    {
      thought: 'A static field or in-memory flag is a reasonable, low-effort way to guard against a lifecycle method running twice for the same page load.',
      reality: 'This subtopic\'s exercise shows a static-field guard is actively dangerous, not just ineffective — because the prerender and interactive passes for a SINGLE user\'s request share the same server process as every OTHER concurrent user\'s requests, a naive static flag silently breaks initialization for every subsequent user once the first one sets it, a much worse bug than the original double-execution it was meant to prevent.'
    }
  ];
}
