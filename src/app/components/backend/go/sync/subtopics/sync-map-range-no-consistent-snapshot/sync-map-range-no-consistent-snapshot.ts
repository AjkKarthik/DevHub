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
  templateUrl: './sync-map-range-no-consistent-snapshot.html',
  styleUrl: './sync-map-range-no-consistent-snapshot.scss'
})
export class SyncMapRangeNoConsistentSnapshotSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'sync.Map.Range() is safe to call concurrently — but "safe" does not mean "sees one consistent moment in time"',
      points: [
        'The main page\'s own quick reference lists Range(func(k, v any) bool) alongside Store, Load, LoadOrStore, and Delete as simply one of sync.Map\'s methods — implying it behaves like iterating a map you already know is safe for concurrent access. What it does not say is exactly WHAT that iteration is allowed to observe while other goroutines are actively modifying the map during the same Range call.',
        'sync.Map\'s own documentation for Range states this precisely: "Range does not necessarily correspond to any consistent snapshot of the Map\'s contents: no key will be visited more than once, but if the value for any key is stored or deleted concurrently (including by f itself), Range may reflect any mapping for that key from any point during the Range call."',
        'Unpacked, this guarantees two specific things and explicitly declines to guarantee a third: (1) no key is ever visited twice in one Range call — a real, useful guarantee; (2) Range will not panic or corrupt anything from concurrent Store/Delete calls happening during iteration — Range is genuinely safe to call concurrently with writers; but (3) there is NO guarantee that the values Range sees for different keys were ever simultaneously true at any single moment — it is explicitly not a snapshot.',
      ]
    },
    {
      heading: 'Why this specific gap matters, and what it means for code relying on Range',
      points: [
        'This means a callback function f passed to Range can observe values from genuinely different points in time for different keys within the SAME Range call — key A\'s value might reflect the map\'s state from the very start of the Range call, while key B\'s value (visited moments later) might already reflect a Store() that happened to a different goroutine mid-iteration. Nothing about this is a bug; it is the explicitly documented tradeoff that makes Range safe and reasonably efficient without requiring it to lock the entire map for the whole traversal.',
        'A common, plausible-but-incorrect use of Range is computing an aggregate that assumes a single coherent view — summing every value, counting entries matching a predicate, or building a "snapshot" copy of the map by appending during Range — while another goroutine concurrently writes to the map. Per the documented guarantee, such a sum or count can be based on a mixture of before-call and during-call values for different keys, producing a result that never corresponded to the map\'s actual contents at any single instant.',
        'When a genuinely consistent snapshot IS required — for example, to compute a total that must reflect one coherent moment — sync.Map is the wrong primitive entirely, since it offers no whole-map locking operation by design. The main page\'s own guidance to prefer "map + sync.RWMutex" for general concurrent access applies directly here: a plain map guarded by an RWMutex CAN provide a true consistent snapshot, simply by holding RLock() for the entire traversal — something sync.Map structurally cannot offer no matter how it is used.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Range is safe from panics/corruption during concurrent writes...',
      language: 'typescript',
      code: `package main

import (
    "fmt"
    "sync"
)

func main() {
    var m sync.Map
    for i := 0; i < 100; i++ {
        m.Store(i, i*i)
    }

    var wg sync.WaitGroup
    wg.Add(2)

    // Goroutine 1: ranges over the whole map
    go func() {
        defer wg.Done()
        count := 0
        m.Range(func(k, v any) bool {
            count++
            return true // continue iterating
        })
        fmt.Println("visited count:", count) // safe -- no panic,
                                                // no corruption, even
                                                // though goroutine 2
                                                // is concurrently
                                                // writing below.
    }()

    // Goroutine 2: concurrently mutates the SAME map DURING Range
    go func() {
        defer wg.Done()
        for i := 100; i < 200; i++ {
            m.Store(i, i*i)
        }
    }()

    wg.Wait()
    // No crash, no data race per the race detector -- Range() is
    // genuinely SAFE to call concurrently with writers. This example
    // only demonstrates safety, not consistency -- see the next tab.
}`,
    },
    {
      label: '...but the values seen are NOT a consistent snapshot',
      language: 'typescript',
      code: `package main

import (
    "fmt"
    "sync"
)

// account balances -- deliberately simple values to make the
// inconsistency easy to reason about.
func main() {
    var accounts sync.Map
    accounts.Store("alice", 100)
    accounts.Store("bob", 100)

    var wg sync.WaitGroup
    wg.Add(1)

    go func() {
        defer wg.Done()
        // Simulates a "transfer": decrement alice, increment bob.
        // These are TWO separate Store calls -- not one atomic
        // operation -- deliberately, to demonstrate the gap Range
        // can observe mid-transfer.
        accounts.Store("alice", 50)
        accounts.Store("bob", 150)
    }()

    total := 0
    accounts.Range(func(k, v any) bool {
        total += v.(int)
        return true
    })
    wg.Wait()

    // Per this subtopic's theory, 'total' here is NOT guaranteed to
    // be 200 (the correct total before OR after the transfer) --
    // depending on timing, Range could see alice's OLD value (100)
    // and bob's NEW value (150), summing to 250, or alice's NEW
    // value (50) and bob's OLD value (100), summing to 150. Neither
    // of those totals ever actually existed as the map's real state
    // at any single instant -- exactly the documented "no consistent
    // snapshot" behavior, not a bug.
    fmt.Println("observed total (may not be 200):", total)
}`,
    },
    {
      label: 'When a true snapshot is required: map + RWMutex instead',
      language: 'typescript',
      code: `package main

import (
    "fmt"
    "sync"
)

// SafeAccounts uses a plain map guarded by RWMutex specifically
// because it needs the guarantee sync.Map structurally cannot offer:
// a genuinely consistent view across the WHOLE traversal.
type SafeAccounts struct {
    mu    sync.RWMutex
    store map[string]int
}

// Total computes a sum that IS guaranteed to correspond to one
// consistent moment -- RLock() is held for the ENTIRE traversal,
// blocking any concurrent Store from being interleaved mid-sum.
func (a *SafeAccounts) Total() int {
    a.mu.RLock()
    defer a.mu.RUnlock()
    total := 0
    for _, v := range a.store {
        total += v
    }
    return total
}

func main() {
    accounts := &SafeAccounts{store: map[string]int{"alice": 100, "bob": 100}}
    fmt.Println(accounts.Total()) // always exactly 200, guaranteed --
                                    // unlike sync.Map.Range, this
                                    // genuinely locks out concurrent
                                    // writers for the whole traversal.
}`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A metrics-collection service uses sync.Map to store per-endpoint request counts, updated concurrently by many request-handling goroutines via LoadOrStore and Store. A reporting goroutine periodically calls Range to sum all counts into a "total requests" metric. Occasionally, the reported total is slightly less than the true cumulative count of requests actually processed by that point. Using this subtopic\'s theory, explain whether this is a bug in sync.Map, and what it would take to fix it if an exact total is required.',
    hint: 'Per this subtopic\'s theory, what specific guarantee does Range explicitly NOT make about the values it observes across different keys during one call? Is Range failing to do something it promised, or behaving exactly as documented?',
    solution: 'This is not a bug in sync.Map — it is precisely the documented, expected consequence of Range providing no consistent-snapshot guarantee, exactly as this subtopic\'s theory and second code example demonstrate. Per sync.Map\'s own documentation, "Range does not necessarily correspond to any consistent snapshot of the Map\'s contents" — while the reporting goroutine\'s Range call is traversing the map, other goroutines continue calling Store/LoadOrStore to increment counts for various endpoints, and Range may observe some keys\' PRE-update values and other keys\' POST-update values within that single traversal, depending purely on timing. The reported total being slightly LESS than the true cumulative count (rather than exactly matching either a "before" or "after" total) is a completely normal manifestation of this: some endpoints\' counts get summed before their concurrent increment lands, and Range never revisits them to pick up that increment, since it only guarantees visiting each key once, not a final or consistent value for it. If an EXACT total is genuinely required (not just an approximate, eventually-consistent metric, which is often actually fine for reporting use cases), the fix per this subtopic\'s theory is to replace sync.Map with a plain map protected by sync.RWMutex specifically for the fields that need whole-map consistency, and hold RLock() for the entire summation — exactly the pattern in this subtopic\'s third code example — since sync.Map structurally has no equivalent "lock the whole map for one consistent read" operation, no matter how its methods are combined or called.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'Since sync.Map is documented as safe for concurrent use, calling Range() while other goroutines concurrently Store or Delete keys should produce the same kind of coherent, consistent result as ranging over a plain map while holding an RWMutex\'s read lock for the whole traversal — "concurrency-safe" implies "sees one consistent moment."',
      reality: 'This subtopic\'s theory and second code example show these are two DIFFERENT guarantees that "safe for concurrent use" easily gets conflated into one: Range is safe from panics, corruption, and duplicate key visits during concurrent writes, but it explicitly does NOT guarantee the values observed correspond to any single consistent moment — "Range does not necessarily correspond to any consistent snapshot of the Map\'s contents," per sync.Map\'s own documentation.'
    },
    {
      thought: 'A sum, count, or aggregate computed by calling Range() and accumulating values across all keys will be slightly imprecise under concurrent writes, similar to how any concurrent read might catch a slightly stale value — but it should always land somewhere between the map\'s state at the start and end of the Range call.',
      reality: 'This subtopic\'s second code example shows this bound does not actually hold — because DIFFERENT keys can reflect state from DIFFERENT, unrelated points in time within one Range call, an aggregate like a sum can genuinely fall outside the range you might expect from "somewhere between the before-state and after-state total," as demonstrated by the observed total landing at 250 or 150 rather than a value between the correct totals of 200 (before) and 200 (after, in that specific balanced-transfer example).'
    },
    {
      thought: 'The lack of a consistent-snapshot guarantee in Range() is a limitation specific to unusual, contrived scenarios (like the account-transfer example) — realistic production use of sync.Map for something like a metrics counter is unlikely to actually be affected by this in practice.',
      reality: 'This subtopic\'s exercise describes a realistic, common production pattern — a metrics-collection service using sync.Map with a periodic Range-based total — and shows the documented lack of snapshot consistency has a direct, observable, ongoing effect on that total\'s accuracy under normal, expected concurrent load, not just in an artificially constructed edge case.'
    }
  ];
}
