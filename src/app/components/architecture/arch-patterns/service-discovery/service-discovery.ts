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
  selector: 'app-arch-service-discovery',
  standalone: true,
  imports: [CommonModule, PageMetaComponent, QuickRefComponent, TheoryBlockComponent,
    CodeBlockComponent, CommonMistakesComponent, ChallengeBlockComponent, QuizBlockComponent,
    QnaBlockComponent, RevisionCardComponent, PageCompleteComponent],
  templateUrl: './service-discovery.html',
  styleUrl: './service-discovery.scss',
})
export class ArchServiceDiscovery {

  quickRef: QuickRefItem[] = [
    { name: 'Service Registry', type: 'keyword', desc: 'Central store of live service instances and their addresses (Consul, Eureka, etcd)' },
    { name: 'Client-Side Discovery', type: 'keyword', desc: 'Caller queries registry directly and picks an instance to call' },
    { name: 'Server-Side Discovery', type: 'keyword', desc: 'Load balancer or DNS queries registry; caller just calls one stable address' },
    { name: 'Self-Registration', type: 'keyword', desc: 'Service registers/deregisters itself on startup/shutdown' },
    { name: 'Third-Party Registration', type: 'keyword', desc: 'Deployment platform (Kubernetes, Consul agent) registers services automatically' },
    { name: 'Health Check', type: 'keyword', desc: 'Registry periodically pings services; removes unhealthy instances' },
    { name: '.NET Aspire', type: 'keyword', desc: 'Built-in DNS-based service discovery for .NET microservices without an external registry' },
  ];

  theory: TheoryPoint[] = [
    {
      heading: 'Why Service Discovery?',
      points: [
        'In a microservices environment, service instances come and go — containers restart, auto-scale, or move to different hosts.',
        'Hard-coding IP addresses or hostnames breaks the moment an instance changes address.',
        'Service discovery solves this: services register themselves with a registry; callers look up healthy instances at call time.',
        'The registry acts as a phone book: "I need the Order Service" → registry returns the current live addresses.',
      ],
    },
    {
      heading: 'Client-Side vs Server-Side Discovery',
      points: [
        'Client-Side: the calling service queries the registry (Consul, Eureka) and picks an instance using its own load-balancing logic (round-robin, least-connections).',
        'Advantage: caller controls load-balancing strategy. Disadvantage: every client needs registry client code in every language.',
        'Server-Side: a load balancer or DNS resolver queries the registry on behalf of the caller. Caller just calls a stable DNS name.',
        'Advantage: transparent to callers (no registry SDK needed). Disadvantage: the load balancer itself must be highly available.',
        'Kubernetes uses server-side discovery: CoreDNS resolves service names to ClusterIPs which route to healthy pods.',
      ],
    },
    {
      heading: 'Health Checks and Deregistration',
      points: [
        'Services register a health check endpoint (/health/live or /health/ready).',
        'Registry polls it periodically; unhealthy instances are removed from the pool within seconds.',
        'Graceful shutdown: on SIGTERM, service deregisters before stopping — callers are not routed to it during shutdown.',
        'Without deregistration, callers receive addresses of dead instances and experience errors until TTL expiry.',
      ],
    },
    {
      heading: 'Client-Side vs. Server-Side Discovery',
      points: [
        'In client-side discovery, the calling service queries a service registry directly and then load-balances among the returned healthy instances itself — this gives the client full control over load-balancing strategy but requires discovery-client logic embedded in every service.',
        'In server-side discovery, the client sends its request to a well-known intermediary (a load balancer or gateway) that itself queries the registry and routes the request — simpler for the calling client, at the cost of an additional network hop and infrastructure component to operate.',
        'Kubernetes\'s built-in Service abstraction is a form of server-side discovery — kube-proxy handles routing to healthy pod IPs transparently, meaning application code simply calls a stable Service DNS name without needing any discovery-client logic at all.',
        'Choosing between them often comes down to what infrastructure is already in place — a Kubernetes-native system typically leans on server-side discovery by default, while systems built on more general-purpose infrastructure sometimes adopt client-side discovery (via Consul or Eureka) for finer load-balancing control.',
      ],
    },
    {
      heading: 'Health Checks as the Foundation of Reliable Discovery',
      points: [
        'A service registry is only as useful as the accuracy of its health information — routing traffic to a registered-but-unhealthy instance defeats the purpose of discovery entirely, which is why active or passive health checking is a required companion to any discovery mechanism, not an optional add-on.',
        'Liveness checks (is the process running at all) and readiness checks (is the process ready to accept traffic right now) answer different questions — a service can be alive but not yet ready (still warming a cache, still connecting to a database), and routing traffic to a live-but-not-ready instance causes avoidable request failures.',
        'Health check failures should trigger de-registration or traffic exclusion promptly, but not so aggressively that a brief, transient hiccup causes unnecessary churn — tuning health check frequency and failure thresholds is a real balance between fast failure detection and avoiding false-positive instability.',
        'Self-registration (a service registering itself on startup and de-registering on graceful shutdown) combined with registry-side health checks (catching ungraceful crashes the service could not self-report) together provide more reliable discovery than relying on either mechanism alone.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Consul Registration',
      language: 'typescript',
      code: `// Register with Consul on startup
import Consul from 'consul';

const consul = new Consul({ host: 'consul', port: 8500 });

async function registerService(): Promise<void> {
  await consul.agent.service.register({
    id: \`order-service-\${process.env.INSTANCE_ID}\`,
    name: 'order-service',
    address: process.env.HOST_IP,
    port: 8080,
    check: {
      http: \`http://\${process.env.HOST_IP}:8080/health\`,
      interval: '10s',
      deregistercriticalserviceafter: '30s',
    },
    tags: ['v2', 'production'],
  });
  console.log('Registered with Consul');
}

// Deregister on graceful shutdown
process.on('SIGTERM', async () => {
  await consul.agent.service.deregister(\`order-service-\${process.env.INSTANCE_ID}\`);
  process.exit(0);
});`
    },
    {
      label: 'Client-Side Discovery',
      language: 'typescript',
      code: `// Client queries Consul, picks an instance with round-robin
class ServiceRegistry {
  private cache = new Map<string, { address: string; port: number }[]>();
  private index = new Map<string, number>();

  async getInstances(serviceName: string) {
    if (!this.cache.has(serviceName)) {
      const services = await consul.health.service({ service: serviceName, passing: true });
      this.cache.set(serviceName, services.map((s: any) => ({
        address: s.Service.Address,
        port: s.Service.Port,
      })));
      // Refresh cache every 5 seconds
      setTimeout(() => this.cache.delete(serviceName), 5000);
    }
    return this.cache.get(serviceName)!;
  }

  async getUrl(serviceName: string): Promise<string> {
    const instances = await this.getInstances(serviceName);
    if (!instances.length) throw new Error(\`No healthy instances of \${serviceName}\`);
    // Round-robin load balancing
    const i = (this.index.get(serviceName) ?? 0) % instances.length;
    this.index.set(serviceName, i + 1);
    const inst = instances[i];
    return \`http://\${inst.address}:\${inst.port}\`;
  }
}

const registry = new ServiceRegistry();
const baseUrl = await registry.getUrl('catalog-service');
const product = await fetch(\`\${baseUrl}/api/products/\${id}\`).then(r => r.json());`
    },
    {
      label: 'Kubernetes / .NET Aspire (server-side)',
      language: 'typescript',
      code: `// Kubernetes — server-side discovery via CoreDNS
// Services call each other by stable DNS name; no registry SDK needed

// order-service/src/catalogClient.ts
const CATALOG_URL = process.env.CATALOG_SERVICE_URL ?? 'http://catalog-service:8081';
// "catalog-service" resolves via CoreDNS to the K8s Service ClusterIP
// K8s Service load-balances across healthy pods automatically

const product = await fetch(\`\${CATALOG_URL}/api/products/\${id}\`);

// .NET Aspire — DNS-based discovery, zero config
// Program.cs (AppHost)
// var catalog  = builder.AddProject<CatalogService>("catalog");
// var ordering = builder.AddProject<OrderService>("ordering")
//                       .WithReference(catalog); // injects SERVICES__CATALOG__HTTPS__0

// OrderService just uses the injected URL:
// var catalogUrl = builder.Configuration["services:catalog:https:0"];
// Aspire manages discovery, health, and dashboard without Consul/Eureka`
    },
  ];

  mistakes: CommonMistake[] = [
    {
      title: 'Hard-coding service addresses in configuration',
      wrong: `const CATALOG_URL = 'http://10.0.1.42:8081'; // IP changes when container restarts`,
      right: `const CATALOG_URL = 'http://catalog-service:8081'; // DNS name always resolves`,
      explanation: 'Container IPs are ephemeral. Use DNS names (Kubernetes service names, Consul DNS) that always resolve to healthy instances.',
    },
    {
      title: 'Not implementing graceful deregistration',
      wrong: `// Service just stops; registry keeps routing traffic to dead instance for 30s`,
      right: `process.on('SIGTERM', async () => { await registry.deregister(); process.exit(0); });`,
      explanation: 'Without deregistration, callers receive errors until the registry detects the failure via health check TTL. Deregister before stopping.',
    },
    {
      title: 'Not caching registry lookups',
      wrong: `// Querying Consul on every single HTTP request (hundreds/sec)`,
      right: `// Cache registry responses for 5–30 seconds; refresh in the background`,
      explanation: 'Querying the registry on every call adds latency and hammers the registry. Cache instances with a short TTL and refresh asynchronously.',
    },
    {
      title: 'Health check endpoint doing too much work',
      wrong: `// /health runs a full database query and external API check on every poll`,
      right: `// /health/live: returns 200 immediately if process is alive (liveness); /health/ready: checks DB conn`,
      explanation: 'Split liveness (is the process alive?) from readiness (is it ready for traffic?). Liveness must be cheap — it is called every few seconds.',
    },
  ];

  challenge: Challenge = {
    title: 'Implement a Simple In-Memory Service Registry',
    language: 'typescript',
    description: `Build a minimal in-memory service registry that:
1. Allows services to register with name, host, and port.
2. Returns all healthy registered instances for a service name.
3. Allows deregistration by service id.
4. Simulates health check by marking instances as healthy/unhealthy.`,
    hints: [
      'Use a Map<serviceName, Instance[]> as the store',
      'Each instance needs an id, host, port, and healthy flag',
      'getHealthy filters by healthy: true',
      'deregister removes by id',
    ],
    starterCode: `interface ServiceInstance {
  id: string;
  name: string;
  host: string;
  port: number;
  healthy: boolean;
}

class InMemoryRegistry {
  private store = new Map<string, ServiceInstance[]>();

  register(instance: ServiceInstance): void { /* TODO */ }
  deregister(id: string): void { /* TODO */ }
  getHealthy(name: string): ServiceInstance[] { /* TODO */ }
  setHealth(id: string, healthy: boolean): void { /* TODO */ }
}`,
    solution: `interface ServiceInstance {
  id: string;
  name: string;
  host: string;
  port: number;
  healthy: boolean;
}

class InMemoryRegistry {
  private store = new Map<string, ServiceInstance[]>();

  register(instance: ServiceInstance): void {
    const existing = this.store.get(instance.name) ?? [];
    // Upsert by id -- a re-registration with the same id (a service
    // reconnecting after a network blip, without ever deregistering first)
    // must replace the old entry, not create a duplicate alongside it.
    const withoutDuplicate = existing.filter(i => i.id !== instance.id);
    this.store.set(instance.name, [...withoutDuplicate, instance]);
  }

  deregister(id: string): void {
    for (const [name, instances] of this.store) {
      this.store.set(name, instances.filter(i => i.id !== id));
    }
  }

  getHealthy(name: string): ServiceInstance[] {
    return (this.store.get(name) ?? []).filter(i => i.healthy);
  }

  setHealth(id: string, healthy: boolean): void {
    for (const instances of this.store.values()) {
      const inst = instances.find(i => i.id === id);
      if (inst) { inst.healthy = healthy; return; }
    }
  }
}

// Demo
const registry = new InMemoryRegistry();
registry.register({ id: 'cat-1', name: 'catalog', host: '10.0.0.1', port: 8081, healthy: true });
registry.register({ id: 'cat-2', name: 'catalog', host: '10.0.0.2', port: 8081, healthy: true });
console.log(registry.getHealthy('catalog').length); // 2
registry.setHealth('cat-1', false);
console.log(registry.getHealthy('catalog').length); // 1`,
  };

  quiz: QuizQuestion[] = [
    {
      q: 'What is the main difference between client-side and server-side service discovery?',
      options: [
        'Client-side uses HTTP; server-side uses gRPC',
        'Client-side: caller queries the registry and load-balances itself; server-side: a load balancer or DNS handles it transparently',
        'Client-side is only for mobile apps',
        'Server-side requires Consul; client-side uses Kubernetes',
      ],
      answer: 1,
      explanation: 'Client-side discovery: each caller has registry client code and picks an instance. Server-side: a DNS/LB resolves the stable name to healthy instances transparently.',
    },
    {
      q: 'What happens if a service does not deregister before shutting down?',
      options: [
        'Nothing — the registry always knows',
        'Callers receive errors until the registry detects failure via health check TTL expiry',
        'The service auto-restarts',
        'Other services crash immediately',
      ],
      answer: 1,
      explanation: 'Without deregistration, the registry keeps the dead instance in the pool. Callers are routed to it and get errors until the health check TTL removes it.',
    },
    {
      q: 'In Kubernetes, what provides server-side service discovery?',
      options: [
        'Consul agent on every node',
        'CoreDNS resolving service names to ClusterIPs',
        'Zookeeper',
        'Prometheus',
      ],
      answer: 1,
      explanation: 'Kubernetes CoreDNS resolves service names (like "catalog-service") to ClusterIPs. The kube-proxy routes those to healthy pod endpoints.',
    },
    { q: 'What is service discovery and why is it needed in microservices?', options: ['A tool for automatically generating API documentation for microservices', 'A mechanism for services to dynamically find each other network locations since static IP addresses do not work when instances scale up and down', 'A load balancing strategy that routes traffic based on service health metrics', 'A container orchestration feature that assigns fixed IPs to all service replicas'], answer: 1, explanation: 'In a microservices environment, service instances start and stop dynamically due to auto-scaling, deployments, and failures. Hard-coding IP addresses in configuration is not feasible. Service discovery provides a registry where services register their network location on startup and deregister on shutdown. When a service needs to call another service, it queries the registry to get the current list of healthy instances and selects one to call. This enables dynamic scaling without configuration changes.' },
    { q: 'What operational cost does client-side discovery impose that server-side discovery avoids, beyond the client needing registry-awareness logic?', options: ['Client-side discovery has no additional operational cost', 'Every client application must embed and keep updated a discovery/load-balancing library (in its own language, matching the registry\'s client protocol), meaning a polyglot microservices fleet needs a working, maintained discovery client for EVERY language in use — server-side discovery only requires this logic once, in the shared load balancer/gateway', 'Client-side discovery requires more network hops per request than server-side', 'Client-side discovery cannot support health checking'], answer: 1, explanation: 'Server-side discovery centralizes the registry-querying and load-balancing logic in one place (the load balancer or gateway), so services themselves stay simple and language-agnostic — they just call a fixed address. Client-side discovery pushes that complexity into every calling service, meaning a fleet using Java, Go, Python, and Node.js services each needs a working, maintained client-side discovery library for its language and the specific registry API in use, multiplying the maintenance burden across every language in a polyglot environment — a cost server-side discovery avoids by centralizing that logic once.' },
    { q: 'How does Kubernetes handle service discovery?', options: ['Kubernetes requires manual configuration of IP addresses for each service', 'Kubernetes assigns a stable DNS name to each Service resource; kube-proxy maintains iptables rules routing traffic to healthy pod endpoints', 'Kubernetes requires a separate Consul or Eureka installation for service discovery', 'Kubernetes only supports static service discovery via ConfigMap entries'], answer: 1, explanation: 'Kubernetes service discovery uses two mechanisms: DNS and environment variables. Each Service resource gets a stable DNS name (service-name.namespace.svc.cluster.local). CoreDNS resolves this name to the ClusterIP. kube-proxy maintains iptables or IPVS rules that load balance traffic from the ClusterIP to healthy pod endpoints. The Endpoints resource tracks pod IPs and ports; as pods start and stop, endpoints are updated and kube-proxy reflects these changes in the routing rules. Services abstract the dynamic pod IP changes behind a stable DNS name and ClusterIP.' },
  ];

  qna: QnaItem[] = [
    {
      q: 'Do I need Consul or Eureka if I use Kubernetes?',
      a: 'Generally no. Kubernetes provides server-side service discovery out of the box via CoreDNS and Service resources. Consul or Eureka are needed for non-Kubernetes environments, multi-cluster setups, or when you need DNS-based discovery across heterogeneous infrastructure.',
    },
    {
      q: 'What is the difference between a liveness probe and a readiness probe?',
      a: 'Liveness: is the process alive? Failure → restart the container. Readiness: is the process ready to serve traffic? Failure → remove from the load balancer pool but do not restart. Use readiness to drain traffic during startup or transient errors.',
    },
    {
      q: 'What is .NET Aspire\'s approach to service discovery?',
      a: '.NET Aspire uses DNS-based service discovery without an external registry. The AppHost project wires service references at composition time; environment variables inject the resolved URL. Services just read the injected URL — no Consul SDK, no registry client.',
    },
    { q: 'How does Consul provide service discovery with health checking?', a: 'Consul is a distributed service discovery and configuration tool. Services register with the Consul agent running on their host, providing their address, port, and health check configuration. Health checks can be HTTP endpoints, TCP connections, or shell scripts run on a schedule. Consul agents gossip health information across the cluster using the Serf protocol. Failed health checks mark the service as unhealthy and remove it from the DNS and API results. Callers can query Consul via DNS (service-name.service.consul) or the HTTP API to get currently healthy instances. Consul also supports service segmentation via intentions, which define which services are allowed to communicate.' },
    { q: 'What are health checks in the context of service discovery and why are they critical?', a: 'Health checks allow the service registry to know which instances are healthy and able to receive traffic. Without health checks, a crashed or stuck instance remains in the registry and continues to receive traffic, causing errors. Health check types: liveness check verifies the process is running. Readiness check verifies the instance can handle traffic (its dependencies are connected, its internal caches are warmed). Service registries use readiness status to route traffic. A service that is alive but not ready should be temporarily removed from the discovery pool. In Kubernetes, liveness and readiness probes are separate: liveness failure triggers a pod restart; readiness failure removes the pod from Service endpoints.' },
    { q: 'How do you handle service discovery in a multi-region deployment?', a: 'In multi-region deployments, services in one region must be able to discover services in the same region for normal traffic, with fallback to another region if local instances are unavailable. Strategies: prefer local region instances by configuring the service registry to return local instances first (Consul locality-aware routing, Eureka region/zone preferences). For cross-region calls, route through a global API gateway or GSLB that knows about healthy instances in all regions. Use health-check aggregation: a region is marked healthy if sufficient healthy instances exist within it. Avoid cross-region service-to-service calls in the hot path because latency is high and availability depends on inter-region connectivity.' },
  ];

  revision: RevisionSummary = {
    oneLiner: 'Service discovery lets services find each other dynamically as instances come and go — via a registry (Consul) or platform DNS (Kubernetes CoreDNS).',
    mustKnow: [
      'Service registry: central store of live, healthy service instances',
      'Client-side: caller queries registry, does own load balancing (Ribbon, Consul SDK)',
      'Server-side: DNS/LB resolves stable name to instances (Kubernetes, AWS ALB)',
      'Health checks: liveness (alive?) vs readiness (ready for traffic?) probes',
      'Deregister gracefully before shutdown to avoid routing errors',
    ],
    interviewFocus: [
      'Compare client-side vs server-side service discovery',
      'What happens without graceful deregistration?',
      'How does Kubernetes service discovery work?',
    ],
  };
}
