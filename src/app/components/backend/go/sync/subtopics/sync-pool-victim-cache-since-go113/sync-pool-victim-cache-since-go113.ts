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
  templateUrl: './sync-pool-victim-cache-since-go113.html',
  styleUrl: './sync-pool-victim-cache-since-go113.scss'
})
export class SyncPoolVictimCacheSinceGo113Subtopic {

  theory: TheoryPoint[] = [
    {
      heading: '"Objects may be removed automatically at any time" understates a real, documented Go 1.13 improvement',
      points: [
        'The main page\'s own theory says "Pool objects may be GC\'d at any time — Pool is not a cache," and its quick reference echoes the same idea. That framing is accurate as a WORST-CASE guarantee (nothing in sync.Pool\'s contract promises an object survives any particular length of time) — but it understates how Pool has actually behaved since Go 1.13, which changed how aggressively pooled objects are actually cleared in practice.',
        'Before Go 1.13, sync.Pool was cleared COMPLETELY on every single garbage collection cycle — every object in every Pool, program-wide, was dropped and had to be re-created via New() on the next Get() after any GC ran. This made Pool much less effective for programs with frequent GC cycles, since the pool would rarely have anything usable in it right after a collection.',
        'Go 1.13\'s own release notes describe the fix directly: "Pool no longer needs to be completely repopulated after every GC. It now retains some objects across GCs, as opposed to releasing all objects, reducing load spikes for heavy users of Pool." This is the "victim cache" mechanism informally referenced in Go community discussion of the change: objects survive being demoted to a secondary "victim" list for one additional GC cycle before being fully released, rather than being dropped on the very next GC.',
      ]
    },
    {
      heading: 'Why the underlying mechanism matters even though the documented contract has not changed',
      points: [
        'This is a genuinely important distinction for reasoning about Pool\'s real-world effectiveness: the PUBLIC API contract sync.Pool documents — "may be removed automatically at any time without notification" — has not changed at all, and code should still never assume an object survives any specific GC boundary. But the ACTUAL RUNTIME BEHAVIOR since Go 1.13 is meaningfully friendlier to Pool users than before, which is exactly why the main page\'s own advice to use Pool for "frequently allocated short-lived objects" is more effective advice on modern Go than it would have been pre-1.13.',
        'The victim-cache mechanism does not change any of the main page\'s own correctness guidance — Get() can still return nil-backed New() output at any time, Put() objects still must be reset before being returned (per the main page\'s own mistake entry), and code must still never rely on an object\'s presence after a GC for correctness, only for a PERFORMANCE benefit. The improvement is about how well Pool performs its optimization role, not about any new correctness guarantee being introduced.',
        'This matters concretely for anyone benchmarking or reasoning about Pool\'s hit rate: a Pool that appears to have a surprisingly high reuse rate across GC cycles on modern Go is not a fluke or a misunderstanding of the "may be removed at any time" wording — it is the documented, intentional victim-cache behavior working as designed, distinguishing "the contract makes no promise" from "the implementation, since 1.13, tries meaningfully harder than before."',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Pool hit rate across a GC cycle, observed via New() call counts',
      language: 'typescript',
      code: `package main

import (
    "fmt"
    "runtime"
    "runtime/debug"
)

func main() {
    var newCalls int

    pool := &poolLike{
        newFn: func() any {
            newCalls++
            return new(int)
        },
    }

    // Populate the pool with several objects, then return them.
    objs := make([]any, 10)
    for i := range objs {
        objs[i] = pool.get()
    }
    for _, o := range objs {
        pool.put(o)
    }

    // Force a full GC cycle -- on pre-Go-1.13 runtimes, this would
    // have cleared the pool entirely; since 1.13, some objects
    // survive into a "victim" list for one more cycle instead.
    runtime.GC()
    debug.FreeOSMemory()

    // Getting objects back right after ONE GC cycle can still find
    // reusable objects on modern Go, thanks to the victim-cache --
    // the exact count is implementation-dependent and not something
    // to assert on in real tests, but the general PATTERN (some
    // reuse survives one GC) reflects the documented 1.13+ change.
    for i := 0; i < 10; i++ {
        pool.get()
    }
    fmt.Println("New() calls so far:", newCalls)
    // Illustrative only -- see this subtopic's theory for what is
    // and is not actually guaranteed by the public Pool contract.
}

// A minimal stand-in illustrating the Get/Put shape sync.Pool uses --
// this file avoids depending on sync.Pool's own internal counters,
// which are not exposed by the public API.
type poolLike struct {
    newFn func() any
    items []any
}

func (p *poolLike) get() any {
    if len(p.items) == 0 {
        return p.newFn()
    }
    last := p.items[len(p.items)-1]
    p.items = p.items[:len(p.items)-1]
    return last
}

func (p *poolLike) put(v any) {
    p.items = append(p.items, v)
}`,
    },
    {
      label: 'The correctness contract is unchanged: never assume survival',
      language: 'typescript',
      code: `package main

import (
    "bytes"
    "fmt"
    "sync"
)

var bufPool = sync.Pool{
    New: func() any {
        fmt.Println("allocating a new buffer")
        return new(bytes.Buffer)
    },
}

func process(data string) string {
    buf := bufPool.Get().(*bytes.Buffer)
    defer func() {
        buf.Reset()
        bufPool.Put(buf)
    }()
    buf.WriteString(data)
    return buf.String()
}

func main() {
    // This code is CORRECT regardless of whether the victim-cache
    // mechanism means an object actually gets reused here or not --
    // it never assumes reuse happened. "allocating a new buffer"
    // might print 0, 1, or several times across these three calls,
    // and the program is correct either way. The victim cache is a
    // PERFORMANCE detail, not something correctness should depend on.
    fmt.Println(process("first"))
    fmt.Println(process("second"))
    fmt.Println(process("third"))
}`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A developer benchmarks a sync.Pool-based buffer pool before and after upgrading their service from Go 1.12 to Go 1.14, under an identical workload with frequent GC cycles (a high-allocation-rate server). They observe New() being called noticeably less often after the upgrade, with no code changes at all. Using this subtopic\'s theory, explain the most likely cause, and why this does NOT mean sync.Pool\'s documented API contract changed between these versions.',
    hint: 'What specific Go version does this subtopic say changed how Pool behaves ACROSS GC cycles, and what exactly did the official release notes say changed? Does that change alter the PUBLIC documented guarantee ("may be removed at any time"), or just the underlying implementation\'s behavior within that guarantee?',
    solution: 'The most likely cause is the Go 1.13 sync.Pool improvement this subtopic\'s theory describes: prior to Go 1.13, Pool was completely cleared on every GC cycle, so any workload with frequent GCs (like a high-allocation-rate server) would see the pool essentially reset constantly, forcing New() to run often. Go 1.13\'s own release notes state the fix directly: "Pool no longer needs to be completely repopulated after every GC. It now retains some objects across GCs" — the informally-named victim-cache mechanism. Upgrading from Go 1.12 to Go 1.14 crosses this exact boundary, so under an identical high-GC-frequency workload, more objects now survive from one GC into the next (via the victim list) before being fully released, meaning Get() finds a reusable object more often and calls New() less often — precisely the observed behavior, with zero code changes needed. This does NOT mean the documented Pool API contract changed: Pool\'s own documentation still says an item "may be removed automatically at any time without notification" on Go 1.14 just as it did on Go 1.12 — nothing about that WORST-CASE guarantee changed, and code still cannot correctly assume any object survives any particular GC boundary. What changed is the underlying RUNTIME IMPLEMENTATION\'s typical behavior within that unchanged contract — a legitimate, intentional performance improvement, not a new guarantee being made or an old one being broken.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'The main page\'s own statement that Pool objects "may be GC\'d at any time" and "Pool is not a cache" means Go\'s sync.Pool implementation has always behaved the same way across every Go version — clearing the entire pool on every single garbage collection cycle, with no meaningful improvement ever made to that behavior.',
      reality: 'This subtopic\'s theory shows the documented WORST-CASE CONTRACT ("may be removed at any time") has indeed stayed constant, but the ACTUAL runtime implementation changed meaningfully in Go 1.13 — per the official release notes, Pool no longer clears completely on every GC and instead retains some objects across GC cycles via a victim-cache mechanism, a real, documented performance improvement distinct from the unchanged public contract.'
    },
    {
      thought: 'Since Go 1.13\'s victim-cache mechanism makes objects survive longer across GC cycles than before, code can now more safely assume a Put() object will still be available on the next Get() call, at least for one GC cycle, making Pool slightly more like a genuine cache than it used to be.',
      reality: 'This subtopic\'s theory and second code example show this reasoning is exactly backwards — the documented public contract ("may be removed automatically at any time without notification") is completely unchanged by the Go 1.13 improvement, and correct code must still never assume survival across any GC boundary for correctness. The victim cache only changes the STATISTICAL likelihood of reuse for performance purposes; it introduces no new guarantee code can safely depend on.'
    },
    {
      thought: 'The exact number of GC cycles a Pool object survives, or the precise internal mechanics of the victim-cache list, is something application code can query or rely on directly (e.g., via a runtime function or Pool method) to make informed pooling decisions.',
      reality: 'This subtopic\'s first code example notes that sync.Pool\'s internal victim-cache counters are not exposed by the public API at all — the mechanism is entirely an internal runtime implementation detail described in release notes and Go\'s own source code, not something application code can introspect, configure, or rely on programmatically. Any observation of its effect (like reduced New() calls) is indirect, through overall allocation behavior, not a queryable Pool property.'
    }
  ];
}
