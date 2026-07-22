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
  templateUrl: './islice-does-not-support-negative-start-stop-or-step.html',
  styleUrl: './islice-does-not-support-negative-start-stop-or-step.scss'
})
export class IsliceDoesNotSupportNegativeStartStopOrStepSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'itertools.islice looks like slicing syntax but rejects every negative value slicing normally allows',
      points: [
        'The main page\'s own quick reference and theory both describe islice(iterable, n) as "the equivalent of slicing for iterables" — a natural, reasonable reading of that is expecting it to support the same full range of slicing behavior Python\'s native seq[start:stop:step] does, including negative indices (count from the end) and a negative step (reverse direction).',
        'Python\'s own itertools documentation states this limitation directly: islice "works like sequence slicing but does not support negative values for start, stop, or step." This is a hard constraint, not just an unusual edge case — passing a negative start, a negative stop, or a non-positive step raises a ValueError. (The documented reference implementation checks step <= 0, so even step=0 — not just negative steps — is rejected, matching how a zero step is invalid for native slicing too.)',
        'The reason for this restriction, unlike native list slicing, is fundamental to what islice actually operates on: islice works on ANY iterable, including ones with no known length and no ability to look backward (a generator, a file object, a network stream) — negative indices only make sense when you know how many total items there are so you can count backward from the end, which islice, operating lazily over a potentially-infinite or length-unknown iterable, simply cannot do.',
      ]
    },
    {
      heading: 'What to reach for instead when negative-style slicing is genuinely needed',
      points: [
        'For "the last N items" of an iterable, islice cannot do it directly — the standard idiom is collections.deque(iterable, maxlen=n), which keeps only the last n items as it consumes the whole iterable, or simply materializing to a list first (list(iterable)[-n:]) if the iterable is known to be finite and fits comfortably in memory, sacrificing islice\'s laziness.',
        'For reversing, islice with a negative step is never the answer regardless of workaround — the standard tool is reversed(), which itself requires the underlying object to support __reversed__ or be a sequence with __len__ and __getitem__ (working directly on lists/tuples/ranges, but NOT on a plain generator or file object, which have neither) — a generator that genuinely needs reversing has to be materialized into a list first.',
      ]
    }
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Reasonable-looking code that raises ValueError',
      language: 'typescript',
      code: `import itertools

numbers = range(10)

# Looks like it should mirror list slicing's negative-index support:
last_three = itertools.islice(numbers, -3, None)
# ValueError: Indices for islice() must be None or an integer: 0 <= x <= sys.maxsize.

reversed_first_five = itertools.islice(numbers, 5, None, -1)
# ValueError — step must also be a positive integer (or None), never negative.

# Even step=0 (also invalid for native slicing) is rejected:
itertools.islice(numbers, 0, 10, 0)
# ValueError: Step for islice() must be a positive integer or None.`,
    },
    {
      label: 'The actual idioms for "last N" and "reversed"',
      language: 'typescript',
      code: `import itertools, collections

numbers = range(10)   # or any iterable, including an infinite generator

# "Last N items" — islice can't do this; use a bounded deque instead.
# collections.deque(iterable, maxlen=n) keeps only the LAST n items
# seen as it fully consumes the iterable (still only O(n) memory).
last_three = list(collections.deque(numbers, maxlen=3))   # [7, 8, 9]

# Reversing — works directly on sequences (lists, tuples, range);
# does NOT work on a plain generator or file object (no __reversed__,
# no __len__/__getitem__ to fall back on).
reversed_list = list(reversed(list(numbers)))   # materialise first
                                                  # if numbers were a
                                                  # generator, not a range

# islice is still the right tool for everything it DOES support:
# first N, skip-N-then-take-M, or take-every-Nth — all with only
# non-negative start/stop/step.
every_other = list(itertools.islice(numbers, 0, None, 2))   # [0,2,4,6,8]`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A function needs to process the last 5 lines of a log file that is being read lazily via a generator (to avoid loading the whole file into memory), and a developer writes itertools.islice(log_lines_generator(), -5, None), expecting it to behave like Python\'s own seq[-5:] slicing. This raises a ValueError. Explain why, using what this subtopic covers, and describe the correct approach.',
    hint: 'Does islice know, in advance, how many total items a generator will eventually produce? Without knowing the total count ahead of time, is there any way for islice to figure out where "5 items before the end" actually is while consuming the generator lazily, one item at a time?',
    solution: 'The ValueError happens because itertools.islice never supports negative values for start, stop, or step — per Python\'s own documentation, islice "works like sequence slicing but does not support negative values for start, stop, or step," and -5 as a start value is exactly the kind of negative index this restriction rules out. The deeper reason is structural, not just a documented limitation to work around: islice operates lazily over an iterable it consumes one item at a time, with no way to look ahead or know the total length in advance (a generator, by definition, does not expose its total count until it is fully exhausted) — so there is no way for islice to know, while consuming items one at a time, where "5 items before the end" actually falls until it has already consumed everything, which defeats the entire purpose of processing it lazily. The correct approach for "the last N items of a lazily-produced iterable" is collections.deque(log_lines_generator(), maxlen=5) — this fully consumes the generator (there is no way around reading every line at least once if you need to know which ones are last), but does so while holding only the last 5 items in memory at any moment (a deque with maxlen automatically discards the oldest item as new ones are added), rather than materializing the entire file into a list first. islice remains the right tool only for slicing patterns it actually supports — a non-negative start/stop/step, such as skipping the first N lines or taking every Nth line — not for anything requiring knowledge of the sequence\'s eventual end.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'Since the main page\'s own theory describes itertools.islice as "the equivalent of slicing for iterables," it must support the same complete range of slicing behavior native Python sequence slicing does, including negative indices and a negative step for reversing.',
      reality: 'This subtopic\'s theory and first code example both show this is a real, documented restriction — islice\'s own official documentation states plainly it "does not support negative values for start, stop, or step," making it a partial, not complete, equivalent to native slicing syntax.'
    },
    {
      thought: 'itertools.islice not supporting negative indices is an arbitrary implementation limitation that could theoretically be lifted in a future Python version, the same way other itertools functions occasionally gain new capabilities.',
      reality: 'This subtopic\'s theory explains this is a structural limitation, not an arbitrary one — islice operates lazily over iterables that may have no known length and no ability to look backward (a generator, a network stream), so negative indices (which require knowing the total count in advance to count backward from) are fundamentally incompatible with how islice actually works, not just an unimplemented feature.'
    },
    {
      thought: 'Getting "the last N items" or a reversed version of a lazily-produced generator is impossible without first materializing the ENTIRE generator into a list, since islice cannot do it and there is no other lazy-friendly tool for this.',
      reality: 'This subtopic\'s second code example shows a real, more memory-efficient middle ground for the "last N" case specifically — collections.deque(iterable, maxlen=n) fully consumes the iterable (unavoidable for finding "the last N" of something whose end isn\'t known in advance) but holds only n items in memory at any moment, rather than requiring the entire iterable to be materialized into a list first.'
    }
  ];
}
