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
  selector: 'app-azure-bicep',
  standalone: true,
  imports: [CommonModule, PageMetaComponent, QuickRefComponent, TheoryBlockComponent, CodeBlockComponent,
    CommonMistakesComponent, ChallengeBlockComponent, QuizBlockComponent, QnaBlockComponent,
    RevisionCardComponent, PageCompleteComponent],
  templateUrl: './bicep.html',
  styleUrl: './bicep.scss'
})
export class AzureBicep {

  quickRef: QuickRefItem[] = [
    { name: 'param', type: 'keyword', desc: 'Declares an input parameter — value supplied at deploy time. Add @secure() for secrets.' },
    { name: 'var', type: 'keyword', desc: 'Internal computed value — not visible as a deployment input, used to simplify repeated expressions.' },
    { name: 'resource', type: 'keyword', desc: 'Declares an Azure resource with its type, API version, name, and properties.' },
    { name: 'module', type: 'keyword', desc: 'References another .bicep file — enables splitting large templates into reusable components.' },
    { name: 'output', type: 'keyword', desc: 'Exports a value after deployment — e.g. storage endpoint, connection string, resource ID.' },
    { name: '@secure()', type: 'decorator', desc: 'Marks a param as sensitive — the value is never logged in deployment history or the portal.' },
    { name: 'for item in array', type: 'syntax', desc: 'Loop construct — deploy multiple instances of a resource from an array of configurations.' },
  ];

  theory: TheoryPoint[] = [
    {
      heading: 'Bicep File Structure',
      points: [
        'A Bicep file has five top-level constructs in any order: param, var, resource, module, and output. Only resource or module is strictly required.',
        'param declarations accept a type annotation (string, int, bool, object, array) and optional decorators (@minLength, @allowed, @secure). Params without defaultValue are required at deploy time.',
        'var declarations compute values from expressions, string interpolation, or functions (resourceGroup().location, uniqueString()). Variables reduce repetition and make templates easier to read.',
        'resource blocks declare Azure resources in the form: resource <symbolic> \'<provider>/<type>@<apiVersion>\' = { name, location, properties }. The symbolic name is used for cross-resource references inside the file.',
        'output blocks export values for consumption by parent templates or CI pipelines: output storageId string = storage.id. The type annotation is required.',
        'Target scope (default: resourceGroup) can be set to subscription, managementGroup, or tenant at the top of the file for subscription-level or tenant-level deployments.',
      ]
    },
    {
      heading: 'Modules & Registry',
      points: [
        'A module reference embeds another .bicep file: module storage \'./modules/storage.bicep\' = { name: \'storageDeployment\', params: { ... } }. The name field sets the ARM nested deployment name.',
        'Modules receive inputs via the params property and expose values via their own outputs — consumed in the parent as storage.outputs.endpointUrl.',
        'Bicep Registry (part of Azure Container Registry) hosts versioned module packages: br:myregistry.azurecr.io/storage:v1.0. Use az bicep restore to download them locally.',
        'The bicepconfig.json file configures aliases for registries and module paths, and toggles experimental features. Store it at the project root alongside the main .bicep file.',
        'Modules isolate scope — a module can be deployed at a different scope than its parent (e.g. create a resource group at subscription scope from a module called from a resource-group-scope file).',
      ]
    },
    {
      heading: 'Loops, Conditions & @secure()',
      points: [
        'Loop syntax: [for item in itemArray: { ... }]. Inside resource or module blocks, this creates one resource per array element. Use item.name, item.sku, etc. to set per-instance properties.',
        'Index loop: [for i in range(0, count): { name: \'vm-\${i}\' }]. Use range() when you need numeric indices rather than object arrays.',
        'Condition syntax: resource r \'...\' = if (deployRedis) { ... }. The resource is only included in the deployment when the condition is true at evaluation time.',
        '@secure() on a param suppresses the value from the Azure deployment history, the portal, and pipeline logs. Use it for passwords, connection strings, and API keys.',
        'Key Vault secret references in .bicepparam files: param adminPass = getSecret(\'subscriptionId\', \'rgName\', \'vaultName\', \'secretName\'). The value flows directly from Key Vault to the resource without appearing in the parameter file.',
      ]
    },
    {
      heading: 'Tooling & Deployment Workflow',
      points: [
        'az bicep build --file main.bicep compiles to ARM JSON in the same directory. The output is identical to hand-written ARM — no runtime difference.',
        'az bicep decompile --file main.json converts existing ARM JSON to Bicep as a starting point. The result often needs cleanup (repeated expressions become vars, dependsOn is removed when implicit).',
        'az bicep lint --file main.bicep runs the built-in linter checking for best practices (missing @description, missing @secure on sensitive params, resource ID instead of symbolic reference).',
        '.bicepparam files (Bicep parameter files) replace the older JSON parameters file format. They use the using keyword to bind to a specific .bicep file: using \'./main.bicep\'.',
        'az deployment group create --template-file main.bicep automatically runs bicep build internally — you can deploy .bicep directly without a manual build step.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Bicep File Structure',
      language: 'bash',
      code: `// main.bicep — full structure example
targetScope = 'resourceGroup'

// Parameters (inputs from caller or .bicepparam)
@minLength(3)
@maxLength(24)
param storageAccountName string

param location string = resourceGroup().location

@secure()
param adminPassword string

@allowed(['Standard_LRS', 'Standard_GRS', 'Premium_LRS'])
param storageSku string = 'Standard_LRS'

// Variables (internal computed values)
var storageKind = 'StorageV2'
var uniqueName = '\${storageAccountName}-\${uniqueString(resourceGroup().id)}'

// Resource declaration
resource storage 'Microsoft.Storage/storageAccounts@2023-01-01' = {
  name: storageAccountName
  location: location
  sku: { name: storageSku }
  kind: storageKind
  properties: {
    supportsHttpsTrafficOnly: true
    minimumTlsVersion: 'TLS1_2'
    accessTier: 'Hot'
  }
}

// Output (exposed to parent or pipeline)
output storageId string = storage.id
output blobEndpoint string = storage.properties.primaryEndpoints.blob`
    },
    {
      label: 'Loops & Conditions',
      language: 'bash',
      code: `// Loop: deploy N storage accounts from an array
param storageConfigs array = [
  { name: 'logs', sku: 'Standard_LRS' }
  { name: 'data', sku: 'Standard_GRS' }
]

resource storages 'Microsoft.Storage/storageAccounts@2023-01-01' = [for cfg in storageConfigs: {
  name: 'st\${cfg.name}\${uniqueString(resourceGroup().id)}'
  location: resourceGroup().location
  sku: { name: cfg.sku }
  kind: 'StorageV2'
  properties: { supportsHttpsTrafficOnly: true }
}]

// Outputs from loop: array of endpoints
output endpoints array = [for (cfg, i) in storageConfigs: storages[i].properties.primaryEndpoints.blob]

// Condition: only deploy Redis in production
param deployRedis bool = false

resource redis 'Microsoft.Cache/redis@2023-08-01' = if (deployRedis) {
  name: 'redis-prod'
  location: resourceGroup().location
  properties: {
    sku: { name: 'Standard', family: 'C', capacity: 1 }
  }
}`
    },
    {
      label: 'Modules & Params File',
      language: 'bash',
      code: `// modules/storage.bicep
param name string
param location string = resourceGroup().location
param sku string = 'Standard_LRS'

resource storage 'Microsoft.Storage/storageAccounts@2023-01-01' = {
  name: name
  location: location
  sku: { name: sku }
  kind: 'StorageV2'
  properties: { supportsHttpsTrafficOnly: true }
}

output id string = storage.id
output endpoint string = storage.properties.primaryEndpoints.blob

// --- main.bicep (parent) ---
module logs './modules/storage.bicep' = {
  name: 'logsDeployment'
  params: { name: 'stlogs\${uniqueString(resourceGroup().id)}', sku: 'Standard_GRS' }
}

output logsEndpoint string = logs.outputs.endpoint

// --- main.bicepparam (parameter file) ---
// using './main.bicep'
// param storageAccountName = 'mystorageacc'
// param adminPassword = getSecret('subId', 'rg', 'myVault', 'adminPwd')

// Deploy with parameter file:
// az deployment group create --template-file main.bicep --parameters main.bicepparam`
    },
  ];

  mistakes: CommonMistake[] = [
    {
      title: 'Missing @secure() on secret parameters',
      wrong: `param adminPassword string = 'P@ssw0rd123'`,
      right: `@secure()\nparam adminPassword string`,
      explanation: 'Without @secure(), the password appears in plaintext in the Azure deployment history and pipeline logs. @secure() masks it. Never hardcode a default value for a secret param.'
    },
    {
      title: 'Using string concatenation for resource names instead of uniqueString()',
      wrong: `name: 'mystorageacc'  // fails if already taken globally`,
      right: `name: 'st\${uniqueString(resourceGroup().id)}'  // globally unique`,
      explanation: 'Storage account names must be globally unique across all of Azure. uniqueString() produces a deterministic 13-char hash from the resource group ID — same RG always gives the same name, but different RGs differ.'
    },
    {
      title: 'Hardcoding location instead of resourceGroup().location',
      wrong: `location: 'eastus'`,
      right: `location: resourceGroup().location`,
      explanation: 'Hardcoding a region makes the template non-portable. Use resourceGroup().location as the default so resources deploy in the same region as their resource group, and accept location as an overridable param when needed.'
    },
    {
      title: 'Passing the --parameters flag multiple times instead of using a .bicepparam file',
      wrong: `az deployment group create --template-file main.bicep --parameters name=x sku=y env=z`,
      right: `az deployment group create --template-file main.bicep --parameters main.bicepparam`,
      explanation: '.bicepparam files centralise all parameters, support Key Vault secret references (getSecret()), and can be committed to source control with environment-specific files (dev.bicepparam, prod.bicepparam).'
    },
  ];

  challenge: Challenge = {
    title: 'Generate Bicep uniqueString equivalent',
    language: 'typescript',
    description: 'Bicep\'s uniqueString() produces a deterministic 13-character lowercase hex hash from its inputs — the same inputs always produce the same output, but different inputs differ. Implement a simplified version: uniqueString(...inputs: string[]): string that returns a stable 13-character lowercase hex string by hashing the concatenated inputs. Use a simple djb2 hash.',
    hints: [
      'djb2 hash: start with 5381, for each char: hash = ((hash << 5) + hash) ^ charCode',
      'Use unsigned right-shift (>>> 0) to keep it a 32-bit unsigned int',
      'Convert to hex with .toString(16) and pad/truncate to 13 characters',
    ],
    starterCode: `export function uniqueString(...inputs: string[]): string {
  const combined = inputs.join('');
  let hash = 5381;
  for (let i = 0; i < combined.length; i++) {
    // djb2: hash = hash * 33 ^ charCode
  }
  // return 13-char lowercase hex
  return '';
}`,
    solution: `export function uniqueString(...inputs: string[]): string {
  const combined = inputs.join('');
  let hash = 5381;
  for (let i = 0; i < combined.length; i++) {
    hash = ((hash << 5) + hash) ^ combined.charCodeAt(i);
    hash = hash >>> 0; // keep unsigned 32-bit
  }
  const hex = hash.toString(16).padStart(8, '0');
  // repeat and truncate to 13 chars (simulates Bicep's 13-char output)
  return (hex + hex).substring(0, 13);
}

// Test: same inputs → same result
console.log(uniqueString('/subscriptions/abc/resourceGroups/my-rg')); // stable
console.log(uniqueString('/subscriptions/abc/resourceGroups/my-rg')); // identical`
  };

  quiz: QuizQuestion[] = [
    {
      q: 'What does the @secure() decorator do in Bicep?',
      options: ['Encrypts the ARM template at rest', 'Prevents the parameter value from appearing in deployment logs and history', 'Forces HTTPS on the resource', 'Requires the value to be at least 8 characters'],
      answer: 1,
      explanation: '@secure() marks a parameter as sensitive so Azure never writes its value to the deployment history, portal, or pipeline logs. It does not encrypt the template itself or enforce any value constraints.'
    },
    {
      q: 'What is the syntax for a Bicep loop that creates one storage account per item in an array?',
      options: [
        'for (item in items) { resource ... }',
        'resource storages ... = [for item in items: { ... }]',
        'items.forEach(item => resource(...))',
        'loop items as item { ... }'
      ],
      answer: 1,
      explanation: 'Bicep uses [for item in array: { ... }] inside resource or module declarations. The result is an array-typed symbolic name — access individual instances with storages[0], storages[1], etc.'
    },
    {
      q: 'Which command compiles a .bicep file to ARM JSON?',
      options: ['az bicep decompile', 'az bicep build', 'az bicep lint', 'az bicep export'],
      answer: 1,
      explanation: 'az bicep build --file main.bicep compiles Bicep to ARM JSON. az bicep decompile goes the other way — it converts existing ARM JSON to Bicep as a starting point (the output often needs cleanup).'
    },
    {
      q: 'How do you reference a Key Vault secret in a .bicepparam file without exposing the value?',
      options: [
        'param secret = az keyvault secret show --name ...',
        "param secret = getSecret('subId', 'rg', 'vaultName', 'secretName')",
        'param secret = @secure(keyVault.secrets[0])',
        'param secret = env(\'MY_SECRET\')'
      ],
      answer: 1,
      explanation: 'The getSecret() function in .bicepparam files fetches the secret value directly from Key Vault at deploy time. The value never appears in the parameter file, deployment history, or logs.'
    },
    {
      q: 'What is the difference between a Bicep module and a resource?',
      options: [
        'Modules are for networking, resources are for compute',
        'A module references another .bicep file; a resource declares a single Azure resource',
        'Modules are only available in Bicep Registry',
        'Resources cannot have outputs; modules can'
      ],
      answer: 1,
      explanation: 'A resource block declares one Azure resource (e.g. a storage account). A module block references another .bicep file, which can itself contain multiple resources and outputs — enabling reuse and encapsulation.'
    },
  ];

  qna: QnaItem[] = [
    {
      q: 'What is the difference between param and var in Bicep?',
      a: '<strong>param</strong> declares an input — callers (CLI, portal, parent template) supply the value at deploy time. It can have a <code>defaultValue</code>. <strong>var</strong> is internal to the template — it computes a value from expressions or other params and cannot be set by the caller. Use vars to reduce repetition (e.g. <code>var storageName = \'st\${uniqueString(resourceGroup().id)}\'</code>).'
    },
    {
      q: 'How do you reference a resource in the same Bicep file without hardcoding its ID?',
      a: 'Use the resource\'s <strong>symbolic name</strong>. When you declare <code>resource storage \'Microsoft.Storage/storageAccounts@2023-01-01\' = { ... }</code>, you can then reference <code>storage.id</code>, <code>storage.name</code>, and any property via <code>storage.properties.primaryEndpoints.blob</code>. Bicep infers the dependency automatically — no need for explicit <code>dependsOn</code>.'
    },
    {
      q: 'Can you deploy a Bicep file directly, or must you compile it to ARM JSON first?',
      a: 'Both work. <code>az deployment group create --template-file main.bicep</code> compiles the file to ARM JSON internally before sending it to ARM — you never see the JSON. Alternatively run <code>az bicep build</code> first and deploy the .json file. The end result is identical since Bicep compiles 1:1 to ARM JSON.'
    },
    {
      q: 'What are .bicepparam files and when should you use them?',
      a: '.bicepparam files are the Bicep-native parameter format (replacing the older JSON parameters files). They use <code>using \'./main.bicep\'</code> to bind to a specific template and support <code>getSecret()</code> for Key Vault references. Use separate param files per environment: <code>dev.bicepparam</code>, <code>prod.bicepparam</code> — same Bicep logic, different values. Commit both to source control (secrets are fetched at deploy time, not stored in the file).'
    },
    {
      q: 'How do Bicep modules communicate — how do you pass values in and get values out?',
      a: 'Pass values in via the <strong>params</strong> property: <code>module m \'./m.bicep\' = { name: \'deploy\', params: { sku: \'Standard_LRS\' } }</code>. Get values out via the module\'s outputs: <code>output endpoint string = m.outputs.blobEndpoint</code> (the child template must declare the output). The parent consumes it as <code>m.outputs.blobEndpoint</code> in expressions or other resource properties.'
    },
  ];

  revision: RevisionSummary = {
    oneLiner: 'Bicep is Azure\'s first-class IaC DSL — it compiles 1:1 to ARM JSON, adds modules for reuse, for/if for dynamic deployments, @secure() for secrets, and .bicepparam files for environment-specific values.',
    mustKnow: [
      'param (external input) vs var (internal computed) — vars cannot be overridden by callers',
      'resource block: symbolic name, type@apiVersion, name, location, properties — symbolic name enables property references',
      'module block references another .bicep file; pass params in, read outputs with m.outputs.x',
      '@secure() on param prevents value from appearing in deployment history or portal — use getSecret() in .bicepparam for Key Vault refs',
      'Loop: [for item in array: { ... }] inside resource/module — output an array with [for (cfg, i) in items: r[i].id]',
      'Condition: resource r ... = if (flag) { ... } — resource is excluded from deployment when flag is false',
    ],
    interviewFocus: [
      'How does Bicep relate to ARM JSON — can you deploy Bicep directly or must you compile it?',
      'What does @secure() actually prevent, and how do Key Vault references work in .bicepparam?',
      'How do Bicep modules communicate — how do you pass data in and out?',
      'What is the difference between Bicep loops and conditions — when would you use each?',
    ],
  };
}
