import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-diagnosing-typeinitializationexception-inner-exception-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
    TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './diagnosing-typeinitializationexception-inner-exception.html',
  styleUrl: './diagnosing-typeinitializationexception-inner-exception.scss',
})
export class DiagnosingTypeInitializationExceptionInnerExceptionSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page states the fact — never how to diagnose it in practice',
      points: [
        'The main Constructors page correctly states: "If a static constructor throws an exception, the type becomes permanently unusable... the runtime wraps it in TypeInitializationException on every subsequent access." What it never covers is the single most important practical consequence: the exception message on <code>TypeInitializationException</code> ITSELF is nearly useless — the actual, original cause is nested one level down, in its <code>InnerException</code>.',
      ],
    },
    {
      heading: 'TypeInitializationException.Message tells you WHICH type failed — not WHY',
      points: [
        'The default <code>TypeInitializationException.Message</code> reads something like <em>"The type initializer for \'CountryCodeLookup\' threw an exception."</em> — genuinely useful for identifying WHICH type is broken, but it says NOTHING about what actually went wrong inside the static constructor (a missing file, a null reference, a malformed config value, etc.).',
        'A developer who logs only <code>ex.Message</code> from a caught <code>TypeInitializationException</code> — a completely reasonable-looking, common logging pattern — silently discards the ONE piece of information that would actually explain the failure, because that information lives in <code>ex.InnerException</code>, not the outer exception\'s own message.',
      ],
    },
    {
      heading: 'Always log or inspect InnerException — and it can itself be null',
      points: [
        'The fix is straightforward once known: catch <code>TypeInitializationException</code> and log/inspect <code>ex.InnerException</code> (its message, its own stack trace, its type) — THIS is where the genuine root cause lives, exactly as the static constructor originally threw it, with its ORIGINAL stack trace intact.',
        'One subtlety: <code>InnerException</code> is technically nullable — in the rare case the CLR itself synthesizes a <code>TypeInitializationException</code> without an inner cause (uncommon, but possible in some low-level/edge-case scenarios), defensive code should null-check before dereferencing it, rather than assuming it is always populated.',
      ],
    },
    {
      heading: 'The failure is permanent for the AppDomain — retrying does not help',
      points: [
        'Reinforcing the main page\'s own point: once a static constructor has thrown, EVERY subsequent access to that type — not just the first one — throws a NEW <code>TypeInitializationException</code> wrapping the SAME original failure, for the remaining lifetime of the process. Wrapping the failing call in a retry loop or a try/catch that "handles and continues" accomplishes nothing, because the type\'s static state is permanently marked as failed at the CLR level; there is no way to "unfail" it short of restarting the process.',
        'This makes root-causing the ORIGINAL failure (via <code>InnerException</code>) even more important than usual — since retrying is fundamentally futile, understanding and fixing the underlying cause (missing config file, bad connection string, etc.) is the ONLY path forward, and that understanding depends entirely on inspecting the inner exception correctly.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'The trap — logging only ex.Message hides the real cause',
      language: 'csharp',
      code: `public class CountryCodeLookup
{
    private static readonly Dictionary<string, string> _codes;

    static CountryCodeLookup()
    {
        // Simulate a real-world failure — a missing/misconfigured file:
        var text = File.ReadAllText("country-codes.json"); // throws
                                                              // FileNotFoundException
                                                              // if missing
        _codes = ParseCodes(text);
    }

    private static Dictionary<string, string> ParseCodes(string json) => new();

    public static string GetName(string code) =>
        _codes.TryGetValue(code, out var name) ? name : "Unknown";
}

try
{
    Console.WriteLine(CountryCodeLookup.GetName("US"));
}
catch (TypeInitializationException ex)
{
    // COMMON MISTAKE — logs only the unhelpful outer message:
    Console.WriteLine($"Error: {ex.Message}");
    // Output: "Error: The type initializer for 'CountryCodeLookup' threw
    //          an exception."
    // This tells you WHICH type failed, but says NOTHING about the
    // actual FileNotFoundException that caused it — a developer reading
    // only this log entry has no idea a config file is missing.
}`,
    },
    {
      label: 'The fix — always inspect InnerException for the real cause',
      language: 'csharp',
      code: `try
{
    Console.WriteLine(CountryCodeLookup.GetName("US"));
}
catch (TypeInitializationException ex)
{
    // Inspect InnerException — this is where the ACTUAL, original
    // exception (with its own genuine stack trace) actually lives:
    Console.WriteLine($"Type initialization failed: {ex.Message}");
    if (ex.InnerException is not null)
    {
        Console.WriteLine($"Root cause: {ex.InnerException.GetType().Name}: {ex.InnerException.Message}");
        Console.WriteLine(ex.InnerException.StackTrace);
    }
}
// Output now includes:
//   Type initialization failed: The type initializer for
//     'CountryCodeLookup' threw an exception.
//   Root cause: FileNotFoundException: Could not find file
//     'country-codes.json'.
//   [original stack trace pointing at the actual File.ReadAllText call]
//
// THIS is the information that actually explains and lets someone fix
// the problem — logging only the outer TypeInitializationException.Message
// would have hidden it completely.`,
    },
    {
      label: 'The failure is permanent — retrying accomplishes nothing',
      language: 'csharp',
      code: `// Demonstrating that the failure genuinely persists for the rest of
// the process's lifetime — no amount of retrying recovers the type:
for (var attempt = 1; attempt <= 3; attempt++)
{
    try
    {
        Console.WriteLine(CountryCodeLookup.GetName("US"));
        Console.WriteLine("Succeeded!");
        break;
    }
    catch (TypeInitializationException ex)
    {
        Console.WriteLine($"Attempt {attempt} failed: " +
            $"{ex.InnerException?.Message ?? "(no inner exception)"}");
        // Every single attempt throws the SAME TypeInitializationException,
        // wrapping the SAME original failure — the type never "recovers"
        // within this process, no matter how many times you retry:
    }
}
// Output:
//   Attempt 1 failed: Could not find file 'country-codes.json'.
//   Attempt 2 failed: Could not find file 'country-codes.json'.
//   Attempt 3 failed: Could not find file 'country-codes.json'.
//
// The only genuine fix is addressing the ROOT CAUSE (restoring the
// missing file, fixing the config) and restarting the process — a retry
// loop around the failing call is fundamentally futile here, unlike a
// retry loop around a genuinely transient failure like a network call.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'Write a helper method <code>string DescribeTypeInitFailure(TypeInitializationException ex)</code> that returns a single, complete diagnostic string combining the outer exception\'s message with the inner exception\'s type and message — handling the case where InnerException might be null.',
    hint: 'Follow the theory\'s guidance: the outer message identifies WHICH type failed, and the inner exception (when present) explains WHY. Combine both into one string, and use the null-conditional operator (or an explicit null check) to handle the rare case where InnerException is null without throwing a NullReferenceException from your own diagnostic helper.',
    solution: `static string DescribeTypeInitFailure(TypeInitializationException ex)
{
    var inner = ex.InnerException;

    return inner is not null
        ? $"{ex.Message} Root cause: {inner.GetType().Name}: {inner.Message}"
        : $"{ex.Message} (no inner exception available)";
}

// Usage:
try
{
    Console.WriteLine(CountryCodeLookup.GetName("US"));
}
catch (TypeInitializationException ex)
{
    Console.WriteLine(DescribeTypeInitFailure(ex));
    // "The type initializer for 'CountryCodeLookup' threw an exception.
    //  Root cause: FileNotFoundException: Could not find file
    //  'country-codes.json'."
}

// This single helper turns the two-step "check ex.Message, THEN
// remember to also check ex.InnerException" habit into one reliable
// call site — reducing the chance a future catch block accidentally
// logs only the unhelpful outer message again.`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'the Message property on a caught TypeInitializationException contains enough information to diagnose why the static constructor actually failed.',
      reality: 'TypeInitializationException.Message only identifies WHICH type failed to initialize — the actual root cause (the original exception the static constructor threw) lives in InnerException, which must be inspected separately.',
    },
    {
      thought: 'InnerException on a TypeInitializationException is always guaranteed to be non-null.',
      reality: 'while InnerException is populated in the overwhelming majority of real cases, it is technically nullable — defensive diagnostic code should null-check it rather than assume it is always present.',
    },
    {
      thought: 'wrapping a call to a type with a failed static constructor in a retry loop can eventually succeed, similar to retrying a transient network failure.',
      reality: 'once a static constructor has thrown, the type is permanently marked as failed for the remaining lifetime of the process — every subsequent access throws the same TypeInitializationException wrapping the same original cause, making retries fundamentally futile; only fixing the root cause and restarting the process resolves it.',
    },
  ];
}
