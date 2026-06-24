import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PageMetaComponent } from '../../../shared/page-meta/page-meta';
import { QuickRefComponent, QuickRefItem } from '../../../shared/quick-ref/quick-ref';
import { TheoryBlockComponent, TheoryPoint } from '../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../shared/code-block/code-block';
import { CommonMistakesComponent, CommonMistake } from '../../../shared/common-mistakes/common-mistakes';
import { ChallengeBlockComponent, Challenge } from '../../../shared/challenge-block/challenge-block';
import { QuizBlockComponent, QuizQuestion } from '../../../shared/quiz-block/quiz-block';
import { QnaBlockComponent, QnaItem } from '../../../shared/qna-block/qna-block';
import { RevisionCardComponent, RevisionSummary } from '../../../shared/revision-card/revision-card';
import { PageCompleteComponent } from '../../../shared/page-complete/page-complete';

@Component({
  selector: 'app-arch-ddd-core',
  standalone: true,
  imports: [CommonModule, PageMetaComponent, QuickRefComponent, TheoryBlockComponent,
    CodeBlockComponent, CommonMistakesComponent, ChallengeBlockComponent, QuizBlockComponent,
    QnaBlockComponent, RevisionCardComponent, PageCompleteComponent],
  templateUrl: './ddd-core.html',
  styleUrl: './ddd-core.scss',
})
export class ArchDddCore {

  quickRef: QuickRefItem[] = [
    { name: 'Ubiquitous Language', type: 'keyword', desc: 'Shared vocabulary between developers and domain experts — the same words in code and conversation' },
    { name: 'Bounded Context', type: 'keyword', desc: 'Explicit boundary within which a model and language apply — Order means different things in Sales vs Shipping' },
    { name: 'Entity', type: 'keyword', desc: 'Object with a unique identity that persists over time — Order, Customer, Product' },
    { name: 'Value Object', type: 'keyword', desc: 'Immutable object defined by its attributes, not identity — Money, Address, DateRange' },
    { name: 'Aggregate', type: 'keyword', desc: 'Cluster of entities and value objects with one Aggregate Root controlling all access' },
    { name: 'Aggregate Root', type: 'keyword', desc: 'The single entity in an aggregate through which all external interactions must go' },
    { name: 'Domain Event', type: 'keyword', desc: 'Something that happened in the domain — OrderPlaced, PaymentFailed — raised by the aggregate' },
  ];

  theory: TheoryPoint[] = [
    {
      heading: 'Strategic DDD — the Big Picture',
      points: [
        'Domain-Driven Design (Eric Evans, 2003) centres on modelling complex business domains in software.',
        'Strategic DDD: identify bounded contexts, define context maps, establish a ubiquitous language per context.',
        'Ubiquitous language: every concept has one name agreed between developers and domain experts. "Order" in code = "Order" in conversation = "Order" in tests.',
        'Bounded contexts prevent one model from trying to mean everything to everyone — a Product in the Catalog context is different from a Product in the Warehouse context.',
      ],
    },
    {
      heading: 'Tactical DDD — Building Blocks',
      points: [
        'Entity: has a unique ID and lifecycle. Two Orders with the same ID are the same Order regardless of other attributes.',
        'Value Object: no identity; equality by value. Money(100, USD) equals Money(100, USD). Immutable — create new instances instead of mutating.',
        'Aggregate: a cluster of entities and value objects treated as a unit. One aggregate root controls all modifications.',
        'Only the aggregate root can be referenced from outside the aggregate. Internal entities are not directly accessible.',
        'Keep aggregates small — one or two entities plus value objects. Large aggregates cause contention.',
      ],
    },
    {
      heading: 'Domain Services and Domain Events',
      points: [
        'Domain Service: logic that does not naturally belong to one entity — TransferFunds(from, to, amount) spans two Account entities.',
        'Domain Event: an event raised by the aggregate to communicate what happened — "OrderConfirmed" is raised when Order.confirm() succeeds.',
        'Events are raised within the aggregate and published after the transaction commits.',
        'DDD is not a silver bullet: apply it to the Core Domain (highest business value, most complex rules). Use simpler patterns for Supporting and Generic subdomains.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Entity vs Value Object',
      language: 'typescript',
      code: `// ENTITY — identity-based equality
class Order {
  constructor(
    public readonly id: string,   // unique ID — this is what makes it an entity
    public readonly customerId: string,
    private _status: 'draft' | 'confirmed' | 'shipped' = 'draft',
    private _lines: OrderLine[] = [],
  ) {}

  get status() { return this._status; }
  get lines()  { return [...this._lines]; }

  addLine(product: ProductId, qty: number, price: Money): void {
    if (this._status !== 'draft') throw new Error('Cannot modify confirmed order');
    this._lines.push(new OrderLine(product, qty, price));
  }

  // Two orders with the same ID are the same regardless of other fields
  equals(other: Order): boolean { return this.id === other.id; }
}

// VALUE OBJECT — value-based equality, immutable
class Money {
  constructor(
    public readonly amount: number,
    public readonly currency: string,
  ) {
    if (amount < 0) throw new Error('Money cannot be negative');
  }

  add(other: Money): Money {
    if (other.currency !== this.currency) throw new Error('Currency mismatch');
    return new Money(this.amount + other.amount, this.currency);  // new instance!
  }

  equals(other: Money): boolean {
    return this.amount === other.amount && this.currency === other.currency;
  }

  static zero(currency = 'USD'): Money { return new Money(0, currency); }
}`
    },
    {
      label: 'Aggregate Root Pattern',
      language: 'typescript',
      code: `// AGGREGATE: Order (root) + OrderLine (internal entity)
// OrderLine cannot be accessed or modified from outside — only through Order

class OrderLine {
  constructor(
    public readonly productId: string,
    public readonly qty: number,
    public readonly unitPrice: Money,
  ) {}

  get lineTotal(): Money {
    return new Money(this.unitPrice.amount * this.qty, this.unitPrice.currency);
  }
}

class Order {
  private readonly _lines: OrderLine[] = [];
  private _status: 'draft' | 'confirmed' = 'draft';
  private _domainEvents: DomainEvent[] = [];

  constructor(public readonly id: string, public readonly customerId: string) {}

  // All modifications go through the aggregate root
  addLine(productId: string, qty: number, price: Money): void {
    if (this._status !== 'draft') throw new Error('Cannot modify confirmed order');
    if (qty <= 0) throw new Error('Quantity must be positive');
    this._lines.push(new OrderLine(productId, qty, price));
  }

  confirm(): void {
    if (this._lines.length === 0) throw new Error('Order must have at least one line');
    this._status = 'confirmed';
    this._domainEvents.push(new OrderConfirmedEvent(this.id, this.total));
  }

  get total(): Money {
    return this._lines.reduce((sum, l) => sum.add(l.lineTotal), Money.zero());
  }

  get domainEvents(): DomainEvent[] { return [...this._domainEvents]; }
  clearEvents(): void { this._domainEvents = []; }
}`
    },
    {
      label: 'Domain Service',
      language: 'typescript',
      code: `// DOMAIN SERVICE — business logic spanning multiple aggregates
// TransferFunds does not belong to Account — it coordinates two accounts

class TransferFundsService {
  constructor(
    private accountRepo: IAccountRepository,
    private events: IDomainEventBus,
  ) {}

  async transfer(fromId: string, toId: string, amount: Money): Promise<void> {
    const [from, to] = await Promise.all([
      this.accountRepo.findById(fromId),
      this.accountRepo.findById(toId),
    ]);

    if (!from || !to) throw new Error('Account not found');

    // Each aggregate enforces its own invariants
    from.debit(amount);  // throws if insufficient funds
    to.credit(amount);

    await this.accountRepo.save(from);
    await this.accountRepo.save(to);

    // Publish domain events from both aggregates
    this.events.publishAll([...from.domainEvents, ...to.domainEvents]);
    from.clearEvents();
    to.clearEvents();
  }
}`
    },
  ];

  mistakes: CommonMistake[] = [
    {
      title: 'Treating every noun as an entity',
      wrong: `// Address, Money, DateRange modelled as entities with IDs`,
      right: `// Address, Money, DateRange are value objects — equality by value, no identity needed`,
      explanation: 'Value objects are immutable and equality-by-value. Using entities for them adds unnecessary ID management and lifecycle overhead.',
    },
    {
      title: 'Large aggregates causing contention',
      wrong: `// CustomerAggregate contains Customer + all Orders + all Addresses + Wishlist`,
      right: `// CustomerAggregate: just Customer. OrderAggregate: just Order + Lines. Separate bounded contexts.`,
      explanation: 'Large aggregates load and lock too much data. Concurrent modifications to different parts cause transaction conflicts. Keep aggregates focused on one invariant.',
    },
    {
      title: 'Accessing internal aggregate entities from outside',
      wrong: `const line = order.lines[0]; line.qty = 5; // mutating internal entity directly`,
      right: `order.updateLineQty(lineId, 5); // going through the aggregate root`,
      explanation: 'External code bypassing the aggregate root breaks invariant enforcement. The root must control all changes to maintain consistency.',
    },
    {
      title: 'Applying DDD everywhere regardless of domain complexity',
      wrong: `// Simple user profile CRUD page modelled with aggregates, domain events, value objects`,
      right: `// Apply DDD to the Core Domain only; use CRUD patterns for simple subdomains`,
      explanation: 'DDD overhead (aggregates, domain services, events) is justified for complex business logic. Simple CRUD screens do not benefit and become unnecessarily complex.',
    },
  ];

  challenge: Challenge = {
    title: 'Model a BankAccount Aggregate',
    language: 'typescript',
    description: `Design a BankAccount aggregate with these rules:
1. Cannot debit more than the current balance (overdraft not allowed).
2. Minimum balance after debit is 0.
3. Deposits must be positive.
4. Raise a domain event on each successful debit and credit.
5. Balance is a Money value object.`,
    hints: [
      'BankAccount is the aggregate root — holds balance as Money',
      'debit() checks balance >= amount before reducing',
      'credit() checks amount > 0 before adding',
      'Domain events: FundsDebited, FundsCredited — raised on each successful operation',
    ],
    starterCode: `class Money {
  constructor(readonly amount: number, readonly currency: string) {
    if (amount < 0) throw new Error('Money cannot be negative');
  }
  add(other: Money): Money { return new Money(this.amount + other.amount, this.currency); }
  subtract(other: Money): Money { return new Money(this.amount - other.amount, this.currency); }
  isGreaterThanOrEqual(other: Money): boolean { return this.amount >= other.amount; }
}

// TODO: BankAccount aggregate root
class BankAccount {
  private _balance: Money;
  readonly domainEvents: object[] = [];
  constructor(readonly id: string, initialBalance: Money) {
    this._balance = initialBalance;
  }
  // TODO: credit(amount: Money): void
  // TODO: debit(amount: Money): void
  get balance() { return this._balance; }
}`,
    solution: `class Money {
  constructor(readonly amount: number, readonly currency: string) {
    if (amount < 0) throw new Error('Money cannot be negative');
  }
  add(other: Money): Money { return new Money(this.amount + other.amount, this.currency); }
  subtract(other: Money): Money { return new Money(this.amount - other.amount, this.currency); }
  isGreaterThanOrEqual(other: Money): boolean { return this.amount >= other.amount; }
}

class BankAccount {
  private _balance: Money;
  readonly domainEvents: object[] = [];

  constructor(readonly id: string, initialBalance: Money) {
    this._balance = initialBalance;
  }

  credit(amount: Money): void {
    if (amount.amount <= 0) throw new Error('Deposit must be positive');
    this._balance = this._balance.add(amount);
    this.domainEvents.push({ type: 'FundsCredited', accountId: this.id, amount: amount.amount });
  }

  debit(amount: Money): void {
    if (!this._balance.isGreaterThanOrEqual(amount)) {
      throw new Error('Insufficient funds');
    }
    this._balance = this._balance.subtract(amount);
    this.domainEvents.push({ type: 'FundsDebited', accountId: this.id, amount: amount.amount });
  }

  get balance() { return this._balance; }
}

const account = new BankAccount('acc-1', new Money(100, 'USD'));
account.credit(new Money(50, 'USD'));  // balance: 150
account.debit(new Money(30, 'USD'));   // balance: 120
console.log(account.balance.amount);  // 120
console.log(account.domainEvents);    // [{FundsCredited}, {FundsDebited}]
try { account.debit(new Money(200, 'USD')); } // throws: Insufficient funds
catch(e) { console.error((e as Error).message); }`,
  };

  quiz: QuizQuestion[] = [
    {
      q: 'What is the key difference between an Entity and a Value Object?',
      options: [
        'Entities are stored in the database; value objects are not',
        'Entities have unique identity; value objects have equality by value and are immutable',
        'Entities are immutable; value objects can be mutated',
        'Value objects have IDs; entities do not',
      ],
      answer: 1,
      explanation: 'Entity: unique ID, mutable lifecycle. Value Object: no ID, immutable, equality by all attributes.',
    },
    {
      q: 'Who controls access to an Aggregate\'s internal entities?',
      options: [
        'The repository',
        'The database',
        'The Aggregate Root',
        'The application service',
      ],
      answer: 2,
      explanation: 'The Aggregate Root is the single entry point. External code may only reference and interact with the root — never internal entities directly.',
    },
    {
      q: 'What is Ubiquitous Language?',
      options: [
        'A programming language for domain modelling',
        'A shared vocabulary agreed between developers and domain experts, used consistently in code and conversation',
        'A database query language',
        'A microservices communication protocol',
      ],
      answer: 1,
      explanation: 'Ubiquitous Language: one name per concept, shared between the business and engineering. The same term in code, tests, and domain expert conversations.',
    },
  ];

  qna: QnaItem[] = [
    {
      q: 'What are the three types of subdomains in DDD?',
      a: 'Core Domain: the heart of the business, highest competitive value, most complex — apply full DDD here. Supporting Subdomain: important but not differentiating — simpler modelling is fine. Generic Subdomain: commodity functionality (email, auth, payments) — buy it off the shelf.',
    },
    {
      q: 'Can a Value Object contain an Entity?',
      a: 'No. A value object is immutable and equality-by-value. Containing an entity (which has mutable state and an ID) would violate both properties. Value objects can contain other value objects or primitives only.',
    },
    {
      q: 'When should you use a Domain Service vs putting logic in an Entity?',
      a: 'Put logic in the entity if it involves only that entity\'s state (Order.confirm()). Use a Domain Service when the operation involves multiple aggregates (TransferFunds spans two Accounts) or when it requires infrastructure that aggregates should not know about.',
    },
  ];

  revision: RevisionSummary = {
    oneLiner: 'DDD models complex business domains with a ubiquitous language, bounded contexts, rich entities, immutable value objects, and aggregates enforcing invariants.',
    mustKnow: [
      'Entity: unique ID, mutable state, identity-based equality',
      'Value Object: immutable, equality by all attributes, no identity',
      'Aggregate Root: single entry point; controls all modifications to internal entities',
      'Ubiquitous Language: one term per concept, shared code-and-business vocabulary',
      'Apply DDD to Core Domain; use CRUD for Simple and Generic subdomains',
    ],
    interviewFocus: [
      'Explain Entity vs Value Object with a concrete example',
      'Why must all aggregate access go through the Aggregate Root?',
      'What is a Domain Service and when do you use one?',
    ],
  };
}
