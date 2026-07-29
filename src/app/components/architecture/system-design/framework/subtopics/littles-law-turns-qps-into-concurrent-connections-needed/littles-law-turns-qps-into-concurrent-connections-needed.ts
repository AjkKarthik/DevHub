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
  templateUrl: './littles-law-turns-qps-into-concurrent-connections-needed.html',
  styleUrl: './littles-law-turns-qps-into-concurrent-connections-needed.scss'
})
export class LittlesLawTurnsQpsIntoConcurrentConnectionsNeededSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'A question the main page\'s framework doesn\'t equip you to answer yet',
      points: [
        'The main page\'s Step 2 shows how to turn DAU into QPS, storage, and bandwidth — but a very common interview follow-up is "OK, so how many server threads / connections / worker processes do you actually need to handle that QPS?" The main page\'s own estimation template has no tool for this question at all. This subtopic closes that gap.',
      ]
    },
    {
      heading: 'The tool: Little\'s Law — L = λW',
      points: [
        'Little\'s Law is a general result from queueing theory: the average number of requests IN THE SYSTEM at any given moment (L) equals the average arrival rate (λ, your QPS) multiplied by the average time each request spends in the system (W, your latency).',
        'Applied to capacity planning: if your service handles 10,000 QPS and each request takes an average of 50ms (0.05s) to fully process, then L = 10,000 × 0.05 = 500 — meaning roughly 500 requests are "in flight" (being actively worked on) at any given instant, which is roughly the number of concurrent worker threads/connections/processes your service needs provisioned to keep up without queueing delay building up.',
        'This is exactly the missing link between the main page\'s own two separate numbers (QPS from Step 2, and any latency SLA from Step 1\'s non-functional requirements) — Little\'s Law is the formula that combines them into a concrete "how many workers do I need" answer.',
      ]
    },
    {
      heading: 'Where this bites in practice: thread-pool and connection-pool sizing',
      points: [
        'A synchronous, thread-per-request web server with a thread pool sized smaller than L (the Little\'s-Law-computed concurrency) will start QUEUEING requests once concurrent in-flight requests exceed the pool size — the requests don\'t fail, but their latency climbs, which itself increases W, which increases L further (a feedback loop that can spiral under sustained load).',
        'This is also the underlying reason connection pools to a database or downstream service need explicit sizing rather than "whatever the default is" — a pool sized below the Little\'s-Law concurrency for that specific downstream call becomes the bottleneck, no matter how well-provisioned the calling service itself is.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Applying Little\'s Law to the main page\'s own numbers',
      language: 'bash',
      code: `# Little's Law: L = lambda * W
#   L      = average number of requests in the system (concurrency)
#   lambda = average arrival rate (QPS)
#   W      = average time each request spends in the system (latency)

# Main page's own average QPS figure: ~11,574 QPS
# Assume a latency SLA of 100ms (0.1s) per request:
echo "L = 11574 * 0.1 = $(echo "11574 * 0.1" | bc) concurrent requests"
# -> ~1,157 requests in flight at any moment, at the AVERAGE rate

# Using the peak QPS instead (see the peak-vs-average subtopic),
# e.g. 3x average = ~34,722 QPS at the same 100ms SLA:
echo "L = 34722 * 0.1 = $(echo "34722 * 0.1" | bc) concurrent requests at peak"
# -> ~3,472 concurrent workers needed to keep peak-hour latency
#    from degrading -- this is the number that actually drives
#    thread-pool / connection-pool / worker-fleet sizing.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A service handles 5,000 QPS average with a 200ms average response time, and its thread pool is sized to 200 threads. Using Little\'s Law, is this thread pool large enough?',
    hint: 'Compute L = lambda × W using the given QPS and latency, then compare to the 200-thread pool size.',
    solution: 'No — Little\'s Law gives L = 5,000 × 0.2 = 1,000 concurrent requests needed on average, but the pool only has 200 threads. This service is undersized by 5x: requests will queue waiting for a free thread, which increases their actual wait time beyond the assumed 200ms, which (per Little\'s Law itself) increases the true required concurrency even further — a feedback loop that will show up as steadily climbing latency under sustained load rather than a clean failure. The pool needs to be sized close to the computed L (with headroom for the peak-vs-average gap covered in the previous subtopic), not an arbitrary round number.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'Once you know a system\'s QPS, sizing the number of server threads/workers needed is mostly guesswork or "pick a reasonably large number."',
      reality: 'Per this subtopic\'s theory, Little\'s Law (L = λW) gives a concrete, computable answer — multiply QPS by average request latency to get the concurrency (worker/thread/connection count) actually needed.'
    },
    {
      thought: 'An undersized thread pool just makes a service run at whatever speed the pool allows, without the QPS or latency numbers themselves being affected.',
      reality: 'Per this subtopic\'s theory, an undersized pool causes queueing, which increases actual per-request latency (W) — and since L = λW, that rising W further increases the true concurrency needed, a feedback loop rather than a stable degraded state.'
    },
    {
      thought: 'Little\'s Law only applies to specialized queueing-theory problems, not everyday system design interview capacity estimation.',
      reality: 'Per this subtopic\'s theory, it directly answers one of the most common follow-up questions in a system design interview ("how many threads/connections do you need?") using exactly the QPS and latency numbers the interview\'s own estimation step already produces.'
    }
  ];
}
