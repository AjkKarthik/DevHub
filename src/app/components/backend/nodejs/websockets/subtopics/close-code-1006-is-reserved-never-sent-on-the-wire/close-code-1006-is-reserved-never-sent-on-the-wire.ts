import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  standalone: true,
  imports: [PageMetaComponent, TheoryBlockComponent, CodeBlockComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent, SubtopicEyebrowComponent],
  templateUrl: './close-code-1006-is-reserved-never-sent-on-the-wire.html',
  styleUrl: './close-code-1006-is-reserved-never-sent-on-the-wire.scss'
})
export class CloseCode1006IsReservedNeverSentOnTheWireSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page\'s ws.on(\'close\', ...) handler and disconnect logic never discuss the close CODE itself — a detail worth being precise about, since one specific code behaves unlike any other',
      points: [
        'RFC 6455 §7.4.1 defines a table of WebSocket close status codes — 1000 (normal closure), 1001 (endpoint going away, e.g. server shutting down or browser tab closing), 1008 (policy violation, often used for auth failures), and others. These are sent inside an actual Close control frame during a proper closing handshake.',
        'Code 1006 is different from every other code in this table: the RFC explicitly states it "is a reserved value and MUST NOT be set as a status code in a Close control frame by an endpoint." It is not merely rare — it is structurally impossible for any spec-compliant endpoint to actually transmit 1006 on the wire.',
        'Instead, 1006 exists purely as a CLIENT-API sentinel value. When a WebSocket connection is lost WITHOUT a proper closing handshake ever completing — the TCP connection just drops, a network failure occurs, or a proxy silently kills the connection — there is no close frame at all, and therefore no code was ever actually sent. The WebSocket API implementation (a browser, or a Node.js ws client) reports this specific "no proper close happened" scenario to application code by setting CloseEvent.code to 1006, precisely because there is no real code to report.',
      ]
    },
    {
      heading: 'Why this distinction matters for reconnection and monitoring logic',
      points: [
        'Seeing code 1006 in a ws.on(\'close\', (code, reason) => ...) handler or a browser WebSocket\'s onclose event is a strong signal that the disconnect was abnormal and unplanned — network failure, crashed process, killed connection — as opposed to codes like 1000 or 1001, which indicate an orderly, intentional close either side can distinguish and log differently.',
        'A reconnection strategy can reasonably treat 1006 more aggressively (retry immediately with backoff) than an explicit 1008 (policy violation / auth failure) — retrying immediately after an auth rejection without fixing the credential is pointless, while retrying after an abnormal network drop is exactly the right response.',
        'This is the SAME category of underlying signal the main page\'s heartbeat mechanism exists to catch proactively (a connection that TCP itself hasn\'t noticed died yet) — 1006 is what the close-event side of that same "the connection just silently vanished" scenario looks like, reported after the fact rather than detected proactively via heartbeat timeout.',
      ]
    }
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Distinguishing 1006 from an intentional close',
      language: 'typescript',
      code: `// Browser client
const socket = new WebSocket('wss://api.example.com/ws');

socket.onclose = (event) => {
  console.log('Closed:', event.code, event.reason, event.wasClean);

  if (event.code === 1006) {
    // No real close frame was ever sent or received — the connection
    // was lost abnormally (network drop, crashed server, killed proxy).
    // event.reason will be an empty string, since there was no actual
    // close frame carrying a reason string either.
    scheduleReconnect({ immediate: true });
  } else if (event.code === 1008) {
    // Policy violation (commonly used for auth failures) — an actual
    // close frame WAS sent with this real code. Retrying immediately
    // without fixing the underlying auth problem won't help.
    handleAuthFailure(event.reason);
  } else if (event.code === 1000) {
    // Normal, intentional closure — often no reconnect needed at all.
    console.log('Clean disconnect, no action needed');
  }
};

// event.wasClean is false whenever code is 1006 — this is not a
// coincidence, it's the same underlying fact reported two ways.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A developer writes server-side code that explicitly calls ws.close(1006, "connection lost") when it detects a heartbeat timeout, intending to tell the client "this was an abnormal disconnect." Will this actually work as intended, per RFC 6455?',
    hint: 'Does RFC 6455 permit an endpoint to explicitly SEND code 1006 in a real close frame, or is 1006 specifically reserved as something an API can only report locally when NO close frame was ever involved?',
    solution: 'This will not work as the developer intends, and depending on the WebSocket implementation, it may even throw an error or be silently rejected/rewritten — RFC 6455 §7.4.1 explicitly states 1006 "MUST NOT be set as a status code in a Close control frame by an endpoint." It is reserved specifically for the scenario where NO close frame was ever sent or received at all — a client-side (or server-side) API reporting "the connection just vanished, I never got any close information." Attempting to actively send 1006 is a contradiction: sending it requires successfully transmitting a close frame, but 1006\'s entire meaning is "no close frame was ever transmitted." If the developer wants to signal an abnormal server-detected disconnect (like a heartbeat timeout) through an intentional close frame, the correct approach is a different, non-reserved code — commonly 1001 (Going Away) or a custom application-defined code in the 4000–4999 range, with a descriptive reason string like "heartbeat timeout" — never 1006 itself.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'A server can explicitly send close code 1006 to tell a client "this connection was closed abnormally," the same way it might send 1000 for a normal close.',
      reality: 'This subtopic\'s theory and exercise both establish that RFC 6455 explicitly forbids any endpoint from sending 1006 in an actual close frame — it exists purely as a client-API sentinel value used when NO close frame was ever transmitted at all, making "sending" it a contradiction in terms.'
    },
    {
      thought: 'Seeing close code 1006 in a browser\'s onclose handler means the server (or client) sent that specific code as part of a normal close sequence.',
      reality: 'This subtopic\'s theory clarifies the opposite: 1006 specifically means NO real close frame or code was ever sent or received — the connection was simply lost (network drop, crash, killed proxy), and the WebSocket API reports 1006 locally precisely because there was nothing real to report.'
    },
    {
      thought: 'All WebSocket close codes behave the same way — they are all values that either endpoint can freely choose to send in a close frame.',
      reality: 'This subtopic\'s theory shows code 1006 is a genuine exception in the RFC 6455 table — every other common code (1000, 1001, 1008, etc.) can legitimately appear in a real close frame, while 1006 is structurally reserved and can never appear on the wire at all.'
    }
  ];
}
