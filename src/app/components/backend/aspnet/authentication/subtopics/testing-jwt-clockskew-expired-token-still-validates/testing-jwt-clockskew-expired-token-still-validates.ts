import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-testing-jwt-clockskew-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
    TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './testing-jwt-clockskew-expired-token-still-validates.html',
  styleUrl: './testing-jwt-clockskew-expired-token-still-validates.scss',
})
export class TestingJwtClockskewExpiredTokenStillValidatesSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page states the fact in one sentence — "the default 5-minute skew means a token can be valid up to 5 minutes past its stated exp" — but a 15-minute-token strategy silently becomes a 20-minute one unless someone actually verifies the skew configuration',
      points: [
        'The main Authentication page recommends short 15-minute access tokens specifically to limit the blast radius of a leak, and separately notes that <code>ClockSkew</code> defaults to 5 minutes. Put those two facts together: with the DEFAULT skew, every "15-minute" token is actually accepted for up to 20 minutes — a 33% extension of the exposure window the short-TTL strategy was designed to bound. The page\'s own JWT setup example sets <code>ClockSkew = TimeSpan.FromSeconds(30)</code>, but that line is easy to drop in a copy-paste, and NOTHING fails when it is missing — validation just quietly becomes more permissive.',
      ],
    },
    {
      heading: 'Token lifetime validation is pure, in-process logic — JwtSecurityTokenHandler.ValidateToken with hand-built TokenValidationParameters tests it deterministically, no server, no HTTP, no waiting for real time to pass',
      points: [
        'Because the validator compares the token\'s <code>exp</code> claim against the current time PLUS the configured skew, a test can mint a token whose expiry is already in the past (e.g., expired 2 minutes ago) and validate it TWICE — once with the default parameters (expect SUCCESS, the surprising case) and once with <code>ClockSkew = TimeSpan.Zero</code> (expect <code>SecurityTokenExpiredException</code>). The pair of assertions turns the page\'s one-sentence remark into an executable specification: the first test documents the default\'s real behavior, the second proves the production configuration actually tightens it.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'The test pair — an already-expired token passes with default skew and fails with zero skew',
      language: 'csharp',
      code: `public class JwtClockSkewTests
{
    private static readonly SymmetricSecurityKey Key =
        new(Encoding.UTF8.GetBytes("test-signing-key-at-least-256-bits-long!"));

    private static string MintToken(DateTime expires)
    {
        var token = new JwtSecurityToken(
            issuer: "https://myapp",
            audience: "myapp-api",
            claims: [new Claim(ClaimTypes.Name, "alice")],
            notBefore: expires.AddMinutes(-15),
            expires: expires,
            signingCredentials: new SigningCredentials(Key, SecurityAlgorithms.HmacSha256));
        return new JwtSecurityTokenHandler().WriteToken(token);
    }

    private static TokenValidationParameters Parameters(TimeSpan? clockSkew = null) => new()
    {
        ValidateIssuer = true,           ValidIssuer = "https://myapp",
        ValidateAudience = true,         ValidAudience = "myapp-api",
        ValidateLifetime = true,
        ValidateIssuerSigningKey = true, IssuerSigningKey = Key,
        // When 'clockSkew' is null, we deliberately DON'T set the
        // property — leaving the library default in force, which is
        // exactly what a copy-paste that dropped the ClockSkew line
        // would do:
        ClockSkew = clockSkew ?? TokenValidationParameters.DefaultClockSkew,
    };

    [Fact]
    public void TokenExpiredTwoMinutesAgo_STILL_VALIDATES_WithDefaultSkew()
    {
        var expiredToken = MintToken(expires: DateTime.UtcNow.AddMinutes(-2));

        // THE SURPRISE, asserted: exp is 2 minutes in the past, yet
        // validation SUCCEEDS, because the default 5-minute skew means
        // the effective cutoff is exp + 5 minutes:
        var principal = new JwtSecurityTokenHandler().ValidateToken(
            expiredToken, Parameters(), out _);

        Assert.Equal("alice", principal.Identity!.Name);
        // A "15-minute token" under this configuration is really a
        // 20-minute token — the exact silent widening this test exists
        // to make visible.
    }

    [Fact]
    public void TokenExpiredTwoMinutesAgo_IsRejected_WithZeroSkew()
    {
        var expiredToken = MintToken(expires: DateTime.UtcNow.AddMinutes(-2));

        // With ClockSkew explicitly zeroed (or set to the main page's
        // recommended 30 seconds), the same token is correctly dead:
        Assert.Throws<SecurityTokenExpiredException>(() =>
            new JwtSecurityTokenHandler().ValidateToken(
                expiredToken, Parameters(TimeSpan.Zero), out _));
    }
}`,
    },
    {
      label: 'Locking the production configuration itself — asserting on the app\'s REAL JwtBearerOptions, not a test-local copy',
      language: 'csharp',
      code: `// The tests in the previous tab validate the CONCEPT with locally
// constructed parameters — but the copy-paste regression they guard
// against lives in Program.cs. This test reads the ACTUAL configured
// options out of the app's own DI container, so dropping the ClockSkew
// line in Program.cs fails a test even though nothing else changed:

public class JwtConfigurationTests : IClassFixture<WebApplicationFactory<Program>>
{
    private readonly WebApplicationFactory<Program> _factory;
    public JwtConfigurationTests(WebApplicationFactory<Program> factory)
        => _factory = factory;

    [Fact]
    public void ProductionJwtOptions_UseTightClockSkew_NotTheFiveMinuteDefault()
    {
        // IOptionsMonitor<JwtBearerOptions> holds the options exactly as
        // Program.cs configured them — .Get(scheme) retrieves the named
        // instance for the Bearer scheme:
        var options = _factory.Services
            .GetRequiredService<IOptionsMonitor<JwtBearerOptions>>()
            .Get(JwtBearerDefaults.AuthenticationScheme);

        var skew = options.TokenValidationParameters.ClockSkew;

        Assert.True(skew <= TimeSpan.FromSeconds(30),
            $"ClockSkew is {skew} — expected 30s or less. The ClockSkew " +
            "line in Program.cs may have been dropped, silently widening " +
            "every access token's real lifetime by 5 minutes.");

        // While reading the real options, also pin the other
        // validations the main page calls non-negotiable — each of
        // these is an independent one-line regression waiting to happen:
        Assert.True(options.TokenValidationParameters.ValidateLifetime);
        Assert.True(options.TokenValidationParameters.ValidateIssuer);
        Assert.True(options.TokenValidationParameters.ValidateAudience);
    }
}

// WHY BOTH LAYERS: the behavioral tests (previous tab) prove WHAT the
// skew does — useful once, as executable documentation. The
// configuration test (this tab) proves YOUR app still has the tight
// setting — useful forever, as a regression guard on a single line of
// Program.cs that no compiler or reviewer reliably notices.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'ClockSkew is applied to the notBefore (nbf) claim as well as exp. Predict what the skew means for a token whose nbf is 2 minutes in the FUTURE (e.g., minted by a server whose clock runs ahead), under default skew versus zero skew — and explain which of the two directions (early acceptance vs late acceptance) is the one that actually motivated the skew existing at all.',
    hint: 'Skew is a tolerance for clock DISAGREEMENT between the issuing server and the validating server. Work through both boundaries: validation passes while (now + skew) >= nbf and (now - skew) <= exp... or is it the other way around? Think about which side of each comparison the skew pads.',
    solution: `With the default 5-minute skew, a token whose nbf (not-before) is 2
minutes in the FUTURE validates successfully RIGHT NOW: the validator
accepts a token as "already valid" if its nbf is no more than the skew
ahead of the current time. With ClockSkew = TimeSpan.Zero, the same
token is rejected with SecurityTokenNotYetValidException until the nbf
moment actually arrives.

So the skew pads BOTH boundaries outward:
  - exp side: accepted until (exp + skew)   → late acceptance
  - nbf side: accepted from  (nbf - skew)   → early acceptance

The direction that motivated the feature is exactly this
clock-disagreement scenario: in a distributed system, the ISSUER's
clock and the VALIDATOR's clock are never perfectly synchronized. A
validator whose clock runs 90 seconds behind the issuer would — with
zero skew — reject every freshly minted token as "not yet valid"
(its nbf appears to be in the future), a total outage triggered by
nothing but clock drift. The skew exists to absorb that drift so
well-behaved infrastructure with imperfect NTP does not reject valid
traffic.

The security-relevant asymmetry worth internalizing: the nbf-side
padding protects AVAILABILITY (fresh tokens work despite drift) at
essentially no security cost, while the exp-side padding costs
SECURITY (a leaked token stays usable past its stated expiry) for the
same availability benefit. That is why the main page's recommendation
lands where it does — 30 seconds, not zero and not the 5-minute
default: enough to absorb realistic NTP-managed drift in both
directions, small enough that the exp-side extension is negligible
against a 15-minute token lifetime. Zero skew is appropriate mainly in
TESTS (where issuer and validator share one clock, and you want exact
expiry behavior to be observable), which is exactly where the main
page's own challenge uses it.`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'a JWT with ValidateLifetime = true is rejected the moment the current time passes its exp claim.',
      reality: 'the validator accepts the token until exp PLUS the configured ClockSkew — and the library default is 5 minutes, so an unconfigured validator accepts a "15-minute" token for up to 20 minutes; only an explicit ClockSkew setting tightens this.',
    },
    {
      thought: 'ClockSkew only affects expiry — it has no bearing on when a token BECOMES valid.',
      reality: 'the skew pads both boundaries: a token is accepted from (nbf minus skew) until (exp plus skew) — which is precisely why it exists, since a validator whose clock runs behind the issuer would otherwise reject every freshly minted token as not-yet-valid.',
    },
    {
      thought: 'behavioral tests proving what ClockSkew does are sufficient protection against the copy-paste regression of dropping the ClockSkew line from Program.cs.',
      reality: 'behavioral tests validate locally constructed parameters, not the app\'s real configuration — a separate test that resolves IOptionsMonitor<JwtBearerOptions> from the actual DI container and asserts on the configured skew is what catches the Program.cs regression itself.',
    },
  ];
}
