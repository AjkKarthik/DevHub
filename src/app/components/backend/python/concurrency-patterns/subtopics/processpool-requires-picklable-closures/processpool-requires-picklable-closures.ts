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
  templateUrl: './processpool-requires-picklable-closures.html',
  styleUrl: './processpool-requires-picklable-closures.scss'
})
export class ProcesspoolRequiresPicklableClosuresSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'Bridging to a process pool copies the call by pickling it, not by sharing it',
      points: [
        'The main page\'s own theory says CPU-bound work needs "loop.run_in_executor(process_executor, fn, args)... Keep the CPU task self-contained (no shared state, picklable args/returns)" — but does not explain what breaks when that self-contained rule is violated, or exactly what "picklable" excludes.',
        'Python\'s own concurrent.futures documentation states the restriction directly: "restrictions on functions and arguments needing to be picklable as per multiprocessing.Process apply when using submit() and map()... A function defined in a REPL or a lambda should not be expected to work." A ProcessPoolExecutor sends work to a separate OS process, which has its own memory space — there is no shared memory to hand a function object to directly, so the callable and its arguments are serialized (pickled), sent across, and reconstructed in the worker.',
        'Python\'s own pickle documentation explains why lambdas specifically cannot survive this: functions are pickled "by fully qualified name, not by value," restricted to those "accessible from the top level of a module (using def, not lambda)" — and lambdas fail because "all lambda functions share the same name: <lambda>," so pickle has no unique name to serialize a reference by. The same top-level-only rule extends to closures (a nested def referencing an enclosing scope\'s variables) — a closure is not accessible from the top level of its module either, so it hits the identical naming problem.',
      ]
    },
    {
      heading: 'ThreadPoolExecutor has no equivalent restriction — the difference is the process boundary, not concurrent.futures itself',
      points: [
        'concurrent.futures.ThreadPoolExecutor runs work on OS threads inside the SAME process, sharing the same memory space as the code that submitted the work — there is no cross-process boundary to cross, so nothing needs to be pickled at all. A lambda or closure passed to a ThreadPoolExecutor works exactly as it would called directly, with full access to whatever variables it closed over.',
        'This means the exact same code pattern — executor.submit(some_lambda) — silently works with a ThreadPoolExecutor and silently fails with a ProcessPoolExecutor, purely because of which Executor subclass was chosen. Since Python code often moves between the two (starting with threads for I/O, later needing processes for CPU-bound work), it is easy to carry a lambda- or closure-based call across that switch and only discover the pickling restriction when the process pool version is actually run.',
        'The practical fix is always the same: define the target callable at module level with def (not lambda, not nested inside another function), and ensure every argument passed to it is itself picklable (built-in types, or classes whose instances pickle cleanly — no open file handles, sockets, database connections, or lambdas passed as arguments either).',
      ]
    }
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'A lambda works with threads, fails with processes',
      language: 'typescript',
      code: `from concurrent.futures import ThreadPoolExecutor, ProcessPoolExecutor

def make_multiplier(factor: int):
    return lambda x: x * factor   # closure over 'factor'

triple = make_multiplier(3)

# Threads: shares memory, no pickling needed — this just works
with ThreadPoolExecutor(max_workers=2) as pool:
    future = pool.submit(triple, 7)
    print(future.result())              # 21

# Processes: the callable must be pickled to send to the worker —
# 'triple' is a closure, and pickle can't serialize it by name
with ProcessPoolExecutor(max_workers=2) as pool:
    future = pool.submit(triple, 7)
    print(future.result())
    # Raises, typically:
    #   AttributeError: Can't pickle local object
    #   'make_multiplier.<locals>.<lambda>'
    # (the exact wording can vary by Python version, but the
    # root cause — a non-top-level callable — is always the same)`,
    },
    {
      label: 'The module-level def fix — picklable, works with either pool',
      language: 'typescript',
      code: `from concurrent.futures import ProcessPoolExecutor

def multiply(x: int, factor: int) -> int:
    # A plain, top-level function: pickle can reference it by its
    # fully-qualified module path and name — no closure needed,
    # since 'factor' is now an explicit, picklable argument instead
    # of a value captured from an enclosing scope.
    return x * factor

def run_cpu_bound_batch(values: list[int], factor: int) -> list[int]:
    with ProcessPoolExecutor(max_workers=4) as pool:
        futures = [pool.submit(multiply, v, factor) for v in values]
        return [f.result() for f in futures]

if __name__ == "__main__":
    print(run_cpu_bound_batch([1, 2, 3, 4], 3))   # [3, 6, 9, 12]
    # Works identically whether the executor is Thread- or
    # ProcessPoolExecutor, because 'multiply' is a top-level def
    # with only picklable (int) arguments — no lambda, no closure,
    # no captured state that pickle would need to reconstruct.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A data pipeline uses ThreadPoolExecutor to call a small helper: threshold = get_config_threshold(); check = lambda row: row["score"] > threshold; pool.submit(check, row) for each row — this works fine. Later, profiling shows the check function is CPU-heavy, so the team switches to ProcessPoolExecutor with no other code changes, and every submit() call now raises a pickling error. Explain why, and describe the fix that keeps the threshold value available to the check.',
    hint: 'What two things does the lambda in this example rely on — its own definition style, and where does the threshold value come from? Does a ProcessPoolExecutor share memory with the code that calls submit(), the way ThreadPoolExecutor does?',
    solution: 'The pickling error appears purely because of the executor switch, not because of the threshold value being wrong or the logic being incorrect. ThreadPoolExecutor runs work on threads inside the SAME process, sharing memory with the calling code — a lambda closing over threshold works because there is no cross-process boundary and nothing ever needs to be serialized. ProcessPoolExecutor sends work to a genuinely separate process with its own memory space, which means the callable has to be pickled to cross that boundary — and per Python\'s own docs, "a function defined in a REPL or a lambda should not be expected to work," since pickle can only reference functions "accessible from the top level of a module... using def, not lambda." The check lambda is doubly disqualified: it is a lambda (no unique picklable name), and it is a closure over threshold (not accessible from the top level of the module either). The fix is to make check a module-level def that takes threshold as an explicit argument instead of capturing it from an enclosing scope: def check_row(row, threshold): return row["score"] > threshold, then submit it as pool.submit(check_row, row, threshold) — both row and threshold are picklable values passed explicitly, and check_row itself is a plain top-level function pickle can reference by name, so it works identically with ThreadPoolExecutor or ProcessPoolExecutor.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'concurrent.futures.Executor is one interface, so a lambda or closure that works when submitted to a ThreadPoolExecutor will work exactly the same way if the code is later switched to a ProcessPoolExecutor, since both are just "an Executor."',
      reality: 'This subtopic\'s theory and first code example show ProcessPoolExecutor requires the callable and its arguments to be picklable, because work crosses a real process boundary — a lambda or closure that works fine with threads (which share memory, no pickling needed) raises an AttributeError/PicklingError with processes, purely because of which Executor subclass was chosen, with no other code difference.'
    },
    {
      thought: 'The pickling restriction on ProcessPoolExecutor only applies to lambdas specifically — an ordinary nested function (defined with def inside another function) avoids the problem since it is not technically a lambda.',
      reality: 'This subtopic\'s theory explains the restriction is about being accessible from the TOP LEVEL of a module, not specifically about the lambda keyword — a nested def (a closure) is just as unreachable from the top level as a lambda is, and fails to pickle for the identical reason: pickle serializes functions by fully-qualified name, and neither a lambda nor a nested def has one.'
    },
    {
      thought: 'If a value like a config threshold is needed inside a function submitted to ProcessPoolExecutor, the natural way to provide it is to capture it in a closure, the same way it would be provided to a function submitted to ThreadPoolExecutor.',
      reality: 'This subtopic\'s exercise shows the fix is the opposite of a closure — pass the value as an explicit, picklable argument to a module-level def instead, since a closure captures it from an enclosing scope that a separate worker process has no access to reconstruct, while an explicit argument is serialized and sent across the process boundary along with the call itself.'
    }
  ];
}
