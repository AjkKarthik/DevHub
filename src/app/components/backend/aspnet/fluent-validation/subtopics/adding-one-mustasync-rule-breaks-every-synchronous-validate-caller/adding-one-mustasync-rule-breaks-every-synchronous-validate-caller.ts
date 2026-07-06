import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-mustasync-breaks-sync-callers-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
    TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './adding-one-mustasync-rule-breaks-every-synchronous-validate-caller.html',
  styleUrl: './adding-one-mustasync-rule-breaks-every-synchronous-validate-caller.scss',
})
export class AddingOneMustasyncRuleBreaksEverySynchronousValidateCallerSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page shows two independent examples — CreateUserValidator (purely synchronous, tested with plain Validate() in its own Q&A) and RegisterValidator (containing a MustAsync rule) — without ever stating the rule that connects them: adding EVEN ONE async rule anywhere in a validator changes what EVERY caller of that validator must do, not just the new rule\'s own behavior',
      points: [
        'FluentValidation tracks, per validator, whether ANY of its registered rules are asynchronous. Once a single <code>MustAsync</code> (or any other async rule type) is added anywhere in the constructor, calling the SYNCHRONOUS <code>Validate(model)</code> method on that validator throws <code>InvalidOperationException</code> at runtime: <code>"Validate cannot be called on a validator that has async rules. Use ValidateAsync instead."</code> — this is a HARD runtime failure, not a warning, and it happens the moment <code>Validate()</code> is invoked, regardless of the specific model being validated.',
        'This means a validator that started life PURELY synchronous — safely called via <code>Validate()</code> from a dozen different call sites across a codebase (minimal API handlers, background jobs, unit tests, a manual validation helper) — silently changes its CONTRACT the moment someone adds a single <code>MustAsync</code> rule for a new business requirement. Every ONE of those existing <code>Validate()</code> call sites now throws at runtime, and none of them show a compile-time warning, since <code>Validate()</code> remains a perfectly valid method to call on the type — it just now always throws.',
      ],
    },
    {
      heading: 'This is precisely why the main page\'s own two examples happen to be safe in isolation — CreateUserValidator has zero async rules (safe with Validate()) and RegisterValidator is introduced FROM THE START with its MustAsync rule already present (so its own Q&A never shows anyone accidentally calling the sync method on it) — but the page never states the underlying rule that makes this an intentional design choice rather than a coincidence',
      points: [
        'The failure is entirely avoidable, and not really a "bug" in FluentValidation — it exists because running an async rule via a BLOCKING synchronous call would require blocking on a Task somewhere internally, exactly the kind of ASP.NET Core deadlock risk the main page\'s own "Calling async code inside Must()" Common Mistake warns about for a DIFFERENT reason (calling <code>.Result</code> inside <code>Must()</code>). Throwing loudly at the <code>Validate()</code> call site instead of silently blocking (and risking a deadlock) is the SAFER failure mode FluentValidation deliberately chose.',
        'The practical implication: before adding a <code>MustAsync</code> rule to an EXISTING validator, grep the codebase for every call site invoking <code>Validate()</code> (not <code>ValidateAsync()</code>) on that specific validator type — each one needs to become async, all the way up its own call chain, or the change breaks it at runtime the next time that code path executes.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'The break, reproduced — a validator that starts synchronous, then gains one async rule',
      language: 'csharp',
      code: `// v1 — purely synchronous, safely called via Validate() from
// several places in the codebase:
public class CreateUserValidator : AbstractValidator<CreateUserRequest>
{
    public CreateUserValidator()
    {
        RuleFor(x => x.Name).NotEmpty().Length(2, 100);
        RuleFor(x => x.Email).NotEmpty().EmailAddress();
        RuleFor(x => x.Age).InclusiveBetween(18, 120);
    }
}

// Call site A — a background job, written when the validator was
// purely synchronous:
public class UserImportJob(CreateUserValidator validator)
{
    public void ProcessRow(CreateUserRequest row)
    {
        var result = validator.Validate(row);   // fine — v1 has no async rules
        if (!result.IsValid) LogSkippedRow(row, result.Errors);
    }
}

// v2 — a new business requirement: reject emails already registered.
// A single MustAsync rule is added:
public class CreateUserValidator : AbstractValidator<CreateUserRequest>
{
    private readonly IUserRepository _users;

    public CreateUserValidator(IUserRepository users)
    {
        _users = users;
        RuleFor(x => x.Name).NotEmpty().Length(2, 100);
        RuleFor(x => x.Email)
            .NotEmpty()
            .EmailAddress()
            .MustAsync(BeUnregisteredEmailAsync);   // <-- the ONLY change
        RuleFor(x => x.Age).InclusiveBetween(18, 120);
    }

    private async Task<bool> BeUnregisteredEmailAsync(string email, CancellationToken ct)
        => !await _users.EmailExistsAsync(email, ct);
}

// Call site A — UNCHANGED, still calling Validate() synchronously:
var result = validator.Validate(row);
// THROWS at runtime, every single time this line executes now:
// InvalidOperationException: Validate cannot be called on a validator
// that has async rules. Use ValidateAsync instead.
//
// The background job worked perfectly yesterday. Today, with ZERO
// changes to UserImportJob itself, every row processed throws.`,
    },
    {
      label: 'The fix — propagate async all the way up, and a test that catches this class of regression',
      language: 'csharp',
      code: `// THE FIX — every call site must become async, all the way up:
public class UserImportJob(CreateUserValidator validator)
{
    public async Task ProcessRowAsync(CreateUserRequest row, CancellationToken ct)
    {
        var result = await validator.ValidateAsync(row, ct);   // <-- now async
        if (!result.IsValid) LogSkippedRow(row, result.Errors);
    }
}
// If ProcessRowAsync's OWN callers were synchronous, they now need
// updating too — the async requirement propagates as far up the call
// stack as necessary, exactly like any other sync-to-async migration.

// A REGRESSION TEST that specifically catches "someone added an async
// rule without checking existing sync call sites" — worth adding
// alongside any validator that is a candidate for future async rules:
[Fact]
public void CreateUserValidator_Validate_Does_Not_Throw_Synchronously()
{
    var validator = new CreateUserValidator(Substitute.For<IUserRepository>());

    // This assertion PASSES today (v1) and FAILS the moment someone
    // adds an async rule without updating this test and its
    // implications — a deliberate tripwire, not an incidental check:
    var exception = Record.Exception(() =>
        validator.Validate(new CreateUserRequest
        {
            Name = "Alice", Email = "alice@example.com", Age = 30,
        }));

    Assert.Null(exception);
    // If this test starts failing after someone's PR adds a
    // MustAsync rule, it is a clear, actionable signal: go audit
    // EVERY existing Validate() call site for this validator type
    // before merging, not just the new rule's own correctness.
}`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A team, aware of this trap, proposes a policy: "never add async rules to a validator that already has synchronous callers — instead, create a SEPARATE validator class containing only the async rule, and call both validators independently at each call site." Evaluate this policy against the alternative (migrating the existing validator and all its callers to async), considering what each approach actually preserves or sacrifices.',
    hint: 'The two-validator approach avoids touching existing Validate() call sites — but does it preserve the SAME aggregate ValidationResult (all errors, from both the old and new rules, in one place) that a single unified validator naturally provides? What has to change at call sites either way?',
    solution: `The two-validator policy avoids the IMMEDIATE breaking change (existing
Validate() calls keep compiling and running exactly as before), but it
sacrifices something the main page's own theory identifies as
valuable: a single ValidationResult aggregating ALL failures for a
model in one place. With two separate validators, a caller now needs
to run BOTH (one sync, one async) and manually MERGE their
ValidationResult objects to present a complete picture of every
failure to the end user — otherwise a request that fails BOTH the
original synchronous rules AND the new async uniqueness check might
only show the caller ONE set of errors at a time, depending on which
validator ran first and whether the caller even remembers to run the
second one at all. This is a real, ongoing maintenance cost that the
single-validator, fully-async approach doesn't have — one call to
ValidateAsync() naturally aggregates everything.

The two-validator approach ALSO doesn't actually avoid updating call
sites — it just changes WHAT change is needed there. Every call site
still needs to be touched to add the SECOND validator invocation (and,
if genuine full-error-aggregation is wanted, the merging logic) — it
is not a zero-touch migration, it just avoids the SPECIFIC
InvalidOperationException failure mode by never mixing sync and async
rules in the same validator instance.

The fully-async migration (updating every existing Validate() call
site to ValidateAsync(), propagating async up the call stack as far as
needed) is more invasive UP FRONT — potentially touching several call
sites and their own callers — but results in a SINGLE, coherent
validator with one aggregate result, matching the design FluentValidation
itself assumes (one AbstractValidator<T> per model, all its rules
producing one ValidationResult). The two-validator approach is a
reasonable STOPGAP when a full migration genuinely can't happen
immediately (a large legacy codebase, a deadline), but it is a
long-term liability that both the exercise's premise and this
subtopic's own regression test are designed to surface and eventually
force a real decision about, rather than paper over indefinitely.`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'adding a single MustAsync rule to an existing validator is a purely additive, local change — it only affects the specific model properties the new rule touches.',
      reality: 'FluentValidation tracks whether a validator has ANY async rules at all — adding even one changes the validator\'s CONTRACT entirely, causing every existing call site that invokes the synchronous Validate() method to throw InvalidOperationException at runtime, regardless of which property or rule the caller cares about.',
    },
    {
      thought: 'the main page\'s CreateUserValidator (synchronous) and RegisterValidator (async) examples happen to both be safe purely by coincidence of how they were written.',
      reality: 'they are safe specifically because CreateUserValidator was never given an async rule (making Validate() permanently safe for it) and RegisterValidator was introduced WITH its async rule already present from the start — the underlying rule that makes this safe is a deliberate design choice, not a coincidence, and it stops holding the moment an async rule is added to a previously-synchronous validator.',
    },
    {
      thought: 'FluentValidation throwing an exception when Validate() is called on a validator with async rules is an overly strict limitation that could reasonably be worked around by blocking on the async rule internally.',
      reality: 'the exception is a deliberate, safer alternative to the internal blocking that would otherwise be required — exactly the same kind of ASP.NET Core deadlock risk the main page\'s own "Calling async code inside Must()" Common Mistake warns about, just encountered from the framework\'s own internals rather than user code.',
    },
  ];
}
