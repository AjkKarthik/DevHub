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
  selector: 'app-csharp-static-enums',
  standalone: true,
  imports: [
    CodeBlockComponent, TheoryBlockComponent, QnaBlockComponent,
    QuizBlockComponent, ChallengeBlockComponent, QuickRefComponent,
    PageMetaComponent, PageCompleteComponent,
  ],
  templateUrl: './static-enums.html',
  styleUrl: './static-enums.scss',
})
export class CsharpStaticEnums {

  quickRef: QuickRefItem[] = [
    { name: 'static class',          type: 'keyword', desc: 'Cannot be instantiated or inherited — pure container for static members' },
    { name: 'static member',         type: 'keyword', desc: 'Belongs to the type, not instances — accessed via ClassName.Member' },
    { name: 'partial class',         type: 'keyword', desc: 'Splits a class across multiple files — all parts merged at compile time' },
    { name: 'enum',                  type: 'keyword', desc: 'Named set of integer constants — strongly-typed symbolic names' },
    { name: '[Flags]',               type: 'decorator', desc: 'Enables bitwise combination of enum values — members should be powers of two' },
    { name: 'Enum.Parse<T>',         type: 'method',  desc: 'Converts a string to an enum value — throws if the name is not found' },
    { name: 'Enum.TryParse<T>',      type: 'method',  desc: 'Safe parse — returns false instead of throwing on unknown names' },
    { name: 'Enum.GetValues<T>',     type: 'method',  desc: 'Returns all defined values of an enum as T[]' },
    { name: 'Enum.GetNames<T>',      type: 'method',  desc: 'Returns all member names of an enum as string[]' },
    { name: 'HasFlag()',             type: 'method',  desc: 'Tests whether a [Flags] value contains a specific flag bit' },
    { name: 'switch expression',     type: 'syntax',  desc: 'Pattern-match an enum exhaustively — compiler warns on missing cases' },
    { name: 'extension method',      type: 'method',  desc: 'this T param — adds methods to existing types without subclassing' },
  ];

  theory: TheoryPoint[] = [
    {
      heading: 'Static classes — pure utility containers',
      points: [
        'A <code>static class</code> cannot be instantiated with <code>new</code> and cannot be inherited. All members must themselves be <code>static</code>.',
        'Access members directly via the class name: <code>MathUtils.Clamp(value, 0, 100)</code>.',
        'Common use cases: helper/utility methods (<code>StringExtensions</code>), factory helpers, <code>Guard</code> classes, extension method hosts.',
        'Static classes are implicitly <code>sealed</code>. They are initialised lazily when first accessed in a thread-safe way by the runtime.',
        'Avoid static classes that hold mutable state — that state is global and creates hard-to-test, thread-unsafe code.',
      ],
    },
    {
      heading: 'Static members on non-static classes',
      points: [
        'Individual members can be <code>static</code> on an otherwise normal class. They belong to the type itself, not to any instance.',
        'Static members are shared across all instances. A static counter field, for example, increments for every object created.',
        '<code>static readonly</code> fields initialised at declaration or in a <em>static constructor</em> (<code>static ClassName() { }</code>) are thread-safe.',
        'Extension methods are static methods with <code>this T</code> as their first parameter — they appear as instance methods on the target type.',
      ],
    },
    {
      heading: 'Partial classes — split across files',
      points: [
        'The <code>partial</code> keyword lets you spread a single class definition across multiple <code>.cs</code> files. The compiler merges them into one type.',
        'All parts must be in the same namespace and assembly, and must use the same base class/interfaces.',
        'Practical uses: keeping generated code (e.g. EF migrations, source generators, designer files) separate from hand-written logic.',
        'Partial methods can be declared in one part and implemented in another — if no implementation is provided, both declaration and calls are removed by the compiler.',
      ],
    },
    {
      heading: 'Enum basics — named integer constants',
      points: [
        'An <code>enum</code> declares a set of named integer constants: <code>enum Direction { North, South, East, West }</code>.',
        'Values default to <code>int</code> starting at 0, incrementing by 1. You can specify a different underlying type (<code>byte</code>, <code>long</code>, etc.) and set explicit values.',
        'Enums are strongly typed — the compiler prevents mixing unrelated enum types.',
        '<code>ToString()</code> returns the member name. Cast to the underlying type with <code>(int)value</code>. Cast back with <code>(MyEnum)3</code>.',
        'Never compare an enum to a magic integer — always use the symbolic name.',
      ],
    },
    {
      heading: '[Flags] — bitmask enums',
      points: [
        'The <code>[Flags]</code> attribute signals that an enum is intended to be used as a bitmask — multiple values combined with <code>|</code>.',
        'Member values should be powers of two (1, 2, 4, 8, …) so they occupy distinct bits and can be combined without collisions.',
        'Use <code>HasFlag()</code> to test membership: <code>permissions.HasFlag(Permission.Read)</code>.',
        '<code>ToString()</code> on a Flags value returns a comma-separated list of set members: <code>"Read, Write"</code>.',
        'Define a <code>None = 0</code> member as the "empty" value, and optionally an <code>All</code> member as the union of all bits.',
      ],
    },
    {
      heading: 'Enum parsing and pattern matching',
      points: [
        '<code>Enum.Parse&lt;T&gt;("Sunday")</code> converts a string to an enum value — throws <code>ArgumentException</code> if the name is invalid.',
        '<code>Enum.TryParse&lt;T&gt;("Sunday", out var day)</code> is the safe version — returns <code>false</code> on failure.',
        '<code>Enum.GetValues&lt;T&gt;()</code> returns an array of all defined values — useful for populating dropdowns.',
        'Pattern matching with a <code>switch</code> expression works beautifully with enums. The compiler warns if you miss a case, making exhaustiveness explicit.',
        'Add extension methods on enum types to associate display strings or behaviour — a clean alternative to large switch statements scattered across the codebase.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Static class & extensions',
      language: 'csharp',
      code: `// Static utility class — cannot be instantiated or inherited
public static class Guard
{
    public static T NotNull<T>(T? value, string paramName)
        where T : class
    {
        ArgumentNullException.ThrowIfNull(value, paramName);
        return value;
    }

    public static string NotNullOrEmpty(string? value, string paramName)
    {
        ArgumentException.ThrowIfNullOrEmpty(value, paramName);
        return value;
    }

    public static T InRange<T>(T value, T min, T max, string paramName)
        where T : IComparable<T>
    {
        if (value.CompareTo(min) < 0 || value.CompareTo(max) > 0)
            throw new ArgumentOutOfRangeException(paramName, \`Must be between \${min} and \${max}\`);
        return value;
    }
}

// Extension methods — static class hosts them
public static class StringExtensions
{
    // 'this string' makes this appear as an instance method on string
    public static string Truncate(this string s, int maxLength)
        => s.Length <= maxLength ? s : s[..maxLength] + "…";

    public static string ToTitleCase(this string s)
        => string.IsNullOrEmpty(s) ? s
           : char.ToUpper(s[0]) + s[1..].ToLower();

    public static bool IsEmail(this string s)
        => s.Contains('@') && s.Contains('.');
}

// Static member on a regular class
public class Counter
{
    // static field — shared across all Counter instances
    private static int _total = 0;

    public int Id { get; }

    // static constructor — runs once before first use
    static Counter() => Console.WriteLine("Counter type initialised");

    public Counter() => Id = Interlocked.Increment(ref _total);

    // static property — no instance needed
    public static int Total => _total;
}

// Usage
var title = "hello world".ToTitleCase();  // "Hello world"
var truncated = "Long sentence here.".Truncate(10);  // "Long sente…"

Guard.NotNullOrEmpty(title, nameof(title));
Guard.InRange(42, 0, 100, "score");

var a = new Counter();   // Id = 1
var b = new Counter();   // Id = 2
Console.WriteLine(Counter.Total);  // 2`,
    },
    {
      label: 'Enum & [Flags]',
      language: 'csharp',
      code: `// Basic enum — auto-incrementing from 0
public enum DayOfWeek
{
    Monday = 1,
    Tuesday,
    Wednesday,
    Thursday,
    Friday,
    Saturday,
    Sunday
}

// Enum with explicit underlying type
public enum HttpStatusCode : ushort
{
    Ok          = 200,
    Created     = 201,
    BadRequest  = 400,
    Unauthorised = 401,
    NotFound    = 404,
    ServerError = 500,
}

// [Flags] bitmask enum — powers of two
[Flags]
public enum FilePermission
{
    None    = 0,
    Read    = 1,        // 0001
    Write   = 2,        // 0010
    Execute = 4,        // 0100
    All     = Read | Write | Execute   // 0111 = 7
}

// Combining flags with |
var userPerms = FilePermission.Read | FilePermission.Write;
Console.WriteLine(userPerms);              // "Read, Write"
Console.WriteLine((int)userPerms);         // 3

// Testing a flag
Console.WriteLine(userPerms.HasFlag(FilePermission.Read));    // True
Console.WriteLine(userPerms.HasFlag(FilePermission.Execute)); // False

// Adding a flag
userPerms |= FilePermission.Execute;
Console.WriteLine(userPerms);             // "Read, Write, Execute"

// Removing a flag
userPerms &= ~FilePermission.Write;
Console.WriteLine(userPerms);             // "Read, Execute"

// Cast between enum and int
var code = HttpStatusCode.NotFound;
int raw = (int)code;                       // 404
var back = (HttpStatusCode)404;            // NotFound

// Enum.GetValues — iterate all members
foreach (var day in Enum.GetValues<DayOfWeek>())
    Console.WriteLine(\`\${(int)day}: \${day}\`);`,
    },
    {
      label: 'Enum.Parse & pattern matching',
      language: 'csharp',
      code: `public enum OrderStatus
{
    Pending,
    Processing,
    Shipped,
    Delivered,
    Cancelled
}

// Enum.Parse — throws on unknown name
OrderStatus status = Enum.Parse<OrderStatus>("Shipped");
Console.WriteLine(status);   // Shipped

// Enum.TryParse — safe version
if (Enum.TryParse<OrderStatus>("Unknown", ignoreCase: true, out var parsed))
    Console.WriteLine(parsed);
else
    Console.WriteLine("Unknown status — defaulting to Pending");

// Pattern matching with switch expression — exhaustive
static string GetStatusMessage(OrderStatus s) => s switch
{
    OrderStatus.Pending    => "Your order is awaiting processing.",
    OrderStatus.Processing => "We are preparing your order.",
    OrderStatus.Shipped    => "Your order is on its way!",
    OrderStatus.Delivered  => "Your order has been delivered.",
    OrderStatus.Cancelled  => "Your order has been cancelled.",
    _                      => throw new ArgumentOutOfRangeException(nameof(s), s, null)
};

Console.WriteLine(GetStatusMessage(OrderStatus.Shipped));

// Extension method on enum — keeps display logic with the enum
public static class OrderStatusExtensions
{
    public static string ToDisplayString(this OrderStatus s) => s switch
    {
        OrderStatus.Pending    => "Pending",
        OrderStatus.Processing => "In Progress",
        OrderStatus.Shipped    => "Shipped",
        OrderStatus.Delivered  => "Delivered ✓",
        OrderStatus.Cancelled  => "Cancelled ✗",
        _                      => s.ToString()
    };

    public static bool IsTerminal(this OrderStatus s)
        => s is OrderStatus.Delivered or OrderStatus.Cancelled;
}

// Usage
Console.WriteLine(OrderStatus.Delivered.ToDisplayString());   // "Delivered ✓"
Console.WriteLine(OrderStatus.Processing.IsTerminal());       // False

// Populate a dropdown from enum values
var options = Enum.GetValues<OrderStatus>()
                  .Select(s => new { Value = (int)s, Label = s.ToDisplayString() })
                  .ToList();

foreach (var opt in options)
    Console.WriteLine(\`\${opt.Value}: \${opt.Label}\`);`,
    },
    {
      label: 'Partial class',
      language: 'csharp',
      code: `// File 1: Order.cs — hand-written business logic
public partial class Order
{
    public int Id { get; set; }
    public string CustomerEmail { get; set; } = "";
    public OrderStatus Status { get; private set; } = OrderStatus.Pending;
    public List<OrderLine> Lines { get; } = [];

    public decimal Total => Lines.Sum(l => l.LineTotal);

    public void Ship()
    {
        if (Status != OrderStatus.Processing)
            throw new InvalidOperationException("Can only ship a Processing order.");
        Status = OrderStatus.Shipped;
        OnStatusChanged(OrderStatus.Shipped);
    }

    public void Cancel()
    {
        if (Status.IsTerminal())
            throw new InvalidOperationException("Cannot cancel a terminal order.");
        Status = OrderStatus.Cancelled;
        OnStatusChanged(OrderStatus.Cancelled);
    }

    // Partial method — declared here, implemented in generated file (or omitted)
    partial void OnStatusChanged(OrderStatus newStatus);
}

// File 2: Order.Generated.cs — e.g. produced by a source generator or designer
public partial class Order
{
    // Additional properties added by the generator
    public DateTime CreatedAt { get; } = DateTime.UtcNow;
    public Guid TrackingId  { get; } = Guid.NewGuid();

    // Implementation of the partial method
    partial void OnStatusChanged(OrderStatus newStatus)
        => Console.WriteLine(\`Order \${Id} status changed to \${newStatus}\`);
}

// Both files compile into one Order class
public record OrderLine(string ProductName, int Qty, decimal UnitPrice)
{
    public decimal LineTotal => Qty * UnitPrice;
}

// Usage — one class, two source files
var order = new Order { Id = 1, CustomerEmail = "bob@example.com" };
order.Lines.Add(new OrderLine("Widget", 3, 9.99m));
Console.WriteLine(\`Total: \${order.Total:C}\`);     // £29.97
Console.WriteLine(\`Tracking: \${order.TrackingId}\`);`,
    },
  ];

  challenge: Challenge = {
    title: 'Permission checker with [Flags] enum',
    description: `Implement a file permission system:
1. Define a [Flags] enum FilePermission with None = 0, Read = 1, Write = 2, Execute = 4, and All = Read | Write | Execute.
2. Create a static class PermissionChecker with:
   - bool CanRead(FilePermission p) — returns true if Read flag is set
   - bool CanWrite(FilePermission p) — returns true if Write flag is set
   - bool CanExecute(FilePermission p) — returns true if Execute flag is set
   - FilePermission Grant(FilePermission current, FilePermission toGrant) — adds the flag
   - FilePermission Revoke(FilePermission current, FilePermission toRevoke) — removes the flag
3. An extension method string ToDescription(this FilePermission p) that returns a human-readable string like "Read | Write".`,
    language: 'csharp',
    hints: [
      'Use powers of two for flag values: 1, 2, 4',
      'HasFlag() tests for a specific flag; | combines flags; & ~ removes a flag',
      'ToDescription can use Enum.GetValues<FilePermission>() and filter with HasFlag',
      'Extension methods must be in a static class with this as the first parameter',
    ],
    starterCode: `[Flags]
public enum FilePermission
{
    // TODO: None, Read, Write, Execute, All
}

public static class PermissionChecker
{
    // TODO: CanRead, CanWrite, CanExecute, Grant, Revoke
}

public static class FilePermissionExtensions
{
    // TODO: ToDescription extension method
}`,
    solution: `[Flags]
public enum FilePermission
{
    None    = 0,
    Read    = 1,
    Write   = 2,
    Execute = 4,
    All     = Read | Write | Execute
}

public static class PermissionChecker
{
    public static bool CanRead(FilePermission p)    => p.HasFlag(FilePermission.Read);
    public static bool CanWrite(FilePermission p)   => p.HasFlag(FilePermission.Write);
    public static bool CanExecute(FilePermission p) => p.HasFlag(FilePermission.Execute);

    public static FilePermission Grant(FilePermission current, FilePermission toGrant)
        => current | toGrant;

    public static FilePermission Revoke(FilePermission current, FilePermission toRevoke)
        => current & ~toRevoke;
}

public static class FilePermissionExtensions
{
    public static string ToDescription(this FilePermission p)
    {
        if (p == FilePermission.None) return "None";
        var parts = Enum.GetValues<FilePermission>()
                        .Where(f => f != FilePermission.None
                                 && f != FilePermission.All
                                 && p.HasFlag(f))
                        .Select(f => f.ToString());
        return string.Join(" | ", parts);
    }
}

// Usage
var perms = FilePermission.Read | FilePermission.Write;
Console.WriteLine(perms.ToDescription());                    // "Read | Write"
Console.WriteLine(PermissionChecker.CanExecute(perms));      // False

perms = PermissionChecker.Grant(perms, FilePermission.Execute);
Console.WriteLine(perms.ToDescription());                    // "Read | Write | Execute"

perms = PermissionChecker.Revoke(perms, FilePermission.Write);
Console.WriteLine(perms.ToDescription());                    // "Read | Execute"`,
  };

  quiz: QuizQuestion[] = [
    {
      q: 'What is a requirement for a static class in C#?',
      options: [
        'It must implement at least one interface',
        'All of its members must be static, and it cannot be instantiated or inherited',
        'It must have a private constructor',
        'It can only contain readonly fields',
      ],
      answer: 1,
      explanation: 'A <code>static class</code> enforces that every member is <code>static</code>. The compiler prevents you from writing <code>new MyStaticClass()</code> and prevents any class from inheriting it. It is the idiomatic container for utility/helper methods and extension method hosts.',
    },
    {
      q: 'For a [Flags] enum, why should member values be powers of two?',
      options: [
        'To make the enum serialisable to JSON',
        'So that each member occupies a unique bit, allowing multiple values to be combined with | without collision',
        'Because the compiler requires it when [Flags] is present',
        'To allow negative values',
      ],
      answer: 1,
      explanation: 'Bitmask logic works because each power of two has exactly one bit set in binary (1, 2, 4, 8 → 0001, 0010, 0100, 1000). Combining them with <code>|</code> sets multiple distinct bits, and you can test each independently with <code>&</code> or <code>HasFlag()</code>. If you used arbitrary values the bits would overlap and flags could not be distinguished.',
    },
    {
      q: 'What is a partial class used for?',
      options: [
        'A class that can only be partially constructed',
        'Splitting a class definition across multiple source files, all merged at compile time',
        'A class whose members are all optional',
        'A base class that implements only some interface members',
      ],
      answer: 1,
      explanation: 'The <code>partial</code> keyword lets a single type span multiple <code>.cs</code> files. The compiler combines them into one type. This is commonly used to separate hand-written code from generated code (EF Core migrations, source generators, WinForms designer files) so regenerating code does not overwrite your custom logic.',
    },
    {
      q: 'What is the difference between Enum.Parse<T> and Enum.TryParse<T>?',
      options: [
        'Parse is case-sensitive; TryParse is always case-insensitive',
        'Parse throws ArgumentException on an invalid name; TryParse returns false without throwing',
        'TryParse only works on [Flags] enums',
        'They are identical — just different overload signatures',
      ],
      answer: 1,
      explanation: '<code>Enum.Parse&lt;T&gt;</code> throws <code>ArgumentException</code> (or <code>OverflowException</code> for out-of-range integers) when the input is not a valid member name or value. <code>Enum.TryParse&lt;T&gt;</code> returns <code>false</code> and leaves the <code>out</code> parameter at its default — the safe choice for user input or serialised data you do not fully control.',
    },
  ];

  qna: QnaItem[] = [
    {
      q: 'Why should static classes avoid mutable state?',
      a: 'Static fields are shared across the entire application — they are effectively global variables. Mutating them introduces hidden dependencies between components, makes unit testing unreliable (test order matters), and creates race conditions in multi-threaded code. If you must hold shared state, use thread-safe constructs (<code>Interlocked</code>, <code>lock</code>, <code>ConcurrentDictionary</code>) and document the invariants carefully. Better yet, inject a singleton service via DI rather than reaching for static mutable state.',
    },
    {
      q: 'When should I use a [Flags] enum versus a list of booleans?',
      a: 'Use <code>[Flags]</code> when the combinations are finite and well-defined, when you need to store or transmit the combination as a single integer, or when the flags naturally map to bitmask operations. A <code>FilePermission</code> enum is a classic case — you can store it in a database column, compare and combine efficiently, and <code>ToString()</code> gives you a readable representation for free. A list of booleans is harder to compare, combine, and serialise as a single unit.',
    },
    {
      q: 'How are extension methods different from regular static methods?',
      a: 'Syntactically, you call an extension method as if it were an instance method on the target type: <code>"hello".ToTitleCase()</code> instead of <code>StringExtensions.ToTitleCase("hello")</code>. The compiler transforms the call — there is no difference at the IL level. Extension methods are discovered via <code>using</code> directives, so they do not pollute every namespace. They are a clean way to add functionality to types you do not own (BCL types, third-party types) or to organise helpers without cluttering the type itself.',
    },
    {
      q: 'Why use pattern matching with enums instead of if/else chains?',
      a: 'A <code>switch</code> expression on an enum is <em>exhaustive by default</em> — if you add a new member to the enum and forget to handle it, the compiler emits a warning (and at runtime the discard pattern <code>_</code> or missing arm throws). An <code>if/else</code> chain silently falls through. Switch expressions are also expressions — they return a value directly — making them more composable and readable than statement-based chains.',
    },
  ];
}
