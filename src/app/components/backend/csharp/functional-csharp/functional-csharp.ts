import { Component } from '@angular/core';
import { CodeBlockComponent, CodeTab } from '../../../shared/code-block/code-block';
import { TheoryBlockComponent, TheoryPoint } from '../../../shared/theory-block/theory-block';
import { QnaBlockComponent, QnaItem } from '../../../shared/qna-block/qna-block';
import { QuizBlockComponent, QuizQuestion } from '../../../shared/quiz-block/quiz-block';
import { ChallengeBlockComponent, Challenge } from '../../../shared/challenge-block/challenge-block';
import { QuickRefComponent, QuickRefItem } from '../../../shared/quick-ref/quick-ref';
import { PageMetaComponent } from '../../../shared/page-meta/page-meta';
import { PageCompleteComponent } from '../../../shared/page-complete/page-complete';
import { RevisionCardComponent, RevisionSummary } from '../../../shared/revision-card/revision-card';
import { CommonMistakesComponent, CommonMistake } from '../../../shared/common-mistakes/common-mistakes';
import { BeforeAfterComponent, BeforeAfterExample } from '../../../shared/before-after/before-after';
import { PrerequisitesComponent, Prerequisite } from '../../../shared/prerequisites/prerequisites';

@Component({
  selector: 'app-csharp-functional-csharp',
  standalone: true,
  imports: [
    CodeBlockComponent, TheoryBlockComponent, QnaBlockComponent,
    QuizBlockComponent, ChallengeBlockComponent, QuickRefComponent,
    PageMetaComponent, PageCompleteComponent, RevisionCardComponent,
    CommonMistakesComponent, BeforeAfterComponent, PrerequisitesComponent,
  ],
  templateUrl: './functional-csharp.html',
  styleUrl: './functional-csharp.scss',
})
export class CsharpFunctionalCsharp {

  prerequisites: Prerequisite[] = [
    { label: 'Generics',         route: '/csharp/generics' },
    { label: 'Pattern Matching', route: '/csharp/pattern-matching' },
  ];

  quickRef: QuickRefItem[] = [
    { name: 'Result<T>',              type: 'type',     desc: 'Discriminated union: success (holds a Value) or failure (holds an Error) — never both', since: '.NET 6+' },
    { name: '.IsSuccess / .IsFailed', type: 'accessor', desc: 'Boolean gate — always check .IsSuccess before reading .Value', since: '.NET 6+' },
    { name: '.Value',                 type: 'accessor', desc: 'The success value — throws InvalidOperationException if accessed on a failed Result', since: '.NET 6+' },
    { name: '.Map(T → U)',            type: 'method',   desc: 'Transforms the success value; the transform cannot fail; failures pass through unchanged', since: '.NET 6+' },
    { name: '.Bind(T → Result<U>)',   type: 'method',   desc: 'Chains a fallible operation — failure short-circuits the chain (the "railway switch")', since: '.NET 6+' },
    { name: '.Match(onSuccess, onFail)', type: 'method', desc: 'Exhaustive handler — always handle both cases; returns a value from either branch', since: '.NET 6+' },
    { name: 'Result.Ok(value)',       type: 'method',   desc: 'FluentResults factory for a successful result with a typed value', since: 'FluentResults 3+' },
    { name: 'Result.Fail("msg")',     type: 'method',   desc: 'FluentResults factory for a failed result; accepts string, IError, or List<IError>', since: 'FluentResults 3+' },
    { name: 'ErrorOr<T>',            type: 'type',     desc: 'Minimal library: implicit operators, .Match(), .MatchAsync() — great ASP.NET Core fit', since: 'ErrorOr 1+' },
    { name: 'OneOf<T1, T2, T3>',     type: 'type',     desc: 'True N-state discriminated union — each state carries distinct data, forces exhaustive matching', since: 'OneOf 3+' },
  ];

  theory: TheoryPoint[] = [
    {
      heading: 'The problem with exception-driven control flow',
      points: [
        'Exceptions were designed for truly <em>exceptional</em> situations — bugs, infrastructure failures, programmer errors. Using them for expected domain failures (user not found, invalid input, duplicate email) is an antipattern that causes real problems.',
        'The core issue: exceptions are <strong>invisible in method signatures</strong>. A caller invoking <code>GetUser(id)</code> has no way to know it can throw <code>UserNotFoundException</code> — the compiler gives no warning, and the error can be silently swallowed.',
        'Exceptions also impose a performance cost: every <code>throw</code> allocates an exception object and unwinds the call stack. For validation-heavy APIs handling thousands of requests per second, this is measurably slower than returning a failure value.',
        'The fix is to represent failure as part of the <strong>return type</strong>. A method that returns <code>Result&lt;User&gt;</code> declares in its signature that the operation can fail — the compiler forces the caller to handle both outcomes.',
      ],
    },
    {
      heading: 'Result<T> anatomy: success, failure, and factory methods',
      points: [
        'A Result has exactly two states: <strong>Success</strong> (holds a <code>Value</code> of type T) or <strong>Failure</strong> (holds an error). These states are mutually exclusive — no "partial success", no default null value.',
        'The constructor is private. Use static factory methods: <code>Result&lt;User&gt;.Success(user)</code> and <code>Result&lt;User&gt;.Failure("not found")</code>. This enforces valid state from the moment of construction.',
        '<code>.IsSuccess</code> is the gate: always check it before reading <code>.Value</code>. A well-implemented Result throws <code>InvalidOperationException</code> when <code>.Value</code> is accessed on a failed Result — not silently return null.',
        'Prefer typed error objects over plain strings: define <code>NotFoundError</code>, <code>ValidationError</code>, <code>ForbiddenError</code> records and carry them as the error payload. Callers can then pattern-match on the error type and react differently to each failure kind.',
      ],
    },
    {
      heading: 'Map and Bind: Railway-Oriented Programming',
      points: [
        'Imagine two parallel railway tracks: the <em>happy track</em> (success) and the <em>error track</em> (failure). Each operation is a switch — success keeps you on the happy track; failure derails you onto the error track. Once derailed, all subsequent switches are <strong>bypassed</strong>.',
        '<code>Map(T → U)</code> applies an infallible transform to the success value and wraps the result. Think of it as <code>Select</code> for the value inside a Result. Failures pass through Map untouched — the transform is never called.',
        '<code>Bind(T → Result&lt;U&gt;)</code> chains a fallible operation. If the current Result is a failure, Bind short-circuits and returns that failure without invoking the function. If successful, it calls the function and returns its Result. This "flattens" the <code>Result&lt;Result&lt;U&gt;&gt;</code> that a naive Map would produce.',
        'A chain like <code>Validate(dto).Bind(CheckInventory).Bind(Charge).Map(Confirm)</code> reads as a specification: each step runs only if the previous succeeded. If Validate fails, none of the remaining steps are called — the failure propagates automatically.',
      ],
    },
    {
      heading: 'Popular libraries: FluentResults, ErrorOr, OneOf',
      points: [
        '<strong>FluentResults</strong> is the richest option: multiple errors per result, metadata, custom <code>IError</code> implementations, reasons hierarchy. Factory: <code>Result.Ok(value)</code> / <code>Result.Fail("msg")</code>. Best for domain-heavy applications where a single operation can produce several distinct errors that all matter.',
        '<strong>ErrorOr</strong> is minimal and lean. Implicit operators let you return <code>user</code> (the value) or <code>Error.NotFound()</code> directly from a method declared as returning <code>ErrorOr&lt;User&gt;</code>. <code>.Match()</code> and <code>.MatchAsync()</code> pair cleanly with ASP.NET Core minimal APIs and reduce boilerplate.',
        '<strong>OneOf</strong> is a true discriminated union — it can hold any N distinct types with different data per case. Use it when an operation returns <code>OneOf&lt;Success, NotFound, Forbidden, ValidationErrors&gt;</code> and each case needs separate handling with different payload shapes.',
        '<strong>Hand-rolled</strong> is valid for simple projects or learning purposes: zero dependencies, full control, about 30 lines of code. Implement <code>IsSuccess</code>, <code>Value</code>, <code>Error</code>, <code>Map</code>, <code>Bind</code>, and <code>Match</code>. Add a second generic parameter for the error type when you need typed errors.',
      ],
    },
    {
      heading: 'ASP.NET Core integration: converting Result<T> to IResult',
      points: [
        'The rule: <strong>services return <code>Result&lt;T&gt;</code></strong>; <strong>endpoint handlers convert to HTTP</strong>. The domain layer knows nothing about HTTP status codes — that conversion belongs at the boundary.',
        'With ErrorOr: <code>return result.Match(user =&gt; TypedResults.Ok(user), errors =&gt; TypedResults.Problem(...))</code>. With FluentResults: check <code>result.IsSuccess</code>, then return <code>TypedResults.Ok(result.Value)</code> or map errors to <code>TypedResults.Problem()</code>.',
        'Map error types to HTTP status codes consistently: <code>NotFoundError</code> → 404, <code>ValidationError</code> → 422 (UnprocessableEntity), <code>ForbiddenError</code> → 403, <code>ConflictError</code> → 409. Use <code>ProblemDetails</code> for structured error bodies.',
        'For async operations, use <code>Task&lt;Result&lt;T&gt;&gt;</code> — Task is the outer wrapper (it is awaitable), Result is the value. Await normally; the Result is what you get after awaiting. Never write <code>async Result&lt;T&gt;</code> — Result does not implement the awaitable pattern.',
      ],
    },
    {
      heading: 'When to throw vs when to return Result<T>',
      points: [
        '<strong>Always throw</strong> for: programming errors (null reference, index out of bounds), argument precondition violations (<code>ArgumentNullException</code>, <code>ArgumentException</code>), and infrastructure failures (DB unavailable, network timeout, disk full).',
        '<strong>Return Result&lt;T&gt;</strong> for: expected domain-level failures that callers can meaningfully recover from — user not found, duplicate email, insufficient permissions, business rule violation, external API returning 4xx.',
        'A useful test: <em>"Is this failure something I document in API contracts and write unit tests for?"</em> If yes → Result. <em>"Is this a surprise that means something is broken or unavailable?"</em> If yes → throw.',
        'Avoid wrapping every method in Result. A method with no failure path (<code>int Add(int a, int b)</code>) should not return <code>Result&lt;int&gt;</code>. That is over-engineering and forces callers to unwrap for zero benefit.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Hand-rolled Result<T>',
      language: 'csharp',
      code: `// Minimal hand-rolled Result<T> — zero dependencies, full control
public sealed class Result<T>
{
    public bool IsSuccess { get; }
    public bool IsFailed  => !IsSuccess;

    public T Value => IsSuccess
        ? _value!
        : throw new InvalidOperationException("Result is failed — check IsSuccess first.");
    public string Error => IsFailed
        ? _error!
        : throw new InvalidOperationException("Result is successful — no error exists.");

    private readonly T?      _value;
    private readonly string? _error;

    private Result(T value)       { IsSuccess = true;  _value = value; }
    private Result(string error)  { IsSuccess = false; _error = error; }

    public static Result<T> Success(T value)    => new(value);
    public static Result<T> Failure(string err) => new(err);

    // Map: transform the success value — transform cannot itself fail
    public Result<U> Map<U>(Func<T, U> transform) =>
        IsSuccess ? Result<U>.Success(transform(Value)) : Result<U>.Failure(Error);

    // Bind: chain a fallible operation — failure short-circuits the chain
    public Result<U> Bind<U>(Func<T, Result<U>> next) =>
        IsSuccess ? next(Value) : Result<U>.Failure(Error);

    // Exhaustive handler — always handle both cases
    public TOut Match<TOut>(Func<T, TOut> onSuccess, Func<string, TOut> onFailure) =>
        IsSuccess ? onSuccess(Value) : onFailure(Error);

    public T GetValueOrDefault(T defaultValue = default!) =>
        IsSuccess ? Value : defaultValue;
}

// Usage
Result<User> GetUser(int id)
{
    var user = _db.Users.Find(id);
    return user is null
        ? Result<User>.Failure($"User {id} not found")
        : Result<User>.Success(user);
}

var result = GetUser(42)
    .Map(u => u.Email.ToLower())           // safe transform — cannot fail
    .Bind(email => ValidateEmail(email));  // can fail

string output = result.Match(
    onSuccess: v   => $"Valid email: {v}",
    onFailure: err => $"Error: {err}"
);`,
    },
    {
      label: 'Railway chaining',
      language: 'csharp',
      code: `// Railway-Oriented Programming — chain of fallible operations
// Each step only executes if the previous step succeeded

Result<OrderConfirmation> ProcessOrder(CreateOrderDto dto)
{
    return ValidateDto(dto)          // Result<ValidatedDto>
        .Bind(CheckInventory)        // Result<ReservedItems>
        .Bind(ChargePayment)         // Result<PaymentResult>
        .Bind(CreateOrderRecord)     // Result<Order>
        .Map(order => new OrderConfirmation(order.Id, order.Total));
    // If any step returns Failure → all subsequent steps are skipped
}

Result<ValidatedDto> ValidateDto(CreateOrderDto dto)
{
    if (dto.Items.Count == 0)
        return Result<ValidatedDto>.Failure("Order must have at least one item.");
    if (dto.ShippingAddress is null)
        return Result<ValidatedDto>.Failure("Shipping address is required.");
    return Result<ValidatedDto>.Success(new ValidatedDto(dto));
}

Result<ReservedItems> CheckInventory(ValidatedDto dto)
{
    foreach (var item in dto.Items)
    {
        if (!_inventory.HasStock(item.ProductId, item.Quantity))
            return Result<ReservedItems>.Failure(
                $"Insufficient stock for product {item.ProductId}");
    }
    return Result<ReservedItems>.Success(_inventory.Reserve(dto.Items));
}

// Consuming the result
var result = ProcessOrder(dto);
result.Match(
    onSuccess: conf  => Console.WriteLine($"Order {conf.Id} confirmed — total: {conf.Total:C}"),
    onFailure: error => Console.WriteLine($"Order failed: {error}")
);

// Reading value directly (only when you've already checked IsSuccess)
if (result.IsSuccess)
    await NotifyCustomer(result.Value);`,
    },
    {
      label: 'FluentResults',
      language: 'csharp',
      code: `// dotnet add package FluentResults
using FluentResults;

public class UserService
{
    public Result<User> GetUser(int id)
    {
        var user = _repo.Find(id);
        if (user is null)
            return Result.Fail(new NotFoundError("User", id));   // typed error
        return Result.Ok(user);
    }

    public Result<User> UpdateEmail(int id, string newEmail)
    {
        return GetUser(id)
            .Bind(user =>
            {
                if (!newEmail.Contains('@'))
                    return Result.Fail<User>(new ValidationError("email", "Invalid format"));
                user.Email = newEmail;
                _repo.Update(user);
                return Result.Ok(user);
            });
    }

    // Collect multiple validation errors in one pass
    public Result<UserDto> CreateUser(CreateUserDto dto)
    {
        var errors = new List<IError>();
        if (string.IsNullOrEmpty(dto.Name))  errors.Add(new ValidationError("name", "Required"));
        if (!dto.Email.Contains('@'))         errors.Add(new ValidationError("email", "Invalid"));
        if (_repo.EmailExists(dto.Email))     errors.Add(new ConflictError("email", "Already in use"));

        if (errors.Count > 0)
            return Result.Fail<UserDto>(errors);

        var user = _repo.Create(dto);
        return Result.Ok(user.ToDto());
    }
}

// Custom typed errors — carry structured data
public class NotFoundError(string entity, object id)
    : Error($"{entity} with id {id} was not found");
public class ValidationError(string field, string msg)
    : Error($"{field}: {msg}");
public class ConflictError(string field, string msg)
    : Error($"{field} conflict: {msg}");

// ASP.NET Core: convert to IResult at the boundary
app.MapGet("/users/{id}", (int id, UserService svc) =>
{
    var result = svc.GetUser(id);
    if (result.IsSuccess)
        return TypedResults.Ok(result.Value);

    return result.Errors[0] is NotFoundError
        ? TypedResults.NotFound()
        : TypedResults.Problem(detail: string.Join(", ", result.Errors.Select(e => e.Message)));
});`,
    },
    {
      label: 'ErrorOr + ASP.NET',
      language: 'csharp',
      code: `// dotnet add package ErrorOr
using ErrorOr;

// Implicit operators allow clean, natural return syntax
public class ProductService
{
    public ErrorOr<Product> GetProduct(Guid id)
    {
        var product = _repo.Find(id);
        if (product is null)
            return Error.NotFound("Product.NotFound", $"Product {id} was not found");
        return product;  // implicit: wraps in ErrorOr<Product> success
    }

    public ErrorOr<Product> CreateProduct(CreateProductDto dto)
    {
        if (dto.Price <= 0)
            return Error.Validation("Product.InvalidPrice", "Price must be positive");
        if (_repo.SkuExists(dto.Sku))
            return Error.Conflict("Product.DuplicateSku", $"SKU {dto.Sku} already exists");

        return _repo.Create(dto);  // success — implicit cast
    }
}

// Minimal API endpoints — .Match() converts Result to IResult cleanly
app.MapGet("/products/{id:guid}", (Guid id, ProductService svc) =>
    svc.GetProduct(id).Match(
        onValue: product => TypedResults.Ok(product),
        onError: errors  => MapErrors(errors[0])
    ));

app.MapPost("/products", (CreateProductDto dto, ProductService svc) =>
    svc.CreateProduct(dto).Match(
        onValue: product => TypedResults.Created($"/products/{product.Id}", product),
        onError: errors  => MapErrors(errors[0])
    ));

static IResult MapErrors(Error error) => error.Type switch
{
    ErrorType.NotFound   => TypedResults.NotFound(),
    ErrorType.Conflict   => TypedResults.Conflict(),
    ErrorType.Validation => TypedResults.UnprocessableEntity(new { error.Description }),
    _                    => TypedResults.Problem("An unexpected error occurred"),
};

// Async methods: Task<ErrorOr<T>>
public async Task<ErrorOr<Product>> GetProductAsync(Guid id)
{
    var product = await _repo.FindAsync(id);
    if (product is null)
        return Error.NotFound("Product.NotFound", "Not found");
    return product;
}

// Chaining async operations
var result = await svc.GetProductAsync(id)
    .ThenAsync(p => svc.GetRelatedAsync(p.CategoryId));`,
    },
    {
      label: 'OneOf discriminated unions',
      language: 'csharp',
      code: `// dotnet add package OneOf
using OneOf;

// Each outcome is a distinct type with its own data shape
public record UserFound(User User);
public record UserNotFound(int Id);
public record UserForbidden(string Reason);
public record UserDeleted(DateTimeOffset DeletedAt);

// True N-state union — richer than binary Result<T>
public OneOf<UserFound, UserNotFound, UserForbidden, UserDeleted>
    GetUserForRequest(int userId, ClaimsPrincipal caller)
{
    var user = _db.Users
        .IgnoreQueryFilters()
        .FirstOrDefault(u => u.Id == userId);

    if (user is null)            return new UserNotFound(userId);
    if (user.IsDeleted)          return new UserDeleted(user.DeletedAt);
    if (!caller.CanAccess(user)) return new UserForbidden("Insufficient permissions");
    return new UserFound(user);
}

// .Match() requires handling ALL cases — the compiler enforces exhaustiveness
string message = response.Match(
    found     => $"Hello, {found.User.Name}",
    notFound  => $"User {notFound.Id} does not exist",
    forbidden => $"Access denied: {forbidden.Reason}",
    deleted   => $"Account deleted on {deleted.DeletedAt:d}"
);

// .Switch() for void side-effects
response.Switch(
    found     => cache.Set(userId, found.User),
    notFound  => logger.LogWarning("User {Id} not found", notFound.Id),
    forbidden => metrics.Increment("access_denied"),
    deleted   => { /* nothing to do */ }
);

// ASP.NET Core: map each case to an HTTP response
app.MapGet("/users/{id}", (int id, UserService svc, ClaimsPrincipal user) =>
    svc.GetUserForRequest(id, user).Match(
        found     => TypedResults.Ok(found.User),
        notFound  => (IResult)TypedResults.NotFound(),
        forbidden => TypedResults.Forbid(),
        deleted   => TypedResults.Gone()
    ));`,
    },
  ];

  beforeAfter: BeforeAfterExample[] = [
    {
      title: 'Exception-driven vs Result<T>',
      language: 'csharp',
      before: `// Failure is invisible in the method signature
public User GetUser(int id)
{
    var user = _db.Find(id);
    if (user is null)
        throw new UserNotFoundException(id); // invisible!
    return user;
}

// Caller must know to wrap in try/catch
try
{
    var user = GetUser(42);
    ProcessUser(user);
}
catch (UserNotFoundException ex)
{
    // easy to forget — compiler won't warn you
    return NotFound(ex.Message);
}`,
      after: `// Failure is part of the method's contract
public Result<User> GetUser(int id)
{
    var user = _db.Find(id);
    return user is null
        ? Result<User>.Failure($"User {id} not found")
        : Result<User>.Success(user);
}

// Caller is forced to handle both outcomes
var result = GetUser(42);
if (result.IsSuccess)
    ProcessUser(result.Value);
else
    return NotFound(result.Error);

// Or with Match:
return result.Match(
    onSuccess: user  => Ok(user),
    onFailure: error => NotFound(error));`,
      note: 'Result<T> makes failure a documented, compiler-visible part of the API contract. Callers cannot accidentally ignore it.',
    },
    {
      title: 'Manual error checks vs Bind chaining',
      language: 'csharp',
      before: `// Manual if-checks at every step — boilerplate buries the logic
public Result<Confirmation> ProcessOrder(OrderDto dto)
{
    var v = Validate(dto);
    if (v.IsFailed) return Result<Confirmation>.Failure(v.Error);

    var inv = CheckInventory(v.Value);
    if (inv.IsFailed) return Result<Confirmation>.Failure(inv.Error);

    var pay = Charge(inv.Value);
    if (pay.IsFailed) return Result<Confirmation>.Failure(pay.Error);

    return Result<Confirmation>.Success(Confirm(pay.Value));
}`,
      after: `// Bind chains steps — failure propagates automatically
public Result<Confirmation> ProcessOrder(OrderDto dto)
{
    return Validate(dto)      // if fails → Bind/Map below are all skipped
        .Bind(CheckInventory)
        .Bind(Charge)
        .Map(Confirm);
    // Three lines of business logic, zero repetitive error checks
}`,
      note: 'Bind eliminates the repetitive if (result.IsFailed) return... boilerplate. The pipeline reads like a specification of what should happen on the happy path.',
    },
  ];

  mistakes: CommonMistake[] = [
    {
      title: 'Reading .Value without checking IsSuccess',
      wrong: `var result = GetUser(id);
var name = result.Value.Name;
// Throws InvalidOperationException if result is failed!`,
      right: `var result = GetUser(id);
if (result.IsSuccess)
    Console.WriteLine(result.Value.Name);
else
    Console.WriteLine($"Error: {result.Error}");

// Or use Match — forces you to handle both cases:
var display = result.Match(u => u.Name, err => $"Error: {err}");`,
      explanation: '.Value on a failed Result throws InvalidOperationException. Always gate with .IsSuccess, use .Match() to handle both cases, or use .GetValueOrDefault() when a default is acceptable.',
    },
    {
      title: 'Using Result<T> for infrastructure failures',
      wrong: `// DB outages, network errors are NOT domain failures
public Result<List<User>> GetAllUsers()
{
    try { return Result<List<User>>.Success(_db.Users.ToList()); }
    catch (SqlException ex)
    {
        return Result<List<User>>.Failure(ex.Message); // masks a real bug!
    }
}`,
      right: `// Let infrastructure failures propagate as exceptions
public List<User> GetAllUsers()
{
    return _db.Users.ToList(); // SqlException propagates naturally
}

// Use Result<T> only for domain-level expected failures:
public Result<User> FindUser(int id)
{
    var user = _db.Users.Find(id);
    return user is null
        ? Result<User>.Failure($"User {id} not found")
        : Result<User>.Success(user);
}`,
      explanation: 'A catch-all that converts exceptions to Result failures masks infrastructure bugs and makes them appear as recoverable domain errors. Let infrastructure failures propagate — monitoring can catch them.',
    },
    {
      title: 'String-typed errors instead of typed error objects',
      wrong: `// String errors lose structure — callers can't distinguish types
return Result<User>.Failure("not found");
// ...
if (result.Error == "not found")  // fragile string comparison`,
      right: `// Typed errors carry structure and enable pattern matching
public abstract record DomainError(string Message);
public record NotFoundError(string Entity, object Id)
    : DomainError($"{Entity} {Id} not found");
public record ValidationError(string Field, string Detail)
    : DomainError($"{Field}: {Detail}");

// Callers react by type — no magic strings
_ = result.Error switch
{
    NotFoundError   => Results.NotFound(),
    ValidationError => Results.UnprocessableEntity(),
    _               => Results.Problem(),
};`,
      explanation: 'Typed errors make the Result API self-documenting and enable exhaustive switch matching. Callers can react differently to different failure kinds without fragile string comparisons.',
    },
    {
      title: 'Wrapping every method in Result<T>',
      wrong: `// Over-engineering — these have no failure path
public Result<int> Add(int a, int b)
    => Result<int>.Success(a + b);
public Result<string> Reverse(string s)
    => Result<string>.Success(new string(s.Reverse().ToArray()));
// Callers must now unwrap for zero benefit`,
      right: `// Only use Result<T> where genuine failure exists
public int Add(int a, int b) => a + b;
public string Reverse(string s) => new string(s.Reverse().ToArray());

// Result<T> earns its keep here:
public Result<User> FindUser(int id)     { /* can be not found */ }
public Result<Order> PlaceOrder(dto)     { /* can fail validation or payment */ }`,
      explanation: 'Result<T> adds caller overhead — they must unwrap it. Only apply it to operations with genuine, documentable failure paths. Three similar lines with no failure case do not need Result.',
    },
    {
      title: 'Mixing exceptions and Result inside one method',
      wrong: `public Result<User> GetUser(int id)
{
    try
    {
        var user = _db.Users.Find(id);
        if (user is null) return Result<User>.Failure("not found");
        return Result<User>.Success(user);
    }
    catch (Exception ex)
    {
        // Converts DB outage into a "domain failure" — wrong!
        return Result<User>.Failure(ex.Message);
    }
}`,
      right: `// Let DB exceptions propagate — they are not domain failures
public Result<User> GetUser(int id)
{
    var user = _db.Users.Find(id);  // SqlException propagates naturally
    return user is null
        ? Result<User>.Failure($"User {id} not found")
        : Result<User>.Success(user);
}
// Catch unhandled exceptions in middleware, translate to 500 there`,
      explanation: 'A blanket catch inside a Result-returning method converts infrastructure bugs into apparent domain failures. Only catch exceptions at the application boundary where you translate them to error responses.',
    },
  ];

  challenge: Challenge = {
    title: 'Build a validated user registration pipeline',
    language: 'csharp',
    description: `Implement a Result<T> type with Map and Bind, then build a user registration pipeline that:
1. Validates the DTO (name required, email must contain '@', password ≥ 8 chars)
2. Checks for a duplicate email in a pre-existing list
3. "Hashes" the password (simulate with "hashed_" + password)
4. Creates the registered user record

Each step must return Result<T>. The pipeline must stop at the first failure. No try/catch inside the pipeline.`,
    hints: [
      'Result<T> needs two private constructors (success + failure) and static factory methods',
      'Bind receives the success value, calls the next function, returns its Result directly',
      'Map just wraps a transform — use it for the final non-fallible step',
      'Test with an invalid email — the pipeline should stop before checking duplicates',
      'The Bind overload in the starter uses a tuple to pass both dto and hash to the final step',
    ],
    starterCode: `using System;
using System.Collections.Generic;

public sealed class Result<T>
{
    // TODO: IsSuccess, IsFailed, Value, Error
    // TODO: static Success(T) and Failure(string) factories
    // TODO: Map<U>(Func<T,U>) and Bind<U>(Func<T,Result<U>>)
}

public record RegisterDto(string Name, string Email, string Password);
public record RegisteredUser(int Id, string Name, string Email, string PasswordHash);

public class RegistrationService
{
    private readonly List<string> _emails = new() { "taken@example.com" };
    private int _nextId = 1;

    public Result<RegisteredUser> Register(RegisterDto dto)
    {
        // TODO: chain Validate → CheckDuplicate → HashPassword → CreateUser
        throw new NotImplementedException();
    }

    private Result<RegisterDto> Validate(RegisterDto dto)
    {
        // TODO: name required, email contains '@', password >= 8 chars
        throw new NotImplementedException();
    }

    private Result<RegisterDto> CheckDuplicate(RegisterDto dto)
    {
        // TODO: check _emails list
        throw new NotImplementedException();
    }

    private Result<(RegisterDto Dto, string Hash)> HashPassword(RegisterDto dto)
    {
        // TODO: return ("hashed_" + dto.Password)
        throw new NotImplementedException();
    }

    private Result<RegisteredUser> CreateUser((RegisterDto Dto, string Hash) input)
    {
        // TODO: return new RegisteredUser with _nextId++
        throw new NotImplementedException();
    }
}

var svc = new RegistrationService();
var r1 = svc.Register(new RegisterDto("Alice", "alice@example.com", "securepass123"));
Console.WriteLine(r1.IsSuccess ? $"OK: {r1.Value.Name}" : $"Fail: {r1.Error}");

var r2 = svc.Register(new RegisterDto("", "taken@example.com", "pass"));
Console.WriteLine(r2.IsSuccess ? "Should not reach here" : $"Fail: {r2.Error}");`,
    solution: `using System;
using System.Collections.Generic;

public sealed class Result<T>
{
    public bool IsSuccess { get; }
    public bool IsFailed  => !IsSuccess;
    public T      Value => IsSuccess ? _value!  : throw new InvalidOperationException("Result is failed.");
    public string Error  => IsFailed  ? _error! : throw new InvalidOperationException("Result is successful.");

    private readonly T?      _value;
    private readonly string? _error;

    private Result(T value)       { IsSuccess = true;  _value = value; }
    private Result(string error)  { IsSuccess = false; _error = error; }

    public static Result<T> Success(T value)    => new(value);
    public static Result<T> Failure(string err) => new(err);

    public Result<U> Map<U>(Func<T, U> f)          => IsSuccess ? Result<U>.Success(f(Value))  : Result<U>.Failure(Error);
    public Result<U> Bind<U>(Func<T, Result<U>> f) => IsSuccess ? f(Value)                     : Result<U>.Failure(Error);
}

public record RegisterDto(string Name, string Email, string Password);
public record RegisteredUser(int Id, string Name, string Email, string PasswordHash);

public class RegistrationService
{
    private readonly List<string> _emails = new() { "taken@example.com" };
    private int _nextId = 1;

    public Result<RegisteredUser> Register(RegisterDto dto) =>
        Validate(dto)
            .Bind(CheckDuplicate)
            .Bind(HashPassword)
            .Bind(CreateUser);

    private Result<RegisterDto> Validate(RegisterDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.Name)) return Result<RegisterDto>.Failure("Name is required.");
        if (!dto.Email.Contains('@'))             return Result<RegisterDto>.Failure("Email must contain '@'.");
        if (dto.Password.Length < 8)              return Result<RegisterDto>.Failure("Password must be at least 8 characters.");
        return Result<RegisterDto>.Success(dto);
    }

    private Result<RegisterDto> CheckDuplicate(RegisterDto dto)
    {
        return _emails.Contains(dto.Email.ToLower())
            ? Result<RegisterDto>.Failure($"'{dto.Email}' is already registered.")
            : Result<RegisterDto>.Success(dto);
    }

    private Result<(RegisterDto Dto, string Hash)> HashPassword(RegisterDto dto)
        => Result<(RegisterDto, string)>.Success((dto, "hashed_" + dto.Password));

    private Result<RegisteredUser> CreateUser((RegisterDto Dto, string Hash) input)
        => Result<RegisteredUser>.Success(
               new RegisteredUser(_nextId++, input.Dto.Name, input.Dto.Email, input.Hash));
}

var svc = new RegistrationService();

var r1 = svc.Register(new RegisterDto("Alice", "alice@example.com", "securepass123"));
Console.WriteLine(r1.IsSuccess ? $"OK: {r1.Value.Name} ({r1.Value.PasswordHash})" : $"Fail: {r1.Error}");
// OK: Alice (hashed_securepass123)

var r2 = svc.Register(new RegisterDto("", "taken@example.com", "pass"));
Console.WriteLine(r2.IsSuccess ? "Should not reach here" : $"Fail: {r2.Error}");
// Fail: Name is required.  ← stops at validation, never checks duplicate`,
  };

  quiz: QuizQuestion[] = [
    {
      q: 'What does Bind do when the input Result is already failed?',
      options: [
        'It throws an InvalidOperationException',
        'It short-circuits and propagates the failure without calling the function',
        'It resets the Result to a success state with a default value',
        'It calls the function with a null argument',
      ],
      answer: 1,
      explanation: 'Bind implements the railway switch: if the input is a failure, the next function is never called and the failure passes straight through. This is what enables automatic error propagation in chains — no manual if-checks needed.',
    },
    {
      q: 'What is the key difference between Map and Bind?',
      options: [
        'Map is faster because it avoids a function call',
        'Map transforms the value (transform cannot fail); Bind chains a Result-returning operation (can fail)',
        'Map checks IsSuccess internally; Bind assumes success',
        'They are identical — Bind is just an alias for Map',
      ],
      answer: 1,
      explanation: 'Map takes T → U (infallible transform) and wraps the result in a new Result. Bind takes T → Result<U> (fallible operation) and avoids the double-wrapping Result<Result<U>> that a naive Map would produce — this "flattening" is the monadic bind.',
    },
    {
      q: 'When should you throw an exception instead of returning Result<T>?',
      options: [
        'Never — always return Result<T> for all possible failures',
        'Only for ArgumentNullException and nothing else',
        'For infrastructure failures (DB unavailable), programming errors, and argument validation',
        'Only when the method is async',
      ],
      answer: 2,
      explanation: 'Result<T> is for expected, recoverable domain failures. Infrastructure failures, programming bugs, and argument violations should throw — these are not recoverable domain cases and callers cannot meaningfully handle them through a Result value.',
    },
    {
      q: 'What is the correct return type for an async method that can fail?',
      options: [
        'async Result<T>',
        'Result<Task<T>>',
        'Task<Result<T>>',
        'Awaitable<Result<T>>',
      ],
      answer: 2,
      explanation: 'Task is the outer wrapper (it is awaitable); Result<T> is the value you get after awaiting. Never write async Result<T> — Result does not implement the awaitable pattern. ValueTask<Result<T>> is also valid for performance-sensitive code.',
    },
    {
      q: 'Which library provides ErrorOr<T> with implicit operators for clean value returns?',
      options: [
        'FluentResults',
        'LanguageExt',
        'CSharpFunctionalExtensions',
        'ErrorOr',
      ],
      answer: 3,
      explanation: 'The ErrorOr NuGet package provides ErrorOr<T>. Its implicit operators let you return a value directly (e.g., return user) from a method declared as returning ErrorOr<User>, making success cases read naturally without explicit wrapping.',
    },
    {
      q: 'How does OneOf<T1, T2, T3> differ from a binary Result<T>?',
      options: [
        'OneOf is faster because it uses structs internally',
        'OneOf only supports reference types; Result supports value types',
        'OneOf can hold any N distinct types each with different data — not just success/failure',
        'They are identical — OneOf is just a renamed Result',
      ],
      answer: 2,
      explanation: 'Result<T> is binary: success or failure. OneOf is a true discriminated union that holds one of N distinct types, each with its own data shape. Use OneOf when different failure cases carry distinct payloads (e.g., NotFound vs Forbidden vs Deleted) that callers need to handle differently.',
    },
    {
      q: 'Result<T> with Map and Bind is an instance of which design pattern from functional programming?',
      options: [
        'Functor (Map only — Bind is not required for a functor)',
        'Monad (both Map and Bind satisfying the monad laws)',
        'Singleton (one Result instance per T type)',
        'Strategy pattern (swappable error-handling algorithms)',
      ],
      answer: 1,
      explanation: 'Result<T> is a monad: Map makes it a Functor (transform a value inside a context), and Bind is the monadic flatMap/chain that sequences computations that can fail. The three monad laws (left identity, right identity, associativity) hold, explaining why Bind correctly sequences fallible operations.',
    },
    {
      q: 'A team has a service method `CreateOrder` that calls the DB. The DB goes down. Using Result<T>, which is correct?',
      options: [
        'Wrap the DB call in try/catch and return Result.Failure(ex.Message)',
        'Let the SqlException propagate — DB failure is an infrastructure issue, not a domain failure',
        'Return Result.Failure("DB unavailable") so the API returns 500 cleanly',
        'Return Result.Success(null) and check for null in the caller',
      ],
      answer: 1,
      explanation: 'A DB outage is an infrastructure failure, not an expected domain case. Let the exception propagate to your exception-handling middleware which translates it to a 500. Converting it to Result.Failure makes it look like a domain failure and masks the real problem from monitoring.',
    },
  ];

  qna: QnaItem[] = [
    {
      q: 'Why use Result<T> instead of exceptions for domain failures?',
      a: 'Three concrete reasons: (1) Visibility — exceptions are invisible in method signatures, callers can accidentally ignore them. Result<T> makes failure part of the API contract. (2) Compiler enforcement — the caller must call .Match() or check .IsSuccess before reading .Value; there is no way to accidentally skip error handling. (3) Performance — on hot paths (e.g. request validation), returning a failure value is orders of magnitude cheaper than allocating an exception object and unwinding the call stack.',
    },
    {
      q: 'What is the "railway" metaphor in Railway-Oriented Programming?',
      a: 'Imagine two parallel tracks: the happy track (success) and the error track (failure). Each operation is a switch — if input arrives on the happy track and succeeds, it stays on the happy track. If it fails, the input switches to the error track. Once on the error track, every subsequent switch is bypassed — the failure rides the error track to the end without running any intermediate steps. Bind implements exactly this switch behavior.',
    },
    {
      q: 'What is the difference between Map and Bind?',
      a: 'Map applies an infallible transform: T → U. The transform function cannot return a failure — if it could throw, that is a bug. Map wraps the result back in a Result<U>. Bind chains a fallible operation: T → Result<U>. If you used Map with a Result-returning function, you would get Result<Result<U>>. Bind "flattens" that double-wrapping, which is why it is also called FlatMap or Then in other languages. Use Map for safe transforms (string formatting, DTO mapping); use Bind for operations that can themselves fail.',
    },
    {
      q: 'Which FluentResults, ErrorOr, or OneOf should I choose?',
      a: 'ErrorOr: best default for most ASP.NET Core APIs — minimal, implicit operators for clean returns, .Match()/.MatchAsync() pair well with minimal APIs. FluentResults: choose when one operation can produce multiple errors (e.g. form validation collecting all field errors at once), or when you need rich error metadata. OneOf: choose when the return value can be one of N distinct states with different data shapes per case — e.g. the caller genuinely needs to know whether the operation returned NotFound, Forbidden, Deleted, or Conflict, each with its own payload.',
    },
    {
      q: 'How do I integrate Result<T> with ASP.NET Core minimal APIs?',
      a: 'The pattern: services return Result<T> (or ErrorOr<T>); endpoint handlers convert to IResult. With ErrorOr: result.Match(value => TypedResults.Ok(value), errors => MapErrors(errors[0])). Define a MapErrors helper that switches on ErrorType to produce the correct status code. Keep the Result → HTTP mapping at the boundary — the service layer should know nothing about HTTP.',
    },
    {
      q: 'Can Result<T> handle multiple errors, or only one?',
      a: 'A hand-rolled or binary Result<T> typically holds one error. FluentResults natively supports a list of IError objects per result — call Result.Fail(listOfErrors) and read result.Errors. ErrorOr also supports multiple errors (errors is a List<Error>). If you need to collect all validation errors in a single pass (rather than stopping at the first), use FluentResults or ErrorOr and build the error list before returning. OneOf is not the right tool here — it represents one of N states, not N errors.',
    },
    {
      q: 'How does async work with Result<T>?',
      a: 'Use Task<Result<T>> as the return type: Task is the outer wrapper (awaitable), Result<T> is the value you receive after awaiting. Write: var result = await GetUserAsync(id); then use result.Match() as normal. FluentResults and ErrorOr provide async chain helpers (.BindAsync(), .MatchAsync()) to avoid manually awaiting each step. Never write async Result<T> — Result does not implement the awaitable pattern and the compiler will reject it.',
    },
    {
      q: 'Is there a noticeable performance cost to returning Result<T> everywhere?',
      a: 'The allocation cost of a Result<T> value is negligible — a small object collected in generation 0. The comparison that matters is against exceptions: a thrown exception allocates an exception object, captures a full stack trace, and triggers stack unwinding — hundreds of microseconds on a hot path. For validation-heavy APIs processing thousands of requests per second, replacing exception-driven validation with Result<T> can meaningfully reduce allocations and latency. For infrequent operations the difference is immeasurable either way.',
    },
  ];

  revision: RevisionSummary = {
    oneLiner: '<strong>Result&lt;T&gt;</strong> makes failure an explicit return type — callers are forced to handle both success and failure, eliminating silent exception swallowing and making error paths visible at compile time.',
    mustKnow: [
      '<code>Result&lt;T&gt;</code> is a discriminated union: <code>IsSuccess</code> (holds a <code>Value</code>) or <code>IsFailed</code> (holds an <code>Error</code>) — never both simultaneously',
      '<code>Map(T → U)</code> transforms the success value; failures pass through — the transform itself cannot fail',
      '<code>Bind(T → Result&lt;U&gt;)</code> chains a fallible operation — failures short-circuit the chain automatically',
      'Once a Result is failed, all subsequent <code>Map</code>/<code>Bind</code> calls are skipped — error propagates for free',
      'Use for <em>expected domain failures</em> (not found, validation); throw exceptions for <em>unexpected failures</em> (DB down, null bug)',
      'Library choice: <strong>ErrorOr</strong> (minimal, great ASP.NET fit), <strong>FluentResults</strong> (multiple errors, metadata), <strong>OneOf</strong> (N-state discriminated union)',
    ],
    interviewFocus: [
      '<strong>Why Result&lt;T&gt; over exceptions?</strong> — exceptions are invisible in signatures, silently swallowable, expensive; Result makes failure explicit and compiler-enforced',
      '<strong>Map vs Bind?</strong> — Map transforms (infallible, T→U); Bind chains a fallible operation (T→Result&lt;U&gt;), flattens the double-wrapping',
      '<strong>When to still throw?</strong> — infrastructure failures, programming errors, argument validation — Result is for recoverable expected domain failures only',
      '<strong>ASP.NET Core wiring?</strong> — services return Result&lt;T&gt;; endpoint handlers call .Match(ok → TypedResults.Ok, err → TypedResults.Problem)',
    ],
  };
}
