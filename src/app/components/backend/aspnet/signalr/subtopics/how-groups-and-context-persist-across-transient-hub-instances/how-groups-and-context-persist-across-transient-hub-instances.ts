import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-groups-context-persistence-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
    TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './how-groups-and-context-persist-across-transient-hub-instances.html',
  styleUrl: './how-groups-and-context-persist-across-transient-hub-instances.scss',
})
export class HowGroupsAndContextPersistAcrossTransientHubInstancesSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page states "Hub instances are transient" and, separately, that Context.Items "persists for the connection\'s lifetime" and Groups membership "vanishes when the server restarts" (implying it survives everything SHORT of a restart) — without ever explaining how state can outlive an object that is thrown away after every single method call',
      points: [
        'The <code>Hub</code> object itself really is transient — a fresh instance is constructed by the DI container to service EACH individual method invocation, then disposed the moment that method returns. But <code>Hub.Context</code>, <code>Hub.Clients</code>, and <code>Hub.Groups</code> are not state OWNED by that disposable Hub object — they are references INJECTED into it, pointing at genuinely long-lived infrastructure that exists independently of any particular Hub instance: a per-CONNECTION <code>HubConnectionContext</code> (one per WebSocket connection, living for that connection\'s entire lifetime) and a per-HUB-TYPE, Singleton-scoped <code>HubLifetimeManager&lt;THub&gt;</code> (which owns the actual connection registry and group membership tables).',
        'This is precisely why <code>Context.Items</code> (a dictionary hanging off the connection\'s own <code>HubConnectionContext</code>) survives across every method invocation on that connection, while a plain field declared directly on the <code>ChatHub</code> class does not: the FIELD lives on the disposable Hub wrapper, gone the instant the method returns; <code>Context.Items</code> lives on the persistent connection object that a NEW Hub instance is simply handed a REFERENCE to on the next invocation.',
      ],
    },
    {
      heading: 'Groups.AddToGroupAsync() works the same way, one level further out — it does not touch the Hub instance or even the connection\'s own context at all; it delegates to the Singleton HubLifetimeManager, which maintains the group→connectionIds mapping independently of any Hub, any connection object, and any single method invocation',
      points: [
        'This explains the main page\'s own theory point that group membership "vanishes when the server restarts" but nothing shorter — the group registry lives in the SAME Singleton-scoped object for the ENTIRE process lifetime, regardless of how many Hub instances come and go, how many times a given connection invokes different methods, or how much time passes between calls. It is architecturally identical in spirit to registering a Singleton service and injecting <code>IServiceScopeFactory</code> to create Scoped state per unit of work — Groups.AddToGroupAsync() IS effectively "the singleton path," while a Hub instance field is "the disposable scope path," and mixing them up (storing state on the Hub instead of using the mechanisms that route to the Singleton/connection-scoped stores) is exactly the class of bug the main page\'s own "storing per-connection state in hub instance fields" Common Mistake describes.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Three layers of state lifetime, made explicit',
      language: 'csharp',
      code: `public class ChatHub : Hub
{
    // LAYER 1 — Hub instance field: lives for exactly ONE method call.
    // A NEW ChatHub object is constructed by DI for every single
    // invocation; this field is gone the moment the method returns.
    private string? _lastRoomJoined;

    public async Task JoinRoom(string roomId)
    {
        _lastRoomJoined = roomId;   // set here...

        // LAYER 2 — Context.Items: lives for the CONNECTION's entire
        // lifetime, spanning MANY method invocations (and therefore
        // many disposable Hub instances) over that one WebSocket:
        Context.Items["room"] = roomId;

        // LAYER 3 — Groups (via HubLifetimeManager): lives for the
        // ENTIRE PROCESS lifetime, shared across ALL connections and
        // ALL Hub types using it, independent of any single connection:
        await Groups.AddToGroupAsync(Context.ConnectionId, roomId);
    }

    public Task LeaveCurrentRoom()
    {
        // _lastRoomJoined is ALWAYS null here — Layer 1 never survives
        // to a second method call, since THIS is a brand-new ChatHub
        // instance, entirely unrelated to the one that ran JoinRoom():
        Console.WriteLine($"Layer 1 (always null): {_lastRoomJoined}");

        // Context.Items DOES survive — same connection, same
        // HubConnectionContext object handed to this new Hub instance:
        var room = Context.Items["room"] as string;
        Console.WriteLine($"Layer 2 (survives): {room}");

        return Task.CompletedTask;
    }
}`,
    },
    {
      label: 'Proving the layering with a test — same connection, different Hub instances, different lifetimes',
      language: 'csharp',
      code: `[Fact]
public async Task ContextItems_Survives_Across_Separate_Hub_Instances_SameConnection()
{
    var fakeContext = new FakeHubCallerContext("conn-A", MakeUser("alice"));

    // FIRST hub instance — simulates the JoinRoom invocation:
    var hub1 = new ChatHub(NullLogger<ChatHub>.Instance)
    {
        Clients = Substitute.For<IHubCallerClients>(),
        Groups  = Substitute.For<IGroupManager>(),
        Context = fakeContext,   // <-- SAME context object as hub2 below
    };
    await hub1.JoinRoom("general");

    // hub1 is now conceptually "disposed" — discard the reference,
    // exactly as the real framework would after the method returns:
    hub1 = null;

    // SECOND, entirely SEPARATE hub instance — simulates a LATER
    // invocation on the SAME underlying connection:
    var hub2 = new ChatHub(NullLogger<ChatHub>.Instance)
    {
        Clients = Substitute.For<IHubCallerClients>(),
        Groups  = Substitute.For<IGroupManager>(),
        Context = fakeContext,   // <-- the SAME context, reused
    };

    // Context.Items, set by hub1, is visible from hub2 — because
    // Items lives on 'fakeContext' (standing in for the real
    // per-connection HubConnectionContext), NOT on either Hub object:
    Assert.Equal("general", fakeContext.Items["room"]);

    // This test PHYSICALLY DEMONSTRATES why a Hub instance field would
    // NOT have survived this same scenario — it would need to be
    // re-read from an object (hub1) that no longer exists by the time
    // hub2 runs, which is exactly the bug the main page's own mistake
    // entry warns about.
}`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A developer, having learned that Context.Items survives across Hub instances on the same connection, assumes it must therefore also be visible to a DIFFERENT connection from the SAME authenticated user (e.g., the same person with two browser tabs open). They store a per-user shopping cart draft in Context.Items during one tab\'s hub invocation, expecting the OTHER tab\'s hub methods to see it. Explain precisely why this fails, using the three-layer model from this subtopic.',
    hint: 'Context.Items is scoped to the HubConnectionContext — and the main page\'s own theory states "Groups are not user-level — if a user has two browser tabs open, each has its own ConnectionId." Does that same per-connection scoping apply to Context.Items as well, or is Items somehow shared per USER instead of per CONNECTION?',
    solution: `This fails because Context.Items is scoped to Layer 2 — the
per-CONNECTION HubConnectionContext — not to the user's identity. Two
browser tabs, even for the exact same authenticated user, establish
TWO ENTIRELY SEPARATE WebSocket connections, each getting its OWN
HubConnectionContext object with its OWN, independent Items
dictionary. Setting a value in tab A's Context.Items during one hub
invocation has no effect whatsoever on tab B's Context.Items — they
are different objects, exactly as different as two different users'
connections would be.

This directly mirrors the main page's own stated fact about Groups:
"Groups are not user-level — if a user has two browser tabs open, each
has its own ConnectionId and must join independently." Context.Items
follows the identical scoping rule for the identical reason — both
Groups membership and Context.Items are keyed off ConnectionId (Layer
2's identity), not off the user's claims or identity (which would
require a DIFFERENT mechanism entirely — Layer 3's Clients.User(userId)
routing, which the main page's Q&A separately covers, aggregates
across ALL of a user's connections by their UserIdentifier claim, but
that mechanism only handles OUTBOUND message routing, not shared
mutable STATE between those connections).

The correct fix for genuinely per-USER (not per-connection) state —
like a shared shopping cart draft visible across all of that user's
open tabs — requires storing it somewhere that outlives and is
independent of any single connection: a distributed cache (Redis), a
database, or an in-process ConcurrentDictionary keyed by UserId if a
single-server deployment is acceptable. None of the three layers this
subtopic describes (Hub fields, Context.Items, Groups/HubLifetimeManager)
provide user-level shared state — they provide, respectively,
single-invocation, single-connection, and process-wide-but-still-
connection-keyed state. A fourth, explicitly-built mechanism is needed
for genuine cross-connection, same-user state sharing.`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'because Hub instances are described as "transient," any state that survives across method calls on a SignalR connection must somehow be an exception to that rule.',
      reality: 'the Hub instance itself really is transient and never survives past one method call — state that appears to persist (Context.Items, Groups membership) actually lives on entirely separate, longer-lived objects (the per-connection HubConnectionContext and the Singleton-scoped HubLifetimeManager) that a fresh Hub instance is simply handed a reference to on each invocation.',
    },
    {
      thought: 'Context.Items, being described as persisting "for the connection\'s lifetime," is shared across all connections belonging to the same authenticated user (e.g., multiple browser tabs).',
      reality: 'Context.Items is scoped strictly to a single CONNECTION (one HubConnectionContext, one WebSocket) — exactly like Groups membership, which the main page\'s own theory explicitly states is per-ConnectionId, not per-user; two tabs for the same user get two entirely separate Items dictionaries.',
    },
    {
      thought: 'Groups.AddToGroupAsync() and similar calls operate on state owned by the Hub instance or the current connection\'s context object.',
      reality: 'group membership is maintained entirely by a Singleton-scoped HubLifetimeManager shared across the whole process and every connection using that hub type — Groups.AddToGroupAsync() is a thin delegation to that shared registry, architecturally analogous to a Singleton service\'s state, not to anything owned by the transient Hub or even the per-connection context.',
    },
  ];
}
