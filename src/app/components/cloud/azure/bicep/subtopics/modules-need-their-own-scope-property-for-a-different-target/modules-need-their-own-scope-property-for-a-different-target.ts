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
  templateUrl: './modules-need-their-own-scope-property-for-a-different-target.html',
  styleUrl: './modules-need-their-own-scope-property-for-a-different-target.scss'
})
export class ModulesNeedTheirOwnScopePropertyForADifferentTargetSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page mentions module scope isolation, but never how to actually TARGET a different scope',
      points: [
        'The main page\'s own theory states, as its very last point on modules: "Modules isolate scope — a module can be deployed at a different scope than its parent (e.g. create a resource group at subscription scope from a module called from a resource-group-scope file)." This confirms the CAPABILITY exists but gives no syntax, no property name, and — notably — describes the example backwards from how the feature is actually used.',
        'None of the main page\'s three module code examples ever set a scope at all — every module call in "Modules & Params File" deploys implicitly to the same scope as its parent file, which is the DEFAULT behavior, not a demonstration of the scope-targeting feature the theory bullet claims exists.',
      ]
    },
    {
      heading: 'Confirmed via Microsoft\'s own modules documentation: the scope property, and what happens without it',
      points: [
        'Per Microsoft\'s own documentation: "If you need to specify a scope that\'s different from the scope for the main file, add the scope property." And on the default: "When you don\'t provide the scope property, the module is deployed at the parent\'s target scope." A module with no scope property doesn\'t inherit "no particular scope" — it silently deploys to whatever targetScope the calling file itself is set to.',
        'Microsoft\'s own worked example is the realistic version of the main page\'s own scenario, and it runs the OPPOSITE direction from how the main page describes it: a subscription-scoped file creates a NEW resource group, then deploys a module INTO that new resource group by setting scope to the resource group\'s own symbolic name — "resource newRG \'Microsoft.Resources/resourceGroups@2025-04-01\' = { name: resourceGroupName, ... } ... module stgModule \'...\' = { name: \'storageDeploy\', scope: newRG, params: { ... } }." The module\'s resources are deployed inside the resource group the same file just created — not the reverse of "creating a resource group from a module."',
        'The scope property accepts either a symbolic name for a resource group/subscription/management group the SAME file declares (as above), or one of four scope functions for referencing something the file doesn\'t declare itself: resourceGroup(), subscription(), managementGroup(), and tenant() — the same function family used for existing-resource references.',
      ]
    },
    {
      heading: 'A realistic pattern this unlocks: two modules, two different resource groups, one deployment',
      points: [
        'Confirmed via Microsoft\'s own second worked example, a single subscription-scoped file can deploy to MULTIPLE pre-existing resource groups in one run — reference each with existing, then give each module a different scope: "resource firstRG \'...\' existing = { name: \'demogroup1\' } ... module storage1 \'...\' = { scope: firstRG, ... } ... resource secondRG \'...\' existing = { name: \'demogroup2\' } ... module storage2 \'...\' = { scope: secondRG, ... }." Two independent resource groups, provisioned by one coordinated template run.',
        'This is the mechanism underneath a genuinely common real-world need the main page\'s own theory implies but never shows how to build — a "landing zone" style template that creates the resource group AND everything inside it in one deployment, or a hub-and-spoke pattern that fans out identical modules into several already-existing resource groups from a single subscription-scoped entry point.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'The realistic version of the main page\'s own example: create an RG, then deploy INTO it',
      language: 'bash',
      code: `// Per Microsoft's own docs -- a subscription-scoped file that
// creates a NEW resource group, then deploys a module's resources
// INSIDE that new resource group (not "a resource group FROM a
// module," as the main page's own theory bullet describes it):

targetScope = 'subscription'

@minLength(3)
@maxLength(11)
param namePrefix string
param location string = deployment().location

var resourceGroupName = '\${namePrefix}rg'

resource newRG 'Microsoft.Resources/resourceGroups@2025-04-01' = {
  name: resourceGroupName
  location: location
}

module stgModule '../create-storage-account/main.bicep' = {
  name: 'storageDeploy'
  scope: newRG          // <-- the module targets the RG this SAME
                         //     file just declared, by symbolic name
  params: {
    storagePrefix: namePrefix
    location: location
  }
}

output storageEndpoint object = stgModule.outputs.storageEndpoint

// Without the scope property here, per Microsoft's own docs ("the
// module is deployed at the parent's target scope"), stgModule
// would try to deploy at SUBSCRIPTION scope -- the same scope as
// this file -- which is the wrong scope for a storage account
// resource entirely, and would fail.`,
    },
    {
      label: 'One deployment, two existing resource groups, via scope on each module',
      language: 'bash',
      code: `// Per Microsoft's own second worked example: fan out modules to
// MULTIPLE pre-existing resource groups from one subscription-
// scoped file:

targetScope = 'subscription'

resource firstRG 'Microsoft.Resources/resourceGroups@2025-04-01' existing = {
  name: 'demogroup1'
}

resource secondRG 'Microsoft.Resources/resourceGroups@2025-04-01' existing = {
  name: 'demogroup2'
}

module storage1 '../create-storage-account/main.bicep' = {
  name: 'westusdeploy'
  scope: firstRG
  params: { storagePrefix: 'stg1', location: 'westus' }
}

module storage2 '../create-storage-account/main.bicep' = {
  name: 'eastusdeploy'
  scope: secondRG
  params: { storagePrefix: 'stg2', location: 'eastus' }
}

// Both resource groups must already exist -- existing (per the
// prior subtopic) is what makes 'firstRG'/'secondRG' valid scope
// targets without this file trying to create them.

// The same scope property also accepts a scope FUNCTION, not just
// a symbolic name, for scopes the file doesn't declare at all:
param managementGroupName string

module mgDeploy 'main.bicep' = {
  name: 'deployToMG'
  scope: managementGroup(managementGroupName)
}`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A developer writes a subscription-scoped Bicep file (targetScope = \'subscription\') that first creates a new resource group, then calls a module to deploy a storage account, intending for the storage account to land inside that new resource group. They copy the main page\'s own module syntax exactly — module stgModule \'./storage.bicep\' = { name: \'storageDeploy\', params: { ... } } — with no scope property. The deployment fails with a scope-related error. Why?',
    hint: 'Check what Microsoft\'s own documentation says happens when a module\'s scope property is left unset — does the module get deployed to the resource group it\'s "near," or to something else entirely?',
    solution: 'The module has no scope property, so per Microsoft\'s own documentation, "when you don\'t provide the scope property, the module is deployed at the parent\'s target scope" — and the parent file\'s targetScope is subscription, not the newly-created resource group. The module (which contains a storage account resource, a resource-group-scoped resource type) is being asked to deploy at subscription scope, which is invalid for that resource type, causing the failure. The developer\'s mistake was assuming physical proximity in the file (the module call appears right after the resource group declaration) implies a scope relationship — it doesn\'t. The fix is adding scope: newRG (using the resource group\'s own symbolic name) to the module block, explicitly targeting the module\'s deployment at the resource group the same file just created, exactly as shown in Microsoft\'s own worked example for this precise scenario.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'A module declared right after a resource group in the same Bicep file automatically deploys into that resource group.',
      reality: 'Per this subtopic\'s theory, Microsoft\'s own documentation confirms a module with no scope property deploys at the PARENT FILE\'s own target scope, regardless of what resources are declared nearby in the file — an explicit scope property (set to the resource group\'s symbolic name) is required to target it.'
    },
    {
      thought: 'The main page\'s own description of module scope — "create a resource group at subscription scope from a module called from a resource-group-scope file" — is the realistic way this feature gets used.',
      reality: 'Per this subtopic\'s theory, Microsoft\'s own worked examples run the opposite direction — a subscription-scoped FILE creates the resource group directly (not from within a module), and then a module\'s resources are deployed INTO that resource group via its scope property.'
    },
    {
      thought: 'The scope property on a module only accepts one of the four built-in scope functions (resourceGroup(), subscription(), managementGroup(), tenant()).',
      reality: 'Per this subtopic\'s theory, Microsoft\'s own examples show scope also accepts a plain symbolic name — a resource group, subscription, or management group resource declared or referenced (via existing) in the SAME file — which is the more common pattern when the target scope is something the file itself creates or already knows about.'
    }
  ];
}
