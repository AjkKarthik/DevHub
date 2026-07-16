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
  templateUrl: './stacked-decorators-apply-bottom-up-but-run-top-down.html',
  styleUrl: './stacked-decorators-apply-bottom-up-but-run-top-down.scss'
})
export class StackedDecoratorsApplyBottomUpButRunTopDownSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'Stacked decorators wrap bottom-up when defined, but their wrapper code executes top-down when called',
      points: [
        'The main page\'s own theory states this correctly but only for HALF the picture: "Decorators are applied bottom-up when stacked: @A @B means fn = A(B(fn))." This describes DEFINITION-time wrapping order — Python\'s own language reference confirms the general form is "roughly equivalent to" func = f1(arg)(f2(func)), applied in nested fashion, bottom-up. What the main page doesn\'t spell out is what this means for the ORDER the wrapper code actually RUNS in once the fully-wrapped function is called.',
        'Since the documented equivalence is fn = A(B(fn)), the name fn afterward refers to whatever A(B(fn)) returned — meaning calling fn() now invokes A\'s wrapper FIRST. If A\'s wrapper itself calls the thing it wraps (which is B\'s wrapper around the original function), execution proceeds INTO B\'s wrapper next, and only then into the original function body. So while B was applied first (closest to the function, at the bottom), A\'s code is what actually runs first at call time — execution order is top-down, the exact reverse of the bottom-up application order.',
        'This "bottom-up to build, top-down to run" pattern is a direct, logical consequence of function composition (A(B(fn))\'s outer call is A, so A runs first) — it isn\'t a separate rule to memorize, but it is very easy to get backwards when reading stacked decorators quickly, especially since the visual stacking order (@A above @B) matches the CALL-time order (A\'s code runs before B\'s) even though it\'s the OPPOSITE of the application order the main page\'s own fn = A(B(fn)) formula describes.',
      ]
    },
    {
      heading: 'Why this matters for decorators like the main page\'s own @retry and @timer',
      points: [
        'Order genuinely changes behavior when decorators aren\'t independent of each other — stacking @timer above @retry(times=3) on the same function means @timer\'s wrapper runs first and measures the ENTIRE retry loop\'s duration (including every failed attempt and its sleep delay), while stacking them the other way (@retry above @timer) would time only a single attempt at a time, since @timer\'s wrapper would be the innermost layer, re-entered fresh on every retry.',
        'This is exactly why the main page\'s own recommendation to always use @functools.wraps on every layer matters even more once decorators are stacked — without it, each layer\'s wrapper masquerades as the layer beneath it, making it far harder to tell (via introspection, debugging, or a traceback) which layer\'s code is actually executing at any given point in a multi-decorator stack.',
      ]
    }
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Visually stacked top-to-bottom = execution order top-to-bottom',
      language: 'typescript',
      code: `def announce(label):
    def decorator(fn):
        def wrapper(*args, **kwargs):
            print(f"[{label}] entering")
            result = fn(*args, **kwargs)
            print(f"[{label}] leaving")
            return result
        return wrapper
    return decorator

@announce("A")   # applied SECOND (outer) — but runs FIRST
@announce("B")   # applied FIRST (inner) — but runs SECOND
def greet():
    print("hello")

greet()
# [A] entering   <- A's wrapper runs FIRST at call time
# [B] entering   <- then control passes into B's wrapper
# hello           <- finally, the original function body
# [B] leaving
# [A] leaving

# Definition-time equivalence (from the language reference):
# greet = announce("A")(announce("B")(greet))
#          ^outermost call — runs FIRST when greet() is invoked`,
    },
    {
      label: 'Order genuinely changes behavior — timing the retries vs. timing one attempt',
      language: 'typescript',
      code: `import functools, time

def timer(fn):
    @functools.wraps(fn)
    def wrapper(*args, **kwargs):
        start = time.perf_counter()
        result = fn(*args, **kwargs)
        print(f"{fn.__name__} took {time.perf_counter() - start:.3f}s")
        return result
    return wrapper

def retry(times=3):
    def decorator(fn):
        @functools.wraps(fn)
        def wrapper(*args, **kwargs):
            for attempt in range(times):
                try:
                    return fn(*args, **kwargs)
                except IOError:
                    if attempt == times - 1:
                        raise
        return wrapper
    return decorator

# @timer runs FIRST (outermost) — measures the WHOLE retry loop,
# including every failed attempt and delay.
@timer
@retry(times=3)
def fetch_a(url): ...

# @retry runs FIRST (outermost) here — @timer is now innermost,
# re-entered fresh on EACH individual attempt inside the loop.
@retry(times=3)
@timer
def fetch_b(url): ...`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'Two decorators are stacked as @cache_result above @log_call on the same function. A developer expects log_call\'s "function was called" message to print every single time the function is invoked, since it is the decorator closer to the function definition. Instead, once a result is cached, the log message stops appearing entirely for repeated calls with the same arguments. Explain why, using what this subtopic covers.',
    hint: 'Which decorator is OUTERMOST here — the one applied last, at the top of the stack? At call time, does the outermost wrapper\'s code get a chance to run BEFORE or AFTER it decides whether to call into the layer beneath it?',
    solution: 'cache_result is the outermost decorator (applied last, at the top of the stack, matching the main page\'s own bottom-up application rule: fn = cache_result(log_call(fn))) — which means, per this subtopic\'s theory, cache_result\'s wrapper code is what actually RUNS FIRST at call time, before log_call\'s wrapper ever gets a chance to execute. A typical caching decorator checks its cache BEFORE deciding whether to call the function it wraps at all — if it finds a cached result for the given arguments, it returns that cached value directly and never calls into the wrapped function (which, in this stack, is log_call\'s wrapper around the original function). Since log_call is the INNER layer here, its "function was called" message only ever prints when cache_result\'s wrapper actually decides to call through to it — which only happens on a cache miss. Once a result is cached, cache_result returns early every time, and log_call\'s wrapper is never reached at all, explaining exactly why the log message stops appearing for repeated calls with cached arguments. If the developer genuinely wants "function was called" logged on every invocation, regardless of caching, log_call would need to be the OUTERMOST decorator instead (stacked above cache_result), so its wrapper always runs first, before any cache check happens.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'Since the main page\'s own rule states decorators are "applied bottom-up when stacked," the decorator closest to the function definition (the bottom one) must also be the one whose wrapper code runs FIRST when the final function is actually called.',
      reality: 'This subtopic\'s theory and first code example both show the opposite — application order and call-time execution order are reversed; the TOP (outermost, last-applied) decorator\'s wrapper code is what actually runs first when the function is called, not the bottom one.'
    },
    {
      thought: 'The order two independent, unrelated decorators are stacked in never actually changes a program\'s observable behavior — stacking order is purely a stylistic or readability choice.',
      reality: 'This subtopic\'s second code example shows the opposite — stacking @timer above vs. below @retry produces genuinely different measured behavior (timing the entire retry loop vs. timing one attempt at a time), because which decorator is outermost determines what work its wrapper code actually surrounds.'
    },
    {
      thought: 'A decorator\'s wrapper code always eventually gets a chance to run, regardless of stacking order, since every layer in the stack calls into the layer beneath it exactly once per invocation.',
      reality: 'This subtopic\'s exercise shows this is not guaranteed — an outer decorator (like a caching decorator) can choose NOT to call into the layer beneath it at all under some conditions (a cache hit), meaning an inner decorator\'s wrapper code can be skipped entirely for that call, not just delayed.'
    }
  ];
}
