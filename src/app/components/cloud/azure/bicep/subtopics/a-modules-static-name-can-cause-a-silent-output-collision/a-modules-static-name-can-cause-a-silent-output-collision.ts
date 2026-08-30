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
  templateUrl: './a-modules-static-name-can-cause-a-silent-output-collision.html',
  styleUrl: './a-modules-static-name-can-cause-a-silent-output-collision.scss'
})
export class AModulesStaticNameCanCauseASilentOutputCollisionSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page treats a module\'s name property as purely cosmetic labeling',
      points: [
        'The main page\'s own theory states plainly: "The name field sets the ARM nested deployment name" — every one of its own module examples (logsDeployment, storageDeploy) uses a fixed, hardcoded string with no caveat about what happens if that same name is reused elsewhere, or deployed more than once concurrently.',
        'The main page\'s own az bicep lint coverage lists example checks the linter performs ("missing @description, missing @secure on sensitive params, resource ID instead of symbolic reference") but never mentions a linter rule specifically about module naming — leaving the reader with no signal that a static module name is itself something worth avoiding.',
      ]
    },
    {
      heading: 'Confirmed via Microsoft\'s own modules documentation: a static name is a real concurrency risk, not just a label',
      points: [
        'Per Microsoft\'s own documentation: "If you deploy a module with a static name concurrently to the same scope, one deployment can interfere with the output from the other deployment. For example, if two Bicep files use the same module with the same static name (examplemodule) and are targeted to the same resource group, one deployment might show the wrong output." A module\'s name isn\'t just a display label — it IS the identity ARM uses to track that specific nested deployment, and two concurrent deployments sharing that identity can genuinely clash.',
        'This risk is specifically about CONCURRENT deployments — two separate deployment operations, targeting the same scope, both using a module with the identical static name, running at overlapping times. A single deployment run using the same static module name isn\'t the scenario being described; it\'s two different callers (two pipeline runs, two developers deploying locally, a pipeline retry overlapping a manual deploy) colliding on the same nested-deployment identity.',
      ]
    },
    {
      heading: 'The two documented fixes — and the linter rule the main page never mentions',
      points: [
        'Microsoft\'s own recommendation is direct: "If you\'re concerned about concurrent deployments to the same scope, give your module a unique name." A minimal, concrete pattern from the same documentation appends a value that varies per deployment: name: \'${deployment().name}-storageDeploy\' — the ambient deployment name (unique per run) folded into the module\'s own name guarantees no two concurrent deployments share an identity.',
        'The second, and per Microsoft\'s own docs the cleaner option, is to simply not set a static name property at all: "Another way to ensure unique module names is to leave out the name property, a unique module name is generated automatically" — an auto-generated GUID sidesteps the whole class of collision by construction, at the cost of a less human-readable name in the Azure portal\'s deployment history.',
        'Microsoft\'s own docs name the exact linter rule that encodes this as a best practice, one the main page\'s own az bicep lint theory bullet never mentions among its example checks: "The no-module-name linter rule is designed to enforce this cleaner coding practice by flagging any module that still contains an explicit name property." Running the linter on any of the main page\'s own three module examples (each of which sets an explicit static name) would trigger this exact rule today.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'The main page\'s own module example, and the concurrency risk it doesn\'t mention',
      language: 'bash',
      code: `// Main page's own "Modules & Params File" example, unchanged:
module logs './modules/storage.bicep' = {
  name: 'logsDeployment'
  params: { name: 'stlogs\${uniqueString(resourceGroup().id)}', sku: 'Standard_GRS' }
}

// Per Microsoft's own docs: "If you deploy a module with a static
// name concurrently to the same scope, one deployment can interfere
// with the output from the other deployment. For example, if two
// Bicep files use the same module with the same static name
// (examplemodule) and are targeted to the same resource group, one
// deployment might show the wrong output."

// Concrete collision scenario:
//   CI pipeline run A: az deployment group create --template-file
//     main.bicep ... (uses module name 'logsDeployment')
//   A teammate, at nearly the same moment, runs the SAME template
//     manually against the SAME resource group -- ALSO using the
//     module name 'logsDeployment'
//
//   Both nested deployments share the identity 'logsDeployment' in
//   that resource group's deployment history -- per Microsoft's own
//   docs, one run can end up reading back the WRONG deployment's
//   output values.`,
    },
    {
      label: 'Two documented fixes, and the linter rule that catches the risk automatically',
      language: 'bash',
      code: `// Fix 1 -- fold something unique-per-run into the name, per
// Microsoft's own documented pattern:
module logs './modules/storage.bicep' = {
  name: '\${deployment().name}-storageDeploy'
  params: { name: 'stlogs\${uniqueString(resourceGroup().id)}', sku: 'Standard_GRS' }
}
// deployment().name is unique to THIS specific deployment operation
// -- two concurrent runs never collide on the resulting module name.

// Fix 2 -- per Microsoft's own docs, the cleaner option: omit name
// entirely and let Bicep generate a unique one automatically:
module logs './modules/storage.bicep' = {
  params: { name: 'stlogs\${uniqueString(resourceGroup().id)}', sku: 'Standard_GRS' }
}
// "Not providing any module name is also valid. A GUID is generated
// as the module name." -- no collision possible by construction.

// The linter rule that flags the ORIGINAL (unsafe) pattern:
az bicep lint --file main.bicep
// Per Microsoft's own docs: "The no-module-name linter rule is
// designed to enforce this cleaner coding practice by flagging any
// module that still contains an explicit name property." -- running
// this against the main page's own three module examples, every one
// of which sets an explicit static name, would flag all three.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A platform team\'s CI pipeline deploys the same Bicep template to a shared "sandbox" resource group multiple times per day, from multiple concurrent pipeline runs triggered by different pull requests. The template has always used module logs \'./modules/storage.bicep\' = { name: \'logsDeployment\', ... }. Occasionally, a pipeline run\'s deployment output for the storage endpoint is wrong — it matches a DIFFERENT run\'s storage account, not the one this run actually deployed. The template itself has no logic bugs. What\'s actually happening?',
    hint: 'Check what Microsoft\'s own documentation says happens when two concurrent deployments to the same scope use a module with the identical static name — is the module\'s name just a label, or does it function as an identity ARM tracks?',
    solution: 'This is the documented static-name concurrency risk, not a template logic bug. Per Microsoft\'s own modules documentation, "if you deploy a module with a static name concurrently to the same scope, one deployment can interfere with the output from the other deployment... one deployment might show the wrong output." Because every pipeline run uses the identical hardcoded name \'logsDeployment\' for its module, and multiple runs execute concurrently against the same shared sandbox resource group, ARM\'s nested-deployment tracking for that name can be read back by the wrong concurrent run — exactly the "wrong output" symptom observed. The fix is either of Microsoft\'s own two documented options: fold something unique-per-run into the name (e.g. name: \'${deployment().name}-logsDeployment\'), or remove the name property entirely so Bicep auto-generates a unique GUID for every deployment. Either change eliminates the shared identity that concurrent runs were colliding on. Running az bicep lint against the template would have already flagged this — the no-module-name linter rule exists specifically to catch a module still using an explicit static name property.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'A Bicep module\'s name property is just a human-readable label shown in the deployment history — it has no functional effect on the deployment itself.',
      reality: 'Per this subtopic\'s theory, Microsoft\'s own documentation confirms the name property is the actual identity ARM uses to track that nested deployment — two concurrent deployments to the same scope sharing an identical static name can genuinely interfere with each other\'s output, not just look confusing in a log.'
    },
    {
      thought: 'A module name collision only matters if two DIFFERENT templates happen to use a module with the same file path and the same name.',
      reality: 'Per this subtopic\'s theory, Microsoft\'s own documented example is two runs of the SAME template — two concurrent executions of one Bicep file, deployed to the same scope, using its own module\'s identical static name — which is exactly the everyday CI-pipeline-with-concurrent-runs scenario, not a rare cross-template coincidence.'
    },
    {
      thought: 'The safest way to name a Bicep module is to always give it an explicit, descriptive static name so it\'s easy to find in the deployment history.',
      reality: 'Per this subtopic\'s theory, Microsoft\'s own documentation recommends the opposite for concurrency safety — either fold a unique-per-run value into the name, or omit the name property entirely and let Bicep auto-generate a GUID — and names the dedicated no-module-name linter rule that flags any module still using an explicit static name as a best-practice violation.'
    }
  ];
}
