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
  selector: 'app-aspnet-cors',
  standalone: true,
  imports: [CodeBlockComponent, TheoryBlockComponent, QnaBlockComponent,
            QuizBlockComponent, ChallengeBlockComponent, QuickRefComponent,
            PageMetaComponent, PageCompleteComponent,
            CommonMistakesComponent, RevisionCardComponent, PrerequisitesComponent],
  templateUrl: './cors.html',
  styleUrl: './cors.scss',
})
export class AspnetCors {

  prerequisites: Prerequisite[] = [
    { label: 'Middleware',      route: '/aspnet/middleware' },
    { label: 'Authentication',  route: '/aspnet/authentication' },
  ];

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
        'The browser caches preflight responses for the duration specified in <code>Access-Control-Max-Age</code>. Setting a high value (86400 = 1 day) reduces the number of OPTIONS round trips — the browser skips the preflight for subsequent identical cross-origin requests within the cache window.',
        '<strong>Credentialed requests</strong> (cookies, Authorization headers) require both the server to send <code>Access-Control-Allow-Credentials: true</code> AND the client to set <code>credentials: "include"</code> in the fetch call. Either side omitting their half causes the browser to block the response.',
        '<strong>Cross-origin vs same-site</strong>: an origin is scheme + host + port. <code>https://api.myapp.com</code> is a different origin from <code>https://myapp.com</code> — even though they share the domain. CORS applies across origins; SameSite cookie attributes operate across sites (registrable domain boundary).',
      ],
    },
    {
      heading: 'Configuring CORS Policies',
      points: [
        'Use named policies for different route groups: an <code>"AllowFrontend"</code> policy for API routes and a broader <code>"AllowInternal"</code> for health/admin endpoints. Apply policies via <code>UseCors("AllowFrontend")</code> globally or <code>.RequireCors("AllowFrontend")</code> per endpoint.',
        'Never use <code>AllowAnyOrigin().AllowCredentials()</code> — this combination is rejected by browsers as insecure and throws an InvalidOperationException at startup in ASP.NET Core. Always specify explicit origins when credentials are needed.',
        'Use <code>SetIsOriginAllowed(origin => new Uri(origin).Host.EndsWith(".mycompany.com"))</code> for wildcard subdomain matching — <code>WithOrigins</code> requires exact matches.',
        'Always read allowed origins from configuration, not hardcoded strings. Use <code>builder.Configuration.GetSection("AllowedOrigins").Get&lt;string[]&gt;()</code> and define different values per environment in appsettings.Development.json and appsettings.Production.json.',
        'The <code>AddDefaultPolicy()</code> shorthand sets a policy without a name that is applied when <code>UseCors()</code> is called with no argument. Use named policies (<code>AddPolicy("name", ...)</code>) when you need multiple policies for different endpoint groups.',
        'Expose custom response headers with <code>WithExposedHeaders("X-Pagination", "X-Total-Count")</code>. By default, only a small set of simple response headers are accessible to browser JavaScript — custom headers must be explicitly exposed or JavaScript cannot read them.',
      ],
    },
    {
      heading: 'HTTPS — Redirection & HSTS',
      points: [
        '<code>UseHttpsRedirection()</code> redirects HTTP requests to HTTPS with a 307 (or 301 in production). Always register this before CORS, routing, and auth middleware.',
        '<code>UseHsts()</code> sends the <code>Strict-Transport-Security</code> header, instructing browsers to only access the site over HTTPS for the specified duration (max-age). <strong>Never send HSTS from localhost</strong> — it permanently blocks HTTP access in that browser for the domain.',
        'In production, set the HSTS max-age to at least 1 year and consider preloading. Start with a short max-age (300s) during rollout so you can revert if HTTPS breaks.',
        '<code>IncludeSubDomains</code> extends the HSTS rule to all subdomains — only enable when all subdomains support HTTPS. <code>Preload</code> opts the domain into browser-maintained preload lists so HTTPS is enforced even before the first visit.',
        'HTTPS redirection only works when ASP.NET Core knows the HTTPS port. Set <code>opts.HttpsPort = 443</code> in AddHttpsRedirection() or via the <code>ASPNETCORE_HTTPS_PORT</code> environment variable. Behind a reverse proxy, configure <code>UseForwardedHeaders()</code> so ASP.NET Core sees the original HTTPS scheme.',
        '<strong>Mixed content</strong>: HSTS only affects navigations. Embedded resources (images, scripts, fonts) loaded over HTTP on an HTTPS page are "mixed content" — blocked by modern browsers. Ensure all assets are served over HTTPS, including third-party CDNs.',
      ],
    },
    {
      heading: 'Common Security Headers',
      points: [
        '<strong>X-Content-Type-Options: nosniff</strong> — prevents browsers from MIME-sniffing a response away from the declared content type (blocks some XSS vectors). Essential for any API or page that serves user-uploaded content.',
        '<strong>X-Frame-Options: DENY / SAMEORIGIN</strong> — prevents clickjacking by controlling whether the page can be embedded in an iframe. Use <code>DENY</code> for pages that must never be framed; <code>SAMEORIGIN</code> for pages that may be framed by your own site.',
        '<strong>Content-Security-Policy (CSP)</strong> — defines trusted sources for scripts, styles, and media. The most powerful XSS mitigation header but complex to configure. Start with <code>default-src \'self\'</code> and expand as needed. Use <code>report-only</code> mode first to validate before enforcing.',
        '<strong>Referrer-Policy: strict-origin-when-cross-origin</strong> — controls how much referrer information is sent with requests. The strict variant sends the full URL for same-origin requests but only the origin for cross-origin, preventing leaking of sensitive URL paths to third parties.',
        '<strong>Permissions-Policy</strong> (formerly Feature-Policy) — restricts which browser features the page can use: <code>geolocation=(), camera=(), microphone=()</code> disables access entirely. Reduces the attack surface if your site is XSS-ed.',
        'Add security headers via custom middleware (early in the pipeline, before any content is written) or via NWebSec. Place the header-adding middleware before <code>UseStaticFiles()</code> — static files bypass most middleware if registered first.',
      ],
    },
    {
      heading: 'CORS Middleware Order & Troubleshooting',
      points: [
        'The correct middleware order: <code>UseHttpsRedirection()</code> → <code>UseStaticFiles()</code> → <code>UseRouting()</code> → <code>UseCors()</code> → <code>UseAuthentication()</code> → <code>UseAuthorization()</code> → <code>MapControllers()</code>. CORS must come before auth — preflight OPTIONS requests carry no credentials and must not be rejected by auth middleware.',
        'If a preflight OPTIONS request receives a 401 or 404, the actual request never fires. The browser reports a CORS error even though the root cause is auth or routing. Always check OPTIONS separately with curl when debugging CORS: <code>curl -X OPTIONS -H "Origin: http://localhost:4200" https://api.example.com/endpoint -v</code>.',
        'A common SPA symptom: GET works but POST fails with CORS. The GET is a simple request (no preflight); the POST with JSON body triggers a preflight. Ensure the CORS policy allows the Content-Type header with <code>AllowAnyHeader()</code> or explicitly <code>WithHeaders("Content-Type", "Authorization")</code>.',
        'CORS does not restrict server-to-server calls. Microservices calling each other directly (not through a browser) ignore CORS completely — they exchange no Origin headers. Only configure CORS for endpoints that browsers call directly.',
        'Testing CORS in integration tests: use <code>WebApplicationFactory</code> and add an <code>Origin</code> header to your test requests. Assert that the response includes <code>Access-Control-Allow-Origin</code> matching the origin you sent.',
        'For SPAs deployed on the same domain as the API (same origin), CORS is not needed at all — browsers only enforce CORS for cross-origin calls. Co-locating the SPA (serve Angular from the same host/port as the API using static files middleware) eliminates all CORS configuration.',
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
    {
      q: 'Where in the middleware pipeline must UseCors() be placed relative to UseAuthentication()?',
      options: [
        'After UseAuthentication() — auth must validate first',
        'Before UseAuthentication() — preflight OPTIONS requests carry no credentials',
        'The order does not matter for CORS',
        'UseCors() must always be the very first middleware',
      ],
      answer: 1,
      explanation: 'Preflight OPTIONS requests do not carry authentication tokens or cookies. If UseAuthentication() or UseAuthorization() runs before UseCors(), it rejects the preflight with 401/403, the browser never receives the CORS headers, and the actual request never fires. CORS must come first.',
    },
    {
      q: 'How do you allow wildcard subdomains in a CORS policy?',
      options: [
        'WithOrigins("*.myapp.com") — wildcards are supported natively',
        'SetIsOriginAllowed(o => new Uri(o).Host.EndsWith(".myapp.com"))',
        'AllowAnyOrigin().WithHeaders("X-Domain", "myapp.com")',
        'Wildcard subdomains are not supported in ASP.NET Core CORS',
      ],
      answer: 1,
      explanation: 'WithOrigins() requires exact string matches — wildcards like "*.myapp.com" are not supported. SetIsOriginAllowed() accepts a predicate function called with each incoming Origin. Parse the origin URI and check the Host for the desired suffix to allow all subdomains dynamically.',
    },
    {
      q: 'What header makes custom response headers readable to browser JavaScript?',
      options: [
        'Access-Control-Allow-Headers',
        'Access-Control-Expose-Headers',
        'Access-Control-Allow-Methods',
        'X-Exposed-Headers',
      ],
      answer: 1,
      explanation: 'Browsers restrict which response headers JavaScript can read. By default, only a small allowlist (Cache-Control, Content-Type, etc.) is accessible. Access-Control-Expose-Headers lists additional headers the server explicitly permits JavaScript to read — e.g. X-Pagination or X-Total-Count for pagination metadata.',
    },
    {
      q: 'A SPA can GET from the API cross-origin but POST fails with a CORS error. What is the most likely cause?',
      options: [
        'POST is not allowed in CORS — use PUT instead',
        'GET is a simple request (no preflight); POST with JSON triggers a preflight, and the CORS policy is missing AllowAnyHeader() or does not allow Content-Type',
        'The JWT token is expired',
        'UseCors() was registered after UseAuthorization()',
      ],
      answer: 1,
      explanation: 'GET without custom headers is a simple request — no preflight, browser reads the response directly. POST with Content-Type: application/json is non-simple — triggers an OPTIONS preflight. If the CORS policy does not allow the Content-Type header (via AllowAnyHeader() or explicit WithHeaders()), the preflight fails and the POST never fires.',
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
      q: 'A single endpoint needs a DIFFERENT CORS policy than the rest of the app (e.g. a public webhook endpoint that must allow any origin, while everything else uses a strict allowlist). Does placing UseCors() once in the middleware pipeline support this, or does it force one global policy for the whole app?',
      a: 'The middleware-level UseCors() call does apply one default policy globally, but ASP.NET Core supports per-endpoint overrides via the `.RequireCors("policyName")` extension method chained onto a specific endpoint/controller/minimal-API route, after registering multiple named policies with AddCors(options => { options.AddPolicy("strict", ...); options.AddPolicy("public", ...); }). This lets most of the app use the strict default policy applied by the pipeline-level UseCors() while specific endpoints opt into a different named policy — the pipeline placement (before auth) still matters identically for every policy, since the preflight-before-auth ordering constraint applies regardless of which named policy ultimately gets selected for a given request.',
    },
    {
      q: 'Can I apply different CORS policies to different endpoint groups?',
      a: 'Yes. Use app.MapGroup("/api").RequireCors("ApiPolicy") and app.MapGroup("/public").RequireCors("PublicPolicy"). Or apply per endpoint with .RequireCors("PolicyName"). The global UseCors() applies as the default for any endpoint without an explicit override.',
    },
    {
      q: 'How do I safely enable HSTS without permanently breaking HTTP access?',
      a: 'Start with a short max-age (e.g. 300 seconds) and only enable for non-development environments. Test that HTTPS works correctly in all environments before increasing max-age. Add IncludeSubDomains only when all subdomains support HTTPS. Consider the Preload flag only when you are committed to HTTPS permanently — preloaded domains are hardcoded in browsers and extremely difficult to remove. Never enable HSTS on localhost.',
    },
    {
      q: 'How do I test that my CORS policy is working correctly?',
      a: 'Three approaches: (1) Browser devtools — the Network tab shows the OPTIONS preflight and the actual request; the Console shows the specific CORS error. (2) curl with Origin header: curl -X OPTIONS -H "Origin: http://localhost:4200" -H "Access-Control-Request-Method: POST" https://api.example.com/endpoint -v — inspect the response headers. (3) Integration test with WebApplicationFactory — add an Origin header to the test request and assert Access-Control-Allow-Origin in the response.',
    },
    {
      q: 'What is the difference between Access-Control-Allow-Headers and Access-Control-Expose-Headers?',
      a: 'Allow-Headers is a response to a preflight — it lists which request headers the client is permitted to send (e.g. Authorization, Content-Type). Expose-Headers is a directive about response headers — it lists which headers in the actual response JavaScript is allowed to read. Without Expose-Headers, custom response headers like X-Total-Count are sent but invisible to JS even if CORS succeeds.',
    },
  ];

  mistakes: CommonMistake[] = [
    {
      title: 'Registering UseCors() after UseAuthentication()',
      wrong: `app.UseAuthentication();  // rejects OPTIONS preflight with 401
app.UseAuthorization();
app.UseCors("MyPolicy"); // too late — preflight already failed`,
      right: `app.UseCors("MyPolicy");  // CORS must come first — OPTIONS has no auth
app.UseAuthentication();
app.UseAuthorization();`,
      explanation: 'Preflight OPTIONS requests carry no JWT or cookie — they are anonymous. If authentication middleware runs first, it rejects the OPTIONS request with 401. The browser never receives the CORS headers and blocks all subsequent actual requests.',
    },
    {
      title: 'Combining AllowAnyOrigin() with AllowCredentials()',
      wrong: `opts.AddPolicy("Bad", p =>
    p.AllowAnyOrigin()
     .AllowCredentials()); // throws InvalidOperationException at startup`,
      right: `opts.AddPolicy("Good", p =>
    p.WithOrigins("https://myapp.example.com")
     .AllowAnyHeader()
     .AllowAnyMethod()
     .AllowCredentials());`,
      explanation: 'AllowAnyOrigin() with AllowCredentials() would allow any website to make authenticated requests as the current user — a critical security vulnerability. ASP.NET Core throws an exception at startup when this combination is detected. Always specify explicit origins when credentials are needed.',
    },
    {
      title: 'Hardcoding origins instead of reading from configuration',
      wrong: `opts.AddPolicy("Prod", p =>
    p.WithOrigins("https://myapp.example.com") // breaks in dev
     .AllowAnyHeader().AllowAnyMethod());`,
      right: `opts.AddPolicy("Default", p =>
    p.WithOrigins(
        builder.Configuration.GetSection("AllowedOrigins").Get<string[]>() ?? [])
     .AllowAnyHeader().AllowAnyMethod().AllowCredentials());`,
      explanation: 'Hardcoded origins either block development or force you to maintain separate Program.cs branches. Read allowed origins from configuration — define http://localhost:4200 in appsettings.Development.json and production URLs in appsettings.Production.json.',
    },
    {
      title: 'Enabling HSTS in development or on localhost',
      wrong: `// Always enables HSTS — even in development on localhost
app.UseHsts();
app.UseHttpsRedirection();`,
      right: `if (!app.Environment.IsDevelopment())
{
    app.UseHsts();
    app.UseHttpsRedirection();
}`,
      explanation: 'HSTS caches the "only use HTTPS" rule in the browser for max-age seconds. Enabling it on localhost permanently blocks HTTP access to localhost in that browser — a frustrating developer experience that requires manual browser flag removal. Always gate HSTS behind an IsDevelopment() check.',
    },
    {
      title: 'Forgetting to expose custom response headers',
      wrong: `// Server sends X-Total-Count but JavaScript cannot read it
Response.Headers["X-Total-Count"] = totalCount.ToString();
// fetch response.headers.get("X-Total-Count") returns null`,
      right: `// In CORS policy — expose the header
opts.AddPolicy("Api", p =>
    p.WithOrigins(...)
     .AllowAnyHeader()
     .AllowAnyMethod()
     .WithExposedHeaders("X-Total-Count", "X-Pagination"));`,
      explanation: 'Browsers restrict which response headers JavaScript can access. Custom headers like X-Total-Count are filtered out unless listed in Access-Control-Expose-Headers. Add WithExposedHeaders() to your CORS policy for every custom header your SPA needs to read.',
    },
  ];

  revision: RevisionSummary = {
    oneLiner: 'CORS is a browser-enforced sandbox — browsers block cross-origin responses without correct headers; configure named policies with explicit origins, register UseCors() before auth middleware, and never combine AllowAnyOrigin() with AllowCredentials().',
    mustKnow: [
      'CORS is browser-enforced — curl/Postman/server-to-server ignore it entirely',
      'Preflight OPTIONS: triggered by custom headers (Authorization, application/json); cached by Access-Control-Max-Age',
      'AllowAnyOrigin() + AllowCredentials() is forbidden — throws at startup',
      'UseCors() must come before UseAuthentication() — OPTIONS carries no credentials',
      'SetIsOriginAllowed() for wildcard subdomains — WithOrigins() requires exact strings',
      'WithExposedHeaders() makes custom response headers readable to JavaScript',
      'HSTS: never in development; start with short max-age, add IncludeSubDomains, then Preload',
    ],
    interviewFocus: [
      'Why does curl bypass CORS but a browser does not?',
      'Why must UseCors() be placed before UseAuthentication()?',
      'Why does AllowAnyOrigin().AllowCredentials() throw, and what is the correct alternative?',
      'What is the difference between Access-Control-Allow-Headers and Access-Control-Expose-Headers?',
      'Why must HSTS never be enabled in development?',
    ],
  };
}
