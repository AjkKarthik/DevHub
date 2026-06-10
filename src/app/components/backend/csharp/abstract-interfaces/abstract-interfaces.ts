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
  selector: 'app-csharp-abstract-interfaces',
  standalone: true,
  imports: [
    CodeBlockComponent, TheoryBlockComponent, QnaBlockComponent,
    QuizBlockComponent, ChallengeBlockComponent, QuickRefComponent,
    PageMetaComponent, PageCompleteComponent,
  ],
  templateUrl: './abstract-interfaces.html',
  styleUrl: './abstract-interfaces.scss',
})
export class CsharpAbstractInterfaces {

  quickRef: QuickRefItem[] = [
    { name: 'abstract class',      type: 'keyword',   desc: 'Cannot be instantiated — defines shared state and forces subclasses to implement abstract members' },
    { name: 'abstract method',     type: 'keyword',   desc: 'No body in the base — every non-abstract derived class MUST override it' },
    { name: 'interface',           type: 'interface', desc: 'Pure contract — no instance fields, supports multiple implementation on one class' },
    { name: 'default impl (C# 8)', type: 'syntax',    desc: 'Interface members can have a default body — existing implementors are unaffected' },
    { name: 'explicit impl',       type: 'syntax',    desc: 'IFoo.Method() syntax — resolves naming conflicts, hides the member from direct access' },
    { name: 'IComparable<T>',      type: 'interface', desc: 'Single-method contract for natural ordering — CompareTo returns negative/zero/positive' },
    { name: 'IEquatable<T>',       type: 'interface', desc: 'Strongly-typed Equals(T) — avoids boxing for value types' },
    { name: 'IDisposable',         type: 'interface', desc: 'Dispose() pattern — clean up unmanaged resources; enables using statement' },
    { name: 'IEnumerable<T>',      type: 'interface', desc: 'Makes a type iterable with foreach and LINQ' },
    { name: 'where T : IFoo',      type: 'constraint', desc: 'Generic constraint — ensures T implements the interface, unlocking its members' },
  ];

  theory: TheoryPoint[] = [
    {
      heading: 'Abstract classes — shared base with enforced contract',
      points: [
        'An <code>abstract class</code> cannot be instantiated directly. It exists to be subclassed.',
        'It can contain fully-implemented ("concrete") members — fields, properties, constructors, methods — that all derived classes inherit.',
        '<code>abstract</code> members have <em>no body</em> in the abstract class. Every non-abstract derived class <strong>must</strong> provide an implementation with <code>override</code>.',
        'This is the <em>Template Method</em> pattern in action: the abstract class defines the algorithm skeleton; derived classes fill in the variable steps.',
        'Abstract classes <em>do</em> have constructors — called via <code>: base()</code> chaining when a derived class is instantiated.',
      ],
    },
    {
      heading: 'Interfaces — pure contracts',
      points: [
        'An interface specifies <em>what</em> a type must do, with no instance state (no instance fields or constructors).',
        'Traditionally all members are implicitly <code>public abstract</code>. Since C# 8, default method implementations are allowed.',
        'A class can implement <strong>multiple</strong> interfaces: <code>class Foo : IBar, IBaz, IQux</code>.',
        'Coding against interfaces enables <em>Dependency Inversion</em> — your classes depend on abstractions, not concretions — making them easy to test and swap.',
        'By convention, interface names start with <code>I</code>: <code>ILogger</code>, <code>IRepository&lt;T&gt;</code>, <code>IDisposable</code>.',
      ],
    },
    {
      heading: 'Default interface methods (C# 8+)',
      points: [
        'An interface can now include a method body as the default implementation.',
        'Existing classes that implement the interface are <strong>not required</strong> to provide their own implementation — they inherit the default.',
        'This enables adding new members to a published interface without breaking all existing implementors — an "interface evolution" mechanism.',
        'Default implementations are only callable through an interface-typed reference. They are not inherited into the class itself.',
      ],
    },
    {
      heading: 'Explicit interface implementation',
      points: [
        'When two interfaces declare a member with the same name, use <em>explicit implementation</em> to provide separate implementations: <code>void IFoo.Method() { }</code>.',
        'Explicitly-implemented members are only accessible through an interface-typed reference — they are hidden from the class\'s public API.',
        'This is also used intentionally to hide "advanced" or "infrastructure" members from the primary API surface.',
      ],
    },
    {
      heading: 'When to choose interface vs abstract class',
      points: [
        'Use an <strong>interface</strong> when you want a capability contract that unrelated types can implement (<code>IDisposable</code>, <code>IComparable&lt;T&gt;</code>), or when you need multiple "contracts" on one class.',
        'Use an <strong>abstract class</strong> when derived types genuinely share state (fields) or non-trivial shared behaviour, and when a single base is sufficient.',
        'Prefer interface + composition over deep abstract hierarchies — code evolves more safely.',
        'You can combine both: implement an interface in an abstract base, providing default implementations that derived classes can optionally refine.',
      ],
    },
    {
      heading: 'Common BCL interfaces worth knowing',
      points: [
        '<code>IComparable&lt;T&gt;</code> — implement <code>CompareTo(T)</code> to give your type a natural sort order. Used by <code>Array.Sort</code> and LINQ <code>OrderBy</code>.',
        '<code>IEquatable&lt;T&gt;</code> — implement <code>Equals(T)</code> for strongly-typed equality. Avoids boxing for structs.',
        '<code>IDisposable</code> — implement <code>Dispose()</code> to release unmanaged resources. Enables <code>using</code> statement and <code>await using</code>.',
        '<code>IEnumerable&lt;T&gt;</code> — implement <code>GetEnumerator()</code> to make your type iterable with <code>foreach</code> and LINQ.',
        '<code>ICloneable</code>, <code>IFormattable</code>, <code>IConvertible</code> — specialised contracts used throughout the BCL.',
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
        => Console.WriteLine(\`Export complete: \${OutputPath}\`);
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
    // Only required member — Log
    public void Log(string level, string message)
        => Console.WriteLine(\`[\${level}] \${message}\`);
    // LogInfo / LogError default implementations are inherited via interface ref
}

ILogger logger = new ConsoleLogger();
logger.LogInfo("Server started");   // uses default impl`,
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

// Hiding advanced members — IDisposable is an example in the BCL
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
// r.Dispose() ← compile error — Dispose is not on the class API
r.Close();       // preferred way to release`,
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

    public override string ToString() => \`\${Celsius:F1}°C\`;
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
Console.WriteLine(string.Join(", ", temps as IEnumerable<Temperature>));
// 0.0°C, 0.0°C, 37.0°C, 100.0°C

var coldest = temps.Min();    // uses IComparable<T>
var hottest = temps.Max();
Console.WriteLine(\`Coldest: \${coldest}  Hottest: \${hottest}\`);`,
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
        Console.WriteLine(\`Email to \${recipient}: \${message}\`);
        return Task.CompletedTask;
    }
}

public class SmsNotifier : INotifier
{
    public Task NotifyAsync(string recipient, string message)
    {
        Console.WriteLine(\`SMS to \${recipient}: \${message}\`);
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
      explanation: 'An abstract class can carry concrete fields, constructors, and fully-implemented methods alongside its abstract members. It cannot be instantiated directly and a class may inherit from only one abstract class — the same single-inheritance rule applies.',
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
  ];

  qna: QnaItem[] = [
    {
      q: 'When should I choose an abstract class over an interface?',
      a: 'Choose an <code>abstract class</code> when derived types genuinely share <em>state</em> (fields) or <em>non-trivial implementation</em> that would be duplicated if each type had to write it from scratch. Choose an <code>interface</code> when you are defining a <em>capability contract</em> that unrelated types should fulfil, or when you need to apply multiple contracts to one class. In modern C#, interfaces with default methods blur this boundary, but the rule of thumb still holds.',
    },
    {
      q: 'What happens if I add a new abstract method to an abstract class that already has concrete subclasses?',
      a: 'It is a <strong>compile error</strong> for every non-abstract subclass that does not implement the new method. This is safe within a private codebase — you get errors everywhere you need to add code. In a <em>public library</em> it is a <strong>breaking change</strong> that will break all consumers\' subclasses. For public APIs, prefer adding a non-abstract (concrete) method with a reasonable default, or add a default method to an interface instead.',
    },
    {
      q: 'Can an abstract class implement an interface?',
      a: 'Yes — and it can leave some or all of the interface members abstract, delegating their implementation to concrete subclasses. For example: <code>public abstract class BaseRepo&lt;T&gt; : IRepository&lt;T&gt;</code> can implement <code>GetAllAsync</code> concretely but declare <code>GetByIdAsync</code> as abstract, forcing each concrete subclass to provide its own. This is a common pattern in frameworks like Entity Framework.',
    },
    {
      q: 'Why should I always override GetHashCode when I implement IEquatable<T>?',
      a: 'The .NET contract states: if two objects are equal (<code>Equals</code> returns <code>true</code>), they <strong>must</strong> return the same <code>GetHashCode</code>. Hash-based collections (<code>Dictionary&lt;,&gt;</code>, <code>HashSet&lt;T&gt;</code>) use the hash code to bucket objects before calling <code>Equals</code>. If hashes differ for equal objects, the collection may store duplicates or fail to find items — subtle, hard-to-debug data corruption.',
    },
  ];
}
