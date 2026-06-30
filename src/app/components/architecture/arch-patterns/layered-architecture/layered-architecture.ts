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
  selector: 'app-arch-layered-architecture',
  standalone: true,
  imports: [CommonModule, PageMetaComponent, QuickRefComponent, TheoryBlockComponent,
    CodeBlockComponent, CommonMistakesComponent, ChallengeBlockComponent, QuizBlockComponent,
    QnaBlockComponent, RevisionCardComponent, PageCompleteComponent],
  templateUrl: './layered-architecture.html',
  styleUrl: './layered-architecture.scss',
})
export class ArchLayeredArchitecture {

  quickRef: QuickRefItem[] = [
    { name: 'Presentation Layer', type: 'keyword', desc: 'Handles HTTP, CLI or UI — no business logic' },
    { name: 'Application Layer', type: 'keyword', desc: 'Orchestrates use cases; calls domain and infrastructure' },
    { name: 'Domain Layer', type: 'keyword', desc: 'Business rules, entities, value objects — zero external deps' },
    { name: 'Infrastructure Layer', type: 'keyword', desc: 'Database, file system, external APIs — implements domain interfaces' },
    { name: 'Strict Layering', type: 'keyword', desc: 'Each layer may only depend on the layer directly below it' },
    { name: 'Loose Layering', type: 'keyword', desc: 'Upper layers may skip one layer and call deeper layers directly' },
    { name: 'Anemic Domain Model', type: 'keyword', desc: 'Entities with no behaviour — all logic lives in Services (anti-pattern)' },
  ];

  theory: TheoryPoint[] = [
    {
      heading: 'The Four-Layer Model',
      points: [
        'Presentation → Application → Domain → Infrastructure is the classic enterprise layering.',
        'Dependency direction: each layer knows about the layer below, never the layer above.',
        'The Application layer coordinates: it receives a command from Presentation, calls domain logic, then persists via Infrastructure.',
        'This separation keeps HTTP concerns out of business rules and database concerns out of domain models.',
      ],
    },
    {
      heading: 'Strict vs Loose Layering',
      points: [
        'Strict: Presentation → Application only. Application → Domain only. Domain → nothing.',
        'Loose: Presentation may call Domain directly for read-only queries (skipping Application).',
        'Strict layering is safer and easier to reason about; loose layering trades rigor for brevity on simple reads.',
        'Most .NET/Java enterprise codebases use loose layering in practice, even if the intent was strict.',
      ],
    },
    {
      heading: 'The Anemic Domain Model Anti-Pattern',
      points: [
        'Anemic model: domain entities are pure data bags; all business logic lives in Service classes.',
        'This is effectively procedural programming wearing an OOP costume.',
        'Rich domain model: entities encapsulate their own invariants and behaviour (e.g., Order.addLine() validates itself).',
        'Layered architecture does not force anemia — it arises from habit. Push behaviour into the domain.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Layer Structure',
      language: 'bash',
      code: `src/
  Presentation/        # Controllers, DTOs, filters
    OrdersController.ts
    OrderDto.ts
  Application/         # Use-case handlers, command/query objects
    PlaceOrderHandler.ts
    PlaceOrderCommand.ts
  Domain/              # Rich entities, value objects, domain interfaces
    Order.ts           # contains addLine(), confirm() etc.
    IOrderRepository.ts
    Money.ts
  Infrastructure/      # Repository impl, DB context, HTTP clients
    OrderRepository.ts
    AppDbContext.ts`
    },
    {
      label: 'Rich Domain Entity',
      language: 'typescript',
      code: `// Domain/Order.ts — behaviour inside the entity
export class Order {
  private lines: OrderLine[] = [];
  private status: 'draft' | 'confirmed' = 'draft';

  addLine(product: ProductId, qty: number, price: Money): void {
    if (this.status !== 'draft') throw new Error('Cannot modify confirmed order');
    if (qty <= 0) throw new Error('Quantity must be positive');
    this.lines.push(new OrderLine(product, qty, price));
  }

  confirm(): void {
    if (this.lines.length === 0) throw new Error('Order has no lines');
    this.status = 'confirmed';
  }

  get total(): Money {
    return this.lines.reduce((sum, l) => sum.add(l.lineTotal), Money.zero());
  }
}`
    },
    {
      label: 'Application Layer Handler',
      language: 'typescript',
      code: `// Application/PlaceOrderHandler.ts — orchestrates, no business logic
export class PlaceOrderHandler {
  constructor(
    private orders: IOrderRepository,
    private catalog: ICatalogService,
  ) {}

  async handle(cmd: PlaceOrderCommand): Promise<string> {
    const order = new Order(cmd.customerId);

    for (const line of cmd.lines) {
      const price = await this.catalog.getPrice(line.productId);
      order.addLine(line.productId, line.qty, price); // domain validates
    }

    order.confirm();
    await this.orders.save(order);
    return order.id;
  }
}`
    },
  ];

  mistakes: CommonMistake[] = [
    {
      title: 'Business logic in the Presentation layer',
      wrong: `// Controller deciding business rules
if (order.total > 1000 && customer.isVip) { discount = 0.1; }`,
      right: `// Domain entity or Application service owns the rule
order.applyVipDiscount(customer);`,
      explanation: 'Presentation logic is coupled to the HTTP framework. Business rules there cannot be reused, tested in isolation, or found easily.',
    },
    {
      title: 'Domain layer importing infrastructure',
      wrong: `import { SqlOrderRepository } from '../../Infrastructure/OrderRepository';`,
      right: `// Domain defines interface; Infrastructure implements it
import { IOrderRepository } from '../Domain/IOrderRepository';`,
      explanation: 'Domain importing Infrastructure inverts the dependency direction and makes domain tests require a database.',
    },
    {
      title: 'Anemic entities with fat service classes',
      wrong: `class OrderService { calculateTotal(order) { ... } validate(order) { ... } }`,
      right: `class Order { get total() { ... } confirm() { this.validate(); ... } }`,
      explanation: 'Behaviour outside the entity leads to a service class that duplicates state management and grows without bound.',
    },
    {
      title: 'Returning domain entities from the Presentation layer',
      wrong: `return order; // returns domain entity to HTTP response`,
      right: `return OrderDto.from(order); // maps to DTO at the controller`,
      explanation: 'Leaking domain entities to API responses couples your wire format to internal model changes and can expose sensitive fields.',
    },
  ];

  challenge: Challenge = {
    title: 'Refactor an Anemic Model to a Rich Domain Model',
    language: 'typescript',
    description: `Given the anemic Order class and fat OrderService below, move the business logic into the Order entity.
Ensure Order.confirm() validates that the order has lines before confirming.
The Application layer handler should only orchestrate — no business rules.`,
    hints: [
      'Move addLine() and confirm() into the Order class',
      'OrderService becomes thin — just coordinates persistence',
      'Domain invariants: no empty orders, qty > 0, status transition valid',
    ],
    starterCode: `// ANEMIC — refactor this:
class Order { id: string; lines: any[]; status: string; }

class OrderService {
  addLine(order: Order, product: string, qty: number) {
    if (qty <= 0) throw new Error('qty must be positive');
    order.lines.push({ product, qty });
  }
  confirm(order: Order) {
    if (order.lines.length === 0) throw new Error('empty');
    order.status = 'confirmed';
  }
}`,
    solution: `// RICH DOMAIN MODEL:
class Order {
  private _lines: OrderLine[] = [];
  private _status: 'draft' | 'confirmed' = 'draft';
  readonly id: string;

  constructor(id: string) { this.id = id; }

  addLine(product: string, qty: number): void {
    if (this._status !== 'draft') throw new Error('Cannot modify confirmed order');
    if (qty <= 0) throw new Error('qty must be positive');
    this._lines.push({ product, qty });
  }

  confirm(): void {
    if (this._lines.length === 0) throw new Error('Order has no lines');
    this._status = 'confirmed';
  }

  get lines() { return [...this._lines]; }
  get status() { return this._status; }
}

// Application handler — only orchestrates:
class PlaceOrderHandler {
  async handle(cmd: PlaceOrderCommand): Promise<void> {
    const order = new Order(generateId());
    for (const l of cmd.lines) order.addLine(l.product, l.qty);
    order.confirm();
    await this.repo.save(order);
  }
}`,
  };

  quiz: QuizQuestion[] = [
    {
      q: 'In strict layered architecture, which dependency is correct?',
      options: [
        'Domain depends on Infrastructure',
        'Application depends on Presentation',
        'Presentation depends on Application',
        'Infrastructure depends on Domain',
      ],
      answer: 2,
      explanation: 'Dependencies flow downward: Presentation → Application → Domain. Infrastructure implements Domain interfaces (dependency inversion).',
    },
    {
      q: 'What is an Anemic Domain Model?',
      options: [
        'A model with too many layers',
        'Entities that are data bags with all logic in Service classes',
        'A model that has no DTO mapping',
        'A model with strict typing',
      ],
      answer: 1,
      explanation: 'Anemic entities contain only fields; services contain all behaviour. This is effectively procedural code.',
    },
    {
      q: 'Where should DTO-to-Domain mapping occur?',
      options: [
        'Infrastructure layer',
        'Domain layer',
        'Presentation/Application boundary (controller or handler)',
        'Database migration scripts',
      ],
      answer: 2,
      explanation: 'Map from HTTP DTO to command/domain objects at the controller or application handler entry point, keeping domain objects clean.',
    },
    { q: 'What are the typical layers in a traditional layered architecture and what does each do?', options: ['Frontend, Backend, Database, Cache', 'Presentation, Business Logic, Data Access, Database', 'API, Service, Repository, ORM', 'Controllers, Services, Models, Views'], answer: 1, explanation: 'Classic four-layer architecture: Presentation (UI and API controllers) handles user interaction and request/response formatting. Business Logic (service layer) implements business rules and orchestrates domain operations. Data Access (repository or DAO layer) abstracts persistence, handling SQL queries and ORM interactions. Database (infrastructure) stores the data. Dependencies flow downward: presentation depends on business logic, business logic depends on data access. This separation of concerns allows each layer to be understood and modified independently.' },
    { q: 'What is the main criticism of traditional layered architecture in enterprise applications?', options: ['Layers add unnecessary complexity for small applications', 'Business logic tends to leak into the presentation and data access layers, and the database dependency flows through every layer, making the core logic difficult to test', 'Layered architecture cannot support multiple types of clients', 'Each layer requires separate deployment, making operations complex'], answer: 1, explanation: 'Critique: in practice, business logic often leaks into controllers (presentation) and repositories (data access), violating layer separation. The database, at the bottom, is depended upon by the business logic layer directly, making unit testing require a real database. Fat services accumulate business logic that does not belong to them. The data model (ORM entities) often bleeds through all layers as a shared model, coupling everything to the database schema. These issues led to Clean Architecture, Hexagonal Architecture, and other patterns that invert the database dependency direction.' },
    { q: 'When is a layered architecture still the right choice?', options: ['Layered architecture is never the right choice in modern software', 'For small to medium CRUD applications where the team understands the pattern, requirements are stable, and the overhead of more sophisticated patterns is not justified', 'Only for monolithic applications; never for microservices', 'Only when using ORM frameworks that enforce layered patterns'], answer: 1, explanation: 'Layered architecture remains appropriate when: the application is a standard CRUD system with limited business complexity; the team is familiar with the pattern and productivity is more important than architectural purity; the project is small enough that the overhead of ports and adapters or clean architecture is unnecessary; the database is stable and unlikely to change. Most enterprise applications are built with a layered pattern because it is simple, widely understood, and sufficient for the problem. Avoid over-engineering with more complex patterns until the business logic complexity justifies the added structure.' },
  ];

  qna: QnaItem[] = [
    {
      q: 'Is layered architecture the same as Clean Architecture?',
      a: 'No. Layered architecture often allows Infrastructure to be the bottom layer that Domain depends on. Clean Architecture inverts this: Domain has zero dependencies; Infrastructure depends on Domain interfaces.',
    },
    {
      q: 'When does layered architecture break down?',
      a: 'When teams grow large and every feature touches every layer simultaneously (merge conflicts), or when performance demands read-specific paths that skip the domain entirely. CQRS and Vertical Slice solve these pain points.',
    },
    {
      q: 'Should each layer be a separate project/assembly?',
      a: 'For large systems yes — project boundaries enforce the dependency rules at compile time. For small teams a single project with disciplined folder structure and linting rules is fine.',
    },
    { q: 'What is the difference between strict and relaxed layered architectures?', a: 'Strict layered architecture: each layer may only call the layer directly below it. The presentation layer calls the business logic layer; business logic calls data access; data access interacts with the database. No layer may skip layers. This enforces clean separation but can require unnecessary pass-through methods in intermediate layers. Relaxed layered architecture: layers may call any lower layer, not just the one immediately below. A controller can call the data access layer directly for simple queries without going through a service. More pragmatic and common in practice. Both approaches are valid; choose based on the team convention and the value of the separation versus the overhead of enforcing it.' },
    { q: 'How do you prevent the anemic domain model anti-pattern in a layered architecture?', a: 'An anemic domain model has entities that are just data bags (plain getters and setters with no behavior) and service classes that contain all the business logic. This is a violation of object-oriented principles where objects should encapsulate both data and behavior. Prevention: put business logic that relates to an entity directly in the entity class. An Order entity should have an addItem method that enforces the business rule, not a service that gets the order, checks rules externally, and saves it back. Services should orchestrate domain objects rather than containing domain logic. Rich domain models with behavior are easier to understand, test, and maintain than scattered service-layer procedural code.' },
    { q: 'How do you gradually migrate from a layered monolith to a cleaner architecture?', a: 'Migration without a big-bang rewrite: start with the most problematic area (highest bug rate, hardest to test, most coupling). Extract interfaces for its data access layer so the business logic no longer depends directly on ORM classes. Write unit tests for the business logic using mock repositories. Refactor business logic out of controllers into dedicated services or use case classes. Repeat for the next area. Apply the Strangler Fig pattern for new features: build new features using the cleaner architecture alongside legacy code. Establish coding standards that enforce the new approach for all new code. Over time, old code is replaced during bug fixes and feature work rather than a dedicated migration effort.' },
  ];

  revision: RevisionSummary = {
    oneLiner: 'Layered architecture separates concerns into Presentation, Application, Domain, and Infrastructure with dependencies flowing only downward.',
    mustKnow: [
      'Four layers: Presentation → Application → Domain → Infrastructure',
      'Domain layer has zero external dependencies',
      'Infrastructure implements Domain interfaces (dependency inversion)',
      'Anemic model anti-pattern: entities as data bags, logic in services',
      'Rich model: entities own their invariants and behaviour',
    ],
    interviewFocus: [
      'Draw and explain the four layers and their dependencies',
      'What is an Anemic Domain Model and why is it a problem?',
      'How does Layered differ from Clean Architecture?',
    ],
  };
}
