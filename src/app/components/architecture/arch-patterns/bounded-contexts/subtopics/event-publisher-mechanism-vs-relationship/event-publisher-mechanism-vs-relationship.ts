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
  templateUrl: './event-publisher-mechanism-vs-relationship.html',
  styleUrl: './event-publisher-mechanism-vs-relationship.scss'
})
export class EventPublisherMechanismVsRelationshipSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'Event Publisher was missing from the page\'s own "canonical list" of context map patterns',
      points: [
        'The page\'s own QnA, "What integration patterns exist between bounded contexts?", is written as an exhaustive-sounding list: Partnership, Shared Kernel, Customer-Supplier, Conformist, ACL, Open Host Service, Published Language, Separate Ways. Event Publisher was not among them.',
        'But the "Event Storming Output" codeTab uses exactly this pattern — labeling Order-to-Shipping and Order-to-Notification as event-driven relationships where Order broadcasts and any interested context subscribes, with no direct coupling to who is listening.',
        'Event Publisher is a real, named UPSTREAM pattern in the modern DDD context-mapping vocabulary (see the ddd-crew/context-mapping reference and the Context Mapper tool), grouped alongside Open Host Service as one of the two upstream-side patterns — it describes a context broadcasting events for any downstream to pick up.',
      ]
    },
    {
      heading: 'Why Event Publisher and Customer/Supplier are not the same fact, even when both apply to events',
      points: [
        'Event Publisher answers a MECHANISM question: how does data move from one context to another? (Answer: broadcast events, no direct coupling to subscribers.)',
        'Customer/Supplier answers a RELATIONSHIP question: does the downstream have influence over what the upstream builds? (Answer: yes, if the upstream genuinely accommodates the downstream in its planning.)',
        'A relationship can be Event Publisher without being Customer/Supplier — a context that broadcasts events with zero regard for who consumes them, or what they need, is Event Publisher on its own. It only becomes ALSO Customer/Supplier if there is separate evidence the publishing team plans around a specific subscriber\'s needs.',
        'This is exactly the same mechanism-vs-relationship split as the sibling subtopic on Order-to-Catalog (ACL is a mechanism; Customer/Supplier is a relationship) — two different pairs of patterns, same underlying lesson: naming HOW something integrates does not automatically tell you WHO has influence over WHOM.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Same event-publishing code, two different relationship stories',
      language: 'typescript',
      code: `// THE MECHANISM -- identical code either way
class OrderEventPublisher {
  private subscribers: Array<(event: DomainEvent) => void> = [];

  subscribe(handler: (event: DomainEvent) => void): void {
    this.subscribers.push(handler);
  }

  publish(event: DomainEvent): void {
    // Order has NO idea who is subscribed, or what they need.
    // This alone is Event Publisher -- full stop.
    for (const handler of this.subscribers) handler(event);
  }
}

// STORY A -- Event Publisher ONLY (no Customer/Supplier)
// Shipping subscribes to OrderConfirmed. If Shipping needs a new field
// on that event, Order's team has no obligation to add it -- Order
// publishes what Order needs to publish, Shipping adapts or does not.

// STORY B -- Event Publisher AND Customer/Supplier
// Billing subscribes to AppointmentCompleted (see the Scheduling/Billing
// example in the Challenge on the main page). Billing requested a new
// insurancePreAuthId field, and Scheduling's team added it to their
// event schema as part of their own planning -- that accommodation is
// what makes THIS relationship also Customer/Supplier, not the mere
// fact that events are involved.

// Same publish/subscribe code in both stories -- the difference is
// entirely in how the UPSTREAM team behaves toward the downstream's
// requests, which no amount of reading the event-publishing code alone
// can tell you.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'Two contexts both use event publishing to integrate. Context A\'s publishing team ignores every request from downstream subscribers. Context B\'s publishing team maintains a public roadmap and explicitly credits subscriber teams for requested fields. Are these two relationships the same context-map pattern?',
    hint: 'Both use the same MECHANISM. Does that mean they have the same RELATIONSHIP?',
    solution: 'No. Both A and B are Event Publisher -- that classification only describes the mechanism (broadcast events, no direct coupling to who listens), and both fit it identically. But they are NOT the same relationship pattern overall: Context A, where the upstream ignores downstream requests, is Event Publisher alone (possibly combined with Conformist, since downstream just has to adapt to whatever it gets). Context B, where the upstream genuinely accommodates downstream requests in its planning, is Event Publisher combined with Customer/Supplier. The lesson generalizes beyond events -- any upstream pattern (Open Host Service, Event Publisher) can pair with any downstream/relationship pattern (Customer/Supplier, Conformist), and you need evidence about the TEAM relationship, not just the code, to know which pairing applies.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'If two contexts integrate via published domain events, the relationship between them is called "Event-Driven" or "Event-Based" as a context-map pattern.',
      reality: 'Per this subtopic\'s theory, the correct named pattern is Event Publisher — one of the two canonical upstream patterns (alongside Open Host Service) in the DDD context-mapping vocabulary, not an informal "event-driven" label.'
    },
    {
      thought: 'Because Event Publisher and Customer/Supplier both showed up describing the same Order-to-Shipping-style relationship, they must be interchangeable names for the same pattern.',
      reality: 'Per this subtopic\'s theory, they answer different questions entirely — Event Publisher describes the delivery mechanism, Customer/Supplier describes whether downstream has influence over upstream\'s planning. A relationship can be one, the other, both, or neither.'
    },
    {
      thought: 'Once you know a context publishes events that other contexts subscribe to, you have fully classified the context-map relationship.',
      reality: 'Per this subtopic\'s theory, knowing the mechanism only answers half the question — you still need separate evidence about the team relationship (does upstream accommodate downstream\'s needs?) to know whether Customer/Supplier, Conformist, or neither also applies.'
    }
  ];
}
