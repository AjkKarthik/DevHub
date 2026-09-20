import { Component } from '@angular/core';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';

@Component({
  selector: 'app-kafka-ks-updates',
  standalone: true,
  imports: [SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
    TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './windows-emit-updates-not-only-final-results.html',
  styleUrl: './windows-emit-updates-not-only-final-results.scss'
})
export class WindowsEmitUpdatesNotOnlyFinalResultsSubtopic {
  topicLabel = 'Kafka Streams & KSQL';
  topicRoute = '/messaging/kafka-streams';

  theory: TheoryPoint[] = [
    {
      heading: 'What the page said versus what Kafka Streams does',
      points: [
        'The page said windowed aggregation results are emitted as windows close. That is not the default. KIP-328 states the behaviour plainly: by default all Streams operators emit results whenever new results are available, and that includes windowed operations.',
        'So a count over a 1-minute window produces an updated count each time a record lands in it, not one count when the minute is over. Record caching and the commit interval can merge some of those updates, but the downstream still sees a stream of refinements, not a single final value.',
        'The page\'s own Java example prints inside <code>foreach</code>, so it prints many lines per window. Anything you trigger from that stream, such as an alert or an email, fires once per update.'
      ]
    },
    {
      heading: 'Getting one final result per window',
      points: [
        'Once a window has ended and its grace period has passed, its keys can no longer change, except by out-of-order records inside the grace period. That is the point at which a result is final.',
        'Kafka Streams offers <code>suppress(Suppressed.untilWindowCloses(...))</code> for this. It buffers the intermediate results and emits only the final value when the window closes.',
        'It relies on stream time, which moves forward only as newer records arrive. If a partition goes quiet right after a window ends, the suppressed result is not emitted until a later record advances stream time past the window end plus grace.'
      ]
    }
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Model: continuous vs suppressed',
      language: 'typescript',
      code: `// One 1-minute window [0, 60), grace 0. Event timestamps are in seconds.
function run(events: number[], windowEnd: number, grace: number, suppress: boolean) {
  const out: number[] = [];
  let count = 0, streamTime = 0, emittedFinal = false;
  for (const ts of events) {
    streamTime = Math.max(streamTime, ts);                    // stream time only moves with new records
    if (ts < windowEnd) { count++; if (!suppress) out.push(count); }
    if (suppress && !emittedFinal && streamTime >= windowEnd + grace) { out.push(count); emittedFinal = true; }
  }
  return out;
}

const events = [5, 20, 40, 55, 61];
console.log(run(events, 60, 0, false));            // [ 1, 2, 3, 4 ]  one update per record
console.log(run(events, 60, 0, true));             // [ 4 ]           only the final result
console.log(run([5, 20, 40, 55], 60, 0, true));    // [ ]             no later record: stream time never passes 60`
    },
    {
      label: 'suppress in the Java DSL',
      language: 'typescript',
      code: `// Java Kafka Streams DSL (shown as a comment, as on the main page)

/*
views
  .groupByKey()
  .windowedBy(TimeWindows.ofSizeAndGrace(Duration.ofMinutes(1), Duration.ofSeconds(30)))
  .count()
  .suppress(Suppressed.untilWindowCloses(Suppressed.BufferConfig.unbounded()))  // final result only
  .toStream()
  .foreach((windowedKey, count) -> System.out.println(windowedKey + " -> " + count));
*/

// Trade-off: the final count is emitted only after window end + 30 s grace has passed in stream time.`
    }
  ];

  exercise: TryItExercise = {
    prompt: 'Page views for one user arrive with timestamps 5, 20, 40 and 55 seconds, inside a 1-minute window with zero grace. What does a downstream consumer of the default windowed count see, what does it see with <code>suppress(untilWindowCloses)</code>, and what if no further records ever arrive?',
    hint: 'Use the model above. Stream time only advances when newer records arrive.',
    solution: 'By default it sees an updated count for each record: 1, 2, 3 and 4 (caching may merge some updates). With suppress it sees one value, 4, but only once stream time reaches the window end at 60. If no later record ever arrives, stream time stays at 55, the window never closes in stream time, and the final result is not emitted.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'A windowed count emits one result when the window closes.',
      reality: 'By default it emits an updated result for every record in the window. Use <code>suppress(untilWindowCloses)</code> to get a single final result.'
    },
    {
      thought: 'With suppress I always get the final result right when the window ends on the clock.',
      reality: 'Suppression waits for stream time, which advances with newer records. A quiet partition can leave the last window unemitted until another record arrives.'
    },
    {
      thought: 'Intermediate updates are just an implementation detail I can ignore.',
      reality: 'Anything triggered downstream, such as alerts, emails or writes, fires once per update unless you suppress or de-duplicate.'
    }
  ];
}
