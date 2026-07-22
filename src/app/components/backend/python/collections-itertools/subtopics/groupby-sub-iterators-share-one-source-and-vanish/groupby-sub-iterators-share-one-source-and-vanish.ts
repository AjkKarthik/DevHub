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
  templateUrl: './groupby-sub-iterators-share-one-source-and-vanish.html',
  styleUrl: './groupby-sub-iterators-share-one-source-and-vanish.scss'
})
export class GroupbySubIteratorsShareOneSourceAndVanishSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'A groupby() group is a live view into the SAME source iterator — advancing to the next key silently invalidates it',
      points: [
        'The main page\'s own theory and QnA both correctly cover the well-known groupby gotcha: input must be pre-sorted by the grouping key, since groupby only groups consecutive matching elements. This is real and important — but it isn\'t the only sharp edge groupby has, and it\'s easy to assume that\'s the whole story once the sorting requirement is satisfied.',
        'Python\'s own itertools documentation states a second, distinct warning: "the returned group is itself an iterator that shares the underlying iterable with groupby(). Because the source is shared, when the groupby() object is advanced, the previous group is no longer visible. So, if that data is needed later, it should be stored as a list." Each (key, group) pair\'s group is not an independent, self-contained collection — it\'s a thin, lazy view into the SAME single stream groupby itself is reading from.',
        'This means the group for one key must be genuinely consumed (iterated, or converted with list(group)) BEFORE the outer for key, group in groupby(...) loop advances to the next key — moving on to request the next key silently drains/invalidates whatever was left unconsumed in the previous group, even though no exception is raised anywhere to signal this happened.',
      ]
    },
    {
      heading: 'Why this specific gotcha is easy to hit even with correctly pre-sorted data',
      points: [
        'The most common way this bites: storing the (key, group) pairs from a for loop into a list or dict for later use — groups_by_key = {k: g for k, g in groupby(sorted_data, key=keyfunc)} — intending to process each group afterward. By the time that dict comprehension finishes, every group object except the very last one has already been silently exhausted, since groupby only ever kept ONE group "live" at a time as it advanced through the shared source.',
        'The fix mirrors what Python\'s own documentation recommends directly: convert each group to a list immediately, inside the same loop iteration that produced it — groups_by_key = {k: list(g) for k, g in groupby(sorted_data, key=keyfunc)} — this eagerly drains each group into its own independent list before groupby moves on to the next key, completely sidestepping the shared-source problem.',
      ]
    }
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Storing groups without consuming them first — silently empty later',
      language: 'typescript',
      code: `from itertools import groupby

data = [("A", 1), ("A", 2), ("B", 3), ("B", 4), ("C", 5)]
data.sort(key=lambda x: x[0])   # correctly pre-sorted — the OTHER
                                  # groupby gotcha is not the issue here

# WRONG — storing the group ITERATORS for later use
stored_groups = {}
for key, group in groupby(data, key=lambda x: x[0]):
    stored_groups[key] = group   # stores the iterator, not its values

for key, group in stored_groups.items():
    print(key, list(group))
# A []      <- EMPTY! Already silently drained by the time 'B' was
# B []      <- reached in the ORIGINAL loop, since all groups share
# C [('C', 5)]   <- the same underlying source — only the LAST
                    #  group (C) still has anything left in it.`,
    },
    {
      label: 'The fix — consume each group into its own list immediately',
      language: 'typescript',
      code: `from itertools import groupby

data = [("A", 1), ("A", 2), ("B", 3), ("B", 4), ("C", 5)]
data.sort(key=lambda x: x[0])

# RIGHT — materialise each group into its own independent list
# INSIDE the same loop iteration that produced it.
stored_groups = {
    key: list(group)   # drains the shared source into a real list
    for key, group in groupby(data, key=lambda x: x[0])
}

for key, group in stored_groups.items():
    print(key, group)
# A [('A', 1), ('A', 2)]
# B [('B', 3), ('B', 4)]
# C [('C', 5)]
# Every group genuinely has its own independent data now, since
# each one was fully consumed BEFORE groupby moved on to the next key.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A function builds a report by first collecting all groups from a groupby() call into a dict (for key, group in groupby(sorted_orders, key=get_customer): customer_groups[key] = group), and only afterward, in a second pass, iterates customer_groups to compute each customer\'s total. Every customer except the very last one alphabetically shows a total of $0, even though the underlying sorted_orders data is confirmed correct and complete. Explain why, using what this subtopic covers.',
    hint: 'Per this subtopic\'s theory, what does a groupby() group object actually reference — an independent copy of that group\'s data, or a live view into the SAME shared source groupby itself is reading from? What happens to an unconsumed group\'s data once the OUTER loop moves on to request the next key?',
    solution: 'Every customer except the last shows a $0 total because the groups were stored as raw iterator objects, not consumed, before the outer for loop moved on to the next key — and per Python\'s own itertools documentation, "the returned group is itself an iterator that shares the underlying iterable with groupby()... when the groupby() object is advanced, the previous group is no longer visible." Each time the first loop advances to a new customer key, whatever was left unconsumed in the PREVIOUS customer\'s group silently becomes inaccessible, since all groups are just thin views into the one single shared stream of sorted_orders — nothing about this raises an error or warning, it simply drains quietly. By the time the second pass iterates customer_groups and tries to sum each group\'s order amounts, every group except the very last one (the only one that was never "moved past" before the function finished its first loop) has nothing left to yield, producing the observed $0 totals — while the underlying sorted_orders data itself is indeed correct and complete, exactly as verified, since the bug is entirely in how the groups were consumed, not in the source data. The fix is materializing each group into its own independent list at the moment it\'s produced, inside the SAME loop iteration — customer_groups[key] = list(group) instead of customer_groups[key] = group — which fully drains each group into real, standalone data before groupby ever gets a chance to advance past it.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'Once itertools.groupby is given correctly pre-sorted input (satisfying the well-known "groupby needs sorted data" requirement), each (key, group) pair it yields is a fully independent, self-contained collection that can be freely stored and used later without restriction.',
      reality: 'This subtopic\'s theory and first code example both show this is a second, distinct gotcha beyond the sorting requirement — Python\'s own documentation confirms each group is a live iterator sharing the SAME underlying source as groupby itself, meaning it silently loses its data once the outer iteration moves past it, regardless of whether the input was correctly sorted.'
    },
    {
      thought: 'If a groupby() group object is stored in a variable or data structure without being converted to a list first, that reference should still work correctly later, the same way storing a reference to any other Python object preserves its data.',
      reality: 'This subtopic\'s exercise shows the opposite — a stored, unconsumed group reference silently becomes empty once the outer groupby iteration advances past it, with no error raised anywhere to indicate the data is now gone, unlike storing a reference to an ordinary list or other independent object.'
    },
    {
      thought: 'A groupby-based report showing unexpectedly empty or zero results for most groups (except possibly the last one processed) must indicate a problem with the underlying source data or the sort/grouping key logic itself.',
      reality: 'This subtopic\'s exercise shows a different, common root cause — the underlying data and grouping key can be entirely correct while the bug lies purely in HOW the resulting groups were consumed (or not consumed) relative to when the outer loop advanced, which is a distinct failure mode from a data or key-function problem.'
    }
  ];
}
