import { Component } from '@angular/core';
import { PageMetaComponent }      from '../../../shared/page-meta/page-meta';
import { QuickRefComponent, QuickRefItem } from '../../../shared/quick-ref/quick-ref';
import { TheoryBlockComponent, TheoryPoint } from '../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../shared/code-block/code-block';
import { ChallengeBlockComponent, Challenge } from '../../../shared/challenge-block/challenge-block';
import { QuizBlockComponent, QuizQuestion } from '../../../shared/quiz-block/quiz-block';
import { QnaBlockComponent, QnaItem } from '../../../shared/qna-block/qna-block';
import { PageCompleteComponent } from '../../../shared/page-complete/page-complete';
import { CommonMistakesComponent, CommonMistake } from '../../../shared/common-mistakes/common-mistakes';
import { RevisionCardComponent, RevisionSummary } from '../../../shared/revision-card/revision-card';
import { PrerequisitesComponent, Prerequisite } from '../../../shared/prerequisites/prerequisites';

@Component({
  selector: 'app-aspnet-opentelemetry',
  standalone: true,
  imports: [PageMetaComponent, QuickRefComponent, TheoryBlockComponent, CodeBlockComponent,
            ChallengeBlockComponent, QuizBlockComponent, QnaBlockComponent, PageCompleteComponent,
            CommonMistakesComponent, RevisionCardComponent, PrerequisitesComponent],
  templateUrl: './opentelemetry.html',
  styleUrl: './opentelemetry.scss',
})
export class AspnetOpentelemetry {

  prerequisites: Prerequisite[] = [
    { label: 'Logging & Diagnostics', route: '/aspnet/logging' },
    { label: 'Health Checks & Observability', route: '/aspnet/health-checks' },
  ];

  quickRef: QuickRefItem[] = [
    { name: 'AddOpenTelemetry()',                   type: 'method',   desc: 'Registers OTel SDK. Chain .WithTracing(), .WithMetrics(), .WithLogging().' },
    { name: '.WithTracing(b => ...)',               type: 'method',   desc: 'Configures the tracing pipeline — instruments, samplers, and exporters.' },
    { name: '.WithMetrics(b => ...)',               type: 'method',   desc: 'Configures the metrics pipeline — instruments and exporters.' },
    { name: 'AddAspNetCoreInstrumentation()',       type: 'method',   desc: 'Auto-traces incoming HTTP requests with span attributes.' },
    { name: 'AddHttpClientInstrumentation()',       type: 'method',   desc: 'Auto-traces outgoing HttpClient calls.' },
    { name: 'AddEntityFrameworkCoreInstrumentation()', type: 'method', desc: 'Auto-traces EF Core queries as child spans.' },
    { name: 'AddOtlpExporter()',                    type: 'method',   desc: 'Exports traces/metrics via OTLP to Jaeger, Grafana Tempo, or the OTel Collector.' },
    { name: 'ActivitySource',                       type: 'class',    desc: 'Creates and starts Activity (span) instances for custom tracing.' },
    { name: 'Activity.Current',                     type: 'accessor', desc: 'The current in-flight Activity in the execution context.' },
    { name: 'Meter / Counter<T>',                   type: 'class',    desc: 'System.Diagnostics.Metrics API — create counters, histograms, gauges.' },
  ];

  theory: TheoryPoint[] = [
    {
      heading: 'The Three Pillars of Observability',
      points: ['Traces show the path of a request through a distributed system (latency, failures, call graph). Metrics are numeric time-series measurements (request rate, error rate, CPU). Logs are structured event records. OpenTelemetry (OTel) standardises all three: one SDK, one wire protocol (OTLP), any backend (Jaeger, Prometheus, Grafana, Datadog).'],
    },
    {
      heading: 'Traces and Spans',
      points: ['A trace is a tree of spans representing one end-to-end operation. Each span has a name, start/end time, status, and attributes (key-value metadata). Child spans are nested under parent spans — an HTTP request span contains a DB query span. In .NET, spans are implemented as Activity objects from System.Diagnostics.'],
    },
    {
      heading: 'Auto-Instrumentation',
      points: ['AddAspNetCoreInstrumentation() automatically creates spans for every incoming HTTP request, populating http.method, http.url, http.status_code, and more. AddHttpClientInstrumentation() traces outgoing calls. AddEntityFrameworkCoreInstrumentation() traces queries. These cover most of the trace data you need with zero manual work.'],
    },
    {
      heading: 'Custom Spans and Metrics',
      points: ['Create a static ActivitySource("MyService") and call StartActivity("OperationName") to instrument custom operations. For metrics, create a Meter("MyService") and add counters, histograms, or observable gauges. Name them following OpenTelemetry semantic conventions (e.g., http.server.request.duration, db.client.query.duration) so dashboards work out of the box.'],
    },
    {
      heading: 'Exporters and Collectors',
      points: ['Exporters send telemetry to a backend. AddOtlpExporter() speaks the OTLP protocol (gRPC or HTTP/protobuf) — compatible with Jaeger, Grafana Tempo, the OpenTelemetry Collector, and cloud providers. AddConsoleExporter() is useful for development. The OTel Collector is a separate process that receives, batches, and routes telemetry — use it to decouple your app from specific backends.'],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Setup',
      language: 'csharp',
      code: `// NuGet:
// OpenTelemetry.Extensions.Hosting
// OpenTelemetry.Instrumentation.AspNetCore
// OpenTelemetry.Instrumentation.Http
// OpenTelemetry.Exporter.OpenTelemetryProtocol

builder.Services.AddOpenTelemetry()
    .WithTracing(tracing => tracing
        .SetResourceBuilder(ResourceBuilder.CreateDefault()
            .AddService("OrderApi", serviceVersion: "1.0.0"))
        .AddAspNetCoreInstrumentation()
        .AddHttpClientInstrumentation()
        .AddEntityFrameworkCoreInstrumentation()
        .AddOtlpExporter(o =>
        {
            o.Endpoint = new Uri("http://otel-collector:4317");
            o.Protocol = OtlpExportProtocol.Grpc;
        }))
    .WithMetrics(metrics => metrics
        .AddAspNetCoreInstrumentation()
        .AddHttpClientInstrumentation()
        .AddPrometheusExporter());   // /metrics endpoint for Prometheus scraping

app.MapPrometheusScrapingEndpoint(); // exposes /metrics`,
    },
    {
      label: 'Custom Spans',
      language: 'csharp',
      code: `// Define once — static, reuse across the app
public static class Telemetry
{
    public static readonly ActivitySource Source = new("OrderApi", "1.0.0");
}

// In a service
public class OrderService
{
    public async Task<Order> ProcessAsync(CreateOrderRequest req)
    {
        using var activity = Telemetry.Source.StartActivity("ProcessOrder");
        activity?.SetTag("order.customer_id", req.CustomerId);
        activity?.SetTag("order.item_count",  req.Items.Count);

        try
        {
            var order = await CreateOrderAsync(req);
            activity?.SetTag("order.id", order.Id.ToString());
            activity?.SetStatus(ActivityStatusCode.Ok);
            return order;
        }
        catch (Exception ex)
        {
            activity?.SetStatus(ActivityStatusCode.Error, ex.Message);
            activity?.RecordException(ex);
            throw;
        }
    }
}`,
    },
    {
      label: 'Custom Metrics',
      language: 'csharp',
      code: `// Define once — static Meter
public static class OrderMetrics
{
    private static readonly Meter _meter = new("OrderApi", "1.0.0");

    public static readonly Counter<long> OrdersPlaced =
        _meter.CreateCounter<long>("orders.placed", "orders",
            "Total number of orders placed.");

    public static readonly Histogram<double> OrderProcessingDuration =
        _meter.CreateHistogram<double>("orders.processing.duration", "ms",
            "Time to process an order.");

    public static readonly ObservableGauge<int> PendingOrders =
        _meter.CreateObservableGauge<int>("orders.pending",
            () => GetPendingOrderCount(), "orders", "Current pending orders.");

    private static int GetPendingOrderCount() => /* query */ 42;
}

// Use in service
public async Task<Order> ProcessAsync(CreateOrderRequest req)
{
    var sw = Stopwatch.StartNew();
    var order = await CreateOrderAsync(req);
    OrderMetrics.OrdersPlaced.Add(1, new("customer.tier", req.CustomerTier));
    OrderMetrics.OrderProcessingDuration.Record(sw.Elapsed.TotalMilliseconds);
    return order;
}`,
    },
    {
      label: 'Structured Logging + OTel',
      language: 'csharp',
      code: `// OTel logging bridge — forwards ILogger to OTel log exporter
builder.Logging.AddOpenTelemetry(logging =>
{
    logging.IncludeFormattedMessage = true;
    logging.IncludeScopes = true;
    logging.AddOtlpExporter(o => o.Endpoint = new Uri("http://otel-collector:4317"));
});

// Structured log with trace correlation — OTel auto-injects TraceId/SpanId
public class OrderController(ILogger<OrderController> logger)
{
    public IActionResult PlaceOrder(OrderRequest req)
    {
        logger.LogInformation(
            "Order placed for customer {CustomerId} with {ItemCount} items",
            req.CustomerId, req.Items.Count);
        // Log record is automatically correlated with the current trace span
        return Ok();
    }
}`,
    },
    {
      label: '.NET Aspire Integration',
      language: 'csharp',
      code: `// In a .NET Aspire service: AddServiceDefaults() wires OTel automatically
builder.AddServiceDefaults(); // sets up tracing, metrics, health checks, resilience

// Aspire dashboard shows traces, metrics, and logs at http://localhost:15888

// Manually add service-specific instrumentation on top of defaults
builder.Services.AddOpenTelemetry()
    .WithTracing(t => t.AddSource("OrderApi"))  // register custom ActivitySource
    .WithMetrics(m => m.AddMeter("OrderApi")); // register custom Meter`,
    },
  ];

  mistakes: CommonMistake[] = [
    {
      title: 'Not registering the ActivitySource with AddSource()',
      wrong: `public static readonly ActivitySource Source = new("OrderApi");
// StartActivity() returns null — no spans recorded`,
      right: `// Register in WithTracing
.WithTracing(t => t.AddSource("OrderApi"))
// Now StartActivity() creates real spans`,
      explanation: 'The OTel SDK only traces ActivitySources that are registered with AddSource(). Without registration, StartActivity() returns null — no spans are created or exported.',
    },
    {
      title: 'Creating a new Meter or ActivitySource per request',
      wrong: `public async Task ProcessAsync()
{
    var meter = new Meter("OrderApi"); // new instance every call — leaks`,
      right: `// Static — created once for the app lifetime
public static readonly Meter _meter = new("OrderApi", "1.0.0");`,
      explanation: 'Meter and ActivitySource instances should be static singletons. Creating them per-request leaks memory and breaks metric aggregation.',
    },
    {
      title: 'Forgetting to dispose the Activity',
      wrong: `var activity = Telemetry.Source.StartActivity("Op");
await DoWorkAsync(); // if exception occurs, activity is never ended`,
      right: `using var activity = Telemetry.Source.StartActivity("Op");
await DoWorkAsync(); // disposed on exit or exception — span always ends`,
      explanation: 'Activity implements IDisposable. Calling Dispose() (via using) sets the end time and exports the span. Without it, spans may be truncated or never exported.',
    },
    {
      title: 'Exporting from every app instance directly to a backend',
      wrong: `// Each of 20 app instances exports directly to Jaeger
.AddOtlpExporter(o => o.Endpoint = new Uri("http://jaeger:4317"))`,
      right: `// Export to OTel Collector; Collector fans out to Jaeger, Prometheus, etc.
.AddOtlpExporter(o => o.Endpoint = new Uri("http://otel-collector:4317"))`,
      explanation: 'Exporting directly from many instances to a backend creates tight coupling and can overwhelm the backend. Route through the OTel Collector for batching, fan-out, and backend independence.',
    },
  ];

  challenge: Challenge = {
    title: 'Instrument an Order Endpoint',
    language: 'csharp',
    description: `Add OpenTelemetry tracing to an ASP.NET Core minimal API:
1. Register AddAspNetCoreInstrumentation() and AddConsoleExporter() (dev mode).
2. Create a static ActivitySource named "OrderApi".
3. In the POST /orders handler, start a custom span "PlaceOrder" and set a tag "order.amount" from the request.
4. Record an exception if one is thrown.`,
    hints: [
      'AddOpenTelemetry().WithTracing(t => t.AddAspNetCoreInstrumentation().AddSource("OrderApi").AddConsoleExporter())',
      'using var activity = Source.StartActivity("PlaceOrder")',
      'activity?.SetTag("order.amount", req.Amount)',
    ],
    starterCode: `public static class Telemetry
{
    public static readonly ActivitySource Source = new("OrderApi", "1.0.0");
}

// TODO: configure OTel in Program.cs
// TODO: POST /orders with custom span`,
    solution: `builder.Services.AddOpenTelemetry()
    .WithTracing(t => t
        .AddAspNetCoreInstrumentation()
        .AddSource("OrderApi")
        .AddConsoleExporter());

var app = builder.Build();

app.MapPost("/orders", async (OrderRequest req) =>
{
    using var activity = Telemetry.Source.StartActivity("PlaceOrder");
    activity?.SetTag("order.amount", req.Amount);
    try
    {
        await Task.Delay(10); // simulate work
        activity?.SetStatus(ActivityStatusCode.Ok);
        return Results.Ok(new { id = Guid.NewGuid(), amount = req.Amount });
    }
    catch (Exception ex)
    {
        activity?.SetStatus(ActivityStatusCode.Error, ex.Message);
        activity?.RecordException(ex);
        throw;
    }
});`,
  };

  quiz: QuizQuestion[] = [
    {
      q: 'Which three signals does OpenTelemetry standardise?',
      options: [
        'Requests, Responses, Errors',
        'Traces, Metrics, Logs',
        'Spans, Events, Counters',
        'Latency, Throughput, Errors',
      ],
      answer: 1,
      explanation: 'OpenTelemetry standardises Traces (request paths and latency), Metrics (numeric measurements), and Logs (structured event records).',
    },
    {
      q: 'What is a span in OpenTelemetry?',
      options: [
        'A metric measurement',
        'A log entry with a timestamp',
        'A single unit of work with start/end time, name, and attributes',
        'A network connection between services',
      ],
      answer: 2,
      explanation: 'A span represents one unit of work — a function call, HTTP request, or DB query — with start/end times, status, and key-value attributes.',
    },
    {
      q: 'What must you call in WithTracing() for a custom ActivitySource to record spans?',
      options: [
        '.AddService("name")',
        '.AddSource("ActivitySourceName")',
        '.EnableActivitySource()',
        '.RegisterSource()',
      ],
      answer: 1,
      explanation: 'AddSource("name") registers the ActivitySource with the OTel SDK. Without this, StartActivity() returns null and no spans are created.',
    },
    {
      q: 'Why should Meter and ActivitySource be static singletons?',
      options: [
        'They are thread-safe and must not be shared',
        'Creating them per-request leaks memory and breaks metric aggregation',
        'The OTel SDK only supports one instance per process',
        'Static instances are faster to JIT-compile',
      ],
      answer: 1,
      explanation: 'Meter and ActivitySource are infrastructure objects meant to be reused. Creating per-request instances leaks memory and aggregates metrics incorrectly.',
    },
    {
      q: 'What is the purpose of the OpenTelemetry Collector?',
      options: [
        'It replaces the OTel SDK in .NET apps',
        'It batches and routes telemetry from apps to multiple backends',
        'It provides a UI for viewing traces',
        'It generates automatic instrumentation for all frameworks',
      ],
      answer: 1,
      explanation: 'The OTel Collector is a standalone process that receives telemetry via OTLP, applies processors (batching, filtering, enrichment), and exports to one or more backends (Jaeger, Prometheus, Datadog, etc.).',
    },
  ];

  qna: QnaItem[] = [
    {
      q: 'What is the difference between Activity and ActivitySource?',
      a: 'ActivitySource is the factory — create one per library/service (static, named). Activity is a span instance — created by ActivitySource.StartActivity() and disposed when the operation ends. Think of ActivitySource as the logger factory and Activity as the individual logger instance.',
    },
    {
      q: 'How does OTel correlate logs with traces?',
      a: 'When logging is wired through the OTel logging bridge (AddOpenTelemetry() on ILoggingBuilder), each log record is automatically enriched with the current TraceId and SpanId from Activity.Current. In backends like Grafana, you can click a trace and jump to related logs and vice versa.',
    },
    {
      q: 'Does .NET Aspire wire up OpenTelemetry automatically?',
      a: 'Yes. Calling builder.AddServiceDefaults() in a .NET Aspire service configures OTel tracing, metrics, and logging with sensible defaults, exports to the Aspire dashboard (visible at localhost:15888), and wires up health checks and Polly resilience — all in one call.',
    },
    {
      q: 'How do I add baggage (cross-service context) to a trace?',
      a: 'Use Activity.Current?.AddBaggage("key", "value") to set propagated context. Baggage is transmitted in the traceparent/tracestate W3C headers and available in downstream services via Activity.Current?.GetBaggageItem("key"). Use sparingly — baggage adds overhead to every hop.',
    },
  ];

  revision: RevisionSummary = {
    oneLiner: 'OpenTelemetry standardises traces, metrics, and logs — auto-instrument with AddAspNetCoreInstrumentation, add custom spans via ActivitySource, and export via OTLP.',
    mustKnow: [
      'AddOpenTelemetry().WithTracing().WithMetrics() — chain instrumentation and exporters',
      'AddAspNetCoreInstrumentation() auto-traces HTTP requests; AddHttpClientInstrumentation() traces outgoing calls',
      'ActivitySource (static singleton) creates Activity (span) instances — register with AddSource()',
      'Always use using var activity = Source.StartActivity() — Dispose() ends the span',
      'Meter (static) creates Counter<T>, Histogram<T>, ObservableGauge<T>; register with AddMeter()',
      'Route telemetry through OTel Collector for batching and backend independence',
    ],
    interviewFocus: [
      'What are the three OTel signals and what each is used for',
      'Why ActivitySource must be registered with AddSource() for spans to appear',
      'Trace correlation with logs — how TraceId/SpanId are injected into log records',
      'OTel Collector role — why apps should export to the Collector, not directly to backends',
    ],
  };
}
