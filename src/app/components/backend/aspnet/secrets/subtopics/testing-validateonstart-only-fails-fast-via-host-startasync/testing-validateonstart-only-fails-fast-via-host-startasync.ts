import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-testing-validateonstart-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
    TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './testing-validateonstart-only-fails-fast-via-host-startasync.html',
  styleUrl: './testing-validateonstart-only-fails-fast-via-host-startasync.scss',
})
export class TestingValidateonstartOnlyFailsFastViaHostStartasyncSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page recommends ValidateOnStart() for "fail fast" configuration validation — but the specific guarantee it provides (failing DURING startup, before any request is served, even if the broken options are never referenced by the code path a quick smoke test happens to exercise) is a TIMING guarantee, not just an error-existence guarantee, and testing it wrong produces a false sense of security',
      points: [
        'Without <code>ValidateOnStart()</code>, a misconfigured options class only throws when SOMETHING actually resolves <code>IOptions&lt;T&gt;.Value</code> for the first time — which could be immediately, or could be much later, the first time a rarely-hit code path actually needs that config. <code>ValidateOnStart()</code> changes WHEN validation happens by registering a hosted service that forces resolution (and therefore validation) of every registered options type during the generic host\'s <code>StartAsync()</code> — BEFORE the host starts accepting requests at all.',
        'This means a test that manually builds a bare <code>ServiceCollection</code> and calls <code>.BuildServiceProvider().GetRequiredService&lt;IOptions&lt;T&gt;&gt;().Value</code> to check "does this throw when config is missing" WILL see the validation exception either way — <code>DataAnnotations</code> validation runs on first resolution regardless of <code>ValidateOnStart()</code>. That kind of test cannot distinguish "validated eagerly at host startup" from "validated lazily whenever code happens to touch it first" — both produce an identical exception, just at a completely different point in the app\'s lifecycle, and the whole value of <code>ValidateOnStart()</code> is specifically that TIMING difference.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'The test that gives a false sense of security — doesn\'t exercise the host lifecycle at all',
      language: 'csharp',
      code: `public class JwtOptions
{
    [Required, MinLength(32)]
    public string Key { get; set; } = "";
}

// THIS test passes whether ValidateOnStart() is present or not — it
// proves DataAnnotations validation runs on first access, but says
// NOTHING about the TIMING guarantee ValidateOnStart() is actually for:
[Fact]
public void MissingKey_Throws_When_Options_Value_Is_Accessed()
{
    var services = new ServiceCollection();
    services.AddOptions<JwtOptions>()
            .Configure(o => o.Key = "")     // deliberately invalid
            .ValidateDataAnnotations();
            // .ValidateOnStart() — commented out; test can't tell either way

    var provider = services.BuildServiceProvider();

    Assert.Throws<OptionsValidationException>(() =>
        provider.GetRequiredService<IOptions<JwtOptions>>().Value);
    // Passes IDENTICALLY with or without ValidateOnStart() — this
    // manually-built ServiceProvider never runs IHost.StartAsync(),
    // so the hosted-service-driven eager validation path is never
    // even reached; the exception here comes purely from
    // IOptionsFactory validating on first .Value access, which
    // happens regardless.
}`,
    },
    {
      label: 'The test that actually proves the TIMING guarantee — via the real host lifecycle',
      language: 'csharp',
      code: `[Fact]
public async Task Host_Fails_At_StartAsync_Before_Serving_Any_Request()
{
    // Build a real generic host with the misconfigured options AND
    // ValidateOnStart() — but deliberately never reference
    // IOptions<JwtOptions> anywhere in a request handler:
    var builder = WebApplication.CreateBuilder();
    builder.Services.AddOptions<JwtOptions>()
        .Configure(o => o.Key = "")       // invalid — too short
        .ValidateDataAnnotations()
        .ValidateOnStart();

    var app = builder.Build();
    app.MapGet("/health", () => "ok");    // never touches JwtOptions

    // The critical assertion: StartAsync() itself throws, BEFORE the
    // app is listening for any request — not "eventually, whenever
    // something needs JwtOptions":
    await Assert.ThrowsAsync<OptionsValidationException>(
        () => app.StartAsync());

    // Contrast: WITHOUT ValidateOnStart(), the exact same broken
    // config would let StartAsync() succeed cleanly, and the app
    // would serve /health (and every other endpoint that never
    // touches JwtOptions) successfully, FOREVER — the misconfiguration
    // is only discovered the first time some OTHER code path resolves
    // IOptions<JwtOptions>, which might be days later in production
    // if that feature is rarely exercised.

    await app.StopAsync();
}

// Using WebApplicationFactory achieves the same proof implicitly —
// its underlying TestServer construction calls the host's StartAsync,
// so a ValidateOnStart() failure surfaces as an exception from the
// FIRST call to CreateClient()/CreateDefaultClient(), not from any
// specific request:
[Fact]
public void Factory_Throws_On_Build_When_ValidateOnStart_Config_Is_Broken()
{
    Assert.Throws<OptionsValidationException>(() =>
    {
        using var factory = new WebApplicationFactory<Program>()
            .WithWebHostBuilder(b => b.ConfigureServices(s =>
                s.AddOptions<JwtOptions>()
                 .Configure(o => o.Key = "")
                 .ValidateDataAnnotations()
                 .ValidateOnStart()));
        factory.CreateClient(); // triggers host startup internally
    });
}`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A CI pipeline runs a quick smoke test that sends one request to GET /health (which never touches JwtOptions) against a deployed instance, and considers the deployment "verified" if that returns 200. The team relies on ValidateOnStart() to catch missing JWT configuration. Explain precisely why this smoke test provides a false sense of security here, and what smoke-test design would actually leverage ValidateOnStart()\'s guarantee.',
    hint: 'Does a 200 from /health tell you anything about whether ValidateOnStart() ran and passed, or does it only tell you the PROCESS itself is running and listening? What has to happen between "the container started" and "the process is listening on the health-check port" for ValidateOnStart() to have already done its job?',
    solution: `The smoke test IS actually meaningful here — but for a subtler reason
than "it directly checks JwtOptions," and understanding why clarifies
what ValidateOnStart() really buys you. If ValidateOnStart() is wired
up correctly, a broken JwtOptions configuration causes StartAsync() to
THROW — which means the process never reaches the point of listening
on any port at all, including the health-check endpoint. A 200 from
/health is therefore indirect but VALID evidence that host startup
(and therefore all ValidateOnStart() validations) succeeded — because
if it hadn't, the process would have crashed before /health could ever
answer anything.

The false sense of security is a DIFFERENT, more specific failure mode:
ValidateOnStart() only validates options types that were EXPLICITLY
registered with .ValidateOnStart() somewhere in the composition root.
If a team adds a NEW options class (say, a payment gateway integration)
and simply forgets to chain .ValidateOnStart() onto its registration —
or forgets to call .ValidateDataAnnotations() at all — that specific
options class is validated NEITHER eagerly at startup NOR necessarily
early at runtime; it only throws (if ever) the first time some code
path actually resolves IOptions<PaymentOptions>.Value, which might be
the first real payment request in production, long after the smoke
test already reported "deployment verified." The health-check-passes
signal is real evidence for options types that ARE wired to
ValidateOnStart() — it says nothing about the ones that were forgotten.

The safer smoke-test design doesn't need to change much: the real fix
is a CODE-LEVEL discipline (a test asserting every IOptions<T>
registration in the composition root also calls ValidateOnStart(), or
a startup convention/analyzer enforcing it) rather than a smoke-test
design change — the smoke test's indirect signal is only as complete
as the registration code actually wiring every options class into the
startup validation path.`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'a unit test that builds a bare ServiceCollection, calls BuildServiceProvider(), and asserts that resolving IOptions<T>.Value throws for invalid configuration proves ValidateOnStart() is working correctly.',
      reality: 'DataAnnotations validation runs on first access to IOptions<T>.Value regardless of whether ValidateOnStart() is configured — that test produces an identical passing result whether ValidateOnStart() is present or absent, because it never exercises the generic host\'s StartAsync() lifecycle where ValidateOnStart()\'s actual timing guarantee is enforced.',
    },
    {
      thought: 'ValidateOnStart() and ValidateDataAnnotations() are essentially the same feature — one just runs "earlier" than the other in some vague sense.',
      reality: 'ValidateDataAnnotations() defines WHAT gets validated (the rules); ValidateOnStart() defines WHEN validation is forced to happen — specifically, eagerly during host startup via a registered hosted service, rather than lazily whenever some code path happens to first resolve the options value, which could be immediate or could be arbitrarily delayed.',
    },
    {
      thought: 'once ValidateOnStart() is configured anywhere in the app, all options classes benefit from the fail-fast startup guarantee automatically.',
      reality: 'ValidateOnStart() must be explicitly chained onto EACH options type\'s own registration — a new options class added later that forgets this call is validated neither eagerly at startup nor necessarily promptly at runtime, only whenever some code path first resolves it, which may be long after a smoke test already reported the deployment healthy.',
    },
  ];
}
