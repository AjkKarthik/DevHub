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
  templateUrl: './ijsinprocessruntime-only-works-in-wasm-same-process-execution.html',
  styleUrl: './ijsinprocessruntime-only-works-in-wasm-same-process-execution.scss'
})
export class IjsinprocessruntimeOnlyWorksInWasmSameProcessExecutionSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'A synchronous call fundamentally requires the caller and callee to run in the same process, on the same thread — WASM genuinely has this property, Blazor Server genuinely does not',
      points: [
        'The main page states IJSInProcessRuntime throws on Blazor Server, worth explaining the actual architectural reason: in Blazor WebAssembly, the entire .NET runtime is compiled to WASM and executes INSIDE the same browser tab, on the same JavaScript engine thread, as the page\'s own JavaScript — a C# method calling a JS function there is, at the machine level, closely analogous to one function calling another within the same process. A truly synchronous call (block, call, get the return value immediately) is genuinely possible because nothing needs to leave that single execution context.',
        'In Blazor Server, the C# code runs on the SERVER — an entirely separate machine/process from the browser where the JavaScript actually executes. Every JS interop call must physically travel over the network (via the SignalR WebSocket connection) to reach the browser, execute there, and travel back with the result — there is no way to make a network round-trip synchronous/blocking without either freezing the server thread indefinitely or fundamentally violating how network I/O works.',
      ]
    },
    {
      heading: 'Why "always use async interop" is the correct universal guidance, not merely a WASM/Server compatibility workaround',
      points: [
        'Because IJSInProcessRuntime is only EVER safe to use in a WASM-only codebase (one that will never run under Blazor Server, including via the Auto render mode, which can transparently switch a component between the two), the main page\'s "always use async interop" guidance is really "write code that works correctly regardless of which hosting model it eventually runs under" — a codebase using IJSInProcessRuntime directly is now permanently coupled to WASM-only deployment, unable to take advantage of Blazor Server or Auto mode without a rewrite.',
        'This becomes especially relevant with .NET 8\'s unified render-mode model, where a component might be authored once and used in either InteractiveServer or InteractiveWebAssembly contexts depending on how the app composes it — a component that hard-codes a synchronous IJSInProcessRuntime call is one that has silently opted itself out of that flexibility, throwing at runtime the moment it happens to execute under Server instead of WASM.',
      ]
    }
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Why this throws specifically — no synchronous path exists',
      language: 'csharp',
      code: `@inject IJSRuntime JS

@code {
    private void GetTimezoneSync()
    {
        // On Blazor SERVER: this cast either fails, or the resulting
        // call throws InvalidOperationException at runtime.
        //
        // The REASON is architectural, not an arbitrary API
        // restriction: JS.Invoke<T>(...) would need to block the
        // CURRENT SERVER THREAD while a message travels over the
        // SignalR WebSocket to the browser, the browser executes the
        // JS, and a response travels back — there is no synchronous
        // primitive in .NET (or in any mainstream server runtime)
        // for "block until an unpredictable network round-trip
        // completes," since that would tie up server resources for
        // an unbounded, network-dependent duration.
        var js = (IJSInProcessRuntime)JS;
        var tz = js.Invoke<string>("Intl.DateTimeFormat().resolvedOptions().timeZone");
    }

    // On Blazor WASM: the identical cast and call succeeds, because
    // "JS" and the C# runtime calling it are both executing in the
    // SAME process, on the SAME thread, in the SAME browser tab —
    // there is no network boundary to cross at all.
}`,
    },
    {
      label: 'Why Auto render mode makes async-only the only safe default',
      language: 'csharp',
      code: `@page "/clock"
@rendermode InteractiveAuto
@inject IJSRuntime JS

@code {
    private async Task<string> GetTimezoneAsync()
        // Works correctly under BOTH InteractiveServer (as an async
        // SignalR round-trip) AND InteractiveWebAssembly (as an
        // async in-process call) — the SAME code, unmodified, is
        // safe regardless of which one this component happens to be
        // running under at a given moment.
        => await JS.InvokeAsync<string>(
            "Intl.DateTimeFormat().resolvedOptions().timeZone");

    // A component using IJSInProcessRuntime directly here would work
    // fine the MOMENT it starts on InteractiveServer (Auto mode's
    // first phase) — then throw the INSTANT it transitions to
    // InteractiveWebAssembly, or vice versa depending on which
    // synchronous assumption was hard-coded — a real, easy-to-miss
    // Auto-mode-specific failure mode.
}`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A developer builds a component using IJSInProcessRuntime, tests it thoroughly, and it works perfectly — because their app is currently configured for Blazor WebAssembly only. Months later, a teammate adds InteractiveAuto rendering to improve initial load performance app-wide, without touching this specific component\'s code. The component starts throwing InvalidOperationException intermittently. Why "intermittently," rather than consistently failing or consistently working?',
    hint: 'Think about what InteractiveAuto actually does on its FIRST phase versus its LATER phase, covered in a different subtopic in this hub — does the component run under the SAME hosting model every single time, once Auto mode is involved?',
    solution: 'The "intermittently" pattern is explained by exactly what InteractiveAuto mode does: it starts a component running under InteractiveServer for fast initial interactivity, then transparently switches to InteractiveWebAssembly once the WASM bundle finishes downloading and caching (covered in this hub\'s render-modes topic). The component\'s IJSInProcessRuntime call fails specifically during the InteractiveServer phase (where the synchronous cast has no valid execution path, per this subtopic\'s theory) and succeeds during the InteractiveWebAssembly phase (where it always worked). Since WHICH phase a given page load lands in depends on browser caching state and timing, the failure appears "intermittent" from the outside — it is not random at all, it is entirely determined by which render mode phase happened to be active for that specific interaction, and would be fully consistent (100% failing) if the component were forced to InteractiveServer-only, or fully consistent (100% working) if forced to InteractiveWebAssembly-only.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'IJSInProcessRuntime throwing on Blazor Server is an arbitrary API restriction Microsoft could remove in a future .NET release if they chose to prioritize it.',
      reality: 'This subtopic\'s theory explains the restriction is architectural, not arbitrary — a genuinely synchronous call requires the caller and callee to execute in the same process/thread, which is fundamentally impossible for Blazor Server\'s C#-runs-on-server, JS-runs-in-browser split; no future API design could make a network round-trip synchronous without violating how networking works at a lower level than .NET itself.'
    },
    {
      thought: 'A component using IJSInProcessRuntime is safe as long as the developer knows their app currently uses Blazor WebAssembly — the restriction only matters for apps that started on Blazor Server.',
      reality: 'This subtopic\'s exercise shows a genuinely WASM-only component can start failing later without any of ITS OWN code changing, if InteractiveAuto rendering is introduced anywhere in the app\'s configuration — Auto mode\'s very first phase always runs under InteractiveServer, meaning any synchronous-only component becomes unsafe the moment Auto mode touches it, even in an app that was previously WASM-only.'
    },
    {
      thought: 'The main page\'s "always use async interop" guidance is primarily about following best practice conventions — using the synchronous API is a valid, equally-correct choice for a component that will only ever run on WASM.',
      reality: 'This subtopic\'s second code example shows async interop is the only choice that remains correct regardless of FUTURE changes to how a component is hosted — a component authored today for WASM-only use has no guarantee it will not later be composed into an Auto-mode or Server-rendered context by someone else\'s changes elsewhere in the app, making the synchronous API a standing latent risk rather than a neutral style choice.'
    }
  ];
}
