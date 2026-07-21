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
  templateUrl: './abac-tags-need-their-own-deny-untagresource-protection.html',
  styleUrl: './abac-tags-need-their-own-deny-untagresource-protection.scss'
})
export class AbacTagsNeedTheirOwnDenyUntagresourceProtectionSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page\'s own ABAC example never protects the tags the policy depends on',
      points: [
        'The main page\'s own "ABAC Policy" code tab shows a policy that grants ec2:StartInstances/StopInstances when ec2:ResourceTag/Team equals aws:PrincipalTag/Team, then separately shows tagging the role and tagging the instance — with no mention of who is ALLOWED to change either tag afterward.',
        'This creates an implicit, unstated assumption: that the tags themselves are stable, trustworthy inputs to the access decision. Nothing in the ABAC policy itself, or in the main page\'s own theory bullets, actually enforces that assumption.',
      ]
    },
    {
      heading: 'ABAC\'s security model depends entirely on tag integrity — AWS\'s own reference implementation explicitly locks the tags down',
      points: [
        'ABAC works by comparing a resource\'s tags to the calling principal\'s own tags — but a resource\'s tags are, by default, just more metadata that anyone with ordinary tagging permissions (ec2:CreateTags, secretsmanager:TagResource, etc.) can change. If a principal can both read a resource AND retag it, they could potentially retag it to match their OWN principal tags — self-granting access the original ABAC design never intended.',
        'AWS\'s own official ABAC tutorial policy includes a statement specifically to prevent this: a Deny statement blocking secretsmanager:UntagResource for any tag key matching the "access-*" prefix used by the ABAC condition, with the explicit comment "These tags are used to control access to resources, therefore removing tags might remove permissions." This is presented as a REQUIRED part of AWS\'s own reference ABAC implementation, not an optional hardening step.',
        'The main page\'s own ABAC example (EC2 instances tagged by Team) has the same latent exposure: nothing in its own policy or theory bullets stops a principal who can already ec2:CreateTags from simply retagging a DIFFERENT team\'s instance to their own Team value, then starting/stopping it under the ABAC rule\'s own logic — the ABAC condition itself would then correctly, faithfully grant access to a resource that was never supposed to be theirs.',
        'AWS\'s own reference policy also separately denies actions like secretsmanager:*Policy (permissions-management actions) for the same underlying reason: any lever that can change WHO can access a resource — tags feeding an ABAC condition, or a resource-based policy directly — needs its own explicit protection, not just the primary ABAC condition itself.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Reproducing the main page\'s own ABAC gap — a self-granted access exploit',
      language: 'bash',
      code: `# Matching the main page's own ABAC example exactly:
cat << 'EOF' > abac-policy.json
{
  "Version": "2012-10-17",
  "Statement": [{
    "Effect": "Allow",
    "Action": ["ec2:StartInstances", "ec2:StopInstances"],
    "Resource": "*",
    "Condition": {
      "StringEquals": { "ec2:ResourceTag/Team": "\${aws:PrincipalTag/Team}" }
    }
  }]
}
EOF

# Alice's role is tagged Team=payments -- she should only be able to
# start/stop payments-team instances:
aws iam tag-role --role-name alice-role --tags Key=Team,Value=payments

# billing-team-instance (i-9999999999) is tagged Team=billing --
# alice should NOT be able to touch it, per the ABAC condition.

# BUT if alice also has ordinary ec2:CreateTags permission (a very
# common, seemingly-unrelated grant for general resource tagging):
aws ec2 create-tags --resources i-9999999999 --tags Key=Team,Value=payments

# The instance's OWN tag now matches alice's principal tag -- the
# ABAC policy above evaluates this exactly as designed, and now
# genuinely allows it:
aws ec2 start-instances --instance-ids i-9999999999
# SUCCEEDS -- alice just retagged another team's instance to match
# her own Team tag, and the ABAC rule correctly (and unintentionally)
# granted her access to it -- the main page's own ABAC example has
# no statement anywhere preventing this.`,
    },
    {
      label: 'AWS\'s own reference fix: an explicit Deny on the ABAC tag itself',
      language: 'bash',
      code: `# AWS's own official ABAC tutorial policy includes exactly this
# protection for its own Secrets Manager example -- adapting the
# same pattern to this EC2 scenario:
cat << 'EOF' > abac-policy-protected.json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "StartStopByTeamTag",
      "Effect": "Allow",
      "Action": ["ec2:StartInstances", "ec2:StopInstances"],
      "Resource": "*",
      "Condition": {
        "StringEquals": { "ec2:ResourceTag/Team": "\${aws:PrincipalTag/Team}" }
      }
    },
    {
      "Sid": "DenyChangingTeamTag",
      "Effect": "Deny",
      "Action": ["ec2:CreateTags", "ec2:DeleteTags"],
      "Resource": "*",
      "Condition": {
        "ForAnyValue:StringEquals": { "aws:TagKeys": "Team" }
      }
    }
  ]
}
EOF
# -- this mirrors AWS's own "DenyUntagSecretsManagerReservedTags"
# statement from the official ABAC tutorial almost exactly, just
# applied to EC2's own tagging actions and this scenario's own
# "Team" tag key instead of Secrets Manager's "access-*" prefix.

# Re-running the exact same retagging attempt from before:
aws ec2 create-tags --resources i-9999999999 --tags Key=Team,Value=payments
# AccessDenied -- the explicit Deny on changing the Team tag blocks
# this outright, regardless of what other tagging permissions alice
# might otherwise have -- her ability to start/stop instances now
# genuinely depends on the tags being set correctly by someone
# ELSE (an administrator, or a separate, more trusted process), not
# on anything alice herself can manipulate.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A platform team implements ABAC exactly matching the main page\'s own example — engineers can start/stop EC2 instances tagged with their own Team principal tag. Months later, a security review discovers that any engineer with the general "ec2:CreateTags" permission (granted broadly for cost-allocation tagging purposes, unrelated to the ABAC policy) can retag ANY team\'s instance to their own team and then control it. Using this subtopic\'s theory, is this a flaw in the ABAC condition logic itself, or something else — and what\'s the fix?',
    hint: 'Does the ABAC condition (ec2:ResourceTag/Team equals aws:PrincipalTag/Team) evaluate correctly given the tags AS THEY CURRENTLY EXIST — or does it also verify that those tags haven\'t been tampered with by the very principal being evaluated?',
    solution: 'Per this subtopic\'s theory, this is not a flaw in the ABAC condition\'s own logic — the condition evaluates perfectly correctly given whatever the resource\'s tags currently say. The actual gap is that nothing separately protects the "Team" tag itself from being changed by the same principals the ABAC policy is meant to constrain — a broadly-granted, seemingly unrelated ec2:CreateTags permission (for cost-allocation purposes, as described) is sufficient to retag any instance and make the ABAC condition genuinely, correctly grant access to it. This matches exactly what AWS\'s own official ABAC reference implementation anticipates and explicitly guards against with a dedicated Deny statement blocking changes to the ABAC-relevant tag keys. The fix, per this subtopic\'s theory, is adding an explicit Deny statement (mirroring AWS\'s own reference pattern) blocking ec2:CreateTags and ec2:DeleteTags specifically for the "Team" tag key — this doesn\'t need to block all tagging, just changes to the ONE tag key the ABAC security model actually depends on — restoring the assumption that the ABAC condition\'s inputs (the tags) can only be set by a trusted, separate process (an administrator, a provisioning pipeline) rather than by the same principals whose access the tags are meant to control.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'An ABAC policy like the main page\'s own EC2 example is self-contained and secure on its own — the condition logic itself is the whole security boundary.',
      reality: 'Per this subtopic\'s theory, an ABAC condition is only as trustworthy as the tags it reads — if the same principals it constrains can also freely change those tags via an unrelated tagging permission, they can retag a resource to match their own principal tags and self-grant access the policy never intended.'
    },
    {
      thought: 'Since AWS provides ABAC as a first-class access control mechanism, using it means AWS automatically protects the underlying tags from tampering by the same principals being evaluated.',
      reality: 'Per this subtopic\'s theory, AWS does not automatically protect ABAC-relevant tags — its own official ABAC tutorial explicitly adds a separate Deny statement to block changes to the tags the policy depends on, treating this as a required, deliberate step, not something built in by default.'
    },
    {
      thought: 'Protecting ABAC-relevant tags from tampering requires blocking ALL tagging actions for the affected principals, which would break legitimate cost-allocation or metadata tagging workflows.',
      reality: 'Per this subtopic\'s code example, the Deny statement can be scoped specifically to the ABAC-relevant tag KEY (e.g. "Team") using a TagKeys condition — other, unrelated tags used for cost allocation or general metadata remain freely editable, since only the security-sensitive tag key needs protection.'
    }
  ];
}
