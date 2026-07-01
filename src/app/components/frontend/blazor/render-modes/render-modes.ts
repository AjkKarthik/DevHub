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
  selector: 'app-blazor-render-modes',
  standalone: true,
  imports: [PageMetaComponent, QuickRefComponent, TheoryBlockComponent, CodeBlockComponent,
    CommonMistakesComponent, ChallengeBlockComponent, QuizBlockComponent, QnaBlockComponent,
    RevisionCardComponent, PageCompleteComponent],
  templateUrl: './render-modes.html',
  styleUrl: './render-modes.scss'
})
export class BlazorRenderModes {
  quickRef: QuickRefItem[] = [
    { name: '@rendermode InteractiveServer', type: 'syntax', desc: 'Enable server-side interactivity with SignalR.' },
    { name: '@rendermode InteractiveWebAssembly', type: 'syntax', desc: 'Run component logic in the browser via WASM.' },
    { name: '@rendermode InteractiveAuto', type: 'syntax', desc: 'Use Server first, switch to WASM after download.' },
    { name: 'Static SSR (default)', type: 'syntax', desc: 'Renders HTML on the server with no interactivity.' },
    { name: 'RenderModeAttribute', type: 'class', desc: 'Base class for all render mode attributes.' },
    { name: 'IComponentRenderMode', type: 'interface', desc: 'Interface implemented by all render mode types.' },
    { name: 'builder.Services.AddInteractiveServerComponents()', type: 'method', desc: 'Register Server render mode services.' },
    { name: 'builder.Services.AddInteractiveWebAssemblyComponents()', type: 'method', desc: 'Register WASM render mode services.' },
  ];

  theory: TheoryPoint[] = [
    {
      heading: 'The four render modes',
      points: ['.NET 8 introduced a unified hosting model where every component has an explicit render mode. Static SSR renders HTML server-side with no persistent connection — ideal for content pages. InteractiveServer streams UI diffs over SignalR. InteractiveWebAssembly downloads the .NET runtime to the browser and runs logic there. InteractiveAuto starts as Server while WASM downloads, then switches — combining fast startup with reduced server load at scale.',
      'Static SSR is the default — no `@rendermode` directive needed.', 'InteractiveServer keeps C# on the server; WebAssembly moves it to the browser.', 'Auto mode transitions transparently once the WASM bundle is cached.', 'Render modes can be set per-component or globally on <Routes>.']
    },
    {
      heading: 'Setting render modes',
      points: ['Apply `@rendermode` at the top of a .razor file to set the mode for that component and its children. You can also set it programmatically when using the component tag: `<Counter @rendermode="InteractiveServer" />`. Setting the mode on `<Routes>` in App.razor applies it globally, but individual components can override. For WASM, the component must live in the Client project (or a shared library referenced from it).',
      '`@rendermode` directive applies to the component and subtree.', 'Tag-level `@rendermode` attribute overrides the default.', 'Global mode on <Routes> is the simplest setup for all-interactive apps.', 'WASM components require a separate client-side project.']
    },
    {
      heading: 'Streaming rendering and enhanced navigation',
      points: ['Static SSR components can opt in to `[StreamRendering]` to flush HTML before async data resolves, dramatically improving perceived speed. Enhanced navigation (enabled by default) intercepts link clicks and fetches only the updated DOM fragment rather than doing a full-page reload, preserving scroll position and client state.',
      '`[StreamRendering]` attribute on a page component enables progressive HTML flushing.', 'Enhanced navigation is opt-out via `data-enhance-nav="false"`.', 'Enhanced form actions work similarly for POST round-trips.', 'Both features require the `<script src="_framework/blazor.web.js">` script tag.']
    },
    {
      heading: 'Choosing a Render Mode Per Component, Not Per Application',
      points: [
        '.NET 8\'s render mode model lets DIFFERENT components within the same application use different render modes — a marketing landing page can use Static SSR for speed and SEO, while a dashboard page elsewhere in the same app uses InteractiveServer for real-time updates, all within one unified project.',
        'The @rendermode directive applied to a component (or its usage site) specifies its render mode explicitly — omitting it defaults to static rendering, meaning components must explicitly opt into interactivity rather than being interactive by default, a deliberate design choice favoring performance by default.',
        'Mixing render modes within a single page requires understanding boundary behavior — an interactive component can be nested within a static page, but a static component generally cannot be nested within an interactive component\'s render tree in the same simple way, requiring careful component architecture planning.',
        'Choosing the wrong render mode for a given component\'s actual needs has real consequences — using InteractiveServer for a component that does not need real-time server interaction wastes a persistent SignalR circuit resource, while using Static SSR for a component that genuinely needs client-side interactivity simply will not work as intended.',
      ],
    },
    {
      heading: 'Prerendering Behavior with Interactive Render Modes',
      points: [
        'By default, interactive render modes (InteractiveServer, InteractiveWebAssembly) still prerender on the server first, sending initial static HTML before the interactive runtime takes over — this gives fast initial paint even for interactive components, at the cost of components potentially running their initialization logic twice (once during prerender, once during actual interactive startup).',
        'Prerendering can be explicitly disabled per component (@rendermode="new InteractiveServerRenderMode(prerender: false)") for components where double-execution of initialization logic would cause problems (like a component that increments a counter or calls a non-idempotent API on initialization).',
        'Components relying on browser-only APIs (accessing window or localStorage via JS interop) must guard against running during the server-side prerender phase, where no real browser exists — checking OperatingSystem.IsBrowser() or deferring such calls to OnAfterRenderAsync avoids errors during prerendering.',
        'Understanding the prerender-then-hydrate lifecycle is essential for correctly reasoning about "why did my OnInitializedAsync run twice" — a common early confusion for developers new to .NET 8\'s render mode model, where this double execution is expected default behavior, not a bug.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Static SSR',
      language: 'csharp',
      code: `@page "/products"
@inject ProductService Products

<h1>Products</h1>
@foreach (var p in productList)
{
    <p>@p.Name — $@p.Price</p>
}

@code {
    private List<Product> productList = new();

    protected override async Task OnInitializedAsync()
    {
        productList = await Products.GetAllAsync();
    }
}`
    },
    {
      label: 'InteractiveServer',
      language: 'csharp',
      code: `@page "/counter"
@rendermode InteractiveServer

<h1>Count: @count</h1>
<button @onclick="Increment">+1</button>

@code {
    private int count = 0;
    private void Increment() => count++;
}`
    },
    {
      label: 'InteractiveAuto',
      language: 'csharp',
      code: `@page "/dashboard"
@rendermode InteractiveAuto

<h2>Live Dashboard</h2>
<p>Updates: @updates</p>
<button @onclick="Refresh">Refresh</button>

@code {
    private int updates = 0;
    private void Refresh() => updates++;
    // Starts as Server, switches to WASM once bundle is cached
}`
    },
    {
      label: 'Per-use override',
      language: 'csharp',
      code: `<!-- App.razor: global default is Static SSR -->
<Routes />

<!-- Override just this component to use Server mode -->
<Counter @rendermode="InteractiveServer" />

<!-- Or override with a variable -->
@code {
    private IComponentRenderMode mode = RenderMode.InteractiveServer;
}
<Counter @rendermode="mode" />`
    },
  ];

  mistakes: CommonMistake[] = [
    {
      title: 'Using @onclick on a Static SSR page',
      wrong: '@onclick="DoSomething"  // on a page with no @rendermode',
      right: '@rendermode InteractiveServer\n@onclick="DoSomething"',
      explanation: 'Event handlers silently do nothing in Static SSR. The button renders but clicks are never received.'
    },
    {
      title: 'WASM component referencing server-only services',
      wrong: '@inject IDbContext Db  // in a WASM component',
      right: '// Call an API endpoint from WASM; keep Db on the server',
      explanation: 'WASM runs in the browser. It cannot access EF Core, file system, or any server-only resource directly.'
    },
    {
      title: 'Forgetting AddInteractiveServerComponents()',
      wrong: 'builder.Services.AddRazorComponents();',
      right: 'builder.Services.AddRazorComponents()\n    .AddInteractiveServerComponents()\n    .AddInteractiveWebAssemblyComponents();',
      explanation: 'Without registering the interactive services, @rendermode attributes are ignored and components render statically.'
    },
    {
      title: 'Setting @rendermode on a child instead of its parent',
      wrong: '// Child cannot upgrade a Static SSR parent',
      right: '// Set @rendermode on the highest-level component that needs it',
      explanation: 'A component cannot be more interactive than its parent. The render mode flows down the tree.'
    },
    {
      title: 'Missing MapRazorComponents call',
      wrong: 'app.MapStaticAssets();',
      right: 'app.MapRazorComponents<App>()\n    .AddInteractiveServerRenderMode()\n    .AddInteractiveWebAssemblyRenderMode();',
      explanation: 'Without MapRazorComponents, the app serves no Blazor pages and interactive modes are never wired up.'
    },
  ];

  challenge: Challenge = {
    title: 'Render Mode Switcher',
    language: 'csharp',
    description: 'Create a page that renders a counter component. Add a dropdown that lets the user choose between Static SSR, InteractiveServer, and InteractiveAuto. Show the active mode name next to the counter. (Hint: use a variable for `@rendermode` and a conditional to disable the button in SSR mode.)',
    hints: [
      'Store the chosen mode in an `IComponentRenderMode?` variable.',
      'A null value means Static SSR — no `@rendermode` attribute is applied.',
      'Wrap the counter in an `@if` to switch between three `<Counter>` tags with different modes.',
    ],
    starterCode: `@page "/mode-demo"

<select @onchange="ChangeMode">
    <option value="ssr">Static SSR</option>
    <option value="server">Interactive Server</option>
    <option value="auto">Interactive Auto</option>
</select>

<!-- Render a Counter component here with the chosen mode -->

@code {
    // TODO: store and switch the render mode
}`,
    solution: `@page "/mode-demo"
@rendermode InteractiveServer

<select @onchange="ChangeMode">
    <option value="ssr">Static SSR</option>
    <option value="server">Interactive Server</option>
    <option value="auto">Interactive Auto</option>
</select>
<p>Active mode: @modeName</p>

@if (mode == null)
{
    <Counter />
}
else if (mode == RenderMode.InteractiveServer)
{
    <Counter @rendermode="RenderMode.InteractiveServer" />
}
else
{
    <Counter @rendermode="RenderMode.InteractiveAuto" />
}

@code {
    private IComponentRenderMode? mode = null;
    private string modeName = "Static SSR";

    private void ChangeMode(ChangeEventArgs e)
    {
        (mode, modeName) = e.Value?.ToString() switch
        {
            "server" => (RenderMode.InteractiveServer, "Interactive Server"),
            "auto"   => (RenderMode.InteractiveAuto,   "Interactive Auto"),
            _        => (null, "Static SSR")
        };
    }
}`
  };

  quiz: QuizQuestion[] = [
    { q: 'Which render mode is the default in .NET 8 Blazor?', options: ['InteractiveServer', 'InteractiveWebAssembly', 'Static SSR', 'InteractiveAuto'], answer: 2, explanation: 'Static SSR is the default — no @rendermode directive is needed and no JavaScript is required for rendering.' },
    { q: 'What does InteractiveAuto do?', options: ['Always uses WASM', 'Always uses Server', 'Starts as Server, switches to WASM once cached', 'Switches based on network speed'], answer: 2, explanation: 'Auto uses Server for fast initial interactivity while WASM downloads, then switches on the next navigation.' },
    { q: 'Which service must be registered for InteractiveServer?', options: ['AddServerSideBlazor()', 'AddInteractiveServerComponents()', 'AddSignalR()', 'AddBlazorServer()'], answer: 1, explanation: 'AddInteractiveServerComponents() is the .NET 8 method. AddServerSideBlazor() is the older pre-.NET 8 API.' },
    { q: 'Can a WASM component directly access EF Core?', options: ['Yes, via DI', 'No, it runs in the browser', 'Only with Scoped lifetime', 'Only in development'], answer: 1, explanation: 'WASM executes in the browser. It must call HTTP APIs to reach server-side resources like databases.' },
    { q: 'What attribute enables progressive HTML flushing on a Static SSR page?', options: ['[StreamRendering]', '[ProgressiveRender]', '[AsyncFlush]', '[LazyLoad]'], answer: 0, explanation: '[StreamRendering] tells Blazor to send placeholder HTML immediately and stream updated content as async work completes.' },
    { q: 'Can different components on the same page use different render modes?', options: ['No — one render mode per page', 'Yes — each component can independently declare @rendermode', 'Only in Blazor WASM', 'Only two render modes per page'], answer: 1, explanation: 'Per-component render mode is a key .NET 8 Blazor feature. A page can be Static SSR while specific interactive islands are InteractiveServer or InteractiveWebAssembly. The constraint is that a child component cannot have a higher interactivity than its parent — a static parent cannot host an interactive child in the same request.' },
  ];

  qna: QnaItem[] = [
    { q: 'When should I choose InteractiveServer over WASM?', a: 'Choose Server when you need access to server-side resources (DB, file system, secrets), the app is behind a corporate firewall, or initial download size matters. Choose WASM for offline support or to reduce server load at scale.' },
    { q: 'Can I mix render modes within one page?', a: 'Yes. A Static SSR page can embed individual interactive components with `<Counter @rendermode="InteractiveServer" />`. Each island has its own mode — the parent does not need to be interactive.' },
    { q: 'Does enhanced navigation work with all browsers?', a: 'Yes. It is a progressive enhancement — it uses the Fetch API to intercept clicks. If the script is not loaded, the page falls back to standard full-page navigation.' },
    { q: 'What happens to component state when Auto switches from Server to WASM?', a: 'State is lost during the transition unless you persist it explicitly via PersistentComponentState or a shared backend API. Plan for the switch when designing stateful components with Auto mode.' },
    { q: 'What is the practical difference between InteractiveServer and InteractiveWebAssembly render modes introduced in .NET 8?',
      a: 'InteractiveServer runs the component\'s C# logic on the server with UI updates streamed over a SignalR circuit, similar to "classic" Blazor Server — fast initial load, but requires a constant low-latency connection and consumes server resources per active user. InteractiveWebAssembly downloads and runs the component entirely in the browser via WASM — works offline after load, scales without server-side per-user resource cost, but has a larger initial download and WASM startup time. .NET 8 lets you choose the render mode per component, mixing both within the same app.' },
    { q: 'What does "Auto" render mode do, and why might you choose it over a fixed Server or WebAssembly mode?',
      a: 'InteractiveAuto initially uses Server rendering for fast first interaction (no WASM download wait), while simultaneously downloading and caching the WASM runtime and app assemblies in the background; on subsequent visits (once WASM assets are cached), it automatically switches to WebAssembly rendering for that component, giving the best of both — fast first load and offline-capable, server-independent operation on return visits — without the developer needing to manually choose one mode and accept its specific tradeoff permanently.' },
  ];

  revision: RevisionSummary = {
    oneLiner: 'Blazor .NET 8 render modes let each component choose whether it runs as Static SSR, InteractiveServer (SignalR), InteractiveWebAssembly, or Auto.',
    mustKnow: [
      'Static SSR is the default — no persistent connection, no JS event handlers.',
      'InteractiveServer streams UI diffs over SignalR from the server.',
      'InteractiveWebAssembly downloads .NET to the browser and runs locally.',
      'InteractiveAuto starts as Server, transparently upgrades to WASM after download.',
      'Register modes with AddInteractiveServerComponents() / AddInteractiveWebAssemblyComponents().',
      'A child component cannot be more interactive than its parent.',
    ],
    interviewFocus: [
      'What is the difference between InteractiveServer and InteractiveWebAssembly?',
      'When would you choose Auto mode and what are its tradeoffs?',
      'How does [StreamRendering] improve perceived performance on Static SSR pages?',
    ]
  };
}
