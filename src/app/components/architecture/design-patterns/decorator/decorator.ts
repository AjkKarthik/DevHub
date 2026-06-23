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
  { name: 'Intent',      type: 'keyword',   desc: 'Attach additional responsibilities to an object dynamically — a flexible alternative to subclassing for extending functionality.' },
  { name: 'Component',   type: 'interface', desc: 'Interface shared by both the real object and all decorators.' },
  { name: 'ConcreteComponent', type: 'class', desc: 'The original object being decorated — contains the core behavior.' },
  { name: 'Decorator',   type: 'class',     desc: 'Wraps a Component, adds behavior before/after delegating to the wrapped component.' },
  { name: 'Stacking',    type: 'keyword',   desc: 'Decorators can be stacked in any order: Logging(Retry(Caching(RealService))).' },
  { name: '[Decorator]', type: 'decorator', desc: 'C# attributes are NOT the Decorator pattern — they are metadata annotations.' },
];

const theory: TheoryPoint[] = [
  {
    heading: 'What is the Decorator Pattern?',
    points: [
      'Decorator attaches additional responsibilities to an object dynamically at runtime.',
      'A Decorator wraps the original object, adds behavior before/after the call, then delegates to the wrapped object.',
      'Both the decorator and the original object implement the same Component interface — callers cannot tell them apart.',
      'Decorators can be stacked in any order and combination: Logging(Retry(Caching(Real))).',
    ],
  },
  {
    heading: 'Why Decorator Instead of Inheritance?',
    points: [
      'Inheritance is static — you commit to the combination at compile time (LoggingRetryingCachingService).',
      'Decorator is dynamic — combine features at runtime by wrapping in any order.',
      'Inheritance causes combinatorial explosion: 3 behaviors × many classes = many subclasses.',
      'Open/Closed Principle: add new behaviors (new decorators) without modifying existing classes.',
    ],
  },
  {
    heading: 'Cross-Cutting Concerns',
    points: [
      'Logging, caching, retry, rate limiting, circuit breaker, validation — all are classic decorator use cases.',
      'Each concern lives in its own decorator class — single responsibility for each.',
      'The decorators can be registered and composed in DI without changing the real service.',
      'Polly (resilience library) uses decorator-style policies that wrap HttpMessageHandler.',
    ],
  },
  {
    heading: '.NET Examples',
    points: [
      'Stream decorators: GZipStream(BufferedStream(FileStream)) — each adds compression, buffering.',
      'ASP.NET Core middleware: each middleware wraps the next — request decorator chain.',
      'CachingRepository wrapping IRepository — adds cache without touching the DB layer.',
      'Polly: ResiliencePipeline wrapping HttpMessageHandler with retry, circuit breaker.',
    ],
  },
];

const codeTabs: CodeTab[] = [
  {
    label: 'Service Decorators',
    language: 'csharp',
    code: `// Component interface
public interface IOrderService
{
    Task<OrderResult> PlaceOrderAsync(Order order);
}

// Concrete component
public class OrderService : IOrderService
{
    public async Task<OrderResult> PlaceOrderAsync(Order order)
    {
        // core business logic
        await SaveOrderAsync(order);
        return OrderResult.Success(order.Id);
    }
}

// Logging decorator
public class LoggingOrderService(IOrderService inner, ILogger<LoggingOrderService> logger)
    : IOrderService
{
    public async Task<OrderResult> PlaceOrderAsync(Order order)
    {
        logger.LogInformation("Placing order {Id}", order.Id);
        var result = await inner.PlaceOrderAsync(order);
        logger.LogInformation("Order {Id} result: {Status}", order.Id, result.Status);
        return result;
    }
}

// Validation decorator
public class ValidatingOrderService(IOrderService inner) : IOrderService
{
    public async Task<OrderResult> PlaceOrderAsync(Order order)
    {
        if (order.Items.Count == 0)
            return OrderResult.Failure("Order must have at least one item");
        if (order.Total <= 0)
            return OrderResult.Failure("Order total must be positive");
        return await inner.PlaceOrderAsync(order);
    }
}

// DI registration — stack decorators
builder.Services.AddScoped<OrderService>();
builder.Services.AddScoped<IOrderService>(sp =>
    new LoggingOrderService(
        new ValidatingOrderService(
            sp.GetRequiredService<OrderService>()),
        sp.GetRequiredService<ILogger<LoggingOrderService>>()));`,
  },
  {
    label: 'Stream Decorators',
    language: 'csharp',
    code: `// .NET's Stream class is the canonical Decorator example
// Each Stream decorator wraps another stream and adds one concern

// Stacking decorators — any combination, any order
using var fileStream       = File.OpenWrite("output.bin");
using var bufferedStream   = new BufferedStream(fileStream, 8192);   // adds buffering
using var gzipStream       = new GZipStream(bufferedStream, CompressionMode.Compress); // adds compression
using var cryptoStream     = new CryptoStream(gzipStream, encryptor, CryptoStreamMode.Write); // adds encryption
using var writer           = new StreamWriter(cryptoStream); // text-over-binary adapter

// Client writes text — it travels through all layers transparently
await writer.WriteLineAsync("This data is buffered, compressed, then encrypted.");

// Same interface (Stream) at every layer — client code stays identical
// regardless of which decorators are wrapped around it`,
  },
];

const mistakes: CommonMistake[] = [
  {
    title: 'Forgetting to delegate to the inner component',
    wrong: `public async Task<OrderResult> PlaceOrderAsync(Order order)
{
    logger.LogInformation("Placing order...");
    // forgot: return await inner.PlaceOrderAsync(order);
    return OrderResult.Success(order.Id); // skips the real service!
}`,
    right: `public async Task<OrderResult> PlaceOrderAsync(Order order)
{
    logger.LogInformation("Placing order...");
    return await inner.PlaceOrderAsync(order); // always delegate
}`,
    explanation: 'The decorator MUST delegate to the wrapped component — otherwise it replaces the real behavior instead of augmenting it. This is the most common Decorator bug.',
  },
  {
    title: 'Confusing C# [Decorator] attributes with the Decorator pattern',
    wrong: `[Cached] [Logged]
public class OrderService { } // not the Decorator pattern`,
    right: `// Decorator pattern = wrapping objects at runtime
// C# attributes = compile-time metadata (AOP is separate from GoF Decorator)`,
    explanation: 'C# attributes (even AOP-style ones like Postsharp or source generators) are NOT the Decorator pattern. GoF Decorator is a runtime object-wrapping pattern using the same interface.',
  },
  {
    title: 'Using Decorator when subclassing is simpler',
    wrong: `// Only one variant exists, no stacking needed
public class LoggingService(IService inner) : IService { ... }`,
    right: `// If you'll never stack or vary combinations, subclassing or partial classes are simpler`,
    explanation: 'Decorator shines when you need arbitrary combinations and stacking. For a single fixed cross-cutting concern on one class, a simpler approach may be more readable.',
  },
  {
    title: 'Breaking the Component interface contract in a decorator',
    wrong: `public async Task<OrderResult> PlaceOrderAsync(Order order)
{
    // Adds a parameter the interface doesn't have
    return await inner.PlaceOrderAsync(order, userId: _userId);
}`,
    right: `// Decorators must implement the Component interface exactly
// Extra context must come from the decorator's own constructor, not the method signature`,
    explanation: 'Decorators must honour the Component contract exactly — same method signatures, same return types, same exceptions. Extra data must be injected at construction time.',
  },
];

const challenge: Challenge = {
  title: 'Coffee Decorator',
  language: 'typescript',
  description: `Implement a classic coffee decorator.
IBeverage has description() and cost().
Espresso is the base. MilkDecorator and SugarDecorator add to cost and description.
Show: new SugarDecorator(new MilkDecorator(new Espresso())).description()`,
  hints: [
    'Each decorator wraps an IBeverage and calls inner.cost() + own cost',
    'description() prepends or appends to inner.description()',
    'Decorators can be stacked in any order',
  ],
  starterCode: `interface IBeverage {
  description(): string;
  cost(): number;
}

class Espresso implements IBeverage {
  description() { return 'Espresso'; }
  cost() { return 1.99; }
}

abstract class BeverageDecorator implements IBeverage {
  constructor(protected inner: IBeverage) {}
  abstract description(): string;
  abstract cost(): number;
}

// TODO: MilkDecorator (+0.25, '+ Milk')  SugarDecorator (+0.10, '+ Sugar')`,
  solution: `interface IBeverage {
  description(): string;
  cost(): number;
}

class Espresso implements IBeverage {
  description() { return 'Espresso'; }
  cost() { return 1.99; }
}

abstract class BeverageDecorator implements IBeverage {
  constructor(protected inner: IBeverage) {}
  abstract description(): string;
  abstract cost(): number;
}

class MilkDecorator extends BeverageDecorator {
  description() { return this.inner.description() + ', Milk'; }
  cost() { return this.inner.cost() + 0.25; }
}

class SugarDecorator extends BeverageDecorator {
  description() { return this.inner.description() + ', Sugar'; }
  cost() { return this.inner.cost() + 0.10; }
}

const drink = new SugarDecorator(new MilkDecorator(new Espresso()));
console.log(drink.description()); // Espresso, Milk, Sugar
console.log(drink.cost().toFixed(2)); // 2.34`,
};

const quiz: QuizQuestion[] = [
  {
    q: 'How does Decorator differ from inheritance for adding behavior?',
    options: [
      'They are equivalent — Decorator is just a runtime version of inheritance',
      'Decorator is dynamic — combine features at runtime in any order; inheritance is static at compile time',
      'Decorator requires modifying the original class; inheritance does not',
      'Decorator only works with abstract classes; inheritance works with interfaces',
    ],
    answer: 1,
    explanation: 'Inheritance commits to a combination at compile time (LoggingRetryService). Decorator composes behaviors at runtime — Logging(Retry(Service)), Retry(Logging(Service)) — and each behavior is in its own class.',
  },
  {
    q: 'GZipStream(BufferedStream(FileStream)) in .NET is an example of:',
    options: ['Chain of Responsibility', 'Composite', 'Decorator', 'Proxy'],
    answer: 2,
    explanation: 'Stream decorators in .NET are the canonical Decorator example. GZipStream adds compression, BufferedStream adds buffering — both wrap a Stream and implement Stream. Each layer adds one concern.',
  },
  {
    q: 'What MUST every decorator method do?',
    options: [
      'Override the component\'s behavior completely',
      'Delegate to the wrapped inner component (before or after its own work)',
      'Return a new decorator wrapping itself',
      'Throw an exception if the inner component fails',
    ],
    answer: 1,
    explanation: 'Every decorator method must delegate to the inner component — otherwise it replaces the behavior instead of augmenting it. The whole point is to add to, not replace, the wrapped behavior.',
  },
];

const qna: QnaItem[] = [
  {
    q: 'How do you register stacked decorators in ASP.NET Core DI?',
    a: 'Manually: resolve the inner service and wrap it during registration (AddScoped factory overload). Or use a library like Scrutor which adds DecorateRegistered<IService, DecoratorService>() extension methods to IServiceCollection for cleaner declaration.',
  },
  {
    q: 'Are C# [attributes] the Decorator pattern?',
    a: 'No. C# attributes are compile-time metadata annotations — they do not wrap objects at runtime. AOP frameworks (PostSharp, Castle DynamicProxy) use attribute-style syntax to generate Decorator proxies, but the underlying mechanism (generated wrapping) is the Decorator pattern, not the attribute syntax itself.',
  },
];

const revision: RevisionSummary = {
  oneLiner: 'Decorator wraps an object in the same interface and adds behavior before/after delegation — enabling dynamic composition of cross-cutting concerns without modifying the original class.',
  mustKnow: [
    'Decorator implements the same interface as the component it wraps',
    'Every decorator method MUST delegate to the inner component',
    'Decorators can be stacked in any order: Logging(Retry(Cache(Real)))',
    '.NET Stream hierarchy is the canonical example (GZipStream, BufferedStream)',
    'Register stacked decorators in DI manually or with Scrutor',
  ],
  interviewFocus: [
    'Why is Decorator preferred over inheritance for cross-cutting concerns?',
    'What happens if a decorator forgets to call inner.Method()?',
    'How do you stack decorators in ASP.NET Core dependency injection?',
  ],
};

@Component({
  selector: 'app-dp-decorator',
  standalone: true,
  imports: [CommonModule, PageMetaComponent, QuickRefComponent, TheoryBlockComponent,
    CodeBlockComponent, CommonMistakesComponent, ChallengeBlockComponent,
    QuizBlockComponent, QnaBlockComponent, RevisionCardComponent, PageCompleteComponent],
  templateUrl: './decorator.html',
  styleUrl: './decorator.scss',
})
export class DpDecorator {
  quickRef = quickRef; theory = theory; codeTabs = codeTabs;
  mistakes = mistakes; challenge = challenge; quiz = quiz; qna = qna; revision = revision;
}
