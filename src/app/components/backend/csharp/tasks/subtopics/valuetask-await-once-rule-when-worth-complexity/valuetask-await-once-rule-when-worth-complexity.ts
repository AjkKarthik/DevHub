import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-valuetask-await-once-rule-when-worth-complexity-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
    TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './valuetask-await-once-rule-when-worth-complexity.html',
  styleUrl: './valuetask-await-once-rule-when-worth-complexity.scss',
})
export class ValuetaskAwaitOnceRuleWhenWorthComplexitySubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page mentions ValueTask once, for advanced library authors — this is the mechanism and the trade-off',
      points: [
        'The main Tasks page mentions <code>ManualResetValueTaskSourceCore&lt;T&gt;</code> only as "a higher-performance alternative to TaskCompletionSource... for advanced library authors only." <code>ValueTask&lt;T&gt;</code> itself, though, is common in ordinary application code too (many BCL async methods like <code>Stream.ReadAsync</code> now return it) — worth understanding directly, including its central restriction.',
      ],
    },
    {
      heading: 'ValueTask exists to avoid a Task allocation when the result is often already available synchronously',
      points: [
        '<code>Task&lt;T&gt;</code> is always a heap-allocated reference type — even a method that completes synchronously (e.g. returning a cached value) still allocates a <code>Task&lt;T&gt;</code> object to wrap that value (unless it explicitly returns <code>Task.FromResult</code>\'s cached completed-task fast paths). <code>ValueTask&lt;T&gt;</code> is a STRUCT that can represent either an already-available result OR a wrapped, pending <code>Task&lt;T&gt;</code>/pooled state-machine source — for the synchronous-completion case specifically, no heap allocation occurs at all.',
        'This makes <code>ValueTask&lt;T&gt;</code> attractive specifically for methods that complete synchronously MOST of the time (e.g. a cache-first read that only occasionally needs to go to the actual I/O source) — exactly the same motivating scenario as the main page\'s own <code>Task.FromResult</code> section, but generalized to work uniformly whether the specific call happens to complete synchronously or not.',
      ],
    },
    {
      heading: 'The critical restriction: a ValueTask may only be awaited ONCE, ever',
      points: [
        'Unlike <code>Task&lt;T&gt;</code>, which can be awaited multiple times, stored, and passed around freely (its completion state is a stable, independent heap object), a <code>ValueTask&lt;T&gt;</code> may be consumed — awaited, or its <code>.Result</code>/<code>.AsTask()</code> called — EXACTLY ONCE. Awaiting the SAME <code>ValueTask&lt;T&gt;</code> a second time is undefined behavior — it may throw, return a stale or garbage value, or in some implementations even corrupt shared pooled state, because the underlying value-task SOURCE may have been returned to a pool and reused for a completely different operation by the time the second await runs.',
        'This directly rules out several of the main page\'s own patterns for <code>ValueTask&lt;T&gt;</code> specifically: you cannot pass the SAME <code>ValueTask&lt;T&gt;</code> to both <code>Task.WhenAny</code> AND later separately await it again (the main page\'s own <code>GetProfileFastAsync</code> re-awaits <code>dbTask</code> after checking it against <code>WhenAny</code>\'s result — this pattern is only safe with <code>Task&lt;T&gt;</code>, and would be a genuine bug if <code>dbTask</code> were instead a <code>ValueTask&lt;T&gt;</code>).',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'ValueTask avoids allocation on the synchronous-completion fast path',
      language: 'csharp',
      code: `// A cache-first read — completes synchronously MOST of the time:
private readonly Dictionary<int, string> _cache = new();

public ValueTask<string> GetValueAsync(int key)
{
    if (_cache.TryGetValue(key, out var cached))
    {
        // Synchronous fast path — NO Task allocation at all, unlike
        // returning Task.FromResult(cached), which still allocates a
        // Task<T> wrapper object (barring the runtime's own internal
        // caching for a few common values like 0/1/true/false):
        return new ValueTask<string>(cached);
    }

    // Slow path — genuinely async, wraps a real Task<T> internally:
    return new ValueTask<string>(LoadFromDatabaseAsync(key));
}

private async Task<string> LoadFromDatabaseAsync(int key)
{
    await Task.Delay(50); // simulate I/O
    return $"value-{key}";
}

// Callers await it exactly the same way as Task<T>:
string value = await GetValueAsync(42);`,
    },
    {
      label: 'The rule violation — awaiting the same ValueTask twice is undefined behavior',
      language: 'csharp',
      code: `ValueTask<string> vt = GetValueAsync(42);

string first = await vt;   // fine — the ONE legitimate consumption

// string second = await vt;  // DO NOT DO THIS — undefined behavior:
// depending on the underlying source, this could throw, return a
// stale/incorrect value, or (for pooled sources) read state that has
// ALREADY been reused for a completely different, unrelated operation

// Contrast with Task<T> — this is completely safe:
Task<string> t = LoadFromDatabaseAsync(42);
string a = await t;  // fine
string b = await t;  // ALSO fine — Task<T> can be awaited many times`,
    },
    {
      label: 'Converting to Task<T> when you genuinely need multi-await or WhenAll/WhenAny semantics',
      language: 'csharp',
      code: `// If you need to pass a ValueTask-returning result into WhenAll/WhenAny,
// or store it for later re-await, convert to Task<T> via AsTask() —
// this consumes the ValueTask exactly once (satisfying its one-await
// rule) and produces an ordinary, freely-reusable Task<T>:
ValueTask<string> vt = GetValueAsync(1);
Task<string> asTask = vt.AsTask();

// Now safe to treat like any normal Task<T>:
var combined = await Task.WhenAll(asTask, GetValueAsync(2).AsTask());

// The main page's own re-await pattern (checking a task against
// WhenAny, then awaiting it again later) is ONLY safe if the
// underlying type is Task<T> — if a method you're calling returns
// ValueTask<T> and you need this pattern, call .AsTask() ONCE,
// immediately, and use the resulting Task<T> everywhere after that.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A method <code>ValueTask&lt;int&gt; GetCountAsync()</code> is called once, and the caller needs to both check <code>IsCompletedSuccessfully</code> on it AND later await it for the actual value. Explain whether this is safe, and if not, how to fix it.',
    hint: 'Checking IsCompletedSuccessfully does not consume the ValueTask (it is just a property read), but the actual VALUE-producing consumption (await, .Result, or .AsTask() followed by awaiting the task) may only happen once — consider whether checking the property first and then awaiting counts as "awaiting more than once."',
    solution: `ValueTask<int> vt = GetCountAsync();

// This part is SAFE — checking IsCompletedSuccessfully is just reading
// a property on the ValueTask struct itself; it does not "consume" the
// underlying source the way await/.Result/.AsTask() does:
bool alreadyDone = vt.IsCompletedSuccessfully;

// This is ALSO safe, as the ONE legitimate consumption of vt:
int count = await vt;

// The rule is specifically about consuming the RESULT more than once
// (await, .Result, or a second .AsTask() call) — not about reading
// simple status properties beforehand. So checking
// IsCompletedSuccessfully first, then awaiting exactly once, is fine.

// UNSAFE version — this WOULD violate the rule, because it awaits
// (consumes) the SAME ValueTask twice:
// int a = await vt;
// int b = await vt;  // undefined behavior — vt already consumed

// If genuinely multiple consumptions are needed, convert to Task<T>
// ONCE, immediately, and reuse the Task<T> freely afterward:
Task<int> asTask = vt.AsTask();
int x = await asTask; // fine
int y = await asTask; // ALSO fine — Task<T> has no such restriction`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'ValueTask<T> is simply a faster drop-in replacement for Task<T> everywhere, with no behavioral differences to worry about.',
      reality: 'ValueTask<T> may only be consumed (awaited, .Result read, or converted via .AsTask()) exactly ONCE — awaiting the same instance twice is undefined behavior, unlike Task<T> which can be awaited or read many times safely.',
    },
    {
      thought: 'the main page\'s own re-await pattern (checking a task against WhenAny, then awaiting it again later for its result) works identically whether the underlying type is Task<T> or ValueTask<T>.',
      reality: 'that pattern is only safe for Task<T> — if the method being called returns ValueTask<T> instead, the second await violates the one-consumption rule and is a genuine bug, not a stylistic difference.',
    },
    {
      thought: 'ValueTask<T> always avoids a heap allocation, regardless of whether the operation completes synchronously or asynchronously.',
      reality: 'ValueTask<T> only avoids allocation on the SYNCHRONOUS-completion fast path — when the underlying operation is genuinely asynchronous, it still wraps (and effectively still allocates) a real Task<T> or pooled state-machine source internally.',
    },
  ];
}
