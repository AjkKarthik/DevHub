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
  templateUrl: './soft-mandatory-overrides-need-a-specific-tfc-permission-not-just-plan-access.html',
  styleUrl: './soft-mandatory-overrides-need-a-specific-tfc-permission-not-just-plan-access.scss'
})
export class SoftMandatoryOverridesNeedASpecificTfcPermissionNotJustPlanAccessSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page names the three Sentinel modes without saying who is actually allowed to use the override one',
      points: [
        'The main page\'s theory bullet says: "Sentinel modes: advisory (warn only), soft-mandatory (overridable with permission), hard-mandatory (block)." The phrase "overridable with permission" names that a permission is involved, but never says WHICH permission, or who holds it by default — details that matter for anyone actually designing a policy enforcement strategy.',
      ]
    },
    {
      heading: 'The actual gate: a specific, named HCP Terraform/TFE permission, not general workspace access',
      points: [
        'Overriding a failed soft-mandatory policy check requires the "Manage Policy Overrides" permission — or, by default, the broader "Manage Policies" permission — at the organization level. Having permission to trigger runs, approve applies, or even manage the workspace itself does NOT automatically include the ability to override a soft-mandatory policy failure; these are genuinely separate permission grants.',
        'Organization owners always retain override ability. Beyond that, an organization admin can choose to delegate override authority more broadly (to all team members) or more narrowly (to specific project/workspace managers) — meaning the actual answer to "who can override this policy" is an organization-specific configuration choice, not a fixed property of the soft-mandatory enforcement level itself.',
      ]
    },
    {
      heading: 'The practical consequence: soft-mandatory is a genuine access-control boundary, not just a "softer" version of hard-mandatory',
      points: [
        'Because overriding requires a specific permission most ordinary contributors don\'t hold by default, a soft-mandatory policy in practice behaves close to hard-mandatory for the average team member — the meaningful difference from hard-mandatory is that a PRIVILEGED user (an org owner, or someone explicitly granted override authority) has an escape hatch for legitimate exceptions, while hard-mandatory has none at all, for anyone, ever.',
        'An override on one run does not weaken future policy enforcement — it is scoped to that specific failed run only; the same soft-mandatory policy is evaluated fresh (and can fail again) on every subsequent run.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'A soft-mandatory policy definition',
      language: 'bash',
      code: `# sentinel.hcl
policy "require-tags" {
  source            = "./policies/require-tags.sentinel"
  enforcement_level = "soft-mandatory"
}

# require-tags.sentinel fails this run because "CostCenter" tag is missing.
# The run is BLOCKED by default -- same as hard-mandatory, at this point.`,
    },
    {
      label: 'Who can actually unblock it',
      language: 'bash',
      code: `# A run blocked by a soft-mandatory policy failure shows an
# "Override & Continue" option in the HCP Terraform UI -- but
# only to users who hold one of:
#
#   1. Organization Owner (always has override ability)
#   2. "Manage Policy Overrides" permission (explicit grant)
#   3. "Manage Policies" permission (default override-capable role)
#
# A regular team member with only "write" access to the workspace
# (able to trigger plans/applies) sees the SAME blocked run, but
# has NO "Override & Continue" option at all -- from their view,
# a soft-mandatory failure behaves identically to hard-mandatory.
#
# Org admins configure WHO gets override authority under:
# Organization Settings > Policies > (delegate to project/workspace
# managers, or grant broadly to all team members)`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A team sets a Sentinel policy to soft-mandatory specifically so that legitimate exceptions can be reviewed and allowed through, rather than being hard-blocked. A developer with standard workspace "write" access (able to trigger plans and applies) hits a soft-mandatory failure and expects to see an override option, matching what the docs describe. They don\'t see one. Why not, and what would actually need to change for them to get it?',
    hint: 'Does workspace write access (triggering plans/applies) include the specific permission needed to override a policy failure?',
    solution: 'The developer doesn\'t see an override option because workspace write access and policy-override authority are separate permission grants — a soft-mandatory failure can only be overridden by an organization owner, or a user explicitly holding the "Manage Policy Overrides" permission (or, by default, "Manage Policies"). Regular workspace write access to trigger plans and applies does not include either of these. For the developer to gain override ability, an organization admin would need to either grant them the "Manage Policy Overrides" permission directly, or delegate override authority more broadly to all team members at the organization level — a deliberate configuration change, not something that comes automatically with normal workspace access.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'Since the main page describes soft-mandatory as "overridable with permission," any team member who can trigger a plan or apply on the workspace can also override a soft-mandatory policy failure on that same run.',
      reality: 'Per this subtopic\'s theory, overriding a soft-mandatory failure requires a specific, separate permission ("Manage Policy Overrides" or, by default, "Manage Policies") — ordinary workspace write access to trigger plans/applies does not include this ability.'
    },
    {
      thought: 'Soft-mandatory is meaningfully "softer" than hard-mandatory for everyone on the team, since it can technically be overridden.',
      reality: 'Per this subtopic\'s theory, for a team member without override permission, a soft-mandatory failure blocks the run exactly like hard-mandatory does — the practical difference only shows up for privileged users (org owners or those explicitly granted override authority).'
    },
    {
      thought: 'Overriding a soft-mandatory policy failure once permanently weakens or disables that policy for the workspace going forward.',
      reality: 'Per this subtopic\'s theory, an override is scoped to the specific failed run only — the same policy is evaluated fresh on every subsequent run and can fail (and require another override) again.'
    }
  ];
}
