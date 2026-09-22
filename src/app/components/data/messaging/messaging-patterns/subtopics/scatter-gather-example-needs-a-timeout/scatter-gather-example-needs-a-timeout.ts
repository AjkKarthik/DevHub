import { Component } from '@angular/core';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';

@Component({
  selector: 'app-kafka-mp-scatter',
  standalone: true,
  imports: [SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
    TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './scatter-gather-example-needs-a-timeout.html',
  styleUrl: './scatter-gather-example-needs-a-timeout.scss'
})
export class ScatterGatherExampleNeedsATimeoutSubtopic {
  topicLabel = 'Enterprise Messaging Patterns';
  topicRoute = '/messaging/messaging-patterns';

  theory: TheoryPoint[] = [
    {
      heading: 'An example that broke its own rule',
      points: [
        'The page\'s second mistake block says a Scatter-Gather must have a deadline, and its answer on the pattern lists "a timeout for partial results" as a requirement. The Scatter-Gather code example itself resolved only when <code>replies.length === vendors.length</code>. If any vendor never replied, the promise never settled.',
        'That is the exact bug the mistake block warns about, sitting in the reference example. It also leaked a connection per call, since <code>conn.close()</code> only ran on the all-replied path.',
        'The example now starts a timer alongside the consumer. If all replies arrive it clears the timer; otherwise on timeout it closes the connection and either resolves with the best of the replies it has or rejects when there are none.'
      ]
    },
    {
      heading: 'Choosing the timeout behaviour',
      points: [
        'Resolve with a partial result when a best-effort answer is useful, such as a price comparison. Say so in the result (a <code>partial</code> flag) so the caller knows not every vendor answered.',
        'Reject when a partial result would mislead, for example when the aggregate must include every participant.',
        'Set the timeout from the slowest reply you are willing to wait for, not the slowest reply possible. A slow vendor should cost the caller at most the timeout, not the vendor\'s worst case.'
      ]
    }
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Model: gather with a deadline',
      language: 'typescript',
      code: `type Reply = { vendor: string; price: number };

// delays[i] is how long vendor i takes to reply in ms, or null if it never replies.
function gather(vendors: string[], delays: (number | null)[], timeoutMs: number) {
  return new Promise<{ partial: boolean; best: Reply }>((resolve, reject) => {
    const replies: Reply[] = [];
    const best = () => replies.reduce((a, b) => (a.price < b.price ? a : b));

    const timer = setTimeout(() => {
      if (replies.length) resolve({ partial: true, best: best() });
      else reject(new Error('No price replies within timeout'));
    }, timeoutMs);

    vendors.forEach((v, i) => {
      if (delays[i] == null) return;                       // this vendor never replies
      setTimeout(() => {
        replies.push({ vendor: v, price: 10 + i * 5 });
        if (replies.length === vendors.length) { clearTimeout(timer); resolve({ partial: false, best: best() }); }
      }, delays[i]!);
    });
  });
}

console.log(await gather(['v1', 'v2', 'v3'], [10, 20, 30], 200));    // { partial: false, best: { vendor: 'v1', price: 10 } }
console.log(await gather(['v1', 'v2', 'v3'], [10, 20, null], 100));  // { partial: true,  best: { vendor: 'v1', price: 10 } }
try { await gather(['v1', 'v2'], [null, null], 50); } catch (e) { console.log((e as Error).message); }
// No price replies within timeout`
    },
    {
      label: 'The fixed consumer loop',
      language: 'typescript',
      code: `return new Promise<{ vendor: string; price: number }>((resolve, reject) => {
  const best = () => replies.reduce((a, b) => (a.price < b.price ? a : b));

  const timer = setTimeout(() => {
    conn.close();                                        // always release the connection
    if (replies.length) resolve(best());
    else reject(new Error('No price replies within timeout'));
  }, 2000);

  ch.consume(replyQ, (msg) => {
    if (!msg || msg.properties.correlationId !== corrId) return;
    replies.push(JSON.parse(msg.content.toString()));
    if (replies.length === vendors.length) {
      clearTimeout(timer);
      conn.close();
      resolve(best());
    }
  }, { noAck: true });
  // ... scatter the requests here
});`
    }
  ];

  exercise: TryItExercise = {
    prompt: 'A price-comparison Scatter-Gather queries three vendors. One vendor is down and never replies. What does the original example do, what does the fixed one do, and when would you reject instead of returning the best partial price?',
    hint: 'The original only settles when the reply count equals the vendor count.',
    solution: 'The original never settles: it waits forever for the third reply and never closes its connection. The fixed version stops at the deadline and resolves with the best of the two replies it has (marked partial). Reject instead when a partial answer would mislead, for example when the result must include every participant or when no replies arrived at all.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'A Scatter-Gather is done when the reply count matches the vendor count.',
      reality: 'That is the happy path only. Without a deadline, one silent vendor blocks the caller and holds its connection open forever.'
    },
    {
      thought: 'A timeout means the whole request failed.',
      reality: 'It can resolve with the replies received, flagged as partial, or reject if none arrived. Which is right depends on whether a partial answer is still useful.'
    },
    {
      thought: 'Closing the connection only matters on success.',
      reality: 'The timeout path must close it too, or every slow request leaks a connection.'
    }
  ];
}
