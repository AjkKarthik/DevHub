import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';

const theory: TheoryPoint[] = [
  {
    heading: 'A Nuanced Distinction, Stated in Prose Only',
    points: [
      'The main page\'s own fourth QnA draws a precise distinction: generic repository CRITICISM applies to ' +
      'exposing <code>IRepository&lt;T&gt;</code> as the PUBLIC contract callers depend on — but a generic ' +
      'BASE CLASS used purely as INTERNAL boilerplate-avoidance, with only narrow, domain-specific methods ' +
      'exposed publicly, "gets the code-reuse benefit without the interface-leakage cost." No codeTab on the ' +
      'page shows this distinction in actual code — the page\'s own "Building a generic repository" mistake ' +
      'block only shows the BAD version (a generic repo exposed AS the public interface), never the good one ' +
      'this QnA describes.',
      'The distinction is entirely about WHAT CALLERS CAN SEE, not about whether generic code exists at all — ' +
      'a private/internal base class doing generic CRUD plumbing is invisible to anything outside the ' +
      'concrete repository that inherits from it.',
    ],
  },
  {
    heading: 'What Makes the Internal Version Actually Safe',
    points: [
      'The base class\'s own generic methods (<code>GetByIdAsync</code>, <code>AddAsync</code>, etc.) are ' +
      'marked <code>protected</code>, not <code>public</code> — a caller holding an ' +
      '<code>IOrderRepository</code> reference has no way to reach them at all, since ' +
      '<code>IOrderRepository</code> itself never mentions them.',
      'The CONCRETE repository (<code>OrderRepository</code>) is what publicly exposes only its own, ' +
      'domain-meaningful methods (<code>GetPendingOrdersAsync</code>) — internally, those methods are free to ' +
      'CALL the protected base-class CRUD helpers to avoid rewriting the same boilerplate in every concrete ' +
      'repository, without that boilerplate ever becoming part of any caller-visible contract.',
    ],
  },
];

const codeTabs: CodeTab[] = [
  {
    label: 'Internal-Only Generic Base',
    language: 'csharp',
    code: `// The generic base class — CRUD plumbing shared across every
// concrete repository, but never exposed as a public interface.
public abstract class RepositoryBase<T>(AppDbContext db) where T : Entity
{
    // protected, not public — invisible to anything outside a
    // class that actually inherits from RepositoryBase<T>.
    protected async Task<T?> GetByIdAsync(Guid id, CancellationToken ct = default) =>
        await db.Set<T>().FindAsync([id], ct);

    protected async Task AddAsync(T entity, CancellationToken ct = default) =>
        await db.Set<T>().AddAsync(entity, ct);

    protected void Remove(T entity) => db.Set<T>().Remove(entity);

    protected DbSet<T> Set => db.Set<T>();
}

// The PUBLIC contract callers actually depend on — narrow,
// domain-specific, with NO mention of the generic base class at all.
public interface IOrderRepository
{
    Task<Order?> GetOrderAsync(Guid id, CancellationToken ct = default);
    Task<IReadOnlyList<Order>> GetPendingOrdersAsync(CancellationToken ct = default);
    Task PlaceOrderAsync(Order order, CancellationToken ct = default);
}

// The concrete repository — reuses RepositoryBase<Order>'s protected
// helpers INTERNALLY, but only exposes IOrderRepository's own three
// methods publicly.
public class OrderRepository(AppDbContext db) : RepositoryBase<Order>(db), IOrderRepository
{
    public Task<Order?> GetOrderAsync(Guid id, CancellationToken ct = default) =>
        GetByIdAsync(id, ct); // reuses the protected base helper — not public itself

    public async Task<IReadOnlyList<Order>> GetPendingOrdersAsync(CancellationToken ct = default) =>
        await Set.Where(o => o.Status == OrderStatus.Pending).ToListAsync(ct);

    public Task PlaceOrderAsync(Order order, CancellationToken ct = default) =>
        AddAsync(order, ct); // reuses the protected base helper
}

// A caller holding IOrderRepository has NO way to reach GetByIdAsync,
// AddAsync, Remove, or Set directly — none of them are part of the
// interface, regardless of how OrderRepository is implemented
// internally.
IOrderRepository repo = ...;
repo.GetOrderAsync(id);       // fine — part of the public contract
repo.GetByIdAsync(id);        // does not compile — not on IOrderRepository at all`,
  },
];

const exercise: TryItExercise = {
  prompt:
    'If a teammate changed <code>RepositoryBase&lt;T&gt;</code>\'s methods from <code>protected</code> to ' +
    '<code>public</code> — keeping every other line of code exactly the same — would ' +
    '<code>OrderRepository</code> still compile? Would the interface-leakage problem the main page\'s own ' +
    'mistake block warns about come back?',
  hint:
    'Check specifically what a caller holding a plain <code>IOrderRepository</code> reference (not an ' +
    '<code>OrderRepository</code> reference) can actually see and call, regardless of what access modifier ' +
    '<code>RepositoryBase&lt;T&gt;</code>\'s own methods use.',
  solution:
    'It would still compile fine — access modifiers on the BASE class do not change what IOrderRepository ' +
    'itself declares. But the leakage risk WOULD partially return in a different way: any code that happens ' +
    'to hold a reference typed as OrderRepository (the concrete class, not the interface) — or as ' +
    'RepositoryBase<Order> directly — could now reach the generic CRUD methods too, bypassing whatever ' +
    'narrower contract IOrderRepository was meant to enforce. This is exactly why the main page\'s own QnA ' +
    'specifies the base class as an "internal IMPLEMENTATION DETAIL" — the safety only holds as long as ' +
    'callers are consistently given IOrderRepository references (e.g. via DI registration returning the ' +
    'interface type), not the concrete class or the base class directly.',
};

const misconceptions: Misconception[] = [
  {
    thought: 'Using inheritance (RepositoryBase<T>) here contradicts this hub\'s own general "favor ' +
      'composition over inheritance" guidance found elsewhere (Strategy vs Template Method, for instance).',
    reality:
      'The composition-over-inheritance guidance is specifically about swapping BEHAVIOR at runtime — ' +
      'RepositoryBase<T> here is doing something narrower: sharing boilerplate CRUD code across a FIXED, ' +
      'known set of concrete repository classes, with no runtime swapping involved at all. Inheritance is a ' +
      'completely ordinary, appropriate tool for this specific kind of code reuse — the trade-off this ' +
      'subtopic is actually about is public-surface exposure (interface vs. base class), not composition vs. ' +
      'inheritance.',
  },
  {
    thought: 'Since OrderRepository publicly exposes only three methods, it must be reimplementing the same ' +
      'CRUD logic from scratch for every entity type in a real system with many aggregates — the "reuse" ' +
      'benefit this subtopic claims does not actually materialize.',
    reality:
      'The reuse is real and does materialize — every OTHER concrete repository (e.g. a hypothetical ' +
      'ProductRepository : RepositoryBase&lt;Product&gt;) gets the SAME GetByIdAsync/AddAsync/Remove/Set ' +
      'implementations for free, without rewriting them, while still exposing its own completely different, ' +
      'domain-specific public interface. The boilerplate genuinely gets written once, in RepositoryBase&lt;T&gt;, ' +
      'and reused by every concrete repository that inherits from it — exactly the "code-reuse benefit" the ' +
      'main page\'s own QnA describes.',
  },
];

@Component({
  selector: 'app-repository-generic-repositorybase-as-an-internal-implementation-detail',
  standalone: true,
  imports: [CommonModule, SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent,
    CodeBlockComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './generic-repositorybase-as-an-internal-implementation-detail.html',
  styleUrl: './generic-repositorybase-as-an-internal-implementation-detail.scss',
})
export class GenericRepositorybaseAsAnInternalImplementationDetailSubtopic {
  theory = theory;
  codeTabs = codeTabs;
  exercise = exercise;
  misconceptions = misconceptions;
}
