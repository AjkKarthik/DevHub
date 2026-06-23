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
