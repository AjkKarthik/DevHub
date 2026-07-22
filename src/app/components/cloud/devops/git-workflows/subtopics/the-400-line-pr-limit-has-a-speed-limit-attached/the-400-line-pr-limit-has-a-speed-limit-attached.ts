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
  templateUrl: './the-400-line-pr-limit-has-a-speed-limit-attached.html',
  styleUrl: './the-400-line-pr-limit-has-a-speed-limit-attached.scss'
})
export class The400LinePrLimitHasASpeedLimitAttachedSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page states the 400-line threshold as an isolated fact — the study behind it measured size and PACE together',
      points: [
        'The main page\'s own Branch Protection & PR Reviews theory states, as a standalone fact: "PR size matters: PRs over 400 lines of change have significantly lower review effectiveness." No source is named, and no companion condition is attached — the number reads as a fixed, unconditional ceiling.',
        'The number traces to a specific, real study: a 10-month collaboration between SmartBear Software and Cisco Systems\' MeetingPlace product group (2005–2006), examining roughly 2,500 code reviews across 3.2 million lines of code using SmartBear\'s Code Collaborator tool — one of the largest empirical studies of code review practice ever conducted.',
        'SmartBear\'s own published guidance from that research states the finding with a SECOND number attached that the main page never mentions: "Inspection rates should [stay] under 500 LOC per hour" — the 400-line ceiling and the review-speed ceiling are reported together, not as two separate, independent facts.',
      ]
    },
    {
      heading: 'What the missing half of the finding actually says',
      points: [
        'The full result, per SmartBear\'s own summary: "A review of 200-400 LOC over 60 to 90 minutes should yield 70-90% defect discovery" — meaning a properly conducted review at that pace finds 7 to 9 of every 10 existing defects. The 400-line number is not a magic threshold on its own; it is the SIZE half of a SIZE-and-TIME pairing the study actually measured together.',
        'This means a 400-line PR reviewed in 10 minutes (well under the recommended 60–90 minute window, and far above the 500 LOC/hour pace ceiling) would not be expected to achieve the study\'s own 70–90% defect-detection yield — the main page\'s own advice to "split large changes into stacked PRs" addresses the SIZE half of the finding, but a team could follow that advice to the letter and still get a low-yield review if reviewers rush through even a properly-sized 400-line PR in a few minutes.',
        'Applied practically: a PR-size limit alone (the main page\'s own recommendation) is an incomplete implementation of the study\'s actual finding — a team serious about the review-effectiveness benefit this number is meant to protect would also need some equivalent discipline around review PACE (e.g. a soft guideline that a 300-line PR should take a reviewer somewhere in the neighborhood of 45–70 minutes, not be rubber-stamped in 5), not just a hard cap on diff size.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'The main page\'s own advice -- addresses only the SIZE half',
      language: 'bash',
      code: `# Matches the main page's own theory bullet exactly:
#
# "PR size matters: PRs over 400 lines of change have significantly
#  lower review effectiveness. Split large changes into stacked PRs."

# A team implements this literally -- a CI check that blocks any
# PR over 400 changed lines:

# .github/workflows/pr-size-check.yml
name: PR Size Check
on: pull_request
jobs:
  size-check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Check diff size
        run: |
          LINES_CHANGED=$(git diff --shortstat origin/\${{ github.base_ref }} | \\
            awk '{print $4+$6}')
          if [ "$LINES_CHANGED" -gt 400 ]; then
            echo "PR exceeds 400 lines ($LINES_CHANGED) -- please split"
            exit 1
          fi

# This enforces the SIZE half of the finding -- every PR is now
# under 400 lines. But nothing here says anything about how FAST a
# reviewer actually goes through those (up to) 400 lines.`,
    },
    {
      label: 'The missing PACE half -- what the actual study measured',
      language: 'bash',
      code: `# Per SmartBear's own published summary of the Cisco study:
#
#   Size ceiling:  200-400 LOC per review session
#   Pace ceiling:  under 500 LOC per hour
#   Result:        "A review of 200-400 LOC over 60 to 90 minutes
#                    should yield 70-90% defect discovery"
#
# The 400-line number and the 500-LOC/hour pace were measured
# TOGETHER -- the 70-90% defect-detection yield is what happens
# when BOTH conditions hold, not from the size limit alone.

# A 380-line PR (comfortably under the main page's own 400-line
# check) reviewed like this:
#
#   Reviewer opens PR at 2:58pm, has a 3:00pm meeting.
#   Skims the diff, approves at 3:00pm.
#   Elapsed time: ~2 minutes for 380 lines
#              = ~11,400 LOC/hour effective pace
#              -- more than 22x the study's own 500 LOC/hour ceiling
#
# This PR technically satisfies the main page's own size rule, but
# is nowhere near the pace the 70-90% defect-yield figure actually
# describes. The size limit alone provides no guarantee about
# review quality if the PACE half of the same finding is ignored.

# A team implementing BOTH halves might add a soft team norm
# alongside the automated size check:
# "Budget roughly 1 minute of review time per 5-7 lines changed
#  (targeting the ~200-400 LOC / 60-90 min range) -- a 380-line
#  PR reviewed in under 15 minutes probably wasn't reviewed at the
#  pace the size limit was chosen to support."`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A team implements exactly the main page\'s own advice: a CI check blocking any PR over 400 changed lines. Six months later, they notice their post-release defect rate hasn\'t improved much, even though every merged PR has technically complied with the 400-line rule the whole time. A retro reveals most PRs get approved within 5-10 minutes of being opened, regardless of size. Using this subtopic\'s theory, explain why the 400-line rule alone did not produce the review-effectiveness benefit the team expected, and what specifically should be added to their process.',
    hint: 'Per this subtopic\'s theory, does the 70-90% defect-detection yield the "400 lines" number is associated with come from the size limit ALONE, or from the size limit COMBINED with a specific review pace (LOC per hour)? Is a 5-10 minute review of a 400-line PR anywhere near that pace?',
    solution: 'The 400-line rule alone did not produce the expected benefit because, per this subtopic\'s theory, the actual study\'s "70-90% defect discovery" finding came from BOTH the size ceiling (200-400 LOC) AND a pace ceiling ("under 500 LOC per hour," with the recommended session length being 60-90 minutes) held together — not from the size limit in isolation. A 400-line PR approved in 5-10 minutes implies an effective review pace of roughly 2,400 to 4,800 LOC per hour, several times faster than the study\'s own 500 LOC/hour ceiling — nowhere close to the pace the 70-90% defect-detection figure actually describes, even though every single PR technically satisfied the team\'s 400-line size rule. What should be added, per this subtopic\'s theory, is a pace-side discipline alongside the existing size check — for example, a team norm (not necessarily automated) suggesting reviewers budget review time roughly proportional to PR size, targeting something in the neighborhood of the study\'s own 200-400 LOC over 60-90 minutes range, so that satisfying the size rule and actually reviewing at a defect-catching pace become linked practices rather than one being enforced while the other is silently ignored.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'The "400 lines" PR-size guidance is a general best-practice rule of thumb with no specific empirical source — a reasonable-sounding number teams use because it feels about right.',
      reality: 'This subtopic\'s theory traces the number to a specific, real study: a 10-month SmartBear/Cisco collaboration examining roughly 2,500 code reviews across 3.2 million lines of code — one of the largest empirical studies of code review practice conducted, not an arbitrary convention.'
    },
    {
      thought: 'Keeping every PR under 400 changed lines, by itself, is sufficient to achieve the review-effectiveness benefit (high defect-detection rate) associated with that number.',
      reality: 'This subtopic\'s exercise shows the size limit alone provides no guarantee — the study\'s own "70-90% defect discovery" figure came from the 200-400 LOC size range COMBINED with a review pace under 500 LOC/hour over a 60-90 minute session. A correctly-sized PR reviewed in a few rushed minutes does not achieve the yield the size number is associated with.'
    },
    {
      thought: 'Review pace (how fast a reviewer goes through a PR) and PR size are two unrelated concerns — a team can address code review effectiveness by picking either one to focus on.',
      reality: 'This subtopic\'s theory shows the original study measured these two dimensions TOGETHER, not as independent, separately-addressable concerns — the defect-detection yield the "400 lines" number is famous for is a joint property of size AND pace, and optimizing only one without regard for the other does not reproduce the finding\'s actual benefit.'
    }
  ];
}
