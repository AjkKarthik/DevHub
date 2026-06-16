import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../shared/page-meta/page-meta';
import { QuickRefComponent, QuickRefItem } from '../../../shared/quick-ref/quick-ref';
import { TheoryBlockComponent, TheoryPoint } from '../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../shared/code-block/code-block';
import { ChallengeBlockComponent, Challenge } from '../../../shared/challenge-block/challenge-block';
import { QuizBlockComponent, QuizQuestion } from '../../../shared/quiz-block/quiz-block';
import { QnaBlockComponent, QnaItem } from '../../../shared/qna-block/qna-block';
import { PageCompleteComponent } from '../../../shared/page-complete/page-complete';
import { BeforeAfterComponent, BeforeAfterExample } from '../../../shared/before-after/before-after';
import { CommonMistakesComponent, CommonMistake } from '../../../shared/common-mistakes/common-mistakes';
import { PrerequisitesComponent, Prerequisite } from '../../../shared/prerequisites/prerequisites';
import { RevisionCardComponent, RevisionSummary } from '../../../shared/revision-card/revision-card';

@Component({
  selector: 'app-aspnet-signalr',
  standalone: true,
  imports: [
    PageMetaComponent, QuickRefComponent, TheoryBlockComponent, CodeBlockComponent,
    ChallengeBlockComponent, QuizBlockComponent, QnaBlockComponent, PageCompleteComponent,
    BeforeAfterComponent, CommonMistakesComponent, PrerequisitesComponent, RevisionCardComponent,
  ],
  templateUrl: './signalr.html',
  styleUrl: './signalr.scss',
})
export class AspnetSignalR {

  prerequisites: Prerequisite[] = [
    { label: 'Middleware', route: '/aspnet/middleware' },
    { label: 'Routing', route: '/aspnet/routing' },
  ];

  quickRef: QuickRefItem[] = [
    { name: 'AddSignalR()',              type: 'method',    desc: 'Registers SignalR services in the DI container. Chain configuration options here.', since: 'Core 1+' },
    { name: 'MapHub<T>()',               type: 'method',    desc: 'Maps a Hub class to a WebSocket/HTTP endpoint; clients connect to this URL.', since: 'Core 2.1+' },
    { name: 'Hub',                       type: 'class',     desc: 'Base class for server-side hubs. Provides Clients, Groups, Context (caller identity, ConnectionId).', since: 'Core 1+' },
    { name: 'IHubContext<T>',            type: 'interface', desc: 'Inject into controllers/background services to push messages without an active hub invocation.', since: 'Core 1+' },
    { name: 'Clients.All',               type: 'accessor',  desc: 'Broadcast to every connected client.', since: 'Core 1+' },
    { name: 'Clients.Caller',            type: 'accessor',  desc: 'Send only to the client that invoked the hub method.', since: 'Core 1+' },
    { name: 'Clients.OthersInGroup()',   type: 'method',    desc: 'Send to all group members except the caller — avoids sender echo.', since: 'Core 1+' },
    { name: 'Groups.AddToGroupAsync()',  type: 'method',    desc: 'Add a connectionId to a named group for targeted broadcasts.', since: 'Core 1+' },
    { name: 'IAsyncEnumerable<T>',       type: 'interface', desc: 'Return type for server-to-client streaming hub methods — the client receives items as they are yielded.', since: '.NET 5+' },
    { name: 'AddStackExchangeRedis()',   type: 'method',    desc: 'Redis backplane — relays messages between server instances so all clients receive broadcasts.', since: 'Core 2.2+' },
  ];

  theory: TheoryPoint[] = [
    {
      heading: 'How SignalR works — transport negotiation and architecture',
      points: [
        'SignalR negotiates the best available transport: <strong>WebSocket</strong> (preferred — full duplex, lowest latency), then <strong>Server-Sent Events</strong> (server push only), then <strong>long polling</strong> (universal fallback). The hub abstraction is identical regardless of transport.',
        'The client connects to a negotiation endpoint (<code>/hubs/chat/negotiate</code>), which returns available transports and an access token for the real WebSocket URL. The client then upgrades the HTTP connection to a WebSocket.',
        'Hub instances are <strong>transient</strong> — a new object is created per invocation, not per connection. Avoid storing state in hub fields; use the DI container, a database, or a static/singleton service instead.',
        'The protocol layer is pluggable. The default is <strong>JSON</strong>. Add <code>.AddMessagePackProtocol()</code> for a binary format that is significantly smaller — useful for high-frequency data like sensor readings or game state.',
        'SignalR handles connection multiplexing internally: one long-lived WebSocket connection carries many logical messages. You interact with named hub methods, not raw bytes — the SDK serialises and deserialises transparently.',
      ],
    },
    {
      heading: 'Hubs — defining and invoking server methods',
      points: [
        'Declare a public class inheriting <code>Hub</code>. Public instance methods become callable from clients. The method name is the string clients use to invoke — rename it on the server without updating clients and the call fails silently.',
        '<code>Hub.Context</code> exposes the current caller: <code>Context.ConnectionId</code> (unique per connection), <code>Context.User</code> (the authenticated <code>ClaimsPrincipal</code>), and <code>Context.Items</code> (a per-connection dictionary for stashing state across calls).',
        'Apply <code>[Authorize]</code> on the hub class or individual methods. The <strong>authentication middleware must run before <code>MapHub</code></strong> in the pipeline — placing <code>UseAuthentication()</code>/<code>UseAuthorization()</code> after routing but before endpoint execution is the correct order.',
        'Hub methods must return <code>Task</code>, <code>ValueTask</code>, or a streaming return type. Synchronous hub methods are not recommended — they block the connection thread and can deadlock under load.',
        'Override <code>OnConnectedAsync()</code> and <code>OnDisconnectedAsync(Exception?)</code> for lifecycle hooks. These are called by the framework automatically — always call <code>await base.OnConnectedAsync()</code>/<code>OnDisconnectedAsync()</code> first.',
      ],
    },
    {
      heading: 'Groups — targeted broadcasting and room patterns',
      points: [
        'Groups are named sets of connection IDs maintained in-memory by SignalR. Call <code>Groups.AddToGroupAsync(Context.ConnectionId, groupName)</code> to add the current caller to a group. Group membership is not persisted — it vanishes when the server restarts or scales.',
        'Broadcast to a group with <code>Clients.Group("name").SendAsync("Event", data)</code>. Use <code>Clients.OthersInGroup("name")</code> to exclude the sender — essential for chat where the sender should not receive an echo of their own message.',
        '<strong>Group membership is lost on reconnect.</strong> A reconnect assigns a new <code>ConnectionId</code>. The client must re-invoke JoinRoom (or equivalent) in the <code>onreconnected</code> JavaScript callback. Not doing this is the #1 SignalR bug.',
        '<code>Groups.RemoveFromGroupAsync()</code> is idempotent — calling it when the connection is not in the group does not throw. You do not need to check membership first.',
        'Groups are not user-level — if a user has two browser tabs open, each has its own ConnectionId and must join independently. To send to all connections of a user, maintain a mapping from UserId → List&lt;ConnectionId&gt; and fan-out via <code>Clients.Clients(connectionIds)</code>.',
      ],
    },
    {
      heading: 'IHubContext — pushing messages from outside a hub',
      points: [
        'Inject <code>IHubContext&lt;ChatHub&gt;</code> into any DI-registered service: controllers, background workers, event handlers, or minimal API delegates. This is the standard way to push messages without being inside a hub invocation.',
        '<code>IHubContext&lt;T&gt;</code> exposes <code>Clients</code> and <code>Groups</code> — the same API as the hub\'s own properties. You can broadcast to all, specific connections, or groups. You <strong>cannot</strong> access <code>Context</code> (no caller exists).',
        'For typed clients (strongly-typed hub with an interface), inject <code>IHubContext&lt;ChatHub, IChatClient&gt;</code> — this gives compile-time safety on the client method names instead of string-based <code>SendAsync</code>.',
        'Scale-out with <code>AddStackExchangeRedis()</code> adds a Redis backplane. When server A calls <code>Clients.All.SendAsync(...)</code> through <code>IHubContext</code>, Redis pub/sub relays the message to server B which forwards it to its local connections. All instances act as one logical server.',
        'Azure SignalR Service is a managed alternative — it handles all persistent connections. Your server sends messages to Azure\'s API; Azure delivers them to clients. Ideal for serverless or container-per-request architectures where persistent WebSocket connections are impractical.',
      ],
    },
    {
      heading: 'Streaming — server-to-client and client-to-server',
      points: [
        '<strong>Server-to-client streaming</strong>: return <code>IAsyncEnumerable&lt;T&gt;</code> or <code>ChannelReader&lt;T&gt;</code> from a hub method. The client receives items as they are yielded — no need to buffer and send everything at once.',
        'Use <code>IAsyncEnumerable</code> for simple streams: <code>async IAsyncEnumerable&lt;decimal&gt; StreamPrices([EnumeratorCancellation] CancellationToken ct) { while (!ct.IsCancellationRequested) { yield return GetPrice(); await Task.Delay(1000, ct); } }</code>. The client cancels by stopping the subscription.',
        '<strong>Client-to-server streaming</strong>: accept a <code>ChannelReader&lt;T&gt;</code> or <code>IAsyncEnumerable&lt;T&gt;</code> as a hub method parameter. The server reads as the client sends. Useful for uploading chunks or streaming sensor data.',
        'The JavaScript client uses <code>connection.stream("MethodName", arg)</code> which returns a <code>Subject</code> you <code>.subscribe()</code> to. The .NET client uses <code>connection.StreamAsync&lt;T&gt;("MethodName")</code> returning an <code>IAsyncEnumerable&lt;T&gt;</code>.',
        'Streaming avoids the memory overhead of buffering large datasets. Instead of returning all 10,000 rows at once, the server yields them in batches — the client updates its UI incrementally and memory usage stays flat.',
      ],
    },
    {
      heading: 'Connection lifecycle and reconnection strategies',
      points: [
        'Call <code>.withAutomaticReconnect()</code> on <code>HubConnectionBuilder</code> to enable built-in reconnect. By default it retries at 0s, 2s, 10s, and 30s then stops. Pass custom delays: <code>.withAutomaticReconnect([0, 1000, 5000, null])</code> where <code>null</code> stops retrying.',
        'Implement <code>connection.onreconnecting(error => ...)</code> to update UI with a "Reconnecting…" state, and <code>connection.onreconnected(connectionId => ...)</code> to re-subscribe to groups and refresh any state that may have changed while disconnected.',
        'If the client cannot reconnect (max retries exceeded), <code>connection.onclose(error => ...)</code> fires. Offer the user an explicit "Reconnect" button rather than spinning forever — some disconnections are intentional (sleep, network change).',
        'On the server, <code>OnDisconnectedAsync</code> is called when a client disconnects — clean up group memberships, user presence records, or other per-connection state. The <code>exception</code> parameter is null for graceful disconnects, non-null for unexpected drops.',
        'Circuit breaker pattern for unreliable networks: track reconnect attempts in state, apply exponential back-off beyond the built-in retries, and stop attempting after a threshold. Notify the user and let them manually trigger reconnect once connectivity is confirmed.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Hub Definition',
      language: 'csharp',
      code: `[Authorize]
public class ChatHub : Hub
{
    private readonly ILogger<ChatHub> _logger;
    public ChatHub(ILogger<ChatHub> logger) => _logger = logger;

    public async Task SendMessage(string roomId, string text)
    {
        var user = Context.User?.Identity?.Name ?? "Anonymous";
        _logger.LogInformation("{User} sent to room {Room}", user, roomId);

        await Clients.OthersInGroup(roomId)
            .SendAsync("ReceiveMessage", user, text);

        await Clients.Caller.SendAsync("MessageSent", text);
    }

    public async Task JoinRoom(string roomId)
    {
        await Groups.AddToGroupAsync(Context.ConnectionId, roomId);
        await Clients.Group(roomId).SendAsync("UserJoined", Context.User?.Identity?.Name);
    }

    public async Task LeaveRoom(string roomId)
    {
        await Groups.RemoveFromGroupAsync(Context.ConnectionId, roomId);
        await Clients.Group(roomId).SendAsync("UserLeft", Context.User?.Identity?.Name);
    }

    public override async Task OnDisconnectedAsync(Exception? exception)
    {
        _logger.LogInformation("Client {Id} disconnected", Context.ConnectionId);
        await base.OnDisconnectedAsync(exception);
    }
}

// Program.cs
builder.Services.AddSignalR();
app.UseAuthentication();
app.UseAuthorization();
app.MapHub<ChatHub>("/hubs/chat");`,
    },
    {
      label: 'JavaScript Client',
      language: 'csharp',
      code: `// npm install @microsoft/signalr

const connection = new signalR.HubConnectionBuilder()
    .withUrl("/hubs/chat", {
        accessTokenFactory: () => localStorage.getItem("jwt") ?? ""
    })
    .withAutomaticReconnect([0, 2000, 10000, 30000])
    .configureLogging(signalR.LogLevel.Warning)
    .build();

// Register client-side handlers before starting
connection.on("ReceiveMessage", (user, text) => appendMessage(user, text));
connection.on("UserJoined",     (name) => showSystemMessage(\`\${name} joined\`));
connection.on("UserLeft",       (name) => showSystemMessage(\`\${name} left\`));

// Lifecycle hooks
connection.onreconnecting(() => setStatus("Reconnecting…"));
connection.onreconnected(async () => {
    setStatus("Connected");
    await connection.invoke("JoinRoom", currentRoom); // ← re-join after reconnect
});
connection.onclose(() => setStatus("Disconnected"));

await connection.start();
await connection.invoke("JoinRoom", "general");

document.querySelector("#sendBtn").addEventListener("click", async () => {
    const text = document.querySelector("#input").value;
    await connection.invoke("SendMessage", "general", text);
});`,
    },
    {
      label: '.NET Client',
      language: 'csharp',
      code: `// Microsoft.AspNetCore.SignalR.Client

var connection = new HubConnectionBuilder()
    .WithUrl("https://localhost:5001/hubs/chat", opts =>
    {
        opts.AccessTokenProvider = async () =>
            await tokenService.GetTokenAsync();
    })
    .WithAutomaticReconnect()
    .Build();

connection.On<string, string>("ReceiveMessage", (user, text) =>
    Console.WriteLine($"{user}: {text}"));

connection.Reconnected += async (connectionId) =>
{
    await connection.InvokeAsync("JoinRoom", "general");
};

await connection.StartAsync();
await connection.InvokeAsync("JoinRoom", "general");
await connection.InvokeAsync("SendMessage", "general", "Hello from .NET!");

await connection.StopAsync();`,
    },
    {
      label: 'IHubContext (push from service)',
      language: 'csharp',
      code: `[ApiController, Route("api/[controller]")]
public class NotificationsController(IHubContext<ChatHub> hub) : ControllerBase
{
    [HttpPost("broadcast")]
    public async Task<IActionResult> BroadcastAlert([FromBody] AlertDto alert)
    {
        await hub.Clients.All
            .SendAsync("Alert", alert.Title, alert.Message);
        return Ok();
    }

    [HttpPost("rooms/{roomId}/announce")]
    public async Task<IActionResult> AnnounceToRoom(string roomId, [FromBody] string text)
    {
        await hub.Clients.Group(roomId).SendAsync("SystemMessage", text);
        return Ok();
    }
}

// Push from BackgroundService
public class PriceUpdateWorker(IHubContext<PriceHub> hub) : BackgroundService
{
    protected override async Task ExecuteAsync(CancellationToken ct)
    {
        using var timer = new PeriodicTimer(TimeSpan.FromSeconds(1));
        while (await timer.WaitForNextTickAsync(ct))
        {
            var price = GetLatestPrice();
            await hub.Clients.All.SendAsync("PriceUpdate", price, ct);
        }
    }
}`,
    },
    {
      label: 'Streaming (server-to-client)',
      language: 'csharp',
      code: `// ── Server — IAsyncEnumerable streaming hub method ───────────────────
public class PriceHub : Hub
{
    public async IAsyncEnumerable<PriceUpdate> StreamPrices(
        string symbol,
        [EnumeratorCancellation] CancellationToken cancellationToken)
    {
        while (!cancellationToken.IsCancellationRequested)
        {
            yield return new PriceUpdate(symbol, GetLatestPrice(symbol));
            await Task.Delay(500, cancellationToken);
        }
    }
}

// ── .NET client — StreamAsync ─────────────────────────────────────────
await foreach (var update in connection.StreamAsync<PriceUpdate>(
    "StreamPrices", "AAPL", CancellationToken.None))
{
    Console.WriteLine($"{update.Symbol}: {update.Price:C}");
}

// ── JavaScript client — connection.stream() ────────────────────────────
const subject = connection.stream("StreamPrices", "AAPL");
subject.subscribe({
    next:     (update) => updatePriceUI(update),
    error:    (err)    => console.error("Stream error", err),
    complete: ()       => console.log("Stream complete"),
});

// Cancel the stream
subject.dispose();

// ── Client-to-server streaming ─────────────────────────────────────────
public async Task UploadChunks(IAsyncEnumerable<string> chunks)
{
    await foreach (var chunk in chunks)
        await ProcessChunk(chunk);  // handle each chunk as it arrives
}`,
    },
    {
      label: 'Redis Scale-Out',
      language: 'csharp',
      code: `// Microsoft.AspNetCore.SignalR.StackExchangeRedis
builder.Services.AddSignalR()
    .AddStackExchangeRedis("localhost:6379", opts =>
    {
        opts.Configuration.ChannelPrefix = RedisChannel.Literal("MyApp");
    });

// Hub code and client code are UNCHANGED.
// Redis relays messages between server instances automatically:
// server A sends → Redis pub/sub → server B receives → forwards to its connections

// MessagePack for smaller payloads (binary instead of JSON)
// Microsoft.AspNetCore.SignalR.Protocols.MessagePack
builder.Services.AddSignalR()
    .AddMessagePackProtocol();

// Azure SignalR Service (fully managed, no Redis to operate)
// Microsoft.Azure.SignalR
builder.Services.AddSignalR()
    .AddAzureSignalR(builder.Configuration["AzureSignalR:ConnectionString"]);

// Hub code and client code remain the same for all backplane options.`,
    },
  ];

  beforeAfter: BeforeAfterExample[] = [
    {
      title: 'Not re-joining groups on reconnect vs correct reconnect handler',
      before: `// Missing onreconnected handler — user silently stops receiving group messages
const connection = new signalR.HubConnectionBuilder()
    .withUrl("/hubs/chat")
    .withAutomaticReconnect()
    .build();

connection.on("ReceiveMessage", (user, text) => appendMessage(user, text));

await connection.start();
await connection.invoke("JoinRoom", "general");
// Reconnects happen silently — but the new ConnectionId is NOT in "general" group
// User sees no new messages and has no idea why`,
      after: `const connection = new signalR.HubConnectionBuilder()
    .withUrl("/hubs/chat")
    .withAutomaticReconnect()
    .build();

connection.on("ReceiveMessage", (user, text) => appendMessage(user, text));
connection.onreconnecting(() => setStatusBanner("Reconnecting…", "warning"));
connection.onreconnected(async () => {
    setStatusBanner("Reconnected", "success");
    await connection.invoke("JoinRoom", currentRoom); // ← re-join every time
});
connection.onclose(() => setStatusBanner("Disconnected. Refresh to reconnect.", "error"));

await connection.start();
await connection.invoke("JoinRoom", "general");`,
      note: 'Groups are keyed by ConnectionId. A reconnect assigns a new ConnectionId — the server has no record of what groups the old connection was in. Every client that uses groups must implement an onreconnected handler that re-joins all relevant groups.',
    },
    {
      title: 'Static hub reference vs IHubContext for server-initiated push',
      before: `// BUG: trying to hold a static reference to the Hub — it is transient and cannot be cached
public class PriceService
{
    private static ChatHub? _hub;  // ← Hub instances are created per-invocation

    public static void SetHub(ChatHub hub) => _hub = hub;

    public async Task BroadcastPrice(decimal price)
    {
        if (_hub != null)
            await _hub.Clients.All.SendAsync("PriceUpdate", price);
        // _hub is almost always null or disposed
    }
}`,
      after: `// Use IHubContext<T> — it is thread-safe and available from any DI-registered service
public class PriceService(IHubContext<PriceHub> hubContext)
{
    public async Task BroadcastPrice(decimal price)
    {
        await hubContext.Clients.All.SendAsync("PriceUpdate", price);
    }
}

// Register and inject normally:
builder.Services.AddScoped<PriceService>();
// PriceService receives IHubContext<PriceHub> automatically`,
      note: 'Hub instances are transient — one per invocation, disposed after the method returns. You can never safely cache or hold a reference to one. IHubContext<T> is the correct way to push messages from outside a hub: it is a singleton-safe DI service that manages the underlying connection store.',
    },
  ];

  mistakes: CommonMistake[] = [
    {
      title: 'Forgetting to re-join groups after reconnect',
      wrong: `// Client never re-joins groups on reconnect
const conn = new signalR.HubConnectionBuilder()
    .withUrl("/hubs/chat").withAutomaticReconnect().build();
await conn.start();
await conn.invoke("JoinRoom", "sales");
// After a network drop, conn reconnects automatically with a new ConnectionId
// But "sales" group still has the OLD ConnectionId — new messages never arrive`,
      right: `const conn = new signalR.HubConnectionBuilder()
    .withUrl("/hubs/chat").withAutomaticReconnect().build();
conn.onreconnected(async () => {
    await conn.invoke("JoinRoom", "sales"); // ← re-join every reconnect
});
await conn.start();
await conn.invoke("JoinRoom", "sales");`,
      explanation: 'Group membership is stored as a mapping of ConnectionId → group name. A reconnect assigns a completely new ConnectionId; the old one\'s group memberships are gone. The onreconnected callback is the only reliable place to restore group subscriptions.',
    },
    {
      title: 'Calling SendAsync with a mismatched event name',
      wrong: `// Server sends "receiveMessage" (camelCase) but client listens on "ReceiveMessage"
await Clients.All.SendAsync("receiveMessage", user, text);

// JavaScript client — never fires
connection.on("ReceiveMessage", (user, text) => appendMessage(user, text));`,
      right: `// Event names are case-sensitive — be consistent; prefer PascalCase on both sides
await Clients.All.SendAsync("ReceiveMessage", user, text);

connection.on("ReceiveMessage", (user, text) => appendMessage(user, text));
// Now matches — use a constant or typed interface to avoid typos`,
      explanation: 'SignalR event names are case-sensitive strings. A mismatch between SendAsync("receiveMessage") and connection.on("ReceiveMessage") means the client handler is never triggered — and there is no error or warning. Use TypeScript constants or a typed hub interface to enforce consistency.',
    },
    {
      title: 'Placing UseAuthentication() after MapHub()',
      wrong: `// BUG: [Authorize] on ChatHub is never evaluated — auth middleware is not in the pipeline yet
app.MapHub<ChatHub>("/hubs/chat");   // ← registered before auth runs
app.UseAuthentication();
app.UseAuthorization();`,
      right: `// Auth must run BEFORE endpoints are evaluated
app.UseRouting();
app.UseAuthentication();   // ← must be before MapHub
app.UseAuthorization();
app.MapHub<ChatHub>("/hubs/chat");`,
      explanation: 'ASP.NET Core middleware runs in registration order. MapHub registers an endpoint — if auth middleware runs after endpoint matching, [Authorize] attributes on the hub are checked but Context.User is already unauthenticated. Place UseAuthentication() and UseAuthorization() before any MapHub call.',
    },
    {
      title: 'Storing per-connection state in hub instance fields',
      wrong: `public class ChatHub : Hub
{
    private string? _currentRoom;  // BUG: new Hub instance per invocation — always null

    public async Task JoinRoom(string roomId)
    {
        _currentRoom = roomId;   // stored, then immediately discarded when method returns
        await Groups.AddToGroupAsync(Context.ConnectionId, roomId);
    }

    public async Task LeaveCurrentRoom()
    {
        // _currentRoom is always null here — different Hub instance
        await Groups.RemoveFromGroupAsync(Context.ConnectionId, _currentRoom!);
    }
}`,
      right: `public class ChatHub : Hub
{
    public async Task JoinRoom(string roomId)
    {
        Context.Items["room"] = roomId;  // ← per-connection dict, persists across calls
        await Groups.AddToGroupAsync(Context.ConnectionId, roomId);
    }

    public async Task LeaveCurrentRoom()
    {
        var room = Context.Items["room"] as string;
        if (room != null)
            await Groups.RemoveFromGroupAsync(Context.ConnectionId, room);
    }
}`,
      explanation: 'Hub instances are transient — one per method invocation, then disposed. Instance fields cannot carry state between calls. Use Context.Items (a per-connection Dictionary<object, object?> that persists for the connection\'s lifetime) for transient per-connection state, or an injected scoped/singleton service for durable state.',
    },
    {
      title: 'Not handling MessagePack contract when switching protocols',
      wrong: `// Added MessagePack but anonymous types are not serialisable by MessagePack
builder.Services.AddSignalR().AddMessagePackProtocol();

public async Task SendUpdate()
{
    // Anonymous type — cannot be deserialised by MessagePack on the client
    await Clients.All.SendAsync("Update", new { Price = 9.99, Symbol = "AAPL" });
}`,
      right: `// Use a named, public record/class — MessagePack can generate a contract for it
[MessagePackObject]
public record PriceUpdate([property: Key(0)] string Symbol, [property: Key(1)] decimal Price);

public async Task SendUpdate()
{
    await Clients.All.SendAsync("Update", new PriceUpdate("AAPL", 9.99m));
}`,
      explanation: 'MessagePack requires concrete types with deterministic key ordering ([MessagePackObject] + [Key(n)] attributes, or a contractless resolver). Anonymous types have no stable schema and fail at runtime when MessagePack tries to deserialise them on the client. Define explicit DTOs for all SignalR message payloads.',
    },
  ];

  challenge: Challenge = {
    title: 'Live Chat Room',
    language: 'csharp',
    description: `Build a SignalR chat hub with full lifecycle support:
1. <strong>ChatHub</strong> with methods: <code>JoinRoom(roomId)</code>, <code>LeaveRoom(roomId)</code>, <code>SendMessage(roomId, text)</code>.
2. <code>JoinRoom</code> adds the connection to a group and broadcasts <code>UserJoined</code> to that group.
3. <code>SendMessage</code> broadcasts <code>ReceiveMessage(user, text)</code> to <strong>others</strong> in the group (not the sender).
4. Override <code>OnDisconnectedAsync</code> to log the disconnection.
5. Expose <code>POST /api/notify/{roomId}</code> that pushes a system message via <code>IHubContext&lt;ChatHub&gt;</code>.`,
    hints: [
      'Use Context.User?.Identity?.Name to get the caller\'s name',
      'Groups.AddToGroupAsync(Context.ConnectionId, roomId)',
      'Clients.OthersInGroup(roomId) excludes the sender from receiving their own message',
      'Inject IHubContext<ChatHub> into the controller constructor',
    ],
    starterCode: `builder.Services.AddSignalR();
builder.Services.AddControllers();
var app = builder.Build();
app.UseAuthentication();
app.UseAuthorization();
// Map hub and controller here`,
    solution: `public class ChatHub : Hub
{
    public async Task JoinRoom(string roomId)
    {
        await Groups.AddToGroupAsync(Context.ConnectionId, roomId);
        await Clients.Group(roomId)
            .SendAsync("UserJoined", Context.User?.Identity?.Name ?? "Guest");
    }

    public async Task LeaveRoom(string roomId)
    {
        await Groups.RemoveFromGroupAsync(Context.ConnectionId, roomId);
        await Clients.Group(roomId)
            .SendAsync("UserLeft", Context.User?.Identity?.Name ?? "Guest");
    }

    public async Task SendMessage(string roomId, string text)
    {
        var user = Context.User?.Identity?.Name ?? "Guest";
        await Clients.OthersInGroup(roomId).SendAsync("ReceiveMessage", user, text);
        await Clients.Caller.SendAsync("MessageSent", text);
    }

    public override async Task OnDisconnectedAsync(Exception? ex)
    {
        Console.WriteLine(\$"Disconnected: {Context.ConnectionId}");
        await base.OnDisconnectedAsync(ex);
    }
}

[ApiController, Route("api/notify")]
public class NotifyController(IHubContext<ChatHub> hub) : ControllerBase
{
    [HttpPost("{roomId}")]
    public async Task<IActionResult> Post(string roomId, [FromBody] string msg)
    {
        await hub.Clients.Group(roomId).SendAsync("SystemMessage", msg);
        return Ok();
    }
}`,
  };

  quiz: QuizQuestion[] = [
    {
      q: 'Which transport does SignalR prefer when available?',
      options: ['Long polling', 'Server-Sent Events', 'WebSocket', 'HTTP/2 streams'],
      answer: 2,
      explanation: 'SignalR negotiates WebSocket first — it is full-duplex and has the lowest latency. It falls back to SSE (server-push only), then long polling (universal fallback). The hub abstraction is the same regardless of transport.',
    },
    {
      q: 'What happens to a user\'s group membership when they disconnect and reconnect?',
      options: [
        'SignalR re-adds them to their previous groups automatically',
        'Group membership is preserved for 30 seconds then expires',
        'Group membership is lost — the client must re-join groups in onreconnected',
        'The server throws ConnectionAbortedException',
      ],
      answer: 2,
      explanation: 'Groups are keyed by ConnectionId. A reconnect assigns a new ConnectionId — the server has no memory of what groups the old connection was in. Clients must re-invoke group join methods in the onreconnected callback.',
    },
    {
      q: 'How do you push messages to SignalR clients from a background service?',
      options: [
        'Hold a static reference to the Hub instance and call its Clients property',
        'Inject IHubContext<T> and use its Clients property',
        'Create a new Hub instance with new ChatHub() and call Clients',
        'Use HttpClient to call a controller that calls hub methods',
      ],
      answer: 1,
      explanation: 'IHubContext<T> is the correct, DI-safe way to push messages from outside an active hub invocation. Hub instances are transient and must never be cached. IHubContext exposes Clients and Groups just like the Hub base class.',
    },
    {
      q: 'Where must UseAuthentication() be placed relative to MapHub()?',
      options: [
        'After MapHub() — auth runs after routing resolves the endpoint',
        'Before MapHub() — auth must process the request before endpoint execution',
        'Order does not matter — authentication is always applied to all requests',
        'It should be placed inside ConfigureTestServices only',
      ],
      answer: 1,
      explanation: 'ASP.NET Core middleware runs in registration order. If UseAuthentication() is placed after MapHub(), the [Authorize] attribute on the hub is evaluated but Context.User is not populated — the request is treated as anonymous. Auth middleware must run before endpoint middleware.',
    },
    {
      q: 'How does Clients.OthersInGroup("room") differ from Clients.Group("room")?',
      options: [
        'OthersInGroup sends to all connections in the group including the caller',
        'OthersInGroup sends to all connections in the group EXCEPT the caller',
        'OthersInGroup only sends to the last-joined connection',
        'They are identical — OthersInGroup is deprecated',
      ],
      answer: 1,
      explanation: 'Clients.Group("room") broadcasts to ALL connections in the group including the caller. Clients.OthersInGroup("room") excludes the calling connection — essential in chat to prevent the sender from receiving their own message echoed back.',
    },
    {
      q: 'What is the correct return type for a server-to-client streaming hub method?',
      options: [
        'Task<IEnumerable<T>> — return all items at once',
        'IAsyncEnumerable<T> or ChannelReader<T> — yield items as they are produced',
        'Stream — write bytes directly to the response',
        'IObservable<T> — reactive push using Rx.NET',
      ],
      answer: 1,
      explanation: 'IAsyncEnumerable<T> and ChannelReader<T> are the supported return types for SignalR streaming. The client receives items as they are yielded — no buffering required. Stream is not a valid hub return type; IObservable is supported via the Reactive Extensions package but not built-in.',
    },
    {
      q: 'Why can\'t you store per-connection state in Hub instance fields?',
      options: [
        'Hub fields are cleared by the garbage collector between calls',
        'Hub instances are transient — a new instance is created per invocation, then disposed',
        'Hub fields are shared across all connections and would cause data leaks',
        'SignalR serialises Hub state between calls which makes fields read-only',
      ],
      answer: 1,
      explanation: 'Hub is transient: one instance is created per method invocation, then immediately disposed. Fields set in JoinRoom are gone by the time SendMessage is called — each invocation gets a fresh Hub object. Use Context.Items for per-connection transient state or a DI-registered service for durable state.',
    },
  ];

  qna: QnaItem[] = [
    { q: 'Does SignalR support streaming?', a: 'Yes — server-to-client streaming via <code>IAsyncEnumerable&lt;T&gt;</code> or <code>ChannelReader&lt;T&gt;</code> return types on hub methods. Client-to-server streaming is supported by accepting a <code>ChannelReader&lt;T&gt;</code> or <code>IAsyncEnumerable&lt;T&gt;</code> parameter. The JavaScript client uses <code>connection.stream()</code> and the .NET client uses <code>connection.StreamAsync&lt;T&gt;()</code>. Streaming avoids buffering large datasets — items are delivered as they are produced.' },
    { q: 'How do I authenticate SignalR connections?', a: 'Use the same auth middleware as the rest of the app. For JWT, the JavaScript client passes the token via <code>accessTokenFactory</code>: <code>.withUrl("/hubs/chat", { accessTokenFactory: () => getToken() })</code>. SignalR reads it from the <code>?access_token=</code> query string on the WebSocket upgrade request because browsers cannot set Authorization headers for WebSocket connections. Apply <code>[Authorize]</code> to the hub class or individual methods, and ensure <code>UseAuthentication()</code> runs before <code>MapHub()</code>.' },
    { q: 'What is the Azure SignalR Service and when should I use it?', a: 'Azure SignalR Service offloads WebSocket connection management to Azure\'s infrastructure. Your server sends messages to Azure\'s REST API; Azure delivers them to connected clients. Use it when running in containers or serverless (App Service free-tier, Azure Functions) where persistent WebSocket connections are impractical, or when you need to scale to tens of thousands of concurrent connections without managing a Redis backplane.' },
    { q: 'How do I send to all connections belonging to a specific user (not a group)?', a: 'Use <code>Clients.User(userId).SendAsync(...)</code> — this sends to all connections with that UserId claim. By default SignalR uses <code>ClaimTypes.NameIdentifier</code> as the user identifier. Alternatively, maintain your own mapping from UserId → List&lt;ConnectionId&gt; (in memory or Redis) and use <code>Clients.Clients(connectionIds).SendAsync(...)</code> to fan-out manually.' },
    { q: 'Can I use dependency injection in Hub methods?', a: 'Yes — Hub constructors support DI just like controllers. Any registered service can be injected. Because Hub is transient, avoid injecting Singleton services that hold mutable state unless they are thread-safe. For services that should live for the connection duration rather than per-invocation, use <code>Context.Items</code> to store a reference set in <code>OnConnectedAsync</code>.' },
    { q: 'How do I handle errors in hub methods?', a: 'Unhandled exceptions in hub methods are caught by SignalR and returned to the caller as a <code>HubException</code>. The error message is sent only if you configure <code>AddSignalR(opts => opts.EnableDetailedErrors = true)</code> — leave this off in production to avoid leaking stack traces. For known errors, throw <code>HubException("user-facing message")</code> explicitly; clients catch it in a try/catch around <code>connection.invoke()</code>.' },
    { q: 'What is the difference between Clients.All and Clients.Others?', a: '<code>Clients.All</code> broadcasts to every connected client including the caller. <code>Clients.Others</code> broadcasts to every client except the caller. For group-level equivalents: <code>Clients.Group("room")</code> includes the caller; <code>Clients.OthersInGroup("room")</code> excludes them. In chat, use <code>OthersInGroup</code> so the sender does not receive an echo of their own message.' },
    { q: 'How do I test SignalR hubs?', a: 'Unit tests: create the hub with mocked dependencies; call methods directly; assert on the injected services\' spy state. For <code>Hub.Clients</code> and <code>Hub.Groups</code>, use NSubstitute or Moq to create a substitute <code>IHubClients</code> and assign it to the hub\'s <code>Clients</code> property via reflection or a protected setter. Integration tests: use <code>WebApplicationFactory</code> and the <code>.NET SignalR client</code> to connect to the real hub and assert on received events.' },
  ];

  revision: RevisionSummary = {
    oneLiner: 'SignalR abstracts WebSocket/SSE/polling transport; Hubs expose server methods clients invoke; Groups broadcast to named connection sets; IHubContext pushes from outside hubs; groups must be re-joined on reconnect; Redis or Azure SignalR scales to multiple server instances.',
    mustKnow: [
      'SignalR negotiates WebSocket → SSE → long polling; hub code is transport-agnostic',
      'Hub instances are transient (one per invocation) — never cache Hub fields; use Context.Items for per-connection state',
      'Groups are keyed by ConnectionId — membership is lost on reconnect; always re-join in onreconnected',
      'UseAuthentication()/UseAuthorization() must be placed BEFORE MapHub() in the pipeline',
      'IHubContext<T> is the safe DI way to push from controllers, workers, or any service',
      'IAsyncEnumerable<T> return type enables server-to-client streaming — items are delivered as yielded',
      'Redis backplane or Azure SignalR Service is required for multi-instance scale-out',
    ],
    interviewFocus: [
      'What happens to group membership when a SignalR client disconnects and reconnects?',
      'How is IHubContext<T> different from injecting the Hub class directly?',
      'Why must UseAuthentication() run before MapHub() in the middleware pipeline?',
      'How do you implement server-to-client streaming in SignalR?',
      'When would you choose Azure SignalR Service over a Redis backplane?',
    ],
  };
}
