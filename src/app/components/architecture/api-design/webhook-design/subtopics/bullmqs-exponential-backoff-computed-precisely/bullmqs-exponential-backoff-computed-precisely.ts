import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';

const theory: TheoryPoint[] = [
  {
    heading: 'A Code Comment That Miscounted Its Own Config',
    points: [
      'The main page’s own webhook sender codeTab configures BullMQ with <code>attempts: 6</code> and <code>backoff: { type: \'exponential\', delay: 60_000 }</code>, originally commented "// 1m, 2m, 4m, 8m, 16m, 32m" — six delay values. BullMQ’s own documentation states <code>attempts</code> is the TOTAL number of tries (the first attempt plus every retry), meaning 6 attempts produces only 5 retry DELAYS, not 6.',
      'BullMQ’s own documented exponential backoff formula is <code>2^(attemptNumber - 1) * delay</code>, where <code>attemptNumber</code> is the upcoming try being retried into — confirmed directly against BullMQ’s own worked example ("for the 7th attempt... <code>2^6 * 3000</code> milliseconds"). Applying this to the page’s own config gives delays of 2m, 4m, 8m, 16m, 32m before attempts 2 through 6 — starting at 2 MINUTES, not 1.',
      'This has now been fixed on the main page’s own comment to correctly state "6 total attempts -- 5 retry delays: 2m, 4m, 8m, 16m, 32m," matching BullMQ’s own documented formula exactly.',
      'This is a distinct kind of bug from the "dropped rule" family this hub has hit on two sibling Challenges (GraphQL vs REST, WebSockets vs SSE vs Polling) — those were logic bugs in hand-written functions; this one is a documentation/comment claim about a THIRD-PARTY LIBRARY’s own documented behavior, catchable only by checking that library’s actual docs rather than by tracing the code’s own logic.',
    ],
  },
];

const codeTabs: CodeTab[] = [
  {
    label: 'BullMQ’s Documented Backoff Formula, Applied',
    language: 'typescript',
    code: `// BullMQ's own documented exponential backoff formula:
//   2 ^ (attemptNumber - 1) * delay
// where attemptNumber is the upcoming try being retried into.
function bullmqBackoffDelay(attemptNumber: number, baseDelayMs: number): number {
  return Math.pow(2, attemptNumber - 1) * baseDelayMs;
}

// Verified against BullMQ's OWN worked example from its docs:
// "for the 7th attempt... 2^6 * 3000 milliseconds = 3.2 minutes"
console.log(bullmqBackoffDelay(7, 3000) / 1000 / 60, 'min (should be 3.2)');
// 3.2 min -- matches exactly.

// The main page's own config: attempts: 6, delay: 60_000ms.
// attempts: 6 means 6 TOTAL tries (1 initial + 5 retries) -- so there
// are only 5 retry DELAYS, before attempts 2 through 6.
for (let attempt = 2; attempt <= 6; attempt++) {
  console.log(\`delay before attempt \${attempt}: \${bullmqBackoffDelay(attempt, 60_000) / 60_000} min\`);
}
// delay before attempt 2: 2 min
// delay before attempt 3: 4 min
// delay before attempt 4: 8 min
// delay before attempt 5: 16 min
// delay before attempt 6: 32 min
// -- five values, starting at 2 min, matching the corrected comment.`,
  },
];

const exercise: TryItExercise = {
  prompt:
    'If the main page’s webhook sender instead used <code>attempts: 4</code> (keeping the same <code>delay: 60_000</code>), what would the correct, fully-accurate code comment need to say — how many delay values, and what are they?',
  hint: 'How many total tries does <code>attempts: 4</code> configure, and therefore how many gaps exist BETWEEN those tries? Apply the same <code>bullmqBackoffDelay()</code> function from the codeTab to each of those gap positions.',
  solution: `// attempts: 4 configures 4 TOTAL tries (1 initial + 3 retries) -- so
// there are only 3 retry delays, before attempts 2, 3, and 4:
//
//   bullmqBackoffDelay(2, 60_000) = 2^1 * 60_000 = 120_000ms = 2 min
//   bullmqBackoffDelay(3, 60_000) = 2^2 * 60_000 = 240_000ms = 4 min
//   bullmqBackoffDelay(4, 60_000) = 2^3 * 60_000 = 480_000ms = 8 min
//
// The correct comment would be:
//   "4 total attempts -- 3 retry delays: 2m, 4m, 8m"
//
// Following the exact same reasoning as the fix on the main page --
// count total attempts, subtract one for the number of actual delay
// gaps, then apply BullMQ's own 2^(attemptNumber-1) * delay formula to
// each gap position starting at attempt 2.`,
};

const misconceptions: Misconception[] = [
  {
    thought: 'A BullMQ job configured with <code>attempts: N</code> will be retried N times AFTER the first attempt, for a total of N+1 tries.',
    reality: 'BullMQ’s own documentation states the opposite — <code>attempts: N</code> configures N TOTAL tries (the first attempt counts as one of the N), meaning only N-1 actual retries happen. This is exactly the miscount behind the original, now-fixed comment on the main page, which listed six delay values for a config with only five retries.',
  },
  {
    thought: 'Since the main page’s codeTab is illustrative example code (not something actually executed by this learning platform), an inaccurate comment inside it doesn’t really matter.',
    reality: 'A comment describing exactly what a specific, concrete configuration produces is a factual claim a reader is meant to trust and learn from — exactly the kind of claim this hub has repeatedly found worth verifying against the actual library’s own documented behavior rather than assuming it’s correct, the same discipline already applied to numerous other main-page fixes across this hub.',
  },
  {
    thought: 'Doubling a fixed base delay for each successive retry (exponential backoff) always starts the FIRST retry delay at exactly the base delay value itself.',
    reality: 'The codeTab above demonstrates BullMQ’s own formula starts the first retry delay at <code>2^1 * delay</code> (TWICE the base delay), not <code>2^0 * delay</code> (the base delay itself) — confirmed by matching BullMQ’s own documented worked example exactly. A reader assuming the first retry always uses the bare base delay would get every subsequent delay in the sequence wrong too.',
  },
];

@Component({
  selector: 'app-api-webhook-bullmq-backoff',
  standalone: true,
  imports: [CommonModule, SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent,
    CodeBlockComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './bullmqs-exponential-backoff-computed-precisely.html',
  styleUrl: './bullmqs-exponential-backoff-computed-precisely.scss',
})
export class BullmqsExponentialBackoffComputedPreciselySubtopic {
  theory = theory;
  codeTabs = codeTabs;
  exercise = exercise;
  misconceptions = misconceptions;
}
