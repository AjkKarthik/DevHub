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
  templateUrl: './distributed-map-lifts-classic-maps-40-concurrency-cap.html',
  styleUrl: './distributed-map-lifts-classic-maps-40-concurrency-cap.scss'
})
export class DistributedMapLiftsClassicMaps40ConcurrencyCapSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page\'s own Map quickRef states "up to 40 concurrency" as if that\'s Map\'s own ceiling — while its own ETL pattern would strain against it',
      points: [
        'The main page\'s own quickRef states: "Map State: Iterates over an array, running states for each element — sequential or concurrent (up to 40 concurrency)." Its own separate theory bullet adds: "Map: iterates over event.items array; MaxConcurrency controls parallelism (0 = unlimited, 1 = sequential)" — "0 = unlimited" directly conflicts with the quickRef\'s own stated "up to 40" ceiling, a real inconsistency worth resolving.',
        'The main page\'s own "Common Patterns" theory names exactly the use case that strains against these limits: "ETL pipeline: EventBridge schedule → Step Functions → Map over S3 objects → Lambda transform → DynamoDB write." Its own separate mistake entry already teaches storing large PAYLOADS in S3 — but the Map state\'s own example (ItemsPath: "$.items") still assumes the full item ARRAY itself is already inline in the state\'s input, never addressing what happens when the dataset of items to iterate over is itself too large or numerous for that.',
      ]
    },
    {
      heading: 'AWS documents two distinct Map processing modes — Inline caps hard at 40/25,000/256 KiB; Distributed removes all three ceilings',
      points: [
        'Per AWS\'s own documentation: "Inline – Limited-concurrency mode... this mode supports up to 40 concurrent iterations." Critically, a SECOND limit the main page\'s own quickRef never mentions at all: "By default, Map states run in Inline mode... Enforces a limit of 256 KiB on the input payload size and 25,000 entries in the execution event history."',
        'AWS states directly when Inline mode breaks down: "Use the Map state in Inline mode if your workflow\'s execution history won\'t exceed 25,000 entries, or if you don\'t require more than 40 concurrent iterations." A Standard workflow with a classic Map state iterating a few thousand items — each iteration contributing several history events — can hit the 25,000-entry ceiling and fail well BEFORE the 40-concurrency limit is ever the actual bottleneck.',
        'Distributed mode is AWS\'s own designed answer for exactly the main page\'s own ETL pattern: "Distributed – High-concurrency mode. In this mode, the Map state runs each iteration as a child workflow execution, which enables high concurrency of up to 10,000 parallel child workflow executions. Each child workflow execution has its own, separate execution history from that of the parent workflow. In this mode, the Map state can accept either a JSON array or an Amazon S3 data source, such as a CSV file, as its input." This resolves both problems simultaneously — concurrency jumps from 40 to 10,000, and per-item history no longer counts against the parent\'s own 25,000-entry ceiling at all.',
        'AWS\'s own explicit guidance on when to reach for Distributed Map: "Use the Map state in Distributed mode when you need to orchestrate large-scale parallel workloads that meet any combination of the following conditions: The size of your dataset exceeds 256 KiB. The workflow\'s execution event history would exceed 25,000 entries. You need a concurrency of more than 40 concurrent iterations." All three conditions map directly onto the ETL-over-S3-objects pattern the main page\'s own theory names as a use case.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Reproducing the classic Map ceiling — history, not concurrency, fails first',
      language: 'bash',
      code: `# The main page's own ETL pattern, implemented with a classic
# (Inline, the DEFAULT) Map state -- MaxConcurrency kept
# deliberately well under the documented 40 limit:
# "ProcessFiles": {
#   "Type": "Map",
#   "ItemsPath": "$.s3Objects",
#   "MaxConcurrency": 10,
#   "Iterator": {
#     "StartAt": "TransformFile",
#     "States": { "TransformFile": {"Type":"Task","Resource":"arn:...","End":true} }
#   },
#   "Next": "Done"
# }

# Works fine in testing with a small sample (50 objects):
aws stepfunctions start-execution \\
  --state-machine-arn arn:aws:states:us-east-1:123:stateMachine:etl-pipeline \\
  --input '{"s3Objects": [/* 50 items */]}'
# SUCCEEDED

# Fails against the real nightly volume (a few thousand objects),
# despite MaxConcurrency staying at 10, well under the 40 cap:
aws stepfunctions start-execution \\
  --state-machine-arn arn:aws:states:us-east-1:123:stateMachine:etl-pipeline \\
  --input '{"s3Objects": [/* 4,000 items */]}'

aws stepfunctions describe-execution \\
  --execution-arn arn:aws:states:us-east-1:123:execution:etl-pipeline:exec-id \\
  --query '{Status:status,Error:error,Cause:cause}'
# {
#   "Status": "FAILED",
#   "Error": "States.HistoryEventLimitExceeded" (or similar),
#   "Cause": "..."
# }
# -- per AWS's own docs, each Inline Map iteration's events count
# against the PARENT workflow's own 25,000-entry execution history
# ceiling -- MaxConcurrency was never the actual constraint here.`,
    },
    {
      label: 'The fix — Distributed Map, reading directly from S3',
      language: 'bash',
      code: `# The SAME ETL pattern, using Distributed Map -- reads the item
# list directly from S3 instead of requiring it inline in the
# state's own input, and runs each iteration as its OWN child
# workflow execution with a separate history:
# "ProcessFiles": {
#   "Type": "Map",
#   "ItemProcessor": {
#     "ProcessorConfig": { "Mode": "DISTRIBUTED", "ExecutionType": "STANDARD" },
#     "StartAt": "TransformFile",
#     "States": { "TransformFile": {"Type":"Task","Resource":"arn:...","End":true} }
#   },
#   "ItemReader": {
#     "Resource": "arn:aws:states:::s3:listObjectsV2",
#     "Parameters": { "Bucket": "nightly-uploads", "Prefix": "batch/" }
#   },
#   "MaxConcurrency": 500,
#   "Next": "Done"
# }
# -- MaxConcurrency of 500 is well above the classic Map's 40 cap,
# and per AWS's own docs, is supported up to 10,000.

aws stepfunctions start-execution \\
  --state-machine-arn arn:aws:states:us-east-1:123:stateMachine:etl-pipeline-distributed \\
  --input '{}'
# SUCCEEDED -- processed the full 4,000-object nightly batch.

# Confirm via DescribeMapRun -- per AWS's own docs, this is the
# dedicated observability resource for a Distributed Map's own
# child executions, separate from the parent's own execution
# history:
aws stepfunctions describe-map-run \\
  --map-run-arn arn:aws:states:us-east-1:123:mapRun:etl-pipeline-distributed/... \\
  --query '{Total:itemCounts.total,Succeeded:itemCounts.succeeded,MaxConcurrency:maxConcurrency}'
# { "Total": 4000, "Succeeded": 4000, "MaxConcurrency": 500 }`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'Following the main page\'s own ETL pattern literally ("Map over S3 objects → Lambda transform → DynamoDB write"), a team implements a nightly batch job using a classic (Inline, the default) Map state, with MaxConcurrency set to 10 — well under the documented 40 limit. It passes every test with a small sample dataset. In production, once it runs against the real nightly volume of several thousand files, the execution fails with a history-related error, despite concurrency never approaching 40. Using this subtopic\'s theory, diagnose the actual bottleneck and the fix.',
    hint: 'The main page\'s own quickRef only ever mentions a 40-concurrency ceiling for Map states. Per AWS\'s own documentation, is concurrency the ONLY limit an Inline Map state is subject to?',
    solution: 'Per this subtopic\'s theory, the actual bottleneck is very likely the classic (Inline) Map state\'s separate, undocumented-on-the-main-page 25,000-entry execution history limit, not concurrency at all. AWS\'s own documentation states directly that Inline mode "Enforces a limit of 256 KiB on the input payload size and 25,000 entries in the execution event history" — and each of the thousands of Map iterations in this nightly job contributes multiple events (started, succeeded, etc.) to the SAME parent workflow\'s own execution history, regardless of how low MaxConcurrency is set. At real production volume, the cumulative history from thousands of iterations can exceed 25,000 entries and fail the execution, entirely independent of the 40-concurrency ceiling the main page\'s own quickRef exclusively mentions. The fix is switching this Map state to Distributed mode — per AWS\'s own documentation, "the Map state runs each iteration as a child workflow execution, which enables high concurrency of up to 10,000 parallel child workflow executions. Each child workflow execution has its own, separate execution history from that of the parent workflow" — which resolves the history-accumulation problem directly (child executions don\'t count against the parent\'s own 25,000-entry ceiling at all) and additionally allows MaxConcurrency to be raised well past 40 if genuinely needed, plus lets the Map state read its item list directly from an S3 data source instead of requiring the full array inline in the state\'s own input.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'A Map state\'s only real constraint is its MaxConcurrency setting (up to 40 for the default mode) — as long as concurrency stays comfortably under that, arbitrarily large arrays are safe to process.',
      reality: 'Per this subtopic\'s theory, AWS\'s own documentation states Inline Map also "Enforces a limit of 256 KiB on the input payload size and 25,000 entries in the execution event history" — a large enough item count can exhaust the history limit long before concurrency becomes relevant.'
    },
    {
      thought: 'A Map state\'s input must always be a JSON array already present in the state\'s own input — there\'s no way to have Map read a large dataset directly from a source like S3.',
      reality: 'Per this subtopic\'s theory, AWS\'s own documentation states Distributed mode Map states "can accept either a JSON array or an Amazon S3 data source, such as a CSV file" as input — a documented alternative specifically for datasets too large to fit inline.'
    },
    {
      thought: 'Distributed Map is purely a performance/speed upgrade over Inline Map, with no real difference in what data sources or dataset sizes it can actually accept as input.',
      reality: 'Per this subtopic\'s theory, the difference is structural, not just speed — Distributed Map runs each iteration as its own separate child workflow execution with its own execution history, which is precisely what removes the 25,000-entry ceiling Inline Map is bound by, independent of concurrency settings.'
    }
  ];
}
