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
  templateUrl: './sync-cond-wait-must-loop-not-if.html',
  styleUrl: './sync-cond-wait-must-loop-not-if.scss'
})
export class SyncCondWaitMustLoopNotIfSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page mentions sync.Cond briefly — its actual usage contract has two hard requirements',
      points: [
        'The main page\'s own theory covers sync.Cond in one bullet: "a condition variable that broadcasts or signals goroutines waiting on a condition," and its Q&A adds that it is used when goroutines "wait on the same shared condition." Neither mentions the two things that make Cond genuinely easy to misuse: what Wait() actually does to the lock, and the specific shape the surrounding code must take.',
        'Cond\'s own documentation for Wait() states its behavior directly: "Wait atomically unlocks c.L and suspends execution of the calling goroutine. After later resuming execution, Wait locks c.L before returning." This is a single atomic operation from the caller\'s perspective — the goroutine cannot be woken and miss a concurrent state change in the gap between unlocking and actually going to sleep, because Cond\'s own internal implementation guarantees there is no such gap. This is precisely why Wait() REQUIRES the caller to already be holding c.L before calling it — Wait\'s own atomic unlock step has nothing to unlock otherwise.',
        'The second requirement follows directly from the first: "because c.L is not locked while Wait is waiting, the caller typically cannot assume that the condition is true when Wait returns." Some other goroutine could change the state again before this one gets scheduled back and re-acquires c.L, or the wakeup could be a spurious one entirely unrelated to the condition actually becoming true.',
      ]
    },
    {
      heading: 'The documented fix: always Wait inside a for loop, never a single if',
      points: [
        'Cond\'s own documentation gives the exact required pattern: "the caller should Wait in a loop," shown as c.L.Lock(); for !condition() { c.Wait() }; ...use the condition...; c.L.Unlock(). Using if !condition() { c.Wait() } instead of a for loop is a genuine, documented bug — it re-checks the condition zero times after Wait() returns, trusting that the single wakeup was both real and still valid by the time this goroutine actually got the lock back.',
        'This "loop, not if" requirement is not a defensive-programming suggestion — it is a structural consequence of the exact atomicity guarantee Wait() makes. Because the lock is genuinely released during the wait, ANY number of other goroutines could run, change the shared state one or more times, and reacquire/release the lock again before this particular goroutine\'s own Wait() call returns and re-acquires it — the condition this goroutine cares about could easily be false again by the time it actually resumes, even if it was briefly true at the moment Broadcast() or Signal() was called.',
        'This is directly analogous to (and worth contrasting against) the main page\'s own advice elsewhere in this hub — "prefer channels over Cond in most cases." Channels sidestep this entire class of bug because a channel receive either gets a real value or blocks; there is no equivalent "the condition might have changed again" gap to defend against with a surrounding loop, which is exactly why Cond specifically needs this extra discipline that channel-based code does not.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'The documented, correct pattern: Wait inside a for loop',
      language: 'typescript',
      code: `package main

import (
    "fmt"
    "sync"
)

type Queue struct {
    mu    sync.Mutex
    cond  *sync.Cond
    items []int
}

func NewQueue() *Queue {
    q := &Queue{}
    q.cond = sync.NewCond(&q.mu)
    return q
}

func (q *Queue) Push(v int) {
    q.mu.Lock()
    q.items = append(q.items, v)
    q.mu.Unlock()
    q.cond.Signal() // wake ONE waiting goroutine, if any
}

func (q *Queue) Pop() int {
    q.mu.Lock()
    defer q.mu.Unlock()

    // The documented, required pattern: FOR, not IF. Even after
    // Signal() wakes this goroutine, another Pop() call (or a
    // spurious wakeup) could mean items is empty again by the time
    // this goroutine actually re-acquires q.mu -- the loop re-checks.
    for len(q.items) == 0 {
        q.cond.Wait() // atomically unlocks q.mu, sleeps, re-locks
                        // q.mu before returning -- per Cond's own
                        // documented Wait() contract.
    }

    v := q.items[0]
    q.items = q.items[1:]
    return v
}

func main() {
    q := NewQueue()
    var wg sync.WaitGroup

    wg.Add(1)
    go func() {
        defer wg.Done()
        fmt.Println("popped:", q.Pop()) // blocks until Push happens
    }()

    q.Push(42)
    wg.Wait()
}`,
    },
    {
      label: 'The bug: a single if instead of a for loop',
      language: 'typescript',
      code: `package main

import "sync"

type BuggyQueue struct {
    mu    sync.Mutex
    cond  *sync.Cond
    items []int
}

func NewBuggyQueue() *BuggyQueue {
    q := &BuggyQueue{}
    q.cond = sync.NewCond(&q.mu)
    return q
}

func (q *BuggyQueue) Pop() int {
    q.mu.Lock()
    defer q.mu.Unlock()

    // BUG: a single "if" instead of "for". This trusts that the
    // condition is STILL true the instant Wait() returns and this
    // goroutine has re-acquired the lock -- but per Cond's own
    // documented contract, that is exactly what the caller "cannot
    // assume." With multiple waiters, a Broadcast(), or a spurious
    // wakeup, len(q.items) could easily be back to 0 here.
    if len(q.items) == 0 {
        q.cond.Wait()
    }

    // This can panic with an index-out-of-range if items is STILL
    // empty here -- exactly the scenario the "for" loop pattern in
    // the correct version above exists specifically to prevent.
    v := q.items[0]
    q.items = q.items[1:]
    return v
}`,
    },
    {
      label: 'Why Wait() requires the lock: the atomic unlock/sleep/relock guarantee',
      language: 'typescript',
      code: `package main

import "sync"

// This illustrates WHY Cond.Wait() requires the caller to already
// hold c.L -- Wait's own documented contract is a SINGLE atomic step:
// unlock, suspend, and (later) re-lock, with no gap in between where
// a state change could be missed entirely.
func demonstrateContract(cond *sync.Cond, condition func() bool) {
    cond.L.Lock() // REQUIRED before calling Wait at all

    for !condition() {
        // Per Cond's own docs: "Wait atomically unlocks c.L and
        // suspends execution of the calling goroutine. After later
        // resuming execution, Wait locks c.L before returning."
        // There is no window here where another goroutine could
        // change state AFTER this goroutine checked condition()
        // but BEFORE it actually starts waiting -- the unlock and
        // the sleep happen as one atomic unit from this goroutine's
        // perspective, which is precisely the guarantee a manually
        // written "mu.Unlock(); block somehow; mu.Lock()" sequence
        // could NOT provide (a signal sent in that gap would be lost).
    }

    cond.L.Unlock()
}`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A worker pool uses sync.Cond to wake idle workers when new jobs arrive. The Pop() method is written with if len(jobs) == 0 { cond.Wait() } instead of a for loop, and works correctly in testing with exactly one worker goroutine. After scaling to five concurrent worker goroutines in production, workers occasionally panic with an index-out-of-range error inside Pop(). Using this subtopic\'s theory, explain precisely why adding more workers exposed a bug that one worker never triggered.',
    hint: 'With exactly ONE waiting goroutine, how many other goroutines could possibly race to consume the newly-added job between this goroutine\'s Wait() returning and it actually re-checking (or, in the buggy version, NOT re-checking) the condition? What changes with five waiters instead of one?',
    solution: 'With exactly one worker goroutine, there is no OTHER goroutine that could race to consume a job between Signal() waking this goroutine and it resuming execution — by the time this single goroutine\'s Wait() call returns, the job it was signaled about is still there, so the "if" version happens to behave identically to the correct "for" version purely by the absence of any competing consumer. This is precisely why the bug never surfaced in single-worker testing. With five concurrent worker goroutines, this assumption breaks completely: cond.Signal() (or Broadcast()) can wake this goroutine, but before it actually reacquires cond.L and resumes past Wait(), one of the OTHER four workers could win the race to reacquire the lock first, see the same job, consume it, and release the lock — leaving jobs empty by the time THIS goroutine\'s Wait() call finally returns and the "if" check is never re-evaluated. Per this subtopic\'s theory, this is exactly the scenario Cond\'s own documentation warns about directly: "the caller typically cannot assume that the condition is true when Wait returns," and the fix — checking the condition inside a for loop rather than an if — exists specifically to re-verify jobs is still non-empty AFTER Wait() returns and the lock is held again, rather than trusting the state from before the wait began. The fix is changing if len(jobs) == 0 { cond.Wait() } to for len(jobs) == 0 { cond.Wait() }, exactly the corrected pattern shown in this subtopic\'s first code example.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'The main page\'s own brief mention of sync.Cond — "goroutines call Wait() to sleep until a condition is true" — implies that once Wait() returns, the condition it was waiting for is guaranteed to be true at that moment, similar to how a channel receive guarantees a real value was actually sent.',
      reality: 'This subtopic\'s theory quotes Cond\'s own documentation directly to show the opposite is true: "the caller typically cannot assume that the condition is true when Wait returns." Cond only guarantees the goroutine was WOKEN, not that the condition it cares about is still true by the time it actually resumes and re-acquires the lock — this is a fundamentally different, weaker guarantee than a channel receive provides.'
    },
    {
      thought: 'Using "if condition-not-met { cond.Wait() }" instead of a "for" loop is a minor stylistic choice — both check the condition once before waiting, and the difference only matters in unusual edge cases unlikely to occur in normal usage.',
      reality: 'This subtopic\'s theory, exercise, and second code example show this is a genuine, documented correctness bug, not a style preference — Cond\'s own documentation explicitly prescribes the for-loop pattern specifically because ANY number of other goroutines can change the shared state during the (real, lock-released) waiting period. The exercise demonstrates this surfacing reliably as soon as more than one waiting goroutine exists, which is Cond\'s entire intended use case.'
    },
    {
      thought: 'sync.Cond.Wait() can be called without holding c.L first, as long as the goroutine is prepared to handle whatever state it finds — the Lock/Wait/Unlock pattern shown in examples is just a common convention, not a hard requirement.',
      reality: 'This subtopic\'s theory and third code example show holding c.L before calling Wait is a hard requirement rooted in Wait\'s own documented atomic contract: "Wait atomically unlocks c.L and suspends execution" — Wait needs an ALREADY-LOCKED c.L to atomically unlock as its first step. Calling Wait without holding the lock first violates this contract and is not a supported, defined usage of Cond at all.'
    }
  ];
}
