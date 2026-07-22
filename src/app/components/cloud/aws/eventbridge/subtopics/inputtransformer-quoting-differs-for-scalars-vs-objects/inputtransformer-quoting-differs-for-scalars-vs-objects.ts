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
  templateUrl: './inputtransformer-quoting-differs-for-scalars-vs-objects.html',
  styleUrl: './inputtransformer-quoting-differs-for-scalars-vs-objects.scss'
})
export class InputtransformerQuotingDiffersForScalarsVsObjectsSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page\'s only InputTransformer example implies a simple "strings quoted, numbers not" rule',
      points: [
        'The main page\'s own mistake entry and codeTabs show exactly one InputTemplate: "{\\"order_id\\": \\"<orderId>\\", \\"total\\": <amount>}" — orderId (a string) is wrapped in quotes, amount (a number) is not. A reasonable reader could generalize this into "strings need quotes, numbers don\'t" — a rule that is directionally fine for this one example, but not the actual rule AWS documents.',
        'The main page never shows an InputTransformer example involving a compound value — a JSON object or array extracted from the event — which is exactly the case where the real, documented rule matters and a "strings vs numbers" mental model gives the wrong answer.',
      ]
    },
    {
      heading: 'AWS\'s real rule is scalar vs compound, not string vs number — and EventBridge auto-quotes scalars either way',
      points: [
        'AWS\'s own worked example demonstrates that quoting scalar variables is actually optional: a template of {"instance" : <instance>, "state": <state>} — with NEITHER placeholder quoted, and both instance and state being strings — produces the output {"instance" : "i-0123456789", "state": "RUNNING"}, both correctly quoted. AWS states this directly: "Quotes are not required for variables that represent strings. They are permitted, but EventBridge automatically adds quotes to string variable values during transformation, to ensure the transformation output is valid JSON."',
        'The rule that actually matters is about compound values: "EventBridge does not add quotes to variables that represent JSON objects or arrays. Do not add quotes for variables that represent JSON objects or arrays." AWS\'s own documented failure mode for getting this wrong: "If a JSON path references a JSON object or array, but the variable is referenced in a string, EventBridge removes any internal quotes to ensure a valid string" — wrapping an object/array-valued variable in quotes doesn\'t fail loudly, it silently strips that object\'s OWN internal quotes to keep the outer string valid, corrupting its structure.',
        'AWS\'s own documented correct pattern for embedding a full object — using the reserved aws.events.event.json variable (the complete original event payload) — places it unquoted, directly as a JSON value: {"originalEvent" : <aws.events.event.json>} — producing a properly nested JSON object in the output, exactly as AWS states: "if you want to output a JSON object based on a single JSON path variable, you must place it as a key."',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Reproducing the corruption — quoting a compound variable',
      language: 'bash',
      code: `# Extending the main page's own InputTransformer pattern to ALSO
# forward the complete original event for a downstream service that
# needs both the quick summary AND the raw event -- quoting
# aws.events.event.json the same way orderId was quoted:
aws events put-targets \\
  --rule high-value-orders --event-bus-name my-app-events \\
  --targets '[{
    "Id": "send-to-lambda",
    "Arn": "arn:aws:lambda:us-east-1:123:function:process-order",
    "InputTransformer": {
      "InputPathsMap": {"orderId": "$.detail.orderId", "amount": "$.detail.amount"},
      "InputTemplate": "{\\"orderId\\": \\"<orderId>\\", \\"total\\": <amount>, \\"originalEvent\\": \\"<aws.events.event.json>\\"}"
    }
  }]'
# -- "originalEvent" is quoted, exactly like "orderId" was.

# The Lambda target receives something like:
# {
#   "orderId": "abc123",
#   "total": 99.99,
#   "originalEvent": "{version:0,id:...,detail:{orderId:abc123,amount:99.99,status:placed}}"
# }
# -- per AWS's own docs, "EventBridge removes any internal quotes to
# ensure a valid string" -- the nested object's own quotes around
# its OWN keys and string values are gone, turning valid nested JSON
# into a string that is no longer parseable as JSON at all.
echo '{"originalEvent": "{version:0,...}"}' | jq .originalEvent | jq .
# jq: error (at <stdin>:0): Invalid numeric literal at ...
# -- confirms the nested value is corrupted, unparseable text.`,
    },
    {
      label: 'The fix — omit quotes for compound variables',
      language: 'bash',
      code: `# Matching AWS's own documented correct pattern -- no quotes around
# the object-valued variable:
aws events put-targets \\
  --rule high-value-orders --event-bus-name my-app-events \\
  --targets '[{
    "Id": "send-to-lambda",
    "Arn": "arn:aws:lambda:us-east-1:123:function:process-order",
    "InputTransformer": {
      "InputPathsMap": {"orderId": "$.detail.orderId", "amount": "$.detail.amount"},
      "InputTemplate": "{\\"orderId\\": \\"<orderId>\\", \\"total\\": <amount>, \\"originalEvent\\": <aws.events.event.json>}"
    }
  }]'
# -- "originalEvent" is now unquoted, matching AWS's own documented
# rule for compound values.

# The Lambda target now receives a genuinely nested, valid object:
# {
#   "orderId": "abc123",
#   "total": 99.99,
#   "originalEvent": {
#     "version": "0", "id": "...", "detail-type": "Order Placed",
#     "source": "com.myapp.orders",
#     "detail": { "orderId": "abc123", "amount": 99.99, "status": "placed" }
#   }
# }

# Confirm the scalar placeholders (orderId, amount) still work
# correctly whether or not they're manually quoted -- per AWS's own
# docs, EventBridge normalizes either form to valid output for
# scalars specifically, unlike compound values:
# "total": <amount>     -- works, output: "total": 99.99
# "total": "<amount>"   -- ALSO works, output: "total": 99.99
# (both forms produce the same valid result for a scalar variable)`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'Following the main page\'s own InputTransformer pattern (which correctly quotes the string orderId placeholder and leaves the numeric amount placeholder unquoted), a team extends it to also forward the complete original event to a downstream service, by wrapping the reserved aws.events.event.json variable in quotes — reasoning "it worked for orderId, so quoting must be the safe default." The downstream Lambda starts throwing JSON parse errors on the originalEvent field specifically, while orderId and total continue to parse correctly. Using this subtopic\'s theory, explain the failure and the fix.',
    hint: 'What does AWS\'s own documentation say happens specifically when a variable representing a JSON OBJECT (not a plain string or number) is wrapped in quotes inside the InputTemplate?',
    solution: 'Per this subtopic\'s theory, the "strings need quotes" generalization from the main page\'s own orderId example doesn\'t extend to aws.events.event.json, because that variable represents a JSON OBJECT, not a scalar string. AWS\'s own documentation states the real rule directly: "EventBridge does not add quotes to variables that represent JSON objects or arrays. Do not add quotes for variables that represent JSON objects or arrays," and describes exactly the failure the team is hitting: "If a JSON path references a JSON object or array, but the variable is referenced in a string, EventBridge removes any internal quotes to ensure a valid string." By wrapping aws.events.event.json in quotes, the team told EventBridge to treat the entire original event as literal string TEXT rather than a nested JSON value — EventBridge then stripped that object\'s own internal quotes (around its own keys and string values) to keep the outer string itself valid, producing a string that looks like JSON but no longer parses as JSON at all. orderId and total continue to work because they ARE genuinely scalar values, where quoting is optional and EventBridge normalizes either way. The fix is removing the quotes around aws.events.event.json specifically — {"originalEvent": <aws.events.event.json>}, no surrounding quotes — which lets EventBridge embed it as a genuinely nested JSON object instead of a corrupted string.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'The rule for whether to quote an InputTransformer placeholder is simply "strings need quotes, numbers don\'t," matching the main page\'s own single orderId/amount example.',
      reality: 'Per this subtopic\'s theory, that generalization happens to work for the main page\'s own example but isn\'t the real rule — AWS\'s own documentation confirms quotes are actually OPTIONAL for any scalar (string or number) variable, since EventBridge auto-adds them as needed; the rule that genuinely matters is never quoting variables that represent JSON objects or arrays.'
    },
    {
      thought: 'Quotes around InputTemplate placeholders are always harmless decoration that EventBridge normalizes correctly regardless of what type of value the variable actually represents.',
      reality: 'Per this subtopic\'s exercise, quoting a compound (object/array) variable is NOT harmless — AWS\'s own documentation states EventBridge strips that variable\'s own internal quotes to preserve the outer string\'s validity, silently corrupting the nested structure rather than raising any error.'
    },
    {
      thought: 'The only way to include the complete original event in a transformed target payload is to manually reconstruct every field EventBridge would otherwise provide automatically.',
      reality: 'Per this subtopic\'s theory, AWS provides a reserved variable specifically for this — aws.events.event.json — which, when used unquoted as a JSON value, embeds the full original event object directly, with no manual field-by-field reconstruction needed.'
    }
  ];
}
