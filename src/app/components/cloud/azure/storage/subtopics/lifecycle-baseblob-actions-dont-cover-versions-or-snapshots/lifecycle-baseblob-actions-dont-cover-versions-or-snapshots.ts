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
  templateUrl: './lifecycle-baseblob-actions-dont-cover-versions-or-snapshots.html',
  styleUrl: './lifecycle-baseblob-actions-dont-cover-versions-or-snapshots.scss'
})
export class LifecycleBaseblobActionsDontCoverVersionsOrSnapshotsSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page\'s own lifecycle policy and its own versioning recommendation quietly don\'t work together',
      points: [
        'The main page\'s own "SAS Token & Lifecycle Policy" codeTab defines a lifecycle rule with only a baseBlob action block: tierToCool at 30 days, tierToArchive at 90 days, delete at 365 days. Its own theory separately recommends enabling "Versioning... for critical data" for point-in-time restore. Nothing on the main page connects these two, or warns that combining them as written leaves a gap.',
        'A lifecycle rule\'s actions object supports three independent action targets: baseBlob (the current, live blob), snapshot (manual blob snapshots), and version (versions automatically created by Blob Versioning) — each with its own tier/delete conditions. baseBlob actions apply ONLY to the current blob; they never reach snapshots or versions.',
      ]
    },
    {
      heading: 'Confirmed via Microsoft\'s own reference: three separate, independently-configured action parameters',
      points: [
        'Microsoft\'s own PowerShell reference for Add-AzStorageAccountManagementPolicyAction exposes -BaseBlobAction, -SnapshotAction, and -BlobVersionAction as three distinct parameters on the same cmdlet — each is added to a rule\'s action list separately, and none is inherited or implied by another.',
        'The trigger fields differ by target, and this matters: baseBlob actions use daysAfterModificationGreaterThan (or, if access tracking is enabled, daysAfterLastAccessTimeGreaterThan), while snapshot and version actions use daysAfterCreationGreaterThan instead. A version or snapshot is immutable the instant it\'s created, so "last modified" isn\'t a meaningful trigger for it — the day-count field itself is different, not just the target.',
        'This means the main page\'s own JSON policy, applied to a versioned container, only ever tiers or deletes the CURRENT blob. Every old version created by an overwrite is left at whatever tier it was created in (typically Hot, since versions inherit the tier of the write that created them) — forever, with no automatic cleanup at all.',
      ]
    },
    {
      heading: 'Why this is a genuine, silent cost leak — and how to close it',
      points: [
        'Every write to a versioned blob (overwrite, even a metadata-only update) creates a new, immutable, full-priced version. A blob that\'s rewritten daily — a config file, a generated report, a frequently-updated document — can accumulate hundreds of Hot-tier versions within a year, each billed at full rate, while the CURRENT version correctly tiers to Cool then Archive exactly as the policy intends.',
        'The gap is easy to introduce without noticing: Versioning is typically turned on independently of the lifecycle policy (a one-click toggle in the portal\'s Data protection settings), often well after the lifecycle policy was already written and tested against an unversioned container — nothing forces the two settings to be reconsidered together.',
        'The fix is adding an explicit version action block to the same rule (or a separate rule): e.g. version.tierToArchive.daysAfterCreationGreaterThan and version.delete.daysAfterCreationGreaterThan. If manual snapshots are also used, a matching snapshot.delete.daysAfterCreationGreaterThan closes that gap too — snapshots are equally invisible to a baseBlob-only rule and equally billed.',
        'If a storage account has neither Blob Versioning nor manual snapshots enabled, a baseBlob-only rule is complete as written — this gap specifically only opens up once Versioning (or snapshots) is enabled on a container that already has a baseBlob-only policy.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'The main page\'s policy, as written — incomplete once Versioning is on',
      language: 'bash',
      code: `# The main page's own example, unchanged:
az storage account management-policy create \\
  --account-name mystorageacct --resource-group my-rg \\
  --policy '{
    "rules": [{
      "name": "tiering-rule",
      "enabled": true,
      "type": "Lifecycle",
      "definition": {
        "filters": { "blobTypes": ["blockBlob"] },
        "actions": {
          "baseBlob": {
            "tierToCool": { "daysAfterModificationGreaterThan": 30 },
            "tierToArchive": { "daysAfterModificationGreaterThan": 90 },
            "delete": { "daysAfterModificationGreaterThan": 365 }
          }
        }
      }
    }]
  }'

# If Blob Versioning is also enabled on this container (per the main
# page's own separate recommendation for "critical data"), every
# overwrite creates a new version -- and this policy has ZERO
# actions targeting "version", so every one of those versions stays
# at its original tier (usually Hot) and is NEVER deleted. Only the
# current blob actually follows the tiering/deletion schedule above.`,
    },
    {
      label: 'The corrected policy: version and snapshot actions added',
      language: 'bash',
      code: `az storage account management-policy create \\
  --account-name mystorageacct --resource-group my-rg \\
  --policy '{
    "rules": [{
      "name": "tiering-rule",
      "enabled": true,
      "type": "Lifecycle",
      "definition": {
        "filters": { "blobTypes": ["blockBlob"] },
        "actions": {
          "baseBlob": {
            "tierToCool": { "daysAfterModificationGreaterThan": 30 },
            "tierToArchive": { "daysAfterModificationGreaterThan": 90 },
            "delete": { "daysAfterModificationGreaterThan": 365 }
          },
          "version": {
            "tierToArchive": { "daysAfterCreationGreaterThan": 90 },
            "delete": { "daysAfterCreationGreaterThan": 365 }
          },
          "snapshot": {
            "delete": { "daysAfterCreationGreaterThan": 365 }
          }
        }
      }
    }]
  }'

# Note the trigger field difference: version/snapshot use
# "daysAfterCreationGreaterThan", NOT "daysAfterModificationGreaterThan"
# -- a version is immutable from the moment it's created, so there is
# no separate "modified" event to key off for it.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'Your storage account has a lifecycle policy identical to the main page\'s own example (baseBlob: Cool at 30 days, Archive at 90, delete at 365), and six months ago you enabled Blob Versioning on the same container for point-in-time restore, exactly as the main page recommends doing "for critical data." Your storage bill has grown steadily since, even though current-blob tiering looks correct in the portal. What\'s the most likely cause?',
    hint: 'Check whether the existing lifecycle rule has any action block besides baseBlob, and what happens to a blob\'s old versions when the rule doesn\'t.',
    solution: 'The existing rule defines only a baseBlob action block, which never applies to blob versions. Every overwrite of the versioned blob has been creating a new, immutable, full-priced version that this rule has zero visibility into — they\'ve been accumulating at their original tier (typically Hot) for the full six months with no automatic tiering or deletion, even while the CURRENT version of each blob correctly follows the 30/90/365-day schedule. The fix is adding an explicit version action block to the rule (e.g. tierToArchive at 90 days, delete at 365 days, both keyed on daysAfterCreationGreaterThan rather than daysAfterModificationGreaterThan) so old versions are tiered and cleaned up on a comparable schedule to the current blob.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'My lifecycle rule tiers blobs to Archive after 90 days and deletes them after 365, so all my data — including old versions created by Blob Versioning — is protected from runaway storage cost.',
      reality: 'Per this subtopic\'s theory, a baseBlob-only action never touches blob versions. If Versioning is enabled, every old version stays at its original tier indefinitely and keeps billing at full rate, completely unaffected by the baseBlob rule.'
    },
    {
      thought: 'Blob version actions in a lifecycle policy use the same daysAfterModificationGreaterThan trigger as baseBlob actions, just scoped to apply to versions instead of the current blob.',
      reality: 'Per this subtopic\'s theory, version and snapshot actions use daysAfterCreationGreaterThan, not daysAfterModificationGreaterThan — a version is immutable the instant it\'s created, so "last modified" isn\'t a meaningful concept for it at all.'
    },
    {
      thought: 'Enabling Blob Versioning is purely additive protection — it can\'t change how an already-working lifecycle policy behaves.',
      reality: 'Per this subtopic\'s theory, turning on Versioning silently creates a whole new class of billed objects (versions) that an existing baseBlob-only policy has no visibility into at all. The policy\'s behavior on the current blob doesn\'t change, but a real cost and cleanup gap opens up right next to it that didn\'t exist before Versioning was enabled.'
    }
  ];
}
