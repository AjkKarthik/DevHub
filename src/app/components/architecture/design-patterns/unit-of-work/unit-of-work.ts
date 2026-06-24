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
}

// Explicit transaction for extra control
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
