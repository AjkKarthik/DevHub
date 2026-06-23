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
  selector: 'app-arch-strangler-fig',
  standalone: true,
  imports: [CommonModule, PageMetaComponent, QuickRefComponent, TheoryBlockComponent,
    CodeBlockComponent, CommonMistakesComponent, ChallengeBlockComponent, QuizBlockComponent,
    QnaBlockComponent, RevisionCardComponent, PageCompleteComponent],
  templateUrl: './strangler-fig.html',
  styleUrl: './strangler-fig.scss',
})
export class ArchStranglerFig {

  quickRef: QuickRefItem[] = [
    { name: 'Strangler Fig', type: 'keyword', desc: 'Incrementally replace a legacy system by routing traffic to new implementations feature by feature' },
    { name: 'Facade', type: 'keyword', desc: 'Routing layer that intercepts requests and directs them to old or new system based on feature flags' },
    { name: 'Feature Flag', type: 'keyword', desc: 'Runtime switch controlling which system handles a request — enables gradual rollout' },
    { name: 'Traffic Routing', type: 'keyword', desc: 'The mechanism for directing requests — URL rewriting, API gateway rules, or proxy logic' },
    { name: 'Dark Launch', type: 'keyword', desc: 'Route traffic to the new system but discard results — verify behaviour without user impact' },
    { name: 'Parallel Run', type: 'keyword', desc: 'Run old and new systems simultaneously, compare outputs, before cutting over' },
    { name: 'Cutover', type: 'keyword', desc: 'The moment traffic is fully shifted to the new system; legacy is retired' },
  ];

  theory: TheoryPoint[] = [
    {
      heading: 'The Pattern — Named After a Tropical Vine',
      points: [
        'Martin Fowler named this after the strangler fig tree: it grows around an existing tree, slowly surrounding it until the old tree dies and the fig stands alone.',
        'The pattern: add a facade/proxy in front of the legacy system. Route new implementations through the facade incrementally.',
        'The legacy system lives on, serving requests for features not yet migrated. New system handles migrated features.',
        'Over time, the new system takes on more and more responsibility. When migration is complete, the facade is removed and the legacy retired.',
      ],
    },
    {
      heading: 'Migration Steps',
      points: [
        'Step 1 — Facade: add a routing layer in front of the legacy. All traffic passes through it; legacy handles everything initially.',
        'Step 2 — Identify: choose one cohesive feature to migrate first (not the most complex, not the most critical).',
        'Step 3 — Build: implement the feature in the new system. Dark launch or parallel run to validate correctness.',
        'Step 4 — Route: use a feature flag to start sending real traffic to the new implementation. Ramp from 0% to 100%.',
        'Step 5 — Retire: delete the legacy feature code once traffic is at 100% and has been stable.',
        'Step 6 — Repeat: next feature. Continue until the legacy is empty.',
      ],
    },
    {
      heading: 'Risk Management',
      points: [
        'Never do a big-bang rewrite. The Strangler Fig keeps both systems live — you can roll back any feature at any time.',
        'Feature flag rollback: if the new implementation has bugs, switch the flag back to legacy in seconds.',
        'Parallel run: run both systems and compare responses — catch discrepancies before users are affected.',
        'Data migration: the hardest part. Strategies: dual-write to both systems during migration, backfill from legacy, eventual data sync.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Facade with Feature Flags',
      language: 'typescript',
      code: `// FACADE — routing layer between clients and systems
class OrderServiceFacade {
  constructor(
    private legacyOrders: LegacyOrderSystem,
    private newOrders: NewOrderService,
    private features: FeatureFlagService,
  ) {}

  // Place order — routing controlled by feature flag
  async placeOrder(cmd: PlaceOrderCommand): Promise<OrderResult> {
    if (await this.features.isEnabled('new-order-placement', cmd.userId)) {
      return this.newOrders.placeOrder(cmd);
    }
    return this.legacyOrders.placeOrder(cmd);
  }

  // Get order — already fully migrated, always uses new system
  async getOrder(orderId: string): Promise<Order> {
    return this.newOrders.getOrder(orderId);
  }

  // Cancel order — still on legacy (not yet migrated)
  async cancelOrder(orderId: string, reason: string): Promise<void> {
    return this.legacyOrders.cancelOrder(orderId, reason);
  }
}

// Feature flag config — incremental rollout
// Day 1:  0% traffic to new system (dark launch — log only)
// Day 7:  5% traffic to new system
// Day 14: 25% → watch error rates and latency
// Day 21: 100% → retire legacy cancel code`
    },
    {
      label: 'Parallel Run for Validation',
      language: 'typescript',
      code: `// Parallel Run — run both systems, compare results, only return legacy result
async function parallelRunPlaceOrder(cmd: PlaceOrderCommand): Promise<OrderResult> {
  const [legacyResult, newResult] = await Promise.allSettled([
    legacyOrders.placeOrder(cmd),
    newOrders.placeOrder(cmd),    // shadow call — result discarded for now
  ]);

  // Log discrepancies for analysis
  if (legacyResult.status === 'fulfilled' && newResult.status === 'fulfilled') {
    if (legacyResult.value.orderId !== newResult.value.orderId) {
      // IDs differ (expected) — compare status and total
      if (legacyResult.value.status !== newResult.value.status ||
          legacyResult.value.total !== newResult.value.total) {
        logger.warn('Parallel run discrepancy', {
          legacy: legacyResult.value,
          new: newResult.value,
          cmd,
        });
      }
    }
  } else if (newResult.status === 'rejected') {
    logger.error('New system failed in parallel run', { error: newResult.reason });
  }

  // Always return legacy result during parallel run
  if (legacyResult.status === 'fulfilled') return legacyResult.value;
  throw legacyResult.reason;
}`
    },
    {
      label: 'API Gateway Routing',
      language: 'bash',
      code: `# API Gateway (NGINX/YARP) — route by path to old or new system
# During migration: /api/orders/place → new system, all else → legacy

# NGINX config — strangler routing
server {
  location /api/orders/place {
    # New service handles order placement
    proxy_pass http://new-order-service:8080;
  }

  location /api/orders/status {
    # New service handles status queries (migrated week 2)
    proxy_pass http://new-order-service:8080;
  }

  location /api/orders/ {
    # Everything else still goes to legacy
    proxy_pass http://legacy-order-system:3000;
  }
}

# As each feature is migrated, add a new location block
# pointing to the new service. Legacy block shrinks gradually.
# Final state: remove all legacy location blocks + legacy service.`
    },
  ];

  mistakes: CommonMistake[] = [
    {
      title: 'Not having a facade — direct integration of new and legacy',
      wrong: `// Some endpoints call new service, some call legacy — different clients call different systems`,
      right: `// All clients talk to the facade; facade routes to old or new transparently`,
      explanation: 'Without a facade, clients must know which system to call and must be updated as migration progresses. The facade makes migration invisible to clients.',
    },
    {
      title: 'Migrating too fast without validation',
      wrong: `// Jump from 0% to 100% on day 1 without parallel run or gradual ramp`,
      right: `// Dark launch → 1% → 5% → 25% → 100%, with error rate monitoring at each step`,
      explanation: 'Gradual rollout with monitoring catches bugs before they affect all users. A fast cutover with bugs requires a full rollback to the legacy system.',
    },
    {
      title: 'Leaving the migration open-ended indefinitely',
      wrong: `// Strangler Fig migration started 2 years ago — legacy and new both still live`,
      right: `// Set a migration deadline; each feature gets a 2–4 week window; retire legacy code after cutover`,
      explanation: 'Indefinite dual-system operation doubles maintenance burden. Set hard deadlines for each feature migration and retire legacy code immediately after cutover.',
    },
    {
      title: 'Not migrating data alongside the code',
      wrong: `// New service reads data from its own DB but legacy data is never moved — split-brain`,
      right: `// Dual-write during migration; backfill historical data; verify consistency before cutover`,
      explanation: 'The new service needs access to historical data. Plan data migration as part of each feature migration — not as a separate phase at the end.',
    },
  ];

  challenge: Challenge = {
    title: 'Implement a Strangler Facade for Product Search',
    language: 'typescript',
    description: `A legacy e-commerce system has a searchProducts function.
A new ElasticSearch-based service is being built to replace it.

1. Create a SearchFacade that routes between legacy and new based on a feature flag.
2. Simulate the legacy: returns products filtered by name substring.
3. Simulate the new: returns products sorted by relevance score.
4. Toggle the flag to demonstrate both paths.`,
    hints: [
      'Feature flag: a simple boolean in this simulation',
      'Legacy: Array.filter on name includes query',
      'New: sort by relevance (simulated as score field)',
      'Facade: check flag, call appropriate system',
    ],
    starterCode: `interface Product { id: string; name: string; score?: number; }
const catalog: Product[] = [
  { id: '1', name: 'Widget Pro', score: 0.9 },
  { id: '2', name: 'Basic Widget', score: 0.6 },
  { id: '3', name: 'Gadget Plus', score: 0.8 },
];

// TODO: legacySearch(query: string): Product[]
// TODO: newSearch(query: string): Product[]
// TODO: SearchFacade class with search(query) method`,
    solution: `interface Product { id: string; name: string; score?: number; }
const catalog: Product[] = [
  { id: '1', name: 'Widget Pro', score: 0.9 },
  { id: '2', name: 'Basic Widget', score: 0.6 },
  { id: '3', name: 'Gadget Plus', score: 0.8 },
];

function legacySearch(query: string): Product[] {
  return catalog.filter(p => p.name.toLowerCase().includes(query.toLowerCase()));
}

function newSearch(query: string): Product[] {
  return catalog
    .filter(p => p.name.toLowerCase().includes(query.toLowerCase()))
    .sort((a, b) => (b.score ?? 0) - (a.score ?? 0));
}

class SearchFacade {
  private useNewSearch = false;

  setFlag(enabled: boolean) { this.useNewSearch = enabled; }

  search(query: string): Product[] {
    return this.useNewSearch ? newSearch(query) : legacySearch(query);
  }
}

const facade = new SearchFacade();
console.log('Legacy:', facade.search('widget').map(p => p.name));
// ['Widget Pro', 'Basic Widget'] (insertion order)
facade.setFlag(true);
console.log('New:', facade.search('widget').map(p => p.name));
// ['Widget Pro', 'Basic Widget'] (sorted by score: 0.9, 0.6)`,
  };

  quiz: QuizQuestion[] = [
    {
      q: 'What is the core mechanism of the Strangler Fig pattern?',
      options: [
        'Rewriting the entire legacy system at once',
        'A facade routes traffic to legacy or new system; migration happens feature by feature',
        'Database migration from old to new schema',
        'Deprecating APIs without replacement',
      ],
      answer: 1,
      explanation: 'The Strangler Fig uses a routing facade to direct traffic incrementally — legacy handles unmigrated features while new system handles migrated ones.',
    },
    {
      q: 'What is a Parallel Run in the context of the Strangler Fig?',
      options: [
        'Running two legacy systems simultaneously',
        'Calling both old and new systems for the same request, comparing outputs without exposing new results to users',
        'A performance benchmark between systems',
        'A blue/green deployment strategy',
      ],
      answer: 1,
      explanation: 'Parallel Run: call both systems, compare results, return legacy result. Validates new system correctness without user-facing risk.',
    },
    {
      q: 'What is the biggest risk of not having a migration deadline?',
      options: [
        'Database growth',
        'Indefinite dual-system maintenance that doubles operational burden',
        'Network latency increases',
        'API versioning conflicts',
      ],
      answer: 1,
      explanation: 'Without a deadline, legacy and new systems coexist indefinitely — two codebases to maintain, two deployment pipelines, two monitoring setups. Set hard migration deadlines.',
    },
  ];

  qna: QnaItem[] = [
    {
      q: 'What is the difference between Strangler Fig and Blue/Green deployment?',
      a: 'Blue/Green: swap the entire system at once between two identical environments. Strangler Fig: incrementally migrate feature by feature — both systems coexist, handling different features. Blue/Green is a deployment strategy; Strangler Fig is a system modernisation strategy.',
    },
    {
      q: 'How do you handle data migration with the Strangler Fig?',
      a: 'Three strategies: (1) Dual-write — new system writes to both old and new DB during migration. (2) Shared DB — new and legacy share the DB temporarily. (3) Event sourcing — replay events to populate the new system\'s DB. Whichever strategy: verify data consistency with automated comparison before cutting over.',
    },
    {
      q: 'Can Strangler Fig be used for microservices decomposition?',
      a: 'Yes — the most common use case is extracting microservices from a monolith. Facade (API gateway or reverse proxy) routes requests. Extract one service at a time. The monolith continues handling unmigrated functionality. Eventually the monolith is hollowed out and retired.',
    },
  ];

  revision: RevisionSummary = {
    oneLiner: 'Strangler Fig replaces a legacy system incrementally — a facade routes traffic feature by feature until the new system handles everything and the legacy is retired.',
    mustKnow: [
      'Facade: routing layer that directs traffic to legacy or new based on feature flags',
      'Migrate feature by feature — never big-bang rewrite',
      'Parallel run: shadow-call new system, compare outputs, validate before cutover',
      'Gradual rollout: 0% → 5% → 25% → 100% with error monitoring at each step',
      'Set migration deadlines; retire legacy code immediately after 100% cutover',
    ],
    interviewFocus: [
      'Explain the Strangler Fig pattern — how is it different from a big-bang rewrite?',
      'What is a Parallel Run and why is it useful?',
      'How do you handle data migration during a Strangler Fig?',
    ],
  };
}
