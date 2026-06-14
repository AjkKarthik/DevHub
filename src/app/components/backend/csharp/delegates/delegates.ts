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

@Component({
  selector: 'app-csharp-delegates',
  standalone: true,
  imports: [
    CommonModule, CodeBlockComponent, TheoryBlockComponent, QnaBlockComponent,
    QuizBlockComponent, ChallengeBlockComponent, QuickRefComponent,
    PageMetaComponent, PageCompleteComponent,
    CommonMistakesComponent, RevisionCardComponent,
  ],
  templateUrl: './delegates.html',
  styleUrl: './delegates.scss',
})
export class CsharpDelegates {

  quickRef: QuickRefItem[] = [
    { name: 'delegate',              type: 'keyword',  desc: 'Declares a type-safe function pointer — defines a method signature that can be stored, passed, and invoked.', since: 'C# 1' },
    { name: 'Action<T>',             type: 'class',    desc: 'Built-in delegate that takes up to 16 parameters and returns void. Use for side-effect callbacks.', since: 'C# 2' },
    { name: 'Func<T, TResult>',      type: 'class',    desc: 'Built-in delegate that takes up to 16 parameters and returns TResult. Last type parameter is the return type.', since: 'C# 2' },
    { name: 'Predicate<T>',          type: 'class',    desc: 'Shorthand for Func<T, bool> — takes one parameter and returns bool. Used in filtering APIs like List<T>.FindAll.', since: 'C# 2' },
    { name: 'event',                 type: 'keyword',  desc: 'Wraps a delegate field: restricts external callers to += and -= only; only the declaring class can invoke it.', since: 'C# 1' },
    { name: 'EventHandler<T>',       type: 'class',    desc: 'Standard event delegate: (object? sender, T e) where T : EventArgs. Prefer over custom delegate types for events.', since: 'C# 2' },
    { name: '+=  /  -=',             type: 'operator', desc: 'Subscribe (+=) or unsubscribe (-=) a handler from a multicast delegate or event.', since: 'C# 1' },
    { name: '?.Invoke()',            type: 'syntax',   desc: 'Null-safe delegate invocation — checks for null before calling. Use on events: MyEvent?.Invoke(this, args).', since: 'C# 6' },
    { name: 'GetInvocationList()',   type: 'method',   desc: 'Returns the array of individual delegates in a multicast chain — iterate to call each with its own try/catch.', since: 'C# 1' },
    { name: 'lambda =>',             type: 'syntax',   desc: 'Inline anonymous function: (params) => expression or (params) => { statements; }', since: 'C# 3' },
    { name: 'static lambda',         type: 'syntax',   desc: 'static (params) => expr — compiler-enforced: cannot capture locals or this. Zero closure allocation.', since: 'C# 9' },
    { name: 'closure',               type: 'syntax',   desc: 'A lambda that captures variables from the enclosing scope by reference — the variable itself, not its value at capture time.', since: 'C# 3' },
  ];

  theory: TheoryPoint[] = [
    {
      heading: 'Delegates are type-safe function pointers',
      points: [
        'A delegate type defines a contract: a specific return type and parameter list. Any method (static or instance) that matches that signature can be assigned to it.',
        'Unlike raw function pointers (<code>delegate*</code>), managed delegates carry type information and are verified at compile time — mismatches are caught before runtime.',
        'Delegates enable <strong>callbacks</strong> and <strong>higher-order functions</strong>: you can pass a method as an argument, store it in a field, and call it later.',
        'Multiple methods can be combined into one <em>multicast delegate</em> with <code>+=</code>. Invoking it calls all subscribers in registration order.',
        'Delegate instances are immutable — <code>+=</code> creates a new delegate combining old and new; <code>-=</code> creates a new one with the matching entry removed. The original object is unchanged.',
      ],
    },
    {
      heading: 'Func, Action, Predicate — prefer the BCL delegates',
      points: [
        '<code>Func&lt;T, TResult&gt;</code> takes parameters and <strong>returns a value</strong>. The last type argument is always the return type: <code>Func&lt;int, int, int&gt;</code> takes two ints and returns one.',
        '<code>Action&lt;T&gt;</code> takes parameters and <strong>returns void</strong>. Use it for side-effect callbacks such as logging, UI updates, or event handling.',
        '<code>Predicate&lt;T&gt;</code> takes exactly one parameter and returns <code>bool</code> — syntactic shorthand for <code>Func&lt;T, bool&gt;</code>. Used by <code>List&lt;T&gt;.FindAll</code> and similar filtering APIs.',
        'Prefer these BCL delegates over declaring custom ones — they are universally recognised, require no extra declaration, and keep APIs consistent across the codebase.',
        'A <em>method group</em> (<code>Func&lt;int, bool&gt; f = IsOdd;</code>) is the shortest way to assign an existing named method to a delegate, and it avoids an unnecessary wrapper lambda.',
      ],
    },
    {
      heading: 'Events are multicast delegates with access control',
      points: [
        'The <code>event</code> keyword wraps a delegate field: external code can only <code>+=</code> (subscribe) or <code>-=</code> (unsubscribe) — it cannot assign (<code>=</code>) or invoke (<code>()</code>) from outside the class.',
        'Only the declaring class can raise the event, preventing external code from accidentally firing all subscribers or replacing the whole invocation list.',
        'Always null-check before invoking: <code>MyEvent?.Invoke(this, args)</code> is the idiomatic pattern — without it you get <code>NullReferenceException</code> when zero subscribers have registered.',
        'The .NET convention is <code>EventHandler&lt;TEventArgs&gt;</code> as the delegate type with <code>TEventArgs : EventArgs</code> for the payload — follow this convention for all public APIs.',
        'Use <code>add</code>/<code>remove</code> accessors on the event to write custom subscription logic (e.g. thread-safe registration using <code>Interlocked.CompareExchange</code> or a backing list).',
      ],
    },
    {
      heading: 'Lambda closures capture by reference',
      points: [
        'A lambda that references a variable from the enclosing scope creates a <em>closure</em>. It captures a <strong>reference to the variable</strong>, not a snapshot of its value at the time of capture.',
        'Classic bug: capturing a loop variable. By the time all lambdas run, the loop has finished and the variable holds its final value — all lambdas see the same result.',
        'Fix: copy the loop variable into a new local variable inside the loop body before the lambda captures it. Each iteration gets its own distinct variable.',
        '<code>static</code> lambdas (C# 9) are compiler-enforced to capture nothing — no locals, no <code>this</code>. The compiler reuses a single cached delegate instance, costing zero heap allocation per call.',
        'Closures lift captured variables onto the heap (into a compiler-generated class). In hot paths this adds allocation pressure — prefer static lambdas or named methods when closures are avoidable.',
      ],
    },
    {
      heading: 'Multicast delegates and invocation order',
      points: [
        'A multicast delegate maintains an ordered invocation list. <code>+=</code> appends a new delegate; <code>-=</code> removes the last matching one (by reference equality).',
        'When invoked, all subscribers are called in registration order. The return value of a multicast <code>Func</code> is only the value from the <strong>last</strong> subscriber — earlier return values are discarded.',
        'If any subscriber throws an unhandled exception, the remaining subscribers in the list are <strong>not called</strong> — the exception propagates immediately to the invoker.',
        'For guaranteed delivery to all subscribers, iterate <code>GetInvocationList()</code> yourself, calling each entry individually inside a <code>try/catch</code>.',
        'Removing a subscriber with <code>-=</code> compares by reference equality of the delegate. Assigning a new lambda each time you subscribe means you cannot reliably unsubscribe later — always store the lambda in a variable if you need to remove it.',
      ],
    },
    {
      heading: 'Delegate variance — covariance and contravariance',
      points: [
        'Delegate types support <strong>covariance</strong> (return types) and <strong>contravariance</strong> (parameter types), making delegate assignments more flexible.',
        'Covariance: a delegate with return type <code>Animal</code> can hold a method that returns <code>Dog</code> (a subtype). The caller only cares that it gets <em>at least</em> an <code>Animal</code>.',
        'Contravariance: a delegate with parameter type <code>Dog</code> can hold a method that accepts <code>Animal</code> (a supertype). If you can handle any animal, you can certainly handle a dog.',
        '<code>Func&lt;T, TResult&gt;</code> is declared <code>in T, out TResult</code> — <code>T</code> is contravariant (parameter), <code>TResult</code> is covariant (return). This mirrors the type theory rule.',
        'Variance only applies to reference types and to delegate parameters/return types — value types (int, struct) cannot participate in variance conversions.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Delegates & Lambdas',
      language: 'csharp',
      code: `// ── Custom delegate declaration ────────────────────────────────────────
public delegate int MathOp(int a, int b);

// ── Assign a named method ───────────────────────────────────────────────
static int Add(int a, int b) => a + b;

MathOp op = Add;
Console.WriteLine(op(3, 4));   // 7

// ── Assign a lambda ─────────────────────────────────────────────────────
op = (a, b) => a * b;
Console.WriteLine(op(3, 4));   // 12

// ── Multicast delegate — chaining ──────────────────────────────────────
Action<string> log   = msg => Console.WriteLine($"[LOG]  {msg}");
Action<string> audit = msg => Console.WriteLine($"[AUDIT] {msg}");

Action<string> pipeline = log + audit;   // combine
pipeline("Order placed");
// [LOG]  Order placed
// [AUDIT] Order placed

pipeline -= audit;   // remove one subscriber
pipeline("Order shipped");
// [LOG]  Order shipped

// ── Return value of multicast Func — only last subscriber ─────────────
Func<int> rand1 = () => 1;
Func<int> rand2 = () => 2;
Func<int> both  = rand1 + rand2;
Console.WriteLine(both());   // 2 — rand1's return value is discarded

// ── Invoke vs direct call ──────────────────────────────────────────────
MathOp? maybeOp = (a, b) => a - b;
int result = maybeOp.Invoke(10, 3);   // explicit Invoke
int same   = maybeOp(10, 3);          // same thing, shorthand
Console.WriteLine(result);            // 7`,
    },
    {
      label: 'Func / Action / Predicate',
      language: 'csharp',
      code: `var numbers = new List<int> { 1, 2, 3, 4, 5, 6, 7, 8, 9, 10 };

// ── Predicate<T> — filtering ────────────────────────────────────────────
Predicate<int> isEven = n => n % 2 == 0;
List<int> evens = numbers.FindAll(isEven);
Console.WriteLine(string.Join(", ", evens));  // 2, 4, 6, 8, 10

// ── Func<T, TResult> — projection ──────────────────────────────────────
Func<int, string> label = n => $"item-{n}";
var labels = numbers.Select(label);
Console.WriteLine(string.Join(", ", labels.Take(3)));  // item-1, item-2, item-3

// ── Higher-order function — accepts Func as parameter ──────────────────
static IEnumerable<T> Filter<T>(IEnumerable<T> source, Func<T, bool> predicate)
    => source.Where(predicate);

var bigNums = Filter(numbers, n => n > 7);
Console.WriteLine(string.Join(", ", bigNums));  // 8, 9, 10

// ── Method group — concise shorthand ───────────────────────────────────
static bool IsOdd(int n) => n % 2 != 0;

Func<int, bool> oddCheck = IsOdd;   // method group — no wrapper lambda
Console.WriteLine(oddCheck(5));     // True

// ── Action as void callback ─────────────────────────────────────────────
static void RunWithLogging(Action<string> action, string input)
{
    Console.WriteLine($"[Before] {input}");
    action(input);
    Console.WriteLine($"[After]  {input}");
}

RunWithLogging(s => Console.WriteLine($"Processing: {s}"), "payload");
// [Before] payload
// Processing: payload
// [After]  payload`,
    },
    {
      label: 'Events',
      language: 'csharp',
      code: `// ── Custom EventArgs ──────────────────────────────────────────────────
public class OrderPlacedEventArgs : EventArgs
{
    public int     OrderId { get; init; }
    public decimal Total   { get; init; }
}

// ── Class that raises an event ─────────────────────────────────────────
public class OrderService
{
    // EventHandler<T> is the .NET convention — (object? sender, T e)
    public event EventHandler<OrderPlacedEventArgs>? OrderPlaced;

    public void PlaceOrder(int id, decimal total)
    {
        // ... business logic ...

        // Safe raise — null-conditional avoids NullReferenceException
        OrderPlaced?.Invoke(this, new OrderPlacedEventArgs
        {
            OrderId = id,
            Total   = total,
        });
    }
}

// ── Subscribing and unsubscribing ──────────────────────────────────────
var service = new OrderService();

// Subscribe with a lambda
service.OrderPlaced += (sender, e) =>
    Console.WriteLine($"Order #{e.OrderId} placed — Total: {e.Total:F2}");

// Subscribe with a named method — store reference to unsubscribe later
void SendEmail(object? sender, OrderPlacedEventArgs e)
    => Console.WriteLine($"Email sent for order #{e.OrderId}");

service.OrderPlaced += SendEmail;
service.PlaceOrder(101, 49.99m);
// Order #101 placed — Total: 49.99
// Email sent for order #101

// Unsubscribe — lambda above cannot be removed (no reference stored)
service.OrderPlaced -= SendEmail;
service.PlaceOrder(102, 9.99m);
// Order #102 placed — Total: 9.99   (email handler gone)`,
    },
    {
      label: 'Closures & Gotchas',
      language: 'csharp',
      code: `// ── Classic closure bug — loop variable capture ────────────────────────
var actions = new List<Action>();

for (int i = 0; i < 3; i++)
{
    actions.Add(() => Console.WriteLine(i));   // captures variable i
}

actions.ForEach(a => a());
// Prints: 3  3  3  — NOT 0 1 2!
// Loop finished; i == 3 when lambdas execute.

// ── Fix — copy to a fresh local per iteration ──────────────────────────
var fixedActions = new List<Action>();

for (int i = 0; i < 3; i++)
{
    int captured = i;                            // distinct variable per iteration
    fixedActions.Add(() => Console.WriteLine(captured));
}

fixedActions.ForEach(a => a());
// Prints: 0  1  2  — correct

// ── Static lambda (C# 9) — zero capture, zero allocation ───────────────
Func<int, int, int> add = static (a, b) => a + b;
// static (a, b) => a + b + localVar;   // compile error — cannot capture

// ── GetInvocationList — guaranteed delivery even if one throws ─────────
Action<string> handler1 = s => Console.WriteLine($"H1: {s}");
Action<string> handler2 = _ => throw new InvalidOperationException("H2 failed");
Action<string> handler3 = s => Console.WriteLine($"H3: {s}");

Action<string> multi = handler1 + handler2 + handler3;

// BAD: handler2 throws — handler3 never called
// multi("test");

// GOOD: each handler gets its own try/catch
foreach (var d in multi.GetInvocationList())
{
    try   { ((Action<string>)d)("test"); }
    catch (Exception ex) { Console.WriteLine($"Handler failed: {ex.Message}"); }
}
// H1: test
// Handler failed: H2 failed
// H3: test

// ── Delegate GC leak — lambda closes over 'this' ───────────────────────
public class Publisher
{
    public event Action? Tick;
    public void Fire() => Tick?.Invoke();
}

public class Subscriber : IDisposable
{
    private readonly Publisher _pub;
    public Subscriber(Publisher pub) { _pub = pub; _pub.Tick += OnTick; }
    void OnTick() => Console.WriteLine("Tick!");
    public void Dispose() => _pub.Tick -= OnTick;   // MUST unsubscribe!
}`,
    },
  ];

  mistakes: CommonMistake[] = [
    {
      title: 'Using = instead of += on a delegate — erases all existing subscribers',
      wrong: `public class NotificationHub
{
    public Action<string>? OnMessage;
}

var hub = new NotificationHub();
hub.OnMessage += msg => Console.WriteLine($"[Email] {msg}");
hub.OnMessage += msg => Console.WriteLine($"[SMS]   {msg}");

// Someone else sets the delegate — wipes out both subscribers!
hub.OnMessage = msg => Console.WriteLine($"[Push]  {msg}");

hub.OnMessage?.Invoke("Hello");
// Only: [Push]  Hello   (Email and SMS lost)`,
      right: `// Use += always when subscribing — never = on a shared delegate
hub.OnMessage += msg => Console.WriteLine($"[Push]  {msg}");
hub.OnMessage?.Invoke("Hello");
// [Email] Hello
// [SMS]   Hello
// [Push]  Hello

// Declare as event to prevent accidental = from outside the class
public event Action<string>? OnMessage;
// hub.OnMessage = ...;   // compile error from outside the class`,
      explanation: 'Assigning (=) to a delegate field replaces the entire invocation list. All previously registered subscribers are silently discarded. Using += appends to the list. The event keyword prevents external assignment entirely — only the declaring class can use = inside it.',
    },
    {
      title: 'Loop variable closure bug — all lambdas see the final loop value',
      wrong: `var actions = new List<Action>();

for (int i = 0; i < 5; i++)
{
    actions.Add(() => Console.WriteLine(i));  // captures variable i, not its value
}

actions.ForEach(a => a());
// Prints: 5  5  5  5  5
// Loop ended; i is 5 when lambdas finally run`,
      right: `var actions = new List<Action>();

for (int i = 0; i < 5; i++)
{
    int copy = i;                              // new variable per iteration
    actions.Add(() => Console.WriteLine(copy));
}

actions.ForEach(a => a());
// Prints: 0  1  2  3  4`,
      explanation: 'Lambdas capture the variable itself (by reference), not its current value. All lambdas in the loop share the same loop variable, which equals its final value by the time any lambda executes. Copying to a local variable inside the loop body gives each lambda its own distinct captured variable.',
    },
    {
      title: 'Not unsubscribing from a long-lived event — memory leak',
      wrong: `public class DataGrid : IDisposable
{
    public DataGrid(DataService svc)
    {
        // Lambda closes over 'this' and is added to a long-lived service event
        svc.DataChanged += () => Refresh();
        // If DataGrid is disposed but DataService lives on,
        // this lambda keeps the DataGrid alive indefinitely.
    }

    void Refresh() { /* ... */ }
    public void Dispose() { /* forgets to -= */ }
}`,
      right: `public class DataGrid : IDisposable
{
    private readonly DataService _svc;
    private readonly Action _handler;   // store to unsubscribe later

    public DataGrid(DataService svc)
    {
        _svc = svc;
        _handler = () => Refresh();
        _svc.DataChanged += _handler;
    }

    void Refresh() { /* ... */ }

    public void Dispose()
    {
        _svc.DataChanged -= _handler;   // break the reference chain
    }
}`,
      explanation: 'A delegate in an event\'s invocation list holds a reference to the subscriber (either directly via a method group, or via a closure capturing this). If the publisher outlives the subscriber and -= is never called, the subscriber cannot be garbage collected. Always store the delegate reference and unsubscribe in Dispose or a cleanup method.',
    },
    {
      title: 'Not null-checking before invoking an event — NullReferenceException',
      wrong: `public class Timer
{
    public event Action? Tick;

    void OnElapsed()
    {
        Tick();            // throws NullReferenceException if no subscribers!
        Tick.Invoke();     // same problem — Invoke() on null
    }
}`,
      right: `public class Timer
{
    public event Action? Tick;

    void OnElapsed()
    {
        // Null-conditional: reads Tick atomically, invokes only if non-null
        Tick?.Invoke();
    }
}`,
      explanation: 'An event field is null until the first subscriber registers. Calling Tick() or Tick.Invoke() without a null check throws NullReferenceException. Tick?.Invoke() is the idiomatic, thread-safer pattern — the null check and the delegate read happen atomically, avoiding a race where Tick becomes null between the check and the call.',
    },
    {
      title: 'Multicast exception stops remaining subscribers from being called',
      wrong: `Action<string> log    = s => Console.WriteLine($"[LOG] {s}");
Action<string> notify = s => throw new Exception("notify failed");
Action<string> email  = s => Console.WriteLine($"[EMAIL] {s}");

Action<string> all = log + notify + email;
all("event");          // log runs, notify throws, email NEVER called`,
      right: `Action<string> all = log + notify + email;

// Iterate GetInvocationList() — wrap each call in its own try/catch
foreach (Delegate d in all.GetInvocationList())
{
    try   { ((Action<string>)d)("event"); }
    catch (Exception ex) { Console.WriteLine($"Subscriber failed: {ex.Message}"); }
}
// [LOG] event
// Subscriber failed: notify failed
// [EMAIL] event`,
      explanation: 'When a multicast delegate is invoked normally, the first unhandled exception stops the entire invocation chain — later subscribers never run. Use GetInvocationList() to iterate the chain yourself with individual try/catch blocks to guarantee every subscriber gets a chance to run regardless of failures in earlier ones.',
    },
  ];

  quiz: QuizQuestion[] = [
    {
      q: 'What is the key difference between Func<int, bool> and Action<int>?',
      options: [
        'Func can only take one parameter; Action can take many',
        'Func returns a value (bool); Action returns void',
        'Action is for async methods; Func is for synchronous methods',
        'They are identical — just different names',
      ],
      answer: 1,
      explanation: '<code>Func&lt;T, TResult&gt;</code> always returns a value (the last type parameter is the return type). <code>Action&lt;T&gt;</code> always returns <code>void</code>. Use Func when you need a result, Action for side-effect callbacks.',
    },
    {
      q: 'A multicast delegate has three subscribers. The second subscriber throws an exception. What happens?',
      options: [
        'All three subscribers are called; exceptions are swallowed',
        'The exception propagates immediately and the third subscriber is never called',
        'The runtime retries the second subscriber automatically',
        'The faulting subscriber is removed and the third is called',
      ],
      answer: 1,
      explanation: 'A multicast delegate calls subscribers in order. If any subscriber throws, execution stops — subsequent subscribers are not called and the exception propagates to the caller. To guarantee all subscribers run, iterate <code>GetInvocationList()</code> with individual <code>try/catch</code> per delegate.',
    },
    {
      q: 'What restriction does the event keyword add compared to a plain public delegate field?',
      options: [
        'Events use reflection internally, making them slower',
        'External code cannot assign (=) or invoke the event — only += and -= are allowed',
        'Events can only have one subscriber at a time',
        'Events cannot use lambda expressions as subscribers',
      ],
      answer: 1,
      explanation: 'Declaring a field as <code>event</code> restricts external access to subscribe (<code>+=</code>) and unsubscribe (<code>-=</code>). External code cannot assign (<code>=</code>) or invoke the event directly. This prevents one subscriber from clearing all others or firing the event from outside the declaring class.',
    },
    {
      q: 'You capture a loop variable in a lambda and all lambdas print the same final value. What is the correct fix?',
      options: [
        'Use a foreach loop instead of a for loop',
        'Copy the loop variable into a new local variable inside the loop body before the lambda captures it',
        'Declare the lambda as static so it cannot capture anything',
        'Use Invoke() instead of the shorthand call syntax',
      ],
      answer: 1,
      explanation: 'Lambdas capture variables by reference. When all lambdas share the same loop variable, they all see the same (final) value. Copying into a fresh local (<code>int copy = i;</code>) gives each lambda a distinct variable holding the correct value for that iteration.',
    },
    {
      q: 'What does a static lambda (C# 9) guarantee at compile time?',
      options: [
        'The lambda runs on a background thread',
        'The lambda cannot capture any local variables, fields, or "this" — zero closure allocation',
        'The lambda is inlined by the JIT compiler',
        'The lambda is thread-safe without any extra locking',
      ],
      answer: 1,
      explanation: 'A <code>static</code> lambda is compiler-enforced to capture nothing — no locals, no <code>this</code>, no outer members. Because there is no closure object to allocate, the compiler can cache a single delegate instance. This is useful in hot paths where delegate allocation would add GC pressure.',
    },
    {
      q: 'Which of the following delegate variance rules is correct?',
      options: [
        'Func<Dog> can be assigned to Func<Animal> because Dog IS an Animal (covariance)',
        'Action<Animal> can be assigned to Action<Dog> because if it handles animals it can handle dogs (contravariance)',
        'Both covariance and contravariance apply to Func/Action with value-type parameters',
        'Both A and B are correct',
      ],
      answer: 3,
      explanation: 'Both rules apply: <strong>Covariance</strong> — <code>Func&lt;Dog&gt;</code> can be used where <code>Func&lt;Animal&gt;</code> is expected because the method returns something that is at least an <code>Animal</code>. <strong>Contravariance</strong> — <code>Action&lt;Animal&gt;</code> can be used where <code>Action&lt;Dog&gt;</code> is expected because a handler that accepts any animal can certainly accept a dog. Variance only applies to reference types.',
    },
    {
      q: 'What is the return value of a multicast Func<int> that has three subscribers returning 10, 20, and 30?',
      options: [
        '10 (the first subscriber\'s value)',
        '60 (the sum of all return values)',
        '30 (only the last subscriber\'s value is returned)',
        'A compilation error — Func cannot be multicast',
      ],
      answer: 2,
      explanation: 'When a multicast <code>Func&lt;TResult&gt;</code> is invoked, all subscribers are called in order but only the <strong>last</strong> subscriber\'s return value is returned to the caller. All intermediate return values are discarded. This is why <code>Func</code> delegates are rarely used in multicast scenarios — use events or <code>Action</code> instead.',
    },
  ];

  qna: QnaItem[] = [
    {
      q: 'When do I need a custom delegate type vs Func<> / Action<>?',
      a: 'Almost never. Prefer <code>Func&lt;&gt;</code> and <code>Action&lt;&gt;</code> — they are BCL types, universally understood, and require no extra declaration. Define a custom delegate only when: (1) the delegate name carries important domain meaning that genuinely aids readability across a large surface (<code>OrderValidator</code>, <code>PriceCalculator</code>); or (2) the signature requires <code>out</code>/<code>ref</code>/<code>params</code> parameters which Func/Action do not support.',
    },
    {
      q: 'Why is my event null when I try to raise it?',
      a: 'An event field is <code>null</code> when no subscribers have registered yet. Use <code>MyEvent?.Invoke(this, args)</code> — the null-conditional operator checks for null and calls Invoke only when at least one subscriber exists, without a race condition between check and call. The alternative of initialising with an empty handler (<code>= delegate { };</code>) works but wastes a delegate allocation.',
    },
    {
      q: 'What is a static lambda and when should I use it?',
      a: 'A <code>static</code> lambda (C# 9) is annotated with the <code>static</code> modifier: <code>static (a, b) => a + b</code>. The compiler enforces that it captures nothing — no locals, no <code>this</code>, no outer members. Because there is no closure object, the compiler caches a single delegate instance rather than allocating on every call. Use static lambdas in hot paths (tight loops, high-frequency LINQ queries, frequently invoked callbacks) where delegate allocation matters.',
    },
    {
      q: 'How do closures cause memory leaks?',
      a: 'When a lambda captures a variable, the compiler generates a hidden class whose field holds that variable. If the delegate is stored in a long-lived location (a static field, a long-lived event, a cache), the closure object — and everything it references — cannot be garbage collected. The most common form: a short-lived subscriber closes over <code>this</code> and forgets to call <code>-=</code> on a long-lived event. The publisher\'s invocation list holds the delegate → delegate holds the closure → closure holds the subscriber. Always unsubscribe in <code>Dispose</code>.',
    },
    {
      q: 'What is delegate variance and why does it matter?',
      a: 'Delegate variance lets you assign a delegate to a variable of a compatible but different delegate type. <strong>Covariance</strong> (return types): a delegate returning <code>Dog</code> can be used where a delegate returning <code>Animal</code> is expected, because <code>Dog</code> IS an <code>Animal</code>. <strong>Contravariance</strong> (parameter types): a delegate accepting <code>Animal</code> can be used where a delegate accepting <code>Dog</code> is expected, because anything that handles any animal can handle a dog. <code>Func</code> is covariant in its return type and contravariant in parameter types; <code>Action</code> is contravariant in its parameter types. This only works with reference types.',
    },
    {
      q: 'How do I unsubscribe a lambda from an event?',
      a: 'You cannot unsubscribe a lambda that you do not have a reference to — each lambda expression creates a new delegate instance, so writing <code>-= (s, e) => DoSomething()</code> creates a <em>different</em> delegate that does not match any existing subscription. To unsubscribe later, store the delegate in a field or variable: <code>private readonly EventHandler _handler = OnMessage;</code> then use <code>publisher.Event -= _handler;</code> in Dispose. Method groups work naturally for this because <code>_handler = OnMessage</code> and <code>-= OnMessage</code> both produce equivalent delegate instances by method-group reference equality.',
    },
    {
      q: 'What is the difference between GetInvocationList() and invoking the delegate directly?',
      a: 'Invoking a multicast delegate directly calls all subscribers in sequence in a single operation — if any subscriber throws, the chain stops and remaining subscribers never run. <code>GetInvocationList()</code> returns the array of individual single-target delegates in the chain. By iterating it yourself with a try/catch per entry, you ensure every subscriber gets called regardless of failures in earlier ones. This pattern is important in notification systems, plugin architectures, or any scenario where partial failure in one subscriber should not block others.',
    },
  ];

  challenge: Challenge = {
    title: 'Simple Event Bus / Mediator',
    description: `Implement a lightweight in-process event bus using delegates.
1. Create an <code>EventBus</code> class with a <code>Dictionary&lt;Type, List&lt;Delegate&gt;&gt;</code> as its backing store.
2. Add a <code>Subscribe&lt;T&gt;(Action&lt;T&gt; handler)</code> method that registers the handler for message type <code>T</code>.
3. Add an <code>Unsubscribe&lt;T&gt;(Action&lt;T&gt; handler)</code> method that removes the handler.
4. Add a <code>Publish&lt;T&gt;(T message)</code> method that invokes all registered handlers for type <code>T</code> in registration order, passing the message. If no handlers are registered, do nothing.`,
    language: 'csharp',
    hints: [
      'Use typeof(T) as the dictionary key to group handlers by message type',
      'In Subscribe, add to the list; create the list first if the key does not exist',
      'In Publish, cast each Delegate back to Action<T> before invoking',
      'In Unsubscribe, remove the matching delegate from the list',
    ],
    starterCode: `public class EventBus
{
    private readonly Dictionary<Type, List<Delegate>> _handlers = new();

    public void Subscribe<T>(Action<T> handler)
    {
        // TODO: add handler to the list for typeof(T)
        throw new NotImplementedException();
    }

    public void Unsubscribe<T>(Action<T> handler)
    {
        // TODO: remove handler from the list for typeof(T)
        throw new NotImplementedException();
    }

    public void Publish<T>(T message)
    {
        // TODO: invoke all handlers for typeof(T)
        throw new NotImplementedException();
    }
}

// Expected usage:
record OrderPlaced(int OrderId, decimal Total);
record UserRegistered(string Email);

var bus = new EventBus();
bus.Subscribe<OrderPlaced>(e => Console.WriteLine($"Order #{e.OrderId}"));
bus.Subscribe<UserRegistered>(e => Console.WriteLine($"Welcome, {e.Email}"));

bus.Publish(new OrderPlaced(1, 49.99m));      // Order #1
bus.Publish(new UserRegistered("a@b.com"));   // Welcome, a@b.com`,
    solution: `public class EventBus
{
    private readonly Dictionary<Type, List<Delegate>> _handlers = new();

    public void Subscribe<T>(Action<T> handler)
    {
        var key = typeof(T);
        if (!_handlers.TryGetValue(key, out var list))
        {
            list = new List<Delegate>();
            _handlers[key] = list;
        }
        list.Add(handler);
    }

    public void Unsubscribe<T>(Action<T> handler)
    {
        if (_handlers.TryGetValue(typeof(T), out var list))
            list.Remove(handler);
    }

    public void Publish<T>(T message)
    {
        if (!_handlers.TryGetValue(typeof(T), out var list)) return;

        // ToList() snapshot — safe if a handler calls Subscribe/Unsubscribe
        foreach (var handler in list.ToList())
            ((Action<T>)handler)(message);
    }
}

record OrderPlaced(int OrderId, decimal Total);
record UserRegistered(string Email);

var bus = new EventBus();
bus.Subscribe<OrderPlaced>(e => Console.WriteLine($"Order #{e.OrderId}"));
bus.Subscribe<UserRegistered>(e => Console.WriteLine($"Welcome, {e.Email}"));

bus.Publish(new OrderPlaced(1, 49.99m));      // Order #1
bus.Publish(new UserRegistered("a@b.com"));   // Welcome, a@b.com
bus.Publish(new OrderPlaced(2, 9.99m));       // Order #2`,
  };

  revision: RevisionSummary = {
    oneLiner: 'Delegates are type-safe function pointers. Func returns a value; Action is void. Events restrict external access to += / -=. Closures capture variables by reference — loop variable capture and memory leaks are the two big traps.',
    mustKnow: [
      'Delegate instances are immutable: += and -= create new objects, they do not mutate the existing one.',
      'Func<T, TResult> returns a value; Action<T> returns void; Predicate<T> = Func<T, bool> for filtering APIs.',
      'event keyword: external code can only += or -=; only the declaring class can assign (=) or invoke.',
      'Always raise events with ?.Invoke() — the field is null until the first subscriber registers.',
      'Closure captures the variable, not its value at capture time — loop variable capture bug prints the final loop value.',
      'GetInvocationList() + per-delegate try/catch guarantees all multicast subscribers run even if one throws.',
      'Unsubscribe in Dispose (-=) to break the reference chain and prevent subscriber memory leaks.',
    ],
    interviewFocus: [
      'What is the difference between Func, Action, and Predicate? (return type: value / void / bool)',
      'What does the event keyword add compared to a plain delegate field? (restricts = and () to declaring class)',
      'What is the closure loop variable bug and how do you fix it? (capture by reference → copy to local per iteration)',
      'How do delegates cause memory leaks? (closed-over this in long-lived event → subscriber not GC-able until -=)',
      'What is the return value of a multicast Func? (only the last subscriber\'s value — others discarded)',
    ],
  };
}
