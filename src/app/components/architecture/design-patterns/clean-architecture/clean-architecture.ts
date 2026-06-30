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

const quickRef: QuickRefItem[] = [
  { name: 'Clean Architecture', type: 'keyword',   desc: 'Concentric layer model: Domain → Application → Infrastructure → Presentation. Dependencies only point inward.' },
  { name: 'Domain Layer',       type: 'keyword',   desc: 'Core business logic — entities, value objects, domain events, repository interfaces. No external dependencies.' },
  { name: 'Application Layer',  type: 'keyword',   desc: 'Use cases / application services — orchestrates domain + infrastructure via interfaces. No EF Core, no HTTP.' },
  { name: 'Infrastructure',     type: 'keyword',   desc: 'Implements domain interfaces — EF Core repositories, email services, file storage, message broker.' },
  { name: 'Presentation',       type: 'keyword',   desc: 'API controllers, Blazor pages, console — calls Application layer; cannot reference Domain or Infrastructure directly.' },
  { name: 'Dependency Rule',    type: 'keyword',   desc: 'All dependencies point inward — outer layers depend on inner layers, never the reverse.' },
];

const theory: TheoryPoint[] = [
  {
    heading: 'The Four Layers',
    points: [
      'Domain: entities, value objects, domain events, aggregate roots, repository interfaces. Zero external dependencies.',
      'Application: use cases (command/query handlers), DTOs, application interfaces (IEmailService). Depends on Domain only.',
      'Infrastructure: EF Core repositories, email/SMS providers, external APIs, caching. Depends on Domain + Application.',
      'Presentation: API controllers, gRPC, Blazor, console. Depends on Application (sends commands/queries via MediatR).',
    ],
  },
  {
    heading: 'The Dependency Rule',
    points: [
      'Source code dependencies only point inward — outer layers depend on inner layers.',
      'Domain knows nothing about Application, Infrastructure, or Presentation.',
      'Application knows about Domain; does NOT reference EF Core, ASP.NET, or any framework.',
      'Infrastructure and Presentation depend on all inner layers — they are the outermost circles.',
    ],
  },
  {
    heading: 'Why Clean Architecture?',
    points: [
      'Testability: Domain and Application layers have no infrastructure dependencies — unit-tested without a database.',
      'Flexibility: swap EF Core for Dapper, SQL Server for Postgres, REST for gRPC — Application layer is unchanged.',
      'Domain focus: business logic lives in the Domain layer without framework coupling.',
      'SOLID at the architecture level: Single Responsibility per layer, Dependency Inversion across layers.',
    ],
  },
  {
    heading: 'Project Structure',
    points: [
      'MyApp.Domain: entities, value objects, domain events, IOrderRepository, IDomainService.',
      'MyApp.Application: PlaceOrderCommand, PlaceOrderHandler, IUnitOfWork, OrderDto.',
      'MyApp.Infrastructure: OrderRepository (EF Core), AppDbContext, EmailService, DependencyInjection.',
      'MyApp.Api: Program.cs, Controllers, request/response models; references Application + Infrastructure.',
    ],
  },
];

const codeTabs: CodeTab[] = [
  {
    label: 'Layer Structure',
    language: 'csharp',
    code: `// ── MyApp.Domain ──────────────────────────────────────────────────────────────
// No external package references — pure C# only

// Domain entity with business logic
public class Order
{
    public Guid   Id         { get; private set; }
    public Guid   CustomerId { get; private set; }
    public OrderStatus Status { get; private set; }
    public IReadOnlyList<OrderItem> Items => _items.AsReadOnly();
    private readonly List<OrderItem> _items = new();

    public static Order Create(Guid customerId, IEnumerable<OrderItem> items)
    {
        if (!items.Any()) throw new DomainException("Order must have at least one item");
        return new Order { Id = Guid.NewGuid(), CustomerId = customerId, Status = OrderStatus.Pending,
                           _items = items.ToList() };
    }

    public void Cancel(string reason)
    {
        if (Status == OrderStatus.Shipped) throw new DomainException("Cannot cancel a shipped order");
        Status = OrderStatus.Cancelled;
        AddDomainEvent(new OrderCancelledEvent(Id, reason));
    }
}

// Repository interface — defined in Domain, implemented in Infrastructure
public interface IOrderRepository
{
    Task<Order?> GetByIdAsync(Guid id, CancellationToken ct = default);
    Task AddAsync(Order order, CancellationToken ct = default);
}

// ── MyApp.Application ─────────────────────────────────────────────────────────
// References Domain only — no EF Core, no ASP.NET

public record PlaceOrderCommand(Guid CustomerId, List<OrderItemDto> Items) : IRequest<Guid>;

public class PlaceOrderHandler(IOrderRepository orders, IUnitOfWork uow)
    : IRequestHandler<PlaceOrderCommand, Guid>
{
    public async Task<Guid> Handle(PlaceOrderCommand cmd, CancellationToken ct)
    {
        var items = cmd.Items.Select(i => new OrderItem(i.ProductId, i.Qty, i.Price)).ToList();
        var order = Order.Create(cmd.CustomerId, items);
        await orders.AddAsync(order, ct);
        await uow.SaveChangesAsync(ct);
        return order.Id;
    }
}

// Application interface for external services
public interface IEmailService
{
    Task SendOrderConfirmationAsync(string email, Guid orderId, CancellationToken ct = default);
}

// ── MyApp.Infrastructure ──────────────────────────────────────────────────────
// References Domain + Application; implements interfaces with EF Core

public class OrderRepository(AppDbContext db) : IOrderRepository
{
    public Task<Order?> GetByIdAsync(Guid id, CancellationToken ct) =>
        db.Orders.FindAsync([id], ct).AsTask();

    public Task AddAsync(Order order, CancellationToken ct) =>
        db.Orders.AddAsync(order, ct).AsTask();
}

public class EmailService(IOptions<EmailSettings> settings) : IEmailService
{
    public async Task SendOrderConfirmationAsync(string email, Guid orderId, CancellationToken ct) =>
        await SmtpSend(settings.Value.SmtpHost, email, $"Order {orderId} confirmed");
}

// Infrastructure DI registration
public static class DependencyInjection
{
    public static IServiceCollection AddInfrastructure(this IServiceCollection services, IConfiguration cfg)
    {
        services.AddDbContext<AppDbContext>(o => o.UseSqlServer(cfg.GetConnectionString("Default")));
        services.AddScoped<IOrderRepository, OrderRepository>();
        services.AddScoped<IUnitOfWork, AppUnitOfWork>();
        services.AddScoped<IEmailService, EmailService>();
        return services;
    }
}

// ── MyApp.Api ─────────────────────────────────────────────────────────────────
// References Application + Infrastructure only; wires DI

// Program.cs
builder.Services.AddApplication();      // Application DI (MediatR, validators)
builder.Services.AddInfrastructure(builder.Configuration); // Infrastructure DI

// Controller — thin, only sends commands/queries
[ApiController, Route("api/orders")]
public class OrdersController(IMediator mediator) : ControllerBase
{
    [HttpPost]
    public async Task<IActionResult> Place(PlaceOrderRequest req) =>
        Ok(await mediator.Send(new PlaceOrderCommand(req.CustomerId, req.Items)));
}`,
  },
  {
    label: 'Testing Without Infrastructure',
    language: 'csharp',
    code: `// Domain tests — no EF Core, no database needed
public class OrderTests
{
    [Fact]
    public void Create_ThrowsDomainException_WhenNoItems()
    {
        var act = () => Order.Create(Guid.NewGuid(), []);
        act.Should().Throw<DomainException>().WithMessage("*at least one item*");
    }

    [Fact]
    public void Cancel_ThrowsDomainException_WhenOrderIsShipped()
    {
        var order = Order.Create(Guid.NewGuid(), [new OrderItem(Guid.NewGuid(), 1, 10m)]);
        order.Ship();
        var act = () => order.Cancel("test");
        act.Should().Throw<DomainException>().WithMessage("*Cannot cancel a shipped order*");
    }
}

// Application tests — mock infrastructure interfaces
public class PlaceOrderHandlerTests
{
    [Fact]
    public async Task Handle_AddsOrderAndSaves()
    {
        var orders = Substitute.For<IOrderRepository>(); // NSubstitute mock
        var uow    = Substitute.For<IUnitOfWork>();
        var handler = new PlaceOrderHandler(orders, uow);

        var cmd    = new PlaceOrderCommand(Guid.NewGuid(), [new OrderItemDto(Guid.NewGuid(), 1, 10m)]);
        var orderId = await handler.Handle(cmd, CancellationToken.None);

        await orders.Received(1).AddAsync(Arg.Any<Order>(), Arg.Any<CancellationToken>());
        await uow.Received(1).SaveChangesAsync(Arg.Any<CancellationToken>());
        orderId.Should().NotBeEmpty();
    }
}

// No database required — Domain and Application are fully unit-testable
// Infrastructure gets integration-tested against a real DB (TestContainers, etc.)`,
  },
];

const mistakes: CommonMistake[] = [
  {
    title: 'Domain layer referencing EF Core or infrastructure packages',
    wrong: `// MyApp.Domain.csproj
<PackageReference Include="Microsoft.EntityFrameworkCore" Version="9.0.0" />

public class Order
{
    [Key] public Guid Id { get; set; } // EF Core attribute in domain!
}`,
    right: `// Domain has ZERO package references
// Configure EF Core mappings in Infrastructure using Fluent API (IEntityTypeConfiguration<Order>)`,
    explanation: 'Domain entities must have no dependency on EF Core, ASP.NET, or any infrastructure framework. Put EF Core data annotations and configurations in Infrastructure layer via Fluent API. This keeps the domain pure and unit-testable.',
  },
  {
    title: 'Application layer referencing the DbContext directly',
    wrong: `public class PlaceOrderHandler(AppDbContext db) // Infrastructure dependency in Application!
{
    public async Task<Guid> Handle(PlaceOrderCommand cmd, CancellationToken ct)
    {
        db.Orders.Add(order);
        await db.SaveChangesAsync(ct);
    }
}`,
    right: `public class PlaceOrderHandler(IOrderRepository orders, IUnitOfWork uow) // interfaces only`,
    explanation: 'Application handlers must depend on interfaces (IOrderRepository, IUnitOfWork) defined in Application or Domain — not on the concrete DbContext from Infrastructure. This maintains the dependency rule and enables mocking in tests.',
  },
  {
    title: 'Putting business logic in controllers or command handlers',
    wrong: `public async Task<Guid> Handle(PlaceOrderCommand cmd, CancellationToken ct)
{
    if (cmd.Items.Sum(i => i.Price * i.Qty) > 10000)
        throw new Exception("Order exceeds limit"); // business rule in handler!
}`,
    right: `// Business rules belong in Domain entities or domain services
var order = Order.Create(cmd.CustomerId, items); // Order.Create enforces domain invariants`,
    explanation: 'Command handlers are orchestrators. Business rules belong in domain entities or domain services where they can be tested without application or infrastructure setup. Handlers that contain domain logic bypass invariants and create non-reusable rules.',
  },
  {
    title: 'Making all layers reference the outermost project',
    wrong: `// MyApp.Domain.csproj
<ProjectReference Include="../MyApp.Api/MyApp.Api.csproj" />`,
    right: `// Dependency rule: only outer → inner
// Api → Application → Domain (never reverse)`,
    explanation: 'Project references must only go inward. If Domain references Api or Infrastructure, you have an inverted dependency — domain logic depends on infrastructure. Use the Dependency Inversion Principle: inner layers define interfaces; outer layers implement them.',
  },
];

const challenge: Challenge = {
  title: 'Layer Boundary Check',
  language: 'typescript',
  description: `Model a Clean Architecture "UserService" correctly.
Domain: User class with id and name (no dependencies).
Application: IUserRepository interface + CreateUserUseCase(repo).
Infrastructure: InMemoryUserRepository implementing IUserRepository.
Wiring: inject InMemoryUserRepository into CreateUserUseCase.
Domain and Application must NOT reference Infrastructure.`,
  hints: [
    'User is a plain class — no dependencies',
    'IUserRepository is an interface in Application (or Domain)',
    'CreateUserUseCase depends on IUserRepository (interface, not implementation)',
  ],
  starterCode: `// Domain
class User { constructor(public id: string, public name: string) {} }

// Application
interface IUserRepository { save(user: User): void; getAll(): User[]; }
class CreateUserUseCase {
  constructor(private repo: IUserRepository) {}
  execute(name: string): User { /* TODO */ return new User('', ''); }
}

// Infrastructure — TODO: InMemoryUserRepository

// Wiring — TODO: inject InMemoryUserRepository`,
  solution: `// Domain — no dependencies
class User { constructor(public id: string, public name: string) {} }

// Application — depends on Domain only
interface IUserRepository { save(user: User): void; getAll(): User[]; }

class CreateUserUseCase {
  constructor(private repo: IUserRepository) {}
  execute(name: string): User {
    const user = new User(String(Date.now()), name);
    this.repo.save(user);
    return user;
  }
}

// Infrastructure — implements Application interface
class InMemoryUserRepository implements IUserRepository {
  private users: User[] = [];
  save(user: User): void { this.users.push(user); }
  getAll(): User[] { return [...this.users]; }
}

// Wiring (Presentation / composition root)
const repo    = new InMemoryUserRepository(); // Infrastructure
const useCase = new CreateUserUseCase(repo);  // Application gets interface

const alice = useCase.execute('Alice');
const bob   = useCase.execute('Bob');
console.log(repo.getAll().map(u => u.name)); // ['Alice', 'Bob']`,
};

const quiz: QuizQuestion[] = [
  {
    q: 'What is the Dependency Rule in Clean Architecture?',
    options: [
      'Dependencies can point in any direction as long as they are injected',
      'All source code dependencies must point inward — outer layers depend on inner layers, never the reverse',
      'Infrastructure must depend on Presentation for rendering',
      'Domain must reference Application to use use cases',
    ],
    answer: 1,
    explanation: 'The Dependency Rule is the cornerstone of Clean Architecture: code dependencies must only point inward. Domain knows nothing about Application or Infrastructure. Application knows about Domain only. Infrastructure and Presentation depend on all inner layers via interfaces.',
  },
  {
    q: 'Why should the Domain layer have no package references to EF Core or ASP.NET?',
    options: [
      'Because those packages are too large',
      'Because Domain entities would become untestable and tied to specific infrastructure — violating the Dependency Rule',
      'Because EF Core does not support Domain-driven Design',
      'Because NuGet package references are forbidden in Domain projects',
    ],
    answer: 1,
    explanation: 'Domain entities with EF Core dependencies require the database to be running for unit tests, cannot be ported to a different ORM, and mix infrastructure concerns into business logic. Keeping Domain pure means it can be unit-tested instantly and is infrastructure-agnostic.',
  },
  {
    q: 'In Clean Architecture, where are repository interfaces defined vs implemented?',
    options: [
      'Defined in Infrastructure; implemented in Domain',
      'Defined in Domain or Application; implemented in Infrastructure',
      'Defined and implemented in Application',
      'Defined in Presentation; implemented in Infrastructure',
    ],
    answer: 1,
    explanation: 'Repository interfaces (IOrderRepository) are defined in Domain or Application — they express what the domain needs. Concrete implementations (EF Core OrderRepository) live in Infrastructure. This is the Dependency Inversion Principle: inner layers define abstractions; outer layers implement them.',
  },
  { q: 'What is a Use Case class in Clean Architecture and what are its responsibilities?', options: ['A class that defines the REST API endpoint for a specific operation', 'A class that implements a single application-specific operation, orchestrating domain entities to fulfill a business requirement', 'A class in the database layer that maps SQL queries to domain objects', 'A class that defines the user interface logic for a specific screen'], answer: 1, explanation: 'A Use Case (or Interactor) implements one specific user intention: PlaceOrder, RegisterUser, ProcessPayment. It receives an input (plain data object via InputPort), coordinates domain entities to fulfill the operation, and returns output (via OutputPort interface). It contains no framework-specific code, no HTTP handling, and no direct database calls. The Use Case depends on repository interfaces and other port interfaces defined in the domain/application layer. This makes Use Cases independently testable without infrastructure.' },
  { q: 'What is the role of Input and Output Ports in Clean Architecture?', options: ['Physical input and output interfaces for hardware device communication', 'Input Ports are interfaces defining what the application exposes to external actors; Output Ports are interfaces the application uses to communicate with infrastructure', 'Input Ports handle HTTP requests; Output Ports handle HTTP responses', 'They are internal implementation details with no external significance'], answer: 1, explanation: 'Ports are interfaces that define the boundary between the application core and the outside world. Input Ports (driving/inbound): interfaces defining the use cases that external actors (controllers, CLI) can trigger. Implementing the input port, the Use Case class receives commands from adapters. Output Ports (driven/outbound): interfaces defining what the application needs from infrastructure: IUserRepository, IEmailService, IPaymentGateway. The application core defines these interfaces; the infrastructure layer provides implementations. This keeps the core independent of specific technologies.' },
  { q: 'How does Clean Architecture handle cross-cutting concerns like logging and transactions?', options: ['Cross-cutting concerns are placed in the domain entities layer', 'Cross-cutting concerns are implemented as decorators around use cases or via aspect-oriented frameworks, keeping them out of core business logic', 'Each use case explicitly calls logging and transaction methods in its implementation', 'Clean Architecture does not support cross-cutting concerns by design'], answer: 1, explanation: 'Cross-cutting concerns (logging, transactions, metrics) should not pollute Use Case business logic. Solutions: Decorator pattern wraps Use Case implementations with a logging decorator or transaction decorator without modifying the Use Case. AOP (AspectJ in Java, PostSharp in .NET) applies cross-cutting behavior via attributes or pointcuts. Pipeline behaviors in MediatR (C#) run before and after Use Case handlers for logging, validation, and transactions. All approaches keep cross-cutting code separate from business logic, maintaining single responsibility.' },
];

const qna: QnaItem[] = [
  {
    q: 'Is Clean Architecture the same as Onion Architecture or Hexagonal Architecture?',
    a: 'They are different names for the same core idea: concentric layers with the domain at the centre and all dependencies pointing inward. Hexagonal Architecture (Ports & Adapters) calls the inner boundary "ports" (interfaces) and outer implementations "adapters". Onion Architecture emphasises domain at the core with application services around it. Clean Architecture is Uncle Bob\'s formalisation of these ideas with explicit layer names. All three enforce the Dependency Rule.',
  },
  {
    q: 'When is Clean Architecture over-engineering?',
    a: 'For simple CRUD APIs with minimal business logic, Clean Architecture\'s multi-project structure adds ceremony without value. It shines when: domain logic is complex and needs isolation from infrastructure, multiple delivery mechanisms exist (API, gRPC, CLI), the persistence technology may change, or the application must be long-lived with evolving requirements. For a 3-endpoint admin tool, a single-project layered approach is simpler.',
  },
  { q: 'How do you test a Use Case without depending on real infrastructure?', a: 'A Use Case depends only on interfaces (IOrderRepository, IEmailService). In a unit test: create in-memory or mock implementations of all required interfaces. Instantiate the Use Case with these test doubles. Call the Use Case method with test input. Assert the output and verify interactions with the mock interfaces. No database, HTTP server, or file system is needed. Tests run in milliseconds and are deterministic. This is the core testability benefit of Clean Architecture: business logic is fully testable in isolation. Integration tests test the interface implementations separately, verifying real database or external service behavior.' },
  { q: 'What is the Humble Object pattern and how does it apply to Clean Architecture?', a: 'The Humble Object pattern extracts testable logic from components that are hard to test (because they depend on UI frameworks, databases, or timers) into a separate class that is easy to test. What remains (the Humble Object) is as thin as possible: just enough to wire the testable object to the hard-to-test environment. In Clean Architecture: the controller (adapter) is a Humble Object that handles HTTP mechanics but delegates all logic to the Use Case. The Use Case is the testable logic. The repository implementation (another adapter) is a Humble Object for database mechanics. The domain logic in entities and use cases is testable without any humble infrastructure objects.' },
  { q: 'How do you handle validation in Clean Architecture?', a: 'Validation belongs at multiple levels. Domain validation: business rules are invariants enforced by domain entities and value objects. An Age value object rejects negative values in its constructor. Business rule validation in use cases: PlaceOrder checks that the customer account is not blocked. Input validation (format, type, required fields) is a concern of the adapter layer: HTTP request validation in the controller before creating the Use Case input object. This keeps format validation out of business logic. Use a Result or Either type to communicate validation failures from use cases without exceptions, allowing the adapter to translate failures to appropriate HTTP error responses.' },
  { q: 'What are the common pitfalls when implementing Clean Architecture?', a: 'Common mistakes: putting business logic in controllers (presentation layer) instead of use cases. Making use cases depend on HTTP types (HttpRequest, HttpResponse) instead of clean input/output objects. Leaking ORM entities (database model classes) into the domain layer instead of mapping to domain objects. Putting domain logic in the database stored procedures, bypassing the domain model. Over-engineering small projects with Clean Architecture overhead where a simpler structure would suffice. Using the same data class everywhere instead of having separate request DTOs, domain objects, and response DTOs. Under-investing in the domain model by making it anemic (all logic in services, entities are just data).' },
];

const revision: RevisionSummary = {
  oneLiner: 'Clean Architecture organises code in concentric layers — Domain, Application, Infrastructure, Presentation — with all dependencies pointing inward, keeping business logic independent of frameworks and databases.',
  mustKnow: [
    'Four layers: Domain (entities) → Application (use cases) → Infrastructure (EF Core) → Presentation (API)',
    'Dependency Rule: outer layers depend on inner layers — never the reverse',
    'Domain has ZERO package references — pure C# business logic',
    'Repository interfaces in Domain/Application; implementations in Infrastructure',
    'Application handlers use interfaces only — unit-testable without a database',
  ],
  interviewFocus: [
    'What is the Dependency Rule and why does it matter?',
    'Where are repository interfaces defined vs implemented, and why?',
    'When does Clean Architecture become over-engineering?',
  ],
};

@Component({
  selector: 'app-dp-clean-architecture',
  standalone: true,
  imports: [CommonModule, PageMetaComponent, QuickRefComponent, TheoryBlockComponent,
    CodeBlockComponent, CommonMistakesComponent, ChallengeBlockComponent,
    QuizBlockComponent, QnaBlockComponent, RevisionCardComponent, PageCompleteComponent],
  templateUrl: './clean-architecture.html',
  styleUrl: './clean-architecture.scss',
})
export class DpCleanArchitecture {
  quickRef = quickRef; theory = theory; codeTabs = codeTabs;
  mistakes = mistakes; challenge = challenge; quiz = quiz; qna = qna; revision = revision;
}
