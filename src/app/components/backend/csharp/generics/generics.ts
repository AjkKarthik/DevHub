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
import { CommonMistakesComponent, CommonMistake } from '../../../shared/common-mistakes/common-mistakes';
import { RevisionCardComponent, RevisionSummary } from '../../../shared/revision-card/revision-card';

@Component({
  selector: 'app-csharp-generics',
  standalone: true,
  imports: [
    CommonModule, CodeBlockComponent, TheoryBlockComponent, QnaBlockComponent,
    QuizBlockComponent, ChallengeBlockComponent, QuickRefComponent,
    PageMetaComponent, PageCompleteComponent,
    CommonMistakesComponent, RevisionCardComponent,
  ],
  templateUrl: './generics.html',
  styleUrl: './generics.scss',
})
export class CsharpGenerics {

  quickRef: QuickRefItem[] = [
    { name: 'where T : class',          type: 'constraint', desc: 'Restricts T to reference types (classes, interfaces, delegates, arrays).' },
    { name: 'where T : struct',         type: 'constraint', desc: 'Restricts T to value types — excludes nullable reference types.' },
    { name: 'where T : new()',           type: 'constraint', desc: 'Requires T to have a public parameterless constructor — enables new T().' },
    { name: 'where T : IComparable<T>', type: 'constraint', desc: 'Allows calling CompareTo() on instances of T for ordering.' },
    { name: 'where T : unmanaged',      type: 'constraint', desc: 'T must be a blittable value type with no managed references — enables pointer arithmetic.' },
    { name: 'INumber<T>',               type: 'interface',  desc: '.NET 7+ interface that enables arithmetic operators (+, -, *, /) on generic T.', since: '.NET 7' },
    { name: 'default(T)',               type: 'keyword',    desc: 'Returns null for reference types and zero/false for value types.' },
    { name: 'typeof(T)',                type: 'operator',   desc: 'Returns the System.Type object representing T at compile time (open generic).' },
    { name: 'in T',                     type: 'keyword',    desc: 'Contravariance — T is consumed (write-only). Allows assigning IFoo<Base> to IFoo<Derived>.' },
    { name: 'out T',                    type: 'keyword',    desc: 'Covariance — T is produced (read-only). Allows assigning IFoo<Derived> to IFoo<Base>.' },
  ];

  theory: TheoryPoint[] = [
    {
      heading: 'Type safety without casting',
      points: [
        'Generics let you write type-safe code once and reuse it for any type — the compiler enforces correctness at compile time.',
        'Without generics you would use <code>object</code>, requiring boxing (value → object) and unboxing (object → value) which incurs runtime cost and risk.',
        'A generic <code>List&lt;T&gt;</code> stores items as their actual type; a non-generic <code>ArrayList</code> stores them as <code>object</code>, causing boxing and unsafe casts.',
        'Type errors are caught at compile time (e.g. <code>Stack&lt;int&gt;</code> refuses a string) rather than at runtime via <code>InvalidCastException</code>.',
        'The JIT generates specialised native code per value-type instantiation (<code>List&lt;int&gt;</code>, <code>List&lt;double&gt;</code> each get their own code) so there is no boxing for value types in generic containers.',
      ],
    },
    {
      heading: 'Type constraints',
      points: [
        '<code>where T : class</code> restricts T to reference types; <code>where T : struct</code> restricts to value types.',
        '<code>where T : new()</code> allows you to write <code>new T()</code> inside the generic method or class body.',
        '<code>where T : IComparable&lt;T&gt;</code> unlocks <code>CompareTo()</code> — needed for sorting, min/max, and comparison algorithms.',
        'Multiple constraints can be combined: <code>where T : class, new(), IDisposable</code> — all must be satisfied.',
        '<code>where T : unmanaged</code> restricts to blittable value types with no managed references — enables unsafe pointer arithmetic and direct memory access.',
      ],
    },
    {
      heading: 'Covariance and contravariance',
      points: [
        '<code>out T</code> (covariance) means T is only produced (returned). You can assign <code>IEnumerable&lt;Dog&gt;</code> to <code>IEnumerable&lt;Animal&gt;</code> because <code>IEnumerable&lt;out T&gt;</code> is declared covariant.',
        '<code>in T</code> (contravariance) means T is only consumed (parameter). You can assign <code>IComparer&lt;Animal&gt;</code> to <code>IComparer&lt;Dog&gt;</code>.',
        'Only interfaces and delegates support variance annotations — classes and structs do not. <code>List&lt;T&gt;</code> is invariant; <code>IEnumerable&lt;T&gt;</code> is covariant.',
        'A common mnemonic: <strong>out = covariant = producer = read-only</strong>; <strong>in = contravariant = consumer = write-only</strong>.',
        'The invariance of <code>List&lt;T&gt;</code> is intentional: a covariant list would allow <code>IList&lt;Animal&gt; animals = new List&lt;Dog&gt;()</code> and then <code>animals.Add(new Cat())</code> — a type-safety violation. Covariance is only safe for read-only producers.',
      ],
    },
    {
      heading: 'Generic methods vs generic classes',
      points: [
        'Prefer a generic method when only one method needs the type parameter — keeps the class non-generic and simpler.',
        'Use a generic class when state must be typed (e.g. <code>Repository&lt;T&gt;</code>, <code>Stack&lt;T&gt;</code>, <code>Cache&lt;TKey, TValue&gt;</code>).',
        'Type parameters on methods are inferred from arguments: <code>Swap(ref a, ref b)</code> — no need to write <code>Swap&lt;int&gt;(ref a, ref b)</code>.',
        'A generic class can have non-generic methods, and a non-generic class can have generic methods — they are orthogonal features.',
        'Generic classes can inherit from other generic classes or from a closed generic: <code>class SpecificStack : Stack&lt;int&gt;</code> or <code>class TypedStack&lt;T&gt; : Stack&lt;T&gt;</code>.',
      ],
    },
    {
      heading: 'default(T) and typeof(T)',
      points: [
        '<code>default(T)</code> returns the zero value for value types (<code>0</code>, <code>false</code>, all-zero bits) and <code>null</code> for reference types. Use it when you need a safe "empty" value without knowing T.',
        'The <code>default</code> literal (no parentheses) is shorthand when the type is already known from context: <code>T result = default;</code>.',
        '<code>typeof(T)</code> returns the <code>System.Type</code> object for T at compile time. For an open generic (<code>typeof(List&lt;&gt;)</code>), it returns the unbound generic type; for a closed generic parameter inside a method, it returns the concrete type used.',
        '<code>GetType()</code> is called on an <em>instance</em> at runtime and always returns the most-derived concrete type. <code>typeof(T)</code> is resolved at compile time and may differ for constrained-but-abstract type parameters.',
        'Combining them: <code>if (typeof(T) == typeof(string))</code> in a generic method is a valid pattern — the JIT de-virtualises this check and can eliminate the branch at compile time for each specialisation.',
      ],
    },
    {
      heading: 'Generic math — INumber<T> (.NET 7+)',
      points: [
        '<code>INumber&lt;T&gt;</code> (in <code>System.Numerics</code>) is a static abstract interface that exposes arithmetic operators (+, -, *, /), comparison, parsing, and constants like <code>T.Zero</code> and <code>T.One</code> for all numeric types.',
        'It enables a single generic implementation of numeric algorithms: <code>T Sum&lt;T&gt;(IEnumerable&lt;T&gt; src) where T : INumber&lt;T&gt;</code> works for <code>int</code>, <code>double</code>, <code>decimal</code>, and any custom numeric type.',
        'Before .NET 7, writing numeric generics required either multiple overloads, reflection, or <code>dynamic</code> — all of which had correctness or performance drawbacks.',
        '<code>INumber&lt;T&gt;</code> is a large interface; narrower alternatives exist: <code>IAdditionOperators&lt;T,T,T&gt;</code>, <code>IComparisonOperators&lt;T,T,bool&gt;</code>, <code>IMinMaxValue&lt;T&gt;</code> — prefer the narrowest interface that satisfies your need.',
        'Custom types can implement <code>INumber&lt;T&gt;</code> (or its component interfaces) to participate in generic math algorithms — useful for units of measure, monetary types, or matrix types.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Generic Classes',
      language: 'csharp',
      code: `// Generic Stack
public class Stack<T>
{
    private readonly List<T> _items = new();

    public void Push(T item) => _items.Add(item);

    public T Pop()
    {
        if (_items.Count == 0)
            throw new InvalidOperationException("Stack is empty.");
        var top = _items[^1];
        _items.RemoveAt(_items.Count - 1);
        return top;
    }

    public T Peek() => _items.Count > 0 ? _items[^1]
        : throw new InvalidOperationException("Stack is empty.");

    public int Count => _items.Count;
}

// Usage
var stack = new Stack<int>();
stack.Push(1);
stack.Push(2);
Console.WriteLine(stack.Pop());  // 2

// Generic Repository
public interface IRepository<T> where T : class
{
    T?       GetById(int id);
    IList<T> GetAll();
    void     Add(T entity);
    void     Remove(T entity);
}

public class InMemoryRepository<T> : IRepository<T> where T : class
{
    private readonly List<T> _store = new();

    public T?       GetById(int id)  => _store.ElementAtOrDefault(id);
    public IList<T> GetAll()         => _store.AsReadOnly();
    public void     Add(T entity)    => _store.Add(entity);
    public void     Remove(T entity) => _store.Remove(entity);
}

// Multiple type parameters
public class KeyValueStore<TKey, TValue>
{
    private readonly Dictionary<TKey, TValue> _map = new();

    public void   Set(TKey key, TValue value) => _map[key!] = value;
    public TValue Get(TKey key)               => _map[key!];
    public bool   Has(TKey key)               => _map.ContainsKey(key!);
}

var store = new KeyValueStore<string, int>();
store.Set("score", 42);
Console.WriteLine(store.Get("score")); // 42`,
    },
    {
      label: 'Generic Methods',
      language: 'csharp',
      code: `// Generic Swap — T inferred from arguments
public static void Swap<T>(ref T a, ref T b)
{
    (a, b) = (b, a);  // tuple deconstruction
}

int x = 1, y = 2;
Swap(ref x, ref y);         // T inferred as int
Console.WriteLine((x, y));  // (2, 1)

// Generic Min with IComparable<T> constraint
public static T Min<T>(T a, T b) where T : IComparable<T>
    => a.CompareTo(b) <= 0 ? a : b;

Console.WriteLine(Min(3, 7));         // 3
Console.WriteLine(Min("cat", "bat")); // bat  (lexicographic)

// Generic factory method
public static T Create<T>() where T : new() => new T();

public static T CreateWith<T>(Action<T> configure) where T : new()
{
    var obj = new T();
    configure(obj);
    return obj;
}

var person = CreateWith<Person>(p => { p.Name = "Ada"; p.Age = 30; });

// Generic extension methods
public static class Extensions
{
    // Wrap a single item in IEnumerable<T>
    public static IEnumerable<T> Yield<T>(this T item)
    {
        yield return item;
    }

    // Clamp a comparable value — works for int, double, DateTime, etc.
    public static T Clamp<T>(this T value, T min, T max)
        where T : IComparable<T>
    {
        if (value.CompareTo(min) < 0) return min;
        if (value.CompareTo(max) > 0) return max;
        return value;
    }
}

int clamped = 150.Clamp(0, 100);  // 100

// default(T) — safe zero-value regardless of T
public static T? GetOrDefault<T>(T[] items, int index)
    => index >= 0 && index < items.Length ? items[index] : default;

Console.WriteLine(GetOrDefault(new[] { 1, 2, 3 }, 10)); // 0 (default int)`,
    },
    {
      label: 'Constraints',
      language: 'csharp',
      code: `// class / struct constraints
public static T? GetOrDefault<T>(IList<T> list, int index) where T : class
    => index >= 0 && index < list.Count ? list[index] : null;

// new() constraint — enables new T() inside generic body
public static T[] CreateArray<T>(int length) where T : new()
{
    var arr = new T[length];
    for (int i = 0; i < length; i++)
        arr[i] = new T();
    return arr;
}

// IComparable<T> constraint — enables comparison
public static T Max<T>(IEnumerable<T> source) where T : IComparable<T>
{
    T max = source.First();
    foreach (var item in source.Skip(1))
        if (item.CompareTo(max) > 0) max = item;
    return max;
}

// unmanaged constraint — enables pointer arithmetic
public static unsafe int SizeOf<T>() where T : unmanaged
    => sizeof(T);

Console.WriteLine(SizeOf<int>());    // 4
Console.WriteLine(SizeOf<double>()); // 8

// Multiple constraints on multiple type parameters
public static TResult Transform<TSource, TResult>(
    TSource source,
    Func<TSource, TResult> selector)
    where TSource : class
    where TResult : class, new()
{
    var result = new TResult();
    return selector(source) ?? result;
}

// INumber<T> — .NET 7+ generic math (System.Numerics)
using System.Numerics;

public static T Sum<T>(IEnumerable<T> source) where T : INumber<T>
{
    T total = T.Zero;
    foreach (var item in source)
        total += item;    // + operator via INumber<T>
    return total;
}

Console.WriteLine(Sum(new[] { 1, 2, 3, 4 }));       // 10  (int)
Console.WriteLine(Sum(new[] { 1.5, 2.5, 3.0 }));    // 7   (double)

public static T Average<T>(IEnumerable<T> source) where T : INumber<T>
{
    var list = source.ToList();
    return Sum(list) / T.CreateChecked(list.Count);
}

Console.WriteLine(Average(new[] { 10, 20, 30 }));   // 20`,
    },
    {
      label: 'Covariance / Contravariance',
      language: 'csharp',
      code: `// Setup
class Animal { public string Name { get; init; } = ""; }
class Dog    : Animal { public string Breed { get; init; } = ""; }

// Covariance — out T (IEnumerable<out T> in BCL)
IEnumerable<Dog> dogs = new List<Dog>
{
    new Dog { Name = "Rex",  Breed = "Labrador" },
    new Dog { Name = "Luna", Breed = "Poodle"   },
};

// Covariant: Dog derives from Animal → IEnumerable<Dog> fits IEnumerable<Animal>
IEnumerable<Animal> animals = dogs;   // valid ✓

foreach (var a in animals)
    Console.WriteLine(a.Name);

// List<T> is INVARIANT — this does NOT compile:
// List<Animal> list = new List<Dog>();  ← CS0266 — covariance only for out T

// Contravariance — in T (IComparer<in T> in BCL)
class AnimalComparer : IComparer<Animal>
{
    public int Compare(Animal? x, Animal? y)
        => string.Compare(x?.Name, y?.Name, StringComparison.Ordinal);
}

// Contravariant: IComparer<Animal> works for Dog (Dog IS-A Animal)
IComparer<Dog>    dogComparer    = new AnimalComparer();  // valid ✓
IComparer<Animal> animalComparer = new AnimalComparer();

var sortedDogs = dogs.OrderBy(d => d, dogComparer).ToList();

// Custom covariant interface — out T
public interface IProducer<out T>
{
    T Produce();   // T only appears as return type → safe to be covariant
}

// Custom contravariant interface — in T
public interface IConsumer<in T>
{
    void Consume(T item);  // T only appears as parameter → safe to be contravariant
}

class DogProducer : IProducer<Dog>
{
    public Dog Produce() => new Dog { Name = "Buddy", Breed = "Husky" };
}

IProducer<Dog>    dogProducer    = new DogProducer();
IProducer<Animal> animalProducer = dogProducer;  // covariance ✓
Animal produced = animalProducer.Produce();

// Practical: factory with covariant return
public interface IAnimalFactory<out T> where T : Animal
{
    T Create(string name);
}

class DogFactory : IAnimalFactory<Dog>
{
    public Dog Create(string name) => new Dog { Name = name };
}

IAnimalFactory<Animal> factory = new DogFactory(); // covariance ✓
Animal myPet = factory.Create("Charlie");`,
    },
  ];

  mistakes: CommonMistake[] = [
    {
      title: 'Trying to assign List<Dog> to List<Animal> — List<T> is invariant',
      wrong: `List<Dog> dogs = new List<Dog> { new Dog() };

// CS0266 — cannot implicitly convert List<Dog> to List<Animal>
List<Animal> animals = dogs;  // compile error!`,
      right: `// IEnumerable<T> is covariant — use it when you only need to read
IEnumerable<Animal> animals = dogs;   // OK — covariant read-only

// Or copy into a new list
List<Animal> list = dogs.Cast<Animal>().ToList();`,
      explanation: 'List<T> is invariant because it is both readable and writable. If List<Dog> could be assigned to List<Animal>, you could call list.Add(new Cat()) on it — inserting a Cat into what is actually a List<Dog>, breaking type safety. IEnumerable<T> is covariant because it is read-only (produces T, never consumes it).',
    },
    {
      title: 'Calling a member on T without a constraint — compile error',
      wrong: `// Trying to call CompareTo without constraining T
public static T Min<T>(T a, T b)
{
    return a.CompareTo(b) <= 0 ? a : b;  // CS1061: T does not contain CompareTo
}`,
      right: `// Add the constraint that enables the member call
public static T Min<T>(T a, T b) where T : IComparable<T>
{
    return a.CompareTo(b) <= 0 ? a : b;  // OK
}`,
      explanation: 'Without constraints, the compiler only knows T is object. Calling any method beyond those on object (ToString, Equals, GetHashCode) requires a constraint that proves T has that method. Add the appropriate interface constraint (IComparable<T>, IDisposable, INumber<T>, etc.) to unlock those members.',
    },
    {
      title: 'Confusing typeof(T) with GetType() in generics',
      wrong: `public static bool IsString<T>(T value)
{
    return value.GetType() == typeof(string);
    // Works, but GetType() calls a virtual method on the instance
    // and fails with NullReferenceException if value is null
}

// Also wrong: calling GetType() when you want the declared type, not the runtime type
public static void Register<T>()
{
    var t = new T().GetType();  // requires new() constraint + allocates an instance just to get the type!
}`,
      right: `// Use typeof(T) for the declared type — no instance needed, no null risk
public static bool IsString<T>()
    => typeof(T) == typeof(string);

// GetType() when you need the RUNTIME type of an existing instance
public static void LogType<T>(T value)
{
    Console.WriteLine($"Declared: {typeof(T).Name}");
    Console.WriteLine($"Runtime:  {value?.GetType().Name ?? "null"}");
}`,
      explanation: 'typeof(T) is a compile-time constant — it returns the Type for the declared type parameter, requires no instance, and cannot throw. GetType() is a virtual method called at runtime on an instance — it returns the most-derived concrete type and throws NullReferenceException on null. Use typeof(T) when you want the generic type argument; use GetType() when you want the runtime type of a specific object.',
    },
    {
      title: 'Using object instead of generics — losing type safety and boxing value types',
      wrong: `// Non-generic pair — requires casting and boxes value types
public class Pair
{
    public object First  { get; set; }
    public object Second { get; set; }
}

var p = new Pair { First = 1, Second = "hello" };
int first = (int)p.First;           // boxing + cast — runtime risk
string? bad = p.First as string;    // null — silent failure`,
      right: `// Generic pair — type-safe, no boxing for value types
public class Pair<T1, T2>
{
    public T1 First  { get; set; }
    public T2 Second { get; set; }
}

var p = new Pair<int, string> { First = 1, Second = "hello" };
int first  = p.First;   // no cast, no boxing
string sec = p.Second;  // compiler guarantees the type`,
      explanation: 'Using object as a universal container defeats type safety. Every access requires a downcast that can fail at runtime, and storing value types (int, double, bool) boxes them into heap objects — adding GC pressure in hot paths. Generics provide compile-time type enforcement and zero-cost storage for value types.',
    },
    {
      title: 'Defining too many type parameters — unreadable generic signatures',
      wrong: `// 5 type parameters — calling this is a puzzle
public static TResult Process<TInput, TKey, TIntermediate, TConfig, TResult>(
    TInput input,
    Func<TInput, TKey> keySelector,
    Func<TKey, TConfig, TIntermediate> transform,
    TConfig config,
    Func<TIntermediate, TResult> project)
{ ... }`,
      right: `// Split into smaller, focused generics or use concrete intermediate types
public static IEnumerable<TResult> SelectWithKey<TInput, TKey, TResult>(
    IEnumerable<TInput> source,
    Func<TInput, TKey> keySelector,
    Func<TInput, TKey, TResult> resultSelector)
    => source.Select(item => resultSelector(item, keySelector(item)));`,
      explanation: 'Generic signatures with 4+ type parameters are hard to read, call, and reason about. If you find yourself needing many type parameters, consider: splitting the method into smaller generics, introducing a typed intermediate record/class, or using method chaining (LINQ style) where each step adds one type parameter at most.',
    },
  ];

  quiz: QuizQuestion[] = [
    {
      q: 'Which constraint allows you to call new T() inside a generic method?',
      options: [
        'where T : class',
        'where T : struct',
        'where T : new()',
        'where T : IDisposable',
      ],
      answer: 2,
      explanation: 'The <code>new()</code> constraint guarantees T has a public parameterless constructor, enabling <code>new T()</code> in the generic body. Without it, the compiler cannot prove T is constructible that way.',
    },
    {
      q: 'What does default(T) return when T is int?',
      options: [
        'null',
        '0',
        '-1',
        'int.MinValue',
      ],
      answer: 1,
      explanation: '<code>default(T)</code> returns <code>0</code> for numeric value types, <code>false</code> for bool, all-zero bits for structs, and <code>null</code> for reference types.',
    },
    {
      q: 'Which keyword marks a type parameter as covariant (producer / read-only)?',
      options: [
        'in',
        'ref',
        'out',
        'readonly',
      ],
      answer: 2,
      explanation: '<code>out T</code> = covariance = T is only produced (returned). <code>in T</code> = contravariance = T is only consumed (parameter). Remember: <strong>out = producer = can widen</strong>.',
    },
    {
      q: 'When should you prefer a generic method over a generic class?',
      options: [
        'When you need multiple type parameters',
        'When only one method needs the type parameter',
        'When the type must be a value type',
        'When you need covariance',
      ],
      answer: 1,
      explanation: 'If only one method needs the type parameter, making just that method generic keeps the class simpler and avoids propagating the type parameter to all callers of the class.',
    },
    {
      q: 'Why can you assign IEnumerable<Dog> to IEnumerable<Animal>, but NOT List<Dog> to List<Animal>?',
      options: [
        'List<T> does not support generics internally',
        'IEnumerable<T> is declared as IEnumerable<out T> (covariant); List<T> is invariant because it is both readable and writable',
        'Dog must explicitly inherit from Animal in the generic context',
        'This is a C# compiler bug',
      ],
      answer: 1,
      explanation: '<code>IEnumerable&lt;T&gt;</code> is declared with <code>out T</code> — it only produces T values. <code>List&lt;T&gt;</code> is invariant because it also accepts T (has Add, Insert, etc.). If you could assign <code>List&lt;Dog&gt;</code> to <code>List&lt;Animal&gt;</code>, calling <code>list.Add(new Cat())</code> would insert a Cat into a Dogs-only list — a type safety violation.',
    },
    {
      q: 'What does INumber<T> enable in .NET 7+?',
      options: [
        'Runtime reflection over numeric types',
        'A way to convert any type to int',
        'Generic algorithms that use arithmetic operators (+, -, *, /) across any numeric type without overloads',
        'Automatic SIMD vectorisation of generic loops',
      ],
      answer: 2,
      explanation: '<code>INumber&lt;T&gt;</code> (System.Numerics) is a static abstract interface exposing arithmetic operators, constants (<code>T.Zero</code>, <code>T.One</code>), and parsing. A single generic method constrained to <code>where T : INumber&lt;T&gt;</code> works for int, double, decimal, and any custom numeric type — replacing many per-type overloads.',
    },
    {
      q: 'What is the difference between typeof(T) and GetType() in a generic method?',
      options: [
        'They are identical in all cases',
        'typeof(T) returns the declared type parameter at compile time; GetType() is called on an instance at runtime and returns the concrete runtime type',
        'typeof(T) requires a constraint; GetType() does not',
        'GetType() works on value types; typeof(T) only works on reference types',
      ],
      answer: 1,
      explanation: '<code>typeof(T)</code> is a compile-time constant — no instance required, cannot throw. <code>GetType()</code> is a virtual method on an instance that returns the most-derived runtime type and throws <code>NullReferenceException</code> on null. In a generic method, <code>typeof(T)</code> gives you the declared type argument; <code>GetType()</code> gives you the concrete type of the specific object passed in.',
    },
  ];

  qna: QnaItem[] = [
    {
      q: 'Why not just use object instead of generics?',
      a: '<strong>Boxing and type safety.</strong> When a value type (e.g. <code>int</code>) is stored as <code>object</code>, the CLR allocates a heap object — that is boxing. Reading it back requires an unsafe downcast that can throw <code>InvalidCastException</code> at runtime. Generics eliminate boxing entirely: a <code>List&lt;int&gt;</code> stores ints directly without wrapping them in objects. The compiler also catches type errors at compile time, not runtime.',
    },
    {
      q: 'Can generic types be inferred automatically?',
      a: 'Yes — the C# compiler infers type arguments from the method\'s parameters. <code>Swap(ref a, ref b)</code> infers <code>T = int</code> if <code>a</code> and <code>b</code> are ints; you do not need to write <code>Swap&lt;int&gt;(ref a, ref b)</code>. Inference works for methods but <strong>not for classes</strong> — you must write <code>new Stack&lt;int&gt;()</code> explicitly (though C# 9+ target-typed <code>new()</code> can help in some contexts).',
    },
    {
      q: 'What is INumber<T> and when do I need it?',
      a: '<code>INumber&lt;T&gt;</code> is a .NET 7+ interface in <code>System.Numerics</code> that abstracts arithmetic operations (+, -, *, /), comparison, and constants across numeric types (int, double, decimal, etc.). Use it when you want a generic method that does math: <code>T Sum&lt;T&gt;(IEnumerable&lt;T&gt; src) where T : INumber&lt;T&gt;</code> works for int, double, decimal — all in one implementation. Before .NET 7 you had to write overloads or use <code>dynamic</code>.',
    },
    {
      q: 'When do I actually need constraints?',
      a: 'You need constraints whenever you call a member on <code>T</code> that is not on <code>object</code>. Examples: calling <code>CompareTo()</code> → <code>where T : IComparable&lt;T&gt;</code>; writing <code>new T()</code> → <code>where T : new()</code>; using arithmetic → <code>where T : INumber&lt;T&gt;</code>; calling <code>Dispose()</code> → <code>where T : IDisposable</code>. Without a constraint the compiler only knows T is <code>object</code> and will reject calls to any other member.',
    },
    {
      q: 'What is the difference between covariance (out) and contravariance (in)?',
      a: 'Covariance (<code>out T</code>) means T flows <em>out</em> of the interface (returned values). You can treat <code>IProducer&lt;Dog&gt;</code> as <code>IProducer&lt;Animal&gt;</code> because a producer of dogs is certainly a producer of animals. Contravariance (<code>in T</code>) means T flows <em>in</em> (consumed as a parameter). You can treat <code>IComparer&lt;Animal&gt;</code> as <code>IComparer&lt;Dog&gt;</code> because anything that can compare animals can compare dogs. Variance only applies to interfaces and delegates, not classes.',
    },
    {
      q: 'How does the JIT handle generic specialisation for value types vs reference types?',
      a: 'The JIT generates one specialised native code instance per <em>value type</em> instantiation: <code>Stack&lt;int&gt;</code>, <code>Stack&lt;double&gt;</code>, and <code>Stack&lt;long&gt;</code> each get their own compiled code, which means no boxing and optimal layout. All <em>reference type</em> instantiations (<code>Stack&lt;string&gt;</code>, <code>Stack&lt;object&gt;</code>) share a single compiled version (they all have the same pointer size). This is why <code>List&lt;int&gt;</code> outperforms <code>ArrayList</code> for int storage — no boxing, better cache locality.',
    },
    {
      q: 'Can I create a generic method that handles both nullable reference and value types?',
      a: 'Yes. Use <code>T?</code> as the return type and either no constraint or a combined constraint. For methods that should return null on failure: if you want it to work for both <code>string?</code> and <code>int?</code>, you need two overloads or a <code>where T : class</code> version plus a <code>where T : struct</code> version returning <code>T?</code> (nullable value type). Alternatively, return a <code>Result&lt;T&gt;</code> / <code>Option&lt;T&gt;</code> wrapper that works for all types without relying on null.',
    },
  ];

  challenge: Challenge = {
    title: 'Generic Result<T> Monad',
    language: 'csharp',
    description: 'Implement a generic Result<T> type that represents either a successful value or a failure with an error message. Add Map (transform the value if successful) and Bind (chain operations that can also fail) methods using generics and constraints.',
    hints: [
      'Use a private constructor and static factory methods Success(T value) and Failure(string error).',
      'Map<TOut> takes a Func<T, TOut> and returns Result<TOut> — apply it only if IsSuccess.',
      'Bind<TOut> takes a Func<T, Result<TOut>> and chains — propagate the error if already failed.',
      'Override ToString() to show "Ok(value)" or "Err(message)" for easy debugging.',
    ],
    starterCode: `public class Result<T>
{
    // TODO: add IsSuccess, Value, Error properties

    // TODO: static factory methods
    // public static Result<T> Success(T value) { ... }
    // public static Result<T> Failure(string error) { ... }

    // TODO: Map — transform value if successful
    // public Result<TOut> Map<TOut>(Func<T, TOut> transform) { ... }

    // TODO: Bind — chain operations that can also fail
    // public Result<TOut> Bind<TOut>(Func<T, Result<TOut>> next) { ... }
}

// Usage target:
// var result = Result<int>.Success(42)
//                         .Map(x => x * 2)
//                         .Bind(x => x > 50
//                             ? Result<string>.Success($"Large: {x}")
//                             : Result<string>.Failure("Too small"));`,
    solution: `public class Result<T>
{
    public bool   IsSuccess { get; }
    public T?     Value     { get; }
    public string Error     { get; }

    private Result(bool success, T? value, string error)
    {
        IsSuccess = success;
        Value     = value;
        Error     = error;
    }

    // Factory methods
    public static Result<T> Success(T value)    => new(true,  value,   string.Empty);
    public static Result<T> Failure(string err) => new(false, default, err);

    // Map — transform value, propagate failure
    public Result<TOut> Map<TOut>(Func<T, TOut> transform)
    {
        if (!IsSuccess) return Result<TOut>.Failure(Error);
        try
        {
            return Result<TOut>.Success(transform(Value!));
        }
        catch (Exception ex)
        {
            return Result<TOut>.Failure(ex.Message);
        }
    }

    // Bind — chain operations that can also fail
    public Result<TOut> Bind<TOut>(Func<T, Result<TOut>> next)
    {
        if (!IsSuccess) return Result<TOut>.Failure(Error);
        return next(Value!);
    }

    public T GetValueOrDefault(T fallback) => IsSuccess ? Value! : fallback;

    public override string ToString()
        => IsSuccess ? $"Ok({Value})" : $"Err({Error})";
}

// Usage
var result = Result<int>.Success(42)
                        .Map(x => x * 2)              // Ok(84)
                        .Bind(x => x > 50
                            ? Result<string>.Success($"Large: {x}")
                            : Result<string>.Failure("Too small"));

Console.WriteLine(result);  // Ok(Large: 84)

var failed = Result<int>.Failure("not found")
                        .Map(x => x * 2)              // still Err(not found)
                        .Bind(x => Result<string>.Success(x.ToString()));

Console.WriteLine(failed);  // Err(not found)`,
  };

  revision: RevisionSummary = {
    oneLiner: 'Generics = one implementation, any type. Constraints unlock members on T. Covariance (out) for producers, contravariance (in) for consumers. INumber<T> for generic math. default(T) for zero-values.',
    mustKnow: [
      'Generics eliminate boxing for value types (JIT specialises per value type) and catch type errors at compile time instead of runtime.',
      'Constraints: <code>class</code>/<code>struct</code> for category; <code>new()</code> for constructable; <code>IComparable&lt;T&gt;</code> for ordering; <code>unmanaged</code> for pointer-safe; <code>INumber&lt;T&gt;</code> for arithmetic.',
      'Covariance (<code>out T</code>): T flows out — <code>IEnumerable&lt;Dog&gt;</code> → <code>IEnumerable&lt;Animal&gt;</code>. Contravariance (<code>in T</code>): T flows in — <code>IComparer&lt;Animal&gt;</code> → <code>IComparer&lt;Dog&gt;</code>. Classes are invariant.',
      '<code>List&lt;T&gt;</code> is invariant (read+write). <code>IEnumerable&lt;T&gt;</code> is covariant (read-only). Trying to assign <code>List&lt;Dog&gt;</code> to <code>List&lt;Animal&gt;</code> is a compile error.',
      '<code>default(T)</code>: zero for value types, null for reference types. No instance needed.',
      '<code>typeof(T)</code>: compile-time Type object for the declared type parameter. <code>GetType()</code>: runtime type of a specific instance.',
      '<code>INumber&lt;T&gt;</code> (.NET 7+): enables one generic algorithm to work across all numeric types using operators and constants like <code>T.Zero</code>.',
    ],
    interviewFocus: [
      'Why do generics avoid boxing for value types? (JIT generates a per-value-type specialisation — no object wrapping)',
      'What is the difference between covariant (out) and contravariant (in)? (out: T produced/returned — safe to widen; in: T consumed/parameter — safe to narrow)',
      'Why can\'t you assign List<Dog> to List<Animal>? (List<T> is invariant — Add(new Cat()) would violate type safety)',
      'What does typeof(T) return vs GetType()? (typeof: compile-time declared type; GetType: runtime type of instance)',
      'What is INumber<T> used for? (generic math — one Sum/Average implementation for all numeric types via static abstract operators)',
    ],
  };
}
