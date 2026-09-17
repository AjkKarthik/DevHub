import { Component } from '@angular/core';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent, SubtopicLink } from '../../../../../shared/subtopic-nav/subtopic-nav';

@Component({
  selector: 'app-a-real-health-check-endpoint-with-ping-timeout',
  standalone: true,
  imports: [SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
            TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './a-real-health-check-endpoint-with-ping-timeout.html',
  styleUrl: './a-real-health-check-endpoint-with-ping-timeout.scss',
})
export class ARealHealthCheckEndpointWithPingTimeoutSubtopic {
  theory: TheoryPoint[] = [
    {
      heading: 'Two theory bullets that only pay off together',
      points: [
        'The main page states two things separately, in two different bullets, and never connects them in code: "client-side timeouts should be configured explicitly... rather than relying on defaults," and "health check endpoints... should verify actual Redis connectivity (a simple PING command) rather than assuming Redis is healthy."',
        'Combined, they describe a specific failure mode neither bullet alone protects against: a health check that calls PING with NO timeout of its own can hang indefinitely if Redis is unresponsive but not fully disconnected (a stuck connection, an overloaded server) — the endpoint that exists to detect an unhealthy Redis becomes unhealthy itself, hanging the orchestrator\'s own probe.',
      ],
    },
    {
      heading: 'Why the endpoint needs its OWN timeout, separate from the client\'s',
      points: [
        'A Redis client\'s own <code>maxRetriesPerRequest</code>/command-timeout settings are tuned for normal request traffic — often several seconds, to tolerate a real but temporary slowdown without failing a user-facing request unnecessarily.',
        'A liveness/readiness probe has a completely different job: report unhealthy FAST so an orchestrator can route traffic elsewhere or restart the instance. Racing the PING call against its own short, independent timeout (well under the client\'s own retry budget) gives the health endpoint a predictable worst-case response time regardless of what the client\'s own retry policy is doing.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'checkRedisHealth() with an explicit timeout',
      language: 'typescript',
      code: `import Redis from 'ioredis';

interface RedisHealth {
  ok: boolean;
  latencyMs?: number;
  error?: string;
}

async function checkRedisHealth(redis: Redis, timeoutMs = 500): Promise<RedisHealth> {
  const start = Date.now();
  try {
    const pong = await Promise.race([
      redis.ping(),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('PING timeout')), timeoutMs)
      ),
    ]);
    if (pong !== 'PONG') throw new Error(\`unexpected PING reply: \${pong}\`);
    return { ok: true, latencyMs: Date.now() - start };
  } catch (err) {
    return { ok: false, error: (err as Error).message };
  }
}

app.get('/healthz', async (req, res) => {
  const health = await checkRedisHealth(redis, 500);
  res.status(health.ok ? 200 : 503).json(health);
});`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'Three scenarios reach <code>checkRedisHealth()</code>: (1) Redis is healthy and PING replies in 5ms, (2) Redis is fully down and the socket rejects the call immediately with a connection error, (3) Redis is up but wedged — it accepted the TCP connection but never replies to PING at all. Predict the outcome and response time for each with a 500ms timeout.',
    hint: 'The connection-refused case and the hung-server case reach the endpoint through two different code paths — only one of them ever needs the setTimeout race to actually fire.',
    solution: `(1) Healthy: redis.ping() resolves with 'PONG' almost immediately, well inside the race; { ok: true, latencyMs: ~5 } after roughly 5ms.

(2) Fully down: redis.ping() itself REJECTS quickly (a connection-refused-style error from the client), which the try/catch catches directly -- the race never has to wait out its own timer, since the ping() side of Promise.race settles first. { ok: false, error: '...' } after roughly however long the client's own connection-error detection takes, typically well under 500ms.

(3) Wedged: this is the ONLY case where the setTimeout actually wins the race -- redis.ping() never settles at all, so after exactly 500ms the timeout promise rejects first, producing { ok: false, error: 'PING timeout' } at almost exactly the 500ms mark. Without this timeout, case (3) would hang the health endpoint itself for as long as the client's own command timeout allows -- potentially far longer than an orchestrator's own probe deadline, causing the exact "probe hangs instead of reporting unhealthy" failure this subtopic exists to prevent.`,
  };

  misconceptions: Misconception[] = [
    {
      thought: '"If the Redis client already has its own command timeout configured, wrapping PING in a second Promise.race timeout is redundant."',
      reality: 'The client\'s own timeout is tuned for ordinary request traffic and is typically several seconds — appropriate for not failing a real user request over a brief blip, but far too slow for a liveness probe that needs to report failure quickly so an orchestrator can act. The two timeouts serve different purposes at different layers; the health endpoint\'s own shorter timeout is what actually bounds ITS OWN worst-case response time.',
    },
    {
      thought: '"A 200 (healthy) response from this endpoint means the application\'s Redis usage is fully working."',
      reality: 'PING only confirms the connection is alive and Redis is responding to the simplest possible command — it says nothing about whether a specific key exists, whether AUTH/ACL permissions are correctly configured for the operations the app actually performs, or whether a specific database (<code>SELECT</code>ed db number) is reachable. A passing health check is a necessary signal, not a sufficient one, for "the application\'s Redis usage is fully working."',
    },
  ];

  topicLabel = 'Redis with Node.js';
  topicRoute = '/redis/redis-nodejs';
  prev: SubtopicLink | null = {
    label: 'Typed defineCommand(), Without the as any Cast',
    route: '/redis/redis-nodejs/typed-definecommand-without-as-any',
  };
  next: SubtopicLink | null = null;
}
