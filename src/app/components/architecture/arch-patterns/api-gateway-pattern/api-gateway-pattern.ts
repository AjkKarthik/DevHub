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
  selector: 'app-arch-api-gateway-pattern',
  standalone: true,
  imports: [CommonModule, PageMetaComponent, QuickRefComponent, TheoryBlockComponent,
    CodeBlockComponent, CommonMistakesComponent, ChallengeBlockComponent, QuizBlockComponent,
    QnaBlockComponent, RevisionCardComponent, PageCompleteComponent],
  templateUrl: './api-gateway-pattern.html',
  styleUrl: './api-gateway-pattern.scss',
})
export class ArchApiGatewayPattern {

  quickRef: QuickRefItem[] = [
    { name: 'API Gateway', type: 'keyword', desc: 'Single entry point for all clients — routing, auth, rate limiting, aggregation' },
    { name: 'BFF', type: 'keyword', desc: 'Backend for Frontend — a dedicated gateway per client type (mobile, web, third-party)' },
    { name: 'Route Aggregation', type: 'keyword', desc: 'One client request fans out to multiple services; gateway combines responses' },
    { name: 'Rate Limiting', type: 'keyword', desc: 'Throttle requests per client/IP/API key to protect downstream services' },
    { name: 'Auth Gateway', type: 'keyword', desc: 'Centralised authentication/authorisation at the gateway edge — services trust forwarded identity' },
    { name: 'YARP', type: 'keyword', desc: 'Yet Another Reverse Proxy — .NET library for building custom API gateways' },
    { name: 'Ocelot', type: 'keyword', desc: '.NET API gateway library with routing, rate limiting, and load balancing' },
  ];

  theory: TheoryPoint[] = [
    {
      heading: 'Why an API Gateway?',
      points: [
        'Without a gateway, every client must know the address of every microservice — N clients × M services = N×M coupling.',
        'The gateway provides a single stable URL for all clients. Internal service addresses are hidden and can change freely.',
        'Cross-cutting concerns (auth, rate limiting, logging, SSL termination, CORS) are handled once at the gateway, not in every service.',
        'The gateway can aggregate multiple service responses into one client-friendly payload, reducing round trips.',
      ],
    },
    {
      heading: 'Backend for Frontend (BFF)',
      points: [
        'A generic gateway serving all clients tends to return a one-size-fits-all response that is too large for mobile and too small for desktop.',
        'BFF: each client type gets its own gateway that is optimised for that client\'s needs.',
        'Mobile BFF: smaller payloads, offline-friendly formats, fewer fields.',
        'Web BFF: can aggregate more data, richer responses, server-side rendering support.',
        'Third-party BFF: stable, versioned public API — less frequent changes than internal BFFs.',
      ],
    },
    {
      heading: 'Gateway Pitfalls',
      points: [
        'The gateway should not contain business logic — it is a routing and cross-cutting concern layer.',
        'A single gateway is a single point of failure and a throughput bottleneck — deploy multiple instances behind a load balancer.',
        'Avoid "gateway bloat": feature creep that moves domain logic into the gateway makes it a distributed monolith.',
        'Use managed gateways (Kong, NGINX, AWS API Gateway, Azure API Management) before building your own.',
      ],
    },
    {
      heading: 'API Gateway as a Single Entry Point — Benefits and Risks',
      points: [
        'Centralizing cross-cutting concerns (authentication, rate limiting, request logging, TLS termination) at the gateway avoids duplicating that logic across every individual microservice, which would otherwise need to reimplement the same concerns repeatedly.',
        'The gateway also simplifies the client\'s view of the system — a client calls one well-known endpoint rather than needing to know the internal topology and individual addresses of every backend microservice, which can change independently over time.',
        'The tradeoff is that the gateway becomes a single point of failure and a potential bottleneck — if the gateway goes down or becomes overloaded, the entire system becomes unreachable regardless of individual backend service health, making gateway resilience and scaling a critical operational concern.',
        'An overloaded or poorly designed gateway can also become a "distributed monolith" risk — if business logic creeps into the gateway itself (beyond routing and cross-cutting concerns), it recreates tight coupling between services that microservices architecture was meant to avoid.',
      ],
    },
    {
      heading: 'Gateway Aggregation and Composition Patterns',
      points: [
        'An API gateway can aggregate responses from multiple backend services into a single client-facing response, reducing the number of round-trips a client (especially a mobile client on a slow network) needs to make compared to calling each backend service directly.',
        'This aggregation logic introduces a new failure mode — if one of several aggregated backend calls fails or times out, the gateway must decide whether to fail the entire request or degrade gracefully by returning partial data, a design decision that should be explicit rather than accidental.',
        'GraphQL gateways take aggregation further by letting clients specify exactly which fields they need across multiple underlying services in a single query, reducing both over-fetching and the number of gateway-level aggregation endpoints that need to be hand-written.',
        'Aggregation at the gateway should be reserved for genuinely client-driven composition needs — pushing too much orchestration logic into the gateway risks recreating the same tight coupling and complexity concentration that a well-decomposed set of backend services was meant to avoid.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'YARP Route Config',
      language: 'typescript',
      code: `// appsettings.json — YARP reverse proxy config (.NET)
{
  "ReverseProxy": {
    "Routes": {
      "orders-route": {
        "ClusterId": "orders-cluster",
        "Match": { "Path": "/api/orders/{**catch-all}" },
        "Transforms": [{ "PathRemovePrefix": "/api" }]
      },
      "catalog-route": {
        "ClusterId": "catalog-cluster",
        "Match": { "Path": "/api/catalog/{**catch-all}" },
        "Transforms": [{ "PathRemovePrefix": "/api" }]
      }
    },
    "Clusters": {
      "orders-cluster": {
        "Destinations": {
          "primary": { "Address": "http://order-service:8080/" }
        }
      },
      "catalog-cluster": {
        "Destinations": {
          "primary": { "Address": "http://catalog-service:8081/" }
        }
      }
    }
  }
}`
    },
    {
      label: 'Request Aggregation',
      language: 'typescript',
      code: `// Gateway aggregates 3 service calls into 1 client response
// Client: GET /api/dashboard  → returns orders + catalog + user in one response

interface DashboardResponse {
  recentOrders: Order[];
  featuredProducts: Product[];
  userProfile: UserProfile;
}

async function getDashboard(userId: string): Promise<DashboardResponse> {
  // Fan out all 3 calls in parallel — total latency = slowest call, not sum
  const [orders, products, profile] = await Promise.all([
    orderService.getRecentOrders(userId),
    catalogService.getFeaturedProducts(),
    userService.getProfile(userId),
  ]);

  return {
    recentOrders: orders.slice(0, 5),
    featuredProducts: products.slice(0, 10),
    userProfile: profile,
  };
}

// Without aggregation: client makes 3 separate HTTP round trips
// With aggregation: 1 round trip, all data in one response`
    },
    {
      label: 'Auth + Rate Limiting Middleware',
      language: 'typescript',
      code: `// Gateway middleware pipeline: Auth → RateLimit → Route
import express from 'express';
import { createProxyMiddleware } from 'http-proxy-middleware';

const app = express();

// 1. Auth middleware — validate JWT; services trust X-User-Id header
app.use(async (req, res, next) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ error: 'Unauthorized' });

  try {
    const claims = await verifyJwt(token, process.env.JWT_SECRET!);
    req.headers['x-user-id'] = claims.sub;
    req.headers['x-user-roles'] = claims.roles.join(',');
    delete req.headers.authorization; // don't forward raw token
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid token' });
  }
});

// 2. Rate limiting — 100 req/min per user
const rateLimiter = new Map<string, { count: number; reset: number }>();
app.use((req, res, next) => {
  const userId = req.headers['x-user-id'] as string;
  const now = Date.now();
  const entry = rateLimiter.get(userId) ?? { count: 0, reset: now + 60_000 };

  if (now > entry.reset) { entry.count = 0; entry.reset = now + 60_000; }
  if (entry.count >= 100) return res.status(429).json({ error: 'Rate limit exceeded' });

  entry.count++;
  rateLimiter.set(userId, entry);
  next();
});

// 3. Route to upstream services
app.use('/api/orders',  createProxyMiddleware({ target: 'http://order-service:8080' }));
app.use('/api/catalog', createProxyMiddleware({ target: 'http://catalog-service:8081' }));`
    },
  ];

  mistakes: CommonMistake[] = [
    {
      title: 'Putting business logic in the gateway',
      wrong: `// Gateway calculates discount and modifies order total before forwarding`,
      right: `// Gateway routes the request; Order Service applies the discount`,
      explanation: 'Business logic in the gateway creates a hidden dependency. Services cannot be called directly without the gateway transforming data, breaking testability.',
    },
    {
      title: 'Single gateway instance (no HA)',
      wrong: `// One gateway pod, no replicas`,
      right: `// 3+ gateway replicas behind a cloud load balancer with health checks`,
      explanation: 'The gateway is the entry point for all traffic. A single instance is a single point of failure. Deploy multiple replicas with auto-scaling.',
    },
    {
      title: 'Forwarding raw JWT tokens to downstream services',
      wrong: `// Gateway forwards Authorization: Bearer <token> to every service`,
      right: `// Gateway validates JWT, extracts claims, forwards X-User-Id and X-User-Roles headers`,
      explanation: 'Downstream services should not need to validate tokens themselves — that duplicates JWT validation logic and requires every service to have the signing secret.',
    },
    {
      title: 'One gateway serving all client types with the same response shape',
      wrong: `// GET /api/orders returns 50 fields — mobile gets fields it never uses`,
      right: `// Mobile BFF: GET /api/orders returns 8 fields needed for the mobile list view`,
      explanation: 'Over-fetching wastes mobile bandwidth and battery. BFF pattern: each client gets responses shaped to its exact needs.',
    },
  ];

  challenge: Challenge = {
    title: 'Build a Minimal BFF for Mobile',
    language: 'typescript',
    description: `A mobile app needs a single endpoint GET /mobile/home that returns:
- last 3 orders (id, status, total only)
- 4 featured products (id, name, price only)

Two upstream services exist:
- orderService.getOrders(userId): returns full Order objects
- catalogService.getFeatured(): returns full Product objects

Write the BFF handler that aggregates and shapes the response.`,
    hints: [
      'Run both calls in parallel with Promise.all',
      'Map to slim DTOs — mobile only needs a subset of fields',
      'Return a single combined object',
    ],
    starterCode: `interface MobileOrder { id: string; status: string; total: number; }
interface MobileProduct { id: string; name: string; price: number; }
interface MobileHomeResponse { orders: MobileOrder[]; featured: MobileProduct[]; }

// Simulated upstream services
const orderService = { getOrders: async (userId: string) =>
  [{ id: '1', customerId: userId, status: 'shipped', total: 99, address: '123 St', createdAt: '2024-01-01' }] };
const catalogService = { getFeatured: async () =>
  [{ id: 'p1', name: 'Widget', price: 19.99, description: 'A widget', stock: 50, category: 'tools' }] };

async function getMobileHome(userId: string): Promise<MobileHomeResponse> {
  // TODO: aggregate and shape
}`,
    solution: `interface MobileOrder { id: string; status: string; total: number; }
interface MobileProduct { id: string; name: string; price: number; }
interface MobileHomeResponse { orders: MobileOrder[]; featured: MobileProduct[]; }

const orderService = { getOrders: async (userId: string) =>
  [{ id: '1', customerId: userId, status: 'shipped', total: 99, address: '123 St', createdAt: '2024-01-01' }] };
const catalogService = { getFeatured: async () =>
  [{ id: 'p1', name: 'Widget', price: 19.99, description: 'A widget', stock: 50, category: 'tools' }] };

async function getMobileHome(userId: string): Promise<MobileHomeResponse> {
  const [orders, products] = await Promise.all([
    orderService.getOrders(userId),
    catalogService.getFeatured(),
  ]);

  return {
    orders: orders.slice(0, 3).map(o => ({ id: o.id, status: o.status, total: o.total })),
    featured: products.slice(0, 4).map(p => ({ id: p.id, name: p.name, price: p.price })),
  };
}

getMobileHome('user-123').then(r => console.log(JSON.stringify(r, null, 2)));`,
  };

  quiz: QuizQuestion[] = [
    {
      q: 'What problem does the BFF pattern solve?',
      options: [
        'Database connection pooling',
        'A generic API returning too much or too little data for each client type',
        'Service discovery',
        'Database schema migration',
      ],
      answer: 1,
      explanation: 'BFF gives each client (mobile, web, third-party) its own gateway with responses shaped to exactly what that client needs.',
    },
    {
      q: 'What should an API gateway NOT do?',
      options: [
        'Rate limiting',
        'JWT validation',
        'Apply business logic like discount calculation',
        'Route requests to upstream services',
      ],
      answer: 2,
      explanation: 'The gateway handles cross-cutting concerns — routing, auth, rate limiting. Business logic belongs in the services themselves.',
    },
    {
      q: 'Why deploy multiple gateway replicas?',
      options: [
        'To reduce the number of services',
        'To avoid a single point of failure and handle higher traffic',
        'To enable different programming languages',
        'To simplify service discovery',
      ],
      answer: 1,
      explanation: 'The gateway sits in the critical path of all traffic. A single instance is a SPOF and a throughput bottleneck.',
    },
    { q: 'What problems does an API gateway solve in a microservices architecture?', options: ['It eliminates the need for load balancing across services', 'It provides a single entry point for clients, handling cross-cutting concerns like auth, rate limiting, routing, and protocol translation', 'It replaces service-to-service communication with direct database access', 'It automatically discovers and registers new microservices without configuration'], answer: 1, explanation: 'Without an API gateway, clients must know about every microservice and handle cross-cutting concerns themselves. An API gateway solves: client-facing routing (route /users to the user service, /orders to the order service), authentication and authorization (validate tokens before forwarding requests), rate limiting (protect services from traffic spikes), SSL termination (decrypt HTTPS at the gateway), protocol translation (convert REST to gRPC internally), response aggregation (combine multiple service calls into one client response), and caching of frequent responses.' },
    { q: 'What is the difference between an API gateway and a load balancer?', options: ['They are identical components with different names in different contexts', 'A load balancer distributes traffic across identical instances of one service; an API gateway routes to different services based on request content and enforces cross-cutting policies', 'An API gateway operates at Layer 4; a load balancer at Layer 7', 'Load balancers handle authentication; API gateways handle routing only'], answer: 1, explanation: 'A load balancer distributes traffic across multiple identical instances of the same service for capacity scaling and redundancy. It typically operates at the transport or network layer and has no application-level knowledge. An API gateway operates at the application layer and understands HTTP semantics: it routes different requests to different services based on path, headers, or body content, enforces authentication and authorization policies, transforms requests and responses, and aggregates multiple backend calls. An API gateway typically sits in front of load balancers for each downstream service.' },
    { q: 'What is request aggregation in the context of an API gateway?', options: ['Batching multiple requests from the same client into a single network call', 'The gateway makes multiple calls to different backend services and merges the results into a single response for the client', 'Caching responses and serving multiple clients with the same cached result', 'Compressing the request body before forwarding it to backend services'], answer: 1, explanation: 'Request aggregation (also called API composition) allows the gateway to call multiple microservices and compose the results into a single client response. A mobile client might need data from the user service, order service, and recommendation service to render a home screen. Instead of making three separate calls, the client calls one gateway endpoint; the gateway fans out to all three services in parallel, waits for responses, and returns a composed object. This pattern reduces client-side complexity and mobile round trips, which are expensive on unreliable networks.' },
  ];

  qna: QnaItem[] = [
    {
      q: 'Does adding an API gateway eliminate the need for load balancers in front of each backend service?',
      a: 'No — this is a common misconception. The gateway and load balancers solve different problems at different layers and are typically used TOGETHER: the gateway routes a request to the correct SERVICE based on path/content, then a load balancer in front of that service distributes the request across its multiple running INSTANCES. Removing the load balancer would mean the gateway sends every request for a service to just one instance, eliminating the redundancy and horizontal scaling the load balancer provides.',
    },
    {
      q: 'When should I use a managed gateway (Kong, AWS API Gateway) vs building my own?',
      a: 'Use managed/off-the-shelf gateways first — they handle rate limiting, auth plugins, SSL, and observability out of the box. Build your own (YARP, Ocelot, custom Express) only when you need deep custom logic, cost optimisation at massive scale, or tight integration with your internal platform.',
    },
    {
      q: 'Can the gateway become a bottleneck?',
      a: 'Yes. All traffic flows through it. Mitigations: horizontal scaling (multiple replicas), async-capable gateway (HTTP/2), in-memory caching for rate limit counters and auth token validation, and avoiding synchronous fan-out inside the gateway on hot paths.',
    },
    { q: 'How do you handle authentication at the API gateway versus at each individual service?', a: 'Gateway-level auth: the gateway validates the authentication token (JWT or opaque) on every request. Valid tokens are forwarded to services with a trusted internal header containing the authenticated user identity. Services trust this header without re-validating the token. Advantage: token validation logic lives in one place. Risk: if a service is reachable without going through the gateway, it trusts the header with no authentication, requiring network policy enforcement. Service-level auth: each service validates the token independently. More defense-in-depth but duplicates validation logic and adds latency. In practice, combine both: gateway validates for external-facing endpoints, services check for internal service identity via mTLS or service account tokens.' },
    { q: 'How do you implement rate limiting at the API gateway?', a: 'Rate limiting at the gateway prevents a single client from overwhelming backend services. Implementation: use a sliding window counter per client IP or API key stored in Redis. On each request, increment the counter and check against the limit. Redis INCR is atomic and EXPIRE sets the window duration. Popular gateway products like Kong, AWS API Gateway, and Nginx Plus have built-in rate limiting plugins. Configure limits per tier: free tier gets 100 requests per minute, paid tier gets 10,000. Return 429 Too Many Requests with a Retry-After header when the limit is exceeded. Use token bucket for burst-friendly limiting or fixed window for simpler implementation. Rate limit on multiple dimensions: per IP, per user, and per endpoint.' },
    { q: 'What are the risks of using an API gateway as a single point of failure?', a: 'The API gateway becomes a SPOF if not designed for high availability. Mitigations: deploy multiple gateway instances behind a load balancer with health checks. Use a managed gateway service (AWS API Gateway, Google Cloud APIM) that the cloud provider operates with their SLA. Circuit breakers in the gateway prevent a failing backend from cascading into gateway unresponsiveness. Caching at the gateway allows some requests to be served even when backends are down. Monitor gateway health and latency as a critical metric. The gateway should be one of the most heavily monitored components because all traffic flows through it. Keep gateway logic lean: complex business logic in the gateway creates a coupling and deployment bottleneck.' },
  ];

  revision: RevisionSummary = {
    oneLiner: 'The API Gateway is the single entry point for all clients — it handles routing, auth, rate limiting, and aggregation so services do not have to.',
    mustKnow: [
      'Gateway: stable URL, hides internal service addresses, cross-cutting concerns in one place',
      'BFF: one gateway per client type — mobile, web, third-party — shaped responses',
      'Aggregation: fan out parallel calls; combine responses; one client round trip',
      'No business logic in the gateway — it is a routing and policy layer',
      'Deploy 3+ gateway replicas; it is a SPOF if you run one',
    ],
    interviewFocus: [
      'What is the BFF pattern and when would you use it?',
      'What cross-cutting concerns does a gateway handle — and what should it NOT do?',
      'How does a gateway differ from a load balancer?',
    ],
  };
}
