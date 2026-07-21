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
  templateUrl: './websocket-disconnect-is-best-effort-not-guaranteed.html',
  styleUrl: './websocket-disconnect-is-best-effort-not-guaranteed.scss'
})
export class WebsocketDisconnectIsBestEffortNotGuaranteedSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page mentions WebSocket API in one line — the $connect/$disconnect lifecycle never appears at all',
      points: [
        'The main page\'s own quickRef defines WebSocket API only as "Persistent bidirectional connections; routes on JSON message fields; backend via Lambda or HTTP integration." The main page\'s own theory bullet adds only that it "routes messages to different Lambdas based on JSON field (routeSelectionExpression)."',
        'Nowhere on the main page do the words $connect, $disconnect, or any reliability guarantee for either appear — a genuine content gap, not just an imprecise claim, for a feature the main page\'s own quickRef and quiz both treat as a first-class API type alongside REST and HTTP.',
      ]
    },
    {
      heading: '$connect is a blocking gate; $disconnect is explicitly documented as best-effort, not guaranteed',
      points: [
        'Per AWS\'s own documentation on the $connect route: "Until execution of the integration associated with the $connect route is completed, the upgrade request is pending and the actual connection will not be established. If the $connect request fails (e.g., due to AuthN/AuthZ failure or an integration failure), the connection will not be made." $connect is a real gate — the connection genuinely does not exist until it succeeds.',
        '$disconnect is fundamentally different. Per AWS\'s own documentation: "The $disconnect route is executed after the connection is closed... As the connection is already closed when it is executed, $disconnect is a best-effort event. API Gateway will try its best to deliver the $disconnect event to your integration, but it cannot guarantee delivery."',
        'AWS\'s own documented WebSocket close status codes make the failure mode concrete: code 1006 fires for "an unexpected closure of the connection, such as the TCP connection closed without a WebSocket close frame" — exactly the abrupt-network-loss scenario where there was no clean handshake for API Gateway to reliably notify your integration with. Code 1001 covers the more orderly cases (10-minute idle timeout, or the 2-hour maximum connection lifetime), which are more likely — though still not guaranteed — to result in a delivered $disconnect event.',
        'The practical consequence: any cleanup logic that MUST run exactly once per ended connection (decrementing an active-connection counter, marking a user offline, releasing a held resource) cannot rely on $disconnect alone — a phone losing signal, a laptop closing abruptly, or a network partition can all end a connection without ever triggering the $disconnect integration.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Reproducing unreliable cleanup with $disconnect alone',
      language: 'bash',
      code: `# A live-chat app, matching the main page's own "routes messages to
# different Lambdas" framing -- $connect increments an active-user
# counter, $disconnect decrements it:

aws apigatewayv2 create-route \\
  --api-id ws123 --route-key '$connect' \\
  --target integrations/connect-integration-id

aws apigatewayv2 create-route \\
  --api-id ws123 --route-key '$disconnect' \\
  --target integrations/disconnect-integration-id

# $connect Lambda (pseudocode):
# await dynamo.update({ Key: { id: 'activeUsers' }, UpdateExpression: 'ADD count :one' });

# $disconnect Lambda (pseudocode) -- the ONLY place the counter is
# decremented:
# await dynamo.update({ Key: { id: 'activeUsers' }, UpdateExpression: 'ADD count :negOne' });

# Simulate an abrupt network loss (no clean WebSocket close frame --
# e.g. killing the client process outright, or physically
# disconnecting network access, rather than calling ws.close()):
kill -9 <client-process-pid>

# Per AWS's own documented best-effort behavior, this connection may
# close with status 1006 ("unexpected closure... without a WebSocket
# close frame") -- and $disconnect may never fire at all. Checking
# the counter after this abrupt disconnect:
aws dynamodb get-item --table-name Presence --key '{"id":{"S":"activeUsers"}}'
# count is still incremented from $connect -- never decremented,
# because $disconnect was never delivered for this connection.`,
    },
    {
      label: 'The documented mitigation — a self-healing reconciliation pattern',
      language: 'bash',
      code: `# Since $disconnect can't be relied upon alone, pair it with a
# TTL-based "last seen" record per connection instead of a single
# incremented/decremented counter:

# On $connect AND on periodic client-sent pings (a custom route,
# e.g. "heartbeat"), refresh a per-connection TTL item:
aws dynamodb put-item --table-name Connections --item '{
  "connectionId": {"S": "abc123"},
  "lastSeen":     {"N": "1700000000"},
  "expiresAt":    {"N": "1700000090"}
}'
# expiresAt is set ~90s in the future -- refreshed on every
# heartbeat. DynamoDB TTL automatically deletes the item once it's
# stale, WITHOUT needing $disconnect to have fired at all.

# Enable TTL on the table (one-time setup):
aws dynamodb update-time-to-live \\
  --table-name Connections \\
  --time-to-live-specification AttributeName=expiresAt,Enabled=true

# "Who's currently connected" is now computed from the Connections
# table's live item count, not from an incremented/decremented
# counter that depends on $disconnect always firing:
aws dynamodb scan --table-name Connections --select COUNT

# $disconnect is STILL worth keeping as an integration -- it's an
# immediate, low-latency signal for the common clean-close case --
# but it's no longer the ONLY mechanism the correctness of "who's
# online" depends on. The TTL-based expiry self-heals for exactly
# the abrupt-disconnect cases $disconnect can silently miss.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A live-chat application, matching the main page\'s own WebSocket API framing, tracks an "active users" count by incrementing it in $connect and decrementing it in $disconnect. Over a week of real production traffic, the team notices the count only ever drifts upward — it never fully corrects itself, even though the team can independently confirm the actual number of concurrently connected users stays roughly stable day to day. Using this subtopic\'s theory, explain the drift and describe a fix that doesn\'t depend on $disconnect always firing.',
    hint: 'What specific real-world disconnect scenario does AWS\'s own documentation say $disconnect is NOT guaranteed to fire for?',
    solution: 'Per this subtopic\'s theory, the upward-only drift is the expected signature of relying solely on $disconnect for a decrement that AWS explicitly documents as best-effort, not guaranteed: "API Gateway will try its best to deliver the $disconnect event to your integration, but it cannot guarantee delivery." Every real-world abrupt disconnection — a mobile client losing signal, a laptop closing without a clean WebSocket close frame, matching AWS\'s own documented status code 1006 for "unexpected closure... without a WebSocket close frame" — increments the counter via $connect but has a real chance of never triggering the matching $disconnect decrement, since there\'s no guaranteed delivery mechanism for a route that fires "after the connection is already closed." Over enough abrupt disconnects, the counter accumulates permanently-missed decrements, which explains both the always-upward direction of the drift and why it never self-corrects (nothing else in the naive design ever brings it back down). The fix, per this subtopic\'s theory, is to stop relying on a single incremented/decremented counter at all — replace it with a per-connection record refreshed by periodic heartbeats and a TTL-based expiry (via DynamoDB TTL or an equivalent scheduled cleanup), so "who\'s currently connected" is computed by counting live, non-expired records rather than trusting that every $connect is eventually matched by a delivered $disconnect.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'Since a WebSocket connection can only be established after $connect succeeds, $disconnect must be equally guaranteed to fire when that same connection ends.',
      reality: 'Per this subtopic\'s theory, AWS documents these as fundamentally different guarantees — $connect is a blocking gate the connection cannot exist without, while $disconnect is explicitly a best-effort NOTIFICATION after the fact, with no delivery guarantee.'
    },
    {
      thought: 'A clean, client-initiated WebSocket close (calling close() properly) and an abrupt network failure are equally likely to result in a delivered $disconnect event.',
      reality: 'Per this subtopic\'s theory, AWS\'s own documented close status codes distinguish these cases directly — code 1006 specifically covers "unexpected closure... without a WebSocket close frame," exactly the scenario where $disconnect delivery is least reliable, unlike an orderly close or idle timeout.'
    },
    {
      thought: 'Using $connect and $disconnect Lambda integrations alone is sufficient for accurately tracking "who is currently connected" in a database.',
      reality: 'Per this subtopic\'s exercise, a design relying only on these two routes can drift indefinitely, since abrupt disconnects can silently skip $disconnect — a self-healing pattern (TTL-based expiry refreshed by heartbeats) is needed for correctness that doesn\'t depend on $disconnect always firing.'
    }
  ];
}
