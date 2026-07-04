import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-concurrency-reload-vs-getdatabasevalues-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
    TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './reload-discards-edit-getdatabasevaluesasync-preserves-it.html',
  styleUrl: './reload-discards-edit-getdatabasevaluesasync-preserves-it.scss',
})
export class ReloadDiscardsEditGetdatabasevaluesasyncPreservesItSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page\'s own Q&A says "catch it and decide: reload + retry, or return 409 Conflict" — treating "reload + retry" as one simple option, when it actually hides two VERY different recovery strategies with opposite outcomes for the user\'s in-progress edit',
      points: [
        'The main EF Core Basics page\'s concurrency Q&A explains adding a <code>[Timestamp]</code>/<code>RowVersion</code> property and catching <code>DbUpdateConcurrencyException</code> when a concurrent update is detected — then says the caller should "reload + retry, or return 409 Conflict." The phrase "reload + retry" glosses over a critical implementation choice: EF Core offers (at least) two genuinely different ways to recover from this exception, and they produce OPPOSITE outcomes for what happens to the CURRENT USER\'S in-progress edit.',
      ],
    },
    {
      heading: '<code>entry.Reload()</code> discards the current user\'s changes ENTIRELY, replacing them with the database\'s latest values — while <code>entry.OriginalValues.SetValues(await entry.GetDatabaseValuesAsync())</code> updates ONLY the concurrency baseline, preserving the current user\'s edit for a genuine retry',
      points: [
        '<code>entry.Reload()</code> re-fetches the row from the database and OVERWRITES the entity\'s CURRENT VALUES with what is actually in the database right now — this means the current user\'s in-progress edit (say, a price change they were in the middle of saving) is COMPLETELY LOST, replaced by whatever the OTHER concurrent request already wrote. This is appropriate ONLY when you want to discard the current user\'s attempt and show them the latest state to start over.',
        '<code>entry.OriginalValues.SetValues(await entry.GetDatabaseValuesAsync())</code> does something more surgical: it updates ONLY the <code>OriginalValues</code> snapshot (the concurrency-check baseline) to match what is now actually in the database — WITHOUT touching <code>CurrentValues</code> at all. This means the user\'s in-progress edit is PRESERVED, and calling <code>SaveChangesAsync()</code> again retries the SAME edit, now checked against the NEW row version — succeeding if nobody else has modified it again in the meantime.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Reload() — discards the current user\'s edit entirely, replacing it with the latest database state',
      language: 'csharp',
      code: `public async Task<IActionResult> UpdatePriceWithReloadAsync(
    int id, decimal newPrice, CancellationToken ct)
{
    var product = await db.Products.FindAsync([id], ct)
        ?? throw new KeyNotFoundException();

    product.Price = newPrice;   // user's in-progress edit: e.g. 149.99

    try
    {
        await db.SaveChangesAsync(ct);
        return Ok(product);
    }
    catch (DbUpdateConcurrencyException ex)
    {
        var entry = ex.Entries.Single();

        // Reload() OVERWRITES 'product.Price' with whatever is
        // CURRENTLY in the database — the user's intended 149.99 is
        // GONE, replaced by whatever the OTHER concurrent update
        // already wrote (say, 129.99):
        await entry.ReloadAsync(ct);

        // 'product.Price' is now 129.99 — the current user's edit
        // never gets applied at all. This is appropriate SPECIFICALLY
        // when the UI's intent is "show the user the latest state and
        // let them decide whether to re-apply their change":
        return Conflict(new
        {
            message = "This product was updated by someone else. Here is the latest version.",
            latest = product   // price = 129.99, NOT the user's 149.99
        });
    }
}`,
    },
    {
      label: 'GetDatabaseValuesAsync + SetValues — preserves the user\'s edit and genuinely retries it against the new baseline',
      language: 'csharp',
      code: `public async Task<IActionResult> UpdatePriceWithRetryAsync(
    int id, decimal newPrice, CancellationToken ct)
{
    var product = await db.Products.FindAsync([id], ct)
        ?? throw new KeyNotFoundException();

    product.Price = newPrice;   // user's in-progress edit: e.g. 149.99

    const int maxRetries = 3;
    for (var attempt = 1; attempt <= maxRetries; attempt++)
    {
        try
        {
            await db.SaveChangesAsync(ct);
            return Ok(product);
        }
        catch (DbUpdateConcurrencyException ex) when (attempt < maxRetries)
        {
            var entry = ex.Entries.Single();
            var databaseValues = await entry.GetDatabaseValuesAsync(ct);
            if (databaseValues is null)
                return NotFound();   // row was deleted concurrently

            // THE KEY DIFFERENCE: this updates ONLY the concurrency
            // baseline (RowVersion / OriginalValues) — 'product.Price'
            // remains 149.99, the user's INTENDED value, completely
            // untouched:
            entry.OriginalValues.SetValues(databaseValues);

            // The NEXT loop iteration calls SaveChangesAsync() again —
            // this time, the UPDATE statement's WHERE clause checks
            // against the NEW RowVersion, and since 'product.Price' is
            // STILL 149.99 (never reloaded away), the user's ORIGINAL
            // intended edit is what actually gets retried and, if no
            // one else modifies the row again in the meantime,
            // successfully saved:
        }
    }

    return Conflict("Update failed after multiple concurrent modification attempts.");
}`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'Given the two strategies in this subtopic have opposite effects on the user\'s in-progress edit, propose a concrete UX-level rule for choosing between them: under what circumstances should an application prefer Reload() (discarding the edit) versus GetDatabaseValuesAsync + SetValues (preserving and retrying the edit)?',
    hint: 'Consider the nature of the conflicting field specifically — does it matter whether the field the CURRENT user is editing is the SAME field the OTHER concurrent update already changed, versus a DIFFERENT, unrelated field on the same row?',
    solution: `The right choice genuinely depends on WHICH fields conflicted, and
whether merging the two concurrent edits together even makes semantic
sense:

1. PREFER GetDatabaseValuesAsync + SetValues (preserve-and-retry) when
   the current user's edit touches a DIFFERENT field than whatever the
   concurrent update changed — e.g., the current user is updating
   Price while a concurrent request updated Description. In this case,
   there is no real conflict of INTENT — both edits can coexist, and
   automatically retrying the current user's Price change against the
   new RowVersion (which now reflects the Description change) is a
   seamless, invisible resolution the user never even needs to know
   happened.

2. PREFER Reload() (discard-and-show-latest) when the current user's
   edit touches the SAME field the concurrent update ALSO changed —
   e.g., both the current user AND a concurrent request tried to
   change Price to different values. Here, blindly retrying the
   current user's edit would silently overwrite the OTHER person's
   change with no acknowledgment that a real conflict occurred — the
   correct UX is to show the user the CURRENT value and let THEM
   decide whether to re-apply their intended change, rather than the
   application silently picking a "winner."

A more sophisticated implementation can actually IMPLEMENT this
distinction programmatically: compare which SPECIFIC properties the
concurrent update actually changed (available via a diff between
entry.OriginalValues before SetValues and the freshly-fetched database
values) against which properties the current user's edit touched. If
the sets of changed properties DON'T OVERLAP, safely proceed with the
preserve-and-retry strategy automatically. If they DO overlap (a
genuine conflicting edit to the SAME field), fall back to the
discard-and-show-latest (Reload) strategy and surface a real conflict
to the user. This gives the best of both: automatic, invisible
resolution for non-overlapping concurrent edits, and an honest,
visible conflict prompt only when edits genuinely collide on the same
field.`,
  };

  misconceptions: Misconception[] = [
    {
      thought: '"reload + retry" (as the main page\'s own Q&A phrases it) describes ONE consistent recovery strategy for a DbUpdateConcurrencyException.',
      reality: 'entry.Reload() and entry.OriginalValues.SetValues(await entry.GetDatabaseValuesAsync()) are two genuinely DIFFERENT strategies with OPPOSITE effects on the current user\'s in-progress edit — Reload() discards it entirely, while SetValues preserves it for a real retry.',
    },
    {
      thought: 'entry.Reload() is always the correct way to recover from a concurrency conflict, since it gets the entity back in sync with the database.',
      reality: 'Reload() overwrites the CURRENT VALUES with the database\'s latest state, silently discarding whatever edit the current user was in the middle of making — appropriate only when the UI\'s intent is genuinely "show the user the latest state and let them decide," not for an automatic, invisible retry.',
    },
    {
      thought: 'automatically retrying a SaveChangesAsync() call after a concurrency conflict is always safe as long as the retry eventually succeeds.',
      reality: 'blindly retrying without checking whether the CURRENT user\'s edit and the CONCURRENT edit touched the same field can silently overwrite another user\'s legitimate change with no acknowledgment a real conflict occurred — a more careful implementation compares which specific properties each edit touched before deciding whether an automatic retry is actually safe.',
    },
  ];
}
