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
  templateUrl: './cprofile-overhead-distorts-tight-loops-and-recursion.html',
  styleUrl: './cprofile-overhead-distorts-tight-loops-and-recursion.scss'
})
export class CprofileOverheadDistortsTightLoopsAndRecursionSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'cProfile watches every single call and return — and that watching itself takes time',
      points: [
        'The main page\'s own theory describes cProfile simply as "the stdlib CPU profiler," reporting cumtime and tottime per function, without mentioning that the act of measuring has its own cost, or that this cost lands unevenly across different kinds of code. Python\'s own profile module documentation names the mechanism directly: "Deterministic profiling is meant to reflect the fact that all function call, function return, and exception events are monitored, and precise timings are made for the intervals between these events."',
        'Every single function call and return in the profiled program triggers this monitoring — there is no sampling, no skipping. Python\'s own docs go on to name the direct consequence: "it \'takes a while\' from when an event is dispatched until the profiler\'s call to get the time actually gets the state of the clock... As a result, functions that are called many times, or call many functions, will typically accumulate this error."',
        'This is not a vague "profiling has some overhead" disclaimer — it is a specific, documented statement about WHICH code shapes accumulate the most distortion: functions called many times (a tight loop invoking a cheap helper millions of times) or functions that themselves call many other functions (deep or heavily-branching call graphs). The timing error compounds per call, so it grows with call COUNT, not with how much genuine work each call does.',
      ]
    },
    {
      heading: 'Why this makes cProfile\'s own numbers misleading specifically for cheap, frequently-called functions',
      points: [
        'The practical consequence follows directly from the documented mechanism: a fixed per-call measurement overhead is a small, negligible fraction of an expensive function\'s genuine runtime, but the SAME fixed overhead can be a large, even dominant, fraction of a genuinely cheap function\'s runtime if that function is called millions of times. cProfile\'s reported tottime for such a function can end up measuring mostly its own instrumentation overhead, not the function\'s real work.',
        'This means cProfile can systematically make a tight loop calling a trivial helper function look disproportionately expensive compared to a smaller number of calls to a genuinely heavier function — even when, measured by a sampling profiler like py-spy (which the main page already covers as having "near-zero overhead"), the tight loop\'s real-world cost is much smaller than cProfile\'s own report suggests.',
        'The main page\'s own advice to "profile just the suspected function" (from its common-mistakes section) becomes doubly important here: narrowing cProfile\'s scope not only produces a readable report, it also reduces exactly the kind of call-count-driven distortion this subtopic covers, since fewer total instrumented calls means less accumulated timing error. For code dominated by many small calls specifically, cross-checking cProfile\'s findings against a sampling profiler (py-spy) or line_profiler\'s own per-line timings is the more reliable way to confirm a suspected hot path is genuinely expensive, not an artifact of instrumentation overhead.',
      ]
    }
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'The same total work reported very differently depending on call shape',
      language: 'typescript',
      code: `import cProfile, pstats
from io import StringIO

def cheap_op(x: int) -> int:
    return x + 1   # trivial — almost no genuine work per call

def many_cheap_calls() -> int:
    total = 0
    for i in range(2_000_000):   # 2 million calls to a trivial function
        total = cheap_op(total)
    return total

def few_expensive_calls() -> int:
    total = 0
    for i in range(20):          # only 20 calls, but each does real work
        total += sum(j * j for j in range(100_000))
    return total

def profile(fn):
    pr = cProfile.Profile()
    pr.enable()
    fn()
    pr.disable()
    s = StringIO()
    pstats.Stats(pr, stream=s).sort_stats("cumtime").print_stats(5)
    print(s.getvalue())

profile(many_cheap_calls)
# cProfile reports a surprisingly large tottime for cheap_op, given
# how trivial its actual body is -- per Python's own documented
# caveat, "functions that are called many times... will typically
# accumulate this error." A large share of the reported time here
# is cProfile's own per-call measurement overhead, not genuine work.

profile(few_expensive_calls)
# Here, the SAME per-call overhead is spread across far fewer calls,
# each doing substantially more real work -- the reported numbers
# are proportionally much closer to the function's true cost, since
# the fixed measurement overhead is a smaller fraction of each call.`,
    },
    {
      label: 'Cross-checking with py-spy (sampling) to see past the instrumentation distortion',
      language: 'typescript',
      code: `# The main page's own theory already notes py-spy has "near-zero
# overhead" since it's a sampling profiler, not an instrumenting one
# -- this is exactly the tool to reach for when cProfile's own
# numbers are suspected of being skewed by call-count overhead.

# Run the many_cheap_calls() workload as a real, running process:
# python -c "from mymodule import many_cheap_calls; many_cheap_calls()" &
# py-spy top --pid $(pgrep -n python)

# py-spy periodically samples the ACTUAL instruction pointer, with
# no per-call instrumentation cost at all -- it never inflates a
# trivial function's apparent cost just because it was called many
# times, since it isn't measuring individual call/return events in
# the first place.

# A practical workflow this subtopic's theory implies:
# 1. Use cProfile first for a rough map of WHERE time goes -- it's
#    still useful for identifying candidate hot functions, per the
#    main page's own recommended workflow.
# 2. For any candidate function that is ALSO called a very large
#    number of times (visible in cProfile's own 'ncalls' column),
#    treat its reported tottime with extra suspicion.
# 3. Cross-check that specific candidate with py-spy or
#    line_profiler's per-line numbers, which don't carry the same
#    call-count-driven distortion, before concluding it's genuinely
#    the bottleneck worth optimizing.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A developer profiles a data-processing pipeline with cProfile and finds that validate_field(), a tiny function that just checks if a value is None, accounts for 40% of tottime across 5 million calls. They spend an afternoon optimizing validate_field() (inlining it, removing a redundant check) and re-profile — cProfile now shows only 15% tottime for it, and they conclude they achieved a genuine 2.7x speedup on that function. A teammate is skeptical and suggests re-measuring with py-spy before celebrating. Explain what might actually be going on, using what this subtopic covers.',
    hint: 'Per this subtopic\'s theory, does a function\'s reported cProfile tottime measure ONLY its own genuine work, or does it also include a per-call measurement cost that compounds with call count? If validate_field() is trivial and called 5 million times, what fraction of its ORIGINAL reported tottime was likely cProfile\'s own overhead rather than real work?',
    solution: 'The teammate\'s skepticism is well-founded, and the likely explanation is that a significant portion of both the "before" and "after" tottime measurements for validate_field() was never the function\'s own genuine work at all — per this subtopic\'s theory, Python\'s own documented caveat states functions "called many times... will typically accumulate" measurement error, since every one of those 5 million calls incurs cProfile\'s own per-call instrumentation cost. Given how trivial validate_field()\'s original body was (a None check), it is entirely plausible that a large fraction of its ORIGINAL 40% tottime figure was already cProfile\'s own overhead rather than genuine work — meaning the "before" number was inflated from the start. If the optimization work (inlining, removing a redundant check) also happened to reduce the number of distinct function CALLS involved (e.g., inlining removes a call entirely, or removing a redundant check removes a nested call within validate_field()), the drop from 40% to 15% could be measuring, at least partly, a reduction in cProfile\'s own accumulated per-call overhead rather than the code doing meaningfully less real work per remaining call. The developer\'s "2.7x speedup" conclusion, drawn purely from cProfile\'s own tottime comparison, cannot cleanly distinguish "the code got genuinely faster" from "there are now fewer instrumented call events for cProfile to accumulate overhead across." The teammate\'s suggested fix — re-measuring with py-spy, a sampling profiler that (per this subtopic\'s theory) has no per-call instrumentation cost and therefore cannot be skewed by call count the same way — would give a cleaner, more trustworthy comparison of the actual before/after wall-clock cost, confirming (or debunking) whether the perceived speedup reflects real improvement.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'cProfile\'s reported tottime and cumtime for a function are precise, direct measurements of exactly how much genuine work that function does — the profiler observes without changing what it measures.',
      reality: 'This subtopic\'s theory and first code example show cProfile\'s own documentation states the opposite — as a deterministic profiler instrumenting every call and return event, it introduces measurement overhead that "functions... called many times, or call many functions" specifically accumulate, meaning the reported numbers for call-heavy code can be substantially inflated by the act of measuring itself, not just the code\'s genuine cost.'
    },
    {
      thought: 'If cProfile reports two functions with similar tottime values, they are doing a genuinely comparable amount of real work, regardless of how many times each was called.',
      reality: 'This subtopic\'s first code example shows this comparison can be deeply misleading — a function called millions of times can show inflated tottime dominated by accumulated per-call measurement overhead, while a function called only a handful of times shows tottime much closer to its true cost, even if the SECOND function is actually doing far more genuine computational work per call.'
    },
    {
      thought: 'Since cProfile is described as the standard, go-to CPU profiler on the main page, its numbers should always be trusted as the final word on where a program\'s time genuinely goes, without needing a second profiling tool to confirm.',
      reality: 'This subtopic\'s theory and second code example show a documented, real reason to cross-check specific findings — for any candidate hot function that is also called an especially large number of times, py-spy (a sampling profiler with no per-call instrumentation cost, already covered on the main page for its low production overhead) provides a measurement that cannot be skewed by call-count-driven instrumentation error the way cProfile\'s own numbers can.'
    }
  ];
}
