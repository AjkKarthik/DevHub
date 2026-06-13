import { Component } from '@angular/core';
import { PageMetaComponent }      from '../../../shared/page-meta/page-meta';
import { QuickRefComponent, QuickRefItem } from '../../../shared/quick-ref/quick-ref';
import { TheoryBlockComponent, TheoryPoint } from '../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../shared/code-block/code-block';
import { ChallengeBlockComponent, Challenge } from '../../../shared/challenge-block/challenge-block';
import { QuizBlockComponent, QuizQuestion } from '../../../shared/quiz-block/quiz-block';
import { QnaBlockComponent, QnaItem } from '../../../shared/qna-block/qna-block';
import { PageCompleteComponent } from '../../../shared/page-complete/page-complete';
import { CommonMistakesComponent, CommonMistake } from '../../../shared/common-mistakes/common-mistakes';
import { RevisionCardComponent, RevisionSummary } from '../../../shared/revision-card/revision-card';

@Component({
  selector: 'app-aspnet-websockets',
  standalone: true,
  imports: [PageMetaComponent, QuickRefComponent, TheoryBlockComponent, CodeBlockComponent,
            ChallengeBlockComponent, QuizBlockComponent, QnaBlockComponent, PageCompleteComponent,
            CommonMistakesComponent, RevisionCardComponent],
  templateUrl: './websockets.html',
  styleUrl: './websockets.scss',
})
export class AspnetWebsockets {

  quickRef: QuickRefItem[] = [
    { name: 'UseWebSockets()',                      type: 'method',   desc: 'Adds WebSocket middleware. Call before endpoint routing.' },
    { name: 'HttpContext.WebSockets.IsWebSocketRequest', type: 'accessor', desc: 'True when the request is a WebSocket upgrade request.' },
    { name: '.AcceptWebSocketAsync()',              type: 'method',   desc: 'Performs the HTTP→WebSocket upgrade handshake; returns WebSocket.' },
    { name: 'WebSocket.SendAsync()',                type: 'method',   desc: 'Sends a frame; takes ArraySegment<byte>, message type, endOfMessage, ct.' },
    { name: 'WebSocket.ReceiveAsync()',             type: 'method',   desc: 'Receives a frame into a buffer; returns WebSocketReceiveResult.' },
    { name: 'WebSocketReceiveResult.MessageType',  type: 'accessor', desc: 'Text, Binary, or Close — determines how to interpret the buffer.' },
    { name: 'WebSocketState',                       type: 'class',    desc: 'Open, Closed, CloseReceived, CloseSent, Aborted — connection lifecycle.' },
    { name: 'WebSocket.CloseAsync()',               type: 'method',   desc: 'Sends a close frame and waits for the peer\'s close frame.' },
    { name: 'WebSocketMessageType.Text',            type: 'keyword',  desc: 'UTF-8 text frame — use for JSON or string messages.' },
    { name: 'WebSocketOptions.KeepAliveInterval',   type: 'keyword',  desc: 'Ping interval to detect dead connections. Default 2 minutes.' },
  ];

  theory: TheoryPoint[] = [
    {
      heading: 'WebSockets vs HTTP',
      points: ['HTTP is request-response: the client initiates, the server replies, the connection closes. WebSockets start as an HTTP upgrade request and then become a persistent, full-duplex TCP channel. Either party can send frames at any time without the other initiating. Use WebSockets for real-time bidirectional communication: live chat, multiplayer games, collaborative editing, live dashboards.'],
    },
    {
      heading: 'The Upgrade Handshake',
      points: ['The client sends an HTTP GET with Upgrade: websocket and a Sec-WebSocket-Key header. The server responds with 101 Switching Protocols. After that, the connection becomes a WebSocket stream — HTTP framing is replaced by WebSocket frames. In ASP.NET Core, AcceptWebSocketAsync() performs this handshake and returns a WebSocket instance.'],
    },
    {
      heading: 'Receive Loop Pattern',
      points: ['After accepting, enter a loop calling ReceiveAsync() into a buffer. When MessageType is Close, call CloseAsync() and exit. When MessageType is Text or Binary, process the buffer and optionally send a reply with SendAsync(). The loop blocks asynchronously — it does not spin-wait.'],
    },
    {
      heading: 'WebSockets vs SignalR',
      points: ['SignalR is built on top of WebSockets (with Long Polling and Server-Sent Events as fallbacks) and adds a Hub abstraction, automatic reconnection, typed client/server RPC, group management, and scale-out via Redis or Azure. Use raw WebSockets when you need maximum control or minimal overhead. Use SignalR when you need the higher-level features.'],
    },
    {
      heading: 'Connection Management',
      points: ['Each open WebSocket connection holds a server thread or async state machine for the receive loop. Manage connections explicitly — track connected sockets in a ConcurrentDictionary, clean up on close or abort, and respect cancellation tokens. For many concurrent connections, use SignalR\'s scale-out or a message bus to broadcast across server instances.'],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Basic Echo',
      language: 'csharp',
      code: `// Program.cs
app.UseWebSockets(new WebSocketOptions
{
    KeepAliveInterval = TimeSpan.FromMinutes(2)
});

app.Map("/ws/echo", async (HttpContext ctx) =>
{
    if (!ctx.WebSockets.IsWebSocketRequest)
    {
        ctx.Response.StatusCode = 400;
        return;
    }

    var ws = await ctx.WebSockets.AcceptWebSocketAsync();
    var buffer = new byte[4096];

    while (ws.State == WebSocketState.Open)
    {
        var result = await ws.ReceiveAsync(buffer, ctx.RequestAborted);

        if (result.MessageType == WebSocketMessageType.Close)
        {
            await ws.CloseAsync(WebSocketCloseStatus.NormalClosure, "Bye", default);
            break;
        }

        // Echo back
        await ws.SendAsync(
            new ArraySegment<byte>(buffer, 0, result.Count),
            result.MessageType,
            result.EndOfMessage,
            ctx.RequestAborted);
    }
});`,
    },
    {
      label: 'JSON Messaging',
      language: 'csharp',
      code: `app.Map("/ws/chat", async (HttpContext ctx) =>
{
    if (!ctx.WebSockets.IsWebSocketRequest) { ctx.Response.StatusCode = 400; return; }

    var ws = await ctx.WebSockets.AcceptWebSocketAsync();
    var buffer = new byte[8192];

    while (ws.State == WebSocketState.Open)
    {
        var result = await ws.ReceiveAsync(buffer, ctx.RequestAborted);
        if (result.MessageType == WebSocketMessageType.Close) break;

        var json  = Encoding.UTF8.GetString(buffer, 0, result.Count);
        var msg   = JsonSerializer.Deserialize<ChatMessage>(json)!;

        var reply = JsonSerializer.Serialize(new ChatMessage
        {
            User = "Server",
            Text = \`Echo: \${msg.Text}\`,
            At   = DateTime.UtcNow
        });

        var bytes = Encoding.UTF8.GetBytes(reply);
        await ws.SendAsync(bytes, WebSocketMessageType.Text, true, ctx.RequestAborted);
    }
    await ws.CloseAsync(WebSocketCloseStatus.NormalClosure, "", default);
});

public record ChatMessage(string User, string Text, DateTime At);`,
    },
    {
      label: 'Connection Manager',
      language: 'csharp',
      code: `// Track all connected sockets
public class WebSocketHub
{
    private readonly ConcurrentDictionary<string, WebSocket> _sockets = new();

    public string Add(WebSocket socket)
    {
        var id = Guid.NewGuid().ToString();
        _sockets[id] = socket;
        return id;
    }

    public void Remove(string id) => _sockets.TryRemove(id, out _);

    public async Task BroadcastAsync(string message, CancellationToken ct = default)
    {
        var bytes = Encoding.UTF8.GetBytes(message);
        foreach (var (_, ws) in _sockets)
        {
            if (ws.State == WebSocketState.Open)
                await ws.SendAsync(bytes, WebSocketMessageType.Text, true, ct);
        }
    }
}

// Register as singleton
builder.Services.AddSingleton<WebSocketHub>();`,
    },
    {
      label: 'Broadcast Endpoint',
      language: 'csharp',
      code: `app.Map("/ws/live", async (HttpContext ctx, WebSocketHub hub) =>
{
    if (!ctx.WebSockets.IsWebSocketRequest) { ctx.Response.StatusCode = 400; return; }

    var ws = await ctx.WebSockets.AcceptWebSocketAsync();
    var id = hub.Add(ws);

    try
    {
        var buf = new byte[1024];
        while (ws.State == WebSocketState.Open)
        {
            var r = await ws.ReceiveAsync(buf, ctx.RequestAborted);
            if (r.MessageType == WebSocketMessageType.Close) break;

            var text = Encoding.UTF8.GetString(buf, 0, r.Count);
            await hub.BroadcastAsync(\`[\${id[..6]}]: \${text}\`, ctx.RequestAborted);
        }
    }
    finally
    {
        hub.Remove(id);
        if (ws.State != WebSocketState.Closed)
            await ws.CloseAsync(WebSocketCloseStatus.NormalClosure, "", default);
    }
});`,
    },
    {
      label: 'Client (JavaScript)',
      language: 'csharp',
      code: `// JavaScript client — run in browser DevTools to test
const ws = new WebSocket("wss://localhost:5001/ws/echo");

ws.onopen    = ()  => { console.log("Connected"); ws.send("Hello!"); };
ws.onmessage = (e) => console.log("Received:", e.data);
ws.onerror   = (e) => console.error("Error", e);
ws.onclose   = ()  => console.log("Disconnected");

// Send a JSON message
ws.send(JSON.stringify({ user: "Alice", text: "Hi there!", at: new Date() }));

// Close gracefully
ws.close(1000, "Done");`,
    },
  ];

  mistakes: CommonMistake[] = [
    {
      title: 'Not checking IsWebSocketRequest',
      wrong: `app.Map("/ws", async (HttpContext ctx) =>
{
    var ws = await ctx.WebSockets.AcceptWebSocketAsync(); // throws for normal HTTP`,
      right: `app.Map("/ws", async (HttpContext ctx) =>
{
    if (!ctx.WebSockets.IsWebSocketRequest) { ctx.Response.StatusCode = 400; return; }
    var ws = await ctx.WebSockets.AcceptWebSocketAsync();`,
      explanation: 'AcceptWebSocketAsync throws if the request is not a WebSocket upgrade. Always check IsWebSocketRequest first and return 400 for non-WebSocket requests.',
    },
    {
      title: 'Not handling the Close message type',
      wrong: `while (ws.State == WebSocketState.Open)
{
    var r = await ws.ReceiveAsync(buf, ct);
    // Forgot: if (r.MessageType == WebSocketMessageType.Close) break;
    Process(buf, r.Count);
}`,
      right: `while (ws.State == WebSocketState.Open)
{
    var r = await ws.ReceiveAsync(buf, ct);
    if (r.MessageType == WebSocketMessageType.Close)
    {
        await ws.CloseAsync(WebSocketCloseStatus.NormalClosure, "", ct);
        break;
    }
    Process(buf, r.Count);
}`,
      explanation: 'When the client sends a close frame, MessageType becomes Close. You must respond with CloseAsync() to complete the closing handshake.',
    },
    {
      title: 'Reusing the receive buffer across concurrent sends',
      wrong: `// Using the same buffer for receive and send simultaneously
await ws.SendAsync(buffer, ...); // while ReceiveAsync is using buffer`,
      right: `var receiveBuffer = new byte[4096];
// Only read into receiveBuffer; copy to a separate sendBuffer before sending`,
      explanation: 'WebSocket.SendAsync and ReceiveAsync must not overlap on the same socket. Use separate buffers and ensure you do not call them concurrently on the same WebSocket instance.',
    },
    {
      title: 'Forgetting UseWebSockets() or placing it after MapXxx calls',
      wrong: `app.MapGet("/", () => "hello");
app.UseWebSockets(); // too late — routing already resolved`,
      right: `app.UseWebSockets();
app.MapGet("/", () => "hello");`,
      explanation: 'UseWebSockets() must come before any endpoint mapping. It upgrades the connection during the middleware phase before routing takes over.',
    },
  ];

  challenge: Challenge = {
    title: 'Ping-Pong WebSocket',
    language: 'csharp',
    description: `Implement a WebSocket endpoint at /ws/ping that:
1. Accepts a WebSocket connection.
2. Receives any text message.
3. If the message is "ping", responds with "pong".
4. If the message is "close", closes the connection gracefully.
5. Handles the Close message type from the client.`,
    hints: [
      'Use Encoding.UTF8.GetString(buffer, 0, result.Count) to decode received text',
      'Send with Encoding.UTF8.GetBytes("pong")',
      'Handle MessageType.Close with CloseAsync()',
    ],
    starterCode: `app.UseWebSockets();
app.Map("/ws/ping", async (HttpContext ctx) =>
{
    if (!ctx.WebSockets.IsWebSocketRequest) { ctx.Response.StatusCode = 400; return; }
    var ws = await ctx.WebSockets.AcceptWebSocketAsync();
    // TODO: receive loop
});`,
    solution: `app.UseWebSockets();
app.Map("/ws/ping", async (HttpContext ctx) =>
{
    if (!ctx.WebSockets.IsWebSocketRequest) { ctx.Response.StatusCode = 400; return; }
    var ws  = await ctx.WebSockets.AcceptWebSocketAsync();
    var buf = new byte[1024];

    while (ws.State == WebSocketState.Open)
    {
        var result = await ws.ReceiveAsync(buf, ctx.RequestAborted);

        if (result.MessageType == WebSocketMessageType.Close)
        {
            await ws.CloseAsync(WebSocketCloseStatus.NormalClosure, "Bye", default);
            break;
        }

        var text = Encoding.UTF8.GetString(buf, 0, result.Count);
        if (text == "close")
        {
            await ws.CloseAsync(WebSocketCloseStatus.NormalClosure, "Closed on request", default);
            break;
        }

        var reply = text == "ping" ? "pong" : \`Unknown: \${text}\`;
        var bytes = Encoding.UTF8.GetBytes(reply);
        await ws.SendAsync(bytes, WebSocketMessageType.Text, true, ctx.RequestAborted);
    }
});`,
  };

  quiz: QuizQuestion[] = [
    {
      q: 'What HTTP status code is returned when a WebSocket upgrade succeeds?',
      options: ['200 OK', '201 Created', '101 Switching Protocols', '204 No Content'],
      answer: 2,
      explanation: '101 Switching Protocols is the handshake response that upgrades the HTTP connection to a WebSocket stream.',
    },
    {
      q: 'What should you do when ReceiveAsync returns MessageType == Close?',
      options: [
        'Ignore it and continue the loop',
        'Call CloseAsync() and break the receive loop',
        'Dispose the socket immediately',
        'Send an error frame',
      ],
      answer: 1,
      explanation: 'A Close message starts the closing handshake. Respond with CloseAsync() to send a close frame back and break the loop — this completes the handshake gracefully.',
    },
    {
      q: 'How does WebSockets differ from HTTP in communication direction?',
      options: [
        'WebSockets are half-duplex; HTTP is full-duplex',
        'Both are full-duplex',
        'WebSockets are full-duplex; HTTP is request-response (half-duplex)',
        'WebSockets can only send from server to client',
      ],
      answer: 2,
      explanation: 'WebSockets are full-duplex — either party can send frames at any time. HTTP is request-response: client sends, server replies, connection may close.',
    },
    {
      q: 'When should you prefer SignalR over raw WebSockets?',
      options: [
        'When you need the lowest possible latency',
        'When you need typed RPC, automatic reconnection, group management, or scale-out',
        'When clients do not support WebSockets',
        'When using binary protocols',
      ],
      answer: 1,
      explanation: 'SignalR adds Hub abstraction, typed RPC, automatic reconnection, group management, and Redis/Azure scale-out. Use raw WebSockets only when you need maximum control without these features.',
    },
    {
      q: 'Can you call SendAsync and ReceiveAsync concurrently on the same WebSocket?',
      options: [
        'Yes — WebSocket is thread-safe',
        'Yes — but only for different message types',
        'No — you must not overlap send and receive operations on the same instance',
        'Only in .NET 8+',
      ],
      answer: 2,
      explanation: 'WebSocket.SendAsync and ReceiveAsync must not be called concurrently on the same socket. Use separate tasks carefully and do not overlap sends — or use a channel to serialize sends.',
    },
  ];

  qna: QnaItem[] = [
    {
      q: 'How do I broadcast messages to all connected WebSocket clients?',
      a: 'Track connected sockets in a ConcurrentDictionary<string, WebSocket> registered as a singleton service. To broadcast, iterate the dictionary and call SendAsync() on each open socket. For production scale-out across multiple server instances, use Redis Pub/Sub or a message bus to coordinate broadcasts.',
    },
    {
      q: 'How do I authenticate WebSocket connections?',
      a: 'WebSocket upgrade requests are standard HTTP requests — include a cookie or query string token (e.g., ?access_token=...) since browsers cannot add custom headers to the upgrade. On the server, validate the token before calling AcceptWebSocketAsync().',
    },
    {
      q: 'What is the difference between WebSockets and Server-Sent Events (SSE)?',
      a: 'SSE is one-way (server to client) over a standard HTTP connection — simpler to implement and proxy-friendly. WebSockets are full-duplex over a persistent TCP connection. Use SSE for push notifications and live feeds; use WebSockets for bidirectional real-time communication.',
    },
    {
      q: 'How do I handle large messages that span multiple frames?',
      a: 'ReceiveAsync sets EndOfMessage = false when a message spans multiple frames. Keep calling ReceiveAsync and appending to a MemoryStream until EndOfMessage is true, then process the complete message.',
    },
  ];

  revision: RevisionSummary = {
    oneLiner: 'WebSockets provide full-duplex persistent connections — upgrade with AcceptWebSocketAsync, loop on ReceiveAsync, and handle the Close frame to end gracefully.',
    mustKnow: [
      'UseWebSockets() before endpoint mapping; check IsWebSocketRequest before AcceptWebSocketAsync()',
      'Receive loop: ReceiveAsync → check MessageType (Text/Binary/Close) → process or CloseAsync()',
      'CloseAsync() responds to a Close frame — required to complete the closing handshake',
      'Track connections in ConcurrentDictionary for broadcast; clean up on close/abort',
      'Do not call SendAsync and ReceiveAsync concurrently on the same socket',
      'Choose SignalR over raw WebSockets when you need groups, reconnection, or scale-out',
    ],
    interviewFocus: [
      'HTTP upgrade handshake — what happens during 101 Switching Protocols',
      'WebSockets vs SignalR — raw control vs higher-level features',
      'WebSockets vs Server-Sent Events — bidirectional vs server-push only',
      'How to authenticate WebSocket connections (cookies or query string tokens)',
    ],
  };
}
