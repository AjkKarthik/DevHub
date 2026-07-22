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
  templateUrl: './reservations-apply-before-savings-plans-in-a-best-fit-model.html',
  styleUrl: './reservations-apply-before-savings-plans-in-a-best-fit-model.scss'
})
export class ReservationsApplyBeforeSavingsPlansInABestFitModelSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page says Hybrid Benefit and Reserved Instances "stack independently" — but says nothing about RI vs Savings Plan order when both apply',
      points: [
        'The main page\'s own QnA on Azure Hybrid Benefit states: "Combine AHB with Reserved Instances for maximum savings — they stack independently." This is true for AHB specifically (it reduces the licensing portion, separate from the compute discount), but the main page never addresses what happens when a team has BOTH Reserved Instances AND Azure Savings Plans active — which is common for organizations with a mix of stable and variable workloads.',
        'Without knowing the application order, a genuinely useful question goes unanswered: if a VM is eligible for both an RI discount and a Savings Plan discount in the same hour, which one actually gets consumed — and does it matter which?',
      ]
    },
    {
      heading: 'Confirmed via Microsoft\'s own discount application reference: reservations apply first, and the whole system runs on a "best fit" model',
      points: [
        'Per Microsoft\'s own documentation: "If you have both dynamic and stable workloads, you likely have both savings plans and reservations. Since reservation benefits are more restrictive than savings plans, and usually have greater discounts, Azure applies reservation benefits first." A VM covered by both a compatible RI and an active Savings Plan consumes the RI, not the Savings Plan — automatically, with no configuration needed.',
        'Within a Savings Plan\'s own benefit application (once reservations are accounted for), the system is explicitly greedy: "The benefit is first applied to the product that has the greatest savings plan discount when compared to the equivalent pay-as-you-go rate... The application prioritization is done to ensure that you receive the maximum benefit from your savings plan investment." Each hour, the Savings Plan commitment is spent on whichever eligible usage saves the most money first, then the next-best, until the commitment is exhausted for that hour.',
        'There\'s also a genuinely surprising rate-comparison fallback: "If you\'re operating under an Azure consumption discount (ACD), in rare occasions, you might have some pay-as-you-go rates that are lower than the savings plan rate. In these cases, Azure uses the lower of the two rates." The Savings Plan doesn\'t override a cheaper rate you\'re otherwise entitled to — the billing system always picks whichever is actually cheaper.',
      ]
    },
    {
      heading: 'A real timing nuance that explains "impossible" utilization numbers',
      points: [
        'Per Microsoft\'s own docs: "the billing system incorporates usage arriving up to 48 hours after the given hour. During the sliding 48-hour window, you might see changes to charges, including the possibility of savings plan utilization that\'s greater than 100%." A dashboard briefly showing over-100% utilization isn\'t a bug or a billing error — it\'s the system still reconciling usage data that arrived late, and the number settles once the 48-hour window closes.',
        'When multiple Savings Plans are active with different terms, term length breaks ties in a specific direction: "When you have multiple savings plans with different term lengths, Azure applies the benefits from the three-year plan first." And when scope differs: "If you have multiple savings plans that have different benefit scopes, Azure applies benefits from the more restrictively scoped plan first... to reduce the possibility of waste."',
        'None of this ordering is configurable — it is entirely automatic, which means the practical action for a team isn\'t to try to control the order, but to understand it well enough to correctly interpret their own Cost Analysis views (e.g., not panicking at a temporary >100% utilization figure, or wondering why an RI-covered VM never seems to draw down the Savings Plan commitment).',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'What consumes what, when both are active',
      language: 'bash',
      code: `# Scenario: an org has BOTH an active Reserved Instance (D4s_v3,
# East US, Shared scope) AND an active Azure Savings Plan.
#
# A running D4s_v3 VM in East US this hour:
#
# Per Microsoft's own docs: "Since reservation benefits are more
# restrictive than savings plans, and usually have greater
# discounts, Azure applies reservation benefits first."
#
# -> The RI is consumed for this VM's usage, NOT the Savings Plan.
# -> The Savings Plan commitment for this hour remains available
#    for OTHER eligible usage that has no matching reservation.
#
# No configuration is needed or possible to change this -- it's
# automatic, and it's the beneficial direction (RIs are typically
# both harder to use elsewhere AND deeper-discounted, so consuming
# them first avoids waste).`,
    },
    {
      label: 'Interpreting a temporary >100% utilization reading',
      language: 'bash',
      code: `# Checking Savings Plan utilization mid-month:
az costmanagement query \\
  --type Usage \\
  --scope "/providers/Microsoft.Billing/billingAccounts/{account-id}" \\
  --timeframe MonthToDate

# If a recent hour briefly shows > 100% utilization, this is NOT
# an error -- per Microsoft's own docs: "the billing system
# incorporates usage arriving up to 48 hours after the given hour...
# you might see changes to charges, including the possibility of
# savings plan utilization that's greater than 100%."
#
# The system is still reconciling usage data that arrived late for
# that specific hour. Re-check the same hour's figure after the
# 48-hour window has fully closed before treating it as final --
# checking mid-window will show a moving, sometimes >100% number
# by design, not by mistake.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A finance team reviewing this month\'s Cost Analysis notices that a group of VMs covered by an active Reserved Instance never appear to draw down the organization\'s separate Azure Savings Plan commitment, even though those VMs would clearly qualify for the Savings Plan discount too. They assume this is a configuration bug — the Savings Plan should be "protecting" the RI-covered spend as a backup. Is this actually a bug?',
    hint: 'Check Microsoft\'s own documented order of discount application when both a Reserved Instance and a Savings Plan could apply to the same usage.',
    solution: 'This is not a bug — it\'s the documented, automatic behavior. Per Microsoft\'s own discount application reference, "Since reservation benefits are more restrictive than savings plans, and usually have greater discounts, Azure applies reservation benefits first." Usage covered by a compatible, active Reserved Instance consumes the RI benefit, not the Savings Plan — the Savings Plan commitment for that hour is left available for other eligible usage that has no matching reservation. This is intentional, since RIs are both narrower in scope and typically deeper-discounted, so consuming them first before falling back to the more flexible Savings Plan avoids wasting either benefit. There\'s nothing to configure to change this ordering.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'When a VM is covered by both an active Reserved Instance and a Savings Plan, an administrator needs to configure which discount applies, or risk double-billing or a conflict.',
      reality: 'Per this subtopic\'s theory, the order is entirely automatic and not configurable — Microsoft\'s own documentation states reservations apply first specifically because they are "more restrictive... and usually have greater discounts," with no setup required.'
    },
    {
      thought: 'A Savings Plan dashboard briefly showing utilization greater than 100% indicates a billing error or a misconfigured commitment amount.',
      reality: 'Per this subtopic\'s theory, Microsoft\'s own documentation describes this as expected, temporary behavior — the billing system incorporates usage arriving "up to 48 hours after the given hour," and figures settle to their true value once that reconciliation window closes.'
    },
    {
      thought: 'A Savings Plan discount is always applied over the plain pay-as-you-go rate, regardless of what other discount arrangements (like an Azure consumption discount) might otherwise apply.',
      reality: 'Per this subtopic\'s theory, Microsoft\'s own documentation states the opposite for the rare case where a pay-as-you-go rate under an Azure consumption discount is actually lower than the Savings Plan rate: "Azure uses the lower of the two rates" — the system always picks whichever rate is cheaper for that usage.'
    }
  ];
}
