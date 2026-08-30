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
  templateUrl: './transfer-funds-never-handled-partial-save-failure.html',
  styleUrl: './transfer-funds-never-handled-partial-save-failure.scss'
})
export class TransferFundsNeverHandledPartialSaveFailureSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'Two saves, no plan for what happens if the second one fails',
      points: [
        'The "Domain Service" codeTab\'s <code>TransferFundsService.transfer()</code> calls <code>from.debit(amount)</code> and <code>to.credit(amount)</code> — each aggregate validates its OWN invariant correctly (insufficient funds throws before any state changes). But then it calls <code>await this.accountRepo.save(from);</code> followed by a completely separate <code>await this.accountRepo.save(to);</code>, with no error handling around either.',
        'The code comment says "Each aggregate enforces its own invariants" — true, but that only covers IN-MEMORY validation. It says nothing about what happens if the SECOND persistence call fails (a transient DB error, a network blip, a timeout) AFTER the first one already committed. If that happens, money has been debited from <code>from</code> and never credited to <code>to</code> — a real, silent loss of funds, for an operation literally named "TransferFunds."',
        'This is a self-contained catch requiring no external DDD literature to spot the GAP — just tracing what happens to the system\'s actual state if the second of two independent operations throws. Confirming the RIGHT fix, though, did require checking DDD\'s own convention (below).',
      ]
    },
    {
      heading: 'Why the fix isn\'t "wrap both saves in one transaction"',
      points: [
        'A natural first instinct is to wrap both <code>save()</code> calls in one shared database transaction — but that\'s actually the OPPOSITE of classic DDD guidance. Both Eric Evans\' original work and Vaughn Vernon\'s "Implementing Domain-Driven Design" recommend ONE transaction per aggregate as a design rule, specifically to keep transactions small and aggregates independently persistable and scalable — spanning a single transaction across two aggregates undermines exactly that independence.',
        'The DDD-idiomatic answer is to accept that the operation genuinely ISN\'T atomic across both aggregates, and handle the partial-failure case explicitly: if the second save fails, COMPENSATE by reversing the first aggregate\'s already-committed change (crediting back the amount that was debited), rather than leaving the system silently inconsistent.',
        'This connects directly to this hub\'s own Saga & Choreography topic — a domain service spanning multiple aggregates with no single shared transaction is, in miniature, exactly the problem sagas exist to solve (a sequence of local transactions, each committing independently, with compensating actions if a later step fails). A two-step domain service like this one is a saga, just small enough that it doesn\'t need the full saga machinery (a persisted saga log, a broker) — it still needs the SAME discipline: a compensating action for the step that already committed.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'From silent money loss to an explicit compensation',
      language: 'typescript',
      code: `// BEFORE -- no handling for a failure between the two saves
class TransferFundsServiceBroken {
  async transfer(fromId: string, toId: string, amount: Money): Promise<void> {
    const [from, to] = await Promise.all([
      this.accountRepo.findById(fromId),
      this.accountRepo.findById(toId),
    ]);
    if (!from || !to) throw new Error('Account not found');

    from.debit(amount);
    to.credit(amount);

    await this.accountRepo.save(from);  // succeeds -- from is now debited
    await this.accountRepo.save(to);    // <- if THIS throws, the debit
                                         //    already committed and is
                                         //    never undone. Money is gone.
  }
}

// AFTER -- explicit compensation if the second save fails
class TransferFundsService {
  async transfer(fromId: string, toId: string, amount: Money): Promise<void> {
    const [from, to] = await Promise.all([
      this.accountRepo.findById(fromId),
      this.accountRepo.findById(toId),
    ]);
    if (!from || !to) throw new Error('Account not found');

    from.debit(amount);
    to.credit(amount);

    await this.accountRepo.save(from);
    try {
      await this.accountRepo.save(to);
    } catch (err) {
      // Compensate: reverse the already-committed debit
      from.credit(amount);
      await this.accountRepo.save(from);
      throw new Error(\`Transfer failed and was compensated: \${(err as Error).message}\`);
    }
  }
}`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A teammate proposes fixing this by wrapping both accountRepo.save() calls inside a single database transaction, so either both commit or neither does. Is this the DDD-idiomatic fix?',
    hint: 'What does classic DDD guidance (Evans, Vernon) say about how many aggregates a single transaction should touch?',
    solution: 'Not idiomatically, no -- though it would technically solve the atomicity problem, it goes against DDD\'s own well-established convention of one transaction per aggregate, specifically to keep aggregates independently persistable and avoid the transaction scope growing to span multiple aggregates (which reintroduces exactly the kind of coupling and contention DDD\'s aggregate boundaries are meant to prevent). The DDD-idiomatic fix accepts that this operation genuinely spans two independent local transactions and handles the failure case explicitly with a compensating action -- crediting back the amount if the second save fails -- which is the same underlying discipline this hub\'s own Saga & Choreography topic covers for exactly this kind of multi-aggregate operation.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'A domain service coordinating two aggregates should wrap both aggregates\' persistence in one shared database transaction, the same way a single-aggregate operation would.',
      reality: 'Per this subtopic\'s theory, classic DDD guidance specifically recommends ONE transaction per aggregate — spanning a shared transaction across two aggregates undermines the independence that aggregate boundaries are meant to provide.'
    },
    {
      thought: 'Since each aggregate (from and to) correctly validates its own invariant before any state change, the overall TransferFunds operation is safe.',
      reality: 'Per this subtopic\'s theory, in-memory invariant validation (does the account have enough funds?) and persistence failure handling (what if saving the SECOND aggregate fails after the first one committed?) are two separate concerns — the original code only handled the first.'
    },
    {
      thought: 'A domain service spanning multiple aggregates and a saga are unrelated patterns that happen to both deal with distributed operations.',
      reality: 'Per this subtopic\'s theory, a domain service touching multiple aggregates without a shared transaction IS a small-scale saga in substance — a sequence of independently-committing local operations needing the same compensating-action discipline this hub\'s own Saga & Choreography topic covers at larger scale.'
    }
  ];
}
