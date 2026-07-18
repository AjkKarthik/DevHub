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
  templateUrl: './append-growth-factor-shrinks-past-256.html',
  styleUrl: './append-growth-factor-shrinks-past-256.scss'
})
export class AppendGrowthFactorShrinksPast256Subtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page\'s "typically doubling" description is accurate only below a specific threshold',
      points: [
        'The main page\'s own theory says append, on reallocation, "typically doubling" capacity — a fair simplification, but only half the actual story. The real algorithm lives in the Go runtime\'s own slice-growth logic (the nextslicecap function inside runtime/slice.go) and has two distinct regimes, not one flat rule.',
        'Below a threshold of 256 elements of old capacity, growth genuinely IS a straight doubling — the runtime returns double the old capacity outright. This is the regime almost every small, everyday slice example (including the main page\'s own) actually exercises, which is exactly why "doubling" reads as the whole truth at first.',
        'Once old capacity reaches 256 or more, the growth factor changes: the runtime\'s own source comment states its intent directly — "Transition from growing 2x for small slices to growing 1.25x for large slices. This formula gives a smooth-ish transition between the two." A large slice does NOT double on its next reallocation; it grows by roughly 25%, computed iteratively until the new capacity is large enough to hold the incoming elements.',
      ]
    },
    {
      heading: 'Why the exact regime matters — and the one piece of advice that sidesteps the question entirely',
      points: [
        'This two-regime design is a genuine, deliberate memory/performance tradeoff: doubling small slices keeps early growth fast (few reallocations while a slice is still cheap to copy), while slowing to 1.25x for large slices avoids wasting large amounts of memory on generous over-allocation once a slice is already big.',
        'The precise growth numbers are an internal runtime implementation detail, not a language-spec guarantee — Go\'s own documentation for append explicitly leaves the growth strategy unspecified, meaning the exact threshold and factors described here could change in a future Go release without breaking any documented contract. Code should never depend on the EXACT resulting capacity after an append-triggered reallocation.',
        'The one piece of advice that remains correct regardless of which regime (or which future Go version\'s regime) would have applied: when a slice\'s final size is known or estimable ahead of time, preallocate it directly with make([]T, 0, n) rather than relying on repeated append calls to grow it — this sidesteps the growth-factor question completely by allocating the needed capacity once, up front.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Small slices: doubling',
      language: 'typescript',
      code: `package main

import "fmt"

func main() {
    s := make([]int, 0)
    prevCap := cap(s)

    // Below the 256-element threshold, each reallocation roughly
    // DOUBLES capacity. Exact numbers are Go-version-dependent
    // (append's growth strategy is explicitly unspecified by the
    // language) -- what to observe here is the PATTERN, not exact
    // figures: each printed jump is close to 2x the previous one.
    for i := 0; i < 300; i++ {
        s = append(s, i)
        if cap(s) != prevCap {
            fmt.Printf("len=%d  cap grew %d -> %d\\n", len(s), prevCap, cap(s))
            prevCap = cap(s)
        }
    }
    // Every growth step printed above roughly doubles the previous
    // capacity -- this is the regime the main page's own "typically
    // doubling" description was written for.
}`,
    },
    {
      label: 'Large slices: growth slows to ~1.25x past 256',
      language: 'typescript',
      code: `package main

import "fmt"

func main() {
    // Start already past the 256-element threshold this subtopic's
    // theory describes, so every growth step below exercises the
    // SECOND regime -- not the doubling one.
    s := make([]int, 300)
    prevCap := cap(s)

    for i := 0; i < 5000; i++ {
        s = append(s, i)
        if cap(s) != prevCap {
            fmt.Printf("len=%d  cap grew %d -> %d (factor ~%.2fx)\\n",
                len(s), prevCap, cap(s), float64(cap(s))/float64(prevCap))
            prevCap = cap(s)
        }
    }
    // Each printed growth factor should sit noticeably below 2.0x
    // and trend toward roughly 1.25x as the slice gets larger --
    // the exact per-step factor is not fixed, but it is NEVER the
    // flat doubling the small-slice regime uses.
}`,
    },
    {
      label: 'Sidestepping the question: preallocate with a known size',
      language: 'typescript',
      code: `package main

import "fmt"

func processRecords(count int) []string {
    // Preallocating with the FINAL known size sidesteps whichever
    // growth regime append's automatic reallocation would have used
    // -- there is exactly one allocation, not a series of them, and
    // the resulting capacity is exact, not over-allocated by either
    // growth formula.
    results := make([]string, 0, count)
    for i := 0; i < count; i++ {
        results = append(results, fmt.Sprintf("record-%d", i))
    }
    return results
}

func main() {
    results := processRecords(1000)
    fmt.Println(len(results), cap(results)) // 1000 1000 -- exact, no over-allocation
}`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A teammate writes a benchmark that builds a slice of 10,000 ints via repeated append(s, v) starting from nil, and asserts the final cap(s) equals a specific hardcoded number they observed once locally. The assertion fails after upgrading to a newer Go version, even though the resulting slice still has exactly 10,000 elements and the code behaves correctly in every other way. Explain why, using this subtopic\'s theory.',
    hint: 'Is the exact growth factor/threshold used by append part of Go\'s documented language contract, or an internal runtime implementation detail? What did this subtopic\'s theory say about whether that detail is guaranteed to stay the same across Go versions?',
    solution: 'The assertion is fragile because it depends on an implementation detail Go explicitly does NOT guarantee, not because anything is actually broken. Per this subtopic\'s theory, append\'s growth strategy — including the specific 256-element threshold and the exact 2x/1.25x factors — lives in the Go runtime\'s own internal slice-growth logic, and the language\'s own documentation for append explicitly leaves the growth strategy unspecified. This means the Go team is free to tune those exact numbers in a later release (as has genuinely happened across past Go versions) without violating any documented contract, precisely because no contract was ever made about the exact resulting capacity. The teammate\'s benchmark accidentally turned an implementation detail into a hardcoded expectation; upgrading Go changed that internal detail, which changed cap(s) without changing len(s) or correctness at all. The fix is not to chase the new number with an updated hardcoded assertion (which would just repeat the same fragility on the NEXT Go upgrade) — it is to stop asserting on the exact capacity at all, and either assert only on len(s) and the actual element values (the only genuinely guaranteed behavior), or, if a specific capacity is truly required for the benchmark\'s own purpose, preallocate deliberately with make([]int, 0, 10000) so the capacity is an explicit, intentional choice rather than an incidental byproduct of append\'s current internal growth algorithm.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'The main page\'s own theory says append "typically doubles" capacity on reallocation, so any slice that grows large enough to need many reallocations will keep roughly doubling in capacity each time, no matter how big it gets.',
      reality: 'This subtopic\'s theory and second code example show doubling only applies below a 256-element capacity threshold — past that point, the Go runtime\'s own growth algorithm deliberately slows to roughly a 1.25x factor per reallocation, a distinct second regime the main page\'s simplified description does not mention.'
    },
    {
      thought: 'Since append\'s growth algorithm is implemented in Go\'s own runtime source code and can be read directly, the exact capacity numbers it produces are a reliable, stable detail safe to depend on in application code or tests, the same way a documented function\'s return value would be.',
      reality: 'This subtopic\'s theory and exercise show the opposite: Go\'s own documentation for append explicitly leaves the growth strategy unspecified — being READABLE in the runtime source does not make it a GUARANTEED contract. The exact threshold and factors described in this subtopic are accurate for current Go, but are an internal implementation detail that has changed across past Go versions and could change again.'
    },
    {
      thought: 'Preallocating a slice with make([]T, 0, n) is mainly a minor performance optimization (avoiding a few reallocations) — for correctness purposes, relying on append\'s automatic growth from nil or an empty slice is just as good.',
      reality: 'This subtopic\'s third code example and theory show preallocation is not just a performance tweak here — it is the one technique that sidesteps the growth-regime question ENTIRELY, producing an exact, non-over-allocated capacity regardless of which threshold or factor the current Go runtime\'s automatic growth algorithm would otherwise have applied.'
    }
  ];
}
