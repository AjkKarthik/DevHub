import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-testing-records-equality-hash-codes-and-constructor-validation-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
    TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './testing-records-equality-hash-codes-and-constructor-validation.html',
  styleUrl: './testing-records-equality-hash-codes-and-constructor-validation.scss',
})
export class TestingRecordsEqualityHashCodesAndConstructorValidationSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main topic never shows a single test — and "it\'s auto-generated" isn\'t a reason to skip testing it',
      points: [
        'Because the compiler auto-generates <code>Equals</code>, <code>GetHashCode</code>, and the copy constructor, it is tempting to assume records need NO testing at all — the main topic\'s own Money challenge asserts <code>price == price2</code> works "for free," reinforcing that impression. But a record\'s BEHAVIOR still depends on what YOU wrote: compact-constructor validation logic, custom methods like <code>Add</code>/<code>Convert</code>, and — less obviously — whether the equality/hash-code CONTRACT still holds once you add your own members to a record.',
      ],
    },
    {
      heading: 'Testing the compact constructor actually throws',
      points: [
        'The main topic\'s <code>Money</code> compact constructor calls <code>ArgumentOutOfRangeException.ThrowIfNegative(Amount)</code> — this is exactly the kind of guard clause that\'s easy to get subtly wrong (an off-by-one boundary, a typo\'d comparison operator) and SHOULD be tested like any other validation logic: <code>Assert.Throws&lt;ArgumentOutOfRangeException&gt;(() =&gt; new Money(-1m, "GBP"))</code> proves the guard actually fires, not just that it compiles.',
        'Test the BOUNDARY specifically, not just an obviously-invalid value: <code>new Money(0m, "GBP")</code> should SUCCEED (zero is not negative) — a test asserting this does NOT throw catches an accidentally-too-strict guard (e.g. someone writing <code>&lt;=</code> instead of <code>&lt;</code> in a hand-rolled check) that a single "negative value throws" test would miss entirely.',
      ],
    },
    {
      heading: 'Testing that the Equals/GetHashCode CONTRACT is preserved after customization',
      points: [
        'The .NET equality contract requires: if <code>a.Equals(b)</code> is <code>true</code>, then <code>a.GetHashCode() == b.GetHashCode()</code> MUST also be true — records satisfy this automatically out of the box, but adding a computed property or overriding a method inside a record body does NOT change <code>Equals</code>/<code>GetHashCode</code> (they still only consider the declared properties), so this contract typically remains intact — the risk is specifically if a developer later hand-overrides <code>Equals</code> or <code>GetHashCode</code> themselves and introduces an inconsistency.',
        'A concrete, valuable test to write: <code>Assert.Equal(a.GetHashCode(), b.GetHashCode())</code> whenever <code>a.Equals(b)</code> — running this for a few representative equal PAIRS (including one created via <code>with</code>, since <code>with</code>-derived copies should be equal to a freshly-constructed record with the same values) catches a REAL, if rare, class of bug: a hand-added <code>GetHashCode</code> override that only considers SOME properties while <code>Equals</code> considers all of them, breaking the contract and causing the record to behave incorrectly as a <code>Dictionary</code> key or <code>HashSet</code> member.',
      ],
    },
    {
      heading: 'Testing with-expression results and custom methods together',
      points: [
        'The main topic\'s <code>Money.Add</code> and <code>Money.Convert</code> methods both use <code>with</code> internally — testing them means verifying BOTH the returned record\'s VALUES and that the ORIGINAL was left untouched: <code>var total = price.Add(tax); Assert.Equal(12.00m, total.Amount); Assert.Equal(10.00m, price.Amount);</code> — the second assertion specifically proves non-destructive mutation actually held, which is easy to accidentally break if a future refactor replaces <code>with</code> with in-place field mutation.',
        'Test the CURRENCY MISMATCH guard in <code>Add</code> explicitly — <code>Assert.Throws&lt;InvalidOperationException&gt;(() =&gt; gbpMoney.Add(eurMoney))</code> — this is ordinary business-logic validation, not something the compiler generates, and deserves the same test coverage as any other domain rule.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Testing compact constructor validation and its boundary',
      language: 'csharp',
      code: `public record Money(decimal Amount, string Currency)
{
    public Money
    {
        ArgumentOutOfRangeException.ThrowIfNegative(Amount, nameof(Amount));
    }
}

public class MoneyValidationTests
{
    [Fact]
    public void Constructor_ThrowsForNegativeAmount()
    {
        Assert.Throws<ArgumentOutOfRangeException>(() => new Money(-1m, "GBP"));
    }

    [Fact]
    public void Constructor_SucceedsForZeroAmount_BoundaryCase()
    {
        // Zero is NOT negative — proves the guard isn't accidentally too strict
        // (e.g. someone writing <= 0 instead of < 0 in a hand-rolled check).
        var money = new Money(0m, "GBP");
        Assert.Equal(0m, money.Amount);
    }

    [Fact]
    public void Constructor_SucceedsForPositiveAmount()
    {
        var money = new Money(9.99m, "GBP");
        Assert.Equal(9.99m, money.Amount);
    }
}`,
    },
    {
      label: 'Testing the Equals/GetHashCode contract explicitly',
      language: 'csharp',
      code: `public record Money(decimal Amount, string Currency);

public class MoneyEqualityContractTests
{
    [Fact]
    public void EqualRecords_HaveEqualHashCodes()
    {
        var a = new Money(10.00m, "GBP");
        var b = new Money(10.00m, "GBP");

        Assert.Equal(a, b);                          // value equality holds
        Assert.Equal(a.GetHashCode(), b.GetHashCode()); // REQUIRED by the equality contract
    }

    [Fact]
    public void WithDerivedCopy_IsEqualToFreshInstanceWithSameValues()
    {
        var original = new Money(10.00m, "GBP");
        var viaWith  = original with { }; // shallow copy, no properties changed
        var fresh    = new Money(10.00m, "GBP");

        Assert.Equal(fresh, viaWith);
        Assert.Equal(fresh.GetHashCode(), viaWith.GetHashCode());
    }

    [Fact]
    public void DifferentAmount_ProducesUnequalRecordsAndDifferentHashCodes()
    {
        var a = new Money(10.00m, "GBP");
        var b = new Money(20.00m, "GBP");

        Assert.NotEqual(a, b);
        // Not STRICTLY required by the contract (different objects CAN share a
        // hash code — collisions are allowed), but a healthy hash distribution
        // should make this true for simple cases like this.
        Assert.NotEqual(a.GetHashCode(), b.GetHashCode());
    }
}`,
    },
    {
      label: 'Testing with-based methods: value AND non-destructiveness',
      language: 'csharp',
      code: `public record Money(decimal Amount, string Currency)
{
    public Money Add(Money other)
    {
        if (Currency != other.Currency)
            throw new InvalidOperationException($"Cannot add {Currency} and {other.Currency}");
        return this with { Amount = Amount + other.Amount };
    }
}

public class MoneyAddTests
{
    [Fact]
    public void Add_ReturnsCorrectSum_ForSameCurrency()
    {
        var price = new Money(10.00m, "GBP");
        var tax   = new Money(2.00m, "GBP");

        var total = price.Add(tax);

        Assert.Equal(12.00m, total.Amount);
        Assert.Equal("GBP", total.Currency);
    }

    [Fact]
    public void Add_DoesNotMutateTheOriginalInstances()
    {
        // Proves with's non-destructive guarantee actually held — a future
        // refactor that accidentally mutates in place would fail THIS test
        // even if the returned total's own value looked correct.
        var price = new Money(10.00m, "GBP");
        var tax   = new Money(2.00m, "GBP");

        _ = price.Add(tax);

        Assert.Equal(10.00m, price.Amount); // unchanged
        Assert.Equal(2.00m, tax.Amount);    // unchanged
    }

    [Fact]
    public void Add_ThrowsForMismatchedCurrencies()
    {
        var gbp = new Money(10.00m, "GBP");
        var eur = new Money(10.00m, "EUR");

        Assert.Throws<InvalidOperationException>(() => gbp.Add(eur));
    }
}`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'Write a test proving that <code>Money.Convert(toCurrency, rate)</code> (from the main topic\'s challenge) does NOT mutate the original record, mirroring the <code>Add_DoesNotMutateTheOriginalInstances</code> pattern shown above.',
    hint: 'Create a Money instance, call .Convert("EUR", 1.17m) on it, discard or store the result separately, then assert the ORIGINAL instance\'s Amount and Currency are unchanged from before the call.',
    solution: `[Fact]
public void Convert_DoesNotMutateTheOriginalInstance()
{
    var original = new Money(10.00m, "GBP");

    var converted = original.Convert("EUR", 1.17m);

    // The original must be completely untouched — with() creates a NEW record.
    Assert.Equal(10.00m, original.Amount);
    Assert.Equal("GBP", original.Currency);

    // The returned record has the converted values.
    Assert.Equal(11.70m, converted.Amount);
    Assert.Equal("EUR", converted.Currency);
}`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'because the compiler auto-generates Equals, GetHashCode, and the copy constructor for records, there is nothing meaningful left to unit test.',
      reality: 'compact-constructor validation logic, custom methods (like Add/Convert), and currency/business-rule guards are all HAND-WRITTEN code inside the record — they need the same test coverage as any other validation or business logic, the compiler only generates the equality/copying mechanics, not your domain rules.',
    },
    {
      thought: 'testing that two equal records produce the same GetHashCode() is redundant, since the compiler already guarantees the equality contract holds.',
      reality: 'the compiler-generated Equals/GetHashCode DO satisfy the contract by default, but the risk this test protects against is a FUTURE hand-written override of Equals or GetHashCode that breaks the contract — writing the test once means a later regression is caught immediately instead of causing a subtle Dictionary/HashSet bug.',
    },
    {
      thought: 'testing a with-based method only needs to check the returned record\'s values — since with is well-understood to be non-destructive, there is no need to also assert the original is unchanged.',
      reality: 'asserting the ORIGINAL is unchanged is exactly what catches a future refactor that accidentally replaces with-based logic with in-place mutation — a test that only checks the returned value would still pass even if that regression were introduced, since it only ever looks at the new record.',
    },
  ];
}
