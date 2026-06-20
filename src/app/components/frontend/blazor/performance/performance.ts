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
import { PrerequisitesComponent, Prerequisite } from '../../../../components/shared/prerequisites/prerequisites';

@Component({
  selector: 'app-blazor-performance',
  standalone: true,
  imports: [PageMetaComponent, PrerequisitesComponent, QuickRefComponent, TheoryBlockComponent,
    CodeBlockComponent, CommonMistakesComponent, ChallengeBlockComponent, QuizBlockComponent,
    QnaBlockComponent, RevisionCardComponent, PageCompleteComponent],
  templateUrl: './performance.html',
  styleUrl: './performance.scss'
})
export class BlazorPerformance {
  prerequisites: Prerequisite[] = [
    { label: 'Razor Components', route: '/blazor/razor-components' },
    { label: 'Blazor Render Modes', route: '/blazor/render-modes' },
    { label: 'Virtualization', route: '/blazor/virtualization' },
  ];

  quickRef: QuickRefItem[] = [
    { name: 'ShouldRender()', type: 'method', desc: 'Override to skip re-rendering when nothing changed.' },
    { name: '@key', type: 'syntax', desc: 'Hint to the diffing algorithm for stable list identity.' },
    { name: 'IMemoryCache', type: 'interface', desc: 'In-process cache for expensive computations or API results.' },
    { name: 'IOutputCache', type: 'interface', desc: 'Server-side HTTP response caching for SSR pages.' },
    { name: 'WASM AOT', type: 'keyword', desc: 'Ahead-of-Time compilation for WASM — eliminates JIT startup cost.' },
    { name: '[StreamRendering]', type: 'decorator', desc: 'Progressive HTML flushing for faster perceived SSR loads.' },
    { name: 'Virtualize', type: 'keyword', desc: 'Render only visible list items — essential for large datasets.' },
    { name: 'DisconnectedCircuitRetentionPeriod', type: 'keyword', desc: 'Tune how long a Server circuit stays alive after disconnect.' },
  ];

  theory: TheoryPoint[] = [
    {
      heading: 'Render cycle optimisation',
      points: ['Blazor re-renders a component whenever an event handler runs or StateHasChanged is called. Override `ShouldRender()` to return false when the component\'s output would be identical — Blazor skips the diff entirely. Use `@key` on list items so the differ can match existing DOM nodes instead of recreating them when items are reordered or inserted. These two techniques eliminate the majority of unnecessary DOM updates in component-heavy UIs.',
      'ShouldRender() returning false skips the entire diff — zero DOM cost.', '@key on list items enables stable identity for the differ.', 'Without @key, inserting at the top of a list rebuilds all subsequent items.', 'Prefer records (structural equality) for parameters to make ShouldRender checks cheap.']
    },
    {
      heading: 'Data loading and caching',
      points: ['Inject `IMemoryCache` to cache expensive service calls per key with configurable expiry. For SSR pages, `IOutputCache` (ASP.NET Core Output Caching) caches the full HTTP response — subsequent requests are served without hitting your app code at all. Combine with [StreamRendering] for uncacheable but fast pages: users see content immediately even when data takes 500ms to resolve.',
      'IMemoryCache caches service call results in-process with expiry.', 'IOutputCache caches full HTTP responses at the server level.', '[OutputCache] attribute on a Razor page applies response caching declaratively.', 'Avoid caching user-specific data — use vary-by-user or exclude from cache.']
    },
    {
      heading: 'WASM AOT and bundle size',
      points: ['Blazor WASM apps download the .NET runtime and app assemblies on first load. AOT compilation (configured in .csproj) eliminates runtime JIT — reducing startup time at the cost of a larger download. Enable trimming and compression in production. Lazy-load assemblies with `@attribute [Route]` on separate assemblies. For Blazor Server, reduce memory per circuit by disposing resources promptly and setting a short DisconnectedCircuitRetentionPeriod.',
      'AOT: faster startup, larger download — enable for performance-critical WASM apps.', 'Trimming removes unused code from published output.', 'Lazy assembly loading reduces the initial WASM download.', 'Server circuits hold memory — dispose promptly, tune retention period.']
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'ShouldRender + @key',
      language: 'csharp',
      code: `// Component that skips render if value unchanged
@code {
    [Parameter] public int Count { get; set; }
    private int lastCount = -1;

    protected override bool ShouldRender()
    {
        if (Count == lastCount) return false;
        lastCount = Count;
        return true;
    }
}

// @key for stable list identity
<ul>
    @foreach (var item in sortedItems)
    {
        <li @key="item.Id">@item.Name</li>
    }
</ul>

@code {
    private List<Item> sortedItems = [];
    private void SortByName()
    {
        // Without @key, all <li> nodes would be rebuilt
        // With @key, Blazor moves existing nodes
        sortedItems = sortedItems.OrderBy(i => i.Name).ToList();
    }
}`
    },
    {
      label: 'IMemoryCache',
      language: 'csharp',
      code: `@inject IMemoryCache Cache
@inject IProductService Products

<h2>Featured Products</h2>
@foreach (var p in featured)
{
    <div>@p.Name</div>
}

@code {
    private List<Product> featured = [];

    protected override async Task OnInitializedAsync()
    {
        featured = await Cache.GetOrCreateAsync("featured-products", async entry =>
        {
            entry.AbsoluteExpirationRelativeToNow = TimeSpan.FromMinutes(5);
            return await Products.GetFeaturedAsync();
        }) ?? [];
    }
}`
    },
    {
      label: 'Output Caching (SSR)',
      language: 'csharp',
      code: `// Program.cs
builder.Services.AddOutputCache();
app.UseOutputCache();

// CataloguePage.razor
@page "/catalogue"
@attribute [OutputCache(Duration = 60)]  // Cache entire response for 60 seconds

<h1>Catalogue</h1>
@foreach (var p in products) { <ProductCard Item="p" /> }`
    },
    {
      label: 'WASM AOT in .csproj',
      language: 'csharp',
      code: `<!-- Client/Client.csproj -->
<PropertyGroup>
    <!-- Enable AOT compilation (publish only) -->
    <RunAOTCompilation>true</RunAOTCompilation>

    <!-- Trim unused IL to reduce download size -->
    <PublishTrimmed>true</PublishTrimmed>

    <!-- Compress IL with Brotli/gzip -->
    <CompressionEnabled>true</CompressionEnabled>

    <!-- Enable lazy loading for heavy assemblies -->
    <BlazorWebAssemblyLazyLoad Include="HeavyAssembly.dll" />
</PropertyGroup>`
    },
  ];

  mistakes: CommonMistake[] = [
    {
      title: 'Calling StateHasChanged in a loop',
      wrong: 'for (var i = 0; i < 100; i++) { data.Add(i); StateHasChanged(); }',
      right: 'for (var i = 0; i < 100; i++) { data.Add(i); }\nStateHasChanged();',
      explanation: 'Each StateHasChanged triggers a full render cycle. Accumulate changes first, then call StateHasChanged once to batch all updates into a single diff.'
    },
    {
      title: 'Not using @key when reordering lists',
      wrong: '@foreach (var item in items) { <Row Data="item" /> }',
      right: '@foreach (var item in items) { <Row @key="item.Id" Data="item" /> }',
      explanation: 'Without @key, Blazor recycles DOM nodes by position. Reordering a 1000-item list forces 1000 updates. With @key, only moved items get new DOM nodes.'
    },
    {
      title: 'Fetching data in ShouldRender',
      wrong: 'protected override bool ShouldRender() { data = LoadData(); return true; }',
      right: '// ShouldRender is a PURE check — never fetch data or have side effects inside it',
      explanation: 'ShouldRender is called frequently and synchronously. Any I/O or side effects cause unpredictable behaviour and breaks the rendering contract.'
    },
    {
      title: 'Caching user-specific data in IMemoryCache with a shared key',
      wrong: 'Cache.GetOrCreateAsync("user-profile", ...)',
      right: 'Cache.GetOrCreateAsync($"user-profile-{userId}", ...)',
      explanation: 'A shared key returns the first user\'s profile to all subsequent users. Always include a user identifier in the cache key for personal data.'
    },
    {
      title: 'Enabling AOT on development builds',
      wrong: '<RunAOTCompilation>true</RunAOTCompilation>  // in debug config',
      right: '// Only enable AOT for publish (Release) configuration\n// Or use: <RunAOTCompilation Condition="\'$(Configuration)\'==\'Release\'">true</RunAOTCompilation>',
      explanation: 'AOT compilation adds minutes to the build. Enable it only in Release/publish configurations to keep inner-loop development fast.'
    },
  ];

  challenge: Challenge = {
    title: 'Optimised Leaderboard',
    language: 'csharp',
    description: 'Build a leaderboard component that shows the top 100 players. Add ShouldRender optimization so it only re-renders when the scores actually change (compare by hash or sequence). Add @key on each row for stable sorting. Update scores via a button that shuffles a few values — verify the DOM only updates changed rows.',
    hints: [
      'Store a hash of the current scores and compare in ShouldRender.',
      'Use @key="player.Id" on each row.',
      'Only update 3-5 random scores on each refresh to observe selective DOM updates.',
    ],
    starterCode: `@rendermode InteractiveServer

<button @onclick="Refresh">Refresh Scores</button>
<ul>
    @foreach (var p in players)
    {
        <li>@p.Name: @p.Score</li>
    }
</ul>

@code {
    record Player(int Id, string Name, int Score);
    private List<Player> players = [];
    // TODO: init 100 players, ShouldRender check, @key, Refresh method
}`,
    solution: `@rendermode InteractiveServer

<button @onclick="Refresh">Refresh Scores</button>
<ul>
    @foreach (var p in players.OrderByDescending(p => p.Score))
    {
        <li @key="p.Id">@p.Name: @p.Score</li>
    }
</ul>

@code {
    record Player(int Id, string Name, int Score);
    private List<Player> players = [];
    private int lastHash;

    protected override void OnInitialized()
    {
        players = Enumerable.Range(1, 100)
            .Select(i => new Player(i, $"Player {i}", Random.Shared.Next(1000)))
            .ToList();
        lastHash = GetHash();
    }

    protected override bool ShouldRender()
    {
        var h = GetHash();
        if (h == lastHash) return false;
        lastHash = h;
        return true;
    }

    private int GetHash() => players.Sum(p => p.Score);

    private void Refresh()
    {
        // Update 5 random players
        for (var i = 0; i < 5; i++)
        {
            var idx = Random.Shared.Next(players.Count);
            players[idx] = players[idx] with { Score = Random.Shared.Next(1000) };
        }
    }
}`
  };

  quiz: QuizQuestion[] = [
    { q: 'What does ShouldRender() returning false do?', options: ['Disposes the component', 'Skips the diff and DOM update entirely', 'Cancels the current event', 'Pauses the render queue'], answer: 1, explanation: 'When ShouldRender() returns false, Blazor skips the virtual DOM diff and makes no DOM changes — the cheapest possible render outcome.' },
    { q: 'What does @key do on a list item?', options: ['Adds an HTML id attribute', 'Tells Blazor the stable identity for diffing, enabling node reuse on reorder', 'Speeds up event handling', 'Prevents re-rendering the item'], answer: 1, explanation: '@key gives the Blazor differ a stable identity for each node. When the list is reordered, nodes are moved rather than destroyed and recreated.' },
    { q: 'Which caching mechanism caches the entire HTTP response?', options: ['IMemoryCache', 'IDistributedCache', 'IOutputCache', 'ResponseCacheAttribute'], answer: 2, explanation: 'IOutputCache (and the [OutputCache] attribute) caches the full HTTP response at the server. Subsequent requests are served without hitting Razor or your services.' },
    { q: 'When should you enable WASM AOT compilation?', options: ['Always — it speeds up dev builds', 'Only for publish/Release builds', 'Never — it is for Server only', 'Only for mobile devices'], answer: 1, explanation: 'AOT adds significant compile time. Enable it only in Release/publish configurations (via a condition in .csproj) to keep development builds fast.' },
    { q: 'What is wrong with putting data fetching in ShouldRender()?', options: ['Nothing — it is the recommended pattern', 'ShouldRender must be pure — no I/O or side effects', 'It causes memory leaks', 'It only works in WASM'], answer: 1, explanation: 'ShouldRender is called frequently and synchronously. It must be a pure boolean check with no side effects — I/O or mutations cause unpredictable render behaviour.' },
  ];

  qna: QnaItem[] = [
    { q: 'How do I profile a Blazor application?', a: 'For WASM, use browser DevTools Performance tab or the .NET WASM profiler. For Server, use dotnet-trace, Application Insights, or Visual Studio\'s Diagnostic Tools to trace SignalR messages and render cycles. Look for high-frequency StateHasChanged calls, large DOM diffs, and slow OnParametersSet implementations.' },
    { q: 'Should I override ShouldRender on every component?', a: 'No — only where performance profiling shows unnecessary re-renders. Most components are fast enough without it. Prioritise ShouldRender on components that: are rendered many times (list items), receive frequent external updates, or have expensive computed output.' },
    { q: 'How does [StreamRendering] help performance?', a: '[StreamRendering] reduces Time to First Byte by sending the page shell (header, nav, static content) immediately. The user sees content faster even though the data fetch takes the same time. It does not speed up the data fetch — it optimises perceived performance.' },
    { q: 'What is the biggest single performance win for a large Blazor Server app?', a: 'Usually: reducing unnecessary StateHasChanged calls and render cycles. Profile first — most apps spend 80% of render time on 20% of components. After that, consider caching hot API paths with IMemoryCache and using Virtualize for large lists.' },
  ];

  revision: RevisionSummary = {
    oneLiner: 'Blazor performance: prevent unnecessary re-renders with ShouldRender() and @key, cache data with IMemoryCache/IOutputCache, use Virtualize for large lists, and enable AOT for WASM publish builds.',
    mustKnow: [
      'ShouldRender() false skips the diff entirely — the cheapest render operation.',
      '@key gives the differ stable identity — essential for reorderable lists.',
      'Call StateHasChanged once after mutations, not once per mutation.',
      'IMemoryCache caches service results; IOutputCache caches full HTTP responses.',
      'WASM AOT speeds up startup — enable only for Release/publish builds.',
      'Virtualize is non-negotiable for lists with more than a few hundred items.',
    ],
    interviewFocus: [
      'What does ShouldRender() do and when should you override it?',
      'Explain the purpose of @key and the problem it solves.',
      'What are the trade-offs of WASM AOT compilation?',
    ]
  };
}
