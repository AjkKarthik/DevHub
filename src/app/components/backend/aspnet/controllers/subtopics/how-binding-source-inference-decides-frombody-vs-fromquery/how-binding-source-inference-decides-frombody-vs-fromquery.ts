import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-binding-source-inference-mechanics-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
    TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './how-binding-source-inference-decides-frombody-vs-fromquery.html',
  styleUrl: './how-binding-source-inference-decides-frombody-vs-fromquery.scss',
})
export class HowBindingSourceInferenceDecidesFrombodyVsFromquerySubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page states the inference rule as a simple fact — "complex types bind from [FromBody]" — but never defines exactly what counts as "complex"',
      points: [
        'The main Controllers &amp; Actions page says: "simple types not in the route bind from <code>[FromQuery]</code>, and complex types bind from <code>[FromBody]</code> (JSON by default)." The word doing all the work here is "complex" — and the actual algorithm behind it is a specific, named check in the framework: <code>ModelMetadata.IsComplexType</code>, which is really just the INVERSE of <code>BindingSource</code>\'s own "simple type" check.',
      ],
    },
    {
      heading: 'A type is treated as "simple" (and therefore infers to [FromQuery]) if it has a TypeConverter that can convert FROM a string — this is a much narrower definition of "simple" than most developers assume',
      points: [
        'The actual rule, from <code>Microsoft.AspNetCore.Mvc.ModelBinding.Metadata.DefaultModelMetadata</code>: a type is "simple" if it is a primitive (<code>int</code>, <code>bool</code>, etc.), a <code>string</code>, or has a registered <code>TypeConverter</code> whose <code>CanConvertFrom(typeof(string))</code> returns true (this covers <code>DateTime</code>, <code>Guid</code>, <code>decimal</code>, <code>enum</code> types, and a handful of others with built-in converters). EVERYTHING ELSE — including a <code>record</code> with a SINGLE primitive property, like <code>record SearchFilter(string Query)</code> — is classified as "complex," because a <code>record</code> type has no <code>TypeConverter</code> registered for string conversion, regardless of how simple its actual shape is.',
        'This produces a genuinely surprising result: a developer who defines <code>public IActionResult Search([FromQuery] SearchFilter filter)</code>, expecting <code>?query=foo</code> to populate it via query string binding, gets it right ONLY because they added the explicit <code>[FromQuery]</code> attribute — WITHOUT it, <code>[ApiController]</code>\'s inference would classify <code>SearchFilter</code> as complex and infer <code>[FromBody]</code> instead, silently expecting a JSON request body that a GET request with query parameters would never actually send.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'A record with ONE primitive property — still classified as "complex" by inference, contrary to intuition',
      language: 'csharp',
      code: `// Looks "simple" — a single string property — but this record has NO
// TypeConverter registered, so binding-source inference classifies it
// as a COMPLEX type:
public record SearchFilter(string Query);

[ApiController]
[Route("api/[controller]")]
public class ProductsController : ControllerBase
{
    // WITHOUT an explicit attribute, [ApiController]'s inference sees
    // 'SearchFilter' is not a route parameter and is NOT a "simple"
    // type (no TypeConverter for string) — so it infers [FromBody]:
    [HttpGet("search")]
    public ActionResult<IEnumerable<Product>> Search(SearchFilter filter)
    {
        // A developer testing this with "GET /api/products/search?query=widget"
        // gets 'filter.Query' as NULL — the query string is completely
        // ignored, because the framework is waiting for a JSON request
        // BODY, which a browser or curl GET request never sends:
        return Ok(_products.Where(p => p.Name.Contains(filter.Query)));
    }
}

// THE FIX: the explicit attribute overrides inference entirely —
[HttpGet("search")]
public ActionResult<IEnumerable<Product>> SearchFixed([FromQuery] SearchFilter filter)
{
    // NOW 'filter.Query' correctly binds from the query string, because
    // [FromQuery] is EXPLICIT — it completely bypasses the "is this type
    // simple or complex" inference check that would otherwise apply:
    return Ok(_products.Where(p => p.Name.Contains(filter.Query)));
}`,
    },
    {
      label: 'Why an int (or a Guid, or a DateTime) infers correctly to [FromQuery] with NO explicit attribute needed',
      language: 'csharp',
      code: `[ApiController]
[Route("api/[controller]")]
public class ProductsController : ControllerBase
{
    // 'int page' and 'int pageSize' are SIMPLE types (primitives) — each
    // has an implicit conversion from string built into the runtime's
    // type system, satisfying the "simple type" check. No [FromQuery]
    // attribute is needed; inference gets this right automatically:
    [HttpGet]
    public ActionResult<IEnumerable<Product>> GetAll(int page = 1, int pageSize = 20)
        => Ok(_products.Skip((page - 1) * pageSize).Take(pageSize));

    // 'Guid correlationId' — Guid HAS a registered TypeConverter
    // (GuidConverter) whose CanConvertFrom(typeof(string)) returns true,
    // so it ALSO passes the "simple type" check and infers to
    // [FromQuery] correctly, with no explicit attribute:
    [HttpGet("by-correlation")]
    public ActionResult<Product> GetByCorrelation(Guid correlationId)
        => Ok(_products.FirstOrDefault(p => p.CorrelationId == correlationId));

    // CONTRAST: 'SearchFilter filter' (a record) has NO TypeConverter
    // registered anywhere — records don't get one automatically just
    // because their properties happen to be simple types themselves.
    // This is the exact gap that makes the previous tab's example
    // surprising: the RECORD's own internal simplicity does not
    // transfer to the record TYPE ITSELF being treated as simple.
}`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'Given that the "simple type" check depends specifically on a registered TypeConverter with CanConvertFrom(typeof(string)), predict whether an <code>enum</code> parameter (e.g. <code>public enum SortOrder { Ascending, Descending }</code>) used as an action parameter without any explicit binding attribute infers to [FromQuery] or [FromBody], and explain why.',
    hint: 'Consider that .NET registers a built-in EnumConverter for every enum type automatically as part of the type system — check whether that converter satisfies CanConvertFrom(typeof(string)).',
    solution: `An enum parameter correctly infers to [FromQuery] with NO explicit
attribute needed. The .NET runtime automatically registers an
EnumConverter for every enum type (this happens implicitly via
TypeDescriptor's built-in provider for enum types, without any manual
registration needed) — and EnumConverter.CanConvertFrom(typeof(string))
returns true, since converting a string like "Ascending" to the
corresponding enum value is exactly what EnumConverter exists to do.

This means:

public enum SortOrder { Ascending, Descending }

[HttpGet]
public ActionResult<IEnumerable<Product>> GetAll(SortOrder sort = SortOrder.Ascending)
    => Ok(sort == SortOrder.Ascending
        ? _products.OrderBy(p => p.Name)
        : _products.OrderByDescending(p => p.Name));

A request like "GET /api/products?sort=Descending" correctly binds
'sort' from the query string with zero explicit [FromQuery] attribute
needed — because SortOrder passes the "simple type" check via its
automatically-registered EnumConverter, exactly like int, Guid, and
DateTime do.

This reinforces the core lesson of this subtopic: "simple" in binding
source inference is not about how intuitively simple a type LOOKS to a
developer — it's about whether the .NET type system has a registered
TypeConverter capable of parsing that type FROM A STRING. Primitives,
Guid, DateTime, and enums all have one (built into the runtime).
Records, classes, and most custom types do NOT — regardless of how few
or how simple their own properties are — which is exactly why
SearchFilter(string Query) in the previous tab surprised developers by
inferring to [FromBody] instead of the intuitively-expected
[FromQuery].`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'a type counts as "simple" for binding source inference if its own properties are all simple types (like a record with a single string property).',
      reality: 'the "simple type" check looks at whether the TYPE ITSELF has a registered TypeConverter that can convert from a string — a record or class with simple properties does not automatically inherit that capability, and is classified as complex regardless of how simple its shape looks.',
    },
    {
      thought: 'primitives are the only types that infer correctly to [FromQuery] without an explicit attribute.',
      reality: 'any type with a registered TypeConverter satisfying CanConvertFrom(typeof(string)) infers correctly — this includes Guid, DateTime, decimal, and every enum type, since .NET automatically registers a converter for enums via TypeDescriptor.',
    },
    {
      thought: 'adding [FromQuery] to a complex-type parameter is redundant if the developer already expects query-string binding to "just work" the same way it does for primitives.',
      reality: 'for a genuinely complex type like a record, [FromQuery] is NOT redundant — it is the only thing that overrides the inference engine\'s default classification, which would otherwise silently expect a JSON body instead of query parameters.',
    },
  ];
}
