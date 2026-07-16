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
  templateUrl: './generator-locals-stay-alive-while-the-generator-is-alive.html',
  styleUrl: './generator-locals-stay-alive-while-the-generator-is-alive.scss'
})
export class GeneratorLocalsStayAliveWhileTheGeneratorIsAliveSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'A paused generator retains its ENTIRE execution frame — including large local variables — for as long as it exists',
      points: [
        'The main page\'s own theory frames generators purely as a memory-saving tool: "it does not create all values at once — it produces values one at a time, on demand." This is true for the values a generator YIELDS, but it doesn\'t cover what happens to a generator\'s OWN local variables — the ones it uses internally to compute those values.',
        'Python\'s own language reference is explicit about what "paused" actually means for a generator: "all local state is retained, including the current bindings of local variables, the instruction pointer, the internal evaluation stack, and the state of any exception handling." A generator function isn\'t re-entered from scratch on each next() call — its entire suspended frame, with every local variable it had at the last yield, stays alive in memory.',
        'Concretely: def gen(): data = load_huge_list(); yield data[0]; yield data[1]— the huge data list is a local variable, so it stays fully alive in memory for as long as the generator object itself exists (hasn\'t been exhausted, closed, or garbage collected), even between yields, even though only two individual elements from it are ever actually produced.',
      ]
    },
    {
      heading: 'Why this complicates the "generators save memory" assumption',
      points: [
        'The main page\'s own generator pipeline example (read_lines → parse_int → above_threshold → sum) genuinely achieves constant memory, because none of those generator functions hold a large local variable across a yield — each one processes and discards one line/value at a time. That specific pattern is memory-efficient BECAUSE of how it\'s written, not merely because it uses yield at all.',
        'A generator that loads a large object into a local variable before its first yield — even if it then only yields small derived values one at a time — gets none of the memory benefit the main page\'s theory promises, since that large local variable is retained by the paused frame for the generator\'s entire lifetime, exactly the eager, all-at-once memory cost a generator was supposed to avoid.',
      ]
    }
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'A generator whose OWN local variable holds a large object',
      language: 'typescript',
      code: `import sys

def bad_pipeline(path):
    # 'data' is a local variable in THIS generator's frame.
    with open(path) as f:
        data = f.readlines()      # loaded ALL AT ONCE into memory
    for line in data:
        yield line.strip().upper()

# Even though bad_pipeline() only yields one line at a time, the full
# 'data' list it read is retained in the generator's own suspended
# frame for as long as the generator object itself is alive — there
# is no memory benefit over just returning the whole processed list.
gen = bad_pipeline("huge_file.txt")
first_line = next(gen)   # 'data' (the ENTIRE file's lines) is still
                          # alive right now, inside gen's paused frame`,
    },
    {
      label: 'The actual memory-efficient version — nothing large survives a yield',
      language: 'typescript',
      code: `def good_pipeline(path):
    with open(path) as f:
        for line in f:              # reads ONE line at a time from disk
            yield line.strip().upper()
    # No local variable ever holds more than one line at once —
    # each 'line' is discarded (eligible for garbage collection)
    # as soon as the next iteration begins, well before the next yield.

gen = good_pipeline("huge_file.txt")
first_line = next(gen)   # only ONE line's worth of data is alive in
                          # gen's paused frame right now, regardless of
                          # how large the underlying file actually is`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A developer writes a generator intended to process a 2 GB dataset with constant memory usage: def process(path): with open(path) as f: rows = [line.split(",") for line in f]; for row in rows: yield transform(row). Profiling shows memory usage spikes to the full dataset size the moment the generator is first advanced with next(), and stays there for the generator\'s entire lifetime, even though only one transformed row is consumed at a time. Explain why, using what this subtopic covers.',
    hint: 'What is rows in this generator — is it something that gets created and discarded fresh on each yield, or is it a local variable in the generator\'s own frame? What does this subtopic\'s theory say happens to a generator\'s local variables between yields?',
    solution: 'The memory spike happens because rows is a local variable inside the generator\'s own execution frame, and per Python\'s own language reference, a paused generator retains ALL of its local state — "the current bindings of local variables" — for as long as the generator object itself is alive. The list comprehension [line.split(",") for line in f] eagerly builds the ENTIRE dataset (all rows, fully parsed) into the rows list the very first time the generator body executes up to its first yield — and because rows is a local variable, that entire 2 GB structure stays alive in the generator\'s suspended frame for the generator\'s whole lifetime, regardless of how slowly the caller actually consumes values from it one at a time. The generator only YIELDS one transformed row at a time, but it never actually avoided loading everything into memory — it just delayed producing the OUTPUT lazily, while still paying the full eager memory cost internally. The fix is restructuring the generator so nothing large ever exists as a local variable across a yield: def process(path): with open(path) as f: for line in f: yield transform(line.split(",")) — this way, each line is read, split, transformed, and yielded one at a time, with no local variable ever holding more than a single row\'s worth of data between yields, achieving genuine constant memory usage.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'Since a generator function uses yield instead of building and returning a full list, it automatically achieves constant, low memory usage regardless of how the function body is written internally.',
      reality: 'This subtopic\'s theory and first code example both show this is not guaranteed — a generator only avoids the eager, all-at-once memory cost if NONE of its own local variables hold a large collection across a yield; using yield alone does not automatically make a generator\'s internal logic lazy.'
    },
    {
      thought: 'Once a generator has yielded a value and execution has moved past a line of code, any local variables that were used to compute that value are eligible for garbage collection immediately, the same way they would be in a completed (non-generator) function call.',
      reality: 'This subtopic\'s theory explains the opposite — a generator\'s frame is SUSPENDED, not completed, at each yield, so every local variable it had at that point remains bound and alive in the frame, exactly as if the function were still "running," for as long as the generator object itself exists.'
    },
    {
      thought: 'The main page\'s own generator pipeline pattern (read_lines → parse_int → above_threshold → sum) achieves constant memory purely because it chains several generator functions together — chaining generators is what makes it memory-efficient.',
      reality: 'This subtopic\'s second code example shows the real reason — it is memory-efficient because none of the individual generator functions in that chain ever hold a large local variable across a yield, not merely because generators are chained; a single generator written the wrong way (like the exercise\'s process() function) can still be just as memory-hungry as eagerly building a full list.'
    }
  ];
}
