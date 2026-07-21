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
  templateUrl: './duplicate-event-pattern-keys-silently-use-the-last-one.html',
  styleUrl: './duplicate-event-pattern-keys-silently-use-the-last-one.scss'
})
export class DuplicateEventPatternKeysSilentlyUseTheLastOneSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page shows six distinct pattern operators in isolation — never what happens when two are combined on one field',
      points: [
        'The main page\'s own quickRef states: "Event Pattern: JSON filter applied to event fields — supports prefix, suffix, exists, numeric range, anything-but, and $or operators." Listing six capabilities side by side naturally invites wanting several of them on the SAME field — for example, "environment is anything-but \'test\', AND userId has the prefix \'admin-\'."',
        'The main page\'s own codeTabs demonstrate prefix matching, anything-but matching, and exists matching each in its own SEPARATE rule, on separate fields. The page never shows (or warns against) the natural next step: a developer combining two of these snippets onto the same field by simply writing that field\'s key twice in one pattern.',
      ]
    },
    {
      heading: 'A repeated key in an event pattern silently keeps only the LAST occurrence — with no error raised anywhere',
      points: [
        'AWS states this directly, with its own worked example: "When building event patterns, if you include a key more than once the last reference will be the one used to evaluate events." AWS\'s own example pattern defines "location" twice — once with a prefix condition, once with an anything-but condition — and states plainly: "only { \'anything-but\': \'us-east\' } will be taken into account when evaluating the location." The prefix condition is completely discarded, silently.',
        'This is exactly the trap of naively combining the main page\'s own separate prefix and anything-but examples onto a single field by pasting both key/value pairs into the same JSON object — PutRule accepts the pattern normally, with no validation error, no warning, and no indication anywhere that half of the intended logic was just thrown away.',
        'The documented, correct way to express multiple conditions on the SAME field is different depending on the intent: multiple VALUES in the array for one key are OR\'d together automatically (matching the main page\'s own quickRef "Or" example, {"PaymentType": ["Credit", "Debit"]}); a genuine AND of two DIFFERENT match types (like prefix AND anything-but) on one field isn\'t expressible as two top-level keys at all — it requires restructuring the pattern, and AWS provides $or specifically for combining conditions ACROSS different fields, not as a general-purpose way to combine arbitrary conditions on one.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Reproducing AWS\'s own documented example, on the main page\'s own field',
      language: 'bash',
      code: `# Combining the main page's own separate examples -- prefix
# matching on source, and anything-but matching on environment --
# but written as though "environment" needed BOTH a prefix check
# AND an anything-but check, by listing the key twice:
aws events put-rule \\
  --name prod-app-events-only \\
  --event-bus-name my-app-events \\
  --event-pattern '{
    "source": [{"prefix": "com.myapp."}],
    "detail": {
      "environment": [{"prefix": "us-"}],
      "environment": [{"anything-but": "test"}]
    }
  }'
# -- PutRule succeeds normally. No error, no warning about the
# duplicate "environment" key.

# Per AWS's own documented behavior for exactly this shape of
# pattern: "only { 'anything-but': 'us-east' } will be taken into
# account" (their own example) -- applied here, only the
# anything-but condition survives; the prefix condition on
# "environment" is silently discarded entirely.

# Confirm with test-event-pattern -- an event with environment
# "eu-prod" (does NOT start with "us-") still matches, proving the
# prefix condition was never actually applied:
aws events test-event-pattern \\
  --event-pattern '{"source":[{"prefix":"com.myapp."}],"detail":{"environment":[{"anything-but":"test"}]}}' \\
  --event '{"source":"com.myapp.orders","detail":{"environment":"eu-prod"}}'
# { "Result": true } -- matches, even though "eu-prod" doesn't
# start with "us-" -- the prefix condition was never real.`,
    },
    {
      label: 'The fix — restructure, don\'t duplicate the key',
      language: 'bash',
      code: `# If the actual intent was "environment must be anything-but test"
# ALONE (the more common real-world need), simply remove the
# duplicate -- there is no second, hidden requirement to express:
aws events put-rule \\
  --name prod-app-events-only \\
  --event-bus-name my-app-events \\
  --event-pattern '{
    "source": [{"prefix": "com.myapp."}],
    "detail": {"environment": [{"anything-but": "test"}]}
  }'

# If the intent was GENUINELY "environment starts with us- OR
# environment is anything-but test" (a true OR across two different
# match types on the SAME field), $or is the correct, documented
# mechanism -- it just needs to be applied deliberately, not by
# duplicating a key and hoping for AND semantics that don't exist:
aws events put-rule \\
  --name prod-app-events-only \\
  --event-bus-name my-app-events \\
  --event-pattern '{
    "source": [{"prefix": "com.myapp."}],
    "detail": {
      "$or": [
        {"environment": [{"prefix": "us-"}]},
        {"environment": [{"anything-but": "test"}]}
      ]
    }
  }'

# ALWAYS verify with test-event-pattern before trusting a pattern
# with more than one condition on the same field -- a successful
# PutRule call alone does not confirm the intended logic:
aws events test-event-pattern \\
  --event-pattern file://pattern.json \\
  --event file://sample-event.json`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'Following the main page\'s own separate prefix-matching and anything-but-matching examples, a developer wants a single rule requiring BOTH "source starts with com.myapp." AND "environment is anything but test." They build the event pattern by copying both existing rule snippets and merging them into one JSON object, ending up with two "environment" keys nested under the same "detail" object. aws events put-rule succeeds with no error or warning. Weeks later in production, events with environment="test" start reaching the target, which was specifically supposed to exclude them. Using this subtopic\'s theory, diagnose the cause.',
    hint: 'PutRule succeeded without complaint. Per AWS\'s own documentation, what happens specifically when an event pattern JSON object contains the same key more than once?',
    solution: 'Per this subtopic\'s theory, this is precisely the duplicate-key behavior AWS documents: "if you include a key more than once the last reference will be the one used to evaluate events." When the developer merged the two snippets, whichever "environment" key/value pair ended up listed SECOND in the JSON object silently became the only one EventBridge actually evaluates — the other was discarded entirely, with PutRule accepting the malformed-intent pattern completely normally, since duplicate keys are not a JSON syntax error, just a semantic trap. If the surviving (second) condition happened to be the prefix check rather than the anything-but check, then the anything-but condition the team actually needed to exclude test events was the one silently dropped — explaining exactly why environment="test" events started reaching the target despite the rule\'s own JSON appearing, at a glance, to guard against it. The fix is to never express "two conditions on the same field" as two separate top-level occurrences of that field\'s key — either consolidate into the single condition that was actually intended, or use $or deliberately if a genuine either/or across two match types on the same field is the real goal — and to verify the final pattern with test-event-pattern against both a matching and a non-matching sample event before trusting that a successful PutRule call means the logic is correct.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'If an event pattern JSON accidentally contains the same field key more than once, EventBridge\'s PutRule call fails with a validation error, catching the mistake immediately.',
      reality: 'Per this subtopic\'s theory, PutRule accepts a pattern with a duplicated key completely normally — a repeated key is valid JSON, not a syntax error, so nothing in the API response indicates anything is wrong.'
    },
    {
      thought: 'Repeating a field key in an event pattern combines both conditions with AND logic, requiring an event to satisfy both occurrences to match.',
      reality: 'Per this subtopic\'s theory, AWS\'s own documentation states the opposite: only the LAST occurrence of a repeated key is used at all — the earlier occurrence is not combined with anything, it is completely discarded.'
    },
    {
      thought: 'Testing an event pattern change is unnecessary once PutRule succeeds without error — a successful API call confirms the pattern will behave as intended.',
      reality: 'Per this subtopic\'s exercise, a successful PutRule call only confirms the pattern is syntactically valid JSON — it says nothing about whether the pattern\'s actual matching LOGIC matches what was intended, which test-event-pattern against real sample events is specifically designed to verify.'
    }
  ];
}
