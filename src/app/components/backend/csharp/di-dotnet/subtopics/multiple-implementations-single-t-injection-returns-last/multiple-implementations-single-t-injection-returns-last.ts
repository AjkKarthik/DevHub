import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-multiple-implementations-single-t-injection-returns-last-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
    TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './multiple-implementations-single-t-injection-returns-last.html',
  styleUrl: './multiple-implementations-single-t-injection-returns-last.scss',
})
export class MultipleImplementationsSingleTInjectionReturnsLastSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page shows the "good" side of multiple registrations — IEnumerable&lt;T&gt; injection. This is the silent, less-obvious FLIP side',
      points: [
        'The main Dependency Injection page states: "multiple implementations of the same interface: all registrations are kept... injecting <code>IEnumerable&lt;T&gt;</code> resolves ALL registered implementations." That is correct and useful. But it easily creates the false impression that requesting a SINGLE, non-enumerable <code>T</code> (e.g. a constructor parameter typed as plain <code>INotificationSender</code>, not <code>IEnumerable&lt;INotificationSender&gt;</code>) will somehow error, or pick "the right one" — neither is true.',
      ],
    },
    {
      heading: 'Requesting a single T when MULTIPLE implementations are registered silently resolves to only the LAST one registered — no error, no warning',
      points: [
        'The .NET DI container keeps every registered <code>ServiceDescriptor</code> for a given service type, in registration order. When something asks for a SINGLE instance of that type (via constructor injection of the plain interface, or <code>GetService&lt;T&gt;()</code>/<code>GetRequiredService&lt;T&gt;()</code>), the container returns the LAST one registered — not the first, not some kind of "primary" designation, and critically: with absolutely NO compiler error, NO runtime warning, and NO exception. The earlier registrations are simply never constructed for that particular resolution path (though they ARE still constructed and returned correctly if something ELSE requests <code>IEnumerable&lt;T&gt;</code> instead).',
      ],
    },
    {
      heading: 'This becomes a REAL production bug specifically when registration order is affected by something innocuous, like assembly scanning or plugin load order',
      points: [
        'If registrations are added by hand in a fixed order in <code>Program.cs</code>, "last wins" is at least deterministic and (if noticed) intentional-looking. It becomes a genuine, hard-to-diagnose production bug when registrations come from automatic assembly scanning (e.g. <code>Scrutor</code>\'s <code>.Scan()</code>, or a plugin-loading loop over discovered assemblies) — the LAST type discovered, which can depend on file system ordering, assembly load order, or even just alphabetical discovery order, silently becomes the ONE implementation every single-T consumer in the entire application receives, while every OTHER registered implementation of that same interface is quietly never used at all by any single-T consumer.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Multiple registrations, single-T injection — silently gets ONLY the last one',
      language: 'csharp',
      code: `public interface INotificationSender
{
    Task SendAsync(string message);
}

public class EmailNotificationSender : INotificationSender
{
    public Task SendAsync(string message) => Task.CompletedTask; // sends email
}

public class SmsNotificationSender : INotificationSender
{
    public Task SendAsync(string message) => Task.CompletedTask; // sends SMS
}

var services = new ServiceCollection();
services.AddScoped<INotificationSender, EmailNotificationSender>();
services.AddScoped<INotificationSender, SmsNotificationSender>(); // registered SECOND

using var provider = services.BuildServiceProvider();

// A consumer that injects a SINGLE, plain INotificationSender:
public class OrderService
{
    private readonly INotificationSender _sender;
    public OrderService(INotificationSender sender) => _sender = sender;
}

var order = provider.GetRequiredService<OrderService>();
// order._sender is a SmsNotificationSender instance — the LAST one
// registered. EmailNotificationSender is never used by THIS consumer
// at all, with no error or warning anywhere that this happened.`,
    },
    {
      label: 'The "good" side the main page shows — IEnumerable<T> DOES get every implementation',
      language: 'csharp',
      code: `// Same two registrations as above — but THIS consumer asks for
// IEnumerable<INotificationSender> instead of a single T:
public class BroadcastNotifier
{
    private readonly IEnumerable<INotificationSender> _senders;
    public BroadcastNotifier(IEnumerable<INotificationSender> senders)
        => _senders = senders;

    public async Task NotifyAllAsync(string message)
    {
        foreach (var sender in _senders)
            await sender.SendAsync(message); // BOTH Email and Sms run
    }
}

var broadcaster = provider.GetRequiredService<BroadcastNotifier>();
// broadcaster._senders contains BOTH EmailNotificationSender AND
// SmsNotificationSender, in registration order — exactly as the
// main page describes. The difference is ENTIRELY about whether the
// CONSUMING constructor parameter type is "T" or "IEnumerable<T>" —
// the registrations themselves are identical in both examples.`,
    },
    {
      label: 'The safer alternative when only ONE implementation should ever be resolvable — TryAddSingleton / a factory',
      language: 'csharp',
      code: `// If EmailNotificationSender and SmsNotificationSender should NEVER
// both be registered as the "default" INotificationSender at once,
// use "TryAdd" — which only registers if NO implementation for that
// service type exists yet, making a second, conflicting registration
// a silent NO-OP instead of a silent "last wins":
services.TryAddScoped<INotificationSender, EmailNotificationSender>();
services.TryAddScoped<INotificationSender, SmsNotificationSender>();
// The Sms registration is SKIPPED because Email already claimed the
// slot — INotificationSender consistently resolves to Email everywhere.

// Or, if the choice genuinely needs to be dynamic (e.g. based on
// configuration), register a factory that explicitly picks one:
services.AddScoped<INotificationSender>(sp =>
{
    var config = sp.GetRequiredService<IConfiguration>();
    return config["Notifications:Channel"] == "sms"
        ? sp.GetRequiredService<SmsNotificationSender>()
        : sp.GetRequiredService<EmailNotificationSender>();
});
services.AddScoped<EmailNotificationSender>();
services.AddScoped<SmsNotificationSender>();
// Now the "which one wins" decision is explicit, visible, and testable
// — not an implicit side effect of registration order.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'Three plugin assemblies are scanned at startup, each registering their own <code>IReportExporter</code> implementation via <code>Scrutor</code>\'s <code>.Scan()</code>. A consumer injects a single, plain <code>IReportExporter</code>. Explain what determines which plugin\'s exporter actually runs, and why this is risky.',
    hint: 'Think about what "registration order" actually means when registrations come from scanning discovered assemblies, rather than from hand-written lines in Program.cs in a fixed, visible order.',
    solution: `// Three plugins, each with their own IReportExporter:
public class PdfReportExporter : IReportExporter { /* ... */ }
public class CsvReportExporter : IReportExporter { /* ... */ }
public class ExcelReportExporter : IReportExporter { /* ... */ }

// Scrutor scans and registers whatever it discovers, in whatever
// order the assemblies/types happen to be enumerated:
services.Scan(scan => scan
    .FromAssemblies(pluginAssemblies)
    .AddClasses(c => c.AssignableTo<IReportExporter>())
    .AsImplementedInterfaces()
    .WithScopedLifetime());

public class ReportService
{
    // A single, plain IReportExporter — NOT IEnumerable<IReportExporter>:
    public ReportService(IReportExporter exporter) { /* ... */ }
}

// Which plugin's exporter actually runs is determined by WHICHEVER
// registration Scrutor's scan happened to add LAST — and that order
// depends on things like the ORDER assemblies were passed to
// FromAssemblies(), and the reflection-based type-discovery order
// WITHIN each assembly (which .NET does not guarantee is source-code
// declaration order). This means the SAME plugin set, rebuilt with a
// different assembly reference order, or even just a different .NET
// runtime version's reflection enumeration behavior, could silently
// switch WHICH exporter every single-T consumer in the app receives
// — with no compiler error, no startup warning, and no test failure
// unless a test specifically asserts on exporter IDENTITY (e.g.
// "the resolved exporter IS a PdfReportExporter"), which most tests
// checking only "did SOME export happen" would never catch.
//
// The fix: register plugins as IEnumerable<IReportExporter> and have
// ReportService explicitly select the one it wants (e.g. by a
// discriminator property each plugin exposes), or use a keyed-service
// registration (.NET 8+) so each plugin's exporter is looked up by an
// explicit, unambiguous key rather than relying on registration order.`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'if multiple implementations of the same interface are registered, injecting a single T (not IEnumerable&lt;T&gt;) throws an exception because the request is "ambiguous."',
      reality: 'the .NET DI container never treats this as an error — it silently returns the LAST-registered implementation, with no exception, no warning, and no compile-time signal that other implementations exist and are being ignored for that consumer.',
    },
    {
      thought: '"last registered wins" means the container picks the implementation registered last in the SOURCE FILE, so it is predictable by reading Program.cs top to bottom.',
      reality: 'this only holds for registrations written by hand in a fixed, visible order — when registrations come from assembly scanning (Scrutor, plugin loaders, reflection-based discovery), "last" depends on assembly/type enumeration order, which is not guaranteed to match source-code order and can silently change between builds or runtime versions.',
    },
    {
      thought: 'requesting IEnumerable&lt;INotificationSender&gt; versus a plain INotificationSender is just a stylistic choice with the same runtime result.',
      reality: 'they resolve completely differently — IEnumerable&lt;T&gt; returns EVERY registered implementation in registration order, while plain T returns ONLY the single last-registered one; picking the wrong one for a given use case is a real, silent bug source.',
    },
  ];
}
