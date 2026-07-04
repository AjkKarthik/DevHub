import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-testing-reflection-code-attribute-discovery-cache-behavior-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
    TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './testing-reflection-code-attribute-discovery-cache-behavior.html',
  styleUrl: './testing-reflection-code-attribute-discovery-cache-behavior.scss',
})
export class TestingReflectionCodeAttributeDiscoveryCacheBehaviorSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page\'s own MiniValidator and CsvExporter challenges are never tested for two distinct, easily-broken behaviors',
      points: [
        'The main Reflection page\'s <code>MiniValidator</code> and <code>CsvExporter</code> examples are demonstrated only by printing output. Two genuinely separate claims hide in that code: (1) that attribute-driven discovery correctly finds ONLY the decorated members and skips undecorated ones, and (2) that the <code>PropertyCache</code>/column cache actually avoids re-scanning on repeated calls for the SAME type — both are real behaviors a refactor could silently break without any test catching it.',
      ],
    },
    {
      heading: 'Testing attribute discovery: assert on WHICH members were found, not just that the code ran',
      points: [
        'A meaningful test for the main page\'s own <code>MiniValidator.Validate</code> asserts on the SPECIFIC error messages produced for a SPECIFIC set of decorated properties — this directly verifies the reflection scan is discovering the right <code>[Required]</code>/<code>[MaxLength]</code> properties and SKIPPING undecorated ones like <code>InternalNotes</code>, rather than merely confirming the method didn\'t throw.',
        'A genuinely useful companion test asserts the NEGATIVE case explicitly: a class with NO decorated properties produces ZERO validation errors regardless of its field values — this catches a refactor that accidentally validates ALL properties instead of only attributed ones, a bug that would otherwise only surface as an unexpectedly strict validation rule in production.',
      ],
    },
    {
      heading: 'Testing cache behavior: verify the SAME PropertyInfo array is reused across calls, not just that results look identical',
      points: [
        'The main page\'s own <code>PropertyCache.For(type)</code> claims the property lookup happens ONCE per type. The directly testable version of that claim: call <code>PropertyCache.For(typeof(Customer))</code> twice and assert <code>ReferenceEquals</code> on the two returned arrays — if caching is genuinely working, both calls return the EXACT SAME array instance, not merely two arrays with equal-looking contents.',
        'This mirrors the exact same "spy on the underlying dependency" testing philosophy used elsewhere for verifying JSON serializer caching and disposal call counts — the shared insight is that "this expensive thing only happened once" is best proven by identity or a call-count spy, not by inspecting the FINAL result alone, since an identical-looking result can be produced by either a cache hit or an accidental cache miss that happened to recompute the same value.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Testing attribute discovery finds the right properties — and only those',
      language: 'csharp',
      code: `using Xunit;

public class MiniValidatorTests
{
    [Fact]
    public void Validate_ReportsErrorsOnlyForDecoratedProperties()
    {
        var request = new RegisterRequest
        {
            Username = "",                          // [Required] — should error
            Email    = new string('x', 150),          // [MaxLength(100)] — should error
            Nickname = "a-very-very-long-nickname",   // [MaxLength(20)] — should error
        };

        var errors = MiniValidator.Validate(request);

        Assert.Equal(3, errors.Count);
        Assert.Contains("Username is required.", errors);
        Assert.Contains("Email must be at most 100 characters.", errors);
        Assert.Contains("Nickname must be at most 20 characters.", errors);
    }

    [Fact]
    public void Validate_UndecoratedClass_ProducesNoErrors()
    {
        // A negative-case test — proves the scanner genuinely skips
        // properties with NO validation attributes, rather than
        // accidentally validating everything it finds:
        var plain = new PlainRecord { Anything = "" };
        var errors = MiniValidator.Validate(plain);
        Assert.Empty(errors);
    }
}

public class PlainRecord
{
    public string Anything { get; set; } = "";  // no [Required]/[MaxLength]
}`,
    },
    {
      label: 'Testing the cache genuinely returns the SAME array instance, not just equal content',
      language: 'csharp',
      code: `public class PropertyCacheTests
{
    [Fact]
    public void For_SameType_ReturnsIdenticalArrayReference()
    {
        var first  = PropertyCache.For(typeof(Customer));
        var second = PropertyCache.For(typeof(Customer));

        // ReferenceEquals proves the SECOND call hit the cache instead
        // of re-scanning — two independently-computed arrays could
        // easily look content-equal without this actually being true:
        Assert.True(ReferenceEquals(first, second));
    }

    [Fact]
    public void For_DifferentTypes_ReturnsDistinctArrays()
    {
        var customerProps = PropertyCache.For(typeof(Customer));
        var productProps  = PropertyCache.For(typeof(Product));

        // Confirms the cache is genuinely keyed per-type, not
        // accidentally sharing one array across every lookup:
        Assert.False(ReferenceEquals(customerProps, productProps));
    }
}`,
    },
    {
      label: 'A spy-based test proving the underlying scan runs exactly once per type',
      language: 'csharp',
      code: `// A thin wrapper that COUNTS how many times the real scan runs —
// the same "spy" philosophy used to verify Dispose() call counts,
// applied here to reflection scan counts:
public static class CountingPropertyCache
{
    public static int ScanCount { get; private set; }
    private static readonly ConcurrentDictionary<Type, PropertyInfo[]> _cache = new();

    public static PropertyInfo[] For(Type type) => _cache.GetOrAdd(type, t =>
    {
        ScanCount++;              // only increments on a genuine cache MISS
        return t.GetProperties();
    });
}

public class ScanCountTests
{
    [Fact]
    public void For_CalledManyTimesForSameType_ScansOnlyOnce()
    {
        for (int i = 0; i < 100; i++)
            CountingPropertyCache.For(typeof(Customer));

        // Directly proves the caching claim — 100 calls, but the
        // expensive GetProperties() scan itself only ran ONCE:
        Assert.Equal(1, CountingPropertyCache.ScanCount);
    }
}`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'Write a test for the main topic page\'s own <code>CsvExporter.Export&lt;T&gt;</code> that verifies <code>InternalSku</code> (a property with NO <code>[CsvColumn]</code> attribute) never appears anywhere in the output, using a Product with several columns.',
    hint: 'Call CsvExporter.Export with a small list of Products, then assert the resulting string does NOT contain "InternalSku" or the actual SKU value anywhere — this proves undecorated properties are genuinely excluded, not just that decorated ones are present.',
    solution: `[Fact]
public void Export_ExcludesPropertiesWithoutCsvColumnAttribute()
{
    var products = new[]
    {
        new Product { Id = 1, Name = "Widget", Price = 9.99m, InternalSku = "SECRET-SKU-1" },
    };

    string csv = CsvExporter.Export(products);

    // Positive check — decorated properties ARE present:
    Assert.Contains("ID,Product Name,Price", csv);
    Assert.Contains("1,Widget,9.99", csv);

    // Negative check — proves the undecorated property is genuinely
    // excluded from the scan, not merely absent by coincidence:
    Assert.DoesNotContain("InternalSku", csv);
    Assert.DoesNotContain("SECRET-SKU-1", csv);
}`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'a test that confirms attribute-driven code produces SOME output without errors has verified the attribute discovery logic is correct.',
      reality: 'a meaningful test must assert on WHICH specific members were discovered (and, just as importantly, which undecorated ones were correctly skipped) — otherwise a bug that validates or exports every property instead of only the attributed ones can pass silently.',
    },
    {
      thought: 'checking that two cache lookups return equal-looking results proves the cache is genuinely avoiding a re-scan.',
      reality: 'two independently-computed PropertyInfo arrays can look content-equal without being the same cached instance — ReferenceEquals (or a call-count spy) is the direct way to prove a cache hit actually occurred, rather than an accidental cache miss recomputing the same values.',
    },
    {
      thought: 'reflection-based scanning code is inherently hard to unit test because it depends on runtime type metadata.',
      reality: 'the same testing techniques used elsewhere (assert on specific discovered results, spy on call counts, test both positive and negative cases) apply directly to reflection code — nothing about it requires a different testing approach.',
    },
  ];
}
