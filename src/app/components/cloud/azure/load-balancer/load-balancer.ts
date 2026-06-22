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
  selector: 'app-azure-load-balancer',
  standalone: true,
  imports: [CommonModule, PageMetaComponent, QuickRefComponent, TheoryBlockComponent, CodeBlockComponent,
    CommonMistakesComponent, ChallengeBlockComponent, QuizBlockComponent, QnaBlockComponent,
    RevisionCardComponent, PageCompleteComponent],
  templateUrl: './load-balancer.html',
  styleUrl: './load-balancer.scss'
})
export class AzureLoadBalancer {

  quickRef: QuickRefItem[] = [
    { name: 'Azure Load Balancer', type: 'type', desc: 'L4 (TCP/UDP) load balancer. Routes packets by 5-tuple hash. Two SKUs: Basic (legacy) and Standard (zone-redundant, production-grade).' },
    { name: 'Application Gateway', type: 'type', desc: 'L7 (HTTP/HTTPS) load balancer with URL routing, cookie-based session affinity, SSL termination, WAF, and autoscale.' },
    { name: 'Azure Front Door', type: 'type', desc: 'Global L7 load balancer + CDN + WAF. Anycast to the nearest PoP, then private backbone to backends. Standard and Premium SKUs.' },
    { name: 'Traffic Manager', type: 'type', desc: 'DNS-based global traffic router. Routes DNS queries to regional endpoints by policy (performance, weighted, priority, geographic).' },
    { name: 'Health Probe', type: 'type', desc: 'Periodic check (TCP/HTTP/HTTPS) from the load balancer to backend instances. Failed probes remove the backend from rotation.' },
    { name: 'Backend Pool', type: 'type', desc: 'Set of VMs, VMSS instances, IP addresses, or FQDNs that receive traffic from the load balancer.' },
    { name: 'WAF Policy', type: 'type', desc: 'Web Application Firewall — OWASP Core Rule Set blocks SQLi, XSS, etc. Attached to Application Gateway or Front Door.' },
  ];

  theory: TheoryPoint[] = [
    {
      heading: 'Azure Load Balancer (L4)',
      points: [
        'Azure Load Balancer operates at Layer 4 (TCP/UDP). It distributes packets by a 5-tuple hash: source IP, source port, destination IP, destination port, protocol — without inspecting HTTP headers or content.',
        'Standard SKU is always zone-redundant and supports up to 1,000 backend instances, outbound rules, and cross-zone load balancing. Basic SKU is legacy — use Standard for all new deployments.',
        'Frontend IP configurations: public (public IP) or internal (private IP from VNet subnet). Internal load balancers distribute traffic between VMs within a VNet for multi-tier apps.',
        'Health probes check backend health every interval (default 15s). After the probe threshold of failures (default 2), the backend is removed from rotation. TCP probes verify port connectivity; HTTP probes verify response codes (200–399 pass).',
        'Outbound rules on Standard LB control SNAT for outbound internet traffic from VMs — assign dedicated public IPs for predictable outbound IP ranges and avoid SNAT port exhaustion.',
      ]
    },
    {
      heading: 'Application Gateway (L7)',
      points: [
        'Application Gateway operates at Layer 7 (HTTP/HTTPS). It terminates TLS at the gateway (SSL offload) and can re-encrypt to backends (end-to-end TLS). It understands HTTP verbs, headers, cookies, and URIs.',
        'URL-based routing rules direct requests to different backend pools by path: /api/* goes to the API pool, /images/* goes to the static pool. Host-based routing serves multiple domains from one gateway (multi-site hosting).',
        'Cookie-based session affinity (sticky sessions) pins a user session to the same backend by inserting an ApplicationGatewayAffinity cookie — useful for stateful applications without distributed session storage.',
        'WAF mode can be Detection (log only) or Prevention (block + log). OWASP CRS 3.2 covers SQLi, XSS, RCE, path traversal. Custom rules add rate-limit or geo-block policies.',
        'Autoscale (v2 SKU): Application Gateway v2 scales from 0 to 125 capacity units automatically. v2 requires a dedicated subnet with no other resources, minimum /26 or /24 for autoscale headroom.',
      ]
    },
    {
      heading: 'Azure Front Door',
      points: [
        'Azure Front Door is a global CDN and L7 load balancer with Anycast entry via 100+ PoPs worldwide. Requests hit the nearest PoP; Front Door proxies to the origin over Microsoft\'s private backbone — reducing latency vs direct internet.',
        'Origins can be App Service, Storage, Application Gateway, or any public HTTPS endpoint. Origin groups define health probes and priority/weight for failover between origins.',
        'Front Door Standard/Premium includes WAF (OWASP CRS), custom rules, DDoS protection, and bot manager. Premium tier adds Private Link origins — traffic from Front Door to your backend stays off the public internet.',
        'Caching at the PoP level: cache rules control which paths are cached, TTL, and query string behaviour. Purge cache via portal or CLI for content updates.',
        'Traffic Manager (DNS-based) returns a DNS answer pointing clients to a regional endpoint — clients connect directly. Front Door terminates connections at the PoP and proxies, enabling WAF, caching, and TLS termination.',
      ]
    },
    {
      heading: 'Choosing the Right Balancer',
      points: [
        'TCP/UDP load balancing within a region (VMs, VMSS) → Azure Load Balancer Standard.',
        'HTTPS application routing with URL rules, WAF, SSL termination within a region → Application Gateway v2.',
        'Global HTTPS load balancing with CDN, WAF, global failover → Azure Front Door Standard or Premium.',
        'DNS-based global routing for any protocol, multi-region failover → Traffic Manager.',
        'Common pattern: Front Door (global WAF + CDN) → Application Gateway (regional routing) → AKS/App Service. One WAF layer at Front Door is sufficient for most apps; two layers adds cost without significant benefit unless compliance requires regional WAF.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Azure Load Balancer',
      language: 'bash',
      code: `# Create Standard Load Balancer with public IP
az network public-ip create \\
  --name lb-public-ip --resource-group my-rg \\
  --sku Standard --allocation-method Static

az network lb create \\
  --name my-lb --resource-group my-rg \\
  --sku Standard \\
  --frontend-ip-name lb-frontend \\
  --public-ip-address lb-public-ip \\
  --backend-pool-name lb-backend

# Health probe checking /health on port 80
az network lb probe create \\
  --lb-name my-lb --resource-group my-rg \\
  --name http-probe --protocol Http \\
  --port 80 --path /health --interval 15 --threshold 2

# Load balancing rule
az network lb rule create \\
  --lb-name my-lb --resource-group my-rg \\
  --name http-rule \\
  --frontend-ip-name lb-frontend \\
  --backend-pool-name lb-backend \\
  --probe-name http-probe \\
  --protocol Tcp --frontend-port 80 --backend-port 80

# Add VM NIC to backend pool
az network nic ip-config address-pool add \\
  --nic-name vm1-nic --resource-group my-rg \\
  --ip-config-name ipconfig1 \\
  --lb-name my-lb --address-pool lb-backend`
    },
    {
      label: 'Application Gateway',
      language: 'bash',
      code: `# Create Application Gateway v2 with WAF (dedicated subnet required)
az network application-gateway create \\
  --name my-appgw --resource-group my-rg \\
  --location eastus \\
  --sku WAF_v2 --capacity 2 \\
  --vnet-name my-vnet --subnet appgw-subnet \\
  --public-ip-address appgw-ip \\
  --http-settings-port 80 \\
  --http-settings-protocol Http \\
  --frontend-port 443

# Add API backend pool
az network application-gateway address-pool create \\
  --gateway-name my-appgw --resource-group my-rg \\
  --name api-pool --servers 10.0.2.4 10.0.2.5

# URL path map — /api/* routes to api-pool
az network application-gateway url-path-map create \\
  --gateway-name my-appgw --resource-group my-rg \\
  --name url-path-map \\
  --paths '/api/*' \\
  --address-pool api-pool \\
  --http-settings appGatewayBackendHttpSettings \\
  --default-address-pool appGatewayBackendPool \\
  --default-http-settings appGatewayBackendHttpSettings

# Enable WAF in Prevention mode with OWASP 3.2
az network application-gateway waf-config set \\
  --gateway-name my-appgw --resource-group my-rg \\
  --enabled true --firewall-mode Prevention \\
  --rule-set-type OWASP --rule-set-version 3.2`
    },
    {
      label: 'Azure Front Door',
      language: 'bash',
      code: `# Create Front Door Standard profile
az afd profile create \\
  --profile-name my-fd --resource-group my-rg \\
  --sku Standard_AzureFrontDoor

# Origin group with health probes
az afd origin-group create \\
  --profile-name my-fd --resource-group my-rg \\
  --origin-group-name my-origins \\
  --probe-request-type GET --probe-protocol Http \\
  --probe-interval-in-seconds 30 --probe-path /health \\
  --sample-size 4 --successful-samples-required 3

# Add App Service origin
az afd origin create \\
  --profile-name my-fd --resource-group my-rg \\
  --origin-group-name my-origins --origin-name primary \\
  --host-name myapp.azurewebsites.net \\
  --origin-host-header myapp.azurewebsites.net \\
  --priority 1 --weight 1000 --enabled-state Enabled \\
  --https-port 443

# Create endpoint + route all traffic
az afd endpoint create \\
  --profile-name my-fd --resource-group my-rg \\
  --endpoint-name my-endpoint --enabled-state Enabled

az afd route create \\
  --profile-name my-fd --resource-group my-rg \\
  --endpoint-name my-endpoint --route-name default-route \\
  --origin-group my-origins \\
  --supported-protocols Https \\
  --https-redirect Enabled \\
  --forwarding-protocol HttpsOnly \\
  --patterns-to-match '/*'`
    },
  ];

  mistakes: CommonMistake[] = [
    {
      title: 'Using Basic SKU Load Balancer for production workloads',
      wrong: `az network lb create --sku Basic  # No zone redundancy, max 300 backends, being retired`,
      right: `az network lb create --sku Standard  # Zone-redundant, 1000 backends, SLA 99.99%`,
      explanation: 'Basic SKU has no SLA, no zone redundancy, and is being retired. Standard SKU is zone-redundant, supports 1,000 backend instances, and requires Standard SKU public IPs. Always use Standard for production.'
    },
    {
      title: 'Deploying Application Gateway into the same subnet as application VMs',
      wrong: `# Application Gateway added to web-subnet alongside VMs — deployment fails`,
      right: `# App Gateway requires a dedicated subnet (appgw-subnet), min /26, /24 recommended for autoscale`,
      explanation: 'Application Gateway v2 requires its own dedicated subnet with no other resources. NSGs on this subnet must allow ports 65200–65535 inbound from GatewayManager service tag and outbound to backends. Without these rules, the gateway fails to provision or health-probe backends.'
    },
    {
      title: 'Not setting origin-host-header in Front Door origin config',
      wrong: `# Front Door sends its own hostname → App Service returns 400 (host header mismatch)`,
      right: `az afd origin create --origin-host-header myapp.azurewebsites.net`,
      explanation: 'Front Door\'s default Host header is the Front Door endpoint hostname. App Service validates the Host header against its custom domain bindings and rejects unknown hostnames with HTTP 400. Set origin-host-header to the actual backend hostname so the backend recognizes the request.'
    },
    {
      title: 'Using an HTTP health probe when the backend only accepts HTTPS',
      wrong: `az network lb probe create --protocol Http --port 80  # Backend is HTTPS-only → probe fails`,
      right: `az network lb probe create --protocol Https --port 443 --path /health`,
      explanation: 'A mismatched health probe removes all backends from rotation, causing all traffic to return 502/503. Always match the probe protocol and port to what the backend actually accepts. For Application Gateway, verify backend HTTP settings match the backend\'s listener protocol.'
    },
  ];

  challenge: Challenge = {
    title: 'Round-robin load balancer simulation',
    language: 'typescript',
    description: 'Simulate a simple round-robin load balancer. Implement a LoadBalancer class with:\n- addBackend(id: string): void — register a backend\n- removeBackend(id: string): void — deregister a backend\n- getNext(): string | null — return the next backend in round-robin order, null if none',
    hints: [
      'Keep a list of backends and a current index',
      'On removeBackend, filter it out and clamp index if needed',
      'getNext should wrap around using modulo',
      'Return null only when the backends list is empty',
    ],
    starterCode: `export class LoadBalancer {
  private backends: string[] = [];
  private index = 0;

  addBackend(id: string): void { /* ... */ }
  removeBackend(id: string): void { /* ... */ }
  getNext(): string | null { /* ... */ }
}`,
    solution: `export class LoadBalancer {
  private backends: string[] = [];
  private index = 0;

  addBackend(id: string): void {
    this.backends.push(id);
  }

  removeBackend(id: string): void {
    const i = this.backends.indexOf(id);
    if (i === -1) return;
    this.backends.splice(i, 1);
    if (this.index >= this.backends.length) this.index = 0;
  }

  getNext(): string | null {
    if (this.backends.length === 0) return null;
    const backend = this.backends[this.index];
    this.index = (this.index + 1) % this.backends.length;
    return backend;
  }
}

const lb = new LoadBalancer();
lb.addBackend('vm1'); lb.addBackend('vm2'); lb.addBackend('vm3');
console.log(lb.getNext()); // 'vm1'
console.log(lb.getNext()); // 'vm2'
lb.removeBackend('vm2');
console.log(lb.getNext()); // 'vm3'
console.log(lb.getNext()); // 'vm1'`
  };

  quiz: QuizQuestion[] = [
    {
      q: 'What OSI layer does Azure Load Balancer operate at?',
      options: ['Layer 3 (Network)', 'Layer 4 (Transport)', 'Layer 7 (Application)', 'Layer 2 (Data Link)'],
      answer: 1,
      explanation: 'Azure Load Balancer operates at Layer 4 (TCP/UDP). It distributes packets based on a 5-tuple hash without inspecting HTTP content. For HTTP/HTTPS-aware routing (URL rules, WAF, SSL termination), use Application Gateway (L7).'
    },
    {
      q: 'Which service provides global CDN + WAF + Anycast entry at the nearest PoP?',
      options: ['Traffic Manager', 'Application Gateway', 'Azure Load Balancer Standard', 'Azure Front Door'],
      answer: 3,
      explanation: 'Azure Front Door provides global L7 load balancing with Anycast entry at 100+ PoPs, CDN caching, WAF, and bot protection. Traffic Manager is DNS-based without proxying. Application Gateway is regional. Azure Load Balancer is L4.'
    },
    {
      q: 'What does cookie-based session affinity in Application Gateway do?',
      options: [
        'Routes based on an existing session cookie in the request',
        'Pins a user session to the same backend by inserting an ApplicationGatewayAffinity cookie',
        'Stores session data in Redis',
        'A WAF rule that prevents session-fixation attacks'
      ],
      answer: 1,
      explanation: 'Application Gateway inserts an ApplicationGatewayAffinity cookie on the first response. Subsequent requests from the same client include this cookie, and the gateway routes them to the same backend instance. Useful for stateful apps without distributed session storage.'
    },
    {
      q: 'Why does the Application Gateway subnet need NSG rule allowing ports 65200–65535?',
      options: [
        'For outbound TLS to backends',
        'For Azure infrastructure to manage and health-check the Application Gateway instances',
        'For client connections from the internet',
        'For WAF rule updates from Microsoft'
      ],
      answer: 1,
      explanation: 'Azure infrastructure uses ports 65200–65535 inbound to manage Application Gateway instances (health, configuration updates). Without this NSG rule (from the GatewayManager service tag), the gateway fails to provision or loses management connectivity. This is a hard requirement for the dedicated AppGW subnet.'
    },
    {
      q: 'How does Traffic Manager differ from Azure Front Door?',
      options: [
        'Traffic Manager is L4; Front Door is L7',
        'Traffic Manager returns a DNS answer; the client connects directly. Front Door proxies connections at the PoP',
        'Traffic Manager includes a WAF; Front Door does not',
        'They are identical — Traffic Manager is the old name for Front Door'
      ],
      answer: 1,
      explanation: 'Traffic Manager returns a DNS answer pointing the client to a regional endpoint — the client then connects directly. Front Door Anycast terminates connections at the nearest PoP and proxies to the origin, enabling WAF, caching, and TLS termination that Traffic Manager cannot provide.'
    },
  ];

  qna: QnaItem[] = [
    {
      q: 'When should I use Traffic Manager vs Azure Front Door?',
      a: 'Use <strong>Traffic Manager</strong> for DNS-based global routing of any protocol (TCP, UDP, not just HTTP), or to route to on-premises endpoints. It is cheaper but cannot do WAF, caching, or TLS termination. Use <strong>Azure Front Door</strong> for HTTP/HTTPS apps where you need global WAF, CDN caching, and lowest latency via Anycast. Front Door Standard/Premium is the default choice for modern web apps.'
    },
    {
      q: 'What is SNAT exhaustion and how do you prevent it?',
      a: '<strong>SNAT (Source NAT)</strong> translates private VM IPs to a public load balancer IP for outbound internet connections. Each public IP supports ~64K SNAT ports. High outbound connection rates exhaust these ports, causing new connections to fail silently (connection timeouts). Prevention: (1) add multiple public IPs via outbound rules, (2) use <strong>NAT Gateway</strong> for large-scale outbound (1M+ ports per IP), (3) reduce outbound connections using Private Endpoints for Azure PaaS services.'
    },
    {
      q: 'Can Azure Load Balancer handle HTTPS traffic?',
      a: 'Azure Load Balancer can forward TCP port 443 to backends as raw bytes — it does <strong>not</strong> terminate TLS. The TLS handshake happens end-to-end between the client and the backend VM, which must handle TLS itself. If you need TLS termination, SSL offload, certificate management, or any HTTP-aware routing, use <strong>Application Gateway</strong> (regional) or <strong>Azure Front Door</strong> (global) instead.'
    },
    {
      q: 'Should I run WAF on Front Door, Application Gateway, or both?',
      a: 'For most applications, <strong>one WAF layer at Front Door</strong> is sufficient — it blocks threats at the global edge before traffic reaches your region. Running WAF on both Front Door and Application Gateway (defence in depth) is valid for high-compliance scenarios but doubles WAF cost and adds latency for double-inspection. A common hybrid: Front Door WAF in Prevention mode at the edge, Application Gateway v2 behind it for regional URL routing without WAF enabled (to avoid double-billing).'
    },
    {
      q: 'What is the difference between WAF Detection and Prevention mode?',
      a: '<strong>Detection mode</strong>: WAF logs rule matches but does NOT block requests — all traffic passes through. Use during initial deployment to understand which rules fire before blocking. <strong>Prevention mode</strong>: WAF blocks and logs requests matching rules. The recommended production setting. You can exclude specific rules or paths from Prevention mode to tune false positives without fully disabling the WAF.'
    },
  ];

  revision: RevisionSummary = {
    oneLiner: 'Layer 4 = Azure Load Balancer (TCP/UDP, regional); Layer 7 regional = Application Gateway (WAF, URL routing); Layer 7 global = Azure Front Door (Anycast CDN + WAF); DNS-only = Traffic Manager.',
    mustKnow: [
      'Azure Load Balancer = L4 TCP/UDP, 5-tuple hash routing, Standard SKU zone-redundant (always use Standard)',
      'Application Gateway = L7 HTTP/HTTPS, URL routing, SSL offload, cookie affinity, WAF — regional only',
      'Azure Front Door = global Anycast L7 proxy + CDN + WAF; connections terminate at nearest PoP',
      'Traffic Manager = DNS-based global router; client connects directly, no proxying or WAF',
      'App Gateway: dedicated subnet required, ports 65200–65535 must be open from GatewayManager',
      'SNAT exhaustion: use NAT Gateway or multiple outbound IPs for high outbound connection rates',
    ],
    interviewFocus: [
      'Explain the difference between Azure Load Balancer, Application Gateway, and Front Door',
      'What is SNAT exhaustion and how do you prevent it with Standard Load Balancer?',
      'When would you put WAF on Front Door vs Application Gateway vs both?',
      'How does Traffic Manager differ from Front Door for global routing?',
    ],
  };
}
