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
  { name: 'Intent',    type: 'keyword',   desc: 'Encapsulate a request as an object — enabling undo/redo, queuing, logging, and deferred execution.' },
  { name: 'Command',   type: 'interface', desc: 'The object that wraps a request with all parameters needed to execute it.' },
  { name: 'Invoker',   type: 'class',     desc: 'Triggers the command — holds a reference to ICommand but knows nothing about what it does.' },
  { name: 'Receiver',  type: 'class',     desc: 'The object that performs the actual work when the command is executed.' },
  { name: 'Undo/Redo', type: 'keyword',   desc: 'Commands stored in a stack enable undo (pop, call Undo()) and redo (repush, call Execute()).' },
  { name: 'IRequest',  type: 'interface', desc: 'MediatR\'s IRequest<TResponse> is the Command pattern — a typed request object processed by a handler.' },
];

const theory: TheoryPoint[] = [
  {
    heading: 'What is the Command Pattern?',
    points: [
      'Command encapsulates a request as an object — the operation plus all its parameters become a single object.',
      'This turns method calls into first-class objects: they can be stored, queued, logged, and undone.',
      'Decouples the Invoker (who triggers the command) from the Receiver (who executes the work).',
      'The Invoker knows only ICommand.Execute() — it has no knowledge of the command\'s implementation.',
    ],
  },
  {
    heading: 'Roles: Command, Invoker, Receiver',
    points: [
      'Command: interface with Execute() and optionally Undo().',
      'ConcreteCommand: wraps a Receiver and implements Execute() by calling receiver methods.',
      'Invoker: holds and triggers commands — a button, a scheduler, a queue consumer.',
      'Receiver: the real object doing the work (Editor, FileSystem, OrderService).',
    ],
  },
  {
    heading: 'Undo / Redo Stack',
    points: [
      'Executed commands are pushed to a history stack.',
      'Undo: pop from history, call command.Undo() — reverses the action.',
      'Redo: pop from undo stack, call command.Execute() again — reapplies the action.',
      'Each Command stores enough state to reverse itself (previous value, original position).',
    ],
  },
  {
    heading: '.NET Examples',
    points: [
      'MediatR IRequest<TResponse>: command object sent to IRequestHandler — the Handler is the Receiver.',
      'Task/Func<T>: a delegate stored as an object is Command in its simplest form.',
      'IUndoableAction in document editors (Word, VS Code): Command with undo stack.',
      'Outbox pattern: commands serialised to DB, consumed asynchronously — Command + queuing.',
    ],
  },
];

const codeTabs: CodeTab[] = [
  {
    label: 'Text Editor with Undo',
    language: 'csharp',
    code: `// Command interface
public interface ICommand
{
    void Execute();
    void Undo();
}

// Receiver
public class TextEditor
{
    private string _text = "";
    public string Text => _text;

    public void InsertText(string text, int position)
    {
        _text = _text.Insert(position, text);
    }

    public void DeleteText(int position, int length)
    {
        _text = _text.Remove(position, length);
    }
}

// Concrete Command — stores receiver + parameters + undo state
public class InsertTextCommand(TextEditor editor, string text, int position) : ICommand
{
    public void Execute() => editor.InsertText(text, position);
    public void Undo()    => editor.DeleteText(position, text.Length);
}

public class DeleteTextCommand(TextEditor editor, int position, int length) : ICommand
{
    private string _deleted = "";

    public void Execute()
    {
        _deleted = editor.Text.Substring(position, length); // save for undo
        editor.DeleteText(position, length);
    }
    public void Undo() => editor.InsertText(_deleted, position);
}

// Invoker — maintains history stack
public class CommandHistory
{
    private readonly Stack<ICommand> _history = new();
    private readonly Stack<ICommand> _redoStack = new();

    public void Execute(ICommand command)
    {
        command.Execute();
        _history.Push(command);
        _redoStack.Clear();
    }

    public void Undo()
    {
        if (_history.TryPop(out var cmd)) { cmd.Undo(); _redoStack.Push(cmd); }
    }

    public void Redo()
    {
        if (_redoStack.TryPop(out var cmd)) { Execute(cmd); }
    }
}

// Usage
var editor  = new TextEditor();
var history = new CommandHistory();

history.Execute(new InsertTextCommand(editor, "Hello", 0));     // "Hello"
history.Execute(new InsertTextCommand(editor, " World", 5));    // "Hello World"
history.Undo();    // "Hello"
history.Redo();    // "Hello World"`,
  },
  {
    label: 'MediatR Commands',
    language: 'csharp',
    code: `// MediatR is Command pattern: IRequest = Command, IRequestHandler = Receiver

// Command
public record CreateOrderCommand(string CustomerId, List<OrderItem> Items)
    : IRequest<OrderResult>;

// Handler (Receiver)
public class CreateOrderHandler(IOrderRepository repo, IEventBus bus)
    : IRequestHandler<CreateOrderCommand, OrderResult>
{
    public async Task<OrderResult> Handle(
        CreateOrderCommand cmd, CancellationToken ct)
    {
        var order = Order.Create(cmd.CustomerId, cmd.Items);
        await repo.SaveAsync(order, ct);
        await bus.PublishAsync(new OrderCreatedEvent(order.Id), ct);
        return OrderResult.Success(order.Id);
    }
}

// Invoker — controller knows nothing about how order is created
[ApiController]
public class OrdersController(IMediator mediator) : ControllerBase
{
    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateOrderCommand cmd)
    {
        var result = await mediator.Send(cmd);
        return result.IsSuccess ? Ok(result.OrderId) : BadRequest(result.Error);
    }
}`,
  },
];

const mistakes: CommonMistake[] = [
  {
    title: 'Putting business logic in the Command instead of the Receiver',
    wrong: `public void Execute()
{
    // All business logic in Execute — no Receiver
    order.Status = "Confirmed";
    inventory.Reduce(order.Items);
    email.Send(order.Customer, "Confirmed");
}`,
    right: `public void Execute() => orderService.ConfirmOrder(_order); // delegates to Receiver`,
    explanation: 'Commands are message objects — they delegate work to Receivers. Business logic in Execute() makes commands fat and untestable without testing the whole command object.',
  },
  {
    title: 'Not storing undo state before Execute()',
    wrong: `public void Execute() { editor.DeleteText(position, length); }
public void Undo()    { editor.InsertText("???", position); } // doesn't know what was deleted`,
    right: `public void Execute() {
    _deleted = editor.Text.Substring(position, length); // save BEFORE deleting
    editor.DeleteText(position, length);
}
public void Undo() => editor.InsertText(_deleted, position);`,
    explanation: 'Undo requires knowing the state before Execute() ran. Capture the state you need to reverse INSIDE Execute(), before making changes — not in the constructor.',
  },
  {
    title: 'Forgetting to clear the redo stack on new Execute()',
    wrong: `public void Execute(ICommand cmd) { cmd.Execute(); _history.Push(cmd); }
// redo stack not cleared — redo of stale commands causes inconsistency`,
    right: `public void Execute(ICommand cmd) {
    cmd.Execute();
    _history.Push(cmd);
    _redoStack.Clear(); // any new action invalidates the redo history
}`,
    explanation: 'When a new command is executed after some undos, the redo stack becomes stale and must be cleared. Otherwise redo applies old commands to a new state, causing corruption.',
  },
  {
    title: 'Making Commands depend on the Invoker',
    wrong: `public class SaveCommand(CommandHistory invoker) : ICommand { ... }`,
    right: `public class SaveCommand(IDocumentService service, Document doc) : ICommand { ... }`,
    explanation: 'Commands must not know about the Invoker — that creates a circular dependency. Commands know only about the Receiver (the service that does the work).',
  },
];

const challenge: Challenge = {
  title: 'Smart Home Commands',
  language: 'typescript',
  description: `Implement Command pattern for a smart home.
ICommand has execute() and undo().
LightOnCommand and LightOffCommand control a Light (turnOn/turnOff).
RemoteControl (Invoker) has pressButton(cmd) and pressUndo().`,
  hints: [
    'Light is the Receiver with turnOn() and turnOff()',
    'LightOnCommand.undo() calls light.turnOff()',
    'RemoteControl stores last command for undo',
  ],
  starterCode: `interface ICommand { execute(): void; undo(): void; }

class Light {
  turnOn()  { console.log('Light ON'); }
  turnOff() { console.log('Light OFF'); }
}

// TODO: LightOnCommand, LightOffCommand, RemoteControl`,
  solution: `interface ICommand { execute(): void; undo(): void; }

class Light {
  turnOn()  { console.log('Light ON'); }
  turnOff() { console.log('Light OFF'); }
}

class LightOnCommand implements ICommand {
  constructor(private light: Light) {}
  execute() { this.light.turnOn(); }
  undo()    { this.light.turnOff(); }
}

class LightOffCommand implements ICommand {
  constructor(private light: Light) {}
  execute() { this.light.turnOff(); }
  undo()    { this.light.turnOn(); }
}

class RemoteControl {
  private lastCommand: ICommand | null = null;
  pressButton(cmd: ICommand): void { cmd.execute(); this.lastCommand = cmd; }
  pressUndo(): void { this.lastCommand?.undo(); }
}

const light  = new Light();
const remote = new RemoteControl();
remote.pressButton(new LightOnCommand(light));   // Light ON
remote.pressButton(new LightOffCommand(light));  // Light OFF
remote.pressUndo();                              // Light ON (undo off)`,
};

const quiz: QuizQuestion[] = [
  {
    q: 'What is the core benefit of encapsulating a request as a Command object?',
    options: [
      'It makes the request execute faster',
      'The request can be stored, queued, logged, and undone because it is a first-class object',
      'It prevents the request from being executed multiple times',
      'It ensures the request is executed on a background thread',
    ],
    answer: 1,
    explanation: 'Turning a request into an object makes it first-class: it can be passed around, stored in history stacks, queued for later, serialised to disk, and reversed via Undo(). These capabilities are impossible with a plain method call.',
  },
  {
    q: 'In MediatR, which role does IRequest<TResponse> play in the Command pattern?',
    options: ['Invoker', 'Receiver', 'Command', 'ConcreteCommand'],
    answer: 2,
    explanation: 'IRequest<TResponse> is the Command — it encapsulates the request data. IRequestHandler<TRequest, TResponse> is the Receiver (does the actual work). IMediator.Send() is the Invoker.',
  },
  {
    q: 'When should undo state be captured in a Command?',
    options: [
      'In the constructor, before any changes are made',
      'Inside Execute(), before making changes to the receiver',
      'In Undo(), by querying the receiver for its current state',
      'It should be stored externally by the Invoker',
    ],
    answer: 1,
    explanation: 'Capture undo state inside Execute(), BEFORE making changes. The constructor does not have the right state (the receiver may have changed before Execute() is called). Querying the receiver in Undo() is too late — the change has already happened.',
  },
  { q: 'What is the Command pattern and what does it encapsulate?', options: ['A programming paradigm where functions are the primary building blocks', 'A behavioral pattern that encapsulates a request as an object, allowing parameterization of clients, queuing of operations, logging, and undo/redo', 'A structural pattern for chaining method calls', 'A pattern for handling command-line arguments in applications'], answer: 1, explanation: 'The Command pattern turns a request into a stand-alone object containing all request information: the receiver, the method to call, and any parameters. This object can be: stored and executed later, queued for sequential execution, logged for audit trails, serialized and sent across a network, undone by implementing an undo method. Classic components: Command (interface with execute()), ConcreteCommand (implements execute() calling receiver), Receiver (does the actual work), Invoker (stores and executes commands), Client (creates and configures commands).' },
  { q: 'How does the Command pattern enable undo/redo functionality?', options: ['By keeping a log file of all operations that can be replayed', 'By storing executed commands in a history stack; calling undo() on the most recent command reverses its effect; redo() re-executes it', 'By taking database snapshots before each operation', 'By using transactions that can be rolled back'], answer: 1, explanation: 'Undo/redo implementation: maintain an undo stack and a redo stack. When a command executes: push it onto the undo stack. When undo is requested: pop from the undo stack, call command.undo(), push the command onto the redo stack. When redo is requested: pop from the redo stack, call command.execute(), push back to undo stack. Each Command class must implement both execute() and undo() methods. The undo method reverses the effect of execute(). Text editors and graphics tools use this pattern for their undo history.' },
  { q: 'What is the relationship between Command pattern and the CQRS architectural pattern?', options: ['They are unrelated; CQRS is an architectural pattern while Command is a design pattern', 'CQRS is the architectural application of the Command pattern at scale: commands change state and are handled by command handlers; queries read state without change', 'CQRS replaces the Command pattern and makes it unnecessary', 'The Command pattern requires CQRS to work correctly'], answer: 1, explanation: 'The Command design pattern wraps a single operation as an object. CQRS (Command Query Responsibility Segregation) is an architectural pattern that separates write operations (commands) from read operations (queries). CQRS extends the Command design pattern concept to the architecture level: command objects represent write intentions, query objects represent read requests, and separate handlers process each type. MediatR in C# implements both: command objects dispatched to IRequestHandler implement the Command design pattern within a CQRS architecture.' },
];

const qna: QnaItem[] = [
  {
    q: 'How does the Command pattern relate to the Outbox pattern?',
    a: 'The Outbox pattern serialises commands (events/messages) to a database before processing — this is Command + persistence. The command object is written to the "outbox" table, then a background worker reads and executes it. This enables reliable async processing and at-least-once delivery.',
  },
  {
    q: 'Can lambdas/delegates replace the Command interface?',
    a: 'For simple use cases — yes. Action, Func<T>, and Task-returning delegates are Commands in their simplest form. The full pattern with a named class is justified when you need undo state, logging, serialisation, or meaningful type names for debugging and audit.',
  },
  { q: 'How does the Command pattern support macro commands (composite commands)?', a: 'A MacroCommand implements the Command interface and holds a list of sub-commands. Executing the macro executes all sub-commands in sequence. Undoing the macro calls undo() on each sub-command in reverse order. This allows building complex transactions from simple commands and undo them atomically. Example: a text editor macro that selects all text, copies it, creates a new document, and pastes. Each sub-operation is a command and the macro groups them together. The Composite design pattern can model hierarchical command structures where macro commands contain other macro commands.' },
  { q: 'How is the Command pattern used in event sourcing?', a: 'In event sourcing, the Command pattern models write operations that change state. A command object represents the intent (PlaceOrder, ShipOrder). The command handler validates the command, applies business rules, and if valid, records one or more domain events in the event store. The state is derived by replaying these events. Commands are different from events: a command represents an intention that may be rejected, while an event represents something that already happened. Commands can be serialized, queued, and retried. The command handler is the same as the Command design pattern Receiver, processing the encapsulated request.' },
  { q: 'What is the difference between Command and Strategy patterns?', a: 'Both encapsulate behavior as objects, but with different intent. Strategy encapsulates an algorithm that can be swapped to vary how an operation is performed. The context delegates to the strategy and often swaps strategies at runtime. Command encapsulates a complete request (action + parameters + receiver) to be executed later, queued, logged, or undone. Strategy is about choosing how to do something; Command is about what to do and when. A Command could use a Strategy for its implementation. Strategy objects usually have no undo capability; Commands are designed for undo/redo support.' },
  { q: 'How do you implement a command queue for deferred execution?', a: 'A command queue holds commands for sequential or deferred execution. Implementation: use a thread-safe queue (ConcurrentQueue in .NET, LinkedBlockingQueue in Java). The producer adds commands to the queue. A background thread (or thread pool) dequeues and executes commands in order. This enables: async execution without blocking the caller, rate limiting by controlling the consumer processing rate, retry logic for failed commands (re-enqueue after failure), and cancellation by checking a cancellation flag before executing each command. Task schedulers, job queues (Hangfire, Quartz), and message-driven architectures all implement this pattern.' },
];

const revision: RevisionSummary = {
  oneLiner: 'Command encapsulates a request as an object, enabling undo/redo, queuing, and deferred execution by decoupling the Invoker from the Receiver.',
  mustKnow: [
    'Command: Execute() + Undo(); Invoker holds ICommand; Receiver does the actual work',
    'Undo state must be captured inside Execute() BEFORE making changes',
    'New Execute() must clear the redo stack',
    'MediatR: IRequest = Command, IRequestHandler = Receiver, mediator.Send() = Invoker',
    'Commands must not reference the Invoker — only the Receiver',
  ],
  interviewFocus: [
    'How does Command pattern enable undo/redo?',
    'How does MediatR implement the Command pattern?',
    'When would you use a delegate/lambda instead of a full Command class?',
  ],
};

@Component({
  selector: 'app-dp-command',
  standalone: true,
  imports: [CommonModule, PageMetaComponent, QuickRefComponent, TheoryBlockComponent,
    CodeBlockComponent, CommonMistakesComponent, ChallengeBlockComponent,
    QuizBlockComponent, QnaBlockComponent, RevisionCardComponent, PageCompleteComponent],
  templateUrl: './command.html',
  styleUrl: './command.scss',
})
export class DpCommand {
  quickRef = quickRef; theory = theory; codeTabs = codeTabs;
  mistakes = mistakes; challenge = challenge; quiz = quiz; qna = qna; revision = revision;
}
