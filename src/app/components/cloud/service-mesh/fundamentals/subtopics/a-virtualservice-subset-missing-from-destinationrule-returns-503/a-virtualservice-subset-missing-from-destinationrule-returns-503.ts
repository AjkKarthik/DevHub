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
  templateUrl: './a-virtualservice-subset-missing-from-destinationrule-returns-503.html',
  styleUrl: './a-virtualservice-subset-missing-from-destinationrule-returns-503.scss'
})
export class AVirtualServiceSubsetMissingFromDestinationRuleReturns503Subtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page\'s own canary example pairs a VirtualService with a matching DestinationRule, without ever showing what happens if they drift apart',
      points: [
        'The main page\'s "Basic VirtualService" code example defines a VirtualService referencing subsets "stable" and "canary," paired with a DestinationRule that defines EXACTLY those two subsets. Every code sample keeps the two resources perfectly in sync — nothing shows what Istio does when a VirtualService references a subset name the DestinationRule doesn\'t actually define.',
      ]
    },
    {
      heading: 'What actually happens: no validation error, just a 503 at request time',
      points: [
        'Applying a VirtualService that references a subset name absent from its corresponding DestinationRule is NOT rejected by the Kubernetes API server or Istio\'s config validation — both resources apply successfully. The mismatch only surfaces when a real request tries to route through that specific subset, which then fails with a 503 Service Unavailable.',
        'This is one of the most common real-world Istio configuration errors precisely BECAUSE it fails silently at apply time — a typo in a subset name, or a DestinationRule update that renames a subset without updating every VirtualService referencing it, both produce a config state that looks completely valid until traffic actually hits the broken path.',
      ]
    },
    {
      heading: 'How to actually diagnose it: Envoy\'s response flags, not the Kubernetes/Istio config layer',
      points: [
        'The diagnostic signal lives in Envoy\'s own access logs, not in <code>kubectl</code> or <code>istioctl</code> config validation — look for response flags like <code>NR</code> (No Route) or <code>UH</code> (No Healthy Upstream) on the failing requests, then cross-check that the pods actually carry the labels the DestinationRule\'s subset selector expects.',
        'The practical discipline this implies: apply the DestinationRule (defining subsets) BEFORE the VirtualService that references them, and treat any subset rename in a DestinationRule as requiring an audit of every VirtualService that references the old name — Istio\'s control plane accepts either resource in any order, but the FUNCTIONAL dependency (subsets must exist before they\'re usefully referenced) is entirely on the operator to maintain correctly.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'The silent mismatch',
      language: 'bash',
      code: `# DestinationRule defines subsets "stable" and "canary"
apiVersion: networking.istio.io/v1beta1
kind: DestinationRule
metadata:
  name: payment-svc
spec:
  host: payment-svc
  subsets:
  - name: stable
    labels: { version: v1 }
  - name: canary
    labels: { version: v2 }

# VirtualService references a THIRD subset that was never
# defined -- a typo, or a subset renamed without updating this file
apiVersion: networking.istio.io/v1beta1
kind: VirtualService
metadata:
  name: payment-svc
spec:
  hosts: [payment-svc]
  http:
  - route:
    - destination:
        host: payment-svc
        subset: cannary   # typo -- should be "canary"
      weight: 10
    - destination:
        host: payment-svc
        subset: stable
      weight: 90

$ kubectl apply -f destinationrule.yaml   # Success
$ kubectl apply -f virtualservice.yaml    # ALSO succeeds --
# no error, no warning -- both resources are individually valid YAML/CRDs.`,
    },
    {
      label: 'Where it actually surfaces: request-time 503s',
      language: 'bash',
      code: `# The mismatch is invisible until traffic hits the "cannary" path
curl http://payment-svc/checkout
# HTTP/1.1 503 Service Unavailable   (roughly 10% of requests)

# Diagnose via Envoy access logs -- NOT kubectl/istioctl validation:
kubectl logs -n production payment-svc-7d9f8-xp2k7 -c istio-proxy | grep 503
# [...] "POST /checkout HTTP/1.1" 503 NR "-" 0 19 0 -
#   response_flags: "NR"  (No Route -- no matching subset endpoint)

# Confirm the actual subset names Istio knows about:
istioctl proxy-config cluster <pod-name>.<namespace> \\
  --fqdn payment-svc.production.svc.cluster.local -o json | grep subset
# Shows "stable" and "canary" only -- "cannary" was never a real target.

# Fix: correct the typo, re-apply the VirtualService --
# no DestinationRule change needed, since it was correct all along.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A team renames a DestinationRule subset from "canary" to "canary-v2" as part of a naming cleanup, applies the change, and sees no errors from kubectl or istioctl. A separate VirtualService in another file, still referencing the old "canary" name, was not updated. What happens on the next request routed to that subset, and how would the team actually discover the problem?',
    hint: 'Does Istio\'s config validation check that a VirtualService\'s subset references actually exist in a corresponding DestinationRule at apply time?',
    solution: 'Nothing breaks at apply time — both the renamed DestinationRule and the now-stale VirtualService apply successfully, since Istio\'s config validation does not cross-check that a VirtualService\'s subset references actually exist in any DestinationRule. The problem only surfaces when a real request is routed to the "canary" subset: Envoy has no matching cluster/endpoint for that name anymore and returns a 503, logged with a response_flags value like NR (No Route). The team would discover this by checking Envoy\'s own access logs on the affected pod for 503s with that response flag, then cross-referencing istioctl proxy-config cluster output to see which subset names Istio actually knows about — not by looking at kubectl apply output or any Istio config-validation step, since neither one catches this class of mismatch.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'Applying a VirtualService that references a subset name not defined in any DestinationRule will be rejected by Kubernetes or Istio\'s config validation, similar to how a genuinely malformed CRD is rejected.',
      reality: 'Per this subtopic\'s theory, both resources apply successfully with no error or warning — the VirtualService and DestinationRule are each independently valid YAML; Istio does not cross-validate that referenced subset names actually exist anywhere.'
    },
    {
      thought: 'If a subset mismatch between a VirtualService and DestinationRule exists, the correct place to look for the error is kubectl describe or istioctl analyze output on the resources themselves.',
      reality: 'Per this subtopic\'s theory, the actual diagnostic signal lives in Envoy\'s own access logs (response flags like NR or UH) on the affected pod, surfacing only when real traffic hits the broken path — not in the Kubernetes/Istio config layer at all.'
    },
    {
      thought: 'Since Istio accepts a DestinationRule and VirtualService in either order, the order they\'re applied in has no functional significance.',
      reality: 'Per this subtopic\'s theory, while Istio\'s control plane accepts either order without error, the FUNCTIONAL dependency (a subset must exist for a reference to it to actually route traffic) means applying the DestinationRule first, and auditing every VirtualService reference whenever a subset is renamed, is still the correct operational discipline.'
    }
  ];
}
