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
    heading: 'A Named Pitfall, Never Actually Triggered',
    points: [
      'The main page\'s own QnA on ORM pitfalls names this precisely: "repository returns a list of entities ' +
      'with lazy-loaded navigation properties. Callers iterate and access navigation properties, causing one ' +
      'query per entity. Fix: eagerly load with Include() in the repository." No codeTab on the page ' +
      'actually demonstrates the query COUNT this produces, or contrasts it against the fixed version side ' +
      'by side.',
      'This is a genuinely different failure from the "leaking IQueryable" mistake the main page\'s own ' +
      'mistake block already covers — that one is about callers writing ARBITRARY new queries; this one is ' +
      'about a query the repository ALREADY returned quietly triggering many MORE queries later, at the ' +
      'point a caller merely reads a property.',
    ],
  },
  {
    heading: 'Why "One Query Per Entity" Is the Precise Cost',
    points: [
      'With EF Core lazy-loading proxies enabled and a navigation property marked <code>virtual</code>, the ' +
      'FIRST query (<code>GetPendingOrdersAsync</code>) returns proxy objects — reading ' +
      '<code>order.Customer</code> on ANY of them, for the first time, transparently issues a SEPARATE ' +
      'database round trip to fetch just that one order\'s customer. A loop over N orders that reads ' +
      '<code>.Customer</code> on each one therefore issues exactly N additional queries — the "1" (the ' +
      'original list query) plus "N" (one per row) is where the name "N+1" comes from.',
      'The fix, <code>Include()</code>, changes the ORIGINAL query itself to eagerly fetch the related data ' +
      'via a JOIN — one single SQL statement returns every order AND every customer together, so no ' +
      'additional round trips happen when the loop later reads <code>.Customer</code>.',
    ],
  },
];

const codeTabs: CodeTab[] = [
  {
    label: 'N+1 vs. Eager Loading',
    language: 'csharp',
    code: `// N+1 VERSION — matches the main page's own GetPendingOrdersAsync
// exactly, with no .Include() for the Customer navigation property.
public async Task<IReadOnlyList<Order>> GetPendingOrdersAsync(CancellationToken ct = default) =>
    await db.Orders.Where(o => o.Status == OrderStatus.Pending).ToListAsync(ct);
    // ONE query: SELECT * FROM Orders WHERE Status = 'Pending'

var pendingOrders = await orderRepo.GetPendingOrdersAsync();
foreach (var order in pendingOrders)
{
    // With lazy-loading proxies enabled, EACH of these lines is a
    // SEPARATE round trip to the database — not a property read.
    Console.WriteLine($"{order.Id}: {order.Customer.Name}");
    // 50 pending orders -> 1 original query + 50 lazy-load queries
    // for Customer = 51 total queries for one report.
}

// FIXED VERSION — one line added, using Include() exactly like the
// main page's own GetWithItemsAsync already demonstrates elsewhere.
public async Task<IReadOnlyList<Order>> GetPendingOrdersAsync(CancellationToken ct = default) =>
    await db.Orders
        .Where(o => o.Status == OrderStatus.Pending)
        .Include(o => o.Customer) // eager load — one JOIN, not N round trips
        .ToListAsync(ct);
    // ONE query total:
    // SELECT o.*, c.* FROM Orders o
    // INNER JOIN Customers c ON o.CustomerId = c.Id
    // WHERE o.Status = 'Pending'

var pendingOrders2 = await orderRepo.GetPendingOrdersAsync();
foreach (var order in pendingOrders2)
{
    // order.Customer is ALREADY loaded — reading it here is a plain
    // in-memory property access, zero additional database round trips.
    Console.WriteLine($"{order.Id}: {order.Customer.Name}");
    // 50 pending orders -> still just 1 query total.
}`,
  },
];

const exercise: TryItExercise = {
  prompt:
    'If the loop needed BOTH <code>order.Customer.Name</code> AND <code>order.Items.Count</code> (a second ' +
    'navigation property, a collection this time), and the fixed repository method only added ' +
    '<code>.Include(o =&gt; o.Customer)</code> — not <code>.Include(o =&gt; o.Items)</code> — what would ' +
    'happen when the loop reads <code>order.Items.Count</code>?',
  hint:
    'Include() only eagerly loads the SPECIFIC navigation property named in its own argument — think about ' +
    'what that means for a property that was never named at all.',
  solution:
    'The N+1 problem would come right back, just for Items instead of Customer — with lazy loading still ' +
    'enabled, reading order.Items on each of the 50 orders would trigger 50 MORE separate queries, since ' +
    'Include(o => o.Customer) only eagerly loads Customer specifically and has no effect on any other ' +
    'navigation property. The fix is not "add one Include() and the problem is solved everywhere" — it is ' +
    '"add an Include() for EVERY navigation property the calling code will actually read," which in this case ' +
    'means chaining a second call: .Include(o => o.Customer).Include(o => o.Items).',
};

const misconceptions: Misconception[] = [
  {
    thought: 'The N+1 problem only happens with EF Core\'s lazy-loading proxies specifically — if a project ' +
      'does not enable UseLazyLoadingProxies(), this failure mode simply cannot occur.',
    reality:
      'Without lazy-loading proxies enabled, reading an un-Included navigation property on a detached or ' +
      'already-loaded entity typically returns null (or an empty collection) instead of silently issuing a ' +
      'new query — a DIFFERENT failure (a missing-data bug, not a performance one), but still a real ' +
      'consequence of forgetting Include(). The N+1 QUERY-COUNT version specifically needs lazy loading ' +
      'enabled, but "forgetting to Include() a navigation property the caller needs" is a mistake worth ' +
      'avoiding regardless of which loading strategy a project uses.',
  },
  {
    thought: 'Since Include() fixes the problem, a repository should just Include() every possible navigation ' +
      'property on every query, to be safe.',
    reality:
      'This trades one performance problem for another — the main page\'s own theory section names exactly ' +
      'this trade-off implicitly through its own RecentLargeOrdersSpec example, which Includes ONLY ' +
      'Customer, not every possible navigation property Order might have. Eagerly loading data a specific ' +
      'caller will never actually read wastes bandwidth and database work on every single query, for every ' +
      'caller, whether or not that particular caller needed it — the right fix is Include()-ing exactly what ' +
      'THIS method\'s own known callers will read, not defensively Include()-ing everything.',
  },
];

@Component({
  selector: 'app-repository-the-n-plus-1-lazy-loading-pitfall-demonstrated',
  standalone: true,
  imports: [CommonModule, SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent,
    CodeBlockComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './the-n-plus-1-lazy-loading-pitfall-demonstrated.html',
  styleUrl: './the-n-plus-1-lazy-loading-pitfall-demonstrated.scss',
})
export class TheNPlus1LazyLoadingPitfallDemonstratedSubtopic {
  theory = theory;
  codeTabs = codeTabs;
  exercise = exercise;
  misconceptions = misconceptions;
}
