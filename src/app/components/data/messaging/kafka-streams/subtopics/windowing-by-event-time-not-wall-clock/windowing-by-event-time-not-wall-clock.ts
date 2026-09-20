import { Component } from '@angular/core';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';

@Component({
  selector: 'app-kafka-ks-time',
  standalone: true,
  imports: [SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
    TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './windowing-by-event-time-not-wall-clock.html',
  styleUrl: './windowing-by-event-time-not-wall-clock.scss'
})
export class WindowingByEventTimeNotWallClockSubtopic {
  topicLabel = 'Kafka Streams & KSQL';
  topicRoute = '/messaging/kafka-streams';

  theory: TheoryPoint[] = [
    {
      heading: 'The Challenge windowed by the wrong clock',
      points: [
        'The Challenge solution bucketed each order with <code>Date.now()</code>, the wall-clock time at which the consumer happened to run. Its description also called the result a "rolling" window while the code built tumbling ones.',
        'Confluent\'s Kafka Streams documentation defines three times: event time (when the record was originally created), processing time (when the application happens to process it) and ingestion time (when the broker stored it). Its windowing works with the event-time semantics set up by timestamp extractors.',
        'Windowing by <code>Date.now()</code> is processing time. It is fine while the consumer is caught up, but it gives wrong answers whenever the consumer is not: after downtime, a backlog replay or a rewind, every old record lands in the window of the moment it was processed.'
      ]
    },
    {
      heading: 'Using the message timestamp, and the caveats',
      points: [
        'A kafkajs message carries a <code>timestamp</code> string in milliseconds. Bucketing with <code>Number(message.timestamp)</code> puts each record in the window of when it happened, so replays produce the same windows as live processing.',
        'What that timestamp means depends on the topic\'s <code>message.timestamp.type</code>: <code>CreateTime</code> is set by the producer, <code>LogAppendTime</code> is set by the broker when it stores the record. Use a topic with CreateTime (or an explicit timestamp field) if you want true event time.',
        'The Challenge state also lives in a plain <code>Map</code>, which is exactly what the page\'s third mistake block warns against: it is lost on restart. The revised solution says so in a comment and points to Kafka Streams state stores.'
      ]
    }
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Model: wall clock vs event time',
      language: 'typescript',
      code: `// Times in minutes, 5-minute windows. Three orders were placed at minutes 1, 2 and 6,
// but the consumer was down and replays them at minute 180.
const WIN = 5;
const bucket = (t: number) => Math.floor(t / WIN);
const eventTimes = [1, 2, 6];
const processedAt = 180;

function tally(pick: (t: number) => number) {
  const out: Record<number, number> = {};
  for (const t of eventTimes) { const k = pick(t); out[k] = (out[k] || 0) + 1; }
  return out;
}

console.log(tally(() => bucket(processedAt)));   // { '36': 3 }       all three land in the replay-time window
console.log(tally(t => bucket(t)));              // { '0': 2, '1': 1 } the windows they actually belong to`
    },
    {
      label: 'Event-time bucketing in kafkajs',
      language: 'typescript',
      code: `const WINDOW_MS = 5 * 60 * 1000;
const windows = new Map<string, { total: number; windowStart: number }>();  // demo only: lost on restart

await consumer.run({
  eachMessage: async ({ message }) => {
    const { userId, total } = JSON.parse(message.value!.toString());
    const ts = Number(message.timestamp);                    // event time, in milliseconds
    const windowStart = Math.floor(ts / WINDOW_MS) * WINDOW_MS;
    const key = userId + ':' + windowStart;

    const w = windows.get(key) ?? { total: 0, windowStart };
    w.total += total;
    windows.set(key, w);
  },
});`
    }
  ];

  exercise: TryItExercise = {
    prompt: 'Three orders were placed at minutes 1, 2 and 6, but the consumer was down and replays them at minute 180, with 5-minute windows. How many windows does wall-clock bucketing produce, and what does event-time bucketing produce? Which one is right for "revenue per 5 minutes of when orders were placed"?',
    hint: 'Use the model above: bucket = floor(time / 5).',
    solution: 'Wall-clock bucketing puts all three orders into a single window (bucket 36, the replay time) with a count of 3. Event-time bucketing gives two windows: bucket 0 with two orders and bucket 1 with one. Event time is the right one, because the question is about when the orders were placed, not when the consumer got round to them.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'Using <code>Date.now()</code> to bucket records is the same as windowing by event time.',
      reality: 'It is processing time. It only matches event time while the consumer is caught up; after downtime or a replay every old record lands in the window of the moment it was processed.'
    },
    {
      thought: 'The message timestamp is always when the event happened.',
      reality: 'It depends on the topic <code>message.timestamp.type</code>: CreateTime is set by the producer, LogAppendTime by the broker when it stores the record.'
    },
    {
      thought: 'A 5-minute window that starts on the clock boundary is a rolling window.',
      reality: 'Fixed, non-overlapping buckets are tumbling windows. A rolling (sliding) window moves with each event and needs per-event timestamps, not a bucket key.'
    }
  ];
}
