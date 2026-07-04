import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-setlasterror-silently-clobbered-by-pinvoke-call-in-between-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
    TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './setlasterror-silently-clobbered-by-pinvoke-call-in-between.html',
  styleUrl: './setlasterror-silently-clobbered-by-pinvoke-call-in-between.scss',
})
export class SetlasterrorSilentlyClobberedByPinvokeCallInBetweenSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page shows SetLastError=true + Marshal.GetLastPInvokeError() as a clean, isolated pattern — real code rarely calls them back-to-back with nothing else in between',
      points: [
        'The main P/Invoke page\'s example calls <code>CreateDirectory(...)</code>, then IMMEDIATELY calls <code>Marshal.GetLastPInvokeError()</code> on the very next line. This works, and gives the correct error code. The gotcha appears the moment ANY other code — even something that looks completely unrelated to P/Invoke — runs between the failing native call and reading the error code.',
      ],
    },
    {
      heading: 'The native "last error" is thread-local OS state, OVERWRITTEN by literally the next Win32/P-Invoke call on that same thread — including calls YOUR code never sees',
      points: [
        'Windows\' <code>GetLastError()</code> (and POSIX <code>errno</code>) is per-thread state that gets SET (whether to a real error code or to 0/success) by essentially every Win32 API call, on every call, regardless of whether that specific call is the one you actually care about. .NET\'s <code>Marshal.GetLastPInvokeError()</code> reads .NET\'s OWN internal cached copy of the error, which it captures IMMEDIATELY after each <code>[LibraryImport]</code>/<code>[DllImport]</code> call marked <code>SetLastError = true</code> — but that cached copy is only valid until the NEXT such marked call updates it.',
        'The critical, easy-to-miss detail: this includes P/Invoke calls YOUR code never explicitly makes but that happen to run anyway — logging frameworks, certain BCL methods, or even .NET runtime internals CAN themselves be implemented via P/Invoke calls marked <code>SetLastError = true</code> under the hood, silently overwriting the cached error value between your failing native call and the moment you actually read it, with NO exception, NO warning, and NO visible sign anything happened.',
      ],
    },
    {
      heading: 'The only reliable rule: read Marshal.GetLastPInvokeError() on the VERY NEXT LINE after the P/Invoke call that might have failed — nothing else in between, ever',
      points: [
        'Any intervening statement — a log call, a string interpolation that happens to box/format something in an unexpected way, even certain property getters — is a POTENTIAL clobbering hazard if that statement itself, anywhere in its own call chain, ends up invoking a <code>SetLastError</code>-marked P/Invoke. The safest pattern treats the error-code read as PART OF the same atomic operation as the native call itself, with zero tolerance for anything else being interleaved.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'The main page\'s clean pattern — this specific case is actually safe',
      language: 'csharp',
      code: `bool created = NativeMethods.CreateDirectory(@"C:\\Temp\\TestDir", 0);
if (!created)
{
    int error = Marshal.GetLastPInvokeError();  // reads immediately — SAFE
    Console.WriteLine(\$"Error: {error}");
}`,
    },
    {
      label: 'The trap — ANY statement between the call and reading the error is a hazard',
      language: 'csharp',
      code: `bool created = NativeMethods.CreateDirectory(@"C:\\Temp\\TestDir", 0);
if (!created)
{
    // This looks completely innocent — a simple logging call:
    _logger.LogWarning("CreateDirectory failed for {Path}", @"C:\\Temp\\TestDir");

    // BUG: the error code read here may be COMPLETELY DIFFERENT from
    // whatever CreateDirectory actually set — IF the logging call
    // above internally invoked ANY SetLastError-marked P/Invoke
    // (some logging sinks, certain Windows Event Log integrations, or
    // even seemingly-managed code paths that happen to call into a
    // native API under the hood) between the failing CreateDirectory
    // call and this line:
    int error = Marshal.GetLastPInvokeError();
    Console.WriteLine(\$"Error: {error}");  // may report the WRONG error —
                                            // possibly even ERROR_SUCCESS (0)
                                            // if the intervening call succeeded,
                                            // masking the REAL failure entirely
}`,
    },
    {
      label: 'The reliable fix — capture the error on the immediate next line, before anything else',
      language: 'csharp',
      code: `bool created = NativeMethods.CreateDirectory(@"C:\\Temp\\TestDir", 0);
int error = created ? 0 : Marshal.GetLastPInvokeError();
// ^ Captured IMMEDIATELY — this is now the VERY NEXT operation after
// the P/Invoke call, with nothing else able to run in between.

if (!created)
{
    // Now safe to log, format, or do anything else — the CORRECT error
    // code is already captured in a local variable, immune to whatever
    // the logging call itself might do internally:
    _logger.LogWarning("CreateDirectory failed for {Path} with error {Error}",
        @"C:\\Temp\\TestDir", error);
    Console.WriteLine(\$"Error: {error}");
}

// The GENERAL PATTERN — treat "P/Invoke call" + "capture error" as ONE
// atomic unit, always, with the capture as the literal next statement,
// before any logging, string formatting, or other code runs:
static int InvokeAndCaptureError(Func<bool> nativeCall)
{
    bool success = nativeCall();
    return success ? 0 : Marshal.GetLastPInvokeError();  // captured immediately,
                                                          // inside the SAME
                                                          // narrow helper, before
                                                          // returning control to
                                                          // any caller code that
                                                          // might run something
                                                          // else first
}`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A method calls a failing P/Invoke function, then constructs a detailed exception message using <code>string.Format</code> with several interpolated values from OTHER properties/methods, and only THEN reads <code>Marshal.GetLastPInvokeError()</code> to include in the exception. Explain the specific risk here, even though string.Format itself is pure managed code with no P/Invoke involved.',
    hint: 'The risk is not necessarily string.Format itself — it is whatever the OTHER interpolated values require to COMPUTE. Consider what happens if constructing the error message requires reading a property that, internally, happens to call a native API (even indirectly, through several layers of framework code).',
    solution: `bool created = NativeMethods.CreateDirectory(path, 0);
if (!created)
{
    // The exception message interpolates several other values —
    // string.Format ITSELF has no P/Invoke, but what about computing
    // the VALUES being interpolated?
    string message = string.Format(
        "Failed to create directory '{0}' for user '{1}' at {2}",
        path,
        Environment.UserName,        // <-- on some platforms/.NET versions,
                                      //     resolving the current user name
                                      //     can internally call a native
                                      //     Win32/POSIX API under the hood
        DateTimeOffset.Now);          // <-- reading the current time zone
                                      //     offset can ALSO, on some
                                      //     platforms, involve a native
                                      //     call to query OS timezone data

    // By the time we FINALLY read the error code, TWO other properties
    // were resolved first, EACH a potential (implementation-detail,
    // platform-and-version-dependent) SetLastError-marked P/Invoke call
    // that could have silently overwritten the REAL error from
    // CreateDirectory:
    int error = Marshal.GetLastPInvokeError();  // may be WRONG by now

    throw new IOException($"{message} (error {error})");
}

// THE FIX — capture the error code FIRST, before constructing ANYTHING
// else, then use the ALREADY-CAPTURED value in the message construction
// (which can now safely involve as many other property reads, native-adjacent
// calls, or complex formatting as needed, since the error is already
// safely stored in a local variable):
bool createdFixed = NativeMethods.CreateDirectory(path, 0);
int errorFixed = createdFixed ? 0 : Marshal.GetLastPInvokeError();  // FIRST, unconditionally

if (!createdFixed)
{
    // NOW it is safe to call Environment.UserName, DateTimeOffset.Now,
    // logging, or anything else — the CORRECT error value from
    // CreateDirectory is already safely captured in "errorFixed",
    // immune to whatever happens during message construction:
    string message = string.Format(
        "Failed to create directory '{0}' for user '{1}' at {2} (error {3})",
        path, Environment.UserName, DateTimeOffset.Now, errorFixed);

    throw new IOException(message);
}

// GENERAL LESSON: the danger is not necessarily obvious P/Invoke calls
// interleaved in your OWN visible code — it is ANY property, method, or
// framework call whose IMPLEMENTATION DETAILS (often invisible from the
// call site, and potentially varying across .NET versions or platforms)
// happen to route through a SetLastError-marked native call. The only
// robust defense is capturing the error IMMEDIATELY, unconditionally, as
// the literal next statement — never "eventually, after some other work."`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'Marshal.GetLastPInvokeError() is safe to call any time after a failed P/Invoke call, as long as you have not made another OBVIOUS P/Invoke call in your own visible code in between.',
      reality: 'the "last error" can be overwritten by ANY SetLastError-marked native call anywhere in the current thread\'s call stack — including calls hidden inside framework code, logging sinks, or certain BCL methods that are not obviously P/Invoke from the call site at all.',
    },
    {
      thought: 'calling pure managed code (like string.Format or building a log message) between a failing P/Invoke call and reading the error is always safe, since string.Format itself has no native calls.',
      reality: 'the risk is not necessarily the formatting operation itself — it is whatever OTHER values being interpolated require to compute, some of which (like certain platform-specific property getters) can internally route through native calls that clobber the cached error first.',
    },
    {
      thought: 'the safest way to handle P/Invoke error codes is to capture them as late as possible, right before they are actually needed (e.g. inside the exception-throwing branch, after constructing a full message).',
      reality: 'the safest pattern is the OPPOSITE — capture the error code as the literal next statement immediately after the P/Invoke call, unconditionally, before any other code runs, and use the already-captured value for everything downstream.',
    },
  ];
}
