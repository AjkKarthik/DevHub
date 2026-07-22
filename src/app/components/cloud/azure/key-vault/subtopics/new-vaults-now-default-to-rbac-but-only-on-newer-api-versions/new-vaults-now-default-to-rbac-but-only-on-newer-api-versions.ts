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
  templateUrl: './new-vaults-now-default-to-rbac-but-only-on-newer-api-versions.html',
  styleUrl: './new-vaults-now-default-to-rbac-but-only-on-newer-api-versions.scss'
})
export class NewVaultsNowDefaultToRbacButOnlyOnNewerApiVersionsSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page\'s own "mistake" example assumes access policies are always the silent default',
      points: [
        'The main page\'s own mistakes section states: "az keyvault create --name my-kv # Default uses access policies — vault-level, coarse-grained" as the wrong example, with the fix being to add --enable-rbac-authorization true explicitly. This framing treats access-policy-by-default as a fixed, permanent behavior of Key Vault vault creation.',
        'That default recently changed — but only under specific conditions the main page\'s framing doesn\'t account for, which means the "wrong" example isn\'t uniformly wrong anymore, and isn\'t uniformly fixed just by knowing the flag exists.',
      ]
    },
    {
      heading: 'Confirmed via Microsoft\'s own RBAC guide: RBAC is now the default, but only from a specific API version forward',
      points: [
        'Per Microsoft\'s own documentation: "Starting with API version 2026-02-01, Azure RBAC is the default access control model for newly created key vaults." A vault created with a request using that API version (or later) gets RBAC automatically — no --enable-rbac-authorization flag needed at all.',
        'The word "starting" is doing real work here — this is a recent, dated change, not something that has always been true. A vault created via any tooling or template still pinned to an OLDER API version continues to default to the legacy access-policy model, exactly as the main page\'s own mistake example describes.',
        'This creates a genuinely tricky situation: two teams both running "az keyvault create --name my-kv" with no explicit RBAC flag can get DIFFERENT results depending on which API version their CLI/SDK version, Bicep/ARM template, or Terraform provider happens to target under the hood — one gets RBAC by default, the other silently gets access policies, with no visible difference in the command they typed.',
      ]
    },
    {
      heading: 'What this means for reliably getting the intended permission model',
      points: [
        'The main page\'s own advice — explicitly pass --enable-rbac-authorization true — remains the single most reliable way to guarantee RBAC regardless of which API version the underlying tooling defaults to. Relying on "the platform default" is no longer a safe assumption either way, since that default itself now depends on API version.',
        'Infrastructure-as-code templates (Bicep, ARM, Terraform) that create Key Vaults should explicitly set the RBAC authorization property rather than omitting it and assuming a particular outcome — a template pinned to an older API version for compatibility reasons (a common, deliberate choice in mature IaC codebases) will silently default to access policies even after this platform-wide default change.',
        'For an EXISTING vault, none of this API-version default behavior applies retroactively — an existing vault\'s permission model stays whatever it was explicitly set to (or defaulted to at creation time); the new default only affects vaults created fresh with a sufficiently new API version, never converts existing ones.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Two identical-looking commands, two different outcomes',
      language: 'bash',
      code: `# Team A: recent Azure CLI, targets a current API version by default
az keyvault create --name team-a-kv --resource-group rg-a --location eastus
# Per Microsoft's own docs: "Starting with API version 2026-02-01,
# Azure RBAC is the default access control model for newly created
# key vaults." This vault gets RBAC automatically -- no flag needed.

# Team B: same command, but their IaC pipeline pins an older API
# version for backward compatibility with existing templates
az deployment group create \\
  --resource-group rg-b \\
  --template-file keyvault.bicep
# keyvault.bicep specifies apiVersion: '2023-07-01' explicitly --
# this vault STILL defaults to the legacy access-policy model, even
# though the platform-wide default has moved on. Nothing in the
# command output visibly signals this difference.

# The reliable fix, regardless of API version defaults either way:
az keyvault create --name my-kv --resource-group my-rg \\
  --enable-rbac-authorization true`,
    },
    {
      label: 'Making the choice explicit in IaC rather than relying on defaults',
      language: 'bash',
      code: `# Bicep: always set the RBAC property explicitly -- don't omit it
# and rely on whatever API version the template happens to target
cat <<'EOF' > keyvault.bicep
resource kv 'Microsoft.KeyVault/vaults@2026-02-01' = {
  name: 'my-kv'
  location: resourceGroup().location
  properties: {
    tenantId: subscription().tenantId
    sku: { family: 'A', name: 'standard' }
    enableRbacAuthorization: true   // explicit -- don't rely on the
                                     // API version's own default
    enableSoftDelete: true
    enablePurgeProtection: true
  }
}
EOF

# Checking an EXISTING vault's actual current permission model
# (recovery doesn't apply here -- this just confirms current state):
az keyvault show --name my-kv --resource-group my-rg \\
  --query "properties.enableRbacAuthorization"`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'Two teams in the same organization both run a plain "az keyvault create" command with no RBAC flag, expecting identical results since they\'re running the exact same command. Team A\'s vault ends up using Azure RBAC; Team B\'s vault ends up using the legacy access-policy model. Both insist they didn\'t pass any special flags. What\'s the most likely explanation?',
    hint: 'Check what specifically determines the default permission model for a newly created vault today, and whether it depends only on the command typed or also on something about the underlying tooling.',
    solution: 'The most likely explanation is that the two teams\' underlying tooling (CLI version, SDK, or an IaC template) targeted different Key Vault API versions under the hood. Per Microsoft\'s own documentation, "starting with API version 2026-02-01, Azure RBAC is the default access control model for newly created key vaults" — but only for requests actually using that API version or later. If Team B\'s environment (an older CLI installation, a pinned API version in a Bicep/Terraform template) issued the creation request against an older API version, their vault would still default to the legacy access-policy model, with no visible difference in the command itself. The reliable fix for both teams going forward is to explicitly pass --enable-rbac-authorization true (or its IaC template equivalent) rather than relying on whatever the platform default happens to be for their specific tooling.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'Azure Key Vault has always defaulted to the legacy access-policy permission model when no RBAC flag is specified, and this has never changed.',
      reality: 'Per this subtopic\'s theory, Microsoft\'s own documentation states this default recently changed: "Starting with API version 2026-02-01, Azure RBAC is the default access control model for newly created key vaults" — a dated, specific platform change, not a permanent historical fact.'
    },
    {
      thought: 'Since Azure RBAC is now the default for new Key Vaults, explicitly passing --enable-rbac-authorization true is no longer necessary and can be safely omitted.',
      reality: 'Per this subtopic\'s theory, the new default only applies when the underlying request actually uses API version 2026-02-01 or later — tooling or templates pinned to an older API version still default to access policies, making the explicit flag the only reliable way to guarantee RBAC regardless of which API version is in play.'
    },
    {
      thought: 'The new RBAC-by-default behavior applies retroactively to existing Key Vaults, automatically converting them from access policies to RBAC.',
      reality: 'Per this subtopic\'s theory, this default only affects vaults created fresh using a sufficiently new API version — it has no effect on the permission model of an existing vault, which keeps whatever model it was explicitly set to or defaulted to at its own original creation time.'
    }
  ];
}
