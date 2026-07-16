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
  templateUrl: './abandoning-a-generator-still-triggers-its-finally-block.html',
  styleUrl: './abandoning-a-generator-still-triggers-its-finally-block.scss'
})
export class AbandoningAGeneratorStillTriggersItsFinallyBlockSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'Never finishing a generator still runs its try/finally or with-block cleanup — via close() and GeneratorExit',
      points: [
        'The main page\'s own read_lines() generator (with open(path) as f: yield from f) is presented as a clean pattern for lazily reading a file — but the main page never addresses what happens if the CALLER stops consuming it early (say, a for loop that break early, or a pipeline function that only ever calls next() a few times before losing its reference to the generator). Does the file genuinely get closed?',
        'Python\'s own language reference documents the exact mechanism: generator.close() "raises a GeneratorExit exception at the point where the generator function was paused... The exception is raised by the yield expression where the generator was paused." So if something explicitly calls close() on a suspended generator, execution resumes at its current yield — but instead of receiving a normal value, a GeneratorExit exception is thrown there, unwinding through any try/finally or with block exactly like any other exception would, running their cleanup code.',
        'Crucially, this isn\'t only triggered by an explicit close() call — the same section states: "If the generator is not resumed before it is finalized (by reaching a zero reference count or by being garbage collected), the generator-iterator\'s close() method will be called, allowing any pending finally clauses to execute." So simply letting a generator object go out of scope (no explicit close() call at all) still triggers this same cleanup mechanism once it\'s garbage collected — meaning the main page\'s own read_lines() generator DOES reliably close its file even if a caller abandons it mid-iteration, without ever calling close() themselves.',
      ]
    },
    {
      heading: 'The one real caveat: WHEN this cleanup happens is not always immediate',
      points: [
        'This is genuinely part of the Python language specification (any conforming implementation must honor it), so the cleanup is guaranteed to eventually happen — but the language reference does not guarantee it happens IMMEDIATELY the moment the last reference disappears. Under CPython\'s reference-counting garbage collector, an unreferenced generator is typically collected (and close() called) essentially right away, so the main page\'s own file-reading pattern closes its file promptly in practice on CPython.',
        'On a Python implementation without immediate reference counting (a purely cyclic/deferred garbage collector), finalization — and therefore the file-close/cleanup logic — could be delayed until a garbage collection cycle actually runs, rather than happening the instant the generator becomes unreachable. Code that genuinely needs a resource closed at a precise, deterministic moment (not "eventually, whenever GC gets to it") should still call close() explicitly, or better, wrap generator consumption in an explicit with-statement-driven context rather than relying purely on garbage-collection timing.',
      ]
    }
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Abandoning a generator mid-iteration still closes its file',
      language: 'typescript',
      code: `def read_lines(path):
    print("opening file")
    with open(path) as f:
        try:
            yield from f
        finally:
            print("file closed via finally")   # runs even if abandoned!

def first_line_only(path):
    gen = read_lines(path)
    line = next(gen)          # only ONE line is ever consumed
    return line
    # 'gen' goes out of scope here — nothing else references it.

result = first_line_only("data.txt")
# Output:
# opening file
# file closed via finally    <- ran automatically when gen was
#                                garbage collected, even though the
#                                file had many more lines left unread`,
    },
    {
      label: 'Explicit close() throws GeneratorExit at the paused yield',
      language: 'typescript',
      code: `def counting_resource():
    print("acquiring resource")
    try:
        for i in range(1000000):
            yield i
    finally:
        print("releasing resource")   # runs on close(), not just on
                                        # natural exhaustion

gen = counting_resource()
print(next(gen))   # "acquiring resource", then 0

gen.close()   # explicitly abandon the generator early
# "releasing resource" prints immediately — close() raised
# GeneratorExit exactly at the 'yield i' where gen was paused,
# unwinding through the try/finally on its way out.

next(gen)   # StopIteration — the generator is now permanently done`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A team writes a generator that acquires a database connection, yields query results one row at a time, and releases the connection in a finally block: def query(sql): conn = acquire_connection(); try: for row in conn.execute(sql): yield row; finally: conn.release(). A caller does for row in query("SELECT * FROM big_table"): if row.id == target_id: break — stopping the loop as soon as it finds a match, long before all rows are consumed. A teammate is worried this leaks the database connection forever, since the loop never reaches the generator\'s natural exhaustion. Evaluate this concern using what this subtopic covers.',
    hint: 'When a for loop exits early via break, what happens to the generator object being iterated — does anything still reference it afterward? What does this subtopic\'s theory say happens to a generator\'s pending finally block once it becomes unreferenced and gets garbage collected?',
    solution: 'The concern is understandable but, per Python\'s own documented behavior, not something that causes a connection leak in the way described — once the for loop exits via break, the generator object returned by query(sql) is no longer referenced by anything (the for loop held the only reference, implicitly, as its iterator), making it eligible for garbage collection. Per Python\'s own language reference, "if the generator is not resumed before it is finalized... the generator-iterator\'s close() method will be called, allowing any pending finally clauses to execute" — so once the generator IS garbage collected, close() runs automatically, raising GeneratorExit at the exact yield row point where the generator was paused, which unwinds through the try/finally exactly as documented, running conn.release() and correctly releasing the database connection, even though the loop never reached the query\'s full result set. The one genuine caveat worth flagging (not a leak, but a timing consideration): this cleanup is guaranteed to EVENTUALLY happen per the language spec, but under a Python implementation without CPython\'s immediate reference-counting behavior, the exact moment of garbage collection (and therefore the exact moment conn.release() runs) is not guaranteed to be instantaneous — for code where releasing the connection at a precise, deterministic point matters (e.g., a connection pool with a small limit under heavy concurrent load), explicitly calling gen.close() right after break (or restructuring the caller to use a with-statement-based generator context manager) removes any reliance on garbage-collection timing at all.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'If a for loop stops consuming a generator early (via break, or simply losing interest before exhaustion), any try/finally or with block inside that generator\'s body is permanently skipped, since the generator function never actually reaches its own natural end.',
      reality: 'This subtopic\'s theory and both code examples show the opposite — Python\'s own documentation guarantees that finalizing an unreferenced, un-exhausted generator (via garbage collection) automatically calls its close() method, which raises GeneratorExit at the paused yield point and correctly runs any pending finally/with-block cleanup.'
    },
    {
      thought: 'This automatic cleanup-on-abandonment behavior is a CPython-specific implementation quirk (related to its reference-counting garbage collector) rather than something the Python language itself guarantees — other Python implementations might not honor it at all.',
      reality: 'This subtopic\'s theory explains the opposite — the close()-on-finalization behavior is documented in the Language Reference itself, meaning any conforming Python implementation must eventually run this cleanup; what varies across implementations is only the TIMING of when finalization happens, not whether it happens at all.'
    },
    {
      thought: 'Since this cleanup-on-abandonment mechanism is guaranteed by the language specification, it is always safe to rely on it exclusively for resources (files, connections, locks) that need to be released at a precise, predictable moment, with no need for explicit close() calls or other safeguards.',
      reality: 'This subtopic\'s exercise shows the real nuance — the CLEANUP itself is guaranteed to eventually happen, but its exact TIMING is not guaranteed to be immediate on every Python implementation, so code with strict timing requirements (a small connection pool under load) should still call close() explicitly rather than relying purely on garbage-collection timing.'
    }
  ];
}
