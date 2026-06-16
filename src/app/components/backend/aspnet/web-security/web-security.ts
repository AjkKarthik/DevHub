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
  selector: 'app-aspnet-web-security',
  standalone: true,
  imports: [CodeBlockComponent, TheoryBlockComponent, QnaBlockComponent,
            QuizBlockComponent, ChallengeBlockComponent, QuickRefComponent,
            PageMetaComponent, PageCompleteComponent,
            CommonMistakesComponent, RevisionCardComponent, PrerequisitesComponent],
  templateUrl: './web-security.html',
  styleUrl: './web-security.scss',
})
export class AspnetWebSecurity {

  prerequisites: Prerequisite[] = [
    { label: 'Authentication',  route: '/aspnet/authentication' },
    { label: 'CORS',            route: '/aspnet/cors' },
    { label: 'EF Core Basics',  route: '/aspnet/ef-core-basics' },
  ];

  quickRef: QuickRefItem[] = [
    { name: 'FromSqlInterpolated()',  type: 'method',  desc: 'Safe raw SQL — automatically parameterises interpolated values' },
    { name: 'HtmlEncoder.Encode()',   type: 'method',  desc: 'Encode untrusted strings before inserting into HTML context' },
    { name: 'AddAntiforgery()',       type: 'method',  desc: 'CSRF protection for cookie-auth form posts — validates request token' },
    { name: '[ValidateAntiForgeryToken]', type: 'decorator', desc: 'Require valid CSRF token on controller actions' },
    { name: 'IAntiforgery',          type: 'interface', desc: 'Generate and validate antiforgery tokens programmatically' },
    { name: 'LocalRedirect()',        type: 'method',  desc: 'Safe redirect — throws if URL is not local, preventing open redirects' },
    { name: 'Content-Security-Policy', type: 'keyword', desc: 'HTTP header restricting which scripts/styles/media may load' },
    { name: 'Path.GetFullPath()',     type: 'method',  desc: 'Resolve full path and compare to allowed base — detect path traversal' },
  ];

  theory: TheoryPoint[] = [
    {
      heading: 'SQL Injection',
      points: [
        'EF Core parameterises LINQ queries automatically — the query body is never user data. However, <code>FromSqlRaw()</code> with string concatenation reintroduces injection. Always use <code>FromSqlInterpolated()</code> (which parameterises interpolated values) or explicit <code>SqlParameter</code> objects.',
        'Never build SQL with string interpolation or concatenation from user input: <code>\$"SELECT * FROM Users WHERE name = \'{name}\'"</code> is vulnerable. The attacker inputs <code>\' OR 1=1 --</code> and gets all users.',
        'Stored procedures are not inherently safe — if they build dynamic SQL internally with <code>EXEC(\'...\')</code>, they are vulnerable. The fix is the same: parameterise at every level.',
        'Second-order injection: user input is stored safely in the database, then later read back and concatenated into a dynamic SQL string. The initial INSERT is safe; the vulnerability is in the code that reads the stored value and uses it unsafely. Treat data retrieved from the database the same as untrusted user input when building SQL.',
        'Dynamic LINQ libraries can be injection vectors. <code>.Where("Name == @0", userInput)</code> is safe — the library parameterises @0. <code>.Where(\$"Name == \'{userInput}\'")</code> is not — you are interpolating directly into the expression string. Read the library docs carefully and always use parameterised form.',
        'Use the principle of least privilege at the database level: the application\'s database user should only have SELECT/INSERT/UPDATE/DELETE on needed tables — not ALTER, DROP, or EXECUTE on all stored procedures. Even if injection occurs, the blast radius is limited.',
      ],
    },
    {
      heading: 'Cross-Site Scripting (XSS)',
      points: [
        'XSS occurs when attacker-controlled content is rendered as executable HTML/JavaScript. In Razor, <code>@value</code> is automatically HTML-encoded — safe. Unsafe: <code>@Html.Raw(value)</code>. In minimal APIs returning HTML, always encode with <code>HtmlEncoder.Default.Encode(userInput)</code>.',
        'For APIs returning JSON, XSS is not a direct concern (browsers do not execute JSON). But if your API responses are consumed by a frontend that renders them as HTML, the frontend must encode.',
        '<strong>Content Security Policy</strong> is the most powerful XSS mitigation — it restricts which scripts may execute. Even if injection succeeds, CSP prevents script execution. Start with a report-only policy to identify violations before enforcing.',
        '<strong>Stored XSS</strong> is the most dangerous variant: the malicious payload is stored in the database and served to every user who views the content. Encode on output (not on input) — store the raw value and encode when rendering, so you can render in multiple contexts (HTML, JSON, CSV) correctly.',
        '<strong>DOM-based XSS</strong> happens entirely in the browser — the server never sees the payload. JavaScript reads from a dangerous source (location.hash, document.referrer) and writes to a dangerous sink (innerHTML, eval). Fix: use textContent instead of innerHTML; never eval(); sanitise with DOMPurify when HTML must be rendered.',
        'Use <code>HttpOnly</code> cookies for session tokens — XSS cannot steal cookies it cannot read. HttpOnly is the last line of defense when XSS occurs despite encoding. CSP prevents execution; HttpOnly prevents cookie theft even if CSP is bypassed.',
      ],
    },
    {
      heading: 'CSRF (Cross-Site Request Forgery)',
      points: [
        'CSRF tricks an authenticated user\'s browser into submitting a request to your site. Since cookies are sent automatically, the request appears legitimate. It is only a threat for <strong>cookie-based authentication</strong> — JWT in Authorization headers is not vulnerable because attackers cannot read or set that header from cross-origin JavaScript.',
        'Protection: antiforgery tokens. The server issues a unique token bound to the user\'s session; the client must include it in the form/request. An attacker cannot read the token from another origin (same-origin policy), so they cannot include it.',
        'ASP.NET Core automatically validates antiforgery for form posts in Razor Pages/MVC. For minimal APIs with cookie auth, call <code>services.AddAntiforgery()</code> and validate manually via <code>IAntiforgery.ValidateRequestAsync()</code>.',
        '<strong>SameSite cookie attribute</strong> is a complementary defence. <code>SameSite=Strict</code> prevents the browser from sending the cookie on any cross-origin request. <code>Lax</code> allows top-level navigations (GET via link) but blocks form-posted cross-origin requests. <code>Strict</code> is the strongest protection but may break OAuth flows and normal linking.',
        'Double-submit cookie pattern is an alternative to server-side token storage: generate a random value, set it as a non-HttpOnly cookie, require the client to also send it as a header. Since cross-origin requests cannot read the cookie (unless CORS allows it), the double-submit proves same-origin.',
        'CSRF only matters for state-changing operations (POST, PUT, DELETE, PATCH). GET requests should not change server state — if they do, fix that first. The antiforgery middleware only needs to protect non-idempotent endpoints.',
      ],
    },
    {
      heading: 'Path Traversal & Open Redirects',
      points: [
        '<strong>Path traversal</strong>: user input used in file paths can escape the intended directory with <code>../../etc/passwd</code>. Always resolve the full path and verify it starts with the allowed base directory: <code>Path.GetFullPath(input).StartsWith(allowedBase)</code>.',
        '<strong>Open redirect</strong>: redirecting to a URL from user input allows phishing — attacker links to your trusted domain and bounces to a malicious site. Use <code>Url.IsLocalUrl(returnUrl)</code> in MVC or <code>LocalRedirect(url)</code> in minimal APIs — these throw if the URL is external.',
        'Both vulnerabilities share the root cause: user input treated as trusted server-side state. Validate and sanitize all user input before using it in file paths, redirects, or SQL.',
        '<code>Path.GetFileName(filename)</code> strips directory separators — <code>"../../etc/passwd"</code> becomes <code>"passwd"</code>. Use it as a first-pass sanitiser, then also resolve and check with Path.GetFullPath() to catch symlinks and platform-specific traversal variants.',
        'Open redirects are listed in the OWASP Top 10. They enable phishing because the victim trusts your domain in the initial URL. Always use an allowlist of permitted redirect destinations or restrict to relative paths. Never use user input directly in <code>Response.Redirect()</code>.',
        'Server-Side Request Forgery (SSRF) is the server-side cousin of open redirect: user-controlled input is used in a server-to-server HTTP request — attacker points it at internal services (<code>http://169.254.169.254/latest/meta-data/</code> for AWS metadata). Validate URLs against an allowlist before making outbound requests.',
      ],
    },
    {
      heading: 'Input Validation, Output Encoding & Defence in Depth',
      points: [
        '<strong>Validate at the boundary</strong>: use DataAnnotations or FluentValidation on DTOs to reject malformed input before it reaches business logic. Use a validation filter or minimal API extension that returns 400 with structured error details automatically.',
        '<strong>Encode at the point of use</strong>, not at the point of storage. Store raw input; encode for the target context (HTML encode for Razor, JSON-escape for JSON, parameterise for SQL). Encoding at storage forces you to decode when processing and leads to double-encoding bugs.',
        '<strong>Mass assignment / over-posting</strong>: binding a request body directly to an EF entity lets attackers set any property (IsAdmin, RoleId). Always use separate input DTOs with only the fields users should control, then map to entities explicitly.',
        '<strong>Dependency headers</strong>: libraries in your NuGet dependency tree can have vulnerabilities. Run <code>dotnet list package --vulnerable</code> in CI to detect known CVEs. Keep dependencies updated — the OWASP Top 10 includes "Vulnerable and Outdated Components".',
        '<strong>Secrets in code / source control</strong> are a common production incident. Never hardcode connection strings, API keys, or passwords. Use User Secrets in development, environment variables or Azure Key Vault in production. Rotate secrets periodically.',
        '<strong>Logging sensitive data</strong> is a security risk. Structured logging frameworks like Serilog may log entire objects including passwords, tokens, and PII. Use destructuring policies to exclude sensitive properties, and enable sensitive data logging only in local dev (never in production).',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'SQL Injection Prevention',
      language: 'csharp',
      code: `// VULNERABLE — never do this:
var name = request.Query["name"];
var users = db.Users.FromSqlRaw(\`SELECT * FROM Users WHERE Name = '\${name}'\`).ToList();
// Attacker input: ' OR 1=1 --  → returns ALL users

// SAFE: FromSqlInterpolated (EF parameterises the value automatically)
var users = await db.Users
    .FromSqlInterpolated(\$"SELECT * FROM Users WHERE Name = {name}")
    .ToListAsync(ct);

// SAFE: explicit SqlParameter
var param = new SqlParameter("@name", name);
var users = await db.Users
    .FromSqlRaw("SELECT * FROM Users WHERE Name = @name", param)
    .ToListAsync(ct);

// SAFE: use LINQ (always parameterised)
var users = await db.Users
    .Where(u => u.Name == name)
    .ToListAsync(ct);`,
    },
    {
      label: 'XSS Prevention',
      language: 'csharp',
      code: `// In a Razor view — safe (auto-encoded):
// <p>@Model.UserName</p>

// In a Razor view — UNSAFE:
// <p>@Html.Raw(Model.UserName)</p>

// Minimal API returning HTML — always encode:
app.MapGet("/greet", (string name, HtmlEncoder encoder) =>
{
    var safe = encoder.Encode(name);      // < → &lt;  > → &gt;  etc.
    return Results.Content(\`<h1>Hello \${safe}</h1>\`, "text/html");
});

// Content Security Policy header (add to security headers middleware)
ctx.Response.Headers["Content-Security-Policy"] =
    "default-src 'self'; " +
    "script-src 'self'; " +           // no inline scripts
    "style-src 'self' 'unsafe-inline'; " +
    "img-src 'self' data: https:; " +
    "object-src 'none'; " +
    "frame-ancestors 'none';";

// Report-only (audit without blocking) — safe to deploy first
ctx.Response.Headers["Content-Security-Policy-Report-Only"] =
    "default-src 'self'; report-uri /csp-report";`,
    },
    {
      label: 'Antiforgery (CSRF)',
      language: 'csharp',
      code: `// Register antiforgery
builder.Services.AddAntiforgery(opts =>
{
    opts.Cookie.Name     = "XSRF-TOKEN";
    opts.HeaderName      = "X-XSRF-TOKEN";   // SPA sends token in this header
    opts.Cookie.HttpOnly = false;             // SPA must be able to read the cookie
});

// Razor Pages / MVC — automatic per [ValidateAntiForgeryToken]
[HttpPost, ValidateAntiForgeryToken]
public IActionResult Submit(FormModel model) { ... }

// Minimal API — validate manually
app.MapPost("/submit", async (HttpContext ctx, IAntiforgery antiforgery) =>
{
    await antiforgery.ValidateRequestAsync(ctx);
    // ... handle form
});

// SPA flow: GET /antiforgery/token → set cookie + return header token
app.MapGet("/antiforgery/token", (IAntiforgery af, HttpContext ctx) =>
{
    var tokens = af.GetAndStoreTokens(ctx);
    return Results.Ok(new { Token = tokens.RequestToken });
});`,
    },
    {
      label: 'Path Traversal Prevention',
      language: 'csharp',
      code: `// VULNERABLE — never use user input directly in a path:
app.MapGet("/download", (string filename) =>
    Results.File(Path.Combine("uploads", filename)));
// Attacker: filename = "../../etc/passwd"

// SAFE: resolve full path and verify it starts with the allowed root
app.MapGet("/download", (string filename) =>
{
    var root    = Path.GetFullPath("uploads");
    var full    = Path.GetFullPath(Path.Combine(root, filename));

    if (!full.StartsWith(root + Path.DirectorySeparatorChar))
        return Results.BadRequest("Invalid filename.");

    if (!File.Exists(full))
        return Results.NotFound();

    return Results.File(full);
});

// Additional: restrict to safe filename characters
var safeName = Path.GetFileName(filename);   // strips directory components
// safeName is now just "report.pdf" — no "../" components`,
    },
    {
      label: 'Open Redirect Prevention',
      language: 'csharp',
      code: `// VULNERABLE — redirecting to user-supplied URL:
app.MapGet("/login", (string? returnUrl) =>
    Results.Redirect(returnUrl ?? "/"));
// Attacker: returnUrl = "https://evil.com" — trusted domain bounces to phishing

// SAFE: use LocalRedirect — throws if URL is not local
app.MapGet("/login", (string? returnUrl) =>
{
    // Simulate successful login...
    var safe = returnUrl is not null && Uri.TryCreate(returnUrl, UriKind.Relative, out _)
        ? returnUrl
        : "/";
    return Results.LocalRedirect(safe);
});

// In MVC controllers — Url.IsLocalUrl()
[HttpPost]
public IActionResult Login(string? returnUrl)
{
    // authenticate...
    return Url.IsLocalUrl(returnUrl)
        ? Redirect(returnUrl)
        : RedirectToAction("Index", "Home");
}`,
    },
  ];

  challenge: Challenge = {
    title: 'Secure Message Board',
    language: 'csharp',
    description: 'Build a secure minimal API for a message board. Requirements: (1) POST /messages — accept {title, body} from the request body. Validate: title and body must not be empty and must be < 200 chars. (2) GET /messages/{id} — return the message. (3) In a middleware, add X-Content-Type-Options, X-Frame-Options: DENY, and a basic CSP header. (4) Demonstrate that user input is safely handled in any HTML response (encode with HtmlEncoder). (5) For file attachment: GET /attachments/{filename} — validate the filename is within the "uploads" folder (prevent path traversal).',
    hints: [
      'HtmlEncoder.Default.Encode(input) before inserting into HTML',
      'Path.GetFullPath() to resolve both the base and the requested path',
      'Check resolvedPath.StartsWith(baseDir + Path.DirectorySeparatorChar)',
      'Response.Headers["Content-Security-Policy"] = "default-src \'self\'"',
    ],
    starterCode: `var builder = WebApplication.CreateBuilder(args);
var app = builder.Build();

// TODO: security headers middleware (X-Content-Type-Options, X-Frame-Options, CSP)

var messages = new List<Message>();
var nextId = 1;

// TODO: POST /messages — validate title/body, store safely
// TODO: GET /messages/{id} — return message as JSON
// TODO: GET /attachments/{filename} — safe file download (path traversal prevention)

app.Run();
public record Message(int Id, string Title, string Body);`,
    solution: `var builder = WebApplication.CreateBuilder(args);
var app = builder.Build();

// Security headers
app.Use(async (ctx, next) =>
{
    ctx.Response.Headers["X-Content-Type-Options"]  = "nosniff";
    ctx.Response.Headers["X-Frame-Options"]         = "DENY";
    ctx.Response.Headers["Content-Security-Policy"] = "default-src 'self'";
    await next();
});

var messages = new List<Message>();
var nextId = 1;

app.MapPost("/messages", (MessageInput input, HtmlEncoder encoder) =>
{
    if (string.IsNullOrWhiteSpace(input.Title) || input.Title.Length > 200)
        return Results.BadRequest("Title is required and must be < 200 chars.");
    if (string.IsNullOrWhiteSpace(input.Body) || input.Body.Length > 200)
        return Results.BadRequest("Body is required and must be < 200 chars.");

    var msg = new Message(nextId++,
        encoder.Encode(input.Title),  // safe for HTML rendering
        encoder.Encode(input.Body));
    messages.Add(msg);
    return Results.Created(\`/messages/\${msg.Id}\`, msg);
});

app.MapGet("/messages/{id:int}", (int id) =>
    messages.FirstOrDefault(m => m.Id == id) is { } msg
        ? Results.Ok(msg) : Results.NotFound());

app.MapGet("/attachments/{filename}", (string filename) =>
{
    var root = Path.GetFullPath("uploads");
    var full = Path.GetFullPath(Path.Combine(root, filename));
    if (!full.StartsWith(root + Path.DirectorySeparatorChar))
        return Results.BadRequest("Invalid filename.");
    return File.Exists(full) ? Results.File(full) : Results.NotFound();
});

app.Run();

public record Message(int Id, string Title, string Body);
public record MessageInput(string Title, string Body);`,
  };

  quiz: QuizQuestion[] = [
    {
      q: 'Which of the following is safe against SQL injection?',
      options: [
        'FromSqlRaw($"SELECT * FROM Users WHERE name = \'{name}\'")',
        'FromSqlRaw with an explicit SqlParameter',
        'db.ExecuteSqlRawAsync($"DELETE FROM Logs WHERE date < {userDate}")',
        'Manually replacing single quotes with escaped quotes',
      ],
      answer: 1,
      explanation: 'Explicit SqlParameter objects or FromSqlInterpolated() both parameterise the value — the query structure and the data are sent separately. String interpolation in FromSqlRaw (options A, C) creates injection vulnerabilities; manual escaping misses edge cases.',
    },
    {
      q: 'Why is CSRF not a risk for APIs using JWT in the Authorization header?',
      options: [
        'JWT tokens expire too quickly for CSRF to work',
        'Cross-origin JavaScript cannot read or set the Authorization header — attackers cannot include the token in a forged request',
        'CORS protects all API requests',
        'JWT tokens are encrypted so attackers cannot forge them',
      ],
      answer: 1,
      explanation: 'CSRF works by exploiting automatic cookie sending. The Authorization header is not sent automatically — the client JavaScript must read the token and add the header. Since same-origin policy prevents cross-origin JS from reading the token, it cannot be included in a forged request.',
    },
    {
      q: 'What does LocalRedirect() do that Redirect() does not?',
      options: [
        'It redirects with HTTP 301 instead of 302',
        'It throws an InvalidOperationException if the URL is not a local (relative) URL',
        'It encodes the redirect URL',
        'It adds CORS headers to the redirect response',
      ],
      answer: 1,
      explanation: 'LocalRedirect() validates that the URL is local (relative path, no host). If an attacker supplies an absolute URL like "https://evil.com", LocalRedirect() throws rather than redirecting. This prevents open-redirect phishing attacks.',
    },
    {
      q: 'What is the Content-Security-Policy header used for?',
      options: [
        'Encrypting the response body',
        'Restricting which scripts, styles, and media may load — the primary XSS mitigation',
        'Preventing CSRF attacks',
        'Rate limiting client requests',
      ],
      answer: 1,
      explanation: 'CSP tells the browser which sources are trusted for scripts, styles, images, etc. Even if an attacker injects a <script> tag, CSP blocks it from executing unless it comes from an allowed source. It is the most effective mitigation against XSS attacks.',
    },
    {
      q: 'How do you safely use user input in a file path?',
      options: [
        'Wrap it in a try-catch to handle exceptions',
        'Resolve the full path and verify it starts with the allowed base directory',
        'Call Path.GetFileName() and that is sufficient for safety',
        'Use WebUtility.UrlEncode() on the filename',
      ],
      answer: 1,
      explanation: 'Path.GetFileName() removes directory separators from the filename but does not prevent all traversal. Resolve both paths with Path.GetFullPath() and check that the result starts with the intended base directory — this catches symlinks and other traversal tricks.',
    },
    {
      q: 'When should you encode user input — at storage time or at output time?',
      options: [
        'At storage time — encode once when saving to the database',
        'At output time — store raw, encode for the specific output context (HTML, JSON, SQL)',
        'Both — encode at storage AND at output for maximum safety',
        'Neither — validation prevents encoding from being needed',
      ],
      answer: 1,
      explanation: 'Encoding at storage forces double-encoding bugs and prevents multi-context use (same data rendered as HTML, exported as CSV, used in a SQL query). Store raw; encode at the point of output for the specific context — HTML-encode for Razor, parameterise for SQL, JSON-escape for JSON.',
    },
    {
      q: 'What is a mass assignment (over-posting) vulnerability?',
      options: [
        'Sending too many requests simultaneously to overwhelm the server',
        'Binding a request body directly to an entity, allowing attackers to set properties like IsAdmin=true',
        'Uploading files larger than the configured limit',
        'Using a loop to submit the same form repeatedly',
      ],
      answer: 1,
      explanation: 'If you bind a POST body directly to your EF entity or domain model, an attacker can include extra fields (IsAdmin, RoleId, Balance) not shown in the form. ASP.NET Core will bind them silently. Use separate input DTOs with only the fields users should control.',
    },
    {
      q: 'What is the safest cookie configuration for a session token?',
      options: [
        'HttpOnly=false, Secure=false, SameSite=None (maximum browser compatibility)',
        'HttpOnly=true, Secure=true, SameSite=Lax or Strict',
        'HttpOnly=true, Secure=false, SameSite=None',
        'Secure=true, SameSite=Strict only — HttpOnly does not affect security',
      ],
      answer: 1,
      explanation: 'HttpOnly=true prevents JavaScript from reading the cookie (XSS cannot steal it). Secure=true ensures it is only sent over HTTPS (cannot be intercepted on HTTP). SameSite=Lax or Strict prevents CSRF. This combination is the standard defence for session cookies.',
    },
    {
      q: 'What does "encode on output, not on input" mean for XSS prevention?',
      options: [
        'Run HtmlEncoder on the HTTP response headers but not on the body',
        'Store untrusted data as-is; apply context-appropriate encoding only when rendering it (HTML, JSON, etc.)',
        'Sanitise user input before storing it in the database',
        'Use URL encoding on all query string parameters',
      ],
      answer: 1,
      explanation: 'Input sanitisation misses injection contexts — you cannot know at storage time whether data will be rendered as HTML, used in SQL, or exported as CSV. Encoding at the output point, in the correct context (HtmlEncoder for HTML, parameterised queries for SQL), is the correct and complete defence.',
    },
  ];

  qna: QnaItem[] = [
    {
      q: 'Does EF Core prevent all SQL injection automatically?',
      a: 'EF Core LINQ queries are always parameterised — safe. But FromSqlRaw() with string interpolation or concatenation is vulnerable. Always use FromSqlInterpolated() or SqlParameter. Also watch for dynamic LINQ libraries (System.Linq.Dynamic.Core) — if you pass user input to Where("name == @0", userInput), that is safe; if you interpolate into the expression string, it is not.',
    },
    {
      q: 'Is antiforgery needed for API endpoints that use JWT?',
      a: 'No. CSRF only affects cookie-based authentication because cookies are sent automatically by the browser. JWT in the Authorization header is not sent automatically — CSRF cannot include it. If your API uses cookies (e.g., cookie-based JWT or session cookies), antiforgery is needed for any state-changing endpoints.',
    },
    {
      q: 'How do I deploy a CSP without breaking my application?',
      a: 'Start with Content-Security-Policy-Report-Only instead of Content-Security-Policy. It logs violations to the report-uri without blocking anything. Review the violation reports to understand what sources your app uses, then build the policy. Once the policy is clean, switch to enforcing mode. Common gotchas: inline scripts (require "unsafe-inline" or use nonces), external fonts/CDNs, and third-party analytics.',
    },
    {
      q: 'How do I prevent mass assignment (over-posting) attacks?',
      a: 'In ASP.NET Core, model binding from [FromBody] binds only the declared properties of the DTO — extra JSON properties are ignored by default. Never bind directly to your EF entity — a POST body with IsAdmin=true would set that property. Define separate input DTOs with only the fields users are allowed to set, and map them to entities in the handler.',
    },
    {
      q: 'What is the difference between XSS and CSRF?',
      a: 'XSS (Cross-Site Scripting): the attacker injects malicious scripts into your pages that run in other users\' browsers. The script can steal cookies, read DOM content, and send requests with the victim\'s credentials. CSRF (Cross-Site Request Forgery): the attacker tricks the victim\'s browser into making a request to your site using the victim\'s existing authentication. CSRF does not inject code — it forges the victim\'s authenticated action (e.g., transferring money). XSS is fixed by encoding; CSRF is fixed by antiforgery tokens or SameSite cookies.',
    },
    {
      q: 'How do I detect security vulnerabilities in my NuGet dependencies?',
      a: 'Run "dotnet list package --vulnerable" to check all packages in the solution against the NuGet vulnerability database. Integrate this into your CI pipeline — fail the build if high-severity CVEs are found. Tools like Dependabot (GitHub) or Renovate can open PRs automatically when dependency updates fix CVEs. Also check for unmaintained packages with "dotnet list package --outdated".',
    },
    {
      q: 'What is SSRF and how do I prevent it?',
      a: 'Server-Side Request Forgery (SSRF): the server makes an outbound HTTP request to a URL supplied (directly or indirectly) by user input. The attacker points it at internal services — cloud metadata endpoints (http://169.254.169.254/), internal APIs, or localhost services. Prevention: (1) Validate URLs against an allowlist of permitted hostnames/IPs before making the request. (2) Use a DNS allowlist or a proxy that only forwards to approved endpoints. (3) Block requests to private IP ranges (10.x, 172.16.x, 192.168.x) at the network or code level.',
    },
    {
      q: 'How do I avoid logging sensitive data in production?',
      a: 'Structured logging (Serilog, NLog) can log entire objects including passwords, tokens, and PII if you use destructuring (@{user}). Configure destructuring policies to exclude sensitive properties: .Destructure.ByTransforming<LoginDto>(x => new { x.Username }). Set LogLevel to Warning or above in production — never log at Debug or Trace. Never call EnableSensitiveDataLogging() on DbContext in production — it logs SQL parameter values including passwords.',
    },
  ];

  mistakes: CommonMistake[] = [
    {
      title: 'Using FromSqlRaw() with string interpolation',
      wrong: `string name = Request.Query["name"];
var users = db.Users
    .FromSqlRaw(\$"SELECT * FROM Users WHERE Name = '{name}'")
    .ToList(); // SQL INJECTION`,
      right: `string name = Request.Query["name"];
var users = await db.Users
    .FromSqlInterpolated(\$"SELECT * FROM Users WHERE Name = {name}")
    .ToListAsync(ct); // parameterised automatically`,
      explanation: 'FromSqlRaw() treats the string as raw SQL — interpolated values are concatenated directly. An attacker can supply \' OR 1=1 -- to bypass the WHERE clause. FromSqlInterpolated() wraps interpolated values as SQL parameters transparently.',
    },
    {
      title: 'Binding request bodies directly to EF entities (over-posting)',
      wrong: `// POST body: {"username":"alice","isAdmin":true,"balance":10000}
app.MapPost("/users", async (User user, AppDbContext db) =>
{
    db.Users.Add(user); // IsAdmin and Balance set from user input!
    await db.SaveChangesAsync();
});`,
      right: `app.MapPost("/users", async (CreateUserDto dto, AppDbContext db) =>
{
    var user = new User { Username = dto.Username }; // only safe fields
    db.Users.Add(user);
    await db.SaveChangesAsync();
});
public record CreateUserDto(string Username);`,
      explanation: 'Binding directly to entity classes allows attackers to set any property — IsAdmin, RoleId, Balance — by including it in the JSON body. Use separate input DTOs with only the fields users should control.',
    },
    {
      title: 'Using @Html.Raw() with user-controlled data in Razor',
      wrong: `<!-- UNSAFE: renders raw HTML from user input -->
<div>@Html.Raw(Model.UserBio)</div>
<!-- Attacker bio: <script>document.cookie</script> -->`,
      right: `<!-- SAFE: Razor auto-encodes @ expressions -->
<div>@Model.UserBio</div>
<!-- Or explicitly: -->
<div>@HtmlEncoder.Default.Encode(Model.UserBio)</div>`,
      explanation: '@Html.Raw() bypasses Razor\'s automatic HTML encoding. If UserBio contains <script>...</script>, it executes in every visitor\'s browser (stored XSS). Use bare @Model.Property — Razor encodes automatically. Only use @Html.Raw() for server-generated, trusted HTML.',
    },
    {
      title: 'Redirecting to user-supplied URLs (open redirect)',
      wrong: `app.MapGet("/after-login", (string? returnUrl) =>
    Results.Redirect(returnUrl ?? "/")); // attacker: returnUrl=https://evil.com`,
      right: `app.MapGet("/after-login", (string? returnUrl) =>
{
    var safe = returnUrl is not null
        && Uri.TryCreate(returnUrl, UriKind.Relative, out _)
        ? returnUrl : "/";
    return Results.LocalRedirect(safe);
});`,
      explanation: 'An open redirect lets attackers create phishing links with your trusted domain: https://bank.com/after-login?returnUrl=https://evil.com. After login, the victim is silently bounced to the phishing site. LocalRedirect() throws if the URL is not relative.',
    },
    {
      title: 'Using user input in file paths without validation',
      wrong: `app.MapGet("/file", (string name) =>
    Results.File(Path.Combine("uploads", name)));
// name = "../../appsettings.json" → reads config file`,
      right: `app.MapGet("/file", (string name) =>
{
    var root = Path.GetFullPath("uploads");
    var full = Path.GetFullPath(Path.Combine(root, name));
    if (!full.StartsWith(root + Path.DirectorySeparatorChar))
        return Results.BadRequest();
    return File.Exists(full) ? Results.File(full) : Results.NotFound();
});`,
      explanation: 'Path.Combine does not validate that the result stays within the intended directory. "../" components navigate up the tree. Resolve both paths with Path.GetFullPath() and assert the result starts with the allowed base — this is the only reliable check.',
    },
  ];

  revision: RevisionSummary = {
    oneLiner: 'Web security is defence in depth: parameterise SQL, encode on output for XSS, use antiforgery tokens for CSRF with cookies, validate file paths, use LocalRedirect for redirects, and add security headers.',
    mustKnow: [
      'SQL injection: use FromSqlInterpolated() or SqlParameter — never concatenate user input into SQL',
      'XSS: encode at output time for the context (HTML, JSON); @value in Razor is safe, @Html.Raw() is not',
      'CSRF: only affects cookie auth; fix with antiforgery tokens or SameSite=Strict/Lax',
      'Path traversal: resolve full path with Path.GetFullPath() and assert it starts with the allowed root',
      'Open redirect: LocalRedirect() throws on external URLs; Url.IsLocalUrl() in MVC',
      'Mass assignment: bind to DTOs, never to EF entities directly',
      'HttpOnly + Secure + SameSite: the three essential cookie security attributes',
    ],
    interviewFocus: [
      'What is the difference between XSS and CSRF, and how do you fix each?',
      'Why is CSRF not a concern for JWT-based APIs but is for cookie-based APIs?',
      'Explain "encode on output, not on input" and why it matters for multi-context rendering',
      'How does path traversal work and what is the correct mitigation?',
      'What is mass assignment and how does ASP.NET Core help prevent it?',
    ],
  };
}
