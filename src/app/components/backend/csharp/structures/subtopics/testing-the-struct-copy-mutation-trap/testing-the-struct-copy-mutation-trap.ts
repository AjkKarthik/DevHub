import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-testing-the-struct-copy-mutation-trap-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
    TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './testing-the-struct-copy-mutation-trap.html',
  styleUrl: './testing-the-struct-copy-mutation-trap.scss',
})
export class TestingTheStructCopyMutationTrapSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page\'s own Common Mistake is directly testable — never regression-tested',
      points: [
        'The main Structures page\'s first Common Mistake shows <code>canvas.Origin.X = 10;</code> silently failing to update the stored <code>Point</code>, because <code>Origin</code>\'s getter returns a COPY. This is demonstrated once via console output — never turned into a test that would catch the exact bug (or a regression back into it) automatically.',
      ],
    },
    {
      heading: 'A test must assert on the STORED value, not the returned copy',
      points: [
        'A weak test that only checks the temporary copy\'s value (<code>var p = canvas.Origin; p.X = 10; Assert.Equal(10, p.X);</code>) proves NOTHING about the actual bug — of course the LOCAL copy has the value you just assigned to it. The test must re-READ the property AFTERWARD and assert on THAT — proving whether the mutation actually reached the stored struct or evaporated with the temporary copy.',
      ],
    },
    {
      heading: 'Testing the FIX equally matters — proving the with-expression / full-replacement actually works',
      points: [
        'Beyond proving the BUG exists (useful mainly as a teaching/regression-documentation test), a genuinely useful test suite should confirm the main page\'s own recommended FIX — <code>canvas.Origin = canvas.Origin with { X = 10 };</code> — actually updates the stored value correctly, since this is the pattern production code should rely on going forward.',
      ],
    },
    {
      heading: 'This generalizes to ANY struct-returning property or indexer, not just simple field access',
      points: [
        'The exact same copy-semantics trap applies to a struct returned from a <code>Dictionary&lt;TKey, TStruct&gt;</code> indexer, a LINQ projection, or any method returning a struct BY VALUE — the underlying rule is always the same: any struct value obtained through a GETTER (property, indexer, or method) is a temporary copy, and mutating that copy never reaches whatever storage it originally came from. A single, well-named test proving this for one representative case (a class property) documents the general rule for the whole codebase.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'A weak test that proves nothing about the actual bug',
      language: 'csharp',
      code: `using Xunit;

public struct Point
{
    public int X;
    public int Y;
    public Point(int x, int y) { X = x; Y = y; }
}

public class Canvas
{
    public Point Origin { get; set; } = new Point(0, 0);
}

public class WeakTests
{
    [Fact]
    public void MutatingTheReturnedCopy_DoesUpdateTheLocalVariable()
    {
        var canvas = new Canvas();
        var p = canvas.Origin; // a COPY is returned here
        p.X = 10;

        // This PASSES — but proves NOTHING about the actual bug. Of
        // course the local variable "p" has X=10 — we just assigned it
        // directly. This test never even LOOKS at canvas.Origin again:
        Assert.Equal(10, p.X);
    }
}`,
    },
    {
      label: 'The test that actually exposes the copy-semantics bug',
      language: 'csharp',
      code: `public class StructCopyMutationTests
{
    [Fact]
    public void MutatingReturnedStructCopy_DoesNotAffectStoredValue()
    {
        var canvas = new Canvas();

        var p = canvas.Origin; // copy #1
        p.X = 10;              // mutates ONLY the copy

        // The critical assertion — re-READ the property and check its
        // value NOW, proving the mutation never reached the storage:
        Assert.Equal(0, canvas.Origin.X);   // still 0 — mutation was lost
        Assert.Equal(10, p.X);              // the LOCAL copy did change

        // This test genuinely PROVES the bug from the main topic's own
        // Common Mistake — asserting on canvas.Origin AGAIN (not the
        // local variable p) is what makes this test meaningful.
    }
}`,
    },
    {
      label: 'Testing the recommended fix — full replacement genuinely works',
      language: 'csharp',
      code: `public record struct Point2(int X, int Y);  // record struct for 'with' support

public class Canvas2
{
    public Point2 Origin { get; set; } = new Point2(0, 0);
}

public class StructCopyFixTests
{
    [Fact]
    public void ReplacingWithModifiedCopy_ActuallyUpdatesTheStoredValue()
    {
        var canvas = new Canvas2();

        // The main topic's own recommended fix — full replacement via
        // "with", assigned BACK to the property:
        canvas.Origin = canvas.Origin with { X = 10 };

        // NOW this genuinely succeeds — because we replaced the WHOLE
        // stored value, rather than mutating a temporary copy of it:
        Assert.Equal(10, canvas.Origin.X);
        Assert.Equal(0, canvas.Origin.Y); // untouched field preserved correctly
    }

    [Fact]
    public void DirectFieldMutationOnReturnedCopy_StillFails_EvenWithRecordStruct()
    {
        // Proving the trap ALSO applies to record structs — 'with'
        // support does not change the underlying copy-semantics rule:
        var canvas = new Canvas2();
        var p = canvas.Origin;
        p.X = 99; // mutates only the local copy, same as before

        Assert.Equal(0, canvas.Origin.X); // still unaffected
    }
}`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'Write a test proving the SAME copy-semantics trap applies to a <code>Dictionary&lt;string, Point&gt;</code> — that mutating a Point retrieved via the dictionary indexer does not affect the value actually stored in the dictionary.',
    hint: 'Dictionary<TKey, TValue>\'s indexer getter is a METHOD call under the hood (calling TryGetValue internally) — it returns a value, not a reference into the dictionary\'s internal storage, so the same "getter returns a copy" rule that applies to class properties applies here too. Retrieve via the indexer, mutate the retrieved struct, then re-read via the indexer again and assert.',
    solution: `[Fact]
public void DictionaryIndexer_MutatingRetrievedStruct_DoesNotAffectStoredValue()
{
    var points = new Dictionary<string, Point>
    {
        ["origin"] = new Point(0, 0)
    };

    var retrieved = points["origin"]; // COPY returned by the indexer getter
    retrieved.X = 10;                  // mutates only the local copy

    // Re-read via the indexer AGAIN — proving the dictionary's actual
    // stored value is unaffected, exactly the same trap as the class
    // property case, just with a different container type:
    Assert.Equal(0, points["origin"].X);   // unaffected — still 0
    Assert.Equal(10, retrieved.X);          // only the local copy changed

    // The fix is the same shape as the class-property case — replace
    // the WHOLE stored value rather than mutating a retrieved copy:
    points["origin"] = retrieved; // or: points["origin"] = new Point(10, 0);
    Assert.Equal(10, points["origin"].X); // NOW it's actually updated`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'a test that assigns a new value to a locally retrieved struct copy and then asserts on that SAME local variable proves the underlying storage was correctly mutated.',
      reality: 'such a test only proves the local variable holds the value you just assigned to it — it says nothing about whether the mutation reached the original storage. A meaningful test must re-read the property/indexer/field AFTERWARD and assert on THAT fresh read.',
    },
    {
      thought: 'record struct\'s "with" expression support means the struct-copy mutation trap no longer applies — you can just mutate a retrieved record struct directly.',
      reality: 'the copy-semantics trap applies identically to record structs — "with" provides a clean way to create a MODIFIED COPY to assign back, but directly mutating a field on a retrieved record struct copy is silently lost exactly like an ordinary struct.',
    },
    {
      thought: 'the struct-copy mutation trap is specific to class properties (like the main topic\'s Canvas.Origin example) and does not apply to other container types like dictionaries or LINQ results.',
      reality: 'the trap applies to ANY struct obtained through a getter — a property, an indexer (including Dictionary<TKey,TValue>), or a method returning a struct by value — the underlying rule is always the same: a returned struct value is a temporary copy, regardless of what kind of container or method produced it.',
    },
  ];
}
