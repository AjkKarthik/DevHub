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
  templateUrl: './autobegin-starts-a-new-transaction-after-commit.html',
  styleUrl: './autobegin-starts-a-new-transaction-after-commit.scss'
})
export class AutobeginStartsANewTransactionAfterCommitSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'A Session never sits without a pending transaction for long — it "autobegins" the next one',
      points: [
        'The main page\'s own theory describes the Session as "a unit of work — one transaction per session," which is a fair simplification but leaves out what happens the moment that ONE transaction ends. SQLAlchemy\'s own docs describe "autobegin": "The transactional state is begun automatically, when a method such as Session.add() or Session.execute() is invoked, ... or if an attribute is modified on a persistent object." No explicit session.begin() call is required, or even normal — the Session begins its next transaction lazily, the instant it is asked to do anything that needs the database again.',
        'This applies identically to an implicit reload as it does to a brand-new query — accessing an expired attribute (the direct consequence of the default expire_on_commit=True covered on the main page) triggers the same autobegin mechanism as calling session.execute(select(...)) fresh. There is no special case in the docs distinguishing "a new query starts a transaction" from "reloading an expired attribute starts a transaction" — both are just "the Session needed to talk to the database, so it began one."',
        'Despite how it sounds, autobegin is not a brand-new SQLAlchemy 2.0 feature — SQLAlchemy\'s own docs mark it "Changed in version 1.4: The Session object now features deferred \'begin\' behavior." What 2.0 actually added is a way to turn it OFF: a documented Session.autobegin flag that, when disabled, requires an explicit begin() call instead, for code that wants to catch accidental implicit transaction starts.',
      ]
    },
    {
      heading: 'close() resets the Session — it does not eagerly start the next transaction either',
      points: [
        'A natural question is whether session.close() behaves differently from commit()/rollback() with respect to autobegin — SQLAlchemy\'s own docs confirm it does not eagerly begin anything either: the Session "no longer immediately begins a new transaction after the Session.close() method is called." close() fully releases the connection and resets the Session back to its initial, pre-transactional state.',
        'This means all three of commit(), rollback(), and close() leave a Session in the identical, ready-to-autobegin-lazily state — none of them pre-emptively opens a new transaction on your behalf. The next transaction only actually begins at the moment the Session is asked to do real database work again, whichever of the three methods most recently ran.',
        'The practical consequence worth internalizing: "the session commits" does not mean "the session is now transaction-free until you explicitly say otherwise." The very next line of code that touches a tracked object\'s attribute, adds a new object, or executes a query silently opens a brand-new transaction — one that itself needs an eventual commit() or rollback(), or it will sit open until the session is closed.',
      ]
    }
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'The very next attribute access after commit() silently opens a new transaction',
      language: 'typescript',
      code: `from sqlalchemy.orm import sessionmaker
from .models import User

SessionLocal = sessionmaker(engine)   # expire_on_commit=True (default)

with SessionLocal() as session:
    user = session.get(User, 1)
    user.name = "Alice"
    session.commit()
    # Transaction #1 is now over. The session did NOT close its
    # connection or go "idle with no transaction" in a meaningful
    # sense — it is simply between transactions.

    print(session.in_transaction())   # False — nothing pending yet

    print(user.name)
    # Accessing .name triggers a reload, since commit() expired every
    # attribute (expire_on_commit=True). That reload is real database
    # work — and per autobegin, it SILENTLY starts transaction #2.

    print(session.in_transaction())   # True — a new transaction is
                                        # now open, purely as a side
                                        # effect of reading an attribute,
                                        # with no explicit begin() call
                                        # anywhere in this code.

    session.commit()   # transaction #2 must ALSO be explicitly ended
                         # — it will not close itself just because the
                         # attribute access that started it "looks read-only."`,
    },
    {
      label: 'close() does not eagerly begin either — but the next use still autobegins',
      language: 'typescript',
      code: `from sqlalchemy.orm import sessionmaker
from .models import User

SessionLocal = sessionmaker(engine)

session = SessionLocal()
user = session.get(User, 1)   # autobegins transaction #1 implicitly
session.close()
# close() fully resets the session — it does NOT pre-emptively open
# a fresh transaction on your behalf, the same as commit()/rollback().

print(session.in_transaction())   # False

user2 = session.get(User, 2)
# Using the CLOSED-then-reused session again autobegins a brand-new
# transaction here, lazily, exactly the same mechanism as before —
# close() didn't change WHETHER autobegin happens, only confirmed
# that nothing is pending immediately after it runs.

print(session.in_transaction())   # True — transaction #2, started
                                    # purely by this get() call.

session.close()   # always end explicitly — relying on garbage
                    # collection to eventually close a lingering
                    # open transaction is not a substitute for this.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A background job holds a single long-lived Session open across an hour of periodic work. It calls session.commit() after each batch of changes, then sleeps, then does more work. A teammate argues this is safe because "each commit() ends the transaction, so between batches the session has nothing open." Explain, using what this subtopic covers, why this reasoning is incomplete, and what the actual risk is during the sleep intervals.',
    hint: 'Does anything the job does immediately after a commit() — checking a cached object\'s attribute, re-querying something, adding a new record before sleeping — count as "needing the database" in a way that would trigger autobegin? If so, what state is the session actually in during the sleep, versus what the teammate assumes?',
    solution: 'The teammate\'s reasoning is incomplete because commit() only guarantees the session has NO transaction open at the exact instant commit() returns — it says nothing about what happens immediately afterward. Per this subtopic\'s theory, autobegin means the very next operation that needs the database (which, in a realistic batch-processing loop, is almost always something: checking a result, reading an attribute on an object still referenced from the batch, adding a new record for the next iteration, or even calling session.query()/execute() to fetch the next batch) silently opens a brand-new transaction — one that then sits open for the ENTIRE sleep interval before the next commit() (or before the job code happens to touch the database again) closes it. If the job does anything database-related after a commit() but before sleeping — which is a very easy thing to do accidentally, e.g. logging user.id where user is a tracked object whose id attribute happens to still be cached and unexpired, or logging something that WAS expired and triggers a reload — that operation autobegins a transaction that then holds a database connection checked out from the pool, and potentially holds locks, for the full sleep duration, defeating the "commit ends the transaction so nothing is held open" assumption entirely. The safer pattern is to explicitly call session.commit() (or session.close() if the session will be discarded) as the LAST thing before any sleep/idle period, with no database-touching code in between, or to close the session entirely between batches and create a fresh one for the next batch — relying on "I called commit() a while ago" is not the same guarantee as "nothing has autobegun since."'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'After session.commit() runs, the Session has no transaction and will not have one again until the code explicitly starts a new one, e.g. with session.begin().',
      reality: 'This subtopic\'s theory and first code example show the opposite is the default, documented behavior — SQLAlchemy\'s "autobegin" feature means the very next operation needing the database (a new query, adding an object, even reading an expired attribute) silently opens a new transaction with no explicit begin() call required, and this has been the default since SQLAlchemy 1.4, not something 2.0 introduced.'
    },
    {
      thought: 'Autobegin is a new SQLAlchemy 2.0 feature that changed how transactions work compared to 1.x code.',
      reality: 'This subtopic\'s theory shows autobegin was introduced in SQLAlchemy 1.4, per SQLAlchemy\'s own documented version history ("Changed in version 1.4: The Session object now features deferred \'begin\' behavior") — what 2.0 actually added was the OPPOSITE capability: a Session.autobegin flag to disable the behavior and require explicit begin() calls, for code that wants to catch accidental implicit transaction starts.'
    },
    {
      thought: 'session.close() is a stronger, more final operation than commit()/rollback(), so a session that has just been closed is guaranteed to stay transaction-free even if it is reused afterward.',
      reality: 'This subtopic\'s theory and second code example show close() resets the session to the SAME "ready to autobegin lazily" state as commit()/rollback() — it does not disable or bypass autobegin. If a closed session is reused for further operations, the very next one that needs the database autobegins a new transaction exactly as it would after a commit(), since close() only guarantees nothing is pending immediately after it runs, not that nothing will ever autobegin again.'
    }
  ];
}
