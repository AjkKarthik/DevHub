import { Component, signal, computed } from '@angular/core';
import { RouterLink } from '@angular/router';

interface CsharpTopic {
  title: string;
  description: string;
  route: string;
  badge: string;
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
  { title: 'Variables & Types',       route: '/csharp/basics',               badge: 'Foundations',
    description: 'Built-in types, var/const, string interpolation, operators, control flow (if/switch/for/foreach/while).',
    keyPoints: ['string is an alias for System.String', 'var infers the type at compile time', 'switch expressions replace verbose switch statements'] },
  { title: 'Fields & Constants',      route: '/csharp/fields',               badge: 'Foundations',
    description: 'Instance vs static fields, const vs readonly, backing fields, and the C# 14 field keyword.',
    keyPoints: ['const is compile-time; readonly is runtime', 'readonly fields for DI-injected services', 'static fields are shared across all instances'] },
  { title: 'Methods',                 route: '/csharp/methods',              badge: 'Foundations',
    description: 'Method signatures, overloading, ref/out/in parameters, optional/named args, expression-bodied members, local functions.',
    keyPoints: ['Return type is NOT part of the signature', 'out requires assignment in every code path', 'Local functions are cleaner than private helpers for single-use logic'] },
  { title: 'Type Conversion',         route: '/csharp/type-conversion',      badge: 'Foundations',
    description: 'Implicit/explicit casts, as/is patterns, checked/unchecked, Convert, TryParse, and custom conversion operators.',
    keyPoints: ['as returns null; (T)cast throws', 'TryParse over Parse for user input', 'checked() makes overflow throw instead of silently wrapping'] },
  { title: 'Constructors',            route: '/csharp/constructors',         badge: 'Foundations',
    description: 'Instance constructors, this() chaining, base() calls, static constructors, and C# 12 primary constructors.',
    keyPoints: ['Chain with this() to avoid duplication', 'Static constructors run once per type', 'Primary constructors reduce boilerplate (C# 12)'] },
  { title: 'Properties & Indexers',   route: '/csharp/properties-indexers',  badge: 'Foundations',
    description: 'Auto-properties, init-only setters, expression-bodied properties, required, and custom indexers.',
    keyPoints: ['init restricts assignment to object initializers', 'required forces callers to set the property', 'Indexers use this[T] syntax'] },
  { title: 'Namespaces & Usings',     route: '/csharp/namespaces',           badge: 'Foundations',
    description: 'File-scoped namespaces (C# 10), global usings, using static, and using aliases.',
    keyPoints: ['File-scoped namespace saves one indent level', 'global using is project-wide', 'using static imports static members directly'] },

  // ── OOP ──
  { title: 'OOP & Classes',           route: '/csharp/oop',                  badge: 'OOP',
    description: 'Classes, constructors, properties, inheritance, interfaces, abstract classes, polymorphism, access modifiers.',
    keyPoints: ['Prefer composition over deep inheritance', 'interfaces define contracts without implementation', 'sealed prevents further inheritance'] },
  { title: 'Inheritance & Overriding', route: '/csharp/inheritance',         badge: 'OOP',
    description: 'Single inheritance, virtual/override, new (hiding), sealed, base keyword, and polymorphism.',
    keyPoints: ['virtual + override enables polymorphism', 'new hides — does NOT override', 'Calling virtual methods in constructors is dangerous'] },
  { title: 'Abstract & Interfaces',   route: '/csharp/abstract-interfaces',  badge: 'OOP',
    description: 'Abstract classes for shared implementation, interfaces for contracts, default interface methods, explicit implementation.',
    keyPoints: ['A class can implement multiple interfaces', 'Default interface methods (C# 8+)', 'Use abstract class when sharing implementation'] },
  { title: 'Static, Partial & Enums', route: '/csharp/static-enums',        badge: 'OOP',
    description: 'Static utility classes, partial class declarations, enum types with [Flags], Enum.Parse/TryParse.',
    keyPoints: ['[Flags] enums use powers of two', 'Enum.TryParse for user input', 'Partial classes merge at compile time'] },
  { title: 'Structures (struct)',      route: '/csharp/structures',          badge: 'OOP',
    description: 'Value types with struct, readonly struct, ref struct (Span<T>), record struct, and when to choose struct over class.',
    keyPoints: ['Structs are copied on assignment', 'ref struct cannot be boxed or used as generic arg', 'Keep structs small (< 16 bytes)'] },
  { title: 'System.Object',           route: '/csharp/system-object',       badge: 'OOP',
    description: 'ToString(), Equals(), GetHashCode(), GetType(), ReferenceEquals — the root of all C# types.',
    keyPoints: ['Override Equals() AND GetHashCode() together', 'Equal objects must have the same hash', 'Boxing wraps value types in a heap object'] },

  // ── Modern ──
  { title: 'Records & Structs',       route: '/csharp/records',             badge: 'Modern',
    description: 'Immutable record types, record struct, init-only properties, with expressions, value equality.',
    keyPoints: ['record gives value equality for free', 'with creates a shallow copy with overrides', 'record struct is a value type — stack allocated'] },
  { title: 'Generics',                route: '/csharp/generics',            badge: 'Modern',
    description: 'Generic classes and methods, type constraints (where T :), covariance/contravariance with in/out.',
    keyPoints: ['Constraints give compile-time type safety', 'INumber<T> enables arithmetic on generics (.NET 7+)', 'default(T) returns null/zero depending on type kind'] },
  { title: 'Pattern Matching',        route: '/csharp/pattern-matching',    badge: 'Modern',
    description: 'is patterns, switch expressions, property/positional/list patterns, when guards, and/or/not patterns.',
    keyPoints: ['switch expressions are exhaustive by default', 'Property patterns match named members', '_ discard catches everything — put it last'] },
  { title: 'Extension Methods',       route: '/csharp/extension-methods',   badge: 'Modern',
    description: 'Add methods to existing types without modifying them — the pattern behind LINQ, fluent APIs, and validators.',
    keyPoints: ['Static class + this T first param', 'Cannot access private members', 'Instance method takes priority over extension'] },
  { title: 'Tuples & Anonymous Types', route: '/csharp/tuples',             badge: 'Modern',
    description: 'ValueTuple with named fields, tuple deconstruction, discards, and anonymous types in LINQ.',
    keyPoints: ['Named fields improve readability', 'Field names are compile-time only (Item1/Item2 at runtime)', 'Use records for cross-method data transfer'] },

  // ── Data ──
  { title: 'Arrays',                  route: '/csharp/arrays',              badge: 'Data',
    description: 'Single-dimensional, multi-dimensional, jagged arrays; Array.Sort/Reverse; Span<T> for zero-alloc slices.',
    keyPoints: ['Arrays have fixed size — use List<T> if size changes', 'Span<T> avoids heap allocation for slices', 'Array covariance is a runtime trap'] },
  { title: 'Collections',             route: '/csharp/collections',         badge: 'Data',
    description: 'List<T>, Dictionary<K,V>, HashSet<T>, Queue/Stack, IEnumerable<T>, Span<T>, and ImmutableList.',
    keyPoints: ['Return IEnumerable<T> from methods for flexibility', 'Span<T> avoids heap allocation for slices', 'Dictionary does not guarantee insertion order'] },
  { title: 'LINQ',                    route: '/csharp/linq',                badge: 'Data',
    description: 'Where, Select, GroupBy, OrderBy, Join, deferred execution, method vs query syntax, aggregation.',
    keyPoints: ['LINQ is lazy — nothing runs until you enumerate', 'FirstOrDefault() is safer than First()', 'Chain operators; ToList() only once at the end'] },
  { title: 'Strings, DateTime & Math', route: '/csharp/strings-datetime',  badge: 'Data',
    description: 'String methods, StringBuilder, raw string literals (C# 11), DateOnly/TimeOnly, TimeSpan, Math/MathF.',
    keyPoints: ['Use StringBuilder for concatenation in loops', 'DateOnly/TimeOnly avoid timezone confusion', 'Store and compare dates in UTC'] },
  { title: 'I/O & Serialization',     route: '/csharp/io-serialization',    badge: 'Data',
    description: 'File I/O with File/streams, async I/O, System.Text.Json serialization/deserialization, and JsonSerializerOptions.',
    keyPoints: ['Use async file I/O in ASP.NET apps', 'JsonSerializer is case-insensitive for deserialization', 'Streams must be disposed — use using'] },

  // ── Async ──
  { title: 'async / await',           route: '/csharp/async',               badge: 'Async',
    description: 'async/await, Task<T>, CancellationToken, ConfigureAwait, ValueTask, async streams (IAsyncEnumerable).',
    keyPoints: ['async void is only for event handlers', 'ConfigureAwait(false) prevents deadlocks in libraries', 'Prefer ValueTask for hot paths that rarely yield'] },
  { title: 'Delegates & Events',      route: '/csharp/delegates',           badge: 'Async',
    description: 'delegate keyword, Func/Action/Predicate, multicast delegates, events, EventHandler<T>, lambda closures.',
    keyPoints: ['Prefer Func<>/Action<> over custom delegates', 'Events are multicast delegates with add/remove', 'Lambdas close over the variable, not its value'] },
  { title: 'Tasks & Parallel',        route: '/csharp/tasks',               badge: 'Async',
    description: 'Task.Run(), Task.WhenAll/WhenAny, Parallel.ForEach, PLINQ, TaskCompletionSource, and CancellationToken.',
    keyPoints: ['Task.Run only for CPU-bound work', 'Task.WhenAll for fan-out parallelism', 'Prefer await over ContinueWith'] },

  // ── Safety ──
  { title: 'Null Safety',             route: '/csharp/null-safety',         badge: 'Safety',
    description: 'Nullable value types, nullable reference types, ?., ??, ??=, null patterns, ThrowIfNull.',
    keyPoints: ['Enable <Nullable>enable</Nullable> in .csproj', '! operator suppresses warnings but not runtime errors', 'ThrowIfNull replaces manual null guard boilerplate'] },
  { title: 'Exceptions',             route: '/csharp/exceptions',           badge: 'Safety',
    description: 'try/catch/finally, exception filters (when), custom exceptions, AggregateException, Result pattern.',
    keyPoints: ['Catch specific exceptions before generic ones', 'throw; (bare) preserves the stack trace', 'finally always runs — even after a return'] },

  // ── Advanced ──
  { title: 'GC & IDisposable',        route: '/csharp/gc-disposable',       badge: 'Advanced',
    description: 'GC generations, IDisposable pattern, using declarations, IAsyncDisposable, finalizers, and WeakReference.',
    keyPoints: ['Call GC.SuppressFinalize inside Dispose()', 'using() calls Dispose even if an exception is thrown', 'Finalizers run on the GC thread — never acquire locks'] },
  { title: 'Threading',               route: '/csharp/threading',           badge: 'Advanced',
    description: 'Thread, ThreadPool, lock, Monitor, Interlocked, volatile, and thread-safe concurrent collections.',
    keyPoints: ['Prefer Task/async over raw Thread', 'lock can cause deadlocks if acquired in different orders', 'volatile ensures visibility but not atomicity'] },

  // ── What's New ──
  { title: "What's New in C# 9 & 10",     route: '/csharp/whats-new-9-10',      badge: "What's New",
    description: 'Records, init-only setters, top-level programs, pattern enhancements, global usings, file-scoped namespaces.',
    keyPoints: ['Top-level programs only work in one file', 'and/or/not patterns (C# 9)', 'global using is project-wide (C# 10)'] },
  { title: "What's New in C# 11 & 12",    route: '/csharp/whats-new-11-12',     badge: "What's New",
    description: 'Required members, raw string literals, generic math (INumber<T>), primary constructors, and collection expressions.',
    keyPoints: ['required forces object initializer assignment', 'Primary constructors capture params as fields', 'Collection expressions [] (C# 12)'] },
  { title: "What's New in C# 13+ & .NET 10/11", route: '/csharp/whats-new-latest', badge: "What's New",
    description: 'C# 13 features, .NET 10 LINQ additions (CountBy, AggregateBy), TimeProvider, and C# 14 extension blocks preview.',
    keyPoints: ['params ReadOnlySpan<T> (C# 13)', 'CountBy/AggregateBy LINQ operators (.NET 9)', 'C# 14 extension blocks coming'] },

  // ── Reference ──
  { title: 'C# Cheat Sheet',       route: '/csharp/cheatsheet', badge: 'Reference',
    description: 'Quick-reference cards for types, OOP, LINQ, async/await, pattern matching, collections, and generics — searchable by keyword.',
    keyPoints: ['8 sections covering the full language', 'Search across all entries instantly', 'Code snippets with version tags'] },
  { title: 'Common C# Errors',     route: '/csharp/errors',     badge: 'Reference',
    description: 'Root causes and fixes for the most frequent C# compiler errors, runtime exceptions, NullReference, async deadlocks, and LINQ pitfalls.',
    keyPoints: ['CS8600/CS8602 nullable warnings explained', 'async deadlock patterns and how to avoid them', 'LINQ InvalidOperationException and KeyNotFoundException'] },
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

  setFilter(f: string) { this.activeFilter.set(f); }
  badgeCss(badge: string) { return 'badge badge-' + (BADGE_CSS[badge] ?? 'foundations'); }
  toggleCard(route: string, event: Event) {
    event.preventDefault();
    this.expandedCard.update(c => c === route ? null : route);
  }
}
