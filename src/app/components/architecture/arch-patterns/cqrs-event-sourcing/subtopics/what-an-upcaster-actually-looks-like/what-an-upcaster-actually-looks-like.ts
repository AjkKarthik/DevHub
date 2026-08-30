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
  templateUrl: './what-an-upcaster-actually-looks-like.html',
  styleUrl: './what-an-upcaster-actually-looks-like.scss'
})
export class WhatAnUpcasterActuallyLooksLikeSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The QnA names the tool without ever showing it',
      points: [
        'The "What are the main challenges of implementing event sourcing in practice?" QnA says: "Use upcasters to transform old event versions to the current version during replay." That\'s the entire mention — no code anywhere on the page shows what an upcaster actually does.',
        'The core idea: an event stored years ago (say, <code>OrderPlaced v1</code>) has to remain replayable FOREVER, even after the current code has moved on to expect a richer <code>OrderPlaced v2</code> shape. Rather than making every part of the system understand every historical version forever, an upcaster is a small, dedicated transformation function that converts an old event shape into the CURRENT shape, applied automatically the moment an old event is read back from the store.',
        'This means the rest of the system (projections, business logic replaying events) only ever has to understand the LATEST event shape — upcasters absorb all the historical version differences in one place, at the read boundary, instead of scattering version-checking logic throughout every consumer of that event type.',
      ]
    },
    {
      heading: 'Why this connects directly to the page\'s own schema-evolution guidance',
      points: [
        'The theory section elsewhere recommends "additive-only changes" for event schemas — new OPTIONAL fields are the easy case, since old events simply have that field as <code>undefined</code>/missing and most code can tolerate that with a sensible default applied at read time.',
        'Upcasters become necessary for changes that are NOT simply additive — a field being renamed, a field\'s shape genuinely changing (a single <code>address: string</code> becoming a structured <code>address: { street, city, zip }</code>), or a field being split into two. These are exactly the cases this page\'s Service Communication topic already covers for API contracts (additive-only vs. genuinely breaking changes) — the same underlying distinction, applied to STORED historical events instead of live API responses.',
        'A well-designed upcaster chain applies transformations INCREMENTALLY (v1→v2, then v2→v3, then v3→v4) rather than trying to write one big v1-to-v4 conversion — this keeps each individual upcaster small and testable, and means adding a v5 later only requires writing one new v4→v5 step, not rewriting every existing upcaster.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'A small upcaster chain, applied on read',
      language: 'typescript',
      code: `// v1: original shape -- address was a single flat string
interface OrderPlacedV1 { version: 1; orderId: string; customerId: string; address: string; }

// v2: address became structured (a genuinely breaking change, not additive)
interface OrderPlacedV2 { version: 2; orderId: string; customerId: string;
  address: { street: string; city: string; zip: string }; }

// v3: added a required 'currency' field (also not simply additive --
// old events have no currency at all, so a sensible default is needed)
interface OrderPlacedV3 { version: 3; orderId: string; customerId: string;
  address: { street: string; city: string; zip: string }; currency: string; }

// Each upcaster handles exactly ONE version step
function upcastV1ToV2(e: OrderPlacedV1): OrderPlacedV2 {
  const [street, city, zip] = e.address.split(', '); // best-effort parse of the old flat string
  return { version: 2, orderId: e.orderId, customerId: e.customerId, address: { street, city, zip } };
}

function upcastV2ToV3(e: OrderPlacedV2): OrderPlacedV3 {
  return { ...e, version: 3, currency: 'USD' }; // old events assumed USD-only
}

// Applied automatically when reading ANY OrderPlaced event, regardless of
// which version it was originally stored as
function upcastToLatest(e: OrderPlacedV1 | OrderPlacedV2 | OrderPlacedV3): OrderPlacedV3 {
  let current: any = e;
  if (current.version === 1) current = upcastV1ToV2(current);
  if (current.version === 2) current = upcastV2ToV3(current);
  return current; // always OrderPlacedV3 -- consumers never see v1 or v2 shapes
}

// Projections and business logic only ever work with the LATEST shape:
async function replayOrder(streamId: string) {
  const rawEvents = await eventStore.load(streamId); // mixed v1/v2/v3 in one stream
  const latestShapeEvents = rawEvents.map(upcastToLatest);
  // ...replay latestShapeEvents against the current aggregate logic
}`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A team stores OrderPlaced events for years. Today they need to change the address field from a flat string to a structured object -- a genuinely breaking shape change, not an additive one. Without an upcaster, what breaks, and where does the upcaster fix it?',
    hint: 'Consider ALL the code that will ever read an OrderPlaced event -- projections built last year, business logic replaying an aggregate today, and any NEW projection someone writes next year.',
    solution: 'Without an upcaster, every single piece of code that reads an OrderPlaced event -- old projections, aggregate replay logic, and any brand-new projection written in the future -- would need its own version-checking logic to handle both the old flat-string address AND the new structured address, scattered across the whole codebase. An upcaster fixes this by centralizing the transformation in ONE place, applied automatically the moment an event is read from the store: every consumer downstream of that read boundary only ever sees the current, structured address shape, regardless of which version the event was originally stored as -- new consumers written years later never even need to know the old shape existed.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'Upcasters are only needed for purely additive event schema changes, the same case the page\'s own "additive-only changes" recommendation already covers.',
      reality: 'Per this subtopic\'s theory, additive-only changes (new optional fields) are usually the EASY case that doesn\'t need an upcaster at all — upcasters become necessary specifically for genuinely breaking changes like renames, restructuring, or newly-required fields.'
    },
    {
      thought: 'An upcaster needs to convert directly from any old version straight to the current version in one large transformation function.',
      reality: 'Per this subtopic\'s theory, the recommended approach is a CHAIN of small, incremental upcasters (v1→v2, then v2→v3) — keeping each step small and testable, and meaning a future v4 only requires one new upcaster, not rewriting the whole chain.'
    },
    {
      thought: 'Since upcasters only affect how events look, business logic and projections still need their own version-handling code as a safety net.',
      reality: 'Per this subtopic\'s theory, the entire point is that consumers downstream of the read boundary — projections, replay logic — only ever see the LATEST shape and need zero version-awareness of their own, since the upcaster chain absorbs all historical differences before the event reaches them.'
    }
  ];
}
