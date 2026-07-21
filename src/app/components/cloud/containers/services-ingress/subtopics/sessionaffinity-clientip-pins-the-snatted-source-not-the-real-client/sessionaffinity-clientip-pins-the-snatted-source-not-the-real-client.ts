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
  templateUrl: './sessionaffinity-clientip-pins-the-snatted-source-not-the-real-client.html',
  styleUrl: './sessionaffinity-clientip-pins-the-snatted-source-not-the-real-client.scss'
})
export class SessionaffinityClientipPinsTheSnattedSourceNotTheRealClientSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page\'s own QnA describes sessionAffinity: ClientIP as pinning "the client\'s IP" without saying which IP that is',
      points: [
        'The main page\'s own QnA answer says sessionAffinity: ClientIP "pins a client to the same Pod for all requests within the affinity timeout... based on the client\'s IP." That phrasing implicitly assumes kube-proxy always sees the REAL, original client IP address.',
        'The main page\'s own theory section covers NodePort and LoadBalancer Service types in detail — how external traffic reaches nodeIP:nodePort or a cloud LB — but never once mentions what happens to the CLIENT\'S OWN source IP address on the way in, or that this depends on a completely separate field, `externalTrafficPolicy`, which the main page doesn\'t mention at all.',
      ]
    },
    {
      heading: 'What actually happens: default Cluster traffic policy SNATs external traffic, replacing the real client IP',
      points: [
        'Per Kubernetes\' own "Using Source IP" documentation, Services of type NodePort or LoadBalancer default to `externalTrafficPolicy: Cluster` — under this policy, kube-proxy may forward an external request to a Pod on ANY node (for even load distribution), and to do that correctly it performs Source NAT (SNAT), REPLACING the real client\'s source IP with the RECEIVING NODE\'S OWN IP before the packet reaches the Pod.',
        'This means sessionAffinity: ClientIP, under the default Cluster policy, is not actually grouping by each individual external client\'s own IP — it\'s grouping by whichever cluster NODE that client\'s traffic happened to land on. If a cloud load balancer spreads thousands of distinct real clients across only a handful of nodes, kube-proxy — and therefore sessionAffinity — sees only that handful of node IPs, pinning potentially thousands of unrelated clients onto the SAME small set of backend Pods.',
        'The documented fix is `externalTrafficPolicy: Local` — kube-proxy then only forwards to Pods on the SAME node the packet physically arrived on (never routing across nodes), which avoids the extra hop and therefore avoids the SNAT rewrite, preserving the real client IP. The tradeoff, also undocumented on the main page: traffic distribution becomes uneven, since only nodes that happen to be running a matching Pod receive any external traffic at all — nodes without one get zero, regardless of the load balancer\'s own distribution.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Default Cluster policy: sessionAffinity sees the NODE, not the client',
      language: 'bash',
      code: `# The main page's own LoadBalancer Service, with sessionAffinity added
# and NO explicit externalTrafficPolicy (defaults to "Cluster"):

# apiVersion: v1
# kind: Service
# metadata:
#   name: api-lb
# spec:
#   selector: { app: api }
#   sessionAffinity: ClientIP
#   ports:
#     - port: 443
#       targetPort: 3000
#   type: LoadBalancer
#   # externalTrafficPolicy: Cluster   <- the default, left unset here

# Three DIFFERENT real users (203.0.113.5, 203.0.113.9, 198.51.100.2)
# all happen to have their LB connections routed to the same node,
# node-2, by the cloud load balancer's own outer routing:

kubectl exec -it api-pod-abc -- printenv | grep REMOTE_ADDR
# REMOTE_ADDR=10.244.2.1   <- node-2's own internal IP, NOT any of
#                             the three real users' own public IPs

# Because kube-proxy SNAT'd all three connections to look like they
# came from node-2, sessionAffinity: ClientIP treats all three
# DIFFERENT real users as ONE indistinguishable "client" -- pinning
# all of them onto whichever single Pod first got node-2's traffic.`,
    },
    {
      label: 'externalTrafficPolicy: Local restores the real client IP',
      language: 'bash',
      code: `# apiVersion: v1
# kind: Service
# metadata:
#   name: api-lb
# spec:
#   selector: { app: api }
#   sessionAffinity: ClientIP
#   externalTrafficPolicy: Local        # <- the fix
#   ports:
#     - port: 443
#       targetPort: 3000
#   type: LoadBalancer

# Now kube-proxy on each node ONLY forwards to a Pod running on
# THAT SAME node -- never routing cross-node -- so no SNAT rewrite
# happens, and the Pod sees each real client's own IP:

kubectl exec -it api-pod-abc -- printenv | grep REMOTE_ADDR
# REMOTE_ADDR=203.0.113.5   <- the real user's own public IP, this time

# sessionAffinity: ClientIP now genuinely pins EACH real user to
# their own consistent Pod, as the main page's own QnA phrasing
# implies -- but at the cost of uneven distribution: any node with
# NO matching Pod at all now receives zero external traffic, even
# if the cloud LB would otherwise have sent it some.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A team enables <code>sessionAffinity: ClientIP</code> on their public-facing LoadBalancer Service (left at the default <code>externalTrafficPolicy</code>) to keep each user pinned to the same backend Pod for an in-memory per-user cache. In production, they observe that thousands of distinct real users all seem to be landing on just two or three backend Pods, completely defeating the purpose of running ten replicas. Using this subtopic\'s theory, why does this happen?',
    hint: 'What IP does kube-proxy actually see for external LoadBalancer traffic under the DEFAULT <code>externalTrafficPolicy</code> — the real client\'s, or something else? How many distinct values of that "something else" are there, compared to the number of real users?',
    solution: 'Per this subtopic\'s theory, this happens because the Service was left at the default externalTrafficPolicy: Cluster, under which kube-proxy performs SNAT on incoming external traffic — replacing each real client\'s own source IP with the IP of whichever NODE received that connection, before the packet reaches any Pod. sessionAffinity: ClientIP groups strictly by the IP kube-proxy actually sees, which under this default is the small set of NODE IPs, not the much larger set of real user IPs. With a cluster of only a handful of nodes, thousands of distinct real users collapse down into just a handful of distinguishable "clients" from sessionAffinity\'s point of view, all pinned onto whichever few backend Pods happened to receive each node\'s traffic first — exactly the "only two or three Pods" symptom described. The fix is setting externalTrafficPolicy: Local on the Service, which keeps kube-proxy from routing across nodes (avoiding the SNAT rewrite) so the real client IP reaches the Pod, restoring per-user session affinity as intended — at the cost of uneven traffic distribution across nodes that don\'t have a matching Pod locally.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'The main page\'s own <code>sessionAffinity: ClientIP</code> field always pins each individual external user to their own dedicated backend Pod, exactly as its name suggests.',
      reality: 'Per this subtopic\'s theory, this is only true when kube-proxy actually sees the real client\'s IP. Under the DEFAULT externalTrafficPolicy: Cluster, external NodePort/LoadBalancer traffic is SNAT\'d, so sessionAffinity ends up grouping by receiving-node IP, not real client IP, unless externalTrafficPolicy: Local is explicitly set.'
    },
    {
      thought: 'externalTrafficPolicy: Local is a strictly-better setting that should always be turned on for any externally-facing Service, since it preserves the real client IP.',
      reality: 'Per this subtopic\'s theory, Local sacrifices even load distribution as a direct tradeoff — kube-proxy refuses to route across nodes, so any node without a locally-running matching Pod receives zero external traffic at all, regardless of how the cloud load balancer itself would have distributed it.'
    },
    {
      thought: 'The SNAT rewrite that masks the real client IP under externalTrafficPolicy: Cluster affects all traffic in the cluster, including ordinary Pod-to-Pod calls through a ClusterIP Service.',
      reality: 'Per this subtopic\'s theory, this SNAT behavior is specific to the EXTERNAL entry path for NodePort and LoadBalancer Services under the default Cluster traffic policy — internal ClusterIP traffic between Pods is not affected by this masking at all.'
    }
  ];
}
