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
  templateUrl: './feature-flag-comment-named-the-wrong-migrated-feature.html',
  styleUrl: './feature-flag-comment-named-the-wrong-migrated-feature.scss'
})
export class FeatureFlagCommentNamedTheWrongMigratedFeatureSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'Three methods, three different migration states — but one comment names the wrong one',
      points: [
        'The "Facade with Feature Flags" codeTab\'s <code>OrderServiceFacade</code> shows THREE methods, each at a different point in the migration: <code>placeOrder()</code> checks a <code>\'new-order-placement\'</code> feature flag and can go either way; <code>getOrder()</code> is hard-coded to always call the new system ("already fully migrated," per its own comment); <code>cancelOrder()</code> is hard-coded to always call legacy ("not yet migrated," per its own comment).',
        'Immediately below the class, a trailing comment describes a day-by-day rollout ramp — 0% on Day 1, ramping to 100% by Day 21 — and its last line originally read "Day 21: 100% → retire legacy cancel code."',
        'But <code>cancelOrder()</code> has NO feature-flag check anywhere in its body — there is no mechanism in the code for it to ramp from 0% to 100% at all. The only method that actually has a flag-driven ramp mechanism is <code>placeOrder()</code>, checking <code>\'new-order-placement\'</code>. The comment named the wrong feature.',
      ]
    },
    {
      heading: 'Why this specific mismatch is easy to introduce and easy to miss',
      points: [
        'The comment block is written in fully generic terms for its first four lines (percentages and day numbers that would apply to migrating ANY feature) — only the very last line names a specific feature, which makes it easy for that one word to drift out of sync with the actual code above it as the example evolves.',
        'A reader\'s eye naturally treats "the comment right after the class" as documentation OF the class as a whole, not specifically of one method within it — so a mismatch between which method the ramp actually applies to and which method the comment names is not an immediate visual red flag.',
        'The fix is not to add a feature flag to <code>cancelOrder()</code> (that would overcomplicate a minimal illustrative example, and the class\'s own comments deliberately show three DIFFERENT migration states side by side) — the fix is making the trailing comment describe the ramp that is ACTUALLY shown in the code: <code>placeOrder()</code>\'s <code>\'new-order-placement\'</code> flag.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'The mismatch, side by side',
      language: 'typescript',
      code: `class OrderServiceFacade {
  constructor(
    private legacyOrders: LegacyOrderSystem,
    private newOrders: NewOrderService,
    private features: FeatureFlagService,
  ) {}

  // HAS a flag -- this is the method that can actually ramp 0% -> 100%
  async placeOrder(cmd: PlaceOrderCommand): Promise<OrderResult> {
    if (await this.features.isEnabled('new-order-placement', cmd.userId)) {
      return this.newOrders.placeOrder(cmd);
    }
    return this.legacyOrders.placeOrder(cmd);
  }

  // NO flag -- already fully migrated, nothing left to ramp
  async getOrder(orderId: string): Promise<Order> {
    return this.newOrders.getOrder(orderId);
  }

  // NO flag -- migration for this feature hasn't started yet
  async cancelOrder(orderId: string, reason: string): Promise<void> {
    return this.legacyOrders.cancelOrder(orderId, reason);
  }
}

// BEFORE -- the trailing comment named a feature with no ramp mechanism
// Day 1:  0% traffic to new system (dark launch -- log only)
// Day 7:  5% traffic to new system
// Day 14: 25% -> watch error rates and latency
// Day 21: 100% -> retire legacy cancel code        <-- cancelOrder() has
//                                                       no flag at all!

// AFTER -- the comment now describes the ramp that actually exists
// Feature flag config -- incremental rollout for 'new-order-placement'
// (the SAME flag placeOrder() checks above -- cancelOrder() has no flag
// yet, since it hasn't started migrating)
// Day 1:  0% traffic to new system (dark launch -- log only)
// Day 7:  5% traffic to new system
// Day 14: 25% -> watch error rates and latency
// Day 21: 100% -> retire legacy order-placement code`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A teammate reads the original comment and concludes: "So cancelOrder() must have a feature flag somewhere I\'m not seeing — the comment says it ramps from 0% to 100%." Is that a reasonable conclusion from reading the class alone?',
    hint: 'Does the comment DESCRIBE code that exists, or does it just happen to be text sitting near the class?',
    solution: 'It is a reasonable conclusion to draw FROM THE COMMENT, but it would be wrong about the actual code -- and that gap is exactly the problem. Reading <code>cancelOrder()</code>\'s own body shows a single, unconditional call to <code>this.legacyOrders.cancelOrder(...)</code> with no <code>if</code>, no <code>this.features.isEnabled(...)</code> check, nothing that could ramp traffic at all. A comment describing a rollout ramp for a method that has no ramping mechanism is actively misleading -- a reader trusting the comment over the code would go looking for a flag check that does not exist. This is exactly why the fix corrects the COMMENT to match the CODE (the <code>placeOrder()</code> method, which really does have the described mechanism) rather than leaving a comment that describes behavior the code does not implement.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'A comment placed directly after a class, without being attached to any specific method, is understood as general documentation and does not need to correspond to one particular method\'s behavior.',
      reality: 'Per this subtopic\'s theory, a rollout-ramp comment naming a specific feature IS making a claim about that feature\'s migration mechanism — if the named feature\'s method has no flag check at all, the comment is not general documentation, it is simply inaccurate.'
    },
    {
      thought: 'Since placeOrder(), getOrder(), and cancelOrder() are three methods on the same class, they are all at roughly the same point in the migration.',
      reality: 'Per this subtopic\'s theory, the three methods are deliberately shown at three DIFFERENT migration states — flagged-and-ramping, fully-migrated, and not-yet-started — which is exactly why a rollout comment needs to specify precisely which one it is describing.'
    },
    {
      thought: 'The right fix for a mismatched migration comment is to add the missing feature-flag mechanism to the method the comment names.',
      reality: 'Per this subtopic\'s theory, adding a flag to cancelOrder() would overcomplicate an intentionally minimal example showing three migration states side by side — the simpler, correct fix is making the comment describe the mechanism that is actually shown in the code.'
    }
  ];
}
