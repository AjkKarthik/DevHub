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
  templateUrl: './permission-boundary-doesnt-limit-role-session-resource-grants.html',
  styleUrl: './permission-boundary-doesnt-limit-role-session-resource-grants.scss'
})
export class PermissionBoundaryDoesntLimitRoleSessionResourceGrantsSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page treats a Permission Boundary as an absolute, universal cap',
      points: [
        'The main page\'s own "Policy Evaluation Logic" theory bullet states flatly: "Permission Boundaries set the maximum allowed permissions — a policy granting s3:* with a boundary allowing only s3:GetObject results in only s3:GetObject." No exception, no scope qualifier — read as an unconditional rule.',
        'This is true for identity-based policies, exactly as the main page describes — but AWS\'s own documentation draws a specific, non-obvious exception around resource-based policies and role SESSIONS specifically, that the main page\'s blanket framing doesn\'t anticipate.',
      ]
    },
    {
      heading: 'A permission boundary limits the ROLE\'s own identity-based policy — but NOT a resource-based policy granting to the assumed ROLE SESSION',
      points: [
        'Per AWS\'s own documentation, when a resource-based policy (an S3 bucket policy, a KMS key policy, etc.) grants permissions to an IAM ROLE\'s own ARN directly, that grant IS limited by the role\'s permission boundary, same-account or not.',
        'But when the same kind of resource-based policy instead grants permissions to the ROLE SESSION ARN — the arn:aws:sts::...:assumed-role/RoleName/session-name form that appears as the actual calling principal once a role has been assumed — AWS states plainly: "permissions granted directly to a session are not limited by an implicit deny in an identity-based policy, a permissions boundary, or session policy." The distinction between the two ARN forms (role ARN vs. assumed-role session ARN) is the entire hinge of this exception.',
        'This means a resource owner who wants to grant access specifically to one particular ASSUMED SESSION of a boundary-restricted role — rather than to the role itself in general — can bypass that role\'s own permission boundary entirely, simply by targeting the session ARN form in their resource-based policy instead of the role ARN form. The main page\'s own S3-policy example never demonstrates or distinguishes between these two ARN forms.',
        'This is exactly the kind of gap a security review needs to know about: an administrator who set a tight permission boundary on a role, confident it caps EVERYTHING that role can ever do, could be wrong if a resource-based policy elsewhere in the account (or in another account) happens to reference the assumed-role session ARN rather than the role\'s own ARN.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'The boundary working exactly as the main page describes — role ARN target',
      language: 'bash',
      code: `# A role with a tight permission boundary -- matching the main
# page's own example logic (grants s3:* but boundary caps to
# s3:GetObject only):
aws iam create-role --role-name DataProcessorRole \\
  --assume-role-policy-document '{...lambda trust policy...}' \\
  --permissions-boundary arn:aws:iam::123456789012:policy/OnlyS3GetObjectBoundary

aws iam put-role-policy --role-name DataProcessorRole \\
  --policy-name FullS3 \\
  --policy-document '{"Version":"2012-10-17","Statement":[{"Effect":"Allow","Action":"s3:*","Resource":"*"}]}'

# A resource-based policy on a DIFFERENT bucket, granting access to
# the ROLE ARN directly:
aws s3api put-bucket-policy --bucket other-team-bucket --policy '{
  "Version": "2012-10-17",
  "Statement": [{
    "Effect": "Allow",
    "Principal": { "AWS": "arn:aws:iam::123456789012:role/DataProcessorRole" },
    "Action": "s3:DeleteObject",
    "Resource": "arn:aws:s3:::other-team-bucket/*"
  }]
}'

# Even though the bucket policy explicitly allows DeleteObject to
# the ROLE, the permission boundary still caps it -- exactly as the
# main page's own theory describes:
aws sts assume-role --role-arn arn:aws:iam::123456789012:role/DataProcessorRole --role-session-name test
# ... using the resulting credentials ...
aws s3api delete-object --bucket other-team-bucket --key file.txt
# AccessDenied -- the permission boundary correctly caps this.`,
    },
    {
      label: 'The exception — targeting the SESSION ARN bypasses the boundary',
      language: 'bash',
      code: `# The SAME role, SAME boundary -- but this time the resource-based
# policy targets the ASSUMED-ROLE SESSION ARN form instead of the
# role's own ARN:
aws s3api put-bucket-policy --bucket other-team-bucket --policy '{
  "Version": "2012-10-17",
  "Statement": [{
    "Effect": "Allow",
    "Principal": {
      "AWS": "arn:aws:sts::123456789012:assumed-role/DataProcessorRole/test"
    },
    "Action": "s3:DeleteObject",
    "Resource": "arn:aws:s3:::other-team-bucket/*"
  }]
}'
# -- note the ARN form: assumed-role/DataProcessorRole/test, not
# role/DataProcessorRole -- this targets the SESSION, not the role.

# Assume the role using the EXACT same session name referenced above:
aws sts assume-role --role-arn arn:aws:iam::123456789012:role/DataProcessorRole \\
  --role-session-name test
# ... using the resulting credentials ...
aws s3api delete-object --bucket other-team-bucket --key file.txt
# SUCCEEDS -- per AWS's own documented behavior, permissions granted
# directly to a role SESSION ARN are not limited by the role's own
# permission boundary at all -- the exact same boundary that blocked
# the identical action in the previous example has no effect here,
# purely because of which ARN form the resource-based policy names.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A security team sets a tight permission boundary on a shared CI/CD deployment role, confident it caps every possible action that role could ever take, anywhere in the organization — following the main page\'s own "boundary sets the maximum allowed permissions" framing. During an audit, they discover the role was able to delete objects in a partner team\'s S3 bucket — an action the boundary should have blocked. Investigating the partner bucket\'s own policy, they find it grants s3:DeleteObject to arn:aws:sts::123456789012:assumed-role/CicdDeployRole/prod-deploy specifically, not to the role\'s own ARN. Using this subtopic\'s theory, explain why the boundary didn\'t block this.',
    hint: 'The role\'s permission boundary limits what the role\'s OWN identity-based policy can grant — but AWS documents a specific exception for resource-based policies naming a particular form of ARN. Which ARN form did the partner\'s bucket policy actually use?',
    solution: 'Per this subtopic\'s theory, the boundary didn\'t block this because the partner bucket\'s policy grants access to the ASSUMED-ROLE SESSION ARN (arn:aws:sts::...:assumed-role/CicdDeployRole/prod-deploy) rather than the role\'s own ARN (arn:aws:iam::...:role/CicdDeployRole). AWS\'s own documentation states that permissions granted directly to a role session by a resource-based policy are not limited by an implicit deny in the role\'s permission boundary — this exception applies specifically to the session-ARN form, not the role-ARN form. Had the partner bucket\'s policy instead named the role\'s own ARN, the permission boundary would have correctly capped the grant, exactly as the security team originally expected and as the main page\'s own general framing describes. The security team\'s underlying assumption — that a permission boundary is an absolute, unconditional cap on everything the role could ever do — was incomplete specifically because it didn\'t account for this session-ARN exception. To actually close this gap, the security team needs a different control: either auditing external resource-based policies across the organization for grants that reference this role\'s assumed-role session ARN specifically (a boundary alone cannot prevent this), or restructuring the role\'s own trust policy and session-naming conventions to make such targeted, session-specific grants harder for outside teams to construct in the first place.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'A permission boundary on an IAM role, matching the main page\'s own description, is an absolute, unconditional cap on every permission that role could ever exercise, from any source.',
      reality: 'Per this subtopic\'s theory, AWS documents a specific exception: a resource-based policy that grants permissions directly to the role\'s ASSUMED-ROLE SESSION ARN (rather than the role\'s own ARN) is not limited by the role\'s permission boundary at all.'
    },
    {
      thought: 'The role ARN (arn:aws:iam::...:role/RoleName) and the assumed-role session ARN (arn:aws:sts::...:assumed-role/RoleName/session-name) are just two different ways of referring to the exact same principal, with identical policy evaluation behavior.',
      reality: 'Per this subtopic\'s theory, these are treated differently for permission-boundary purposes specifically — a resource-based policy grant to the role ARN is capped by the boundary, while the same kind of grant to the assumed-role session ARN is not.'
    },
    {
      thought: 'If a security review confirms a role\'s permission boundary correctly blocks an action when the role\'s own ARN is granted access via a resource-based policy, that same boundary will also block the action for any other way that role could be granted access.',
      reality: 'Per this subtopic\'s exercise, a boundary check performed against the role-ARN form of a grant does not confirm behavior for the session-ARN form — the two need to be tested separately, since AWS treats them differently for boundary enforcement.'
    }
  ];
}
