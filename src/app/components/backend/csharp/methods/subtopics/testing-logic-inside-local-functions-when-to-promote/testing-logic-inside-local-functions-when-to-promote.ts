import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-testing-logic-inside-local-functions-when-to-promote-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
    TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './testing-logic-inside-local-functions-when-to-promote.html',
  styleUrl: './testing-logic-inside-local-functions-when-to-promote.scss',
})
export class TestingLogicInsideLocalFunctionsWhenToPromoteSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page recommends local functions freely — never discusses testability',
      points: [
        'The main Methods page\'s Q&A gives a clear rule of thumb: "start local, promote to private when a second caller appears." This is sound design advice, but it never addresses TESTABILITY specifically — a local function, by its very nature, cannot be called directly from a unit test, because it does not exist as a member of the enclosing type at all; it is scoped entirely to the method it lives inside.',
      ],
    },
    {
      heading: 'A local function can only be tested INDIRECTLY, through its enclosing method',
      points: [
        'Testing a local function means exercising it through the public (or internal) method that contains it — there is no way to call <code>Compute</code> from the main page\'s <code>Factorial</code> example directly from a test; you can only call <code>Factorial</code> itself and infer that <code>Compute</code> worked correctly from the final result.',
        'For SIMPLE local functions (the main page\'s recursive <code>Compute</code> helper, or a small formatting/validation step), this indirect testing is perfectly fine — the enclosing method\'s own test suite exercises the local function\'s behavior thoroughly enough by covering the enclosing method\'s different input scenarios.',
      ],
    },
    {
      heading: 'When a local function grows complex enough to need its OWN dedicated test cases, that is the promotion signal',
      points: [
        'If a local function has multiple distinct branches, edge cases, or failure modes that you want to test INDEPENDENTLY of the enclosing method\'s own logic — separate from the "start local, promote when a second caller appears" rule the main page already gives — that need for isolated, direct test coverage is itself a second, testability-driven reason to promote it to a <code>private</code> method, even if it genuinely still has only one caller.',
        'This refines the main page\'s promotion rule: promotion is not ONLY about reuse (a second caller) — it can also be about testability (a local function whose own internal logic is complex enough to deserve DIRECT test coverage, reachable via <code>InternalsVisibleTo</code> and <code>internal</code> visibility, or simply because the enclosing method\'s test surface has become too indirect to give confidence).',
      ],
    },
    {
      heading: 'A middle ground — testing complex local functions in isolation without full promotion',
      points: [
        'One practical technique: extract the local function to a genuinely STANDALONE local <code>Func&lt;&gt;</code>/<code>Action&lt;&gt;</code> local VARIABLE returned or exposed via an internal testing seam is usually more trouble than it is worth — the SIMPLEST and most idiomatic fix, when a local function\'s logic has grown complex, is exactly the main page\'s own suggestion: promote it to a <code>private</code> (or <code>internal</code>, testable via <code>InternalsVisibleTo</code>) method on the class, and test it directly like any other private/internal method.',
        'The main lesson is recognizing the SIGNAL early: if you find yourself wanting a dedicated <code>[Theory]</code> with many <code>[InlineData]</code> cases specifically targeting a local function\'s edge cases (not the enclosing method\'s), that desire itself is the promotion trigger — waiting for "a second caller" alone, as the main page\'s rule literally states, can leave complex, under-tested logic hidden inside a method for longer than it should be.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'A simple local function — indirect testing through the enclosing method is fine',
      language: 'csharp',
      code: `public static class MathHelpers
{
    public static long Factorial(int n)
    {
        if (n < 0) throw new ArgumentException("n must be non-negative");
        return Compute(n);

        long Compute(int x) => x <= 1 ? 1 : x * Compute(x - 1); // simple, recursive
    }
}

public class FactorialTests
{
    // These tests exercise Compute() INDIRECTLY, through Factorial —
    // there is no way to call Compute() directly, and for logic this
    // simple, that indirection is perfectly fine:
    [Theory]
    [InlineData(0, 1)]
    [InlineData(1, 1)]
    [InlineData(5, 120)]
    [InlineData(10, 3628800)]
    public void Factorial_ComputesCorrectValue(int n, long expected) =>
        Assert.Equal(expected, MathHelpers.Factorial(n));

    [Fact]
    public void Factorial_NegativeInput_Throws() =>
        Assert.Throws<ArgumentException>(() => MathHelpers.Factorial(-1));
}`,
    },
    {
      label: 'A local function outgrowing local-function status — the testability signal',
      language: 'csharp',
      code: `public class PricingEngine
{
    public decimal CalculateTotal(Order order)
    {
        decimal subtotal = order.Items.Sum(i => i.Price * i.Quantity);
        return ApplyDiscountRules(subtotal, order.CustomerTier, order.IsFirstOrder);

        // This local function has grown well beyond "simple" — multiple
        // branches, multiple edge cases, genuinely deserving its OWN
        // dedicated test matrix independent of CalculateTotal's own tests:
        decimal ApplyDiscountRules(decimal amount, CustomerTier tier, bool isFirst)
        {
            if (amount < 50m) return amount;
            if (tier == CustomerTier.VIP) return amount * 0.80m;
            if (tier == CustomerTier.Gold && amount > 1000m) return amount * 0.82m;
            if (tier == CustomerTier.Gold) return amount * 0.88m;
            if (tier == CustomerTier.Silver && isFirst) return amount * 0.85m;
            if (tier == CustomerTier.Silver) return amount * 0.92m;
            if (isFirst && amount > 500m) return amount * 0.90m;
            return amount * 0.95m;
        }
    }
}

// Testing this discount logic can ONLY happen indirectly, through
// CalculateTotal — which means every test must also construct a full
// Order with Items, even though the logic under test is really about
// ApplyDiscountRules' amount/tier/isFirst inputs specifically. This
// awkwardness IS the promotion signal.`,
    },
    {
      label: 'Promoted to a testable private method — direct, isolated test coverage',
      language: 'csharp',
      code: `public class PricingEngine
{
    public decimal CalculateTotal(Order order)
    {
        decimal subtotal = order.Items.Sum(i => i.Price * i.Quantity);
        return ApplyDiscountRules(subtotal, order.CustomerTier, order.IsFirstOrder);
    }

    // Promoted from a local function to 'internal' — reachable from tests
    // via InternalsVisibleTo, without exposing it on the PUBLIC API surface:
    internal decimal ApplyDiscountRules(decimal amount, CustomerTier tier, bool isFirst)
    {
        if (amount < 50m) return amount;
        if (tier == CustomerTier.VIP) return amount * 0.80m;
        if (tier == CustomerTier.Gold && amount > 1000m) return amount * 0.82m;
        if (tier == CustomerTier.Gold) return amount * 0.88m;
        if (tier == CustomerTier.Silver && isFirst) return amount * 0.85m;
        if (tier == CustomerTier.Silver) return amount * 0.92m;
        if (isFirst && amount > 500m) return amount * 0.90m;
        return amount * 0.95m;
    }
}

// [assembly: InternalsVisibleTo("PricingEngine.Tests")]  // in AssemblyInfo/csproj

public class DiscountRuleTests
{
    private readonly PricingEngine _engine = new();

    // Now DIRECTLY testable — no need to construct a full Order for every
    // edge case; each discount tier/threshold gets its own focused test:
    [Theory]
    [InlineData(1500, CustomerTier.Gold, false, 1230)]   // 1500 * 0.82
    [InlineData(200,  CustomerTier.Gold, false, 176)]    // 200 * 0.88
    [InlineData(30,   CustomerTier.VIP,  false, 30)]     // under 50 — no discount
    [InlineData(600,  CustomerTier.Regular, true, 540)]  // 600 * 0.90
    public void ApplyDiscountRules_ReturnsExpectedAmount(
        decimal amount, CustomerTier tier, bool isFirst, decimal expected) =>
        Assert.Equal(expected, _engine.ApplyDiscountRules(amount, tier, isFirst));
}`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A teammate wants to test a local function\'s logic without promoting it or exposing it via InternalsVisibleTo, by extracting it to a local <code>Func&lt;decimal, decimal&gt;</code> variable and somehow "returning" it from the enclosing method for the test to call. Explain why the promotion-to-private/internal approach from the code examples is simpler and more idiomatic than this workaround.',
    hint: 'Think about what "returning a Func for testing purposes" actually requires: the enclosing method would need an additional, test-only return path or parameter just to expose internal logic — a design compromise made purely to accommodate testing. Compare that to simply making the logic a proper internal method, which is a normal, well-understood C# pattern requiring no special-casing of the production method\'s signature.',
    solution: `// The "return a Func for testing" workaround requires distorting the
// PRODUCTION method's signature or behavior just to make internals
// reachable — e.g. adding an out parameter, a testing-only overload, or
// changing the return type to expose the local function as a delegate.
// This couples the method's public contract to testing concerns, which
// is exactly the kind of design smell the "promote to testable" fix avoids.

// The promotion approach (internal + InternalsVisibleTo) requires ZERO
// changes to the public method's signature or behavior — CalculateTotal
// still returns exactly decimal, exactly as before. The discount logic
// simply becomes a separate, ordinarily-callable internal member, tested
// the same way any other internal method would be:

public class PricingEngine
{
    public decimal CalculateTotal(Order order)   // UNCHANGED signature
    {
        decimal subtotal = order.Items.Sum(i => i.Price * i.Quantity);
        return ApplyDiscountRules(subtotal, order.CustomerTier, order.IsFirstOrder);
    }

    internal decimal ApplyDiscountRules(decimal amount, CustomerTier tier, bool isFirst)
        => /* ... */ amount; // ordinary internal method — no test-only plumbing needed
}

// This is simpler because it uses a mechanism (internal + InternalsVisibleTo)
// that C# and .NET tooling already fully understand and support, rather
// than inventing a bespoke "expose internals via delegate" pattern that
// every future reader would need to learn from scratch.`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'a local function should only ever be promoted to a private method when a second caller appears, exactly as the main topic\'s rule of thumb states.',
      reality: 'testability is a second, independent promotion trigger — a local function whose internal logic has grown complex enough to deserve its own dedicated, isolated test coverage should be promoted even with only one caller, because there is no way to test a local function\'s logic directly without going through its enclosing method.',
    },
    {
      thought: 'a local function can be unit tested directly, the same way a private method can be tested via reflection or InternalsVisibleTo.',
      reality: 'a local function has no existence as a member of the enclosing type at all — it is scoped entirely within the method body — so it can only ever be exercised indirectly, through calls to the enclosing method.',
    },
    {
      thought: 'the fix for a hard-to-test local function is to invent a way to expose it (e.g. returning it as a delegate) rather than simply promoting it to a private or internal method.',
      reality: 'promoting the local function to internal (paired with InternalsVisibleTo for the test assembly) is the simpler, more idiomatic fix — it requires no changes to the enclosing method\'s public signature and uses ordinary, well-understood C# visibility mechanics rather than a bespoke testing workaround.',
    },
  ];
}
