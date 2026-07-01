import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../components/shared/page-meta/page-meta';
import { QuickRefComponent, QuickRefItem } from '../../../../components/shared/quick-ref/quick-ref';
import { TheoryBlockComponent, TheoryPoint } from '../../../../components/shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../components/shared/code-block/code-block';
import { CommonMistakesComponent, CommonMistake } from '../../../../components/shared/common-mistakes/common-mistakes';
import { ChallengeBlockComponent, Challenge } from '../../../../components/shared/challenge-block/challenge-block';
import { QuizBlockComponent, QuizQuestion } from '../../../../components/shared/quiz-block/quiz-block';
import { QnaBlockComponent, QnaItem } from '../../../../components/shared/qna-block/qna-block';

@Component({
  selector: 'app-blazor-bunit',
  standalone: true,
  imports: [PageMetaComponent, QuickRefComponent, TheoryBlockComponent, CodeBlockComponent,
    CommonMistakesComponent, ChallengeBlockComponent, QuizBlockComponent, QnaBlockComponent],
  templateUrl: './bunit.html',
  styleUrl: './bunit.scss'
})
export class BlazorBunit {
  quickRef: QuickRefItem[] = [
    { name: 'TestContext', type: 'class', desc: 'bUnit\'s test host — renders components and provides services.' },
    { name: 'ctx.RenderComponent<T>()', type: 'method', desc: 'Renders a component and returns an IRenderedComponent<T>.' },
    { name: 'cut.Find("selector")', type: 'method', desc: 'CSS selector query on the rendered DOM.' },
    { name: 'cut.FindAll("selector")', type: 'method', desc: 'Returns all matching DOM elements.' },
    { name: 'cut.Instance', type: 'keyword', desc: 'Direct reference to the component instance.' },
    { name: 'cut.Click() / Trigger events', type: 'method', desc: 'Simulate user events on elements.' },
    { name: 'ctx.Services.AddScoped<T>()', type: 'method', desc: 'Register a mock/stub service for the test.' },
    { name: 'MarkupMatches()', type: 'method', desc: 'Semantic HTML comparison — ignores attribute order and whitespace.' },
  ];

  theory: TheoryPoint[] = [
    {
      heading: 'bUnit overview',
      points: ['bUnit is an open-source testing library for Blazor components. It renders components in a headless DOM, lets you interact with them (click, type, trigger events), and then assert on the rendered HTML or the component\'s state. Tests run as standard xUnit, NUnit, or MSTest tests — no browser required. bUnit handles the Blazor lifecycle (OnInitialized, OnAfterRender, etc.) so component tests reflect real behaviour.',
      'Runs in-process — no browser or Playwright needed.', 'Full lifecycle support: OnInitializedAsync, StateHasChanged, etc.', 'Works with xUnit, NUnit, and MSTest.', 'Install: NuGet `bunit` and `bunit.web` packages.']
    },
    {
      heading: 'Rendering and querying',
      points: ['Create a `TestContext`, call `ctx.RenderComponent<MyComponent>(p => p.Add(c => c.Title, "Hello"))` to render. The result `cut` (component under test) exposes `Find()` and `FindAll()` for CSS selector queries, `Markup` for the raw HTML string, and `Instance` for the component object. After triggering events, bUnit automatically re-renders the component.',
      'ComponentParameter.Create() or the lambda builder sets [Parameter] values.', 'Find() throws if no element matches — use FindAll() to check count.', 'cut.Markup contains the current rendered HTML.', 'cut.Instance gives direct access to the component for state assertions.']
    },
    {
      heading: 'Mocking services and JSInterop',
      points: ['Register services on `ctx.Services` before rendering: `ctx.Services.AddScoped<IProductService, FakeProductService>()`. For IJSRuntime, bUnit provides a built-in `JSInterop` object: `ctx.JSInterop.SetupVoid("window.init")` mocks JS calls without a real browser. You can verify JS calls were made, return fake values, and throw exceptions to test error paths.',
      'ctx.Services mirrors the real DI container — register stubs/mocks there.', 'ctx.JSInterop.Setup() mocks specific JS interop calls.', 'Use Moq or NSubstitute for service mocks.', 'ctx.JSInterop.VerifyInvoke() asserts a JS function was called.']
    },
    {
      heading: 'What bUnit Tests and What It Deliberately Does Not',
      points: [
        'bUnit renders components headlessly using a test double of the Blazor rendering pipeline — it verifies component logic, markup output, and event handling without needing a real browser or a running server, making tests fast enough to run in the hundreds during a typical CI run.',
        'bUnit does NOT test actual browser rendering, CSS layout, or JavaScript interop behavior beyond what you explicitly mock — visual regressions, CSS issues, and real browser-specific quirks require a genuine browser-based E2E tool (Playwright) rather than bUnit.',
        'Testing a component in isolation with bUnit means mocking its dependencies (injected services, cascading parameters) explicitly via the TestContext — this isolation is a feature, letting you verify one component\'s logic without the overhead and flakiness of spinning up its entire dependency graph.',
        'A healthy testing strategy for a Blazor application uses bUnit extensively for fast, numerous unit/component tests, reserving a smaller number of Playwright E2E tests for critical user journeys that genuinely need to verify the full rendered application working end-to-end in a real browser.',
      ],
    },
    {
      heading: 'Snapshot and Semantic Markup Comparison in bUnit',
      points: [
        'cut.MarkupMatches() performs semantic HTML comparison rather than exact string matching — attribute order, insignificant whitespace, and self-closing tag variations are normalized before comparison, making tests resilient to cosmetic rendering differences that do not represent genuine behavioral changes.',
        'Snapshot-style testing (asserting a component\'s full rendered markup matches an expected string) is convenient for catching unintended markup changes, but can become brittle if used for every component — reserving full markup assertions for components where the exact rendered structure genuinely matters, and using targeted Find()-based assertions elsewhere, balances thoroughness against maintenance burden.',
        'bUnit\'s WaitForState() and WaitForAssertion() methods poll until a condition becomes true (or a timeout elapses) — essential for testing components with asynchronous behavior (data loading, debounced input) where a synchronous assertion immediately after rendering would run before the async operation has completed.',
        'Testing accessibility-relevant markup (ARIA attributes, semantic HTML elements) with bUnit\'s Find() and markup assertions helps catch accessibility regressions early in the development cycle, before they reach a manual or automated accessibility audit later in the process.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Basic component test',
      language: 'csharp',
      code: `using Bunit;
using Xunit;

public class CounterTests : TestContext
{
    [Fact]
    public void Counter_IncrementOnClick()
    {
        // Arrange & Act
        var cut = RenderComponent<Counter>();

        // Assert initial state
        cut.Find("p").TextContent.ShouldContain("0");

        // Simulate button click
        cut.Find("button").Click();

        // Assert after interaction
        cut.Find("p").TextContent.ShouldContain("1");
    }
}`
    },
    {
      label: 'Parameters and markup assertion',
      language: 'csharp',
      code: `[Fact]
public void Alert_RendersCorrectType()
{
    // Render with parameters
    var cut = RenderComponent<Alert>(p => p
        .Add(c => c.Type, "danger")
        .Add(c => c.Title, "Error!")
        .AddChildContent("<p>Something failed</p>"));

    // Semantic markup comparison (order-insensitive)
    cut.MarkupMatches(
        @"<div class=""alert alert-danger"">
              <strong>Error!</strong>
              <p>Something failed</p>
          </div>");
}`
    },
    {
      label: 'Mocking services',
      language: 'csharp',
      code: `public class ProductListTests : TestContext
{
    [Fact]
    public async Task ProductList_ShowsProducts()
    {
        // Arrange — register a fake service
        var fakeService = Substitute.For<IProductService>();
        fakeService.GetAllAsync().Returns(new List<Product>
        {
            new(1, "Widget A", 9.99m),
            new(2, "Gadget B", 19.99m)
        });
        Services.AddScoped<IProductService>(_ => fakeService);

        // Act
        var cut = RenderComponent<ProductList>();
        await cut.WaitForStateAsync(() => cut.FindAll("li").Count == 2);

        // Assert
        cut.FindAll("li").Count.ShouldBe(2);
        cut.Find("li:first-child").TextContent.ShouldContain("Widget A");
    }
}`
    },
    {
      label: 'JS Interop mocking',
      language: 'csharp',
      code: `[Fact]
public void ClipboardButton_CallsJSOnClick()
{
    // Setup JS interop mock
    JSInterop.Mode = JSRuntimeMode.Strict;
    JSInterop.SetupModule("./js/clipboard.js")
             .SetupVoid("copyText", "Hello World");

    var cut = RenderComponent<ClipboardButton>(p =>
        p.Add(c => c.Text, "Hello World"));

    // Act
    cut.Find("button").Click();

    // Assert the JS was called
    JSInterop.VerifyInvoke("copyText").Arguments.ShouldContain("Hello World");
}`
    },
  ];

  mistakes: CommonMistake[] = [
    {
      title: 'Not awaiting async component initialisation',
      wrong: 'var cut = RenderComponent<AsyncPage>();\ncut.Find("li"); // data not loaded yet',
      right: 'var cut = RenderComponent<AsyncPage>();\nawait cut.WaitForStateAsync(() => cut.FindAll("li").Count > 0);\ncut.Find("li");',
      explanation: 'Components with async OnInitializedAsync may not have rendered their data yet when RenderComponent returns. WaitForStateAsync polls until the condition is met.'
    },
    {
      title: 'Using ctx.Services after rendering',
      wrong: 'var cut = RenderComponent<MyComp>();\nctx.Services.AddScoped<IFoo, FooImpl>();',
      right: 'ctx.Services.AddScoped<IFoo, FooImpl>();\nvar cut = RenderComponent<MyComp>();',
      explanation: 'Services must be registered before rendering the component. The DI container is built when RenderComponent is called — additions after that are ignored.'
    },
    {
      title: 'Using strict markup comparison for dynamic content',
      wrong: 'cut.MarkupMatches("<div>@timestamp</div>");',
      right: 'cut.Find("div").TextContent.ShouldNotBeEmpty();\n// Or use a regex: cut.Markup.ShouldMatch(@"<div>\\d+</div>")',
      explanation: 'MarkupMatches is for stable HTML. For dynamic content like timestamps or random IDs, assert on specific stable properties rather than the entire markup string.'
    },
    {
      title: 'Forgetting to dispose TestContext',
      wrong: 'public class MyTests {\n    TestContext ctx = new(); // never disposed',
      right: 'public class MyTests : TestContext { } // inheriting auto-disposes\n// Or: using var ctx = new TestContext();',
      explanation: 'TestContext implements IDisposable. Inheriting from it in xUnit test classes handles disposal automatically. Otherwise, wrap in using or implement IDisposable on the test class.'
    },
    {
      title: 'Testing internal implementation details',
      wrong: '// Asserting on private fields or internal component state',
      right: '// Assert on rendered output and public component properties only',
      explanation: 'Implementation-detail tests break whenever the component is refactored. Test what the user sees (rendered HTML) and what the component exposes publicly.'
    },
  ];

  challenge: Challenge = {
    title: 'Test a Form Component',
    language: 'csharp',
    description: 'Write bUnit tests for a simple `<LoginForm>` component that has Email and InputText fields and a submit button. Test: (1) the form renders both fields, (2) submitting with empty fields shows validation messages, (3) a valid submit calls `OnLogin` EventCallback with the email. Use a TestContext and a fake OnLogin callback.',
    hints: [
      'Use cut.Find("input[type=email]").Change("test@test.com") to fill fields.',
      'Find a submit button with cut.Find("button[type=submit]").Click().',
      'Capture the EventCallback with a bool flag: bool loginCalled = false; then pass () => loginCalled = true.',
    ],
    starterCode: `// Tests/LoginFormTests.cs
using Bunit;
using Xunit;

public class LoginFormTests : TestContext
{
    [Fact]
    public void LoginForm_RendersEmailField()
    {
        // TODO
    }

    [Fact]
    public void LoginForm_ShowsValidationOnEmptySubmit()
    {
        // TODO
    }

    [Fact]
    public void LoginForm_CallsOnLoginWithEmail()
    {
        // TODO
    }
}`,
    solution: `public class LoginFormTests : TestContext
{
    [Fact]
    public void LoginForm_RendersEmailField()
    {
        var cut = RenderComponent<LoginForm>();
        cut.Find("input[type='email']").ShouldNotBeNull();
        cut.Find("input[type='password']").ShouldNotBeNull();
    }

    [Fact]
    public void LoginForm_ShowsValidationOnEmptySubmit()
    {
        var cut = RenderComponent<LoginForm>();
        cut.Find("button[type='submit']").Click();
        cut.FindAll(".validation-message").Count.ShouldBeGreaterThan(0);
    }

    [Fact]
    public void LoginForm_CallsOnLoginWithEmail()
    {
        string? capturedEmail = null;
        var cut = RenderComponent<LoginForm>(p => p
            .Add(c => c.OnLogin, (string email) => capturedEmail = email));

        cut.Find("input[type='email']").Change("test@example.com");
        cut.Find("input[type='password']").Change("password123");
        cut.Find("button[type='submit']").Click();

        capturedEmail.ShouldBe("test@example.com");
    }
}`
  };

  quiz: QuizQuestion[] = [
    { q: 'What does bUnit\'s RenderComponent<T>() return?', options: ['An HTML string', 'An IRenderedComponent<T> with DOM query methods', 'A Task<T>', 'A Browser page object'], answer: 1, explanation: 'RenderComponent<T>() renders the component headlessly and returns an IRenderedComponent<T> that exposes Find(), FindAll(), Markup, Instance, and event simulation methods.' },
    { q: 'How do you wait for an async component to finish loading?', options: ['Thread.Sleep(1000)', 'Task.Delay(1000)', 'cut.WaitForStateAsync(condition)', 'cut.Refresh()'], answer: 2, explanation: 'WaitForStateAsync polls the condition repeatedly (with a timeout) until it returns true. This is the correct way to wait for async OnInitializedAsync to populate data.' },
    { q: 'What is MarkupMatches used for?', options: ['Exact byte comparison', 'Semantic HTML assertion ignoring attribute order and whitespace', 'Asserting CSS class names', 'Comparing DOM trees across browsers'], answer: 1, explanation: 'MarkupMatches performs a semantic comparison — element structure and text content must match, but attribute order and insignificant whitespace differences are ignored.' },
    { q: 'When must you register services in TestContext?', options: ['After RenderComponent', 'Anytime during the test', 'Before RenderComponent', 'In the component constructor'], answer: 2, explanation: 'Services must be registered before calling RenderComponent. The DI container is built on first render — services added afterward are not available to the component.' },
    { q: 'Which bUnit API mocks IJSRuntime calls?', options: ['ctx.JsRuntime', 'ctx.JSInterop', 'ctx.JS.Setup()', 'ctx.Services.AddJSRuntime()'], answer: 1, explanation: 'ctx.JSInterop provides Setup(), SetupVoid(), and VerifyInvoke() to mock, configure return values, and assert on JS interop calls without a browser.' },
    { q: 'How does bUnit simulate a user click on a button inside a rendered component?', options: ['By raising a native browser event', 'By calling cut.Find("button").Click()', 'By invoking the component method directly', 'bUnit cannot simulate clicks'], answer: 1, explanation: 'cut.Find() locates the element, and the IElement extension methods (Click(), Change(), etc.) simulate the corresponding DOM event, triggering Blazor\'s event dispatch pipeline exactly as a real click would, including any associated event handler and re-render.' },
  ];

  qna: QnaItem[] = [
    { q: 'Can I test Blazor Server and WASM components with bUnit?', a: 'Yes. bUnit tests are render-mode-agnostic — the component class is tested in isolation without a SignalR circuit or WASM runtime. Components that use @rendermode in production still test the same underlying logic.' },
    { q: 'How do I test a component that uses NavigationManager?', a: 'bUnit\'s TestContext registers a FakeNavigationManager automatically. After triggering navigation in the component, check FakeNavigationManager.Uri to assert the correct URL was navigated to.' },
    { q: 'How do I test components with cascading parameters?', a: 'Wrap the component under test in a CascadingValue inside the test: `RenderComponent<MyComp>(p => p.AddCascadingValue(new Theme { IsDark = true }))` or register the value on the test context.' },
    { q: 'Should I use bUnit or Playwright for Blazor testing?', a: 'Both serve different purposes. bUnit tests component logic in isolation — fast, no browser, ideal for unit and integration tests. Playwright tests the full app end-to-end in a real browser — slower, but catches integration issues between components and the server. Use bUnit for the majority of tests and Playwright for critical end-to-end paths.' },
    { q: 'How do I assert that a component raised an EventCallback with the expected argument?', a: 'Pass a delegate when rendering: `var received = default(int); var cut = RenderComponent<Counter>(p => p.Add(c => c.OnCountChanged, v => received = v));` then trigger the action and assert on the captured variable. This verifies the component correctly invokes its EventCallback parameter with the right value, without needing a real parent component.' },
    { q: 'How do I test a component that depends on an injected typed HttpClient?', a: 'Register a fake or mocked HttpMessageHandler with the test context\'s service collection before rendering: `ctx.Services.AddHttpClient("api").ConfigurePrimaryHttpMessageHandler(() => fakeHandler);` This lets you control HTTP responses deterministically in the test without making real network calls, keeping bUnit tests fast and isolated.' },
  ];
}
