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
  templateUrl: './time-after-timer-leak-fixed-in-go123.html',
  styleUrl: './time-after-timer-leak-fixed-in-go123.scss'
})
export class TimeAfterTimerLeakFixedInGo123Subtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'time.After — the exact function the main page\'s own Timeout pattern relies on — used to leak memory in a loop',
      points: [
        'The main page\'s own select code example uses time.After directly: case <-time.After(150 * time.Millisecond): fmt.Println("timed out"). That single-shot usage, called once, is completely fine on every Go version. The risk this subtopic covers only appears when time.After is called repeatedly — most commonly inside a loop that runs a select on every iteration, a very natural extension of the exact pattern the main page teaches.',
        'Before Go 1.23, time.After\'s own documentation carried an explicit warning, which current documentation now describes historically: "the underlying Timer would not be recovered by the garbage collector until the timer fired, and... if efficiency was a concern, code should use NewTimer instead and call Timer.Stop if the timer is no longer needed." Each call to time.After allocates a new Timer — and on pre-1.23 Go, that Timer\'s memory stayed alive until its own duration fully elapsed, EVEN IF the select that was waiting on it already returned via a different case and moved on.',
        'In a loop that calls select on every iteration with a fresh time.After(d) each time — for instance, a retry loop or a long-running event loop with a per-iteration timeout — this meant one still-pending, not-yet-fired Timer accumulated in memory for every iteration where a DIFFERENT case won the select. A busy loop with a long timeout duration and frequent iterations could accumulate a meaningful number of these lingering timers before the Go 1.23 fix.',
      ]
    },
    {
      heading: 'What actually changed in Go 1.23, and what to do on older versions',
      points: [
        'As of Go 1.23, the documentation states plainly: "the garbage collector can recover unreferenced, unstopped timers. There is no reason to prefer NewTimer when After will do." This is a genuine language/runtime-level fix — the exact same time.After(d) call, inside the exact same loop, no longer leaks on Go 1.23 and later, because the GC itself can now reclaim a Timer that nothing still references, even if that Timer hasn\'t fired yet.',
        'On Go versions before 1.23, the documented, correct fix for exactly this loop-with-per-iteration-timeout pattern is to switch from time.After to time.NewTimer, keep a reference to the returned *Timer across iterations (or explicitly call Stop() on it once the select resolves via a different case), and reuse or properly release it — trading a slightly more verbose call for avoiding the accumulation this subtopic describes.',
        'This is a genuinely version-gated piece of advice, not a timeless rule: code targeting Go 1.23+ exclusively can use time.After freely, including inside loops, with no special handling needed — the NewTimer-plus-Stop workaround is specifically for code that still needs to support pre-1.23 Go, or for teams following older tutorials/StackOverflow answers written before the fix landed, which may recommend NewTimer out of habit even where it is no longer necessary.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'The at-risk pattern: time.After inside a loop',
      language: 'typescript',
      code: `package main

import (
    "fmt"
    "time"
)

// pollWithTimeout calls select on every loop iteration, creating a
// FRESH time.After(d) each time -- exactly the shape that leaked
// memory on pre-Go-1.23 runtimes whenever the "work" case won
// instead of the timeout case, leaving each iteration's own
// not-yet-fired Timer to sit in memory until IT would have fired.
func pollWithTimeout(work <-chan int, timeout time.Duration, iterations int) {
    for i := 0; i < iterations; i++ {
        select {
        case v := <-work:
            fmt.Println("got:", v)
            // On pre-1.23 Go, THIS iteration's time.After(timeout)
            // Timer is now unreferenced but NOT YET recovered -- it
            // lingers until its own full timeout duration elapses.
        case <-time.After(timeout):
            fmt.Println("iteration timed out")
        }
    }
}

func main() {
    work := make(chan int, 100)
    for i := 0; i < 100; i++ { work <- i }
    pollWithTimeout(work, 5*time.Second, 100)
    // On Go 1.23+, this pattern is now completely fine as written --
    // the GC recovers each iteration's unreferenced Timer directly.
    // On pre-1.23 Go, up to 100 five-second Timers could be
    // simultaneously alive in memory at the pattern's worst case.
}`,
    },
    {
      label: 'The pre-1.23 fix: NewTimer + explicit Stop',
      language: 'typescript',
      code: `package main

import (
    "fmt"
    "time"
)

// pollWithTimerReuse is the documented pre-Go-1.23 fix for the
// previous example: use NewTimer explicitly, and Stop() it whenever
// the OTHER case wins, so its resources are released immediately
// instead of waiting for the runtime to eventually notice.
func pollWithTimerReuse(work <-chan int, timeout time.Duration, iterations int) {
    for i := 0; i < iterations; i++ {
        timer := time.NewTimer(timeout)
        select {
        case v := <-work:
            timer.Stop() // release immediately -- don't wait for it
                            // to fire or for pre-1.23 GC limitations
            fmt.Println("got:", v)
        case <-timer.C:
            fmt.Println("iteration timed out")
            // timer already fired -- nothing to Stop
        }
    }
}

func main() {
    work := make(chan int, 100)
    for i := 0; i < 100; i++ { work <- i }
    pollWithTimerReuse(work, 5*time.Second, 100)
    // Correct and leak-free on EVERY Go version, old or new -- but
    // more verbose than needed on Go 1.23+, where the simpler
    // time.After version from the first example is already safe.
}`,
    },
    {
      label: 'The one-shot usage the main page itself uses — always fine, any version',
      language: 'typescript',
      code: `package main

import (
    "fmt"
    "time"
)

func main() {
    result := make(chan int, 1)
    go func() { time.Sleep(200 * time.Millisecond); result <- 42 }()

    // A SINGLE time.After call, not inside a loop -- this is exactly
    // the main page's own Timeout pattern code example. It creates
    // exactly one Timer, which is released normally once select
    // returns and this function's own stack frame is done with it --
    // there was never a leak risk here on ANY Go version, since the
    // risk this subtopic describes specifically requires REPEATED
    // calls inside a loop, not a single call.
    select {
    case v := <-result:
        fmt.Println("got:", v)
    case <-time.After(150 * time.Millisecond):
        fmt.Println("timed out")
    }
}`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A team maintains a long-running Go service that processes a continuous stream of events in a for loop, using select { case ev := <-events: ...; case <-time.After(30*time.Second): logIdleWarning() } on every single loop iteration. The service runs on Go 1.21. Using this subtopic\'s theory, explain the specific risk this creates, and whether upgrading to a newer Go version alone would resolve it without any code changes.',
    hint: 'Is this at-risk pattern (repeated time.After calls in a loop) or the safe one-shot pattern this subtopic describes? What specific Go version does this subtopic say changed the underlying behavior, and would simply upgrading past that version fix an EXISTING pre-1.23 deployment without touching the source code at all?',
    solution: 'This is exactly the at-risk pattern this subtopic\'s theory and first code example describe: a fresh time.After(30*time.Second) call on every single loop iteration, in a long-running service that (per the scenario) processes a continuous, ongoing stream of events. Every iteration where the events case wins instead of the timeout case leaves that iteration\'s own Timer allocated and, on Go 1.21 specifically (which predates the Go 1.23 fix), NOT YET recoverable by the garbage collector until its own 30-second duration would have fully elapsed. In a continuously busy service processing many events per 30-second window, this means a meaningful, ongoing accumulation of not-yet-collectible Timer objects sitting in memory at any given moment — a genuine, gradual memory growth pattern, not a one-time cost. Per this subtopic\'s theory, simply upgrading the Go TOOLCHAIN to 1.23 or later and rebuilding the exact same, unmodified source code would fully resolve this — the fix is a garbage-collector-level change ("the garbage collector can recover unreferenced, unstopped timers"), not a change to the time.After API\'s signature or behavior that would require updating call sites. No source code changes are needed once the service is rebuilt with Go 1.23+; the NewTimer-plus-Stop workaround shown in this subtopic\'s second code example remains necessary ONLY for teams that cannot yet upgrade their Go toolchain past 1.23.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'Since the main page\'s own Timeout pattern code example uses time.After directly inside a select statement, that specific main-page example itself is subject to the memory-leak risk this subtopic describes, and should be rewritten to use NewTimer for safety.',
      reality: 'This subtopic\'s theory and third code example show the main page\'s own example is a SINGLE, one-shot time.After call, not one repeated inside a loop — the leak risk this subtopic describes specifically requires REPEATED calls (typically inside a loop running select on every iteration). A single call, exactly as the main page uses it, was never at risk on any Go version, before or after the 1.23 fix.'
    },
    {
      thought: 'The pre-Go-1.23 time.After memory concern was a minor theoretical inefficiency mentioned defensively in the documentation, not a real, practical risk worth designing around in actual production code.',
      reality: 'This subtopic\'s exercise describes a realistic, common production shape — a long-running service processing a continuous event stream with a per-iteration timeout — where the pre-1.23 behavior genuinely accumulates unreleased Timer memory over time as a direct, ongoing consequence of normal, expected operation, not an unusual edge case. The Go team\'s own decision to explicitly fix this at the garbage-collector level in 1.23 reflects that it was a real, recognized concern, not merely defensive documentation.'
    },
    {
      thought: 'Once code has been written using the NewTimer-plus-explicit-Stop pattern to avoid the pre-Go-1.23 time.After risk, that pattern should be kept even after upgrading to Go 1.23+, since it is the more "defensive" and thorough approach regardless of which Go version is actually running.',
      reality: 'This subtopic\'s theory states directly, quoting Go\'s own current documentation: "There is no reason to prefer NewTimer when After will do" on Go 1.23 and later. The NewTimer-plus-Stop pattern exists specifically to work around a runtime limitation that Go 1.23 already fixed at the garbage-collector level — keeping the more verbose pattern after upgrading adds no remaining safety benefit, just unnecessary code complexity for a version-specific problem that no longer applies.'
    }
  ];
}
