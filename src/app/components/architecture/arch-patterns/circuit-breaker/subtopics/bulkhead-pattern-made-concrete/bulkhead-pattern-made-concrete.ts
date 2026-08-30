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
  templateUrl: './bulkhead-pattern-made-concrete.html',
  styleUrl: './bulkhead-pattern-made-concrete.scss'
})
export class BulkheadPatternMadeConcreteSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The page names Bulkhead but never shows it in code',
      points: [
        'The QnA\'s "What is the Bulkhead pattern and how does it complement circuit breakers?" answer is a single, accurate but abstract sentence: "Bulkhead limits the number of concurrent calls to a downstream service (thread pool or semaphore isolation)." Every OTHER pattern on this page (circuit breaker, retry, fallback) gets a full codeTab — Bulkhead is the one exception.',
        'The core idea, made concrete: a bulkhead caps how many calls to a SPECIFIC downstream can be in-flight at once, independent of how many calls the rest of the system is handling. A request that would exceed the cap is rejected immediately (or queued, depending on the implementation) rather than being allowed to add to an already-saturated pool of in-flight calls.',
        'The name comes from ship design: a bulkhead is a physical wall dividing a ship\'s hull into separate compartments, so one compartment flooding doesn\'t sink the whole ship. Applied to software: one downstream dependency\'s calls monopolizing all available resources (threads, connections) shouldn\'t be able to starve calls to every OTHER dependency too.',
      ]
    },
    {
      heading: 'Why Bulkhead and Circuit Breaker solve different halves of the same underlying problem',
      points: [
        'Circuit breaker responds to FAILURE RATE — it only opens once enough calls have actually failed or timed out. Bulkhead responds to CONCURRENCY — it caps in-flight calls regardless of whether they\'re succeeding or failing, which matters because a downstream that is merely SLOW (not yet failing outright) can still exhaust a caller\'s resources through sheer volume of concurrently pending calls, before the circuit breaker\'s failure threshold ever trips.',
        'This is directly connected to this page\'s own opening theory: "If B is slow, A\'s threads pile up waiting, exhausting its thread pool." A circuit breaker alone doesn\'t prevent that pile-up from happening in the first place — it only reacts once enough of those piled-up calls have actually failed. Bulkhead caps the pile-up directly, by concurrency, independent of whether any individual call has failed yet.',
        'Used together (as the QnA\'s one-liner states): bulkhead prevents ONE dependency\'s pending calls from exhausting resources needed by calls to OTHER dependencies; circuit breaker stops sending new calls to a dependency that has crossed from "slow" into "actually failing."',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'A minimal semaphore-based bulkhead, combined with circuit breaker',
      language: 'typescript',
      code: `// A simple counting semaphore -- caps concurrent in-flight calls
class Bulkhead {
  private inFlight = 0;

  constructor(private readonly maxConcurrent: number) {}

  async run<T>(fn: () => Promise<T>): Promise<T> {
    if (this.inFlight >= this.maxConcurrent) {
      throw new Error(\`Bulkhead full: \${this.inFlight}/\${this.maxConcurrent} calls in flight\`);
    }
    this.inFlight++;
    try {
      return await fn();
    } finally {
      this.inFlight--; // always release, success or failure
    }
  }
}

// One bulkhead PER downstream dependency -- matches this page's own
// "Sharing one circuit breaker instance across all services" mistake,
// which applies identically to bulkheads: a shared bulkhead would let
// one dependency's calls starve every other dependency's capacity too.
const catalogBulkhead = new Bulkhead(20);   // catalog: up to 20 concurrent calls
const paymentBulkhead  = new Bulkhead(10);  // payment: up to 10 concurrent calls

// Combined with circuit breaker: bulkhead caps CONCURRENCY, circuit
// breaker reacts to FAILURE RATE -- both wrap the same underlying call
async function getPrice(productId: string): Promise<number> {
  return catalogBulkhead.run(() =>
    catalogBreaker.call(() => catalogClient.getPrice(productId))
  );
  // Even if catalog-service is merely SLOW (not yet failing enough to
  // trip the circuit breaker), the bulkhead still caps how many
  // concurrent getPrice() calls can pile up waiting on it.
}`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A downstream service starts responding 3x slower than usual, but its actual error rate stays near zero -- every call eventually succeeds, just late. The calling service has a circuit breaker on this dependency but no bulkhead. What happens, and would adding a bulkhead have changed the outcome?',
    hint: 'The circuit breaker\'s failure threshold is based on FAILED calls. If calls are slow but still succeeding, does the circuit breaker have any reason to open?',
    solution: 'The circuit breaker stays Closed the whole time -- it has no failed calls to count, only slow ones, so its failure-rate threshold is never crossed. Meanwhile, calls to the slow dependency pile up: because each one takes 3x longer to complete, 3x as many calls end up in-flight at any given moment for the same incoming request rate, consuming threads/connections the whole time. Without a bulkhead capping how many of THESE specific calls can be in-flight concurrently, that pile-up can exhaust resources needed for calls to completely unrelated dependencies -- exactly the cascade the page\'s own opening theory describes, except the circuit breaker never engages because nothing is technically "failing." A bulkhead would have capped the in-flight count for this dependency specifically, protecting the rest of the system\'s capacity regardless of whether the circuit breaker ever trips.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'A circuit breaker alone is enough to prevent one slow or overloaded dependency from exhausting a service\'s resources.',
      reality: 'Per this subtopic\'s theory, a circuit breaker only reacts to FAILURE RATE — a dependency that is merely slow but still eventually succeeding never trips it, even while its pending calls consume resources needed elsewhere.'
    },
    {
      thought: 'Bulkhead and circuit breaker are two names for roughly the same protective mechanism, just from different resilience libraries.',
      reality: 'Per this subtopic\'s theory, they respond to different signals entirely — bulkhead caps CONCURRENCY regardless of success/failure, while circuit breaker reacts to the FAILURE RATE of calls that have already completed.'
    },
    {
      thought: 'A single shared bulkhead for the whole service is sufficient, since its whole point is limiting total concurrent load.',
      reality: 'Per this subtopic\'s theory, a bulkhead needs to be scoped PER downstream dependency, the same way this page\'s own mistakes block requires per-dependency circuit breakers — a shared bulkhead lets one dependency\'s calls starve capacity needed for calls to every other dependency.'
    }
  ];
}
