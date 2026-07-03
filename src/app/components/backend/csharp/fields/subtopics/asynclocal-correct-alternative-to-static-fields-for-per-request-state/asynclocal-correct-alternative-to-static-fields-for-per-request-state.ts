import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-asynclocal-correct-alternative-to-static-fields-for-per-request-state-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
    TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './asynclocal-correct-alternative-to-static-fields-for-per-request-state.html',
  styleUrl: './asynclocal-correct-alternative-to-static-fields-for-per-request-state.scss',
})
export class AsyncLocalCorrectAlternativeToStaticFieldsForPerRequestStateSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page names AsyncLocal<T> in passing — never explains it',
      points: [
        'The main Fields page\'s Common Mistake ("storing per-request state in a static field") suggests <code>IHttpContextAccessor</code> or DI-scoped services as the fix, and mentions <code>AsyncLocal&lt;T&gt;</code> by name in its Q&A without elaborating. <code>AsyncLocal&lt;T&gt;</code> is the general-purpose, framework-agnostic mechanism behind ambient per-request/per-async-flow state — worth understanding directly rather than only through its ASP.NET Core-specific wrapper.',
      ],
    },
    {
      heading: 'AsyncLocal<T> flows WITH the async call chain, not with the thread',
      points: [
        'A <code>static</code> field is genuinely global — the exact bug the main page warns about. A <code>[ThreadStatic]</code> field is scoped to a single OS thread — but modern async code frequently HOPS between thread-pool threads across <code>await</code> points, so a <code>[ThreadStatic]</code> field can appear to "lose" its value mid-request when the continuation resumes on a different thread, making it unsuitable for async code despite superficially looking like the right fix for "not global."',
        '<code>AsyncLocal&lt;T&gt;</code> instead flows its value along the LOGICAL call chain of an async operation, following the ExecutionContext across every <code>await</code>, regardless of which physical thread ends up running each continuation — this is exactly the "ambient state that travels with one logical request" semantics that per-request data actually needs.',
      ],
    },
    {
      heading: 'Values flow DOWN the call chain, never back UP — a real, easy-to-misuse detail',
      points: [
        'Setting <code>asyncLocal.Value = x</code> only affects the CURRENT logical call chain and everything it subsequently calls (including new async continuations spawned from this point onward) — it does NOT affect a caller further up the chain, and it does NOT affect sibling branches that already forked off before the value was set.',
        'This one-directional flow means <code>AsyncLocal&lt;T&gt;</code> is fundamentally different from a mutable shared field: two concurrent requests each see their OWN independent value, and setting the value deep inside one request\'s call chain cannot leak into another request\'s chain — this is precisely the isolation property a static field lacks and the main page\'s bug report is about.',
      ],
    },
    {
      heading: 'This IS the mechanism ASP.NET Core\'s IHttpContextAccessor uses internally',
      points: [
        'ASP.NET Core\'s <code>HttpContextAccessor</code> — the framework-recommended fix the main page itself suggests — is implemented internally using an <code>AsyncLocal&lt;HttpContext&gt;</code>, set once per incoming request by middleware early in the pipeline. Understanding <code>AsyncLocal&lt;T&gt;</code> directly demystifies HOW <code>IHttpContextAccessor</code> achieves per-request isolation without a static field, rather than treating it as unexplained framework magic.',
        'Outside ASP.NET Core (a console app, a background worker, a custom pipeline), <code>AsyncLocal&lt;T&gt;</code> is the direct, general-purpose tool for the same "ambient state that should travel with one logical operation, not leak across concurrent operations" need — useful for correlation IDs, tenant context, or user identity in any async codebase, not just web requests.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'The bug from the main topic — reproduced with AsyncLocal as the fix',
      language: 'csharp',
      code: `public class RequestContext
{
    // NOT static — an instance holding an AsyncLocal<T>, or often exposed
    // as a static field WRAPPING an AsyncLocal<T> (the AsyncLocal instance
    // itself can be static; it's the per-flow VALUE inside it that isn't):
    private static readonly AsyncLocal<string?> _currentUserId = new();

    public static string? CurrentUserId
    {
        get => _currentUserId.Value;
        set => _currentUserId.Value = value;
    }
}

// Simulating two "concurrent requests" as two independent async call chains:
async Task HandleRequestAsync(string userId, int delayMs)
{
    RequestContext.CurrentUserId = userId; // sets it for THIS call chain only

    await Task.Delay(delayMs); // hops across the thread pool — AsyncLocal
                                // value survives the hop; ThreadStatic would not

    Console.WriteLine($"After delay, CurrentUserId = {RequestContext.CurrentUserId}");
    // Each call chain reliably sees ITS OWN userId — no cross-request leakage,
    // exactly the isolation a static field (the main topic's bug) does not have.
}

await Task.WhenAll(
    HandleRequestAsync("user-1", 100),
    HandleRequestAsync("user-2", 50));
// Output (order may vary due to different delays, but values never cross):
//   After delay, CurrentUserId = user-2
//   After delay, CurrentUserId = user-1`,
    },
    {
      label: 'Why [ThreadStatic] fails for the same async scenario',
      language: 'csharp',
      code: `public class BrokenRequestContext
{
    [ThreadStatic]
    private static string? _currentUserId; // scoped to ONE OS thread only

    public static string? CurrentUserId
    {
        get => _currentUserId;
        set => _currentUserId = value;
    }
}

async Task HandleRequestAsync(string userId)
{
    BrokenRequestContext.CurrentUserId = userId; // set on thread-pool thread A

    await Task.Delay(50); // the continuation MAY resume on a DIFFERENT
                           // thread-pool thread B — [ThreadStatic] does not
                           // follow the LOGICAL call chain, only the thread

    // This can print null or an unrelated value — thread B never had
    // "userId" set on IT specifically, only thread A did:
    Console.WriteLine($"CurrentUserId = {BrokenRequestContext.CurrentUserId}");
}

// This is exactly why [ThreadStatic] — despite superficially looking like
// a fix for "make it not global like a plain static field" — is still
// wrong for async code: it solves the wrong scoping problem (thread vs
// logical async flow).`,
    },
    {
      label: 'One-directional flow — a caller never sees a callee\'s AsyncLocal write',
      language: 'csharp',
      code: `var correlationId = new AsyncLocal<string?>();

async Task OuterAsync()
{
    correlationId.Value = "outer-value";
    await InnerAsync();

    // Even though InnerAsync changed correlationId.Value internally,
    // that change does NOT propagate back UP to this caller:
    Console.WriteLine(correlationId.Value); // "outer-value" — unchanged!
}

async Task InnerAsync()
{
    Console.WriteLine(correlationId.Value); // "outer-value" — flows DOWN correctly
    correlationId.Value = "inner-value";     // only affects InnerAsync's own
                                              // continuation from this point on
    await Task.Delay(10);
    Console.WriteLine(correlationId.Value);  // "inner-value" — sees its own write
}

await OuterAsync();
// Output:
//   outer-value   (Inner sees Outer's value — flows down)
//   inner-value   (Inner sees its own later write)
//   outer-value   (Outer's own value is UNCHANGED by Inner's write — no flow up)`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'Two sibling async operations, <code>Task.WhenAll(BranchA(), BranchB())</code>, both start from the SAME point in the call chain where <code>correlationId.Value = "shared-start"</code> was already set before the WhenAll call. Inside BranchA, the code sets <code>correlationId.Value = "branch-a-only"</code>. Does BranchB see this change?',
    hint: 'Both branches forked off from the same point AFTER "shared-start" was set, so both start with that value visible. But BranchA\'s write happens INSIDE its own independent branch of the call chain, after the fork — think about whether a write inside one forked branch can flow sideways into a sibling branch that already forked off separately.',
    solution: `var correlationId = new AsyncLocal<string?>();

async Task RunBothBranchesAsync()
{
    correlationId.Value = "shared-start"; // set BEFORE the fork

    await Task.WhenAll(BranchA(), BranchB());
}

async Task BranchA()
{
    Console.WriteLine(correlationId.Value); // "shared-start" — sees the pre-fork value
    correlationId.Value = "branch-a-only";  // only affects BranchA's OWN continuation
    await Task.Delay(10);
    Console.WriteLine(correlationId.Value); // "branch-a-only" — sees its own write
}

async Task BranchB()
{
    await Task.Delay(20); // runs concurrently with BranchA
    // BranchB does NOT see BranchA's "branch-a-only" write — the two
    // branches forked at the same point but are now independent logical
    // flows; a write inside one sibling never flows sideways into another:
    Console.WriteLine(correlationId.Value); // "shared-start" — UNCHANGED
}

await RunBothBranchesAsync();
// BranchA and BranchB each see the value AS IT WAS at their own fork
// point, and neither sees the other's later mutations — exactly the
// isolation property that makes AsyncLocal safe for genuinely concurrent,
// independent async operations sharing a common ancestor.`,
  };

  misconceptions: Misconception[] = [
    {
      thought: '[ThreadStatic] is a safe alternative to a plain static field for per-request state in async code, since it is at least scoped to a single thread rather than the whole application.',
      reality: 'async continuations frequently resume on a DIFFERENT thread-pool thread than where they started — [ThreadStatic] follows the physical thread, not the logical async call chain, so a value set before an await can appear to vanish (read as default/null) after the await resumes on a different thread.',
    },
    {
      thought: 'setting an AsyncLocal<T> value deep inside a method affects every caller up the call chain, the same way a mutable shared field would.',
      reality: 'AsyncLocal<T> values flow strictly DOWNWARD along the call chain — a callee\'s write is visible to its own subsequent code and anything it calls, but never propagates back up to its caller, and never crosses sideways into a sibling branch that already forked off separately.',
    },
    {
      thought: 'IHttpContextAccessor in ASP.NET Core is unrelated framework-internal magic, unlike the AsyncLocal<T> pattern developers might build themselves.',
      reality: 'IHttpContextAccessor is implemented internally using an AsyncLocal<HttpContext>, set once per incoming request by middleware — it is the exact same general-purpose mechanism, just pre-wired for the HTTP request scenario specifically.',
    },
  ];
}
