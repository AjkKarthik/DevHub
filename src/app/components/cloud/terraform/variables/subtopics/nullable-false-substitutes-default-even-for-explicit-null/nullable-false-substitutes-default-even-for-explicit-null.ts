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
  templateUrl: './nullable-false-substitutes-default-even-for-explicit-null.html',
  styleUrl: './nullable-false-substitutes-default-even-for-explicit-null.scss'
})
export class NullableFalseSubstitutesDefaultEvenForExplicitNullSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page\'s own QnA states this precisely, but no code example on the page ever demonstrates it',
      points: [
        'The main page\'s QnA already gets this exactly right: "nullable = false prevents null even when callers explicitly pass null by substituting the default; a plain default is bypassed when callers pass null." That is a precise, correct answer — but nowhere in the main page\'s codeTabs is this actually shown running, so the difference stays abstract.',
      ]
    },
    {
      heading: 'A plain default only fills in a MISSING value — not an explicitly passed null',
      points: [
        'When a variable has only <code>default = "..."</code> (no <code>nullable</code> set — which defaults to <code>true</code>), the default is used ONLY when the caller omits the argument entirely. If a caller EXPLICITLY passes <code>null</code> — a common outcome from a conditional expression like <code>var.override != "" ? var.override : null</code> — the variable\'s actual value inside the module becomes <code>null</code>, not the default. The default is not a "null-replacement," it is a "missing-value-replacement."',
      ]
    },
    {
      heading: 'nullable = false changes null-handling specifically, not just "requiredness"',
      points: [
        'Adding <code>nullable = false</code> to a variable that also has a default changes the behavior specifically for the explicit-null case: now, when a caller passes <code>null</code> (explicitly or via a conditional that resolves to null), Terraform substitutes the variable\'s own default INSTEAD of letting <code>null</code> propagate into the module\'s logic.',
        'This matters most for module authors: if a resource block inside the module does something like <code>instance_type = var.instance_type</code> with no null-guard, an unexpected <code>null</code> flowing in from a plain-default variable can produce a confusing downstream provider error, while <code>nullable = false</code> guarantees the module\'s own logic never has to handle a null value for that variable at all.',
        '<code>nullable = false</code> WITHOUT a default is different again — it makes the variable strictly required and rejects null outright (since there is no default to fall back to), rather than silently substituting anything.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Plain default: bypassed by an explicit null',
      language: 'bash',
      code: `variable "instance_type" {
  type    = string
  default = "t3.micro"
  # nullable defaults to true when not set
}

module "web" {
  source = "./modules/web"
  # Caller's own conditional resolves to null, not omitted:
  instance_type = var.override_type != "" ? var.override_type : null
}

# Inside modules/web, var.instance_type is now actually NULL,
# NOT "t3.micro" -- the default only fires when the argument
# is OMITTED entirely, not when it is explicitly passed as null.
resource "aws_instance" "this" {
  instance_type = var.instance_type   # null reaches here directly
}`,
    },
    {
      label: 'nullable = false: the default survives an explicit null',
      language: 'bash',
      code: `variable "instance_type" {
  type      = string
  default   = "t3.micro"
  nullable  = false   # the fix
}

module "web" {
  source = "./modules/web"
  instance_type = var.override_type != "" ? var.override_type : null
}

# Inside modules/web, var.instance_type is now "t3.micro" --
# nullable = false caught the explicit null being passed in and
# substituted the default instead of letting null propagate.
resource "aws_instance" "this" {
  instance_type = var.instance_type   # guaranteed non-null here
}

# nullable = false WITHOUT a default is different still: the
# variable becomes strictly required and REJECTS null outright,
# since there is no default to fall back to:
variable "environment" {
  type     = string
  nullable = false   # no default -- explicit null is now an error
}`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A module\'s `instance_type` variable has `default = "t3.micro"` but no `nullable` setting. A caller passes `instance_type = var.override != "" ? var.override : null` — when `override` is an empty string, this resolves to `null`. The module\'s own resource block then fails with a confusing provider-level type error about instance_type, even though the variable clearly has a default. Why did the default not apply, and what single change to the variable declaration would fix it?',
    hint: 'Ask specifically what condition triggers a default value: is it "the argument is missing" or "the value is null" — these are two different things.',
    solution: 'The default did not apply because a plain `default` only fires when the argument is OMITTED entirely — it does not catch an explicitly passed `null` value, which is exactly what the caller\'s conditional expression produced. Since the variable\'s own `nullable` setting defaults to `true` when unset, the null value was allowed to flow straight into the module\'s logic, reaching the resource block as `null` and producing the confusing downstream error. The fix is adding `nullable = false` to the variable declaration (alongside the existing default): `variable "instance_type" { type = string, default = "t3.micro", nullable = false }`. This specifically changes the explicit-null case — Terraform now substitutes the default whenever null reaches the variable, whether the argument was omitted OR explicitly passed as null.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'A variable\'s default value is used any time the variable would otherwise be null, whether the caller omitted the argument or explicitly passed null.',
      reality: 'Per this subtopic\'s theory, a plain default (with nullable left at its default of true) ONLY fires when the argument is omitted entirely — an explicitly passed null value bypasses the default completely and reaches the module\'s logic as null.'
    },
    {
      thought: 'nullable = false just makes a variable required, functioning the same as having no default value at all.',
      reality: 'Per this subtopic\'s theory, nullable = false WITH a default has a specific, different behavior: it substitutes the default when null is passed (explicitly or otherwise), rather than rejecting it — it only behaves like a hard requirement when there is no default to fall back to.'
    },
    {
      thought: 'A conditional expression like `condition ? value : null` passed as a module argument is functionally the same as simply omitting that argument when the condition is false.',
      reality: 'Per this subtopic\'s theory, these are different from Terraform\'s point of view: omitting an argument lets a plain default apply, while explicitly passing null (even from a conditional) bypasses a plain default entirely and requires nullable = false to be caught.'
    }
  ];
}
