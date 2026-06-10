import { Component, signal, computed } from '@angular/core';

type CsSection = 'types' | 'oop' | 'linq' | 'async' | 'patterns' | 'collections' | 'generics' | 'exceptions';

interface CheatEntry { name: string; desc: string; example: string; tag?: string; }

@Component({
  selector: 'app-csharp-cheatsheet',
  standalone: true,
  imports: [],
  templateUrl: './cheatsheet.html',
  styleUrl: './cheatsheet.scss',
})
export class CsharpCheatsheetComponent {
  active = signal<CsSection>('types');
  searchTerm = signal('');

  sections: { key: CsSection; label: string; icon: string }[] = [
    { key: 'types',       label: 'Types & Operators',  icon: '🔢' },
    { key: 'oop',         label: 'OOP',                icon: '🏛️' },
    { key: 'linq',        label: 'LINQ',               icon: '🔍' },
    { key: 'async',       label: 'async / await',      icon: '⚡' },
    { key: 'patterns',    label: 'Pattern Matching',   icon: '🎯' },
    { key: 'collections', label: 'Collections',        icon: '📦' },
    { key: 'generics',    label: 'Generics',           icon: '🧬' },
    { key: 'exceptions',  label: 'Exceptions',         icon: '⚠️' },
  ];

  typesEntries: CheatEntry[] = [
    { name: 'var',                 desc: 'Implicitly typed local variable — type inferred at compile time', example: 'var x = 42;', tag: 'C# 3' },
    { name: 'string interpolation',desc: 'Embed expressions in strings using $"..."', example: 'var msg = $"Hello {name}!";', tag: 'C# 6' },
    { name: 'null-coalescing ??',  desc: 'Return left side if not null, otherwise right side', example: 'string s = name ?? "unknown";' },
    { name: 'null-coalescing ??=', desc: 'Assign right side only if left is null', example: 'name ??= "default";', tag: 'C# 8' },
    { name: 'null-conditional ?.',  desc: 'Access member only if object is not null', example: 'int? len = text?.Length;' },
    { name: 'is type check',       desc: 'Test type and optionally bind to a variable', example: 'if (obj is string s) Console.Write(s);', tag: 'C# 7' },
    { name: 'as cast',             desc: 'Safe cast that returns null on failure instead of throwing', example: 'var list = obj as List<int>;' },
    { name: 'checked / unchecked', desc: 'Enable or disable overflow checking for integral arithmetic', example: 'int x = checked(int.MaxValue + 1);' },
    { name: 'typeof',              desc: 'Get the System.Type object at compile time', example: 'Type t = typeof(string);' },
    { name: 'nameof',              desc: 'Return the unqualified name of a symbol as a string', example: 'throw new ArgumentNullException(nameof(value));', tag: 'C# 6' },
    { name: 'ternary ?:',          desc: 'Inline conditional expression — condition ? trueVal : falseVal', example: 'string label = count == 1 ? "item" : "items";' },
    { name: 'range ..',            desc: 'Create a range of indices for arrays and spans', example: 'int[] slice = arr[1..4];', tag: 'C# 8' },
    { name: 'index ^',             desc: 'Index from end of a collection', example: 'int last = arr[^1];', tag: 'C# 8' },
    { name: 'const',               desc: 'Compile-time constant — value baked into IL', example: 'const double Pi = 3.14159;' },
    { name: 'readonly',            desc: 'Field that can only be assigned during construction', example: 'readonly int _max;' },
    { name: 'using declaration',   desc: 'Dispose resource at end of enclosing scope without extra braces', example: 'using var stream = File.OpenRead(path);', tag: 'C# 8' },
  ];

  oopEntries: CheatEntry[] = [
    { name: 'record',              desc: 'Immutable reference type with value-based equality and with-expressions', example: 'record Person(string Name, int Age);', tag: 'C# 9' },
    { name: 'record struct',       desc: 'Value-type record with the same benefits as record class', example: 'record struct Point(double X, double Y);', tag: 'C# 10' },
    { name: 'init setter',         desc: 'Property that can only be set during object initialization', example: 'public string Name { get; init; }', tag: 'C# 9' },
    { name: 'with expression',     desc: 'Non-destructively copy a record with changed properties', example: 'var p2 = p1 with { Age = 30 };', tag: 'C# 9' },
    { name: 'primary constructor', desc: 'Declare constructor parameters inline on the class declaration', example: 'class Logger(string prefix) { }', tag: 'C# 12' },
    { name: 'required member',     desc: 'Force callers to set a property in the object initializer', example: 'public required string Name { get; set; }', tag: 'C# 11' },
    { name: 'sealed class',        desc: 'Prevent further inheritance from a class', example: 'sealed class Token { }' },
    { name: 'abstract class',      desc: 'Base class with abstract members that subclasses must implement', example: 'abstract class Shape { abstract double Area(); }' },
    { name: 'interface default impl', desc: 'Provide a default method body in an interface', example: 'interface ILogger { void Log(string m) => Console.Write(m); }', tag: 'C# 8' },
    { name: 'static class',        desc: 'Class that cannot be instantiated — all members must be static', example: 'static class MathUtils { public static int Square(int n) => n * n; }' },
    { name: 'partial class',       desc: 'Split a class definition across multiple files', example: 'partial class MyForm { }  // MyForm.Designer.cs' },
    { name: 'operator overloading',desc: 'Define custom behaviour for operators on your types', example: 'public static Vector operator +(Vector a, Vector b) => new(a.X+b.X, a.Y+b.Y);' },
    { name: 'implicit conversion', desc: 'Allow a type to be silently converted without a cast', example: 'public static implicit operator double(Money m) => m.Amount;' },
    { name: 'extension method',    desc: 'Add methods to existing types without modifying them', example: 'static bool IsNullOrEmpty(this string? s) => string.IsNullOrEmpty(s);', tag: 'C# 3' },
  ];

  linqEntries: CheatEntry[] = [
    { name: 'Where()',             desc: 'Filter elements by a predicate', example: 'var adults = people.Where(p => p.Age >= 18);' },
    { name: 'Select()',            desc: 'Project each element to a new shape', example: 'var names = people.Select(p => p.Name);' },
    { name: 'SelectMany()',        desc: 'Flatten nested collections into one sequence', example: 'var tags = posts.SelectMany(p => p.Tags);' },
    { name: 'OrderBy / ThenBy()',  desc: 'Sort ascending; break ties with secondary key', example: 'var sorted = list.OrderBy(x => x.Last).ThenBy(x => x.First);' },
    { name: 'GroupBy()',           desc: 'Group elements by a key', example: 'var byDept = staff.GroupBy(e => e.Department);' },
    { name: 'Join()',              desc: 'Inner join two sequences on a matching key', example: 'var q = orders.Join(customers, o => o.CId, c => c.Id, (o,c) => new { o, c });' },
    { name: 'First / FirstOrDefault()', desc: 'Return first element; FirstOrDefault returns null/default if empty', example: 'var first = list.FirstOrDefault(x => x > 5);' },
    { name: 'Single / SingleOrDefault()', desc: 'Expect exactly one match; throws if more than one found', example: 'var user = users.Single(u => u.Id == id);' },
    { name: 'Any() / All()',       desc: 'Check if any or all elements satisfy a predicate', example: 'bool hasAdmin = users.Any(u => u.Role == "Admin");' },
    { name: 'Count() / Sum() / Average()', desc: 'Aggregate operators — Count iterates unless on a List', example: 'int total = orders.Sum(o => o.Quantity);' },
    { name: 'Distinct()',          desc: 'Remove duplicate elements', example: 'var unique = numbers.Distinct();' },
    { name: 'Take() / Skip()',     desc: 'Pagination helpers — take first N or skip first N', example: 'var page = list.Skip(20).Take(10);' },
    { name: 'ToList() / ToArray()', desc: 'Materialise a lazy LINQ query into a collection', example: 'List<string> result = query.ToList();' },
    { name: 'ToDictionary()',      desc: 'Convert sequence to a Dictionary by a key selector', example: 'var dict = people.ToDictionary(p => p.Id);' },
    { name: 'Aggregate()',         desc: 'Custom fold / reduce over a sequence', example: 'int product = nums.Aggregate(1, (acc, x) => acc * x);' },
    { name: 'Zip()',               desc: 'Merge two sequences element by element', example: 'var pairs = names.Zip(scores, (n, s) => (n, s));' },
  ];

  asyncEntries: CheatEntry[] = [
    { name: 'async / await',       desc: 'Mark a method async and await a Task or ValueTask', example: 'async Task<string> FetchAsync() { return await http.GetStringAsync(url); }' },
    { name: 'Task.Run()',           desc: 'Offload CPU-bound work to a thread-pool thread', example: 'var result = await Task.Run(() => HeavyComputation());' },
    { name: 'Task.WhenAll()',       desc: 'Await multiple tasks in parallel and collect all results', example: 'var results = await Task.WhenAll(t1, t2, t3);' },
    { name: 'Task.WhenAny()',       desc: 'Await the first task to complete', example: 'var winner = await Task.WhenAny(t1, t2);' },
    { name: 'CancellationToken',    desc: 'Signal cooperative cancellation to async operations', example: 'await DoWorkAsync(cancellationToken);' },
    { name: 'ConfigureAwait(false)', desc: 'Resume on a thread pool thread, not the original sync context', example: 'var data = await repo.GetAsync().ConfigureAwait(false);' },
    { name: 'ValueTask<T>',        desc: 'Lightweight alternative to Task when result may be synchronous', example: 'async ValueTask<int> ReadCachedAsync() { ... }' },
    { name: 'IAsyncEnumerable<T>', desc: 'Async stream — yield return inside an async method', example: 'await foreach (var item in GetItemsAsync()) { }', tag: 'C# 8' },
    { name: 'SemaphoreSlim',       desc: 'Async-safe throttle or mutex — use WaitAsync instead of lock()', example: 'await sem.WaitAsync(); try { ... } finally { sem.Release(); }' },
    { name: 'async void',          desc: 'Fire-and-forget — exceptions are unobservable. Only use for event handlers', example: 'async void Button_Click(object s, EventArgs e) { await DoWork(); }' },
    { name: 'TaskCompletionSource', desc: 'Wrap callback-based APIs in a Task manually', example: 'var tcs = new TaskCompletionSource<int>(); tcs.SetResult(42);' },
    { name: 'Parallel.ForEachAsync', desc: 'Process items concurrently with bounded parallelism (.NET 6+)', example: 'await Parallel.ForEachAsync(items, async (item, ct) => { await ProcessAsync(item); });', tag: '.NET 6' },
  ];

  patternsEntries: CheatEntry[] = [
    { name: 'type pattern',        desc: 'Check and bind a variable to a specific type', example: 'if (shape is Circle c) { Console.Write(c.Radius); }', tag: 'C# 7' },
    { name: 'property pattern',    desc: 'Match based on property values', example: 'if (order is { Status: "Paid", Total: > 100 }) { }', tag: 'C# 8' },
    { name: 'switch expression',   desc: 'Compact switch that returns a value', example: 'string label = status switch { "A" => "Active", "I" => "Inactive", _ => "Unknown" };', tag: 'C# 8' },
    { name: 'positional pattern',  desc: 'Deconstruct a type and match its components', example: 'if (point is (0, 0)) { Console.Write("Origin"); }', tag: 'C# 8' },
    { name: 'and / or / not',      desc: 'Combine patterns with logical operators', example: 'if (n is > 0 and < 100) { }', tag: 'C# 9' },
    { name: 'list pattern',        desc: 'Match the structure and elements of a collection', example: 'if (arr is [1, 2, ..]) { Console.Write("starts with 1,2"); }', tag: 'C# 11' },
    { name: 'var pattern',         desc: 'Always matches and binds the value — useful in guards', example: 'if (GetItem() is var x && x != null) { Use(x); }' },
    { name: 'when guard',          desc: 'Add a boolean condition to a switch case', example: 'case int n when n < 0: return "negative";' },
    { name: 'relational pattern',  desc: 'Compare with <, <=, >, >= in a pattern context', example: 'string band = score switch { >= 90 => "A", >= 80 => "B", _ => "F" };', tag: 'C# 9' },
    { name: 'tuple switch',        desc: 'Switch on multiple values simultaneously using tuples', example: '(lang, skill) switch { ("C#", "senior") => "hire", _ => "pass" };' },
    { name: 'recursive pattern',   desc: 'Nest property patterns to match object graphs', example: 'if (order is { Customer: { Country: "UK" }, Total: > 50 }) { }', tag: 'C# 8' },
    { name: 'discard _',           desc: 'Wildcard that matches everything without binding', example: 'object _ = GetValue();  // also: case _: in switch' },
  ];

  collectionsEntries: CheatEntry[] = [
    { name: 'List<T>',             desc: 'Dynamic array — O(1) access, O(n) insert/remove at arbitrary index', example: 'var list = new List<int> { 1, 2, 3 }; list.Add(4);' },
    { name: 'Dictionary<K,V>',     desc: 'Hash map — O(1) average lookup by key', example: 'var map = new Dictionary<string, int>(); map["a"] = 1;' },
    { name: 'HashSet<T>',          desc: 'Unordered unique elements — O(1) Contains()', example: 'var set = new HashSet<string> { "a", "b" }; set.Add("c");' },
    { name: 'Queue<T>',            desc: 'FIFO collection — Enqueue/Dequeue', example: 'var q = new Queue<int>(); q.Enqueue(1); int v = q.Dequeue();' },
    { name: 'Stack<T>',            desc: 'LIFO collection — Push/Pop', example: 'var s = new Stack<string>(); s.Push("x"); string top = s.Pop();' },
    { name: 'LinkedList<T>',       desc: 'Doubly linked list — O(1) insert/remove at known nodes', example: 'var ll = new LinkedList<int>(); ll.AddFirst(1);' },
    { name: 'SortedDictionary<K,V>', desc: 'Dictionary that keeps keys sorted (BST-backed, O(log n))', example: 'var sd = new SortedDictionary<string, int>();' },
    { name: 'ImmutableList<T>',    desc: 'Thread-safe immutable list — returns new list on mutation', example: 'var il = ImmutableList.Create(1, 2, 3); var il2 = il.Add(4);' },
    { name: 'ConcurrentDictionary<K,V>', desc: 'Thread-safe dictionary for multi-threaded scenarios', example: 'var cd = new ConcurrentDictionary<string, int>(); cd.TryAdd("x", 1);' },
    { name: 'Span<T>',             desc: 'Stack-allocated view of contiguous memory — zero allocation slicing', example: 'Span<int> span = stackalloc int[10]; span[0] = 42;', tag: '.NET Core' },
    { name: 'collection expression []', desc: 'Concise syntax to initialize any collection type', example: 'int[] arr = [1, 2, 3]; List<string> list = ["a", "b"];', tag: 'C# 12' },
    { name: 'spread ..',           desc: 'Inline elements from another collection in a collection expression', example: 'int[] combined = [..first, ..second, 99];', tag: 'C# 12' },
    { name: 'foreach / for',       desc: 'Iterate any IEnumerable<T> with foreach, or by index with for', example: 'foreach (var item in list) { Process(item); }' },
  ];

  genericsEntries: CheatEntry[] = [
    { name: 'where T : class',     desc: 'Constrain type parameter to reference types', example: 'T? Clone<T>(T obj) where T : class => ...' },
    { name: 'where T : struct',    desc: 'Constrain to non-nullable value types', example: 'T Default<T>() where T : struct => default;' },
    { name: 'where T : new()',     desc: 'Require T to have a parameterless constructor', example: 'T Create<T>() where T : new() => new T();' },
    { name: 'where T : IInterface', desc: 'Require T to implement a specific interface', example: 'void Process<T>(T item) where T : IDisposable { item.Dispose(); }' },
    { name: 'covariance out',      desc: 'Allow IEnumerable<Derived> to be used as IEnumerable<Base>', example: 'IEnumerable<object> items = new List<string>();' },
    { name: 'contravariance in',   desc: 'Allow Action<Base> to be used as Action<Derived>', example: 'Action<string> log = (Action<object>)(o => Console.Write(o));' },
    { name: 'generic method',      desc: 'A method with its own type parameter independent of the class', example: 'T[] Repeat<T>(T val, int n) => Enumerable.Repeat(val, n).ToArray();' },
    { name: 'default(T)',          desc: 'Return the default value for any type — null for ref, 0 for value', example: 'T val = default(T);  // or just default' },
    { name: 'typeof(T)',           desc: 'Get Type object for the generic parameter at runtime', example: 'if (typeof(T) == typeof(string)) { ... }' },
    { name: 'INumber<T>',          desc: 'Generic math constraint — arithmetic on generic numerics (.NET 7+)', example: 'T Add<T>(T a, T b) where T : INumber<T> => a + b;', tag: '.NET 7' },
    { name: 'generic constraints chaining', desc: 'Multiple constraints can be stacked with multiple where clauses', example: 'void Foo<T>() where T : class, IDisposable, new() { }' },
    { name: 'open vs closed generic', desc: 'Open: List<T> (unbound); closed: List<int> (fully bound at runtime)', example: 'Type open = typeof(List<>); Type closed = typeof(List<int>);' },
  ];

  exceptionsEntries: CheatEntry[] = [
    { name: 'try / catch / finally', desc: 'Guard code that may throw, handle errors, always clean up', example: 'try { Risky(); } catch (IOException ex) { Log(ex); } finally { Close(); }' },
    { name: 'throw',               desc: 'Throw an exception; bare throw; preserves original stack trace', example: 'catch (Exception) { throw; }  // preserves stack trace' },
    { name: 'throw expression',    desc: 'Throw inside an expression context', example: 'string name = input ?? throw new ArgumentNullException(nameof(input));', tag: 'C# 7' },
    { name: 'exception filter when', desc: 'Conditionally catch based on a runtime expression', example: 'catch (HttpException ex) when (ex.StatusCode == 404) { Handle404(); }', tag: 'C# 6' },
    { name: 'ArgumentNullException.ThrowIfNull', desc: 'Guard method parameters in one line (.NET 6+)', example: 'ArgumentNullException.ThrowIfNull(input);', tag: '.NET 6' },
    { name: 'AggregateException',  desc: 'Wraps multiple exceptions from parallel/async operations', example: 'try { await Task.WhenAll(t1, t2); } catch (AggregateException ae) { foreach (var e in ae.InnerExceptions) Log(e); }' },
    { name: 'custom exception',    desc: 'Derive from Exception — always include the three standard constructors', example: 'class DomainException(string msg) : Exception(msg) { }' },
    { name: 'using declaration',   desc: 'Automatically disposes a resource, eliminating try/finally boilerplate', example: 'using var conn = new SqlConnection(cs); // disposed at scope end', tag: 'C# 8' },
    { name: 'ObjectDisposedException', desc: 'Thrown when a method is called on an already-disposed object', example: 'if (_disposed) throw new ObjectDisposedException(nameof(MyClass));' },
    { name: 'ExceptionDispatchInfo', desc: 'Rethrow a captured exception preserving original stack trace across threads', example: 'ExceptionDispatchInfo.Capture(ex).Throw();' },
    { name: 'OperationCanceledException', desc: 'Thrown when a CancellationToken is cancelled during an awaited operation', example: 'try { await op(ct); } catch (OperationCanceledException) { /* graceful cancel */ }' },
    { name: 'global exception handler', desc: 'AppDomain.UnhandledException / TaskScheduler.UnobservedTaskException as last-resort handlers', example: 'AppDomain.CurrentDomain.UnhandledException += (s, e) => LogFatal(e.ExceptionObject);' },
  ];

  activeEntries = computed(() => {
    const all = {
      types:       this.typesEntries,
      oop:         this.oopEntries,
      linq:        this.linqEntries,
      async:       this.asyncEntries,
      patterns:    this.patternsEntries,
      collections: this.collectionsEntries,
      generics:    this.genericsEntries,
      exceptions:  this.exceptionsEntries,
    }[this.active()];
    const q = this.searchTerm().toLowerCase();
    return q ? all.filter(e => e.name.toLowerCase().includes(q) || e.desc.toLowerCase().includes(q)) : all;
  });
}
