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
  templateUrl: './pb-per-month-was-actually-per-day.html',
  styleUrl: './pb-per-month-was-actually-per-day.scss'
})
export class PbPerMonthWasActuallyPerDaySubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'A daily total, labeled as monthly, with no ×30 anywhere in the formula',
      points: [
        'The Challenge solution\'s "estimatedCost" originally stated: "CDN egress: 100M viewers × 2 hrs/day × 1.5 GB/hr = 300 PB/month." Multiplying the three numbers shown (100,000,000 × 2 × 1.5) gives 300,000,000 GB — but every input in that multiplication is a PER-DAY quantity ("2 hrs/day"), so the result is a per-DAY total, not a per-month one. The page has been corrected.',
        'This is catchable purely by tracing the units through the formula itself — no external research needed, just noticing that multiplying three "per day" quantities together produces another "per day" quantity, and there\'s no ×30 (or similar days-in-a-month factor) anywhere in the shown calculation.',
      ]
    },
    {
      heading: 'The dollar figure was internally consistent with the (wrong) unit label — which is what made it look right',
      points: [
        'The original "$3M/month CDN" figure is EXACTLY what you get multiplying 300,000,000 GB × $0.01/GB = $3,000,000 — so the dollar amount and the "300 PB" figure agree with each other. That internal consistency is precisely what made the mislabeling easy to miss: the two numbers check out against EACH OTHER, even though both are actually per-day figures mislabeled as monthly.',
        'Scaling correctly to a monthly total: 300 PB/day × ~30 days ≈ 9,000 PB/month (9 exabytes), and at $0.01/GB that\'s roughly $90M/month — 30x larger than the original $3M/month claim.',
      ]
    },
    {
      heading: 'Why this kind of error is worth specifically watching for',
      points: [
        'A unit-mislabeling error where the ARITHMETIC is correct but the TIME PERIOD is wrong is harder to catch than a simple miscalculation, because every individual multiplication step checks out — the mistake is purely in what label gets attached to the final result, not in how it was computed.',
        'The original page also claimed the (wrong) $3M/month figure "matches YouTube\'s actual reported costs" — a specific, checkable-sounding claim attached to an unverified/incorrect number is a red flag worth a second look, since a claim of external validation makes an error feel more trustworthy than it actually is.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Tracing the time unit through the calculation',
      language: 'typescript',
      code: `interface EgressEstimate {
  period: 'day' | 'month';
  totalGB: number;
  costUsd: number;
}

function estimateDaily(viewers: number, hoursPerDay: number, gbPerHour: number): EgressEstimate {
  const totalGB = viewers * hoursPerDay * gbPerHour;
  return { period: 'day', totalGB, costUsd: totalGB * 0.01 };
}

function estimateMonthly(daily: EgressEstimate, daysInMonth = 30): EgressEstimate {
  return {
    period: 'month',
    totalGB: daily.totalGB * daysInMonth,
    costUsd: daily.costUsd * daysInMonth,
  };
}

// The original formula: 100M viewers x 2 hrs/day x 1.5 GB/hr
// -- every input already carries a "/day" unit -- so the raw
// product is a DAILY total, before any monthly scaling:
const daily = estimateDaily(100_000_000, 2, 1.5);
console.log(daily.totalGB / 1e6, 'PB/day');   // 300 PB/day
console.log(daily.costUsd / 1e6, '$M/day');   // $3M/day

// A genuinely MONTHLY figure needs the extra x30 (or x days-in-month)
// step that the original calculation never applied:
const monthly = estimateMonthly(daily);
console.log(monthly.totalGB / 1e6, 'PB/month'); // ~9,000 PB/month (9 EB)
console.log(monthly.costUsd / 1e6, '$M/month'); // ~$90M/month`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A cost estimate states: "CDN egress: 100M viewers × 2 hrs/day × 1.5 GB/hr = 300 PB/month. At $0.01/GB: $3M/month." The dollar figure ($3M) correctly matches 300 PB × $0.01/GB. Is there still an error here, and if so, where?',
    hint: 'Every number being multiplied together (100M viewers, 2 hrs/day, 1.5 GB/hr) is stated as a PER-DAY quantity. What time period does multiplying three per-day quantities together actually produce?',
    solution: 'Yes, there\'s a real error, even though the dollar figure is internally consistent with the "300 PB" number. Multiplying three per-day quantities (100M viewers, 2 hrs/day, 1.5 GB/hr) together produces a per-DAY total, not a per-month one -- there is no step in the shown calculation that multiplies by the number of days in a month. "300 PB" and "$3M" are both actually DAILY figures mislabeled as monthly. The correct monthly figures, scaling by ~30 days, are roughly 9,000 PB (9 exabytes) and ~$90M/month -- thirty times larger than the original claim. The internal consistency between the wrong "300 PB" and the wrong "$3M" (they correctly multiply out to match each other) is exactly what made the mislabeled TIME PERIOD easy to miss on a first read.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'If a cost estimate\'s dollar figure correctly matches its own stated volume figure (volume × price-per-unit = cost), the estimate as a whole must be correct.',
      reality: 'Per this subtopic\'s theory, internal consistency between two derived numbers doesn\'t catch an error in what TIME PERIOD both numbers actually represent — "300 PB" and "$3M" agreed with each other perfectly while BOTH were mislabeled as monthly when they were actually daily.'
    },
    {
      thought: 'A calculation that multiplies "X per day" quantities together and doesn\'t explicitly convert to a different time period will still often produce a reasonable estimate for that other period, since the reader can mentally adjust.',
      reality: 'Per this subtopic\'s theory, multiplying per-day quantities together produces a per-day RESULT — there is no implicit conversion; the result needs an explicit multiplication by the target period\'s length (e.g. ×30 for a month) to actually represent that period, or it will be off by that exact factor.'
    },
    {
      thought: 'A specific external validation claim ("matches YouTube\'s actual reported costs") attached to a numeric estimate makes that estimate more likely to be correct, since someone presumably checked it against real data.',
      reality: 'Per this subtopic\'s theory, such a claim is not itself verification — it\'s worth checking the underlying number independently, since an unverified validation claim attached to an actually-incorrect figure (mislabeled by a factor of 30 here) can make the error harder to catch by making the number feel independently confirmed.'
    }
  ];
}
