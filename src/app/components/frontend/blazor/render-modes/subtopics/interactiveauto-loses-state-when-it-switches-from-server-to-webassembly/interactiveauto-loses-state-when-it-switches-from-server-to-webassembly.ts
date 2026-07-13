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
  templateUrl: './interactiveauto-loses-state-when-it-switches-from-server-to-webassembly.html',
  styleUrl: './interactiveauto-loses-state-when-it-switches-from-server-to-webassembly.scss'
})
export class InteractiveautoLosesStateWhenItSwitchesFromServerToWebassemblySubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'Auto mode is not a smooth hand-off — it is a full teardown and restart in a completely different runtime',
      points: [
        'The main page\'s QnA correctly states state is lost during the Auto transition, but the reason why is worth making concrete: when a component running under InteractiveServer switches to InteractiveWebAssembly, Blazor is not "moving" the running C# object from the server to the browser — it is disposing the server-side circuit\'s component instance entirely and constructing a BRAND NEW component instance inside the WASM runtime that just finished downloading.',
        'These are two entirely separate .NET processes (the server\'s ASP.NET Core process, and the browser\'s WASM sandbox) with no shared memory. Any in-memory field on the component — a counter value, a list the user built up, an in-progress form draft — exists only in the OLD process\'s memory and has no path to the new one unless it was explicitly serialized and handed off.',
      ]
    },
    {
      heading: 'How PersistentComponentState actually bridges this gap',
      points: [
        'PersistentComponentState works by having the component register a value to persist (typically during prerendering or right before the mode switch), which Blazor serializes into the page\'s own HTML as embedded JSON — NOT kept in server memory, but literally written into the page markup itself.',
        'When the new WASM-side component instance starts up, it looks for that same persisted key in the page\'s embedded state and deserializes it back into a field — this is why it works across the transition: the state travels as DATA embedded in the HTML the browser already has, not as a live object being moved between processes.',
        'This is the same underlying mechanism .NET 8 already uses to avoid a double network round-trip during ordinary prerendering (server-fetched data gets embedded so the interactive runtime does not re-fetch it from scratch) — Auto mode\'s Server→WASM transition is just another case where that same persistence mechanism is needed, this time for developer-owned component state rather than data-fetch results.',
      ]
    }
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'The state-loss problem',
      language: 'csharp',
      code: `@page "/survey"
@rendermode InteractiveAuto

<h1>Survey</h1>
<input @bind="userAnswer" placeholder="Type your answer..." />
<p>Characters typed: @userAnswer.Length</p>

@code {
    private string userAnswer = "";
    // Works fine while running under InteractiveServer.
    // The MOMENT the Auto transition to InteractiveWebAssembly happens
    // (e.g. on the next navigation, once the WASM bundle finished
    // downloading and caching), a BRAND NEW component instance is
    // constructed inside the WASM runtime — userAnswer resets to "",
    // silently discarding whatever the user had typed.
}`,
    },
    {
      label: 'The fix — PersistentComponentState',
      language: 'csharp',
      code: `@page "/survey"
@rendermode InteractiveAuto
@implements IDisposable
@inject PersistentComponentState AppState

<h1>Survey</h1>
<input @bind="userAnswer" placeholder="Type your answer..." />
<p>Characters typed: @userAnswer.Length</p>

@code {
    private string userAnswer = "";
    private PersistingComponentStateSubscription persistSubscription;

    protected override void OnInitialized()
    {
        // On the NEW instance's startup (whichever runtime it lands in),
        // try to restore a previously persisted value first.
        if (AppState.TryTakeFromJson<string>("surveyAnswer", out var restored))
        {
            userAnswer = restored ?? "";
        }

        // Register a callback that fires right before this instance's
        // state gets serialized into the page — Blazor calls this at the
        // correct moment automatically, both during normal prerendering
        // AND right before an Auto mode transition tears this instance down.
        persistSubscription = AppState.RegisterOnPersisting(() =>
        {
            AppState.PersistAsJson("surveyAnswer", userAnswer);
            return Task.CompletedTask;
        });
    }

    public void Dispose() => persistSubscription.Dispose();
}`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A developer notices their InteractiveAuto-mode shopping cart component loses its items when Auto transitions from Server to WebAssembly, and tries to fix it by making the cart list a static field instead of an instance field, reasoning that "static fields survive object recreation." Does this fix the problem?',
    hint: 'Think about WHERE a static field actually lives — is a C# static field shared between the server\'s ASP.NET Core process and the browser\'s separate WASM sandbox process?',
    solution: 'No — this does not fix the problem, and reveals a deeper misunderstanding of what the Server-to-WASM transition actually is. A static field is scoped to a single .NET process/AppDomain — it survives object recreation only WITHIN that same running process. But the Auto mode transition is not recreating an object within the same process; it is discarding the server-side ASP.NET Core process\'s component entirely and starting a fresh component inside the browser\'s completely separate WASM runtime. A static field on the server has no meaning at all inside the WASM sandbox — there is no shared memory, no shared process, nothing to "survive" across. The only correct fix is PersistentComponentState (or a shared backend API to fetch the data again), because it moves the data as serialized JSON embedded in the page HTML itself — the one thing both the server-rendered page and the newly-starting WASM runtime both actually have access to.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'InteractiveAuto\'s switch from Server to WebAssembly is a lightweight, in-place upgrade of the same running component — like changing a setting on an object that keeps existing.',
      reality: 'The switch is a full teardown of the server-side component instance and construction of a brand new instance inside a completely separate WASM process, confirmed by the fact that PersistentComponentState (serializing state into the page\'s own HTML) is the ONLY reliable way to carry data across — there is no shared memory between the two runtimes for anything to survive in place.'
    },
    {
      thought: 'Static C# fields, or a Singleton-registered service, would survive an InteractiveAuto mode transition since they are not tied to a specific component instance.',
      reality: 'Static fields and Singleton services are scoped to a single .NET PROCESS — the server\'s ASP.NET Core process and the browser\'s WASM sandbox are two entirely separate processes with no shared memory whatsoever, so neither mechanism bridges the gap. PersistentComponentState works specifically because it serializes data into the page\'s own HTML, the one artifact both runtimes share.'
    },
    {
      thought: 'PersistentComponentState keeps data in server memory and hands it to the WASM runtime over the network when the transition happens.',
      reality: 'PersistentComponentState serializes the value into embedded JSON written directly into the page\'s HTML — it is not held in server memory waiting to be fetched. The new WASM-side component reads that JSON directly from the page it already has, the same mechanism .NET 8 uses to avoid a redundant data-fetch round-trip during ordinary prerendering.'
    }
  ];
}
