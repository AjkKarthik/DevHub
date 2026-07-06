import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-whenall-doesnt-start-tasks-parallel-just-awaits-running-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
    TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './whenall-doesnt-start-tasks-parallel-just-awaits-running.html',
  styleUrl: './whenall-doesnt-start-tasks-parallel-just-awaits-running.scss',
})
export class WhenallDoesntStartTasksParallelJustAwaitsRunningSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page says tasks are "already running when passed in" — this subtopic explains exactly why that\'s true',
      points: [
        'The main Tasks page\'s own WhenAll section notes, correctly but briefly, that tasks passed to <code>Task.WhenAll(t1, t2, t3)</code> "are already running when passed in." The mechanism behind this: calling an <code>async</code> method does NOT schedule its body to run later on some other thread — it begins executing the method body SYNCHRONOUSLY, on the CALLING thread, immediately, right up until the first <code>await</code> that actually suspends (i.e. awaits something not yet complete).',
      ],
    },
    {
      heading: 'Task.WhenAll itself starts nothing — by the time it is called, the real work has often already begun',
      points: [
        'In <code>Task&lt;string&gt; t1 = GetUserNameAsync(1);</code>, the call to <code>GetUserNameAsync</code> RUNS synchronously up to its first genuine suspension point (in the main page\'s own example, the line before <code>await Task.Delay(50)</code>) before <code>GetUserNameAsync</code> even returns a <code>Task&lt;string&gt;</code> back to the caller. Only once that first await genuinely suspends does control return to the caller, carrying a Task that represents "the rest of this method, to be resumed later."',
        '<code>Task.WhenAll(t1, t2, t3)</code>, called AFTER all three variables are already assigned, does not "kick off" anything — it simply constructs a new Task that completes once all three ALREADY-IN-PROGRESS tasks finish. This is why the main page\'s own warning — never write <code>await Task.WhenAll(await t1, await t2)</code> — is correct: awaiting <code>t1</code> individually BEFORE constructing the array passed to <code>WhenAll</code> defeats the whole benefit, because it forces the SECOND task\'s initiating call to wait until the first one\'s await point resumes, rather than letting both begin their synchronous prefix immediately, one after another, with no blocking in between.',
      ],
    },
    {
      heading: 'This has a real, practical consequence for where CPU-bound work should live inside an async method',
      points: [
        'Because everything before the first <code>await</code> in an async method runs SYNCHRONOUSLY on the caller\'s thread, placing expensive CPU-bound work before that first await means the "async" method is not actually asynchronous for that portion — the caller\'s thread is blocked doing that work, exactly as if the method were fully synchronous, right up until the first real suspension point. This is a genuinely common, subtle source of an "async" method that still blocks the UI thread or a request thread for longer than expected.',
        'The fix mirrors the main page\'s own <code>Task.Run</code> guidance: if a method genuinely needs to do CPU-bound work before its first I/O-bound await, wrap JUST that synchronous prefix in <code>Task.Run</code> (or restructure so the expensive work happens after entering the async method\'s FIRST await, e.g. an initial <code>await Task.Yield();</code> to force an immediate return to the caller before doing anything else).',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Proof: the method body runs synchronously up to its first await, before returning a Task at all',
      language: 'csharp',
      code: `async Task<string> GetUserNameAsync(int id)
{
    Console.WriteLine($"Starting work for {id} on thread {Thread.CurrentThread.ManagedThreadId}");
    await Task.Delay(50); // <-- the FIRST genuine suspension point
    return $"User_{id}";
}

Console.WriteLine($"Main thread: {Thread.CurrentThread.ManagedThreadId}");

// Calling this does NOT schedule work "somewhere else" — it runs the
// "Starting work..." line SYNCHRONOUSLY, on THIS thread, right now,
// before GetUserNameAsync(1) even returns control to this line:
Task<string> t1 = GetUserNameAsync(1);
Task<string> t2 = GetUserNameAsync(2);
Task<string> t3 = GetUserNameAsync(3);

// Output shows "Starting work for 1/2/3" all print on the SAME thread
// ID as "Main thread", BEFORE any await Task.WhenAll ever executes —
// proving the synchronous prefix of each call already ran.

string[] names = await Task.WhenAll(t1, t2, t3);
// WhenAll did not "start" anything here — it just waited for three
// operations that were already well underway.`,
    },
    {
      label: 'Why the main page\'s own warning about awaiting inside WhenAll is correct',
      language: 'csharp',
      code: `// WRONG — awaiting t1 individually BEFORE constructing the array
// forces t2's call to wait until t1's FIRST await point resumes:
string result1 = await GetUserNameAsync(1);   // fully completes here —
                                                // including its internal
                                                // Task.Delay(50) wait —
                                                // BEFORE the next line runs
string result2 = await GetUserNameAsync(2);   // only starts AFTER
                                                // result1 is fully done
// Total time ≈ 50 + 50 = 100ms — SEQUENTIAL, not concurrent at all,
// despite superficially "looking like" async code.

// RIGHT — start both calls first, capturing the Task objects while
// both synchronous prefixes run back-to-back with no blocking between
// them, THEN await both together:
Task<string> t1 = GetUserNameAsync(1);
Task<string> t2 = GetUserNameAsync(2);
string[] both = await Task.WhenAll(t1, t2);
// Total time ≈ 50ms — genuinely concurrent, because both underlying
// Task.Delay(50) calls were already running simultaneously by the
// time WhenAll was ever called.`,
    },
    {
      label: 'The practical gotcha — CPU-bound work before the first await still blocks the caller',
      language: 'csharp',
      code: `// This method LOOKS async, but the expensive Sort() call runs
// SYNCHRONOUSLY on the caller's thread, because it's BEFORE the
// first await — exactly like a fully synchronous method, for that
// portion of its execution:
async Task<int[]> SortThenFetchAsync(int[] data)
{
    Array.Sort(data);           // <-- BLOCKS the caller's thread here,
                                 //     runs before any suspension occurs
    await Task.Delay(10);       // <-- first genuine suspension point
    return data;
}

// In a UI app, calling this still freezes the UI for the duration of
// Array.Sort(), even though the method is declared async and the
// caller uses await — the "async-ness" only kicks in AFTER the sort:
var result = await SortThenFetchAsync(largeArray); // UI frozen during Sort()

// Fix — move the CPU-bound work behind Task.Run, or behind the first
// await, so it genuinely runs off the calling thread:
async Task<int[]> SortThenFetchFixedAsync(int[] data)
{
    await Task.Run(() => Array.Sort(data)); // runs on a pool thread —
                                             // caller's thread is free
    await Task.Delay(10);
    return data;
}`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'Given <code>async Task Log(string msg) { File.AppendAllText("log.txt", msg); await Task.Delay(1); }</code> called from a UI button click handler as <code>await Log("clicked");</code>, explain whether the UI thread is blocked during the <code>File.AppendAllText</code> call, and why.',
    hint: 'File.AppendAllText is a synchronous, blocking file I/O call. Consider where it sits relative to the method\'s first await, and which thread runs code before that first await.',
    solution: `async Task Log(string msg)
{
    File.AppendAllText("log.txt", msg); // synchronous, BLOCKING file I/O
    await Task.Delay(1);                // first genuine suspension point
}

// Called from a UI button click handler:
await Log("clicked");

// YES — the UI thread IS blocked during File.AppendAllText, and for
// the exact same reason as the Array.Sort() example: everything in an
// async method's body BEFORE its first genuine await runs
// SYNCHRONOUSLY on the CALLING thread. Since File.AppendAllText sits
// before "await Task.Delay(1)", it executes as ordinary, blocking
// code on the UI thread — the method being declared "async Task" and
// being called with "await" does NOT retroactively make code before
// the first await non-blocking.
//
// Fix — move the blocking I/O to genuinely async I/O, or behind
// Task.Run if it must stay synchronous for some reason:
async Task LogFixed(string msg)
{
    await File.AppendAllTextAsync("log.txt", msg); // now genuinely async —
                                                    // UI thread is free
                                                    // during the write
}`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'calling an async method always immediately hands off its entire body to run on a different thread or in the background.',
      reality: 'an async method runs its body SYNCHRONOUSLY, on the calling thread, right up until its first genuine suspension point (an await on something not yet complete) — only then does control actually return to the caller.',
    },
    {
      thought: 'Task.WhenAll is what makes tasks run concurrently — without calling it, tasks passed to it would run one after another.',
      reality: 'the tasks are usually ALREADY running concurrently by the time WhenAll is called, because each call that produced them already ran its synchronous prefix immediately when invoked — WhenAll just waits for work already in flight, it does not start anything.',
    },
    {
      thought: 'placing expensive CPU-bound work inside an async method automatically makes that work non-blocking for the caller.',
      reality: 'any code before the method\'s first genuine await still runs synchronously on the calling thread — declaring a method async and calling it with await does not retroactively make code before the first suspension point non-blocking.',
    },
  ];
}
