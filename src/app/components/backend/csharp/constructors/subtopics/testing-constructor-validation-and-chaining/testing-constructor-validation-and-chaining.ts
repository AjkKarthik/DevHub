import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-testing-constructor-validation-and-chaining-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
    TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './testing-constructor-validation-and-chaining.html',
  styleUrl: './testing-constructor-validation-and-chaining.scss',
})
export class TestingConstructorValidationAndChainingSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page\'s Money challenge validates extensively — never tests it',
      points: [
        'The main Constructors page\'s challenge builds a <code>Money</code> struct with real validation (amount must be non-negative, currency must be 3 uppercase letters) and constructor chaining (a convenience constructor defaulting to "USD") — but the demonstration only runs and prints happy-path examples. Constructor validation and chaining are both genuinely worth direct test coverage, since both are easy to silently break during a refactor.',
      ],
    },
    {
      heading: 'Testing validation — assert on the EXCEPTION TYPE and the PARAMETER NAME',
      points: [
        'A thorough constructor-validation test does more than confirm SOME exception was thrown — it asserts the SPECIFIC exception type (<code>ArgumentOutOfRangeException</code> vs <code>ArgumentException</code>, exactly as the main page\'s challenge distinguishes for amount vs currency) and, ideally, the <code>ParamName</code> property, which should match the actual constructor parameter that failed validation.',
        'Asserting <code>ParamName</code> specifically catches a subtle bug class: copy-pasted validation logic where the exception references the WRONG parameter name (e.g. throwing <code>new ArgumentException("...", nameof(amount))</code> inside the currency-validation branch by mistake) — a bug that a bare <code>Assert.Throws&lt;ArgumentException&gt;()</code> would never catch, since it only checks the exception TYPE.',
      ],
    },
    {
      heading: 'Testing chaining — prove the convenience constructor really produces the SAME result',
      points: [
        'The main page\'s <code>Money(decimal amount) : this(amount, "USD")</code> convenience constructor should produce an object IDENTICAL to calling the primary constructor directly with <code>"USD"</code> — this is directly testable by constructing both ways and asserting equality (or, for a struct without custom equality, comparing each property individually).',
        'This specifically guards against a chaining bug where someone later "simplifies" the convenience constructor by duplicating logic instead of delegating via <code>this(...)</code> — the moment the default diverges from what the primary constructor would produce (e.g. someone changes the default from "USD" to "usd" by mistake), this test fails immediately.',
      ],
    },
    {
      heading: 'Testing that validation genuinely happens BEFORE any state is observable',
      points: [
        'A constructor that throws partway through should leave NO partially-constructed object observable anywhere — for a <code>struct</code> like the main page\'s <code>Money</code>, this is automatically guaranteed (a struct that fails construction is simply never returned, there is no reference to leak). For a CLASS constructor, though, this is worth testing explicitly if the constructor does anything (like registering with a static collection) before its OWN validation completes — connecting directly to the main page\'s own "object escape" Common Mistake, which is exactly the kind of bug a targeted test can catch.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Testing validation type AND ParamName — not just "some exception"',
      language: 'csharp',
      code: `using Xunit;

// The Money struct from the main topic's challenge:
public struct Money
{
    public decimal Amount   { get; }
    public string  Currency { get; }

    public Money(decimal amount, string currency)
    {
        if (amount < 0)
            throw new ArgumentOutOfRangeException(nameof(amount), "Amount must be non-negative.");
        if (string.IsNullOrEmpty(currency) || currency.Length != 3
            || currency != currency.ToUpperInvariant())
            throw new ArgumentException("Currency must be 3 uppercase letters.", nameof(currency));

        Amount = amount;
        Currency = currency;
    }

    public Money(decimal amount) : this(amount, "USD") { }
}

public class MoneyValidationTests
{
    [Fact]
    public void NegativeAmount_ThrowsArgumentOutOfRangeException_WithCorrectParamName()
    {
        var ex = Assert.Throws<ArgumentOutOfRangeException>(
            () => new Money(-1m, "USD"));

        // Asserting ParamName catches a copy-paste bug that a bare
        // Assert.Throws<ArgumentOutOfRangeException>() would completely miss:
        Assert.Equal("amount", ex.ParamName);
    }

    [Theory]
    [InlineData("us")]      // too short
    [InlineData("USDD")]    // too long
    [InlineData("usd")]     // lowercase
    [InlineData("")]        // empty
    public void InvalidCurrency_ThrowsArgumentException_WithCorrectParamName(string badCurrency)
    {
        var ex = Assert.Throws<ArgumentException>(
            () => new Money(10m, badCurrency));

        Assert.Equal("currency", ex.ParamName);
    }
}`,
    },
    {
      label: 'Testing constructor chaining — the convenience overload really defaults correctly',
      language: 'csharp',
      code: `public class MoneyChainingTests
{
    [Fact]
    public void ConvenienceConstructor_DefaultsToUSD_MatchingPrimaryConstructorDirectly()
    {
        // Two DIFFERENT construction paths that should produce an
        // IDENTICAL result if the chaining is correct:
        var viaConvenience = new Money(9.99m);           // : this(amount, "USD")
        var viaPrimaryDirect = new Money(9.99m, "USD");   // primary constructor directly

        Assert.Equal(viaPrimaryDirect.Amount, viaConvenience.Amount);
        Assert.Equal(viaPrimaryDirect.Currency, viaConvenience.Currency);

        // This test would FAIL immediately if someone later "simplified"
        // the convenience constructor by duplicating logic with a typo
        // (e.g. defaulting to "usd" instead of "USD") instead of
        // genuinely delegating via : this(...) — a chaining regression
        // that reading the code once would not reliably catch.
    }

    [Fact]
    public void ConvenienceConstructor_StillValidatesAmount_ThroughTheChain()
    {
        // Proves validation logic in the PRIMARY constructor is actually
        // exercised when going through the convenience constructor —
        // confirming the chain genuinely runs the shared validation,
        // not a separately (and possibly incompletely) duplicated copy:
        var ex = Assert.Throws<ArgumentOutOfRangeException>(
            () => new Money(-5m)); // convenience constructor — no currency arg

        Assert.Equal("amount", ex.ParamName);
    }
}`,
    },
    {
      label: 'Testing that a class constructor doesn\'t leak "this" before validation completes',
      language: 'csharp',
      code: `public class Registry
{
    private static readonly List<Widget> _all = new();
    public static IReadOnlyList<Widget> All => _all;
    internal static void Clear() => _all.Clear(); // test-only helper
    internal static void Register(Widget w) => _all.Add(w);
}

public class Widget
{
    public string Name { get; }

    public Widget(string name)
    {
        // Validate FIRST — before any possibility of escaping "this":
        if (string.IsNullOrWhiteSpace(name))
            throw new ArgumentException("Name is required.", nameof(name));

        Name = name;
        Registry.Register(this); // escapes only AFTER validation passes —
                                  // exactly avoiding the main topic's own
                                  // "object escape" Common Mistake
    }
}

public class ObjectEscapeTests
{
    [Fact]
    public void FailedConstruction_NeverRegistersAPartialObject()
    {
        Registry.Clear();

        Assert.Throws<ArgumentException>(() => new Widget(""));

        // Proves the failed construction left NO trace in the registry —
        // directly testing the "validate before escaping this" discipline
        // the main topic's object-escape mistake describes, rather than
        // trusting it from a single read of the constructor body:
        Assert.Empty(Registry.All);
    }

    [Fact]
    public void SuccessfulConstruction_RegistersExactlyOnce()
    {
        Registry.Clear();
        var widget = new Widget("Gadget");

        Assert.Single(Registry.All);
        Assert.Same(widget, Registry.All[0]);
    }
}`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A teammate refactors <code>Money</code>\'s validation to check currency BEFORE amount (swapping the order of the two if-checks in the primary constructor). Would the existing <code>NegativeAmount_ThrowsArgumentOutOfRangeException_WithCorrectParamName</code> test from the first example still pass if called as <code>new Money(-1m, "us")</code> (both amount AND currency are invalid)? Explain why order matters here.',
    hint: 'Think about what actually happens when BOTH validation conditions are true simultaneously — only the FIRST failing check\'s exception is ever thrown, since the constructor throws and stops executing immediately. Swapping validation order changes WHICH exception type/ParamName is produced for inputs that violate multiple rules at once.',
    solution: `// The original test uses new Money(-1m, "USD") — a VALID currency and an
// INVALID amount — so validation order does not matter for THAT
// specific test case; only the amount check can possibly fail.

// But consider new Money(-1m, "us") — BOTH amount and currency are
// invalid simultaneously. With the ORIGINAL order (amount checked
// first), this throws ArgumentOutOfRangeException for "amount". After
// the refactor (currency checked first), the SAME call now throws
// ArgumentException for "currency" instead — a completely different
// exception type and ParamName, even though the actual amount is
// still -1m and still invalid.

[Fact]
public void BothInvalid_ExceptionDependsEntirelyOnValidationOrder()
{
    // Documents (and pins down) the actual behavior for inputs that
    // violate MULTIPLE rules — this is exactly the kind of edge case
    // that becomes a silent, hard-to-notice behavior change after a
    // seemingly harmless "reorder the if-checks" refactor:
    var ex = Assert.Throws<ArgumentOutOfRangeException>(
        () => new Money(-1m, "us")); // BOTH invalid — order determines outcome

    Assert.Equal("amount", ex.ParamName);
    // If the teammate's currency-first refactor ships, THIS test fails —
    // ArgumentException (currency) is thrown instead of
    // ArgumentOutOfRangeException (amount), immediately surfacing the
    // order-dependent behavior change as a genuine test failure rather
    // than a silent, unnoticed API contract shift.
}`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'Assert.Throws&lt;ArgumentException&gt;() is sufficient to verify a constructor\'s validation logic is correct.',
      reality: 'a thorough test also asserts the ParamName property matches the actual invalid parameter — Assert.Throws alone cannot catch a copy-paste bug where the exception references the wrong parameter name, since it only checks the exception TYPE.',
    },
    {
      thought: 'a convenience constructor that chains via : this(...) does not need its own test, since the primary constructor it delegates to is already tested.',
      reality: 'the convenience constructor should be tested to confirm it produces a result IDENTICAL to calling the primary constructor directly with the expected default — this guards against a future "simplification" that duplicates logic instead of genuinely delegating, silently diverging from the intended default.',
    },
    {
      thought: 'when a constructor has multiple independent validation checks, the order those checks run in is an implementation detail that does not need to be pinned down by tests.',
      reality: 'for inputs that violate MULTIPLE validation rules simultaneously, the check order determines WHICH exception type and ParamName the caller actually sees — a test covering only single-violation inputs can miss an order-dependent behavior change entirely.',
    },
  ];
}
