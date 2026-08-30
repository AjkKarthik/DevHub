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
  templateUrl: './circuit-breaking-exists-but-needs-an-explicit-failure-accrual-annotation.html',
  styleUrl: './circuit-breaking-exists-but-needs-an-explicit-failure-accrual-annotation.scss'
})
export class CircuitBreakingExistsButNeedsAnExplicitFailureAccrualAnnotationSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page\'s "relies on EWMA instead" framing implies Linkerd has no dedicated circuit-breaking mechanism at all',
      points: [
        'The main page\'s theory bullet says: "Circuit breaking is not built into Linkerd by default — it relies on retries + timeouts + health-based load balancing (EWMA latency-aware) to handle failures instead." Read at face value, "relies on ... instead" suggests EWMA load balancing is Linkerd\'s SUBSTITUTE for circuit breaking — a different mechanism doing a similar job, rather than "not built in by default" meaning something as specific as "off unless explicitly enabled."',
      ]
    },
    {
      heading: 'What EWMA load balancing actually does — and does not do',
      points: [
        'EWMA (exponentially-weighted moving average) load balancing weights traffic distribution toward FASTER-responding endpoints among those already considered available — it is a load-DISTRIBUTION mechanism. On its own, it does NOT eject a consistently-failing endpoint from rotation; a slow-but-technically-responding endpoint gets deprioritized, but an endpoint returning errors isn\'t automatically removed by EWMA alone.',
      ]
    },
    {
      heading: 'What actually IS a dedicated circuit breaker: failure-accrual, gated behind an explicit annotation',
      points: [
        'Linkerd DOES have a genuine, dedicated circuit-breaking feature — implemented as failure accrual in the proxy\'s own load balancer — that automatically ejects an endpoint from rotation once it accumulates enough failures (consecutive 5xx responses, or a configurable success-rate threshold, depending on the chosen policy), then probes it periodically to test recovery before allowing traffic back.',
        'This feature is NOT active by default — it requires an explicit Kubernetes Service annotation, <code>balancer.linkerd.io/failure-accrual</code>, set to <code>"consecutive"</code> or <code>"unified"</code> depending on the desired policy. Without this annotation, Linkerd genuinely does behave the way the main page describes — EWMA-based load balancing only, no active endpoint ejection on failure.',
        'The corrected picture: the main page\'s literal claim ("not built into Linkerd by default") is technically accurate, but its explanatory framing ("relies on ... EWMA ... instead") undersells what actually exists — a real, dedicated circuit-breaking mechanism that simply needs one annotation to turn on, not a fundamentally different EWMA-only substitute with no direct equivalent to Istio\'s outlier detection.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Default: EWMA only, no active ejection',
      language: 'bash',
      code: `# A Service with NO failure-accrual annotation:
apiVersion: v1
kind: Service
metadata:
  name: payment-svc
spec:
  selector: { app: payment }
  ports: [{ port: 8080 }]

# Under this default configuration:
#   - EWMA load balancing distributes traffic favoring
#     lower-latency endpoints among those considered available
#   - An endpoint returning consistent 5xx errors is NOT
#     automatically removed from rotation just because of EWMA --
#     it may still receive traffic (just weighted differently
#     if it's also SLOW, which correlated but isn't guaranteed)
#   - This matches the main page's own description: retries +
#     timeouts + EWMA, no dedicated active ejection`,
    },
    {
      label: 'Enabling real circuit breaking: the failure-accrual annotation',
      language: 'bash',
      code: `apiVersion: v1
kind: Service
metadata:
  name: payment-svc
  annotations:
    balancer.linkerd.io/failure-accrual: "consecutive"
    # Alternative: "unified" for a success-rate-based policy
spec:
  selector: { app: payment }
  ports: [{ port: 8080 }]

# With this annotation:
#   - The proxy tracks consecutive 5xx / relevant gRPC error
#     codes per endpoint
#   - Once an endpoint crosses the failure threshold, it is
#     marked unavailable and EXCLUDED from load-balancer
#     selection entirely -- genuine, active ejection
#   - The endpoint enters a probation period, receiving
#     periodic probe requests (with exponential backoff)
#     to test whether it has recovered
#   - Only once probes succeed does the endpoint return to
#     normal rotation

# This is Linkerd's actual functional equivalent to Istio's
# DestinationRule outlierDetection -- it just isn't on by
# default, and requires this specific annotation to activate.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'Following the main page\'s own framing that Linkerd "relies on retries + timeouts + health-based load balancing (EWMA) instead" of circuit breaking, a team concludes Linkerd has no way to automatically stop sending traffic to a consistently-failing pod, and plans to build custom application-level logic for this. Is this conclusion accurate, and what should they check first?',
    hint: 'Does EWMA load balancing alone eject a failing endpoint from rotation, or is there a separate, dedicated feature for that specific behavior?',
    solution: 'The conclusion is not accurate. While EWMA load balancing alone does not eject a failing endpoint, Linkerd does have a genuine, dedicated circuit-breaking feature (failure accrual) that automatically excludes a consistently-failing endpoint from load-balancer selection, with automatic recovery probing — it is simply not enabled by default, requiring the balancer.linkerd.io/failure-accrual Service annotation (set to "consecutive" or "unified") to activate. Before building custom application-level logic, the team should add this annotation to the relevant Service — it directly solves the problem they\'re describing, without needing any custom code.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'Since the main page says Linkerd "relies on retries + timeouts + health-based load balancing (EWMA) instead" of circuit breaking, Linkerd has no dedicated mechanism at all for automatically ejecting a consistently-failing endpoint from rotation.',
      reality: 'Per this subtopic\'s theory, Linkerd has a genuine, dedicated failure-accrual circuit-breaking feature that does exactly this — it is simply off by default and requires an explicit Service annotation to enable, which is a different claim than "no such mechanism exists."'
    },
    {
      thought: 'EWMA (latency-aware) load balancing in Linkerd automatically stops sending traffic to an endpoint that starts returning errors, since it is described as part of how Linkerd "handles failures."',
      reality: 'Per this subtopic\'s theory, EWMA weights traffic distribution toward faster-responding endpoints — it does not eject a failing endpoint from rotation on its own; active ejection specifically requires the separate failure-accrual annotation.'
    },
    {
      thought: 'Enabling circuit breaking in Linkerd requires a dedicated CRD, similar to how Istio uses DestinationRule\'s outlierDetection field.',
      reality: 'Per this subtopic\'s theory, Linkerd\'s circuit breaking is enabled via a plain Kubernetes Service annotation (balancer.linkerd.io/failure-accrual) — no separate CRD is needed, consistent with Linkerd\'s broader design philosophy of minimizing custom resource types.'
    }
  ];
}
