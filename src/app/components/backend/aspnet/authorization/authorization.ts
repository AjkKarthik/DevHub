import { Component } from '@angular/core';
import { CodeBlockComponent, CodeTab } from '../../../shared/code-block/code-block';
import { TheoryBlockComponent, TheoryPoint } from '../../../shared/theory-block/theory-block';
import { QnaBlockComponent, QnaItem } from '../../../shared/qna-block/qna-block';
import { QuizBlockComponent, QuizQuestion } from '../../../shared/quiz-block/quiz-block';
import { ChallengeBlockComponent, Challenge } from '../../../shared/challenge-block/challenge-block';
import { QuickRefComponent, QuickRefItem } from '../../../shared/quick-ref/quick-ref';
import { PageMetaComponent } from '../../../shared/page-meta/page-meta';
import { PageCompleteComponent } from '../../../shared/page-complete/page-complete';
import { CommonMistakesComponent, CommonMistake } from '../../../shared/common-mistakes/common-mistakes';
import { RevisionCardComponent, RevisionSummary } from '../../../shared/revision-card/revision-card';
import { PrerequisitesComponent, Prerequisite } from '../../../shared/prerequisites/prerequisites';

@Component({
  selector: 'app-aspnet-authorization',
  standalone: true,
  imports: [CodeBlockComponent, TheoryBlockComponent, QnaBlockComponent,
            QuizBlockComponent, ChallengeBlockComponent, QuickRefComponent,
            PageMetaComponent, PageCompleteComponent,
            CommonMistakesComponent, RevisionCardComponent, PrerequisitesComponent],
  templateUrl: './authorization.html',
  styleUrl: './authorization.scss',
})
export class AspnetAuthorization {

  prerequisites: Prerequisite[] = [
    { label: 'Authentication',  route: '/aspnet/authentication' },
    { label: 'Minimal APIs',    route: '/aspnet/minimal-apis' },
    { label: 'Controllers',     route: '/aspnet/controllers' },
  ];

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
        'Prefer policies over roles for non-trivial apps. Roles require string comparisons scattered through code; policies centralise logic and make requirements explicit and auditable.',
        '<strong>Claims-based authorization</strong> sits between roles and full policies. <code>RequireClaim("department", "engineering")</code> checks for a specific claim value. Combine with RequireRole() and RequireAuthenticatedUser() on a single policy builder for AND semantics.',
        'The <strong>DefaultPolicy</strong> (what bare <code>[Authorize]</code> without arguments evaluates against) defaults to RequireAuthenticatedUser(). You can override it: <code>opts.DefaultPolicy = new AuthorizationPolicyBuilder().RequireClaim("email_verified", "true").Build()</code>.',
        '<strong>FallbackPolicy</strong> applies to every endpoint with no authorization metadata. The built-in default is to allow anonymous access. Setting a FallbackPolicy of RequireAuthenticatedUser() flips the default — all endpoints require auth unless marked AllowAnonymous.',
      ],
    },
    {
      heading: 'Custom Requirements & Handlers',
      points: [
        'A <strong>requirement</strong> implements <code>IAuthorizationRequirement</code> (a marker interface) and carries parameters as properties. A <strong>handler</strong> implements <code>AuthorizationHandler&lt;TRequirement&gt;</code> and calls <code>context.Succeed(requirement)</code> or does nothing.',
        'Multiple handlers can register for the same requirement — authorization succeeds if <strong>any</strong> handler succeeds and none explicitly fails. Call <code>context.Fail()</code> to hard-veto, overriding any other handler\'s Succeed().',
        'Register handlers in DI: <code>services.AddSingleton&lt;IAuthorizationHandler, MinAgeHandler&gt;()</code>. Scoped and Transient lifetimes are also supported when the handler needs per-request services.',
        'A single handler can implement <code>IAuthorizationHandler</code> directly (not the generic form) and handle multiple requirement types by casting <code>context.PendingRequirements</code>. Useful for a "superuser" handler that satisfies any requirement.',
        '<strong>IAuthorizationPolicyProvider</strong> — implement this to load policies dynamically from a database or external config. The framework calls it every time a policy name is resolved, so you can build policies on the fly without registering them at startup.',
        'Inject services into handlers via constructor DI. If the handler needs a database to check something (e.g., is this user banned?), inject <code>IDbContextFactory&lt;T&gt;</code> rather than <code>DbContext</code> directly — handlers are often Singleton, and DbContext is Scoped.',
      ],
    },
    {
      heading: 'Resource-Based Authorization',
      points: [
        'Sometimes authorization depends on the resource being accessed — "can this user edit <em>this</em> document?" Use <code>IAuthorizationService.AuthorizeAsync(user, resource, policyName)</code> imperatively inside the handler.',
        'The resource object is passed to the handler via <code>context.Resource</code>. The handler casts it and reads properties (e.g., document.OwnerId == user.FindFirstValue(ClaimTypes.NameIdentifier)).',
        'Resource-based auth cannot be expressed as a declarative attribute because the resource is only known at runtime. Always call it inside the action/handler body after loading the resource — return 404 before 403 to avoid information leakage.',
        'Use a typed handler: <code>AuthorizationHandler&lt;TRequirement, TResource&gt;</code>. The framework passes the resource as the third argument to HandleRequirementAsync — no casting from context.Resource needed.',
        'Resource-based auth is the right pattern for multi-tenant apps: each row has a tenant ID, and the handler checks that the user\'s tenant claim matches the row\'s tenant. Centralises the check instead of scattering <code>if (doc.TenantId != user.TenantId) return 403</code> across every endpoint.',
        'You can pass any object as the resource — an entity, a DTO, even a tuple. You are not limited to database entities. Some teams pass an anonymous type with just the fields the handler needs to avoid loading the full entity for the auth check.',
      ],
    },
    {
      heading: 'Global & Endpoint-Level Authorization',
      points: [
        'Protect all endpoints globally: <code>app.MapGroup("/api").RequireAuthorization()</code> or a fallback policy: <code>opts.FallbackPolicy = new AuthorizationPolicyBuilder().RequireAuthenticatedUser().Build()</code>.',
        'The fallback policy requires auth on every endpoint unless decorated with <code>[AllowAnonymous]</code>. This is the <em>secure-by-default</em> pattern — new endpoints are protected unless explicitly opened.',
        'In minimal APIs, chain <code>.RequireAuthorization("PolicyName")</code> per endpoint or group. In controllers, apply <code>[Authorize]</code> at the controller level and <code>[AllowAnonymous]</code> on public actions.',
        'Stacking multiple <code>.RequireAuthorization()</code> calls combines policies with AND semantics — the user must satisfy every policy. This is useful for layered security: base auth at the group level, elevated privilege at a specific endpoint.',
        '<strong>Authorization middleware shortcircuits</strong> — if the policy check fails, the framework calls <code>IAuthorizationMiddlewareResultHandler</code> (defaulting to returning 401 or 403) and the endpoint handler never runs. No need to check authorization inside the handler unless doing resource-based checks.',
        'For controllers without a global policy, set a filter: <code>builder.Services.AddControllers(opts => opts.Filters.Add(new AuthorizeFilter()))</code>. Equivalent to applying <code>[Authorize]</code> to every controller — still overridable per action with <code>[AllowAnonymous]</code>.',
      ],
    },
    {
      heading: 'Authorization in Practice — Patterns & Pitfalls',
      points: [
        '<strong>Return 404 before 403 for owned resources.</strong> If you return 403 when a user queries a document they don\'t own, you confirm the document exists. Return 404 instead — revealing resource existence to unauthorized users is an information disclosure vulnerability.',
        '<strong>Claim transformation</strong>: implement <code>IClaimsTransformation</code> to enrich the ClaimsPrincipal before authorization runs — add derived claims from a database without baking them into the JWT. Runs once per request after authentication.',
        '<strong>Never trust claims without validation.</strong> Client-supplied data can be manipulated. Role and permission claims must come from a trusted source (your auth server) and the JWT signature must be verified — which AddJwtBearer() handles. Never read roles from request headers or query strings.',
        'Use <strong>endpoint metadata</strong> to build authorization rules driven by attributes on the endpoint: implement <code>IAuthorizationPolicyProvider</code> that reads custom attributes from the endpoint\'s metadata collection. ASP.NET Core resolves policy by name from metadata automatically.',
        '<strong>Audit authorization failures</strong> in production. Implement a custom <code>IAuthorizationMiddlewareResultHandler</code> or log in handlers when Fail() is called — this surfaces brute-force access attempts and misconfigured policies before they become incidents.',
        '<strong>Policy combination order matters for readability.</strong> Put the most restrictive check first in the policy builder so failures are caught early: RequireAuthenticatedUser().RequireClaim("email_verified", "true").AddRequirements(new SubscriptionRequirement()).',
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
    {
      q: 'What is the difference between DefaultPolicy and FallbackPolicy?',
      options: [
        'They are identical — just two names for the same setting',
        'DefaultPolicy applies to bare [Authorize]; FallbackPolicy applies to endpoints with no authorization metadata at all',
        'FallbackPolicy applies to [Authorize]; DefaultPolicy applies to unannotated endpoints',
        'DefaultPolicy is for controllers; FallbackPolicy is for minimal APIs',
      ],
      answer: 1,
      explanation: 'DefaultPolicy is what bare [Authorize] (without Roles= or Policy=) evaluates against — default is RequireAuthenticatedUser(). FallbackPolicy applies to every endpoint that has no authorization metadata whatsoever — the default is to allow anonymous access.',
    },
    {
      q: 'How should you respond when a user requests a resource they are not authorized to access?',
      options: [
        'Always return 403 Forbidden — the user is authenticated so they should know the resource exists',
        'Return 404 Not Found — returning 403 confirms the resource exists to an unauthorized user',
        'Return 401 Unauthorized — the user needs to re-authenticate',
        'Return 400 Bad Request',
      ],
      answer: 1,
      explanation: 'Returning 403 for owned resources reveals their existence to unauthorized users — an information disclosure vulnerability. The correct pattern: fetch the resource; if not found return 404; if found but user is not authorized return 404 (or 403 if leaking existence is acceptable for your threat model).',
    },
    {
      q: 'What is IClaimsTransformation used for?',
      options: [
        'Converting JWT claims to cookie claims',
        'Enriching the ClaimsPrincipal with additional claims after authentication, before authorization',
        'Validating claim signatures',
        'Mapping claim names between OIDC providers',
      ],
      answer: 1,
      explanation: 'IClaimsTransformation.TransformAsync() is called once per request after authentication succeeds. It receives the ClaimsPrincipal and can return an enriched version — useful for loading user roles from a database without baking them into the JWT. The framework uses the returned principal for all authorization checks.',
    },
    {
      q: 'Which DI lifetime should you use when registering an IAuthorizationHandler that needs a DbContext?',
      options: [
        'Singleton — handlers are always Singleton',
        'Scoped — to match the DbContext lifetime',
        'Use IDbContextFactory<T> in a Singleton handler to create a Scoped context per check',
        'Transient — a new handler per request',
      ],
      answer: 2,
      explanation: 'Handlers can be registered as any DI lifetime. If registered as Singleton (which is common), you cannot inject a Scoped DbContext directly — it causes a scope violation. Use IDbContextFactory<T> and create a short-lived DbContext inside HandleRequirementAsync, disposed after the check.',
    },
  ];

  qna: QnaItem[] = [
    {
      q: 'What is the difference between [Authorize] returning 401 and 403?',
      a: '401 Unauthorized: no valid identity (unauthenticated). The user has no token or cookie. 403 Forbidden: valid identity but insufficient permissions. The user is authenticated but fails the policy or role check. ASP.NET Core uses these correctly — returning 401 challenges the client to authenticate, returning 403 tells them they are forbidden even after auth.',
    },
    {
      q: 'How do I combine multiple policies on one endpoint?',
      a: 'Multiple RequireAuthorization() calls combine with AND semantics: app.MapGet("/report", ...).RequireAuthorization("PremiumUser").RequireAuthorization("AgreesToTOS"). The user must satisfy all policies. Alternatively, define a combined policy in AddAuthorization() that merges requirements — the result is a single policy with all requirements evaluated together.',
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
    {
      q: 'What is the difference between RequireAuthorization() and [Authorize] on controllers?',
      a: 'They are functionally equivalent — both gate the endpoint with a policy. RequireAuthorization() is the minimal API fluent approach; [Authorize] is the attribute-based controller approach. Both support policy names, roles, and scheme selection. RequireAuthorization() on a MapGroup() applies to all endpoints in the group; [Authorize] on a controller class applies to all actions (overridable per action with [AllowAnonymous]).',
    },
    {
      q: 'How do I implement tenant-scoped authorization in a multi-tenant app?',
      a: 'Add a tenantId claim to the JWT when the user authenticates against a specific tenant. Define a TenantOwnerRequirement; in the handler, compare context.User.FindFirstValue("tenantId") with the resource\'s TenantId property. If they match, Succeed(). Use resource-based authorization (IAuthorizationService.AuthorizeAsync with the resource) so every data-access endpoint validates tenant ownership without sprinkling manual checks throughout.',
    },
    {
      q: 'When should I use IAuthorizationMiddlewareResultHandler?',
      a: 'When you need to customise the HTTP response on authorization failure — change the status code, add response headers, or return a structured JSON error body. The default handler returns 401 or 403 with no body. Implement IAuthorizationMiddlewareResultHandler, register it in DI, and it is called whenever the authorization middleware decides to short-circuit the pipeline.',
    },
  ];

  mistakes: CommonMistake[] = [
    {
      title: 'Using [Authorize(Roles=...)] instead of named policies',
      wrong: `[Authorize(Roles = "Admin,SuperAdmin")]
[HttpDelete("{id}")]
public IActionResult Delete(int id) { ... }
// Role strings duplicated across multiple actions`,
      right: `// In AddAuthorization():
opts.AddPolicy("CanDelete", p => p.RequireRole("Admin", "SuperAdmin"));

// On the action:
[Authorize(Policy = "CanDelete")]
[HttpDelete("{id}")]
public IActionResult Delete(int id) { ... }`,
      explanation: 'Role strings scattered across attributes become maintenance liabilities. When roles change or new conditions are added, you hunt through every attribute. Named policies centralise logic in AddAuthorization() — change once, applied everywhere.',
    },
    {
      title: 'Returning 403 instead of 404 for owned resources',
      wrong: `var doc = await db.Docs.FindAsync(id);
if (doc is null) return Results.NotFound();
if (doc.OwnerId != userId) return Results.Forbid(); // reveals existence!`,
      right: `var doc = await db.Docs.FindAsync(id);
// Return 404 regardless of whether the doc exists or is just not owned
if (doc is null || doc.OwnerId != userId) return Results.NotFound();`,
      explanation: 'Returning 403 when a user accesses a resource they do not own confirms the resource exists. An attacker can enumerate IDs to discover which records exist. Return 404 for both "not found" and "not owned" to prevent resource enumeration.',
    },
    {
      title: 'Injecting DbContext directly into a Singleton authorization handler',
      wrong: `public class TenantHandler : AuthorizationHandler<TenantRequirement>
{
    public TenantHandler(AppDbContext db) { ... } // DbContext is Scoped!
}
builder.Services.AddSingleton<IAuthorizationHandler, TenantHandler>(); // scope violation`,
      right: `public class TenantHandler : AuthorizationHandler<TenantRequirement>
{
    public TenantHandler(IDbContextFactory<AppDbContext> factory) { ... }
    protected override async Task HandleRequirementAsync(...)
    {
        await using var db = await factory.CreateDbContextAsync();
        // use db...
    }
}`,
      explanation: 'Singleton services cannot hold Scoped dependencies. Injecting a Scoped DbContext into a Singleton handler causes a runtime error on the first request after the first scope ends. Use IDbContextFactory<T> to create a short-lived DbContext per authorization check.',
    },
    {
      title: 'Doing nothing (not calling Fail) when authorization should be denied',
      wrong: `protected override Task HandleRequirementAsync(
    AuthorizationHandlerContext context, MyRequirement req)
{
    var claim = context.User.FindFirstValue("subscription");
    if (claim != "premium")
        return Task.CompletedTask; // silent — another handler might Succeed()!
    context.Succeed(req);
    return Task.CompletedTask;
}`,
      right: `if (claim != "premium")
{
    context.Fail(); // explicit hard denial — no other handler can override
    return Task.CompletedTask;
}
context.Succeed(req);`,
      explanation: 'Not calling Succeed() or Fail() means "I have no opinion" — another registered handler for the same requirement might Succeed() and grant access unintentionally. Call context.Fail() when you want to explicitly deny, especially for revocation or ban logic.',
    },
    {
      title: 'Missing AddAuthorization() registration',
      wrong: `// Only middleware registered — no policies, no authorization services
app.UseAuthentication();
app.UseAuthorization(); // throws at runtime: no IAuthorizationService registered`,
      right: `builder.Services.AddAuthorization(opts =>
{
    // define policies here, or leave empty for defaults
});
// ...
app.UseAuthentication();
app.UseAuthorization();`,
      explanation: 'UseAuthorization() requires IAuthorizationService in the DI container. Call builder.Services.AddAuthorization() in the service registration phase. Without it, the first request that hits an [Authorize] endpoint throws an InvalidOperationException.',
    },
  ];

  revision: RevisionSummary = {
    oneLiner: 'ASP.NET Core authorization evaluates the authenticated ClaimsPrincipal against named policies composed of requirements — custom handlers implement the logic and call Succeed() or Fail().',
    mustKnow: [
      'Policy-based over role checks — centralise logic in AddAuthorization(), apply by name',
      'IAuthorizationRequirement + AuthorizationHandler<T> — the extensibility pair',
      'Multiple handlers per requirement: OR logic (any Succeed + no Fail = pass)',
      'context.Fail() is a hard veto — overrides any Succeed() from other handlers',
      'Resource-based auth: load resource, call IAuthorizationService.AuthorizeAsync(user, resource, policy)',
      'FallbackPolicy = RequireAuthenticatedUser() for secure-by-default; opt out with [AllowAnonymous]',
      'Return 404 (not 403) for owned resources to prevent resource enumeration',
    ],
    interviewFocus: [
      'What is the difference between DefaultPolicy and FallbackPolicy?',
      'How do multiple handlers for the same requirement interact — what are the AND/OR semantics?',
      'When should you use resource-based authorization vs attribute-based [Authorize(Policy=...)]?',
      'Why should you return 404 instead of 403 when a user accesses a resource they don\'t own?',
      'How do you inject a DbContext into a Singleton authorization handler without a scope violation?',
    ],
  };
}
