import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-pattern-matching-ef-core-sql-translation-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
    TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './pattern-matching-ef-core-sql-translation.html',
  styleUrl: './pattern-matching-ef-core-sql-translation.scss',
})
export class PatternMatchingInEfCoreLinqQueriesWhatTranslatesToSqlAndWhatThrowsSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page\'s one-line warning, unpacked',
      points: [
        'The main Pattern Matching page\'s own Q&A says, in passing: "EF Core cannot translate pattern expressions to SQL — only use them in AsEnumerable() or ToList() LINQ chains that run in memory." It never shows what actually happens if you ignore that advice, or explains WHY some patterns fail while others quietly succeed.',
      ],
    },
    {
      heading: 'Some patterns DO translate — the simple ones',
      points: [
        'EF Core\'s LINQ provider translates an expression tree into SQL by recognizing specific method/operator shapes. Simple constant and relational patterns used inside a lambda — <code>x is 200</code>, <code>x.Status is > 0</code> — are typically translatable, because the compiler LOWERS them into ordinary comparison operators (<code>==</code>, <code>&gt;</code>) in the expression tree, which EF Core already knows how to translate to SQL <code>WHERE</code> clauses.',
        'Simple type checks against a KNOWN entity hierarchy mapped with EF Core\'s Table-Per-Hierarchy (TPH) inheritance can also translate — EF Core recognizes the pattern as equivalent to a discriminator-column check it already understands from its own inheritance mapping.',
      ],
    },
    {
      heading: 'Other patterns silently fall back to client evaluation — or throw',
      points: [
        'More complex patterns — nested property patterns, list patterns, positional patterns calling a custom <code>Deconstruct</code> — lower into constructs (method calls, tuple deconstruction, span operations) that EF Core\'s SQL translator does not recognize as any known SQL construct.',
        'In OLDER EF Core versions (EF Core 2.x), an untranslatable expression would silently fall back to CLIENT-SIDE evaluation: EF Core would pull MORE rows than intended back into memory and run the pattern match in .NET — a serious, silent performance problem that could go unnoticed until a table grew large.',
        'Since EF Core 3.0, this silent client-evaluation fallback for WHERE-clause predicates was REMOVED — an untranslatable pattern in a query predicate now throws <code>InvalidOperationException</code> at query-execution time with a clear "could not be translated" message, rather than silently degrading performance. This is a genuinely important version-dependent behavior change the main topic never mentions.',
      ],
    },
    {
      heading: 'The fix is always the same shape — materialize first',
      points: [
        'The correct fix, exactly as the main topic\'s one-liner suggests, is to materialize the relevant rows first (<code>.ToList()</code> or <code>.AsEnumerable()</code>) and apply the pattern match afterward, in memory — deliberately accepting that the pattern-based filtering happens client-side, on an already-narrowed result set (filtered by whatever simpler predicates DO translate, applied BEFORE materializing).',
        'A good rule of thumb: push every translatable predicate (equality, simple relational, TPH type checks) into the EF Core query itself, and reserve pattern-matching-based filtering for logic applied AFTER <code>ToList()</code>/<code>AsEnumerable()</code> — this keeps the expensive row-narrowing work in the database while still getting pattern matching\'s readability for the remaining in-memory logic.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Translates fine — simple relational and constant patterns',
      language: 'csharp',
      code: `public class Order
{
    public int Id { get; set; }
    public int StatusCode { get; set; }
    public decimal Amount { get; set; }
}

// Relational patterns inside a lambda LOWER to ordinary comparison operators —
// EF Core's SQL translator already understands these.
var pendingLargeOrders = dbContext.Orders
    .Where(o => o.StatusCode is >= 100 and < 200 && o.Amount is > 1000m)
    .ToList();

// Generates roughly:
//   SELECT * FROM Orders
//   WHERE StatusCode >= 100 AND StatusCode < 200 AND Amount > 1000
// The pattern syntax is just readability sugar here — it desugars to the same
// expression tree shape as o.StatusCode >= 100 && o.StatusCode < 200, which
// EF Core has always been able to translate.`,
    },
    {
      label: 'Fails to translate — property + positional patterns',
      language: 'csharp',
      code: `public record Address(string Country, string City);

public class Customer
{
    public int Id { get; set; }
    public string Name { get; set; } = "";
    public Address ShippingAddress { get; set; } = null!;
}

// A property pattern nested against a value object with a custom Deconstruct —
// EF Core has no SQL equivalent for "pattern-match this shape."
var nyCustomers = dbContext.Customers
    .Where(c => c.ShippingAddress is { Country: "US", City: "NYC" })
    .ToList();

// EF Core 3.0+: throws InvalidOperationException at query execution:
//   "The LINQ expression '...' could not be translated. Either rewrite the
//    query in a form that can be translated, or switch to client evaluation
//    explicitly by inserting a call to 'AsEnumerable', 'AsAsyncEnumerable',
//    'ToList', or 'ToListAsync'."
//
// EF Core 2.x (older): would NOT throw — it would silently pull the ENTIRE
// Customers table into memory and filter with the pattern client-side,
// which could be a serious, invisible performance problem on a large table.`,
    },
    {
      label: 'The fix — materialize first, pattern-match in memory after',
      language: 'csharp',
      code: `// Push everything translatable into the database query — narrow the rows
// using ordinary EF Core-friendly predicates FIRST:
var candidateCustomers = dbContext.Customers
    .Where(c => c.ShippingAddress.Country == "US") // translates fine — simple equality
    .ToList(); // <- materializes HERE, deliberately, on an already-narrowed set

// THEN apply the richer pattern match in memory, on the small candidate set —
// exactly the "AsEnumerable()/ToList() LINQ chains that run in memory" the
// main topic's Q&A refers to:
var nyCustomers = candidateCustomers
    .Where(c => c.ShippingAddress is { Country: "US", City: "NYC" })
    .ToList();

// This gets both: the expensive row-narrowing (Country == "US") stays in the
// database via translatable SQL, while the richer, more readable pattern
// match runs safely in memory on a set that is already small.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A teammate writes <code>dbContext.Orders.Where(o => o is { StatusCode: 200 } or { StatusCode: 201 })</code> and it works fine in production on EF Core 8. Explain why this particular pattern translates successfully, using the same reasoning from the "translates fine" example.',
    hint: 'Think about what { StatusCode: 200 } or { StatusCode: 201 } actually lowers to underneath the pattern syntax — a property pattern testing a single scalar property against a constant is structurally no different from the relational-pattern example that lowers to ordinary comparison operators.',
    solution: `// { StatusCode: 200 } or { StatusCode: 201 } lowers to essentially:
//   o.StatusCode == 200 || o.StatusCode == 201
// — a property pattern against a SINGLE SCALAR property compared to a
// constant is structurally identical to the relational-pattern case: it
// desugars into ordinary equality/comparison operators in the expression
// tree, which EF Core's SQL translator has always understood.

// This is the general rule: a pattern that lowers to comparisons on SCALAR,
// directly-mapped columns tends to translate. A pattern that lowers to
// Deconstruct() calls, nested object shape matching, or list/span
// operations does not — because there is no SQL equivalent for those
// constructs, regardless of how simple the pattern LOOKS in C# source.

dbContext.Orders.Where(o => o is { StatusCode: 200 } or { StatusCode: 201 });
// Generates: WHERE StatusCode = 200 OR StatusCode = 201`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'all pattern matching syntax is equally unsupported by EF Core\'s SQL translator, so none of it should be used inside a LINQ query predicate.',
      reality: 'patterns that lower to simple comparisons on scalar, directly-mapped properties (relational patterns, single-property constant patterns) translate to SQL just fine — it is specifically nested property patterns, positional patterns using a custom Deconstruct, and list patterns that fail to translate.',
    },
    {
      thought: 'an untranslatable pattern in an EF Core query predicate always throws an exception, making the problem impossible to miss.',
      reality: 'this is only true since EF Core 3.0. Earlier EF Core versions (2.x) silently fell back to client-side evaluation instead of throwing — pulling far more data into memory than intended, a serious performance problem that could go completely unnoticed.',
    },
    {
      thought: 'the fix for an untranslatable pattern is to avoid pattern matching entirely and rewrite the whole query using plain LINQ operators.',
      reality: 'the idiomatic fix is to materialize (ToList()/AsEnumerable()) after applying whatever translatable predicates narrow the rows, then apply the richer pattern match in memory on the already-narrowed result — keeping pattern matching\'s readability without losing translation for the expensive row-filtering step.',
    },
  ];
}
