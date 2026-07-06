import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-otel-settag-sampling-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
    TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './settag-guards-against-null-not-against-a-sampled-out-span.html',
  styleUrl: './settag-guards-against-null-not-against-a-sampled-out-span.scss',
})
export class SettagGuardsAgainstNullNotAgainstASampledOutSpanSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'IsAllDataRequested Is a Third State Between "No Span" and "Fully Recorded Span"',
      points: [
        'Every SetTag call throughout this page\'s own examples uses the null-conditional operator — activity?.SetTag("order.customer_id", req.CustomerId) — which correctly guards against the Common Mistake this page already documents: an unregistered ActivitySource makes StartActivity() return null. But a NON-NULL Activity can still be one the sampler decided NOT to fully record — Activity.IsAllDataRequested is false in that case (the span still propagates trace context to children, but its tags/attributes are discarded, not exported). The null-conditional operator says nothing about this state; activity?.SetTag(...) still executes and computes whatever value it\'s given, even when IsAllDataRequested is false and the result is thrown away.',
        'This matters most when the VALUE being tagged is expensive to compute — not simple property reads like req.CustomerId (as in the main page\'s own example, which is cheap regardless), but something like serializing a full request object to JSON for a tag, or querying an additional field just to attach it as trace metadata. In a high-throughput API sampled at, say, 10%, 90% of requests would still pay the full cost of that expensive computation only to have IsAllDataRequested silently discard it.',
      ],
    },
    {
      heading: 'The Fix — Check IsAllDataRequested Before Expensive Tag Computation',
      points: [
        'Guard expensive tag values with an explicit check: if (activity is { IsAllDataRequested: true }) before computing and setting the value. Cheap tags (the main page\'s own examples) don\'t need this guard at all, since the wasted work of a simple property read is negligible either way. The guard only pays for itself when the computation itself has a real cost.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Proving the expensive computation runs even when sampled out',
      language: 'csharp',
      code: `[Fact]
public async Task Expensive_Tag_Computation_Still_Runs_Even_When_Sampled_Out_Without_A_Guard()
{
    var expensiveComputationCount = 0;

    using var listener = new ActivityListener
    {
        ShouldListenTo = source => source.Name == "OrderApi",
        // Forces "record context, but don't collect full data" —
        // Activity is non-null, but IsAllDataRequested is false.
        SampleUsingParentId = (ref ActivityCreationOptions<string> _) => ActivitySamplingResult.PropagationData,
        Sample = (ref ActivityCreationOptions<ActivityContext> _) => ActivitySamplingResult.PropagationData,
    };
    ActivitySource.AddActivityListener(listener);

    string ExpensiveSerialize(object payload)
    {
        Interlocked.Increment(ref expensiveComputationCount);
        return JsonSerializer.Serialize(payload);   // stand-in for genuinely expensive work
    }

    using var activity = Telemetry.Source.StartActivity("ProcessOrder");

    // BUG: computes the expensive value regardless of IsAllDataRequested.
    activity?.SetTag("order.full_payload", ExpensiveSerialize(new { Id = 1, Name = "Widget" }));

    Assert.False(activity!.IsAllDataRequested);   // sampled out of full data
    Assert.Equal(1, expensiveComputationCount);   // ...yet the expensive work still ran
}`,
    },
    {
      label: 'The fix — skip the expensive computation entirely when sampled out',
      language: 'csharp',
      code: `[Fact]
public async Task Guarding_With_IsAllDataRequested_Skips_The_Expensive_Computation_When_Sampled_Out()
{
    var expensiveComputationCount = 0;
    // ... same listener setup forcing PropagationData ...

    using var activity = Telemetry.Source.StartActivity("ProcessOrder");

    if (activity is { IsAllDataRequested: true })
    {
        activity.SetTag("order.full_payload", ExpensiveSerialize(new { Id = 1, Name = "Widget" }));
    }

    Assert.False(activity!.IsAllDataRequested);
    Assert.Equal(0, expensiveComputationCount);   // guarded — never computed at all
}`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A teammate proposes guarding EVERY SetTag call on this page — including the cheap ones like <code>activity?.SetTag("order.customer_id", req.CustomerId)</code> — with an IsAllDataRequested check, reasoning "consistency is good, and it can\'t hurt." Is this actually worth doing for every tag, or just the expensive ones?',
    hint: 'Weigh the cost of the CHECK ITSELF (a boolean property read) against the cost of the WORK it\'s guarding — a cheap property access versus something like JSON serialization or a database query.',
    solution: `It's not worth it for cheap tags, and can arguably make the code
slightly worse. The IsAllDataRequested check itself has a small but
nonzero cost (a property read plus a branch) — for a tag value that's
already cheap to compute (req.CustomerId is just a property access,
exactly like the main page's own examples), the guard adds overhead
without saving anything meaningful, since SetTag() being called with an
already-computed cheap value and then discarded internally costs about
the same as checking IsAllDataRequested first.

The guard earns its keep specifically when the VALUE COMPUTATION itself
is expensive — serialization, a database round-trip, string
concatenation over a large collection, reflection-based property
enumeration. For those cases, skipping the computation entirely when
IsAllDataRequested is false is a genuine savings, since the alternative
is doing real work only to have OpenTelemetry throw the result away.
The right rule: reserve the guard for tags whose computation cost is
non-trivial; leave the main page's own simple property-access tags
exactly as written.`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'activity?.SetTag(...) using the null-conditional operator is sufficient to avoid wasted work when a span isn\'t being fully recorded.',
      reality: 'the null-conditional operator only guards against a NULL Activity (an unregistered ActivitySource, the main page\'s own Common Mistake). A non-null Activity can still have IsAllDataRequested == false when sampling decided to propagate context but not collect full data — SetTag still runs and still computes whatever value it\'s given in that case.',
    },
    {
      thought: 'IsAllDataRequested and a null Activity represent the same underlying situation — no span is being recorded either way.',
      reality: 'they are different states: a null Activity means no listener is even tracking this source at all; a non-null Activity with IsAllDataRequested == false means a span EXISTS and propagates trace context to children, but its attributes are discarded rather than exported.',
    },
    {
      thought: 'guarding tag computation with an IsAllDataRequested check is a universally good practice worth applying to every SetTag call for consistency.',
      reality: 'the guard only pays for itself when the tag\'s VALUE is expensive to compute — for cheap property-access tags like the main page\'s own examples, the guard\'s own overhead is comparable to just computing and discarding the cheap value directly.',
    },
  ];
}
