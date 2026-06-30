import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { PageMetaComponent } from '../../../shared/page-meta/page-meta';
import { QuickRefComponent, QuickRefItem } from '../../../shared/quick-ref/quick-ref';
import { TheoryBlockComponent, TheoryPoint } from '../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../shared/code-block/code-block';
import { CommonMistakesComponent, CommonMistake } from '../../../shared/common-mistakes/common-mistakes';
import { ChallengeBlockComponent, Challenge } from '../../../shared/challenge-block/challenge-block';
import { QuizBlockComponent, QuizQuestion } from '../../../shared/quiz-block/quiz-block';
import { QnaBlockComponent, QnaItem } from '../../../shared/qna-block/qna-block';
import { RevisionCardComponent, RevisionSummary } from '../../../shared/revision-card/revision-card';
import { PageCompleteComponent } from '../../../shared/page-complete/page-complete';

const quickRef: QuickRefItem[] = [
  { name: 'ClusterIP', type: 'keyword', desc: 'Internal VIP — accessible only within the cluster (default type)' },
  { name: 'NodePort', type: 'keyword', desc: 'Exposes service on each node\'s IP at a static port 30000–32767' },
  { name: 'LoadBalancer', type: 'keyword', desc: 'Provisions a cloud load balancer with a public IP (cloud only)' },
  { name: 'ExternalName', type: 'keyword', desc: 'CNAME alias to an external DNS name — no proxying' },
  { name: 'Ingress', type: 'class', desc: 'HTTP/S routing rules — host/path → Service; handles TLS termination' },
  { name: 'IngressClass', type: 'class', desc: 'Selects which Ingress controller handles an Ingress resource' },
  { name: 'selector:', type: 'keyword', desc: 'Label selector that links a Service to its Pod endpoints' },
  { name: 'targetPort', type: 'keyword', desc: 'Container port the Service proxies to (can differ from port)' },
];

const theory: TheoryPoint[] = [
  {
    heading: 'Service Types',
    points: [
      'ClusterIP (default): assigns a virtual IP inside the cluster — Pods reach each other by service name via DNS.',
      'NodePort: opens a port on every node\'s IP — external traffic hits <node-ip>:<nodePort>. Use for dev/testing.',
      'LoadBalancer: extends NodePort and requests a cloud LB from the provider (AWS ALB/NLB, GCP LB). Gets a stable external IP.',
      'ExternalName: maps a Service to an external DNS name via CNAME — useful for migrating services into the cluster.',
      'Headless Service (clusterIP: None): no VIP — DNS returns Pod IPs directly. Used by StatefulSets for peer discovery.',
    ],
  },
  {
    heading: 'How Services Route Traffic',
    points: [
      'A Service has a selector that matches Pod labels — matched Pods become Endpoints.',
      'kube-proxy on each node programs iptables/IPVS rules so the ClusterIP virtual IP routes to Endpoint IPs.',
      'Traffic is load-balanced across all healthy (ready) Endpoints — readinessProbe removes unready Pods.',
      'Services provide stable DNS: <service>.<namespace>.svc.cluster.local (or just <service> within the namespace).',
      'sessionAffinity: ClientIP pins a client to the same Pod for the duration of affinity timeout (3h default).',
    ],
  },
  {
    heading: 'Ingress — HTTP Routing',
    points: [
      'Ingress defines HTTP/S routing rules: host + path → Service. A single LoadBalancer IP can route to many services.',
      'Ingress requires an Ingress controller (NGINX, Traefik, AWS ALB Ingress Controller) to actually implement the rules.',
      'TLS termination: reference a Secret with tls.crt and tls.key; the controller handles HTTPS for you.',
      'Path types: Prefix (/api matches /api/users), Exact (/api matches only /api), ImplementationSpecific.',
      'Annotations customise behaviour per controller: nginx.ingress.kubernetes.io/rewrite-target, rate limits, etc.',
    ],
  },
  {
    heading: 'Gateway API — The Future of Ingress',
    points: [
      'Gateway API (GA in K8s 1.28) replaces Ingress with a richer, role-oriented model.',
      'GatewayClass → Gateway → HTTPRoute: separates infrastructure (Gateway) from app routing (HTTPRoute).',
      'Supports traffic splitting (canary), header-based routing, and TCP/UDP — things Ingress cannot express natively.',
      'Most major controllers (NGINX, Istio, Envoy Gateway) now support Gateway API.',
      'Ingress still works and will not be removed, but new projects should prefer Gateway API.',
    ],
  },
];

const codeTabs: CodeTab[] = [
  {
    label: 'Service types',
    language: 'bash',
    code: '# ClusterIP — internal only (default)\napiVersion: v1\nkind: Service\nmetadata:\n  name: api\n  namespace: production\nspec:\n  selector:\n    app: api\n  ports:\n    - port: 80          # Service port (what callers use)\n      targetPort: 3000  # Container port\n  type: ClusterIP\n\n---\n# NodePort — external via node IP:nodePort\napiVersion: v1\nkind: Service\nmetadata:\n  name: api-nodeport\nspec:\n  selector: { app: api }\n  ports:\n    - port: 80\n      targetPort: 3000\n      nodePort: 30080   # 30000-32767; omit to auto-assign\n  type: NodePort\n\n---\n# LoadBalancer — cloud LB with external IP\napiVersion: v1\nkind: Service\nmetadata:\n  name: api-lb\nspec:\n  selector: { app: api }\n  ports:\n    - port: 443\n      targetPort: 3000\n  type: LoadBalancer',
  },
  {
    label: 'Ingress + TLS',
    language: 'bash',
    code: '# Create TLS secret first:\n# kubectl create secret tls api-tls \\\n#   --cert=tls.crt --key=tls.key -n production\n\napiVersion: networking.k8s.io/v1\nkind: Ingress\nmetadata:\n  name: api-ingress\n  namespace: production\n  annotations:\n    nginx.ingress.kubernetes.io/rewrite-target: /\n    nginx.ingress.kubernetes.io/proxy-body-size: 10m\nspec:\n  ingressClassName: nginx\n  tls:\n    - hosts: [api.example.com]\n      secretName: api-tls\n  rules:\n    - host: api.example.com\n      http:\n        paths:\n          - path: /api\n            pathType: Prefix\n            backend:\n              service:\n                name: api\n                port: { number: 80 }\n          - path: /static\n            pathType: Prefix\n            backend:\n              service:\n                name: web\n                port: { number: 80 }',
  },
  {
    label: 'Gateway API (HTTPRoute)',
    language: 'bash',
    code: '# Gateway API — richer HTTP routing (K8s 1.28+ GA)\napiVersion: gateway.networking.k8s.io/v1\nkind: HTTPRoute\nmetadata:\n  name: api-route\n  namespace: production\nspec:\n  parentRefs:\n    - name: prod-gateway    # References a Gateway resource\n  hostnames: [api.example.com]\n  rules:\n    # Canary: 10% to v2, 90% to v1\n    - matches:\n        - path: { type: PathPrefix, value: /api }\n      backendRefs:\n        - name: api-v1\n          port: 80\n          weight: 90\n        - name: api-v2\n          port: 80\n          weight: 10\n\n    # Header-based routing\n    - matches:\n        - headers:\n            - name: X-Beta-User\n              value: "true"\n      backendRefs:\n        - name: api-v2\n          port: 80',
  },
];

const mistakes: CommonMistake[] = [
  {
    title: 'Selector mismatch between Service and Deployment',
    wrong: '# Deployment: labels: { app: my-api }\n# Service selector: { app: api }   ← typo\n# Result: Service has no Endpoints — connection refused',
    right: '# Both must match exactly:\n# Deployment template labels: { app: api }\n# Service selector:           { app: api }',
    explanation: 'If the Service selector doesn\'t match any Pod labels, the Endpoints object is empty and all traffic returns "connection refused". Run kubectl get endpoints <service-name> to verify Pods are listed as endpoints.',
  },
  {
    title: 'Using NodePort in production without a load balancer in front',
    wrong: '# NodePort: clients hit node1-ip:30080 directly\n# If node1 goes down, clients get no traffic',
    right: '# Use LoadBalancer type (cloud) or Ingress\n# NodePort is fine for dev/CI but not for production HA',
    explanation: 'NodePort ties clients to a specific node IP. If that node fails or scales down, traffic breaks. In production, put a LoadBalancer (cloud LB or MetalLB) or Ingress in front so traffic is routed around failed nodes.',
  },
  {
    title: 'Forgetting to install an Ingress controller before creating Ingress resources',
    wrong: '# kubectl apply -f ingress.yaml\n# kubectl get ingress — ADDRESS column is empty, no traffic',
    right: '# Install a controller first:\n# helm install ingress-nginx ingress-nginx/ingress-nginx\n# Then apply Ingress resources',
    explanation: 'Ingress resources are just configuration — without an Ingress controller running in the cluster, nothing acts on them. The ADDRESS column in kubectl get ingress stays empty. Install NGINX Ingress Controller, Traefik, or a cloud-specific controller first.',
  },
  {
    title: 'Using the same port for port and targetPort with wrong assumption',
    wrong: 'ports:\n  - port: 80\n    targetPort: 80   # app actually listens on 3000\n# Result: 502 Bad Gateway',
    right: 'ports:\n  - port: 80        # what callers use\n    targetPort: 3000 # what the container listens on',
    explanation: 'port is what clients (or the load balancer) connect to on the Service. targetPort is the port your container actually listens on. They don\'t have to match. Always check what port your app listens on and set targetPort accordingly.',
  },
  {
    title: 'Mixing path types Prefix and Exact incorrectly',
    wrong: '# path: /api, pathType: Exact\n# Expects: only /api matches\n# /api/users returns 404',
    right: '# For subtrees use Prefix:\npath: /api\npathType: Prefix  # matches /api, /api/users, /api/v2/...',
    explanation: 'Exact pathType only matches the exact path string. If your service handles multiple paths under a prefix (like /api/*), use Prefix. Using Exact for an API gateway means every sub-path needs its own Ingress rule.',
  },
];

const challenge: Challenge = {
  title: 'Service Endpoint Validator',
  language: 'typescript',
  description: 'Write a function that takes a Service spec (selector labels) and a list of Pods (name + labels + ready status), and returns which Pods would be in the Service\'s Endpoints list. A Pod is an endpoint if: its labels match all selector labels AND its readiness is true.',
  hints: [
    'For each Pod, check that every key-value in the selector exists in the Pod\'s labels',
    'Also check that the Pod\'s ready field is true',
    'Return matching pod names as the active endpoints',
    'Return non-matching pods with a reason (label mismatch or not ready)',
    'Use Object.entries(selector).every(...) for the label check',
  ],
  starterCode: 'interface PodInfo {\n  name: string;\n  labels: Record<string, string>;\n  ready: boolean;\n}\n\ninterface EndpointResult {\n  endpoints: string[];\n  excluded: Array<{ pod: string; reason: string }>;\n}\n\nfunction resolveEndpoints(\n  selector: Record<string, string>,\n  pods: PodInfo[]\n): EndpointResult {\n  const endpoints: string[] = [];\n  const excluded: Array<{ pod: string; reason: string }> = [];\n  // TODO: match selector to pod labels and readiness\n  return { endpoints, excluded };\n}',
  solution: 'interface PodInfo {\n  name: string;\n  labels: Record<string, string>;\n  ready: boolean;\n}\n\ninterface EndpointResult {\n  endpoints: string[];\n  excluded: Array<{ pod: string; reason: string }>;\n}\n\nfunction resolveEndpoints(\n  selector: Record<string, string>,\n  pods: PodInfo[]\n): EndpointResult {\n  const endpoints: string[] = [];\n  const excluded: Array<{ pod: string; reason: string }> = [];\n\n  for (const pod of pods) {\n    const labelsMatch = Object.entries(selector).every(\n      ([k, v]) => pod.labels[k] === v\n    );\n\n    if (!labelsMatch) {\n      excluded.push({ pod: pod.name, reason: \'label selector mismatch\' });\n    } else if (!pod.ready) {\n      excluded.push({ pod: pod.name, reason: \'readinessProbe not passing\' });\n    } else {\n      endpoints.push(pod.name);\n    }\n  }\n\n  return { endpoints, excluded };\n}',
};

const quiz: QuizQuestion[] = [
  {
    q: 'Which Service type provisions a cloud load balancer with a public IP?',
    options: [
      'ClusterIP',
      'NodePort',
      'LoadBalancer',
      'ExternalName',
    ],
    answer: 2,
    explanation: 'LoadBalancer type extends NodePort and asks the cloud provider (AWS, GCP, Azure) to provision a load balancer. The cloud LB gets a stable external IP and forwards traffic to NodePorts on cluster nodes. Without a cloud provider, the EXTERNAL-IP column stays Pending.',
  },
  {
    q: 'What happens if a Service\'s selector matches no Pod labels?',
    options: [
      'Kubernetes creates the Pods automatically to match the selector',
      'The Service\'s Endpoints object is empty — connections to the Service fail',
      'The Service routes traffic to all Pods in the namespace',
      'Kubernetes throws a validation error and rejects the Service',
    ],
    answer: 1,
    explanation: 'The Service\'s Endpoints object (auto-created by the Endpoints controller) lists only Pods that match the selector AND are ready. With no matches, Endpoints is empty and connections return "connection refused". Check with kubectl get endpoints <service-name>.',
  },
  {
    q: 'What does an Ingress resource do without an Ingress controller installed?',
    options: [
      'Routes traffic using kube-proxy\'s built-in HTTP routing',
      'Nothing — the Ingress resource sits in etcd but no traffic is routed',
      'Falls back to NodePort routing automatically',
      'Routes traffic using the default Kubernetes gateway',
    ],
    answer: 1,
    explanation: 'An Ingress resource is just configuration. Without a controller (NGINX, Traefik, ALB Ingress, etc.) watching for Ingress objects and programming the actual load balancer, no routing happens. The ADDRESS column in kubectl get ingress remains empty.',
  },
  {
    q: 'What is a Headless Service (clusterIP: None) used for?',
    options: [
      'Exposing services outside the cluster without a load balancer',
      'Returning Pod IPs directly from DNS instead of a virtual IP — used for stateful peer discovery',
      'Disabling the service so no traffic is routed',
      'Routing traffic to external services outside the cluster',
    ],
    answer: 1,
    explanation: 'A Headless Service (clusterIP: None) returns all matching Pod IPs in DNS instead of a single virtual IP. StatefulSets use this so each Pod gets a stable DNS entry (pod-0.svc.ns.svc.cluster.local) enabling peer-to-peer discovery in distributed systems like databases.',
  },
  {
    q: 'What is the key advantage of Gateway API over Ingress?',
    options: [
      'It replaces Services entirely with a simpler model',
      'It supports traffic splitting, header-based routing, and TCP/UDP — things Ingress cannot express natively',
      'It works without an Ingress controller',
      'It is faster because it bypasses kube-proxy',
    ],
    answer: 1,
    explanation: 'Ingress only supports basic HTTP host/path routing. Gateway API (GA in K8s 1.28) adds traffic splitting (canary), header/method-based routing, TCP/UDP routing, and a role-oriented model (GatewayClass → Gateway → HTTPRoute). Most major controllers now support it.',
  },
  { q: 'What is the difference between a ClusterIP and a NodePort service in Kubernetes?', options: ['ClusterIP is for external traffic while NodePort is for internal pod-to-pod traffic', 'ClusterIP is accessible only within the cluster; NodePort exposes the service on a port on every node for external access', 'NodePort supports automatic load balancing while ClusterIP does not', 'ClusterIP requires a dedicated IP address assignment while NodePort does not'], answer: 1, explanation: 'ClusterIP is the default service type and creates a virtual IP accessible only within the cluster, used for pod-to-pod communication. NodePort exposes the service on a static port in the range 30000 to 32767 on every node IP so external traffic can reach it. LoadBalancer provisions a cloud load balancer in front of NodePort. Ingress provides HTTP-level routing by path and host and is not a service type but uses a ClusterIP service behind an Ingress controller.' },
];

const qna: QnaItem[] = [
  {
    q: 'How does Kubernetes DNS work for Services?',
    a: 'CoreDNS runs in the cluster and creates DNS records for each Service: <service>.<namespace>.svc.cluster.local resolves to the ClusterIP. Pods can use just <service> within the same namespace, or <service>.<namespace> across namespaces. This stable DNS name is what Pods should use to communicate — never hardcode ClusterIPs.',
  },
  {
    q: 'What is the difference between port, targetPort, and nodePort in a Service spec?',
    a: 'port: the port clients connect to on the Service\'s ClusterIP (or LoadBalancer IP). targetPort: the container port the traffic is forwarded to. nodePort: (NodePort/LoadBalancer only) the port opened on every cluster node for external access. Only port is required; targetPort defaults to port and nodePort is auto-assigned if omitted.',
  },
  {
    q: 'How do I route to a service outside the cluster using Kubernetes Services?',
    a: 'Two options: (1) ExternalName Service: kind: Service, type: ExternalName, externalName: my.external.db.com — creates a CNAME. (2) Manual Endpoints: create a Service with no selector and manually create an Endpoints object with the external IP. Useful when migrating external services into K8s gradually.',
  },
  {
    q: 'What is the purpose of sessionAffinity: ClientIP on a Service?',
    a: 'It pins a client to the same Pod for all requests within the affinity timeout (default 3 hours), based on the client\'s IP. Useful for stateful protocols or caches where repeated requests benefit from hitting the same backend. Downsides: reduces load distribution effectiveness and requires the client IP to be stable.',
  },
  {
    q: 'What is cert-manager and how does it relate to Ingress TLS?',
    a: 'cert-manager is a Kubernetes add-on that automates TLS certificate lifecycle — it watches for Ingress resources with tls annotations, requests certificates from Let\'s Encrypt (or another CA via ACME), and stores them as Secrets. The Ingress controller then uses those Secrets for TLS termination. Without cert-manager, you manage certificate rotation manually.',
  },
  { q: 'How does Kubernetes DNS service discovery work?', a: 'Kubernetes runs CoreDNS as a cluster add-on. Every Service gets a DNS record in the format service.namespace.svc.cluster.local. Pods in the same namespace can use just the service name; cross-namespace access requires service.namespace format. StatefulSets give each pod a stable DNS name in the format pod-name.service.namespace.svc.cluster.local, which is essential for peer discovery in databases. To debug DNS: run kubectl exec -it pod -- nslookup service or start a temporary busybox pod with kubectl run tmp --image=busybox --rm -it -- nslookup kubernetes to test the cluster DNS directly.' },
];

const revision: RevisionSummary = {
  oneLiner: 'Services route traffic to Pods by label selector (ClusterIP/NodePort/LB); Ingress adds HTTP host+path routing with TLS termination via a controller.',
  mustKnow: [
    'ClusterIP: internal VIP + DNS; NodePort: node:port external access; LoadBalancer: cloud LB',
    'Service selector must match Pod labels exactly — check kubectl get endpoints if broken',
    'Ingress requires a controller (NGINX, Traefik) to actually route traffic',
    'TLS termination at Ingress: reference a Secret with tls.crt + tls.key',
    'pathType Prefix vs Exact — use Prefix for API subtrees',
    'Gateway API replaces Ingress with traffic splitting and header-based routing',
  ],
  interviewFocus: [
    'What is the difference between ClusterIP, NodePort, and LoadBalancer?',
    'How does Kubernetes know which Pods a Service should route to?',
    'What happens when you create an Ingress with no controller installed?',
    'How would you set up HTTPS termination for a Kubernetes service?',
  ],
};

@Component({
  selector: 'app-k8s-services-ingress',
  standalone: true,
  imports: [
    CommonModule, RouterLink,
    PageMetaComponent, QuickRefComponent, TheoryBlockComponent,
    CodeBlockComponent, CommonMistakesComponent, ChallengeBlockComponent,
    QuizBlockComponent, QnaBlockComponent, RevisionCardComponent,
    PageCompleteComponent,
  ],
  templateUrl: './services-ingress.html',
  styleUrl: './services-ingress.scss',
})
export class K8sServicesIngress {
  quickRef = quickRef;
  theory = theory;
  codeTabs = codeTabs;
  mistakes = mistakes;
  challenge = challenge;
  quiz = quiz;
  qna = qna;
  revision = revision;
}
