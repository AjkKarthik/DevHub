import { Component } from '@angular/core';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';

@Component({
  selector: 'app-kafka-sp-compensate-completed',
  standalone: true,
  imports: [SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
    TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './compensate-only-completed-steps.html',
  styleUrl: './compensate-only-completed-steps.scss'
})
export class CompensateOnlyCompletedStepsSubtopic {
  topicLabel = 'Saga Pattern';
  topicRoute = '/messaging/saga-pattern';

  theory: TheoryPoint[] = [
    {
      heading: 'What the orchestrator example did wrong',
      points: [
        'The orchestration example fired both compensations, <code>REFUND_PAYMENT</code> then <code>CANCEL_ORDER</code>, whenever any step failed. It never recorded which steps had committed, so it could not tell which ones needed undoing.',
        'If the reserve step itself failed, there was nothing to cancel and no payment to refund, yet both commands were sent anyway. If the charge failed, a refund was sent for money that had never been taken.',
        'The Azure Architecture Center describes the rule the other way round: compensating transactions undo the work of steps that already completed, in reverse order. A step that did not commit has nothing to compensate.'
      ]
    },
    {
      heading: 'The fix: keep a completed list and walk it backwards',
      points: [
        'The saga state carries a <code>completed</code> array. A step is appended only after its command succeeded, and compensation iterates that array in reverse, looking each entry up in a table of undo commands.',
        'A compensation sent for a step that never ran is not always harmless. A refund handler that receives a payment id it has never seen may throw, and that failure now lives inside the failure path, which is the worst place for it.',
        'Persisting the list with the rest of the state also makes a crashed orchestrator resumable: after a restart it knows exactly which steps still need undoing.'
      ]
    }
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Model: which commands are sent',
      language: 'typescript',
      code: `type Cmd = 'RESERVE_ORDER' | 'CHARGE_PAYMENT' | 'SHIP_ORDER';
const forward: Cmd[] = ['RESERVE_ORDER', 'CHARGE_PAYMENT', 'SHIP_ORDER'];
const undo: Partial<Record<Cmd, string>> = {
  RESERVE_ORDER: 'CANCEL_ORDER',
  CHARGE_PAYMENT: 'REFUND_PAYMENT',
};

function committedBefore(failAt: Cmd): Cmd[] {
  const done: Cmd[] = [];
  for (const c of forward) { if (c === failAt) break; done.push(c); }
  return done;
}

function original(failAt: Cmd) {                 // both undo commands, whatever failed
  return [...committedBefore(failAt), 'REFUND_PAYMENT', 'CANCEL_ORDER'];
}

function fixed(failAt: Cmd) {                    // only what committed, newest first
  const done = committedBefore(failAt);
  return [...done, ...[...done].reverse().flatMap(c => undo[c] ?? [])];
}

for (const f of forward) {
  console.log('fail at', f);
  console.log('  original:', original(f).join(' > '));
  console.log('  fixed:   ', fixed(f).join(' > ') || '(nothing to send)');
}
// fail at RESERVE_ORDER
//   original: REFUND_PAYMENT > CANCEL_ORDER
//   fixed:    (nothing to send)
// fail at CHARGE_PAYMENT
//   original: RESERVE_ORDER > REFUND_PAYMENT > CANCEL_ORDER
//   fixed:    RESERVE_ORDER > CANCEL_ORDER
// fail at SHIP_ORDER
//   original: RESERVE_ORDER > CHARGE_PAYMENT > REFUND_PAYMENT > CANCEL_ORDER
//   fixed:    RESERVE_ORDER > CHARGE_PAYMENT > REFUND_PAYMENT > CANCEL_ORDER`
    },
    {
      label: 'Orchestrator with a completed list',
      language: 'typescript',
      code: `interface SagaState { orderId: string; step: string; completed: string[]; }

const COMPENSATIONS: Record<string, [service: string, command: string]> = {
  RESERVE_ORDER:  ['order-service',   'CANCEL_ORDER'],
  CHARGE_PAYMENT: ['payment-service', 'REFUND_PAYMENT'],
};

async function runStep(state: SagaState, cmd: string, service: string) {
  await sendCommand(service, cmd, { orderId: state.orderId });
  state.completed.push(cmd);             // recorded only after the step succeeded
  await saveSagaState(state);            // persisted, so a restart can resume the undo
}

async function compensate(state: SagaState) {
  for (const cmd of [...state.completed].reverse()) {
    const comp = COMPENSATIONS[cmd];
    if (comp) await sendCommand(comp[0], comp[1], { orderId: state.orderId });
  }
  state.step = 'FAILED';
  await saveSagaState(state);
}`
    }
  ];

  exercise: TryItExercise = {
    prompt: 'A saga runs <code>RESERVE_ORDER</code>, <code>CHARGE_PAYMENT</code>, <code>SHIP_ORDER</code> and <code>CHARGE_PAYMENT</code> fails. Which commands does the original orchestrator send after the failure, and which does the fixed one send?',
    hint: 'Only steps that committed have anything to undo, and they are undone newest first.',
    solution: 'The original sends RESERVE_ORDER, REFUND_PAYMENT, CANCEL_ORDER: a refund for a charge that never happened. The fixed orchestrator has only RESERVE_ORDER in its completed list, so it sends CANCEL_ORDER and nothing else.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'Sending every compensation on failure is the safe choice.',
      reality: 'A compensation for a step that never committed undoes something that never happened. A refund handler may reject the unknown payment, which turns a clean rollback into a second failure.'
    },
    {
      thought: 'Compensations run in the same order as the forward steps.',
      reality: 'They run in reverse. The newest committed step is undone first, so each undo sees the state that step left behind.'
    },
    {
      thought: 'The orchestrator can keep the completed list in memory.',
      reality: 'If it crashes mid-saga, an in-memory list is gone and nobody knows what to undo. Persist it with the saga state after every successful step.'
    }
  ];
}
