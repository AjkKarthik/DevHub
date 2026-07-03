import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-writing-custom-lazy-linq-operators-with-yield-return-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
    TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './writing-custom-lazy-linq-operators-with-yield-return.html',
  styleUrl: './writing-custom-lazy-linq-operators-with-yield-return.scss',
})
export class WritingCustomLazyLinqOperatorsWithYieldReturnSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main topic explains laziness as a fact about Where/Select — this page shows how to BUILD an operator with that same property',
      points: [
        'The main LINQ page states "operators like Where and Select return IEnumerable&lt;T&gt; — they do not execute until enumerated" as a THEORY point about existing operators — it never shows how a CUSTOM extension method achieves this same deferred-execution behavior, or the specific mistake that silently breaks it.',
      ],
    },
    {
      heading: 'yield return — the mechanism that makes deferred execution possible',
      points: [
        'A method using <code>yield return</code> inside its body is compiled by the C# compiler into a hidden STATE MACHINE (an <code>IEnumerator&lt;T&gt;</code> implementation) — calling the method does NOT run any of its code immediately; it just returns an object that, when iterated (via <code>MoveNext()</code>), runs the method\'s body UP TO the next <code>yield return</code>, pauses, and resumes from exactly that point on the next iteration.',
        'This is precisely how <code>Where</code> and <code>Select</code> achieve the laziness the main topic describes — internally, the BCL\'s own implementations use <code>yield return</code> (or an equivalent hand-written enumerator) so that calling <code>source.Where(predicate)</code> does no filtering work at all until something actually enumerates the result.',
      ],
    },
    {
      heading: 'A custom operator, written correctly',
      points: [
        'A custom "TakeEveryNth" operator: <code>public static IEnumerable&lt;T&gt; TakeEveryNth&lt;T&gt;(this IEnumerable&lt;T&gt; source, int n) &#123; int i = 0; foreach (var item in source) &#123; if (i % n == 0) yield return item; i++; &#125; &#125;</code> — calling this on a source does NOT iterate the source at all until the CALLER enumerates the result, exactly matching <code>Where</code>\'s behavior and composing cleanly with other LINQ operators in a chain.',
        'This composability is the whole point: <code>data.Where(x =&gt; x.IsValid).TakeEveryNth(3).Select(x =&gt; x.Name)</code> builds up a single deferred pipeline — nothing runs until the final <code>.ToList()</code> or <code>foreach</code>, and each stage only processes what it needs to, exactly like the main topic\'s "compose a long chain cheaply" point describes for the built-in operators.',
      ],
    },
    {
      heading: 'The classic footgun — eager argument validation silently breaking laziness',
      points: [
        'A method containing <code>yield return</code> ANYWHERE in its body has its ENTIRE body deferred — including argument validation you might expect to run immediately: <code>public static IEnumerable&lt;T&gt; TakeEveryNth&lt;T&gt;(this IEnumerable&lt;T&gt; source, int n) &#123; if (n &lt;= 0) throw new ArgumentException(...); foreach (...) yield return ...; &#125;</code> — the <code>ArgumentException</code> does NOT throw when <code>TakeEveryNth(0)</code> is CALLED; it only throws when the result is later ENUMERATED, which can be surprising and far from the actual bug\'s call site in a stack trace.',
        'The standard fix is to SPLIT the method into a thin, EAGER public wrapper that validates immediately, plus a PRIVATE iterator method (also using <code>yield return</code>) that does the actual lazy work: <code>public static IEnumerable&lt;T&gt; TakeEveryNth&lt;T&gt;(this IEnumerable&lt;T&gt; source, int n) &#123; if (n &lt;= 0) throw new ArgumentException(...); return TakeEveryNthCore(source, n); &#125; private static IEnumerable&lt;T&gt; TakeEveryNthCore&lt;T&gt;(IEnumerable&lt;T&gt; source, int n) &#123; foreach (...) yield return ...; &#125;</code> — this makes validation happen at CALL time (matching normal method-call expectations) while the actual iteration remains fully lazy.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'A basic custom lazy operator',
      language: 'csharp',
      code: `public static class LinqExtensions
{
    // Composes into a LINQ chain exactly like Where/Select — nothing runs
    // until the CALLER enumerates the result.
    public static IEnumerable<T> TakeEveryNth<T>(this IEnumerable<T> source, int n)
    {
        int i = 0;
        foreach (var item in source)
        {
            if (i % n == 0) yield return item;
            i++;
        }
    }
}

// Proof of laziness — nothing is printed until the foreach runs.
IEnumerable<int> PrintAndYield(IEnumerable<int> src)
{
    foreach (var x in src)
    {
        Console.WriteLine($"source produced: {x}");
        yield return x;
    }
}

var pipeline = PrintAndYield(new[] { 1, 2, 3, 4, 5, 6 }).TakeEveryNth(2);
Console.WriteLine("Pipeline built — nothing printed yet.");

foreach (var x in pipeline)
    Console.WriteLine($"consumed: {x}");
// Only NOW do "source produced:" lines interleave with "consumed:" lines —
// proving the whole chain, including the custom operator, is fully lazy.`,
    },
    {
      label: 'The eager-validation footgun — and its fix',
      language: 'csharp',
      code: `// BROKEN — the ArgumentException is inside a method containing yield return,
// so the ENTIRE method body (including the validation) is deferred.
public static IEnumerable<T> TakeEveryNthBroken<T>(this IEnumerable<T> source, int n)
{
    if (n <= 0)
        throw new ArgumentException("n must be positive", nameof(n));

    int i = 0;
    foreach (var item in source)
    {
        if (i % n == 0) yield return item;
        i++;
    }
}

// This line does NOT throw — even though n is clearly invalid!
var result = someList.TakeEveryNthBroken(0);
Console.WriteLine("No exception yet...");

// The exception only fires HERE, far from the actual call site:
foreach (var x in result) Console.WriteLine(x); // NOW it throws

// FIXED — thin eager wrapper validates immediately; a separate private
// iterator method (still using yield return) does the lazy work.
public static IEnumerable<T> TakeEveryNth<T>(this IEnumerable<T> source, int n)
{
    if (n <= 0)
        throw new ArgumentException("n must be positive", nameof(n));

    return TakeEveryNthCore(source, n); // NOT a yield method — runs immediately
}

private static IEnumerable<T> TakeEveryNthCore<T>(IEnumerable<T> source, int n)
{
    int i = 0;
    foreach (var item in source)
    {
        if (i % n == 0) yield return item;
        i++;
    }
}

// Now this throws IMMEDIATELY, at the actual call site:
var fixedResult = someList.TakeEveryNth(0); // throws ArgumentException right here`,
    },
    {
      label: 'Composing a custom operator into a real pipeline',
      language: 'csharp',
      code: `public record Order(int Id, decimal Amount, bool IsValid);

public static class LinqExtensions
{
    public static IEnumerable<T> TakeEveryNth<T>(this IEnumerable<T> source, int n)
    {
        if (n <= 0) throw new ArgumentException("n must be positive", nameof(n));
        return TakeEveryNthCore(source, n);
    }

    private static IEnumerable<T> TakeEveryNthCore<T>(IEnumerable<T> source, int n)
    {
        int i = 0;
        foreach (var item in source)
        {
            if (i % n == 0) yield return item;
            i++;
        }
    }
}

var orders = new List<Order>
{
    new(1, 50m, true), new(2, 30m, false), new(3, 80m, true),
    new(4, 20m, true), new(5, 90m, true), new(6, 10m, false),
};

// Composes seamlessly with built-in operators — this is exactly the
// "compose a long chain cheaply" property the main topic describes,
// now proven to hold for a CUSTOM operator too.
var sample = orders
    .Where(o => o.IsValid)
    .TakeEveryNth(2)          // custom operator mid-chain
    .Select(o => o.Amount)
    .ToList();                // materialise once, at the very end

Console.WriteLine(string.Join(", ", sample)); // 50, 90 (every 2nd valid order)`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'Write a custom lazy operator <code>WithRunningTotal&lt;T&gt;(this IEnumerable&lt;T&gt; source, Func&lt;T, decimal&gt; amountSelector)</code> that yields <code>(T Item, decimal RunningTotal)</code> tuples, where each tuple\'s <code>RunningTotal</code> is the sum of all amounts seen SO FAR (inclusive) — using the eager-validation-wrapper pattern for a null-check on <code>amountSelector</code>.',
    hint: 'Split into a public wrapper that null-checks amountSelector immediately (ArgumentNullException.ThrowIfNull), returning a call to a private Core method containing the actual yield return loop. Inside the core method, keep a running decimal total, add amountSelector(item) on each iteration, then yield return (item, total).',
    solution: `public static IEnumerable<(T Item, decimal RunningTotal)> WithRunningTotal<T>(
    this IEnumerable<T> source, Func<T, decimal> amountSelector)
{
    ArgumentNullException.ThrowIfNull(amountSelector); // eager — runs at call time

    return WithRunningTotalCore(source, amountSelector);
}

private static IEnumerable<(T Item, decimal RunningTotal)> WithRunningTotalCore<T>(
    IEnumerable<T> source, Func<T, decimal> amountSelector)
{
    decimal total = 0m;
    foreach (var item in source)
    {
        total += amountSelector(item);
        yield return (item, total);
    }
}

// Usage:
var orders = new List<Order> { new(1, 50m, true), new(2, 30m, true), new(3, 20m, true) };
foreach (var (order, runningTotal) in orders.WithRunningTotal(o => o.Amount))
    Console.WriteLine($"Order {order.Id}: running total = {runningTotal}");
// Order 1: running total = 50
// Order 2: running total = 80
// Order 3: running total = 100`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'a custom LINQ-style extension method using yield return validates its arguments immediately, the same as an ordinary method.',
      reality: 'a method containing yield return ANYWHERE in its body has its ENTIRE body deferred, including argument validation — an invalid argument throws only when the result is later enumerated, not when the method is called, unless you split validation into a separate eager wrapper.',
    },
    {
      thought: 'writing a custom operator with the same deferred-execution behavior as Where/Select requires special framework support or low-level tricks.',
      reality: 'yield return is all that\'s needed — the C# compiler transforms any method using it into a lazy state-machine-backed IEnumerable, the exact same mechanism the BCL\'s own Where/Select implementations use internally.',
    },
    {
      thought: 'a custom lazy operator cannot compose cleanly into a chain with built-in LINQ operators — it needs to be called separately, before or after the LINQ chain.',
      reality: 'since a correctly-written custom operator returns an ordinary IEnumerable&lt;T&gt;/extension method, it composes directly mid-chain with Where, Select, and any other operator — exactly like the main topic\'s "compose a long chain cheaply" property describes for built-in operators.',
    },
  ];
}
