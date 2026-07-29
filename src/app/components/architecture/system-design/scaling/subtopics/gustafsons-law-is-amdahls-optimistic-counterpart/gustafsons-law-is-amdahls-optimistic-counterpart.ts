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
  templateUrl: './gustafsons-law-is-amdahls-optimistic-counterpart.html',
  styleUrl: './gustafsons-law-is-amdahls-optimistic-counterpart.scss'
})
export class GustafsonsLawIsAmdahlsOptimisticCounterpartSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'A pessimistic ceiling the main page states as if it were the whole picture',
      points: [
        'The main page presents Amdahl\'s Law\'s conclusion — "the serial fraction limits speedup... regardless of how many processors you add" — without noting that this pessimistic ceiling rests on a specific, often-unrealistic assumption: that the problem size stays FIXED as you add more processors. This subtopic fills in the other half of the picture.',
      ]
    },
    {
      heading: 'The missing half: Gustafson\'s Law, for when the problem size grows too',
      points: [
        'Amdahl\'s Law asks: "given a FIXED amount of work, how much faster can I finish it with more processors?" This is called strong scaling, and it\'s genuinely pessimistic — the serial fraction caps the speedup no matter how many processors you throw at it.',
        'Gustafson\'s Law asks a different, often more realistic question for distributed systems: "given MORE processors, how much MORE work can I get done in the same amount of time?" This is called weak scaling — and it assumes the problem size grows WITH the available resources, which is exactly what happens in most real-world horizontal scaling (more nodes → process more data, serve more users, handle more requests), not "the same fixed job, just faster."',
        'Under Gustafson\'s framing, the achievable "scaled speedup" grows much more favorably with processor count than Amdahl\'s pessimistic ceiling suggests — because the serial portion doesn\'t grow proportionally with the added parallel work, its relative COST shrinks as the problem scales up.',
      ]
    },
    {
      heading: 'Why this matters for how you reason about a horizontal-scaling design',
      points: [
        'If a candidate cites ONLY Amdahl\'s Law when discussing why adding more application servers has diminishing returns, they\'re implicitly assuming the total workload stays fixed — but most horizontal-scaling scenarios in system design (handling more USERS or more DATA with more nodes) are exactly the "problem size grows with resources" case Gustafson\'s Law describes, not Amdahl\'s fixed-size case.',
        'Knowing BOTH laws — and which one actually describes the scaling scenario in front of you — is what separates "I can recite a formula" from genuinely understanding why horizontal scaling for a growing user base behaves so differently from trying to parallelize one fixed, serial-bottlenecked batch job.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'The two laws side by side',
      language: 'bash',
      code: `# AMDAHL'S LAW (strong scaling -- FIXED problem size)
# Speedup(N) = 1 / (S + (1-S)/N)
# As N -> infinity, Speedup -> 1/S  (a hard ceiling)
#
# Example: S = 0.25 (25% serial)
#   Speedup with infinite processors = 1 / 0.25 = 4x, period.

# GUSTAFSON'S LAW (weak scaling -- problem size GROWS with N)
# ScaledSpeedup(N) = S + N*(1-S)   (approximately)
# -- grows roughly LINEARLY with N, not capped at 1/S
#
# Example: S = 0.25, N = 100 processors, problem scaled to fit:
#   ScaledSpeedup = 0.25 + 100*0.75 = 75.25x
#   -- far beyond Amdahl's 4x ceiling, because the problem
#      itself grew 100x along with the processor count.

# The two aren't in conflict -- they answer different
# questions: "same job, faster?" (Amdahl) vs. "more
# processors, more work done?" (Gustafson).`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A team scales their stateless API tier from 4 servers to 400 servers to handle 100x more DAILY ACTIVE USERS (not to process the same fixed batch of requests faster). A colleague argues "Amdahl\'s Law says this won\'t help much if 25% of our request path is serial — you\'re capped at 4x speedup." Is Amdahl\'s Law the right lens for this scenario?',
    hint: 'Is the total WORKLOAD staying fixed while you add processors (Amdahl\'s assumption), or is the workload GROWING along with the number of servers (Gustafson\'s assumption)?',
    solution: 'No — this scenario is a textbook case for Gustafson\'s Law, not Amdahl\'s. The team isn\'t trying to process a FIXED amount of work faster with more servers (Amdahl\'s strong-scaling assumption); they\'re handling a GROWING workload (100x more users) with a proportionally larger number of servers (weak scaling) — exactly the scenario Gustafson\'s Law describes. Amdahl\'s 4x ceiling applies to "same job, more processors, done faster" — it says nothing about the very different question of "more processors, proportionally more DIFFERENT work done in the same time," which is what horizontal scaling for user growth actually looks like. The colleague\'s objection, while mathematically correct FOR AMDAHL\'S SCENARIO, is applying the wrong law to this situation.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'Amdahl\'s Law is the complete, universal answer to "how much does parallelism help," regardless of whether the workload is fixed or growing.',
      reality: 'Per this subtopic\'s theory (context added to the main page during this batch), Amdahl\'s Law specifically assumes a FIXED problem size (strong scaling) — Gustafson\'s Law describes the different, often more realistic scenario where the problem size grows along with the available processors (weak scaling).'
    },
    {
      thought: 'A serial bottleneck that caps speedup at, say, 4x under Amdahl\'s Law means adding more servers beyond that point is pointless for a horizontally-scaled system handling more users.',
      reality: 'Per this subtopic\'s theory, if the added servers are handling MORE users/data (a growing workload) rather than the SAME fixed workload faster, Gustafson\'s Law — not Amdahl\'s — is the relevant model, and the achievable scaled speedup is far less pessimistic.'
    },
    {
      thought: 'Amdahl\'s Law and Gustafson\'s Law contradict each other, so only one can be "correct."',
      reality: 'Per this subtopic\'s theory, they don\'t conflict — they answer different questions (fixed-size speedup vs. scaled-workload speedup) and are both valid within their own assumptions; the skill is recognizing which one actually describes the scaling scenario you\'re reasoning about.'
    }
  ];
}
