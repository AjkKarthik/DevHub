import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-websocket-close-handshake-mechanics-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
    TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './close-handshake-mechanics-what-actually-ends-the-receive-loop.html',
  styleUrl: './close-handshake-mechanics-what-actually-ends-the-receive-loop.scss',
})
export class CloseHandshakeMechanicsWhatActuallyEndsTheReceiveLoopSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'ws.State Already Reflects the Close Before Your Code Checks It',
      points: [
        'The main page\'s own receive-loop pattern wraps everything in while (ws.State == WebSocketState.Open), then checks result.MessageType == WebSocketMessageType.Close INSIDE the loop body to decide whether to call CloseAsync() and break. What isn\'t obvious: by the time ReceiveAsync() returns with a Close message, the underlying WebSocket has ALREADY transitioned its own .State property to CloseReceived — the OUTER while-condition would notice this and exit the loop on its own, on the VERY NEXT top-of-loop check, even without the manual inner break at all.',
        'This means the manual break\'s real job isn\'t primarily to END THE LOOP — the outer while-condition would eventually do that regardless. Its real job is to trigger the ws.CloseAsync() call, which is what actually SENDS the closing handshake response back to the client. Skip the manual check, and the loop still exits (one harmless extra iteration later) — but the peer never receives a close frame back, leaving the WebSocket closing handshake permanently incomplete from the server\'s side.',
      ],
    },
    {
      heading: 'Why an Incomplete Handshake Is a Real Problem, Not Just a Protocol Technicality',
      points: [
        'A client that sent a close frame and is waiting for the server\'s matching close frame (per RFC 6455\'s closing handshake) will typically hang or eventually time out rather than considering the connection cleanly closed — this is exactly what the Testing subtopic\'s close-handshake test demonstrates failing. On the server side, the underlying WebSocket resources may also not be released as promptly as a properly completed handshake would release them, since the framework has no explicit signal that the SERVER has finished its half of the close sequence.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Illustrating the mechanic — not recommended production code',
      language: 'csharp',
      code: `while (ws.State == WebSocketState.Open)
{
    var result = await ws.ReceiveAsync(buffer, ct);

    // By the time THIS check runs, ws.State is ALREADY CloseReceived —
    // set by the framework as part of processing the incoming close frame,
    // before ReceiveAsync()'s Task even completes.
    Console.WriteLine($"State immediately after ReceiveAsync: {ws.State}");

    if (result.MessageType == WebSocketMessageType.Close)
    {
        // This call is what actually sends the closing handshake reply —
        // not what ends the loop. The loop would end on its own next
        // iteration's while-check regardless, since ws.State is no
        // longer Open.
        await ws.CloseAsync(WebSocketCloseStatus.NormalClosure, "Bye", default);
        break;
    }

    Process(buffer, result.Count);
}`,
    },
    {
      label: 'Test — the state transition happens before CloseAsync() is called',
      language: 'csharp',
      code: `[Fact]
public async Task Server_State_Is_Already_CloseReceived_When_The_Manual_Check_Runs()
{
    WebSocketState? observedState = null;

    // Test-only endpoint capturing ws.State at the moment
    // MessageType == Close is observed, BEFORE calling CloseAsync().
    app.Map("/ws/observe-state", async (HttpContext ctx) =>
    {
        var ws = await ctx.WebSockets.AcceptWebSocketAsync();
        var buffer = new byte[1024];
        var result = await ws.ReceiveAsync(buffer, ctx.RequestAborted);

        if (result.MessageType == WebSocketMessageType.Close)
        {
            observedState = ws.State;
            await ws.CloseAsync(WebSocketCloseStatus.NormalClosure, "", default);
        }
    });

    var server = _factory.Server;
    using var client = server.CreateWebSocketClient();
    var wsUri = new UriBuilder(new Uri(server.BaseAddress, "/ws/observe-state")) { Scheme = "ws" }.Uri;
    using var socket = await client.ConnectAsync(wsUri, CancellationToken.None);

    await socket.CloseAsync(WebSocketCloseStatus.NormalClosure, "bye", CancellationToken.None);
    await Task.Delay(100);   // allow the server handler to run

    Assert.Equal(WebSocketState.CloseReceived, observedState);
    // Proves the transition already happened BEFORE the manual
    // CloseAsync() call — it wasn't CloseAsync() that caused it.
}`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A developer "simplifies" the receive loop by removing the inner <code>if (MessageType == Close)</code> block entirely, reasoning that the outer <code>while (ws.State == WebSocketState.Open)</code> condition will handle exiting the loop on its own once the state changes. Is the loop-exit assumption correct, and what real problem does this simplification still cause?',
    hint: 'Separate the TWO things the removed code was doing: (1) deciding when to stop looping, and (2) sending something back to the peer.',
    solution: `The loop-exit assumption IS correct — the outer while condition will
indeed notice ws.State is no longer Open on its next check and exit,
exactly as the mechanics above describe. Removing the inner check
doesn't cause an infinite loop or a hang on the SERVER's own loop.

But the simplification still breaks the CLOSING HANDSHAKE, because
CloseAsync() is what actually SENDS the close frame back to the peer —
without it, the client that initiated the close is left waiting for a
reply that will never come, exactly as demonstrated by the Testing
subtopic's Echo_Endpoint_Completes_The_Closing_Handshake test failing
when this exact simplification is made. The loop correctly stops
iterating, but the PROTOCOL-LEVEL handshake with the peer is left
permanently unfinished — two genuinely different outcomes that are easy
to conflate if you only think about "does the server-side code stop
running."`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'the manual if (result.MessageType == WebSocketMessageType.Close) check inside the receive loop is what causes the loop to exit when a close frame arrives.',
      reality: 'the outer while (ws.State == WebSocketState.Open) condition would notice the state change and exit the loop on its own, one iteration later, even without the manual check — the manual check\'s real purpose is triggering the CloseAsync() call that sends the handshake reply.',
    },
    {
      thought: 'removing the Close-message check from the receive loop, while keeping the outer while(State==Open) condition, causes the server\'s loop to hang or spin forever.',
      reality: 'the loop still exits correctly, since ws.State has already transitioned away from Open — what breaks is the closing handshake itself, since nothing calls CloseAsync() to notify the peer.',
    },
    {
      thought: 'ws.State only changes to CloseReceived after your code explicitly calls CloseAsync() in response to a Close message.',
      reality: 'the framework transitions ws.State to CloseReceived as part of processing the INCOMING close frame — this happens before your code even gets to check result.MessageType, and before CloseAsync() is ever called.',
    },
  ];
}
