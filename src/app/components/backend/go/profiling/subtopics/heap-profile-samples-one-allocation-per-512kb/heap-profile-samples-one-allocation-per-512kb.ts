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
  templateUrl: './heap-profile-samples-one-allocation-per-512kb.html',
  styleUrl: './heap-profile-samples-one-allocation-per-512kb.scss'
})
export class HeapProfileSamplesOneAllocationPer512kbSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page treats the heap profile as if it records every allocation — by default, it does not',
      points: [
        'The main page\'s own theory says "Heap profile: what functions allocate memory and how much," and its QnA explains inuse_space vs alloc_space without ever mentioning that the underlying data feeding both is SAMPLED, not exhaustive. Every heap-profile example on the main page implicitly assumes complete visibility into every allocation.',
        'The runtime package\'s own documentation for MemProfileRate states the actual mechanism directly: "MemProfileRate controls the fraction of memory allocations that are recorded and reported in the memory profile. The profiler aims to sample an average of one allocation per MemProfileRate bytes allocated." The documented default is 512 * 1024 — roughly one sampled allocation per 512 KB allocated, not one entry per actual allocation call.',
        'This means a function that allocates many SMALL objects (a few bytes each, well under the 512 KB sampling interval) can allocate a genuinely large TOTAL amount of memory over the program\'s lifetime while still appearing under-represented — or even entirely absent — from top10 output in a heap profile, purely because individual allocations rarely land on a sampled boundary.',
      ]
    },
    {
      heading: 'Adjusting the rate — and the tradeoff the documentation is explicit about',
      points: [
        'The documentation states the fix plainly: "To include every allocated block in the profile, set MemProfileRate to 1." This captures every single allocation, at the cost of the profiling overhead the default sampling exists specifically to avoid — a genuinely exhaustive profile is far more expensive to collect than a sampled one.',
        'The documentation also specifies exactly when this must be set: "Programs that change the memory profiling rate should do so just once, as early as possible in the execution of the program (for example, at the beginning of main)." Setting it later, or changing it more than once, produces a profile the standard pprof tooling cannot correctly interpret, since — per the same documentation — "the tools that process the memory profiles assume that the profile rate is constant across the lifetime of the program."',
        'Setting MemProfileRate to 0 disables memory profiling entirely, per the documentation\'s own final clause — useful to know as the explicit "off" state, distinct from simply never calling WriteHeapProfile (which still leaves the default 512 KB sampling running in the background at negligible cost).',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Why small, frequent allocations can hide from the default heap profile',
      language: 'typescript',
      code: `package main

import (
    "os"
    "runtime"
    "runtime/pprof"
)

// Allocates a tiny 8-byte struct, one million times.
// Total allocated: ~8 MB -- well above the 512KB sampling interval
// in AGGREGATE, but each individual allocation is far smaller than
// the interval the sampler aims for.
type tinyStruct struct{ x, y int32 }

func allocateManyTinyObjects() []*tinyStruct {
    var results []*tinyStruct
    for i := 0; i < 1_000_000; i++ {
        results = append(results, &tinyStruct{x: int32(i)})
    }
    return results
}

func main() {
    data := allocateManyTinyObjects()
    _ = data

    hf, _ := os.Create("mem.prof")
    defer hf.Close()
    runtime.GC()
    pprof.WriteHeapProfile(hf)
}

// go tool pprof mem.prof
// (pprof) top10
//
// Per the runtime package's own documented default -- "the profiler
// aims to sample an average of one allocation per MemProfileRate
// bytes allocated" (512 * 1024 by default) -- allocateManyTinyObjects
// may appear with a much smaller reported total than the ~8MB it
// actually allocated, or rank far lower than its true impact
// deserves, since most of its individual 8-byte allocations simply
// never land on a sampled boundary.`,
    },
    {
      label: 'Setting MemProfileRate = 1 for exhaustive (expensive) profiling',
      language: 'typescript',
      code: `package main

import (
    "os"
    "runtime"
    "runtime/pprof"
)

func main() {
    // Per the runtime package's own documentation: "Programs that
    // change the memory profiling rate should do so just once, as
    // early as possible in the execution of the program (for
    // example, at the beginning of main)."
    runtime.MemProfileRate = 1 // capture EVERY allocated block

    data := allocateManyTinyObjects()
    _ = data

    hf, _ := os.Create("mem-exhaustive.prof")
    defer hf.Close()
    runtime.GC()
    pprof.WriteHeapProfile(hf)
}

// go tool pprof mem-exhaustive.prof
// (pprof) top10
//
// Now allocateManyTinyObjects appears with its TRUE total -- every
// one of the million 8-byte allocations is individually recorded,
// per the documentation's own description of MemProfileRate = 1.
//
// The tradeoff, per the same documentation's own framing: this is
// dramatically more expensive to collect than the default sampled
// profile -- appropriate for a targeted investigation into small-
// allocation hot paths, not for routine or production profiling,
// where the default 512KB sampling rate's much lower overhead is
// the entire point of using sampling at all.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A team profiles their service with the main page\'s own standard pattern (default MemProfileRate, runtime.GC() before WriteHeapProfile) and the heap profile\'s top10 output shows nothing suspicious — no single function stands out as a major allocator. Yet the service\'s overall memory usage (per Prometheus metrics) is climbing steadily. A teammate suspects a function that allocates a small (16-byte) struct on every one of millions of requests per hour, but that function does not appear anywhere near the top of the profile. Using this subtopic\'s theory, explain why a genuinely significant allocator can be invisible in a default heap profile, and describe the one-line change that would surface it.',
    hint: 'Per this subtopic\'s theory, what does the default MemProfileRate (512 * 1024) mean for how a SMALL, individual allocation gets recorded versus how a large one does? Is a 16-byte allocation, considered on its own, anywhere close to that sampling interval?',
    solution: 'This is exactly the mechanism this subtopic\'s theory describes: the default heap profile samples "an average of one allocation per MemProfileRate bytes allocated" (512 * 1024 by default per this subtopic\'s theory) — a 16-byte allocation is roughly 32,000 times smaller than that sampling interval, meaning the overwhelming majority of these individual 16-byte allocations are never selected by the sampler at all, regardless of how many millions of times the function runs. The function\'s TRUE cumulative impact (potentially tens of megabytes per hour, exactly matching the climbing memory metrics) is real, but the default sampled profile systematically under-represents exactly this kind of allocation pattern — many small, individually-sub-sampling-interval allocations — even though it would correctly surface a function making fewer, LARGER allocations of a similar total size. The fix, per this subtopic\'s theory, is setting runtime.MemProfileRate = 1 (as early as possible, per the documentation\'s own requirement — ideally at the very beginning of main, in a targeted diagnostic build rather than routine production profiling given the overhead) to capture every individual allocated block, which would surface the suspected function with its true, now-accurately-recorded total.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'A heap profile generated with go tool pprof mem.prof and the default settings shows a complete, exhaustive record of every allocation the program made — top10 output can be trusted as the definitive ranking of allocators by total bytes.',
      reality: 'This subtopic\'s theory quotes the documentation directly: by default, "the profiler aims to sample an average of one allocation per MemProfileRate bytes allocated" (512 * 1024). The default profile is a STATISTICAL SAMPLE, not an exhaustive record — a function making many small allocations can be significantly under-represented even while contributing real, substantial total memory usage.'
    },
    {
      thought: 'If a function that allocates memory does not appear near the top of a default heap profile, it is safe to conclude that function is not a meaningful contributor to the program\'s memory usage.',
      reality: 'This subtopic\'s exercise shows the opposite can be true: a function making many small, sub-sampling-interval allocations can be systematically under-represented by the default MemProfileRate sampling, even while its true cumulative impact is significant. Setting MemProfileRate = 1 is the documented way to verify this rather than trusting the default sampled profile\'s ranking as complete.'
    },
    {
      thought: 'runtime.MemProfileRate can be adjusted at any point during a program\'s execution — for example, temporarily raising it right before a suspected hot path runs, then lowering it again afterward — to get a more detailed look at just that section.',
      reality: 'This subtopic\'s theory quotes the documentation\'s own explicit constraint: "Programs that change the memory profiling rate should do so just once, as early as possible in the execution of the program... The tools that process the memory profiles assume that the profile rate is constant across the lifetime of the program." Changing it more than once, or later than program start, produces a profile the standard tooling cannot correctly interpret.'
    }
  ];
}
