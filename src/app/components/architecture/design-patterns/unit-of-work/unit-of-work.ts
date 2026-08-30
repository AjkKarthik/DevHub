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
  { name: 'Unit of Work',    type: 'class',     desc: 'Tracks all changes made during a business transaction and commits them atomically in a single database round-trip.' },
  { name: 'SaveChanges()',   type: 'method',    desc: 'The commit operation — flushes all pending inserts/updates/deletes as a single SQL transaction.' },
  { name: 'DbContext',       type: 'class',     desc: 'EF Core\'s DbContext IS a Unit of Work — it tracks entity changes and SaveChangesAsync() commits all at once.' },
  { name: 'IUnitOfWork',     type: 'interface', desc: 'Abstraction over DbContext — expose SaveChangesAsync() and repository accessors; used for testability.' },
  { name: 'Transaction',     type: 'keyword',   desc: 'Unit of Work ensures atomicity — either all changes commit or all roll back on failure.' },
  { name: 'Change Tracker',  type: 'keyword',   desc: 'EF Core\'s internal state machine that records Added/Modified/Deleted entities before committing.' },
];

const theory: TheoryPoint[] = [
  {
    heading: 'What is Unit of Work?',
    points: [
      'Unit of Work tracks objects affected by a business transaction and coordinates writing out changes.',
      'Instead of each repository committing immediately, changes are batched and committed atomically.',
      'One business operation (e.g. "place order") may touch multiple aggregates — UoW groups them into one transaction.',
      'On failure, none of the changes persist — all or nothing.',
    ],
  },
  {
    heading: 'EF Core as Unit of Work',
    points: [
      'DbContext is EF Core\'s built-in Unit of Work — it tracks all entity changes via its Change Tracker.',
      'SaveChangesAsync() flushes all pending changes as a single SQL transaction automatically.',
      'DbSet<T> is EF Core\'s built-in Repository — wrapping it is often optional.',
      'Registering DbContext as Scoped gives one UoW per HTTP request — the natural unit of work for web apps.',
    ],
  },
  {
    heading: 'IUnitOfWork Interface',
    points: [
      'Wrapping DbContext in IUnitOfWork enables testing without a real database.',
      'IUnitOfWork exposes SaveChangesAsync() and repository properties (Orders, Customers).',
      'Domain services depend on IUnitOfWork — not on the concrete DbContext.',
      'In tests, inject a fake/mock IUnitOfWork that captures calls without hitting the DB.',
    ],
  },
  {
    heading: 'Unit of Work vs Transaction',
    points: [
      'UoW is a higher-level pattern — it accumulates domain-level changes across repository operations.',
      'A database transaction is a lower-level mechanism — UoW usually maps to one transaction.',
      'For cross-aggregate transactions, use UoW; for cross-database transactions, use a saga or outbox instead.',
      'Nested UoW (UoW inside UoW) is usually a design smell — one UoW per business operation.',
    ],
  },
  {
    heading: 'Unit of Work Coordinating Multiple Repository Changes Atomically',
    points: [
      'Unit of Work tracks all changes (new, modified, deleted objects) made during a single business transaction across potentially multiple Repositories, and commits them all together as one atomic database transaction — without it, each Repository operation might commit independently, risking a partially-applied set of changes if one operation fails partway through.',
      'This pattern is what allows a business operation touching multiple aggregates (updating an Order and creating a related Invoice) to succeed or fail as a single unit, rather than risking one change committing while a related change fails, leaving the database in an inconsistent state.',
      'Many ORMs (Entity Framework\'s DbContext, for example) implement Unit of Work internally — changes tracked across multiple repository-like operations are only actually persisted when SaveChanges() is called, meaning developers using such an ORM are often using Unit of Work implicitly without hand-rolling it themselves.',
      'Unit of Work and Repository are complementary but distinct patterns — Repository abstracts HOW individual objects are persisted, while Unit of Work coordinates WHEN a batch of changes across potentially multiple repositories is actually committed together as one transaction.',
    ],
  },
];

const codeTabs: CodeTab[] = [
  {
    label: 'IUnitOfWork + Repositories',
    language: 'csharp',
    code: `// Unit of Work interface — exposes repositories and SaveChanges
public interface IUnitOfWork : IDisposable
{
    IOrderRepository    Orders    { get; }
    ICustomerRepository Customers { get; }
    IInventoryRepository Inventory { get; }

    Task<int> SaveChangesAsync(CancellationToken ct = default);
}

// EF Core implementation
public class AppUnitOfWork(AppDbContext db) : IUnitOfWork
{
    private IOrderRepository?    _orders;
    private ICustomerRepository? _customers;
    private IInventoryRepository? _inventory;

    // Lazy repository initialisation
    public IOrderRepository    Orders    => _orders    ??= new OrderRepository(db);
    public ICustomerRepository Customers => _customers ??= new CustomerRepository(db);
    public IInventoryRepository Inventory => _inventory ??= new InventoryRepository(db);

    public Task<int> SaveChangesAsync(CancellationToken ct = default) =>
        db.SaveChangesAsync(ct);

    public void Dispose() => db.Dispose();
}

// Register both DbContext and UoW as Scoped (same scope = same DbContext instance)
builder.Services.AddDbContext<AppDbContext>(...);
builder.Services.AddScoped<IUnitOfWork, AppUnitOfWork>();

// Domain service — orchestrates across multiple repositories
public class PlaceOrderService(IUnitOfWork uow)
{
    public async Task<OrderId> PlaceOrderAsync(PlaceOrderCommand cmd, CancellationToken ct)
    {
        // Multiple aggregates changed in one business operation
        var customer  = await uow.Customers.GetByIdAsync(cmd.CustomerId, ct)
                        ?? throw new CustomerNotFoundException(cmd.CustomerId);

        var inventory = await uow.Inventory.GetForItemsAsync(cmd.Items, ct);
        inventory.Reserve(cmd.Items); // may throw InsufficientStockException

        var order = customer.PlaceOrder(cmd.Items, cmd.ShippingAddress);
        await uow.Orders.AddAsync(order, ct);
        uow.Inventory.UpdateRange(inventory.Items);

        // ONE commit — all or nothing
        await uow.SaveChangesAsync(ct);
        return order.Id;
    }
}`,
  },
  {
    label: 'EF Core DbContext as UoW',
    language: 'csharp',
    code: `// DbContext IS the Unit of Work — no wrapper needed for simple cases
public class ShopDbContext(DbContextOptions<ShopDbContext> options) : DbContext(options)
{
    public DbSet<Order>    Orders    => Set<Order>();
    public DbSet<Customer> Customers => Set<Customer>();
    public DbSet<Product>  Products  => Set<Product>();

    protected override void OnModelCreating(ModelBuilder mb)
    {
        mb.ApplyConfigurationsFromAssembly(typeof(ShopDbContext).Assembly);
    }
}

// Service using DbContext directly — perfectly valid for many apps
public class OrderService(ShopDbContext db)
{
    public async Task ProcessOrderAsync(Guid orderId, CancellationToken ct)
    {
        var order    = await db.Orders.Include(o => o.Items).FirstOrDefaultAsync(o => o.Id == orderId, ct);
        var products = await db.Products.Where(p => order!.Items.Select(i => i.ProductId).Contains(p.Id)).ToListAsync(ct);

        order!.Process(products);          // domain logic updates order state
        foreach (var p in products) p.DecrementStock(1); // inventory update

        await db.SaveChangesAsync(ct); // single transaction — order + products committed together
    }

    // Explicit transaction for extra control — a second method on the
    // SAME OrderService, so 'db' resolves to the class's own
    // primary-constructor parameter.
    public async Task TransferFundsAsync(Guid fromId, Guid toId, decimal amount)
    {
        await using var tx = await db.Database.BeginTransactionAsync();
        try
        {
            var from = await db.Accounts.FindAsync(fromId);
            var to   = await db.Accounts.FindAsync(toId);
            from!.Debit(amount);
            to!.Credit(amount);
            await db.SaveChangesAsync();
            await tx.CommitAsync();
        }
        catch
        {
            await tx.RollbackAsync();
            throw;
        }
    }
}`,
  },
];

const mistakes: CommonMistake[] = [
  {
    title: 'Each repository calls SaveChanges() independently',
    wrong: `public async Task AddAsync(Order order)
{
    await db.Orders.AddAsync(order);
    await db.SaveChangesAsync(); // partial commit — inventory not updated yet!
}`,
    right: `public async Task AddAsync(Order order) => await db.Orders.AddAsync(order);
// UoW commits everything together after all repositories finish`,
    explanation: 'Committing inside individual repositories breaks atomicity. If order commits but inventory update fails, the database is in an inconsistent state. SaveChanges must be called once, after all related changes are staged.',
  },
  {
    title: 'Registering DbContext as Transient (creates a new instance per repository call)',
    wrong: `builder.Services.AddTransient<AppDbContext>(...); // different instances — change tracking is lost`,
    right: `builder.Services.AddDbContext<AppDbContext>(...); // Scoped by default — shared per request`,
    explanation: 'Repositories sharing the same UoW must share the same DbContext instance. Transient DbContext creates a new instance per injection — repositories will have separate change trackers and SaveChanges on one won\'t commit the other\'s changes.',
  },
  {
    title: 'Using multiple DbContexts in one business operation without coordination',
    wrong: `// OrderService and InventoryService each have their own DbContext
// Order commits but inventory fails — split-brain inconsistency`,
    right: `// Share one IUnitOfWork (one DbContext) across the whole operation
// Or use the Outbox pattern for cross-service atomicity`,
    explanation: 'Multiple independent DbContexts in one business operation cannot be committed atomically. Either share one DbContext via UoW for within-process scenarios, or use the Outbox pattern for cross-service eventual consistency.',
  },
  {
    title: 'Nesting UoW — creating a Unit of Work inside another UoW',
    wrong: `// OrderService creates UoW
// OrderService calls ShippingService which also creates a UoW
// Two separate transactions for one business operation`,
    right: `// Pass UoW into services; only the outermost orchestrator calls SaveChanges
// Or use domain events to trigger side effects after the main commit`,
    explanation: 'Nesting UoW creates two separate transactions for what should be one atomic operation. Pass the single UoW instance into all services involved in the business operation, or use domain events for clean separation.',
  },
];

const challenge: Challenge = {
  title: 'In-Memory Unit of Work',
  language: 'typescript',
  description: `Implement an in-memory Unit of Work that tracks changes.
UnitOfWork has: products (ProductRepository), orders (OrderRepository), commit().
commit() logs all pending operations and clears them.
Add a product and an order, then commit.`,
  hints: [
    'Track pending operations as an array of strings',
    'Repository add() pushes to pending operations',
    'commit() prints pending ops then clears them',
  ],
  starterCode: `class InMemoryUnitOfWork {
  products: { add(name: string): void };
  orders:   { add(id: string): void };
  private pending: string[] = [];

  // TODO: implement repositories and commit()
  commit(): void { /* flush pending */ }
}`,
  solution: `class InMemoryUnitOfWork {
  private pending: string[] = [];

  products = {
    add: (name: string) => this.pending.push(\`ADD product: \${name}\`),
  };

  orders = {
    add: (id: string) => this.pending.push(\`ADD order: \${id}\`),
  };

  commit(): void {
    if (this.pending.length === 0) { console.log('Nothing to commit'); return; }
    console.log('Committing transaction:');
    this.pending.forEach(op => console.log(' ', op));
    this.pending = [];
    console.log('Committed.');
  }
}

const uow = new InMemoryUnitOfWork();
uow.products.add('Widget');
uow.orders.add('ORD-001');
uow.commit();
// Committing transaction:
//   ADD product: Widget
//   ADD order: ORD-001
// Committed.`,
};

const quiz: QuizQuestion[] = [
  {
    q: 'What does EF Core\'s DbContext serve as in the Unit of Work pattern?',
    options: [
      'A Singleton service',
      'Both the Unit of Work (change tracking + SaveChanges) and the Repository (DbSet<T>)',
      'Only a Repository — it has no Unit of Work behaviour',
      'A connection pool manager',
    ],
    answer: 1,
    explanation: 'DbContext tracks all entity changes (Unit of Work) and DbSet<T> provides the collection-like interface for accessing entities (Repository). Adding an IUnitOfWork wrapper on top is optional — justified mainly for testability and abstraction.',
  },
  {
    q: 'Why must DbContext be registered as Scoped (not Transient) in ASP.NET Core?',
    options: [
      'Transient DbContext is too slow',
      'Repositories sharing a UoW must share the same DbContext instance — Transient creates separate instances with separate change trackers',
      'Scoped DbContext caches the connection pool',
      'DbContext cannot be Transient in .NET 8+',
    ],
    answer: 1,
    explanation: 'A Unit of Work relies on all repositories using the same DbContext instance to share the change tracker. Transient scope creates a new DbContext per injection — changes in one repository\'s DbContext are invisible to another, and SaveChanges commits only partial state.',
  },
  {
    q: 'Where should SaveChangesAsync() be called in a typical service that uses the Unit of Work pattern?',
    options: [
      'Inside each repository method after every change',
      'Inside the domain service after all related repository operations are complete',
      'In the controller action before returning the response',
      'In the DbContext constructor',
    ],
    answer: 1,
    explanation: 'The domain service (or application service / command handler) is the natural place to call SaveChanges — after all aggregates are updated and the business operation is complete. This ensures all changes commit atomically in one transaction.',
  },
  { q: 'What is the Unit of Work pattern and what does it track?', options: ['A task scheduler that tracks pending background jobs', 'A pattern that maintains a list of objects affected by a business transaction (new, modified, deleted) and coordinates writing out changes and resolving concurrency problems', 'A unit testing pattern for grouping related test methods', 'A pattern for batching database migrations into a single deployment unit'], answer: 1, explanation: 'Unit of Work (Martin Fowler, Patterns of Enterprise Application Architecture) tracks all objects read during a business transaction and coordinates persistence at the end. Instead of each repository writing to the database independently, all changes go through the Unit of Work. At commit: the UoW generates the minimal set of SQL statements to synchronize the in-memory state with the database. Entity Framework DbContext is a classic UoW implementation: track changes via Add(), Modify(), Remove() on DbSet (repositories), then call SaveChanges() once. This ensures atomicity: all changes commit or none do.' },
  { q: 'Why is it important for repositories to share the same Unit of Work?', options: ['Sharing a UoW allows repositories to reuse cached query results', 'Multiple repositories participating in the same business transaction must share a UoW (and its database connection/transaction) to ensure all their changes commit atomically together or roll back together', 'Shared UoW enables parallel repository operations on different threads', 'Repositories must share a UoW to avoid duplicate primary key assignment'], answer: 1, explanation: 'If two repositories in the same use case each have their own database connection/transaction, they cannot be part of the same atomic transaction. If OrderRepository.Add() commits immediately and ShipmentRepository.Add() then fails, you have an order without a shipment. The same Unit of Work provides the same database transaction context to all participating repositories. At the end of the use case, unitOfWork.Commit() calls SaveChanges() once, committing all changes from all repositories atomically. In EF Core: all repositories receive the same DbContext instance (registered as Scoped in DI per HTTP request).' },
  { q: 'What is the relationship between Unit of Work and the Repository pattern?', options: ['Unit of Work replaces Repository; they are alternatives', 'Repository is an abstraction for collection-like domain object access; Unit of Work is the coordinator that manages the database transaction scope and calls Commit when all repositories have done their work', 'Repository implements Unit of Work; every repository is also a unit of work', 'They operate independently; Unit of Work never interacts with repositories'], answer: 1, explanation: 'Repository and UoW are complementary. Repository hides the persistence mechanism (SQL, NoSQL) behind a collection-like interface. UoW tracks all changes across multiple repositories and ensures they commit together. The pattern: begin UoW (implicit in HTTP request scope). Multiple repositories add/modify/delete objects within the UoW. At the end of the use case, commit the UoW. The UoW generates and executes all database changes in one transaction. Each repository may internally reference the UoW to register new/modified/deleted objects. EF Core DbContext combines both concepts: DbSet<T> are repositories; DbContext itself is the UoW with SaveChanges().' },
];

const qna: QnaItem[] = [
  {
    q: 'When is wrapping DbContext in IUnitOfWork worth doing?',
    a: 'It is worth doing when: (1) unit tests must run without a real database — IUnitOfWork can be mocked, (2) the domain layer must be free of EF Core references, (3) you want to enforce a clear boundary where SaveChanges is called. For simple CRUD apps without complex domain logic, using DbContext directly is simpler and equally correct.',
  },
  {
    q: 'How does Unit of Work relate to the Outbox pattern?',
    a: 'Unit of Work handles atomicity within a single process and database. The Outbox pattern extends atomicity across process/service boundaries: domain events are written to an outbox table in the same transaction as the business change, then published to a message broker asynchronously. This avoids the two-phase commit problem in distributed systems.',
  },
  { q: 'How do you implement Unit of Work without Entity Framework?', a: 'Manual UoW: the UoW class holds a database connection and transaction. Begin() opens the connection and starts a transaction. Commit() commits the transaction and closes the connection. Rollback() rolls back on failure. Repositories receive the UoW and use its connection for their SQL commands. The UoW can maintain identity maps (tracking loaded objects by ID to prevent duplicates) and change tracking (dirty checking or explicit registration). Implementation: IUnitOfWork { IOrderRepository Orders; ICustomerRepository Customers; Task<int> CommitAsync(); }. Infrastructure: SqlUnitOfWork opens a SqlConnection, wraps operations in a SqlTransaction, passes the connection to all repositories. This is more complex than EF Core but useful with Dapper or raw SQL.' },
  { q: 'How does Unit of Work handle concurrency conflicts?', a: 'Optimistic concurrency with UoW: each entity has a row version or timestamp column. On UPDATE, the SQL includes WHERE RowVersion = @original. If another transaction changed the row since we loaded it, the row version mismatches and the UPDATE affects 0 rows. EF Core detects 0 affected rows and throws a DbUpdateConcurrencyException. The UoW caller catches the exception and resolves the conflict: reload and merge, notify the user, or retry. EF Core provides DbEntry.GetDatabaseValues() to load the current database values for comparison. Strategies: client wins (overwrite), database wins (discard changes), or custom merge logic per entity type.' },
  { q: 'What are the risks of a long-running Unit of Work?', a: 'A Unit of Work that spans a long period (minutes or hours) creates risks: long-held database transactions block other readers/writers (pessimistic locking scenarios). Change tracking memory grows as more objects are loaded. Dirty objects accumulate and the commit may fail due to external changes (concurrency conflicts). For long-running processes (import jobs, batch processing): use many short-lived UoWs, each handling a small batch of records. Avoid loading all records into a single UoW. In HTTP APIs: the request scope is the natural UoW boundary (one UoW per HTTP request). EF Core DbContext as Scoped ensures this. For background jobs: create a new scope (and DbContext) per job chunk.' },
  { q: 'How do you test code that uses Unit of Work?', a: 'Testing with UoW: option 1 - use an in-memory database (SQLite in-memory or EF Core InMemory provider). Create a fresh DbContext per test. Populate with test data. Execute the use case. Assert by querying the DbContext directly. Fast, tests real EF Core query/save behavior. Option 2 - mock IUnitOfWork and IRepository interfaces. Inject mocks. Verify that CommitAsync() was called once and the right repository methods were called. Faster but does not test SQL generation or EF Core behavior. Recommendation: use in-memory databases for integration tests covering the entire data stack. Use mocks only for isolated business logic unit tests where the data layer is irrelevant.' },
];

const revision: RevisionSummary = {
  oneLiner: 'Unit of Work tracks all changes across multiple repositories and commits them atomically in one transaction — EF Core\'s DbContext is the built-in implementation.',
  mustKnow: [
    'UoW ensures atomicity: all changes commit or all roll back together',
    'DbContext IS a UoW; DbSet<T> IS a Repository — no wrapper needed for simple apps',
    'Register DbContext as Scoped — all repositories in one request share the same instance',
    'SaveChanges goes in the service (after all work), not inside individual repositories',
    'IUnitOfWork wrapper adds value for testability and EF decoupling, not for basic CRUD',
  ],
  interviewFocus: [
    'What does DbContext serve as in the Repository + UoW patterns?',
    'Why must DbContext be Scoped, not Transient?',
    'When is an IUnitOfWork wrapper justified vs redundant?',
  ],
};

@Component({
  selector: 'app-dp-unit-of-work',
  standalone: true,
  imports: [CommonModule, PageMetaComponent, QuickRefComponent, TheoryBlockComponent,
    CodeBlockComponent, CommonMistakesComponent, ChallengeBlockComponent,
    QuizBlockComponent, QnaBlockComponent, RevisionCardComponent, PageCompleteComponent],
  templateUrl: './unit-of-work.html',
  styleUrl: './unit-of-work.scss',
})
export class DpUnitOfWork {
  quickRef = quickRef; theory = theory; codeTabs = codeTabs;
  mistakes = mistakes; challenge = challenge; quiz = quiz; qna = qna; revision = revision;
}
