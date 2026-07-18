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
  templateUrl: './child-deadline-clamped-to-parents.html',
  styleUrl: './child-deadline-clamped-to-parents.scss'
})
export class ChildDeadlineClampedToParentsSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'A child\'s own WithTimeout/WithDeadline can request a LATER deadline than its parent — it just has no effect',
      points: [
        'The main page\'s own Context Tree code example demonstrates that cancelling a PARENT cascades down and cancels every child and grandchild — a genuinely important, well-covered mechanic. What it does not cover is a related but distinct rule: what happens when a CHILD tries to set its OWN deadline LATER than its parent\'s, rather than the parent cancelling outright.',
        'Go\'s own context documentation states this precisely for WithDeadline: "If the parent\'s deadline is already earlier than d, WithDeadline(parent, d) is semantically equivalent to parent." In other words, requesting a later deadline than the parent already has does not extend anything — the resulting child context still respects whichever deadline is EARLIER, silently ignoring the later one that was requested.',
        'This is not a special case reserved for oddly-configured code — it is a direct, necessary consequence of context\'s own cascade guarantee that the main page\'s theory already establishes: "cancelling a parent cancels all descendants." If a child could genuinely outlive a deadline its parent already has, that cascade guarantee would be broken the moment the parent\'s deadline passed — the clamping behavior is precisely what keeps the two rules consistent with each other.',
      ]
    },
    {
      heading: 'Why this matters for the exact HTTP-handler pattern the main page itself demonstrates',
      points: [
        'The main page\'s own "HTTP with Context" code example does exactly this: it takes r.Context() (already carrying the client\'s own deadline/cancellation) and calls context.WithTimeout(ctx, 2*time.Second) on top of it, describing this as "add[ing] a per-request timeout on top of the incoming context." That description is accurate, but the WORD "on top of" hides an asymmetry this subtopic makes explicit: the 2-second timeout only ever SHORTENS the effective deadline, never lengthens it.',
        'If the incoming r.Context() already has a shorter deadline than 2 seconds (say, the client set its own 500ms timeout, or an upstream gateway already attached a 1-second budget), the WithTimeout(ctx, 2*time.Second) call in the main page\'s own example has NO effect at all on the actual cancellation timing — the handler still respects the earlier, incoming deadline, exactly per the clamping rule this subtopic describes. The literal 2-second duration passed to WithTimeout only takes effect when the parent\'s own deadline (if any) is later than 2 seconds from now, or absent entirely.',
        'The practical implication: a chain of WithTimeout calls at different layers of a system establishes a MAXIMUM total budget equal to the SHORTEST deadline anywhere in the chain, not the sum or the most-recently-specified value. Code that assumes "I set a 2-second timeout, so this operation gets 2 seconds" is only correct when nothing upstream already imposed a shorter one — a genuinely easy assumption to get wrong when context flows through several independently-written layers, exactly the shape the main page\'s own HTTP handler example represents.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'A later child deadline has no effect — the parent\'s earlier one wins',
      language: 'typescript',
      code: `package main

import (
    "context"
    "fmt"
    "time"
)

func main() {
    // Parent has a SHORT deadline: 100ms from now.
    parent, parentCancel := context.WithTimeout(context.Background(), 100*time.Millisecond)
    defer parentCancel()

    // Child REQUESTS a much LONGER deadline: 5 seconds from now.
    child, childCancel := context.WithTimeout(parent, 5*time.Second)
    defer childCancel()

    parentDeadline, _ := parent.Deadline()
    childDeadline, _ := child.Deadline()

    // Per this subtopic's theory ("WithDeadline(parent, d) is
    // semantically equivalent to parent" when parent's deadline is
    // already earlier), child's EFFECTIVE deadline is clamped to
    // match the parent's -- the 5-second request had no effect.
    fmt.Println("requested child deadline == parent's:", childDeadline.Equal(parentDeadline)) // true

    <-child.Done()
    fmt.Println(child.Err()) // context.DeadlineExceeded, firing at
                               // ~100ms -- NOT after 5 seconds, despite
                               // the child explicitly requesting that.
}`,
    },
    {
      label: 'The main page\'s own HTTP pattern: "on top of" can mean "no effect at all"',
      language: 'typescript',
      code: `package main

import (
    "context"
    "fmt"
    "time"
)

// Simulates the main page's own HTTP handler pattern: take an
// incoming context and add a timeout "on top of" it.
func handleRequest(incoming context.Context) {
    ctx, cancel := context.WithTimeout(incoming, 2*time.Second)
    defer cancel()

    deadline, _ := ctx.Deadline()
    fmt.Println("effective deadline is", time.Until(deadline).Round(time.Millisecond), "from now")
}

func main() {
    // Case 1: no incoming deadline -- the 2-second timeout applies
    // exactly as written.
    handleRequest(context.Background())
    // effective deadline is 2s from now (approximately)

    // Case 2: the incoming context ALREADY has a shorter deadline --
    // e.g. an upstream gateway attached its own 300ms budget before
    // this handler ever ran. The handler's own "2*time.Second" call
    // has ZERO effect on the actual timing here.
    upstream, upstreamCancel := context.WithTimeout(context.Background(), 300*time.Millisecond)
    defer upstreamCancel()
    handleRequest(upstream)
    // effective deadline is ~300ms from now -- the handler's own
    // 2-second request was silently clamped down to the earlier,
    // incoming deadline, exactly per this subtopic's theory.
}`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'An API gateway sets a 5-second timeout on every incoming request before forwarding it to a backend service. The backend service itself independently sets its own 30-second timeout on every database query it runs, reasoning "our queries sometimes legitimately take up to 30 seconds, so we need that much budget." A specific slow query that would have completed successfully at the 12-second mark is instead cut off much earlier than 30 seconds. Using this subtopic\'s theory, explain why the backend\'s own 30-second timeout did not actually give the query 30 seconds to run.',
    hint: 'Per this subtopic\'s theory, when a context with a LATER requested deadline is derived from a parent context that already has an EARLIER deadline, which one actually takes effect? Does the database query\'s context ultimately derive from the gateway\'s own 5-second-timeout context, or is it independent of it?',
    solution: 'The backend\'s own 30-second timeout never actually had a chance to take effect because the database query\'s context is (in any correctly-written service propagating context per the main page\'s own advice to "always thread the caller\'s ctx through to downstream calls") derived from the SAME context chain that started at the gateway\'s 5-second timeout. Per this subtopic\'s theory, when context.WithTimeout(ctx, 30*time.Second) is called with a parent ctx that already has a deadline earlier than 30 seconds from now (here, whatever remains of the gateway\'s original 5-second budget by the time it reaches the database call), the resulting child context\'s effective deadline is clamped to that earlier, inherited deadline — "WithDeadline(parent, d) is semantically equivalent to parent" whenever the parent\'s deadline is already earlier than d. So the query was actually cut off at whatever time remained of the gateway\'s original 5-second budget (likely just a few seconds, accounting for time already spent in earlier processing steps before reaching the database call), not anywhere close to the backend\'s own requested 30 seconds. The backend team\'s reasoning ("our queries sometimes legitimately take up to 30 seconds, so we need that much budget") is not wrong on its own terms, but it conflicts directly with the gateway\'s own 5-second budget upstream — per this subtopic\'s theory, the actual, enforced budget for ANY operation in a context chain is always the SHORTEST deadline anywhere in that chain, not the most specific or most recently requested one. Fixing this requires either raising the gateway\'s own timeout to accommodate genuinely slow queries, or restructuring the system so slow queries do not need to complete within a single end-to-end request\'s overall budget (e.g., an asynchronous job pattern) — the backend service cannot simply request more time locally and expect it to be honored when an upstream layer already imposed a shorter deadline.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'The main page\'s own HTTP handler example describes calling context.WithTimeout(ctx, 2*time.Second) on an incoming context as "add[ing] a per-request timeout on top of the incoming context" — meaning the resulting timeout is additive, giving the handler 2 more seconds beyond whatever the incoming context already allowed.',
      reality: 'This subtopic\'s theory and second code example show the actual behavior is the opposite of additive — it can only ever SHORTEN or match the incoming deadline, never lengthen it. "On top of" in the main page\'s own phrasing means the new call sits ABOVE the incoming context in the derivation chain, not that its duration adds to whatever time was already available; if the incoming context\'s deadline is already sooner than 2 seconds from now, the WithTimeout call has literally zero effect on the actual cancellation timing.'
    },
    {
      thought: 'A context.WithTimeout(ctx, d) call always guarantees the resulting context will remain valid for at least duration d, since that duration was explicitly requested — the only way it could be cancelled sooner is if cancel() is called explicitly or the operation completes.',
      reality: 'This subtopic\'s theory and first code example show this guarantee does not hold when the parent context already has an earlier deadline — per Go\'s own documentation, "WithDeadline(parent, d) is semantically equivalent to parent" whenever the parent\'s own deadline is already sooner. The requested duration d is a REQUEST, not a guarantee, and is silently overridden by any earlier deadline already present anywhere upstream in the context chain.'
    },
    {
      thought: 'Each layer in a system that independently sets its own context.WithTimeout duration is choosing its own, locally-scoped budget for its own work — as long as each individual layer\'s own timeout value seems reasonable for what that layer does, the overall system\'s timing behavior should be predictable from those individual choices.',
      reality: 'This subtopic\'s exercise shows the opposite: because deadlines only ever get shorter as context flows downward through a chain, the EFFECTIVE budget for any given layer is always the shortest deadline set anywhere upstream in the chain, not that layer\'s own locally-chosen value. A downstream layer\'s own carefully-chosen timeout duration can be rendered completely irrelevant by an unrelated, earlier decision made in a completely different part of the system that the downstream layer\'s author may not even be aware of.'
    }
  ];
}
