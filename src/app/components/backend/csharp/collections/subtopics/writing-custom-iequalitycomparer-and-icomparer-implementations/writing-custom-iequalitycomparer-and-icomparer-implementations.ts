import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-writing-custom-iequalitycomparer-and-icomparer-implementations-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
    TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './writing-custom-iequalitycomparer-and-icomparer-implementations.html',
  styleUrl: './writing-custom-iequalitycomparer-and-icomparer-implementations.scss',
})
export class WritingCustomIequalitycomparerAndIcomparerImplementationsSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main topic uses a built-in comparer — this page writes a custom one',
      points: [
        'The main Collections page uses <code>StringComparer.OrdinalIgnoreCase</code> to make dictionary keys case-insensitive — a ready-made, BCL-provided comparer. It never shows how to write your OWN <code>IEqualityComparer&lt;T&gt;</code> or <code>IComparer&lt;T&gt;</code> for a CUSTOM type, which is exactly what you need the moment your dictionary key or sortable value is a domain type the BCL knows nothing about.',
      ],
    },
    {
      heading: 'IEqualityComparer<T> — external equality, without touching the type itself',
      points: [
        'Implementing <code>IEqualityComparer&lt;T&gt;</code> lets you define EQUALITY RULES from OUTSIDE a type — useful when you cannot (or should not) override <code>Equals</code>/<code>GetHashCode</code> on the type itself, or when you need MULTIPLE DIFFERENT equality definitions for the same type in different contexts (e.g., comparing <code>Product</code> by SKU in one dictionary but by full details in another).',
        'The contract mirrors the main topic\'s Dictionary-internals theory point exactly: <code>Equals(x, y)</code> must agree with <code>GetHashCode(obj)</code> — if <code>Equals(a, b)</code> returns <code>true</code>, then <code>GetHashCode(a) == GetHashCode(b)</code> MUST also hold, or the dictionary silently fails to find entries (the exact "wrong bucket" bug the main topic\'s Common Mistakes section describes for mutable keys, but now self-inflicted through a badly-written comparer instead of key mutation).',
      ],
    },
    {
      heading: 'A concrete custom equality comparer — case-insensitive, culture-aware comparison of a domain type',
      points: [
        'For a <code>ProductCode</code> type where two codes should be considered equal ignoring case AND leading/trailing whitespace, write: <code>public bool Equals(ProductCode? x, ProductCode? y) =&gt; string.Equals(x?.Value.Trim(), y?.Value.Trim(), StringComparison.OrdinalIgnoreCase);</code> paired with a <code>GetHashCode</code> that hashes the SAME normalized form: <code>obj.Value.Trim().ToUpperInvariant().GetHashCode()</code> — using <code>OrdinalIgnoreCase</code> comparison in <code>Equals</code> but a DIFFERENT normalization in <code>GetHashCode</code> is precisely the kind of subtle mismatch that breaks the contract while still compiling and running without any obvious error.',
        'Pass the custom comparer at collection construction: <code>new Dictionary&lt;ProductCode, decimal&gt;(new ProductCodeComparer())</code> or <code>new HashSet&lt;ProductCode&gt;(new ProductCodeComparer())</code> — every lookup, add, and contains-check then uses your comparer\'s rules instead of the type\'s own (possibly absent, or differently-defined) <code>Equals</code>/<code>GetHashCode</code>.',
      ],
    },
    {
      heading: 'IComparer<T> — custom ORDERING, independent of equality',
      points: [
        '<code>IComparer&lt;T&gt;</code> is a SEPARATE concern from equality — it defines ORDERING (<code>CompareTo</code>-style, returning negative/zero/positive) for use with <code>List&lt;T&gt;.Sort()</code>, <code>SortedDictionary&lt;K,V&gt;</code>, <code>SortedSet&lt;T&gt;</code> (both covered in the main topic\'s "HashSet & Sorted" tab, but only with PRIMITIVE keys) or LINQ\'s <code>OrderBy(keySelector, comparer)</code> overload.',
        'A common real need: sorting version strings ("1.10.0" should sort AFTER "1.9.0" numerically, but a plain string comparison sorts "1.10.0" BEFORE "1.9.0" lexicographically since \'1\' &lt; \'9\'). A custom <code>IComparer&lt;string&gt;</code> that splits on \'.\' and compares each segment as an integer solves this correctly — something no built-in <code>StringComparer</code> variant provides, since it requires domain-specific segment parsing.',
        'You can implement equality and ordering TOGETHER for the same type via separate small classes (or combine both interfaces on one class if they share logic), and pass the ordering comparer specifically to <code>SortedDictionary&lt;TKey, TValue&gt;(comparer)</code> so a dictionary sorted by a domain-specific key order (not just the key\'s own default <code>IComparable</code>, if it even has one) iterates in the order YOU define.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'A custom IEqualityComparer<T> — with the subtle bug it prevents',
      language: 'csharp',
      code: `public class ProductCode
{
    public string Value { get; }
    public ProductCode(string value) => Value = value;
}

// BUGGY comparer — Equals normalizes with Trim + OrdinalIgnoreCase,
// but GetHashCode normalizes DIFFERENTLY (no Trim!). This breaks the
// equality/hash-code contract while still compiling cleanly.
public class BuggyProductCodeComparer : IEqualityComparer<ProductCode>
{
    public bool Equals(ProductCode? x, ProductCode? y)
        => string.Equals(x?.Value.Trim(), y?.Value.Trim(), StringComparison.OrdinalIgnoreCase);

    public int GetHashCode(ProductCode obj)
        => obj.Value.GetHashCode(); // MISSING .Trim() — inconsistent with Equals!
}

// CORRECT comparer — both methods normalize the SAME way.
public class ProductCodeComparer : IEqualityComparer<ProductCode>
{
    public bool Equals(ProductCode? x, ProductCode? y)
        => string.Equals(x?.Value.Trim(), y?.Value.Trim(), StringComparison.OrdinalIgnoreCase);

    public int GetHashCode(ProductCode obj)
        => obj.Value.Trim().ToUpperInvariant().GetHashCode(); // SAME normalization
}

var dict = new Dictionary<ProductCode, decimal>(new ProductCodeComparer());
dict[new ProductCode("  ABC-123  ")] = 9.99m;

// Found correctly — same normalized value, correct comparer applied
Console.WriteLine(dict.ContainsKey(new ProductCode("abc-123"))); // True

var buggyDict = new Dictionary<ProductCode, decimal>(new BuggyProductCodeComparer());
buggyDict[new ProductCode("  ABC-123  ")] = 9.99m;

// FALSE — Equals would say they match, but GetHashCode puts them in
// DIFFERENT buckets because it forgot to Trim(), so the lookup never
// even reaches the bucket where Equals would have confirmed a match.
Console.WriteLine(buggyDict.ContainsKey(new ProductCode("abc-123"))); // False!`,
    },
    {
      label: 'A custom IComparer<T> — natural version-number ordering',
      language: 'csharp',
      code: `// Plain string comparison sorts "1.10.0" BEFORE "1.9.0" — wrong for versions.
var versions = new List<string> { "1.9.0", "1.10.0", "1.2.0", "2.0.0" };
versions.Sort(); // lexicographic — WRONG order for version numbers
Console.WriteLine(string.Join(", ", versions));
// 1.10.0, 1.2.0, 1.9.0, 2.0.0   <-- "1.10.0" sorted before "1.2.0" and "1.9.0"!

public class VersionComparer : IComparer<string>
{
    public int Compare(string? x, string? y)
    {
        var partsX = (x ?? "").Split('.').Select(int.Parse).ToArray();
        var partsY = (y ?? "").Split('.').Select(int.Parse).ToArray();

        for (int i = 0; i < Math.Max(partsX.Length, partsY.Length); i++)
        {
            int a = i < partsX.Length ? partsX[i] : 0;
            int b = i < partsY.Length ? partsY[i] : 0;
            int cmp = a.CompareTo(b);
            if (cmp != 0) return cmp;
        }
        return 0;
    }
}

var correctlyOrdered = new List<string> { "1.9.0", "1.10.0", "1.2.0", "2.0.0" };
correctlyOrdered.Sort(new VersionComparer());
Console.WriteLine(string.Join(", ", correctlyOrdered));
// 1.2.0, 1.9.0, 1.10.0, 2.0.0   <-- correct numeric ordering per segment`,
    },
    {
      label: 'Combining a custom comparer with SortedDictionary',
      language: 'csharp',
      code: `public class VersionComparer : IComparer<string>
{
    public int Compare(string? x, string? y)
    {
        var partsX = (x ?? "").Split('.').Select(int.Parse).ToArray();
        var partsY = (y ?? "").Split('.').Select(int.Parse).ToArray();
        for (int i = 0; i < Math.Max(partsX.Length, partsY.Length); i++)
        {
            int a = i < partsX.Length ? partsX[i] : 0;
            int b = i < partsY.Length ? partsY[i] : 0;
            int cmp = a.CompareTo(b);
            if (cmp != 0) return cmp;
        }
        return 0;
    }
}

// A SortedDictionary keyed by version string, using the CUSTOM comparer —
// iterates in true numeric version order, not lexicographic order.
var changelog = new SortedDictionary<string, string>(new VersionComparer())
{
    ["1.9.0"]  = "Bug fixes",
    ["1.10.0"] = "New feature X",
    ["1.2.0"]  = "Initial release",
    ["2.0.0"]  = "Major rewrite",
};

foreach (var (version, notes) in changelog)
    Console.WriteLine($"{version}: {notes}");
// 1.2.0: Initial release
// 1.9.0: Bug fixes
// 1.10.0: New feature X
// 2.0.0: Major rewrite`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'Write a custom <code>IEqualityComparer&lt;Point&gt;</code> for a <code>record Point(int X, int Y)</code> that treats two points as equal if they are within a small tolerance distance (e.g. 0.001) of each other — a use case ordinary record value equality (exact match) cannot express.',
    hint: 'Implement Equals by computing the distance between the two points (Math.Sqrt of the squared differences) and comparing it to a tolerance constant. For GetHashCode, since "approximately equal" points might have slightly different raw values, round each coordinate to a fixed precision BEFORE hashing so approximately-equal points are more likely to land in the same bucket (a fundamental trade-off with tolerance-based equality: it can never perfectly satisfy the hash contract for all cases, since equality isn\'t transitive under tolerance).',
    solution: `public record Point(double X, double Y);

public class ApproximatePointComparer : IEqualityComparer<Point>
{
    private const double Tolerance = 0.001;

    public bool Equals(Point? a, Point? b)
    {
        if (a is null || b is null) return a is null && b is null;
        double dx = a.X - b.X, dy = a.Y - b.Y;
        return Math.Sqrt(dx * dx + dy * dy) <= Tolerance;
    }

    public int GetHashCode(Point obj)
    {
        // Round BEFORE hashing so nearby points are more likely to share
        // a bucket. This is inherently imperfect — tolerance-based equality
        // is not transitive (A~B and B~C doesn't guarantee A~C), so the
        // hash contract can only be approximately satisfied, not guaranteed.
        double roundedX = Math.Round(obj.X, 2);
        double roundedY = Math.Round(obj.Y, 2);
        return HashCode.Combine(roundedX, roundedY);
    }
}

var set = new HashSet<Point>(new ApproximatePointComparer());
set.Add(new Point(1.0, 1.0));
Console.WriteLine(set.Contains(new Point(1.0004, 0.9996))); // True — within tolerance`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'a custom <code>IEqualityComparer&lt;T&gt;</code> only needs to implement <code>Equals</code> correctly — <code>GetHashCode</code> is a secondary formality.',
      reality: 'GetHashCode must be perfectly CONSISTENT with Equals — if two objects are Equals-equal but hash differently (even due to a small normalization mismatch like a missing .Trim()), a Dictionary/HashSet silently fails to find them, since the lookup never reaches the bucket where Equals would have confirmed the match.',
    },
    {
      thought: 'IEqualityComparer&lt;T&gt; and IComparer&lt;T&gt; are the same concern — equality and ordering are just two names for the same idea.',
      reality: 'they are genuinely separate: IEqualityComparer&lt;T&gt; answers "are these the same," while IComparer&lt;T&gt; answers "which comes first" — a type can have well-defined equality with no natural ordering (or vice versa), and you may need MULTIPLE different IComparer implementations for the same type to sort it different ways in different contexts.',
    },
    {
      thought: 'the built-in StringComparer variants (OrdinalIgnoreCase, etc.) cover every practical custom-ordering need without writing your own comparer.',
      reality: 'domain-specific ordering (like correctly sorting version numbers by numeric segment rather than lexicographically) requires custom parsing logic no built-in comparer provides — this is exactly the kind of gap a hand-written IComparer&lt;T&gt; fills.',
    },
  ];
}
