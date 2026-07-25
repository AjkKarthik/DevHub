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
  templateUrl: './pessimistic-constraint-upper-bound-depends-on-segment-count.html',
  styleUrl: './pessimistic-constraint-upper-bound-depends-on-segment-count.scss'
})
export class PessimisticConstraintUpperBoundDependsOnSegmentCountSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page\'s theory only ever shows the two-segment form',
      points: [
        'The main page\'s Version Constraints list states "~> 5.0 (pessimistic — >= 5.0 and < 6.0)" and every <code>required_providers</code> code example uses a two-segment form like <code>"~> 5.0"</code> or <code>"~> 3.5"</code>. The only place a three-segment example appears at all is buried in a QUIZ answer explanation ("~> 5.0.1 would mean >= 5.0.1 and < 5.1.0"), never demonstrated or explained in the theory itself.',
      ]
    },
    {
      heading: 'The rule: ~> locks everything except the RIGHTMOST segment you write',
      points: [
        'The <code>~></code> operator allows the rightmost version component you actually specify to increment, while everything to its left stays fixed. This means the number of segments you write changes which part of the version is allowed to move.',
        '<code>~> 5.0</code> (two segments: major.minor) locks the MAJOR version at 5 and allows the MINOR version to increment freely — this permits 5.1, 5.6, 5.99, but rejects 6.0.',
        '<code>~> 5.0.1</code> (three segments: major.minor.patch) locks BOTH the major version at 5 AND the minor version at 0, only allowing the PATCH version to increment — this permits 5.0.2, 5.0.3, but rejects 5.1.0 (even though 5.1.0 would have satisfied the two-segment form).',
      ]
    },
    {
      heading: 'Why this matters: adding a patch digit to an existing constraint silently narrows it',
      points: [
        'A common, easy-to-miss mistake: someone sees <code>version = "~> 5.0"</code> already pinned to a specific working release, say 5.0.3, and "helpfully" rewrites it as <code>version = "~> 5.0.3"</code> to be more precise about the tested version — not realizing this SILENTLY NARROWS the allowed range from "any 5.x" down to "only 5.0.x patch releases," blocking minor version upgrades (5.1, 5.2, ...) the team may have been relying on to receive automatically.',
        'Neither form is universally "more correct" — the choice is a deliberate tradeoff: two segments (<code>~> 5.0</code>) accepts minor version updates automatically (new resources/data sources, but also occasional minor-version behavior changes), while three segments (<code>~> 5.0.1</code>) accepts only bug-fix patches and requires a deliberate constraint edit to move to a new minor version.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Same-looking edit, very different allowed range',
      language: 'bash',
      code: `# Before: two segments -- allows any 5.x release
required_providers {
  aws = {
    source  = "hashicorp/aws"
    version = "~> 5.0"   # >= 5.0.0, < 6.0.0 -- 5.1, 5.20, 5.99 all OK
  }
}

# "Helpful" edit to be more specific about the tested version --
# looks like a strict superset of the same constraint, but is NOT:
required_providers {
  aws = {
    source  = "hashicorp/aws"
    version = "~> 5.0.3"   # >= 5.0.3, < 5.1.0 -- ONLY 5.0.x now
  }
}
# terraform init now REJECTS 5.1.0, 5.6.2, etc. -- versions that
# were perfectly acceptable under the two-segment form.`,
    },
    {
      label: 'Choosing the right form deliberately',
      language: 'bash',
      code: `# Two segments: "stay on major version 5, take any minor/patch"
# -- the common default for most teams, matches the main page's
# own examples throughout.
version = "~> 5.0"

# Three segments: "stay on 5.0.x specifically, patches only"
# -- deliberate choice for a provider with a history of breaking
# changes even within minor versions, or when a specific minor
# version was extensively tested and minor upgrades need to be
# a conscious, reviewed action rather than automatic.
version = "~> 5.0.3"

# Checking which providers a given constraint would currently
# resolve to, without changing anything:
terraform providers
terraform init -upgrade=false   # explicit: respect the lock file`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A required_providers block has `version = "~> 4.16"` and the team has been getting automatic minor-version upgrades (4.17, 4.20, etc.) as new AWS resource types are released. A teammate, wanting to "pin down" the exact version currently in the lock file for extra stability, changes it to `version = "~> 4.16.1"` (the exact version from .terraform.lock.hcl) — the very next terraform init in CI fails when a routine minor-version bump the team was expecting (4.17.0) is now rejected. What changed, and what constraint would give the stability they actually wanted without blocking minor upgrades?',
    hint: 'Compare what the rightmost segment is in each form — two segments locks the major version and lets the minor version move; three segments locks the major AND minor version and only lets the patch move.',
    solution: 'Adding the patch digit changed which segment is allowed to move: `~> 4.16` (two segments) locks the major version at 4 and lets the minor version increment freely (4.17, 4.20, ... all valid), while `~> 4.16.1` (three segments) locks BOTH the major version at 4 AND the minor version at 16, only allowing the patch to increment — so 4.17.0 is now rejected even though it satisfied the original constraint. If the goal was "extra stability" without blocking the minor-version upgrades the team was relying on, the original two-segment `~> 4.16` was already correct — genuine "pin to this exact tested version and nothing else" stability would instead mean an EXACT constraint (`version = "4.16.1"`, no `~>` at all), not a three-segment pessimistic constraint, which still allows patch-level movement the team may not have wanted either.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'Adding more digits to a ~> version constraint (like going from "~> 5.0" to "~> 5.0.1") is always a strictly more precise, backward-compatible refinement of the same range.',
      reality: 'Per this subtopic\'s theory, adding a patch digit changes which segment ~> is allowed to increment — it silently NARROWS the range by also locking the minor version, rejecting versions (like a new minor release) that the original two-segment constraint would have accepted.'
    },
    {
      thought: 'The ~> operator always means "this major version, any minor or patch release" regardless of how many segments are written.',
      reality: 'Per this subtopic\'s theory, ~> only allows the RIGHTMOST segment you actually write to increment — a two-segment constraint locks the major version, but a three-segment constraint locks both the major AND minor version, only allowing the patch to move.'
    },
    {
      thought: 'There is one universally correct number of segments to use in a ~> constraint — best practice is to always use the most precise (three-segment) form for maximum reproducibility.',
      reality: 'Per this subtopic\'s theory, the choice is a deliberate tradeoff, not a best-practice default: two segments accepts automatic minor-version upgrades (new features, but also occasional behavior changes), while three segments requires a conscious constraint edit to move to a new minor version — which form is "correct" depends on how much automatic movement the team wants.'
    }
  ];
}
