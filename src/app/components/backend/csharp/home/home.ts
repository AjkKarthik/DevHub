import { Component, signal, computed } from '@angular/core';
import { RouterLink } from '@angular/router';

interface CsharpTopic {
  title: string;
  description: string;
  route: string;
  badge: string;
  available: boolean;
  keyPoints: string[];
}

const BADGE_CSS: Record<string, string> = {
  Foundations:  'foundations',
  OOP:          'oop',
  Modern:       'modern',
  Data:         'data',
  Async:        'async',
  Advanced:     'advanced',
  Safety:       'safety',
  'What\'s New': 'whats-new',
  'Reference':   'reference',
};

const GROUP_ORDER = ['All', 'Foundations', 'OOP', 'Modern', 'Data', 'Async', 'Safety', 'Advanced', 'What\'s New', 'Reference'];

const ALL_TOPICS: CsharpTopic[] = [
  // ── Foundations ──
  { title: 'Variables & Types',       route: '/csharp/basics',               badge: 'Foundations', available: true,
    description: 'Built-in types, var/const, string interpolation, operators, control flow (if/switch/for/foreach/while).',
    keyPoints: ['string is an alias for System.String', 'var infers the type at compile time', 'switch expressions replace verbose switch statements'] },
  { title: 'Fields & Constants',      route: '/csharp/fields',               badge: 'Foundations', available: true,
    description: 'Instance vs static fields, const vs readonly, backing fields, and the C# 14 field keyword.',
    keyPoints: ['const is compile-time; readonly is runtime', 'readonly fields for DI-injected services', 'static fields are shared across all instances'] },
  { title: 'Methods',                 route: '/csharp/methods',              badge: 'Foundations', available: true,
    description: 'Method signatures, overloading, ref/out/in parameters, optional/named args, expression-bodied members, local functions.',
    keyPoints: ['Return type is NOT part of the signature', 'out requires assignment in every code path', 'Local functions are cleaner than private helpers for single-use logic'] },
  { title: 'Type Conversion',         route: '/csharp/type-conversion',      badge: 'Foundations', available: true,
    description: 'Implicit/explicit casts, as/is patterns, checked/unchecked, Convert, TryParse, and custom conversion operators.',
    keyPoints: ['as returns null; (T)cast throws', 'TryParse over Parse for user input', 'checked() makes overflow throw instead of silently wrapping'] },
  { title: 'Constructors',            route: '/csharp/constructors',         badge: 'Foundations', available: true,
    description: 'Instance constructors, this() chaining, base() calls, static constructors, and C# 12 primary constructors.',
    keyPoints: ['Chain with this() to avoid duplication', 'Static constructors run once per type', 'Primary constructors reduce boilerplate (C# 12)'] },
  { title: 'Properties & Indexers',   route: '/csharp/properties-indexers',  badge: 'Foundations', available: true,
    description: 'Auto-properties, init-only setters, expression-bodied properties, required, and custom indexers.',
    keyPoints: ['init restricts assignment to object initializers', 'required forces callers to set the property', 'Indexers use this[T] syntax'] },
  { title: 'Namespaces & Usings',     route: '/csharp/namespaces',           badge: 'Foundations', available: true,
    description: 'File-scoped namespaces (C# 10), global usings, using static, and using aliases.',
    keyPoints: ['File-scoped namespace saves one indent level', 'global using is project-wide', 'using static imports static members directly'] },

  // ── OOP ──
  { title: 'OOP & Classes',           route: '/csharp/oop',                  badge: 'OOP', available: true,
    description: 'Classes, constructors, properties, inheritance, interfaces, abstract classes, polymorphism, access modifiers.',
    keyPoints: ['Prefer composition over deep inheritance', 'interfaces define contracts without implementation', 'sealed prevents further inheritance'] },
  { title: 'Inheritance & Overriding', route: '/csharp/inheritance',         badge: 'OOP', available: true,
    description: 'Single inheritance, virtual/override, new (hiding), sealed, base keyword, and polymorphism.',
    keyPoints: ['virtual + override enables polymorphism', 'new hides — does NOT override', 'Calling virtual methods in constructors is dangerous'] },
  { title: 'Abstract & Interfaces',   route: '/csharp/abstract-interfaces',  badge: 'OOP', available: true,
    description: 'Abstract classes for shared implementation, interfaces for contracts, default interface methods, explicit implementation.',
    keyPoints: ['A class can implement multiple interfaces', 'Default interface methods (C# 8+)', 'Use abstract class when sharing implementation'] },
  { title: 'Static, Partial & Enums', route: '/csharp/static-enums',        badge: 'OOP', available: true,
    description: 'Static utility classes, partial class declarations, enum types with [Flags], Enum.Parse/TryParse.',
    keyPoints: ['[Flags] enums use powers of two', 'Enum.TryParse for user input', 'Partial classes merge at compile time'] },
  { title: 'Structures (struct)',      route: '/csharp/structures',          badge: 'OOP', available: true,
    description: 'Value types with struct, readonly struct, ref struct (Span<T>), record struct, and when to choose struct over class.',
    keyPoints: ['Structs are copied on assignment', 'ref struct cannot be boxed or used as generic arg', 'Keep structs small (< 16 bytes)'] },
  { title: 'System.Object',           route: '/csharp/system-object',       badge: 'OOP', available: true,
    description: 'ToString(), Equals(), GetHashCode(), GetType(), ReferenceEquals — the root of all C# types.',
    keyPoints: ['Override Equals() AND GetHashCode() together', 'Equal objects must have the same hash', 'Boxing wraps value types in a heap object'] },

  // ── Modern ──
  { title: 'Records & Structs',       route: '/csharp/records',             badge: 'Modern', available: true,
    description: 'Immutable record types, record struct, init-only properties, with expressions, value equality.',
    keyPoints: ['record gives value equality for free', 'with creates a shallow copy with overrides', 'record struct is a value type — stack allocated'] },
  { title: 'Generics',                route: '/csharp/generics',            badge: 'Modern', available: true,
    description: 'Generic classes and methods, type constraints (where T :), covariance/contravariance with in/out.',
    keyPoints: ['Constraints give compile-time type safety', 'INumber<T> enables arithmetic on generics (.NET 7+)', 'default(T) returns null/zero depending on type kind'] },
  { title: 'Pattern Matching',        route: '/csharp/pattern-matching',    badge: 'Modern', available: true,
    description: 'is patterns, switch expressions, property/positional/list patterns, when guards, and/or/not patterns.',
    keyPoints: ['switch expressions are exhaustive by default', 'Property patterns match named members', '_ discard catches everything — put it last'] },
  { title: 'Extension Methods',       route: '/csharp/extension-methods',   badge: 'Modern', available: true,
    description: 'Add methods to existing types without modifying them — the pattern behind LINQ, fluent APIs, and validators.',
    keyPoints: ['Static class + this T first param', 'Cannot access private members', 'Instance method takes priority over extension'] },
  { title: 'Tuples & Anonymous Types', route: '/csharp/tuples',             badge: 'Modern', available: true,
    description: 'ValueTuple with named fields, tuple deconstruction, discards, and anonymous types in LINQ.',
    keyPoints: ['Named fields improve readability', 'Field names are compile-time only (Item1/Item2 at runtime)', 'Use records for cross-method data transfer'] },
  { title: 'Iterators & yield',       route: '/csharp/iterators',          badge: 'Modern', available: true,
    description: 'yield return, IEnumerable/IEnumerator, compiler state machines, lazy evaluation — how LINQ works underneath.',
    keyPoints: ['yield return suspends and resumes the method', 'Deferred execution: nothing runs until enumeration', 'Multiple enumeration re-runs the iterator'] },
  { title: 'Functional C# & Result Pattern', route: '/csharp/functional-csharp', badge: 'Modern', available: true,
    description: 'Railway-Oriented Programming in C# — Result<T,E>, OneOf, functional pipelines, and eliminating exceptions for expected failures.',
    keyPoints: ['Result<T,E> = Success(T) | Failure(E) — explicit error without exceptions', 'Map/Bind: chain operations that can fail — compose Results fluently', 'OneOf<T1,T2,...>: discriminated union type for multiple return possibilities', 'FluentResults and LanguageExt are popular libraries', 'Avoid exception-driven control flow for domain validation errors'] },
  { title: 'Span<T> & Memory<T>',     route: '/csharp',                    badge: 'Modern', available: false,
    description: 'Stack-allocated slices for high-performance code — Span<T>, ReadOnlySpan<T>, Memory<T>, and ArrayPool<T>.',
    keyPoints: ['Span<T> avoids heap allocation for slices of arrays/strings', 'Memory<T> is the heap-safe counterpart — can be stored as a field', 'ArrayPool<T>.Shared rents and returns buffers to avoid GC pressure'] },
  { title: 'Dependency Injection in .NET', route: '/csharp',               badge: 'Modern', available: false,
    description: 'Microsoft.Extensions.DependencyInjection — lifetimes, factories, keyed services (.NET 8+), and testing with DI.',
    keyPoints: ['AddSingleton/AddScoped/AddTransient — lifetime rules', 'Keyed services: AddKeyedSingleton + GetRequiredKeyedService (.NET 8+)', 'IServiceCollection extensions for library authors'] },

  // ── Data ──
  { title: 'Arrays',                  route: '/csharp/arrays',              badge: 'Data', available: true,
    description: 'Single-dimensional, multi-dimensional, jagged arrays; Array.Sort/Reverse; Span<T> for zero-alloc slices.',
    keyPoints: ['Arrays have fixed size — use List<T> if size changes', 'Span<T> avoids heap allocation for slices', 'Array covariance is a runtime trap'] },
  { title: 'Collections',             route: '/csharp/collections',         badge: 'Data', available: true,
    description: 'List<T>, Dictionary<K,V>, HashSet<T>, Queue/Stack, IEnumerable<T>, Span<T>, and ImmutableList.',
    keyPoints: ['Return IEnumerable<T> from methods for flexibility', 'Span<T> avoids heap allocation for slices', 'Dictionary does not guarantee insertion order'] },
  { title: 'LINQ',                    route: '/csharp/linq',                badge: 'Data', available: true,
    description: 'Where, Select, GroupBy, OrderBy, Join, deferred execution, method vs query syntax, aggregation.',
    keyPoints: ['LINQ is lazy — nothing runs until you enumerate', 'FirstOrDefault() is safer than First()', 'Chain operators; ToList() only once at the end'] },
  { title: 'Strings, DateTime & Math', route: '/csharp/strings-datetime',  badge: 'Data', available: true,
    description: 'String methods, StringBuilder, raw string literals (C# 11), DateOnly/TimeOnly, TimeSpan, Math/MathF.',
    keyPoints: ['Use StringBuilder for concatenation in loops', 'DateOnly/TimeOnly avoid timezone confusion', 'Store and compare dates in UTC'] },
  { title: 'I/O & Serialization',     route: '/csharp/io-serialization',    badge: 'Data', available: true,
    description: 'File I/O with File/streams, async I/O, System.Text.Json serialization/deserialization, and JsonSerializerOptions.',
    keyPoints: ['Use async file I/O in ASP.NET apps', 'JsonSerializer is case-insensitive for deserialization', 'Streams must be disposed — use using'] },
  { title: 'Regular Expressions',     route: '/csharp/regex',               badge: 'Data', available: true,
    description: 'Regex matching, groups & named captures, options, ReDoS timeouts, and source-generated [GeneratedRegex] (.NET 7+).',
    keyPoints: ['[GeneratedRegex] compiles the pattern at build time', 'Always set MatchTimeout on untrusted input', 'Named groups: (?<year>\\d{4})'] },
  { title: 'System.Text.Json Advanced', route: '/csharp',                   badge: 'Data', available: false,
    description: 'Custom converters, JsonTypeInfo source generation, Utf8JsonReader/Writer, and contract customisation.',
    keyPoints: ['JsonSerializerContext source-gen avoids reflection — AOT-friendly', 'Custom JsonConverter<T> handles exotic types', 'Utf8JsonWriter writes JSON with zero heap allocation'] },

  // ── Async ──
  { title: 'async / await',           route: '/csharp/async',               badge: 'Async', available: true,
    description: 'async/await, Task<T>, CancellationToken, ConfigureAwait, ValueTask, async streams (IAsyncEnumerable).',
    keyPoints: ['async void is only for event handlers', 'ConfigureAwait(false) prevents deadlocks in libraries', 'Prefer ValueTask for hot paths that rarely yield'] },
  { title: 'Delegates & Events',      route: '/csharp/delegates',           badge: 'Async', available: true,
    description: 'delegate keyword, Func/Action/Predicate, multicast delegates, events, EventHandler<T>, lambda closures.',
    keyPoints: ['Prefer Func<>/Action<> over custom delegates', 'Events are multicast delegates with add/remove', 'Lambdas close over the variable, not its value'] },
  { title: 'Tasks & Parallel',        route: '/csharp/tasks',               badge: 'Async', available: true,
    description: 'Task.Run(), Task.WhenAll/WhenAny, Parallel.ForEach, PLINQ, TaskCompletionSource, and CancellationToken.',
    keyPoints: ['Task.Run only for CPU-bound work', 'Task.WhenAll for fan-out parallelism', 'Prefer await over ContinueWith'] },
  { title: 'Channels',                route: '/csharp/channels',            badge: 'Async', available: true,
    description: 'System.Threading.Channels — bounded/unbounded queues, producer-consumer pipelines, backpressure, and graceful completion.',
    keyPoints: ['Bounded channels apply backpressure automatically', 'Complete() signals no more writes', 'ReadAllAsync() consumes via await foreach'] },

  // ── Safety ──
  { title: 'Null Safety',             route: '/csharp/null-safety',         badge: 'Safety', available: true,
    description: 'Nullable value types, nullable reference types, ?., ??, ??=, null patterns, ThrowIfNull.',
    keyPoints: ['Enable <Nullable>enable</Nullable> in .csproj', '! operator suppresses warnings but not runtime errors', 'ThrowIfNull replaces manual null guard boilerplate'] },
  { title: 'Exceptions',              route: '/csharp/exceptions',          badge: 'Safety', available: true,
    description: 'try/catch/finally, exception filters (when), custom exceptions, AggregateException, Result pattern.',
    keyPoints: ['Catch specific exceptions before generic ones', 'throw; (bare) preserves the stack trace', 'finally always runs — even after a return'] },
  { title: 'Unit Testing (xUnit & Moq)', route: '/csharp/unit-testing',     badge: 'Safety', available: true,
    description: 'xUnit [Fact]/[Theory], Arrange-Act-Assert, mocking with Moq, testing async code and exceptions.',
    keyPoints: ['[Theory] + [InlineData] for parameterised tests', 'Moq: Setup/Returns to stub, Verify to assert calls', 'Testable code = DI + small pure methods'] },

  // ── Advanced ──
  { title: 'GC & IDisposable',        route: '/csharp/gc-disposable',       badge: 'Advanced', available: true,
    description: 'GC generations, IDisposable pattern, using declarations, IAsyncDisposable, finalizers, and WeakReference.',
    keyPoints: ['Call GC.SuppressFinalize inside Dispose()', 'using() calls Dispose even if an exception is thrown', 'Finalizers run on the GC thread — never acquire locks'] },
  { title: 'Threading',               route: '/csharp/threading',           badge: 'Advanced', available: true,
    description: 'Thread, ThreadPool, lock, Monitor, Interlocked, volatile, and thread-safe concurrent collections.',
    keyPoints: ['Prefer Task/async over raw Thread', 'lock can cause deadlocks if acquired in different orders', 'volatile ensures visibility but not atomicity'] },
  { title: 'Reflection & Attributes', route: '/csharp/reflection',          badge: 'Advanced', available: true,
    description: 'Type introspection, PropertyInfo, Activator, defining and reading custom attributes — the machinery behind serializers and DI.',
    keyPoints: ['typeof(T) is compile-time; GetType() is runtime', 'Cache MemberInfo — reflection lookups are slow', '[AttributeUsage] controls where attributes apply'] },
  { title: 'Expression Trees',        route: '/csharp/expression-trees',    badge: 'Advanced', available: true,
    description: 'Expression<Func<T>> as data, how EF Core translates lambdas to SQL, building and compiling trees, ExpressionVisitor.',
    keyPoints: ['Expression<Func<T>> stores code as a tree; Func<T> is compiled', 'IQueryable providers translate trees (e.g. to SQL)', '.Compile() turns a tree back into a delegate'] },
  { title: 'dynamic & the DLR',       route: '/csharp/dynamic',             badge: 'Advanced', available: true,
    description: 'Runtime binding with dynamic, ExpandoObject, DynamicObject, interop scenarios — and why strong types usually win.',
    keyPoints: ['dynamic defers binding to runtime (RuntimeBinderException)', 'ExpandoObject = dynamic property bag', 'Prefer records/strong types unless interop forces dynamic'] },
  { title: 'Source Generators',       route: '/csharp/source-generators',   badge: 'Advanced', available: true,
    description: 'Compile-time codegen with Roslyn — how [GeneratedRegex], JSON source-gen and LoggerMessage work, and authoring basics.',
    keyPoints: ['Zero runtime cost, AOT-friendly — the modern reflection alternative', 'IIncrementalGenerator is the current API', 'Generated code extends your partial classes/methods'] },
  { title: 'Unsafe Code & Pointers',  route: '/csharp',                     badge: 'Advanced', available: false,
    description: 'The unsafe keyword, fixed statements, pointer arithmetic, stackalloc, and Unsafe class utilities.',
    keyPoints: ['unsafe enables pointer arithmetic — requires AllowUnsafeBlocks in .csproj', 'fixed pins managed memory so GC cannot move it', 'Prefer Span<T> over unsafe unless interoping with native code'] },
  { title: 'Native AOT',              route: '/csharp',                     badge: 'Advanced', available: false,
    description: 'Compile a .NET app to a native binary — startup time, binary size, reflection constraints, and what AOT can and cannot do.',
    keyPoints: ['PublishAot=true produces a self-contained native binary', 'Reflection and dynamic code are restricted — use source generators instead', 'AOT apps start in milliseconds — ideal for CLI tools and serverless'] },
  { title: 'BenchmarkDotNet',         route: '/csharp',                     badge: 'Advanced', available: false,
    description: 'Micro-benchmarking with BenchmarkDotNet — setup/cleanup, memory diagnostics, comparison attributes, and reading results.',
    keyPoints: ['[Benchmark] marks methods; [MemoryDiagnoser] tracks allocations', 'BenchmarkRunner.Run<T>() runs in Release mode automatically', 'Compare allocations, not just time — allocations drive GC pressure'] },
  { title: 'P/Invoke & Native Interop', route: '/csharp',                   badge: 'Advanced', available: false,
    description: 'Calling native DLLs from C# — DllImport, LibraryImport (source-gen), marshalling structs, SafeHandle, and COM interop.',
    keyPoints: ['[LibraryImport] is the modern AOT-friendly replacement for [DllImport]', 'Marshal.AllocHGlobal/FreeHGlobal for unmanaged memory', 'SafeHandle guarantees unmanaged resource cleanup on GC'] },
  { title: '.NET CLI & Tooling',      route: '/csharp',                     badge: 'Advanced', available: false,
    description: 'dotnet new, build, publish, test, run, global tools, workloads, and package management with NuGet.',
    keyPoints: ['dotnet new --list shows all installed project templates', 'dotnet publish -c Release -r win-x64 --self-contained', 'dotnet tool install -g creates globally available commands'] },

  // ── What's New ──
  { title: "What's New in C# 9 & 10",     route: '/csharp/whats-new-9-10',      badge: "What's New", available: true,
    description: 'Records, init-only setters, top-level programs, pattern enhancements, global usings, file-scoped namespaces.',
    keyPoints: ['Top-level programs only work in one file', 'and/or/not patterns (C# 9)', 'global using is project-wide (C# 10)'] },
  { title: "What's New in C# 11 & 12",    route: '/csharp/whats-new-11-12',     badge: "What's New", available: true,
    description: 'Required members, raw string literals, generic math (INumber<T>), primary constructors, and collection expressions.',
    keyPoints: ['required forces object initializer assignment', 'Primary constructors capture params as fields', 'Collection expressions [] (C# 12)'] },
  { title: "What's New in C# 13+ & .NET 10/11", route: '/csharp/whats-new-latest', badge: "What's New", available: true,
    description: 'C# 13 features, .NET 10 LINQ additions (CountBy, AggregateBy), TimeProvider, and C# 14 extension blocks preview.',
    keyPoints: ['params ReadOnlySpan<T> (C# 13)', 'CountBy/AggregateBy LINQ operators (.NET 9)', 'C# 14 extension blocks coming'] },

  // ── Reference ──
  { title: 'C# Cheat Sheet',       route: '/csharp/cheatsheet',     badge: 'Reference', available: true,
    description: 'Quick-reference cards for types, OOP, LINQ, async/await, pattern matching, collections, and generics — searchable by keyword.',
    keyPoints: ['8 sections covering the full language', 'Search across all entries instantly', 'Code snippets with version tags'] },
  { title: 'Common C# Errors',     route: '/csharp/errors',         badge: 'Reference', available: true,
    description: 'Root causes and fixes for the most frequent C# compiler errors, runtime exceptions, NullReference, async deadlocks, and LINQ pitfalls.',
    keyPoints: ['CS8600/CS8602 nullable warnings explained', 'async deadlock patterns and how to avoid them', 'LINQ InvalidOperationException and KeyNotFoundException'] },
  { title: 'Mini Projects',        route: '/csharp/mini-projects',  badge: 'Reference', available: true,
    description: 'Four end-to-end walkthroughs: Task Manager CLI, Expense Tracker, Weather API Client, and Parallel File Processor.',
    keyPoints: ['Task Manager: OOP + collections + LINQ + JSON persistence', 'Weather: HttpClient + async/await + CancellationToken', 'Parallel: Task.WhenAll + SemaphoreSlim throttling'] },
  { title: 'Learning Paths',       route: '/csharp/learning-paths', badge: 'Reference', available: true,
    description: 'Structured curriculums for Beginner, Intermediate, Advanced, Interview Prep, and .NET Web Developer tracks.',
    keyPoints: ['Beginner: types → methods → constructors → OOP', 'Advanced: async → threading → GC → tasks', 'Interview track covering the most-asked topics'] },
  { title: 'Interview Prep',       route: '/csharp/interview-prep', badge: 'Reference', available: true,
    description: '55+ real C# interview questions with answers — filterable by difficulty (Junior/Mid/Senior) and topic.',
    keyPoints: ['Boxing, variance, ConfigureAwait, GC generations', 'Records equality, Span<T>, primary constructors', 'Expandable answer cards with show-all toggle'] },
  { title: 'Quiz Practice',        route: '/csharp/quiz-practice',  badge: 'Reference', available: true,
    description: 'Random quiz sessions from a 50+ question bank — pick a topic and length, get instant feedback and a score breakdown.',
    keyPoints: ['Topics: Types, OOP, Generics, LINQ, Async, Memory', 'Instant right/wrong feedback with explanations', 'Per-topic score breakdown at the end'] },
  { title: 'Design Patterns',      route: '/csharp/design-patterns', badge: 'Reference', available: true,
    description: '12 patterns you actually meet in modern .NET — Singleton vs DI, Factory, Builder, Repository, Strategy, Mediator, and more.',
    keyPoints: ['When to use AND when not to use each pattern', 'DI-friendly C# 12 examples', 'Common pitfalls per pattern'] },
  { title: 'Decision Guides',      route: '/csharp/decision-guides', badge: 'Reference', available: true,
    description: 'Side-by-side comparisons: List vs Array vs Span, class vs struct vs record, Task vs ValueTask, lock vs SemaphoreSlim.',
    keyPoints: ['Criteria tables with clear ✓/✗ verdicts', 'Rule-of-thumb callout per guide', '8 of the most common C# decisions'] },
  { title: 'Glossary',             route: '/csharp/glossary',        badge: 'Reference', available: true,
    description: 'A–Z glossary of 50+ C# / .NET terms — boxing, CLR, covariance, GC generations, Span — with links to topic pages.',
    keyPoints: ['Searchable with letter quick-nav', 'Plain-English 1-3 sentence definitions', 'See-also links into the relevant topic page'] },
];

@Component({
  selector: 'app-csharp-home',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './home.html',
  styleUrl: './home.scss',
})
export class CsharpHome {
  activeFilter = signal<string>('All');
  expandedCard = signal<string | null>(null);

  topics = computed(() => {
    const f = this.activeFilter();
    return f === 'All' ? ALL_TOPICS : ALL_TOPICS.filter(t => t.badge === f);
  });

  filters = GROUP_ORDER;

  counts = computed(() => {
    const map: Record<string, number> = { All: ALL_TOPICS.length };
    for (const t of ALL_TOPICS) map[t.badge] = (map[t.badge] ?? 0) + 1;
    return map;
  });

  availableCount = ALL_TOPICS.filter(t => t.available).length;
  totalCount     = ALL_TOPICS.length;

  setFilter(f: string) { this.activeFilter.set(f); }
  badgeCss(badge: string) { return 'badge badge-' + (BADGE_CSS[badge] ?? 'foundations'); }
  toggleCard(key: string, event: Event) {
    event.preventDefault();
    this.expandedCard.update(c => c === key ? null : key);
  }
}
