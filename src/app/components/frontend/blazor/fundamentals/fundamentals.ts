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
  selector: 'app-blazor-fundamentals',
  standalone: true,
  imports: [PageMetaComponent, QuickRefComponent, TheoryBlockComponent, CodeBlockComponent,
    CommonMistakesComponent, ChallengeBlockComponent, QuizBlockComponent, QnaBlockComponent,
    RevisionCardComponent, PageCompleteComponent],
  templateUrl: './fundamentals.html',
  styleUrl: './fundamentals.scss',
})
export class BlazorFundamentals {
  quickRef: QuickRefItem[] = [
    { name: 'Blazor Server',      type: 'keyword', desc: 'C# runs on server; UI updates via SignalR websocket. Fast startup, needs persistent connection.' },
    { name: 'Blazor WebAssembly', type: 'keyword', desc: 'Full .NET runtime compiled to WASM runs in browser. Larger download, no server needed after load.' },
    { name: 'Blazor Hybrid',      type: 'keyword', desc: 'Razor components inside .NET MAUI WebView for native desktop/mobile apps.' },
    { name: '@page',              type: 'decorator', desc: 'Razor directive turning a component into a routable page: @page "/path".' },
    { name: '@code { }',          type: 'syntax', desc: 'C# code block in a Razor file — holds fields, properties, methods.' },
    { name: 'StateHasChanged()',  type: 'method', desc: 'Notifies Blazor that component state changed and UI should re-render.' },
    { name: '@rendermode',        type: 'decorator', desc: '.NET 8 attribute choosing render mode per component: InteractiveServer, InteractiveWebAssembly, Auto.' },
    { name: 'App.razor',          type: 'keyword', desc: 'Root component. Hosts Router, routes to pages, defines fallback for 404.' },
  ];

  theory: TheoryPoint[] = [
    { heading: 'What is Blazor?', points: [
      'Blazor is a .NET framework for building interactive web UIs with C# and Razor instead of JavaScript.',
      'Components are .razor files — a mix of HTML markup and C# logic in one file.',
      'Blazor competes with React/Angular/Vue but targets .NET developers who want to stay in C#.',
      'Released in 2018 (Server) and 2020 (WASM); .NET 8 unified both in a single project model.',
    ]},
    { heading: 'Blazor Server', points: [
      'The C# component logic runs on the server inside an ASP.NET Core process.',
      'A SignalR websocket carries UI diffs (DOM patches) from server to client on every interaction.',
      'Fast initial load (no large WASM download), but every click round-trips to the server (~20–50ms).',
      'Stateful: each user\'s circuit holds component state in server memory — scalability requires sticky sessions or distributed state.',
      'Good for: intranet apps, dashboards, apps where latency to a nearby server is fine.',
    ]},
    { heading: 'Blazor WebAssembly', points: [
      '.NET runtime (CoreCLR) compiled to WebAssembly runs entirely in the browser sandbox.',
      'First load downloads ~2–5 MB of WASM and .NET assemblies; subsequent visits use browser cache.',
      'No server required after load — can be hosted as static files on a CDN.',
      'Supports AOT (Ahead-of-Time) compilation: faster runtime, even larger initial download.',
      'Good for: offline-capable apps, high-interactivity UIs, cases where server latency is unacceptable.',
    ]},
    { heading: 'Blazor Hybrid (.NET MAUI)', points: [
      'Embeds Blazor components inside a native app via BlazorWebView — a native WebView control.',
      'Share UI components between your Blazor web app and a .NET MAUI native app.',
      'Full access to native device APIs (camera, GPS, notifications) via .NET MAUI services.',
      'Deploy to Windows, macOS, iOS, and Android from one codebase.',
    ]},
    { heading: '.NET 8 Unified Model', points: [
      '.NET 8 introduced a single Blazor Web App template that supports all render modes.',
      'Default is Static SSR (plain server-rendered HTML, no interactivity overhead).',
      'Per-component or per-page @rendermode annotation opts into Server, WASM, or Auto interactivity.',
      'Auto mode: first renders with Server (fast startup), transitions to WASM after it downloads.',
      'This model gives you SSG speed + SSR freshness + WASM interactivity — all in one project.',
    ]},
  ];

  codeTabs: CodeTab[] = [
    { label: 'Minimal Component', language: 'csharp', code:
`@* Counter.razor *@
@page "/counter"

<h1>Count: @count</h1>
<button @onclick="Increment">+1</button>

@code {
    private int count = 0;
    private void Increment() => count++;
}` },
    { label: 'Component with Parameters', language: 'csharp', code:
`@* Greeting.razor *@
<p>Hello, @Name! You are @Age years old.</p>

@code {
    [Parameter] public string Name { get; set; } = "";
    [Parameter] public int Age { get; set; }
}

@* Usage in parent *@
<Greeting Name="Alice" Age="30" />` },
    { label: 'Render Mode (.NET 8)', language: 'csharp', code:
`@* App.razor — global render mode *@
<Routes @rendermode="InteractiveServer" />

@* Per-component override *@
@page "/live-chart"
@rendermode InteractiveWebAssembly

<LiveChart />

@* Auto: Server first, WASM after download *@
@rendermode InteractiveAuto` },
    { label: 'Blazor Server Program.cs', language: 'csharp', code:
`// .NET 8 Blazor Web App entry point
var builder = WebApplication.CreateBuilder(args);

builder.Services.AddRazorComponents()
    .AddInteractiveServerComponents()     // Blazor Server
    .AddInteractiveWebAssemblyComponents(); // Blazor WASM

var app = builder.Build();

app.UseStaticFiles();
app.UseAntiforgery();

app.MapRazorComponents<App>()
    .AddInteractiveServerRenderMode()
    .AddInteractiveWebAssemblyRenderMode();

app.Run();` },
  ];

  mistakes: CommonMistake[] = [
    { title: 'Calling StateHasChanged() unnecessarily',
      wrong: 'private void Update() { data = Fetch(); StateHasChanged(); }',
      right: 'private void Update() { data = Fetch(); } // Blazor re-renders after sync event handlers automatically',
      explanation: 'Blazor automatically calls StateHasChanged() after event handlers. Only call it manually for async updates or background threads.' },
    { title: 'Using @onclick with async void',
      wrong: 'private async void OnClick() { await Task.Delay(1000); }',
      right: 'private async Task OnClick() { await Task.Delay(1000); }',
      explanation: 'async void swallows exceptions and prevents Blazor from awaiting completion. Always use async Task for event handlers.' },
    { title: 'Singleton services holding per-user state in Blazor Server',
      wrong: 'builder.Services.AddSingleton<UserState>(); // Shared across ALL users!',
      right: 'builder.Services.AddScoped<UserState>(); // One instance per SignalR circuit',
      explanation: 'In Blazor Server, Scoped = per circuit (per user). Singletons are shared across all connected clients — a data isolation bug.' },
    { title: 'Forgetting @using directives in components',
      wrong: '<MyComponent />  // Error: component not found',
      right: '@using MyApp.Components\n<MyComponent />  // Or add to _Imports.razor',
      explanation: 'Add commonly used namespaces to _Imports.razor so every component in that folder can use them without explicit @using.' },
    { title: 'Blocking calls in async lifecycle methods',
      wrong: 'protected override void OnInitialized() { data = httpClient.GetAsync("/api").Result; }',
      right: 'protected override async Task OnInitializedAsync() { data = await httpClient.GetAsync("/api"); }',
      explanation: '.Result blocks the thread in Blazor Server and can cause deadlocks. Always use async/await in lifecycle methods.' },
    { title: 'Mixing Static SSR and interactive components incorrectly',
      wrong: '// Interactive child inside a static SSR parent — no interactivity',
      right: '@rendermode InteractiveServer  // Apply to the component that needs interactivity',
      explanation: 'In .NET 8, a Static SSR parent cannot make its children interactive — the rendermode must be applied at the interactive component\'s level.' },
  ];

  challenge: Challenge = {
    title: 'Build a Stateful Counter with Reset',
    language: 'csharp',
    description: 'Create a Blazor component with an increment button, a decrement button, a reset button, and a display showing the current count. The count should never go below 0.',
    hints: ['Use @onclick for all three buttons', 'Use a private int field for state', 'Guard decrement with an if-check or Math.Max', 'Blazor re-renders automatically after event handlers'],
    starterCode:
`@page "/counter"

<h1>Counter</h1>
<!-- Add count display, increment, decrement, and reset buttons here -->

@code {
    // Add your state and methods here
}`,
    solution:
`@page "/counter"

<h1>Counter: @count</h1>
<button @onclick="Increment">+1</button>
<button @onclick="Decrement" disabled="@(count == 0)">-1</button>
<button @onclick="Reset">Reset</button>

@code {
    private int count = 0;
    private void Increment() => count++;
    private void Decrement() => count = Math.Max(0, count - 1);
    private void Reset()     => count = 0;
}`,
  };

  quiz: QuizQuestion[] = [
    { q: 'What transport does Blazor Server use to send UI updates to the browser?',
      options: ['HTTP polling', 'WebSockets via SignalR', 'WebAssembly postMessage', 'Server-Sent Events'],
      answer: 1, explanation: 'Blazor Server uses a persistent SignalR WebSocket connection to push DOM diffs from the server to the browser after each interaction.' },
    { q: 'Which Blazor hosting model runs .NET entirely in the browser?',
      options: ['Blazor Server', 'Blazor Hybrid', 'Blazor WebAssembly', 'Blazor Static SSR'],
      answer: 2, explanation: 'Blazor WebAssembly compiles the .NET runtime to WebAssembly and runs it in the browser sandbox, requiring no server connection after initial load.' },
    { q: 'What is the correct service lifetime for user-specific state in Blazor Server?',
      options: ['Singleton', 'Transient', 'Scoped', 'Singleton or Scoped'],
      answer: 2, explanation: 'Scoped in Blazor Server means one instance per SignalR circuit (i.e., per connected user). Singleton would be shared across all users — a serious bug.' },
    { q: 'What does the @rendermode directive control in .NET 8 Blazor?',
      options: ['CSS rendering order', 'Whether the component uses SSR, Server, WASM, or Auto interactivity', 'Font rendering on WASM', 'Razor template compilation'],
      answer: 1, explanation: '@rendermode selects the interactivity model: Static SSR (no JS), InteractiveServer (SignalR), InteractiveWebAssembly (WASM), or Auto (Server first, then WASM).' },
    { q: 'Which file contains global @using statements shared across all Razor components in a folder?',
      options: ['App.razor', 'Program.cs', '_Imports.razor', 'Routes.razor'],
      answer: 2, explanation: '_Imports.razor automatically applies @using, @inject, and other directives to all .razor files in the same folder and its subfolders.' },
    { q: 'What is the role of Routes.razor in a Blazor Web App (.NET 8+)?', options: ['It defines all page routes manually', 'It hosts the Router component and is rendered by App.razor to enable automatic page discovery', 'It is a configuration file', 'It replaces Program.cs'], answer: 1, explanation: 'Routes.razor wraps the <Router> component and is the entry point for Blazor\'s page routing system. App.razor renders <Routes /> alongside HeadOutlet, providing the root layout shell. The Router scans assemblies for @page directives to build the route table automatically.' },
  ];

  qna: QnaItem[] = [
    { q: 'When should I choose Blazor Server over Blazor WebAssembly?',
      a: 'Choose Server when: you need fast initial load (no WASM download), access to server resources (DB, file system) directly, or when the app runs on an intranet with reliable low-latency connections. Choose WASM when: you need offline capability, the app must run without a server after load, or you need near-zero latency for highly interactive UIs.' },
    { q: 'Can I share components between Blazor Server and Blazor WASM projects?',
      a: 'Yes — put shared components in a Razor Class Library (RCL). Both Server and WASM projects reference the RCL. .NET 8 unified template makes this even easier: one project supports both render modes, and components in a shared RCL work in both contexts.' },
    { q: 'How does Blazor compare to React/Angular?',
      a: 'Blazor lets .NET teams build UIs without JavaScript. The component model is similar to React (one-file components, props, state). Unlike React/Angular, Blazor can run on the server (no client bundle) or in WASM. The ecosystem is smaller, and some browser APIs require JS interop. It\'s ideal for .NET-heavy teams but not for teams who need a large JS ecosystem or prefer TypeScript.' },
    { q: 'What is the _Imports.razor file for?',
      a: '_Imports.razor is processed before every .razor file in its folder tree. It typically holds @using statements for namespaces (so components don\'t repeat them), @inject for shared services, and @layout to set a default layout. Think of it as a shared "header" automatically prepended to every component in that folder.' },
  ];

  revision: RevisionSummary = {
    oneLiner: 'Blazor builds web UIs in C# and Razor — Server runs on the server via SignalR, WASM runs in the browser via .NET WebAssembly, Hybrid embeds in native apps.',
    mustKnow: [
      'Blazor Server: C# on server, SignalR websocket, fast startup, needs persistent connection',
      'Blazor WASM: .NET runs in browser via WebAssembly, offline-capable, larger download',
      'Blazor Hybrid: Razor components in .NET MAUI for native desktop/mobile',
      '.NET 8 @rendermode: choose per-component interactivity (Server, WASM, Auto, Static SSR)',
      'Scoped = per circuit in Blazor Server; never use Singleton for user state',
      '_Imports.razor: shared @using/inject directives for a folder',
    ],
    interviewFocus: [
      'Explain the difference between Blazor Server and Blazor WASM with trade-offs',
      'What is a SignalR circuit in Blazor Server and why do scaling requirements differ from WASM?',
      'When would you use Blazor Auto render mode?',
      'Why is Scoped the correct DI lifetime for user state in Blazor Server?',
    ],
  };
}
