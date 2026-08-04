import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  standalone: true,
  imports: [PageMetaComponent, TheoryBlockComponent, CodeBlockComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent, SubtopicEyebrowComponent],
  templateUrl: './what-a-test-data-builder-actually-looks-like.html',
  styleUrl: './what-a-test-data-builder-actually-looks-like.scss'
})
export class WhatATestDataBuilderActuallyLooksLikeSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'A named pattern, described precisely, shown nowhere',
      points: [
        'The page\'s own QnA describes this exactly: "A UserBuilder with sensible defaults for all optional fields allows tests to specify only the fields relevant to the test scenario... This avoids test setup code full of null values and makes tests focus on the field being tested." No codeTab on the page shows a builder with DEFAULTS baked in.',
        'Every builder shown elsewhere on this page (<code>HttpRequestBuilder</code>, the email builders) starts from EMPTY or minimal state, requiring the caller to set every field that matters. A Test Data Builder inverts this: it starts every field ALREADY populated with a realistic, valid default, and the caller only overrides the ONE OR TWO fields the specific test actually cares about.',
      ]
    },
    {
      heading: 'Why defaults are the whole point, not an optional nicety',
      points: [
        'Without defaults, a test creating a <code>User</code> to check "does an expired trial user lose access" has to explicitly set every OTHER field too (name, email, signup date, plan tier...) just to get a valid object — even though none of those fields matter to what the test is actually checking. This buries the one relevant fact (trial expired) in a wall of irrelevant setup.',
        'With a Test Data Builder, that same test writes <code>new UserBuilder().withTrialExpired(true).build()</code> — every other field silently gets a sensible default, and the ONE line of setup that exists is exactly the fact the test cares about.',
        'The QnA names the maintenance payoff directly: "When the User class adds a new required field, only the builder default needs to be updated, not every test that creates a User" — a new required field is a ONE-LINE change to the builder\'s own default, instead of an edit to every single test file that happens to construct a <code>User</code>.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'A UserBuilder with realistic defaults, and what it buys a test',
      language: 'csharp',
      code: `public sealed record User(
    string Name, string Email, DateOnly SignupDate,
    string PlanTier, bool TrialExpired);

public class UserBuilder
{
    // Every field starts with a REALISTIC, VALID default -- not null,
    // not empty, not zero. A test that never touches a field still
    // gets a User that could plausibly exist in production.
    private string _name = "Test User";
    private string _email = "test.user@example.com";
    private DateOnly _signupDate = new DateOnly(2024, 1, 1);
    private string _planTier = "free";
    private bool _trialExpired = false;

    public UserBuilder WithName(string name) { _name = name; return this; }
    public UserBuilder WithEmail(string email) { _email = email; return this; }
    public UserBuilder WithSignupDate(DateOnly date) { _signupDate = date; return this; }
    public UserBuilder WithPlanTier(string tier) { _planTier = tier; return this; }
    public UserBuilder WithTrialExpired(bool expired) { _trialExpired = expired; return this; }

    public User Build() => new(_name, _email, _signupDate, _planTier, _trialExpired);
}

// WITHOUT a Test Data Builder -- every field spelled out, every time,
// even the ones this specific test does not care about at all
var user1 = new User("Test User", "test.user@example.com",
    new DateOnly(2024, 1, 1), "free", TrialExpired: true);

// WITH a Test Data Builder -- only the ONE relevant field is visible;
// everything else is the builder's own sensible default
var user2 = new UserBuilder().WithTrialExpired(true).Build();

// The test reader's eye goes straight to the one fact that matters --
// no irrelevant setup competing for attention.
[Fact]
public void ExpiredTrialUser_LosesAccess()
{
    var user = new UserBuilder().WithTrialExpired(true).Build();
    Assert.False(AccessService.HasAccess(user));
}`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'The User record adds a new required field, EmailVerified. A teammate updates UserBuilder\'s default (_emailVerified = true) but does not touch any existing test files. Do the existing tests that construct a User via UserBuilder still compile and pass?',
    hint: 'Do any of the EXISTING tests reference EmailVerified by name anywhere in their own code?',
    solution: 'Yes -- and this is the entire point of the pattern. None of the existing tests reference EmailVerified anywhere in their own source, since they were all written through UserBuilder\'s fluent methods, never by constructing a User record directly with every field spelled out. Adding the new field only required ONE change (a new private field plus its default, plus one new WithEmailVerified() method) in UserBuilder itself -- every existing test that calls new UserBuilder()....Build() automatically gets a User with a sensible EmailVerified value with zero changes to the test files themselves. Contrast this with the "WITHOUT a Test Data Builder" example in the theory section -- if tests constructed User records directly with every field spelled out, EVERY one of those direct-construction call sites would need a new EmailVerified argument added, or the code would fail to compile.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'A Test Data Builder is just the same Builder pattern shown elsewhere on this page, applied to test code — there is nothing distinct about it.',
      reality: 'Per this subtopic\'s theory, the defining difference is DEFAULTS — the builders shown elsewhere start empty and require the caller to set every field that matters, while a Test Data Builder starts every field already populated with a realistic value, and the caller only overrides what the specific test cares about.'
    },
    {
      thought: 'Giving every field a default value in a Test Data Builder risks hiding bugs, since tests might accidentally rely on a default instead of an intentionally-set value.',
      reality: 'Per this subtopic\'s theory, the defaults are specifically chosen to be REALISTIC and VALID (not null, not zero, not empty) — a test that constructs a plausible object without caring about most of its fields is not accidentally relying on anything, since every default represents data that could genuinely exist in production.'
    },
    {
      thought: 'When a class gains a new required field, every test that constructs an instance of that class has to be updated, regardless of whether a Test Data Builder is used.',
      reality: 'Per this subtopic\'s theory, this is exactly the cost a Test Data Builder avoids — adding a new field only requires updating the builder\'s own default in one place, not every individual test that happens to construct that type.'
    }
  ];
}
