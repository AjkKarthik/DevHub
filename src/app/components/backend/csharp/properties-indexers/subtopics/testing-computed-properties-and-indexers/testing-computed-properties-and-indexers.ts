import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-testing-computed-properties-and-indexers-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
    TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './testing-computed-properties-and-indexers.html',
  styleUrl: './testing-computed-properties-and-indexers.scss',
})
export class TestingComputedPropertiesAndIndexersSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page\'s own Common Mistake is directly testable — but never tested',
      points: [
        'The main Properties & Indexers page\'s first Common Mistake draws a sharp distinction: <code>=> expr</code> recomputes on every read, while <code>{ get; } = expr</code> is fixed once at construction. This distinction is not just theoretical — it is a directly testable behavioral difference, and getting it backwards in production code (expecting a computed property to be fixed, or vice versa) is exactly the kind of regression a test should pin down permanently.',
      ],
    },
    {
      heading: 'Testing that => genuinely re-reads underlying mutable state',
      points: [
        'A test for an expression-bodied computed property (like the main page\'s <code>Rectangle.Area => Width * Height</code>) should mutate the underlying state AFTER construction and assert the computed property\'s value changes accordingly — this directly proves the property is NOT cached, closing the gap between "I read the theory" and "I verified this specific property actually behaves that way."',
        'This test is only meaningful if the underlying properties (<code>Width</code>, <code>Height</code>) are actually mutable — for a fully immutable type, this distinction would not even be observable, since nothing could change between reads anyway.',
      ],
    },
    {
      heading: 'Testing that { get; } = expr genuinely freezes at construction',
      points: [
        'The inverse test for a get-only auto-property with initializer (like the main page\'s <code>CreatedAt { get; } = DateTime.UtcNow;</code>) is harder to write directly for a TIME-based value, but the PRINCIPLE — "this value does not change after construction, even if the expression that produced it would give a different result if re-evaluated" — is testable by reading the property TWICE with a delay in between and asserting the two reads are IDENTICAL, contrasted with a hypothetical expression-bodied version that would differ between the two reads.',
      ],
    },
    {
      heading: 'Testing indexer boundary behavior — mirroring the main page\'s DataRow challenge exactly',
      points: [
        'The main page\'s <code>DataRow</code> challenge indexer throws <code>KeyNotFoundException</code> for unknown columns and <code>IndexOutOfRangeException</code> for out-of-bounds positional access — both exception TYPES and the exact boundary conditions (one past the last valid index, an empty/unknown column name) deserve explicit test coverage, exactly like any other public API surface with defined failure modes.',
        'Indexer SET-side validation deserves equal test coverage to the GET side — a common oversight is testing that reading an invalid index throws, while never confirming that WRITING to an invalid index also throws (or silently succeeds when it should not) — asymmetric validation between get and set is a real, easy-to-miss bug class specific to indexers with both accessors.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Proving => recomputes — mutate state, assert the value changes',
      language: 'csharp',
      code: `using Xunit;

// The Rectangle from the main topic's Computed & expression-bodied example:
public class Rectangle
{
    public double Width  { get; set; }
    public double Height { get; set; }
    public double Area => Width * Height;
}

public class ComputedPropertyTests
{
    [Fact]
    public void Area_RecomputesAfterMutatingWidth()
    {
        var rect = new Rectangle { Width = 4, Height = 5 };
        Assert.Equal(20, rect.Area);

        // Mutate AFTER construction — if Area were cached, this test
        // would fail against a (hypothetically) incorrectly cached version:
        rect.Width = 10;

        Assert.Equal(50, rect.Area); // proves Area is genuinely
        // recomputed on each read, not fixed at some earlier point —
        // directly testing the main topic's own "=> recalculates on
        // every read" claim, rather than trusting it from prose alone.
    }

    [Fact]
    public void Area_RecomputesAfterMutatingHeight()
    {
        var rect = new Rectangle { Width = 4, Height = 5 };
        rect.Height = 100;
        Assert.Equal(400, rect.Area); // 4 * 100, using the NEW Height
    }
}`,
    },
    {
      label: 'Proving { get; } = expr freezes — two reads must be identical',
      language: 'csharp',
      code: `public class AuditRecord
{
    // Get-only auto-property with initializer — evaluated ONCE, per the
    // main topic's own distinction:
    public DateTime CreatedAt { get; } = DateTime.UtcNow;
}

public class FrozenPropertyTests
{
    [Fact]
    public void CreatedAt_DoesNotChangeBetweenReads_EvenAfterADelay()
    {
        var record = new AuditRecord();

        var firstRead = record.CreatedAt;
        Thread.Sleep(50); // genuine wall-clock delay
        var secondRead = record.CreatedAt;

        // If CreatedAt were mistakenly written as "=> DateTime.UtcNow"
        // (expression-bodied, recomputed each read) instead of
        // "{ get; } = DateTime.UtcNow" (fixed at construction), this
        // assertion would FAIL — the two reads would differ by ~50ms:
        Assert.Equal(firstRead, secondRead);
    }
}

// Contrast — a version using => WOULD fail this exact test, proving the
// test genuinely discriminates between the two forms:
public class BrokenAuditRecord
{
    public DateTime CreatedAt => DateTime.UtcNow; // WRONG — recomputes every read
}
// A test identical to the one above, run against BrokenAuditRecord,
// would fail: firstRead and secondRead would differ by ~50ms, since
// each access to "=>" genuinely calls DateTime.UtcNow again.`,
    },
    {
      label: 'Indexer boundary testing — mirroring the main topic\'s DataRow exactly',
      language: 'csharp',
      code: `public class DataRowIndexerTests
{
    private static DataRow MakeRow() =>
        new() { Columns = ["Id", "Name", "Email"] };

    [Fact]
    public void StringIndexer_UnknownColumn_ThrowsKeyNotFoundException()
    {
        var row = MakeRow();
        Assert.Throws<KeyNotFoundException>(() => row["Phone"]);
    }

    [Fact]
    public void StringIndexer_IsCaseInsensitive()
    {
        var row = MakeRow();
        row["Name"] = "Alice";
        Assert.Equal("Alice", row["name"]);  // lowercase — should still match
        Assert.Equal("Alice", row["NAME"]);  // uppercase — should still match
    }

    [Theory]
    [InlineData(-1)]  // below range
    [InlineData(3)]   // exactly one past the last valid index (0, 1, 2)
    [InlineData(100)] // far out of range
    public void IntIndexer_OutOfRange_ThrowsIndexOutOfRangeException(int badIndex)
    {
        var row = MakeRow();
        Assert.Throws<IndexOutOfRangeException>(() => row[badIndex]);
    }

    [Fact]
    public void IntIndexer_LastValidIndex_DoesNotThrow()
    {
        var row = MakeRow();
        row[2] = "test@example.com"; // index 2 is the LAST valid column (Email)
        Assert.Equal("test@example.com", row[2]); // proves the boundary
        // itself (not one past it) is genuinely accepted — pinning down
        // the EXACT valid range from both sides, not just "some large
        // index throws."
    }

    [Fact]
    public void StringIndexer_Set_UnknownColumn_AlsoThrows()
    {
        // Testing the SET side separately — a common oversight is only
        // testing that reading an invalid key throws, while never
        // confirming WRITING to one does too:
        var row = MakeRow();
        Assert.Throws<KeyNotFoundException>(() => row["Phone"] = "555-1234");
    }
}`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'Write a test proving that <code>DataRow</code>\'s string indexer and int indexer stay in sync — that setting a value via <code>row["Name"] = "Bob"</code> and then reading via <code>row[1]</code> (assuming "Name" is column index 1) returns the same value "Bob".',
    hint: 'This tests the RELATIONSHIP between the two indexers, not either one in isolation — the DataRow solution\'s int indexer internally delegates to the string indexer via Columns[index], so a write through one indexer should be visible through the other. Construct the row, set via one indexer, and assert via the other.',
    solution: `[Fact]
public void StringAndIntIndexers_StayInSync()
{
    var row = new DataRow { Columns = ["Id", "Name", "Email"] };

    // Set via the STRING indexer:
    row["Name"] = "Bob";

    // Read via the INT indexer — "Name" is at index 1:
    Assert.Equal("Bob", row[1]);

    // And the reverse direction — set via INT, read via STRING:
    row[2] = "bob@example.com";
    Assert.Equal("bob@example.com", row["Email"]);

    // This test specifically proves the two indexers share the SAME
    // underlying storage rather than accidentally maintaining separate,
    // driftable copies — exactly the kind of consistency bug that could
    // slip in in a naive implementation with two independent dictionaries.
}`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'the difference between => expr and { get; } = expr is a purely theoretical distinction that does not need its own dedicated test, since both "just return a value."',
      reality: 'the two forms have genuinely different runtime behavior — mutating underlying state after construction changes what => expr returns but not { get; } = expr — and this difference is directly testable by mutating state (or waiting) between two reads and asserting whether the value changed.',
    },
    {
      thought: 'testing that an indexer\'s GET accessor throws for invalid input is sufficient — the SET accessor likely behaves the same way.',
      reality: 'get and set accessors on an indexer can have asymmetric validation, and a common oversight is testing only the get side — the set side deserves its own explicit test confirming it also rejects invalid keys/indices rather than silently accepting or corrupting state.',
    },
    {
      thought: 'testing "a large out-of-range index throws" is sufficient boundary coverage for an indexer.',
      reality: 'a thorough boundary test also confirms the LAST VALID index does NOT throw — pinning down the exact valid range from both sides catches an off-by-one error that a single "large number throws" test would miss entirely.',
    },
  ];
}
