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
    heading: 'Three Pieces Shown, Never Assembled',
    points: [
      'The main page\'s own "Specification + Repository" codeTab shows THREE separate pieces: the ' +
      '<code>IOrderRepository.FindAsync(ISpecification&lt;Order&gt; spec, ...)</code> interface method, the ' +
      '<code>EfSpecificationEvaluator.Apply()</code> utility that turns a specification into an ' +
      '<code>IQueryable&lt;T&gt;</code>, and a usage line calling <code>orderRepo.FindAsync(spec)</code>. What ' +
      'is missing is the CONCRETE repository class that actually implements <code>FindAsync</code> by calling ' +
      '<code>EfSpecificationEvaluator.Apply</code> against <code>db.Orders</code> — the piece that makes the ' +
      'other two actually connect to each other.',
      'Each of the three shown pieces is individually correct — this is not a bug, it is an incompleteness: ' +
      'a reader can verify each piece makes sense in isolation, but never sees the wiring that turns them into ' +
      'a working feature.',
    ],
  },
  {
    heading: 'What the Missing Method Actually Has to Do',
    points: [
      'The implementation needs exactly three things: start from the <code>DbSet&lt;Order&gt;</code> as an ' +
      '<code>IQueryable&lt;Order&gt;</code>, pass it and the specification through ' +
      '<code>EfSpecificationEvaluator.Apply&lt;Order&gt;()</code> to get back a fully filtered, sorted, ' +
      'paged, and eagerly-loaded query, and then materialize it with an async LINQ call — exactly the same ' +
      'materialization step every OTHER method in the main page\'s own first codeTab ' +
      '(<code>GetAllAsync</code>, <code>FindAsync(predicate)</code>) already uses.',
    ],
  },
];

const codeTabs: CodeTab[] = [
  {
    label: 'The Missing Implementation',
    language: 'csharp',
    code: `// The main page's own interface — shown, never implemented.
public interface IOrderRepository
{
    Task<IReadOnlyList<Order>> FindAsync(ISpecification<Order> spec, CancellationToken ct = default);
}

// The main page's own evaluator — defined, never called by anything.
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

// THE MISSING PIECE — a concrete repository that actually wires the
// evaluator into a real query against the DbContext.
public class OrderRepository(AppDbContext db) : IOrderRepository
{
    public async Task<IReadOnlyList<Order>> FindAsync(
        ISpecification<Order> spec, CancellationToken ct = default)
    {
        // db.Orders is already an IQueryable<Order> — exactly what
        // EfSpecificationEvaluator.Apply<T>() expects as its first
        // argument.
        var query = EfSpecificationEvaluator.Apply(db.Orders, spec);
        return await query.ToListAsync(ct);
    }
}

// Now the main page's own usage line actually resolves to a real,
// working implementation instead of an interface with nothing behind it.
var spec   = new RecentLargeOrdersSpec(minAmount: 1000m, days: 30);
var orders = await orderRepo.FindAsync(spec);
// The query that actually runs against the database:
// SELECT * FROM Orders o
// INNER JOIN Customers c ON o.CustomerId = c.Id  -- from Includes
// WHERE o.Total >= 1000 AND o.CreatedAt >= @cutoff
// ORDER BY o.Total DESC
// -- (Skip is null, so no OFFSET)
// LIMIT 50                                        -- from Take`,
  },
];

const exercise: TryItExercise = {
  prompt:
    'If <code>OrderRepository.FindAsync</code> above called ' +
    '<code>EfSpecificationEvaluator.Apply(db.Orders.ToList().AsQueryable(), spec)</code> instead of ' +
    '<code>EfSpecificationEvaluator.Apply(db.Orders, spec)</code> — materializing the entire ' +
    '<code>Orders</code> table into memory FIRST, then wrapping it back into an ' +
    '<code>IQueryable&lt;Order&gt;</code> — would the method still return the CORRECT results? What would ' +
    'change?',
  hint:
    'Think about WHERE the filtering, sorting, and paging logic inside <code>Apply()</code> actually runs ' +
    'once the source is already a fully-loaded, in-memory <code>List&lt;Order&gt;</code> instead of a live ' +
    'database query.',
  solution:
    'The results would still be CORRECT, but the performance would be dramatically worse for any real-sized ' +
    'table. db.Orders.ToList().AsQueryable() pulls EVERY row in the Orders table into application memory ' +
    'first, THEN applies the Where/OrderBy/Skip/Take logic entirely in-process using LINQ-to-Objects — none ' +
    'of the specification\'s filtering, sorting, or paging ever reaches the database as part of the SQL query ' +
    'at all. The whole point of passing a live IQueryable<Order> (db.Orders, not a materialized list) into ' +
    'Apply() is that EF Core translates the entire specification into ONE efficient SQL query, doing the ' +
    'filtering and paging in the database — exactly the difference between IQueryable (deferred, translated ' +
    'to SQL) and IEnumerable (executed in memory) that this hub\'s own Repository mistake block warns about ' +
    'for a different reason (leaking IQueryable to callers).',
};

const misconceptions: Misconception[] = [
  {
    thought: 'Since EfSpecificationEvaluator.Apply() is a static method with generic type parameters, it must ' +
      'already be "wired up" automatically wherever ISpecification<T> is used — no repository needs to call ' +
      'it explicitly.',
    reality:
      'A static utility method is never invoked automatically by anything — it is exactly as inert as any ' +
      'other method until SOME piece of code explicitly calls it with real arguments. This subtopic\'s own ' +
      'OrderRepository.FindAsync is that explicit call site; without it, EfSpecificationEvaluator.Apply is ' +
      'genuinely dead code, compiled but never executed by anything on the main page.',
  },
  {
    thought: 'The main page\'s own codeTab must have SOME reason for leaving the implementation out — perhaps ' +
      'it is meant to be obvious enough not to need showing.',
    reality:
      'The missing piece is not obvious in the way, say, a getter/setter is — it specifically requires ' +
      'knowing that db.Orders IS ALREADY an IQueryable<Order> suitable as Apply()\'s first argument, and that ' +
      'materializing with ToListAsync() (not ToList(), not enumerating synchronously) is what keeps the whole ' +
      'chain properly async, matching every other method on the page\'s own repository. This is exactly the ' +
      'kind of connective step worth spelling out explicitly rather than assuming a reader will reconstruct ' +
      'it correctly on their own.',
  },
];

@Component({
  selector: 'app-repository-connecting-efspecificationevaluator-to-a-real-repository',
  standalone: true,
  imports: [CommonModule, SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent,
    CodeBlockComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './connecting-efspecificationevaluator-to-a-real-repository.html',
  styleUrl: './connecting-efspecificationevaluator-to-a-real-repository.scss',
})
export class ConnectingEfspecificationevaluatorToARealRepositorySubtopic {
  theory = theory;
  codeTabs = codeTabs;
  exercise = exercise;
  misconceptions = misconceptions;
}
