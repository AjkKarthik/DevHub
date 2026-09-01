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
    heading: 'Two Functions, Same Underlying Ratio, Different Category Sets',
    points: [
      'The main page has TWO separate functions that both categorize the exact same underlying value (budget consumed as a ratio) into named status buckets, but they don’t agree on the category set: <code>calculateSloStatus()</code> uses three states — <code>healthy</code>, <code>at-risk</code> (≥ 0.8 consumed), <code>exhausted</code> (≥ 1.0) — while the Challenge’s <code>errorBudgetStatus()</code> uses four — <code>healthy</code>, <code>at-risk</code> (≥ 0.5), <code>critical</code> (≥ 0.8), <code>exhausted</code> (> 1.0).',
      'Neither is "wrong" in isolation — both are legitimate, defensible category schemes a real team might choose. But a reader who reads BOTH codeTabs on the same page, in sequence, has no way to know whether the page intends these as two genuinely different models, or whether one is simply an earlier draft the other superseded.',
      'The Challenge’s own four-state model maps more directly onto the page’s own mistake block (which already frames error-budget policy as multiple graduated tiers: "Budget > 50%: release freely... Budget 10-50%: review risky changes... Budget < 10%: freeze non-critical deployments") — a genuine four-tier policy needs a four-state classifier to drive it, which is exactly the gap between the two functions this subtopic closes.',
    ],
  },
];

const codeTabs: CodeTab[] = [
  {
    label: 'A Reconciled, Four-State calculateSloStatus',
    language: 'typescript',
    code: `interface SloConfig { target: number; windowDays: number; }
interface SloStatusV2 {
  remainingBudgetMinutes: number;
  consumedPercent: number;
  burnRate: number;
  status: 'healthy' | 'at-risk' | 'critical' | 'exhausted'; // now matches errorBudgetStatus()
}

function calculateSloStatusV2(config: SloConfig, currentSuccessRate: number): SloStatusV2 {
  const windowMinutes = config.windowDays * 24 * 60;
  const allowedErrorRate = 1 - config.target;
  const actualErrorRate  = 1 - currentSuccessRate;
  const totalBudgetMinutes = windowMinutes * allowedErrorRate;
  const consumedRate       = actualErrorRate / allowedErrorRate;
  const remainingBudgetMinutes = totalBudgetMinutes * (1 - Math.min(consumedRate, 1));
  const burnRate = actualErrorRate / allowedErrorRate;

  // Thresholds now match the Challenge's errorBudgetStatus() exactly.
  const status: SloStatusV2['status'] =
    consumedRate > 1.0  ? 'exhausted' :
    consumedRate >= 0.8 ? 'critical'  :
    consumedRate >= 0.5 ? 'at-risk'   : 'healthy';

  return { remainingBudgetMinutes, consumedPercent: consumedRate * 100, burnRate, status };
}

// Verified across the same four category-representative inputs the
// (now-fixed) Challenge uses:
console.log(calculateSloStatusV2({ target: 0.999, windowDays: 30 }, 0.9997)); // healthy
console.log(calculateSloStatusV2({ target: 0.999, windowDays: 30 }, 0.9994)); // at-risk
console.log(calculateSloStatusV2({ target: 0.999, windowDays: 30 }, 0.9991)); // critical
console.log(calculateSloStatusV2({ target: 0.999, windowDays: 30 }, 0.998));  // exhausted
// -> healthy, at-risk, critical, exhausted -- both functions on the page
//    now agree on both the category SET and the exact same input's
//    classification.`,
  },
];

const exercise: TryItExercise = {
  prompt:
    'The main page’s own mistake block describes a THREE-tier error budget policy in its "right" example (release freely > 50%; review risky changes 10-50%; freeze < 10%). Map each of the reconciled function’s FOUR status categories onto this THREE-tier policy — which two statuses should trigger the SAME policy action?',
  hint: 'The mistake block’s tiers are based on how much budget REMAINS (50%, 10%), while the reconciled function’s categories are based on how much has been CONSUMED — convert one to the other first (consumed = 1 - remaining), then line up the boundaries.',
  solution: `// Mistake block's remaining-based tiers, converted to consumed-based:
//   > 50% remaining  == < 50% consumed  -> "release freely"
//   10-50% remaining == 50-90% consumed -> "review risky changes"
//   < 10% remaining  == > 90% consumed  -> "freeze non-critical deployments"
//
// Mapping the reconciled function's four categories onto these three tiers:
//   'healthy'   (< 50% consumed)        -> "release freely"
//   'at-risk'   (50-80% consumed)       -> "review risky changes"
//   'critical'  (80-100% consumed)      -> "review risky changes" too --
//     both 'at-risk' and 'critical' fall inside the mistake block's single
//     10-50%-remaining (50-90%-consumed) tier, since 'critical' only goes
//     up to 100% consumed (90% remaining boundary), not exactly 90%
//     consumed -- so 'critical' straddles the tier boundary slightly.
//   'exhausted' (> 100% consumed)       -> "freeze non-critical deployments"
//
// The real, useful finding: the mistake block's THREE tiers and the
// reconciled function's FOUR categories don't cleanly nest -- 'critical'
// (80-100% consumed) doesn't map onto a single mistake-block tier, since
// the mistake block's own middle tier boundary (90% consumed) falls
// INSIDE the 'critical' range (80-100%), not at one of its edges. A team
// adopting both models as-is would need to either merge 'at-risk' and
// 'critical' into one tier, or split the mistake block's middle tier at
// the 80%/90% consumed boundaries to match -- they can't both stay
// exactly as written without a small policy decision resolving the gap.`,
};

const misconceptions: Misconception[] = [
  {
    thought: 'Having two different category-count models for the same underlying ratio on the same page is a bug that needs to be resolved by deleting one of them.',
    reality: 'Both models are individually valid design choices — a 3-state and a 4-state classifier are both defensible ways to bucket a continuous ratio. The actual gap is that the page never RECONCILES them or explains they’re deliberately different; a reader has no signal for whether this is intentional variety or an oversight.',
  },
  {
    thought: 'Reconciling two category models just means picking whichever one has more categories and using it everywhere.',
    reality: 'The Try It above demonstrates the reconciliation is not free — mapping the reconciled 4-category model onto the page’s own 3-tier policy language reveals a genuine boundary mismatch (the "critical" category straddles the mistake block’s own 50%-remaining tier boundary) that has to be explicitly resolved with a real decision, not just a naming exercise.',
  },
  {
    thought: 'Since burn rate and consumed-percent are mathematically identical in this function (as established in the previous subtopic), the THRESHOLDS used to categorize them should also be identical across every function on the page that uses either value.',
    reality: 'The main page’s own multi-window alerting section uses a COMPLETELY DIFFERENT threshold scale for burn rate (page at 14×, ticket at 1×) than either status function’s consumed-percent thresholds (0.5, 0.8, 1.0) — these are two genuinely different use cases (real-time alerting sensitivity vs. a coarse status summary for a dashboard), not the same threshold family expressed two ways.',
  },
];

@Component({
  selector: 'app-obs-sli-slo-sla-reconcile-status',
  standalone: true,
  imports: [CommonModule, SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent,
    CodeBlockComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './reconciling-two-different-status-category-models.html',
  styleUrl: './reconciling-two-different-status-category-models.scss',
})
export class ReconcilingTwoDifferentStatusCategoryModelsSubtopic {
  theory = theory;
  codeTabs = codeTabs;
  exercise = exercise;
  misconceptions = misconceptions;
}
