import { Component } from '@angular/core';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';

@Component({
  selector: 'app-kafka-ob-created-at',
  standalone: true,
  imports: [SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
    TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './created-at-is-transaction-start.html',
  styleUrl: './created-at-is-transaction-start.scss'
})
export class CreatedAtIsTransactionStartSubtopic {
  topicLabel = 'Outbox Pattern';
  topicRoute = '/messaging/outbox-pattern';

  theory: TheoryPoint[] = [
    {
      heading: 'What now() actually returns',
      points: [
        'The outbox schema used <code>created_at TIMESTAMPTZ DEFAULT now()</code>, and the polling relay reads rows with <code>ORDER BY created_at</code>. In PostgreSQL <code>now()</code> is the same as <code>transaction_timestamp()</code>: the time the current transaction started, and "their values do not change during the transaction".',
        'So the timestamp records when the transaction began, not when the outbox row was inserted or committed. <code>clock_timestamp()</code> is the one that returns the actual current time and changes within a statement.',
        'That difference matters when two transactions touch the same aggregate. Transaction B can start first, wait for a row lock held by transaction A, and only insert its outbox row after A has committed. B gets the earlier <code>created_at</code> even though its event happened after A\'s.'
      ]
    },
    {
      heading: 'When it reorders events',
      points: [
        'The relay only sees committed rows. If A and B are both committed by the time it polls, <code>ORDER BY created_at</code> puts B first and the aggregate\'s events are published in the wrong order.',
        'Switching the default to <code>clock_timestamp()</code> fixes this for events of the same aggregate, because the row lock makes B insert after A. It relies on one database clock that does not move backwards, and it does not order events of unrelated aggregates by commit time.',
        'Ordering across different aggregates is usually not required. The guarantee that matters is per aggregate, which the Kafka message key gives you on the consumer side.'
      ]
    }
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Model: two transactions on one aggregate',
      language: 'typescript',
      code: `// A holds the aggregate row lock. B started first but waited for that lock.
const rev = [
  { id: 'A', event: 'order.placed',    start: 3, insert: 4, commit: 5 },
  { id: 'B', event: 'order.confirmed', start: 1, insert: 6, commit: 7 },
];
// Both are committed by the time the relay polls at t = 8.

const byNow   = [...rev].sort((a, b) => a.start  - b.start ).map(t => t.event);  // now()
const byClock = [...rev].sort((a, b) => a.insert - b.insert).map(t => t.event);  // clock_timestamp()

console.log('ORDER BY now()             :', byNow);    // [ 'order.confirmed', 'order.placed' ]  wrong
console.log('ORDER BY clock_timestamp() :', byClock);  // [ 'order.placed', 'order.confirmed' ]  right`
    },
    {
      label: 'Schema change',
      language: 'typescript',
      code: `-- Before: transaction start time
created_at TIMESTAMPTZ DEFAULT now()

-- After: the time the row is actually inserted
created_at TIMESTAMPTZ DEFAULT clock_timestamp()`
    }
  ];

  exercise: TryItExercise = {
    prompt: 'Transaction A updates order 1 and inserts its outbox row at t=4, committing at t=5. Transaction B started at t=1 but waited for A\'s lock, inserted at t=6 and committed at t=7. The relay polls at t=8. In what order does <code>ORDER BY created_at</code> publish them with <code>now()</code>, and with <code>clock_timestamp()</code>?',
    hint: 'now() is the start time, clock_timestamp() is the insert time.',
    solution: 'With now() B has created_at 1 and A has 3, so B is published first and the events are reversed. With clock_timestamp() A has 4 and B has 6, so A is published first, which is the true order.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'DEFAULT now() stamps the moment the row is inserted.',
      reality: 'It stamps the start of the transaction, and the value does not change for the rest of it. Use clock_timestamp() for the insertion time.'
    },
    {
      thought: 'Ordering the outbox by created_at gives commit order across the whole table.',
      reality: 'It does not. At best it orders events of the same aggregate, because the row lock serialises them. Unrelated aggregates have no meaningful order.'
    },
    {
      thought: 'A serial id column solves the ordering problem.',
      reality: 'Sequence values are handed out at insert time, not commit time, so a lower id can commit after a higher one. For one aggregate the row lock still keeps them in order.'
    }
  ];
}
