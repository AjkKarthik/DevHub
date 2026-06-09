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
  selector: 'app-csharp-delegates',
  standalone: true,
  imports: [
    CodeBlockComponent, TheoryBlockComponent, QnaBlockComponent,
    QuizBlockComponent, ChallengeBlockComponent, QuickRefComponent,
    PageMetaComponent, PageCompleteComponent,
  ],
  templateUrl: './delegates.html',
  styleUrl: './delegates.scss',
})
export class CsharpDelegates {

  quickRef: QuickRefItem[] = [
    { name: 'delegate',          type: 'keyword',  desc: 'Declares a type-safe function pointer — defines a method signature that can be stored and invoked', since: 'C# 1' },
    { name: 'Action<T>',         type: 'class',    desc: 'Built-in delegate that takes up to 16 parameters and returns void', since: 'C# 2' },
    { name: 'Func<T,TResult>',   type: 'class',    desc: 'Built-in delegate that takes up to 16 parameters and returns a value of TResult', since: 'C# 2' },
    { name: 'Predicate<T>',      type: 'class',    desc: 'Built-in delegate that takes one parameter and returns bool — shorthand for Func<T, bool>', since: 'C# 2' },
    { name: 'event',             type: 'keyword',  desc: 'Wraps a delegate field and restricts external callers to += and -= only', since: 'C# 1' },
    { name: 'EventHandler<T>',   type: 'class',    desc: 'Standard event delegate: (object sender, T e) where T derives from EventArgs', since: 'C# 2' },
    { name: '+=  /  -=',         type: 'operator', desc: 'Subscribe (+=) or unsubscribe (-=) a method from a multicast delegate or event', since: 'C# 1' },
    { name: 'Invoke',            type: 'syntax',   desc: 'Explicitly calls all methods in a delegate\'s invocation list — equivalent to calling the delegate directly', since: 'C# 1' },
    { name: 'lambda =>',         type: 'syntax',   desc: 'Inline anonymous function: (params) => expression or (params) => { statements }', since: 'C# 3' },
    { name: 'closure',           type: 'syntax',   desc: 'A lambda that captures variables from the enclosing scope by reference — the variable, not its value at capture time', since: 'C# 3' },
  ];

  theory: TheoryPoint[] = [
    {
      heading: 'Delegates are type-safe function pointers',
      points: [
        'A delegate type defines a method signature (return type + parameter types). Any method matching that signature — instance or static — can be assigned to it.',
        'Unlike raw function pointers, delegates carry type information and are verified at compile time, so type mismatches are caught before runtime.',
        'Delegates enable <strong>callbacks</strong>: pass a method as an argument to another method (higher-order functions, strategy pattern, LINQ).',
        'Multiple methods can be combined into a single <em>multicast delegate</em> using <code>+=</code>; invoking it calls all subscribers in order.',
      ],
    },
    {
      heading: 'Func, Action, Predicate — the standard delegates',
      points: [
        '<code>Func&lt;T, TResult&gt;</code> takes parameters and <strong>returns a value</strong>: <code>Func&lt;int, int, int&gt;</code> takes two ints and returns one.',
        '<code>Action&lt;T&gt;</code> takes parameters and <strong>returns void</strong>: use it for side-effect callbacks (logging, UI updates).',
        '<code>Predicate&lt;T&gt;</code> takes one parameter and <strong>returns bool</strong>: a shorthand for <code>Func&lt;T, bool&gt;</code>, used in filtering APIs.',
        'Prefer these built-in delegates over declaring custom ones — they are universally recognised and keep APIs consistent.',
      ],
    },
    {
      heading: 'Events are multicast delegates with access control',
      points: [
        'An <code>event</code> field wraps a delegate. External code can only <code>+=</code> (subscribe) or <code>-=</code> (unsubscribe) — it cannot assign (<code>=</code>) or invoke directly.',
        'Only the class that declares the event can raise it — this prevents external code from accidentally firing all subscribers.',
        'Always null-check before invoking: <code>MyEvent?.Invoke(this, args)</code> is the idiomatic safe-raise pattern.',
        'Use <code>EventHandler&lt;TEventArgs&gt;</code> as the delegate type and inherit from <code>EventArgs</code> for the data payload — this follows the .NET convention.',
      ],
    },
    {
      heading: 'Lambda closures capture by reference',
      points: [
        'A lambda that references a variable from the enclosing scope creates a <em>closure</em>. It captures a <strong>reference</strong> to the variable, not a snapshot of its value.',
        'Classic bug: capture a loop variable in a lambda. By the time the lambda runs the loop has finished and the variable holds its final value.',
        'Fix: copy the loop variable into a local variable inside the loop body before the lambda captures it.',
        '<code>static</code> lambdas (C# 9) are forbidden from capturing instance members or local variables — a compile-time guarantee of zero closure overhead.',
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
Action<string> log  = msg => Console.WriteLine($"[LOG]  {msg}");
Action<string> audit = msg => Console.WriteLine($"[AUDIT] {msg}");

Action<string> pipeline = log + audit;   // combine
pipeline("Order placed");
// [LOG]  Order placed
// [AUDIT] Order placed

pipeline -= audit;   // remove one subscriber
pipeline("Order shipped");
// [LOG]  Order shipped

// ── Invoke vs direct call ──────────────────────────────────────────────
MathOp? maybeOp = (a, b) => a - b;
int result = maybeOp.Invoke(10, 3);   // explicit Invoke
int same   = maybeOp(10, 3);          // same thing, shorthand
Console.WriteLine(result);  // 7`,
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

// ── Func<T, T, int> — sorting ──────────────────────────────────────────
var words = new List<string> { "banana", "fig", "apple", "date" };
Func<string, string, int> byLength = (a, b) => a.Length.CompareTo(b.Length);
words.Sort(new Comparison<string>(byLength));
Console.WriteLine(string.Join(", ", words));  // fig, date, apple, banana

// ── Higher-order function — accepts Func as parameter ──────────────────
static IEnumerable<T> Filter<T>(IEnumerable<T> source, Func<T, bool> predicate)
    => source.Where(predicate);

var bigNums = Filter(numbers, n => n > 7);
Console.WriteLine(string.Join(", ", bigNums));  // 8, 9, 10

// ── Method group — concise shorthand ───────────────────────────────────
static bool IsOdd(int n) => n % 2 != 0;

Func<int, bool> oddCheck = IsOdd;   // method group assignment
Console.WriteLine(oddCheck(5));     // True`,
    },
    {
      label: 'Events',
      language: 'csharp',
      code: `// ── Custom EventArgs ──────────────────────────────────────────────────
public class OrderPlacedEventArgs : EventArgs
{
    public int    OrderId  { get; init; }
    public decimal Total   { get; init; }
}

// ── Class that raises an event ─────────────────────────────────────────
public class OrderService
{
    // Event declaration — EventHandler<T> is the .NET convention
    public event EventHandler<OrderPlacedEventArgs>? OrderPlaced;

    public void PlaceOrder(int id, decimal total)
    {
        // ... business logic ...

        // Safe raise — null-conditional avoids NullReferenceException
        // when nobody has subscribed yet
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
    Console.WriteLine($"Order #{e.OrderId} placed — £{e.Total:F2}");

// Subscribe with a named method (so we can unsubscribe later)
void SendConfirmationEmail(object? sender, OrderPlacedEventArgs e)
    => Console.WriteLine($"Email sent for order #{e.OrderId}");

service.OrderPlaced += SendConfirmationEmail;

service.PlaceOrder(101, 49.99m);
// Order #101 placed — £49.99
// Email sent for order #101

// Unsubscribe
service.OrderPlaced -= SendConfirmationEmail;

service.PlaceOrder(102, 9.99m);
// Order #102 placed — £9.99   (email handler removed)`,
    },
    {
      label: 'Closures & Gotchas',
      language: 'csharp',
      code: `// ── Classic closure bug — loop variable capture ────────────────────────
var actions = new List<Action>();

for (int i = 0; i < 3; i++)
{
    actions.Add(() => Console.WriteLine(i));   // captures the variable i
}

actions.ForEach(a => a());
// Prints: 3  3  3  — NOT 0 1 2!
// By the time the lambdas run, i == 3 (loop finished).

// ── Correct fix — copy to a local variable ─────────────────────────────
var fixedActions = new List<Action>();

for (int i = 0; i < 3; i++)
{
    int captured = i;   // new variable per iteration
    fixedActions.Add(() => Console.WriteLine(captured));
}

fixedActions.ForEach(a => a());
// Prints: 0  1  2  — correct!

// ── Closure performance — captured variables become heap fields ─────────
int multiplier = 5;
Func<int, int> multiply = x => x * multiplier;   // closes over multiplier
// The compiler lifts 'multiplier' into a hidden class — avoid in tight loops

// ── Static lambda (C# 9) — zero capture, zero allocation ───────────────
Func<int, int, int> add = static (a, b) => a + b;
// add = static (a, b) => a + b + multiplier;  // compile error — can't capture

// ── Closure memory leak — delegate prevents GC ─────────────────────────
public class HeavyObject
{
    private byte[] _data = new byte[10_000_000];

    public Action GetCallback()
    {
        // The lambda closes over 'this' — keeps HeavyObject alive as long
        // as the returned Action is referenced anywhere.
        return () => Console.WriteLine(_data.Length);
    }
}
// Always unsubscribe events (-=) when the subscriber is done.`,
    },
  ];

  quiz: QuizQuestion[] = [
    {
      q: 'What is the key difference between Func<int, bool> and Action<int>?',
      options: [
        'Func can only take one parameter; Action can take many',
        'Func returns a value; Action returns void',
        'Action is for async methods; Func is for synchronous methods',
        'They are identical — just different names for the same delegate',
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
        'The delegate removes the faulting subscriber and continues to the third',
      ],
      answer: 1,
      explanation: 'A multicast delegate calls subscribers in order. If any subscriber throws an unhandled exception, execution stops at that point — subsequent subscribers are not called and the exception propagates to the caller of Invoke. To guarantee all subscribers run, iterate <code>GetInvocationList()</code> yourself with a try/catch per entry.',
    },
    {
      q: 'What restriction does the event keyword add compared to a plain public delegate field?',
      options: [
        'Events are slower because they use reflection internally',
        'External code cannot assign (=) or invoke the event — only += and -= are allowed',
        'Events can only have one subscriber at a time',
        'Events cannot use lambda expressions as subscribers',
      ],
      answer: 1,
      explanation: 'Declaring a field as <code>event</code> restricts external access to subscribe (<code>+=</code>) and unsubscribe (<code>-=</code>). External code cannot set (<code>=</code>) the delegate to a new value or invoke it directly, which prevents one subscriber from accidentally clearing all others or firing the event from outside the declaring class.',
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
      explanation: 'Lambdas capture variables by reference. When all lambdas share the same loop variable, they all see the same (final) value. Copying into a fresh local variable (<code>int captured = i;</code>) means each lambda closes over a distinct variable that holds the value at that iteration.',
    },
  ];

  qna: QnaItem[] = [
    {
      q: 'When do I need a custom delegate vs Func<> / Action<>?',
      a: 'Almost never. Prefer <code>Func&lt;&gt;</code> and <code>Action&lt;&gt;</code> — they are part of the BCL, universally understood, and require no extra declaration. Define a custom delegate only when you need a descriptive name that carries domain meaning (e.g. <code>OrderValidator</code>) and that name meaningfully improves readability across a large surface area, or when you need the delegate to appear with <code>out</code>/<code>ref</code> parameters which Func/Action do not support.',
    },
    {
      q: 'Why is my event null when I try to raise it?',
      a: 'An event is <code>null</code> when no subscribers have been added yet. The idiomatic safe-raise pattern is <code>MyEvent?.Invoke(this, args)</code>. The null-conditional operator checks for null and invokes only when at least one subscriber exists. Without this check you get a <code>NullReferenceException</code> on first use. As a convenience some developers initialise the event with an empty handler (<code>event Action? Changed = delegate { };</code>) but the null-check pattern is cleaner and cheaper.',
    },
    {
      q: 'What is a static lambda?',
      a: 'A <code>static</code> lambda (C# 9+) is a lambda annotated with the <code>static</code> modifier: <code>Func&lt;int, int&gt; f = static x => x * 2;</code>. The compiler enforces that it captures nothing — no local variables, no <code>this</code>, no outer members. Because there is nothing to close over, the compiler can cache a single delegate instance rather than allocating a new closure object every time the containing method runs. Use static lambdas in hot paths or LINQ queries where allocation matters.',
    },
    {
      q: 'How do closures cause memory leaks?',
      a: 'When a lambda closes over a variable the compiler generates a hidden class whose field holds that variable. If the delegate is stored somewhere long-lived (e.g. a static event, a cache) the closure object — and everything it references — cannot be garbage collected. The most common form: a short-lived subscriber closes over <code>this</code> and forgets to call <code>-=</code> on a long-lived event. The publisher holds the delegate, the delegate holds the closure, the closure holds the subscriber, preventing collection. Always unsubscribe with <code>-=</code> in <code>Dispose</code> or equivalent cleanup.',
    },
  ];

  challenge: Challenge = {
    title: 'Simple Event Bus / Mediator',
    description: `Implement a lightweight in-process event bus using delegates.
1. Create an <code>EventBus</code> class with a <code>Dictionary&lt;Type, List&lt;Delegate&gt;&gt;</code> as its backing store.
2. Add a <code>Subscribe&lt;T&gt;(Action&lt;T&gt; handler)</code> method that registers the handler for message type <code>T</code>.
3. Add an <code>Unsubscribe&lt;T&gt;(Action&lt;T&gt; handler)</code> method that removes the handler.
4. Add a <code>Publish&lt;T&gt;(T message)</code> method that invokes all registered handlers for type <code>T</code>, passing the message. If no handlers are registered, do nothing.`,
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
        // TODO: invoke all handlers registered for typeof(T)
        throw new NotImplementedException();
    }
}

// Expected usage:
record OrderPlaced(int OrderId, decimal Total);
record UserRegistered(string Email);

var bus = new EventBus();

bus.Subscribe<OrderPlaced>(e => Console.WriteLine($"Order #{e.OrderId} — £{e.Total}"));
bus.Subscribe<UserRegistered>(e => Console.WriteLine($"Welcome, {e.Email}"));

bus.Publish(new OrderPlaced(1, 49.99m));      // Order #1 — £49.99
bus.Publish(new UserRegistered("a@b.com"));   // Welcome, a@b.com
bus.Publish(new OrderPlaced(2, 9.99m));       // Order #2 — £9.99`,
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

        foreach (var handler in list.ToList())   // ToList() — snapshot in case Subscribe/Unsubscribe is called inside a handler
            ((Action<T>)handler)(message);
    }
}

record OrderPlaced(int OrderId, decimal Total);
record UserRegistered(string Email);

var bus = new EventBus();

bus.Subscribe<OrderPlaced>(e => Console.WriteLine($"Order #{e.OrderId} — £{e.Total}"));
bus.Subscribe<UserRegistered>(e => Console.WriteLine($"Welcome, {e.Email}"));

bus.Publish(new OrderPlaced(1, 49.99m));      // Order #1 — £49.99
bus.Publish(new UserRegistered("a@b.com"));   // Welcome, a@b.com
bus.Publish(new OrderPlaced(2, 9.99m));       // Order #2 — £9.99`,
  };
}
