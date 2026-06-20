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
  selector: 'app-blazor-server-signalr',
  standalone: true,
  imports: [PageMetaComponent, QuickRefComponent, TheoryBlockComponent, CodeBlockComponent,
    CommonMistakesComponent, ChallengeBlockComponent, QuizBlockComponent, QnaBlockComponent,
    RevisionCardComponent, PageCompleteComponent],
  templateUrl: './server-signalr.html',
  styleUrl: './server-signalr.scss'
})
export class BlazorServerSignalr {
  quickRef: QuickRefItem[] = [
    { name: 'SignalR circuit', type: 'keyword', desc: 'The persistent WebSocket connection powering Blazor Server.' },
    { name: 'Hub<T>', type: 'class', desc: 'SignalR Hub — define server-side methods clients can call.' },
    { name: 'IHubContext<T>', type: 'interface', desc: 'Send messages to clients from outside a Hub (e.g., from a service).' },
    { name: 'CircuitHandler', type: 'class', desc: 'Hook into circuit connect/disconnect events.' },
    { name: 'builder.Services.AddSignalR()', type: 'method', desc: 'Register SignalR services.' },
    { name: 'app.MapHub<T>("/path")', type: 'method', desc: 'Map a Hub to a URL endpoint.' },
    { name: 'HubConnection', type: 'class', desc: 'Client-side connection object (JS or .NET client).' },
    { name: 'Clients.All.SendAsync()', type: 'method', desc: 'Broadcast to all connected clients.' },
  ];

  theory: TheoryPoint[] = [
    {
      heading: 'How Blazor Server uses SignalR',
      points: ['Blazor Server renders the component tree on the server and sends HTML diffs to the browser via a SignalR WebSocket connection called a circuit. Every click, keystroke, and lifecycle event is sent to the server; the resulting DOM diff is sent back. The circuit carries state (component instances, DI scope) and lives as long as the WebSocket stays connected.',
      'The circuit = the SignalR connection = the Scoped DI lifetime.', 'DOM diffs (not full HTML) travel over the WebSocket.', 'Disconnect > reconnect timeout = circuit lost and state gone.', 'Memory: each active circuit consumes server memory for all component state.']
    },
    {
      heading: 'Adding real-time features with SignalR Hubs',
      points: ['You can add standalone SignalR Hubs alongside Blazor Server to push data from the server to clients independently of Blazor\'s circuit. Inject `IHubContext<MyHub>` into any service to send messages from background services, API controllers, or event handlers. This enables chat, live dashboards, and notifications without rebuilding the component.',
      'IHubContext<T> sends messages from anywhere in the app to connected clients.', 'Register with builder.Services.AddSignalR() and app.MapHub<T>().', 'Clients can be the JS SignalR client or a .NET HubConnection.', 'Combine with hosted services (IHostedService) for server-driven push.']
    },
    {
      heading: 'Circuit management and scaling',
      points: ['Circuit connection settings (timeout, buffer size) are configured via `AddInteractiveServerComponents(options => ...)`. For multi-server deployments, circuits are pinned to one server — use sticky sessions (load balancer affinity) or move to Azure SignalR Service which handles connection routing. CircuitHandler lets you react to circuit connect/disconnect events for cleanup or logging.',
      'Sticky sessions required for multi-server Blazor Server — or use Azure SignalR Service.', 'CircuitHandler.OnConnectionUpAsync/DownAsync fires on circuit changes.', 'Disconnected circuit timeout default is 0 seconds (server-configurable).', 'Azure SignalR Service decouples the WebSocket from the app server.']
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'SignalR Hub',
      language: 'csharp',
      code: `// ChatHub.cs
public class ChatHub : Hub
{
    public async Task SendMessage(string user, string message)
    {
        await Clients.All.SendAsync("ReceiveMessage", user, message);
    }
}

// Program.cs
builder.Services.AddSignalR();
app.MapHub<ChatHub>("/chathub");`
    },
    {
      label: 'Blazor component as chat client',
      language: 'csharp',
      code: `@page "/chat"
@rendermode InteractiveServer
@inject NavigationManager Nav
@implements IAsyncDisposable

<ul>@foreach (var m in messages) { <li>@m</li> }</ul>
<input @bind="input" /><button @onclick="Send">Send</button>

@code {
    private HubConnection? hub;
    private List<string> messages = [];
    private string input = "";

    protected override async Task OnInitializedAsync()
    {
        hub = new HubConnectionBuilder()
            .WithUrl(Nav.ToAbsoluteUri("/chathub"))
            .Build();

        hub.On<string, string>("ReceiveMessage", (user, msg) =>
        {
            messages.Add($"{user}: {msg}");
            InvokeAsync(StateHasChanged);
        });

        await hub.StartAsync();
    }

    private async Task Send()
    {
        if (hub is not null)
            await hub.SendAsync("SendMessage", "Me", input);
        input = "";
    }

    public async ValueTask DisposeAsync()
    {
        if (hub is not null) await hub.DisposeAsync();
    }
}`
    },
    {
      label: 'IHubContext from a service',
      language: 'csharp',
      code: `// Push live updates from a background service
public class StockPriceService(IHubContext<StockHub> hub) : BackgroundService
{
    protected override async Task ExecuteAsync(CancellationToken ct)
    {
        while (!ct.IsCancellationRequested)
        {
            var price = GetCurrentPrice("MSFT");
            await hub.Clients.All.SendAsync("PriceUpdate", "MSFT", price, ct);
            await Task.Delay(1000, ct);
        }
    }
}

// Program.cs
builder.Services.AddHostedService<StockPriceService>();`
    },
    {
      label: 'CircuitHandler',
      language: 'csharp',
      code: `public class ConnectionTracker(ILogger<ConnectionTracker> logger)
    : CircuitHandler
{
    private int activeCircuits = 0;

    public override Task OnConnectionUpAsync(Circuit circuit, CancellationToken ct)
    {
        Interlocked.Increment(ref activeCircuits);
        logger.LogInformation("Circuit connected. Active: {count}", activeCircuits);
        return Task.CompletedTask;
    }

    public override Task OnConnectionDownAsync(Circuit circuit, CancellationToken ct)
    {
        Interlocked.Decrement(ref activeCircuits);
        logger.LogInformation("Circuit disconnected. Active: {count}", activeCircuits);
        return Task.CompletedTask;
    }
}

// Program.cs
builder.Services.AddScoped<CircuitHandler, ConnectionTracker>();`
    },
  ];

  mistakes: CommonMistake[] = [
    {
      title: 'Calling StateHasChanged from a SignalR hub.On callback without InvokeAsync',
      wrong: 'hub.On<string>("Update", msg => { messages.Add(msg); StateHasChanged(); });',
      right: 'hub.On<string>("Update", msg => InvokeAsync(() => { messages.Add(msg); StateHasChanged(); }));',
      explanation: 'SignalR callbacks run on a thread pool thread. On Blazor Server, StateHasChanged must be called on the circuit\'s synchronization context via InvokeAsync.'
    },
    {
      title: 'Not disposing the HubConnection',
      wrong: '// component goes out of scope without IAsyncDisposable',
      right: 'public async ValueTask DisposeAsync() { if (hub is not null) await hub.DisposeAsync(); }',
      explanation: 'An undisposed HubConnection holds a WebSocket open and keeps the server-side hub subscription alive, leaking resources.'
    },
    {
      title: 'Deploying multi-server Blazor Server without sticky sessions',
      wrong: '// Standard round-robin load balancing',
      right: '// Configure sticky sessions (affinity) or use Azure SignalR Service',
      explanation: 'Each circuit is pinned to one server instance. Without sticky sessions, requests may hit a different server that has no knowledge of the circuit, causing disconnections.'
    },
    {
      title: 'Using Clients.All inside a Blazor circuit directly',
      wrong: '// Trying to broadcast from a Blazor page event handler',
      right: '// Inject IHubContext<T> into a service and call from there',
      explanation: 'Blazor Server components do not have direct access to SignalR\'s IHubContext. Inject it into a service that\'s called from the component.'
    },
    {
      title: 'Not configuring reconnect for long-lived connections',
      wrong: 'new HubConnectionBuilder().WithUrl(url).Build()',
      right: 'new HubConnectionBuilder().WithUrl(url).WithAutomaticReconnect().Build()',
      explanation: 'Without WithAutomaticReconnect(), a temporary network blip permanently disconnects the client. Automatic reconnect handles transient failures gracefully.'
    },
  ];

  challenge: Challenge = {
    title: 'Live Vote Counter',
    language: 'csharp',
    description: 'Create a SignalR Hub with a `Vote(string option)` method that broadcasts vote counts. Build a Blazor page that shows two options (Yes/No) with their counts, connected to the hub. Clicking a button sends a vote and all connected clients update in real time.',
    hints: [
      'Store vote counts as a static dictionary in the hub (for simplicity).',
      'Broadcast updated counts to all clients after each vote.',
      'Use InvokeAsync(StateHasChanged) in the hub.On callback.',
    ],
    starterCode: `public class VoteHub : Hub
{
    private static readonly Dictionary<string, int> votes = new()
        { ["Yes"] = 0, ["No"] = 0 };

    public async Task Vote(string option)
    {
        // TODO: increment and broadcast
    }
}`,
    solution: `public class VoteHub : Hub
{
    private static readonly Dictionary<string, int> votes = new()
        { ["Yes"] = 0, ["No"] = 0 };

    public async Task Vote(string option)
    {
        if (votes.ContainsKey(option)) votes[option]++;
        await Clients.All.SendAsync("VotesUpdated", votes["Yes"], votes["No"]);
    }
}

// VotePage.razor
@page "/vote"
@rendermode InteractiveServer
@inject NavigationManager Nav
@implements IAsyncDisposable

<h2>Live Vote</h2>
<button @onclick='() => SendVote("Yes")'>Yes (@yesCount)</button>
<button @onclick='() => SendVote("No")'>No (@noCount)</button>

@code {
    private HubConnection? hub;
    private int yesCount, noCount;

    protected override async Task OnInitializedAsync()
    {
        hub = new HubConnectionBuilder()
            .WithUrl(Nav.ToAbsoluteUri("/votehub"))
            .WithAutomaticReconnect()
            .Build();
        hub.On<int, int>("VotesUpdated", (y, n) =>
            InvokeAsync(() => { yesCount = y; noCount = n; StateHasChanged(); }));
        await hub.StartAsync();
    }

    private async Task SendVote(string option)
    {
        if (hub is not null) await hub.SendAsync("Vote", option);
    }

    public async ValueTask DisposeAsync()
    {
        if (hub is not null) await hub.DisposeAsync();
    }
}`
  };

  quiz: QuizQuestion[] = [
    { q: 'What is a Blazor Server circuit?', options: ['A CSS animation loop', 'The persistent SignalR WebSocket connection per user', 'A background task', 'A render pipeline stage'], answer: 1, explanation: 'A circuit is the SignalR connection between the browser and the Blazor Server. It carries component state, DI scope, and DOM diff traffic.' },
    { q: 'How do you send messages from a background service to all SignalR clients?', options: ['CircuitHandler', 'IJSRuntime', 'IHubContext<T>', 'ISignalRBroadcast'], answer: 2, explanation: 'IHubContext<T> is the out-of-hub interface for sending messages to clients from anywhere in the application, including background services and controllers.' },
    { q: 'Why must you use InvokeAsync when updating state from a SignalR callback?', options: ['Performance', 'SignalR callbacks run on thread pool threads — InvokeAsync marshals to the circuit thread', 'It is required by the Hub API', 'To avoid JSON serialization'], answer: 1, explanation: 'Blazor Server\'s renderer is single-threaded per circuit. Thread pool callbacks must use InvokeAsync to dispatch back to the circuit\'s synchronization context.' },
    { q: 'What configuration is required for multi-server Blazor Server deployments?', options: ['AddSignalR() on each server', 'Sticky sessions or Azure SignalR Service', 'Redis caching', 'Shared file system'], answer: 1, explanation: 'Circuits are pinned to one server. Without sticky sessions or a backplane (Azure SignalR Service), subsequent requests may hit a different server that knows nothing of the circuit.' },
    { q: 'What method enables automatic reconnect on a HubConnection?', options: ['WithReconnect()', 'WithAutomaticReconnect()', 'EnableReconnect()', 'SetReconnectPolicy()'], answer: 1, explanation: 'WithAutomaticReconnect() configures the HubConnection to retry on disconnect using an exponential backoff policy by default.' },
  ];

  qna: QnaItem[] = [
    { q: 'Does Blazor WebAssembly use SignalR?', a: 'Not automatically. WASM components run in the browser and communicate via HTTP/fetch by default. You can add a SignalR HubConnection manually for real-time features, just as you would in any JavaScript app.' },
    { q: 'What happens when a circuit disconnects?', a: 'Blazor shows a "reconnecting" overlay and attempts reconnection. If the server\'s configured timeout expires (default 0 s — immediately on disconnect), the circuit is torn down and all state is lost. Configure the timeout via AddInteractiveServerComponents(o => o.DisconnectedCircuitRetentionPeriod = TimeSpan.FromMinutes(3)).' },
    { q: 'Can I use Azure SignalR Service with Blazor Server?', a: 'Yes. Install Microsoft.Azure.SignalR and call AddAzureSignalR() in Program.cs. This routes all WebSocket traffic through Azure\'s infrastructure, removing the sticky-session requirement and enabling horizontal scaling without a backplane.' },
    { q: 'How do I monitor active circuit count?', a: 'Implement a custom CircuitHandler and register it as Scoped. OnConnectionUpAsync / OnConnectionDownAsync fire on each connect/disconnect. Store a count in a Singleton service to track active circuits across all scopes.' },
  ];

  revision: RevisionSummary = {
    oneLiner: 'Blazor Server runs over a persistent SignalR circuit — understand circuit lifetime, use IHubContext to push updates from services, and use sticky sessions or Azure SignalR for multi-node deployments.',
    mustKnow: [
      'A Blazor Server circuit is a SignalR connection carrying DOM diffs and events.',
      'Scoped DI lifetime = circuit lifetime on Blazor Server.',
      'IHubContext<T> sends messages to clients from outside a Hub.',
      'InvokeAsync(StateHasChanged) is mandatory from SignalR callbacks.',
      'Multi-server requires sticky sessions or Azure SignalR Service.',
      'CircuitHandler hooks into connect/disconnect events for logging or cleanup.',
    ],
    interviewFocus: [
      'Explain what a Blazor Server circuit is and what it contains.',
      'How do you push data from a background service to a Blazor Server page?',
      'What scaling challenges does Blazor Server face and how do you address them?',
    ]
  };
}
