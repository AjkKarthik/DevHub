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
  templateUrl: './fork-vs-spawn-changes-what-a-child-process-inherits.html',
  styleUrl: './fork-vs-spawn-changes-what-a-child-process-inherits.scss'
})
export class ForkVsSpawnChangesWhatAChildProcessInheritsSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'fork copies the parent\'s memory; spawn starts a fresh interpreter that re-imports __main__',
      points: [
        'The main page\'s own "if __name__ == \'__main__\'" mistake entry explains the SYMPTOM on Windows (worker processes recursively re-spawning without the guard) but doesn\'t name the actual mechanism causing it, or that the same underlying difference affects far more than just that one guard.',
        'Python\'s own multiprocessing documentation describes two genuinely different start methods. fork: "the parent process uses os.fork()... the child process, when it begins, is effectively identical to the parent process. All resources of the parent are inherited by the child process" — a copy-on-write duplicate, meaning module-level state that already existed in the parent (an open database connection, already-imported modules, already-computed data) is automatically present in the child too. spawn: "the parent process starts a fresh Python interpreter process. The child process will only inherit those resources necessary to run the process object\'s run() method" — nothing from the parent\'s existing state comes along automatically; the child re-imports __main__ from scratch.',
        'The platform defaults matter directly for what code actually needs to do: spawn is documented as "the default on Windows and macOS" (changed specifically for macOS in Python 3.8, since — per the docs — "the fork start method should be considered unsafe as it can lead to crashes of the subprocess as macOS system libraries may start threads"). Linux historically defaulted to fork, though Python 3.14 changes the POSIX default to forkserver — a third method with its own tradeoffs. This means the exact same multiprocessing code can behave differently depending on both platform AND Python version.',
      ]
    },
    {
      heading: 'What this means for code that assumes parent state is automatically available',
      points: [
        'Code developed and tested only on a fork-default platform (older Linux setups) can silently rely on child processes automatically having access to state set up before the Process()/Pool() call — a global cache dict already populated, a config object already loaded — none of which is a bug on that platform, since fork genuinely does copy it. The exact same code, run on Windows or macOS (or Linux 3.14+), gets a completely fresh interpreter for each child, and any state the code assumed was "just there" is actually missing, typically surfacing as a NameError, an empty/default value, or reinitializing something expensive from scratch in every single worker.',
        'The reliable, cross-platform-safe pattern is never relying on implicit inheritance at all — pass everything a worker function needs as explicit arguments (matching the main page\'s own "arguments must be picklable" guidance), or have the worker function recreate what it needs internally (the same "open resources inside the worker" pattern the main page\'s own sqlite3 example already demonstrates for a different reason — picklability, not fork/spawn — but which happens to also make the code safe across start methods for free).',
      ]
    }
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Code that only works correctly under fork',
      language: 'typescript',
      code: `from multiprocessing import Process

# Module-level state, set up ONCE before any Process is created.
shared_cache = {"config": load_expensive_config()}

def worker():
    # Under fork (historically Linux default): shared_cache is
    # automatically present — it was copied at fork time.
    print(shared_cache["config"])

    # Under spawn (Windows/macOS default, and Linux 3.14+'s
    # forkserver): this module is re-imported FRESH in the child.
    # shared_cache["config"] = load_expensive_config() runs AGAIN
    # during that re-import — meaning the expensive setup silently
    # happens once per worker process instead of only once, total.

if __name__ == "__main__":
    procs = [Process(target=worker) for _ in range(4)]
    for p in procs: p.start()
    for p in procs: p.join()
    # Correct results either way — but under spawn, load_expensive_config()
    # actually runs 5 TIMES total (once in the parent, once per each
    # of the 4 re-imported children), not once.`,
    },
    {
      label: 'The cross-platform-safe pattern — pass state explicitly',
      language: 'typescript',
      code: `from multiprocessing import Process

def worker(config):   # config passed explicitly as an ARGUMENT
    print(config)      # works identically under fork AND spawn —
                         # no implicit inheritance relied upon at all

if __name__ == "__main__":
    config = load_expensive_config()   # computed exactly ONCE, here
    procs = [Process(target=worker, args=(config,)) for _ in range(4)]
    for p in procs: p.start()
    for p in procs: p.join()
    # Under fork: config is copied via the fork itself AND passed as
    # an argument — redundant but harmless.
    # Under spawn: config MUST be passed as an argument (pickled and
    # sent to the child) since nothing is implicitly inherited — this
    # version does that correctly, so it behaves identically on every
    # platform and Python version, regardless of the default start method.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A data pipeline loads a large lookup table into a module-level dictionary once at startup, then spawns several multiprocessing.Process workers that read from that dictionary directly (relying on it being "already there" in each worker, with no explicit argument passing). The pipeline works correctly and quickly in CI (which runs on Linux), but when a teammate runs the identical script on their macOS laptop, each worker takes noticeably longer to start and memory usage is much higher than expected. Explain why, using what this subtopic covers.',
    hint: 'What are the documented default process start methods on Linux versus macOS? Under the macOS default specifically, does a child process automatically inherit a dictionary that was already populated in the parent before the child was created — or does something else have to happen for that dictionary to exist in the child at all?',
    solution: 'The slower startup and higher memory usage on macOS happen because macOS defaults to the spawn start method (confirmed by Python\'s own documentation: spawn has been "the default on Windows and macOS" since Python 3.8, specifically for safety reasons), while the CI environment running on Linux was very likely using fork\'s copy-on-write inheritance instead. Under fork, "the child process... is effectively identical to the parent process. All resources of the parent are inherited," meaning the already-populated lookup table genuinely is present in each worker immediately, at essentially no extra cost — this is why the pipeline runs correctly and quickly in CI, relying (even if unintentionally) on that inheritance. Under spawn, by contrast, "the parent process starts a fresh Python interpreter process" for each worker, which means the module is re-imported from scratch in every single child — including whatever top-level code originally built that large lookup table. So on macOS, that expensive table-building work is silently repeated once per worker process (explaining the slower startup), and each worker ends up holding its own separate, freshly-rebuilt copy of the large table in memory (explaining the higher memory usage), rather than sharing the one copy fork\'s inheritance would have provided. The fix, and the only genuinely cross-platform-safe approach, is passing the lookup table explicitly as an argument to each worker (or having each worker load it from a shared, external source like a file or database, rather than depending on in-process module-level state to already exist) — this behaves identically and predictably regardless of which start method the underlying platform and Python version default to.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'A multiprocessing.Process or Pool worker function can always rely on module-level state (already-loaded config, already-populated caches) being automatically available inside the worker, the same way it would be inside any function called normally within the same process.',
      reality: 'This subtopic\'s theory and first code example both show this is platform- and version-dependent — Python\'s own documentation confirms fork genuinely copies parent state via os.fork(), but spawn starts a fresh interpreter that re-imports the module from scratch, so relying on implicit inheritance only works correctly under fork, not universally.'
    },
    {
      thought: 'Since fork was historically the default on Linux, code developed and tested exclusively on Linux using multiprocessing can be assumed to behave identically when deployed to or run on Windows or macOS, as long as the code itself does not change.',
      reality: 'This subtopic\'s exercise shows the opposite — the exact same code can behave correctly but far less efficiently (or, in some cases, incorrectly) purely due to the platform\'s different default start method, since Windows and macOS default to spawn while Linux has historically defaulted to fork (and is changing again in Python 3.14).'
    },
    {
      thought: 'The main page\'s own "if __name__ == \'__main__\'" guard requirement on Windows is a narrow, Windows-specific quirk unrelated to any broader difference in how multiprocessing actually creates child processes.',
      reality: 'This subtopic\'s theory explains this is actually a symptom of the deeper fork-vs-spawn distinction — the guard is required specifically because spawn re-imports and re-executes the __main__ module\'s top-level code in each child process, and the exact same underlying mechanism affects far more than just that one guard, including any other module-level state a script might set up before creating processes.'
    }
  ];
}
