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
  templateUrl: './postgresqls-synchronous-standby-names-needs-a-quoted-name.html',
  styleUrl: './postgresqls-synchronous-standby-names-needs-a-quoted-name.scss'
})
export class PostgresqlsSynchronousStandbyNamesNeedsAQuotedNameSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'A settings example that contradicted the page\'s own later, correct example',
      points: [
        'The main page\'s "Synchronous vs asynchronous replication" theory bullet originally read: "PostgreSQL: synchronous_standby_names = 1 makes one replica synchronous." Further down the SAME page, the "Using async replication for financial data" mistake block shows the correct form: synchronous_standby_names = \'replica1\'. The two disagree with each other, and the "= 1" form is not valid syntax for this setting at all. The theory bullet has been corrected.',
        'This is a case worth flagging specifically because it did not need any external research to CATCH — comparing the page\'s own two mentions of the identical setting was enough to spot the contradiction. Confirming the FIX still required checking PostgreSQL\'s actual documented syntax.',
      ]
    },
    {
      heading: 'What synchronous_standby_names actually expects',
      points: [
        'Per PostgreSQL\'s own documentation, synchronous_standby_names takes either a single QUOTED standby application name (e.g. \'replica1\'), a comma-separated list, or one of two special forms for coordinating multiple standbys: FIRST num (name1, name2, ...) — the first num standbys in priority order must ACK — or ANY num (name1, name2, ...) — any num of the named standbys must ACK (a quorum-style commit).',
        'A bare number with no quotes and no FIRST/ANY keyword, like the page\'s original "= 1", is not a form this setting recognizes at all — it does not mean "one replica," it is simply invalid configuration.',
        'Standby names containing special characters (like a hyphen in a hostname) need DOUBLE quotes specifically, per PostgreSQL\'s own identifier-quoting rules — a further precision point beyond just "use quotes."',
      ]
    },
    {
      heading: 'Why getting this exactly right matters more than a typical config typo',
      points: [
        'This setting directly controls the RPO=0 guarantee the same page\'s "financial data" mistake block is arguing for — a misconfigured or invalid synchronous_standby_names value means PostgreSQL falls back to fully asynchronous replication (or refuses to start, depending on the exact mistake), silently undermining the exact durability guarantee the setting exists to provide.',
        'Because the failure mode here (an invalid setting silently degrading to weaker durability, or blocking commits unexpectedly) is not always loud, a copy-pasted incorrect example is a genuinely risky thing to carry into a real financial-data configuration — worth getting precisely right, not just approximately right.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Correct synchronous_standby_names forms',
      language: 'bash',
      code: `# WRONG -- not valid syntax, does not mean "one replica"
# synchronous_standby_names = 1

# Correct: a single quoted standby application name
synchronous_standby_names = 'replica1'

# Correct: FIRST num (...) -- priority-ordered, first N must ACK
synchronous_standby_names = 'FIRST 1 (replica1, replica2)'

# Correct: ANY num (...) -- quorum-style, any N of the named
# standbys must ACK (not necessarily the same N every time)
synchronous_standby_names = 'ANY 2 (replica1, replica2, replica3)'

# Standby names with special characters need DOUBLE-quoting
# inside the setting's own string value, e.g. a hyphenated host:
synchronous_standby_names = '"postgres-replica-01"'

# Check which standbys are currently synchronous:
SELECT application_name, sync_state FROM pg_stat_replication;
# sync_state: 'sync' | 'potential' | 'async'`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A teammate configures synchronous_standby_names = 2 on a PostgreSQL primary, intending "require 2 replicas to acknowledge before commit." What actually happens, and what is the correct setting for that intent?',
    hint: 'Does synchronous_standby_names ever accept a bare, unquoted number on its own — and if a specific COUNT is what you want, which keyword expresses that?',
    solution: 'synchronous_standby_names = 2 is not valid syntax — the setting expects a quoted standby name, a comma-separated list of names, or the FIRST/ANY keyword forms; a bare number on its own is not one of those. To require any 2 of a set of replicas to acknowledge before commit (a quorum-style requirement), the correct setting is synchronous_standby_names = \'ANY 2 (replica1, replica2, replica3)\' — naming the actual standby application names and using the ANY keyword with the desired count. Using FIRST 2 (...) instead would require acknowledgment specifically from the first 2 replicas in PRIORITY order, not any 2 — a related but different guarantee, worth choosing deliberately based on whether specific replicas or just a count is what matters.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'PostgreSQL\'s synchronous_standby_names accepts a bare number to mean "this many replicas must be synchronous," similar to how Cassandra\'s CONSISTENCY QUORUM works.',
      reality: 'Per this subtopic\'s theory, a bare number is not valid syntax for this setting at all. A specific count requires the ANY keyword with named standbys, e.g. \'ANY 2 (replica1, replica2, replica3)\' — the count and the standby names are both required together.'
    },
    {
      thought: 'FIRST num (...) and ANY num (...) mean the same thing — both just require some number of replicas to acknowledge.',
      reality: 'Per this subtopic\'s theory, FIRST requires acknowledgment specifically from the highest-PRIORITY replicas in the listed order, while ANY accepts acknowledgment from any of the named replicas regardless of order — genuinely different guarantees for genuinely different failover-priority intentions.'
    },
    {
      thought: 'An invalid synchronous_standby_names value is always caught loudly (a startup error) rather than silently degrading durability.',
      reality: 'Per this subtopic\'s theory, the exact failure mode of a misconfigured value depends on the specific mistake — some invalid forms silently fall back to weaker (asynchronous) behavior rather than failing loudly, which is precisely why a copy-pasted incorrect example is risky for a setting whose entire purpose is a durability guarantee.'
    }
  ];
}
