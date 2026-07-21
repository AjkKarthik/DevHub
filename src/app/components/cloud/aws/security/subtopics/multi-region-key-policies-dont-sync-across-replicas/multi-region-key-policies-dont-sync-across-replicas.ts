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
  templateUrl: './multi-region-key-policies-dont-sync-across-replicas.html',
  styleUrl: './multi-region-key-policies-dont-sync-across-replicas.scss'
})
export class MultiRegionKeyPoliciesDontSyncAcrossReplicasSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page\'s own QnA describes multi-Region keys purely through the encrypt/decrypt benefit — never which properties travel with the key material',
      points: [
        'The main page\'s own QnA states: "AWS offers Multi-Region Keys: KMS creates key replicas with identical key material in multiple regions, allowing you to encrypt in us-east-1 and decrypt in eu-west-1." This is framed entirely around cryptographic interoperability.',
        'The main page\'s own separate KMS theory bullet on access control — "Key policy is the primary access control for CMKs — an IAM policy alone cannot grant KMS permissions unless the key policy explicitly trusts the account\'s IAM" — is presented purely in a single-key context, never revisited for what happens to that same key policy once a key is replicated across regions.',
      ]
    },
    {
      heading: 'AWS explicitly splits multi-Region key properties into "shared" (synced automatically) and "independent" (never synced) — key policy is independent',
      points: [
        'Per AWS\'s own documentation: "AWS KMS creates the replica keys with the same shared property values as those of the primary key. Then, it periodically synchronizes the shared property values of the primary key to its replica keys." The documented shared properties are: Key ID, key material, key material origin, key spec/algorithms, key usage, and automatic/on-demand rotation settings.',
        'The critical exclusion is stated directly: "All other properties of multi-Region keys are independent properties, including the key description, key policy, grants, enabled and disabled key states, aliases, and tags. You can set the same values for these properties on all related multi-Region keys, but if you change the value of an independent property, AWS KMS does not synchronize it."',
        'AWS reinforces this with a direct statement about what a replica actually is: "A replica key is a fully functional KMS key with its own key policy, grants, alias, tags, and other properties. It is not a copy of or pointer to the primary key or any other key." Despite sharing the exact same Key ID and key material as its primary, a replica\'s access control is a completely separate, independently-maintained configuration.',
        'The practical consequence: a key policy change made on the PRIMARY key — granting or revoking cross-account access, matching the main page\'s own put-key-policy example — does not propagate to any replica in any other region. Each replica keeps whatever access rules it already had until someone explicitly updates it too. This can silently create either an over-permissive replica (an access grant revoked in one region but still live elsewhere) or an under-permissive one (a new legitimate grant that only actually works in the region it was applied to).',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Reproducing the drift — a revocation that only half-worked',
      language: 'bash',
      code: `# A multi-Region primary key in us-east-1, replicated to eu-west-1
# -- matching AWS's own documented terminology exactly:
aws kms create-key --multi-region --region us-east-1 \\
  --description "Cross-region app data key"
aws kms replicate-key \\
  --key-id <primary-key-id> \\
  --replica-region eu-west-1

# Both keys share the SAME Key ID and key material -- confirmed via
# AWS's own docs ("the same key ID and key material... interoperable").
# A cross-account partner was granted decrypt access via the main
# page's own put-key-policy pattern, applied to the PRIMARY only:
aws kms put-key-policy --region us-east-1 \\
  --key-id <primary-key-id> --policy-name default \\
  --policy '{
    "Version": "2012-10-17",
    "Statement": [
      { "Sid": "Enable IAM user permissions", "Effect": "Allow",
        "Principal": { "AWS": "arn:aws:iam::111122223333:root" },
        "Action": "kms:*", "Resource": "*" },
      { "Sid": "PartnerDecrypt", "Effect": "Allow",
        "Principal": { "AWS": "arn:aws:iam::999900001111:role/Partner" },
        "Action": ["kms:Decrypt", "kms:DescribeKey"], "Resource": "*" }
    ]
  }'

# Check the REPLICA's own key policy in eu-west-1:
aws kms get-key-policy --region eu-west-1 \\
  --key-id <primary-key-id> --policy-name default
# -- the "PartnerDecrypt" statement is NOT present here. Per AWS's
# own docs, key policy is an "independent property" -- it was never
# synchronized to the replica at all, even though the Key ID and key
# material are identical in both regions.

# Result: the partner CAN decrypt in us-east-1, but gets AccessDenied
# calling kms:Decrypt against the SAME Key ID in eu-west-1.`,
    },
    {
      label: 'The fix — apply the change to every replica independently, and audit for drift',
      language: 'bash',
      code: `# Apply the equivalent policy to the replica too -- there is no
# shortcut; each region's own key policy must be maintained
# separately:
aws kms put-key-policy --region eu-west-1 \\
  --key-id <primary-key-id> --policy-name default \\
  --policy file://same-policy-as-primary.json

# A lightweight audit: enumerate every related multi-Region key and
# diff their key policies to catch drift before it becomes an
# incident (e.g. a revoked grant that's still live somewhere):
for region in us-east-1 eu-west-1 ap-southeast-1; do
  echo "=== $region ==="
  aws kms get-key-policy --region "$region" \\
    --key-id <primary-key-id> --policy-name default \\
    --query Policy --output text | jq -S . > "policy-$region.json"
done
diff policy-us-east-1.json policy-eu-west-1.json
# -- any diff here is exactly the kind of silent, independent-property
# drift AWS's own docs describe. Run this as a standing check (a
# scheduled Lambda, a CI job) rather than trusting a one-time manual
# update to stay correct as the key set grows.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'Responding to a security incident, a team revokes a compromised third-party integration\'s KMS access by editing the key policy on their multi-Region CMK\'s PRIMARY key in us-east-1, removing that principal\'s Allow statement — matching the main page\'s own single-key put-key-policy pattern. A week later, an audit discovers the same compromised principal still has active kms:Decrypt access via the key\'s replica in eu-west-1. Using this subtopic\'s theory, explain how the "revocation" left a gap, and what the team should have done instead.',
    hint: 'Per AWS\'s own documentation, which multi-Region key properties are "shared" (synced automatically to replicas) and which are "independent" (never synced)? Which category does key policy fall into?',
    solution: 'Per this subtopic\'s theory, this is exactly the independent-property gap AWS documents. Key policy is explicitly listed among the properties AWS states are NOT synchronized: "if you change the value of an independent property, AWS KMS does not synchronize it." The team\'s edit to the primary key\'s policy in us-east-1 correctly removed the compromised principal\'s access there, but the replica key in eu-west-1 — despite sharing the exact same Key ID and key material as the primary — retained its own, separately-maintained key policy exactly as it was before the edit, still granting the compromised principal decrypt access. This is precisely why AWS states a replica "is a fully functional KMS key with its own key policy... It is not a copy of or pointer to the primary key." The correct incident response would have been to apply the equivalent policy edit to EVERY related replica key independently, in every region where one exists — not just the primary — since revoking access on one region\'s key policy has no automatic effect anywhere else. Going forward, a periodic audit that diffs key policies across all replicas of a multi-Region key (as shown in this subtopic\'s own code example) would catch this kind of drift before it becomes a week-long unnoticed exposure.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'Since multi-Region KMS key replicas share the same Key ID and key material, they must also share the same key policy and access grants automatically.',
      reality: 'Per this subtopic\'s theory, AWS\'s own documentation explicitly separates these — Key ID and key material are "shared properties" synced automatically, while key policy, grants, aliases, and tags are "independent properties" that are never synchronized.'
    },
    {
      thought: 'A key policy change made to a multi-Region primary key eventually propagates to its replicas, just with some delay — similar to the eventual-consistency delay KMS documents for key material during rotation.',
      reality: 'Per this subtopic\'s theory, there is no delay-based propagation for key policy at all — it simply never syncs, on any timeline, regardless of how long you wait. Only the documented shared properties (key material, rotation settings, etc.) synchronize.'
    },
    {
      thought: 'A multi-Region replica key is essentially a pointer or lightweight alias back to the primary key\'s own configuration, rather than a fully independent KMS key resource.',
      reality: 'Per this subtopic\'s theory, AWS states directly that a replica "is a fully functional KMS key with its own key policy, grants, alias, tags, and other properties" and is "not a copy of or pointer to the primary key" — it is a genuinely separate resource that happens to share cryptographic material.'
    }
  ];
}
