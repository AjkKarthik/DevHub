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
  templateUrl: './access-point-and-bucket-policy-must-both-allow-the-request.html',
  styleUrl: './access-point-and-bucket-policy-must-both-allow-the-request.scss'
})
export class AccessPointAndBucketPolicyMustBothAllowTheRequestSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page mentions Access Points once, in a single sentence, with no mechanism explained',
      points: [
        'The main page\'s own "Access Control & Presigned URLs" theory bullet says only: "S3 Access Points: named endpoints with their own access policies — simplify managing access across many prefixes and IAM principals in a large shared bucket." No code example, no explanation of how an access point policy actually interacts with the bucket it\'s attached to.',
        'This is exactly the kind of gap this hub\'s subtopics exist to close — a real, useful mechanism named but never actually walked through, left as a one-line definition a reader has no way to act on.',
      ]
    },
    {
      heading: 'An access point policy and the underlying bucket policy must BOTH allow a request — it\'s an AND, not an OR',
      points: [
        'Per AWS\'s own documentation: "For an application or user to be able to access objects through an access point, both the access point and the underlying bucket... must permit the request." A grant in the access point policy alone is not sufficient — the bucket itself must independently allow the same access, or the request is denied regardless of what the access point policy says.',
        'AWS\'s own documentation recommends one of two ways to satisfy this: either duplicate the necessary permissions onto the underlying bucket policy directly (matching what the access point policy grants), or — the RECOMMENDED approach — "delegate access control to access points": configure the bucket policy once to allow full access to any access point owned by the account (via the s3:DataAccessPointAccount condition key), and from then on manage all fine-grained access exclusively through each access point\'s own policy, never touching the bucket policy again per-permission.',
        'A separate, genuinely different capability the main page\'s own one-liner doesn\'t mention at all: an access point can be restricted to a specific network origin — "you can configure any access point to accept requests only from a virtual private cloud (VPC)" via the s3:AccessPointNetworkOrigin condition key. This is a network-level perimeter, layered on top of (not instead of) the IAM-style access point/bucket policy checks — a request from outside the configured VPC is rejected before the access point or bucket policies are even evaluated for permission.',
        'Access points are also object-operation-only — AWS\'s own documentation notes you can\'t use an access point to delete a bucket or configure S3 Replication; those still require direct bucket-level API calls, so an access point is not a full stand-in for the bucket for every kind of S3 operation.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'The trap: an access point policy alone, with no matching bucket-side grant',
      language: 'bash',
      code: `# Create an access point on the main page's own example bucket
aws s3control create-access-point \\
  --account-id 123456789012 \\
  --name reports-team-ap \\
  --bucket my-company-data-prod

# Grant a specific IAM user access THROUGH the access point --
# looks complete on its own:
aws s3control put-access-point-policy \\
  --account-id 123456789012 \\
  --name reports-team-ap \\
  --policy '{
    "Version": "2012-10-17",
    "Statement": [{
      "Effect": "Allow",
      "Principal": { "AWS": "arn:aws:iam::123456789012:user/jane" },
      "Action": ["s3:GetObject", "s3:PutObject"],
      "Resource": "arn:aws:s3:eu-west-1:123456789012:accesspoint/reports-team-ap/object/reports/*"
    }]
  }'

# Jane tries to read an object THROUGH the access point ARN:
aws s3api get-object \\
  --bucket arn:aws:s3:eu-west-1:123456789012:accesspoint/reports-team-ap \\
  --key reports/q4.csv out.csv
# An error occurred (AccessDenied) when calling the GetObject operation
#
# -- the access point policy explicitly allows this, but the
# UNDERLYING BUCKET POLICY on my-company-data-prod says nothing
# about Jane or this access point at all -- per AWS's own
# documentation, the bucket must ALSO permit the same access, or the
# request is denied regardless of the access point policy.`,
    },
    {
      label: 'The fix: delegate access control to access points (recommended)',
      language: 'bash',
      code: `# The RECOMMENDED pattern per AWS's own guidance: configure the
# bucket policy ONCE to trust the account's own access points fully,
# then manage all fine-grained access exclusively at the access
# point level from then on:
aws s3api put-bucket-policy \\
  --bucket my-company-data-prod \\
  --policy '{
    "Version": "2012-10-17",
    "Statement": [{
      "Effect": "Allow",
      "Principal": { "AWS": "*" },
      "Action": "*",
      "Resource": [
        "arn:aws:s3:::my-company-data-prod",
        "arn:aws:s3:::my-company-data-prod/*"
      ],
      "Condition": {
        "StringEquals": { "s3:DataAccessPointAccount": "123456789012" }
      }
    }]
  }'
# -- this bucket policy grants nothing directly to any principal; it
# only says "trust whatever THIS ACCOUNT's own access points decide
# to allow" -- the actual authorization decision now lives entirely
# in each access point's own policy.

# Re-running Jane's exact same request:
aws s3api get-object \\
  --bucket arn:aws:s3:eu-west-1:123456789012:accesspoint/reports-team-ap \\
  --key reports/q4.csv out.csv
# (downloads successfully) -- now both checks pass: the access
# point's own policy allows Jane, and the bucket's delegated policy
# trusts this account's access points to make that call.

# Restricting a SEPARATE access point to a specific VPC only --
# a genuinely different, network-level control layered on top:
aws s3control create-access-point \\
  --account-id 123456789012 \\
  --name internal-only-ap \\
  --bucket my-company-data-prod \\
  --vpc-configuration VpcId=vpc-0abc12345
# -- requests to this access point from OUTSIDE vpc-0abc12345 are
# rejected before any IAM policy is even evaluated.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A platform team creates an S3 access point for a partner team, with an access point policy granting the partner\'s IAM role read access to a specific prefix. The partner reports every request through the access point fails with AccessDenied, even though the platform team can see the access point policy clearly allows the partner\'s role. Using this subtopic\'s theory, what is the most likely missing piece, and what are the two possible ways to fix it?',
    hint: 'The access point policy allowing the request is only half of what AWS documents as required — what else has to independently permit the same access?',
    solution: 'Per this subtopic\'s theory, the most likely missing piece is that the underlying bucket\'s own bucket policy doesn\'t grant the same access — AWS\'s own documentation states plainly that both the access point policy AND the underlying bucket must permit a request for it to succeed; an access point policy allowing something is necessary but not sufficient on its own. Since the platform team can see the access point policy is correctly configured, the AccessDenied errors point directly at the bucket-side check failing instead. Per this subtopic\'s theory, there are two ways to fix this: (1) add a matching statement directly to the bucket policy granting the partner\'s role the same s3:GetObject permission on the relevant bucket ARN (not the access point ARN) — this works but has to be kept in sync with the access point policy going forward; or (2) the recommended approach — delegate access control to access points entirely, by configuring the bucket policy once with a condition on s3:DataAccessPointAccount that trusts any access point owned by the account, after which every future access-point-specific grant only needs to be added to that access point\'s own policy, with no further bucket policy changes required. Given that the team may add more partner access points in the future, option 2 is the more maintainable fix per AWS\'s own recommendation, even though option 1 would also resolve this specific incident.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'An S3 access point policy is a complete, self-contained authorization mechanism — if it grants access to a principal, that\'s sufficient for the request to succeed.',
      reality: 'Per this subtopic\'s theory, AWS\'s own documentation is explicit that BOTH the access point policy and the underlying bucket must independently permit the request — an access point policy grant alone, with no matching bucket-level permission, still results in AccessDenied.'
    },
    {
      thought: 'The only way to make an access point policy grant actually work is to duplicate the same permissions onto the bucket policy every time.',
      reality: 'Per this subtopic\'s theory, AWS\'s own recommended alternative is to delegate access control to access points once, via a bucket policy condition on s3:DataAccessPointAccount — after that, every future access point policy grant works without any further bucket policy changes.'
    },
    {
      thought: 'Restricting an access point to a VPC network origin is just another IAM-style condition, evaluated the same way as any other policy statement.',
      reality: 'Per this subtopic\'s theory, the VPC network origin restriction is a network-level perimeter check that happens BEFORE the access point or bucket IAM policies are evaluated — a request from outside the configured VPC is rejected regardless of what either policy would otherwise allow.'
    }
  ];
}
