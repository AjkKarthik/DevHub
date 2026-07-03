import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PageMetaComponent } from '../../../shared/page-meta/page-meta';
import { QuickRefComponent, QuickRefItem } from '../../../shared/quick-ref/quick-ref';
import { TheoryBlockComponent, TheoryPoint } from '../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../shared/code-block/code-block';
import { CommonMistakesComponent, CommonMistake } from '../../../shared/common-mistakes/common-mistakes';
import { ChallengeBlockComponent, Challenge } from '../../../shared/challenge-block/challenge-block';
import { QuizBlockComponent, QuizQuestion } from '../../../shared/quiz-block/quiz-block';
import { QnaBlockComponent, QnaItem } from '../../../shared/qna-block/qna-block';
import { RevisionCardComponent, RevisionSummary } from '../../../shared/revision-card/revision-card';
import { PageCompleteComponent } from '../../../shared/page-complete/page-complete';

@Component({
  selector: 'app-azure-arm',
  standalone: true,
  imports: [CommonModule, PageMetaComponent, QuickRefComponent, TheoryBlockComponent, CodeBlockComponent,
    CommonMistakesComponent, ChallengeBlockComponent, QuizBlockComponent, QnaBlockComponent,
    RevisionCardComponent, PageCompleteComponent],
  templateUrl: './arm.html',
  styleUrl: './arm.scss'
})
export class AzureArm {

  quickRef: QuickRefItem[] = [
    { name: 'ARM REST API', type: 'type', desc: 'The management layer for all Azure resources — every portal action and CLI command ultimately calls this API.' },
    { name: 'Resource Provider', type: 'type', desc: 'A namespace (e.g. Microsoft.Compute) that must be registered in a subscription before deploying its resource types.' },
    { name: 'Incremental mode', type: 'keyword', desc: 'Default deployment mode — only adds or modifies resources defined in the template; leaves unmentioned resources alone.' },
    { name: 'Complete mode', type: 'keyword', desc: 'Removes any resource in the resource group NOT defined in the template; use with caution in production.' },
    { name: 'parameters', type: 'syntax', desc: 'Input values passed at deploy time to make templates reusable across environments (dev, staging, prod).' },
    { name: 'variables', type: 'syntax', desc: 'Internal computed values in a template — simplify repeated expressions without exposing them as user inputs.' },
    { name: 'Bicep', type: 'type', desc: 'A DSL that compiles 1:1 into ARM JSON — same engine, far cleaner syntax. Preferred for new templates.' },
  ];

  theory: TheoryPoint[] = [
    {
      heading: 'ARM Architecture & REST API',
      points: [
        'Azure Resource Manager is the single management layer for all Azure resources. Every portal click, CLI command, and SDK call routes through the ARM endpoint at management.azure.com.',
        'ARM authenticates requests via Microsoft Entra ID tokens, enforces RBAC, applies Azure Policy, and records all operations in the Activity Log — providing a complete audit trail.',
        'Resource IDs follow a canonical path: /subscriptions/{subId}/resourceGroups/{rg}/providers/{namespace}/{type}/{name}. This ID is stable and used everywhere: RBAC assignments, diagnostics settings, and cross-resource references.',
        'ARM provides idempotent deployments — running the same template twice is safe. The engine computes a diff between desired state (template) and actual state, then applies only the delta.',
        'Resource locks (CanNotDelete, ReadOnly) are enforced at the ARM layer regardless of the caller\'s RBAC permissions — they are an extra safety net on top of IAM.',
      ]
    },
    {
      heading: 'ARM Template Structure',
      points: [
        'An ARM template is a JSON document with six top-level sections: $schema, contentVersion, parameters, variables, resources, and outputs.',
        'The resources array declares what infrastructure to deploy. Each resource specifies type (Microsoft.Storage/storageAccounts), apiVersion, name, location, and type-specific properties.',
        'parameters accept input values at deploy time. They have type (string, int, bool, object, array), optional defaultValue, and allowedValues for validation. Use secureString for secrets.',
        'variables compute intermediate values from parameters or expressions using template functions like concat(), resourceId(), reference(), and uniqueString(). They reduce repetition.',
        'outputs export values from a deployment (e.g. a storage account connection string) so downstream pipelines or scripts can consume them without re-querying the portal.',
        'Bicep is a domain-specific language that compiles 1:1 to ARM JSON via bicep build. The output is identical to hand-written ARM JSON, so there is no functional difference at deploy time.',
      ]
    },
    {
      heading: 'Deployment Modes & dependsOn',
      points: [
        'Incremental mode (default): ARM only creates or updates the resources declared in your template. Resources in the resource group but not in the template are untouched. Safe for incremental updates.',
        'Complete mode: ARM deletes any resource in the resource group that is NOT in your template. Useful for ensuring the environment exactly matches code, but dangerous if you forget a resource.',
        'ARM automatically detects resource dependencies from resourceId() and reference() calls and builds a dependency graph — parallelising independent resources and serialising dependent ones.',
        'Explicit dependsOn is needed when one resource uses another but does not reference it through resourceId() or reference() — for example, waiting for a Role Assignment to propagate before using it.',
        'Nested and linked templates decompose large templates into reusable modules. Linked templates reference an external template URL; nested templates embed a template inline in the resources array.',
      ]
    },
    {
      heading: 'Resource Providers & API Versions',
      points: [
        'Every Azure service is exposed through a resource provider namespace. Microsoft.Compute manages VMs and disks, Microsoft.Network manages VNets and NICs, Microsoft.Storage manages storage accounts.',
        'A provider must be registered in a subscription before its resource types can be deployed. Run az provider register --namespace Microsoft.Compute; check with az provider show --namespace Microsoft.Compute.',
        'Each resource type has a list of supported apiVersions. Always pin an explicit apiVersion — ARM will not default to the latest, and the behavior of resource properties can differ between versions.',
        'Use az provider list-operations --namespace Microsoft.Compute to discover what operations a provider exposes — useful for writing Azure Policy deny rules or RBAC custom roles.',
      ]
    },
    {
      heading: 'ARM Template Idempotency and Incremental Deployment',
      points: [
        'ARM deployments are idempotent by default — deploying the same template multiple times produces the same end state, since ARM computes the delta between the template\'s desired state and the resource group\'s current state, rather than blindly re-creating resources.',
        'Incremental mode (the default) only adds or modifies resources described in the template, leaving other existing resources in the resource group untouched — Complete mode instead deletes any resource in the group NOT described in the template, a significantly more destructive behavior that must be used deliberately.',
        'Dependencies between resources (a subnet needing its virtual network to exist first) can be inferred automatically from resource references, or declared explicitly via dependsOn — ARM uses this dependency graph to determine safe deployment ordering, including parallelizing independent resources.',
        'ARM template validation (what-if deployments) lets you preview exactly what a deployment would change before actually applying it — a critical safety check before running Complete-mode deployments or any deployment against a production resource group.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'ARM Template (Storage)',
      language: 'bash',
      code: `{
  "$schema": "https://schema.management.azure.com/schemas/2019-04-01/deploymentTemplate.json#",
  "contentVersion": "1.0.0.0",
  "parameters": {
    "storageAccountName": {
      "type": "string",
      "minLength": 3,
      "maxLength": 24
    },
    "location": {
      "type": "string",
      "defaultValue": "[resourceGroup().location]"
    }
  },
  "variables": {
    "storageSku": "Standard_LRS"
  },
  "resources": [
    {
      "type": "Microsoft.Storage/storageAccounts",
      "apiVersion": "2023-01-01",
      "name": "[parameters('storageAccountName')]",
      "location": "[parameters('location')]",
      "sku": { "name": "[variables('storageSku')]" },
      "kind": "StorageV2",
      "properties": {
        "accessTier": "Hot",
        "supportsHttpsTrafficOnly": true,
        "minimumTlsVersion": "TLS1_2"
      }
    }
  ],
  "outputs": {
    "storageEndpoint": {
      "type": "string",
      "value": "[reference(parameters('storageAccountName')).primaryEndpoints.blob]"
    }
  }
}`
    },
    {
      label: 'Deploy via CLI',
      language: 'bash',
      code: `# Deploy ARM template to a resource group
az deployment group create \\
  --resource-group my-rg \\
  --template-file main.json \\
  --parameters storageAccountName=mystorageacc123

# Preview changes without deploying (what-if)
az deployment group what-if \\
  --resource-group my-rg \\
  --template-file main.json \\
  --parameters storageAccountName=mystorageacc123

# Check deployment status
az deployment group show \\
  --resource-group my-rg \\
  --name main

# List resource providers
az provider list --output table

# Register a provider
az provider register --namespace Microsoft.Compute`
    },
    {
      label: 'Bicep ↔ ARM',
      language: 'bash',
      code: `# Compile Bicep to ARM JSON
az bicep build --file main.bicep

# Decompile existing ARM JSON to Bicep (starting point)
az bicep decompile --file main.json

# Validate Bicep template
az bicep lint --file main.bicep

# Deploy Bicep directly (CLI handles build internally)
az deployment group create \\
  --resource-group my-rg \\
  --template-file main.bicep \\
  --parameters storageAccountName=mystorageacc123`
    },
  ];

  mistakes: CommonMistake[] = [
    {
      title: 'Hardcoding location instead of using resourceGroup().location',
      wrong: `"location": "eastus"`,
      right: `"location": "[resourceGroup().location]"`,
      explanation: 'Hardcoding a region makes the template non-portable. Use resourceGroup().location so the resource deploys to the same region as its resource group unless you specifically need a different region.'
    },
    {
      title: 'Using Complete mode without previewing with what-if first',
      wrong: `az deployment group create --mode Complete --template-file main.json`,
      right: `az deployment group what-if --mode Complete --template-file main.json`,
      explanation: 'Complete mode deletes any resource in the RG not in the template. Always run what-if first. Any resource omitted from the template — including ones you forgot — will be permanently deleted.'
    },
    {
      title: 'Forgetting to pin apiVersion',
      wrong: `// omitting apiVersion or using an outdated one`,
      right: `"apiVersion": "2023-01-01"  // pinned to a stable, current version`,
      explanation: 'ARM requires an explicit apiVersion — omitting it is a validation error. Different versions expose different properties; always pin a specific stable version and review the changelog when upgrading.'
    },
    {
      title: 'Deploying before registering the resource provider',
      wrong: `// Deploy Microsoft.Insights resource without checking provider registration`,
      right: `az provider register --namespace microsoft.insights  // register first`,
      explanation: 'Deploying a resource type whose provider is not registered throws a "subscription is not registered to use namespace" error. Check with az provider show --namespace and register if the registrationState is not Registered.'
    },
  ];

  challenge: Challenge = {
    title: 'Parse Azure Resource ID',
    language: 'typescript',
    description: 'Azure resources have a canonical ID:\n/subscriptions/{subId}/resourceGroups/{rgName}/providers/{namespace}/{type}/{name}\n\nWrite parseResourceId(id: string) that returns { subscriptionId, resourceGroup, provider, resourceType, resourceName }. Also write isValidResourceId(id: string) that returns true only for well-formed IDs.',
    hints: [
      "Split on '/' and filter out empty strings from the leading slash",
      'Segments after filtering: [subscriptions, subId, resourceGroups, rgName, providers, namespace, type, name]',
      'For isValid, check that there are exactly 8 segments and the anchor words at indices 0, 2, 4 match',
    ],
    starterCode: `export function parseResourceId(id: string) {
  const parts = id.split('/').filter(Boolean);
  return {
    subscriptionId: '',
    resourceGroup: '',
    provider: '',
    resourceType: '',
    resourceName: '',
  };
}

export function isValidResourceId(id: string): boolean {
  return false;
}`,
    solution: `export function parseResourceId(id: string) {
  const parts = id.split('/').filter(Boolean);
  return {
    subscriptionId: parts[1],
    resourceGroup: parts[3],
    provider: parts[5],
    resourceType: parts[6],
    resourceName: parts[7],
  };
}

export function isValidResourceId(id: string): boolean {
  const parts = id.split('/').filter(Boolean);
  return (
    parts.length === 8 &&
    parts[0] === 'subscriptions' &&
    parts[2] === 'resourceGroups' &&
    parts[4] === 'providers'
  );
}

const id = '/subscriptions/abc-123/resourceGroups/my-rg/providers/Microsoft.Compute/virtualMachines/my-vm';
console.log(parseResourceId(id));
// { subscriptionId: 'abc-123', resourceGroup: 'my-rg',
//   provider: 'Microsoft.Compute', resourceType: 'virtualMachines', resourceName: 'my-vm' }
console.log(isValidResourceId(id)); // true`
  };

  quiz: QuizQuestion[] = [
    {
      q: 'What is the default ARM deployment mode?',
      options: ['Complete', 'Incremental', 'Strict', 'Append'],
      answer: 1,
      explanation: 'Incremental is the default — ARM only creates or modifies resources defined in the template; resources already in the resource group but not in the template are left untouched.'
    },
    {
      q: 'Which ARM deployment mode can delete existing resources?',
      options: ['Incremental', 'Complete', 'Selective', 'Replace'],
      answer: 1,
      explanation: 'Complete mode removes any resource in the resource group that is NOT listed in the template. Always run az deployment group what-if --mode Complete before using it in production.'
    },
    {
      q: 'What do you use when one resource must be created before another, but no reference() or resourceId() is used?',
      options: ['outputs', 'variables', 'dependsOn', 'parameters'],
      answer: 2,
      explanation: 'ARM auto-detects dependencies from resourceId() and reference() calls. For implicit dependencies that ARM cannot infer (e.g. waiting for RBAC propagation), use explicit dependsOn.'
    },
    {
      q: 'Before deploying a resource type like Microsoft.Insights/components, what must be true?',
      options: ['The resource group must be in East US', 'The resource provider microsoft.insights must be registered in the subscription', 'A cost budget must exist', 'An Azure Policy must allow it'],
      answer: 1,
      explanation: 'Each resource type belongs to a resource provider namespace that must be registered in the subscription. Run az provider register --namespace microsoft.insights before deploying Application Insights resources.'
    },
    {
      q: 'What is the relationship between Bicep and ARM JSON?',
      options: ['Bicep is a separate runtime that replaces ARM', 'Bicep compiles to ARM JSON and deploys through the same ARM engine', 'Bicep only works with Terraform backends', 'ARM JSON templates are deprecated in favour of Bicep'],
      answer: 1,
      explanation: 'Bicep is a DSL that compiles 1:1 to ARM JSON. There is no separate Bicep runtime — az deployment group create with a .bicep file runs bicep build first, then sends the resulting ARM JSON to the ARM REST API.'
    },
    {
      q: 'What does the ARM template what-if operation do?',
      options: [
        'Deploys resources immediately without confirmation',
        'Performs a dry run to preview changes before deployment',
        'Rolls back the last deployment',
        'Validates template syntax only',
      ],
      answer: 1,
      explanation: 'What-if (az deployment group what-if) performs a dry run showing what resources would be created, modified, or deleted without actually making changes.',
    },
  ];

  qna: QnaItem[] = [
    {
      q: 'If your team has a large existing library of ARM JSON templates, what is a low-risk way to start adopting Bicep without a big-bang rewrite?',
      a: 'Run <strong>bicep decompile</strong> on existing JSON templates to get a starting-point .bicep file, then only rewrite/clean up new modules going forward in Bicep while leaving stable, working JSON templates untouched — since both compile down to identical ARM JSON deployed through the same ARM REST API, they can be mixed in the same deployment pipeline indefinitely (a Bicep module can even reference an existing ARM JSON template as a linked template). This avoids the risk of a full rewrite while letting new infrastructure code benefit from Bicep\'s cleaner syntax immediately.'
    },
    {
      q: 'When should you use Complete vs Incremental deployment mode?',
      a: '<strong>Incremental</strong> (default) is safe for day-to-day updates — it only touches what is in the template. <strong>Complete</strong> is useful for end-to-end environment management where you want the resource group to exactly mirror your code. Always run <code>az deployment group what-if --mode Complete</code> first to preview which resources would be deleted.'
    },
    {
      q: 'How does ARM know the order to deploy resources?',
      a: 'ARM builds a dependency graph from <code>resourceId()</code> and <code>reference()</code> calls in the template — resources that reference others are scheduled after them. Independent resources are deployed in parallel. Use explicit <code>dependsOn</code> only for dependencies ARM cannot infer automatically (e.g. waiting for an RBAC assignment to propagate).'
    },
    {
      q: 'What is an ARM resource provider and how do you register one?',
      a: 'Resource providers are namespaces (e.g. <code>Microsoft.Compute</code>, <code>Microsoft.Network</code>) that group related Azure services. They must be registered in a subscription before you can deploy their resource types. Register with: <code>az provider register --namespace Microsoft.Compute</code>. Many providers are auto-registered when you first deploy via the portal.'
    },
    {
      q: 'How do you pass secrets to ARM templates without logging them?',
      a: 'Use a <code>secureString</code> parameter type. Secure parameters are never written to deployment logs or ARM deployment history. For production, reference a Key Vault secret in a parameters file using a reference object pointing to the Key Vault resource ID and secret name — the value flows directly from Key Vault to the resource without ever appearing in logs.'
    },
    {
      q: 'What is the ARM template copy element used for?',
      a: 'The <strong>copy</strong> element creates multiple instances of a resource, property, or variable in a loop. Use <code>copy.count</code> to specify iterations and <code>copyIndex()</code> to reference the current index. It replaces manual duplication for creating N storage accounts, VM NICs, or subnets.',
    },
  ];

  revision: RevisionSummary = {
    oneLiner: 'Azure Resource Manager is the unified management layer for all Azure — every resource is created through ARM via its REST API, with templates (JSON or Bicep) describing desired state and the ARM engine enforcing it.',
    mustKnow: [
      'ARM is the management plane — portal, CLI, and SDKs all call the same ARM REST API at management.azure.com',
      'Incremental mode (default) adds/updates only; Complete mode deletes resources not in the template',
      'ARM templates: $schema, contentVersion, parameters, variables, resources, outputs — all JSON',
      'Bicep compiles 1:1 to ARM JSON — same engine, cleaner syntax with modules, loops, conditions',
      'Resource providers (Microsoft.Compute, Microsoft.Network) must be registered in the subscription',
      'dependsOn for explicit dependencies ARM cannot detect from resourceId()/reference() calls',
    ],
    interviewFocus: [
      'Explain Incremental vs Complete deployment mode and when you would use each',
      'What is the relationship between Bicep and ARM JSON? Are they interchangeable?',
      'How does ARM order resource deployment within a template?',
      'What is a resource provider and what happens if one is not registered?',
    ],
  };
}
