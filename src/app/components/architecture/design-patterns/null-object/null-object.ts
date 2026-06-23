import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PageMetaComponent } from '../../../shared/page-meta/page-meta';
import { QuickRefComponent, QuickRefItem } from '../../../shared/quick-ref/quick-ref';
import { TheoryBlockComponent, TheoryPoint } from '../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../shared/code-block/code-block';
import { CommonMistakesComponent, CommonMistake } from '../../../shared/common-mistakes/common-mistakes';
import { ChallengeBlockComponent, Challenge } from '../../../shared/challenge-block/challenge-block';
import { QuizBlockComponent, QuizQuestion } from '../../../shared/quiz-block/quiz-block';
import { QnaBlockComponent, QnaItem } from '../../../shared/qna-block/qna-block';
import { RevisionCardComponent, RevisionSummary } from '../../../shared/revision-card/revision-card';
import { PageCompleteComponent } from '../../../shared/page-complete/page-complete';

const quickRef: QuickRefItem[] = [
  { name: 'Intent',       type: 'keyword',   desc: 'Provide a default do-nothing object that implements an interface — eliminating null checks throughout the codebase.' },
  { name: 'Null Object',  type: 'class',     desc: 'Implements the same interface as the real object but with no-op or default behaviour.' },
  { name: 'Eliminates',   type: 'keyword',   desc: 'Replaces `if (x != null) x.DoSomething()` with just `x.DoSomething()` — always safe.' },
  { name: 'Optional<T>',  type: 'class',     desc: 'C# nullable reference types and ? operator serve a similar purpose — but Null Object is for behavioural no-ops, not absence.' },
  { name: 'NullLogger<T>', type: 'class',    desc: '.NET built-in Null Object for ILogger<T> — does nothing but satisfies the interface.' },
  { name: 'vs null',      type: 'keyword',   desc: 'null causes NullReferenceException; Null Object silently does nothing — callers need no defensive checks.' },
];

const theory: TheoryPoint[] = [
  {
    heading: 'What is the Null Object Pattern?',
    points: [
      'Null Object provides a default object with do-nothing implementations for an interface.',
      'Callers use the Null Object exactly like a real object — no null checks needed.',
      'When "nothing" should happen, inject a Null Object instead of null.',
      'Eliminates the defensive `if (x != null)` pattern scattered throughout the codebase.',
    ],
  },
  {
    heading: 'When to Use Null Object',
    points: [
      'Optional dependencies: logging is optional — inject NullLogger when logging is not configured.',
      'Default behaviour: a discount of zero, a no-op notification, an empty collection.',
      'Testing: inject Null Objects for dependencies not relevant to a specific test.',
      'Feature flags: inject a Null Object when a feature is disabled instead of conditional code.',
    ],
  },
  {
    heading: 'Null Object vs null vs Optional',
    points: [
      'null: absence of a reference — any call throws NullReferenceException. Forces callers to check.',
      'Null Object: a valid object with no-op behaviour — callers need no checks; errors are silent.',
      'C# nullable (T?): expresses "this might be absent" at the type level — callers must handle the absent case.',
      'Choose: nullable T? when absence must be handled explicitly; Null Object when "nothing happens" is a valid default.',
    ],
  },
  {
    heading: '.NET Built-In Null Objects',
    points: [
      'NullLogger<T> and NullLoggerFactory: ILogger implementations that discard all log calls.',
      'Stream.Null: a Stream that reads 0 bytes and discards writes — Null Object for I/O.',
      'NullProgress<T>: IProgress<T> implementation that ignores all progress reports.',
      'Array.Empty<T>(): returns an empty array — a Null Object for collections.',
    ],
  },
];

const codeTabs: CodeTab[] = [
  {
    label: 'Null Logger',
    language: 'csharp',
    code: `// Interface
public interface ILogger
{
    void Log(string level, string message);
    void Error(Exception ex, string message);
}

// Real implementation
public class ConsoleLogger : ILogger
{
    public void Log(string level, string message) =>
        Console.WriteLine($"[{level}] {DateTime.UtcNow:HH:mm:ss} {message}");

    public void Error(Exception ex, string message) =>
        Console.Error.WriteLine($"[ERROR] {message}: {ex.Message}");
}

// Null Object — do-nothing implementation
public sealed class NullLogger : ILogger
{
    public static readonly NullLogger Instance = new(); // singleton
    private NullLogger() { }

    public void Log(string level, string message)  { } // no-op
    public void Error(Exception ex, string message) { } // no-op
}

// Service — no null checks needed; NullLogger is always safe
public class OrderService(ILogger logger)
{
    public void ProcessOrder(Order order)
    {
        logger.Log("INFO", $"Processing {order.Id}"); // safe — even if NullLogger
        // business logic...
        logger.Log("INFO", $"Completed {order.Id}");
    }
}

// Register real logger or null logger based on config
builder.Services.AddSingleton<ILogger>(
    configuration.GetValue<bool>("Logging:Enabled")
        ? new ConsoleLogger()
        : NullLogger.Instance);

// .NET built-in Null Object equivalents:
// ILogger<T>  → NullLogger<T>.Instance
// IProgress<T> → Progress<T> or NullProgress
// Stream      → Stream.Null`,
  },
  {
    label: 'Null Discount & Collection',
    language: 'csharp',
    code: `// Null Object for optional discount
public interface IDiscount
{
    decimal Apply(decimal price);
    string  Description { get; }
}

public class PercentageDiscount(decimal percent) : IDiscount
{
    public string  Description => $"{percent}% off";
    public decimal Apply(decimal price) => price * (1 - percent / 100);
}

// Null Object — no discount, no null checks
public sealed class NoDiscount : IDiscount
{
    public static readonly NoDiscount Instance = new();
    private NoDiscount() { }

    public string  Description => "No discount";
    public decimal Apply(decimal price) => price; // identity — returns price unchanged
}

// Client — always calls .Apply(); never checks for null
public class Checkout(IDiscount discount)
{
    public decimal CalculateTotal(decimal price) => discount.Apply(price);
    public string  DiscountNote              => discount.Description;
}

// No discount case — no null, no if statement
var checkout = new Checkout(customer.HasDiscount
    ? new PercentageDiscount(customer.DiscountPct)
    : NoDiscount.Instance);

// Null Object for empty collection
public class ProductRepository
{
    public IReadOnlyList<Product> GetRecommendations(int userId)
    {
        var products = _db.GetRecs(userId);
        return products ?? Array.Empty<Product>(); // Array.Empty<T>() is Null Object
    }
}

// Caller uses LINQ safely — no null check for the list
var recs = repo.GetRecommendations(userId);
foreach (var p in recs) Display(p); // empty list → zero iterations, no crash`,
  },
];

const mistakes: CommonMistake[] = [
  {
    title: 'Null Object silently swallowing errors that should be reported',
    wrong: `public class NullPaymentGateway : IPaymentGateway
{
    public PaymentResult Charge(decimal amount) => PaymentResult.Success(); // silently "succeeds"!
}`,
    right: `// Null Object for OPTIONAL concerns (logging, metrics, notifications)
// NOT for critical operations (payments, database writes) where failure must be visible`,
    explanation: 'Null Objects are appropriate for optional cross-cutting concerns. Using a Null Object for payment or persistence makes failures invisible — the system thinks it succeeded. Reserve Null Object for genuinely optional no-op scenarios.',
  },
  {
    title: 'Creating a new Null Object instance per call',
    wrong: `builder.Services.AddScoped<ILogger>(_ => new NullLogger()); // new instance per scope`,
    right: `builder.Services.AddSingleton<ILogger>(NullLogger.Instance); // shared singleton`,
    explanation: 'Null Objects are stateless — they always behave the same way. Use a singleton instance (static readonly field) to avoid creating thousands of identical objects.',
  },
  {
    title: 'Adding logic to a Null Object',
    wrong: `public class NullLogger : ILogger
{
    private int _skipped;
    public void Log(string lvl, string msg) { _skipped++; } // state in null object!
}`,
    right: `public void Log(string lvl, string msg) { } // pure no-op — no state, no logic`,
    explanation: 'Null Objects must be no-ops. Adding logic (counting, storing, transforming) makes the "null" version functional — it is no longer a null object, it is a special-purpose implementation. Keep it empty.',
  },
  {
    title: 'Using Null Object when the caller needs to know about absence',
    wrong: `IUser user = userRepo.GetById(id) ?? NullUser.Instance;
// caller never knows if the user was found or not — cannot differentiate`,
    right: `User? user = userRepo.GetById(id);
if (user is null) return NotFound(); // absence must be handled explicitly`,
    explanation: 'Null Object is wrong when absence has different business meaning than presence. Use nullable (T?) when callers must distinguish "found" from "not found". Null Object is only appropriate when "nothing happens" and "something happens" are equivalent from the caller\'s perspective.',
  },
];

const challenge: Challenge = {
  title: 'Null Notification Service',
  language: 'typescript',
  description: `Implement Null Object for a notification service.
INotificationService has send(userId, message) and sendBulk(userIds, message).
RealNotificationService logs the sends.
NullNotificationService is a no-op singleton.
OrderProcessor accepts INotificationService — works with both.`,
  hints: [
    'NullNotificationService methods are empty bodies',
    'Use a static instance property for the singleton',
    'OrderProcessor never checks if the service is null',
  ],
  starterCode: `interface INotificationService {
  send(userId: string, message: string): void;
  sendBulk(userIds: string[], message: string): void;
}

class RealNotificationService implements INotificationService {
  send(userId: string, message: string): void {
    console.log(\`Sending to \${userId}: \${message}\`);
  }
  sendBulk(userIds: string[], message: string): void {
    userIds.forEach(id => this.send(id, message));
  }
}

// TODO: NullNotificationService
// TODO: OrderProcessor(notifier: INotificationService)`,
  solution: `interface INotificationService {
  send(userId: string, message: string): void;
  sendBulk(userIds: string[], message: string): void;
}

class RealNotificationService implements INotificationService {
  send(userId: string, message: string): void {
    console.log(\`Sending to \${userId}: \${message}\`);
  }
  sendBulk(userIds: string[], message: string): void {
    userIds.forEach(id => this.send(id, message));
  }
}

class NullNotificationService implements INotificationService {
  static readonly instance = new NullNotificationService();
  private constructor() {}
  send(_userId: string, _message: string): void {}       // no-op
  sendBulk(_userIds: string[], _message: string): void {} // no-op
}

class OrderProcessor {
  constructor(private notifier: INotificationService) {}

  processOrder(orderId: string, userId: string): void {
    console.log(\`Processing order \${orderId}\`);
    this.notifier.send(userId, \`Order \${orderId} confirmed!\`);
  }
}

// With notifications
const proc1 = new OrderProcessor(new RealNotificationService());
proc1.processOrder('ORD-1', 'user-42'); // Sending to user-42: ...

// Without notifications — no null check needed
const proc2 = new OrderProcessor(NullNotificationService.instance);
proc2.processOrder('ORD-2', 'user-43'); // silent — no crash`,
};

const quiz: QuizQuestion[] = [
  {
    q: 'What problem does Null Object solve?',
    options: [
      'NullReferenceExceptions from dereferencing null',
      'Defensive null checks (`if (x != null)`) scattered throughout client code',
      'Memory leaks from uncollected objects',
      'Circular dependencies between services',
    ],
    answer: 1,
    explanation: 'Null Object eliminates defensive null checks. Instead of `if (logger != null) logger.Log(...)` everywhere, you inject NullLogger — always safe to call with no checks needed. NullReferenceException is also avoided, but the primary goal is removing null-check noise.',
  },
  {
    q: 'NullLogger<T> in .NET is an example of which pattern?',
    options: ['Proxy', 'Decorator', 'Null Object', 'Strategy'],
    answer: 2,
    explanation: 'NullLogger<T> is .NET\'s built-in Null Object for ILogger<T>. All log methods are no-ops. It allows code that depends on ILogger<T> to work unchanged when logging is disabled, without null checks.',
  },
  {
    q: 'When is Null Object inappropriate?',
    options: [
      'When logging is optional',
      'When the caller must know whether the operation actually succeeded or did nothing',
      'When testing code that uses an optional notifier',
      'When implementing a feature flag that disables a non-critical feature',
    ],
    answer: 1,
    explanation: 'Null Object is wrong when "nothing happened" and "it happened" have different meanings to the caller. For payment processing, "silently succeed" is dangerous. Use nullable (T?) when callers must distinguish presence from absence.',
  },
];

const qna: QnaItem[] = [
  {
    q: 'How does Null Object differ from C# nullable reference types (T?)?',
    a: 'Nullable T? is a type-system mechanism that forces callers to handle the "absent" case explicitly. Null Object is a behavioural pattern: the "absent" case is represented by a real object that does nothing — callers need no special handling. Use T? when absence must be handled differently; Null Object when "nothing happens" is the right default.',
  },
  {
    q: 'Should Null Objects be singletons?',
    a: 'Yes — Null Objects are stateless (no-ops have nothing to store), so all callers can share the same instance. Use a static readonly Instance property to enforce this. It avoids allocating new no-op objects on every call or registration.',
  },
];

const revision: RevisionSummary = {
  oneLiner: 'Null Object provides a no-op implementation of an interface — eliminating defensive null checks by making "nothing happens" a valid object behaviour.',
  mustKnow: [
    'Null Object implements the interface with empty/default methods — callers need no null checks',
    'Use for optional dependencies: logging, notifications, metrics, feature flags',
    'NOT for critical operations where failure must be visible (payments, persistence)',
    'Should be a singleton — stateless, always the same instance',
    '.NET built-ins: NullLogger<T>, Stream.Null, NullProgress<T>, Array.Empty<T>()',
  ],
  interviewFocus: [
    'Null Object vs null vs nullable T? — when to use each?',
    'When is Null Object dangerous (should NOT be used)?',
    'How does NullLogger<T> in .NET demonstrate this pattern?',
  ],
};

@Component({
  selector: 'app-dp-null-object',
  standalone: true,
  imports: [CommonModule, PageMetaComponent, QuickRefComponent, TheoryBlockComponent,
    CodeBlockComponent, CommonMistakesComponent, ChallengeBlockComponent,
    QuizBlockComponent, QnaBlockComponent, RevisionCardComponent, PageCompleteComponent],
  templateUrl: './null-object.html',
  styleUrl: './null-object.scss',
})
export class DpNullObject {
  quickRef = quickRef; theory = theory; codeTabs = codeTabs;
  mistakes = mistakes; challenge = challenge; quiz = quiz; qna = qna; revision = revision;
}
