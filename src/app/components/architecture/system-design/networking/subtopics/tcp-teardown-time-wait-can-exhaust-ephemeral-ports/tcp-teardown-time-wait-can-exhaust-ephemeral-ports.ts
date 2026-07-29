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
  templateUrl: './tcp-teardown-time-wait-can-exhaust-ephemeral-ports.html',
  styleUrl: './tcp-teardown-time-wait-can-exhaust-ephemeral-ports.scss'
})
export class TcpTeardownTimeWaitCanExhaustEphemeralPortsSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'A gap in the main page\'s own TCP coverage: only half the connection lifecycle',
      points: [
        'The main page\'s "TCP vs UDP" section thoroughly covers connection SETUP — the 3-way handshake (SYN-SYN/ACK-ACK) — but says nothing about connection TEARDOWN, or the very real production issue that teardown can cause under high connection churn. This subtopic closes that gap.',
      ]
    },
    {
      heading: 'The reality: TCP closes with a 4-way handshake, then lingers in TIME_WAIT',
      points: [
        'Closing a TCP connection involves FIN and ACK exchanges from both sides — a 4-way close (FIN → ACK → FIN → ACK), distinct from the 3-way SYN handshake that opens a connection.',
        'The side that sends the FIRST FIN (the "active closer") enters a TIME_WAIT state after the close completes, and stays there for 2×MSL (Maximum Segment Lifetime) — commonly 60 seconds on many systems (some use 30s or 120s) — specifically to prevent stray, delayed packets from an old connection being misdelivered into a NEW connection that happens to reuse the same source IP/port/destination IP/port 4-tuple.',
        'Each connection sitting in TIME_WAIT holds onto its ephemeral (client-side) port for that entire 2×MSL window — and a typical system only has roughly 28,000 usable ephemeral ports (the default range is commonly 32,768–60,999).',
      ]
    },
    {
      heading: 'Why this is a real, recurring production issue — not just protocol trivia',
      points: [
        'A service that repeatedly opens short-lived TCP connections to the SAME destination (a common pattern: not pooling HTTP connections to a downstream API, or not pooling database connections) can genuinely exhaust its ephemeral port range under load: at 500 new connections/second to one destination, each holding a port for 60 seconds, that\'s ~30,000 ports needed simultaneously — more than the default range provides — and new outbound connections start failing.',
        'This is the concrete, practical reason "use a connection pool" (for HTTP clients, database drivers, etc.) is standard advice, not just a performance optimization — it directly avoids this specific TIME_WAIT/port-exhaustion failure mode, which the main page\'s TCP section gives no hint even exists.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Observing TIME_WAIT accumulation and the ephemeral port range',
      language: 'bash',
      code: `# Check the local ephemeral port range (Linux):
cat /proc/sys/net/ipv4/ip_local_port_range
# Typical output: 32768  60999   (~28,000 usable ports)

# Count sockets currently sitting in TIME_WAIT:
ss -tan state time-wait | wc -l

# Symptom of exhaustion: new outbound connections fail with
# "cannot assign requested address" (EADDRNOTAVAIL) once every
# ephemeral port toward a given destination is tied up in
# TIME_WAIT.

# The standard fix is connection reuse/pooling, NOT lowering
# TIME_WAIT itself (which risks the stale-packet problem
# TIME_WAIT exists to prevent):
#   - HTTP clients: keep-alive + a bounded connection pool
#   - Databases: a connection pool (pgbouncer, HikariCP, etc.)
#   - Avoid opening a brand-new TCP connection per request`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A service opens a brand-new outbound HTTP connection (no keep-alive, no pooling) for every request to a single downstream API, sustaining 600 requests/second. Using the ~60-second TIME_WAIT duration and the ~28,000-port ephemeral range from this subtopic, is this sustainable?',
    hint: 'How many ports does a connection held in TIME_WAIT for 60 seconds tie up, at a sustained rate of 600 new connections per second to the same destination?',
    solution: 'No — at 600 new connections/second, each occupying its ephemeral port for ~60 seconds in TIME_WAIT, the service needs roughly 600 × 60 = 36,000 ports available SIMULTANEOUSLY just to keep up, which exceeds the typical ~28,000-port ephemeral range. This service will start hitting ephemeral port exhaustion and failing to open new connections well before reaching any CPU or bandwidth limit. The fix is connection pooling/reuse (HTTP keep-alive with a bounded pool) so the service isn\'t opening (and then TIME_WAIT-ing) a fresh connection for every single request.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'TCP connections are established via a 3-way handshake and closed just as simply, with no special lingering state afterward.',
      reality: 'Per this subtopic\'s theory (a gap closed on the main page during this batch), TCP closes via a 4-way handshake, and the side that closes first lingers in TIME_WAIT for roughly 2×MSL (commonly ~60 seconds) afterward — a real, stateful cost, not an instant teardown.'
    },
    {
      thought: 'A service can safely open a fresh TCP connection per request at any request rate, as long as the server can handle the load.',
      reality: 'Per this subtopic\'s theory, the CLIENT side can independently run out of ephemeral ports under high connection churn due to TIME_WAIT accumulation — a failure mode unrelated to server capacity, only fixable by connection reuse/pooling.'
    },
    {
      thought: 'The fix for TIME_WAIT-related port exhaustion is to reduce the TIME_WAIT duration itself.',
      reality: 'Per this subtopic\'s theory, TIME_WAIT exists specifically to prevent stale packets from a closed connection corrupting a new one reusing the same 4-tuple — shortening it risks that exact problem; the standard, correct fix is connection pooling/reuse instead.'
    }
  ];
}
