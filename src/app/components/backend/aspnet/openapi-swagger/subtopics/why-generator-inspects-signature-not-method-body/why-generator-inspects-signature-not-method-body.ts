import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-generator-inspects-signature-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
    TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './why-generator-inspects-signature-not-method-body.html',
  styleUrl: './why-generator-inspects-signature-not-method-body.scss',
})
export class WhyGeneratorInspectsSignatureNotMethodBodySubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page\'s "right" fix works because of the METHOD SIGNATURE\'s declared return type — not because TypedResults values are constructed somewhere inside the method',
      points: [
        'The main OpenAPI &amp; Swagger page\'s fix for the IResult mistake changes the endpoint\'s signature to explicitly return <code>Results&lt;Ok&lt;Product&gt;, NotFound&gt;</code> (via an explicit cast on the ternary). A natural but INCORRECT assumption: "as long as I\'m calling <code>TypedResults.Ok()</code> and <code>TypedResults.NotFound()</code> SOMEWHERE inside the method, the generator will figure out the possible response shapes." This is false — the generator never inspects the METHOD BODY at all. It only inspects the endpoint delegate\'s DECLARED RETURN TYPE, resolved via reflection when the endpoint is mapped.',
      ],
    },
    {
      heading: 'A method that calls TypedResults.Ok() and TypedResults.NotFound() internally, but is declared to return bare Task<IResult>, produces EXACTLY the same undocumented spec as calling Results.Ok()/Results.NotFound() — because both have the identical declared signature',
      points: [
        'Both <code>TypedResults.Ok(p)</code> and <code>Results.Ok(p)</code> ultimately implement the SAME <code>IResult</code> interface — the only difference is that <code>TypedResults.Ok&lt;T&gt;()</code> returns the concrete generic type <code>Ok&lt;T&gt;</code>, while <code>Results.Ok()</code> returns the type erased to plain <code>IResult</code>. If a method\'s OWN declared return type is <code>async Task&lt;IResult&gt;</code> — even though every individual <code>return</code> statement inside constructs a <code>TypedResults</code> value — the COMPILER widens each of those concrete types back down to <code>IResult</code> at the method boundary, because that is what the method SIGNATURE promises to return. The OpenAPI generator, working from reflection on that signature, sees only <code>Task&lt;IResult&gt;</code> and has no way to recover the specific types that were used inside.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Using TypedResults internally does NOT help if the method signature still says Task<IResult>',
      language: 'csharp',
      code: `// This LOOKS like it should produce a documented schema, since
// TypedResults.Ok() and TypedResults.NotFound() are both used inside —
// but it does NOT, because of the method's OWN declared return type:
products.MapGet("/{id:int}",
    async Task<IResult> (int id, IProductService svc) =>   // <-- the
                                                              //     PROBLEM
    {
        var p = await svc.FindAsync(id);

        // Both branches use TypedResults — looks correct at a glance:
        if (p is null)
            return TypedResults.NotFound();     // returns NotFound (implements IResult)

        return TypedResults.Ok(p);              // returns Ok<Product> (implements IResult)

        // BUT: the METHOD'S DECLARED RETURN TYPE is 'Task<IResult>'.
        // The C# compiler widens BOTH 'TypedResults.NotFound()' (type
        // NotFound) and 'TypedResults.Ok(p)' (type Ok<Product>) to the
        // common declared return type IResult at the method boundary —
        // this happens INVISIBLY, with no warning, since both concrete
        // types DO implement IResult and the widening is a perfectly
        // ordinary, valid implicit conversion.
    })
    .WithSummary("Get product by ID");

// The OpenAPI generator inspects this endpoint's delegate via
// reflection and sees a return type of 'Task<IResult>' — nothing about
// 'Ok<Product>' or 'NotFound' survives to be inspected, because the
// generator NEVER looks at what happens inside the method body, only
// at the METHOD'S OWN SIGNATURE. Result: exactly the same empty
// "responses: {}" the main page's own Common Mistake describes for
// plain Results.Ok()/Results.NotFound() — despite this version
// LOOKING more "correct" because it uses TypedResults.`,
    },
    {
      label: 'The actual fix — the method\'s DECLARED return type must itself be the union type',
      language: 'csharp',
      code: `// CORRECT: the method's OWN SIGNATURE declares the union type —
// this is what the generator actually inspects via reflection:
products.MapGet("/{id:int}",
    async Task<Results<Ok<Product>, NotFound>> (int id, IProductService svc) =>
    {
        var p = await svc.FindAsync(id);

        return p is null
            ? TypedResults.NotFound()    // implicitly converts to
                                          // Results<Ok<Product>, NotFound>
            : TypedResults.Ok(p);        // via Results<T1,T2>'s own
                                          // implicit conversion operators
    })
    .WithSummary("Get product by ID");

// NOW the generator's reflection-based inspection sees the DECLARED
// return type 'Task<Results<Ok<Product>, NotFound>>' — it walks the
// generic type arguments of Results<T1, T2> (Ok<Product> and
// NotFound), and adds BOTH as separate documented response entries in
// the spec, exactly as the main page describes.

// THE KEY MECHANICAL FACT WORTH INTERNALIZING: 'Results<T1, T2>' is
// itself a real struct type with its OWN implicit conversion operators
// FROM each of its type parameters — this is precisely what lets
// 'return TypedResults.NotFound();' compile successfully as a
// 'Results<Ok<Product>, NotFound>' value. Nothing about this involves
// any special compiler magic tied to OpenAPI — it's the SAME implicit
// conversion mechanism as any other type with a user-defined implicit
// operator. The OpenAPI generator's job is simpler than it might seem:
// it just reflects on the DECLARED signature type and unpacks
// Results<T1,T2,...>'s generic arguments — it never needs to
// understand or inspect what code runs inside the method body at all.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'Given that the OpenAPI generator only inspects the DECLARED signature and never the method body, predict whether a method declared as returning <code>Task&lt;Results&lt;Ok&lt;Product&gt;, NotFound&gt;&gt;</code> that ALSO has an unreachable code path returning <code>TypedResults.BadRequest()</code> (a type not present in its declared Results union) would compile, and if so, what the generated spec would document for that endpoint.',
    hint: 'Consider that Results<T1,T2> only has implicit conversion operators FROM the types it actually declares as type parameters — does a type NOT among those parameters have any way to convert into it at all?',
    solution: `This scenario would NOT COMPILE at all — which is actually a useful,
reassuring fact about how safe this system is. Results<Ok<Product>,
NotFound> only defines implicit conversion operators FROM Ok<Product>
and FROM NotFound specifically — it has no conversion operator from
BadRequest<T> or any other IResult-implementing type that isn't one of
its own declared type parameters. Attempting:

async Task<Results<Ok<Product>, NotFound>> (int id, IProductService svc) =>
{
    if (SomeImpossibleCondition())
        return TypedResults.BadRequest("this won't work");   // COMPILE ERROR

    var p = await svc.FindAsync(id);
    return p is null ? TypedResults.NotFound() : TypedResults.Ok(p);
}

produces a genuine C# compiler error: "CS0029: Cannot implicitly
convert type 'Microsoft.AspNetCore.Http.HttpResults.BadRequest<string>'
to 'Microsoft.AspNetCore.Http.HttpResults.Results<...>'" — because
BadRequest<string> is not among the Results<Ok<Product>, NotFound>
union's own two type parameters.

This is actually the OPPOSITE problem from the one in this subtopic's
main content: rather than silently producing an under-documented spec
(the Task<IResult> case), an attempt to return a TYPE THE SIGNATURE
DOESN'T DECLARE fails LOUDLY at compile time. This is a genuinely
useful safety property of the Results<T1,T2,...> design: the compiler
enforces that every code path returns ONLY a type already declared in
the union, which means (combined with the mechanism this subtopic
explains) the OpenAPI spec generated from a Results<T1,T2> signature is
GUARANTEED to be complete and accurate for every reachable return
statement — there is no way to add a NEW possible response type to a
method's behavior without ALSO updating its declared signature, which
is exactly what keeps the generated documentation trustworthy.`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'calling TypedResults.Ok() and TypedResults.NotFound() inside a method\'s body is what makes the OpenAPI generator document both response types — the METHOD\'S OWN declared return type does not matter as much as what values are actually constructed and returned.',
      reality: 'the generator never inspects the method body at all — it only reflects on the method\'s DECLARED return type; if that declared type is bare IResult, both TypedResults.Ok() and TypedResults.NotFound() get implicitly widened to IResult at the method boundary, and neither survives for the generator to see.',
    },
    {
      thought: 'Results<T1, T2> is a special compiler-recognized construct that OpenAPI tooling has custom, hard-coded support for.',
      reality: 'Results<T1, T2> is an ordinary struct type with regular user-defined implicit conversion operators FROM each of its type parameters — the OpenAPI generator\'s job is simply to reflect on the declared signature and unpack those generic type arguments, using no special-cased compiler behavior at all.',
    },
    {
      thought: 'a method declared as returning Results<Ok<Product>, NotFound> could accidentally return an unrelated IResult type (like BadRequest) at runtime without anyone noticing, since C# is often lenient about interface-typed returns.',
      reality: 'attempting to return a type that is NOT one of the union\'s own declared type parameters (like BadRequest<T> from a Results<Ok<Product>, NotFound>-declared method) is a genuine compile-time error — the union type only has implicit conversions from its own declared parameters, making the generated spec\'s completeness a compiler-enforced guarantee.',
    },
  ];
}
