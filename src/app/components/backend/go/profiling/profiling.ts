import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../components/shared/page-meta/page-meta';
import { QuickRefComponent, QuickRefItem } from '../../../../components/shared/quick-ref/quick-ref';
import { TheoryBlockComponent, TheoryPoint } from '../../../../components/shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../components/shared/code-block/code-block';
import { CommonMistakesComponent, CommonMistake } from '../../../../components/shared/common-mistakes/common-mistakes';
import { ChallengeBlockComponent, Challenge } from '../../../../components/shared/challenge-block/challenge-block';
import { QuizBlockComponent, QuizQuestion } from '../../../../components/shared/quiz-block/quiz-block';
import { QnaBlockComponent, QnaItem } from '../../../../components/shared/qna-block/qna-block';
import { RevisionCardComponent, RevisionSummary } from '../../../../components/shared/revision-card/revision-card';
import { PageCompleteComponent } from '../../../../components/shared/page-complete/page-complete';

@Component({
  selector: 'app-go-profiling',
  standalone: true,
  imports: [PageMetaComponent, QuickRefComponent, TheoryBlockComponent, CodeBlockComponent,
    CommonMistakesComponent, ChallengeBlockComponent, QuizBlockComponent, QnaBlockComponent,
    RevisionCardComponent, PageCompleteComponent],
  templateUrl: './profiling.html',
  styleUrl: './profiling.scss'
})
export class GoProfiling {
  readingTime = 24;
  difficulty: 'beginner' | 'intermediate' | 'advanced' = 'intermediate';
  since = 'Go 1.21+';
  route = 'go-profiling';
  nextRoute = '/go/build';
  nextLabel = 'Build & Deployment';

  quickRef: QuickRefItem[] = [
    { name: 'go test -bench=. -cpuprofile=cpu.out', type: 'function', desc: 'Run benchmarks and write CPU profile' },
    { name: 'go tool pprof cpu.out', type: 'function', desc: 'Interactive profile viewer; "web" opens a flame graph in browser' },
    { name: 'go test -benchmem', type: 'function', desc: 'Report bytes/op and allocs/op per benchmark iteration' },
    { name: 'pprof.StartCPUProfile(f)', type: 'function', desc: 'Start CPU profiling; write to any io.Writer; stop with StopCPUProfile()' },
    { name: 'runtime/pprof.WriteHeapProfile(f)', type: 'function', desc: 'Write a heap (memory) profile snapshot' },
    { name: 'net/http/pprof', type: 'keyword', desc: 'Import side-effect: exposes /debug/pprof/ HTTP endpoints on running server' },
    { name: 'go tool trace trace.out', type: 'function', desc: 'Visualise goroutine scheduling, GC pauses, syscall latency' },
    { name: 'runtime.ReadMemStats(&m)', type: 'function', desc: 'Read live memory stats (HeapAlloc, NumGC, etc.) at runtime' },
    { name: 'sync.Pool', type: 'class', desc: 'Object pool to reuse allocations across goroutines — reduces GC pressure' },
    { name: 'GODEBUG=gctrace=1', type: 'keyword', desc: 'Print a line to stderr for each GC cycle (pause time, heap size)' },
  ];

  theory: TheoryPoint[] = [
    {
      heading: 'pprof — CPU and memory profiling',
      points: [
        'pprof is Go\'s built-in profiling tool — it samples the call stack at 100Hz for CPU, records allocations for heap.',
        'Two ways to profile: write to a file in a CLI tool (runtime/pprof), or expose an HTTP endpoint in a server (net/http/pprof).',
        'CPU profile: what functions consume CPU time. Heap profile: what functions allocate memory and how much.',
        'go tool pprof opens an interactive shell. The "web" command generates an SVG flame graph in the browser.',
        'Profile in production using the HTTP endpoint: go tool pprof http://server/debug/pprof/profile?seconds=30',
      ]
    },
    {
      heading: 'Benchmarks and allocation analysis',
      points: [
        'go test -bench=. runs benchmark functions. -benchmem adds bytes/op and allocs/op columns.',
        '-cpuprofile=cpu.out and -memprofile=mem.out write profiles from benchmark runs — feed directly to pprof.',
        'Reducing allocations is often the highest-leverage optimisation — allocations cause GC pressure.',
        'sync.Pool recycles objects between goroutines: Get returns an existing item or calls New; Put returns it to the pool.',
        'Prefer []byte reuse, pre-allocated slices, and struct value semantics over heap allocation where possible.',
      ]
    },
    {
      heading: 'Execution tracer',
      points: [
        'go test -trace=trace.out captures a fine-grained execution trace: goroutine scheduling, GC, syscalls, network I/O.',
        'go tool trace trace.out opens a browser UI with timeline views — different from pprof (which is sampled, not full trace).',
        'Use the tracer to diagnose: goroutine starvation, GC pauses impacting latency, blocked goroutines, syscall overhead.',
        'runtime/trace.Start/Stop can trace specific sections of code rather than entire runs.',
        'Traces have low overhead (~5%) — usable in production for short periods.',
      ]
    },
    {
      heading: 'Memory management and GC tuning',
      points: [
        'Go uses a concurrent tri-colour mark-and-sweep GC. It runs mostly concurrently with the program.',
        'GOGC=100 (default): GC triggers when heap doubles since last collection. Lower = more frequent GC. Higher = fewer GC cycles but more memory.',
        'GOMEMLIMIT (Go 1.19+): caps total memory Go may use before triggering GC — prevents OOM from runaway heap.',
        'GODEBUG=gctrace=1 prints GC events: pause time, heap before/after, goroutine count.',
        'runtime.ReadMemStats(&m) reads live heap stats — expose as metrics in your service for monitoring.',
      ]
    },
    {
      heading: 'Common performance patterns',
      points: [
        'String concatenation in loops: use strings.Builder. Each += allocates a new string.',
        'Avoid interface boxing for hot paths — interface values carry a pointer to a type descriptor + data pointer (2 words).',
        'Pre-allocate slices: make([]T, 0, n) avoids repeated backing-array reallocations as the slice grows.',
        'Use bufio.Writer for I/O-heavy code — batches small writes into larger OS calls.',
        'Channel operations are not free: goroutine scheduling overhead exists. For ultra-high-throughput, lock-free data structures or batching may be needed.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'CPU + Heap Profile',
      language: 'typescript',
      code: `// Profiling a CLI tool (runtime/pprof)

package main

import (
    "os"
    "runtime/pprof"
    "log"
)

func main() {
    // --- CPU profile ---
    f, err := os.Create("cpu.prof")
    if err != nil { log.Fatal(err) }
    defer f.Close()

    if err := pprof.StartCPUProfile(f); err != nil { log.Fatal(err) }
    defer pprof.StopCPUProfile()  // ensure profile is written on exit

    // ... your code here ...
    doWork()

    // --- Heap profile (after work) ---
    hf, _ := os.Create("mem.prof")
    defer hf.Close()
    runtime.GC()  // force GC to get accurate live object count
    pprof.WriteHeapProfile(hf)
}

// Analyse:
// go tool pprof cpu.prof
// (pprof) top10          <- top 10 functions by CPU time
// (pprof) list doWork    <- line-by-line breakdown of doWork
// (pprof) web            <- open flame graph in browser

// go tool pprof mem.prof
// (pprof) top10 -cum     <- top allocating functions (cumulative)
// (pprof) web            <- allocation flame graph`
    },
    {
      label: 'HTTP pprof Endpoint',
      language: 'typescript',
      code: `// Profiling a running server (net/http/pprof)
// Just import the package as a side-effect:

import (
    "net/http"
    _ "net/http/pprof"  // registers /debug/pprof/ routes on DefaultServeMux
)

func main() {
    // If using DefaultServeMux:
    go http.ListenAndServe(":6060", nil)

    // If using a custom mux (e.g. Gin), register manually:
    // router.GET("/debug/pprof/*action", gin.WrapH(http.DefaultServeMux))

    startServer()
}

// Available endpoints:
// /debug/pprof/               <- index
// /debug/pprof/profile?seconds=30  <- 30s CPU profile
// /debug/pprof/heap           <- heap snapshot
// /debug/pprof/goroutine      <- all goroutine stacks
// /debug/pprof/trace?seconds=5 <- 5s execution trace

// Profile a live server:
// go tool pprof http://localhost:6060/debug/pprof/profile?seconds=30
// (pprof) web

// IMPORTANT: never expose /debug/pprof/ to the public internet!
// Gate behind internal network or authentication.`
    },
    {
      label: 'Benchmark + Profile',
      language: 'typescript',
      code: `// Write benchmark, then profile it:
// go test -bench=BenchmarkProcess -benchmem -cpuprofile=cpu.out ./...
// go tool pprof cpu.out

func BenchmarkProcess(b *testing.B) {
    data := generateTestData(1000)
    b.ResetTimer()
    for i := 0; i < b.N; i++ {
        process(data)
    }
}

// Output:
// BenchmarkProcess-8   10000   115234 ns/op   49152 B/op   3 allocs/op
//                               ^               ^            ^
//                        ns per op       bytes per op   allocs per op

// --- sync.Pool to reduce allocations ---
var bufPool = sync.Pool{
    New: func() any {
        return make([]byte, 0, 4096)  // initial capacity 4KB
    },
}

func processWithPool(data []byte) []byte {
    buf := bufPool.Get().([]byte)
    defer bufPool.Put(buf[:0])  // reset slice length, keep capacity

    buf = append(buf, data...)
    buf = transform(buf)
    result := make([]byte, len(buf))
    copy(result, buf)  // return a fresh slice — pool buf is reused
    return result
}

// --- strings.Builder vs concatenation ---
func buildString(parts []string) string {
    var sb strings.Builder
    sb.Grow(totalLen(parts))  // pre-allocate — avoids re-allocations
    for _, p := range parts {
        sb.WriteString(p)
    }
    return sb.String()
}

// Benchmark comparison: loop with +=  vs  strings.Builder
// BenchmarkConcat-8      5000   324000 ns/op   1MB/op   99 allocs/op
// BenchmarkBuilder-8   100000    12000 ns/op   4KB/op    1 alloc/op`
    },
    {
      label: 'GC Tuning & Memory Stats',
      language: 'typescript',
      code: `// Environment variables that tune the GC:
//
// GOGC=100 (default) — trigger GC when heap reaches 2× the live set.
//   GOGC=200 → less frequent GC, higher memory usage
//   GOGC=50  → more frequent GC, less memory
//   GOGC=off → disable GC entirely (only for short-lived tools)
//
// GOMEMLIMIT=512MiB (Go 1.19+) — hard memory cap.
//   When heap + stack exceeds the limit, GC runs aggressively.
//   Prevents OOM kills in containers; set slightly below pod limit.
//   Combined with GOGC=off: "GC only when memory is tight" pattern.
//
// GODEBUG=gctrace=1
//   Prints one line per GC cycle to stderr:
//   gc 5 @2.345s 1%: 0.05+1.2+0.07 ms clock, heap 8->9->4 MB, 8 P

// Read live memory stats at runtime:
import "runtime"

func reportMemory() {
    var m runtime.MemStats
    runtime.ReadMemStats(&m)  // stops-the-world briefly

    fmt.Printf("HeapAlloc:   %v MB\\n", m.HeapAlloc/1024/1024)
    fmt.Printf("HeapInuse:   %v MB\\n", m.HeapInuse/1024/1024)
    fmt.Printf("NumGC:       %v\\n", m.NumGC)
    fmt.Printf("PauseTotalNs:%v ms\\n", m.PauseTotalNs/1e6)
    fmt.Printf("Goroutines:  %v\\n", runtime.NumGoroutine())
}

// Expose as Prometheus metrics (common pattern):
// prometheus.MustRegister(collectors.NewGoCollector())
// This exports heap, GC pause, goroutine count automatically.

// GOMEMLIMIT via code (Go 1.19+):
import "runtime/debug"
debug.SetMemoryLimit(512 * 1024 * 1024)  // 512 MiB`
    },
    {
      label: 'Execution Trace',
      language: 'typescript',
      code: `// Execution trace: goroutine scheduling, GC events, syscalls

// Option 1: via go test
// go test -bench=. -trace=trace.out ./...
// go tool trace trace.out   <- opens browser

// Option 2: in a running program
import (
    "os"
    "runtime/trace"
)

func main() {
    f, _ := os.Create("trace.out")
    defer f.Close()
    trace.Start(f)
    defer trace.Stop()

    doWork()
}

// Trace a specific region:
ctx, task := trace.NewTask(context.Background(), "processOrder")
defer task.End()

trace.WithRegion(ctx, "validatePayment", func() {
    validatePayment(order)
})
trace.WithRegion(ctx, "chargeCard", func() {
    chargeCard(order)
})

// In go tool trace browser:
// - Goroutine analysis: see goroutine count over time, blocked goroutines
// - Scheduler latency: time goroutines wait to be scheduled
// - GC pauses: when GC runs and how long stop-the-world takes
// - Syscall analysis: time spent in OS calls
// - User-defined tasks/regions appear in the timeline`
    },
  ];

  mistakes: CommonMistake[] = [
    {
      title: 'Optimising before profiling',
      wrong: `// "I think string concatenation is slow, so I'll use sync.Pool everywhere"
// Rewrote 300 lines — turns out the bottleneck was a database query
// The string code was 0.1% of CPU time`,
      right: `// Profile first:
// go test -bench=. -cpuprofile=cpu.out ./...
// go tool pprof cpu.out
// (pprof) top10
//
// Now you know EXACTLY where time is spent before touching code.`,
      explanation: 'Premature optimisation wastes time and adds complexity. pprof reveals that the bottleneck is almost never where you think it is. Always profile first — get data, find the actual hot path, then optimise. A 10x speedup on the 0.1% hot path saves less wall time than a 2x speedup on the 50% hot path.'
    },
    {
      title: 'Exposing /debug/pprof on a public port',
      wrong: `// In main.go — exposes profiling on the same port as the API
import _ "net/http/pprof"

func main() {
    http.ListenAndServe(":8080", router)  // /debug/pprof is now public!
}`,
      right: `// Separate internal port, not exposed by load balancer:
import _ "net/http/pprof"

func main() {
    // Internal debug server on localhost only
    go http.ListenAndServe("127.0.0.1:6060", nil)

    // Public API server
    http.ListenAndServe(":8080", router)
}`,
      explanation: '/debug/pprof exposes CPU profiles, heap dumps, and goroutine stacks — these reveal code structure, secrets in memory, and internal state. Never expose this endpoint publicly. Run it on localhost or a private network interface, or gate it behind authentication. In Kubernetes, expose via kubectl port-forward for on-demand profiling.'
    },
    {
      title: 'Using runtime.ReadMemStats in a hot path',
      wrong: `// Called on every request — causes stop-the-world GC pause each time
func handler(w http.ResponseWriter, r *http.Request) {
    var m runtime.MemStats
    runtime.ReadMemStats(&m)  // STW pause!
    log.Printf("heap: %d", m.HeapAlloc)
    doWork(w, r)
}`,
      right: `// Collect periodically in a background goroutine:
func startMemReporter() {
    go func() {
        ticker := time.NewTicker(30 * time.Second)
        for range ticker.C {
            var m runtime.MemStats
            runtime.ReadMemStats(&m)
            heapGauge.Set(float64(m.HeapAlloc))  // Prometheus metric
        }
    }()
}`,
      explanation: 'runtime.ReadMemStats requires a stop-the-world pause to get a consistent snapshot — all goroutines are halted while stats are collected. Calling it per-request adds latency to every request. Collect it periodically (every 30s) in a background goroutine and expose the values as metrics. expvar or Prometheus collectors do this correctly.'
    },
    {
      title: 'Not resetting b.Timer after setup in benchmarks',
      wrong: `func BenchmarkQuery(b *testing.B) {
    db := setupTestDB()   // expensive setup — included in benchmark!
    rows, _ := db.Query("SELECT ...")
    b.ResetTimer()        // TOO LATE — first iteration already measured
    for i := 0; i < b.N; i++ {
        processRows(rows)
    }
}`,
      right: `func BenchmarkQuery(b *testing.B) {
    db := setupTestDB()

    b.ResetTimer()  // reset BEFORE the loop

    for i := 0; i < b.N; i++ {
        rows, _ := db.Query("SELECT ...")
        processRows(rows)
        rows.Close()
    }
}`,
      explanation: 'b.ResetTimer() resets both elapsed time AND allocation counts. Call it immediately before the b.N loop so setup time is excluded. If setup is inside the loop (as it should be when you\'re benchmarking the full operation), put ResetTimer before the loop. If setup is one-time, put it before setup — but only if setup is truly fixed cost.'
    },
    {
      title: 'Ignoring allocs/op in benchmarks',
      wrong: `// Benchmark shows 1000 ns/op — "fast enough"
// Nobody checks the 1024 allocs/op
// Under load: 10k req/s = 10M allocs/s = GC pressure = latency spikes`,
      right: `// Always run -benchmem and check allocs/op:
// go test -bench=. -benchmem

// BenchmarkProcess-8   1000   1234 ns/op   8192 B/op   128 allocs/op
//                                                               ^
//                                                    THIS is the problem

// Target: single-digit allocs/op for hot paths
// Tools: sync.Pool, pre-allocated slices, value types`,
      explanation: 'A low ns/op hides an allocation problem — allocs cause GC pauses that show up as tail latency spikes under load, not average latency. Always run -benchmem and aim for minimal allocs/op in hot paths. The allocation profile (pprof inuse_objects or alloc_objects) reveals which functions are the heaviest allocators.'
    },
    {
      title: 'Setting GOGC=off in a long-running service',
      wrong: `// "GC causes latency — let's just disable it"
// GOGC=off go run ./cmd/server
// Memory grows unbounded → OOM kill after a few hours`,
      right: `// Combine GOMEMLIMIT with GOGC tuning:
// GOMEMLIMIT=512MiB GOGC=200 go run ./cmd/server
// GC runs less frequently (GOGC=200) but caps memory at 512MiB
// If heap grows toward limit, GC kicks in regardless of GOGC`,
      explanation: 'GOGC=off disables GC entirely — only safe for short-lived batch jobs where the process exits before memory grows too large. Long-running services will OOM. Instead, tune GOGC upward (GOGC=200 means less frequent GC) combined with GOMEMLIMIT to enforce a hard cap. This gives lower GC overhead while preventing OOM. Go 1.19+ GOMEMLIMIT is the right tool for container memory management.'
    },
  ];

  challenge: Challenge = {
    title: 'Profile and Optimise a Hot Function',
    language: 'typescript',
    description: `You have a function that processes a large slice of strings. Your task is to profile it, identify the bottleneck, and write an optimised version.

**Given (slow version):**
\`\`\`go
func processStrings(items []string) []string {
    result := []string{}
    for _, s := range items {
        if len(s) > 3 {
            result = result + []string{strings.ToUpper(s)}
        }
    }
    return result
}
\`\`\`
*(Note: the above pseudo-code has an intentional error — Go doesn't use + for slices)*

**Tasks:**
1. Write a correct slow version that appends to a slice without pre-allocation
2. Write a benchmark for both slow and fast versions: BenchmarkSlow and BenchmarkFast
3. Write an optimised version that:
   - Pre-allocates the result slice with make([]T, 0, cap)
   - Uses a strings.Builder approach where applicable
4. Write the pprof commands you would run to profile the benchmark
5. Add a test that verifies both versions produce identical output

The slow version uses \`result = append(result, ...)\` without capacity hint.
The fast version uses \`make([]string, 0, len(items))\` and avoids unnecessary allocations.`,
    hints: [
      'Pre-allocate: make([]string, 0, len(items)) — worst-case capacity is len(items)',
      'Benchmark: go test -bench=. -benchmem to see allocs/op difference',
      'Profile command: go test -bench=BenchmarkSlow -cpuprofile=cpu.out then go tool pprof cpu.out',
      'Test: generate same input, run both, compare with reflect.DeepEqual or assert.Equal',
    ],
    starterCode: `package process_test

import (
    "strings"
    "testing"
)

// Slow: no pre-allocation
func processSlow(items []string) []string {
    // TODO: append without capacity hint
    return nil
}

// Fast: pre-allocated
func processFast(items []string) []string {
    // TODO: make([]string, 0, len(items)) + append
    return nil
}

func BenchmarkSlow(b *testing.B) {
    data := make([]string, 1000)
    for i := range data { data[i] = "hello" }
    b.ResetTimer()
    for i := 0; i < b.N; i++ {
        // TODO
    }
}

func BenchmarkFast(b *testing.B) {
    // TODO
}

func TestBothVersionsMatch(t *testing.T) {
    // TODO: verify both return same results
}`,
    solution: `package process_test

import (
    "reflect"
    "strings"
    "testing"
)

func processSlow(items []string) []string {
    result := []string{}  // no capacity hint — grows via append
    for _, s := range items {
        if len(s) > 3 {
            result = append(result, strings.ToUpper(s))
        }
    }
    return result
}

func processFast(items []string) []string {
    result := make([]string, 0, len(items))  // pre-allocate worst-case
    for _, s := range items {
        if len(s) > 3 {
            result = append(result, strings.ToUpper(s))
        }
    }
    return result
}

func makeData(n int) []string {
    data := make([]string, n)
    for i := range data {
        if i%3 == 0 { data[i] = "hi" } else { data[i] = "hello" }
    }
    return data
}

func BenchmarkSlow(b *testing.B) {
    data := makeData(1000)
    b.ResetTimer()
    for i := 0; i < b.N; i++ {
        _ = processSlow(data)
    }
}

func BenchmarkFast(b *testing.B) {
    data := makeData(1000)
    b.ResetTimer()
    for i := 0; i < b.N; i++ {
        _ = processFast(data)
    }
}

func TestBothVersionsMatch(t *testing.T) {
    data := makeData(100)
    slow := processSlow(data)
    fast := processFast(data)
    if !reflect.DeepEqual(slow, fast) {
        t.Errorf("results differ: slow=%v fast=%v", slow, fast)
    }
}

// Profile commands:
// go test -bench=BenchmarkSlow -benchmem -cpuprofile=cpu.out .
// go tool pprof cpu.out
// (pprof) top10
// (pprof) web

// go test -bench=BenchmarkSlow -memprofile=mem.out .
// go tool pprof mem.out
// (pprof) top10 -cum`,
  };

  quiz: QuizQuestion[] = [
    {
      q: 'What is the first thing you should do before optimising Go code?',
      options: [
        'Profile with pprof to find the actual bottleneck — optimise based on data, not intuition',
        'Replace all string concatenation with strings.Builder',
        'Add sync.Pool to all functions that allocate memory',
        'Increase GOGC to reduce GC frequency',
      ],
      answer: 0,
      explanation: 'Premature optimisation is the root of much wasted effort. The actual bottleneck is almost never where you think it is. Profile first: go test -bench -cpuprofile/memprofile and then go tool pprof. Once you can see the flame graph or top10 output, you know exactly which function to optimise and by how much.'
    },
    {
      q: 'What does `go test -benchmem` report?',
      options: [
        'bytes/op (bytes allocated per operation) and allocs/op (heap allocations per operation)',
        'Total memory used by the test binary during the benchmark run',
        'Memory available on the machine when the benchmark ran',
        'The size of the benchmark binary after compilation',
      ],
      answer: 0,
      explanation: '-benchmem adds two columns to benchmark output: bytes/op (bytes allocated per single benchmark iteration) and allocs/op (number of heap allocations per iteration). High allocs/op causes GC pressure which manifests as tail latency. Aim for single-digit allocs/op in hot paths. Profile with -memprofile to find the allocating functions.'
    },
    {
      q: 'What does importing `_ "net/http/pprof"` do?',
      options: [
        'Registers /debug/pprof/* HTTP handlers on DefaultServeMux as a side-effect of the blank import',
        'Enables pprof output for all runtime errors',
        'Starts a background CPU profiler that writes to /tmp/profile.out',
        'Adds the pprof package to the binary without registering any HTTP handlers',
      ],
      answer: 0,
      explanation: 'The blank import _ "net/http/pprof" runs the package\'s init() function, which calls http.HandleFunc to register several /debug/pprof/ routes on DefaultServeMux. After this import, any server using DefaultServeMux (or explicitly registering with it) exposes live profiling endpoints. Never expose these publicly — restrict to localhost or internal networks.'
    },
    {
      q: 'What does GOMEMLIMIT do (Go 1.19+)?',
      options: [
        'Sets a hard cap on Go\'s total memory usage — GC becomes more aggressive as usage approaches the limit',
        'Limits the number of goroutines that can be created',
        'Sets the maximum size of a single allocation',
        'Limits the amount of memory the GC may use for its own bookkeeping',
      ],
      answer: 0,
      explanation: 'GOMEMLIMIT caps the total memory Go may use (heap + stacks + runtime overhead). As usage approaches the limit, the GC becomes more aggressive. This prevents OOM kills in containers where the pod memory limit is hard. Set GOMEMLIMIT slightly below the container\'s memory limit. Combine with GOGC=200 for "GC less often, but respect the cap" behaviour.'
    },
    {
      q: 'What is `sync.Pool` used for?',
      options: [
        'Reusing heap-allocated objects across goroutines to reduce GC pressure by recycling allocations',
        'Pooling goroutines to avoid the cost of creating new goroutines',
        'Sharing database connections across multiple goroutines safely',
        'Limiting concurrent access to a resource like a semaphore',
      ],
      answer: 0,
      explanation: 'sync.Pool is a cache of objects that can be reused across goroutines. Get() returns a pooled object or calls New() if the pool is empty. Put() returns an object to the pool. This reduces allocations (and thus GC pressure) for objects that are frequently created and discarded — like byte buffers, encoder/decoder instances, and temporary structs in hot paths.'
    },
    {
      q: 'What does GOGC control and how does adjusting it affect performance?',
      options: ['The number of goroutines', 'The GC trigger threshold as a percentage of live heap growth — lower values = more frequent GC, higher = less frequent but larger pauses', 'The OS thread count', 'The stack size'],
      answer: 1,
      explanation: 'GOGC=100 (default) means GC triggers when the heap grows 100% over the previous live heap. GOGC=50 triggers more often (less memory, more CPU). GOGC=400 triggers rarely (more memory, less CPU overhead). Setting GOGC=off disables GC entirely (useful for very short-lived batch programs). Go 1.19+ adds GOMEMLIMIT as a complementary control — it triggers GC before exceeding a memory cap.'
    },
  ];

  qna: QnaItem[] = [
    {
      q: 'How do I profile a production service without restarting it?',
      a: 'Import _ "net/http/pprof" and start a debug HTTP server on localhost (go http.ListenAndServe("127.0.0.1:6060", nil)). In production, access it via kubectl port-forward: kubectl port-forward pod/myapp-xxx 6060:6060, then: go tool pprof http://localhost:6060/debug/pprof/profile?seconds=30. This captures 30 seconds of CPU data from the live process. For heap: go tool pprof http://localhost:6060/debug/pprof/heap.'
    },
    {
      q: 'What is the difference between a CPU profile and a heap profile?',
      a: 'CPU profile: sampled at 100Hz — shows where the program spends CPU time. Hot functions appear with high self/cumulative time. Use it when things are slow. Heap profile: snapshot of live heap allocations — shows which functions allocated memory that is currently live. inuse_space shows what is currently in use; alloc_space shows total allocated over time. Use it when memory is growing or GC pressure is high. For allocation rate (not just live), use alloc_objects profile.'
    },
    {
      q: 'How do I reduce allocations in a hot path?',
      a: 'Five main techniques: (1) Pre-allocate slices: make([]T, 0, n) with an estimated capacity. (2) sync.Pool: recycle buffers and structs. (3) Value types over pointers where the struct is small — value semantics avoids heap escape. (4) strings.Builder with Grow() for string construction. (5) bufio.Writer/Reader batches I/O syscalls. Use -benchmem and pprof alloc_objects to verify each change actually reduces allocations.'
    },
    {
      q: 'What is escape analysis and how does it affect allocations?',
      a: 'Escape analysis is the compiler\'s determination of whether a variable can live on the stack (fast, free) or must live on the heap (slower, GC-tracked). A value escapes to the heap when: it is returned as a pointer, stored in an interface, sent over a channel, or captured by a goroutine closure. Inspect escape decisions with: go build -gcflags=-m=2 ./... — it prints "does not escape" or "escapes to heap" per variable. Reducing escapes reduces allocations.'
    },
    {
      q: 'How do I use the execution tracer to diagnose latency spikes?',
      a: 'Capture a short trace from a live server: curl "http://localhost:6060/debug/pprof/trace?seconds=5" -o trace.out, then go tool trace trace.out. In the browser UI: "Goroutine analysis" shows goroutine counts and scheduling delays. "Scheduler latency profile" shows how long goroutines wait before running. GC pauses show as grey bands. Look for: many goroutines in "waiting" state (channel contention), long scheduler delays (CPU saturation), frequent GC pauses (high allocation rate).'
    },
    {
      q: 'When should I use GOGC vs GOMEMLIMIT?',
      a: 'GOGC controls GC trigger frequency: higher = less frequent GC, higher memory usage. Use when you want to trade memory for lower GC overhead. GOMEMLIMIT (Go 1.19+) is a hard memory cap: GC runs aggressively when you approach the limit regardless of GOGC. Use GOMEMLIMIT in containers to prevent OOM kills. Common pattern: GOGC=200 (GC less often) + GOMEMLIMIT=80% of container limit (hard cap). This gives low GC overhead in normal operation and memory safety under memory pressure.'
    },
  ];

  revision: RevisionSummary = {
    oneLiner: 'Profile first with pprof (CPU and heap), interpret benchmarks with -benchmem (allocs/op matters), use sync.Pool and pre-allocated slices to reduce GC pressure, tune GC with GOGC and GOMEMLIMIT.',
    mustKnow: [
      'Always profile before optimising — pprof shows the actual bottleneck.',
      'CPU profile: where time is spent. Heap profile: what is allocated and still live.',
      'net/http/pprof blank import registers /debug/pprof/ — never expose publicly.',
      '-benchmem shows allocs/op — high allocations cause GC pressure and tail latency.',
      'sync.Pool recycles objects to reduce heap allocations in hot paths.',
      'GOMEMLIMIT (Go 1.19+): hard memory cap — essential for container deployments.',
      'runtime.ReadMemStats is stop-the-world — collect in a background goroutine, not per-request.',
    ],
    interviewFocus: [
      'How would you profile a slow Go service in production?',
      'What is the difference between a CPU profile and a heap profile?',
      'What does allocs/op in benchmarks tell you and why does it matter?',
      'What is sync.Pool and when would you use it?',
      'How do GOGC and GOMEMLIMIT work together for container deployments?',
    ],
  };
}
