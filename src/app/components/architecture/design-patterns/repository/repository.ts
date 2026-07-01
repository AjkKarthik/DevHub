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
  { name: 'Repository',    type: 'interface', desc: 'Mediates between the domain and data mapping layers — domain objects interact with an in-memory collection abstraction.' },
  { name: 'IRepository<T>', type: 'interface', desc: 'Generic repository interface: GetById, GetAll, Add, Update, Delete, Find(predicate).' },
  { name: 'Unit of Work',  type: 'class',     desc: 'Companion pattern — tracks changes across multiple repositories and commits in a single transaction.' },
  { name: 'Aggregate Root', type: 'class',    desc: 'Repositories expose methods only for aggregate roots — never for child entities directly.' },
  { name: 'Specification', type: 'class',     desc: 'Encapsulate query predicates as composable objects — passed to Find() instead of raw LINQ or SQL.' },
  { name: 'EF Core DbSet', type: 'class',     desc: 'DbSet<T> is effectively a Repository; EF Core\'s DbContext is the Unit of Work — wrapping them is often redundant.' },
];

const theory: TheoryPoint[] = [
  {
    heading: 'What is the Repository Pattern?',
    points: [
      'Repository provides a collection-like interface for accessing domain objects — hiding persistence details.',
      'Domain code uses repositories as if data lived in memory: Add(), Remove(), Find().',
      'The persistence technology (SQL, NoSQL, API) is an implementation detail behind the interface.',
      'Repositories return domain objects — not DTOs or raw rows.',
    ],
  },
  {
    heading: 'Repository Scope: Aggregate Roots Only',
    points: [
      'In DDD, repositories are defined only for aggregate roots — the top-level entity that owns a cluster of related objects.',
      'OrderRepository exists; OrderLineRepository should not — OrderLine is accessed through Order.',
      'This boundary enforces the aggregate consistency rule: changes to an aggregate go through the root.',
      'One repository per aggregate root; the root repository manages children.',
    ],
  },
  {
    heading: 'Generic vs Specific Repositories',
    points: [
      'Generic (IRepository<T>): covers CRUD — fast to set up, good for simple entities.',
      'Specific (IOrderRepository): includes domain-meaningful query methods like GetPendingOrders(), FindByCustomer().',
      'Best practice: combine them — inherit from IRepository<T> and add domain-specific methods.',
      'Avoid leaking IQueryable<T> from repositories — it couples callers to EF Core and breaks the abstraction.',
    ],
  },
  {
    heading: 'Repository vs EF Core DbSet',
    points: [
      'DbSet<T> is already a repository and DbContext is already a Unit of Work — wrapping them adds a layer.',
      'Wrapping is justified when: testability is needed without a real DB, multiple data sources exist, domain logic must be decoupled from EF.',
      'Avoid generic repositories that just delegate to DbSet — they add no value and complicate the code.',
      'The specification pattern (Find(ISpecification<T>)) is the main reason to wrap DbSet in complex domains.',
    ],
  },
  {
    heading: 'Repository as a Collection-Like Abstraction Over Persistence',
    points: [
      'Repository presents domain/business logic with a collection-like interface (Add, Remove, GetById, Find) for accessing persisted objects, hiding the actual underlying persistence technology (SQL, a document store, an in-memory cache) entirely behind that abstraction.',
      'This abstraction is what makes business logic testable without a real database — tests can substitute an in-memory Repository implementation, letting business logic tests run fast and in isolation, while a production Repository implementation talks to the real database.',
      'A common anti-pattern is a "leaky" Repository that exposes query-building details (like exposing an IQueryable directly) to calling code — this defeats the purpose of the abstraction, since callers become coupled to the specific query capabilities of the underlying persistence technology rather than a clean domain-focused interface.',
      'Repository should generally operate at the AGGREGATE level in DDD terms (one repository per aggregate root, not per individual entity or table) — this keeps the repository\'s interface aligned with genuine transactional/consistency boundaries rather than merely mirroring low-level database table structure.',
    ],
  },
];

const codeTabs: CodeTab[] = [
  {
    label: 'Generic + Specific Repository',
    language: 'csharp',
    code: `// Generic repository interface
public interface IRepository<T> where T : Entity
{
    Task<T?>            GetByIdAsync(Guid id, CancellationToken ct = default);
    Task<IReadOnlyList<T>> GetAllAsync(CancellationToken ct = default);
    Task<IReadOnlyList<T>> FindAsync(Expression<Func<T, bool>> predicate, CancellationToken ct = default);
    Task AddAsync(T entity, CancellationToken ct = default);
    void Update(T entity);
    void Remove(T entity);
}

// Specific repository — adds domain-meaningful methods
public interface IOrderRepository : IRepository<Order>
{
    Task<IReadOnlyList<Order>> GetPendingOrdersAsync(CancellationToken ct = default);
    Task<IReadOnlyList<Order>> GetByCustomerAsync(Guid customerId, CancellationToken ct = default);
    Task<Order?> GetWithItemsAsync(Guid orderId, CancellationToken ct = default);
}

// EF Core implementation
public class OrderRepository(AppDbContext db) : IOrderRepository
{
    public Task<Order?> GetByIdAsync(Guid id, CancellationToken ct = default) =>
        db.Orders.FindAsync([id], ct).AsTask();

    public async Task<IReadOnlyList<Order>> GetAllAsync(CancellationToken ct = default) =>
        await db.Orders.ToListAsync(ct);

    public async Task<IReadOnlyList<Order>> FindAsync(
        Expression<Func<Order, bool>> predicate, CancellationToken ct = default) =>
        await db.Orders.Where(predicate).ToListAsync(ct);

    public Task AddAsync(Order entity, CancellationToken ct = default) =>
        db.Orders.AddAsync(entity, ct).AsTask();

    public void Update(Order entity) => db.Orders.Update(entity);
    public void Remove(Order entity) => db.Orders.Remove(entity);

    // Domain-specific queries
    public async Task<IReadOnlyList<Order>> GetPendingOrdersAsync(CancellationToken ct = default) =>
        await db.Orders.Where(o => o.Status == OrderStatus.Pending).ToListAsync(ct);

    public async Task<IReadOnlyList<Order>> GetByCustomerAsync(Guid customerId, CancellationToken ct = default) =>
        await db.Orders.Where(o => o.CustomerId == customerId).ToListAsync(ct);

    public async Task<Order?> GetWithItemsAsync(Guid orderId, CancellationToken ct = default) =>
        await db.Orders.Include(o => o.Items).FirstOrDefaultAsync(o => o.Id == orderId, ct);
}

// Registration
builder.Services.AddScoped<IOrderRepository, OrderRepository>();

// Domain service — no EF Core dependency
public class OrderService(IOrderRepository orders, IUnitOfWork uow)
{
    public async Task<Order> CreateOrderAsync(CreateOrderCommand cmd)
    {
        var order = Order.Create(cmd.CustomerId, cmd.Items);
        await orders.AddAsync(order);
        await uow.SaveChangesAsync();
        return order;
    }
}`,
  },
  {
    label: 'Specification + Repository',
    language: 'csharp',
    code: `// Specification encapsulates query criteria
public interface ISpecification<T>
{
    Expression<Func<T, bool>> Criteria { get; }
    List<Expression<Func<T, object>>> Includes { get; }
    Expression<Func<T, object>>? OrderBy { get; }
    int? Take { get; }
    int? Skip { get; }
}

public abstract class Specification<T> : ISpecification<T>
{
    public Expression<Func<T, bool>> Criteria { get; protected set; } = _ => true;
    public List<Expression<Func<T, object>>> Includes { get; } = new();
    public Expression<Func<T, object>>? OrderBy { get; protected set; }
    public int? Take { get; protected set; }
    public int? Skip { get; protected set; }
}

// Domain-meaningful specification
public class RecentLargeOrdersSpec : Specification<Order>
{
    public RecentLargeOrdersSpec(decimal minAmount, int days)
    {
        var cutoff = DateTime.UtcNow.AddDays(-days);
        Criteria  = o => o.Total >= minAmount && o.CreatedAt >= cutoff;
        OrderBy   = o => o.Total;
        Take      = 50;
        Includes.Add(o => o.Customer);
    }
}

// Repository method that accepts specification
public interface IOrderRepository
{
    Task<IReadOnlyList<Order>> FindAsync(ISpecification<Order> spec, CancellationToken ct = default);
}

// EF Core evaluator applies the spec
public class EfSpecificationEvaluator
{
    public static IQueryable<T> Apply<T>(IQueryable<T> query, ISpecification<T> spec) where T : class
    {
        query = spec.Includes.Aggregate(query, (q, include) => q.Include(include));
        query = query.Where(spec.Criteria);
        if (spec.OrderBy is not null) query = query.OrderByDescending(spec.OrderBy);
        if (spec.Skip.HasValue)  query = query.Skip(spec.Skip.Value);
        if (spec.Take.HasValue)  query = query.Take(spec.Take.Value);
        return query;
    }
}

// Usage — clean, readable, testable
var spec   = new RecentLargeOrdersSpec(minAmount: 1000m, days: 30);
var orders = await orderRepo.FindAsync(spec);`,
  },
];

const mistakes: CommonMistake[] = [
  {
    title: 'Leaking IQueryable from repositories',
    wrong: `IQueryable<Order> GetOrders(); // caller adds Where, Include — tightly couples to EF Core`,
    right: `Task<IReadOnlyList<Order>> GetByCustomerAsync(Guid customerId, CancellationToken ct);`,
    explanation: 'IQueryable leaks EF Core to callers and prevents switching the data source. Return materialised collections (IReadOnlyList<T>) or use Specification to encapsulate queries inside the repository.',
  },
  {
    title: 'Creating repositories for every entity (not just aggregate roots)',
    wrong: `IOrderRepository orders;
IOrderLineRepository lines;   // OrderLine is a child — not an aggregate root
IOrderAddressRepository addrs; // same problem`,
    right: `IOrderRepository orders; // manages Order, OrderLine, OrderAddress together`,
    explanation: 'Repositories exist only for aggregate roots. Child entities (OrderLine, OrderAddress) are accessed through the root aggregate\'s repository. Creating a repository per entity breaks aggregate boundaries and allows inconsistent state.',
  },
  {
    title: 'Calling SaveChanges() inside the repository',
    wrong: `public async Task AddAsync(Order entity)
{
    await db.Orders.AddAsync(entity);
    await db.SaveChangesAsync(); // commits inside repository!
}`,
    right: `public async Task AddAsync(Order entity) => await db.Orders.AddAsync(entity);
// Caller or Unit of Work decides when to commit`,
    explanation: 'Repositories should not commit transactions. SaveChanges belongs to the Unit of Work layer so multiple repository operations can be grouped into a single atomic transaction.',
  },
  {
    title: 'Building a generic repository that wraps DbSet with no added value',
    wrong: `public class GenericRepository<T>(DbContext db) : IRepository<T>
{
    public IQueryable<T> GetAll() => db.Set<T>(); // just delegates to DbSet
}`,
    right: `// Use DbSet<T> directly for simple CRUD or create domain-specific repositories
// A generic wrapper that adds nothing is extra complexity without benefit`,
    explanation: 'Generic repositories that just wrap DbSet<T> methods add a layer of indirection with no benefit. Build repositories when you need to hide EF Core from the domain, add domain queries, or swap data sources. Otherwise use DbContext directly.',
  },
];

const challenge: Challenge = {
  title: 'In-Memory Product Repository',
  language: 'typescript',
  description: `Implement IProductRepository backed by an in-memory array.
Interface methods: getById(id), getAll(), findByCategory(category), add(product), remove(id).
Product has id, name, category, price.
Include a findByCategory that filters in memory.`,
  hints: [
    'Store products in a private array',
    'findByCategory filters by the category field',
    'getById returns undefined if not found',
  ],
  starterCode: `interface Product { id: string; name: string; category: string; price: number; }

interface IProductRepository {
  getById(id: string): Product | undefined;
  getAll(): Product[];
  findByCategory(category: string): Product[];
  add(product: Product): void;
  remove(id: string): void;
}

// TODO: InMemoryProductRepository`,
  solution: `interface Product { id: string; name: string; category: string; price: number; }

interface IProductRepository {
  getById(id: string): Product | undefined;
  getAll(): Product[];
  findByCategory(category: string): Product[];
  add(product: Product): void;
  remove(id: string): void;
}

class InMemoryProductRepository implements IProductRepository {
  private products: Product[] = [];

  getById(id: string): Product | undefined {
    return this.products.find(p => p.id === id);
  }

  getAll(): Product[] { return [...this.products]; }

  findByCategory(category: string): Product[] {
    return this.products.filter(p => p.category === category);
  }

  add(product: Product): void { this.products.push(product); }

  remove(id: string): void {
    this.products = this.products.filter(p => p.id !== id);
  }
}

const repo = new InMemoryProductRepository();
repo.add({ id: '1', name: 'Widget', category: 'Tools', price: 9.99 });
repo.add({ id: '2', name: 'Gadget', category: 'Electronics', price: 49.99 });
repo.add({ id: '3', name: 'Wrench', category: 'Tools', price: 14.99 });

console.log(repo.findByCategory('Tools')); // Widget, Wrench
console.log(repo.getById('2'));            // Gadget`,
};

const quiz: QuizQuestion[] = [
  {
    q: 'Which objects should have a repository in Domain-Driven Design?',
    options: [
      'Every entity and value object in the domain',
      'Only aggregate roots — the top-level entities that own a cluster of related objects',
      'Only entities with more than 5 fields',
      'Only entities that have a primary key',
    ],
    answer: 1,
    explanation: 'In DDD, repositories are defined only for aggregate roots. Child entities (like OrderLine inside Order) are accessed through the aggregate root\'s repository. This enforces aggregate boundaries and prevents inconsistent state.',
  },
  {
    q: 'Why should repositories NOT call SaveChanges()?',
    options: [
      'Because SaveChanges() is too slow for repositories',
      'Because multiple repository operations must be grouped into one transaction — that is the Unit of Work\'s job',
      'Because EF Core does not support SaveChanges() in repositories',
      'Because repositories work in-memory only',
    ],
    answer: 1,
    explanation: 'Committing inside the repository means each operation is an isolated transaction. When multiple aggregates need to change together (e.g. place order + update inventory), they must be in one transaction — the Unit of Work coordinates this.',
  },
  {
    q: 'What is the problem with returning IQueryable<T> from a repository?',
    options: [
      'IQueryable<T> is too slow',
      'It leaks the EF Core abstraction to callers — they become dependent on the ORM and the database cannot be swapped',
      'IQueryable<T> does not support LINQ',
      'It causes memory leaks',
    ],
    answer: 1,
    explanation: 'IQueryable<T> is an EF Core / LINQ-to-SQL interface. Leaking it from the repository means callers can write any LINQ query — the "data access abstraction" is gone. Return materialised collections (IReadOnlyList<T>) instead.',
  },
  { q: 'What is the Repository pattern and what layer does it belong to?', options: ['A Git repository hosting pattern for source code management', 'A design pattern in the data access layer that mediates between the domain and data mapping layers, presenting a collection-like interface for accessing domain objects', 'A pattern for centralizing application configuration and secrets', 'A pattern for managing in-memory caches of database results'], answer: 1, explanation: 'The Repository pattern (Eric Evans, Domain-Driven Design) presents domain objects as if they were an in-memory collection. Clients call repository.FindById(), repository.Add(), repository.Remove() without knowing whether data is in a SQL database, NoSQL store, or in-memory for tests. The repository belongs to the application/domain layer as an interface and the infrastructure layer as an implementation. It encapsulates all database query logic, keeping domain entities and use cases free from persistence concerns and ORMs.' },
  { q: 'What is the difference between Repository and DAO (Data Access Object)?', options: ['Repository stores objects in memory; DAO stores them in the database', 'Repository works at the domain aggregate level and is DDD-aware; DAO is a lower-level data access abstraction mapped directly to database tables without domain semantics', 'DAO is newer than Repository and replaces it in modern applications', 'They are identical patterns; the name depends on the framework used'], answer: 1, explanation: 'DAO: thin data-access wrapper mapped to a table or view. UserDAO.findByEmail() maps directly to SELECT * FROM users WHERE email=?. No domain behavior; just CRUD on a table. Repository: works with domain aggregates (DDD). OrderRepository.findByCustomerWithPendingItems() returns fully hydrated Order domain objects, not raw database rows. The repository may join multiple tables, apply business-relevant filtering, and return objects ready to use in domain logic. Repository is a higher-level abstraction that hides not just the SQL but the entire persistence model from the domain.' },
  { q: 'What is the Unit of Work pattern and how does it relate to Repository?', options: ['Unit of Work defines a single atomic database query', 'Unit of Work tracks changes across multiple repositories during a business transaction and commits them together, ensuring all-or-nothing persistence', 'Unit of Work manages memory allocation for large repository result sets', 'Unit of Work is an alternative to Repository that combines query and command responsibilities'], answer: 1, explanation: 'Unit of Work tracks object changes (new, modified, deleted) during a business operation. When the operation completes, it commits all changes in one transaction. Repositories work inside a Unit of Work: the Unit of Work provides the database context. Changes are tracked as you manipulate domain objects through repositories. At the end, unitOfWork.Commit() applies all tracked changes in a single transaction. Entity Framework DbContext is a Unit of Work implementation that tracks entities accessed through DbSet repositories. This ensures consistency: either all changes in an operation commit or none do.' },
];

const qna: QnaItem[] = [
  {
    q: 'Should I always add a repository layer on top of EF Core?',
    a: 'Not always. DbSet<T> is already a repository and DbContext is already a Unit of Work. Add a repository layer when: (1) you need to swap the data source, (2) unit-testing without a real database, (3) domain queries need encapsulation via Specification. For simple CRUD apps, using DbContext directly is fine and avoids unnecessary abstraction.',
  },
  {
    q: 'What is the difference between a generic IRepository<T> and a specific IOrderRepository?',
    a: 'Generic repositories cover standard CRUD operations uniformly. Specific repositories add domain-meaningful methods (GetPendingOrders, GetWithItems) that reflect business concepts. Best practice: inherit from IRepository<T> and add specific methods — you get both CRUD generics and domain-specific expressiveness.',
  },
  { q: 'How does the Repository pattern improve testability?', a: 'The repository interface (IOrderRepository) is defined in the domain/application layer. In unit tests, provide an in-memory implementation or a mock. The Use Case, Service, or Command Handler under test is instantiated with the test repository. Test data is set up by pre-populating the in-memory repository. After executing the use case, assert the expected state by querying the repository. No real database is needed; tests run in milliseconds. Integration tests use the real SQL repository implementation against a test database. This separation lets you test business logic at high speed and test data access logic separately.' },
  { q: 'Should you have a generic Repository<T> or specific repositories per aggregate?', a: 'Generic Repository<T>: provides reusable Add, FindById, FindAll, Remove, Update for any entity. Reduces code duplication. Drawback: exposes too broad an interface; any code can call FindAll() on any aggregate and write code that violates domain boundaries. Specific repositories (OrderRepository, CustomerRepository): define only the queries relevant to each aggregate. Enforces domain-driven queries. Callers cannot do arbitrary queries outside the defined interface. Recommendation: start with specific repositories for each aggregate root. Add a generic base repository as an implementation detail (not a public interface). Expose only domain-relevant query methods publicly.' },
  { q: 'What is the specification pattern and how does it combine with Repository?', a: 'A Specification encapsulates a query predicate as an object: class PremiumCustomerSpec : ISpecification<Customer> { bool IsSatisfiedBy(Customer c) => c.IsPremium && c.TotalSpend > 1000; }. Repository accepts specifications: FindAll(spec) returns all matching entities. Benefits: reusable, composable query logic. Combine specifications: new AndSpec(premiumSpec, activeSpec). The repository translates the specification to SQL in the infrastructure layer. Simple specifications can be implemented as LINQ expression trees that Entity Framework translates to SQL. More complex: use a PredicateBuilder or the Ardalis.Specification library. Useful for complex filtering in query-heavy domains without polluting the repository interface with dozens of query methods.' },
  { q: 'What are the pitfalls of the Repository pattern with ORMs?', a: 'Common pitfalls: leaking IQueryable<T> from the repository: allows callers to compose arbitrary LINQ queries, bypassing encapsulation. The repository returns a raw queryable and the caller can do anything. The repository should return IEnumerable<T> or IList<T>. Lazy loading N+1: repository returns a list of entities with lazy-loaded navigation properties. Callers iterate and access navigation properties, causing one query per entity. Fix: eagerly load with Include() in the repository. Anemic repositories that duplicate ORM API without adding domain value: ProductRepository.FindAll() => context.Products.ToList() adds no value over accessing DbSet directly. Repositories should add query semantics meaningful to the domain.' },
];

const revision: RevisionSummary = {
  oneLiner: 'Repository abstracts data access behind a collection-like interface — domain code sees in-memory objects, not SQL or EF Core.',
  mustKnow: [
    'Repositories only for aggregate roots — not every entity',
    'Return IReadOnlyList<T>, not IQueryable<T> — don\'t leak EF Core',
    'Do NOT call SaveChanges inside the repository — leave it to the Unit of Work',
    'DbSet<T> is already a Repository; DbContext is already a Unit of Work',
    'Specification pattern encapsulates complex queries as objects passed to Find()',
  ],
  interviewFocus: [
    'Why are repositories only for aggregate roots?',
    'Why should IQueryable<T> not be returned from a repository?',
    'When is wrapping EF Core in a repository justified vs redundant?',
  ],
};

@Component({
  selector: 'app-dp-repository',
  standalone: true,
  imports: [CommonModule, PageMetaComponent, QuickRefComponent, TheoryBlockComponent,
    CodeBlockComponent, CommonMistakesComponent, ChallengeBlockComponent,
    QuizBlockComponent, QnaBlockComponent, RevisionCardComponent, PageCompleteComponent],
  templateUrl: './repository.html',
  styleUrl: './repository.scss',
})
export class DpRepository {
  quickRef = quickRef; theory = theory; codeTabs = codeTabs;
  mistakes = mistakes; challenge = challenge; quiz = quiz; qna = qna; revision = revision;
}
