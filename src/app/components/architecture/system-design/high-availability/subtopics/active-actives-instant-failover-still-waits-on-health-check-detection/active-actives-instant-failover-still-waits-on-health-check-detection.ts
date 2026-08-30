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
  templateUrl: './active-actives-instant-failover-still-waits-on-health-check-detection.html',
  styleUrl: './active-actives-instant-failover-still-waits-on-health-check-detection.scss'
})
export class ActiveActivesInstantFailoverStillWaitsOnHealthCheckDetectionSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'A true claim about warmup that got stretched into a claim about total delay',
      points: [
        'The main page\'s Quick Reference and quiz explanation described active-active failover as effectively instant — "failover is instant," "a failed node is just removed from rotation with no warmup needed." The "no warmup" part is genuinely true and is the real advantage active-active has over active-passive. But it has been tightened, since it originally implied there is no delay of ANY kind, which overstates the case.',
        'The gap-closing addition here: even in active-active, something still has to NOTICE a node has failed before the load balancer stops sending it traffic — and that detection step takes real, non-zero time.',
      ]
    },
    {
      heading: 'What actually determines failure-detection time',
      points: [
        'Load balancer health checks work on an interval, not continuously — the standard rule of thumb for how long detection takes is interval × unhealthy-threshold: the health check runs every N seconds, and the node is marked unhealthy only after some number of CONSECUTIVE failed checks (to avoid false positives from one transient blip).',
        'Typical configurations range widely by use case: a fast-detection setup for critical services might use a 5-second interval with a 2-check threshold (detection in ~10s), while a more conservative setup might use a 15-30 second interval with a 3-5 check threshold (detection in 45-150s) to avoid flapping on noisy/busy systems.',
        'Until that detection completes, requests routed to the already-failed node during that window still fail or time out — active-active removes the LONG recovery tail (the 30s-2min active-passive promotion process) but does not remove this shorter, unavoidable detection window.',
      ]
    },
    {
      heading: 'Why this precision matters for setting realistic expectations',
      points: [
        'A team designing for a tight SLA (say, wanting to bound any single failure\'s user impact to under 15 seconds) needs to actually TUNE the health check interval and threshold to hit that number — "active-active is instant" gives no guidance on what to configure, while "detection takes roughly interval × threshold" gives an actionable lever to pull.',
        'This also explains a real operational tradeoff the main page\'s original phrasing skipped entirely: a shorter interval/threshold detects failures faster but increases the risk of falsely marking a healthy-but-momentarily-slow node as unhealthy (removing capacity unnecessarily) — tuning this is a genuine balancing act, not a solved, zero-cost setting to just turn all the way down.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Detection time = interval x threshold',
      language: 'typescript',
      code: `interface HealthCheckProfile {
  useCase: string;
  intervalSeconds: number;
  unhealthyThreshold: number;
  approxDetectionSeconds: number;
}

const profiles: HealthCheckProfile[] = [
  {
    useCase: 'High-traffic / critical service',
    intervalSeconds: 5,
    unhealthyThreshold: 2,
    approxDetectionSeconds: 10, // 5 x 2
  },
  {
    useCase: 'Standard service',
    intervalSeconds: 15,
    unhealthyThreshold: 3,
    approxDetectionSeconds: 45, // 15 x 3
  },
  {
    useCase: 'Background worker (noise-tolerant)',
    intervalSeconds: 30,
    unhealthyThreshold: 5,
    approxDetectionSeconds: 150, // 30 x 5
  },
];

// "Active-active failover is instant" describes what happens AFTER
// detection completes (no warmup for surviving nodes) -- it says
// nothing about the detection window itself, which is real and
// directly configurable via these two settings.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A team runs an active-active deployment and assumes "failover is instant" means a node failure has zero user-visible impact. Their load balancer uses the default standard-service profile: 15-second interval, 3-check unhealthy threshold. A node crashes hard (stops responding entirely) at a random moment. What is the realistic worst-case window during which some requests could still be routed to the dead node?',
    hint: 'How many health checks have to fail, and how far apart are they, before the load balancer marks the node unhealthy and stops routing to it?',
    solution: 'With a 15-second interval and a 3-check unhealthy threshold, the load balancer needs 3 CONSECUTIVE failed checks before marking the node unhealthy — roughly 15 x 3 = 45 seconds in the worst case (if the node fails right after a successful check, the next check won\'t even happen for up to 15 seconds, then two more 15-second intervals must also fail). During that ~45-second window, any request the load balancer routes to the now-dead node will fail or time out — "active-active failover is instant" is only true for what happens to load AFTER that detection window closes (the surviving nodes need no warmup); it does not mean zero user impact from the moment of failure. Tightening the interval/threshold (e.g. to the fast-detection profile) would shrink this window to roughly 10 seconds, at the cost of being more sensitive to transient false positives.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'Active-active deployments have zero user-visible impact from a node failure, since there is no warmup delay for the surviving nodes.',
      reality: 'Per this subtopic\'s theory, "no warmup for surviving nodes" is genuinely true, but a separate detection window (interval x unhealthy-threshold) still has to elapse before the load balancer stops routing to the dead node — requests sent during that window still fail.'
    },
    {
      thought: 'Health check interval and unhealthy threshold should always be set as low/small as possible to minimize detection time.',
      reality: 'Per this subtopic\'s theory, a very short interval/threshold increases the risk of false positives on a merely slow-but-healthy node, unnecessarily removing capacity — tuning these settings is a real tradeoff between fast detection and stability, not a setting to minimize without cost.'
    },
    {
      thought: 'The active-active vs. active-passive failover-time comparison is really "instant" vs. "30 seconds to 2 minutes."',
      reality: 'Per this subtopic\'s theory, the more accurate comparison is "a short, configurable detection window (commonly 10-150s depending on tuning) with no additional warmup" vs. "that same kind of detection, PLUS a much longer promotion/DNS-update process" — active-active is faster because it skips the second part, not because detection itself is instant.'
    }
  ];
}
