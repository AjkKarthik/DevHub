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
  templateUrl: './savings-plans-have-no-cancellation-or-resale-exit.html',
  styleUrl: './savings-plans-have-no-cancellation-or-resale-exit.scss'
})
export class SavingsPlansHaveNoCancellationOrResaleExitSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page shows a $45,000 stranded-commitment mistake, but never explains WHY that money can\'t be recovered',
      points: [
        'The main page\'s own mistake entry #4 states plainly: "Bought 3-year All-Upfront Compute SP based on peak usage. Company downsized 30% — stuck with 30% unused commitment. $45,000 committed capital earning no return." — a real, severe financial risk shown without any explanation of the underlying mechanism that makes it unrecoverable.',
        'The main page\'s own theory two sections earlier states Standard RIs "Can be sold on the RI Marketplace if unused" — creating an implicit but never-stated contrast: is the same exit path available for an over-committed Savings Plan? The main page never says.',
      ]
    },
    {
      heading: 'Savings Plans genuinely have no exit path at all — no cancellation, and no marketplace, unlike Standard RIs',
      points: [
        'AWS states this directly and unconditionally: "Savings Plans offer lower prices compared to On-Demand pricing in exchange for a commitment, and can\'t be cancelled during the term." Once purchased, the $/hour commitment is locked in for the full 1- or 3-year term with no early-exit mechanism at all — not even a partial one.',
        'The Reserved Instance Marketplace the main page references is explicitly scoped to a narrow subset of RIs only: per AWS\'s own documentation, "Only Amazon EC2 Standard regional and zonal Reserved Instances can be sold in the Reserved Instance Marketplace" — Convertible RIs are also excluded ("Amazon EC2 Convertible Reserved Instances can\'t be sold in the Reserved Instance Marketplace"), and Savings Plans are not eligible for this marketplace at all; no equivalent marketplace for Savings Plans exists anywhere in AWS.',
        'This means the main page\'s own $45,000 scenario has genuinely NO recovery mechanism once purchased — not a discounted resale, not a partial cancellation, not an exchange. The only two actions available to the team at that point are to keep paying the committed rate for the remainder of the term, or to grow other usage (e.g. onboard new workloads) enough to consume the unused portion of the commitment before the term ends.',
        'This sharpens WHY the main page\'s own fix ("Use 1-year No-Upfront first; buy to cover MINIMUM baseline only... Add coverage incrementally as usage is proven stable") is the only real defense — since there is no exit door once committed, the discipline has to happen entirely BEFORE purchase, not after.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Standard RI — a real exit path exists',
      language: 'bash',
      code: `# Team over-purchased Standard RIs, usage dropped -- list the
# unused reservations for resale on the RI Marketplace
aws ec2 describe-reserved-instances \\
  --filters Name=state,Values=active \\
  --query 'ReservedInstances[?InstanceCount>\`0\`]'

aws ec2 create-reserved-instances-listing \\
  --reserved-instances-id ri-1234567890abcdef0 \\
  --instance-count 10 \\
  --price-schedules 'Term=8,Price=120.00,CurrencyCode=USD' \\
                     'Term=4,Price=60.00,CurrencyCode=USD'
# Per AWS's own docs, ONLY Standard regional/zonal RIs are eligible
# -- AWS charges a 12% service fee of the upfront price, but the
# team recovers real cash for capacity it no longer needs.`,
    },
    {
      label: 'Compute Savings Plan — no equivalent command exists',
      language: 'bash',
      code: `# Team over-committed to a 3-year All-Upfront Compute Savings Plan,
# usage dropped 30% -- there is no cancel/sell command to run:

# aws savingsplans delete-queued-savings-plan --savings-plan-id ...
# -- this ONLY works for a plan that hasn't started yet (still
#    "queued", i.e. purchased with a future start date and not yet
#    active) -- it does NOT let you exit an already-active plan.

# Per AWS's own docs: "Savings Plans offer lower prices compared to
# On-Demand pricing in exchange for a commitment, and can't be
# cancelled during the term." There is no
# "create-savings-plan-listing" equivalent to the RI Marketplace
# command above -- no marketplace for Savings Plans exists at all.

# The only real levers once committed:
aws ce get-savings-plans-utilization \\
  --time-period Start=2026-01-01,End=2026-01-31
# -- monitor utilization and grow OTHER usage (new workloads,
#    migrating more services onto covered compute) to consume the
#    unused portion of the commitment before the term ends.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'Following the main page\'s own mistake #4, a team is 6 months into a 3-year All-Upfront Compute Savings Plan when the company downsizes 30%, leaving 30% of the hourly commitment unused for the remaining 30 months. A manager asks whether the team can sell the unused portion on the Reserved Instance Marketplace the way the main page describes for Standard RIs. Using this subtopic\'s theory, what should the team tell them?',
    hint: 'Per AWS\'s own documentation on Reserved Instance Marketplace eligibility, which specific products are listed as sellable — and is a Savings Plan one of them?',
    solution: 'Per this subtopic\'s theory, the answer is no — Savings Plans cannot be sold on the Reserved Instance Marketplace or any equivalent. AWS\'s own documentation on Reserved Instance Marketplace eligibility states directly that "Only Amazon EC2 Standard regional and zonal Reserved Instances can be sold in the Reserved Instance Marketplace" — Savings Plans are not RIs at all, they are a separate commitment product, and no comparable resale marketplace exists for them. Combined with AWS\'s own statement that Savings Plans "can\'t be cancelled during the term," the team has no way to exit or recover value from the unused 30% once purchased. The only realistic options are to keep paying the committed rate for the remaining 30 months, or to grow other eligible usage (onboarding new workloads onto EC2/Fargate/Lambda) to consume more of the existing commitment and reduce the wasted portion going forward — there is no way to reclaim the sunk cost already paid.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'Since the main page shows Standard RIs can be resold on the RI Marketplace, an over-committed Savings Plan can likely be resold there too.',
      reality: 'Per this subtopic\'s theory, AWS\'s own documentation scopes RI Marketplace eligibility explicitly to "Standard regional and zonal Reserved Instances" only — Savings Plans (and even Convertible RIs) are excluded, with no equivalent marketplace of any kind.'
    },
    {
      thought: 'A Savings Plan can be cancelled if the commitment turns out to be too large, similar to cancelling a subscription.',
      reality: 'Per this subtopic\'s theory, AWS\'s own documentation states directly that Savings Plans "can\'t be cancelled during the term" — the commitment is locked in for the full 1- or 3-year term with no early-exit mechanism.'
    },
    {
      thought: 'The financial risk in the main page\'s own $45,000 mistake scenario is that the team simply has to renegotiate a lower rate with AWS.',
      reality: 'Per this subtopic\'s theory, there is no renegotiation mechanism either — the committed rate and duration are fixed at purchase time; the only real mitigation is growing other usage to consume more of the existing commitment, not adjusting the commitment itself.'
    }
  ];
}
