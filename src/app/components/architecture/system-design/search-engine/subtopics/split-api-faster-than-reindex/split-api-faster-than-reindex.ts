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
  templateUrl: './split-api-faster-than-reindex.html',
  styleUrl: './split-api-faster-than-reindex.scss'
})
export class SplitApiResizesShardsWithoutAFullReindexSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The page names one path to a new shard count — there\'s a faster second one',
      points: [
        'The main page\'s own QnA describes changing shard count by mentioning "use the Elasticsearch Reindex API or Logstash to stream data between indexes" as the mechanism for a zero-downtime reindex. Verified via WebSearch: Elasticsearch also provides a Split API, which is specifically faster for the shard-count-increase case because it reroutes existing shard data internally rather than copying every document across the network document-by-document.',
        'This isn\'t a correction of something wrong on the page — the Reindex API genuinely does work for changing shard count — it\'s a gap-closing addition: a faster, purpose-built alternative exists for exactly this scenario, and knowing it exists (and its constraints) is worth adding to a complete answer.',
      ]
    },
    {
      heading: 'How the Split API works, and its two real constraints',
      points: [
        'The Split API creates a NEW index with a larger shard count by internally rerouting the SOURCE index\'s existing shard data — it does not read and re-write every document through the normal indexing pipeline the way _reindex does, which is why it\'s meaningfully faster for large indexes.',
        'Constraint 1: the source index must be set to read-only before splitting (no new writes during the operation) — the same "stop writes, then migrate" pattern the page\'s own Reindex-based approach already uses via an alias swap.',
        'Constraint 2: the NEW shard count must be a multiple of the source index\'s current primary shard count. If the source has 2 primary shards, valid split targets are constrained by the index\'s number_of_routing_shards setting (e.g. 4, 6, 8, 12 — not an arbitrary number). This constraint doesn\'t exist for the Reindex API approach, which can target any shard count since it\'s building the new index from scratch.',
      ]
    },
    {
      heading: 'When to reach for Split vs. Reindex',
      points: [
        'Split API: the right choice specifically for "I need MORE shards, and my target count is a valid multiple of my current count" — faster, less network/CPU cost than a full document-by-document copy.',
        'Reindex API: still the necessary choice for anything Split can\'t do — changing a mapping/analyzer (which requires actually reprocessing documents), REDUCING shard count (Split only increases), or reaching a target shard count that isn\'t a multiple of the source count.',
        'Both approaches share the SAME zero-downtime pattern the page\'s own QnA already describes: build/derive the new index while the alias still points at the old one, then atomically swap the alias once the new index is ready — Split just changes how the new index\'s data gets populated, not the overall zero-downtime strategy.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Split API — resizing shards without a full document copy',
      language: 'bash',
      code: `# 1. Source index must be read-only before splitting
PUT /products/_settings
{ "settings": { "index.blocks.write": true } }

# 2. Split into a new index with MORE primary shards.
# Target count must be a multiple of the source's current shard
# count (respecting index.number_of_routing_shards) -- e.g. a
# 30-shard source can split into 60, 90, 120... not an arbitrary number.
POST /products/_split/products_v2
{
  "settings": {
    "index.number_of_shards": 60
  }
}

# 3. Once the split completes, swap the alias atomically -- same
# zero-downtime pattern as a Reindex-based approach.
POST /_aliases
{
  "actions": [
    { "remove": { "index": "products",    "alias": "products_current" } },
    { "add":    { "index": "products_v2", "alias": "products_current" } }
  ]
}

# Contrast: the Reindex API copies every document through the normal
# indexing pipeline -- necessary for mapping/analyzer changes or
# shard counts that aren't a valid multiple, but slower for a pure
# shard-count increase since Split reroutes existing shard data
# internally instead of a full document-by-document copy.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'An index currently has 10 primary shards and needs to grow to 20 to keep individual shard sizes within the recommended range as data volume grows. The team plans to use the Reindex API to build a new 20-shard index. Is there a faster option, and if so, what constraint does it need to satisfy?',
    hint: 'Does the target shard count (20) divide evenly by the source shard count (10)?',
    solution: 'Yes -- the Split API is a faster option here, since 20 is a multiple of the source\'s 10 shards (satisfying the Split API\'s core constraint). Split reroutes the source index\'s existing shard data internally to build the new, larger-shard-count index, rather than reading and re-writing every document through the normal indexing pipeline the way Reindex does -- meaningfully faster for a pure shard-count increase on a large index. The source index must be set read-only before splitting, and the same zero-downtime alias-swap pattern applies once the new index is ready. Reindex would still be necessary if the target count weren\'t a valid multiple of the source count, or if a mapping/analyzer change were also needed.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'Changing an Elasticsearch index\'s primary shard count always requires a full Reindex API pass that copies every document through the normal indexing pipeline.',
      reality: 'Per this subtopic\'s theory, the Split API can increase primary shard count by internally rerouting existing shard data — faster than a full document-by-document copy — when the target shard count is a valid multiple of the source\'s current count.'
    },
    {
      thought: 'The Split API can be used to resize a shard count to any target value, making it a universal faster replacement for Reindex when changing shard count.',
      reality: 'Per this subtopic\'s theory, the Split API only works when the new shard count is a multiple of the source index\'s current primary shard count (respecting number_of_routing_shards) — Reindex remains necessary for target counts that don\'t satisfy this constraint, for reducing shard count, or for changing mappings/analyzers.'
    },
    {
      thought: 'Using the Split API instead of Reindex means the source index can keep accepting writes during the operation, since Split works "in place."',
      reality: 'Per this subtopic\'s theory, the Split API requires the source index to be set read-only first — the same "stop writes, then migrate, then atomically swap" pattern the page\'s own Reindex-based zero-downtime approach already uses, not a way to avoid a write freeze entirely.'
    }
  ];
}
