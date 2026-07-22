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
  templateUrl: './taskgroup-raises-exceptiongroup.html',
  styleUrl: './taskgroup-raises-exceptiongroup.scss'
})
export class TaskgroupRaisesExceptiongroupSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'A failing TaskGroup does not raise your exception — it raises a group containing it',
      points: [
        'The main page\'s quiz already states that TaskGroup "cancels all other tasks and raises an ExceptionGroup" — but it does not spell out what that object actually is or how catching it differs from catching a normal exception. Python\'s own asyncio-task documentation states it directly: once all tasks finish, "if any tasks have failed with an exception other than asyncio.CancelledError, those exceptions are combined in an ExceptionGroup or BaseExceptionGroup (as appropriate; see their documentation) which is then raised."',
        'This means a plain try/except Exception as e around the async with asyncio.TaskGroup() block does not hand you the exception a task raised — it hands you the ExceptionGroup wrapper object itself, whose .exceptions attribute is a tuple containing the originals. Code written assuming e is the ValueError (or whatever) a task raised is working with the wrong object entirely.',
        'PEP 654\'s except* syntax (Python 3.11+, the same release that introduced TaskGroup) is the tool built specifically for this: except* ValueError as eg: matches only the ValueError instances inside the group, binding eg to a new ExceptionGroup containing just those matches — letting you handle each exception type separately even though several tasks failed with different exception types at once.',
      ]
    },
    {
      heading: 'ExceptionGroup vs. BaseExceptionGroup is decided automatically, and one case bypasses both',
      points: [
        'Python\'s own exceptions documentation explains why there are two classes at all: "BaseExceptionGroup extends BaseException... while ExceptionGroup extends Exception and it can only wrap subclasses of Exception. This design is so that except Exception catches an ExceptionGroup but not a BaseExceptionGroup." A plain except Exception genuinely does catch an all-Exception group as a single unit — it just cannot see inside it without checking .exceptions or using except*.',
        'Which class you get is decided by content, not by anything you write: per the docs, the constructor "returns an ExceptionGroup rather than a BaseExceptionGroup if all contained exceptions are Exception instances." If even one task in the group raised something that is a BaseException but not an Exception (like a raw KeyboardInterrupt, in the rare case that gets wrapped), the whole group becomes a BaseExceptionGroup — which a plain except Exception cannot catch at all, by the same design reasoning quoted above.',
        'One case skips the wrapping mechanism entirely: Python\'s own docs note that if a KeyboardInterrupt or SystemExit is the cause, TaskGroup still cancels the remaining tasks the same way, but "the initial KeyboardInterrupt or SystemExit is re-raised instead of ExceptionGroup or BaseExceptionGroup" — no group object appears in that specific case, just the original signal exception.',
      ]
    }
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'A plain except catches the group, not the original exception',
      language: 'typescript',
      code: `import asyncio

async def validate_payment(order_id: str):
    await asyncio.sleep(0.05)
    raise ValueError(f"invalid card for order {order_id}")

async def reserve_inventory(order_id: str):
    await asyncio.sleep(0.1)
    raise RuntimeError(f"out of stock for order {order_id}")

async def checkout(order_id: str):
    async with asyncio.TaskGroup() as tg:
        tg.create_task(validate_payment(order_id))
        tg.create_task(reserve_inventory(order_id))

async def main():
    try:
        await checkout("ORD-1")
    except Exception as e:
        # e is an ExceptionGroup, NOT a ValueError or RuntimeError —
        # both tasks failed, so both are inside e.exceptions
        print(type(e).__name__)              # "ExceptionGroup"
        print(len(e.exceptions))              # 2
        for sub in e.exceptions:
            print(f"  - {type(sub).__name__}: {sub}")
        # A naive "except ValueError" here would never fire at all —
        # the raised object is an ExceptionGroup, not a ValueError,
        # even though a ValueError is one of the two things inside it.

asyncio.run(main())`,
    },
    {
      label: 'except* separates the group by exception type',
      language: 'typescript',
      code: `import asyncio

async def validate_payment(order_id: str):
    await asyncio.sleep(0.05)
    raise ValueError(f"invalid card for order {order_id}")

async def reserve_inventory(order_id: str):
    await asyncio.sleep(0.1)
    raise RuntimeError(f"out of stock for order {order_id}")

async def checkout(order_id: str):
    async with asyncio.TaskGroup() as tg:
        tg.create_task(validate_payment(order_id))
        tg.create_task(reserve_inventory(order_id))

async def main():
    try:
        await checkout("ORD-1")
    except* ValueError as eg:
        # eg is a NEW ExceptionGroup containing only the ValueError(s)
        for e in eg.exceptions:
            print(f"payment problem: {e}")
    except* RuntimeError as eg:
        # a SEPARATE except* clause runs for the RuntimeError(s) —
        # both clauses can fire for the SAME original TaskGroup failure,
        # since the two exceptions came from two different tasks
        for e in eg.exceptions:
            print(f"inventory problem: {e}")

asyncio.run(main())
# Output includes BOTH lines — one per except* clause — because the
# single ExceptionGroup raised by TaskGroup contained one of each type.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A function runs three tasks inside asyncio.TaskGroup(). Two of them raise different exception types (a ValueError and a ConnectionError). The surrounding code has try: ... except ValueError as e: log(f"bad input: {e}"). The developer is confused that this except clause never runs, even though one of the two failures really was a ValueError. Explain exactly why, using what this subtopic covers.',
    hint: 'What type of object does asyncio.TaskGroup() actually raise when tasks fail — a single exception matching one of the failures, or something else entirely? Would a plain except ValueError match that object\'s type?',
    solution: 'The except ValueError clause never runs because TaskGroup does not raise the ValueError itself — per Python\'s own documentation, once all tasks finish, any exceptions "other than asyncio.CancelledError... are combined in an ExceptionGroup or BaseExceptionGroup... which is then raised." Since both failures here are plain Exception subclasses (ValueError and ConnectionError), the object that actually gets raised is an ExceptionGroup — and ExceptionGroup is not a ValueError, so a plain except ValueError never matches it, even though a ValueError is genuinely one of the two things bundled inside the group\'s own .exceptions tuple. A plain except Exception as e would catch it (since ExceptionGroup extends Exception), but e would still be the wrapper, not the ValueError — e.exceptions[0] or e.exceptions[1] would need to be inspected manually to reach the original ValueError. The correct fix is except* ValueError as eg: log(f"bad input: {eg.exceptions}") — PEP 654\'s except* syntax is specifically built to match a group by the type of the exceptions inside it, letting this clause fire correctly even though the raised object at the top level is an ExceptionGroup, not a bare ValueError.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'When a task inside asyncio.TaskGroup() raises a ValueError, a surrounding except ValueError as e: clause catches it the same way it would catch a ValueError raised directly, with e being that ValueError.',
      reality: 'This subtopic\'s theory and first code example show TaskGroup wraps every task failure in an ExceptionGroup (or BaseExceptionGroup) before raising it — a plain except ValueError never matches the raised object\'s actual type, since ExceptionGroup is a different class from ValueError, even when a ValueError is one of the things bundled inside it.'
    },
    {
      thought: 'except Exception as e: around a TaskGroup block is a safe, complete way to handle any task failure, since it will catch whatever specific exception type a task happened to raise.',
      reality: 'This subtopic\'s theory shows except Exception does catch an all-Exception-subclass group as a single object (by design, per Python\'s own docs) — but e is bound to the ExceptionGroup wrapper, not the original exception, and if even one task raised a bare BaseException (not an Exception), the group becomes a BaseExceptionGroup that except Exception cannot catch at all.'
    },
    {
      thought: 'except* is just alternate, slightly newer syntax for except — a stylistic choice with no real behavioral difference, since both are just catching exceptions from a try block.',
      reality: 'This subtopic\'s second code example shows except* does something a plain except cannot: multiple except* clauses can each independently match and fire against different exception types found INSIDE the same single ExceptionGroup, letting one TaskGroup failure with two different task exception types be split and handled by two separate clauses in one pass.'
    }
  ];
}
