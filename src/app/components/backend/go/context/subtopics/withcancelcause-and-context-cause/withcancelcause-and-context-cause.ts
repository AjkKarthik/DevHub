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
  templateUrl: './withcancelcause-and-context-cause.html',
  styleUrl: './withcancelcause-and-context-cause.scss'
})
export class WithcancelcauseAndContextCauseSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'ctx.Err() only ever tells you WHICH of two generic reasons — WithCancelCause adds WHY',
      points: [
        'The main page\'s own theory and quiz cover ctx.Err() thoroughly, but its answer space is deliberately narrow: "context.Canceled if cancel() was called, or context.DeadlineExceeded if the deadline passed." Every cancellation in a program that only uses WithCancel/WithTimeout/WithDeadline collapses down to one of exactly these two sentinel values, no matter how many different reasons actually triggered the cancel.',
        'context.WithCancelCause(parent) (Go 1.21+) is a distinct function returning (ctx, cancelCause) instead of (ctx, cancel) — cancelCause has the signature func(err error), letting the caller attach a SPECIFIC error explaining why cancellation happened, not just that it happened. context.Cause(ctx) then retrieves that specific error.',
        'Per the documentation\'s own precise description: "Cause returns a non-nil error explaining why c was canceled. The first cancellation of c or one of its parents sets the cause. If that cancellation happened via a call to CancelCauseFunc(err), then Cause returns err. Otherwise Cause(c) returns the same value as c.Err()." That last sentence matters: Cause() is a strict superset of Err() — for contexts that never use CancelCauseFunc, Cause() degrades gracefully to exactly what Err() already returns.',
      ]
    },
    {
      heading: 'The "first cancellation... sets the cause" detail, and where this changes real debugging',
      points: [
        'The documentation\'s phrase "the first cancellation of c or one of its parents sets the cause" is significant given the main page\'s own context-tree theory: since cancellation cascades from parent to every descendant, a specific cause set on a PARENT via CancelCauseFunc propagates down and is retrievable via Cause() on any CHILD context too — not just the exact context the cancelCause function was called on.',
        'This directly upgrades a common, frustrating debugging scenario the main page\'s own theory does not solve: with plain WithTimeout, a downstream function that failed with "context deadline exceeded" gives no clue WHICH upstream operation actually timed out when several timeouts are nested (an HTTP handler timeout wrapping a DB query timeout wrapping an external API call timeout, for instance) — every layer\'s ctx.Err() reports the identical generic context.DeadlineExceeded. WithCancelCause lets each layer attach its OWN specific, human-readable reason, retrievable via Cause() anywhere downstream.',
        'Note the asymmetry: calling the returned cancelCause function with cancelCause(nil) sets the cause to context.Canceled — matching plain cancel()\'s behavior — while calling it with a real error is what actually adds the extra information. Code that always calls cancelCause(nil) (never providing a real cause) gets identical behavior to plain WithCancel; the benefit only appears once a caller actually starts passing meaningful errors.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Plain WithTimeout: every nested timeout reports the same generic error',
      language: 'typescript',
      code: `package main

import (
    "context"
    "fmt"
    "time"
)

func callExternalAPI(ctx context.Context) error {
    ctx, cancel := context.WithTimeout(ctx, 20*time.Millisecond)
    defer cancel()
    select {
    case <-time.After(100 * time.Millisecond):
        return nil
    case <-ctx.Done():
        return ctx.Err() // ALWAYS context.DeadlineExceeded --
                           // gives no clue this was the EXTERNAL
                           // API call specifically that was slow.
    }
}

func handleRequest(ctx context.Context) error {
    ctx, cancel := context.WithTimeout(ctx, 500*time.Millisecond)
    defer cancel()
    return callExternalAPI(ctx)
}

func main() {
    err := handleRequest(context.Background())
    fmt.Println(err) // "context deadline exceeded" -- with several
                       // nested timeouts in a real system, this
                       // message alone can't tell you WHICH layer
                       // actually timed out.
}`,
    },
    {
      label: 'WithCancelCause: each layer attaches its own specific reason',
      language: 'typescript',
      code: `package main

import (
    "context"
    "errors"
    "fmt"
    "time"
)

var ErrExternalAPITimeout = errors.New("external API call exceeded its own budget")

func callExternalAPI(ctx context.Context) error {
    ctx, cancelCause := context.WithCancelCause(ctx)
    defer cancelCause(nil) // no real error -- normal completion path

    timer := time.AfterFunc(20*time.Millisecond, func() {
        cancelCause(ErrExternalAPITimeout) // ATTACH a specific reason
    })
    defer timer.Stop()

    select {
    case <-time.After(100 * time.Millisecond):
        return nil
    case <-ctx.Done():
        return context.Cause(ctx) // returns ErrExternalAPITimeout
                                    // specifically -- not just the
                                    // generic DeadlineExceeded.
    }
}

func main() {
    err := callExternalAPI(context.Background())
    fmt.Println(err) // "external API call exceeded its own budget"
    fmt.Println(errors.Is(err, ErrExternalAPITimeout)) // true
}`,
    },
    {
      label: 'Cause() propagates down from a parent — retrievable on any child',
      language: 'typescript',
      code: `package main

import (
    "context"
    "errors"
    "fmt"
)

var ErrUpstreamShutdown = errors.New("upstream service is shutting down")

func main() {
    parent, cancelParent := context.WithCancelCause(context.Background())

    // A child derived normally -- WithCancel, not WithCancelCause.
    child, cancelChild := context.WithCancel(parent)
    defer cancelChild()

    // Cancel the PARENT with a specific cause.
    cancelParent(ErrUpstreamShutdown)

    // Per the documentation: "the first cancellation of c or one of
    // its parents sets the cause" -- so context.Cause(child) sees
    // the PARENT's cause too, even though child itself was created
    // with plain WithCancel, not WithCancelCause.
    fmt.Println(child.Err())          // context.Canceled (generic)
    fmt.Println(context.Cause(child)) // "upstream service is
                                        // shutting down" -- the
                                        // SPECIFIC parent-level cause,
                                        // still retrievable here.
}`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A service has three nested layers, each creating its own context.WithTimeout: an HTTP handler (2s), a business-logic layer (1s), and a database call (500ms). A production incident report shows only "context deadline exceeded" in the logs, with no way to tell which of the three timeouts actually fired first. Using this subtopic\'s theory, describe the minimal change needed to make future incidents distinguishable, without changing the actual timeout durations.',
    hint: 'This subtopic\'s theory distinguishes ctx.Err() (always one of two generic values) from context.Cause(ctx) (whatever specific error was passed to a CancelCauseFunc). Which of context.WithTimeout / context.WithCancelCause would each layer need to switch to, and what would each layer need to do differently when ITS OWN timeout fires versus just propagating whatever ctx it received?',
    solution: 'The minimal change is to have EACH of the three layers replace context.WithTimeout with context.WithCancelCause plus its own explicit timer (using time.AfterFunc, as shown in this subtopic\'s second code example), calling its own cancelCause(someLayerSpecificError) when ITS OWN timeout elapses — rather than relying on the generic timeout behavior WithTimeout provides automatically. Each layer defines a distinct sentinel error (e.g. ErrHTTPHandlerTimeout, ErrBusinessLogicTimeout, ErrDatabaseTimeout) and calls cancelCause with that specific error when its own timer fires; normal completion still calls cancelCause(nil), matching plain cancel()\'s behavior with no change to the durations themselves. Per this subtopic\'s theory, when a downstream error eventually surfaces in logs, calling context.Cause(ctx) at the point of failure will return the SPECIFIC layer\'s sentinel error (not just the generic context.DeadlineExceeded every layer would otherwise report identically) — and per the propagation behavior demonstrated in this subtopic\'s third code example, even if the failure is detected several function calls away from where the specific timeout actually fired, Cause() still surfaces the correct originating layer\'s error, since "the first cancellation of c or one of its parents sets the cause." The next production incident\'s logs would then read something specific like "database call exceeded its own budget" instead of an ambiguous generic message, immediately identifying which of the three layers to investigate.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'context.WithCancelCause and context.Cause() are a completely separate, unrelated mechanism from ctx.Err() — checking both after a cancellation might give two independent, potentially conflicting pieces of information.',
      reality: 'This subtopic\'s theory quotes the documentation directly: "Otherwise Cause(c) returns the same value as c.Err()" — Cause() is a strict superset of Err(), not a separate mechanism. For any context that never uses a CancelCauseFunc, Cause() and Err() report identically; Cause() only diverges from Err() when a specific error was actually provided via cancelCause(err).'
    },
    {
      thought: 'A specific cancellation cause set via cancelCause(err) on a context is only retrievable by calling context.Cause() on that EXACT context value — a downstream function holding a child context derived from it would only see the generic context.Canceled/DeadlineExceeded via that child\'s own Err()/Cause().',
      reality: 'This subtopic\'s theory and third code example show the opposite, quoting the documentation directly: "the first cancellation of c or one of its parents sets the cause" — a cause set on a PARENT context via CancelCauseFunc is fully retrievable via context.Cause() on any CHILD context derived from it, even a child created with plain context.WithCancel rather than WithCancelCause itself.'
    },
    {
      thought: 'Switching from context.WithTimeout/WithCancel to context.WithCancelCause requires rewriting how every context in a codebase is created, since it is a fundamentally different function with different semantics.',
      reality: 'This subtopic\'s theory and second code example show the actual API surface is narrow and additive: WithCancelCause returns (ctx, cancelCause) instead of (ctx, cancel), and calling cancelCause(nil) behaves identically to plain cancel() — code that does not need a specific cause for a particular context can adopt WithCancelCause with zero behavior change by simply always passing nil, and only add real error values at the specific call sites where richer diagnostic information is actually valuable.'
    }
  ];
}
