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
  selector: 'app-go-goroutines',
  standalone: true,
  imports: [PageMetaComponent, QuickRefComponent, TheoryBlockComponent, CodeBlockComponent,
    CommonMistakesComponent, ChallengeBlockComponent, QuizBlockComponent, QnaBlockComponent,
    RevisionCardComponent, PageCompleteComponent],
  templateUrl: './goroutines.html',
  styleUrl: './goroutines.scss'
})
export class GoGoroutines {
  readingTime = 25;
  difficulty: 'beginner' | 'intermediate' | 'advanced' = 'intermediate';
  since = 'Go 1.21+';
  route = 'go-goroutines';
  nextRoute = '/go/channels';
  nextLabel = 'Channels';

  quickRef: QuickRefItem[] = [
    { name: 'go f()', type: 'keyword', desc: 'Launch f as a new goroutine — returns immediately' },
    { name: 'var wg sync.WaitGroup', type: 'syntax', desc: 'WaitGroup to wait for a set of goroutines to finish' },
    { name: 'wg.Add(n) / wg.Done() / wg.Wait()', type: 'method', desc: 'Track goroutine count and block until all Done()' },
    { name: 'runtime.GOMAXPROCS(n)', type: 'function', desc: 'Set max OS threads for goroutine execution (default = CPU count)' },
    { name: 'runtime.NumGoroutine()', type: 'function', desc: 'Current number of live goroutines — useful for debugging leaks' },
    { name: 'runtime.Gosched()', type: 'function', desc: 'Yield the processor — let other goroutines run' },
    { name: 'go func() { defer wg.Done(); ... }()', type: 'syntax', desc: 'Inline goroutine with WaitGroup cleanup via defer' },
    { name: 'errgroup.Group', type: 'class', desc: 'golang.org/x/sync/errgroup — WaitGroup that propagates the first error' },
    { name: 'context.WithCancel(ctx)', type: 'function', desc: 'Create a context that goroutines can listen to for cancellation' },
    { name: 'race detector: go run -race', type: 'syntax', desc: 'Build/run with data race detection enabled' },
  ];

  theory: TheoryPoint[] = [
    {
      heading: 'What are goroutines?',
      points: [
        'A goroutine is a lightweight, independently executing function managed by the Go runtime — not an OS thread.',
        'Start one with `go f(args)`. The call returns immediately; `f` runs concurrently.',
        'Goroutines start with a tiny stack (~2-8 KB) that grows and shrinks automatically — you can have millions running at once.',
        'The Go scheduler multiplexes goroutines onto a pool of OS threads using an M:N model (many goroutines to fewer OS threads).',
        'GOMAXPROCS (default = number of CPUs) controls how many OS threads can execute Go code simultaneously.',
      ]
    },
    {
      heading: 'sync.WaitGroup — waiting for goroutines',
      points: [
        'WaitGroup waits for a collection of goroutines to finish: `wg.Add(n)` before launching, `wg.Done()` when each goroutine finishes, `wg.Wait()` to block.',
        'Always call `defer wg.Done()` at the top of the goroutine so it fires even on panic.',
        'Never copy a WaitGroup — pass it as a pointer `*sync.WaitGroup`.',
        'Mismatched Add/Done counts cause either a panic (negative counter) or permanent deadlock at Wait.',
        'Use errgroup (golang.org/x/sync) when goroutines return errors — it collects the first error and cancels the rest.',
      ]
    },
    {
      heading: 'Data races & the race detector',
      points: [
        'A data race occurs when two goroutines access the same memory location concurrently and at least one access is a write.',
        'Data races produce undefined behaviour — incorrect results, silent corruption, or crashes.',
        'Enable the race detector: `go run -race main.go` or `go test -race ./...`. It adds ~10x overhead but catches races at runtime.',
        'Fix races with channels (communicate, don\'t share) or synchronisation primitives (mutex, atomic).',
        'The golden rule: do not communicate by sharing memory; share memory by communicating.',
      ]
    },
    {
      heading: 'Goroutine leaks',
      points: [
        'A goroutine leak occurs when a goroutine is launched but never exits — it stays alive and consumes resources forever.',
        'Common causes: blocking on a channel that is never written to, waiting for a context that is never cancelled, infinite loops.',
        'Prevention: always give goroutines a way to exit — use `context.Context` cancellation or a done channel.',
        'Detect leaks with `runtime.NumGoroutine()` or goleak (github.com/uber-go/goleak) in tests.',
        'Always document goroutine lifetime: "this goroutine exits when ctx is cancelled".',
      ]
    },
    {
      heading: 'Fan-out & fan-in patterns',
      points: [
        'Fan-out: launch N goroutines to process work in parallel — use a WaitGroup to wait for all to finish.',
        'Fan-in: merge results from multiple goroutines into a single channel.',
        'Worker pool: a fixed number of goroutines drain a work channel — controls parallelism and prevents resource exhaustion.',
        'Bounded concurrency: use a semaphore (buffered channel of `struct{}`) to limit concurrent goroutines.',
        '`errgroup.WithContext` gives fan-out with automatic cancellation on first error.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Basic Goroutines',
      language: 'typescript',
      code: `package main

import (
    "fmt"
    "sync"
    "time"
)

func worker(id int, wg *sync.WaitGroup) {
    defer wg.Done()
    fmt.Printf("worker %d starting\\n", id)
    time.Sleep(10 * time.Millisecond) // simulate work
    fmt.Printf("worker %d done\\n", id)
}

func main() {
    var wg sync.WaitGroup

    for i := 1; i <= 5; i++ {
        wg.Add(1)
        go worker(i, &wg)
    }

    wg.Wait() // block until all 5 workers call Done()
    fmt.Println("all workers finished")
}`
    },
    {
      label: 'Fan-out / Fan-in',
      language: 'typescript',
      code: `package main

import (
    "fmt"
    "sync"
)

func processItem(item int) int {
    return item * item // simulate expensive computation
}

func fanOut(items []int) []int {
    results := make([]int, len(items))
    var wg sync.WaitGroup

    for i, item := range items {
        wg.Add(1)
        go func(idx, val int) {
            defer wg.Done()
            results[idx] = processItem(val)
        }(i, item)
    }

    wg.Wait()
    return results
}

func main() {
    items := []int{1, 2, 3, 4, 5, 6, 7, 8}
    results := fanOut(items)
    fmt.Println(results) // [1 4 9 16 25 36 49 64]
}`
    },
    {
      label: 'Worker Pool',
      language: 'typescript',
      code: `package main

import (
    "fmt"
    "sync"
)

type Job struct {
    ID    int
    Value int
}

type Result struct {
    JobID  int
    Output int
}

func workerPool(numWorkers int, jobs <-chan Job, results chan<- Result) {
    var wg sync.WaitGroup
    for i := 0; i < numWorkers; i++ {
        wg.Add(1)
        go func() {
            defer wg.Done()
            for job := range jobs {
                results <- Result{
                    JobID:  job.ID,
                    Output: job.Value * job.Value,
                }
            }
        }()
    }
    wg.Wait()
    close(results)
}

func main() {
    jobs    := make(chan Job, 10)
    results := make(chan Result, 10)

    go workerPool(3, jobs, results)

    // Send jobs
    for i := 1; i <= 9; i++ {
        jobs <- Job{ID: i, Value: i}
    }
    close(jobs)

    // Collect results
    for r := range results {
        fmt.Printf("job %d → %d\\n", r.JobID, r.Output)
    }
}`
    },
    {
      label: 'errgroup',
      language: 'typescript',
      code: `package main

import (
    "context"
    "fmt"
    "golang.org/x/sync/errgroup"
)

func fetchURL(ctx context.Context, url string) (string, error) {
    // Simulate fetch — check ctx for cancellation
    select {
    case <-ctx.Done():
        return "", ctx.Err()
    default:
        return "content from " + url, nil
    }
}

func fetchAll(urls []string) ([]string, error) {
    g, ctx := errgroup.WithContext(context.Background())
    results := make([]string, len(urls))

    for i, url := range urls {
        i, url := i, url // capture
        g.Go(func() error {
            content, err := fetchURL(ctx, url)
            if err != nil {
                return fmt.Errorf("fetch %s: %w", url, err)
            }
            results[i] = content
            return nil
        })
    }

    if err := g.Wait(); err != nil {
        return nil, err
    }
    return results, nil
}

func main() {
    urls := []string{"https://a.com", "https://b.com", "https://c.com"}
    results, err := fetchAll(urls)
    if err != nil {
        fmt.Println("error:", err)
        return
    }
    for _, r := range results { fmt.Println(r) }
}`
    },
    {
      label: 'Semaphore (Bounded Concurrency)',
      language: 'typescript',
      code: `package main

import (
    "fmt"
    "sync"
    "time"
)

func processWithLimit(items []int, maxConcurrent int) []int {
    sem     := make(chan struct{}, maxConcurrent) // semaphore
    results := make([]int, len(items))
    var wg sync.WaitGroup

    for i, item := range items {
        wg.Add(1)
        go func(idx, val int) {
            defer wg.Done()
            sem <- struct{}{}        // acquire
            defer func() { <-sem }() // release

            // Only maxConcurrent goroutines here at once
            time.Sleep(5 * time.Millisecond)
            results[idx] = val * 2
        }(i, item)
    }

    wg.Wait()
    return results
}

func main() {
    items := []int{1, 2, 3, 4, 5, 6, 7, 8, 9, 10}
    // At most 3 goroutines process concurrently
    results := processWithLimit(items, 3)
    fmt.Println(results) // [2 4 6 8 10 12 14 16 18 20]
}`
    },
  ];

  mistakes: CommonMistake[] = [
    {
      title: 'Capturing the loop variable in a goroutine',
      wrong: `for i := 0; i < 5; i++ {
    go func() {
        fmt.Println(i) // all goroutines may print 5
    }()
}`,
      right: `for i := 0; i < 5; i++ {
    i := i // shadow — create per-iteration copy
    go func() {
        fmt.Println(i) // prints 0 1 2 3 4 in some order
    }()
}
// Or pass as argument:
go func(n int) { fmt.Println(n) }(i)`,
      explanation: 'Closures capture variables by reference. In Go 1.21 and earlier, all goroutines share the same i — by the time they run, the loop may have finished and i == 5. Shadow with i := i or pass as an argument.'
    },
    {
      title: 'Not waiting for goroutines to finish',
      wrong: `func main() {
    go fmt.Println("hello from goroutine")
    // main() exits immediately — goroutine may never print
}`,
      right: `func main() {
    var wg sync.WaitGroup
    wg.Add(1)
    go func() {
        defer wg.Done()
        fmt.Println("hello from goroutine")
    }()
    wg.Wait()
}`,
      explanation: 'When main() returns, all goroutines are killed immediately. You must wait for goroutines to finish with a WaitGroup, channel, or errgroup.'
    },
    {
      title: 'Calling wg.Add inside the goroutine',
      wrong: `var wg sync.WaitGroup
for i := 0; i < 5; i++ {
    go func() {
        wg.Add(1)     // too late — may race with wg.Wait()
        defer wg.Done()
    }()
}
wg.Wait()`,
      right: `var wg sync.WaitGroup
for i := 0; i < 5; i++ {
    wg.Add(1)         // before go — guaranteed before Wait()
    go func() {
        defer wg.Done()
    }()
}
wg.Wait()`,
      explanation: 'wg.Add must be called before the goroutine starts. If called inside, there is a race between Add and Wait — the counter might read 0 before the goroutine increments it, allowing Wait to return early.'
    },
    {
      title: 'Writing to a shared variable without synchronisation',
      wrong: `counter := 0
var wg sync.WaitGroup
for i := 0; i < 1000; i++ {
    wg.Add(1)
    go func() {
        defer wg.Done()
        counter++ // data race!
    }()
}
wg.Wait()`,
      right: `var counter atomic.Int64
var wg sync.WaitGroup
for i := 0; i < 1000; i++ {
    wg.Add(1)
    go func() {
        defer wg.Done()
        counter.Add(1) // atomic — safe
    }()
}
wg.Wait()`,
      explanation: 'Concurrent writes (and read+write) to a shared variable are a data race. Use sync/atomic for simple counters, sync.Mutex for more complex state, or channels to pass results.'
    },
    {
      title: 'Goroutine leak — blocking forever on a channel',
      wrong: `func startWorker() {
    ch := make(chan int)
    go func() {
        v := <-ch // blocks forever — nobody sends
        process(v)
    }()
    // ch goes out of scope — goroutine leaks
}`,
      right: `func startWorker(ctx context.Context) {
    ch := make(chan int, 1)
    go func() {
        select {
        case v := <-ch:
            process(v)
        case <-ctx.Done():
            return // exit on cancellation
        }
    }()
}`,
      explanation: 'A goroutine that blocks on a channel with no sender leaks — it occupies memory and a goroutine slot forever. Always give goroutines an exit path via context cancellation or a done channel.'
    },
    {
      title: 'Launching unbounded goroutines for large input',
      wrong: `for _, item := range hugeList {
    go process(item) // could launch millions of goroutines
}`,
      right: `sem := make(chan struct{}, 100) // max 100 concurrent
var wg sync.WaitGroup
for _, item := range hugeList {
    wg.Add(1)
    sem <- struct{}{}
    go func(it Item) {
        defer wg.Done()
        defer func() { <-sem }()
        process(it)
    }(item)
}
wg.Wait()`,
      explanation: 'Launching one goroutine per item on large datasets causes memory exhaustion and scheduler thrashing. Use a bounded worker pool or semaphore to control concurrency.'
    },
  ];

  challenge: Challenge = {
    title: 'Parallel URL Checker',
    language: 'typescript',
    description: `Write a function \`CheckURLs(urls []string, timeout time.Duration) map[string]bool\` that checks whether each URL is reachable concurrently.

Requirements:
- Check all URLs in parallel (one goroutine per URL)
- Each check should respect the given timeout
- Return a map from URL to true (reachable) / false (not reachable or timed out)
- The function should return only after ALL checks complete

For this exercise, simulate the check instead of making real HTTP calls:
\`\`\`go
func check(url string, timeout time.Duration) bool {
    // Simulate: URLs containing "ok" succeed, others fail
    time.Sleep(timeout / 2)
    return strings.Contains(url, "ok")
}
\`\`\``,
    hints: [
      'Use sync.WaitGroup to wait for all goroutines',
      'Use sync.Mutex to safely write to the results map from multiple goroutines',
      'Or: use a channel to collect (url, bool) pairs, then build the map after',
      'Capture loop variables correctly: url := url before the go func()',
    ],
    starterCode: `package main

import (
    "fmt"
    "strings"
    "sync"
    "time"
)

func check(url string, timeout time.Duration) bool {
    time.Sleep(timeout / 2)
    return strings.Contains(url, "ok")
}

func CheckURLs(urls []string, timeout time.Duration) map[string]bool {
    results := make(map[string]bool)
    // TODO: check all urls concurrently
    return results
}

func main() {
    urls := []string{
        "http://ok.example.com",
        "http://fail.example.com",
        "http://ok.api.com",
        "http://timeout.com",
    }
    results := CheckURLs(urls, 100*time.Millisecond)
    for url, ok := range results {
        fmt.Printf("%s -> %v\\n", url, ok)
    }
}`,
    solution: `package main

import (
    "fmt"
    "strings"
    "sync"
    "time"
)

func check(url string, timeout time.Duration) bool {
    time.Sleep(timeout / 2)
    return strings.Contains(url, "ok")
}

func CheckURLs(urls []string, timeout time.Duration) map[string]bool {
    results := make(map[string]bool, len(urls))
    var (
        wg sync.WaitGroup
        mu sync.Mutex
    )

    for _, url := range urls {
        url := url // capture
        wg.Add(1)
        go func() {
            defer wg.Done()
            ok := check(url, timeout)
            mu.Lock()
            results[url] = ok
            mu.Unlock()
        }()
    }

    wg.Wait()
    return results
}

func main() {
    urls := []string{
        "http://ok.example.com",
        "http://fail.example.com",
        "http://ok.api.com",
        "http://timeout.com",
    }
    results := CheckURLs(urls, 100*time.Millisecond)
    for url, ok := range results {
        fmt.Printf("%s -> %v\\n", url, ok)
    }
}`,
  };

  quiz: QuizQuestion[] = [
    {
      q: 'What is the approximate initial stack size of a goroutine?',
      options: ['2-8 KB (grows dynamically)', '1 MB (fixed)', '8 MB (OS thread default)', '64 KB (fixed)'],
      answer: 0,
      explanation: 'Goroutines start with a tiny stack (2-8 KB depending on Go version) that grows and shrinks automatically via stack copying. OS threads typically default to 1-8 MB. This small initial size makes it practical to run millions of goroutines.'
    },
    {
      q: 'What does wg.Add(n) do and when should you call it?',
      options: [
        'Increments the WaitGroup counter by n — must be called BEFORE launching the goroutine',
        'Increments the counter by n — can be called inside the goroutine',
        'Reserves n goroutine slots in the scheduler',
        'Sets the total number of goroutines to wait for (not additive)',
      ],
      answer: 0,
      explanation: 'wg.Add increments the counter. It must be called before the goroutine starts. If called inside, there is a race with wg.Wait() — the counter could read 0 before the goroutine increments it.'
    },
    {
      q: 'What is a data race in Go?',
      options: [
        'Two goroutines accessing the same memory concurrently where at least one access is a write',
        'Two goroutines trying to receive from the same channel',
        'A goroutine that runs faster than the scheduler expects',
        'A deadlock caused by circular channel dependencies',
      ],
      answer: 0,
      explanation: 'A data race is a concurrent unsynchronised access to shared memory where at least one goroutine writes. It produces undefined behaviour. Use go run -race to detect races, and channels or sync primitives to fix them.'
    },
    {
      q: 'What is the Go concurrency motto about sharing data?',
      options: [
        'Do not communicate by sharing memory; share memory by communicating',
        'Share everything through global variables; use locks sparingly',
        'Use goroutines for I/O and threads for CPU work',
        'All data must be immutable when shared between goroutines',
      ],
      answer: 0,
      explanation: 'The Go motto is "Do not communicate by sharing memory; share memory by communicating." Prefer channels to pass ownership of data between goroutines rather than protecting shared memory with locks.'
    },
    {
      q: 'What is a goroutine leak?',
      options: [
        'A goroutine that blocks indefinitely and never exits',
        'A goroutine that uses too much memory',
        'A goroutine that exits before completing its work',
        'A goroutine that escapes its package scope',
      ],
      answer: 0,
      explanation: 'A goroutine leak is a goroutine that blocks forever — typically on a channel that is never written to, or a context that is never cancelled. Leaking goroutines accumulate memory and exhaust resources over time.'
    },
    {
      q: 'What is the GOMAXPROCS setting and what is its default value in modern Go?',
      options: ['1 — Go runs on a single OS thread by default', 'Equal to the number of logical CPU cores — Go sets it automatically from runtime.NumCPU()', 'Always 8 regardless of hardware', 'Unlimited'],
      answer: 1,
      explanation: 'Since Go 1.5, GOMAXPROCS defaults to runtime.NumCPU() — the number of logical CPUs. This means Go can run goroutines in true parallelism on multi-core machines. You can override it with runtime.GOMAXPROCS(n) or the GOMAXPROCS environment variable. In containers, be aware that NumCPU() reads the host CPU count, not the container CPU limit — use the automaxprocs library to automatically set GOMAXPROCS from cgroup limits.'
    },
  ];

  qna: QnaItem[] = [
    {
      q: 'How are goroutines different from OS threads?',
      a: 'Goroutines are managed by the Go runtime, not the OS. They start with a tiny stack (~2-8 KB) that grows automatically. The Go scheduler multiplexes thousands of goroutines onto a small pool of OS threads (M:N scheduling). Creating a goroutine is ~1-2 µs vs ~10-100 µs for a thread. You can have millions of goroutines; OS threads are limited to thousands. Context switching between goroutines is much cheaper.'
    },
    {
      q: 'When should I use a WaitGroup vs a channel to coordinate goroutines?',
      a: 'Use WaitGroup when you just need to wait for goroutines to finish without collecting their results. Use a channel when goroutines produce results that need to be collected, or when you need to signal between goroutines. errgroup (golang.org/x/sync) is the best choice when goroutines can fail — it combines WaitGroup semantics with automatic error propagation and context cancellation.'
    },
    {
      q: 'What is GOMAXPROCS and should I change it?',
      a: 'GOMAXPROCS sets how many OS threads can execute Go code simultaneously — it defaults to the number of available CPU cores. For most programs, the default is optimal. You might reduce it to simulate limited concurrency in tests, or set it to 1 for single-threaded performance profiling. Increase is rarely useful since Go already uses all cores by default. Set via `runtime.GOMAXPROCS(n)` or the `GOMAXPROCS` environment variable.'
    },
    {
      q: 'How do I prevent a goroutine from running forever?',
      a: 'Pass a `context.Context` to the goroutine and select on `ctx.Done()` in blocking operations. When the context is cancelled (by `cancel()` from `WithCancel`, timeout from `WithTimeout`, or deadline from `WithDeadline`), the goroutine can exit cleanly. Document the goroutine\'s lifetime: "exits when ctx is cancelled." Use goleak in tests to detect unexpected survivors.'
    },
    {
      q: 'What is the goroutine loop variable capture bug and is it fixed in Go 1.22?',
      a: 'In Go 1.21 and earlier, a loop variable (`for i, v := range s`) is a single variable reused each iteration. Goroutines or deferred closures capturing i or v by reference all share the same variable. By the time they run, the loop may have advanced. Fix: shadow with `i := i` or pass as an argument. Go 1.22 changed range loop semantics so that each iteration gets its own variable — eliminating this bug for range loops. Classic C-style loops (`for i := 0; i < n; i++`) are unchanged.'
    },
    {
      q: 'What is a semaphore pattern and why use it?',
      a: 'A semaphore limits how many goroutines can execute a section of code simultaneously. In Go, implement it with a buffered channel: `sem := make(chan struct{}, N)`. Acquire by sending: `sem <- struct{}{}`. Release by receiving: `<-sem`. This prevents launching unlimited goroutines for large workloads (which would exhaust memory) and instead processes items in bounded batches. It is simpler than a full worker pool when order does not matter.'
    },
  ];

  revision: RevisionSummary = {
    oneLiner: 'Goroutines are cheap lightweight threads — launch with go, coordinate with WaitGroup or channels, and always give them an exit path.',
    mustKnow: [
      '`go f()` launches a goroutine that runs concurrently. main() exits immediately after — use WaitGroup to wait.',
      'wg.Add before launch, defer wg.Done() at the top of the goroutine, wg.Wait() to block.',
      'Shadow loop variables: `i := i` before `go func()`, or pass as arguments (Go 1.22+ fixes range vars).',
      'Data races: concurrent read+write on shared memory = undefined behaviour. Use -race flag to detect.',
      'Goroutine leaks: goroutines that block forever. Always provide a context cancellation exit path.',
      'Bounded concurrency: semaphore (buffered channel) or worker pool — never launch one goroutine per item on large input.',
      'errgroup: WaitGroup + first-error propagation + context cancellation in one package.',
    ],
    interviewFocus: [
      'How do goroutines differ from OS threads?',
      'Explain the loop variable capture bug and the fix.',
      'What is a goroutine leak and how do you prevent one?',
      'When would you use a worker pool vs launching one goroutine per item?',
      'How do you make fan-out return the first error and cancel remaining work?',
    ],
  };
}
