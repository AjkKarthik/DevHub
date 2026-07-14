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
  templateUrl: './azure-signalr-service-routes-messages-it-doesnt-replicate-circuit-state.html',
  styleUrl: './azure-signalr-service-routes-messages-it-doesnt-replicate-circuit-state.scss'
})
export class AzureSignalrServiceRoutesMessagesItDoesntReplicateCircuitStateSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The sticky-session requirement exists because a circuit\'s STATE lives in one specific app server\'s process memory — a fact Azure SignalR Service does not change at all',
      points: [
        'The main page states Azure SignalR Service "removes the sticky-session requirement," worth being precise about WHAT specifically it removes: without it, the LOAD BALANCER itself needs sticky sessions, because it is the load balancer\'s own routing decision that determines which app server instance a given WebSocket connection reaches — an app server other than the ORIGINAL one has literally no knowledge of that circuit\'s component tree or state, since that state was never replicated anywhere.',
        'Azure SignalR Service inserts itself as a managed intermediary that ALL app server instances connect out to — the actual browser-facing WebSocket now terminates at Azure\'s infrastructure, not directly at any specific app server, and Azure SignalR Service tracks WHICH app server instance is handling which circuit, routing each message to the correct one regardless of which physical connection path the browser happens to be using at that moment.',
      ]
    },
    {
      heading: 'What this does NOT change — the circuit\'s actual component state still lives on exactly one server instance',
      points: [
        'Removing the load-balancer-level sticky-session REQUIREMENT is not the same as making circuit state itself distributed, replicated, or server-agnostic — a specific circuit\'s component tree, event handlers, and DI scope still exist in the memory of exactly ONE app server instance, precisely as they did without Azure SignalR Service; what changed is HOW a message reaches that specific instance, not WHERE the state itself is stored.',
        'This means if that ONE specific app server instance genuinely crashes or is taken down (a deployment, a scale-in event), the circuits it was hosting are still just as lost as they would be without Azure SignalR Service — Azure SignalR Service solves the connection-ROUTING problem (letting any server\'s WebSocket traffic correctly reach whichever server actually holds a given circuit), not the state-DURABILITY problem (surviving that specific server\'s own failure).',
        'This is why choosing Blazor WASM over Server for very-large-scale scenarios (as the main page\'s own theory section suggests) remains a genuinely different architectural tradeoff than "just add Azure SignalR Service" — Azure SignalR Service simplifies horizontal SCALING of Server (more app instances, connection routing solved), but it does not eliminate the fundamental per-user server memory cost model Server has, unlike WASM, which sidesteps server-side circuit memory entirely by keeping state in the browser.',
      ]
    }
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Without Azure SignalR Service — sticky sessions are load-balancer-level',
      language: 'csharp',
      code: `// Without a backplane: the LOAD BALANCER must pin each user's
// WebSocket connection to the SAME app server for the entire
// session, because that server is the ONLY place the circuit's
// actual state exists.
//
//   Browser <---WebSocket---> Load Balancer <---> App Server A
//                                                  (circuit lives HERE,
//                                                   in App Server A's
//                                                   own process memory)
//
// If the load balancer routes a reconnection attempt to App
// Server B instead (e.g. round-robin, no affinity configured),
// App Server B has ZERO knowledge of this circuit — the
// reconnection genuinely fails, indistinguishable from the
// retention window having expired.`,
    },
    {
      label: 'With Azure SignalR Service — routing is solved, state location is not',
      language: 'csharp',
      code: `// Program.cs
builder.Services.AddSignalR().AddAzureSignalR();

// With the backplane: ALL app server instances connect OUT to
// Azure SignalR Service, which now terminates the actual
// browser-facing WebSocket.
//
//   Browser <--WebSocket--> Azure SignalR Service <--> App Server A
//                                    |                  (circuit STILL
//                                    | (tracks which                  lives HERE,
//                                    |  server owns                   unchanged)
//                                    |  which circuit)
//                                    v
//                              App Server B, C, D...
//
// The load balancer no longer needs sticky sessions, because the
// BROWSER's connection point (Azure SignalR Service) is no longer
// tied to any specific app server at all — Azure SignalR Service
// itself tracks that THIS circuit belongs to App Server A and
// routes accordingly, regardless of load-balancer routing.
//
// But if App Server A crashes, this circuit is JUST AS LOST as it
// would have been without Azure SignalR Service — nothing about
// this setup replicated or persisted the circuit's own state.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A team adopts Azure SignalR Service specifically to improve resilience against individual app server crashes, reasoning "now our circuits are backed by Azure\'s infrastructure instead of a single server, so a server crash should no longer lose user state." After a real deployment restart, users on the affected server instance still lose their in-progress state, exactly as before. Was the team\'s reasoning correct?',
    hint: 'Think about what Azure SignalR Service actually tracks and routes — connection/message routing information, or the FULL component tree state itself? Where does the circuit\'s actual state continue to live even with Azure SignalR Service in place?',
    solution: 'The team\'s reasoning was not correct, and this subtopic\'s theory explains exactly why. Azure SignalR Service solves the connection-ROUTING problem — it tracks which app server instance owns which circuit and correctly routes messages to it, removing the load-balancer-level sticky-session requirement. It does NOT replicate or persist the circuit\'s own component tree state anywhere outside that one specific app server\'s process memory. When that specific app server instance restarts (a deployment) or crashes, the circuits it was hosting are lost exactly as they would be without Azure SignalR Service — nothing about adding the backplane changed WHERE a circuit\'s actual state lives, only how browser connections find their way to the correct server. Achieving genuine resilience against individual server loss would require an entirely different architectural approach (state externalized to a distributed cache/database, or switching to Blazor WASM where the browser itself holds the state) — Azure SignalR Service is a scaling/routing solution, not a state-durability solution.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'Azure SignalR Service works by replicating or synchronizing a circuit\'s state across multiple app server instances, so any instance can serve a reconnecting user.',
      reality: 'This subtopic\'s theory clarifies Azure SignalR Service does no such replication — a circuit\'s actual state still lives in exactly ONE app server instance\'s memory, unchanged from the non-backplane setup; Azure SignalR Service only tracks and routes CONNECTIONS to the correct existing instance, never duplicating the state itself anywhere.'
    },
    {
      thought: 'Adopting Azure SignalR Service makes a Blazor Server app meaningfully more resilient to individual app server crashes or restarts, since state is now backed by managed Azure infrastructure.',
      reality: 'This subtopic\'s exercise shows a real deployment restart still loses in-progress circuit state exactly as before Azure SignalR Service was added — the "managed infrastructure" only manages connection routing, not state durability; the specific app server instance holding a circuit is still a single point of failure for that circuit\'s state, backplane or not.'
    },
    {
      thought: 'Azure SignalR Service and choosing Blazor WebAssembly over Server for scaling are two different implementations of essentially the same underlying solution to Server\'s per-user memory cost.',
      reality: 'This subtopic\'s theory clarifies these solve genuinely different problems — Azure SignalR Service simplifies horizontal scaling of Blazor SERVER (more app instances, connection routing solved) while leaving Server\'s fundamental per-connected-user server memory cost model completely unchanged; Blazor WASM sidesteps that cost model entirely by keeping state in the browser instead, a structurally different architecture, not an alternative implementation of the same fix.'
    }
  ];
}
