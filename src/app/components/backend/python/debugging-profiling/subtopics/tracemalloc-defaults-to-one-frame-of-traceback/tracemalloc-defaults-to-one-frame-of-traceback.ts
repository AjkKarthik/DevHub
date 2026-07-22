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
  templateUrl: './tracemalloc-defaults-to-one-frame-of-traceback.html',
  styleUrl: './tracemalloc-defaults-to-one-frame-of-traceback.scss'
})
export class TracemallocDefaultsToOneFrameOfTracebackSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'tracemalloc.start() remembers WHERE an allocation happened — but only the very last step',
      points: [
        'The main page\'s own theory covers tracemalloc.start() and take_snapshot() as the standard way to track memory allocations "per line," without mentioning that "per line" comes with a default limitation on how much CALLER context is actually captured. Python\'s own tracemalloc documentation states the default precisely: "By default, a trace of a memory block only stores the most recent frame: the limit is 1." The function signature confirms this directly: tracemalloc.start(nframe=1).',
        'This means that by default, when tracemalloc reports where a chunk of memory was allocated, it shows exactly ONE stack frame — the single line that directly called the memory-allocating operation. If that line lives inside a small, generic, widely-reused helper function (a list-append utility, a caching wrapper, a serialization helper called from dozens of different places in a codebase), the default snapshot shows that helper\'s own frame and nothing above it — no indication of which of its many callers is actually responsible for the memory growth.',
        'Python\'s own docs are explicit that increasing this depth is a deliberate, available choice, not something tracemalloc simply cannot do: "Storing more than 1 frame is only useful to compute statistics grouped by \'traceback\' or to compute cumulative statistics." Calling tracemalloc.start(25) (or any nframe greater than 1) captures a full call-chain traceback for every tracked allocation, at the cost of additional memory and CPU overhead for tracking that deeper chain.',
      ]
    },
    {
      heading: 'Why this specifically bites the debugging workflow the main page itself describes',
      points: [
        'The main page\'s own QnA describes a diagnostic workflow that leans directly on traceback depth without saying so: "use tracemalloc snapshots at different times and compare: snapshot2.compare_to(snapshot1, \'lineno\')." Comparing by \'lineno\' groups allocations by their single captured frame\'s file+line — with the default nframe=1, that grouping is only as specific as "this one line inside this one helper function," collapsing every different CALLER of that helper into one combined statistic.',
        'For a genuinely shared allocation site — say, a generic cache.set(key, value) helper called from twelve different parts of an application — the default snapshot comparison can correctly identify "cache.set()\'s own line is where memory is growing" while providing zero information about WHICH of the twelve call sites is actually driving that growth. The developer still has to go hunting through the codebase for every caller of cache.set(), rather than getting an answer directly from the profiler.',
        'The fix follows directly from the documented mechanism: calling tracemalloc.start(N) with N greater than 1 (Python\'s own docs use 25 as an example elsewhere) before starting the trace captures the full call chain up to N frames for every tracked allocation — and grouping a later snapshot\'s statistics by \'traceback\' instead of \'lineno\' (as the docs themselves note is the specific reason deeper frames are useful) then reveals exactly which caller chain is responsible, distinguishing the twelve different callers of the same shared helper from each other.',
      ]
    }
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Default nframe=1 collapses every caller of a shared helper into one line',
      language: 'typescript',
      code: `import tracemalloc

tracemalloc.start()   # default: nframe=1

_cache: dict = {}

def cache_set(key, value):
    _cache[key] = value   # <-- the ONE frame tracemalloc will show,
                            # no matter which caller reached this line

def load_user_profile(user_id):
    data = {"id": user_id, "bio": "x" * 10_000}   # simulate a big value
    cache_set(f"user:{user_id}", data)

def load_product_catalog(catalog_id):
    data = {"id": catalog_id, "items": ["x" * 10_000] * 50}
    cache_set(f"catalog:{catalog_id}", data)

for i in range(1000):
    load_user_profile(i)
for i in range(1000):
    load_product_catalog(i)

snapshot = tracemalloc.take_snapshot()
top_stats = snapshot.statistics("lineno")

print(top_stats[0])
# Reports something like:
#   mymodule.py:9: size=..., count=2000
# -- attributing the growth to cache_set()'s own assignment line --
# but with NO way to tell, from this output alone, how much of that
# came from load_user_profile() vs. load_product_catalog(). Both
# callers' allocations are collapsed into the same single frame.`,
    },
    {
      label: 'nframe=25 plus grouping by traceback distinguishes the actual callers',
      language: 'typescript',
      code: `import tracemalloc

# THE FIX: request a deeper traceback up front, per tracemalloc's
# own documented nframe parameter -- 25 is the exact example value
# used in Python's own docs for capturing a genuinely useful chain.
tracemalloc.start(25)

_cache: dict = {}

def cache_set(key, value):
    _cache[key] = value

def load_user_profile(user_id):
    data = {"id": user_id, "bio": "x" * 10_000}
    cache_set(f"user:{user_id}", data)

def load_product_catalog(catalog_id):
    data = {"id": catalog_id, "items": ["x" * 10_000] * 50}
    cache_set(f"catalog:{catalog_id}", data)

for i in range(1000):
    load_user_profile(i)
for i in range(1000):
    load_product_catalog(i)

snapshot = tracemalloc.take_snapshot()

# THE KEY CHANGE: group by 'traceback' instead of 'lineno' -- per
# tracemalloc's own docs, this is specifically what deeper frame
# capture is "useful" for.
top_stats = snapshot.statistics("traceback")

for stat in top_stats[:2]:
    print(stat)
    for line in stat.traceback.format():
        print("  ", line)
# NOW the two allocation sources show as SEPARATE entries, each with
# its own full call chain -- one traceback ending in
# load_product_catalog(), the other in load_user_profile() -- since
# the captured frames beyond cache_set() itself now differ between
# the two call paths, distinguishing them where the nframe=1 default
# could not.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A team suspects a memory leak somewhere in their request-handling code, all of which eventually calls a shared serialize_response(data) helper used by 15 different API endpoints. They add tracemalloc.start() (no arguments) and compare snapshots before/after a load test, then call snapshot2.compare_to(snapshot1, "lineno"). The result correctly shows serialize_response()\'s own line as the single biggest source of growth, but the team is stuck — they still don\'t know WHICH of the 15 endpoints is actually leaking. Explain why, using what this subtopic covers, and describe the fix.',
    hint: 'Per this subtopic\'s theory, how many stack frames does tracemalloc.start() (with no arguments) capture by default for each tracked allocation? Does grouping snapshot statistics by "lineno" reveal anything about which of the 15 different CALLERS reached that shared helper\'s line?',
    solution: 'The team is stuck because tracemalloc.start() with no arguments uses the documented default of nframe=1, capturing only the single, most recent frame for every tracked allocation — per this subtopic\'s theory, this means every one of the 15 endpoints\' calls into serialize_response() collapses into the exact same reported frame (serialize_response()\'s own allocating line), with zero information captured about which higher-level caller reached it. Grouping by "lineno," as the team did, groups allocations by that same single captured frame — since all 15 endpoints share the identical frame at that depth, the statistics can only ever report the aggregate total for "the response serializer," never break it down by the endpoint that triggered each individual allocation. The fix is to restart the trace with a deeper frame count — tracemalloc.start(25) (using the value Python\'s own docs use as their working example) — before running the same before/after comparison again. With a deeper capture, each allocation\'s recorded traceback now extends beyond serialize_response()\'s own frame, up through however many intermediate calls separate it from the actual endpoint handler that originally triggered it. Critically, the team also needs to group the comparison by "traceback" instead of "lineno" this time — per tracemalloc\'s own documented statement that "storing more than 1 frame is only useful to compute statistics grouped by \'traceback\'" — since grouping by lineno alone would still collapse everything to serialize_response()\'s own line even with the deeper capture available. Only the combination of a larger nframe AND traceback-based grouping actually surfaces which of the 15 endpoints\' call chains is responsible for the disproportionate share of growth.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'tracemalloc.start() automatically captures the FULL call stack for every tracked memory allocation, the same way a debugger\'s stack trace shows every frame back to program start — the "lineno" grouping is just one way to summarize that already-complete information.',
      reality: 'This subtopic\'s theory and first code example show the opposite is the documented default — Python\'s own docs state "by default, a trace of a memory block only stores the most recent frame: the limit is 1," meaning tracemalloc.start() with no arguments captures only ONE frame per allocation unless a larger nframe value is explicitly requested.'
    },
    {
      thought: 'If tracemalloc\'s snapshot comparison correctly identifies which LINE of code is allocating the most memory, that is sufficient information to know which part of the application is responsible for a memory leak.',
      reality: 'This subtopic\'s theory and exercise show this breaks down completely for any shared helper function called from multiple places — with the default nframe=1, every caller of that shared line collapses into one combined statistic, correctly identifying WHERE the allocation happens but providing no way to distinguish WHICH caller is actually responsible, unless a deeper traceback was captured from the start.'
    },
    {
      thought: 'Since tracemalloc.start() accepts an nframe argument, simply passing a large number like 25 to tracemalloc.start(25) is sufficient by itself to see the full caller chain in any later snapshot statistics, regardless of how those statistics are grouped.',
      reality: 'This subtopic\'s second code example shows a deeper nframe alone is not sufficient — Python\'s own docs state storing more than 1 frame "is only useful to compute statistics grouped by \'traceback\'," meaning the snapshot statistics call also needs to explicitly group by "traceback" (not the default-feeling "lineno") to actually surface and distinguish the additional captured caller frames.'
    }
  ];
}
