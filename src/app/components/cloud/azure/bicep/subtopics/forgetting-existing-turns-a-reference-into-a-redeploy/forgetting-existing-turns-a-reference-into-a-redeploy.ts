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
  templateUrl: './forgetting-existing-turns-a-reference-into-a-redeploy.html',
  styleUrl: './forgetting-existing-turns-a-reference-into-a-redeploy.scss'
})
export class ForgettingExistingTurnsAReferenceIntoARedeploySubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page\'s own QnA describes symbolic references only for resources THIS file creates',
      points: [
        'The main page\'s own QnA states: "Use the resource\'s symbolic name. When you declare resource storage \'...\' = { ... }, you can then reference storage.id, storage.name, and any property... Bicep infers the dependency automatically." Every resource block on the main page — the storage account, the looped storage accounts, the conditional Redis cache — is something the template is CREATING.',
        'Nothing on the main page addresses the very common, different scenario: reading a property off a resource that already exists and was NOT deployed by this template — an existing Key Vault to pull a URI from, an existing VNet to attach a subnet to, an existing Log Analytics workspace to point diagnostics at. The main page\'s own resource syntax, used as-is for this purpose, silently does something else entirely.',
      ]
    },
    {
      heading: 'Confirmed via Microsoft\'s own documentation: the existing keyword is what stops Bicep from redeploying it',
      points: [
        'Per Microsoft\'s own "Reference existing resource" documentation: "To reference an existing resource that isn\'t deployed in your current Bicep file, declare the resource with the existing keyword... The resource doesn\'t deploy again when the existing keyword references it." That last sentence is the direct, load-bearing consequence — it implies that a resource block referencing something already live, WITHOUT existing, is something Bicep WILL attempt to (re)deploy.',
        'The syntax itself looks almost identical to a normal declaration, which is exactly what makes the omission easy to miss: resource stg \'Microsoft.Storage/storageAccounts@2025-06-01\' existing = { name: \'examplestorage\' } — same resource type and API version syntax as any other block on the main page, with only the single existing keyword marking the difference in intent.',
        'For a resource in a DIFFERENT scope than the current file (a different resource group, subscription, or management group), Microsoft\'s own docs show the same existing block also takes a scope property: resource stg \'...\' existing = { name: \'examplestorage\'; scope: resourceGroup(exampleRG) } — the same scope function family the main page\'s own module coverage briefly mentions, applied here to a plain resource reference instead.',
      ]
    },
    {
      heading: 'What actually breaks if existing is left off — and what breaks if the reference is simply wrong',
      points: [
        'Declaring a resource block for something that already exists but WITHOUT existing puts that resource under this deployment\'s management — Azure Resource Manager issues its normal create-or-update operation against it as part of the deployment, using only the properties the Bicep file itself specifies. Any property the live resource actually has, that the Bicep block doesn\'t mention, is at risk of being reset rather than left alone, since the deployment now owns and fully describes that resource\'s desired state.',
        'This is a fundamentally different failure mode from a wrong reference — Microsoft\'s own troubleshooting note covers that separately: "If you attempt to reference a resource that doesn\'t exist, you get the NotFound error and your deployment fails. Check the name and scope of the resource you\'re trying to reference." A wrong name/scope on an existing reference fails loudly and immediately; a MISSING existing keyword on an otherwise-correct name/scope does not fail at all — it succeeds, having quietly taken over management of a resource the author never intended to redeploy.',
        'The practical discipline this implies: any time a Bicep resource block\'s purpose is purely "read a property from something that\'s already there" rather than "create or update this," the existing keyword is not optional cosmetic syntax — it is the one thing separating a safe read from an unintended write.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Referencing an already-live Key Vault the safe way',
      language: 'bash',
      code: `// Goal: read the URI of a Key Vault that was created separately
// (by a different team's template, or manually), NOT by this file.

// CORRECT -- the existing keyword marks this as a read-only reference:
resource kv 'Microsoft.KeyVault/vaults@2023-07-01' existing = {
  name: 'shared-team-vault'
}

resource app 'Microsoft.Web/sites@2023-01-01' = {
  name: 'my-app'
  location: resourceGroup().location
  properties: {
    siteConfig: {
      appSettings: [
        { name: 'KeyVaultUri', value: kv.properties.vaultUri }
      ]
    }
  }
}

// Per Microsoft's own docs: "The resource doesn't deploy again when
// the existing keyword references it." -- 'shared-team-vault' is
// read from, never touched by this deployment.

// A DIFFERENT resource group's Key Vault needs the scope property:
resource kvOtherRg 'Microsoft.KeyVault/vaults@2023-07-01' existing = {
  name: 'shared-team-vault'
  scope: resourceGroup('shared-services-rg')
}`,
    },
    {
      label: 'The same block WITHOUT existing — a silent redeploy risk, not a syntax error',
      language: 'bash',
      code: `// WRONG -- looks almost identical, but omits the existing keyword.
// This does NOT fail to compile or deploy -- it changes what the
// deployment actually DOES.

resource kv 'Microsoft.KeyVault/vaults@2023-07-01' = {
  name: 'shared-team-vault'
  location: resourceGroup().location
  properties: {
    // Only whatever THIS file happens to specify here --
    // tenantId, sku, accessPolicies, networkAcls, etc. -- is what
    // ARM now considers the desired state for 'shared-team-vault'.
    // Anything the vault ALREADY had configured, that this block
    // doesn't mention, is at risk during the create-or-update.
    tenantId: subscription().tenantId
    sku: { family: 'A', name: 'standard' }
  }
}

// Compare to a genuinely WRONG name/scope on an existing reference --
// that fails loudly and immediately:
resource kvTypo 'Microsoft.KeyVault/vaults@2023-07-01' existing = {
  name: 'shared-team-vualt'  // typo
}
// Per Microsoft's own docs: "If you attempt to reference a resource
// that doesn't exist, you get the NotFound error and your
// deployment fails." -- loud and immediate, the OPPOSITE failure
// mode of the missing-existing-keyword case above.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A developer needs their new Function App to read a connection string from an existing storage account that a different team\'s pipeline created and manages. They write resource stg \'Microsoft.Storage/storageAccounts@2023-01-01\' = { name: \'sharedteamstorage\' } (no existing keyword) purely to get access to stg.properties.primaryEndpoints.blob, and the deployment succeeds without any error. A week later the storage team reports their account\'s network rules were unexpectedly reset. What happened?',
    hint: 'Check what Microsoft\'s own documentation says happens to a resource block WITHOUT the existing keyword — does it only read from the resource, or does it become part of what this deployment manages?',
    solution: 'Omitting the existing keyword is exactly what caused this — the deployment succeeded because a resource block without existing is a perfectly valid instruction to CREATE OR UPDATE that resource, not merely read from it. Per Microsoft\'s own documentation, "the resource doesn\'t deploy again when the existing keyword references it" — the direct implication being that without it, the resource DOES get (re)deployed as part of this template. Because the developer\'s block only specified the bare minimum needed to read an output property, and said nothing about network rules, ARM treated the omitted network configuration as not part of the desired state and reset it to defaults during the create-or-update operation. The fix is adding the existing keyword: resource stg \'Microsoft.Storage/storageAccounts@2023-01-01\' existing = { name: \'sharedteamstorage\' } — this marks the block as a pure reference, and per the same documentation, the resource is never redeployed or modified by this template at all, only read from.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'A Bicep resource block that just specifies a name and reads a property from it — without setting many other properties — is automatically treated as a safe, read-only reference.',
      reality: 'Per this subtopic\'s theory, Microsoft\'s own documentation confirms a resource block is only treated as a pure reference when it explicitly includes the existing keyword — without it, the block is a real deployment instruction, and any properties it doesn\'t specify are at risk of being reset on the already-live resource.'
    },
    {
      thought: 'Forgetting the existing keyword on a resource that\'s meant to be referenced causes an immediate, obvious deployment error.',
      reality: 'Per this subtopic\'s theory, this is the opposite of what Microsoft\'s own troubleshooting guidance describes — a WRONG name or scope on an existing reference fails loudly with a NotFound error, but a MISSING existing keyword on an otherwise-correct block succeeds silently, having quietly taken over management of that resource.'
    },
    {
      thought: 'The existing keyword is only needed when referencing a resource in a completely different resource group or subscription — a same-resource-group reference doesn\'t need it.',
      reality: 'Per this subtopic\'s theory, Microsoft\'s own documentation shows the existing keyword is required for a same-scope reference too — the scope property is an ADDITIONAL requirement only for cross-scope references, layered on top of existing, not a substitute for it.'
    }
  ];
}
