import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../components/shared/page-meta/page-meta';
import { QuickRefComponent, QuickRefItem } from '../../../../components/shared/quick-ref/quick-ref';
import { TheoryBlockComponent, TheoryPoint } from '../../../../components/shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../components/shared/code-block/code-block';
import { CommonMistakesComponent, CommonMistake } from '../../../../components/shared/common-mistakes/common-mistakes';
import { ChallengeBlockComponent, Challenge } from '../../../../components/shared/challenge-block/challenge-block';
import { QuizBlockComponent, QuizQuestion } from '../../../../components/shared/quiz-block/quiz-block';
import { QnaBlockComponent, QnaItem } from '../../../../components/shared/qna-block/qna-block';
import { RevisionCardComponent, RevisionSummary } from '../../../../components/shared/revision-card/revision-card';
import { PageCompleteComponent } from '../../../../components/shared/page-complete/page-complete';

@Component({
  selector: 'app-blazor-streaming-rendering',
  standalone: true,
  imports: [PageMetaComponent, QuickRefComponent, TheoryBlockComponent, CodeBlockComponent,
    CommonMistakesComponent, ChallengeBlockComponent, QuizBlockComponent, QnaBlockComponent,
    RevisionCardComponent, PageCompleteComponent],
  templateUrl: './streaming-rendering.html',
  styleUrl: './streaming-rendering.scss'
})
export class BlazorStreamingRendering {
  quickRef: QuickRefItem[] = [
    { name: '[StreamRendering]', type: 'decorator', desc: 'Attribute on a page component enabling progressive HTML flushing.' },
    { name: 'OnInitializedAsync()', type: 'method', desc: 'Async data fetch — placeholder is shown until this completes.' },
    { name: 'Enhanced navigation', type: 'keyword', desc: 'Blazor feature that swaps only the page content on link click.' },
    { name: 'TTFB', type: 'keyword', desc: 'Time to First Byte — the metric streaming rendering optimises.' },
    { name: 'Placeholder HTML', type: 'keyword', desc: 'Initial HTML flushed instantly before data resolves.' },
    { name: 'HTTP streaming', type: 'keyword', desc: 'Chunked Transfer-Encoding used to flush partial HTML.' },
    { name: 'IAsyncEnumerable<T>', type: 'type', desc: 'Stream data row-by-row for progressive table rendering.' },
    { name: 'blazor.web.js', type: 'keyword', desc: 'Script that enables enhanced navigation and streaming update.' },
  ];

  theory: TheoryPoint[] = [
    {
      heading: 'How [StreamRendering] works',
      points: ['By default, Static SSR waits for all async operations in OnInitializedAsync to complete before flushing any HTML. `[StreamRendering]` changes this: Blazor sends the initial HTML immediately (with loading placeholders), then streams DOM patches via a `<blazor-ssr>` tag as async operations complete. The user sees content almost immediately — only the dynamic sections wait for data.',
      '[StreamRendering] on a @page component enables progressive HTML flushing.', 'Static content (header, nav, footer) is sent instantly.', 'Async data slots show placeholders until data arrives.', 'Requires the blazor.web.js script on the page.']
    },
    {
      heading: 'Combining with @if placeholders',
      points: ['The streaming pattern relies on conditional rendering: show a spinner or skeleton while data is null, then the real content when it arrives. During streaming, the first render sees `data == null` and outputs placeholder HTML. When OnInitializedAsync completes, Blazor streams the diff that replaces the placeholder with the real data — all without JavaScript on the client side.',
      'Use @if (data == null) to show skeleton loaders.', 'No JavaScript needed on the client for the update.', 'Works with IAsyncEnumerable for row-by-row streaming.', 'Cannot make interactive — streaming is Static SSR only.']
    },
    {
      heading: 'Enhanced navigation',
      points: ['Enhanced navigation is a companion feature that intercepts internal link clicks and fetches only the new page\'s content fragment, swapping it into the current DOM without a full reload. This preserves scroll position, avoids re-downloading scripts and styles, and keeps transient UI (like open dropdowns) intact. Disable per-link with `data-enhance-nav="false"` or globally via the router configuration.',
      'Intercepts link clicks and fetches only the page fragment.', 'Preserves browser history and scroll position.', 'Much faster than full-page reload — scripts not re-parsed.', 'Opt out per-link with data-enhance-nav="false".']
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Basic streaming page',
      language: 'csharp',
      code: `@page "/products"
@attribute [StreamRendering]
@inject IProductService Products

<h1>Products</h1>

@if (products == null)
{
    <p>Loading products...</p>
    <!-- Could be a skeleton loader -->
}
else
{
    <ul>
        @foreach (var p in products)
        {
            <li>@p.Name — $@p.Price</li>
        }
    </ul>
}

@code {
    private List<Product>? products;

    protected override async Task OnInitializedAsync()
    {
        // Page HTML is flushed BEFORE this awaits
        products = await Products.GetAllAsync();
        // DOM updated with product list when this completes
    }
}`
    },
    {
      label: 'IAsyncEnumerable (row streaming)',
      language: 'csharp',
      code: `@page "/stream-rows"
@attribute [StreamRendering]
@inject IReportService Reports

<table>
    <thead><tr><th>Name</th><th>Value</th></tr></thead>
    <tbody>
        @foreach (var row in rows)
        {
            <tr><td>@row.Name</td><td>@row.Value</td></tr>
        }
    </tbody>
</table>
<p>Loaded @rows.Count rows</p>

@code {
    private List<ReportRow> rows = [];

    protected override async Task OnInitializedAsync()
    {
        await foreach (var row in Reports.StreamRowsAsync())
        {
            rows.Add(row);
            StateHasChanged(); // flush after each row
        }
    }
}`
    },
    {
      label: 'Multiple placeholders',
      language: 'csharp',
      code: `@page "/dashboard"
@attribute [StreamRendering]

<h1>Dashboard</h1>

<!-- Each section is independent — loads as data arrives -->
<section>
    <h2>Stats</h2>
    @if (stats is null) { <p>Loading...</p> } else { <Stats Data="stats" /> }
</section>

<section>
    <h2>Recent Orders</h2>
    @if (orders is null) { <p>Loading...</p> } else { <OrderList Items="orders" /> }
</section>

@code {
    private StatsDto? stats;
    private List<Order>? orders;

    protected override async Task OnInitializedAsync()
    {
        // Both run concurrently — page streams each as it resolves
        var statsTask  = StatsService.GetAsync();
        var ordersTask = OrderService.GetRecentAsync();
        await Task.WhenAll(statsTask, ordersTask);
        stats  = statsTask.Result;
        orders = ordersTask.Result;
    }
}`
    },
  ];

  mistakes: CommonMistake[] = [
    {
      title: 'Using [StreamRendering] on an interactive component',
      wrong: '@rendermode InteractiveServer\n@attribute [StreamRendering]',
      right: '// [StreamRendering] is for Static SSR pages only — remove @rendermode',
      explanation: '[StreamRendering] is a Static SSR feature. Interactive components manage their own re-renders via SignalR or WASM — [StreamRendering] has no effect on them and is redundant.'
    },
    {
      title: 'Not handling the null state for streamed data',
      wrong: '@foreach (var p in products) { ... }  // products is null during first flush',
      right: '@if (products is null) { <p>Loading...</p> }\nelse { @foreach (var p in products) { ... } }',
      explanation: 'During the initial flush, async data is null. Iterating null throws a NullReferenceException. Always guard with @if (data == null) before iterating.'
    },
    {
      title: 'Forgetting the blazor.web.js script',
      wrong: '<!-- No script tag in _Host.cshtml or App.razor -->',
      right: '<script src="_framework/blazor.web.js"></script>',
      explanation: 'The blazor.web.js script handles streaming updates and enhanced navigation. Without it, the streaming DOM patches are not applied and the page shows only the initial placeholder forever.'
    },
    {
      title: 'Calling StateHasChanged too frequently in IAsyncEnumerable',
      wrong: 'await foreach (var row in stream) { rows.Add(row); StateHasChanged(); }',
      right: 'await foreach (var row in stream) { rows.Add(row); if (rows.Count % 50 == 0) StateHasChanged(); }',
      explanation: 'Calling StateHasChanged on every row for large streams generates excessive DOM patches. Batch updates every N rows for better performance.'
    },
    {
      title: 'Using [StreamRendering] on non-page components',
      wrong: '[StreamRendering]\npublic class MyWidget : ComponentBase { }',
      right: '// [StreamRendering] only works on @page components',
      explanation: '[StreamRendering] is only meaningful on components that serve as entry points for HTTP responses (i.e., pages). It has no effect on child components.'
    },
  ];

  challenge: Challenge = {
    title: 'Streaming News Feed',
    language: 'csharp',
    description: 'Build a news feed page with [StreamRendering]. Show three sections: Breaking News (fast, 100ms), Top Stories (medium, 800ms), and Analysis (slow, 2000ms). Each section shows a skeleton loader until its data arrives. Simulate delays with Task.Delay in a stub service.',
    hints: [
      'Declare three nullable lists and three tasks.',
      'Run all three tasks concurrently with Task.WhenAll.',
      'Use @if (section == null) { <p>Loading...</p> } for each section.',
    ],
    starterCode: `@page "/news"
@attribute [StreamRendering]

<!-- TODO: three sections with placeholders -->

@code {
    private List<string>? breaking;
    private List<string>? topStories;
    private List<string>? analysis;

    protected override async Task OnInitializedAsync()
    {
        // TODO: fetch all three concurrently
    }
}`,
    solution: `@page "/news"
@attribute [StreamRendering]

<h1>News</h1>

<section>
    <h2>Breaking News</h2>
    @if (breaking is null) { <p>Loading...</p> }
    else { @foreach (var n in breaking) { <p>@n</p> } }
</section>

<section>
    <h2>Top Stories</h2>
    @if (topStories is null) { <p>Loading...</p> }
    else { @foreach (var n in topStories) { <p>@n</p> } }
</section>

<section>
    <h2>Analysis</h2>
    @if (analysis is null) { <p>Loading...</p> }
    else { @foreach (var n in analysis) { <p>@n</p> } }
</section>

@code {
    private List<string>? breaking;
    private List<string>? topStories;
    private List<string>? analysis;

    protected override async Task OnInitializedAsync()
    {
        var t1 = FetchBreaking();
        var t2 = FetchTopStories();
        var t3 = FetchAnalysis();
        await Task.WhenAll(t1, t2, t3);
    }

    private async Task FetchBreaking()
    { await Task.Delay(100); breaking = ["Flash: Markets surge", "Alert: Major storm"]; }

    private async Task FetchTopStories()
    { await Task.Delay(800); topStories = ["Economy grows 2%", "Tech layoffs continue"]; }

    private async Task FetchAnalysis()
    { await Task.Delay(2000); analysis = ["Deep dive: AI in 2025", "Opinion: Rate cuts ahead"]; }
}`
  };

  quiz: QuizQuestion[] = [
    { q: 'What does [StreamRendering] do?', options: ['Enables real-time SignalR updates', 'Flushes placeholder HTML immediately and streams data updates', 'Lazy-loads components', 'Enables WASM in Static SSR'], answer: 1, explanation: '[StreamRendering] makes Blazor send the page HTML instantly with placeholders, then stream DOM patches when async data resolves — improving Time to First Byte.' },
    { q: 'Which render mode can use [StreamRendering]?', options: ['InteractiveServer', 'InteractiveWebAssembly', 'Static SSR', 'InteractiveAuto'], answer: 2, explanation: '[StreamRendering] is a Static SSR feature. Interactive modes manage their own updates via SignalR or WASM without streaming.' },
    { q: 'What must you guard against during the first flush of a streaming page?', options: ['Empty strings', 'Null collections (data not yet loaded)', 'CSS not applied', 'Navigation events'], answer: 1, explanation: 'During the initial flush, async data is null. Always use @if (data == null) to show a placeholder rather than iterating a null collection.' },
    { q: 'What script enables streaming DOM updates?', options: ['blazor.server.js', 'blazor.webassembly.js', 'blazor.web.js', 'aspnetcore.signalr.js'], answer: 2, explanation: 'blazor.web.js is the unified Blazor script for .NET 8+ that handles streaming rendering updates and enhanced navigation.' },
    { q: 'What is enhanced navigation?', options: ['Preloading the next page in background', 'Intercepting link clicks and swapping only page content without full reload', 'Caching API responses', 'Progressive image loading'], answer: 1, explanation: 'Enhanced navigation intercepts internal link clicks, fetches only the new page\'s content fragment, and swaps it in — avoiding script re-parsing and preserving scroll position.' },
  ];

  qna: QnaItem[] = [
    { q: 'Does [StreamRendering] require JavaScript on the client?', a: 'It requires the blazor.web.js script to apply the streaming DOM updates. However, the initial HTML (with placeholders) is served without JavaScript — browsers without JS see the placeholder state permanently. This is a progressive enhancement.' },
    { q: 'Can I combine [StreamRendering] with enhanced navigation?', a: 'Yes — they complement each other. [StreamRendering] improves TTFB for the initial page load, while enhanced navigation makes subsequent navigations feel instant by swapping only content fragments.' },
    { q: 'How does streaming compare to InteractiveServer for data loading?', a: 'Streaming sends actual HTML and requires no JavaScript framework on the client — it is pure SSR with progressive enhancement. InteractiveServer sets up a persistent SignalR connection and re-renders components on the server. Streaming is cheaper (no circuit, no long connection) but less dynamic — you cannot respond to user events without a round-trip.' },
    { q: 'Is [StreamRendering] available in .NET 7?', a: 'No. [StreamRendering] was introduced in .NET 8 along with the unified Blazor Web App hosting model. It requires the new per-component render mode system.' },
  ];

  revision: RevisionSummary = {
    oneLiner: '[StreamRendering] sends placeholder HTML instantly and streams data diffs when async operations complete — dramatically improving Time to First Byte for Static SSR pages without any client JavaScript.',
    mustKnow: [
      '[StreamRendering] is a Static SSR-only attribute — not for interactive components.',
      'Initial HTML is flushed immediately; async data slots are streamed as they resolve.',
      'Always guard with @if (data == null) to handle the placeholder state.',
      'blazor.web.js script is required to apply streaming DOM updates.',
      'Enhanced navigation intercepts link clicks for faster navigations.',
      'IAsyncEnumerable enables row-by-row streaming with StateHasChanged.',
    ],
    interviewFocus: [
      'How does [StreamRendering] improve perceived performance?',
      'What is the difference between streaming rendering and InteractiveServer?',
      'What guard is required when using [StreamRendering] with nullable data?',
    ]
  };
}
