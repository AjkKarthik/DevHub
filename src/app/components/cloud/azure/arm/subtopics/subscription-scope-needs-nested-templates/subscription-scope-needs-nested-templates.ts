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
  templateUrl: './subscription-scope-needs-nested-templates.html',
  styleUrl: './subscription-scope-needs-nested-templates.scss'
})
export class SubscriptionScopeNeedsNestedTemplatesSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page only ever shows "az deployment group create" — resource-group scope is presented as the only option',
      points: [
        'Every single deployment example on the main page — the storage account template, the CLI commands, the what-if examples — targets a resource group via "az deployment group create" / "az deployment group what-if". Nothing on the main page hints that ARM supports deploying at three OTHER scopes entirely: subscription, management group, and tenant.',
        'The main page\'s own challenge is built entirely around a resource ID that already includes a specific resourceGroups segment — reinforcing an implicit assumption that every deployment always targets one specific resource group.',
      ]
    },
    {
      heading: 'Subscription-level deployments use a different schema, and most ordinary resource types CANNOT go directly in the top-level template',
      points: [
        'Per Microsoft\'s own documentation, subscription-level deployments require an entirely different template schema: "The schema you use for subscription-level deployments is different than the schema for resource group deployments... https://schema.management.azure.com/schemas/2018-05-01/subscriptionDeploymentTemplate.json#". A resource-group-scoped template cannot simply be redeployed at subscription scope by changing the CLI command.',
        'Only a specific, documented whitelist of resource types can be placed directly in a subscription-level template\'s top-level resources array: "Not all resource types can be deployed to the subscription level." The whitelist covers things like resourceGroups, policyAssignments, roleAssignments, locks, budgets, and tags — but NOT ordinary application resources like storage accounts, VMs, or the main page\'s own storage-account example.',
        'To deploy an ordinary resource type (like the main page\'s own Microsoft.Storage/storageAccounts example) from a subscription-level template, you must wrap it in a NESTED deployment scoped to a specific resource group: "To deploy resources to a resource group within the subscription, add a nested deployment and include the resourceGroup property." Microsoft\'s own worked example creates a resource group AND deploys a storage account to it in the same template — but the storage account only appears inside a Microsoft.Resources/deployments resource with its own resourceGroup property, never directly in the outer template\'s resources array.',
        'The nested deployment must explicitly depend on the resource group\'s existence, since ARM cannot infer this dependency automatically: Microsoft\'s own example sets `"dependsOn": ["[resourceId(\'Microsoft.Resources/resourceGroups/\', parameters(\'rgName\'))]"]` on the nested deployment resource — without it, ARM could attempt to deploy the storage account before the resource group it belongs to actually exists.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'What does NOT work — a storage account directly at subscription scope',
      language: 'bash',
      code: `{
  "$schema": "https://schema.management.azure.com/schemas/2018-05-01/subscriptionDeploymentTemplate.json#",
  "contentVersion": "1.0.0.0",
  "resources": [
    {
      "type": "Microsoft.Storage/storageAccounts",
      "apiVersion": "2023-01-01",
      "name": "prodstore123",
      "location": "eastus",
      "sku": { "name": "Standard_LRS" },
      "kind": "StorageV2"
    }
  ]
}
# Deploying this with:
az deployment sub create --name demo --location eastus \\
  --template-file main.json
# FAILS -- Microsoft.Storage/storageAccounts is not one of the
# resource types supported directly at subscription scope. Per
# Microsoft's own docs, only specific types (resourceGroups,
# policyAssignments, roleAssignments, locks, budgets, tags, and a
# short whitelist of others) can go in a subscription-level
# template's own resources array.`,
    },
    {
      label: 'The correct pattern — resource group + nested deployment',
      language: 'bash',
      code: `{
  "$schema": "https://schema.management.azure.com/schemas/2018-05-01/subscriptionDeploymentTemplate.json#",
  "contentVersion": "1.0.0.0",
  "parameters": {
    "rgName": { "type": "string" },
    "rgLocation": { "type": "string" }
  },
  "resources": [
    {
      "type": "Microsoft.Resources/resourceGroups",
      "apiVersion": "2025-04-01",
      "name": "[parameters('rgName')]",
      "location": "[parameters('rgLocation')]",
      "properties": {}
    },
    {
      "type": "Microsoft.Resources/deployments",
      "apiVersion": "2025-04-01",
      "name": "storageDeployment",
      "resourceGroup": "[parameters('rgName')]",
      "properties": {
        "mode": "Incremental",
        "template": {
          "$schema": "https://schema.management.azure.com/schemas/2019-04-01/deploymentTemplate.json#",
          "contentVersion": "1.0.0.0",
          "resources": [
            {
              "type": "Microsoft.Storage/storageAccounts",
              "apiVersion": "2025-06-01",
              "name": "prodstore123",
              "location": "[parameters('rgLocation')]",
              "sku": { "name": "Standard_LRS" },
              "kind": "StorageV2"
            }
          ]
        }
      },
      "dependsOn": [
        "[resourceId('Microsoft.Resources/resourceGroups/', parameters('rgName'))]"
      ]
    }
  ]
}
# Now works: az deployment sub create --name demo --location eastus \\
#   --template-file main.json --parameters rgName=new-rg rgLocation=eastus
# -- creates the resource group AND the storage account inside it,
# in a single subscription-scoped deployment.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A team wants a single ARM template that creates a brand-new resource group AND deploys a storage account into it, in one deployment operation — reasoning that since a resource group deployment can\'t create its own resource group, they should switch to "az deployment sub create" and simply list both the resourceGroups resource and the storageAccounts resource in the same top-level resources array. Using this subtopic\'s theory, will this work?',
    hint: 'Per Microsoft\'s own documentation, is every Azure resource type eligible to appear directly in a subscription-level template\'s own top-level resources array?',
    solution: 'Per this subtopic\'s theory, this will NOT work as described — Microsoft\'s own documentation states "Not all resource types can be deployed to the subscription level," and ordinary application resource types like Microsoft.Storage/storageAccounts are not on the supported whitelist (which covers things like resourceGroups, policyAssignments, roleAssignments, locks, budgets, and tags). Simply switching the CLI command to az deployment sub create and listing both resources at the top level will fail once ARM reaches the storageAccounts resource. The correct approach, per Microsoft\'s own worked example, is to keep the resourceGroups resource directly in the subscription-level template\'s top-level resources array, but wrap the storage account inside a nested Microsoft.Resources/deployments resource with its own resourceGroup property pointing at the newly-created group — with an explicit dependsOn on the resource group\'s resourceId to guarantee correct ordering. This is a single deployment operation from the caller\'s perspective, but internally it is two coordinated deployments: one at subscription scope (creating the group) and one nested inside it at resource-group scope (creating the storage account).'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'ARM templates can only ever be deployed at resource-group scope — that\'s the only deployment target Azure Resource Manager supports.',
      reality: 'Per this subtopic\'s theory, Microsoft\'s own documentation confirms ARM supports FOUR deployment scopes — resource group, subscription, management group, and tenant — each with its own dedicated CLI commands (az deployment group/sub/mg/tenant) and, for non-resource-group scopes, a different template schema.'
    },
    {
      thought: 'Once deploying at subscription scope, any Azure resource type (storage accounts, VMs, etc.) can be listed directly in the template\'s top-level resources array, the same as at resource-group scope.',
      reality: 'Per this subtopic\'s theory, Microsoft\'s own documentation states "Not all resource types can be deployed to the subscription level" — only a specific whitelist (resourceGroups, policyAssignments, roleAssignments, locks, budgets, tags, and a short list of others) is supported directly; ordinary application resources require a nested, resource-group-scoped deployment inside the subscription-level template.'
    },
    {
      thought: 'A nested deployment that targets a resource group being created in the same template will automatically wait for that resource group to exist first, without any explicit dependency declared.',
      reality: 'Per this subtopic\'s theory, Microsoft\'s own worked example explicitly sets a dependsOn referencing the resource group\'s resourceId on the nested deployment resource — this dependency is not inferred automatically and must be declared, or the nested deployment could attempt to run before the resource group exists.'
    }
  ];
}
