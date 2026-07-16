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
  templateUrl: './for-else-runs-on-empty-iterables-too.html',
  styleUrl: './for-else-runs-on-empty-iterables-too.scss'
})
export class ForElseRunsOnEmptyIterablesTooSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'for/else means "no break happened" — not "the loop actually processed something"',
      points: [
        'The main page\'s own theory frames for/else through a single example: "search and not found" — iterate items, break when found, else runs the not-found handler. That framing makes it easy to assume the else clause is somehow tied to the loop having genuinely processed at least one item. It is not.',
        'Python\'s own language reference is precise about the actual trigger: "When the iterator is exhausted, the suite in the else clause, if present, is executed... A break statement executed in the first suite terminates the loop without executing the else clause\'s suite." An iterator over a completely empty sequence is exhausted immediately, having yielded nothing — and since no break statement ran (there was nothing to break out of), the else clause still executes. Python\'s own tutorial confirms this directly: "the else clause is executed after the loop finishes its final iteration, that is, if no break occurred" — with no separate condition requiring the loop body to have actually run.',
        'So for item in []: ... else: print("done") genuinely prints "done" — the empty list case and the "iterated fully without breaking" case are the SAME case from else\'s perspective, not two different scenarios that happen to produce the same result.',
      ]
    },
    {
      heading: 'Why this distinction matters in real code',
      points: [
        'A "search and not found" pattern built directly on the main page\'s own example already handles the empty-list case correctly by accident (an empty list can never contain the target, so falling through to else is the right outcome either way) — which is exactly why this nuance is easy to never notice. It becomes a real bug the moment for/else is repurposed for something where "the loop ran with items but found nothing" and "the loop had nothing to iterate at all" are meant to be treated differently.',
        'A common, incorrect assumption this leads to: writing code that treats the else branch as implicitly meaning "we looked and didn\'t find a match among real candidates," when an empty input silently takes the exact same branch with zero actual searching having occurred — if that distinction matters (e.g., logging "no valid candidates existed" vs. "candidates existed but none matched"), for/else alone cannot tell them apart, and an explicit length/emptiness check is needed alongside it.',
      ]
    }
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'else fires on an empty iterable — no break ever happened',
      language: 'typescript',
      code: `# The main page's own "search and not found" pattern
items = ["apple", "banana", "cherry"]
for item in items:
    if item == "durian":
        print("Found it")
        break
else:
    print("Not found")   # prints — loop ran, no break

# Now with a genuinely EMPTY list — no iteration happens at all
items = []
for item in items:
    if item == "durian":
        print("Found it")
        break
else:
    print("Not found")   # STILL prints "Not found" — the loop body
                          # never ran even once, but else still fires,
                          # because "no break occurred" is the ONLY
                          # condition else actually checks.`,
    },
    {
      label: 'Distinguishing "searched and missed" from "nothing to search"',
      language: 'typescript',
      code: `def find_match(candidates, target):
    for c in candidates:
        if c == target:
            return f"Found {target}"
    else:
        # for/else alone can't tell these two cases apart:
        return "No match among candidates"

# Both of these hit the SAME else branch, even though they mean
# genuinely different things:
find_match(["a", "b", "c"], "z")   # searched 3 real candidates, missed
find_match([], "z")                # had nothing to search at all

# If that distinction actually matters, check emptiness explicitly
# instead of relying on for/else to express it:
def find_match_explicit(candidates, target):
    if not candidates:
        return "No candidates provided"
    for c in candidates:
        if c == target:
            return f"Found {target}"
    return "Searched candidates, no match"`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A function iterates over a list of pending orders looking for one that exceeds a fraud-risk threshold, using for/else to log "no risky orders found" in the else branch. A teammate reports that this log message appears even on days when the orders list was completely empty (e.g., a holiday with zero orders at all) — and argues this must be a bug in for/else itself, since "nothing was actually checked." Evaluate this claim using what this subtopic covers, and explain what the code should do differently if the two scenarios need to be distinguished.',
    hint: 'According to Python\'s own documented behavior for for/else, does the else clause require the loop body to have run at least once — or does it only require that no break statement occurred, regardless of whether the loop had anything to iterate over at all?',
    solution: 'This is not a bug in for/else — it is working exactly as Python\'s own language reference documents: the else clause runs "when the iterator is exhausted," with the only disqualifying condition being that a break statement executed; an empty list is exhausted immediately having yielded nothing, and since no break occurred (there was nothing to break out of), else correctly fires. The teammate\'s framing ("nothing was actually checked") is accurate as a description of what happened, but it does not make the behavior a bug — for/else was never designed to distinguish "checked everything and found nothing risky" from "had nothing to check at all"; both cases are, from else\'s perspective, simply "the loop completed without a break." If the two scenarios genuinely need different handling (e.g., logging "no risky orders" only when orders were actually reviewed, and logging something different like "no orders today" when the list was empty), the fix is adding an explicit emptiness check before the loop rather than relying on for/else to express that distinction — for example, checking if not pending_orders: log("no orders today") before entering the for/else block at all, so the else branch\'s log message is only reached in the genuine "searched and found nothing risky" case.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'The else clause on a for loop only runs if the loop body actually executed at least once and then completed naturally without a break — an empty iterable, having never entered the loop body, should skip the else clause too.',
      reality: 'This subtopic\'s theory and first code example both show this is incorrect — Python\'s own language reference ties else purely to "no break occurred," with no requirement that the loop body ran even once; an empty iterable triggers else exactly the same as a fully-iterated-without-break non-empty one.'
    },
    {
      thought: 'for/else is specifically designed to distinguish "the loop searched through real items and found nothing" from "the loop had nothing to search at all" — that is the whole point of the else clause\'s existence.',
      reality: 'This subtopic\'s second code example shows the opposite — for/else cannot distinguish these two cases at all, since both hit the identical else branch; any code that needs to tell them apart has to add an explicit emptiness check before the loop, entirely separate from the for/else mechanism.'
    },
    {
      thought: 'If a for/else block\'s else branch runs unexpectedly on what looks like "nothing happened," that must indicate a bug in the loop\'s logic or in for/else itself.',
      reality: 'This subtopic\'s exercise shows the opposite — the behavior is correct and fully documented; what looks unexpected is usually a mismatch between what the developer assumed for/else guarantees (that the loop body ran) and what it actually guarantees (that no break occurred), not an actual defect in the code or the language feature.'
    }
  ];
}
