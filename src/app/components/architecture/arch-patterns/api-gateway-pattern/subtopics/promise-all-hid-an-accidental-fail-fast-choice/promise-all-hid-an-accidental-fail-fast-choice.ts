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
  templateUrl: './promise-all-hid-an-accidental-fail-fast-choice.html',
  styleUrl: './promise-all-hid-an-accidental-fail-fast-choice.scss'
})
export class PromiseAllHidAnAccidentalFailFastChoiceSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The code made exactly the choice the theory warns against making by accident',
      points: [
        'The page\'s own theory states: "if one of several aggregated backend calls fails or times out, the gateway must decide whether to fail the entire request or degrade gracefully by returning partial data, a design decision that should be explicit rather than accidental."',
        'The "Request Aggregation" code example directly below that theory used <code>Promise.all([...])</code> to fan out the three service calls — but <code>Promise.all</code> has a specific, well-defined behavior: if ANY of the promises passed to it rejects, the ENTIRE <code>Promise.all</code> call rejects immediately, discarding whatever the other calls would have returned, even if they later succeed.',
        'That means the ORIGINAL example silently made the "fail the entire request" choice — a single slow or broken <code>userService.getProfile()</code> call would take down the whole dashboard response, including the orders and products data that fetched successfully — without the code ever acknowledging that\'s the tradeoff it picked. The page has been corrected to add a comment naming this explicitly.',
      ]
    },
    {
      heading: 'Why this is a self-contained catch — no external research needed',
      points: [
        '<code>Promise.all</code>\'s fail-fast behavior isn\'t a subtle edge case — it\'s the FIRST thing most JavaScript references say about it, and it\'s the reason <code>Promise.allSettled</code> exists as a separate, deliberately different function.',
        'The catch here didn\'t require checking any external source — it just required reading the page\'s OWN two adjacent sections (a theory bullet and its accompanying code example) against each other and noticing the code didn\'t actually implement what the theory said was a deliberate decision to make.',
        'This is the same category of self-contained finding as several others in this hub: not a fact that needed fact-checking, but an internal contradiction between what a page CLAIMS its own example demonstrates and what the example actually does.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Same 3 calls, two different failure-handling choices',
      language: 'typescript',
      code: `// FAIL-FAST -- Promise.all(): any single rejection takes down the WHOLE response
async function getDashboardFailFast(userId: string): Promise<DashboardResponse> {
  const [orders, products, profile] = await Promise.all([
    orderService.getRecentOrders(userId),
    catalogService.getFeaturedProducts(),
    userService.getProfile(userId),   // if THIS one fails...
  ]);
  // ...orders and products are discarded too, even though they succeeded.
  return { recentOrders: orders.slice(0, 5), featuredProducts: products.slice(0, 10), userProfile: profile };
}

// GRACEFUL DEGRADATION -- Promise.allSettled(): every call's outcome is
// reported individually, success or failure, nothing is discarded
async function getDashboardGraceful(userId: string): Promise<Partial<DashboardResponse>> {
  const results = await Promise.allSettled([
    orderService.getRecentOrders(userId),
    catalogService.getFeaturedProducts(),
    userService.getProfile(userId),
  ]);

  const [ordersResult, productsResult, profileResult] = results;

  return {
    recentOrders: ordersResult.status === 'fulfilled' ? ordersResult.value.slice(0, 5) : undefined,
    featuredProducts: productsResult.status === 'fulfilled' ? productsResult.value.slice(0, 10) : undefined,
    userProfile: profileResult.status === 'fulfilled' ? profileResult.value : undefined,
    // A failed userProfile call no longer discards the orders/products that
    // succeeded -- the client gets a PARTIAL dashboard instead of an error page.
  };
}`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A gateway aggregation function uses Promise.all to fan out calls to the orders, catalog, and recommendations services. The recommendations service has a known intermittent 2% failure rate; orders and catalog are both highly reliable. What happens to a dashboard request roughly 2% of the time, and is that necessarily the wrong choice?',
    hint: 'Promise.all does not distinguish between "critical" and "optional" calls -- it treats every promise in the array identically.',
    solution: 'Roughly 2% of dashboard requests fail ENTIRELY -- including the reliable orders and catalog data -- purely because the much-less-critical recommendations call happened to fail that time. Whether that\'s "wrong" depends on whether recommendations are actually essential to the page: if recommendations are a nice-to-have widget, failing the whole dashboard over them is very likely the wrong tradeoff, and Promise.allSettled (returning partial data, recommendations omitted) would serve users far better. If ALL three pieces of data are genuinely required for the page to make sense, fail-fast might be the right, deliberate choice -- the point of this subtopic isn\'t that Promise.all is always wrong, it\'s that the choice needs to be made ON PURPOSE, matched to which calls are actually critical, rather than defaulting to whichever function happened to get used first.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'Promise.all and Promise.allSettled are basically interchangeable ways to run several async calls in parallel.',
      reality: 'Per this subtopic\'s theory, they have fundamentally different failure semantics — Promise.all rejects the whole batch on any single failure, while Promise.allSettled always resolves with each call\'s individual outcome, success or failure.'
    },
    {
      thought: 'If a page\'s theory section states a design principle, its accompanying code example can be assumed to actually follow that principle.',
      reality: 'Per this subtopic\'s theory, this specific page\'s own code example initially did NOT follow the "should be explicit" principle its own theory stated one paragraph earlier — code and theory need to be checked against each other, not assumed consistent just because they\'re adjacent.'
    },
    {
      thought: 'Using Promise.all in a gateway aggregation example is a bug that always needs fixing to Promise.allSettled.',
      reality: 'Per this subtopic\'s theory, Promise.all can be the RIGHT choice when every aggregated call is genuinely required — the actual problem was the choice being made silently/accidentally, not the specific function chosen.'
    }
  ];
}
