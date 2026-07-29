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
  templateUrl: './ledger-example-fee-mismatch.html',
  styleUrl: './ledger-example-fee-mismatch.scss'
})
export class LedgerExampleFeeMismatchSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'Two worked examples for the same $100 payment, two different splits',
      points: [
        'The main page\'s Theory section originally stated: "user pays $100 → Debit: user_wallet -$100, Credit: merchant_wallet +$100, Credit: platform_fee +$0." Its own "Double-Entry Ledger" code sample, for the SAME $100 payment scenario, shows: merchant +$97, platform +$3. The page has been corrected so both sections agree on the 97/3 split.',
        'This is catchable purely by comparing the page\'s own two worked examples — no accounting expertise needed, just noticing "$100 to merchant" and "$97 to merchant" can\'t both describe the same transaction.',
      ]
    },
    {
      heading: 'The original $0 entry also contradicted the page\'s own schema constraint',
      points: [
        'The original theory example listed a "$0" platform_fee credit entry as one of the transaction\'s ledger rows. The SAME page\'s "Double-Entry Ledger" code sample defines the ledger table with CONSTRAINT no_zero_amount CHECK (amount != 0) — a database-level rule that explicitly REJECTS any ledger entry with a zero amount.',
        'A $0 entry isn\'t just an unusual choice for illustrating "no fee" — per the page\'s own schema, it would fail to insert at all. The correct way to represent "no platform fee" in this system is to simply OMIT the platform_fee entry entirely (two entries: debit user, credit merchant — summing to zero), not to insert a zero-amount row.',
      ]
    },
    {
      heading: 'Why consistent worked examples matter in a reference document',
      points: [
        'A reader building a mental model from this page will naturally treat the Theory section\'s prose example and the Code Examples\' SQL sample as describing the SAME system — when they disagree on a concrete number (like a fee split), it\'s unclear which one reflects the actual intended design.',
        'The corrected version keeps a single, consistent 97/3 split used everywhere the page shows a concrete $100 example: in the theory prose, the SQL code sample, and (already, unchanged) the Idempotent Payment code sample\'s own \'amount * 0.97\' / \'amount * 0.03\' calculation.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'A zero-amount entry vs. simply omitting it',
      language: 'bash',
      code: `-- The ledger's own schema rejects a $0 entry:
CREATE TABLE ledger (
  ...
  amount NUMERIC(19,4) NOT NULL,
  CONSTRAINT no_zero_amount CHECK (amount != 0)
);

-- WRONG: trying to record "$0 platform fee" as an explicit entry
INSERT INTO ledger (account_id, amount, type, reference_id)
VALUES ('platform', 0.00, 'credit', 'ch_abc');
-- Fails: violates constraint "no_zero_amount"

-- RIGHT: when there's genuinely no fee, omit the platform entry
-- entirely -- two balanced entries are enough:
INSERT INTO ledger (account_id, amount, type, reference_id) VALUES
  ('user-123',    -100.00, 'debit',  'ch_abc'),  -- user pays $100
  ('merchant-1',  +100.00, 'credit', 'ch_abc');   -- merchant gets it all
-- Sums to 0 -- balanced -- with NO zero-amount row needed.

-- With a 3% platform fee (the page's actual worked example):
INSERT INTO ledger (account_id, amount, type, reference_id) VALUES
  ('user-123',    -100.00, 'debit',  'ch_abc'),
  ('merchant-1',   +97.00, 'credit', 'ch_abc'),
  ('platform',      +3.00, 'credit', 'ch_abc');
-- Sums to 0 -- all three entries have non-zero amounts.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A page\'s theory prose describes a $100 payment as "Debit: user -$100, Credit: merchant +$100, Credit: platform_fee +$0" -- three ledger entries. The same page\'s ledger schema has CONSTRAINT no_zero_amount CHECK (amount != 0). What is wrong with the worked example, and how should a genuinely fee-free payment be represented instead?',
    hint: 'If the database itself would reject an entry with amount = 0, can that entry ever actually exist in this system\'s ledger?',
    solution: 'The $0 platform_fee entry as described could never actually be inserted -- the ledger\'s own no_zero_amount CHECK constraint rejects any entry with amount = 0. A genuinely fee-free $100 payment should be represented with just TWO entries: debit user_wallet -$100, credit merchant_wallet +$100 -- the platform_fee entry is simply omitted rather than inserted as a zero-amount row. (The corrected version of this page\'s worked example switched to an explicit 3% fee scenario --97/3 split -- to match the concrete numbers already used elsewhere on the same page, so every entry shown has a genuinely non-zero amount.)'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'To represent "no fee was charged" in a double-entry ledger, the clearest approach is an explicit $0 entry for the fee account, showing exactly what happened.',
      reality: 'Per this subtopic\'s theory, a $0 entry is not just unclear — this page\'s own schema explicitly REJECTS zero-amount entries via a CHECK constraint. The correct representation of "no fee" is omitting that account\'s entry entirely, not inserting a zero-value row.'
    },
    {
      thought: 'When a reference document\'s prose description and its code sample disagree on a specific number, the code sample is always the more authoritative source since it\'s more concrete.',
      reality: 'Per this subtopic\'s theory, neither is automatically more authoritative — what matters is that BOTH describe the same underlying system consistently; here, the fix made the theory prose match the code sample\'s numbers, but the important lesson is checking for the disagreement itself, not assuming one side is always right.'
    },
    {
      thought: 'A double-entry ledger only requires that debits and credits sum to zero — any specific split of who gets how much is just an illustrative detail, not worth verifying for consistency.',
      reality: 'Per this subtopic\'s theory, both the SPECIFIC split (97/3, not 100/0) and the SUM-TO-ZERO invariant matter — a reader forms a mental model from the concrete numbers shown, and inconsistent numbers across a page\'s own examples undermine that model even when the invariant technically still holds in each individual example.'
    }
  ];
}
