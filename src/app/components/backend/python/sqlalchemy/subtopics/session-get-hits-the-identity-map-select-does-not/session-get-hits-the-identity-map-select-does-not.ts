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
  templateUrl: './session-get-hits-the-identity-map-select-does-not.html',
  styleUrl: './session-get-hits-the-identity-map-select-does-not.scss'
})
export class SessionGetHitsTheIdentityMapSelectDoesNotSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'session.get() checks memory first — select() never does',
      points: [
        'The main page\'s own theory covers select(User).where(User.id == pk) as the standard 2.0 query pattern, but never mentions Session.get(Model, pk) — a genuinely different method with a genuinely different mechanic. SQLAlchemy\'s own docs describe it directly: "Session.get() is special in that it provides direct access to the identity map of the Session. If the given primary key identifier is present in the local identity map, the object is returned directly from this collection and no SQL is emitted... If not present, a SELECT is performed."',
        'The identity map is the Session\'s in-memory table of every object it has already loaded, keyed by primary key. session.get(User, 1) checks that table first — if User with id=1 was already loaded earlier in this same session (by any means: a prior get(), a prior select(), a prior session.add()), get() hands back that exact same Python object with zero database round-trip.',
        'session.execute(select(User).where(User.id == 1)) has no equivalent short-circuit. It always sends a SELECT statement to the database, even if User id=1 is already sitting in the identity map from an earlier operation in the same session — the row that comes back is reconciled with the identity map afterward (so you get the same object identity as before), but the network round-trip and database work still happen every time.',
      ]
    },
    {
      heading: 'The "unless expired" caveat — and the one option that bypasses the shortcut deliberately',
      points: [
        'SQLAlchemy\'s own docs qualify the identity-map shortcut precisely: get() returns the cached object directly "unless the object has been marked fully expired." An object becomes expired after commit() when expire_on_commit=True (SQLAlchemy\'s default) — so immediately after a commit, even a subsequent get() call for that same object DOES emit a fresh SELECT, since the cached copy is now considered stale rather than trustworthy.',
        'One documented, deliberate escape hatch exists: session.get(Model, pk, populate_existing=True) forces a fresh database round-trip and refresh even when an unexpired copy already sits in the identity map — useful when code specifically needs to guarantee it is reading the current database state rather than trusting whatever happens to already be cached in memory.',
        'The practical takeaway is a genuine choice, not just a style preference: reaching for get() over a select()-by-primary-key pattern is a real optimization specifically because it can eliminate a database round-trip entirely for an object already in scope — but only when the caller is comfortable that a slightly stale (yet unexpired) cached copy is an acceptable answer.',
      ]
    }
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'get() reuses the cached object — select() always re-queries',
      language: 'typescript',
      code: `from sqlalchemy import create_engine, select, event
from sqlalchemy.orm import sessionmaker
from .models import User, Base

engine = create_engine("sqlite:///app.db", echo=False)
SessionLocal = sessionmaker(engine)

query_count = 0
@event.listens_for(engine, "before_cursor_execute")
def count_queries(*args):
    global query_count
    query_count += 1

with SessionLocal() as session:
    query_count = 0

    user_a = session.get(User, 1)          # not in identity map yet:
                                             # emits 1 SELECT, caches it
    user_b = session.get(User, 1)          # SAME primary key, SAME
                                             # session — found in the
                                             # identity map, ZERO SQL

    print(query_count)                      # 1 — only the first get()
                                             # actually hit the database
    print(user_a is user_b)                 # True — literally the
                                             # same Python object

    query_count = 0
    user_c = session.execute(
        select(User).where(User.id == 1)
    ).scalar_one()                          # select() ALWAYS queries —
                                             # even though id=1 is
                                             # already cached from above

    print(query_count)                      # 1 — a real SELECT ran,
                                             # despite the identity map
                                             # already having this row
    print(user_c is user_a)                 # True — same object identity
                                             # once reconciled, but the
                                             # database round-trip still
                                             # happened to get there`,
    },
    {
      label: 'The expired-after-commit caveat, and populate_existing forcing a refresh',
      language: 'typescript',
      code: `from sqlalchemy.orm import sessionmaker
from .models import User

SessionLocal = sessionmaker(engine, expire_on_commit=True)   # default

with SessionLocal() as session:
    user = session.get(User, 1)         # 1 SELECT, cached, unexpired

    user.name = "Alice Updated"
    session.commit()                     # commit marks ALL of user's
                                           # attributes as expired —
                                           # the cached copy is now
                                           # considered stale

    user_again = session.get(User, 1)    # even though id=1 is STILL
                                           # in the identity map, it is
                                           # EXPIRED — get() emits a
                                           # fresh SELECT to refresh it
                                           # before returning

    # Forcing a refresh deliberately, even on an UNEXPIRED object:
    fresh = session.get(User, 1, populate_existing=True)
    # This bypasses the "already cached and unexpired, skip the query"
    # shortcut on purpose — always re-fetches current DB state.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A service function loads a User with session.execute(select(User).where(User.id == user_id)).scalar_one() at the top, does some unrelated work, and then calls session.get(User, user_id) again later in the same function, within the same session, expecting the second call to be "free" since the object should already be cached. A teammate reviewing the code says the second call genuinely is free — no SQL — but the FIRST call was not, even though it filtered by the exact primary key. Explain why, using what this subtopic covers.',
    hint: 'Does session.execute(select(...)) ever check the identity map BEFORE deciding whether to query, the way session.get() does? Once the first query\'s row comes back, does the object end up in the identity map anyway — just via a different path than get() uses?',
    solution: 'The teammate is right on both counts, and the reason is that select() and get() take structurally different paths to the SAME underlying identity map. The FIRST call, session.execute(select(User).where(User.id == user_id)), is a select()-based query — per this subtopic\'s theory, select()-based queries have no identity-map short-circuit at all; they always emit a SELECT to the database, regardless of whether that primary key already happens to be cached. Since this was genuinely the first time User id=user_id was touched in this session, there was nothing to short-circuit anyway — but critically, even if it HAD already been cached from earlier, this call still would have emitted the SQL, because select() never checks first. Once that first query\'s row comes back, though, the resulting User object IS placed into the session\'s identity map as part of normal ORM loading — reconciling any freshly-loaded row with the identity map is standard behavior, not something unique to get(). So by the time the SECOND call happens, session.get(User, user_id), the identity map already has an unexpired entry for that primary key (no commit happened in between to expire it) — and get() DOES check the identity map first, per its own documented behavior, finding the cached object and returning it with zero SQL. The asymmetry is specifically that get() checks-then-queries, while select() always queries (and populates the map as a side effect afterward, not as a prerequisite check beforehand).'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'session.get(Model, pk) and session.execute(select(Model).where(Model.id == pk)).scalar_one() are just two different syntaxes for the exact same underlying operation, with identical performance characteristics.',
      reality: 'This subtopic\'s theory and first code example show a real, documented behavioral difference — session.get() checks the session\'s identity map first and can skip the database entirely if the object is already cached and unexpired, while a select()-based query always sends SQL to the database regardless of identity map state, purely because of how each API is documented and implemented.'
    },
    {
      thought: 'Once an object is loaded into a session\'s identity map, it stays eligible for session.get()\'s no-SQL shortcut for the entire lifetime of that session, no matter what else happens to the session in between.',
      reality: 'This subtopic\'s theory and second code example show the shortcut has a real, documented caveat — SQLAlchemy\'s own docs state get() skips the query "unless the object has been marked fully expired," and a commit() (with the default expire_on_commit=True) expires every attribute on every tracked object, meaning even a still-cached, still-identity-mapped object forces a fresh SELECT on the next get() call after a commit.'
    },
    {
      thought: 'If code specifically needs to guarantee it reads the CURRENT database state rather than a possibly-stale cached copy, it must switch from session.get() to a select()-based query, since get() always risks returning stale cached data.',
      reality: 'This subtopic\'s theory and second code example show SQLAlchemy provides a documented option specifically for this within get() itself — session.get(Model, pk, populate_existing=True) forces a fresh database round-trip and refresh even for an already-cached, unexpired object, without requiring a switch to the select() API at all.'
    }
  ];
}
