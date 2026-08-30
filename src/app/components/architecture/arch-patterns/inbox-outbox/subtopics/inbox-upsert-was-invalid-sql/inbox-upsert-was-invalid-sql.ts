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
  templateUrl: './inbox-upsert-was-invalid-sql.html',
  styleUrl: './inbox-upsert-was-invalid-sql.scss'
})
export class InboxUpsertWasInvalidSqlSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'A conflict clause with no conflict target',
      points: [
        'The "Inbox Pattern (Consumer)" codeTab\'s loyalty-points upsert originally read: <code>INSERT INTO loyalty_points (customer_id, points) VALUES ($1, $2) ON CONFLICT DO UPDATE ...</code>. PostgreSQL\'s <code>ON CONFLICT</code> clause syntax requires a conflict target — the specific column or constraint the conflict is detected against — before <code>DO UPDATE</code>. <code>ON CONFLICT DO UPDATE</code> with no target at all is not valid PostgreSQL syntax.',
        'This is a genuinely different category of issue from the trailing <code>...</code> elsewhere in illustrative code samples on this hub (which usually signal deliberately-omitted, non-essential detail) — here, the missing piece (the conflict target) is REQUIRED syntax, not an optional elaboration, so the statement as written would fail with a syntax error if actually run.',
        'The fix names the actual conflict target — <code>customer_id</code>, since that\'s the column the upsert is meant to be unique on — and completes the <code>SET</code> clause: <code>ON CONFLICT (customer_id) DO UPDATE SET points = loyalty_points.points + EXCLUDED.points</code>, correctly ADDING the new points to whatever total already exists rather than overwriting it.',
      ]
    },
    {
      heading: 'Why the SET clause needed to say "add", not just "replace"',
      points: [
        'A naive fix might have written <code>SET points = EXCLUDED.points</code> — this compiles and runs, but it\'s semantically wrong for a running loyalty-points TOTAL: it would REPLACE the customer\'s existing point balance with just this one order\'s points, discarding every point they\'d already accumulated from previous orders.',
        'The correct upsert accumulates: <code>SET points = loyalty_points.points + EXCLUDED.points</code> — referencing the EXISTING row\'s current value (<code>loyalty_points.points</code>) plus the newly-inserted row\'s value (<code>EXCLUDED.points</code>, PostgreSQL\'s name for "the row that would have been inserted"). This distinction — overwrite vs. accumulate — is exactly the kind of detail a placeholder <code>...</code> in example code silently skips past, which is part of why it\'s worth spelling out explicitly here.',
        'This connects to the page\'s own Inbox theory: the whole point of checking the inbox table first is to prevent this exact upsert from running twice for the SAME event — but getting the upsert\'s OWN logic right (accumulate vs. overwrite) is a separate, additional correctness requirement the inbox check alone doesn\'t cover.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Three versions: invalid, valid-but-wrong, and correct',
      language: 'typescript',
      code: `// INVALID -- no conflict target at all; PostgreSQL rejects this as a
// syntax error before it ever runs
const invalidSql =
  'INSERT INTO loyalty_points (customer_id, points) VALUES ($1, $2) ' +
  'ON CONFLICT DO UPDATE ...';

// VALID SQL, WRONG BEHAVIOR -- compiles and runs, but overwrites the
// customer's entire point balance with just this one order's points
const validButWrongSql =
  'INSERT INTO loyalty_points (customer_id, points) VALUES ($1, $2) ' +
  'ON CONFLICT (customer_id) DO UPDATE SET points = EXCLUDED.points';

// CORRECT -- names the conflict target AND accumulates onto the
// existing balance instead of replacing it
const correctSql =
  'INSERT INTO loyalty_points (customer_id, points) VALUES ($1, $2) ' +
  'ON CONFLICT (customer_id) DO UPDATE SET points = loyalty_points.points + EXCLUDED.points';

// Concretely, for a customer with 500 existing points placing an order
// worth 50 new points:
//   invalidSql:        syntax error, never executes
//   validButWrongSql:  ends up with 50 points  (500 lost!)
//   correctSql:        ends up with 550 points (correct)`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A teammate fixes the syntax error by writing ON CONFLICT (customer_id) DO UPDATE SET points = EXCLUDED.points and confirms it runs without error. They consider the bug fixed. A customer with 800 existing loyalty points places a $50 order (50 points). What is their new point balance after this "fixed" query runs, and is that correct?',
    hint: 'EXCLUDED.points refers only to the value from THIS insert attempt -- does the SET clause reference the row\'s EXISTING points anywhere?',
    solution: 'The customer\'s balance becomes 50 points, not 850. This version compiles and runs without a syntax error -- which is why a teammate testing only "does it run" might consider it fixed -- but SET points = EXCLUDED.points overwrites the existing balance entirely with just this order\'s 50 points, discarding the 800 points already accumulated. The syntax being valid says nothing about whether the resulting behavior is correct. The actually-correct version needs SET points = loyalty_points.points + EXCLUDED.points, which adds the new points to whatever balance the row already had instead of replacing it.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'ON CONFLICT DO UPDATE without specifying which column the conflict is detected on is valid, slightly informal SQL shorthand.',
      reality: 'Per this subtopic\'s theory, a conflict target isn\'t an optional stylistic choice — it\'s required syntax that PostgreSQL needs to know WHICH constraint defines "conflict" in the first place; omitting it is a genuine syntax error, not shorthand.'
    },
    {
      thought: 'Once an upsert query runs without throwing an error, its logic can be trusted to be correct.',
      reality: 'Per this subtopic\'s theory, a query can be syntactically valid and run successfully while still being semantically wrong — SET points = EXCLUDED.points runs fine but silently discards a customer\'s entire existing point balance every time.'
    },
    {
      thought: 'The Inbox pattern\'s duplicate-detection check makes the upsert\'s own internal logic (overwrite vs. accumulate) a minor detail, since duplicates are already prevented.',
      reality: 'Per this subtopic\'s theory, these are two separate correctness requirements — the inbox check prevents the SAME event from being processed twice, but a wrong upsert (overwriting instead of accumulating) is wrong on the very FIRST, legitimate, non-duplicate processing of each new event.'
    }
  ];
}
