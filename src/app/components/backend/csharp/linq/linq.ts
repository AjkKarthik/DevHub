import { Component } from '@angular/core';
import { CodeBlockComponent, CodeTab } from '../../../shared/code-block/code-block';
import { TheoryBlockComponent, TheoryPoint } from '../../../shared/theory-block/theory-block';
import { QnaBlockComponent, QnaItem } from '../../../shared/qna-block/qna-block';
import { QuizBlockComponent, QuizQuestion } from '../../../shared/quiz-block/quiz-block';
import { ChallengeBlockComponent, Challenge } from '../../../shared/challenge-block/challenge-block';
import { QuickRefComponent, QuickRefItem } from '../../../shared/quick-ref/quick-ref';
import { PageMetaComponent } from '../../../shared/page-meta/page-meta';
import { PageCompleteComponent } from '../../../shared/page-complete/page-complete';

@Component({
  selector: 'app-csharp-linq',
  standalone: true,
  imports: [
    CodeBlockComponent,
    TheoryBlockComponent,
    QnaBlockComponent,
    QuizBlockComponent,
    ChallengeBlockComponent,
    QuickRefComponent,
    PageMetaComponent,
    PageCompleteComponent,
  ],
  templateUrl: './linq.html',
  styleUrl: './linq.scss',
})
export class CsharpLinq {

  quickRef: QuickRefItem[] = [
    {
      name: 'Where()',
      type: 'method',
      desc: 'Filters a sequence by a predicate. Returns an IEnumerable<T> containing only elements that satisfy the condition.',
    },
    {
      name: 'Select()',
      type: 'method',
      desc: 'Projects each element into a new form. Equivalent to map in other languages — transforms the shape of each item.',
    },
    {
      name: 'SelectMany()',
      type: 'method',
      desc: 'Flattens a sequence of sequences into a single sequence. Use when each element contains a nested collection.',
    },
    {
      name: 'GroupBy()',
      type: 'method',
      desc: 'Groups elements by a key selector and returns IEnumerable<IGrouping<TKey,TElement>>.',
    },
    {
      name: 'OrderBy() / ThenBy()',
      type: 'method',
      desc: 'Sorts a sequence ascending by a key; ThenBy adds a secondary sort. Use ThenByDescending for reversed secondary.',
    },
    {
      name: 'First() / FirstOrDefault()',
      type: 'method',
      desc: 'Returns the first matching element. First() throws if empty; FirstOrDefault() returns the default value (null/0).',
    },
    {
      name: 'Any() / All()',
      type: 'method',
      desc: 'Any() returns true if at least one element matches; All() returns true only if every element matches the predicate.',
    },
    {
      name: 'Count() / Sum() / Average()',
      type: 'method',
      desc: 'Scalar aggregation operators. Count() counts matching elements; Sum/Average compute numeric totals and means.',
    },
    {
      name: 'Zip()',
      type: 'method',
      desc: 'Merges two sequences element-by-element using a result selector. Stops at the shorter sequence.',
    },
    {
      name: 'ToList() / ToArray()',
      type: 'method',
      desc: 'Materialises a lazy IEnumerable<T> into a concrete collection. Forces immediate evaluation of the query pipeline.',
    },
  ];

  theory: TheoryPoint[] = [
    {
      heading: 'LINQ is lazy by default',
      points: [
        'Operators like <code>Where</code> and <code>Select</code> return <code>IEnumerable&lt;T&gt;</code> — they do not execute until the sequence is enumerated.',
        'Enumeration happens in a <code>foreach</code> loop, when you call <code>ToList()</code>, or when a scalar like <code>Count()</code> is used.',
        'This means you can compose a long chain of operators cheaply; work only happens at the point of consumption.',
        'Call <code>ToList()</code> <strong>once</strong> at the end of a chain to materialise the result and avoid re-evaluating the query on each pass.',
      ],
    },
    {
      heading: 'Method syntax vs query syntax',
      points: [
        'Both compile to exactly the same IL — query syntax is just syntactic sugar over method calls.',
        'Query syntax: <code>from x in col where x.Age &gt; 18 select x.Name</code>.',
        'Method syntax: <code>col.Where(x =&gt; x.Age &gt; 18).Select(x =&gt; x.Name)</code>.',
        'Method syntax is more composable and supports operators query syntax does not expose, such as <code>SelectMany</code>, <code>Zip</code>, and <code>Aggregate</code>.',
      ],
    },
    {
      heading: 'Avoid multiple enumeration',
      points: [
        'Calling <code>Count()</code> followed by a <code>foreach</code> on an <code>IEnumerable&lt;T&gt;</code> iterates the source <strong>twice</strong>.',
        'If the source is a database query or a file stream, this may cause two round-trips or re-reads.',
        'Fix: call <code>ToList()</code> once and work on the resulting <code>List&lt;T&gt;</code>.',
        'Roslyn analyzer <a href="https://github.com/meziantou/Meziantou.Analyzer">MA0020</a> can detect multiple enumeration at compile time.',
      ],
    },
    {
      heading: 'LINQ to Objects vs LINQ to EF',
      points: [
        'In-memory LINQ (<em>LINQ to Objects</em>) runs C# delegate functions directly against in-memory collections.',
        'EF Core LINQ (<em>LINQ to Entities</em>) translates the expression tree to SQL and executes it on the database server.',
        'The same LINQ operator may behave differently: <code>string.Compare()</code> is case-sensitive in C# but follows DB collation in SQL.',
        'Operators that EF cannot translate (e.g. custom C# methods) throw a runtime <code>InvalidOperationException</code> — move those to a client-side evaluation using <code>AsEnumerable()</code> first.',
      ],
    },
  ];

  tabs: CodeTab[] = [
    {
      label: 'Filtering & Projection',
      language: 'csharp',
      code: `// ── Where — filter with multiple conditions ──────────────────────────────
var adults = people
    .Where(p => p.Age >= 18 && p.IsActive)
    .ToList();

// ── Select — transform / project to new shape ────────────────────────────
var names = people
    .Where(p => p.Age >= 18)
    .Select(p => new { p.FirstName, p.LastName, FullName = $"{p.FirstName} {p.LastName}" })
    .ToList();

// ── SelectMany — flatten nested collections ──────────────────────────────
// Each Order has a List<OrderLine>; we want ALL lines across ALL orders.
var allLines = orders
    .SelectMany(o => o.Lines)          // flatten
    .Where(l => l.Quantity > 0)
    .ToList();

// With an index into the parent:
var linesWith OrderId = orders
    .SelectMany(o => o.Lines, (order, line) => new
    {
        order.Id,
        line.ProductId,
        line.Quantity,
    })
    .ToList();

// ── OfType<T> — filter and cast in one step ──────────────────────────────
IEnumerable<object> mixed = GetMixedData();
var strings = mixed.OfType<string>().ToList();   // skips non-strings safely`,
    },
    {
      label: 'Grouping & Ordering',
      language: 'csharp',
      code: `// ── GroupBy — group by key ───────────────────────────────────────────────
var byDept = employees
    .GroupBy(
        e => e.Department,                      // key selector
        e => e.Name)                            // element selector
    .Select(g => new
    {
        Department = g.Key,
        Members    = g.ToList(),
        Count      = g.Count(),
    })
    .ToList();

// Iterate a group:
foreach (var group in byDept)
{
    Console.WriteLine($"{group.Department}: {string.Join(", ", group.Members)}");
}

// ── OrderBy / ThenBy ─────────────────────────────────────────────────────
var sorted = employees
    .OrderBy(e => e.Department)
    .ThenBy(e => e.LastName)
    .ThenByDescending(e => e.HireDate)
    .ToList();

// ── Lookup<TKey, TElement> — like Dictionary but multi-value ─────────────
// Unlike GroupBy().ToDictionary(), Lookup is built in one pass and is read-only.
ILookup<string, Employee> lookup = employees.ToLookup(e => e.Department);
IEnumerable<Employee> engineers = lookup["Engineering"]; // returns empty if key missing`,
    },
    {
      label: 'Aggregation & Quantifiers',
      language: 'csharp',
      code: `// ── Scalar aggregations ──────────────────────────────────────────────────
var orders = GetOrders();

int    total   = orders.Count();
int    active  = orders.Count(o => o.IsActive);
double revenue = orders.Sum(o => o.Amount);
double min     = orders.Min(o => o.Amount);
double max     = orders.Max(o => o.Amount);
double avg     = orders.Average(o => o.Amount);

// ── Any / All / Contains ─────────────────────────────────────────────────
bool hasLargeOrder = orders.Any(o => o.Amount > 10_000);
bool allPaid       = orders.All(o => o.IsPaid);
bool hasPending    = orders.Any(o => o.Status == OrderStatus.Pending);

// Contains works on value equality:
bool has42 = new[] { 1, 42, 99 }.Contains(42);   // true

// ── Aggregate — custom reduce ─────────────────────────────────────────────
// Multiply all quantities together:
int product = new[] { 1, 2, 3, 4 }.Aggregate((acc, x) => acc * x);  // 24

// Aggregate with seed:
string csv = new[] { "Alice", "Bob", "Carol" }
    .Aggregate("Names:", (acc, name) => $"{acc} {name}");
// → "Names: Alice Bob Carol"

// Build a dictionary with Aggregate:
var index = words.Aggregate(
    new Dictionary<char, int>(),
    (dict, word) => { dict[word[0]] = dict.GetValueOrDefault(word[0]) + 1; return dict; });`,
    },
    {
      label: 'Joining & Combining',
      language: 'csharp',
      code: `// ── Join — inner join ────────────────────────────────────────────────────
var orderDetails = orders.Join(
    customers,
    o  => o.CustomerId,       // outer key
    c  => c.Id,               // inner key
    (o, c) => new             // result selector
    {
        OrderId      = o.Id,
        CustomerName = c.Name,
        o.Amount,
    });

// ── GroupJoin — left outer join ───────────────────────────────────────────
var customersWithOrders = customers.GroupJoin(
    orders,
    c => c.Id,
    o => o.CustomerId,
    (c, orderGroup) => new
    {
        Customer   = c.Name,
        OrderCount = orderGroup.Count(),
        TotalSpend = orderGroup.Sum(o => o.Amount),
    });

// ── Zip — pair two sequences element-by-element ──────────────────────────
var names  = new[] { "Alice", "Bob", "Carol" };
var scores = new[] { 95, 82, 78 };

var results = names
    .Zip(scores, (name, score) => $"{name}: {score}")
    .ToList();
// → ["Alice: 95", "Bob: 82", "Carol: 78"]

// ── Set operators ─────────────────────────────────────────────────────────
var all      = listA.Concat(listB);           // union with duplicates
var unique   = listA.Union(listB);            // union, no duplicates
var common   = listA.Intersect(listB);        // elements in both
var onlyInA  = listA.Except(listB);           // elements only in A
var noDups   = listA.Distinct();              // remove duplicates within one list`,
    },
  ];

  quiz: QuizQuestion[] = [
    {
      q: 'What is the difference between First() and FirstOrDefault()?',
      options: [
        'First() is faster than FirstOrDefault()',
        'First() throws InvalidOperationException when the sequence is empty; FirstOrDefault() returns the type default (null/0)',
        'FirstOrDefault() only works with nullable types',
        'They are identical — just different naming conventions',
      ],
      answer: 1,
      explanation: 'First() throws if no element matches or the sequence is empty. FirstOrDefault() returns null for reference types or 0/false for value types instead of throwing.',
    },
    {
      q: 'What does "deferred execution" mean in LINQ?',
      options: [
        'LINQ runs asynchronously on a background thread',
        'The query is compiled at runtime instead of compile time',
        'The query pipeline is not evaluated until the result is enumerated (e.g. in foreach or ToList())',
        'LINQ defers to the database for all operations',
      ],
      answer: 2,
      explanation: 'Deferred execution means the LINQ pipeline builds up an expression or delegate chain but does not execute it until something iterates the IEnumerable<T> — such as a foreach loop, ToList(), or a scalar like Count().',
    },
    {
      q: 'Which syntax is more composable and supports operators like Zip and Aggregate?',
      options: [
        'Query syntax (from x in col select x)',
        'Method syntax (col.Select(x => x))',
        'Both support exactly the same operators',
        'It depends on the .NET version',
      ],
      answer: 1,
      explanation: 'Method syntax supports all LINQ operators including SelectMany, Zip, Aggregate, and OfType. Query syntax only covers a subset. Both compile to identical IL.',
    },
    {
      q: 'What is the difference between Select() and SelectMany()?',
      options: [
        'Select() is for value types; SelectMany() is for reference types',
        'Select() transforms each element 1-to-1; SelectMany() flattens each element\'s nested collection into a single flat sequence',
        'SelectMany() is only available in .NET 7+',
        'Select() runs in parallel; SelectMany() runs sequentially',
      ],
      answer: 1,
      explanation: 'Select() maps each element to exactly one output element. SelectMany() maps each element to a collection and then flattens all those collections into a single sequence — similar to flatMap in other languages.',
    },
  ];

  qna: QnaItem[] = [
    {
      q: 'When does LINQ actually run?',
      a: `LINQ queries using operators like <code>Where</code>, <code>Select</code>, and <code>OrderBy</code> use <strong>deferred execution</strong> — the pipeline is built but not run until the result is consumed.<br><br>
Consumption happens when you:
<ul>
  <li>Call <code>ToList()</code> or <code>ToArray()</code></li>
  <li>Iterate with <code>foreach</code></li>
  <li>Call a scalar operator: <code>Count()</code>, <code>Sum()</code>, <code>First()</code>, <code>Any()</code></li>
</ul>
Scalar aggregations like <code>Sum()</code> and <code>Count()</code> also use deferred execution in the sense that they pull from the source at call time.`,
    },
    {
      q: 'Why is my LINQ slow?',
      a: `Common causes of slow LINQ:
<ul>
  <li><strong>Multiple enumeration</strong> — calling <code>Count()</code> then iterating the same <code>IEnumerable</code> walks the source twice. Fix: call <code>ToList()</code> once.</li>
  <li><strong>N+1 in EF Core</strong> — a <code>Select</code> that accesses a navigation property without <code>Include()</code> fires one query per row. Fix: use <code>.Include()</code>.</li>
  <li><strong>Client-side evaluation</strong> — calling a C# method EF cannot translate pulls all rows to memory first. Fix: filter with translatable predicates before calling <code>AsEnumerable()</code>.</li>
  <li><strong>No index</strong> — EF queries on un-indexed columns cause table scans. Fix: add a database index on filtered/ordered columns.</li>
</ul>`,
    },
    {
      q: 'Can I use LINQ with async?',
      a: `Standard LINQ operators are synchronous. For async, you have two options:<br><br>
<strong>1. Materialise first, then query in-memory:</strong><br>
<code>var items = await dbContext.Orders.ToListAsync();<br>
var result = items.Where(o => o.Amount > 100).ToList();</code><br><br>
<strong>2. Use EF Core async terminal operators:</strong><br>
<code>var result = await dbContext.Orders.Where(o => o.Amount > 100).ToListAsync();</code><br><br>
<strong>3. Use <code>IAsyncEnumerable&lt;T&gt;</code> with <code>await foreach</code></strong> for streaming large datasets without loading everything into memory at once.`,
    },
    {
      q: 'What is the difference between Select and SelectMany?',
      a: `<strong>Select</strong> is a 1-to-1 projection — each input element produces exactly one output element.<br><br>
<code>orders.Select(o => o.CustomerId)</code> → one CustomerId per order.<br><br>
<strong>SelectMany</strong> is a 1-to-many then flatten — each input element produces a <em>collection</em>, and all those collections are merged into one flat sequence.<br><br>
<code>orders.SelectMany(o => o.Lines)</code> → all OrderLines from all orders in a single flat list.<br><br>
Think of <code>SelectMany</code> as <code>flatMap</code> (JavaScript), <code>bind</code> (Haskell), or <code>stream().flatMap()</code> (Java).`,
    },
  ];

  challenge: Challenge = {
    title: 'Top Customers by Total Spend',
    description:
      'Given a list of Order records (with CustomerId, Amount, and Date), use LINQ to find the top 3 customers by total spend in the last 30 days. Return a list of { CustomerId, TotalSpend } ordered descending by TotalSpend.',
    language: 'csharp',
    hints: [
      'Use Where() to filter orders within the last 30 days (DateTime.UtcNow.AddDays(-30))',
      'Use GroupBy() to group by CustomerId',
      'Use Select() with Sum() inside each group to compute TotalSpend',
      'Use OrderByDescending() then Take(3) to get the top 3',
    ],
    starterCode: `record Order(int CustomerId, decimal Amount, DateTime Date);

static IEnumerable<(int CustomerId, decimal TotalSpend)> TopCustomers(
    IEnumerable<Order> orders)
{
    var cutoff = DateTime.UtcNow.AddDays(-30);

    // TODO:
    // 1. Filter to orders in the last 30 days
    // 2. Group by CustomerId
    // 3. Project each group to { CustomerId, TotalSpend = Sum of amounts }
    // 4. Order by TotalSpend descending
    // 5. Take the top 3
    // 6. Return as IEnumerable<(int, decimal)>

    throw new NotImplementedException();
}`,
    solution: `record Order(int CustomerId, decimal Amount, DateTime Date);

static IEnumerable<(int CustomerId, decimal TotalSpend)> TopCustomers(
    IEnumerable<Order> orders)
{
    var cutoff = DateTime.UtcNow.AddDays(-30);

    return orders
        .Where(o => o.Date >= cutoff)
        .GroupBy(o => o.CustomerId)
        .Select(g => (
            CustomerId: g.Key,
            TotalSpend: g.Sum(o => o.Amount)))
        .OrderByDescending(x => x.TotalSpend)
        .Take(3);
}

// Example usage:
var orders = new List<Order>
{
    new(1, 500m,  DateTime.UtcNow.AddDays(-5)),
    new(1, 300m,  DateTime.UtcNow.AddDays(-10)),
    new(2, 900m,  DateTime.UtcNow.AddDays(-3)),
    new(3, 150m,  DateTime.UtcNow.AddDays(-60)),  // outside 30-day window
    new(4, 700m,  DateTime.UtcNow.AddDays(-1)),
    new(2, 200m,  DateTime.UtcNow.AddDays(-15)),
};

foreach (var (id, spend) in TopCustomers(orders))
    Console.WriteLine($"Customer {id}: £{spend:N2}");

// Output:
// Customer 2: £1,100.00
// Customer 4: £700.00
// Customer 1: £800.00`,
  };
}
