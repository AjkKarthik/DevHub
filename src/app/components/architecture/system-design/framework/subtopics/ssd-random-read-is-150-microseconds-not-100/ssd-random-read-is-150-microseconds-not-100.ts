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
  templateUrl: './ssd-random-read-is-150-microseconds-not-100.html',
  styleUrl: './ssd-random-read-is-150-microseconds-not-100.scss'
})
export class SsdRandomReadIs150MicrosecondsNot100Subtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'A memorized number worth double-checking against its canonical source',
      points: [
        'The main page\'s own QnA answer on back-of-envelope math lists "SSD random read (0.1ms)" as one of the handful of numbers worth memorizing for capacity estimation. Checking this against the canonical source these figures are drawn from, the real number rounds to a noticeably different value. The main page has been corrected.',
      ]
    },
    {
      heading: 'The reality: ~150 microseconds (0.15ms), not 0.1ms',
      points: [
        'The widely-cited reference for these figures — Jeff Dean\'s "Latency Numbers Every Programmer Should Know" — lists reading 4KB randomly from SSD at 150,000 nanoseconds, i.e. 150 microseconds, i.e. 0.15ms. The main page\'s "0.1ms" rounds this down by a third.',
        'For comparison, the other three numbers on the same page checked out exactly: disk seek is genuinely 10ms, same-datacenter round trip is genuinely ~0.5ms (500,000 ns), and cross-region round trip (the classic CA↔Netherlands measurement) is genuinely ~150ms. Only the SSD figure needed correction.',
      ]
    },
    {
      heading: 'Why a 50%-off memorized constant matters in a live interview',
      points: [
        'These numbers exist specifically so a candidate can sanity-check a proposed design\'s latency budget on the fly — e.g. "if we do 3 sequential SSD random reads per request, that\'s already ~0.45ms just in storage access, before network and processing." Using 0.1ms instead of 0.15ms understates that budget by 50%, which can make a design look comfortably within a latency SLA when it is actually much closer to the edge.',
        'This specific number also anchors comparisons elsewhere in system design — "SSD random read is roughly 67x faster than a disk seek" only comes out right (10ms ÷ 0.15ms ≈ 67x) using the correct figure; a comparison built on the rounded-down 0.1ms constant would instead claim a 100x speedup, overstating SSD\'s real advantage.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'The canonical figures, for a quick gut-check during an interview',
      language: 'bash',
      code: `# "Latency Numbers Every Programmer Should Know" (Jeff Dean)
# -- the canonical source for these back-of-envelope constants:

# L1 cache reference                    0.5   ns
# Branch mispredict                     5     ns
# L2 cache reference                    7     ns
# Mutex lock/unlock                    25     ns
# Main memory reference                100    ns
# Compress 1K bytes with Zippy      3,000     ns  (3 us)
# Send 1K bytes over 1 Gbps network10,000     ns  (10 us)
# Read 4K randomly from SSD*      150,000     ns  (150 us / 0.15 ms)  <-- NOT 0.1ms
# Read 1MB sequentially from mem   250,000     ns  (250 us)
# Round trip within same datacenter 500,000    ns  (500 us / 0.5 ms)
# Read 1MB sequentially from SSD*1,000,000     ns  (1 ms)
# Disk seek                     10,000,000     ns  (10 ms)
# Read 1MB sequentially from disk20,000,000     ns  (20 ms)
# Send packet CA->Netherlands->CA150,000,000    ns  (150 ms)

# Sanity check during a design: 3 sequential SSD random reads
echo "3 x 0.15ms = 0.45ms of storage latency alone"`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'You are designing a service with a P99 latency budget of 1ms for the storage layer, and your design does 6 sequential SSD random reads per request. Using the main page\'s original (now-corrected) "0.1ms per SSD read" figure, you conclude this comfortably fits in 0.6ms. Using the corrected 0.15ms figure, does it still fit?',
    hint: 'What is 6 × 0.15ms, and how does that compare to the 1ms budget — with room left over for network and processing time?',
    solution: 'It technically still fits under the raw 1ms number (6 × 0.15ms = 0.9ms), but the margin has shrunk dramatically: from "0.4ms of headroom" (using the wrong 0.1ms figure) down to just 0.1ms of headroom for EVERYTHING ELSE — network round trips, serialization, application logic. A design that looked comfortably safe under the incorrect constant is actually operating right at the edge of its latency budget under the correct one. This is exactly the kind of error a memorized-but-imprecise number can hide until it causes a real production incident.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'A random 4KB SSD read takes about 0.1ms — a number safe to use directly in back-of-envelope latency budgets.',
      reality: 'Per this subtopic\'s theory (a figure corrected on the main page during this batch), the canonical value is ~0.15ms (150 microseconds) — using 0.1ms understates real storage latency by a third.'
    },
    {
      thought: 'All four of the main page\'s memorized latency numbers (disk seek, SSD read, same-DC RTT, cross-region RTT) needed correction.',
      reality: 'Per this subtopic\'s theory, only the SSD figure was off — disk seek (10ms), same-datacenter round trip (~0.5ms), and cross-region round trip (~150ms) all matched the canonical source exactly.'
    },
    {
      thought: 'A 50%-ish rounding difference on a single memorized latency constant is too small to matter in practice.',
      reality: 'Per this subtopic\'s theory, when a design chains multiple SSD reads against a tight latency budget, that rounding error compounds and can turn an apparently-safe design into one operating right at its budget\'s edge.'
    }
  ];
}
