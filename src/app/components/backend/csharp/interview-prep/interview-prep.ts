import { Component, signal, computed } from '@angular/core';

export interface InterviewQuestion {
  q: string;
  a: string;
  topic: string;
  level: 'junior' | 'mid' | 'senior';
}

const QUESTIONS: InterviewQuestion[] = [
  // ── Types & Memory ───────────────────────────────────────────────────────
  {
    q: 'What is the difference between value types and reference types?',
    a: 'Value types (structs, enums, primitives like int and bool) hold their data directly and are copied on assignment; reference types (classes, interfaces, delegates, arrays, strings) store a reference to an object on the managed heap, so assignment copies the reference, not the object. Value types derive from System.ValueType, cannot be inherited from, and have value-based default semantics. Where a value type lives (stack, register, or inline inside a heap object) is an implementation detail, not a language guarantee.',
    topic: 'Types',
    level: 'junior',
  },
  {
    q: 'What is boxing and unboxing, and why does it matter for performance?',
    a: 'Boxing wraps a value type in a heap-allocated object when it is converted to object or a non-generic interface; unboxing extracts the value back with a cast. Each box is a heap allocation plus GC pressure, and unboxing to the wrong type throws InvalidCastException. Generics largely eliminate boxing — List<int> stores ints directly, whereas the old ArrayList boxed every element.',
    topic: 'Types',
    level: 'mid',
  },
  {
    q: 'Why are strings immutable in C#, and what are the consequences?',
    a: 'A string object can never change after creation; methods like Replace or ToUpper return new strings. Immutability makes strings thread-safe, enables interning of identical literals, and lets them be safely used as dictionary keys. The consequence is that concatenating in a loop creates many intermediate strings — use StringBuilder, string.Join, or string.Create for heavy string building.',
    topic: 'Strings',
    level: 'junior',
  },
  {
    q: 'Difference between const and readonly?',
    a: 'const is a compile-time constant baked into every assembly that references it — it must be a primitive/string, is implicitly static, and changing it requires recompiling all consumers. readonly fields are set at declaration or in a constructor and evaluated at runtime, so they can hold any type and differ per instance. For struct locals there is also "ref readonly" and "in" parameters which give read-only views without copying.',
    topic: 'Types',
    level: 'junior',
  },
  {
    q: 'What is the difference between string, string.Empty, and null, and how do you check them?',
    a: 'null means no string object at all; string.Empty (same as "") is a real zero-length string instance. Calling members on null throws NullReferenceException, while empty strings behave normally. string.IsNullOrEmpty() covers both, and string.IsNullOrWhiteSpace() additionally treats whitespace-only strings as empty — usually what validation actually wants.',
    topic: 'Strings',
    level: 'junior',
  },
  {
    q: 'What is a struct and when should you define one instead of a class?',
    a: 'Define a struct when the type represents a small, immutable value — typically under ~16-24 bytes — with value equality semantics, like a coordinate, money amount, or range. Structs avoid heap allocation in many scenarios but are copied on every assignment and parameter pass, so large mutable structs are a performance and correctness trap. readonly struct and record struct (C# 10) make value semantics explicit and safe.',
    topic: 'Types',
    level: 'mid',
  },
  {
    q: 'What is Span<T> and what problem does it solve?',
    a: 'Span<T> is a ref struct providing a type-safe view over contiguous memory — an array segment, stack-allocated buffer, or native memory — without copying or allocating. Slicing a string or array with AsSpan() lets you parse and transform data allocation-free, which is why APIs like int.Parse accept ReadOnlySpan<char>. Being a ref struct, it can only live on the stack: no fields in classes, no boxing, no use across await — Memory<T> covers those async scenarios.',
    topic: 'Memory',
    level: 'senior',
  },

  // ── OOP ──────────────────────────────────────────────────────────────────
  {
    q: 'Interface vs abstract class — how do you choose?',
    a: 'An interface defines a contract with no state and supports multiple implementation; an abstract class can hold fields, constructors, and shared implementation but allows only single inheritance. Choose interfaces for capabilities (IComparable, IDisposable) and abstract classes when subclasses genuinely share state or protected helpers. Since C# 8, interfaces can have default method implementations, narrowing the gap but not adding instance state.',
    topic: 'OOP',
    level: 'junior',
  },
  {
    q: 'Explain virtual, override, and the new keyword on methods.',
    a: 'virtual marks a method as overridable; override replaces it in a derived class with dynamic dispatch, so the runtime type decides which implementation runs. new instead hides the base method — which implementation runs depends on the compile-time type of the reference, a frequent source of bugs. sealed override stops further overriding down the hierarchy.',
    topic: 'OOP',
    level: 'junior',
  },
  {
    q: 'What is the difference between method overloading and overriding?',
    a: 'Overloading defines multiple methods with the same name but different parameter lists in the same scope, resolved at compile time. Overriding replaces a virtual base implementation in a derived class, resolved at runtime via the v-table. Overload resolution happens against the static type, which is why adding an overload can silently change which method existing calls bind to.',
    topic: 'OOP',
    level: 'junior',
  },
  {
    q: 'What are sealed classes and why might you seal a class?',
    a: 'sealed prevents inheritance from a class (or further overriding of a member). Sealing communicates design intent, prevents fragile-base-class problems, and lets the JIT devirtualize calls — sealed types enable faster type checks and direct dispatch. Many style guides recommend sealing classes by default and unsealing deliberately.',
    topic: 'OOP',
    level: 'mid',
  },
  {
    q: 'Explain static constructors and static class members.',
    a: 'A static constructor runs at most once per type, lazily, before the first static member access or instance creation, and cannot take parameters or be called directly. Static members belong to the type, are shared across all instances, and are a common place for caches — which means they need thread-safety consideration. A static class can contain only static members and cannot be instantiated, ideal for extension method containers.',
    topic: 'OOP',
    level: 'mid',
  },
  {
    q: 'What is explicit interface implementation and when is it useful?',
    a: 'Implementing a member as "void IFoo.Bar()" makes it accessible only through the interface reference, not the class. It resolves conflicts when two interfaces declare the same member signature with different meanings, and it hides infrastructure members (like IEnumerable.GetEnumerator) from the public class API. The downside is discoverability — callers must cast to the interface.',
    topic: 'OOP',
    level: 'senior',
  },

  // ── Generics ─────────────────────────────────────────────────────────────
  {
    q: 'What are generics and what problems do they solve?',
    a: 'Generics let you write types and methods parameterized over type arguments — List<T>, Dictionary<TKey, TValue> — giving compile-time type safety and avoiding boxing and casting that plagued object-based collections. The CLR creates specialized code per value-type argument and shared code for reference types, so generics carry no per-call casting cost. They are reified at runtime (unlike Java erasure), so typeof(T) works.',
    topic: 'Generics',
    level: 'junior',
  },
  {
    q: 'Explain generic constraints (where clauses).',
    a: 'Constraints restrict type arguments so the method body can use their capabilities: where T : class / struct (reference/value type), where T : new() (parameterless constructor), where T : SomeBase or ISomeInterface, where T : notnull, and where T : unmanaged. C# 11 added static abstract interface members enabling math-generic constraints like where T : INumber<T>. Constraints are part of the signature and checked at compile time.',
    topic: 'Generics',
    level: 'mid',
  },
  {
    q: 'What are covariance and contravariance in generics?',
    a: 'Covariance (out T) lets you use a more derived type argument — IEnumerable<string> is assignable to IEnumerable<object> — and is safe because T only appears in output positions. Contravariance (in T) goes the other way — IComparer<object> works as IComparer<string> — safe because T appears only in inputs. Variance applies only to interfaces and delegates with reference-type arguments; List<string> is not a List<object> because lists both consume and produce T.',
    topic: 'Generics',
    level: 'senior',
  },
  {
    q: 'Why is List<string> not assignable to List<object>, while string[] is assignable to object[]?',
    a: 'Generic classes are invariant: allowing the assignment would let you Add(an int boxed as object) into what is really a List<string>. Arrays are covariant for historical Java-compatibility reasons, which is unsafe — storing a wrong-typed element into an object[] that is really a string[] throws ArrayTypeMismatchException at runtime, with a covariance check cost on every reference-type array store. Variance-safe alternatives are IEnumerable<out T> or IReadOnlyList<out T>.',
    topic: 'Generics',
    level: 'senior',
  },

  // ── Delegates & Events ───────────────────────────────────────────────────
  {
    q: 'What is a delegate and how do Func, Action, and Predicate relate?',
    a: 'A delegate is a type-safe reference to one or more methods with a specific signature. Func<T..., TResult> represents a method returning a value, Action<T...> returns void, and Predicate<T> is Func<T, bool> by another name — the built-in generic delegates mean you rarely declare custom delegate types. Delegates are multicast: += chains invocations, and for non-void delegates only the last return value survives.',
    topic: 'Delegates',
    level: 'junior',
  },
  {
    q: 'What is the difference between a delegate and an event?',
    a: 'An event is an encapsulation layer over a delegate field: outside the declaring class you can only subscribe (+=) and unsubscribe (-=), never invoke it or overwrite the whole invocation list. This protects observers from each other and keeps raising the event the publisher’s exclusive right. The conventional signature is EventHandler<TEventArgs>, raised via a null-conditional call: SomethingHappened?.Invoke(this, args).',
    topic: 'Delegates',
    level: 'mid',
  },
  {
    q: 'What is a closure and what is the classic loop-variable pitfall?',
    a: 'A lambda that references local variables captures them by reference into a compiler-generated class, so the lambda sees later mutations — that is a closure. The classic pitfall was capturing a for-loop variable: all lambdas shared the single variable and observed its final value. foreach was fixed in C# 5 to scope the iteration variable per iteration; for for-loops you still need a local copy inside the loop body.',
    topic: 'Delegates',
    level: 'mid',
  },
  {
    q: 'How can event subscriptions cause memory leaks?',
    a: 'The publisher’s delegate list holds strong references to every subscriber, so a long-lived publisher (a static service, the app shell) keeps short-lived subscribers alive after they should be collected. The fix is unsubscribing in Dispose, using weak event patterns, or scoping publisher and subscriber lifetimes together. This is one of the most common managed memory leaks in desktop and long-running server apps.',
    topic: 'Delegates',
    level: 'senior',
  },

  // ── LINQ ─────────────────────────────────────────────────────────────────
  {
    q: 'What is deferred execution in LINQ and why does it matter?',
    a: 'Operators like Where, Select, and OrderBy build a query description but do not run until the sequence is enumerated — by foreach, ToList, Count, etc. This means the query sees the data as it is at enumeration time, runs again on every enumeration, and can capture variables whose later values change results. Materialize with ToList/ToArray when you need a snapshot or will enumerate multiple times.',
    topic: 'LINQ',
    level: 'junior',
  },
  {
    q: 'First vs FirstOrDefault vs Single vs SingleOrDefault?',
    a: 'First returns the first matching element and throws on empty; FirstOrDefault returns default(T) instead. Single additionally throws if more than one element matches, asserting uniqueness; SingleOrDefault allows zero but still throws on two or more. Use Single variants when duplicates indicate a data bug you want surfaced, and note Single must scan past the first match to verify uniqueness.',
    topic: 'LINQ',
    level: 'junior',
  },
  {
    q: 'What is the difference between IEnumerable<T> and IQueryable<T>?',
    a: 'IEnumerable executes with delegates in memory (LINQ to Objects); IQueryable carries expression trees that a provider like EF Core translates into SQL, so filtering happens in the database. Calling AsEnumerable()/ToList() too early pulls the whole table into memory before filtering — a classic performance bug. Conversely, methods not translatable by the provider throw at runtime with IQueryable.',
    topic: 'LINQ',
    level: 'mid',
  },
  {
    q: 'Explain Select vs SelectMany.',
    a: 'Select maps each element to one result, producing a sequence of the same length; SelectMany maps each element to a sequence and flattens all of them into one sequence. For example, customers.SelectMany(c => c.Orders) yields all orders across all customers, while Select would give a sequence of order lists. SelectMany also powers the multiple-from query syntax and join-like cross products.',
    topic: 'LINQ',
    level: 'mid',
  },
  {
    q: 'Why can multiple enumeration of an IEnumerable be a problem?',
    a: 'Each enumeration re-executes the pipeline: re-running an expensive computation, re-querying the database, or — for one-shot sources like a network stream — failing entirely. Tools warn about “possible multiple enumeration” for this reason. If a method needs to iterate twice, materialize once with ToList/ToArray and iterate the buffer.',
    topic: 'LINQ',
    level: 'mid',
  },
  {
    q: 'What does yield return do under the hood?',
    a: 'The compiler rewrites the method into a state machine class implementing IEnumerator<T>/IEnumerable<T>; each MoveNext resumes execution after the last yield. This gives lazy, streaming sequences with O(1) memory — values are produced on demand as the consumer iterates. Code before the first yield does not run until enumeration starts, so argument validation should live in a separate non-iterator wrapper method.',
    topic: 'LINQ',
    level: 'senior',
  },

  // ── Async ────────────────────────────────────────────────────────────────
  {
    q: 'What does the async/await keyword pair actually do?',
    a: 'async enables await in a method; the compiler rewrites the body into a state machine. At each await on an incomplete task, the method registers a continuation and returns to its caller, freeing the thread; when the awaited task completes, the continuation resumes the method — by default on the captured SynchronizationContext or, in modern .NET server apps, on a thread-pool thread. Exceptions are captured into the returned Task and rethrown at the await site.',
    topic: 'Async',
    level: 'mid',
  },
  {
    q: 'How does the classic async deadlock occur and how do you prevent it?',
    a: 'Blocking on a task with .Result or .Wait() from a context with a single-threaded SynchronizationContext (UI thread, classic ASP.NET) deadlocks: the blocked thread is the very thread the awaited continuation needs to resume on. Prevention: go async all the way and never block on tasks; library code should use ConfigureAwait(false) so its continuations do not need the context. ASP.NET Core has no SynchronizationContext, so this specific deadlock disappears there — but sync-over-async still wastes threads.',
    topic: 'Async',
    level: 'senior',
  },
  {
    q: 'What does ConfigureAwait(false) do and when should you use it?',
    a: 'It tells the awaiter not to capture the current SynchronizationContext/TaskScheduler, so the continuation runs on a thread-pool thread instead of marshaling back. Use it in general-purpose library code to avoid deadlocks and context-switch overhead; skip it in UI event handlers or anywhere you need to touch UI state after the await. In ASP.NET Core application code it is mostly a no-op since there is no context to capture.',
    topic: 'Async',
    level: 'senior',
  },
  {
    q: 'Task vs Thread — what is the difference?',
    a: 'A Thread is a dedicated OS thread with its own ~1MB stack — expensive to create and context-switch. A Task is a promise of a result that usually runs on pooled threads (Task.Run) or represents pure I/O with no thread at all while waiting (async I/O completes via OS callbacks). Modern code almost never news up Thread; Task plus async/await scales to thousands of concurrent operations on a handful of threads.',
    topic: 'Async',
    level: 'junior',
  },
  {
    q: 'Difference between Task.WhenAll and awaiting tasks sequentially?',
    a: 'Awaiting sequentially (await A(); await B();) runs operations one after another; starting both tasks first and then await Task.WhenAll(a, b) runs them concurrently, taking roughly the duration of the slowest. WhenAll aggregates results into an array and, on failure, awaiting it throws the first exception while the rest live in task.Exception (an AggregateException). For unbounded work lists, throttle with SemaphoreSlim or Parallel.ForEachAsync rather than launching thousands of tasks.',
    topic: 'Async',
    level: 'mid',
  },
  {
    q: 'What is the difference between async void and async Task, and when is async void acceptable?',
    a: 'async Task returns an awaitable whose completion and exceptions the caller can observe; async void is fire-and-forget — exceptions escape onto the SynchronizationContext and can crash the process, and callers cannot await it. async void exists solely for event handlers, which require a void signature. Everywhere else, return Task (or ValueTask).',
    topic: 'Async',
    level: 'mid',
  },
  {
    q: 'What is CancellationToken and how should APIs use it?',
    a: 'CancellationToken is a cooperative cancellation signal: a CancellationTokenSource cancels it, and async methods accept the token, pass it down to every awaited call, and either poll ThrowIfCancellationRequested in loops or rely on the underlying I/O to abort. Cancellation throws OperationCanceledException, which callers typically treat as a normal control-flow outcome, not an error. Public async APIs should accept an optional token as the last parameter.',
    topic: 'Async',
    level: 'mid',
  },
  {
    q: 'What is ValueTask and when should you prefer it over Task?',
    a: 'ValueTask<T> is a struct that can wrap either a completed result (no allocation) or a Task; it pays off in hot paths where the result is usually available synchronously, like cached lookups or buffered stream reads. Its constraints are strict: await it only once, never concurrently, and do not call .Result before completion. Default to Task and reach for ValueTask only with profiling evidence.',
    topic: 'Async',
    level: 'senior',
  },

  // ── Memory & GC ──────────────────────────────────────────────────────────
  {
    q: 'Describe the .NET garbage collector generations.',
    a: 'The GC is generational: gen 0 holds new objects and is collected frequently and cheaply; survivors get promoted to gen 1 (a buffer) and then gen 2, collected rarely. Objects over ~85KB go to the Large Object Heap, collected with gen 2 and historically not compacted. The design exploits the fact that most objects die young, keeping typical pauses tiny; long-lived objects holding references to short-lived ones (mid-life crisis) hurt this model.',
    topic: 'Memory',
    level: 'mid',
  },
  {
    q: 'What is IDisposable and the dispose pattern, and how does using help?',
    a: 'IDisposable.Dispose() releases unmanaged or scarce resources (file handles, sockets, DB connections) deterministically, because the GC neither runs promptly nor in a defined order. The using statement (or C# 8 using declaration: using var f = ...) guarantees Dispose runs even on exceptions. The full dispose pattern with a protected virtual Dispose(bool) and a finalizer is only needed when you directly own unmanaged handles — most classes just dispose their managed members.',
    topic: 'Memory',
    level: 'mid',
  },
  {
    q: 'What is a finalizer and why are they discouraged?',
    a: 'A finalizer (~ClassName) runs on the finalizer thread at some point after the object becomes unreachable, as a safety net for unmanaged resources. Finalizable objects survive at least one extra GC, run on an unpredictable schedule and thread, and can resurrect objects — making them costly and error-prone. Prefer SafeHandle, which encapsulates the finalization correctly, and GC.SuppressFinalize in Dispose when a finalizer does exist.',
    topic: 'Memory',
    level: 'senior',
  },
  {
    q: 'stackalloc and the heap vs stack distinction — when does it actually matter?',
    a: 'stackalloc allocates a buffer on the current stack frame into a Span<T>, with zero GC cost and automatic release on return — great for small temporary buffers (commonly guarded to ~256-1024 bytes to avoid stack overflow). More broadly, where data lives matters for allocation-rate-sensitive code: hot paths in servers, serializers, and parsers reduce gen 0 churn with spans, pooling (ArrayPool<T>), and structs. Outside hot paths, clarity beats these micro-optimizations.',
    topic: 'Memory',
    level: 'senior',
  },

  // ── Records & Equality ───────────────────────────────────────────────────
  {
    q: 'What are records and how do they differ from classes?',
    a: 'Records (C# 9) are reference types with compiler-generated value-based Equals/GetHashCode, a readable ToString, init-only positional properties, deconstruction, and non-destructive mutation via with expressions. They are designed for immutable data models — DTOs, domain values, messages. record struct (C# 10) brings the same conveniences to value types.',
    topic: 'Records',
    level: 'junior',
  },
  {
    q: 'Explain == vs Equals vs ReferenceEquals.',
    a: 'ReferenceEquals checks whether two references point to the same object. Equals is virtual and types override it for value semantics (string, records, value types). The == operator is resolved at compile time against the static types: classes default to reference equality unless they overload ==, string and records overload it to value equality. Pitfall: comparing two strings typed as object with == silently does reference comparison.',
    topic: 'Records',
    level: 'mid',
  },
  {
    q: 'What rules must GetHashCode follow and why?',
    a: 'Equal objects (per Equals) must return equal hash codes, and the hash must not change while the object is used as a key in a hash-based collection. Violating the first rule makes dictionary lookups miss existing keys; mutating a key after insertion strands it in the wrong bucket. This is why hash keys should be immutable, and why overriding Equals requires overriding GetHashCode — HashCode.Combine makes the implementation trivial.',
    topic: 'Records',
    level: 'senior',
  },
  {
    q: 'What does a with expression do and what is its limitation with mutable reference-type members?',
    a: 'with clones a record and applies the specified property changes, leaving the original untouched — non-destructive mutation. The clone is shallow: reference-type members are shared between original and copy, so mutating a List<T> inside one record is visible through the other. For true immutability, use immutable member types (ImmutableArray, other records) inside records.',
    topic: 'Records',
    level: 'mid',
  },

  // ── Pattern Matching ─────────────────────────────────────────────────────
  {
    q: 'What pattern matching features does modern C# offer?',
    a: 'Type patterns (obj is Customer c), property patterns (order is { Total: > 100, Status: OrderStatus.Paid }), relational and logical patterns (is > 0 and < 10, is not null), positional patterns via deconstruction, list patterns in C# 11 ([first, .., last]), and switch expressions that return values. Together they replace chains of if/else casts with declarative, compiler-exhaustiveness-checked logic.',
    topic: 'Patterns',
    level: 'mid',
  },
  {
    q: 'Switch statement vs switch expression?',
    a: 'A switch expression (x switch { ... }) is an expression returning a value, with patterns on the left of => and no fall-through or break; the compiler warns when cases are not exhaustive, and an unmatched value throws SwitchExpressionException. The classic switch statement executes statements per case and suits side-effect-driven branching. Switch expressions pair naturally with records and property patterns for mapping logic.',
    topic: 'Patterns',
    level: 'junior',
  },
  {
    q: 'Why is "is not null" preferred over "!= null" in some codebases?',
    a: 'The is null / is not null patterns always perform a true null check, whereas == and != can be overloaded by a type — a buggy or expensive operator overload changes the meaning of != null. Patterns are also slightly more readable in compound checks like "obj is not null and not string". For most well-behaved types the two compile to the same thing, so this is a robustness convention.',
    topic: 'Patterns',
    level: 'mid',
  },

  // ── Nullability ──────────────────────────────────────────────────────────
  {
    q: 'What are nullable reference types (NRT) and what does enabling them change?',
    a: 'With <Nullable>enable</Nullable>, reference types are non-nullable by default and string? explicitly marks nullable ones; the compiler flow-analyzes your code and warns on possible null dereferences (CS8602) and null assignments to non-nullable variables. It is annotations plus analysis only — no runtime enforcement, so nulls can still arrive from serializers or un-annotated libraries. Attributes like [NotNullWhen(true)] teach the analyzer about helper methods.',
    topic: 'Nullability',
    level: 'mid',
  },
  {
    q: 'Explain the null-related operators: ?., ??, ??=, and !.',
    a: '?. (null-conditional) short-circuits to null instead of throwing when the receiver is null; ?? (null-coalescing) supplies a fallback value; ??= assigns only when the target is currently null. The null-forgiving ! operator suppresses the compiler’s nullability warning without any runtime effect — it is an assertion to the analyzer and should be rare and justified. Combined idiom: name?.Trim() ?? "unknown".',
    topic: 'Nullability',
    level: 'junior',
  },
  {
    q: 'How do you handle nullability across serialization and API boundaries?',
    a: 'NRT annotations are not enforced at runtime, so data crossing boundaries (JSON, DB rows, reflection) must be validated: use required properties (C# 11) so deserializers and object initializers must set them, validate DTOs explicitly, and avoid the ! operator to silence boundary warnings. ArgumentNullException.ThrowIfNull(arg) gives concise guard clauses for public API parameters.',
    topic: 'Nullability',
    level: 'senior',
  },

  // ── Exceptions ───────────────────────────────────────────────────────────
  {
    q: 'What are best practices for throwing and catching exceptions?',
    a: 'Throw specific exception types with meaningful messages, use guard helpers like ArgumentNullException.ThrowIfNull, and never throw from finally or Dispose. Catch only exceptions you can actually handle, at the level that can handle them; catch-all handlers belong at top-level boundaries (request pipeline, message loop) for logging. Exceptions are for exceptional conditions — using them for normal control flow is slow and obscures intent (prefer TryParse-style APIs).',
    topic: 'Exceptions',
    level: 'mid',
  },
  {
    q: 'What is the difference between throw and throw ex inside a catch block?',
    a: 'throw; rethrows the current exception preserving the original stack trace; throw ex; resets the stack trace to the rethrow point, destroying the information about where the failure actually happened. If you need to rethrow on a different thread or after capture, use ExceptionDispatchInfo.Capture(ex).Throw(), which also preserves the trace. To add context, wrap: throw new DomainException("...", ex) with the original as InnerException.',
    topic: 'Exceptions',
    level: 'mid',
  },
  {
    q: 'What are exception filters (catch ... when) and why use them?',
    a: 'catch (SqlException ex) when (ex.Number == 2601) runs the filter before the catch block is entered; if it returns false, the exception continues unwinding as if this catch did not exist, preserving the original stack intact. Filters enable conditional handling without catch-and-rethrow, and "when (Log(ex))" style filters can observe exceptions without handling them. They run at the throw point, before finally blocks of inner frames.',
    topic: 'Exceptions',
    level: 'senior',
  },
  {
    q: 'How do exceptions behave with async methods and Task.WhenAll?',
    a: 'An exception in an async Task method is stored in the task and rethrown when awaited — unobserved faulted tasks raise TaskScheduler.UnobservedTaskException instead of crashing immediately. await unwraps AggregateException to the first inner exception; with Task.WhenAll, awaiting throws only the first failure, and you inspect whenAllTask.Exception (or each task) to see all of them. async void methods, by contrast, throw straight onto the context and can crash the process.',
    topic: 'Exceptions',
    level: 'senior',
  },

  // ── Modern C# ────────────────────────────────────────────────────────────
  {
    q: 'What are required members and init-only setters?',
    a: 'init accessors (C# 9) allow a property to be set only during object initialization — in constructors or object initializers — giving immutability without constructor boilerplate. required (C# 11) forces callers to set the member in the initializer or a constructor marked [SetsRequiredMembers], with compile-time enforcement. Together they make safe, readable initialization: new User { Name = "Ada" } where Name is required init.',
    topic: 'Modern C#',
    level: 'mid',
  },
  {
    q: 'What are primary constructors (C# 12) and how do they differ between classes and records?',
    a: 'A primary constructor puts parameters in the type header: class Service(ILogger logger) { ... } makes the parameters available throughout the body as captured values. On records, primary constructor parameters also generate public init properties and deconstruction; on classes they are just parameters — no properties are generated unless you declare them. They mainly cut DI boilerplate in services.',
    topic: 'Modern C#',
    level: 'mid',
  },
  {
    q: 'What are collection expressions and the spread element (C# 12)?',
    a: 'Collection expressions use bracket syntax to create arrays, spans, lists, and any type with a collection builder: int[] a = [1, 2, 3]; List<string> l = [..first, ..second, "extra"]. The spread element .. inlines an existing collection’s elements. The compiler picks an efficient construction strategy per target type, often beating hand-written new List + AddRange.',
    topic: 'Modern C#',
    level: 'junior',
  },
  {
    q: 'How does string interpolation work, and what makes it efficient in modern .NET?',
    a: 'An interpolated string ($"Hello {name}, total {total:C}") embeds expressions with optional format specifiers. Since .NET 6, the compiler lowers it to DefaultInterpolatedStringHandler, which appends parts into a pooled buffer instead of calling string.Format with boxed arguments — and APIs can accept custom handlers to skip formatting entirely (e.g., logging below the active level). Const interpolated strings are allowed when all parts are constant.',
    topic: 'Strings',
    level: 'mid',
  },
];

@Component({
  selector: 'app-csharp-interview-prep',
  standalone: true,
  imports: [],
  templateUrl: './interview-prep.html',
  styleUrl: './interview-prep.scss',
})
export class CsharpInterviewPrep {
  readonly levels = ['all', 'junior', 'mid', 'senior'];

  readonly questions = QUESTIONS;
  readonly topics: string[] = ['all', ...Array.from(new Set(QUESTIONS.map(q => q.topic)))];

  activeLevel = signal<string>('all');
  activeTopic = signal<string>('all');
  expanded = signal<Set<number>>(new Set());

  filtered = computed(() => {
    const level = this.activeLevel();
    const topic = this.activeTopic();
    return this.questions
      .map((item, index) => ({ item, index }))
      .filter(({ item }) =>
        (level === 'all' || item.level === level) &&
        (topic === 'all' || item.topic === topic)
      );
  });

  allOpen = computed(() => {
    const open = this.expanded();
    const visible = this.filtered();
    return visible.length > 0 && visible.every(({ index }) => open.has(index));
  });

  isOpen(index: number): boolean {
    return this.expanded().has(index);
  }

  toggle(index: number): void {
    this.expanded.update(set => {
      const next = new Set(set);
      next.has(index) ? next.delete(index) : next.add(index);
      return next;
    });
  }

  toggleAll(): void {
    if (this.allOpen()) {
      this.expanded.set(new Set());
    } else {
      this.expanded.set(new Set(this.filtered().map(({ index }) => index)));
    }
  }

  setLevel(level: string): void {
    this.activeLevel.set(level);
  }

  setTopic(topic: string): void {
    this.activeTopic.set(topic);
  }
}
