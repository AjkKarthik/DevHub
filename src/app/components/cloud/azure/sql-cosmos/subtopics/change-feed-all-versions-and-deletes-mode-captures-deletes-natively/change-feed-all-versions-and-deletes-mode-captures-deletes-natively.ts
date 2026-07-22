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
  templateUrl: './change-feed-all-versions-and-deletes-mode-captures-deletes-natively.html',
  styleUrl: './change-feed-all-versions-and-deletes-mode-captures-deletes-natively.scss'
})
export class ChangeFeedAllVersionsAndDeletesModeCapturesDeletesNativelySubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page describes the soft-delete workaround as though it were the only option',
      points: [
        'The main page\'s own QnA on Change Feed states: "It does not include deletes (unless you use soft-delete pattern with a \'deleted\' flag)." This is presented as the complete picture — Change Feed simply doesn\'t capture deletes, full stop, and a workaround is the only way to react to them.',
        'That was accurate for the change feed mode the main page is implicitly describing — but it is no longer the complete picture. Cosmos DB now offers a second mode that captures deletes as first-class events, without needing the soft-delete pattern at all.',
      ]
    },
    {
      heading: 'Confirmed via Microsoft\'s own change feed modes reference: two distinct modes, one now natively capturing deletes',
      points: [
        'Per Microsoft\'s own documentation, the mode the main page describes is "Latest version" mode: "This mode of change feed doesn\'t log deletes. You can capture deletes by setting a \'soft-delete\' flag within your items instead of deleting them directly." This is Cosmos DB\'s original, still-default behavior — the main page\'s description of it is accurate as far as it goes.',
        'A second mode, "All versions and deletes," changes this: "All versions and deletes mode is a persistent record of all changes to items from create, update, and delete operations... The change feed includes insert, update, and delete operations made to items within the container. Deletes from TTL expirations are also captured." Deletes appear as genuine, distinct events — no soft-delete flag, no separate TTL-based cleanup step needed to detect them.',
        'This mode also captures every intermediate change, not just the latest state: "You get a record of each change to items in the order that it occurred, including intermediate changes to an item between change feed reads... if an item is created and then updated before you read the change feed, both the create and the update versions of the item appear." Latest version mode would only ever show the final, updated state in this scenario.',
      ]
    },
    {
      heading: 'Real constraints that make this mode a deliberate tradeoff, not a strict upgrade',
      points: [
        'It requires continuous backups to be enabled on the account first, and enabling it can\'t be done at account creation: "To read from the change feed in all versions and deletes mode, you must have continuous backups configured for your Azure Cosmos DB account... The enablement process can take up to 30 minutes to be complete." This is a real account-level configuration change with its own cost implications.',
        'It has a bounded, non-negotiable retention window instead of the unlimited history Latest version mode allows: "All changes that occurred within the retention window for continuous backups on the account can be read. Attempting to read changes that occurred outside of the retention window results in an error." Latest version mode, by contrast, has "no fixed data retention period for which changes are available" and can replay from the very beginning of the container.',
        'It cannot start from the beginning of a container or from an arbitrary historical timestamp — only "from \'now\' or from a specific checkpoint within your retention period" — and it is restricted to NoSQL API accounts, is Gateway-mode only regardless of the SDK\'s configured connection mode, and doesn\'t support accounts that have ever used partition merge. Choosing this mode is a genuine architectural decision, not a drop-in replacement for the default.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Latest version mode: the main page\'s own soft-delete workaround',
      language: 'typescript',
      code: `// The pattern the main page describes -- still valid, still the
// DEFAULT mode, and still needed if you can't take on All versions
// and deletes mode's constraints:
async function softDeleteUser(container: Container, userId: string) {
  const { resource } = await container.item(userId, userId).read();
  await container.item(userId, userId).replace({
    ...resource,
    deleted: true,
    ttl: 60 * 60 * 24, // auto-purge 24h after the soft-delete flag lands
  });
  // The change feed (Latest version mode) sees this as an UPDATE,
  // not a delete -- downstream consumers must check the "deleted"
  // flag themselves. Once the TTL expires, the item is actually
  // removed, but that removal itself is NOT visible in the feed.
}`,
    },
    {
      label: 'All versions and deletes mode: a real DELETE event',
      language: 'bash',
      code: `# Prerequisite: continuous backups must already be configured on
# the account -- enabling All versions and deletes mode itself can
# take up to 30 minutes and blocks other account changes meanwhile.
az cosmosdb update \\
  --name my-cosmos --resource-group my-rg \\
  --backup-policy-type Continuous

# Then enable the feature (REST API property, preview API version
# 2024-12-01-preview or later):
# "enableAllVersionsAndDeletesChangeFeed": true

# A genuine DELETE now appears in the feed with its own metadata,
# no soft-delete flag needed:
# {
#   "metadata": {
#     "operationType": "delete",
#     "id": "<deleted item's id>",
#     "partitionKey": { "userId": "..." },
#     "timeToLiveExpired": false   <- true if this was a TTL-driven delete
#   }
# }
# Compare to Latest version mode, where this same delete produces
# NO event at all -- the item simply stops appearing in future reads.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'You need to build a real-time audit trail that alerts whenever an item is deleted from a Cosmos DB container, including deletes caused by TTL expiration. A teammate proposes the main page\'s own soft-delete pattern (a "deleted" flag plus a TTL). Will this design actually capture and alert on every delete, including TTL-driven ones, and is there a mode better suited to this specific requirement?',
    hint: 'Check what the change feed actually shows when a soft-deleted item\'s TTL finally expires and the item is physically removed — is that removal itself a visible event in Latest version mode?',
    solution: 'The soft-delete pattern alone does not fully satisfy this requirement. Setting the "deleted" flag produces an UPDATE event the audit trail can react to — but the actual physical removal once the TTL expires produces no change feed event at all in Latest version mode, since "when an item is deleted, it\'s no longer available in the feed." A true "alert on every delete, including TTL-driven ones" requirement is exactly what All versions and deletes mode was built for: it captures delete operations as first-class events with metadata including timeToLiveExpired, distinguishing an explicit delete from a TTL-driven one. The tradeoff is real, though — this mode requires continuous backups, has a bounded retention window tied to that backup period, and can only start reading from "now" or a checkpoint, not from the beginning of the container\'s history.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'Azure Cosmos DB\'s change feed can never capture delete operations directly — a soft-delete workaround is the only way to react to deletions, regardless of configuration.',
      reality: 'Per this subtopic\'s theory, Microsoft\'s own documentation describes a second mode, All versions and deletes, whose change feed "includes insert, update, and delete operations made to items within the container" — deletes appear as genuine, distinct events with no soft-delete flag required.'
    },
    {
      thought: 'Switching to All versions and deletes mode is a strict upgrade with no real downside compared to the default Latest version mode.',
      reality: 'Per this subtopic\'s theory, the new mode requires continuous backups to be configured first, is bounded by that backup retention window rather than offering unlimited history, and can\'t replay from the beginning of a container — genuine constraints that make it a deliberate architectural tradeoff, not a free upgrade.'
    },
    {
      thought: 'Once All versions and deletes mode is enabled, both change feed modes become equivalent, differing only in whether deletes happen to show up.',
      reality: 'Per this subtopic\'s theory, the two modes differ in more than delete visibility — All versions and deletes mode also surfaces every intermediate change to an item between reads (not just the latest state), while Latest version mode collapses multiple changes down to only the most recent version.'
    }
  ];
}
