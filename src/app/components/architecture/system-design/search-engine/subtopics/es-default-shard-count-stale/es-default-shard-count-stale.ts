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
  templateUrl: './es-default-shard-count-stale.html',
  styleUrl: './es-default-shard-count-stale.scss'
})
export class ElasticsearchDefaultShardCountIs1Not5Subtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'A version-specific default, stated as if it were still current',
      points: [
        'The page\'s own QnA originally stated: "By default, an index has 5 primary shards." Verified via WebSearch: this was true for Elasticsearch versions before 7.0 (released 2019) — since 7.0, the default is 1 primary shard per index. The page has been corrected.',
        'This is a classic "documentation drift" trap: a fact that was true and widely repeated for years (Elasticsearch 1.x through 6.x all defaulted to 5 shards) can keep circulating in tutorials, blog posts, and interview prep material long after the underlying software changed — checking a specific version-dependent default against current official docs is worth doing even when the claim sounds authoritative.',
      ]
    },
    {
      heading: 'Why the default changed from 5 to 1',
      points: [
        'The old default of 5 primary shards was a one-size-fits-all guess that often over-sharded small indexes — each shard carries fixed overhead (file handles, memory for segment metadata, cluster state entries), so an index with modest data volume split into 5 shards wasted resources on overhead relative to its actual size.',
        'Elasticsearch 7.0 changed the default to 1 primary shard specifically to stop this common over-sharding problem for typical/small indexes — the recommendation shifted toward explicitly choosing a shard count based on expected data volume (as the SAME page\'s own QnA already correctly advises: "targeting shard sizes of 10-50 GB each") rather than relying on any one-size-fits-all default at all.',
      ]
    },
    {
      heading: 'The practical takeaway: never rely on the default for a real index',
      points: [
        'Regardless of which specific number the default happens to be in a given Elasticsearch version, the actionable lesson is the same one the page\'s own QnA already states: primary shard count should be set explicitly at index creation time based on expected data volume, not left to whatever the current default is.',
        'For an interview or system design answer specifically, citing an exact version-dependent default number is lower-value than demonstrating the REASONING for choosing a shard count (target shard size, expected growth, query fan-out cost) — the reasoning stays correct across Elasticsearch versions even as specific default values change.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Explicit shard count vs. relying on the default',
      language: 'bash',
      code: `# Elasticsearch < 7.0: creating an index with no explicit shard
# count silently got 5 primary shards -- often too many for a
# small index, wasting per-shard overhead on data that didn't need it.

PUT /small_index
{
  "mappings": { "properties": { "title": { "type": "text" } } }
}
# Pre-7.0 default: 5 primary shards, regardless of expected data volume.
# 7.0+ default: 1 primary shard.

# The reliable approach in any version: set number_of_shards
# explicitly, sized to the index's own expected data volume.

PUT /products
{
  "settings": {
    "number_of_shards": 30,   # ~1TB / 30 = ~33GB per shard
    "number_of_replicas": 2
  },
  "mappings": { "properties": { "title": { "type": "text" } } }
}
# Explicit sizing based on target shard size (10-50GB recommended)
# works correctly across every Elasticsearch version's default.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A system design answer states: "Elasticsearch indexes default to 5 primary shards, so a small index automatically gets reasonably distributed." Is this accurate for a currently-deployed Elasticsearch cluster?',
    hint: 'Elasticsearch has had multiple major version releases since its early years -- have any of its default settings changed over that time?',
    solution: 'Not for a current deployment -- the "5 primary shards" default was accurate for Elasticsearch versions before 7.0 (released 2019), but the default has been 1 primary shard per index since 7.0. A current cluster creating an index with no explicit number_of_shards setting gets 1 shard, not 5. More importantly, relying on either default is generally the wrong approach for a real index: primary shard count should be chosen explicitly at index creation time based on expected data volume (commonly targeting 10-50GB per shard), since it cannot be changed later without creating a new index.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'A specific technical default value (like "Elasticsearch indexes default to 5 primary shards") that appears consistently across many tutorials and reference material is safe to treat as current fact.',
      reality: 'Per this subtopic\'s theory, this exact default changed in Elasticsearch 7.0 (2019) from 5 to 1 — a fact that was accurate for years can become outdated as the underlying software evolves, even while older material describing the old default keeps circulating.'
    },
    {
      thought: 'Since Elasticsearch 7.0 changed the default primary shard count to 1, that is now the "safe" number to rely on for a typical production index.',
      reality: 'Per this subtopic\'s theory, the actionable lesson isn\'t which number is the current default — it\'s that primary shard count should always be set EXPLICITLY based on expected data volume, since neither the old default (5) nor the new one (1) is calibrated to any particular index\'s actual size.'
    },
    {
      thought: 'The specific numeric default value is the most important fact to remember about Elasticsearch shard configuration for a system design interview.',
      reality: 'Per this subtopic\'s theory, the more durable and interview-relevant knowledge is the REASONING for choosing a shard count (target shard size of 10-50GB, expected data growth, query fan-out cost) — this reasoning stays valid across Elasticsearch versions even as the specific default number has changed and could change again.'
    }
  ];
}
