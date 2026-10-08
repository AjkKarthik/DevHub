import { Component } from '@angular/core';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';

@Component({
  selector: 'app-kafka-aeg-kafka-tier',
  standalone: true,
  imports: [SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
    TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './kafka-needs-standard-tier.html',
  styleUrl: './kafka-needs-standard-tier.scss'
})
export class KafkaNeedsStandardTierSubtopic {
  topicLabel = 'Event Grid & Event Hubs';
  topicRoute = '/messaging/azure-event-grid';

  theory: TheoryPoint[] = [
    {
      heading: 'Kafka Protocol Support Is Tier-Gated',
      points: [
        'The Kafka-compatible endpoint (port 9093) is available on Standard, Premium, and Dedicated tier namespaces -- it does not exist on Basic tier at all.',
        'Pointing a Kafka client at a Basic-tier namespace typically surfaces as a <code>TopicAuthorizationException</code>, which reads like a permissions or credentials bug rather than an obviously tier-related limitation.',
        'The Kafka endpoint and the native AMQP/HTTP endpoints run on the SAME namespace side by side -- there is no protocol choice at provisioning time, only a tier floor: anything Standard or above gets both.'
      ]
    },
    {
      heading: 'Kafka Consumer Groups Are a Separate, Also Tier-Capped Limit',
      points: [
        'Number of Kafka consumer groups per namespace: not available on Basic, 1,000 on Standard, Premium, and Dedicated.',
        'That is a DIFFERENT number from Event Hubs\' own native consumer groups, which cap far lower per tier: 1 on Basic, 20 on Standard, 100 on Premium, 1,000 (or unlimited per capacity unit) on Dedicated.',
        'A team migrating an existing Kafka application onto a Basic-tier namespace to save cost hits two independent walls at once: no Kafka endpoint whatsoever, and -- even falling back to native clients -- just 1 concurrent consumer group.'
      ]
    }
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Model: which tier actually speaks Kafka',
      language: 'typescript',
      code: `type Tier = 'basic' | 'standard' | 'premium' | 'dedicated';

const KAFKA_SUPPORTED: Record<Tier, boolean> = {
  basic: false, standard: true, premium: true, dedicated: true,
};
const NATIVE_CONSUMER_GROUPS: Record<Tier, number> = {
  basic: 1, standard: 20, premium: 100, dedicated: 1000,
};

function connectKafkaClient(tier: Tier, bootstrapServer: string) {
  if (!KAFKA_SUPPORTED[tier]) {
    throw new Error(
      \`TopicAuthorizationException: Not authorized to access topics -- \` +
      \`\${tier} tier has no Kafka endpoint at \${bootstrapServer}\`
    );
  }
  return { connected: true, bootstrapServer, port: 9093 };
}

try {
  connectKafkaClient('basic', 'mynamespace.servicebus.windows.net');
} catch (e: any) {
  console.log(e.message);
  // TopicAuthorizationException: Not authorized to access topics --
  // basic tier has no Kafka endpoint at mynamespace.servicebus.windows.net
}

console.log(connectKafkaClient('standard', 'mynamespace.servicebus.windows.net'));
// { connected: true, bootstrapServer: '...', port: 9093 }

console.log('Basic native consumer groups:', NATIVE_CONSUMER_GROUPS.basic);
// 1 -- even the native (non-Kafka) client is limited to a single consumer group`
    }
  ];

  exercise: TryItExercise = {
    prompt: 'Your team provisions a Basic-tier Event Hubs namespace because it is the cheapest option, then points an existing Kafka consumer at it with <code>bootstrap.servers=mynamespace.servicebus.windows.net:9093</code>. What happens, and what is the actual fix?',
    hint: 'Check which tiers the port-9093 Kafka endpoint is actually available on.',
    solution: 'The connection fails outright -- Basic tier has no Kafka endpoint at all, and the failure commonly surfaces as a TopicAuthorizationException that reads like a credentials problem rather than a tier limitation. The real fix is provisioning at least Standard tier. Basic tier is native-protocol-only (AMQP/HTTP), and even for a native client it only allows 1 consumer group.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'Any Event Hubs namespace can be pointed at like a Kafka broker.',
      reality: 'Only Standard tier and above expose the Kafka-compatible endpoint. Basic tier does not have it, regardless of credentials or configuration.'
    },
    {
      thought: 'A TopicAuthorizationException when connecting via Kafka always means bad credentials.',
      reality: 'It is also the typical symptom of trying to use the Kafka protocol against a Basic-tier namespace, which has no Kafka endpoint at all.'
    },
    {
      thought: 'Kafka consumer groups and Event Hubs\' native consumer groups share the same limit.',
      reality: 'They are tracked separately. Kafka consumer groups cap at 1,000 on Standard and above, while native consumer groups cap much lower per tier -- just 1 on Basic, 20 on Standard, 100 on Premium.'
    }
  ];
}
