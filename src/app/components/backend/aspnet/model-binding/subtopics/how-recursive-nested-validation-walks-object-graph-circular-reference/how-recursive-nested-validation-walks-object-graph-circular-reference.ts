import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-recursive-nested-validation-mechanics-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
    TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './how-recursive-nested-validation-walks-object-graph-circular-reference.html',
  styleUrl: './how-recursive-nested-validation-walks-object-graph-circular-reference.scss',
})
export class HowRecursiveNestedValidationWalksObjectGraphCircularReferenceSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page states validation is "recursive" for nested objects and recommends [ValidateNever] on navigation properties you don\'t want checked — but doesn\'t explain WHY navigation properties specifically are the danger zone',
      points: [
        'The main Model Binding page\'s DataAnnotations section says: "For nested objects, validation is recursive — add <code>[ValidateNever]</code> on navigation properties you do not want checked." The underlying mechanism: ASP.NET Core\'s <code>DefaultObjectValidator</code> walks a bound model\'s object graph depth-first, recursively validating each complex-typed property\'s OWN properties in turn. This works correctly for a normal tree-shaped DTO — but "navigation properties" specifically refers to EF Core-style relationship properties (<code>Order.Customer</code>, <code>Customer.Orders</code>) that commonly form a CYCLE: a <code>Customer</code> referencing its <code>Orders</code>, each of which references BACK to the same <code>Customer</code>.',
      ],
    },
    {
      heading: 'The recursive validator has no built-in cycle detection — validating a genuinely circular object graph causes infinite recursion and a StackOverflowException, which crashes the entire process (not just the request)',
      points: [
        'Unlike <code>System.Text.Json</code>\'s serializer (which has an explicit <code>ReferenceHandler.Preserve</code> option specifically because JSON serialization of cyclic graphs is a well-known problem), ASP.NET Core\'s built-in DataAnnotations object validator has NO equivalent cycle-detection mechanism. If a bound model\'s object graph contains an actual reference cycle — <code>customer.Orders[0].Customer == customer</code> — the validator recurses into <code>Customer</code>, then into its <code>Orders</code>, then back into the SAME <code>Customer</code>, forever, until the call stack is exhausted. A <code>StackOverflowException</code> in .NET cannot be caught by ordinary <code>try/catch</code> — it terminates the ENTIRE PROCESS immediately, taking down every other in-flight request on the same server, not just the one that triggered it.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'A genuinely cyclic model — the exact shape that crashes recursive validation',
      language: 'csharp',
      code: `public class Customer
{
    [Required] public string Name { get; set; } = "";
    public List<Order> Orders { get; set; } = [];
}

public class Order
{
    [Range(0.01, double.MaxValue)] public decimal Total { get; set; }

    // A "navigation property" pointing BACK to the parent — this is
    // exactly the shape EF Core produces for a bidirectional
    // relationship, and exactly what the main page's own advice
    // ("add [ValidateNever] on navigation properties") is warning about:
    public Customer Customer { get; set; } = null!;
}

[HttpPost]
public IActionResult CreateCustomer(Customer customer)
{
    // IF a caller somehow constructs a genuinely cyclic object graph
    // BEFORE this action even runs (e.g. this DTO is reused from an EF
    // Core entity that was loaded with both navigation directions
    // populated, rather than a fresh DTO built purely from request
    // JSON), [ApiController]'s automatic ModelState validation walks:
    //
    //   customer -> customer.Orders[0] -> customer.Orders[0].Customer
    //   -> (SAME customer instance) -> customer.Orders[0] -> ...
    //
    // forever. This is a StackOverflowException, which CANNOT be
    // caught, logged, or gracefully handled by ANY exception handler
    // middleware — it terminates the entire w3wp.exe / dotnet process
    // immediately, affecting every other request the server was
    // handling at that moment:
    return Ok(customer);
}`,
    },
    {
      label: 'The fix — [ValidateNever] breaks the cycle explicitly, exactly as the main page recommends, and WHY it specifically targets the back-reference',
      language: 'csharp',
      code: `public class Customer
{
    [Required] public string Name { get; set; } = "";
    public List<Order> Orders { get; set; } = [];
}

public class Order
{
    [Range(0.01, double.MaxValue)] public decimal Total { get; set; }

    // [ValidateNever] tells DefaultObjectValidator to skip walking INTO
    // this property entirely — it still exists on the object graph
    // (EF Core navigation still works normally at the data-access
    // layer), but the VALIDATOR never recurses through it, which is
    // exactly what breaks the cycle:
    [ValidateNever]
    public Customer Customer { get; set; } = null!;
}

// WHY THIS SPECIFICALLY WORKS: the validator's recursion only needs to
// be broken at ONE POINT in the cycle to prevent infinite recursion —
// it does not need [ValidateNever] on BOTH sides of the relationship.
// Placing it on Order.Customer (the "back" reference in a typical
// parent-child navigation) is enough, because the validator's forward
// walk (Customer -> Orders -> [validate each Order's OWN properties])
// still fully validates Order.Total and any other real constraints on
// Order — it simply never continues PAST Order.Customer back toward
// the parent it already came from.

// A NON-EF-CORE DTO built purely from request JSON typically does NOT
// have this problem in the first place — a JSON payload representing
// this DTO tree cannot itself contain a circular reference (JSON has no
// way to express "this field IS the same object as an ancestor"). The
// risk is specifically when a TYPE reused for both request binding
// AND as an EF Core entity (a common but discouraged practice) can
// have its navigation properties populated with a genuine object cycle
// by EF Core's change tracker, well before that same instance is later
// passed through model validation for an unrelated purpose.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'Given that the danger is specifically reusing an EF Core entity (with populated navigation properties) as a request/response DTO, propose a design change to the Customer/Order example that avoids this class of bug entirely — rather than relying on remembering to add [ValidateNever] to every navigation property.',
    hint: 'Consider the common architectural guidance to use separate types for the data-access layer (EF Core entities) and the API surface (request/response DTOs) — how would introducing that separation here eliminate the possibility of a circular reference reaching the validator at all?',
    solution: `The most robust fix is architectural, not a per-property attribute:
NEVER bind request bodies directly to EF Core entity types that have
navigation properties in the first place. Instead, use separate,
purpose-built DTO types for the API boundary that simply do not
contain circular references by construction:

// EF Core entity — used ONLY at the data-access layer, never bound
// directly from a request:
public class CustomerEntity
{
    public int Id { get; set; }
    public string Name { get; set; } = "";
    public List<OrderEntity> Orders { get; set; } = [];
}

public class OrderEntity
{
    public int Id { get; set; }
    public decimal Total { get; set; }
    public CustomerEntity Customer { get; set; } = null!;   // navigation
}

// Request DTO — used for MODEL BINDING, has NO back-reference at all,
// because it is a plain, flat, tree-shaped type built specifically for
// the API contract:
public record CreateCustomerRequest(
    [Required] string Name,
    List<CreateOrderRequest> Orders);

public record CreateOrderRequest(
    [Range(0.01, double.MaxValue)] decimal Total);
// (no 'Customer' back-reference here — it's structurally impossible
// for this type to form a cycle, since Order requests never point
// back to their parent)

[HttpPost]
public IActionResult CreateCustomer(CreateCustomerRequest request)
{
    // 'request' can NEVER contain a circular reference — its shape,
    // by construction, does not have a back-pointing property. Model
    // validation recurses safely through it with zero risk of
    // StackOverflowException, and [ValidateNever] is never needed
    // anywhere in this DTO at all.
    var entity = MapToEntity(request);   // convert DTO -> EF Core entity
                                          // AFTER validation has already
                                          // passed
    // ... save entity via DbContext ...
    return Ok();
}

This is the same underlying principle behind the common "never expose
EF Core entities directly through your API" guidance — it is usually
framed as a concerns-separation or over-posting security argument, but
this subtopic shows it ALSO eliminates an entire class of
StackOverflowException risk in model validation, since request DTOs
built purely for the API surface have no structural reason to ever
contain a reference cycle in the first place.`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'a StackOverflowException from a circular reference during model validation can be caught by app.UseExceptionHandler() or a global exception filter, the same way other unhandled exceptions are.',
      reality: 'StackOverflowException in .NET cannot be caught by ordinary try/catch or ASP.NET Core exception-handling middleware at all — it immediately terminates the entire process, taking down every other in-flight request on the same server, not just the one that triggered it.',
    },
    {
      thought: '[ValidateNever] needs to be applied on BOTH sides of a bidirectional navigation property relationship to prevent infinite recursion.',
      reality: 'breaking the cycle at just ONE point in the relationship (typically the "back" reference, like Order.Customer) is sufficient — the validator\'s forward walk still validates every other real constraint, it simply never continues past that one property back toward an ancestor it already visited.',
    },
    {
      thought: 'a DTO built purely from request JSON can suffer the same circular-reference StackOverflowException risk as an EF Core entity with populated navigation properties.',
      reality: 'JSON has no way to express "this field is the same object as an ancestor" — a request body deserialized fresh from JSON cannot itself contain a true object-reference cycle; the risk specifically arises when a type with navigation properties (typically an EF Core entity) is reused directly as a request or response DTO.',
    },
  ];
}
