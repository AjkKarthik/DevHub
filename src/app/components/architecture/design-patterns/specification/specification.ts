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
  { name: 'Specification',   type: 'class',     desc: 'Encapsulates a business rule or query predicate as a reusable, composable object.' },
  { name: 'IsSatisfiedBy()', type: 'method',    desc: 'Evaluates the specification against a candidate object — returns true/false.' },
  { name: 'And()',           type: 'method',    desc: 'Combines two specifications: both must be satisfied.' },
  { name: 'Or()',            type: 'method',    desc: 'Combines two specifications: at least one must be satisfied.' },
  { name: 'Not()',           type: 'method',    desc: 'Negates a specification — not satisfied becomes satisfied.' },
  { name: 'ToExpression()',  type: 'method',    desc: 'Converts the specification to an Expression<Func<T,bool>> for EF Core LINQ translation to SQL.' },
];

const theory: TheoryPoint[] = [
  {
    heading: 'What is the Specification Pattern?',
    points: [
      'Specification encapsulates a business rule as a named, reusable object.',
      'Rules like "active premium customer" become ActivePremiumCustomerSpec — named, testable, composable.',
      'Specifications can be combined: and, or, not — building complex predicates from simple building blocks.',
      'The same specification can validate a single object or be translated to SQL for querying.',
    ],
  },
  {
    heading: 'Two Modes: In-Memory and SQL',
    points: [
      'In-memory mode: IsSatisfiedBy(T candidate) — evaluates against a domain object; used for validation.',
      'SQL mode: ToExpression() returns Expression<Func<T,bool>> — passed to EF Core Where() for database querying.',
      'A well-designed specification works in both modes — same business rule, two evaluation contexts.',
      'This eliminates duplicated logic: the "eligible for discount" rule is written once, not in two places.',
    ],
  },
  {
    heading: 'Composability',
    points: [
      'And(other): returns a new specification satisfied when BOTH are satisfied.',
      'Or(other): returns a new specification satisfied when EITHER is satisfied.',
      'Not(): negates the specification — satisfied when the inner spec is NOT satisfied.',
      'Complex rules become readable compositions: ActiveSpec.And(PremiumSpec).And(new MinOrderSpec(100)).',
    ],
  },
  {
    heading: 'Specification vs Repository.Find()',
    points: [
      'Without Specification: repository has one method per query — GetActivePremiumCustomers(), GetActiveCustomersWithMinOrder() — methods proliferate.',
      'With Specification: repository has one Find(ISpecification<T>) — specifications compose instead of methods multiplying.',
      'Specification also works for domain validation: order.CanApply(discountSpec) — same rule reused.',
      'Ardalis.Specification is a popular .NET library with EF Core integration and pagination support.',
    ],
  },
];

const codeTabs: CodeTab[] = [
  {
    label: 'Composable Specification',
    language: 'csharp',
    code: `// Base specification
public abstract class Specification<T>
{
    public abstract Expression<Func<T, bool>> ToExpression();

    public bool IsSatisfiedBy(T entity) => ToExpression().Compile()(entity);

    public Specification<T> And(Specification<T> other) => new AndSpec<T>(this, other);
    public Specification<T> Or(Specification<T> other)  => new OrSpec<T>(this, other);
    public Specification<T> Not()                        => new NotSpec<T>(this);
}

// Composite specifications
internal class AndSpec<T>(Specification<T> left, Specification<T> right) : Specification<T>
{
    public override Expression<Func<T, bool>> ToExpression()
    {
        var l = left.ToExpression();
        var r = right.ToExpression();
        var param = Expression.Parameter(typeof(T));
        var body  = Expression.AndAlso(Expression.Invoke(l, param), Expression.Invoke(r, param));
        return Expression.Lambda<Func<T, bool>>(body, param);
    }
}

internal class OrSpec<T>(Specification<T> left, Specification<T> right) : Specification<T>
{
    public override Expression<Func<T, bool>> ToExpression()
    {
        var l = left.ToExpression();
        var r = right.ToExpression();
        var param = Expression.Parameter(typeof(T));
        var body  = Expression.OrElse(Expression.Invoke(l, param), Expression.Invoke(r, param));
        return Expression.Lambda<Func<T, bool>>(body, param);
    }
}

internal class NotSpec<T>(Specification<T> inner) : Specification<T>
{
    public override Expression<Func<T, bool>> ToExpression()
    {
        var expr  = inner.ToExpression();
        var param = Expression.Parameter(typeof(T));
        var body  = Expression.Not(Expression.Invoke(expr, param));
        return Expression.Lambda<Func<T, bool>>(body, param);
    }
}

// Domain specifications
public class ActiveCustomerSpec : Specification<Customer>
{
    public override Expression<Func<Customer, bool>> ToExpression() =>
        c => c.IsActive && !c.IsDeleted;
}

public class PremiumCustomerSpec : Specification<Customer>
{
    public override Expression<Func<Customer, bool>> ToExpression() =>
        c => c.Tier == CustomerTier.Premium;
}

public class MinimumOrderAmountSpec(decimal minAmount) : Specification<Customer>
{
    public override Expression<Func<Customer, bool>> ToExpression() =>
        c => c.TotalOrderAmount >= minAmount;
}

// Compose complex rule from simple specs
var eligibleForDiscount = new ActiveCustomerSpec()
    .And(new PremiumCustomerSpec())
    .And(new MinimumOrderAmountSpec(500m));

// Use for validation (in-memory)
if (eligibleForDiscount.IsSatisfiedBy(customer))
    cart.ApplyDiscount(10m);

// Use for querying (SQL)
var customers = await db.Customers
    .Where(eligibleForDiscount.ToExpression())
    .ToListAsync();`,
  },
  {
    label: 'Ardalis.Specification',
    language: 'csharp',
    code: `// Ardalis.Specification — popular library with EF Core support + pagination
// Install: dotnet add package Ardalis.Specification.EntityFrameworkCore

public class ActivePremiumOrdersSpec : Specification<Order>
{
    public ActivePremiumOrdersSpec(Guid customerId)
    {
        Query
            .Where(o => o.CustomerId == customerId && o.Status != OrderStatus.Cancelled)
            .Include(o => o.Items)
            .Include(o => o.Customer)
            .OrderByDescending(o => o.CreatedAt)
            .Take(20);
    }
}

// Repository using Ardalis.Specification
public class OrderRepository(AppDbContext db) : RepositoryBase<Order>(db), IOrderRepository
{
    // FindAsync(spec) is provided by RepositoryBase — translates spec to SQL automatically
}

// Usage
var spec   = new ActivePremiumOrdersSpec(customerId);
var orders = await orderRepo.ListAsync(spec);
var count  = await orderRepo.CountAsync(spec);

// Pagination spec
public class PagedOrdersSpec : Specification<Order>
{
    public PagedOrdersSpec(int page, int pageSize)
    {
        Query
            .Where(o => o.Status == OrderStatus.Pending)
            .OrderBy(o => o.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize);
    }
}

// Specification for a single result
public class OrderByNumberSpec : SingleResultSpecification<Order>
{
    public OrderByNumberSpec(string orderNumber)
    {
        Query.Where(o => o.OrderNumber == orderNumber).Include(o => o.Items);
    }
}

var order = await orderRepo.FirstOrDefaultAsync(new OrderByNumberSpec("ORD-001"));`,
  },
];

const mistakes: CommonMistake[] = [
  {
    title: 'Specifications that leak infrastructure (using EF navigation properties in IsSatisfiedBy)',
    wrong: `public class HasPendingOrderSpec : Specification<Customer>
{
    public override Expression<Func<Customer, bool>> ToExpression() =>
        c => c.Orders.Any(o => o.Status == OrderStatus.Pending); // navigation property — works in EF, fails in-memory if Orders not loaded
}`,
    right: `// For in-memory use: pass the dependency explicitly
public bool HasPendingOrder(Customer customer, IEnumerable<Order> orders) =>
    orders.Any(o => o.CustomerId == customer.Id && o.Status == OrderStatus.Pending);`,
    explanation: 'Specifications using navigation properties work in EF Core queries (SQL JOIN) but fail when IsSatisfiedBy() is called in-memory if the navigation property is not loaded. Design specifications for the context they\'ll be used in, or test both modes explicitly.',
  },
  {
    title: 'Creating a specification for every one-off query instead of direct LINQ',
    wrong: `// Simple one-time query: get order by ID
public class OrderByIdSpec : Specification<Order>
{
    public OrderByIdSpec(Guid id) { Query.Where(o => o.Id == id); }
}`,
    right: `// Use direct LINQ for simple, non-reused queries
await db.Orders.FindAsync(id);`,
    explanation: 'Specification adds value for: reusable business rules, composable predicates, and domain validation. Creating a specification for every simple query adds boilerplate without benefit. Use direct LINQ for non-reused queries.',
  },
  {
    title: 'Specifications with mutable state — making them non-reusable',
    wrong: `public class DateRangeSpec : Specification<Order>
{
    public DateTime From { get; set; } // mutable — callers can change after creation
    public DateTime To   { get; set; }
}`,
    right: `public class DateRangeSpec(DateTime from, DateTime to) : Specification<Order>
{
    // Immutable — state set at construction, cannot be changed
    public override Expression<Func<Order, bool>> ToExpression() =>
        o => o.CreatedAt >= from && o.CreatedAt <= to;
}`,
    explanation: 'Specifications should be immutable value objects. Mutable specifications can be modified after creation leading to unexpected behaviour, especially when shared or cached. Set all parameters in the constructor.',
  },
  {
    title: 'Building specifications in the application layer instead of the domain',
    wrong: `// Application layer builds the predicate
var spec = new Specification<Customer>(c => c.Tier == CustomerTier.Premium && c.IsActive && c.TotalOrderAmount > 500);`,
    right: `// Domain layer: named, business-meaningful specification
var spec = new EligibleForDiscountSpec(); // encapsulates the business rule`,
    explanation: 'Anonymous predicate specifications in the application layer bypass the naming and reuse benefits. Business rules should be named specifications in the domain layer — the name communicates intent and enables reuse across multiple use cases.',
  },
];

const challenge: Challenge = {
  title: 'Product Filter Specification',
  language: 'typescript',
  description: `Implement composable Specification for products.
Product has: name, price, category, inStock.
Create: InStockSpec, PriceRangeSpec(min, max), CategorySpec(cat).
Compose them: find products that are in stock, in Electronics, price 10–50.`,
  hints: [
    'Specification<T> has isSatisfiedBy(item: T): boolean',
    'and(other) returns a new AndSpec',
    'Compose: inStock.and(priceRange).and(category)',
  ],
  starterCode: `interface Product { name: string; price: number; category: string; inStock: boolean; }

abstract class Specification<T> {
  abstract isSatisfiedBy(item: T): boolean;
  and(other: Specification<T>): Specification<T> {
    return new AndSpec(this, other);
  }
}

class AndSpec<T> extends Specification<T> {
  constructor(private a: Specification<T>, private b: Specification<T>) { super(); }
  isSatisfiedBy(item: T): boolean { return this.a.isSatisfiedBy(item) && this.b.isSatisfiedBy(item); }
}

// TODO: InStockSpec, PriceRangeSpec, CategorySpec`,
  solution: `interface Product { name: string; price: number; category: string; inStock: boolean; }

abstract class Specification<T> {
  abstract isSatisfiedBy(item: T): boolean;
  and(other: Specification<T>): Specification<T> { return new AndSpec(this, other); }
  or(other: Specification<T>):  Specification<T> { return new OrSpec(this, other); }
}

class AndSpec<T> extends Specification<T> {
  constructor(private a: Specification<T>, private b: Specification<T>) { super(); }
  isSatisfiedBy(item: T): boolean { return this.a.isSatisfiedBy(item) && this.b.isSatisfiedBy(item); }
}

class OrSpec<T> extends Specification<T> {
  constructor(private a: Specification<T>, private b: Specification<T>) { super(); }
  isSatisfiedBy(item: T): boolean { return this.a.isSatisfiedBy(item) || this.b.isSatisfiedBy(item); }
}

class InStockSpec extends Specification<Product> {
  isSatisfiedBy(p: Product): boolean { return p.inStock; }
}

class PriceRangeSpec extends Specification<Product> {
  constructor(private min: number, private max: number) { super(); }
  isSatisfiedBy(p: Product): boolean { return p.price >= this.min && p.price <= this.max; }
}

class CategorySpec extends Specification<Product> {
  constructor(private category: string) { super(); }
  isSatisfiedBy(p: Product): boolean { return p.category === this.category; }
}

const products: Product[] = [
  { name: 'Phone',    price: 30,  category: 'Electronics', inStock: true },
  { name: 'Cable',    price: 12,  category: 'Electronics', inStock: false },
  { name: 'Headset',  price: 45,  category: 'Electronics', inStock: true },
  { name: 'T-Shirt',  price: 20,  category: 'Clothing',    inStock: true },
  { name: 'Charger',  price: 60,  category: 'Electronics', inStock: true },
];

const spec = new InStockSpec()
  .and(new CategorySpec('Electronics'))
  .and(new PriceRangeSpec(10, 50));

const results = products.filter(p => spec.isSatisfiedBy(p));
console.log(results.map(p => p.name)); // ['Phone', 'Headset']`,
};

const quiz: QuizQuestion[] = [
  {
    q: 'What is the main benefit of the Specification pattern over adding methods to the repository?',
    options: [
      'Specifications are faster than repository methods',
      'Specifications are composable and reusable — combining them avoids a proliferation of repository methods for every query combination',
      'Specifications eliminate the need for a repository',
      'Specifications automatically generate SQL queries',
    ],
    answer: 1,
    explanation: 'Without Specification, every query combination needs its own repository method. With Specification, a Find(ISpecification<T>) method accepts any composition of specifications. The same specification can also be used for in-memory validation — no duplicated logic.',
  },
  {
    q: 'Why does a Specification need both IsSatisfiedBy() and ToExpression()?',
    options: [
      'IsSatisfiedBy() is for C# 9+; ToExpression() is for older versions',
      'IsSatisfiedBy() evaluates against an in-memory object; ToExpression() produces an Expression Tree that EF Core translates to SQL',
      'ToExpression() is faster than IsSatisfiedBy() for large datasets',
      'Both methods do the same thing — one is just a convenience alias',
    ],
    answer: 1,
    explanation: 'IsSatisfiedBy() compiles and runs the predicate against a domain object — for in-memory validation. ToExpression() returns an Expression Tree that EF Core can translate to a SQL WHERE clause — for database queries. Same business rule, two evaluation modes.',
  },
  {
    q: 'What does Ardalis.Specification provide over a hand-rolled specification?',
    options: [
      'A different programming language for specifications',
      'EF Core integration with built-in support for Include, OrderBy, Pagination, and a RepositoryBase<T>',
      'Automatic database schema generation from specifications',
      'Runtime code generation for faster specification evaluation',
    ],
    answer: 1,
    explanation: 'Ardalis.Specification provides a Specification<T> base class that integrates with EF Core: Include navigation properties, OrderBy, Skip/Take for pagination, and RepositoryBase<T> that automatically evaluates specifications via IQueryable. It reduces the boilerplate of hand-rolling expression composition.',
  },
  { q: 'What is the Specification pattern and what problem does it solve?', options: ['A formal requirements document that defines expected software behavior', 'A pattern that encapsulates business rules or query predicates as reusable objects that can be combined and passed to repositories or domain methods', 'A test specification format used in behavior-driven development frameworks', 'A pattern for specifying database schema constraints as code'], answer: 1, explanation: 'The Specification pattern (Eric Evans, Martin Fowler) encapsulates a business rule as an object with an isSatisfiedBy(candidate) method. Instead of repeating business conditions throughout the codebase, create a specification object: PremiumCustomerSpec, ActiveCustomerSpec. Combine them: new AndSpec(PremiumCustomerSpec, ActiveCustomerSpec). Pass to repositories: repository.findAll(spec). Benefits: business rules become named, reusable, testable units. Query logic is not scattered across service classes. Domain ubiquitous language is encoded in specification class names. Can be translated to SQL predicates by the repository.' },
  { q: 'What are the three classic uses of the Specification pattern?', options: ['Validation, filtering, and business rule enforcement at compile time', 'Selection (query): find objects matching the specification; validation: check whether an object meets the specification; construction: build objects that satisfy the specification', 'Documentation: describe expected system behavior; testing: generate test data; deployment: specify runtime configuration', 'Caching: cache specification results; logging: log specification evaluations; monitoring: alert when specifications fail'], answer: 1, explanation: 'Selection: repository.findProducts(new InStockSpec()) filters by the specification predicate. Validation: orderValidator.check(order, new ValidOrderSpec()) confirms an order meets business rules before processing. Construction: factory.create(new ConfiguredForPremiumSpec()) builds objects configured to satisfy the specification. The same specification class serves all three purposes: it defines the business rule once and it can be applied in any context. This is the main advantage over ad hoc if-conditions scattered around the codebase.' },
  { q: 'How do you translate a Specification to a SQL query predicate?', options: ['Specifications cannot be used with SQL; they only work for in-memory filtering', 'By implementing the specification as an Expression<Func<T, bool>> that both entity framework and in-memory evaluation can use', 'By parsing the specification object at runtime into a SQL string using reflection', 'By manually calling the specification in a stored procedure'], answer: 1, explanation: 'In C#, implement specifications as Expression<Func<T, bool>>: class PremiumCustomerSpec : Specification<Customer> { public override Expression<Func<Customer, bool>> ToExpression() => c => c.IsPremium && c.TotalSpend > 1000; }. The repository applies it: dbContext.Customers.Where(spec.ToExpression()). Entity Framework Core translates the expression tree to SQL, so the filtering happens in the database. For in-memory collections: compile the expression and call as a regular function: spec.ToExpression().Compile()(customer). The Ardalis.Specification NuGet package provides a production-grade implementation with eager loading and ordering support.' },
];

const qna: QnaItem[] = [
  {
    q: 'Should every query use a specification, or only some?',
    a: 'Use Specification when: (1) the predicate represents a named business rule (EligibleForDiscountSpec), (2) the same predicate is used in multiple places, (3) the predicate needs to work for both querying and in-memory validation. Use direct LINQ for: one-off queries that are not reused, simple lookups like GetById, and application-level filtering that does not represent a domain concept.',
  },
  {
    q: 'How do I combine specifications with OR logic?',
    a: 'Implement an OrSpec composite: return a new specification whose ToExpression() is an Expression.OrElse of the two inner expressions. Use a Parameter Replacer to ensure both expressions use the same ParameterExpression before combining. Ardalis.Specification handles this automatically with its Where() builder. For simple cases, a single lambda with || in ToExpression() is cleaner than building the OR composite manually.',
  },
  { q: 'How do you combine specifications using And, Or, and Not operators?', a: 'Composite specifications use the Composite pattern: AndSpecification takes two specifications and isSatisfiedBy returns left.isSatisfiedBy(x) AND right.isSatisfiedBy(x). OrSpecification: left OR right. NotSpecification: NOT child. For Expression<Func<T,bool>>: use PredicateBuilder or manual expression tree combination. C# Ardalis.Specification: spec.And(otherSpec). Fluent API example: new PremiumSpec().And(new ActiveSpec()).Or(new LoyaltyProgramSpec()). This allows building complex business rules from simple primitive specifications without code duplication. Each primitive specification is independently named, tested, and documented.' },
  { q: 'What is the difference between Specification pattern and raw LINQ Where clauses?', a: 'Raw LINQ: repository.Where(c => c.IsPremium && c.TotalSpend > 1000 && c.IsActive). This duplicates the business rule at every call site. If the definition of a premium customer changes, you must update every Where clause. Specification: PremiumCustomerSpec encapsulates the rule once. repository.FindAll(new PremiumCustomerSpec()) reads like domain language and is reused everywhere. Validation also reuses the spec: validator.Validate(customer, new PremiumCustomerSpec()). Specifications make business rules explicit, named, reusable, and testable. For trivial queries used once, raw LINQ is fine. For recurring business rules, Specification adds significant maintainability value.' },
  { q: 'How does the Specification pattern relate to domain-driven design?', a: 'Specification is a DDD tactical pattern that externalizes domain invariants and business rules from entities and services into reusable, named objects. In DDD: specifications belong to the domain layer, not the data access layer. They express domain concepts: EligibleForDiscount, MeetsCreditThreshold. The specification class name is part of the ubiquitous language. Bounded context teams use specifications to communicate business rules explicitly. Specifications prevent rule duplication across application services, query methods, and validation logic. Combined with Repository: the repository accepts domain specifications (not technical predicates) and translates them to queries internally, keeping the domain model free from persistence details.' },
  { q: 'What are the performance implications of in-memory vs. database-evaluated specifications?', a: 'In-memory evaluation: call specification.isSatisfiedBy(entity) in a for loop over all entities loaded into memory. This loads the entire table into RAM. Acceptable only for very small collections or in unit tests. For production use: translate to SQL. Database evaluation: Expression<Func<T,bool>> translated to SQL by the ORM. Database executes the filter before returning results. Orders of magnitude more efficient for large datasets. Hybrid approach: use database specification for initial filtering, then apply more complex in-memory specifications on the smaller result set. For specifications that cannot be expressed as SQL (calling external services, complex domain logic), fetch candidates from the database and filter in memory.' },
];

const revision: RevisionSummary = {
  oneLiner: 'Specification encapsulates a business rule as a composable object — reusable for in-memory validation (IsSatisfiedBy) and database queries (ToExpression to SQL).',
  mustKnow: [
    'Specification = named, reusable predicate object; And/Or/Not compose them',
    'IsSatisfiedBy(entity): evaluates in-memory; ToExpression(): translates to SQL via EF Core',
    'Same specification used for domain validation AND repository querying — no duplication',
    'Find(ISpecification<T>) in repository replaces proliferating query methods',
    'Ardalis.Specification is the standard .NET library with EF Core + pagination support',
  ],
  interviewFocus: [
    'Why use Specification instead of repository methods per query?',
    'What is the difference between IsSatisfiedBy() and ToExpression()?',
    'How do And/Or/Not composites work in the specification pattern?',
  ],
};

@Component({
  selector: 'app-dp-specification',
  standalone: true,
  imports: [CommonModule, PageMetaComponent, QuickRefComponent, TheoryBlockComponent,
    CodeBlockComponent, CommonMistakesComponent, ChallengeBlockComponent,
    QuizBlockComponent, QnaBlockComponent, RevisionCardComponent, PageCompleteComponent],
  templateUrl: './specification.html',
  styleUrl: './specification.scss',
})
export class DpSpecification {
  quickRef = quickRef; theory = theory; codeTabs = codeTabs;
  mistakes = mistakes; challenge = challenge; quiz = quiz; qna = qna; revision = revision;
}
