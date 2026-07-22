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
  templateUrl: './treat-missing-data-decides-insufficient-data-behavior.html',
  styleUrl: './treat-missing-data-decides-insufficient-data-behavior.scss'
})
export class TreatMissingDataDecidesInsufficientDataBehaviorSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page\'s own composite alarm QnA identifies a real risk — but never mentions the setting that controls it',
      points: [
        'The main page\'s own QnA states: "a child alarm stuck in INSUFFICIENT_DATA (not ALARM) means that condition of the AND expression can never be satisfied... silently disabling the entire alerting chain without any explicit error... worth periodically auditing composite alarms\' child alarm health." This treats INSUFFICIENT_DATA as an inherent risk to watch for, never as a CONFIGURABLE behavior with an actual fix.',
        'The main page\'s own quickRef defines alarm states as simply "OK / ALARM / INSUFFICIENT_DATA" — as if INSUFFICIENT_DATA were just one of three neutral possible outcomes, rather than a specific, avoidable DEFAULT behavior for how an alarm reacts to missing data.',
      ]
    },
    {
      heading: 'AWS\'s own treatMissingData setting decides whether missing data becomes INSUFFICIENT_DATA at all — the default keeps the QnA\'s exact risk alive',
      points: [
        'Per AWS\'s own documentation, an alarm can treat missing data points as one of four ways: "notBreaching – Missing data points are treated as \'good\' and within the threshold," "breaching – Missing data points are treated as \'bad\' and breaching the threshold," "ignore – The current alarm state is maintained," and "missing – If all data points in the alarm evaluation range are missing, the alarm transitions to INSUFFICIENT_DATA." AWS states directly: "The default behavior is missing."',
        'AWS gives a concrete example matching the main page\'s own DynamoDB-adjacent content: "for a metric that generates data points only when an error occurs, such as ThrottledRequests in Amazon DynamoDB, you would want to treat missing data as notBreaching" — the absence of data is EXPECTED and healthy for that kind of metric, not a sign of trouble.',
        'This directly resolves the main page\'s own QnA scenario: if the child alarm\'s own treatMissingData is set to notBreaching (metric legitimately goes quiet sometimes) or breaching (metric absence itself indicates a real problem), that child alarm never lands in INSUFFICIENT_DATA when its metric stops flowing — it resolves cleanly to OK or ALARM instead, so a composite alarm\'s AND expression referencing it can never get silently, permanently stuck.',
        'A further documented wrinkle worth knowing: "Alarms that evaluate metrics in the AWS/DynamoDB namespace default to ignore missing data. You can override this if you choose a different option... When an AWS/DynamoDB metric has missing data, alarms that evaluate that metric remain in their current state." — a per-namespace default override that differs from the general missing default, specific to the exact DynamoDB example AWS uses to illustrate the setting.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Reproducing the main page\'s own QnA scenario with the default setting',
      language: 'bash',
      code: `# A child alarm feeding a composite AND alarm, matching the main
# page's own composite-alarm framing -- created WITHOUT an explicit
# treat-missing-data flag, so it uses AWS's own documented default:
aws cloudwatch put-metric-alarm \\
  --alarm-name payments-error-rate \\
  --metric-name Errors --namespace AWS/Lambda \\
  --dimensions Name=FunctionName,Value=payments-processor \\
  --period 60 --evaluation-periods 3 --datapoints-to-alarm 2 \\
  --threshold 5 --comparison-operator GreaterThanOrEqualToThreshold \\
  --statistic Sum
# (no --treat-missing-data -- defaults to "missing")

aws cloudwatch put-composite-alarm \\
  --alarm-name payments-health \\
  --alarm-rule "ALARM(payments-error-rate) AND ALARM(payments-latency-high)" \\
  --alarm-actions arn:aws:sns:us-east-1:123:ops-critical

# The underlying metric for payments-error-rate stops being
# published entirely (e.g. the function is deprecated, or a
# dimension value changes and old data silently stops flowing):
aws cloudwatch describe-alarms --alarm-names payments-error-rate \\
  --query 'MetricAlarms[0].StateValue'
# "INSUFFICIENT_DATA" -- per AWS's own docs, this is exactly what
# the "missing" default produces once all data points in the
# evaluation range are gone.

aws cloudwatch describe-alarms --alarm-names payments-health \\
  --query 'CompositeAlarms[0].StateValue'
# The composite alarm's AND expression can NEVER be true again --
# payments-error-rate can be ALARM, OK, or INSUFFICIENT_DATA, but
# never satisfies "ALARM(payments-error-rate)" while stuck in
# INSUFFICIENT_DATA -- exactly the silent failure the main page's
# own QnA describes, with no error surfaced anywhere.`,
    },
    {
      label: 'The fix — an explicit treat-missing-data setting resolves it cleanly',
      language: 'bash',
      code: `# Update the child alarm with an explicit treat-missing-data value
# matching the metric's own real-world behavior. Errors is a metric
# that should ideally always be near zero but not necessarily always
# REPORTING -- treat a gap as "notBreaching" rather than an
# unresolvable unknown:
aws cloudwatch put-metric-alarm \\
  --alarm-name payments-error-rate \\
  --metric-name Errors --namespace AWS/Lambda \\
  --dimensions Name=FunctionName,Value=payments-processor \\
  --period 60 --evaluation-periods 3 --datapoints-to-alarm 2 \\
  --threshold 5 --comparison-operator GreaterThanOrEqualToThreshold \\
  --statistic Sum \\
  --treat-missing-data notBreaching

# Now when the metric stops flowing entirely:
aws cloudwatch describe-alarms --alarm-names payments-error-rate \\
  --query 'MetricAlarms[0].StateValue'
# "OK" -- never INSUFFICIENT_DATA -- per AWS's own docs: "Missing
# data points are treated as 'good' and within the threshold."

# The composite alarm's AND expression can now be evaluated
# meaningfully again -- payments-health correctly reflects
# payments-latency-high alone, instead of being permanently stuck
# because of a metric that stopped reporting.

# For a DIFFERENT metric where absence itself IS the problem (e.g.
# a heartbeat metric a healthy service must always emit):
aws cloudwatch put-metric-alarm \\
  --alarm-name service-heartbeat-missing \\
  --metric-name HeartbeatCount --namespace MyApp \\
  --period 60 --evaluation-periods 3 --datapoints-to-alarm 2 \\
  --threshold 1 --comparison-operator LessThanThreshold \\
  --statistic Sum \\
  --treat-missing-data breaching
# -- silence itself now correctly triggers ALARM, per AWS's own
# guidance for "a metric that continually reports data."`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'Following the main page\'s own composite alarm pattern, a team builds "payments-health" as an AND of three child alarms covering error rate, latency, and throttling. Weeks later, an incident review reveals payments-health never fired during a genuine payments outage, even though two of the three child alarms correctly went to ALARM. Investigation shows the third child alarm (throttling) had been stuck in INSUFFICIENT_DATA for months, after the metric it watched was accidentally renamed during a refactor. Using this subtopic\'s theory, explain both why this happened by default and what setting would have prevented it.',
    hint: 'What does AWS\'s own documentation say the DEFAULT treat-missing-data behavior is, and what state does an alarm land in in that case once its metric truly stops reporting?',
    solution: 'Per this subtopic\'s theory, this is exactly the default behavior AWS documents: "The default behavior is missing," and per that default, "If all data points in the alarm evaluation range are missing, the alarm transitions to INSUFFICIENT_DATA." Once the throttling metric was renamed, the old metric name stopped receiving any data points at all, and the child alarm watching it settled into INSUFFICIENT_DATA and stayed there indefinitely — silently, with no error anywhere, exactly as the main page\'s own QnA describes. Because the composite alarm used AND logic, and INSUFFICIENT_DATA is neither ALARM nor OK, the "ALARM(throttling-child)" term of the expression could never become true again, so payments-health could never fire, regardless of how badly the other two conditions degraded during the real outage. The preventive fix, per this subtopic\'s theory, is setting an explicit treat-missing-data value on every child alarm feeding a composite AND expression — notBreaching if the metric can legitimately go quiet, or breaching if its absence should itself be treated as a problem — so that a broken or renamed metric resolves the child alarm to OK or ALARM instead of leaving it stuck in INSUFFICIENT_DATA. This doesn\'t replace periodically auditing child alarm health (the main page\'s own QnA still-valid recommendation) but removes the single most common way a composite alarm goes silently and permanently dark.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'INSUFFICIENT_DATA is an unavoidable state any alarm can fall into once its metric stops reporting — there\'s nothing to configure to prevent it.',
      reality: 'Per this subtopic\'s theory, AWS\'s own treat-missing-data setting directly controls this — notBreaching or breaching resolve a metric gap to OK or ALARM instead, and only the default "missing" value produces INSUFFICIENT_DATA.'
    },
    {
      thought: 'The treat-missing-data setting only affects HOW LONG it takes an alarm to notice its metric has gone quiet, not what final state the alarm can settle into.',
      reality: 'Per this subtopic\'s theory, the setting determines the actual RESULT state once data is missing — notBreaching always resolves to OK, breaching always resolves to ALARM, ignore holds the previous state, and only missing can produce INSUFFICIENT_DATA.'
    },
    {
      thought: 'Every AWS service\'s metrics treat missing data identically by default, following whatever the alarm\'s own treat-missing-data setting says.',
      reality: 'Per this subtopic\'s theory, AWS documents a specific per-namespace exception: alarms on AWS/DynamoDB metrics default to ignoring missing data regardless of the alarm\'s own configured setting, unless explicitly overridden.'
    }
  ];
}
