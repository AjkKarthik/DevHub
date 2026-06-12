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
  selector: 'app-aspnet-cors',
  standalone: true,
  imports: [CodeBlockComponent, TheoryBlockComponent, QnaBlockComponent,
            QuizBlockComponent, ChallengeBlockComponent, QuickRefComponent,
            PageMetaComponent, PageCompleteComponent],
  templateUrl: './cors.html',
  styleUrl: './cors.scss',
})
export class AspnetCors {

  quickRef: QuickRefItem[] = [
    { name: 'AddCors()',                 type: 'method',  desc: 'Register CORS services and define named policies' },
    { name: 'UseCors()',                 type: 'method',  desc: 'Middleware: apply CORS policy — must be before UseAuthentication/UseAuthorization' },
    { name: 'WithOrigins()',             type: 'method',  desc: 'Allow specific origins; use environment config, not hardcoded values' },
    { name: 'AllowAnyOrigin()',          type: 'method',  desc: 'Allow all origins — never combine with AllowCredentials()' },
    { name: 'AllowCredentials()',        type: 'method',  desc: 'Allow cookies/auth headers — requires explicit origins, not AllowAnyOrigin' },
    { name: 'UseHsts()',                 type: 'method',  desc: 'HTTP Strict Transport Security — tells browsers to always use HTTPS' },
    { name: 'UseHttpsRedirection()',     type: 'method',  desc: 'Redirect HTTP → HTTPS (301/307); HSTS caches this in the browser' },
    { name: '.RequireCors()',            type: 'method',  desc: 'Apply a named CORS policy to a specific minimal API endpoint or group' },
  ];

  theory: TheoryPoint[] = [
    {
      heading: 'How CORS Works',
      points: [
        'CORS (Cross-Origin Resource Sharing) is a browser security mechanism. When JavaScript on <code>https://app.com</code> calls <code>https://api.com/data</code>, the browser first sends a <strong>preflight OPTIONS request</strong> asking "is this allowed?" The server responds with <code>Access-Control-Allow-Origin</code> headers. If the origin is not listed, the browser blocks the response — the request still reaches the server.',
        'CORS is enforced by the <em>browser</em>, not the server. A server-side tool (curl, Postman, server-to-server) ignores CORS headers entirely. This means CORS is a client-side sandbox, not a security boundary for your API. Protect APIs with authentication, not CORS.',
        'Simple requests (GET/POST with basic content types) skip the preflight. Requests with custom headers (Authorization, Content-Type: application/json) trigger a preflight OPTIONS request that must be answered correctly before the actual request proceeds.',
      ],
    },
    {
      heading: 'Configuring CORS Policies',
      points: [
        'Use named policies for different route groups: an <code>"AllowFrontend"</code> policy for API routes and a broader <code>"AllowInternal"</code> for health/admin endpoints. Apply policies via <code>UseCors("AllowFrontend")</code> globally or <code>.RequireCors("AllowFrontend")</code> per endpoint.',
        'Never use <code>AllowAnyOrigin().AllowCredentials()</code> — this combination is rejected by browsers as insecure and throws an InvalidOperationException at startup in ASP.NET Core. Always specify explicit origins when credentials are needed.',
        'Use <code>SetIsOriginAllowed(origin => new Uri(origin).Host.EndsWith(".mycompany.com"))</code> for wildcard subdomain matching — <code>WithOrigins</code> requires exact matches.',
      ],
    },
    {
      heading: 'HTTPS — Redirection & HSTS',
      points: [
        '<code>UseHttpsRedirection()</code> redirects HTTP requests to HTTPS with a 307 (or 301 in production). Always register this before CORS, routing, and auth middleware.',
        '<code>UseHsts()</code> sends the <code>Strict-Transport-Security</code> header, instructing browsers to only access the site over HTTPS for the specified duration (max-age). <strong>Never send HSTS from localhost</strong> — it permanently blocks HTTP access in that browser for the domain.',
        'In production, set the HSTS max-age to at least 1 year and consider preloading. Start with a short max-age (300s) during rollout so you can revert if HTTPS breaks.',
      ],
    },
    {
      heading: 'Common Security Headers',
      points: [
        '<strong>X-Content-Type-Options: nosniff</strong> — prevents browsers from MIME-sniffing a response away from the declared content type (blocks some XSS vectors).',
        '<strong>X-Frame-Options: DENY / SAMEORIGIN</strong> — prevents clickjacking by controlling whether the page can be embedded in an iframe. Superseded by CSP frame-ancestors but still widely used as a fallback.',
        '<strong>Content-Security-Policy</strong> — defines trusted sources for scripts, styles, and media. The most powerful XSS mitigation header but complex to configure. Start with <code>default-src \'self\'</code> and expand as needed. Use <code>NWebSec</code> or <code>Helmet</code>-inspired middleware to add headers programmatically.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'CORS Setup',
      language: 'csharp',
      code: `builder.Services.AddCors(opts =>
{
    // Specific origins — read from config in production
    opts.AddPolicy("AllowFrontend", p =>
        p.WithOrigins(
               builder.Configuration.GetSection("AllowedOrigins").Get<string[]>()
               ?? ["http://localhost:4200"])
         .AllowAnyHeader()
         .AllowAnyMethod()
         .AllowCredentials());   // needed for cookies / auth headers

    // Public API — any origin, no credentials
    opts.AddPolicy("PublicApi", p =>
        p.AllowAnyOrigin()
         .AllowAnyHeader()
         .WithMethods("GET", "POST"));

    // Wildcard subdomain
    opts.AddPolicy("AnySub", p =>
        p.SetIsOriginAllowed(o => new Uri(o).Host.EndsWith(".myapp.com"))
         .AllowAnyHeader().AllowAnyMethod());
});

// Apply globally — must be before UseAuthentication
app.UseCors("AllowFrontend");

// Or per-endpoint
app.MapGet("/public", PublicHandler).RequireCors("PublicApi");`,
    },
    {
      label: 'HTTPS + HSTS',
      language: 'csharp',
      code: `// Development: skip HTTPS
if (!app.Environment.IsDevelopment())
{
    app.UseHsts();                      // HSTS header — HTTPS only for max-age
    app.UseHttpsRedirection();          // HTTP → HTTPS redirect
}

// Configure HSTS (startup)
builder.Services.AddHsts(opts =>
{
    opts.Preload           = true;
    opts.IncludeSubDomains = true;
    opts.MaxAge            = TimeSpan.FromDays(365);
    opts.ExcludedHosts.Add("localhost");
});

// Configure HTTPS redirection port
builder.Services.AddHttpsRedirection(opts =>
{
    opts.RedirectStatusCode = StatusCodes.Status307TemporaryRedirect;
    opts.HttpsPort          = 443;
});`,
    },
    {
      label: 'Security Headers Middleware',
      language: 'csharp',
      code: `// Custom middleware to add security headers
app.Use(async (ctx, next) =>
{
    ctx.Response.Headers["X-Content-Type-Options"]   = "nosniff";
    ctx.Response.Headers["X-Frame-Options"]          = "DENY";
    ctx.Response.Headers["X-XSS-Protection"]         = "0";   // let CSP do the work
    ctx.Response.Headers["Referrer-Policy"]          = "strict-origin-when-cross-origin";
    ctx.Response.Headers["Permissions-Policy"]       = "geolocation=(), camera=(), microphone=()";
    ctx.Response.Headers["Content-Security-Policy"]  =
        "default-src 'self'; " +
        "script-src 'self'; " +
        "style-src 'self' 'unsafe-inline'; " +
        "img-src 'self' data:; " +
        "frame-ancestors 'none';";
    await next();
});

// NuGet: NWebSec.AspNetCore.Middleware (alternative — declarative API)
// app.UseXContentTypeOptions();
// app.UseXfo(opts => opts.Deny());
// app.UseCsp(opts => opts.DefaultSources(s => s.Self()));`,
    },
    {
      label: 'Environment-Specific Origins',
      language: 'csharp',
      code: `// appsettings.Development.json
// { "AllowedOrigins": ["http://localhost:4200", "http://localhost:3000"] }

// appsettings.Production.json
// { "AllowedOrigins": ["https://app.mycompany.com"] }

builder.Services.AddCors(opts =>
    opts.AddDefaultPolicy(p =>
        p.WithOrigins(
            builder.Configuration.GetSection("AllowedOrigins")
                                 .Get<string[]>() ?? [])
         .AllowAnyHeader()
         .AllowAnyMethod()
         .AllowCredentials()));

// Apply default policy
app.UseCors();

// Verify CORS is working in integration tests:
// response.Headers["Access-Control-Allow-Origin"]
//     .Should().Be("http://localhost:4200");`,
    },
  ];

  challenge: Challenge = {
    title: 'API with Strict CORS',
    language: 'csharp',
    description: 'Configure a secure minimal API with CORS and security headers. Requirements: (1) Allow requests from http://localhost:4200 and https://myapp.example.com with credentials. (2) Add an additional "PublicReadOnly" policy that allows any origin but only GET requests and no credentials. (3) Apply the strict policy globally; apply PublicReadOnly to GET /products only. (4) Add X-Content-Type-Options, X-Frame-Options: DENY, and Referrer-Policy headers via custom middleware. (5) Enable HTTPS redirection and HSTS in non-development environments.',
    hints: [
      'AllowCredentials() requires WithOrigins(), not AllowAnyOrigin()',
      'app.UseCors("policyName") for global; .RequireCors("PublicReadOnly") on the endpoint',
      'UseHttpsRedirection and UseHsts must go before UseCors in production',
      'Response.Headers["X-Content-Type-Options"] = "nosniff" in a Use() middleware',
    ],
    starterCode: `var builder = WebApplication.CreateBuilder(args);

// TODO: AddCors — two policies:
// "Strict": allow localhost:4200 + myapp.example.com, all headers/methods, credentials
// "PublicReadOnly": any origin, GET only, no credentials

var app = builder.Build();

// TODO: HTTPS + HSTS (non-dev)
// TODO: security headers middleware
// TODO: UseCors("Strict") globally
// TODO: GET /products — also apply "PublicReadOnly"
// TODO: POST /orders — strict policy only (from global)

app.Run();`,
    solution: `var builder = WebApplication.CreateBuilder(args);

builder.Services.AddCors(opts =>
{
    opts.AddPolicy("Strict", p =>
        p.WithOrigins("http://localhost:4200", "https://myapp.example.com")
         .AllowAnyHeader().AllowAnyMethod().AllowCredentials());

    opts.AddPolicy("PublicReadOnly", p =>
        p.AllowAnyOrigin().WithMethods("GET").DisallowCredentials());
});

if (!builder.Environment.IsDevelopment())
    builder.Services.AddHsts(o => { o.MaxAge = TimeSpan.FromDays(365); });

var app = builder.Build();

if (!app.Environment.IsDevelopment())
{
    app.UseHsts();
    app.UseHttpsRedirection();
}

// Security headers
app.Use(async (ctx, next) =>
{
    ctx.Response.Headers["X-Content-Type-Options"] = "nosniff";
    ctx.Response.Headers["X-Frame-Options"]        = "DENY";
    ctx.Response.Headers["Referrer-Policy"]        = "strict-origin-when-cross-origin";
    await next();
});

app.UseCors("Strict");

app.MapGet("/products", () => Results.Ok(new[] { "Widget", "Gadget" }))
   .RequireCors("PublicReadOnly");

app.MapPost("/orders", (object order) => Results.Created("/orders/1", order));

app.Run();`,
  };

  quiz: QuizQuestion[] = [
    {
      q: 'CORS is enforced by which component?',
      options: [
        'The ASP.NET Core server — it blocks the request',
        'The browser — it blocks the response if CORS headers are missing or wrong',
        'The network router between client and server',
        'Both the browser and the server together',
      ],
      answer: 1,
      explanation: 'CORS is entirely browser-enforced. The request still reaches the server — the server processes it and responds. The browser inspects the CORS headers in the response and blocks JavaScript from reading it if the origin is not allowed. curl, Postman, and server-to-server calls ignore CORS.',
    },
    {
      q: 'What is wrong with AllowAnyOrigin().AllowCredentials()?',
      options: [
        'Nothing — it is a common pattern',
        'It is insecure — sending credentials to any origin leaks them, and ASP.NET Core throws at startup',
        'It is deprecated in .NET 7+',
        'AllowAnyOrigin only works with GET requests',
      ],
      answer: 1,
      explanation: 'Allowing credentials (cookies, Authorization headers) to any origin would let any website make authenticated requests as the user — a severe CSRF-like vulnerability. ASP.NET Core throws InvalidOperationException if you combine AllowAnyOrigin() and AllowCredentials().',
    },
    {
      q: 'What does the HSTS header do?',
      options: [
        'Encrypts the HTTP response body',
        'Instructs browsers to only connect to this site over HTTPS, caching the rule for max-age seconds',
        'Prevents the page from being loaded in an iframe',
        'Sets the Content-Type to application/json',
      ],
      answer: 1,
      explanation: 'Strict-Transport-Security tells browsers: "never connect to this domain over HTTP for the next [max-age] seconds." The browser caches this and auto-upgrades all future HTTP requests to HTTPS. HSTS prevents protocol downgrade attacks.',
    },
    {
      q: 'What triggers a preflight OPTIONS request?',
      options: [
        'All cross-origin requests',
        'Only GET requests from other origins',
        'Requests with non-simple methods or custom headers (like Authorization or Content-Type: application/json)',
        'Any request with a body',
      ],
      answer: 2,
      explanation: '"Simple" requests (certain GET/POST with basic content types) skip the preflight. Non-simple methods (PUT, DELETE, PATCH), custom headers like Authorization, or Content-Type: application/json trigger an OPTIONS preflight. The server must respond with the correct CORS headers for the actual request to proceed.',
    },
    {
      q: 'What does X-Content-Type-Options: nosniff do?',
      options: [
        'Sets the response content type automatically',
        'Prevents browsers from MIME-sniffing the response — they must honor the declared Content-Type',
        'Disables content compression',
        'Prevents caching of the response',
      ],
      answer: 1,
      explanation: 'Without nosniff, browsers may "sniff" the content type — treating a text/plain response as executable JavaScript if it looks like script. This enables certain XSS attacks. nosniff tells the browser to trust the Content-Type header and not guess.',
    },
  ];

  qna: QnaItem[] = [
    {
      q: 'My SPA gets a CORS error but curl works fine — why?',
      a: 'CORS is browser-enforced. curl sends no Origin header and ignores CORS response headers — it always sees the response. Your browser sends an Origin header and blocks the response if Access-Control-Allow-Origin does not match. Check: (1) Is UseCors() before UseAuthentication() and UseAuthorization()? (2) Does the allowed origin exactly match (including protocol and port)? (3) For non-simple requests, is the OPTIONS preflight handled correctly?',
    },
    {
      q: 'How do I allow CORS in development without hardcoding origins?',
      a: 'Read origins from appsettings.Development.json: {"AllowedOrigins": ["http://localhost:4200"]}. Then: builder.Configuration.GetSection("AllowedOrigins").Get<string[]>(). In production appsettings.json list the real origins. This keeps dev config separate from production without changing code.',
    },
    {
      q: 'Should I use CORS to secure my API?',
      a: 'No. CORS is a browser sandbox to protect users from malicious websites making cross-origin requests on their behalf. It does not prevent direct API access via curl, Postman, or server-to-server calls. Secure your API with authentication (JWT, cookies) and authorization (policies). Use CORS to control which browser origins can call your API, but always assume direct access is possible.',
    },
    {
      q: 'What is the correct middleware order for CORS in ASP.NET Core?',
      a: 'UseRouting() → UseCors() → UseAuthentication() → UseAuthorization() → endpoints. CORS must be registered before auth because preflight OPTIONS requests do not carry auth tokens — if UseAuthentication() runs first and returns 401 on OPTIONS, the browser never receives the CORS headers and blocks the actual request.',
    },
    {
      q: 'Can I apply different CORS policies to different endpoint groups?',
      a: 'Yes. Use app.MapGroup("/api").RequireCors("ApiPolicy") and app.MapGroup("/public").RequireCors("PublicPolicy"). Or apply per endpoint with .RequireCors("PolicyName"). The global UseCors() applies as the default for any endpoint without an explicit override.',
    },
  ];
}
