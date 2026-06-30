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
  selector: 'app-go-sync',
  standalone: true,
  imports: [PageMetaComponent, QuickRefComponent, TheoryBlockComponent, CodeBlockComponent,
    CommonMistakesComponent, ChallengeBlockComponent, QuizBlockComponent, QnaBlockComponent,
    RevisionCardComponent, PageCompleteComponent],
  templateUrl: './sync.html',
  styleUrl: './sync.scss'
})
export class GoSync {
  readingTime = 24;
  difficulty: 'beginner' | 'intermediate' | 'advanced' = 'intermediate';
  since = 'Go 1.19+';
  route = 'go-sync';
  nextRoute = '/go/context';
  nextLabel = 'context Package';

  quickRef: QuickRefItem[] = [
    { name: 'sync.Mutex / sync.RWMutex', type: 'class', desc: 'Mutual exclusion lock / reader-writer lock' },
    { name: 'mu.Lock() / mu.Unlock()', type: 'method', desc: 'Acquire / release exclusive lock. Always defer Unlock.' },
    { name: 'mu.RLock() / mu.RUnlock()', type: 'method', desc: 'Acquire / release read-only lock (multiple readers OK)' },
    { name: 'sync.WaitGroup', type: 'class', desc: 'Wait for a group of goroutines — Add before launch, Done in goroutine, Wait to block' },
    { name: 'sync.Once', type: 'class', desc: 'Execute a function exactly once across all goroutines' },
    { name: 'sync.Map', type: 'class', desc: 'Concurrent map — optimised for mostly-read or disjoint-key workloads' },
    { name: 'sync.Pool', type: 'class', desc: 'Reusable object pool — reduces GC pressure for temporary objects' },
    { name: 'sync.Cond', type: 'class', desc: 'Condition variable — broadcast or signal waiting goroutines' },
    { name: 'atomic.Int64 / atomic.Bool', type: 'class', desc: 'Lock-free atomic integer / boolean (Go 1.19+)' },
    { name: 'atomic.Value', type: 'class', desc: 'Lock-free atomic store/load of any consistent type' },
  ];

  theory: TheoryPoint[] = [
    {
      heading: 'sync.Mutex & sync.RWMutex',
      points: [
        '`sync.Mutex` provides mutual exclusion — only one goroutine can hold the lock at a time.',
        'Always call `defer mu.Unlock()` immediately after `mu.Lock()` to guarantee release even on panic.',
        '`sync.RWMutex` allows multiple concurrent readers (`RLock/RUnlock`) but exclusive writers (`Lock/Unlock`).',
        'Use RWMutex when reads vastly outnumber writes — it reduces lock contention.',
        'Never copy a Mutex — embed it in a struct and pass/store the struct by pointer.',
      ]
    },
    {
      heading: 'sync.Once — guaranteed single execution',
      points: [
        '`sync.Once` ensures a function is executed exactly once, even when called from multiple goroutines.',
        'Idiomatic use: lazy singleton initialisation — `var once sync.Once; once.Do(initFn)`.',
        'After the first call to `Do`, subsequent calls are no-ops even if `initFn` panics.',
        'Never use Once for repeated one-time tasks — it executes only once per Once instance for the program\'s lifetime.',
        'Common pattern: `var instance *DB; var once sync.Once; func GetDB() *DB { once.Do(func() { instance = openDB() }); return instance }`.',
      ]
    },
    {
      heading: 'sync.Map — concurrent map',
      points: [
        '`sync.Map` is a concurrent map safe for use from multiple goroutines without additional locking.',
        'Optimised for two patterns: (1) keys written once but read many times; (2) disjoint sets of keys per goroutine.',
        'For general concurrent maps with mixed read/write patterns, a `map + sync.RWMutex` is often faster.',
        'Methods: `Store(k, v)`, `Load(k)`, `LoadOrStore(k, v)`, `Delete(k)`, `Range(func(k, v any) bool)`.',
        'Returns `any` — you must type-assert: `v, ok := m.Load("key"); if ok { val := v.(string) }`.',
      ]
    },
    {
      heading: 'sync/atomic — lock-free operations',
      points: [
        'The `sync/atomic` package provides lock-free atomic read-modify-write operations on integer and pointer types.',
        'Go 1.19 added typed atomic values: `atomic.Int64`, `atomic.Uint64`, `atomic.Bool`, `atomic.Pointer[T]`.',
        '`atomic.Value` stores/loads an arbitrary value atomically — the stored type must remain consistent.',
        'Use atomics for simple counters and flags; use Mutex for more complex critical sections.',
        'Atomics are faster than mutexes for single-variable operations but do not compose — two atomic ops are not one atomic transaction.',
      ]
    },
    {
      heading: 'sync.Pool & sync.Cond',
      points: [
        '`sync.Pool` recycles temporary objects to reduce allocation pressure — e.g., `bytes.Buffer` pools in servers.',
        'Pool objects may be GC\'d at any time — Pool is not a cache. Get returns nil if the pool is empty.',
        'Pattern: `pool.Put(obj)` after use, `obj = pool.Get().(*MyType)` before use. Check for nil.',
        '`sync.Cond` is a condition variable that broadcasts or signals goroutines waiting on a condition.',
        'Prefer channels over Cond in most cases — Cond is mainly for complex state machines where multiple goroutines wait on shared state.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Mutex',
      language: 'typescript',
      code: `package main

import (
    "fmt"
    "sync"
)

type SafeCounter struct {
    mu    sync.Mutex
    count int
}

func (c *SafeCounter) Inc() {
    c.mu.Lock()
    defer c.mu.Unlock()
    c.count++
}

func (c *SafeCounter) Value() int {
    c.mu.Lock()
    defer c.mu.Unlock()
    return c.count
}

func main() {
    counter := &SafeCounter{}
    var wg sync.WaitGroup

    for i := 0; i < 1000; i++ {
        wg.Add(1)
        go func() {
            defer wg.Done()
            counter.Inc()
        }()
    }

    wg.Wait()
    fmt.Println(counter.Value()) // always 1000
}`
    },
    {
      label: 'RWMutex Cache',
      language: 'typescript',
      code: `package main

import (
    "fmt"
    "sync"
)

type Cache struct {
    mu    sync.RWMutex
    store map[string]string
}

func NewCache() *Cache {
    return &Cache{store: make(map[string]string)}
}

func (c *Cache) Set(key, val string) {
    c.mu.Lock()
    defer c.mu.Unlock()
    c.store[key] = val
}

func (c *Cache) Get(key string) (string, bool) {
    c.mu.RLock()         // multiple readers OK
    defer c.mu.RUnlock()
    v, ok := c.store[key]
    return v, ok
}

func main() {
    cache := NewCache()
    cache.Set("lang", "Go")
    cache.Set("version", "1.21")

    var wg sync.WaitGroup
    for i := 0; i < 10; i++ {
        wg.Add(1)
        go func() {
            defer wg.Done()
            v, _ := cache.Get("lang")
            fmt.Println(v) // Go (all concurrent — no race)
        }()
    }
    wg.Wait()
}`
    },
    {
      label: 'sync.Once',
      language: 'typescript',
      code: `package main

import (
    "fmt"
    "sync"
)

type DB struct{ dsn string }

var (
    db   *DB
    once sync.Once
)

func GetDB() *DB {
    once.Do(func() {
        fmt.Println("connecting to DB...")
        db = &DB{dsn: "postgres://localhost/mydb"}
    })
    return db
}

func main() {
    var wg sync.WaitGroup
    for i := 0; i < 5; i++ {
        wg.Add(1)
        go func() {
            defer wg.Done()
            d := GetDB()
            fmt.Printf("using db: %s\\n", d.dsn)
        }()
    }
    wg.Wait()
    // "connecting to DB..." prints exactly once
    // "using db: ..." prints 5 times
}`
    },
    {
      label: 'atomic.Int64',
      language: 'typescript',
      code: `package main

import (
    "fmt"
    "sync"
    "sync/atomic"
)

func main() {
    var (
        hits   atomic.Int64
        misses atomic.Int64
        wg     sync.WaitGroup
    )

    for i := 0; i < 1000; i++ {
        wg.Add(1)
        go func(n int) {
            defer wg.Done()
            if n%3 == 0 {
                misses.Add(1)
            } else {
                hits.Add(1)
            }
        }(i)
    }

    wg.Wait()
    fmt.Printf("hits: %d  misses: %d  total: %d\\n",
        hits.Load(), misses.Load(), hits.Load()+misses.Load())

    // Compare-and-swap
    var flag atomic.Bool
    flag.Store(false)
    swapped := flag.CompareAndSwap(false, true)
    fmt.Println("swapped:", swapped, "value:", flag.Load())
}`
    },
    {
      label: 'sync.Pool',
      language: 'typescript',
      code: `package main

import (
    "bytes"
    "fmt"
    "sync"
)

var bufPool = sync.Pool{
    New: func() any {
        return new(bytes.Buffer)
    },
}

func processRequest(data string) string {
    buf := bufPool.Get().(*bytes.Buffer)
    defer func() {
        buf.Reset()
        bufPool.Put(buf)
    }()

    buf.WriteString("processed: ")
    buf.WriteString(data)
    return buf.String()
}

func main() {
    var wg sync.WaitGroup
    for i := 0; i < 5; i++ {
        wg.Add(1)
        go func(n int) {
            defer wg.Done()
            result := processRequest(fmt.Sprintf("request-%d", n))
            fmt.Println(result)
        }(i)
    }
    wg.Wait()
}`
    },
  ];

  mistakes: CommonMistake[] = [
    {
      title: 'Forgetting defer mu.Unlock() — lock held on early return or panic',
      wrong: `func (c *Cache) Set(k, v string) {
    c.mu.Lock()
    if v == "" {
        return // lock never released!
    }
    c.store[k] = v
    c.mu.Unlock()
}`,
      right: `func (c *Cache) Set(k, v string) {
    c.mu.Lock()
    defer c.mu.Unlock() // always released
    if v == "" { return }
    c.store[k] = v
}`,
      explanation: 'If the function returns early or panics before Unlock(), the lock is held forever — all other goroutines waiting on Lock() deadlock. defer mu.Unlock() immediately after Lock() is the only safe pattern.'
    },
    {
      title: 'Copying a Mutex',
      wrong: `type Counter struct{ mu sync.Mutex; n int }
func process(c Counter) { // copies Counter — copies the Mutex!
    c.mu.Lock()
    defer c.mu.Unlock()
    c.n++
}`,
      right: `func process(c *Counter) { // pointer — shares the same Mutex
    c.mu.Lock()
    defer c.mu.Unlock()
    c.n++
}`,
      explanation: 'A Mutex contains internal state. Copying it produces a new Mutex that is independent of the original — two goroutines can both hold "the" lock simultaneously, breaking mutual exclusion. Always embed Mutex in a struct and pass the struct by pointer.'
    },
    {
      title: 'Holding a lock while calling slow or blocking code',
      wrong: `func (c *Cache) Refresh(key string) {
    c.mu.Lock()
    defer c.mu.Unlock()
    val := fetchFromDB(key) // slow network call while holding lock!
    c.store[key] = val
}`,
      right: `func (c *Cache) Refresh(key string) {
    val := fetchFromDB(key) // fetch outside the lock
    c.mu.Lock()
    defer c.mu.Unlock()
    c.store[key] = val      // update only the map under lock
}`,
      explanation: 'Holding a mutex while doing I/O or slow computation blocks all other goroutines waiting for that lock. Do the expensive work outside the critical section; acquire the lock only to update shared state.'
    },
    {
      title: 'Using atomic for multi-variable consistency',
      wrong: `// Two atomics — read both "atomically"
var x, y atomic.Int64
x.Store(1); y.Store(2)
// Another goroutine might see x=1,y=0 between the two stores`,
      right: `// Use mutex when two variables must change atomically
var mu sync.Mutex
var x, y int
mu.Lock(); x = 1; y = 2; mu.Unlock()`,
      explanation: 'Individual atomic operations are atomic, but two separate atomic calls are not one atomic transaction. If two variables must be updated together consistently, use a mutex around both updates.'
    },
    {
      title: 'Not resetting a sync.Pool object before returning it',
      wrong: `func process(data string) string {
    buf := pool.Get().(*bytes.Buffer)
    defer pool.Put(buf) // puts dirty buffer back!
    buf.WriteString(data)
    return buf.String()
}`,
      right: `func process(data string) string {
    buf := pool.Get().(*bytes.Buffer)
    defer func() {
        buf.Reset()    // clear before returning to pool
        pool.Put(buf)
    }()
    buf.WriteString(data)
    return buf.String()
}`,
      explanation: 'Pool objects retain their state when returned. If you put back a dirty buffer, the next goroutine that calls Get() will receive stale data. Always reset/clear the object before putting it back.'
    },
    {
      title: 'Using sync.Map when a map+RWMutex is faster',
      wrong: `// sync.Map with frequent writes and reads on overlapping keys
var m sync.Map
// Store + Load in a tight loop — slower than a plain map`,
      right: `// map + RWMutex for general concurrent access
type SafeMap struct {
    mu sync.RWMutex
    m  map[string]int
}`,
      explanation: 'sync.Map is optimised for read-heavy workloads with stable keys. For general concurrent access with frequent writes, a map protected by sync.RWMutex is typically faster. Benchmark before choosing.'
    },
  ];

  challenge: Challenge = {
    title: 'Concurrent Frequency Counter',
    language: 'typescript',
    description: `Build a thread-safe frequency counter that multiple goroutines can increment concurrently.

\`\`\`go
type FreqCounter struct { ... }
func (f *FreqCounter) Increment(key string)
func (f *FreqCounter) Count(key string) int
func (f *FreqCounter) TopN(n int) []string
\`\`\`

Requirements:
- \`Increment\` and \`Count\` must be safe to call from multiple goroutines simultaneously
- \`TopN\` returns the top N keys sorted by frequency (descending), breaking ties alphabetically
- Use sync.RWMutex (reads happen more often than writes)

Test it:
\`\`\`go
fc := &FreqCounter{counts: make(map[string]int)}
// 1000 goroutines each increment random words
// TopN(3) should return the 3 most frequent
\`\`\``,
    hints: [
      'Embed sync.RWMutex in the struct',
      'Increment uses Lock/Unlock; Count uses RLock/RUnlock',
      'TopN needs a full read lock — collect all keys and sort under RLock',
      'Sort by count descending, then alphabetically for ties',
    ],
    starterCode: `package main

import (
    "fmt"
    "sort"
    "sync"
)

type FreqCounter struct {
    mu     sync.RWMutex
    counts map[string]int
}

func (f *FreqCounter) Increment(key string) {
    // TODO: thread-safe increment
}

func (f *FreqCounter) Count(key string) int {
    // TODO: thread-safe read
    return 0
}

func (f *FreqCounter) TopN(n int) []string {
    // TODO: return top n keys by frequency
    return nil
}

func main() {
    fc := &FreqCounter{counts: make(map[string]int)}
    words := []string{"go", "is", "fast", "go", "is", "go", "great"}

    var wg sync.WaitGroup
    for _, w := range words {
        wg.Add(1)
        w := w
        go func() {
            defer wg.Done()
            fc.Increment(w)
        }()
    }
    wg.Wait()

    fmt.Println(fc.TopN(3))
    fmt.Println(fc.Count("go"))
}`,
    solution: `package main

import (
    "fmt"
    "sort"
    "sync"
)

type FreqCounter struct {
    mu     sync.RWMutex
    counts map[string]int
}

func (f *FreqCounter) Increment(key string) {
    f.mu.Lock()
    defer f.mu.Unlock()
    f.counts[key]++
}

func (f *FreqCounter) Count(key string) int {
    f.mu.RLock()
    defer f.mu.RUnlock()
    return f.counts[key]
}

func (f *FreqCounter) TopN(n int) []string {
    f.mu.RLock()
    keys := make([]string, 0, len(f.counts))
    for k := range f.counts { keys = append(keys, k) }
    counts := make(map[string]int, len(f.counts))
    for k, v := range f.counts { counts[k] = v }
    f.mu.RUnlock()

    sort.Slice(keys, func(i, j int) bool {
        if counts[keys[i]] != counts[keys[j]] {
            return counts[keys[i]] > counts[keys[j]]
        }
        return keys[i] < keys[j]
    })
    if n > len(keys) { n = len(keys) }
    return keys[:n]
}

func main() {
    fc := &FreqCounter{counts: make(map[string]int)}
    words := []string{"go", "is", "fast", "go", "is", "go", "great"}

    var wg sync.WaitGroup
    for _, w := range words {
        wg.Add(1)
        w := w
        go func() {
            defer wg.Done()
            fc.Increment(w)
        }()
    }
    wg.Wait()

    fmt.Println(fc.TopN(3))   // [go is fast] or [go is great]
    fmt.Println(fc.Count("go")) // 3
}`,
  };

  quiz: QuizQuestion[] = [
    {
      q: 'What is the difference between sync.Mutex and sync.RWMutex?',
      options: [
        'Mutex allows one goroutine at a time; RWMutex allows multiple readers but only one writer',
        'RWMutex is faster than Mutex for all operations',
        'Mutex is for goroutines; RWMutex is for OS threads',
        'They are equivalent — RWMutex is just an alias',
      ],
      answer: 0,
      explanation: 'sync.Mutex provides exclusive access — only one goroutine at a time. sync.RWMutex allows any number of concurrent readers (RLock) but exclusive writers (Lock). Use RWMutex when reads are much more frequent than writes.'
    },
    {
      q: 'Why must you always use defer mu.Unlock() after mu.Lock()?',
      options: [
        'To guarantee the lock is released even if the function panics or returns early',
        'Because Unlock() must be called in a goroutine',
        'To improve performance by batching unlock operations',
        'Because mu.Lock() is asynchronous and needs defer to wait for it',
      ],
      answer: 0,
      explanation: 'defer ensures Unlock() is called when the function returns, regardless of how — normal return, early return, or panic. Without defer, any code path that returns without explicitly calling Unlock() leaves the lock held forever, causing deadlock.'
    },
    {
      q: 'What does sync.Once guarantee?',
      options: [
        'The function passed to Do runs exactly once across all goroutines, ever',
        'The function runs once per goroutine',
        'The function runs once per call to Do()',
        'The function runs once per program execution (not goroutine-safe)',
      ],
      answer: 0,
      explanation: 'sync.Once guarantees the function runs exactly once, even when Do is called concurrently from many goroutines. Subsequent calls to Do are no-ops. It is used for lazy initialisation of singletons.'
    },
    {
      q: 'When is sync.Map preferred over map + sync.RWMutex?',
      options: [
        'When keys are written once and read many times, or when disjoint goroutines access disjoint keys',
        'Always — sync.Map is always faster',
        'When the map has fewer than 100 keys',
        'When you need to iterate the map with Range()',
      ],
      answer: 0,
      explanation: 'sync.Map is optimised for read-heavy or disjoint-key workloads. For general mixed read/write access on overlapping keys, a map protected by sync.RWMutex is usually faster. Benchmark before choosing.'
    },
    {
      q: 'What does atomic.Int64.CompareAndSwap(old, new) do?',
      options: [
        'Atomically sets the value to new only if it currently equals old — returns true if swapped',
        'Compares old and new and returns true if they are equal',
        'Swaps old and new values between two atomic integers',
        'Adds (new - old) to the current value atomically',
      ],
      answer: 0,
      explanation: 'CompareAndSwap (CAS) atomically checks if the current value equals old, and if so, sets it to new and returns true. If the current value differs from old, it does nothing and returns false. CAS is the foundation of lock-free algorithms.'
    },
    {
      q: 'What is the difference between sync.Mutex and sync.RWMutex and when do you choose each?',
      options: ['They are identical', 'Mutex: exclusive lock for all access; RWMutex: allows concurrent readers (RLock) but exclusive writer (Lock) — use RWMutex when reads dominate writes', 'RWMutex is deprecated', 'Mutex is only for goroutines; RWMutex is for OS threads'],
      answer: 1,
      explanation: 'sync.Mutex: every operation (read or write) requires an exclusive lock — only one goroutine at a time. sync.RWMutex: multiple goroutines can hold RLock() simultaneously; Lock() is exclusive. Use RWMutex for read-heavy workloads like in-memory caches or config maps where reads far outnumber writes. For write-heavy workloads, RWMutex overhead (maintaining reader count) can be worse than a plain Mutex.'
    },
  ];

  qna: QnaItem[] = [
    {
      q: 'When should I use a mutex vs a channel for synchronisation?',
      a: 'Use a mutex when protecting shared state (a cache, counter, or data structure) that multiple goroutines read and write. The mutex guards the critical section. Use a channel when transferring ownership of data between goroutines or coordinating goroutine lifecycle (done signal, work distribution). Rule of thumb: mutex for shared state, channel for communication and ownership transfer.'
    },
    {
      q: 'What is a deadlock and how can sync primitives cause one?',
      a: 'A deadlock is a state where two or more goroutines are waiting for each other and none can proceed. With mutexes: goroutine A holds lock 1 and waits for lock 2; goroutine B holds lock 2 and waits for lock 1 — circular wait. Prevention: always acquire locks in the same order, keep critical sections short, and use defer Unlock(). Go detects simple deadlocks (all goroutines blocked) at runtime with "all goroutines are asleep — deadlock!"'
    },
    {
      q: 'What is the difference between atomic operations and mutexes?',
      a: 'Atomic operations on a single variable (Add, Store, Load, CompareAndSwap) are implemented with CPU instructions that are inherently atomic — no locking. They are faster but limited: you can only atomically operate on one variable at a time, and two atomic operations together are not one atomic transaction. Mutexes protect arbitrary blocks of code (critical sections) at higher overhead. Use atomics for simple counters and flags; use mutexes for anything that involves multiple variables or complex logic.'
    },
    {
      q: 'What is sync.Pool and when should I use it?',
      a: 'sync.Pool maintains a pool of reusable objects to reduce allocation and GC pressure. Get() returns a pooled object (or calls New() if empty); Put() returns it. The pool may be emptied between GC runs — it is not a cache. Use it for frequently allocated short-lived objects like buffers, parsers, or formatters. The net/http package uses a Pool for response buffers. Always reset the object before returning it to the pool.'
    },
    {
      q: 'What is sync.Cond and when would I use it over a channel?',
      a: 'sync.Cond is a condition variable — goroutines call Wait() to sleep until a condition is true, and other goroutines call Broadcast() or Signal() to wake them. It is used when multiple goroutines wait on the same shared condition that cannot be easily modelled with channels — for example, a thread pool waiting for available workers, or a publish/subscribe system. In most cases, channels are simpler and preferred. Cond shines in complex state machines with many waiters on a single condition.'
    },
    {
      q: 'What does go run -race do?',
      a: 'The race detector instruments memory accesses at compile time and monitors them at runtime, reporting any unsynchronised concurrent accesses. It adds ~2x memory and ~10x CPU overhead, so use it in tests and development, not production. Run: `go test -race ./...` to check all tests. The race detector is highly reliable — any race it reports is a real bug. Fix it with proper synchronisation before the code ships.'
    },
  ];

  revision: RevisionSummary = {
    oneLiner: 'sync primitives protect shared state — Mutex for exclusive access, RWMutex for read-heavy data, Once for singletons, and atomics for lock-free counters.',
    mustKnow: [
      'Always defer mu.Unlock() immediately after mu.Lock() — protects against early returns and panics.',
      'Never copy a Mutex — embed it in a struct, pass the struct by pointer.',
      'RWMutex: RLock/RUnlock for reads (many concurrent OK), Lock/Unlock for writes (exclusive).',
      'sync.Once: runs exactly once across all goroutines — for lazy singleton initialisation.',
      'atomic.Int64/Bool: lock-free for single variables; not a substitute for mutex on multiple variables.',
      'sync.Pool: reuse temporary objects to reduce GC pressure — always reset before Put().',
      'Race detector: go run -race / go test -race — run in CI, fix every race reported.',
    ],
    interviewFocus: [
      'When do you use Mutex vs RWMutex?',
      'Why is defer mu.Unlock() critical? What happens if you forget it?',
      'What are atomics and when can they replace a mutex?',
      'What is sync.Once used for? Can the function ever run twice?',
      'What is the race detector and how do you enable it?',
    ],
  };
}
