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
  templateUrl: './sns-filterpolicyscope-messagebody-skips-duplicate-attrs.html',
  styleUrl: './sns-filterpolicyscope-messagebody-skips-duplicate-attrs.scss'
})
export class SnsFilterpolicyscopeMessagebodySkipsDuplicateAttrsSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page\'s own filter-policy example always duplicates data into a separate message attribute',
      points: [
        'The main page\'s own "SNS Fan-out" code tab publishes with --message-attributes \'status={DataType=String,StringValue=placed}\' in ADDITION to the message body itself (--message \'{"orderId":"xyz","amount":150}\') — the status value has to be duplicated into a separate attribute purely to make it filterable.',
        'The main page\'s own theory bullet states: "Message filtering: add a filter policy to a subscription so it only receives messages with matching attributes" — worded as if filter policies can only ever act on attributes, never the message body a publisher already sends.',
      ]
    },
    {
      heading: 'AWS supports filtering directly on the JSON message body — removing the need to duplicate fields into attributes, with a real propagation delay to plan around',
      points: [
        'Per AWS\'s own documentation: "Amazon SNS supports policies that act on the message attributes or on the message body, according to the filter policy scope that you set for the subscription. Filter policies for the message body assume that the message payload is a well-formed JSON object." The exact matching rule for the body scope: "When the filter policy scope is set to MessageBody, each property name in the filter policy matches a message body property name. For each matching property name in the filter policy, at least one property value matches the message body property value."',
        'Applied to the main page\'s own order-events example: a filter policy of {"status":["placed","confirmed"]} with FilterPolicyScope set to MessageBody would match directly against a "status" field already present in the published JSON body — with NO separate --message-attributes needed for filtering purposes at all. This removes an entire class of publisher-side duplication, and the risk of a duplicated attribute value silently drifting out of sync with the real body content over time.',
        'A genuinely important operational detail AWS documents that applies to EITHER filter scope, and that the main page\'s own filter examples never mention at all: "Additions or changes to a subscription filter policy require up to 15 minutes to fully take effect." A team testing a brand-new or just-edited filter policy immediately after applying it may see messages that SHOULD now be excluded still arrive for a period — this is documented eventual-consistency behavior, not a broken filter policy.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Filtering on message body — no duplicated attributes needed',
      language: 'bash',
      code: `# Set the subscription's filter policy scope to MessageBody, matching
# the main page's own fulfillment-queue filtering use case:
aws sns set-subscription-attributes \\
  --subscription-arn arn:aws:sns:us-east-1:123:order-events:fulfillment-sub \\
  --attribute-name FilterPolicyScope \\
  --attribute-value MessageBody

aws sns set-subscription-attributes \\
  --subscription-arn arn:aws:sns:us-east-1:123:order-events:fulfillment-sub \\
  --attribute-name FilterPolicy \\
  --attribute-value '{"status":["placed","confirmed"]}'

# Publish WITHOUT any --message-attributes at all -- the filter now
# matches directly against the "status" field already present in
# the JSON body:
aws sns publish \\
  --topic-arn arn:aws:sns:us-east-1:123:order-events \\
  --message '{"orderId":"xyz","amount":150,"status":"placed"}'
# -- delivered to fulfillment-sub: "status":"placed" matches the
# body-scoped filter policy directly. Per AWS's own docs, "Filter
# policies for the message body assume that the message payload is
# a well-formed JSON object" -- this only works because the message
# itself IS valid JSON.

aws sns publish \\
  --topic-arn arn:aws:sns:us-east-1:123:order-events \\
  --message '{"orderId":"abc","amount":30,"status":"cancelled"}'
# -- correctly excluded from fulfillment-sub -- "cancelled" is not
# in the filter policy's allowed values -- with zero
# --message-attributes involved anywhere in this publish call.`,
    },
    {
      label: 'The documented propagation delay — not a broken filter',
      language: 'bash',
      code: `# Apply a brand-new (or edited) filter policy:
aws sns set-subscription-attributes \\
  --subscription-arn arn:aws:sns:us-east-1:123:order-events:fulfillment-sub \\
  --attribute-name FilterPolicy \\
  --attribute-value '{"status":["confirmed"]}'
# -- narrower than before: "placed" orders should now be excluded.

# Publish a "placed" order IMMEDIATELY afterward, expecting it to be
# excluded per the just-applied policy:
aws sns publish \\
  --topic-arn arn:aws:sns:us-east-1:123:order-events \\
  --message '{"orderId":"new1","amount":75,"status":"placed"}'

# It may still arrive at fulfillment-sub -- per AWS's own docs:
# "AWS services such as IAM and Amazon SNS use a distributed
# computing model called eventual consistency. Additions or changes
# to a subscription filter policy require up to 15 minutes to fully
# take effect." This is NOT evidence the filter policy update
# failed or was malformed -- it is documented, expected behavior.

# The correct operational response during initial testing/rollout:
# wait for the documented propagation window before concluding a
# filter policy change didn't take effect, rather than immediately
# debugging the policy JSON itself.
sleep 900
aws sns publish \\
  --topic-arn arn:aws:sns:us-east-1:123:order-events \\
  --message '{"orderId":"new2","amount":75,"status":"placed"}'
# -- now correctly excluded, once the 15-minute window has passed.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'Following the main page\'s own SNS fan-out pattern, a team migrates their fulfillment-queue filtering from MessageAttributes scope to MessageBody scope specifically to stop duplicating the "status" field into a separate message attribute on every publish call. Immediately after applying the new FilterPolicyScope and FilterPolicy, they run a test publish with "status":"cancelled" in the body, expecting it to be correctly excluded from the fulfillment subscription. It arrives anyway. The team starts debugging their filter policy JSON, suspecting a syntax error. Using this subtopic\'s theory, is that the right place to look first?',
    hint: 'How much time elapsed between applying the new filter policy and testing it? What does AWS\'s own documentation say about how quickly a filter policy change takes effect?',
    solution: 'Per this subtopic\'s theory, debugging the filter policy JSON is very likely the wrong first step — the more probable cause is the documented propagation delay: "Additions or changes to a subscription filter policy require up to 15 minutes to fully take effect." Testing a filter policy change immediately after applying it, before that window has elapsed, can legitimately show the OLD (or no) filtering behavior even though the new policy was accepted correctly and contains no syntax error at all. This is explicitly an eventual-consistency property AWS documents for SNS subscription filter policy changes, not a symptom of a malformed policy. The correct response is to wait for the documented propagation window (or retry the same test after roughly 15 minutes) before concluding anything about the policy\'s own correctness — debugging the JSON itself should only start if the exclusion is STILL not working after that window has genuinely passed.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'SNS subscription filter policies can only ever match against message attributes — filtering directly on the actual JSON message body content isn\'t possible.',
      reality: 'Per this subtopic\'s theory, AWS\'s own documentation states filter policies can act on either "the message attributes or... the message body, according to the filter policy scope that you set for the subscription" — MessageBody is a fully supported scope, not just MessageAttributes.'
    },
    {
      thought: 'A filter policy change (a brand-new policy, or an edit to an existing one) takes effect immediately on the very next publish call after being applied.',
      reality: 'Per this subtopic\'s theory, AWS explicitly documents an eventual-consistency delay — "Additions or changes to a subscription filter policy require up to 15 minutes to fully take effect" — testing immediately after a change can show stale behavior that has nothing to do with the policy\'s own correctness.'
    },
    {
      thought: 'Switching a subscription\'s FilterPolicyScope from MessageAttributes to MessageBody still requires including the old message-attributes in every future publish call, for backward compatibility.',
      reality: 'Per this subtopic\'s theory, once a subscription\'s FilterPolicyScope is set to MessageBody, the filter matches directly against the published JSON body\'s own fields — there is no continuing need to also populate message attributes purely for that subscription\'s filtering purposes.'
    }
  ];
}
