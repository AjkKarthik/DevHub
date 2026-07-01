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
  { name: 'CQRS',         type: 'keyword',   desc: 'Command Query Responsibility Segregation — separate the read model from the write model.' },
  { name: 'Command',      type: 'class',     desc: 'Intent to change state — PlaceOrderCommand, CancelOrderCommand. Returns void or an ID, never data.' },
  { name: 'Query',        type: 'class',     desc: 'Request for data — GetOrderQuery. Returns a DTO; must have no side effects.' },
  { name: 'Handler',      type: 'class',     desc: 'Processes one command or query — one class per command/query. Wired by MediatR or similar.' },
  { name: 'MediatR',      type: 'class',     desc: '.NET in-process mediator — sends commands/queries to their handlers via IRequest<T> / IRequestHandler<T>.' },
  { name: 'Read Model',   type: 'keyword',   desc: 'Optimised read-only projection — can be a separate table, view, or even a different database (Redis, Elasticsearch).' },
];

const theory: TheoryPoint[] = [
  {
    heading: 'What is CQRS?',
    points: [
      'CQRS separates the read model (queries) from the write model (commands) into distinct code paths.',
      'Commands change state and return void or a minimal result (e.g. created ID).',
      'Queries read state and return data — they must never change state.',
      'This separation allows each side to be optimised independently.',
    ],
  },
  {
    heading: 'Commands vs Queries',
    points: [
      'Command: intent to change something — PlaceOrderCommand, UpdateProfileCommand. Has validation, business rules.',
      'Query: data request — GetOrderByIdQuery, ListProductsQuery. Can be highly optimised (raw SQL, cached projections).',
      'Command handlers use the rich domain model (aggregates, repositories).',
      'Query handlers bypass the domain — they read directly from the database for performance.',
    ],
  },
  {
    heading: 'CQRS Spectrum',
    points: [
      'Simple CQRS: same database, separate read/write classes. Easiest to adopt — just the code separation.',
      'Read model projection: dedicated read tables or views optimised for query performance.',
      'Full CQRS + Event Sourcing: write side emits events; read side builds projections from events.',
      'Distributed CQRS: separate read database (Redis, Elasticsearch) from write DB — synchronised by events.',
    ],
  },
  {
    heading: 'MediatR and CQRS in .NET',
    points: [
      'MediatR is the standard .NET library for in-process CQRS — sends IRequest<T> to IRequestHandler<T>.',
      'Commands implement IRequest<Unit> (void) or IRequest<Guid> (returns created ID).',
      'Queries implement IRequest<T> where T is the DTO returned.',
      'Pipeline behaviours (IPipelineBehavior<T>) add cross-cutting concerns: validation, logging, auth.',
    ],
  },
  {
    heading: 'CQRS as a Pattern, Not an All-or-Nothing Architecture',
    points: [
      'CQRS (splitting command/write operations from query/read operations into separate models) can be applied at different granularities — from a lightweight convention of separate Command and Query classes within a single shared database, up to fully separate read and write data stores.',
      'Lightweight CQRS (separate command/query handler classes, same underlying database) captures much of the pattern\'s organizational clarity benefit with far less operational complexity than a fully separated architecture — a pragmatic middle ground many teams find sufficient.',
      'Full CQRS with separate read/write stores introduces eventual consistency between them — a write may not be immediately visible in the read model, which the application and UI must explicitly account for (e.g., optimistic UI updates) rather than assuming synchronous read-after-write consistency.',
      'Applying full CQRS uniformly across an entire application, including simple CRUD screens with no genuine read/write complexity divergence, adds unnecessary architectural overhead — the pattern earns its complexity specifically for use cases where read and write models genuinely need to differ.',
    ],
  },
];

const codeTabs: CodeTab[] = [
  {
    label: 'Commands & Queries (MediatR)',
    language: 'csharp',
    code: `// Commands — intent to change state
public record PlaceOrderCommand(Guid CustomerId, List<OrderItem> Items) : IRequest<Guid>;

public class PlaceOrderHandler(IOrderRepository orders, IUnitOfWork uow)
    : IRequestHandler<PlaceOrderCommand, Guid>
{
    public async Task<Guid> Handle(PlaceOrderCommand cmd, CancellationToken ct)
    {
        var order = Order.Create(cmd.CustomerId, cmd.Items);
        await orders.AddAsync(order, ct);
        await uow.SaveChangesAsync(ct);
        return order.Id;
    }
}

public record CancelOrderCommand(Guid OrderId, string Reason) : IRequest;

public class CancelOrderHandler(IOrderRepository orders, IUnitOfWork uow)
    : IRequestHandler<CancelOrderCommand>
{
    public async Task Handle(CancelOrderCommand cmd, CancellationToken ct)
    {
        var order = await orders.GetByIdAsync(cmd.OrderId, ct)
                    ?? throw new OrderNotFoundException(cmd.OrderId);
        order.Cancel(cmd.Reason);
        await uow.SaveChangesAsync(ct);
    }
}

// Queries — read-only, return DTOs
public record GetOrderQuery(Guid OrderId) : IRequest<OrderDto?>;

public class GetOrderHandler(AppDbContext db)
    : IRequestHandler<GetOrderQuery, OrderDto?>
{
    public async Task<OrderDto?> Handle(GetOrderQuery q, CancellationToken ct) =>
        await db.Orders
            .Where(o => o.Id == q.OrderId)
            .Select(o => new OrderDto(o.Id, o.Status, o.Total, o.CreatedAt))
            .FirstOrDefaultAsync(ct);
}

// Controller — thin; just sends command/query to MediatR
[ApiController, Route("api/orders")]
public class OrdersController(IMediator mediator) : ControllerBase
{
    [HttpPost]
    public async Task<IActionResult> Place(PlaceOrderCommand cmd) =>
        Ok(await mediator.Send(cmd));

    [HttpDelete("{id}")]
    public async Task<IActionResult> Cancel(Guid id, [FromBody] string reason) =>
    {
        await mediator.Send(new CancelOrderCommand(id, reason));
        return NoContent();
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> Get(Guid id) =>
        Ok(await mediator.Send(new GetOrderQuery(id)));
}`,
  },
  {
    label: 'Pipeline Behaviour (Validation)',
    language: 'csharp',
    code: `// Pipeline behaviour — adds cross-cutting concerns to ALL commands/queries
public class ValidationBehaviour<TRequest, TResponse>(IEnumerable<IValidator<TRequest>> validators)
    : IPipelineBehavior<TRequest, TResponse>
    where TRequest : IRequest<TResponse>
{
    public async Task<TResponse> Handle(
        TRequest request, RequestHandlerDelegate<TResponse> next, CancellationToken ct)
    {
        if (!validators.Any()) return await next();

        var context = new ValidationContext<TRequest>(request);
        var failures = validators
            .Select(v => v.Validate(context))
            .SelectMany(r => r.Errors)
            .Where(f => f is not null)
            .ToList();

        if (failures.Count > 0)
            throw new ValidationException(failures);

        return await next();
    }
}

// Validator — FluentValidation
public class PlaceOrderCommandValidator : AbstractValidator<PlaceOrderCommand>
{
    public PlaceOrderCommandValidator()
    {
        RuleFor(x => x.CustomerId).NotEmpty();
        RuleFor(x => x.Items).NotEmpty().WithMessage("Order must have at least one item");
        RuleForEach(x => x.Items).SetValidator(new OrderItemValidator());
    }
}

// Registration
builder.Services.AddMediatR(cfg => cfg.RegisterServicesFromAssembly(typeof(Program).Assembly));
builder.Services.AddTransient(typeof(IPipelineBehavior<,>), typeof(ValidationBehaviour<,>));
builder.Services.AddValidatorsFromAssembly(typeof(Program).Assembly);`,
  },
];

const mistakes: CommonMistake[] = [
  {
    title: 'Commands returning rich domain objects or large DTOs',
    wrong: `public record PlaceOrderCommand(...) : IRequest<Order>; // returns full domain object`,
    right: `public record PlaceOrderCommand(...) : IRequest<Guid>; // returns only the new ID`,
    explanation: 'Commands should return minimal results — at most the ID of the created entity. Returning rich objects from commands couples the write side to the read format, blurring the CQRS separation. Callers can immediately issue a query if they need the full data.',
  },
  {
    title: 'Query handlers using the full domain model and repositories',
    wrong: `public async Task<OrderDto> Handle(GetOrderQuery q, CancellationToken ct)
{
    var order = await orderRepo.GetWithItemsAsync(q.OrderId, ct); // loads full aggregate
    return mapper.Map<OrderDto>(order); // maps from domain model
}`,
    right: `// Query handlers read directly from the database — project to DTO in SQL
await db.Orders.Where(o => o.Id == q.OrderId)
    .Select(o => new OrderDto(...)).FirstOrDefaultAsync(ct);`,
    explanation: 'Query handlers should bypass the domain model and read directly from the database for efficiency. Loading a full aggregate just to map it to a DTO adds unnecessary round-trips, lazy-load traps, and processing.',
  },
  {
    title: 'Using CQRS in simple CRUD applications',
    wrong: `// For a simple admin CRUD form: PlaceOrderCommand + GetOrderQuery + two handlers
// When a single OrderService.Create() would do the same job with less code`,
    right: `// CQRS adds value when: read/write loads differ significantly, write side has complex
// business rules, or read models need independent optimisation (caching, projections)`,
    explanation: 'CQRS adds structural complexity. For simple CRUD apps where reads and writes are symmetric, a single service class is simpler and equally correct. Adopt CQRS when the read and write sides genuinely need different optimisation.',
  },
  {
    title: 'Putting business logic in command handlers instead of the domain',
    wrong: `public async Task<Guid> Handle(PlaceOrderCommand cmd, CancellationToken ct)
{
    if (cmd.Items.Sum(i => i.Price) > 10000) throw new Exception("Order too large"); // biz rule in handler!
}`,
    right: `// Business rules belong in the domain (Order.Create, Order.Cancel, etc.)
// Handler orchestrates: fetch, call domain, persist`,
    explanation: 'Command handlers are orchestrators — they call domain methods, not implement domain logic. Business rules in handlers cannot be reused from other commands and bypass the invariants the domain model enforces.',
  },
];

const challenge: Challenge = {
  title: 'Simple CQRS Message Bus',
  language: 'typescript',
  description: `Build a simple in-process CQRS mediator.
Commands: CreateUserCommand(name) → returns userId string.
Queries: GetUserQuery(id) → returns User | undefined.
Mediator has send<T>(message) that routes to the right handler.`,
  hints: [
    'Store handlers in a Map keyed by command/query name',
    'Commands mutate state; queries read it',
    'Use a type discriminator field to route',
  ],
  starterCode: `interface User { id: string; name: string; }

type CreateUserCommand = { type: 'CreateUser'; name: string };
type GetUserQuery      = { type: 'GetUser'; id: string };

class Mediator {
  private users = new Map<string, User>();
  // TODO: implement send() that routes CreateUser and GetUser
}`,
  solution: `interface User { id: string; name: string; }

type CreateUserCommand = { type: 'CreateUser'; name: string };
type GetUserQuery      = { type: 'GetUser'; id: string };

class Mediator {
  private users = new Map<string, User>();
  private nextId = 1;

  send(msg: CreateUserCommand): string;
  send(msg: GetUserQuery): User | undefined;
  send(msg: CreateUserCommand | GetUserQuery): string | User | undefined {
    if (msg.type === 'CreateUser') {
      const id = String(this.nextId++);
      this.users.set(id, { id, name: msg.name });
      return id;
    }
    return this.users.get(msg.id);
  }
}

const m = new Mediator();
const id = m.send({ type: 'CreateUser', name: 'Alice' });
console.log(id);                                  // "1"
console.log(m.send({ type: 'GetUser', id }));    // { id: '1', name: 'Alice' }
console.log(m.send({ type: 'GetUser', id: '99' })); // undefined`,
};

const quiz: QuizQuestion[] = [
  {
    q: 'What is the core principle of CQRS?',
    options: [
      'Separate each database table into its own service',
      'Separate the read model (queries) from the write model (commands) — each optimised independently',
      'Use a separate database for every microservice',
      'Commands and queries must use different programming languages',
    ],
    answer: 1,
    explanation: 'CQRS separates Commands (state changes) from Queries (reads) into distinct code paths. The write side uses the rich domain model; the read side uses optimised projections. This allows each to scale, evolve, and be optimised independently.',
  },
  {
    q: 'What should a Command handler return?',
    options: [
      'The full domain object (e.g. Order) after mutation',
      'Void or a minimal result like the created entity\'s ID',
      'A complete DTO of the changed state for the caller\'s convenience',
      'The database row that was updated',
    ],
    answer: 1,
    explanation: 'Commands express intent to change state — they return void or at most the ID of a created entity. Returning full objects blurs the command/query separation. If the caller needs data after the command, they issue a separate query.',
  },
  {
    q: 'Which .NET library is the standard for implementing in-process CQRS?',
    options: ['AutoMapper', 'MediatR', 'FluentValidation', 'Polly'],
    answer: 1,
    explanation: 'MediatR is the standard .NET library for in-process CQRS. Commands and queries implement IRequest<T>; handlers implement IRequestHandler<TRequest, TResponse>. IPipelineBehavior<T> adds cross-cutting concerns like validation and logging.',
  },
  { q: 'What does CQRS stand for and what is its fundamental principle?', options: ['Centralized Query and Response System; all queries go through a central server', 'Command Query Responsibility Segregation; separate the model for writing data (commands) from the model for reading data (queries)', 'Continuous Query and Retry System; queries are retried until successful', 'Concurrent Queue with Rollback Support; commands can be rolled back on failure'], answer: 1, explanation: 'CQRS separates write operations (Commands) from read operations (Queries) at the model and potentially infrastructure level. Commands: change state, return no or minimal data (just an acknowledgment or ID), processed by command handlers that enforce business rules on the write model. Queries: return data, change no state, processed against a read model optimized for display (possibly a denormalized database, cache, or materialized view). This separation allows each side to be scaled, optimized, and evolved independently.' },
  { q: 'What are the main benefits of applying CQRS in a high-read system?', options: ['CQRS reduces write throughput to protect read performance', 'Separate read models can be optimized for query patterns (denormalized, cached, or pre-computed), scaling read replicas independently of write infrastructure without affecting command processing', 'CQRS automatically implements caching for all query results', 'It eliminates the need for a database by using event streams exclusively'], answer: 1, explanation: 'In systems with much more read traffic than write traffic, the read model can be: scaled independently (more read replicas), optimized for specific queries (denormalized tables avoiding expensive joins), pre-computed (materialized views updated via event handlers), cached (query results served from Redis or CDN). The write model enforces invariants and processes commands without being burdened by read optimization. This is useful for reporting, dashboards, and public APIs where read scalability is critical.' },
  { q: 'What is eventual consistency in the context of CQRS and when does it arise?', options: ['CQRS guarantees strong consistency by design', 'When commands and queries use separate storage, a lag exists between when a command is processed and when the read model is updated, creating a window where reads may return stale data', 'Eventual consistency in CQRS means the system recovers from failures eventually', 'Commands eventually become queries when the data is old enough'], answer: 1, explanation: 'In full CQRS with separate read/write databases, the read model is updated asynchronously (via events or projections) after a command completes. This creates a period of stale reads. Strategies: acknowledge the lag in the UI (show last updated timestamp). For critical flows, add a synchronous read-after-write for the issuing user. Use read-your-writes consistency for the command issuer by reading from the write model immediately after their command. Design the UX to not require immediate consistency: most users do not need to see the result of someone else action in real time.' },
];

const qna: QnaItem[] = [
  {
    q: 'Does CQRS require separate databases for reads and writes?',
    a: 'No. The simplest form of CQRS is just code separation — command and query classes against the same database. Separate read databases (Redis, Elasticsearch) are an optional scaling step when query performance demands it. Start with code separation and add separate read stores only when there is a concrete performance problem.',
  },
  {
    q: 'When should I NOT use CQRS?',
    a: 'Avoid CQRS in simple CRUD applications where reads and writes are symmetric and business logic is minimal. CQRS adds structural complexity (more classes, handlers, pipelines) that only pays off when: read and write loads differ significantly, the write side has complex domain logic, or read models need independent caching or optimisation. For basic admin panels, a simple service class is better.',
  },
  { q: 'How does CQRS combine with Event Sourcing?', a: 'CQRS and Event Sourcing are complementary but independent. Event Sourcing: instead of storing current state, store a sequence of domain events that produced the current state. Replay events to reconstruct state at any point in time. CQRS combined with Event Sourcing: commands produce events appended to the event store (write model). Read models (projections) subscribe to events and maintain denormalized views in separate databases optimized for query patterns. Benefits of combining: complete audit trail, temporal queries, ability to add new projections from historical events. Trade-offs: complex to implement, requires eventual consistency acceptance, and projection maintenance overhead.' },
  { q: 'How do you implement CQRS with MediatR in C#?', a: 'In C# with MediatR: Command: implement IRequest or IRequest<TResponse>. Command handler: implement IRequestHandler<TCommand, TResult>. Apply validation via a pipeline behavior. Query: implement IRequest<TResult> where TResult is the query response DTO. Query handler: implement IRequestHandler<TQuery, TResult>, optimized for reads (may use Dapper for direct SQL instead of EF Core navigation properties). Register MediatR and handlers with DI. Controllers send commands and queries via mediator.Send(). This naturally implements CQRS: commands go to command handlers with write models, queries go to query handlers with read models. Cross-cutting concerns (logging, validation, transactions) go in pipeline behaviors.' },
  { q: 'What are the downsides of CQRS and when should you avoid it?', a: 'CQRS downsides: increased complexity — instead of one CRUD model, you maintain two models that must be kept in sync. Eventual consistency introduces complexity for users expecting immediate read-after-write. More infrastructure required if using separate read/write databases. Higher cognitive overhead for developers learning the codebase. Avoid CQRS when: the system is a simple CRUD application without complex domain logic. Read and write traffic are comparable with no optimization pressure. The team is small and the added complexity outweighs the benefits. Strong consistency is required everywhere. Start simple and apply CQRS only in bounded contexts where the separation genuinely addresses a specific performance, scalability, or modeling problem.' },
  { q: 'How do you handle validation in a CQRS command pipeline?', a: 'Validation in CQRS typically uses pipeline behaviors (middleware). MediatR pipeline behavior pattern: a ValidationBehavior implements IPipelineBehavior<TRequest, TResponse>. It runs FluentValidation validators for the command. If validation fails, it throws a ValidationException or returns a failure Result without calling the command handler. This keeps validation out of the command handler, which focuses only on business logic. Multiple validation passes: input validation (format, required fields) in the behavior before the handler. Domain validation (business rules) inside the handler using domain objects. Separating these ensures the handler receives only structurally valid input.' },
];

const revision: RevisionSummary = {
  oneLiner: 'CQRS separates Commands (state changes) from Queries (reads) — each optimised independently, with commands using the rich domain model and queries reading directly from the database.',
  mustKnow: [
    'Commands change state; queries read state — never mix the two responsibilities',
    'Command handlers: fetch aggregate → apply domain method → save. Return void or ID.',
    'Query handlers: project directly from DB to DTO — bypass domain model for efficiency',
    'MediatR is the standard .NET library: IRequest<T> + IRequestHandler<T>',
    'Pipeline behaviours (IPipelineBehavior) add validation, logging, auth across all handlers',
  ],
  interviewFocus: [
    'What does CQRS stand for and what problem does it solve?',
    'Why should query handlers bypass the domain model?',
    'When is CQRS over-engineering? When does it add value?',
  ],
};

@Component({
  selector: 'app-dp-cqrs',
  standalone: true,
  imports: [CommonModule, PageMetaComponent, QuickRefComponent, TheoryBlockComponent,
    CodeBlockComponent, CommonMistakesComponent, ChallengeBlockComponent,
    QuizBlockComponent, QnaBlockComponent, RevisionCardComponent, PageCompleteComponent],
  templateUrl: './cqrs.html',
  styleUrl: './cqrs.scss',
})
export class DpCqrs {
  quickRef = quickRef; theory = theory; codeTabs = codeTabs;
  mistakes = mistakes; challenge = challenge; quiz = quiz; qna = qna; revision = revision;
}
