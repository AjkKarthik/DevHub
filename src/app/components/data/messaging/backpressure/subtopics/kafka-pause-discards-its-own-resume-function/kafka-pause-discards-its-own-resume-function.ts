import { Component } from '@angular/core';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';

@Component({
  selector: 'app-kafka-bp-pause-resume',
  standalone: true,
  imports: [SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
    TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './kafka-pause-discards-its-own-resume-function.html',
  styleUrl: './kafka-pause-discards-its-own-resume-function.scss'
})
export class KafkaPauseDiscardsItsOwnResumeFunctionSubtopic {
  topicLabel = 'Backpressure & Flow Control';
  topicRoute = '/messaging/backpressure';

  theory: TheoryPoint[] = [
    {
      heading: 'pause() Returns the Only Way to Resume -- It Is Not Automatic',
      points: [
        'Reading kafkajs\'s own installed source (consumer/runner.js): calling pause() immediately pauses that topic-partition, and RETURNS a closure -- () => this.consumerGroup.resume(...) -- that is the ONLY thing that ever resumes it.',
        'There is no mechanism anywhere in kafkajs that automatically resumes a paused partition on the next poll, on a timer, or for any other reason. If the returned closure is never called, that partition stays paused for the lifetime of the consumer.',
        'This means a local JavaScript boolean flag (like paused = false) has ZERO effect on the actual Kafka client state on its own -- flipping that flag back to false does nothing unless it is paired with actually calling the closure pause() returned.'
      ]
    },
    {
      heading: 'The Main Page\'s Own Challenge Solution Gets This Right',
      points: [
        'The main page\'s "Kafka Pause/Resume" theory codeTab calls pause() and discards its return value, then claims in a comment that Kafka "automatically" resumes on the next poll -- this never happens.',
        'The SAME page\'s own Challenge reference solution does it correctly: resumeFn = pause(); ... resumeFn?.(); resumeFn = null; -- capturing the closure, then explicitly invoking it once the queue has drained.',
        'This is a case where a page\'s own two code samples disagree with each other -- comparing a "worked example" against a separately-authored "reference solution" for the same mechanism is a real, useful way to catch this kind of bug.'
      ]
    }
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Model: discarded closure vs. captured closure',
      language: 'typescript',
      code: `// A stand-in for kafkajs's own pause() mechanism, matching its real
// source exactly: pausing happens immediately, resuming requires calling
// the specific closure that was returned.

class FakePartition {
  private isPaused = false;
  pause(): () => void {
    this.isPaused = true;
    return () => { this.isPaused = false; };
  }
  get paused() { return this.isPaused; }
}

// Broken: discards the closure, exactly like the original codeTab did.
function brokenPauseResume() {
  const partition = new FakePartition();
  partition.pause(); // return value thrown away
  let localFlag = true;
  // ... time passes, queue drains ...
  localFlag = false; // flips a LOCAL variable -- does nothing to the partition
  return { localFlag, partitionStillPaused: partition.paused };
}

// Fixed: captures and calls the closure.
function fixedPauseResume() {
  const partition = new FakePartition();
  const resume = partition.pause(); // closure captured
  let localFlag = true;
  // ... time passes, queue drains ...
  localFlag = false;
  resume(); // the ONLY thing that actually resumes the partition
  return { localFlag, partitionStillPaused: partition.paused };
}

console.log('Broken:', brokenPauseResume());
// { localFlag: false, partitionStillPaused: true }
// -- the local flag flipped, but the partition never actually resumed.

console.log('Fixed:', fixedPauseResume());
// { localFlag: false, partitionStillPaused: false }
// -- calling the captured closure is what actually resumes it.`
    }
  ];

  exercise: TryItExercise = {
    prompt: 'A consumer calls pause() on three different partitions during a burst, storing each returned closure in an array. A bug later clears that array (resumeFns = []) before any of the closures are called, assuming the consumer will "figure it out" once traffic calms down. What actually happens to those three partitions?',
    hint: 'There is no fallback mechanism in kafkajs beyond the specific closure each pause() call returned.',
    solution: 'All three partitions stay paused forever -- there is no other way in kafkajs to resume a partition once pause() has been called, and clearing the array without calling each closure first means those three specific resume functions are gone with no way to reconstruct them. The consumer would need to be restarted (which re-subscribes and starts unpaused) to recover, since there is no generic "resume everything" fallback that does not depend on the exact closures that were discarded.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'Setting a local boolean flag like <code>paused = false</code> is what actually resumes a paused Kafka partition.',
      reality: 'A local flag is just application bookkeeping. The only thing that resumes a partition in kafkajs is calling the specific closure that the matching <code>pause()</code> call returned.'
    },
    {
      thought: 'kafkajs automatically resumes a paused partition once the consumer polls again.',
      reality: 'There is no automatic resume mechanism of any kind. A paused partition stays paused indefinitely unless the returned closure is explicitly called.'
    },
    {
      thought: 'If the resume closure from one <code>pause()</code> call is lost, calling <code>consumer.resume()</code> generically will still recover the partition.',
      reality: 'The public <code>consumer.resume(topics)</code> API does exist and can un-pause partitions by topic/partition -- but this only helps if you actually call it. A discarded closure with no other resume call anywhere in the code leaves the partition stuck.'
    }
  ];
}
