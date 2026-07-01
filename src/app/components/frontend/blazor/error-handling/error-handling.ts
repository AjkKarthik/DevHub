import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../components/shared/page-meta/page-meta';
import { QuickRefComponent, QuickRefItem } from '../../../../components/shared/quick-ref/quick-ref';
import { TheoryBlockComponent, TheoryPoint } from '../../../../components/shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../components/shared/code-block/code-block';
import { CommonMistakesComponent, CommonMistake } from '../../../../components/shared/common-mistakes/common-mistakes';
import { ChallengeBlockComponent, Challenge } from '../../../../components/shared/challenge-block/challenge-block';
import { QuizBlockComponent, QuizQuestion } from '../../../../components/shared/quiz-block/quiz-block';
import { QnaBlockComponent, QnaItem } from '../../../../components/shared/qna-block/qna-block';
import { RevisionCardComponent, RevisionSummary } from '../../../../components/shared/revision-card/revision-card';
import { PageCompleteComponent } from '../../../../components/shared/page-complete/page-complete';

@Component({
  selector: 'app-blazor-error-handling',
  standalone: true,
  imports: [PageMetaComponent, QuickRefComponent, TheoryBlockComponent, CodeBlockComponent,
    CommonMistakesComponent, ChallengeBlockComponent, QuizBlockComponent, QnaBlockComponent,
    RevisionCardComponent, PageCompleteComponent],
  templateUrl: './error-handling.html',
  styleUrl: './error-handling.scss'
})
export class BlazorErrorHandling {
  quickRef: QuickRefItem[] = [
    { name: 'ErrorBoundary', type: 'keyword', desc: 'Catches unhandled exceptions in its component subtree.' },
    { name: 'ErrorBoundary.Recover()', type: 'method', desc: 'Resets the boundary and re-renders after an error.' },
    { name: '<ErrorContent>', type: 'syntax', desc: 'Template shown when ErrorBoundary catches an exception.' },
    { name: 'ILogger<T>', type: 'interface', desc: 'Structured logging interface — always inject and use.' },
    { name: 'ProblemDetails', type: 'class', desc: 'RFC 7807 error response format for API errors.' },
    { name: 'app.UseExceptionHandler()', type: 'method', desc: 'Global exception middleware for HTTP responses.' },
    { name: 'CircuitHandler.OnUnhandledExceptionAsync()', type: 'method', desc: 'Last-resort exception hook for Blazor Server.' },
    { name: 'app.UseStatusCodePagesWithRedirects()', type: 'method', desc: 'Redirect HTTP 4xx/5xx to custom error pages.' },
  ];

  theory: TheoryPoint[] = [
    {
      heading: 'ErrorBoundary — component-level isolation',
      points: ['Wrap any section of your UI with `<ErrorBoundary>` to prevent a single component\'s exception from crashing the entire page. The boundary catches synchronous and asynchronous exceptions from its child subtree. Provide an `<ErrorContent>` slot to show a user-friendly message and a Recover button that calls `boundary.Recover()` to reset the boundary and retry rendering.',
      'ErrorBoundary isolates failures to a subtree — the rest of the page keeps working.', 'Covers OnInitializedAsync, event handlers, and render-time exceptions.', 'Recover() clears the error state and re-renders the children.', 'Does NOT catch exceptions in OnAfterRender or Dispose.']
    },
    {
      heading: 'Logging with ILogger',
      points: ['Inject `ILogger<T>` into any component or service. Use structured logging: `logger.LogError(ex, "Failed to load product {ProductId}", id)` — property names in the message template become queryable fields in your log aggregator (Seq, Application Insights, Elastic). Never log sensitive data (passwords, PII). Use log levels appropriately: Debug for dev noise, Information for key events, Warning for recoverable issues, Error for failures, Critical for app-breaking faults.',
      'ILogger<T> is registered automatically by the host.', 'Structured logging with {PropertyName} tokens is searchable.', 'Log at the appropriate level — Error for exceptions, Warning for recoverable issues.', 'Never log passwords, tokens, or PII.']
    },
    {
      heading: 'Global exception handling',
      points: ['For HTTP errors on server-rendered pages, use `app.UseExceptionHandler("/Error")` with a custom Error page. For Blazor Server, unhandled exceptions that escape all ErrorBoundaries terminate the circuit — implement a custom `CircuitHandler.OnUnhandledExceptionAsync()` to log them. For WASM, unhandled exceptions terminate the WASM runtime instance — the user must reload.',
      'app.UseExceptionHandler maps unhandled HTTP exceptions to an error page.', 'Blazor Server: unhandled exception kills the circuit — user sees the reconnect overlay.', 'CircuitHandler.OnUnhandledExceptionAsync is the last-resort log hook for Server.', 'On WASM, an unhandled exception crashes the runtime — reload is required.']
    },
    {
      heading: 'ErrorBoundary Scope and Composition',
      points: [
        'An ErrorBoundary only catches exceptions thrown by its CHILD content during rendering or synchronous event handling — it does not catch exceptions thrown in its own code, in parent components, or in unrelated sibling component trees, so placement matters for what a given boundary actually protects.',
        'Multiple ErrorBoundary components can be nested at different levels of granularity — a boundary around an entire page provides a coarse fallback, while boundaries around individual widgets let one broken widget fail gracefully without taking down the surrounding page content.',
        'Calling ErrorBoundary.Recover() (available via a reference to the boundary) lets you programmatically reset a boundary after displaying an error, allowing the user to retry the failed operation without needing a full page reload — useful for transient failures like a temporarily unavailable API.',
        'Logging the exception captured by an ErrorBoundary (via its RecursiveTemplate or the exception passed to a custom fallback content template) ensures errors are still tracked in your monitoring system even though the user sees a graceful fallback UI instead of a raw error page.',
      ],
    },
    {
      heading: 'Global Exception Handling Beyond ErrorBoundary',
      points: [
        'Unhandled exceptions in fire-and-forget async void event handlers (a common Blazor anti-pattern) do not propagate to an ErrorBoundary at all — they surface as an unhandled task exception that can crash a Blazor Server circuit entirely, making async Task (not async void) the required pattern for event handlers that might throw.',
        'AppDomain.UnhandledException and TaskScheduler.UnobservedTaskException provide a last-resort, application-wide safety net for exceptions that escape all other handling — useful for logging genuinely unexpected failures, though by the time an exception reaches this level, the application state is likely already compromised.',
        'Structured logging of caught exceptions (including correlation IDs matching what the user sees in a friendly error message) bridges the gap between a clean user-facing error experience and the detailed diagnostic information engineers need to actually investigate and fix the underlying issue.',
        'Distinguishing between exceptions worth catching and gracefully handling (an expected API timeout) versus exceptions that indicate a genuine programming bug (a null reference from unexpected state) helps decide where to add explicit try/catch versus where to let an ErrorBoundary or global handler catch it as a true unexpected failure.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'ErrorBoundary',
      language: 'csharp',
      code: `<!-- Wrap risky content -->
<ErrorBoundary @ref="boundary">
    <ChildContent>
        <ProductList CategoryId="@selectedId" />
    </ChildContent>
    <ErrorContent Context="ex">
        <div class="error-box">
            <p>Failed to load products: @ex.Message</p>
            <button @onclick="() => boundary!.Recover()">Retry</button>
        </div>
    </ErrorContent>
</ErrorBoundary>

@code {
    private ErrorBoundary? boundary;
    private int selectedId = 1;

    private void ChangeCategory(int id)
    {
        selectedId = id;
        boundary?.Recover(); // reset on navigation
    }
}`
    },
    {
      label: 'Structured logging',
      language: 'csharp',
      code: `@inject ILogger<OrderPage> Logger

@code {
    private async Task PlaceOrder(Order order)
    {
        try
        {
            await OrderService.CreateAsync(order);
            Logger.LogInformation("Order {OrderId} placed by {UserId}",
                order.Id, order.UserId);
        }
        catch (OutOfStockException ex)
        {
            Logger.LogWarning(ex, "Out of stock for product {ProductId}",
                order.ProductId);
            errorMessage = "Product is out of stock.";
        }
        catch (Exception ex)
        {
            Logger.LogError(ex, "Unexpected error placing order {OrderId}",
                order.Id);
            errorMessage = "An unexpected error occurred.";
        }
    }
}`
    },
    {
      label: 'Global error page (Program.cs)',
      language: 'csharp',
      code: `// Program.cs
if (!app.Environment.IsDevelopment())
{
    app.UseExceptionHandler("/Error");
    app.UseStatusCodePagesWithRedirects("/error/{0}");
}

// Error.razor
@page "/Error"
@using Microsoft.AspNetCore.Diagnostics

@code {
    [CascadingParameter]
    private HttpContext? HttpContext { get; set; }

    private string? errorMessage;

    protected override void OnInitialized()
    {
        var feature = HttpContext?.Features.Get<IExceptionHandlerPathFeature>();
        errorMessage = app.Environment.IsDevelopment()
            ? feature?.Error.Message
            : "An unexpected error occurred.";
    }
}`
    },
    {
      label: 'Circuit exception handler',
      language: 'csharp',
      code: `public class GlobalCircuitHandler(ILogger<GlobalCircuitHandler> logger)
    : CircuitHandler
{
    public override Task OnUnhandledExceptionAsync(
        Circuit circuit,
        Exception exception,
        CancellationToken cancellationToken)
    {
        logger.LogError(exception,
            "Unhandled circuit exception on circuit {CircuitId}",
            circuit.Id);
        return Task.CompletedTask;
    }
}

// Program.cs
builder.Services.AddScoped<CircuitHandler, GlobalCircuitHandler>();`
    },
  ];

  mistakes: CommonMistake[] = [
    {
      title: 'Not providing an ErrorContent template',
      wrong: '<ErrorBoundary><DataGrid /></ErrorBoundary>',
      right: '<ErrorBoundary>\n    <ChildContent><DataGrid /></ChildContent>\n    <ErrorContent Context="ex"><p>Error: @ex.Message</p></ErrorContent>\n</ErrorBoundary>',
      explanation: 'Without ErrorContent, Blazor shows its default generic error message. Always provide a user-friendly fallback UI so users know what happened and how to recover.'
    },
    {
      title: 'Swallowing exceptions without logging',
      wrong: 'catch (Exception) { errorMessage = "Something went wrong."; }',
      right: 'catch (Exception ex) { Logger.LogError(ex, "Failed to load data"); errorMessage = "Something went wrong."; }',
      explanation: 'Swallowing exceptions silently makes debugging extremely difficult. Always log the full exception with structured context before hiding it from the user.'
    },
    {
      title: 'Letting unhandled exceptions kill the Blazor Server circuit',
      wrong: '// No ErrorBoundary or try-catch in event handler',
      right: '// Wrap in ErrorBoundary and/or try-catch in all event handlers',
      explanation: 'On Blazor Server, an unhandled exception in an event handler terminates the circuit. All users on that circuit see a "reconnecting" overlay. Always handle exceptions gracefully.'
    },
    {
      title: 'Showing detailed exception messages in production',
      wrong: '<ErrorContent Context="ex"><p>@ex.StackTrace</p></ErrorContent>',
      right: '<ErrorContent Context="ex"><p>Something went wrong. Please try again.</p></ErrorContent>',
      explanation: 'Stack traces and exception details expose internal implementation details to attackers. Log the full exception server-side and show a generic message to users.'
    },
    {
      title: 'Not resetting ErrorBoundary when navigating',
      wrong: '// ErrorBoundary stays in error state after category change',
      right: 'private void ChangeCategory(int id) { selectedId = id; boundary?.Recover(); }',
      explanation: 'Once an ErrorBoundary catches an exception, it stays in error state until Recover() is called. Always reset the boundary when the user takes a corrective action.'
    },
  ];

  challenge: Challenge = {
    title: 'Resilient Data Loader',
    language: 'csharp',
    description: 'Build a `<DataLoader>` component that wraps any child content. It should: show a loading spinner during the initial data fetch, catch any exception with an ErrorBoundary, show an error message with a Retry button on failure, and log the error with ILogger. Test it with a service that randomly throws 50% of the time.',
    hints: [
      'Track loading and error states with private bool fields.',
      'Call the load method in OnInitializedAsync and catch exceptions there.',
      'Use ErrorBoundary only for component render errors; try-catch handles service errors.',
    ],
    starterCode: `@inject ILogger<DataLoader> Logger

<!-- TODO: show loading, data, or error state -->

@code {
    [Parameter] public RenderFragment? ChildContent { get; set; }
    private bool isLoading = true;
    private Exception? error;
    // TODO: load data, handle errors
}`,
    solution: `@inject ILogger<DataLoader> Logger
@inject IDataService DataService

@if (isLoading)
{
    <p>Loading...</p>
}
else if (error is not null)
{
    <div>
        <p>Error: @error.Message</p>
        <button @onclick="Load">Retry</button>
    </div>
}
else
{
    @ChildContent
}

@code {
    [Parameter] public RenderFragment? ChildContent { get; set; }
    private bool isLoading = true;
    private Exception? error;

    protected override async Task OnInitializedAsync() => await Load();

    private async Task Load()
    {
        isLoading = true;
        error = null;
        try
        {
            await DataService.LoadAsync();
        }
        catch (Exception ex)
        {
            Logger.LogError(ex, "DataLoader failed to load");
            error = ex;
        }
        finally
        {
            isLoading = false;
        }
    }
}`
  };

  quiz: QuizQuestion[] = [
    { q: 'What does ErrorBoundary protect?', options: ['HTTP errors', 'Exceptions in its component subtree', 'SignalR connection drops', 'Null reference errors in services'], answer: 1, explanation: 'ErrorBoundary catches unhandled exceptions from components rendered inside it, preventing the error from propagating and crashing the whole page.' },
    { q: 'What method resets an ErrorBoundary after an error?', options: ['Reset()', 'Retry()', 'Recover()', 'Clear()'], answer: 2, explanation: 'boundary.Recover() clears the error state and re-renders the child content, allowing the component to attempt rendering again.' },
    { q: 'What happens on Blazor Server when an exception is unhandled?', options: ['The page reloads', 'The circuit terminates', 'An error page is shown', 'The exception is silently ignored'], answer: 1, explanation: 'An unhandled exception on Blazor Server terminates the circuit. The user sees the reconnect overlay. Always use ErrorBoundary and try-catch to prevent this.' },
    { q: 'Which logging level is correct for a caught and handled exception?', options: ['Critical', 'Debug', 'Warning or Error depending on severity', 'Information'], answer: 2, explanation: 'Warning is for recoverable issues the app handled gracefully. Error is for failures that require attention but didn\'t crash the app. Critical is for catastrophic failures.' },
    { q: 'Where should you log exceptions — server or browser?', options: ['Browser console only', 'Server-side logs only', 'Both — but sensitive details only server-side', 'Neither — show full error to users'], answer: 2, explanation: 'Log full exception details server-side. You can also log to the browser console for development, but never send stack traces or sensitive info to the client in production.' },
    { q: 'What is the correct way to handle an OperationCanceledException when a Blazor component is disposed during an async operation?', options: ['Rethrow it as an unhandled exception', 'Catch it and ignore it — this is expected when navigation happens mid-await', 'Log it as a critical error', 'Show an error boundary'], answer: 1, explanation: 'When a user navigates away from a component that is mid-await, the component\'s CancellationToken is cancelled and the await throws OperationCanceledException. This is expected, not a bug. Catch it in OnInitializedAsync and return silently — do not bubble it up to crash the circuit.' },
  ];

  qna: QnaItem[] = [
    { q: 'Can ErrorBoundary catch exceptions from async operations?', a: 'Yes. ErrorBoundary catches exceptions from async lifecycle methods (OnInitializedAsync, OnParametersSetAsync) and async event handlers. It does not catch exceptions from OnAfterRenderAsync, Dispose, or background threads.' },
    { q: 'What is the difference between UseExceptionHandler and ErrorBoundary?', a: 'UseExceptionHandler is ASP.NET Core middleware for HTTP-level errors — it handles exceptions from Minimal APIs, MVC actions, and Static SSR pages. ErrorBoundary is a Blazor component for catching exceptions within interactive component trees. Both are needed in a full Blazor app.' },
    { q: 'How do I prevent showing error details to production users?', a: 'Check IWebHostEnvironment.IsDevelopment() before exposing exception details. In ErrorContent, always show a generic "something went wrong" message. Log the full exception server-side via ILogger for developer investigation.' },
    { q: 'Should I wrap every component with ErrorBoundary?', a: 'No — only wrap components where failure is expected and isolatable (data grids, third-party widgets, optional content sections). Global ErrorBoundary in the layout catches anything else. Over-wrapping makes error recovery logic harder to reason about.' },
    { q: 'What is an ErrorBoundary in Blazor, and what does it NOT catch?',
      a: 'An ErrorBoundary component wraps child content and catches unhandled exceptions thrown during rendering or in synchronous event handlers within its subtree, displaying fallback UI instead of crashing the entire component tree or circuit. It does NOT catch exceptions thrown in code that runs outside the normal Blazor render/event pipeline — such as exceptions in a fire-and-forget async Task that is not awaited, or exceptions thrown inside JS interop callbacks invoked asynchronously without being routed back through a tracked Blazor operation.' },
    { q: 'Why does an unhandled exception in Blazor Server potentially terminate the entire user session, unlike Blazor WASM?',
      a: 'In Blazor Server, an unhandled exception that escapes the component tree (not caught by an ErrorBoundary) can terminate the SignalR circuit entirely, disconnecting the user and requiring a full page reload to reconnect — since the server-side circuit represents the live, stateful connection for that user\'s session. In Blazor WASM, an unhandled exception is more contained to the browser tab\'s JavaScript/WASM runtime and does not have an equivalent "circuit" to tear down, though it can still leave the UI in a broken, unresponsive state depending on where the exception occurred.' },
  ];

  revision: RevisionSummary = {
    oneLiner: 'Blazor error handling uses ErrorBoundary to isolate component failures, ILogger for structured logging, and CircuitHandler for last-resort exception logging on Server circuits.',
    mustKnow: [
      'ErrorBoundary catches exceptions in its subtree — the rest of the page keeps working.',
      'Provide <ErrorContent> for user-friendly messages and a Recover() button.',
      'Unhandled exceptions kill the Blazor Server circuit — always handle in event handlers.',
      'ILogger<T> for structured logging — always include context properties, never PII.',
      'Never show stack traces or internal details in production error UIs.',
      'UseExceptionHandler middleware handles HTTP-level errors; ErrorBoundary handles Blazor.',
    ],
    interviewFocus: [
      'What is the difference between ErrorBoundary and UseExceptionHandler?',
      'What happens to a Blazor Server circuit when an exception is unhandled?',
      'How do you log exceptions with structured context in Blazor?',
    ]
  };
}
