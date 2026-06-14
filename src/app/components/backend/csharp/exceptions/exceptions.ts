import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CodeBlockComponent, CodeTab } from '../../../shared/code-block/code-block';
import { TheoryBlockComponent, TheoryPoint } from '../../../shared/theory-block/theory-block';
import { QnaBlockComponent, QnaItem } from '../../../shared/qna-block/qna-block';
import { QuizBlockComponent, QuizQuestion } from '../../../shared/quiz-block/quiz-block';
import { ChallengeBlockComponent, Challenge } from '../../../shared/challenge-block/challenge-block';
import { QuickRefComponent, QuickRefItem } from '../../../shared/quick-ref/quick-ref';
import { PageMetaComponent } from '../../../shared/page-meta/page-meta';
import { PageCompleteComponent } from '../../../shared/page-complete/page-complete';
import { CommonMistakesComponent, CommonMistake } from '../../../shared/common-mistakes/common-mistakes';
import { RevisionCardComponent, RevisionSummary } from '../../../shared/revision-card/revision-card';
import { PrerequisitesComponent, Prerequisite } from '../../../shared/prerequisites/prerequisites';

@Component({
  selector: 'app-csharp-exceptions',
  standalone: true,
  imports: [
    CommonModule,
    CodeBlockComponent, TheoryBlockComponent, QnaBlockComponent,
    QuizBlockComponent, ChallengeBlockComponent, QuickRefComponent,
    PageMetaComponent, PageCompleteComponent,
    CommonMistakesComponent, RevisionCardComponent, PrerequisitesComponent,
  ],
  templateUrl: './exceptions.html',
  styleUrl: './exceptions.scss',
})
export class CsharpExceptions {

  prerequisites: Prerequisite[] = [
    { label: 'Async / Await',  route: '/csharp/async' },
    { label: 'Tasks & TPL',    route: '/csharp/tasks' },
  ];

  quickRef: QuickRefItem[] = [
    { name: 'try / catch / finally',   type: 'keyword', desc: 'Structured error-handling block: try the risky code, catch specific exceptions, finally always cleans up' },
    { name: 'throw',                    type: 'keyword', desc: 'Throws a new exception or rethrows a caught exception (use bare throw; to preserve the stack trace)' },
    { name: 'throw;',                   type: 'syntax',  desc: 'Bare rethrow — re-raises the current exception without resetting its stack trace' },
    { name: 'when (filter)',            type: 'keyword', desc: 'Exception filter evaluated before entering the catch block; does not unwind the stack if false' },
    { name: 'Exception',                type: 'class',   desc: 'Base class for all exceptions; provides Message, StackTrace, InnerException, and HResult' },
    { name: 'ArgumentException',        type: 'class',   desc: 'Thrown when a method argument is invalid; use ArgumentNullException or ArgumentOutOfRangeException for specifics' },
    { name: 'InvalidOperationException', type: 'class',  desc: 'Thrown when a method call is invalid for the object\'s current state' },
    { name: 'AggregateException',       type: 'class',   desc: 'Wraps multiple exceptions; thrown by Task.WhenAll and Parallel; use Flatten() for nested aggregates' },
    { name: 'ExceptionDispatchInfo',    type: 'class',   desc: 'Captures an exception with its stack trace so it can be rethrown later without losing context' },
    { name: 'using statement',          type: 'syntax',  desc: 'Syntactic sugar for try/finally; calls Dispose() on the resource when the scope exits' },
    { name: 'ObjectDisposedException',  type: 'class',   desc: 'Thrown when an operation is called on a disposed object; throw in public methods after _disposed check' },
    { name: '.Flatten()',               type: 'method',  desc: 'AggregateException.Flatten() collapses nested AggregateExceptions into a single flat list of inner exceptions' },
  ];

  theory: TheoryPoint[] = [
    {
      heading: 'Catch specific, rethrow raw',
      points: [
        'Always catch the most specific exception type first — <code>FileNotFoundException</code> before <code>IOException</code> before <code>Exception</code>. The runtime matches catch clauses top-to-bottom and executes the first match.',
        'Use bare <code>throw;</code> (not <code>throw ex;</code>) to rethrow — <code>throw ex;</code> resets the stack trace to the <em>current</em> line, destroying the original call site and making debugging nearly impossible.',
        'Only catch exceptions you can actually handle; let unexpected ones propagate to a global handler. A catch block that logs and rethrows is better than one that swallows silently.',
        'Swallowing exceptions silently (<code>catch { }</code>) is almost always wrong — at minimum, log before rethrowing so you have an audit trail.',
        '<code>ArgumentNullException.ThrowIfNull(param)</code> and <code>ArgumentOutOfRangeException.ThrowIfNegative(value)</code> (introduced in .NET 7) provide one-liner guard clauses without verbose boilerplate.',
      ],
    },
    {
      heading: 'Exception filters (when)',
      points: [
        '<code>catch (Exception ex) when (ex.Message.Contains("timeout"))</code> — the filter runs <strong>before</strong> the stack unwinds, giving you a full, unmodified stack trace if the filter returns <code>false</code>.',
        'If the <code>when</code> predicate returns <code>false</code>, the runtime continues looking for the next matching catch block as if this one did not exist — the exception has not been "seen" yet.',
        'Logging-without-catching trick: <code>when (Log(ex))</code> where <code>Log</code> always returns <code>false</code>. The exception propagates with the original stack intact, but you get the log entry.',
        'Unlike a re-throw, a failed <code>when</code> filter leaves the original stack trace completely intact. This is the only way to "observe" an exception in C# without changing its propagation path.',
        'Exception filters are evaluated on the stack of the throw site, not the catch site. Debuggers can break at the throw point when a filter is evaluated, which aids diagnosis of first-chance exceptions.',
      ],
    },
    {
      heading: 'finally for cleanup',
      points: [
        '<code>finally</code> always runs — whether an exception is thrown, caught, or the <code>try</code> block returns normally. This makes it the reliable place for resource cleanup.',
        'The only exceptions to "finally always runs": <code>Environment.FailFast()</code>, a fatal CLR error (corrupted execution state), or the OS forcibly terminating the process.',
        'Prefer <code>using</code> statements (or <code>using var</code> declarations) over manual <code>try/finally</code> for <code>IDisposable</code> resources — they compile to the same IL but are less error-prone and more readable.',
        'Do not throw from <code>finally</code> — it replaces the original exception and the original is lost forever. If you must do risky work in <code>finally</code>, wrap it in its own <code>try/catch</code>.',
        'In async code, <code>finally</code> still executes correctly across <code>await</code> points — the state machine generated by the compiler ensures the finally block runs after the awaited task completes.',
      ],
    },
    {
      heading: 'Custom exceptions and hierarchies',
      points: [
        'Create custom exceptions when callers need to catch and handle a specific failure type differently from existing BCL exceptions. Use meaningful names ending in <code>Exception</code>.',
        'Inherit from the most specific relevant base: <code>ArgumentException</code> for bad inputs, <code>InvalidOperationException</code> for invalid state, <code>Exception</code> for domain errors with no better base.',
        'Provide at least two constructors: <code>(string message)</code> and <code>(string message, Exception inner)</code>. The inner-exception constructor enables wrapping lower-level errors with domain context.',
        'Add domain-specific properties (e.g. <code>OrderId</code>, <code>ErrorCode</code>) when callers need structured data beyond a message string. These allow type-safe recovery without string parsing.',
        'The <code>[Serializable]</code> attribute and the <code>protected (SerializationInfo, StreamingContext)</code> constructor are legacy requirements for cross-AppDomain marshalling; still recommended for library exceptions but rarely critical in modern apps.',
      ],
    },
    {
      heading: 'AggregateException and ExceptionDispatchInfo',
      points: [
        '<code>AggregateException</code> wraps multiple exceptions from parallel or async operations. <code>Task.WhenAll</code> produces one, and so do <code>Parallel.ForEach</code> and PLINQ.',
        'When you <code>await Task.WhenAll(...)</code>, the runtime automatically unwraps the <code>AggregateException</code> and re-throws the <em>first</em> inner exception. To see all failures, catch on the <code>Task</code> object itself and inspect <code>task.Exception!.InnerExceptions</code>.',
        '<code>AggregateException.Flatten()</code> recursively collapses nested <code>AggregateExceptions</code> into a single flat list — useful when tasks themselves internally throw aggregates.',
        '<code>ExceptionDispatchInfo.Capture(ex)</code> records an exception with its full original stack trace. Calling <code>.Throw()</code> later rethrows it with the original trace appended — it does not create a new throw site.',
        'The async infrastructure uses <code>ExceptionDispatchInfo</code> internally to propagate exceptions from background threads back to the <code>await</code> site, which is why async exceptions preserve their original stack traces.',
      ],
    },
    {
      heading: 'Result pattern vs exceptions',
      points: [
        'Exceptions are expensive: they capture a full stack trace and are intended for <em>exceptional</em> circumstances, not for normal control flow. Creating an exception object even without throwing it allocates the stack trace.',
        'For expected failures — validation errors, not-found, business rule violations — consider a <code>Result&lt;T&gt;</code> or <code>OneOf</code> pattern that makes the failure path explicit in the return type.',
        '<code>Result&lt;T&gt;</code> forces callers to handle both success and failure paths. Unlike exceptions, they cannot be silently ignored — the compiler enforces handling when using <code>switch</code> expressions.',
        'Use exceptions for truly unexpected failures (database down, null reference, out of memory, broken invariant); use <code>Result&lt;T&gt;</code> for expected domain failures (user not found, insufficient balance, duplicate entry).',
        'Libraries like <strong>FluentResults</strong>, <strong>ErrorOr</strong>, and <strong>OneOf</strong> provide production-ready Result types with chaining (<code>ThenDo</code>, <code>Match</code>, <code>Bind</code>) so you don\'t need to hand-roll your own.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'try/catch/finally',
      language: 'csharp',
      code: `// ── Basic try/catch/finally ────────────────────────────────────────────
try
{
    var text = File.ReadAllText("config.json");
    var cfg  = JsonSerializer.Deserialize<Config>(text);
    Process(cfg!);
}
catch (FileNotFoundException ex)
{
    // Most specific first — handle missing file gracefully
    Console.Error.WriteLine($"Config not found: {ex.FileName}");
}
catch (JsonException ex)
{
    // Specific: bad JSON in the file
    Console.Error.WriteLine($"Invalid config format: {ex.Message}");
}
catch (Exception ex)
{
    // Fallback — log and rethrow; don't swallow unknown failures
    _logger.LogError(ex, "Unexpected error loading config");
    throw;  // bare throw; — preserves the original stack trace
}
finally
{
    // Always runs — clean up regardless of success or failure
    Console.WriteLine("Config load attempt complete");
}

// ── .NET 7+ guard helpers ───────────────────────────────────────────────
void ProcessOrder(Order? order, int quantity)
{
    ArgumentNullException.ThrowIfNull(order);
    ArgumentOutOfRangeException.ThrowIfNegative(quantity);
    // Proceed with validated inputs
}

// ── Nested try blocks ─────────────────────────────────────────────────
static string LoadWithFallback(string primary, string fallback)
{
    try
    {
        return File.ReadAllText(primary);
    }
    catch (IOException)
    {
        try { return File.ReadAllText(fallback); }
        catch (IOException ex)
        {
            throw new InvalidOperationException(
                $"Neither '{primary}' nor '{fallback}' could be read.", ex);
        }
    }
}`,
    },
    {
      label: 'Exception Filters',
      language: 'csharp',
      code: `// ── when clause — filter before the stack unwinds ─────────────────────
try
{
    await CallExternalApi();
}
catch (HttpRequestException ex) when (ex.StatusCode == HttpStatusCode.ServiceUnavailable)
{
    // Only catches 503 — other HttpRequestExceptions propagate normally
    Console.WriteLine("Service temporarily unavailable — retry later");
}
catch (HttpRequestException ex) when (ex.StatusCode == HttpStatusCode.Unauthorized)
{
    Console.WriteLine("Authentication failed — check credentials");
}

// ── Logging without catching ───────────────────────────────────────────
// Log() always returns false → when-filter fails → stack is never unwound
// The exception propagates naturally with its full original stack trace
static bool Log(Exception ex)
{
    _logger.LogError(ex, "Unhandled exception observed");
    return false;  // do NOT catch — just observe
}

try
{
    RiskyOperation();
}
catch (Exception ex) when (Log(ex))
{
    // This block never executes — Log returns false
}

// ── Conditional retry with when ────────────────────────────────────────
static bool IsTransient(Exception ex) =>
    ex is TimeoutException
    || (ex is HttpRequestException h && (int?)h.StatusCode >= 500);

for (var attempt = 0; attempt < 3; attempt++)
{
    try
    {
        await FetchData();
        break;
    }
    catch (Exception ex) when (IsTransient(ex) && attempt < 2)
    {
        await Task.Delay(TimeSpan.FromSeconds(Math.Pow(2, attempt)));
    }
    // Non-transient or final attempt: exception propagates
}`,
    },
    {
      label: 'Custom Exceptions',
      language: 'csharp',
      code: `// ── Custom exception with domain properties ───────────────────────────
[Serializable]
public class OrderException : Exception
{
    public string   OrderId   { get; }
    public string   ErrorCode { get; }

    public OrderException(string orderId, string errorCode, string message)
        : base(message)
    {
        OrderId   = orderId;
        ErrorCode = errorCode;
    }

    public OrderException(string orderId, string errorCode, string message, Exception inner)
        : base(message, inner)
    {
        OrderId   = orderId;
        ErrorCode = errorCode;
    }
}

// ── Exception hierarchy for a domain ──────────────────────────────────
public abstract class DomainException : Exception
{
    protected DomainException(string msg) : base(msg) { }
    protected DomainException(string msg, Exception inner) : base(msg, inner) { }
}

public sealed class NotFoundException : DomainException
{
    public NotFoundException(string entity, object id)
        : base($"{entity} with id '{id}' was not found.") { }
}

public sealed class ConflictException : DomainException
{
    public ConflictException(string message) : base(message) { }
}

public sealed class ValidationException : DomainException
{
    public IReadOnlyList<string> Errors { get; }
    public ValidationException(IEnumerable<string> errors)
        : base("Validation failed.")
    {
        Errors = errors.ToList();
    }
}

// ── Throwing and catching domain exceptions ───────────────────────────
Order GetOrder(string id)
{
    var order = _repo.Find(id)
        ?? throw new NotFoundException(nameof(Order), id);

    if (order.Status == OrderStatus.Cancelled)
        throw new OrderException(id, "ORD-003", "Cannot modify a cancelled order.");

    return order;
}

try { GetOrder("abc-123"); }
catch (NotFoundException ex)    { /* 404 */ Console.WriteLine(ex.Message); }
catch (OrderException ex)       { /* domain */ Console.WriteLine($"[{ex.ErrorCode}] {ex.Message}"); }`,
    },
    {
      label: 'AggregateException & EDI',
      language: 'csharp',
      code: `// ── AggregateException from Task.WhenAll ─────────────────────────────
var tasks = new[]
{
    Task.Run(() => ProcessItem("A")),
    Task.Run(() => ProcessItem("B")),
    Task.Run(() => ProcessItem("C")),
};

var whenAllTask = Task.WhenAll(tasks);
try
{
    await whenAllTask;  // unwraps first inner exception only
}
catch
{
    // Inspect ALL failures, not just the first
    foreach (var ex in whenAllTask.Exception!.InnerExceptions)
        Console.WriteLine($"Failed: {ex.Message}");
}

// ── Flatten nested AggregateExceptions ────────────────────────────────
try
{
    await Task.WhenAll(
        Task.WhenAll(innerTasks1),
        Task.WhenAll(innerTasks2));
}
catch (AggregateException ae)
{
    // Flatten collapses nested AggregateExceptions into one flat list
    foreach (var inner in ae.Flatten().InnerExceptions)
        Console.WriteLine(inner.Message);
}

// ── ExceptionDispatchInfo — rethrow with original stack ───────────────
ExceptionDispatchInfo? captured = null;

try
{
    await RiskyBackgroundTask();
}
catch (Exception ex)
{
    // Capture: freeze the exception + its stack trace right now
    captured = ExceptionDispatchInfo.Capture(ex);
}

// Later — possibly on a different thread or continuation:
if (captured is not null)
{
    // Throws the original exception; the original stack trace is preserved
    // and appended with "--- End of stack trace from previous location ---"
    captured.Throw();
}

// ── Handle(predicate) — selectively handle some inner exceptions ───────
try
{
    runAllTask.Wait();
}
catch (AggregateException ae)
{
    ae.Handle(ex =>
    {
        if (ex is OperationCanceledException) return true; // handled — suppress
        _logger.LogError(ex, "Unhandled parallel failure");
        return false; // not handled — re-thrown wrapped in a new AggregateException
    });
}`,
    },
    {
      label: 'Result Pattern',
      language: 'csharp',
      code: `// ── Result<T> implementation ──────────────────────────────────────────
public readonly struct Result<T>
{
    public bool    IsSuccess { get; }
    public T?      Value     { get; }
    public string? Error     { get; }

    private Result(T value)           { IsSuccess = true;  Value = value; Error = null; }
    private Result(string error)      { IsSuccess = false; Value = default; Error = error; }

    public static Result<T> Success(T value)  => new(value);
    public static Result<T> Failure(string e) => new(e);

    // Functor map — transform the value if successful
    public Result<TOut> Map<TOut>(Func<T, TOut> fn) =>
        IsSuccess ? Result<TOut>.Success(fn(Value!)) : Result<TOut>.Failure(Error!);

    // Monad bind — chain Result-returning operations
    public Result<TOut> Bind<TOut>(Func<T, Result<TOut>> fn) =>
        IsSuccess ? fn(Value!) : Result<TOut>.Failure(Error!);

    public override string ToString() =>
        IsSuccess ? $"Ok({Value})" : $"Err({Error})";
}

// ── Using Result instead of throwing ──────────────────────────────────
Result<User> FindUser(int id)
{
    var user = _db.Users.FirstOrDefault(u => u.Id == id);
    return user is null
        ? Result<User>.Failure($"User {id} not found")
        : Result<User>.Success(user);
}

Result<string> GetUserEmail(int id) =>
    FindUser(id).Map(u => u.Email);

// ── Caller must handle both paths ─────────────────────────────────────
var result = GetUserEmail(42);
if (result.IsSuccess)
    Console.WriteLine($"Email: {result.Value}");
else
    Console.WriteLine($"Error: {result.Error}");

// ── Chaining with Bind ────────────────────────────────────────────────
var pipeline = FindUser(42)
    .Bind(u  => ValidateAge(u))
    .Bind(u  => SendWelcomeEmail(u))
    .Map(msg => $"Sent: {msg}");

Console.WriteLine(pipeline); // Ok(Sent: Welcome, Alice!) or Err(...)

// ── When to still use exceptions ──────────────────────────────────────
// Exceptions:  database is down, null dereference, stack overflow
// Result<T>:   validation failed, user not found, business rule violated`,
    },
  ];

  mistakes: CommonMistake[] = [
    {
      title: 'throw ex; resets the stack trace',
      wrong: `catch (Exception ex)
{
    _logger.LogError(ex.Message);
    throw ex; // stack trace now starts HERE — original origin lost
}`,
      right: `catch (Exception ex)
{
    _logger.LogError(ex, "Config load failed");
    throw; // bare throw; — preserves the original stack trace
}`,
      explanation: 'throw ex; creates a new throw point at the current line and resets StackTrace to start there. bare throw; re-raises the exception unchanged. Always use bare throw; when rethrowing in a catch block.',
    },
    {
      title: 'Catching Exception and swallowing it silently',
      wrong: `try { ProcessOrder(order); }
catch (Exception) { }  // swallowed — caller has no idea it failed`,
      right: `try { ProcessOrder(order); }
catch (Exception ex)
{
    _logger.LogError(ex, "Order processing failed for {OrderId}", order.Id);
    throw; // let it propagate to the global handler
}`,
      explanation: 'Silently swallowing exceptions hides bugs and makes failures invisible in production. At minimum, log the exception before rethrowing. If you genuinely want to suppress it, make that intent explicit with a comment explaining why.',
    },
    {
      title: 'Missing Flatten() on nested AggregateException',
      wrong: `catch (AggregateException ae)
{
    // InnerExceptions may itself contain AggregateExceptions — only sees top level
    foreach (var ex in ae.InnerExceptions)
        Console.WriteLine(ex.Message);
}`,
      right: `catch (AggregateException ae)
{
    // Flatten() recursively unwraps nested AggregateExceptions
    foreach (var ex in ae.Flatten().InnerExceptions)
        Console.WriteLine(ex.Message);
}`,
      explanation: 'When tasks themselves throw AggregateExceptions (e.g. nested Task.WhenAll), InnerExceptions contains more AggregateExceptions. Flatten() recursively collapses all layers into a single, flat list of the real root exceptions.',
    },
    {
      title: 'Throwing from finally (replaces the original exception)',
      wrong: `finally
{
    Cleanup(); // if Cleanup() throws, the original exception is completely lost
}`,
      right: `finally
{
    try { Cleanup(); }
    catch (Exception ex) { _logger.LogWarning(ex, "Cleanup failed"); }
}`,
      explanation: 'If finally throws, it replaces the exception that was propagating through the try/catch. The original exception is permanently lost. Wrap risky cleanup logic in its own try/catch and only log — never let cleanup exceptions escape finally.',
    },
    {
      title: 'Using exceptions for normal control flow',
      wrong: `// Expensive: captures full stack trace even for expected failures
try { return int.Parse(input); }
catch (FormatException) { return 0; }`,
      right: `// TryParse avoids exception allocation entirely
return int.TryParse(input, out var value) ? value : 0;`,
      explanation: 'Constructing an exception captures a full stack trace, which is expensive under load. The BCL provides Try* variants (TryParse, TryGetValue, TryDequeue) for scenarios where failure is expected and normal. Use these instead of try/catch for validation or dictionary lookups.',
    },
  ];

  quiz: QuizQuestion[] = [
    {
      q: 'What is the difference between <code>throw ex;</code> and bare <code>throw;</code>?',
      options: [
        'They are identical — both rethrow the current exception',
        '<code>throw ex;</code> preserves the original stack trace; bare <code>throw;</code> resets it',
        'Bare <code>throw;</code> preserves the original stack trace; <code>throw ex;</code> resets it to the current line',
        'Bare <code>throw;</code> can only be used outside a catch block',
      ],
      answer: 2,
      explanation: 'Bare <code>throw;</code> re-raises the caught exception without modifying its stack trace, so the original call site is preserved. <code>throw ex;</code> creates a new throw point at the current line, making debugging much harder because you lose the original origin.',
    },
    {
      q: 'When does the <code>when</code> exception filter run, and what happens if it returns false?',
      options: [
        'It runs after the catch block executes; false causes the exception to be swallowed',
        'It runs before the stack unwinds; false means the runtime looks for the next matching catch as if this one did not exist',
        'It runs after the stack unwinds; false rethrows the exception',
        'It is evaluated at compile time based on the exception type',
      ],
      answer: 1,
      explanation: 'The <code>when</code> filter is evaluated before the stack is unwound. If it returns <code>false</code>, the runtime moves on to the next <code>catch</code> clause — the stack trace remains completely intact. This is what makes it useful for logging-without-catching patterns.',
    },
    {
      q: 'In which scenario does the <code>finally</code> block NOT execute?',
      options: [
        'When an unhandled exception propagates out of the try block',
        'When the try block returns a value early with return',
        'When Environment.FailFast() is called or the process is forcibly terminated',
        'When a catch block rethrows an exception with bare throw;',
      ],
      answer: 2,
      explanation: '<code>finally</code> always runs for normal exits, exceptions, and early returns. The rare exceptions are: <code>Environment.FailFast()</code> (which terminates the process immediately), fatal CLR errors (corrupted execution state), or a hard process kill from the OS.',
    },
    {
      q: 'Why is the Result&lt;T&gt; pattern preferred over exceptions for expected failures like validation errors?',
      options: [
        'Result<T> is faster to compile',
        'Exceptions cannot carry error messages',
        'Result<T> makes the failure path explicit in the return type, forcing callers to handle it; exceptions are expensive and can be silently ignored',
        'Result<T> is the only way to return errors from async methods',
      ],
      answer: 2,
      explanation: 'Exceptions carry a full stack trace and are expensive to construct. More importantly, callers can accidentally ignore them. A <code>Result&lt;T&gt;</code> return type makes the failure case part of the API contract — the compiler enforces handling when pattern-matched.',
    },
    {
      q: 'When you <code>await Task.WhenAll(tasks)</code> and multiple tasks fail, how many exceptions do you see in the catch block?',
      options: [
        'All of them — the AggregateException is preserved as-is',
        'Only the first inner exception — await unwraps the AggregateException',
        'None — await swallows exceptions from WhenAll',
        'A new AggregateException containing all failures plus the original AggregateException',
      ],
      answer: 1,
      explanation: 'When you <code>await</code> a task that holds an <code>AggregateException</code>, the runtime unwraps and re-throws the <strong>first</strong> inner exception. To see all failures you must catch on the <code>Task</code> object itself: <code>task.Exception!.InnerExceptions</code>.',
    },
    {
      q: 'What does <code>ExceptionDispatchInfo.Capture(ex).Throw()</code> do that a bare <code>throw ex;</code> does not?',
      options: [
        'It wraps the exception in a new AggregateException before rethrowing',
        'It rethrows the exception with the original stack trace intact, appending a continuation marker rather than resetting to the current location',
        'It schedules the rethrow on the thread pool instead of the current thread',
        'It is identical to throw ex; but available outside catch blocks',
      ],
      answer: 1,
      explanation: '<code>ExceptionDispatchInfo</code> snapshots the exception and its stack trace at the point of capture. When <code>.Throw()</code> is called later (even on a different thread), the original stack trace is preserved and a "--- End of stack trace from previous location ---" separator is added. <code>throw ex;</code> would reset the trace to the calling site.',
    },
    {
      q: 'Which constructor overloads are required for a well-designed custom exception?',
      options: [
        'Only a default constructor',
        'A (string message) constructor and a (string message, Exception inner) constructor',
        'Only the serialisation constructor (SerializationInfo, StreamingContext)',
        'A default constructor and a constructor that accepts all domain properties',
      ],
      answer: 1,
      explanation: 'The two essential constructors are <code>(string message)</code> and <code>(string message, Exception inner)</code>. The inner-exception overload allows wrapping lower-level errors with domain context — critical for diagnosability. The serialisation constructor is legacy but still recommended for library-level exceptions.',
    },
  ];

  qna: QnaItem[] = [
    {
      q: 'When should I throw vs return a Result?',
      a: 'Throw for truly <em>unexpected</em> failures that indicate a bug or infrastructure problem: null reference, database down, stack overflow, out of memory. Return a <code>Result&lt;T&gt;</code> (or similar) for <em>expected</em> domain failures that are part of normal business logic: user not found, validation failed, insufficient funds. A good heuristic: if a reasonable caller should always check for the failure case, use Result; if the failure means "something is broken", throw.',
    },
    {
      q: 'What is ExceptionDispatchInfo and when is it useful?',
      a: '<code>ExceptionDispatchInfo</code> (in <code>System.Runtime.ExceptionServices</code>) captures an exception <em>with its original stack trace</em> so it can be stored and rethrown later without losing context. It is useful when you catch an exception on one thread and need to rethrow it on another:<br><br><code>var edi = ExceptionDispatchInfo.Capture(ex);<br>// ... later, possibly on a different thread ...<br>edi.Throw(); // rethrows with original stack trace + "--- continuation ---" marker</code><br><br>The async infrastructure uses this internally to marshal exceptions from background threads back to the awaiter — which is why <code>await</code>-ed tasks preserve their original stack traces.',
    },
    {
      q: 'How do I handle AggregateException from Task.WhenAll?',
      a: '<code>Task.WhenAll</code> wraps all task exceptions in an <code>AggregateException</code>. When you <code>await</code> it, the first inner exception is automatically unwrapped — so a simple <code>try/await/catch</code> only sees the first failure. To inspect all failures, catch on the <code>Task</code> object directly:<br><br><code>var task = Task.WhenAll(tasks);<br>try { await task; }<br>catch<br>{<br>&nbsp;&nbsp;&nbsp;&nbsp;foreach (var ex in task.Exception!.InnerExceptions)<br>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Console.WriteLine(ex.Message);<br>}</code><br><br>For nested aggregates (e.g. Task.WhenAll of Task.WhenAll calls), use <code>.Flatten()</code> to collapse all levels into a single list.',
    },
    {
      q: 'Is catching Exception ever acceptable?',
      a: 'Yes, in two legitimate scenarios: <ul><li>At the <strong>top-level boundary</strong> of your application (e.g. ASP.NET middleware, background service loop, WPF global handler) to log and return a graceful error rather than crashing.</li><li>When you genuinely need cleanup for <em>any</em> failure and then rethrow with bare <code>throw;</code>.</li></ul> Outside these cases, catching <code>Exception</code> usually indicates missing error handling design. Always log before swallowing, and prefer specific types whenever possible.',
    },
    {
      q: 'What is the logging-without-catching pattern with exception filters?',
      a: 'An exception filter (<code>when</code>) is evaluated before the stack unwinds. If you write <code>catch (Exception ex) when (Log(ex))</code> where <code>Log</code> always returns <code>false</code>, the filter runs (logging the exception), but the catch block never executes — the exception propagates with its full, original stack trace untouched. This is the only way in C# to "observe" an exception mid-propagation without changing its path.',
    },
    {
      q: 'When should I create a custom exception vs. reusing a standard BCL exception?',
      a: 'Use a <strong>custom exception</strong> when: callers need to catch and handle your specific error type distinctly; you need to carry structured domain data (order ID, error code) that a <code>string message</code> cannot represent cleanly; or you want to build an exception hierarchy for a domain (e.g. <code>DomainException → NotFoundException → ConflictException</code>). Reuse BCL exceptions when the meaning fits exactly: <code>ArgumentNullException</code> for null args, <code>InvalidOperationException</code> for invalid state, <code>NotSupportedException</code> for unsupported operations. Never create custom exceptions just to rename existing ones.',
    },
    {
      q: 'What happens if you throw from inside a finally block?',
      a: 'If a <code>finally</code> block throws an exception, the <strong>original exception that was propagating is permanently lost</strong> — only the new exception from <code>finally</code> propagates. This is a common and very hard-to-debug data loss scenario. Always wrap risky code inside <code>finally</code> in its own <code>try/catch</code> and only log cleanup failures — never let them escape. The same rule applies to <code>Dispose()</code> implementations.',
    },
  ];

  challenge: Challenge = {
    title: 'Async Retry with Exponential Backoff',
    description: `Implement a generic retry utility for async operations.
1. Create a static method <code>RetryAsync&lt;T&gt;</code> that accepts a <code>Func&lt;Task&lt;T&gt;&gt;</code>, a max retry count, and a predicate identifying transient exceptions.
2. Use an exception filter (<code>when</code>) inside the catch block to only retry when the exception is transient and retries remain.
3. Apply exponential backoff between retries: wait <code>2^attempt</code> seconds (e.g. 1 s, 2 s, 4 s).
4. On the final attempt, let the exception propagate naturally rather than catching it.`,
    language: 'csharp',
    hints: [
      'Loop from attempt = 0 to maxRetries (inclusive) — the last iteration should not catch',
      'Use when (IsTransient(ex) && attempt < maxRetries) so the final failure propagates',
      'Exponential backoff: await Task.Delay(TimeSpan.FromSeconds(Math.Pow(2, attempt)))',
      'The method signature: static async Task<T> RetryAsync<T>(Func<Task<T>> operation, int maxRetries, Func<Exception, bool> isTransient)',
    ],
    starterCode: `static async Task<T> RetryAsync<T>(
    Func<Task<T>> operation,
    int maxRetries,
    Func<Exception, bool> isTransient)
{
    // TODO: loop up to maxRetries times
    // TODO: use exception filter (when) to only catch transient exceptions when retries remain
    // TODO: apply exponential backoff between retries
    // TODO: let the exception propagate on the final attempt

    throw new NotImplementedException();
}

// Expected usage:
var result = await RetryAsync(
    () => FetchFromApi(),
    maxRetries: 3,
    isTransient: ex => ex is HttpRequestException or TimeoutException);`,
    solution: `static async Task<T> RetryAsync<T>(
    Func<Task<T>> operation,
    int maxRetries,
    Func<Exception, bool> isTransient)
{
    for (var attempt = 0; attempt <= maxRetries; attempt++)
    {
        try
        {
            return await operation();
        }
        catch (Exception ex) when (isTransient(ex) && attempt < maxRetries)
        {
            // Transient failure and retries remain — backoff then retry
            var delay = TimeSpan.FromSeconds(Math.Pow(2, attempt));
            Console.WriteLine($"Attempt {attempt + 1} failed: {ex.Message}. Retrying in {delay.TotalSeconds}s...");
            await Task.Delay(delay);
        }
        // when-filter false (non-transient or final attempt) → exception propagates
    }

    // Unreachable — compiler satisfaction
    throw new InvalidOperationException("Retry loop exited unexpectedly.");
}

// Usage:
var callCount = 0;
var result = await RetryAsync(
    operation: async () =>
    {
        callCount++;
        if (callCount < 3) throw new TimeoutException("Simulated timeout");
        return await Task.FromResult("Success on attempt " + callCount);
    },
    maxRetries: 3,
    isTransient: ex => ex is TimeoutException);

Console.WriteLine(result); // Success on attempt 3`,
  };

  revision: RevisionSummary = {
    oneLiner: 'C# exception handling uses try/catch/finally for structured error recovery; exception filters (when) allow conditional catching without stack unwinding; ExceptionDispatchInfo preserves stack traces across threads; and Result<T> is preferred over exceptions for expected domain failures.',
    mustKnow: [
      'Bare <code>throw;</code> preserves the original stack trace; <code>throw ex;</code> resets it to the current line — always use bare throw when rethrowing',
      '<code>when (filter)</code> evaluates before the stack unwinds — if false, the runtime continues searching for the next catch as if this one never existed',
      '<code>finally</code> always runs (except FailFast/process kill); never throw from finally as it replaces the original exception',
      'Custom exceptions need at minimum a <code>(string message)</code> and a <code>(string message, Exception inner)</code> constructor',
      '<code>Task.WhenAll</code> wraps all failures in <code>AggregateException</code>; <code>await</code> only unwraps the first — inspect <code>task.Exception!.InnerExceptions</code> for all',
      '<code>ExceptionDispatchInfo.Capture(ex).Throw()</code> rethrows with the original stack trace intact — used internally by the async machinery',
      'Use <code>Result&lt;T&gt;</code> for expected domain failures (not found, validation); use exceptions for unexpected infrastructure failures',
    ],
    interviewFocus: [
      'Why does <code>throw ex;</code> lose the stack trace, and how does bare <code>throw;</code> fix it?',
      'How do exception filters (<code>when</code>) differ from a normal catch + rethrow? When would you use them?',
      'How do you see all failures from <code>Task.WhenAll</code> when multiple tasks fail?',
      'What is the performance cost of exceptions and when is <code>Result&lt;T&gt;</code> more appropriate?',
      'What happens if you throw an exception inside a <code>finally</code> block?',
    ],
  };
}
