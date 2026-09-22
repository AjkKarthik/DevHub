import { Component } from '@angular/core';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';

@Component({
  selector: 'app-kafka-sp-pivot',
  standalone: true,
  imports: [SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
    TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './pivot-is-the-go-no-go-point.html',
  styleUrl: './pivot-is-the-go-no-go-point.scss'
})
export class PivotIsTheGoNoGoPointSubtopic {
  topicLabel = 'Saga Pattern';
  topicRoute = '/messaging/saga-pattern';

  theory: TheoryPoint[] = [
    {
      heading: 'Three kinds of step',
      points: [
        'The Azure Architecture Center splits saga steps into three kinds. Compensable transactions can be undone by a compensating transaction. The pivot transaction is the go/no-go point: if it commits, the saga runs to completion. Retryable transactions come after the pivot, must be idempotent, and are retried until they succeed.',
        'Describing the pivot as "the point of no return" is easy to misread as "the step that cannot be compensated". What matters is that everything after the pivot is guaranteed to finish, not that the pivot cannot be undone.',
        'Placing irreversible work such as sending an email or shipping goods at or after the pivot means it only runs once the steps that could still fail have already succeeded.'
      ]
    },
    {
      heading: 'What failure means on each side',
      points: [
        'A failure before or at the pivot aborts the saga, and the compensable steps that already committed are undone in reverse order.',
        'A failure after the pivot never triggers compensation. The step is retried, with backoff, until it succeeds, which is why it has to be idempotent.',
        'A saga with no pivot is a sequence where any step can fail and be undone. A saga whose last step is the pivot has no retryable tail.'
      ]
    }
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Model: failure before and after the pivot',
      language: 'typescript',
      code: `const steps = [
  { name: 'reserve-inventory', kind: 'compensable', undo: 'release-inventory' },
  { name: 'charge-card',       kind: 'pivot' },
  { name: 'send-receipt',      kind: 'retryable' },
];

async function run(fails: Record<string, number> = {}) {
  const log: string[] = []; const done: typeof steps = [];
  for (const s of steps) {
    if (s.kind === 'retryable') {
      let n = 0;
      for (;;) {
        n++;
        if ((fails[s.name] ?? 0) >= n) { log.push(s.name + ' failed, retrying'); continue; }
        break;
      }
      log.push(s.name + ' ok after ' + n + ' tries'); continue;
    }
    if (fails[s.name]) {
      log.push(s.name + ' FAILED');
      for (const d of [...done].reverse()) if ((d as any).undo) log.push((d as any).undo);
      log.push('aborted'); return log;
    }
    log.push(s.name + ' ok'); done.push(s);
  }
  log.push('completed'); return log;
}

console.log(await run({ 'charge-card': 1 }));
// [ 'reserve-inventory ok', 'charge-card FAILED', 'release-inventory', 'aborted' ]

console.log(await run({ 'send-receipt': 2 }));
// [ 'reserve-inventory ok', 'charge-card ok', 'send-receipt failed, retrying',
//   'send-receipt failed, retrying', 'send-receipt ok after 3 tries', 'completed' ]

console.log(await run());
// [ 'reserve-inventory ok', 'charge-card ok', 'send-receipt ok after 1 tries', 'completed' ]`
    },
    {
      label: 'Retrying a post-pivot step',
      language: 'typescript',
      code: `// After the pivot commits there is no going back, so keep trying until it works.
async function sendReceipt(orderId: string) {
  for (let attempt = 1; ; attempt++) {
    try {
      // idempotent: the same orderId always produces at most one receipt
      await mail.send({ idempotencyKey: 'receipt-' + orderId, orderId });
      return;
    } catch {
      await sleep(Math.min(2 ** attempt * 1000, 60_000));   // capped backoff
    }
  }
}`
    }
  ];

  exercise: TryItExercise = {
    prompt: 'In a saga the steps are reserve stock (compensable), charge card (pivot) and send receipt (retryable). The receipt service is down for ten minutes after the card is charged. Should the saga refund the card?',
    hint: 'Ask which side of the pivot the failing step is on.',
    solution: 'No. The pivot has committed, so the saga runs to completion. The receipt step is retried, with backoff and an idempotency key, until the service is back. Refunding would mean treating a retryable step as if it could still abort the saga.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'The pivot is the step that cannot be undone, so it goes first to get it out of the way.',
      reality: 'The pivot goes after every step that can still fail and be compensated. Putting it first commits the saga before anything has been checked.'
    },
    {
      thought: 'A failure after the pivot should roll the saga back.',
      reality: 'After the pivot the saga is committed to finishing. Later steps are retried until they succeed, and they must be idempotent so the retries are safe.'
    },
    {
      thought: 'Every step needs a compensating transaction.',
      reality: 'Only the compensable steps before the pivot do. Retryable steps after it are never undone, and the pivot itself is the decision point.'
    }
  ];
}
