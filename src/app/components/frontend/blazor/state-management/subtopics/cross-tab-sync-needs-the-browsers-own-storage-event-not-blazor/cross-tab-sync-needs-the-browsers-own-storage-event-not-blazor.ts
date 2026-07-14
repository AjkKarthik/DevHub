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
  templateUrl: './cross-tab-sync-needs-the-browsers-own-storage-event-not-blazor.html',
  styleUrl: './cross-tab-sync-needs-the-browsers-own-storage-event-not-blazor.scss'
})
export class CrossTabSyncNeedsTheBrowsersOwnStorageEventNotBlazorSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'Every browser tab is a genuinely separate Blazor circuit (Server) or app instance (WASM) — there is no shared C# memory between them at all',
      points: [
        'The main page\'s QnA correctly states Blazor has no built-in cross-tab mechanism, worth explaining why: on Blazor Server, each browser tab opens its OWN SignalR circuit with its OWN Scoped DI container — a Scoped state service in Tab A is a completely different object instance from the "same" service in Tab B, even though both tabs are ultimately talking to the same server process. On WASM, each tab runs its OWN independent WebAssembly runtime instance entirely.',
        'This means the reactive "Scoped service + OnChange event" pattern covered elsewhere in this hub only ever notifies components WITHIN the same circuit/tab — it has no mechanism to reach across to a different tab\'s completely separate service instance, no matter how the event is structured.',
      ]
    },
    {
      heading: 'The actual bridge between tabs is the browser\'s own StorageEvent — a standard Web API, not anything Blazor-specific',
      points: [
        'The browser fires a genuine \'storage\' event on the window object of every OTHER open tab (from the same origin) whenever localStorage is modified from ANY of them — this is a real, standard browser mechanism that exists completely independently of any framework, and it is the only practical way for Blazor code to learn "something changed in another tab."',
        'Using this from Blazor requires JS interop in both directions: a small JavaScript snippet registers a window.addEventListener(\'storage\', ...) listener and calls back into .NET via a DotNetObjectReference when the event fires, since there is no C# API that receives browser-level events directly — the C# side must be told about the change through this JS bridge.',
        'Critically, the \'storage\' event fires ONLY in OTHER tabs, never in the SAME tab that made the change — a tab writing to localStorage does not receive its own storage event, so the writing tab must update its own UI directly (through its normal reactive state mechanism) while relying on the storage event exclusively to notify every OTHER open tab.',
      ]
    }
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'JS side — listen for storage changes, call back into .NET',
      language: 'csharp',
      code: `// wwwroot/crossTabSync.js
export function listenForStorageChanges(dotNetRef) {
    window.addEventListener('storage', (event) => {
        if (event.key === 'theme') {
            // Calls a public method on the .NET side, passing the
            // NEW value that was just written in the OTHER tab.
            dotNetRef.invokeMethodAsync('OnStorageChangedFromOtherTab', event.newValue);
        }
    });
}`,
    },
    {
      label: 'C# side — register the listener, react to other-tab changes',
      language: 'csharp',
      code: `@inject IJSRuntime JS
@implements IAsyncDisposable

<p>Theme: @theme</p>

@code {
    private string theme = "light";
    private DotNetObjectReference<ThemeSyncComponent>? selfRef;
    private IJSObjectReference? module;

    protected override async Task OnAfterRenderAsync(bool firstRender)
    {
        if (!firstRender) return;

        selfRef = DotNetObjectReference.Create(this);
        module = await JS.InvokeAsync<IJSObjectReference>(
            "import", "./crossTabSync.js");
        await module.InvokeVoidAsync("listenForStorageChanges", selfRef);
    }

    [JSInvokable]
    public void OnStorageChangedFromOtherTab(string newValue)
    {
        // Fired ONLY when a DIFFERENT tab changed localStorage —
        // this tab's own writes never trigger this callback, by
        // design of the browser's storage event itself.
        theme = newValue;
        StateHasChanged();
    }

    public async ValueTask DisposeAsync()
    {
        selfRef?.Dispose();
        if (module is not null) await module.DisposeAsync();
    }
}`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A developer implements the JS storage-event listener shown in this subtopic, then tests it by opening ONE browser tab, changing the theme, and expecting to see OnStorageChangedFromOtherTab fire in that SAME tab to confirm it works. It never fires. They conclude the JS interop wiring must be broken. Is that the right conclusion?',
    hint: 'Think about which tabs the browser\'s own \'storage\' event actually fires in — does it include the tab that MADE the change, or only OTHER tabs?',
    solution: 'That is likely the wrong conclusion — the JS interop wiring may be working correctly. This subtopic\'s theory states the browser\'s \'storage\' event fires ONLY in OTHER tabs from the same origin, never in the SAME tab that made the localStorage change — this is standard, documented browser behavior, not a bug in the interop code. Testing with a single tab can never demonstrate this working, since there is no "other tab" for the event to fire in. The correct test requires genuinely opening TWO separate tabs to the same app, changing the value in Tab A, and confirming Tab B (not Tab A) receives the callback — Tab A is expected to update its own UI through its normal reactive mechanism (e.g. directly setting theme after the SetAsync call), not through the storage event at all.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'Blazor\'s Scoped service + OnChange event pattern, the recommended approach for reactive shared state within one tab, can be extended to also notify other open browser tabs, since they are all part of the "same app."',
      reality: 'This subtopic\'s theory clarifies each browser tab is a genuinely SEPARATE circuit (Server) or app instance (WASM) with its own completely independent DI container — a Scoped service\'s OnChange event has no mechanism to reach a different tab\'s separate service instance at all, no matter how the pattern is structured; only the browser\'s own StorageEvent can bridge across tabs.'
    },
    {
      thought: 'The browser\'s \'storage\' event fires in every tab, including the one that made the change, providing a simple way to confirm a write succeeded.',
      reality: 'This subtopic\'s exercise shows the \'storage\' event specifically fires ONLY in OTHER tabs, never the tab that made the change — a real, standard browser behavior that trips up single-tab testing; the writing tab must rely on its own normal reactive mechanism, not the storage event, to reflect its own change.'
    },
    {
      thought: 'Cross-tab synchronization in Blazor requires a third-party library or a server-side SignalR broadcast — there is no way to achieve it using only standard browser APIs.',
      reality: 'This subtopic\'s code examples show cross-tab sync IS achievable using only a standard browser Web API (the \'storage\' event) combined with Blazor\'s own built-in JS interop — no third-party library or server-side broadcast channel is strictly required, though the main page\'s QnA correctly notes a SignalR hub is a valid ALTERNATIVE approach for more complex real-time synchronization needs.'
    }
  ];
}
