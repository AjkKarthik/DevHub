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
  templateUrl: './cumulative-flow-diagrams-reveal-the-bottleneck.html',
  styleUrl: './cumulative-flow-diagrams-reveal-the-bottleneck.scss'
})
export class CumulativeFlowDiagramsRevealTheBottleneckSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page names the Cumulative Flow Diagram once, in a bullet list, and never explains how to read one',
      points: [
        'The main page\'s own Kanban theory lists "Key metrics: Cycle Time (in-progress to done), Lead Time (backlog to done), Throughput (items/week), Cumulative Flow Diagram" — three of the four items get a parenthetical explanation; the fourth, Cumulative Flow Diagram (CFD), gets none at all. It is the only named metric on the entire page with zero explanation of what it actually shows or how to read it.',
        'A CFD plots, per its own standard construction, the cumulative count of items in each workflow stage over time — the X-axis is time, the Y-axis is item count, and each colored band represents one column on the board (Backlog, In Progress, Done, etc.), stacked so the top of each band shows the running total that has ever entered that stage.',
        'The single most useful thing a CFD shows, and the thing its bare mention on the main page skips entirely: "the vertical distance between two adjacent bands at any point shows the number of items in that stage" — meaning WIP for any given column, at any point in time, is directly readable off the chart as the gap between two lines, without needing a separate WIP count at all.',
      ]
    },
    {
      heading: 'What the shape of the bands actually tells you — the part that makes a CFD worth learning to read',
      points: [
        'A CFD\'s bands are not just a WIP readout — their SHAPE over time is a diagnostic tool. Per standard Kanban analytics: "widening bands indicate a bottleneck... the entry rate of items to this state is faster than its exit rate," while "parallel bands indicate a steady workflow" and "narrowing bands highlight potential underutilization."',
        'This connects directly to two things the main page already covers without connecting them to the CFD: the main page\'s own "No WIP limits on the Kanban board" mistake entry describes exactly the symptom a widening "In Progress" band would show on a CFD (work piling up, nothing finishing) — and it connects directly to this hub\'s own Little\'s Law subtopic, since a widening band is the VISUAL signature of the exact "WIP growing while throughput stays flat" scenario that breaks Little\'s Law\'s steady-state assumption.',
        'In other words: a CFD is the tool that would let a team NOTICE the growing-WIP problem before trusting a misleading Little\'s Law calculation — reading the chart\'s shape (is any band widening?) is a faster, visual way to catch the exact precondition violation this hub\'s own Little\'s Law subtopic explains mathematically.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Reading a healthy CFD -- parallel bands',
      language: 'bash',
      code: `# A Cumulative Flow Diagram is built from one number per column,
# per day: the running TOTAL of items that have ever entered that
# column (not the current count -- the CUMULATIVE count).

# Week    Backlog(total)  InProgress(total)  Done(total)
# 1        50               10                 0
# 2        55               15                 5
# 3        60               20                 12
# 4        65               25                 20
# 5        70               30                 28

# Plotted as stacked cumulative lines, the GAP between adjacent
# lines at any given week = the WIP in that stage at that time:
#   Week 5: InProgress WIP = 30 - 28 = 2 items actually "in progress"
#   Week 5: Backlog WIP    = 70 - 30 = 40 items waiting

# Per this subtopic's theory: "parallel bands indicate a steady
# workflow" -- here, Backlog, InProgress, and Done are all growing
# at roughly the same rate week over week. The gaps between the
# lines stay roughly CONSTANT -- this is what a healthy flow looks
# like on a CFD.`,
    },
    {
      label: 'Reading an unhealthy CFD -- a widening band',
      language: 'bash',
      code: `# Same three columns, but "In Progress" is now a bottleneck --
# items enter it faster than they leave:

# Week    Backlog(total)  InProgress(total)  Done(total)
# 1        50               10                 0
# 2        55               20                 3
# 3        60               32                 6
# 4        65               46                 9
# 5        70               62                 12

# Gap between InProgress and Done (= WIP currently "in progress"):
#   Week 1: 10 - 0  = 10
#   Week 2: 20 - 3  = 17
#   Week 3: 32 - 6  = 26
#   Week 4: 46 - 9  = 37
#   Week 5: 62 - 12 = 50

# Per this subtopic's theory: "widening bands indicate a bottleneck
# ... the entry rate of items to this state is faster than its exit
# rate." The gap between InProgress and Done is GROWING every single
# week -- exactly the visual signature of the "arrivals exceed
# departures" condition that also breaks Little's Law's own
# steady-state assumption (see this hub's own Little's Law subtopic).
# A team watching this CFD would see the widening gap and know to
# investigate the In Progress column specifically, well before
# a single WIP/Throughput lead-time number alone would reveal it.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A team\'s CFD shows three bands: Backlog, Code Review, and Done. Over the last six weeks, the gap between the Backlog line and the Code Review line has stayed roughly constant, but the gap between the Code Review line and the Done line has been steadily growing each week. Using this subtopic\'s theory, identify which specific workflow stage is the bottleneck, and explain what a team should investigate first, based purely on reading the chart\'s shape.',
    hint: 'Per this subtopic\'s theory, what does the vertical GAP between two adjacent bands represent, and what does a WIDENING gap specifically indicate about the entry vs. exit rate of that stage?',
    solution: 'The bottleneck is the Code Review stage specifically, not Backlog or the overall pipeline broadly. Per this subtopic\'s theory, "the vertical distance between two adjacent bands at any point shows the number of items in that stage" — so the gap between the Code Review line and the Done line represents WIP currently sitting IN code review, waiting to be merged and marked done. Since this specific gap has been growing steadily while the Backlog-to-Code-Review gap stayed flat, per this subtopic\'s theory this matches the pattern where "widening bands indicate a bottleneck... the entry rate of items to this state is faster than its exit rate" — items are entering code review (from the stable, unchanged Backlog-to-CodeReview flow) faster than they are being reviewed and merged out into Done. A team should investigate code review specifically — likely causes include too few reviewers, reviews being deprioritized against other work, or PRs being too large to review quickly — rather than looking at backlog grooming or upstream planning, since the CFD\'s shape already localizes the problem to one specific stage before any deeper investigation is needed.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'A Cumulative Flow Diagram is just a visual way to show the same throughput and cycle time numbers a team could already get from other reports — reading the shape of the bands doesn\'t reveal anything the other metrics don\'t already show.',
      reality: 'This subtopic\'s theory and second code example show a CFD reveals something the other metrics do not surface directly: WHICH SPECIFIC STAGE is the bottleneck, visible as a widening band, before that bottleneck necessarily shows up as a bad aggregate cycle-time or lead-time number. It localizes a flow problem to a specific column, which a single throughput or cycle-time figure cannot do on its own.'
    },
    {
      thought: 'The gap between two lines on a Cumulative Flow Diagram is hard to interpret without specialized training — it takes deep expertise to extract useful information from the chart.',
      reality: 'This subtopic\'s theory shows the interpretation is a small, learnable set of rules: the vertical gap between two adjacent bands is that stage\'s current WIP; parallel bands mean steady flow; a widening band means a bottleneck (entries outpacing exits); a narrowing band means underutilization. All four rules are directly stated and require no specialized statistical background to apply.'
    },
    {
      thought: 'A Cumulative Flow Diagram and Little\'s Law are unrelated Kanban concepts covering different topics — one is a chart, the other is a formula.',
      reality: 'This subtopic\'s theory connects them directly: a widening band on a CFD is the visual signature of the exact "WIP growing while throughput stays flat" condition that this hub\'s own Little\'s Law subtopic identifies as breaking that formula\'s steady-state assumption. Reading a CFD\'s shape is a faster, visual way to catch the same precondition violation Little\'s Law\'s own math depends on.'
    }
  ];
}
