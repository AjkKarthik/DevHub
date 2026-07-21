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
  templateUrl: './dax-item-cache-and-query-cache-are-fully-independent.html',
  styleUrl: './dax-item-cache-and-query-cache-are-fully-independent.scss'
})
export class DaxItemCacheAndQueryCacheAreFullyIndependentSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page describes DAX as one "write-through cache" — AWS\'s own docs describe two, and only one of them is write-through',
      points: [
        'The main page\'s own theory bullet states: "DAX (DynamoDB Accelerator): in-memory cluster, microsecond read latency... API-compatible... Write-through cache." — phrased as if a write through DAX keeps "the cache" consistent, singular.',
        'The main page\'s own QnA answer comparing DAX to ElastiCache goes further, calling DAX\'s caching logic automatic — "write-through, item-level invalidation" — without ever mentioning that DAX caches Query/Scan RESULT SETS in a completely separate place that this "item-level invalidation" never touches.',
      ]
    },
    {
      heading: 'DAX actually runs two independent caches — a write only ever updates the item cache, never the query cache',
      points: [
        'Per AWS\'s own documentation: "Every DAX cluster has two distinct caches—an item cache and a query cache." The item cache serves GetItem/BatchGetItem by key; the query cache serves Query/Scan by caching entire result sets.',
        'AWS states the independence directly, and calls out that this is true even when every operation goes through DAX (no bypass involved): "Every write to DAX alters the state of the item cache. However, writes to the item cache don\'t affect the query cache. (The DAX item cache and query cache serve different purposes, and operate independently from one another.)" — and, from the query-cache side: "Updates to the item cache, or to the underlying DynamoDB table, do not invalidate or modify the results stored in the query cache."',
        'AWS\'s own worked example (a user named Charlie, using the main page\'s own kind of Query pattern against a GameScores-shaped table) makes the consequence concrete: Charlie runs a Query for all his scores (cached in the query cache); he then updates his own high score via UpdateItem through DAX (updates the item cache only); he reruns the EXACT SAME Query and does not see his new high score — "This is because the query results come from the query cache, not the item cache. The two caches are independent from one another, so a change in one cache does not affect the other cache." The stale result persists until that specific cached Query\'s own TTL expires.',
        'This is a different failure mode from DAX bypassing entirely (writing directly to DynamoDB, skipping DAX) — AWS documents that separately with a second example (Alice and Bob) where staleness comes from one of two users skipping DAX. The Charlie scenario is stronger: staleness happens even when every single operation, read and write alike, goes through DAX correctly — it is a structural property of having two caches, not a misuse of DAX.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Reproducing the stale-Query problem on the main page\'s own Orders table',
      language: 'bash',
      code: `# Using the main page's own "Query & Scan" access pattern --
# get all orders for a user -- but routed through a DAX client
# instead of the plain DynamoDB client (API-compatible, per the
# main page's own theory bullet):
# const dax = new AmazonDaxClient({ endpoints: ["daxEndpoint:8111"] });

# 1) First call -- a cache miss -- DAX forwards to DynamoDB, then
#    caches the whole result set in the QUERY cache:
# const r1 = await dax.query({
#   TableName: "Orders",
#   KeyConditionExpression: "userId = :uid",
#   ExpressionAttributeValues: { ":uid": "user-123" }
# }).promise();
# r1.Items -> [{ orderId: "order-456", status: "pending", ... }]

# 2) Update that same order's status -- ALSO through the DAX client,
#    same as the main page's own recommended pattern:
# await dax.update({
#   TableName: "Orders",
#   Key: { userId: "user-123", orderId: "order-456" },
#   UpdateExpression: "SET #s = :new_status",
#   ExpressionAttributeNames: { "#s": "status" },
#   ExpressionAttributeValues: { ":new_status": "shipped" }
# }).promise();
# -- per AWS's own docs, this write updates DynamoDB AND the DAX
# item cache. It does NOT touch the query cache at all.

# 3) Re-run the EXACT SAME query from step 1:
# const r2 = await dax.query({
#   TableName: "Orders",
#   KeyConditionExpression: "userId = :uid",
#   ExpressionAttributeValues: { ":uid": "user-123" }
# }).promise();
# r2.Items -> [{ orderId: "order-456", status: "pending", ... }]
# -- STILL "pending" -- served entirely from the query cache,
# untouched by step 2's write, exactly like AWS's own Charlie
# example. A direct GetItem for the same order, by contrast,
# WOULD show "shipped" immediately -- because GetItem reads the
# item cache, which step 2 DID update.`,
    },
    {
      label: 'Where read-your-writes actually matters, work around the query cache directly',
      language: 'bash',
      code: `# Option 1 -- read the single item instead of re-running the Query,
# whenever the caller only needs to confirm ONE record's freshness:
# dax.get({ TableName: "Orders", Key: { userId, orderId } })
# -- item cache is write-through, so this reflects DAX-routed
# writes immediately, unlike the same data reached via Query.

# Option 2 -- set a short TTL specifically for query-cache entries
# that back a "just changed this, need to see it now" UI flow, so
# staleness is bounded to seconds rather than whatever the
# cluster-wide default is -- confirmed by AWS's own docs: "Your
# application should consider the TTL value for the query cache and
# how long your application can tolerate inconsistent results
# between the query cache and the item cache."

# Option 3 -- for a read that must reflect every write immediately,
# request a STRONGLY CONSISTENT query and accept the cache is
# skipped entirely for that call:
# dax.query({ ..., ConsistentRead: true })
# -- per AWS's own docs, DAX passes strongly consistent reads
# straight through to DynamoDB and does NOT cache the result at
# all -- guaranteed fresh, at the cost of losing DAX's latency
# benefit for that specific call.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'Following the main page\'s own recommendation to route reads and writes through DAX for latency, a checkout flow does this: Query DynamoDB (via DAX) for a user\'s cart items and render them; the user removes one item, triggering a DeleteItem (via DAX); the UI then immediately re-runs the exact same cart Query (via DAX) to refresh the displayed list. Using this subtopic\'s theory, what will the refreshed list show, and why?',
    hint: 'The delete goes through DAX, so which of DAX\'s two caches gets updated by it — and is that the same cache the refresh Query actually reads from?',
    solution: 'Per this subtopic\'s theory, the refreshed cart Query will most likely still show the deleted item, for the same TTL-bounded window as AWS\'s own Charlie example. The DeleteItem call updates DynamoDB and the DAX item cache, but the cart-listing Query is served from the separate query cache, which "do[es] not invalidate or modify the results stored in the query cache" in response to item-cache or table changes — the cached Query result set for that user\'s cart stays exactly as it was when it was first cached, until its own TTL expires. This is the same structural cause as the exercise\'s own example: it has nothing to do with whether the delete was routed through DAX correctly (it was) — the query cache simply never listens for item-level changes at all. The practical fix for a checkout UI, where "just removed, must not still show it" matters, is to either query with ConsistentRead: true for that one refresh call (skips both caches, always current, costs the DAX latency benefit only for that call) or to set a short TTL specifically for the cart-listing query, rather than relying on the default cluster-wide query-cache TTL.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'Since the main page describes DAX as a "write-through cache," any write made through DAX is immediately reflected in every subsequent read through DAX, including Query and Scan results.',
      reality: 'Per this subtopic\'s theory, write-through only describes the item cache. A write updates the item cache synchronously but never touches the query cache — Query and Scan results stay exactly as cached until their own TTL expires, regardless of any write.'
    },
    {
      thought: 'GetItem and Query are just two different ways to read the same table, so DAX must be reusing the same cached data underneath both.',
      reality: 'Per this subtopic\'s theory, AWS\'s own documentation is explicit that DAX maintains "two distinct caches" for exactly this reason — GetItem/BatchGetItem always reads the item cache; Query/Scan always reads the separate query cache; neither one is a view onto the other.'
    },
    {
      thought: 'Once a GetItem through DAX confirms a write is visible (the item cache is up to date), any Query that would logically include that same item must also reflect the update.',
      reality: 'Per this subtopic\'s exercise, this is exactly the trap — a Query\'s cached result set is a frozen snapshot from whenever it first ran, independent of the item cache\'s own freshness, and stays stale until that specific cached query expires on its own TTL.'
    }
  ];
}
