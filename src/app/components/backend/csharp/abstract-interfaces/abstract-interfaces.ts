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
  selector: 'app-csharp-abstract-interfaces',
  standalone: true,
  imports: [
    CommonModule, CodeBlockComponent, TheoryBlockComponent, QnaBlockComponent,
    QuizBlockComponent, ChallengeBlockComponent, QuickRefComponent,
    PageMetaComponent, PageCompleteComponent,
    CommonMistakesComponent, RevisionCardComponent,
  ],
  templateUrl: './abstract-interfaces.html',
  styleUrl: './abstract-interfaces.scss',
})
export class CsharpAbstractInterfaces {

  quickRef: QuickRefItem[] = [
    { name: 'abstract class',         type: 'keyword',    desc: 'Cannot be instantiated — defines shared state and forces subclasses to implement abstract members' },
    { name: 'abstract method',        type: 'keyword',    desc: 'No body in the base — every non-abstract derived class MUST override it' },
    { name: 'interface',              type: 'interface',  desc: 'Pure contract — no instance fields, supports multiple implementation on one class' },
    { name: 'default impl (C# 8)',    type: 'syntax',     desc: 'Interface members can have a default body — existing implementors are unaffected' },
    { name: 'explicit impl',          type: 'syntax',     desc: 'IFoo.Method() syntax — resolves naming conflicts, hides the member from direct access' },
    { name: 'static abstract (C# 11)',type: 'syntax',     desc: 'Interface can declare static abstract members — used for generic math operators and factory methods' },
    { name: 'IComparable<T>',         type: 'interface',  desc: 'Single-method contract for natural ordering — CompareTo returns negative/zero/positive' },
    { name: 'IEquatable<T>',          type: 'interface',  desc: 'Strongly-typed Equals(T) — avoids boxing for value types' },
    { name: 'IDisposable',            type: 'interface',  desc: 'Dispose() pattern — clean up unmanaged resources; enables using statement' },
    { name: 'IEnumerable<T>',         type: 'interface',  desc: 'Makes a type iterable with foreach and LINQ' },
    { name: 'where T : IFoo',         type: 'constraint', desc: 'Generic constraint — ensures T implements the interface, unlocking its members' },
  ];

  theory: TheoryPoint[] = [
    {
      heading: 'Abstract classes — shared base with enforced contract',
      points: [
        'An <code>abstract class</code> cannot be instantiated directly — <code>new DataExporter()</code> is a compile error. It exists to be subclassed.',
        'It can contain fully-implemented ("concrete") members — fields, properties, constructors, methods — that all derived classes inherit without duplicating code.',
        '<code>abstract</code> members have <em>no body</em> in the abstract class. Every non-abstract derived class <strong>must</strong> provide an implementation with <code>override</code>.',
        'This is the <em>Template Method</em> pattern in action: the abstract class defines the algorithm skeleton with a concrete public method; derived classes fill in the variable steps via abstract/virtual members.',
        'Abstract classes <em>do</em> have constructors — called via <code>: base()</code> chaining when a derived class is instantiated. Use them to enforce required initialisation across all subclasses.',
      ],
    },
    {
      heading: 'Interfaces — pure contracts',
      points: [
        'An interface specifies <em>what</em> a type can do, with no instance state (no instance fields or constructors). It is a pure capability contract.',
        'Traditionally all members are implicitly <code>public abstract</code>. Since C# 8, default method implementations are allowed (see next section).',
        'A class can implement <strong>multiple</strong> interfaces: <code>class Foo : IBar, IBaz, IQux</code> — this is how C# delivers the multi-inheritance-of-behaviour pattern.',
        'Coding against interfaces enables <em>Dependency Inversion</em> — your classes depend on abstractions, not concretions — making them easy to test and swap via DI containers.',
        'By convention, interface names start with <code>I</code>: <code>ILogger</code>, <code>IRepository&lt;T&gt;</code>, <code>IDisposable</code>. Prefer small, focused interfaces (Interface Segregation Principle).',
      ],
    },
    {
      heading: 'Default interface methods (C# 8+)',
      points: [
        'An interface can now include a method body as the default implementation: <code>void LogInfo(string msg) =&gt; Log("INFO", msg);</code>.',
        'Existing classes that already implement the interface are <strong>not required</strong> to provide their own implementation — they inherit the default through the interface reference.',
        'This enables adding new members to a published interface without breaking all existing implementors — an "interface evolution" mechanism critical for library authors.',
        'Default implementations are only callable through an <em>interface-typed</em> reference — they are not members of the class and do not appear on a class-typed variable.',
        'Default methods can access other interface members but cannot access instance fields of the implementing class (the interface has no instance state of its own).',
      ],
    },
    {
      heading: 'Explicit interface implementation',
      points: [
        'When two interfaces declare a member with the same name, use <em>explicit implementation</em> to provide separate implementations: <code>void IFoo.Method() { }</code> and <code>void IBar.Method() { }</code>.',
        'Explicitly-implemented members are only accessible through an interface-typed reference — they are hidden from the class\'s direct public API, which keeps the primary surface clean.',
        'This is used intentionally to hide "infrastructure" members: the BCL hides <code>IDisposable.Dispose</code> in favour of public <code>Close()</code> methods on stream classes.',
        'You can combine explicit and public implementations: a class can expose a friendly <code>public string Greet()</code> while also satisfying <code>IEnglishGreeter.Greet()</code> and <code>IFrenchGreeter.Greet()</code> separately.',
        'Explicit interface implementation also prevents accidental polymorphic use — callers must consciously cast to the interface to call the hidden member.',
      ],
    },
    {
      heading: 'When to choose interface vs abstract class',
      points: [
        'Use an <strong>interface</strong> when you want a capability contract that unrelated types can implement (<code>IDisposable</code>, <code>IComparable&lt;T&gt;</code>), or when you need multiple contracts on one class.',
        'Use an <strong>abstract class</strong> when derived types genuinely share state (fields) or non-trivial shared behaviour, and when a single base is sufficient.',
        'Prefer interface + composition over deep abstract hierarchies — code evolves more safely and each piece remains independently testable.',
        'You can combine both: implement an interface in an abstract base, providing default implementations that derived classes can optionally refine — a common pattern in framework base classes.',
        'The rule of thumb: if you find yourself duplicating fields or constructor logic across implementations, an abstract class is the right tool. If you just need a contract, use an interface.',
      ],
    },
    {
      heading: 'Static abstract members in interfaces (C# 11+)',
      points: [
        'C# 11 added <code>static abstract</code> and <code>static virtual</code> interface members — the interface can define a static contract that implementing types must satisfy.',
        'The primary use case is <em>Generic Math</em>: <code>interface IAddable&lt;T&gt; where T : IAddable&lt;T&gt; { static abstract T operator +(T a, T b); }</code> lets you write generic algorithms over numeric types.',
        'The constraint <code>where T : INumber&lt;T&gt;</code> (from <code>System.Numerics</code>) gives generics access to arithmetic operators — previously impossible without reflection or expression trees.',
        'Static interface members are called on the type directly, not on an instance: <code>T.Zero</code>, <code>T.Parse(s, …)</code>, <code>T.operator +(a, b)</code> — only valid inside a generic method constrained to that interface.',
        'This feature underpins .NET 7+ generic math APIs (<code>INumber&lt;T&gt;</code>, <code>IAdditionOperators&lt;T,T,T&gt;</code>, etc.) and eliminates the need for separate overloads for each numeric type.',
      ],
    },
    {
      heading: 'Common BCL interfaces worth knowing',
      points: [
        '<code>IComparable&lt;T&gt;</code> — implement <code>CompareTo(T)</code> to give your type a natural sort order. Used by <code>Array.Sort</code>, <code>List&lt;T&gt;.Sort</code>, and LINQ <code>OrderBy</code>.',
        '<code>IEquatable&lt;T&gt;</code> — implement <code>Equals(T)</code> for strongly-typed equality. Avoids boxing for structs and must always be paired with a matching <code>GetHashCode()</code>.',
        '<code>IDisposable</code> / <code>IAsyncDisposable</code> — implement <code>Dispose()</code> or <code>DisposeAsync()</code> to release unmanaged resources. Enables <code>using</code> and <code>await using</code> blocks.',
        '<code>IEnumerable&lt;T&gt;</code> / <code>IAsyncEnumerable&lt;T&gt;</code> — implement <code>GetEnumerator()</code> to make your type iterable with <code>foreach</code> and LINQ, or <code>await foreach</code> for async streams.',
        '<code>IFormattable</code>, <code>IParsable&lt;T&gt;</code> (C# 11), <code>ISpanFormattable</code> — extended contracts for formatting and parsing; used heavily in .NET 7+ generic math and logging frameworks.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Abstract class',
      language: 'csharp',
      code: `// Abstract class — Template Method pattern
public abstract class DataExporter
{
    // Concrete field — shared by all exporters
    protected readonly string OutputPath;

    protected DataExporter(string outputPath) => OutputPath = outputPath;

    // Concrete method — algorithm skeleton (not overridable)
    public void Export(IEnumerable<object> data)
    {
        var prepared = PrepareData(data);      // abstract step
        var content  = Serialise(prepared);    // abstract step
        WriteToOutput(content);                // concrete step (shared)
        OnExportComplete();                    // virtual hook — optional override
    }

    // Abstract — every derived exporter MUST implement these
    protected abstract IEnumerable<object> PrepareData(IEnumerable<object> raw);
    protected abstract string Serialise(IEnumerable<object> prepared);

    // Concrete — shared implementation
    protected void WriteToOutput(string content)
        => File.WriteAllText(OutputPath, content);

    // Virtual hook — derived classes may optionally override
    protected virtual void OnExportComplete()
        => Console.WriteLine($"Export complete: {OutputPath}");
}

public class CsvExporter : DataExporter
{
    public CsvExporter(string path) : base(path) { }

    protected override IEnumerable<object> PrepareData(IEnumerable<object> raw)
        => raw.Where(r => r is not null);

    protected override string Serialise(IEnumerable<object> data)
        => string.Join("\\n", data.Select(d => d?.ToString() ?? ""));

    protected override void OnExportComplete()
    {
        base.OnExportComplete();             // call base hook too
        Console.WriteLine("CSV rows written.");
    }
}

public class JsonExporter : DataExporter
{
    public JsonExporter(string path) : base(path) { }

    protected override IEnumerable<object> PrepareData(IEnumerable<object> raw)
        => raw.OfType<IDictionary<string, object>>();

    protected override string Serialise(IEnumerable<object> data)
        => System.Text.Json.JsonSerializer.Serialize(data);
}

// Usage
DataExporter exporter = new CsvExporter("/tmp/out.csv");
exporter.Export(["Alice", "Bob", null, "Carol"]);`,
    },
    {
      label: 'Interfaces & multiple impl',
      language: 'csharp',
      code: `// Two separate capability interfaces
public interface IReadable<T>
{
    Task<T?> ReadAsync(int id, CancellationToken ct = default);
    Task<IReadOnlyList<T>> ReadAllAsync(CancellationToken ct = default);
}

public interface IWritable<T>
{
    Task WriteAsync(T item, CancellationToken ct = default);
    Task DeleteAsync(int id, CancellationToken ct = default);
}

// Composite interface — combines both
public interface IRepository<T> : IReadable<T>, IWritable<T> { }

// One class satisfies all three interfaces
public class InMemoryRepository<T> : IRepository<T> where T : class
{
    private readonly List<T> _store = [];

    public Task<T?> ReadAsync(int id, CancellationToken ct = default)
        => Task.FromResult(_store.ElementAtOrDefault(id));

    public Task<IReadOnlyList<T>> ReadAllAsync(CancellationToken ct = default)
        => Task.FromResult<IReadOnlyList<T>>(_store.AsReadOnly());

    public Task WriteAsync(T item, CancellationToken ct = default)
    {
        _store.Add(item);
        return Task.CompletedTask;
    }

    public Task DeleteAsync(int id, CancellationToken ct = default)
    {
        if (id >= 0 && id < _store.Count) _store.RemoveAt(id);
        return Task.CompletedTask;
    }
}

// Default interface method (C# 8+) — non-breaking addition
public interface ILogger
{
    void Log(string level, string message);

    // Default implementation — existing implementors need not change
    void LogInfo(string message)  => Log("INFO",  message);
    void LogError(string message) => Log("ERROR", message);
}

public class ConsoleLogger : ILogger
{
    // Only required member — Log; LogInfo/LogError come from the interface default
    public void Log(string level, string message)
        => Console.WriteLine($"[{level}] {message}");
}

ILogger logger = new ConsoleLogger();
logger.LogInfo("Server started");   // uses default impl
logger.LogError("Disk full");       // uses default impl`,
    },
    {
      label: 'Explicit implementation',
      language: 'csharp',
      code: `// Two interfaces with a colliding member name
public interface IEnglishGreeter { string Greet(); }
public interface IFrenchGreeter  { string Greet(); }

public class Greeter : IEnglishGreeter, IFrenchGreeter
{
    // Explicit implementation — prefixed with interface name
    string IEnglishGreeter.Greet() => "Hello!";
    string IFrenchGreeter.Greet()  => "Bonjour!";

    // Public method — default experience without casting
    public string Greet() => "Hi!";
}

var g = new Greeter();
Console.WriteLine(g.Greet());                          // "Hi!"
Console.WriteLine(((IEnglishGreeter)g).Greet());       // "Hello!"
Console.WriteLine(((IFrenchGreeter)g).Greet());        // "Bonjour!"

// Hiding advanced members — IDisposable is a BCL example
public class ManagedResource : IDisposable
{
    private bool _disposed;

    // Public helper — preferred API
    public void Close() => Dispose();

    // Explicit — not visible on the class itself, only via IDisposable ref
    void IDisposable.Dispose()
    {
        if (_disposed) return;
        _disposed = true;
        Console.WriteLine("Resource released");
    }
}

// 'using' works because it calls ((IDisposable)r).Dispose() internally
using var r = new ManagedResource();
// r.Dispose() ← compile error — Dispose is hidden from the class surface
r.Close();       // preferred way to release

// ── Static abstract members (C# 11) ─────────────────────────────────────
public interface IFactory<TSelf, TInput> where TSelf : IFactory<TSelf, TInput>
{
    static abstract TSelf Create(TInput input);
}

public class Widget : IFactory<Widget, string>
{
    public string Name { get; }
    private Widget(string name) => Name = name;

    public static Widget Create(string name) => new Widget(name);
}

T CreateInstance<T>(string arg) where T : IFactory<T, string>
    => T.Create(arg);   // static call through generic constraint

var w = CreateInstance<Widget>("Spinner");
Console.WriteLine(w.Name);  // Spinner`,
    },
    {
      label: 'IComparable & IEquatable',
      language: 'csharp',
      code: `// Implementing BCL interfaces for natural ordering and equality
public class Temperature
    : IComparable<Temperature>, IEquatable<Temperature>
{
    public double Celsius { get; }

    public Temperature(double celsius) => Celsius = celsius;

    // IComparable<T> — natural sort order
    // Returns: negative if this < other, 0 if equal, positive if this > other
    public int CompareTo(Temperature? other)
    {
        if (other is null) return 1;       // null sorts before everything
        return Celsius.CompareTo(other.Celsius);
    }

    // IEquatable<T> — strongly-typed equality
    public bool Equals(Temperature? other)
        => other is not null && Celsius == other.Celsius;

    // Always override object.Equals + GetHashCode alongside IEquatable<T>
    public override bool Equals(object? obj)
        => obj is Temperature t && Equals(t);

    public override int GetHashCode() => Celsius.GetHashCode();

    // Operator overloads — optional but consistent
    public static bool operator ==(Temperature a, Temperature b) => a.Equals(b);
    public static bool operator !=(Temperature a, Temperature b) => !a.Equals(b);
    public static bool operator  <(Temperature a, Temperature b) => a.CompareTo(b) < 0;
    public static bool operator  >(Temperature a, Temperature b) => a.CompareTo(b) > 0;

    public static Temperature FromFahrenheit(double f) => new((f - 32) * 5 / 9);

    public override string ToString() => $"{Celsius:F1}°C";
}

// Array.Sort and LINQ OrderBy use IComparable<T>
Temperature[] temps =
[
    new Temperature(100),
    new Temperature(0),
    new Temperature(37),
    Temperature.FromFahrenheit(32),
];

Array.Sort(temps);
Console.WriteLine(string.Join(", ", (IEnumerable<Temperature>)temps));
// 0.0°C, 0.0°C, 37.0°C, 100.0°C

var coldest = temps.Min();
var hottest = temps.Max();
Console.WriteLine($"Coldest: {coldest}  Hottest: {hottest}");`,
    },
  ];

  mistakes: CommonMistake[] = [
    {
      title: 'Expecting explicit interface members to be accessible directly on the class',
      wrong: `public class Stream : IDisposable
{
    void IDisposable.Dispose() { /* cleanup */ }
}

var s = new Stream();
s.Dispose();  // CS1061: Stream does not contain a definition for 'Dispose'`,
      right: `public class Stream : IDisposable
{
    void IDisposable.Dispose() { /* cleanup */ }

    public void Close() => ((IDisposable)this).Dispose();  // public helper
}

// Access via interface reference
((IDisposable)s).Dispose();

// Or use the public helper
s.Close();`,
      explanation: 'Explicitly-implemented interface members are intentionally hidden from the class\'s public surface. They are only accessible via an interface-typed reference. If you need direct access, add a public helper that delegates to the explicit implementation, or use a regular (non-explicit) implementation.',
    },
    {
      title: 'Adding an abstract member to a public abstract class (breaking change)',
      wrong: `// Published in v1 — consumers have subclasses of this
public abstract class ReportBase
{
    public abstract string Generate();
}

// v2: adding a new abstract member breaks all consumer subclasses
public abstract class ReportBase
{
    public abstract string Generate();
    public abstract string GetTitle();  // CS0534 in every consumer's subclass!
}`,
      right: `// v2 non-breaking: add a virtual member with a reasonable default
public abstract class ReportBase
{
    public abstract string Generate();
    public virtual string GetTitle() => GetType().Name;  // optional override
}`,
      explanation: 'Adding a new abstract member to a published base class is a breaking change for all consumers who have concrete subclasses — they must implement the new member or it\'s a compile error. For public APIs, add a virtual member with a default implementation instead, keeping the upgrade opt-in.',
    },
    {
      title: 'Implementing IEquatable<T> without overriding GetHashCode',
      wrong: `public class Point : IEquatable<Point>
{
    public int X { get; }
    public int Y { get; }
    public Point(int x, int y) { X = x; Y = y; }

    public bool Equals(Point? other) => other is not null && X == other.X && Y == other.Y;
    // Missing: GetHashCode override!
}

var set = new HashSet<Point>();
set.Add(new Point(1, 2));
Console.WriteLine(set.Contains(new Point(1, 2)));  // false! Hash mismatch`,
      right: `public class Point : IEquatable<Point>
{
    public int X { get; }
    public int Y { get; }
    public Point(int x, int y) { X = x; Y = y; }

    public bool Equals(Point? other) => other is not null && X == other.X && Y == other.Y;
    public override bool Equals(object? obj) => obj is Point p && Equals(p);
    public override int GetHashCode() => HashCode.Combine(X, Y);
}`,
      explanation: 'The .NET contract: equal objects MUST produce the same hash code. Hash-based collections (Dictionary, HashSet, etc.) bucket by hash first, then call Equals. If two equal objects have different hash codes, they land in different buckets and the collection treats them as distinct — silent data corruption. Always override both Equals and GetHashCode together.',
    },
    {
      title: 'Creating a fat interface that forces implementors to stub out unneeded methods',
      wrong: `public interface IWorker
{
    void DoWork();
    void TakeBreak();
    void Eat();
    void Sleep();
    void Commute();
}

// Robot only does work — forced to stub everything else
public class Robot : IWorker
{
    public void DoWork() { /* real */ }
    public void TakeBreak() => throw new NotImplementedException();
    public void Eat()       => throw new NotImplementedException();
    public void Sleep()     => throw new NotImplementedException();
    public void Commute()   => throw new NotImplementedException();
}`,
      right: `// Interface Segregation — small, focused contracts
public interface IWorkable  { void DoWork(); }
public interface IBreakable { void TakeBreak(); }
public interface IHuman : IWorkable, IBreakable
{
    void Eat();
    void Sleep();
    void Commute();
}

public class Robot : IWorkable
{
    public void DoWork() { /* real implementation */ }
}`,
      explanation: 'Fat interfaces violate the Interface Segregation Principle. Implementors are forced to throw NotImplementedException for methods they don\'t support, making the contract a lie. Split interfaces by capability cluster; implementors only take on what they actually provide.',
    },
    {
      title: 'Forgetting that default interface methods are not inherited by the class',
      wrong: `public interface ILogger
{
    void Log(string level, string message);
    void LogInfo(string message) => Log("INFO", message);  // default impl
}

public class ConsoleLogger : ILogger
{
    public void Log(string level, string message)
        => Console.WriteLine($"[{level}] {message}");
}

var logger = new ConsoleLogger();
logger.LogInfo("started");  // CS1061: ConsoleLogger does not contain LogInfo!`,
      right: `// Must use an interface-typed variable to access default members
ILogger logger = new ConsoleLogger();
logger.LogInfo("started");  // OK — calls the default impl via interface ref

// Or override it explicitly in the class to make it available on class ref
public class ConsoleLogger : ILogger
{
    public void Log(string level, string message)
        => Console.WriteLine($"[{level}] {message}");

    public void LogInfo(string message) => Log("INFO", message);  // now on class
}`,
      explanation: 'Default interface method implementations are attached to the interface, not inherited into the implementing class. A class-typed variable cannot see them — only an interface-typed variable can. If you need the method on the class surface, either add your own implementation or introduce a public method that delegates to the interface default via an explicit cast.',
    },
  ];

  challenge: Challenge = {
    title: 'Notification system with interfaces',
    description: `Design a small notification system:
1. Define an interface INotifier with a single method: Task NotifyAsync(string recipient, string message).
2. Create an EmailNotifier class that implements INotifier and writes "Email to {recipient}: {message}" to the console.
3. Create an SmsNotifier class that implements INotifier and writes "SMS to {recipient}: {message}" to the console.
4. Create a BroadcastNotifier class that takes an IEnumerable<INotifier> in its constructor and implements INotifier by calling NotifyAsync on all inner notifiers.`,
    language: 'csharp',
    hints: [
      'INotifier has one method: Task NotifyAsync(string recipient, string message)',
      'EmailNotifier and SmsNotifier each just write to the console and return Task.CompletedTask',
      'BroadcastNotifier stores the notifiers in a readonly field and iterates them',
      'Use await inside an async method, or Task.WhenAll for parallel notification',
    ],
    starterCode: `public interface INotifier
{
    // TODO: NotifyAsync
}

public class EmailNotifier : INotifier
{
    // TODO: implement NotifyAsync
}

public class SmsNotifier : INotifier
{
    // TODO: implement NotifyAsync
}

public class BroadcastNotifier : INotifier
{
    // TODO: constructor accepts IEnumerable<INotifier>
    // TODO: NotifyAsync calls all inner notifiers
}`,
    solution: `public interface INotifier
{
    Task NotifyAsync(string recipient, string message);
}

public class EmailNotifier : INotifier
{
    public Task NotifyAsync(string recipient, string message)
    {
        Console.WriteLine($"Email to {recipient}: {message}");
        return Task.CompletedTask;
    }
}

public class SmsNotifier : INotifier
{
    public Task NotifyAsync(string recipient, string message)
    {
        Console.WriteLine($"SMS to {recipient}: {message}");
        return Task.CompletedTask;
    }
}

public class BroadcastNotifier : INotifier
{
    private readonly IEnumerable<INotifier> _notifiers;

    public BroadcastNotifier(IEnumerable<INotifier> notifiers)
        => _notifiers = notifiers;

    public async Task NotifyAsync(string recipient, string message)
    {
        foreach (var notifier in _notifiers)
            await notifier.NotifyAsync(recipient, message);
    }
}

// Usage
INotifier broadcast = new BroadcastNotifier([
    new EmailNotifier(),
    new SmsNotifier(),
]);

await broadcast.NotifyAsync("alice@example.com", "Your order has shipped!");
// Email to alice@example.com: Your order has shipped!
// SMS   to alice@example.com: Your order has shipped!`,
  };

  quiz: QuizQuestion[] = [
    {
      q: 'Which statement about abstract classes is correct?',
      options: [
        'An abstract class can be instantiated directly with new',
        'An abstract class cannot have any implemented (non-abstract) methods',
        'An abstract class can have fields, constructors, and a mix of abstract and non-abstract members',
        'A class can inherit from multiple abstract classes',
      ],
      answer: 2,
      explanation: 'An abstract class can carry concrete fields, constructors, and fully-implemented methods alongside its abstract members. It cannot be instantiated directly, and a class may inherit from only one abstract class — the same single-inheritance rule applies.',
    },
    {
      q: 'What is an explicit interface implementation used for?',
      options: [
        'To make an interface method faster',
        'To resolve naming conflicts when two interfaces have the same member name, or to hide infrastructure members from the public API',
        'To mark a member as internal to the assembly',
        'To prevent a derived class from overriding the member',
      ],
      answer: 1,
      explanation: 'Explicit implementation (<code>void IFoo.Method() { }</code>) resolves naming conflicts between two interfaces that declare the same member. It also hides the member — it is only accessible via an interface-typed reference, which is useful for keeping infrastructure concerns out of the class\'s public surface.',
    },
    {
      q: 'What does a default interface method (C# 8+) enable?',
      options: [
        'It lets an interface hold instance fields',
        'It allows adding new members to a published interface without breaking existing implementors',
        'It marks the method as optional — the compiler skips it',
        'It generates an abstract class automatically',
      ],
      answer: 1,
      explanation: 'Default interface methods let you add a new member with a body to an existing interface. Classes that already implement the interface do not need to change — they inherit the default. The implementation is only accessible through an interface-typed reference.',
    },
    {
      q: 'How does IComparable<T>.CompareTo(T other) signal that this instance is less than other?',
      options: [
        'Return true',
        'Return 0',
        'Return a positive integer',
        'Return a negative integer',
      ],
      answer: 3,
      explanation: '<code>CompareTo</code> returns a negative number when <code>this</code> sorts before <code>other</code>, 0 when they are equal, and a positive number when <code>this</code> sorts after <code>other</code>. This contract is consumed by <code>Array.Sort</code>, <code>List&lt;T&gt;.Sort</code>, and LINQ <code>OrderBy</code>.',
    },
    {
      q: 'What is the key difference between an interface and an abstract class for a class that needs two behaviours (e.g. "saveable" and "printable")?',
      options: [
        'An abstract class supports both — just add both abstract methods',
        'You need two abstract classes joined with a comma',
        'Only interfaces support this — a class can implement multiple interfaces but only inherit one base class',
        'You must use a sealed class for multiple behaviours',
      ],
      answer: 2,
      explanation: 'C# allows only single class inheritance — a class can only have one base class (abstract or concrete). Multiple <em>interface</em> implementation has no such limit: <code>class Doc : ISaveable, IPrintable</code> is perfectly valid. Use interfaces when you need to combine multiple independent capability contracts on one type.',
    },
    {
      q: 'What does static abstract in an interface (C# 11+) allow?',
      options: [
        'Interfaces to hold static fields',
        'The implementing class to have static members that satisfy the interface contract, enabling generic algorithms over operators and factory methods',
        'Static methods to be called as virtual dispatch at runtime',
        'Interfaces to be instantiated statically',
      ],
      answer: 1,
      explanation: '<code>static abstract</code> (C# 11) lets an interface declare a static contract — for example, operator overloads or factory methods — that implementing types must provide. Generic methods constrained to such an interface can then call those static members through the type parameter (<code>T.Create(x)</code>, <code>T.operator +(a, b)</code>), enabling the .NET generic math system.',
    },
  ];

  qna: QnaItem[] = [
    {
      q: 'When should I choose an abstract class over an interface?',
      a: 'Choose an <code>abstract class</code> when derived types genuinely share <em>state</em> (fields) or <em>non-trivial implementation</em> that would be duplicated if each type had to write it from scratch. Choose an <code>interface</code> when you are defining a <em>capability contract</em> that unrelated types should fulfil, or when you need to apply multiple contracts to one class. In modern C#, interfaces with default methods blur this boundary, but the rule of thumb still holds: if shared fields or constructor logic are involved, use an abstract class.',
    },
    {
      q: 'What happens if I add a new abstract method to an abstract class that already has concrete subclasses?',
      a: 'It is a <strong>compile error</strong> for every non-abstract subclass that does not implement the new method. This is safe within a private codebase — you get errors everywhere you need to add code. In a <em>public library</em> it is a <strong>breaking change</strong> that will break all consumers\' subclasses. For public APIs, prefer adding a non-abstract (concrete) method with a reasonable default, or add a default method to an interface instead.',
    },
    {
      q: 'Can an abstract class implement an interface?',
      a: 'Yes — and it can leave some or all of the interface members abstract, delegating their implementation to concrete subclasses. For example: <code>public abstract class BaseRepo&lt;T&gt; : IRepository&lt;T&gt;</code> can implement <code>GetAllAsync</code> concretely but declare <code>GetByIdAsync</code> as abstract, forcing each concrete subclass to provide its own. This is a common pattern in frameworks like Entity Framework Core.',
    },
    {
      q: 'Why should I always override GetHashCode when I implement IEquatable<T>?',
      a: 'The .NET contract states: if two objects are equal (<code>Equals</code> returns <code>true</code>), they <strong>must</strong> return the same <code>GetHashCode</code>. Hash-based collections (<code>Dictionary&lt;,&gt;</code>, <code>HashSet&lt;T&gt;</code>) use the hash code to bucket objects before calling <code>Equals</code>. If hashes differ for equal objects, the collection may store duplicates or fail to find items — silent, hard-to-debug data corruption. Use <code>HashCode.Combine(…)</code> to build a correct hash from the fields you use in <code>Equals</code>.',
    },
    {
      q: 'Are default interface method implementations inherited into the implementing class?',
      a: 'No — this is a common surprise. Default implementations live on the <em>interface</em>, not the class. They are only accessible through an interface-typed variable. If you hold an instance as a class reference, the default method is invisible. To expose a default method on the class surface, either add a public method to the class that explicitly calls the default (via a cast: <code>((ILogger)this).LogInfo(msg)</code>), or just write your own public implementation.',
    },
    {
      q: 'What is the Interface Segregation Principle and why does it matter in C#?',
      a: 'ISP (the "I" in SOLID) states: no client should be forced to depend on methods it does not use. In practice: split large interfaces into small, focused ones. A <code>Robot</code> that only does work should implement <code>IWorkable</code>, not a fat <code>IWorker</code> that also has <code>Eat()</code> and <code>Sleep()</code>. In C# this matters because an implementing class must provide every member of an interface — fat interfaces force <code>throw new NotImplementedException()</code> stubs, which are lying contracts and testing nightmares.',
    },
  ];

  revision: RevisionSummary = {
    oneLiner: 'Abstract classes share state and behaviour with a single base; interfaces define capability contracts that any number of unrelated types can implement. Use virtual/default for non-breaking evolution of both.',
    mustKnow: [
      'Abstract class: cannot instantiate; can hold fields/constructors/concrete methods; all derived must implement abstract members.',
      'Interface: no instance state; a class may implement many; default methods (C# 8+) added without breaking existing implementors.',
      'Explicit interface implementation: prefixed with interface name (<code>void IFoo.Method()</code>), hidden from class surface — only accessible via interface-typed reference.',
      'Default interface methods are on the interface, not the class — invisible through a class-typed variable.',
      'IEquatable&lt;T&gt; must always be paired with a matching GetHashCode override — hash-based collections break silently otherwise.',
      'ISP: prefer small, focused interfaces. Fat interfaces force NotImplementedException stubs — a contract lie.',
      'C# 11 static abstract members: let interfaces declare static contracts (operators, factories) consumed by generic constraints.',
    ],
    interviewFocus: [
      'Interface vs abstract class — when to use each? (multiple contracts vs shared state/behaviour)',
      'What is explicit interface implementation? When would you use it? (naming conflict; hiding infrastructure members)',
      'What happens when you add an abstract member to an existing public abstract class? (breaking change — use virtual with default instead)',
      'Why must GetHashCode be consistent with Equals? (hash collections bucket by hash before calling Equals — mismatched hashes = lost items)',
      'What is a default interface method and where can it be called? (only via interface-typed reference, not class reference)',
    ],
  };
}
