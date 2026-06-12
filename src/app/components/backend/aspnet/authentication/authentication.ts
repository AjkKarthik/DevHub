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
  selector: 'app-aspnet-authentication',
  standalone: true,
  imports: [CodeBlockComponent, TheoryBlockComponent, QnaBlockComponent,
            QuizBlockComponent, ChallengeBlockComponent, QuickRefComponent,
            PageMetaComponent, PageCompleteComponent],
  templateUrl: './authentication.html',
  styleUrl: './authentication.scss',
})
export class AspnetAuthentication {

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
      ],
    },
    {
      heading: 'JWT Bearer Authentication (APIs)',
      points: [
        'Register with <code>AddAuthentication().AddJwtBearer()</code>. The middleware extracts the token from <code>Authorization: Bearer &lt;token&gt;</code>, validates signature, expiry, issuer, and audience, then populates <code>HttpContext.User</code>.',
        'Always validate <strong>issuer</strong> (the server that issued the token) and <strong>audience</strong> (the intended recipient). A token issued for service A must not be accepted by service B.',
        'Use short expiry (15 min) with refresh tokens stored in HttpOnly cookies. Long-lived access tokens cannot be invalidated before expiry — short TTL limits the blast radius of a leaked token.',
      ],
    },
    {
      heading: 'Cookie Authentication (MVC / Blazor Server)',
      points: [
        'Cookie auth issues an encrypted, signed cookie containing the user\'s claims after successful login. On subsequent requests, the middleware decrypts the cookie and restores the <code>ClaimsPrincipal</code> — no server-side session store required.',
        'The cookie is encrypted using ASP.NET Core Data Protection. In multi-server deployments, you must share Data Protection keys across instances (Redis, Azure Blob, Key Ring) — otherwise each pod issues cookies others cannot decrypt.',
        'Always set <code>HttpOnly = true</code> (default) — prevents JavaScript from reading the cookie. Set <code>Secure = true</code> in production so the cookie is only sent over HTTPS.',
      ],
    },
    {
      heading: 'ASP.NET Core Identity',
      points: [
        'Identity is a complete user management system: user store, password hashing, lockout, two-factor, email confirmation, and roles. Register with <code>AddIdentity&lt;IdentityUser, IdentityRole&gt;()</code> and choose a backing store (EF Core, Dapper, custom).',
        'For APIs you usually want only the user store and password hasher, not the full cookie-based sign-in flow. Use <code>AddIdentityCore&lt;TUser&gt;()</code> and wire JWT separately — leaner than full Identity.',
        'Never store passwords — Identity uses PBKDF2-SHA512 with a salt by default. The <code>IPasswordHasher&lt;T&gt;</code> interface is pluggable if you need to interoperate with legacy hashes.',
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
      q: 'What is AddIdentityCore vs AddIdentity?',
      a: 'AddIdentity adds the full Identity stack including cookie-based sign-in/sign-out UI flows. AddIdentityCore adds only the user store, password hashing, and UserManager — no cookie plumbing, no SignInManager. Use AddIdentityCore for APIs where you manage tokens yourself and just need password validation and user lookup.',
    },
    {
      q: 'How do I handle 401 vs 403 in ASP.NET Core auth?',
      a: '401 Unauthorized means the request has no valid identity (unauthenticated). 403 Forbidden means the request is authenticated but lacks the required permission (unauthorized in common parlance). ASP.NET Core returns 401 when no valid token/cookie is found; returns 403 when the [Authorize] policy fails on an identified user. For APIs with JWT, configure the JWT options to return 401 directly instead of redirecting: opts.Events.OnChallenge = ctx => { ctx.HandleResponse(); ctx.Response.StatusCode = 401; return Task.CompletedTask; }',
    },
  ];
}
