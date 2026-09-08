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
    heading: 'The Alert Already Exists — It Just Has Nowhere to Go Yet',
    points: [
      'The main page’s own "Prometheus Operator CRDs" codeTab defines a complete <code>PrometheusRule</code> — <code>OrderServiceHighErrorRate</code>, labeled <code>severity: critical</code> and <code>team: platform</code>. The Quick Reference separately names AlertmanagerConfig as the CRD that configures "Slack webhook, PagerDuty key, routing by label," but no codeTab anywhere on the page ever builds one, so the alert this hub already defines has no actual delivery destination configured.',
      'AlertmanagerConfig’s <code>route.matchers</code> field matches on exactly the same label keys a PrometheusRule’s alert carries — routing <code>team: platform</code> to a specific receiver is a direct, mechanical extension of an alert that already has that label, not a separate system needing its own alert definitions.',
      'A Slack webhook URL is a secret, not something to inline as plaintext in a manifest — the correct, verified pattern references it via <code>apiURL.key</code>/<code>apiURL.name</code> pointing at a Kubernetes Secret, the same secret-reference convention used throughout Kubernetes for any credential a CRD needs to consume.',
    ],
  },
];

const codeTabs: CodeTab[] = [
  {
    label: 'AlertmanagerConfig Routing the PrometheusRule’s Own Alert',
    language: 'bash',
    code: `# Matches the exact alert already defined on the main page's own
# "Prometheus Operator CRDs" codeTab -- OrderServiceHighErrorRate,
# labeled severity: critical, team: platform.
apiVersion: monitoring.coreos.com/v1alpha1
kind: AlertmanagerConfig
metadata:
  name: platform-team-routing
  namespace: monitoring
  labels:
    release: prometheus   # must match Alertmanager CR's own selector, same
                           # pattern as ServiceMonitor's "release: prometheus"
spec:
  route:
    groupBy: ['alertname', 'team']
    groupWait: 30s
    groupInterval: 5m
    repeatInterval: 4h
    receiver: platform-slack
    routes:
      # Only alerts carrying team: platform reach this receiver --
      # a matching alert from a DIFFERENT team never routes here.
      - matchers:
          - name: team
            value: platform
            matchType: =
        receiver: platform-slack

  receivers:
    - name: platform-slack
      slackConfigs:
        - apiURL:
            name: slack-webhook-secret   # Secret, not an inline URL
            key: webhook-url
          channel: '#platform-alerts'
          sendResolved: true
          title: '{{ .CommonLabels.alertname }} ({{ .CommonLabels.severity }})'
          text: '{{ .CommonAnnotations.summary }}'`,
  },
];

const exercise: TryItExercise = {
  prompt:
    'A SECOND PrometheusRule alert, <code>PaymentServiceHighLatency</code>, is added elsewhere with <code>severity: critical, team: payments</code> — no <code>team: platform</code> label at all. Does this new alert reach the <code>#platform-alerts</code> Slack channel via the AlertmanagerConfig above?',
  hint: 'Look at exactly which label the <code>matchers</code> entry checks, and what value it requires.',
  solution: `// No -- it does NOT reach #platform-alerts.
//
// The route's matchers entry checks specifically for
//   name: team, value: platform, matchType: =
//
// PaymentServiceHighLatency carries team: payments, not team: platform --
// an exact-match matcher with matchType: = requires the label value to
// equal "platform" precisely. severity: critical being shared between
// both alerts is irrelevant here, since the matcher never references
// the severity label at all.
//
// This is the entire point of routing by label rather than by alert
// NAME: a completely unrelated team's alert, even one with the exact
// same severity, is automatically excluded without this
// AlertmanagerConfig needing to know that PaymentServiceHighLatency
// exists at all -- the routing logic only cares about the team label's
// value, whatever alert happens to carry it.`,
};

const misconceptions: Misconception[] = [
  {
    thought: 'The Slack webhook URL could just be pasted directly into the <code>apiURL</code> field as a plain string — using a Secret reference is an optional best practice, not a functional requirement.',
    reality: 'A raw Slack webhook URL is a genuine credential — anyone who can read it can post arbitrary messages to that channel as the configured integration. Since AlertmanagerConfig manifests are frequently stored in Git (matching the main page’s own repeated "declarative, Git-storable" framing for ServiceMonitor/PrometheusRule), inlining the URL directly would commit a live credential to version control; the <code>apiURL.name</code>/<code>apiURL.key</code> Secret reference keeps the actual URL out of the manifest entirely.',
  },
  {
    thought: 'Since the AlertmanagerConfig’s <code>route.matchers</code> checks the <code>team</code> label, this AlertmanagerConfig resource needs to be created in the SAME namespace as the <code>OrderServiceHighErrorRate</code> PrometheusRule it’s routing.',
    reality: 'AlertmanagerConfig routing works purely off the alert’s LABELS at evaluation time, not off which namespace either resource lives in — an Alertmanager instance discovers AlertmanagerConfig objects across namespaces via its own <code>alertmanagerConfigSelector</code>/<code>alertmanagerConfigNamespaceSelector</code> fields (the same selector-based discovery pattern <code>Alertmanager</code> itself uses to find AlertmanagerConfig objects, mirroring how Prometheus discovers ServiceMonitor/PrometheusRule objects), so the PrometheusRule and the AlertmanagerConfig routing its alerts don’t need to share a namespace at all.',
  },
  {
    thought: 'The <code>groupBy</code> field (set to <code>alertname</code> and <code>team</code> above) just controls WHICH alerts get sent to Slack — a narrower groupBy means fewer notifications.',
    reality: '<code>groupBy</code> controls how MULTIPLE simultaneously-firing alerts get BATCHED into a single notification, not whether an alert is sent at all — it’s the <code>route.matchers</code> field that decides delivery. A broad <code>groupBy</code> (grouping many different alerts into one notification) and a narrow one (each distinct alertname+team combination gets its own notification) both still deliver every matching alert; grouping only changes how those deliveries are bundled together in time.',
  },
];

@Component({
  selector: 'app-obs-cloud-native-alertmanagerconfig',
  standalone: true,
  imports: [CommonModule, SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent,
    CodeBlockComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './routing-the-pages-own-alert-with-alertmanagerconfig.html',
  styleUrl: './routing-the-pages-own-alert-with-alertmanagerconfig.scss',
})
export class RoutingThePagesOwnAlertWithAlertmanagerconfigSubtopic {
  theory = theory;
  codeTabs = codeTabs;
  exercise = exercise;
  misconceptions = misconceptions;
}
