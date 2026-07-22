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
  templateUrl: './littles-law-assumes-a-steady-state.html',
  styleUrl: './littles-law-assumes-a-steady-state.scss'
})
export class LittlesLawAssumesASteadyStateSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page applies Little\'s Law as a plug-and-compute formula — the formula has a precondition the main page never states',
      points: [
        'The main page\'s own code tab defines littlesLaw(wip, throughput) as a one-line division: wip / throughput, and its QnA states plainly: "Little\'s Law: Lead Time = WIP / Throughput. If a team completes 5 items/week and has 20 in progress, average lead time is 4 weeks." Both treat the formula as universally applicable to any WIP/throughput snapshot.',
        'Little\'s Law comes from queueing theory, and its own mathematical derivation requires the system to be in STEADY STATE — over the observation period, "the arrival rate and departure rate of items into and out of the system remain consistent." This is not a minor footnote; it is the precondition the formula\'s own derivation depends on to be valid at all.',
        'The practical consequence, per the same body of queueing theory: "if the arrival rate exceeds the service rate, the queue grows without bound" — a system where WIP is currently GROWING (more items arriving than the team is completing) is, by definition, not in steady state, and Little\'s Law\'s simple WIP/Throughput division does not correctly predict lead time for such a system.',
      ]
    },
    {
      heading: 'Why a growing backlog makes the naive formula actively misleading, not just imprecise',
      points: [
        'Applied naively to a growing-WIP team: today\'s throughput (items completed this week) reflects the team\'s CURRENT completion rate, but today\'s WIP already includes a backlog that outpaces that rate — meaning the WIP/Throughput calculation is dividing a swollen numerator by a throughput figure that will need to keep pace with an ALREADY-GROWING queue, not a stable one. The result understates true future lead time, because it implicitly assumes today\'s throughput will be sufficient to clear today\'s WIP at a constant rate — an assumption a growing backlog directly contradicts.',
        'This connects directly to the main page\'s own WIP-limit theory ("WIP limits per column force the team to finish work before starting new items") — WIP limits are not just a productivity nudge, they are what keeps a Kanban system close enough to steady state for Little\'s Law\'s own WIP/Throughput calculation to remain a trustworthy lead-time estimate in the first place. A team that abandons WIP limits and lets WIP grow unchecked is simultaneously breaking the precondition the metric it still relies on (Little\'s Law) depends on.',
        'The practical takeaway is not "stop using Little\'s Law" — it is "check whether WIP has been roughly flat over the measurement window before trusting the calculation," and if WIP is visibly climbing, treat the WIP/Throughput number as an optimistic floor on lead time, not an accurate forecast, until the trend stabilizes.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'The main page\'s own formula -- applied to a genuinely stable system',
      language: 'typescript',
      code: `// Matches the main page's own littlesLaw function exactly.
function littlesLaw(wip: number, throughput: number): number {
  return wip / throughput;
}

// A team whose WIP has been roughly FLAT for the last 8 weeks --
// items arrive at about the same rate the team completes them.
// This is close to steady state -- per queueing theory, Little's
// Law's own precondition ("the arrival rate and departure rate of
// items into and out of the system remain consistent") is satisfied.

const stableWip = 20;          // roughly constant week over week
const stableThroughput = 5;    // items/week, also roughly constant

console.log(\`Lead time: \${littlesLaw(stableWip, stableThroughput)} weeks\`); // 4
// This 4-week estimate is trustworthy -- the system it describes
// is actually behaving the way the formula assumes.`,
    },
    {
      label: 'The same formula, applied to a GROWING backlog -- misleading',
      language: 'typescript',
      code: `// Same formula, same function -- but the input data now comes
// from a team whose WIP has been climbing for weeks:

// Week 1: WIP = 20, completed 5 items that week
// Week 4: WIP = 35, completed 5 items that week (throughput UNCHANGED)
// Week 8: WIP = 55, completed 5 items that week (throughput UNCHANGED)

const growingWip = 55;
const sameThroughput = 5; // measured this week, same as always

console.log(\`Lead time: \${littlesLaw(growingWip, sameThroughput)} weeks\`); // 11
// The formula still RUNS and produces a number -- 11 weeks -- but
// per this subtopic's theory, this number is misleading, not just
// imprecise: the team has been completing 5/week for 8 straight
// weeks while WIP kept climbing (arrivals > departures the entire
// time). Per queueing theory's own stability condition -- "if the
// arrival rate exceeds the service rate, the queue grows without
// bound" -- this system is NOT in steady state, and there is no
// guarantee the NEXT item added today will actually clear in 11
// weeks; if the arrival rate stays above 5/week, WIP keeps growing
// and the TRUE future lead time keeps getting worse than whatever
// the formula reports today.

// The real signal here isn't "lead time is 11 weeks" -- it's
// "WIP has nearly tripled in 8 weeks while throughput sat flat --
// the team is falling behind, and no single WIP/Throughput snapshot
// captures that trend."`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A team\'s dashboard, using the main page\'s own littlesLaw(wip, throughput) function, reports "Lead Time: 6 weeks" every single week for the past two months — a number that never seems to change. A closer look at the underlying data shows WIP has actually grown from 30 to 54 items over that same period, while weekly throughput has stayed flat at 9 items/week. Using this subtopic\'s theory, explain why the dashboard\'s stable-looking "6 weeks" figure is itself a red flag rather than reassuring news, and what it is actually hiding.',
    hint: 'Per this subtopic\'s theory, what does Little\'s Law\'s own formula assume about the relationship between how WIP is trending and how throughput is trending? If WIP is climbing every week while throughput sits flat, is the system anywhere close to the steady state the formula requires?',
    solution: 'The stable-looking "6 weeks" figure is misleading precisely because the underlying system is NOT in steady state, per this subtopic\'s theory — WIP climbing from 30 to 54 while throughput stays flat at 9/week means arrivals have been consistently outpacing departures (54-30=24 more items arrived than were absorbed by the flat completion rate over that window), which is exactly the "arrival rate exceeds the service rate" condition that queueing theory identifies as causing "the queue [to grow] without bound." The dashboard\'s WIP/Throughput division (30/9 ≈ 3.3 weeks at the start, 54/9 = 6 weeks now) is technically recalculating correctly each week — the number moving from roughly 3.3 to 6 IS reflecting the growing WIP — but each individual weekly snapshot still implicitly assumes throughput will hold steady long enough to clear the CURRENT backlog, an assumption directly contradicted by the fact that throughput has already failed to keep pace for two straight months. What the stable-looking, week-after-week "6 weeks" actually hides, per this subtopic\'s theory, is that the true expected wait time for an item added TODAY keeps getting worse each week, since WIP keeps growing — the formula\'s own output should be read as a moving, worsening floor on lead time, not a settled, trustworthy forecast, until throughput visibly catches up to arrivals and WIP stops climbing.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'Little\'s Law\'s Lead Time = WIP / Throughput formula is a universal calculation that produces an accurate lead-time estimate for any team\'s current WIP and throughput numbers, regardless of how those numbers have been trending.',
      reality: 'This subtopic\'s theory shows the formula depends on a steady-state precondition — "the arrival rate and departure rate of items into and out of the system remain consistent." Applied to a system with growing WIP (arrivals outpacing departures), the formula still computes a number, but that number understates the true, worsening future lead time.'
    },
    {
      thought: 'If a team\'s Little\'s Law lead-time calculation stays roughly the same number week over week, that is reassuring evidence the team\'s delivery pipeline is healthy and predictable.',
      reality: 'This subtopic\'s exercise shows the opposite can be true — a slowly climbing (not flat) lead-time number, driven by WIP growing while throughput stays fixed, is itself the signal of an unstable, worsening system, not a healthy one. The number climbing is exactly what queueing theory predicts for an arrivals-exceed-departures system, and should be read as a warning trend, not noise.'
    },
    {
      thought: 'WIP limits are primarily a productivity technique for reducing multitasking — they have no particular connection to whether metrics like Little\'s Law\'s lead-time estimate can be trusted.',
      reality: 'This subtopic\'s theory connects the two directly: WIP limits are what keep a Kanban system close enough to the steady state Little\'s Law\'s own formula requires. A team that lets WIP grow unchecked is simultaneously undermining the productivity benefit of limited WIP AND invalidating the precondition its own lead-time forecasting formula depends on.'
    }
  ];
}
