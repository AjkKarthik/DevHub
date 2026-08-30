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
  templateUrl: './why-reads-are-the-safe-skip-case.html',
  styleUrl: './why-reads-are-the-safe-skip-case.scss'
})
export class WhyReadsAreTheSafeSkipCaseSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The page names the exception without explaining why it\'s specifically safe',
      points: [
        'The main page\'s "Strict vs Loose Layering" section states: "Loose: Presentation may call Domain directly for read-only queries (skipping Application)" — naming READ-ONLY queries specifically as the case where skipping a layer is acceptable, without ever explaining what makes reads different from writes for this purpose.',
        'The reason is about WHAT layer-skipping actually risks: the entire point of routing through the Application layer is to guarantee that business rules and invariants get APPLIED before any state changes. A read-only query changes no state — there is nothing for the skipped layer\'s validation logic to have protected in the first place.',
      ]
    },
    {
      heading: 'Why the identical skip is dangerous for a write, using this page\'s own domain',
      points: [
        'Consider the page\'s own Order example: Order.confirm() enforces the invariant "an order must have at least one line before it can be confirmed" (shown directly in the page\'s own Rich Domain Entity and Challenge solution code). If a Presentation-layer component skipped straight to a repository\'s raw UPDATE statement to mark an order confirmed — bypassing both Application AND Domain — that invariant check never runs, and an empty order could be confirmed.',
        'A skipped READ has no equivalent risk: fetching an order\'s current state directly from a repository doesn\'t create, mutate, or persist anything — there\'s no invariant to violate, because nothing about the system\'s state changes as a result of the read itself.',
      ]
    },
    {
      heading: 'The practical rule this generalizes to',
      points: [
        'The generalizable version of the page\'s own "read-only queries" example: a layer-skip is safe specifically when the skipped layer\'s ONLY job on that path would have been enforcing invariants over a STATE CHANGE — if there\'s no state change, there\'s no invariant-enforcement opportunity being bypassed.',
        'This is exactly why CQRS (Command Query Responsibility Segregation, which this page\'s own QnA already names as a pattern that "solves these pain points") formalizes read/write asymmetry as a first-class architectural decision — reads and writes have fundamentally different consistency and validation requirements, and loose layering\'s "skip for reads only" guidance is a lightweight, informal version of the same underlying insight CQRS makes explicit.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Why a skipped read is safe but a skipped write is not',
      language: 'typescript',
      code: `// SAFE: Presentation skips Application/Domain for a READ.
// Nothing is mutated -- there's no invariant to enforce.
async function getOrderSummary(orderId: string, repo: IOrderRepository) {
  const order = await repo.findById(orderId); // raw fetch, no validation needed
  return { id: order.id, status: order.status, total: order.total };
  // No state changed -- Order.confirm()'s "must have lines" rule was
  // never at risk of being violated, because nothing was confirmed.
}

// DANGEROUS: Presentation skips Application/Domain for a WRITE.
async function confirmOrderUnsafe(orderId: string, repo: IOrderRepository) {
  // Bypasses Order.confirm()'s own invariant check entirely:
  await repo.rawUpdateStatus(orderId, 'confirmed');
  // An order with ZERO lines could now be marked "confirmed" --
  // exactly the bug Order.confirm()'s own validation exists to prevent:
  //   confirm(): void {
  //     if (this._lines.length === 0) throw new Error('Order has no lines');
  //     this._status = 'confirmed';
  //   }
}

// SAFE (the correct way to write): route through Domain so the
// invariant actually runs.
async function confirmOrderSafe(orderId: string, repo: IOrderRepository) {
  const order = await repo.findById(orderId);
  order.confirm(); // invariant enforced HERE
  await repo.save(order);
}`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A page recommends that Presentation may skip the Application layer for read-only queries, but should never skip it for writes. Using the page\'s own Order.confirm() example (which throws if an order has no lines), explain WHY this distinction holds -- what specifically makes reads safe to skip and writes unsafe?',
    hint: 'What is the Application/Domain layer\'s job on a WRITE path that it doesn\'t have an equivalent job for on a READ path?',
    solution: 'The Application/Domain layer\'s job on a write path is enforcing invariants BEFORE a state change is persisted -- Order.confirm() checks "the order must have at least one line" before allowing the confirmed status to be set. Skipping straight to a raw repository update for a WRITE bypasses that check entirely, allowing an invalid state (an empty confirmed order) to be persisted. A READ has no equivalent risk: fetching data doesn\'t create, mutate, or persist anything, so there is no invariant-enforcement step being bypassed -- the layer being skipped had nothing to protect on that specific path. The general rule: skipping a layer is safe exactly when the skipped layer\'s only role on that path would have been guarding a state change that isn\'t actually happening.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'The "read-only queries are safe to skip a layer for" guidance is really just a performance optimization -- avoiding unnecessary function calls for simple lookups -- rather than a correctness-related distinction.',
      reality: 'Per this subtopic\'s theory, the real reason is about CORRECTNESS, not performance: a read changes no state, so there is no invariant for the skipped layer to have enforced in the first place — the same logic does NOT extend to writes, where skipping the layer bypasses real validation.'
    },
    {
      thought: 'If skipping a layer is safe for simple read-only queries, it should be similarly safe for simple, "obviously correct" writes too, as long as a developer is confident the write can\'t violate any real invariant.',
      reality: 'Per this subtopic\'s theory, the risk of a skipped write isn\'t about whether a SPECIFIC write happens to be safe in a developer\'s judgment — it\'s that the validation logic (like Order.confirm()\'s line-count check) exists specifically to catch cases a developer might not anticipate; bypassing it removes that safety net regardless of how "obviously fine" any individual write seems.'
    },
    {
      thought: 'CQRS and the "read-only queries may skip a layer" loose-layering guidance are unrelated ideas that happen to both involve reads and writes.',
      reality: 'Per this subtopic\'s theory, they express the same underlying insight at different levels of formality — CQRS makes the read/write asymmetry a first-class, explicit architectural split, while loose layering\'s "reads may skip, writes may not" is a lighter-weight, informal version of that same idea applied within a single layered codebase.'
    }
  ];
}
