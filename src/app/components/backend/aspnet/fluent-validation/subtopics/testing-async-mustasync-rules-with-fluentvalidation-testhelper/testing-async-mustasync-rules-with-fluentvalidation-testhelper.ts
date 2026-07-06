import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-testing-mustasync-testhelper-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
    TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './testing-async-mustasync-rules-with-fluentvalidation-testhelper.html',
  styleUrl: './testing-async-mustasync-rules-with-fluentvalidation-testhelper.scss',
})
export class TestingAsyncMustasyncRulesWithFluentvalidationTesthelperSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page\'s own Q&A shows testing with raw Validate() + Assert.Contains(result.Errors, e => e.PropertyName == "...") — this works, but FluentValidation ships a PURPOSE-BUILT testing library (FluentValidation.TestHelper) specifically to make these assertions more readable and precise, and the page never demonstrates it, or how to test the async MustAsync rule from its own "Async Validator" example',
      points: [
        '<code>FluentValidation.TestHelper</code>\'s <code>TestValidate(model)</code> (or <code>TestValidateAsync(model)</code> for validators containing async rules) returns a <code>TestValidationResult&lt;T&gt;</code> exposing fluent assertion helpers: <code>.ShouldHaveValidationErrorFor(x => x.Property)</code> and <code>.ShouldNotHaveValidationErrorFor(x => x.Property)</code> — these read the property via the SAME expression syntax as <code>RuleFor()</code> itself, so a rename of the property is caught by the compiler, unlike a string-based <code>e.PropertyName == "CustomerId"</code> check which silently stops matching anything after a rename.',
        'Chaining further assertions off <code>ShouldHaveValidationErrorFor(...)</code> — like <code>.WithErrorMessage("...")</code> or <code>.WithErrorCode("...")</code> — lets a test pin down not just THAT a property failed, but the EXACT message or severity, which the main page\'s own raw <code>Assert.Contains</code> pattern cannot express without manually inspecting each <code>ValidationFailure</code> object\'s properties.',
      ],
    },
    {
      heading: 'Testing the MustAsync rule from the main page\'s own RegisterValidator example specifically requires TestValidateAsync (not the synchronous TestValidate) — and a mocked IUserRepository, since the validator\'s constructor takes it as a dependency, exactly matching the main page\'s own Q&A statement that validators can be constructed directly with mocked dependencies',
      points: [
        'Because <code>RegisterValidator</code> (from the main page\'s own code) takes <code>IUserRepository users</code> in its constructor, a test constructs it the SAME way any other class under test would be — <code>new RegisterValidator(mockRepo)</code> — with a test double controlling exactly what <code>ExistsAsync()</code> returns, letting the test deterministically exercise BOTH the "username taken" and "username available" branches of <code>BeUniqueUsernameAsync</code> without touching a real database.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'TestHelper assertions vs the main page\'s own raw Assert.Contains pattern',
      language: 'csharp',
      code: `// dotnet add package FluentValidation.TestHelper

// The main page's own QnA pattern — works, but string-based and
// doesn't survive a property rename:
[Fact]
public void CreateUserValidator_RawPattern_FailsWhenNameEmpty()
{
    var validator = new CreateUserValidator();
    var result = validator.Validate(new CreateUserRequest { Name = "" });

    Assert.False(result.IsValid);
    Assert.Contains(result.Errors, e => e.PropertyName == "Name");
    // "Name" is a bare string — a rename of the Name property to
    // FullName silently breaks this assertion's intent without any
    // compiler warning; the test would need updating by hand.
}

// THE TESTHELPER PATTERN — expression-based, renames are caught by
// the compiler, and assertions read almost like the RuleFor() itself:
[Fact]
public void CreateUserValidator_TestHelper_FailsWhenNameEmpty()
{
    var validator = new CreateUserValidator();

    var result = validator.TestValidate(new CreateUserRequest { Name = "" });

    result.ShouldHaveValidationErrorFor(x => x.Name)
          .WithErrorMessage("Name is required.");
    // Renaming Name → FullName produces a COMPILE ERROR here,
    // immediately flagging every test that needs updating.
}

[Fact]
public void CreateUserValidator_TestHelper_PassesWhenNameValid()
{
    var validator = new CreateUserValidator();

    var result = validator.TestValidate(new CreateUserRequest
    {
        Name = "Alice", Email = "alice@example.com", Age = 30
    });

    result.ShouldNotHaveValidationErrorFor(x => x.Name);
    result.ShouldNotHaveValidationErrorFor(x => x.Email);
    result.ShouldNotHaveValidationErrorFor(x => x.Age);
}`,
    },
    {
      label: 'Testing the async MustAsync rule with a mocked repository',
      language: 'csharp',
      code: `public class RegisterValidatorTests
{
    private readonly IUserRepository _users = Substitute.For<IUserRepository>();
    private RegisterValidator Sut => new(_users);

    [Fact]
    public async Task Username_Fails_When_Already_Taken()
    {
        // Controls the async dependency deterministically — no real
        // database, no network call:
        _users.ExistsAsync("alice", Arg.Any<CancellationToken>())
              .Returns(true);   // "alice" is already taken

        // MUST use TestValidateAsync — the validator contains an
        // async rule (MustAsync), and calling the SYNCHRONOUS
        // TestValidate() here throws at runtime (covered in the next
        // subtopic in this set):
        var result = await Sut.TestValidateAsync(new RegisterRequest
        {
            Username = "alice",
            Password = "Str0ngPass!",
        });

        result.ShouldHaveValidationErrorFor(x => x.Username)
              .WithErrorMessage("Username is already taken.");
    }

    [Fact]
    public async Task Username_Passes_When_Available()
    {
        _users.ExistsAsync("newuser", Arg.Any<CancellationToken>())
              .Returns(false);   // "newuser" is available

        var result = await Sut.TestValidateAsync(new RegisterRequest
        {
            Username = "newuser",
            Password = "Str0ngPass!",
        });

        result.ShouldNotHaveValidationErrorFor(x => x.Username);
    }

    [Theory]
    [InlineData("short")]        // < 8 chars
    [InlineData("alllowercase")] // no uppercase
    [InlineData("NoDigitsHere")] // no digit
    public async Task Password_Fails_Complexity_Rules(string password)
    {
        _users.ExistsAsync(Arg.Any<string>(), Arg.Any<CancellationToken>())
              .Returns(false);

        var result = await Sut.TestValidateAsync(new RegisterRequest
        {
            Username = "validuser",
            Password = password,
        });

        result.ShouldHaveValidationErrorFor(x => x.Password);
    }
}`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A teammate writes result.ShouldHaveValidationErrorFor(x => x.Username) but forgets to configure _users.ExistsAsync(...) on the mock beforehand — NSubstitute\'s default behavior for an unconfigured method returning Task<bool> is to return a completed Task wrapping false. Predict whether this specific test still passes, and explain what the test is (and isn\'t) actually proving as a result.',
    hint: 'BeUniqueUsernameAsync returns !await _users.ExistsAsync(...). If the unconfigured mock returns false for ExistsAsync, what does BeUniqueUsernameAsync\'s result work out to — and does that make the username rule PASS or FAIL?',
    solution: `If _users.ExistsAsync(...) is never configured, NSubstitute's default
for an unconfigured Task<bool>-returning method is a completed Task
wrapping false — meaning ExistsAsync effectively says "this username
does NOT exist." BeUniqueUsernameAsync computes !false, which is true
— the uniqueness check PASSES. If the test's intent was to prove the
username rule FAILS when already taken, an unconfigured mock silently
makes that impossible: the test would need to assert
ShouldHaveValidationErrorFor and it would FAIL (the assertion itself
fails, since no error was actually produced) — which is a visible,
loud test failure, not a false positive.

But the DANGEROUS version of this scenario is the opposite direction:
a test asserting ShouldNotHaveValidationErrorFor(x => x.Username) (the
"username IS available" case) with an UNCONFIGURED mock happens to
pass for the WRONG reason — not because the validator correctly
determined the username was available via genuine mock behavior the
test author deliberately set up, but because NSubstitute's default
"false" happened to align with what the test wanted anyway. This test
provides FALSE CONFIDENCE: it looks like it's verifying "the validator
correctly calls ExistsAsync and interprets the result," but it would
pass IDENTICALLY even if BeUniqueUsernameAsync were rewritten to
always return true unconditionally, never calling _users at all —
the mock being unconfigured means the test never actually proves the
repository call happens or that its result is correctly interpreted.

The fix is straightforward and already shown in this subtopic's own
code: EXPLICITLY configure the mock's return value for every test,
even when the desired outcome happens to match NSubstitute's default —
an explicit .Returns(false) documents the test's actual intent and
protects against exactly this kind of accidental, meaningless pass if
the default behavior ever changes or if the validator's logic changes
in a way that would otherwise be caught.`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'raw Validate() calls combined with Assert.Contains(result.Errors, e => e.PropertyName == "...") — the pattern the main page\'s own Q&A shows — is the standard, idiomatic way to test FluentValidation validators.',
      reality: 'FluentValidation ships a dedicated FluentValidation.TestHelper package with TestValidate()/TestValidateAsync() and expression-based assertions like ShouldHaveValidationErrorFor(x => x.Property) — these survive property renames at compile time and read more directly, unlike a bare string comparison that silently stops matching after a rename.',
    },
    {
      thought: 'testing a validator that contains an async MustAsync rule works the same way as testing a purely synchronous validator — just call TestValidate() or Validate() as usual.',
      reality: 'a validator containing ANY async rule must be tested with TestValidateAsync() (or ValidateAsync() without the helper) — calling the synchronous TestValidate()/Validate() on it throws at runtime, a direct consequence of FluentValidation\'s own async/sync validator contract.',
    },
    {
      thought: 'leaving a mocked dependency unconfigured in a validator test is harmless as long as the test\'s final assertion happens to pass.',
      reality: 'an unconfigured mock returning its library default (often false for a Task<bool> method) can make a test pass for entirely the wrong reason — providing false confidence that the validator correctly calls and interprets the dependency, when the test would pass identically even if that logic were broken or removed entirely.',
    },
  ];
}
