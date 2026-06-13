import { Component, signal, computed } from '@angular/core';
import { RouterLink } from '@angular/router';

interface Topic {
  title: string; description: string; route: string; badge: string; available: boolean; keyPoints: string[];
}

const BADGE_CSS: Record<string, string> = {
  'Foundations': 'foundations', 'Concurrency': 'concurrency', 'HTTP & APIs': 'http',
  'Data & Storage': 'data', 'Tooling': 'tooling', 'Patterns': 'patterns', 'Reference': 'reference',
};
const GROUP_ORDER = ['All', 'Foundations', 'Concurrency', 'HTTP & APIs', 'Data & Storage', 'Tooling', 'Patterns', 'Reference'];

const ALL_TOPICS: Topic[] = [
  { title: 'Go Fundamentals',           route: '/go', badge: 'Foundations', available: false,
    description: 'Variables, types, functions, control flow, pointers, and Go\'s simple-by-design philosophy.',
    keyPoints: [':= short variable declaration; var for package-level or zero-value init', 'Multiple return values: func divide(a, b int) (int, error)', 'defer: runs at function return — great for cleanup (file.Close(), mutex.Unlock())'] },
  { title: 'Structs & Interfaces',      route: '/go', badge: 'Foundations', available: false,
    description: 'Struct types, methods, interfaces, embedding, and Go\'s implicit interface satisfaction.',
    keyPoints: ['Interface satisfied implicitly — no "implements" keyword', 'Embedding: struct composition by including another struct without a field name', 'Empty interface (any): accepts any value — use with type switch to specialise'] },
  { title: 'Error Handling',            route: '/go', badge: 'Foundations', available: false,
    description: 'Go\'s error pattern, errors.Is/As, wrapping with %w, custom error types, and panic/recover.',
    keyPoints: ['if err != nil: idiomatic — always check returned errors', 'fmt.Errorf("context: %w", err): wrap for errors.Is/As traversal', 'panic: only for unrecoverable states; recover() in deferred function'] },
  { title: 'Slices & Maps',             route: '/go', badge: 'Foundations', available: false,
    description: 'Slice internals (len, cap, backing array), make, append, copy, map operations, and nil maps.',
    keyPoints: ['Slice is a descriptor: pointer + len + cap — appending may reallocate', 'Never range over a map for ordered output — maps are unordered', 'maps.Clone() and slices.Clone() in stdlib (Go 1.21+)'] },
  { title: 'Goroutines',                route: '/go', badge: 'Concurrency', available: false,
    description: 'Lightweight threads, the Go scheduler (M:N), goroutine leaks, and the cost of goroutine creation.',
    keyPoints: ['go fn(): spawns goroutine — 2KB stack, grows as needed', 'Goroutine leak: goroutine blocked forever, never garbage collected', 'GOMAXPROCS: number of OS threads; defaults to CPU count since Go 1.5'] },
  { title: 'Channels',                  route: '/go', badge: 'Concurrency', available: false,
    description: 'Buffered vs unbuffered channels, directional channels, select, closing, and range over channel.',
    keyPoints: ['Unbuffered: send blocks until receiver ready — synchronisation point', 'Buffered ch := make(chan T, n): send blocks only when full', 'select: first ready case wins; default: makes select non-blocking'] },
  { title: 'sync & sync/atomic',        route: '/go', badge: 'Concurrency', available: false,
    description: 'Mutex, RWMutex, WaitGroup, Once, Cond, and atomic operations for lock-free patterns.',
    keyPoints: ['sync.WaitGroup: Add/Done/Wait — wait for a group of goroutines', 'sync.Once: execute exactly once — lazy initialisation, global setup', 'atomic.Int64: lock-free counter for hot paths where mutex overhead matters'] },
  { title: 'context Package',           route: '/go', badge: 'Concurrency', available: false,
    description: 'Cancellation, deadlines, timeouts, and passing request-scoped values through call chains.',
    keyPoints: ['context.WithTimeout / WithDeadline: cancels automatically at time', 'context.WithCancel: cancel() defers clean up when done', 'ctx.Done() channel: select on it to react to cancellation'] },
  { title: 'net/http & REST APIs',      route: '/go', badge: 'HTTP & APIs', available: false,
    description: 'Building HTTP servers with net/http, ServeMux, middleware, and structured JSON APIs.',
    keyPoints: ['http.ServeMux (Go 1.22+): method+path routing — GET /users/{id}', 'Middleware: wrap http.Handler — chain for logging, auth, recovery', 'encoding/json: Encode/Decode; struct tags: json:"name,omitempty"'] },
  { title: 'gRPC in Go',                route: '/go', badge: 'HTTP & APIs', available: false,
    description: '.proto definitions, protoc codegen, server/client implementation, interceptors, and streaming.',
    keyPoints: ['protoc --go_out + --go-grpc_out: generate stubs from .proto', 'Unary interceptor: middleware pattern for gRPC — logging, auth, tracing', 'Server streaming: send multiple messages in response to one request'] },
  { title: 'Database with pgx',         route: '/go', badge: 'Data & Storage', available: false,
    description: 'pgx for PostgreSQL — querying, scanning, prepared statements, transactions, and COPY.',
    keyPoints: ['pgx/v5: native PostgreSQL driver, faster than database/sql + lib/pq', 'pgxpool.New(): connection pool; Acquire → use → Release', 'COPY: bulk insert thousands of rows per second vs individual INSERTs'] },
  { title: 'GORM',                      route: '/go', badge: 'Data & Storage', available: false,
    description: 'ORM for Go — models, migrations, associations, hooks, and raw SQL when needed.',
    keyPoints: ['AutoMigrate: creates/alters tables to match struct definitions', 'Preload: eager load associations; Joins: SQL join in the query', 'GORM hooks: BeforeCreate, AfterUpdate — for audit fields, hashing'] },
  { title: 'Go Modules',                route: '/go', badge: 'Tooling', available: false,
    description: 'go.mod, go.sum, versioning, replace directives, and workspace mode for multi-module repos.',
    keyPoints: ['go mod tidy: add missing, remove unused dependencies', 'Semantic versioning: v2+ requires /v2 import path suffix', 'go work: workspace mode — local multi-module development without replace hacks'] },
  { title: 'Testing in Go',             route: '/go', badge: 'Tooling', available: false,
    description: 'Standard testing package, table-driven tests, benchmarks, fuzzing, and testify assertions.',
    keyPoints: ['Table-driven tests: []struct{ input, want } — one test covers all cases', 'go test -bench=. -benchmem: benchmark with allocation stats', 'Fuzzing: go test -fuzz=FuzzMyFunc — automatic corpus generation'] },
  { title: 'Go Patterns',               route: '/go', badge: 'Patterns', available: false,
    description: 'Functional options, pipeline pattern, fan-out/fan-in, worker pools, and error group.',
    keyPoints: ['Functional options: WithTimeout(d time.Duration) Option — clean constructor API', 'errgroup.Group: run goroutines; first error cancels context and is returned', 'Worker pool: fixed goroutines reading from a channel — limits concurrency'] },
  { title: 'Go Cheat Sheet',            route: '/go', badge: 'Reference', available: false,
    description: 'Go syntax quick reference — types, interfaces, goroutines, channels, and error handling.',
    keyPoints: ['Type assertions: v, ok := x.(T) — safe; x.(T) alone panics on failure', 'Channel operations: send ch <- v; receive v := <-ch; close close(ch)', 'Useful builtins: make, new, append, copy, delete, len, cap, close'] },
  { title: 'Go Interview Prep',         route: '/go', badge: 'Reference', available: false,
    description: '35+ Go interview questions — goroutines, channels, interfaces, error handling, and performance.',
    keyPoints: ['What is the difference between goroutines and OS threads?', 'Explain Go\'s interface system and implicit satisfaction', 'How does the Go garbage collector work and how do you tune it?'] },
];

@Component({
  selector: 'app-go-home',
  standalone: true, imports: [RouterLink],
  templateUrl: './home.html', styleUrl: './home.scss',
})
export class GoHome {
  activeFilter = signal('All');
  expandedCard = signal<string | null>(null);
  topics = computed(() => { const f = this.activeFilter(); return f === 'All' ? ALL_TOPICS : ALL_TOPICS.filter(t => t.badge === f); });
  filters = GROUP_ORDER;
  counts = computed(() => { const map: Record<string, number> = { All: ALL_TOPICS.length }; for (const t of ALL_TOPICS) map[t.badge] = (map[t.badge] ?? 0) + 1; return map; });
  availableCount = ALL_TOPICS.filter(t => t.available).length;
  totalCount = ALL_TOPICS.length;
  setFilter(f: string) { this.activeFilter.set(f); }
  badgeCss(badge: string) { return 'badge badge-' + (BADGE_CSS[badge] ?? 'foundations'); }
  toggleCard(key: string, event: Event) { event.preventDefault(); this.expandedCard.update(c => c === key ? null : key); }
}
