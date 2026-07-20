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
  templateUrl: './incremental-mode-never-deletes-unmanaged-resources.html',
  styleUrl: './incremental-mode-never-deletes-unmanaged-resources.scss'
})
export class IncrementalModeNeverDeletesUnmanagedResourcesSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page\'s own Bicep deploy step sets --mode Incremental with no explanation of what that mode actually means, or what the alternative would do',
      points: [
        'The main page\'s own "Bicep — Deploy" Azure DevOps task runs `az deployment group create ... --mode Incremental`. The mode is set explicitly, but nothing on the page explains what "Incremental" actually does, or what would change if it were set to the only other option, "Complete."',
        'A reader coming from Terraform (which the main page\'s own theory covers extensively earlier) has a specific, reasonable mental model already in place: Terraform\'s own declarative reconciliation removes resources from the real infrastructure when they\'re removed from the config, by default, with no separate "mode" flag needed at all. It would be a natural, wrong assumption that Bicep\'s "Incremental" mode works the same way.',
      ]
    },
    {
      heading: 'Incremental does the OPPOSITE of Terraform\'s default reconciliation — and that\'s deliberate',
      points: [
        'Microsoft\'s own documentation states the distinction directly: "In incremental mode, Resource Manager leaves unchanged resources that exist in the resource group but aren\'t specified in the template." A resource created manually, by a different tool, or removed from a later version of the Bicep file is simply left alone — Incremental mode never deletes anything on its own.',
        'The alternative, Complete mode, is what actually behaves like Terraform\'s default: per Microsoft\'s own docs, "In complete mode, Resource Manager deletes resources that exist in the resource group but aren\'t specified in the template." Microsoft\'s own worked example makes this concrete — a resource group with resources A, B, C, deployed against a template containing A, B, D: incremental mode results in A, B, C, D (C survives); complete mode results in A, B, D (C is deleted).',
        'Microsoft\'s own docs are explicit that Incremental — exactly what the main page\'s own step already uses — is "the recommended deployment mode," while "Complete mode is not recommended," specifically pointing toward newer deployment stacks for any scenario that genuinely needs deletion-on-removal semantics. The main page\'s own choice is the safe, correct default — it just never says so, or what the riskier alternative would have done differently.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Microsoft\'s own worked example, applied to the main page\'s own resource group',
      language: 'bash',
      code: `# Resource group BEFORE this deployment:
#   - App Service Plan (myapp-plan)
#   - Web App (myapp)
#   - SQL Server (myapp-sql)
#   - A storage account someone created manually last month,
#     completely unrelated to this Bicep template

# The main page's own main.bicep template defines:
#   - App Service Plan
#   - Web App
#   - SQL Server
#   - SQL Database
# (no mention of the manually-created storage account at all --
#  it was never part of this template to begin with)

az deployment group create \\
  --resource-group myapp-rg \\
  --template-file infra/main.bicep \\
  --parameters @infra/prod.bicepparam \\
  --mode Incremental        # <-- the main page's own exact flag

# Per Microsoft's own docs: "leaves unchanged resources that exist
# in the resource group but aren't specified in the template."
#
# Result: App Service Plan, Web App, SQL Server, SQL Database all
# created/updated as defined. The manually-created storage account
# is left completely alone -- Incremental mode has no concept of
# "things not in this template should be removed" at all.`,
    },
    {
      label: 'What --mode Complete would have done instead, to the SAME scenario',
      language: 'bash',
      code: `# Identical resource group, identical template -- only the mode
# flag changes:

az deployment group create \\
  --resource-group myapp-rg \\
  --template-file infra/main.bicep \\
  --parameters @infra/prod.bicepparam \\
  --mode Complete           # <-- the ONLY other valid value

# Per Microsoft's own docs: "deletes resources that exist in the
# resource group but aren't specified in the template."
#
# Result: App Service Plan, Web App, SQL Server, SQL Database all
# created/updated as defined -- SAME as incremental so far. But the
# manually-created storage account, which appears nowhere in
# main.bicep, is DELETED as part of this same deployment -- purely
# because it existed in the resource group and wasn't declared in
# the template being applied.

# Per Microsoft's own docs: "Always use the what-if operation
# before deploying a template in complete mode... to avoid
# unintentionally deleting resources" -- precisely because this
# mode can delete things the person running the deployment may not
# even know exist in that resource group.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A developer, coming from a Terraform background, is troubleshooting why a colleague\'s manually-created (but perfectly legitimate, still-in-use) storage account keeps surviving every Bicep redeploy of the same resource group, "as if Bicep just doesn\'t clean up unmanaged resources the way Terraform does." They ask whether Bicep is simply missing a feature Terraform has. Using this subtopic\'s theory, correct this framing.',
    hint: 'Per this subtopic\'s theory, is "delete anything not in the template" something Bicep is INCAPABLE of, or something it deliberately doesn\'t do by DEFAULT?',
    solution: 'Bicep isn\'t missing this capability — it has it, exactly matching what the developer expects from Terraform, but per this subtopic\'s theory, it\'s a separate, explicit, non-default choice (`--mode Complete`) rather than automatic behavior. The main page\'s own deployment step uses `--mode Incremental`, which per Microsoft\'s own docs "leaves unchanged resources that exist in the resource group but aren\'t specified in the template" — this is why the manually-created storage account survives every redeploy, and it will keep surviving as long as Incremental mode is used, regardless of how many times the deployment runs. If the team genuinely wants Terraform-like prune-on-removal behavior, `--mode Complete` provides it — but per Microsoft\'s own docs, Complete "is not recommended" specifically because of scenarios like this one (an unrelated, still-in-use resource getting silently deleted for the sole reason that it wasn\'t declared in this particular template), and Microsoft explicitly recommends running the what-if operation first and considering deployment stacks instead for genuine deletion needs.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'Bicep\'s Incremental deployment mode (the main page\'s own default choice) works like Terraform\'s default behavior — resources removed from the template get removed from the real infrastructure too.',
      reality: 'Per this subtopic\'s theory, Microsoft\'s own docs describe the opposite: Incremental mode "leaves unchanged resources that exist in the resource group but aren\'t specified in the template" — nothing gets deleted just because it\'s absent from the template. The Terraform-like prune-on-removal behavior is what Complete mode does instead, and it\'s the non-default, explicitly-opt-in option.'
    },
    {
      thought: 'Since Complete mode more closely matches what Terraform users are used to, it must be the safer or more thorough choice for production Bicep deployments.',
      reality: 'Per this subtopic\'s theory, Microsoft\'s own docs state the opposite explicitly — "Incremental mode is the recommended deployment mode" while "Complete mode is not recommended," precisely because Complete can delete resources a specific template was never even aware of, including things unrelated teams or manual processes created.'
    },
    {
      thought: 'The main page\'s own --mode Incremental flag is likely just a default value being passed explicitly for clarity, with no real behavioral consequence either way.',
      reality: 'This subtopic\'s two code examples show the mode choice has a genuine, concrete consequence — applied to the identical resource group and template, Incremental leaves an unrelated resource untouched while Complete deletes it. The flag is load-bearing, not decorative.'
    }
  ];
}
