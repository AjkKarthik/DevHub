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
  templateUrl: './warmupdurationsecs-starts-new-pods-at-10-percent-not-0-percent.html',
  styleUrl: './warmupdurationsecs-starts-new-pods-at-10-percent-not-0-percent.scss'
})
export class WarmupDurationSecsStartsNewPodsAt10PercentNot0PercentSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'A genuine inaccuracy caught during this batch: the main page\'s own quiz explanation said "~0%"',
      points: [
        'The main page\'s quiz explanation for <code>warmupDurationSecs</code> originally described new pods receiving traffic "from ~0% to their fair share." Verified directly against Envoy\'s own SlowStartConfig specification, this is imprecise — new pods actually start receiving traffic immediately, at a real, non-zero minimum. The main page has been corrected.',
      ]
    },
    {
      heading: 'The reality: Envoy\'s slow-start floor defaults to 10%, not 0%',
      points: [
        'Envoy\'s <code>SlowStartConfig.min_weight_percent</code> — the field Istio\'s <code>warmupDurationSecs</code> translates into — defaults to <strong>10%</strong> when not explicitly set. This means a brand-new pod joining the load balancer pool receives roughly 10% of its eventual fair-share weight from the very first moment it\'s eligible, not 0%.',
        'The ramp itself is governed by the <code>aggression</code> parameter, which defaults to <strong>1.0</strong> — Envoy\'s own spec states this produces a "linearly increasing amount of traffic." So the main page\'s "linearly increasing" claim was correct; only the starting point ("~0%") was wrong.',
      ]
    },
    {
      heading: 'Why the 10% floor matters in practice',
      points: [
        'A true 0%-start ramp would mean a genuinely cold pod (JVM not yet warmed, connection pools not yet primed) receives zero traffic for a meaningful fraction of the warmup window — which sounds safer, but actually means slow-start provides NO early signal about whether the new pod is actually healthy under real load until traffic finally starts flowing.',
        'The 10% floor is a deliberate design choice: it guarantees every new pod gets SOME real traffic immediately, giving outlier detection and monitoring a chance to catch a genuinely broken deployment early — rather than only discovering the problem once the ramp finishes and traffic reaches 100%.',
        'Istio\'s API does not expose Envoy\'s own <code>aggression</code> field directly — only <code>warmupDurationSecs</code> (the window length) is configurable via DestinationRule, so the ramp shape is always linear (aggression=1.0) and the floor is always Envoy\'s built-in 10%. A non-linear (polynomial/exponential) ramp is only reachable via an EnvoyFilter.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Slow start with the default floor (10%, unconfigurable via DestinationRule)',
      language: 'bash',
      code: `cat <<EOF | kubectl apply -f -
apiVersion: networking.istio.io/v1beta1
kind: DestinationRule
metadata:
  name: ml-inference
spec:
  host: ml-inference
  trafficPolicy:
    loadBalancer:
      simple: LEAST_CONN
      warmupDurationSecs: 30
      # Istio only exposes the WINDOW length here.
      # Envoy's own min_weight_percent (10%) and
      # aggression (1.0, linear) are NOT configurable
      # through this field -- they use Envoy's built-in
      # defaults every time.
EOF

# A new pod joining this pool at t=0 immediately receives
# ~10% of its eventual fair-share weight -- NOT 0%.
# At t=15s (halfway through the 30s window): ~55%.
# At t=30s (warmup complete): 100% (full fair share).`,
    },
    {
      label: 'Reaching Envoy\'s aggression field directly (EnvoyFilter, advanced)',
      language: 'bash',
      code: `cat <<EOF | kubectl apply -f -
apiVersion: networking.istio.io/v1alpha3
kind: EnvoyFilter
metadata:
  name: ml-inference-slow-start-aggression
spec:
  workloadSelector:
    labels:
      app: caller-of-ml-inference
  configPatches:
  - applyTo: CLUSTER
    match:
      cluster:
        service: ml-inference.default.svc.cluster.local
    patch:
      operation: MERGE
      value:
        lb_config:
          slow_start_config:
            slow_start_window: "30s"
            aggression:
              default_value: 2.0   # non-linear -- new pods ramp
                                    # SLOWER at first, then faster
            min_weight_percent:
              value: 5             # override the 10% default floor
EOF
# Only reachable via EnvoyFilter -- DestinationRule's
# warmupDurationSecs cannot express aggression or a
# custom min_weight_percent.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A team configures warmupDurationSecs: 20 on a service that\'s expensive to cold-start (a large in-memory cache must fill before requests are fast). Based on the main page\'s original (now-corrected) claim, they expect a brand-new pod to receive ZERO traffic for the first several seconds after joining the pool, giving the cache time to warm silently. After deploying, they observe real traffic hitting the new pod within milliseconds of it becoming ready. Is this a bug?',
    hint: 'What is Envoy\'s actual default minimum traffic floor for a pod in slow start, and is 0% ever really the starting point?',
    solution: 'This is not a bug — it is the expected, documented behavior. Envoy\'s slow-start mechanism has a default min_weight_percent of 10%, meaning a new pod receives roughly 10% of its eventual fair-share traffic from the very first moment it is eligible, not 0%. The team\'s expectation (based on the main page\'s original, since-corrected claim) was wrong. If they genuinely need a pod to receive zero traffic for an initial grace period, warmupDurationSecs alone cannot provide that — they would need a separate mechanism (e.g. a Kubernetes readiness gate that delays marking the pod Ready until the cache is warm, keeping it out of the Endpoints list entirely) rather than relying on slow start to suppress all traffic.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'warmupDurationSecs ramps a new pod\'s traffic starting from 0% up to its full fair share over the configured window.',
      reality: 'Per this subtopic\'s theory (a genuine inaccuracy caught and corrected on the main page during this batch), Envoy\'s slow-start mechanism has a default minimum weight floor of 10% — a new pod receives roughly 10% of its fair share immediately, not 0%.'
    },
    {
      thought: 'Since the ramp is described as "linear," the exact shape (linear vs. accelerating vs. decelerating) can be tuned directly through Istio\'s DestinationRule warmupDurationSecs field.',
      reality: 'Per this subtopic\'s theory, warmupDurationSecs only controls the WINDOW LENGTH — the ramp shape is governed by Envoy\'s own aggression parameter (default 1.0, producing a linear ramp), which Istio\'s DestinationRule API does not expose at all; changing it requires an EnvoyFilter.'
    },
    {
      thought: 'A 0%-starting slow-start ramp would be strictly safer for a genuinely cold, expensive-to-warm service than Envoy\'s actual 10%-floor behavior.',
      reality: 'Per this subtopic\'s theory, a true 0%-start ramp would delay any real signal about whether the new pod is actually healthy under load — the 10% floor is a deliberate design choice that gives monitoring and outlier detection an early, real chance to catch a broken deployment, rather than only discovering problems once the ramp completes.'
    }
  ];
}
