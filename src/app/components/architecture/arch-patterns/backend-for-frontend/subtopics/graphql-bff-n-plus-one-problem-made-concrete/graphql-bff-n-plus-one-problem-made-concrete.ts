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
  templateUrl: './graphql-bff-n-plus-one-problem-made-concrete.html',
  styleUrl: './graphql-bff-n-plus-one-problem-made-concrete.scss'
})
export class GraphqlBffNPlusOneProblemMadeConcreteSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'A risk discussed at length in prose, never shown in code',
      points: [
        'This page names GraphQL as a BFF option in its own quickRef ("GraphQL layer as BFF — clients query exactly the fields they need") and dedicates a whole theory section to "BFF vs GraphQL." Its QnA goes further, naming the specific risk: "a GraphQL resolver layer can silently accumulate N+1 query problems... unless carefully batched with tools like DataLoader."',
        'But all three codeTabs on the page (Mobile BFF, Web BFF, Third-Party BFF) are REST handlers — none of them is a GraphQL resolver, and nothing on the page shows what an N+1 problem actually looks like inside one, or what DataLoader-based batching does to fix it.',
        'This subtopic writes the resolver the QnA describes but never shows — first the naive, N+1-prone version, then the DataLoader-batched fix.',
      ]
    },
    {
      heading: 'Why a GraphQL BFF is especially prone to N+1, in a way a REST BFF is not',
      points: [
        'The page\'s own REST BFFs (Mobile, Web, Third-Party) each fan out to downstream services with a FIXED, predictable number of calls per request — <code>Promise.all([catalogService..., inventoryService..., reviewService...])</code> is always exactly 3 calls, no matter what.',
        'A GraphQL resolver, by contrast, resolves each FIELD independently — a query asking for a list of products, each with its own reviews, naturally leads a naive resolver to call the reviews service once PER PRODUCT in the list, not once for the whole list. The number of downstream calls scales with the SHAPE of the query, not with a fixed aggregation plan the way the REST BFFs\' code does.',
        'This is exactly the asymmetry the page\'s own QnA names when contrasting the two: "a plain REST BFF endpoint has a fixed, predictable aggregation cost per call, while a GraphQL BFF\'s cost varies per query shape" — the mechanism behind that sentence is N+1 resolution, made concrete below.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Naive resolver (N+1) vs. DataLoader-batched resolver',
      language: 'typescript',
      code: `// GraphQL BFF schema (conceptually):
// type Product { id: ID!, name: String!, reviews: [Review!]! }
// type Query { products(category: String!): [Product!]! }

// NAIVE RESOLVER -- N+1 in action
const productsResolver = {
  Query: {
    products: (_: unknown, args: { category: string }) =>
      catalogService.getProductsByCategory(args.category),  // 1 call
  },
  Product: {
    // This resolver runs ONCE PER PRODUCT in the result list --
    // for a 20-product list, that's 20 separate calls to reviewService,
    // on top of the 1 call already made above. 1 + N = N+1.
    reviews: (product: { id: string }) =>
      reviewService.getReviews(product.id),   // <-- called 20 times!
  },
};

// A REST BFF equivalent never has this shape -- it decides its
// downstream calls ONCE, up front, regardless of how many items
// end up in the response:
async function getProductsRest(category: string) {
  const products = await catalogService.getProductsByCategory(category);
  // Even fetching reviews for every product here is still ONE call,
  // not N -- because the REST handler controls the batching itself.
  const reviews = await reviewService.getReviewsForProducts(products.map(p => p.id));
  return products.map(p => ({ ...p, reviews: reviews[p.id] ?? [] }));
}

// DATALOADER-BATCHED RESOLVER -- fixes the GraphQL version to match
// the REST BFF's fixed-cost behavior
const reviewsLoader = new DataLoader<string, Review[]>(async (productIds) => {
  // DataLoader collects every reviews(product.id) call made during
  // the SAME tick of the event loop, then fires ONE batched call --
  // 20 individual resolver invocations collapse into 1 downstream call.
  const reviewsByProduct = await reviewService.getReviewsForProducts(productIds);
  return productIds.map(id => reviewsByProduct[id] ?? []);
});

const productsResolverBatched = {
  Query: {
    products: (_: unknown, args: { category: string }) =>
      catalogService.getProductsByCategory(args.category),
  },
  Product: {
    // Same resolver shape, same per-product invocation -- but now each
    // call just enqueues a key with the loader instead of calling the
    // service directly. The loader coalesces all 20 enqueued keys into
    // ONE downstream call once the current tick finishes.
    reviews: (product: { id: string }) => reviewsLoader.load(product.id),
  },
};`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A teammate says: "We can just fix N+1 by having each product\'s reviews resolver call reviewService.getReviews(product.id) with a short in-memory cache, so repeated IDs are fast." Does caching alone solve the same problem DataLoader solves?',
    hint: 'For a list of 20 DIFFERENT products, how many DIFFERENT cache keys would there be — and does caching reduce the NUMBER of distinct downstream calls for distinct keys?',
    solution: 'No -- caching and batching solve different problems. A cache helps when the SAME key is requested more than once (e.g. the same product appearing twice in a result set) by avoiding a redundant call for a key already fetched. But for a list of 20 DIFFERENT products, there are 20 DIFFERENT cache keys -- a cache does nothing to reduce that to fewer downstream calls, since none of them are actually redundant lookups of the same key. DataLoader solves a different problem: it collects DIFFERENT keys requested during the same tick and fires ONE downstream call for all of them together, which a per-key cache cannot do on its own. In practice DataLoader does both (batching AND per-request caching), but the batching half -- not the caching half -- is what fixes the N+1 problem in this scenario.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'A GraphQL resolver with clean, well-organized field-level resolvers (like the naive version shown here) is inherently well-structured, so it is unlikely to have a performance problem.',
      reality: 'Per this subtopic\'s theory, clean structure and N+1 risk are unrelated — a naive resolver can be perfectly well-organized code and still call a downstream service once per item in a result list, which is exactly what happened here.'
    },
    {
      thought: 'The N+1 problem is specific to database queries (like an ORM lazily loading related rows) and does not apply to a BFF calling other backend services over the network.',
      reality: 'Per this subtopic\'s theory, the same pattern applies to any per-item downstream call — an ORM hitting the database once per row and a GraphQL resolver hitting reviewService once per product are the same underlying problem, just at different layers.'
    },
    {
      thought: 'Adding a simple in-memory cache to a resolver is a sufficient fix for N+1, equivalent to using DataLoader.',
      reality: 'Per this subtopic\'s theory, a cache only helps when the SAME key repeats — it does nothing to reduce the number of downstream calls for a list of genuinely distinct items, which is what DataLoader\'s batching (not its caching) actually fixes.'
    }
  ];
}
