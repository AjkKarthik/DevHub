import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-yarp-passive-health-check-mechanics-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
    TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './passive-health-checks-dont-verify-recovery-just-retry-after-timeout.html',
  styleUrl: './passive-health-checks-dont-verify-recovery-just-retry-after-timeout.scss',
})
export class PassiveHealthChecksDontVerifyRecoveryJustRetryAfterTimeoutSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: '"Stops Routing Until They Recover" Overstates What Passive Health Checks Actually Do',
      points: [
        'The main page\'s own Common Mistake states passive health checks make YARP "stop routing to [failing destinations] until they recover" — this reads as if YARP verifies recovery before resuming traffic. In reality, PASSIVE health checking never actively probes anything (that\'s what ACTIVE health checks are for) — it only observes real proxied traffic. When a destination is marked unhealthy, YARP simply excludes it from load-balancing for a configured ReactivationPeriod, and once that timer elapses, the destination is unmarked and becomes eligible for traffic again — with zero verification that it actually recovered.',
        'This means the very NEXT real user request sent to a destination that is STILL down after its reactivation period will fail exactly as before — passive health checks alone provide time-based exclusion, not recovery confirmation. A destination that takes longer to recover than the ReactivationPeriod will cycle in and out of the eligible pool repeatedly, briefly failing a request each cycle, until it genuinely comes back.',
      ],
    },
    {
      heading: 'Why Active Health Checks Are the Actual Verification Mechanism',
      points: [
        'Active health checks are what genuinely verify recovery — they send scheduled probe requests to a dedicated health endpoint on each destination, independent of real traffic, and only mark a destination healthy again once a probe actually succeeds. The main page\'s own Q&A note ("Using both together provides the most robust failure detection") is the key operational takeaway: passive checks provide fast failure detection from real traffic with no probing overhead, while active checks provide the missing VERIFIED RECOVERY step passive checks alone cannot offer.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Passive AND active configured together — ReactivationPeriod highlighted',
      language: 'csharp',
      code: `{
  "ReverseProxy": {
    "Clusters": {
      "api-cluster": {
        "HealthCheck": {
          "Passive": {
            "Enabled": true,
            "Policy": "TransportFailureRate",
            "ReactivationPeriod": "00:00:30"
          },
          "Active": {
            "Enabled": true,
            "Interval": "00:00:10",
            "Timeout": "00:00:05",
            "Path": "/health"
          }
        },
        "Destinations": {
          "dest1": { "Address": "http://api-1:8080/" },
          "dest2": { "Address": "http://api-2:8080/" }
        }
      }
    }
  }
}
// ReactivationPeriod: 30 seconds after being marked unhealthy, dest1
// becomes ELIGIBLE for traffic again — with NO verification it's
// actually back up. Active health checks separately probe /health
// every 10 seconds and are what actually CONFIRM recovery.`,
    },
    {
      label: 'Test proving reactivation retries a destination that is still down',
      language: 'csharp',
      code: `[Fact]
public async Task Destination_Is_Retried_After_ReactivationPeriod_Even_If_Still_Down()
{
    var connectionAttempts = 0;
    using var flakyBackend = new TcpListener(IPAddress.Loopback, 0);
    flakyBackend.Start();
    var port = ((IPEndPoint)flakyBackend.LocalEndpoint).Port;

    // Accept every connection but immediately reset it — simulates a
    // backend that never recovers, while letting us COUNT connection
    // attempts (distinguishing "retried and failed" from "excluded forever").
    _ = Task.Run(async () =>
    {
        while (true)
        {
            using var socket = await flakyBackend.AcceptSocketAsync();
            Interlocked.Increment(ref connectionAttempts);
            socket.Close();   // reset — the destination never actually works
        }
    });

    var client = BuildProxyClientWithShortReactivationPeriod(
        destination: $"http://127.0.0.1:{port}/",
        reactivationPeriod: TimeSpan.FromMilliseconds(200));

    await client.GetAsync("/api/products");             // 1st attempt — marks unhealthy
    var attemptsAfterFirstFailure = connectionAttempts;

    await Task.Delay(300);                                // past reactivation period
    await client.GetAsync("/api/products");              // 2nd request

    // If reactivation genuinely re-tried the destination, connectionAttempts
    // increased — proving YARP retried a destination it never verified as
    // healthy, purely because the reactivation timer elapsed.
    Assert.True(connectionAttempts > attemptsAfterFirstFailure);
}`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A team configures Passive health checks with a 30-second ReactivationPeriod but does NOT enable Active health checks, reasoning "passive checks already handle failure detection, and 30 seconds should be plenty of time for the backend to recover." What is the actual risk of this setup for a backend outage lasting exactly 45 seconds?',
    hint: 'Walk through what happens at second 30, when reactivation fires but the backend is still down for another 15 seconds.',
    solution: `At the 30-second mark, YARP unconditionally re-admits the destination
to the eligible pool — since passive checks never verify recovery, this
happens regardless of whether the backend is actually back. Because the
outage lasts 45 seconds (15 seconds longer than the reactivation
period), the very next real user request routed to that destination
after reactivation will fail again — a genuine user experiences a
failed request purely because the timer expired, not because anything
indicated recovery.

Depending on the passive-check policy's failure-rate window, this
single renewed failure MAY immediately re-mark the destination
unhealthy again (restarting another 30-second exclusion), or it may
take a few failures to cross the threshold again — either way, without
active health checks, the team has no mechanism that waits for an
ACTUAL successful probe before resuming full traffic. Adding active
health checks (probing a dedicated /health endpoint) would only mark
the destination healthy again once a probe genuinely succeeds — closing
the exact gap this setup leaves open, regardless of how long the real
outage turns out to last.`,
  };

  misconceptions: Misconception[] = [
    {
      thought: '"YARP marks failing destinations unhealthy and stops routing to them until they recover," as the main page states, means YARP verifies a destination is actually working again before resuming traffic to it.',
      reality: 'passive health checks never actively verify anything — they simply exclude a destination for a fixed ReactivationPeriod, then unconditionally make it eligible for traffic again, with no confirmation the underlying failure was actually resolved.',
    },
    {
      thought: 'enabling passive health checks alone is sufficient protection against a backend that is still down when its reactivation period elapses.',
      reality: 'a destination that is still down when reactivated will simply fail the next real request routed to it — passive checks provide fast failure detection, not verified recovery; that requires active health checks probing a dedicated endpoint.',
    },
    {
      thought: 'passive and active health checks are two alternative ways to achieve the same protection, so configuring one makes configuring the other redundant.',
      reality: 'they solve different halves of the problem — passive checks detect failures quickly from real traffic with no probing overhead, while active checks are the only mechanism that confirms a destination has genuinely recovered before fully trusting it again.',
    },
  ];
}
