import { Component } from '@angular/core';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent, SubtopicLink } from '../../../../../shared/subtopic-nav/subtopic-nav';

@Component({
  selector: 'app-co-locating-a-search-index-on-one-cluster-node-with-hash-tags',
  standalone: true,
  imports: [SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
            TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './co-locating-a-search-index-on-one-cluster-node-with-hash-tags.html',
  styleUrl: './co-locating-a-search-index-on-one-cluster-node-with-hash-tags.scss',
})
export class CoLocatingASearchIndexOnOneClusterNodeWithHashTagsSubtopic {
  theory: TheoryPoint[] = [
    {
      heading: 'Named as an option in the QnA, never shown as code',
      points: [
        'The main page\'s own QnA says RedisSearch indexes are per-node in Cluster mode, and names two fixes: "a coordinator (Redis Enterprise)" or "run all searchable keys on the same slot using hash tags." No codeTab on the page shows the second, self-hosted-friendly option actually working.',
        'The mechanism is exactly the same hash-tag extraction rule Redis Cluster uses for any other multi-key operation — giving every key meant to be part of the SAME searchable dataset an IDENTICAL <code>{tag}</code> forces them all onto the same node\'s slot, so that node\'s own local RediSearch index sees the complete, un-fragmented document set.',
      ],
    },
    {
      heading: 'The real tradeoff this makes',
      points: [
        'This approach genuinely works without Redis Enterprise\'s coordinator — but it means every document in that particular search index lives on ONE node (plus its replicas), which caps that index\'s own capacity and throughput at what a single node can hold and serve, not the whole cluster\'s combined capacity.',
        'This is a reasonable fit for a bounded dataset (a single tenant\'s catalog, one customer\'s document set) that fits comfortably on one node — for a search index that genuinely needs to scale beyond one node\'s memory or query throughput, the main page\'s own other option (Redis Enterprise\'s coordinator, or a dedicated search service entirely) is the better fit.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Co-locating an index with a shared hash tag',
      language: 'typescript',
      code: `function extractHashTagSubstring(key: string): string {
  const open = key.indexOf('{');
  if (open === -1) return key;
  const close = key.indexOf('}', open + 1);
  if (close === -1) return key;
  if (close === open + 1) return key;
  return key.slice(open + 1, close);
}

// Every product key for this tenant's catalog shares the SAME tag -- guaranteeing
// they all land on the same Cluster slot, and therefore the same node.
const catalogKeys = [
  '{catalog:tenant-42}product:1',
  '{catalog:tenant-42}product:2',
  '{catalog:tenant-42}product:3',
];

console.log(catalogKeys.map(extractHashTagSubstring));
// [ 'catalog:tenant-42', 'catalog:tenant-42', 'catalog:tenant-42' ] -- identical tags, one slot

// Contrast: keys with no shared tag scatter across whichever slots their full text hashes to.
const scatteredKeys = ['product:1', 'product:2', 'product:3'];
console.log(scatteredKeys.map(extractHashTagSubstring));
// [ 'product:1', 'product:2', 'product:3' ] -- each hashes independently, likely different nodes

// FT.CREATE's PREFIX option then only needs to match the key SHAPE, not the tag itself --
// the tag is transparent to RediSearch, it only affects Cluster's own slot routing.
// FT.CREATE idx:tenant42 ON JSON PREFIX 1 '{catalog:tenant-42}product:' SCHEMA ...`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A team gives every tenant\'s catalog its OWN hash tag (<code>{catalog:tenant-1}</code>, <code>{catalog:tenant-2}</code>, ...) and creates a SEPARATE FT index per tenant, each scoped with a matching PREFIX. Does this scale better across the cluster than one shared tag for every tenant\'s products combined?',
    hint: 'Trace where each tenant\'s own set of keys lands using <code>extractHashTagSubstring</code> — do different tenants necessarily share a slot with each other?',
    solution: `Yes, this scales meaningfully better. Each tenant's own tag extracts to a DIFFERENT substring (tenant-1 vs tenant-2 vs tenant-3, etc.), so each tenant's own catalog independently co-locates onto its OWN slot -- which, across enough tenants, spreads naturally across every master node in the cluster rather than concentrating everyone's data on one.

This preserves the exact co-location benefit each individual tenant's own search index needs (all of ONE tenant's documents on one node, so that tenant's queries see the complete dataset) while avoiding the single-shared-tag design's real weakness: cramming every tenant onto the identical slot regardless of how many tenants there are. The per-tenant tagging pattern is a genuinely common, production-realistic way to combine Cluster's horizontal scaling with RediSearch's per-node indexing constraint.`,
  };

  misconceptions: Misconception[] = [
    {
      thought: '"Once keys are hash-tagged for co-location, FT.SEARCH automatically knows to query across every node just for that index."',
      reality: 'FT.SEARCH still only queries the one node it connects to — hash tags solve WHERE the documents live (guaranteeing they are all on one node), not HOW the search command reaches multiple nodes. The main page\'s own QnA is explicit that true cross-node search still needs a coordinator (Redis Enterprise) or a different tool entirely; hash tags are what makes a single-node index actually complete, not what makes a query span the whole cluster.',
    },
    {
      thought: '"A hash tag used for search co-location works differently from a hash tag used for any other multi-key Cluster operation."',
      reality: 'It is the exact same mechanism, verified above with the identical <code>extractHashTagSubstring</code> function already used for co-locating ordinary transaction keys — RediSearch has no special hash-tag handling of its own; it simply benefits from the same Cluster-level slot-routing guarantee every other multi-key Redis operation relies on.',
    },
  ];

  topicLabel = 'Redis Stack';
  topicRoute = '/redis/redis-stack';
  prev: SubtopicLink | null = {
    label: 'The FT.INFO indexing Field Is a Truthy String, Not a Boolean',
    route: '/redis/redis-stack/the-ft-info-indexing-field-is-a-truthy-string-not-a-boolean',
  };
  next: SubtopicLink | null = null;
}
