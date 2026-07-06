import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-sync-over-async-file-io-deadlocks-result-hangs-forever-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
    TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './sync-over-async-file-io-deadlocks-result-hangs-forever.html',
  styleUrl: './sync-over-async-file-io-deadlocks-result-hangs-forever.scss',
})
export class SyncOverAsyncFileIoDeadlocksResultHangsForeverSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page recommends async I/O for throughput — calling it "the wrong way" causes a much worse failure than just blocking a thread',
      points: [
        'The main I/O & Serialization page\'s Async I/O section explains that synchronous file calls block a thread pool thread, hurting THROUGHPUT under load. A related but more severe failure mode exists specifically when code calls <code>.Result</code> or <code>.Wait()</code> on an async file operation\'s <code>Task</code> from a context that has a <code>SynchronizationContext</code> — this can cause a genuine, permanent DEADLOCK, not just reduced throughput.',
      ],
    },
    {
      heading: 'The deadlock mechanism: awaiting captures the context, .Result blocks the thread that context needs',
      points: [
        'By default, <code>await</code> captures the current <code>SynchronizationContext</code> (present in classic ASP.NET / WinForms / WPF, though NOT in ASP.NET Core, which has none) and schedules the continuation AFTER the awaited task to resume back on that SAME context. If the calling code instead blocks synchronously on the task with <code>.Result</code>, it occupies the ONE thread that the context is single-threaded around — and the continuation, needing that same context to resume, can never run, because the thread it needs is busy blocking on <code>.Result</code> waiting for that very continuation to finish. Neither side can proceed: a genuine deadlock.',
        'This is why <code>await File.ReadAllTextAsync(path).Result</code> (calling <code>.Result</code> instead of <code>await</code>ing) inside a classic ASP.NET MVC action or a WPF UI event handler can hang the request/UI thread FOREVER — not slowly, not eventually timing out on its own, but genuinely forever, until something external (a request timeout, a forced restart) intervenes.',
      ],
    },
    {
      heading: 'ASP.NET Core is largely immune — but library code and mixed-hosting code are not',
      points: [
        'ASP.NET Core (unlike classic ASP.NET) has NO <code>SynchronizationContext</code> by default — so calling <code>.Result</code> there does not deadlock the same way, though it still blocks a thread pool thread (the throughput problem the main page already covers). This is a genuinely important distinction: the DEADLOCK is specific to contexts WITH a SynchronizationContext, while the THROUGHPUT hit from blocking applies everywhere.',
        'The danger is that a shared library method calling <code>.Result</code> internally "works fine" when tested from an ASP.NET Core app, then deadlocks the moment it is reused from a WPF desktop tool, a classic ASP.NET MVC action, or a xUnit test runner configured with a synchronization context — the bug is latent and environment-dependent, exactly like the culture-sensitivity issue covered elsewhere in this topic\'s sibling pages.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'The deadlock — .Result on an async file read, from a context WITH a SynchronizationContext',
      language: 'csharp',
      code: `// Classic ASP.NET MVC action (has a SynchronizationContext):
public class ConfigController : Controller
{
    public ActionResult GetConfig()
    {
        // .Result BLOCKS this request's thread, waiting for the Task
        // to complete. The awaited ReadAllTextAsync's continuation
        // needs to resume on THIS SAME SynchronizationContext-bound
        // thread — but that thread is stuck blocking on .Result.
        // Neither side can proceed: DEADLOCK, forever.
        string json = File.ReadAllTextAsync("config.json").Result;
        return Content(json, "application/json");
    }
}

// The request simply hangs — no exception, no timeout on its own,
// just an indefinitely stuck thread, until IIS itself eventually
// recycles the app pool or the client gives up.`,
    },
    {
      label: 'The fix — await all the way down, never .Result/.Wait() on an async chain',
      language: 'csharp',
      code: `public class ConfigController : Controller
{
    public async Task<ActionResult> GetConfig()
    {
        // The continuation resumes on the SAME captured context, but
        // because the CALLING method is itself async (and the thread
        // is released back rather than blocked), there is no deadlock:
        string json = await File.ReadAllTextAsync("config.json");
        return Content(json, "application/json");
    }
}

// Alternative when you genuinely cannot make the caller async (rare,
// and worth questioning first): use ConfigureAwait(false) on the
// AWAITED call so its continuation does NOT need to resume on the
// original context at all — but this only helps the LIBRARY code
// being awaited; it does not fix a caller still using .Result:
public async Task<string> ReadConfigAsync(string path)
    => await File.ReadAllTextAsync(path).ConfigureAwait(false);`,
    },
    {
      label: 'Why ASP.NET Core doesn\'t deadlock the same way — but still shouldn\'t use .Result',
      language: 'csharp',
      code: `// ASP.NET Core Minimal API — NO SynchronizationContext by default:
app.MapGet("/config", () =>
{
    // This does NOT deadlock in ASP.NET Core specifically, because
    // there is no SynchronizationContext for the continuation to be
    // stuck waiting to resume on — the continuation can run on ANY
    // available thread pool thread:
    string json = File.ReadAllTextAsync("config.json").Result;
    return Results.Text(json, "application/json");
});
// BUT this still blocks a thread pool thread for the duration of the
// read — exactly the throughput problem the main topic page's own
// Async I/O section warns about. The deadlock risk is gone here, but
// the original problem this whole section exists to solve is not.

// The SAME library method, if later called from a WPF button click
// handler or a classic ASP.NET action, WOULD deadlock — because THAT
// caller's context is different, even though the library code itself
// never changed. This is exactly why "await all the way down" is a
// context-independent, always-safe rule, while "it happens to work
// under ASP.NET Core" is not evidence of correctness in general.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A shared internal library method is defined as <code>public static string ReadConfig(string path) => File.ReadAllTextAsync(path).Result;</code>. Explain under which hosting contexts this is safe to call, and which specific ones would genuinely deadlock.',
    hint: 'Consider which contexts have a SynchronizationContext (classic ASP.NET, WPF, WinForms) versus which don\'t (ASP.NET Core, console apps, xUnit\'s default runner) — the deadlock only occurs when a SynchronizationContext exists and the caller blocks on .Result waiting for a continuation that needs that same context.',
    solution: `public static string ReadConfig(string path) =>
    File.ReadAllTextAsync(path).Result;

// SAFE to call from (no SynchronizationContext to deadlock against):
// - ASP.NET Core controllers/minimal API endpoints — blocks a thread
//   pool thread (throughput cost) but does NOT deadlock
// - A plain console application's Main method
// - Most xUnit test runners (no SynchronizationContext by default)
//
// GENUINELY DEADLOCKS when called from:
// - A classic ASP.NET (System.Web) MVC/WebForms action — has
//   AspNetSynchronizationContext; blocking the request thread on
//   .Result while the awaited continuation waits to resume on that
//   SAME thread hangs the request forever
// - A WPF button click handler or any UI-thread event handler — has
//   DispatcherSynchronizationContext; blocking the UI thread the same
//   way freezes the entire application window
// - A WinForms event handler — same story, WindowsFormsSynchronization
//   Context
//
// The library method's OWN code never changes across these cases —
// the bug is entirely about WHICH CONTEXT calls it, which is exactly
// why "it works fine when I tested it" from an ASP.NET Core project
// is not proof the method is safe to ship as a general-purpose,
// reusable library API.`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'calling .Result on an async file operation just blocks a thread — a performance cost, never a correctness problem.',
      reality: 'in a context with a SynchronizationContext (classic ASP.NET, WPF, WinForms), calling .Result can cause a genuine, permanent deadlock — the blocked thread and the awaited continuation each wait on the other forever.',
    },
    {
      thought: 'if a method using .Result on an async call works correctly when tested in an ASP.NET Core project, it is safe to reuse anywhere.',
      reality: 'ASP.NET Core has no SynchronizationContext by default, so .Result doesn\'t deadlock there — but the exact same method called from classic ASP.NET, WPF, or WinForms code (which do have a SynchronizationContext) can hang forever, since the bug depends on the CALLER\'s context, not the library code itself.',
    },
    {
      thought: 'a sync-over-async deadlock eventually resolves itself once the I/O operation completes.',
      reality: 'the deadlock is not about the I/O taking too long — it is a genuine circular wait where the blocked thread and the waiting continuation each need the other to proceed, so it persists indefinitely regardless of how quickly the underlying I/O actually finishes.',
    },
  ];
}
