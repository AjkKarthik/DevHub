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
  { name: 'Intent',       type: 'keyword', desc: 'Ensure a class has only one instance and provide a global access point to it.' },
  { name: 'Category',     type: 'keyword', desc: 'Creational — controls instance creation.' },
  { name: 'Participants', type: 'class',   desc: 'Singleton class with private constructor and static GetInstance() method.' },
  { name: 'When to use',  type: 'method',  desc: 'Shared resource: config, logger, connection pool, hardware device access.' },
  { name: 'When NOT to',  type: 'keyword', desc: 'Avoid when testability matters — singletons hide dependencies and resist mocking.' },
  { name: '.NET built-in', type: 'class',  desc: 'ILogger, DbContext (scoped), HttpClient via IHttpClientFactory, Configuration root.' },
];

const theory: TheoryPoint[] = [
  {
    heading: 'What is the Singleton Pattern?',
    points: [
      'The Singleton ensures a class has exactly one instance throughout the application lifetime.',
      'It provides a global access point — usually via a static Instance property or GetInstance() method.',
      'The constructor is private to prevent direct instantiation from outside the class.',
      'First introduced in the GoF book (1994) as one of the original 23 patterns.',
    ],
  },
  {
    heading: 'Thread Safety Variants',
    points: [
      'Eager initialisation: instance created at class load time — simple, thread-safe, no lazy load.',
      'Double-checked locking: checks the instance twice with a lock in between — avoids lock on every call.',
      'Lazy<T> in .NET: built-in lazy + thread-safe initialisation with almost no boilerplate.',
      'Static constructor (type initialiser): .NET guarantees thread-safe static constructors — elegant zero-lock approach.',
    ],
  },
  {
    heading: 'DI Container vs Singleton Pattern',
    points: [
      'Modern DI containers (Microsoft.Extensions.DI) support AddSingleton<T>() — the container manages the single instance.',
      'DI-registered singletons are testable: inject a mock via the interface instead of calling a static method.',
      'Static singletons resist mocking because callers reach the concrete type directly, not via an abstraction.',
      'Prefer DI-managed singletons; use the pattern directly only for low-level infrastructure or pre-DI code.',
    ],
  },
  {
    heading: 'Monostate — a Singleton Alternative',
    points: [
      'All state is static but the constructor is public — every instance shares the same state.',
      'More transparent than Singleton but still suffers from global mutable state issues.',
      'Rarely used in modern code; DI containers solve the same problem more cleanly.',
    ],
  },
  {
    heading: 'Why Singleton Is Often Considered an Anti-Pattern Today',
    points: [
      'Singleton\'s global, static access point makes code depending on it hard to test in isolation — unit tests cannot easily substitute a test double for a hardcoded Singleton.getInstance() call the way they can for a dependency explicitly passed in through a constructor.',
      'Modern dependency injection containers achieve the same "single shared instance" behavior (via singleton-scoped registration) WITHOUT the global static access point — the object is still created once and shared, but consuming code receives it through injection rather than reaching out to a global accessor, preserving testability.',
      'Singleton\'s global mutable state (if the singleton has any mutable state) creates hidden coupling between otherwise unrelated parts of a codebase that all interact with the same shared instance — changes made by one part of the system silently affect every other part that reads from the same Singleton.',
      'The pattern still has legitimate, narrow uses (a genuinely single hardware resource, a truly global immutable configuration) — the modern criticism is specifically about defaulting to Singleton as a convenient global-access shortcut rather than reaching for proper dependency injection, not that shared single instances are inherently wrong.',
    ],
  },
];

const codeTabs: CodeTab[] = [
  {
    label: 'Thread-safe (Lazy<T>)',
    language: 'csharp',
    code: `public sealed class ConfigurationManager
{
    // Lazy<T> is thread-safe by default
    private static readonly Lazy<ConfigurationManager> _lazy =
        new(() => new ConfigurationManager());

    public static ConfigurationManager Instance => _lazy.Value;

    private readonly Dictionary<string, string> _settings = new();

    private ConfigurationManager()
    {
        // Load settings once
        _settings["MaxRetries"] = "3";
        _settings["Timeout"]    = "30";
    }

    public string Get(string key) =>
        _settings.TryGetValue(key, out var v) ? v : string.Empty;
}

// Usage
var cfg = ConfigurationManager.Instance;
Console.WriteLine(cfg.Get("MaxRetries")); // 3`,
  },
  {
    label: 'Static constructor',
    language: 'csharp',
    code: `public sealed class AppLogger
{
    // CLR guarantees static constructors are thread-safe
    private static readonly AppLogger _instance = new();

    public static AppLogger Instance => _instance;

    private AppLogger() { }

    public void Log(string message) =>
        Console.WriteLine($"[{DateTime.UtcNow:HH:mm:ss}] {message}");
}`,
  },
  {
    label: 'DI Singleton (recommended)',
    language: 'csharp',
    code: `// Register as singleton in the DI container
builder.Services.AddSingleton<ISettingsService, SettingsService>();

// Service is testable — inject mock via interface
public class SettingsService : ISettingsService
{
    private readonly IConfiguration _config;

    public SettingsService(IConfiguration config) => _config = config;

    public string Get(string key) => _config[key] ?? string.Empty;
}

// Tests can mock ISettingsService without static coupling
var mock = new Mock<ISettingsService>();
mock.Setup(s => s.Get("Timeout")).Returns("60");`,
  },
];

const mistakes: CommonMistake[] = [
  {
    title: 'Non-thread-safe lazy singleton',
    wrong: `private static MyService _instance;
public static MyService Instance =>
    _instance ??= new MyService(); // Race condition!`,
    right: `private static readonly Lazy<MyService> _lazy = new(() => new MyService());
public static MyService Instance => _lazy.Value;`,
    explanation: 'In multithreaded apps, two threads can both see _instance as null and create two instances. Lazy<T> or a static readonly field handles thread safety automatically.',
  },
  {
    title: 'Not sealing the class',
    wrong: `public class Database
{
    public static Database Instance { get; } = new();
    private Database() { }
}
// A PRIVATE constructor already blocks external subclassing today --
// but if a later edit ever widens it to protected (e.g. to support a
// test subclass), this unsealed class silently becomes inheritable`,
    right: `public sealed class Database
{
    public static Database Instance { get; } = new();
    private Database() { }
}
// sealed guarantees the single-instance contract can never be broken
// by a FUTURE constructor-visibility change, not just today's code`,
    explanation: 'A private constructor alone already prevents external classes from subclassing Database -- the C# compiler rejects it, since a derived class has no accessible base constructor to call. sealed is not fixing a bypass that exists today; it is a guardrail against a FUTURE edit (private -> protected) accidentally reopening subclassing. It also blocks the one existing edge case a private constructor does not cover: a class NESTED inside Database itself, which -- unlike an external class -- does have access to its enclosing type\'s private members and could otherwise inherit from it.',
  },
  {
    title: 'Using static singleton instead of DI',
    wrong: `var conn = DatabaseConnection.Instance.Connect();`,
    right: `public class OrderService(IDatabaseConnection db) { ... }
// IDatabaseConnection registered as singleton in DI container`,
    explanation: 'Static singletons create invisible dependencies that make unit testing nearly impossible. DI-managed singletons are equivalent at runtime but mockable in tests.',
  },
  {
    title: 'Mutable global state',
    wrong: `Singleton.Instance.Cache["key"] = "value"; // from anywhere!`,
    right: `// Expose only needed operations, not mutable internals
Singleton.Instance.SetCached("key", "value");`,
    explanation: 'Exposing the internal state directly makes it impossible to enforce invariants or track mutations. Encapsulate mutation behind methods.',
  },
];

const challenge: Challenge = {
  title: 'Build a Thread-Safe Rate Limiter',
  language: 'typescript',
  description: `Implement a Singleton RateLimiter that tracks API call counts per client ID.
The limiter should:
- Allow up to maxCalls per windowMs milliseconds per client
- Return true if the call is allowed, false if rate-limited
- Use Lazy initialization for the singleton instance`,
  hints: [
    'Use a Map<string, number[]> to store timestamps per client',
    'Filter out timestamps older than windowMs',
    'Private constructor prevents external instantiation',
  ],
  starterCode: `class RateLimiter {
  private static instance: RateLimiter | null = null;
  private calls: Map<string, number[]> = new Map();

  private constructor(
    private maxCalls: number,
    private windowMs: number
  ) {}

  static getInstance(maxCalls = 100, windowMs = 60000): RateLimiter {
    // TODO: implement lazy singleton
  }

  isAllowed(clientId: string): boolean {
    // TODO: check rate limit
    return true;
  }
}`,
  solution: `class RateLimiter {
  private static instance: RateLimiter | null = null;
  private calls: Map<string, number[]> = new Map();

  private constructor(
    private maxCalls: number,
    private windowMs: number
  ) {}

  static getInstance(maxCalls = 100, windowMs = 60000): RateLimiter {
    if (!RateLimiter.instance) {
      RateLimiter.instance = new RateLimiter(maxCalls, windowMs);
    }
    return RateLimiter.instance;
  }

  isAllowed(clientId: string): boolean {
    const now = Date.now();
    const timestamps = (this.calls.get(clientId) ?? [])
      .filter(t => now - t < this.windowMs);
    if (timestamps.length >= this.maxCalls) return false;
    timestamps.push(now);
    this.calls.set(clientId, timestamps);
    return true;
  }
}

const limiter = RateLimiter.getInstance(3, 1000);
console.log(limiter.isAllowed('user1')); // true
console.log(limiter.isAllowed('user1')); // true
console.log(limiter.isAllowed('user1')); // true
console.log(limiter.isAllowed('user1')); // false (limit hit)`,
};

const quiz: QuizQuestion[] = [
  {
    q: 'Which .NET construct provides lazy, thread-safe singleton initialization with minimal boilerplate?',
    options: ['lock() statement', 'Lazy<T>', 'static readonly', 'volatile keyword'],
    answer: 1,
    explanation: 'Lazy<T> provides lazy initialization that is thread-safe by default (LazyThreadSafetyMode.ExecutionAndPublication). It evaluates the factory once and caches the result.',
  },
  {
    q: 'Why should a Singleton class be sealed in C#?',
    options: [
      'To improve performance by skipping virtual dispatch',
      'To guard the single-instance contract against future changes and nested-class subclassing',
      'To allow serialization',
      'To enable static method calls',
    ],
    answer: 1,
    explanation: 'A private constructor already blocks ordinary external subclassing today -- the compiler rejects it, since a derived class outside the declaring class has no accessible base constructor to call. sealed instead guards against two narrower risks: a future edit that widens the constructor to protected (which would silently reopen subclassing on an unsealed class), and a class NESTED inside the Singleton itself, which does have access to its enclosing type\'s private members and could otherwise inherit from it.',
  },
  {
    q: 'What is the main testability problem with static Singleton.Instance usage?',
    options: [
      'It is too slow for unit tests',
      'You cannot inject a mock via the interface — callers are hardwired to the concrete type',
      'Static methods cannot be called from xUnit tests',
      'The instance is not available until the application starts',
    ],
    answer: 1,
    explanation: 'Static coupling means you cannot substitute a mock or stub at test time. DI-managed singletons are registered by interface, so tests can inject a mock through the constructor.',
  },
  {
    q: 'Which scenario is a legitimate use case for the Singleton pattern?',
    options: [
      'A user profile object shared across request handlers',
      'A hardware device driver with exclusive access to physical resources',
      'An entity model for the database',
      'A per-request HTTP context object',
    ],
    answer: 1,
    explanation: 'Hardware drivers often require exclusive singleton access to the underlying resource. Most other cases are better handled by DI-managed singletons or scoped services.',
  },
  { q: 'What are the main criticisms of the Singleton pattern?', options: ['It uses too much memory by creating a persistent instance', 'Singleton introduces global state, hides dependencies, makes testing difficult by preventing instance replacement, and can cause concurrency issues in multi-threaded environments', 'Singleton is only suitable for simple value types, not complex objects', 'Singleton is deprecated in modern frameworks and should never be used'], answer: 1, explanation: 'Singleton criticisms: global state makes code harder to reason about; any code anywhere can access and modify the singleton. Hidden dependencies: a class that calls Singleton.Instance has an undeclared dependency not visible in its constructor or interface, making the dependency difficult to mock in tests. Testing: you cannot swap a Singleton for a test double easily; you must configure the Singleton itself to behave differently in tests. Thread safety: careless Singleton implementations have race conditions in the initialization path. Singleton pattern in tests often requires reset mechanisms (fragile). Prefer dependency injection of a single instance over the Singleton pattern.' },
  { q: 'What is the difference between Singleton pattern and singleton lifetime in DI?', options: ['They are identical; a DI singleton is the same design pattern as GoF Singleton', 'GoF Singleton: the class enforces single-instance via static Instance property. DI singleton lifetime: the container manages a single instance per container scope, injectable via constructor without the class knowing it is a singleton', 'DI singleton lifetime does not guarantee only one instance across the application', 'GoF Singleton is thread-safe; DI singleton lifetime is not'], answer: 1, explanation: 'GoF Singleton: the class itself is responsible for enforcing a single instance (private constructor, static Instance). Creates tight coupling to the specific class. DI singleton lifetime: services.AddSingleton<IMyService, MyService>(). The DI container creates one instance per container lifetime and injects it wherever IMyService is requested. The MyService class has no special singleton code; it is a normal class. Benefits of DI approach: the class is mockable, testable, and does not know it is a singleton. Lifetime is configurable. Strongly prefer DI singleton over GoF Singleton in modern applications.' },
];

const qna: QnaItem[] = [
  {
    q: 'Is DbContext a Singleton in ASP.NET Core?',
    a: 'No — DbContext is registered as Scoped (one instance per HTTP request). Making it Singleton would cause concurrency bugs because EF Core\'s change tracker is not thread-safe. Use IDbContextFactory<T> if you need a DbContext outside of the DI scope.',
  },
  {
    q: 'Can a class registered with AddSingleton in DI still cause the same testing problems the classic Singleton pattern is criticized for?',
    a: 'Mostly no, but there is one lingering risk: if a DI-registered singleton holds MUTABLE shared state that persists across test runs within the same test process (e.g. an in-memory cache that is never reset between tests), tests can still leak state into each other even though the class itself has no static Instance property and is fully injectable/mockable. The DI container solves the coupling problem (callers depend on an abstraction, and the container can substitute a test double per test), but it does not automatically solve a shared-mutable-state problem if the singleton\'s own design accumulates state that outlives a single test — that still requires the singleton class itself to be designed for resettable or per-test-scoped state.',
  },
  {
    q: 'Can you use Singleton with async initialization?',
    a: 'Not cleanly with the basic pattern. For async initialization, prefer IHostedService or a lazy-with-lock pattern using SemaphoreSlim. Alternatively, initialize synchronously in the constructor and run async I/O in an Initialize() method called once from Program.cs before the app starts.',
  },
  { q: 'What is the double-checked locking pattern for thread-safe Singleton?', a: 'In a multi-threaded environment, two threads can both reach the null check simultaneously and both create instances. Double-checked locking: check if instance is null outside the lock (fast path for already-initialized case), then lock, then check again inside the lock (to handle the race). In C#: if (_instance == null) { lock(_lock) { if (_instance == null) { _instance = new Singleton(); } } }. The field must be marked volatile (or use Interlocked) to prevent CPU instruction reordering from allowing a partially constructed instance to be observed. In .NET, using Lazy<T> with LazyThreadSafetyMode.ExecutionAndPublication provides a safer and simpler alternative to manual double-checked locking.' },
  { q: 'How does Monostate pattern differ from Singleton?', a: 'Monostate achieves the same effect as Singleton (shared state across instances) but through a different mechanism. Singleton: enforces that only one instance can exist. Monostate: allows multiple instances but all instances share the same static state. All properties and fields are static; instance methods read and write these static fields. Users create new Monostate() freely but all instances operate on the same shared data. Monostate is more testable than classic Singleton (you can create and inject instances) but still has the global state problem. Monostate is unusual; most developers prefer DI singleton lifetime over both Singleton and Monostate patterns.' },
  { q: 'When is Singleton pattern genuinely appropriate despite its drawbacks?', a: 'Appropriate use cases: application configuration object loaded once from files or environment — accessed everywhere, immutable after loading, no testability concern. Thread pools, connection pools — genuinely only one should exist. Logging infrastructure — the logging framework itself may use a Singleton internally (log4j LogManager, SLF4J LoggerFactory). Hardware access classes where only one driver instance is safe — GPU context, hardware lock. Counters, ID generators that must be globally unique. Even in these cases, prefer injecting the singleton via DI container (singleton lifetime) rather than the GoF static Instance pattern. Reserve GoF Singleton for the rare infrastructure class that must control its own lifetime.' },
];

const revision: RevisionSummary = {
  oneLiner: 'Singleton ensures exactly one class instance exists, with a global access point — best managed via DI for testability.',
  mustKnow: [
    'Private constructor + static instance property/method',
    'Lazy<T> or static readonly field for thread-safe initialization',
    'sealed class prevents subclassing from bypassing the constructor',
    'DI AddSingleton<T>() is preferred over static singletons in modern code',
    'Singletons with mutable global state are the main risk — hide state behind operations',
  ],
  interviewFocus: [
    'How does Lazy<T> achieve thread safety without explicit locks?',
    'Why are static singletons hard to unit-test?',
    'When would you choose Singleton over a DI-managed singleton?',
    'Double-checked locking: what is it and when is it needed in C#?',
  ],
};

@Component({
  selector: 'app-dp-singleton',
  standalone: true,
  imports: [CommonModule, PageMetaComponent, QuickRefComponent, TheoryBlockComponent,
    CodeBlockComponent, CommonMistakesComponent, ChallengeBlockComponent,
    QuizBlockComponent, QnaBlockComponent, RevisionCardComponent, PageCompleteComponent],
  templateUrl: './singleton.html',
  styleUrl: './singleton.scss',
})
export class DpSingleton {
  quickRef = quickRef;
  theory = theory;
  codeTabs = codeTabs;
  mistakes = mistakes;
  challenge = challenge;
  quiz = quiz;
  qna = qna;
  revision = revision;
}
