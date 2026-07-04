import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-reusing-eventid-loggermessage-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
    TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './reusing-eventid-across-loggermessage-methods-compiles-cleanly.html',
  styleUrl: './reusing-eventid-across-loggermessage-methods-compiles-cleanly.scss',
})
export class ReusingEventidAcrossLoggermessageMethodsCompilesCleanlySubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page warns "never reuse or change an EventId once it is in production logs" — but never shows what happens if you accidentally DO reuse one across two unrelated log methods',
      points: [
        'The main Logging page\'s "Source-generated LoggerMessage" section assigns EventIds 1001, 1002, 1003 to <code>OrderService</code>\'s three <code>[LoggerMessage]</code> methods, and its revision summary explicitly warns to assign stable IDs "grouped by service area" and never reuse one in production. What it does not show: the C# compiler performs NO uniqueness check across <code>[LoggerMessage]</code> attributes at all — two COMPLETELY UNRELATED log methods, in different classes, in different service areas, can be given the exact same <code>EventId</code> number, and the build succeeds with zero warnings.',
      ],
    },
    {
      heading: 'A dashboard or alert rule that keys on EventId, without ALSO checking the EventId\'s Name, silently merges two semantically unrelated events into one series',
      points: [
        '<code>EventId</code> is actually a struct with BOTH an <code>Id</code> (int) and an optional <code>Name</code> (string) — sinks like Application Insights and Seq typically key dashboards and alert rules on the numeric <code>Id</code> alone, since that is the cheap, stable, indexable field. If <code>OrderService</code> uses EventId 1001 for "order created" and, months later, an unrelated <code>InventoryService</code> is given EventId 1001 for "stock threshold breached" (because nobody checked the OrderService assignment before picking a number), a dashboard counting "EventId 1001 occurrences per hour" now silently BLENDS two semantically unrelated business events into a single count — with no compiler error, no runtime exception, and no log-time warning to reveal the collision.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Two unrelated [LoggerMessage] methods in different classes, same EventId — this compiles with ZERO warnings',
      language: 'csharp',
      code: `// OrderService.cs — from the main page's own example:
public partial class OrderService
{
    [LoggerMessage(
        EventId  = 1001,
        Level    = LogLevel.Information,
        Message  = "Order {OrderId} created for customer {CustomerId}")]
    private static partial void LogOrderCreated(
        ILogger logger, int orderId, string customerId);
}

// InventoryService.cs — written months later, by a different developer,
// who never checked which EventId numbers OrderService already claimed:
public partial class InventoryService
{
    [LoggerMessage(
        EventId  = 1001,   // COLLISION — completely unrelated event, same ID
        Level    = LogLevel.Warning,
        Message  = "Stock for SKU {Sku} fell below threshold {Threshold}")]
    private static partial void LogStockThresholdBreached(
        ILogger logger, string sku, int threshold);
}

// 'dotnet build' — succeeds cleanly. The [LoggerMessage] source generator
// validates EACH ATTRIBUTE INDEPENDENTLY (checking that a valid Message
// template, EventId, and Level are supplied) — it has NO visibility into
// EventId values assigned by OTHER [LoggerMessage] attributes anywhere
// else in the compilation, so it cannot detect this collision even in
// principle without cross-file/cross-project analysis it does not perform.`,
    },
    {
      label: 'What actually breaks in production — a dashboard silently blending two unrelated events',
      language: 'csharp',
      code: `// A monitoring dashboard query (conceptual — the exact syntax depends on
// the sink, e.g. Application Insights KQL or a Seq query):
//
//   customEvents
//   | where customDimensions.EventId == "1001"
//   | summarize count() by bin(timestamp, 1h)
//
// BEFORE the collision: this counts ONLY "Order {OrderId} created" events
// — a genuinely useful "orders per hour" business metric.
//
// AFTER InventoryService claims EventId 1001 too: the SAME query now
// silently counts BOTH "orders created" AND "stock threshold breached"
// events together, as if they were the same thing. The dashboard's line
// graph shifts upward the day InventoryService ships — easily
// misread as "order volume increased," when the real cause is an
// unrelated inventory alert firing frequently.
//
// THE CRITICAL DETAIL: EventId ALSO carries an optional Name property.
// If both [LoggerMessage] attributes above had included a Name
// (e.g. EventName = "OrderCreated" / EventName = "StockThresholdBreached"),
// most structured sinks index EventId.Name as a SEPARATE field alongside
// EventId.Id — and a query keying on the NAME rather than the bare
// numeric ID would NOT have been affected by this collision at all:

[LoggerMessage(
    EventId   = 1001,
    EventName = "OrderCreated",     // <-- this field is what actually
    Level     = LogLevel.Information,               // disambiguates two
    Message   = "Order {OrderId} created for customer {CustomerId}")]
private static partial void LogOrderCreated(
    ILogger logger, int orderId, string customerId);

// THE PRACTICAL FIX: maintain EventId ranges per service area (as the main
// page already recommends: 1000-1099 for OrderService), but ALSO always
// set EventName explicitly — it is the field that actually protects a
// dashboard from a numeric collision, since most sinks treat Name as an
// independent, human-readable disambiguator rather than relying on the
// bare integer alone.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'Given that the C# compiler performs no cross-file EventId uniqueness check, propose a concrete, automatable way to catch an EventId collision like the one in this subtopic BEFORE it reaches production — something that runs as part of CI, not a manual code-review habit.',
    hint: 'Consider that every [LoggerMessage] attribute in a compiled assembly is discoverable via reflection at runtime, or via a Roslyn analyzer at compile time — either approach could enumerate every declared EventId across the entire codebase and check for duplicates in one pass.',
    solution: `A concrete, automatable option: a small reflection-based test (or a
lightweight custom Roslyn analyzer, for more teams that want it enforced
directly at compile time) that scans EVERY [LoggerMessage] attribute across
every assembly in the solution and asserts no two attributes share the
same EventId.Id without ALSO having distinct, non-empty EventName values:

[Fact]
public void NoTwoLoggerMessageAttributes_ShareTheSameEventIdWithoutADistinctName()
{
    var loggerMessageAttrs = typeof(OrderService).Assembly   // or scan
        .GetTypes()                                          // every
        .SelectMany(t => t.GetMethods(BindingFlags.NonPublic  // relevant
            | BindingFlags.Static | BindingFlags.Instance))   // assembly
        .SelectMany(m => m.GetCustomAttributes<LoggerMessageAttribute>())
        .ToList();

    var byNumericId = loggerMessageAttrs.GroupBy(a => a.EventId);

    foreach (var group in byNumericId.Where(g => g.Count() > 1))
    {
        var distinctNames = group.Select(a => a.EventName).Distinct().Count();
        Assert.True(distinctNames == group.Count(),
            $"EventId {group.Key} is reused by {group.Count()} [LoggerMessage] " +
            "methods without distinct EventName values — this silently merges " +
            "unrelated events in any dashboard keying on the bare numeric ID.");
    }
}

This test runs in CI on every pull request, requires no manual review
discipline, and directly encodes the exact rule this subtopic covers:
duplicate numeric EventIds are fine ONLY if EventName distinguishes them.
The broader principle: any convention that "cannot be enforced by the
compiler" (like EventId uniqueness across an entire codebase) is a strong
candidate for a small CI-run reflection or analyzer check — relying purely
on a documented convention and code-review vigilance is exactly the kind of
gap this subtopic's collision scenario falls through.`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'the C# compiler (or the [LoggerMessage] source generator) validates that EventId values are unique across the entire project or solution.',
      reality: 'the source generator validates each [LoggerMessage] attribute independently — it has no visibility into EventId values assigned by attributes in other classes or files, so a numeric collision across unrelated services compiles and builds with zero warnings.',
    },
    {
      thought: 'a monitoring dashboard or alert rule that queries by EventId is inherently safe from ever conflating two different kinds of events.',
      reality: 'most sinks key by the bare numeric EventId.Id unless a query specifically also filters on EventId.Name — two semantically unrelated events sharing the same numeric ID silently blend together in any dashboard or alert that only checks the number.',
    },
    {
      thought: 'setting only EventId (without EventName) on a [LoggerMessage] attribute is just as safe as setting both, since the numeric value is what matters for uniqueness.',
      reality: 'EventName is the field that actually protects against a numeric collision in most structured sinks — a query or alert keying on EventName rather than the bare Id is unaffected even if two methods accidentally share the same numeric EventId.',
    },
  ];
}
