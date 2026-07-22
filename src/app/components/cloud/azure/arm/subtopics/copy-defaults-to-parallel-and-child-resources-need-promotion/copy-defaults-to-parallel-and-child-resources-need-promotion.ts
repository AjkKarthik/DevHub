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
  templateUrl: './copy-defaults-to-parallel-and-child-resources-need-promotion.html',
  styleUrl: './copy-defaults-to-parallel-and-child-resources-need-promotion.scss'
})
export class CopyDefaultsToParallelAndChildResourcesNeedPromotionSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page\'s own QnA describes the copy element in one paragraph, with no mention of ordering or a real, documented restriction',
      points: [
        'The main page\'s own QnA states only: "The copy element creates multiple instances of a resource, property, or variable in a loop. Use copy.count to specify iterations and copyIndex() to reference the current index. It replaces manual duplication for creating N storage accounts, VM NICs, or subnets." Nothing here says whether the N instances are created one at a time or all at once, or whether copy behaves the same way on every kind of resource.',
        'Two of the main page\'s own quickRef examples — VM NICs and subnets — are frequently modeled as CHILD resources nested inside a parent (a NIC inside a network profile, a subnet inside a virtual network) in real templates, making this topic\'s child-resource restriction directly relevant to the exact examples the main page itself lists.',
      ]
    },
    {
      heading: 'copy defaults to unordered PARALLEL creation, and it cannot be used directly on a child resource at all',
      points: [
        'Per Microsoft\'s own documentation: "By default, Resource Manager creates the resources in parallel. It applies no limit to the number of resources deployed in parallel other than the total limit of 800 resources in the template. The order in which they\'re created isn\'t guaranteed." A team relying on copy loop instances being created in index order (0, 1, 2, ...) is relying on behavior ARM explicitly does not guarantee by default.',
        'A serial alternative exists but must be opted into explicitly: "To serially deploy more than one instance of a resource, set mode to serial and batchSize to the number of instances to deploy at a time. With serial mode, Resource Manager creates a dependency on earlier instances in the loop so that it doesn\'t start one batch until the previous batch completes." This is the correct tool for staggered production rollouts — but it is never the default, and batchSize can\'t exceed the loop\'s own count.',
        'The child-resource restriction is absolute, not a best practice: "You can\'t use a copy loop for a child resource. To create more than one instance of a resource that you typically define as nested within another resource, you must instead create that resource as a top-level resource." Per Microsoft\'s own worked example, this means moving the child resource OUT of its parent\'s nested resources array, giving it the fully-qualified type (e.g. Microsoft.DataFactory/factories/datasets) and a name in the format parent-name/child-name — the copy element is then attached to this newly-promoted top-level resource, never to the original nested definition.',
        'Copy loops have a hard iteration ceiling that applies regardless of mode: "The count can\'t exceed 800 or be a negative number." A template design that assumes an unbounded loop count will fail validation once a subscription genuinely needs more than 800 of something in one deployment.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Default parallel copy — no ordering guarantee',
      language: 'bash',
      code: `{
  "resources": [
    {
      "copy": {
        "name": "storagecopy",
        "count": 4
      },
      "type": "Microsoft.Storage/storageAccounts",
      "apiVersion": "2025-06-01",
      "name": "[format('{0}storage{1}', range(0, 4)[copyIndex()], uniqueString(resourceGroup().id))]",
      "location": "[parameters('location')]",
      "sku": { "name": "Standard_LRS" },
      "kind": "Storage"
    }
  ]
}
# Per Microsoft's own docs: mode defaults to "parallel" -- all 4
# storage accounts are created concurrently, with NO guarantee about
# which one finishes first. A team assuming storage0 always finishes
# deploying before storage1 (e.g. because some downstream automation
# polls for storage0's existence as a signal the batch has started)
# is relying on unguaranteed behavior.

# Opt into staggered, ordered rollout with serial mode + batchSize:
{
  "copy": {
    "name": "storagecopy",
    "count": 4,
    "mode": "serial",
    "batchSize": 2
  },
  ...
}
# -- deploys 2 at a time; the second batch of 2 doesn't start until
# the first batch of 2 fully completes.`,
    },
    {
      label: 'Promoting a child resource to use copy on it',
      language: 'bash',
      code: `# WRONG -- copy cannot be attached to a nested child resource:
{
  "type": "Microsoft.DataFactory/factories",
  "name": "exampleDataFactory",
  "resources": [
    {
      "type": "datasets",
      "name": "exampleDataSet",
      "copy": { "name": "datasetcopy", "count": 3 },
      "dependsOn": ["exampleDataFactory"]
    }
  ]
}
# Fails validation -- copy loops are not supported on resources
# nested inside a parent's own "resources" array.

# CORRECT -- promote the dataset to a top-level resource, using the
# fully-qualified type and "parent/child" name format to preserve
# the relationship:
{
  "resources": [
    { "type": "Microsoft.DataFactory/factories", "name": "exampleDataFactory" },
    {
      "type": "Microsoft.DataFactory/factories/datasets",
      "name": "[format('exampleDataFactory/exampleDataSet{0}', copyIndex())]",
      "copy": { "name": "datasetcopy", "count": 3 },
      "dependsOn": ["exampleDataFactory"]
    }
  ]
}
# Per Microsoft's own docs: "Since type can no longer be inferred
# from its position in the template, you must provide the fully
# qualified type" and a name in the "parent-name/child-name" format.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A team writes a template with a copy loop creating 5 VM NICs, matching one of the main page\'s own listed copy-element use cases. In their design, each NIC is nested inside the virtual network resource it belongs to (a common way to model the relationship), and they add copy.count: 5 directly to that nested NIC definition. Deployment validation fails. Using this subtopic\'s theory, why — and what\'s the fix?',
    hint: 'Per Microsoft\'s own documentation, is a copy element ever valid when attached to a resource nested inside another resource\'s own "resources" array?',
    solution: 'Per this subtopic\'s theory, the deployment fails because the NIC is defined as a CHILD resource (nested inside the virtual network\'s own resources array), and Microsoft\'s own documentation states directly: "You can\'t use a copy loop for a child resource." This restriction is unconditional — it doesn\'t matter that VM NICs are one of the main page\'s own named use cases for copy, the nesting position is what triggers the failure, not the resource type itself. The fix, per Microsoft\'s own documented pattern, is to move the NIC OUT of the virtual network\'s nested resources array and make it a top-level resource in the template, using the fully-qualified type (e.g. Microsoft.Network/virtualNetworks/subnets or the appropriate NIC-parent path) and a name in the "parent-name/child-name" format to preserve the relationship — the copy element then attaches to this promoted top-level resource, which IS a valid target for copy.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'A copy loop creates its resource instances one at a time, in index order (0, then 1, then 2, ...) by default.',
      reality: 'Per this subtopic\'s theory, Microsoft\'s own documentation confirms the default mode is PARALLEL with no ordering guarantee — serial, ordered creation only happens when mode is explicitly set to "serial" with a batchSize.'
    },
    {
      thought: 'A copy loop can be attached to any resource definition, including one nested inside a parent resource\'s own resources array.',
      reality: 'Per this subtopic\'s theory, Microsoft\'s own documentation states this restriction unconditionally: "You can\'t use a copy loop for a child resource" — the resource must first be promoted to a top-level resource, using the fully-qualified type and parent/child name format, before a copy element can be attached to it.'
    },
    {
      thought: 'A copy loop can iterate as many times as a subscription\'s quota allows, with no hard cap from ARM itself.',
      reality: 'Per this subtopic\'s theory, Microsoft\'s own documentation states the count "can\'t exceed 800" for any copy loop, regardless of subscription-level resource quotas — this is a template-engine-level ceiling, separate from any Azure resource quota.'
    }
  ];
}
