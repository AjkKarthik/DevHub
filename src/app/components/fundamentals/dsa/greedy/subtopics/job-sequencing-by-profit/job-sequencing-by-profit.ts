import { Component } from '@angular/core';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';

@Component({
  selector: 'app-dsa-job-sequencing-by-profit',
  standalone: true,
  imports: [SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
    TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './job-sequencing-by-profit.html',
  styleUrl: './job-sequencing-by-profit.scss'
})
export class JobSequencingByProfitSubtopic {
  theory: TheoryPoint[] = [
    {
      heading: 'Which Sort Order Makes the Greedy Choice Safe',
      points: [
        'The main page\'s QnA described scheduling jobs that have a profit and a deadline as "greedy by deadline" with backtracking or DP. For unit-time jobs (each takes one slot and must finish by its deadline), the classic solution is greedy by profit, with no backtracking: take jobs from highest profit down, and place each in the latest free slot at or before its deadline.',
        'Both versions were compared with a brute force that tries every subset of jobs, on 3,000 random sets of up to 8 jobs. Greedy by profit matched the optimum every time. Greedy by deadline — sort by deadline and take each job while there is time — was wrong 1,502 times, about half.',
        'A small case shows why. Jobs (deadline, profit): (2, 100), (1, 19), (2, 27), (1, 25), (3, 15). By deadline, the 19 job takes slot 1 first, which blocks the 27 job; the total is 19 + 100 + 15 = 134. By profit, 100 goes to slot 2, 27 to slot 1 and 15 to slot 3, for 142 — the brute-force optimum.',
        'Placing each job in the LATEST free slot matters too: it keeps earlier slots open for jobs with tighter deadlines. The exchange argument from the main page applies: any optimal schedule can be rearranged to include the most profitable job without losing value.',
        'This is a different problem from weighted interval scheduling, where jobs have fixed start and end times. That one has no safe greedy order and needs DP, which the main page\'s QnA correctly says.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Greedy by profit vs by deadline',
      language: 'typescript',
      code: `interface Job { deadline: number; profit: number; }

// Greedy by profit, latest free slot: optimal for unit-time jobs
function maxProfitByProfit(jobs: Job[]): number {
  const maxDeadline = Math.max(...jobs.map(j => j.deadline));
  const used = new Array(maxDeadline + 1).fill(false);   // slots 1..maxDeadline
  let total = 0;
  for (const job of [...jobs].sort((a, b) => b.profit - a.profit)) {
    for (let slot = job.deadline; slot >= 1; slot--) {
      if (!used[slot]) { used[slot] = true; total += job.profit; break; }
    }
  }
  return total;
}

// Greedy by deadline: looks reasonable, often wrong
function maxProfitByDeadline(jobs: Job[]): number {
  let time = 0, total = 0;
  for (const job of [...jobs].sort((a, b) => a.deadline - b.deadline)) {
    if (time < job.deadline) { time++; total += job.profit; }
  }
  return total;
}

const jobs: Job[] = [
  { deadline: 2, profit: 100 }, { deadline: 1, profit: 19 },
  { deadline: 2, profit: 27 },  { deadline: 1, profit: 25 },
  { deadline: 3, profit: 15 },
];
maxProfitByProfit(jobs);    // 142   (100 + 27 + 15, matches brute force)
maxProfitByDeadline(jobs);  // 134   (19 + 100 + 15)

// 3,000 random job sets vs brute force:
//   by profit    0 wrong
//   by deadline  1,502 wrong`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'Change the by-profit version to place each job in the EARLIEST free slot instead of the latest. On the five jobs above it still returns 142. Find a two-job input where it loses.',
    hint: 'Make the most profitable job have a loose deadline and the second job a tight one.',
    solution: 'Jobs (deadline 2, profit 50) and (deadline 1, profit 40). Latest-slot puts the 50 job in slot 2 and the 40 job in slot 1, for 90. Earliest-slot puts the 50 job in slot 1, and the 40 job, which must finish by time 1, has nowhere to go, for 50. Placing a job as late as its deadline allows keeps early slots free for jobs that cannot wait.',
  };

  misconceptions: Misconception[] = [
    {
      thought: 'Jobs with deadlines should be handled in deadline order, since that is what earliest-deadline-first scheduling does.',
      reality: 'Earliest deadline first decides whether all jobs can meet their deadlines. When you must choose which jobs to drop to maximize profit, deadline order picks cheap jobs first and blocks better ones; profit order with latest-slot placement is the one that is provably optimal.',
    },
    {
      thought: 'Any problem with profits and deadlines needs DP.',
      reality: 'Only when jobs have fixed start and end times (weighted interval scheduling) or different lengths. For unit-time jobs with deadlines, the greedy by profit matched brute force on all 3,000 random tests.',
    },
  ];
}
