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
  templateUrl: './heartbeatseconds-is-a-separate-repeating-deadline.html',
  styleUrl: './heartbeatseconds-is-a-separate-repeating-deadline.scss'
})
export class HeartbeatsecondsIsASeparateRepeatingDeadlineSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page\'s own waitForTaskToken example sets HeartbeatSeconds without ever explaining what it does',
      points: [
        'The main page\'s own codeTabs show: "AwaitApproval": {... "HeartbeatSeconds": 86400, "Next": "ProcessApproved"} — as part of a human-approval waitForTaskToken pattern, with zero explanation of what this field actually controls.',
        'The main page\'s own QnA on debugging mentions, only in passing, "Lambda timeout shorter than state HeartbeatSeconds" as a common cause of failures — acknowledging HeartbeatSeconds and TimeoutSeconds are related-but-different things, without ever precisely defining either or how they interact.',
      ]
    },
    {
      heading: 'HeartbeatSeconds is a separate, recurring "still alive" deadline — not an overall duration cap',
      points: [
        'Per AWS\'s own documentation: "HeartbeatSeconds — Determines the frequency of heartbeat signals an activity worker sends during the execution of a task. Heartbeats indicate that a task is still running and it needs more time to complete. Heartbeats prevent an activity or task from timing out within the TimeoutSeconds duration." TimeoutSeconds is the overall ceiling on total task duration; HeartbeatSeconds is a separate, recurring deadline that resets every time a heartbeat is received.',
        'AWS states the exact failure mode directly: "HeartbeatSeconds must be a positive, non-zero integer value less than the TimeoutSeconds field value. The default value is 99,999,999. If more time than the specified seconds elapses between heartbeats from the task, the Task state fails with a States.Timeout error." The SAME error name — States.Timeout — is raised whether the OVERALL TimeoutSeconds elapses or a single HEARTBEAT interval is missed, meaning a Catch matching States.Timeout can\'t distinguish "the whole task ran too long" from "one heartbeat arrived late," without inspecting the Cause detail.',
        'The detail that directly extends the main page\'s own human-approval example: TimeoutSeconds itself also defaults to 99,999,999 seconds (roughly 3.17 years) when not explicitly set — meaning a state configured with only HeartbeatSeconds: 86400 (24 hours) and no explicit TimeoutSeconds effectively has NO separate overall duration cap in practice; the 24-hour heartbeat interval becomes the ONLY real deadline actually governing that task. If the external process is expected to call SendTaskHeartbeat periodically during a genuinely long-running review but never actually implements that call, the task fails with States.Timeout at the very first 24-hour mark — regardless of how long the team intended to allow for approval overall, and regardless of whether the reviewer is still actively, legitimately working on it.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Reproducing the surprise failure — heartbeat never sent',
      language: 'bash',
      code: `# The main page's own AwaitApproval task, unchanged -- note there
# is no TimeoutSeconds set alongside HeartbeatSeconds:
# "AwaitApproval": {
#   "Type": "Task",
#   "Resource": "arn:aws:states:::lambda:invoke.waitForTaskToken",
#   "Parameters": {
#     "FunctionName": "send-approval-email",
#     "Payload": {"taskToken.$": "$$.Task.Token", "orderId.$": "$.orderId"}
#   },
#   "HeartbeatSeconds": 86400,
#   "Next": "ProcessApproved"
# }

aws stepfunctions start-execution \\
  --state-machine-arn arn:aws:states:us-east-1:123:stateMachine:order-approval \\
  --input '{"orderId":"abc123"}'

# A reviewer genuinely opens the request and starts reading attached
# documents -- actively working, with every intention of approving
# it -- but the approval Lambda / UI never calls SendTaskHeartbeat
# at any point during the review.

# 24 hours later, with the reviewer still mid-review:
aws stepfunctions describe-execution \\
  --execution-arn arn:aws:states:us-east-1:123:execution:order-approval:exec-id \\
  --query '{Status:status,Error:error}'
# {
#   "Status": "FAILED",
#   "Error": "States.Timeout"
# }
# -- per AWS's own docs, this is the HEARTBEAT interval elapsing,
# NOT an overall duration cap -- TimeoutSeconds was never explicitly
# set, so it silently defaulted to 99,999,999 seconds (~3.17 years)
# -- the 24-hour heartbeat was the ONLY real deadline in play.`,
    },
    {
      label: 'Two correct fixes — send heartbeats, or drop the field entirely',
      language: 'bash',
      code: `# Fix 1: if the review process genuinely needs to run for days and
# you want Step Functions to know it's still alive, have the
# external process call SendTaskHeartbeat periodically (well inside
# the 24-hour window) while work is ongoing:
aws stepfunctions send-task-heartbeat \\
  --task-token "TOKEN_FROM_EMAIL_LINK"
# -- resets the 24-hour HeartbeatSeconds clock; the task stays alive
# as long as heartbeats keep arriving before each interval elapses.

# Fix 2 (the common case for a simple human-approval flow that
# doesn't actually need heartbeat semantics at all): drop
# HeartbeatSeconds entirely and rely only on a deliberately-chosen
# TimeoutSeconds for the true outer deadline -- e.g. "give reviewers
# up to 7 days, no heartbeat required":
# "AwaitApproval": {
#   "Type": "Task",
#   "Resource": "arn:aws:states:::lambda:invoke.waitForTaskToken",
#   "Parameters": {
#     "FunctionName": "send-approval-email",
#     "Payload": {"taskToken.$": "$$.Task.Token", "orderId.$": "$.orderId"}
#   },
#   "TimeoutSeconds": 604800,
#   "Next": "ProcessApproved"
# }
# -- no heartbeat mechanism required; the task simply waits up to 7
# days for SendTaskSuccess/SendTaskFailure, with no intermediate
# "still alive" signal needed from the reviewer at all.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'Following the main page\'s own human-approval pattern exactly, a team sets HeartbeatSeconds: 86400 on their AwaitApproval task, reasoning "this gives reviewers up to a day to approve." A request that is genuinely still being actively reviewed (a manager reading through supporting documents, with every intention of approving) fails automatically with States.Timeout after 24 hours, even though no one ever called SendTaskFailure and the review was legitimately still in progress. Using this subtopic\'s theory, explain the team\'s misunderstanding and describe both ways to fix it.',
    hint: 'Per AWS\'s own documentation, does HeartbeatSeconds function as an overall "you have this long total" deadline, or as a repeating "prove you\'re still alive" interval that resets on each signal?',
    solution: 'Per this subtopic\'s theory, the team misread HeartbeatSeconds as an overall duration cap when it is actually a recurring, resettable "still alive" interval. AWS\'s own documentation states directly: "If more time than the specified seconds elapses between heartbeats from the task, the Task state fails with a States.Timeout error" — the field measures the gap BETWEEN heartbeat signals, not the total elapsed time since the task began. Because the team never configured the external approval process to call SendTaskHeartbeat at all, and never set an explicit TimeoutSeconds either (which silently defaulted to 99,999,999 seconds, effectively no real cap), the 24-hour heartbeat interval became the ONLY deadline actually governing the task — and it failed at the very first 24-hour mark, independent of whether the review itself was still genuinely, actively in progress. There are two correct fixes, per this subtopic\'s theory: either have the external process call SendTaskHeartbeat periodically during a review that could genuinely take multiple days (resetting the clock each time and proving the work is still alive), or — the simpler and more common fix for an ordinary human-approval flow that doesn\'t need heartbeat semantics at all — drop HeartbeatSeconds entirely and set an explicit TimeoutSeconds matching the real intended deadline (e.g. 7 days), letting the task simply wait for SendTaskSuccess/SendTaskFailure with no intermediate "still alive" signal required.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'HeartbeatSeconds sets the overall maximum time a waitForTaskToken task is allowed to remain paused before automatically failing.',
      reality: 'Per this subtopic\'s theory, AWS\'s own documentation defines it as a recurring interval measured BETWEEN heartbeat signals, not a single overall duration — TimeoutSeconds is the separate field that governs the true overall cap.'
    },
    {
      thought: 'Setting only HeartbeatSeconds (with no explicit TimeoutSeconds) still leaves the task with a similarly-scoped, reasonable overall timeout by default.',
      reality: 'Per this subtopic\'s theory, AWS\'s own documentation states TimeoutSeconds defaults to 99,999,999 seconds (about 3.17 years) when unset — effectively no meaningful overall cap at all — leaving the HeartbeatSeconds interval as the only deadline that actually matters in practice.'
    },
    {
      thought: 'A States.Timeout error appearing in a Catch block always means the same specific thing — that the task\'s overall duration limit was exceeded.',
      reality: 'Per this subtopic\'s theory, AWS\'s own documentation confirms the identical States.Timeout error name is raised for BOTH an overall TimeoutSeconds expiry AND a missed HeartbeatSeconds interval — distinguishing the two requires inspecting the error\'s own Cause detail, not just its Error name.'
    }
  ];
}
