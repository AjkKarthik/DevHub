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
  templateUrl: './size-for-peak-qps-not-average-qps.html',
  styleUrl: './size-for-peak-qps-not-average-qps.scss'
})
export class SizeForPeakQpsNotAverageQpsSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'A gap in the main page\'s own worked example, not a wrong number',
      points: [
        'The main page\'s Step 2 (capacity estimation) worked example computes "100M DAU × 10 requests/day ≈ 11,600 QPS" — and its own quiz question confirms this exact figure as the correct answer. That arithmetic is correct as far as it goes. What the main page never states is that this number is an AVERAGE, and that sizing infrastructure to the average is a well-known, commonly-flagged system design interview mistake.',
      ]
    },
    {
      heading: 'The reality: real traffic is never uniform across the day',
      points: [
        'Traffic to almost any consumer-facing system follows a diurnal (day/night) pattern, often compounded by weekly and event-driven spikes. A widely-cited rule of thumb, sometimes framed as an 80/20 split, is that a large share of a day\'s traffic arrives in a small fraction of that day\'s hours — meaning the PEAK request rate during busy hours is meaningfully higher than the 24-hour average.',
        'The standard interview guidance is to size for Peak QPS = Average QPS × a peak multiplier, commonly cited in the 2x–3x range as a safe general-purpose default (higher, even 5x–10x, for products with sharp event-driven spikes like live sports or flash sales, lower for genuinely steady B2B workloads).',
        'Applied to the main page\'s own example: an average of ~11,600 QPS, sized only to that average, would be under-provisioned during the busiest hours of the day — a system designed to exactly 11,600 QPS capacity could see 25,000–35,000 QPS at peak and fall over exactly when it matters most.',
      ]
    },
    {
      heading: 'Why this specific omission is worth calling out unprompted in an interview',
      points: [
        'Computing an average QPS and treating it as "the" capacity number is a very recognizable pattern interviewers watch for — proactively saying "that\'s the average; I\'d actually provision for roughly 2-3x that at peak" is a low-cost, high-signal way to demonstrate the estimation step is being used for its real purpose (sizing infrastructure), not just as an arithmetic exercise.',
        'This single addition also naturally sets up later design decisions the main page\'s own later sections rely on — e.g. why autoscaling, load shedding, or a message queue absorbing bursts matter, all of which only make sense once "traffic isn\'t flat" is on the table.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Turning the main page\'s average QPS into a peak-provisioned number',
      language: 'bash',
      code: `# Main page's own worked example:
# 100M DAU x 10 requests/day = 1B requests/day
# 1,000,000,000 / 86,400 sec  ~=  11,574 QPS   <- AVERAGE, not peak

# Apply a standard peak multiplier (2x-3x is a safe interview default):
# Peak QPS = Average QPS x multiplier
echo "Average: 11,574 QPS"
echo "Peak (2x): $((11574 * 2)) QPS"
echo "Peak (3x): $((11574 * 3)) QPS"

# Provision (and load-test) for the PEAK number, not the average --
# the average is what you'd see on a monitoring dashboard's daily
# mean, not what your servers need to survive at 8pm on a weeknight.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'Using the main page\'s own worked example (100M DAU, 10 requests/day/user, ~11,600 QPS average), an interviewer asks: "So you\'d provision your servers for about 11,600 QPS?" How should you respond?',
    hint: 'Is 11,600 QPS the number you\'d actually see hitting your servers at the busiest moment of the day, or is it spread evenly across 24 hours?',
    solution: 'The right response pushes back gently: "That\'s the 24-hour average, but traffic isn\'t uniform — I\'d actually provision for roughly 2-3x that at peak, so somewhere around 23,000-35,000 QPS, to handle the busiest hours without falling over." Provisioning exactly to the average figure would leave the system under-capacity during its busiest, highest-stakes traffic windows — precisely when failing is most visible and costly. Calling this out unprompted is a strong signal in a system design interview that estimation is being used to actually size infrastructure, not just as an arithmetic exercise.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'Once you\'ve computed average QPS from DAU and requests-per-user, that number is what you provision your infrastructure to handle.',
      reality: 'Per this subtopic\'s theory (a gap closed on the main page\'s own worked example during this batch), real traffic is non-uniform across the day — infrastructure should be sized to PEAK QPS, commonly estimated as 2-3x the average, not the average itself.'
    },
    {
      thought: 'The main page\'s "~11,600 QPS" figure and its quiz answer confirming it are factually wrong.',
      reality: 'Per this subtopic\'s theory, the arithmetic itself is correct — the gap is that the main page never states this is an AVERAGE, not a peak, capacity-planning number.'
    },
    {
      thought: 'Peak-vs-average traffic is a nuance only relevant for large-scale consumer apps, not something to bring up for smaller or more predictable systems.',
      reality: 'Per this subtopic\'s theory, even steady B2B-style workloads have SOME peak multiplier worth naming (even if smaller, like 1.5x) — the habit of distinguishing average from peak is what interviewers are checking for, regardless of the specific system\'s scale.'
    }
  ];
}
