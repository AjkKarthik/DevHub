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
  templateUrl: './networkpolicy-silently-does-nothing-without-a-cni-that-enforces-it.html',
  styleUrl: './networkpolicy-silently-does-nothing-without-a-cni-that-enforces-it.scss'
})
export class NetworkpolicySilentlyDoesNothingWithoutACniThatEnforcesItSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page\'s own mistake fix presents applying a default-deny NetworkPolicy as a complete solution',
      points: [
        'The main page\'s own "Not applying a default-deny NetworkPolicy" mistake entry frames the fix simply: apply the manifest, and pod-to-pod traffic is now restricted. Nothing in that entry, or the "wrong"/"right" code snippets, mentions any prerequisite the cluster itself must satisfy for that manifest to have any effect at all.',
        'This hub\'s own earlier "Services & Ingress" subtopic batch already established the closely analogous pattern for Ingress — "an Ingress resource is just configuration... without an Ingress controller running in the cluster, nothing acts on them" — but the main page\'s own NetworkPolicy content never draws the same connection for NetworkPolicy objects, even though the exact same structural gap applies.',
      ]
    },
    {
      heading: 'What actually enforces NetworkPolicy: the CNI plugin — and many common ones don\'t',
      points: [
        'Per Kubernetes\' own documentation, "Network policies are implemented by the network plugin. To use network policies, you must be using a networking solution which supports NetworkPolicy... Creating a NetworkPolicy resource without a controller that implements it will have no effect." Kubernetes\' own API server accepts, stores, and validates NetworkPolicy objects unconditionally — it has no built-in awareness of whether anything in the cluster will actually act on them.',
        'Several genuinely common CNI plugins do NOT enforce NetworkPolicy at all — standard Flannel is the most cited example, since it is a pure overlay networking plugin with no policy engine built in. A cluster running an unsupported CNI accepts `kubectl apply -f default-deny.yaml` without any error, and `kubectl get networkpolicy` shows the object exists — but every Pod-to-Pod connection continues to succeed exactly as before, with zero actual restriction and no warning anywhere in the system.',
        'This produces a specifically dangerous outcome: unlike a missing Ingress controller (where the ADDRESS column staying empty is a highly visible, easy-to-notice signal that nothing is happening), an unenforced NetworkPolicy gives no comparable visible signal at all — the policy LOOKS successfully applied, and a team that tested "can pod A still reach pod B, as expected" after applying an allow-list rule would see exactly the traffic they expected to see, with no way to distinguish "the policy correctly allowed this" from "nothing is enforcing anything, so of course it still works."',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'The main page\'s own default-deny policy, applied to an unsupported CNI',
      language: 'bash',
      code: `# The main page's own exact fix, from its own mistake entry:
kubectl apply -f - <<EOF
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: default-deny-ingress
  namespace: production
spec:
  podSelector: {}
  policyTypes: [Ingress]
EOF
# networkpolicy.networking.k8s.io/default-deny-ingress created
# -- no error. No warning. Looks completely successful.

kubectl get networkpolicy -n production
# NAME                   POD-SELECTOR   AGE
# default-deny-ingress   <none>         12s
# -- the object genuinely exists in etcd and the API server

# On a cluster running plain Flannel (no NetworkPolicy support):
kubectl exec compromised-frontend -n production -- curl -s -o /dev/null -w "%{http_code}" http://database:5432
# 200
# -- STILL succeeds. The "default deny ALL ingress" policy that
#    should have blocked this connection entirely has zero effect,
#    because nothing in the cluster's networking stack is watching
#    for or acting on NetworkPolicy objects at all.`,
    },
    {
      label: 'How to actually know whether NetworkPolicy is enforced at all',
      language: 'bash',
      code: `# Kubernetes provides NO API-level signal distinguishing "policy
# applied and enforced" from "policy applied and silently ignored"
# -- unlike Ingress's own visible "ADDRESS column stays empty"
# signal, there is nothing comparable to check via kubectl alone.

# Check which CNI the cluster is actually running:
kubectl get pods -n kube-system -o wide | grep -Ei "flannel|calico|cilium|weave|antrea"
# kube-flannel-ds-abc12   1/1   Running   ...   <- Flannel: does NOT
#                                                   enforce NetworkPolicy

# The only reliable way to KNOW enforcement is real: run an actual
# empirical test, not just "apply and assume":
#   1. Confirm two Pods CAN reach each other with no policy applied.
#   2. Apply a policy that should explicitly BLOCK that connection.
#   3. Re-test the SAME connection -- if it still succeeds, the CNI
#      is not enforcing NetworkPolicy at all, regardless of how
#      correct the policy manifest itself looks.

# The fix is switching to (or adding) a CNI that DOES implement
# NetworkPolicy enforcement -- Calico, Cilium, Weave Net, and Antrea
# are the commonly cited ones -- BEFORE relying on any NetworkPolicy
# object for actual security, not after discovering the gap in
# production via an incident.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'Following the main page\'s own mistake-entry fix exactly, a team applies a default-deny-ingress NetworkPolicy to their production namespace, then writes an explicit allow-list rule permitting their frontend to reach their database. They test it: the frontend can reach the database, and they conclude the policy is "working as designed." Using this subtopic\'s theory, is that test sufficient to confirm the policy is actually being enforced?',
    hint: 'What would the SAME test (frontend successfully reaching database) look like on a cluster where NetworkPolicy is not enforced by the CNI at all — completely unrelated to whether the allow-list rule is even correct?',
    solution: 'No — per this subtopic\'s theory, this test cannot distinguish "the policy is correctly enforced and the allow-list rule is working" from "nothing is enforcing NetworkPolicy at all, so the connection was never actually going to be blocked in the first place." Both scenarios produce the IDENTICAL observable result: the frontend successfully reaches the database. Since Kubernetes\' own API server accepts and stores NetworkPolicy objects unconditionally, with no built-in signal indicating whether any CNI is actually watching and enforcing them, a positive "expected traffic still works" test proves nothing about enforcement — only a NEGATIVE test does: attempting a connection the policy is supposed to explicitly BLOCK (e.g., a Pod with no allow-list rule trying to reach the database directly) and confirming that connection actually FAILS. If it still succeeds, the CNI is not enforcing NetworkPolicy at all, regardless of how correct the policy\'s own YAML looks — this is exactly the kind of test the team\'s "frontend can reach database" check never performed.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'Since kubectl apply on a NetworkPolicy manifest succeeds with no error, and kubectl get networkpolicy shows the object exists, that confirms the policy is actively restricting traffic in the cluster.',
      reality: 'Per this subtopic\'s theory, the Kubernetes API server accepts and stores NetworkPolicy objects completely independent of whether anything actually enforces them — a successful kubectl apply only confirms the object is valid and stored, never that any CNI plugin is watching or acting on it.'
    },
    {
      thought: 'Testing that expected, allowed traffic (like a frontend reaching its own database, per an explicit allow-list rule) still works after applying a NetworkPolicy is sufficient proof the policy is being enforced correctly.',
      reality: 'Per this subtopic\'s exercise, this positive test is indistinguishable from a completely unenforced NetworkPolicy — both produce identical results. Only testing that traffic the policy should explicitly BLOCK actually fails can confirm real enforcement.'
    },
    {
      thought: 'Every standard Kubernetes networking setup enforces NetworkPolicy by default, the same way every setup provides basic Pod-to-Pod connectivity — it\'s a core, universal cluster networking feature.',
      reality: 'Per this subtopic\'s theory, NetworkPolicy enforcement is NOT universal — plain Flannel, a widely-used CNI, provides Pod networking but has no NetworkPolicy enforcement at all. Enforcement depends entirely on which specific CNI plugin a cluster runs (Calico, Cilium, Weave Net, and Antrea are commonly cited as supporting it).'
    }
  ];
}
