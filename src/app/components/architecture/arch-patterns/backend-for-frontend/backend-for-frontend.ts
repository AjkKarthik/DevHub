import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PageMetaComponent } from '../../../shared/page-meta/page-meta';
import { QuickRefComponent, QuickRefItem } from '../../../shared/quick-ref/quick-ref';
import { TheoryBlockComponent, TheoryPoint } from '../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../shared/code-block/code-block';
import { CommonMistakesComponent, CommonMistake } from '../../../shared/common-mistakes/common-mistakes';
import { ChallengeBlockComponent, Challenge } from '../../../shared/challenge-block/challenge-block';
import { QuizBlockComponent, QuizQuestion } from '../../../shared/quiz-block/quiz-block';
import { QnaBlockComponent, QnaItem } from '../../../shared/qna-block/qna-block';
import { RevisionCardComponent, RevisionSummary } from '../../../shared/revision-card/revision-card';
import { PageCompleteComponent } from '../../../shared/page-complete/page-complete';

@Component({
  selector: 'app-arch-backend-for-frontend',
  standalone: true,
  imports: [CommonModule, PageMetaComponent, QuickRefComponent, TheoryBlockComponent,
    CodeBlockComponent, CommonMistakesComponent, ChallengeBlockComponent, QuizBlockComponent,
    QnaBlockComponent, RevisionCardComponent, PageCompleteComponent],
  templateUrl: './backend-for-frontend.html',
  styleUrl: './backend-for-frontend.scss',
})
export class ArchBackendForFrontend {

  quickRef: QuickRefItem[] = [
    { name: 'BFF', type: 'keyword', desc: 'Backend for Frontend — a dedicated API layer per client type (mobile, web, third-party)' },
    { name: 'Client-Specific API', type: 'keyword', desc: 'Responses shaped exactly for one client\'s needs — no over-fetching or under-fetching' },
    { name: 'Aggregation', type: 'keyword', desc: 'BFF fans out to multiple microservices and combines results into one response' },
    { name: 'Over-fetching', type: 'keyword', desc: 'API returns more data than the client needs — wastes mobile bandwidth' },
    { name: 'Under-fetching', type: 'keyword', desc: 'Client must make multiple API calls to get all needed data — extra round trips' },
    { name: 'GraphQL BFF', type: 'keyword', desc: 'GraphQL layer as BFF — clients query exactly the fields they need' },
    { name: 'Experience API', type: 'keyword', desc: 'Another name for BFF — an API layer designed around client experience, not service capabilities' },
  ];

  theory: TheoryPoint[] = [
    {
      heading: 'The Problem BFF Solves',
      points: [
        'A generic API gateway serves all clients with the same response shape. Mobile needs fewer fields; desktop needs more; third-party needs a stable versioned contract.',
        'Over-fetching: mobile receives 50 fields but only uses 8 — wasted bandwidth, battery, and parsing time.',
        'Under-fetching: a product page needs data from Catalog, Inventory, Reviews, and Recommendations — 4 round trips from the client.',
        'BFF: each client type gets a dedicated backend that returns exactly what it needs in one request.',
      ],
    },
    {
      heading: 'BFF Architecture',
      points: [
        'One BFF per client type (mobile BFF, web BFF, third-party BFF). Not one BFF per page.',
        'The BFF fans out to downstream microservices in parallel, aggregates results, and shapes the response for its client.',
        'The BFF is owned by the frontend team — they can evolve the API without coordinating with backend service teams.',
        'BFF is not a replacement for an API gateway — it sits behind the gateway. Gateway handles cross-cutting concerns (auth, rate limiting); BFF handles aggregation and shaping.',
      ],
    },
    {
      heading: 'BFF vs GraphQL',
      points: [
        'GraphQL is a query language that lets clients specify exactly what fields they need — solves over/under-fetching without separate BFFs.',
        'BFF advantages: simpler for the client (no query language), predictable response shapes, server-side aggregation optimisation.',
        'GraphQL advantages: one endpoint, clients self-describe their needs, rapid UI iteration without BFF changes.',
        'Both can be combined: GraphQL as the BFF layer, with the schema maintained by the frontend team.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Mobile BFF',
      language: 'typescript',
      code: `// Mobile BFF — slim responses, few fields, aggregated in one call
// GET /mobile/products/:id  (used by iOS/Android app)

interface MobileProductResponse {
  id: string;
  name: string;
  price: number;           // just the number — no currency object overhead
  imageUrl: string;        // first image only
  inStock: boolean;        // boolean, not stock count
  rating: number;          // rounded to 1 decimal
}

async function getMobileProduct(productId: string): Promise<MobileProductResponse> {
  // Fan out to 3 services in parallel — latency = slowest, not sum
  const [product, inventory, reviews] = await Promise.all([
    catalogService.getProduct(productId),
    inventoryService.getStock(productId),
    reviewService.getAverageRating(productId),
  ]);

  // Shape for mobile — minimal fields, flat structure
  return {
    id: product.id,
    name: product.name,
    price: product.price.amount,      // unwrap Money value object
    imageUrl: product.images[0]?.url ?? '',  // first image only
    inStock: inventory.stockLevel > 0,       // boolean, not count
    rating: Math.round(reviews.average * 10) / 10,
  };
}

// Desktop BFF equivalent returns: id, name, price, allImages[],
// fullDescription, specs[], reviews[], recommendations[], relatedProducts[]`
    },
    {
      label: 'Web BFF with Server-Side Rendering',
      language: 'typescript',
      code: `// Web BFF — richer response, supports SSR, includes SEO metadata
// GET /web/products/:id

interface WebProductResponse {
  id: string;
  name: string;
  description: string;
  price: { amount: number; currency: string; formatted: string };
  images: string[];
  specifications: Array<{ label: string; value: string }>;
  stockLevel: number;
  reviews: { average: number; count: number; recent: Review[] };
  seo: { title: string; description: string; canonical: string };
}

async function getWebProduct(productId: string): Promise<WebProductResponse> {
  const [product, inventory, reviews] = await Promise.all([
    catalogService.getProduct(productId),
    inventoryService.getStock(productId),
    reviewService.getReviews(productId, { limit: 5, sort: 'recent' }),
  ]);

  return {
    id: product.id,
    name: product.name,
    description: product.fullDescription,
    price: {
      amount: product.price.amount,
      currency: product.price.currency,
      formatted: formatCurrency(product.price.amount, product.price.currency),
    },
    images: product.images.map(i => i.url),
    specifications: product.specs,
    stockLevel: inventory.stockLevel,
    reviews: {
      average: reviews.average,
      count: reviews.totalCount,
      recent: reviews.items,
    },
    seo: {
      title: \`\${product.name} | Shop\`,
      description: product.shortDescription,
      canonical: \`/products/\${product.slug}\`,
    },
  };
}`
    },
    {
      label: 'Third-Party BFF (Stable API)',
      language: 'typescript',
      code: `// Third-Party BFF — versioned, stable, breaking changes only via new version
// GET /api/v1/products/:id  (used by partner integrations)

interface ThirdPartyProductV1 {
  productId: string;           // stable field names (not 'id')
  productName: string;
  priceUsd: number;
  availableForPurchase: boolean;
  lastUpdated: string;         // ISO-8601
}

// v1 endpoint — never break this for partners
async function getProductV1(productId: string): Promise<ThirdPartyProductV1> {
  const [product, inventory] = await Promise.all([
    catalogService.getProduct(productId),
    inventoryService.getStock(productId),
  ]);

  return {
    productId: product.id,
    productName: product.name,
    priceUsd: product.price.amount,
    availableForPurchase: inventory.stockLevel > 0,
    lastUpdated: product.updatedAt,
  };
}

// When breaking changes are needed: create /api/v2/products/:id
// Keep v1 running for 12+ months with deprecation notice
// Partner BFF team owns the versioning contract independently of services`
    },
  ];

  mistakes: CommonMistake[] = [
    {
      title: 'One BFF per screen/page instead of per client type',
      wrong: `// ProductPageBff, CartPageBff, CheckoutPageBff, DashboardBff — 20 BFFs`,
      right: `// MobileBff, WebBff, ThirdPartyBff — one per client type`,
      explanation: 'BFF per page leads to explosion of BFF services, each with overlapping logic. One BFF per client type is the correct granularity.',
    },
    {
      title: 'Putting business logic in the BFF',
      wrong: `// BFF applies discount rules and calculates final price`,
      right: `// BFF aggregates and shapes — Pricing Service applies business rules`,
      explanation: 'Business logic in the BFF couples the client\'s UX concerns with business rules. BFF should only aggregate, filter, and reshape responses from downstream services.',
    },
    {
      title: 'Backend team owning the BFF',
      wrong: `// Backend team manages mobile BFF — every UI change requires backend ticket`,
      right: `// Frontend/mobile team owns their BFF — they ship UI changes independently`,
      explanation: 'The BFF is an experience API for the frontend. Frontend team ownership means UI iteration speed is not blocked by backend team coordination.',
    },
    {
      title: 'Sequential service calls instead of parallel',
      wrong: `const product = await catalogService.getProduct(id);
const stock = await inventoryService.getStock(id);   // waits for catalog first`,
      right: `const [product, stock] = await Promise.all([
  catalogService.getProduct(id), inventoryService.getStock(id)]);`,
      explanation: 'Sequential calls add latencies together. Parallel calls with Promise.all bring total latency to the slowest single call.',
    },
  ];

  challenge: Challenge = {
    title: 'Build a Mobile BFF for a News App',
    language: 'typescript',
    description: `A news app needs a single endpoint GET /mobile/feed that returns:
- 10 articles (id, headline, thumbnailUrl, publishedAt, category)
- Breaking news flag (boolean — any article published < 1 hour ago)

Downstream services:
- articleService.getLatest(count): returns full Article objects with many fields
- Each article has: id, headline, body, author, images[], publishedAt, category, tags[]

Write the mobile BFF handler.`,
    hints: [
      'Map to slim DTO — mobile only needs 5 fields per article',
      'breakingNews = articles.some(a => Date.now() - new Date(a.publishedAt).getTime() < 3600000)',
      'thumbnailUrl = article.images[0]?.url ?? null',
      'Return { articles: MobileArticle[], hasBreakingNews: boolean }',
    ],
    starterCode: `interface Article {
  id: string; headline: string; body: string; author: string;
  images: Array<{ url: string; alt: string }>; publishedAt: string;
  category: string; tags: string[];
}
interface MobileArticle { id: string; headline: string; thumbnailUrl: string | null; publishedAt: string; category: string; }
interface MobileFeedResponse { articles: MobileArticle[]; hasBreakingNews: boolean; }

const articleService = {
  getLatest: async (count: number): Promise<Article[]> => Array.from({ length: count }, (_, i) => ({
    id: \`a\${i}\`, headline: \`Headline \${i}\`, body: 'Long body text...',
    author: 'Reporter', images: [{ url: \`https://img/\${i}.jpg\`, alt: '' }],
    publishedAt: i === 0 ? new Date(Date.now() - 10 * 60000).toISOString() : new Date(Date.now() - (i + 2) * 3600000).toISOString(),
    category: 'Tech', tags: ['news', 'tech'],
  })),
};

async function getMobileFeed(): Promise<MobileFeedResponse> {
  // TODO
}`,
    solution: `interface Article {
  id: string; headline: string; body: string; author: string;
  images: Array<{ url: string; alt: string }>; publishedAt: string;
  category: string; tags: string[];
}
interface MobileArticle { id: string; headline: string; thumbnailUrl: string | null; publishedAt: string; category: string; }
interface MobileFeedResponse { articles: MobileArticle[]; hasBreakingNews: boolean; }

const articleService = {
  getLatest: async (count: number): Promise<Article[]> => Array.from({ length: count }, (_, i) => ({
    id: \`a\${i}\`, headline: \`Headline \${i}\`, body: 'Long body text...',
    author: 'Reporter', images: [{ url: \`https://img/\${i}.jpg\`, alt: '' }],
    publishedAt: i === 0 ? new Date(Date.now() - 10 * 60000).toISOString() : new Date(Date.now() - (i + 2) * 3600000).toISOString(),
    category: 'Tech', tags: ['news', 'tech'],
  })),
};

async function getMobileFeed(): Promise<MobileFeedResponse> {
  const rawArticles = await articleService.getLatest(10);

  const ONE_HOUR = 60 * 60 * 1000;
  const hasBreakingNews = rawArticles.some(
    a => Date.now() - new Date(a.publishedAt).getTime() < ONE_HOUR
  );

  const articles: MobileArticle[] = rawArticles.map(a => ({
    id: a.id,
    headline: a.headline,
    thumbnailUrl: a.images[0]?.url ?? null,
    publishedAt: a.publishedAt,
    category: a.category,
  }));

  return { articles, hasBreakingNews };
}

getMobileFeed().then(r => {
  console.log('Articles:', r.articles.length);
  console.log('Breaking news:', r.hasBreakingNews);
  console.log('First article fields:', Object.keys(r.articles[0]));
});`,
  };

  quiz: QuizQuestion[] = [
    {
      q: 'What problem does the BFF pattern solve?',
      options: [
        'Service discovery between microservices',
        'A generic API over/under-fetching for different client types',
        'Database connection pooling',
        'Service mesh security policies',
      ],
      answer: 1,
      explanation: 'BFF solves the mismatch between a generic API and diverse client needs — each client type gets an API shaped exactly for its consumption pattern.',
    },
    {
      q: 'Who should own a BFF?',
      options: [
        'The backend infrastructure team',
        'The DBA team',
        'The frontend/mobile team that uses it',
        'The security team',
      ],
      answer: 2,
      explanation: 'Frontend team ownership enables UI iteration without backend coordination. The BFF is an experience API — it should evolve at the speed of the UI, not the backend.',
    },
    {
      q: 'What is the correct granularity for a BFF?',
      options: [
        'One BFF per microservice',
        'One BFF per page or screen',
        'One BFF per client type (mobile, web, third-party)',
        'One shared BFF for all clients',
      ],
      answer: 2,
      explanation: 'One BFF per client type is the standard. Per-page BFFs explode in number; a single shared BFF reverts to the original over/under-fetching problem.',
    },
    { q: 'What problem does the Backend for Frontend (BFF) pattern solve?', options: ['It reduces the number of microservices by merging service responsibilities', 'It creates dedicated backends per client type that aggregate and shape data specifically for each frontend, avoiding a one-size-fits-all general API', 'It moves business logic from the frontend to a dedicated backend layer', 'It provides a caching layer between frontends and core services'], answer: 1, explanation: 'A general API serving web, mobile, and third-party clients must return data suited to all, often returning too much for mobile (wasting bandwidth) or too little for web (requiring multiple calls). BFF creates dedicated backends: a web BFF optimized for the web app data needs, a mobile BFF returning compact responses for bandwidth-constrained clients, and a partner API for third-party integrations. Each BFF aggregates calls to internal services and shapes responses for its specific client. Teams owning the frontend also own the BFF, reducing handoff overhead.' },
    { q: 'What is the difference between BFF and a general API gateway?', options: ['BFF replaces the API gateway entirely in microservices architectures', 'A general API gateway applies shared cross-cutting concerns for all clients; a BFF is a client-specific aggregation layer above that, tailoring responses for one frontend type', 'BFF and API gateway serve identical purposes with different naming conventions', 'BFF handles authentication; API gateway handles routing only'], answer: 1, explanation: 'They serve complementary purposes. The API gateway handles generic concerns: SSL termination, rate limiting, authentication, and routing to internal services. A BFF sits above that (or alongside it) and handles client-specific concerns: aggregating multiple service calls into one composite response for the mobile app, transforming data structures to match the web app component data needs, and exposing operations that match the exact user journeys of a specific client type. Maintain an API gateway for cross-cutting concerns and add BFFs on top for client-specific aggregation.' },
    { q: 'When should you NOT create separate BFFs for each client?', options: ['When the application has more than two client types', 'When the data needs of multiple client types are nearly identical and the overhead of maintaining separate codebases outweighs the benefits of tailored APIs', 'When using GraphQL because GraphQL eliminates the need for BFF', 'When the team is small and cannot staff separate frontend teams'], answer: 1, explanation: 'BFF adds operational overhead: multiple codebases, separate deployments, and duplicated cross-cutting concerns. If a web and mobile client need very similar data, a shared general API may suffice. GraphQL can mitigate the need for BFF by letting clients request exactly the fields they need in a single query. In small teams or simple products, the BFF pattern may over-engineer the API layer. Adopt BFF when clients genuinely have diverging needs, when separate teams own different frontends, or when mobile bandwidth constraints require a fundamentally different response shape.' },
  ];

  qna: QnaItem[] = [
    {
      q: 'Is a BFF the same as an API Gateway?',
      a: 'No. API Gateway: handles cross-cutting concerns (auth, rate limiting, SSL termination, routing) for all clients. BFF: sits behind the gateway, handles aggregation and shaping for one specific client type. They work together — gateway in front, BFF behind.',
    },
    {
      q: 'Should I use GraphQL instead of BFF?',
      a: 'Both solve over/under-fetching but differently. GraphQL: one schema, clients query what they need — great for rapid UI iteration. BFF: separate backends, server-side optimised aggregation — great when different clients have very different performance, security, or versioning requirements. They can be combined: GraphQL as the BFF layer.',
    },
    {
      q: 'How do I avoid the BFF becoming a monolith of aggregation code?',
      a: 'Keep BFFs thin: they aggregate and shape, nothing more. No business logic, no data storage. If aggregation logic is shared across BFFs, extract it to a dedicated aggregation service or use GraphQL federation. Each BFF should be small enough for one frontend team to own.',
    },
    { q: 'Who should own and develop the BFF service?', a: 'The BFF should be owned by the team that owns the frontend it serves. If the mobile team and web team are separate, each owns its BFF. This aligns with the BFF design philosophy: the BFF is the interface layer owned by the consuming team, not the producing services team. The frontend team can evolve the BFF API contract freely without coordination with backend service teams, enabling rapid frontend iteration. The BFF calls backend microservices via their stable APIs. The main risk: if BFF teams duplicate business logic in the BFF rather than pushing it to the appropriate backend services, the BFF becomes a logic-heavy component that is hard to maintain.' },
    { q: 'How does GraphQL serve as an alternative to BFF?', a: 'GraphQL allows clients to specify exactly which fields they need in a query, avoiding over-fetching. Multiple resource types can be fetched in a single request without requiring BFF aggregation. The GraphQL schema becomes a typed contract between backend and frontend. With GraphQL subscriptions, real-time data is also possible. GraphQL partially replaces BFF for data-fetching aggregation but does not handle authentication, rate limiting, caching, or protocol transformation. Some teams use a GraphQL gateway as their BFF layer, combining the flexibility of GraphQL queries with BFF aggregation logic in resolvers. The tradeoff: GraphQL adds complexity for operations teams unfamiliar with it and caching is harder than REST.' },
    { q: 'How do you handle shared logic between multiple BFFs?', a: 'As BFFs proliferate, you risk duplicating authentication handling, error formatting, logging, and retry logic across each one. Strategies: extract shared library code (SDK) containing common patterns and deploy it as an internal package that all BFFs depend on. This creates coupling via the shared library but avoids code duplication. Alternative: move shared concerns into an API gateway layer upstream of all BFFs, so BFFs focus only on aggregation and transformation. A thin, fast gateway handles auth, rate limiting, and observability; BFFs handle only client-specific shaping. Be careful not to let BFFs grow into feature-rich services with their own databases and business logic, which defeats their purpose as lightweight composition layers.' },
  ];

  revision: RevisionSummary = {
    oneLiner: 'BFF is a dedicated API layer per client type — aggregates microservice calls and shapes responses for exactly what mobile, web, or third-party clients need.',
    mustKnow: [
      'One BFF per client type (mobile, web, third-party) — not per page',
      'BFF fans out to services in parallel (Promise.all), combines and shapes results',
      'Frontend team owns the BFF — evolves at UI speed without backend coordination',
      'BFF sits behind the API gateway; gateway handles cross-cutting concerns',
      'No business logic in BFF — aggregation and shaping only',
    ],
    interviewFocus: [
      'What problem does BFF solve that a generic API gateway does not?',
      'Who should own a BFF and why?',
      'Compare BFF vs GraphQL — when would you choose each?',
    ],
  };
}
