import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-testing-hub-methods-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
    TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './testing-hub-methods-with-mocked-clients-groups-and-context.html',
  styleUrl: './testing-hub-methods-with-mocked-clients-groups-and-context.scss',
})
export class TestingHubMethodsWithMockedClientsGroupsAndContextSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page\'s own Q&A gestures at hub testing ("use NSubstitute or Moq to create a substitute IHubClients and assign it to the hub\'s Clients property via reflection or a protected setter") without ever showing the actual mechanics — Hub.Clients, Hub.Groups, and Hub.Context are all PUBLIC, SETTABLE properties precisely so tests can substitute them, no reflection required',
      points: [
        '<code>Hub.Clients</code> is typed <code>IHubCallerClients</code>, and <code>Hub.Groups</code> is typed <code>IGroupManager</code> — both are ordinary public settable properties on the base <code>Hub</code> class (not read-only, not requiring reflection to assign). A test constructs the hub normally via its constructor, then simply assigns <code>hub.Clients = fakeClients</code> and <code>hub.Groups = fakeGroups</code> before invoking a method — the same as setting any other public property.',
        '<code>Hub.Context</code> (typed <code>HubCallerContext</code>) is also settable, but constructing a realistic fake requires a bit more — either a hand-rolled subclass of the abstract <code>HubCallerContext</code> overriding <code>ConnectionId</code>/<code>User</code>/<code>Items</code>, or (simpler) a test double from a library like NSubstitute\'s <code>Substitute.For&lt;HubCallerContext&gt;()</code> combined with configuring the abstract members\' return values directly.',
      ],
    },
    {
      heading: 'IHubCallerClients itself is a chain of interfaces — Clients.OthersInGroup(roomId).SendAsync(...) requires mocking the RETURN VALUE of OthersInGroup() as another interface (IClientProxy), not just the top-level Clients object, which is the step most people get stuck on first',
      points: [
        '<code>IHubCallerClients</code> exposes methods like <code>OthersInGroup(string)</code>, <code>Group(string)</code>, and <code>Caller</code> — each of these returns an <code>IClientProxy</code> (or <code>ISingleClientProxy</code> for <code>Caller</code>), which is what actually exposes <code>SendAsync(string, params object[])</code>. A test that only mocks <code>IHubCallerClients.OthersInGroup()</code> to return <code>null</code> (the default for an unconfigured substitute) will NullReferenceException the moment the hub method calls <code>.SendAsync(...)</code> on that null — the fix is configuring <code>fakeClients.OthersInGroup(Arg.Any&lt;string&gt;()).Returns(fakeClientProxy)</code> as a SEPARATE substitute, one level deeper than the top-level <code>Clients</code> mock.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Full test setup — Clients, Groups, and Context all substituted, no reflection',
      language: 'csharp',
      code: `public class ChatHubTests
{
    private readonly ChatHub _hub;
    private readonly IHubCallerClients _clients = Substitute.For<IHubCallerClients>();
    private readonly IGroupManager _groups = Substitute.For<IGroupManager>();
    private readonly IClientProxy _othersInGroup = Substitute.For<IClientProxy>();
    private readonly ISingleClientProxy _caller = Substitute.For<ISingleClientProxy>();
    private readonly IClientProxy _group = Substitute.For<IClientProxy>();

    public ChatHubTests()
    {
        var logger = Substitute.For<ILogger<ChatHub>>();
        _hub = new ChatHub(logger)
        {
            // Public, settable base-class properties — no reflection needed:
            Clients = _clients,
            Groups  = _groups,
            Context = new FakeHubCallerContext(
                connectionId: "conn-123",
                user: MakeUser("alice")),
        };

        // The ONE-LEVEL-DEEPER wiring the main page's own Q&A doesn't
        // mention — configure what OthersInGroup/Caller/Group actually
        // RETURN, since those are separate interface instances:
        _clients.OthersInGroup(Arg.Any<string>()).Returns(_othersInGroup);
        _clients.Caller.Returns(_caller);
        _clients.Group(Arg.Any<string>()).Returns(_group);
    }

    private static ClaimsPrincipal MakeUser(string name) =>
        new(new ClaimsIdentity(
            [new Claim(ClaimTypes.Name, name)], "TestAuth"));
}

// A minimal HubCallerContext fake — the base class is abstract, so a
// small hand-rolled subclass is the simplest option:
public class FakeHubCallerContext(string connectionId, ClaimsPrincipal user)
    : HubCallerContext
{
    public override string ConnectionId => connectionId;
    public override string? UserIdentifier => user.Identity?.Name;
    public override ClaimsPrincipal User => user;
    public override IDictionary<object, object?> Items { get; } = new Dictionary<object, object?>();
    public override IFeatureCollection Features { get; } = new FeatureCollection();
    public override CancellationToken ConnectionAborted => CancellationToken.None;
    public override void Abort() { }
}`,
    },
    {
      label: 'Asserting on SendAsync calls and Groups.AddToGroupAsync — proving the hub method\'s actual behavior',
      language: 'csharp',
      code: `[Fact]
public async Task SendMessage_Sends_To_OthersInGroup_Not_Caller()
{
    await _hub.SendMessage("general", "hello");

    // Proves the EXACT SignalR API surface the main page's own
    // "Clients.OthersInGroup excludes the sender" theory point claims —
    // now verified against the actual hub method's real behavior:
    await _clients.Received(1).OthersInGroup("general");
    await _othersInGroup.Received(1).SendCoreAsync(
        "ReceiveMessage",
        Arg.Is<object[]>(args => (string)args[0] == "alice" && (string)args[1] == "hello"),
        Arg.Any<CancellationToken>());

    // Also confirms the sender gets their OWN separate confirmation,
    // via Clients.Caller — a distinct call from OthersInGroup:
    await _caller.Received(1).SendCoreAsync(
        "MessageSent",
        Arg.Is<object[]>(args => (string)args[0] == "hello"),
        Arg.Any<CancellationToken>());
}

[Fact]
public async Task JoinRoom_Adds_Caller_ConnectionId_To_Group()
{
    await _hub.JoinRoom("general");

    // Proves the ConnectionId from the FAKE Context flows correctly
    // into Groups.AddToGroupAsync — exercising the hub's actual
    // Context.ConnectionId usage, not just a hard-coded string:
    await _groups.Received(1).AddToGroupAsync("conn-123", "general", Arg.Any<CancellationToken>());
    await _clients.Received(1).Group("general");
    await _group.Received(1).SendCoreAsync(
        "UserJoined",
        Arg.Is<object[]>(args => (string)args[0] == "alice"),
        Arg.Any<CancellationToken>());
}

// NOTE: SendAsync() on IClientProxy is an EXTENSION METHOD that calls
// the interface's own SendCoreAsync(method, args, ct) internally — mock
// libraries can't intercept extension methods directly, so assertions
// target SendCoreAsync, the actual interface member being called under
// the hood. This is the step that trips people up switching from
// "I called .SendAsync() in the hub" to "how do I verify that call."`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A test configures _clients.Group(Arg.Any<string>()).Returns(_group) but forgets to configure _clients.Caller. The test then calls a hub method that only ever invokes Clients.Group(...).SendAsync(...) — never Clients.Caller. Does the missing Caller configuration cause a test failure? Explain precisely when an unconfigured substitute member becomes a problem versus when it is harmless.',
    hint: 'NSubstitute (and similar libraries) return a "safe default" for unconfigured members of a substitute — for a property/method returning a reference type, what is that default, and does merely LEAVING it unconfigured cause any exception on its own, or only if the code under test actually CALLS something on that default value?',
    solution: `No test failure occurs — an unconfigured substitute member (like
_clients.Caller here) simply returns null (the default for reference
types) when accessed, and that alone causes no exception. The failure
only happens if the CODE UNDER TEST actually calls a member ON that
null value — e.g., if the hub method executed .Caller.SendAsync(...),
THEN a NullReferenceException would occur, because .SendAsync() is
being invoked on a null IClientProxy.

Since this specific hub method never touches Clients.Caller at all
(it only calls Clients.Group(...)), the unconfigured Caller substitute
is never dereferenced, and its being null is completely inert —
the test passes or fails based ENTIRELY on whether the Group(...)
path (which WAS configured) behaves as asserted.

The general principle this reveals: you only need to configure the
substitute members your test's CODE PATH actually exercises — not
every member the interface exposes. Over-configuring (setting up
Caller, Group, OthersInGroup, and every other IHubCallerClients member
"just in case," for every single test) is unnecessary noise; the
precise, minimal-but-correct approach is to trace which interface
members the SPECIFIC hub method under test will call, and configure
exactly those. This also explains why a NEW test for a DIFFERENT hub
method (one that DOES call Caller) needs its own explicit
Caller-returns-something configuration — reusing a test fixture across
methods that touch different parts of IHubCallerClients means each
test's assumptions about "what's configured" must be verified against
that SPECIFIC method's actual code path, not assumed from a shared
setup written for a different method entirely.`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'testing a hub method requires reflection to set Hub.Clients, Hub.Groups, or Hub.Context, since the main page\'s own Q&A mentions "via reflection or a protected setter" as if that were the only option.',
      reality: 'Hub.Clients and Hub.Groups are ordinary PUBLIC, settable properties on the base Hub class — a test simply assigns them like any other property after constructing the hub; only Hub.Context (typed as the abstract HubCallerContext) needs a small hand-rolled fake subclass or a substitute, no reflection involved either way.',
    },
    {
      thought: 'mocking Hub.Clients (IHubCallerClients) to a substitute is sufficient to test calls like Clients.OthersInGroup(roomId).SendAsync(...) — configuring the top-level Clients object covers the whole chain.',
      reality: 'OthersInGroup(), Group(), and Caller each return a SEPARATE interface instance (IClientProxy or ISingleClientProxy) that must be independently substituted and configured as the return value of the corresponding Clients method — an unconfigured chain returns null and throws a NullReferenceException the moment .SendAsync() is called on it.',
    },
    {
      thought: 'SendAsync() calls on a mocked IClientProxy can be verified directly via Received().SendAsync(...), the same method name the hub code calls.',
      reality: 'SendAsync() is an extension method wrapping the interface\'s actual member, SendCoreAsync(method, args, ct) — mocking libraries cannot intercept extension method calls directly, so verification assertions must target SendCoreAsync, the real interface method being invoked underneath.',
    },
  ];
}
