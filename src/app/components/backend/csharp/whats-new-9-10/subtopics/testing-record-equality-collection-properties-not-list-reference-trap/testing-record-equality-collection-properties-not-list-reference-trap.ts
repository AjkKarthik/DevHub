import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-testing-record-equality-collection-properties-not-list-reference-trap-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
    TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './testing-record-equality-collection-properties-not-list-reference-trap.html',
  styleUrl: './testing-record-equality-collection-properties-not-list-reference-trap.scss',
})
export class TestingRecordEqualityCollectionPropertiesNotListReferenceTrapSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page\'s own Common Mistakes section shows the List&lt;T&gt; equality trap — this subtopic covers how to write a TEST that actually proves your record equality choice is correct',
      points: [
        'The main C# 9 &amp; 10 page\'s "Expecting records in collections to be equal when their contained lists differ" mistake shows that <code>record Order(int Id, List&lt;string&gt; Items)</code> makes two orders with equal-content-but-different-instance lists compare as NOT equal, and recommends <code>ImmutableArray&lt;T&gt;</code> as the fix. The natural next question: how do you write a TEST that actually verifies this fix is correct, rather than just eyeballing the code and hoping?',
      ],
    },
    {
      heading: 'A genuinely useful test constructs the SAME record TWICE, from SEPARATELY-BUILT collections, and asserts equality — the naive version (reusing the same list instance) never catches the bug',
      points: [
        'A test that builds ONE list and passes the SAME reference into both record instances (<code>new Order(1, sharedList)</code> twice) will ALWAYS report equal records, even with the buggy <code>List&lt;T&gt;</code> version — because both records end up holding the identical reference, and reference equality trivially succeeds. This completely fails to catch the actual bug the main page describes, which only manifests when the two lists are genuinely SEPARATE instances with equal content.',
        'The correct test constructs the collection independently for each record instance — e.g. <code>new Order(1, new List&lt;string&gt; { "Widget" })</code> and <code>new Order(1, new List&lt;string&gt; { "Widget" })</code> as two SEPARATE <code>List&lt;string&gt;</code> objects — this is the ONLY way to actually exercise the reference-vs-structural-equality distinction the main page\'s mistake is about.',
      ],
    },
    {
      heading: 'Testing the FIX (ImmutableArray&lt;T&gt;) alongside a REGRESSION test proving the original List&lt;T&gt; behavior is genuinely what you\'d expect it to be',
      points: [
        'A thorough test suite includes BOTH a test proving <code>ImmutableArray&lt;T&gt;</code>-based records compare equal with separately-constructed-but-equal-content arrays, AND a documenting regression test proving the <code>List&lt;T&gt;</code>-based version does NOT — the second test is not "testing a bug" in a bad sense, it is DOCUMENTING a genuine .NET behavior (List&lt;T&gt; has no structural Equals override) that a future reader might otherwise assume is a bug and "fix," silently changing behavior other code may depend on.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'The naive, bug-hiding test — reusing the SAME list instance',
      language: 'csharp',
      code: `using Xunit;

public record Order(int Id, List<string> Items);

public class OrderEqualityTests_Wrong
{
    [Fact]
    public void Orders_WithSameItems_AreEqual()
    {
        // WRONG TEST: both records share the EXACT SAME List<string>
        // reference — this test would PASS even if List<T> equality
        // were somehow broken in a completely different way, because
        // it never actually exercises "two DIFFERENT list instances
        // with the same content":
        var sharedItems = new List<string> { "Widget", "Gadget" };
        var order1 = new Order(1, sharedItems);
        var order2 = new Order(1, sharedItems);   // SAME reference!

        Assert.Equal(order1, order2);  // PASSES — but proves almost
                                        // nothing about the actual
                                        // List<T> reference-equality
                                        // trap the main page describes
    }
}`,
    },
    {
      label: 'The real test — SEPARATELY constructed collections with equal content',
      language: 'csharp',
      code: `public class OrderEqualityTests_Correct
{
    [Fact]
    public void Orders_WithSeparatelyConstructedEqualLists_AreNotEqual_DocumentingTheGotcha()
    {
        // Two GENUINELY SEPARATE List<string> instances, same content:
        var order1 = new Order(1, new List<string> { "Widget", "Gadget" });
        var order2 = new Order(1, new List<string> { "Widget", "Gadget" });

        // This is the ACTUAL behavior the main page's mistake describes
        // — and this test DOCUMENTS it deliberately, so a future reader
        // who "fixes" this by changing List<T> assumptions doesn't
        // silently break something else depending on the current
        // (reference-equality) behavior:
        Assert.NotEqual(order1, order2);  // List<T> uses reference
                                           // equality — confirmed
    }

    [Fact]
    public void Orders_WithImmutableArray_SeparatelyConstructedEqualContent_AreEqual()
    {
        // The ACTUAL FIX from the main page — ImmutableArray<T> has
        // genuine structural equality:
        var order1 = new OrderFixed(1, ["Widget", "Gadget"]);
        var order2 = new OrderFixed(1, ["Widget", "Gadget"]);

        // Now the SAME "two separately built, equal-content collections"
        // scenario correctly reports equal — this is the test that
        // actually PROVES the fix works, not just that the code compiles:
        Assert.Equal(order1, order2);
    }
}

public record OrderFixed(int Id, System.Collections.Immutable.ImmutableArray<string> Items);`,
    },
    {
      label: 'A reusable custom equality comparer approach — for records that must keep List<T>',
      language: 'csharp',
      code: `// Sometimes ImmutableArray<T> genuinely isn't practical (e.g. an
// existing API surface that must keep exposing List<T>). A custom
// IEqualityComparer, tested explicitly, is the alternative — and it
// is JUST AS testable with the same "separately constructed" pattern:
public class OrderItemsComparer : IEqualityComparer<Order>
{
    public bool Equals(Order? x, Order? y)
    {
        if (x is null || y is null) return x is null && y is null;
        return x.Id == y.Id && x.Items.SequenceEqual(y.Items);
    }

    public int GetHashCode(Order obj) =>
        HashCode.Combine(obj.Id, obj.Items.Count);
}

public class OrderCustomComparerTests
{
    [Fact]
    public void CustomComparer_SeparatelyConstructedEqualLists_AreEqual()
    {
        var comparer = new OrderItemsComparer();
        var order1 = new Order(1, new List<string> { "Widget", "Gadget" });
        var order2 = new Order(1, new List<string> { "Widget", "Gadget" });

        // The DEFAULT record equality (order1 == order2) is still FALSE
        // here — this test specifically verifies the CUSTOM comparer,
        // which is a genuinely different, explicit contract from the
        // record's own auto-generated Equals:
        Assert.False(order1 == order2);          // default record equality
        Assert.True(comparer.Equals(order1, order2));  // custom comparer
    }
}`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A teammate writes a test asserting <code>order1.Equals(order2)</code> where both <code>order1</code> and <code>order2</code> are created via <code>var order2 = order1;</code> (simple variable assignment, not a new construction). Explain why this test provides ZERO evidence about record equality behavior at all, regardless of whether List&lt;T&gt; or ImmutableArray&lt;T&gt; is used.',
    hint: 'Consider what "var order2 = order1;" actually does for a reference type like a record class — does it create a second, independent object, or does it just create a second variable pointing at the exact same object already in memory?',
    solution: `public record Order(int Id, List<string> Items);

[Fact]
public void MeaninglessTest()
{
    var order1 = new Order(1, new List<string> { "Widget" });
    var order2 = order1;   // NOT a new object — order2 IS order1

    Assert.True(order1.Equals(order2));   // ALWAYS passes, trivially
    Assert.True(ReferenceEquals(order1, order2));  // proves it — SAME object
}

// WHY THIS PROVES NOTHING: "var order2 = order1;" for a record CLASS
// (a reference type) does NOT create a second, independent Order
// instance — it copies the REFERENCE, so order1 and order2 are two
// variable NAMES pointing at the EXACT SAME underlying object in
// memory. Comparing an object to ITSELF via Equals is trivially true
// for ANY type — record, plain class, struct, anything — regardless
// of how its Equals method is implemented, whether it uses List<T>,
// ImmutableArray<T>, or nothing at all.
//
// This test would pass IDENTICALLY whether the record's equality
// implementation were completely broken, entirely absent, or perfectly
// correct — it provides ZERO signal about the ACTUAL equality
// implementation's correctness, because it never constructs two
// genuinely SEPARATE objects to compare.
//
// The only tests that actually exercise record equality meaningfully
// are ones (like the earlier examples in this subtopic) that build
// TWO INDEPENDENT instances — via separate "new Order(...)" calls,
// ideally with separately-constructed nested collections too — and
// then compare THOSE. Testing "does an object equal itself" is not
// testing equality logic at all; it is testing that reference
// equality trivially holds, which is true of every .NET object by
// definition and requires no test to confirm.`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'a test that constructs one record instance, assigns it to a second variable, and asserts they are equal proves the record\'s equality implementation is correct.',
      reality: 'simple variable assignment for a reference type copies the reference, not the object — comparing an object to itself via Equals is trivially true regardless of how (or whether) equality is actually implemented, so this test provides zero signal.',
    },
    {
      thought: 'testing record equality with a List&lt;T&gt; property just requires constructing two records with "the same list" and asserting they are equal.',
      reality: 'if both records are built from the SAME List&lt;T&gt; reference, the test never exercises the actual reference-vs-structural-equality distinction — the two collections must be SEPARATELY constructed, with equal content, to genuinely test this.',
    },
    {
      thought: 'a test documenting that List&lt;T&gt;-based record equality returns false for separately-constructed-but-equal-content lists is "testing a bug" and should be removed once ImmutableArray&lt;T&gt; is adopted elsewhere.',
      reality: 'that test documents genuine, current .NET behavior (List&lt;T&gt; has no structural equality) — keeping it as a deliberate regression test prevents a future reader from assuming it is broken and silently "fixing" behavior that other code may still depend on.',
    },
  ];
}
