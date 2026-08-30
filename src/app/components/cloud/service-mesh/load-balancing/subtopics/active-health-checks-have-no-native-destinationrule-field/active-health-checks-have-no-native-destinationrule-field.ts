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
  templateUrl: './active-health-checks-have-no-native-destinationrule-field.html',
  styleUrl: './active-health-checks-have-no-native-destinationrule-field.scss'
})
export class ActiveHealthChecksHaveNoNativeDestinationRuleFieldSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'A genuine inaccuracy caught during this batch: the main page named a field that does not exist',
      points: [
        'The main page\'s theory and QnA originally stated active health checks are "configured via DestinationRule\'s <code>trafficPolicy.healthCheck</code> (or via an EnvoyFilter for advanced config)." Verified directly against Istio\'s own DestinationRule API reference, this is wrong — <code>trafficPolicy.healthCheck</code> does not exist anywhere in the schema. The main page has been corrected.',
      ]
    },
    {
      heading: 'What TrafficPolicy actually contains',
      points: [
        'DestinationRule\'s <code>TrafficPolicy</code> message has exactly these fields: <code>loadBalancer</code>, <code>connectionPool</code>, <code>outlierDetection</code>, <code>tls</code>, <code>portLevelSettings</code>, <code>tunnel</code>, <code>proxyProtocol</code>, and <code>retryBudget</code>. There is no <code>healthCheck</code> field, and no field anywhere else in DestinationRule for configuring active (probe-based) health checks.',
        '<code>outlierDetection</code> is the ONLY native, DestinationRule-configurable health-signal mechanism — and it is exclusively PASSIVE (it observes real traffic responses; it never sends its own probe requests). The main page\'s own distinction between "active" and "passive" checking was directionally correct, it just incorrectly implied active checking had a native config path too.',
      ]
    },
    {
      heading: 'The real, and only, way to get active health checks in Istio',
      points: [
        'Active health checking in Istio is reachable ONLY through an <strong>EnvoyFilter</strong> that patches the generated Envoy CLUSTER resource\'s own native <code>health_checks</code> field directly — this is Envoy\'s underlying capability, exposed with no dedicated Istio API wrapper around it at all, unlike outlierDetection which DOES have a first-class Istio API surface.',
        'Practical implication: active health checks in Istio require writing and maintaining low-level EnvoyFilter YAML (targeting the exact cluster by FQDN, using Envoy\'s own proto field names, not Istio\'s simplified schema) — a meaningfully higher operational cost than outlierDetection\'s simple DestinationRule fields, which is worth knowing before assuming "I\'ll just add active health checks later" is a small config change.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'What does NOT work: a non-existent trafficPolicy.healthCheck field',
      language: 'bash',
      code: `cat <<EOF | kubectl apply -f -
apiVersion: networking.istio.io/v1beta1
kind: DestinationRule
metadata:
  name: catalog
spec:
  host: catalog
  trafficPolicy:
    healthCheck:              # THIS FIELD DOES NOT EXIST
      interval: 10s            # Rejected by schema validation --
      path: /healthz           # trafficPolicy has no "healthCheck"
      unhealthyThreshold: 3    # field in the DestinationRule API.
EOF
# kubectl/istioctl validation error:
# unknown field "healthCheck" in
# networking.istio.io.v1beta1.TrafficPolicy`,
    },
    {
      label: 'What actually works: EnvoyFilter patching the raw cluster',
      language: 'bash',
      code: `cat <<EOF | kubectl apply -f -
apiVersion: networking.istio.io/v1alpha3
kind: EnvoyFilter
metadata:
  name: catalog-active-health-check
spec:
  workloadSelector:
    labels:
      app: caller-of-catalog
  configPatches:
  - applyTo: CLUSTER
    match:
      cluster:
        service: catalog.default.svc.cluster.local
    patch:
      operation: MERGE
      value:
        health_checks:
        - timeout: 2s
          interval: 10s
          unhealthy_threshold: 3
          healthy_threshold: 2
          http_health_check:
            path: /healthz
EOF
# This is the ONLY native path to active health checks --
# note the raw Envoy proto field names (snake_case,
# health_checks as a list), unlike Istio's usual camelCase.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A team wants to add active health checking to a service that already has outlierDetection configured in its DestinationRule. Based on the main page\'s original (now-corrected) claim, they attempt to add a healthCheck block under the same trafficPolicy, expecting it to work the same way outlierDetection did. What happens, and what should they actually do?',
    hint: 'Is trafficPolicy.healthCheck a real field in the DestinationRule schema? What mechanism does Istio actually expose for active health checks?',
    solution: 'Adding a healthCheck block under trafficPolicy fails schema validation — there is no such field anywhere in DestinationRule\'s TrafficPolicy message (which only has loadBalancer, connectionPool, outlierDetection, tls, portLevelSettings, tunnel, proxyProtocol, and retryBudget). Unlike outlierDetection, which IS a first-class, simple DestinationRule field, active health checks have no Istio API wrapper at all. The team needs to write an EnvoyFilter that MERGE-patches the generated cluster\'s own health_checks field directly, using Envoy\'s raw proto schema (snake_case field names like unhealthy_threshold, not Istio\'s usual camelCase) and targeting the exact cluster by its service FQDN.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'Active health checks can be configured directly in a DestinationRule, similar to how outlierDetection is configured, via a trafficPolicy.healthCheck field.',
      reality: 'Per this subtopic\'s theory (a genuine inaccuracy caught and corrected on the main page during this batch), no such field exists — TrafficPolicy has exactly 8 fields, none named healthCheck, and active health checking has no native DestinationRule surface at all.'
    },
    {
      thought: 'Since outlierDetection and active health checking are both described as "health checking" mechanisms on the main page, they have comparable configuration complexity and API support in Istio.',
      reality: 'Per this subtopic\'s theory, outlierDetection is a first-class, simple DestinationRule field with a dedicated Istio API schema, while active health checking requires hand-written EnvoyFilter YAML using Envoy\'s own raw proto field names — a meaningfully higher operational and maintenance cost.'
    },
    {
      thought: 'EnvoyFilter is only needed for advanced, unusual health-check tuning — most active health check setups can still be done through a simpler, more standard Istio API path.',
      reality: 'Per this subtopic\'s theory, EnvoyFilter is not an advanced option for active health checks — it is the ONLY option. There is no simpler, more standard Istio API path for this feature at all, unlike most other traffic-management features that have both a simple native field and an EnvoyFilter escape hatch for edge cases.'
    }
  ];
}
