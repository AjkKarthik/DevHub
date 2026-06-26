import { Component } from '@angular/core';
import { PageMetaComponent }      from '../../../shared/page-meta/page-meta';
import { QuickRefComponent, QuickRefItem } from '../../../shared/quick-ref/quick-ref';
import { TheoryBlockComponent, TheoryPoint } from '../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../shared/code-block/code-block';
import { ChallengeBlockComponent, Challenge } from '../../../shared/challenge-block/challenge-block';
import { QuizBlockComponent, QuizQuestion } from '../../../shared/quiz-block/quiz-block';
import { QnaBlockComponent, QnaItem } from '../../../shared/qna-block/qna-block';
import { PageCompleteComponent } from '../../../shared/page-complete/page-complete';
import { CommonMistakesComponent, CommonMistake } from '../../../shared/common-mistakes/common-mistakes';
import { RevisionCardComponent, RevisionSummary } from '../../../shared/revision-card/revision-card';
import { PrerequisitesComponent, Prerequisite } from '../../../shared/prerequisites/prerequisites';

@Component({
  selector: 'app-aspnet-csrf',
  standalone: true,
  imports: [PageMetaComponent, QuickRefComponent, TheoryBlockComponent, CodeBlockComponent,
            ChallengeBlockComponent, QuizBlockComponent, QnaBlockComponent, PageCompleteComponent,
            CommonMistakesComponent, RevisionCardComponent, PrerequisitesComponent],
  templateUrl: './csrf.html',
  styleUrl: './csrf.scss',
})
export class AspnetCsrf {

  prerequisites: Prerequisite[] = [
    { label: 'Authentication', route: '/aspnet/authentication' },
    { label: 'Web Security Essentials', route: '/aspnet/web-security' },
  ];

  quickRef: QuickRefItem[] = [
    { name: 'AddAntiforgery()',                   type: 'method',   desc: 'Registers antiforgery services. Called automatically when AddControllersWithViews() is used.' },
    { name: '[ValidateAntiForgeryToken]',          type: 'decorator',desc: 'Validates the antiforgery token on a controller action (POST/PUT/DELETE).' },
    { name: '[AutoValidateAntiforgeryToken]',      type: 'decorator',desc: 'Applies [ValidateAntiForgeryToken] to all non-GET actions on a controller.' },
    { name: '[IgnoreAntiforgeryToken]',            type: 'decorator',desc: 'Opts an action out of antiforgery validation (e.g., webhooks).' },
    { name: 'IAntiforgery',                        type: 'interface','desc': 'Service to generate and validate tokens manually in APIs or middleware.' },
    { name: 'GetAndStoreTokens(context)',          type: 'method',   desc: 'Generates tokens and stores the cookie token. Returns RequestToken for forms.' },
    { name: 'ValidateRequestAsync(context)',       type: 'method',   desc: 'Manually validates the antiforgery token — use in middleware or API endpoints.' },
    { name: 'SameSite = SameSiteMode.Strict',      type: 'keyword',  desc: 'Cookie attribute that prevents the browser sending cookies on cross-site requests.' },
    { name: 'AntiforgeryMiddleware',               type: 'class',    desc: '.NET 8+ middleware that auto-validates antiforgery for all non-GET endpoints.' },
    { name: 'WithRequireAntiforgery()',            type: 'method',   desc: 'Minimal API extension (.NET 8+) to require antiforgery on an endpoint.' },
  ];

  theory: TheoryPoint[] = [
    {
      heading: 'What is CSRF?',
      points: ['Cross-Site Request Forgery (CSRF) tricks a logged-in user\'s browser into sending a forged request to your app. Because the browser automatically includes cookies with every request, a malicious page can submit forms or trigger API calls on behalf of the victim without them knowing.'],
    },
    {
      heading: 'ASP.NET Antiforgery Tokens',
      points: ['ASP.NET Core\'s antiforgery system uses a double-submit pattern: a cryptographic token is stored in a cookie AND embedded in the form or request header. On each state-changing request, the server checks that both tokens match. A cross-site attacker cannot read the cookie, so they cannot reproduce the pair.'],
    },
    {
      heading: 'SameSite Cookies',
      points: ['Setting SameSite=Strict (or Lax) on session cookies prevents browsers from sending them on cross-origin requests. This is a defence-in-depth measure — modern browsers enforce SameSite by default. However, it should complement, not replace, server-side antiforgery token validation.'],
    },
    {
      heading: 'CSRF and SPA / API Scenarios',
      points: ['REST APIs that use Bearer tokens in Authorization headers are not vulnerable to CSRF — browsers do not auto-send custom headers on cross-origin requests. CSRF is only a concern when state is carried in cookies. If your API uses cookie authentication (e.g., ASP.NET Identity with cookie middleware), you need antiforgery protection.'],
    },
    {
      heading: '.NET 8+ Antiforgery Middleware',
      points: ['.NET 8 introduced UseAntiforgery() middleware and WithRequireAntiforgery() for minimal APIs. This auto-validates tokens on all non-GET/HEAD/OPTIONS requests without needing [ValidateAntiForgeryToken] on every action. The token can be sent via a form field, X-CSRF-TOKEN header, or request body.'],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'MVC Setup',
      language: 'csharp',
      code: `// Program.cs — antiforgery is added automatically with AddControllersWithViews()
builder.Services.AddControllersWithViews();
builder.Services.AddAntiforgery(options =>
{
    options.HeaderName = "X-CSRF-TOKEN"; // allow token via header (for AJAX)
    options.Cookie.Name = "__RequestVerificationToken";
    options.Cookie.SameSite = SameSiteMode.Strict;
});

// Controller
[HttpPost]
[ValidateAntiForgeryToken]
public IActionResult Submit(OrderViewModel model) { /* ... */ }

// Apply to all non-GET on a controller
[AutoValidateAntiforgeryToken]
public class OrderController : Controller { }

// Opt out (e.g., public webhook)
[HttpPost]
[IgnoreAntiforgeryToken]
public IActionResult Webhook([FromBody] WebhookPayload payload) { /* ... */ }`,
    },
    {
      label: 'Razor Form Token',
      language: 'csharp',
      code: `@* Razor automatically injects the token with asp-controller/asp-action *@
<form asp-controller="Order" asp-action="Submit" method="post">
    @Html.AntiForgeryToken()
    <input name="ProductId" type="hidden" value="42" />
    <button type="submit">Place Order</button>
</form>

@* For AJAX requests — embed token in meta tag and read in JS *@
<meta name="csrf-token" content="@antiforgery.GetAndStoreTokens(HttpContext).RequestToken" />

@* JavaScript *@
const token = document.querySelector('meta[name="csrf-token"]').content;
fetch('/api/orders', {
  method: 'POST',
  headers: { 'X-CSRF-TOKEN': token, 'Content-Type': 'application/json' },
  body: JSON.stringify(payload)
});`,
    },
    {
      label: 'Minimal API (.NET 8+)',
      language: 'csharp',
      code: `// Program.cs
builder.Services.AddAntiforgery();
var app = builder.Build();

app.UseAntiforgery(); // validates tokens on non-GET requests

// Endpoint that requires an antiforgery token
app.MapPost("/orders", (OrderRequest req) => Results.Ok())
   .WithRequireAntiforgery();

// Generate a token for client-side use
app.MapGet("/antiforgery/token", (IAntiforgery antiforgery, HttpContext ctx) =>
{
    var tokens = antiforgery.GetAndStoreTokens(ctx);
    return Results.Ok(new { token = tokens.RequestToken });
});`,
    },
    {
      label: 'Manual Validation',
      language: 'csharp',
      code: `// Validate manually in middleware or a service
public class AntiforgeryMiddleware(RequestDelegate next)
{
    public async Task InvokeAsync(HttpContext ctx, IAntiforgery antiforgery)
    {
        if (HttpMethods.IsPost(ctx.Request.Method) ||
            HttpMethods.IsPut(ctx.Request.Method) ||
            HttpMethods.IsDelete(ctx.Request.Method))
        {
            try { await antiforgery.ValidateRequestAsync(ctx); }
            catch (AntiforgeryValidationException)
            {
                ctx.Response.StatusCode = 400;
                await ctx.Response.WriteAsync("Invalid antiforgery token.");
                return;
            }
        }
        await next(ctx);
    }
}`,
    },
    {
      label: 'SameSite Cookie Config',
      language: 'csharp',
      code: `builder.Services.ConfigureApplicationCookie(options =>
{
    options.Cookie.SameSite  = SameSiteMode.Strict;
    options.Cookie.SecurePolicy = CookieSecurePolicy.Always;
    options.Cookie.HttpOnly  = true;   // not accessible via JavaScript
    options.Cookie.Name      = ".MyApp.Auth";
    options.ExpireTimeSpan   = TimeSpan.FromHours(8);
    options.SlidingExpiration = true;
});`,
    },
  ];

  mistakes: CommonMistake[] = [
    {
      title: 'Assuming Bearer-token APIs need antiforgery',
      wrong: `// Adding [ValidateAntiForgeryToken] to a JWT API endpoint
[HttpPost, ValidateAntiForgeryToken]
public IActionResult CreateOrder([FromBody] OrderRequest req) { }`,
      right: `// Bearer APIs are not CSRF-vulnerable — no antiforgery needed
[HttpPost, Authorize]
public IActionResult CreateOrder([FromBody] OrderRequest req) { }`,
      explanation: 'CSRF only affects cookie-based auth. APIs using Authorization: Bearer tokens are safe because browsers cannot add custom headers on cross-origin requests.',
    },
    {
      title: 'Using GET endpoints for state changes',
      wrong: `// CSRF attack can trigger this via an <img> tag
app.MapGet("/account/delete", (int id) => db.Delete(id));`,
      right: `app.MapDelete("/account/{id}", (int id) => db.Delete(id));`,
      explanation: 'GET requests are not protected by antiforgery. Any state-changing operation must use POST, PUT, or DELETE to be covered by CSRF protection.',
    },
    {
      title: 'Forgetting UseAntiforgery() before endpoint mapping',
      wrong: `app.MapPost("/orders", Handler).WithRequireAntiforgery();
app.UseAntiforgery(); // too late — middleware order matters`,
      right: `app.UseAntiforgery(); // before endpoint mapping
app.MapPost("/orders", Handler).WithRequireAntiforgery();`,
      explanation: 'Middleware executes in registration order. UseAntiforgery() must be called before MapPost/MapPut etc. to intercept the request in time.',
    },
    {
      title: 'Sending the antiforgery token in a cookie only',
      wrong: `// Sending the token back in the same cookie as the session
// An attacker who can read cookies can bypass the check`,
      right: `// Token must travel in TWO channels: cookie + form field or header
// The server verifies BOTH match — the attacker cannot set the header`,
      explanation: 'The security of antiforgery relies on the double-submit pattern. If the token only lives in a cookie, a same-site subdomain compromise can bypass it.',
    },
  ];

  challenge: Challenge = {
    title: 'Protect a Form Submission',
    language: 'csharp',
    description: `Configure antiforgery protection for a minimal API that handles form submissions:
1. Register antiforgery services and middleware.
2. Add a GET /antiforgery/token endpoint that returns a token for the client.
3. Add a POST /feedback endpoint that requires a valid antiforgery token.
4. The POST handler should return 200 with the submitted message.`,
    hints: [
      'Call builder.Services.AddAntiforgery() and app.UseAntiforgery()',
      'Use IAntiforgery.GetAndStoreTokens(ctx) to generate the token',
      'Use .WithRequireAntiforgery() on the POST endpoint',
    ],
    starterCode: `var builder = WebApplication.CreateBuilder(args);
// TODO: register antiforgery

var app = builder.Build();
// TODO: add antiforgery middleware

// TODO: GET /antiforgery/token

// TODO: POST /feedback with antiforgery requirement`,
    solution: `builder.Services.AddAntiforgery();

var app = builder.Build();
app.UseAntiforgery();

app.MapGet("/antiforgery/token", (IAntiforgery af, HttpContext ctx) =>
{
    var tokens = af.GetAndStoreTokens(ctx);
    return Results.Ok(new { token = tokens.RequestToken });
});

app.MapPost("/feedback", ([FromForm] string message) =>
    Results.Ok(new { received = message }))
   .WithRequireAntiforgery()
   .DisableAntiforgery(); // remove this line in real code — for compilation only`,
  };

  quiz: QuizQuestion[] = [
    {
      q: 'CSRF attacks are possible because browsers automatically send what with every request?',
      options: ['Authorization headers', 'Cookies', 'Custom headers', 'Request bodies'],
      answer: 1,
      explanation: 'Browsers automatically attach cookies to every request to the cookie\'s domain, including forged cross-site requests — this is the root cause of CSRF.',
    },
    {
      q: 'Which attribute applies [ValidateAntiForgeryToken] to all non-GET actions in a controller?',
      options: ['[ValidateAll]', '[AntiforgeryFilter]', '[AutoValidateAntiforgeryToken]', '[CsrfProtect]'],
      answer: 2,
      explanation: '[AutoValidateAntiforgeryToken] automatically validates tokens on POST, PUT, PATCH, and DELETE actions in the controller without needing individual attributes.',
    },
    {
      q: 'Why do Bearer token APIs NOT need CSRF protection?',
      options: [
        'JWT tokens expire quickly',
        'Browsers cannot auto-send Authorization headers on cross-origin requests',
        'Bearer tokens are encrypted',
        'APIs use HTTPS which prevents CSRF',
      ],
      answer: 1,
      explanation: 'Cross-origin requests from a malicious site cannot include custom headers like Authorization. Only cookies are auto-attached, so Bearer-token APIs are not CSRF-vulnerable.',
    },
    {
      q: 'What does SameSite=Strict on a session cookie do?',
      options: [
        'Encrypts the cookie value',
        'Prevents the cookie being sent on cross-site requests',
        'Makes the cookie HTTP-only',
        'Limits the cookie to HTTPS connections',
      ],
      answer: 1,
      explanation: 'SameSite=Strict tells the browser to never send the cookie on cross-site requests — a strong defence against CSRF, though it can break some legitimate cross-site flows.',
    },
    {
      q: 'In the double-submit CSRF pattern, where does the token need to travel?',
      options: [
        'Only in a cookie',
        'Only in a form field',
        'In both a cookie AND a form field or request header',
        'Only in the Authorization header',
      ],
      answer: 2,
      explanation: 'The double-submit pattern sends the token in a cookie and in a second channel (form field or header). The server verifies they match — an attacker who cannot read the cookie cannot forge the second copy.',
    },
    {
      q: 'A CSRF token is embedded in a form. What is the most important security property it must have?',
      options: [
        'It must be the same for all users to reduce server storage',
        'It must be short (< 16 bytes) to reduce request size',
        'It must be unpredictable and unique per session or request so an attacker cannot guess it',
        'It must expire within 60 seconds to limit the attack window',
      ],
      answer: 2,
      explanation: 'A CSRF token\'s security relies entirely on it being secret and unpredictable. ASP.NET Core generates cryptographically random tokens tied to the session. If the token were predictable (e.g., a timestamp), an attacker could forge a valid request without needing to read the cookie.',
    },
  ];

  qna: QnaItem[] = [
    {
      q: 'Do I need CSRF protection for a React/Angular SPA that calls a separate API?',
      a: 'Only if the API uses cookie authentication. If the SPA uses Bearer tokens in the Authorization header, you do not need antiforgery. If it uses HttpOnly cookie auth (e.g., BFF pattern), you do — use the IAntiforgery service to generate a token and send it in a custom header.',
    },
    {
      q: 'What is the BFF (Backend For Frontend) pattern and how does CSRF apply?',
      a: 'In the BFF pattern, an ASP.NET Core host acts as a secure intermediary — the SPA authenticates via cookies with the BFF, which in turn calls downstream APIs with Bearer tokens. Because the SPA-to-BFF channel uses cookies, it needs antiforgery protection. The BFF-to-API channel with Bearer tokens does not.',
    },
    {
      q: 'Can I generate antiforgery tokens in a Blazor WebAssembly app?',
      a: 'Yes. For Blazor WASM calling a cookie-authenticated API, fetch a token from a dedicated endpoint (/antiforgery/token), store it in JS/memory, and include it in subsequent requests via the X-CSRF-TOKEN header.',
    },
    {
      q: 'Is SameSite=Strict enough on its own without antiforgery tokens?',
      a: 'It provides strong protection in modern browsers but is not sufficient alone. Older browsers may not enforce SameSite. Sub-domain attacks can still work if a sub-domain is compromised. Defence in depth means using both SameSite cookies AND antiforgery tokens.',
    },
    {
      q: 'How do I handle CSRF protection in an Angular SPA that uses cookie-based auth (BFF pattern)?',
      a: 'Angular\'s HttpClient can automatically read a CSRF cookie and add it as a header using HttpClientXsrfModule.withOptions({ cookieName: "XSRF-TOKEN", headerName: "X-XSRF-TOKEN" }). In ASP.NET Core, call services.AddAntiforgery(o => { o.HeaderName = "X-XSRF-TOKEN"; o.Cookie.Name = "XSRF-TOKEN"; }) and generate the token on the first request (e.g., in a middleware). Angular reads the cookie automatically and sends the header on subsequent mutating requests.',
    },
    {
      q: 'What is the Synchronizer Token Pattern and how does it differ from the Double Submit Cookie Pattern?',
      a: 'In the Synchronizer Token Pattern, the server generates a token per session, stores it server-side, embeds it in forms/responses, and verifies it on the next request — the server has ground truth. In the Double Submit Cookie Pattern, the server generates a token but stores it only in a cookie (not server-side), and the client echoes it in a header/form field. The server just checks they match — no server-side state needed, better for stateless/distributed APIs.',
    },
  ];

  revision: RevisionSummary = {
    oneLiner: 'CSRF exploits cookie auto-attachment; ASP.NET combats it with double-submit antiforgery tokens plus SameSite cookies.',
    mustKnow: [
      'CSRF only affects cookie-based auth — Bearer token APIs are not vulnerable',
      'Double-submit: token in cookie + form field/header; server verifies both match',
      '[ValidateAntiForgeryToken] on actions; [AutoValidateAntiforgeryToken] on controllers',
      '.NET 8+: UseAntiforgery() middleware + .WithRequireAntiforgery() on minimal API endpoints',
      'SameSite=Strict/Lax on cookies as defence-in-depth — does not replace token validation',
      'GET endpoints must never perform state changes — antiforgery does not protect GETs',
    ],
    interviewFocus: [
      'How does a CSRF attack work mechanically?',
      'Why are Bearer token APIs immune to CSRF while cookie auth APIs are not?',
      'Explain the double-submit cookie pattern and why it works',
      'SameSite vs antiforgery tokens — defence in depth strategy',
    ],
  };
}
