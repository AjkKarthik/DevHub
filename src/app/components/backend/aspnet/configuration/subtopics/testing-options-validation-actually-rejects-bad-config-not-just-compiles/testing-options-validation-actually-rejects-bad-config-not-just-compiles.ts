import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-testing-options-validation-rejects-bad-config-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
    TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './testing-options-validation-actually-rejects-bad-config-not-just-compiles.html',
  styleUrl: './testing-options-validation-actually-rejects-bad-config-not-just-compiles.scss',
})
export class TestingOptionsValidationActuallyRejectsBadConfigNotJustCompilesSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page\'s own JwtOptionsValidator is exactly the kind of logic that NEEDS a test — a validator with a bug is worse than no validator at all, since it creates false confidence',
      points: [
        'The main Configuration page shows a custom <code>IValidateOptions&lt;JwtOptions&gt;</code> checking "long-lived tokens must specify an Issuer." Writing this validator is only half the job — a validator with an inverted condition, an off-by-one in a range check, or a typo in a property name STILL COMPILES and STILL RUNS without any build-time signal that it is wrong. The main page\'s own <code>ValidateOnStart()</code> guidance ("fail fast on misconfiguration") only actually protects you if the validation logic ITSELF is correct — an untested validator is a single point of failure that everyone assumes is working.',
      ],
    },
    {
      heading: 'A validator test does not need the real host or real config files — it constructs the options object directly and calls Validate()',
      points: [
        '<code>IValidateOptions&lt;T&gt;.Validate(name, options)</code> is an ordinary interface method taking a plain POCO — a test can construct a <code>JwtOptions</code> instance BY HAND, with whatever specific combination of values it wants to probe, and call <code>Validate</code> directly, asserting on the returned <code>ValidateOptionsResult</code>. This is dramatically faster and more precise than trying to reproduce a specific bad-config scenario through an actual <code>appsettings.json</code> file and a real host startup.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Testing the main page\'s own JwtOptionsValidator directly',
      language: 'csharp',
      code: `using Xunit;

public class JwtOptionsValidatorTests
{
    private readonly JwtOptionsValidator _validator = new();

    [Fact]
    public void Validate_LongExpiryWithoutIssuer_Fails()
    {
        var options = new JwtOptions
        {
            Secret = "a-secret-that-is-at-least-32-characters-long",
            ExpiryMinutes = 120,   // > 60
            Issuer = "",           // missing
        };

        var result = _validator.Validate(name: null, options);

        Assert.True(result.Failed);
        Assert.Contains("Issuer", result.FailureMessage);
        // This test proves the validator's SPECIFIC business rule
        // (long-lived tokens require an Issuer) actually fires for
        // exactly the condition it claims to check — not just that
        // SOME validation exists somewhere.
    }

    [Fact]
    public void Validate_LongExpiryWithIssuer_Succeeds()
    {
        var options = new JwtOptions
        {
            Secret = "a-secret-that-is-at-least-32-characters-long",
            ExpiryMinutes = 120,
            Issuer = "my-app",     // present — should be fine
        };

        var result = _validator.Validate(name: null, options);

        Assert.True(result.Succeeded);
    }

    [Fact]
    public void Validate_ShortExpiryWithoutIssuer_Succeeds()
    {
        // The rule ONLY applies to LONG-lived tokens — a short expiry
        // with no Issuer should NOT trigger the failure. This test
        // proves the validator's CONDITION (ExpiryMinutes > 60) is
        // correctly scoped, not accidentally rejecting every
        // Issuer-less configuration regardless of expiry:
        var options = new JwtOptions
        {
            Secret = "a-secret-that-is-at-least-32-characters-long",
            ExpiryMinutes = 30,
            Issuer = "",
        };

        var result = _validator.Validate(name: null, options);

        Assert.True(result.Succeeded);
    }
}`,
    },
    {
      label: 'Testing DataAnnotations validation end-to-end via a real (but minimal) options pipeline',
      language: 'csharp',
      code: `using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Options;

public class JwtOptionsDataAnnotationsTests
{
    [Fact]
    public void ShortSecret_FailsMinLengthValidation()
    {
        var services = new ServiceCollection();
        services.AddOptions<JwtOptions>()
            .Configure(o =>
            {
                o.Secret = "too-short";   // fails [MinLength(32)]
                o.Issuer = "my-app";
            })
            .ValidateDataAnnotations();

        var provider = services.BuildServiceProvider();
        var options = provider.GetRequiredService<IOptions<JwtOptions>>();

        // Accessing .Value triggers lazy validation — this is the SAME
        // validation ValidateOnStart() would trigger eagerly, just
        // invoked directly by the test instead of waiting for a real
        // host to start:
        var exception = Assert.Throws<OptionsValidationException>(() => options.Value);
        Assert.Contains("Secret", exception.Message);
    }

    [Fact]
    public void ValidSecret_PassesValidation()
    {
        var services = new ServiceCollection();
        services.AddOptions<JwtOptions>()
            .Configure(o =>
            {
                o.Secret = "a-secret-that-is-at-least-32-characters-long";
                o.Issuer = "my-app";
            })
            .ValidateDataAnnotations();

        var provider = services.BuildServiceProvider();
        var options = provider.GetRequiredService<IOptions<JwtOptions>>();

        var exception = Record.Exception(() => options.Value);
        Assert.Null(exception);
    }
}`,
    },
    {
      label: 'Combining BOTH validators — proving they compose correctly, not just individually',
      language: 'csharp',
      code: `[Fact]
public void BothValidators_Combined_ShortSecretIsCaught_EvenWithValidIssuer()
{
    var services = new ServiceCollection();
    services.AddOptions<JwtOptions>()
        .Configure(o =>
        {
            o.Secret = "short";           // fails DataAnnotations [MinLength(32)]
            o.Issuer = "my-app";          // would PASS the custom Issuer rule
            o.ExpiryMinutes = 120;
        })
        .ValidateDataAnnotations();

    // Register the custom validator too — exactly as the main page's
    // own Program.cs does:
    services.AddSingleton<IValidateOptions<JwtOptions>, JwtOptionsValidator>();

    var provider = services.BuildServiceProvider();
    var options = provider.GetRequiredService<IOptions<JwtOptions>>();

    // Even though the CUSTOM validator's specific rule (Issuer required
    // for long expiry) would be satisfied here, the DataAnnotations
    // validator's SEPARATE rule (MinLength on Secret) still fires —
    // this test proves BOTH validators genuinely run and either one
    // failing is enough to reject the configuration, which is easy to
    // assume but worth actually confirming once both are registered
    // together rather than tested in isolation:
    var exception = Assert.Throws<OptionsValidationException>(() => options.Value);
    Assert.Contains("Secret", exception.Message);
}`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A teammate writes a NEW custom validator for <code>DatabaseOptions</code> checking that <code>ConnectionTimeoutSeconds</code> is positive, but accidentally writes <code>if (options.ConnectionTimeoutSeconds > 0) return ValidateOptionsResult.Fail(...)</code> — an inverted condition that fails GOOD config and passes BAD config. Explain why this specific bug is dangerous in production despite the app using <code>ValidateOnStart()</code>, and what test would have caught it immediately.',
    hint: 'Consider what ValidateOnStart() actually guarantees — that validation RUNS at startup — versus what it does NOT guarantee, which is that the validation LOGIC ITSELF is correct. An inverted condition still "runs" and still produces a resolutely wrong verdict.',
    solution: `// The buggy validator — inverted condition:
public class DatabaseOptionsValidator : IValidateOptions<DatabaseOptions>
{
    public ValidateOptionsResult Validate(string? name, DatabaseOptions options)
    {
        if (options.ConnectionTimeoutSeconds > 0)   // BUG: should be <= 0
            return ValidateOptionsResult.Fail("ConnectionTimeoutSeconds must be positive.");

        return ValidateOptionsResult.Success;
    }
}

// WHY THIS IS DANGEROUS DESPITE ValidateOnStart(): ValidateOnStart()
// only guarantees that SOME validation logic RUNS during startup, and
// that a FAILURE result causes the host to refuse to start. It says
// NOTHING about whether the validation logic's VERDICT is actually
// correct. With this inverted condition:
//   - A GOOD config (ConnectionTimeoutSeconds = 30) triggers Fail() —
//     the app REFUSES TO START even though the config is perfectly
//     valid. This might get caught QUICKLY in a dev/staging
//     environment (the app simply won't start at all), which could
//     make the team think the validator is "working" (it fails
//     loudly!) without realizing WHY it's failing is backwards.
//   - A BAD config (ConnectionTimeoutSeconds = -5, or 0) SUCCEEDS
//     validation and the app starts NORMALLY, then fails LATER, in a
//     completely different, harder-to-diagnose way (a connection
//     timeout of 0 or negative causing an immediate, confusing
//     exception the first time the database is actually used) — the
//     ONE guardrail specifically designed to catch this exact bad
//     value at STARTUP TIME never fires, because its own logic is
//     inverted.
//
// THE TEST THAT WOULD HAVE CAUGHT THIS IMMEDIATELY — testing the
// validator DIRECTLY, with both a clearly-good and clearly-bad value,
// exactly as this subtopic's own JwtOptionsValidator tests do:
[Fact]
public void Validate_PositiveTimeout_Succeeds()
{
    var validator = new DatabaseOptionsValidator();
    var result = validator.Validate(null, new DatabaseOptions { ConnectionTimeoutSeconds = 30 });

    Assert.True(result.Succeeded);   // THIS FAILS against the buggy
                                      // validator — 30 is a perfectly
                                      // valid timeout, but the inverted
                                      // condition rejects it, immediately
                                      // revealing the bug in a fast unit
                                      // test, rather than discovering it
                                      // only when the app mysteriously
                                      // refuses to start with valid config
}

[Fact]
public void Validate_NegativeTimeout_Fails()
{
    var validator = new DatabaseOptionsValidator();
    var result = validator.Validate(null, new DatabaseOptions { ConnectionTimeoutSeconds = -5 });

    Assert.True(result.Failed);   // THIS ALSO FAILS against the buggy
                                   // validator — -5 should be rejected,
                                   // but the inverted condition lets it
                                   // silently pass
}
// EITHER of these two tests alone would have caught the inverted
// condition on the very first run — this is exactly why a validator
// needs BOTH a "known good passes" test and a "known bad fails" test,
// not just one or the other.`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'calling ValidateOnStart() is sufficient protection against bad configuration — it guarantees the app catches misconfiguration at startup.',
      reality: 'ValidateOnStart() only guarantees that validation logic RUNS at startup and a failure blocks the host from starting — it says nothing about whether the validation logic itself is correct; a validator with an inverted condition or a typo still "runs" and produces a confidently wrong verdict.',
    },
    {
      thought: 'testing a custom IValidateOptions<T> validator requires spinning up real configuration files and a real host to reproduce specific bad-config scenarios.',
      reality: 'Validate(name, options) is an ordinary method taking a plain POCO — a test can construct that POCO by hand with any specific combination of values and call Validate directly, with no host, no config files, and no DI container required for the validator test itself.',
    },
    {
      thought: 'a validator that "fails loudly" (blocks the app from starting) during initial development testing is proof that the validator is working correctly.',
      reality: 'an inverted condition also fails loudly, just for the OPPOSITE reason — rejecting valid configuration instead of catching invalid configuration — so a validator needs both a known-good-passes test and a known-bad-fails test to actually confirm its logic is correct, not just that it produces SOME verdict.',
    },
  ];
}
