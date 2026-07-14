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
  templateUrl: './the-reconnection-window-only-preserves-state-for-the-same-circuit.html',
  styleUrl: './the-reconnection-window-only-preserves-state-for-the-same-circuit.scss'
})
export class TheReconnectionWindowOnlyPreservesStateForTheSameCircuitSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'A "disconnected" circuit is not immediately destroyed — it is held in memory, paused, waiting for a specific reconnection attempt',
      points: [
        'The main page\'s QnA states there is a reconnection window, worth being precise about the actual mechanism: when a browser tab loses its WebSocket connection (a network blip, a laptop sleeping briefly), the SERVER does not immediately dispose the circuit\'s component tree and state — it keeps that specific circuit alive in memory, in a paused/disconnected state, for up to DisconnectedCircuitRetentionPeriod, waiting to see if the SAME browser session reconnects.',
        'The browser side shows the "reconnecting" overlay and attempts to re-establish a connection using a circuit identifier it remembers from the original connection — if that reconnection attempt reaches the server before the retention period expires, the server matches it back to the SAME paused circuit and resumes it exactly where it left off, with every field, every subscription, every bit of in-memory state intact.',
      ]
    },
    {
      heading: 'What genuinely happens if the window expires, or the specific circuit cannot be matched',
      points: [
        'If the retention period expires before reconnection succeeds (a longer outage, or the server itself restarted/redeployed in the meantime, destroying ALL its in-memory circuits), the ORIGINAL circuit and everything it held is genuinely gone — there is no possible recovery of that specific state, since it was never persisted anywhere outside that one server process\'s memory.',
        'In this expired-window case, Blazor\'s client-side JavaScript falls back to a full page reload — which starts an ENTIRELY NEW circuit from scratch, running every component\'s OnInitialized/OnInitializedAsync again as if the user had never visited the page before; any unsaved in-memory state (a partially-filled form, an in-progress multi-step wizard not yet persisted to a database) is genuinely lost, not silently recovered.',
        'This is precisely why the main page\'s "what happens to UI state" QnA distinguishes the two outcomes so sharply — successful reconnection within the window is a seamless resume with zero data loss, while an expired window is functionally identical to the user closing the tab and starting completely over, and there is no middle ground between these two outcomes.',
      ]
    }
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Configuring the retention window',
      language: 'csharp',
      code: `// Program.cs
builder.Services.AddRazorComponents()
    .AddInteractiveServerComponents(options =>
    {
        // How long a disconnected circuit is kept alive in server
        // memory, awaiting a possible reconnection, before being
        // permanently disposed.
        options.DisconnectedCircuitRetentionPeriod = TimeSpan.FromMinutes(3);

        // How many disconnected circuits (across ALL users) the
        // server will hold onto simultaneously — a memory-vs-resilience
        // tradeoff for high-traffic apps.
        options.DisconnectedCircuitMaxRetained = 100;
    });

// A LONGER retention period means a user surviving a brief network
// drop (walking out of WiFi range briefly, laptop sleeping) is more
// likely to resume with zero data loss — at the cost of holding
// more disconnected circuits' full state in server memory for longer.`,
    },
    {
      label: 'What is genuinely preserved vs genuinely lost',
      language: 'csharp',
      code: `@page "/order-form"
@rendermode InteractiveServer

@code {
    private OrderModel order = new();
    // A user fills out several fields, then their laptop briefly
    // sleeps, dropping the WebSocket.

    // WITHIN the retention window (reconnection succeeds):
    // "order" still holds every field the user typed — this exact
    // same in-memory object, on the exact same circuit, resumes.
    // No re-fetch, no re-render from scratch, genuinely unchanged.

    // AFTER the retention window expires (reconnection fails):
    // The browser falls back to a full page reload. A BRAND NEW
    // OrderModel is constructed. Every field the user had typed is
    // gone — not recoverable, since it only ever existed in the
    // NOW-DISPOSED original circuit's server memory, never written
    // anywhere durable.
}`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A team sets DisconnectedCircuitRetentionPeriod to 30 minutes, reasoning "longer is strictly better for user experience, since it maximizes the chance of a successful reconnection." A colleague raises a concern about this specific change. What is the colleague likely concerned about?',
    hint: 'Think about what a disconnected circuit actually costs the SERVER while it waits in this state — does a longer retention period have a cost beyond just "using more memory briefly"?',
    solution: 'The colleague is likely concerned about server memory pressure from accumulated disconnected circuits, not just briefly, but for a genuinely long 30-minute window. Every disconnected circuit within the retention period still holds its FULL component tree state in server memory, exactly as if it were still connected — a 30-minute window means every user who ever experiences even a brief, permanent disconnection (closes their laptop for the day mid-session, network truly drops) keeps their entire circuit\'s memory footprint alive on the server for a full 30 minutes before it is ever reclaimed, even though the overwhelming majority of these will never actually reconnect. At any meaningful scale, this can accumulate into significant wasted server memory held by circuits that are, for all practical purposes, already abandoned — DisconnectedCircuitMaxRetained (a cap on how many disconnected circuits are held at once) is the other half of managing this tradeoff, but a long retention period still meaningfully increases peak memory pressure under real-world usage patterns where most disconnections are permanent, not transient.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'When a Blazor Server circuit disconnects, the server immediately disposes it and its state — the "reconnecting" overlay is purely a client-side cosmetic effect with no corresponding server-side preservation.',
      reality: 'This subtopic\'s theory clarifies the server genuinely keeps the disconnected circuit alive in memory, in a paused state, for up to DisconnectedCircuitRetentionPeriod — this is real, meaningful server-side state preservation, not merely a client-side loading indicator with nothing backing it.'
    },
    {
      thought: 'If a circuit\'s reconnection window expires, the user\'s unsaved state can still potentially be recovered through some Blazor mechanism, as long as they eventually come back to the page.',
      reality: 'This subtopic\'s theory is explicit that an expired retention window means the original circuit and everything it held is genuinely, permanently gone — the client falls back to a full page reload starting an entirely NEW circuit from scratch, with no possible recovery path for whatever state existed only in the disposed original circuit\'s memory.'
    },
    {
      thought: 'Increasing DisconnectedCircuitRetentionPeriod to a large value is a strictly beneficial change for user experience, with no meaningful tradeoff to weigh against it.',
      reality: 'This subtopic\'s exercise shows a longer retention period has a genuine server memory cost — every disconnected circuit within the window keeps its full state alive regardless of whether it will ever actually reconnect, and at scale, most disconnections in practice are permanent, not transient, meaning a long window accumulates real memory pressure from circuits that will never resume.'
    }
  ];
}
