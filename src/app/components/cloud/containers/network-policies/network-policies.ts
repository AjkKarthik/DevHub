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
  { name: 'podSelector: {}', type: 'keyword', desc: 'Selects ALL pods in the namespace (empty selector = match all)' },
  { name: 'policyTypes: [Ingress]', type: 'keyword', desc: 'Policy controls inbound traffic; Egress controls outbound' },
  { name: 'namespaceSelector', type: 'keyword', desc: 'Match pods in namespaces with specific labels' },
  { name: 'ipBlock', type: 'keyword', desc: 'Allow/deny a CIDR range — used for external IP ranges' },
  { name: 'ports', type: 'keyword', desc: 'Restrict the policy to specific ports and protocols' },
  { name: 'Default deny', type: 'keyword', desc: 'Empty ingress/egress rules = deny all matching traffic type' },
  { name: 'CNI required', type: 'keyword', desc: 'NetworkPolicy is enforced by the CNI plugin — Calico, Cilium, or Weave required' },
  { name: 'Cilium', type: 'keyword', desc: 'eBPF-based CNI with L7 (HTTP/gRPC) network policy support' },
];

const theory: TheoryPoint[] = [
  {
    heading: 'Default Kubernetes Networking',
    points: [
      'By default, all pods in a Kubernetes cluster can communicate with all other pods regardless of namespace.',
      'There are no network restrictions between pods — a compromised frontend pod can reach the database directly.',
      'NetworkPolicy objects restrict pod-to-pod traffic — but only when a CNI plugin that enforces them is installed.',
      'Common NetworkPolicy-capable CNIs: Calico, Cilium, Weave Net, Antrea. Flannel does NOT enforce NetworkPolicy.',
      'NetworkPolicies are additive and allow-list based — you deny all first, then explicitly allow what is needed.',
    ],
  },
  {
    heading: 'How NetworkPolicy Selects Traffic',
    points: [
      'spec.podSelector: which pods this policy applies TO (the target pods being protected).',
      'ingress/egress rules: from/to which pods traffic is allowed.',
      'Each rule can combine podSelector, namespaceSelector, and ipBlock — within a rule they are ANDed; separate rules are ORed.',
      'policyTypes: [Ingress] → policy affects inbound traffic. [Egress] → outbound. Both → both directions.',
      'A pod with ANY NetworkPolicy applied to it is isolated for that traffic direction — even if no rules allow traffic in.',
    ],
  },
  {
    heading: 'Default Deny + Allow-List Pattern',
    points: [
      'Best practice: apply a default-deny policy to every namespace, then add explicit allow-list policies.',
      'Default deny ingress: podSelector: {} (all pods) + policyTypes: [Ingress] + no ingress rules.',
      'Default deny egress: similar pattern — blocks all outbound including DNS (port 53).',
      'When denying egress, always explicitly allow DNS (port 53 UDP to kube-dns) or pods cannot resolve service names.',
      'Namespace isolation: apply default-deny to every namespace; cross-namespace traffic must be explicitly allowed with namespaceSelector.',
    ],
  },
  {
    heading: 'CNI Enforcement and Cilium L7 Policies',
    points: [
      'NetworkPolicy is a Kubernetes API object — the API server stores it, but enforcement is done by the CNI plugin.',
      'If no CNI supports NetworkPolicy (e.g. Flannel), policies are silently ignored — traffic flows unrestricted.',
      'Cilium uses eBPF for high-performance enforcement and supports L7 policies: allow GET /api but deny POST /admin.',
      'Calico: widely used, supports both iptables and eBPF backends; also has its own CiliumNetworkPolicy/GlobalNetworkPolicy CRDs.',
      'Always verify enforcement: apply a deny-all and test that traffic is actually blocked before trusting policies.',
    ],
  },
];

const codeTabs: CodeTab[] = [
  {
    label: 'Default deny + allow',
    language: 'bash',
    code: '# Step 1: Default deny ALL ingress in the namespace\napiVersion: networking.k8s.io/v1\nkind: NetworkPolicy\nmetadata:\n  name: default-deny-ingress\n  namespace: production\nspec:\n  podSelector: {}          # matches ALL pods\n  policyTypes: [Ingress]   # no ingress rules = deny all inbound\n\n---\n# Step 2: Allow frontend → api on port 8080\napiVersion: networking.k8s.io/v1\nkind: NetworkPolicy\nmetadata:\n  name: allow-frontend-to-api\n  namespace: production\nspec:\n  podSelector:\n    matchLabels:\n      app: api             # policy protects api pods\n  policyTypes: [Ingress]\n  ingress:\n    - from:\n        - podSelector:\n            matchLabels:\n              app: frontend  # only frontend pods allowed\n      ports:\n        - protocol: TCP\n          port: 8080\n\n---\n# Step 3: Allow api → postgres on port 5432\napiVersion: networking.k8s.io/v1\nkind: NetworkPolicy\nmetadata:\n  name: allow-api-to-db\n  namespace: production\nspec:\n  podSelector:\n    matchLabels:\n      app: postgres\n  policyTypes: [Ingress]\n  ingress:\n    - from:\n        - podSelector:\n            matchLabels:\n              app: api\n      ports:\n        - protocol: TCP\n          port: 5432',
  },
  {
    label: 'Cross-namespace + DNS egress',
    language: 'bash',
    code: '# Allow monitoring namespace to scrape metrics from production\napiVersion: networking.k8s.io/v1\nkind: NetworkPolicy\nmetadata:\n  name: allow-prometheus-scrape\n  namespace: production\nspec:\n  podSelector:\n    matchLabels:\n      expose-metrics: "true"\n  policyTypes: [Ingress]\n  ingress:\n    - from:\n        - namespaceSelector:\n            matchLabels:\n              kubernetes.io/metadata.name: monitoring\n          podSelector:\n            matchLabels:\n              app: prometheus      # AND: must be in monitoring ns AND be prometheus\n      ports:\n        - protocol: TCP\n          port: 9090\n\n---\n# Default deny egress + allow DNS (critical — without this, pods can\'t resolve names)\napiVersion: networking.k8s.io/v1\nkind: NetworkPolicy\nmetadata:\n  name: default-deny-egress\n  namespace: production\nspec:\n  podSelector: {}\n  policyTypes: [Egress]\n  egress:\n    - ports:\n        - protocol: UDP\n          port: 53     # allow DNS\n        - protocol: TCP\n          port: 53     # TCP DNS fallback',
  },
  {
    label: 'ipBlock for external services',
    language: 'bash',
    code: '# Allow api pods to reach external payment gateway (specific IP range)\napiVersion: networking.k8s.io/v1\nkind: NetworkPolicy\nmetadata:\n  name: allow-payment-gateway\n  namespace: production\nspec:\n  podSelector:\n    matchLabels:\n      app: api\n  policyTypes: [Egress]\n  egress:\n    - to:\n        - ipBlock:\n            cidr: 203.0.113.0/24      # payment gateway IP range\n            except:\n              - 203.0.113.100/32      # exclude one IP from the range\n      ports:\n        - protocol: TCP\n          port: 443\n    - to:\n        - namespaceSelector:\n            matchLabels:\n              kubernetes.io/metadata.name: production\n      ports:\n        - protocol: TCP\n          port: 5432    # also allow in-cluster DB access\n    - ports:             # always allow DNS\n        - protocol: UDP\n          port: 53',
  },
];

const mistakes: CommonMistake[] = [
  {
    title: 'Applying NetworkPolicy with a CNI that does not enforce it',
    wrong: '# Using Flannel CNI (does not support NetworkPolicy)\n# Applied deny-all policy — traffic still flows freely\n# kubectl get networkpolicy shows the policy exists\n# But pods can still reach each other without restriction',
    right: '# Verify CNI supports NetworkPolicy before relying on it:\n# Calico, Cilium, Weave Net, Antrea — yes\n# Flannel — NO (policies are ignored)\n# Test: apply deny-all, then verify traffic is actually blocked',
    explanation: 'NetworkPolicy enforcement is done by the CNI plugin, not Kubernetes itself. If you apply a deny-all NetworkPolicy with Flannel installed, the API server accepts the object but Flannel ignores it — all traffic continues to flow. Always verify your CNI supports NetworkPolicy, and test enforcement by checking that blocked traffic is actually blocked.',
  },
  {
    title: 'Forgetting to allow DNS egress when applying default-deny egress',
    wrong: '# Default deny ALL egress\nspec:\n  podSelector: {}\n  policyTypes: [Egress]\n  # No egress rules at all\n# Result: pods cannot resolve service names → all HTTP calls fail\n# Error: getaddrinfo ENOTFOUND postgres-service',
    right: 'spec:\n  podSelector: {}\n  policyTypes: [Egress]\n  egress:\n    - ports:\n        - protocol: UDP\n          port: 53\n        - protocol: TCP\n          port: 53   # always allow DNS first',
    explanation: 'Kubernetes services are resolved via DNS (kube-dns/CoreDNS on port 53). A default-deny egress policy blocks DNS lookups, causing all service-name-based connections to fail with ENOTFOUND. Always add a DNS egress exception (UDP and TCP port 53) as the first rule in any default-deny egress policy.',
  },
  {
    title: 'Confusing AND vs OR logic in from/to rules',
    wrong: '# Intended: allow from monitoring namespace AND from prometheus pod\n# Actual: allows from monitoring namespace OR from any pod labelled prometheus\ningress:\n  - from:\n      - namespaceSelector:\n          matchLabels: { ns: monitoring }\n      - podSelector:\n          matchLabels: { app: prometheus }',
    right: '# AND: combine selectors in a single list item\ningress:\n  - from:\n      - namespaceSelector:\n          matchLabels: { ns: monitoring }\n        podSelector:   # same item = AND\n          matchLabels: { app: prometheus }',
    explanation: 'In a NetworkPolicy from/to array, separate list items (using -) are OR conditions. Selectors within the same item are AND conditions. Two dashes = two separate rules = OR. One item with both selectors = AND. This is a common mistake that creates much broader allow rules than intended.',
  },
  {
    title: 'Not labelling namespaces for use in namespaceSelector',
    wrong: '# Policy uses namespaceSelector to allow monitoring namespace\n# But namespace has no labels\nkubectl get namespace monitoring --show-labels\n# NAME         LABELS\n# monitoring   <none>   ← no labels, selector never matches',
    right: '# Label the namespace first:\nkubectl label namespace monitoring kubernetes.io/metadata.name=monitoring\n# Or use the auto-set label (K8s 1.21+):\n# kubernetes.io/metadata.name is automatically set to the namespace name',
    explanation: 'namespaceSelector matches namespace labels, not the namespace name directly. Without labels on the namespace, the selector never matches and the policy has no effect. Since Kubernetes 1.21, kubernetes.io/metadata.name is automatically set on all namespaces — use this label for reliable namespace matching.',
  },
  {
    title: 'Applying NetworkPolicy only to ingress but not egress (half-isolation)',
    wrong: '# Only deny-all ingress applied\n# Frontend → API is blocked ✓\n# API → external internet: still allowed ✗\n# Compromised pod can exfiltrate data via egress',
    right: '# Apply both ingress AND egress default-deny policies\n# Then allow-list specific egress destinations:\n# - Internal services (postgres, redis)\n# - External APIs (payment gateway by IP)\n# - DNS (port 53 always)',
    explanation: 'A default-deny on ingress only protects pods from receiving unwanted traffic. It does nothing to prevent a compromised pod from initiating outbound connections — exfiltrating data, calling external C2 servers, or lateral movement. A complete zero-trust posture requires both ingress and egress NetworkPolicies.',
  },
];

const challenge: Challenge = {
  title: 'NetworkPolicy Rule Validator',
  language: 'typescript',
  description: 'Write a function that checks if a NetworkPolicy spec is a valid default-deny policy. A valid default-deny ingress policy must have: podSelector that is empty ({}), policyTypes including "Ingress", and NO ingress rules (ingress array is absent or empty). Return { valid: boolean, reason: string }.',
  hints: [
    'Check podSelector is an empty object (no matchLabels or matchExpressions)',
    'Check policyTypes includes "Ingress"',
    'Check there are no ingress rules (ingress is undefined, null, or empty array)',
    'If any check fails, set valid: false with a descriptive reason',
  ],
  starterCode: 'interface NetworkPolicySpec {\n  podSelector?: Record<string, unknown>;\n  policyTypes?: string[];\n  ingress?: unknown[];\n}\n\ninterface ValidationResult {\n  valid: boolean;\n  reason: string;\n}\n\nfunction isDefaultDenyIngress(spec: NetworkPolicySpec): ValidationResult {\n  // TODO: validate default-deny ingress policy\n  return { valid: false, reason: "not implemented" };\n}',
  solution: 'interface NetworkPolicySpec {\n  podSelector?: Record<string, unknown>;\n  policyTypes?: string[];\n  ingress?: unknown[];\n}\n\ninterface ValidationResult {\n  valid: boolean;\n  reason: string;\n}\n\nfunction isDefaultDenyIngress(spec: NetworkPolicySpec): ValidationResult {\n  const selector = spec.podSelector ?? {};\n  const keys = Object.keys(selector);\n  if (keys.length > 0) {\n    return { valid: false, reason: `podSelector must be empty {} — got keys: ${keys.join(", ")}` };\n  }\n\n  if (!spec.policyTypes?.includes("Ingress")) {\n    return { valid: false, reason: \'policyTypes must include "Ingress"\' };\n  }\n\n  if (spec.ingress && spec.ingress.length > 0) {\n    return { valid: false, reason: `ingress rules must be absent or empty — found ${spec.ingress.length} rule(s)` };\n  }\n\n  return { valid: true, reason: "Valid default-deny ingress policy" };\n}\n\nconsole.log(isDefaultDenyIngress({ podSelector: {}, policyTypes: ["Ingress"] }));\n// { valid: true, reason: "Valid default-deny ingress policy" }\nconsole.log(isDefaultDenyIngress({ podSelector: { matchLabels: { app: "api" } }, policyTypes: ["Ingress"] }));\n// { valid: false, reason: "podSelector must be empty {} — got keys: matchLabels" }',
};

const quiz: QuizQuestion[] = [
  {
    q: 'What happens to pod-to-pod traffic in a Kubernetes cluster with no NetworkPolicies applied?',
    options: [
      'All traffic is blocked by default — pods must be explicitly allowed to communicate',
      'All pods can communicate with all other pods in all namespaces without restriction',
      'Pods can communicate within the same namespace but not across namespaces',
      'Only pods with the same labels can communicate with each other',
    ],
    answer: 1,
    explanation: 'Kubernetes has a flat network model — by default all pods can reach all other pods regardless of namespace. There are no network restrictions until NetworkPolicies are applied. This means a compromised frontend pod can reach the database, internal APIs, and monitoring systems without any barrier.',
  },
  {
    q: 'What does a NetworkPolicy with podSelector: {} and policyTypes: [Ingress] but no ingress rules do?',
    options: [
      'It allows all ingress traffic to all pods in the namespace',
      'It denies all ingress traffic to all pods in the namespace (default-deny)',
      'It is invalid — a policy without rules is rejected by the API server',
      'It only affects pods without their own NetworkPolicy',
    ],
    answer: 1,
    explanation: 'podSelector: {} matches ALL pods in the namespace. policyTypes: [Ingress] tells Kubernetes this policy controls inbound traffic. With no ingress rules, the allowed set is empty — all inbound traffic is denied. This is the canonical default-deny ingress pattern. Any subsequent policy can add allow-list exceptions.',
  },
  {
    q: 'In a NetworkPolicy from rule, what is the difference between two separate list items vs two selectors in one item?',
    options: [
      'Two separate items (each with -) mean AND; two selectors in one item mean OR',
      'Two separate items (each with -) mean OR; two selectors in one item mean AND',
      'There is no difference — both evaluate to the same result',
      'Two selectors in one item are invalid — each selector must be its own list item',
    ],
    answer: 1,
    explanation: 'In NetworkPolicy from/to arrays: separate list items (using the - prefix) are OR conditions — traffic is allowed if it matches ANY item. Multiple selectors within the same list item are AND conditions — traffic must match ALL selectors. This is a common source of overly permissive policies when teams intend AND but write OR.',
  },
  {
    q: 'Why must DNS (port 53) always be explicitly allowed in an egress default-deny policy?',
    options: [
      'DNS is a cluster-scoped resource that bypasses namespace NetworkPolicies',
      'Pods resolve Kubernetes service names via kube-dns — without DNS egress, service-name connections fail',
      'kube-dns runs in the host network namespace and requires a special HostPort exception',
      'DNS uses both UDP and TCP which require separate NetworkPolicy objects',
    ],
    answer: 1,
    explanation: 'Kubernetes service discovery relies on DNS — when code does http://postgres-service:5432, the container resolves "postgres-service" via kube-dns/CoreDNS on port 53. A default-deny egress policy blocks this DNS lookup, causing every hostname-based connection to fail with ENOTFOUND. Always add a DNS allow rule (UDP+TCP port 53) as the first rule in any egress restriction.',
  },
  {
    q: 'Which CNI plugin does NOT enforce Kubernetes NetworkPolicy?',
    options: ['Calico', 'Cilium', 'Flannel', 'Antrea'],
    answer: 2,
    explanation: 'Flannel is a simple overlay network CNI focused on pod connectivity — it does not implement NetworkPolicy enforcement. If you apply a NetworkPolicy in a cluster using Flannel, the API server stores the object but Flannel ignores it completely — traffic flows as if no policy exists. Calico, Cilium, Weave Net, and Antrea all enforce NetworkPolicy.',
  },
  { q: 'What is the default Kubernetes network behavior if no NetworkPolicies exist?', options: ['All pod-to-pod traffic is blocked by default requiring explicit allow rules', 'All pods can communicate with all other pods and external endpoints with no restrictions', 'Only pods within the same namespace can communicate with each other', 'Traffic is only allowed through Services, not directly between pod IPs'], answer: 1, explanation: 'By default with no NetworkPolicies, Kubernetes allows ALL pod-to-pod communication across namespaces and pods can reach the internet freely. NetworkPolicies are additive and enforced by the CNI plugin such as Calico or Cilium (Flannel does not support NetworkPolicies by default). A namespace with ANY NetworkPolicy selecting a pod activates enforcement for that pod. Best practice: deploy a default-deny-all policy, then explicitly allow required traffic paths.' },
];

const qna: QnaItem[] = [
  {
    q: 'How do I test that a NetworkPolicy is actually enforcing traffic restrictions?',
    a: 'Don\'t assume the policy works — test it. Spawn a test pod and try to connect: kubectl run test --image=busybox --rm -it -- sh, then nc -zv <target-pod-ip> <port>. If the policy is working, the connection should time out or be refused. Also verify your CNI enforces policies (Flannel does not). Use tools like netpol-verify, kubectl-np-viewer, or Cilium\'s Hubble for visual network flow observation.',
  },
  {
    q: 'How does Cilium\'s L7 NetworkPolicy differ from standard Kubernetes NetworkPolicy?',
    a: 'Standard Kubernetes NetworkPolicy operates at L3/L4 — it can allow/deny based on IP, port, and protocol. Cilium\'s CiliumNetworkPolicy extends this to L7 using eBPF: you can allow GET /api/v1/users but deny POST /admin, or allow specific gRPC methods. This is valuable for microservice architectures where multiple services share the same port but need different access control at the HTTP/gRPC level.',
  },
  {
    q: 'Do NetworkPolicies apply to traffic from outside the cluster (Ingress controllers)?',
    a: 'NetworkPolicies control pod-to-pod traffic within the cluster network. Traffic entering via an Ingress controller passes through the Ingress pod first — if you restrict ingress to the application pod to only allow from the Ingress controller\'s pod (by label), external traffic still flows through. For external traffic restrictions at the cluster boundary, use your cloud provider\'s network ACLs or security groups, not Kubernetes NetworkPolicy.',
  },
  {
    q: 'Can I apply a NetworkPolicy to a specific namespace from outside that namespace?',
    a: 'No — NetworkPolicy objects are namespace-scoped. A NetworkPolicy in namespace A can only protect pods in namespace A. However, its from/to rules can reference pods or namespaces outside namespace A using namespaceSelector. For cluster-wide policies (apply to all namespaces), use Calico\'s GlobalNetworkPolicy or Cilium\'s CiliumClusterwideNetworkPolicy CRDs — these are not standard Kubernetes objects.',
  },
  {
    q: 'What is the difference between Calico and Cilium for NetworkPolicy?',
    a: 'Both enforce Kubernetes NetworkPolicy, but differ in implementation and features. Calico uses iptables (or eBPF in newer versions) and is the most widely deployed CNI for NetworkPolicy — it also adds GlobalNetworkPolicy CRDs. Cilium uses eBPF exclusively, enabling L7 policies, superior observability (Hubble), and better performance at high throughput. Cilium is the more modern choice for new clusters; Calico has broader compatibility with existing infrastructure.',
  },
  { q: 'How do you create a default-deny-all NetworkPolicy in Kubernetes?', a: 'Apply a NetworkPolicy with an empty podSelector (which matches all pods) and list both Ingress and Egress in policyTypes with no ingress or egress rules. Having policyTypes listed with no corresponding rules means deny all traffic of those types. Then add specific allow policies as needed for your application. Remember to allow egress to port 53 UDP and TCP for DNS resolution to kube-dns. Test connectivity with kubectl exec and nc or curl between pods to verify that the policies are enforced correctly by your CNI plugin.' },
];

const revision: RevisionSummary = {
  oneLiner: 'Default: all pods talk to all pods. NetworkPolicy = allow-list: default-deny first, then add explicit allow rules. Enforced by CNI (Calico/Cilium) — Flannel ignores policies.',
  mustKnow: [
    'Default K8s networking: all pods can reach all pods — no restrictions without NetworkPolicy',
    'Default-deny: podSelector: {}, policyTypes: [Ingress/Egress], no rules = deny all',
    'Allow-list model: apply default-deny, then add specific allow rules per service pair',
    'from/to list items = OR; selectors within one item = AND (common mistake)',
    'Always allow DNS (port 53 UDP+TCP) in egress policies or service names won\'t resolve',
    'CNI must support NetworkPolicy — Flannel does not; Calico and Cilium do',
  ],
  interviewFocus: [
    'What is the default pod-to-pod networking behaviour in Kubernetes without NetworkPolicies?',
    'How do you implement a zero-trust network model in a Kubernetes namespace?',
    'What is the AND vs OR difference in NetworkPolicy from/to rules?',
    'Why must DNS be explicitly allowed when using default-deny egress?',
  ],
};

@Component({
  selector: 'app-k8s-network-policies',
  standalone: true,
  imports: [
    CommonModule, RouterLink,
    PageMetaComponent, QuickRefComponent, TheoryBlockComponent,
    CodeBlockComponent, CommonMistakesComponent, ChallengeBlockComponent,
    QuizBlockComponent, QnaBlockComponent, RevisionCardComponent,
    PageCompleteComponent,
  ],
  templateUrl: './network-policies.html',
  styleUrl: './network-policies.scss',
})
export class K8sNetworkPolicies {
  quickRef = quickRef;
  theory = theory;
  codeTabs = codeTabs;
  mistakes = mistakes;
  challenge = challenge;
  quiz = quiz;
  qna = qna;
  revision = revision;
}
