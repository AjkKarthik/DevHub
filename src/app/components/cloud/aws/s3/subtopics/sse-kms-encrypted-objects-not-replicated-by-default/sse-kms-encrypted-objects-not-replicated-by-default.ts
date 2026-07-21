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
  templateUrl: './sse-kms-encrypted-objects-not-replicated-by-default.html',
  styleUrl: './sse-kms-encrypted-objects-not-replicated-by-default.scss'
})
export class SseKmsEncryptedObjectsNotReplicatedByDefaultSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page\'s own bucket setup and replication examples never intersect — but they should',
      points: [
        'The main page\'s own "Bucket Operations" code tab enables SSE-KMS encryption on the bucket by default ("SSEAlgorithm": "aws:kms"). Separately, its own "Replication" code tab sets up Cross-Region Replication with a basic configuration — Role, Rules, Filter, Destination — with no mention of encryption at all.',
        'Read together, a reader might reasonably assume these two features simply compose: encrypt the bucket by default, set up replication, and both replicated and non-replicated objects behave consistently. AWS\'s own documentation draws a sharp, easy-to-miss exception around exactly this combination.',
      ]
    },
    {
      heading: 'SSE-KMS (and DSSE-KMS) encrypted objects are NOT replicated unless explicitly opted in',
      points: [
        'Per AWS\'s own documentation: "By default, Amazon S3 doesn\'t replicate objects that are encrypted with SSE-KMS or DSSE-KMS." This applies even when replication is otherwise fully and correctly configured — SSE-S3-encrypted and SSE-C-encrypted objects DO replicate normally by default; only the KMS-based encryption types are excluded.',
        'The failure mode this creates is genuinely dangerous for a DR or compliance setup: replication appears to be "working" — unencrypted and SSE-S3-encrypted objects show up correctly in the destination bucket, replication metrics report success — while every SSE-KMS-encrypted object (exactly what the main page\'s own bucket setup default-encrypts every new object with) is silently skipped, with no error surfaced anywhere in the standard replication status unless you specifically check for it.',
        'To opt in, AWS\'s own documentation requires TWO additions to the replication configuration together: a SourceSelectionCriteria element with SseKmsEncryptedObjects set to Enabled (this is the explicit opt-in switch), AND a ReplicaKmsKeyID inside the Destination\'s EncryptionConfiguration, specifying a KMS key that must be created in the SAME Region as the destination bucket. Missing either piece — enabling one but not the other — does not work.',
        'This also requires additional IAM permissions beyond a standard replication role: the role needs kms:Decrypt for the source object\'s KMS key and kms:Encrypt for the destination\'s KMS key, and AWS\'s own guidance specifically recommends s3:GetObjectVersionForReplication over the older s3:GetObjectVersion action — the older action does NOT extend to KMS-encrypted objects at all, meaning a replication role built before this requirement existed may need updating even after the SourceSelectionCriteria and ReplicaKmsKeyID pieces are correctly added.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Reproducing the silent gap — default-encrypted objects, replication "working"',
      language: 'bash',
      code: `# Following the main page's own two examples together: a bucket
# with default SSE-KMS encryption, and basic replication configured
# exactly as the main page's own "Replication" code tab shows:
aws s3api put-bucket-encryption \\
  --bucket source-bucket \\
  --server-side-encryption-configuration '{
    "Rules": [{
      "ApplyServerSideEncryptionByDefault": {
        "SSEAlgorithm": "aws:kms",
        "KMSMasterKeyID": "arn:aws:kms:eu-west-1:123:key/source-key"
      }
    }]
  }'

aws s3api put-bucket-replication \\
  --bucket source-bucket \\
  --replication-configuration '{
    "Role": "arn:aws:iam::123:role/S3ReplicationRole",
    "Rules": [{
      "ID": "replicate-all", "Status": "Enabled",
      "Filter": { "Prefix": "" },
      "Destination": { "Bucket": "arn:aws:s3:::destination-bucket" }
    }]
  }'
# -- no SourceSelectionCriteria, no ReplicaKmsKeyID -- exactly
# matching the main page's own bare-bones replication example.

# Upload an object -- it's automatically SSE-KMS encrypted per the
# bucket's default encryption setting:
aws s3 cp report.csv s3://source-bucket/report.csv

# Check replication status on the SOURCE object:
aws s3api head-object --bucket source-bucket --key report.csv \\
  --query 'ReplicationStatus'
# null   <- no replication status at all -- the object was never
# even considered for replication, because SSE-KMS objects are
# excluded by default. No error, no failed status -- it's simply
# never attempted, so there is nothing to alert on in a typical
# "check for FAILED replication status" monitoring setup.

# Confirm it's genuinely absent from the destination:
aws s3api head-object --bucket destination-bucket --key report.csv
# An error occurred (404): Not Found`,
    },
    {
      label: 'The correct opt-in configuration',
      language: 'bash',
      code: `# BOTH pieces are required together: SourceSelectionCriteria (the
# explicit opt-in) AND a ReplicaKmsKeyID for the destination:
aws s3api put-bucket-replication \\
  --bucket source-bucket \\
  --replication-configuration '{
    "Role": "arn:aws:iam::123:role/S3ReplicationRole",
    "Rules": [{
      "ID": "replicate-all", "Status": "Enabled",
      "Filter": { "Prefix": "" },
      "SourceSelectionCriteria": {
        "SseKmsEncryptedObjects": { "Status": "Enabled" }
      },
      "Destination": {
        "Bucket": "arn:aws:s3:::destination-bucket",
        "EncryptionConfiguration": {
          "ReplicaKmsKeyID": "arn:aws:kms:us-west-2:123:key/dest-key"
        }
      }
    }]
  }'

# The replication IAM role ALSO needs additional KMS permissions --
# a plain S3-actions-only role (sufficient for unencrypted/SSE-S3
# replication) is not enough:
aws iam put-role-policy \\
  --role-name S3ReplicationRole \\
  --policy-name kms-replication-permissions \\
  --policy-document '{
    "Version": "2012-10-17",
    "Statement": [
      { "Effect": "Allow", "Action": "kms:Decrypt",
        "Resource": "arn:aws:kms:eu-west-1:123:key/source-key" },
      { "Effect": "Allow", "Action": "kms:Encrypt",
        "Resource": "arn:aws:kms:us-west-2:123:key/dest-key" }
    ]
  }'

# Re-uploading and re-checking:
aws s3 cp report.csv s3://source-bucket/report.csv
aws s3api head-object --bucket source-bucket --key report.csv \\
  --query 'ReplicationStatus'
# "COMPLETED"   <- now genuinely replicated.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A team sets up a bucket for compliance data with default SSE-KMS encryption (following the main page\'s own bucket-setup example) and configures Cross-Region Replication for disaster recovery (following the main page\'s own replication example). Six months later, during an actual DR failover test, they discover the destination bucket in the DR region is nearly empty — almost none of the compliance data made it across, even though replication had shown no errors the entire time. Using this subtopic\'s theory, explain the most likely root cause, and why standard replication monitoring didn\'t catch it.',
    hint: 'What encryption type does the bucket apply to every object by default, and does that specific encryption type replicate under a bare-bones replication configuration like the main page\'s own example?',
    solution: 'Per this subtopic\'s theory, the most likely root cause is that every object in this bucket was automatically SSE-KMS encrypted (the bucket\'s own default encryption setting), and SSE-KMS-encrypted objects are NOT replicated by default under AWS\'s own documented behavior — the team\'s replication configuration, matching the main page\'s own bare-bones example, never included the required SourceSelectionCriteria.SseKmsEncryptedObjects opt-in or a ReplicaKmsKeyID for the destination. This explains why the DR bucket was nearly empty despite months of apparently error-free replication: SSE-KMS objects were never attempted for replication at all — there was no failure to report, because the objects were silently excluded from the replication process entirely, rather than failing an attempted replication. Standard replication monitoring (checking for a FAILED ReplicationStatus, or replication metrics/alarms) would not catch this, because a "never attempted" object has no ReplicationStatus at all — it looks identical, from a monitoring standpoint, to an object that was never modified since the last successful sync, not like a failure. The fix, per this subtopic\'s theory, requires updating the replication configuration to add both the SourceSelectionCriteria opt-in and a valid ReplicaKmsKeyID in the same Region as the destination bucket, plus granting the replication IAM role the additional kms:Decrypt/kms:Encrypt permissions for both the source and destination KMS keys — and then using S3 Batch Replication to backfill the compliance data that was already silently skipped, since fixing the configuration going forward does not retroactively replicate previously-uploaded objects.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'S3 replication treats all forms of server-side encryption (SSE-S3, SSE-KMS, SSE-C) the same way — if replication is configured and working for one, it works for all of them.',
      reality: 'Per this subtopic\'s theory, AWS\'s own documentation draws a specific exception for SSE-KMS and DSSE-KMS encrypted objects — these are excluded from replication by default, while SSE-S3 and SSE-C encrypted objects replicate normally without any additional configuration.'
    },
    {
      thought: 'If S3 replication silently fails to replicate some objects, the replication status or CloudWatch metrics will show a FAILED state that monitoring can catch.',
      reality: 'Per this subtopic\'s exercise, objects excluded from replication by the SSE-KMS default are never ATTEMPTED for replication at all — they show no ReplicationStatus and no failure metric, making this gap invisible to standard "alert on replication failure" monitoring.'
    },
    {
      thought: 'Adding a SourceSelectionCriteria element with SseKmsEncryptedObjects set to Enabled is, by itself, sufficient to replicate SSE-KMS encrypted objects.',
      reality: 'Per this subtopic\'s theory, AWS requires TWO pieces together — the SourceSelectionCriteria opt-in AND a ReplicaKmsKeyID in the destination\'s EncryptionConfiguration, plus additional kms:Decrypt/kms:Encrypt IAM permissions on the replication role — missing any one of these still results in SSE-KMS objects not being replicated.'
    }
  ];
}
