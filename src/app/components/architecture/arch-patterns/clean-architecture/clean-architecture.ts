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
  selector: 'app-arch-clean-architecture',
  standalone: true,
  imports: [CommonModule, PageMetaComponent, QuickRefComponent, TheoryBlockComponent,
    CodeBlockComponent, CommonMistakesComponent, ChallengeBlockComponent, QuizBlockComponent,
    QnaBlockComponent, RevisionCardComponent, PageCompleteComponent],
  templateUrl: './clean-architecture.html',
  styleUrl: './clean-architecture.scss',
})
export class ArchCleanArchitecture {

  quickRef: QuickRefItem[] = [
    { name: 'Dependency Rule', type: 'keyword', desc: 'Source code dependencies point INWARD only — never outward' },
    { name: 'Entities', type: 'keyword', desc: 'Innermost ring: enterprise-wide business rules and domain objects' },
    { name: 'Use Cases', type: 'keyword', desc: 'Application-specific business rules that orchestrate entities' },
    { name: 'Interface Adapters', type: 'keyword', desc: 'Controllers, presenters, gateways — convert formats between use cases and external systems' },
    { name: 'Frameworks & Drivers', type: 'keyword', desc: 'Outermost ring: DB, web framework, UI — plugins to the application' },
    { name: 'Dependency Inversion', type: 'keyword', desc: 'High-level modules define interfaces; low-level modules implement them' },
    { name: 'Onion Architecture', type: 'keyword', desc: "Jeffrey Palermo's name for the same concentric-ring pattern" },
  ];

  theory: TheoryPoint[] = [
    {
      heading: 'The Dependency Rule',
      points: [
        'The single rule: source code dependencies point only inward toward higher-level policy.',
        'The inner rings (Entities, Use Cases) know nothing about outer rings (Controllers, Databases, UI).',
        'Outer rings change far more often than inner rings — the rule protects stable policy from volatile detail.',
        'A database is a detail. An HTTP framework is a detail. They are plugins that the application does not depend on.',
      ],
    },
    {
      heading: 'The Four Rings',
      points: [
        'Entities: pure business objects — Order, Customer, Money — with enterprise-wide business rules.',
        'Use Cases: application-specific scenarios — PlaceOrder, CancelSubscription — orchestrating entities.',
        'Interface Adapters: controllers parse HTTP → command; presenters map result → response DTO; repositories implement interfaces.',
        'Frameworks & Drivers: Express.js, Postgres, React — all plug in at the outermost ring. Replaceable.',
      ],
    },
    {
      heading: 'Testability by Design',
      points: [
        'Because Use Cases depend only on interfaces (IOrderRepository), they test with in-memory fakes — no database needed.',
        'Entity unit tests have zero imports from frameworks; they run in milliseconds.',
        'Integration tests wire up real Infrastructure; unit tests are completely isolated.',
        'This is the payoff: a large domain that is tested without spin-up cost.',
      ],
    },
    {
      heading: 'The Dependency Rule as Clean Architecture\'s Core Principle',
      points: [
        'Clean Architecture\'s central rule is that dependencies point INWARD only — outer layers (frameworks, UI, database) depend on inner layers (business rules, entities), and inner layers know nothing about outer layers, which is what keeps core business logic independent of infrastructure choices.',
        'This inverted dependency direction is achieved through interfaces defined in the inner layers and implemented in the outer layers (dependency inversion) — the business logic defines what it needs (a Repository interface), and infrastructure provides a concrete implementation, not the other way around.',
        'Because the core business logic has zero dependency on frameworks or databases, it can be tested in complete isolation with fast, simple unit tests — no database, no web server, no framework bootstrapping required, which is a major practical benefit beyond the architectural elegance.',
        'This independence also means infrastructure decisions (which database, which web framework) can be deferred or changed later with minimal impact on business logic — a genuine, not just theoretical, benefit when infrastructure choices need to evolve over a system\'s lifetime.',
      ],
    },
    {
      heading: 'When Clean Architecture\'s Ceremony Is (and Isn\'t) Worth It',
      points: [
        'Clean Architecture\'s strict layering and interface-based dependency inversion adds real ceremony — more files, more indirection, more upfront design thinking — which pays off for applications with complex business logic expected to outlive any particular framework or database choice.',
        'For a simple CRUD application with minimal business logic, the full ceremony of Clean Architecture\'s layers can add more overhead than value — a simpler layered or even framework-coupled approach may be entirely appropriate when there is little genuine business complexity to protect.',
        'The core benefit — testable, framework-independent business logic — only actually materializes if the team disciplines itself to genuinely keep business logic out of the outer layers; Clean Architecture\'s structure alone does not prevent a determined team from leaking framework concerns inward anyway.',
        'Choosing Clean Architecture (or any similarly rigorous architectural style) should be a deliberate decision based on expected system complexity and lifespan, not applied reflexively to every project regardless of its actual need for that level of architectural rigor.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Ring Structure',
      language: 'bash',
      code: `src/
  Domain/                  # Entities ring — zero dependencies
    Order.ts
    IOrderRepository.ts    # interface defined HERE, not in infra
    Money.ts
  Application/             # Use Cases ring — depends on Domain only
    PlaceOrderUseCase.ts
    PlaceOrderCommand.ts
  Infrastructure/          # Interface Adapters + Frameworks ring
    Persistence/
      SqlOrderRepository.ts   # implements IOrderRepository
      AppDbContext.ts
    Http/
      OrdersController.ts     # adapter: HTTP → use case command
      OrderPresenter.ts       # adapter: result → HTTP response DTO`
    },
    {
      label: 'Use Case (depends only on interfaces)',
      language: 'typescript',
      code: `// Application/PlaceOrderUseCase.ts
// Only depends on Domain interfaces — no DB, no HTTP
export class PlaceOrderUseCase {
  constructor(
    private repo: IOrderRepository,       // Domain interface
    private catalog: ICatalogService,     // Domain interface
    private events: IDomainEventBus,      // Domain interface
  ) {}

  async execute(cmd: PlaceOrderCommand): Promise<PlaceOrderResult> {
    const order = Order.create(cmd.customerId);

    for (const line of cmd.lines) {
      const price = await this.catalog.getPrice(line.productId);
      order.addLine(line.productId, line.qty, price);
    }

    order.confirm();
    await this.repo.save(order);
    this.events.publish(new OrderPlacedEvent(order.id));

    return { orderId: order.id };
  }
}`
    },
    {
      label: 'Infrastructure Adapter',
      language: 'typescript',
      code: `// Infrastructure/Persistence/SqlOrderRepository.ts
// Depends inward on the Domain interface — never vice versa
import { IOrderRepository } from '../../Domain/IOrderRepository';
import { Order } from '../../Domain/Order';

export class SqlOrderRepository implements IOrderRepository {
  constructor(private db: AppDbContext) {}

  async save(order: Order): Promise<void> {
    const record = OrderMapper.toRecord(order); // domain → DB record
    await this.db.orders.upsert(record);
  }

  async findById(id: string): Promise<Order | null> {
    const record = await this.db.orders.findOne({ id });
    return record ? OrderMapper.toDomain(record) : null;
  }
}

// Infrastructure/Http/OrdersController.ts
export class OrdersController {
  constructor(private useCase: PlaceOrderUseCase) {}

  async post(req: Request): Promise<Response> {
    const cmd = PlaceOrderCommand.fromRequest(req.body); // HTTP → command
    const result = await this.useCase.execute(cmd);
    return Response.json({ orderId: result.orderId }, { status: 201 });
  }
}`
    },
  ];

  mistakes: CommonMistake[] = [
    {
      title: 'Placing the repository interface in Infrastructure',
      wrong: `// Infrastructure/IOrderRepository.ts  ← wrong location
export interface IOrderRepository { ... }`,
      right: `// Domain/IOrderRepository.ts  ← interface belongs in Domain
export interface IOrderRepository { ... }`,
      explanation: 'If the interface lives in Infrastructure, Domain must import from Infrastructure to use it — violating the dependency rule.',
    },
    {
      title: 'Use Case importing the concrete repository',
      wrong: `import { SqlOrderRepository } from '../../Infrastructure/Persistence/SqlOrderRepository';`,
      right: `// Use Case constructor receives IOrderRepository — injected at composition root
constructor(private repo: IOrderRepository) {}`,
      explanation: 'Depending on the concrete class ties the use case to a specific database. Dependency injection keeps Use Cases database-agnostic.',
    },
    {
      title: 'Returning domain entities from HTTP controllers',
      wrong: `return Response.json(order); // leaks domain internals`,
      right: `return Response.json(OrderPresenter.toDto(result));`,
      explanation: 'Domain entities are not DTOs. A presenter maps the result to an HTTP-friendly shape without coupling your API surface to domain internals.',
    },
    {
      title: 'Putting business logic in the controller',
      wrong: `if (req.body.qty > stock.available) return 409; // business rule in HTTP adapter`,
      right: `// Use case checks the invariant; controller only maps HTTP status from the error`,
      explanation: 'Controllers are adapters — they translate HTTP to use case input. Business rules belong in Use Cases or Entities.',
    },
  ];

  challenge: Challenge = {
    title: 'Define the Dependency Graph for a Notification Feature',
    language: 'typescript',
    description: `A SendWelcomeEmail use case needs to:
1. Load the user by ID from a database
2. Render the email template
3. Send via an SMTP gateway

Define the Domain interfaces, the Use Case class, and the Infrastructure adapters.
Show the correct import chain — nothing in Domain or Application should import from Infrastructure.`,
    hints: [
      'Domain: IUserRepository, IEmailRenderer, IEmailGateway',
      'Application/UseCase: SendWelcomeEmailUseCase(IUserRepository, IEmailRenderer, IEmailGateway)',
      'Infrastructure: SqlUserRepository, HandlebarsEmailRenderer, SmtpEmailGateway',
      'Composition root: wire concrete impls to interfaces',
    ],
    starterCode: `// Domain interfaces
interface IUserRepository { /* TODO */ }
interface IEmailRenderer  { /* TODO */ }
interface IEmailGateway   { /* TODO */ }

// Application use case
class SendWelcomeEmailUseCase {
  constructor(/* TODO: inject interfaces */) {}
  async execute(userId: string): Promise<void> { /* TODO */ }
}`,
    solution: `// Domain interfaces (zero external deps)
interface IUserRepository {
  findById(id: string): Promise<User | null>;
}
interface IEmailRenderer {
  render(template: string, data: Record<string, string>): string;
}
interface IEmailGateway {
  send(to: string, subject: string, body: string): Promise<void>;
}

// Application use case — depends only on interfaces
class SendWelcomeEmailUseCase {
  constructor(
    private users: IUserRepository,
    private renderer: IEmailRenderer,
    private mailer: IEmailGateway,
  ) {}

  async execute(userId: string): Promise<void> {
    const user = await this.users.findById(userId);
    if (!user) throw new Error('User not found');
    const body = this.renderer.render('welcome', { name: user.name });
    await this.mailer.send(user.email, 'Welcome!', body);
  }
}

// Infrastructure (outermost ring)
class SqlUserRepository implements IUserRepository { ... }
class HandlebarsEmailRenderer implements IEmailRenderer { ... }
class SmtpEmailGateway implements IEmailGateway { ... }

// Composition root wires everything:
const useCase = new SendWelcomeEmailUseCase(
  new SqlUserRepository(db),
  new HandlebarsEmailRenderer(),
  new SmtpEmailGateway(smtpConfig),
);`,
  };

  quiz: QuizQuestion[] = [
    {
      q: 'What does the Dependency Rule state?',
      options: [
        'Outer rings depend on inner rings only',
        'Inner rings depend on outer rings only',
        'All rings depend on each other',
        'Frameworks define the domain model',
      ],
      answer: 0,
      explanation: 'Dependencies point inward: Frameworks → Adapters → Use Cases → Entities. Inner rings are protected from outer ring changes.',
    },
    {
      q: 'Where should a repository interface be defined?',
      options: [
        'Infrastructure layer',
        'Framework layer',
        'Domain layer',
        'Use Case layer',
      ],
      answer: 2,
      explanation: 'The interface is defined in Domain (or Application). Infrastructure implements it. This keeps the dependency rule intact.',
    },
    {
      q: 'What is the primary benefit of Clean Architecture?',
      options: [
        'Faster HTTP responses',
        'Use Cases and Entities testable without any infrastructure',
        'Smaller bundle size',
        'Single deployable unit',
      ],
      answer: 1,
      explanation: 'Because inner rings have no framework or database dependencies, they can be unit-tested with pure in-memory fakes.',
    },
    { q: 'Why does the Dependency Rule still apply to DATA that crosses a layer boundary, even for simple values like a date or a string?', options: ['It does not — only object types with methods are subject to the rule', 'Even simple data passed inward must be in a format the inner layer defines, not a format convenient to the outer layer (e.g. use case input/output models, not framework request/response DTOs), to avoid the inner layer\'s shape being dictated by an outer concern', 'The rule only governs class inheritance, not data passing', 'Primitive types are always exempt from architectural boundaries'], answer: 1, explanation: 'If a use case accepts a framework-specific request object (an ASP.NET Core HttpRequest, an Express req) directly as its input, the use case now indirectly depends on that framework even though no explicit "using" statement imports it — changing web frameworks would still ripple into the use case layer. Clean Architecture requires crossing data to be translated into plain, inner-layer-defined shapes (a use case\'s own Input/Output DTOs) at the boundary, so the inner layer\'s data contracts are dictated by the domain\'s needs, not by whatever framework happens to be calling it.' },
    { q: 'What are the four main layers of Clean Architecture and their responsibilities?', options: ['Controller, Service, Repository, Database', 'Entities, Use Cases, Interface Adapters, Frameworks and Drivers', 'Presentation, Business, Data, Infrastructure', 'Routes, Controllers, Models, Views'], answer: 1, explanation: 'Entities: enterprise-wide business rules and domain objects that are the most stable part of the system. Use Cases: application-specific business rules that orchestrate entity interactions. Interface Adapters: translate between use case data formats and external formats (HTTP controllers, database repository adapters, JSON serializers). Frameworks and Drivers: the outermost layer containing frameworks, databases, UI, and external services. This layer is the most volatile and least stable, so keeping business rules far from it protects them from change.' },
    { q: 'How does Clean Architecture achieve database independence?', options: ['By using an in-memory database for all persistence concerns', 'By defining repository interfaces in the domain layer and implementing them in the infrastructure layer, allowing the database to be swapped without changing business logic', 'By avoiding all persistence and using stateless computation only', 'By using a standardized ORM that works across all database types'], answer: 1, explanation: 'Database independence is achieved through the Repository pattern with dependency inversion. The use case layer defines a repository interface (e.g., IOrderRepository with FindById, Save methods). The infrastructure layer provides the concrete implementation (SqlOrderRepository, MongoOrderRepository). The use case depends only on the interface, not the implementation. Switching from SQL to MongoDB requires only replacing the repository implementation, not changing any use case or entity code. This also enables unit testing use cases with a mock or in-memory repository implementation.' },
  ];

  qna: QnaItem[] = [
    {
      q: 'Is Clean Architecture the same as Onion Architecture?',
      a: 'Very similar — both use concentric rings with inward-pointing dependencies. Clean Architecture (Uncle Bob) uses four rings: Entities, Use Cases, Interface Adapters, Frameworks. Onion Architecture (Palermo) is the same idea with slightly different naming.',
    },
    {
      q: 'Does Clean Architecture require separate assemblies/projects per ring?',
      a: 'No. You can enforce it with linting rules or folder conventions in a single project. Separate assemblies give compile-time enforcement but add build complexity.',
    },
    {
      q: 'When is Clean Architecture overkill?',
      a: 'Small CRUD APIs with no complex business rules do not benefit from the extra mapping overhead. Use a simple layered structure. Clean Architecture pays off when the domain has complex invariants worth protecting from framework churn.',
    },
    { q: 'How does Clean Architecture differ from traditional layered architecture?', a: 'Traditional layered architecture has dependencies flowing downward: UI depends on Business Logic, which depends on Data Access. The database is at the bottom but business logic depends on it. Clean Architecture inverts this: all dependencies point toward the domain (innermost layer). The database is an outer layer that the domain does not depend on. Traditional layered architecture embeds framework and ORM types in business logic classes. Clean Architecture keeps business logic free of framework dependencies, making it testable in isolation. The key difference is the dependency direction: inward-pointing in Clean Architecture versus downward-pointing in traditional layering.' },
    { q: 'What is the role of the Use Case layer in Clean Architecture?', a: 'Use Cases (also called Interactors or Application Services) implement application-specific business rules. A use case orchestrates domain entities to complete a specific task: PlaceOrder use case fetches the user, validates payment method, creates an order, reserves inventory, and publishes an event. Use cases receive input via an InputPort interface (a plain data object) and communicate results via an OutputPort interface or return value. They depend on entity classes and repository interfaces but know nothing about HTTP, databases, or UI. Each use case corresponds to a single user intention and is independently testable without framework or infrastructure setup.' },
    { q: 'Can a project migrate INTO Clean Architecture incrementally after starting with a simpler structure, or must the layering be decided upfront?', a: 'Yes — a common pragmatic path is starting with a simpler structure (transaction script, or a basic layered/MVC setup) for early MVP speed, then introducing Clean Architecture\'s layering incrementally as business logic complexity actually emerges, feature by feature, rather than committing to the full ceremony before requirements are even validated. This works because the core mechanism (dependency inversion via interfaces defined by inner layers) can be applied to one feature\'s use case at a time without requiring a big-bang restructure of the whole codebase — the risk is that migrating later is more work than starting with it, so this tradeoff should be a deliberate choice, not just deferred indefinitely.' },
  ];

  revision: RevisionSummary = {
    oneLiner: 'Clean Architecture places business rules at the centre; frameworks and databases are outer-ring plugins that the domain never depends on.',
    mustKnow: [
      'Dependency Rule: source code dependencies point inward only',
      'Entities → Use Cases → Interface Adapters → Frameworks (outer to inner)',
      'Repository interfaces defined in Domain, implemented in Infrastructure',
      'Use Cases are testable without any database or HTTP framework',
      'Controllers and repositories are adapters — converters between formats',
    ],
    interviewFocus: [
      'Explain the Dependency Rule with a concrete example',
      'Why are repository interfaces defined in Domain, not Infrastructure?',
      'How does Clean Architecture improve testability?',
    ],
  };
}
