import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  standalone: true,
  imports: [PageMetaComponent, TheoryBlockComponent, CodeBlockComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent, SubtopicEyebrowComponent],
  templateUrl: './notifycontext-swallows-a-second-ctrl-c.html',
  styleUrl: './notifycontext-swallows-a-second-ctrl-c.scss'
})
export class NotifycontextSwallowsASecondCtrlCSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page presents signal.NotifyContext as making Ctrl+C "just work" — it changes what a repeated Ctrl+C does, too',
      points: [
        'The main page\'s own mistake entry ("Ignoring context in long-running CLI operations") recommends exactly this fix: ctx, cancel := signal.NotifyContext(context.Background(), os.Interrupt); defer cancel(), then rootCmd.ExecuteContext(ctx). Its explanation says only that the context "is cancelled when the user presses Ctrl+C" — a correct but incomplete description of what happens to the process\'s SIGINT handling from that point forward.',
        'The official os/signal documentation for NotifyContext describes a genuine behavior change, not just a notification: "the default behavior of a Go program receiving os.Interrupt is to exit. Calling NotifyContext(parent, os.Interrupt) will change the behavior to cancel the returned context." This means the process\'s normal "Ctrl+C kills me immediately" behavior is deliberately DISABLED the moment NotifyContext is set up — replaced entirely by "Ctrl+C cancels this context instead."',
        'The documentation states plainly what happens to any FURTHER signals after the first one: "Future interrupts received will not trigger the default (exit) behavior until the returned stop function is called." A second Ctrl+C, pressed while the first one\'s graceful shutdown is still in progress, does nothing extra — it is not queued, it does not force-exit, and per the context\'s own documented behavior ("marked done... when one of the listed signals arrives... whichever happens first"), the context was already canceled by the first signal, so a second matching signal has no additional context-cancellation effect either.',
      ]
    },
    {
      heading: 'The practical consequence: a hung graceful shutdown becomes un-interruptible by Ctrl+C',
      points: [
        'This directly follows from the main page\'s own recommended fix, not from a separate mistake: if downloadAllFiles(ctx, args) — the exact function the main page\'s own "right" example calls — has a bug where it does not actually check ctx.Done() somewhere in a long inner loop, the FIRST Ctrl+C cancels the context (as intended) but the hung operation keeps running regardless. A frustrated user\'s SECOND, THIRD, and FOURTH Ctrl+C presses do nothing at all, per the documentation\'s own "will not trigger the default (exit) behavior" — the tool becomes un-killable by Ctrl+C until either it finishes on its own or the user resorts to a different signal (SIGKILL via kill -9, or Ctrl+\\ / SIGQUIT where supported).',
        'The stop function\'s own documentation clarifies the ONLY way to restore normal signal behavior: "the stop function unregisters the signal behavior, which, like signal.Reset, may restore the default behavior." Calling stop() (typically via defer cancel() immediately after NotifyContext, exactly as the main page\'s own example does) is what eventually re-arms the OS default the NEXT time the program starts fresh — but it does not help mid-run, since stop() only runs once the surrounding function returns, by which point the hung operation has already finished or the process exited some other way.',
        'This is not an argument against the main page\'s own recommended pattern — graceful-shutdown-on-first-signal is the correct default for well-behaved operations — it is a reason robust CLI tools often layer a SECOND signal.Notify (without NotifyContext\'s auto-restoring semantics) specifically to detect a repeated signal and force os.Exit(1) immediately, giving impatient users an explicit "I really mean it, kill it now" escape hatch that the single NotifyContext call alone does not provide.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'The main page\'s own pattern -- what happens on a SECOND Ctrl+C',
      language: 'typescript',
      code: `package main

import (
    "context"
    "fmt"
    "os"
    "os/signal"
    "time"
)

// Simulates the main page's own downloadAllFiles, with a bug: it
// does not actually check ctx.Done() inside its loop.
func downloadAllFiles(ctx context.Context, files []string) error {
    for _, f := range files {
        fmt.Println("downloading", f)
        time.Sleep(3 * time.Second) // slow "download", ignores ctx entirely
    }
    return nil
}

func main() {
    // Exactly the main page's own recommended pattern.
    ctx, cancel := signal.NotifyContext(context.Background(), os.Interrupt)
    defer cancel()

    files := []string{"a.zip", "b.zip", "c.zip", "d.zip"}
    if err := downloadAllFiles(ctx, files); err != nil {
        fmt.Fprintln(os.Stderr, err)
        os.Exit(1)
    }
}

// User presses Ctrl+C once, partway through:
// downloading a.zip
// downloading b.zip
// ^C                          <- first Ctrl+C: ctx is now canceled
// downloading c.zip           <- but downloadAllFiles never checks
//                                 ctx.Done(), so it keeps going anyway
//
// User, confused, presses Ctrl+C again:
// ^C                          <- per the docs: "Future interrupts...
//                                 will not trigger the default (exit)
//                                 behavior" -- NOTHING happens here
// downloading d.zip           <- still running, uninterrupted
//
// The tool only stops once downloadAllFiles naturally finishes --
// Ctrl+C, pressed any number of additional times, has zero effect
// once the first press has already canceled ctx.`,
    },
    {
      label: 'A "second signal force-quits" escape hatch',
      language: 'typescript',
      code: `package main

import (
    "context"
    "fmt"
    "os"
    "os/signal"
)

func main() {
    ctx, cancel := context.WithCancel(context.Background())
    defer cancel()

    // A plain channel-based signal.Notify -- NOT NotifyContext --
    // specifically so it keeps receiving EVERY signal, not just
    // the first one (NotifyContext's auto-restoring behavior is
    // exactly what we want to bypass here).
    sigCh := make(chan os.Signal, 2)
    signal.Notify(sigCh, os.Interrupt)

    go func() {
        // First signal: cancel the context gracefully, same intent
        // as the main page's own recommended NotifyContext pattern.
        <-sigCh
        fmt.Fprintln(os.Stderr, "\\nshutting down gracefully... (press Ctrl+C again to force quit)")
        cancel()

        // Second signal: the user explicitly asked twice -- honor it.
        <-sigCh
        fmt.Fprintln(os.Stderr, "\\nforce quitting")
        os.Exit(1)
    }()

    files := []string{"a.zip", "b.zip", "c.zip", "d.zip"}
    downloadAllFiles(ctx, files) // assume this one DOES check ctx.Done()
}

// Now a hung or slow-to-respond operation still gives the user an
// explicit, working "I really mean it" second Ctrl+C -- something
// the main page's own single signal.NotifyContext call does not
// provide by itself, per this subtopic's theory.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A CLI tool follows the main page\'s own recommended Ctrl+C pattern exactly: signal.NotifyContext(context.Background(), os.Interrupt), passed to a long-running operation. A user reports that when a specific slow network call hangs (due to an unrelated bug — that one function never receives a timeout or the context at all), pressing Ctrl+C repeatedly does nothing, and they eventually have to close the terminal window entirely to escape. Using this subtopic\'s theory, explain precisely why the second, third, and later Ctrl+C presses have no effect, and identify what the documentation says is the ONLY way (short of a different signal like SIGKILL) to restore the normal "Ctrl+C exits immediately" behavior.',
    hint: 'Per this subtopic\'s theory, what does signal.NotifyContext change about the process\'s DEFAULT Ctrl+C behavior, and per the documentation\'s own wording, what specifically happens to "future interrupts" after the first one is received?',
    solution: 'Per this subtopic\'s theory, signal.NotifyContext does not just "notify" about Ctrl+C — it actively "changes the behavior" of Ctrl+C from the OS default (immediate exit) to "cancel the returned context" instead, and per the documentation\'s own words, "future interrupts received will not trigger the default (exit) behavior until the returned stop function is called." This means every Ctrl+C after the first is not merely redundant — it is documented to have literally no effect, neither canceling anything further (the context is already canceled) nor falling back to the normal kill behavior. Since the hung network call never checks the context at all (a separate bug from the signal handling itself, per the exercise\'s own framing), the tool has no way to actually stop, and the user\'s repeated Ctrl+C presses are absorbed with zero effect exactly as the documentation predicts. The only way to restore default Ctrl+C behavior, per this subtopic\'s theory, is calling the stop function NotifyContext returned — but that only happens automatically once the surrounding function returns (typically via a deferred cancel() call), which never happens while the hung operation is still running. This is precisely why closing the terminal (which sends SIGHUP, a different signal NotifyContext was never told to intercept) was the user\'s only escape — the second code example in this subtopic shows the alternative fix: layering a raw signal.Notify (not NotifyContext) specifically to detect and act on a repeated signal.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'signal.NotifyContext simply adds a way to OBSERVE Ctrl+C via a context, without changing what Ctrl+C actually does to the process by default.',
      reality: 'This subtopic\'s theory quotes the documentation directly: NotifyContext "will change the behavior" of the target signal — the OS default (immediate exit for os.Interrupt) is replaced by "cancel the returned context" for as long as the context is active. It is a behavior change, not just an additional observation mechanism layered on top of the default.'
    },
    {
      thought: 'If a long-running operation using the main page\'s own NotifyContext pattern hangs or ignores ctx.Done() due to a bug, pressing Ctrl+C multiple times will eventually force it to exit, the same way repeated signals often escalate urgency in other tools.',
      reality: 'This subtopic\'s theory and first code example show the opposite is documented behavior: "future interrupts received will not trigger the default (exit) behavior until the returned stop function is called." Repeated Ctrl+C presses after the first have no effect at all — there is no built-in escalation from NotifyContext alone.'
    },
    {
      thought: 'The stop function returned by NotifyContext restores default Ctrl+C behavior in time to help a user trying to force-quit a hung operation, since it is designed for exactly this signal-handling scenario.',
      reality: 'This subtopic\'s theory and exercise show stop() only runs once the surrounding function returns — typically via a deferred call, which does not execute while a hung operation is still blocking. stop() restores default behavior for the NEXT program run, or once the current run naturally completes; it provides no mid-hang escape hatch for the user.'
    }
  ];
}
