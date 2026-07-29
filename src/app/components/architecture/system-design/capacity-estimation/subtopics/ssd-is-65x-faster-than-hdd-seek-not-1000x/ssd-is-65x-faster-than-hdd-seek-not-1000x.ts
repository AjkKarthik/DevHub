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
  templateUrl: './ssd-is-65x-faster-than-hdd-seek-not-1000x.html',
  styleUrl: './ssd-is-65x-faster-than-hdd-seek-not-1000x.scss'
})
export class SsdIs65xFasterThanHddSeekNot1000xSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'A "rule of thumb" that didn\'t match the page\'s own numbers just above it',
      points: [
        'The main page\'s "Latency Numbers" code sample originally listed "SSD random read: 100 µs (0.1 ms)" and "HDD seek: 10 ms" in its own table, then separately claimed "SSD is 1,000× faster than spinning disk" in its "Rules of thumb" section right below. Even using the page\'s OWN (imprecise) 100µs figure, 10ms ÷ 0.1ms = 100×, not 1,000× — the rule of thumb didn\'t match the table three lines above it. The main page has been corrected on both counts.',
      ]
    },
    {
      heading: 'The reality: ~65× faster, using the canonical, precise numbers',
      points: [
        'Per the canonical "Latency Numbers Every Programmer Should Know" reference, a 4K random SSD read is ~150,000 nanoseconds (150 microseconds, 0.15ms) — not 100µs. A disk seek is genuinely ~10ms (10,000,000 ns).',
        'Dividing correctly: 10ms ÷ 0.15ms ≈ 67×, which the main page now states as "~65×" (rounded for a clean back-of-envelope figure). This is the number worth memorizing, not 1,000×.',
        'The 1,000× figure isn\'t meaningless — it\'s roughly the right order of magnitude for comparing RAM to disk seek (100ns vs 10ms is a genuine 100,000× gap), or for comparing SEQUENTIAL SSD throughput to HDD seek time under certain workloads. But applied to "random SSD read vs. disk seek" specifically — the comparison the main page was making — 1,000× is simply the wrong number.',
      ]
    },
    {
      heading: 'Why catching a self-inconsistent rule of thumb matters more than catching an isolated wrong fact',
      points: [
        'A single wrong number in a big table is easy to miss on a skim-read. A "rule of thumb" that contradicts the very table it\'s summarizing is a stronger signal something is off — cross-checking a page\'s own summary claims against its own raw data (arithmetic that requires ZERO external research) is one of the fastest ways to catch this class of error.',
        'In an interview, citing "SSD is 1,000x faster than disk" when your own back-of-envelope numbers imply ~65-100x is the kind of inconsistency an attentive interviewer will probe — being internally consistent matters as much as being externally accurate.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Checking a rule of thumb against its own supporting numbers',
      language: 'bash',
      code: `# The main page's OWN latency table (after correction):
# SSD random read (4K)   150 us   (0.15 ms)
# HDD seek                10 ms   (10,000 us)

# The correct ratio, computed from those same two numbers:
echo "10000 / 150 = $(echo "10000/150" | bc) x faster"
# -> ~66x, matching the corrected "~65x" rule of thumb

# What the ORIGINAL (now-fixed) numbers implied, for comparison:
# Original table: SSD 100us, HDD seek 10ms (10,000us)
echo "10000 / 100 = $(echo "10000/100" | bc) x faster"
# -> 100x -- already contradicting the original page's own
#    separately-stated "1,000x faster" rule of thumb, even
#    BEFORE accounting for the SSD figure's own inaccuracy.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'Before researching anything externally, you notice a page states "SSD random read: 100 microseconds" and "HDD seek: 10 milliseconds" in one table, then claims "SSD is 1,000x faster than spinning disk" in a summary a few lines later. Without looking anything up, can you tell something is wrong — and if so, what?',
    hint: 'Divide the two numbers from the table itself: 10ms is how many microseconds, and what is that divided by 100 microseconds?',
    solution: 'Yes — this is catchable with pure arithmetic on the page\'s own numbers, no external research needed. 10ms = 10,000 microseconds. 10,000 ÷ 100 = 100, not 1,000. The page\'s own table implies a 100x speedup, but its own summary claims 1,000x — a 10x internal inconsistency, visible just from cross-checking the page against itself. (The externally-verified correct figure, using the canonical 150-microsecond SSD read time, is closer to 65-67x — even further from the original 1,000x claim.)'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'SSD random reads are roughly 1,000x faster than a disk seek — a figure worth memorizing directly from the main page.',
      reality: 'Per this subtopic\'s theory (a self-inconsistent rule of thumb corrected on the main page during this batch), the correct figure is closer to 65x, verified both against the page\'s own corrected table and the canonical latency-numbers reference.'
    },
    {
      thought: 'A "rule of thumb" summary on a reference page can be trusted at face value, separately from checking the detailed numbers it\'s summarizing.',
      reality: 'Per this subtopic\'s theory, cross-checking a summary claim against the very data it summarizes is a fast, zero-external-research way to catch errors — this rule of thumb didn\'t even match the page\'s own table.'
    },
    {
      thought: 'Order-of-magnitude "rules of thumb" in system design don\'t need to be numerically precise, so a 10x-off multiplier isn\'t a big deal.',
      reality: 'Per this subtopic\'s theory, a rule of thumb that contradicts the numbers backing it undermines the whole point of memorizing it — the value of these figures is using them consistently, and an attentive interviewer will notice the inconsistency.'
    }
  ];
}
