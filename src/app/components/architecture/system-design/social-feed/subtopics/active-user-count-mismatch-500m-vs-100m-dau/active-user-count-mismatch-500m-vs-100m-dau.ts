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
  templateUrl: './active-user-count-mismatch-500m-vs-100m-dau.html',
  styleUrl: './active-user-count-mismatch-500m-vs-100m-dau.scss'
})
export class ActiveUserCountMismatch500mVs100mDauSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'Two sections of the same page, quietly using different population sizes',
      points: [
        'The main page\'s "Scale & Storage" code sample opened with "Users: 500M active" and based its read-QPS estimate on that figure: "500M users × 5 feed loads/day." Further down the SAME page, the Challenge\'s own description states the real breakdown explicitly: "500M registered users, 100M daily active." The code sample was quietly treating all 500M REGISTERED users as if they were all ACTIVE — a 5x overcount. The page has been corrected.',
        'This is catchable purely by comparing the page\'s own two population figures against each other — no external research needed, just noticing that "500M active" and "100M daily active" cannot both describe the same system.',
      ]
    },
    {
      heading: 'Why "registered" and "daily active" are genuinely different numbers to design around',
      points: [
        'A REGISTERED user is anyone who has ever created an account — most social platforms have far more registered accounts than accounts that are meaningfully used day-to-day (abandoned accounts, one-time signups, inactive accounts that never churned out of the database).',
        'A DAILY ACTIVE user (DAU) is someone who actually opens the app and generates real traffic (feed loads, posts, likes) on a given day — this is the number that actually determines read/write QPS, not the total registered count.',
        'Using the larger, wrong figure (500M) for a read-QPS estimate produces a number 5x too high — which sounds like a "safe" overestimate, but capacity plans built on an inflated number can lead to genuinely over-provisioned (and unnecessarily expensive) infrastructure, the opposite failure mode from under-provisioning but still a real cost to get wrong.',
      ]
    },
    {
      heading: 'Recomputing the read path with the correct population',
      points: [
        'Using the Challenge\'s own stated 100M daily active users (not the code sample\'s original 500M): 100M × 5 feed loads/day = 500,000,000 reads/day, which divided across 86,400 seconds/day gives roughly 5,800 reads/second — not the ~29,000 reads/second the original 500M-based calculation produced.',
        'Interestingly, ~5,800 reads/sec lines up closely with the SAME page\'s own separately-stated write path figure ("500M posts/day = ~5,800 posts/sec") — a useful sanity-check coincidence (post rate and corrected read rate landing in the same ballpark) that was obscured by the original inflated read figure.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Registered vs. daily active — which population feeds which estimate',
      language: 'typescript',
      code: `interface PopulationFigure {
  label: string;
  count: number;
  whatItDrives: string;
}

const populations: PopulationFigure[] = [
  {
    label: 'Registered users',
    count: 500_000_000,
    whatItDrives:
      'Total account/profile storage, historical data retention -- ' +
      'NOT day-to-day read/write traffic, since most registered ' +
      'accounts are not actively generating requests on any given day.',
  },
  {
    label: 'Daily active users (DAU)',
    count: 100_000_000,
    whatItDrives:
      'Read QPS, write QPS, cache sizing for HOT (recently-accessed) ' +
      'data -- this is the population that actually generates load.',
  },
];

// The page's own "Scale & Storage" read-QPS line originally used
// the REGISTERED figure (500M) for a calculation that should have
// used the DAU figure (100M) -- a 5x overcount versus what the
// page's own Challenge description states for the same system.

const correctedReadsPerDay = 100_000_000 * 5; // 5 feed loads/day/DAU
const correctedReadQps = correctedReadsPerDay / 86_400;
console.log(correctedReadQps); // ~5,800 reads/sec, not ~29,000`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A capacity plan sizes the Redis read-serving cluster for "~29,000 reads/sec," based on "500M users × 5 feed loads/day." The same document elsewhere states the platform has 500M registered users but only 100M daily active users. Which figure should the read-QPS estimate have used, and how much does the corrected estimate differ?',
    hint: 'Does a user who registered an account but never opens the app generate any feed-load traffic at all?',
    solution: 'The estimate should use DAILY ACTIVE users (100M), not registered users (500M) — only users who actually open the app on a given day generate feed-load reads; a registered-but-inactive account contributes zero read traffic. Using the correct 100M figure: 100M × 5 feed loads/day = 500,000,000 reads/day, or roughly 5,800 reads/second — about 5x lower than the original ~29,000 reads/second figure, which had silently used the 500M registered-user count instead. Provisioning a Redis read-serving cluster for 29,000 reads/sec when the real sustained load is closer to 5,800 reads/sec would mean paying for roughly 5x more read capacity than the system actually needs.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'For a capacity estimate, "total users" and "daily active users" are close enough to use interchangeably, since most social platforms have similar ratios.',
      reality: 'Per this subtopic\'s theory, this specific page\'s own stated numbers show a 5x gap between registered users (500M) and daily active users (100M) — a difference large enough to meaningfully change infrastructure sizing decisions, not a rounding-level discrepancy.'
    },
    {
      thought: 'Using the larger, "safer" population figure (registered users) for a capacity estimate is a reasonable, conservative choice even if it is not the precisely correct number.',
      reality: 'Per this subtopic\'s theory, an inflated estimate is not simply "safe" — it can lead to real, unnecessary infrastructure spend (provisioning for ~29,000 reads/sec when actual sustained load is closer to 5,800) — precision matters in both directions, not just against under-provisioning.'
    },
    {
      thought: 'Catching this kind of population-size mismatch requires deep domain expertise in growth metrics or user analytics.',
      reality: 'Per this subtopic\'s theory, this was caught by simply comparing two population figures stated on the SAME page against each other — "500M active" in one section and "100M daily active" in another cannot both be true of the same system, no specialized analytics knowledge required.'
    }
  ];
}
