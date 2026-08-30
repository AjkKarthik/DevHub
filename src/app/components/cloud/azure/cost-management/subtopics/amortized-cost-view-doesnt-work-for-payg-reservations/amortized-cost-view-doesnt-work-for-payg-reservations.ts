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
  templateUrl: './amortized-cost-view-doesnt-work-for-payg-reservations.html',
  styleUrl: './amortized-cost-view-doesnt-work-for-payg-reservations.scss'
})
export class AmortizedCostViewDoesntWorkForPaygReservationsSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page recommends Amortised cost as the correct view for budgeting, with no exception noted',
      points: [
        'The main page\'s own QnA states: "Use Amortised cost for budgeting, planning, and trend analysis; use Actual cost for finance reconciliation against invoices." This reads as universal advice — whichever billing arrangement you\'re on, pick Amortised for planning.',
        'For one specific, not-uncommon billing setup, that advice silently fails to do anything useful: the Amortised view exists in the UI and can be selected, but it doesn\'t actually amortize anything.',
      ]
    },
    {
      heading: 'Confirmed via Microsoft\'s own Cost Analysis reference: Amortized cost is a no-op for reservations bought on pay-as-you-go',
      points: [
        'Per Microsoft\'s own documentation: "Although you can buy a reservation with a pay-as-you-go (MS-AZR-0003P) subscription, Cost Analysis doesn\'t support viewing amortized reservation costs. If you try to view costs with the Amortized cost metric, you\'ll see the same results as Actual Cost." Selecting Amortised in this scenario doesn\'t error, and doesn\'t warn you — it silently renders identically to the Actual view, upfront cost spike and all.',
        'This directly undermines the exact use case the main page recommends Amortised cost for: "a $12,000/year RI appears as $1,000/month" — that smoothing simply doesn\'t happen for a pay-as-you-go-purchased reservation. The dashboard will still show a large one-time spike in the purchase month, the same distortion Amortised view is supposed to eliminate.',
        'This matters specifically because pay-as-you-go is a completely legitimate, common way to buy Reserved Instances — a team without an Enterprise Agreement or Microsoft Customer Agreement can and does purchase RIs this way, and would have no reason to suspect their chosen "budgeting view" isn\'t actually doing its job.',
      ]
    },
    {
      heading: 'What to actually do if you\'re on pay-as-you-go and need a smoothed monthly view',
      points: [
        'Since the portal\'s own Amortised toggle doesn\'t help here, the practical workaround is manual: take the RI\'s known upfront cost and term length, and spread it yourself in whatever planning spreadsheet or dashboard consumes Cost Management\'s exported data — the underlying math Amortised view would have done is simple (total cost ÷ term months), it just needs to happen outside the portal for this billing type.',
        'Before purchasing a Reserved Instance for budgeting-clarity reasons specifically, it\'s worth checking which offer type the subscription is actually on — this same limitation doesn\'t apply to Enterprise Agreement or Microsoft Customer Agreement subscriptions, so an organization for whom smooth monthly reporting genuinely matters may have a real reason to prefer purchasing under one of those billing relationships instead of pay-as-you-go.',
        'This is a narrower gap than it might first appear — it affects the Cost Analysis UI\'s own Amortised toggle specifically for RIs on pay-as-you-go; it does not affect Savings Plans (a different purchase mechanism) or the underlying invoice data itself, which still correctly reflects what was actually charged.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Checking your subscription\'s offer type before relying on Amortised view',
      language: 'bash',
      code: `# Check the offer type of a subscription -- MS-AZR-0003P indicates
# pay-as-you-go, the specific offer type affected by this gap:
az account show --subscription <subscription-id> --query "{name:name, id:id}" -o table

# Cross-reference against the offer code list to confirm PAYG:
# https://azure.microsoft.com/support/legal/offer-details/
# (MS-AZR-0003P = Pay-As-You-Go)

# If a reservation was purchased under this offer type, per
# Microsoft's own docs: "Cost Analysis doesn't support viewing
# amortized reservation costs. If you try to view costs with the
# Amortized cost metric, you'll see the same results as Actual Cost."`,
    },
    {
      label: 'Manually smoothing the cost when the portal view can\'t',
      language: 'bash',
      code: `# Example: a $12,000 1-year RI purchased on pay-as-you-go.
# Cost Analysis's own Amortised toggle will NOT spread this --
# it shows the full $12,000 spike in the purchase month, same as
# Actual cost.

# Manual smoothing for a planning spreadsheet/dashboard:
# monthly_amortized_cost = total_ri_cost / term_months
# = 12000 / 12
# = 1000  # per month, for reporting purposes only

# Export the raw usage data to compute this yourself downstream:
az costmanagement export create \\
  --name ri-cost-export \\
  --scope "/subscriptions/{subscription-id}" \\
  --schedule-status Active \\
  --schedule-recurrence Monthly \\
  --storage-account-id /subscriptions/{sub}/resourceGroups/rg/providers/Microsoft.Storage/storageAccounts/costsa \\
  --storage-container costs
# Process the exported CSV/Parquet in Power BI or a script to apply
# the amortization math the portal's own toggle can't for this
# offer type.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A small team on a pay-as-you-go Azure subscription purchases a 1-year Reserved Instance and, following the main page\'s own advice, switches Cost Analysis to the Amortised cost view expecting to see the RI cost spread evenly across 12 months. Instead, they still see the full purchase amount as a single spike in the first month, identical to what Actual cost shows. Is the Amortised toggle broken?',
    hint: 'Check whether Cost Analysis\'s Amortised cost view has a documented exception for reservations purchased under a specific subscription offer type.',
    solution: 'The toggle isn\'t broken — this is documented, expected behavior for this specific billing arrangement. Per Microsoft\'s own Cost Analysis documentation: "Although you can buy a reservation with a pay-as-you-go (MS-AZR-0003P) subscription, Cost Analysis doesn\'t support viewing amortized reservation costs. If you try to view costs with the Amortized cost metric, you\'ll see the same results as Actual Cost." Reservations purchased under an Enterprise Agreement or Microsoft Customer Agreement don\'t have this limitation. Since the portal can\'t amortize this specific case, the team needs to compute the smoothed monthly figure themselves (total cost ÷ term months) for their own planning dashboards, using Cost Management\'s exported usage data as the source.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'Switching Cost Analysis to the Amortised cost view always spreads a Reserved Instance\'s upfront cost evenly across its term, regardless of how the reservation was purchased.',
      reality: 'Per this subtopic\'s theory, Microsoft\'s own documentation states this specifically fails for reservations purchased under a pay-as-you-go subscription — the Amortised view silently renders identically to Actual cost in that case, with the full upfront spike still showing in the purchase month.'
    },
    {
      thought: 'If the Amortised cost view isn\'t smoothing a reservation\'s cost as expected, it must be a bug or a temporary Cost Management data-processing delay.',
      reality: 'Per this subtopic\'s theory, this is documented, permanent behavior tied to the subscription\'s offer type (pay-as-you-go specifically) — not a bug, and not something that resolves itself over time or with a delay.'
    },
    {
      thought: 'This Amortised-view limitation for pay-as-you-go reservations also affects Azure Savings Plans, since they\'re a similar commitment-based discount mechanism.',
      reality: 'Per this subtopic\'s theory, this specific gap is documented only for Reserved Instances purchased under pay-as-you-go — Savings Plans are a different purchase mechanism and aren\'t described as sharing this same limitation.'
    }
  ];
}
