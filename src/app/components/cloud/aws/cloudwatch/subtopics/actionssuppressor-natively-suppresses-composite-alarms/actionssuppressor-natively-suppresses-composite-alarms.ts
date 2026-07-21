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
  templateUrl: './actionssuppressor-natively-suppresses-composite-alarms.html',
  styleUrl: './actionssuppressor-natively-suppresses-composite-alarms.scss'
})
export class ActionssuppressorNativelySuppressesCompositeAlarmsSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page\'s own suppression advice reaches for EventBridge + Lambda — without mentioning AWS\'s own native mechanisms',
      points: [
        'The main page\'s own theory bullet states: "Suppress maintenance noise with alarm actions: use EventBridge + Lambda to suppress SNS during known windows." This is presented as THE way to suppress alarm noise during known windows — custom glue code owned and maintained by the team.',
        'The main page\'s own QnA on composite alarms explains AND/OR logic and reducing noise via multiple correlated conditions, but never mentions that composite alarms have their OWN built-in suppression feature, separate from anything the AlarmRule\'s AND/OR logic already does.',
      ]
    },
    {
      heading: 'AWS provides two fully native suppression mechanisms — no custom EventBridge/Lambda glue code required',
      points: [
        'Per AWS\'s own composite alarm API reference, a composite alarm supports an ActionsSuppressor parameter: "Actions will be suppressed if the suppressor alarm is in the ALARM state. ActionsSuppressor can be an AlarmName or an Amazon Resource Name (ARN) from an existing alarm." Two companion timing parameters round it out: ActionsSuppressorWaitPeriod — "The maximum time in seconds that the composite alarm waits for the suppressor alarm to go into the ALARM state. After this time, the composite alarm performs its actions" — and ActionsSuppressorExtensionPeriod — "The maximum time in seconds that the composite alarm waits after suppressor alarm goes out of the ALARM state. After this time, the composite alarm performs its actions."',
        'With ActionsSuppressor configured, the composite alarm still evaluates and transitions state completely normally — it just doesn\'t fire its SNS/Lambda/OpsItem actions while the referenced suppressor alarm is in ALARM state. This is ACTIONS-level suppression: useful when you still want the composite alarm\'s own state visible on a dashboard for audit purposes, but don\'t want to be paged during a known window.',
        'AWS\'s own AlarmRule documentation shows a second, even simpler technique that doesn\'t need ActionsSuppressor at all — a plain NOT term in the rule expression: "ALARM(CPUUtilizationTooHigh) AND NOT ALARM(DeploymentInProgress) specifies that the alarm goes to ALARM state if CPUUtilizationTooHigh is in ALARM state and DeploymentInProgress is not in ALARM state. This example reduces alarm noise during a known deployment window." This is STATE-level suppression: the composite alarm never even transitions to ALARM during the window at all, which is simpler but means the composite alarm\'s own state doesn\'t reflect the underlying condition during that time.',
        'Both techniques only need a simple "suppressor" alarm (or composite alarm) that some other process — a deploy script, an EventBridge scheduled rule, a maintenance runbook — flips to ALARM at the start of a window and back to OK at the end. Neither approach needs a Lambda function that directly manipulates SNS subscriptions or alarm action configuration, which is exactly the kind of glue code the main page\'s own theory bullet implies is necessary.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Technique 1 — AlarmRule NOT (state-level suppression)',
      language: 'bash',
      code: `# A simple alarm, flipped to ALARM by a deploy script or EventBridge
# rule at the START of a deployment, and back to OK when it ends --
# no Lambda required, just a manual/scripted state transition:
aws cloudwatch put-metric-alarm \\
  --alarm-name deployment-in-progress \\
  --metric-name DeploymentFlag --namespace MyApp/Ops \\
  --period 60 --evaluation-periods 1 --datapoints-to-alarm 1 \\
  --threshold 1 --comparison-operator GreaterThanOrEqualToThreshold \\
  --statistic Maximum --treat-missing-data notBreaching

# Deploy script sets this metric to 1 at deploy start, 0 (or stops
# publishing) at deploy end -- matching the main page's own
# PutMetricData pattern:
aws cloudwatch put-metric-data --namespace MyApp/Ops \\
  --metric-name DeploymentFlag --value 1

# Reference it directly in the composite alarm's own AlarmRule --
# matching AWS's own documented example, adapted to the main page's
# own Lambda p99 latency alarm:
aws cloudwatch put-composite-alarm \\
  --alarm-name api-p99-latency-health \\
  --alarm-rule "ALARM(lambda-p99-latency) AND NOT ALARM(deployment-in-progress)" \\
  --alarm-actions arn:aws:sns:us-east-1:123:ops-alerts
# -- during a deployment, lambda-p99-latency going ALARM does NOT
# flip api-p99-latency-health to ALARM at all -- the composite
# alarm's own STATE stays unaffected by the underlying condition
# for the duration of the deployment window.`,
    },
    {
      label: 'Technique 2 — ActionsSuppressor (actions-only suppression)',
      language: 'bash',
      code: `# Same underlying idea, but using ActionsSuppressor instead of a
# NOT term -- the composite alarm STILL transitions to ALARM
# normally (visible on dashboards), it just doesn't fire its
# actions while the suppressor alarm is in ALARM state:
aws cloudwatch put-composite-alarm \\
  --alarm-name api-p99-latency-health \\
  --alarm-rule "ALARM(lambda-p99-latency)" \\
  --actions-suppressor deployment-in-progress \\
  --actions-suppressor-wait-period 60 \\
  --actions-suppressor-extension-period 60 \\
  --alarm-actions arn:aws:sns:us-east-1:123:ops-alerts

# ActionsSuppressorWaitPeriod (60s): if lambda-p99-latency goes
# ALARM right as a deployment starts, the composite alarm waits up
# to 60s for deployment-in-progress to actually reach ALARM before
# giving up and firing its own actions anyway -- avoiding a race at
# the exact start of the window.

# ActionsSuppressorExtensionPeriod (60s): after deployment-in-progress
# leaves ALARM (deploy finished), the composite alarm keeps
# suppressing its own actions for another 60s -- avoiding a race
# where residual post-deploy noise fires immediately as the
# suppression window closes.

# Check the composite alarm's own state during a deployment --
# unlike Technique 1, this DOES reflect ALARM if the underlying
# condition is true, for audit/dashboard purposes:
aws cloudwatch describe-alarms --alarm-names api-p99-latency-health \\
  --query 'CompositeAlarms[0].StateValue'
# "ALARM" -- state is accurate, but no SNS notification fired,
# because deployment-in-progress was in ALARM state at the time.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'Following the main page\'s own suggested approach, a team builds a custom EventBridge rule + Lambda function that unsubscribes their ops SNS topic at the start of every deployment and re-subscribes it at the end. During a post-incident review, they discover the Lambda occasionally fails silently on the re-subscribe step (a transient permissions error, unretried), leaving the team with NO alerts at all for days after some deployments — a worse failure mode than the noise they were originally trying to suppress. Using this subtopic\'s theory, propose a native alternative and explain which of the two documented techniques better fits a team that still wants the underlying alarm\'s real state visible for later audit.',
    hint: 'What does each of AWS\'s two native techniques (AlarmRule NOT vs ActionsSuppressor) actually do to the composite alarm\'s own STATE during the suppression window — and does either one depend on custom code that could fail and get stuck?',
    solution: 'Per this subtopic\'s theory, both of AWS\'s native techniques avoid the exact failure mode the team hit — neither depends on a custom Lambda function correctly completing a two-step subscribe/unsubscribe sequence that can partially fail. ActionsSuppressor is the better fit for a team that wants the underlying alarm\'s real state preserved for audit: per AWS\'s own docs, "Actions will be suppressed if the suppressor alarm is in the ALARM state," but the composite alarm itself STILL transitions to ALARM normally and visibly on dashboards — only the SNS/Lambda notification actions are held back, and only for as long as the suppressor alarm (here, a simple deployment-in-progress alarm flipped by the deploy script itself, not by a Lambda manipulating subscriptions) is genuinely in ALARM state. If that suppressor alarm ever gets stuck (say, the deploy script fails to flip it back), ActionsSuppressorExtensionPeriod caps how long suppression can extend past the suppressor alarm actually leaving ALARM state, and if the suppressor alarm never even reaches ALARM in the first place, ActionsSuppressorWaitPeriod ensures the composite alarm falls back to firing its own actions rather than staying silently suppressed forever. The AlarmRule NOT technique (Technique 1) is simpler but changes the composite alarm\'s own STATE during the window — appropriate if audit visibility during the suppression window doesn\'t matter, but not the better choice here since the team specifically wants accurate state history.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'Suppressing alarm noise during a maintenance or deployment window on AWS always requires custom glue code, like an EventBridge rule triggering a Lambda that toggles SNS subscriptions or alarm actions.',
      reality: 'Per this subtopic\'s theory, AWS provides two fully native mechanisms for exactly this — a NOT term in a composite alarm\'s AlarmRule, and the ActionsSuppressor parameter — neither requiring any custom Lambda function to manipulate subscriptions or actions directly.'
    },
    {
      thought: 'ActionsSuppressor prevents a composite alarm from ever transitioning to ALARM state at all while the suppressor alarm is active.',
      reality: 'Per this subtopic\'s theory, ActionsSuppressor only suppresses the composite alarm\'s ACTIONS (notifications) — the alarm still evaluates and transitions state completely normally, which is exactly what distinguishes it from the AlarmRule NOT technique.'
    },
    {
      thought: 'The AlarmRule NOT(...) technique and the ActionsSuppressor parameter accomplish the exact same outcome, just with different configuration syntax.',
      reality: 'Per this subtopic\'s theory, they differ in a meaningful way: NOT changes the composite alarm\'s own STATE during the window (state-level suppression), while ActionsSuppressor leaves the state accurate and only withholds the notification actions (actions-level suppression) — the right choice depends on whether audit visibility during the window matters.'
    }
  ];
}
