import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../components/shared/page-meta/page-meta';
import { QuickRefComponent, QuickRefItem } from '../../../../components/shared/quick-ref/quick-ref';
import { TheoryBlockComponent, TheoryPoint } from '../../../../components/shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../components/shared/code-block/code-block';
import { QnaBlockComponent, QnaItem } from '../../../../components/shared/qna-block/qna-block';

@Component({
  selector: 'app-go-interview-prep',
  standalone: true,
  imports: [PageMetaComponent, QuickRefComponent, TheoryBlockComponent, CodeBlockComponent, QnaBlockComponent],
  templateUrl: './interview-prep.html',
  styleUrl: './interview-prep.scss'
})
export class GoInterviewPrep {
  readingTime = 30;
  difficulty: 'beginner' | 'intermediate' | 'advanced' = 'intermediate';
  since = 'Go 1.21+';

  quickRef: QuickRefItem[] = [
    { name: 'Goroutine vs Thread', type: 'keyword', desc: 'Goroutines are user-space (~2KB stack, M:N scheduled); OS threads are ~1MB' },
    { name: 'Channel direction', type: 'syntax', desc: 'chan<- T (send only), <-chan T (receive only) — enforced by compiler' },
    { name: 'Interface satisfaction', type: 'keyword', desc: 'Implicit — a type satisfies an interface if it has all the methods. No "implements" keyword' },
    { name: 'Defer order', type: 'keyword', desc: 'LIFO — last deferred call runs first when the function returns' },
    { name: 'Slice backing array', type: 'keyword', desc: 'Slices share a backing array — modifying a sub-slice modifies the original' },
    { name: 'Map concurrency', type: 'keyword', desc: 'Maps are NOT safe for concurrent use — use sync.RWMutex or sync.Map' },
    { name: 'Value vs pointer receiver', type: 'keyword', desc: 'Pointer receivers for mutation and large structs; be consistent within a type' },
    { name: 'errors.Is vs errors.As', type: 'function', desc: 'Is: sentinel equality check. As: typed error extraction. Both unwrap chains' },
    { name: 'Context cancellation', type: 'keyword', desc: 'Always defer cancel() after WithCancel/WithTimeout — prevents goroutine leaks' },
    { name: 'go test -race', type: 'function', desc: 'Data race detector — catches concurrent unsynchronised access. Run in CI' },
  ];

  theory: TheoryPoint[] = [
    {
      heading: 'Most-asked beginner questions',
      points: [
        'What is the zero value? — Every type has one: 0, false, "", nil. Variables always initialised.',
        'What is := vs var? — := is short declaration (function scope, type inferred). var is for package-level or explicit types.',
        'What is defer? — Schedules a function call for when the surrounding function returns. LIFO order. Arguments evaluated immediately.',
        'What is a goroutine? — Lightweight concurrent function. ~2KB stack, managed by Go runtime (M:N scheduling onto OS threads).',
        'What is a channel? — Typed communication pipe between goroutines. make(chan T) unbuffered; make(chan T, n) buffered.',
        'What are interfaces in Go? — Satisfied implicitly — if a type has the methods, it satisfies the interface. No declaration needed.',
        'How does error handling work? — Errors are values (error interface). Check if err != nil. Wrap with %w for context.',
      ]
    },
    {
      heading: 'Most-asked intermediate questions',
      points: [
        'Goroutine leak: goroutine blocked on a channel/context that never resolves. Fix: defer cancel(), close channels, use errgroup.',
        'Slice internals: length + capacity + pointer to backing array. append may create a new array; sub-slices share the original.',
        'Map safety: not safe for concurrent read+write. Use sync.RWMutex (many readers / one writer) or sync.Map.',
        'Context: cancellation, deadlines, request-scoped values. Pass as first argument. Always defer cancel().',
        'sync.Once: run a function exactly once — init patterns, singleton. Thread-safe without explicit locking.',
        'select statement: multiplexes channel operations; default makes it non-blocking. Useful for timeouts and fan-in.',
        'Escape analysis: compiler decides stack vs heap. Return a pointer = escape to heap. Check with go build -gcflags=-m.',
      ]
    },
    {
      heading: 'Most-asked advanced questions',
      points: [
        'GC: concurrent tri-colour mark-and-sweep. GOGC controls trigger (100=double heap). GOMEMLIMIT caps total usage.',
        'Scheduler: GMP model — G (goroutines), M (OS threads), P (processors). GOMAXPROCS controls P count (defaults to CPU count).',
        'Memory model: Go has a defined memory model — happens-before relationships. Channel ops and mutex operations establish ordering.',
        'Generics (1.18+): type parameters with constraints. ~T means T or any type whose underlying type is T.',
        'reflect package: runtime type introspection. Expensive — use sparingly. encoding/json uses it; avoid in hot paths.',
        'unsafe package: bypasses Go\'s type system. Required for certain low-level patterns; avoid unless absolutely necessary.',
        'cgo: call C code from Go. Increases binary size, complicates cross-compilation. CGO_ENABLED=0 for static binaries.',
      ]
    },
    {
      heading: 'Coding patterns interviewers test',
      points: [
        'Implement a concurrent worker pool with channels and WaitGroup.',
        'Write a goroutine-safe counter using sync.Mutex or sync/atomic.',
        'Implement a generic Stack[T] with Push, Pop, Peek.',
        'Write a context-aware HTTP client with timeout and retry.',
        'Implement a pipeline: generator → stage1 → stage2 using channels.',
        'Write table-driven tests with t.Run subtests and t.Parallel.',
        'Implement a rate limiter using time.Ticker and a token bucket.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Goroutine & Channel Q&A',
      language: 'typescript',
      code: `// Q: What happens when you send to a nil channel?
var ch chan int
ch <- 1  // blocks forever (deadlock in a single goroutine)

// Q: What happens when you receive from a closed channel?
ch := make(chan int)
close(ch)
v, ok := <-ch  // v=0 (zero value), ok=false — never blocks

// Q: What happens when you send to a closed channel?
// panic: send on closed channel

// Q: Buffered vs unbuffered channel — when to use each?
unbuffered := make(chan int)    // sender blocks until receiver is ready
buffered   := make(chan int, 5) // sender only blocks when buffer is full

// Rule: unbuffered for synchronisation (rendezvous);
//       buffered for decoupling producer/consumer speed

// Q: How do you fan-out work to N goroutines?
jobs := make(chan Job)
for i := 0; i < N; i++ {
    go func() {
        for j := range jobs { process(j) }  // exits when jobs is closed
    }()
}
// send jobs:
for _, j := range myJobs { jobs <- j }
close(jobs)  // signals workers to stop

// Q: Demonstrate a goroutine leak and its fix
func badLeak() {
    ch := make(chan int)
    go func() { ch <- compute() }()  // blocked if nobody reads ch!
    // function returns — goroutine stuck forever
}

func fixed(ctx context.Context) (int, error) {
    ch := make(chan int, 1)  // buffered: goroutine can always send
    go func() { ch <- compute() }()
    select {
    case v := <-ch: return v, nil
    case <-ctx.Done(): return 0, ctx.Err()
    }
}`
    },
    {
      label: 'Interface & Type Q&A',
      language: 'typescript',
      code: `// Q: Does *T satisfy an interface that T satisfies?
type Stringer interface { String() string }
type MyType struct{}
func (m MyType) String() string { return "hello" }  // value receiver

var s Stringer = MyType{}   // OK
var s2 Stringer = &MyType{} // also OK — pointer to value satisfies interface

// Q: Does T satisfy an interface that *T satisfies?
type MyMutator struct{}
func (m *MyMutator) Mutate() {}  // pointer receiver

var i interface{ Mutate() } = &MyMutator{} // OK
// var i interface{ Mutate() } = MyMutator{}  // ERROR — value is not addressable

// Rule: pointer receiver = pointer only satisfies interface;
//       value receiver = both value and pointer satisfy interface

// Q: What is an empty interface / any?
var x any = "hello"    // x holds any type
x = 42                 // now holds an int

// Q: Type assertion vs type switch
var i any = "hello"

// Type assertion (panics if wrong type):
s := i.(string)              // s = "hello"
n, ok := i.(int)             // ok=false, n=0, no panic

// Type switch (no panic):
switch v := i.(type) {
case string: fmt.Println("string:", v)
case int:    fmt.Println("int:", v)
default:     fmt.Println("unknown")
}

// Q: Can a nil interface cause a nil pointer dereference?
type MyErr struct{ msg string }
func (e *MyErr) Error() string { return e.msg }

func bad() error {
    var err *MyErr = nil  // typed nil
    return err            // returns non-nil interface (type=*MyErr, value=nil)!
}
err := bad()
fmt.Println(err == nil)  // FALSE — interface is not nil`
    },
    {
      label: 'Concurrency Patterns',
      language: 'typescript',
      code: `// --- Worker pool ---
func workerPool(ctx context.Context, jobs []Job, workers int) []Result {
    jobCh := make(chan Job, len(jobs))
    resCh := make(chan Result, len(jobs))

    var wg sync.WaitGroup
    for i := 0; i < workers; i++ {
        wg.Add(1)
        go func() {
            defer wg.Done()
            for j := range jobCh {
                select {
                case resCh <- process(j):
                case <-ctx.Done(): return
                }
            }
        }()
    }

    for _, j := range jobs { jobCh <- j }
    close(jobCh)

    wg.Wait()
    close(resCh)

    results := make([]Result, 0, len(jobs))
    for r := range resCh { results = append(results, r) }
    return results
}

// --- Rate limiter using token bucket ---
type RateLimiter struct {
    tokens chan struct{}
}
func NewRateLimiter(rate int, per time.Duration) *RateLimiter {
    rl := &RateLimiter{tokens: make(chan struct{}, rate)}
    go func() {
        ticker := time.NewTicker(per / time.Duration(rate))
        for range ticker.C {
            select {
            case rl.tokens <- struct{}{}:
            default:
            }
        }
    }()
    return rl
}
func (rl *RateLimiter) Allow() bool {
    select {
    case <-rl.tokens: return true
    default:          return false
    }
}

// --- Once (singleton init) ---
var (
    instance *DB
    once     sync.Once
)
func GetDB() *DB {
    once.Do(func() { instance = connectDB() })
    return instance
}`
    },
    {
      label: 'Error & Memory Q&A',
      language: 'typescript',
      code: `// Q: Implement a custom error type
type APIError struct {
    Code    int
    Message string
    Err     error
}
func (e *APIError) Error() string {
    return fmt.Sprintf("API %d: %s", e.Code, e.Message)
}
func (e *APIError) Unwrap() error { return e.Err }  // enables errors.Is/As

// Usage:
return &APIError{Code: 404, Message: "user not found", Err: ErrNotFound}

// errors.As extracts it:
var apiErr *APIError
if errors.As(err, &apiErr) {
    fmt.Println(apiErr.Code)  // 404
}

// Q: What is the difference between new(T) and &T{}?
p1 := new(Point)   // *Point with zero fields
p2 := &Point{}     // identical — prefer &T{} for clarity

// Q: When does a variable escape to the heap?
// - Returned as a pointer from a function
// - Stored in an interface
// - Sent over a channel
// - Captured by a goroutine
// - Slice element (if slice escapes)
// Check: go build -gcflags="-m" ./...

// Q: What is a memory barrier in Go?
// Channel operations, mutex Lock/Unlock, and sync/atomic ops
// establish happens-before relationships.
// Ordinary reads/writes across goroutines WITHOUT synchronisation
// are a data race — undefined behaviour, caught by -race.

// Q: What is sync.Map used for?
// sync.Map is optimised for two patterns:
// 1. Write-once, read-many (caches, registries)
// 2. Concurrent goroutines that each write/read disjoint keys
// For general concurrent map access, sync.RWMutex + regular map
// is often clearer and comparable in performance.`
    },
    {
      label: 'Slice & Map Internals',
      language: 'typescript',
      code: `// Q: Why can modifying a sub-slice affect the original?
original := []int{1, 2, 3, 4, 5}
sub := original[1:3]  // [2, 3] — shares the backing array
sub[0] = 99
fmt.Println(original)  // [1, 99, 3, 4, 5] — original is modified!

// Q: When does append create a new backing array?
s := make([]int, 3, 3)  // len=3, cap=3
t := append(s, 4)        // cap exceeded — NEW array allocated
t[0] = 99
fmt.Println(s[0])  // 1 — s and t are now independent

// Safe copy to avoid sharing:
safe := make([]int, len(sub))
copy(safe, sub)  // safe is independent

// Q: What is the capacity growth strategy?
// Go doubles capacity (approximately) when cap is exceeded.
// For large slices, growth is ~1.25×.
// Pre-allocate with make([]T, 0, n) when n is known.

// Q: Map iteration order
m := map[string]int{"a": 1, "b": 2, "c": 3}
for k, v := range m {  // ORDER IS RANDOM (by design)
    fmt.Println(k, v)
}
// For deterministic order: sort the keys first
keys := make([]string, 0, len(m))
for k := range m { keys = append(keys, k) }
sort.Strings(keys)
for _, k := range keys { fmt.Println(k, m[k]) }

// Q: How do you check if a map key exists?
v, ok := m["key"]  // ok=false if key absent, v=zero value
if !ok { /* key not present */ }
// Never use v != nil — zero value may be a valid value`
    },
  ];

  qna: QnaItem[] = [
    {
      q: 'What is the GMP scheduler model in Go?',
      a: 'GMP stands for Goroutines, Machines (OS threads), and Processors (logical CPUs). G is a goroutine (user-space task). M is an OS thread. P is a scheduler context that holds a run queue of goroutines — an M must hold a P to run goroutines. GOMAXPROCS controls the number of Ps (defaults to CPU count). When a goroutine blocks on a syscall, its P is handed to another M so other goroutines can run. This M:N scheduling lets thousands of goroutines run on a handful of OS threads.'
    },
    {
      q: 'What is a data race and how do you detect and prevent it?',
      a: 'A data race is when two goroutines access the same memory concurrently and at least one access is a write, without synchronisation. The result is undefined behaviour — reads may see stale values, or partially written data. Detection: go test -race ./... (adds ~5-20x overhead). Prevention: sync.Mutex (exclusive write), sync.RWMutex (many readers / one writer), sync/atomic for scalars, or restructure to communicate via channels rather than sharing memory.'
    },
    {
      q: 'What is the difference between a buffered and unbuffered channel? When do you use each?',
      a: 'Unbuffered (make(chan T)): send blocks until a receiver is ready; receive blocks until a sender is ready. Both sides must be present simultaneously — "rendezvous". Use for: synchronisation, confirming handoff, signals. Buffered (make(chan T, n)): send only blocks when the buffer is full. Use for: decoupling producer/consumer speed, work queues, allowing a goroutine to send without waiting. Key rule: buffered channels don\'t prevent goroutine leaks — if nothing drains the buffer, the sender still blocks.'
    },
    {
      q: 'Explain the Go memory model in simple terms.',
      a: 'The Go memory model defines when a write by one goroutine is guaranteed to be visible to a read by another. Without synchronisation, a reader may see a stale or partially-written value — this is a data race. Synchronisation primitives that establish happens-before: channel operations (send happens before the matching receive completes), sync.Mutex Lock/Unlock, sync/atomic operations, and goroutine creation (go statement happens before the goroutine body starts). In practice: use sync or channels, don\'t share unsynchronised memory across goroutines.'
    },
    {
      q: 'How does Go\'s garbage collector work?',
      a: 'Go uses a concurrent tri-colour mark-and-sweep GC. Phase 1 (concurrent mark): GC runs alongside the program, marking all reachable objects grey then black. It uses a write barrier to track pointer changes during marking. Phase 2 (stop-the-world pause): very brief — just to enable/disable the write barrier and check invariants. Phase 3 (concurrent sweep): reclaim unmarked (white) objects. GOGC (default 100) triggers a GC when heap size doubles. GOMEMLIMIT (Go 1.19+) adds a hard memory cap, triggering GC more aggressively as usage approaches the limit.'
    },
    {
      q: 'What are generics in Go and when should you use them?',
      a: 'Generics (Go 1.18+) allow type-parameterised functions and types: func Max[T constraints.Ordered](a, b T) T. Type constraints restrict what types can be used: any accepts everything; comparable allows == comparisons; constraints.Ordered allows <, <=, >, >=; ~T matches any type whose underlying type is T. Use generics for: reusable data structures (Stack[T], Result[T, E]), algorithms over ordered/comparable types, utilities like Map/Filter/Reduce. Avoid for: everything else — generics add complexity, and interfaces or code generation are often clearer.'
    },
    {
      q: 'What is context.Context and why must you always defer cancel()?',
      a: 'context.Context carries cancellation signals, deadlines, and request-scoped values across API boundaries. context.WithCancel returns a Context and a cancel function. When cancel is called, the context is cancelled and ctx.Done() channel is closed — any goroutine waiting on ctx.Done() wakes up and can return. Failing to call cancel leaks the goroutine that manages the cancellation signal and any goroutines derived from it. defer cancel() ensures cancel is called even if the function returns early via an error.'
    },
    {
      q: 'What is the difference between make and new in Go?',
      a: 'new(T) allocates memory for type T, zeroes it, and returns *T. It works for any type but is rarely used directly — &T{} is clearer for structs. make(T, args) is only for slices, maps, and channels. It allocates and initialises the internal structure (for a map, the hash table; for a channel, the ring buffer) and returns T (not *T). You cannot use new to create a usable map or channel — the zero value is nil. Use make for slices, maps, and channels; use &T{} for structs.'
    },
    {
      q: 'How do you write a production-safe HTTP server in Go?',
      a: 'Key elements: (1) Set timeouts on http.Server: ReadTimeout, WriteTimeout, IdleTimeout — prevents slow-client and slowloris attacks. (2) Handle graceful shutdown with signal.NotifyContext + srv.Shutdown(ctx) — drains in-flight requests on SIGTERM. (3) Use slog for structured logging with request context. (4) Add /healthz/live and /healthz/ready probes for Kubernetes. (5) Recover panics in middleware to prevent one bad request from killing the server. (6) Use context from r.Context() for all downstream calls so they respect client disconnection.'
    },
    {
      q: 'What is the difference between sync.Mutex and sync.RWMutex? When do you use each?',
      a: 'sync.Mutex: exclusive lock — only one goroutine can hold Lock at a time, blocking all others (readers and writers). sync.RWMutex: allows multiple concurrent readers (RLock/RUnlock) or one exclusive writer (Lock/Unlock). Use Mutex when writes are as frequent as reads or when the critical section is very short (lock contention overhead may exceed RWMutex\'s benefit). Use RWMutex for read-heavy workloads: caches, config stores, lookup tables where reads far outnumber writes.'
    },
  ];
}
