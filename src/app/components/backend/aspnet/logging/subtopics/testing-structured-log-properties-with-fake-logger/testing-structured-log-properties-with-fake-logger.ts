import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-testing-structured-log-properties-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
    TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './testing-structured-log-properties-with-fake-logger.html',
  styleUrl: './testing-structured-log-properties-with-fake-logger.scss',
})
export class TestingStructuredLogPropertiesWithFakeLoggerSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page\'s own Common Mistakes section shows the CORRECT structured-template form — but nothing on the page actually PROVES the property names arrive intact',
      points: [
        'The main Logging page repeatedly emphasizes writing <code>_logger.LogInformation("Order {OrderId} placed by {UserId}", order.Id, order.UserId)</code> instead of string interpolation, specifically because named holes become independently queryable structured properties. But a typo in a template — swapping <code>{OrderId}</code> for <code>{OrdrId}</code>, or passing the arguments in the WRONG ORDER relative to the template holes — compiles cleanly, runs cleanly, and produces a log line that LOOKS right when printed to console, while silently breaking the structured property that a Seq or Elasticsearch query depends on.',
      ],
    },
    {
      heading: 'A test double implementing ILogger<T> can capture the ACTUAL structured key-value pairs passed to a log call, not just the rendered message string',
      points: [
        'The <code>ILogger.Log&lt;TState&gt;()</code> method receives its structured state as an <code>IReadOnlyList&lt;KeyValuePair&lt;string, object&gt;&gt;</code> (via the internal <code>FormattedLogValues</code> type) — this is EXACTLY the same shape a real sink like Seq or Application Insights consumes to build queryable fields. A hand-written fake <code>ILogger&lt;T&gt;</code> that implements <code>Log&lt;TState&gt;()</code> and records that state list lets a test assert the SPECIFIC property name and value that were actually captured — catching a template/argument mismatch that the rendered message string alone would hide.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'A fake ILogger<T> that captures the actual structured state, not just the rendered string',
      language: 'csharp',
      code: `using Microsoft.Extensions.Logging;

public class FakeLogger<T> : ILogger<T>
{
    public List<(LogLevel Level, IReadOnlyList<KeyValuePair<string, object>> State)> Entries { get; } = new();

    public IDisposable? BeginScope<TState>(TState state) where TState : notnull => null;
    public bool IsEnabled(LogLevel logLevel) => true;

    public void Log<TState>(LogLevel logLevel, EventId eventId, TState state,
        Exception? exception, Func<TState, Exception?, string> formatter)
    {
        // 'state' implements IReadOnlyList<KeyValuePair<string, object>> for
        // every standard LogXxx() call — this is the SAME structured data a
        // real sink like Seq or Application Insights would index. Capturing
        // it directly (rather than only the rendered message string) is
        // what lets a test verify property NAMES and VALUES independently:
        if (state is IReadOnlyList<KeyValuePair<string, object>> structured)
            Entries.Add((logLevel, structured));
    }

    // Convenience accessor for a specific named property on the most
    // recent matching log entry:
    public object? GetProperty(string name) =>
        Entries.LastOrDefault().State?
            .FirstOrDefault(kv => kv.Key == name).Value;
}`,
    },
    {
      label: 'Testing that OrderService.CreateAsync logs the CORRECT property name and value — catching a template/argument mismatch',
      language: 'csharp',
      code: `public class OrderServiceLoggingTests
{
    [Fact]
    public async Task CreateAsync_LogsOrderIdAsAStructuredProperty()
    {
        var fakeLogger = new FakeLogger<OrderService>();
        var service = new OrderService(fakeLogger /* ...other deps... */);

        var order = await service.CreateAsync(new CreateOrderRequest { CustomerId = "cust-42" });

        // This does NOT just check that "some message containing the order
        // id" was logged — it checks that the STRUCTURED PROPERTY named
        // exactly "OrderId" carries the correct value. If a future edit
        // renamed the template hole to {OrdrId} (a typo) while leaving the
        // rendered message text looking correct, this assertion — not a
        // console-output eyeball check — is what catches it:
        var orderIdProperty = fakeLogger.GetProperty("OrderId");
        Assert.Equal(order.Id, orderIdProperty);
    }

    [Fact]
    public async Task PaymentFailure_LogsExceptionAsStructuredData_NotJustMessageText()
    {
        var fakeLogger = new FakeLogger<OrderService>();
        var failingGateway = new ThrowingPaymentGateway(new PaymentException("Card declined"));
        var service = new OrderService(fakeLogger, failingGateway);

        await Assert.ThrowsAsync<PaymentException>(() =>
            service.CreateAsync(new CreateOrderRequest { CustomerId = "cust-99" }));

        // The main page's own guidance is "pass the Exception as the FIRST
        // argument, not ex.Message" — this test proves that guidance is
        // actually followed, by checking the log entry's {OriginalFormat}
        // and structured properties directly, rather than trusting that a
        // reviewer would catch a regression back to string concatenation:
        var errorEntry = fakeLogger.Entries.Last(e => e.Level == LogLevel.Error);
        var customerIdProperty = errorEntry.State
            .FirstOrDefault(kv => kv.Key == "CustomerId").Value;
        Assert.Equal("cust-99", customerIdProperty);
    }
}`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'The main page\'s own <code>[LoggerMessage]</code> source-generated example (<code>LogOrderCreated(_logger, order.Id, req.CustomerId)</code>) is a DIFFERENT code path from the direct <code>_logger.LogInformation(...)</code> calls shown in this subtopic. Explain whether the <code>FakeLogger&lt;T&gt;</code> shown here can also capture structured properties from a source-generated log call, and why or why not.',
    hint: 'Consider what a [LoggerMessage]-generated static partial method actually does under the hood — does it call some alternate logging pipeline, or does it eventually call the SAME ILogger.Log<TState>() method every direct LogXxx() call uses?',
    solution: `Yes — it works identically, and this is worth understanding explicitly. The
[LoggerMessage] source generator does NOT invent a separate logging
pipeline; the method it generates internally calls the exact same
ILogger.Log<TState>() method that every direct LogInformation()/LogError()
call goes through. The generated code performs the level check first (its
main performance benefit), and if the level is enabled, it constructs a
structured state object and calls logger.Log(...) — the SAME interface
method the FakeLogger<T> in this subtopic implements.

This means the SAME FakeLogger<T> test double, and the SAME
GetProperty("OrderId")-style assertions, work equally well whether the
service under test uses direct LogXxx() calls or [LoggerMessage]
source-generated methods — there is no need for a different test double or
a different assertion style depending on which logging approach a service
happens to use. The only practical difference a test might need to account
for is that source-generated methods take the logger as an explicit first
parameter (LogOrderCreated(_logger, ...)) rather than being called as an
instance method (_logger.LogInformation(...)) — but the structured state
captured by the FakeLogger is shaped identically either way.`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'a test that asserts on the rendered log MESSAGE STRING (e.g. "Order 42 created for customer cust-42") is sufficient to verify structured logging is working correctly.',
      reality: 'the rendered string looks correct even when the underlying structured property NAME is wrong (e.g. a typo\'d template hole) — only asserting on the actual key-value pairs passed to ILogger.Log<TState>() catches a template/argument mismatch that a sink like Seq or Elasticsearch would silently mis-index.',
    },
    {
      thought: 'testing structured log output requires a real logging sink like Seq or Application Insights running in the test environment.',
      reality: 'a lightweight hand-written fake implementing ILogger<T>.Log<TState>() captures the exact same structured state a real sink would receive, with no external dependency and no network calls — the state IS the structured data, independent of where it eventually gets written.',
    },
    {
      thought: '[LoggerMessage] source-generated log calls need a different testing approach than direct LogXxx() calls, since they go through a specially-generated method.',
      reality: 'the generated method still calls the same underlying ILogger.Log<TState>() method — the same fake logger and the same property-name assertions work identically for both, since [LoggerMessage] only changes HOW the level check and allocation happen, not WHERE the structured state ultimately goes.',
    },
  ];
}
