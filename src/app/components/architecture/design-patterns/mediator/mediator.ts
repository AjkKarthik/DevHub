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
  { name: 'Intent',    type: 'keyword',   desc: 'Reduce direct coupling between components by routing communication through a central mediator object.' },
  { name: 'Mediator',  type: 'interface', desc: 'Central hub that receives messages from components and forwards them to the right recipients.' },
  { name: 'Colleague', type: 'class',     desc: 'A component that communicates only through the mediator — never directly to other colleagues.' },
  { name: 'IMediator (MediatR)', type: 'interface', desc: 'Library implementation: Send() for commands, Publish() for notifications.' },
  { name: 'vs Facade', type: 'keyword',   desc: 'Facade: one-way simplification for clients. Mediator: coordinates two-way communication between components.' },
  { name: 'vs Observer', type: 'keyword', desc: 'Observer: one sender, many independent receivers. Mediator: centralised hub routing between specific colleagues.' },
];

const theory: TheoryPoint[] = [
  {
    heading: 'What is the Mediator Pattern?',
    points: [
      'Mediator reduces coupling between components by making them communicate through a central mediator rather than directly.',
      'Instead of A knowing about B and C, A only knows about the Mediator; the Mediator decides who gets the message.',
      'Transforms an M×N relationship graph (everyone knows everyone) into M+N star topology (everyone knows only the mediator).',
      'Trade-off: reduced coupling between components, but the mediator itself can become a God object if it grows too large.',
    ],
  },
  {
    heading: 'Colleagues and the Mediator',
    points: [
      'Each Colleague holds a reference to the Mediator (injected) and uses it for all inter-component communication.',
      'When a Colleague changes state, it notifies the Mediator — which then updates other Colleagues.',
      'Colleagues are decoupled from each other; only the Mediator has knowledge of how to coordinate.',
      'Adding a new Colleague requires updating only the Mediator, not every other Colleague.',
    ],
  },
  {
    heading: 'MediatR: In-Process Mediator',
    points: [
      'MediatR implements Mediator for the CQRS pattern: Send(IRequest) for commands/queries, Publish(INotification) for events.',
      'Handlers register themselves; the mediator routes requests to the right handler automatically.',
      'Pipeline behaviors (IPipelineBehavior) wrap handler execution — validation, logging, transactions.',
      'Decouples controllers from services — controllers send a command and don\'t know which handler processes it.',
    ],
  },
  {
    heading: '.NET Examples',
    points: [
      'MediatR library: the de facto .NET Mediator for CQRS.',
      'ASP.NET Core SignalR Hub: routes messages between clients without them knowing about each other.',
      'WPF EventAggregator (Prism): publish/subscribe between ViewModels.',
      'Flight control systems: all planes talk to control tower (mediator), not to each other.',
    ],
  },
];

const codeTabs: CodeTab[] = [
  {
    label: 'Chat Room Mediator',
    language: 'csharp',
    code: `// Mediator interface
public interface IChatMediator
{
    void SendMessage(string message, User sender);
    void Register(User user);
}

// Colleague
public class User(string name, IChatMediator mediator)
{
    public string Name { get; } = name;

    public void Send(string message) =>
        mediator.SendMessage(message, this);

    public void Receive(string from, string message) =>
        Console.WriteLine($"[{Name}] received from {from}: {message}");
}

// Concrete Mediator
public class ChatRoom : IChatMediator
{
    private readonly List<User> _users = new();

    public void Register(User user) => _users.Add(user);

    public void SendMessage(string message, User sender)
    {
        // Forward to all users EXCEPT the sender
        foreach (var user in _users.Where(u => u != sender))
            user.Receive(sender.Name, message);
    }
}

// Usage — Users don't know about each other
var chat  = new ChatRoom();
var alice = new User("Alice", chat); chat.Register(alice);
var bob   = new User("Bob",   chat); chat.Register(bob);
var carol = new User("Carol", chat); chat.Register(carol);

alice.Send("Hello everyone!");
// Bob received from Alice: Hello everyone!
// Carol received from Alice: Hello everyone!`,
  },
  {
    label: 'MediatR CQRS',
    language: 'csharp',
    code: `// Command (request) + Handler registered with MediatR
public record GetOrderQuery(int OrderId) : IRequest<OrderDto?>;

public class GetOrderHandler(IOrderRepository repo)
    : IRequestHandler<GetOrderQuery, OrderDto?>
{
    public async Task<OrderDto?> Handle(
        GetOrderQuery query, CancellationToken ct)
    {
        var order = await repo.GetByIdAsync(query.OrderId, ct);
        return order is null ? null : new OrderDto(order.Id, order.Total, order.Status);
    }
}

// Notification (event) + multiple handlers
public record OrderShippedNotification(int OrderId, string TrackingCode)
    : INotification;

public class EmailNotificationHandler(IEmailService email)
    : INotificationHandler<OrderShippedNotification>
{
    public Task Handle(OrderShippedNotification n, CancellationToken ct)
        => email.SendShippingConfirmationAsync(n.OrderId, n.TrackingCode, ct);
}

public class AnalyticsHandler(IAnalytics analytics)
    : INotificationHandler<OrderShippedNotification>
{
    public Task Handle(OrderShippedNotification n, CancellationToken ct)
        => analytics.TrackOrderShippedAsync(n.OrderId, ct);
}

// Controller — sends commands/queries; knows nothing about handlers
[ApiController]
public class OrdersController(IMediator mediator) : ControllerBase
{
    [HttpGet("{id}")]
    public async Task<IActionResult> Get(int id) =>
        await mediator.Send(new GetOrderQuery(id)) is { } dto ? Ok(dto) : NotFound();
}`,
  },
];

const mistakes: CommonMistake[] = [
  {
    title: 'Making the mediator a God object with too much logic',
    wrong: `public void Notify(User sender, string @event)
{
    // 500 lines of if-else routing all component interactions
    if (@event == "A") { DoX(); DoY(); DoZ(); }
    if (@event == "B") { DoP(); DoQ(); }
    // ...
}`,
    right: `// Keep mediator as a routing hub only
// Complex orchestration belongs in dedicated use-case / handler classes`,
    explanation: 'The mediator should route messages, not implement business logic. When the mediator grows beyond routing, it becomes a God object — the problem you were trying to solve (high coupling) just moved into one class.',
  },
  {
    title: 'Colleagues referencing each other directly',
    wrong: `public class Button(TextBox textBox) {
    void Click() => textBox.Enable(); // direct coupling — defeats the pattern
}`,
    right: `public class Button(IMediator mediator) {
    void Click() => mediator.Notify(this, "clicked");
}`,
    explanation: 'Colleagues must communicate only via the mediator. Direct references between colleagues re-introduce coupling and defeat the pattern\'s purpose.',
  },
  {
    title: 'Confusing Mediator with Facade',
    wrong: `// "I want to simplify a complex subsystem" → "Use Mediator"`,
    right: `// Facade: simplifies FOR external clients (one-directional)
// Mediator: coordinates BETWEEN internal components (bidirectional)`,
    explanation: 'Facade is a simplification layer for external callers. Mediator is a coordination hub between peer components. The key difference: Facade doesn\'t change how components talk to each other; Mediator does.',
  },
  {
    title: 'Not using MediatR pipeline behaviors for cross-cutting concerns',
    wrong: `public async Task<OrderResult> Handle(CreateOrderCommand cmd, CancellationToken ct)
{
    await ValidateAsync(cmd);     // validation in handler
    await LogAsync(cmd);          // logging in handler
    await BeginTransactionAsync();
    // ... actual logic ...
}`,
    right: `// Register IPipelineBehavior<,> for validation, logging, transactions
// Handlers contain ONLY business logic
builder.Services.AddTransient(typeof(IPipelineBehavior<,>), typeof(ValidationBehavior<,>));`,
    explanation: 'MediatR pipeline behaviors are the CoR/Decorator layer around handlers. Putting cross-cutting concerns (validation, logging, transactions) in handlers violates SRP and duplicates code across handlers.',
  },
];

const challenge: Challenge = {
  title: 'Airport Control Tower',
  language: 'typescript',
  description: `Implement Mediator for airport communication.
IMediator has notify(sender, event).
Planes (Colleagues) communicate only via the mediator.
When a plane requests landing, the mediator broadcasts "runway busy" to others.
When it lands, mediator broadcasts "runway free".`,
  hints: [
    'ControlTower is the mediator — holds all registered planes',
    'Plane.requestLanding() calls mediator.notify(this, "landing")',
    'ControlTower routes messages to all OTHER planes',
  ],
  starterCode: `interface IMediator {
  notify(sender: Plane, event: string): void;
}

class Plane {
  constructor(public name: string, private mediator: IMediator) {}
  requestLanding(): void { this.mediator.notify(this, 'landing'); }
  receive(msg: string): void { console.log(\`[\${this.name}] \${msg}\`); }
}

// TODO: implement ControlTower mediator`,
  solution: `interface IMediator {
  notify(sender: Plane, event: string): void;
}

class Plane {
  constructor(public name: string, private mediator: IMediator) {}
  requestLanding(): void { this.mediator.notify(this, 'landing'); }
  landed(): void { this.mediator.notify(this, 'landed'); }
  receive(msg: string): void { console.log(\`[\${this.name}] \${msg}\`); }
}

class ControlTower implements IMediator {
  private planes: Plane[] = [];
  register(plane: Plane): void { this.planes.push(plane); }

  notify(sender: Plane, event: string): void {
    const others = this.planes.filter(p => p !== sender);
    if (event === 'landing') {
      others.forEach(p => p.receive(\`\${sender.name} is landing — hold position\`));
    } else if (event === 'landed') {
      others.forEach(p => p.receive(\`Runway clear — \${sender.name} has landed\`));
    }
  }
}

const tower = new ControlTower();
const a1 = new Plane('AA-101', tower);
const a2 = new Plane('BA-202', tower);
const a3 = new Plane('UA-303', tower);
[a1, a2, a3].forEach(p => tower.register(p));

a1.requestLanding(); // BA-202 and UA-303 get hold notice
a1.landed();         // BA-202 and UA-303 get clear notice`,
};

const quiz: QuizQuestion[] = [
  {
    q: 'What coupling problem does Mediator solve?',
    options: [
      'N components each knowing all N-1 others (M×N connections) — replaced with a hub (M+N connections)',
      'One class depending on too many interfaces',
      'Tight coupling between a factory and its products',
      'Circular dependencies between two classes',
    ],
    answer: 0,
    explanation: 'Without Mediator, N components directly reference each other — up to N×(N-1) connections. With Mediator, each component knows only the mediator — N connections total. This is the fundamental trade-off.',
  },
  {
    q: 'How does MediatR\'s Publish() differ from Send()?',
    options: [
      'Send() is async; Publish() is synchronous',
      'Send() routes to exactly ONE handler (command/query); Publish() broadcasts to ALL registered handlers (notification)',
      'Publish() validates the request first; Send() does not',
      'There is no functional difference',
    ],
    answer: 1,
    explanation: 'Send() expects exactly one IRequestHandler<TRequest, TResponse> — used for commands and queries. Publish() broadcasts to all INotificationHandler<TNotification> registrations — used for domain events where multiple handlers react independently.',
  },
  {
    q: 'What is the main risk of the Mediator pattern?',
    options: [
      'Colleagues become tightly coupled to each other',
      'The mediator itself can become a God object containing all system logic',
      'The pattern is too slow for real-time systems',
      'It prevents unit testing of colleagues',
    ],
    answer: 1,
    explanation: 'If all inter-component logic routes through the mediator and the mediator contains all the routing decisions plus business logic, it becomes a God object — centralising the very complexity it was meant to distribute.',
  },
  { q: 'What is the Mediator pattern and what communication problem does it solve?', options: ['A middleman service that caches and routes database queries', 'A behavioral pattern that defines an object that encapsulates how a set of objects interact, reducing direct dependencies between communicating objects', 'A pattern for coordinating distributed transactions across microservices', 'A broker that queues and delivers messages between systems'], answer: 1, explanation: 'Without Mediator: objects in a system communicate directly with each other. If 5 components each know about 4 others, you have 20 dependencies forming a tangled web. Adding a 6th component requires updating 5 existing components. With Mediator: all components talk only to the mediator. The mediator knows how to handle each interaction. Adding a new component: update only the mediator. Components are decoupled from each other. Common examples: air traffic control tower (planes do not talk directly), MediatR library in C# (controllers send commands to the mediator, not to handlers), chat room server, GUI dialog where controls react to each other.' },
  { q: 'How does MediatR in C# implement the Mediator pattern?', options: ['MediatR is a database query builder that mediates between application and database', 'MediatR acts as a message dispatcher: commands and queries are sent to the mediator which routes them to the appropriate handlers without the sender knowing the handler', 'MediatR provides a middleware pipeline for ASP.NET Core request handling', 'MediatR caches query results in memory to avoid repeated computation'], answer: 1, explanation: 'MediatR: a NuGet package implementing the Mediator pattern. Sender: creates a command or query object (e.g., GetOrderByIdQuery) and calls mediator.Send(query). The sender does not reference any handler class. Handler: implements IRequestHandler<GetOrderByIdQuery, OrderDto>, registered with DI. MediatR resolves and invokes the correct handler. Pipeline behaviors (middleware): IPipelineBehavior<TRequest, TResponse> intercepts all requests for cross-cutting concerns (logging, validation, transactions). MediatR decouples controllers from service classes, enabling CQRS and clean architecture patterns.' },
  { q: 'What is the difference between Mediator and Observer?', options: ['Mediator and Observer are the same pattern; both manage multi-party communication', 'Mediator centralizes communication: components send messages to the mediator which routes them; Observer defines publish/subscribe where subjects notify observers directly', 'Mediator is synchronous; Observer is asynchronous', 'Observer requires knowing the subscriber list; Mediator does not'], answer: 1, explanation: 'Observer: objects subscribe to a subject (publisher). When the subject changes, it notifies all subscribers directly. Subscribers can be many. Subject knows the interface of its subscribers. Mediator: all objects interact only through the mediator. The mediator knows all participants and the routing logic. Participants do not know each other. An event bus combines both: components publish events (Observer-style) through a bus (Mediator). The distinction: Observer creates a one-to-many notification; Mediator centralizes many-to-many coordination.' },
];

const qna: QnaItem[] = [
  {
    q: 'When should I use MediatR vs direct service injection?',
    a: 'Use MediatR when: (1) decoupling controllers from service layer matters, (2) you want pipeline behaviors (validation, logging, transactions) composable across all commands, (3) implementing CQRS with many independent handlers. Use direct injection for simple apps where the indirection of MediatR adds complexity without benefit.',
  },
  {
    q: 'How is Mediator different from a message bus/event bus?',
    a: 'Mediator is in-process — all communication is synchronous within one application. A message bus (RabbitMQ, Azure Service Bus) is out-of-process — messages cross network/process boundaries with durable delivery. MediatR Publish() is in-process only; for reliable async cross-service events, use an event bus.',
  },
  { q: 'When does a Mediator become a God Object anti-pattern?', a: 'A Mediator becomes a God Object when: it contains business logic that belongs in domain classes. All processing logic is in the mediator, making domain objects anemic. The mediator grows to thousands of lines handling every interaction. The mediator knows everything about every component and centralizes all decisions. Prevention: the mediator should only route and coordinate, not process. Business logic stays in domain classes or dedicated handlers. In MediatR, each command handler is its own class with its own logic; the mediator only dispatches. Keep the mediator thin. If the mediator is growing large, consider splitting into multiple mediators each responsible for a bounded context.' },
  { q: 'How does Mediator relate to the Event-Driven Architecture?', a: 'Mediator and Event Bus are closely related. An event bus is essentially a mediator for asynchronous communication: publishers publish events without knowing subscribers; the bus routes events to registered subscribers. The difference: a classic Mediator (GoF) often involves synchronous, bidirectional coordination. An event bus is typically asynchronous and unidirectional (fire-and-forget). In practice, many messaging systems and frameworks call their central routing component a mediator even when it uses asynchronous event delivery. In MediatR: Send() is synchronous request/response (request-handler pair); Publish() is asynchronous notification with multiple handlers, resembling an event bus.' },
  { q: 'How do you test components that use a Mediator?', a: 'Testing with MediatR: option 1 - mock the IMediator interface and verify that the correct command/query was sent. This tests the controller or service sending the right message without testing the handler. Option 2 - use a real MediatR instance with registered test handlers in integration tests, validating the full request-handler-pipeline. Handler testing: handlers depend on repositories and services (injected). Unit test handlers by mocking the repository interfaces and calling Handle() directly without going through MediatR. This is the most valuable test: handler business logic tested in isolation. Pipeline behavior testing: register real behaviors with a test mediator and verify they run for the appropriate request types.' },
  { q: 'What are the trade-offs of using MediatR in a C# project?', a: 'Benefits: decouples controllers from business logic handlers. Enables CQRS separation. Pipeline behaviors cleanly handle cross-cutting concerns. Each handler is a small, focused, independently testable unit. Trade-offs: indirection: request.Send() is harder to trace than a direct service.DoSomething() call. All request types and handlers must be discovered and registered, typically via assembly scanning. Debugging requires knowing MediatR dispatching rules. Adds a NuGet dependency. Some teams find the pattern over-engineered for applications that do not genuinely need CQRS separation. Recommendation: MediatR suits complex applications with many use cases, cross-cutting concerns, and CQRS patterns. For simple CRUD applications, direct service injection is clearer.' },
];

const revision: RevisionSummary = {
  oneLiner: 'Mediator routes communication between components through a central hub — replacing M×N direct connections with a star topology and keeping colleagues decoupled.',
  mustKnow: [
    'Colleagues communicate only via the Mediator — never directly with each other',
    'Mediator should route, not contain business logic — risk of God object',
    'MediatR: Send() → one handler; Publish() → all notification handlers',
    'Pipeline behaviors compose cross-cutting concerns around handlers',
    'Facade vs Mediator: Facade simplifies for external clients; Mediator coordinates internal peers',
  ],
  interviewFocus: [
    'What coupling problem does Mediator solve and what new risk does it introduce?',
    'MediatR Send() vs Publish() — when to use each?',
    'Mediator vs Observer — how do they differ?',
  ],
};

@Component({
  selector: 'app-dp-mediator',
  standalone: true,
  imports: [CommonModule, PageMetaComponent, QuickRefComponent, TheoryBlockComponent,
    CodeBlockComponent, CommonMistakesComponent, ChallengeBlockComponent,
    QuizBlockComponent, QnaBlockComponent, RevisionCardComponent, PageCompleteComponent],
  templateUrl: './mediator.html',
  styleUrl: './mediator.scss',
})
export class DpMediator {
  quickRef = quickRef; theory = theory; codeTabs = codeTabs;
  mistakes = mistakes; challenge = challenge; quiz = quiz; qna = qna; revision = revision;
}
