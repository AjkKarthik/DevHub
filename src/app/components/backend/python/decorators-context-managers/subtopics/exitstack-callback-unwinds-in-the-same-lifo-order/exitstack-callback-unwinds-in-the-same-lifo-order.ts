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
  templateUrl: './exitstack-callback-unwinds-in-the-same-lifo-order.html',
  styleUrl: './exitstack-callback-unwinds-in-the-same-lifo-order.scss'
})
export class ExitstackCallbackUnwindsInTheSameLifoOrderSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'ExitStack.callback() registers plain cleanup functions — unwound in the SAME LIFO order as entered context managers',
      points: [
        'The main page\'s own theory and QnA both describe ExitStack purely through enter_context(): "stack.enter_context(open(p))" for a dynamic list of files, "all of them are exited in reverse order when the ExitStack itself exits." This makes it easy to assume ExitStack only manages context managers — but it can register arbitrary cleanup CALLABLES too, not just objects with __enter__/__exit__.',
        'Python\'s own contextlib documentation describes ExitStack.callback(callback, /, *args, **kwds): it registers an arbitrary callable to run on exit, exactly like enter_context() registers a context manager\'s cleanup. Both kinds of registration — context managers via enter_context()/push(), and plain callables via callback() — go into ONE SINGLE stack, not two separate queues.',
        'The documentation confirms these are "called in reverse order when the instance is closed" together — "this ends up behaving as if multiple nested with statements had been used with the registered set of callbacks." So a callback registered via stack.callback(fn) between two enter_context() calls runs at exactly the point its registration order dictates, interleaved correctly with the context managers\' own __exit__ calls, not segregated into a separate cleanup phase.',
      ]
    },
    {
      heading: 'A real limitation worth knowing before relying on callback()',
      points: [
        'Unlike a context manager entered via enter_context() (whose __exit__ can inspect exception details and choose to suppress the exception), a plain callback registered via callback() "cannot suppress exceptions (as they are never passed the exception details)" — it runs purely for its side effect, with no ability to influence whether an exception propagates out of the with block.',
        'This makes callback() the right tool specifically for unconditional cleanup actions that never need to react to WHY the block is exiting (closing a socket, releasing a lock, logging "done") — while anything that needs to inspect or suppress an exception still needs a genuine context manager registered via enter_context(), matching the main page\'s own class-based __exit__(exc_type, exc_val, exc_tb) pattern.',
      ]
    }
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'callback() and enter_context() interleave in ONE LIFO order',
      language: 'typescript',
      code: `import contextlib

class Resource:
    def __init__(self, name): self.name = name
    def __enter__(self):
        print(f"open {self.name}"); return self
    def __exit__(self, *exc):
        print(f"close {self.name}"); return False

with contextlib.ExitStack() as stack:
    stack.enter_context(Resource("A"))          # registered 1st
    stack.callback(print, "plain cleanup step")  # registered 2nd
    stack.enter_context(Resource("B"))          # registered 3rd

# Output:
# open A
# open B
# close B            <- unwinds LAST-registered first (LIFO)
# plain cleanup step  <- the callback, in its own registration slot
# close A             <- unwinds FIRST-registered last

# Not two separate phases ("all context managers, then all
# callbacks") — one single interleaved stack, exactly matching
# registration order in reverse.`,
    },
    {
      label: 'callback() cannot suppress an exception — enter_context() can',
      language: 'typescript',
      code: `import contextlib

def cleanup_log():
    print("cleanup ran — but I have no idea if an exception happened")

class SuppressValueError:
    def __enter__(self): return self
    def __exit__(self, exc_type, exc_val, exc_tb):
        if exc_type is ValueError:
            print("suppressing ValueError")
            return True   # exception is swallowed
        return False

with contextlib.ExitStack() as stack:
    stack.callback(cleanup_log)              # runs unconditionally,
                                               # never sees exception info
    stack.enter_context(SuppressValueError())  # CAN suppress
    raise ValueError("boom")

print("execution continues here — the ValueError was suppressed")
# cleanup_log() genuinely ran, but had no ability to decide the
# ValueError's fate — only the real context manager's __exit__ could.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A data-migration script uses an ExitStack to manage a dynamic list of database connections (entered via stack.enter_context()) and also needs to send a single "migration finished" notification exactly once, after every connection has been cleanly closed, regardless of how many connections there ended up being. A developer considers writing this notification logic as its own tiny context manager just to use enter_context() for it, but wonders if there\'s a simpler option. Using what this subtopic covers, suggest the simpler approach and explain why it produces the correct ordering.',
    hint: 'Does the cleanup action described (sending a notification) need to inspect or suppress an exception, or is it purely a "run this after everything else\'s cleanup, in the right position" action? What does this subtopic\'s theory say about ExitStack.callback() and how it\'s ordered relative to context managers entered via enter_context()?',
    solution: 'The simpler approach is stack.callback(send_notification) instead of writing a dedicated context manager class just to use enter_context() — since the notification logic never needs to inspect or suppress an exception (it just needs to run once, in the correct position relative to the other cleanup), it is exactly the kind of unconditional cleanup action ExitStack.callback() is designed for. Registering it works correctly for ordering because, per this subtopic\'s theory, callbacks registered via callback() and context managers entered via enter_context() share ONE SINGLE stack, unwound together in reverse (LIFO) registration order — not two separate phases. So if send_notification is registered via stack.callback() AFTER all the database connections have already been entered via enter_context() (i.e., it is the LAST thing registered), it becomes the FIRST thing that runs when the stack unwinds — which is backwards from what\'s wanted. The correct fix is registering the notification callback FIRST, before any connections are entered: stack.callback(send_notification) at the very start, then entering each connection afterward in the loop — since LIFO order means the notification callback (registered first) unwinds LAST, correctly running only after every database connection\'s own __exit__ has already completed. Writing a dedicated context manager class purely to use enter_context() would work too, but is unnecessary complexity for cleanup that never needs exception details.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'ExitStack can only manage objects that implement the full context manager protocol (__enter__/__exit__) — any cleanup logic that isn\'t already wrapped in a proper context manager needs its own small context manager class before it can be registered with an ExitStack.',
      reality: 'This subtopic\'s theory and first code example both show this is incorrect — ExitStack.callback() registers an arbitrary plain callable directly, with no need to wrap it in a context manager class first, and it unwinds in the exact same LIFO order as anything entered via enter_context().'
    },
    {
      thought: 'Callbacks registered via ExitStack.callback() and context managers entered via enter_context() are tracked and unwound in two separate groups — for example, "all context managers exit first, then all plain callbacks run."',
      reality: 'This subtopic\'s first code example shows the opposite — per Python\'s own documentation, both kinds of registration share ONE single stack and unwind together, interleaved exactly according to their actual registration order in reverse, not segregated by type.'
    },
    {
      thought: 'A callback registered via ExitStack.callback() has the same ability to inspect and suppress an in-flight exception as a real context manager\'s __exit__ method does, since both are part of the same ExitStack\'s cleanup process.',
      reality: 'This subtopic\'s second code example shows the opposite — Python\'s own documentation confirms callback()-registered callables "cannot suppress exceptions (as they are never passed the exception details)," unlike a genuine context manager entered via enter_context(), whose __exit__ receives full exception information and can choose to suppress it.'
    }
  ];
}
