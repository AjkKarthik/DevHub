import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  standalone: true,
  imports: [PageMetaComponent, TheoryBlockComponent, CodeBlockComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent, SubtopicEyebrowComponent],
  templateUrl: './gomaxprocs-doesnt-cap-blocked-threads.html',
  styleUrl: './gomaxprocs-doesnt-cap-blocked-threads.scss'
})
export class GomaxprocsDoesntCapBlockedThreadsSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'GOMAXPROCS caps threads running Go code — not the total number of OS threads Go can create',
      points: [
        'The main page\'s own quick reference describes GOMAXPROCS as controlling "how many OS threads can execute Go code simultaneously," and its theory section repeats that as "GOMAXPROCS controls how many OS threads can execute Go code simultaneously." That description is accurate — but read literally, it invites the assumption that GOMAXPROCS is a hard ceiling on Go\'s total OS thread usage. It is not, and the exact scope of the word "simultaneously" is the whole subject of this subtopic.',
        'Go\'s own runtime documentation states this precisely: "The GOMAXPROCS variable limits the number of operating system threads that can execute user-level Go code simultaneously. There is no limit to the number of threads that can be blocked in system calls on behalf of Go code; those do not count against the GOMAXPROCS limit." A goroutine that blocks in a system call — a file read, a DNS lookup done the traditional (non-netpoller) way, a cgo call into C code — occupies an OS thread that sits OUTSIDE the GOMAXPROCS accounting entirely.',
        'This is a deliberate scheduler design, not a loophole: when a goroutine\'s underlying OS thread (an M, in the runtime\'s own terminology) blocks in a syscall, the Go scheduler detaches that M from its P (the scheduling context that represents "permission to run Go code") and hands the now-free P to a different M — spinning up a new one if none is idle — so the other GOMAXPROCS-1 logical processors keep making progress on other goroutines the whole time the blocked M is stuck waiting on the OS.',
      ]
    },
    {
      heading: 'Why this distinction has real, practical consequences',
      points: [
        'A program can genuinely have far MORE live OS threads than its GOMAXPROCS value at any given moment — every goroutine currently blocked in a system call is potentially holding its own dedicated OS thread, on top of the GOMAXPROCS threads actively running Go code. This is precisely why a Go process\'s OS thread count, visible via tools like ps -T or /proc, is not a value you can predict from GOMAXPROCS alone.',
        'This does not contradict the main page\'s own claim that Go can run "millions of goroutines" cheaply — most goroutine blocking in idiomatic Go code (network I/O via net/http, channel receives, time.Sleep) goes through the runtime\'s own integrated network poller and scheduler, which parks the GOROUTINE without blocking its underlying OS thread at all. The thread-per-blocked-syscall cost specifically applies to blocking OS-level calls that bypass the netpoller — traditional file I/O and cgo calls being the two most common real-world sources.',
        'This distinction matters directly for the Kubernetes CPU-limit scenario the main page\'s own Q&A already covers (GOMAXPROCS reading the host\'s CPU count instead of the container\'s cgroup limit): tuning GOMAXPROCS down to match a container\'s CPU quota controls how many threads run Go code in parallel, but it does nothing to cap threads blocked in file I/O or cgo calls — a program doing heavy blocking file I/O or cgo work can still spawn far more OS threads than GOMAXPROCS suggests, independent of that specific tuning fix.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Observing thread count exceed GOMAXPROCS via cgo-style blocking calls',
      language: 'typescript',
      code: `package main

import (
    "fmt"
    "runtime"
    "sync"
    "time"
)

// simulateBlockingSyscall stands in for a call that blocks the OS
// thread itself rather than parking the goroutine through the
// runtime's netpoller -- a real cgo call or traditional blocking
// file I/O would have this same thread-pinning effect.
func simulateBlockingSyscall() {
    runtime.LockOSThread() // pins this goroutine to its own M for
    defer runtime.UnlockOSThread() // the duration of the "blocking call"
    time.Sleep(50 * time.Millisecond)
}

func main() {
    runtime.GOMAXPROCS(2) // deliberately small, to make the effect visible
    fmt.Println("GOMAXPROCS set to:", runtime.GOMAXPROCS(0))

    var wg sync.WaitGroup
    for i := 0; i < 20; i++ {
        wg.Add(1)
        go func() {
            defer wg.Done()
            simulateBlockingSyscall()
        }()
    }
    wg.Wait()

    // The runtime may have created MANY more than 2 OS threads to
    // service these 20 concurrently-blocked goroutines -- each one
    // pinned via LockOSThread needed its own dedicated M, entirely
    // separate from the 2 Ms GOMAXPROCS allows to run Go CODE.
    fmt.Println("done -- OS thread count during this run exceeded GOMAXPROCS")
}`,
    },
    {
      label: 'Idiomatic I/O does NOT pin a thread — the netpoller parks the goroutine instead',
      language: 'typescript',
      code: `package main

import (
    "fmt"
    "net/http"
    "runtime"
    "sync"
)

func fetchOne(url string) {
    resp, err := http.Get(url) // blocks the GOROUTINE, not an OS thread --
    if err != nil {              // net/http routes through the runtime's
        return                    // own integrated network poller.
    }
    defer resp.Body.Close()
}

func main() {
    runtime.GOMAXPROCS(2)
    urls := make([]string, 100)
    for i := range urls {
        urls[i] = "https://example.com"
    }

    var wg sync.WaitGroup
    for _, u := range urls {
        wg.Add(1)
        go func(url string) {
            defer wg.Done()
            fetchOne(url)
        }(u)
    }
    wg.Wait()

    // Unlike the previous example, launching 100 CONCURRENT network
    // requests here does NOT require 100 dedicated OS threads --
    // the netpoller lets all of them share the small GOMAXPROCS pool
    // of threads while their sockets are waiting on the network.
    fmt.Println("100 concurrent HTTP requests, GOMAXPROCS threads stayed small")
}`,
    },
    {
      label: 'The practical takeaway: GOMAXPROCS tuning does not cap blocking-syscall threads',
      language: 'typescript',
      code: `package main

import (
    "fmt"
    "runtime"
)

func main() {
    // Setting GOMAXPROCS to match a container's CPU quota (the fix
    // the main page's own Kubernetes Q&A recommends) controls
    // parallel Go-CODE execution -- it does NOT put any ceiling on
    // how many OS threads a program blocked in cgo or traditional
    // file I/O can spin up.
    runtime.GOMAXPROCS(2)

    fmt.Println("GOMAXPROCS:", runtime.GOMAXPROCS(0))
    fmt.Println("NumGoroutine:", runtime.NumGoroutine())
    // runtime.NumGoroutine() reports live GOROUTINES, which is a
    // separate count from live OS THREADS -- there is no equally
    // simple runtime.NumOSThread() to check the thread count
    // directly from within the program; OS-level tools (ps -T,
    // /proc/<pid>/task) are what actually reveal the gap this
    // subtopic describes.
}`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A team sets GOMAXPROCS=2 in a container to match its CPU quota, following the main page\'s own advice for avoiding CFS throttling. Weeks later, an on-call engineer notices the same container has 40 OS threads running, via /proc/<pid>/task, and initially suspects the GOMAXPROCS fix never actually applied. Using this subtopic\'s theory, explain why 40 threads with GOMAXPROCS=2 is not necessarily evidence the fix failed, and what to check instead.',
    hint: 'Does GOMAXPROCS limit the TOTAL number of OS threads a Go program can have, or only the number executing Go code AT ONCE? What kind of work does this subtopic say can create OS threads outside that limit?',
    solution: 'GOMAXPROCS=2 with 40 observed OS threads is not, by itself, evidence the fix failed — per this subtopic\'s theory, GOMAXPROCS only limits the number of OS threads executing user-level Go CODE simultaneously; it places no limit whatsoever on threads blocked in system calls on behalf of Go code, which "do not count against the GOMAXPROCS limit" per Go\'s own runtime documentation. If this service does any blocking file I/O, cgo calls, or other syscalls that bypass the runtime\'s network poller, each concurrently-blocked instance can occupy its own dedicated OS thread, and that count is entirely separate from — and additive to — the small GOMAXPROCS=2 pool actually running Go code at any instant. The correct way to verify whether the GOMAXPROCS fix is actually working is not counting total OS threads at all, but checking CPU throttling metrics directly (e.g. the container\'s own cgroup nr_throttled counter, or CPU usage staying within the quota) — GOMAXPROCS=2 succeeding means AT MOST 2 threads are ever running Go code at once and consuming CPU quota that way, which is a completely separate, verifiable fact from the total OS thread count shown by /proc/<pid>/task. The on-call engineer\'s next step should be identifying WHAT those 40 threads are doing (many could be idle, parked threads left over from past blocking calls, which the runtime does not aggressively tear down) rather than assuming the GOMAXPROCS setting itself was ineffective.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'The main page\'s own description — GOMAXPROCS "controls how many OS threads can execute Go code simultaneously" — means GOMAXPROCS is effectively a hard cap on the total number of OS threads a Go program will ever create, similar to how a thread-pool size caps a traditional thread pool\'s total thread count.',
      reality: 'This subtopic\'s theory and first code example show the opposite, quoting Go\'s own runtime documentation directly: GOMAXPROCS limits threads executing Go CODE, but "there is no limit to the number of threads that can be blocked in system calls" — those threads exist entirely outside the GOMAXPROCS accounting, so total OS thread count can genuinely exceed GOMAXPROCS by a wide margin.'
    },
    {
      thought: 'Since network I/O (like an HTTP request) is a blocking system call from the operating system\'s point of view, launching many concurrent net/http calls should behave the same way as this subtopic\'s cgo/file-I/O example — each one occupying its own dedicated OS thread outside the GOMAXPROCS limit.',
      reality: 'This subtopic\'s second code example shows idiomatic network I/O in Go is a special case: net/http (and most of the standard library\'s networking) routes through the Go runtime\'s own integrated network poller, which parks the GOROUTINE (not an OS thread) while waiting on the socket — meaning hundreds of concurrent HTTP requests can share the small GOMAXPROCS pool of threads without each one pinning its own OS thread the way a genuinely blocking syscall or cgo call does.'
    },
    {
      thought: 'Fixing the Kubernetes CFS-throttling problem described on the main page — setting GOMAXPROCS to match the container\'s CPU limit — is a complete fix for any container CPU-usage surprise involving a Go process; once GOMAXPROCS is tuned correctly, OS thread count should also stay proportionally low.',
      reality: 'This subtopic\'s exercise and third code example show GOMAXPROCS tuning specifically addresses Go-code parallelism and CPU-quota throttling — it does not cap OS thread count for programs doing substantial blocking file I/O or cgo work, which can still spin up many threads independent of however GOMAXPROCS is set. A high OS thread count alongside a correctly-tuned GOMAXPROCS is not automatically evidence of a problem, or of the fix failing.'
    }
  ];
}
