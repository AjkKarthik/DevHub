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
  templateUrl: './hybrid-has-no-circuit-state-lives-in-the-native-process-not-a-connection.html',
  styleUrl: './hybrid-has-no-circuit-state-lives-in-the-native-process-not-a-connection.scss'
})
export class HybridHasNoCircuitStateLivesInTheNativeProcessNotAConnectionSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The whole concept of a "circuit" is specific to Blazor Server\'s architecture — Hybrid genuinely does not have one, not a hidden/simplified version of one',
      points: [
        'The main page\'s theory states this as a fact ("No SignalR circuit"), worth being precise about what that actually means for state lifetime: a Blazor Server circuit exists specifically because C# code runs on a REMOTE server, requiring a persistent connection (the circuit) to keep that remote session alive and route events/updates back and forth across the network — Blazor Hybrid has no network boundary between the UI and the C# code AT ALL, so there is no connection to establish, monitor for disconnection, or eventually let time out.',
        'In Blazor Hybrid, the component tree, its DI scope, and all component state live directly in the SAME native app process the user\'s OS is already running — for as long as that native process is alive (the app is open, possibly backgrounded but not terminated by the OS), that state genuinely persists, with nothing resembling a "reconnection window" or a "disconnected circuit retention period" applying at all, since there was never a connection whose loss needed to be tolerated.',
      ]
    },
    {
      heading: 'What this means practically — Hybrid\'s actual state-loss triggers are entirely different from Server\'s',
      points: [
        'Blazor Server state loss is triggered by NETWORK events (a dropped WebSocket, an expired reconnection window) — Blazor Hybrid state loss is triggered by PROCESS lifecycle events instead: the user force-quitting the app, the OS terminating a backgrounded app under memory pressure (a real, common occurrence on mobile platforms specifically), or the device itself restarting.',
        'This means techniques developed for Blazor Server\'s specific network-disconnection problem (reconnection UI, DisconnectedCircuitRetentionPeriod tuning) have literally no equivalent concept to configure in Hybrid — the closest analogous concern in Hybrid is handling the NATIVE app lifecycle events MAUI itself exposes (OnSleep, OnResume, OnStart) if the app needs to persist state across the OS potentially terminating a backgrounded process, a conceptually similar GOAL (surviving an interruption) achieved through an entirely different mechanism (native app lifecycle hooks, not a network reconnection protocol).',
      ]
    }
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'What actually threatens state in each hosting model',
      language: 'csharp',
      code: `// Blazor SERVER — state loss is a NETWORK problem
//
// User's WiFi drops for 45 seconds → circuit disconnects →
// reconnection window (DisconnectedCircuitRetentionPeriod) starts →
// user's device regains WiFi within the window → reconnects to the
// SAME server-side circuit → state fully intact, nothing lost.
//
// If the window expires before reconnecting: state is genuinely
// gone, full page reload, brand new circuit from scratch.


// Blazor HYBRID — this ENTIRE category of concern does not apply
//
// User's WiFi drops for 45 seconds while using a Hybrid app → NO
// EFFECT AT ALL on the app's own UI state, since the Blazor
// component tree was never depending on a network connection to
// keep running in the first place — it lives directly in the
// native app's own process, which the WiFi drop does not touch.
// (Only an actual in-app network CALL, like a REST API request,
// would be affected — the Blazor UI/state itself is unaffected.)`,
    },
    {
      label: 'Hybrid\'s real state-loss trigger — native process lifecycle',
      language: 'csharp',
      code: `// App.xaml.cs — MAUI's own native app lifecycle hooks
public partial class App : Application
{
    protected override Window CreateWindow(IActivationState? activationState)
    {
        var window = base.CreateWindow(activationState);

        // These fire on genuine OS-level process lifecycle events —
        // NOT anything resembling a network circuit disconnecting.
        window.Stopped += (s, e) =>
        {
            // App backgrounded — the OS MAY terminate this process
            // under memory pressure while backgrounded, especially
            // on mobile. Component state survives ONLY as long as
            // the process itself is not killed.
        };

        window.Resumed += (s, e) =>
        {
            // If the process genuinely survived backgrounding,
            // component state is still fully intact — no
            // "reconnection" concept needed, since nothing ever
            // disconnected. If the OS DID kill the process, this
            // is actually a fresh app launch, not a resume.
        };

        return window;
    }
}`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A developer migrating an app from Blazor Server to Blazor Hybrid removes their CircuitHandler-based logging code (which tracked OnConnectionUpAsync/OnConnectionDownAsync) and replaces it with... nothing, reasoning "Hybrid does not have circuits, so there is nothing equivalent to track." Is there a reasonable equivalent concern worth tracking in Hybrid, even though the specific circuit-based mechanism does not apply?',
    hint: 'Think about what CircuitHandler was actually being used FOR at a higher level (tracking when a user\'s session becomes active/inactive) — is there a genuinely analogous GOAL in Hybrid, even without a literal circuit to hook into?',
    solution: 'There is a reasonable equivalent concern, even though the specific mechanism genuinely does not carry over. CircuitHandler\'s OnConnectionUpAsync/OnConnectionDownAsync were being used for session-level tracking (when did a user\'s session become active or inactive) — in Hybrid, the analogous GOAL maps to MAUI\'s own native app lifecycle events (App.xaml.cs\'s window Resumed/Stopped, or Activated/Deactivated depending on the specific event set used), which fire when the native process itself is foregrounded or backgrounded. This is not the SAME mechanism as CircuitHandler (no network circuit, no server-side session concept at all) but serves a genuinely analogous purpose for a Hybrid app: tracking when the app becomes active/inactive from the OS\'s perspective. Simply removing the tracking code entirely, rather than replacing it with the native-lifecycle equivalent, would be a real gap if the app genuinely needs this kind of visibility — the correct migration is recognizing the GOAL persists even though the specific Blazor Server API (CircuitHandler) has no direct Hybrid equivalent.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'Blazor Hybrid still has some simplified or internal version of a "circuit" concept, just without the network transport — the state lifetime rules from Blazor Server (reconnection windows, disconnection handling) still conceptually apply, just automatically satisfied since there is no network to fail.',
      reality: 'This subtopic\'s theory clarifies Hybrid genuinely has NO circuit concept at all, not a simplified or auto-satisfied version of one — the entire category of "network connection carrying component state" does not exist in Hybrid\'s architecture, since component state lives directly in the native process\'s own memory with no connection-based mechanism involved at any point.'
    },
    {
      thought: 'A network interruption (WiFi dropping) while using a Blazor Hybrid app has the same practical effect on the app\'s own UI state as it would in Blazor Server — a temporary disruption while the connection is down.',
      reality: 'This subtopic\'s first code example shows a network interruption has NO EFFECT AT ALL on a Hybrid app\'s own UI/component state, since that state was never depending on a network connection to keep running — only actual in-app network calls (a REST API request) would be affected, a fundamentally different failure surface than Blazor Server\'s circuit-dependent model.'
    },
    {
      thought: 'Since Blazor Hybrid has no circuit, there is no equivalent concern at all to Blazor Server\'s CircuitHandler-based connect/disconnect tracking — the entire category of "session lifecycle visibility" simply does not apply to Hybrid apps.',
      reality: 'This subtopic\'s exercise shows the underlying GOAL (tracking when a user session becomes active/inactive) still applies to Hybrid, even though the specific mechanism does not — MAUI\'s own native app lifecycle events (window Resumed/Stopped) serve an analogous purpose, achieved through process-lifecycle hooks rather than a network-circuit-based API.'
    }
  ];
}
