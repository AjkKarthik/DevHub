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
  templateUrl: './what-a-ddd-factory-actually-looks-like.html',
  styleUrl: './what-a-ddd-factory-actually-looks-like.scss'
})
export class WhatADddFactoryActuallyLooksLikeSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The QnA/quiz describe factories but never show one',
      points: [
        'The page\'s quiz explains a DDD factory as "an object or method responsible for creating complex aggregates or domain objects, encapsulating construction logic and ensuring invariants are met on creation" — but no codeTab anywhere on the page demonstrates one, and the page\'s own <code>BankAccount</code>/<code>Order</code> examples are all constructed with plain, direct constructors.',
        'The core motivating problem: a constructor can only do so much validation — it can check the arguments IT receives, but it can\'t easily coordinate MULTIPLE steps, look up related data, or enforce an invariant that depends on something outside the object being constructed. A factory absorbs that complexity so the constructor (or the aggregate itself) can stay simple.',
        'A factory doesn\'t have to be a separate class — it can be a static method on the aggregate itself (as this page\'s own <code>Order.create()</code> examples already do in a SIMPLE form) or a dedicated factory class when construction genuinely needs its own dependencies (a repository lookup, an ID generator, external validation).',
      ]
    },
    {
      heading: 'A factory becomes necessary once construction needs more than the constructor can cleanly do',
      points: [
        'For the page\'s own <code>BankAccount</code> Challenge: a simple constructor is genuinely sufficient (an initial balance and an ID are all it needs). But consider a slightly richer requirement — a NEW account must start with a referral bonus IF the customer was referred by an existing customer, which requires looking up whether a referral code is valid. That lookup doesn\'t belong inside a constructor (constructors shouldn\'t do I/O), which is exactly the kind of situation a dedicated factory exists for.',
        'The factory\'s job is to guarantee that whatever object it returns is ALREADY fully valid and consistent — by the time calling code has a <code>BankAccount</code> instance in hand, every invariant (including ones that needed external data to check) has already been satisfied, so no code anywhere else in the system needs to re-verify basic construction-time correctness.',
        'This connects to the page\'s own aggregate root discipline: just as an Aggregate Root controls all MODIFICATION after creation, a factory is what controls CREATION — the same underlying principle (centralize control of a specific concern in one place, don\'t scatter it) applied to a different lifecycle stage.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'When a plain constructor is enough, and when a factory takes over',
      language: 'typescript',
      code: `// A plain constructor is genuinely fine here -- no external lookups needed,
// every invariant is checkable from the arguments alone:
class BankAccount {
  private constructor(readonly id: string, private _balance: Money) {}

  static open(id: string, initialDeposit: Money): BankAccount {
    if (initialDeposit.amount < 0) throw new Error('Initial deposit cannot be negative');
    return new BankAccount(id, initialDeposit);
  }
  // ...credit()/debit() as elsewhere on this page
}

// A DEDICATED FACTORY becomes worthwhile once construction needs
// something a constructor shouldn't be doing itself -- here, checking
// whether a referral code is valid requires a repository lookup:
class AccountOpeningFactory {
  constructor(
    private referralRepo: IReferralRepository,
    private idGenerator: IIdGenerator,
  ) {}

  async openWithOptionalReferral(
    customerId: string,
    initialDeposit: Money,
    referralCode?: string,
  ): Promise<BankAccount> {
    let bonus = Money.zero(initialDeposit.currency);

    if (referralCode) {
      const referral = await this.referralRepo.findByCode(referralCode);
      if (referral && referral.isValid()) {
        bonus = new Money(25, initialDeposit.currency); // referral bonus
      }
      // an INVALID referral code is not itself an error -- it's just
      // ignored, no bonus applied. That business rule lives HERE,
      // in the factory, not scattered across every caller.
    }

    const accountId = this.idGenerator.next();
    const account = BankAccount.open(accountId, initialDeposit.add(bonus));

    // By the time this returns, the account is FULLY valid -- callers
    // never need to separately check "did the referral bonus apply?"
    return account;
  }
}`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A teammate argues that the referral bonus lookup could just happen inside BankAccount\'s own constructor instead of a separate factory, keeping everything in one place. What\'s the problem with putting an async repository lookup inside a constructor?',
    hint: 'Can a constructor be async? What does that constrain about what kind of work it can safely do?',
    solution: 'Constructors cannot be async (in TypeScript/JavaScript, and in most mainstream OOP languages) -- they must return synchronously and cannot be awaited. A repository lookup (referralRepo.findByCode()) is inherently asynchronous I/O, which cannot happen inside a constructor at all without resorting to awkward workarounds (fire-and-forget calls with no way to wait for the result, or a two-phase "construct then hydrate" pattern that defeats the point of guaranteeing valid construction). A factory method, by contrast, can freely be async -- it does the asynchronous work FIRST, then calls the synchronous constructor only once it has everything needed, which is exactly the separation of concerns a factory is meant to provide.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'A DDD Factory is always a separate class, distinct from the static create() methods this page\'s own Order examples already use.',
      reality: 'Per this subtopic\'s theory, a factory can be as simple as a static method on the aggregate itself — a dedicated factory CLASS becomes worthwhile specifically when construction needs its own external dependencies (repositories, ID generators), not as a universal requirement.'
    },
    {
      thought: 'Since constructors can validate their own arguments, adding a separate factory is usually unnecessary extra complexity.',
      reality: 'Per this subtopic\'s theory, a factory becomes genuinely necessary once construction needs something a constructor structurally cannot do — most commonly, asynchronous I/O like a repository lookup, which constructors cannot perform at all.'
    },
    {
      thought: 'A factory\'s job is just to reduce constructor argument boilerplate.',
      reality: 'Per this subtopic\'s theory, a factory\'s actual job is guaranteeing that whatever object it returns is already fully valid and consistent — including invariants that depend on external data unavailable at simple construction time — not merely convenience.'
    }
  ];
}
