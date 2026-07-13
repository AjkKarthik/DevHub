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
  templateUrl: './a-hand-rolled-debounce-needs-cancellation-not-just-a-timer.html',
  styleUrl: './a-hand-rolled-debounce-needs-cancellation-not-just-a-timer.scss'
})
export class AHandRolledDebounceNeedsCancellationNotJustATimerSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'A naive "start a timer on every keystroke" approach does not actually debounce anything — it just delays every single call',
      points: [
        'The main page states debouncing "typically requires a small amount of custom logic," but a common first attempt gets the mechanism wrong: simply wrapping the expensive operation in a new Timer or Task.Delay on every keystroke, without cancelling the PREVIOUS pending timer, means the expensive operation still fires once per keystroke — it is just each individual firing that is delayed, not the overall FREQUENCY reduced at all.',
        'Genuine debouncing requires that starting a NEW delay explicitly CANCELS whatever delay was already pending from the previous keystroke — only the LAST keystroke in a rapid burst should ever actually result in the expensive operation running, with every earlier keystroke\'s pending timer discarded before it fires.',
      ]
    },
    {
      heading: 'A CancellationTokenSource, recreated and disposed correctly on every keystroke, is the idiomatic .NET way to implement this',
      points: [
        'The standard pattern: on each keystroke, cancel and dispose any PREVIOUS CancellationTokenSource, create a brand new one, and start a Task.Delay using its token — if a new keystroke arrives before the delay completes, the token gets cancelled, the delayed Task throws a TaskCanceledException (which must be caught and swallowed, not treated as an error), and the expensive operation never runs for that superseded keystroke.',
        'This pattern also requires proper disposal in the component\'s own Dispose/DisposeAsync method — an outstanding CancellationTokenSource left alive when the component itself is removed from the render tree is a real resource leak, distinct from (but related to) the general "always unsubscribe/dispose" discipline covered elsewhere for event subscriptions.',
        'For Blazor Server specifically, every debounced-away keystroke that is correctly cancelled BEFORE its delay completes also means one fewer SignalR round-trip and one fewer server-side render for that keystroke — the debounce mechanism\'s cancellation step is not just an implementation detail, it is precisely what delivers the "reduced server load" benefit the main page mentions.',
      ]
    }
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'The naive non-fix — delays every call, does not reduce frequency',
      language: 'csharp',
      code: `<input @bind="query" @bind:event="oninput" />

@code {
    private string query = "";

    private async Task OnInput(ChangeEventArgs e)
    {
        query = e.Value?.ToString() ?? "";

        // WRONG: this starts a NEW delay on every keystroke, but
        // never cancels the PREVIOUS one — if the user types 5
        // characters quickly, all 5 Task.Delay calls are running
        // concurrently, and Search() still fires 5 times, just each
        // one 300ms after ITS OWN keystroke. Total call count is
        // completely unchanged — only the timing shifted, which is
        // not debouncing at all.
        await Task.Delay(300);
        await Search(query);
    }
}`,
    },
    {
      label: 'The correct fix — CancellationTokenSource cancels the previous pending call',
      language: 'csharp',
      code: `@implements IDisposable
<input @bind="query" @bind:event="oninput" @onkeyup="OnInput" />

@code {
    private string query = "";
    private CancellationTokenSource? debounceCts;

    private async Task OnInput(KeyboardEventArgs e)
    {
        // Cancel and dispose whatever delay was already pending
        // from the PREVIOUS keystroke — this is the step the naive
        // version above was missing entirely.
        debounceCts?.Cancel();
        debounceCts?.Dispose();
        debounceCts = new CancellationTokenSource();
        var token = debounceCts.Token;

        try
        {
            await Task.Delay(300, token);
            // Only reached if 300ms passed with NO newer keystroke
            // cancelling this specific delay — meaning this really
            // was the last keystroke in the burst.
            await Search(query);
        }
        catch (TaskCanceledException)
        {
            // Expected and harmless — a newer keystroke superseded
            // this one before its delay finished. Swallow, do not
            // treat as an error.
        }
    }

    public void Dispose()
    {
        // Prevent a leaked CancellationTokenSource if the component
        // is removed from the tree with a delay still pending.
        debounceCts?.Cancel();
        debounceCts?.Dispose();
    }
}`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A developer implements debouncing using the naive Task.Delay approach (no CancellationTokenSource) and tests it by typing a single character, waiting, then typing another single character. Both times, Search() correctly fires once, 300ms after each keystroke — leading them to conclude the debounce logic works correctly. Why might this test not have actually caught the bug?',
    hint: 'Think about what specifically distinguishes "debouncing" from "just delaying" — does typing ONE character at a time, with pauses between each, ever actually exercise the difference between the two?',
    solution: 'The test never actually exercised the scenario that distinguishes real debouncing from the naive delay-only approach. Debouncing specifically matters when MULTIPLE keystrokes happen in rapid succession — its entire purpose is reducing N rapid calls down to 1. Typing one character, waiting for the delay to fully resolve, then typing another character never creates the "multiple pending delays racing each other" situation the CancellationTokenSource fix specifically addresses; with only one keystroke active at a time, there is nothing for a missing cancellation step to fail to cancel. The naive version and the correct version would behave IDENTICALLY under this specific test. A test that actually catches the bug needs to simulate a realistic fast-typing burst (multiple keystrokes within the 300ms delay window) and assert that Search() fires only ONCE for the whole burst, not once per keystroke.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'Wrapping an expensive operation in Task.Delay(300) before running it is sufficient to implement debouncing — the delay itself is the mechanism.',
      reality: 'This subtopic\'s first code example shows a Task.Delay alone does not reduce call FREQUENCY at all — it only shifts WHEN each already-scheduled call fires. Genuine debouncing requires actively CANCELLING the previous pending delay when a new one starts, which is a separate, additional step beyond just adding a delay.'
    },
    {
      thought: 'Testing a debounce implementation by typing individual characters with pauses between them is a reasonable way to verify it works correctly.',
      reality: 'This subtopic\'s exercise shows this specific testing approach cannot distinguish a correctly-cancelling implementation from a naive non-cancelling one — debouncing only matters for RAPID, overlapping keystrokes; a test needs to simulate a fast burst within the debounce window to actually exercise (and catch bugs in) the cancellation logic.'
    },
    {
      thought: 'A TaskCanceledException thrown when a debounce delay is cancelled indicates something went wrong and should be logged or surfaced as an error.',
      reality: 'A TaskCanceledException from a superseded debounce delay is the EXPECTED, correct outcome of the cancellation mechanism working as intended, confirmed in this subtopic\'s correct-fix example — it should be caught and silently ignored (not logged as an error), since it simply means a newer keystroke arrived before the older delay finished, exactly what debouncing is supposed to produce.'
    }
  ];
}
