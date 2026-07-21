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
  templateUrl: './cdk-removal-policy-covers-updatereplacepolicy-too.html',
  styleUrl: './cdk-removal-policy-covers-updatereplacepolicy-too.scss'
})
export class CdkRemovalPolicyCoversUpdatereplacepolicyTooSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page\'s own QnA warns raw CloudFormation needs TWO fields set — but never says whether CDK\'s one prop covers both',
      points: [
        'The main page\'s own QnA states: "DeletionPolicy controls what happens to a resource when it is removed from the stack or the stack itself is deleted. UpdateReplacePolicy controls what happens to the OLD resource when a stack update requires its replacement... If you only set DeletionPolicy, a replacement during an update still deletes the old resource." This is framed as a two-field diligence requirement for raw CloudFormation authors.',
        'The main page\'s own mistake entry and CDK challenge solution both just show removalPolicy: cdk.RemovalPolicy.RETAIN as "the fix" for a stateful DynamoDB table — without ever connecting it back to the QnA\'s own two-field warning. A reader who just read that QnA would reasonably wonder: does this single CDK prop protect against BOTH deletion AND replacement, or does it silently only cover one, mirroring the exact half-protected mistake the QnA describes?',
      ]
    },
    {
      heading: 'CDK\'s removalPolicy sets BOTH CloudFormation fields by default — confirmed directly in CDK\'s own source',
      points: [
        'Per AWS\'s own CDK API documentation, applyRemovalPolicy "Sets the deletion policy of the resource based on the removal policy specified. The Removal Policy controls what happens to this resource when it stops being managed by CloudFormation, either because you\'ve removed it from the CDK application or because you\'ve made a change that requires the resource to be replaced." Note this description explicitly names the REPLACEMENT case, not just deletion.',
        'CDK\'s own source code for RemovalPolicyOptions documents the applyToUpdateReplacePolicy option directly: "Apply the same deletion policy to the resource\'s \'UpdateReplacePolicy\' @default true" — confirming the option that controls this defaults to true.',
        'Put together, this means removalPolicy: cdk.RemovalPolicy.RETAIN on an L2 construct — matching the main page\'s own DynamoDB Table example — synthesizes to BOTH DeletionPolicy: Retain AND UpdateReplacePolicy: Retain in the generated CloudFormation template. CDK\'s single prop already protects against exactly the "replacement during an update still deletes the old resource" footgun the main page\'s own QnA warns raw-CloudFormation authors to watch for manually.',
        'An escape hatch exists for the unusual case where asymmetric behavior is genuinely wanted: resource.applyRemovalPolicy(RemovalPolicy.RETAIN, { applyToUpdateReplacePolicy: false }) sets DeletionPolicy: Retain but leaves UpdateReplacePolicy at its own CloudFormation default — an advanced, rarely-needed override, not the default CDK behavior.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Confirming the synthesized output — both fields, from one CDK prop',
      language: 'bash',
      code: `# The main page's own CDK challenge solution, unchanged:
# const table = new dynamodb.Table(this, 'Products', {
#   partitionKey: { name: 'productId', type: dynamodb.AttributeType.STRING },
#   billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
#   removalPolicy: cdk.RemovalPolicy.RETAIN,
# });

cdk synth ProductApiStack > template.yaml

# Inspect the ACTUAL generated CloudFormation for the table resource:
grep -A2 "DeletionPolicy\\|UpdateReplacePolicy" template.yaml
# Products8DA3F4B4:
#   Type: AWS::DynamoDB::Table
#   Properties: ...
#   UpdateReplacePolicy: Retain
#   DeletionPolicy: Retain
# -- ONE CDK prop (removalPolicy: RETAIN) produced BOTH CloudFormation
# fields the main page's own QnA says raw CloudFormation authors must
# set independently. A stack update that requires replacing this
# table (e.g. changing the partition key) will retain the OLD table
# instead of silently deleting it -- the exact protection the QnA
# warns is missing if only DeletionPolicy were set.`,
    },
    {
      label: 'The escape hatch — deliberately asymmetric policies (advanced, rare)',
      language: 'bash',
      code: `# For the unusual case where DeletionPolicy and UpdateReplacePolicy
# genuinely need to differ -- e.g. retain data if the STACK is
# deleted, but allow the old resource to be cleaned up normally
# during an in-place REPLACEMENT (rare, and worth a comment
# explaining why):
# const table = new dynamodb.Table(this, 'Products', { ... });
# table.applyRemovalPolicy(cdk.RemovalPolicy.RETAIN, {
#   applyToUpdateReplacePolicy: false,
# });

cdk synth ProductApiStack > template.yaml
grep -A2 "DeletionPolicy\\|UpdateReplacePolicy" template.yaml
# UpdateReplacePolicy: Delete   <- CloudFormation's own default, since
#                                   applyToUpdateReplacePolicy: false
#                                   opted OUT of matching it to RETAIN
# DeletionPolicy: Retain

# For almost every real stateful-resource use case, the DEFAULT
# (both fields matching, applyToUpdateReplacePolicy: true) is what
# you actually want -- this override exists, but reaching for it
# without a specific reason reintroduces the exact gap the default
# behavior exists to close.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'An engineer with a raw-CloudFormation background, having just read the main page\'s own QnA about DeletionPolicy vs UpdateReplacePolicy, reviews a colleague\'s CDK pull request. The stack sets removalPolicy: cdk.RemovalPolicy.RETAIN on a stateful RDS-backed construct and nothing else. The engineer flags it in review: "This only protects against stack deletion — per the docs, you also need to separately handle what happens if this resource gets REPLACED during an update, or you\'ll lose data exactly like the QnA describes." Using this subtopic\'s theory, is this review comment correct?',
    hint: 'What does CDK\'s own RemovalPolicyOptions.applyToUpdateReplacePolicy default to, and does removalPolicy alone already set it?',
    solution: 'Per this subtopic\'s theory, the review comment is NOT correct — it\'s applying the raw-CloudFormation mental model from the main page\'s own QnA to CDK, where it doesn\'t hold. CDK\'s own source code documents that RemovalPolicyOptions.applyToUpdateReplacePolicy "@default true" — meaning a plain removalPolicy: cdk.RemovalPolicy.RETAIN, with no additional configuration, already sets BOTH the synthesized CloudFormation DeletionPolicy AND UpdateReplacePolicy fields to Retain. This can be confirmed directly by running cdk synth on the stack and inspecting the generated template for that resource — both fields will read Retain from this single prop. The colleague\'s code is already fully protected against both the stack-deletion case AND the replacement-during-update case the QnA warns about; no additional configuration is needed unless the team specifically wants asymmetric behavior (via the rarely-needed applyToUpdateReplacePolicy: false override), which isn\'t what\'s being asked for here. The review comment should be corrected, not the code.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'CDK\'s removalPolicy: RemovalPolicy.RETAIN only sets the CloudFormation DeletionPolicy field — UpdateReplacePolicy must be configured separately, mirroring raw CloudFormation\'s two-field requirement.',
      reality: 'Per this subtopic\'s theory, CDK\'s own source confirms applyToUpdateReplacePolicy defaults to true — a single removalPolicy prop sets BOTH DeletionPolicy and UpdateReplacePolicy to the same value in the synthesized template.'
    },
    {
      thought: 'CDK\'s removalPolicy concept and CloudFormation\'s DeletionPolicy/UpdateReplacePolicy attributes are different, unrelated mechanisms.',
      reality: 'Per this subtopic\'s theory, removalPolicy is a direct CDK abstraction OVER these exact two CloudFormation attributes — applyRemovalPolicy\'s own documentation states it "Sets the deletion policy of the resource based on the removal policy specified," covering both the deletion and replacement cases the two raw fields separately govern.'
    },
    {
      thought: 'There is no way to set DeletionPolicy and UpdateReplacePolicy to different values through CDK — removalPolicy always applies identically to both.',
      reality: 'Per this subtopic\'s theory, the applyToUpdateReplacePolicy option on applyRemovalPolicy exists specifically to opt OUT of the default matching behavior for the rare case where asymmetric policies are genuinely intended.'
    }
  ];
}
