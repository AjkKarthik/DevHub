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
  selector: 'app-csharp-generics',
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
  templateUrl: './generics.html',
  styleUrl: './generics.scss',
})
export class CsharpGenerics {

  quickRef: QuickRefItem[] = [
    { name: 'where T : class',       type: 'constraint', desc: 'Restricts T to reference types (classes, interfaces, delegates, arrays).' },
    { name: 'where T : new()',        type: 'constraint', desc: 'Requires T to have a public parameterless constructor — enables new T().' },
    { name: 'where T : IComparable<T>', type: 'constraint', desc: 'Allows calling CompareTo() on instances of T for ordering.' },
    { name: 'INumber<T>',             type: 'interface',  desc: '.NET 7+ interface that enables arithmetic operators (+, -, *, /) on generic T.', since: '7' },
    { name: 'default(T)',             type: 'keyword',    desc: 'Returns null for reference types and zero/false for value types.' },
    { name: 'typeof(T)',              type: 'operator',   desc: 'Returns the System.Type object representing T at runtime.' },
    { name: 'in T',                   type: 'keyword',    desc: 'Contravariance — T is consumed (write-only). Allows assigning IFoo<Base> to IFoo<Derived>.' },
    { name: 'out T',                  type: 'keyword',    desc: 'Covariance — T is produced (read-only). Allows assigning IFoo<Derived> to IFoo<Base>.' },
  ];

  theory: TheoryPoint[] = [
    {
      heading: 'Type safety without casting',
      points: [
        'Generics let you write type-safe code once and reuse it for any type — the compiler enforces correctness at compile time.',
        'Without generics you would use <code>object</code>, requiring boxing (value → object) and unboxing (object → value) which has a runtime cost.',
        'A generic <code>List&lt;T&gt;</code> stores items as their actual type; a non-generic <code>ArrayList</code> stores them as <code>object</code>, causing boxing and unsafe casts.',
        'Type errors caught at compile time (e.g. <code>Stack&lt;int&gt;</code> refuses a string) rather than at runtime via <code>InvalidCastException</code>.',
      ],
    },
    {
      heading: 'Type constraints',
      points: [
        '<code>where T : class</code> restricts T to reference types; <code>where T : struct</code> restricts to value types.',
        '<code>where T : new()</code> allows you to write <code>new T()</code> inside the generic method or class body.',
        '<code>where T : IComparable&lt;T&gt;</code> unlocks <code>CompareTo()</code> — needed for sorting, min/max, and comparison algorithms.',
        'Multiple constraints can be combined: <code>where T : class, new(), IDisposable</code> — all must be satisfied.',
        '<code>where T : unmanaged</code> restricts to blittable value types with no managed references — enables unsafe pointer arithmetic.',
      ],
    },
    {
      heading: 'Covariance and contravariance',
      points: [
        '<code>out T</code> (covariance) means T is only produced (returned). You can assign <code>IEnumerable&lt;Dog&gt;</code> to <code>IEnumerable&lt;Animal&gt;</code>.',
        '<code>in T</code> (contravariance) means T is only consumed (parameter). You can assign <code>IComparer&lt;Animal&gt;</code> to <code>IComparer&lt;Dog&gt;</code>.',
        'Only interfaces and delegates support variance annotations — classes and structs do not.',
        'A common mnemonic: <strong>out = covariant = producer = read-only</strong>; <strong>in = contravariant = consumer = write-only</strong>.',
      ],
    },
    {
      heading: 'Generic methods vs generic classes',
      points: [
        'Prefer a generic method when only one method needs the type parameter — keeps the class non-generic and simpler.',
        'Use a generic class when state must be typed (e.g. <code>Repository&lt;T&gt;</code>, <code>Stack&lt;T&gt;</code>, <code>Cache&lt;TKey, TValue&gt;</code>).',
        'Type parameters on methods are inferred from arguments: <code>Swap(ref a, ref b)</code> — no need to write <code>Swap&lt;int&gt;(ref a, ref b)</code>.',
        'A generic class can have non-generic methods, and a non-generic class can have generic methods — they are orthogonal.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Generic Classes',
      language: 'csharp',
      code: `// ── Generic Stack ────────────────────────────────────────────────────────────
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

// ── Generic Repository ────────────────────────────────────────────────────────
public interface IRepository<T> where T : class
{
    T?           GetById(int id);
    IList<T>     GetAll();
    void         Add(T entity);
    void         Remove(T entity);
}

public class InMemoryRepository<T> : IRepository<T> where T : class
{
    private readonly List<T> _store = new();

    public T?       GetById(int id)    => _store.ElementAtOrDefault(id);
    public IList<T> GetAll()           => _store.AsReadOnly();
    public void     Add(T entity)      => _store.Add(entity);
    public void     Remove(T entity)   => _store.Remove(entity);
}

// ── Multiple type parameters ──────────────────────────────────────────────────
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
      code: `// ── Generic Swap ─────────────────────────────────────────────────────────────
public static void Swap<T>(ref T a, ref T b)
{
    (a, b) = (b, a);  // tuple deconstruction
}

int x = 1, y = 2;
Swap(ref x, ref y);        // T inferred as int
Console.WriteLine(x, y);   // 2, 1

// ── Generic Min with constraint ───────────────────────────────────────────────
public static T Min<T>(T a, T b) where T : IComparable<T>
    => a.CompareTo(b) <= 0 ? a : b;

Console.WriteLine(Min(3, 7));       // 3
Console.WriteLine(Min("cat", "bat")); // bat  (lexicographic)

// ── Generic factory method ────────────────────────────────────────────────────
public static T Create<T>() where T : new()
    => new T();

public static T CreateWith<T>(Action<T> configure) where T : new()
{
    var obj = new T();
    configure(obj);
    return obj;
}

var person = CreateWith<Person>(p => { p.Name = "Ada"; p.Age = 30; });

// ── Generic extension method ──────────────────────────────────────────────────
public static class Extensions
{
    // Null-safe single-item enumerable
    public static IEnumerable<T> Yield<T>(this T item)
    {
        yield return item;
    }

    // Clamp a comparable value
    public static T Clamp<T>(this T value, T min, T max)
        where T : IComparable<T>
    {
        if (value.CompareTo(min) < 0) return min;
        if (value.CompareTo(max) > 0) return max;
        return value;
    }
}

int clamped = 150.Clamp(0, 100);  // 100`,
    },
    {
      label: 'Constraints',
      language: 'csharp',
      code: `// ── class / struct constraints ───────────────────────────────────────────────
public static T? GetOrDefault<T>(IList<T> list, int index) where T : class
    => index >= 0 && index < list.Count ? list[index] : null;

// ── new() constraint ──────────────────────────────────────────────────────────
public static T[] CreateArray<T>(int length) where T : new()
{
    var arr = new T[length];
    for (int i = 0; i < length; i++)
        arr[i] = new T();       // only possible with new() constraint
    return arr;
}

// ── IComparable<T> constraint ─────────────────────────────────────────────────
public static T Max<T>(IEnumerable<T> source) where T : IComparable<T>
{
    T max = source.First();
    foreach (var item in source.Skip(1))
        if (item.CompareTo(max) > 0) max = item;
    return max;
}

// ── unmanaged constraint ──────────────────────────────────────────────────────
public static unsafe int SizeOf<T>() where T : unmanaged
    => sizeof(T);

Console.WriteLine(SizeOf<int>());    // 4
Console.WriteLine(SizeOf<double>()); // 8

// ── Multiple constraints ──────────────────────────────────────────────────────
public static TResult Transform<TSource, TResult>(
    TSource source,
    Func<TSource, TResult> selector)
    where TSource : class
    where TResult : class, new()
{
    var result = new TResult();
    return selector(source) ?? result;
}

// ── INumber<T> — .NET 7+ generic math ────────────────────────────────────────
using System.Numerics;

public static T Sum<T>(IEnumerable<T> source) where T : INumber<T>
{
    T total = T.Zero;
    foreach (var item in source)
        total += item;
    return total;
}

Console.WriteLine(Sum(new[] { 1, 2, 3, 4 }));          // 10  (int)
Console.WriteLine(Sum(new[] { 1.5, 2.5, 3.0 }));       // 7   (double)`,
    },
    {
      label: 'Covariance / Contravariance',
      language: 'csharp',
      code: `// ── Setup ────────────────────────────────────────────────────────────────────
class Animal { public string Name { get; init; } = ""; }
class Dog : Animal { public string Breed { get; init; } = ""; }

// ── Covariance — out T (IEnumerable<out T>) ───────────────────────────────────
// IEnumerable<T> is declared as IEnumerable<out T> in the BCL.
IEnumerable<Dog> dogs = new List<Dog>
{
    new Dog { Name = "Rex",  Breed = "Labrador" },
    new Dog { Name = "Luna", Breed = "Poodle"   },
};

// Covariant: Dog derives from Animal, so IEnumerable<Dog> fits IEnumerable<Animal>
IEnumerable<Animal> animals = dogs;   // valid ✓

foreach (var a in animals)
    Console.WriteLine(a.Name);

// ── Contravariance — in T (IComparer<in T>) ───────────────────────────────────
class AnimalComparer : IComparer<Animal>
{
    public int Compare(Animal? x, Animal? y)
        => string.Compare(x?.Name, y?.Name, StringComparison.Ordinal);
}

// Contravariant: IComparer<Animal> works for Dog (Dog IS-A Animal)
IComparer<Dog>    dogComparer    = new AnimalComparer();  // valid ✓
IComparer<Animal> animalComparer = new AnimalComparer();

var sortedDogs = dogs.OrderBy(d => d, dogComparer).ToList();

// ── Custom covariant interface ────────────────────────────────────────────────
public interface IProducer<out T>
{
    T Produce();   // T only appears as return type → covariant
}

public interface IConsumer<in T>
{
    void Consume(T item);  // T only appears as parameter → contravariant
}

class DogProducer : IProducer<Dog>
{
    public Dog Produce() => new Dog { Name = "Buddy", Breed = "Husky" };
}

IProducer<Dog>    dogProducer    = new DogProducer();
IProducer<Animal> animalProducer = dogProducer;  // covariance ✓
Animal produced = animalProducer.Produce();

// ── Practical: return type widening with covariance ───────────────────────────
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

  quiz: QuizQuestion[] = [
    {
      q: 'Which constraint allows you to call `new T()` inside a generic method?',
      options: [
        'where T : class',
        'where T : struct',
        'where T : new()',
        'where T : IDisposable',
      ],
      answer: 2,
      explanation: 'The new() constraint guarantees T has a public parameterless constructor, enabling new T() in the generic body.',
    },
    {
      q: 'What does `default(T)` return when T is `int`?',
      options: [
        'null',
        '0',
        '-1',
        'int.MinValue',
      ],
      answer: 1,
      explanation: 'default(T) returns 0 for numeric value types, false for bool, and null for reference types.',
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
      explanation: 'out T = covariance = T is only produced (returned). in T = contravariance = T is only consumed (parameter).',
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
      explanation: 'If only one method needs the type parameter, making just that method generic keeps the class simpler and avoids unnecessary type parameter propagation.',
    },
  ];

  qna: QnaItem[] = [
    {
      q: 'Why not just use object instead of generics?',
      a: `<strong>Boxing and unboxing cost.</strong> When a value type (e.g. <code>int</code>) is stored as <code>object</code>, the CLR
          allocates a heap object — that's boxing. Reading it back requires an unsafe downcast — that's unboxing.
          Both operations are slower and can throw <code>InvalidCastException</code> at runtime.<br><br>
          Generics eliminate boxing entirely: a <code>List&lt;int&gt;</code> stores ints directly on the heap as ints.
          The compiler also catches type errors at compile time, not runtime.`,
    },
    {
      q: 'Can generic types be inferred automatically?',
      a: `Yes — the C# compiler infers type arguments from the method's parameters.
          <code>Swap(ref a, ref b)</code> infers <code>T = int</code> if <code>a</code> and <code>b</code> are ints;
          you don't need to write <code>Swap&lt;int&gt;(ref a, ref b)</code>.<br><br>
          Inference works for methods but <strong>not for classes</strong> — you must write <code>new Stack&lt;int&gt;()</code>
          explicitly (though C# 9+ target-typed <code>new()</code> can help in some contexts).`,
    },
    {
      q: 'What is INumber<T> and when do I need it?',
      a: `<code>INumber&lt;T&gt;</code> is a .NET 7+ interface in <code>System.Numerics</code> that abstracts arithmetic
          operations (+, -, *, /) across numeric types (int, double, decimal, etc.).<br><br>
          Use it when you want a generic method that does math:
          <code>T Sum&lt;T&gt;(IEnumerable&lt;T&gt; src) where T : INumber&lt;T&gt;</code>
          works for int, double, decimal — all in one implementation.
          Before .NET 7 you had to write overloads or use dynamic.`,
    },
    {
      q: 'When do I actually need constraints?',
      a: `You need constraints whenever you call a member on <code>T</code> that is not on <code>object</code>.<br><br>
          <ul>
            <li>Calling <code>CompareTo()</code> → <code>where T : IComparable&lt;T&gt;</code></li>
            <li>Writing <code>new T()</code> → <code>where T : new()</code></li>
            <li>Using arithmetic → <code>where T : INumber&lt;T&gt;</code></li>
            <li>Calling <code>Dispose()</code> → <code>where T : IDisposable</code></li>
          </ul>
          Without a constraint the compiler only knows T is <code>object</code> and will reject calls to any other member.`,
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
//                             : Result<string>.Failure("Too small"));
`,
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

    // ── Factory methods ───────────────────────────────────────────────────────
    public static Result<T> Success(T value)   => new(true,  value,  string.Empty);
    public static Result<T> Failure(string err) => new(false, default, err);

    // ── Map — transform value, propagate failure ──────────────────────────────
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

    // ── Bind — chain operations that can also fail ────────────────────────────
    public Result<TOut> Bind<TOut>(Func<T, Result<TOut>> next)
    {
        if (!IsSuccess) return Result<TOut>.Failure(Error);
        return next(Value!);
    }

    // ── Convenience ───────────────────────────────────────────────────────────
    public T GetValueOrDefault(T fallback) => IsSuccess ? Value! : fallback;

    public override string ToString()
        => IsSuccess ? $"Ok({Value})" : $"Err({Error})";
}

// ── Usage ─────────────────────────────────────────────────────────────────────
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
}
