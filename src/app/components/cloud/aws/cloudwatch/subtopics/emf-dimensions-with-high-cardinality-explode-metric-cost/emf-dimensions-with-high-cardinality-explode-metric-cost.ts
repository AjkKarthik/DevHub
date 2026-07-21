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
  templateUrl: './emf-dimensions-with-high-cardinality-explode-metric-cost.html',
  styleUrl: './emf-dimensions-with-high-cardinality-explode-metric-cost.scss'
})
export class EmfDimensionsWithHighCardinalityExplodeMetricCostSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page\'s own EMF examples always use safe dimensions — but never explain why, or what happens if you pick a bad one',
      points: [
        'The main page\'s own EMF code tabs and challenge solution consistently use the same low-cardinality Dimensions: [["FunctionName","Environment"]] — a bounded, small set of possible values. OrderValue and ProcessingTime are published as METRICS, never as Dimensions.',
        'Nowhere does the main page explain WHY the dimension choice matters, or what would happen if a developer — reasonably wanting to break results down "per order" or "per request" — added orderId or requestId to the Dimensions array instead.',
      ]
    },
    {
      heading: 'AWS\'s own explicit warning: EMF creates a brand-new, separately-billed custom metric per unique dimension VALUE combination',
      points: [
        'Per AWS\'s own EMF specification: "Be careful when configuring your metric extraction as it impacts your custom metric usage and corresponding bill. If you unintentionally create metrics based on high-cardinality dimensions (such as requestId), the embedded metric format will by design create a custom metric corresponding to each unique dimension combination."',
        'The mechanism behind this is stated directly in the same spec: "Every DimensionSet used creates a new metric in CloudWatch." A DimensionSet is capped at 30 dimension KEYS per set, but nothing caps the number of unique VALUE combinations those keys can take on — each new combination is a brand-new custom metric, billed separately, forever (until deleted).',
        'Applied to the main page\'s own checkout Lambda example: if orderId were added to OrderValue\'s Dimensions, EVERY SINGLE ORDER would create its own permanent, separately-billed CloudWatch custom metric — at real order volume, that\'s potentially thousands of new custom metrics per day, almost none of which would ever be queried again after being created.',
        'This is exactly why the main page\'s own examples only ever use FunctionName and Environment: both have a small, BOUNDED set of possible values (a handful of function names, a handful of environments) — the number of resulting custom metrics stays small and predictable no matter how much traffic the function handles, unlike a per-request identifier.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Reproducing the cost explosion — adding orderId "to enable drill-down"',
      language: 'bash',
      code: `# A reasonable-looking change to the main page's own EMF handler --
# add orderId to Dimensions to let ops "see the value of a specific
# order" in the CloudWatch console:
# console.log(JSON.stringify({
#   _aws: {
#     Timestamp: Date.now(),
#     CloudWatchMetrics: [{
#       Namespace: 'MyApp/Orders',
#       Dimensions: [['FunctionName', 'Environment', 'orderId']],  // <- added
#       Metrics: [{ Name: 'OrderValue', Unit: 'None' }]
#     }]
#   },
#   FunctionName: 'checkout', Environment: 'prod',
#   orderId: 'order-a1b2c3', OrderValue: 99.99
# }));

# After a day of normal order traffic (say, 4,000 orders):
aws cloudwatch list-metrics --namespace MyApp/Orders --metric-name OrderValue \\
  --query 'length(Metrics)'
# 4000 -- per AWS's own docs, "the embedded metric format will by
# design create a custom metric corresponding to each unique
# dimension combination" -- one distinct OrderValue metric PER
# ORDER, not one OrderValue metric with 4000 data points.

aws cloudwatch list-metrics --namespace MyApp/Orders --metric-name OrderValue \\
  --dimensions Name=orderId,Value=order-a1b2c3
# { "Metrics": [{ "Dimensions": [
#     {"Name":"Environment","Value":"prod"},
#     {"Name":"FunctionName","Value":"checkout"},
#     {"Name":"orderId","Value":"order-a1b2c3"}
#   ], "MetricName":"OrderValue", "Namespace":"MyApp/Orders" }] }
# -- a real, distinct, billed custom metric that will likely never
# be queried again after this one order is old news.`,
    },
    {
      label: 'The fix — keep high-cardinality fields OUT of Dimensions, use Log Insights instead',
      language: 'bash',
      code: `# Revert to the main page's own original, safe pattern -- bounded
# dimensions only:
# console.log(JSON.stringify({
#   _aws: {
#     Timestamp: Date.now(),
#     CloudWatchMetrics: [{
#       Namespace: 'MyApp/Orders',
#       Dimensions: [['FunctionName', 'Environment']],  // bounded set
#       Metrics: [{ Name: 'OrderValue', Unit: 'None' }]
#     }]
#   },
#   FunctionName: 'checkout', Environment: 'prod',
#   orderId: 'order-a1b2c3',   // still present as a PLAIN field --
#                               // just not in the Dimensions array
#   OrderValue: 99.99
# }));
# -- orderId is still written to the log event and fully searchable,
# it's just no longer creating its own custom metric.

aws cloudwatch list-metrics --namespace MyApp/Orders --metric-name OrderValue \\
  --query 'length(Metrics)'
# a small, bounded number -- one metric per FunctionName+Environment
# combination, regardless of order volume.

# For genuinely needing "the value of THIS specific order" -- use
# Log Insights against the raw log content instead of CloudWatch
# Metrics, matching the main page's own Log Insights section:
aws logs start-query \\
  --log-group-name /aws/lambda/checkout \\
  --start-time $(date -d '1 day ago' +%s) --end-time $(date +%s) \\
  --query-string 'fields @timestamp, orderId, OrderValue
| filter orderId = "order-a1b2c3"'
# -- finds the exact order's value from the log content directly,
# with no CloudWatch custom metric ever created for it.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'Following the main page\'s own EMF pattern closely, a team adds a per-order Dimension to their checkout Lambda\'s OrderValue metric, reasoning it will let them "drill down to a specific order\'s value in the CloudWatch console" without needing a separate lookup. A month after shipping to production (handling a few thousand orders per day), the team\'s AWS bill shows a sharp, unexplained jump specifically in the "custom metrics" line item. Using this subtopic\'s theory, explain the cause and the fix, including how the team can still get per-order visibility without it.',
    hint: 'Per AWS\'s own EMF specification, what exactly does adding a field to a DimensionSet create — one metric with many data points, or something else entirely?',
    solution: 'Per this subtopic\'s theory, the cause is exactly the risk AWS\'s own EMF specification warns about directly: "If you unintentionally create metrics based on high-cardinality dimensions (such as requestId), the embedded metric format will by design create a custom metric corresponding to each unique dimension combination." Adding orderId to the Dimensions array did not add a filterable attribute to a single OrderValue metric — per AWS\'s own docs, "Every DimensionSet used creates a new metric in CloudWatch," so every distinct orderId value produced its own brand-new, separately-billed custom metric. At a few thousand orders per day, that\'s a few thousand new permanent custom metrics per day, which directly explains the custom-metrics line item spike. The fix is to remove orderId from the Dimensions array — it can remain as an ordinary top-level field in the same EMF log event (still fully searchable), just no longer contributing to the metric\'s own identity. For the team\'s actual goal — looking up a specific order\'s value — the correct tool, matching the main page\'s own Log Insights section, is a Log Insights query filtering the raw log events by orderId, which finds the exact value directly from log content without ever creating a CloudWatch custom metric for it.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'Adding a field to an EMF DimensionSet just adds a filterable attribute to the same underlying metric, similar to a tag or label.',
      reality: 'Per this subtopic\'s theory, AWS\'s own documentation states the opposite directly: "Every DimensionSet used creates a new metric in CloudWatch" — a new dimension VALUE, not just a new dimension KEY, produces an entirely separate, separately-billed custom metric.'
    },
    {
      thought: 'CloudWatch custom metric billing is based on how many EMF log lines are written (similar to a per-call API charge), not on how many distinct metrics end up existing.',
      reality: 'Per this subtopic\'s theory, custom metric billing is per unique metric (namespace + name + dimension-value combination) that exists in an account, which is exactly why a high-cardinality dimension value is dangerous — the metric COUNT grows with traffic, not just the log volume.'
    },
    {
      thought: 'Since EMF avoids the PutMetricData API call entirely (per the main page\'s own "zero extra API calls" framing), it must also avoid the custom-metric cardinality cost a manually-called PutMetricData with the same dimensions would incur.',
      reality: 'Per this subtopic\'s theory, EMF is subject to the exact same custom-metric cardinality billing as PutMetricData — it only removes the API call and its added latency, never the underlying cost model for how many distinct metrics a given dimension choice creates.'
    }
  ];
}
