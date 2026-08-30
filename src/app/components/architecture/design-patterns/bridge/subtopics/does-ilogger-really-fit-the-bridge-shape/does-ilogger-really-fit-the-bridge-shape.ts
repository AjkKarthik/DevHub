import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';

const theory: TheoryPoint[] = [
  {
    heading: 'What the Main Page\'s Bridge Examples Actually Do',
    points: [
      'Both codeTabs on the main page — <code>Shape</code>/<code>IRenderer</code> and ' +
      '<code>Notification</code>/<code>INotificationChannel</code> — follow the classic Bridge shape: an ' +
      'abstraction holds a reference to exactly ONE Implementor instance, and swapping the implementation ' +
      'means constructing the abstraction with a different one.',
      'A <code>Circle</code> built with a <code>VectorRenderer</code> only ever talks to that one renderer. ' +
      'Calling <code>Draw()</code> a hundred times still only ever reaches ONE concrete implementor.',
    ],
  },
  {
    heading: 'How .NET\'s Logger Class Actually Works',
    points: [
      '<code>ILoggerFactory.CreateLogger()</code> does not hand back an object wired to a single provider — ' +
      'internally it builds a <code>LoggerInformation[]</code> array with one entry PER registered ' +
      '<code>ILoggerProvider</code> (Console, File, ApplicationInsights, however many are registered).',
      'Each entry holds the provider-specific <code>ILogger</code> instance obtained by calling that ' +
      'provider\'s own <code>CreateLogger(categoryName)</code>.',
      'When application code calls <code>logger.LogInformation(...)</code>, the internal ' +
      '<code>Logger.Log()</code> method loops over EVERY entry in that array and (after checking ' +
      '<code>IsEnabled</code>) calls <code>Log()</code> on all of them — a single call fans out to every ' +
      'registered provider simultaneously, not just one.',
    ],
  },
  {
    heading: 'Why This Makes "Partially" the Right Word',
    points: [
      'The abstraction/implementor SEPARATION is genuinely Bridge-shaped — <code>ILogger&lt;T&gt;</code> ' +
      'application code never references a concrete provider type, exactly like the main page\'s ' +
      '<code>Shape</code> never references <code>VectorRenderer</code> directly.',
      'What is NOT classic Bridge is the CARDINALITY: the main page\'s Shape/Notification examples connect an ' +
      'abstraction to exactly one implementor at a time, swappable by construction. .NET\'s Logger connects ' +
      'one abstraction to an ARRAY of implementors, broadcasting to all of them on every call — a genuinely ' +
      'different shape, even though both share the same "abstraction depends on an interface, not a concrete ' +
      'type" spirit.',
    ],
  },
];

const codeTabs: CodeTab[] = [
  {
    label: 'One-to-Many vs. One-to-One',
    language: 'csharp',
    code: `// The main page's shape: ONE abstraction instance, ONE implementor at a time
IRenderer renderer = new VectorRenderer();
var circle = new Circle(renderer, 5);
circle.Draw(); // reaches exactly one renderer, always

// A simplified sketch of what Logger actually does — ONE call, MANY implementors
public sealed class BroadcastLogger : ILogger
{
    private readonly (ILoggerProvider Provider, ILogger Logger)[] _loggers;

    public BroadcastLogger((ILoggerProvider, ILogger)[] providerLoggers) =>
        _loggers = providerLoggers;

    public void Log<TState>(LogLevel logLevel, EventId eventId, TState state,
        Exception? exception, Func<TState, Exception?, string> formatter)
    {
        // Fan-out: every registered provider gets this exact log entry —
        // not "pick one implementor," but "notify all of them."
        foreach (var (_, logger) in _loggers)
        {
            if (logger.IsEnabled(logLevel))
                logger.Log(logLevel, eventId, state, exception, formatter);
        }
    }

    public bool IsEnabled(LogLevel logLevel) =>
        _loggers.Any(l => l.Logger.IsEnabled(logLevel));

    public IDisposable? BeginScope<TState>(TState state) where TState : notnull => null;
}

// Registering two providers means every log call reaches BOTH — the Shape/Renderer
// example has no equivalent: a Circle cannot draw itself with two renderers at once.
builder.Logging.AddConsole();
builder.Logging.AddApplicationInsights();`,
  },
];

const exercise: TryItExercise = {
  prompt:
    'If .NET registers 3 logging providers (Console, File, ApplicationInsights) and application code calls ' +
    '<code>logger.LogWarning("disk space low")</code> exactly once, how many times does a provider-specific ' +
    '<code>ILogger.Log()</code> method actually get invoked? Compare this to what happens if ' +
    '<code>circle.Draw()</code> is called once on the main page\'s Bridge example.',
  hint:
    'Trace through what the LoggerInformation array actually contains, and what Logger.Log() does with each ' +
    'entry in it.',
  solution:
    'Log() gets invoked up to 3 times — once per provider-specific ILogger in the LoggerInformation array (skipping ' +
    'any where IsEnabled returns false for that level). One call from application code fans out into as many ' +
    'calls as there are registered providers. Draw() on the Circle, by contrast, always reaches exactly ONE ' +
    'renderer — the single IRenderer instance the Circle was constructed with — no matter how many other ' +
    'renderer implementations exist elsewhere in the program. The Logger case is a broadcast to N implementors; ' +
    'the Shape case is a delegation to exactly 1.',
};

const misconceptions: Misconception[] = [
  {
    thought: 'Since ILogger&lt;T&gt; is commonly cited as ".NET\'s example of Bridge," it must follow the ' +
      'exact same structure as the main page\'s Shape/Renderer example.',
    reality:
      'It shares the core idea (abstraction depends on an interface, never a concrete type) but not the ' +
      'cardinality. Being "Bridge in spirit" does not mean being structurally identical to a textbook Bridge — ' +
      'real frameworks often adapt a pattern\'s core idea to a genuinely different shape (one-to-many instead ' +
      'of one-to-one) when that better fits their actual requirements.',
  },
  {
    thought: 'A one-to-many "broadcast" version of Bridge is not really Bridge at all — Bridge specifically ' +
      'means one abstraction, one implementor.',
    reality:
      'The defining trait of Bridge is that the abstraction is decoupled from concrete implementation types ' +
      'via an interface, allowing both sides to vary independently — nothing in that definition requires ' +
      'exactly one live implementor at a time. .NET\'s logging pipeline still gets the core benefit (add a new ' +
      'provider without touching any code that calls ILogger) even though it broadcasts to several ' +
      'implementors per call.',
  },
  {
    thought: 'Because the abstraction/implementor split is present, IsEnabled checking must also work the ' +
      'same way in both designs.',
    reality:
      'In the single-implementor Shape example, there is nothing to check — Draw() always reaches its one ' +
      'renderer. In the broadcast Logger design, IsEnabled has to be checked PER PROVIDER before each Log() ' +
      'call, since different providers can have different minimum log levels configured — a genuinely extra ' +
      'concern that only exists because of the one-to-many shape.',
  },
];

@Component({
  selector: 'app-bridge-does-ilogger-really-fit-the-bridge-shape',
  standalone: true,
  imports: [CommonModule, SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent,
    CodeBlockComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './does-ilogger-really-fit-the-bridge-shape.html',
  styleUrl: './does-ilogger-really-fit-the-bridge-shape.scss',
})
export class DoesIloggerReallyFitTheBridgeShapeSubtopic {
  theory = theory;
  codeTabs = codeTabs;
  exercise = exercise;
  misconceptions = misconceptions;
}
