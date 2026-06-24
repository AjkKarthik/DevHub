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
  { name: 'Intent',       type: 'keyword',   desc: 'Decouple an abstraction from its implementation so the two can vary independently.' },
  { name: 'Abstraction',  type: 'class',     desc: 'High-level control layer that delegates implementation work to an Implementor.' },
  { name: 'Implementor',  type: 'interface', desc: 'Interface for the low-level implementation; Abstraction holds a reference to it.' },
  { name: 'Refined Abstraction', type: 'class', desc: 'Subclass of Abstraction that adds higher-level operations using the Implementor.' },
  { name: 'Bridge',       type: 'keyword',   desc: 'The composition link between Abstraction and Implementor — avoids inheritance explosion.' },
  { name: 'vs Adapter',   type: 'keyword',   desc: 'Adapter reconciles incompatible existing interfaces; Bridge is designed upfront to keep two hierarchies independent.' },
];

const theory: TheoryPoint[] = [
  {
    heading: 'What is the Bridge Pattern?',
    points: [
      'Bridge separates an abstraction from its implementation into two independent class hierarchies.',
      'The abstraction holds a reference (the "bridge") to an implementor interface and delegates work to it.',
      'Both hierarchies can evolve independently — new abstractions and new implementations without combinatorial explosion.',
      'Designed upfront, unlike Adapter which reconciles existing incompatible interfaces after the fact.',
    ],
  },
  {
    heading: 'The Combinatorial Explosion Problem',
    points: [
      'Without Bridge: 2 shapes × 3 renderers = 6 classes (CircleOpenGL, CircleDirectX, CircleVulkan, SquareOpenGL…).',
      'With Bridge: 2 shape classes + 3 renderer classes = 5 classes, any combination at runtime.',
      'Adding a new shape requires 1 class; adding a new renderer requires 1 class — not N × M classes.',
      'This is the core value: vary the abstraction dimension and the implementation dimension independently.',
    ],
  },
  {
    heading: 'Bridge vs Adapter vs Strategy',
    points: [
      'Adapter: reconciles two existing incompatible interfaces — structural fix after the fact.',
      'Bridge: designed from the start to decouple two dimensions that would otherwise tangle.',
      'Strategy: behavioral — swaps algorithms. Bridge: structural — separates abstraction from implementation.',
      'Bridge and Strategy both use composition, but Bridge is about structure; Strategy is about behavior.',
    ],
  },
  {
    heading: '.NET Scenarios',
    points: [
      'Data access: Entity abstraction (Order, Product) bridged to storage implementation (SqlServer, Cosmos).',
      'Logging: ILogger abstraction bridged to sink implementation (console, file, Seq).',
      'UI themes: Control abstraction bridged to rendering implementation (WPF, MAUI, Blazor).',
      'Notifications: NotificationService bridged to channel implementation (email, SMS, push).',
    ],
  },
];

const codeTabs: CodeTab[] = [
  {
    label: 'Shape + Renderer',
    language: 'csharp',
    code: `// Implementor interface
public interface IRenderer
{
    void RenderCircle(float radius);
    void RenderSquare(float side);
}

// Concrete Implementors
public class VectorRenderer : IRenderer
{
    public void RenderCircle(float r) => Console.WriteLine($"Drawing circle (vector) r={r}");
    public void RenderSquare(float s) => Console.WriteLine($"Drawing square (vector) s={s}");
}

public class RasterRenderer : IRenderer
{
    public void RenderCircle(float r) => Console.WriteLine($"Drawing circle (raster) r={r}");
    public void RenderSquare(float s) => Console.WriteLine($"Drawing square (raster) s={s}");
}

// Abstraction
public abstract class Shape(IRenderer renderer)
{
    protected IRenderer Renderer = renderer;
    public abstract void Draw();
    public abstract void Resize(float factor);
}

// Refined Abstractions
public class Circle(IRenderer renderer, float radius) : Shape(renderer)
{
    private float _radius = radius;
    public override void Draw() => Renderer.RenderCircle(_radius);
    public override void Resize(float factor) => _radius *= factor;
}

public class Square(IRenderer renderer, float side) : Shape(renderer)
{
    private float _side = side;
    public override void Draw() => Renderer.RenderSquare(_side);
    public override void Resize(float factor) => _side *= factor;
}

// Any combination at runtime — no N×M classes
IRenderer renderer = new VectorRenderer();
var shapes = new Shape[] { new Circle(renderer, 5), new Square(renderer, 3) };
foreach (var s in shapes) { s.Draw(); s.Resize(2); s.Draw(); }`,
  },
  {
    label: 'Notification Bridge',
    language: 'csharp',
    code: `// Implementor
public interface INotificationChannel
{
    Task SendAsync(string recipient, string subject, string body);
}

public class EmailChannel : INotificationChannel
{
    public Task SendAsync(string to, string subject, string body)
    {
        Console.WriteLine($"Email → {to}: [{subject}] {body}");
        return Task.CompletedTask;
    }
}

public class SmsChannel : INotificationChannel
{
    public Task SendAsync(string to, string _, string body)
    {
        Console.WriteLine($"SMS → {to}: {body[..Math.Min(160, body.Length)]}");
        return Task.CompletedTask;
    }
}

// Abstraction
public abstract class Notification(INotificationChannel channel)
{
    protected readonly INotificationChannel Channel = channel;
    public abstract Task SendAsync(string recipient);
}

// Refined Abstractions
public class OrderConfirmation(INotificationChannel channel, string orderId)
    : Notification(channel)
{
    public override Task SendAsync(string recipient) =>
        Channel.SendAsync(recipient, "Order Confirmed", $"Order #{orderId} confirmed.");
}

// Bridge in action — same abstraction, different channels
await new OrderConfirmation(new EmailChannel(), "ORD-123").SendAsync("user@example.com");
await new OrderConfirmation(new SmsChannel(), "ORD-123").SendAsync("+1234567890");`,
  },
];

const mistakes: CommonMistake[] = [
  {
    title: 'Confusing Bridge with Adapter',
    wrong: `// Bridge and Adapter look similar — both wrap an interface
// "I have a legacy interface, I'll use Bridge to adapt it"`,
    right: `// Adapter: post-hoc fix for incompatible existing interfaces
// Bridge: designed upfront to allow two hierarchies to vary independently`,
    explanation: 'Bridge is designed from the start to prevent inheritance explosion. Adapter is applied retroactively to reconcile existing mismatched interfaces. The intent is different even if the structure looks similar.',
  },
  {
    title: 'Putting implementation logic in the Abstraction',
    wrong: `public override void Draw() {
    // drawing logic in the abstraction — bypassing Renderer
    Console.WriteLine("Drawing circle directly");
}`,
    right: `public override void Draw() => Renderer.RenderCircle(_radius); // delegate to implementor`,
    explanation: 'The Abstraction must delegate all implementation work to the Implementor. Putting logic in the Abstraction re-couples the two hierarchies and defeats the pattern.',
  },
  {
    title: 'Using Bridge when a single hierarchy suffices',
    wrong: `// Only one renderer type exists — Bridge adds two hierarchies for no gain`,
    right: `// Use Bridge only when TWO independent dimensions of variation exist`,
    explanation: 'Bridge adds structural complexity. It is only justified when both the abstraction and implementation genuinely need to vary independently. One-dimensional variation is better served by simple inheritance or Strategy.',
  },
  {
    title: 'Hard-coding the Implementor inside Abstraction',
    wrong: `public Circle(float radius) : base(new VectorRenderer()) { }`,
    right: `public Circle(IRenderer renderer, float radius) : base(renderer) { }`,
    explanation: 'Inject the Implementor — never create it inside the Abstraction. Hard-coding defeats the purpose: the Implementor can no longer be swapped without modifying the Abstraction.',
  },
];

const challenge: Challenge = {
  title: 'Logger Bridge',
  language: 'typescript',
  description: `Implement a Bridge pattern for logging.
ILogSink is the Implementor (write(level, message)).
Logger is the Abstraction (info/warn/error methods that delegate to ILogSink).
Create ConsoleSink and FileSink (simulated) implementations.
Show that the same Logger works with both sinks.`,
  hints: [
    'Logger holds a reference to ILogSink',
    'Logger.info/warn/error call sink.write with level prefix',
    'ConsoleSink and FileSink are ConcreteImplementors',
  ],
  starterCode: `interface ILogSink {
  write(level: string, message: string): void;
}

abstract class Logger {
  constructor(protected sink: ILogSink) {}
  abstract info(msg: string): void;
  abstract warn(msg: string): void;
  abstract error(msg: string): void;
}

// TODO: implement ConsoleSink, FileSink, AppLogger`,
  solution: `interface ILogSink {
  write(level: string, message: string): void;
}

class ConsoleSink implements ILogSink {
  write(level: string, message: string): void {
    console.log(\`[\${level.toUpperCase()}] \${message}\`);
  }
}

class FileSink implements ILogSink {
  private log: string[] = [];
  write(level: string, message: string): void {
    this.log.push(\`[\${level}] \${message}\`);
    console.log(\`File: [\${level}] \${message}\`);
  }
  getLog(): string[] { return this.log; }
}

abstract class Logger {
  constructor(protected sink: ILogSink) {}
  abstract info(msg: string): void;
  abstract warn(msg: string): void;
  abstract error(msg: string): void;
}

class AppLogger extends Logger {
  info(msg: string)  { this.sink.write('info', msg); }
  warn(msg: string)  { this.sink.write('warn', msg); }
  error(msg: string) { this.sink.write('error', msg); }
}

const consoleLogger = new AppLogger(new ConsoleSink());
const fileSink = new FileSink();
const fileLogger = new AppLogger(fileSink);

consoleLogger.info('Server started');
fileLogger.warn('High memory usage');
fileLogger.error('Connection failed');`,
};

const quiz: QuizQuestion[] = [
  {
    q: 'What problem does Bridge primarily solve?',
    options: [
      'Making incompatible interfaces work together',
      'Controlling access to an object',
      'Preventing inheritance explosion when two dimensions of variation exist',
      'Sharing fine-grained objects efficiently',
    ],
    answer: 2,
    explanation: 'Bridge prevents the N×M class explosion that occurs when two dimensions (e.g., shapes × renderers) are mixed in a single hierarchy. It separates them so each can vary independently.',
  },
  {
    q: 'How does Bridge differ from Adapter?',
    options: [
      'They are identical patterns with different names',
      'Bridge is designed upfront for two independent hierarchies; Adapter fixes incompatible existing interfaces after the fact',
      'Adapter uses composition; Bridge uses inheritance',
      'Bridge is for behavioral variation; Adapter is for structural variation',
    ],
    answer: 1,
    explanation: 'Bridge is an intentional design decision made before the code is written, to keep two dimensions independent. Adapter is applied retroactively to make existing incompatible interfaces work together.',
  },
  {
    q: 'In the Bridge pattern, where should implementation logic live?',
    options: [
      'In the Abstraction class',
      'In the ConcreteImplementor classes',
      'Shared equally between Abstraction and Implementor',
      'In a separate Director class',
    ],
    answer: 1,
    explanation: 'All implementation logic lives in ConcreteImplementor classes. The Abstraction only holds a reference to the Implementor and delegates work to it — it must not contain implementation logic.',
  },
];

const qna: QnaItem[] = [
  {
    q: 'Is ILogger<T> in .NET an example of Bridge?',
    a: 'Partially. ILogger<T> (the abstraction) is decoupled from ILoggerProvider implementations (the implementors: Console, File, ApplicationInsights). The logging infrastructure uses a bridge-like structure where the abstraction and sinks can vary independently — this is Bridge in spirit, though the .NET logging pipeline has additional complexity.',
  },
  {
    q: 'Can Bridge and Adapter be used together?',
    a: 'Yes — a ConcreteImplementor in a Bridge hierarchy might itself be an Adapter wrapping a legacy or third-party system. This is common when integrating existing libraries into a new Bridge-based abstraction.',
  },
];

const revision: RevisionSummary = {
  oneLiner: 'Bridge decouples an abstraction from its implementation into two independent hierarchies — preventing N×M class explosion when two dimensions of variation exist.',
  mustKnow: [
    'Abstraction holds a reference to Implementor and delegates work to it',
    'Prevents N×M class explosion: shapes × renderers → shapes + renderers classes',
    'Designed upfront (unlike Adapter, which is a retroactive fix)',
    'Inject the Implementor — never hard-code it in the Abstraction',
    '.NET analogy: ILogger (abstraction) + ILoggerProvider/sinks (implementors)',
  ],
  interviewFocus: [
    'Bridge vs Adapter — what is the key design intent difference?',
    'How does Bridge prevent combinatorial class explosion?',
    'When would you choose Bridge over simple inheritance?',
  ],
};

@Component({
  selector: 'app-dp-bridge',
  standalone: true,
  imports: [CommonModule, PageMetaComponent, QuickRefComponent, TheoryBlockComponent,
    CodeBlockComponent, CommonMistakesComponent, ChallengeBlockComponent,
    QuizBlockComponent, QnaBlockComponent, RevisionCardComponent, PageCompleteComponent],
  templateUrl: './bridge.html',
  styleUrl: './bridge.scss',
})
export class DpBridge {
  quickRef = quickRef; theory = theory; codeTabs = codeTabs;
  mistakes = mistakes; challenge = challenge; quiz = quiz; qna = qna; revision = revision;
}
