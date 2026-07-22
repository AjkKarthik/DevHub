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
  templateUrl: './unsynchronized-reads-have-no-guarantee.html',
  styleUrl: './unsynchronized-reads-have-no-guarantee.scss'
})
export class UnsynchronizedReadsHaveNoGuaranteeSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page\'s own definition of a data race is correct, but understates the actual risk',
      points: [
        'The main page\'s own theory defines a data race as "two goroutines access the same memory location concurrently and at least one access is a write," producing "undefined behaviour — incorrect results, silent corruption, or crashes." That framing (correctly) implies something bad MIGHT happen. Go\'s own official Memory Model document (go.dev/ref/mem) is more specific and more alarming than "might."',
        'The Memory Model\'s own canonical busy-wait example makes the exact failure mode explicit. Two package-level variables, a and done, are set by a goroutine and read by main in a spin loop with no synchronization at all — and the document states plainly: "there is no guarantee that, in main, observing the write to done implies observing the write to a, so this program could print an empty string too. Worse, there is no guarantee that the write to done will ever be observed by main, since there are no synchronization events between the two threads. The loop in main is not guaranteed to finish."',
        'That last sentence is the genuinely surprising part: this is not describing a rare timing-dependent flake where the loop USUALLY exits correctly but occasionally sees stale data. The Memory Model is stating that the compiler is permitted to produce a build where the loop for !done {} never terminates at all, because without an established synchronization edge, nothing obligates the compiler to ever re-check memory for a change made by a different goroutine.',
      ]
    },
    {
      heading: 'Why "it worked when I tested it" and "the race detector didn\'t flag it" are both unreliable evidence',
      points: [
        'This subtopic\'s theory extends what "undefined behaviour" concretely means for a Go program with no synchronization: not just "wrong values," but a real possibility of the program hanging forever on a specific build, specific Go version, or specific optimization level — behavior that can differ across compilations of the identical source, since nothing in the language specification constrains what an unsynchronized access is allowed to do.',
        'Observing correct output in casual testing is weak evidence of correctness specifically because the busy-wait example tends to "work" on unoptimized builds or particular compiler versions purely by accident — the compiler happened not to apply the optimization the Memory Model explicitly permits it to apply. A future compiler release, a different GOOS/GOARCH target, or simply a different optimization pass being enabled is enough to flip previously-"working" unsynchronized code into a hang or stale read, with zero changes to the surrounding source.',
        'This is why the main page\'s own advice to use go run -race is necessary but not by itself sufficient reassurance: the race detector is a dynamic tool that flags races it actually OBSERVES during a specific run — a data race that the detector happens not to trigger during one test invocation is still a data race, still has no defined behavior under the Memory Model, and remains exactly as legal for the compiler to break in the ways described above, entirely independent of whether any particular -race run happened to catch it.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'The Memory Model\'s own busy-wait example — Go\'s official illustration',
      language: 'typescript',
      code: `package main

// This reproduces the Go Memory Model's own canonical example
// (go.dev/ref/mem) of what NOT to write. Both variables are plain,
// unsynchronized package-level state -- no channel, mutex, atomic,
// or WaitGroup connects the two goroutines at all.
var a string
var done bool

func setup() {
    a = "hello, world"
    done = true
}

func main() {
    go setup()
    for !done {
        // spin -- waiting for setup's write to become visible
    }
    println(a)
}

// Per the Memory Model's own documented analysis of this exact
// program: even if the loop DOES eventually exit, there is no
// guarantee println(a) sees "hello, world" rather than an empty
// string -- and there is no guarantee the loop exits AT ALL. Both
// outcomes are equally legal for the Go compiler to produce.`,
    },
    {
      label: 'The fix: a channel establishes the missing happens-before edge',
      language: 'typescript',
      code: `package main

import "fmt"

var a string

func setup(done chan struct{}) {
    a = "hello, world"
    close(done) // closing a channel is a documented synchronization
                 // event -- per the Memory Model, a send (or close)
                 // on a channel happens before the corresponding
                 // receive from that channel completes.
}

func main() {
    done := make(chan struct{})
    go setup(done)
    <-done // blocks until setup's close(done) -- and, critically,
            // this receive is now guaranteed to also observe every
            // write setup made BEFORE closing the channel.
    fmt.Println(a) // guaranteed to print "hello, world" -- never
                     // an empty string, and the receive is
                     // guaranteed to eventually unblock.
}`,
    },
    {
      label: 'The fix: sync.WaitGroup provides the same guarantee for multiple goroutines',
      language: 'typescript',
      code: `package main

import (
    "fmt"
    "sync"
)

var results = make([]string, 3)

func compute(i int, wg *sync.WaitGroup) {
    defer wg.Done()
    results[i] = fmt.Sprintf("result-%d", i)
}

func main() {
    var wg sync.WaitGroup
    for i := 0; i < 3; i++ {
        wg.Add(1)
        go compute(i, &wg)
    }
    wg.Wait() // per sync.WaitGroup's own documented guarantee, every
               // call to Done() that Wait() is waiting on happens
               // before Wait() returns -- so every write compute()
               // made before calling Done() is guaranteed visible
               // to main immediately after Wait() returns.
    fmt.Println(results) // guaranteed correct -- no spin loop, no
                           // busy-wait, no risk of never seeing the
                           // writes or never terminating.
}`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A developer writes a background goroutine that periodically updates a package-level *Config pointer with a freshly-loaded configuration, and a request-handling goroutine that reads that same pointer on every request with no locking, channel, or atomic involved — reasoning that "reading a pointer is a single machine instruction, so it can\'t be torn, and I don\'t care if a request occasionally sees the slightly-stale previous config." Using this subtopic\'s theory, explain what is actually wrong with this reasoning, beyond just "it might read a stale value."',
    hint: 'This subtopic\'s theory says the risk of an unsynchronized read/write is not limited to seeing a stale-but-valid previous value. What did the Memory Model\'s own busy-wait example demonstrate is ALSO a legally possible outcome for unsynchronized access — and does "single instruction" or "pointer-sized" change that?',
    solution: 'The reasoning is flawed for a reason well beyond "might read a slightly stale config," which is the failure mode the developer has already (correctly) decided is acceptable. Per this subtopic\'s theory, the Go Memory Model does not merely say an unsynchronized read might see an old value — its own busy-wait example demonstrates that an unsynchronized access has genuinely undefined behavior, up to and including the write never becoming observable at all, or the compiler legally optimizing around the absence of any synchronization event in ways the source code never explicitly authorized. Being "a single machine-instruction-sized read" does not change this: the Memory Model\'s guarantees (or lack thereof) operate at the level of the Go language\'s own defined synchronization primitives (channels, sync.Mutex, sync.WaitGroup, sync/atomic, sync.Once), not at the level of what a particular CPU architecture happens to make atomic at the hardware instruction level — Go the language makes no such promise on its own, and a future compiler version, a different build target, or a different optimization pass is free to produce different, still-legal behavior for the exact same unsynchronized code. The actual, correct fix for "I\'m fine with an occasionally-stale config, I just want a safe, defined read" is to use sync/atomic\'s typed pointer support (atomic.Pointer[Config], available since Go 1.19) — this gives an explicit, Memory-Model-guaranteed happens-before relationship between the writer\'s Store and the reader\'s Load, at effectively the same low cost the developer was originally trying to achieve by skipping synchronization entirely, without inheriting any of the undefined-behavior risk this subtopic\'s theory describes.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'A data race in Go, per the main page\'s own definition, means the worst realistic outcome is reading a slightly stale or occasionally-torn value — annoying, but bounded, and often an acceptable risk for non-critical data like a cache or a config pointer.',
      reality: 'This subtopic\'s theory and first code example — quoting the Go Memory Model\'s own canonical busy-wait illustration directly — show the actual documented risk is unbounded: "there is no guarantee that the write... will ever be observed" and "the loop... is not guaranteed to finish." A data race\'s consequences are not capped at "stale value"; they explicitly include the possibility of a goroutine that never observes an update at all.'
    },
    {
      thought: 'If a piece of unsynchronized concurrent code has been tested repeatedly and always produces correct output, and go run -race never flags it during those tests, that is reasonably strong evidence the code is actually safe in practice, even if it is not technically "textbook correct."',
      reality: 'This subtopic\'s theory explains why this is unreliable: the busy-wait example\'s "worked in my testing" behavior typically comes from a particular compiler simply not happening to apply an optimization the Memory Model explicitly permits — a different Go version, build target, or optimization level can break it with zero source changes. The race detector is also a dynamic tool that only flags races it observes during a specific run; a race it does not happen to catch is still exactly as undefined as one it does.'
    },
    {
      thought: 'Since a pointer read or a boolean read is a single CPU instruction and cannot be "torn" (partially written) at the hardware level on most common architectures, skipping Go-level synchronization for that specific kind of access is a reasonable, low-risk shortcut distinct from racing on a larger, multi-word value.',
      reality: 'This subtopic\'s exercise shows the Memory Model\'s guarantees operate at the Go LANGUAGE level (through its own defined synchronization primitives), not at the level of what a specific CPU\'s instruction set happens to make atomic — hardware-level atomicity of a single read or write says nothing about whether the Go compiler is obligated to make that write visible to another goroutine at all, which is the actual guarantee (or lack of one) this subtopic\'s theory is about.'
    }
  ];
}
