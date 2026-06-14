import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CodeBlockComponent, CodeTab } from '../../../shared/code-block/code-block';
import { TheoryBlockComponent, TheoryPoint } from '../../../shared/theory-block/theory-block';
import { QnaBlockComponent, QnaItem } from '../../../shared/qna-block/qna-block';
import { QuizBlockComponent, QuizQuestion } from '../../../shared/quiz-block/quiz-block';
import { ChallengeBlockComponent, Challenge } from '../../../shared/challenge-block/challenge-block';
import { QuickRefComponent, QuickRefItem } from '../../../shared/quick-ref/quick-ref';
import { PageMetaComponent } from '../../../shared/page-meta/page-meta';
import { PageCompleteComponent } from '../../../shared/page-complete/page-complete';
import { VideoEmbedComponent } from '../../../shared/video-embed/video-embed';
import { CommonMistakesComponent, CommonMistake } from '../../../shared/common-mistakes/common-mistakes';
import { RevisionCardComponent, RevisionSummary } from '../../../shared/revision-card/revision-card';

@Component({
  selector: 'app-csharp-linq',
  standalone: true,
  imports: [
    CommonModule, CodeBlockComponent, TheoryBlockComponent, QnaBlockComponent,
    QuizBlockComponent, ChallengeBlockComponent, QuickRefComponent,
    PageMetaComponent, PageCompleteComponent, VideoEmbedComponent,
    CommonMistakesComponent, RevisionCardComponent,
  ],
  templateUrl: './linq.html',
  styleUrl: './linq.scss',
})
export class CsharpLinq {

  quickRef: QuickRefItem[] = [
    { name: 'Where()',              type: 'method', desc: 'Filters a sequence by a predicate. Returns IEnumerable<T> containing only elements that satisfy the condition.' },
    { name: 'Select()',             type: 'method', desc: 'Projects each element into a new form — transforms the shape of each item (map in other languages).' },
    { name: 'SelectMany()',         type: 'method', desc: 'Flattens a sequence of sequences into a single sequence. Use when each element contains a nested collection.' },
    { name: 'GroupBy()',            type: 'method', desc: 'Groups elements by a key selector and returns IEnumerable<IGrouping<TKey,TElement>>.' },
    { name: 'OrderBy() / ThenBy()', type: 'method', desc: 'Sorts a sequence ascending by a key; ThenBy adds a secondary sort. Use ThenByDescending for reversed secondary.' },
    { name: 'First() / FirstOrDefault()', type: 'method', desc: 'Returns the first matching element. First() throws if empty; FirstOrDefault() returns default (null/0).' },
    { name: 'Any() / All()',        type: 'method', desc: 'Any() returns true if at least one element matches; All() returns true only if every element matches.' },
    { name: 'Count() / Sum() / Average()', type: 'method', desc: 'Scalar aggregation operators. Count() counts matching elements; Sum/Average compute numeric totals.' },
    { name: 'Zip()',                type: 'method', desc: 'Merges two sequences element-by-element using a result selector. Stops at the shorter sequence.' },
    { name: 'ToList() / ToArray()', type: 'method', desc: 'Materialises a lazy IEnumerable<T> into a concrete collection. Forces immediate evaluation of the pipeline.' },
    { name: 'AsEnumerable()',       type: 'method', desc: 'Switches an IQueryable<T> to client-side (in-memory) LINQ evaluation — use before operators EF cannot translate.' },
    { name: 'IQueryable<T>',        type: 'interface', desc: 'Composable query over a data source (EF Core, etc.) — builds an expression tree translated to SQL.' },
  ];

  theory: TheoryPoint[] = [
    {
      heading: 'LINQ is lazy by default',
      points: [
        'Operators like <code>Where</code> and <code>Select</code> return <code>IEnumerable&lt;T&gt;</code> — they do not execute until the sequence is enumerated.',
        'Enumeration happens in a <code>foreach</code> loop, when you call <code>ToList()</code>, or when a scalar like <code>Count()</code> or <code>First()</code> is called.',
        'This means you can compose a long chain of operators cheaply; work only happens at the point of consumption.',
        'Call <code>ToList()</code> <strong>once</strong> at the end of a chain to materialise the result and avoid re-evaluating the query on each pass.',
        'Deferred execution can be a trap: if the source changes between query construction and enumeration, you get the data as it was at enumeration time — which may surprise callers who expect a snapshot.',
      ],
    },
    {
      heading: 'Method syntax vs query syntax',
      points: [
        'Both compile to exactly the same IL — query syntax is just syntactic sugar over method calls.',
        'Query syntax: <code>from x in col where x.Age &gt; 18 select x.Name</code>.',
        'Method syntax: <code>col.Where(x =&gt; x.Age &gt; 18).Select(x =&gt; x.Name)</code>.',
        'Method syntax is more composable and supports operators query syntax does not expose, such as <code>SelectMany</code>, <code>Zip</code>, and <code>Aggregate</code>.',
        'Prefer method syntax in most codebases for consistency; query syntax can be clearer for complex multi-join queries where it resembles SQL.',
      ],
    },
    {
      heading: 'Avoid multiple enumeration',
      points: [
        'Calling <code>Count()</code> followed by a <code>foreach</code> on the same <code>IEnumerable&lt;T&gt;</code> iterates the source <strong>twice</strong>.',
        'If the source is a database query or a file stream, this may cause two round-trips or two file reads — potentially returning different results.',
        'Fix: call <code>ToList()</code> once and work on the resulting <code>List&lt;T&gt;</code>.',
        'Roslyn analyzer MA0020 (Meziantou.Analyzer) can detect multiple enumeration at compile time.',
        'The pattern "if Any() then First()" is also a double enumeration — use <code>FirstOrDefault()</code> and null-check instead.',
      ],
    },
    {
      heading: 'IQueryable<T> vs IEnumerable<T>',
      points: [
        '<code>IEnumerable&lt;T&gt;</code> is for in-memory LINQ — the C# runtime executes delegate functions against objects already loaded.',
        '<code>IQueryable&lt;T&gt;</code> represents a composable query against a data source (EF Core, LINQ to SQL) — operators build an <em>expression tree</em> that is translated to SQL and executed on the server.',
        'Key rule: filter and project with <code>IQueryable</code> (server-side) as much as possible before calling <code>ToList()</code> or <code>AsEnumerable()</code> to switch to client-side.',
        'When EF Core cannot translate an operator to SQL it throws <code>InvalidOperationException</code>. Call <code>AsEnumerable()</code> first to force client-side evaluation of that step and beyond.',
        'Adding a <code>Where</code> clause to an <code>IQueryable</code> does not execute a query — it appends to the expression tree. Only terminal operators (<code>ToList</code>, <code>First</code>, <code>Count</code>) trigger SQL execution.',
      ],
    },
    {
      heading: 'LINQ to Objects vs LINQ to EF',
      points: [
        'In-memory LINQ (<em>LINQ to Objects</em>) runs C# delegate functions directly against in-memory collections with no translation step.',
        'EF Core LINQ (<em>LINQ to Entities</em>) translates the expression tree to SQL and executes it on the database server — only data matching the query is returned.',
        'The same LINQ operator may behave differently: <code>string.Compare()</code> is case-sensitive in C# but follows database collation in SQL.',
        'Operators that EF cannot translate (e.g. custom C# methods, complex string operations) throw a runtime <code>InvalidOperationException</code> — move those to a client-side evaluation using <code>AsEnumerable()</code> first.',
        'EF Core N+1 problem: accessing a navigation property inside a <code>Select</code> without <code>Include()</code> fires one SQL query per row. Always use <code>Include()</code> or project the needed columns directly in the query.',
      ],
    },
    {
      heading: 'Materialisation and terminal operators',
      points: [
        '<code>ToList()</code> and <code>ToArray()</code> force immediate execution and return a concrete in-memory collection — subsequent operations use the snapshot, not the original query.',
        '<code>ToDictionary(keySelector)</code> materialises into a <code>Dictionary&lt;TKey, TValue&gt;</code>. Throws on duplicate keys — use <code>GroupBy().ToDictionary()</code> or <code>ToLookup()</code> when duplicates are expected.',
        '<code>ToLookup(keySelector)</code> is a multi-value dictionary — each key maps to an <code>IEnumerable&lt;T&gt;</code>. Built in one pass and returns an empty sequence (not an exception) for missing keys.',
        'Scalar terminals (<code>Count()</code>, <code>Sum()</code>, <code>First()</code>, <code>Any()</code>) also force execution and return a single value — they do not support further chaining.',
        '<code>ToHashSet()</code> materialises into a <code>HashSet&lt;T&gt;</code> for O(1) membership checks — useful when you need to call <code>Contains()</code> repeatedly on the result.',
      ],
    },
  ];

  tabs: CodeTab[] = [
    {
      label: 'Filtering & Projection',
      language: 'csharp',
      code: `// Where — filter with multiple conditions
var adults = people
    .Where(p => p.Age >= 18 && p.IsActive)
    .ToList();

// Select — transform / project to new shape
var names = people
    .Where(p => p.Age >= 18)
    .Select(p => new
    {
        p.FirstName,
        p.LastName,
        FullName = $"{p.FirstName} {p.LastName}",
    })
    .ToList();

// SelectMany — flatten nested collections
// Each Order has a List<OrderLine>; we want ALL lines across ALL orders.
var allLines = orders
    .SelectMany(o => o.Lines)
    .Where(l => l.Quantity > 0)
    .ToList();

// SelectMany with parent correlation
var linesWithOrderId = orders
    .SelectMany(o => o.Lines, (order, line) => new
    {
        order.Id,
        line.ProductId,
        line.Quantity,
    })
    .ToList();

// OfType<T> — filter and cast in one step
IEnumerable<object> mixed = GetMixedData();
var strings = mixed.OfType<string>().ToList();   // skips non-strings safely

// Avoid double enumeration: Any() + First() is two passes
// BAD:
if (adults.Any()) Console.WriteLine(adults.First().Name);

// GOOD:
var first = adults.FirstOrDefault();
if (first is not null) Console.WriteLine(first.Name);`,
    },
    {
      label: 'Grouping & Ordering',
      language: 'csharp',
      code: `// GroupBy — group by key
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

// OrderBy / ThenBy — stable multi-column sort
var sorted = employees
    .OrderBy(e => e.Department)
    .ThenBy(e => e.LastName)
    .ThenByDescending(e => e.HireDate)
    .ToList();

// Lookup<TKey, TElement> — like Dictionary but multi-value, one pass
// Unlike GroupBy().ToDictionary(), Lookup returns empty (not exception) for missing keys.
ILookup<string, Employee> lookup = employees.ToLookup(e => e.Department);
IEnumerable<Employee> engineers = lookup["Engineering"]; // empty if key missing, no throw

// ToDictionary — materialise to single-value map (throws on duplicate keys!)
var byId = employees.ToDictionary(e => e.Id);
var byIdName = employees.ToDictionary(e => e.Id, e => e.Name);

// ToHashSet — O(1) membership lookup
var seniorIds = seniors.Select(e => e.Id).ToHashSet();
var seniorEmployees = employees.Where(e => seniorIds.Contains(e.Id)).ToList();`,
    },
    {
      label: 'Aggregation & Quantifiers',
      language: 'csharp',
      code: `// Scalar aggregations
var orders = GetOrders();

int     total   = orders.Count();
int     active  = orders.Count(o => o.IsActive);
decimal revenue = orders.Sum(o => o.Amount);
decimal min     = orders.Min(o => o.Amount);
decimal max     = orders.Max(o => o.Amount);
double  avg     = orders.Average(o => (double)o.Amount);

// Any / All / Contains
bool hasLargeOrder = orders.Any(o => o.Amount > 10_000);
bool allPaid       = orders.All(o => o.IsPaid);
bool has42         = new[] { 1, 42, 99 }.Contains(42);   // true

// Aggregate — custom reduce (fold)
int product = new[] { 1, 2, 3, 4 }.Aggregate((acc, x) => acc * x);  // 24

// Aggregate with seed
string csv = new[] { "Alice", "Bob", "Carol" }
    .Aggregate("Names:", (acc, name) => $"{acc} {name}");
// "Names: Alice Bob Carol"

// Efficient: use MinBy/MaxBy (LINQ .NET 6+) instead of OrderBy().First()
var cheapest  = orders.MinBy(o => o.Amount);   // one pass, no sort
var mostExpensive = orders.MaxBy(o => o.Amount);

// Chunk — split into batches (.NET 6+)
foreach (var batch in orders.Chunk(100))
{
    await ProcessBatch(batch);   // IEnumerable<Order[]>
}`,
    },
    {
      label: 'Joining & Combining',
      language: 'csharp',
      code: `// Join — inner join
var orderDetails = orders.Join(
    customers,
    o => o.CustomerId,       // outer key
    c => c.Id,               // inner key
    (o, c) => new            // result selector
    {
        OrderId      = o.Id,
        CustomerName = c.Name,
        o.Amount,
    });

// GroupJoin — left outer join
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

// Zip — pair two sequences element-by-element
var names  = new[] { "Alice", "Bob", "Carol" };
var scores = new[] { 95, 82, 78 };

var results = names
    .Zip(scores, (name, score) => $"{name}: {score}")
    .ToList();
// ["Alice: 95", "Bob: 82", "Carol: 78"]

// Set operators
var all     = listA.Concat(listB);       // union with duplicates
var unique  = listA.Union(listB);        // union, no duplicates
var common  = listA.Intersect(listB);    // elements in both
var onlyInA = listA.Except(listB);       // elements only in A
var noDups  = listA.Distinct();          // remove duplicates

// IQueryable vs IEnumerable — EF Core example
// Good: filter on the server (SQL WHERE clause)
var activeUsers = await dbContext.Users
    .Where(u => u.IsActive)              // translated to SQL
    .Select(u => new { u.Id, u.Name })   // SQL projection
    .ToListAsync();

// Switch to client-side when needed (AsEnumerable)
var formatted = await dbContext.Users
    .Where(u => u.IsActive)
    .AsEnumerable()                       // beyond here: in-memory C#
    .Select(u => FormatUser(u))           // custom C# method — not translatable to SQL
    .ToList();`,
    },
  ];

  mistakes: CommonMistake[] = [
    {
      title: 'Multiple enumeration — iterating IEnumerable<T> twice',
      wrong: `IEnumerable<Order> orders = GetExpensiveQuery();

int count = orders.Count();   // first pass through the source
foreach (var o in orders)     // second pass!
    Console.WriteLine(o.Amount);
// If source is a DB query: two round-trips
// If source is a file: file read twice (second may differ)`,
      right: `// Materialise once, use the list everywhere
var orders = GetExpensiveQuery().ToList();

int count = orders.Count;     // O(1) — no re-execution
foreach (var o in orders)     // same snapshot
    Console.WriteLine(o.Amount);`,
      explanation: 'IEnumerable<T> is a lazy pipeline, not a collection. Every time you enumerate it, it re-executes the entire pipeline from the source. For database queries this means extra round-trips; for file streams it means re-reading from the start. Call ToList() once to materialise the results into memory, then query the list freely.',
    },
    {
      title: 'Using First() instead of FirstOrDefault() — unexpected exception on empty',
      wrong: `var users = GetUsers();

// If users is empty, this throws InvalidOperationException!
var first = users.Where(u => u.IsAdmin).First();
Console.WriteLine(first.Name);`,
      right: `var adminUser = users.FirstOrDefault(u => u.IsAdmin);

if (adminUser is not null)
    Console.WriteLine(adminUser.Name);
else
    Console.WriteLine("No admin found");`,
      explanation: 'First() throws InvalidOperationException when no element satisfies the predicate or the sequence is empty. Use FirstOrDefault() and null-check the result when the absence of a match is a normal scenario. Reserve First() for cases where you have already verified the element exists (e.g. after Any(), or when working with guaranteed non-empty collections).',
    },
    {
      title: 'Materialising with ToList() in the middle of an EF Core chain — loading all rows first',
      wrong: `// ToList() forces all 1 million rows into memory, THEN filters in C#
var result = await dbContext.Orders
    .ToListAsync()            // loads everything into memory!
    .ContinueWith(t => t.Result.Where(o => o.Amount > 100).ToList());
// Equivalent bad pattern:
var all = dbContext.Orders.ToList();
var filtered = all.Where(o => o.Amount > 100).ToList();`,
      right: `// Filter stays as IQueryable — generates SQL WHERE clause
var result = await dbContext.Orders
    .Where(o => o.Amount > 100)   // part of the SQL query
    .ToListAsync();               // only matching rows returned`,
      explanation: 'Calling ToList() or AsEnumerable() in the middle of an EF Core query forces everything before that point to be loaded into memory. All subsequent LINQ operators then run in C# against the full dataset. Always compose your Where/Select/OrderBy clauses before the terminal ToListAsync() to let EF translate them to efficient SQL.',
    },
    {
      title: 'Using OrderBy().First() instead of MinBy() — unnecessary full sort',
      wrong: `// Sorts the ENTIRE sequence just to get the smallest element
var cheapest = orders.OrderBy(o => o.Amount).First();
var mostExpensive = orders.OrderByDescending(o => o.Amount).First();
// OrderBy is O(n log n); you only need O(n) for min/max`,
      right: `// MinBy/MaxBy — O(n) single pass, .NET 6+
var cheapest     = orders.MinBy(o => o.Amount);
var mostExpensive = orders.MaxBy(o => o.Amount);

// For scalar values, Min/Max directly
decimal minAmount = orders.Min(o => o.Amount);  // also O(n)`,
      explanation: 'OrderBy is O(n log n) — it sorts the entire sequence before you can take the first element. MinBy() and MaxBy() (introduced in .NET 6) do a single O(n) pass to find the element with the smallest or largest key, which is both faster and clearer in intent.',
    },
    {
      title: 'Using ToDictionary() when duplicate keys are possible — silent exception',
      wrong: `// If two employees share a department name, this throws!
var byDept = employees.ToDictionary(e => e.Department);
// ArgumentException: An item with the same key has already been added.`,
      right: `// Option 1: ToLookup — designed for multi-value keys
ILookup<string, Employee> byDept = employees.ToLookup(e => e.Department);
var engineers = byDept["Engineering"];  // IEnumerable<Employee>

// Option 2: GroupBy + ToDictionary
var dict = employees
    .GroupBy(e => e.Department)
    .ToDictionary(g => g.Key, g => g.ToList());`,
      explanation: 'ToDictionary() throws ArgumentException if the key selector produces duplicate keys. When a key can map to multiple values, use ToLookup() (built-in multi-value map, returns empty sequence for missing keys) or GroupBy().ToDictionary() to build a Dictionary<string, List<T>>.',
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
      explanation: '<code>First()</code> throws <code>InvalidOperationException</code> if no element matches or the sequence is empty. <code>FirstOrDefault()</code> returns <code>null</code> for reference types or <code>0</code>/<code>false</code> for value types instead of throwing.',
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
      explanation: 'Deferred execution means the LINQ pipeline builds up an expression or delegate chain but does not execute it until something iterates the <code>IEnumerable&lt;T&gt;</code> — such as a <code>foreach</code> loop, <code>ToList()</code>, or a scalar like <code>Count()</code>.',
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
      explanation: 'Method syntax supports all LINQ operators including <code>SelectMany</code>, <code>Zip</code>, <code>Aggregate</code>, and <code>OfType</code>. Query syntax only covers a subset. Both compile to identical IL.',
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
      explanation: '<code>Select()</code> maps each element to exactly one output element. <code>SelectMany()</code> maps each element to a <em>collection</em> and flattens all those collections into a single sequence — similar to <code>flatMap</code> in other languages.',
    },
    {
      q: 'What is the key difference between IQueryable<T> and IEnumerable<T>?',
      options: [
        'IQueryable<T> is faster for all operations',
        'IEnumerable<T> runs in-memory using delegates; IQueryable<T> builds an expression tree translated to SQL or another query language',
        'IQueryable<T> supports async operations; IEnumerable<T> does not',
        'IEnumerable<T> is generic; IQueryable<T> is non-generic',
      ],
      answer: 1,
      explanation: '<code>IEnumerable&lt;T&gt;</code> runs LINQ operators as C# delegates against objects already in memory. <code>IQueryable&lt;T&gt;</code> builds an expression tree that a provider (EF Core, etc.) translates to SQL — filtering and projection happen on the server, not in memory.',
    },
    {
      q: 'Why should you use ToLookup() instead of ToDictionary() when a key can appear multiple times?',
      options: [
        'ToLookup() is faster for all cases',
        'ToDictionary() silently replaces duplicates; ToLookup() preserves all values per key',
        'ToDictionary() throws ArgumentException on duplicate keys; ToLookup() maps each key to an IEnumerable<T>',
        'ToLookup() is only available in .NET 8+',
      ],
      answer: 2,
      explanation: '<code>ToDictionary()</code> throws <code>ArgumentException</code> if the key selector produces duplicate keys. <code>ToLookup()</code> is purpose-built for multi-value keys — each key maps to an <code>IEnumerable&lt;T&gt;</code>, and accessing a missing key returns an empty sequence rather than throwing.',
    },
    {
      q: 'What does calling AsEnumerable() on an IQueryable<T> do?',
      options: [
        'It converts the query to async',
        'It executes the SQL query immediately and returns a List<T>',
        'It switches subsequent operators from server-side (SQL translation) to client-side (in-memory C#) evaluation',
        'It prevents further LINQ operators from being chained',
      ],
      answer: 2,
      explanation: '<code>AsEnumerable()</code> returns the current query as <code>IEnumerable&lt;T&gt;</code>, causing all operators <em>after</em> it to execute as in-memory LINQ instead of being translated to SQL. Operators before <code>AsEnumerable()</code> still generate SQL. Use it when you need a custom C# method that EF Core cannot translate.',
    },
  ];

  qna: QnaItem[] = [
    {
      q: 'When does LINQ actually run?',
      a: 'LINQ queries using operators like <code>Where</code>, <code>Select</code>, and <code>OrderBy</code> use <strong>deferred execution</strong> — the pipeline is built but not run until the result is consumed. Consumption happens when you call <code>ToList()</code> or <code>ToArray()</code>, iterate with <code>foreach</code>, or call a scalar operator like <code>Count()</code>, <code>Sum()</code>, <code>First()</code>, or <code>Any()</code>.',
    },
    {
      q: 'Why is my LINQ slow?',
      a: 'Common causes of slow LINQ: <strong>Multiple enumeration</strong> — calling <code>Count()</code> then iterating the same <code>IEnumerable</code> walks the source twice. Fix: call <code>ToList()</code> once. <strong>N+1 in EF Core</strong> — a <code>Select</code> that accesses a navigation property without <code>Include()</code> fires one query per row. Fix: use <code>.Include()</code>. <strong>Client-side evaluation</strong> — calling a C# method EF cannot translate pulls all rows to memory first. Fix: filter with translatable predicates before <code>AsEnumerable()</code>. <strong>No index</strong> — EF queries on un-indexed columns cause table scans. Fix: add a database index on filtered/ordered columns.',
    },
    {
      q: 'Can I use LINQ with async?',
      a: 'Standard LINQ operators are synchronous. For async you have two options: <strong>Materialise first, then query in-memory:</strong> <code>var items = await dbContext.Orders.ToListAsync();</code> then query the list. <strong>Use EF Core async terminal operators:</strong> <code>await dbContext.Orders.Where(o => o.Amount > 100).ToListAsync();</code>. For streaming, use <code>IAsyncEnumerable&lt;T&gt;</code> with <code>await foreach</code> to process large datasets without loading everything into memory at once.',
    },
    {
      q: 'What is the difference between Select and SelectMany?',
      a: '<code>Select</code> is a 1-to-1 projection — each input element produces exactly one output element: <code>orders.Select(o => o.CustomerId)</code> → one CustomerId per order. <code>SelectMany</code> is 1-to-many then flatten — each input element produces a <em>collection</em>, and all collections are merged into one flat sequence: <code>orders.SelectMany(o => o.Lines)</code> → all OrderLines across all orders in a single flat list. Think of it as <code>flatMap</code> (JavaScript) or <code>stream().flatMap()</code> (Java).',
    },
    {
      q: 'What is the difference between Concat and Union?',
      a: '<code>Concat</code> appends the second sequence to the first, preserving all duplicates — it is a simple append with O(n+m) cost and no extra allocation. <code>Union</code> also combines both sequences but removes duplicates by computing a set union — it uses a hash set internally so it is O(n+m) in time but allocates a set. Use <code>Concat</code> when duplicates are expected and fine; use <code>Union</code> when you want a deduplicated combined sequence.',
    },
    {
      q: 'When should I use ToLookup() instead of GroupBy().ToDictionary()?',
      a: '<code>ToLookup()</code> is a one-pass operation that builds a read-only multi-value dictionary immediately. It is semantically equivalent to <code>GroupBy().ToDictionary(g => g.Key, g => g.ToList())</code> but more efficient. Use <code>ToLookup()</code> when you need to query the same grouped data multiple times (the result is cached), when you want an empty sequence (not an exception) for a missing key, or when building a lookup table that is consulted repeatedly. Use <code>GroupBy()</code> when you want to chain further LINQ operators before materialising.',
    },
    {
      q: 'How does LINQ handle null elements in a sequence?',
      a: 'LINQ operators generally do not filter out nulls automatically — they pass nulls through the pipeline. <code>Where(x => x.Prop == value)</code> throws <code>NullReferenceException</code> if any element is null. Guard with a null-check predicate: <code>Where(x => x is not null && x.Prop == value)</code>. <code>OfType&lt;T&gt;()</code> is a notable exception — it silently skips null elements when filtering by type. Scalar operators like <code>Min()</code>, <code>Max()</code>, and <code>Average()</code> skip nulls in nullable overloads.',
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

// Example usage
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
    Console.WriteLine($"Customer {id}: {spend:C}");

// Customer 2: £1,100.00
// Customer 1: £800.00
// Customer 4: £700.00`,
  };

  revision: RevisionSummary = {
    oneLiner: 'LINQ is lazy — pipelines execute only when enumerated. Materialise with ToList() once. IQueryable<T> runs on the server (SQL); IEnumerable<T> runs in memory. Use FirstOrDefault, MinBy, ToLookup — avoid multiple enumeration.',
    mustKnow: [
      'Deferred execution: Where/Select do not run until foreach, ToList(), or a scalar terminal is called.',
      'Multiple enumeration trap: calling Count() then iterating the same IEnumerable runs the source twice — fix: ToList() first.',
      'IQueryable<T> builds an expression tree → translated to SQL by EF Core. IEnumerable<T> runs C# delegates in memory.',
      'AsEnumerable() switches from server-side to client-side evaluation — operators before it generate SQL, operators after run in C#.',
      'ToDictionary() throws on duplicate keys. ToLookup() maps each key to IEnumerable<T> and returns empty (not exception) for missing keys.',
      'MinBy()/MaxBy() (.NET 6+): O(n) single pass. Prefer over OrderBy().First() which is O(n log n) full sort.',
      'SelectMany() flattens: each element → collection → merged. Equivalent to flatMap in other languages.',
    ],
    interviewFocus: [
      'What is deferred execution? (pipeline not evaluated until enumerated — avoids unnecessary work)',
      'What is the difference between IQueryable<T> and IEnumerable<T>? (expression tree → SQL vs delegates → in-memory)',
      'What causes N+1 queries in EF Core LINQ? (accessing navigation properties without Include — one query per row)',
      'What is multiple enumeration and how do you fix it? (re-executing the query pipeline — fix with ToList() once)',
      'When would you use ToLookup() over ToDictionary()? (multiple values per key; missing keys return empty, not exception)',
    ],
  };
}
