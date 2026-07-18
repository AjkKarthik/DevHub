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
  templateUrl: './waitgroup-reuse-add-after-wait-returns.html',
  styleUrl: './waitgroup-reuse-add-after-wait-returns.scss'
})
export class WaitgroupReuseAddAfterWaitReturnsSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'A WaitGroup can be reused across multiple waves — but only under a specific, documented ordering rule',
      points: [
        'The main page\'s own mistake entries cover mismatched Add/Done counts and calling Add inside the goroutine — both about a SINGLE wave of Add/launch/Wait. Every code example on the main page also uses a WaitGroup exactly once per function call. None of them show a WaitGroup being reused for a SECOND round of Add/Wait after the first Wait() already returned — a genuinely common pattern in long-running workers that process repeated batches.',
        'sync.WaitGroup\'s own documentation states the exact rule governing this directly: "calls with a positive delta that occur when the counter is zero must happen before a Wait." It continues with the reuse case specifically: "If a WaitGroup is reused to wait for several independent sets of events, new Add calls must happen after all previous Wait calls have returned."',
        'Read carefully, this is a stricter requirement than it first appears: it is not enough for the previous wave\'s goroutines to have merely finished their work — the previous Wait() call itself must have actually RETURNED before any new Add(positive delta) call starts the next wave. A new Add call that races with (rather than strictly follows) a still-in-progress or just-finishing Wait() from the prior wave violates this documented contract, even if, in practice, the counter reaches zero and back up again in what looks like the "right" order.',
      ]
    },
    {
      heading: 'Why this specific ordering matters, and the safe pattern for reuse',
      points: [
        'The risk is not hypothetical timing paranoia — it maps directly onto a real internal WaitGroup implementation detail: the counter and a generation-tracking mechanism inside WaitGroup are not designed to safely distinguish "the counter went 0 -> 1 for the NEXT wave" from "the counter never actually finished settling for the CURRENT wave" unless the ordering rule above is strictly followed. Violating it is classified by Go\'s own documentation as a genuine WaitGroup misuse, in the same family as the reuse-without-waiting bugs the race detector and, in some cases, a runtime panic ("sync: WaitGroup misuse: Add called concurrently with Wait") can catch.',
        'The safe, idiomatic pattern for a worker that processes repeated batches with the SAME WaitGroup variable is straightforward once the rule is explicit: complete an entire Add → launch goroutines → Wait cycle fully — meaning the Wait() call for wave N has actually returned — before calling Add for wave N+1. A for loop where each iteration does its own Add/launch/Wait sequence in full, sequentially, naturally satisfies this without any extra effort.',
        'The alternative many developers reach for instead — declaring a brand-new sync.WaitGroup value for every wave rather than reusing one variable — trivially sidesteps this rule entirely (a fresh WaitGroup has no prior Wait() to race against) and is the simpler, harder-to-misuse choice whenever the previous wave\'s WaitGroup value is not needed for anything else afterward.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'The documented rule, straightforwardly followed',
      language: 'typescript',
      code: `package main

import (
    "fmt"
    "sync"
)

func processBatch(wg *sync.WaitGroup, batch []int) {
    for _, item := range batch {
        wg.Add(1) // positive delta -- counter starts each batch at 0
        go func(v int) {
            defer wg.Done()
            _ = v * v
        }(item)
    }
    wg.Wait() // THIS call must fully return before the NEXT batch's
               // Add calls begin -- satisfied here because processBatch
               // itself doesn't return (and the next call doesn't start)
               // until Wait() unblocks.
}

func main() {
    var wg sync.WaitGroup // ONE WaitGroup, reused across multiple waves
    batches := [][]int{{1, 2, 3}, {4, 5, 6}, {7, 8, 9}}

    for _, batch := range batches {
        processBatch(&wg, batch) // each call's own Wait() fully
        fmt.Println("batch done")   // returns before the next call's
    }                                 // Add calls can start -- safe reuse.
}`,
    },
    {
      label: 'The violation: a new Add racing with the previous Wait',
      language: 'typescript',
      code: `package main

import (
    "fmt"
    "sync"
    "time"
)

func main() {
    var wg sync.WaitGroup

    wg.Add(1)
    go func() {
        defer wg.Done()
        time.Sleep(10 * time.Millisecond)
    }()

    // DANGEROUS: launching a goroutine that calls Add for a "next
    // wave" concurrently with the FIRST wave's own Wait() below --
    // this is exactly the pattern sync.WaitGroup's own documentation
    // warns against: "new Add calls must happen after all previous
    // Wait calls have returned." Here, the second Add is racing
    // Wait(), not strictly following its return.
    go func() {
        time.Sleep(5 * time.Millisecond) // may fire WHILE Wait() below
        wg.Add(1)                          // is still blocked -- misuse
        go func() {
            defer wg.Done()
            fmt.Println("second wave")
        }()
    }()

    wg.Wait() // can panic at runtime with:
               // "sync: WaitGroup misuse: Add called concurrently
               // with Wait" -- or silently return early, depending
               // on the exact timing -- both are documented as
               // undefined/unsafe usage, not a specific guaranteed
               // outcome.
    fmt.Println("first wave done")
}`,
    },
    {
      label: 'The simpler alternative: a fresh WaitGroup per wave',
      language: 'typescript',
      code: `package main

import "sync"

// processBatchFresh sidesteps the reuse rule ENTIRELY by declaring a
// brand-new WaitGroup value every call -- there is no PRIOR Wait()
// for this instance to race against, since it has never been used
// before. This is the simpler, harder-to-misuse default whenever the
// caller doesn't specifically need one persistent WaitGroup variable
// shared across waves for some other reason.
func processBatchFresh(batch []int) {
    var wg sync.WaitGroup // fresh value -- no reuse rule applies
    for _, item := range batch {
        wg.Add(1)
        go func(v int) {
            defer wg.Done()
            _ = v * v
        }(item)
    }
    wg.Wait()
}

func main() {
    batches := [][]int{{1, 2, 3}, {4, 5, 6}, {7, 8, 9}}
    for _, batch := range batches {
        processBatchFresh(batch) // each call gets its OWN WaitGroup
    }
}`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A long-running worker holds one package-level sync.WaitGroup and, on each incoming request, spawns a handler goroutine that calls wg.Add(1) then wg.Done() when finished — while a SEPARATE background goroutine periodically calls wg.Wait() to check "are all in-flight requests done" before triggering a graceful shutdown. Using this subtopic\'s theory, explain what is unsafe about this design, independent of whether it has caused a visible bug yet.',
    hint: 'Per this subtopic\'s theory, what is the exact documented ordering requirement between a new Add(positive delta) call and a PRIOR Wait() call on the same WaitGroup? Does a request handler\'s wg.Add(1) call know or care whether the background goroutine\'s Wait() call has already returned?',
    solution: 'This design is unsafe because it structurally violates the exact rule this subtopic\'s theory quotes from sync.WaitGroup\'s own documentation: "new Add calls must happen after all previous Wait calls have returned." In this design, incoming-request handler goroutines call wg.Add(1) completely independently of whatever the background shutdown-checking goroutine\'s wg.Wait() call happens to be doing at that exact moment — there is no coordination ensuring a new Add(1) only happens once a prior Wait() call has fully returned, because Wait() here is being called repeatedly, on an ongoing basis, by a goroutine that has no way of knowing when the NEXT request\'s Add(1) is about to arrive. This is precisely the "new Add racing with a Wait" pattern this subtopic\'s second code example demonstrates, and it can manifest as a genuine runtime panic ("sync: WaitGroup misuse: Add called concurrently with Wait") or other undefined behavior, entirely independent of whether it has been observed yet in production — the absence of a visible bug so far is not evidence of correctness, the same lesson this topic\'s own memory-model subtopic makes about unsynchronized code more broadly. The actual correct tool for "wait for all in-flight requests to finish, while more requests may still be arriving" is not a single reused WaitGroup being both continuously Added-to and periodically Waited-on — it is typically a context.Context with cancellation combined with a WaitGroup used in the single, correct pattern this subtopic\'s first code example shows (all Add calls complete, THEN one single Wait call, with no interleaving), often structured so new requests stop being accepted (and therefore stop calling Add) before the final Wait call is made at all.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'A single sync.WaitGroup variable can be reused for any number of Add/Wait cycles over its lifetime, as long as the counter mathematically returns to zero at the end of each cycle — the exact timing of when a new Add call happens relative to a previous Wait call does not matter as long as the counts eventually balance.',
      reality: 'This subtopic\'s theory and second code example show timing is precisely what matters, quoting sync.WaitGroup\'s own documentation directly: "new Add calls must happen after all previous Wait calls have returned." A new Add(positive delta) that merely happens to occur while a previous Wait() is still blocked — even if the counts would eventually balance out correctly — is documented misuse that can panic at runtime, regardless of whether the arithmetic works out.'
    },
    {
      thought: 'The main page\'s own mistake entries about mismatched Add/Done counts and calling Add inside a goroutine already cover every real-world way to misuse a WaitGroup — reuse across multiple waves is just the same single-wave pattern repeated, with no additional rules to learn.',
      reality: 'This subtopic\'s theory shows reuse introduces a genuinely separate, additional documented rule beyond correct within-a-single-wave usage — the ordering constraint between a new wave\'s Add calls and the PREVIOUS wave\'s Wait call return is a distinct requirement that a perfectly balanced single-wave Add/Done count does not automatically satisfy when a WaitGroup variable is reused across multiple waves.'
    },
    {
      thought: 'Declaring a brand-new sync.WaitGroup for every batch/wave of work, instead of reusing one persistent WaitGroup variable, is a wasteful, unidiomatic pattern that experienced Go developers avoid in favor of reuse for efficiency.',
      reality: 'This subtopic\'s third code example and theory show the opposite is true in practice: sync.WaitGroup is a small, cheap-to-allocate value type, and declaring a fresh one per wave trivially sidesteps the entire reuse-ordering rule this subtopic describes, with zero performance cost worth worrying about — reuse is only actually NEEDED when the same WaitGroup variable must genuinely be shared and referenced by code outside the immediate wave-processing function, not as a default efficiency optimization.'
    }
  ];
}
