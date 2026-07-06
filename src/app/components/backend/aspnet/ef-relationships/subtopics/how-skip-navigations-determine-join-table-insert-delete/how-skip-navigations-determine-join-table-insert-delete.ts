import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-skip-navigation-mechanics-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
    TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './how-skip-navigations-determine-join-table-insert-delete.html',
  styleUrl: './how-skip-navigations-determine-join-table-insert-delete.scss',
})
export class HowSkipNavigationsDetermineJoinTableInsertDeleteSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page states "load the entity with Include(), then Tags.Add(tag), then SaveChangesAsync() — EF Core handles the join table INSERT automatically" — without explaining HOW EF Core knows exactly what to insert',
      points: [
        'The main EF Relationships page shows the skip-navigation pattern (<code>Include(p =&gt; p.Tags)</code> then <code>product.Tags.Add(tag)</code>) and its own Common Mistake explicitly warns "EF Core needs to know the current state of the skip navigation to insert the correct row into the join table." This is the SAME underlying mechanism the sibling EF Core Basics topic\'s change-tracker subtopic covers for SCALAR properties (<code>OriginalValues</code> vs <code>CurrentValues</code>) — just applied to a COLLECTION instead of a single value.',
      ],
    },
    {
      heading: 'Include() populates the collection navigation\'s "known baseline" — the set of join rows EF Core believes currently exist; calling .Add() or .Remove() modifies the IN-MEMORY collection, and SaveChangesAsync() diffs the baseline against the current collection to compute exactly which join-table rows to INSERT or DELETE',
      points: [
        'When <code>Include(p =&gt; p.Tags)</code> loads a product, EF Core populates <code>product.Tags</code> AND records, internally, that THESE specific <code>Tag</code> entities are the CURRENTLY-ASSOCIATED set for this product — functionally the collection equivalent of an <code>OriginalValues</code> snapshot. Calling <code>product.Tags.Add(newTag)</code> changes the IN-MEMORY collection\'s contents, but does NOT immediately touch the database. At <code>SaveChangesAsync()</code> time, EF Core compares the BASELINE set (from Include) against the CURRENT set (after your <code>.Add()</code>/<code>.Remove()</code> calls): any <code>Tag</code> present in CURRENT but not BASELINE gets an <code>INSERT</code> into the join table; any <code>Tag</code> present in BASELINE but not CURRENT gets a <code>DELETE</code> from the join table.',
        'This is EXACTLY why the main page\'s own mistake warns that skipping <code>Include()</code> before <code>.Add()</code> either throws <code>NullReferenceException</code> (the collection was never populated, so it is <code>null</code>, not just empty) or "creates a duplicate join table entry" — without a baseline to diff against, EF Core has no way to know the ADD represents a NEW association rather than one that (from the database\'s perspective) might already exist.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Tracing exactly what the "baseline" and "current" collections look like for the main page\'s own skip-navigation example',
      language: 'csharp',
      code: `// Product 1 currently has Tags = [Electronics, Sale] in the database
// (i.e., two rows already exist in the "ProductTags" join table).

var product = await db.Products
    .Include(p => p.Tags)            // populates BOTH product.Tags AND
    .FirstAsync(p => p.Id == 1, ct);  // EF Core's internal "baseline" —
                                       // the set of Tags this product
                                       // is CURRENTLY associated with,
                                       // as of this Include() call:
                                       //   BASELINE = { Electronics, Sale }

var newTag = await db.Tags.FindAsync([newTagId], ct);   // e.g. "Clearance"
product.Tags.Add(newTag!);
// The IN-MEMORY collection is now:
//   CURRENT = { Electronics, Sale, Clearance }
// Nothing has touched the database yet — this is purely an in-memory
// List<Tag> mutation.

await db.SaveChangesAsync(ct);
// EF Core computes the DIFF between BASELINE and CURRENT:
//   BASELINE = { Electronics, Sale }
//   CURRENT  = { Electronics, Sale, Clearance }
//   → "Clearance" is in CURRENT but NOT in BASELINE → INSERT into
//     ProductTags (ProductId=1, TagId=ClearanceId)
//   → Electronics and Sale are UNCHANGED — no SQL generated for them
//     at all
//
// Generated SQL (conceptually):
//   INSERT INTO ProductTags (ProductId, TagId) VALUES (1, @clearanceId);`,
    },
    {
      label: 'Why skipping Include() breaks this diff entirely — there is no BASELINE to compare against',
      language: 'csharp',
      code: `// The main page's own broken example:
var product = await db.Products.FindAsync([id], ct);
// FindAsync() does NOT populate navigation properties — 'product.Tags'
// is NULL here (assuming it was never initialized with '= []', or even
// if it WAS initialized to an empty list, EF Core has NO internal
// "baseline" recorded for it at all, since Include() never ran).

product!.Tags.Add(tag);
// Case 1: if 'Tags' is null → NullReferenceException immediately.
//
// Case 2: if 'Tags' was initialized to '= []' (an EMPTY list, not the
// REAL current associations) → EF Core's internal baseline, to the
// extent it tracks one at all here, is effectively "empty" — NOT the
// two real Tags (Electronics, Sale) that ACTUALLY exist in the join
// table for this product. When SaveChangesAsync() runs its diff:
//   BASELINE (what EF Core THINKS exists) = {} (empty)
//   CURRENT (in-memory, after .Add())     = { NewTag }
//   → INSERT NewTag — this part works correctly by coincidence
// BUT the two REAL existing associations (Electronics, Sale) are
// COMPLETELY INVISIBLE to this diff — EF Core has no idea they exist
// at all, since they were never loaded into the baseline. Depending on
// exact EF Core version and configuration, this can range from "the
// existing associations are silently left alone" (relatively benign,
// since EF Core only acts on what it's tracking) to "a subsequent
// operation that RELIES on the in-memory Tags collection being
// authoritative silently believes the product only has ONE tag" —
// exactly the kind of state-corruption class of bug the main page's
// own warning describes as "duplicate join table entry" in slightly
// different scenarios (e.g., re-adding a tag EF Core doesn't realize
// is already associated, because it was never loaded into the
// baseline to diff against).

// THE FIX, restated with the mechanism now explicit: Include() is not
// merely "populating a property for display purposes" — it is
// SPECIFICALLY what establishes the diffable baseline the change
// tracker needs to correctly compute join-table INSERT/DELETE
// statements. Skipping it doesn't just risk a null reference — it
// breaks the fundamental comparison SaveChangesAsync() depends on.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'Given that the baseline/current diff mechanism this subtopic describes is conceptually identical to the OriginalValues/CurrentValues mechanism from the sibling EF Core Basics topic (just applied to a collection instead of a scalar property), predict what SQL gets generated if you call product.Tags.Remove(existingTag) instead of .Add(newTag) — walk through the same BASELINE vs CURRENT diff for a removal.',
    hint: 'Consider the exact same diff logic — a Tag present in BASELINE but ABSENT from CURRENT triggers what kind of SQL statement against the join table?',
    solution: `Following the exact same diff mechanism, walking through a .Remove()
call:

var product = await db.Products
    .Include(p => p.Tags)
    .FirstAsync(p => p.Id == 1, ct);
// BASELINE = { Electronics, Sale }  (established by Include())

product.Tags.Remove(product.Tags.First(t => t.Name == "Sale"));
// CURRENT (in-memory) = { Electronics }
// "Sale" was removed from the in-memory collection.

await db.SaveChangesAsync(ct);
// EF Core computes the SAME diff, in the OTHER direction:
//   BASELINE = { Electronics, Sale }
//   CURRENT  = { Electronics }
//   → "Sale" is in BASELINE but NOT in CURRENT → DELETE from
//     ProductTags WHERE ProductId=1 AND TagId=SaleId
//   → "Electronics" is UNCHANGED — no SQL for it

// Generated SQL (conceptually):
//   DELETE FROM ProductTags WHERE ProductId = 1 AND TagId = @saleId;

This confirms the diff is genuinely SYMMETRIC — exactly like the
scalar-property OriginalValues/CurrentValues comparison from the
sibling EF Core Basics subtopic (where a property present in CURRENT
but different from ORIGINAL triggers an UPDATE for that column), the
COLLECTION-level diff for skip navigations produces:
  - An entity in CURRENT but not BASELINE → INSERT (an ADD)
  - An entity in BASELINE but not CURRENT → DELETE (a REMOVE)
  - An entity in BOTH → no SQL at all (unchanged association)

This is the SAME "compare a stored baseline against the current
in-memory state, and only touch what genuinely differs" principle
applied at TWO different levels of granularity: individual scalar
PROPERTIES within a single entity (the EF Core Basics subtopic), and
entire COLLECTION MEMBERSHIP for a many-to-many relationship (this
subtopic) — reinforcing that EF Core's change-tracking mechanism is
fundamentally ONE unified diffing strategy, not two unrelated features
that happen to share similar names.`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'calling Include(p => p.Tags) is only useful for READING the current tags for display purposes — it has no bearing on how a subsequent .Add() or .Remove() call gets translated to SQL.',
      reality: 'Include() establishes the diffable BASELINE the change tracker needs — without it, SaveChangesAsync() has no reliable "before" state to compare the in-memory collection against, which is exactly why skipping Include() breaks join-table INSERT/DELETE generation, not just risks a null reference.',
    },
    {
      thought: 'the skip-navigation collection diffing mechanism (Include-then-modify-then-SaveChanges) is a completely separate feature from the scalar-property change tracking (OriginalValues/CurrentValues) covered for regular entity updates.',
      reality: 'both are the SAME underlying "compare a stored baseline against the current state, act only on what differs" mechanism — one operates at the granularity of individual scalar properties within an entity, the other at the granularity of collection membership for a many-to-many relationship.',
    },
    {
      thought: 'initializing a collection navigation property to an empty list (= []) is a safe substitute for calling Include() before modifying a skip navigation.',
      reality: 'an empty list initializer only prevents a NullReferenceException — it does NOT give EF Core a genuine baseline reflecting the REAL, currently-associated entities in the database, so a diff computed against that empty baseline can miss or mishandle existing associations that were never loaded.',
    },
  ];
}
