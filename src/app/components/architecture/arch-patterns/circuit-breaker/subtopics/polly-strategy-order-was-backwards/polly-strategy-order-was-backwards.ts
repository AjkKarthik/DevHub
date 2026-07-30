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
  templateUrl: './polly-strategy-order-was-backwards.html',
  styleUrl: './polly-strategy-order-was-backwards.scss'
})
export class PollyStrategyOrderWasBackwardsSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The theory states a best practice the page\'s own example didn\'t follow',
      points: [
        'The page\'s "Circuit Breakers vs. Retries" theory bullet states: "A well-designed resilience strategy applies the circuit breaker at the OUTER boundary of a call (wrapping the entire retry logic), so retries operate normally during transient issues, but once the circuit breaker detects sustained failure, retries are also short-circuited along with everything else."',
        'The page\'s own "Polly (.NET)" codeTab originally called <code>builder.AddRetry(...)</code> BEFORE <code>builder.AddCircuitBreaker(...)</code>. Verified via research into Polly v8\'s own documented pipeline semantics: strategies wrap in the order they are ADDED, and the FIRST strategy added becomes the OUTERMOST layer.',
        'That means the original code made Retry the OUTER strategy and CircuitBreaker the INNER one — the exact reverse of what the theory bullet, one section above, states is the well-designed approach. With retry outer, each retry ATTEMPT still individually reaches the (inner) circuit breaker check, rather than the circuit breaker gating the entire retry sequence at once.',
      ]
    },
    {
      heading: 'Why the ordering actually matters, not just as a Polly API detail',
      points: [
        'With circuit breaker OUTER (the corrected order): the moment the circuit is open, that outer check fails immediately — the inner retry strategy never even runs, so an open circuit stops the ENTIRE call, including any retry attempts, in one gate.',
        'With circuit breaker INNER (the original, backwards order): retry is the first thing that runs on every call. Depending on how retry\'s own failure-handling predicate treats a circuit-open failure, this can mean a request still goes through multiple retry ATTEMPTS, each one individually hitting the (fast-failing) inner circuit breaker — not the "everything short-circuited at once" behavior the theory promises.',
        'This directly connects to the page\'s own "Retrying when the circuit is open" mistake block, whose stated fix ("configure retry to NOT fire when circuit is open") is most cleanly achieved by making circuit breaker the OUTER strategy in the first place — the ordering IS the mechanism that delivers the mistake block\'s own recommended fix, which the original code sample didn\'t actually implement.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Same two strategies, opposite wrapping order',
      language: 'typescript',
      code: `// Polly v8: strategies wrap in ADD ORDER -- first added = outermost.

// BACKWARDS (the page's original example) -- Retry added first = OUTER
builder
  .AddRetry(retryOptions)          // OUTER: runs first on every call
  .AddCircuitBreaker(cbOptions);   // INNER: only reached once retry invokes it
// Flow per call: Retry -> CircuitBreaker -> delegate
// An open circuit is discovered INSIDE each retry attempt, not before
// the retry sequence starts.

// CORRECTED -- CircuitBreaker added first = OUTER
builder
  .AddCircuitBreaker(cbOptions)    // OUTER: runs first on every call
  .AddRetry(retryOptions);         // INNER: only reached if the circuit allows it
// Flow per call: CircuitBreaker -> Retry -> delegate
// An open circuit stops the call BEFORE retry logic ever starts --
// matching this page's own theory bullet and its "don't retry when
// circuit is open" mistake-block fix.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A .proto-adjacent .NET codebase reviews a pipeline defined as builder.AddTimeout(...).AddCircuitBreaker(...).AddRetry(...) -- three strategies, in that add order. Per Polly v8\'s add-order-equals-outer-to-inner rule, which strategy runs FIRST when a call is made, and which is closest to the actual delegate?',
    hint: 'The FIRST strategy added is the OUTERMOST -- it runs first and is the LAST thing the outcome passes back through.',
    solution: 'Timeout runs first (outermost, added first), then CircuitBreaker (middle), then Retry is innermost (closest to the actual delegate, added last). So the flow per call is: Timeout wraps CircuitBreaker wraps Retry wraps the delegate. This particular ordering means the overall timeout applies to the ENTIRE call including all retry attempts (a sensible outer bound), the circuit breaker gates whether retry even gets a chance to run, and retry only fires for individual attempts against a circuit that\'s currently allowing traffic through.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'The order strategies are added to a Polly v8 pipeline builder is just a stylistic choice with no effect on runtime behavior.',
      reality: 'Per this subtopic\'s theory, add order directly determines wrapping order — the first-added strategy is outermost and runs first on every call, which is a real, functional difference, not a cosmetic one.'
    },
    {
      thought: 'Adding CircuitBreaker before Retry and adding Retry before CircuitBreaker produce the same overall resilience behavior, just implemented slightly differently.',
      reality: 'Per this subtopic\'s theory, the two orders produce genuinely different behavior — with circuit breaker outer, an open circuit stops the whole call before retry starts; with retry outer, each retry attempt individually reaches the inner circuit breaker check instead.'
    },
    {
      thought: 'A page\'s own theory section can be assumed to accurately describe what its own adjacent code example demonstrates.',
      reality: 'Per this subtopic\'s theory, this page\'s own Polly codeTab originally implemented the OPPOSITE ordering from what its theory section, one section earlier, described as the well-designed approach — theory and code need to be checked against each other, not assumed consistent.'
    }
  ];
}
