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
  templateUrl: './delete-orphan-needs-orm-tracked-disassociation.html',
  styleUrl: './delete-orphan-needs-orm-tracked-disassociation.scss'
})
export class DeleteOrphanNeedsOrmTrackedDisassociationSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'delete-orphan fires on disassociation — not on "the child row went away" by any means',
      points: [
        'The main page\'s own theory describes cascade="all, delete-orphan" as removing "child rows that are no longer associated with a parent," using it for composition relationships. What it does not spell out is exactly what counts as "no longer associated" — and the answer is narrower than it sounds. SQLAlchemy\'s own docs are precise: delete-orphan removes a child "when it is de-associated from the parent, not just when the parent is marked for deletion" — meaning the trigger is a genuine disassociation EVENT that the ORM\'s unit-of-work detects through the relationship itself: removing an item from a parent.children collection, or reassigning a many-to-one child.parent = None.',
        'This is a mechanism tied specifically to the relationship() attribute being manipulated through the ORM — it is not a general "if this child ends up without a parent, delete it" rule evaluated some other way. SQLAlchemy has to actually observe the disassociation happening via that tracked collection or attribute to know a delete-orphan cascade should apply.',
        'The direct consequence: deleting a child object some OTHER way — one that never goes through the parent relationship attribute at all — does not invoke delete-orphan logic, even if the practical end state (the child row is gone) looks identical to what delete-orphan would have produced.',
      ]
    },
    {
      heading: 'session.delete(child) and bulk DML both bypass delete-orphan entirely — for different reasons',
      points: [
        'Calling session.delete(child_obj) directly still deletes that row on flush — Session.delete() is a standalone, unconditional per-object delete API that works regardless of any cascade configuration on the parent\'s relationship. But it does not "use" delete-orphan cascade to do it, because no disassociation-from-parent event ever occurred — the child was targeted directly, not removed from a collection or unlinked from its parent first. The row still goes away; the MECHANISM is different, even though a developer relying on cascade rules to explain WHY a delete is safe would be reasoning about the wrong code path here.',
        'A structurally different, more surprising gap exists for bulk operations. SQLAlchemy\'s own cascades documentation states this directly, as an explicit warning: "the ORM\'s \'delete\' and \'delete-orphan\' behavior applies only to the use of the Session.delete() method... It does not apply to \'bulk\' deletes, which would be emitted using the delete() construct." A bulk session.execute(delete(ChildModel).where(...)) statement is Core-level SQL — it bypasses the ORM\'s unit-of-work and relationship-cascade machinery ENTIRELY, since cascade is a Session-level ORM feature, not something the database or Core layer knows anything about.',
        'This matters most for the OPPOSITE direction: cascade="all, delete-orphan" on Parent.children does not protect against, or interact with, a bulk delete of Child rows run independently — a maintenance script doing session.execute(delete(Post).where(Post.views == 0)) deletes those rows with zero cascade evaluation of any kind, since there is no ORM-tracked "parent" object or relationship collection involved in a bulk statement at all.',
      ]
    }
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Collection removal triggers delete-orphan — session.delete() does not need it to',
      language: 'typescript',
      code: `from sqlalchemy.orm import sessionmaker
from .models import Author, Post   # Author.posts has
                                     # cascade="all, delete-orphan"

SessionLocal = sessionmaker(engine)

with SessionLocal() as session:
    author = session.get(Author, 1)
    post_to_remove = author.posts[0]

    # THE delete-orphan TRIGGER: removing from the tracked collection
    author.posts.remove(post_to_remove)
    session.commit()
    # post_to_remove's row is DELETED on flush — SQLAlchemy detected
    # the disassociation via the relationship collection itself and
    # applied delete-orphan cascade, per its own documented behavior.

with SessionLocal() as session:
    author = session.get(Author, 2)
    post_to_remove = author.posts[0]

    # session.delete() works fine too — but for a DIFFERENT reason
    session.delete(post_to_remove)
    session.commit()
    # This row is ALSO deleted — but NOT via delete-orphan cascade.
    # session.delete() is its own unconditional per-object delete API;
    # no disassociation event through author.posts ever happened here,
    # so delete-orphan logic was never invoked at all, even though the
    # observable result (the row is gone) looks the same either way.`,
    },
    {
      label: 'A bulk DELETE bypasses cascade entirely — in both directions',
      language: 'typescript',
      code: `from sqlalchemy import delete
from sqlalchemy.orm import sessionmaker
from .models import Author, Post   # Author.posts still has
                                     # cascade="all, delete-orphan"

SessionLocal = sessionmaker(engine)

with SessionLocal() as session:
    # A maintenance script deletes zero-view posts in bulk.
    session.execute(delete(Post).where(Post.views == 0))
    session.commit()
    # This is Core-level DML — it never loads Post objects into the
    # ORM, never touches any Author.posts collection, and therefore
    # never triggers (or is evaluated against) delete-orphan cascade
    # AT ALL — per SQLAlchemy's own documented warning that bulk
    # deletes bypass ORM cascade/unit-of-work mechanisms entirely.
    # The rows are gone purely because of the raw SQL DELETE — the
    # cascade="all, delete-orphan" configuration on the relationship
    # was never consulted, and had no bearing on whether this worked.

    # A developer who assumes "delete-orphan means Post rows are only
    # ever removed through Author" would be surprised this script's
    # bulk delete worked identically whether cascade was configured
    # or not — cascade is simply not part of this code path.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A codebase relies on Author.posts having cascade="all, delete-orphan" and documents this as "posts are only ever deleted by removing them from an author\'s posts collection — there is no other way a Post row disappears in this system." A new cleanup script is added that runs session.execute(delete(Post).where(Post.created < cutoff_date)) on a schedule to purge old posts. Explain, using what this subtopic covers, whether this script is consistent with that documented invariant, and what risk it introduces.',
    hint: 'Does a bulk delete() statement go through the Author.posts relationship collection at all — does it even load or touch any Author object in the process? Per this subtopic\'s theory, does delete-orphan cascade apply to, get evaluated by, or have any relationship to a Core-level bulk delete?',
    solution: 'The new script directly breaks the documented invariant, and the risk is that the codebase\'s mental model of "posts only disappear via the delete-orphan relationship path" is now false, even though nothing about the cascade configuration itself changed or was misconfigured. Per this subtopic\'s theory, session.execute(delete(Post).where(...)) is a Core-level bulk DML statement — it never loads Post objects into the ORM session, never touches or evaluates any Author.posts collection, and per SQLAlchemy\'s own documented warning, bulk deletes bypass the ORM\'s unit-of-work and cascade mechanisms entirely. The cascade="all, delete-orphan" configuration on Author.posts is simply never consulted by this code path — it has no way to know or care that this bulk delete is happening, and no way to intervene even if it wanted to (e.g. there is no cascade-driven cleanup of OTHER things that might have referenced those posts, the way there would be if they were removed via the ORM-tracked relationship). The practical risk: any other part of the system that assumed "a Post can only vanish via delete-orphan, so anything that depends on that path having run (like a related cleanup, an audit log entry generated by an ORM event listener tied to the cascade, or in-memory identity-map consistency within a long-running session) is now potentially wrong, since this new script produces the same end result (the row is gone) through a completely different mechanism that skips all of that. The documentation claim needs to be corrected to reflect that bulk deletes are a second, cascade-bypassing path by which Post rows disappear — not a violation of the ORM behavior, but a genuinely different code path with different side effects that the original invariant did not account for.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'cascade="all, delete-orphan" on a relationship means SQLAlchemy will automatically delete a child row whenever that row becomes disconnected from its parent, by whatever means the disconnection happens.',
      reality: 'This subtopic\'s theory and first code example show the trigger is specifically an ORM-tracked disassociation EVENT — removing an item from the relationship collection, or reassigning the many-to-one reference to None — detected through the relationship attribute itself. A child deleted some other way (like session.delete(child) directly) still gets deleted, but through an entirely different mechanism that never invokes delete-orphan cascade logic at all.'
    },
    {
      thought: 'Calling session.delete(child_obj) directly on a child that has cascade="all, delete-orphan" configured on its parent relationship is functionally equivalent to removing it from the parent\'s collection — both "use" the delete-orphan cascade to accomplish the deletion.',
      reality: 'This subtopic\'s theory and first code example show session.delete() is its own standalone, unconditional per-object delete API that works regardless of cascade configuration — it deletes the targeted row because it was told to directly, not because delete-orphan cascade fired, since no disassociation-from-parent event occurred when the child was targeted directly rather than removed from the tracked collection.'
    },
    {
      thought: 'Since cascade="all, delete-orphan" is configured on a relationship, any code that deletes rows from that child table — including maintenance scripts, bulk cleanup jobs, or raw SQL — will interact with or be constrained by that cascade configuration in some way.',
      reality: 'This subtopic\'s theory and second code example show Core-level bulk delete() statements bypass the ORM\'s unit-of-work and cascade mechanisms entirely, per SQLAlchemy\'s own explicit documented warning — a bulk delete never loads objects into the ORM or touches the relationship collection, so it has no interaction with delete-orphan cascade at all, in either direction, regardless of how the relationship is configured.'
    }
  ];
}
