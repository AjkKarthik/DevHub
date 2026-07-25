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
  templateUrl: './a-for-expression-map-errors-on-duplicate-keys-unless-grouped.html',
  styleUrl: './a-for-expression-map-errors-on-duplicate-keys-unless-grouped.scss'
})
export class AForExpressionMapErrorsOnDuplicateKeysUnlessGroupedSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page\'s own map-producing for expression example has no duplicate keys — so the constraint never surfaces',
      points: [
        'The main page\'s For Expressions theory shows <code>{for k, v in var.tags : k => lower(v)}</code> and <code>{for s in var.names : s => length(s)}</code> — in both examples, the source data structurally guarantees unique keys (a map\'s own keys, or a list of presumably-unique names). Neither example ever shows what happens when the key expression produces a DUPLICATE for two different input elements.',
      ]
    },
    {
      heading: 'A map-producing for expression requires unique keys — a duplicate is a plan-time error, not a silent overwrite',
      points: [
        'When a <code>for</code> expression\'s result uses <code>{ }</code> delimiters (producing a map/object rather than a list), Terraform requires every computed key to be unique across the whole result — if two different source elements produce the same key, the expression fails outright with a "Duplicate object key" error, rather than silently letting the later value overwrite the earlier one the way a plain assignment might.',
        'This differs from what many people\'s intuition expects from map-building in general-purpose languages, where a duplicate key silently overwrites the previous value with no error at all — Terraform\'s for-expression behavior here is deliberately fail-fast instead.',
      ]
    },
    {
      heading: 'The ellipsis (...) opts into grouping mode instead of erroring',
      points: [
        'Appending <code>...</code> immediately after the VALUE expression in a map-producing for expression activates grouping mode: instead of erroring on a duplicate key, Terraform collects every value that shares that key into a LIST, so the result becomes a map where each value is itself a list of all the matching elements rather than a single value.',
        'A concrete case: grouping a list of users by their role — <code>{for name, user in var.users : user.role => name...}</code> — naturally produces multiple users sharing the same role (a duplicate-key scenario by design), and the trailing <code>...</code> is exactly what turns that from an error into a correctly-grouped <code>{ admin = ["alice", "bob"], viewer = ["carol"] }</code>-shaped result.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'The error: a genuinely duplicate-prone key expression',
      language: 'bash',
      code: `variable "users" {
  default = {
    alice = { role = "admin" }
    bob   = { role = "admin" }
    carol = { role = "viewer" }
  }
}

locals {
  # Grouping by role -- but "admin" is produced by BOTH alice
  # and bob. Without any special handling, this is a genuine
  # duplicate key for a map-producing for expression:
  by_role = { for name, user in var.users : user.role => name }
}
# Error: Duplicate object key
#   Two different items produced the key "admin" in this 'for'
#   expression. If duplicates are expected, use the ellipsis
#   (...) after the value expression to enable grouping mode.
# -- Terraform's own error message names the exact fix.`,
    },
    {
      label: 'The fix: ... activates grouping mode',
      language: 'bash',
      code: `locals {
  # Trailing "..." after the value expression turns duplicate
  # keys from an error into automatic grouping:
  by_role = { for name, user in var.users : user.role => name... }
}
# Result:
# {
#   admin  = ["alice", "bob"]
#   viewer = ["carol"]
# }
# Every value that shares a key is now collected into a LIST
# under that key, instead of erroring on the second "admin".

# Without any duplicates in the source data, "..." is harmless
# and simply produces single-element lists for every key --
# it does not require duplicates to be present to use it.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A team writes `{for name, user in var.users : user.department => name}` to group usernames by department, following the exact pattern shown in the main page\'s own for-expression examples. terraform plan immediately fails with "Duplicate object key" because two users happen to share the same department. What does this error message actually mean given Terraform\'s own behavior for map-producing for expressions, and what single addition to the expression fixes it while producing the intended grouped result?',
    hint: 'A map-producing for expression ({ }) requires unique keys by default — what mechanism does Terraform provide specifically for the case where duplicates are expected and should be grouped rather than treated as an error?',
    solution: 'The error means exactly what it says: a map-producing for expression (using { } delimiters) requires every computed key to be unique, and two different users produced the same department value — Terraform fails fast here rather than silently letting one overwrite the other. Since duplicates are expected and intentional (multiple users legitimately share a department), the fix is appending `...` right after the value expression: `{for name, user in var.users : user.department => name...}`. This activates grouping mode, so instead of erroring on the second matching department, Terraform collects every matching username into a list under that department\'s key — producing the intended grouped result rather than either an error or a silently-overwritten single value.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'A for expression producing a map with a duplicate key silently keeps the LAST value for that key, overwriting earlier ones, the same way a plain key assignment would in most general-purpose languages.',
      reality: 'Per this subtopic\'s theory, Terraform fails fast instead — a duplicate key in a map-producing for expression is a plan-time error ("Duplicate object key"), not a silent overwrite, unless grouping mode is explicitly activated.'
    },
    {
      thought: 'The ellipsis (...) in a for expression is only useful or valid when the source data is actually known to contain duplicate keys.',
      reality: 'Per this subtopic\'s theory, ... is harmless to use even without duplicates present — it simply produces single-element lists for every key in that case — so it can be used proactively whenever duplicates are POSSIBLE, not only after already hitting the error.'
    },
    {
      thought: 'Grouping mode changes the for expression\'s overall syntax significantly, requiring a different expression structure than a normal map-producing for expression.',
      reality: 'Per this subtopic\'s theory, grouping mode is activated by a single trailing ... immediately after the value expression — the rest of the for expression\'s structure is completely unchanged from the ordinary, non-grouped form.'
    }
  ];
}
