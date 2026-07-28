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
  templateUrl: './a-service-with-no-destinationrule-still-has-a-1024-connection-cap.html',
  styleUrl: './a-service-with-no-destinationrule-still-has-a-1024-connection-cap.scss'
})
export class AServiceWithNoDestinationRuleStillHasA1024ConnectionCapSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page\'s circuit-breaker examples always show an explicit DestinationRule, never addressing what happens with none at all',
      points: [
        'Every circuit-breaker example on the main page — the "Circuit Breaker" codeTab, the mistakes block, the Challenge — configures <code>connectionPool</code> explicitly. Nothing states what protection (if any) exists for a service that has NO DestinationRule at all, or one with an empty <code>trafficPolicy</code>.',
      ]
    },
    {
      heading: 'The reality: Envoy applies real default limits even with zero explicit configuration',
      points: [
        'When <code>connectionPool.tcp.maxConnections</code> and <code>connectionPool.http.http1MaxPendingRequests</code> are left unset, Envoy does not treat them as "unlimited" — it falls back to its own built-in defaults, both <strong>1024</strong>, for maxConnections and max_pending_requests respectively.',
        'This means a service with no DestinationRule circuit-breaker configuration at all is NOT actually "unprotected" — it already has real caps, just at a value (1024) that was never deliberately chosen for that specific service\'s actual capacity or traffic pattern.',
      ]
    },
    {
      heading: 'Why this matters: the default is a generic ceiling, not a tuned protection value',
      points: [
        'A default of 1024 concurrent connections is almost certainly far higher than what a lightly-provisioned pod (say, one comfortably handling 50 concurrent requests) can actually sustain — meaning the "protection" this default provides is largely theoretical for smaller services; genuine overload can occur well before hitting 1024.',
        'Conversely, for a genuinely high-throughput service, 1024 might be unexpectedly LOW and start rejecting legitimate traffic during a real spike, with no obvious DestinationRule anyone remembers configuring to explain why. Either way, the practical lesson is the same: never assume "no explicit connectionPool" means "no circuit breaker" — it means "whatever Envoy\'s generic 1024 default happens to be" — and that default is worth deliberately overriding to match the actual service\'s real capacity, not left as an accident of omission.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'No DestinationRule at all: still has real limits',
      language: 'bash',
      code: `# "reporting" service has NO DestinationRule whatsoever
$ kubectl get destinationrule -n production | grep reporting
# (no output -- none exists)

# It still has an ACTIVE circuit breaker, from Envoy's own
# built-in defaults -- confirm via the live proxy config:
istioctl proxy-config cluster deploy/api.production \\
  --fqdn reporting.production.svc.cluster.local -o json | \\
  python3 -c "import sys,json; c=json.load(sys.stdin)[0]; \\
  print(c.get('circuitBreakers'))"

# Output shows real, non-empty thresholds -- NOT unlimited:
# { "thresholds": [{ "maxConnections": 1024,
#                     "maxPendingRequests": 1024, ... }] }
# This is Envoy's generic default, not "no protection."`,
    },
    {
      label: 'Deliberately tuning the default for a lightly-provisioned service',
      language: 'bash',
      code: `# "reporting" only runs 2 small replicas -- 1024 concurrent
# connections would badly overload it long before that cap
# is ever reached. Set a real, deliberate limit instead:

apiVersion: networking.istio.io/v1beta1
kind: DestinationRule
metadata:
  name: reporting
spec:
  host: reporting
  trafficPolicy:
    connectionPool:
      tcp:
        maxConnections: 40        # matched to actual capacity
      http:
        http1MaxPendingRequests: 20

# NOW the circuit breaker trips at a threshold that actually
# reflects what this specific service can handle, rather than
# a generic ceiling that happened to be Envoy's own default.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A small, lightly-provisioned service (2 replicas, each comfortably handling about 30 concurrent requests) has no DestinationRule configured at all. During a traffic spike, the pods become severely overloaded — CPU maxed out, response times climbing into the tens of seconds — well before Envoy\'s circuit breaker ever trips. A team investigating assumes "there\'s no circuit breaker configured, so nothing is limiting the load." Is this assumption correct?',
    hint: 'Does the absence of an explicit DestinationRule mean Envoy applies NO connection/request limits at all, or does it fall back to some built-in default?',
    solution: 'The assumption is not quite correct — Envoy IS applying a circuit breaker, just at its generic default of 1024 concurrent connections and 1024 pending requests, since no DestinationRule ever overrode those defaults. The real problem is that 1024 is far higher than this specific service\'s actual capacity (comfortably handling around 60 total concurrent requests across 2 replicas) — the circuit breaker exists but was never tuned to reflect reality, so it provides essentially no practical protection for a service this small. The fix is adding an explicit DestinationRule with connectionPool limits matched to the service\'s actual measured capacity, rather than continuing to rely on Envoy\'s generic, one-size-fits-all default.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'A Kubernetes service with no DestinationRule at all has no circuit breaker or connection limits whatsoever — traffic to it is genuinely unbounded until it\'s explicitly configured.',
      reality: 'Per this subtopic\'s theory, Envoy applies its own built-in default limits (1024 for both maxConnections and max_pending_requests) even with zero explicit DestinationRule configuration — the service is never truly "unprotected," just protected at a generic, un-tuned value.'
    },
    {
      thought: 'Since a service without an explicit DestinationRule still has SOME circuit breaker active (via Envoy\'s defaults), that default value is reasonably well-suited to most services and doesn\'t need to be deliberately overridden.',
      reality: 'Per this subtopic\'s theory, the 1024 default is a generic ceiling with no relationship to any specific service\'s actual capacity — it can be far too high (providing negligible real protection for a small service) or unexpectedly too low (rejecting legitimate traffic for a genuinely high-throughput one), and should be deliberately tuned rather than left as an accident of omission.'
    },
    {
      thought: 'If a service is being severely overloaded and its response times are climbing, that alone proves no circuit breaker is active for that service.',
      reality: 'Per this subtopic\'s theory, a circuit breaker can be genuinely active (at Envoy\'s default 1024 threshold) while still failing to prevent overload, if the actual traffic never reaches that specific numeric threshold before the service is already struggling for other reasons (CPU, memory, downstream latency) — "circuit breaker exists" and "circuit breaker is usefully tuned" are different claims.'
    }
  ];
}
