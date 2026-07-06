import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-connection-identity-captured-once-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
    TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './connection-identity-captured-once-ignores-later-claim-changes.html',
  styleUrl: './connection-identity-captured-once-ignores-later-claim-changes.scss',
})
export class ConnectionIdentityCapturedOnceIgnoresLaterClaimChangesSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page\'s own Q&A explains how to authenticate a SignalR connection (JWT via accessTokenFactory, [Authorize] on the hub) as if it worked like ordinary HTTP request authentication — but a WebSocket connection is fundamentally different: authentication happens ONCE, at connect time, not on every subsequent hub method call the way middleware re-validates a JWT on every discrete HTTP request',
      points: [
        'For a normal HTTP API, EVERY request carries its own JWT in the Authorization header, and the authentication middleware validates it fresh, every single time — an expired token is rejected on the very next request. A SignalR hub connection is a single, long-lived WebSocket upgraded ONCE at connect time; the JWT passed during that initial negotiation is validated ONCE, and the resulting <code>ClaimsPrincipal</code> is attached to the connection\'s <code>HubConnectionContext</code> (<code>Context.User</code>) for the ENTIRE lifetime of that connection — there is no per-hub-method re-validation step in the pipeline.',
        'This means a JWT that expires 15 minutes after connecting has ZERO effect on an already-established SignalR connection — <code>[Authorize]</code>-gated hub methods invoked an hour later, on that SAME still-open connection, are evaluated against the ORIGINAL <code>ClaimsPrincipal</code> captured at connect time, which the framework never re-checks against the token\'s own expiry claim during ordinary method invocations. The connection simply stays "authenticated as whoever connected," until the underlying WebSocket itself closes and a NEW connection (with a fresh token) is established.',
      ],
    },
    {
      heading: 'The same mechanism means a role or permission REVOKED mid-connection (e.g., an admin demotes a user, or the user\'s subscription is downgraded) also has no effect on that user\'s ALREADY-OPEN hub connection until they reconnect — directly connecting to the main page\'s own "reconnect re-establishes state" theme, but for authorization rather than group membership',
      points: [
        'The main page\'s own theory already emphasizes that reconnecting assigns a NEW <code>ConnectionId</code> and requires re-joining groups. The SAME reconnect event is ALSO the only point at which a fresh JWT (and therefore fresh claims) gets re-validated and a NEW <code>ClaimsPrincipal</code> attached to the new connection — meaning "force the user to reconnect" is not just a workaround for lost group membership, it is the ACTUAL, and only, mechanism by which SignalR picks up ANY change to a user\'s authorization state, including revocation.',
        'For applications where an immediate, forced logout/permission-downgrade is a real security requirement (banning a user, revoking admin access), relying on natural reconnection is not sufficient — the server must EXPLICITLY force the specific connection closed, typically by tracking <code>UserId → ConnectionId</code> mappings (the same pattern the main page\'s own Q&A describes for <code>Clients.User()</code> fan-out) and calling a mechanism to abort those specific connections, after which the client\'s automatic reconnect logic establishes a brand-new connection that DOES pick up the updated claims.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Demonstrating the stale-identity problem — a token that expires mid-connection',
      language: 'csharp',
      code: `[Authorize]
public class AdminHub : Hub
{
    // Gated by a ROLE claim — captured once, at connect time.
    public async Task DeleteAllRecords()
    {
        if (!Context.User!.IsInRole("Admin"))
        {
            throw new HubException("Forbidden.");
        }
        await ProcessDeletionAsync();
    }
}

// Client connects at t=0 with a JWT containing Role=Admin, valid for
// 15 minutes (exp claim 15 minutes in the future):
var connection = new HubConnectionBuilder()
    .WithUrl("https://api.example.com/hubs/admin", opts =>
        opts.AccessTokenProvider = () => Task.FromResult(GetJwtWithAdminRole()))
    .Build();
await connection.StartAsync();
// Context.User on the server is now populated with Role=Admin,
// attached to THIS connection's HubConnectionContext.

// t=0 to t=20 minutes: the WebSocket connection NEVER drops (no
// network interruption, no server restart) — it stays open the
// entire time, well past the JWT's own 15-minute expiry.

// t=20 minutes: client invokes DeleteAllRecords() on the SAME,
// still-open connection:
await connection.InvokeAsync("DeleteAllRecords");
// SUCCEEDS — Context.User still reflects Role=Admin, exactly as
// captured at t=0. The JWT's expiry claim is NEVER re-checked for
// hub method invocations over an existing connection; only the
// INITIAL negotiation validated the token at all.`,
    },
    {
      label: 'The fix — explicitly force reconnection to pick up revoked/changed claims',
      language: 'csharp',
      code: `// Track UserId → ConnectionId(s) so a specific user's connections
// can be targeted for forced disconnection — the same mapping
// pattern the main page's own Q&A describes for Clients.User():
public class ConnectionTracker
{
    private readonly ConcurrentDictionary<string, HashSet<string>> _byUser = new();

    public void Add(string userId, string connectionId) =>
        _byUser.AddOrUpdate(userId,
            _ => [connectionId],
            (_, set) => { lock (set) { set.Add(connectionId); return set; } });

    public IReadOnlyCollection<string> GetConnections(string userId) =>
        _byUser.TryGetValue(userId, out var set) ? set.ToList() : [];
}

public class AdminHub(ConnectionTracker tracker) : Hub
{
    public override Task OnConnectedAsync()
    {
        tracker.Add(Context.User!.Identity!.Name!, Context.ConnectionId);
        return base.OnConnectedAsync();
    }
}

// When an admin revokes a role — called from wherever that
// revocation happens (an admin panel endpoint, a background job):
public class RoleRevocationService(
    ConnectionTracker tracker,
    IHubContext<AdminHub> hub)
{
    public async Task RevokeAdminRole(string userId)
    {
        await UpdateUserRoleInDatabaseAsync(userId);

        // Force EVERY open connection for this user closed — the
        // ONLY way to make the stale, still-Admin-tagged
        // ClaimsPrincipal stop being usable immediately, rather than
        // waiting for it to naturally reconnect (which might never
        // happen if the connection is healthy):
        foreach (var connectionId in tracker.GetConnections(userId))
        {
            await hub.Clients.Client(connectionId)
                .SendAsync("ForceReconnect", "Your permissions have changed.");
            // Client-side handler calls connection.stop() then
            // connection.start() again — the NEW connection re-sends
            // a FRESH JWT, which now correctly reflects the revoked role.
        }
    }
}`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A team assumes that since the JWT Authentication topic\'s own subtopic on ClockSkew showed that even an expired-per-its-own-clock JWT can validate under the default 5-minute skew, the SAME leeway applies to SignalR connections — i.e., they believe an expired JWT causes the connection to be dropped roughly 5 minutes after expiry due to ClockSkew tolerance running out. Explain precisely why this reasoning is wrong for an already-established SignalR connection.',
    hint: 'ClockSkew is a tolerance applied during TOKEN VALIDATION — a check that runs when a JWT is being verified. For an existing, already-open SignalR connection, when (if ever ) does JWT validation actually run again after the initial connect?',
    solution: `The reasoning is wrong because it conflates two entirely different
mechanisms that only share the word "JWT validation" superficially.
ClockSkew (from the Authentication topic's own subtopic) is a
TOLERANCE applied EVERY TIME a JWT is validated — it widens the
accepted window for tokens whose exp/nbf claims are slightly out of
sync with server time. But that tolerance only matters at the MOMENT
validation actually runs.

For an ordinary HTTP API, validation runs on every single request, so
ClockSkew's 5-minute grace period is a real, recurring, bounded
extension of how long a token keeps working. For an ALREADY-ESTABLISHED
SignalR connection, validation ran EXACTLY ONCE — at the initial
connect/negotiate handshake — and never again for the lifetime of that
connection, regardless of ClockSkew, regardless of how much time has
passed, regardless of whether the token would now fail validation by
a wide margin. There is no "5 minutes past expiry, then the connection
drops" behavior at all — the connection has no mechanism watching the
token's expiry claim during its ongoing lifetime, so it simply never
drops due to token expiry on its own, whether that's 1 minute past
expiry or 100 days past expiry.

The team's mental model ("some grace period, then eventually
disconnected") assumes the framework is continuously re-checking the
token in the background — it is not. The ONLY things that end a
SignalR connection are: the underlying WebSocket actually closing
(network issue, client navigating away, server restart) or an explicit
server-side action forcibly closing that specific connection (as shown
in this subtopic's fix). ClockSkew, and JWT expiry generally, are
concepts that apply to the discrete moment of TOKEN VALIDATION — and
for a long-lived connection, that moment has already come and gone,
permanently, the instant the connection was established.`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'a SignalR hub connection authenticated via JWT behaves like an HTTP API — each hub method invocation re-validates the current token, so an expired token eventually gets rejected on the next call.',
      reality: 'JWT validation for a SignalR connection happens exactly ONCE, at the initial connect/negotiate handshake — the resulting ClaimsPrincipal is attached to that connection\'s HubConnectionContext for its entire lifetime, with no re-validation on subsequent hub method invocations, however long the connection stays open.',
    },
    {
      thought: 'revoking a user\'s role or permission in the database takes effect on that user\'s SignalR connection as soon as the change is saved, since [Authorize]-gated hub methods check the user\'s current permissions.',
      reality: '[Authorize] checks are evaluated against the ClaimsPrincipal captured at connect time, which does not reflect ANY later change to the user\'s roles or claims — the revocation only takes effect once the connection is closed and a new one is established with a freshly-validated token, which for an already-open, healthy connection may never happen naturally.',
    },
    {
      thought: 'the ClockSkew tolerance that widens JWT expiry acceptance during validation (covered in the JWT authentication topic) implies a SignalR connection eventually drops some bounded time after its token expires.',
      reality: 'ClockSkew only matters at the moment validation actually RUNS — for an established SignalR connection, that moment occurred once, at connect time, and never recurs; there is no background re-validation and therefore no "grace period followed by disconnection" behavior tied to token expiry at all.',
    },
  ];
}
