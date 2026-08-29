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
  { name: 'DIP',              type: 'keyword',   desc: 'Dependency Inversion Principle: high-level modules must not depend on low-level modules — both depend on abstractions.' },
  { name: 'Dependency Injection', type: 'keyword', desc: 'The mechanism that implements DIP: dependencies (abstractions) are injected by a container rather than constructed inside the class.' },
  { name: 'IoC Container',    type: 'class',     desc: 'Inversion of Control container — resolves and injects dependencies: Microsoft.Extensions.DI, Autofac, etc.' },
  { name: 'Constructor Injection', type: 'keyword', desc: 'The preferred DI style: dependencies declared in the constructor and injected when the class is created.' },
  { name: 'IServiceCollection', type: 'class',  desc: '.NET DI registration: AddSingleton, AddScoped, AddTransient map interfaces to concrete implementations.' },
  { name: 'Composition Root', type: 'keyword',   desc: 'The single place (Program.cs) where all dependencies are wired — the ONLY place concrete classes are named.' },
];

const theory: TheoryPoint[] = [
  {
    heading: 'What is the Dependency Inversion Principle?',
    points: [
      'DIP (the D in SOLID): high-level modules should not depend on low-level modules — both should depend on abstractions.',
      'Abstractions should not depend on details — details (implementations) should depend on abstractions.',
      'Without DIP: OrderService depends on SqlOrderRepository — changing the database forces changes to OrderService.',
      'With DIP: OrderService depends on IOrderRepository — SqlOrderRepository, MongoOrderRepository, or InMemoryRepository all work.',
    ],
  },
  {
    heading: 'Dependency Injection (the Mechanism)',
    points: [
      'DIP is the principle; Dependency Injection is the implementation technique.',
      'Constructor Injection: dependencies are declared in the constructor — the container provides them when creating the class.',
      'Property Injection: dependencies set via public properties — less preferred (optional dependencies only).',
      'Method Injection: dependencies passed as method parameters — used when a dependency varies per call.',
    ],
  },
  {
    heading: 'IoC Container and Lifetimes',
    points: [
      'Singleton: one instance for the application lifetime — shared by all requests. Use for stateless, thread-safe services.',
      'Scoped: one instance per HTTP request (or scope). Use for DbContext, Unit of Work — shared within one request.',
      'Transient: new instance every time it is requested. Use for lightweight, stateless services.',
      'Captive dependency anti-pattern: injecting a Scoped service into a Singleton — the Scoped service lives as long as the Singleton.',
    ],
  },
  {
    heading: 'Composition Root',
    points: [
      'The Composition Root is the single place in the application where all dependencies are wired up.',
      'In ASP.NET Core: Program.cs / WebApplicationBuilder — all AddSingleton/AddScoped/AddTransient calls.',
      'Only the Composition Root should reference concrete implementations — all other code uses interfaces.',
      'This is the only place where DIP is "violated" by design — concrete types must be named somewhere.',
    ],
  },
  {
    heading: 'The "Inversion" in Dependency Inversion Principle',
    points: [
      'Without DIP, high-level business logic depends directly on low-level implementation details (a business service directly instantiating and calling a concrete SqlDatabase class) — the dependency naturally flows from high-level to low-level, tightly coupling business logic to specific infrastructure choices.',
      'DIP inverts this default flow — both high-level and low-level modules depend on a shared ABSTRACTION (an interface), with the low-level module implementing that abstraction — the dependency direction is inverted so infrastructure depends on an abstraction the business logic defines, not the other way around.',
      'This inversion is what makes high-level business logic genuinely independent of specific infrastructure choices — swapping SqlDatabase for a different implementation requires no changes to business logic, since business logic was never coupled to the concrete class in the first place, only to the abstraction.',
      'DIP is distinct from simple "dependency injection" (a mechanism for supplying dependencies) — DIP is the underlying DESIGN PRINCIPLE about which direction dependencies should point; dependency injection is one common TECHNIQUE for actually wiring up dependencies that follow DIP\'s inverted direction.',
    ],
  },
];

const codeTabs: CodeTab[] = [
  {
    label: 'DIP + Constructor Injection',
    language: 'csharp',
    code: `// ── Without DIP ───────────────────────────────────────────────────────────────

public class OrderService
{
    // High-level module directly references low-level concrete class
    private readonly SqlOrderRepository _repo = new SqlOrderRepository("Server=...;");
    private readonly SmtpEmailSender    _email = new SmtpEmailSender("smtp.gmail.com");

    public async Task PlaceOrderAsync(Order order)
    {
        await _repo.SaveAsync(order);              // tightly coupled to SQL
        await _email.SendConfirmationAsync(order); // tightly coupled to SMTP
    }
}
// Problems: cannot unit test (needs real SQL + SMTP), cannot swap providers

// ── With DIP — interfaces + constructor injection ──────────────────────────────

// Abstractions (defined in Application layer)
public interface IOrderRepository
{
    Task SaveAsync(Order order, CancellationToken ct = default);
    Task<OrderSummary> GetSummaryAsync(CancellationToken ct = default);
}
public interface IEmailService    { Task SendConfirmationAsync(Order order, CancellationToken ct = default); }

// High-level module — depends ONLY on abstractions
public class OrderService(IOrderRepository repo, IEmailService email)
{
    public async Task PlaceOrderAsync(Order order, CancellationToken ct)
    {
        await repo.SaveAsync(order, ct);
        await email.SendConfirmationAsync(order, ct);
    }
}

// Low-level modules — implement the abstractions
public class SqlOrderRepository(AppDbContext db) : IOrderRepository
{
    public Task SaveAsync(Order order, CancellationToken ct) =>
        db.Orders.AddAsync(order, ct).AsTask();

    public async Task<OrderSummary> GetSummaryAsync(CancellationToken ct) =>
        new(await db.Orders.CountAsync(ct), await db.Orders.SumAsync(o => o.Total, ct));
}

public class SmtpEmailService(IOptions<SmtpSettings> settings) : IEmailService
{
    public Task SendConfirmationAsync(Order order, CancellationToken ct) =>
        SendSmtpAsync(settings.Value.Host, order.CustomerEmail, "Order confirmed", ct);
}

// Composition Root (Program.cs) — ONLY place concrete types are named
builder.Services.AddScoped<IOrderRepository, SqlOrderRepository>();
builder.Services.AddScoped<IEmailService, SmtpEmailService>();
builder.Services.AddScoped<OrderService>();

// Unit test — inject fakes without changing OrderService
var repoFake  = Substitute.For<IOrderRepository>();
var emailFake = Substitute.For<IEmailService>();
var service   = new OrderService(repoFake, emailFake);
await service.PlaceOrderAsync(order, CancellationToken.None);
await repoFake.Received(1).SaveAsync(order, Arg.Any<CancellationToken>());`,
  },
  {
    label: 'Lifetimes + Captive Dependency',
    language: 'csharp',
    code: `// Service lifetimes in ASP.NET Core DI
builder.Services.AddSingleton<IEmailTemplateCache, EmailTemplateCache>(); // one instance, app lifetime
builder.Services.AddScoped<IOrderRepository, SqlOrderRepository>();       // one per HTTP request
builder.Services.AddTransient<IPasswordHasher, BcryptPasswordHasher>();  // new each injection

// ── Captive Dependency Anti-Pattern ──────────────────────────────────────────

// WRONG: Singleton captures a Scoped dependency — Scoped service lives forever
builder.Services.AddSingleton<OrderSummaryService>(); // Singleton
builder.Services.AddScoped<IOrderRepository, SqlOrderRepository>(); // Scoped

public class OrderSummaryService(IOrderRepository repo) // Scoped injected into Singleton!
{
    // repo is captured at Singleton creation — same DbContext for ALL requests (data leaks!)
}

// CORRECT: Singleton should not depend on Scoped services
// If access is needed at request time, inject IServiceScopeFactory and create a scope
public class OrderSummaryService(IServiceScopeFactory scopeFactory)
{
    public async Task<OrderSummary> GetSummaryAsync()
    {
        await using var scope = scopeFactory.CreateAsyncScope();
        var repo = scope.ServiceProvider.GetRequiredService<IOrderRepository>();
        return await repo.GetSummaryAsync();
    }
}

// ── Named / Keyed Services (.NET 8+) ─────────────────────────────────────────
builder.Services.AddKeyedScoped<IPaymentProcessor, StripeProcessor>("stripe");
builder.Services.AddKeyedScoped<IPaymentProcessor, PaypalProcessor>("paypal");

public class PaymentService([FromKeyedServices("stripe")] IPaymentProcessor processor)
{
    public Task<PaymentResult> ChargeAsync(decimal amount) => processor.ChargeAsync(amount);
}`,
  },
];

const mistakes: CommonMistake[] = [
  {
    title: 'Service Locator pattern instead of constructor injection',
    wrong: `public class OrderService
{
    public async Task PlaceOrderAsync(Order order)
    {
        var repo = ServiceLocator.GetService<IOrderRepository>(); // hidden dependency
        await repo.SaveAsync(order);
    }
}`,
    right: `public class OrderService(IOrderRepository repo) // explicit, injected dependency
{
    public async Task PlaceOrderAsync(Order order) => await repo.SaveAsync(order);
}`,
    explanation: 'Service Locator hides dependencies — callers cannot see what a class needs without reading its code. Constructor injection makes dependencies explicit, self-documenting, and easily mockable in tests. Service Locator is considered an anti-pattern by most DI advocates.',
  },
  {
    title: 'Captive dependency: Singleton consuming a Scoped service',
    wrong: `builder.Services.AddSingleton<ReportService>(); // Singleton
builder.Services.AddScoped<IOrderRepository, SqlOrderRepository>(); // Scoped
// ReportService(IOrderRepository repo) — repo is a Scoped captured in Singleton!`,
    right: `// Option 1: make ReportService Scoped too
builder.Services.AddScoped<ReportService>();
// Option 2: inject IServiceScopeFactory and create a scope per operation`,
    explanation: 'A Singleton that captures a Scoped dependency holds the Scoped service for the full application lifetime. For DbContext this means the same connection/transaction context is reused across all HTTP requests — causing data leaks and thread-safety issues.',
  },
  {
    title: 'Using new() inside a class instead of injecting the dependency',
    wrong: `public class NotificationService
{
    private readonly EmailSender _sender = new EmailSender("smtp.example.com", 587);
}`,
    right: `public class NotificationService(IEmailSender sender) // injected — testable and swappable`,
    explanation: 'Using new() inside a class creates a direct coupling to the concrete type and its constructor parameters. This makes the class impossible to unit test without the real email server and impossible to swap for a different implementation.',
  },
  {
    title: 'Registering everything as Singleton regardless of state',
    wrong: `builder.Services.AddSingleton<IOrderRepository, SqlOrderRepository>();
// SqlOrderRepository holds DbContext — shared across all requests = thread-safety nightmare`,
    right: `builder.Services.AddScoped<IOrderRepository, SqlOrderRepository>();
// Scoped: one DbContext per request — safe and correct for EF Core`,
    explanation: 'Singleton services are shared across all concurrent requests. If a Singleton wraps a non-thread-safe resource like DbContext, you get race conditions and corrupt state. Match the lifetime to the service\'s state: stateless → Singleton or Transient; stateful per-request → Scoped.',
  },
];

const challenge: Challenge = {
  title: 'DIP Logger Example',
  language: 'typescript',
  description: `Apply DIP to a logging scenario.
Define ILogger interface with log(message) method.
ConsoleLogger implements ILogger and logs to console.
NullLogger implements ILogger as a no-op.
UserService(logger: ILogger) uses the interface — works with both loggers.`,
  hints: [
    'ILogger is the abstraction — UserService depends on it',
    'ConsoleLogger and NullLogger are the low-level modules',
    'Swap the logger at construction time — UserService never changes',
  ],
  starterCode: `// TODO: ILogger interface
// TODO: ConsoleLogger
// TODO: NullLogger
// TODO: UserService(logger: ILogger) with createUser(name) method`,
  solution: `// Abstraction — both high-level and low-level depend on this
interface ILogger {
  log(message: string): void;
}

// Low-level module A
class ConsoleLogger implements ILogger {
  log(message: string): void { console.log(\`[LOG] \${message}\`); }
}

// Low-level module B (Null Object)
class NullLogger implements ILogger {
  log(_message: string): void {} // no-op
}

// High-level module — depends ONLY on ILogger abstraction
class UserService {
  constructor(private logger: ILogger) {}

  createUser(name: string): void {
    this.logger.log(\`Creating user: \${name}\`);
    // ... create user logic
    this.logger.log(\`User \${name} created successfully\`);
  }
}

// Composition root — swap loggers without touching UserService
const prodService = new UserService(new ConsoleLogger());
prodService.createUser('Alice'); // logs to console

const testService = new UserService(new NullLogger());
testService.createUser('Bob');   // silent — no console output in tests`,
};

const quiz: QuizQuestion[] = [
  {
    q: 'What is the Dependency Inversion Principle?',
    options: [
      'High-level modules must import low-level modules directly for performance',
      'High-level and low-level modules should both depend on abstractions — not on each other directly',
      'Low-level modules should depend on high-level business logic',
      'Dependencies should be inverted using method return types instead of constructors',
    ],
    answer: 1,
    explanation: 'DIP states: (1) high-level modules must not depend on low-level modules — both should depend on abstractions, and (2) abstractions must not depend on details — details depend on abstractions. This allows the high-level business logic to remain stable while low-level implementations change.',
  },
  {
    q: 'What is a "captive dependency" in DI?',
    options: [
      'A dependency that is never released from memory',
      'A short-lived (Scoped or Transient) service injected into a longer-lived (Singleton) service — the short-lived service lives as long as the Singleton',
      'A dependency that requires network access to resolve',
      'A service that cannot be injected because it has no interface',
    ],
    answer: 1,
    explanation: 'A captive dependency occurs when a Scoped or Transient service is injected into a Singleton. The Singleton is created once and holds the reference forever — the Scoped service\'s lifetime becomes the application lifetime. For DbContext this means one database connection shared across all requests.',
  },
  {
    q: 'What is the Composition Root?',
    options: [
      'The base class that all services must inherit from',
      'The single location in the application (Program.cs) where all concrete implementations are wired to their abstractions',
      'The root directory of the project where DI configuration files are stored',
      'The first service that is created when the application starts',
    ],
    answer: 1,
    explanation: 'The Composition Root is the single place — typically Program.cs in ASP.NET Core — where all services are registered: AddSingleton, AddScoped, AddTransient. This is the ONLY place where concrete class names appear alongside their interface registrations. All other code uses only interfaces.',
  },
  { q: 'Why does the "abstraction" in DIP need to be OWNED by (defined alongside) the high-level module, not the low-level one, for the inversion to actually happen?', options: ['Ownership location has no effect on whether inversion occurs', 'If the low-level module defines the interface, the high-level module still depends on something the low-level module controls — true inversion requires the high-level module (or a shared neutral layer) to own the abstraction, so the low-level module is the one conforming to a contract it does not control', 'The abstraction must always be defined in a completely separate microservice', 'Interfaces can only be owned by the infrastructure layer in any design'], answer: 1, explanation: 'If SqlOrderRepository (low-level) defines IOrderRepository and OrderService (high-level) merely happens to use it, the DEPENDENCY still effectively originates from the infrastructure side — the interface\'s shape is dictated by what the database implementation finds convenient, not what the business logic actually needs. True inversion requires the high-level module (or a shared domain/abstractions layer that the business logic controls) to define the interface\'s shape, forcing the low-level implementation to conform to a contract driven by business needs — this ownership detail is what actually "inverts" the traditional dependency direction, not merely the presence of an interface.' },
  { q: 'How does Dependency Injection implement the Dependency Inversion Principle?', options: ['DI and DIP are the same thing; using one means using the other', 'DI is a mechanism for providing dependencies to classes externally, which enables DIP by allowing dependencies to be swapped for different implementations including test doubles', 'DI generates interface code from concrete classes automatically', 'DI inverts the class hierarchy making derived classes the base'], answer: 1, explanation: 'DIP is a design principle (what to depend on: abstractions). DI is a technique for achieving DIP (how to receive the dependency: via constructor, property, or method injection rather than creation within the class). DIP says classes should depend on abstractions. DI delivers those abstract dependencies from outside the class. Without DI, a class can still depend on an abstraction but creates a concrete implementation with new: ILogger logger = new FileLogger(). DI fully realizes DIP by ensuring the concrete implementation is never referenced in the class; it is always provided by the DI container or test setup.' },
  { q: 'What is the difference between DIP and IoC (Inversion of Control)?', options: ['DIP and IoC are synonyms', 'IoC is the broad principle of reversing control flow (callbacks, event handlers, DI containers, frameworks calling your code); DIP is specifically about module-level dependency directions through abstractions', 'IoC is for frameworks; DIP is for application code', 'DIP implements IoC by defining abstract interfaces'], answer: 1, explanation: 'Inversion of Control is a broad principle: instead of your code calling a framework, the framework calls your code (callbacks, hooks, dependency injection). DIP is a specific design principle about which level of abstraction modules depend on. DI is one implementation of IoC. All DIP implementations use some form of IoC for the dependency delivery, but IoC includes many other patterns beyond DIP (template method, observer, event-driven programming). DIP focuses on the dependency direction: both high-level and low-level modules point toward abstractions, not toward each other.' },
];

const qna: QnaItem[] = [
  {
    q: 'What is the difference between DIP and Dependency Injection?',
    a: 'DIP is the design principle: high-level and low-level modules should both depend on abstractions. Dependency Injection is the implementation technique that realises DIP: instead of a class constructing its own dependencies (new SqlRepo()), they are injected by an external container. DI without DIP (injecting concrete classes) is possible but misses the point. DIP without DI (manually wiring in Program.cs) is also possible. In practice they complement each other.',
  },
  {
    q: 'When should I use Singleton vs Scoped vs Transient?',
    a: 'Singleton: stateless, thread-safe services that are expensive to create — caches, configuration, HttpClient factories. Scoped: stateful per-request services — DbContext, Unit of Work, current user context. Transient: lightweight, stateless services that should not be shared — validators, mappers, per-operation helpers. Never inject Scoped into Singleton. Prefer Scoped over Singleton unless you have a specific reason for application-wide sharing.',
  },
  { q: 'How does DIP improve testability?', a: 'Without DIP: OrderService creates a new SqlOrderRepository internally with new. In a unit test, you cannot replace the SqlOrderRepository with a mock; every test hits the real database. With DIP: OrderService depends on IOrderRepository. In a test, pass a mock IOrderRepository to the constructor. The test controls what the repository returns without a real database. Tests run fast, deterministically, and in isolation. This is the primary practical benefit of DIP for most developers: the ability to inject test doubles. Any class that creates its own dependencies with new is tightly coupled and difficult to unit test.' },
  { q: 'What is a Dependency Inversion violation example and how to fix it?', a: 'Violation: class ReportGenerator { private SqlDatabase db = new SqlDatabase(); public Report generate() { var data = db.query(); ... } }. ReportGenerator depends on a concrete SqlDatabase detail, not an abstraction. Fixing it: define an interface: interface IDataSource { Data query(); }. Implement it: class SqlDatabase : IDataSource { public Data query() { ... } }. Change ReportGenerator: class ReportGenerator { public ReportGenerator(IDataSource ds) { ... } }. Now ReportGenerator depends on the abstraction IDataSource. SqlDatabase depends on IDataSource. Both depend on the abstraction. To use a different data source or a mock in tests, just provide a different IDataSource implementation.' },
  { q: 'How should you define abstractions to avoid violating DIP?', a: 'Abstractions should be defined by the client (high-level module) or in a shared contracts project, not by the implementor (low-level module). If IOrderRepository is defined next to SqlOrderRepository in the data access layer, and the domain layer imports from the data access layer to use the interface, DIP is violated: the high-level module still depends on the low-level module package. Correct structure: IOrderRepository is in the Domain or Application layer. SqlOrderRepository is in the Infrastructure layer and imports from Application to implement the interface. Source code dependency direction: Infrastructure depends on Application/Domain, never the reverse.' },
  { q: 'What are common mistakes when trying to apply DIP?', a: 'Common mistakes: creating an interface for every class regardless of whether multiple implementations exist or tests need mocking — this is over-abstraction. Defining the interface in the same assembly as the implementation, still coupling the consumer to the implementor package. Injecting concrete classes as dependencies while calling it DI (using new keyword internally). Service Locator anti-pattern: instead of injecting dependencies, calling a global ServiceLocator.Resolve<IService>() — hides dependencies and makes the code harder to test. Injecting container references instead of specific dependencies. Good DIP: inject IOrderRepository, not IServiceProvider from which you resolve IOrderRepository inside the class.' },
];

const revision: RevisionSummary = {
  oneLiner: 'Dependency Inversion Principle: high-level modules depend on abstractions (interfaces), not concretions — implemented via constructor injection and an IoC container wired in the Composition Root.',
  mustKnow: [
    'DIP: high-level + low-level modules both depend on abstractions — not on each other',
    'DI is the mechanism: dependencies injected into constructor, not constructed with new()',
    'Lifetimes: Singleton (app), Scoped (request), Transient (per-injection) — match to service state',
    'Captive dependency: Scoped injected into Singleton → use IServiceScopeFactory instead',
    'Composition Root (Program.cs): the ONLY place concrete types are named; all other code uses interfaces',
  ],
  interviewFocus: [
    'DIP vs Dependency Injection — what is the difference?',
    'What is a captive dependency and how do you fix it?',
    'Singleton vs Scoped vs Transient — when to use each?',
  ],
};

@Component({
  selector: 'app-dp-dependency-inversion',
  standalone: true,
  imports: [CommonModule, PageMetaComponent, QuickRefComponent, TheoryBlockComponent,
    CodeBlockComponent, CommonMistakesComponent, ChallengeBlockComponent,
    QuizBlockComponent, QnaBlockComponent, RevisionCardComponent, PageCompleteComponent],
  templateUrl: './dependency-inversion.html',
  styleUrl: './dependency-inversion.scss',
})
export class DpDependencyInversion {
  quickRef = quickRef; theory = theory; codeTabs = codeTabs;
  mistakes = mistakes; challenge = challenge; quiz = quiz; qna = qna; revision = revision;
}
