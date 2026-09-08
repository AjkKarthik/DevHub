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
    heading: 'A Bounded Array Is Not the Same as a Sorted Top-N List',
    points: [
      'The main page names <code>$sort</code> as a <code>$push</code> modifier twice — once in a theory bullet ("Combined with $slice and $sort, you can maintain a bounded sorted array") and once in a quiz explanation, which describes the exact order MongoDB applies the modifiers: insert the new elements, sort the whole array, THEN slice it down to size. No codeTab anywhere on the page ever combines all three.',
      'This gap is concrete, not just theoretical: the main page\'s own Challenge is titled "Leaderboard with Bounded History," and its reference solution pushes each new score with <code>$each</code> and <code>$slice: -10</code> — but no <code>$sort</code> at all. That keeps the LAST 10 entries by insertion order (a recent-activity log), not the TOP 10 by score (an actual leaderboard) — two genuinely different arrays that happen to look similar until you push a high score early and a string of mediocre ones after it.',
      'Verified directly: pushing a new low score after the array already holds a high score, with <code>$slice</code> alone (no sort), can silently drop the high score once enough newer entries arrive — since "bounded by recency" and "bounded by value" produce different surviving elements for the exact same sequence of pushes.',
    ],
  },
];

const codeTabs: CodeTab[] = [
  {
    label: 'each + sort + slice, All Three Together',
    language: 'typescript',
    code: `const leaderboard = db.collection('leaderboard');

// A genuine top-10 leaderboard: the array is sorted by score BEFORE
// being trimmed, so it always holds the 10 HIGHEST scores, regardless
// of when each one was pushed.
await leaderboard.updateOne(
  { _id: leaderboardId },
  {
    \$push: {
      topScores: {
        \$each: [{ playerId, score, playedAt: new Date() }],
        \$sort: { score: -1 },   // sort by score, descending
        \$slice: 10,             // keep the top 10 AFTER sorting
      },
    },
  }
);

// Contrast -- the main page's own Challenge pattern: bounded, but
// NOT sorted by score. This keeps the 10 MOST RECENT entries, which
// is a genuinely different array from the code above.
await leaderboard.updateOne(
  { _id: leaderboardId },
  {
    \$push: {
      scoreHistory: {
        \$each: [{ playerId, score, playedAt: new Date() }],
        \$slice: -10, // keeps the last 10 by INSERTION order, no \$sort
      },
    },
  }
);`,
  },
];

const exercise: TryItExercise = {
  prompt:
    'A player scores 95 (a personal best) as the FIRST entry in an empty array. Over the next 12 games they score in the 40-60 range each time. With <code>topScores</code> (the $sort version, top 10 kept), is the 95 still in the array after all 12 pushes? What about with <code>scoreHistory</code> (the $slice-only version)?',
  hint: 'Trace what $sort does to the 95 relative to every 40-60 score BEFORE $slice ever runs — position in the sorted array matters more than position in insertion order.',
  solution: `// topScores ($sort: { score: -1 }, $slice: 10): YES, the 95 survives.
// After sorting descending, 95 is always the FIRST element regardless
// of how many lower scores get pushed later -- $slice: 10 only ever
// discards the LOWEST-ranked entries, and 95 is never among them as
// long as fewer than 10 OTHER scores exceed it.
//
// scoreHistory ($slice: -10, no $sort): NO, the 95 is gone after the
// 11th push. $slice: -10 keeps only the 10 MOST RECENTLY inserted
// elements regardless of value -- once 10 more games have been played
// after the 95, it falls outside the last-10 window and is dropped,
// even though it's still the player's best score ever.`,
};

const misconceptions: Misconception[] = [
  {
    thought: '$slice alone is basically "keep the best N entries" as long as you\'re consistently pushing in some reasonable order.',
    reality: '$slice has no concept of VALUE at all — it only knows POSITION in the array at the moment it runs. Without $sort ordering the array by value first, $slice: -10 keeps whatever happens to be in the last 10 positions, which is determined entirely by insertion order. A single early high value can be pushed out by any number of later low values, regardless of how the surrounding application logic might assume "the important ones stick around."',
  },
  {
    thought: 'Adding $sort to an existing $each + $slice update is a purely additive change with no other consequences.',
    reality: 'Adding $sort changes which N elements survive the SAME $slice value — a genuinely different query semantically, not just a refinement of the same one. Code depending on the OLD behavior (e.g., something reading scoreHistory expecting "the most recent 10 plays" for a recent-activity feed) would silently break if $sort were added later, since the array would now represent "the highest 10 scores" instead — the array\'s own meaning changes, not just its contents.',
  },
];

@Component({
  selector: 'app-mongo-update-push-sort-slice',
  standalone: true,
  imports: [CommonModule, SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent,
    CodeBlockComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './sorting-a-real-top-n-with-push-sort-slice-together.html',
  styleUrl: './sorting-a-real-top-n-with-push-sort-slice-together.scss',
})
export class SortingARealTopNWithPushSortSliceTogetherSubtopic {
  theory = theory;
  codeTabs = codeTabs;
  exercise = exercise;
  misconceptions = misconceptions;
}
