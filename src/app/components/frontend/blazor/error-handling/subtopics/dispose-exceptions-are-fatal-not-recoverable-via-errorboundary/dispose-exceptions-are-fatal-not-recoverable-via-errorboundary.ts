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
  templateUrl: './dispose-exceptions-are-fatal-not-recoverable-via-errorboundary.html',
  styleUrl: './dispose-exceptions-are-fatal-not-recoverable-via-errorboundary.scss'
})
export class DisposeExceptionsAreFatalNotRecoverableViaErrorboundarySubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'Most lifecycle exceptions are recoverable through ErrorBoundary — an exception from Dispose is a deliberate exception to that model',
      points: [
        'The main page already notes ErrorBoundary does not catch exceptions from Dispose — the reason is not that Blazor forgot to wire it up, it is a deliberate design choice: Microsoft\'s own documentation states that if a component\'s Dispose method throws an unhandled exception in an app running over a circuit, that exception is FATAL to the circuit, full stop, with no ErrorBoundary-style recovery path offered at all.',
        'This is a genuinely different treatment from almost every other lifecycle method (OnInitializedAsync, OnParametersSetAsync, event handlers), where an unhandled exception CAN be caught by an enclosing ErrorBoundary and recovered from via Recover() — disposal is treated as the one place where recovery isn\'t offered as an option.',
      ]
    },
    {
      heading: 'Why disposal specifically gets this harsher treatment',
      points: [
        'Disposal is meant to be a one-way, terminal operation — releasing resources, unsubscribing from events, closing connections — as a component is being permanently removed. There is no meaningful "retry" for a partially-completed disposal the way there is for a failed data fetch: the component instance is already on its way out, so ErrorBoundary\'s whole model of "catch, show fallback UI, let the user retry" doesn\'t map onto what disposal even represents.',
        'Practically, this means a bug in a component\'s Dispose/DisposeAsync override (a null reference on an already-disposed dependency, an exception from an unsubscribe call on a already-torn-down event source) is one of the highest-severity classes of bug in a Blazor Server app specifically — it doesn\'t just break one feature, it can take down the entire user session for everyone connected on that circuit.',
      ]
    }
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'A Dispose bug that crashes the whole circuit, not just one component',
      language: 'csharp',
      code: `public class LiveDashboard : ComponentBase, IDisposable
{
    [Inject] private ITickerService Ticker { get; set; } = default!;

    protected override void OnInitialized()
    {
        Ticker.PriceChanged += OnPriceChanged;
    }

    public void Dispose()
    {
        // BUG: if Ticker was already disposed by the DI container's
        // own scope teardown (a real race in some hosting scenarios),
        // this throws ObjectDisposedException — and NOTHING catches
        // it. Not the surrounding ErrorBoundary, not a try-catch
        // anywhere else. It goes straight to the renderer's fatal
        // exception path and tears down the entire circuit.
        Ticker.PriceChanged -= OnPriceChanged;
    }

    private void OnPriceChanged(object? sender, decimal price) => InvokeAsync(StateHasChanged);
}`,
    },
    {
      label: 'Defensive disposal — never let Dispose itself throw',
      language: 'csharp',
      code: `public class LiveDashboard : ComponentBase, IDisposable
{
    [Inject] private ITickerService Ticker { get; set; } = default!;
    [Inject] private ILogger<LiveDashboard> Logger { get; set; } = default!;

    protected override void OnInitialized()
    {
        Ticker.PriceChanged += OnPriceChanged;
    }

    public void Dispose()
    {
        try
        {
            Ticker.PriceChanged -= OnPriceChanged;
        }
        catch (Exception ex)
        {
            // Swallow-and-log deliberately here: Dispose is one of the
            // few places where letting an exception escape is strictly
            // worse than logging and moving on — there is no
            // ErrorBoundary that will save the circuit from this one.
            Logger.LogWarning(ex, "Cleanup failed during LiveDashboard disposal");
        }
    }

    private void OnPriceChanged(object? sender, decimal price) => InvokeAsync(StateHasChanged);
}`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A component wraps its risky child content in an ErrorBoundary, expecting it to protect the page from any exception the child might throw. When the user navigates away and the child component is disposed, an exception is thrown inside its Dispose method (an already-disposed dependency). The ErrorBoundary shows no fallback content — instead, the whole page disconnects and the user sees a reconnecting overlay. Why didn\'t the ErrorBoundary do its job here?',
    hint: 'Is EVERY lifecycle exception treated the same way by Blazor, or does one specific lifecycle method get deliberately excluded from ErrorBoundary\'s recovery model?',
    solution: 'The ErrorBoundary was never going to catch this one — Dispose (and DisposeAsync) exceptions are deliberately excluded from ErrorBoundary\'s recovery model by design, not by oversight. Microsoft\'s own documentation states plainly that an unhandled exception in a component\'s Dispose method is fatal to the circuit when running over Blazor Server, with no ErrorBoundary-mediated recovery path available at all — unlike an exception in OnInitializedAsync or an event handler, which CAN be caught and recovered from. The reasoning is that disposal is a one-way, terminal operation with no meaningful "retry," so the fix here isn\'t adding a bigger or better-placed ErrorBoundary — it\'s making sure Dispose/DisposeAsync overrides never let an exception escape in the first place, typically by wrapping risky cleanup work (unsubscribing from an already-torn-down event source, releasing an already-disposed dependency) in its own try-catch that logs and swallows.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'ErrorBoundary catches exceptions from every lifecycle method a component has, including Dispose and DisposeAsync — it just displays them differently depending on which method threw.',
      reality: 'This subtopic\'s theory clarifies Dispose/DisposeAsync exceptions are a genuine, deliberate exception to ErrorBoundary\'s recovery model — Microsoft\'s documentation confirms they are fatal to the circuit with no ErrorBoundary-mediated recovery offered, unlike almost every other lifecycle method.'
    },
    {
      thought: 'If an ErrorBoundary is wrapped around a component and the page still crashes on an exception, the ErrorBoundary itself must be misconfigured or placed wrong.',
      reality: 'This subtopic\'s exercise shows a correctly-placed, correctly-configured ErrorBoundary genuinely cannot help with a Dispose-time exception — this isn\'t a configuration problem to fix by moving the boundary, it\'s a category of exception ErrorBoundary was never designed to catch at all.'
    },
    {
      thought: 'Wrapping cleanup logic in try-catch inside Dispose is unnecessary defensive coding, since any real error would have already surfaced earlier in the component\'s lifecycle.',
      reality: 'This subtopic\'s theory shows disposal-time failures (an already-disposed dependency from a DI scope teardown race, an unsubscribe on an already-torn-down event source) are a distinct failure class that only manifests AT disposal — defensive try-catch specifically inside Dispose/DisposeAsync is one of the few places in Blazor where it is genuinely warranted, not premature.'
    }
  ];
}
