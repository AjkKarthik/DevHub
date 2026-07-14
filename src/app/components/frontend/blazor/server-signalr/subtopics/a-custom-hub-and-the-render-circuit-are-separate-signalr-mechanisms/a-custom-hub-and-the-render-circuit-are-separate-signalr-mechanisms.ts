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
  templateUrl: './a-custom-hub-and-the-render-circuit-are-separate-signalr-mechanisms.html',
  styleUrl: './a-custom-hub-and-the-render-circuit-are-separate-signalr-mechanisms.scss'
})
export class ACustomHubAndTheRenderCircuitAreSeparateSignalrMechanismsSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'Blazor Server\'s own rendering traffic uses SignalR internally, but through an entirely different, undocumented pipeline than any Hub&lt;T&gt; you define yourself',
      points: [
        'The main page\'s mistake entry states components cannot access IHubContext directly, but it is worth being precise about WHY: Blazor Server\'s circuit (the connection carrying DOM diffs and events) is itself implemented as a SignalR connection internally, but to Blazor\'s OWN internal render Hub — a mechanism the framework manages entirely for you, with no public API surface exposing "the current component\'s own hub context" for you to send arbitrary messages through.',
        'A Hub&lt;T&gt; you define yourself (like a ChatHub) is a COMPLETELY SEPARATE SignalR endpoint, mapped to its own URL path (app.MapHub&lt;ChatHub&gt;("/chathub")), with its own independent set of client connections — these connections are NOT the same as the circuit connections Blazor\'s rendering system uses, even though both happen to use the SignalR protocol under the hood.',
      ]
    },
    {
      heading: 'Why this means a component genuinely cannot "reach into" a Hub — it must connect to it like any other client',
      points: [
        'Because a custom Hub is a separate endpoint with its own separate client connections, a Blazor component wanting to interact with it has exactly ONE path available: establish an ACTUAL SignalR client connection to that Hub\'s URL (via HubConnectionBuilder, precisely as the main page\'s own "Blazor component as chat client" code sample shows) — the component is, from the Hub\'s perspective, just another connected client, indistinguishable from a JavaScript SignalR client or a mobile app client.',
        'IHubContext&lt;T&gt; exists specifically to let SERVER-SIDE code (services, background workers, controllers) that is NOT itself a connected client push messages to a Hub\'s connected clients — a Blazor component IS one of those connected clients (once it opens its own HubConnection), not server-side code sitting alongside the Hub, which is exactly why injecting IHubContext directly into a component\'s own code has no meaningful use: the component would be trying to broadcast to ITSELF and other clients as if it were the server, a role it does not occupy in this architecture.',
      ]
    }
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Why this does not compile the way it might seem to',
      language: 'csharp',
      code: `// ChatPage.razor — a Blazor Server component
@rendermode InteractiveServer
@inject IHubContext<ChatHub> HubContext
// This injection actually SUCCEEDS — IHubContext<T> is registered
// as a normal DI service, so it is technically injectable anywhere,
// including a component. The problem is conceptual, not compile-time.

@code {
    private async Task BroadcastFromComponent()
    {
        // This WORKS mechanically — it really does send a message
        // to every client connected to ChatHub. But THIS component
        // is not itself listening for that message (it never opened
        // its own HubConnection to ChatHub), so the component's own
        // UI never reacts to messages it sends this way. It can push
        // TO other Hub clients, but cannot RECEIVE Hub messages back
        // without also becoming a client itself.
        await HubContext.Clients.All.SendAsync("ReceiveMessage", "System", "Hello");
    }
}`,
    },
    {
      label: 'The correct pattern — the component connects AS a client',
      language: 'csharp',
      code: `@rendermode InteractiveServer
@inject NavigationManager Nav
@implements IAsyncDisposable

@code {
    private HubConnection? hub;

    protected override async Task OnInitializedAsync()
    {
        // The component establishes its OWN real connection to
        // ChatHub's URL — from ChatHub's perspective, this component
        // is now just another connected client, the same as it would
        // treat a JS or mobile client.
        hub = new HubConnectionBuilder()
            .WithUrl(Nav.ToAbsoluteUri("/chathub"))
            .Build();

        // NOW the component can both SEND (hub.SendAsync) and
        // RECEIVE (hub.On<...>) messages through this Hub — because
        // it occupies the "connected client" role, not the
        // "server-side code" role IHubContext is meant for.
        hub.On<string, string>("ReceiveMessage", (user, msg) =>
            InvokeAsync(StateHasChanged));

        await hub.StartAsync();
    }

    public async ValueTask DisposeAsync()
        => await (hub?.DisposeAsync() ?? ValueTask.CompletedTask);
}`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A developer injects IHubContext&lt;NotificationHub&gt; directly into a Blazor component and calls it successfully to broadcast a notification. They are confused why the SAME component does not show the notification in its own UI, even though the broadcast clearly reached other users\' browsers. What is the actual role this component is playing when it calls IHubContext, and why does that explain the missing self-update?',
    hint: 'Think about which "side" of the Hub relationship the component occupies when it calls IHubContext directly — is it acting as a connected CLIENT of NotificationHub, or as something else entirely?',
    solution: 'When the component calls IHubContext&lt;NotificationHub&gt; directly, it is acting as SERVER-SIDE CODE pushing to the Hub\'s connected clients — the exact same role a background service or REST controller would occupy — NOT as a connected client of NotificationHub itself. The component never established its own HubConnection to NotificationHub, so it was never subscribed to receive ANY of NotificationHub\'s own broadcast messages, including the one it just sent. Other users\' browsers received the notification because THEIR pages had genuinely connected as clients (via their own HubConnection, or via a JS SignalR client) — this specific component simply never did the same for itself. To see its own broadcasts reflected in its own UI, the component would need to ALSO open a real HubConnection to NotificationHub\'s URL, exactly like the fix in this subtopic\'s second code example, making it a genuine two-way participant rather than only a one-way, server-side sender.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'Injecting IHubContext&lt;T&gt; directly into a Blazor component is a compile-time error or an unsupported operation, which is why the main page warns against it.',
      reality: 'This subtopic\'s first code example shows the injection and the SendAsync call both work mechanically without error — the issue is conceptual, not a compile/runtime restriction: the component genuinely broadcasts a real message, it simply never receives Hub messages back, since it never became a connected CLIENT of that Hub the way the intended pattern requires.'
    },
    {
      thought: 'Blazor Server\'s own circuit (the connection carrying DOM diffs and events) IS the same SignalR Hub a developer defines with their own Hub&lt;T&gt; class — they are the same underlying connection, just used two different ways.',
      reality: 'This subtopic\'s theory clarifies these are entirely SEPARATE SignalR endpoints — Blazor\'s own internal render circuit has no public API surface at all, while a custom Hub&lt;T&gt; is a distinct, developer-mapped endpoint with its own independent set of connected clients; a component must open a genuinely separate HubConnection to interact with a custom Hub, entirely apart from its own existing circuit connection.'
    },
    {
      thought: 'The correct fix for wanting a component to both send AND receive Hub messages is to inject BOTH IHubContext&lt;T&gt; (for sending) and a HubConnection (for receiving) into the same component.',
      reality: 'This subtopic\'s second code example shows a SINGLE HubConnection handles both directions — hub.SendAsync() for sending and hub.On&lt;...&gt;() for receiving — since the component, once connected as a client, occupies the full two-way client role; IHubContext is not needed (and does not help) once the component has its own proper HubConnection established.'
    }
  ];
}
