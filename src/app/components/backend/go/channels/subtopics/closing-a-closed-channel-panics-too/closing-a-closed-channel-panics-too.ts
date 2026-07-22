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
  templateUrl: './closing-a-closed-channel-panics-too.html',
  styleUrl: './closing-a-closed-channel-panics-too.scss'
})
export class ClosingAClosedChannelPanicsTooSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page covers send-on-closed panics — closing twice panics too, with a different message',
      points: [
        'The main page\'s own mistake entry, "Sending on a closed channel," covers the panic: send on closed channel. Its "Closing from the receiver side" entry warns that closing is dangerous "if another sender still exists," and its own explanation says the fix is: "if multiple goroutines send, use sync.Once or a coordinator goroutine to close exactly once after all senders finish." What it does not show is what actually happens if that advice is skipped — and the exact shape of the resulting bug.',
        'Calling close(ch) on a channel that has already been closed panics immediately, with a distinct runtime message: panic: close of closed channel — different from the send-on-closed panic, and equally unrecoverable without an explicit recover(). This makes "close exactly once" a hard requirement, not a style preference: a channel closed by two different code paths (even by pure bad luck in a race between two goroutines that both think they are "the one" responsible for closing) crashes the program the moment the second close() executes.',
        'This risk is not limited to obviously-duplicated code — it commonly appears in fan-in/multi-producer designs (a pattern the main page\'s own Fan-in Merge example builds toward) where more than one goroutine could plausibly reach a "we\'re done, close the output" code path under different exit conditions (an error path AND a normal-completion path both calling close, for instance), each unaware the other might also call it.',
      ]
    },
    {
      heading: 'The fix the main page names but doesn\'t show: sync.Once for exactly-once close',
      points: [
        'sync.Once guarantees its wrapped function runs exactly one time, no matter how many goroutines call Do concurrently — exactly the guarantee "close exactly once" needs. Wrapping close(ch) in a shared sync.Once, referenced by every goroutine that might need to close the channel, makes every call after the first a safe no-op instead of a second, panicking close.',
        'The alternative the main page\'s own explanation also mentions — "a coordinator goroutine" — is the pattern already demonstrated in the main page\'s own Fan-in Merge example: a single dedicated goroutine (there, one waiting on a WaitGroup) is the ONLY code path that ever calls close, and every other goroutine\'s job is only to signal completion (via wg.Done()) rather than closing anything directly. This sidesteps the need for sync.Once entirely, since there is structurally only one call site for close in the first place.',
        'Choosing between the two: sync.Once fits naturally when several genuinely independent goroutines each have a legitimate reason to trigger the close (e.g., several producers, any one of which might be the last to finish, or an error path that needs to close early alongside a normal-completion path) — the coordinator pattern fits better when one goroutine can naturally own the "wait for everyone, then close" responsibility, as fan-in already does.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'The panic, reproduced directly',
      language: 'typescript',
      code: `package main

import "fmt"

func main() {
    ch := make(chan int)
    close(ch)

    fmt.Println("first close succeeded")

    // Uncommenting the next line panics immediately:
    // close(ch)
    // panic: close of closed channel
    //
    // This is a DIFFERENT message from sending on a closed channel
    // (panic: send on closed channel) -- the two are separate,
    // equally fatal misuses of the same channel.
}`,
    },
    {
      label: 'Fix 1: sync.Once for exactly-once close across independent goroutines',
      language: 'typescript',
      code: `package main

import (
    "fmt"
    "sync"
)

type safeCloser struct {
    ch   chan int
    once sync.Once
}

// closeSafely can be called by ANY number of goroutines, any number
// of times -- sync.Once guarantees close(ch) itself only ever
// executes once, no matter how many callers race to call this.
func (s *safeCloser) closeSafely() {
    s.once.Do(func() {
        close(s.ch)
    })
}

func main() {
    sc := &safeCloser{ch: make(chan int)}

    var wg sync.WaitGroup
    // Simulate several independent goroutines that might ALL decide
    // they're responsible for closing (an error path, a normal
    // completion path, a timeout path -- any of which could race).
    for i := 0; i < 5; i++ {
        wg.Add(1)
        go func() {
            defer wg.Done()
            sc.closeSafely() // safe -- only the FIRST call actually closes
        }()
    }
    wg.Wait()

    _, ok := <-sc.ch
    fmt.Println("channel closed:", !ok) // true -- closed exactly once,
                                          // zero panics despite 5
                                          // concurrent close attempts.
}`,
    },
    {
      label: 'Fix 2: a single coordinator owns the only close call site',
      language: 'typescript',
      code: `package main

import (
    "fmt"
    "sync"
)

// This mirrors the main page's own Fan-in Merge pattern: multiple
// producer goroutines each send but NEVER close -- only the single
// coordinator goroutine, once every producer has signaled done via
// the WaitGroup, calls close. There is structurally only ONE call
// site for close(out) in the whole program.
func fanIn(producers int, work func(id int, out chan<- int)) <-chan int {
    out := make(chan int)
    var wg sync.WaitGroup
    wg.Add(producers)

    for i := 0; i < producers; i++ {
        go func(id int) {
            defer wg.Done()
            work(id, out) // producers only ever SEND, never close
        }(i)
    }

    go func() {
        wg.Wait()
        close(out) // the ONE place close is ever called
    }()

    return out
}

func main() {
    out := fanIn(3, func(id int, ch chan<- int) {
        ch <- id * 100
    })
    for v := range out {
        fmt.Println("received:", v)
    }
    // No sync.Once needed here at all -- the coordinator structure
    // itself guarantees close is only ever reached once.
}`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A pipeline stage has two exit paths: a normal-completion path that calls close(out) after successfully processing everything, and a separate error-handling goroutine that also calls close(out) if it detects a fatal error partway through, to unblock any downstream readers immediately. Under certain timing, the program panics with "close of closed channel." Using this subtopic\'s theory, explain the bug and the most appropriate fix given that BOTH paths have a legitimate, independent reason to trigger the close.',
    hint: 'This subtopic describes two fixes with different tradeoffs. Given that there are genuinely two INDEPENDENT code paths, each with its own legitimate reason to close (not one clear single "coordinator"), which of the two fixes does this subtopic\'s theory say fits better?',
    solution: 'The panic occurs because both the normal-completion path and the error-handling path can each independently decide to call close(out), and under unlucky timing both execute their own close call — the second one panics with close of closed channel, exactly the failure mode this subtopic\'s first code example reproduces directly. Per this subtopic\'s theory, the two available fixes are sync.Once (for genuinely independent goroutines that each have a legitimate reason to trigger the close) and a single coordinator goroutine (for when one goroutine can naturally own the entire "wait then close" responsibility). This scenario is explicitly the sync.Once case: the normal-completion path and the error-handling path are two genuinely separate, independent code paths — neither one is naturally "the coordinator" for the other, since either might legitimately need to be the one that closes first depending on which condition (success vs. fatal error) actually occurs. The fix is to wrap the close call in a single sync.Once value shared by both paths (e.g., a closeOnce sync.Once field alongside out, with both paths calling closeOnce.Do(func() { close(out) }) instead of calling close(out) directly) — this preserves both paths\' ability to trigger the close as soon as their own condition is met, while guaranteeing the underlying close(out) call itself only ever executes once, regardless of which path gets there first or whether both attempt it under racing timing.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'The main page\'s own "Sending on a closed channel" mistake entry already covers the danger of a channel being closed unexpectedly — calling close() a second time on an already-closed channel is really just a variant of that same send-panic risk, not a genuinely separate failure mode.',
      reality: 'This subtopic\'s theory and first code example show these are two DISTINCT panics with different messages: send on closed channel (covered on the main page) versus close of closed channel (this subtopic). Both are real, separate ways the exact same closed channel can crash a program, and code that correctly avoids one is not automatically protected from the other.'
    },
    {
      thought: 'The main page\'s own advice — "use sync.Once or a coordinator goroutine to close exactly once" — describes two names for essentially the same technique; either one can be reached for interchangeably whenever multiple goroutines might need to close a channel.',
      reality: 'This subtopic\'s theory and exercise show these are two genuinely different-shaped solutions to different situations: a coordinator goroutine fits when ONE goroutine can naturally own the wait-then-close responsibility structurally (as in the main page\'s own Fan-in Merge example), while sync.Once fits when several genuinely INDEPENDENT code paths each have their own legitimate, unpredictable reason to trigger the close — the exercise\'s error-path-vs-success-path scenario specifically needs sync.Once because neither path can naturally be restructured to be "the" coordinator for the other.'
    },
    {
      thought: 'A double-close bug caused by a rare timing race is unlikely to actually crash a real running program very often — if the two close() calls only race under unusual conditions, the panic is more of a theoretical risk than a genuine production concern.',
      reality: 'This subtopic\'s exercise describes a realistic production scenario (a normal-completion path racing an error-handling path) where the panic is not a rare edge case but a direct, deterministic consequence of the underlying design whenever both conditions happen to occur close together in time — precisely the kind of bug that surfaces unpredictably in production under real load and timing, rather than reliably in casual local testing, making it easy to ship without noticing until it panics for a real user.'
    }
  ];
}
