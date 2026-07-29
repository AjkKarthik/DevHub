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
  templateUrl: './mysql-innodb-auto-creates-the-fk-index-it-doesnt-just-warn.html',
  styleUrl: './mysql-innodb-auto-creates-the-fk-index-it-doesnt-just-warn.scss'
})
export class MysqlInnodbAutoCreatesTheFkIndexItDoesntJustWarnSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'A "warns" claim that understated what MySQL InnoDB actually does',
      points: [
        'The main page\'s "Missing index on foreign key columns" mistake explanation originally said "MySQL warns about this; PostgreSQL does not." Checking MySQL\'s own documented FOREIGN KEY constraint behavior shows this understates what actually happens — MySQL does not just emit a warning, it takes action. The page has been corrected.',
        'This is worth knowing specifically because "warns" and "auto-creates" have very different practical consequences for a team relying on the database to catch this mistake — one requires a human to notice and act on a message; the other fixes the problem without anyone needing to do anything.',
      ]
    },
    {
      heading: 'What InnoDB actually does when you add a foreign key',
      points: [
        'When a FOREIGN KEY constraint is created on an InnoDB table, MySQL requires an index on the referencing (child-side) column(s) to enforce the constraint efficiently — and if no suitable index already exists, InnoDB automatically CREATES one, with no warning needed and no action required from the person creating the constraint.',
        'A related, less obvious behavior: if you later add a DIFFERENT index that can also serve the foreign key constraint\'s needs, MySQL can silently DROP the automatically-created index it no longer needs — worth knowing so an index that "disappeared" is not mistaken for a bug.',
        'PostgreSQL\'s behavior is the genuine contrast here: it does NEITHER of MySQL\'s behaviors — it neither warns nor auto-creates an index for a foreign key column, making the "create FK indexes manually" advice specifically a PostgreSQL-relevant instruction, not a general SQL database instruction.',
      ]
    },
    {
      heading: 'Why the distinction matters for a team standardizing across both databases',
      points: [
        'A team that has only ever worked with MySQL and assumes "the database handles FK indexing for me" will be surprised the first time they work on a PostgreSQL system — the exact scenario the main page\'s mistake block is warning about is a genuine, common trap specifically FOR TEAMS COMING FROM MYSQL, not a universal SQL gotcha.',
        'Conversely, a team standardizing migration tooling or schema-review checklists across both databases should not assume the same "add an index whenever you add a FK" checklist item is equally necessary on both — on MySQL it is closer to a safety net (already handled automatically in the common case); on PostgreSQL it is a genuinely required, easy-to-forget manual step.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'MySQL InnoDB vs. PostgreSQL — same statement, different outcome',
      language: 'bash',
      code: `-- The SAME conceptual statement on two different databases

-- MySQL (InnoDB): adding a FK with no existing index on the
-- child column -- InnoDB auto-creates the index automatically
ALTER TABLE orders
  ADD CONSTRAINT fk_orders_user
  FOREIGN KEY (user_id) REFERENCES users(id);
-- Check: SHOW INDEX FROM orders;
-- An index on user_id now exists, created automatically --
-- no separate CREATE INDEX statement was needed.

-- PostgreSQL: the equivalent statement creates ONLY the
-- constraint -- no index is created automatically
ALTER TABLE orders
  ADD CONSTRAINT fk_orders_user
  FOREIGN KEY (user_id) REFERENCES users(id);
-- Check: \\d orders  (or query pg_indexes)
-- No index on user_id exists yet -- every JOIN on this FK
-- will sequentially scan the child table until one is added:
CREATE INDEX idx_orders_user_id ON orders (user_id);`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A team migrates a schema from MySQL to PostgreSQL, copying over every table and foreign key constraint but not explicitly reviewing indexes (since "the FKs already worked fine on MySQL"). What is likely to happen to JOIN performance on the new PostgreSQL database, and why?',
    hint: 'On MySQL, was an index present on each FK column because someone explicitly created it, or because InnoDB handled it automatically?',
    solution: 'JOIN performance on the FK relationships is likely to degrade significantly on PostgreSQL. On MySQL, the indexes that made those JOINs efficient were most likely created AUTOMATICALLY by InnoDB when each foreign key constraint was added — not because anyone explicitly wrote a CREATE INDEX statement for them. A straight schema-and-constraint migration to PostgreSQL copies the FOREIGN KEY constraints themselves, but PostgreSQL does not replicate MySQL\'s auto-indexing behavior — it neither warns nor creates an index automatically. Without an explicit audit adding CREATE INDEX statements for every FK column, those JOINs will fall back to sequential scans on the child table, a real and easy-to-miss performance regression specifically caused by assuming behavior that was implicit on the source database transfers to the target database.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'MySQL "warns" when a foreign key column has no index, the same way PostgreSQL might log a hint — a human still has to act on it.',
      reality: 'Per this subtopic\'s theory, MySQL InnoDB does not just warn — it automatically CREATES an index on the FK column if none exists, requiring no action at all from the person adding the constraint.'
    },
    {
      thought: 'Since MySQL handles FK indexing automatically, "always index your foreign key columns" is a general best practice that applies equally regardless of which database is in use.',
      reality: 'Per this subtopic\'s theory, the ADVICE to index FK columns is universally good, but WHETHER you need to take manual action to follow it differs — MySQL/InnoDB already does it for you in the common case; PostgreSQL genuinely requires the manual step.'
    },
    {
      thought: 'An index that "disappears" from a MySQL FK column after a schema change is likely a bug or data loss.',
      reality: 'Per this subtopic\'s theory, MySQL can silently DROP an auto-created FK index if a different index is later added that can also satisfy the constraint\'s needs — an expected behavior, not a bug, worth recognizing before assuming something went wrong.'
    }
  ];
}
