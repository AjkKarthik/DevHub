import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-inline-when-apply-condition-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
    TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './inline-when-defaults-to-all-validators-in-the-same-rulefor-chain.html',
  styleUrl: './inline-when-defaults-to-all-validators-in-the-same-rulefor-chain.scss',
})
export class InlineWhenDefaultsToAllValidatorsInTheSameRuleforChainSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page\'s own "Conditional Rules" code tab writes .When(x => x.ShipToCustomer, ApplyConditionTo.CurrentValidator) — passing a SECOND argument the page never explains — while its own theory point simply says ".When() applies the preceding rules only when the condition is true," implying there is only ONE possible scope for "preceding"',
      points: [
        'The inline <code>.When(predicate)</code> extension (called mid-chain, as opposed to the standalone block-form <code>When(predicate, () => { ... })</code>) defaults to <code>ApplyConditionTo.AllValidators</code> — meaning it applies to EVERY validator registered so far in the SAME <code>RuleFor(...)</code> statement, not just the ONE rule method it was chained directly after. If a chain has three rules before the <code>.When()</code> call, the condition retroactively applies to ALL THREE, not just the third.',
        'This is exactly why the main page\'s own example explicitly passes <code>ApplyConditionTo.CurrentValidator</code> as the second argument — to OVERRIDE that default and scope the condition to ONLY the immediately preceding rule (<code>NotEmpty()</code> in that example), rather than every rule that came before it in that <code>RuleFor()</code> chain. Since that particular chain has only one rule before the <code>.When()</code> call, the distinction happens to be invisible in that specific example — which is likely WHY the page never calls it out, even though the explicit argument is present in the code.',
      ],
    },
    {
      heading: 'The distinction becomes visible, and consequential, the moment a chain has TWO OR MORE rules before a trailing .When() — the default AllValidators behavior silently extends the condition backward to rules the developer may have intended to always apply unconditionally',
      points: [
        'Consider a chain like <code>RuleFor(x => x.Code).NotEmpty().Matches(pattern).When(x => x.RequiresCode)</code> — under the DEFAULT <code>AllValidators</code> scope, BOTH <code>NotEmpty()</code> AND <code>Matches(pattern)</code> only run when <code>x.RequiresCode</code> is true. If the developer\'s actual intent was "the code, if present, must always be non-empty, but only needs to match the pattern when RequiresCode is true," the default behavior silently makes the <code>NotEmpty()</code> check conditional too — an empty <code>Code</code> passes validation whenever <code>RequiresCode</code> happens to be false, even though the developer likely never intended <code>NotEmpty()</code> itself to be optional.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'The default AllValidators scope, demonstrated with a multi-rule chain',
      language: 'csharp',
      code: `public class DiscountValidator : AbstractValidator<DiscountRequest>
{
    public DiscountValidator()
    {
        // Two rules chained BEFORE a trailing .When() — the default
        // scope (AllValidators) applies the condition to BOTH:
        RuleFor(x => x.Code)
            .NotEmpty()                    // <-- also becomes conditional!
            .Matches(@"^[A-Z0-9]{6}$")     // <-- the rule .When() is
                                            //     "chained after"
            .When(x => x.RequiresCode);
        // No ApplyConditionTo argument — defaults to AllValidators.
    }
}

// Behavior when RequiresCode = false and Code = "" (empty):
var result = validator.Validate(new DiscountRequest
{
    RequiresCode = false,
    Code = "",
});
// result.IsValid == TRUE — NEITHER NotEmpty() NOR Matches() ran,
// because the DEFAULT scope applied the condition to the WHOLE
// chain, not just the rule .When() was written directly after.
// If the developer expected "Code must always be non-empty, only
// the PATTERN check is conditional," this is a silent surprise.`,
    },
    {
      label: 'Scoping to just the last rule with ApplyConditionTo.CurrentValidator — matching the main page\'s own example',
      language: 'csharp',
      code: `public class DiscountValidator : AbstractValidator<DiscountRequest>
{
    public DiscountValidator()
    {
        RuleFor(x => x.Code)
            .NotEmpty()                    // ALWAYS required — unconditional
            .Matches(@"^[A-Z0-9]{6}$")
                .When(x => x.RequiresCode,
                      ApplyConditionTo.CurrentValidator);  // <-- scopes
                                                            //     to ONLY
                                                            //     Matches()
    }
}

var result = validator.Validate(new DiscountRequest
{
    RequiresCode = false,
    Code = "",
});
// result.IsValid == FALSE now — NotEmpty() still ran unconditionally
// and correctly failed on the empty Code; only the pattern check
// (Matches) was skipped because RequiresCode was false.

// A test proving the two scopes produce genuinely different outcomes
// for the EXACT same input — the only variable is the
// ApplyConditionTo argument:
[Theory]
[InlineData(ApplyConditionTo.AllValidators, true)]    // NotEmpty skipped too — passes
[InlineData(ApplyConditionTo.CurrentValidator, false)] // NotEmpty still runs — fails
public void EmptyCode_WithRequiresCodeFalse_Behavior_Depends_On_ApplyConditionTo(
    ApplyConditionTo scope, bool expectedIsValid)
{
    var validator = new InlineValidator<DiscountRequest>();
    validator.RuleFor(x => x.Code)
        .NotEmpty()
        .Matches(@"^[A-Z0-9]{6}$")
        .When(x => x.RequiresCode, scope);

    var result = validator.Validate(new DiscountRequest
    {
        RequiresCode = false, Code = "",
    });

    Assert.Equal(expectedIsValid, result.IsValid);
}`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A validator has RuleFor(x => x.Email).NotEmpty().EmailAddress().When(x => x.RequireEmail) — three total validators considered in that single chain (NotEmpty, EmailAddress, and the implicit chain built by RuleFor). Under the default ApplyConditionTo.AllValidators, for an input where RequireEmail is false and Email is an invalid string like "not-an-email", does validation for Email pass or fail? Explain precisely why, distinguishing what AllValidators scopes to.',
    hint: 'AllValidators scopes to every validator registered so far in THIS SAME RuleFor(...) chain — does that include EmailAddress(), which is chained BEFORE the .When() call, just like NotEmpty() is?',
    solution: `Validation for Email PASSES (produces no error) in this scenario. Under
the default AllValidators scope, .When(x => x.RequireEmail) applies to
BOTH NotEmpty() and EmailAddress() — every validator registered in
that SAME RuleFor(x => x.Email) chain before the .When() call — not
just the immediately preceding EmailAddress() rule. Since RequireEmail
is false, NEITHER rule runs at all: NotEmpty() doesn't fail on the
non-empty-but-invalid string, and EmailAddress() never gets a chance
to reject "not-an-email" as a malformed address, because it's
skipped entirely along with NotEmpty().

This is precisely the "default AllValidators silently extends the
condition backward" behavior this subtopic describes — every rule
chained before the trailing .When(), all the way back to the start of
that RuleFor() statement, is swept into the SAME conditional scope,
regardless of how many rules that is or whether the developer intended
all of them to share that condition.

If the actual intent was "Email must always be a valid email format
WHEN PROVIDED, but is only REQUIRED (non-empty) when RequireEmail is
true" — a very plausible, reasonable validation rule — the correct
code needs the SCOPES to be genuinely split, not just the .When()
argument changed uniformly:

RuleFor(x => x.Email).NotEmpty().When(x => x.RequireEmail);
RuleFor(x => x.Email).EmailAddress().When(x => !string.IsNullOrEmpty(x.Email));

Splitting into TWO separate RuleFor() calls for the SAME property,
each with its own independent condition, is often the clearest fix
when different rules on the same property need genuinely different
conditional scopes — rather than trying to get ApplyConditionTo to
express two different conditions within one chain, which it cannot
do (a single .When() call has exactly one scope: either the whole
chain via AllValidators, or just the immediately preceding rule via
CurrentValidator — there's no middle-ground "the first two rules but
not this one" option within a single chain).`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'the inline .When(condition) call, written after a chain of rule methods, applies ONLY to the immediately preceding rule in that chain — matching the plain-English reading of "applies the preceding rule."',
      reality: 'the inline .When() defaults to ApplyConditionTo.AllValidators, which retroactively applies the condition to EVERY rule registered so far in that SAME RuleFor() chain, not just the last one — ApplyConditionTo.CurrentValidator must be passed explicitly to scope it to only the immediately preceding rule.',
    },
    {
      thought: 'the main page\'s own example passing ApplyConditionTo.CurrentValidator as a second .When() argument is either optional stylistic flourish or a version-specific requirement, since the theory text never explains what it changes.',
      reality: 'it is functionally necessary whenever a chain has (or might later gain) more than one rule before the .When() call — omitting it silently reverts to the AllValidators default, which can make earlier, intentionally-unconditional rules (like NotEmpty()) become conditional without any visible change to those earlier rule calls themselves.',
    },
    {
      thought: 'when two different rules on the same property need two genuinely different conditions, a single RuleFor() chain with careful ApplyConditionTo arguments can express both.',
      reality: 'a single .When() call has exactly one scope — either the whole chain (AllValidators) or just the immediately preceding rule (CurrentValidator) — there is no way to apply two DIFFERENT conditions to two DIFFERENT subsets of rules within one RuleFor() chain; splitting into separate RuleFor() calls for the same property, each with its own condition, is the correct pattern for that case.',
    },
  ];
}
