import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-how-optionsmonitor-detects-file-change-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
    TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './how-optionsmonitor-detects-file-change-changetoken-propagation.html',
  styleUrl: './how-optionsmonitor-detects-file-change-changetoken-propagation.scss',
})
export class HowOptionsmonitorDetectsFileChangeChangetokenPropagationSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page shows OnChange() firing "whenever the underlying config file reloads" — this subtopic covers the ACTUAL mechanism, and the specific reason a single edit can trigger it more than once',
      points: [
        'The main Configuration page describes <code>IOptionsMonitor&lt;T&gt;.OnChange(callback)</code> as firing "when config reloads," treating file-watching as an implementation detail. Understanding the ACTUAL mechanism — <code>IChangeToken</code> propagation through the JSON configuration provider — explains a genuinely surprising, commonly-reported behavior: <code>OnChange</code> can fire TWICE (or more) for what feels like ONE logical edit to <code>appsettings.json</code>.',
      ],
    },
    {
      heading: 'The JSON file provider wraps a FileSystemWatcher, exposed through .NET\'s generic IChangeToken abstraction — a "one-shot" notification token that must be re-subscribed after every fire',
      points: [
        'When <code>reloadOnChange: true</code> is set for the JSON provider (the default for <code>appsettings.json</code> in <code>WebApplication.CreateBuilder</code>), the underlying <code>PhysicalFileProvider</code> uses a <code>FileSystemWatcher</code> (on the OS file-watching APIs) to detect changes to the file. This raw OS-level notification is wrapped in .NET\'s <code>IChangeToken</code> — a token representing "has something changed since I was created," which fires its callback ONCE and then must be discarded and RE-CREATED (re-subscribed) to keep watching for FUTURE changes.',
        '<code>IOptionsMonitor&lt;T&gt;</code> internally chains onto this SAME change-token mechanism: it re-binds the options section, invalidates its cached <code>CurrentValue</code>, and invokes every registered <code>OnChange</code> callback — then immediately re-subscribes a NEW change token to keep listening. This re-subscription cycle is itself normal and expected; it is not the source of duplicate firing by itself.',
      ],
    },
    {
      heading: 'The genuine reason for DUPLICATE firing on one logical edit: many editors and OS file-save operations generate MULTIPLE distinct file-system events for what feels like one save',
      points: [
        'A text editor saving a file often does NOT perform a single, atomic "overwrite these bytes" operation — many editors (and some OS-level save-with-backup behaviors) write to a TEMPORARY file, then DELETE the original, then RENAME the temporary file to the original name — THREE distinct file-system operations, potentially each independently triggering the underlying <code>FileSystemWatcher</code>\'s change notification, which can cascade into <code>OnChange</code> firing multiple times for what a human perceives as ONE save action.',
        'This is a WELL-KNOWN, DOCUMENTED characteristic of file-system watching in general (not specific to ASP.NET Core\'s configuration system) — <code>FileSystemWatcher</code>\'s own documentation explicitly warns that a single logical file operation can raise multiple events, and that consumers should be prepared to receive and safely ignore/debounce redundant notifications rather than assuming a strict one-event-per-logical-change guarantee.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'The main page\'s own FeatureFlagService — logging reveals the double-fire',
      language: 'csharp',
      code: `public class FeatureFlagService
{
    private readonly IOptionsMonitor<FeatureFlags> _monitor;
    private IDisposable? _listener;

    public FeatureFlagService(IOptionsMonitor<FeatureFlags> monitor)
    {
        _monitor = monitor;
        _listener = monitor.OnChange(flags =>
            Console.WriteLine(\$"Feature flags reloaded: NewCheckout={flags.NewCheckout}"));
    }

    public bool IsNewCheckoutEnabled => _monitor.CurrentValue.NewCheckout;
}

// A developer edits appsettings.json ONCE, in a typical text editor,
// changing "NewCheckout": false to "NewCheckout": true, and saves:
//
// Console output observed (a REAL, commonly-reported behavior):
//   Feature flags reloaded: NewCheckout=True
//   Feature flags reloaded: NewCheckout=True
//
// The callback fired TWICE for what was, from the developer's
// perspective, ONE save action — this is NOT a bug in
// FeatureFlagService, IOptionsMonitor, or ASP.NET Core's configuration
// system; it reflects how the underlying OS file-system watcher
// actually behaves for that specific editor's save operation.`,
    },
    {
      label: 'Tracing WHY — a typical editor save is not one atomic file operation',
      language: 'csharp',
      code: `// What "saving appsettings.json" often ACTUALLY does at the OS level
// (varies by editor and platform, but this general pattern — write to
// a temp file, then swap it in — is extremely common, precisely BECAUSE
// it protects against data loss if the save is interrupted partway
// through):
//
// 1. Editor writes the NEW content to a temporary file:
//    appsettings.json.tmp   ← FileSystemWatcher may fire a "Created" event
//
// 2. Editor deletes (or the OS replaces) the ORIGINAL file:
//    appsettings.json       ← FileSystemWatcher may fire a "Deleted" event
//
// 3. Editor renames the temporary file to the original name:
//    appsettings.json.tmp → appsettings.json
//                           ← FileSystemWatcher may fire a "Renamed" or
//                             "Created" event for the FINAL file
//
// ASP.NET Core's PhysicalFileProvider/FileSystemWatcher-based change
// token can end up firing its "something changed" notification for
// MORE THAN ONE of these individual OS-level events — from
// IOptionsMonitor's perspective, this surfaces as OnChange() firing
// multiple times, even though only ONE logical "the developer changed
// a JSON value" event actually happened from the developer's point of
// view.`,
    },
    {
      label: 'The correct, defensive pattern — debounce or de-duplicate inside your own OnChange callback',
      language: 'csharp',
      code: `public class FeatureFlagServiceRobust : IDisposable
{
    private readonly IOptionsMonitor<FeatureFlags> _monitor;
    private readonly IDisposable _listener;
    private FeatureFlags? _lastSeenValue;
    private readonly object _lock = new();

    public FeatureFlagServiceRobust(IOptionsMonitor<FeatureFlags> monitor)
    {
        _monitor = monitor;
        _lastSeenValue = monitor.CurrentValue;

        _listener = monitor.OnChange(flags =>
        {
            lock (_lock)
            {
                // De-duplicate: only react if the VALUE actually
                // differs from the last one this callback already
                // processed — this makes the callback idempotent
                // against the "same edit fires multiple raw events"
                // behavior described in this subtopic, without
                // needing to reason about FileSystemWatcher internals
                // at all:
                if (_lastSeenValue is not null &&
                    _lastSeenValue.NewCheckout == flags.NewCheckout &&
                    _lastSeenValue.BetaDashboard == flags.BetaDashboard)
                {
                    return;   // genuinely unchanged — skip
                }

                _lastSeenValue = flags;
                Console.WriteLine(\$"Feature flags GENUINELY changed: NewCheckout={flags.NewCheckout}");
                // Only NOW perform any expensive or side-effecting
                // reaction to the change (invalidate a cache, notify
                // other services, etc.) — protecting against the
                // multi-fire behavior entirely, regardless of WHICH
                // editor or save mechanism caused it:
            }
        });
    }

    public void Dispose() => _listener.Dispose();
}`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A team\'s <code>OnChange</code> callback triggers an expensive cache-invalidation routine (clearing a large in-memory cache and re-warming it from a database) every time it fires. They notice the cache gets cleared and re-warmed TWICE, back-to-back, every time anyone edits <code>appsettings.json</code> — doubling the load on the database during deploys that touch config. Using this subtopic\'s mechanism, explain the fix that addresses the ROOT CAUSE rather than just reducing the symptom\'s visibility.',
    hint: 'Consider the difference between suppressing the SECOND callback invocation with a timer-based debounce (which introduces its own delay and complexity) versus comparing the ACTUAL VALUES the callback receives across firings — one fix treats the symptom generically regardless of cause, the other directly targets what actually differs (or doesn\'t) between the two firings.',
    solution: `// The problematic callback — reacts to EVERY OnChange firing,
// regardless of whether the VALUE actually changed:
public class CacheInvalidationService
{
    public CacheInvalidationService(IOptionsMonitor<AppSettings> monitor)
    {
        monitor.OnChange(settings =>
        {
            _cache.Clear();               // expensive
            WarmCacheFromDatabase();       // expensive — hits the DB
        });
    }
}

// A NAIVE fix — a time-based debounce (ignore any second call within,
// say, 500ms of the first):
private DateTime _lastFired = DateTime.MinValue;
monitor.OnChange(settings =>
{
    if ((DateTime.UtcNow - _lastFired) < TimeSpan.FromMilliseconds(500))
        return;   // suppress rapid-fire duplicate
    _lastFired = DateTime.UtcNow;
    _cache.Clear();
    WarmCacheFromDatabase();
});
// This WORKS in practice for the common case (the duplicate events
// from one save happen within milliseconds of each other), but it is
// treating the SYMPTOM generically — it assumes "close in time = same
// logical change" without ever checking whether the underlying VALUE
// actually changed at all. A genuinely rapid SECOND, real config edit
// within that window would be INCORRECTLY suppressed too.

// THE ROOT-CAUSE FIX — compare the ACTUAL VALUES received across
// firings, exactly as the "robust" pattern in this subtopic's own
// code examples does, and only react when something GENUINELY
// changed:
public class CacheInvalidationServiceFixed
{
    private AppSettings? _lastValue;
    private readonly object _lock = new();

    public CacheInvalidationServiceFixed(IOptionsMonitor<AppSettings> monitor)
    {
        _lastValue = monitor.CurrentValue;

        monitor.OnChange(settings =>
        {
            lock (_lock)
            {
                if (_lastValue is not null && SettingsEqual(_lastValue, settings))
                    return;   // genuinely identical to last time — skip

                _lastValue = settings;
                _cache.Clear();
                WarmCacheFromDatabase();
            }
        });
    }

    private static bool SettingsEqual(AppSettings a, AppSettings b) =>
        a.SomeRelevantProperty == b.SomeRelevantProperty;
        // (extend to compare every property CacheInvalidationService
        // actually cares about)
}
// This fix is CORRECT regardless of WHY the duplicate firing happens
// (editor save behavior, FileSystemWatcher quirks, or even a genuinely
// unrelated future change to how the config provider works internally)
// — it directly targets the actual observable symptom (identical
// values being processed twice) rather than approximating it with a
// timing window that could either miss legitimately-close real changes
// or fail to suppress duplicates that happen to arrive slightly slower
// than the chosen debounce interval.`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'IOptionsMonitor.OnChange firing more than once for a single edit to appsettings.json indicates a bug in ASP.NET Core\'s configuration system.',
      reality: 'this is a well-documented characteristic of file-system watching in general — many editors and OS-level save operations perform multiple distinct file operations (write-temp, delete-original, rename) for what feels like one logical save, and FileSystemWatcher can raise a notification for more than one of those operations.',
    },
    {
      thought: 'the correct way to prevent duplicate OnChange firings is always a time-based debounce that ignores any callback invocation occurring shortly after a previous one.',
      reality: 'comparing the actual VALUES received across firings (and skipping genuinely-identical ones) addresses the root cause directly and correctly, regardless of the exact timing between duplicate events — a timing-based debounce can incorrectly suppress a legitimately rapid second real change.',
    },
    {
      thought: 'IChangeToken automatically continues watching for future changes after firing once, with no additional work needed from the consuming code.',
      reality: 'an IChangeToken is a one-shot notification — it fires its callback once and must then be discarded and a new one subscribed to keep watching; IOptionsMonitor handles this re-subscription internally, but it is a genuine, repeated cycle, not a single persistent subscription.',
    },
  ];
}
