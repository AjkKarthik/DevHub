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
  templateUrl: './is-has-breaking-news-business-logic-in-the-bff.html',
  styleUrl: './is-has-breaking-news-business-logic-in-the-bff.scss'
})
export class IsHasBreakingNewsBusinessLogicInTheBffSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The page\'s own principle, and its own Challenge, in tension',
      points: [
        'The mistakes block is unambiguous about the boundary: "Putting business logic in the BFF" is wrong — its example is a BFF computing discount rules and a final price. The fix given is: "BFF aggregates and shapes — Pricing Service applies business rules."',
        'The Challenge\'s own reference solution computes <code>hasBreakingNews</code> directly inside the BFF handler: <code>rawArticles.some(a => Date.now() - new Date(a.publishedAt).getTime() < ONE_HOUR)</code> — a hardcoded one-hour threshold, decided and applied entirely within the BFF\'s own code.',
        '"Breaking news" is not an intrinsic property of an article the way its headline or publish timestamp is — it is a CLASSIFICATION derived by applying a business-chosen rule (the threshold) to raw data. That is structurally the same shape as the discount-calculation example the mistakes block calls out as wrong, just with a much smaller, less consequential rule.',
      ]
    },
    {
      heading: 'A useful test for "is this business logic:" does the rule need to change independently of the UI?',
      points: [
        'Ask: could the editorial team decide "breaking" should mean 30 minutes instead of 60, or should vary by category (financial news moves faster than lifestyle content), WITHOUT the mobile app itself needing to change? If yes, that decision belongs somewhere the editorial/backend team can change it without redeploying the BFF — which means it is a business rule, not pure response shaping.',
        'Contrast this with something the Challenge\'s own solution ALSO does that is clearly fine: mapping <code>a.images[0]?.url ?? null</code> to <code>thumbnailUrl</code>. "Use the first image as the thumbnail" is a MOBILE UI DECISION (how this client wants to display the data), not a business rule an editorial team would ever need to adjust independently — that is legitimate response shaping, squarely within the BFF\'s job.',
        'Applying the same test to <code>hasBreakingNews</code>: the ONE-HOUR THRESHOLD is exactly the kind of value a product/editorial decision could reasonably change without the mobile app changing at all — which is the signal that it does not belong hardcoded inside the BFF.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Where the threshold actually belongs',
      language: 'typescript',
      code: `// AS WRITTEN -- threshold hardcoded directly in the BFF
async function getMobileFeed(): Promise<MobileFeedResponse> {
  const rawArticles = await articleService.getLatest(10);

  const ONE_HOUR = 60 * 60 * 1000;   // <-- a business decision, hardcoded here
  const hasBreakingNews = rawArticles.some(
    a => Date.now() - new Date(a.publishedAt).getTime() < ONE_HOUR
  );

  const articles = rawArticles.map(a => ({
    id: a.id, headline: a.headline,
    thumbnailUrl: a.images[0]?.url ?? null,   // <-- this one IS fine: pure shaping
    publishedAt: a.publishedAt, category: a.category,
  }));

  return { articles, hasBreakingNews };
}

// MOVED -- the article/content service now decides what counts as
// breaking, exactly the way the Pricing Service decides discounts in
// the page's own mistakes-block example. The BFF just relays the flag.
interface Article {
  id: string; headline: string; body: string; author: string;
  images: Array<{ url: string; alt: string }>; publishedAt: string;
  category: string; tags: string[];
  isBreaking: boolean;   // <-- the content service now computes this,
}                         //     using whatever threshold/rule it owns

async function getMobileFeedFixed(): Promise<MobileFeedResponse> {
  const rawArticles = await articleService.getLatest(10);   // now includes isBreaking

  // Pure aggregation -- no threshold, no business rule, just relaying
  // a decision the content service already made
  const hasBreakingNews = rawArticles.some(a => a.isBreaking);

  const articles = rawArticles.map(a => ({
    id: a.id, headline: a.headline,
    thumbnailUrl: a.images[0]?.url ?? null,
    publishedAt: a.publishedAt, category: a.category,
  }));

  return { articles, hasBreakingNews };
}

// The editorial team can now change what "breaking" means -- a
// different threshold, a category-specific rule, a manual editorial
// override -- entirely inside the content service, with ZERO changes
// to any BFF, mobile or otherwise.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A teammate argues: "The discount-calculation example in the mistakes block is obviously wrong because it involves MONEY — hasBreakingNews is just a harmless boolean flag, so the comparison doesn\'t really apply." Is the size or consequence of the business rule what makes something "business logic," or is it something else?',
    hint: 'Does the mistakes block\'s own explanation say the problem is the FINANCIAL STAKES, or does it say something about WHERE business rules should live regardless of what they compute?',
    solution: 'It is something else -- the mistakes block\'s own explanation is about WHERE a rule lives, not how consequential it is: "Business logic in the BFF couples the client\'s UX concerns with business rules. BFF should only aggregate, filter, and reshape responses from downstream services." Nothing in that reasoning depends on money being involved. A one-hour "breaking news" threshold and a discount percentage are structurally the same kind of thing -- both are business-owned classification rules applied to raw data, both could reasonably change independently of the client UI, and both currently live inside the BFF rather than in a service that owns the decision. The teammate\'s distinction (money vs. not-money) does not track the actual test the page\'s own explanation describes -- "could this rule change without the client needing to change" is what determines whether something is business logic, regardless of how high the stakes are.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'Business logic in a BFF is only a problem when it involves something consequential, like pricing or discounts — a small derived boolean flag like hasBreakingNews does not count.',
      reality: 'Per this subtopic\'s theory, the page\'s own mistakes-block reasoning is about WHERE a rule lives (coupling client UX code to business rules), not about how consequential the rule is — a one-hour threshold and a discount calculation are the same category of problem at different scales.'
    },
    {
      thought: 'Any calculation performed inside a BFF handler counts as business logic and should be moved out.',
      reality: 'Per this subtopic\'s theory, response shaping (like picking the first image as a thumbnail) is legitimate BFF work — the distinguishing test is whether the rule could reasonably change independently of the client UI, not whether any computation happens at all.'
    },
    {
      thought: 'Fixing hasBreakingNews requires the BFF to make an extra network call to some other service, adding real latency and complexity for a minor issue.',
      reality: 'Per this subtopic\'s theory, the fix is for the content service the BFF ALREADY calls to include the isBreaking flag in its existing response — no new call, no new round trip, just moving where the classification decision is made.'
    }
  ];
}
