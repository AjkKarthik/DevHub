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
  templateUrl: './isfixed-true-permanently-freezes-a-cascading-values-re-traversal.html',
  styleUrl: './isfixed-true-permanently-freezes-a-cascading-values-re-traversal.scss'
})
export class IsfixedTruePermanentlyFreezesACascadingValuesReTraversalSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'IsFixed is a one-time promise to the framework, not a runtime toggle it re-checks',
      points: [
        'The main page\'s QnA mentions IsFixed as a performance optimisation that skips re-traversal, but the practical consequence is worth spelling out plainly: once a CascadingValue is declared with IsFixed="true", Blazor makes exactly ONE pass to distribute that value to descendants at the point they first initialize, and then genuinely NEVER checks it again for the remaining lifetime of that CascadingValue instance — not on the next render, not ever, regardless of whether the underlying value actually changes afterward.',
        'This is fundamentally different from the normal (non-fixed) behavior, where Blazor re-traverses the subtree and re-delivers the current value to every [CascadingParameter] consumer on every render where the CascadingValue\'s own Value could plausibly have changed — IsFixed opts a component OUT of that ongoing traversal entirely, permanently, from the very first render onward.',
      ]
    },
    {
      heading: 'Why this makes IsFixed a genuine correctness risk, not just a performance knob to casually enable',
      points: [
        'If a developer sets IsFixed="true" on a value that is NOT actually fixed — say, a settings object that gets mutated later via some other code path — descendant components that received the value during the first pass will silently keep displaying the ORIGINAL value forever, with no error, no warning, and no way to force a refresh short of literally recreating the entire CascadingValue subtree (e.g. via a changed @key).',
        'The main page\'s own guidance ("only use it when the value truly never changes after initial render") is the correct rule, but the failure mode when that rule is violated is exactly what makes this dangerous: the bug is completely silent, produces no exception, and can pass casual testing if the mutation happens to occur AFTER the specific screen was already checked — surfacing only later as "why isn\'t this updating" reports that are hard to trace back to a distant IsFixed="true" declaration.',
      ]
    }
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'IsFixed with a genuinely constant value — the safe case',
      language: 'csharp',
      code: `<!-- App.razor — CultureInfo is set once at app startup and never
     changes for the lifetime of this circuit/session -->
<CascadingValue Value="appCulture" IsFixed="true">
    <Router AppAssembly="typeof(App).Assembly" />
</CascadingValue>

@code {
    // Set once, during the very first render, and genuinely never
    // reassigned anywhere else in the app's lifetime — a safe use
    // of IsFixed, since there is nothing to miss by skipping
    // re-traversal.
    private readonly CultureInfo appCulture = CultureInfo.CurrentCulture;
}`,
    },
    {
      label: 'IsFixed with a value that DOES change — the silent bug',
      language: 'csharp',
      code: `<!-- SettingsProvider.razor -->
<CascadingValue Value="userSettings" IsFixed="true">
    @ChildContent
</CascadingValue>

@code {
    [Parameter] public RenderFragment? ChildContent { get; set; }
    private UserSettings userSettings = new();

    public void UpdateTheme(string newTheme)
    {
        userSettings.Theme = newTheme;
        StateHasChanged();
        // SettingsProvider itself re-renders and shows the new
        // theme wherever IT directly displays it — but every
        // DESCENDANT that received userSettings via
        // [CascadingParameter] during the FIRST pass keeps showing
        // the OLD theme forever. IsFixed="true" told Blazor it would
        // never need to re-check this value, so it genuinely does
        // not — no error, no warning, just silently stale data in
        // every consuming descendant.
    }
}`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A team enables IsFixed="true" on a CascadingValue providing the current authenticated user\'s permissions object, reasoning "permissions rarely change during a session, so this is a safe performance win." Weeks later, a support ticket reports that after an admin revokes a user\'s permission mid-session (via a real-time SignalR push the app already supports), several UI elements that should now be hidden remain visible until the user manually refreshes the page. Is IsFixed the likely cause?',
    hint: 'Think about what "rarely changes" versus "genuinely NEVER changes for the lifetime of the CascadingValue" actually means for IsFixed\'s safety — does IsFixed care about how OFTEN a value changes, or whether it can change AT ALL?',
    solution: 'Yes, IsFixed is very likely the cause, and the team\'s reasoning ("rarely changes" is a safe justification) is exactly the mistake this subtopic warns against. IsFixed does not care how RARELY a value changes — it is a promise that the value NEVER changes after the first render, and Blazor takes that promise completely literally by never re-checking afterward. The mid-session permission revocation is precisely the "value that DOES change" scenario from this subtopic\'s second code example: the permissions object mutates, but every descendant component that already received it via [CascadingParameter] during the initial pass keeps referencing the stale snapshot, with no error or warning anywhere in the system. The fix is to remove IsFixed="true" for this specific CascadingValue (accepting the small re-traversal cost) since permissions genuinely CAN change during a session, even if infrequently — "rarely" and "never" are not the same guarantee, and only "never" is safe for IsFixed.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'IsFixed="true" is safe to use for any value that changes infrequently, since the performance benefit outweighs the rare cost of a slightly stale value for a moment.',
      reality: 'This subtopic\'s exercise shows the actual risk is unbounded, not "slightly stale for a moment" — once IsFixed is set, descendants NEVER receive updates for the remaining lifetime of that CascadingValue, with no automatic recovery. "Infrequently changes" and "never changes" are different guarantees, and only the latter is genuinely safe for IsFixed.'
    },
    {
      thought: 'If a value marked IsFixed="true" does change, Blazor will detect the mismatch and either log a warning or fall back to re-traversing that specific update.',
      reality: 'There is no detection, warning, or fallback mechanism at all — confirmed in this subtopic\'s second code example, where the CascadingValue provider itself re-renders correctly, but every descendant that already consumed the fixed value keeps silently displaying the original snapshot forever, with nothing in the system signaling that anything is wrong.'
    },
    {
      thought: 'The performance cost IsFixed avoids (re-traversal on every render) is significant enough that it is generally worth the tradeoff for most CascadingValue usages, not just genuinely constant ones.',
      reality: 'The main page\'s own guidance, reinforced by this subtopic, is the opposite: IsFixed should be reserved specifically for values that are provably constant for the CascadingValue\'s entire lifetime (like a startup-time culture setting) — for anything with even a small chance of legitimately changing later, the correctness risk of a permanently stale, silently-wrong UI outweighs the re-traversal performance cost being avoided.'
    }
  ];
}
