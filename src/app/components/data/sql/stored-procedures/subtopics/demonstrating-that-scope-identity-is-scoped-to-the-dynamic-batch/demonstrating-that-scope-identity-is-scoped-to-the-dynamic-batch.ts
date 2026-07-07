import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-demonstrating-scope-identity-batch-scoped-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
    TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './demonstrating-that-scope-identity-is-scoped-to-the-dynamic-batch.html',
  styleUrl: './demonstrating-that-scope-identity-is-scoped-to-the-dynamic-batch.scss',
})
export class DemonstratingThatScopeIdentityIsScopedToTheDynamicBatchSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'A Precise Claim, Never Actually Shown',
      points: [
        'The main page\'s own Q&A states: "inside sp_executesql the dynamic batch runs in its own scope. SCOPE_IDENTITY() after a dynamic INSERT inside sp_executesql is scoped to the dynamic batch — you must either capture the identity inside the dynamic string and return it via an OUTPUT parameter, or use OUTPUT INTO with a temp table." This claim is stated purely as prose — nowhere on the page is it demonstrated with actual code showing what happens if you ignore the warning.',
        'The claim is directly testable: call sp_executesql with a dynamic INSERT into a table with an IDENTITY column, then immediately check SCOPE_IDENTITY() in the OUTER batch, right after the sp_executesql call returns. If the claim is correct, this should NOT return the identity value the dynamic INSERT just generated.',
      ],
    },
    {
      heading: 'Both Fixes the Page Mentions, Made Concrete',
      points: [
        'Fix 1 — capture the identity INSIDE the dynamic SQL string, using sp_executesql\'s own OUTPUT parameter mechanism to pass it back to the outer scope: the dynamic string itself calls SCOPE_IDENTITY() (correctly, since it\'s running IN the same scope as the dynamic INSERT) and assigns it to an output parameter bound in the sp_executesql call.',
        'Fix 2 — use OUTPUT INTO directly on the dynamic INSERT statement, capturing the new identity value into a table variable or temp table as part of the INSERT itself, bypassing SCOPE_IDENTITY() entirely.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Reproducing the scoping gap',
      language: 'sql',
      code: `CREATE TABLE DynTest (ID INT IDENTITY(1,1), Val VARCHAR(50));

DECLARE @sql NVARCHAR(200) = N'INSERT INTO DynTest (Val) VALUES (''hello'')';
EXEC sp_executesql @sql;

-- Check SCOPE_IDENTITY() in the OUTER scope, right after the call returns:
SELECT SCOPE_IDENTITY() AS OuterScopeIdentity;
-- Returns NULL -- even though the dynamic INSERT above genuinely
-- created a new row with a new IDENTITY value. SCOPE_IDENTITY() only
-- sees inserts made in the SAME scope it's called from, and the
-- dynamic batch executed by sp_executesql is its own separate scope.

-- @@IDENTITY (session-wide, not scope-limited) DOES see it, but is
-- unsafe in general -- it also picks up identities from ANY trigger
-- that fired, which can silently return the wrong table's ID:
SELECT @@IDENTITY AS SessionWideIdentity;
-- Returns the correct value here (no triggers involved), but this is
-- exactly the kind of "usually right, occasionally silently wrong"
-- behavior the main page's own Q&A on SCOPE_IDENTITY() already warns
-- against using @@IDENTITY for.`,
    },
    {
      label: 'Fix 1 — capture the identity inside the dynamic string via OUTPUT',
      language: 'sql',
      code: `DECLARE @sql       NVARCHAR(300);
DECLARE @paramDefs NVARCHAR(200);
DECLARE @newId      INT;

-- The dynamic string calls SCOPE_IDENTITY() INSIDE its own scope,
-- where it correctly sees the INSERT it just performed, then assigns
-- it to an OUTPUT parameter bound back to the outer batch:
SET @sql = N'INSERT INTO DynTest (Val) VALUES (@val);
             SET @outId = SCOPE_IDENTITY();';
SET @paramDefs = N'@val VARCHAR(50), @outId INT OUTPUT';

EXEC sp_executesql @sql, @paramDefs, @val = 'world', @outId = @newId OUTPUT;

SELECT @newId AS CorrectlyCapturedIdentity;   -- the real new ID, reliably`,
    },
    {
      label: 'Fix 2 — OUTPUT INTO directly on the dynamic INSERT',
      language: 'sql',
      code: `DECLARE @sql NVARCHAR(300);
DECLARE @Ids TABLE (NewID INT);

SET @sql = N'INSERT INTO DynTest (Val)
             OUTPUT inserted.ID
             VALUES (''another value'')';

INSERT INTO @Ids
EXEC sp_executesql @sql;

SELECT NewID FROM @Ids;   -- captured directly, no SCOPE_IDENTITY() involved at all
-- OUTPUT INTO works regardless of scope, since it captures the
-- inserted row's values directly from the INSERT statement itself.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A stored procedure builds a dynamic INSERT statement (to support inserting into one of several similarly-shaped tables chosen at runtime), then calls <code>SELECT SCOPE_IDENTITY()</code> immediately after <code>EXEC sp_executesql</code> to return the new row\'s ID to the caller. In testing, this appears to work — but occasionally, in production, callers report receiving a NULL or unexpected ID. Using the mechanics above, explain the actual cause and the most robust fix.',
    hint: 'Think about what SCOPE_IDENTITY() in the outer batch would return if something ELSE (even something unrelated) inserted a row into an IDENTITY table between the sp_executesql call and the SELECT SCOPE_IDENTITY() check — versus what it returns from the dynamic INSERT itself.',
    solution: `SCOPE_IDENTITY() called in the outer batch, right after sp_executesql
returns, does not see the identity value generated by the dynamic
INSERT at all — the dynamic batch is its own separate scope. In
testing, this can APPEAR to work only by coincidence: if SCOPE_IDENTITY()
happens to still hold a value from some OTHER insert that ran earlier
in the SAME outer scope (before the sp_executesql call), the procedure
returns that stale value instead of NULL, making the bug look like it
"usually works" while actually being wrong in a way that's hard to
notice. In production, if no such prior insert exists in that scope,
SCOPE_IDENTITY() correctly returns NULL, and callers receive a
missing ID.

The most robust fix is Fix 2 from the code tabs above — OUTPUT INTO
directly on the dynamic INSERT statement, capturing the new row's ID
into a table variable via the EXEC sp_executesql call's own result
set. This bypasses SCOPE_IDENTITY() and its scope-tracking behavior
entirely, working correctly and deterministically regardless of what
else has or hasn't inserted rows earlier in the outer batch.`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'SCOPE_IDENTITY() called anywhere within the same stored procedure will correctly return the last identity value inserted by that procedure, including inserts performed via dynamic SQL.',
      reality: 'a dynamic SQL batch executed via sp_executesql runs in its OWN scope, separate from the calling batch — SCOPE_IDENTITY() called in the outer scope after sp_executesql returns does not see identity values generated inside the dynamic batch.',
    },
    {
      thought: 'if SCOPE_IDENTITY() after a dynamic INSERT appears to return a plausible-looking, non-NULL integer during testing, the code is working correctly.',
      reality: 'a non-NULL value could be a stale leftover from an entirely different, earlier insert in the same outer scope — the only way to be certain SCOPE_IDENTITY() is returning the value from the SPECIFIC dynamic INSERT is to test it in isolation with no other identity-generating statements nearby, or better, to avoid the ambiguity by using OUTPUT INTO instead.',
    },
    {
      thought: '@@IDENTITY is a safe substitute for SCOPE_IDENTITY() specifically in the dynamic-SQL-scoping scenario, since it is session-wide rather than scope-limited.',
      reality: '@@IDENTITY does see identities generated by dynamic SQL, but it also picks up identity values generated by ANY trigger that fired as a side effect — the same well-known unsafety the main page\'s own Q&A on SCOPE_IDENTITY() already warns against, regardless of the dynamic-SQL scoping issue specifically.',
    },
  ];
}
