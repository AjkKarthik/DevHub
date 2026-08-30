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
  templateUrl: './the-import-id-format-is-resource-specific-not-universal.html',
  styleUrl: './the-import-id-format-is-resource-specific-not-universal.scss'
})
export class TheImportIdFormatIsResourceSpecificNotUniversalSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page\'s own workflow step glosses over where the ID actually comes from and what shape it takes',
      points: [
        'The main page\'s Import Workflow lists step 1 as "Identify the resource ID (AWS Console, CLI, existing tags)" — true as far as it goes, but every example on the page happens to use a simple, single-value ID (an S3 bucket name, an instance ID). Nothing on the page prepares a reader for an ID that is not just one string.',
      ]
    },
    {
      heading: 'There is no single import ID pattern — each resource type defines its own',
      points: [
        'The CLI command\'s own shape is fixed — <code>terraform import RESOURCE_ADDRESS RESOURCE_ID</code> — but what belongs in <code>RESOURCE_ID</code> is entirely up to the resource type\'s own provider implementation. An AWS EC2 instance uses its instance ID (<code>i-0abc123def456</code>); an AWS Route 53 hosted zone uses its zone ID (<code>Z12ABC4UGMOZ2N</code>); an IAM role or S3 bucket uses its plain name.',
        'Many resource types go further and require a COMPOSITE id — several distinct values joined with a delimiter that also varies by resource type: a slash (<code>role/policy</code>), a colon, or a pipe, depending entirely on what that specific resource\'s provider code expects.',
      ]
    },
    {
      heading: 'Where to actually find the right format — and that it does not change based on import method',
      points: [
        'When the ID is not obviously visible in the cloud console, the reliable places to check are: the resource\'s own console URL (which often embeds the real ID), the provider CLI\'s own describe/show/list output, and — most authoritatively — the specific resource type\'s own page in the provider\'s Terraform Registry documentation, which lists the exact expected import ID format for every importable resource type it defines.',
        'This resource-specific format requirement is identical whether importing via the legacy CLI command or the newer declarative <code>import</code> block\'s own <code>id</code> argument — the block-based workflow the main page emphasizes changes HOW the import is expressed and reviewed, not WHAT string the resource type itself expects as its ID.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'The same pattern, wildly different IDs',
      language: 'bash',
      code: `# terraform import RESOURCE_ADDRESS RESOURCE_ID -- the shape
# is fixed, but RESOURCE_ID's actual content is not:

# Simple, single value:
terraform import aws_s3_bucket.data my-existing-bucket-2019
terraform import aws_instance.web i-0abc123def456
terraform import aws_route53_zone.main Z12ABC4UGMOZ2N

# Composite -- slash-delimited (role name / policy ARN):
terraform import aws_iam_role_policy_attachment.example \\
  my-role/arn:aws:iam::aws:policy/AmazonS3ReadOnlyAccess

# Composite -- colon-delimited (varies by resource):
terraform import aws_lambda_permission.example \\
  my-function:AllowExecutionFromAPIGateway

# None of these follow the same shape as each other -- the
# main page's own "Identify the resource ID" step covers
# WHERE to look, not that the FORMAT itself is resource-
# specific and needs to be looked up per resource type.`,
    },
    {
      label: 'Same ID-format rule applies to the import block too',
      language: 'bash',
      code: `# The declarative import block's own id argument follows
# EXACTLY the same resource-specific format rules -- the
# block-based workflow changes how the import is expressed
# and reviewed, not what the ID itself needs to look like:

import {
  to = aws_iam_role_policy_attachment.example
  id = "my-role/arn:aws:iam::aws:policy/AmazonS3ReadOnlyAccess"
}

# Where to actually find the right format for an unfamiliar
# resource type:
# 1. The resource's own console URL -- often embeds the ID
# 2. The provider CLI's describe/show/list output
#    (e.g. aws iam list-role-policies, aws lambda get-policy)
# 3. The MOST authoritative source: that resource type's own
#    page in the provider's Terraform Registry docs -- every
#    importable resource documents its exact expected ID
#    format in an "Import" section.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'Following the main page\'s own workflow step ("Identify the resource ID"), a developer successfully imported several aws_instance resources using just the instance ID (i-0abc123def456) and assumes this simple-string pattern is how import IDs generally work. They then try to import an aws_iam_role_policy_attachment the same way, using just the role name, and it fails. What is actually different about this resource type\'s import ID, and where is the authoritative place to find the correct format for any given resource type?',
    hint: 'Is there one universal import ID shape across all resource types, or does each resource type\'s own provider implementation define its own?',
    solution: 'There is no universal import ID shape — each resource type defines its own format as part of its provider implementation. aws_instance happens to use a simple single value (the instance ID), but aws_iam_role_policy_attachment requires a COMPOSITE id: the role name and the policy ARN joined with a slash delimiter, e.g. `my-role/arn:aws:iam::aws:policy/AmazonS3ReadOnlyAccess`. The role name alone is incomplete. The authoritative place to find the correct format for any resource type is that resource\'s own page in the provider\'s Terraform Registry documentation, which includes an "Import" section documenting the exact expected ID format — more reliable than guessing from a pattern that happened to work for a different resource type.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'Terraform import IDs follow one consistent format across all resource types, since the terraform import command itself always takes the same two arguments.',
      reality: 'Per this subtopic\'s theory, the command\'s own shape is fixed, but what belongs in the ID argument is entirely resource-type-specific — ranging from a simple name to a composite value joined with a slash, colon, or pipe depending on the resource.'
    },
    {
      thought: 'Once an import ID format works for one resource type (like a simple instance ID), the same format style can be assumed for other resource types from the same provider.',
      reality: 'Per this subtopic\'s theory, format varies resource type by resource type even within the same provider — an EC2 instance\'s simple ID and an IAM role policy attachment\'s composite slash-delimited ID are both AWS resources with completely different ID shapes.'
    },
    {
      thought: 'The declarative import block requires a different, more structured ID format than the legacy CLI import command, since it is the newer, more capable mechanism.',
      reality: 'Per this subtopic\'s theory, the import block\'s own id argument follows the exact same resource-specific format rules as the CLI command — the block changes how the import is expressed and reviewed, not what the underlying resource type expects as its ID.'
    }
  ];
}
