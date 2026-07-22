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
  templateUrl: './map-deletes-dont-shrink-memory.html',
  styleUrl: './map-deletes-dont-shrink-memory.scss'
})
export class MapDeletesDontShrinkMemorySubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'delete(m, key) removes an entry — but the map\'s underlying bucket array never shrinks back down',
      points: [
        'The main page\'s own quick reference describes delete(m, key) only as removing a key, "no-op if key absent" — accurate, but silent on what happens to the map\'s own MEMORY footprint afterward. len(m) correctly drops immediately; the memory backing the map does not follow it down.',
        'A Go map is implemented internally as a hash table backed by an array of buckets. That bucket array grows (via allocation and rehashing) as the map is written to and needs more room — but the Go runtime never automatically shrinks it back down again, no matter how many entries are later deleted. A map that once held a million entries and now holds ten still retains, approximately, the bucket array originally sized for a million.',
        'This is longstanding, acknowledged, documented behavior — not a bug that was later fixed. It remains the case in current Go: there is still no automatic map-shrinking, confirmed by the still-open golang/go issue tracking this exact behavior request. len(m) reporting a small number is genuinely not the same fact as the map\'s allocated memory being small.',
      ]
    },
    {
      heading: 'The only way to reclaim the memory is to build a fresh map',
      points: [
        'Since Go\'s map type exposes no explicit shrink, compact, or trim operation, the idiomatic fix when a map\'s peak size vastly exceeds its steady-state size is to periodically REPLACE it: allocate a brand-new map, copy over only the entries that are still needed, then let every reference to the old map go out of scope so its (oversized) bucket array becomes eligible for garbage collection.',
        'This matters most for long-running processes — servers, background workers, batch pipelines — that build up a large map temporarily (say, during one batch job or one burst of traffic) and then delete most of its entries afterward. The memory is not returned to the OS, and it is not made available for other allocations within that same map, even though every len(m) call afterward correctly reports the smaller current count.',
        'This is a genuinely different failure mode from a memory leak in the traditional sense — nothing is unreachable or forgotten; the map itself is still perfectly valid and correctly reports its current contents. The "leak" is specifically the gap between the map\'s peak historical size and its current logical size, a gap Go\'s runtime has no built-in mechanism to close on its own.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'len(m) drops immediately — memory does not follow',
      language: 'typescript',
      code: `package main

import (
    "fmt"
    "runtime"
)

func main() {
    m := make(map[int][128]byte) // a deliberately chunky value type
                                  // to make the memory effect visible

    for i := 0; i < 1_000_000; i++ {
        m[i] = [128]byte{}
    }
    fmt.Println("after insert, len:", len(m)) // 1000000

    var before runtime.MemStats
    runtime.ReadMemStats(&before)

    for i := 0; i < 999_990; i++ {
        delete(m, i)
    }
    fmt.Println("after delete, len:", len(m)) // 10 -- correct!

    var after runtime.MemStats
    runtime.ReadMemStats(&after)

    // HeapAlloc after the deletes is NOT meaningfully smaller than
    // before them -- len(m) shrank to 10, but the map's own bucket
    // array retains (approximately) its million-entry-sized footprint.
    fmt.Println("heap before deletes:", before.HeapAlloc)
    fmt.Println("heap after deletes: ", after.HeapAlloc)
}`,
    },
    {
      label: 'Reclaiming the memory: rebuild into a fresh map',
      language: 'typescript',
      code: `package main

import "fmt"

// shrinkToFit is the idiomatic workaround: Go's map type has no
// built-in shrink operation, so reclaiming memory means building a
// brand-new map sized only for what actually survives.
func shrinkToFit[K comparable, V any](m map[K]V) map[K]V {
    fresh := make(map[K]V, len(m)) // sized for the CURRENT count only
    for k, v := range m {
        fresh[k] = v
    }
    return fresh
    // The caller must drop every reference to the OLD map (including
    // reassigning their own variable to this return value) for its
    // oversized bucket array to become eligible for GC at all.
}

func main() {
    m := make(map[int]string)
    for i := 0; i < 100_000; i++ {
        m[i] = "value"
    }
    for i := 0; i < 99_990; i++ {
        delete(m, i)
    }
    fmt.Println("before shrink, len:", len(m)) // 10

    m = shrinkToFit(m) // old, oversized map is now unreferenced
    fmt.Println("after shrink, len:", len(m))  // 10 -- same logical
                                                 // contents, new,
                                                 // right-sized backing
                                                 // bucket array.
}`,
    },
    {
      label: 'Real-world pattern: periodic cache eviction with a swap-in map',
      language: 'typescript',
      code: `package main

import (
    "fmt"
    "sync"
)

// requestCache periodically drops most of its own entries. Deleting
// them one at a time (as a naive TTL eviction loop would) leaves the
// map's own bucket array permanently oversized for its steady-state
// contents -- this version rebuilds a fresh map instead, sized only
// for the survivors, and swaps it in under a single lock.
type requestCache struct {
    mu sync.RWMutex
    m  map[string]int
}

func newRequestCache() *requestCache {
    return &requestCache{m: make(map[string]int)}
}

func (c *requestCache) set(key string, hits int) {
    c.mu.Lock()
    defer c.mu.Unlock()
    c.m[key] = hits
}

// evictBelow rebuilds the cache, keeping only entries at or above
// minHits -- a periodic call to this (e.g. on a ticker) both evicts
// AND reclaims memory in one step, instead of leaving a shrunken-len
// but still oversized map behind.
func (c *requestCache) evictBelow(minHits int) {
    c.mu.Lock()
    defer c.mu.Unlock()
    fresh := make(map[string]int)
    for k, v := range c.m {
        if v >= minHits {
            fresh[k] = v
        }
    }
    c.m = fresh // old, oversized map is now unreferenced
}

func main() {
    cache := newRequestCache()
    for i := 0; i < 50_000; i++ {
        cache.set(fmt.Sprintf("key-%d", i), i%3)
    }
    cache.evictBelow(2) // reclaims memory, not just entries
    fmt.Println("cache rebuilt with only high-hit entries")
}`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A long-running worker process builds a map with up to 5 million entries during each nightly batch job, then deletes all but a few hundred of them once the job finishes, using delete(m, key) in a loop over the keys to remove. A teammate notices the process\'s reported memory usage stays high for the rest of the day, even though len(m) correctly shows only a few hundred entries after each job. Using this subtopic\'s theory, explain why, and describe the fix.',
    hint: 'Does delete(m, key) shrink the map\'s own underlying bucket array, or only remove the logical entry? What does this subtopic say is the only way to actually reclaim that memory?',
    solution: 'The process\'s memory usage stays high because delete(m, key) only removes the logical entry from the map — it does not shrink the map\'s own underlying bucket array, which was sized during the batch job to accommodate up to 5 million entries. Per this subtopic\'s theory, Go\'s runtime never automatically shrinks a map\'s allocated bucket storage back down after deletions, no matter how many keys are removed; len(m) correctly reports the smaller current count, but that count is a separate fact from the map\'s actual memory footprint, which remains sized for its historical PEAK rather than its current contents. Looping delete(m, key) calls one at a time, exactly as this worker does, is precisely the pattern that produces this gap — every call correctly shrinks len(m) while leaving the oversized bucket array fully intact. The fix, per this subtopic\'s second and third code examples, is to stop deleting entries in place and instead REBUILD: at the end of each nightly job, allocate a brand-new map sized only for the surviving few hundred entries, copy them over, and reassign the worker\'s own map variable to that new map — once nothing still references the old, oversized map, its bucket array becomes eligible for garbage collection, and the process\'s memory usage should drop back down between batch runs instead of staying elevated all day.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'Since delete(m, key) correctly makes len(m) smaller immediately, calling it in a loop until only the needed entries remain is a complete, sufficient way to reclaim a map\'s memory after it grew large temporarily.',
      reality: 'This subtopic\'s theory and first code example show len(m) shrinking is a completely separate fact from the map\'s own allocated memory shrinking — Go\'s runtime never automatically shrinks a map\'s underlying bucket array after deletions, regardless of how many keys are removed or how they are removed.'
    },
    {
      thought: 'A map that grew very large and then had most of its entries deleted must have a traditional memory leak somewhere — some reference to the old data is being kept alive accidentally, the same as any other Go memory leak caused by an unintentionally retained reference.',
      reality: 'This subtopic\'s theory explicitly distinguishes this from a traditional leak: nothing is unreachable or forgotten, and the map itself correctly and honestly reports its current, smaller contents via len(m). The gap is specifically between the map\'s historical peak allocation and its current logical size — a documented characteristic of how Go\'s map implementation itself works, not a bug in the surrounding application code.'
    },
    {
      thought: 'Rebuilding a map into a fresh one just to reclaim memory is a wasteful, unusual workaround that should only be reached for in extreme, rare circumstances — normal application code should never need it.',
      reality: 'This subtopic\'s third code example shows this is a genuinely common, idiomatic pattern for any long-running process with a map whose size fluctuates significantly over time — periodic caches, request-scoped aggregations, and batch-job intermediate state are all realistic, everyday scenarios where rebuilding-and-swapping is the standard, expected fix, not an exotic escape hatch.'
    }
  ];
}
