import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../components/shared/page-meta/page-meta';
import { QuickRefComponent, QuickRefItem } from '../../../../components/shared/quick-ref/quick-ref';
import { TheoryBlockComponent, TheoryPoint } from '../../../../components/shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../components/shared/code-block/code-block';
import { CommonMistakesComponent, CommonMistake } from '../../../../components/shared/common-mistakes/common-mistakes';
import { ChallengeBlockComponent, Challenge } from '../../../../components/shared/challenge-block/challenge-block';
import { QuizBlockComponent, QuizQuestion } from '../../../../components/shared/quiz-block/quiz-block';
import { QnaBlockComponent, QnaItem } from '../../../../components/shared/qna-block/qna-block';
import { RevisionCardComponent, RevisionSummary } from '../../../../components/shared/revision-card/revision-card';
import { PageCompleteComponent } from '../../../../components/shared/page-complete/page-complete';

@Component({
  selector: 'app-python-sqlalchemy',
  standalone: true,
  imports: [PageMetaComponent, QuickRefComponent, TheoryBlockComponent, CodeBlockComponent,
    CommonMistakesComponent, ChallengeBlockComponent, QuizBlockComponent, QnaBlockComponent,
    RevisionCardComponent, PageCompleteComponent],
  templateUrl: './sqlalchemy.html',
  styleUrl: './sqlalchemy.scss'
})
export class PythonSqlalchemy {
  readingTime = 25; difficulty: 'beginner' | 'intermediate' | 'advanced' = 'intermediate'; since = 'SQLAlchemy 2.0+';
  route = 'py-sqlalchemy'; nextRoute = '/python/celery'; nextLabel = 'Celery & Task Queues';

  quickRef: QuickRefItem[] = [
    { name: 'Mapped[X] (ORM 2.0)', type: 'type', desc: 'Column annotation: column: Mapped[str] = mapped_column(String(100)). Type-safe. Replaces Column() from v1.' },
    { name: 'Session.execute(stmt)', type: 'method', desc: 'Execute a SELECT/INSERT/UPDATE. Returns CursorResult. .scalars().all() for ORM objects.' },
    { name: 'select(Model).where(cond)', type: 'function', desc: 'SQLAlchemy 2.0 select statement. Chains .where(), .join(), .order_by(), .limit(), .options().' },
    { name: 'relationship(Model)', type: 'function', desc: 'Defines ORM relationship. lazy="select" (default), lazy="joined", lazy="subquery", lazy="dynamic".' },
    { name: 'session.add(obj)', type: 'method', desc: 'Stage an insert. session.flush() sends SQL. session.commit() commits. session.rollback() reverts.' },
    { name: 'selectinload(rel)', type: 'function', desc: 'Eager load relationship with SELECT IN — avoids N+1. Alternative: joinedload() for JOIN-based loading.' },
    { name: 'async_sessionmaker', type: 'function', desc: 'Factory for AsyncSession. Use with async with session_factory() as session: ... for async ORM.' },
    { name: 'alembic revision --autogenerate', type: 'keyword', desc: 'Generate migration from model diff. alembic upgrade head applies pending migrations.' },
  ];

  theory: TheoryPoint[] = [
    {
      heading: 'SQLAlchemy 2.0 Architecture',
      points: [
        'SQLAlchemy has two layers: Core (SQL expression language, direct SQL generation) and ORM (Data Mapper pattern, maps Python classes to tables). The ORM builds on Core. In SQLAlchemy 2.0, the old "legacy" session query API (session.query(Model)) is replaced with the new select() + session.execute() pattern, which is identical between Core and ORM.',
        'The Data Mapper pattern keeps models independent from the database session — a SQLAlchemy model is a plain Python class with Mapped[] annotations. The Session tracks changes (Unit of Work) and generates SQL only when needed (flush) or when committed. This is different from Django ORM\'s Active Record where models know how to save themselves.',
        'Engine and Session: create_engine(url, pool_size=10, max_overflow=20) creates the connection pool. Session (or AsyncSession for async) is a unit of work — one transaction per session. Use sessionmaker (or async_sessionmaker) to create sessions. In web apps, create one Session per request.',
        'Alembic is the migration tool for SQLAlchemy. alembic init migrations sets up migration scripts. alembic revision --autogenerate -m "add users table" generates a migration by comparing the models to the current DB schema. alembic upgrade head applies all pending migrations.',
      ]
    },
    {
      heading: 'ORM Queries with select()',
      points: [
        'SQLAlchemy 2.0 uses select() for all queries: stmt = select(User).where(User.age >= 18).order_by(User.name).limit(10). Execute with session.execute(stmt).scalars().all() to get a list of User objects. .scalar_one() for exactly one result (raises if zero or many). .first() for first or None.',
        'Filtering: where() accepts column expressions. User.name.ilike("%ali%") for case-insensitive LIKE. User.age.between(18, 65). and_(User.active == True, User.age >= 18). or_(User.role == "admin", User.is_staff == True). in_() for SQL IN: User.id.in_([1, 2, 3]).',
        'Joins: select(Post).join(User, Post.author_id == User.id).where(User.name == "Alice"). The join condition can be inferred from the relationship: select(Post).join(Post.author) if a relationship is defined. outerjoin() for LEFT JOIN.',
        'Aggregation: from sqlalchemy import func; session.execute(select(func.count()).select_from(User)).scalar() returns the total count. select(func.avg(User.age), func.max(User.age)).group_by(User.role) for grouped aggregation. func supports any SQL function: func.now(), func.coalesce(col, default).',
      ]
    },
    {
      heading: 'Relationships and Eager Loading',
      points: [
        'relationship() defines ORM associations. ForeignKey on the column maps the DB constraint. relationship("Post", back_populates="author") creates the bidirectional link. lazy="select" (default) loads related objects with a separate SELECT on first access — the N+1 risk. Specify lazy="joined" for JOIN or eager loading per-query.',
        'Per-query eager loading: selectinload (SELECT IN), joinedload (JOIN), and subqueryload (subquery). Prefer selectinload for collections (one-to-many): select(Author).options(selectinload(Author.posts)). Use joinedload for single related objects (many-to-one/one-to-one): select(Post).options(joinedload(Post.author)).',
        'Cascade: relationship("Post", cascade="all, delete-orphan") deletes related posts when the parent is deleted. "all" includes save-update, merge, expunge, delete. "delete-orphan" removes child rows that are no longer associated with a parent — use for composition relationships.',
        'backref vs back_populates: backref creates the reverse relationship automatically. back_populates requires explicit definitions on both sides but is more explicit and type-safe. Prefer back_populates in SQLAlchemy 2.0 and Pydantic-typed projects.',
      ]
    },
    {
      heading: 'Async SQLAlchemy',
      points: [
        'Async SQLAlchemy uses sqlalchemy.ext.asyncio: create_async_engine(url), AsyncSession, async_sessionmaker. The API is identical to sync but all I/O methods are coroutines: await session.execute(stmt), await session.commit(), await session.close(). Use await session.execute(select(User)) not session.query(User).',
        'Lazy loading does NOT work in async — accessing a relationship attribute outside an active session raises MissingGreenlet error. Always use explicit eager loading: options(selectinload(User.posts)) in the original query. This is the correct approach even in sync SQLAlchemy for performance.',
        'Async session in FastAPI: create an async_sessionmaker. Use a generator dependency: async def get_db() → AsyncGenerator: async with async_session() as session: yield session. The session is automatically closed when the request ends. Use AsyncSession.begin() to start an explicit transaction if you need finer control.',
        'asyncpg is the recommended async driver for PostgreSQL. aiosqlite for SQLite. aiomysql for MySQL. The connection URL changes: postgresql+asyncpg://user:pass@host/db. The sync driver equivalent (psycopg2, sqlite3) cannot be used with async SQLAlchemy.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'ORM 2.0 models & queries',
      language: 'typescript',
      code: `from sqlalchemy import create_engine, String, Integer, ForeignKey, func
from sqlalchemy.orm import (
    DeclarativeBase, Mapped, mapped_column, relationship,
    Session, sessionmaker, selectinload, joinedload
)
from sqlalchemy import select, and_, or_

class Base(DeclarativeBase): pass

class User(Base):
    __tablename__ = "users"
    id:    Mapped[int]  = mapped_column(primary_key=True)
    name:  Mapped[str]  = mapped_column(String(100), index=True)
    email: Mapped[str]  = mapped_column(String(200), unique=True)
    posts: Mapped[list["Post"]] = relationship(back_populates="author",
                                               cascade="all, delete-orphan")

class Post(Base):
    __tablename__ = "posts"
    id:        Mapped[int]  = mapped_column(primary_key=True)
    title:     Mapped[str]  = mapped_column(String(200))
    views:     Mapped[int]  = mapped_column(default=0)
    author_id: Mapped[int]  = mapped_column(ForeignKey("users.id"))
    author:    Mapped[User] = relationship(back_populates="posts")

engine = create_engine("sqlite:///app.db", echo=True)
Base.metadata.create_all(engine)
SessionLocal = sessionmaker(engine, expire_on_commit=False)

def get_users_with_posts() -> list[User]:
    with SessionLocal() as session:
        stmt = (
            select(User)
            .options(selectinload(User.posts))   # eager load — no N+1
            .where(User.name.ilike("%ali%"))
            .order_by(User.name)
            .limit(10)
        )
        return session.execute(stmt).scalars().all()

def create_user(name: str, email: str) -> User:
    with SessionLocal() as session:
        user = User(name=name, email=email)
        session.add(user)
        session.commit()
        session.refresh(user)    # reload to get DB-generated id
        return user

def post_stats() -> dict:
    with SessionLocal() as session:
        result = session.execute(
            select(func.count(Post.id), func.avg(Post.views))
        ).one()
        return {"count": result[0], "avg_views": round(result[1] or 0, 2)}`
    },
    {
      label: 'Async SQLAlchemy + FastAPI',
      language: 'typescript',
      code: `from sqlalchemy.ext.asyncio import (
    create_async_engine, AsyncSession, async_sessionmaker
)
from sqlalchemy.orm import selectinload
from sqlalchemy import select
from fastapi import Depends
from contextlib import asynccontextmanager
from typing import AsyncGenerator

ASYNC_DB_URL = "postgresql+asyncpg://user:pass@localhost/appdb"

async_engine = create_async_engine(
    ASYNC_DB_URL,
    pool_size=10,
    max_overflow=20,
    pool_pre_ping=True,   # validates connections before use
    echo=False,
)

async_session_factory = async_sessionmaker(
    async_engine,
    expire_on_commit=False,   # objects remain accessible after commit
    class_=AsyncSession,
)

# FastAPI dependency — one session per request
async def get_async_db() -> AsyncGenerator[AsyncSession, None]:
    async with async_session_factory() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise

# Repository function
async def get_user_with_posts(session: AsyncSession, user_id: int) -> User | None:
    stmt = (
        select(User)
        .where(User.id == user_id)
        .options(selectinload(User.posts))   # REQUIRED in async — no lazy loading!
    )
    result = await session.execute(stmt)
    return result.scalar_one_or_none()

# Alembic — alembic.ini points to SYNC_URL for migrations
# alembic init migrations
# alembic revision --autogenerate -m "add posts table"
# alembic upgrade head`
    },
  ];

  mistakes: CommonMistake[] = [
    {
      title: 'Using lazy loading in async SQLAlchemy',
      wrong: `async def get_user(session, user_id):
    user = await session.get(User, user_id)
    print(user.posts)   # MissingGreenlet! Lazy load impossible in async`,
      right: `async def get_user(session, user_id):
    stmt = select(User).where(User.id == user_id).options(selectinload(User.posts))
    result = await session.execute(stmt)
    user = result.scalar_one_or_none()
    print(user.posts)   # already loaded`,
      explanation: 'Lazy loading (accessing a relationship attribute that triggers a query) requires a sync context (greenlet). In async SQLAlchemy, lazy loading raises MissingGreenlet. Always use selectinload(), joinedload(), or subqueryload() in your query to eagerly load relationships before using them.'
    },
    {
      title: 'Not refreshing after commit to get DB-generated values',
      wrong: `user = User(name="Alice")
session.add(user)
session.commit()
print(user.id)   # may be None or stale if expire_on_commit=True (default)`,
      right: `user = User(name="Alice")
session.add(user)
session.commit()
session.refresh(user)   # re-fetches from DB
print(user.id)          # now has the DB-generated id

# Or: use expire_on_commit=False on sessionmaker — but still need to refresh
# if you want immediately-set fields (like server_default timestamps)`,
      explanation: 'After commit(), SQLAlchemy marks all attributes as "expired" (default expire_on_commit=True). Accessing an attribute triggers a lazy reload — which can fail in async. Explicitly call session.refresh(obj) (or await session.refresh(obj) in async) to reload the object from the DB, getting DB-generated values like id, created_at, etc.'
    },
    {
      title: 'Using session.query() in SQLAlchemy 2.0 code',
      wrong: `users = session.query(User).filter(User.age >= 18).all()   # 1.x API`,
      right: `stmt = select(User).where(User.age >= 18)
users = session.execute(stmt).scalars().all()   # 2.0 API`,
      explanation: 'session.query() is the SQLAlchemy 1.x legacy API — it still works in 2.0 but is deprecated. The new 2.0 API uses select() from sqlalchemy + session.execute(stmt). The 2.0 API is more consistent between ORM and Core, supports async natively, and is the future-facing approach. If you see session.query, it is 1.x code.'
    },
    {
      title: 'Opening a session without a context manager',
      wrong: `session = SessionLocal()
users = session.execute(select(User)).scalars().all()
# session never closed if exception raised!`,
      right: `with SessionLocal() as session:
    users = session.execute(select(User)).scalars().all()
# session.close() called automatically`,
      explanation: 'Sessions hold a DB connection. Failing to close them leaks connections, eventually exhausting the connection pool. Using Session as a context manager (with statement) guarantees close() is called even if an exception is raised. In async: async with async_session_factory() as session: ...'
    },
  ];

  challenge: Challenge = {
    title: 'Repository Pattern with SQLAlchemy 2.0',
    language: 'typescript',
    description: 'Implement a UserRepository class using SQLAlchemy 2.0 (not query() API). Methods: get(id) → User | None, get_by_email(email) → User | None, create(name, email) → User, list_active(limit=20) → list[User]. Use Mapped[] column annotations and expire_on_commit=False. Write a test using in-memory SQLite.',
    hints: [
      'Use sessionmaker with expire_on_commit=False',
      'select(User).where(User.email == email)',
      'In-memory SQLite: create_engine("sqlite:///:memory:")',
    ],
    starterCode: `from sqlalchemy import create_engine, String
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, Session, sessionmaker
from sqlalchemy import select

class Base(DeclarativeBase): pass

class User(Base):
    __tablename__ = "users"
    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(100))
    email: Mapped[str] = mapped_column(String(200), unique=True)
    active: Mapped[bool] = mapped_column(default=True)

class UserRepository:
    def __init__(self, session: Session) -> None:
        self.session = session`,
    solution: `from sqlalchemy import create_engine, String
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, Session, sessionmaker
from sqlalchemy import select

class Base(DeclarativeBase): pass

class User(Base):
    __tablename__ = "users"
    id:     Mapped[int]  = mapped_column(primary_key=True)
    name:   Mapped[str]  = mapped_column(String(100))
    email:  Mapped[str]  = mapped_column(String(200), unique=True)
    active: Mapped[bool] = mapped_column(default=True)

class UserRepository:
    def __init__(self, session: Session) -> None:
        self.session = session

    def get(self, id: int) -> User | None:
        return self.session.get(User, id)

    def get_by_email(self, email: str) -> User | None:
        stmt = select(User).where(User.email == email)
        return self.session.execute(stmt).scalar_one_or_none()

    def create(self, name: str, email: str) -> User:
        user = User(name=name, email=email)
        self.session.add(user)
        self.session.commit()
        self.session.refresh(user)
        return user

    def list_active(self, limit: int = 20) -> list[User]:
        stmt = select(User).where(User.active == True).limit(limit)
        return self.session.execute(stmt).scalars().all()

# Test
engine = create_engine("sqlite:///:memory:")
Base.metadata.create_all(engine)
SessionLocal = sessionmaker(engine, expire_on_commit=False)

with SessionLocal() as s:
    repo = UserRepository(s)
    alice = repo.create("Alice", "alice@example.com")
    print(alice.id, alice.name)
    found = repo.get_by_email("alice@example.com")
    print(found.name)`
  };

  quiz: QuizQuestion[] = [
    { q: 'What is the difference between selectinload and joinedload?', options: ['They produce identical SQL', 'selectinload runs a SELECT IN query (2 queries); joinedload runs a JOIN (1 query)', 'joinedload only works for M2M', 'selectinload is only for single objects'], answer: 1, explanation: 'selectinload issues 2 queries: one for the main objects and one SELECT WHERE id IN (...) for related objects. joinedload issues 1 JOIN query but may duplicate rows and use more memory. Use selectinload for collections (one-to-many); joinedload for single objects (many-to-one/one-to-one) where duplication is not an issue.' },
    { q: 'Why does lazy loading fail in async SQLAlchemy?', options: ['Async SQLAlchemy does not support relationships', 'Lazy loading requires a synchronous greenlet context that is not available in async coroutines', 'Async sessions cannot access the database', 'Lazy loading is only for Core, not ORM'], answer: 1, explanation: 'SQLAlchemy\'s lazy loading mechanism uses greenlets internally to synchronise async I/O. When you access a relationship attribute in async code outside an active greenlet context, SQLAlchemy raises MissingGreenlet. The fix is to always eagerly load relationships (selectinload, joinedload) in the original query.' },
    { q: 'What is Alembic and why use it?', options: ['A Python testing library', 'A database migration tool for SQLAlchemy that tracks schema changes', 'A connection pooling library', 'A query caching layer'], answer: 1, explanation: 'Alembic generates and applies migration scripts that evolve your database schema over time. alembic revision --autogenerate compares your current models to the database and generates a migration. alembic upgrade head applies all pending migrations. This ensures your DB schema stays in sync with your Python models across deployments.' },
    { q: 'What does expire_on_commit=False do in sessionmaker?', options: ['Prevents automatic commits', 'Keeps object attributes accessible after commit (does not expire them)', 'Disables the ORM cache', 'Makes sessions reusable across requests'], answer: 1, explanation: 'By default (expire_on_commit=True), all object attributes are marked expired after commit. Accessing them triggers a reload query — which fails in async without an active session. expire_on_commit=False keeps attributes accessible after commit without requiring a session reload. Use alongside session.refresh(obj) for DB-generated values.' },
  ];

  qna: QnaItem[] = [
    { q: 'What is the Unit of Work pattern in SQLAlchemy?', a: 'The Unit of Work (UoW) tracks all changes made to objects during a session. When you call session.add(obj), session.delete(obj), or modify an attribute on a tracked object, SQLAlchemy queues the change. session.flush() sends all queued changes to the DB in the correct order (respecting FK constraints) without committing. session.commit() flushes then commits the transaction. session.rollback() reverts all queued changes. This batching is more efficient than individual INSERT/UPDATE calls.' },
    { q: 'How do you handle database migrations safely in production?', a: 'Never apply migrations while the app is live if they involve: dropping columns, renaming columns, or adding NOT NULL columns without defaults (these lock the table). Safe migration patterns: (1) Expand-contract: add column as nullable → backfill → add NOT NULL constraint → remove old column in a separate deployment. (2) Use alembic --sql to generate SQL for DBA review. (3) Always test on a staging DB first with production-size data. (4) Back up before running. PostgreSQL\'s concurrent index builds and online schema changes (pg_repack) reduce downtime.' },
    { q: 'When should you use SQLAlchemy Core vs ORM?', a: 'Use ORM when: working with domain models (Post, User, Order) where you benefit from relationship loading, Unit of Work tracking, and identity map caching. Use Core (SQLAlchemy expressions without ORM) when: bulk inserts/updates (session.execute(insert(User).values([...]) is much faster than adding individual User objects), data migration scripts, complex reporting queries that span many tables without domain object semantics, or when integrating with an existing database schema where a 1:1 model mapping is awkward.' },
  ];

  revision: RevisionSummary = {
    oneLiner: 'SQLAlchemy 2.0 uses Mapped[] columns, select() + session.execute(), eager loading (selectinload/joinedload) to avoid N+1, and async via AsyncSession with asyncpg.',
    mustKnow: [
      'SQLAlchemy 2.0: use select(Model) + session.execute() — not session.query().',
      'Eager loading: selectinload(rel) for collections; joinedload(rel) for single objects.',
      'Lazy loading raises MissingGreenlet in async — always eager load.',
      'session.commit() expires objects — call session.refresh(obj) for DB values.',
      'expire_on_commit=False on sessionmaker keeps objects accessible post-commit.',
      'Alembic: autogenerate migrations; upgrade head applies them.',
    ],
    interviewFocus: [
      'Why does lazy loading fail in async SQLAlchemy?',
      'What is the Unit of Work pattern?',
      'selectinload vs joinedload: when to use each?',
    ]
  };
}
