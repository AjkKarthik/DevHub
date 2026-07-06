import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-testing-forwardedheaders-trust-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
    TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './testing-forwardedheaders-trust-configuration-rejects-spoofed-ips.html',
  styleUrl: './testing-forwardedheaders-trust-configuration-rejects-spoofed-ips.scss',
})
export class TestingForwardedheadersTrustConfigurationRejectsSpoofedIpsSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page\'s own Common Mistake warns that clearing KnownNetworks/KnownProxies without adding trusted entries lets an attacker spoof X-Forwarded-For — but shows no test proving the CORRECT configuration actually rejects that spoof, which is precisely the kind of security-critical behavior that should never be trusted by code review alone',
      points: [
        'A <code>WebApplicationFactory</code> integration test can send a raw HTTP request with a forged <code>X-Forwarded-For</code> header directly, then read <code>HttpContext.Connection.RemoteIpAddress</code> back from a test endpoint to see what the middleware actually resolved. Since <code>TestServer</code> connections don\'t come through a real TCP socket, the test must ALSO set the connection\'s remote IP to a KNOWN, trusted-or-untrusted value first — usually via a custom middleware or a <code>TestServer</code> feature — to accurately simulate "request arriving from this specific proxy IP."',
        'The test needs TWO scenarios to be meaningful: (1) the request arrives from a TRUSTED proxy IP (inside <code>KnownNetworks</code>) carrying a forwarded header — the middleware SHOULD honor it, resolving <code>RemoteIpAddress</code> to the forwarded value; (2) the request arrives from an UNTRUSTED IP carrying the SAME forwarded header — the middleware should IGNORE it, leaving <code>RemoteIpAddress</code> as the untrusted connecting IP. Testing only scenario 1 (the "happy path") never proves the spoofing protection actually works — the main page\'s Common Mistake is precisely a failure of scenario 2.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'A test endpoint exposing the resolved IP, and a way to simulate the connecting IP',
      language: 'csharp',
      code: `// Test-only endpoint added via ConfigureTestServices — exposes exactly
// what the middleware resolved, for assertion purposes:
public class TestWebApp : WebApplicationFactory<Program>
{
    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.Configure(app =>
        {
            // Middleware to STAND IN for "the TCP connection actually
            // came from this IP" — TestServer has no real socket, so
            // this simulates what a real reverse proxy connection
            // would look like before ForwardedHeaders processes it:
            app.Use(async (ctx, next) =>
            {
                if (ctx.Request.Headers.TryGetValue("X-Simulated-Remote-Ip", out var ip))
                    ctx.Connection.RemoteIpAddress = IPAddress.Parse(ip!);
                await next();
            });

            app.UseForwardedHeaders();   // the middleware under test

            app.Run(ctx => ctx.Response.WriteAsync(
                ctx.Connection.RemoteIpAddress?.ToString() ?? "null"));
        });

        builder.ConfigureServices(services =>
        {
            services.Configure<ForwardedHeadersOptions>(opts =>
            {
                opts.ForwardedHeaders = ForwardedHeaders.XForwardedFor;
                opts.KnownNetworks.Clear();
                opts.KnownProxies.Clear();
                // ONLY this CIDR is trusted — matches the main page's
                // own correctly-configured example:
                opts.KnownNetworks.Add(new IPNetwork(IPAddress.Parse("10.0.0.0"), 8));
            });
        });
    }
}`,
    },
    {
      label: 'The two tests that actually prove the security boundary',
      language: 'csharp',
      code: `[Fact]
public async Task ForwardedFor_Is_Honored_When_Connection_Is_From_TrustedProxy()
{
    await using var app = new TestWebApp();
    var client = app.CreateClient();

    var request = new HttpRequestMessage(HttpMethod.Get, "/");
    request.Headers.Add("X-Simulated-Remote-Ip", "10.0.0.5");   // TRUSTED — inside 10.0.0.0/8
    request.Headers.Add("X-Forwarded-For", "203.0.113.42");     // the "real" client, per the proxy

    var response = await client.SendAsync(request);
    var resolvedIp = await response.Content.ReadAsStringAsync();

    // The forwarded value IS trusted and applied — this is the
    // INTENDED behavior for a request genuinely from your proxy:
    Assert.Equal("203.0.113.42", resolvedIp);
}

[Fact]
public async Task ForwardedFor_Is_Ignored_When_Connection_Is_From_UntrustedSource()
{
    await using var app = new TestWebApp();
    var client = app.CreateClient();

    var request = new HttpRequestMessage(HttpMethod.Get, "/");
    request.Headers.Add("X-Simulated-Remote-Ip", "198.51.100.7");  // UNTRUSTED — outside 10.0.0.0/8
    request.Headers.Add("X-Forwarded-For", "127.0.0.1");            // attacker-forged value

    var response = await client.SendAsync(request);
    var resolvedIp = await response.Content.ReadAsStringAsync();

    // THIS is the assertion that actually proves the spoofing
    // protection the main page's Common Mistake warns about — the
    // forged header must be IGNORED, leaving the real (untrusted)
    // connecting IP as the resolved value:
    Assert.Equal("198.51.100.7", resolvedIp);
    Assert.NotEqual("127.0.0.1", resolvedIp);
}
// Running BOTH tests against the main page's OWN "wrong" example
// (KnownNetworks.Clear() with nothing added back) would show the
// SECOND test failing — resolvedIp would incorrectly become
// "127.0.0.1", proving the vulnerability concretely rather than
// just asserting it exists in prose.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A reviewer argues the second test (untrusted source) is unnecessary — "if the first test proves KnownNetworks correctly restricts to 10.0.0.0/8, logically anything outside that range must be rejected, so testing the rejection case is redundant." Explain precisely why this logical argument does not actually hold for testing purposes, tying it back to the exact bug the main page\'s Common Mistake describes.',
    hint: 'The main page\'s WRONG example doesn\'t use a DIFFERENT (incorrect) CIDR range — it calls .Clear() and adds NOTHING. Does the first test (proving a CORRECTLY-configured trusted range works) exercise the SAME code path that\'s broken in the main page\'s mistake at all?',
    solution: `The reviewer's argument treats "restricts to 10.0.0.0/8" and "rejects
everything outside 10.0.0.0/8" as logically equivalent, but they are
only equivalent if the CONFIGURATION actually has a restriction in
place at all — and the main page's exact bug is a configuration where
NO restriction exists (KnownNetworks.Clear() called with nothing added
afterward). The first test alone cannot distinguish "the middleware
correctly restricts to 10.0.0.0/8" from "the middleware happens to
also accept 10.0.0.0/8 because it currently accepts EVERYTHING" — both
configurations produce an IDENTICAL passing result for a request that
arrives from inside 10.0.0.0/8, since a same request would be honored
either way.

Only the SECOND test — sending a request from OUTSIDE the trusted
range and confirming the forwarded header gets ignored — actually
exercises the code path that distinguishes "properly restricted" from
"accepts everything," which is exactly where the main page's
regression lives. If someone accidentally reverts the KnownNetworks
configuration back to the vulnerable state (calls .Clear() and forgets
to re-add the CIDR, perhaps during an unrelated refactor), the FIRST
test still passes unchanged — a request from 10.0.0.0/8 is still
honored, because it always would be, restricted or not. Only the
SECOND test catches the regression, because only it depends on
requests from OUTSIDE the trusted range being rejected.

This mirrors a lesson from the earlier ASP.NET Core Web Security
subtopic on antiforgery testing: a security control is only verified
by a test that specifically exercises the FAILURE path the control
is meant to enforce. A test proving "the trusted case works" says
nothing about whether untrusted input is actually rejected — those
are two independent claims requiring two independent tests, and
skipping the rejection test provides zero protection against exactly
the regression class the main page's own Common Mistake describes.`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'a test proving that a request from a KNOWN, trusted proxy IP correctly gets its X-Forwarded-For header honored is sufficient to prove the ForwardedHeaders configuration is secure against IP spoofing.',
      reality: 'that test alone cannot distinguish "correctly restricted to the trusted range" from "accepts forwarded headers from anywhere, which happens to include the trusted range" — only a SEPARATE test proving a request from an UNTRUSTED source has its forwarded header ignored actually exercises the code path where the main page\'s own spoofing vulnerability lives.',
    },
    {
      thought: 'testing ForwardedHeadersOptions configuration requires a real reverse proxy and a real network setup, since it depends on IP addresses and network topology.',
      reality: 'a WebApplicationFactory-based test can simulate the connecting IP directly (via a test-only middleware setting HttpContext.Connection.RemoteIpAddress before ForwardedHeaders processes the request) and assert on the resolved IP afterward — no real proxy, container, or network configuration is needed.',
    },
    {
      thought: 'if a configuration correctly restricts a specific trusted CIDR range and a test confirms behavior for an IP inside that range, the security boundary is proven.',
      reality: 'security-critical restrictions are only proven by testing the REJECTION path — a request from outside the trusted range with a forged header must be shown to have that header ignored; testing only the acceptance path provides no signal about whether any restriction exists at all.',
    },
  ];
}
