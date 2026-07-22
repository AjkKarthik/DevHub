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
  templateUrl: './objects-under-128kb-dont-transition-storage-class-by-default.html',
  styleUrl: './objects-under-128kb-dont-transition-storage-class-by-default.scss'
})
export class ObjectsUnder128kbDontTransitionStorageClassByDefaultSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page\'s own lifecycle example never mentions object size at all',
      points: [
        'The main page\'s own "Lifecycle Rules" theory and its own code tab both describe transitions purely in terms of AGE: "move objects to a cheaper class after N days," with a worked example of Standard → Standard-IA after 30 days → Glacier after 90 days → expire after 365 days. Object SIZE never enters the discussion.',
        'This silently assumes every object in the targeted prefix is large enough that a transition is actually worth doing — but AWS applies a default constraint based purely on object size, independent of how the lifecycle rule\'s age-based transitions are configured.',
      ]
    },
    {
      heading: 'Objects smaller than 128 KB do not transition to ANY storage class by default',
      points: [
        'Per AWS\'s own documentation: "Amazon S3 applies a default behavior to S3 Lifecycle configurations that prevents objects smaller than 128 KB from being transitioned to any storage class." The reasoning is cost-based — each transition is billed as a request, and for a small object, the transition request cost can exceed the storage savings from moving it to a cheaper class.',
        'This is a genuinely silent behavior: a lifecycle rule configured exactly like the main page\'s own "archive-logs" example, applied to a prefix containing many small log files, will simply leave those small objects sitting in S3 Standard indefinitely — the rule doesn\'t error, doesn\'t warn, and running get-bucket-lifecycle-configuration shows the rule exactly as configured. The exclusion only becomes visible by actually checking each object\'s current storage class over time.',
        'AWS\'s own documentation notes this exact default changed in September 2024 — before that date, small objects were still blocked from transitioning to Standard-IA/One Zone-IA, but WERE still allowed to transition to Glacier Flexible Retrieval and Glacier Deep Archive. Since September 2024, the 128 KB minimum applies uniformly across every storage class, including Glacier — a configuration that worked as expected before that date can now silently leave small objects un-transitioned even for Glacier destinations.',
        'To override this default and allow smaller objects to transition anyway, AWS\'s own documentation states you add an object size filter to the lifecycle rule — specifically ObjectSizeGreaterThan (or the newer x-amz-transition-default-minimum-object-size request header to change the account-wide default) — there is no way to opt back in globally without touching the rule\'s own filter or this specific header.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Reproducing the silent exclusion — the main page\'s own lifecycle rule, on small objects',
      language: 'bash',
      code: `# Apply the main page's own "archive-logs" lifecycle rule to a
# prefix containing a mix of large and small log files:
aws s3api put-bucket-lifecycle-configuration \\
  --bucket my-company-data-prod \\
  --lifecycle-configuration '{
    "Rules": [{
      "ID": "archive-logs",
      "Status": "Enabled",
      "Filter": { "Prefix": "logs/" },
      "Transitions": [
        { "Days": 30, "StorageClass": "STANDARD_IA" },
        { "Days": 90, "StorageClass": "GLACIER" }
      ],
      "Expiration": { "Days": 365 }
    }]
  }'

# Upload a mix: a normal-sized log file and a tiny one
aws s3 cp big-access-log.txt s3://my-company-data-prod/logs/big-access-log.txt   # 2.4 MB
aws s3 cp tiny-heartbeat.txt s3://my-company-data-prod/logs/tiny-heartbeat.txt   # 40 bytes

# ...31+ days later, check each object's actual storage class:
aws s3api head-object --bucket my-company-data-prod --key logs/big-access-log.txt \\
  --query 'StorageClass'
# "STANDARD_IA"   <- transitioned correctly, as expected

aws s3api head-object --bucket my-company-data-prod --key logs/tiny-heartbeat.txt \\
  --query 'StorageClass'
# null (still STANDARD)   <- NEVER transitioned -- silently excluded
# by the default 128 KB minimum, even though the rule applies to
# BOTH objects identically and neither the rule config nor any API
# response indicates why.`,
    },
    {
      label: 'Explicitly allowing small objects to transition',
      language: 'bash',
      code: `# Add an object size filter to explicitly opt small objects back
# into the SAME transition rule -- ObjectSizeGreaterThan set to 0
# (or any value below the smallest object you want to allow) removes
# the 128 KB default floor for this rule specifically:
aws s3api put-bucket-lifecycle-configuration \\
  --bucket my-company-data-prod \\
  --lifecycle-configuration '{
    "Rules": [{
      "ID": "archive-logs-including-small-files",
      "Status": "Enabled",
      "Filter": {
        "And": {
          "Prefix": "logs/",
          "ObjectSizeGreaterThan": 0
        }
      },
      "Transitions": [
        { "Days": 30, "StorageClass": "STANDARD_IA" },
        { "Days": 90, "StorageClass": "GLACIER" }
      ],
      "Expiration": { "Days": 365 }
    }]
  }'

# Re-checking the same tiny object after this change and another
# transition cycle:
aws s3api head-object --bucket my-company-data-prod --key logs/tiny-heartbeat.txt \\
  --query 'StorageClass'
# "STANDARD_IA"   <- now transitions correctly.

# NOTE, per AWS's own cost guidance: transitioning many small
# objects still incurs one transition REQUEST per object -- for a
# prefix with millions of tiny files, this can be a real, deliberate
# cost tradeoff, not just a bug to "fix" without considering whether
# the transition savings genuinely outweigh the per-object request
# cost the 128 KB default was specifically designed to avoid.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A team configures a lifecycle rule closely matching the main page\'s own "archive-logs" example — transitioning objects under logs/ to Standard-IA after 30 days, to Glacier after 90 days. Three months later, a cost review shows the bucket\'s S3 Standard storage cost hasn\'t dropped as much as expected. Investigating, the team finds thousands of small (2-3 KB) JSON event files under logs/ that are STILL in S3 Standard, well past their 30-day transition point, even though larger log files in the same prefix transitioned correctly on schedule. Using this subtopic\'s theory, explain what\'s happening, and what the team needs to decide before "fixing" it.',
    hint: 'The rule applies to the whole prefix and clearly works for SOME objects — what property of the un-transitioned files, other than their prefix or age, might be different from the ones that did transition?',
    solution: 'Per this subtopic\'s theory, the small JSON event files are very likely under 128 KB each, which means they fall under AWS\'s own default behavior that prevents objects smaller than 128 KB from transitioning to any storage class — this explains exactly why they stayed in Standard while larger files in the same prefix, under the same rule, transitioned normally: the rule\'s age-based logic is identical for both, but the size-based default silently exempts anything below the 128 KB floor. This is not a misconfiguration of the rule\'s Days or StorageClass values — it\'s AWS\'s own built-in exclusion, invisible in the lifecycle configuration itself and only detectable by checking the actual objects\' current storage class. Before "fixing" this by adding an ObjectSizeGreaterThan filter to include the small files, per this subtopic\'s theory the team needs to weigh AWS\'s own stated reasoning for the default: each transitioned object incurs a per-object transition request charge, and for thousands of 2-3 KB files, the cumulative transition request cost could easily exceed whatever storage savings moving them to Standard-IA would provide — the "fix" is only a genuine cost improvement if the math works out in the team\'s specific favor, not automatically the right move just because the files were unexpectedly excluded.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'A lifecycle rule configured with Transitions and Days, matching the main page\'s own example exactly, will transition every object matching the rule\'s prefix filter regardless of the object\'s size.',
      reality: 'Per this subtopic\'s theory, AWS applies a default 128 KB minimum size requirement for ANY storage class transition — objects smaller than that are silently excluded unless an explicit object size filter is added to the rule.'
    },
    {
      thought: 'If a lifecycle rule appears correctly configured (via get-bucket-lifecycle-configuration) and some objects in the prefix aren\'t transitioning, the rule itself must be misconfigured.',
      reality: 'Per this subtopic\'s exercise, the rule configuration can be entirely correct — the actual cause is often the untransitioned objects being smaller than the 128 KB default floor, which is invisible in the rule\'s own configuration and only detectable by checking individual objects\' storage class.'
    },
    {
      thought: 'A lifecycle rule that successfully transitioned small objects to Glacier before September 2024 will continue to do so unchanged today.',
      reality: 'Per this subtopic\'s theory, AWS changed the default small-object behavior in September 2024 — before then, small objects could still transition to Glacier Flexible Retrieval and Deep Archive specifically; since then, the 128 KB minimum applies uniformly to every storage class, including Glacier, for configurations that get modified after that date.'
    }
  ];
}
