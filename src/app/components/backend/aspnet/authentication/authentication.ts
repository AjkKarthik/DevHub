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
  selector: 'app-aspnet-authentication',
  standalone: true,
  imports: [CodeBlockComponent, TheoryBlockComponent, QnaBlockComponent,
            QuizBlockComponent, ChallengeBlockComponent, QuickRefComponent,
            PageMetaComponent, PageCompleteComponent,
            CommonMistakesComponent, RevisionCardComponent, PrerequisitesComponent],
  templateUrl: './authentication.html',
  styleUrl: './authentication.scss',
})
export class AspnetAuthentication {

  prerequisites: Prerequisite[] = [
    { label: 'Middleware',      route: '/aspnet/middleware' },
    { label: 'Minimal APIs',   route: '/aspnet/minimal-apis' },
    { label: 'Configuration',  route: '/aspnet/configuration' },
  ];

  quickRef: QuickRefItem[] = [
    { name: 'AddAuthentication()',       type: 'method',    desc: 'Registers the auth services and sets the default scheme' },
    { name: 'AddJwtBearer()',            type: 'method',    desc: 'Validates JWT tokens in the Authorization: Bearer header' },
    { name: 'AddCookie()',               type: 'method',    desc: 'Issues and validates encrypted cookies for session-based auth' },
    { name: 'UseAuthentication()',       type: 'method',    desc: 'Middleware: resolves the ClaimsPrincipal from the incoming request' },
    { name: 'UseAuthorization()',        type: 'method',    desc: 'Middleware: enforces [Authorize] attributes — must follow UseAuthentication' },
    { name: 'ClaimsPrincipal',           type: 'class',     desc: 'HttpContext.User — contains identity, claims, and role membership' },
    { name: 'AddIdentity<TUser>()',      type: 'method',    desc: 'Full user store: passwords, lockout, roles, email confirmation' },
    { name: 'AddOpenIdConnect()',        type: 'method',    desc: 'OAuth 2.0 / OIDC external provider (Google, Microsoft, GitHub, etc.)' },
  ];

  theory: TheoryPoint[] = [
    {
      heading: 'Authentication vs Authorization',
      points: [
        '<strong>Authentication</strong> answers "who are you?" — it establishes identity by validating credentials (password, token, certificate) and populates <code>HttpContext.User</code> with a <code>ClaimsPrincipal</code>.',
        '<strong>Authorization</strong> answers "what are you allowed to do?" — it checks the established identity against policies, roles, or claims. Authorization only makes sense after authentication; always register <code>UseAuthentication()</code> before <code>UseAuthorization()</code> in the pipeline.',
        'ASP.NET Core supports multiple authentication schemes simultaneously (e.g., JWT for API routes and cookies for MVC routes). The <em>default scheme</em> is used when no scheme is explicitly named on <code>[Authorize]</code>.',
        '<strong>Claims-based identity</strong> is the foundation. A <code>ClaimsPrincipal</code> holds one or more <code>ClaimsIdentity</code> objects; each identity has a collection of <code>Claim</code> objects (name-value pairs like <code>email=alice@example.com</code> or <code>role=Admin</code>). Policy-based authorization evaluates these claims.',
        'The <strong>authentication pipeline</strong>: <code>UseAuthentication()</code> iterates registered schemes, calls the default scheme\'s handler to parse the request (header, cookie, query string), and on success sets <code>HttpContext.User</code>. If no scheme succeeds, <code>User.Identity.IsAuthenticated</code> is false.',
        '<strong>Policy scheme</strong> is a meta-scheme that selects a real scheme dynamically: inspect the request (path, header presence, content type) and forward to JWT or Cookie accordingly. Useful for hybrid APIs that serve both browser and client requests.',
      ],
    },
    {
      heading: 'JWT Bearer Authentication (APIs)',
      points: [
        'Register with <code>AddAuthentication().AddJwtBearer()</code>. The middleware extracts the token from <code>Authorization: Bearer &lt;token&gt;</code>, validates signature, expiry, issuer, and audience, then populates <code>HttpContext.User</code>.',
        'Always validate <strong>issuer</strong> (the server that issued the token) and <strong>audience</strong> (the intended recipient). A token issued for service A must not be accepted by service B — audience mismatch must cause rejection.',
        'Use short expiry (15 min) with refresh tokens stored in HttpOnly cookies. Long-lived access tokens cannot be invalidated before expiry — short TTL limits the blast radius of a leaked token.',
        '<strong>JWT structure</strong>: header (algorithm + type) + payload (claims) + signature. The signature is verified using the issuer\'s secret key (HMAC) or public key (RSA/ECDSA). The payload is base64url-encoded — not encrypted — so never put sensitive data in JWT claims.',
        'Set <code>ClockSkew = TimeSpan.FromSeconds(30)</code> (or zero in tests) to control how much clock drift between issuer and validator is tolerated. The default 5-minute skew means a token can be valid up to 5 minutes past its stated <code>exp</code>.',
        'For RS256 (asymmetric), the issuer signs with a private key; validators use the public key available at the JWKS endpoint (<code>/.well-known/jwks.json</code>). Prefer RS256 for distributed systems — the signing key never leaves the auth server.',
      ],
    },
    {
      heading: 'Cookie Authentication (MVC / Blazor Server)',
      points: [
        'Cookie auth issues an encrypted, signed cookie containing the user\'s claims after successful login. On subsequent requests, the middleware decrypts the cookie and restores the <code>ClaimsPrincipal</code> — no server-side session store required.',
        'The cookie is encrypted using ASP.NET Core Data Protection. In multi-server deployments, you must share Data Protection keys across instances (Redis, Azure Blob, Key Ring) — otherwise each pod issues cookies others cannot decrypt.',
        'Always set <code>HttpOnly = true</code> (default) — prevents JavaScript from reading the cookie. Set <code>Secure = true</code> in production so the cookie is only sent over HTTPS.',
        '<code>SameSite = Lax</code> (default) protects against cross-site request forgery for top-level navigations. Use <code>Strict</code> for maximum protection; use <code>None</code> only for cross-origin embeds (requires Secure). Never send cookies cross-origin without explicit need.',
        '<code>SlidingExpiration = true</code> extends the cookie lifetime on activity — if the user is active within the last half of the expiry window, the cookie is renewed. Prevents active users from being logged out mid-session while still expiring idle sessions.',
        'Logout must call <code>HttpContext.SignOutAsync()</code> — this deletes the cookie on the client and, if using a sliding session, prevents further silent renewal. Without server-side logout, the cookie persists until its natural expiry.',
      ],
    },
    {
      heading: 'ASP.NET Core Identity',
      points: [
        'Identity is a complete user management system: user store, password hashing, lockout, two-factor, email confirmation, and roles. Register with <code>AddIdentity&lt;IdentityUser, IdentityRole&gt;()</code> and choose a backing store (EF Core, Dapper, custom).',
        'For APIs you usually want only the user store and password hasher, not the full cookie-based sign-in flow. Use <code>AddIdentityCore&lt;TUser&gt;()</code> and wire JWT separately — leaner than full Identity, no unnecessary middleware registered.',
        'Never store passwords — Identity uses PBKDF2-SHA512 with a salt by default. The <code>IPasswordHasher&lt;T&gt;</code> interface is pluggable if you need to interoperate with legacy hashes.',
        '<code>UserManager&lt;TUser&gt;</code> is the main service: <code>CreateAsync</code>, <code>FindByEmailAsync</code>, <code>CheckPasswordAsync</code>, <code>AddToRoleAsync</code>. Inject it as a scoped service. It handles all the hashing, store calls, and validation internally.',
        '<strong>Lockout</strong> protects against brute-force: after N failed password attempts, the account is locked for a configurable window. Configure via <code>opts.Lockout.MaxFailedAccessAttempts</code> and <code>DefaultLockoutTimeSpan</code>. Always enable lockout in production.',
        'Identity supports <strong>custom user stores</strong>. Implement <code>IUserStore&lt;TUser&gt;</code> and optional interfaces (<code>IUserPasswordStore</code>, <code>IUserEmailStore</code>, etc.) to back Identity against any data source — REST API, NoSQL, legacy database — without EF Core.',
      ],
    },
    {
      heading: 'External Providers, OIDC & Refresh Tokens',
      points: [
        '<strong>OIDC (OpenID Connect)</strong> is the layer on top of OAuth 2.0 that returns identity information. <code>AddOpenIdConnect()</code> handles the redirect dance: challenge → redirect to provider → callback → exchange code for tokens → set cookie. The user never types a password into your app.',
        'Register multiple OIDC providers (Google, Microsoft, GitHub) by calling <code>AddOpenIdConnect(schemeName, opts)</code> multiple times. Each scheme has a unique callback path (<code>opts.CallbackPath</code>) — register all callback URLs in the provider\'s developer console.',
        '<strong>Refresh tokens</strong> allow issuing new access tokens without re-authentication. Store them as HttpOnly cookies (not in localStorage — XSS risk). Implement a <code>/refresh</code> endpoint that validates the refresh token, issues a new access token, and optionally rotates the refresh token (reduces theft window).',
        'Implement <code>IAuthenticationHandler</code> to build a fully custom scheme — useful for API keys, HMAC signatures, or custom header tokens that no built-in scheme covers. Implement <code>AuthenticateAsync</code> to return <code>AuthenticateResult.Success(ticket)</code> or <code>Fail()</code>.',
        '<strong>Token storage security</strong>: store access tokens in memory (JS variable), refresh tokens in HttpOnly cookies. localStorage and sessionStorage are readable by XSS — never store tokens there. Memory storage means tokens are lost on tab close, which is acceptable for access tokens if refresh is seamless.',
        'Use <code>opts.SaveTokens = true</code> in OIDC options to persist the id_token, access_token, and refresh_token in the authentication cookie. Retrieve them later with <code>HttpContext.GetTokenAsync("access_token")</code> to call downstream APIs on behalf of the user.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'JWT Bearer Setup',
      language: 'csharp',
      code: `// appsettings.json:
// "Jwt": { "Key": "...", "Issuer": "https://myapp", "Audience": "myapp-api" }

builder.Services
    .AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(opts =>
    {
        opts.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer           = true,
            ValidateAudience         = true,
            ValidateLifetime         = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer              = builder.Configuration["Jwt:Issuer"],
            ValidAudience            = builder.Configuration["Jwt:Audience"],
            IssuerSigningKey         = new SymmetricSecurityKey(
                Encoding.UTF8.GetBytes(builder.Configuration["Jwt:Key"]!)),
            ClockSkew                = TimeSpan.FromSeconds(30),
        };
    });

app.UseAuthentication();
app.UseAuthorization();

// Protect an endpoint
app.MapGet("/me", (HttpContext ctx) => Results.Ok(ctx.User.Identity!.Name))
   .RequireAuthorization();`,
    },
    {
      label: 'Issue a JWT',
      language: 'csharp',
      code: `app.MapPost("/login", (LoginRequest req, IConfiguration config) =>
{
    // TODO: validate req.Username / req.Password against your user store
    if (req.Username != "alice" || req.Password != "secret")
        return Results.Unauthorized();

    var key     = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(config["Jwt:Key"]!));
    var creds   = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

    var claims  = new[]
    {
        new Claim(ClaimTypes.Name,            req.Username),
        new Claim(ClaimTypes.Role,            "User"),
        new Claim(JwtRegisteredClaimNames.Sub, req.Username),
        new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString()),
    };

    var token = new JwtSecurityToken(
        issuer:             config["Jwt:Issuer"],
        audience:           config["Jwt:Audience"],
        claims:             claims,
        expires:            DateTime.UtcNow.AddMinutes(15),
        signingCredentials: creds);

    return Results.Ok(new { Token = new JwtSecurityTokenHandler().WriteToken(token) });
});

record LoginRequest(string Username, string Password);`,
    },
    {
      label: 'Cookie Auth',
      language: 'csharp',
      code: `builder.Services
    .AddAuthentication(CookieAuthenticationDefaults.AuthenticationScheme)
    .AddCookie(opts =>
    {
        opts.LoginPath      = "/login";
        opts.LogoutPath     = "/logout";
        opts.ExpireTimeSpan = TimeSpan.FromHours(8);
        opts.SlidingExpiration = true;
        opts.Cookie.HttpOnly   = true;
        opts.Cookie.SecurePolicy = CookieSecurePolicy.Always;
        opts.Cookie.SameSite = SameSiteMode.Lax;
    });

// Sign in
app.MapPost("/login", async (LoginRequest req, HttpContext ctx) =>
{
    // validate credentials...
    var claims    = new[] { new Claim(ClaimTypes.Name, req.Username) };
    var identity  = new ClaimsIdentity(claims, CookieAuthenticationDefaults.AuthenticationScheme);
    var principal = new ClaimsPrincipal(identity);
    await ctx.SignInAsync(principal);
    return Results.Redirect("/");
});

// Sign out
app.MapPost("/logout", async (HttpContext ctx) =>
{
    await ctx.SignOutAsync();
    return Results.Redirect("/login");
});`,
    },
    {
      label: 'ASP.NET Core Identity',
      language: 'csharp',
      code: `// NuGet: Microsoft.AspNetCore.Identity.EntityFrameworkCore
builder.Services
    .AddIdentity<IdentityUser, IdentityRole>(opts =>
    {
        opts.Password.RequiredLength         = 8;
        opts.Password.RequireNonAlphanumeric = false;
        opts.Lockout.MaxFailedAccessAttempts = 5;
        opts.Lockout.DefaultLockoutTimeSpan  = TimeSpan.FromMinutes(15);
        opts.User.RequireUniqueEmail         = true;
    })
    .AddEntityFrameworkStores<AppDbContext>()
    .AddDefaultTokenProviders();

// Register a user
app.MapPost("/register", async (
    RegisterDto dto, UserManager<IdentityUser> users) =>
{
    var user   = new IdentityUser { UserName = dto.Email, Email = dto.Email };
    var result = await users.CreateAsync(user, dto.Password);
    return result.Succeeded
        ? Results.Created("/users", user.Id)
        : Results.ValidationProblem(result.Errors
            .ToDictionary(e => e.Code, e => new[] { e.Description }));
});

record RegisterDto(string Email, string Password);`,
    },
    {
      label: 'OIDC (Google / Entra)',
      language: 'csharp',
      code: `// NuGet: Microsoft.AspNetCore.Authentication.OpenIdConnect
builder.Services
    .AddAuthentication(opts =>
    {
        opts.DefaultScheme          = CookieAuthenticationDefaults.AuthenticationScheme;
        opts.DefaultChallengeScheme = OpenIdConnectDefaults.AuthenticationScheme;
    })
    .AddCookie()
    .AddOpenIdConnect("Microsoft", opts =>
    {
        opts.Authority    = "https://login.microsoftonline.com/{tenantId}/v2.0";
        opts.ClientId     = builder.Configuration["AzureAd:ClientId"];
        opts.ClientSecret = builder.Configuration["AzureAd:ClientSecret"];
        opts.ResponseType = "code";
        opts.SaveTokens   = true;
        opts.Scope.Add("profile");
        opts.Scope.Add("email");
    });

// Trigger OIDC login (redirects to provider)
app.MapGet("/login", () => Results.Challenge(
    new AuthenticationProperties { RedirectUri = "/" },
    [OpenIdConnectDefaults.AuthenticationScheme]));`,
    },
  ];

  challenge: Challenge = {
    title: 'Secure Notes API with JWT',
    language: 'csharp',
    description: 'Build a minimal Notes API secured with JWT. Requirements: (1) POST /login — accepts username/password, returns a JWT (15 min expiry). (2) GET /notes — returns notes for the authenticated user (use HttpContext.User.Identity!.Name as user ID). (3) POST /notes — creates a note (title, body) owned by the authenticated user. (4) Unauthenticated requests to /notes must return 401.',
    hints: [
      'RequireAuthorization() on MapGet/MapPost or app.MapGroup("/notes").RequireAuthorization()',
      'Claim(ClaimTypes.Name, username) in the JWT; read via HttpContext.User.Identity!.Name',
      'Store notes in a Dictionary<string, List<Note>> keyed by username (in-memory for this exercise)',
      'ClockSkew = TimeSpan.Zero in TokenValidationParameters for tight expiry testing',
    ],
    starterCode: `var builder = WebApplication.CreateBuilder(args);

// TODO: AddAuthentication().AddJwtBearer() — validate issuer, audience, signing key
// Config: builder.Configuration["Jwt:Key"], ["Jwt:Issuer"], ["Jwt:Audience"]

var app = builder.Build();

// TODO: UseAuthentication() + UseAuthorization()

// TODO: POST /login — return JWT on valid credentials
// TODO: GET /notes — return current user's notes (requires auth)
// TODO: POST /notes — add a note for current user (requires auth)

app.Run();

record Note(string Title, string Body);`,
    solution: `var builder = WebApplication.CreateBuilder(args);

builder.Configuration.AddInMemoryCollection(new Dictionary<string, string?>
{
    ["Jwt:Key"]      = "super-secret-dev-key-min-256-bits!",
    ["Jwt:Issuer"]   = "https://notes-api",
    ["Jwt:Audience"] = "notes-clients",
});

builder.Services
    .AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(opts =>
    {
        opts.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true, ValidateAudience = true,
            ValidateLifetime = true, ValidateIssuerSigningKey = true,
            ValidIssuer    = builder.Configuration["Jwt:Issuer"],
            ValidAudience  = builder.Configuration["Jwt:Audience"],
            IssuerSigningKey = new SymmetricSecurityKey(
                Encoding.UTF8.GetBytes(builder.Configuration["Jwt:Key"]!)),
            ClockSkew = TimeSpan.Zero,
        };
    });
builder.Services.AddAuthorization();

var app = builder.Build();

app.UseAuthentication();
app.UseAuthorization();

var store = new Dictionary<string, List<Note>>();

app.MapPost("/login", (LoginRequest req, IConfiguration cfg) =>
{
    if (req.Username != "alice" || req.Password != "pass")
        return Results.Unauthorized();
    var key    = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(cfg["Jwt:Key"]!));
    var token  = new JwtSecurityToken(
        issuer: cfg["Jwt:Issuer"], audience: cfg["Jwt:Audience"],
        claims: [new(ClaimTypes.Name, req.Username)],
        expires: DateTime.UtcNow.AddMinutes(15),
        signingCredentials: new(key, SecurityAlgorithms.HmacSha256));
    return Results.Ok(new { Token = new JwtSecurityTokenHandler().WriteToken(token) });
});

var notes = app.MapGroup("/notes").RequireAuthorization();

notes.MapGet("/", (HttpContext ctx) =>
{
    var user = ctx.User.Identity!.Name!;
    return Results.Ok(store.GetValueOrDefault(user) ?? []);
});

notes.MapPost("/", (Note note, HttpContext ctx) =>
{
    var user = ctx.User.Identity!.Name!;
    store.TryAdd(user, []);
    store[user].Add(note);
    return Results.Created("/notes", note);
});

app.Run();

record LoginRequest(string Username, string Password);
record Note(string Title, string Body);`,
  };

  quiz: QuizQuestion[] = [
    {
      q: 'What is the correct middleware order for authentication and authorization?',
      options: [
        'UseAuthorization() before UseAuthentication()',
        'UseAuthentication() before UseAuthorization()',
        'The order does not matter',
        'Only UseAuthentication() is needed',
      ],
      answer: 1,
      explanation: 'UseAuthentication() must run first — it reads the request and populates HttpContext.User. UseAuthorization() then checks that identity against policies. Reversed order means authorization runs before the user is identified, causing all [Authorize] checks to fail.',
    },
    {
      q: 'Why should JWT access tokens have short expiry (e.g., 15 minutes)?',
      options: [
        'JWTs become too large after 15 minutes',
        'Short-lived tokens limit the window a leaked token can be abused — they cannot be revoked before expiry',
        'Long expiry causes performance issues',
        'ASP.NET Core automatically invalidates tokens after 15 minutes',
      ],
      answer: 1,
      explanation: 'JWTs are stateless — once issued there is no built-in revocation. If a token is leaked, it is valid until it expires. Short expiry (15 min) with refresh tokens limits exposure. The refresh token (stored as HttpOnly cookie) can be revoked server-side.',
    },
    {
      q: 'What does ClaimsPrincipal represent?',
      options: [
        'The JWT token string',
        'The authenticated user with their identity and claims',
        'The authorization policy',
        'The cookie encryption key',
      ],
      answer: 1,
      explanation: 'ClaimsPrincipal is the ASP.NET Core user representation. It contains one or more ClaimsIdentity objects, each with claims (name, email, role, etc.) extracted from the authentication source (JWT, cookie, etc.). Accessible via HttpContext.User.',
    },
    {
      q: 'What is the role of AddIdentity<TUser, TRole>() compared to AddJwtBearer()?',
      options: [
        'They are the same thing',
        'AddIdentity manages the user store (passwords, lockout); AddJwtBearer handles token validation',
        'AddJwtBearer manages users; AddIdentity handles token issuance',
        'AddIdentity is for cookies only; AddJwtBearer is for roles',
      ],
      answer: 1,
      explanation: 'AddIdentity provides the user management stack (UserManager, PasswordHasher, lockout, two-factor, EF store). AddJwtBearer is a middleware that validates incoming JWT tokens. They are complementary: Identity issues credentials after password validation; JwtBearer validates the resulting tokens on protected endpoints.',
    },
    {
      q: 'In multi-server deployments, what must you do for cookie auth to work across pods?',
      options: [
        'Nothing — cookies are client-side so they work anywhere',
        'Share ASP.NET Core Data Protection keys across instances (Redis, Azure Blob, etc.)',
        'Use JWT instead — cookies cannot work across servers',
        'Set SameSite=None on the cookie',
      ],
      answer: 1,
      explanation: 'Cookie auth uses Data Protection to encrypt/sign the cookie. Each pod generates its own key ring by default — pod B cannot decrypt a cookie issued by pod A. Sharing keys via a distributed store (Redis, Azure Key Vault, Azure Blob) solves this.',
    },
    {
      q: 'Is the JWT payload encrypted by default?',
      options: [
        'Yes — it uses AES-256 encryption',
        'No — it is only base64url-encoded and signed, not encrypted',
        'Yes, but only the claims section',
        'Yes, when using RS256 algorithm',
      ],
      answer: 1,
      explanation: 'JWT payload is base64url-encoded — anyone who intercepts the token can read the claims. The signature prevents tampering but provides no confidentiality. Never put passwords, SSNs, or other sensitive data in JWT claims. Use JWE (JSON Web Encryption) if confidentiality is required.',
    },
    {
      q: 'What is the purpose of the "audience" (aud) claim in a JWT?',
      options: [
        'It identifies who issued the token',
        'It specifies the intended recipient — validators must reject tokens not addressed to them',
        'It stores the user\'s roles',
        'It sets the token expiry time',
      ],
      answer: 1,
      explanation: 'The audience claim prevents token reuse across services. If Service A issues a token with aud="service-a", Service B should reject it (ValidateAudience = true, ValidAudience = "service-b"). Without audience validation, a token stolen from one service can be replayed against another.',
    },
    {
      q: 'What does AddIdentityCore() add compared to AddIdentity()?',
      options: [
        'AddIdentityCore adds more features than AddIdentity',
        'AddIdentityCore adds only the user store and UserManager — no cookie sign-in or SignInManager',
        'They are identical — just aliases',
        'AddIdentityCore is for external providers only',
      ],
      answer: 1,
      explanation: 'AddIdentity() registers the full Identity stack including cookie-based SignInManager and its dependencies. AddIdentityCore() is a lightweight alternative for APIs — you get UserManager and password hashing without cookie plumbing. Use it when you issue JWTs yourself and have no need for server-side session management.',
    },
    {
      q: 'Where should a refresh token be stored in a browser-based SPA?',
      options: [
        'localStorage — persistent across tabs',
        'HttpOnly cookie — inaccessible to JavaScript, sent automatically by the browser',
        'sessionStorage — cleared when tab closes',
        'In the JWT itself as a nested token',
      ],
      answer: 1,
      explanation: 'HttpOnly cookies cannot be read by JavaScript — XSS cannot steal them. localStorage and sessionStorage are fully accessible to JS. The refresh token in an HttpOnly cookie is sent automatically to the /refresh endpoint, where the server validates it and issues a new access token stored in memory (not cookies, not storage).',
    },
  ];

  qna: QnaItem[] = [
    {
      q: 'What is the difference between cookie auth and JWT for a traditional web app?',
      a: 'Cookie auth: the server issues an encrypted cookie, the browser sends it on every request automatically, and the server decrypts it to identify the user. Great for browser-based MVC/Razor apps. JWT: the client stores the token (in memory or localStorage) and sends it manually in the Authorization header. Great for SPAs and mobile clients that call APIs. Cookie auth is generally more secure for browser apps (HttpOnly cookie blocks JS access); JWT is more flexible for non-browser clients.',
    },
    {
      q: 'How do I read claims from HttpContext.User?',
      a: 'Use HttpContext.User.FindFirst() or the ClaimTypes constants: var email = ctx.User.FindFirstValue(ClaimTypes.Email); var name = ctx.User.Identity?.Name; var isAdmin = ctx.User.IsInRole("Admin"). In minimal APIs, inject ClaimsPrincipal directly: app.MapGet("/me", (ClaimsPrincipal user) => user.Identity!.Name).',
    },
    {
      q: 'Can I use multiple authentication schemes at once?',
      a: 'Yes. Register multiple schemes and specify the default: AddAuthentication(JwtBearerDefaults.AuthenticationScheme).AddJwtBearer().AddCookie(). Apply non-default schemes per endpoint: [Authorize(AuthenticationSchemes = CookieAuthenticationDefaults.AuthenticationScheme)]. You can also combine them with policy schemes that select dynamically based on the request.',
    },
    {
      q: 'A team starts an API-only project with AddIdentityCore() (no SignInManager) but later needs to add a server-rendered admin panel to the same app that requires cookie-based login. Can they add cookie sign-in on top of AddIdentityCore without switching to AddIdentity, and what would that involve?',
      a: 'Yes — AddIdentityCore() is deliberately composable rather than all-or-nothing: you can chain `.AddSignInManager()` onto the IdentityBuilder it returns to add cookie sign-in capability without pulling in everything AddIdentity() bundles by default, then separately call AddAuthentication().AddCookie() to configure the cookie scheme itself. This lets a team incrementally add exactly the pieces they need (SignInManager here, but not necessarily the default UI or other components AddIdentity assumes) rather than being forced to choose between "bare-bones API identity" and "the full batteries-included web-app identity stack" as two fixed, non-overlapping options — AddIdentityCore is the extensible foundation both paths are actually built from.',
    },
    {
      q: 'How do I handle 401 vs 403 in ASP.NET Core auth?',
      a: '401 Unauthorized means the request has no valid identity (unauthenticated). 403 Forbidden means the request is authenticated but lacks the required permission (unauthorized in common parlance). ASP.NET Core returns 401 when no valid token/cookie is found; returns 403 when the [Authorize] policy fails on an identified user. For APIs with JWT, configure the JWT options to return 401 directly instead of redirecting: opts.Events.OnChallenge = ctx => { ctx.HandleResponse(); ctx.Response.StatusCode = 401; return Task.CompletedTask; }',
    },
    {
      q: 'How do I implement refresh tokens in an ASP.NET Core API?',
      a: 'Issue a short-lived JWT (15 min) and a long-lived refresh token (7-30 days) on login. Store the refresh token hash in the database linked to the user and device. Return the refresh token as an HttpOnly cookie and the access token in the response body. On POST /refresh, validate the refresh token from the cookie against the database, issue a new JWT, and optionally rotate the refresh token (replace it in the DB and set a new cookie). On logout, delete the refresh token from the DB to invalidate the session.',
    },
    {
      q: 'How does OIDC differ from plain OAuth 2.0?',
      a: 'OAuth 2.0 is an authorization framework — it issues access tokens that grant access to resources but says nothing about the user\'s identity. OIDC adds an identity layer on top: after the OAuth code exchange, the server also returns an id_token (a JWT) containing standardised identity claims (sub, name, email, picture). OIDC also defines a UserInfo endpoint. Use OIDC when you need to know WHO the user is; use plain OAuth 2.0 when you just need API access (e.g., posting to GitHub on behalf of a user).',
    },
    {
      q: 'How do I prevent CSRF attacks when using cookie authentication?',
      a: 'Use SameSite=Lax or Strict on the auth cookie to prevent cross-site form submissions from triggering authenticated actions. For state-changing endpoints in MVC, add the [ValidateAntiForgeryToken] attribute — it checks a hidden form token that cannot be forged cross-origin. In minimal APIs, use antiforgery middleware: builder.Services.AddAntiforgery(); app.UseAntiforgery(). APIs that accept JSON (Content-Type: application/json) are naturally protected from CSRF — browsers cannot send JSON with a cross-origin form submission.',
    },
  ];

  mistakes: CommonMistake[] = [
    {
      title: 'Registering UseAuthorization before UseAuthentication',
      wrong: `app.UseAuthorization();   // runs first — user is still anonymous
app.UseAuthentication();  // runs second — too late`,
      right: `app.UseAuthentication();  // populate HttpContext.User first
app.UseAuthorization();   // then enforce access rules`,
      explanation: 'UseAuthorization checks HttpContext.User — if UseAuthentication has not run yet, User.Identity.IsAuthenticated is always false and every [Authorize] endpoint returns 401. Middleware order is critical; always authenticate before authorizing.',
    },
    {
      title: 'Storing sensitive data in JWT claims',
      wrong: `var claims = new[]
{
    new Claim("password_hash", user.PasswordHash), // NEVER
    new Claim("ssn", user.SSN),                    // visible to anyone
};`,
      right: `var claims = new[]
{
    new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
    new Claim(ClaimTypes.Email, user.Email),
    new Claim(ClaimTypes.Role, user.Role),
};`,
      explanation: 'JWT payloads are base64url-encoded, not encrypted. Anyone who receives the token can decode and read all claims. Only include non-sensitive, necessary data (user ID, email, roles). Fetch sensitive data server-side using the user ID from the claim.',
    },
    {
      title: 'Missing audience validation in JWT configuration',
      wrong: `opts.TokenValidationParameters = new TokenValidationParameters
{
    ValidateIssuer   = true,
    ValidateAudience = false, // disabled — tokens for any audience accepted
    ValidateLifetime = true,
    ValidateIssuerSigningKey = true,
    // ...
};`,
      right: `opts.TokenValidationParameters = new TokenValidationParameters
{
    ValidateIssuer   = true,
    ValidateAudience = true,
    ValidAudience    = config["Jwt:Audience"], // must match token's aud claim
    ValidateLifetime = true,
    ValidateIssuerSigningKey = true,
};`,
      explanation: 'Disabling audience validation means a JWT issued for Service A can be replayed against Service B. Always set ValidateAudience = true and ValidAudience to your service\'s identifier. Audience is a first-line defense against token reuse across microservices.',
    },
    {
      title: 'Not sharing Data Protection keys in multi-pod deployments',
      wrong: `// Default — each pod generates its own key ring
builder.Services.AddAuthentication().AddCookie();
// Pods A and B cannot decrypt each other's cookies → random 401s`,
      right: `builder.Services.AddDataProtection()
    .PersistKeysToStackExchangeRedis(redis, "DataProtection-Keys")
    .SetApplicationName("MyApp");

builder.Services.AddAuthentication().AddCookie();`,
      explanation: 'Cookie auth encrypts the cookie with Data Protection keys stored in memory by default. In Kubernetes or App Service with multiple replicas, each pod has a different key ring — cookies from pod A fail on pod B. Share keys via Redis, Azure Blob, or Azure Key Vault.',
    },
    {
      title: 'Storing refresh tokens in localStorage instead of HttpOnly cookies',
      wrong: `// JavaScript client:
localStorage.setItem('refreshToken', response.refreshToken);
// XSS can steal this and issue new access tokens indefinitely`,
      right: `// Server sets refresh token as HttpOnly cookie:
Response.Cookies.Append("refreshToken", token, new CookieOptions
{
    HttpOnly = true,
    Secure   = true,
    SameSite = SameSiteMode.Strict,
    Expires  = DateTimeOffset.UtcNow.AddDays(30),
});`,
      explanation: 'localStorage is fully accessible to JavaScript — any XSS vulnerability can steal tokens stored there. HttpOnly cookies are invisible to JS and sent automatically by the browser to the /refresh endpoint. Keep access tokens in memory (JS variable); put refresh tokens in HttpOnly cookies.',
    },
  ];

  revision: RevisionSummary = {
    oneLiner: 'ASP.NET Core authentication establishes identity via JWT, cookies, or OIDC; UseAuthentication() populates HttpContext.User, and UseAuthorization() enforces access rules on that identity.',
    mustKnow: [
      'UseAuthentication() before UseAuthorization() — non-negotiable middleware order',
      'JWT: stateless, signed (not encrypted), short-lived (15 min) with HttpOnly-cookie refresh token',
      'Validate issuer AND audience in JWT — prevents cross-service token reuse',
      'Cookie auth encrypted via Data Protection — share keys across pods in multi-server deployments',
      'AddIdentityCore() for API-only projects; AddIdentity() for full MVC sign-in flows',
      'ClaimsPrincipal: HttpContext.User — read claims via FindFirstValue(ClaimTypes.X)',
      'Refresh tokens: hash stored in DB, sent as HttpOnly cookie, rotated on use',
    ],
    interviewFocus: [
      'What is the difference between authentication and authorization, and why does middleware order matter?',
      'Why are JWT access tokens short-lived, and how do refresh tokens compensate?',
      'What happens to cookie auth when you deploy to multiple pods without shared Data Protection keys?',
      'When would you choose AddIdentityCore() over AddIdentity()?',
      'Where should refresh tokens be stored in a browser app and why?',
    ],
  };
}
