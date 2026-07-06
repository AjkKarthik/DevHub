import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-websocket-multiframe-truncation-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
    TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './receive-loop-examples-silently-truncate-multi-frame-messages.html',
  styleUrl: './receive-loop-examples-silently-truncate-multi-frame-messages.scss',
})
export class ReceiveLoopExamplesSilentlyTruncateMultiFrameMessagesSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'Every Receive-Loop Example on This Page Assumes One Frame Is One Whole Message',
      points: [
        'The main page\'s own Q&A states "ReceiveAsync sets EndOfMessage = false when a message spans multiple frames... keep calling ReceiveAsync and appending to a MemoryStream until EndOfMessage is true" — but NONE of the receive-loop code tabs on this page (Basic Echo, JSON Messaging, the Broadcast endpoint) actually do this. Every one of them calls ws.ReceiveAsync(buffer, ct) exactly ONCE per logical message and immediately processes buffer[0..result.Count] as if it were guaranteed to be the complete message.',
        'This isn\'t a hypothetical edge case reserved for unusually large payloads — whether a message gets fragmented across multiple frames is a decision the SENDING client\'s own WebSocket implementation makes, not something the server controls or can predict. A sufficiently large JSON payload, or simply a different browser or library with a smaller default frame size, can fragment a message the main page\'s own JSON Messaging example would then silently truncate — JsonSerializer.Deserialize&lt;ChatMessage&gt; would throw on invalid or incomplete JSON, or worse, silently succeed on a truncated-but-still-valid-looking fragment.',
      ],
    },
    {
      heading: 'The Fix — Accumulate Until EndOfMessage, Every Time',
      points: [
        'The correct pattern wraps EVERY ReceiveAsync-based message read in an inner loop that keeps receiving and appending to a buffer (or MemoryStream) until result.EndOfMessage is true, THEN processes the complete accumulated data — never processing after just one ReceiveAsync call. This inner accumulation loop is what the main page\'s own Q&A describes in prose but omits from every actual code example, including the Broadcast endpoint whose entire purpose is to relay data reliably to multiple clients.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'The main page\'s own truncation-prone pattern',
      language: 'csharp',
      code: `// The main page's own "JSON Messaging" pattern, reproduced:
var result = await ws.ReceiveAsync(buffer, ctx.RequestAborted);
if (result.MessageType == WebSocketMessageType.Close) break;

// BUG: assumes this ONE ReceiveAsync call captured the WHOLE message.
// If the client's WebSocket implementation fragmented this message
// across multiple frames, buffer[0..result.Count] is only the FIRST
// FRAGMENT — result.EndOfMessage is never even checked.
var json = Encoding.UTF8.GetString(buffer, 0, result.Count);
var msg  = JsonSerializer.Deserialize<ChatMessage>(json)!;   // may throw, or silently
                                                              // deserialize a truncated fragment`,
    },
    {
      label: 'The fix — accumulate until EndOfMessage',
      language: 'csharp',
      code: `async Task<string?> ReceiveFullMessageAsync(WebSocket ws, CancellationToken ct)
{
    using var stream = new MemoryStream();
    var buffer = new byte[4096];

    while (true)
    {
        var result = await ws.ReceiveAsync(buffer, ct);
        if (result.MessageType == WebSocketMessageType.Close) return null;

        stream.Write(buffer, 0, result.Count);

        if (result.EndOfMessage) break;   // only NOW is the message complete
    }

    return Encoding.UTF8.GetString(stream.ToArray());
}

// Usage — replaces the single ReceiveAsync call in every receive loop:
var json = await ReceiveFullMessageAsync(ws, ctx.RequestAborted);
if (json is null) { /* handle close */ break; }
var msg = JsonSerializer.Deserialize<ChatMessage>(json)!;`,
    },
    {
      label: 'Test proving the original pattern truncates a fragmented message',
      language: 'csharp',
      code: `[Fact]
public async Task Single_ReceiveAsync_Call_Truncates_A_Message_Sent_As_Multiple_Frames()
{
    var server = _factory.Server;
    using var client = server.CreateWebSocketClient();
    var wsUri = new UriBuilder(new Uri(server.BaseAddress, "/ws/chat")) { Scheme = "ws" }.Uri;
    using var socket = await client.ConnectAsync(wsUri, CancellationToken.None);

    var fullJson = JsonSerializer.Serialize(
        new ChatMessage("Alice", "A longer message body", DateTime.UtcNow));
    var bytes = Encoding.UTF8.GetBytes(fullJson);
    var half = bytes.Length / 2;

    // Deliberately send as TWO frames — endOfMessage: false, then true —
    // simulating what some client WebSocket implementations do naturally
    // for large payloads.
    await socket.SendAsync(bytes[..half], WebSocketMessageType.Text, endOfMessage: false, CancellationToken.None);
    await socket.SendAsync(bytes[half..], WebSocketMessageType.Text, endOfMessage: true, CancellationToken.None);

    var buffer = new byte[1024];
    var result = await socket.ReceiveAsync(buffer, CancellationToken.None);
    var reply  = Encoding.UTF8.GetString(buffer, 0, result.Count);

    // The server's single-ReceiveAsync pattern only processed the FIRST
    // frame — the reply reflects a truncated, corrupted echo of "Alice".
    Assert.DoesNotContain("A longer message body", reply);
}`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A teammate argues this is a non-issue in practice, since most browser WebSocket clients (like the main page\'s own JavaScript client example) send small JSON messages as a single frame by default. Under what circumstances would the main page\'s own examples actually hit this bug in production, despite that being generally true?',
    hint: 'Fragmentation is a decision made by the SENDING client\'s own implementation, not something the server controls. Think about what kinds of senders, message sizes, or intermediaries might behave differently from a typical browser\'s default.',
    solution: `Even though a typical browser's WebSocket implementation often sends
small text messages as a single frame, this is an IMPLEMENTATION DETAIL
of the sender, not a guarantee of the WebSocket protocol itself — RFC
6455 explicitly allows any sender to fragment any message across
multiple frames for any reason. Several realistic scenarios break the
"it's fine in practice" assumption:

- A non-browser client library (a mobile app's native WebSocket
  implementation, a server-to-server integration, a load-testing tool)
  may have different, smaller default frame-size limits than a browser.
- A sufficiently large JSON payload — a chat message with a long
  attachment reference, a bulk update, a large object graph — can
  exceed ANY implementation's single-frame threshold, browser or not.
- A proxy or intermediary between client and server (a corporate proxy,
  a load balancer doing WebSocket passthrough) can itself re-fragment
  frames in transit for its own buffering reasons, independent of what
  the original client sent.

Because fragmentation is entirely the SENDER's (or an intermediary's)
choice, and the server has no way to enforce "always send as one
frame," code that assumes single-frame delivery is a latent bug waiting
for whichever future client, message size, or network path happens to
trigger it — not a theoretical concern that can be safely ignored.`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'if a message fits in the buffer size given to ReceiveAsync (e.g. 8192 bytes), it will always arrive in a single frame, so checking EndOfMessage is only necessary for messages larger than the buffer.',
      reality: 'fragmentation is a decision made entirely by the SENDING client\'s WebSocket implementation, independent of buffer size on the receiving end — a tiny message can still arrive across multiple frames if the sender\'s implementation (or an intermediary proxy) chooses to fragment it.',
    },
    {
      thought: 'the main page\'s own JSON Messaging and Broadcast examples are safe in practice because typical browser clients send small JSON payloads as a single frame.',
      reality: 'non-browser clients, larger payloads, and intermediary proxies can all fragment messages that a typical browser wouldn\'t — code that never checks EndOfMessage is a latent bug, not a theoretical one, for any sender the server doesn\'t fully control.',
    },
    {
      thought: 'a call to ws.ReceiveAsync() that doesn\'t throw and returns a MessageType of Text or Binary always contains the COMPLETE message in the buffer.',
      reality: 'ReceiveAsync() returns as soon as ONE FRAME arrives — result.EndOfMessage indicates whether that frame was the last one for this message. A non-throwing, successful call only guarantees a valid frame was received, not a complete message.',
    },
  ];
}
