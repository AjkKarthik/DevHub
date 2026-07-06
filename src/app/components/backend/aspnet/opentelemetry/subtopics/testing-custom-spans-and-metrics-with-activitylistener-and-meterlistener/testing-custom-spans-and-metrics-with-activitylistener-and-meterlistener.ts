import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-testing-otel-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
    TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './testing-custom-spans-and-metrics-with-activitylistener-and-meterlistener.html',
  styleUrl: './testing-custom-spans-and-metrics-with-activitylistener-and-meterlistener.scss',
})
export class TestingCustomSpansAndMetricsWithActivitylistenerAndMeterlistenerSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'None of the Main Page\'s Own Custom Spans or Metrics Are Ever Verified',
      points: [
        'The "Custom Spans" and "Custom Metrics" code tabs create real Activity and Counter/Histogram instances, but nothing on this page ever proves they actually record the tags, status, or measurements the code intends — verifying this normally seems to require a real exporter and a running Jaeger or Prometheus instance. It doesn\'t: System.Diagnostics.ActivityListener and System.Diagnostics.Metrics.MeterListener are built specifically to observe telemetry directly in-process, with no exporter, no collector, and no external backend involved at all — exactly the tool a unit test needs.',
        'An ActivityListener, once added via ActivitySource.AddActivityListener(), receives a callback for every Activity started and stopped by a MATCHING ActivitySource (filtered via ShouldListenTo) — a test can capture the Activity in that callback and assert on its Tags, Status, and any recorded exceptions after the code under test runs. A MeterListener works the same way for Counter/Histogram/ObservableGauge measurements via a measurement event callback.',
      ],
    },
    {
      heading: 'Why This Proves Something a Mock Never Could',
      points: [
        'Mocking ActivitySource or Meter directly isn\'t really possible in any useful way — StartActivity() and CreateCounter() are ordinary instance methods on infrastructure types, and the whole point of testing instrumentation is to prove the REAL Activity/Counter/Histogram objects the production code creates actually receive the correct data. ActivityListener and MeterListener sit at the framework level BELOW the OTel SDK\'s exporters — they observe exactly what any real exporter would see, without needing one running.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'ActivityListener — capturing tags, status, and exceptions',
      language: 'csharp',
      code: `[Fact]
public async Task ProcessAsync_Records_Order_Tags_And_Ok_Status()
{
    Activity? captured = null;
    using var listener = new ActivityListener
    {
        ShouldListenTo = source => source.Name == "OrderApi",
        Sample = (ref ActivityCreationOptions<ActivityContext> _) => ActivitySamplingResult.AllData,
        ActivityStopped = activity => captured = activity,
    };
    ActivitySource.AddActivityListener(listener);

    var service = new OrderService();
    var order = await service.ProcessAsync(new CreateOrderRequest { CustomerId = "cust-1", Items = [] });

    Assert.NotNull(captured);
    Assert.Equal("ProcessOrder", captured!.OperationName);
    Assert.Equal("cust-1", captured.GetTagItem("order.customer_id"));
    Assert.Equal(ActivityStatusCode.Ok, captured.Status);
}

[Fact]
public async Task ProcessAsync_Records_Exception_And_Error_Status_On_Failure()
{
    Activity? captured = null;
    using var listener = new ActivityListener
    {
        ShouldListenTo = source => source.Name == "OrderApi",
        Sample = (ref ActivityCreationOptions<ActivityContext> _) => ActivitySamplingResult.AllData,
        ActivityStopped = activity => captured = activity,
    };
    ActivitySource.AddActivityListener(listener);

    var service = new OrderService(throwOnCreate: true);
    await Assert.ThrowsAsync<InvalidOperationException>(
        () => service.ProcessAsync(new CreateOrderRequest()));

    Assert.Equal(ActivityStatusCode.Error, captured!.Status);
    Assert.Contains(captured.Events, e => e.Name == "exception");
}`,
    },
    {
      label: 'MeterListener — capturing custom counter measurements',
      language: 'csharp',
      code: `[Fact]
public async Task ProcessAsync_Increments_OrdersPlaced_Counter()
{
    var measurements = new List<long>();
    using var listener = new MeterListener();
    listener.InstrumentPublished = (instrument, l) =>
    {
        if (instrument.Meter.Name == "OrderApi" && instrument.Name == "orders.placed")
            l.EnableMeasurementEvents(instrument);
    };
    listener.SetMeasurementEventCallback<long>((instrument, measurement, tags, state) =>
        measurements.Add(measurement));
    listener.Start();

    var service = new OrderService();
    await service.ProcessAsync(new CreateOrderRequest { CustomerTier = "gold" });

    Assert.Single(measurements);
    Assert.Equal(1, measurements[0]);
}`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A teammate writes an ActivityListener test but forgets to set <code>Sample</code> to return <code>ActivitySamplingResult.AllData</code> (leaving the default), and the test\'s captured variable stays null even though the production code clearly calls StartActivity(). What is the most likely cause, and how does this connect to the main page\'s own "Not registering the ActivitySource with AddSource()" mistake?',
    hint: 'StartActivity() returning null in production because of a missing AddSource() and a TEST\'s listener never firing because of a missing or wrong Sample callback are two DIFFERENT causes that produce the SAME symptom — no Activity.',
    solution: `Without an explicit Sample callback returning AllData (or at least
PropagationData), the ActivityListener's default sampling decision is
effectively "don't sample" — meaning ActivitySource.StartActivity()
returns null even though the ActivitySource itself is correctly matched
by ShouldListenTo. This produces the exact same OBSERVABLE symptom as
the main page's own "Not registering the ActivitySource with
AddSource()" mistake (StartActivity() returns null), but for a
completely different root cause: in production, it's a missing
AddSource() registration; in this test, it's a missing or incorrect
Sample delegate on the ActivityListener itself.

This is worth remembering as a general debugging principle for OTel
instrumentation: "StartActivity() returned null" is a symptom with
MULTIPLE possible causes — an unregistered source, no listener attached
at all, or (as here) a listener that's attached but whose sampling
callback doesn't opt into recording. Fixing this specific test requires
adding a Sample delegate returning AllData to the ActivityListener,
which is unrelated to anything AddSource()-related in the production
code.`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'testing custom OpenTelemetry spans and metrics requires running a real exporter and inspecting output sent to Jaeger, Prometheus, or the OTel Collector.',
      reality: 'System.Diagnostics.ActivityListener and System.Diagnostics.Metrics.MeterListener observe Activities and measurements directly in-process, with no exporter or external backend involved at all — exactly what a unit test needs.',
    },
    {
      thought: 'if an ActivityListener test\'s captured Activity variable stays null, the production code must have the same "unregistered ActivitySource" bug the main page\'s own Common Mistake describes.',
      reality: 'a test\'s ActivityListener can ALSO produce a null Activity if its own Sample callback doesn\'t return AllData (or PropagationData) — the same symptom, a completely different and test-specific cause.',
    },
    {
      thought: 'custom Counter and Histogram instruments can\'t really be tested without a full metrics-exporting pipeline running.',
      reality: 'MeterListener\'s measurement event callback captures every measurement recorded by a matching instrument directly, with no exporter needed — the same in-process observation technique ActivityListener provides for traces.',
    },
  ];
}
