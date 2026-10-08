import { Component } from '@angular/core';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';

@Component({
  selector: 'app-kafka-aeg-retention',
  standalone: true,
  imports: [SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
    TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './retention-is-tier-capped.html',
  styleUrl: './retention-is-tier-capped.scss'
})
export class RetentionIsTierCappedSubtopic {
  topicLabel = 'Event Grid & Event Hubs';
  topicRoute = '/messaging/azure-event-grid';

  theory: TheoryPoint[] = [
    {
      heading: 'The Real Per-Tier Retention Ceiling',
      points: [
        'Maximum retention is fixed per tier, not a shared 1–90 day dial: Basic is locked at 1 day with no retention setting at all, Standard maxes out at 7 days, and only Premium/Dedicated reach the full 90-day ceiling.',
        'On Standard, Premium, and Dedicated the DEFAULT is only 1 hour — the tier maximum is something you must explicitly configure, not something you get automatically by picking the tier.',
        'Storage capacity is a second, independent constraint: 84 GB per throughput unit on Basic/Standard, 1 TB per processing unit on Premium, 10 TB per capacity unit on Dedicated. A high-throughput hub can hit the storage ceiling and evict old events before the configured day-based window even expires.'
      ]
    },
    {
      heading: 'What Changing Retention Actually Does',
      points: [
        'Retention changes apply to existing events, not just future writes — shortening the window on a namespace can make already-stored events unavailable sooner than a consumer expects.',
        'Events can\'t be explicitly deleted early, and become unavailable exactly when the retention period expires — there is no grace window either side of that boundary.',
        'Event Hubs is a real-time streaming engine, not a database. For anything that needs to outlive the retention window, use Event Hubs Capture to archive events to Blob Storage or Data Lake automatically.'
      ]
    }
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Model: effective retention per tier',
      language: 'typescript',
      code: `type Tier = 'basic' | 'standard' | 'premium' | 'dedicated';

const TIER_MAX_HOURS: Record<Tier, number> = {
  basic: 24, standard: 7 * 24, premium: 90 * 24, dedicated: 90 * 24,
};
// Basic has no separate default -- it is the max, fixed.
const TIER_DEFAULT_HOURS: Record<Tier, number> = {
  basic: 24, standard: 1, premium: 1, dedicated: 1,
};

function retentionWindowHours(tier: Tier, configuredHours?: number): number {
  if (tier === 'basic') return TIER_MAX_HOURS.basic; // not adjustable
  const requested = configuredHours ?? TIER_DEFAULT_HOURS[tier];
  return Math.min(requested, TIER_MAX_HOURS[tier]);
}

console.log(retentionWindowHours('basic'));
// 24 -- always 1 day, whatever you "ask" for
console.log(retentionWindowHours('basic', 90 * 24));
// 24 -- request ignored, Basic has no retention setting

console.log(retentionWindowHours('premium'));
// 1  -- left untouched, Premium defaults to just 1 hour

console.log(retentionWindowHours('premium', 90 * 24));
// 2160 -- 90 days, only once explicitly configured

console.log(retentionWindowHours('standard', 30 * 24));
// 168 -- a 30-day request on Standard clamps to the 7-day tier max`
    }
  ];

  exercise: TryItExercise = {
    prompt: 'A team provisions a Premium-tier Event Hubs namespace specifically for its 90-day retention headline, planning to replay events for consumers that fall behind. They never touch the retention setting. A consumer comes back online after 3 days of downtime and tries to replay from where it left off. Will the events still be there?',
    hint: 'Check the DEFAULT retention for Premium tier, not the tier\'s maximum.',
    solution: 'No. Left unconfigured, Premium (like Standard and Dedicated) defaults to just 1 hour of retention, regardless of the tier\'s 90-day ceiling. Events from 3 days ago are long gone. The fix is to explicitly set retention on the Event Hub to a window that covers the slowest realistic consumer downtime -- provisioning the tier alone does not get you the maximum.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'Premium tier automatically retains events for up to 90 days.',
      reality: '90 days is a maximum you must explicitly configure. Left untouched, Standard, Premium, and Dedicated all default to just 1 hour of retention.'
    },
    {
      thought: 'Basic tier\'s 1-day retention is a default I can lower or raise like on the other tiers.',
      reality: 'Basic tier has no separate default/maximum split at all -- it is fixed at 1 day with no retention setting to adjust.'
    },
    {
      thought: 'Lowering the retention window only affects events written after the change.',
      reality: 'Retention changes apply to existing events too. Shortening the window can make already-stored events unavailable sooner than expected.'
    }
  ];
}
