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
  templateUrl: './opa-conftest-enforcement-is-a-ci-pipeline-responsibility-not-native.html',
  styleUrl: './opa-conftest-enforcement-is-a-ci-pipeline-responsibility-not-native.scss'
})
export class OpaConftestEnforcementIsACiPipelineResponsibilityNotNativeSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page lists Sentinel and OPA/conftest side by side, as if they enforce the same way',
      points: [
        'The main page\'s theory bullets describe both in the same "Policy as Code" section: Sentinel with its three enforcement levels (advisory, soft-mandatory, hard-mandatory), and then "OPA... enforces policies against terraform plan JSON output" and "conftest... enforces .rego policies." Placed together like this, it reads as though OPA/conftest has some equivalent built-in enforcement mechanism to Sentinel\'s — it does not.',
      ]
    },
    {
      heading: 'The real difference: Sentinel is wired into HCP Terraform/TFE\'s own run pipeline; OPA/conftest is not wired into anything',
      points: [
        'Sentinel policies run as a native step INSIDE the HCP Terraform / Terraform Enterprise run lifecycle — between plan and apply, automatically, for every run in a workspace with that policy set attached. There is nothing else to configure for a Sentinel policy to actually block or warn on a run; the enforcement level itself IS the mechanism.',
        'OPA and conftest are standalone CLI tools with no awareness of a Terraform "run" at all — <code>conftest test plan.json</code> is just a command that exits non-zero if a .rego policy fails. Nothing about running that command is automatically triggered by, or wired into, a <code>terraform plan</code> or <code>terraform apply</code> — it only enforces anything if a CI pipeline is explicitly configured to run it and to actually fail the pipeline (and therefore block the merge or the apply step) when it exits non-zero.',
      ]
    },
    {
      heading: 'The practical consequence: OPA/conftest\'s "enforcement" is only as strong as the CI wiring around it',
      points: [
        'A team that runs conftest in CI but doesn\'t make that CI job\'s failure block the actual merge/apply has, in effect, built the equivalent of Sentinel\'s "advisory" mode — a warning that\'s easy to ignore — even if their intention was closer to "hard-mandatory." Since conftest itself has no enforcement-level concept, the CI pipeline configuration (does a failed check block the merge? does it block a subsequent apply job?) is entirely what determines whether OPA policies are advisory, soft, or hard in practice.',
        'This also means OPA/conftest policies apply only where they are explicitly plugged in — a developer running <code>terraform apply</code> locally, bypassing CI entirely, has no OPA check running at all, unlike a Sentinel policy attached to a workspace, which HCP Terraform/TFE enforces on every run through that workspace regardless of who or what triggered it.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Sentinel: enforcement is automatic, built into the run',
      language: 'bash',
      code: `# sentinel.hcl -- attached to a workspace's policy set
policy "require-tags" {
  source            = "./policies/require-tags.sentinel"
  enforcement_level = "hard-mandatory"
}

# Every terraform apply through THIS workspace in HCP Terraform
# automatically runs this policy between plan and apply.
# No CI configuration is needed to make this "enforce" anything --
# the enforcement_level IS the enforcement mechanism, HCP Terraform
# itself blocks the run if it's hard-mandatory and fails.`,
    },
    {
      label: 'OPA/conftest: enforcement is whatever the CI job does',
      language: 'bash',
      code: `# require-tags.rego
package main

deny[msg] {
  resource := input.resource_changes[_]
  not resource.change.after.tags.CostCenter
  msg := sprintf("%s missing CostCenter tag", [resource.address])
}

# .github/workflows/terraform.yml
- name: Terraform Plan
  run: terraform plan -out=tfplan
- name: Convert plan to JSON
  run: terraform show -json tfplan > plan.json
- name: Run OPA policy check
  run: conftest test plan.json --policy policies/
  # If this step's exit code is non-zero, does the WORKFLOW actually
  # stop here? That depends entirely on how this job is configured --
  # conftest itself has no "hard-mandatory" concept. If a later job
  # (e.g. the apply job) doesn't explicitly depend on this check
  # passing, a failed conftest run does NOT block anything by itself.
- name: Terraform Apply
  needs: [terraform-plan-and-policy-check]   # <- THIS is what makes it enforce
  run: terraform apply tfplan`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A team adds a conftest policy check as a CI step, intending it to act like Sentinel\'s hard-mandatory level — no run should ever apply if the policy fails. Six months later, an audit finds several applies went through despite failing conftest checks. What is the most likely root cause, given how OPA/conftest enforcement actually works compared to Sentinel?',
    hint: 'Does conftest itself have a concept of "block the apply," or is that something else\'s job?',
    solution: 'The most likely root cause is that the CI pipeline\'s apply job was never actually configured to depend on (and be blocked by) the conftest check step\'s exit code — conftest itself has no built-in enforcement level or awareness of whether an apply should proceed; it is just a command that exits non-zero on a failed policy. Unlike Sentinel, which is wired directly into HCP Terraform/TFE\'s own run pipeline and blocks a hard-mandatory failure automatically with no extra configuration, OPA/conftest enforcement is entirely a property of how the CI pipeline is wired — if the apply job (or the merge itself) isn\'t explicitly gated on the policy-check job succeeding, a failing conftest run is effectively advisory-only, regardless of the team\'s original intent.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'Since the main page lists OPA/conftest in the same "Policy as Code" section as Sentinel, both provide equivalent enforcement-level options (advisory / soft-mandatory / hard-mandatory) out of the box.',
      reality: 'Per this subtopic\'s theory, only Sentinel has native enforcement levels wired into HCP Terraform/TFE\'s own run pipeline — OPA/conftest is a standalone CLI tool with no enforcement-level concept at all; whether it behaves as advisory or hard-blocking depends entirely on how a CI pipeline is configured around it.'
    },
    {
      thought: 'Adding a conftest policy check as a CI step automatically prevents a failing apply from going through, the same way attaching a hard-mandatory Sentinel policy to a workspace does.',
      reality: 'Per this subtopic\'s theory, a conftest step failing does nothing on its own — the CI pipeline must be explicitly configured (e.g. making the apply job depend on the policy-check job) for a failure to actually block anything.'
    },
    {
      thought: 'OPA/conftest policies apply to every way Terraform could be run against a given configuration, the same way a Sentinel policy attached to a workspace covers every run through that workspace.',
      reality: 'Per this subtopic\'s theory, OPA/conftest only runs where it is explicitly plugged into a pipeline — a local terraform apply run outside CI has no OPA check at all, unlike a Sentinel policy, which HCP Terraform/TFE enforces on every run through the workspace regardless of trigger source.'
    }
  ];
}
