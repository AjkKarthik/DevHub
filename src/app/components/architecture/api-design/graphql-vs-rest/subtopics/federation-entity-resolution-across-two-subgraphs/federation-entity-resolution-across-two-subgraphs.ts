import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';

const theory: TheoryPoint[] = [
  {
    heading: '"Services Can Extend Each Other’s Types" — What That Actually Means',
    points: [
      'The main page’s own QnA on federation states plainly: "Services can extend each other’s types (e.g., Order service adds <code>orders</code> field to User)." No codeTab on the page shows how one subgraph actually contributes a field onto a type it does not own.',
      'Real Apollo Federation identifies an entity by a <code>@key</code> field (commonly <code>id</code>). The OWNING subgraph resolves the entity’s base fields directly. An EXTENDING subgraph never re-implements those base fields — it only implements a reference resolver that takes the shared key and returns whatever ADDITIONAL fields it owns.',
      'The gateway is what stitches these together at query time: it asks the owning subgraph for the base entity, then — for every extending subgraph a query actually touched fields from — passes just the key (not the full entity) to that subgraph’s reference resolver and merges the result.',
      'This is exactly why federation avoids the BFF pattern this hub’s own topic separately covers needing a single monolithic aggregation layer — each subgraph independently owns and evolves its own slice of the schema, and the gateway’s merging logic is generic (key in, fields out), not specific to any one pair of services.',
    ],
  },
];

const codeTabs: CodeTab[] = [
  {
    label: 'Two Subgraphs, One Gateway',
    language: 'typescript',
    code: `interface UserEntity {
  id: string;
  email: string;
}

// ── Users subgraph: OWNS User's base fields ──────────────────────────────
const usersDb: Record<string, UserEntity> = {
  u1: { id: 'u1', email: 'jane@example.com' },
};

function usersSubgraphResolveUser(id: string): UserEntity | null {
  return usersDb[id] ?? null;
}

// ── Orders subgraph: EXTENDS User with an "orders" field ──────────────────
// It never re-implements id/email -- it only knows how to resolve ITS
// OWN field, given just the shared key.
interface Order { id: string; total: number; }
const ordersDb: Record<string, Order[]> = {
  u1: [{ id: 'o1', total: 42 }, { id: 'o2', total: 15 }],
};

interface EntityReference { __typename: 'User'; id: string; }

function ordersSubgraphResolveReference(ref: EntityReference): { orders: Order[] } {
  return { orders: ordersDb[ref.id] ?? [] };
}

// ── Gateway: fetches the base entity, then asks every extending ────────────
// subgraph to resolve its own fields via the reference, and merges both.
function gatewayResolveUser(id: string) {
  const base = usersSubgraphResolveUser(id);
  if (!base) return null;

  const extension = ordersSubgraphResolveReference({ __typename: 'User', id: base.id });
  return { ...base, ...extension };
}

console.log(gatewayResolveUser('u1'));
// { id: 'u1', email: 'jane@example.com', orders: [ { id: 'o1', total: 42 }, { id: 'o2', total: 15 } ] }

console.log(gatewayResolveUser('unknown'));
// null -- the Orders subgraph is never even called for an ID the Users
// subgraph doesn't recognize as a real entity.`,
  },
];

const exercise: TryItExercise = {
  prompt:
    'The <code>ordersSubgraphResolveReference</code> function only ever receives <code>{ __typename: \'User\', id: base.id }</code> — never the full <code>UserEntity</code> object (including <code>email</code>) the Users subgraph already resolved. Why does real Apollo Federation deliberately pass only the reference, rather than the FULL entity, to an extending subgraph’s reference resolver?',
  hint: 'The Orders subgraph’s <code>ordersDb</code> is keyed purely by <code>id</code> — does it need <code>email</code> at all to do its own job? What would passing the full entity couple the Orders subgraph to, that it doesn’t actually need?',
  solution: `// Passing only the key (not the full entity) keeps the extending
// subgraph's contract minimal and independent -- the Orders subgraph
// genuinely never needs "email" to look up a user's orders, so there's
// no reason for its reference-resolver interface to depend on it.

// If the gateway instead passed the FULL User entity to every extending
// subgraph, each extending subgraph would implicitly become coupled to
// EVERY field the owning subgraph happens to expose today -- a change
// to the Users subgraph's own schema (renaming or removing a field the
// Orders subgraph never even used) could still ripple outward and force
// unrelated extending subgraphs to update, purely because of an
// unnecessarily wide interface between services that don't actually
// need to know about each other's internals.

// Keeping the reference minimal (just the @key fields) is what lets
// each subgraph in a federated graph evolve its OWN schema independently
// -- exactly the operational benefit the main page's own QnA attributes
// to federation over manual schema stitching.`,
};

const misconceptions: Misconception[] = [
  {
    thought: 'A subgraph that "extends" a type must have access to the full entity object the owning subgraph already resolved, to correctly add its own field.',
    reality: 'The codeTab’s <code>ordersSubgraphResolveReference</code> receives ONLY <code>{ __typename, id }</code> — a minimal reference, not the full <code>UserEntity</code>. Real Apollo Federation follows exactly this pattern: an extending subgraph’s reference resolver only ever gets the shared <code>@key</code> fields, keeping the two subgraphs’ own internal implementations completely decoupled from each other.',
  },
  {
    thought: 'The gateway always calls every subgraph for every entity, regardless of what a specific client query actually asked for.',
    reality: 'The theory above states the real behavior precisely: the gateway only calls an extending subgraph’s reference resolver "for every extending subgraph a query actually touched fields from." A query that never selects <code>orders</code> at all would never trigger a call to the Orders subgraph — the codeTab’s own <code>gatewayResolveUser</code> is simplified to always fetch <code>orders</code> for illustration, but a real federation gateway is smarter about only resolving what a specific query selected.',
  },
  {
    thought: 'Federation and this hub’s own BFF pattern (a single service aggregating multiple upstream calls) are essentially the same architecture with a different name.',
    reality: 'A BFF is typically ONE service making outbound calls to several UPSTREAM services and assembling the result itself — the aggregation logic lives in one place. Federation, as the codeTab demonstrates, has NO single aggregating service at all; each subgraph independently exposes a reference resolver, and the GATEWAY’s merging logic is completely generic (it doesn’t know anything specific about "Users" or "Orders"), which is precisely why federation scales to many subgraphs without needing a growing, increasingly complex BFF to keep up.',
  },
];

@Component({
  selector: 'app-api-graphql-vs-rest-federation',
  standalone: true,
  imports: [CommonModule, SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent,
    CodeBlockComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './federation-entity-resolution-across-two-subgraphs.html',
  styleUrl: './federation-entity-resolution-across-two-subgraphs.scss',
})
export class FederationEntityResolutionAcrossTwoSubgraphsSubtopic {
  theory = theory;
  codeTabs = codeTabs;
  exercise = exercise;
  misconceptions = misconceptions;
}
