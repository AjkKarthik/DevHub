import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';

const theory: TheoryPoint[] = [
  {
    heading: 'A Copy-Paste From ServiceMonitor Uses the Wrong Field Name',
    points: [
      'The main page’s own Quick Reference names PodMonitor as "the Prometheus Operator CRD for scraping individual pods (without a Service) — useful for DaemonSets and StatefulSets," but no codeTab anywhere on the page actually builds one — only the ServiceMonitor example is ever shown, for the (Deployment-backed) <code>order-service</code>.',
      'The two CRDs look almost interchangeable at a glance, but their scrape-endpoint field has a genuinely DIFFERENT name — confirmed directly against the Prometheus Operator’s own API reference: ServiceMonitor uses <code>endpoints</code> (matching the main page’s own codeTab exactly), while PodMonitor uses <code>podMetricsEndpoints</code>. A PodMonitor manifest that copies ServiceMonitor’s <code>endpoints:</code> field verbatim is not a typo the Kubernetes API server catches — it’s simply an unrecognized field that gets silently dropped by CRD validation (or ignored under a permissive schema), leaving the PodMonitor selecting pods but scraping nothing at all.',
      'PodMonitor exists specifically for workloads that have no Service fronting them at all — the exact DaemonSet/StatefulSet case the Quick Reference names, where each pod needs to be scraped directly by its own pod IP rather than through a Service’s virtual IP and endpoint list.',
    ],
  },
];

const codeTabs: CodeTab[] = [
  {
    label: 'PodMonitor for a DaemonSet, Field Names Compared',
    language: 'bash',
    code: `# ServiceMonitor (already on the main page) -- scrapes THROUGH a Service,
# uses "endpoints:"
apiVersion: monitoring.coreos.com/v1
kind: ServiceMonitor
metadata:
  name: order-service
spec:
  selector:
    matchLabels:
      app: order-service
  endpoints:
    - port: metrics
      path: /metrics
      interval: 15s

---
# PodMonitor -- scrapes pods DIRECTLY, no Service needed. Uses
# "podMetricsEndpoints:", NOT "endpoints:" -- a real, easy copy-paste trap.
apiVersion: monitoring.coreos.com/v1
kind: PodMonitor
metadata:
  name: node-exporter
  namespace: monitoring
  labels:
    release: prometheus
spec:
  selector:
    matchLabels:
      app: node-exporter   # matches the DaemonSet's pod labels directly
  namespaceSelector:
    matchNames:
      - monitoring
  podMetricsEndpoints:      # <- NOT "endpoints:" like ServiceMonitor
    - port: metrics
      path: /metrics
      interval: 15s`,
  },
];

const exercise: TryItExercise = {
  prompt:
    'A DaemonSet like <code>node-exporter</code> — one pod per cluster node, no Service in front of it — is exactly the case PodMonitor exists for. Could you instead write a ServiceMonitor for it by creating a headless Service (<code>clusterIP: None</code>) that selects the same DaemonSet pods, and would that actually work?',
  hint: 'Think about what a headless Service DOES provide (DNS records for each pod) versus what ServiceMonitor’s own scraping mechanism actually needs from it.',
  solution: `// Yes, this genuinely works, and it's a real, documented alternative --
// a headless Service selecting the DaemonSet's pods gives ServiceMonitor
// something to discover via Kubernetes Endpoints objects, which is what
// ServiceMonitor's own scrape-target discovery is built around.
//
// This is precisely WHY PodMonitor exists as a SEPARATE CRD rather than
// being strictly required: it's a convenience that skips creating an
// extra Service object purely to satisfy ServiceMonitor's discovery
// mechanism, when all you actually want is "scrape these pods directly."
// Both approaches end up scraping the same pods -- the choice is really
// about whether you want an extra Service resource in your manifests at
// all, not about a capability gap between the two CRDs.`,
};

const misconceptions: Misconception[] = [
  {
    thought: 'A PodMonitor manifest that uses <code>endpoints:</code> instead of <code>podMetricsEndpoints:</code> would fail Kubernetes CRD validation with a clear error, the same way a genuine YAML typo would.',
    reality: 'Depending on the exact CRD schema’s validation strictness, an unrecognized field like this is commonly just silently ignored (pruned) rather than rejected — the PodMonitor object gets created successfully, its <code>selector</code> correctly matches pods, but with no scrape endpoints configured at all, Prometheus never actually scrapes anything from it. There’s often no error to notice at all, just an empty target list.',
  },
  {
    thought: 'Since PodMonitor and ServiceMonitor both ultimately configure Prometheus scrape targets, they must share the exact same spec schema underneath, just with a cosmetically different endpoint field name.',
    reality: 'The field NAME difference reflects a real, deeper distinction in what each CRD is discovering: ServiceMonitor resolves scrape targets via Kubernetes Endpoints (built from a Service’s selector, giving you the Service’s named ports), while PodMonitor resolves targets directly from Pod objects — a Pod has container ports, not Service endpoint ports, which is part of why the two CRDs settled on differently-named, non-interchangeable endpoint fields rather than sharing one.',
  },
  {
    thought: 'Since node-exporter pods run as a DaemonSet with no Service in front of them in this example, using PodMonitor is the ONLY correct way to scrape them — a ServiceMonitor simply cannot be used here at all.',
    reality: 'The Try It above confirms this is not strictly true: a headless Service selecting the same DaemonSet pods gives ServiceMonitor everything it needs via Kubernetes Endpoints. PodMonitor is the more DIRECT and conventional choice for Service-less workloads, not the only technically possible one.',
  },
];

@Component({
  selector: 'app-obs-cloud-native-podmonitor-field',
  standalone: true,
  imports: [CommonModule, SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent,
    CodeBlockComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './podmonitor-uses-a-different-field-name-than-servicemonitor.html',
  styleUrl: './podmonitor-uses-a-different-field-name-than-servicemonitor.scss',
})
export class PodmonitorUsesADifferentFieldNameThanServicemonitorSubtopic {
  theory = theory;
  codeTabs = codeTabs;
  exercise = exercise;
  misconceptions = misconceptions;
}
