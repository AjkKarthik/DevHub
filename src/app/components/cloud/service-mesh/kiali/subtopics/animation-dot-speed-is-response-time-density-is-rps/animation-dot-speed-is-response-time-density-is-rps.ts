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
  templateUrl: './animation-dot-speed-is-response-time-density-is-rps.html',
  styleUrl: './animation-dot-speed-is-response-time-density-is-rps.scss'
})
export class AnimationDotSpeedIsResponseTimeDensityIsRpsSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'A genuine inaccuracy caught during this batch: speed and density were conflated',
      points: [
        'The main page originally stated: "animated dots move along edges at a speed proportional to RPS." Verified against Kiali\'s own documented graph semantics, this has the two visual signals backwards — dot SPEED and dot DENSITY encode two DIFFERENT metrics, and RPS is not the one speed represents. The main page has been corrected.',
      ]
    },
    {
      heading: 'The reality: speed = response time, density = request rate',
      points: [
        'Dot <strong>speed</strong> (how fast an individual dot travels along the edge) represents <strong>response time</strong> — faster-moving dots mean faster responses; slower-moving dots mean slower responses. This is the OPPOSITE intuition from what "speed = RPS" would suggest (where a busy, high-traffic edge might seem like it should show "fast" dots).',
        'Dot <strong>density</strong> (how tightly packed the dots are along the edge, i.e. how frequently new dots appear) is what actually represents <strong>request rate (RPS)</strong> — a high-traffic edge shows many dots close together; a low-traffic edge shows a few dots spaced far apart.',
        'Shape also carries meaning the main page didn\'t specify: successful HTTP requests render as circles, while errors render specifically as red DIAMONDS (not just "red dots" of the same shape) — a distinct visual signal on top of color alone.',
      ]
    },
    {
      heading: 'Why the correct mental model matters for actually reading the graph',
      points: [
        'With the WRONG mental model (speed = RPS), a viewer watching a busy, high-traffic edge with FAST-moving dots might reasonably (but incorrectly) read "fast dots" as confirming high traffic — when fast dots actually mean the service is responding quickly, and it\'s the DENSITY of those fast dots that confirms the high traffic.',
        'A genuinely useful diagnostic pattern this correct model enables: an edge showing DENSE but SLOW-moving dots is a strong, at-a-glance visual signal of "high traffic AND high latency together" — exactly the kind of edge worth investigating first during an incident, and a pattern the wrong (speed = RPS) mental model would not let a viewer correctly recognize.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Reading the graph correctly: four distinct traffic patterns',
      language: 'bash',
      code: `# Correct interpretation of Kiali's traffic animation,
# now that speed and density are correctly understood:

# Sparse + fast dots:
#   Low RPS, fast responses -- healthy, low-traffic edge.

# Dense + fast dots:
#   High RPS, fast responses -- healthy, high-traffic edge.
#   (This is what a viewer using the WRONG "speed = RPS"
#    model would have mistakenly read as "fast = busy" --
#    it's actually the density telling you that, not speed.)

# Sparse + slow dots:
#   Low RPS, slow responses -- a low-traffic path with a
#   latency problem worth investigating even though total
#   volume is small.

# Dense + slow dots:
#   High RPS AND slow responses together -- the highest-
#   priority edge to investigate during an incident: a
#   busy path that's also degraded.

# Red diamonds anywhere (regardless of speed/density):
#   Errors on that edge -- distinct shape, not just color,
#   from the green circles used for successful requests.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'During an incident, an engineer watching the Kiali service graph notices one edge with dots moving noticeably SLOWER than all the other edges, but with roughly the same visual density (spacing) as the healthy edges around it. Based on the main page\'s original (now-corrected) claim that speed represents RPS, they conclude this edge simply has lower traffic than its neighbors and move on to investigate a busier-looking edge instead. Was this the right call?',
    hint: 'What does dot SPEED actually represent, independent of density — and does a slow-moving-but-similarly-dense edge indicate a traffic problem or something else?',
    solution: 'This was very likely the wrong call. Dot speed represents response time, not RPS — since the density (which DOES represent RPS) was roughly the same as the healthy neighboring edges, this edge has SIMILAR traffic volume but is responding SLOWER than the others. That is a latency problem on that specific edge, not a low-traffic non-issue. The engineer, using the corrected mental model, should have prioritized investigating this exact edge rather than moving on to a busier-looking (but not necessarily slower) one — a dense-and-slow or even sparse-and-slow edge is a genuine "something is degraded here" signal that a speed-as-RPS misreading would cause someone to overlook.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'The speed of dots animating along a Kiali service graph edge represents the request rate (RPS) on that edge — faster dots mean busier traffic.',
      reality: 'Per this subtopic\'s theory (a genuine inaccuracy caught and corrected on the main page during this batch), dot SPEED actually represents response time (faster dots = faster responses), while dot DENSITY is what represents request rate.'
    },
    {
      thought: 'A slow-moving dot animation on an edge, by itself, indicates that edge has low traffic volume.',
      reality: 'Per this subtopic\'s theory, slow dot speed indicates slow RESPONSE TIME, independent of traffic volume — an edge can show slow-moving dots at high density (busy AND slow) or low density (quiet AND slow); speed alone says nothing about volume.'
    },
    {
      thought: 'Errors on the Kiali service graph are shown purely through color (red dots), the same shape as successful requests (green dots), just a different color.',
      reality: 'Per this subtopic\'s theory, errors render as a genuinely different SHAPE — red diamonds — distinct from the circles used for successful HTTP requests, not merely a color change on the same shape.'
    }
  ];
}
