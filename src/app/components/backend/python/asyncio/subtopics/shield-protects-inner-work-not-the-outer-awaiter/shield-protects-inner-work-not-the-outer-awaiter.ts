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
  templateUrl: './shield-protects-inner-work-not-the-outer-awaiter.html',
  styleUrl: './shield-protects-inner-work-not-the-outer-awaiter.scss'
})
export class ShieldProtectsInnerWorkNotTheOuterAwaiterSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'shield() keeps the inner task running when the OUTER await is cancelled — but the caller still sees CancelledError',
      points: [
        'The main page\'s own theory covers cancellation only from the "always re-raise CancelledError after cleanup" angle — it never addresses a related, distinct question: what if some critical piece of work genuinely needs to keep running to completion even if the coroutine awaiting it gets cancelled from outside? asyncio.shield() exists specifically for that case, and it isn\'t on the main page at all.',
        'Python\'s own asyncio documentation describes shield()\'s actual mechanism precisely: "if the coroutine containing it is cancelled, the Task running in something() is not cancelled. From the point of view of something(), the cancellation did not happen." The shielded inner awaitable is genuinely insulated from a cancellation that originates from the outer context — it keeps running toward its own natural completion (success or failure) regardless.',
        'The critical, easy-to-miss part is what happens to the CALLER: the same documentation continues, "although its caller is still cancelled, so the \'await\' expression still raises a CancelledError." shield() does NOT make cancellation invisible to the code that called await shield(some_coro()) — that await point still raises CancelledError exactly as it would have without shield() at all. shield() protects the INNER work, not the outer awaiter — those are two genuinely separate things.',
      ]
    },
    {
      heading: 'What this means for writing correct shield()-based code',
      points: [
        'Since the caller still receives CancelledError at the await shield(...) line, any code using shield() to protect critical work (a database write that must complete even if the surrounding request is cancelled, for instance) still needs its own try/except asyncio.CancelledError: ... around that await — exactly the same discipline the main page\'s own "always re-raise CancelledError" mistake entry already establishes for ordinary cancellation, just applied to a shielded call instead of an unshielded one.',
        'A common, incorrect assumption shield() invites: that wrapping something in shield() means "this operation, and the code awaiting it, are now immune to cancellation." In reality, only the INNER operation is immune — the outer coroutine still needs to be written defensively, typically by catching the CancelledError at the shield() call site and deciding separately whether to wait for the shielded task to actually finish (e.g., via a second await on the same task object, now outside the cancelled scope) or to let it continue purely in the background.',
      ]
    }
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'The shielded work survives cancellation — but the caller still sees CancelledError',
      language: 'typescript',
      code: `import asyncio

async def critical_write():
    print("write starting...")
    await asyncio.sleep(2)
    print("write finished!")   # this STILL prints, even though the
                                  # caller below gets cancelled early
    return "written"

async def caller():
    try:
        result = await asyncio.shield(critical_write())
        print(f"got: {result}")
    except asyncio.CancelledError:
        print("caller was cancelled — but the write itself keeps going")
        raise   # still need to re-raise, exactly like unshielded cancellation

async def main():
    task = asyncio.create_task(caller())
    await asyncio.sleep(0.5)
    task.cancel()   # cancel the OUTER caller, not critical_write() directly
    try:
        await task
    except asyncio.CancelledError:
        pass

    # Give critical_write() time to finish in the background —
    # proving shield() genuinely let it survive the outer cancellation.
    await asyncio.sleep(2)

asyncio.run(main())
# Output order:
# write starting...
# caller was cancelled — but the write itself keeps going
# write finished!   <- printed ~1.5s AFTER the cancellation was
#                       already handled, proving the inner work
#                       genuinely survived it`,
    },
    {
      label: 'Waiting for the shielded work to actually finish, deliberately',
      language: 'typescript',
      code: `import asyncio

async def critical_write():
    await asyncio.sleep(2)
    return "written"

async def caller():
    shielded = asyncio.shield(critical_write())
    try:
        result = await shielded
        return result
    except asyncio.CancelledError:
        # The outer await was cancelled — but shielded's own inner
        # task is still running. If we genuinely need the result
        # before this function returns, we can await it AGAIN here,
        # now outside the cancelled scope:
        print("waiting for the shielded write to actually complete...")
        result = await shielded   # this second await is NOT cancelled
        print(f"confirmed written: {result}")
        raise   # still propagate the original cancellation afterward

async def main():
    task = asyncio.create_task(caller())
    await asyncio.sleep(0.5)
    task.cancel()
    try:
        await task
    except asyncio.CancelledError:
        pass

asyncio.run(main())`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A request handler wraps a critical audit-log write in asyncio.shield() specifically so the write survives even if the incoming HTTP request is cancelled by the client disconnecting early: await asyncio.shield(write_audit_log(entry)). A developer assumes this means the handler function itself will simply continue running normally, uninterrupted, whenever a client disconnects mid-request. In testing, the handler function still exits early via an unhandled CancelledError whenever a disconnect is simulated, even though the audit log entry is confirmed to have been written successfully moments later. Evaluate the developer\'s assumption, using what this subtopic covers.',
    hint: 'Per this subtopic\'s theory, does shield() protect BOTH the inner awaitable AND the outer code awaiting it from cancellation, or does it only protect the inner awaitable? What does Python\'s own documentation say specifically happens at the "await shield(...)" line itself when the outer context is cancelled?',
    solution: 'The developer\'s assumption is incorrect, and the observed behavior — the audit log write succeeding while the handler function itself still exits early via CancelledError — is exactly the documented, correct behavior of shield(), not a bug. Per Python\'s own documentation, shield() protects only the INNER awaitable from being cancelled — "if the coroutine containing it is cancelled, the Task running in something() is not cancelled" — but it explicitly does not protect the outer awaiter: "its caller is still cancelled, so the \'await\' expression still raises a CancelledError." So when the client disconnects and the request handler\'s coroutine is cancelled, the await asyncio.shield(write_audit_log(entry)) line genuinely still raises CancelledError at that exact point, which is precisely why the handler function exits early via an unhandled exception — shield() never promised to make the SURROUNDING handler code immune to cancellation, only to keep the audit log write itself running to completion regardless. Since write_audit_log() is confirmed to complete successfully afterward, shield() is doing exactly what it\'s documented to do. If the handler genuinely needs to NOT exit early via an unhandled exception (for example, to log something, or to return a specific response even after the disconnect), it needs its own try/except asyncio.CancelledError: around the shield() call, the same "always handle CancelledError explicitly" discipline the main page\'s own cancellation coverage already establishes — shield() changes what happens to the INNER work, not whether the outer code still needs to handle its own cancellation.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'Wrapping an awaitable in asyncio.shield() makes BOTH that awaitable and the surrounding code that awaits it immune to cancellation — shield() is a blanket protection against cancellation for the entire operation.',
      reality: 'This subtopic\'s theory and first code example both show this is incorrect — Python\'s own documentation confirms shield() protects only the inner awaitable from being cancelled; the outer code\'s own await expression still raises CancelledError exactly as it would without shield() at all.'
    },
    {
      thought: 'If code awaiting a shield()-wrapped operation still receives a CancelledError, that must mean shield() failed to work correctly or was used incorrectly, since the whole point of shield() is supposedly to prevent cancellation.',
      reality: 'This subtopic\'s exercise shows the opposite — receiving CancelledError at the outer await is the correct, documented behavior of shield() even when it works perfectly; shield()\'s actual guarantee is specifically that the INNER work keeps running despite that outer cancellation, not that the outer cancellation itself is suppressed.'
    },
    {
      thought: 'Once an operation is wrapped in shield(), the surrounding coroutine no longer needs any explicit CancelledError handling, since shield() is specifically meant to deal with cancellation on the caller\'s behalf.',
      reality: 'This subtopic\'s second code example shows the opposite — code using shield() to protect critical work typically STILL needs its own try/except asyncio.CancelledError around the shielded await, exactly the same discipline required for ordinary, unshielded cancellation handling, since shield() only changes what happens to the inner task, not whether the outer code receives and must handle the cancellation itself.'
    }
  ];
}
