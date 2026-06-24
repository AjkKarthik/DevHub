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
