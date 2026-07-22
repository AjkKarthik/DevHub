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
  templateUrl: './a-contextmanager-generator-is-single-use-only.html',
  styleUrl: './a-contextmanager-generator-is-single-use-only.scss'
})
export class AContextmanagerGeneratorIsSingleUseOnlySubtopic {

  theory: TheoryPoint[] = [
    {
      heading: '@contextmanager objects are single-use — reusing the same instance a second time raises RuntimeError',
      points: [
        'The main page\'s own temp_env_var() example calls the decorated function fresh inside every with statement: with temp_env_var("DEBUG", "1"):. This is the correct, safe pattern — but it never shows what happens if you instead call the function ONCE, store the resulting context manager object in a variable, and try to reuse that SAME object in a second with block.',
        'Python\'s own contextlib documentation is explicit: "Context managers created using contextmanager() are also single use context managers, and will complain about the underlying generator failing to yield if an attempt is made to use them a second time." Since a @contextmanager-decorated function is a generator function, calling it once creates one generator object — and a Python generator can only run past its single yield once; a second attempt to advance it finds nothing left to yield.',
        'The exact failure mode is RuntimeError: generator didn\'t yield — raised when the with statement\'s second attempt to call __enter__ tries to advance the already-exhausted generator to a yield point that no longer exists. This is a fundamentally different exception than what a class-based context manager would raise if reused (which depends entirely on that class\'s own __enter__ implementation, and might work fine, or fail differently, or not fail at all).',
      ]
    },
    {
      heading: 'Why this matters, and the one case where reuse genuinely works',
      points: [
        'The safe, idiomatic pattern the main page\'s own theory already shows is CALLING the decorated function fresh each time a context manager instance is needed — with temp_env_var(...) as ...: creates a brand NEW generator every time that line runs, so this pattern is never at risk of the single-use limitation, even used repeatedly in a loop.',
        'There IS one place a single @contextmanager-decorated function genuinely supports repeated use: as a decorator via ContextDecorator, where the decorated FUNCTION (not a stored context manager instance) is called fresh on every invocation, creating a new generator each time — the single-use limitation only bites when the same already-instantiated context manager OBJECT is reused, not when the same generator FUNCTION is called again.',
      ]
    }
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Reusing the same @contextmanager object raises RuntimeError',
      language: 'typescript',
      code: `import contextlib

@contextlib.contextmanager
def managed_resource(name):
    print(f"acquiring {name}")
    try:
        yield name
    finally:
        print(f"releasing {name}")

# Calling the FUNCTION each time — safe, the idiomatic pattern:
with managed_resource("A") as r:
    print(f"using {r}")
with managed_resource("A") as r:   # a BRAND NEW generator each time
    print(f"using {r}")            # works fine, twice

# Storing ONE context manager object and reusing it — NOT safe:
cm = managed_resource("B")   # calls the function ONCE — one generator
with cm as r:
    print(f"using {r}")
with cm as r:   # SAME already-exhausted generator object
    print(f"using {r}")
# RuntimeError: generator didn't yield
# — the generator already ran past its single yield the first time;
#   there's nothing left to advance to on the second __enter__.`,
    },
    {
      label: 'Where this actually surfaces — accidentally caching the CM object',
      language: 'typescript',
      code: `import contextlib

@contextlib.contextmanager
def db_transaction():
    conn = get_connection()
    try:
        yield conn
    finally:
        conn.close()

class Service:
    def __init__(self):
        # WRONG — this calls db_transaction() ONCE at construction
        # time and stores the resulting single-use context manager.
        self._transaction_cm = db_transaction()

    def run(self, query):
        with self._transaction_cm as conn:   # fine the FIRST time...
            conn.execute(query)
        # ...RuntimeError: generator didn't yield the SECOND time
        # self.run() is called, since self._transaction_cm is the
        # same already-exhausted context manager object.

class ServiceFixed:
    def run(self, query):
        # RIGHT — call the generator function fresh on every use,
        # producing a brand new context manager each time.
        with db_transaction() as conn:
            conn.execute(query)`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A class caches a @contextmanager-decorated database transaction context manager as an instance attribute in __init__, intending to reuse it across every call to a run_query() method for "efficiency," reasoning that creating the context manager once and reusing it avoids repeated setup overhead. The first call to run_query() works perfectly; every subsequent call raises RuntimeError: generator didn\'t yield. Explain why, using what this subtopic covers, and describe the fix.',
    hint: 'What does calling a @contextmanager-decorated function actually create — a reusable object, or a one-shot generator? Does storing the RESULT of calling it once in __init__, then reusing that same stored object repeatedly, match the safe pattern this subtopic\'s theory describes, or the unsafe one?',
    solution: 'The RuntimeError happens because calling a @contextmanager-decorated function creates a genuinely single-use generator object, and per Python\'s own documentation, "context managers created using contextmanager() are also single use context managers, and will complain about the underlying generator failing to yield if an attempt is made to use them a second time." Caching the RESULT of calling the transaction function once in __init__ means every subsequent run_query() call reuses that exact same, already-exhausted generator object — the first with block runs it through its single yield successfully, but every following with block tries to advance the same generator past a yield point that no longer exists, which is exactly what produces RuntimeError: generator didn\'t yield. The team\'s efficiency reasoning was based on an incorrect assumption — there IS no meaningful "setup cost" being saved by caching the context manager instance itself, since context managers created this way are inherently cheap, single-use objects; the actual expensive work (opening a real database connection) happens INSIDE the generator body each time it runs, not in the act of calling the decorated function. The fix is calling the transaction function fresh inside run_query() itself — with db_transaction() as conn: — rather than reusing a cached instance from __init__, exactly matching the safe pattern this subtopic\'s theory describes: call the FUNCTION each time a context manager instance is actually needed, never reuse an already-used context manager OBJECT.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'A context manager object created by calling a @contextmanager-decorated function can be safely stored and reused across multiple with blocks, the same way many ordinary Python objects can be used repeatedly without issue.',
      reality: 'This subtopic\'s theory and first code example both show this is incorrect — Python\'s own documentation explicitly states these are "single use context managers," and reusing the same already-used instance in a second with block raises RuntimeError: generator didn\'t yield, since the underlying generator has already run past its one and only yield point.'
    },
    {
      thought: 'Caching a @contextmanager-decorated function\'s result once (instead of calling the function fresh every time a context manager is needed) is a reasonable optimization to avoid repeated setup overhead, similar to caching any other moderately expensive object.',
      reality: 'This subtopic\'s exercise shows this reasoning is based on a false premise — there is no setup cost saved by caching the context manager object itself, since creating one is cheap; the actual expensive work happens inside the generator body each time it genuinely runs, meaning the "optimization" only introduces a guaranteed RuntimeError on the second use with no actual performance benefit.'
    },
    {
      thought: 'Since the single-use limitation applies to @contextmanager-decorated functions, using such a context manager as a decorator (via ContextDecorator, applied to a function called many times) must also break after the first call, for the same reason.',
      reality: 'This subtopic\'s theory explains the opposite — using the decorated function AS a decorator calls the underlying generator FUNCTION fresh on every invocation of the decorated function, creating a brand new generator object each time, which is precisely the safe pattern (calling the function repeatedly) rather than the unsafe one (reusing one stored generator object).'
    }
  ];
}
