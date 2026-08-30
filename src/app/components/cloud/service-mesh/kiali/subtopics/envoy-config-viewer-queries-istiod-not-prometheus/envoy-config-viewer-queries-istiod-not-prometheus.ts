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
  templateUrl: './envoy-config-viewer-queries-istiod-not-prometheus.html',
  styleUrl: './envoy-config-viewer-queries-istiod-not-prometheus.scss'
})
export class EnvoyConfigViewerQueriesIstiodNotPrometheusSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'A genuine overgeneralization caught during this batch',
      points: [
        'The main page\'s theory originally stated flatly: "It does NOT directly query Envoy — it reads from Prometheus." Elsewhere on the SAME page, the QnA describes a completely different Kiali feature: "The Envoy config viewer shows the actual Envoy proxy configuration for a pod." These two claims are in tension — if Kiali truly never queries anything Envoy-related outside Prometheus, where does the ACTUAL live Envoy config data (clusters, listeners, routes, bootstrap) shown in that viewer come from? The main page is now corrected to scope the "reads from Prometheus" claim to the service graph specifically.',
      ]
    },
    {
      heading: 'The reality: the Envoy Config Viewer has a completely different data path',
      points: [
        'Kiali\'s Envoy tab (available on any Envoy-proxied workload) fetches live proxy configuration via an HTTP GET to <strong>Istiod\'s own debug endpoint</strong>: `http://istiod.istio-system:15014/debug/config_dump?proxyID=<pod>.<namespace>` — not Prometheus, and not a direct connection to the workload\'s own Envoy admin port either.',
        'This is architecturally the SAME data Envoy\'s own admin interface (`localhost:15000/config_dump` inside the pod) would show for that specific proxy, but Kiali reaches it through the control plane\'s debug API rather than connecting to each pod individually — a real, different network path from the metrics-based service graph.',
      ]
    },
    {
      heading: 'Why this distinction matters operationally',
      points: [
        'Kiali\'s TWO major data sources have genuinely different failure modes: if Prometheus is down or has a scrape gap, the service graph goes stale or blank, but the Envoy Config Viewer still works fine (it never touched Prometheus). Conversely, if Istiod is unreachable or overloaded, the Envoy Config Viewer breaks while the service graph (reading historical Prometheus data) may still render.',
        'When troubleshooting "why is Kiali showing X but not Y," knowing WHICH data path a specific Kiali feature uses (Prometheus vs. Istiod\'s debug endpoint) narrows down where to actually look for the root cause — treating "Kiali" as a single monolithic data source obscures this.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'The service graph\'s data path (Prometheus)',
      language: 'bash',
      code: `# Kiali's service graph queries Prometheus directly for
# traffic metrics -- this is what "reads from Prometheus" means:
curl -s "http://prometheus.monitoring.svc:9090/api/v1/query" \\
  --data-urlencode 'query=rate(istio_requests_total[1m])'
# Kiali's backend runs equivalent PromQL queries under the hood
# to build the graph's nodes, edges, and health indicators.`,
    },
    {
      label: 'The Envoy Config Viewer\'s data path (Istiod, NOT Prometheus)',
      language: 'bash',
      code: `# Kiali's Envoy tab queries ISTIOD's debug endpoint directly --
# a completely separate path from the service graph:
kubectl exec -n istio-system deploy/istiod -- \\
  curl -s "http://localhost:15014/debug/config_dump?proxyID=api-7d9f8-abcde.production"

# This returns the live Envoy config (clusters, listeners,
# routes, bootstrap) that Istiod believes it has pushed to
# that specific proxy -- Prometheus is never involved in
# fetching this data, even though the SAME Kiali UI shows
# both the service graph and this config view side by side.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'During an incident, Prometheus becomes temporarily unavailable (out of memory, restarting). A team using Kiali notices the service graph freezes and shows stale data, as expected. But they can still successfully open the "Envoy" tab on a workload and see live, current cluster/route configuration for that pod. Does this contradict the main page\'s claim that "Kiali reads from Prometheus," or is there a reasonable explanation?',
    hint: 'Does EVERY Kiali feature use the same data source, or do different features (the service graph vs. the Envoy config viewer) have their own independent data paths?',
    solution: 'This does not contradict anything once the claim is properly scoped — the service graph specifically depends on Prometheus, and it correctly went stale when Prometheus became unavailable, exactly as expected. But the Envoy Config Viewer uses a completely different data path: it queries Istiod\'s own debug endpoint (/debug/config_dump) directly, which has no dependency on Prometheus at all. So it continuing to work during a Prometheus outage is expected behavior, not a contradiction — it is powered by an entirely separate part of Kiali\'s backend that never touches Prometheus in the first place.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'Every feature in Kiali\'s UI is powered by the same underlying data source (Prometheus) — "Kiali reads from Prometheus" describes the whole tool uniformly.',
      reality: 'Per this subtopic\'s theory (a genuine overgeneralization caught and corrected on the main page during this batch), this is only true for the service graph specifically — the Envoy Config Viewer uses a completely separate data path through Istiod\'s debug endpoint, with no Prometheus involvement at all.'
    },
    {
      thought: 'The Envoy config data Kiali\'s "Envoy" tab displays comes from Kiali connecting directly to each pod\'s own Envoy admin interface (localhost:15000) on that workload.',
      reality: 'Per this subtopic\'s theory, Kiali actually reaches this data through ISTIOD\'s own debug endpoint (port 15014), not a direct pod-level connection to Envoy\'s admin API — the control plane acts as the intermediary, not a direct Kiali-to-Envoy connection.'
    },
    {
      thought: 'If Prometheus is down, every part of Kiali (service graph, config validation, Envoy config viewer) should be expected to fail or show stale data simultaneously, since they are all "Kiali features."',
      reality: 'Per this subtopic\'s theory, different Kiali features have independent data-source dependencies — a Prometheus outage specifically breaks the service graph, while the Envoy Config Viewer (Istiod-dependent) and CRD validation (Kubernetes-API-dependent) can continue working normally.'
    }
  ];
}
