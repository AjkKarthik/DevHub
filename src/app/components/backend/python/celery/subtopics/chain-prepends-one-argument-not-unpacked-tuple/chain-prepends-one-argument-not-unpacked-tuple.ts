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
  templateUrl: './chain-prepends-one-argument-not-unpacked-tuple.html',
  styleUrl: './chain-prepends-one-argument-not-unpacked-tuple.scss'
})
export class ChainPrependsOneArgumentNotUnpackedTupleSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'A chain link prepends the WHOLE return value as one argument — never unpacks it',
      points: [
        'The main page\'s own code example shows chain(download.s(urls[0]) | process.s()) — a single string flowing from one task into the next — which makes the passing mechanism look simpler than it actually is for multi-value returns. Celery\'s own canvas docs demonstrate the real mechanism: chain(add.s(2,2), add.s(4), add.s(8))() produces 16, with each result becoming the next task\'s first positional argument, prepended to whatever args that signature already had.',
        'Celery\'s own source (in the task-success dispatch path that fires the next link in a chain) wraps the previous task\'s return value in a single-element tuple before merging it with the next signature\'s own arguments — regardless of what type that return value actually is. If the previous task returns a plain string or int, that single-element wrapping is invisible; the next task simply receives it as its first argument, exactly like the main page\'s example shows.',
        'But if the previous task returns a tuple or list — return (total_words, total_chars) — that whole tuple becomes the SINGLE first argument of the next task, not two separate arguments. next_task(a, b) does NOT happen automatically just because the previous task returned a 2-tuple; the next task actually receives next_task((a, b)) — one argument whose value happens to be a 2-tuple, unless its own signature explicitly expects and unpacks it.',
      ]
    },
    {
      heading: 'There is no built-in "unpack this tuple into multiple args" option — you write it by hand',
      points: [
        'This surprises developers coming from plain Python, where returning a tuple from a function and immediately calling another function with **unpacked** values is a common, easy pattern (though even in plain Python that requires an explicit * unpacking — the surprise here is more about expecting Celery\'s canvas system to do that unpacking FOR you automatically across the task boundary, since the chain already does SOME automatic argument wiring).',
        'Celery provides no documented option to opt into automatic unpacking for a chain link — nothing like a special "spread" flag on chain() or on a signature. The two real, documented-pattern workarounds are both manual: either the RECEIVING task\'s own signature explicitly destructures the incoming single argument (def next_task(result): a, b = result; ...), or the SENDING task returns a dict instead of a positional tuple, so the receiving task accesses named keys (result["total_words"]) rather than relying on positional unpacking at all.',
        'This has a direct consequence for the main page\'s own chord pattern too — chord(group(...), aggregate.s()) passes the ENTIRE list of group results as the single first argument to aggregate(results: list[dict]), which is exactly why the main page\'s own aggregate() signature takes one list parameter rather than trying to receive each group member\'s result as a separate argument. The "whole value becomes one argument" rule is the same underlying mechanism in both chain and chord — chord just happens to naturally want a list as that one argument, so the behavior looks less surprising there than it does in a chain passing a tuple.',
      ]
    }
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'A tuple return does NOT unpack into two arguments for the next task',
      language: 'typescript',
      code: `from celery import chain

@app.task
def compute_stats(text: str) -> tuple[int, int]:
    words = len(text.split())
    chars = len(text)
    return (words, chars)   # returns a 2-tuple

@app.task
def format_report(stats, label: str) -> str:
    # BUG: expecting compute_stats' two values to arrive as two
    # separate positional arguments — they do NOT.
    words, chars = stats   # 'stats' is a tuple, works IF unpacked here
    return f"{label}: {words} words, {chars} chars"

@app.task
def format_report_wrong(words: int, chars: int, label: str) -> str:
    # This signature EXPECTS two separate ints — but a chain never
    # unpacks a tuple return into multiple arguments, so this will
    # raise a TypeError (missing/misaligned arguments) when called
    # from a chain, since the WHOLE tuple lands in 'words' alone.
    return f"{label}: {words} words, {chars} chars"

# Correct: the receiving task destructures the single tuple argument
pipeline = chain(compute_stats.s("some text here") | format_report.s("Report"))
pipeline.apply_async()
# compute_stats returns (2, 15) -> format_report receives stats=(2, 15),
# label="Report" -- ONE tuple argument plus the chain-supplied "Report",
# not four separately-unpacked positional values.`,
    },
    {
      label: 'Two manual workarounds: destructure in the next task, or return a dict',
      language: 'typescript',
      code: `from celery import chain

# Workaround 1: the RECEIVING task destructures the tuple manually
@app.task
def compute_stats(text: str) -> tuple[int, int]:
    return (len(text.split()), len(text))

@app.task
def format_report_v1(stats: tuple[int, int], label: str) -> str:
    words, chars = stats   # manual unpacking — this is the pattern,
                             # not anything Celery does automatically
    return f"{label}: {words} words, {chars} chars"

# Workaround 2: return a dict instead, access by name downstream —
# often preferred since it self-documents what each field means
@app.task
def compute_stats_dict(text: str) -> dict:
    return {"words": len(text.split()), "chars": len(text)}

@app.task
def format_report_v2(stats: dict, label: str) -> str:
    return f"{label}: {stats['words']} words, {stats['chars']} chars"

chain(compute_stats_dict.s("some text") | format_report_v2.s("Report")).apply_async()

# The SAME underlying mechanism explains the main page's own chord
# pattern: aggregate(results: list[dict]) receives the group's ENTIRE
# results list as ONE argument -- chord never unpacks the group's N
# individual results into N separate arguments for the callback either.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A developer writes chain(fetch_coordinates.s(address) | reverse_geocode.s()), where fetch_coordinates returns (latitude, longitude) as a 2-tuple, and reverse_geocode is defined as def reverse_geocode(lat: float, lon: float) -> str: .... The chain raises a TypeError about a missing positional argument the moment it runs. Explain exactly why, using what this subtopic covers, and give the corrected reverse_geocode signature.',
    hint: 'How many arguments does reverse_geocode\'s current signature expect, and how many does the chain actually pass it? Per this subtopic\'s theory, does the (latitude, longitude) tuple returned by fetch_coordinates get split into two separate positional arguments, or delivered as one?',
    solution: 'The TypeError happens because reverse_geocode(lat: float, lon: float) expects TWO separate positional arguments, but the chain link only ever delivers ONE — per this subtopic\'s theory, a chain prepends the previous task\'s entire return value as a single first argument to the next task, without ever unpacking a tuple or list return into multiple separate arguments. Since fetch_coordinates returns (latitude, longitude) as one 2-tuple, reverse_geocode actually receives a single positional argument whose value happens to be that tuple — Python then tries to bind that one tuple to the lat parameter and finds nothing left over for lon, raising a "missing 1 required positional argument: \'lon\'" TypeError. The fix is to make reverse_geocode\'s signature match what the chain actually delivers — a single argument that is itself the tuple — and destructure it manually inside the function body: def reverse_geocode(coordinates: tuple[float, float]) -> str: lat, lon = coordinates; .... This matches the exact pattern shown in this subtopic\'s second code example (Workaround 1) — the receiving task\'s signature accepts the single incoming value and unpacks it itself, rather than expecting Celery\'s chain mechanism to have already split it into separate arguments before the call.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'If a Celery task in a chain returns a tuple like (a, b), the next task in the chain automatically receives it as two separate positional arguments, the same way Python\'s own function_that_returns_tuple() unpacking works with an explicit * in plain code.',
      reality: 'This subtopic\'s theory and first code example show a chain always prepends the ENTIRE return value as a SINGLE argument to the next task\'s signature — a returned tuple or list is delivered as one argument whose value happens to be that tuple/list, never automatically split into multiple separate positional arguments for the next task to receive.'
    },
    {
      thought: 'Celery\'s canvas system (chain, chord) provides some documented option or signature flag to opt into automatically unpacking a multi-value return into separate arguments for the next task, since the framework already does other automatic argument wiring.',
      reality: 'This subtopic\'s theory and second code example show no such built-in mechanism exists — the two real, working patterns are both manual: the receiving task\'s own function body destructures the single incoming tuple/list itself, or the sending task returns a dict so the receiving task accesses named keys instead of relying on any kind of automatic positional unpacking.'
    },
    {
      thought: 'The "whole value becomes one argument" behavior is unique to chain() and does not apply to chord()\'s callback, since a chord callback is conceptually different (aggregating many results, not passing one task\'s output to the next).',
      reality: 'This subtopic\'s theory shows chord uses the exact same underlying mechanism — a chord callback like aggregate(results: list[dict]) receives the group\'s entire list of results as ONE single argument, never unpacked into N separate positional arguments for N group members. It looks less surprising in chord\'s case only because a list argument matching "a list of results" feels natural, but the mechanism generating it is identical to what a chain does with any return value.'
    }
  ];
}
