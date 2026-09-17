import { Component } from '@angular/core';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent, SubtopicLink } from '../../../../../shared/subtopic-nav/subtopic-nav';

@Component({
  selector: 'app-serial-execution-is-not-a-transaction',
  standalone: true,
  imports: [SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
            TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './serial-execution-is-not-a-transaction.html',
  styleUrl: './serial-execution-is-not-a-transaction.scss',
})
export class SerialExecutionIsNotATransactionSubtopic {
  theory: TheoryPoint[] = [
    {
      heading: 'What "serially" actually means, mechanically',
      points: [
        'The main page states the rule ("multiple mutations in a single request execute serially") and quiz Q1 tests it, but nothing on the page shows the mechanism running. The GraphQL spec\'s own execution algorithm names it directly: <code>ExecuteFieldsSerially</code>, used only for the root selection set of a mutation operation.',
        'Concretely: the executor awaits each top-level mutation field FULLY — including any nested selection under it — before it even starts resolving the next top-level field. This is true regardless of how long each one takes; a fast second field still waits for a slow first field to finish completely.',
        'This only applies to TOP-LEVEL mutation fields. Anything nested underneath a mutation field\'s own selection set (e.g. resolving <code>author { posts { ... } }</code> on the returned entity) executes normally — concurrently where possible, exactly like it would inside a query.',
      ],
    },
    {
      heading: 'Serial is not the same guarantee as atomic',
      points: [
        'The main page\'s own mistake block #3 shows two independent root mutation fields and says the second "assumes step1 finished first" — correctly noting execution order, but never mentioning what happens if one of them fails.',
        'Serial execution guarantees ORDER, not ALL-OR-NOTHING. If the first root mutation field\'s resolver has already committed a real side effect (charged a card, sent an email, written a row) and the SECOND one then throws, GraphQL has no mechanism to undo the first — there is no automatic rollback across separate top-level mutation fields.',
        'This is a real, easy-to-miss trap for anyone assuming "serial" implies "transactional," the way a database transaction would. If two mutation fields need all-or-nothing behavior, that has to be built explicitly (a single resolver doing both steps inside one DB transaction, or a saga/compensation pattern) — the GraphQL executor will not provide it just because the fields ran in order.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Serial vs. parallel, timed',
      language: 'typescript',
      code: `function delay(ms: number) { return new Promise((r) => setTimeout(r, ms)); }

// Models graphql-js's own executeFieldsSerially: fully await each root
// mutation field, in declaration order, before starting the next.
async function executeFieldsSerially(fields: Record<string, () => Promise<unknown>>) {
  const log: string[] = [];
  const t0 = Date.now();
  for (const [name, resolver] of Object.entries(fields)) {
    log.push(\`START \${name} @ t=\${Date.now() - t0}\`);
    await resolver();
    log.push(\`DONE  \${name} @ t=\${Date.now() - t0}\`);
  }
  return log;
}

// Contrast: how root QUERY fields resolve -- all started immediately.
async function executeFieldsInParallel(fields: Record<string, () => Promise<unknown>>) {
  const log: string[] = [];
  const t0 = Date.now();
  await Promise.all(Object.entries(fields).map(async ([name, resolver]) => {
    log.push(\`START \${name} @ t=\${Date.now() - t0}\`);
    await resolver();
    log.push(\`DONE  \${name} @ t=\${Date.now() - t0}\`);
  }));
  return log;
}`,
    },
    {
      label: 'The output -- and the non-transaction case',
      language: 'typescript',
      code: `console.log(await executeFieldsSerially({
  step1: () => delay(50),
  step2: () => delay(10),  // faster -- but still waits for step1
}));
// [ 'START step1 @ t=0', 'DONE  step1 @ t=~50',
//   'START step2 @ t=~50', 'DONE  step2 @ t=~60' ]

console.log(await executeFieldsInParallel({
  step1: () => delay(50),
  step2: () => delay(10),
}));
// [ 'START step1 @ t=0', 'START step2 @ t=0',
//   'DONE  step2 @ t=~10', 'DONE  step1 @ t=~50' ]  -- step2 finishes FIRST

// Not a transaction: chargeCard's side effect survives createOrder's failure.
const sideEffects: string[] = [];
const chargeCard = async () => { sideEffects.push('card charged'); return { id: 'ch_1' }; };
const createOrder = async () => { throw new Error('DB write failed'); };

try {
  await executeFieldsSerially({ chargeCard, createOrder });
} catch (e) {
  console.log('createOrder threw:', (e as Error).message);
}
console.log('sideEffects after failure:', sideEffects);
// [ 'card charged' ]  -- the charge is NOT rolled back`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A mutation document has two root fields: <code>reserveInventory</code> (fast, 10ms) then <code>chargeCard</code> (slow, 200ms). <code>chargeCard</code> throws — the payment gateway is down. What state is the system in immediately after the error, and what would have to change to prevent it?',
    hint: 'Serial execution only guarantees ORDER. It does not undo an already-committed side effect from an earlier root field.',
    solution: `Because root mutation fields execute serially, reserveInventory runs to completion FIRST -- its side effect (the inventory hold) is already committed before chargeCard even starts. When chargeCard then throws, GraphQL has no mechanism to undo reserveInventory's already-finished work: serial order is guaranteed, but nothing rolls it back.

The system is left with inventory reserved for an order whose payment never went through -- exactly the kind of state a real transaction would have prevented.

To prevent it, the two steps need an explicit all-or-nothing boundary that GraphQL itself does not provide: either combine both operations inside ONE resolver wrapped in a single database transaction (so a failed charge can also roll back the reservation), or treat it as a saga -- reserve inventory, attempt the charge, and on failure run an explicit compensating "release reservation" step. Relying on "the fields ran in the right order" is not the same guarantee as "the whole thing succeeded or none of it did."`,
  };

  misconceptions: Misconception[] = [
    {
      thought: '"Mutations execute serially, so a multi-field mutation is effectively a transaction."',
      reality: 'Serial execution guarantees ORDER only. If a later root mutation field throws, GraphQL does not roll back the side effects an earlier field already committed — there is no automatic all-or-nothing behavior across root fields.',
    },
    {
      thought: '"Serial execution applies to every field in the mutation\'s selection set, all the way down."',
      reality: 'It applies only to TOP-LEVEL mutation fields. Anything nested under a mutation field\'s own returned object resolves normally, concurrently where possible — exactly like a query.',
    },
    {
      thought: '"A faster resolver in the second mutation field will finish before a slower first field."',
      reality: 'No — the executor fully awaits the first field (including its own nested resolution) before it even starts the second, regardless of how quickly the second one could otherwise finish.',
    },
  ];

  topicLabel = 'Mutations';
  topicRoute = '/graphql/mutations';
  prev: SubtopicLink | null = {
    label: 'Apollo Server Dropped Built-In Upload Support in v3',
    route: '/graphql/mutations/apollo-server-dropped-upload-support',
  };
  next: SubtopicLink | null = {
    label: 'Guarding a Destructive Mutation With an Idempotency Key',
    route: '/graphql/mutations/idempotency-keys-for-destructive-mutations',
  };
}
