import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  standalone: true,
  imports: [PageMetaComponent, TheoryBlockComponent, CodeBlockComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent, SubtopicEyebrowComponent],
  templateUrl: './durable-saga-dropped-compensation-logic.html',
  styleUrl: './durable-saga-dropped-compensation-logic.scss'
})
export class DurableSagaDroppedCompensationLogicSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'A "production-ready" upgrade that quietly dropped the most important part',
      points: [
        'The page presents three orchestration codeTabs in sequence: a basic "Orchestration Pattern" (with a proper try/catch and a <code>compensate()</code> method), then "Durable Saga with State Persistence," introduced as the version that matters "in production." The durable version adds checkpointing after each step — a real, valuable addition.',
        'But the durable version\'s <code>execute()</code> method originally had NO try/catch at all. If <code>inventoryService.reserve()</code> or <code>paymentService.charge()</code> threw partway through, the exception simply propagated up uncaught — there was no compensation logic anywhere in the class. The class that added durability silently removed the compensation the simpler, non-durable version already had.',
        'This means the "production" example was, in one specific way, LESS complete than the simpler teaching example directly above it on the same page — a real regression a reader copying the "durable" version as their production template would inherit.',
      ]
    },
    {
      heading: 'Why the fix reuses the SAME persisted record the resume logic already relies on',
      points: [
        'The fix doesn\'t bolt on a separate compensation-tracking mechanism — it reuses <code>record.completedSteps</code>, the exact array the resume logic already checks, to decide what needs compensating. If <code>charge_payment</code> is in <code>completedSteps</code>, a refund is needed; if <code>reserve_stock</code> is in there, stock needs releasing.',
        'This directly matches the page\'s own "Not persisting saga state" mistake block\'s point about resuming from a checkpoint after a crash — but extends it one step further: the SAME checkpoint data that lets the saga resume forward progress after a crash is exactly what lets it compensate correctly if a step fails outright, including resuming compensation itself if the process crashes mid-compensation.',
        'This also connects to the page\'s own "Ignoring compensation failures" mistake block — the fixed version persists a \'compensating\' state before attempting rollback and a \'failed\' state after, giving an operator (or a monitoring query) a way to find and investigate stuck sagas, rather than losing all record of the failure the moment the exception is caught.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Durability without compensation is not a saga',
      language: 'typescript',
      code: `// BEFORE -- persists progress, but nothing ever compensates on failure
class DurableOrderSagaBroken {
  async execute(sagaId: string, cmd: PlaceOrderCommand): Promise<void> {
    let record = await sagaRepo.load(sagaId) ?? { /* ...initial record... */ };

    // No try/catch anywhere -- if reserve() or charge() throws,
    // the exception propagates with ZERO compensation attempted.
    if (!record.completedSteps.includes('reserve_stock')) {
      await inventoryService.reserve(cmd.items);
      record.completedSteps.push('reserve_stock');
      await sagaRepo.save(record);
    }
    if (!record.completedSteps.includes('charge_payment')) {
      await paymentService.charge(cmd.customerId, cmd.totalAmount); // <- throws here
      record.completedSteps.push('charge_payment');                //    never reached
      await sagaRepo.save(record);
    }
    // If charge_payment failed, reserve_stock's reservation is now
    // stranded forever -- no compensation logic exists to release it.
  }
}

// AFTER -- the SAME persisted completedSteps drives both resume AND compensation
class DurableOrderSaga {
  async execute(sagaId: string, cmd: PlaceOrderCommand): Promise<void> {
    let record = await sagaRepo.load(sagaId) ?? { /* ...initial record... */ };

    try {
      if (!record.completedSteps.includes('reserve_stock')) {
        await inventoryService.reserve(cmd.items);
        record.completedSteps.push('reserve_stock');
        await sagaRepo.save(record);
      }
      if (!record.completedSteps.includes('charge_payment')) {
        await paymentService.charge(cmd.customerId, cmd.totalAmount);
        record.completedSteps.push('charge_payment');
        await sagaRepo.save(record);
      }
    } catch (err) {
      record.state = 'compensating';
      await sagaRepo.save(record); // checkpoint BEFORE compensating too

      if (record.completedSteps.includes('charge_payment')) {
        await paymentService.refund(cmd.orderId);
      }
      if (record.completedSteps.includes('reserve_stock')) {
        await inventoryService.release(cmd.orderId);
      }

      record.state = 'failed';
      await sagaRepo.save(record);
      throw err;
    }
  }
}`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A junior engineer argues: "the durable saga already tracks completedSteps for resuming after a crash -- that data alone proves it can handle failures correctly, even without an explicit catch block." Is checkpointing progress the same thing as handling failure?',
    hint: 'Resuming forward progress after a crash and compensating a step that actively FAILS (threw an error) are two different scenarios -- does completedSteps tracking alone address both?',
    solution: 'No -- these are genuinely different scenarios that both happen to use the same completedSteps data, but only one of them was actually implemented. Checkpointing lets the saga RESUME forward progress if the PROCESS crashes between steps (the data survives, the next run picks up where it left off) -- that part worked. But if a step itself THROWS (the hotel is unavailable, the payment is declined), there was no catch block to react to that at all -- the exception just propagates, and none of the already-completed steps get compensated. completedSteps is necessary data for compensation, but without the try/catch and compensation logic that actually READS it on failure, tracking it alone accomplishes nothing for that scenario.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'Adding state persistence and checkpointing to a saga automatically makes it production-ready and resilient to failures.',
      reality: 'Per this subtopic\'s theory, persistence solves a DIFFERENT problem (surviving a process crash between steps) than compensation solves (undoing completed steps when a LATER step actively fails) — a saga needs both, and this page\'s own "durable" example initially had only the first.'
    },
    {
      thought: 'Since the simpler "Orchestration Pattern" codeTab already demonstrates compensation correctly, it doesn\'t matter if the more advanced "Durable" codeTab omits it — a reader can infer it from the earlier example.',
      reality: 'Per this subtopic\'s theory, a reader copying the "production" durable version as their actual template inherits exactly the gap that version has — the earlier, simpler example being correct doesn\'t retroactively fix the later one a reader is more likely to actually use.'
    },
    {
      thought: 'The completedSteps array tracked for resume purposes is unrelated to what a compensation routine would need to know.',
      reality: 'Per this subtopic\'s theory, it\'s exactly the data compensation needs — which steps actually completed determines which compensating actions are required, so the fix reuses the same array rather than introducing a separate tracking mechanism.'
    }
  ];
}
