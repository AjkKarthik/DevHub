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
  templateUrl: './long-lived-connections-outlive-dead-pods.html',
  styleUrl: './long-lived-connections-outlive-dead-pods.scss'
})
export class LongLivedConnectionsOutliveDeadPodsSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The page frames K8s Service discovery as fully transparent — one real case where it isn\'t',
      points: [
        'The page\'s "Kubernetes / .NET Aspire" codeTab comment says: "K8s Service load-balances across healthy pods automatically" — true for NEW connections, but there\'s a specific, well-documented gap for connections that are already OPEN when a backend pod disappears.',
        'Verified via research into kube-proxy\'s own documented behavior: in the common iptables (and IPVS) proxy modes, kube-proxy\'s rules control where NEW connections get routed. An ALREADY-ESTABLISHED TCP connection is tracked by the Linux kernel\'s connection tracker (conntrack), which keeps routing packets for that specific connection to the SAME backend pod IP it originally connected to — even after that pod is removed from the Service\'s endpoint list.',
        'Concretely: if <code>order-service</code> holds a keep-alive HTTP connection to a specific <code>catalog-service</code> pod, and that pod is deleted (scaled down, rescheduled, crashed) while the connection is still open, requests on that SAME connection can keep failing or hanging — even though CoreDNS and kube-proxy have both already, correctly, stopped directing NEW connections to the dead pod.',
      ]
    },
    {
      heading: 'Why this specifically matters for the page\'s own "just call fetch() with a stable name" framing',
      points: [
        'Modern HTTP clients (including the <code>fetch</code>-based examples this page\'s own codeTabs use) commonly reuse TCP connections via HTTP keep-alive by default, precisely for performance — which is exactly the condition that exposes this gap. A client making a fresh connection on every single request would sidestep the issue, at the cost of extra TCP/TLS handshake overhead per call.',
        'The practical mitigations: client-side retry logic that treats a failed request as a signal to establish a NEW connection (most HTTP client libraries do this automatically on a connection-reset error, but it\'s worth confirming, not assuming); bounding how long a single connection is kept alive (a max connection age or idle timeout) so a pod\'s eventual removal can\'t pin a client to it indefinitely; and, at the infrastructure level, a service mesh\'s sidecar proxies can actively terminate connections to draining/removed pods rather than leaving it to conntrack and client-side retry alone.',
        'This is a real, specific gap in an otherwise accurate claim — not a reason to distrust Kubernetes Service discovery generally, but a genuine edge case worth knowing before assuming "the Service abstraction handles everything transparently" covers every scenario, including long-lived connections.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'What kube-proxy\'s routing rules do and don\'t cover',
      language: 'typescript',
      code: `// The page's own codeTab, annotated with what actually happens over time
const CATALOG_URL = process.env.CATALOG_SERVICE_URL ?? 'http://catalog-service:8081';

// T=0: order-service makes its FIRST request. kube-proxy's current iptables/
// IPVS rules pick a healthy backend pod (say, catalog-pod-A) for this
// connection. With HTTP keep-alive (the fetch() default in most runtimes),
// this TCP connection to catalog-pod-A stays open for reuse.
const first = await fetch(\`\${CATALOG_URL}/api/products/1\`);

// T=30s: catalog-pod-A is deleted (scaled down / rescheduled / crashed).
// kube-proxy correctly updates its rules so any NEW connection to
// catalog-service will route to a DIFFERENT, healthy pod.
//
// BUT: the conntrack entry for order-service's EXISTING connection to
// catalog-pod-A's specific IP is untouched by that rule update -- Linux
// keeps routing packets on that already-established connection to the
// now-dead pod's address.

// T=31s: order-service reuses the SAME keep-alive connection for its next
// call -- it does NOT re-resolve or re-select a backend, because the
// connection is already open:
const second = await fetch(\`\${CATALOG_URL}/api/products/2\`);
// This can hang or fail, even though catalog-service has other healthy
// pods RIGHT NOW -- the client is pinned to the specific dead pod its
// open connection was already routed to.

// Mitigation: client-side retry on connection failure (opens a NEW
// connection, which correctly gets routed to a live pod), and/or bounding
// keep-alive connection lifetime so pods can't be pinned to indefinitely.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A team notices intermittent connection failures calling catalog-service, correlating with catalog-service pod rollouts (rolling updates). Their HTTP client has keep-alive enabled with no retry-on-connection-failure logic and no max connection lifetime configured. CoreDNS and kube-proxy both show correct, up-to-date routing information at the time of each failure. What\'s the most likely explanation?',
    hint: 'The routing information being CORRECT doesn\'t mean every individual client connection is currently using it -- an already-open connection doesn\'t re-consult the routing rules.',
    solution: 'The most likely explanation is exactly this subtopic\'s gap: some of the client\'s open keep-alive connections were established to specific catalog-service pods that have since been replaced by the rolling update. kube-proxy\'s routing rules ARE correct for new connections (matching what CoreDNS/kube-proxy show), but the client\'s already-open connections are pinned via conntrack to pod IPs that no longer exist. Without retry-on-connection-failure (to force a new connection) or a bounded connection lifetime (to periodically force reconnection), those specific connections keep failing until something closes them -- which is consistent with "intermittent failures correlating with rollouts" while the routing infrastructure itself reports healthy.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'If kube-proxy and CoreDNS both show correct, up-to-date routing to healthy pods, then every client request will actually reach a healthy pod.',
      reality: 'Per this subtopic\'s theory, that guarantee only applies to NEW connections — an already-open, kept-alive connection is tracked separately by the kernel\'s conntrack and keeps routing to its original backend pod regardless of subsequent routing-rule updates.'
    },
    {
      thought: 'HTTP keep-alive is purely a performance optimization with no interaction with how Kubernetes Service discovery actually behaves.',
      reality: 'Per this subtopic\'s theory, keep-alive is specifically what creates the exposure — a client that opened a fresh connection on every request would never hit this gap, at the cost of extra handshake overhead per call.'
    },
    {
      thought: 'This is a flaw in Kubernetes\' Service abstraction that makes "just call the stable DNS name" bad advice in general.',
      reality: 'Per this subtopic\'s theory, the Service abstraction and its DNS name remain correct and reliable for the vast majority of request patterns — this is a specific, known edge case for long-lived connections, addressed by well-understood mitigations (retry-on-failure, bounded connection lifetime), not a reason to distrust the underlying mechanism generally.'
    }
  ];
}
