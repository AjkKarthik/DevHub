import { Component, signal, computed } from '@angular/core';
import { RouterLink } from '@angular/router';

interface Term {
  term: string;
  def: string;
  route?: string;
}

interface LetterGroup {
  letter: string;
  terms: Term[];
}

@Component({
  selector: 'app-csharp-glossary',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './glossary.html',
  styleUrl: './glossary.scss',
})
export class CsharpGlossary {
  search = signal('');
  alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

  terms: Term[] = [
    { term: 'AOT (ahead-of-time compilation)', def: 'Compiling IL to native machine code at publish time (Native AOT) instead of at runtime, giving faster startup and smaller self-contained binaries.' },
    { term: 'async state machine', def: 'The compiler-generated struct/class an async method becomes: it tracks where execution paused at each await and resumes when the awaited task completes.', route: '/csharp/async' },
    { term: 'boxing', def: 'Wrapping a value type in a heap-allocated object so it can be treated as object or an interface. Costs an allocation and a copy.', route: '/csharp/type-conversion' },
    { term: 'boxing allocation', def: 'The hidden heap allocation caused by boxing, often in hot paths via non-generic collections, string.Format with value types, or interface calls on structs.' },
    { term: 'closure', def: 'A lambda or local function that captures variables from its enclosing scope; the compiler hoists those variables into a generated class.', route: '/csharp/delegates' },
    { term: 'CLR (Common Language Runtime)', def: 'The .NET virtual machine that loads assemblies, JIT-compiles IL, manages memory via the GC, and enforces type safety.', route: '/csharp/basics' },
    { term: 'collection expression', def: 'C# 12 syntax for creating collections with brackets, e.g. int[] a = [1, 2, 3], including the spread element ..other.', route: '/csharp/whats-new-11-12' },
    { term: 'constraint (generic)', def: 'A where clause restricting type arguments, e.g. where T : class, new(), or IComparable<T>, so the generic code can rely on capabilities.', route: '/csharp/generics' },
    { term: 'contravariance', def: 'Allowing a less-derived type argument where a more derived one is expected, marked with "in" (e.g. IComparer<in T>). An Action<object> can stand in for Action<string>.', route: '/csharp/generics' },
    { term: 'covariance', def: 'Allowing a more-derived type argument, marked with "out" (e.g. IEnumerable<out T>), so IEnumerable<string> is usable as IEnumerable<object>.', route: '/csharp/generics' },
    { term: 'deadlock', def: 'Two or more operations each waiting on the other forever — classically caused in .NET by blocking on async code with .Result inside a synchronization context.', route: '/csharp/threading' },
    { term: 'deconstruction', def: 'Splitting a tuple or object into separate variables, e.g. var (x, y) = point, powered by Deconstruct methods.', route: '/csharp/tuples' },
    { term: 'deferred execution', def: 'LINQ queries describe work but do not run until enumerated; each enumeration re-executes the query against the current data.', route: '/csharp/linq' },
    { term: 'delegate', def: 'A type-safe reference to one or more methods with a matching signature; the foundation of events, callbacks, and LINQ.', route: '/csharp/delegates' },
    { term: 'event', def: 'A delegate-based member that lets a class publish notifications while only exposing subscribe (+=) and unsubscribe (-=) to outsiders.', route: '/csharp/delegates' },
    { term: 'extension method', def: 'A static method that is callable as if it were an instance method on its first (this) parameter — how LINQ extends IEnumerable<T>.', route: '/csharp/extension-methods' },
    { term: 'file-scoped namespace', def: 'Declaring "namespace Foo;" once for the whole file instead of wrapping everything in braces, removing one indent level.', route: '/csharp/namespaces' },
    { term: 'finalizer', def: 'A ~ClassName() method the GC calls before reclaiming an object, used as a last-resort cleanup for unmanaged resources. Prefer IDisposable.', route: '/csharp/gc-disposable' },
    { term: 'GC generation', def: 'The garbage collector’s age buckets (gen 0, 1, 2 plus the large object heap); young objects are collected often and cheaply, survivors get promoted.', route: '/csharp/gc-disposable' },
    { term: 'generics', def: 'Type-parameterized classes and methods (List<T>, Dictionary<K,V>) that give reuse without casting or boxing.', route: '/csharp/generics' },
    { term: 'global using', def: 'A using directive prefixed with "global" that applies to every file in the project, typically collected in one file.', route: '/csharp/whats-new-9-10' },
    { term: 'heap', def: 'The managed memory region where reference-type instances (and boxed values) live, managed by the garbage collector.', route: '/csharp/gc-disposable' },
    { term: 'IDisposable', def: 'The interface for deterministic cleanup of resources (files, connections). Consumed with using statements or declarations.', route: '/csharp/gc-disposable' },
    { term: 'IL (intermediate language)', def: 'The CPU-independent bytecode the C# compiler produces; the JIT or AOT compiler turns it into native code.' },
    { term: 'immutability', def: 'Designing types whose state never changes after construction — records, init setters, and readonly members make this easy and thread-safe.', route: '/csharp/records' },
    { term: 'JIT (just-in-time compilation)', def: 'Compiling IL to native code at runtime, method by method, with tiered compilation re-optimizing hot methods.' },
    { term: 'lambda', def: 'An inline anonymous function written with =>, e.g. x => x * 2, convertible to delegates and expression trees.', route: '/csharp/delegates' },
    { term: 'LINQ', def: 'Language Integrated Query: a unified set of operators (Where, Select, GroupBy…) for querying collections, databases, and more.', route: '/csharp/linq' },
    { term: 'Memory<T>', def: 'A heap-storable sibling of Span<T> that can live in fields and async methods, exposing a Span via .Span when you need to read or write.' },
    { term: 'nullable reference type', def: 'Compiler-enforced annotations (string vs string?) that track possible nulls and warn on unsafe dereferences when #nullable is enabled.', route: '/csharp/null-safety' },
    { term: 'partial class', def: 'A class whose definition is split across files, letting generated code and hand-written code coexist (source generators rely on it).' },
    { term: 'pattern matching', def: 'Testing and deconstructing values with is, switch expressions, and patterns (type, property, relational, list, logical).', route: '/csharp/pattern-matching' },
    { term: 'primary constructor', def: 'C# 12 syntax putting constructor parameters in the class/struct header, e.g. class Service(ILogger log), available throughout the body.', route: '/csharp/whats-new-11-12' },
    { term: 'raw string literal', def: 'Triple-quoted strings ("""...""") that keep quotes, backslashes, and newlines verbatim — ideal for JSON, regex, and SQL.', route: '/csharp/whats-new-11-12' },
    { term: 'record', def: 'A reference (or value, with record struct) type with compiler-generated value equality, ToString, deconstruction, and with-expressions.', route: '/csharp/records' },
    { term: 'reference semantics', def: 'Assignment copies a reference, so two variables point at the same object — mutating through one is visible through the other.', route: '/csharp/system-object' },
    { term: 'ref struct', def: 'A struct that must stay on the stack (e.g. Span<T>); it cannot be boxed, stored in fields of classes, or used across await.', route: '/csharp/structures' },
    { term: 'sealed', def: 'A modifier preventing inheritance of a class or further overriding of a member; also enables devirtualization optimizations.', route: '/csharp/inheritance' },
    { term: 'Span<T>', def: 'A stack-only window over contiguous memory (array, string, stackalloc) that allows slicing and mutation without copies or allocations.' },
    { term: 'stack', def: 'Per-thread memory holding method frames, parameters, and local value types; allocation and reclamation are effectively free.', route: '/csharp/structures' },
    { term: 'string interning', def: 'The runtime’s pool of unique string instances; identical literals share one object, and string.Intern can pool runtime strings.', route: '/csharp/strings-datetime' },
    { term: 'StringBuilder', def: 'A mutable string buffer for incremental building; avoids the O(n²) allocation cost of repeated string concatenation in loops.', route: '/csharp/strings-datetime' },
    { term: 'struct', def: 'A value type allocated inline (stack or containing object); copied on assignment, no inheritance, best kept small and immutable.', route: '/csharp/structures' },
    { term: 'switch expression', def: 'An expression form of switch using => arms and patterns that returns a value and is checked for exhaustiveness.', route: '/csharp/pattern-matching' },
    { term: 'SynchronizationContext', def: 'An abstraction that captures "where continuations should resume" (e.g. a UI thread). await captures it by default; ConfigureAwait(false) skips it.', route: '/csharp/tasks' },
    { term: 'Task', def: 'A handle to an asynchronous operation’s eventual completion (and result for Task<T>), composed with await, WhenAll, and WhenAny.', route: '/csharp/tasks' },
    { term: 'thread pool', def: 'The runtime-managed pool of worker threads that executes Task.Run work and async continuations without per-task thread creation.', route: '/csharp/threading' },
    { term: 'top-level statements', def: 'Writing program code directly in Program.cs without an explicit Main method or Program class; the compiler generates them.', route: '/csharp/whats-new-9-10' },
    { term: 'tuple', def: 'A lightweight value grouping like (int Min, int Max) with named elements, value equality, and deconstruction support.', route: '/csharp/tuples' },
    { term: 'unboxing', def: 'Extracting a value type back out of a box with a cast; throws InvalidCastException if the boxed type does not match exactly.', route: '/csharp/type-conversion' },
    { term: 'value semantics', def: 'Assignment copies the data itself, so each variable is independent — the behavior of structs and the equality behavior of records.', route: '/csharp/structures' },
    { term: 'virtual dispatch', def: 'Resolving a virtual/override method call at runtime based on the object’s actual type, via the method table.', route: '/csharp/inheritance' },
  ];

  filtered = computed(() => {
    const q = this.search().trim().toLowerCase();
    if (!q) return this.terms;
    return this.terms.filter(
      t => t.term.toLowerCase().includes(q) || t.def.toLowerCase().includes(q)
    );
  });

  groups = computed<LetterGroup[]>(() => {
    const map = new Map<string, Term[]>();
    for (const t of [...this.filtered()].sort((a, b) => a.term.localeCompare(b.term))) {
      const letter = t.term[0].toUpperCase();
      if (!map.has(letter)) map.set(letter, []);
      map.get(letter)!.push(t);
    }
    return [...map.entries()].map(([letter, terms]) => ({ letter, terms }));
  });

  activeLetters = computed(() => new Set(this.groups().map(g => g.letter)));

  scrollTo(letter: string): void {
    document.getElementById('csglossary-' + letter)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}
