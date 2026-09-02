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
    heading: 'The Failure Mode the Page Names but Never Catches in Code',
    points: [
      'The page’s own theory states plainly: "Track completion in the incident tracker." Its own QnA on writing postmortems separately lists "not tracking action item completion" as one of the common mistakes teams make. Neither section shows what tracking actually looks like — and the postmortem’s own action items table, with four real owners and four real due dates, is never checked against anything.',
      'A minimal classifier applied to that SAME real table — given a simulated "today" and a list of which actions have actually been marked done — correctly separates completed, on-track, due-soon, and OVERDUE items. Verified directly: with one item (Bob’s retry-backoff unit test, due 2024-01-22) marked complete and "today" simulated as 2024-01-25, Alice’s Stripe-429-alert item (also due 2024-01-22, but never marked complete) is the one and only item correctly flagged overdue.',
      'The genuinely easy failure mode this surfaces isn’t a coding problem — it’s that TWO of the postmortem’s four action items share the exact same due date (2024-01-22), and only tracking them as a flat unordered list makes it easy for one to quietly get done while the other is silently missed, exactly the scenario this subtopic’s own worked example reproduces.',
    ],
  },
];

const codeTabs: CodeTab[] = [
  {
    label: 'Classifying the Postmortem\'s Own Action Items',
    language: 'typescript',
    code: `interface ActionItem {
  action: string;
  owner: string;
  due: string; // ISO date
}

type ActionStatus = 'completed' | 'OVERDUE' | 'due soon' | 'on track';

interface ClassifiedActionItem extends ActionItem {
  status: ActionStatus;
}

function classifyActionItems(
  items: ActionItem[],
  todayISO: string,
  completedActions: string[]
): ClassifiedActionItem[] {
  const today = new Date(todayISO);
  return items.map((item) => {
    const dueDate = new Date(item.due);
    const isCompleted = completedActions.includes(item.action);
    let status: ActionStatus;
    if (isCompleted) status = 'completed';
    else if (dueDate < today) status = 'OVERDUE';
    else if ((dueDate.getTime() - today.getTime()) / 86_400_000 <= 3) status = 'due soon';
    else status = 'on track';
    return { ...item, status };
  });
}

// The postmortem's own real action items table
const actionItems: ActionItem[] = [
  { action: 'Add Stripe rate limit test in staging load suite',            owner: 'alice',   due: '2024-01-29' },
  { action: 'Add retry-with-backoff unit test for all payment clients',    owner: 'bob',     due: '2024-01-22' },
  { action: 'Review all retry implementations for missing Retry-After',    owner: 'charlie', due: '2024-02-05' },
  { action: 'Add alert for Stripe 429 response rate spike',                owner: 'alice',   due: '2024-01-22' },
];

// Simulate "today" = 2024-01-25 -- only Bob's item has been marked done
const result = classifyActionItems(actionItems, '2024-01-25', [
  'Add retry-with-backoff unit test for all payment clients',
]);

result.forEach((item) => console.log(\`\${item.owner}: \${item.status} (due \${item.due})\`));
// -> alice: on track (due 2024-01-29)
// -> bob: completed (due 2024-01-22)
// -> charlie: on track (due 2024-02-05)
// -> alice: OVERDUE (due 2024-01-22)`,
  },
];

const exercise: TryItExercise = {
  prompt:
    'Bob’s and Alice’s Stripe-alert action items share the identical due date (2024-01-22) — but only Bob’s got marked complete by "today." If this tracker only reported a single aggregate count ("3 of 4 action items on track or complete") rather than classifying each item individually, would that summary still correctly surface the problem?',
  hint: 'Compute what that aggregate count/percentage would actually say, and consider whether it draws attention to WHICH item is the problem.',
  solution: `// A pure aggregate count technically wouldn't be WRONG -- 3 of 4
// items (75%) are indeed either completed or still comfortably on
// track -- but it would completely bury the one item that actually
// needs attention. "75% on track" reads as a healthy status, and
// nothing about that single number distinguishes "the 1 remaining
// item is due next month, no rush" from "the 1 remaining item was due
// three days ago and nobody has touched it," which is exactly the
// difference between Alice's on-track item (due 01-29) and her
// OVERDUE one (due 01-22) in this exact data.
//
// The per-item classification this subtopic builds is what actually
// makes the "not tracking action item completion" failure mode
// visible and actionable -- an aggregate percentage is the kind of
// summary that looks reassuring right up until the same root cause
// recurs because the one action that would have prevented it quietly
// never got done.`,
};

const misconceptions: Misconception[] = [
  {
    thought: 'Since <code>classifyActionItems</code> takes a hardcoded list of completed action NAMES as a parameter, this is really just a toy simulation with no connection to how a real incident tracker would work.',
    reality: 'The SHAPE is deliberately realistic, even though this demo hardcodes the completed-items list for the sake of a self-contained, reproducible example — a real incident tracker (Jira, Linear, an internal tool) already stores exactly this information as a boolean or status field per ticket, and exposing it as a simple list of completed identifiers (as this function’s parameter does) is a natural, minimal interface for a script or dashboard querying that tracker’s API to classify items the same way.',
  },
  {
    thought: 'An item due in exactly 3 days is correctly classified as "due soon" by the <code>(dueDate.getTime() - today.getTime()) / 86_400_000 <= 3</code> check — but an item due in exactly 3.5 days would fall into the SAME "due soon" bucket, since the check rounds fractional days down.',
    reality: 'The check doesn’t round at all — it compares the raw difference in DAYS (as a floating-point number) directly against <code>3</code>, so an item 3.5 days away genuinely evaluates to <code>3.5 <= 3</code>, which is <code>false</code>, correctly landing it in "on track" instead of "due soon." The classifier’s day-boundary behavior depends entirely on the exact TIME component of both dates, not just their calendar-day difference — two dates that are "3 days apart" by calendar count but include a partial-day offset (e.g. one timestamped at midnight, the other at noon) can straddle the <code><= 3</code> boundary in either direction.',
  },
];

@Component({
  selector: 'app-obs-oncall-action-tracker',
  standalone: true,
  imports: [CommonModule, SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent,
    CodeBlockComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './tracking-postmortem-action-items-to-completion.html',
  styleUrl: './tracking-postmortem-action-items-to-completion.scss',
})
export class TrackingPostmortemActionItemsToCompletionSubtopic {
  theory = theory;
  codeTabs = codeTabs;
  exercise = exercise;
  misconceptions = misconceptions;
}
