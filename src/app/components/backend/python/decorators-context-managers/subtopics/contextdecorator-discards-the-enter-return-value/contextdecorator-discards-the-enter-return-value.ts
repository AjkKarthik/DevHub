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
  templateUrl: './contextdecorator-discards-the-enter-return-value.html',
  styleUrl: './contextdecorator-discards-the-enter-return-value.scss'
})
export class ContextdecoratorDiscardsTheEnterReturnValueSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'Used as a decorator, a ContextDecorator\'s __enter__() return value has nowhere to go',
      points: [
        'The main page\'s own QnA mentions this capability in passing: "contextlib.ContextDecorator makes a class-based CM also usable as a decorator" — without covering what happens to the value __enter__() returns when the context manager is used this way, instead of in an ordinary with ... as x: statement.',
        'In a with statement, the as clause gives you an explicit place to bind __enter__()\'s return value — with Timer() as t: (from the main page\'s own example) captures the Timer instance itself. Decorator syntax, @my_context_manager, has no equivalent mechanism at all — there is no "as" slot anywhere in @decorator def fn(): ... for a return value to bind to.',
        'Python\'s own contextlib documentation states this limitation directly: "there\'s one additional limitation when using context managers as function decorators: there\'s no way to access the return value of __enter__(). If that value is needed, then it is still necessary to use an explicit with statement." This isn\'t a bug or an oversight — it\'s a structural consequence of decorator syntax simply not providing anywhere for that value to go.',
      ]
    },
    {
      heading: 'What this means in practice',
      points: [
        'A ContextDecorator designed to be used both ways needs its __enter__() return value to be genuinely OPTIONAL for its core purpose — the main page\'s own Timer example, whose __enter__ returns self purely so t.elapsed can be read afterward via the as binding, would lose that specific capability entirely if used as @Timer() instead of with Timer() as t:. The timing itself would still happen; only the ability to retrieve t.elapsed afterward would be gone.',
        'This is the deciding factor for choosing between the two usage styles for a dual-purpose context manager: use @my_cm as a decorator when the setup/teardown behavior alone is all that\'s needed (no value from inside the block required afterward) — use the explicit with my_cm() as x: form whenever the code needs to read something back out of __enter__()\'s return value, exactly as Python\'s own docs recommend.',
      ]
    }
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Same class, two usage styles — one loses the __enter__ return value',
      language: 'typescript',
      code: `import time
from contextlib import ContextDecorator

class Timer(ContextDecorator):
    def __enter__(self):
        self.start = time.perf_counter()
        return self   # returned value — captured via 'as' in a with block

    def __exit__(self, *exc):
        self.elapsed = time.perf_counter() - self.start
        return False

# As a context manager — 'as t' captures __enter__()'s return value:
with Timer() as t:
    sum(range(10**6))
print(t.elapsed)   # works — t IS the Timer instance __enter__() returned

# As a decorator — there is NO equivalent binding available at all:
@Timer()
def compute():
    return sum(range(10**6))

compute()
# The timing still happens internally (start/elapsed are still set
# on SOME Timer instance) — but there is no variable anywhere in this
# decorator syntax that captures it. .elapsed is simply unreachable
# from the caller's side when used this way.`,
    },
    {
      label: 'Designing a dual-purpose context manager correctly',
      language: 'typescript',
      code: `import time, logging
from contextlib import ContextDecorator

class LogDuration(ContextDecorator):
    """Only NEEDS its side effect (logging) — never needs the
    __enter__() return value read back out. Safe as a decorator."""
    def __init__(self, label):
        self.label = label

    def __enter__(self):
        self._start = time.perf_counter()
        return self   # fine to return self — just never READ by
                        # decorator-style callers, and that's OK here

    def __exit__(self, *exc):
        elapsed = time.perf_counter() - self._start
        logging.info(f"{self.label} took {elapsed:.3f}s")
        return False

@LogDuration("compute_job")   # decorator use — fine, no return value needed
def compute_job():
    return sum(range(10**6))

with LogDuration("adhoc_block"):   # with-statement use — also fine
    sum(range(10**6))

# Both usages work correctly here because LogDuration's whole
# purpose (logging as a side effect) never depended on reading
# anything back out of __enter__()'s return value in the first place.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A team writes a DatabaseTransaction(ContextDecorator) class whose __enter__() returns a live connection object, intending it to be used as @DatabaseTransaction() on service methods so every call runs inside a transaction. Inside one such decorated method, the code tries to access the connection to run a query, but has no way to actually reference it — there\'s no with ... as conn: anywhere. Explain the structural reason this doesn\'t work, using what this subtopic covers, and describe two possible fixes.',
    hint: 'Does decorator syntax (@DatabaseTransaction()) provide any equivalent to a with statement\'s "as" clause for capturing __enter__()\'s return value? What does this subtopic\'s theory say happens to that return value specifically when a context manager is used as a decorator instead?',
    solution: 'This doesn\'t work because decorator syntax has no equivalent to the with statement\'s as clause — per Python\'s own contextlib documentation, "there\'s no way to access the return value of __enter__()" when a context manager is used as a decorator; "if that value is needed, then it is still necessary to use an explicit with statement." The transaction itself genuinely starts and ends correctly around the decorated method\'s execution (that part of ContextDecorator\'s behavior works exactly as expected), but the live connection object __enter__() returns has nowhere to bind to inside the decorated method\'s own code — there is no "as conn" slot anywhere in @DatabaseTransaction() syntax for that value to reach. Two possible fixes: (1) switch from decorator usage to an explicit with statement inside the method body — def run_query(self): with DatabaseTransaction() as conn: conn.execute(...) — which restores the ability to capture the connection via as, at the cost of losing the decorator\'s more compact call-site syntax; (2) if the decorator-call-site syntax genuinely needs to be kept, have the context manager expose the active connection through some OTHER channel that doesn\'t depend on __enter__()\'s return value — for example, a thread-local or contextvars-based "current transaction" accessor that the decorated method calls internally (conn = DatabaseTransaction.current()) instead of relying on a captured reference at all.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'Since ContextDecorator lets the exact same class be used either as a context manager (with cm() as x:) or as a decorator (@cm()), both usage styles must provide access to the same information, including whatever __enter__() returns.',
      reality: 'This subtopic\'s theory and first code example both show this is incorrect — Python\'s own documentation explicitly confirms there is no way to access __enter__()\'s return value when the context manager is used as a decorator, unlike the with-statement form, which can always capture it via as.'
    },
    {
      thought: 'If a ContextDecorator-based class is used as a decorator and its __enter__() return value seems unreachable, that must indicate a bug or missing feature in the class itself, or in how it was applied.',
      reality: 'This subtopic\'s exercise shows the opposite — this is expected, structural behavior with no workaround at the decorator-syntax level itself; the fix is either switching to an explicit with statement where the return value is genuinely needed, or exposing the needed data through a different mechanism entirely.'
    },
    {
      thought: 'A dual-purpose context manager class should always be designed to return something meaningful from __enter__(), since that is generally considered good practice for context managers.',
      reality: 'This subtopic\'s second code example shows a more nuanced picture — for a context manager genuinely intended to support BOTH usage styles, __enter__()\'s return value should be treated as OPTIONAL, needed only for with-statement callers; a class relying on that return value for its core functionality effectively loses that functionality when used as a decorator.'
    }
  ];
}
