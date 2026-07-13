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
  templateUrl: './navigateto-forceload-schedules-the-reload-code-after-it-still-runs.html',
  styleUrl: './navigateto-forceload-schedules-the-reload-code-after-it-still-runs.scss'
})
export class NavigatetoForceloadSchedulesTheReloadCodeAfterItStillRunsSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'NavigateTo() is a request to navigate, not an immediate, synchronous teardown of the current page',
      points: [
        'The main page\'s own QnA states the practical consequence, worth grounding in the actual mechanism: calling NavigationManager.NavigateTo(url) — with or without forceLoad — does not synchronously halt or throw from the calling method. It SCHEDULES the navigation (or, with forceLoad: true, a full browser page reload) and immediately returns control to the caller.',
        'This means any code written AFTER a NavigateTo() call, within the SAME synchronous method body, still executes normally before the method returns — the navigation/reload genuinely happens afterward, asynchronously from the app code\'s own perspective, not as an instantaneous side effect of the call itself.',
      ]
    },
    {
      heading: 'Why this creates a real, easy-to-miss bug category: code that assumes "we have already left" runs on a component about to be torn down',
      points: [
        'Any state mutation, StateHasChanged() call, or further logic written after a forceLoad: true NavigateTo() executes on a component instance that is (from the developer\'s mental model) already "gone" — but is, in practice, still fully alive and processing code for however long it takes the browser to actually complete the reload.',
        'The correct pattern (and the main page\'s own guidance) is to place any cleanup or final logic BEFORE the NavigateTo() call, not after — by the time NavigateTo() is called, any state that genuinely needs to be finalized should already be finalized, since nothing meaningful should be relying on code AFTER the call to still matter.',
        'This distinction matters less for forceLoad: false (Blazor\'s own enhanced/SPA-style navigation, which swaps page content without a full reload) since the SAME running application continues afterward — but the "code after NavigateTo still runs" behavior itself is identical in both cases; only the ultimate CONSEQUENCE of that lingering code differs.',
      ]
    }
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'The bug — code after forceLoad NavigateTo still executes',
      language: 'csharp',
      code: `@inject NavigationManager Nav

<button @onclick="Logout">Log Out</button>

@code {
    private void Logout()
    {
        Nav.NavigateTo("/login", forceLoad: true);

        // BUG: this line is NOT dead code — it genuinely still runs,
        // since NavigateTo() only SCHEDULES the reload and returns
        // immediately. If "isLoggingOut" drives any UI state, this
        // executes on a component instance that is about to be torn
        // down by the reload, producing a flash of unwanted UI state
        // (or worse, a StateHasChanged() call on an instance mid-teardown).
        isLoggingOut = true;
        StateHasChanged();
    }

    private bool isLoggingOut;
}`,
    },
    {
      label: 'The fix — finalize state BEFORE calling NavigateTo',
      language: 'csharp',
      code: `@inject NavigationManager Nav

<button @onclick="Logout">Log Out</button>

@code {
    private async Task Logout()
    {
        // Any state that genuinely needs to be finalized happens
        // FIRST, before the navigation is even requested — nothing
        // relies on code AFTER NavigateTo() to matter anymore.
        await AuthService.SignOutAsync();
        ClearLocalSessionData();

        // By the time this is called, there is nothing left this
        // component needs to do — the reload happening afterward,
        // asynchronously, is fine, since no further code depends on
        // "having already navigated away."
        Nav.NavigateTo("/login", forceLoad: true);
    }
}`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A developer writes an event handler that calls Nav.NavigateTo("/checkout-complete", forceLoad: true) followed immediately by cart.Clear() (clearing the shopping cart\'s in-memory state) on the next line. They assume this is safe since "the user is leaving this page anyway." Is there a real risk here?',
    hint: 'Think about WHEN cart.Clear() actually executes relative to when the browser genuinely finishes reloading — is there a window where both the OLD page (with its cart state) and something depending on it could still be active?',
    solution: 'Yes, there is a real risk, though a narrower one than the logout example. Since NavigateTo(forceLoad: true) only schedules the reload and returns immediately, cart.Clear() genuinely executes on the CURRENT, still-alive component instance, in the brief window before the browser actually completes the reload. If cart is a Scoped service also referenced by OTHER currently-rendered components on the SAME page (e.g. a cart-count badge in the header), clearing it here can cause a visible flicker (the badge dropping to zero) in that brief window before the reload actually replaces the page — a real, if minor, UI glitch. The safer pattern remains the same as the logout example: perform "clear the cart" logic as part of the actual checkout-completion process (e.g. server-confirmed, before or independent of navigation), rather than relying on code positioned after a forceLoad NavigateTo() call, since the exact timing of when that code runs relative to the reload is not something to build a dependency on.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'Calling NavigationManager.NavigateTo(url, forceLoad: true) immediately halts execution of the current method, similar to how a thrown exception or a return statement would.',
      reality: 'This subtopic\'s first code example shows NavigateTo() does not halt execution at all — it schedules the navigation/reload and returns control to the caller immediately, so any code written after the call within the same method genuinely still executes before the method returns.'
    },
    {
      thought: 'Code written after a NavigateTo() call is effectively dead code, safe to leave in place even if it does something meaningful, since "the user is already gone" by that point.',
      reality: 'This subtopic\'s exercise shows code after NavigateTo() is very much alive and can execute meaningfully — including causing visible UI glitches (like a shared service\'s state changing and affecting other still-rendered components) in the real window between the call and the actual page reload completing.'
    },
    {
      thought: 'The "code after NavigateTo still runs" behavior is specific to forceLoad: true — with forceLoad: false (Blazor\'s enhanced navigation), code after the call is guaranteed not to run since the SPA-style navigation is presumed instantaneous.',
      reality: 'The scheduling behavior itself (NavigateTo returning immediately, code after it still executing) is IDENTICAL in both cases — this subtopic\'s theory clarifies only the ultimate CONSEQUENCE differs: with forceLoad: false the same running app continues afterward (so lingering code often causes fewer visible problems), but the underlying mechanism that makes "code after NavigateTo still runs" true is not specific to forceLoad: true at all.'
    }
  ];
}
