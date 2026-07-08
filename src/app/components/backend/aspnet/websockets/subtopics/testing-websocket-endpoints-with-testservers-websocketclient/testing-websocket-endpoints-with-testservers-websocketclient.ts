import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-testing-websockets-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
    TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './testing-websocket-endpoints-with-testservers-websocketclient.html',
  styleUrl: './testing-websocket-endpoints-with-testservers-websocketclient.scss',
})
export class TestingWebsocketEndpointsWithTestserversWebsocketclientSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'None of the Main Page\'s Own WebSocket Endpoints Are Ever Shown Under Test',
      points: [
        'The Basic Echo, JSON Messaging, and Broadcast endpoints are never tested anywhere on the main page, and WebApplicationFactory\'s usual HttpClient can\'t open a WebSocket connection at all — it only speaks plain HTTP request/response. The actual technique is TestServer\'s own WebSocketClient: WebApplicationFactory&lt;Program&gt;\'s underlying TestServer exposes CreateWebSocketClient(), which connects a REAL System.Net.WebSockets.WebSocket instance directly to the in-memory test server — no real network socket, no real port, but genuine WebSocket framing, upgrade handshake, and message exchange.',
        'This is meaningfully different from testing an ordinary HTTP endpoint: the test doesn\'t assert on an HttpResponseMessage at all — it opens an actual client-side WebSocket, sends real frames with SendAsync(), and asserts on what ReceiveAsync() returns, exercising the SAME send/receive contract a real browser client would use.',
      ],
    },
    {
      heading: 'Testing the Close Handshake, Not Just a Successful Echo',
      points: [
        'A thorough WebSocket test suite covers more than "does the echo endpoint echo" — it should also prove the CLOSE HANDSHAKE completes correctly (the main page\'s own "Not handling the Close message type" mistake), since forgetting to call CloseAsync() on a Close message is a common, easy-to-miss bug that a simple echo test would never catch. Sending a close frame from the test client and asserting the SERVER responds with its own close frame — not just that the connection eventually times out — directly verifies that behavior.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Testing the echo endpoint with a real in-memory WebSocket',
      language: 'csharp',
      code: `public class EchoWebSocketTests : IClassFixture<WebApplicationFactory<Program>>
{
    private readonly WebApplicationFactory<Program> _factory;
    public EchoWebSocketTests(WebApplicationFactory<Program> factory) => _factory = factory;

    [Fact]
    public async Task Echo_Endpoint_Sends_Back_The_Same_Message()
    {
        var server = _factory.Server;
        using var client = server.CreateWebSocketClient();

        // "ws" scheme is required by CreateWebSocketClient even though
        // the connection never touches a real socket.
        var wsUri = new UriBuilder(new Uri(server.BaseAddress, "/ws/echo")) { Scheme = "ws" }.Uri;
        using var socket = await client.ConnectAsync(wsUri, CancellationToken.None);

        var sendBytes = Encoding.UTF8.GetBytes("Hello!");
        await socket.SendAsync(sendBytes, WebSocketMessageType.Text, true, CancellationToken.None);

        var buffer = new byte[1024];
        var result = await socket.ReceiveAsync(buffer, CancellationToken.None);

        var received = Encoding.UTF8.GetString(buffer, 0, result.Count);
        Assert.Equal("Hello!", received);
    }
}`,
    },
    {
      label: 'Testing the closing handshake, not just message echo',
      language: 'csharp',
      code: `[Fact]
public async Task Echo_Endpoint_Completes_The_Closing_Handshake()
{
    var server = _factory.Server;
    using var client = server.CreateWebSocketClient();
    var wsUri = new UriBuilder(new Uri(server.BaseAddress, "/ws/echo")) { Scheme = "ws" }.Uri;

    using var socket = await client.ConnectAsync(wsUri, CancellationToken.None);

    await socket.CloseAsync(WebSocketCloseStatus.NormalClosure, "done", CancellationToken.None);

    // Proves the SERVER actually responded with its own close frame —
    // not just that the client-side call completed.
    Assert.Equal(WebSocketState.Closed, socket.State);
    Assert.Equal(WebSocketCloseStatus.NormalClosure, socket.CloseStatus);
}`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A teammate removes the server\'s <code>await ws.CloseAsync(...)</code> call inside the Close-message branch (reproducing the main page\'s own "Not handling the Close message type" Common Mistake), but leaves the <code>if (result.MessageType == WebSocketMessageType.Close) break;</code> in place. Using the second test above, what specifically fails, and what would NOT fail that you might expect to?',
    hint: 'Distinguish what happens to the LOOP (does it still exit?) from what happens to the HANDSHAKE (does the client\'s own CloseAsync() call ever get a matching response?).',
    solution: `Assert.Equal(WebSocketCloseStatus.NormalClosure, socket.CloseStatus)
would fail (or the test would hang / time out waiting for a close frame
that never arrives) — because without the server calling
ws.CloseAsync(), no close frame is ever sent back to the client, so the
client's own CloseAsync() call has nothing to complete the handshake
with. Depending on the client WebSocket implementation's exact timeout
behavior, this manifests either as an exception, a hang, or a
CloseStatus that stays null/empty rather than NormalClosure.

What would NOT fail: the SERVER's own receive loop still exits fine —
the "if MessageType == Close, break" check still runs and exits the
while loop, since that part of the mistake wasn't removed. This is
exactly why an echo-only test (the first tab) wouldn't catch this bug
at all — the server-side loop behaves identically whether or not
CloseAsync() is called, right up until the point where the CLIENT is
left waiting for a close frame reply that will never come. Only a test
that explicitly exercises and asserts on the CLOSE HANDSHAKE itself —
not just message echo — catches this.`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'WebSocket endpoints can be tested the same way as ordinary HTTP endpoints, using WebApplicationFactory\'s regular HttpClient.',
      reality: 'HttpClient only speaks plain HTTP request/response and cannot perform a WebSocket upgrade at all — testing requires TestServer\'s own CreateWebSocketClient(), which connects a real WebSocket instance directly to the in-memory server.',
    },
    {
      thought: 'a test that successfully sends a message and receives an echo back proves the WebSocket endpoint is fully correct.',
      reality: 'an echo test alone doesn\'t prove the CLOSE HANDSHAKE works — the main page\'s own "Not handling the Close message type" mistake wouldn\'t be caught by an echo-only test at all, since the server-side receive loop behaves identically whether or not CloseAsync() is actually called, until a client tries to close and waits for a reply.',
    },
    {
      thought: 'TestServer\'s WebSocket testing support requires spinning up a real network port, the same way testing a real client-server WebSocket connection would.',
      reality: 'CreateWebSocketClient() connects directly to the in-memory TestServer with no real socket or port involved — the same in-process testing model WebApplicationFactory already uses for ordinary HTTP endpoints.',
    },
  ];
}
