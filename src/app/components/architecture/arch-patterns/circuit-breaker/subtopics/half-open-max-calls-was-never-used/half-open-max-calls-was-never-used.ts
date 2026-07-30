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
  templateUrl: './half-open-max-calls-was-never-used.html',
  styleUrl: './half-open-max-calls-was-never-used.scss'
})
export class HalfOpenMaxCallsWasNeverUsedSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'A constructor parameter that promised behavior the class never implemented',
      points: [
        'The "Manual Circuit Breaker" codeTab\'s constructor originally accepted <code>halfOpenMaxCalls: number = 3</code> — a parameter name that, read on its own, clearly promises "the circuit requires 3 successful trial calls in half-open before closing."',
        'Tracing the actual class body: <code>onSuccess()</code> does exactly <code>this.failureCount = 0; this.state = \'closed\';</code> on ANY successful call, from ANY state — including half-open. There is no counter tracking how many half-open successes have occurred, and <code>halfOpenMaxCalls</code> is never read anywhere in the class. The circuit actually closes after ONE successful half-open trial call, not three.',
        'This is a self-contained catch — no external research needed, just checking whether a declared constructor parameter is actually referenced anywhere in the class body it belongs to. It wasn\'t.',
      ]
    },
    {
      heading: 'Why this specific bug is easy to miss — it doesn\'t "read wrong"',
      points: [
        'A reader skimming the constructor signature sees <code>halfOpenMaxCalls</code> and reasonably assumes the class enforces it, especially since the page\'s theory section elsewhere describes half-open as allowing "a small number of test requests" (plural) before closing — the parameter\'s presence makes the (wrong) single-trial behavior look intentional and configurable.',
        'The bug only becomes visible by checking the OTHER direction: does every declared input actually get used? This is the same category of check as looking for an undeclared TYPE referenced in a Challenge (a different but related class of "the signature promises more than the body delivers" bug already found elsewhere in this hub) — here it\'s an unused INPUT instead of an undeclared type, but the underlying discipline (trace every declared name to its actual use) is the same.',
        'The page has been corrected to remove the unused parameter from this basic class, with a note that the Challenge directly below extends it to add real multi-trial half-open counting — matching what the Challenge\'s own description already implies ("Extend the basic circuit breaker class to support the Half-Open state... allow up to 3 trial calls"), which only makes sense if the base class doesn\'t already claim to do this.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'The parameter that was never read',
      language: 'typescript',
      code: `class CircuitBreakerBroken {
  private state: 'closed' | 'open' | 'half-open' = 'closed';
  private failureCount = 0;
  private lastFailureTime = 0;

  constructor(
    private readonly failureThreshold: number = 5,
    private readonly cooldownMs: number = 30_000,
    private readonly halfOpenMaxCalls: number = 3,   // <- accepted...
  ) {}

  async call<T>(fn: () => Promise<T>): Promise<T> {
    if (this.state === 'open') {
      if (Date.now() - this.lastFailureTime >= this.cooldownMs) {
        this.state = 'half-open';
      } else {
        throw new Error('Circuit breaker is OPEN');
      }
    }
    try {
      const result = await fn();
      this.onSuccess();   // <- closes on the VERY FIRST half-open success
      return result;
    } catch (err) {
      this.onFailure();
      throw err;
    }
  }

  private onSuccess(): void {
    this.failureCount = 0;
    this.state = 'closed';
    // this.halfOpenMaxCalls is NEVER referenced anywhere in this class --
    // grep the whole file for it and it only appears in the constructor.
  }

  private onFailure(): void {
    this.failureCount++;
    this.lastFailureTime = Date.now();
    if (this.failureCount >= this.failureThreshold) this.state = 'open';
  }
}

// A caller passing halfOpenMaxCalls: 3 would reasonably expect 3 trial
// successes before the circuit closes. It gets exactly 1.
const cb = new CircuitBreakerBroken(5, 30_000);`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A teammate writes new CircuitBreaker(5, 30_000, 10) expecting the circuit to require 10 consecutive successful half-open trial calls before fully closing again -- they want extra confidence before resuming full traffic to a dependency that has been flaky. Using the original (unfixed) class from this subtopic, how many successful calls does it actually take to close the circuit?',
    hint: 'Trace onSuccess() -- what condition does it check before setting state to \'closed\'?',
    solution: 'Exactly 1. Regardless of what value is passed for halfOpenMaxCalls, onSuccess() unconditionally sets state to \'closed\' the moment ANY call succeeds -- there is no counter checking how many half-open successes have accumulated, and the halfOpenMaxCalls value is never read anywhere in the class body. The teammate\'s expectation of needing 10 consecutive successes would require the fuller implementation this page\'s own Challenge builds -- one that tracks a separate halfOpenSuccesses counter and only transitions to closed once it reaches the configured maximum.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'If a class constructor accepts and stores a parameter, that parameter is necessarily used somewhere in the class\'s behavior.',
      reality: 'Per this subtopic\'s theory, a parameter can be declared, typed, given a sensible default, and stored as a private field, while still never being READ anywhere in the class\'s actual logic — declaration and usage are separate things worth checking independently.'
    },
    {
      thought: 'A parameter named halfOpenMaxCalls that isn\'t actually enforced is a minor documentation nitpick, not a real bug.',
      reality: 'Per this subtopic\'s theory, a misleading parameter name creates a genuine, actionable false expectation — a caller configuring it to a specific value (say, 10) would reasonably believe they\'re getting that many trial successes, when they\'re actually getting exactly 1 regardless of the value passed.'
    },
    {
      thought: 'Since this page\'s Challenge correctly implements multi-trial half-open counting, the earlier basic codeTab must have been demonstrating the same behavior in a simplified way.',
      reality: 'Per this subtopic\'s theory, the basic codeTab wasn\'t a simplified version of the SAME behavior — it was missing the half-open counting logic entirely while still advertising it via an unused constructor parameter, which is a different problem than intentional simplification.'
    }
  ];
}
