import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-activatorutilities-bypasses-validateonbuild-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
    TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './activatorutilities-bypasses-validateonbuild.html',
  styleUrl: './activatorutilities-bypasses-validateonbuild.scss',
})
export class ActivatorutilitiesCreateinstanceBypassesValidateonbuildEntirelySubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page lists <code>ActivatorUtilities.CreateInstance&lt;T&gt;()</code> as a quick-ref item alongside <code>ValidateOnBuild</code> — but the two are not compatible safety mechanisms',
      points: [
        'The main Dependency Injection page\'s quick reference includes both <code>ActivatorUtilities.CreateInstance&lt;T&gt;()</code> (for constructing a type that mixes DI-resolved dependencies with manually-supplied arguments — e.g. a plugin or handler type instantiated per-request with request-specific data) and <code>ValidateOnBuild=true</code> (which the page\'s own "Disposal, validation, and production hardening" section describes as walking the ENTIRE registered dependency graph at startup, so any missing registration throws immediately instead of at first use). These sound like they compose into full startup-time safety — they do NOT.',
      ],
    },
    {
      heading: '<code>ValidateOnBuild</code> can only walk constructors that the CONTAINER ITSELF calls during normal resolution — it has no visibility into a type ONLY ever constructed via ActivatorUtilities',
      points: [
        '<code>ValidateOnBuild</code> works by attempting to construct one instance of every SERVICE REGISTERED in the container, recursively resolving each constructor parameter from the registered graph. A type that is NEVER directly registered — because it is only ever created on demand via <code>ActivatorUtilities.CreateInstance&lt;PluginHandler&gt;(provider, extraArg)</code> inside application code — is simply not part of that walk. <code>ValidateOnBuild</code> has no way to know such a call site even exists, let alone verify that <code>PluginHandler</code>\'s DI-resolvable constructor parameters (as opposed to the manually-supplied <code>extraArg</code>) are actually registered.',
        'The practical consequence: a <code>PluginHandler</code> whose constructor takes an unregistered service will pass <code>dotnet run</code>, pass <code>ValidateOnBuild</code>, pass every existing integration test that doesn\'t happen to exercise that exact plugin path, and only throw the very first time a real request actually triggers that specific plugin — potentially in production, days after deployment.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'A plugin type constructed via ActivatorUtilities — invisible to ValidateOnBuild',
      language: 'csharp',
      code: `public interface IReportFormatter { string Format(ReportData data); }

public class PdfReportFormatter : IReportFormatter
{
    public string Format(ReportData data) => "...";
}

// PluginHandler mixes a DI-resolved dependency (IReportFormatter) with a
// manually-supplied argument (the plugin's own config, known only at the
// call site, not at startup):
public class CsvExportPlugin
{
    private readonly IReportFormatter _formatter;
    private readonly PluginConfig _config;

    // BUG SEEDED HERE: IAuditLogger is never registered anywhere in
    // Program.cs — a genuine missing registration:
    public CsvExportPlugin(IReportFormatter formatter, IAuditLogger auditLogger, PluginConfig config)
    {
        _formatter = formatter;
        _config = config;
    }

    public string Export(ReportData data) => _formatter.Format(data);
}

// Program.cs:
builder.Services.AddScoped<IReportFormatter, PdfReportFormatter>();
// NOTE: IAuditLogger is NOT registered — a real, easy-to-miss omission.
builder.Services.AddOptions<PluginConfig>();

var app = builder.Build();   // ValidateOnBuild=true is ON — build succeeds cleanly.
app.Run();`,
    },
    {
      label: 'Why ValidateOnBuild misses this — and exactly when the bug actually surfaces',
      language: 'csharp',
      code: `// Somewhere in application code — the exact call site that actually
// constructs CsvExportPlugin, using ActivatorUtilities because
// 'config' is only known at THIS point, not at DI-registration time:
public class PluginRunner
{
    private readonly IServiceProvider _provider;

    public PluginRunner(IServiceProvider provider) => _provider = provider;

    public string RunCsvExport(ReportData data, PluginConfig config)
    {
        // ActivatorUtilities.CreateInstance<T>() resolves IReportFormatter
        // and IAuditLogger FROM THE CONTAINER, and passes 'config' through
        // as the extra manually-supplied argument. CsvExportPlugin is
        // NEVER itself registered as a service — there is no
        // 'services.AddScoped<CsvExportPlugin>()' anywhere:
        var plugin = ActivatorUtilities.CreateInstance<CsvExportPlugin>(_provider, config);
        return plugin.Export(data);
    }
}

// TIMELINE OF THIS BUG IN PRACTICE:
//
// 1. 'dotnet build' — succeeds. This is a runtime DI concern, not a
//    compile-time one; the compiler has no idea IAuditLogger isn't
//    registered.
//
// 2. 'var app = builder.Build()' with ValidateOnBuild=true — succeeds.
//    CsvExportPlugin was NEVER added to the container via any
//    'AddXxx<CsvExportPlugin>()' call, so it is not part of the
//    registered graph ValidateOnBuild walks. IReportFormatter alone
//    (which IS registered and IS reachable) validates fine.
//
// 3. Every integration test that exercises OTHER plugins, OTHER
//    endpoints, or the CSV export path with a DIFFERENT code path that
//    doesn't happen to call PluginRunner.RunCsvExport(...) — all pass.
//
// 4. The FIRST real request that actually triggers the CSV export
//    plugin calls ActivatorUtilities.CreateInstance<CsvExportPlugin>(...),
//    which attempts to resolve IAuditLogger from the container, finds
//    no registration, and throws InvalidOperationException:
//    "Unable to resolve service for type 'IAuditLogger' while
//    attempting to activate 'CsvExportPlugin'." — in production,
//    potentially days after this code shipped, the first time a user
//    actually exports to CSV.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'Given that <code>ValidateOnBuild</code> cannot see into <code>ActivatorUtilities.CreateInstance&lt;T&gt;()</code> call sites, propose a concrete way to catch the missing <code>IAuditLogger</code> registration BEFORE it reaches production — without simply "writing more integration tests and hoping to cover every plugin path."',
    hint: 'Consider that ActivatorUtilities.CreateInstance itself, called eagerly, would surface the same missing-registration exception immediately — the question is how to trigger that call for EVERY plugin type during a fast, targeted check rather than relying on real request traffic to eventually reach each one.',
    solution: `The most direct fix is a dedicated "plugin activation smoke test" that
explicitly calls ActivatorUtilities.CreateInstance<T>() for EVERY known
plugin type, using a real (or realistically-configured) IServiceProvider,
specifically to force each plugin's constructor dependencies to resolve
during a fast test run rather than waiting for production traffic to reach
it:

[Fact]
public void AllPlugins_CanBeActivatedViaActivatorUtilities()
{
    var services = new ServiceCollection();
    // ... register the SAME services as the real Program.cs ...
    services.AddScoped<IReportFormatter, PdfReportFormatter>();
    // (IAuditLogger is STILL missing here on purpose, to prove the test
    // catches it — in the real fix, you'd add the missing registration)

    var provider = services.BuildServiceProvider();

    var knownPluginTypes = new[] { typeof(CsvExportPlugin), typeof(PdfExportPlugin), /* ... */ };
    var dummyConfig = new PluginConfig();

    foreach (var pluginType in knownPluginTypes)
    {
        // This directly reproduces the EXACT resolution ActivatorUtilities
        // performs in production — if IAuditLogger (or any other DI
        // dependency) is missing, this throws HERE, in a fast unit test,
        // rather than on a real user's first CSV export:
        var ex = Record.Exception(() =>
            ActivatorUtilities.CreateInstance(provider, pluginType, dummyConfig));

        Assert.Null(ex);
    }
}

This does not require exhaustively testing every BEHAVIOR of every plugin —
it only needs to prove that CONSTRUCTION succeeds, which is exactly the gap
ValidateOnBuild leaves open. The broader principle: any type constructed
exclusively via ActivatorUtilities (or any other path outside the
container's own registered graph) needs its OWN explicit activation check,
because the container's built-in ValidateOnBuild safety net simply does not
extend to it.`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'enabling ValidateOnBuild=true guarantees every DI-constructed type in the application will have its dependencies verified at startup.',
      reality: 'ValidateOnBuild only walks types that are themselves REGISTERED in the container — a type constructed exclusively via ActivatorUtilities.CreateInstance<T>() is invisible to that walk, since it was never added via AddScoped/AddTransient/AddSingleton in the first place.',
    },
    {
      thought: 'a missing DI registration for a type used only inside ActivatorUtilities.CreateInstance<T>() will be caught the first time ANY endpoint or plugin is exercised in testing.',
      reality: 'it is only caught the first time the SPECIFIC call site using that specific type is exercised — other tests covering different plugins or endpoints provide zero coverage for this gap, since each ActivatorUtilities call site is independent.',
    },
    {
      thought: 'ActivatorUtilities.CreateInstance<T>() and the container\'s normal service resolution (GetRequiredService<T>()) are validated by the same safety mechanisms.',
      reality: 'ValidateOnBuild specifically walks the REGISTERED graph reachable via normal resolution — ActivatorUtilities bypasses registration entirely for the target type itself, even though it still resolves that type\'s DI-eligible constructor parameters from the container at the moment CreateInstance is actually called.',
    },
  ];
}
