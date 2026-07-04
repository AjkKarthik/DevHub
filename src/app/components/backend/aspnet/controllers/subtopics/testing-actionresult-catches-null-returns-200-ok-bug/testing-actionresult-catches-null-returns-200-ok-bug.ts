import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-testing-actionresult-null-returns-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
    TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './testing-actionresult-catches-null-returns-200-ok-bug.html',
  styleUrl: './testing-actionresult-catches-null-returns-200-ok-bug.scss',
})
export class TestingActionresultCatchesNullReturns200OkBugSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page\'s own Common Mistakes and quiz BOTH call out the null-return bug — but neither shows how to write a test that actually catches it',
      points: [
        'The main Controllers &amp; Actions page dedicates an entire Common Mistake to "Returning null instead of NotFound()" and a quiz question to the exact same bug: an <code>ActionResult&lt;Product&gt;</code> action that returns a bare <code>null</code> serialises to a 200 OK response with a null JSON body — not the 404 a REST client expects for a missing resource. The page correctly diagnoses the bug and shows the fix, but a fix shown in documentation only protects the ORIGINAL code — nothing stops a future edit from reintroducing the exact same null-return mistake, since the compiler happily allows it either way.',
      ],
    },
    {
      heading: 'Calling a controller action directly (without HttpClient or a running server) and inspecting ActionResult<T>.Result lets a test assert on the EXACT response type — 404 vs 200-with-null — cheaply and deterministically',
      points: [
        '<code>ActionResult&lt;T&gt;</code> is a union type: calling the action method directly (as a plain C# object, with no HTTP pipeline involved) returns an instance whose <code>.Result</code> property is non-null when a specific <code>IActionResult</code> (like <code>NotFoundResult</code>) was returned, and whose <code>.Value</code> property is set when the raw <code>T</code> was returned instead. A test that asserts <code>actionResult.Result is NotFoundResult</code> directly distinguishes "the action explicitly returned 404" from "the action returned a bare, unwrapped null value" — exactly the distinction the main page\'s null-return bug hinges on.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'The main page\'s own buggy action, unit-tested directly — no HttpClient, no running server',
      language: 'csharp',
      code: `// The BUGGY version from the main page's own Common Mistakes section:
public class ProductsControllerBuggy : ControllerBase
{
    private readonly List<Product> _products = [];

    [HttpGet("{id:int}")]
    public ActionResult<Product> Get(int id)
    {
        // BAD: returns a bare null when not found — this is the exact
        // bug the main page's own mistake section warns about:
        return _products.FirstOrDefault(p => p.Id == id);
    }
}

public class ProductsControllerBuggyTests
{
    [Fact]
    public void Get_MissingId_ShouldReturn404_ButActuallyDoesNot()
    {
        var controller = new ProductsControllerBuggy();

        ActionResult<Product> response = controller.Get(999);   // no such product

        // THE BUG, PROVEN DIRECTLY: '.Result' is null (no explicit
        // IActionResult was returned), and '.Value' is ALSO null (the
        // raw T value, which happened to be null). A naive assertion
        // checking ONLY '.Value' would pass here even though this is
        // exactly the wrong behavior — a REST client receives 200 OK
        // with a null body, not 404:
        Assert.Null(response.Result);      // no NotFoundResult was set
        Assert.Null(response.Value);        // Value is null too

        // THIS is the assertion that actually encodes "the bug is
        // present" — checking that Result is specifically NOT a
        // NotFoundResult, when it SHOULD be one for a correctly
        // written action:
        Assert.False(response.Result is NotFoundResult,
            "Expected NotFoundResult but the action returned an unwrapped null instead — " +
            "this reproduces the exact 200-OK-with-null-body bug the main page warns about.");
    }
}`,
    },
    {
      label: 'The FIXED action, tested the same way — proving Result IS a NotFoundResult, not just that Value is null',
      language: 'csharp',
      code: `// The FIXED version from the main page's own "right" code sample:
public class ProductsController : ControllerBase
{
    private readonly List<Product> _products = [];

    [HttpGet("{id:int}")]
    public ActionResult<Product> Get(int id)
    {
        var product = _products.FirstOrDefault(p => p.Id == id);
        return product is null ? NotFound() : product;
    }
}

public class ProductsControllerTests
{
    [Fact]
    public void Get_MissingId_ReturnsExplicitNotFoundResult()
    {
        var controller = new ProductsController();

        ActionResult<Product> response = controller.Get(999);

        // THE CORRECT ASSERTION: '.Result' is specifically a
        // NotFoundResult — not merely "Value happens to be null."
        // This is the assertion style that actually distinguishes a
        // correctly-written 404 from the buggy bare-null-return case
        // shown in the previous tab:
        Assert.IsType<NotFoundResult>(response.Result);
    }

    [Fact]
    public void Get_ExistingId_ReturnsTheProductDirectly_NotWrappedInOkResult()
    {
        var controller = new ProductsController();
        var existing = new Product(1, "Widget", 9.99m);
        controller.GetType()
            .GetField("_products", BindingFlags.NonPublic | BindingFlags.Instance)!
            .SetValue(controller, new List<Product> { existing });

        ActionResult<Product> response = controller.Get(1);

        // For the SUCCESS path, ActionResult<T> lets the action return
        // T directly — the test asserts on '.Value', not '.Result',
        // since no explicit IActionResult was returned for the success
        // case (the framework wraps it in 200 OK automatically at the
        // HTTP layer, which this in-process test does not exercise):
        Assert.Null(response.Result);
        Assert.Equal(existing, response.Value);
    }
}`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'The tests in this subtopic call the controller action directly as a plain C# method — no HttpClient, no TestServer, no real HTTP request. Explain one thing these tests do NOT verify that an integration test using WebApplicationFactory<T> and a real HttpClient WOULD verify, specifically related to the exact bug this subtopic covers.',
    hint: 'Consider what actually determines the HTTP STATUS CODE and response body a real client receives — is that translation from ActionResult<T> to an HTTP response tested at all when you call the action method directly in C#?',
    solution: `These direct-call unit tests never exercise the actual HTTP TRANSLATION
layer — the part of the framework that converts an ActionResult<T>
return value into a real HTTP status code and response body. Calling
controller.Get(999) directly in C# only proves what OBJECT the action
method returns (a NotFoundResult instance, or a raw null Product) — it
does NOT prove that ASP.NET Core's MVC pipeline correctly translates a
NotFoundResult into an actual "HTTP/1.1 404 Not Found" response, or that
returning a raw null Product actually produces "HTTP/1.1 200 OK" with a
JSON body of literally "null".

An integration test using WebApplicationFactory<T> and a real HttpClient
would send an ACTUAL HTTP request through the full pipeline (routing,
model binding, action invocation, result execution, serialization) and
assert on the REAL response.StatusCode and response body content — this
is the only way to catch a bug in a CUSTOM IActionResult implementation,
a misconfigured status code mapping, or a serialization quirk that a
unit test calling the C# method directly can never see, since it never
goes through ASP.NET Core's actual result-execution pipeline at all.

The practical takeaway: the unit tests in this subtopic are FAST and
CHEAP, and correctly catch the specific "did the action return the RIGHT
KIND of ActionResult" class of bug this subtopic covers — but they are
not a substitute for at least some integration-level coverage that
proves the full HTTP round-trip actually produces the expected status
code and body for a real client.`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'a test checking that ActionResult<T>.Value is null is sufficient to prove an action correctly returns 404 for a missing resource.',
      reality: 'Value is null in BOTH the buggy case (a bare null Product was returned, producing 200 OK with a null body) and the correct case for the .Result property — only checking .Result for a specific IActionResult type like NotFoundResult actually distinguishes the two.',
    },
    {
      thought: 'calling a controller action method directly in a unit test fully verifies the HTTP response a real client would receive.',
      reality: 'a direct method call only proves which C# object the action returns — it never exercises ASP.NET Core\'s actual result-execution pipeline that translates that object into a real HTTP status code and response body, which requires an integration test with a real HttpClient to verify.',
    },
    {
      thought: 'the compiler prevents an ActionResult<T> action from accidentally returning an unwrapped null value.',
      reality: 'the compiler allows returning null from an ActionResult<T> action with zero warnings — this is exactly why the main page treats it as a common mistake rather than a compile error, and why a dedicated test is the only reliable guard against a future regression.',
    },
  ];
}
