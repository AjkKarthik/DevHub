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
  templateUrl: './gsi-silently-excludes-items-missing-the-indexed-sort-key.html',
  styleUrl: './gsi-silently-excludes-items-missing-the-indexed-sort-key.scss'
})
export class GsiSilentlyExcludesItemsMissingTheIndexedSortKeySubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page\'s own single-table design challenge depends on this exact behavior — without ever stating it',
      points: [
        'The main page\'s own "Design a Single-Table Schema for a Blog" challenge solution gives only the postItem a GSI1PK/GSI1SK pair ("GSI1PK: \'POST#post-456\'... GSI1PK for GetPost"). The userItem and commentItem objects in that same solution never define GSI1PK or GSI1SK at all.',
        'The challenge\'s own hint says "Use a GSI with PK=POST#postId to get a specific post (access pattern 3)" — but never explains WHY querying that GSI only ever returns posts, never users or comments, even though all three item types live in the same table and the same GSI is defined once, table-wide.',
        'The main page\'s own quickRef entry defines a GSI simply as an "alternate partition+sort key pair" — with no mention of what happens to an item that doesn\'t have one of those attributes at all.',
      ]
    },
    {
      heading: 'A GSI only ever contains items that actually have its key attributes — DynamoDB silently skips everything else, with no error',
      points: [
        'Per AWS\'s own documentation: "A global secondary index only tracks data items where its key attributes actually exist." This is the entire reason the challenge\'s own solution works: userItem and commentItem simply don\'t have GSI1PK, so DynamoDB never propagates them to GSI1 — the "filtering" the challenge relies on isn\'t a filter at all, it\'s an omission.',
        'AWS\'s own worked example makes the mechanics explicit: adding an item missing its indexed sort-key attribute to a GameScores table, then noting "Because you didn\'t specify the TopScore attribute, DynamoDB would not propagate this item to GameTitleIndex" — a Scan of the base table returns 4 items, the same Scan pattern against the index returns only 3.',
        'AWS\'s own documentation is explicit that this is a documented default, not an edge case: "If you write an item to a table, you don\'t have to specify the attributes for any global secondary index sort key... In this case, DynamoDB does not write any data to the index for this particular item." Elsewhere it\'s stated even more generally: "If a table contains an item where a particular attribute(s) is not defined, but that attribute is defined as an index partition key or sort key, DynamoDB doesn\'t write any data for that item to the index."',
        'Critically, none of this produces an error, an exception, or even a warning — the PutItem call succeeds normally, and the item exists correctly in the base table. The only symptom is that the item is invisible to any Query or Scan run against that specific GSI, which is exactly why this is easy to design around intentionally (like the challenge does) and just as easy to hit by accident in production (like a bug that fails to set GSI1PK for a "should be findable" item).',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Reproducing the challenge\'s own exclusion behavior directly',
      language: 'bash',
      code: `# The main page's own single-table Blog schema: userItem and
# commentItem never set GSI1PK; only postItem does.

# Put all three item types into the same table:
aws dynamodb put-item --table-name Blog --item '{
  "PK": {"S": "USER#user-123"}, "SK": {"S": "METADATA"},
  "type": {"S": "USER"}
}'
aws dynamodb put-item --table-name Blog --item '{
  "PK": {"S": "USER#user-123"}, "SK": {"S": "POST#post-456"},
  "type": {"S": "POST"},
  "GSI1PK": {"S": "POST#post-456"}, "GSI1SK": {"S": "METADATA"}
}'
aws dynamodb put-item --table-name Blog --item '{
  "PK": {"S": "POST#post-456"}, "SK": {"S": "COMMENT#c-1"},
  "type": {"S": "COMMENT"}
}'
# -- 3 items total in the base table.

aws dynamodb scan --table-name Blog --select COUNT
# { "Count": 3, "ScannedCount": 3 }

aws dynamodb scan --table-name Blog --index-name GSI1 --select COUNT
# { "Count": 1, "ScannedCount": 1 }
# -- only postItem propagated to GSI1 -- per AWS's own docs,
# userItem and commentItem are silently skipped because neither
# one ever defines GSI1PK. No error was raised by any of the three
# put-item calls above -- all three succeeded identically.`,
    },
    {
      label: 'The same mechanism as a silent production bug, not a deliberate design',
      language: 'bash',
      code: `# Now imagine a code path that's SUPPOSED to make every post
# findable via GSI1, but a refactor introduces a bug: "featured"
# posts are created through a different function that forgot to
# set GSI1PK/GSI1SK.

aws dynamodb put-item --table-name Blog --item '{
  "PK": {"S": "USER#user-123"}, "SK": {"S": "POST#post-999"},
  "type": {"S": "POST"},
  "title": {"S": "Featured: Launch Day"}
}'
# -- succeeds. No ValidationException. No warning. The item is a
# completely normal, fully-readable POST item in the base table.

aws dynamodb query --table-name Blog --index-name GSI1 \\
  --key-condition-expression "GSI1PK = :pk" \\
  --expression-attribute-values '{":pk":{"S":"POST#post-999"}}'
# { "Items": [], "Count": 0 }
# -- GetPost(post-999) via the main page's own GSI1 access pattern
# silently returns nothing. The post exists; querying for it by ID
# through the documented access pattern finds it invisible -- this
# is indistinguishable, from the caller's side, between "the post
# doesn't exist" and "the post exists but was never indexed" --
# there's no error to grep for in logs, because none is raised.

# Detecting drift like this in production: compare base-table count
# to GSI count for a given item type, since Scan+Select COUNT is
# cheap relative to reading every item:
aws dynamodb scan --table-name Blog \\
  --filter-expression "#t = :post" \\
  --expression-attribute-names '{"#t":"type"}' \\
  --expression-attribute-values '{":post":{"S":"POST"}}' \\
  --select COUNT
# vs.
aws dynamodb scan --table-name Blog --index-name GSI1 --select COUNT
# -- a mismatch between these two counts is the practical signal
# that some POST items are missing GSI1PK/GSI1SK.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A team extends the main page\'s own single-table Blog schema with a new "draft" post feature. Drafts are created through a fast, minimal write path that only sets PK, SK, type, and title — deliberately skipping GSI1PK/GSI1SK "to keep drafts out of search results until published." A few weeks later, a support ticket reports that a specific PUBLISHED post (confirmed to exist via GetItem on its PK/SK) can\'t be found by GetPost(postId), which queries GSI1. Using this subtopic\'s theory, what\'s the most likely explanation, and how would you confirm it?',
    hint: 'The main page\'s own challenge already uses "no GSI1PK" as an intentional design choice for one item type (comments/users). What happens if a "publish" action forgets to ADD GSI1PK/GSI1SK to an item that was created without them?',
    solution: 'Per this subtopic\'s theory, the most likely explanation is that the "publish" action updates the post\'s status/visibility fields but never actually sets GSI1PK/GSI1SK on the item — so the post remains permanently absent from GSI1, exactly as intentionally designed for drafts, even though it\'s now supposed to be publicly findable. This matches the same silent-exclusion mechanism the main page\'s own challenge solution relies on for userItem/commentItem: DynamoDB doesn\'t propagate an item to a GSI unless the item actually carries that GSI\'s key attributes, and it never raises an error for an UpdateItem that leaves those attributes unset. To confirm it, run a GetItem on the post\'s known PK/SK to prove the item itself is intact and marked published, then run a Query against GSI1 for that same post\'s expected GSI1PK value — an empty result confirms GSI1PK/GSI1SK were never set (or never updated) on that item. The fix is to make the publish action explicitly set GSI1PK/GSI1SK as part of the same UpdateExpression that flips the post to published, and to add a reconciliation check (like the base-table-count-vs-GSI-count comparison in this subtopic\'s code examples) to catch any other posts already stuck in the same state.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'Every item written to a table with a GSI automatically appears in that GSI, since a GSI is just an alternate view of the same underlying data.',
      reality: 'Per this subtopic\'s theory, a GSI only contains items that actually define its key attributes — an item missing the GSI\'s partition or sort key is written to the base table successfully but is never propagated to that index at all.'
    },
    {
      thought: 'If an item is missing an attribute required by a GSI\'s key schema, DynamoDB rejects the write with a validation error.',
      reality: 'Per this subtopic\'s theory, AWS\'s own documentation states the opposite for a MISSING attribute: the write succeeds normally and the item simply isn\'t indexed. (A data TYPE mismatch on an attribute that IS present is a separate case, and that one does raise a ValidationException.)'
    },
    {
      thought: 'In the main page\'s own Blog schema, GSI1 only ever returning posts (never users or comments) must be because DynamoDB filters query results by the item\'s own "type" attribute.',
      reality: 'Per this subtopic\'s exercise, the "type" attribute has nothing to do with it — GSI1 only returns posts because only postItem defines GSI1PK/GSI1SK. If a userItem or commentItem happened to define those same attributes, it would appear in GSI1 query results too, regardless of its "type" value.'
    }
  ];
}
