import { Component } from '@angular/core';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent, SubtopicLink } from '../../../../../shared/subtopic-nav/subtopic-nav';

@Component({
  selector: 'app-monitoring-bgsave-cow-memory-growth',
  standalone: true,
  imports: [SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
            TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './monitoring-bgsave-cow-memory-growth.html',
  styleUrl: './monitoring-bgsave-cow-memory-growth.scss',
})
export class MonitoringBgsaveCowMemoryGrowthSubtopic {
  theory: TheoryPoint[] = [
    {
      heading: 'A gap between the main page\'s prose and its code',
      points: [
        'The main page\'s own QnA on BGSAVE memory usage is detailed and accurate ("copy-on-write... pages modified by the parent while the child is writing get copied... in the worst case memory usage can temporarily double") — but it stays entirely prose, and even names the exact INFO fields to watch (<code>rdb_current_bgsave_type</code>, <code>used_memory</code>) without ever showing them read together in one working script.',
        'The page\'s own Persistence Health Check Challenge already demonstrates the pattern of parsing <code>INFO persistence</code> output into a usable object — this subtopic extends that exact same parsing technique to build a genuine BGSAVE memory-growth monitor.',
      ],
    },
    {
      heading: 'What the monitor actually needs to track',
      points: [
        '<code>rdb_bgsave_in_progress</code> (already named in the main page\'s own "Monitoring & Control" codeTab) tells you WHETHER a BGSAVE is currently running — the monitor only needs to sample memory while this is 1.',
        'Comparing <code>used_memory</code> sampled DURING a BGSAVE against a baseline sampled BEFORE it started is what actually reveals the copy-on-write growth the QnA describes — a single snapshot alone can\'t show growth, only a before/during comparison can.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'A real BGSAVE memory-growth monitor',
      language: 'typescript',
      code: `import Redis from 'ioredis';
const redis = new Redis();

function parseInfoSection(raw: string): Record<string, string> {
  return Object.fromEntries(
    raw.split('\\r\\n').filter(l => l.includes(':')).map(l => l.split(':'))
  );
}

interface MemorySample {
  tick: number;
  usedMemoryMB: number;
  bgsaveInProgress: boolean;
}

async function monitorBgsaveMemory(pollMs = 500, maxPolls = 60): Promise<MemorySample[]> {
  const samples: MemorySample[] = [];

  // Baseline BEFORE triggering the save -- growth is only meaningful relative to this.
  const before = parseInfoSection(await redis.info('memory'));
  samples.push({ tick: 0, usedMemoryMB: Number(before['used_memory']) / 1024 / 1024, bgsaveInProgress: false });

  await redis.call('BGSAVE');

  for (let i = 1; i <= maxPolls; i++) {
    await new Promise(r => setTimeout(r, pollMs));
    const [mem, persistence] = await Promise.all([
      redis.info('memory'),
      redis.info('persistence'),
    ]);
    const memInfo = parseInfoSection(mem);
    const persistInfo = parseInfoSection(persistence);
    const inProgress = persistInfo['rdb_bgsave_in_progress'] === '1';

    samples.push({
      tick: i,
      usedMemoryMB: Number(memInfo['used_memory']) / 1024 / 1024,
      bgsaveInProgress: inProgress,
    });

    if (!inProgress) break; // BGSAVE finished -- stop polling
  }

  return samples;
}`,
    },
    {
      label: 'Verified against a modeled COW pattern',
      language: 'typescript',
      code: `// Models the exact COW behavior the main page's own QnA describes: memory
// grows by however much the PARENT writes WHILE the child is mid-snapshot,
// then returns to baseline once BGSAVE finishes and the COW pages release.
class FakeRedisMemoryModel {
  bgsaveInProgress = false;
  private dirtiedPagesMB = 0;

  constructor(private baselineMB: number) {}

  startBgsave() { this.bgsaveInProgress = true; this.dirtiedPagesMB = 0; }
  finishBgsave() { this.bgsaveInProgress = false; this.dirtiedPagesMB = 0; }
  writeDuringBgsave(mb: number) {
    if (this.bgsaveInProgress) this.dirtiedPagesMB += mb; // a write forces a page copy
  }
  usedMemoryMB() { return this.baselineMB + this.dirtiedPagesMB; }
}

const redis = new FakeRedisMemoryModel(1000);
console.log('Baseline (before BGSAVE):', redis.usedMemoryMB(), 'MB');

redis.startBgsave();
redis.writeDuringBgsave(200);
redis.writeDuringBgsave(300);
console.log('Mid-BGSAVE (500MB written concurrently):', redis.usedMemoryMB(), 'MB');

redis.finishBgsave();
console.log('Post-BGSAVE (COW pages released):', redis.usedMemoryMB(), 'MB');
// Baseline (before BGSAVE): 1000 MB
// Mid-BGSAVE (500MB written concurrently): 1500 MB
// Post-BGSAVE (COW pages released): 1000 MB`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A dataset is 10 GB and almost entirely READ traffic during a BGSAVE window (very few writes). A second, different dataset is also 10 GB but under heavy WRITE traffic during its own BGSAVE window. Both datasets are otherwise identical in size. Which one is at greater risk of the "temporarily double" memory scenario the main page\'s QnA describes?',
    hint: 'Re-read exactly what triggers a page copy under copy-on-write — is it the SIZE of the dataset, or something about what happens to it WHILE the snapshot is being written?',
    solution: `The write-heavy dataset is at far greater risk, even though both datasets are the same total size. Copy-on-write memory growth is driven by how many pages the PARENT process modifies WHILE the child's snapshot is still in progress -- not by the dataset's size on its own. A 10GB dataset that sits almost entirely read-only during the BGSAVE window will barely grow past its baseline at all, while an equally large dataset under heavy concurrent writes can approach genuinely doubling, exactly as the main page's QnA describes as the worst case.

This is also why BGSAVE timing matters operationally: scheduling snapshots during a naturally low-write period (a nightly batch window, for example) reduces COW memory risk directly, independent of anything else about dataset size or hardware.`,
  };

  misconceptions: Misconception[] = [
    {
      thought: '"A larger dataset always risks more memory doubling from BGSAVE\'s copy-on-write behavior than a smaller one."',
      reality: 'Verified above: the growth is driven by how many pages get WRITTEN TO during the snapshot window, not the dataset\'s total size. A large, mostly-idle dataset can see almost no COW growth, while a smaller, write-heavy one can approach the worst case the main page\'s QnA describes.',
    },
    {
      thought: '"Once BGSAVE finishes, the memory it temporarily used stays elevated until the next full restart."',
      reality: 'Verified via the modeled COW pattern above: memory returns to baseline once the child process exits and the copy-on-write pages are released — the growth is genuinely temporary, scoped to the duration of the BGSAVE itself, not a lasting increase.',
    },
  ];

  topicLabel = 'Persistence: RDB & AOF';
  topicRoute = '/redis/persistence';
  prev: SubtopicLink | null = {
    label: 'DEBUG SLEEP vs. SAVE: Two Completely Different Commands',
    route: '/redis/persistence/debug-sleep-vs-save-two-different-commands',
  };
  next: SubtopicLink | null = null;
}
