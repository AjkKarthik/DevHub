import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-testing-the-equals-gethashcode-contract-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
    TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './testing-the-equals-gethashcode-contract.html',
  styleUrl: './testing-the-equals-gethashcode-contract.scss',
})
export class TestingTheEqualsGetHashCodeContractSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page states the full contract — never tests it as ONE unit',
      points: [
        'The main System.Object page lists the FULL equality contract explicitly: reflexive, symmetric, transitive, consistent, PLUS the separate hash-code consistency rule. Every code example on the page tests individual assertions (<code>a.Equals(b)</code>, <code>a.GetHashCode() == b.GetHashCode()</code>) in isolation — never as a single, reusable, GENERIC verification that checks the ENTIRE contract for ANY type at once.',
      ],
    },
    {
      heading: 'A generic contract verifier catches violations a few scattered asserts would miss',
      points: [
        'A reusable test helper — <code>AssertEqualityContract(equal1, equal2, unequal)</code> — taking two instances that SHOULD be equal and one that should NOT, can mechanically check reflexivity, symmetry, hash-consistency, and the equal/unequal split all at once, for ANY type implementing <code>IEquatable&lt;T&gt;</code>, without writing bespoke assertions per type.',
        'This catches a specific class of bug that piecemeal testing often misses: SYMMETRY violations, where <code>a.Equals(b)</code> and <code>b.Equals(a)</code> disagree — a genuinely subtle bug that can arise when a type\'s <code>Equals</code> override has asymmetric null-handling or type-checking logic (e.g. checking <code>obj is DerivedType</code> in a way that behaves differently depending on which side is the "this" instance).',
      ],
    },
    {
      heading: 'Transitivity is the hardest contract rule to violate accidentally — but the easiest to verify generically',
      points: [
        'Transitivity violations (<code>x == y</code> and <code>y == z</code> but <code>x != z</code>) are RARE in practice for simple value-based equality, but genuinely possible with poorly designed "fuzzy" equality (e.g. comparing floating-point values within a tolerance, where <code>1.0 ≈ 1.05</code> and <code>1.05 ≈ 1.1</code> but <code>1.0 ≉ 1.1</code>) — a generic verifier taking THREE mutually-equal instances can directly test this specific failure mode, which individual pairwise tests would never surface.',
      ],
    },
    {
      heading: 'Reusability makes this genuinely cheap to apply everywhere',
      points: [
        'Because the verifier is entirely GENERIC (<code>where T : IEquatable&lt;T&gt;</code>), the SAME test helper can validate the main page\'s own <code>Money</code> and <code>Product</code> examples, plus every future type in the codebase that implements value equality — a single, well-written helper amortizes across the entire codebase rather than being rewritten per type.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'A generic, reusable equality contract verifier',
      language: 'csharp',
      code: `using Xunit;

public static class EqualityContractAssertions
{
    // Verifies reflexivity, symmetry, and hash-consistency for a type
    // implementing IEquatable<T> — reusable across ANY such type:
    public static void AssertEqualityContract<T>(T equal1, T equal2, T unequal)
        where T : IEquatable<T>
    {
        // Reflexive: x.Equals(x) is always true
        Assert.True(equal1.Equals(equal1), "Equals must be reflexive");

        // Symmetric: x.Equals(y) <=> y.Equals(x)
        Assert.Equal(equal1.Equals(equal2), equal2.Equals(equal1));
        Assert.True(equal1.Equals(equal2), "equal1 and equal2 should be equal");

        // The "unequal" instance genuinely should not match either:
        Assert.False(equal1.Equals(unequal), "equal1 and unequal should differ");
        Assert.Equal(equal1.Equals(unequal), unequal.Equals(equal1)); // symmetric here too

        // Hash-consistency: equal objects MUST share a hash code
        // (the main topic's own "golden rule"):
        Assert.Equal(equal1.GetHashCode(), equal2.GetHashCode());
    }
}

// Applying it to the main topic's own Money type:
public class MoneyContractTests
{
    [Fact]
    public void Money_SatisfiesEqualityContract()
    {
        var a = new Money(10m, "GBP");
        var b = new Money(10m, "GBP"); // equal to a
        var c = new Money(20m, "GBP"); // different

        EqualityContractAssertions.AssertEqualityContract(a, b, c);
        // ONE reusable call replaces several individually hand-written
        // assertions, and generalizes to any other IEquatable<T> type.
    }
}`,
    },
    {
      label: 'Testing transitivity specifically — a targeted 3-instance check',
      language: 'csharp',
      code: `public static class EqualityContractAssertions
{
    // Transitivity needs its OWN dedicated check — reflexivity/symmetry
    // alone cannot expose it, since it requires THREE mutually-related
    // instances, not just a pair:
    public static void AssertTransitivity<T>(T x, T y, T z) where T : IEquatable<T>
    {
        if (x.Equals(y) && y.Equals(z))
        {
            Assert.True(x.Equals(z),
                "Transitivity violated: x==y and y==z, but x!=z");
        }
    }
}

// A DELIBERATELY BROKEN "fuzzy" equality type, demonstrating exactly
// the kind of bug this check catches:
public readonly struct FuzzyValue : IEquatable<FuzzyValue>
{
    public double Value { get; }
    public FuzzyValue(double value) => Value = value;

    // BROKEN: "close enough" equality is NOT transitive —
    // 1.0 ≈ 1.05 and 1.05 ≈ 1.1, but 1.0 is NOT ≈ 1.1:
    public bool Equals(FuzzyValue other) => Math.Abs(Value - other.Value) < 0.06;
    public override int GetHashCode() => 0; // deliberately constant — illustrative only
}

public class TransitivityViolationTests
{
    [Fact]
    public void FuzzyValue_ViolatesTransitivity()
    {
        var x = new FuzzyValue(1.0);
        var y = new FuzzyValue(1.05);
        var z = new FuzzyValue(1.1);

        Assert.True(x.Equals(y));   // "close enough" — true
        Assert.True(y.Equals(z));   // "close enough" — true
        Assert.False(x.Equals(z));  // NOT close enough — the contract IS violated!

        // This proves the exact failure mode the theory describes —
        // "fuzzy" tolerance-based equality is a classic way to
        // accidentally break transitivity, something individual
        // pairwise assertions would never catch.
    }
}`,
    },
    {
      label: 'Catching a symmetry violation — asymmetric type-checking logic',
      language: 'csharp',
      code: `// A DELIBERATELY BROKEN type with asymmetric Equals logic:
public class Money2
{
    public decimal Amount { get; }
    public Money2(decimal amount) => Amount = amount;

    public override bool Equals(object? obj)
    {
        // BROKEN: only handles being compared to a DecimalWrapper,
        // never checks if "this" is being compared FROM one —
        // creates a genuine asymmetry:
        if (obj is DecimalWrapper w) return Amount == w.Value;
        if (obj is Money2 m) return Amount == m.Amount;
        return false;
    }

    public override int GetHashCode() => Amount.GetHashCode();
}

public class DecimalWrapper
{
    public decimal Value { get; }
    public DecimalWrapper(decimal value) => Value = value;
    // No Equals override at all — uses default reference equality
}

public class SymmetryViolationTests
{
    [Fact]
    public void Money2_And_DecimalWrapper_ViolateSymmetry()
    {
        var money = new Money2(10m);
        var wrapper = new DecimalWrapper(10m);

        bool moneyEqualsWrapper = money.Equals(wrapper); // true —
                                                            // Money2's Equals
                                                            // special-cases this
        bool wrapperEqualsMoney = wrapper.Equals(money);  // false —
                                                            // DecimalWrapper uses
                                                            // default reference equality

        // Symmetry IS violated — exactly the bug class the generic
        // verifier's symmetry check (Assert.Equal(a.Equals(b), b.Equals(a)))
        // is specifically designed to catch:
        Assert.NotEqual(moneyEqualsWrapper, wrapperEqualsMoney);
    }
}`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'Extend <code>AssertEqualityContract</code> to also verify CONSISTENCY — that calling <code>Equals</code> and <code>GetHashCode</code> repeatedly on unchanged objects always returns the same result. Write the additional assertion(s).',
    hint: 'Consistency means calling the same comparison or hash computation MULTIPLE TIMES on objects that have not changed must always produce the identical result — this is directly testable by simply calling the same method twice and asserting the two results match, which is trivially true for a correctly implemented immutable type but would catch a bug where Equals or GetHashCode accidentally depends on some non-deterministic or externally mutable state.',
    solution: `public static class EqualityContractAssertions
{
    public static void AssertEqualityContract<T>(T equal1, T equal2, T unequal)
        where T : IEquatable<T>
    {
        // ... existing reflexive/symmetric/hash-consistency checks ...

        // Consistency: repeated calls on unchanged objects must always
        // agree with themselves — catches bugs where Equals or
        // GetHashCode accidentally depend on non-deterministic state
        // (e.g. a DateTime.Now field, a random seed, or externally
        // mutable shared state read during comparison):
        bool firstCall = equal1.Equals(equal2);
        bool secondCall = equal1.Equals(equal2);
        Assert.Equal(firstCall, secondCall);

        int hash1 = equal1.GetHashCode();
        int hash2 = equal1.GetHashCode(); // SAME instance, called twice
        Assert.Equal(hash1, hash2);

        // A genuinely broken example this would catch:
        // public override int GetHashCode() => DateTime.Now.Millisecond;
        // — this would produce a DIFFERENT hash on almost every call,
        // failing this consistency check immediately, even though a
        // naive single-call test would never notice the problem.
    }
}`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'testing that a.Equals(b) returns true is sufficient to verify a type\'s equality implementation is correct.',
      reality: 'the full equality contract requires reflexivity, symmetry, transitivity, AND consistency, plus hash-code consistency — a single "does this pair compare equal" assertion cannot catch symmetry violations (a.Equals(b) != b.Equals(a)) or transitivity violations, both of which require testing multiple related instances together.',
    },
    {
      thought: 'transitivity violations in equality logic are purely theoretical and never actually happen in real code.',
      reality: 'transitivity violations are a real, if less common, bug class — most frequently introduced by "fuzzy" or tolerance-based equality comparisons (e.g. floating-point values considered equal within a threshold), where being "close enough" to two different values does not guarantee those two values are close enough to each other.',
    },
    {
      thought: 'a generic, reusable equality contract test helper needs to be rewritten for each type that implements custom equality.',
      reality: 'a helper generic over IEquatable<T> can validate ANY type implementing that interface with the same reusable method call, amortizing the cost of writing thorough equality tests across the entire codebase rather than duplicating the same assertions per type.',
    },
  ];
}
