import { Component } from '@angular/core';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';

@Component({
  selector: 'app-kafka-ks-grace',
  standalone: true,
  imports: [SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
    TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './no-default-grace-period-late-records-dropped.html',
  styleUrl: './no-default-grace-period-late-records-dropped.scss'
})
export class NoDefaultGracePeriodLateRecordsDroppedSubtopic {
  topicLabel = 'Kafka Streams & KSQL';
  topicRoute = '/messaging/kafka-streams';

  theory: TheoryPoint[] = [
    {
      heading: 'The "default grace=0" claim',
      points: [
        'The second mistake block said the default grace is 0 and late records are dropped silently. Neither part of that describes current Kafka Streams. KIP-633 explains that the old default grace period was 24 hours, which left many users waiting a day for results to appear.',
        'KIP-633 deprecated the old <code>of(...)</code> builders and added <code>ofSizeWithNoGrace</code> and <code>ofSizeAndGrace</code> (with matching methods for session, join and sliding windows) so you must choose explicitly between zero grace and a value you pick.',
        'The page\'s own tumbling-window example already uses <code>ofSizeWithNoGrace</code>: that is a deliberate zero, not a default.'
      ]
    },
    {
      heading: 'What grace does to late records',
      points: [
        'A window accepts a late record while stream time has not passed window end plus grace. Records arriving after the grace period has elapsed are dropped from those windows, as KIP-633 states.',
        'A longer grace period keeps windows open for stragglers and improves accuracy, but it delays the final result, which matters most when you use <code>suppress(untilWindowCloses)</code>.',
        'Pick the grace period from how late your data really arrives, for example the worst delay from mobile clients or a slow upstream, not from a guess.'
      ]
    }
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Model: which late records are accepted',
      language: 'typescript',
      code: `// Window [0, 60). A record with timestamp 30 arrives when stream time is already 150.
function accepted(streamTime: number, windowEnd: number, grace: number): boolean {
  return streamTime <= windowEnd + grace;
}

console.log(accepted(150, 60, 0));     // false  window closed at 60: the record is dropped
console.log(accepted(150, 60, 120));   // true   the window stays open until 180`
    },
    {
      label: 'Choosing it in the Java DSL',
      language: 'typescript',
      code: `// Java Kafka Streams DSL (shown as a comment, as on the main page)

/*
// Zero grace, chosen on purpose: results are final as soon as the window ends.
TimeWindows.ofSizeWithNoGrace(Duration.ofMinutes(1))

// Two minutes of grace: stragglers still update the window, final results arrive later.
TimeWindows.ofSizeAndGrace(Duration.ofMinutes(1), Duration.ofMinutes(2))
*/

// The pre-3.0 TimeWindows.of(size) builders are deprecated: they used a 24-hour default grace.`
    }
  ];

  exercise: TryItExercise = {
    prompt: 'A 1-minute window covers 0 to 60 seconds. A record with timestamp 30 arrives when stream time is already 150. Is it accepted with zero grace? With a grace period of 120 seconds? What do you pay for the longer grace period?',
    hint: 'Compare stream time with window end plus grace.',
    solution: 'With zero grace it is dropped: the window closed at 60 and stream time is 150. With 120 seconds of grace the window stays open until 180, so the record is accepted and updates the window. The cost is that the window\'s final result is delayed until 180 in stream time (with suppress, nothing is emitted before then).'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'Kafka Streams windows have a default grace period of zero.',
      reality: 'There is no implicit default in current versions: you choose <code>ofSizeWithNoGrace</code> or <code>ofSizeAndGrace</code>. The old default was 24 hours and was deprecated by KIP-633.'
    },
    {
      thought: 'A longer grace period is always better because it loses fewer records.',
      reality: 'It keeps windows open for stragglers, but every window\'s final result is delayed by the grace period.'
    },
    {
      thought: 'Late records still count in the window they belong to.',
      reality: 'Only while they arrive inside window end plus grace. After that they are dropped from those windows.'
    }
  ];
}
