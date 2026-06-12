import { Component } from '@angular/core';
import { PageMetaComponent }      from '../../../shared/page-meta/page-meta';
import { QuickRefComponent, QuickRefItem } from '../../../shared/quick-ref/quick-ref';
import { TheoryBlockComponent, TheoryPoint } from '../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../shared/code-block/code-block';
import { ChallengeBlockComponent, Challenge } from '../../../shared/challenge-block/challenge-block';
import { QuizBlockComponent, QuizQuestion } from '../../../shared/quiz-block/quiz-block';
import { QnaBlockComponent, QnaItem } from '../../../shared/qna-block/qna-block';
import { PageCompleteComponent } from '../../../shared/page-complete/page-complete';

const quickRef: QuickRefItem[] = [
  { name: 'AddSignalR()',             type: 'method',    desc: 'Registers SignalR services in the DI container.' },
  { name: 'MapHub<T>()',              type: 'method',    desc: 'Maps a Hub to a route; clients connect to this URL.' },
  { name: 'Hub',                      type: 'class',     desc: 'Base class for server-side hubs; provides Clients, Groups, Context.' },
  { name: 'IHubContext<T>',           type: 'interface', desc: 'Inject into controllers/services to push messages outside a hub method.' },
  { name: 'Clients.All',              type: 'accessor',  desc: 'Send to all connected clients.' },
  { name: 'Clients.Caller',           type: 'accessor',  desc: 'Send only to the client that invoked the hub method.' },
  { name: 'Groups.AddToGroupAsync()', type: 'method',    desc: 'Add a connection to a named group for targeted broadcasts.' },
  { name: 'AddStackExchangeRedis()',  type: 'method',    desc: 'Redis backplane for scale-out — shares messages across server instances.' },
];

const theory: TheoryPoint[] = [
  {
    heading: 'How SignalR works',
    points: [
      'SignalR negotiates the best transport: <strong>WebSocket</strong> first, then Server-Sent Events, then long polling. The abstraction means you write hub code the same way regardless of transport.',
      'The client receives messages as they are pushed by the server — no polling. This makes SignalR ideal for chat, live dashboards, collaboration, and notifications.',
      'Use <code>AddSignalR()</code> in DI and <code>MapHub&lt;T&gt;("/path")</code> in routing. The JavaScript client connects via <code>HubConnectionBuilder</code>.',
    ],
  },
  {
    heading: 'Hubs',
    points: [
      'A <code>Hub</code> is a transient class (one instance per invocation) that exposes methods clients can call. <code>Hub.Clients</code> gives access to connected clients; <code>Hub.Context</code> provides the caller\'s identity.',
      'Hub methods are public and return <code>Task</code> or <code>ValueTask</code>. Clients invoke them by string name — a rename on the server without updating the client breaks the call silently.',
      'Apply <code>[Authorize]</code> on the hub class or individual methods. The auth middleware must run before the SignalR endpoint in the pipeline.',
    ],
  },
  {
    heading: 'Groups',
    points: [
      'Groups are named sets of connections. Call <code>Groups.AddToGroupAsync(connectionId, groupName)</code> to add a connection, then broadcast with <code>Clients.Group("name").SendAsync(...)</code>.',
      'Group membership is in-memory and lost on reconnect. Clients must re-join groups in the <code>onreconnected</code> callback — the server has no record of their previous groups.',
      '<code>Clients.OthersInGroup(name)</code> sends to all group members except the caller — use it for chat to avoid the sender seeing their own echoed message.',
    ],
  },
  {
    heading: 'IHubContext & scale-out',
    points: [
      'Inject <code>IHubContext&lt;T&gt;</code> into controllers or background services to push messages without an active hub invocation — e.g. a price update worker pushing to all clients.',
      'For scale-out across multiple server instances, add a Redis backplane via <code>AddStackExchangeRedis()</code>. All instances subscribe to Redis and forward messages to their local connections.',
      'Azure SignalR Service is a fully managed alternative — it offloads connection management entirely, letting your servers act as thin hub logic hosts.',
    ],
  },
];

const codeTabs: CodeTab[] = [
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
    .withAutomaticReconnect()
    .configureLogging(signalR.LogLevel.Warning)
    .build();

connection.on("ReceiveMessage", (user, text) => appendMessage(user, text));
connection.on("UserJoined", (name) => showSystemMessage(\`\${name} joined\`));

await connection.start();
await connection.invoke("JoinRoom", "general");

document.querySelector("#sendBtn").addEventListener("click", async () => {
    const text = document.querySelector("#input").value;
    await connection.invoke("SendMessage", "general", text);
});

// Re-join groups after reconnect — server loses membership on disconnect
connection.onreconnected(() => connection.invoke("JoinRoom", "general"));`,
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

await connection.StartAsync();
await connection.InvokeAsync("JoinRoom", "general");
await connection.InvokeAsync("SendMessage", "general", "Hello from .NET!");

// Server-to-client streaming
var stream = connection.StreamAsync<ChatMessage>("StreamHistory", "general");
await foreach (var msg in stream)
    Console.WriteLine($"[history] {msg.User}: {msg.Text}");

await connection.StopAsync();`,
  },
  {
    label: 'IHubContext (push from service)',
    language: 'csharp',
    code: `[ApiController, Route("api/[controller]")]
public class NotificationsController(IHubContext<ChatHub> hubContext) : ControllerBase
{
    [HttpPost("broadcast")]
    public async Task<IActionResult> BroadcastAlert([FromBody] AlertDto alert)
    {
        await hubContext.Clients.All
            .SendAsync("Alert", alert.Title, alert.Message);
        return Ok();
    }

    [HttpPost("rooms/{roomId}/announce")]
    public async Task<IActionResult> AnnounceToRoom(string roomId, [FromBody] string text)
    {
        await hubContext.Clients.Group(roomId).SendAsync("SystemMessage", text);
        return Ok();
    }
}

// Same pattern in a BackgroundService
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
    label: 'Redis Scale-Out',
    language: 'csharp',
    code: `// Microsoft.AspNetCore.SignalR.StackExchangeRedis
builder.Services.AddSignalR()
    .AddStackExchangeRedis("localhost:6379", opts =>
    {
        opts.Configuration.ChannelPrefix = RedisChannel.Literal("MyApp");
    });

// Hub code and client code are unchanged.
// Redis relays messages between server instances:
// server A sends → Redis pub → server B receives → forwards to its connections

// Azure SignalR Service (fully managed, no Redis to maintain)
// Microsoft.Azure.SignalR
builder.Services.AddSignalR()
    .AddAzureSignalR(builder.Configuration["AzureSignalR:ConnectionString"]);`,
  },
];

const challenge: Challenge = {
  title: 'Live Chat Room',
  language: 'csharp',
  description: 'Build a SignalR chat hub:\n1. `ChatHub` with methods: `JoinRoom(roomId)`, `LeaveRoom(roomId)`, `SendMessage(roomId, text)`.\n2. `JoinRoom` adds the connection to a group and broadcasts `UserJoined` to the group.\n3. `SendMessage` broadcasts `ReceiveMessage(user, text)` to all others in the group.\n4. Override `OnDisconnectedAsync` to log the disconnection.\n5. Expose `POST /api/notify/{roomId}` that pushes a system message via `IHubContext<ChatHub>`.',
  hints: [
    'Use Context.User?.Identity?.Name to get the caller\'s name',
    'Groups.AddToGroupAsync(Context.ConnectionId, roomId)',
    'Clients.OthersInGroup(roomId) excludes the sender',
    'Inject IHubContext<ChatHub> into the controller constructor',
  ],
  starterCode: `builder.Services.AddSignalR();
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
        Console.WriteLine($"Disconnected: {Context.ConnectionId}");
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

const quiz: QuizQuestion[] = [
  {
    q: 'Which transport does SignalR prefer when available?',
    options: ['Long polling', 'Server-Sent Events', 'WebSocket', 'HTTP/2 streams'],
    answer: 2,
    explanation: 'SignalR negotiates WebSocket first as it is full-duplex and lowest latency. It falls back to SSE then long polling.',
  },
  {
    q: 'A user disconnects and reconnects. What happens to their group membership?',
    options: [
      'SignalR re-adds them to their previous groups automatically',
      'Group membership is preserved in Redis',
      'Group membership is lost — the client must re-join groups on reconnect',
      'The server throws an exception',
    ],
    answer: 2,
    explanation: 'Groups are tracked by connectionId. On reconnect a new connectionId is assigned. Clients must re-invoke JoinRoom (or equivalent) in the onreconnected callback.',
  },
  {
    q: 'How do you push messages to SignalR clients from a background service?',
    options: [
      'Call Hub.Clients directly using a static reference',
      'Inject IHubContext<T> and call its Clients property',
      'Create a new Hub instance with new ChatHub()',
      'Use HttpClient to call a controller that holds the hub',
    ],
    answer: 1,
    explanation: 'IHubContext<T> is the DI-safe way to access the hub from outside — inject it anywhere and call Clients.All, Clients.Group(), etc.',
  },
];

const qna: QnaItem[] = [
  {
    q: 'Does SignalR support streaming?',
    a: 'Yes — server-to-client streaming via ChannelReader<T> or IAsyncEnumerable<T> return types on hub methods. Client-to-server streaming is also supported. The JavaScript client uses connection.stream() and the .NET client uses StreamAsync().',
  },
  {
    q: 'How do I authenticate SignalR connections?',
    a: 'Use the same auth middleware as the rest of the app. For JWT, the JavaScript client passes the token via accessTokenFactory; SignalR reads it from the query string (?access_token=) because browsers cannot set Authorization headers for WebSocket upgrades. Add [Authorize] to the hub class or individual methods.',
  },
  {
    q: 'What is the Azure SignalR Service and when should I use it?',
    a: 'Azure SignalR Service is a fully managed backplane that offloads WebSocket connection management from your servers. Use it when you need horizontal scale-out without managing Redis, or when your servers are serverless and cannot maintain persistent connections.',
  },
];

@Component({
  selector: 'app-aspnet-signalr',
  standalone: true,
  imports: [PageMetaComponent, QuickRefComponent, TheoryBlockComponent, CodeBlockComponent, ChallengeBlockComponent, QuizBlockComponent, QnaBlockComponent, PageCompleteComponent],
  templateUrl: './signalr.html',
  styleUrl: './signalr.scss',
})
export class AspnetSignalR {
  quickRef  = quickRef;
  theory    = theory;
  codeTabs  = codeTabs;
  challenge = challenge;
  quiz      = quiz;
  qna       = qna;
}
