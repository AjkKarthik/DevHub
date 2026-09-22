import { Component } from '@angular/core';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';

@Component({
  selector: 'app-kafka-aeg-domains',
  standalone: true,
  imports: [SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
    TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './domains-support-100000-topics.html',
  styleUrl: './domains-support-100000-topics.scss'
})
export class DomainsSupport100000TopicsSubtopic {
  topicLabel = 'Event Grid & Event Hubs';
  topicRoute = '/messaging/azure-event-grid';

  theory: TheoryPoint[] = [
    {
      heading: 'The Real Domain Topic Ceiling',
      points: [
        'Custom topics are capped at 100 per Azure subscription -- a hard wall for any app that needs more than 100 independently-addressable topics, such as one topic per tenant.',
        'An Event Grid domain raises that ceiling to 100,000 topics under ONE endpoint -- not the commonly-assumed "1,000" figure.',
        'Each topic inside a domain still gets its own event subscriptions (up to 500 per topic) and its own routing, so tenants stay fully isolated from each other even though they share a single domain resource.'
      ]
    },
    {
      heading: 'Why Domains Exist At All',
      points: [
        'Without domains, an app with more than 100 tenants needing per-tenant topics would run straight into the 100-custom-topics-per-subscription wall -- domains exist specifically to raise that ceiling by three orders of magnitude.',
        'Domain-SCOPE event subscriptions -- subscriptions that match events across every topic in the domain, not just one -- are capped much lower: 50, and that limit can\'t be increased. This is a separate, easy-to-confuse ceiling from the per-topic 500 limit.',
        'Retention inside a domain topic is still just 1 day, the same as a standalone custom topic. Domains raise the TOPIC COUNT ceiling, not the retention window.'
      ]
    }
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Model: when you actually need a domain',
      language: 'typescript',
      code: `const CUSTOM_TOPICS_PER_SUBSCRIPTION = 100;
const TOPICS_PER_DOMAIN               = 100_000;

function planTenantTopics(tenantCount: number) {
  if (tenantCount <= CUSTOM_TOPICS_PER_SUBSCRIPTION) {
    return { strategy: 'custom topics', fits: true, ceiling: CUSTOM_TOPICS_PER_SUBSCRIPTION };
  }
  return {
    strategy: 'domain',
    fits: tenantCount <= TOPICS_PER_DOMAIN,
    ceiling: TOPICS_PER_DOMAIN,
  };
}

console.log(planTenantTopics(40));
// { strategy: 'custom topics', fits: true, ceiling: 100 }

console.log(planTenantTopics(40_000));
// { strategy: 'domain', fits: true, ceiling: 100000 }
// far under the real 100,000 ceiling -- the "up to 1,000" figure would
// have wrongly ruled this out

console.log(planTenantTopics(150_000));
// { strategy: 'domain', fits: false, ceiling: 100000 }
// even a domain has a real limit -- shard across a second domain past this`
    }
  ];

  exercise: TryItExercise = {
    prompt: 'Your SaaS app has 40,000 tenants, each needing its own Event Grid topic for isolation. Can you provision that many custom topics directly? What should you use instead, and how many topics can it actually hold?',
    hint: 'Check the custom-topics-per-subscription limit against the domain topic limit -- they are very different numbers.',
    solution: 'No -- custom topics cap at 100 per Azure subscription, nowhere close to 40,000. Use an Event Grid domain instead: 40,000 tenant topics fit comfortably under its real 100,000-topics-per-domain ceiling, all reachable through one endpoint, with each tenant\'s topic still independently subscribable.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'Event Grid domains cap out around 1,000 topics.',
      reality: 'The documented limit is 100,000 topics per domain -- "1,000" undercounts the real ceiling by 100x.'
    },
    {
      thought: 'Domain-scope event subscriptions share the same 500-per-topic limit as regular topic subscriptions.',
      reality: 'Domain-scope subscriptions (matching events across the whole domain) are capped separately, at 50, and that limit can\'t be increased.'
    },
    {
      thought: 'A domain topic gets more retention than a standalone custom topic.',
      reality: 'Retention inside a domain topic is still 1 day, the same as a standalone custom topic -- domains raise topic COUNT, not retention.'
    }
  ];
}
