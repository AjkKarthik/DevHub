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

const quickRef: QuickRefItem[] = [
  { name: 'HATEOAS',    type: 'keyword', desc: 'Hypermedia As The Engine Of Application State — responses include links to valid next actions.' },
  { name: '_links',     type: 'keyword', desc: 'HAL convention: a _links object containing rel → href mappings in the response body.' },
  { name: 'rel',        type: 'keyword', desc: 'Link relation — describes the relationship between the current resource and the target (self, next, cancel).' },
  { name: 'HAL',        type: 'keyword', desc: 'Hypertext Application Language — a simple JSON media type with _links and _embedded.' },
  { name: 'JSON:API',   type: 'keyword', desc: 'Opinionated hypermedia spec with type, id, attributes, relationships, links, and included.' },
  { name: 'Richardson Maturity', type: 'keyword', desc: 'Model grading REST maturity: Level 0 (swamp of POX), 1 (resources), 2 (HTTP verbs), 3 (hypermedia).' },
];

const theory: TheoryPoint[] = [
  {
    heading: 'What is HATEOAS?',
    points: [
      'HATEOAS (Hypermedia As The Engine Of Application State) is the 4th constraint of the REST Uniform Interface: responses include links to the valid next actions a client can take.',
      'The idea: a client starts at a known entry point (e.g., GET /), follows links in responses to discover all available actions — similar to browsing a website by clicking links.',
      'A client using HATEOAS does not need to hard-code URLs. It starts at the root and navigates by following rels (link relations). If the server changes a URL, clients following links adapt automatically.',
      'In practice: most production APIs include SOME links (pagination next/prev, self references) without implementing full HATEOAS. Pure HATEOAS is rare outside academic APIs.',
    ],
  },
  {
    heading: 'Richardson Maturity Model',
    points: [
      'Level 0: "Swamp of POX (Plain Old XML)" — single URI endpoint, all operations are POST, XML payload with action field. SOAP-style.',
      'Level 1: Resources — multiple URIs, each identifying a resource. Still all-POST or single-method. Better organization but not REST.',
      'Level 2: HTTP Verbs — uses GET/POST/PUT/PATCH/DELETE correctly, status codes, standard headers. This is where most "REST APIs" live.',
      'Level 3: Hypermedia — Level 2 + HATEOAS links in responses. The purist definition of REST. The client discovers capabilities by following links.',
      'Getting to Level 2 is the practical goal. Level 3 adds discoverability but requires significant client support to benefit from it.',
    ],
  },
  {
    heading: 'HAL — Hypertext Application Language',
    points: [
      'HAL is a simple, widely used hypermedia format. Media type: application/hal+json.',
      '_links: an object mapping relation names to link objects { href, title?, type?, templated? }. The "self" rel always points to the current resource.',
      '_embedded: an object of embedded related resources, avoiding additional round trips. E.g., embed the order items in the order response.',
      'HAL is the most commonly adopted hypermedia format for REST APIs — GitHub API, PayPal API use HAL-inspired responses.',
    ],
  },
  {
    heading: 'Practical Hypermedia',
    points: [
      'Even without full HATEOAS, partial hypermedia adds real value: pagination links (next, prev, first, last) save clients from constructing URLs.',
      'Self link: every response should include a self link pointing to the canonical URI of the resource — useful for caching and canonical URL discovery.',
      'State-conditional links: only include links that are valid in the current state. An "cancel" link only appears on orders with status "pending". Clients know which actions are available without hardcoding state machines.',
      'Link templating (RFC 6570): use URI templates for parameterized links. E.g., "/users/{id}/orders{?status,page}" allows clients to expand the template.',
    ],
  },
];

const codeTabs: CodeTab[] = [
  {
    label: 'HAL Response',
    language: 'typescript',
    code: `// HAL-style HATEOAS response
interface HalLink { href: string; title?: string; templated?: boolean; }
interface HalLinks { [rel: string]: HalLink | HalLink[]; }

function buildOrderResponse(order: Order, baseUrl: string) {
  const links: HalLinks = {
    self:     { href: \`\${baseUrl}/orders/\${order.id}\` },
    customer: { href: \`\${baseUrl}/users/\${order.customerId}\` },
    items:    { href: \`\${baseUrl}/orders/\${order.id}/items\` },
  };

  // State-conditional links — only include valid transitions
  if (order.status === 'pending') {
    links['cancel'] = { href: \`\${baseUrl}/orders/\${order.id}/cancel\`, title: 'Cancel Order' };
    links['pay']    = { href: \`\${baseUrl}/orders/\${order.id}/payments\`, title: 'Pay for Order' };
  }
  if (order.status === 'shipped') {
    links['track']  = { href: order.trackingUrl, title: 'Track Shipment' };
    links['return'] = { href: \`\${baseUrl}/orders/\${order.id}/returns\`, title: 'Return Order' };
  }

  return {
    id: order.id,
    status: order.status,
    total: order.total,
    createdAt: order.createdAt,
    _links: links,
    _embedded: {
      items: order.items.map(item => ({
        ...item,
        _links: { product: { href: \`\${baseUrl}/products/\${item.productId}\` } },
      })),
    },
  };
}

// Response for a pending order:
// {
//   "id": "ord_42",
//   "status": "pending",
//   "total": 99.99,
//   "_links": {
//     "self":   { "href": "/orders/ord_42" },
//     "cancel": { "href": "/orders/ord_42/cancel" },
//     "pay":    { "href": "/orders/ord_42/payments" }
//   }
// }`,
  },
  {
    label: 'Pagination Links',
    language: 'typescript',
    code: `// Partial HATEOAS — pagination links (very common practice)
app.get('/users', async (req, res) => {
  const page  = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 20;
  const baseUrl = \`\${req.protocol}://\${req.get('host')}\`;

  const [users, total] = await Promise.all([
    db.users.findMany({ skip: (page - 1) * limit, take: limit }),
    db.users.count(),
  ]);

  const pages = Math.ceil(total / limit);
  const buildUrl = (p: number) => \`\${baseUrl}/users?page=\${p}&limit=\${limit}\`;

  res.json({
    data: users.map(u => ({
      ...u,
      _links: {
        self:   { href: \`\${baseUrl}/users/\${u.id}\` },
        orders: { href: \`\${baseUrl}/users/\${u.id}/orders\` },
      },
    })),
    pagination: { page, limit, total, pages },
    _links: {
      self:  { href: buildUrl(page) },
      first: { href: buildUrl(1) },
      last:  { href: buildUrl(pages) },
      ...(page > 1    && { prev: { href: buildUrl(page - 1) } }),
      ...(page < pages && { next: { href: buildUrl(page + 1) } }),
    },
  });
});`,
  },
];

const mistakes: CommonMistake[] = [
  {
    title: 'Hard-coding API URLs in client code instead of following links',
    wrong: `// Client hard-codes every URL — breaks when server restructures
const ordersUrl = \`https://api.example.com/v1/users/\${userId}/orders\`;`,
    right: `// Start at root, follow links — server controls URL structure
const root = await fetch('https://api.example.com/');
const usersUrl = root._links.users.href;
const user = await fetch(usersUrl + '/' + userId);
const ordersUrl = user._links.orders.href;`,
    explanation: 'Hard-coding URLs couples clients to server URL structure. When the server reorganizes URLs (a new version, restructuring), all hard-coded clients break. Following links from a known entry point allows the server to change URLs without breaking clients.',
  },
  {
    title: 'Including links for unavailable actions (state-agnostic links)',
    wrong: `// Always includes cancel — even for shipped orders
_links: { self: {...}, cancel: {...} } // cancel is invalid for shipped orders`,
    right: `// Only include links valid in the current state
_links: {
  self: {...},
  ...(order.status === 'pending' && { cancel: {...} }),
  ...(order.status === 'shipped' && { track: {...} }),
}`,
    explanation: 'Hypermedia links should reflect valid state transitions. Including a "cancel" link on a shipped order forces clients to discover validity by attempting the action and handling 409. State-conditional links encode the state machine in the response — clients know what\'s possible without extra requests.',
  },
  {
    title: 'No self link on resources',
    wrong: `// Response has no canonical URL reference
{ id: 42, name: 'Alice', email: 'a@example.com' }`,
    right: `{ id: 42, name: 'Alice', email: 'a@example.com',
  _links: { self: { href: '/users/42' } }
}`,
    explanation: 'The self link is the minimal useful hypermedia addition. It tells the client the canonical URL of the resource — useful for caching, bookmarking, updating, and sharing. Every resource in a response should include a self link.',
  },
  {
    title: 'Confusing HATEOAS with just adding a "links" field',
    wrong: `// Adds a "links" key but it's not machine-processable
{ data: {...}, links: "See /docs/orders for related endpoints" }`,
    right: `// Machine-readable link objects with rel and href
{ data: {...}, _links: { self: { href: '/orders/42' }, cancel: { href: '/orders/42/cancel' } } }`,
    explanation: 'Hypermedia links must be machine-readable structured objects that clients can follow programmatically. Free-text documentation URLs don\'t qualify. Each link needs a relation (rel) that identifies its semantic meaning and an href the client can request.',
  },
];

const challenge: Challenge = {
  title: 'HAL Link Builder',
  language: 'typescript',
  description: `Implement buildHalLinks(resourceId: string, status: 'pending' | 'paid' | 'shipped' | 'cancelled'): object that returns _links for an order:
- Always include: self (/orders/{id}), customer (/orders/{id}/customer), items (/orders/{id}/items)
- If status is 'pending': also include cancel (/orders/{id}/cancel) and pay (/orders/{id}/payments)
- If status is 'shipped': also include track (/orders/{id}/tracking) and return (/orders/{id}/returns)
- Other statuses: only the base links`,
  hints: [
    'Start with the always-present links',
    'Add conditional links based on status using spread syntax',
  ],
  starterCode: `function buildHalLinks(resourceId: string, status: 'pending' | 'paid' | 'shipped' | 'cancelled') {
  // TODO: build _links object
  return {};
}`,
  solution: `function buildHalLinks(resourceId: string, status: 'pending' | 'paid' | 'shipped' | 'cancelled') {
  const base = \`/orders/\${resourceId}\`;
  const links: Record<string, { href: string }> = {
    self:     { href: base },
    customer: { href: \`\${base}/customer\` },
    items:    { href: \`\${base}/items\` },
  };

  if (status === 'pending') {
    links['cancel'] = { href: \`\${base}/cancel\` };
    links['pay']    = { href: \`\${base}/payments\` };
  } else if (status === 'shipped') {
    links['track']  = { href: \`\${base}/tracking\` };
    links['return'] = { href: \`\${base}/returns\` };
  }

  return { _links: links };
}

console.log(buildHalLinks('42', 'pending'));  // includes cancel + pay
console.log(buildHalLinks('42', 'shipped'));  // includes track + return
console.log(buildHalLinks('42', 'paid'));     // only base links`,
};

const quiz: QuizQuestion[] = [
  {
    q: 'What does the "rel" in a HATEOAS link represent?',
    options: [
      'The relative URL path of the linked resource',
      'The link relation — the semantic relationship between the current resource and the target',
      'The reliability score of the linked endpoint',
      'Whether the link is relative or absolute',
    ],
    answer: 1,
    explanation: 'The "rel" (relation) describes the semantic meaning of the link — what the target resource is relative to the current resource. Common rels: "self" (canonical URL), "next"/"prev" (pagination), "cancel" (a valid state transition). Clients use the rel to decide which link to follow.',
  },
  {
    q: 'Which Richardson Maturity Model level do most production REST APIs achieve?',
    options: [
      'Level 0 — single endpoint, all POST',
      'Level 1 — multiple resource URIs',
      'Level 2 — proper HTTP verbs and status codes',
      'Level 3 — full HATEOAS with hypermedia links',
    ],
    answer: 2,
    explanation: 'Most production APIs reach Level 2: multiple resource URIs, correct HTTP methods (GET/POST/PUT/DELETE), and standard status codes. Level 3 (HATEOAS) requires client support for link following and is rarely implemented in full, though partial hypermedia (pagination links, self links) is common.',
  },
];

const qna: QnaItem[] = [
  {
    q: 'Is HATEOAS worth implementing in practice?',
    a: 'Full HATEOAS — where clients discover all URLs by following links from a root endpoint — is rarely worth the effort for internal or mobile APIs. The benefits (URL independence, self-describing) only pay off if clients actually follow links instead of hard-coding URLs, which requires discipline and tooling. However, <strong>partial hypermedia</strong> has clear practical value: pagination links (next/prev) save clients from constructing URLs; state-conditional links encode valid transitions without out-of-band docs; self links enable caching. Start with pagination links and self links — that\'s ~80% of the benefit at ~20% of the complexity.',
  },
  {
    q: 'What is the difference between HAL, JSON:API, and Siren?',
    a: '<strong>HAL</strong> (application/hal+json): simple — adds <code>_links</code> and <code>_embedded</code> to any JSON response. Minimal learning curve. Most widely adopted. <strong>JSON:API</strong> (application/vnd.api+json): opinionated and comprehensive — standardizes resource type, id, attributes, relationships, included, links, and meta. Excellent for complex resource graphs. Popular with Ember.js and some Ruby APIs. <strong>Siren</strong>: more complex — models resources as entities with actions (methods, fields) as well as links. Closest to a complete application protocol. Rarely seen outside academic contexts. Pick HAL for simplicity; JSON:API for complex multi-resource responses.',
  },
];

const revision: RevisionSummary = {
  oneLiner: 'HATEOAS responses include links to valid next actions — Richardson Level 3; HAL uses _links with rel→href; state-conditional links encode valid transitions; self link is the minimum useful addition.',
  mustKnow: [
    'HATEOAS: responses carry _links so clients discover actions rather than hard-coding URLs',
    'Richardson Level 2 (HTTP verbs + status codes) is where most production APIs live',
    'HAL: _links { self, next, custom-rel } + _embedded { related resources }',
    'State-conditional links: only include rels valid for the current resource state',
    'Self link on every resource response is the minimal valuable hypermedia addition',
    'Pagination links (next, prev, first, last) are the most commonly adopted HATEOAS feature',
  ],
  interviewFocus: [
    'What is HATEOAS and what problem does it solve?',
    'What are the 4 levels of the Richardson Maturity Model?',
    'What is a link relation (rel) and why is it important?',
  ],
};

@Component({
  selector: 'app-api-hateoas',
  standalone: true,
  imports: [CommonModule, PageMetaComponent, QuickRefComponent, TheoryBlockComponent,
    CodeBlockComponent, CommonMistakesComponent, ChallengeBlockComponent,
    QuizBlockComponent, QnaBlockComponent, RevisionCardComponent, PageCompleteComponent],
  templateUrl: './hateoas-hypermedia.html',
  styleUrl: './hateoas-hypermedia.scss',
})
export class ApiHateoas {
  quickRef = quickRef; theory = theory; codeTabs = codeTabs;
  mistakes = mistakes; challenge = challenge; quiz = quiz; qna = qna; revision = revision;
}
