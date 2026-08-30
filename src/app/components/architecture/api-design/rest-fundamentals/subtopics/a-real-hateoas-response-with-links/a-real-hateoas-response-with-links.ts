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
    heading: 'Described in Detail — Never Actually Built in Any codeTab',
    points: [
      'The main page’s own QnA describes a HATEOAS response precisely: <code>GET /orders/123</code> returning links like <code>rel=cancel href=/orders/123/cancel</code> and <code>rel=payment href=/orders/123/payment</code>. Neither of the page’s two codeTabs — both plain REST endpoints — ever return anything resembling this.',
      'The point of HATEOAS is that the LINKS THEMSELVES encode what actions are currently valid, given the resource’s current state — a client doesn’t hard-code "orders can be cancelled," it just checks whether a <code>cancel</code> link is present in the response it already received.',
      'This is the concrete mechanism behind the main page’s own Richardson Maturity Model quiz question — Level 3 specifically means the response body carries this affordance information, not just correct HTTP verbs and status codes (Level 2, where most production APIs actually stop).',
    ],
  },
];

const codeTabs: CodeTab[] = [
  {
    label: 'A HATEOAS Response — Links That Change With State',
    language: 'typescript',
    code: `interface Order {
  id: string;
  status: 'pending' | 'paid' | 'shipped' | 'cancelled';
  total: number;
}

interface HalLink { href: string; method: string; }

// The links object is BUILT FROM the order's own current status --
// not a fixed list every response includes regardless of state.
function buildOrderLinks(order: Order): Record<string, HalLink> {
  const links: Record<string, HalLink> = {
    self: { href: \`/orders/\${order.id}\`, method: 'GET' },
  };

  // Only a PENDING order can still be cancelled or paid --
  // a client following links never needs to separately know this
  // business rule; the presence (or absence) of the link IS the rule.
  if (order.status === 'pending') {
    links['cancel'] = { href: \`/orders/\${order.id}/cancel\`, method: 'POST' };
    links['payment'] = { href: \`/orders/\${order.id}/payment\`, method: 'POST' };
  }

  // A PAID order can be shipped -- a different action becomes
  // available as the resource moves through its own lifecycle.
  if (order.status === 'paid') {
    links['ship'] = { href: \`/orders/\${order.id}/ship\`, method: 'POST' };
  }

  return links;
}

app.get('/orders/:id', authenticate, async (req, res) => {
  const order = await db.orders.findById(req.params.id);
  if (!order) return res.status(404).json({ error: 'Order not found' });

  res.json({
    id: order.id,
    status: order.status,
    total: order.total,
    _links: buildOrderLinks(order),
  });
});

// GET /orders/123 (status: pending) -->
// { id: '123', status: 'pending', total: 49.99, _links: {
//     self:    { href: '/orders/123', method: 'GET' },
//     cancel:  { href: '/orders/123/cancel', method: 'POST' },
//     payment: { href: '/orders/123/payment', method: 'POST' } } }

// GET /orders/123 (status: shipped) -->
// { id: '123', status: 'shipped', total: 49.99,
//   _links: { self: { href: '/orders/123', method: 'GET' } } }
// -- no cancel/payment/ship link at all; a shipped order genuinely
// has none of those actions available, and the RESPONSE says so.`,
  },
];

const exercise: TryItExercise = {
  prompt:
    'A client built WITHOUT HATEOAS hard-codes: "if <code>order.status === \'pending\'</code>, show a Cancel button; call POST /orders/:id/cancel when clicked." A client built WITH HATEOAS instead checks: "if <code>response._links.cancel</code> exists, show a Cancel button; POST to <code>response._links.cancel.href</code> when clicked." The backend later adds a NEW rule — orders can also be cancelled within 1 hour of being marked <code>shipped</code>, not just while <code>pending</code>. Which client needs a code change to correctly show the Cancel button for this new case?',
  hint: 'Where does each client’s Cancel-button logic actually live — inside the client’s own code, or entirely inside <code>buildOrderLinks</code>?',
  solution: `// The hard-coded client needs a code change — its own logic
// ("pending means cancellable") is now WRONG and out of date; it has
// to be updated, tested, and redeployed to correctly show Cancel for
// a recently-shipped order too.

// The HATEOAS client needs ZERO code changes. Its own logic never
// encoded ANY business rule about which statuses are cancellable --
// it just asks "does this response's _links object have a cancel
// entry." The actual business rule ("pending, OR shipped within the
// last hour") lives entirely inside buildOrderLinks on the SERVER --
// updating that one function is enough for every HATEOAS-following
// client to immediately, correctly reflect the new rule on their
// very next request, with no client-side deploy at all.

// This is the concrete payoff behind the main page's own QnA
// description ("clients do not need to hard-code URLs or know the
// API structure in advance") -- it's not really about the URLs
// themselves, it's about WHERE the business logic for "what's
// currently allowed" is allowed to live: centralized on the server,
// or duplicated into every client that needs to know it.`,
};

const misconceptions: Misconception[] = [
  {
    thought: 'HATEOAS just means including a few extra convenience links (like a "self" link) in the response — it’s mostly cosmetic.',
    reality: 'A self-link alone is not what makes an API HATEOAS — the defining property is that the SET of links present changes based on the resource’s current STATE, and those links represent the actions genuinely available RIGHT NOW. The codeTab above shows a <code>pending</code> order and a <code>shipped</code> order returning completely different link sets from the exact same endpoint, driven entirely by <code>order.status</code>.',
  },
  {
    thought: 'A HATEOAS client still needs to know the URL structure in advance — it just gets the links pre-filled instead of building them itself.',
    reality: 'The whole point is the OPPOSITE — a correctly-built HATEOAS client never constructs a URL from scratch at all. It follows whatever <code>href</code> the server provides in <code>_links</code>, which means the server could restructure its own URL scheme entirely (e.g. <code>/orders/123/cancel</code> becoming <code>/order-actions/123/cancel</code>) and a link-following client keeps working with no changes, since it never hard-coded the URL shape.',
  },
  {
    thought: 'Since most production APIs stop at Richardson Maturity Level 2 (as the main page’s own quiz explanation notes), HATEOAS is mostly a theoretical, rarely-useful concept.',
    reality: 'It genuinely is less common in practice — the main page’s own QnA says as much — but that’s a statement about ADOPTION cost (client-side complexity of following links dynamically), not about whether the underlying idea is useful. The Try It above demonstrates a concrete, real payoff (a server-side business rule change needing zero client deploys) that Level 2 APIs — correct verbs and status codes, but a fixed, hard-coded response shape — cannot offer at all.',
  },
];

@Component({
  selector: 'app-api-rest-fundamentals-hateoas',
  standalone: true,
  imports: [CommonModule, SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent,
    CodeBlockComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './a-real-hateoas-response-with-links.html',
  styleUrl: './a-real-hateoas-response-with-links.scss',
})
export class ARealHateoasResponseWithLinksSubtopic {
  theory = theory;
  codeTabs = codeTabs;
  exercise = exercise;
  misconceptions = misconceptions;
}
