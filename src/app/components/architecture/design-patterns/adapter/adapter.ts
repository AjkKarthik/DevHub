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
  { name: 'Intent',    type: 'keyword',   desc: 'Convert the interface of a class into another interface that clients expect — making incompatible interfaces work together.' },
  { name: 'Adapter',   type: 'class',     desc: 'Wraps the adaptee and translates calls from the target interface to the adaptee\'s API.' },
  { name: 'Target',    type: 'interface', desc: 'The interface the client expects to work with.' },
  { name: 'Adaptee',   type: 'class',     desc: 'The existing class with an incompatible interface that needs to be adapted.' },
  { name: 'Object Adapter', type: 'keyword', desc: 'Uses composition — wraps the adaptee. Preferred in .NET (no multiple inheritance).' },
  { name: 'Class Adapter',  type: 'keyword', desc: 'Uses inheritance — inherits from both target and adaptee. Requires multiple inheritance (C++ only).' },
];

const theory: TheoryPoint[] = [
  {
    heading: 'What is the Adapter Pattern?',
    points: [
      'Adapter (also called Wrapper) converts the interface of a class into another interface clients expect.',
      'It lets classes with incompatible interfaces work together without modifying their source code.',
      'The adapter sits between the client and the adaptee, translating calls from one interface to another.',
      'Common use case: integrating a legacy system or third-party library that cannot be changed.',
    ],
  },
  {
    heading: 'Object Adapter vs Class Adapter',
    points: [
      'Object Adapter uses composition — the adapter holds a reference to the adaptee and delegates calls.',
      'Class Adapter uses inheritance — adapter inherits from both the target and the adaptee (requires multiple inheritance).',
      '.NET does not support multiple inheritance of classes, so Object Adapter is the only option.',
      'Object Adapter is more flexible — can adapt multiple adaptees or swap the adaptee at runtime.',
    ],
  },
  {
    heading: 'Common Scenarios',
    points: [
      'Wrapping a legacy payment gateway with a modern IPaymentProvider interface.',
      'Adapting a third-party logging library (log4net, Serilog) to ILogger<T>.',
      'Bridging XML-based APIs to JSON-based clients.',
      'Making collections with custom iteration interfaces work with standard IEnumerable<T>.',
    ],
  },
  {
    heading: '.NET Examples',
    points: [
      'IEnumerable<T> adapters for IQueryable<T>, IObservable<T> — different iteration contracts.',
      'StreamReader wraps Stream and adapts byte-level I/O to text-level I/O.',
      'HttpMessageHandler adapters in HttpClient testing (MockHttpMessageHandler).',
      'DataAdapter in ADO.NET adapts between DataSet and database-specific commands.',
    ],
  },
  {
    heading: 'Object Adapter vs. Class Adapter',
    points: [
      'The object adapter (composition-based) wraps an instance of the incompatible interface as a private field and delegates calls to it — this is the more common and flexible approach, since it can adapt any implementation of the target interface, not just a specific one known at compile time.',
      'The class adapter (inheritance-based) extends the incompatible class directly — only possible in languages supporting multiple inheritance or when the adapter can extend the adaptee, and it locks the adapter to one specific concrete implementation rather than any interface-compatible one.',
      'Object adapters favor composition over inheritance, aligning with a broader design principle that generally favors flexible, swappable composition relationships over rigid, compile-time-fixed inheritance hierarchies.',
      'Adapters should be a deliberate, minimal translation layer at an integration boundary — accumulating business logic inside an adapter (beyond simple interface translation) blurs its purpose and makes it harder to reason about compared to keeping translation and business logic cleanly separated.',
    ],
  },
];

const codeTabs: CodeTab[] = [
  {
    label: 'Object Adapter',
    language: 'csharp',
    code: `// Target interface (what the client expects)
public interface IPaymentProvider
{
    Task<PaymentResult> ChargeAsync(string customerId, decimal amount, string currency);
}

// Adaptee (legacy or third-party — cannot be changed)
public class LegacyPaymentGateway
{
    public bool ProcessPayment(int clientId, double amount, string currencyCode) =>
        Console.WriteLine($"Legacy: charging {clientId} {amount} {currencyCode}") is null || true;
}

// Adapter — wraps the adaptee, implements the target interface
public class LegacyPaymentAdapter(LegacyPaymentGateway gateway) : IPaymentProvider
{
    public Task<PaymentResult> ChargeAsync(string customerId, decimal amount, string currency)
    {
        // Translate: string → int, decimal → double
        if (!int.TryParse(customerId, out int clientId))
            return Task.FromResult(PaymentResult.Failure("Invalid customer ID"));

        bool success = gateway.ProcessPayment(clientId, (double)amount, currency);
        return Task.FromResult(success ? PaymentResult.Success() : PaymentResult.Failure("Gateway error"));
    }
}

// Client only knows IPaymentProvider — unaware of legacy system
public class CheckoutService(IPaymentProvider payment)
{
    public async Task CheckoutAsync(string userId, decimal total)
    {
        var result = await payment.ChargeAsync(userId, total, "USD");
        if (!result.IsSuccess) throw new Exception(result.Error);
    }
}

// Wire up
builder.Services.AddSingleton<LegacyPaymentGateway>();
builder.Services.AddScoped<IPaymentProvider, LegacyPaymentAdapter>();`,
  },
  {
    label: 'Logging Adapter',
    language: 'csharp',
    code: `// Adapting a third-party logger to Microsoft.Extensions.Logging.ILogger
public class SerilogAdapter<T>(Serilog.ILogger serilog) : ILogger<T>
{
    public IDisposable? BeginScope<TState>(TState state) where TState : notnull => null;

    public bool IsEnabled(LogLevel logLevel) => logLevel switch
    {
        LogLevel.Debug       => serilog.IsEnabled(Serilog.Events.LogEventLevel.Debug),
        LogLevel.Information => serilog.IsEnabled(Serilog.Events.LogEventLevel.Information),
        LogLevel.Warning     => serilog.IsEnabled(Serilog.Events.LogEventLevel.Warning),
        LogLevel.Error       => serilog.IsEnabled(Serilog.Events.LogEventLevel.Error),
        _                    => false
    };

    public void Log<TState>(LogLevel logLevel, EventId eventId, TState state,
        Exception? exception, Func<TState, Exception?, string> formatter)
    {
        var message = formatter(state, exception);
        switch (logLevel)
        {
            case LogLevel.Error:   serilog.Error(exception, message); break;
            case LogLevel.Warning: serilog.Warning(message); break;
            default:               serilog.Information(message); break;
        }
    }
}`,
  },
];

const mistakes: CommonMistake[] = [
  {
    title: 'Modifying the adaptee instead of wrapping it',
    wrong: `// Adding IPaymentProvider to LegacyPaymentGateway directly
public class LegacyPaymentGateway : IPaymentProvider { ... }`,
    right: `// Wrap the adaptee; never modify code you don't own
public class LegacyPaymentAdapter(LegacyPaymentGateway gateway) : IPaymentProvider { ... }`,
    explanation: 'The Adapter pattern exists precisely so you do NOT modify the adaptee. Modifying a third-party class or legacy code breaks the pattern and creates maintenance problems on upgrades.',
  },
  {
    title: 'Putting business logic inside the adapter',
    wrong: `public Task<PaymentResult> ChargeAsync(string id, decimal amount, string currency)
{
    if (amount > 10000) ApplyFraudCheck(id); // business logic in adapter!
    return gateway.ProcessPayment(...);
}`,
    right: `// Adapter only translates the interface. Business logic belongs in the service layer.`,
    explanation: 'Adapters should be thin translation layers only. Adding business logic makes them hard to test, violates SRP, and hides logic in an unexpected place.',
  },
  {
    title: 'Not handling translation edge cases',
    wrong: `int clientId = int.Parse(customerId); // throws if non-numeric`,
    right: `if (!int.TryParse(customerId, out int clientId))
    return Task.FromResult(PaymentResult.Failure("Invalid customer ID"));`,
    explanation: 'The adapter must handle all translation edge cases gracefully. A mismatch between string IDs and int IDs is a classic adaptation problem that requires explicit validation.',
  },
  {
    title: 'Creating a new adaptee inside the adapter',
    wrong: `public LegacyPaymentAdapter() { _gateway = new LegacyPaymentGateway(); }`,
    right: `public LegacyPaymentAdapter(LegacyPaymentGateway gateway) { _gateway = gateway; }`,
    explanation: 'Inject the adaptee via constructor. Creating it inside the adapter makes the adapter impossible to test without the real adaptee and couples lifetime management.',
  },
];

const challenge: Challenge = {
  title: 'Old Storage Adapter',
  language: 'typescript',
  description: `You have a legacy FileStorage class with readFile(path)/writeFile(path, data) methods.
Your system expects an IStorage interface with load(key)/save(key, data).
Implement a FileStorageAdapter that adapts FileStorage to IStorage.`,
  hints: [
    'Adapter wraps FileStorage via constructor injection',
    'load(key) calls readFile(key)',
    'save(key, data) calls writeFile(key, data)',
  ],
  starterCode: `interface IStorage {
  load(key: string): string;
  save(key: string, data: string): void;
}

class FileStorage {
  readFile(path: string): string { return \`data from \${path}\`; }
  writeFile(path: string, data: string): void { console.log(\`Written to \${path}: \${data}\`); }
}

// TODO: implement FileStorageAdapter`,
  solution: `interface IStorage {
  load(key: string): string;
  save(key: string, data: string): void;
}

class FileStorage {
  readFile(path: string): string { return \`data from \${path}\`; }
  writeFile(path: string, data: string): void { console.log(\`Written to \${path}: \${data}\`); }
}

class FileStorageAdapter implements IStorage {
  constructor(private fs: FileStorage) {}
  load(key: string): string { return this.fs.readFile(key); }
  save(key: string, data: string): void { this.fs.writeFile(key, data); }
}

const storage: IStorage = new FileStorageAdapter(new FileStorage());
storage.save('config.json', '{"theme":"dark"}');
console.log(storage.load('config.json'));`,
};

const quiz: QuizQuestion[] = [
  {
    q: 'What is the Adapter pattern\'s primary purpose?',
    options: [
      'Adding new functionality to an existing object',
      'Converting one interface into another that clients expect',
      'Controlling access to an object',
      'Defining a family of algorithms',
    ],
    answer: 1,
    explanation: 'Adapter converts the interface of an existing class (adaptee) into the interface the client expects (target). It is a translation layer — no new functionality, just interface reconciliation.',
  },
  {
    q: 'Why is Object Adapter preferred over Class Adapter in .NET?',
    options: [
      'Object Adapter is faster at runtime',
      '.NET does not support multiple class inheritance, making Class Adapter impossible',
      'Object Adapter uses less memory',
      'Class Adapter is deprecated in .NET 6+',
    ],
    answer: 1,
    explanation: 'Class Adapter requires inheriting from both the target and the adaptee simultaneously — which is impossible in .NET (single inheritance only). Object Adapter uses composition instead, which is fully supported.',
  },
  {
    q: 'StreamReader in .NET is an example of which pattern?',
    options: ['Decorator', 'Adapter', 'Facade', 'Proxy'],
    answer: 1,
    explanation: 'StreamReader wraps (adapts) a Stream — converting its byte-oriented interface to a text-oriented interface (ReadLine(), ReadToEnd()). It is a textbook Object Adapter.',
  },
  { q: 'What is the Adapter pattern and what problem does it solve?', options: ['It adapts a class to use less memory', 'It allows classes with incompatible interfaces to work together by wrapping one class with another that translates the interface', 'It adapts a synchronous interface to an asynchronous one', 'It converts data formats between two systems'], answer: 1, explanation: 'The Adapter (or Wrapper) pattern allows classes with incompatible interfaces to collaborate. A client expects interface A but you have an existing class with interface B. An Adapter implements interface A and delegates to an instance of B, translating calls. Example: your application expects an ILogger interface but you want to use an external logging library with a different API. An adapter wraps the library and implements ILogger, translating your logger calls to the library API.' },
  { q: 'What is the difference between a class adapter and an object adapter?', options: ['Class adapters use interfaces; object adapters use abstract classes', 'Class adapters use inheritance to extend the adaptee; object adapters use composition by holding a reference to the adaptee', 'Class adapters work at compile time; object adapters at runtime', 'Object adapters are slower because they add an extra method call'], answer: 1, explanation: 'Class adapter: the adapter inherits from both the target interface and the adaptee class (requires multiple inheritance, not possible in Java or C# single-inheritance languages). Object adapter: the adapter implements the target interface and holds a reference to the adaptee instance, delegating method calls. Object adapter is more flexible because it can adapt a class hierarchy, not just a single class, and works in single-inheritance languages. Object adapters also allow the adapter to override behavior before delegating to the adaptee.' },
  { q: 'When should you use Adapter versus Facade?', options: ['Use Adapter when simplifying a complex subsystem; use Facade when translating between incompatible interfaces', 'Use Adapter when you need to translate between two incompatible interfaces; use Facade when you need to provide a simplified interface to a complex subsystem', 'They are interchangeable; choose based on naming preference', 'Adapter works with single classes; Facade works with entire packages'], answer: 1, explanation: 'Adapter translates between two incompatible existing interfaces without changing their behavior. The goal is compatibility: make a square peg fit a round hole by wrapping it. Facade provides a simplified interface to a complex subsystem, hiding internal complexity. The goal is simplification: wrap a library with 50 methods behind a simple 5-method interface for common operations. Adapter does not simplify, it translates. Facade does not necessarily translate between incompatible interfaces; it just hides complexity.' },
];

const qna: QnaItem[] = [
  {
    q: 'Can a class be both an Adapter and expose a Facade-like simplified interface at the same time?',
    a: 'Yes — the two roles are not mutually exclusive, and a well-designed wrapper class around a third-party SDK often does both simultaneously: it adapts the SDK\'s specific method signatures to match an interface your application already expects (Adapter role), while also collapsing what might be several SDK calls into one simpler method your callers actually need (Facade role). Whether to think of it as "an Adapter" or "a Facade" in that case is mostly about which aspect you are emphasizing in the conversation — the code itself can legitimately serve both purposes at once.',
  },
  {
    q: 'Should adapters be registered in DI?',
    a: 'Yes — register the adapter as the implementation of the target interface. The adaptee (legacy class) is also registered and injected into the adapter. This keeps the client fully decoupled from both the adapter and the adaptee.',
  },
  { q: 'How is the Adapter pattern used when integrating third-party libraries?', a: 'Third-party libraries often have APIs that do not match your application interface. Instead of sprinkling third-party API calls throughout the codebase, wrap the library in an adapter that implements your own interface. This isolates the third-party dependency to one place. Benefits: if you switch the library, you only update the adapter, not every call site. Unit tests can inject a mock adapter instead of the real library. Your application code is not polluted with third-party types and naming conventions. The adapter pattern is especially valuable for payment gateways, email services, analytics SDKs, and any third-party integration that might change vendors.' },
  { q: 'What is a two-way adapter and when is it needed?', a: 'A standard adapter is one-directional: adapt interface A to interface B. A two-way adapter implements both interfaces and delegates to either underlying implementation based on the caller. Needed when two systems must collaborate and both need to call each other using their own preferred interface. Example: integrating a legacy system and a new system where each must use the other as if it speaks the native interface. The adapter translates calls in both directions. Two-way adapters are complex and should be used only when bidirectional integration is genuinely required; often architectural refactoring is preferable to a two-way adapter.' },
  { q: 'How does the Adapter pattern differ from Dependency Injection?', a: 'They solve different problems. The Adapter pattern solves an interface compatibility problem: class A and class B have different method signatures and the adapter makes them compatible. Dependency Injection solves a coupling and testability problem: instead of a class creating its own dependencies with new, inject them via constructor or properties so they can be swapped for mocks in tests and different implementations in different environments. They work together: define an interface for a dependency, create an adapter that implements the interface and wraps a third-party library, and inject the adapter via DI. The adapter handles the interface translation; DI handles the wiring.' },
  { q: 'What is the Adapter pattern implementation in a REST API integration context?', a: 'When calling external REST APIs, an adapter wraps the HTTP client and external response models. The adapter implements your internal interface (IPaymentGateway) and internally makes HTTP calls to the payment provider API, converting the HTTP response DTO to your domain payment result type. This keeps HTTP details, response mapping, and error handling in one place. The rest of the application uses IPaymentGateway and does not know it is making HTTP calls. In tests, inject a mock IPaymentGateway without any HTTP. To switch payment providers, create a new adapter implementing IPaymentGateway without changing application code.' },
];

const revision: RevisionSummary = {
  oneLiner: 'Adapter wraps an incompatible class (adaptee) and translates its interface into the one clients expect — without modifying either the client or the adaptee.',
  mustKnow: [
    'Adapter = wrapper that translates one interface to another',
    'Object Adapter (composition) is used in .NET; Class Adapter requires multiple inheritance',
    'Inject the adaptee — never create it inside the adapter',
    'Adapters must be thin: translation only, no business logic',
    '.NET examples: StreamReader, DataAdapter, HttpMessageHandler wrappers',
  ],
  interviewFocus: [
    'Adapter vs Decorator vs Facade — what does each change?',
    'Why is Object Adapter preferred in C#?',
    'How would you adapt a legacy payment gateway to a modern interface?',
  ],
};

@Component({
  selector: 'app-dp-adapter',
  standalone: true,
  imports: [CommonModule, PageMetaComponent, QuickRefComponent, TheoryBlockComponent,
    CodeBlockComponent, CommonMistakesComponent, ChallengeBlockComponent,
    QuizBlockComponent, QnaBlockComponent, RevisionCardComponent, PageCompleteComponent],
  templateUrl: './adapter.html',
  styleUrl: './adapter.scss',
})
export class DpAdapter {
  quickRef = quickRef; theory = theory; codeTabs = codeTabs;
  mistakes = mistakes; challenge = challenge; quiz = quiz; qna = qna; revision = revision;
}
