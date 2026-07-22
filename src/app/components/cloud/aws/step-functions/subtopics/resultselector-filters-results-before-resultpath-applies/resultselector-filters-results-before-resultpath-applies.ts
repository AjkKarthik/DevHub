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
  templateUrl: './resultselector-filters-results-before-resultpath-applies.html',
  styleUrl: './resultselector-filters-results-before-resultpath-applies.scss'
})
export class ResultselectorFiltersResultsBeforeResultpathAppliesSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page\'s own QnA names exactly four data-flow fields — AWS documents a real fifth',
      points: [
        'The main page\'s own QnA states: "Step Functions has four JSON Path operators: InputPath (select which part of input to pass to the Resource), Parameters..., ResultPath..., and OutputPath..." — explicitly counted and named as four, no more.',
        'The main page\'s own SDK-integration codeTabs (arn:aws:states:::dynamodb:putItem, arn:aws:states:::sqs:sendMessage) show raw service-integration calls whose real-world RESPONSES include AWS SDK metadata (HTTP headers, request IDs) alongside the actual useful data — the main page never demonstrates or filters this noise anywhere.',
      ]
    },
    {
      heading: 'AWS\'s own documented fifth field — ResultSelector — sits between the raw result and ResultPath, specifically to trim SDK-integration noise',
      points: [
        'Per AWS\'s own documentation: "The ResultSelector field provides a way to manipulate the state\'s result before ResultPath is applied... AWS Step Functions applies the InputPath field first, and then the Parameters field... You can then use the ResultSelector field to manipulate the state\'s output before ResultPath is applied." The full, precise pipeline is: InputPath → Parameters → (task/service runs) → ResultSelector → ResultPath → OutputPath — one more stage than the main page\'s own four-field count accounts for.',
        'AWS\'s own worked example demonstrates exactly the SDK-integration metadata problem the main page\'s own codeTabs never address: an EMR createCluster.sync result returns wrapped in SdkHttpMetadata, SdkResponseMetadata, and other noise alongside the one field actually needed (ClusterId). ResultSelector picks out just {"ClusterId.$": "$.output.ClusterId", "ResourceType.$": "$.resourceType"}, and ResultPath then merges only that clean, minimal object into the original input — never the whole noisy SDK response.',
        'ResultSelector is documented as available on exactly three state types — Task, Map, and Parallel — and AWS documents a second genuinely useful application directly relevant to the main page\'s own Parallel-state example: flattening a nested array-of-arrays result (the natural shape a Parallel or Map state produces) into a single flat array, using the [*][*] wildcard path syntax.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Reproducing the noisy-metadata problem on the main page\'s own SDK integration',
      language: 'bash',
      code: `# The main page's own SDK-integration example, using ResultPath
# alone (no ResultSelector) to merge the task's raw result:
# "SaveOrder": {
#   "Type": "Task",
#   "Resource": "arn:aws:states:::dynamodb:putItem",
#   "Parameters": {
#     "TableName": "Orders",
#     "Item": { "orderId": {"S.$": "$.orderId"}, "status": {"S": "processing"} }
#   },
#   "ResultPath": "$.dynamoResult",
#   "Next": "SendSQSMessage"
# }

# The actual raw result merged into "$.dynamoResult" includes far
# more than just confirmation the write succeeded -- AWS SDK
# response metadata comes along for the ride:
# {
#   "orderId": "abc123",
#   "dynamoResult": {
#     "SdkHttpMetadata": {
#       "HttpHeaders": { "Content-Length": "2", "Date": "...", "x-amzn-RequestId": "..." },
#       "HttpStatusCode": 200
#     },
#     "SdkResponseMetadata": { "RequestId": "1234-5678-9012" },
#     "ConsumedCapacity": { "TableName": "Orders", "CapacityUnits": 1.0 }
#   }
# }
# -- "SendSQSMessage" now carries a bloated, noisy input forward,
# and any later state doing "$" matching against the whole previous
# output has to account for fields it never actually asked for.`,
    },
    {
      label: 'The fix — ResultSelector, matching AWS\'s own EMR example pattern',
      language: 'bash',
      code: `# Add ResultSelector to keep only what's actually needed, applied
# BEFORE ResultPath merges it in -- matching AWS's own documented
# EMR createCluster.sync pattern, adapted to the main page's own
# DynamoDB example:
# "SaveOrder": {
#   "Type": "Task",
#   "Resource": "arn:aws:states:::dynamodb:putItem",
#   "Parameters": {
#     "TableName": "Orders",
#     "Item": { "orderId": {"S.$": "$.orderId"}, "status": {"S": "processing"} }
#   },
#   "ResultSelector": {
#     "httpStatusCode.$": "$.SdkHttpMetadata.HttpStatusCode"
#   },
#   "ResultPath": "$.dynamoResult",
#   "Next": "SendSQSMessage"
# }
# -- "SendSQSMessage" now receives:
# { "orderId": "abc123", "dynamoResult": { "httpStatusCode": 200 } }
# -- clean, minimal, exactly what was actually needed.

# A SECOND real use for ResultSelector, directly relevant to the
# main page's own "RunChecks" Parallel state (three branches:
# CreditCheck, FraudCheck, InventoryCheck) -- flattening a nested
# array-of-arrays result, per AWS's own documented wildcard syntax:
# "RunChecks": {
#   "Type": "Parallel",
#   "Branches": [ /* ... three branches, each ending with an array result ... */ ],
#   "ResultSelector": {
#     "flattenArray.$": "$[*][*]"
#   },
#   "Next": "ProcessResults"
# }
# -- turns [[a,b],[c],[d,e]] into a single flat [a,b,c,d,e], ready
# for a downstream Map state to iterate directly, no manual
# flattening Lambda required.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'Following the main page\'s own SDK-integration pattern, a team writes order data directly to DynamoDB via arn:aws:states:::dynamodb:putItem as a Task state, merging the raw task result into the execution\'s data using ResultPath alone. Weeks later, a downstream Choice state that inspects a specific field under the merged result starts behaving unpredictably in a small number of executions. Investigation shows the merged result includes several AWS SDK response metadata fields the team never intended to carry forward, and one of their own field names happens to collide in shape with a nested metadata field. Using this subtopic\'s theory, diagnose the cause and describe the fix.',
    hint: 'The main page\'s own QnA says there are four data-flow fields for shaping what moves between states. Is there a field specifically designed to trim a task\'s raw result down to only what\'s needed, before it gets merged into the execution\'s data?',
    solution: 'Per this subtopic\'s theory, this is exactly the gap ResultSelector exists to close, which the main page\'s own "four JSON Path operators" count omits. Because the team used ResultPath alone with no ResultSelector, the ENTIRE raw DynamoDB SDK response — including SdkHttpMetadata, SdkResponseMetadata, ConsumedCapacity, and other fields never asked for — was merged wholesale into the execution\'s data at the ResultPath location. A downstream Choice state doing path-based matching against that merged structure can pick up an unintended nested field if its own shape happens to collide with one of the SDK\'s own metadata field names, exactly as AWS\'s own documentation implies by showing ResultSelector\'s purpose as filtering "before ResultPath is applied." The fix is adding a ResultSelector to the SaveOrder task that explicitly selects only the specific fields actually needed (matching AWS\'s own EMR createCluster.sync example pattern of selecting just ClusterId and resourceType from a similarly noisy raw result) — after which ResultPath merges only that clean, minimal, deliberately-chosen object into the execution\'s data, eliminating both the noise and the accidental field-shape collision entirely.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'Step Functions only provides four fields for shaping data as it flows through a workflow — InputPath, Parameters, ResultPath, and OutputPath — matching the main page\'s own QnA count exactly.',
      reality: 'Per this subtopic\'s theory, AWS\'s own documentation describes a real fifth field, ResultSelector, which sits specifically between a state\'s raw result and ResultPath in the actual data-flow pipeline.'
    },
    {
      thought: 'ResultPath and ResultSelector do the same job with different names, so only one of them is ever actually needed on a given state.',
      reality: 'Per this subtopic\'s theory, they serve different, complementary roles — ResultSelector filters/reshapes the raw result FIRST, and ResultPath then decides WHERE that (already-filtered) result gets merged into the execution\'s data; using ResultPath alone merges the entire unfiltered raw result.'
    },
    {
      thought: 'A service integration\'s raw result (like an SDK-integration Task\'s response) always contains just the clean, useful data a downstream state needs, with nothing extra to filter out.',
      reality: 'Per this subtopic\'s exercise and AWS\'s own EMR worked example, SDK-integration results routinely include additional metadata (HTTP headers, request IDs, response wrappers) that a team did not ask for and may not want carried forward into the execution\'s own data.'
    }
  ];
}
