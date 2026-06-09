import { Component } from '@angular/core';
import { CodeBlockComponent, CodeTab } from '../../../shared/code-block/code-block';
import { TheoryBlockComponent, TheoryPoint } from '../../../shared/theory-block/theory-block';
import { QnaBlockComponent, QnaItem } from '../../../shared/qna-block/qna-block';
import { QuizBlockComponent, QuizQuestion } from '../../../shared/quiz-block/quiz-block';
import { ChallengeBlockComponent, Challenge } from '../../../shared/challenge-block/challenge-block';
import { QuickRefComponent, QuickRefItem } from '../../../shared/quick-ref/quick-ref';
import { PageMetaComponent } from '../../../shared/page-meta/page-meta';
import { PageCompleteComponent } from '../../../shared/page-complete/page-complete';

@Component({
  selector: 'app-csharp-exceptions',
  standalone: true,
  imports: [
    CodeBlockComponent, TheoryBlockComponent, QnaBlockComponent,
    QuizBlockComponent, ChallengeBlockComponent, QuickRefComponent,
    PageMetaComponent, PageCompleteComponent,
  ],
  templateUrl: './exceptions.html',
  styleUrl: './exceptions.scss',
})
export class CsharpExceptions {

  quickRef: QuickRefItem[] = [
    { name: 'try / catch / finally', type: 'keyword', desc: 'Structured error-handling block: try the risky code, catch specific exceptions, finally always cleans up' },
    { name: 'throw',                 type: 'keyword', desc: 'Throws a new exception or rethrows a caught exception (use bare throw; to preserve the stack trace)' },
    { name: 'throw;',                type: 'syntax',  desc: 'Bare rethrow — re-raises the current exception without resetting its stack trace' },
    { name: 'when (filter)',         type: 'keyword', desc: 'Exception filter evaluated before entering the catch block; does not unwind the stack if false' },
    { name: 'Exception',             type: 'class',   desc: 'Base class for all exceptions; provides Message, StackTrace, and InnerException properties' },
    { name: 'ArgumentException',     type: 'class',   desc: 'Thrown when a method argument is invalid; use ArgumentNullException or ArgumentOutOfRangeException for specifics' },
    { name: 'InvalidOperationException', type: 'class', desc: 'Thrown when a method call is invalid for the object\'s current state' },
    { name: 'AggregateException',    type: 'class',   desc: 'Wraps multiple exceptions; commonly thrown by Task.WhenAll and Parallel.ForEach' },
    { name: 'ExceptionDispatchInfo', type: 'class',   desc: 'Captures an exception with its stack trace so it can be rethrown later without losing context' },
    { name: 'using statement',       type: 'syntax',  desc: 'Syntactic sugar for try/finally; calls Dispose() on the resource when the scope exits' },
  ];

  theory: TheoryPoint[] = [
    {
      heading: 'Catch specific, rethrow raw',
      points: [
        'Always catch the most specific exception type first — <code>FileNotFoundException</code> before <code>IOException</code> before <code>Exception</code>.',
        'Use bare <code>throw;</code> (not <code>throw ex;</code>) to rethrow — <code>throw ex;</code> resets the stack trace to the current line, destroying the original call site.',
        'Only catch exceptions you can actually handle; let unexpected ones propagate to a global handler.',
        'Swallowing exceptions silently (<code>catch { }</code>) is almost always wrong — at minimum, log before rethrowing.',
      ],
    },
    {
      heading: 'Exception filters (when)',
      points: [
        '<code>catch (Exception ex) when (ex.Message.Contains("timeout"))</code> — the filter runs before the stack unwinds.',
        'If the <code>when</code> predicate returns <code>false</code>, the runtime continues looking for the next matching catch block as if this one did not exist.',
        'This is ideal for logging without catching: <code>when (Log(ex))</code> where <code>Log</code> always returns <code>false</code>.',
        'Unlike a re-throw, a failed <code>when</code> filter leaves the original stack trace completely intact.',
      ],
    },
    {
      heading: 'finally for cleanup',
      points: [
        '<code>finally</code> always runs — whether an exception is thrown, caught, or the <code>try</code> block returns normally.',
        'The only exceptions to "finally always runs": <code>Environment.FailFast()</code>, a fatal CLR error, or process termination.',
        'Prefer <code>using</code> statements (or <code>using var</code> declarations) over manual <code>try/finally</code> for <code>IDisposable</code> resources — they compile to the same IL.',
        'Do not throw from <code>finally</code> — it replaces the original exception and the original is lost.',
      ],
    },
    {
      heading: 'Result pattern vs exceptions',
      points: [
        'Exceptions are expensive: they capture a full stack trace and are intended for <em>exceptional</em> circumstances, not for normal control flow.',
        'For expected failures — validation errors, not-found, business rule violations — consider a <code>Result&lt;T&gt;</code> or <code>OneOf</code> pattern that makes the failure path explicit in the return type.',
        '<code>Result&lt;T&gt;</code> forces callers to handle both success and failure, unlike exceptions which can be silently ignored.',
        'Use exceptions for truly unexpected failures (database down, null reference, out of memory); use Result for expected domain failures.',
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

// ── Exception properties ───────────────────────────────────────────────
try
{
    throw new InvalidOperationException("outer", new ArgumentNullException("value"));
}
catch (InvalidOperationException ex)
{
    Console.WriteLine(ex.Message);                  // outer
    Console.WriteLine(ex.InnerException?.Message);  // Value cannot be null. (Parameter 'value')
    Console.WriteLine(ex.StackTrace?[..120]);        // truncated stack trace
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

    // Serialisation constructor — required for cross-AppDomain marshalling
    protected OrderException(SerializationInfo info, StreamingContext context)
        : base(info, context)
    {
        OrderId   = info.GetString(nameof(OrderId))!;
        ErrorCode = info.GetString(nameof(ErrorCode))!;
    }
}

// ── Exception hierarchy for a domain ──────────────────────────────────
public class DomainException           : Exception
{
    public DomainException(string msg) : base(msg) { }
    public DomainException(string msg, Exception inner) : base(msg, inner) { }
}

public class NotFoundException         : DomainException
{
    public NotFoundException(string entity, object id)
        : base($"{entity} with id '{id}' was not found.") { }
}

public class ConflictException         : DomainException
{
    public ConflictException(string message) : base(message) { }
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
      explanation: '<code>finally</code> always runs for normal exits, exceptions, and early returns. The rare exceptions are: <code>Environment.FailFast()</code> (which terminates the process immediately), fatal CLR errors (like a corrupted state exception), or a hard process kill from the OS.',
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
      explanation: 'Exceptions carry a full stack trace and are expensive to construct. More importantly, callers can accidentally ignore them. A <code>Result&lt;T&gt;</code> return type makes the failure case part of the API contract — the compiler forces callers to check <code>IsSuccess</code> before accessing the value.',
    },
  ];

  qna: QnaItem[] = [
    {
      q: 'When should I throw vs return a Result?',
      a: 'Throw for truly <em>unexpected</em> failures that indicate a bug or infrastructure problem: null reference, database down, stack overflow, out of memory. Return a <code>Result&lt;T&gt;</code> (or similar) for <em>expected</em> domain failures that are part of normal business logic: user not found, validation failed, insufficient funds. A good heuristic: if a reasonable caller should always check for the failure case, use Result; if the failure means "something is broken", throw.',
    },
    {
      q: 'What is ExceptionDispatchInfo?',
      a: '<code>ExceptionDispatchInfo</code> (in <code>System.Runtime.ExceptionServices</code>) captures an exception <em>with its original stack trace</em> so it can be stored and rethrown later. This is useful when you catch an exception on one thread or at one point in time and need to rethrow it elsewhere: <pre><code>var edi = ExceptionDispatchInfo.Capture(ex);\n// ... later, possibly on another thread ...\nedi.Throw(); // rethrows with original stack trace preserved</code></pre> The async infrastructure uses this internally to marshal exceptions from background threads back to the awaiter.',
    },
    {
      q: 'How do I handle AggregateException from Task.WhenAll?',
      a: '<code>Task.WhenAll</code> wraps all task exceptions in an <code>AggregateException</code>. When you <code>await</code> it, the first inner exception is automatically unwrapped — so a simple <code>try/await/catch</code> only sees the first failure. To inspect all failures, catch <code>AggregateException</code> directly on the <code>Task</code>: <pre><code>var task = Task.WhenAll(tasks);\ntry { await task; }\ncatch\n{\n    foreach (var ex in task.Exception!.InnerExceptions)\n        Console.WriteLine(ex.Message);\n}</code></pre> Or use <code>AggregateException.Flatten()</code> when you have nested aggregates.',
    },
    {
      q: 'Is catching Exception ever OK?',
      a: 'Yes, in two legitimate scenarios. First, at the <em>top-level boundary</em> of your application (e.g. an ASP.NET middleware, a background service loop, a WPF unhandled-exception handler) to log the error and return a 500 / fail gracefully rather than crashing. Second, when you genuinely need to run cleanup for <em>any</em> failure and then rethrow with bare <code>throw;</code>. Outside these cases, catching <code>Exception</code> usually indicates missing error handling design. Always at minimum log before swallowing, and prefer specific types whenever possible.',
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
        // If when-filter is false (non-transient or final attempt), exception propagates here
    }

    // Unreachable — loop always returns or throws, but satisfies the compiler
    throw new InvalidOperationException("Retry loop exited unexpectedly.");
}

// Usage example:
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
}
