import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-primary-constructor-parameter-capture-field-vs-fixed-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
    TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './primary-constructor-parameter-capture-field-vs-fixed.html',
  styleUrl: './primary-constructor-parameter-capture-field-vs-fixed.scss',
})
export class PrimaryConstructorParameterCaptureFieldVsFixedSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page mentions capture in one line — the mechanism is genuinely subtle',
      points: [
        'The main Constructors page states primary constructor parameters "can be captured in lambdas, property initializers, and method bodies — anywhere a field would normally be used," and separately notes you should "assign the parameter to a field explicitly" if you need a backing field. What it never explains is that the compiler ALREADY silently does something very close to this for you in some cases — and the exact rule for WHEN determines whether your code observes a FIXED value or a LIVE, mutable one.',
      ],
    },
    {
      heading: 'A property initializer captures the VALUE, once, at construction time',
      points: [
        'When a primary constructor parameter is used in a PROPERTY INITIALIZER — <code>public double X { get; } = x;</code> — the value is read and copied into the property exactly once, during construction. After that, the parameter itself plays no further role; the property holds an independent, fixed copy.',
        'This is exactly how the main page\'s own <code>Point(double x, double y)</code> struct example works — <code>X</code> and <code>Y</code> are ordinary immutable properties with their own storage, entirely disconnected from the constructor parameters after construction completes.',
      ],
    },
    {
      heading: 'A method body reference silently makes the parameter a compiler-generated field',
      points: [
        'When a primary constructor parameter is instead referenced directly inside a METHOD BODY (not a property initializer) — as in the main page\'s <code>OrderService(IOrderRepo repo, ...)</code> example, where <code>repo</code> is used inside <code>GetOrderAsync</code> — the C# compiler automatically generates a PRIVATE, COMPILER-SYNTHESIZED FIELD to hold that value, and rewrites every method-body reference to read from that field instead of a true parameter.',
        'This distinction matters because it means a primary constructor parameter referenced only in methods behaves EXACTLY like an explicitly-declared <code>private readonly</code> field would — the main page\'s own suggestion to "assign the parameter to a field explicitly" is often not strictly NECESSARY for read-only usage; the compiler already does the equivalent thing automatically whenever the parameter is used inside a method body at all.',
      ],
    },
    {
      heading: 'Where the distinction genuinely bites — closures and multiple property initializers',
      points: [
        'If the SAME primary constructor parameter is used BOTH in a property initializer AND inside a method body, you get TWO SEPARATE storage locations: the property\'s own field (set once, from the parameter, at construction) and the compiler-generated backing field for the method-body usage (also set once, from the SAME parameter, at construction) — they start out equal but are entirely independent going forward. Mutating one (if the property has a setter) does NOT affect the other.',
        'This is the subtle reason the main page\'s advice to declare an EXPLICIT backing field matters most when you need the value to be genuinely SHARED and consistently mutable across both a property and other methods — relying on the implicit compiler-generated field for method bodies, while ALSO exposing a separately-initialized mutable property, silently creates two independent copies that can drift out of sync.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Property initializer — a fixed, independent copy after construction',
      language: 'csharp',
      code: `// The main topic's own Point example — X and Y are property initializers:
public readonly struct Point(double x, double y)
{
    public double X { get; } = x;  // copies x's VALUE into X, once, at construction
    public double Y { get; } = y;  // copies y's VALUE into Y, once, at construction

    public double DistanceTo(Point other) =>
        Math.Sqrt(Math.Pow(X - other.X, 2) + Math.Pow(Y - other.Y, 2));
    // Note: DistanceTo reads X and Y (the PROPERTIES), never x/y (the
    // parameters) directly — by this point in the class body, x and y
    // as "live" parameters are no longer relevant; X and Y are their
    // own independent, already-copied storage.
}

var p = new Point(3, 4);
Console.WriteLine(p.X); // 3 — reads the PROPERTY's own copied value,
                         // entirely disconnected from the original
                         // constructor argument by this point`,
    },
    {
      label: 'Method-body reference — compiler silently generates a backing field',
      language: 'csharp',
      code: `// The main topic's own OrderService example:
public class OrderService(IOrderRepository repo, ILogger<OrderService> logger)
{
    public async Task<Order?> GetOrderAsync(int id)
    {
        logger.LogInformation("Fetching order {Id}", id);   // method-body usage
        return await repo.FindByIdAsync(id);                 // method-body usage
    }
}

// What the compiler actually generates is CONCEPTUALLY equivalent to:
public class OrderServiceDesugared
{
    // Compiler-synthesized private fields — you never write these
    // yourself, but they genuinely exist in the compiled output:
    private readonly IOrderRepository _repo_compilerGenerated;
    private readonly ILogger<OrderServiceDesugared> _logger_compilerGenerated;

    public OrderServiceDesugared(IOrderRepository repo, ILogger<OrderServiceDesugared> logger)
    {
        _repo_compilerGenerated   = repo;
        _logger_compilerGenerated = logger;
    }

    public async Task<Order?> GetOrderAsync(int id)
    {
        _logger_compilerGenerated.LogInformation("Fetching order {Id}", id);
        return await _repo_compilerGenerated.FindByIdAsync(id);
    }
}

// This is EXACTLY why the main topic's advice to "assign to a field
// explicitly" is often unnecessary for simple read-only DI usage — the
// compiler already does the functional equivalent automatically the
// moment a parameter is referenced inside a method body.`,
    },
    {
      label: 'The trap — same parameter used BOTH ways creates two independent copies',
      language: 'csharp',
      code: `public class Config(string environment)
{
    // Property initializer — copies "environment" into its OWN storage:
    public string Environment { get; private set; } = environment;

    public void LogStartup()
    {
        // References the ORIGINAL parameter directly — the compiler
        // generates a SEPARATE backing field for THIS usage, distinct
        // from the Environment property's own storage:
        Console.WriteLine($"Starting in {environment} mode"); // parameter usage
    }

    public void UpdateEnvironment(string newEnv)
    {
        Environment = newEnv; // mutates the PROPERTY's storage only
        // The compiler-generated field backing the "environment" usage
        // inside LogStartup() is NOT updated by this — it still holds
        // the ORIGINAL constructor argument value, forever.
    }
}

var config = new Config("Development");
config.UpdateEnvironment("Production");

Console.WriteLine(config.Environment);  // "Production" — the property was updated
config.LogStartup();                    // "Starting in Development mode" — the
// method-body reference to the raw "environment" parameter STILL sees
// the ORIGINAL construction-time value, because it reads from its OWN
// separate compiler-generated field, never touched by UpdateEnvironment.
// This is exactly the "two independent copies can drift" trap — the fix
// is to have LogStartup() read the Environment PROPERTY instead of the
// raw parameter, or to declare ONE explicit field and route everything
// through it consistently.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'Fix the <code>Config</code> class from the third example so that <code>LogStartup()</code> always reflects the CURRENT environment, even after <code>UpdateEnvironment</code> is called — without introducing a second copy of the state.',
    hint: 'The bug is that LogStartup references the raw primary constructor parameter "environment" (which gets its own fixed compiler-generated field), while UpdateEnvironment mutates a DIFFERENT storage location — the Environment property. Make LogStartup read from the SAME single source of truth that UpdateEnvironment writes to.',
    solution: `public class Config(string environment)
{
    public string Environment { get; private set; } = environment;

    public void LogStartup()
    {
        // Read from the PROPERTY, not the raw parameter — now both
        // LogStartup and UpdateEnvironment share the exact same single
        // storage location, eliminating the two-independent-copies trap:
        Console.WriteLine($"Starting in {Environment} mode");
    }

    public void UpdateEnvironment(string newEnv) => Environment = newEnv;
}

var config = new Config("Development");
config.UpdateEnvironment("Production");

Console.WriteLine(config.Environment); // "Production"
config.LogStartup();                   // "Starting in Production mode" — CORRECT now,
// because LogStartup reads the property (the single source of truth)
// instead of the raw constructor parameter (a separate, fixed copy).`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'the main topic\'s advice to "assign a primary constructor parameter to a field explicitly if you need a backing field" is always necessary for using the value inside method bodies.',
      reality: 'the C# compiler already automatically generates an equivalent private, readonly backing field whenever a primary constructor parameter is referenced inside a method body — the explicit field assignment is genuinely necessary only when you need the value exposed as a mutable, settable property, or need one single shared storage location across multiple usages.',
    },
    {
      thought: 'a primary constructor parameter used in a property initializer and the same parameter referenced directly in a method body both read from the same underlying storage.',
      reality: 'these are two entirely SEPARATE storage locations — the property initializer copies the value into the property\'s own field, while the method-body reference gets its own independent, compiler-generated backing field. Mutating the property later does not affect what the method-body reference sees.',
    },
    {
      thought: 'primary constructor parameters behave identically regardless of whether they are used in a property initializer or a method body.',
      reality: 'a property initializer captures a fixed VALUE copy once at construction, entirely disconnected from the parameter afterward; a method-body reference is silently promoted to a genuine, ongoing field read on every call — two structurally different mechanisms hidden behind the same simple syntax.',
    },
  ];
}
