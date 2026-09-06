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
    heading: 'A Two-Sided Formula, Missing Its Lower Side',
    points: [
      'The main page\'s own QnA stated the default oplog size as "5% of disk space or 50GB, whichever is smaller" — verified against MongoDB\'s own Replica Set Oplog documentation that this correctly describes the UPPER bound (the oplog never defaults above 50GB), but omits the LOWER bound entirely: a <strong>990MB minimum</strong> that applies whenever 5% of free disk (or physical memory, for the in-memory storage engine) would otherwise compute to less than that.',
      'The real formula is a two-sided clamp: <code>max(990MB, min(5% of free disk, 50GB))</code>. On a small development VM with a modest disk, the 990MB floor is often the ACTIVE constraint — the "5%" half of the formula never even matters.',
      'This is a genuine gap for capacity planning specifically: someone estimating "how much oplog will I get" purely from the 5%-of-disk half of the formula will underestimate on a small disk, since the real default is never below 990MB regardless of how little 5% of the disk computes to.',
    ],
  },
];

const codeTabs: CodeTab[] = [
  {
    label: 'The Real Two-Sided Formula',
    language: 'typescript',
    code: `// MongoDB's actual default oplog size formula (verified against
// MongoDB's own documentation): max(990MB, min(5% of free disk, 50GB)).
function defaultOplogSizeMB(freeDiskGB: number): number {
  const fivePercentMB = freeDiskGB * 1024 * 0.05;
  const cappedAt50GB = Math.min(fivePercentMB, 50 * 1024);
  return Math.max(cappedAt50GB, 990);
}

// A small 10GB dev VM disk.
console.log('10GB disk, naive "5% only" estimate:', (10 * 1024 * 0.05).toFixed(0), 'MB');
console.log('10GB disk, REAL default (990MB floor applies):', defaultOplogSizeMB(10).toFixed(0), 'MB');
// -> naive estimate: 512MB. REAL default: 990MB -- nearly double,
// because the floor is the ACTIVE constraint on a disk this small.

// A large 2TB production disk.
console.log('2TB disk, naive "5% only" estimate:', (2048 * 1024 * 0.05 / 1024).toFixed(1), 'GB');
console.log('2TB disk, REAL default (50GB cap applies):', (defaultOplogSizeMB(2048) / 1024).toFixed(1), 'GB');
// -> naive estimate: 102.4GB. REAL default: 50GB -- the CAP is the
// active constraint here instead, the half of the formula the main
// page's own QnA already stated correctly.`,
  },
];

const exercise: TryItExercise = {
  prompt:
    'A team provisions a 5GB disk for a quick local test replica set, with no oplog size explicitly configured. Using the real formula above, what oplog size do they actually get — and is it closer to the "5% of disk" estimate, or the 990MB floor?',
  hint: 'Compute 5% of 5GB first in MB, then compare that value against the 990MB floor to see which one the max() picks.',
  solution: `// 5% of 5GB = 5 * 1024 * 0.05 = 256MB.
// max(990MB, min(256MB, 50*1024MB)) = max(990MB, 256MB) = 990MB.
//
// The real oplog size is 990MB -- almost 4x the naive "5% of disk"
// estimate of 256MB. This is much closer to the FLOOR than to the
// disk-percentage calculation, since on a disk this small the floor
// is always going to be the binding constraint. A team estimating
// their oplog window purely from "5% of my disk" would badly
// underestimate how much oplog history they actually have.`,
};

const misconceptions: Misconception[] = [
  {
    thought: 'On a very small disk, MongoDB\'s "5% of disk space" oplog default just produces a very small oplog — there\'s no floor protecting against that.',
    reality: 'Verified against MongoDB\'s own documentation: there IS a 990MB minimum floor that applies regardless of disk size. A disk small enough that 5% computes to less than 990MB still gets a 990MB oplog by default — the formula is a genuine two-sided clamp, not a bare percentage.',
  },
  {
    thought: 'The 990MB minimum and the 50GB maximum are two independent settings a DBA can tune separately, similar to how oplogMinRetentionHours is a separate, opt-in setting from the base oplog size.',
    reality: 'The 990MB floor and 50GB cap are both part of the SAME automatic default-sizing FORMULA (not separate configurable settings) — they apply automatically whenever the oplog size itself is left unconfigured. To actually override either bound, you set the oplog SIZE directly (via storage.oplogSizeMB or replSetResizeOplog), not the floor/cap individually.',
  },
];

@Component({
  selector: 'app-mongo-rs-oplog-default-floor',
  standalone: true,
  imports: [CommonModule, SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent,
    CodeBlockComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './oplog-default-has-a-990mb-floor-the-page-missed.html',
  styleUrl: './oplog-default-has-a-990mb-floor-the-page-missed.scss',
})
export class OplogDefaultHasA990MbFloorThePageMissedSubtopic {
  theory = theory;
  codeTabs = codeTabs;
  exercise = exercise;
  misconceptions = misconceptions;
}
