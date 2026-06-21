import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
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

@Component({
  selector: 'app-azure-aks',
  standalone: true,
  imports: [CommonModule, PageMetaComponent, QuickRefComponent, TheoryBlockComponent, CodeBlockComponent,
    CommonMistakesComponent, ChallengeBlockComponent, QuizBlockComponent, QnaBlockComponent,
    RevisionCardComponent, PageCompleteComponent],
  templateUrl: './aks.html',
  styleUrl: './aks.scss'
})
export class AzureAks {

  quickRef: QuickRefItem[] = [
    { name: 'Node Pool', type: 'type', desc: 'A group of VMs with the same SKU and configuration. System pools run core k8s daemons; user pools run app workloads.' },
    { name: 'Cluster Autoscaler', type: 'type', desc: 'Adds or removes nodes when pods are unschedulable or nodes are underutilised. Configure per node pool with min/max counts.' },
    { name: 'Azure CNI', type: 'type', desc: 'Each pod gets a real VNet IP — pods are directly routable within the VNet. Required for Windows node pools and advanced networking.' },
    { name: 'AGIC', type: 'type', desc: 'Application Gateway Ingress Controller — uses Azure Application Gateway as the Kubernetes Ingress, providing WAF and TLS termination.' },
    { name: 'Workload Identity', type: 'type', desc: 'Federated identity for pods — maps a Kubernetes Service Account to an Entra ID managed identity. Replaces pod-identity and aad-pod-identity.' },
    { name: 'IRSA equivalent', type: 'type', desc: 'AKS uses OIDC issuer + federated credentials to let pods assume Azure managed identities — equivalent to AWS IRSA, no secrets needed.' },
    { name: 'KEDA', type: 'type', desc: 'Kubernetes Event-Driven Autoscaler — scales deployments to zero based on external event sources (queues, topics, HTTP). Built into AKS.' },
  ];

  theory: TheoryPoint[] = [
    {
      heading: 'Cluster Architecture & Node Pools',
      points: [
        'AKS manages the Kubernetes control plane (API server, etcd, scheduler) at no cost. You pay only for the agent nodes (VMs) and their attached storage and networking.',
        'System node pools run core Kubernetes components (CoreDNS, metrics-server, tunnelfront). They must have Linux nodes and at least one node. Tainting them with CriticalAddonsOnly prevents app pods from landing on them.',
        'User node pools run application workloads. You can have multiple user pools with different VM SKUs — e.g. a Standard_D4s_v5 pool for web apps and a Standard_NC6 pool for ML inference.',
        'Node pool upgrades can be done independently: upgrade the system pool first, then user pools. Set maxSurge to allow new nodes to be provisioned before old ones drain, minimising disruption.',
        'Availability Zones: spread node pools across AZs with --zones 1 2 3. Combine with Azure Standard Load Balancer (zone-redundant) and PodTopologySpreadConstraints to distribute pods across AZs.',
      ]
    },
    {
      heading: 'Networking: Kubenet vs Azure CNI',
      points: [
        'Kubenet (default): pods get IPs from a separate RFC 1918 range; the node NATs pod traffic onto the VNet. Simpler, uses fewer VNet IPs, but pod-to-pod across nodes goes through NAT and user-defined routes.',
        'Azure CNI: every pod gets a real IP from the VNet subnet. Pods are directly routable — no NAT, no UDRs. Required for Windows node pools, AGIC, and workloads that need pod IPs to be reachable from on-premises.',
        'Azure CNI Overlay (2023): pods get IPs from a private overlay CIDR, but Azure routes overlay traffic without consuming VNet IP space. Best of both: direct pod routing without exhausting VNet IPs.',
        'Network policies control pod-to-pod traffic (like firewall rules at the pod level). AKS supports Azure Network Policy (Azure CNI only) and Calico (both networking plugins). Always enable network policies in production.',
        'Private cluster: the API server is only reachable from within the VNet (via private endpoint). Use for production clusters — prevents the API server from being exposed on a public IP.',
      ]
    },
    {
      heading: 'Workload Identity & AGIC',
      points: [
        'Workload Identity replaces pod-identity. Enable the OIDC issuer on the cluster, create a Managed Identity, federate it with the pod\'s Kubernetes Service Account, and grant the identity Azure RBAC roles.',
        'With Workload Identity, pods use the projected service account token (mounted at /var/run/secrets/azure/tokens/azure-identity-token) to authenticate to Azure services — no secrets, no key rotation.',
        'AGIC (Application Gateway Ingress Controller) bridges Kubernetes Ingress resources and Azure Application Gateway. Annotations on Ingress objects configure WAF rules, TLS certs (from Key Vault), and backend health probes.',
        'AGIC runs as a pod inside the cluster and watches the Kubernetes API for Ingress changes. It updates the Application Gateway configuration programmatically — Infrastructure as Code for Layer 7 routing.',
        'For simpler ingress without WAF, use the built-in HTTP application routing add-on (dev/test only) or NGINX Ingress Controller with a Standard Load Balancer service.',
      ]
    },
    {
      heading: 'Autoscaling & GitOps',
      points: [
        'Cluster Autoscaler (CA) adds nodes when pods are pending due to insufficient resources, removes underutilised nodes after a cool-down. Configure per pool: az aks nodepool update --enable-cluster-autoscaler --min-count 1 --max-count 10.',
        'Horizontal Pod Autoscaler (HPA) scales pod replicas based on CPU/memory or custom metrics (via KEDA). Combine CA + HPA for full elasticity: HPA adds pods, CA adds nodes to fit them.',
        'KEDA scales deployments to zero based on external event sources (Azure Service Bus queue depth, Event Hub consumer lag, HTTP request rate, custom Prometheus metrics). Install via Helm or the AKS KEDA add-on.',
        'GitOps with Flux v2 (AKS GitOps add-on) or ArgoCD: cluster state is declared in a Git repo; the controller reconciles the cluster to match. Audit trail, instant rollback (git revert), and no kubectl access needed for deployments.',
        'Azure Monitor for Containers (Container Insights) collects node and pod metrics, container logs, and sends them to a Log Analytics workspace. Enable with az aks enable-addons --addons monitoring.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Create Cluster',
      language: 'bash',
      code: `# Create an AKS cluster with two node pools and Workload Identity
az aks create \\
  --resource-group my-rg \\
  --name my-aks \\
  --node-count 2 \\
  --node-vm-size Standard_D4s_v5 \\
  --zones 1 2 3 \\
  --network-plugin azure \\
  --network-plugin-mode overlay \\
  --enable-cluster-autoscaler \\
  --min-count 1 --max-count 5 \\
  --enable-oidc-issuer \\
  --enable-workload-identity \\
  --enable-addons monitoring \\
  --generate-ssh-keys

# Add a user node pool (GPU for ML workloads)
az aks nodepool add \\
  --resource-group my-rg \\
  --cluster-name my-aks \\
  --name gpupool \\
  --node-vm-size Standard_NC6s_v3 \\
  --node-count 0 \\
  --enable-cluster-autoscaler \\
  --min-count 0 --max-count 3

# Get credentials for kubectl
az aks get-credentials --resource-group my-rg --name my-aks`
    },
    {
      label: 'Workload Identity',
      language: 'bash',
      code: `# 1. Get OIDC issuer URL
OIDC=$(az aks show -g my-rg -n my-aks --query oidcIssuerProfile.issuerUrl -o tsv)

# 2. Create a Managed Identity
az identity create --name my-pod-identity --resource-group my-rg
CLIENT_ID=$(az identity show -g my-rg -n my-pod-identity --query clientId -o tsv)

# 3. Grant the identity access to Key Vault secrets
az keyvault set-policy \\
  --name my-vault \\
  --secret-permissions get list \\
  --spn $CLIENT_ID

# 4. Create Kubernetes Service Account
kubectl create serviceaccount my-sa -n default

# 5. Federate: link SA to the managed identity
az identity federated-credential create \\
  --name my-fed-cred \\
  --identity-name my-pod-identity \\
  --resource-group my-rg \\
  --issuer $OIDC \\
  --subject system:serviceaccount:default:my-sa

# 6. Annotate the service account
kubectl annotate serviceaccount my-sa \\
  azure.workload.identity/client-id=$CLIENT_ID -n default`
    },
    {
      label: 'KEDA & Autoscale',
      language: 'bash',
      code: `# Enable KEDA add-on
az aks update --resource-group my-rg --name my-aks --enable-keda

# KEDA ScaledObject: scale deployment by Service Bus queue depth
# kubectl apply -f scaledobject.yaml:
# apiVersion: keda.sh/v1alpha1
# kind: ScaledObject
# metadata:
#   name: order-processor-scaler
# spec:
#   scaleTargetRef:
#     name: order-processor
#   minReplicaCount: 0
#   maxReplicaCount: 20
#   triggers:
#   - type: azure-servicebus
#     metadata:
#       queueName: orders
#       namespace: my-servicebus
#       messageCount: "5"

# HPA: scale by CPU
kubectl autoscale deployment my-app --cpu-percent=70 --min=2 --max=10

# Check cluster autoscaler status
kubectl get configmap cluster-autoscaler-status -n kube-system -o yaml

# Upgrade node pool (rolling, maxSurge=1)
az aks nodepool upgrade \\
  --resource-group my-rg \\
  --cluster-name my-aks \\
  --name nodepool1 \\
  --kubernetes-version 1.30.0 \\
  --max-surge 1`
    },
  ];

  mistakes: CommonMistake[] = [
    {
      title: 'Running application pods on the system node pool',
      wrong: `# Default: no taint on system pool — app pods land on it and compete with k8s daemons`,
      right: `az aks nodepool update --name systempool --node-taints CriticalAddonsOnly=true:NoSchedule`,
      explanation: 'System node pools must run Kubernetes core components (CoreDNS, tunnelfront). App workloads that starve them cause cluster instability. Taint the system pool and add tolerations only to critical add-ons.'
    },
    {
      title: 'Using pod-identity or aad-pod-identity instead of Workload Identity',
      wrong: `# aad-pod-identity is deprecated — uses DaemonSet with elevated privileges`,
      right: `# Enable --enable-oidc-issuer --enable-workload-identity on cluster creation`,
      explanation: 'pod-identity (aad-pod-identity) is deprecated and uses a privileged DaemonSet that can be abused for privilege escalation. Workload Identity uses OIDC federation — no DaemonSet, no secrets, supported in all AKS regions.'
    },
    {
      title: 'Not enabling network policies — all pods can reach all other pods',
      wrong: `# No NetworkPolicy resources: any pod can reach any other pod on any port`,
      right: `az aks create --network-policy azure  # or calico; then apply NetworkPolicy resources`,
      explanation: 'By default Kubernetes allows all pod-to-pod traffic. Enable a network policy engine (Azure or Calico) and apply deny-by-default NetworkPolicy resources to restrict lateral movement in case a pod is compromised.'
    },
    {
      title: 'Not setting resource requests and limits — Cluster Autoscaler cannot schedule correctly',
      wrong: `# Pods with no requests: CA thinks nodes have infinite capacity and never scales out`,
      right: `# Set resources.requests (used for scheduling) and resources.limits on every container`,
      explanation: 'Kubernetes schedules pods based on resource requests. Without requests, the scheduler places everything on any node and the Cluster Autoscaler cannot determine when to add nodes. Set requests on every container; limits prevent runaway processes.'
    },
  ];

  challenge: Challenge = {
    title: 'Parse Kubernetes resource requests',
    language: 'typescript',
    description: 'Kubernetes resource requests use suffixes: "100m" = 100 millicores = 0.1 CPU; "256Mi" = 256 mebibytes; "1Gi" = 1 gibibyte.\n\nWrite parseCpu(value: string): number that returns cores (e.g. "500m" → 0.5, "2" → 2) and parseMemoryMi(value: string): number that returns mebibytes (e.g. "256Mi" → 256, "1Gi" → 1024, "512M" → ~488).',
    hints: [
      'For CPU: if ends with "m", divide by 1000; otherwise parse as float',
      'For memory: "Ki" = 1024 bytes → /1024 for Mi; "Mi" = direct; "Gi" = *1024; "M" = 1000000 bytes → /1048576',
      'Use endsWith() to detect the suffix, slice(0,-2) or slice(0,-1) to strip it',
    ],
    starterCode: `export function parseCpu(value: string): number {
  // "500m" → 0.5, "2" → 2, "100m" → 0.1
  return 0;
}

export function parseMemoryMi(value: string): number {
  // "256Mi" → 256, "1Gi" → 1024, "512M" → ~488
  return 0;
}`,
    solution: `export function parseCpu(value: string): number {
  if (value.endsWith('m')) return parseInt(value.slice(0, -1)) / 1000;
  return parseFloat(value);
}

export function parseMemoryMi(value: string): number {
  if (value.endsWith('Ki')) return parseInt(value.slice(0, -2)) / 1024;
  if (value.endsWith('Mi')) return parseInt(value.slice(0, -2));
  if (value.endsWith('Gi')) return parseInt(value.slice(0, -2)) * 1024;
  if (value.endsWith('Ti')) return parseInt(value.slice(0, -2)) * 1024 * 1024;
  if (value.endsWith('K'))  return parseInt(value.slice(0, -1)) * 1000 / 1048576;
  if (value.endsWith('M'))  return parseInt(value.slice(0, -1)) * 1000000 / 1048576;
  if (value.endsWith('G'))  return parseInt(value.slice(0, -1)) * 1e9 / 1048576;
  return parseInt(value) / 1048576; // raw bytes
}

console.log(parseCpu('500m'));   // 0.5
console.log(parseCpu('2'));      // 2
console.log(parseMemoryMi('256Mi')); // 256
console.log(parseMemoryMi('1Gi'));   // 1024`
  };

  quiz: QuizQuestion[] = [
    {
      q: 'What is the purpose of a system node pool in AKS?',
      options: [
        'To run production application workloads',
        'To run core Kubernetes components like CoreDNS and the metrics server',
        'To provide GPU-accelerated computing',
        'To host the AKS control plane'
      ],
      answer: 1,
      explanation: 'System node pools run critical Kubernetes infrastructure (CoreDNS, tunnelfront, metrics-server). AKS manages the control plane separately at no cost. Taint system pools with CriticalAddonsOnly to prevent app pods from competing with these components for resources.'
    },
    {
      q: 'What networking mode gives every AKS pod its own routable VNet IP address?',
      options: ['Kubenet', 'Azure CNI', 'Flannel', 'Calico'],
      answer: 1,
      explanation: 'Azure CNI assigns each pod a real IP from the VNet subnet — pods are directly routable within and from outside the VNet. Kubenet uses a private pod CIDR and NATs pod traffic onto the VNet, consuming fewer VNet IPs but requiring UDRs for cross-node routing.'
    },
    {
      q: 'What does AKS Workload Identity replace and what is its main advantage?',
      options: [
        'It replaces Managed Identity — pods no longer need Azure AD',
        'It replaces aad-pod-identity (pod-identity) — uses OIDC federation without a privileged DaemonSet',
        'It replaces kubectl — identity is used for cluster access only',
        'It replaces Azure RBAC for Kubernetes resources'
      ],
      answer: 1,
      explanation: 'Workload Identity replaces the deprecated aad-pod-identity add-on. It uses OIDC federation: the cluster OIDC issuer authenticates the pod\'s service account token to Azure, which exchanges it for an Entra ID token. No DaemonSet, no secrets, no privilege escalation risk.'
    },
    {
      q: 'What does KEDA add to AKS beyond the built-in Horizontal Pod Autoscaler?',
      options: [
        'GPU scheduling support',
        'The ability to scale deployments to zero and scale based on external event sources like queue depth',
        'Automatic node upgrades',
        'Cross-cluster load balancing'
      ],
      answer: 1,
      explanation: 'HPA scales based on CPU/memory only and cannot scale to zero. KEDA extends scaling to external event sources (Service Bus queue depth, Event Hub consumer lag, HTTP request rate, custom metrics) and can scale deployments to zero replicas when there is no work.'
    },
    {
      q: 'Why must you set resource requests on every Kubernetes container?',
      options: [
        'Kubernetes will refuse to start containers without them',
        'The scheduler uses requests to decide which node to place a pod on; without them the Cluster Autoscaler cannot determine when to add nodes',
        'Requests are used for billing in AKS',
        'Requests limit network bandwidth'
      ],
      answer: 1,
      explanation: 'The Kubernetes scheduler places pods based on resource requests (guaranteed minimum). Without requests, pods appear to need zero resources and land anywhere — nodes become over-committed. The Cluster Autoscaler also cannot trigger scale-out without accurate pending resource requests.'
    },
  ];

  qna: QnaItem[] = [
    {
      q: 'What is the difference between Cluster Autoscaler (CA) and Horizontal Pod Autoscaler (HPA)?',
      a: '<strong>HPA</strong> scales the <em>number of pod replicas</em> based on CPU, memory, or custom metrics — it adds/removes pods within existing nodes. <strong>Cluster Autoscaler</strong> scales the <em>number of nodes</em> — it adds nodes when pods are unschedulable (no node has enough capacity) and removes underutilised nodes. They complement each other: HPA adds pods when load increases; CA adds nodes when there is no room for those pods.'
    },
    {
      q: 'How does Workload Identity let pods authenticate to Azure Key Vault without any secrets?',
      a: 'Kubernetes projects a short-lived service account token into the pod (<code>/var/run/secrets/azure/tokens/azure-identity-token</code>). The Azure Identity SDK (or the mutating webhook) exchanges this token with the AKS OIDC issuer for an Entra ID access token bound to the federated managed identity. The managed identity has Key Vault Secrets User RBAC — so the pod can read secrets with no credentials stored anywhere.'
    },
    {
      q: 'When should you use AKS vs Azure Container Apps?',
      a: '<strong>AKS</strong> when you need: full Kubernetes API access, custom operators/CRDs, advanced networking (Istio service mesh, custom CNI), Windows containers, or workloads that don\'t fit PaaS abstractions. <strong>Container Apps</strong> when you want: serverless containers with auto-scale to zero, Dapr sidecar integration, KEDA event-driven scaling, and no cluster management. Container Apps is a managed layer on top of AKS — simpler but less configurable.'
    },
    {
      q: 'What is a private AKS cluster and when do you need one?',
      a: 'A private cluster places the Kubernetes API server behind an Azure Private Endpoint — it has no public IP and is only reachable from within the VNet (or connected on-premises networks via VPN/ExpressRoute). Use private clusters in production when compliance or security requirements prohibit public Kubernetes API exposure. Note: <code>az aks get-credentials</code> and <code>kubectl</code> must be run from within the VNet or a jump host.'
    },
    {
      q: 'How do node pool upgrades work in AKS and how do you minimise disruption?',
      a: 'AKS upgrades one node at a time: it cordons the node (prevents new scheduling), drains it (evicts pods to other nodes), provisions a new node with the new k8s version, and deletes the old node. Set <code>--max-surge</code> to provision N extra nodes before draining — this speeds up the upgrade and keeps capacity available throughout. Use <code>PodDisruptionBudgets</code> to ensure at least N replicas of each deployment stay available during drain.'
    },
  ];

  revision: RevisionSummary = {
    oneLiner: 'AKS is managed Kubernetes on Azure — free control plane, node pools for workloads, Azure CNI for pod networking, Workload Identity for pod auth, and Cluster Autoscaler + KEDA for elastic scaling.',
    mustKnow: [
      'System node pools run k8s daemons (CoreDNS) — taint with CriticalAddonsOnly; user pools run apps',
      'Kubenet: NAT-based pod IPs; Azure CNI: real VNet IPs per pod — required for Windows and AGIC',
      'Workload Identity: OIDC federation, service account token → Entra ID token — no secrets, no DaemonSet',
      'Cluster Autoscaler scales nodes; HPA scales pods; KEDA adds zero-scale and external event sources',
      'Always set resource requests — scheduler and CA depend on them for placement and scale decisions',
      'Private cluster: API server behind private endpoint — required for most production security postures',
    ],
    interviewFocus: [
      'Explain Workload Identity — how does a pod authenticate to Key Vault without a secret?',
      'What is the difference between Cluster Autoscaler and HPA and how do they work together?',
      'When would you choose AKS over Azure Container Apps?',
      'Why must you taint the system node pool and set resource requests on every container?',
    ],
  };
}
