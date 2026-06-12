import { Component } from '@angular/core';

interface GuideRow { criterion: string; optA: string; optB: string; }
interface Guide { title: string; optA: string; optB: string; rows: GuideRow[]; rule: string; }

@Component({
  selector: 'app-aspnet-decision-guides',
  standalone: true,
  imports: [],
  templateUrl: './decision-guides.html',
  styleUrl: './decision-guides.scss',
})
export class AspnetDecisionGuides {
  guides: Guide[] = [
    {
      title: 'Minimal APIs vs Controllers',
      optA: 'Minimal APIs', optB: 'Controllers',
      rows: [
        { criterion: 'Ceremony / boilerplate', optA: '✓ Minimal',         optB: '~ More verbose' },
        { criterion: 'AOT-compatible',          optA: '✓ Yes',             optB: '~ Partial (.NET 9+)' },
        { criterion: 'Action filters',          optA: '~ Endpoint filters', optB: '✓ Full filter pipeline' },
        { criterion: 'Large API surface',       optA: '~ Can get messy',   optB: '✓ Convention-organised' },
        { criterion: 'OpenAPI inference',       optA: '✓ TypedResults',    optB: '✓ ProducesResponseType' },
        { criterion: 'Test isolation',          optA: '✓ Easy',            optB: '✓ Easy' },
        { criterion: '.NET version',            optA: '.NET 6+',           optB: 'All versions' },
      ],
      rule: 'Rule of thumb: Start with Minimal APIs for new projects. Switch to controllers when you need complex action filter chains or when a large team needs convention-driven file organisation.',
    },
    {
      title: 'Cookie Auth vs JWT',
      optA: 'Cookie Auth', optB: 'JWT (Bearer)',
      rows: [
        { criterion: 'Session storage',          optA: '✓ Stateless (encrypted cookie)', optB: '✓ Stateless (token)' },
        { criterion: 'Browser-first',            optA: '✓ Automatic header management',  optB: '✗ JS must manage token' },
        { criterion: 'Mobile / SPA / API',       optA: '~ Requires CSRF protection',     optB: '✓ Natural fit' },
        { criterion: 'Revocation',               optA: '✓ Server can expire cookie',     optB: '✗ Token valid until expiry' },
        { criterion: 'Cross-origin (CORS)',       optA: '✗ Same-origin required',         optB: '✓ Works cross-origin' },
        { criterion: 'Microservice auth',        optA: '✗ Not suitable',                 optB: '✓ Pass token between services' },
        { criterion: 'Refresh token support',    optA: '~ Built-in sliding expiry',      optB: '~ Manual refresh endpoint' },
      ],
      rule: 'Rule of thumb: Use cookies for server-rendered apps and SPAs on the same origin. Use JWT for mobile apps, cross-origin SPAs, and microservices where the API is consumed by multiple clients.',
    },
    {
      title: 'REST vs gRPC',
      optA: 'REST (HTTP/JSON)', optB: 'gRPC (HTTP/2 + Protobuf)',
      rows: [
        { criterion: 'Browser support',          optA: '✓ Native',                    optB: '~ grpc-web + proxy needed' },
        { criterion: 'Human-readable payload',   optA: '✓ JSON',                      optB: '✗ Binary Protobuf' },
        { criterion: 'Performance / payload size',optA: '~ JSON overhead',             optB: '✓ ~5× smaller, faster' },
        { criterion: 'Schema / contract',        optA: '~ OpenAPI (opt-in)',           optB: '✓ .proto (required)' },
        { criterion: 'Streaming',                optA: '~ SSE / WebSocket (separate)', optB: '✓ Bidirectional streaming' },
        { criterion: 'Service-to-service',        optA: '✓ Works',                    optB: '✓ Preferred for high-throughput' },
        { criterion: 'Public API',               optA: '✓ Standard',                  optB: '✗ Less common' },
      ],
      rule: 'Rule of thumb: Use REST for public APIs and browser clients. Use gRPC for internal service-to-service communication where performance, streaming, or strict contracts matter.',
    },
    {
      title: 'IMemoryCache vs IDistributedCache',
      optA: 'IMemoryCache', optB: 'IDistributedCache (Redis)',
      rows: [
        { criterion: 'Multi-instance (k8s)',  optA: '✗ Each instance has own cache', optB: '✓ Shared across instances' },
        { criterion: 'Complexity',            optA: '✓ Zero infrastructure',          optB: '~ Requires Redis' },
        { criterion: 'Performance',           optA: '✓ In-process, fastest',          optB: '~ Network round-trip' },
        { criterion: 'Cache size',            optA: '~ Limited by process memory',    optB: '✓ Separate scalable store' },
        { criterion: 'Eviction on restart',   optA: '✗ Lost on restart',             optB: '✓ Persists' },
        { criterion: 'Complex objects',       optA: '✓ Any .NET object',              optB: '~ Must serialize to bytes' },
      ],
      rule: 'Rule of thumb: IMemoryCache for single-instance apps or non-critical caching. IDistributedCache (Redis) whenever you run more than one instance or need cache to survive restarts.',
    },
    {
      title: 'Transient vs Scoped vs Singleton',
      optA: 'Scoped / Transient', optB: 'Singleton',
      rows: [
        { criterion: 'Stateful (request-only state)', optA: '✓ Scoped is correct',     optB: '✗ Shared across requests' },
        { criterion: 'Stateless utility class',       optA: '✓ Transient or Singleton', optB: '✓ Most efficient' },
        { criterion: 'DbContext / EF Core',            optA: '✓ Scoped only',           optB: '✗ Not thread-safe' },
        { criterion: 'HttpClient / IHttpClientFactory',optA: '~ Correct via factory',   optB: '✓ Singleton via factory' },
        { criterion: 'Background worker',             optA: '~ Must create own scope',  optB: '✓ Natural fit' },
        { criterion: 'Memory usage',                  optA: 'Transient: ~most allocs',  optB: '✓ Single instance' },
      ],
      rule: 'Rule of thumb: When in doubt, Scoped is the safest default. Use Singleton only for demonstrably stateless, thread-safe services. Never inject Scoped into Singleton.',
    },
    {
      title: 'EF Core vs Dapper',
      optA: 'EF Core', optB: 'Dapper',
      rows: [
        { criterion: 'CRUD / standard queries',  optA: '✓ No SQL needed',             optB: '~ Manual SQL' },
        { criterion: 'Complex reporting SQL',    optA: '~ Translation can be poor',   optB: '✓ Raw SQL, full control' },
        { criterion: 'Migrations',               optA: '✓ Built-in',                  optB: '✗ Manual / Flyway' },
        { criterion: 'Performance (bulk reads)', optA: '~ Change tracker overhead',   optB: '✓ Less overhead' },
        { criterion: 'Stored procedures',        optA: '~ Possible but awkward',      optB: '✓ Natural fit' },
        { criterion: 'Learning curve',           optA: '~ Higher',                    optB: '✓ SQL knowledge sufficient' },
        { criterion: 'Domain-driven design',     optA: '✓ Entity mapping, nav props', optB: '✗ No relationships' },
      ],
      rule: 'Rule of thumb: Use EF Core as the default. Add Dapper alongside it for specific complex queries or reporting. They coexist on the same connection string without conflict.',
    },
    {
      title: 'Background Service vs IHostedService',
      optA: 'BackgroundService', optB: 'IHostedService',
      rows: [
        { criterion: 'Ease of use',               optA: '✓ Override ExecuteAsync only',   optB: '~ Implement Start/Stop' },
        { criterion: 'Periodic work (timer loop)',  optA: '✓ PeriodicTimer inside loop',   optB: '~ Timer management manual' },
        { criterion: 'One-time startup task',       optA: '~ Possible but verbose',        optB: '✓ Clean StartAsync/StopAsync' },
        { criterion: 'Graceful shutdown',           optA: '✓ CancellationToken built-in',  optB: '✓ StopAsync receives token' },
        { criterion: 'Inheritance',                 optA: '✓ BackgroundService is base',    optB: '~ Implement interface' },
        { criterion: 'Complex state machine',       optA: '~ Can get messy',               optB: '✓ Explicit Start/Stop' },
      ],
      rule: 'Rule of thumb: Use BackgroundService for everything — it is BackgroundService derives from IHostedService anyway. Use raw IHostedService only for one-time startup/shutdown tasks like database seeding.',
    },
    {
      title: 'WebSocket vs SignalR',
      optA: 'Raw WebSocket', optB: 'SignalR',
      rows: [
        { criterion: 'Setup complexity',            optA: '~ Manual frame handling',    optB: '✓ Hub abstraction' },
        { criterion: 'Transport negotiation',       optA: '✗ WebSocket only',           optB: '✓ WS → SSE → long-poll' },
        { criterion: 'Groups / rooms',              optA: '✗ Manual',                   optB: '✓ Built-in Groups API' },
        { criterion: 'Scale-out (Redis)',            optA: '✗ Manual',                   optB: '✓ AddStackExchangeRedis()' },
        { criterion: 'Browser client library',      optA: '~ Native API, verbose',      optB: '✓ @microsoft/signalr' },
        { criterion: 'Custom binary protocol',      optA: '✓ Full control',             optB: '✗ JSON/MessagePack only' },
        { criterion: 'Overhead',                    optA: '✓ Minimal',                  optB: '~ Slight overhead' },
      ],
      rule: 'Rule of thumb: Use SignalR for chat, notifications, and dashboards. Use raw WebSockets only when you need a custom binary protocol or integration with a system that speaks WebSocket natively.',
    },
  ];
}
