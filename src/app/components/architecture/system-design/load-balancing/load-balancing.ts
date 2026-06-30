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

const quickRef: QuickRefItem[] = [
  { name: 'Round-robin',          type: 'keyword', desc: 'Requests distributed in sequence across backends. Simple; ignores server load.' },
  { name: 'Least connections',    type: 'keyword', desc: 'Routes to the server with fewest active connections. Better for long-lived requests.' },
  { name: 'Consistent hashing',  type: 'keyword', desc: 'Hashes request key (user ID, IP) to a node. Minimises remapping when nodes change.' },
  { name: 'Sticky sessions',      type: 'keyword', desc: 'Same client always routes to same server. Required for stateful servers; breaks scale-out.' },
  { name: 'Health check',         type: 'keyword', desc: 'LB polls backends every N seconds; removes unhealthy nodes from rotation.' },
  { name: 'L4 LB',               type: 'keyword', desc: 'Routes by IP + TCP port. Fast, low overhead. Cannot inspect HTTP content.' },
  { name: 'L7 LB',               type: 'keyword', desc: 'Routes by URL, headers, cookies. Enables path routing, auth, A/B testing.' },
  { name: 'Weighted round-robin', type: 'keyword', desc: 'Assign more requests to higher-capacity backends. Useful during rolling upgrades.' },
];

const theory: TheoryPoint[] = [
  {
    heading: 'L4 vs L7 load balancers',
    points: [
      'L4 (Transport layer): routes by IP address and TCP/UDP port. Extremely fast — no packet inspection. Examples: AWS NLB, HAProxy TCP mode.',
      'L7 (Application layer): inspects HTTP content — URL path, headers, cookies, body. Slower but powerful. Examples: AWS ALB, nginx, Envoy.',
      'Use L4 for: raw TCP throughput, non-HTTP protocols, millions of connections.',
      'Use L7 for: path-based routing, WebSocket upgrades, JWT authentication, SSL termination, gzip, request logging.',
    ],
  },
  {
    heading: 'Load balancing algorithms',
    points: [
      'Round-robin: simple rotation. Good for homogeneous servers with similar request durations.',
      'Weighted round-robin: servers receive proportional share. Use during canary deploys (5% traffic to new version).',
      'Least connections: ideal when request duration varies widely (e.g. some requests take 5ms, others 5 seconds).',
      'IP hash / consistent hashing: same client always hits same backend. Needed for server-side session affinity.',
      'Random with two choices: pick 2 random servers, route to the less-loaded one. Near-optimal with minimal state.',
    ],
  },
  {
    heading: 'Consistent hashing',
    points: [
      'Problem: when you add/remove a server, modulo hashing remaps most keys → cache invalidation storm.',
      'Consistent hashing: arrange servers on a virtual ring; each key hashes to the nearest clockwise node.',
      'Adding a node only remaps keys from ONE neighbour — O(K/N) keys where K=keys, N=nodes.',
      'Virtual nodes: each physical server is assigned multiple ring positions → better load distribution.',
      'Used by: Cassandra, DynamoDB, Memcached (ketama), Nginx upstream_hash.',
    ],
  },
  {
    heading: 'High availability of load balancers',
    points: [
      'Single LB is a SPOF — always deploy in active-passive or active-active pair.',
      'Active-passive: secondary takes over if primary fails. Failover via VRRP (keepalived) or DNS update.',
      'Active-active: both handle traffic. If one fails, the other absorbs load.',
      'Cloud-managed LBs (AWS ALB/NLB) are inherently HA across multiple AZs.',
    ],
  },
];

const codeTabs: CodeTab[] = [
  {
    label: 'Nginx L7 Config',
    language: 'bash',
    code: `# nginx — L7 load balancer with path routing

upstream api_servers {
    least_conn;  # algorithm: least connections
    server api1.internal:3000 weight=3;
    server api2.internal:3000 weight=3;
    server api3.internal:3000 weight=1;  # canary — 14% traffic

    # Health check (nginx plus / OpenResty)
    keepalive 32;  # keep connections alive to backends
}

upstream static_servers {
    server cdn1.internal:80;
    server cdn2.internal:80;
}

server {
    listen 443 ssl http2;

    # Path-based routing
    location /api/ {
        proxy_pass http://api_servers;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_connect_timeout 5s;
        proxy_read_timeout 30s;
    }

    location /static/ {
        proxy_pass http://static_servers;
        proxy_cache_valid 200 1h;
    }
}`,
  },
  {
    label: 'Consistent Hashing',
    language: 'typescript',
    code: `// Consistent hashing implementation

class ConsistentHashRing {
  private ring = new Map<number, string>();
  private sortedKeys: number[] = [];
  private virtualNodes: number;

  constructor(virtualNodes = 150) {
    this.virtualNodes = virtualNodes;
  }

  private hash(key: string): number {
    let h = 5381;
    for (const c of key) h = ((h << 5) + h) ^ c.charCodeAt(0);
    return (h >>> 0) % (2 ** 32);
  }

  addServer(server: string) {
    for (let i = 0; i < this.virtualNodes; i++) {
      const pos = this.hash(\`\${server}#\${i}\`);
      this.ring.set(pos, server);
      this.sortedKeys.push(pos);
    }
    this.sortedKeys.sort((a, b) => a - b);
  }

  getServer(key: string): string {
    const h = this.hash(key);
    const idx = this.sortedKeys.findIndex(k => k >= h);
    // Wrap around to first server if past the end
    const pos = this.sortedKeys[idx === -1 ? 0 : idx];
    return this.ring.get(pos)!;
  }
}

const ring = new ConsistentHashRing(150);
ring.addServer('cache-1');
ring.addServer('cache-2');
ring.addServer('cache-3');

console.log(ring.getServer('user:42'));    // deterministic
console.log(ring.getServer('user:42'));    // same server every time`,
  },
];

const mistakes: CommonMistake[] = [
  {
    title: 'Using sticky sessions with stateful servers',
    wrong: `// nginx sticky sessions — all requests for user X go to server 1
upstream { sticky; server s1; server s2; }
// Now s1 goes down → user X loses session`,
    right: `// Make servers stateless — store session in Redis instead:
// upstream { least_conn; server s1; server s2; }
// Any server can handle any user; no sticky needed`,
    explanation: 'Sticky sessions defeat the purpose of load balancing — if a server dies, all its users\' sessions are lost. Stateless services with shared Redis are the correct solution.',
  },
  {
    title: 'No health checks configured',
    wrong: `upstream { server s1:3000; server s2:3000; }
# No health checks — dead servers still receive traffic`,
    right: `upstream {
  server s1:3000;
  server s2:3000;
  check interval=5000 rise=2 fall=3 timeout=1000 type=http;
}`,
    explanation: 'Without health checks, the LB sends requests to dead backends — resulting in errors for users. Always configure active health checks with appropriate thresholds.',
  },
  {
    title: 'Single load balancer (SPOF)',
    wrong: `# One nginx instance in front of all backends
# nginx dies → entire site down`,
    right: `# Active-passive pair with keepalived VRRP:
# Both nginx instances share a virtual IP (VIP)
# If primary fails, secondary claims VIP in < 2 seconds`,
    explanation: 'The load balancer itself must not be a single point of failure. Use a VIP with keepalived, or use a cloud-managed LB (AWS ALB) that is inherently multi-AZ.',
  },
  {
    title: 'Using simple round-robin for long-running requests',
    wrong: `# Round-robin with mixed workload:
# request A: 5ms (simple API)
# request B: 30s (video transcoding)
# Server 2 accumulates all long requests → overloaded`,
    right: `# Use least_conn:
upstream { least_conn; server s1; server s2; server s3; }
# Routes new requests to server with fewest active connections`,
    explanation: 'Round-robin assumes equal request cost. When request durations vary widely (batch jobs + live queries), least-connections balances actual server load, not just request count.',
  },
];

const challenge: Challenge = {
  title: 'Design the load balancing layer for a video streaming platform',
  language: 'typescript',
  description: `A video streaming platform (Netflix-like) needs a load balancing strategy.

Characteristics:
- 500k concurrent viewers globally
- Video chunks: small HTTP range requests (< 1ms per request)
- Metadata API: /movies, /search — 10ms avg response
- Transcoding jobs: 30-120 second requests
- WebSocket for watch-party feature
- Geographic distribution: US, EU, APAC

Design:
1. Which LB algorithm for video chunk delivery?
2. Which for metadata API?
3. Which for transcoding workers?
4. How do you handle WebSocket affinity?
5. How do you do canary deploys?`,
  hints: [
    'Video chunks: high throughput, uniform size → round-robin or random-2-choice',
    'Transcoding: long-running, expensive → least connections prevents overload',
    'WebSocket: need sticky routing to the same server for connection lifetime',
    'Canary: weighted round-robin (5% to new version)',
  ],
  starterCode: `interface LBStrategy {
  component: string;
  algorithm: string;
  reason: string;
}

const strategies: LBStrategy[] = [
  { component: 'Video chunk delivery (CDN edge)', algorithm: '', reason: '' },
  { component: 'Metadata API',                    algorithm: '', reason: '' },
  { component: 'Transcoding workers',             algorithm: '', reason: '' },
  { component: 'WebSocket (watch-party)',         algorithm: '', reason: '' },
  { component: 'Canary deploy',                   algorithm: '', reason: '' },
];`,
  solution: `const strategies = [
  {
    component: 'Video chunk delivery',
    algorithm: 'Consistent hashing by session_id at CDN edge',
    reason: 'Routes same viewer to same edge server — improves CDN local cache hit rate. Round-robin loses cache affinity.',
  },
  {
    component: 'Metadata API',
    algorithm: 'Round-robin (or least-conn)',
    reason: 'Requests are uniform (10ms each). Stateless. Round-robin works; least-conn if response time varies.',
  },
  {
    component: 'Transcoding workers',
    algorithm: 'Least connections',
    reason: 'Jobs take 30-120s each. Least-conn ensures no worker gets overloaded with long jobs while others are idle.',
  },
  {
    component: 'WebSocket (watch-party)',
    algorithm: 'IP hash or consistent hashing by session_id',
    reason: 'WebSocket connections are persistent — must route to same server for connection lifetime. Use Redis pub/sub so servers can communicate across connection affinity.',
  },
  {
    component: 'Canary deploy (new encoder version)',
    algorithm: 'Weighted round-robin: 5% new, 95% stable',
    reason: 'Expose small fraction of traffic to new version; monitor error rate before full rollout. Adjust weights gradually.',
  },
];`,
};

const quiz: QuizQuestion[] = [
  {
    q: 'Which algorithm is best when server request durations vary from 5ms to 30 seconds?',
    options: ['Round-robin', 'Weighted round-robin', 'Least connections', 'Random'],
    answer: 2,
    explanation: 'Least connections routes to the server with the fewest active connections. When durations vary, it naturally avoids overloading servers with long-running requests that round-robin would ignore.',
  },
  {
    q: 'What is the main advantage of consistent hashing over modulo hashing when adding a server?',
    options: ['It is faster', 'Only 1/N fraction of keys need remapping', 'It requires no coordination', 'It uses less memory'],
    answer: 1,
    explanation: 'Modulo hashing (key % N) remaps most keys when N changes. Consistent hashing only remaps K/N keys from the new node\'s neighbour — O(K/N) vs O(K) remapping.',
  },
  {
    q: 'An L7 load balancer is required when you need to?',
    options: ['Handle millions of concurrent TCP connections', 'Route based on URL path (/api vs /static)', 'Forward UDP traffic', 'Minimize packet latency'],
    answer: 1,
    explanation: 'L7 LBs inspect HTTP content (paths, headers, cookies), enabling path-based routing. L4 LBs route by IP:port only and are faster but cannot inspect application-layer content.',
  },
  { q: 'What is the difference between Layer 4 and Layer 7 load balancing?', options: ['Layer 4 is for TCP traffic; Layer 7 is for UDP traffic only', 'Layer 4 load balancing routes based on TCP/IP information like source IP and port; Layer 7 routes based on HTTP content like URL path, headers, and cookies', 'Layer 7 load balancing is slower but more accurate than Layer 4', 'Layer 4 load balancing requires more CPU than Layer 7 because it inspects packet payloads'], answer: 1, explanation: 'Layer 4 (transport layer) load balancing forwards packets based on IP address and port without reading the application payload. It is extremely fast and works for any TCP or UDP protocol. Layer 7 (application layer) load balancing reads the HTTP request content: it can route requests for /api to API servers and /static to file servers, perform SSL termination, add headers, inspect cookies for sticky sessions, and redirect based on URL patterns. Layer 7 has more overhead but enables content-based routing that Layer 4 cannot do.' },
  { q: 'What is least connections load balancing and when is it better than round-robin?', options: ['Least connections sends traffic to the server with the fewest total connections ever made', 'Least connections routes each request to the server currently handling the fewest active connections, better for requests with variable processing time', 'Least connections is a static algorithm that never adapts to server health', 'Least connections and round-robin produce identical distribution for all workloads'], answer: 1, explanation: 'Round-robin distributes requests evenly by sequence regardless of how long each takes to process. If some requests take 10x longer than others (due to data complexity or resource usage), some servers may be overloaded while others are idle. Least connections routes to the server with the fewest active connections, which approximates the least loaded server. Better for workloads with high variability in processing time: video encoding jobs, database-heavy queries, or file processing. For uniform request processing time, round-robin and least connections produce similar results.' },
  { q: 'What is a virtual IP (VIP) in the context of load balancing?', options: ['An IP address used only in virtualized environments like Kubernetes pods', 'A single IP address that multiple physical servers share, allowing clients to connect to one stable address while traffic is distributed behind it', 'An IP address assigned to a load balancer for management access only', 'A reserved IP address that is never assigned to any physical interface'], answer: 1, explanation: 'A VIP is a single IP address associated with a load balancer cluster rather than a specific server. Clients connect to the VIP and are unaware of the actual servers behind it. If a backend server fails, it is removed from the pool but the VIP remains the same, so clients experience only brief interruptions rather than needing to reconnect to a new IP. The VIP itself is made highly available through protocols like VRRP (Virtual Router Redundancy Protocol), which allows a standby load balancer to take over the VIP if the active one fails.' },
];

const qna: QnaItem[] = [
  {
    q: 'When are sticky sessions actually acceptable?',
    a: 'Sticky sessions are acceptable for legacy stateful apps you cannot refactor, or for WebSocket connections where the protocol requires persistent server affinity. In both cases, use a short sticky timeout and ensure Redis pub/sub handles cross-server communication so sessions can be reconstructed on failover.',
  },
  {
    q: 'How do cloud-managed LBs (AWS ALB) differ from self-managed nginx?',
    a: 'AWS ALB is fully managed, multi-AZ by default, auto-scales, integrates with ACM (free TLS), WAF, and Cognito. It has a per-GB-processed cost model. Self-managed nginx gives more control (custom Lua modules, headers, complex routing) but requires you to handle HA, scaling, and certificate rotation yourself.',
  },
  { q: 'How do you implement health checks in a load balancer to detect failed backends?', a: 'Load balancers periodically probe backend servers with health check requests. Passive health checks: the load balancer monitors actual request traffic and marks a server as unhealthy when it returns consecutive errors or times out. Active health checks: the load balancer sends synthetic probe requests to a dedicated health endpoint on each backend at a configured interval. When a backend fails a configured number of consecutive checks, it is removed from the pool. When it passes checks again, it is re-added. Configure health check parameters: interval (how often to probe), timeout (how long to wait for a response), and threshold (how many consecutive failures trigger removal). The health check endpoint should verify that the service can actually process requests, not just that the process is running.' },
  { q: 'What is a connection draining period and why is it important for deployments?', a: 'Connection draining (also called deregistration delay) is a grace period during which a backend being removed from the load balancer pool continues to receive existing connections until they complete, while new connections are routed elsewhere. Without draining, removing a server during a deployment immediately terminates all in-flight requests to that server, causing errors for users mid-request. With draining, the server receives no new traffic but completes its current requests up to the drain timeout (typically 30-60 seconds). Load balancers like AWS ALB and NGINX support this natively. It is essential for zero-downtime rolling deployments and graceful service shutdown.' },
  { q: 'How do you handle WebSocket connections in a load balanced environment?', a: 'WebSockets maintain persistent TCP connections, so simple round-robin load balancing across connections creates a problem: subsequent HTTP upgrade requests and the ongoing WebSocket frames must reach the same backend. Solutions: sticky sessions (session affinity) routes all connections from the same client IP or session cookie to the same backend. This keeps the WebSocket connection alive to the correct backend. Challenge: sticky sessions reduce load distribution efficiency and complicate deployments. Alternative: use a shared state store like Redis Pub/Sub for cross-backend WebSocket messaging, then use a layer 7 load balancer that understands WebSocket protocol and routes based on the connection ID or URL path prefix.' },
  { q: 'What is global server load balancing (GSLB) and how does it work?', a: 'GSLB distributes traffic across data centers or cloud regions rather than servers within a single data center. Implemented primarily through DNS: the DNS server returns different IP addresses based on the requester location, routing users to the nearest or healthiest region. The DNS server monitors health of each region and removes unhealthy regions from responses. Techniques: latency-based routing (DNS returns the region with lowest measured latency to the requester), geolocation-based routing (returns the closest region by geographic coordinates), and weighted routing (distributes a percentage of traffic to each region). GSLB is slower to failover than local load balancing because DNS TTLs cause clients to cache the IP address even after a region fails.' },
];

const revision: RevisionSummary = {
  oneLiner: 'L4 LB routes by IP:port; L7 by HTTP path/headers. Use consistent hashing for cache affinity; least-conn for variable-duration workloads.',
  mustKnow: [
    'L4: fast, IP+port routing, cannot inspect HTTP',
    'L7: URL/header routing, TLS termination, WAF, A/B testing',
    'Round-robin: uniform requests; Least-conn: variable duration; Consistent hashing: cache affinity',
    'Consistent hashing: only K/N keys remapped when adding a node',
    'LB must be HA (active-passive or cloud-managed multi-AZ)',
    'Sticky sessions → prefer stateless + Redis instead',
  ],
  interviewFocus: [
    'Choose algorithm based on workload type — not just default round-robin',
    'Explain consistent hashing trade-off vs modulo for distributed caches',
    'LB itself is a SPOF — mention active-passive or cloud-managed HA',
    'WebSocket affinity: mention Redis pub/sub for cross-server messaging',
  ],
};

@Component({
  selector: 'app-sysdesign-load-balancing',
  standalone: true,
  imports: [CommonModule, PageMetaComponent, QuickRefComponent, TheoryBlockComponent, CodeBlockComponent,
    CommonMistakesComponent, ChallengeBlockComponent, QuizBlockComponent, QnaBlockComponent,
    RevisionCardComponent, PageCompleteComponent],
  templateUrl: './load-balancing.html',
  styleUrl: './load-balancing.scss',
})
export class SysdesignLoadBalancing {
  quickRef = quickRef;
  theory = theory;
  codeTabs = codeTabs;
  mistakes = mistakes;
  challenge = challenge;
  quiz = quiz;
  qna = qna;
  revision = revision;
}
