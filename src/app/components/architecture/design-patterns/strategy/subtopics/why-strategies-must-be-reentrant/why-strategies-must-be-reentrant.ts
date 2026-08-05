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
    heading: 'A Warning Stated, Never Demonstrated',
    points: [
      'The main page\'s own QnA on strategy state is precise: "They should not hold mutable per-call state ' +
      'that persists across calls — that would make them non-reentrant. If per-call state is needed, use ' +
      'local variables inside the Execute() method, not instance fields." No codeTab on the page shows what ' +
      'breaking this rule actually looks like, or what breaks when you do.',
      'Every strategy shown on the main page (StandardShipping, ExpressShipping, ProductByPriceAsc, etc.) ' +
      'already follows this rule correctly — none of them have a mutable instance field at all, which is ' +
      'exactly why the failure mode the QnA warns about never surfaces anywhere in the page\'s own examples.',
    ],
  },
  {
    heading: 'Why "Shared Instance" Makes This a Real Risk, Not a Theoretical One',
    points: [
      'A single strategy instance is routinely shared across many calls — a Scoped or Singleton DI ' +
      'registration (exactly like the previous subtopic\'s own Keyed Services examples), or simply a ' +
      'long-lived <code>ShippingCalculator</code> reused for many orders. Storing per-call data on an ' +
      'INSTANCE field of that shared strategy means every caller is reading and writing the SAME memory.',
      'The corruption is not always obvious: for a single-threaded, strictly sequential caller, a mutable ' +
      'field might happen to work by accident (each call overwrites the previous value before it is read ' +
      'again) — right up until two calls interleave, whether from actual concurrent threads or simply a ' +
      'RECURSIVE or re-entrant call happening mid-calculation, at which point the shared field is overwritten ' +
      'out from under the first call.',
    ],
  },
];

const codeTabs: CodeTab[] = [
  {
    label: 'Non-Reentrant vs. Reentrant',
    language: 'csharp',
    code: `// NON-REENTRANT — violates the main page's own QnA rule. Stores
// per-call data (the discount just applied) on an INSTANCE field.
public class LoggingDiscountStrategy : IDiscountStrategy
{
    private decimal _lastDiscountApplied; // mutable per-call state!

    public decimal Calculate(decimal price)
    {
        _lastDiscountApplied = price * 0.10m;
        return price - _lastDiscountApplied;
    }

    public string GetLastDiscountMessage() =>
        $"Last discount applied: {_lastDiscountApplied:C}";
}

// A single shared instance, used for two DIFFERENT orders "at once"
// (e.g. two requests hitting the same Scoped/Singleton instance, or
// a recursive call reusing 'this' before the outer call finishes).
var strategy = new LoggingDiscountStrategy();

var priceA = strategy.Calculate(100m); // _lastDiscountApplied = 10
var priceB = strategy.Calculate(50m);  // _lastDiscountApplied = 5 (OVERWRITES A's value)

Console.WriteLine(strategy.GetLastDiscountMessage());
// "Last discount applied: $5.00" — reports order B's discount, even
// if the caller asking about order A's discount runs this line
// between the two Calculate() calls above, or from a different
// concurrent request sharing the same strategy instance.

// REENTRANT — per-call data lives in a LOCAL VARIABLE, and the
// message is RETURNED instead of stashed on the instance.
public class SafeLoggingDiscountStrategy : IDiscountStrategy
{
    public (decimal FinalPrice, string Message) Calculate(decimal price)
    {
        decimal discount = price * 0.10m; // local — not shared, not overwritten
        decimal final = price - discount;
        return (final, $"Discount applied: {discount:C}");
    }
}

var safe = new SafeLoggingDiscountStrategy();
var (finalA, msgA) = safe.Calculate(100m); // msgA: "Discount applied: $10.00"
var (finalB, msgB) = safe.Calculate(50m);  // msgB: "Discount applied: $5.00"
// msgA is STILL correct after B's call — nothing was overwritten,
// because there was no shared field to overwrite.`,
  },
];

const exercise: TryItExercise = {
  prompt:
    'Suppose <code>LoggingDiscountStrategy.Calculate</code> is called from TWO different threads at nearly ' +
    'the same moment, each with a different price, both racing to read <code>_lastDiscountApplied</code> via ' +
    '<code>GetLastDiscountMessage()</code> right after their own call. Is this purely a "wrong answer" bug, ' +
    'or could it also be an outright crash?',
  hint:
    'Think about what kind of operation writing to and reading from a single <code>decimal</code> field from ' +
    'two threads actually is — is it the SAME category of problem as a data race on a more complex object ' +
    'like a <code>List&lt;T&gt;</code>?',
  solution:
    'It is a "wrong answer" bug, not a crash. A decimal field read/write does not corrupt memory or throw the ' +
    'way a concurrent mutation of a List<T> can — each thread simply risks reading a value that was actually ' +
    'written by the OTHER thread\'s call, silently reporting the wrong discount for its own order. This is ' +
    'arguably worse than a crash in one sense: a crash is loud and gets noticed immediately, while a silently ' +
    'wrong discount amount reported to the wrong order can go unnoticed far longer, especially under light, ' +
    'rarely-overlapping load where the race window is only hit occasionally.',
};

const misconceptions: Misconception[] = [
  {
    thought: 'This only matters for strategies registered as DI singletons — a strategy created fresh with ' +
      '<code>new</code> for every single call is always safe regardless of what fields it has.',
    reality:
      'A freshly-created-per-call strategy IS safe from this specific problem, but the main page\'s own ' +
      '"Not injecting the strategy" mistake block already argues against constructing strategies ad hoc — the ' +
      'realistic, recommended usage (injected, often Scoped or Singleton) is exactly the shape that makes a ' +
      'mutable instance field dangerous. The QnA\'s rule is written as a general one precisely because you ' +
      'cannot always control or guarantee how a given strategy instance will be reused later.',
  },
  {
    thought: 'A recursive call to the SAME strategy instance is an unusual, contrived edge case not worth ' +
      'designing around.',
    reality:
      'The theory section names it deliberately alongside true multi-threading because it is a genuinely ' +
      'realistic case for some strategies — a discount strategy that internally calls a different discount ' +
      'strategy as part of computing a combined offer, for instance, could re-enter the SAME shared instance ' +
      'before the outer call finishes, corrupting the outer call\'s own in-progress state the same way two ' +
      'concurrent threads would.',
  },
];

@Component({
  selector: 'app-strategy-why-strategies-must-be-reentrant',
  standalone: true,
  imports: [CommonModule, SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent,
    CodeBlockComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './why-strategies-must-be-reentrant.html',
  styleUrl: './why-strategies-must-be-reentrant.scss',
})
export class WhyStrategiesMustBeReentrantSubtopic {
  theory = theory;
  codeTabs = codeTabs;
  exercise = exercise;
  misconceptions = misconceptions;
}
