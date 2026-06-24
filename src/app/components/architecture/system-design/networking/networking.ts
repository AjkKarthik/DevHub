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
  { name: 'TCP',        type: 'keyword', desc: 'Reliable ordered delivery via 3-way handshake + ACKs. Used for HTTP, databases, email.' },
  { name: 'UDP',        type: 'keyword', desc: 'Low-latency, best-effort — no handshake, no retries. Used for DNS, video streaming, gaming.' },
  { name: 'DNS',        type: 'keyword', desc: 'Maps hostnames to IPs. A record (IPv4), AAAA (IPv6), CNAME (alias), TTL controls cache lifetime.' },
  { name: 'CDN',        type: 'keyword', desc: 'Edge servers cache content near users. Reduces latency and origin load.' },
  { name: 'TLS',        type: 'keyword', desc: 'Encrypts TCP connections (HTTPS). TLS 1.3: 1-RTT handshake. Terminated at LB or CDN edge.' },
  { name: 'HTTP/2',     type: 'keyword', desc: 'Multiplexing — multiple requests over one TCP connection. Header compression (HPACK).' },
  { name: 'HTTP/3',     type: 'keyword', desc: 'QUIC protocol (UDP-based). Eliminates TCP head-of-line blocking. Faster reconnect on mobile.' },
  { name: 'Long poll',  type: 'keyword', desc: 'Client holds connection open until server pushes data. Simpler than WebSocket; higher overhead.' },
];

const theory: TheoryPoint[] = [
  {
    heading: 'TCP vs UDP',
    points: [
      'TCP: connection-oriented, 3-way handshake (SYN-SYN/ACK-ACK), guaranteed delivery, flow control, congestion control.',
      'UDP: connectionless, no handshake, no retransmission. Application handles reliability if needed.',
      'Choose TCP for: APIs, databases, file transfers. Choose UDP for: DNS, VoIP, video streaming, online gaming.',
      'HTTP/3 (QUIC) uses UDP but implements its own reliability — best of both worlds.',
    ],
  },
  {
    heading: 'DNS Resolution',
    points: [
      'Client → Recursive resolver → Root nameserver → TLD nameserver → Authoritative nameserver.',
      'TTL controls how long the resolved IP is cached. Low TTL (60s) = fast failover; high TTL (3600s) = less DNS traffic.',
      'Anycast routing: multiple servers share the same IP; traffic routes to the nearest one. Used by CDNs and DNS providers.',
      'DNS-based load balancing: return multiple A records; client picks one (weighted, round-robin, or geo-based).',
    ],
  },
  {
    heading: 'Load Balancers',
    points: [
      'L4 (transport layer): routes by IP + TCP port. Fast, low overhead. Cannot inspect HTTP content.',
      'L7 (application layer): routes by URL path, headers, cookies. Enables path-based routing, A/B testing, auth.',
      'Hardware LBs (F5, Citrix): high throughput, expensive. Software LBs (nginx, HAProxy, AWS ALB): flexible, cheap.',
      'Health checks: LB polls backends; removes unhealthy nodes from rotation.',
    ],
  },
  {
    heading: 'CDN Architecture',
    points: [
      'PoP (Point of Presence): edge server colocated near users. Reduces cross-ocean latency from 150ms to 5ms.',
      'Origin pull: CDN fetches from origin on cache miss, then caches for subsequent requests.',
      'Origin push: you push content to CDN proactively (large files, known-popular content).',
      'Cache-Control: max-age sets browser cache TTL; s-maxage sets CDN TTL; stale-while-revalidate serves stale while fetching fresh.',
    ],
  },
  {
    heading: 'Real-time communication',
    points: [
      'Short polling: client polls every N seconds. Simple; wasteful at low event frequency.',
      'Long polling: client holds connection open; server responds when event occurs. Better than short polling.',
      'Server-Sent Events (SSE): server pushes a stream; client cannot send. Good for unidirectional (notifications, logs).',
      'WebSockets: full-duplex persistent connection. Best for bidirectional (chat, collaborative editors, live trading).',
    ],
  },
];

const codeTabs: CodeTab[] = [
  {
    label: 'TCP vs UDP Choice',
    language: 'typescript',
    code: `// When to choose TCP vs UDP

const networkingGuide = {
  TCP: {
    useCases: ['REST APIs', 'Database connections', 'Email (SMTP)', 'File transfers', 'SSH'],
    pros: ['Guaranteed delivery', 'Ordered', 'Error detection & correction'],
    cons: ['3-way handshake overhead', 'Head-of-line blocking', 'Higher latency'],
  },
  UDP: {
    useCases: ['DNS queries', 'Video streaming', 'Online gaming', 'VoIP', 'IoT telemetry'],
    pros: ['No handshake — ultra-low latency', 'No head-of-line blocking', 'Broadcast/multicast support'],
    cons: ['No guaranteed delivery', 'Packets may arrive out of order', 'App must handle retries'],
  },
  QUIC: {
    useCases: ['HTTP/3', 'Google services', 'Mobile apps (frequent network changes)'],
    pros: ['UDP speed + built-in reliability', '0-RTT reconnect', 'Stream multiplexing without HOL blocking'],
    cons: ['UDP often blocked by firewalls', 'Newer — less tooling support'],
  },
};`,
  },
  {
    label: 'DNS Record Types',
    language: 'bash',
    code: `# DNS record types and their use cases

# A record — maps hostname to IPv4 address
api.example.com.  300  IN  A  52.1.2.3

# AAAA record — IPv6
api.example.com.  300  IN  AAAA  2001:db8::1

# CNAME — alias (cannot be used on root domain)
www.example.com.  300  IN  CNAME  api.example.com.

# MX — mail exchanger
example.com.  3600  IN  MX  10  mail.example.com.

# TXT — arbitrary text (SPF, DKIM, domain verification)
example.com.  IN  TXT  "v=spf1 include:_spf.google.com ~all"

# TTL strategy
# Low TTL (60s)   → use before planned DNS changes, failover scenarios
# High TTL (3600s) → stable, reduces resolver load

# dig to inspect:
# dig api.example.com A
# dig api.example.com +trace  # shows full resolution chain`,
  },
  {
    label: 'WebSocket vs SSE',
    language: 'typescript',
    code: `// Real-time communication patterns

// Server-Sent Events (SSE) — server to client only
// Good for: live scores, notifications, log streaming
const eventSource = new EventSource('/api/live-feed');
eventSource.onmessage = (e) => console.log('Update:', e.data);
eventSource.onerror = () => eventSource.close();

// WebSocket — full-duplex
// Good for: chat, collaborative editing, live trading, multiplayer
const ws = new WebSocket('wss://api.example.com/socket');
ws.onopen = () => ws.send(JSON.stringify({ type: 'join', room: 'general' }));
ws.onmessage = (e) => console.log('Received:', JSON.parse(e.data));

// Decision matrix:
// Unidirectional push     → SSE (simpler, auto-reconnect built in)
// Bidirectional           → WebSocket
// Infrequent updates      → Long polling (< 1 update/sec)
// Very frequent (<10ms)   → WebSocket or UDP-based (gaming)`,
  },
];

const mistakes: CommonMistake[] = [
  {
    title: 'Using WebSockets for one-way notification streams',
    wrong: `// Setting up full WebSocket for push-only notifications`,
    right: `// Use Server-Sent Events for unidirectional streams:
const es = new EventSource('/notifications');
es.onmessage = e => showNotification(e.data);
// SSE has auto-reconnect, HTTP/2 multiplexing, simpler infra`,
    explanation: 'WebSockets add complexity (auth tokens in URL, connection state, proxy issues). SSE is simpler for server-to-client-only flows and works over standard HTTP.',
  },
  {
    title: 'Setting DNS TTL too high before migrations',
    wrong: `// Changing server IP with TTL=86400 (1 day)
// Users stuck on old IP for up to 24 hours`,
    right: `// Lower TTL to 60s at least 24 hours BEFORE migration:
// Day -1: set TTL=60
// Day 0: change IP → propagates in 60 seconds
// Day +1: raise TTL back to 3600`,
    explanation: 'DNS TTL is cached by resolvers. Change TTL well in advance of migrations. Sudden IP changes with high TTL = extended outage for some users.',
  },
  {
    title: 'Confusing L4 and L7 load balancers',
    wrong: `// Using L4 LB to route /api to one service and /web to another`,
    right: `// L4 LB routes by IP:port only — cannot inspect URLs
// Use L7 LB (nginx, AWS ALB) for path-based routing:
// /api/* → api-service
// /web/* → web-service`,
    explanation: 'L4 LBs operate at TCP level and are unaware of HTTP. Path-based routing, sticky sessions, and JWT inspection all require an L7 LB.',
  },
  {
    title: 'Not configuring CDN cache-control headers',
    wrong: `// API response with no Cache-Control header
// CDN caches for default TTL (often 0 or varies by CDN)`,
    right: `// Set explicit headers:
// Cache-Control: public, max-age=3600, s-maxage=86400
// Cache-Control: private (user-specific, don't cache at CDN)
// Cache-Control: no-store (never cache — sensitive data)`,
    explanation: 'Without explicit cache-control, CDN behaviour is unpredictable. Sensitive endpoints may be cached publicly; cacheable assets may not be cached at all.',
  },
];

const challenge: Challenge = {
  title: 'Design the networking layer for a global e-commerce site',
  language: 'typescript',
  description: `Design the networking architecture for a global e-commerce site serving 50M DAU across 5 continents.

Requirements:
- Product pages: < 50ms P99 latency globally
- Checkout API: secure, idempotent, < 200ms P99
- Live inventory updates: < 1 second delay
- 99.99% uptime target

Design decisions needed:
1. Where does TLS terminate?
2. Which CDN strategy for product pages?
3. L4 vs L7 load balancing and where?
4. How to deliver live inventory updates?
5. How do you handle DNS failover?`,
  hints: [
    'TLS termination at CDN edge reduces handshake latency for global users',
    'Static product pages → CDN + origin pull with long max-age',
    'Checkout must not be cached — how do you ensure that?',
    'Live inventory: SSE or WebSocket? Consider read:write ratio',
    'Route 53 health checks + failover routing for DNS-level HA',
  ],
  starterCode: `interface NetworkingArchitecture {
  tlsTermination: string;
  cdnStrategy: string;
  loadBalancer: string;
  realtimeProtocol: string;
  dnsFailover: string;
}

// Fill in your design decisions:
const architecture: NetworkingArchitecture = {
  tlsTermination: '',
  cdnStrategy: '',
  loadBalancer: '',
  realtimeProtocol: '',
  dnsFailover: '',
};`,
  solution: `const architecture = {
  tlsTermination: 'Cloudflare edge PoPs — terminates TLS at nearest edge, proxies to origin over private backbone. Reduces TLS handshake from 150ms → 5ms for global users.',

  cdnStrategy: 'Origin pull for product pages. Cache-Control: s-maxage=3600, stale-while-revalidate=60. Purge on inventory/price change via CDN API. Checkout /api/checkout: Cache-Control: no-store — never cached.',

  loadBalancer: 'L7 (AWS ALB): path routing /api → microservices, /* → frontend. Health checks every 5s; deregister unhealthy. L4 (NLB) in front of ALB for DDoS absorption and static IP requirements.',

  realtimeProtocol: 'SSE for inventory counters (server push only, simple, multiplexed over HTTP/2). WebSocket only for checkout confirmation flow where bidirectional needed.',

  dnsFailover: 'Route 53 with health checks. Active-active across 2 regions. Latency-based routing + failover: if primary region health check fails, R53 switches to secondary in < 30s. TTL=30s for fast cutover.',
};`,
};

const quiz: QuizQuestion[] = [
  {
    q: 'Which protocol is used by DNS queries by default?',
    options: ['TCP', 'UDP', 'HTTP', 'QUIC'],
    answer: 1,
    explanation: 'DNS uses UDP port 53 by default for speed. It falls back to TCP for responses > 512 bytes or for zone transfers. DNS over HTTPS (DoH) and DNS over TLS (DoT) are encrypted alternatives.',
  },
  {
    q: 'What is the key advantage of HTTP/3 over HTTP/2?',
    options: ['Better compression', 'No TCP head-of-line blocking', 'TLS 1.3 support', 'Binary framing'],
    answer: 1,
    explanation: 'HTTP/2 multiplexes streams over one TCP connection — a single lost packet blocks ALL streams (TCP HOL blocking). HTTP/3 uses QUIC (UDP), where packet loss only blocks the affected stream.',
  },
  {
    q: 'Which technology is most appropriate for a server-to-client notification stream?',
    options: ['WebSocket', 'Long polling', 'Server-Sent Events', 'HTTP/2 push'],
    answer: 2,
    explanation: 'SSE provides a persistent HTTP connection for server push with auto-reconnect, works through HTTP/2 multiplexing, and is simpler than WebSocket for unidirectional streams.',
  },
  {
    q: 'An L7 load balancer can route requests based on which of these?',
    options: ['Source IP only', 'TCP port only', 'HTTP path and headers', 'MAC address'],
    answer: 2,
    explanation: 'L7 (application layer) LBs inspect HTTP content: URL paths, request headers, cookies, query strings. This enables path-based routing, sticky sessions, and A/B testing.',
  },
];

const qna: QnaItem[] = [
  {
    q: 'When should I NOT use a CDN?',
    a: 'For personalised or user-specific content, authenticated API responses, or real-time data that changes faster than CDN TTL. Also avoid CDN for very low-latency internal microservice calls where CDN adds a hop.',
  },
  {
    q: 'What is anycast routing and when is it used?',
    a: 'Anycast assigns the same IP address to multiple servers globally. Traffic is routed to the topologically nearest server by BGP. CDNs and DNS providers (Cloudflare, Google 8.8.8.8) use anycast to deliver ultra-low latency without DNS-based geo-routing.',
  },
  {
    q: 'How does TLS 1.3 improve on TLS 1.2?',
    a: 'TLS 1.3 reduces the handshake from 2 round trips (2-RTT) to 1 RTT, eliminating weak cipher suites, and supports 0-RTT resumption for returning clients. This cuts connection setup latency by ~150ms for cross-region connections.',
  },
];

const revision: RevisionSummary = {
  oneLiner: 'TCP = reliable ordered delivery; UDP = fast best-effort. CDN, DNS, and L7 LBs form the global distribution layer.',
  mustKnow: [
    'TCP: 3-way handshake, guaranteed delivery; UDP: no handshake, best-effort',
    'DNS: A/CNAME/MX/TXT records; lower TTL before migrations',
    'L4 LB: routes by IP+port; L7 LB: routes by HTTP path/headers',
    'HTTP/3 (QUIC): UDP-based, eliminates TCP HOL blocking',
    'SSE: server→client push; WebSocket: bidirectional full-duplex',
    'Anycast: same IP → nearest server (CDN, DNS)',
  ],
  interviewFocus: [
    'Know when to use WebSocket vs SSE vs long polling',
    'Explain CDN cache-control header strategy for your design',
    'State TLS termination point — CDN edge vs LB vs app server',
    'DNS TTL change strategy for zero-downtime migrations',
  ],
};

@Component({
  selector: 'app-sysdesign-networking',
  standalone: true,
  imports: [CommonModule, PageMetaComponent, QuickRefComponent, TheoryBlockComponent, CodeBlockComponent,
    CommonMistakesComponent, ChallengeBlockComponent, QuizBlockComponent, QnaBlockComponent,
    RevisionCardComponent, PageCompleteComponent],
  templateUrl: './networking.html',
  styleUrl: './networking.scss',
})
export class SysdesignNetworking {
  quickRef = quickRef;
  theory = theory;
  codeTabs = codeTabs;
  mistakes = mistakes;
  challenge = challenge;
  quiz = quiz;
  qna = qna;
  revision = revision;
}
