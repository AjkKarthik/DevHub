import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-otel-exporter-guard-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
    TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './otel-exporter-needs-endpoint-guard-when-running-outside-apphost.html',
  styleUrl: './otel-exporter-needs-endpoint-guard-when-running-outside-apphost.scss',
})
export class OtelExporterNeedsEndpointGuardWhenRunningOutsideApphostSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page\'s own "Service Defaults" code tab shows ConfigureOpenTelemetry() as a simplified illustration and states elsewhere that "the same ServiceDefaults code works" in production, reading the OTLP endpoint from an environment variable — but never addresses what happens when a service built this way runs with NO OTLP endpoint configured at all, which happens routinely, not just in production',
      points: [
        'When the AppHost launches a service, it injects <code>OTEL_EXPORTER_OTLP_ENDPOINT</code> pointing at the dashboard\'s own OTLP receiver — this is WHY the page\'s theory says traces "flow to the Aspire dashboard via OTLP" automatically. But a developer routinely runs a SINGLE service project directly — <code>dotnet run</code> from the API project\'s own folder to quickly check something, or running its unit/integration tests directly — completely BYPASSING the AppHost, and therefore with that environment variable simply absent.',
        'Whether this is harmless or a problem depends entirely on whether the OTel configuration code UNCONDITIONALLY calls <code>.AddOtlpExporter()</code> or GUARDS it behind a check for the endpoint actually being present. The main page\'s own illustrative code shows a bare <code>.AddOtlpExporter()</code> call inside <code>ConfigureOpenTelemetry()</code> with no visible guard — meaning a developer who copies that EXACT pattern (rather than the actual, more defensive code Microsoft\'s official <code>dotnet new aspire-servicedefaults</code> template generates) can end up with an exporter configured to send data to an endpoint that was never set, which typically means an empty/default URI.',
      ],
    },
    {
      heading: 'The concrete failure mode is not usually a thrown exception at startup — OTLP exporters are generally designed to fail SILENTLY and asynchronously in the background (export attempts happen off the request path, so a bad endpoint just means spans/metrics quietly never arrive anywhere, sometimes logged only at a verbose internal diagnostic level nobody is watching) — which makes this a "nothing is obviously broken, but you get zero observability data" problem rather than a crash',
      points: [
        'This is a particularly easy trap to fall into precisely BECAUSE it fails quietly: the service starts fine, responds to requests fine, and only the ABSENCE of an expected signal (no traces show up somewhere, or a background export error appears only in verbose diagnostic logging most developers never enable) reveals anything is wrong — there\'s no obvious "OTel is broken" moment forcing a fix.',
        'The robust pattern — matching what Microsoft\'s actual generated ServiceDefaults template does — wraps the OTLP exporter registration in an explicit check for the endpoint environment variable\'s presence, falling back to a no-op (or a console exporter for local visibility) when it is absent. This makes the SAME <code>AddServiceDefaults()</code> call behave correctly whether the service is launched by the AppHost (endpoint present, exports to the dashboard), run standalone for quick debugging (endpoint absent, no wasted export attempts), or deployed to production (endpoint present, pointing at a real APM backend) — one code path, three environments, no silent data loss and no wasted background work in any of them.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'The unguarded version — matches the main page\'s own illustrative code',
      language: 'csharp',
      code: `// The main page's own "Service Defaults" code tab shows this shape:
public static class Extensions
{
    public static IHostApplicationBuilder AddServiceDefaults(
        this IHostApplicationBuilder builder)
    {
        builder.ConfigureOpenTelemetry();   // <-- what does this ACTUALLY do?
        builder.AddDefaultHealthChecks();
        builder.Services.AddServiceDiscovery();
        return builder;
    }

    // A NAIVE, unguarded implementation someone might reasonably write,
    // copying the "it just works" framing from the theory without
    // realizing there's a conditional check missing:
    private static void ConfigureOpenTelemetry(this IHostApplicationBuilder builder)
    {
        builder.Services.AddOpenTelemetry()
            .WithTracing(tracing => tracing
                .AddAspNetCoreInstrumentation()
                .AddHttpClientInstrumentation()
                .AddOtlpExporter())   // <-- unconditional, no endpoint check
            .WithMetrics(metrics => metrics
                .AddAspNetCoreInstrumentation()
                .AddOtlpExporter());  // <-- same issue here
    }
}

// Running via the AppHost: OTEL_EXPORTER_OTLP_ENDPOINT is injected by
// Aspire — works exactly as the main page describes.

// Running standalone for a quick check:
//   cd MyApp.Api && dotnet run
// OTEL_EXPORTER_OTLP_ENDPOINT is NOT SET. AddOtlpExporter() configures
// against its default endpoint (typically http://localhost:4317) —
// which may not exist, may be some UNRELATED process, or may just
// silently fail every export attempt in the background. The app
// itself runs and responds normally; only observability data is
// affected, and usually invisibly so.`,
    },
    {
      label: 'The guarded version — matches Microsoft\'s actual generated template, and a test proving it',
      language: 'csharp',
      code: `private static void ConfigureOpenTelemetry(this IHostApplicationBuilder builder)
{
    var otlpEndpoint = builder.Configuration["OTEL_EXPORTER_OTLP_ENDPOINT"];
    var hasOtlpEndpoint = !string.IsNullOrWhiteSpace(otlpEndpoint);

    builder.Services.AddOpenTelemetry()
        .WithTracing(tracing =>
        {
            tracing.AddAspNetCoreInstrumentation()
                   .AddHttpClientInstrumentation();

            if (hasOtlpEndpoint)
                tracing.AddOtlpExporter();       // only when a real endpoint exists
            else if (builder.Environment.IsDevelopment())
                tracing.AddConsoleExporter();    // local visibility, no network calls
        })
        .WithMetrics(metrics =>
        {
            metrics.AddAspNetCoreInstrumentation()
                   .AddRuntimeInstrumentation();

            if (hasOtlpEndpoint)
                metrics.AddOtlpExporter();
        });
}

// A test proving the guard actually prevents wasted export attempts
// when run standalone — using a test-only TracerProvider inspection:
[Fact]
public void ConfigureOpenTelemetry_Skips_OtlpExporter_When_Endpoint_Unset()
{
    var builder = Host.CreateApplicationBuilder();
    // Deliberately ensure the endpoint variable is NOT present,
    // simulating a standalone "dotnet run" outside the AppHost:
    Environment.SetEnvironmentVariable("OTEL_EXPORTER_OTLP_ENDPOINT", null);

    builder.AddServiceDefaults();
    using var host = builder.Build();

    var tracerProvider = host.Services.GetRequiredService<TracerProvider>();
    // Inspect the configured exporter processors — asserting that no
    // OTLP-bound export pipeline was registered when the endpoint is
    // absent (exact inspection API varies by OTel SDK version, but the
    // principle — asserting on WHAT got registered, not just "it built
    // without throwing" — is what actually verifies the guard works):
    Assert.False(TracerProviderHasOtlpExporter(tracerProvider));
}
// The unguarded version would pass a "it builds without throwing" test
// just as easily as the guarded version — only an assertion on WHICH
// exporter got registered actually distinguishes the two.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A teammate proposes a simpler fix than checking for the OTLP endpoint\'s presence: wrap the OTLP exporter registration in a try/catch and silently swallow any exception it throws at startup. Evaluate whether this achieves the same outcome as the endpoint-presence check shown in this subtopic, considering WHEN and WHERE OTLP export failures actually occur.',
    hint: 'This subtopic\'s theory states OTLP exporters are "designed to fail silently and asynchronously in the background" rather than throwing at the point of AddOtlpExporter() being called. Does a try/catch around the REGISTRATION call have anything to actually catch?',
    solution: `The try/catch approach does not achieve the same outcome, because it
targets the wrong moment in the exporter's lifecycle. AddOtlpExporter()
itself, called during service configuration, typically does not throw
just because the target endpoint is unreachable or unset — it merely
REGISTERS an exporter configured to send data to that endpoint LATER,
whenever a trace or metric is actually ready to export. The actual
network attempt (and its potential failure) happens asynchronously, in
a background export pipeline, well after startup has completed and
the try/catch block around the registration call has long since
exited. There is nothing for that try/catch to actually catch — the
registration call itself succeeds regardless of whether the endpoint
is valid, reachable, or even syntactically well-formed in many cases.

This matches exactly the "fails silently and asynchronously" behavior
this subtopic's theory describes: the failure, if it occurs at all,
happens deep inside the OTel SDK's own background export logic, is
often only surfaced via the SDK's internal self-diagnostics event
source (which most applications never wire up to their own logging),
and has no natural point where a simple try/catch at the call site
could intercept it.

The endpoint-presence check shown in this subtopic works because it
changes the DECISION of whether to even attempt OTLP export in the
first place, made once, synchronously, at configuration time, using
information (is the environment variable set) that IS reliably
available synchronously — rather than trying to react to an
asynchronous failure that happens somewhere else, at an unpredictable
later time, through a code path a simple try/catch around the initial
registration call has no visibility into at all. The general
principle: guard against a KNOWN-ABSENT precondition (no endpoint
configured) at the point the choice is made, rather than trying to
catch the DOWNSTREAM failure that absence eventually causes, especially
when that downstream failure happens asynchronously in code you don't
control.`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'AddOtlpExporter() throws an exception at startup if the OTLP endpoint it would export to is missing, unreachable, or invalid, making the problem immediately visible.',
      reality: 'OTLP exporters are typically designed to fail silently and asynchronously — the registration call succeeds regardless of endpoint validity, and actual export attempts (and their failures) happen in a background pipeline well after startup, often surfaced only through internal SDK diagnostics that most applications never wire up to visible logging.',
    },
    {
      thought: 'wrapping an OTLP exporter registration call in a try/catch is an adequate way to handle the case where no OTLP endpoint is configured.',
      reality: 'the registration call itself typically does not throw for a missing or invalid endpoint — the actual network failure happens asynchronously in a background export pipeline, well outside the scope of any try/catch placed around the initial AddOtlpExporter() call, so this approach has nothing to actually catch.',
    },
    {
      thought: 'because the main page states "the same ServiceDefaults code works" across local Aspire development and production, any OTel configuration code copied from its illustrative example is safe to run in every environment, including standalone outside the AppHost entirely.',
      reality: 'that guarantee depends on the OTel configuration code explicitly checking for the OTLP endpoint\'s presence (as Microsoft\'s actual generated ServiceDefaults template does) — the main page\'s own simplified illustrative code omits this guard, and copying it literally can leave standalone runs (a quick dotnet run, a test host) configured to export to a nonexistent endpoint with no visible error.',
    },
  ];
}
