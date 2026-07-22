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
  templateUrl: './service-selector-switch-isnt-actually-instant.html',
  styleUrl: './service-selector-switch-isnt-actually-instant.scss'
})
export class ServiceSelectorSwitchIsntActuallyInstantSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page\'s own Blue/Green code tab labels the traffic switch "instant, atomic" — Kubernetes\' own docs describe something more nuanced',
      points: [
        'The main page\'s own "Blue/Green Deploy (Kubernetes)" code tab has a comment reading "Step 4: Switch traffic to green (instant, atomic)" right above the `kubectl patch service` command. The `kubectl patch` command itself does return almost immediately — but that only means the Service OBJECT in the Kubernetes API was updated, not that every node\'s actual traffic-routing rules were updated at the same moment.',
        'Kubernetes\' own documentation describes what actually propagates that change: "Each instance of kube-proxy watches the Kubernetes control plane for the addition and removal of Service and EndpointSlice objects... A control loop ensures that the rules on each node are reliably synchronized with the Service and EndpointSlice state as indicated by the API server." That control loop is a separate, ongoing background process — not something that completes the instant the API object changes.',
      ]
    },
    {
      heading: 'Why "atomic API update" and "instant traffic cutover" are two different claims',
      points: [
        'Kubernetes\' own docs describe a configurable `minSyncPeriod` for kube-proxy\'s iptables mode (default 1s): "The larger the value of minSyncPeriod, the more work that can be aggregated, but the downside is that each individual change may end up waiting up to the full minSyncPeriod before being processed, meaning that the iptables rules spend more time being out-of-sync with the current API server state." Every node runs its own kube-proxy, syncing on its own schedule — some nodes update their routing rules before others.',
        'The practical consequence for the main page\'s own Step 4: for a real (if usually brief) window after the `kubectl patch` command returns, some in-flight or newly-arriving requests can still be routed to blue on nodes whose kube-proxy hasn\'t synced yet, while requests hitting already-synced nodes reach green — a period of MIXED traffic, not the clean, all-or-nothing instant the main page\'s own comment implies.',
        'This does not make Blue/Green unsafe or wrong — it is still dramatically faster and lower-risk than a Rolling or Recreate strategy. It means the main page\'s own "Step 5: Monitor for 5 minutes" step is doing more real work than it looks like: that monitoring window has to cover this brief mixed-traffic period too, and a rollback in Step 5 has exactly the same "not instant either" property, for the same underlying reason.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'What "instant, atomic" actually refers to -- the API object, not every node\'s traffic',
      language: 'bash',
      code: `# Step 4 from the main page's own code tab:
kubectl patch service myapp -p '{"spec":{"selector":{"version":"green"}}}'
echo "Traffic now routing to green"

# What actually happens, in order:
#
# 1. The Service OBJECT in the Kubernetes API is updated -- this
#    part genuinely is atomic and near-instant (a single API write).
#
# 2. Every node running kube-proxy is WATCHING for this change --
#    per Kubernetes's own docs, each instance independently detects
#    the update and re-syncs its own local routing rules.
#
# 3. Per Kubernetes's own docs on kube-proxy's sync loop, this
#    re-sync isn't immediate on every node simultaneously -- with
#    the default iptables minSyncPeriod (1s), "each individual
#    change may end up waiting up to the full minSyncPeriod before
#    being processed."
#
# Result: node A might finish re-syncing in 200ms; node B might
# take almost a full second. During that gap, a request landing on
# node A already reaches green; the SAME request landing on node B
# a moment later could still reach blue.`,
    },
    {
      label: 'Why this matters for Step 5\'s monitoring window and any rollback',
      language: 'bash',
      code: `# Step 5 from the main page's own code tab:
sleep 300
ERROR_RATE=$(curl -s http://prometheus:9090/query --data-urlencode \\
  'query=rate(http_requests_total{status=~"5.."}[1m])' | jq '.data.result[0].value[1]')

if [ "$ERROR_RATE" -gt "0.05" ]; then
  echo "Error rate high — rolling back to blue"
  kubectl patch service myapp -p '{"spec":{"selector":{"version":"blue"}}}'
else
  echo "Green healthy — retiring blue"
  kubectl delete deployment myapp-blue
fi

# The main page's own comment calls Step 4 "instant, atomic" -- but
# per this subtopic's theory, the ROLLBACK patch in this same Step 5
# is the exact same kind of Service-selector patch, subject to the
# exact same node-by-node kube-proxy sync delay. "Rolling back to
# blue" is not instant either, for the identical underlying reason
# -- it just usually completes fast enough (well under a second,
# typically) that it reads as instant in practice.
#
# This is also why Step 5 waits a full 300 seconds before checking
# error rate at all -- that window has to be long enough to cover
# BOTH the brief mixed-traffic sync period AND enough real traffic
# on green to get a statistically meaningful error rate.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'Right after running the main page\'s own Step 4 patch command to switch traffic from blue to green, an engineer immediately curls the app 20 times in a tight loop and sees a couple of responses still coming from blue, even though `kubectl get service myapp -o yaml` already shows `selector: {version: green}`. They assume this means the patch command itself is buggy or the Service object update failed. Using this subtopic\'s theory, explain what is actually happening.',
    hint: 'Per this subtopic\'s theory, does the Service OBJECT updating in the API mean every node\'s ACTUAL routing rules have already updated too?',
    solution: 'The patch command and the Service object update are working correctly — `kubectl get service` already showing the new selector confirms the API-level change genuinely is atomic and near-instant, exactly as the main page\'s own comment describes. What the engineer is observing is the SEPARATE, second step: per this subtopic\'s theory, Kubernetes\'s own docs describe kube-proxy on each node independently watching for that Service change and re-syncing its own local routing rules on its own schedule, governed by a sync interval (default minSyncPeriod of 1s in iptables mode) — "each individual change may end up waiting up to the full minSyncPeriod before being processed." A handful of the engineer\'s 20 rapid requests likely landed on a node whose kube-proxy hadn\'t finished re-syncing yet, so they were still routed to blue for a brief window after the API object itself had already changed. This is expected, normal behavior, not a bug — it resolves within roughly a second in a typical cluster, which is exactly why the main page\'s own Step 5 waits a full 5 minutes before drawing any conclusions from the error rate.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'Since kubectl patch service completes almost immediately and the main page\'s own code tab calls the switch "instant, atomic," every request is guaranteed to hit the new (green) version the moment the command returns.',
      reality: 'Per this subtopic\'s theory, the "instant, atomic" part refers only to the Service OBJECT update in the Kubernetes API — per Kubernetes\'s own docs, each node\'s kube-proxy re-syncs its own routing rules on a separate schedule (a control loop with a configurable sync interval), so there is a brief, real window where some requests can still reach the old version after the patch command has already returned.'
    },
    {
      thought: 'A brief mixed-traffic window after a Service selector patch means Blue/Green deployments are unreliable or the tooling is broken.',
      reality: 'This subtopic\'s theory frames it as expected, normal Kubernetes behavior grounded in how kube-proxy\'s sync loop works — the window is typically well under a second in practice, and Blue/Green remains dramatically faster and safer than Rolling or Recreate strategies. The main page\'s own 5-minute monitoring window (Step 5) is generous enough to comfortably absorb it.'
    },
    {
      thought: 'The rollback step (switching the selector back to blue) is somehow more reliable or more instant than the original forward switch, since it\'s "just undoing" the change.',
      reality: 'This subtopic\'s second code example shows the rollback patch is the exact same kind of Service-selector update as the forward switch, going through the identical node-by-node kube-proxy sync process — it is not meaningfully faster or more instant, it just usually completes quickly enough that the difference is rarely noticeable.'
    }
  ];
}
