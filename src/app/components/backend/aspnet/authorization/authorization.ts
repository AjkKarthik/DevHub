import { Component } from '@angular/core';
import { CodeBlockComponent, CodeTab } from '../../../shared/code-block/code-block';
import { TheoryBlockComponent, TheoryPoint } from '../../../shared/theory-block/theory-block';
import { QnaBlockComponent, QnaItem } from '../../../shared/qna-block/qna-block';
import { QuizBlockComponent, QuizQuestion } from '../../../shared/quiz-block/quiz-block';
import { ChallengeBlockComponent, Challenge } from '../../../shared/challenge-block/challenge-block';
import { QuickRefComponent, QuickRefItem } from '../../../shared/quick-ref/quick-ref';
import { PageMetaComponent } from '../../../shared/page-meta/page-meta';
import { PageCompleteComponent } from '../../../shared/page-complete/page-complete';

@Component({
  selector: 'app-aspnet-authorization',
  standalone: true,
  imports: [CodeBlockComponent, TheoryBlockComponent, QnaBlockComponent,
            QuizBlockComponent, ChallengeBlockComponent, QuickRefComponent,
            PageMetaComponent, PageCompleteComponent],
  templateUrl: './authorization.html',
  styleUrl: './authorization.scss',
})
export class AspnetAuthorization {

  quickRef: QuickRefItem[] = [
    { name: '[Authorize]',                  type: 'decorator', desc: 'Require authentication; optionally specify Roles= or Policy=' },
    { name: '[AllowAnonymous]',             type: 'decorator', desc: 'Override [Authorize] — allow unauthenticated access on a specific endpoint' },
    { name: 'AddAuthorization()',           type: 'method',    desc: 'Register authorization services and define named policies' },
    { name: 'RequireAuthenticatedUser()',   type: 'method',    desc: 'Policy builder: require any authenticated identity (no specific claims)' },
    { name: 'RequireRole()',                type: 'method',    desc: 'Policy builder: require the user to be in a specific role' },
    { name: 'RequireClaim()',               type: 'method',    desc: 'Policy builder: require a specific claim to be present' },
    { name: 'IAuthorizationRequirement',   type: 'interface', desc: 'Marker for a custom requirement — implement with IAuthorizationHandler<T>' },
    { name: 'IAuthorizationService',       type: 'interface', desc: 'Inject to perform authorization checks imperatively in code' },
  ];

  theory: TheoryPoint[] = [
    {
      heading: 'Role-Based vs Policy-Based Authorization',
      points: [
        '<strong>Role-based</strong>: simple and familiar. Add roles as claims to the JWT/cookie and gate endpoints with <code>[Authorize(Roles = "Admin")]</code>. Good for broad access control but becomes unwieldy when you need fine-grained rules.',
        '<strong>Policy-based</strong>: compose requirements from claims, roles, and custom handlers. Define named policies in <code>AddAuthorization()</code> and apply with <code>[Authorize(Policy = "MinAge")]</code> or <code>.RequireAuthorization("MinAge")</code>. Policies are reusable, testable, and expressive.',
        'Prefer policies over roles for non-trivial apps. Roles require string comparisons scattered through code; policies centralise logic and make requirements explicit.',
      ],
    },
    {
      heading: 'Custom Requirements & Handlers',
      points: [
        'A <strong>requirement</strong> implements <code>IAuthorizationRequirement</code> and carries any parameters (e.g., minimum age). A <strong>handler</strong> implements <code>AuthorizationHandler&lt;TRequirement&gt;</code> and calls <code>context.Succeed(requirement)</code> or does nothing (not failing — other handlers may succeed).',
        'Multiple handlers can register for the same requirement — authorization succeeds if <strong>any</strong> handler succeeds and none explicitly fails. Call <code>context.Fail()</code> to block even if another handler succeeds.',
        'Register handlers in DI: <code>services.AddSingleton&lt;IAuthorizationHandler, MinAgeHandler&gt;()</code>.',
      ],
    },
    {
      heading: 'Resource-Based Authorization',
      points: [
        'Sometimes authorization depends on the resource being accessed — "can this user edit <em>this</em> document?" Use <code>IAuthorizationService.AuthorizeAsync(user, resource, policyName)</code> imperatively inside the handler.',
        'The resource object is passed to the handler via <code>context.Resource</code>. The handler casts it and reads properties (e.g., document.OwnerId == user.FindFirstValue(ClaimTypes.NameIdentifier)).',
        'Resource-based auth cannot be expressed as a declarative attribute because the resource is only known at runtime. Always call it inside the action/handler body, not via filters.',
      ],
    },
    {
      heading: 'Global & Endpoint-Level Authorization',
      points: [
        'Protect all endpoints globally: <code>app.MapGroup("/api").RequireAuthorization()</code> or a fallback policy: <code>opts.FallbackPolicy = new AuthorizationPolicyBuilder().RequireAuthenticatedUser().Build()</code>.',
        'The fallback policy requires auth on every endpoint unless decorated with <code>[AllowAnonymous]</code>. This is the <em>secure-by-default</em> pattern — new endpoints are protected unless explicitly opened.',
        'In minimal APIs, chain <code>.RequireAuthorization("PolicyName")</code> per endpoint or group. In controllers, apply <code>[Authorize]</code> at the controller level and <code>[AllowAnonymous]</code> on public actions.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Policy-Based Auth',
      language: 'csharp',
      code: `builder.Services.AddAuthorization(opts =>
{
    // Require a specific claim value
    opts.AddPolicy("AdminOnly", p =>
        p.RequireClaim("role", "admin"));

    // Require authenticated user + a subscription claim
    opts.AddPolicy("PremiumUser", p =>
        p.RequireAuthenticatedUser()
         .RequireClaim("subscription", "premium"));

    // Custom requirement (see next tab)
    opts.AddPolicy("MinAge18", p =>
        p.AddRequirements(new MinAgeRequirement(18)));

    // Fallback — protect everything unless [AllowAnonymous]
    opts.FallbackPolicy = new AuthorizationPolicyBuilder()
        .RequireAuthenticatedUser()
        .Build();
});

// Apply per endpoint (minimal API)
app.MapGet("/admin", () => "admin only").RequireAuthorization("AdminOnly");
app.MapGet("/health", () => "ok").AllowAnonymous();

// Apply per controller action
[Authorize(Policy = "PremiumUser")]
public IActionResult Dashboard() => Ok();`,
    },
    {
      label: 'Custom Requirement',
      language: 'csharp',
      code: `// 1. Define the requirement
public record MinAgeRequirement(int MinAge) : IAuthorizationRequirement;

// 2. Implement the handler
public class MinAgeHandler : AuthorizationHandler<MinAgeRequirement>
{
    protected override Task HandleRequirementAsync(
        AuthorizationHandlerContext context,
        MinAgeRequirement requirement)
    {
        var dobClaim = context.User.FindFirstValue("date_of_birth");
        if (dobClaim is null || !DateOnly.TryParse(dobClaim, out var dob))
            return Task.CompletedTask;  // not succeed — don't fail (maybe another handler)

        var age = DateOnly.FromDateTime(DateTime.Today).Year - dob.Year;
        if (dob.AddYears(age) > DateOnly.FromDateTime(DateTime.Today)) age--;

        if (age >= requirement.MinAge)
            context.Succeed(requirement);

        return Task.CompletedTask;
    }
}

// 3. Register the handler
builder.Services.AddSingleton<IAuthorizationHandler, MinAgeHandler>();`,
    },
    {
      label: 'Resource-Based Auth',
      language: 'csharp',
      code: `// Requirement: user must own the document
public class DocumentOwnerRequirement : IAuthorizationRequirement { }

public class DocumentOwnerHandler
    : AuthorizationHandler<DocumentOwnerRequirement, Document>
{
    protected override Task HandleRequirementAsync(
        AuthorizationHandlerContext context,
        DocumentOwnerRequirement requirement,
        Document document)
    {
        var userId = context.User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (document.OwnerId == userId)
            context.Succeed(requirement);
        return Task.CompletedTask;
    }
}

// Usage in a minimal API handler
app.MapPut("/docs/{id}", async (
    int id, Document update,
    AppDbContext db,
    IAuthorizationService authz,
    ClaimsPrincipal user,
    CancellationToken ct) =>
{
    var doc = await db.Documents.FindAsync([id], ct);
    if (doc is null) return Results.NotFound();

    var result = await authz.AuthorizeAsync(user, doc, "DocumentOwner");
    if (!result.Succeeded) return Results.Forbid();

    // proceed with update...
    return Results.Ok();
});`,
    },
    {
      label: 'Role Auth (JWT Claims)',
      language: 'csharp',
      code: `// When issuing the JWT — add role as a claim
var claims = new[]
{
    new Claim(ClaimTypes.Name,   user.UserName),
    new Claim(ClaimTypes.Role,   "Admin"),     // or use JwtClaimTypes.Role
    new Claim(ClaimTypes.Role,   "Manager"),   // multiple roles OK
};

// AddJwtBearer default maps ClaimTypes.Role to HttpContext.User.IsInRole()
// ───────────────────────────────────────────────────────────────────────
// Policy using roles
builder.Services.AddAuthorization(opts =>
    opts.AddPolicy("AdminOrManager", p =>
        p.RequireRole("Admin", "Manager")));    // OR semantics

// Minimal API
app.MapDelete("/products/{id}", DeleteProduct)
   .RequireAuthorization("AdminOrManager");

// Controller — attribute shorthand
[Authorize(Roles = "Admin")]
[HttpDelete("{id}")]
public IActionResult Delete(int id) { ... }`,
    },
    {
      label: 'Secure-by-Default',
      language: 'csharp',
      code: `// Option A: FallbackPolicy — all endpoints require auth unless [AllowAnonymous]
builder.Services.AddAuthorization(opts =>
    opts.FallbackPolicy = new AuthorizationPolicyBuilder()
        .RequireAuthenticatedUser()
        .Build());

// Option B: Group all authenticated routes under a prefix
var api = app.MapGroup("/api").RequireAuthorization();
api.MapGet("/orders", ListOrders);
api.MapPost("/orders", CreateOrder);

// Option C: per-endpoint (minimal, no global policy)
app.MapGet("/profile", GetProfile).RequireAuthorization();
app.MapGet("/status",  GetStatus).AllowAnonymous();   // explicitly open

// Option B — add policy on top of the group auth
var adminApi = app.MapGroup("/admin")
    .RequireAuthorization("AdminOnly");
adminApi.MapDelete("/users/{id}", DeleteUser);`,
    },
  ];

  challenge: Challenge = {
    title: 'Document Access Control',
    language: 'csharp',
    description: 'Implement authorization for a document API. Requirements: (1) All /docs endpoints require authentication. (2) GET /docs — returns all documents (any authenticated user). (3) GET /docs/{id} — returns a document (any authenticated user). (4) DELETE /docs/{id} — deletes a document only if the authenticated user owns it (use resource-based authorization). (5) POST /docs/admin/purge — requires the user to have the "admin" claim; deletes all documents.',
    hints: [
      'Add "owner" claim to the JWT when creating docs; store it on the document',
      'IAuthorizationService.AuthorizeAsync(user, doc, "OwnerPolicy") for resource check',
      'RequireClaim("role", "admin") for the purge policy',
      'Return Results.Forbid() when authorization fails (403)',
    ],
    starterCode: `// TODO: define DocumentOwnerRequirement + DocumentOwnerHandler
// TODO: configure policies: "Owner" (resource-based), "AdminOnly" (claim-based)
// TODO: register handler in DI

// Document entity
public class Document { public int Id; public string Title = ""; public string OwnerId = ""; }

// TODO: GET /docs — list all (require auth)
// TODO: GET /docs/{id} — get one (require auth)
// TODO: DELETE /docs/{id} — delete if owner (resource-based auth)
// TODO: POST /docs/admin/purge — AdminOnly policy`,
    solution: `// Requirement + handler
public class OwnerRequirement : IAuthorizationRequirement { }

public class OwnerHandler : AuthorizationHandler<OwnerRequirement, Document>
{
    protected override Task HandleRequirementAsync(
        AuthorizationHandlerContext context, OwnerRequirement req, Document doc)
    {
        if (doc.OwnerId == context.User.FindFirstValue(ClaimTypes.NameIdentifier))
            context.Succeed(req);
        return Task.CompletedTask;
    }
}

// Registration
builder.Services.AddSingleton<IAuthorizationHandler, OwnerHandler>();
builder.Services.AddAuthorization(opts =>
{
    opts.AddPolicy("Owner",     p => p.AddRequirements(new OwnerRequirement()));
    opts.AddPolicy("AdminOnly", p => p.RequireClaim("role", "admin"));
    opts.FallbackPolicy = new AuthorizationPolicyBuilder()
        .RequireAuthenticatedUser().Build();
});

// In-memory store
var docs = new List<Document>
{
    new() { Id = 1, Title = "Budget", OwnerId = "alice" },
    new() { Id = 2, Title = "Roadmap", OwnerId = "bob"  },
};

app.MapGet("/docs", (ClaimsPrincipal _) => Results.Ok(docs));

app.MapGet("/docs/{id:int}", (int id) =>
    docs.FirstOrDefault(d => d.Id == id) is { } doc
        ? Results.Ok(doc) : Results.NotFound());

app.MapDelete("/docs/{id:int}", async (
    int id, IAuthorizationService authz, ClaimsPrincipal user) =>
{
    var doc = docs.FirstOrDefault(d => d.Id == id);
    if (doc is null) return Results.NotFound();
    var auth = await authz.AuthorizeAsync(user, doc, "Owner");
    if (!auth.Succeeded) return Results.Forbid();
    docs.Remove(doc);
    return Results.NoContent();
}).RequireAuthorization();

app.MapPost("/docs/admin/purge", () =>
{
    docs.Clear();
    return Results.Ok(new { Purged = true });
}).RequireAuthorization("AdminOnly");`,
  };

  quiz: QuizQuestion[] = [
    {
      q: 'What is the FallbackPolicy?',
      options: [
        'A policy applied only to endpoints with no [Authorize] attribute',
        'A policy applied to ALL endpoints that do not have [AllowAnonymous]',
        'A catch-all error handler for authorization failures',
        'A policy that runs when authentication fails',
      ],
      answer: 1,
      explanation: 'FallbackPolicy is the secure-by-default pattern. It applies to every endpoint that does not explicitly configure authorization. Decorate public endpoints with [AllowAnonymous] or .AllowAnonymous() to opt out.',
    },
    {
      q: 'What happens when multiple IAuthorizationHandler implementations register for the same requirement?',
      options: [
        'Only the first registered handler runs',
        'Authorization fails if handlers disagree',
        'Authorization succeeds if ANY handler calls Succeed() and none calls Fail()',
        'Handlers run in reverse registration order',
      ],
      answer: 2,
      explanation: 'Multiple handlers for the same requirement implement an OR logic by default: succeed if any handler calls Succeed() and no handler calls Fail(). This enables scenarios like "user owns OR user is admin" without changing the requirement itself.',
    },
    {
      q: 'Why should you prefer policies over role checks in [Authorize(Roles=...)]?',
      options: [
        'Role checks are slower',
        'Policies are centralised, reusable, testable, and can express complex rules beyond roles',
        '[Authorize(Roles=...)] is deprecated',
        'Roles cannot be stored in JWTs',
      ],
      answer: 1,
      explanation: 'Roles scattered across [Authorize(Roles="Admin")] attributes mean authorization logic is distributed through action methods. Policies centralise rules in AddAuthorization(), making them easy to change, test in isolation, and combine with custom handlers.',
    },
    {
      q: 'How do you perform resource-based authorization in a minimal API?',
      options: [
        'With [Authorize(Policy="...")] on the endpoint',
        'By injecting IAuthorizationService and calling AuthorizeAsync(user, resource, policy)',
        'Resource-based auth only works with controllers',
        'Using RequireAuthorization() with a lambda',
      ],
      answer: 1,
      explanation: 'Resource-based authorization requires the resource at runtime — which you only have inside the handler body. Inject IAuthorizationService and call await authz.AuthorizeAsync(user, resource, "PolicyName"). Return Results.Forbid() if it fails.',
    },
    {
      q: 'What does context.Fail() do in an authorization handler?',
      options: [
        'Sets a 401 status code',
        'Marks authorization as failed, even if another handler calls Succeed()',
        'Logs the failure and continues',
        'Calls the next handler in the pipeline',
      ],
      answer: 1,
      explanation: 'context.Fail() is a hard veto — it overrides any Succeed() calls from other handlers for the same requirement. Use it to explicitly deny (e.g., banned user) rather than just "not succeeding".',
    },
  ];

  qna: QnaItem[] = [
    {
      q: 'What is the difference between [Authorize] returning 401 and 403?',
      a: '401 Unauthorized: no valid identity (unauthenticated). The user has no token or cookie. 403 Forbidden: valid identity but insufficient permissions. The user is authenticated but fails the policy or role check. ASP.NET Core uses these correctly — returning 401 challenges the client to authenticate, returning 403 tells them they are forbidden even after auth.',
    },
    {
      q: 'How do I combine multiple policies on one endpoint?',
      a: 'Multiple RequireAuthorization() calls combine with AND semantics: app.MapGet("/report", ...).RequireAuthorization("PremiumUser").RequireAuthorization("AgreesToTOS"). The user must satisfy all policies. Alternatively, define a combined policy in AddAuthorization() that merges requirements.',
    },
    {
      q: 'Can I add policies dynamically (not at startup)?',
      a: 'Not with the built-in policy store, which is read-only after startup. For dynamic policies, implement IAuthorizationPolicyProvider — it is called every time a policy is looked up by name, allowing you to load or compute policies from a database or configuration dynamically.',
    },
    {
      q: 'How do I access the current user inside a service (not a controller/handler)?',
      a: 'Inject IHttpContextAccessor (register with AddHttpContextAccessor()) and access IHttpContextAccessor.HttpContext?.User. Be cautious: this couples your service to HTTP, which makes unit testing harder. A cleaner pattern is to read the user in the endpoint/controller and pass the relevant claim (e.g., userId) explicitly to the service method.',
    },
    {
      q: 'How can I test authorization in unit tests without an HTTP server?',
      a: 'Use DefaultAuthorizationService with a manually constructed AuthorizationHandlerContext. Or in integration tests with WebApplicationFactory, call client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", fakeJwt). For policy unit tests, instantiate the handler directly: new MyHandler().HandleAsync(context, requirement) and assert context.HasSucceeded.',
    },
  ];
}
