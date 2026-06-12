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
  selector: 'app-aspnet-web-security',
  standalone: true,
  imports: [CodeBlockComponent, TheoryBlockComponent, QnaBlockComponent,
            QuizBlockComponent, ChallengeBlockComponent, QuickRefComponent,
            PageMetaComponent, PageCompleteComponent],
  templateUrl: './web-security.html',
  styleUrl: './web-security.scss',
})
export class AspnetWebSecurity {

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
        'Never build SQL with string interpolation or concatenation from user input: <code>\$"SELECT * FROM Users WHERE name = \'{name}\'"</code> is vulnerable. The attacker inputs <code>" OR 1=1 --"</code> and gets all users.',
        'Stored procedures are not inherently safe — if they build dynamic SQL internally with <code>EXEC(\'...\')</code>, they are vulnerable. The fix is the same: parameterise at every level.',
      ],
    },
    {
      heading: 'Cross-Site Scripting (XSS)',
      points: [
        'XSS occurs when attacker-controlled content is rendered as executable HTML/JavaScript. In Razor, <code>@value</code> is automatically HTML-encoded — safe. Unsafe: <code>@Html.Raw(value)</code>. In minimal APIs returning HTML, always encode with <code>HtmlEncoder.Default.Encode(userInput)</code>.',
        'For APIs returning JSON, XSS is not a direct concern (browsers do not execute JSON). But if your API responses are consumed by a frontend that renders them as HTML, the frontend must encode.',
        '<strong>Content Security Policy</strong> is the most powerful XSS mitigation — it restricts which scripts may execute. Even if injection succeeds, CSP prevents script execution. Start with a report-only policy to identify violations before enforcing.',
      ],
    },
    {
      heading: 'CSRF (Cross-Site Request Forgery)',
      points: [
        'CSRF tricks an authenticated user\'s browser into submitting a request to your site. Since cookies are sent automatically, the request appears legitimate. It is only a threat for <strong>cookie-based authentication</strong> — JWT in Authorization headers is not vulnerable because attackers cannot read or set that header from cross-origin JavaScript.',
        'Protection: antiforgery tokens. The server issues a unique token bound to the user\'s session; the client must include it in the form/request. An attacker cannot read the token from another origin (same-origin policy), so they cannot include it.',
        'ASP.NET Core automatically validates antiforgery for form posts in Razor Pages/MVC. For minimal APIs with cookie auth, call <code>services.AddAntiforgery()</code> and validate manually via <code>IAntiforgery.ValidateRequestAsync()</code>.',
      ],
    },
    {
      heading: 'Path Traversal & Open Redirects',
      points: [
        '<strong>Path traversal</strong>: user input used in file paths can escape the intended directory with <code>../../etc/passwd</code>. Always resolve the full path and verify it starts with the allowed base directory: <code>Path.GetFullPath(input).StartsWith(allowedBase)</code>.',
        '<strong>Open redirect</strong>: redirecting to a URL from user input allows phishing — attacker links to your trusted domain and bounces to a malicious site. Use <code>Url.IsLocalUrl(returnUrl)</code> in MVC or <code>LocalRedirect(url)</code> in minimal APIs — these throw if the URL is external.',
        'Both vulnerabilities share the root cause: user input treated as trusted server-side state. Validate and sanitize all user input before using it in file paths, redirects, or SQL.',
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
        '\`SELECT * FROM Users WHERE name = \'{name}\'\` (raw interpolation)',
        'FromSqlRaw with an explicit SqlParameter',
        'db.ExecuteSqlRawAsync(\$"DELETE FROM Logs WHERE date < {userDate}")',
        'Manually replacing single quotes with escaped quotes',
      ],
      answer: 1,
      explanation: 'Explicit SqlParameter objects or FromSqlInterpolated() both parameterise the value — the query structure and the data are sent separately. String replacement (option C) is vulnerable to other injection vectors, and manual escaping misses edge cases.',
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
  ];
}
